"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  fetchRideAcceptedPassengers, 
  RideAcceptedPassengerDTO, 
  notifyDriverReached, 
  verifyPassengerOtp, 
  cancelPickup 
} from "@/lib/api";
import { startLiveTracking, stopLiveTracking, isTrackingActive } from "@/lib/rideTracker";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";

export default function ActiveRidePage() {
  const { id } = useParams();
  const rideIdNum = typeof id === "string" ? Number(id) : 0;
  const router = useRouter();
  
  const [passengers, setPassengers] = useState<RideAcceptedPassengerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "SUCCESS" | "ERROR" | "INFO"; isVisible: boolean }>({
    message: "",
    type: "SUCCESS",
    isVisible: false
  });

  // OTP Verification State
  const [activePassenger, setActivePassenger] = useState<RideAcceptedPassengerDTO | null>(null);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!rideIdNum) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchRideAcceptedPassengers(rideIdNum);
        setPassengers(data);
        
        // Ensure tracking is started
        if (!isTrackingActive()) {
          startLiveTracking(rideIdNum);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load active ride data");
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Clean up tracking on unmount if needed? 
    // Usually tracking stays active unless the app closes or ride finishes, 
    // but for now we'll keep it active.
  }, [rideIdNum]);

  const reloadPassengers = async () => {
    try {
      const data = await fetchRideAcceptedPassengers(rideIdNum);
      setPassengers(data);
    } catch (err: any) {
      console.error("Failed to reload passenger data", err);
    }
  };

  const handleReachedPassenger = async (passenger: RideAcceptedPassengerDTO) => {
    try {
      setIsProcessing(true);
      await notifyDriverReached(rideIdNum, passenger.passengerRideRequestId);
      setActivePassenger(passenger);
      setIsOtpModalOpen(true);
      setToast({
        message: "Arrival marked. OTP sent to passenger.",
        type: "SUCCESS",
        isVisible: true
      });
    } catch (err: any) {
      setToast({
        message: err.message || "Failed to notify arrival",
        type: "ERROR",
        isVisible: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!activePassenger || otpValue.length < 4) return;
    try {
      setIsProcessing(true);
      await verifyPassengerOtp(rideIdNum, activePassenger.passengerRideRequestId, otpValue);
      setToast({
        message: `${activePassenger.passengerName} boarded successfully!`,
        type: "SUCCESS",
        isVisible: true
      });
      setIsOtpModalOpen(false);
      setOtpValue("");
      await reloadPassengers();
    } catch (err: any) {
      setToast({
        message: err.message || "Invalid OTP",
        type: "ERROR",
        isVisible: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPickup = async () => {
    if (!activePassenger) return;
    if (!confirm(`Are you sure you want to cancel the pickup for ${activePassenger.passengerName}?`)) return;
    try {
      setIsProcessing(true);
      await cancelPickup(rideIdNum, activePassenger.passengerRideRequestId);
      setToast({
        message: "Pickup cancelled successfully.",
        type: "SUCCESS",
        isVisible: true
      });
      setIsOtpModalOpen(false);
      await reloadPassengers();
    } catch (err: any) {
      setToast({
        message: err.message || "Failed to cancel pickup",
        type: "ERROR",
        isVisible: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-main">
        <Navbar />
        <div className="flex flex-col items-center justify-center pt-32">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest animate-pulse">Initializing Journey...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-main">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 pt-32 text-center text-white">
          <h1 className="text-4xl font-black mb-4">Error loading ride</h1>
          <p className="text-slate-400 mb-8">{error}</p>
          <button onClick={() => router.push('/dashboard')} className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all font-black uppercase tracking-widest text-xs">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-main pb-20">
      <Navbar />
      
      {/* Live Status Header */}
      <div className="relative w-full bg-gradient-to-b from-indigo-900/20 to-transparent pt-32 pb-12 px-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">En Route & Tracking Live</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Your Journey has Started</h1>
            <p className="text-slate-400 font-medium">Drive safe and keep the app open for real-time tracking.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="glass-card px-8 py-4 border-white/5 flex flex-col items-center">
              <span className="text-2xl font-black text-white">{passengers.length}</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Co-Riders</span>
            </div>
            <div className="glass-card px-8 py-4 border-white/5 flex flex-col items-center">
              <span className="text-2xl font-black text-white">L-1</span>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Level</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content: Passenger List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-4 text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] mb-4">
              <div className="h-px w-8 bg-indigo-500/50" />
              <span>Passengers to Pickup</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            <div className="space-y-6">
              {passengers.length === 0 ? (
                <div className="glass-card p-20 text-center border-white/5 bg-white/[0.01] flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                    <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-white font-black uppercase tracking-widest text-xs mb-2">No Passengers Found</h3>
                  <p className="text-slate-500 text-[10px] font-medium max-w-[200px] leading-relaxed">There are currently no confirmed passengers for this active ride.</p>
                </div>
              ) : (
                passengers.map((passenger) => (
                <div key={passenger.passengerRideRequestId} className="glass-card p-8 border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all group border-l-4 border-l-indigo-500">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* Passenger Identity */}
                    <div className="flex flex-col items-center gap-4 shrink-0">
                      {passenger.passengerProfilePicture ? (
                        <img 
                          src={passenger.passengerProfilePicture} 
                          className="w-20 h-20 rounded-3xl object-cover border-2 border-indigo-500/20 shadow-2xl"
                          alt={passenger.passengerName}
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-white/10 shadow-2xl">
                          <span className="text-3xl font-black text-indigo-400">{passenger.passengerName.charAt(0)}</span>
                        </div>
                      )}
                      <div className="text-center">
                        <h3 className="text-xl font-black text-white">{passenger.passengerName}</h3>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Verified Passenger</p>
                      </div>
                    </div>

                    {/* Pickup/Drop Details */}
                    <div className="flex-1 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="relative pl-6">
                            <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Pickup From</p>
                            <p className="text-white text-sm font-bold line-clamp-2 leading-relaxed">{passenger.passengerPickupLocation}</p>
                          </div>
                          <div className="relative pl-6">
                            <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-purple-500" />
                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Dropping At</p>
                            <p className="text-white text-sm font-bold line-clamp-2 leading-relaxed">{passenger.passengerDropLocation}</p>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center space-y-4 md:pl-8 md:border-l border-white/5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-black uppercase tracking-widest">Seats Booked</span>
                            <span className="text-white font-black">{passenger.numberOfSeats}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-black uppercase tracking-widest">Contact</span>
                            <span className="text-white font-black">{passenger.passengerPhone}</span>
                          </div>
                        </div>
                      </div>

                        <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                          <button 
                            onClick={() => window.open(`tel:${passenger.passengerPhone}`)}
                            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            Call
                          </button>
                          
                          {passenger.rideRequestStatus === 'ONBOARDED' ? (
                            <div className="px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ml-auto">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                              Boarded
                            </div>
                          ) : passenger.rideRequestStatus === 'DRIVER_REACHED_PICKUP_LOCATION' ? (
                            <button 
                              onClick={() => {
                                setActivePassenger(passenger);
                                setIsOtpModalOpen(true);
                              }}
                              className="px-6 py-3 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all ml-auto animate-pulse"
                            >
                              Verify OTP
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleReachedPassenger(passenger)}
                              disabled={isProcessing}
                              className="px-6 py-3 rounded-xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all ml-auto hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isProcessing ? "Processing..." : "Reached Pickup Point"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar: Map and Controls */}
          <div className="space-y-8">
            <div className="glass-card overflow-hidden">
               <div className="bg-white/5 p-4 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Visual Map</h3>
                  <div className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase">Alpha</div>
               </div>
               <div className="aspect-square relative bg-bg-card flex items-center justify-center group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900/10 to-transparent pointer-events-none" />
                  <div className="relative text-center p-8">
                     <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-8 h-8 text-indigo-500/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                     </div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest line-clamp-1">Route Visualization coming soon</p>
                  </div>
               </div>
            </div>

            <div className="glass-card p-6 space-y-4">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-4">Journey Controls</h3>
              <button 
                onClick={() => router.push('/dashboard')}
                className="w-full py-4 px-6 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3"
              >
                 Exit to Dashboard
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* OTP Modal */}
      {isOtpModalOpen && activePassenger && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isProcessing && setIsOtpModalOpen(false)} />
          <div className="relative w-full max-w-md glass-card p-10 border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center mx-auto">
                <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Boarding Verification</h2>
                <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-2 px-8">Ask {activePassenger.passengerName} for the 4-digit OTP</p>
              </div>

              <div className="pt-4">
                <input 
                  type="text"
                  maxLength={4}
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                  placeholder="0 0 0 0"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 text-center text-4xl font-black tracking-[0.5em] text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder:text-white/10"
                />
              </div>

              <div className="space-y-4 pt-4">
                <button 
                  onClick={handleVerifyOtp}
                  disabled={isProcessing || otpValue.length < 4}
                  className="w-full py-5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
                >
                  {isProcessing ? "Verifying..." : "Confirm Boarding"}
                </button>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsOtpModalOpen(false)}
                    disabled={isProcessing}
                    className="flex-1 py-4 bg-white/5 border border-white/10 text-slate-400 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCancelPickup}
                    disabled={isProcessing}
                    className="flex-1 py-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-red-500/20 transition-all"
                  >
                    Cancel Pickup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}

