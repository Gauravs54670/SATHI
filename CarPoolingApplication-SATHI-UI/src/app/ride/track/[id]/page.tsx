"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { fetchRideRequestUpdates, fetchRideAcceptedDrivers, fetchRideOtp, RideRequestUpdatesDTO, RideAcceptedDriverDTO, cancelRideRequest } from "@/lib/api";
import Toast, { ToastType } from "@/components/Toast";

export default function PassengerTrackPage() {
  const { id } = useParams();
  const router = useRouter();
  const rideRequestId = parseInt(id as string);

  const [request, setRequest] = useState<RideRequestUpdatesDTO | null>(null);
  const [driver, setDriver] = useState<RideAcceptedDriverDTO | null>(null);
  const [otp, setOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: ToastType }>({
    show: false,
    msg: "",
    type: "INFO"
  });

  const triggerToast = useCallback((msg: string, type: ToastType) => {
    setToast({ show: true, msg, type });
  }, []);

  const fetchData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const updates = await fetchRideRequestUpdates();
      const currentReq = updates.find(r => r.rideRequestedId === rideRequestId);

      if (!currentReq) {
        setError("Ride request not found or no longer active.");
        return;
      }

      setRequest(currentReq);

      // Fetch driver details if not already fetched
      if (!driver && 
         (currentReq.rideRequestStatus === 'ACCEPTED' || 
          currentReq.rideRequestStatus === 'DRIVER_REACHED_PICKUP_LOCATION' || 
          currentReq.rideRequestStatus === 'ONBOARDED')) {
        const drivers = await fetchRideAcceptedDrivers(rideRequestId);
        if (drivers && drivers.length > 0) {
          setDriver(drivers[0]);
        }
      }

      // Check for Arrival / OTP
      // Fix: ONLY fetch OTP if status is specifically DRIVER_REACHED...
      if (currentReq.rideRequestStatus === 'DRIVER_REACHED_PICKUP_LOCATION') {
        if (!otp) {
          const fetchedOtp = await fetchRideOtp(rideRequestId);
          setOtp(fetchedOtp);
        }
      } else {
        setOtp(null);
      }

      // If ride is started or completed, redirect to appropriate view or show message
      if (currentReq.rideStatus === 'RIDE_STARTED' || currentReq.rideStatus === 'RIDE_IN_PROGRESS') {
        // Passenger is now on board
      }

    } catch (err: any) {
      console.error("Tracking fetch error", err);
      if (isInitial) setError("Failed to synchronize tracking data.");
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [rideRequestId, driver, otp]);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(), 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await cancelRideRequest(rideRequestId);
      triggerToast("Booking cancelled successfully", "SUCCESS");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (err: any) {
      triggerToast(err.message || "Failed to cancel booking", "ERROR");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing with Satelite...</p>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-bg-app">
        <Navbar />
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-2 italic">Tracking Unavailable</h2>
          <p className="text-slate-400 mb-8 font-medium">{error || "Could not find ride details."}</p>
          <button onClick={() => router.push("/dashboard")} className="sathi-btn">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-app">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header: Driver Info */}
        <div className="animate-fade-in-up">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div className="flex items-center gap-4">
                 <button 
                   onClick={() => router.back()}
                   className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all group"
                 >
                   <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                   </svg>
                 </button>
                 <div>
                    <h1 className="text-2xl font-black text-white tracking-tightest flex items-center gap-3">
                      Track Ride 
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] uppercase tracking-widest border ${
                        request.rideRequestStatus === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}>
                        {request.rideRequestStatus}
                      </span>
                    </h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Request ID: #{rideRequestId}</p>
                 </div>
              </div>

              {driver && (
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 shadow-xl">
                   <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 overflow-hidden">
                      {driver.driverProfileUrl ? (
                        <img src={driver.driverProfileUrl} alt={driver.driverName} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                   </div>
                   <div>
                      <p className="text-sm font-black text-white leading-none mb-1">{driver.driverName}</p>
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{driver.vehicleModel} • {driver.vehicleNumber}</p>
                   </div>
                </div>
              )}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
           {/* Map Section */}
           <div className="lg:col-span-2 space-y-6 animate-fade-in-up-delay">
              <div className="glass-card h-[500px] relative overflow-hidden group">
                 {/* Map Placeholder */}
                 <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-10 text-center">
                    <div className="w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 animate-pulse">
                       <svg className="w-10 h-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                       </svg>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">Live GPS Tracking</h3>
                    <p className="text-slate-500 text-sm max-w-xs font-medium">Coming soon: View your driver's real-time position on the map.</p>
                    
                    <div className="mt-8 flex gap-3 text-xs font-black uppercase tracking-widest">
                       <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          {request.passengerSourceLocation.split(',')[0]}
                       </div>
                       <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-rose-500" />
                          {request.passengerDestinationLocation.split(',')[0]}
                       </div>
                    </div>
                 </div>
                 <div className="absolute inset-0 pointer-events-none border-2 border-white/5 group-hover:border-indigo-500/20 transition-colors duration-500" />
              </div>

              {/* Ride Details Card */}
              <div className="glass-card p-8 grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/5">
                 <div className="space-y-6">
                    <div>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Pickup Location</span>
                       <p className="text-white font-bold leading-relaxed">{request.passengerSourceLocation}</p>
                    </div>
                    <div>
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Destination</span>
                       <p className="text-white font-bold leading-relaxed">{request.passengerDestinationLocation}</p>
                    </div>
                 </div>
                 <div className="pt-6 md:pt-0 md:pl-8 space-y-6">
                    <div className="flex justify-between items-center">
                       <div>
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Total Fare</span>
                          <p className="text-2xl font-black text-white">₹{request.estimatedFare.toFixed(0)}</p>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Seats</span>
                          <p className="text-lg font-black text-white">{request.requestedSeats} Seat{request.requestedSeats > 1 ? 's' : ''}</p>
                       </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                             <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                             </svg>
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Scheduled For</p>
                             <p className="text-sm font-bold text-white">{new Date(request.rideDepartureTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* Side Section: OTP & Status */}
           <div className="space-y-6 animate-fade-in-up-delay-2">
              <div className="glass-card p-8 border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent">
                 <div className="text-center space-y-6">
                    <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">OTP Verification</h3>
                    
                    {request.rideRequestStatus === 'ONBOARDED' ? (
                       <div className="space-y-6 animate-zoom-in text-center">
                          <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                             <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                             </svg>
                          </div>
                          <div className="space-y-2">
                             <p className="text-xl font-black text-white italic">You're Checked In!</p>
                             <p className="text-xs text-slate-400 font-medium">Sit back and relax. Your journey with {driver?.driverName} has officially begun.</p>
                          </div>
                       </div>
                    ) : otp ? (
                       <div className="space-y-6 animate-zoom-in">
                          <div className="py-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl relative overflow-hidden group">
                             <div className="absolute inset-0 bg-emerald-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                             <p className="relative text-5xl font-black text-white tracking-[0.3em] ml-[0.3em] drop-shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                                {otp}
                             </p>
                          </div>
                          <div className="space-y-2">
                             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Driver Reached Pickup</span>
                             </div>
                             <p className="text-xs text-slate-400 font-medium">Share this code with your driver to officially begin the ride.</p>
                          </div>
                       </div>
                    ) : (
                       <div className="space-y-8 py-4 opacity-70">
                          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
                             <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                             </svg>
                          </div>
                          <div className="space-y-3">
                             <p className="text-slate-300 font-bold uppercase tracking-tight text-sm">Waiting for Arrival</p>
                             <p className="text-xs text-slate-500 leading-relaxed mx-auto max-w-[200px]">Your 4-digit OTP will be securely shared here once your driver Reaches your location.</p>
                          </div>
                       </div>
                    )}
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="glass-card p-6 space-y-4">
                 <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 px-1">Need Assistance?</h4>
                 <div className="grid grid-cols-2 gap-4">
                    <button 
                       onClick={() => driver && window.open(`sms:${driver.driverPhoneNumber}`)}
                       className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex flex-col items-center gap-2"
                    >
                       <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                       </svg>
                       <span className="text-[9px] font-black uppercase tracking-widest">Message</span>
                    </button>
                    <button 
                       onClick={() => driver && window.open(`tel:${driver.driverPhoneNumber}`)}
                       className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex flex-col items-center gap-2"
                    >
                       <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                       </svg>
                       <span className="text-[9px] font-black uppercase tracking-widest">Call</span>
                    </button>
                 </div>
                 
                 <button 
                    onClick={handleCancel}
                    className="w-full py-4 rounded-2xl bg-rose-500/5 text-rose-500 border border-rose-500/20 hover:bg-rose-500/10 text-[10px] font-black uppercase tracking-widest transition-all"
                 >
                    Cancel Booking
                 </button>
              </div>

              {/* Tips Section */}
              <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20">
                 <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                       <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                    </div>
                    <div className="space-y-1">
                       <h5 className="text-white text-xs font-bold uppercase tracking-tight">SATHI Safety Tip</h5>
                       <p className="text-[10px] text-slate-400 leading-relaxed font-black opacity-80 uppercase tracking-tighter">Only share your OTP once you are safely inside the vehicle and have verified the driver's details.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>

      <Toast 
        isVisible={toast.show}
        message={toast.msg}
        type={toast.type}
        onClose={() => setToast(t => ({ ...t, show: false }))}
      />
    </div>
  );
}
