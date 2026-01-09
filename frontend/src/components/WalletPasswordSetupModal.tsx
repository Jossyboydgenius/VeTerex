import React, { useState } from "react";
import { createPortal } from "react-dom";
import { setWalletPassword } from "../services/backend";
import { useAppStore } from "../store/useAppStore";

interface WalletPasswordSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WalletPasswordSetupModal({
  isOpen,
  onClose,
  onSuccess,
}: WalletPasswordSetupModalProps) {
  const backendUser = useAppStore((state) => state.backendUser);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const getPasswordStrength = (pwd: string): string => {
    if (pwd.length === 0) return "";
    if (pwd.length < 8) return "weak";
    if (pwd.length < 12) return "medium";
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd))
      return "strong";
    return "medium";
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!backendUser?.id) {
      setError("User not authenticated");
      return;
    }

    setIsLoading(true);

    try {
      const result = await setWalletPassword(backendUser.id, password);
      if (result.success) {
        setPassword("");
        setConfirmPassword("");
        onSuccess();
      } else {
        setError("Failed to set password. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Password setup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPassword("");
      setConfirmPassword("");
      setError("");
      onClose();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[10000]">
      <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-white">
          🔐 Set Wallet Password
        </h2>

        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-200">
            ⚠️ This password will be required to export your private key. Keep
            it secure and memorable.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Password (min 8 characters)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full bg-[#0f0f1e] border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
              autoFocus
            />
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  <div
                    className={`h-1 flex-1 rounded ${
                      strength === "weak"
                        ? "bg-red-500"
                        : strength === "medium"
                        ? "bg-yellow-500"
                        : strength === "strong"
                        ? "bg-green-500"
                        : "bg-gray-600"
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded ${
                      strength === "medium" || strength === "strong"
                        ? "bg-yellow-500"
                        : "bg-gray-600"
                    }`}
                  />
                  <div
                    className={`h-1 flex-1 rounded ${
                      strength === "strong" ? "bg-green-500" : "bg-gray-600"
                    }`}
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Strength:{" "}
                  <span
                    className={
                      strength === "weak"
                        ? "text-red-400"
                        : strength === "medium"
                        ? "text-yellow-400"
                        : "text-green-400"
                    }
                  >
                    {strength.toUpperCase()}
                  </span>
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full bg-[#0f0f1e] border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isLoading ? "Setting..." : "Set Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
