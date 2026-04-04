"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { uploadProfilePhoto } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";

export default function ProfilePage() {
  const { user, isLoggedIn, isLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/dashboard");
    }
  }, [isLoading, isLoggedIn, router]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload to backend
    setUploading(true);
    setUploadSuccess(false);
    try {
      await uploadProfilePhoto(file);
      await refreshProfile();
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error("Upload failed:", err);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const hasPhoto = !!user.profilePictureUrl || !!preview;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold text-white mb-6">My Profile</h1>

          {/* Profile Card */}
          <div className="glass-card p-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <Avatar
                  name={user.userFullName}
                  email={user.email}
                  imageUrl={preview || user.profilePictureUrl}
                  size={120}
                  className="ring-4 ring-indigo-500/20"
                />
                {/* Upload overlay on hover */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              {/* Name */}
              <h2 className="text-xl font-semibold text-white mt-4">{user.userFullName}</h2>
              <p className="text-slate-400 text-sm">{user.email}</p>

              {/* Upload Button — with clear hover effect */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-4 px-5 py-2 rounded-lg text-sm font-medium cursor-pointer
                  bg-indigo-500/10 text-indigo-400 border border-indigo-500/20
                  transition-all duration-200 flex items-center gap-2
                  hover:bg-indigo-500/20 hover:border-indigo-500/40
                  hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10
                  active:translate-y-0
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {hasPhoto ? "Change Photo" : "Upload Photo"}
                  </>
                )}
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Success message */}
              {uploadSuccess && (
                <p className="mt-2 text-sm text-emerald-400 animate-fade-in-up">
                  ✓ Photo updated successfully!
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-white/5 mb-6" />

            {/* Account Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Account Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Full Name</p>
                  <p className="text-white font-medium">{user.userFullName}</p>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Email</p>
                  <p className="text-white font-medium">{user.email}</p>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Phone</p>
                  <p className="text-white font-medium">{user.phoneNumber}</p>
                </div>
                <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                  <p className="text-xs text-slate-500 mb-1">Account Status</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    user.userAccountStatus === "ACTIVE"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {user.userAccountStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/5 my-6" />

            {/* Account Info (moved from dashboard) */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Account Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Status:</span>
                  <span className="ml-2 text-emerald-400 font-medium">{user.userAccountStatus}</span>
                </div>
                <div>
                  <span className="text-slate-400">Email:</span>
                  <span className="ml-2 text-white">{user.email}</span>
                </div>
                <div>
                  <span className="text-slate-400">Phone:</span>
                  <span className="ml-2 text-white">{user.phoneNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400">Member Since:</span>
                  <span className="ml-2 text-white">
                    {new Date(user.accountCratedAt).toLocaleDateString("en-IN", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Back to dashboard — with clear hover effect */}
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 w-full py-2.5 rounded-lg text-sm text-slate-400 cursor-pointer
                border border-white/5
                transition-all duration-200
                hover:border-indigo-500/30 hover:text-white hover:bg-white/[0.03]
                hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5
                active:translate-y-0"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
