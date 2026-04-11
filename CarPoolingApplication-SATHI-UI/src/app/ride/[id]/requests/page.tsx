"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchRideRequests, PassengerRideBookingRequest, acceptRideRequest, rejectRideRequest } from "@/lib/api";
import Navbar from "@/components/Navbar";

export default function RideRequestsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [requests, setRequests] = useState<PassengerRideBookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchRideRequests(Number(id));
      setRequests(data);
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
        ? await acceptRideRequest(Number(id), requestId)
        : await rejectRideRequest(Number(id), requestId);
      
      setToast(msg);
      setTimeout(() => setToast(null), 3000);
      
      // Refresh the list to reflect status changes and remaining seats
      await loadRequests();
    } catch (err: any) {
      setToast(err.message || `Failed to ${action} request`);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && requests.length === 0) {
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
            onClick={() => router.back()}
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
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Oops! Something went wrong</h3>
            <p className="text-slate-400 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-400 transition-all"
            >
              Try Again
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="glass-card p-20 text-center border-white/5">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-white/10">
              <svg className="w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-3 italic">No requests yet!</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-medium">Sit back and relax. We'll notify you as soon as someone wants to join your journey.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">
              <div className="h-px flex-1 bg-white/5" />
              <span>{requests.length} Pending Passengers</span>
              <div className="h-px flex-1 bg-white/5" />
            </div>

            {requests.map((request) => (
              <div key={request.rideRequestId} className="glass-card p-8 border-indigo-500/10 hover:border-indigo-500/30 transition-all group overflow-hidden relative">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  {/* Passenger Avatar/Info */}
                  <div className="flex flex-col items-center gap-4 shrink-0">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center shadow-2xl">
                      <span className="text-3xl font-black text-white">{request.passengerName.charAt(0)}</span>
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-black text-white tracking-tight">{request.passengerName}</h3>
                      <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Verified Rider</p>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="flex-1 space-y-6 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-indigo-500" />
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pick-up Location</p>
                          <p className="text-white text-sm font-bold line-clamp-2 leading-relaxed">{request.pickupLocation}</p>
                        </div>
                        <div className="relative pl-6">
                          <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-purple-500" />
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Drop Location</p>
                          <p className="text-white text-sm font-bold line-clamp-2 leading-relaxed">{request.dropLocation}</p>
                        </div>
                      </div>

                      <div className="space-y-4 sm:pl-6 sm:border-l border-white/5">
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Requested Seats</p>
                          <span className="bg-indigo-500/20 text-indigo-400 font-black px-2 py-0.5 rounded text-xs">{request.requestedSeats} Seat(s)</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Requested At</p>
                          <span className="text-white font-bold text-xs">{new Date(request.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Status</p>
                          <span className="text-emerald-400 font-bold text-xs uppercase tracking-tighter">{request.rideRequestStatus}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={() => handleAction(request.rideRequestId, 'reject')}
                        disabled={processingId !== null}
                        className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-500/10 hover:border-red-500/30 transition-all hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {processingId === request.rideRequestId ? (
                          <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />
                        ) : "Reject"}
                      </button>
                      <button
                        onClick={() => handleAction(request.rideRequestId, 'accept')}
                        disabled={processingId !== null}
                        className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-2xl hover:shadow-indigo-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                         {processingId === request.rideRequestId ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : "Accept Passenger"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Premium Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up">
          <div className="bg-indigo-500 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-indigo-500/40 border border-indigo-400 font-black text-sm tracking-tight flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
