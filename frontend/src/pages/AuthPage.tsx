import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { WepinLogoImageIcon, WalletImageIcon } from "@/components/AppIcons";
import { initWepin, loginWithWepin, getWepinAccounts } from "@/services/wepin";
import { getUserProfile, createOrUpdateUser } from "@/services/backend";
import { getOrCreateWalletForUser } from "@/services/wallet";

type AuthStatus = "idle" | "connecting" | "success" | "error";

export default function AuthPage() {
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // Check if we have a pending auth request from the extension
    const urlParams = new URLSearchParams(window.location.search);
    const authType = urlParams.get("type"); // 'wepin' or 'verychat'
    const extensionId = urlParams.get("extensionId");

    if (authType && extensionId) {
      // Store for later use
      sessionStorage.setItem("pendingAuthType", authType);
      sessionStorage.setItem("pendingExtensionId", extensionId);
    }
  }, []);

  const handleWepinConnect = async () => {
    setStatus("connecting");
    setErrorMessage("");

    try {
      // Initialize Wepin SDK
      const initialized = await initWepin();
      if (!initialized) {
        throw new Error("Failed to initialize wallet");
      }

      // Login with Wepin
      const wepinUser = await loginWithWepin();
      if (wepinUser?.status !== "success" || !wepinUser.userInfo) {
        throw new Error("Authentication failed");
      }

      // Get wallet accounts
      const accounts = await getWepinAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error("No wallet accounts found");
      }

      const walletAddress = accounts[0].address;
      const userId = wepinUser.userInfo.userId;

      // Create/update user in backend
      let backendUser;
      try {
        backendUser = await getUserProfile("wepin", userId);
      } catch {
        // User doesn't exist, create new one
        backendUser = await createOrUpdateUser({
          authId: userId,
          authMethod: "wepin",
          profileName: wepinUser.userInfo.email || "Unknown User",
          email: wepinUser.userInfo.email,
          walletAddress: walletAddress,
        });
        backendUser = backendUser.user;
      }

      // Create/get local wallet (for extension sync)
      const localWallet = getOrCreateWalletForUser(userId);

      // Store session data for extension to pickup
      const sessionData = {
        isConnected: true,
        authMethod: "wepin" as const,
        currentAccount: accounts[0] || null,
        accounts: accounts,
        wepinUser: wepinUser,
        backendUser: backendUser,
        wallet: localWallet.wallet,
        timestamp: Date.now(),
      };

      // CRITICAL: Send to extension via postMessage
      // Content script will catch this and save to chrome.storage.local
      window.postMessage(
        {
          type: "SESSION_SYNC",
          source: "veterex-web",
          authMethod: "wepin", // ONLY Wepin, not VeryChat
          data: sessionData,
        },
        "*"
      );

      console.log("[AuthPage] Wepin session sent to extension via postMessage");

      setStatus("success");
      setSuccessMessage(
        "Wallet connected successfully! Extension will update shortly..."
      );

      // Wait for extension to acknowledge receipt, then close
      // Listen for acknowledgment from extension
      const ackTimeout = setTimeout(() => {
        console.log("[AuthPage] Extension sync timeout, closing anyway");
        window.close();
      }, 5000);

      const handleAck = (event: MessageEvent) => {
        if (
          event.data &&
          event.data.type === "SESSION_SYNC_ACK" &&
          event.data.source === "veterex-extension"
        ) {
          console.log("[AuthPage] Extension acknowledged session sync");
          clearTimeout(ackTimeout);
          window.removeEventListener("message", handleAck);
          // Give UI a moment to show success, then close
          setTimeout(() => {
            window.close();
          }, 1500);
        }
      };

      window.addEventListener("message", handleAck);
    } catch (error) {
      console.error("Wepin auth error:", error);
      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to connect wallet. Please try again."
      );

      // Close window after 3 seconds even on error
      setTimeout(() => {
        window.close();
      }, 3000);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0f0f1e] via-[#1a1a2e] to-[#16213e] flex items-center justify-center p-4"
      style={{ fontFamily: "Outfit, system-ui, sans-serif" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-2xl p-8 shadow-2xl">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <WepinLogoImageIcon size={120} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Connect Wallet
            </h1>
            <p className="text-gray-400 text-sm">
              Connecting wallet for VeTerex Extension
            </p>
          </div>

          {/* Status Messages */}
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <p className="text-center text-gray-300 text-sm mb-6">
                  Click below to connect your Wepin wallet. Your session will be
                  securely shared with the extension.
                </p>
                <button
                  onClick={handleWepinConnect}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-coral text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <WalletImageIcon size={20} inverted={false} />
                  Connect Wallet
                </button>
              </motion.div>
            )}

            {status === "connecting" && (
              <motion.div
                key="connecting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center py-8"
              >
                <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                <p className="text-white font-medium mb-2">
                  Connecting wallet...
                </p>
                <p className="text-gray-400 text-sm">
                  Please complete the authentication in the popup
                </p>
              </motion.div>
            )}

            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                </motion.div>
                <p className="text-white font-semibold text-lg mb-2">
                  {successMessage}
                </p>
                <p className="text-gray-400 text-sm">
                  This window will close automatically...
                </p>
              </motion.div>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="text-center py-8"
              >
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-white font-semibold text-lg mb-2">
                  Connection Failed
                </p>
                <p className="text-red-400 text-sm mb-4">{errorMessage}</p>
                <p className="text-gray-400 text-sm">
                  This window will close automatically...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-purple-500/20">
            <p className="text-center text-gray-500 text-xs">
              🔒 Your wallet is secured with industry-standard encryption
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
