import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, LogOut, Copy, Check } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { useNavigate } from "react-router-dom";
import {
  initWepin,
  loginWithWepin,
  logoutWepin,
  getWepinAccounts,
} from "@/services/wepin";
import { logout as logoutVeryChat } from "@/services/verychat";
import { VeryChatLoginModal } from "./VeryChatLoginModal";
import { LogoIcon, WalletImageIcon } from "./AppIcons";

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
    authMethod,
    currentAccount,
    verychatUser,
    setConnected,
    setLoading,
    setAuthMethod,
    setWepinUser,
    setVeryChatUser,
    setAccounts,
    setCurrentAccount,
    addToast,
    logout,
  } = useAppStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVeryChatModal, setShowVeryChatModal] = useState(false);
  const navigate = useNavigate();

  const handleConnect = async () => {
    // For extensions, use VeryChat authentication since Wepin doesn't support chrome-extension:// URLs
    if (isExtension) {
      setShowVeryChatModal(true);
      return;
    }

    // For web, use Wepin
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
        setWepinUser(user);
        setAuthMethod("wepin");

        // Get accounts
        const accounts = await getWepinAccounts();
        setAccounts(accounts);

        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
        }

        setConnected(true);
        addToast({
          type: "success",
          message: "Wallet connected successfully!",
        });
      }
    } catch (error: any) {
      console.error("Connection error:", error);
      addToast({
        type: "error",
        message: "Failed to connect wallet. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVeryChatSuccess = (user: {
    profileId: string;
    profileName: string;
    profileImage?: string;
  }) => {
    setVeryChatUser(user);
    setAuthMethod("verychat");
    setConnected(true);
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

  const copyToClipboard = () => {
    let textToCopy = "";

    if (authMethod === "verychat" && verychatUser) {
      textToCopy = `@${verychatUser.profileId}`;
    } else if (currentAccount?.address) {
      textToCopy = currentAccount.address;
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
            onClick={() => navigate('/')}
          >
            <div className="relative">
              <div className="w-10 h-10 flex items-center justify-center overflow-hidden">
                <LogoIcon size={32} className="text-white" />
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
          {!isConnected ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConnect}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-main-gradient 
                     rounded-xl font-medium text-white text-sm
                     hover:shadow-neon-coral 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-lg shadow-coral/25"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <WalletImageIcon size={16} inverted={false} />
                  <span>Connect</span>
                </>
              )}
            </motion.button>
          ) : (
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-dark-800 border border-dark-700 
                       rounded-xl text-sm hover:border-coral/50 transition-all duration-200"
              >
                {authMethod === "verychat" && verychatUser?.profileImage ? (
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
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDropdown(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-64 glass-dark rounded-xl border border-dark-700 
                           shadow-xl shadow-black/20 z-50 overflow-hidden"
                  >
                    {/* Account Info */}
                    <div className="p-4 border-b border-dark-700">
                      <div className="flex items-center gap-3 mb-3">
                        {authMethod === "verychat" &&
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
                        </div>
                      </div>

                      {/* Copy button - works for both auth methods */}
                      <button
                        onClick={copyToClipboard}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 
                               bg-dark-800 rounded-lg text-sm text-dark-300 
                               hover:text-white hover:bg-dark-700 transition-colors"
                      >
                        {copied ? (
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
                      <div className="flex items-center justify-center gap-2 mt-3 px-3 py-1.5 bg-dark-800 rounded-lg">
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
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* VeryChat Login Modal */}
      <VeryChatLoginModal
        isOpen={showVeryChatModal}
        onClose={() => setShowVeryChatModal(false)}
        onSuccess={handleVeryChatSuccess}
      />
    </>
  );
}
