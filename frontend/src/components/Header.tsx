import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  ChevronDown,
  LogOut,
  Copy,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import {
  initWepin,
  loginWithWepin,
  logoutWepin,
  getWepinAccounts,
  getWepinDomainForRegistration,
} from "@/services/wepin";

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
    currentAccount,
    setConnected,
    setLoading,
    setWepinUser,
    setAccounts,
    setCurrentAccount,
    addToast,
    logout,
  } = useAppStore();

  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showDomainError, setShowDomainError] = useState(false);
  const [extensionDomain, setExtensionDomain] = useState<string | null>(null);

  useEffect(() => {
    if (isExtension) {
      setExtensionDomain(getWepinDomainForRegistration());
    }
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Initialize Wepin SDK
      const initialized = await initWepin();

      if (!initialized) {
        if (isExtension) {
          setShowDomainError(true);
          addToast({
            type: "error",
            message:
              "Wallet requires domain registration. Use web version or register extension domain.",
          });
          setLoading(false);
          return;
        }

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

        // Get accounts
        const accounts = await getWepinAccounts();
        setAccounts(accounts);

        if (accounts.length > 0) {
          setCurrentAccount(accounts[0]);
        }

        setConnected(true);
        setShowDomainError(false);
        addToast({
          type: "success",
          message: "Wallet connected successfully!",
        });
      }
    } catch (error: any) {
      console.error("Connection error:", error);

      // Check for domain error
      if (
        error?.message?.includes("domain") ||
        error?.message?.includes("registration")
      ) {
        setShowDomainError(true);
        addToast({
          type: "error",
          message:
            "Wallet requires domain registration. Use web version or register extension domain.",
        });
      } else {
        addToast({
          type: "error",
          message: "Failed to connect wallet. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await logoutWepin();
      logout();
      setShowDropdown(false);
      addToast({
        type: "info",
        message: "Wallet disconnected",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  const copyAddress = () => {
    if (currentAccount?.address) {
      navigator.clipboard.writeText(currentAccount.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <header className="sticky top-0 z-50 glass-dark border-b border-dark-700/50">
      {/* Domain Registration Error Banner for Extensions */}
      <AnimatePresence>
        {showDomainError && isExtension && extensionDomain && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border-b border-red-500/20"
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-300 font-medium">
                  Wallet requires domain registration. Use web version or
                  register extension domain.
                </p>
                <p className="text-xs text-red-400/80 mt-1 break-all">
                  Add this domain to Wepin Workspace:{" "}
                  <code className="bg-red-500/20 px-1 rounded">
                    {extensionDomain}
                  </code>
                </p>
              </div>
              <button
                onClick={() => setShowDomainError(false)}
                className="p-1 text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center overflow-hidden">
              <img src="/icons/icon.svg" alt="VeTerex" className="w-7 h-7" />
            </div>
            <div className="absolute -inset-1 bg-gradient-to-br from-accent-500 to-primary-500 rounded-xl blur opacity-30" />
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

        {/* Wallet Connection */}
        {!isConnected ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConnect}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-500 to-primary-500 
                     rounded-xl font-medium text-white text-sm
                     hover:from-accent-400 hover:to-primary-400 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200 shadow-lg shadow-accent-500/25"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4" />
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
              className="flex items-center gap-2 px-3 py-2 bg-dark-800 border border-dark-600 
                       rounded-xl text-sm hover:border-accent-500/50 transition-all duration-200"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500" />
              <span className="text-dark-200 font-medium">
                {currentAccount
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
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {currentAccount?.network || "Ethereum"}
                        </p>
                        <p className="text-xs text-dark-400 truncate">
                          {currentAccount?.address}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={copyAddress}
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
                          <span>Copy Address</span>
                        </>
                      )}
                    </button>
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
  );
}
