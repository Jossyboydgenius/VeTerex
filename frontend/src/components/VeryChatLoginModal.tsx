import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { requestVerificationCode, loginWithCode } from "@/services/verychat";

interface VeryChatLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: {
    profileId: string;
    profileName: string;
    profileImage?: string;
  }) => void;
}

type Step = "handle" | "code" | "success";

export function VeryChatLoginModal({
  isOpen,
  onClose,
  onSuccess,
}: VeryChatLoginModalProps) {
  const [step, setStep] = useState<Step>("handle");
  const [handleId, setHandleId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleRequestCode = useCallback(async () => {
    if (!handleId.trim()) {
      setError("Please enter your VeryChat handle");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await requestVerificationCode(handleId);
      setStep("code");
      setResendCooldown(60); // Start 60 second cooldown
    } catch (err: any) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  }, [handleId]);

  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0) return;

    setIsLoading(true);
    setError(null);

    try {
      await requestVerificationCode(handleId);
      setResendCooldown(60); // Reset 60 second cooldown
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to resend verification code");
    } finally {
      setIsLoading(false);
    }
  }, [handleId, resendCooldown]);

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await loginWithCode(handleId, parseInt(verificationCode));
      setStep("success");

      // Wait a moment to show success, then call onSuccess
      setTimeout(() => {
        onSuccess(result.user);
        resetAndClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const resetAndClose = () => {
    setStep("handle");
    setHandleId("");
    setVerificationCode("");
    setError(null);
    setResendCooldown(0);
    onClose();
  };

  const handleCodeInput = (value: string) => {
    // Only allow numbers and max 6 digits
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(cleaned);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={resetAndClose}
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
          <div className="bg-dark-900 rounded-2xl border border-dark-700 p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-500/20 flex items-center justify-center overflow-hidden">
                  <img
                    src="/icons/very_logo.png"
                    alt="VeryChat"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Connect with VeryChat
                  </h3>
                  <p className="text-xs text-dark-400">
                    Authenticate using your VeryChat account
                  </p>
                </div>
              </div>
              <button
                onClick={resetAndClose}
                className="p-2 rounded-lg hover:bg-dark-700 transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step === "handle" ? "bg-accent-500" : "bg-accent-500"
                }`}
              />
              <div
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step === "code" || step === "success"
                    ? "bg-accent-500"
                    : "bg-dark-700"
                }`}
              />
              <div
                className={`flex-1 h-1 rounded-full transition-colors ${
                  step === "success" ? "bg-accent-500" : "bg-dark-700"
                }`}
              />
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              {step === "handle" && (
                <motion.div
                  key="handle"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      VeryChat Handle
                    </label>
                    <input
                      type="text"
                      value={handleId}
                      onChange={(e) => setHandleId(e.target.value)}
                      placeholder="@yourusername"
                      className="input-field"
                      autoFocus
                    />
                    <p className="text-xs text-dark-500 mt-2">
                      Enter your VeryChat handle ID. A verification code will be
                      sent to your VeryChat.
                    </p>
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                      {error}
                    </p>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleRequestCode}
                    disabled={isLoading || !handleId.trim()}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl 
                             bg-accent-500 text-white font-medium
                             disabled:opacity-50 disabled:cursor-not-allowed
                             hover:bg-accent-400 transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {step === "code" && (
                <motion.div
                  key="code"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={verificationCode}
                      onChange={(e) => handleCodeInput(e.target.value)}
                      placeholder="000000"
                      className="input-field text-center text-2xl tracking-[0.5em] font-mono"
                      maxLength={6}
                      autoFocus
                    />
                    <p className="text-xs text-dark-500 mt-2">
                      Check your VeryChat for the 6-digit code sent to{" "}
                      <span className="text-accent-400">
                        @{handleId.replace("@", "")}
                      </span>
                    </p>
                  </div>

                  {error && (
                    <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setStep("handle");
                        setVerificationCode("");
                        setError(null);
                      }}
                      className="flex-1 py-3 rounded-xl bg-dark-700 text-dark-300 font-medium
                               hover:bg-dark-600 transition-colors"
                    >
                      Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleVerifyCode}
                      disabled={isLoading || verificationCode.length !== 6}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl 
                               bg-accent-500 text-white font-medium
                               disabled:opacity-50 disabled:cursor-not-allowed
                               hover:bg-accent-400 transition-colors"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <span>Verify & Connect</span>
                      )}
                    </motion.button>
                  </div>

                  <button
                    onClick={handleResendCode}
                    disabled={isLoading || resendCooldown > 0}
                    className={`w-full text-sm transition-colors ${
                      resendCooldown > 0
                        ? "text-dark-500 cursor-not-allowed"
                        : "text-dark-400 hover:text-accent-400"
                    }`}
                  >
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Didn't receive code? Send again"}
                  </button>
                </motion.div>
              )}

              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 
                             flex items-center justify-center"
                  >
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </motion.div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Connected Successfully!
                  </h4>
                  <p className="text-sm text-dark-400">
                    Welcome to VeTerex. Start tracking your media journey!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
