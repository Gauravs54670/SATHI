import { updateRideGPS, RideGPSUpdatesDTO } from "./api";

let watchId: number | null = null;

/**
 * Starts a background geolocation tracking loop.
 * Sends GPS coordinates to the server every time the position changes.
 */
export const startLiveTracking = (rideId: number) => {
  if (typeof window === "undefined" || !navigator.geolocation) {
    console.error("Geolocation is not supported by this browser.");
    return;
  }

  // Already tracking
  if (watchId !== null) {
    console.log(`[RideTracker] Already tracking ride #${rideId}`);
    return;
  }

  console.log(`[RideTracker] Starting background tracking for ride #${rideId}`);

  watchId = navigator.geolocation.watchPosition(
    (position) => {
      const payload: RideGPSUpdatesDTO = {
        rideId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed || 0,
        heading: position.coords.heading || 0,
        timestamp: new Date(position.timestamp).toISOString(),
      };
      
      console.log(`[RideTracker] Updating GPS for ride #${rideId}:`, {
        lat: payload.latitude,
        lng: payload.longitude,
        acc: position.coords.accuracy
      });

      updateRideGPS(payload).catch((err) => {
        console.error("[RideTracker] Server sync failed:", err.message);
      });
    },
    (error) => {
      console.error("[RideTracker] Geolocation error:", error.code, error.message);
      
      // If permission denied, we should probably alert the UI
      if (error.code === error.PERMISSION_DENIED) {
        stopLiveTracking();
      }
    },
    {
      enableHighAccuracy: true,
      maximumAge: 10000, // Accept cached positions up to 10s old
      timeout: 15000,    // Wait up to 15s for each update
    }
  );
};

/**
 * Stops the active geolocation tracking loop.
 */
export const stopLiveTracking = () => {
  if (watchId !== null) {
    console.log("[RideTracker] Stopping geolocation tracking.");
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
};

/**
 * Checks if tracking is currently active.
 */
export const isTrackingActive = () => watchId !== null;
