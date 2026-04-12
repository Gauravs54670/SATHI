"use client";

import React, { useState, useEffect } from "react";
import { RideSharingRequestToPostedRide, requestRide, fetchRideRequestUpdates, RideRequestUpdatesDTO } from "@/lib/api";

interface RideRequestModalProps {
  rideId: number;
  sourceAddress: string;
  sourceLat: number;
  sourceLng: number;
  destAddress: string;
  destLat: number;
  destLng: number;
  maxSeats: number;
  totalDistance: number;
  basePrice: number;
  pricePerKm: number;
  totalEstimatedCost: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RideRequestModal({
  rideId,
  sourceAddress,
  sourceLat,
  sourceLng,
  destAddress,
  destLat,
  destLng,
  maxSeats,
  totalDistance,
  basePrice,
  pricePerKm,
  totalEstimatedCost,
  onClose,
  onSuccess,
}: RideRequestModalProps) {
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [existingRequest, setExistingRequest] = useState<RideRequestUpdatesDTO | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const updates = await fetchRideRequestUpdates();
        const match = updates.find((u) => u.rideId === rideId);
        if (match) {
          setExistingRequest(match);
        }
      } catch (err) {
        console.error("Failed to fetch existing ride request", err);
      } finally {
        setIsChecking(false);
      }
    };
    fetchExisting();
  }, [rideId]);

  const rejectionCount = existingRequest?.rejectionCount || 0;
  const isRetryLimitReached = existingRequest?.rideRequestStatus === "REJECTED" && rejectionCount >= 3;
  const isPendingOrAccepted = ["PENDING", "ACCEPTED"].includes(existingRequest?.rideRequestStatus || "");
  const isSubmitDisabled = loading || isChecking || isPendingOrAccepted || isRetryLimitReached;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: RideSharingRequestToPostedRide = {
      rideId,
      passengerSourceLat: sourceLat,
      passengerSourceLng: sourceLng,
      passengerSourceLocation: sourceAddress,
      passengerDestinationLat: destLat,
      passengerDestinationLng: destLng,
      passengerDestinationLocation: destAddress,
      seatsRequired: seats,
    };

    try {
      await requestRide(payload);
      onSuccess();
    } catch (err: any) {
      const errMsg = err.message || "";
      if (errMsg.includes("limit reached") || errMsg.includes("Too many requests")) {
        setError("Too many requests. Please try again later.");
      } else {
        setError(errMsg || "Failed to submit ride request");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto" onClick={onClose}>
      <div 
        className="glass-card w-full max-w-lg border-white/10 shadow-2xl animate-scale-in flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Request Ride</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Ride ID: #{rideId}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-500 hover:text-white transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 animate-shake">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold">{error}</p>
            </div>
          )}

          {existingRequest && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 border ${
              existingRequest.rideRequestStatus === "PENDING" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
              existingRequest.rideRequestStatus === "ACCEPTED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
              isRetryLimitReached ? "bg-red-500/10 border-red-500/20 text-red-400" :
              "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              <div className="mt-0.5">
                {existingRequest.rideRequestStatus === "PENDING" || existingRequest.rideRequestStatus === "ACCEPTED" ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2">
                  Status: {existingRequest.rideRequestStatus}
                  {existingRequest.rideRequestStatus === "REJECTED" && !isRetryLimitReached && (
                     <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20">Attempt {rejectionCount}/3</span>
                  )}
                </h3>
                <p className="text-xs font-medium mt-1 opacity-90">
                  {existingRequest.rideRequestStatus === "PENDING" || existingRequest.rideRequestStatus === "ACCEPTED" 
                    ? "You have already requested this ride. Please wait until the driver responds."
                    : isRetryLimitReached
                    ? "Retry limit reached for this ride. The driver has rejected your request multiple times."
                    : "Your previous request was rejected. You can try requesting again."}
                </p>
              </div>
            </div>
          )}

          {/* Non-editable details */}
          <div className="space-y-6">
            <div className="relative pl-8">
              <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pick-up Location</p>
              <p className="text-white text-sm font-medium leading-relaxed">{sourceAddress}</p>
              <p className="text-[9px] text-slate-600 font-mono mt-1">{sourceLat.toFixed(6)}, {sourceLng.toFixed(6)}</p>
            </div>

            <div className="relative pl-8">
              <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Destination</p>
              <p className="text-white text-sm font-medium leading-relaxed">{destAddress}</p>
              <p className="text-[9px] text-slate-600 font-mono mt-1">{destLat.toFixed(6)}, {destLng.toFixed(6)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
            <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-bold text-slate-400">Total Trip Distance:</span>
            <span className="text-xs font-black text-white">{totalDistance?.toFixed(1) || "0.0"} km</span>
          </div>

          <div className="h-px bg-white/5" />

          {/* Editable: Seats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Requested Seats</label>
              <span className="text-xs font-bold text-indigo-400">{maxSeats} max available</span>
            </div>
            <div className="flex items-center gap-6">
              <button 
                type="button"
                onClick={() => setSeats(Math.max(1, seats - 1))}
                className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all font-black text-2xl"
              >
                -
              </button>
              <div className="flex-grow h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
                <span className="text-2xl font-black text-white">{seats}</span>
              </div>
              <button 
                type="button"
                onClick={() => setSeats(Math.min(maxSeats, seats + 1))}
                className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-400 transition-all font-black text-2xl shadow-lg shadow-indigo-500/20"
              >
                +
              </button>
            </div>
          </div>

          {/* Fare Summary */}
          <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest">
              <span>Fare Breakdown</span>
              <span className="text-indigo-400">Fixed Rates</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Base Fare</span>
                <span className="text-white font-bold">₹{basePrice}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Price per km</span>
                <span className="text-white font-bold">₹{pricePerKm}</span>
              </div>
              <div className="h-px bg-white/5 my-1" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-500 uppercase">Estimated Total</span>
                <span className="text-xl font-black text-indigo-400">₹{totalEstimatedCost}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black hover:shadow-2xl hover:shadow-indigo-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Confirm Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
