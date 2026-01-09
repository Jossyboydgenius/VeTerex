import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { verifyWalletPassword } from "../services/backend";
import { useAppStore } from "../store/useAppStore";
import { Eye, EyeOff } from "lucide-react";

interface WalletPasswordVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  onForgotPassword?: () => void;
}

export default function WalletPasswordVerifyModal({
  isOpen,
  onClose,
  onVerified,
  onForgotPassword,
}: WalletPasswordVerifyModalProps) {
  const backendUser = useAppStore((state) => state.backendUser);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      setError("");
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter your password");
      return;
    }

    if (!backendUser?.id) {
      setError("User not authenticated");
      return;
    }

    setIsLoading(true);

    try {
      const result = await verifyWalletPassword(backendUser.id, password);
      if (result.success && result.isValid) {
        setPassword("");
        onVerified();
      } else {
        setError("Incorrect password. Please try again.");
        setPassword("");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Password verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setPassword("");
      setError("");
      onClose();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[10000]">
      <div className="bg-[#1a1a2e] border border-purple-500/30 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4 text-white">
          🔒 Verify Password
        </h2>

        <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <p className="text-sm text-orange-200">
            🔑 Enter your wallet password to export your private key
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your wallet password"
                className="w-full bg-[#0f0f1e] border border-purple-500/30 rounded-lg px-4 py-2 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={isLoading}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              disabled={isLoading}
            >
              Forgot Password?
            </button>
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
              disabled={isLoading || !password}
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-700 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
