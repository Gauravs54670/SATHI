"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Avatar from "@/components/Avatar";
import { fetchDriverProfile } from "@/lib/api";

export default function DriverProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchDriverProfile();
        if (mounted) setProfile(data);
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Driver profile not found");
          // If not found or not driver, redirect to registration smoothly
          if (err.message?.toLowerCase().includes("not found")) {
            router.push("/driver/register");
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium text-sm">Back to Dashboard</span>
          </button>
          
          {profile && (
            <button
               onClick={() => router.push("/driver/update")}
               className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
               Update Driver Profile
            </button>
          )}
        </div>

        <div className="glass-card p-0 animate-fade-in-up relative overflow-hidden">
          {/* Header Gradient */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 relative">
             <div className="absolute inset-0 bg-black/20" />
          </div>
          
          <div className="px-8 pb-8 relative">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-400">Loading your driving profile...</p>
              </div>
            ) : error && !profile ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-bold text-white mb-2">Profile Unavailable</h3>
                <p className="text-slate-400">{error}</p>
              </div>
            ) : profile ? (
              <>
                {/* Floating Avatar / Status */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end -mt-16 mb-8 gap-4 px-2">
                  <div className="flex items-end gap-5">
                    <Avatar
                      name={profile.userFullName}
                      email={profile.email}
                      imageUrl={profile.driverProfileUrl}
                      size={100}
                      className="border-4 border-[#0f0f1a] shadow-xl"
                    />
                    <div className="pb-1">
                       <h1 className="text-2xl font-bold text-white">{profile.userFullName}</h1>
                       <p className="text-indigo-300 text-sm mb-2 opacity-90">{profile.email} • {profile.phoneNumber}</p>
                       <div className="flex gap-2 mt-2">
                         <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                           profile.driverVerificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                         }`}>
                           {profile.driverVerificationStatus || 'PENDING'}
                         </span>
                         <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-400">
                           {profile.driverAvailabilityStatus || 'ONLINE'}
                         </span>
                       </div>
                    </div>
                  </div>
                  <div className="md:pb-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                     <p className="text-slate-400 text-xs uppercase tracking-wider mb-0.5">Driver ID</p>
                     <p className="text-white font-mono font-bold text-lg">#{profile.driverProfileId}</p>
                  </div>
                </div>

                {/* Profile Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Vehicle Details */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-200 border-b border-white/10 pb-2">Vehicle Information</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-slate-400 text-sm">Vehicle Model</span>
                        <span className="text-white font-medium">{profile.vehicleModel}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-slate-400 text-sm">Vehicle Number</span>
                        <span className="text-emerald-400 font-mono font-bold tracking-wider px-2 py-0.5 bg-emerald-500/10 rounded">{profile.vehicleNumber}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-slate-400 text-sm">Seat Capacity</span>
                        <span className="text-white font-medium">{profile.vehicleSeatCapacity} Seats</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                          <p className="text-slate-500 text-xs mb-1">Category</p>
                          <p className="text-indigo-300 font-bold text-sm tracking-wide">{profile.vehicleCategory}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
                          <p className="text-slate-500 text-xs mb-1">Class</p>
                          <p className="text-purple-300 font-bold text-sm tracking-wide">{profile.vehicleClass}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Driver License & Stats */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold text-slate-200 border-b border-white/10 pb-2">Driver Credentials</h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-slate-400 text-sm">License Number</span>
                        <span className="text-white font-mono">{profile.driverLicenseNumber}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-slate-400 text-sm">Expiration Date</span>
                        <span className="text-white font-medium">{profile.licenseExpirationDate}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                        <span className="text-slate-400 text-sm">Registered</span>
                        <span className="text-white font-medium">
                          {profile.accountCreatedAt ? new Date(profile.accountCreatedAt).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}
                        </span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Full Width Driving Statistics Section */}
                <div className="mt-10">
                  <h3 className="text-lg font-bold text-slate-200 border-b border-white/10 pb-2 mb-6">Driving Statistics</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 flex flex-col justify-center">
                      <p className="text-slate-400 text-xs text-center uppercase tracking-wider">Rides Completed</p>
                      <p className="text-4xl font-bold text-indigo-400 mt-2 text-center">{profile.totalCompletedRides || 0}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20 flex flex-col justify-center">
                      <p className="text-slate-400 text-xs text-center uppercase tracking-wider">Cancelled Rides</p>
                      <p className="text-4xl font-bold text-red-400 mt-2 text-center">{profile.totalCancelledRides || 0}</p>
                    </div>
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 flex flex-col justify-center text-center">
                      <p className="text-slate-400 text-xs text-center uppercase tracking-wider">Overall Rating</p>
                      <p className="text-4xl font-bold text-amber-400 mt-2 flex items-baseline justify-center gap-2">
                        {profile.averageRating > 0 ? profile.averageRating.toFixed(1) : "—"}
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      </p>
                      <p className="text-[10px] text-slate-500 text-center mt-2 uppercase tracking-wider">Based on {profile.totalRatingsCount || 0} reviews</p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}
