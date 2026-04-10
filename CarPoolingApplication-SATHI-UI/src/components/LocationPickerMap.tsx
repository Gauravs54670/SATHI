"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline, Tooltip } from "react-leaflet";
import L from "leaflet";
import { decodePolyline } from "@/lib/polyline";

// Fix default icon issue in Leaflet + Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const GreenIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const RedIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Location {
  lat: number;
  lng: number;
  address: string;
}

interface RouteOption {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: string; // encoded polyline
  points: [number, number][];
}

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerMapProps {
  onPickupSelect: (location: Location) => void;
  onDropSelect: (location: Location) => void;
  onRouteSelect: (distanceKm: number, path: string) => void;
  onModeChange: (mode: "pickup" | "drop") => void;
  mode: "pickup" | "drop";
  pricePerKm: number;
}

// Sub-component to handle map panning and events
function MapController({ 
  onMapClick, 
  target 
}: { 
  onMapClick: (lat: number, lng: number) => void;
  target: [number, number] | null;
}) {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (target) {
      map.flyTo(target, 15, { duration: 1.5 });
    }
  }, [target, map]);

  return null;
}

export default function LocationPickerMap({ 
  onPickupSelect, 
  onDropSelect, 
  onRouteSelect,
  onModeChange,
  mode,
  pricePerKm
}: LocationPickerMapProps) {
  const [pickup, setPickup] = useState<Location | null>(null);
  const [drop, setDrop] = useState<Location | null>(null);
  const [targetPos, setTargetPos] = useState<[number, number] | null>(null);
  
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  
  const [pickupInput, setPickupInput] = useState("");
  const [dropInput, setDropInput] = useState("");
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState<"pickup" | "drop" | null>(null);
  const [loading, setLoading] = useState(false);
  const [geoAvailable, setGeoAvailable] = useState(true);
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoAvailable(false);
    }
  }, []);

  // Fetch routes when pickup or drop changes
  useEffect(() => {
    if (pickup && drop) {
      fetchRoutes(pickup, drop);
    } else {
      setRoutes([]);
    }
  }, [pickup, drop]);

  const fetchRoutes = async (start: Location, end: Location) => {
    setLoading(true);
    try {
      // alternatives=3 for more options
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&alternatives=3&geometries=polyline`;
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.code === "Ok" && data.routes) {
        const decodedRoutes = data.routes.map((r: any) => ({
          distance: r.distance,
          duration: r.duration,
          geometry: r.geometry,
          points: decodePolyline(r.geometry)
        }));
        setRoutes(decodedRoutes);
        setSelectedRouteIndex(0);
        
        // Initial route sync
        const main = decodedRoutes[0];
        onRouteSelect(main.distance / 1000, main.geometry);
      }
    } catch (err) {
      console.error("Failed to fetch routes", err);
    } finally {
      setLoading(false);
    }
  };

  const routeColors = ["#6366f1", "#94a3b8", "#475569", "#1e293b"];

  const handleRouteSelect = (index: number) => {
    setSelectedRouteIndex(index);
    const selected = routes[index];
    onRouteSelect(selected.distance / 1000, selected.geometry);
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "User-Agent": "SATHI-Carpooling-App" } }
      );
      const data = await response.json();
      return data.display_name || "Unknown Location";
    } catch (error) {
      console.error("Geocoding failed", error);
      return "Location not found";
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string, type: "pickup" | "drop") => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { "User-Agent": "SATHI-Carpooling-App" } }
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(type);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLoading(true);
    
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`[Geo Diagnostics] Coords: ${latitude}, ${longitude} | Accuracy: ${accuracy} meters`);
        
        const address = await reverseGeocode(latitude, longitude);
        const location = { lat: latitude, lng: longitude, address };
        
        setPickup(location);
        setPickupInput(address);
        onPickupSelect(location);
        setTargetPos([latitude, longitude]);
        onModeChange("pickup");
        setLoading(false);

        // Warn if accuracy is lower than 2km (likely IP-based)
        if (accuracy > 2000) {
          alert(`Warning: Low location accuracy (${Math.round(accuracy/1000)}km). Your browser might be using IP-based location which is often inaccurate.`);
        }
      },
      (error) => {
        let msg = "Unknown location error";
        switch(error.code) {
          case 1: msg = "Permission denied. Allow location access in settings."; break;
          case 2: msg = "Position unavailable. Device GPS/Wi-Fi off?"; break;
          case 3: msg = "Location request timed out."; break;
        }
        console.error(`Geolocation error [${error.code}]: ${error.message}`);
        if (error.code === 1) setGeoAvailable(false);
        setLoading(false);
        alert(msg);
      },
      geoOptions
    );
  };

  const onSelectResult = (result: SearchResult, type: "pickup" | "drop") => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const location = { lat, lng, address: result.display_name };

    if (type === "pickup") {
      setPickup(location);
      setPickupInput(result.display_name);
      onPickupSelect(location);
    } else {
      setDrop(location);
      setDropInput(result.display_name);
      onDropSelect(location);
    }

    setTargetPos([lat, lng]);
    setSearchResults([]);
    setShowResults(null);
  };

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    const address = await reverseGeocode(lat, lng);
    const location = { lat, lng, address };

    if (mode === "pickup") {
      setPickup(location);
      setPickupInput(address);
      onPickupSelect(location);
    } else {
      setDrop(location);
      setDropInput(address);
      onDropSelect(location);
    }
  }, [mode, onPickupSelect, onDropSelect]);

  useEffect(() => {
    const handleClickOutside = () => setShowResults(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pickup Search */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Source / Pickup</span>
            </div>
            {geoAvailable && (
              <button 
                type="button"
                onClick={useCurrentLocation}
                className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Current Location
              </button>
            )}
          </div>
          <div className="relative group">
            <input
              type="text"
              placeholder="Where are you starting from?"
              className={`sathi-input pr-10 border-2 transition-all ${mode === 'pickup' ? 'border-emerald-500/40 bg-emerald-500/5 ring-4 ring-emerald-500/10' : 'border-transparent hover:border-white/10'}`}
              value={pickupInput}
              onChange={(e) => {
                setPickupInput(e.target.value);
                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                searchTimeout.current = setTimeout(() => handleSearch(e.target.value, "pickup"), 500);
              }}
              onFocus={() => {
                onModeChange("pickup");
                if (pickupInput.length >= 3) setShowResults("pickup");
              }}
            />
            {pickupInput && (
              <button 
                type="button"
                onClick={() => {
                  setPickupInput("");
                  setPickup(null);
                  onPickupSelect({ lat: 0, lng: 0, address: "" });
                  setSearchResults([]);
                }}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                title="Clear Pickup"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity ${mode === 'pickup' ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          {showResults === "pickup" && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card z-[2000] overflow-hidden shadow-2xl animate-fade-in-up border-emerald-500/20">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-emerald-500/10 hover:text-white transition-colors border-b border-white/5 last:border-0 group flex items-start gap-3"
                  onClick={() => onSelectResult(res, "pickup")}
                >
                  <svg className="w-4 h-4 mt-0.5 text-slate-500 group-hover:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {res.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Drop Search */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Destination / Drop</span>
          </div>
          <div className="relative group">
            <input
              type="text"
              placeholder="Where are you going?"
              className={`sathi-input pr-10 border-2 transition-all ${mode === 'drop' ? 'border-red-500/40 bg-red-500/5 ring-4 ring-red-500/10' : 'border-transparent hover:border-white/10'}`}
              value={dropInput}
              onChange={(e) => {
                setDropInput(e.target.value);
                if (searchTimeout.current) clearTimeout(searchTimeout.current);
                searchTimeout.current = setTimeout(() => handleSearch(e.target.value, "drop"), 500);
              }}
              onFocus={() => {
                onModeChange("drop");
                if (dropInput.length >= 3) setShowResults("drop");
              }}
            />
            {dropInput && (
              <button 
                type="button"
                onClick={() => {
                  setDropInput("");
                  setDrop(null);
                  onDropSelect({ lat: 0, lng: 0, address: "" });
                  setSearchResults([]);
                }}
                className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                title="Clear Drop-off"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <div className={`absolute right-3 top-1/2 -translate-y-1/2 transition-opacity ${mode === 'drop' ? 'opacity-100' : 'opacity-0'}`}>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </div>
          </div>
          {showResults === "drop" && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card z-[2000] overflow-hidden shadow-2xl animate-fade-in-up border-red-500/20">
              {searchResults.map((res, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:bg-red-500/10 hover:text-white transition-colors border-b border-white/5 last:border-0 group flex items-start gap-3"
                  onClick={() => onSelectResult(res, "drop")}
                >
                  <svg className="w-4 h-4 mt-0.5 text-slate-500 group-hover:text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {res.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group ring-1 ring-white/5">
        {loading && (
          <div className="absolute inset-0 z-[2000] bg-black/40 backdrop-blur-[3px] flex items-center justify-center transition-all duration-300">
            <div className="bg-bg-secondary/90 px-6 py-3 rounded-2xl border border-indigo-500/30 shadow-2xl flex items-center gap-4 animate-scale-in">
              <div className="relative">
                <div className="w-6 h-6 border-2 border-indigo-500/30 rounded-full" />
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin absolute inset-0" />
              </div>
              <span className="text-sm font-bold text-slate-100 tracking-wide">Syncing Routes...</span>
            </div>
          </div>
        )}
        
        <MapContainer 
          center={[25.4358, 81.8463]} 
          zoom={13} 
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController onMapClick={handleMapClick} target={targetPos} />

          {/* Render Routes */}
          {routes.map((route, i) => (
            <Polyline
              key={i}
              positions={route.points}
              pathOptions={{
                color: i === selectedRouteIndex ? "#6366f1" : routeColors[i % routeColors.length],
                weight: i === selectedRouteIndex ? 7 : 4,
                opacity: i === selectedRouteIndex ? 1 : 0.5,
                lineJoin: "round",
                dashArray: i === selectedRouteIndex ? "" : "3, 6"
              }}
              eventHandlers={{
                click: () => handleRouteSelect(i)
              }}
            >
              <Tooltip sticky>
                 <div className="text-xs font-bold">
                    {i === 0 ? 'Optimal Route' : `Alternate Option ${i}`} • ₹{(route.distance / 1000 * pricePerKm).toFixed(0)}
                 </div>
              </Tooltip>
            </Polyline>
          ))}

          {pickup && (
            <Marker position={[pickup.lat, pickup.lng]} icon={GreenIcon}>
              <Popup>
                <div className="p-2 min-w-[150px]">
                  <span className="font-black text-[10px] text-emerald-500 uppercase tracking-widest block mb-1">Pickup Point</span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{pickup.address}</p>
                </div>
              </Popup>
            </Marker>
          )}

          {drop && (
            <Marker position={[drop.lat, drop.lng]} icon={RedIcon}>
              <Popup>
                <div className="p-2 min-w-[150px]">
                  <span className="font-black text-[10px] text-red-500 uppercase tracking-widest block mb-1">Drop Point</span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">{drop.address}</p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        
        {/* Enhanced Routes Selector Panel */}
        {routes.length > 0 && (
          <div className="absolute top-4 left-4 z-[1000] w-64 space-y-3 pointer-events-none">
            <div className="glass-card p-4 border-white/10 backdrop-blur-2xl bg-black/50 pointer-events-auto shadow-2xl max-h-[460px] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-4">
                 <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Route Options</span>
                 <span className="text-[10px] text-slate-500 font-bold">{routes.length} paths</span>
              </div>
              
              <div className="space-y-3">
                {routes.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleRouteSelect(i)}
                    className={`w-full text-left p-3 rounded-xl transition-all border-2 flex flex-col gap-1 relative overflow-hidden group ${
                      i === selectedRouteIndex 
                      ? 'bg-indigo-500/10 border-indigo-500' 
                      : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold uppercase tracking-tight ${i === selectedRouteIndex ? 'text-indigo-400' : 'text-slate-500'}`}>
                        {i === 0 ? 'Fastest' : `Alternative ${i}`}
                      </span>
                      {i === selectedRouteIndex && (
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      )}
                    </div>
                    
                    <div className="flex items-baseline justify-between">
                       <span className="text-lg font-black text-white">₹{(r.distance / 1000 * pricePerKm).toFixed(0)}</span>
                       <span className="text-[10px] font-bold text-slate-400">{(r.distance / 1000).toFixed(1)} km</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {Math.round(r.duration / 60)} mins
                        </div>
                        <div className="w-[1px] h-3 bg-white/10" />
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: i === selectedRouteIndex ? "#6366f1" : routeColors[i % routeColors.length] }} />
                    </div>

                    <div className={`absolute bottom-0 left-0 h-1 transition-all duration-500 ${i === selectedRouteIndex ? 'bg-indigo-500 w-full' : 'w-0'}`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Helper Badge */}
        <div className="absolute top-4 right-4 z-[1000]">
            <div className="bg-bg-primary/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${mode === 'pickup' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-[10px] font-bold text-white uppercase tracking-tighter">
                   {mode === 'pickup' ? 'Pickup' : 'Drop'} Mode
                </span>
            </div>
        </div>
      </div>
    </div>
  );
}
