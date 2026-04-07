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

  // On mount, check if token exists and try to load profile
  useEffect(() => {
    const token = localStorage.getItem("sathi_token");
    if (token) {
      fetchProfile()
        .then((data) => setUser(data.response || data))
        .catch(() => {
          localStorage.removeItem("sathi_token");
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      // Additionally clear legacy credentials if they exist
      localStorage.removeItem("sathi_credentials");
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await loginAndFetchProfile(email, password);
    // loginAndFetchProfile handles securely storing the JWT item now.
    setUser(data.profile.response || data.profile);
  };

  const logout = () => {
    localStorage.removeItem("sathi_token");
    localStorage.removeItem("sathi_credentials"); // safety cleanup
    setUser(null);
  };

  const refreshProfile = useCallback(async () => {
    try {
      const data = await fetchProfile();
      setUser(data.response || data);
    } catch {
      // silently fail
    }
  }, []);

  const updateStoredPassword = useCallback((newPassword: string) => {
    // Legacy support: We no longer need to update local plain-text passwords 
    // because JWT is handled by the backend seamlessly after a password update!
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
