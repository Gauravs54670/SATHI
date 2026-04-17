// Centralized API helper for communicating with the Spring Boot backend
// All authenticated requests use JWT (Bearer token)

const API_BASE = "/api/car-pooling";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sathi_token");
}

function getAuthHeader(): string {
  const token = getAuthToken();
  return token ? `Bearer ${token}` : "";
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers = { ...options.headers, Authorization: getAuthHeader() };
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("sathi_token");
      window.location.href = "/signin";
    }
  }
  return res;
}

// ─── Public APIs (no auth needed) ───────────────────────────

export interface RegisterPayload {
  userFullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  gender: string;
}

export async function registerUser(payload: RegisterPayload) {
  const res = await fetch(`${API_BASE}/public/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Registration failed");
  return data;
}

// ─── Authenticated APIs (JWT) ────────────────────────

export async function loginAndFetchProfile(email: string, password: string) {
  // 1. Get JWT from backend
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error(loginData.error || loginData.message || "Invalid email or password");

  const token = loginData.token;
  if (!token) throw new Error("No token received from backend");

  // Temporarily store token so subsequent fetch uses it properly in browser
  if (typeof window !== "undefined") {
    localStorage.setItem("sathi_token", token);
  }

  // 2. Fetch the actual profile using the JWT
  const profileRes = await fetchWithAuth(`${API_BASE}/user/myProfile`, {
    method: "GET",
  });
  const profileData = await profileRes.json();
  if (!profileRes.ok) throw new Error(profileData.exceptionMessage || profileData.message || "Failed to fetch profile");

  return { token, profile: profileData };
}

export async function fetchProfile() {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/user/myProfile`, {
    method: "GET",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to fetch profile");
  return data;
}

export async function uploadProfilePhoto(file: File) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetchWithAuth(`${API_BASE}/user/uploadProfile`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to upload photo");
  return data;
}

export interface EmergencyContactDTO {
  contactId?: number; // optional for new contacts
  name: string;
  contact: string;
}

export interface UserProfileDTO {
  userId: number;
  userFullName: string;
  email: string;
  phoneNumber: string;
  userAccountStatus: string;
  accountCreatedAt: string;
  accountUpdatedAt: string;
  profilePictureUrl?: string;
  gender?: string;
  bio?: string;
  averageRating?: number;
  totalRatingsCount?: number;
  totalRidesCompleted?: number;
  emergencyContacts?: EmergencyContactDTO[];
  isEmailVerified: boolean;
}

export async function updateProfile(payload: Partial<UserProfileDTO>) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/user/update-myProfile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to update profile");
  return data;
}

export async function deleteEmergencyContact(contactId: number) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/user/delete-emergencyContact?contactId=${contactId}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to delete contact");
  return data;
}

export async function changePassword(payload: any) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/user/change-password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to change password");
  return data;
}

