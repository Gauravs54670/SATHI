"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { sendOtpForEmailVerification, verifyEmailOtp } from "@/lib/api";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EmailVerificationModal({ isOpen, onClose, onSuccess }: EmailVerificationModalProps) {
  const { user, refreshProfile } = useAuth();
  
  const [step, setStep] = useState<"send" | "verify">("send");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("send");
      setOtp("");
      setError(null);
      setSuccessMsg(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    if (!user || !user.email) return;
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await sendOtpForEmailVerification(user.email);
      setStep("verify");
      setSuccessMsg("OTP sent to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await verifyEmailOtp(otp);
      setSuccessMsg("Email verified successfully!");
      await refreshProfile(); // Ensure UI knows we are ACTIVE now
      setTimeout(() => {
        onSuccess(); // Close and sequentially cascade to next step automatically
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Invalid OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-card w-full max-w-md p-8 animate-fade-in-up">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
          <p className="text-slate-400 text-sm">
            {step === "send" 
              ? "Account verification is required before you can perform this action." 
              : "Enter the 6-digit OTP sent to your registered email address."}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
            {successMsg}
          </div>
        )}

        {step === "send" ? (
          <button
            onClick={handleSendOtp}
            disabled={isLoading}
            className="w-full py-3 px-4 flex justify-center items-center rounded-xl text-sm font-semibold
              bg-gradient-to-r from-indigo-500 to-purple-600 text-white
              hover:from-indigo-400 hover:to-purple-500
              transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              "Send OTP to Email"
            )}
          </button>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block tracking-wide text-indigo-300 text-xs font-bold mb-2 uppercase">
                Secure OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="000000"
                className="w-full bg-[#0a0a14]/50 border border-white/10 rounded-xl px-4 py-3
                  text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50
                  transition-all duration-300 tracking-[0.5em] text-center text-xl font-mono"
              />
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.length !== 6}
              className="w-full py-3 px-4 flex justify-center items-center rounded-xl text-sm font-semibold
                bg-gradient-to-r from-indigo-500 to-purple-600 text-white
                hover:from-indigo-400 hover:to-purple-500
                transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "Verify OTP"
              )}
            </button>
            <button
              onClick={handleSendOtp}
              disabled={isLoading}
              className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors bg-transparent pt-2"
            >
              Did not receive? Resend
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
