"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { fetchDriverRideHistory, DriverRideHistoryDTO, ratePassenger } from "@/lib/api";
import Toast from "@/components/Toast";
import RatingModal from "@/components/RatingModal";

export default function DriverHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<DriverRideHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "SUCCESS" | "ERROR" | "INFO"; isVisible: boolean }>({
    message: "",
    type: "SUCCESS",
    isVisible: false
  });
  const [expandedRide, setExpandedRide] = useState<number | null>(null);
  const [ratingTarget, setRatingTarget] = useState<{ rideId: number; rideRequestId: number; name: string } | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchDriverRideHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load ride history");
    } finally {
      setLoading(false);
    }
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
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Driver Console</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tightest">Driver History</h1>
            <p className="text-slate-400 font-medium mt-2">Track your past rides and earnings</p>
          </div>
          
          <button 
            onClick={loadHistory}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 text-white font-bold border border-white/10 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-64 animate-pulse border-white/5 bg-white/[0.02]" />
            ))}
          </div>
        ) : error ? (
            <div className="glass-card p-12 text-center border-red-500/20 bg-red-500/5 backdrop-blur-3xl">
                <h3 className="text-2xl font-black text-white mb-2 tracking-tighter">Failed to Load</h3>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto font-medium">{error}</p>
                <button onClick={loadHistory} className="px-10 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-400 transition-all shadow-xl shadow-red-500/20">Retry</button>
            </div>
        ) : history.length > 0 ? (
          <div className="space-y-8 animate-fade-in-up-delay">
            {history.map((ride, index) => (
              <div 
                key={ride.rideId} 
                className="glass-card border-white/5 hover:border-emerald-500/30 transition-all group overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Date</span>
                      <span className="text-xl font-black text-white">{new Date(ride.rideDate).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Earnings</p>
                      <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(ride.rideEarning)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y border-white/5 mb-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Started</p>
                      <p className="text-sm font-bold text-white">{new Date(ride.rideStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Ended</p>
                      <p className="text-sm font-bold text-white">{new Date(ride.rideEndedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Distance</p>
                      <p className="text-sm font-bold text-white">{ride.distanceCovered.toFixed(1)} km</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Passengers</p>
                      <p className="text-sm font-bold text-white">{ride.totalPassengersCount}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="relative pl-6">
                      <div className="absolute left-1 top-2 bottom-2 w-0.5 bg-gradient-to-b from-emerald-500 to-teal-500 opacity-20" />
                      <div className="relative mb-6">
                        <div className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Start Location</p>
                        <p className="text-sm text-slate-300 font-medium line-clamp-1">{ride.rideStartingAddress}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[22px] top-1 w-2.5 h-2.5 rounded-full bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">End Location</p>
                        <p className="text-sm text-slate-300 font-medium line-clamp-1">{ride.rideEndedAddress}</p>
                      </div>
                    </div>
                  </div>

                  {ride.joinedPassengers.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-white/5">
                      <button 
                        onClick={() => setExpandedRide(expandedRide === ride.rideId ? null : ride.rideId)}
                        className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors"
                      >
                        {expandedRide === ride.rideId ? 'Hide Passengers' : `View ${ride.joinedPassengers.length} Passengers`}
                        <svg className={`w-3.5 h-3.5 transition-transform ${expandedRide === ride.rideId ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {expandedRide === ride.rideId && (
                        <div className="mt-6 space-y-4 animate-slide-down">
                          {ride.joinedPassengers.map((p) => (
                            <div key={p.rideRequestId} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 font-bold border border-white/10 uppercase">
                                  {p.passengerName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{p.passengerName}</p>
                                  <p className="text-[10px] text-slate-500 font-medium">{p.requestedSeats} Seat{p.requestedSeats > 1 ? 's' : ''}</p>
                                </div>
                              </div>
                              <div className="flex flex-col sm:items-end text-left sm:text-right gap-3">
                                <div>
                                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Route</p>
                                  <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{p.passengerSourceLocation} → {p.passengerDestinationLocation}</p>
                                </div>
                                
                                {p.isRated ? (
                                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                                    Rated ✓
                                  </span>
                                ) : (
                                  <button 
                                    onClick={() => setRatingTarget({ rideId: ride.rideId, rideRequestId: p.rideRequestId, name: p.passengerName })}
                                    className="px-4 py-1.5 rounded-lg bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20"
                                  >
                                    Rate Passenger
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-20 text-center border-dashed border-white/5 bg-transparent">
            <h2 className="text-3xl font-black text-white mb-4 tracking-tightest">No history found</h2>
            <p className="text-slate-400 mb-12 max-w-sm mx-auto font-medium leading-relaxed italic">You haven't completed any rides as a driver yet.</p>
            <button 
              onClick={() => router.push("/ride/post")}
              className="px-12 py-5 bg-emerald-500 text-white font-black rounded-3xl hover:shadow-2xl transition-all"
            >
              Post a Ride
            </button>
          </div>
        )}
      </main>

      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />

      <RatingModal 
        isOpen={!!ratingTarget}
        onClose={() => setRatingTarget(null)}
        targetName={ratingTarget?.name || ""}
        title="Rate Passenger"
        onSubmit={async (rating, comment) => {
          if (!ratingTarget) return;
          try {
            await ratePassenger({ 
              rideId: ratingTarget.rideId, 
              rideRequestId: ratingTarget.rideRequestId, 
              rating, 
              comment 
            });
            setToast({ message: `Rated ${ratingTarget.name} successfully!`, type: "SUCCESS", isVisible: true });
            loadHistory(); // Refresh to update isRated flags
          } catch (err: any) {
            setToast({ message: err.message || "Failed to submit rating", type: "ERROR", isVisible: true });
            throw err;
          }
        }}
      />
    </div>
  );
}
