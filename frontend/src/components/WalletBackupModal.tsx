import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
} from "lucide-react";
import WalletPasswordSetupModal from "./WalletPasswordSetupModal";
import WalletPasswordVerifyModal from "./WalletPasswordVerifyModal";
import { hasWalletPassword } from "../services/backend";
import { useAppStore } from "../store/useAppStore";

interface WalletBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoveryPhrase: string;
  walletAddress: string;
  isFirstTimeSetup?: boolean;
}

export function WalletBackupModal({
  isOpen,
  onClose,
  recoveryPhrase,
  walletAddress,
  isFirstTimeSetup = false,
}: WalletBackupModalProps) {
  const backendUser = useAppStore((state) => state.backendUser);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [showPhrase, setShowPhrase] = useState(false);
  const [phraseRevealed, setPhraseRevealed] = useState(false);
  const [showPasswordSetup, setShowPasswordSetup] = useState(false);
  const [showPasswordVerify, setShowPasswordVerify] = useState(false);

  const words = recoveryPhrase.split(" ");

  const handleRevealPhrase = async () => {
    if (!backendUser?.id) {
      alert("Please log in to reveal recovery phrase");
      return;
    }

    try {
      // Check if password exists
      const result = await hasWalletPassword(backendUser.id);

      if (!result.hasPassword) {
        // No password set, show setup modal
        setShowPasswordSetup(true);
        return;
      }

      // Password exists, verify it
      setShowPasswordVerify(true);
    } catch (error) {
      console.error("Error checking wallet password:", error);
      alert("Failed to verify security. Please try again.");
    }
  };

  const handlePasswordVerified = () => {
    setShowPasswordVerify(false);
    setPhraseRevealed(true);
    setShowPhrase(true);
  };

  const handlePasswordSetupSuccess = () => {
    setShowPasswordSetup(false);
    // After setup, show verification
    setShowPasswordVerify(true);
  };

  const handleCopy = async () => {
    // Require password verification before copying
    if (!phraseRevealed) {
      await handleRevealPhrase();
      return;
    }

    navigator.clipboard.writeText(recoveryPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    // Require password verification before downloading
    if (!phraseRevealed) {
      await handleRevealPhrase();
      return;
    }

    const blob = new Blob(
      [
        `VeTerex Wallet Recovery Phrase\n\nWallet Address: ${walletAddress}\n\nRecovery Phrase:\n${recoveryPhrase}\n\nIMPORTANT:\n- Keep this phrase safe and private\n- Never share it with anyone\n- Anyone with this phrase can access your wallet\n- Store it offline in a secure location\n- VeTerex cannot recover this phrase if lost`,
      ],
      {
        type: "text/plain",
      }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veterex-wallet-backup-${walletAddress.slice(0, 8)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClose = () => {
    if (isFirstTimeSetup && !confirmed) {
      alert(
        "Please confirm that you have saved your recovery phrase before continuing."
      );
      return;
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-purple-500/20"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-br from-gray-900 to-gray-800 border-b border-purple-500/20 p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {isFirstTimeSetup
                      ? "🎉 Wallet Created Successfully!"
                      : "Backup Your Wallet"}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Save your recovery phrase to restore your wallet on any
                    device
                  </p>
                </div>
                {!isFirstTimeSetup && (
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Warning Banner */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                    <h3 className="text-yellow-500 font-semibold">
                      CRITICAL - Read Carefully
                    </h3>
                  </div>
                  <ul className="text-yellow-200/90 text-sm space-y-1">
                    <li>• This is your ONLY way to recover your wallet</li>
                    <li>
                      • Write it down on paper and store it safely offline
                    </li>
                    <li>
                      • NEVER share this phrase with anyone - not even VeTerex
                      support
                    </li>
                    <li>• Anyone with this phrase can steal all your funds</li>
                    <li>• VeTerex CANNOT recover this phrase if you lose it</li>
                  </ul>
                </div>
              </div>

              {/* Wallet Address */}
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">
                  Your Wallet Address:
                </p>
                <p className="text-white font-mono text-sm break-all">
                  {walletAddress}
                </p>
              </div>

              {/* Recovery Phrase */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white font-semibold">
                    12-Word Recovery Phrase:
                  </label>
                  {!phraseRevealed ? (
                    <button
                      onClick={handleRevealPhrase}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Reveal Phrase
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowPhrase(!showPhrase)}
                      className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      {showPhrase ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          Show
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="bg-gray-800/80 rounded-lg p-6 border border-purple-500/30">
                  {phraseRevealed && showPhrase ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {words.map((word, index) => (
                        <div
                          key={index}
                          className="bg-gray-900/50 rounded-lg p-3 border border-gray-700"
                        >
                          <span className="text-gray-500 text-xs mr-2">
                            {index + 1}.
                          </span>
                          <span className="text-white font-mono">{word}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400 mb-2">
                        Recovery phrase is hidden for security
                      </p>
                      <p className="text-gray-500 text-sm">
                        Click "Show" above to reveal
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleCopy}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy to Clipboard
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download as File
                </button>
              </div>

              {/* Confirmation Checkbox (for first-time setup) */}
              {isFirstTimeSetup && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-purple-500/50 bg-gray-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-gray-900"
                    />
                    <div className="flex-1">
                      <p className="text-white font-semibold mb-1">
                        I have saved my recovery phrase in a safe place
                      </p>
                      <p className="text-gray-400 text-sm">
                        I understand that if I lose this phrase, I will lose
                        access to my wallet permanently.
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Close Button (for first-time setup) */}
              {isFirstTimeSetup && (
                <button
                  onClick={handleClose}
                  disabled={!confirmed}
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                    confirmed
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {confirmed
                    ? "Continue to VeTerex"
                    : "Please confirm you've saved your phrase"}
                </button>
              )}

              {/* Additional Info */}
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <h4 className="text-white font-semibold mb-2 text-sm">
                  💡 Recovery Tips:
                </h4>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>✓ Write on paper and store in a fireproof safe</li>
                  <li>
                    ✓ Consider making multiple copies in different secure
                    locations
                  </li>
                  <li>
                    ✓ Never store digitally (no photos, no cloud storage, no
                    email)
                  </li>
                  <li>✓ Keep it away from prying eyes and cameras</li>
                  <li>
                    ✓ You can use this phrase to import your wallet on any
                    device
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Password Modals */}
      <WalletPasswordSetupModal
        isOpen={showPasswordSetup}
        onClose={() => setShowPasswordSetup(false)}
        onSuccess={handlePasswordSetupSuccess}
      />

      <WalletPasswordVerifyModal
        isOpen={showPasswordVerify}
        onClose={() => setShowPasswordVerify(false)}
        onVerified={handlePasswordVerified}
      />
    </AnimatePresence>
  );
}
