"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import CustomSelect from "@/components/CustomSelect";
import { fetchUserRoles, fetchDriverProfile, changeDriverAvailabilityStatus, checkHasActiveRide, fetchActiveRides, fetchRideRequestUpdates, cancelRideRequest, RideRequestUpdatesDTO, startRide, DriverPostedRide, fetchRideOtp, cancelRide } from "@/lib/api";
import { startLiveTracking, stopLiveTracking } from "@/lib/rideTracker";
import EmailVerificationModal from "@/components/EmailVerificationModal";
import Toast from "@/components/Toast";

export default function DashboardPage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "SUCCESS" | "ERROR" | "INFO"; isVisible: boolean }>({
    message: "",
    type: "SUCCESS",
    isVisible: false
  });
  const [isDriver, setIsDriver] = useState(false);
  const [availabilityStatus, setAvailabilityStatus] = useState<string | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);
  const [hasActiveRide, setHasActiveRide] = useState(false);
  const [postedRides, setPostedRides] = useState<DriverPostedRide[]>([]);
  const [isFetchingRides, setIsFetchingRides] = useState(false);
  const [showRidesList, setShowRidesList] = useState(false);
  const [passengerRequests, setPassengerRequests] = useState<RideRequestUpdatesDTO[]>([]);
  const [isFetchingRequests, setIsFetchingRequests] = useState(false);

  // Synchronized Boarding State (Passenger)
  const [incomingBoardingRide, setIncomingBoardingRide] = useState<RideRequestUpdatesDTO | null>(null);
  const [incomingOtp, setIncomingOtp] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let pollInterval: NodeJS.Timeout;

    if (isLoggedIn && user) {
      // 1. Initial State Fetch
      fetchUserRoles()
        .then(roles => {
          if (!mounted) return;
          if (roles.includes("DRIVER")) {
            setIsDriver(true);
            fetchDriverProfile().then(p => p && setAvailabilityStatus(p.driverAvailabilityStatus || "OFF_DUTY"));
            checkHasActiveRide().then(hasRide => setHasActiveRide(hasRide));
          }
          
          fetchRideRequestUpdates().then(requests => {
            if (mounted) {
              setPassengerRequests(requests.filter(r => r.rideRequestStatus !== 'CANCELLED' && r.rideRequestStatus !== 'COMPLETED'));
            }
          });
        });

      // 2. Synchronized Status Polling (Every 3 seconds)
      pollInterval = setInterval(async () => {
        try {
          const updates = await fetchRideRequestUpdates();
          if (!mounted) return;

          // Include COMPLETED requests for receipt access
          setPassengerRequests(updates.filter(r => r.rideRequestStatus !== 'CANCELLED'));

          // Check for arrival (OTP phase)
          const arrivingRide = updates.find(r => r.rideRequestStatus === 'DRIVER_REACHED_PICKUP_LOCATION');
          if (arrivingRide) {
            if (!incomingBoardingRide || incomingBoardingRide.rideRequestedId !== arrivingRide.rideRequestedId || !incomingOtp) {
              const otp = await fetchRideOtp(arrivingRide.rideRequestedId);
              setIncomingOtp(otp);
              setIncomingBoardingRide(arrivingRide);
            }
          } else {
            setIncomingBoardingRide(null);
            setIncomingOtp(null);
          }
        } catch (err) {
          console.error("Dashboard sync poll error", err);
        }
      }, 3000);
    }

    return () => { 
      mounted = false; 
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isLoggedIn, user]);

  const handleStatusChange = async (newStatus: string) => {
    setStatusChanging(true);
    try {
      const msg = await changeDriverAvailabilityStatus(newStatus);
      setAvailabilityStatus(newStatus);
      setToast({ message: msg, type: "SUCCESS", isVisible: true });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to update status", type: "ERROR", isVisible: true });
    } finally {
      setStatusChanging(false);
    }
  };

  const proceedToOfferRide = async () => {
    setActionLoading(true);
    try {
      const roles: string[] = await fetchUserRoles();
      if (roles.includes("DRIVER")) {
        router.push("/ride/post");
      } else {
        router.push("/driver/register");
      }
    } catch (err: any) {
      console.error("Failed to fetch roles:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOfferRide = () => {
    if (user?.userAccountStatus === "INACTIVE") {
      setIsEmailModalOpen(true);
      return;
    }
    proceedToOfferRide();
  };

  const handleFetchActiveRides = async () => {
    setIsFetchingRides(true);
    try {
      const rides = await fetchActiveRides();
      setPostedRides(rides);
      setShowRidesList(true);
      setToast({ message: "Active ride(s) fetched successfully", type: "SUCCESS", isVisible: true });
    } catch (err: any) {
      setToast({ message: err.message || "Failed to fetch active rides", type: "ERROR", isVisible: true });
    } finally {
      setIsFetchingRides(false);
    }
  };

  const handleCancelBooking = async (rideRequestId: number) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    setActionLoading(true);
    try {
      await cancelRideRequest(rideRequestId);
      setToast({ message: "Booking cancelled successfully", type: "SUCCESS", isVisible: true });
      // Refresh requests manually
      const updated = await fetchRideRequestUpdates();
      setPassengerRequests(updated.filter(r => r.rideRequestStatus === 'PENDING' || r.rideRequestStatus === 'ACCEPTED'));
    } catch (err: any) {
      setToast({ message: err.message || "Failed to cancel booking", type: "ERROR", isVisible: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickStartRide = async (rideId: number) => {
    setActionLoading(true);
    try {
      const msg = await startRide(rideId);
      setToast({ message: msg, type: "SUCCESS", isVisible: true });
      
      // Start background GPS tracking
      startLiveTracking(rideId);
      
      // Redirect to active tracking page
      setTimeout(() => {
        router.push(`/ride/${rideId}/active`);
      }, 1500);
    } catch (err: any) {
      setToast({ message: err.message || "Failed to start ride", type: "ERROR", isVisible: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelRide = async (rideId: number) => {
    if (!confirm("Are you sure you want to cancel this ENTIRE ride? All accepted passengers will be notified and cancelled.")) return;
    setActionLoading(true);
    try {
      const msg = await cancelRide(rideId);
      setToast({ message: msg, type: "SUCCESS", isVisible: true });
      
      // Stop tracking if it was the active ride
      stopLiveTracking();

      // Refresh state
      const hasRide = await checkHasActiveRide();
      setHasActiveRide(hasRide);
      handleFetchActiveRides(); // Reload list
    } catch (err: any) {
      setToast({ message: err.message || "Failed to cancel ride", type: "ERROR", isVisible: true });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section — only shown when logged in */}
        {isLoggedIn && user ? (
          <>
            <div className="animate-fade-in-up">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome, {user.userFullName.split(" ")[0]}! 👋
              </h1>
              <p className="text-slate-400 text-base">
                Ready to share a ride today? Here&apos;s your dashboard overview.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 animate-fade-in-up-delay">
              {/* Card 1 */}
              <div className="glass-card p-6 hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20
                    flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-sm text-slate-400">Rides Completed</p>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="glass-card p-6 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20
                    flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">₹0</p>
                    <p className="text-sm text-slate-400">Money Saved</p>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="glass-card p-6 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20
                    flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">—</p>
                    <p className="text-sm text-slate-400">Rating</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 animate-fade-in-up-delay relative">
              {isDriver && availabilityStatus && (
                <div className="mb-6 glass-card p-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-indigo-500/20">
                  <div className="flex items-center gap-3">
                     <div className={`w-3 h-3 rounded-full ${availabilityStatus === 'AVAILABLE' ? 'bg-emerald-500 animate-pulse' : availabilityStatus === 'ON_RIDE' ? 'bg-indigo-500 animate-pulse' : availabilityStatus === 'NOT_AVAILABLE' ? 'bg-amber-500' : 'bg-slate-500'}`} />
                     <p className="text-white font-medium">Your Driver Status:</p>
                  </div>
                  <div className="flex gap-2 relative">
                     {statusChanging && (
                       <svg className="absolute -left-6 top-2.5 animate-spin w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                     )}
                     <button
                        onClick={() => handleStatusChange("AVAILABLE")}
                        disabled={statusChanging || availabilityStatus === "AVAILABLE"}
                        className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${availabilityStatus === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'}`}
                     >
                        Available
                     </button>
                     <button
                        onClick={() => handleStatusChange("NOT_AVAILABLE")}
                        disabled={statusChanging || availabilityStatus === "NOT_AVAILABLE"}
                        className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${availabilityStatus === 'NOT_AVAILABLE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'}`}
                     >
                        Not Available
                     </button>
                     <button
                        disabled={true}
                        className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all bg-white/5 text-slate-600 border border-transparent cursor-not-allowed`}
                        title="Available after posting a ride"
                     >
                        On Ride
                     </button>
                     <button
                        onClick={() => handleStatusChange("OFF_DUTY")}
                        disabled={statusChanging || availabilityStatus === "OFF_DUTY"}
                        className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${availabilityStatus === 'OFF_DUTY' ? 'bg-slate-600/20 text-slate-300 border border-slate-500/30' : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent'}`}
                     >
                        Off Duty
                     </button>
                  </div>
                </div>
              )}
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-white/5">
                {/* Always show Offer a Ride */}
                <button 
                  onClick={handleOfferRide}
                  disabled={actionLoading}
                  className="glass-card p-8 text-left border-indigo-500/30 hover:border-indigo-500
                  transition-all duration-300 hover:-translate-y-1 group disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed h-full flex flex-col justify-center">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center
                      group-hover:bg-indigo-500/20 transition-all duration-300 ring-1 ring-indigo-500/20 group-hover:ring-indigo-500/40">
                      {actionLoading ? (
                        <svg className="animate-spin w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white mb-1">Offer a Ride</p>
                      <p className="text-slate-400 text-sm">Earn while you travel by sharing your seats</p>
                    </div>
                  </div>
                </button>

                {/* Find a Ride Card */}
                <button 
                  onClick={() => router.push('/rides/available')}
                  className="glass-card p-8 text-left border-purple-500/30 hover:border-purple-500
                  transition-all duration-300 hover:-translate-y-1 group h-full flex flex-col justify-center">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center
                      group-hover:bg-purple-500/20 transition-all duration-300 ring-1 ring-purple-500/20 group-hover:ring-purple-500/40">
                      <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white mb-1">Find a Ride</p>
                      <p className="text-slate-400 text-sm">Discover verified drivers heading your way</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* History Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
                {/* Passenger History Card */}
                <button 
                  onClick={() => router.push('/history/passenger')}
                  className="glass-card p-6 text-left border-white/5 hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-all">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">Passenger History</p>
                      <p className="text-slate-400 text-xs font-medium">Past ride requests and outcomes</p>
                    </div>
                  </div>
                </button>

                {/* Driver History Card */}
                <button 
                  onClick={() => {
                    if (isDriver) {
                      router.push('/history/driver');
                    } else {
                      setToast({ message: "You don't have the role for driver yet please register as driver first", type: "ERROR", isVisible: true });
                    }
                  }}
                  className="glass-card p-6 text-left border-white/5 hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-all">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">Driver History</p>
                      <p className="text-slate-400 text-xs font-medium">Completed rides and earnings history</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* My Pending/Accepted Bookings - NEW SECTION */}
              {passengerRequests.length > 0 && (
                <div className="mt-12 animate-fade-in-up">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                      My Active Bookings
                    </h2>
                    <button 
                      onClick={() => router.push('/rides/requested')}
                      className="text-xs font-black text-purple-400 uppercase tracking-widest hover:text-purple-300 transition-colors"
                    >
                      View History
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {passengerRequests.map((req) => (
                      <div 
                        key={req.rideRequestedId} 
                        onClick={() => router.push(`/ride/track/${req.rideRequestedId}`)}
                        className="glass-card p-6 border-white/5 hover:border-purple-500/30 transition-all group relative overflow-hidden cursor-pointer"
                      >
                        <div className="absolute top-0 right-0 p-3">
                           <span className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                             req.rideRequestStatus === 'ACCEPTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                             req.rideRequestStatus === 'COMPLETED' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 
                             'bg-amber-500/10 text-amber-400 border-amber-500/20'
                           }`}>
                             {req.rideRequestStatus}
                           </span>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-4">
                           <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                           </div>
                           <div>
                              <p className="text-xs font-black text-white">{req.driverName}</p>
                              <p className="text-[10px] text-slate-500 font-medium capitalize">{req.rideStatus.toLowerCase().replace('_', ' ')}</p>
                           </div>
                        </div>

                        <div className="space-y-3 mb-6">
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                              <p className="text-[11px] text-slate-300 font-medium line-clamp-1">{req.passengerSourceLocation}</p>
                           </div>
                           <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                              <p className="text-[11px] text-slate-300 font-medium line-clamp-1">{req.passengerDestinationLocation}</p>
                           </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                           <div className="flex flex-col">
                              <span className="text-xs font-black text-white">{new Date(req.rideDepartureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{new Date(req.rideDepartureTime).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                           </div>
                           <div className="flex gap-2">
                              {req.rideRequestStatus === 'COMPLETED' ? (
                                <button 
                                  className="px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                                >
                                  Receipt
                                </button>
                              ) : (
                                <>
                                  <button 
                                    className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                                  >
                                    Track
                                  </button>
                                  {(req.rideRequestStatus === 'PENDING' || req.rideRequestStatus === 'ACCEPTED') && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancelBooking(req.rideRequestedId);
                                      }}
                                      className="px-4 py-2 rounded-xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  )}
                                </>
                              )}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}



              {/* My Posted Rides Row for Drivers - only if they have active rides */}
              {isDriver && hasActiveRide && (
                <div className="mt-10 animate-fade-in-up">
                   <div className="flex items-center justify-between mb-6">
                     <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-3">
                       <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                       Driver Management
                     </h2>
                   </div>

                   <button 
                    onClick={() => {
                      if (showRidesList) {
                        setShowRidesList(false);
                      } else {
                        handleFetchActiveRides();
                      }
                    }}
                    disabled={isFetchingRides}
                    className={`w-full glass-card p-6 text-left transition-all duration-500 group relative overflow-hidden ${
                      showRidesList 
                      ? 'border-indigo-500/50 bg-indigo-500/5 shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                      : 'border-indigo-500/20 hover:border-indigo-500/50 hover:bg-white/[0.02]'
                    }`}>
                    {/* Animated background glow when open */}
                    {showRidesList && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 animate-pulse" />
                    )}

                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          showRidesList ? 'bg-indigo-500 text-white' : 'bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20'
                        }`}>
                          {isFetchingRides ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-xl font-black text-white tracking-tight">Manage Posted Rides</p>
                          <p className="text-slate-400 text-sm font-medium">Review your routes and handle join requests</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-2 font-black text-sm uppercase tracking-widest transition-all ${
                        showRidesList ? 'text-white' : 'text-indigo-400'
                      }`}>
                        {showRidesList ? 'Close Management' : 'View Rides'}
                        <svg 
                          className={`w-5 h-5 transition-transform duration-300 ${showRidesList ? 'rotate-180' : 'group-hover:translate-x-1'}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={showRidesList ? "M19 9l-7 7-7-7" : "M13 7l5 5m0 0l-5 5m5-5H6"} />
                        </svg>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {/* Active Rides List Section */}
              {showRidesList && postedRides.length > 0 && (
                <div className="mt-6 animate-fade-in-up space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {postedRides.map((ride) => (
                      <div key={ride.rideId} className="glass-card p-6 border-indigo-500/20 hover:border-indigo-500/40 transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5 flex flex-col justify-center">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">
                                    {ride.rideStatus.replace('_', ' ')}
                                </span>
                                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                                    Posted: {new Date(ride.rideCreatedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-black text-white tracking-tighter">₹{ride.estimatedFare}</p>
                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Est. Fare</p>
                            </div>
                        </div>

                        {/* Route Path */}
                        <div className="space-y-4 mb-8">
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center pt-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                    <div className="w-0.5 h-10 bg-gradient-to-b from-indigo-500 to-purple-500 my-1 opacity-20" />
                                    <div className="w-2.5 h-2.5 rounded-full border-2 border-purple-500" />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Pick-up</p>
                                        <p className="text-white text-sm font-bold line-clamp-1">{ride.sourceAddress}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Destination</p>
                                        <p className="text-white text-sm font-bold line-clamp-1">{ride.destinationAddress}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Info Bar */}
                        <div className="grid grid-cols-2 gap-2 py-4 border-y border-white/5 mb-6">
                            <div className="text-center">
                                <p className="text-white font-black text-sm">{new Date(ride.rideDepartureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Time</p>
                            </div>
                            <div className="text-center border-l border-white/5">
                                <p className="text-white font-black text-sm">{ride.availableSeats} <span className="text-slate-500 text-xs">/ {ride.totalSeats}</span></p>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">Seats</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {ride.rideStatus === 'RIDE_POSTED' && (
                                <button 
                                  onClick={() => router.push(`/ride/${ride.rideId}/requests`)}
                                  className="flex-[2] py-4 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 group"
                                >
                                  Manage
                                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                  </svg>
                                </button>
                            )}
                            
                            {ride.rideStatus === 'RIDE_POSTED' && (
                                <button 
                                  onClick={() => handleQuickStartRide(ride.rideId)}
                                  disabled={actionLoading}
                                  className="flex-[3] py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] font-black uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                                >
                                  {actionLoading ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                  )}
                                  Start Ride
                                </button>
                            )}
                            
                            {ride.rideStatus === 'RIDE_IN_PROGRESS' && (
                                <button 
                                  onClick={() => router.push(`/ride/${ride.rideId}/active`)}
                                  className="flex-[3] py-4 rounded-xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    See Live Tracking
                                </button>
                            )}

                            {/* Cancel Button - visible for both POSTED and IN_PROGRESS */}
                            <button 
                              onClick={() => handleCancelRide(ride.rideId)}
                              disabled={actionLoading}
                              className="px-4 py-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                              title="Cancel Ride"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Guest landing view */
          <div className="absolute inset-0 bg-transparent overflow-y-auto">
            {/* Background glow effects */}
            <div className="absolute top-0 left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

            <main className="relative z-10 w-full mb-0">
              {/* 1. Hero Section */}
              <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32 flex flex-col items-center text-center animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-sm font-medium mb-8">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  Join thousands of daily commuters
                </div>
                
                <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-slate-400 mb-6 tracking-tight">
                  Smart Commutes, <br className="hidden md:block" /> Shared Journeys.
                </h1>
                
                <p className="max-w-2xl text-slate-400 text-lg md:text-xl mb-10 leading-relaxed">
                  SATHI connects verified drivers with passengers heading the same way. Save money, reduce traffic, and make your daily commute eco-friendly.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <button 
                    onClick={() => router.push('/signin')}
                    className="px-8 py-4 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 hover:from-indigo-400 hover:to-purple-500"
                  >
                    Get Started Now
                  </button>
                  <button 
                    onClick={() => {
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-8 py-4 rounded-xl text-base font-semibold bg-white/5 border border-white/10 text-white transition-all duration-300 hover:bg-white/10 hover:-translate-y-1"
                  >
                    Learn More
                  </button>
                </div>
              </section>

              {/* 2. Features Section */}
              <section id="features" className="relative w-full border-t border-white/5 bg-white/[0.02] py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                  <div className="text-center mb-16 animate-fade-in-up-delay">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose SATHI?</h2>
                    <p className="text-slate-400 max-w-xl mx-auto">Everything you need for a comfortable, safe, and cost-effective journey.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300 group">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Verified Profiles</h3>
                      <p className="text-slate-400 leading-relaxed">Safety is our top priority. Every member is verified with government ID and phone number before they can offer or book rides.</p>
                    </div>

                    {/* Feature 2 */}
                    <div className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300 group delay-100">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Split Costs</h3>
                      <p className="text-slate-400 leading-relaxed">Save up to 70% on your daily commute costs. Drivers cover their fuel, and passengers travel comfortably at a fraction of taxi fares.</p>
                    </div>

                    {/* Feature 3 */}
                    <div className="glass-card p-8 hover:-translate-y-2 transition-transform duration-300 group delay-200">
                      <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-6 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">Eco-Friendly</h3>
                      <p className="text-slate-400 leading-relaxed">Fewer empty seats mean fewer cars on the road. Join our mission to reduce carbon emissions and build a sustainable future.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Testimonials Section */}
              <section className="relative w-full py-24 bg-gradient-to-b from-transparent to-black/40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Loved by Commuters</h2>
                    <p className="text-slate-400 max-w-xl mx-auto">Don't just take our word for it. Look at what our community is saying.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Testimonial 1 */}
                    <div className="bg-bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-indigo-500/30 transition-colors duration-300">
                      <div className="absolute -top-4 -right-4 text-white/[0.03] group-hover:text-indigo-500/[0.05] transition-colors">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                      </div>
                      <div className="flex gap-1 text-amber-400 mb-4">
                        {[1,2,3,4,5].map(i => (
                          <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                      </div>
                      <p className="text-slate-300 italic mb-6 relative z-10">"SATHI absolutely transformed my daily 40km commute to work. Instead of spending a fortune and driving alone, I now share the ride with great people and cut costs by half!"</p>
                      <div className="flex items-center gap-3 mt-auto">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">AK</div>
                        <div>
                          <h4 className="text-white font-medium text-sm">Arjun Kapoor</h4>
                          <p className="text-slate-500 text-xs">Software Engineer, Bangalore</p>
                        </div>
                      </div>
                    </div>

                    {/* Testimonial 2 */}
                    <div className="bg-bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/30 transition-colors duration-300">
                      <div className="absolute -top-4 -right-4 text-white/[0.03] group-hover:text-emerald-500/[0.05] transition-colors">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                      </div>
                      <div className="flex gap-1 text-amber-400 mb-4">
                        {[1,2,3,4,5].map(i => (
                          <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                      </div>
                      <p className="text-slate-300 italic mb-6 relative z-10">"As a frequent traveler between Pune and Mumbai, SATHI has been a lifesaver. Finding rides is incredibly easy, and the verified profiles make me feel incredibly safe and relaxed."</p>
                      <div className="flex items-center gap-3 mt-auto">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">NM</div>
                        <div>
                          <h4 className="text-white font-medium text-sm">Neha Sharma</h4>
                          <p className="text-slate-500 text-xs">Marketing Lead, Pune</p>
                        </div>
                      </div>
                    </div>

                    {/* Testimonial 3 */}
                    <div className="bg-bg-card border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-colors duration-300">
                      <div className="absolute -top-4 -right-4 text-white/[0.03] group-hover:text-purple-500/[0.05] transition-colors">
                        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                      </div>
                      <div className="flex gap-1 text-amber-400 mb-4">
                        {[1,2,3,4,5].map(i => (
                          <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        ))}
                      </div>
                      <p className="text-slate-300 italic mb-6 relative z-10">"The app is so smooth. The UI feels premium and everything works seamlessly. But beyond the app, making new friends on the route is the best hidden feature of SATHI carpooling!"</p>
                      <div className="flex items-center gap-3 mt-auto">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm">RD</div>
                        <div>
                          <h4 className="text-white font-medium text-sm">Rahul Desai</h4>
                          <p className="text-slate-500 text-xs">Student, Delhi</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              
              {/* Footer */}
              <footer className="w-full border-t border-white/10 bg-black/50 py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">S</div>
                    <span className="text-white font-semibold">SATHI</span>
                  </div>
                  <p className="text-slate-500 text-sm">© 2026 SATHI Carpooling. All rights reserved.</p>
                  <div className="flex gap-4">
                    <a href="#" className="text-slate-500 hover:text-white transition-colors"><span className="sr-only">Twitter</span><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg></a>
                    <a href="#" className="text-slate-500 hover:text-white transition-colors"><span className="sr-only">LinkedIn</span><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg></a>
                  </div>
                </div>
              </footer>
            </main>
          </div>
        )}
      </main>

      {/* Global verification modal */}
      <EmailVerificationModal 
        isOpen={isEmailModalOpen} 
        onClose={() => setIsEmailModalOpen(false)} 
        onSuccess={() => {
          setIsEmailModalOpen(false);
          proceedToOfferRide(); // Auto-cascade
        }} 
      />
      {/* Passenger Boarding Sync Modal */}
      {incomingBoardingRide && incomingOtp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
          <div className="relative w-full max-w-md glass-card p-10 border-white/10 shadow-[0_0_50px_rgba(34,197,94,0.1)] animate-in fade-in zoom-in duration-300">
             <div className="text-center space-y-8">
                <div className="flex flex-col items-center">
                   <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
                      <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                   </div>
                   <h2 className="text-3xl font-black text-white tracking-tight">Driver has Arrived!</h2>
                   <p className="text-slate-400 text-xs font-black uppercase tracking-widest mt-3">Share this code with {incomingBoardingRide.driverName} to start your ride</p>
                </div>

                <div className="relative py-8 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                   <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                   <p className="text-6xl font-black text-white tracking-[0.4em] text-center ml-[0.4em] drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      {incomingOtp}
                   </p>
                   <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                </div>

                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Waiting for driver verification</span>
                  </div>
                  
                  <button 
                    onClick={() => handleCancelBooking(incomingBoardingRide.rideRequestedId)}
                    className="w-full py-4 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:text-rose-400 transition-colors"
                  >
                    Cancel Ride Request
                  </button>
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
