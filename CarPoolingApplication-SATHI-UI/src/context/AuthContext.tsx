"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginAndFetchProfile, fetchProfile } from "@/lib/api";

// Shape of the user profile returned from the backend
import { UserProfileDTO } from "@/lib/api";

export type UserProfile = UserProfileDTO;

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateStoredPassword: (newPassword: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check if credentials exist and try to load profile
  useEffect(() => {
    const creds = localStorage.getItem("sathi_credentials");
    if (creds) {
      fetchProfile()
        .then((data) => setUser(data.response))
        .catch(() => {
          localStorage.removeItem("sathi_credentials");
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await loginAndFetchProfile(email, password);
    // Store credentials for subsequent API calls
    localStorage.setItem(
      "sathi_credentials",
      JSON.stringify({ email, password })
    );
    setUser(data.response);
  };

  const logout = () => {
    localStorage.removeItem("sathi_credentials");
    setUser(null);
  };

  const refreshProfile = useCallback(async () => {
    try {
      const data = await fetchProfile();
      setUser(data.response);
    } catch {
      // silently fail
    }
  }, []);

  const updateStoredPassword = useCallback((newPassword: string) => {
    const creds = localStorage.getItem("sathi_credentials");
    if (creds) {
      try {
        const parsed = JSON.parse(creds);
        localStorage.setItem(
          "sathi_credentials",
          JSON.stringify({ email: parsed.email, password: newPassword })
        );
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggedIn: !!user,
        login,
        logout,
        refreshProfile,
        updateStoredPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
