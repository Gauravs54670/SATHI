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

      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-fade-in-up">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <button
              onClick={() => router.push("/profile/edit")}
              className="px-6 py-2 rounded-lg text-sm font-medium
                bg-white/10 text-white border border-white/10
                transition-all duration-300 hover:bg-white/15 hover:border-white/20
                flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column - Avatar & Info */}
            <div className="md:col-span-1 space-y-6">
              <div className="glass-card p-6 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />
                
                <div className="relative mt-6 group">
                  <Avatar
                    name={user.userFullName}
                    email={user.email}
                    imageUrl={preview || user.profilePictureUrl}
                    size={120}
                    className="ring-4 ring-bg-card shadow-xl"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center
                      opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <h2 className="text-xl font-bold text-white mt-4">{user.userFullName}</h2>
                <span className={`mt-2 sathi-badge ${user.userAccountStatus === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'text-amber-400'}`}>
                  {user.userAccountStatus} Account
                </span>

                {user.bio && (
                  <p className="text-slate-400 text-sm mt-4 italic">"{user.bio}"</p>
                )}

                {uploading && <p className="text-xs text-indigo-400 mt-3 animate-pulse">Uploading photo...</p>}
                {uploadSuccess && <p className="text-xs text-emerald-400 mt-3">Photo updated successfully!</p>}
              </div>

              {/* Stats Card */}
              <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">SATHI Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <span className="text-slate-300">Average Rating</span>
                    <div className="flex items-center gap-1 text-amber-400 font-medium">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      {user.averageRating?.toFixed(1) || "0.0"} <span className="text-xs text-slate-500">({user.totalRatingsCount || 0})</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Rides Completed</span>
                    <span className="text-indigo-400 font-medium">{user.totalRidesCompleted || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="md:col-span-2 space-y-6">
              
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Account Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                  <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                    <p className="text-xs text-slate-500 font-medium mb-1">Email</p>
                    <p className="text-white break-all">{user.email}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                    <p className="text-xs text-slate-500 font-medium mb-1">Phone Number</p>
                    <p className="text-white">{user.phoneNumber}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                    <p className="text-xs text-slate-500 font-medium mb-1">Gender</p>
                    <p className="text-white">{user.gender || "Not specified"}</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
                    <p className="text-xs text-slate-500 font-medium mb-1">Member Since</p>
                    <p className="text-white">
                      {new Date(user.accountCratedAt).toLocaleDateString("en-US", {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="sm:col-span-2 border-t border-white/5 pt-4 mt-2">
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Last Updated
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(user.accountUpdatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white mb-4">Emergency Contacts</h3>
                
                {(!user.emergencyContacts || user.emergencyContacts.length === 0) ? (
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 text-center">
                    <p className="text-slate-300 text-sm mb-3">No emergency contacts added yet.</p>
                    <button
                      onClick={() => router.push("/profile/edit")}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      + Add a Contact
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.emergencyContacts.map((contact, i) => (
                      <div key={contact.contactId || i} className="bg-white/[0.03] border border-white/5 rounded-lg p-4 hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white truncate max-w-[120px]">{contact.name}</p>
                            <span className="text-[10px] uppercase tracking-wider text-slate-500">Contact {i + 1}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300 mt-3 pt-3 border-t border-white/5">
                          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {contact.contact}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
