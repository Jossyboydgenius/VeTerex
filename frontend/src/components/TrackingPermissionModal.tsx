import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shield, Eye, Bell, Check, Loader2 } from "lucide-react";

interface TrackingPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllow: () => void;
  onDeny: () => void;
}

// Check if running as Chrome extension
const isExtension =
  typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id;

export function TrackingPermissionModal({
  isOpen,
  onClose,
  onAllow,
  onDeny,
}: TrackingPermissionModalProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const features = [
    {
      icon: Eye,
      title: "Track Media Progress",
      description: "Monitor your watching/reading progress on supported sites",
    },
    {
      icon: Bell,
      title: "Completion Alerts",
      description: "Get notified when you finish a movie, book, or show",
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data stays on your device - we never sell your info",
    },
  ];

  const handleAllow = async () => {
    setIsRequesting(true);

    try {
      if (isExtension) {
        // Request permissions for all supported platforms
        const granted = await chrome.permissions.request({
          origins: [
            "https://*.youtube.com/*",
            "https://*.netflix.com/*",
            "https://*.primevideo.com/*",
            "https://*.amazon.com/*",
            "https://*.disneyplus.com/*",
            "https://*.hulu.com/*",
            "https://*.crunchyroll.com/*",
          ],
        });

        if (granted) {
          onAllow();
        } else {
          // User denied the browser permission, but still allow app-level tracking
          onAllow();
        }
      } else {
        // Not in extension, just allow
        onAllow();
      }
    } catch (error) {
      console.error("Permission request error:", error);
      // Still allow even if permission request fails
      onAllow();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop - Full viewport coverage */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-dark rounded-2xl border border-dark-700 shadow-xl overflow-hidden w-full max-w-md max-h-[90vh] overflow-y-auto pointer-events-auto"
            >
              {/* Header */}
              <div className="relative p-6 pb-4 text-center border-b border-dark-700">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Icon - Commented out as requested */}
                {/* <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-coral/20 to-violet/20 flex items-center justify-center border border-coral/30">
                  <Shield className="w-8 h-8 text-coral" />
                </div> */}

                <h2 className="text-xl font-bold text-white mb-2">
                  Enable Media Tracking?
                </h2>
                <p className="text-sm text-dark-400">
                  Allow VeTerex to track your media progress and mint NFT badges
                  when you complete content.
                </p>
              </div>

              {/* Features */}
              <div className="p-6 space-y-4">
                {features.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-dark-800 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-coral" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{title}</p>
                      <p className="text-dark-400 text-xs">{description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="p-6 pt-2 space-y-3">
                <button
                  onClick={handleAllow}
                  disabled={isRequesting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl
                           bg-gradient-to-r from-coral to-violet 
                           text-white font-medium
                           hover:from-coral-light hover:to-violet-light
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200"
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Requesting...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Enable Tracking</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onDeny}
                  disabled={isRequesting}
                  className="w-full py-3 px-4 rounded-xl
                           bg-dark-800 border border-dark-600
                           text-dark-300 font-medium
                           hover:bg-dark-700 hover:text-white
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200"
                >
                  Not Now
                </button>

                <p className="text-center text-xs text-dark-500">
                  You can change this anytime in Settings
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
