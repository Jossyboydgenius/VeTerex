import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, AlertTriangle, Check, Key } from "lucide-react";
import WalletImportConfirmation from "./WalletImportConfirmation";
import { updateUserWalletAddress } from "../services/backend";
import { useAppStore } from "../store/useAppStore";

interface WalletImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (address: string) => void;
  userId: string; // VeryChat profileId for encryption
}

type ImportMode = "mnemonic" | "privateKey";

export function WalletImportModal({
  isOpen,
  onClose,
  onImportSuccess,
  userId,
}: WalletImportModalProps) {
  const backendUser = useAppStore((state) => state.backendUser);
  const [importMode, setImportMode] = useState<ImportMode>("mnemonic");
  const [recoveryPhrase, setRecoveryPhrase] = useState("");
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [derivedAddress, setDerivedAddress] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingWallet, setPendingWallet] = useState<{
    address: string;
  } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>("");

  // BIP-39 English wordlist check (simple validation)
  const validateMnemonic = (phrase: string): boolean => {
    const words = phrase.trim().toLowerCase().split(/\s+/);

    // Must be 12, 15, 18, 21, or 24 words
    const validLengths = [12, 15, 18, 21, 24];
    if (!validLengths.includes(words.length)) {
      setError(
        `Recovery phrase must be 12, 15, 18, 21, or 24 words. You entered ${words.length} words.`
      );
      return false;
    }

    // Basic check - each word should be alphabetic
    const hasInvalidWords = words.some((word) => !/^[a-z]+$/.test(word));
    if (hasInvalidWords) {
      setError(
        "Recovery phrase contains invalid characters. Only lowercase letters are allowed."
      );
      return false;
    }

    setError(null);
    return true;
  };

  // Validate private key format
  const validatePrivateKey = (key: string): boolean => {
    const cleanedKey = key.trim();

    // Must be 64 hex chars (with or without 0x prefix)
    const hexPattern = /^(0x)?[0-9a-fA-F]{64}$/;
    if (!hexPattern.test(cleanedKey)) {
      setError(
        "Invalid private key format. Must be 64 hexadecimal characters (with or without 0x prefix)."
      );
      return false;
    }

    setError(null);
    return true;
  };

  const handlePhraseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setRecoveryPhrase(value);
    setError(null);
    setDerivedAddress(null);
  };

  const handlePrivateKeyChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setPrivateKeyInput(value);
    setError(null);
    setDerivedAddress(null);
  };

  const handlePreviewAddress = async () => {
    setIsImporting(true);

    try {
      if (importMode === "mnemonic") {
        const cleanedPhrase = recoveryPhrase
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");

        if (!validateMnemonic(cleanedPhrase)) {
          setIsImporting(false);
          return;
        }

        const { importWalletFromMnemonic } = await import("@/services/wallet");
        const address = await importWalletFromMnemonic(cleanedPhrase, true);
        setDerivedAddress(address);
        setError(null);
      } else {
        // Private key mode
        const cleanedKey = privateKeyInput.trim();

        if (!validatePrivateKey(cleanedKey)) {
          setIsImporting(false);
          return;
        }

        const { previewAddressFromPrivateKey } = await import(
          "@/services/wallet"
        );
        const address = previewAddressFromPrivateKey(cleanedKey);
        setDerivedAddress(address);
        setError(null);
      }
    } catch (err) {
      console.error("Preview error:", err);
      setError(err instanceof Error ? err.message : "Invalid input");
      setDerivedAddress(null);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);

    try {
      let wallet;

      if (importMode === "mnemonic") {
        const cleanedPhrase = recoveryPhrase
          .trim()
          .toLowerCase()
          .replace(/\s+/g, " ");

        if (!validateMnemonic(cleanedPhrase)) {
          setIsImporting(false);
          return;
        }

        const { importWalletWithUserId } = await import("@/services/wallet");
        wallet = importWalletWithUserId(cleanedPhrase, userId);
      } else {
        // Private key mode
        const cleanedKey = privateKeyInput.trim();

        if (!validatePrivateKey(cleanedKey)) {
          setIsImporting(false);
          return;
        }

        const { importWalletFromPrivateKey } = await import(
          "@/services/wallet"
        );
        wallet = importWalletFromPrivateKey(cleanedKey, userId);
      }

      // Get current wallet address for confirmation dialog
      const { getWalletForUser } = await import("@/services/wallet");
      const existingWallet = getWalletForUser(userId);

      if (existingWallet && existingWallet.address !== wallet.address) {
        // Show confirmation dialog before replacing
        setCurrentAddress(existingWallet.address);
        setPendingWallet(wallet);
        setShowConfirmation(true);
        setIsImporting(false);
      } else {
        // No existing wallet or same wallet, proceed directly
        await finalizeImport(wallet);
      }
    } catch (err) {
      console.error("Import error:", err);
      setError(err instanceof Error ? err.message : "Failed to import wallet");
      setIsImporting(false);
    }
  };

  const finalizeImport = async (wallet: { address: string }) => {
    try {
      // Sync to backend
      if (backendUser?.id) {
        await updateUserWalletAddress(backendUser.id, wallet.address);
      }

      // Success!
      onImportSuccess(wallet.address);
      handleClose();
    } catch (err) {
      console.error("Backend sync error:", err);
      setError(
        "Wallet imported but backend sync failed. Please contact support."
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    setShowConfirmation(false);
    if (pendingWallet) {
      setIsImporting(true);
      await finalizeImport(pendingWallet);
      setPendingWallet(null);
    }
  };

  const handleCancelImport = () => {
    setShowConfirmation(false);
    setPendingWallet(null);
    setCurrentAddress("");
  };

  const handleClose = () => {
    setImportMode("mnemonic");
    setRecoveryPhrase("");
    setPrivateKeyInput("");
    setError(null);
    setDerivedAddress(null);
    setIsImporting(false);
    onClose();
  };

  const inputValue =
    importMode === "mnemonic" ? recoveryPhrase : privateKeyInput;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
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
            className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-blue-500/20"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-br from-gray-900 to-gray-800 border-b border-blue-500/20 p-6 z-10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    <Download className="w-6 h-6 text-blue-500" />
                    Import Existing Wallet
                  </h2>
                  <p className="text-gray-400 text-sm">
                    Restore your wallet using recovery phrase or private key
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Import Mode Tabs - styled like Community Groups/Matches */}
              <div className="mt-4 flex gap-2 p-1 bg-gray-800 rounded-xl">
                <button
                  onClick={() => {
                    setImportMode("mnemonic");
                    setError(null);
                    setDerivedAddress(null);
                  }}
                  className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    importMode === "mnemonic"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>12-Word Phrase</span>
                </button>
                <button
                  onClick={() => {
                    setImportMode("privateKey");
                    setError(null);
                    setDerivedAddress(null);
                  }}
                  className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    importMode === "privateKey"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>Private Key</span>
                </button>
              </div>
            </div>{" "}
            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Info Banner */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <div className="space-y-2">
                  <h3 className="text-blue-400 font-semibold flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    {importMode === "mnemonic"
                      ? "About Recovery Phrases"
                      : "About Private Keys"}
                  </h3>
                  <ul className="text-blue-200/90 text-sm space-y-1">
                    {importMode === "mnemonic" ? (
                      <>
                        <li>
                          • Enter your 12-word recovery phrase from your backup
                        </li>
                        <li>
                          • This will restore the exact same wallet and address
                        </li>
                        <li>
                          • All your NFTs and tokens will be accessible again
                        </li>
                        <li>
                          • Works with phrases from MetaMask, Trust Wallet, etc.
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          • Enter your 64-character private key (with or without
                          0x prefix)
                        </li>
                        <li>
                          • This will restore your wallet with the exact same
                          address
                        </li>
                        <li>
                          • Private key can be exported from MetaMask or other
                          wallets
                        </li>
                        <li>
                          • Keep your private key secret - anyone with it can
                          access your funds
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* Input Section - Dynamic based on mode */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-white font-semibold">
                    {importMode === "mnemonic"
                      ? "Recovery Phrase:"
                      : "Private Key:"}
                  </label>
                  {importMode === "mnemonic" &&
                    (() => {
                      const wordCount = recoveryPhrase
                        .trim()
                        .split(/\s+/)
                        .filter((w) => w.length > 0).length;
                      return (
                        <span
                          className={`text-sm font-mono ${
                            wordCount === 12 || wordCount === 24
                              ? "text-green-400"
                              : wordCount === 0
                              ? "text-gray-500"
                              : "text-yellow-400"
                          }`}
                        >
                          {wordCount} words
                        </span>
                      );
                    })()}
                </div>

                <textarea
                  value={inputValue}
                  onChange={
                    importMode === "mnemonic"
                      ? handlePhraseChange
                      : handlePrivateKeyChange
                  }
                  placeholder={
                    importMode === "mnemonic"
                      ? "Enter your 12-word recovery phrase here (separated by spaces)"
                      : "Enter your private key (0x followed by 64 hex characters)"
                  }
                  className="w-full bg-gray-800/80 rounded-lg p-4 border border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-white placeholder-gray-500 font-mono text-sm resize-none transition-all"
                  rows={importMode === "mnemonic" ? 4 : 3}
                  autoComplete="off"
                  spellCheck={false}
                />

                <p className="text-xs text-gray-400">
                  {importMode === "mnemonic"
                    ? "Paste your recovery phrase exactly as you saved it. Each word should be separated by a space."
                    : "Paste your private key with or without the 0x prefix. Keep this information absolutely secret."}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-semibold mb-1">
                        Import Failed
                      </p>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Derived Address Preview */}
              {derivedAddress && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-green-400 font-semibold mb-2">
                        Wallet Address Preview:
                      </p>
                      <p className="text-white font-mono text-sm break-all bg-gray-800/50 p-2 rounded">
                        {derivedAddress}
                      </p>
                      <p className="text-green-300 text-xs mt-2">
                        ✓ This is the wallet address that will be restored
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning - Fixed alignment */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="space-y-2">
                  <h3 className="text-yellow-500 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Important Warning
                  </h3>
                  <ul className="text-yellow-200/90 text-sm space-y-1">
                    <li>
                      • Importing will REPLACE your current wallet (if any)
                    </li>
                    <li>
                      • Make sure you have backed up your current recovery
                      phrase first
                    </li>
                    <li>• Only import phrases/keys from your own wallets</li>
                    <li>
                      • Never share your recovery phrase or private key with
                      anyone
                    </li>
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!derivedAddress ? (
                  <>
                    <button
                      onClick={handleClose}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePreviewAddress}
                      disabled={
                        isImporting ||
                        (importMode === "mnemonic" &&
                          recoveryPhrase
                            .trim()
                            .split(/\s+/)
                            .filter((w) => w.length > 0).length < 12) ||
                        (importMode === "privateKey" &&
                          privateKeyInput.trim().length < 64)
                      }
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        isImporting ||
                        (importMode === "mnemonic" &&
                          recoveryPhrase
                            .trim()
                            .split(/\s+/)
                            .filter((w) => w.length > 0).length < 12) ||
                        (importMode === "privateKey" &&
                          privateKeyInput.trim().length < 64)
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isImporting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Validating...
                        </span>
                      ) : (
                        "Preview Wallet"
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setDerivedAddress(null);
                        setRecoveryPhrase("");
                      }}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors"
                    >
                      Start Over
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={isImporting}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                        isImporting
                          ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {isImporting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Importing...
                        </span>
                      ) : (
                        "Confirm & Import Wallet"
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Tips */}
              <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                <h4 className="text-white font-semibold mb-2 text-sm">
                  💡 Import Tips:
                </h4>
                <ul className="text-gray-400 text-xs space-y-1">
                  <li>✓ Make sure all words are spelled correctly</li>
                  <li>✓ Words should be lowercase and separated by spaces</li>
                  <li>✓ The order of words matters - don't change it</li>
                  <li>✓ Most wallets use 12 or 24 words</li>
                  <li>✓ Preview your address before confirming the import</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document body level (fixes z-index issues)
  return (
    <>
      {createPortal(modalContent, document.body)}
      <WalletImportConfirmation
        isOpen={showConfirmation}
        currentAddress={currentAddress}
        newAddress={pendingWallet?.address || ""}
        onConfirm={handleConfirmImport}
        onCancel={handleCancelImport}
      />
    </>
  );
}
