"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { fetchRideRequestUpdates, RideRequestUpdatesDTO } from "@/lib/api";

export default function MyRideRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RideRequestUpdatesDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchRideRequestUpdates();
      setRequests(data);
    } catch (err: any) {
      setError(err.message || "Failed to load ride requests");
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: "from-amber-400/20 to-amber-600/20 text-amber-400 border-amber-400/30",
    ACCEPTED: "from-emerald-400/20 to-emerald-600/20 text-emerald-400 border-emerald-400/30",
    REJECTED: "from-rose-400/20 to-rose-600/20 text-rose-400 border-rose-400/30",
    CANCELLED: "from-slate-400/20 to-slate-600/20 text-slate-400 border-slate-400/30",
    COMPLETED: "from-indigo-400/20 to-indigo-600/20 text-indigo-400 border-indigo-400/30",
  };

  const rideStatusColors: Record<string, string> = {
    RIDE_POSTED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    RIDE_IN_PROGRESS: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse",
    RIDE_COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    RIDE_FULL: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-bg-app selection:bg-indigo-500/30">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button 
                  onClick={() => router.push("/dashboard")}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all shadow-xl group"
              >
                  <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
              </button>
              <div className="h-px w-8 bg-white/10" />
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Passenger Dashboard</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tightest">My Ride Requests</h1>
            <p className="text-slate-400 font-medium mt-2">Manage your current bookings and track ride progress</p>
          </div>
          
          <button 
            onClick={loadRequests}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-white font-bold border border-white/10 hover:bg-white/10 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] active:scale-95 disabled:opacity-50"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {loading && requests.length === 0 ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-64 animate-pulse border-white/5 bg-white/[0.02]" />
            ))}
          </div>
        ) : error ? (
            <div className="glass-card p-12 text-center border-red-500/20 bg-red-500/5 backdrop-blur-3xl animate-fade-in-up">
                <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-black text-white mb-2 tracking-tighter">Connection Error</h3>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto font-medium">{error}</p>
                <button onClick={loadRequests} className="px-10 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-400 transition-all shadow-xl shadow-red-500/20">Retry Connection</button>
            </div>
        ) : requests.length > 0 ? (
          <div className="space-y-8 animate-fade-in-up-delay">
            {requests.map((req, index) => (
              <div 
                key={req.rideRequestedId} 
                className="glass-card flex flex-col md:flex-row overflow-hidden border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Visual Status Indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${statusColors[req.rideRequestStatus.toUpperCase()]?.split(' ')[0]}`} />
                
                {/* Left Section: Time & Person */}
                <div className="p-8 md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 bg-white/[0.01]">
                   <div className="flex items-start justify-between mb-8">
                        <div>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Departure</p>
                             <div className="flex flex-col">
                                <span className="text-2xl font-black text-white tracking-tighter">
                                    {new Date(req.rideDepartureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-xs font-bold text-slate-400">
                                    {new Date(req.rideDepartureTime).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                </span>
                             </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${rideStatusColors[req.rideStatus] || 'bg-white/5 text-slate-500 border-white/10'}`}>
                            {req.rideStatus.replace('RIDE_', '')}
                        </div>
                   </div>

                   <div className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Driver</span>
                            <span className="text-sm font-bold text-white tracking-tight">{req.driverName}</span>
                        </div>
                   </div>
                </div>

                {/* Middle Section: Route */}
                <div className="p-8 flex-1">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between mb-8">
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                {req.requestedSeats} Seat{req.requestedSeats > 1 ? 's' : ''} Requested
                            </span>
                            <span className="text-xl font-black text-white">{formatCurrency(req.estimatedFare)}</span>
                        </div>

                        <div className="relative pl-8 space-y-8 flex-1">
                            {/* The Route Path Line */}
                            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-indigo-500 via-indigo-500/50 to-rose-500/50" />
                            
                            <div className="relative">
                                <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                    <div className="w-2 h-2 rounded-full bg-white" />
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Pickup Location</p>
                                <p className="text-white font-bold leading-tight line-clamp-2">{req.passengerSourceLocation}</p>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                                    <div className="w-2 h-2 rounded-full bg-white transition-all scale-75" />
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Drop-off Location</p>
                                <p className="text-white font-bold leading-tight line-clamp-2">{req.passengerDestinationLocation}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Request Status */}
                <div className="p-8 md:w-1/4 flex flex-col justify-center items-center gap-4 bg-white/[0.01] border-t md:border-t-0 md:border-l border-white/5">
                    <div className={`w-full flex flex-col items-center py-6 px-4 rounded-3xl border bg-gradient-to-b shadow-xl ${statusColors[req.rideRequestStatus.toUpperCase()] || "bg-white/5 text-slate-500 border-white/10"}`}>
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] mb-3 opacity-70">Request Status</span>
                        <span className="text-lg font-black tracking-tightest">{req.rideRequestStatus}</span>
                        
                        {req.isDriverReachedPickupLocation && req.rideRequestStatus === "ACCEPTED" && (
                             <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 text-[9px] font-bold text-white border border-white/20 animate-bounce">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                                DRIVER HAS ARRIVED
                             </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col items-center gap-1 opacity-40">
                         <p className="text-[9px] font-black uppercase tracking-widest">Req ID</p>
                         <p className="text-xs font-mono text-white">#{req.rideRequestedId}</p>
                    </div>
                    {req.numberOfRequests && req.numberOfRequests > 1 && (
                         <div className="mt-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                             Attempt #{req.numberOfRequests}
                         </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-20 text-center animate-fade-in-up border-dashed border-white/5 bg-transparent overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5" />
            <div className="w-28 h-28 rounded-[2.5rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-10 shadow-3xl overflow-hidden relative group">
                <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <svg className="w-12 h-12 text-indigo-400 group-hover:scale-110 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tightest">No active requests</h2>
            <p className="text-slate-400 mb-12 max-w-sm mx-auto font-medium leading-relaxed italic">"The best journeys are the ones you haven't taken yet."</p>
            <button 
              onClick={() => router.push("/rides/available")}
              className="px-12 py-5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-500 bg-[length:200%] bg-left hover:bg-right text-white font-black rounded-3xl hover:shadow-[0_20px_50px_rgba(99,102,241,0.4)] transition-all duration-700 active:scale-[0.98]"
            >
              Find a Ride
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

