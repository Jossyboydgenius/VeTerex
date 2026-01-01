import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { VeryLogoImageIcon, WepinLogoImageIcon } from "./AppIcons";

interface AuthChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChooseVeryChat: () => void;
  onChooseWepin: () => void;
}

/**
 * Modal for choosing authentication method
 * Matches the design of VeryChatLoginModal
 * - VeryChat: Direct login within extension
 * - Wepin: Redirects to web app for OAuth flow
 */
export function AuthChoiceModal({
  isOpen,
  onClose,
  onChooseVeryChat,
  onChooseWepin,
}: AuthChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
      />
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md"
        >
          <div className="bg-dark-800 rounded-2xl border border-dark-700 p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1" /> {/* Spacer for centering */}
              <h3 className="text-lg font-semibold text-white text-center">
                Sign In
              </h3>
              <div className="flex-1 flex justify-end">
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
                >
                  <X className="w-5 h-5 text-dark-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <p className="text-sm text-dark-400 text-center mb-6">
                Choose how you want to sign in
              </p>

              {/* VeryChat Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onChooseVeryChat}
                className="w-full flex items-center gap-4 p-4 bg-dark-900/50 border border-dark-700 
                         rounded-xl hover:border-coral/50 hover:bg-dark-900 transition-all duration-200"
              >
                {/* Icon without container - matching VeryChatLoginModal style */}
                <VeryLogoImageIcon size={48} />
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-white">VeryChat</h4>
                  <p className="text-xs text-dark-400">
                    Sign in with your VeryChat account
                  </p>
                </div>
              </motion.button>

              {/* Wepin Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onChooseWepin}
                className="w-full flex items-center gap-4 p-4 bg-dark-900/50 border border-dark-700 
                         rounded-xl hover:border-[#7C60FD] hover:bg-dark-900 transition-all duration-200"
              >
                {/* Icon without container - matching VeryChatLoginModal style */}
                <WepinLogoImageIcon size={48} />
                <div className="text-left flex-1">
                  <h4 className="font-semibold text-white">Wepin Wallet</h4>
                  <p className="text-xs text-dark-400">
                    Connect your wallet via web browser
                  </p>
                </div>
              </motion.button>

              <p className="text-xs text-dark-500 text-center pt-2">
                Wepin opens in a new browser tab for secure login
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
