"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { fetchPassengerRideHistory, PassengerRideHistoryDTO, rateDriver } from "@/lib/api";
import Toast from "@/components/Toast";
import RatingModal from "@/components/RatingModal";

export default function PassengerHistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<PassengerRideHistoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "SUCCESS" | "ERROR" | "INFO"; isVisible: boolean }>({
    message: "",
    type: "SUCCESS",
    isVisible: false
  });
  const [ratingTarget, setRatingTarget] = useState<{ rideId: number; rideRequestId: number; name: string } | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPassengerRideHistory();
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
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">History</span>
            </div>
            <h1 className="text-5xl font-black text-white tracking-tightest">Passenger History</h1>
            <p className="text-slate-400 font-medium mt-2">View your past journeys and outcomes</p>
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
              <div key={i} className="glass-card h-40 animate-pulse border-white/5 bg-white/[0.02]" />
            ))}
          </div>
        ) : error ? (
            <div className="glass-card p-12 text-center border-red-500/20 bg-red-500/5 backdrop-blur-3xl">
                <h3 className="text-2xl font-black text-white mb-2 tracking-tighter">Failed to Load</h3>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto font-medium">{error}</p>
                <button onClick={loadHistory} className="px-10 py-4 bg-red-500 text-white rounded-2xl font-black hover:bg-red-400 transition-all shadow-xl shadow-red-500/20">Retry</button>
            </div>
        ) : history.length > 0 ? (
          <div className="space-y-6 animate-fade-in-up-delay">
            {history.map((item, index) => (
              <div 
                key={item.rideRequestId} 
                className="glass-card p-6 border-white/5 hover:border-indigo-500/30 transition-all group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Driver</p>
                      <h3 className="text-lg font-bold text-white">{item.driverName}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Seats</p>
                    <p className="text-lg font-bold text-white">{item.requestedSeats}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <p className="text-sm text-slate-300 font-medium">{item.boardingLocation}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                    <p className="text-sm text-slate-300 font-medium">{item.dropOffLocation}</p>
                  </div>

                  <div className="pt-4 flex justify-end">
                    {item.isRated ? (
                      <span className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                        Driver Rated ✓
                      </span>
                    ) : (
                      <button 
                        onClick={() => setRatingTarget({ rideId: item.rideId, rideRequestId: item.rideRequestId, name: item.driverName })}
                        className="px-6 py-2.5 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-xl shadow-indigo-500/20"
                      >
                        Rate Driver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-20 text-center border-dashed border-white/5 bg-transparent">
            <h2 className="text-3xl font-black text-white mb-4 tracking-tightest">No history found</h2>
            <p className="text-slate-400 mb-12 max-w-sm mx-auto font-medium leading-relaxed italic">Your completed and rejected rides will appear here.</p>
            <button 
              onClick={() => router.push("/rides/available")}
              className="px-12 py-5 bg-indigo-500 text-white font-black rounded-3xl hover:shadow-2xl transition-all"
            >
              Find a Ride
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
        title="Rate Driver"
        onSubmit={async (rating, comment) => {
          if (!ratingTarget) return;
          try {
            await rateDriver({ 
              rideId: ratingTarget.rideId, 
              rideRequestId: ratingTarget.rideRequestId, 
              rating, 
              comment 
            });
            setToast({ message: `Rated ${ratingTarget.name} successfully!`, type: "SUCCESS", isVisible: true });
            loadHistory();
          } catch (err: any) {
            setToast({ message: err.message || "Failed to submit rating", type: "ERROR", isVisible: true });
            throw err;
          }
        }}
      />
    </div>
  );
}
