import React from "react";
import { createPortal } from "react-dom";

interface WalletImportConfirmationProps {
  isOpen: boolean;
  currentAddress: string;
  newAddress: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function WalletImportConfirmation({
  isOpen,
  currentAddress,
  newAddress,
  onConfirm,
  onCancel,
}: WalletImportConfirmationProps) {
  const [hasBackedUp, setHasBackedUp] = React.useState(false);

  if (!isOpen) return null;

  const truncateAddress = (addr: string) => {
    if (addr.length <= 13) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[10000]">
      <div className="bg-[#1a1a2e] border border-red-500/30 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">⚠️</span>
          <h2 className="text-xl font-bold text-red-400">
            Replace Current Wallet?
          </h2>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-200 font-semibold mb-2">
              ⚠️ WARNING: This will PERMANENTLY replace your current wallet!
            </p>
            <p className="text-xs text-red-300">
              You will lose access to your current wallet unless you have backed
              up your recovery phrase.
            </p>
          </div>

          <div className="space-y-2">
            <div className="bg-[#0f0f1e] border border-gray-600 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">Current Wallet:</p>
              <p className="font-mono text-sm text-white break-all">
                {truncateAddress(currentAddress)}
              </p>
            </div>

            <div className="flex justify-center">
              <span className="text-gray-500">↓</span>
            </div>

            <div className="bg-[#0f0f1e] border border-purple-500/30 rounded-lg p-3">
              <p className="text-xs text-gray-400 mb-1">New Wallet:</p>
              <p className="font-mono text-sm text-purple-300 break-all">
                {truncateAddress(newAddress)}
              </p>
            </div>
          </div>

          <label className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg cursor-pointer hover:bg-yellow-500/20 transition-colors">
            <input
              type="checkbox"
              checked={hasBackedUp}
              onChange={(e) => setHasBackedUp(e.target.checked)}
              className="mt-1 w-4 h-4 accent-purple-600"
            />
            <span className="text-sm text-yellow-200">
              I confirm that I have backed up my current recovery phrase and
              understand this action cannot be undone
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!hasBackedUp}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-700 disabled:opacity-50 text-white rounded-lg transition-colors font-semibold"
          >
            Replace Wallet
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
