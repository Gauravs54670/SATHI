"use client";

import { useState } from "react";
import { changePassword, requestOtp, resetPassword } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export default function ChangePasswordModal({ isOpen, onClose, email }: ChangePasswordModalProps) {
  const { updateStoredPassword } = useAuth();
  
  // flow: 'change' | 'forgot' | 'otp' | 'success'
  const [flow, setFlow] = useState<'change' | 'forgot' | 'otp' | 'success'>('change');
  
  // Form values
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setOtp("");
    setError("");
    setMessage("");
  };

  const handleClose = () => {
    resetForm();
    setFlow('change');
    onClose();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await changePassword({ oldPassword, newPassword });
      updateStoredPassword(newPassword);
      setFlow("success");
      setMessage("Password changed successfully.");
      setTimeout(handleClose, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await requestOtp(email);
      setFlow("otp");
      setMessage("OTP sent to your email.");
    } catch (err: any) {
      setError(err.message || "Failed to request OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(email, otp, newPassword);
      updateStoredPassword(newPassword);
      setFlow("success");
      setMessage("Password reset successfully.");
      setTimeout(handleClose, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content animate-fade-in-up" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button top-right */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {flow === 'change' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Change Password</h2>
            <p className="text-slate-400 text-sm mb-6">Enter your old password and choose a new one.</p>
            
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Old Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="sathi-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="sathi-input"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`sathi-input ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]' : ''}`}
                  required
                  minLength={8}
                />
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Passwords do not match
                    </p>
                )}
              </div>
              
              <button 
                type="submit" 
                disabled={loading || (confirmPassword.length > 0 && newPassword !== confirmPassword)}
                className="sathi-btn mt-6 hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : "Apply Changes"}
              </button>
            </form>
            
            <div className="mt-4 text-center">
              <button 
                onClick={() => { resetForm(); setFlow('forgot'); }}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
                type="button"
              >
                Forgot Password?
              </button>
            </div>
          </div>
        )}

        {flow === 'forgot' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Forgot Password</h2>
            <p className="text-slate-400 text-sm mb-6">We'll send an OTP to your email: <span className="text-white">{email}</span></p>
            
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}
            
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <button 
                type="submit" 
                disabled={loading}
                className="sathi-btn"
              >
                {loading ? "Sending..." : "Request OTP"}
              </button>
            </form>
            
            <button 
              onClick={() => { resetForm(); setFlow('change'); }}
              className="mt-4 w-full text-center text-slate-400 hover:text-white text-sm font-medium transition-colors"
              type="button"
            >
              Back to Change Password
            </button>
          </div>
        )}

        {flow === 'otp' && (
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-emerald-400 text-sm mb-6">{message}</p>
            
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">{error}</div>}
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Enter OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="sathi-input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="sathi-input"
                  required
                  minLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`sathi-input ${confirmPassword && newPassword !== confirmPassword ? 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.2)]' : ''}`}
                  required
                  minLength={8}
                />
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Passwords do not match
                    </p>
                )}
              </div>
              
              <button 
                type="submit" 
                disabled={loading || (confirmPassword.length > 0 && newPassword !== confirmPassword)}
                className="sathi-btn mt-6 hover:shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          </div>
        )}

        {flow === 'success' && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
            <p className="text-slate-400">{message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
