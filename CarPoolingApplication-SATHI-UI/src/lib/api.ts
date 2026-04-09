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
