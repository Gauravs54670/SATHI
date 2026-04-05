"use client";

import { useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AvatarDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AvatarDropdown({ isOpen, onClose }: AvatarDropdownProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      className="absolute right-0 top-full mt-2 w-48 glass-card py-1 z-50
        animate-fade-in-up shadow-xl"
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
      <div className="border-t border-white/5 my-1" />
      <button
        onClick={() => {
          logout();
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
    </div>
  );
}