export async function requestOtp(email: string) {
  const res = await fetch(`${API_BASE}/auth/request-otp?email=${encodeURIComponent(email)}`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to request OTP");
  return data;
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  const res = await fetch(
    `${API_BASE}/auth/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}&newPassword=${encodeURIComponent(newPassword)}`,
    {
      method: "POST",
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to reset password");
  return data;
}

// ─── Verification & Driver APIs (Authenticated) ────────────────────────

export async function sendOtpForEmailVerification(email: string) {
  return requestOtp(email); // Reuses the exact same backend logic
}

export async function verifyEmailOtp(otp: string) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/user/verify-email?otp=${encodeURIComponent(otp)}`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to verify email");
  return data;
}

export async function fetchUserRoles() {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/user/myRoles`, {
    method: "GET",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to fetch roles");
  return data.response; // returns string[]
}

export interface DriverRegistrationPayload {
  licenseNumber: string;
  licenseExpirationDate: string; // YYYY-MM-DD
  vehicleModel: string;
  vehicleNumber: string;
  vehicleSeatCapacity: number;
  vehicleCategory: string;
  vehicleClass: string;
}

export async function registerDriver(payload: DriverRegistrationPayload) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/user/register-driver`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to register driver");
  return data.response;
}

export async function fetchDriverProfile() {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/myProfile`, {
    method: "GET",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to fetch driver profile");
  return data.data; // Note: Driver Controller maps this uniquely under "data"
}

export interface DriverProfileUpdateRequest {
  licenseExpirationDate?: string;
  vehicleModel?: string;
  vehicleNumber?: string;
  vehicleSeatCapacity?: number;
  vehicleCategory?: string;
  vehicleClass?: string;
}

export interface RideRequestPayload {
  sourceLat: number;
  sourceLong: number;
  boardingAddress: string;
  sourcePlaceName?: string;
  destinationLat: number;
  destinationLong: number;
  destinationAddress: string;
  destinationPlaceName?: string;
  departureTime: string; // ISO string
  availableSeats: number;
  pricePerKm: number;
  routePath?: string;
  totalDistanceKm?: number;
}

export async function postRide(payload: RideRequestPayload) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/post-ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to post ride");
  return data;
}

export async function updateDriverProfile(payload: DriverProfileUpdateRequest) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/update-profile`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to update driver profile");
  return data.data;
}

export async function changeDriverAvailabilityStatus(status: string) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/change-availability-status?status=${encodeURIComponent(status)}`, {
    method: "PUT",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to update availability status");
  return data.message;
}

export async function checkHasActiveRide() {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/has-active-ride`, {
    method: "GET",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to check active rides");
  return data.data; // returns boolean
}

export interface DriverPostedRide {
  rideId: number;
  sourceAddress: string;
  destinationAddress: string;
  rideDepartureTime: string;
  rideCreatedAt: string;
  rideStatus: string;
  estimatedDistanceOfRide: number;
  baseFare: number;
  pricePerKm: number;
  estimatedFare: number;
  availableSeats: number;
  totalSeats: number;
}

export interface RideGPSUpdatesDTO {
  rideId: number;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  timestamp: string; // ISO string
}

export async function fetchActiveRides() {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/active-ride`, {
    method: "GET",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to fetch active rides");
  return data.data as DriverPostedRide[];
}

export interface AvailablePostedRideDTO {
  rideId: number;
  driverName: string;
  driverEmail: string;
  driverRating: number;
  driverSourceAddress: string;
  driverDestinationAddress: string;
  rideDepartureTime: string;
  totalAvailableSeats: number;
  basePrice: number;
  pricePerKm: number;
  totalEstimatedCost: number;
  totalDistance: number;
  vehicleModel: string;
  vehicleClass: string;
  vehicleCategory: string;
}

export async function fetchAvailableRides(
  city?: string,
  sLat?: number,
  sLng?: number,
  dLat?: number,
  dLng?: number
) {
  if (!getAuthToken()) throw new Error("Not logged in");

  const params = new URLSearchParams();
  if (city) params.append("city", city);
  if (sLat !== undefined) params.append("sLat", sLat.toString());
  if (sLng !== undefined) params.append("sLng", sLng.toString());
  if (dLat !== undefined) params.append("dLat", dLat.toString());
  if (dLng !== undefined) params.append("dLng", dLng.toString());

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetchWithAuth(`${API_BASE}/passenger/available-rides${query}`, {
    method: "GET",
  });
  
  let data;
  try {
    data = await res.json();
  } catch (err) {
    if (!res.ok) throw new Error(`Server error (${res.status}): Failed to fetch available rides`);
    throw err;
  }

  if (!res.ok) {
    console.error(`Available Rides API Error [${res.status}]:`, data);
    const errorMsg = data.exceptionMessage || data.message || data.error || `Server error (${res.status})`;
    throw new Error(errorMsg);
  }
  return data.data; // returns AvailablePostedRideDTO[]
}

export interface RideSharingRequestToPostedRide {
  rideId: number;
  passengerSourceLng: number;
  passengerSourceLat: number;
  passengerSourceLocation: string;
  passengerDestinationLng: number;
  passengerDestinationLat: number;
  passengerDestinationLocation: string;
  seatsRequired: number;
}

export interface RideSharingResponseToPostedRide {
  rideId: number;
  rideRequestId: number;
  passengerName: string;
  passengerSourceAddress: string;
  passengerDestinationAddress: string;
  requestStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  requestedSeats: number;
  requestedAt: string;
}

export async function requestRide(payload: RideSharingRequestToPostedRide) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/passenger/request-ride`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  
  let data;
  try {
    data = await res.json();
  } catch (err) {
    if (!res.ok) throw new Error(`Server error (${res.status}): Failed to request ride`);
    throw err;
  }

  if (!res.ok) {
    console.error(`Request Ride API Error [${res.status}]:`, data);
    const errorMsg = data.exceptionMessage || data.message || data.error || `Server error (${res.status})`;
    throw new Error(errorMsg);
  }
  return data.data as RideSharingResponseToPostedRide;
}

export interface RideRequestUpdatesDTO {
  rideId: number;
  rideRequestedId: number;
  rideRequestStatus: string;
  requestedAt: string;
  driverName: string;
  rideDepartureTime: string;
  passengerSourceLocation: string;
  passengerDestinationLocation: string;
  requestedSeats: number;
  estimatedFare: number;
  rideStatus: string;
  isDriverReachedPickupLocation: boolean;
  rejectionCount?: number;
  numberOfRequests?: number;
}

export interface PassengerRideBookingRequest {
  rideRequestId: number;
  passengerName: string;
  pickupLocation: string;
  dropLocation: string;
  rideRequestStatus: string;
  requestedSeats: number;
  requestedAt: string;
  phoneNumber?: string;
}

export interface DriverAcceptedRideRequestDTO {
  rideId: number;
  rideRequestId: number;
  passengerName: string;
  passengerContact: string; // mapped from phoneNumber
  boardingAddress: string;
  destinationAddress: string;
  requestedSeats: number;
  rideRequestStatus: string;
}

export interface RideAllBookingRequestsDTO {
  pendingRequests: PassengerRideBookingRequest[];
  acceptedPassengers: DriverAcceptedRideRequestDTO[];
}

export interface RideAcceptedPassengerDTO {
  passengerRideRequestId: number;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  passengerPickupLocation: string;
  passengerDropLocation: string;
  numberOfSeats: number;
  passengerGender: string;
  rideRequestStatus: string;
  passengerProfilePicture?: string;
  rideDepartureTime: string;
}

export interface RideAcceptedDriverDTO {
  rideRequestId: number;
  rideId: number;
  driverName: string;
  driverPhoneNumber: string;
  driverProfileUrl?: string;
  rideStatus: string;
  vehicleModel: string;
  vehicleNumber: string;
  sourceAddress: string;
  destinationAddress: string;
  rideDepartureTime: string;
  estimatedFare: number;
}

export async function fetchRideRequestUpdates() {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/passenger/ride-request-updates`, {
    method: "GET",
  });
  
  let data;
  try {
    data = await res.json();
  } catch (err) {
    if (!res.ok) throw new Error(`Server error (${res.status}): Failed to fetch ride updates`);
    throw err;
  }

  if (!res.ok) {
    console.error(`Ride Updates API Error [${res.status}]:`, data);
    const errorMsg = data.exceptionMessage || data.message || data.error || `Server error (${res.status})`;
    throw new Error(errorMsg);
  }
  return data.data as RideRequestUpdatesDTO[];
}

export async function logoutUser(email: string) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/auth/logout?email=${encodeURIComponent(email)}`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Logout failed");
  return data.message;
}

export async function fetchRideRequests(rideId: number) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/ride-requests?rideId=${rideId}`, {
    method: "GET",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to fetch ride requests");
  return data.data as RideAllBookingRequestsDTO;
}

export async function fetchRideAcceptedPassengers(rideId: number) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/ride-accepted-passengers?rideId=${rideId}`, {
    method: "GET",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to fetch accepted passengers");
  return data.data as RideAcceptedPassengerDTO[];
}

export async function fetchRideAcceptedDrivers(rideRequestId: number) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/passenger/ride-accepted-drivers?requestId=${rideRequestId}`, {
    method: "GET",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to fetch accepted driver");
  return data.data as RideAcceptedDriverDTO[];
}

export async function acceptRideRequest(rideId: number, rideRequestId: number) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/accept-ride-request?rideId=${rideId}&rideRequestId=${rideRequestId}`, {
    method: "PUT",
  });
  
  let data;
  try {
    data = await res.json();
  } catch (err) {
    if (!res.ok) throw new Error(`Server error (${res.status}): Failed to accept request`);
    throw err;
  }

  if (!res.ok) {
    console.error(`Accept Ride API Error [${res.status}]:`, data);
    const errorMsg = data.exceptionMessage || data.message || data.error || `Server error (${res.status})`;
    throw new Error(errorMsg);
  }
  return data.message as string;
}

export async function startRide(rideId: number) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/start-ride?rideId=${rideId}`, {
    method: "PUT",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to start ride");
  return data.message as string;
}

export async function updateRideGPS(payload: RideGPSUpdatesDTO) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/update-ride-gps`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to update GPS");
  return data.message as string;
}

export async function rejectRideRequest(rideId: number, rideRequestId: number) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/reject-ride-request?rideId=${rideId}&rideRequestId=${rideRequestId}`, {
    method: "PUT",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to reject ride request");
  return data.message as string;
}
export async function cancelRideRequest(rideRequestId: number) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/passenger/cancel-ride-request?rideRequestId=${rideRequestId}`, {
    method: "POST",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to cancel ride request");
  return data.message as string;
}

export async function notifyDriverReached(rideId: number, rideRequestId: number) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/reached-passenger?rideId=${rideId}&rideRequestId=${rideRequestId}`, {
    method: "PUT",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to notify arrival");
  return data.message as string;
}

export async function verifyPassengerOtp(rideId: number, rideRequestId: number, otp: string) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/verify-otp?rideId=${rideId}&rideRequestId=${rideRequestId}&otp=${otp}`, {
    method: "PUT",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to verify OTP");
  return data.message as string;
}

export async function cancelPickup(rideId: number, rideRequestId: number) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/driver/cancel-pickup?rideId=${rideId}&rideRequestId=${rideRequestId}`, {
    method: "PUT",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to cancel pickup");
  return data.message as string;
}


export interface NotificationDTO {
  notificationId: number;
  message: string;
  type: string;
  relatedEntityId?: number;
  isRead: boolean;
  createdAt: string;
}

export async function fetchNotifications() {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/notifications`, {
    method: "GET",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to fetch notifications");
  return data.data as NotificationDTO[];
}

export async function fetchUnreadCount() {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/notifications/unread-count`, {
    method: "GET",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to fetch unread count");
  return data.data as number;
}

export async function markAllNotificationsRead() {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/notifications/mark-all-read`, {
    method: "PUT",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to mark all as read");
  return data.message;
}

export async function markNotificationRead(id: number) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/notifications/mark-read/${id}`, {
    method: "PUT",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to mark notification as read");
  return data.message;
}

export async function deleteNotification(id: number) {
  if (!getAuthToken()) throw new Error("Not logged in");
  const res = await fetchWithAuth(`${API_BASE}/notifications/${id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.exceptionMessage || data.message || "Failed to delete notification");
  return data.message;
}
