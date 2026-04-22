"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { fetchUserRoles } from "@/lib/api";
import Toast from "./Toast";

interface AvatarDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AvatarDropdown({ isOpen, onClose }: AvatarDropdownProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isDriver, setIsDriver] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "SUCCESS" | "ERROR" | "INFO"; isVisible: boolean }>({
    message: "",
    type: "INFO",
    isVisible: false
  });

  useEffect(() => {
    if (isOpen) {
      fetchUserRoles().then(roles => {
        setIsDriver(roles.includes("DRIVER"));
      }).catch(() => setIsDriver(false));
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-48 bg-[#0f0f1a] border border-white/10 rounded-xl py-1 z-50
        animate-fade-in-up shadow-2xl"
    >
      <button
        onClick={() => {
          router.push("/profile");
          onClose();
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-slate-200
          hover:bg-white/5 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        My Profile
      </button>
      <button
        onClick={() => {
          router.push("/profile/edit");
          onClose();
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-slate-200
          hover:bg-white/5 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Update Profile
      </button>
      {isDriver && (
        <button
          onClick={() => {
            router.push("/driver/profile");
            onClose();
          }}
          className="w-full text-left px-4 py-2.5 text-sm text-slate-200
            hover:bg-white/5 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
          Driver Profile
        </button>
      )}
      <div className="border-t border-white/5 my-1" />
      
      {/* Ride History Options */}
      <button
        onClick={() => {
          router.push("/history/passenger");
          onClose();
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-slate-200
          hover:bg-white/5 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Passenger History
      </button>

      <button
        onClick={() => {
          if (isDriver) {
            router.push("/history/driver");
            onClose();
          } else {
            setToast({
              message: "You don't have the role for driver yet please register as driver first",
              type: "ERROR",
              isVisible: true
            });
          }
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-slate-200
          hover:bg-white/5 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Driver History
      </button>

      <div className="border-t border-white/5 my-1" />
      <button
        onClick={async () => {
          await logout();
          router.push("/dashboard");
          onClose();
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-red-400
          hover:bg-white/5 transition-colors flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logout
      </button>
      
      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  );
}
