"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import RideRequestModal from "@/components/RideRequestModal";
import Toast from "@/components/Toast";
import { fetchAvailableRides, AvailablePostedRideDTO } from "@/lib/api";

export default function AvailableRidesPage() {
  const router = useRouter();
  
  // State for City Selection
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [isDetectingCity, setIsDetectingCity] = useState(false);

  // State for Rides
  const [rides, setRides] = useState<AvailablePostedRideDTO[]>([]);
  const [filteredRides, setFilteredRides] = useState<AvailablePostedRideDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search Filters & Coordinates
  const [searchSource, setSearchSource] = useState("");
  const [searchDest, setSearchDest] = useState("");
  const [sourceCoords, setSourceCoords] = useState<{lat: number, lng: number} | null>(null);
  const [destCoords, setDestCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  // Modal State
  const [selectedRide, setSelectedRide] = useState<AvailablePostedRideDTO | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // Toast state
  const [toast, setToast] = useState<{message: string, type: 'SUCCESS' | 'ERROR'} | null>(null);

  // Persistence: Check for saved city on mount
  useEffect(() => {
    const saved = localStorage.getItem("sathi_selected_city");
    if (saved) {
      setSelectedCity(saved);
      setCityInput(saved);
    }
  }, []);

  const loadRides = useCallback(async (city: string, sLat?: number, sLng?: number, dLat?: number, dLng?: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAvailableRides(city, sLat, sLng, dLat, dLng);
      setRides(data);
      setFilteredRides(data);
    } catch (err: any) {
      setError(err.message || "Failed to load rides");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCity) {
      loadRides(selectedCity);
    }
  }, [selectedCity, loadRides]);

  const handleCitySubmit = (city: string) => {
    const trimmed = city.trim();
    if (trimmed) {
      setSearchSource("");
      setSearchDest("");
      setSourceCoords(null);
      setDestCoords(null);
      setSelectedCity(trimmed);
      localStorage.setItem("sathi_selected_city", trimmed);
    }
  };

  const geocodeAddress = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { "User-Agent": "SATHI-Carpooling-App" } }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
      return null;
    } catch (error) {
      console.error("Geocoding failed", error);
      return null;
    }
  };

  const handleSearchAndFilter = async () => {
    if (!selectedCity) return;
    setIsFiltering(true);
    let sLat, sLng, dLat, dLng;

    if (searchSource) {
      const coords = await geocodeAddress(`${searchSource}, ${selectedCity}`);
      if (coords) {
        sLat = coords.lat;
        sLng = coords.lng;
        setSourceCoords(coords);
      }
    } else {
        setSourceCoords(null);
    }

    if (searchDest) {
      const coords = await geocodeAddress(`${searchDest}, ${selectedCity}`);
      if (coords) {
        dLat = coords.lat;
        dLng = coords.lng;
        setDestCoords(coords);
      }
    } else {
        setDestCoords(null);
    }

    await loadRides(selectedCity, sLat, sLng, dLat, dLng);
    setIsFiltering(false);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "User-Agent": "SATHI-Carpooling-App" } }
      );
      const data = await response.json();
      return data.address;
    } catch (error) {
      console.error("Geocoding failed", error);
      return null;
    }
  };

  const detectCity = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsDetectingCity(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const address = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (address) {
          const city = address.city || address.town || address.village || address.suburb || "";
          if (city) {
            setCityInput(city);
            handleCitySubmit(city);
          } else {
            alert("Could not detect city name. Please enter manually.");
          }
        }
        setIsDetectingCity(false);
      },
      () => {
        alert("Failed to detect location. Please enter city manually.");
        setIsDetectingCity(false);
      }
    );
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const addressData = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (addressData) {
            const fullAddress = [
                addressData.road,
                addressData.suburb,
                addressData.city || addressData.town,
                addressData.state
            ].filter(Boolean).join(", ");
            setSearchSource(fullAddress);
            setSourceCoords({lat: pos.coords.latitude, lng: pos.coords.longitude});
        }
        setIsDetectingLocation(false);
      },
      () => {
        alert("Failed to detect location.");
        setIsDetectingLocation(false);
      }
    );
  };

  // 1. City Gate View
  if (!selectedCity) {
    return (
      <div className="min-h-screen bg-bg-app flex flex-col">
        <Navbar />
        <div className="flex-grow flex items-center justify-center p-6">
          <div className="w-full max-w-md animate-fade-in-up">
            <div className="text-center mb-10">
              <div className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 ring-1 ring-indigo-500/20 shadow-2xl shadow-indigo-500/10">
                <svg className="w-12 h-12 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-black text-white mb-3">Which city are you in?</h1>
              <p className="text-slate-400">Discover rides available in your neighborhood or heading your way.</p>
            </div>

            <div className="glass-card p-2 border-white/10 shadow-2xl backdrop-blur-3xl">
              <div className="p-4 space-y-4">
                <div className="relative group">
                  <input 
                    type="text"
                    placeholder="Enter your city (e.g. Prayagraj)"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCitySubmit(cityInput)}
                    className="w-full pl-6 pr-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-lg"
                  />
                  <button 
                    onClick={() => handleCitySubmit(cityInput)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center hover:bg-indigo-400 transition-colors shadow-lg"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-px flex-grow bg-white/5" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">or</span>
                  <div className="h-px flex-grow bg-white/5" />
                </div>

                <button 
                  onClick={detectCity}
                  disabled={isDetectingCity}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-3 group disabled:opacity-50"
                >
                  {isDetectingCity ? (
                    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  )}
                  Detect My City
                </button>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-semibold group"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Cancel and back to Dashboard
              </button>
            </div>
            
            <p className="mt-8 text-center text-[10px] text-slate-700 font-bold uppercase tracking-widest">
              SATHI uses high-precision spatial matching
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-app">
      <Navbar />

      {toast && <Toast message={toast.message} type={toast.type} isVisible={!!toast} onClose={() => setToast(null)} />}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header Section */}
        <div className="mb-10 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button 
                onClick={() => router.push("/dashboard")}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                title="Back to Dashboard"
                >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                </button>
                <div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Rides in {selectedCity}</h1>
                    <div className="flex items-center gap-2">
                      <p className="text-slate-500 text-sm font-medium">Find rides near your route</p>
                      <span className="text-slate-700">•</span>
                      <button 
                        onClick={() => { 
                          setSelectedCity(null); 
                          setSearchSource("");
                          setSearchDest("");
                          localStorage.removeItem("sathi_selected_city");
                        }}
                        className="text-xs font-bold text-indigo-500 hover:text-indigo-400 transition-colors uppercase tracking-tighter"
                      >
                        Change City
                      </button>
                      <span className="text-slate-700 mx-2">|</span>
                      <button 
                        onClick={() => router.push("/rides/requested")}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest underline underline-offset-4"
                      >
                        My Ride Requests
                      </button>
                    </div>
                </div>
            </div>
            <button 
                onClick={() => loadRides(selectedCity)}
                className="p-3 rounded-xl bg-white/5 border border-white/10 text-indigo-400 hover:text-white transition-all group"
            >
                <svg className={`w-5 h-5 ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="glass-card p-6 mb-10 animate-fade-in-up-delay border-indigo-500/10 transition-all hover:bg-white/[0.02]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative">
            {/* From Input */}
            <div className="md:col-span-1 lg:col-span-2 relative group">
              <div className="flex items-center justify-between mb-2 px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">From / Pick-up</label>
                <button 
                  onClick={useCurrentLocation}
                  disabled={isDetectingLocation}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1.5"
                >
                  {isDetectingLocation ? (
                    <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  )}
                  {isDetectingLocation ? "Detecting..." : "Use My Location"}
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-indigo-400">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                </div>
                <input 
                  type="text"
                  placeholder="e.g. Civil Lines, Naini..."
                  value={searchSource}
                  onChange={(e) => setSearchSource(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium"
                />
                {searchSource && (
                  <button 
                    onClick={() => {setSearchSource(""); setSourceCoords(null);}}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* To Input */}
            <div className="md:col-span-1 lg:col-span-2 relative group">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block ml-1">To / Destination</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-purple-400">
                   <div className="w-2 h-2 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
                </div>
                <input 
                  type="text"
                  placeholder="Where to?"
                  value={searchDest}
                  onChange={(e) => setSearchDest(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium"
                />
                {searchDest && (
                  <button 
                    onClick={() => {setSearchDest(""); setDestCoords(null);}}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Button */}
            <div className="flex flex-col justify-end">
              <button
                onClick={handleSearchAndFilter}
                disabled={isFiltering}
                className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-black hover:bg-indigo-400 transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isFiltering ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Apply Filter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Rides List */}
        {loading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3].map(i => (
                    <div key={i} className="glass-card h-80 animate-pulse border-white/5 bg-white/[0.02]" />
                ))}
            </div>
        ) : error ? (
          <div className="glass-card p-10 text-center border-red-500/20 animate-fade-in-up">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-white font-medium mb-2">Something went wrong</p>
            <p className="text-slate-400 mb-6">{error}</p>
            <button 
              onClick={() => loadRides(selectedCity)}
              className="px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredRides.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up-delay-2">
            {filteredRides.map((ride, index) => (
              <div 
                key={ride.rideId} 
                className="glass-card p-6 border-white/5 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group relative flex flex-col h-full"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Driver Info Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold border-2 border-white/10 shadow-lg">
                      {ride.driverName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <h3 className="text-white font-bold group-hover:text-indigo-400 transition-colors">{ride.driverName}</h3>
                      <div className="flex items-center gap-1">
                        <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs text-slate-400">{ride.driverRating?.toFixed(1) || "4.8"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex flex-col items-end">
                      <p className="text-2xl font-black text-indigo-400 tracking-tight">₹{ride.totalEstimatedCost}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">₹{ride.pricePerKm}/km</span>
                        <span className="text-[9px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">₹{ride.basePrice} base</span>
                      </div>
                      <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest mt-1">Total Est. Fare</p>
                    </div>
                  </div>
                </div>

                {/* Route Section */}
                <div className="relative mb-6 flex-grow">
                  <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 border-l-2 border-dashed border-slate-700" />
                  <div className="space-y-6">
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pick-up Area</p>
                      <p className="text-white text-sm line-clamp-2 leading-relaxed font-medium">{ride.driverSourceAddress}</p>
                    </div>
                    <div className="relative pl-8">
                      <div className="absolute left-0 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-purple-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      </div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Destination</p>
                      <p className="text-white text-sm line-clamp-2 leading-relaxed font-medium">{ride.driverDestinationAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Ride Stats */}
                <div className="grid grid-cols-4 gap-2 py-4 border-t border-b border-white/5 mb-6">
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">{new Date(ride.rideDepartureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Time</p>
                  </div>
                  <div className="text-center border-x border-white/5">
                    <p className="text-white font-bold text-sm">{ride.totalAvailableSeats}</p>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase">Available Seats</p>
                  </div>
                  <div className="text-center border-r border-white/5">
                    <p className="text-white font-bold text-sm">{ride.totalDistance?.toFixed(1) || "0.0"} <span className="text-[10px]">km</span></p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Dist.</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">{new Date(ride.rideDepartureTime).toLocaleDateString([], { day: '2-digit', month: 'short' })}</p>
                    <p className="text-[10px] font-bold text-slate-600 uppercase">Date</p>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => {
                    setSelectedRide(ride);
                    setShowRequestModal(true);
                  }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-[0.98] mt-auto"
                >
                  Book Seat Now
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-20 text-center animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">No rides found</h2>
            <p className="text-slate-400 mb-8 max-w-sm mx-auto">Try adjusting your filters or search area to find more results.</p>
            <button 
              onClick={() => { setSelectedCity(null); localStorage.removeItem("sathi_selected_city"); }}
              className="px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-indigo-400 font-bold hover:bg-white/10 transition-all"
            >
              Reset Search
            </button>
          </div>
        )}
      </main>

      {/* Ride Request Modal */}
      {showRequestModal && selectedRide && (
        <RideRequestModal
          rideId={selectedRide.rideId}
          sourceAddress={searchSource || selectedRide.driverSourceAddress}
          sourceLat={sourceCoords?.lat || 0} // In real app, we'd need driver source coords if passenger doesn't provide
          sourceLng={sourceCoords?.lng || 0}
          destAddress={searchDest || selectedRide.driverDestinationAddress}
          destLat={destCoords?.lat || 0}
          destLng={destCoords?.lng || 0}
          maxSeats={selectedRide.totalAvailableSeats}
          totalDistance={selectedRide.totalDistance}
          basePrice={selectedRide.basePrice}
          pricePerKm={selectedRide.pricePerKm}
          totalEstimatedCost={selectedRide.totalEstimatedCost}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => {
            setShowRequestModal(false);
            setToast({message: "Ride request sent successfully!", type: 'SUCCESS'});
          }}
        />
      )}
    </div>
  );
}
