// Centralized API helper for communicating with the Spring Boot backend
// All authenticated requests use HTTP Basic Auth (Base64-encoded email:password)

const API_BASE = "/api/car-pooling";

// Build the Basic Auth header from email + password
function getAuthHeader(email: string, password: string): string {
  return "Basic " + btoa(`${email}:${password}`);
}

// Get stored credentials from localStorage
function getStoredCredentials(): { email: string; password: string } | null {
  if (typeof window === "undefined") return null;
  const creds = localStorage.getItem("sathi_credentials");
  if (!creds) return null;
  try {
    return JSON.parse(creds);
  } catch {
    return null;
  }
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

// ─── Authenticated APIs (Basic Auth) ────────────────────────

export async function loginAndFetchProfile(email: string, password: string) {
  // There's no dedicated login endpoint — we "login" by trying to fetch the profile
  // If credentials are valid, the backend returns profile data
  const res = await fetch(`${API_BASE}/user/myProfile`, {
    method: "GET",
    headers: {
      Authorization: getAuthHeader(email, password),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Invalid email or password");
  return data;
}

export async function fetchProfile() {
  const creds = getStoredCredentials();
  if (!creds) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/user/myProfile`, {
    method: "GET",
    headers: {
      Authorization: getAuthHeader(creds.email, creds.password),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch profile");
  return data;
}

export async function uploadProfilePhoto(file: File) {
  const creds = getStoredCredentials();
  if (!creds) throw new Error("Not logged in");
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/user/uploadProfile`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(creds.email, creds.password),
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to upload photo");
  return data;
}
