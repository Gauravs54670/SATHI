"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchRideRequests, RideAllBookingRequestsDTO, acceptRideRequest, rejectRideRequest, fetchRideAcceptedPassengers, RideAcceptedPassengerDTO, startRide } from "@/lib/api";
import { startLiveTracking, isTrackingActive } from "@/lib/rideTracker";
import Navbar from "@/components/Navbar";

export default function RideRequestsPage() {
  const { id } = useParams();
  const rideIdNum = typeof id === "string" ? Number(id) : 0;
  const router = useRouter();
  const [requests, setRequests] = useState<RideAllBookingRequestsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [successId, setSuccessId] = useState<number | null>(null); 
  const [acceptedDetails, setAcceptedDetails] = useState<RideAcceptedPassengerDTO[]>([]);
  const [loadingAccepted, setLoadingAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchRideRequests(rideIdNum);
      setRequests(data);
      
      // If ride is already in progress, show as started
      if (data.pendingRequests.length === 0 && data.acceptedPassengers.length > 0) {
        // We might want to check an explicit status field in the future
        // For now, if tracking is active globally, reflect it
        if (isTrackingActive()) setIsStarted(true);
      }
      
      // Fetch rich accepted details if there are confirmed passengers
      if (data.acceptedPassengers.length > 0) {
        setLoadingAccepted(true);
        try {
          const detailed = await fetchRideAcceptedPassengers(rideIdNum);
          setAcceptedDetails(detailed);
        } catch (err) {
          console.error("Failed to fetch detailed accepted passengers", err);
        } finally {
          setLoadingAccepted(false);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load ride requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadRequests();
  }, [id]);

  const handleAction = async (requestId: number, action: 'accept' | 'reject') => {
    setProcessingId(requestId);
    try {
      const msg = action === 'accept' 
        ? await acceptRideRequest(rideIdNum, requestId)
        : await rejectRideRequest(rideIdNum, requestId);
      
      setToast(msg);
      
      if (action === 'accept') {
        setSuccessId(requestId);
        // Delay the refresh slightly so user sees the success state
        setTimeout(async () => {
          await loadRequests();
          setSuccessId(null);
          setToast(null);
        }, 1500);
      } else {
        await loadRequests();
        setTimeout(() => setToast(null), 3000);
      }
      
    } catch (err: any) {
      setToast(err.message || `Failed to ${action} request`);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleStartRide = async () => {
    if (!rideIdNum) return;
    setIsStarting(true);
    try {
      const msg = await startRide(rideIdNum);
      setToast(msg);
      setIsStarted(true);
      
      // Start background GPS tracking
      startLiveTracking(rideIdNum);
      
      setTimeout(() => {
        setToast(null);
        router.push(`/ride/${rideIdNum}/active`);
      }, 1500);
    } catch (err: any) {
      setToast(err.message || "Failed to start ride");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsStarting(false);
    }
  };

  const pendingRequests = requests?.pendingRequests || [];
  const confirmedRequests = requests?.acceptedPassengers || [];

  const totalRequests = pendingRequests.length + confirmedRequests.length;

  if (loading && !requests) {
    return (
      <div className="min-h-screen bg-bg-main flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10 flex items-center justify-between">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-bold text-sm uppercase tracking-widest">Back to Dashboard</span>
          </button>

          <div className="text-right">
            <h1 className="text-3xl font-black text-white tracking-tight">Ride Sharing Requests</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Ride ID: #{id}</p>
          </div>
        </div>

        {error ? (
          <div className="glass-card p-12 text-center border-red-500/20">
            {/* Error view code... */}
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Oops! Something went wrong</h3>
            <p className="text-slate-400 mb-8">{error}</p>
            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400 transition-all">Try Again</button>
          </div>
        ) : totalRequests === 0 ? (
          <div className="glass-card p-20 text-center border-white/5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
            <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-indigo-500/20 animate-pulse">
                <svg className="w-12 h-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>
            <h2 className="text-3xl font-black text-white mb-3">Hi Driver! 👋</h2>
            <p className="text-slate-400 max-w-sm mx-auto font-medium text-lg italic leading-relaxed">
              "No ride requests yet for this journey. Sit tight, your SATHI is on the way!"
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* PENDING REQUESTS */}
            {pendingRequests.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">
                  <div className="h-px w-8 bg-indigo-500/30" />
                  <span>{pendingRequests.length} Pending Passengers</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                {pendingRequests.map((request) => (
                  <div key={request.rideRequestId} className="glass-card p-8 border-indigo-500/10 hover:border-indigo-500/30 transition-all group overflow-hidden relative">
                    {/* Success Overlay */}
                    {successId === request.rideRequestId && (
                      <div className="absolute inset-0 bg-emerald-500/95 z-50 flex flex-col items-center justify-center animate-fade-in">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 animate-bounce">
                          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-white font-black text-xl tracking-widest uppercase">Passenger Accepted!</p>
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="flex flex-col items-center gap-4 shrink-0">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-2xl">
                          <span className="text-3xl font-black text-white">{request.passengerName.charAt(0)}</span>
                        </div>
                        <div className="text-center">
                          <h3 className="text-xl font-black text-white tracking-tight">{request.passengerName}</h3>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Verified Rider</p>
                        </div>
                      </div>

                      <div className="flex-1 space-y-6 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="relative pl-6">
                              <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pick-up</p>
                              <p className="text-white text-sm font-bold line-clamp-2">{request.pickupLocation}</p>
                            </div>
                            <div className="relative pl-6">
                              <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-purple-500" />
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Drop-off</p>
                              <p className="text-white text-sm font-bold line-clamp-2">{request.dropLocation}</p>
                            </div>
                          </div>

                          <div className="space-y-4 sm:pl-6 sm:border-l border-white/5">
                            <div className="flex justify-between items-center">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Seats</p>
                              <span className="bg-indigo-500/20 text-indigo-400 font-black px-2 py-0.5 rounded text-xs">{request.requestedSeats}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Time</p>
                              <span className="text-white font-bold text-xs">{new Date(request.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                          <button
                            onClick={() => handleAction(request.rideRequestId, 'reject')}
                            disabled={processingId !== null}
                            className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500/10 hover:border-red-500/30 transition-all hover:text-red-400 disabled:opacity-50"
                          >
                            {processingId === request.rideRequestId ? <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin mx-auto" /> : "Reject"}
                          </button>
                          <button
                            onClick={() => handleAction(request.rideRequestId, 'accept')}
                            disabled={processingId !== null}
                            className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
                          >
                            {processingId === request.rideRequestId ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Accept Passenger"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CONFIRMED PASSENGERS */}
            {confirmedRequests.length > 0 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="flex items-center gap-4 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">
                  <div className="h-px w-8 bg-emerald-500/30" />
                  <span>{confirmedRequests.length} Confirmed Passengers</span>
                  <div className="h-px flex-1 bg-white/5" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {confirmedRequests.map((request) => {
                    // Try to find matching detailed info
                    const details = acceptedDetails.find(d => d.passengerRideRequestId === request.rideRequestId);
                    
                    return (
                      <div key={request.rideRequestId} className="glass-card p-8 border-emerald-500/10 bg-emerald-500/[0.02] flex flex-col md:flex-row gap-8 items-center group relative overflow-hidden">
                        {/* Status Label */}
                        <div className="absolute top-0 right-0 p-4">
                           <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-black text-emerald-500 uppercase tracking-widest">Confirmed</div>
                        </div>

                        <div className="flex flex-col items-center gap-3 shrink-0">
                           {details?.passengerProfilePicture ? (
                             <img 
                                src={details.passengerProfilePicture} 
                                alt={request.passengerName}
                                className="w-20 h-20 rounded-3xl object-cover border-2 border-emerald-500/20 shadow-xl"
                             />
                           ) : (
                             <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center">
                               <span className="text-3xl font-black text-emerald-500">{request.passengerName.charAt(0)}</span>
                             </div>
                           )}
                           <div className="text-center">
                             <h4 className="text-xl font-black text-white">{request.passengerName}</h4>
                             {details && (
                               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{details.passengerGender}</p>
                             )}
                           </div>
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                           <div className="space-y-4">
                              <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Contact Details</p>
                                <div className="flex flex-col gap-1">
                                   <p className="text-white font-bold text-sm tracking-tight">{request.passengerContact}</p>
                                   {details && (
                                      <p className="text-xs font-medium text-slate-400 lowercase">{details.passengerEmail}</p>
                                   )}
                                </div>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Seats Reserved</p>
                                <p className="text-white font-black text-lg">{request.requestedSeats} Seat{request.requestedSeats > 1 ? 's' : ''}</p>
                              </div>
                           </div>

                           <div className="space-y-4 pt-1">
                              <div className="flex gap-3">
                                <button 
                                  onClick={() => window.open(`sms:${request.passengerContact}`)}
                                  className="flex-1 py-4 px-6 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 text-white font-black text-[9px] uppercase tracking-widest hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition-all shadow-xl shadow-black/20"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                  </svg>
                                  Message
                                </button>
                                <button 
                                  onClick={() => window.open(`tel:${request.passengerContact}`)}
                                  className="flex-1 py-4 px-6 rounded-2xl bg-emerald-500 text-white flex items-center justify-center gap-3 font-black text-[9px] uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/30"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  Call Now
                                </button>
                              </div>
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Start Journey Floating Action Bar */}
        {!loading && confirmedRequests.length > 0 && !isStarted && (
           <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-main via-bg-main/90 to-transparent z-[80] animate-fade-in-up">
              <div className="max-w-4xl mx-auto">
                 <button
                    onClick={handleStartRide}
                    disabled={isStarting}
                    className="w-full py-5 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-500 shadow-[0_20px_50px_rgba(16,185,129,0.3)] text-white font-black text-sm uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 relative overflow-hidden group"
                 >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <span className="relative z-10 flex items-center justify-center gap-3">
                       {isStarting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       ) : (
                          <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                       )}
                       {isStarting ? "Initializing..." : "Start Journey Now"}
                    </span>
                 </button>
                 <p className="text-center text-slate-500 text-[9px] font-black uppercase tracking-widest mt-4 opacity-60">
                    Officially starts the ride and notifies all passengers
                 </p>
              </div>
           </div>
        )}

        {/* Live Tracking Status Indicator */}
        {isStarted && (
            <div className="fixed top-24 right-6 z-[90] animate-fade-in-right">
                <div className="glass-card px-4 py-3 border-emerald-500/30 bg-emerald-500/5 flex items-center gap-3 shadow-2xl">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute inset-0" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Tracking Active</span>
                </div>
            </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
          <div className="bg-indigo-600 text-white px-8 py-4 rounded-2xl shadow-2xl border border-white/10 font-black text-sm tracking-tight flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
