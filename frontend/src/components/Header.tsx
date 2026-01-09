import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronDown, LogOut, Copy, Check, BookOpen } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  initWepin,
  loginWithWepin,
  logoutWepin,
  getWepinAccounts,
  getWepinStatus,
  getLoginSession,
} from "@/services/wepin";
import { logout as logoutVeryChat } from "@/services/verychat";
import { getOrCreateWalletForUser } from "@/services/wallet";
import { createOrUpdateUser, getUserProfile } from "@/services/backend";
import { VeryChatLoginModal } from "./VeryChatLoginModal";
import { AuthChoiceModal } from "./AuthChoiceModal";
import { WalletBackupModal } from "./WalletBackupModal";
import { WalletImportModal } from "./WalletImportModal";
import { LogoIcon, WalletImageIcon } from "./AppIcons";

// Documentation URL
const DOCS_URL = "https://veterex.gitbook.io/veterex-docs/";

// Web app URL for extension auth redirect
// Production URL for VeTerex web app
const WEB_APP_URL = "https://veterex.vercel.app";

// Check if running as Chrome extension
const isExtension =
  typeof chrome !== "undefined" &&
  chrome.runtime &&
  chrome.runtime.id &&
  window.location.protocol === "chrome-extension:";

export function Header() {
  const {
    isConnected,
    isLoading,
    isConnecting,
    authMethod,
    currentAccount,
    verychatUser,
    backendUser,
    setConnected,
    setLoading,
    setConnecting,
    setAuthMethod,
    setWepinUser,
    setVeryChatUser,
    setBackendUser,
    setAccounts,
    setCurrentAccount,
    addToast,
    logout,
  } = useAppStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [showVeryChatModal, setShowVeryChatModal] = useState(false);
  const [showAuthChoiceModal, setShowAuthChoiceModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newWalletData, setNewWalletData] = useState<{
    address: string;
    recoveryPhrase: string;
  } | null>(null);
  const [pendingImportUserId, setPendingImportUserId] = useState<string | null>(
    null
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Ref for dropdown click outside detection
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Check if click is outside both the dropdown and the button that toggles it
      const isOutsideDropdown =
        dropdownRef.current && !dropdownRef.current.contains(target);
      const isOutsideButton =
        dropdownButtonRef.current &&
        !dropdownButtonRef.current.contains(target);

      if (isOutsideDropdown && isOutsideButton) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      // Add listener immediately on capture phase for better detection
      document.addEventListener("mousedown", handleClickOutside, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [showDropdown]);

  // Wepin auth flow initiated from extension
  const handleWepinAuthForExtension = useCallback(
    async (extensionId: string) => {
      setLoading(true);
      try {
        const initialized = await initWepin();
        if (!initialized) {
          addToast({
            type: "error",
            message: "Failed to initialize wallet. Please try again.",
          });
          return;
        }

        // Check if user is already logged in on web
        const status = await getWepinStatus();
        console.log("[VeTerex] Wepin status:", status);

        let user = null;
        let accounts: Awaited<ReturnType<typeof getWepinAccounts>> = [];

        if (status === "login") {
          // User is already logged in, get existing session
          console.log(
            "[VeTerex] User already logged in, using existing session"
          );
          user = await getLoginSession();
          accounts = await getWepinAccounts();

          addToast({
            type: "info",
            message: "Using existing Wepin session...",
          });
        } else {
          // User not logged in, need to login
          user = await loginWithWepin();
          if (user?.status === "success") {
            accounts = await getWepinAccounts();
          }
        }

        if (
          (user?.status === "success" || status === "login") &&
          accounts.length > 0
        ) {
          // Show connecting state while setting up
          setConnecting(true);

          setWepinUser(user);
          setAuthMethod("wepin");
          setAccounts(accounts);

          if (accounts.length > 0) {
            setCurrentAccount(accounts[0]);
          }

          setConnected(true);
          setConnecting(false);

          // Send session to extension with full accounts data
          const sessionData = {
            isConnected: true,
            authMethod: "wepin" as const,
            currentAccount:
              accounts.length > 0
                ? {
                    address: accounts[0].address,
                    network: accounts[0].network,
                    symbol: accounts[0].symbol,
                    label: accounts[0].label,
                    name: accounts[0].name,
                  }
                : null,
            accounts: accounts, // Include full accounts array
            wepinUser: user,
            timestamp: Date.now(),
          };

          console.log(
            "[VeTerex] Sending session to extension via postMessage:",
            sessionData
          );

          // Send message to extension content script via postMessage
          // The content script will relay this to chrome.storage and background
          window.postMessage(
            {
              type: "SESSION_SYNC",
              source: "veterex-web",
              data: sessionData,
            },
            "*"
          );

          // Also try direct chrome.runtime.sendMessage if externally_connectable works
          if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
            try {
              chrome.runtime.sendMessage(
                extensionId,
                {
                  type: "SESSION_SYNC",
                  source: "veterex-web",
                  data: sessionData,
                },
                (response) => {
                  if (chrome.runtime.lastError) {
                    console.log(
                      "[VeTerex] Direct message failed (expected):",
                      chrome.runtime.lastError.message
                    );
                  } else if (response?.success) {
                    console.log(
                      "[VeTerex] Session synced to extension directly"
                    );
                  }
                }
              );
            } catch (e) {
              console.log(
                "[VeTerex] chrome.runtime.sendMessage not available:",
                e
              );
            }
          }

          // Listen for acknowledgment from content script
          const ackHandler = (event: MessageEvent) => {
            if (
              event.data?.type === "SESSION_SYNC_ACK" &&
              event.data?.source === "veterex-extension"
            ) {
              console.log("[VeTerex] Session sync acknowledged by extension");
              addToast({
                type: "success",
                message: "Wallet connected! You can close this tab.",
              });
              window.removeEventListener("message", ackHandler);
            }
          };
          window.addEventListener("message", ackHandler);

          // Remove listener after 5 seconds if no ack
          setTimeout(
            () => window.removeEventListener("message", ackHandler),
            5000
          );

          addToast({
            type: "success",
            message: "Wallet connected successfully!",
          });
        }
      } catch (error: unknown) {
        console.error("Wepin auth error:", error);
        setConnecting(false);
        addToast({
          type: "error",
          message: "Failed to connect wallet. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      addToast,
      setAccounts,
      setAuthMethod,
      setConnected,
      setConnecting,
      setCurrentAccount,
      setLoading,
      setWepinUser,
    ]
  );

  // Store extension ID for auth redirect flow
  const [pendingExtensionId, setPendingExtensionId] = useState<string | null>(
    null
  );

  // Handle Wepin auth callback from extension redirect
  useEffect(() => {
    const extensionAuth = searchParams.get("extension_auth");
    const extensionId = searchParams.get("extension_id");

    if (
      extensionAuth === "wepin" &&
      extensionId &&
      !isExtension &&
      !pendingExtensionId
    ) {
      console.log(
        "[VeTerex] Extension auth redirect detected, auto-triggering Wepin login"
      );
      // Store the extension ID for later use
      setPendingExtensionId(extensionId);
      // Clear the query params
      setSearchParams({});
      // Trigger Wepin login automatically
      handleWepinAuthForExtension(extensionId);
    }
  }, [
    searchParams,
    setSearchParams,
    handleWepinAuthForExtension,
    pendingExtensionId,
  ]);

  const handleConnect = async () => {
    // For both web and extension, show auth choice modal for dual login
    setShowAuthChoiceModal(true);
  };

  // Handle Wepin login directly (for web app when user selects Wepin from modal)
  const handleWepinLogin = async () => {
    setLoading(true);
    try {
      // Initialize Wepin SDK
      const initialized = await initWepin();

      if (!initialized) {
        addToast({
          type: "error",
          message: "Failed to initialize wallet. Please try again.",
        });
        setLoading(false);
        return;
      }

      // Login with Wepin Widget
      const user = await loginWithWepin();

      if (user?.status === "success") {
        // Show connecting state while setting up
        setConnecting(true);

        setWepinUser(user);
        setAuthMethod("wepin");

        // Get accounts
        const accounts = await getWepinAccounts();
        setAccounts(accounts);

        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
        }

        // Create or update user in backend database
        if (user.userInfo?.userId) {
          try {
            const backendUserData = await createOrUpdateUser({
              authId: user.userInfo.userId,
              authMethod: "wepin",
              profileName: user.userInfo.email?.split("@")[0] || "Wepin User",
              email: user.userInfo.email,
              walletAddress:
                accounts.length > 0 ? accounts[0].address : undefined,
            });
            setBackendUser(backendUserData.user);
            console.log(
              "[Wepin] Backend user created:",
              backendUserData.user.id
            );
          } catch (error) {
            console.error("[Wepin] Failed to create backend user:", error);
            // Continue even if backend fails
          }
        }

        setConnected(true);
        setConnecting(false);

        addToast({
          type: "success",
          message: "Wallet connected successfully!",
        });
      }
    } catch (error: unknown) {
      console.error("Connection error:", error);
      setConnecting(false);
      addToast({
        type: "error",
        message: "Failed to connect wallet. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle wallet import success
  const handleImportSuccess = async (address: string) => {
    if (!pendingImportUserId) {
      addToast({
        type: "error",
        message: "No user session found. Please log in first.",
      });
      return;
    }

    addToast({
      type: "success",
      message: `Wallet imported successfully! Address: ${address.slice(
        0,
        6
      )}...${address.slice(-4)}`,
      duration: 5000,
    });

    // The wallet is already imported, just need to update UI
    setCurrentAccount({
      address,
      network: "verychain",
      symbol: "VERY",
      label: "Verychain Wallet",
      name: "Verychain",
    });

    setPendingImportUserId(null);
  };

  const handleVeryChatSuccess = async (user: {
    profileId: string;
    profileName: string;
    profileImage?: string;
  }) => {
    // Show connecting state
    setConnecting(true);

    setVeryChatUser(user);
    setAuthMethod("verychat");

    // CRITICAL: Always ensure wallet exists locally first
    // This creates/loads the wallet with private key in encrypted local storage
    let localWallet;
    let isNewWallet = false;
    try {
      if (!user.profileId) {
        throw new Error("Profile ID is missing from VeryChat user data");
      }

      console.log("[VeryChat] Initializing wallet for user:", user.profileId);
      const result = getOrCreateWalletForUser(user.profileId);
      localWallet = result.wallet;
      isNewWallet = result.isNewWallet;
      console.log(
        "[VeryChat] Local wallet ensured:",
        localWallet.address,
        "isNew:",
        isNewWallet
      );

      // If this is a new wallet, prepare to show backup modal
      if (isNewWallet && localWallet.mnemonic) {
        setNewWalletData({
          address: localWallet.address,
          recoveryPhrase: localWallet.mnemonic,
        });
      }
    } catch (error) {
      console.error("[VeryChat] Failed to get/create local wallet:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("[VeryChat] Error details:", errorMessage);

      setConnecting(false);
      setLoading(false);
      addToast({
        type: "error",
        message: `Failed to initialize wallet: ${errorMessage}. Please try again or contact support.`,
        duration: 8000,
      });
      return;
    }

    // Now check if user exists in backend with a wallet
    let walletAddress = localWallet.address;
    let existingBackendUser = false;

    try {
      // Try to get existing user from backend
      const existingUser = await getUserProfile("verychat", user.profileId);
      if (existingUser) {
        existingBackendUser = true;
        console.log("[VeryChat] Found existing backend user");
        setBackendUser(existingUser);

        // If backend has wallets, use the first one's address for consistency
        // But keep the local wallet for private key access
        if (existingUser.wallets && existingUser.wallets.length > 0) {
          walletAddress = existingUser.wallets[0].walletAddress;
          console.log("[VeryChat] Using wallet from backend:", walletAddress);
        }
      }
    } catch {
      console.log(
        "[VeryChat] No existing backend user found, will create new one"
      );
    }

    // Set the wallet as current account
    setCurrentAccount({
      address: walletAddress,
      network: "verychain",
      symbol: "VERY",
      label: "Verychain Wallet",
      name: "Verychain",
    });

    // Create or update user in backend database if needed
    if (!existingBackendUser) {
      try {
        const backendUserData = await createOrUpdateUser({
          authId: user.profileId,
          authMethod: "verychat",
          profileName: user.profileName,
          profileImage: user.profileImage,
          walletAddress: walletAddress,
        });
        setBackendUser(backendUserData.user);
        console.log(
          "[VeryChat] Backend user created:",
          backendUserData.user.id
        );
      } catch (error) {
        console.error("[VeryChat] Failed to create backend user:", error);
        // Continue even if backend fails
      }
    }

    // Connection complete
    setConnected(true);
    setConnecting(false);

    // Show backup modal for new wallets
    if (isNewWallet && newWalletData) {
      setShowBackupModal(true);
    }

    addToast({
      type: "success",
      message: `Welcome, ${user.profileName}!`,
    });
  };

  const handleDisconnect = async () => {
    try {
      if (authMethod === "wepin") {
        await logoutWepin();
      } else if (authMethod === "verychat") {
        logoutVeryChat();
      }
      logout();
      setShowDropdown(false);
      addToast({
        type: "info",
        message: "Disconnected",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-dark border-b border-dark-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="relative">
              <div className="w-12 h-12 flex items-center justify-center overflow-hidden">
                <LogoIcon size={40} className="text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-display font-bold gradient-text">
                VeTerex
              </h1>
              <p className="text-[10px] text-dark-400 -mt-0.5">
                Media Achievements
              </p>
            </div>
          </div>

          {/* Wallet Connection + Updates */}
          <div className="flex items-center gap-2">
            {/* Documentation Link - Only show on web version */}
            {!isExtension && (
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href={DOCS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-dark-800 border border-dark-700 
                       rounded-xl text-sm text-dark-300 hover:text-white hover:border-coral/50 
                       transition-all duration-200"
                title="Documentation"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Docs</span>
              </motion.a>
            )}

            {!isConnected ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConnect}
                disabled={isLoading || isConnecting}
                className="flex items-center gap-2 px-4 py-2 bg-main-gradient 
                     rounded-xl font-medium text-white text-sm
                     hover:shadow-neon-coral 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-lg shadow-coral/25"
              >
                {isLoading || isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{isConnecting ? "Connecting..." : "Loading..."}</span>
                  </>
                ) : (
                  <>
                    <WalletImageIcon size={16} inverted={false} />
                    <span>Connect</span>
                  </>
                )}
              </motion.button>
            ) : isConnecting ? (
              <motion.div
                className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 
                     rounded-xl font-medium text-white text-sm"
              >
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting...</span>
              </motion.div>
            ) : (
              <div className="relative">
                <motion.button
                  ref={dropdownButtonRef}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-3 py-2 bg-dark-800 border border-dark-700 
                       rounded-xl text-sm hover:border-coral/50 transition-all duration-200"
                >
                  {/* Show backend profile image if available, fallback to auth provider image */}
                  {backendUser?.profileImage ? (
                    <img
                      src={backendUser.profileImage}
                      alt={backendUser.profileName}
                      className="w-6 h-6 rounded-lg object-cover"
                    />
                  ) : authMethod === "verychat" &&
                    verychatUser?.profileImage ? (
                    <img
                      src={verychatUser.profileImage}
                      alt={verychatUser.profileName}
                      className="w-6 h-6 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-main-gradient" />
                  )}
                  <span className="text-dark-200 font-medium">
                    {authMethod === "verychat" && verychatUser
                      ? verychatUser.profileName
                      : currentAccount
                      ? truncateAddress(currentAccount.address)
                      : "Connected"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-dark-400 transition-transform ${
                      showDropdown ? "rotate-180" : ""
                    }`}
                  />
                </motion.button>

                {/* Dropdown */}
                {showDropdown && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-64 glass-dark rounded-xl border border-dark-700 
                           shadow-xl shadow-black/20 z-50 overflow-hidden"
                  >
                    {/* Account Info */}
                    <div className="p-4 border-b border-dark-700">
                      <div className="flex items-center gap-3 mb-3">
                        {/* Show backend profile image if available, fallback to auth provider image */}
                        {backendUser?.profileImage ? (
                          <img
                            src={backendUser.profileImage}
                            alt={backendUser.profileName}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                        ) : authMethod === "verychat" &&
                          verychatUser?.profileImage ? (
                          <img
                            src={verychatUser.profileImage}
                            alt={verychatUser.profileName}
                            className="w-10 h-10 rounded-xl object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-main-gradient" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {authMethod === "verychat" && verychatUser
                              ? verychatUser.profileName
                              : currentAccount?.network || "Ethereum"}
                          </p>
                          <p className="text-xs text-dark-400 truncate">
                            {authMethod === "verychat" && verychatUser
                              ? `@${verychatUser.profileId}`
                              : currentAccount?.address}
                          </p>
                          {/* Show wallet address for VeryChat users */}
                          {authMethod === "verychat" &&
                            currentAccount?.address && (
                              <p className="text-xs text-dark-500 truncate font-mono mt-0.5">
                                {truncateAddress(currentAccount.address)}
                              </p>
                            )}
                        </div>
                      </div>

                      {/* Copy wallet address for VeryChat users */}
                      {authMethod === "verychat" && currentAccount?.address && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(
                              currentAccount.address
                            );
                            setCopiedWallet(true);
                            setTimeout(() => setCopiedWallet(false), 2000);
                          }}
                          className="w-full flex items-center justify-start gap-2 px-3 py-2 mb-2
                                 bg-dark-800 rounded-lg text-sm text-dark-300 
                                 hover:text-white hover:bg-dark-700 transition-colors"
                        >
                          {copiedWallet ? (
                            <>
                              <Check className="w-4 h-4 text-green-400" />
                              <span>Copied Wallet Address!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copy Wallet Address</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Copy button - handle for VeryChat, address for Wepin */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          let textToCopy = "";
                          if (authMethod === "verychat" && verychatUser) {
                            textToCopy = `@${verychatUser.profileId}`;
                          } else if (currentAccount?.address) {
                            textToCopy = currentAccount.address;
                          }
                          if (textToCopy) {
                            navigator.clipboard.writeText(textToCopy);
                            setCopiedHandle(true);
                            setTimeout(() => setCopiedHandle(false), 2000);
                          }
                        }}
                        className="w-full flex items-center justify-start gap-2 px-3 py-2 
                               bg-dark-800 rounded-lg text-sm text-dark-300 
                               hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        {copiedHandle ? (
                          <>
                            <Check className="w-4 h-4 text-green-400" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>
                              {authMethod === "verychat"
                                ? "Copy Handle"
                                : "Copy Address"}
                            </span>
                          </>
                        )}
                      </button>

                      {/* Auth method badge */}
                      <div className="flex items-center justify-start gap-2 mt-3 px-3 py-1.5 bg-dark-800 rounded-lg">
                        {authMethod === "verychat" ? (
                          <>
                            <img
                              src="/icons/very_logo.png"
                              alt="VeryChat"
                              className="w-4 h-4 object-contain"
                            />
                            <span className="text-xs text-dark-400">
                              Connected via VeryChat
                            </span>
                          </>
                        ) : (
                          <>
                            <img
                              src="/icons/wepin_logo.png"
                              alt="Wepin"
                              className="w-4 h-4 object-contain"
                            />
                            <span className="text-xs text-dark-400">
                              Connected via Wepin
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg 
                               text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-medium">Disconnect</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Choice Modal (for both web and extension) */}
      <AuthChoiceModal
        isOpen={showAuthChoiceModal}
        onClose={() => setShowAuthChoiceModal(false)}
        onChooseVeryChat={() => {
          setShowAuthChoiceModal(false);
          setShowVeryChatModal(true);
        }}
        onChooseWepin={() => {
          setShowAuthChoiceModal(false);
          if (isExtension) {
            // Extension: Open web app in new tab with auth params
            const extensionId = chrome.runtime?.id || "";
            const authUrl = `${WEB_APP_URL}?extension_auth=wepin&extension_id=${extensionId}`;
            window.open(authUrl, "_blank");
            addToast({
              type: "info",
              message: "Opening browser for Wepin login...",
            });
          } else {
            // Web: Use Wepin directly
            handleWepinLogin();
          }
        }}
      />

      {/* VeryChat Login Modal */}
      <VeryChatLoginModal
        isOpen={showVeryChatModal}
        onClose={() => setShowVeryChatModal(false)}
        onSuccess={handleVeryChatSuccess}
      />

      {/* Wallet Backup Modal (shown after creating new wallet) */}
      {newWalletData && (
        <WalletBackupModal
          isOpen={showBackupModal}
          onClose={() => {
            setShowBackupModal(false);
            setNewWalletData(null);
          }}
          recoveryPhrase={newWalletData.recoveryPhrase}
          walletAddress={newWalletData.address}
          isFirstTimeSetup={true}
        />
      )}

      {/* Wallet Import Modal (for restoring wallet on new device) */}
      {pendingImportUserId && (
        <WalletImportModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setPendingImportUserId(null);
          }}
          onImportSuccess={handleImportSuccess}
          userId={pendingImportUserId}
        />
      )}
    </>
  );
}
