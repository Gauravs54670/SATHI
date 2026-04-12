"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Toast, { ToastType } from "@/components/Toast";
import { postRide, fetchDriverProfile, RideRequestPayload } from "@/lib/api";

// Dynamically import map to avoid SSR issues
const LocationPickerMap = dynamic(
  () => import("@/components/LocationPickerMap"),
  { 
    ssr: false,
    loading: () => <div className="w-full h-[400px] bg-white/5 rounded-2xl animate-pulse flex items-center justify-center text-slate-500">Loading Map...</div>
  }
);

interface LocationState {
  lat: number;
  lng: number;
  address: string;
}

export default function PostRidePage() {
  const router = useRouter();
  const [mode, setMode] = useState<"pickup" | "drop">("pickup");
  const [pickup, setPickup] = useState<LocationState | null>(null);
  const [drop, setDrop] = useState<LocationState | null>(null);
  const [departureTime, setDepartureTime] = useState("");
  const [availableSeats, setAvailableSeats] = useState(3);
  const [pricePerKm, setPricePerKm] = useState(10);
  
  const [distance, setDistance] = useState<number>(0);
  const [routePath, setRoutePath] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [driverStatus, setDriverStatus] = useState<string>("LOADING");

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: ToastType }>({
    show: false,
    msg: "",
    type: "INFO"
  });

  const triggerToast = useCallback((msg: string, type: ToastType) => {
    setToast({ show: true, msg, type });
  }, []);

  useEffect(() => {
    fetchDriverProfile()
      .then(profile => {
        setDriverStatus(profile.driverAvailabilityStatus);
        if (profile.driverAvailabilityStatus !== "AVAILABLE") {
          triggerToast("You must be AVAILABLE to post a ride.", "INFO");
        }
      })
      .catch(err => {
        console.error("Failed to fetch driver status", err);
        setDriverStatus("ERROR");
        triggerToast("Failed to verify driver status.", "ERROR");
      });
  }, [triggerToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (driverStatus !== "AVAILABLE") {
      triggerToast("Please set your status to AVAILABLE first.", "ERROR");
      return;
    }

    if (!pickup || !drop) {
      triggerToast("Please select both pickup and drop locations.", "ERROR");
      return;
    }

    setLoading(true);

    const payload: RideRequestPayload = {
      sourceLat: pickup.lat,
      sourceLong: pickup.lng,
      boardingAddress: pickup.address,
      destinationLat: drop.lat,
      destinationLong: drop.lng,
      destinationAddress: drop.address,
      departureTime: departureTime.length === 16 ? departureTime + ":00" : departureTime,
      availableSeats,
      pricePerKm,
      totalDistanceKm: distance,
      routePath: routePath
    };

    try {
      await postRide(payload);
      triggerToast("Ride posted successfully!", "SUCCESS");
      setTimeout(() => router.push("/dashboard"), 3000);
    } catch (err: any) {
      const errorMsg = err.message || "Failed to post ride. Please check all fields.";
      triggerToast(errorMsg, "ERROR");
    } finally {
      setLoading(false);
    }
  };

  if (driverStatus === "LOADING") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Offer a Ride</h1>
            <p className="text-slate-400">Set your route and details for fellow commuters.</p>
          </div>
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-all font-medium text-sm group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        {driverStatus !== "AVAILABLE" && (
           <div className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex items-start gap-4 animate-fade-in-up">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h3 className="text-amber-500 font-bold">Action Required: Change Status</h3>
                <p className="text-amber-500/70 text-sm leading-relaxed">
                  Your current driver status is <strong>{driverStatus.replace('_', ' ')}</strong>. 
                  You must change your status to <strong>AVAILABLE</strong> on the dashboard before you can offer a ride.
                </p>
                <div className="pt-2">
                   <Link href="/dashboard" className="text-sm font-bold text-amber-500 underline underline-offset-4 hover:text-amber-400">
                     Go to Dashboard →
                   </Link>
                </div>
              </div>
           </div>
        )}

        <div className="grid grid-cols-1 gap-8 animate-fade-in-up-delay">
          {/* Map Section */}
          <div className={`glass-card p-6 border-indigo-500/10 transition-opacity ${driverStatus !== 'AVAILABLE' ? 'opacity-50 pointer-events-none grayscale-[0.5]' : 'opacity-100'}`}>
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                Select Route
              </h2>
              {pickup && drop && distance > 0 && (
                <div className="flex items-center gap-3">
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Road distance</span>
                      <span className="text-xs font-bold text-white">{distance.toFixed(2)} KM</span>
                   </div>
                   <div className="h-8 w-[1px] bg-white/10" />
                   <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Est. Fare</span>
                      <span className="text-xs font-bold text-emerald-400">₹{(distance * pricePerKm).toFixed(0)}</span>
                   </div>
                </div>
              )}
            </div>

            <LocationPickerMap 
              mode={mode}
              onModeChange={setMode}
              onPickupSelect={setPickup}
              onDropSelect={setDrop}
              onRouteSelect={(d, p) => {
                setDistance(d);
                setRoutePath(p);
              }}
              pricePerKm={pricePerKm}
            />
          </div>

          <div className={`glass-card p-8 border-indigo-500/10 transition-opacity ${driverStatus !== 'AVAILABLE' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
               <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
               Ride Details
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Departure Time</label>
                  <input 
                    type="datetime-local" 
                    className="sathi-input"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    min={(() => {
                      const now = new Date();
                      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                      return now.toISOString().slice(0, 16);
                    })()}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Available Seats</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="10"
                    className="sathi-input"
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 mb-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm mb-1">Set a Fair Price per KM</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Hello Driver! Please choose your price <span className="text-indigo-400 font-bold uppercase tracking-tighter">reasonably</span>. 
                      Setting a price that matches your <strong>Vehicle Class</strong> and <strong>Category</strong> ensures a fair deal for both you and your passengers. 
                      In the future, we'll provide exact price suggestions based on your route and vehicle!
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex justify-between items-center mb-4">
                   <div>
                     <label className="block text-sm font-medium text-slate-300">Price per KM (₹)</label>
                     <p className="text-[10px] text-slate-500 italic">Balance your fuel costs and passenger affordability</p>
                   </div>
                   <div className="px-3 py-1 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-bold text-lg">
                      ₹{pricePerKm}
                   </div>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  step="0.5"
                  className="w-full h-2 bg-indigo-500/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  value={pricePerKm}
                  onChange={(e) => setPricePerKm(parseFloat(e.target.value))}
                />
                
                {distance > 0 && (
                  <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-fade-in text-slate-200">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest block mb-1">Calculated Trip Total</span>
                      <h4 className="text-2xl font-black text-white">₹{(distance * pricePerKm).toFixed(2)}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest block mb-1">Total Distance</span>
                      <span className="text-sm font-bold text-slate-300">{distance.toFixed(1)} KM</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading || driverStatus !== 'AVAILABLE'}
                  className="sathi-btn relative group overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center justify-center gap-2">
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                        Confirm & Post Ride
                      </>
                    )}
                  </span>
                </button>
              </div>
            </form>
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
