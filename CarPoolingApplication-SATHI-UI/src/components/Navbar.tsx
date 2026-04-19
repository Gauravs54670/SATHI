"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Avatar from "./Avatar";
import AvatarDropdown from "./AvatarDropdown";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Close mobile menu on navigation
  const navigate = (path: string) => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-[#0f0f1a]/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            {/* Hamburger Button (Mobile Only) */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 lg:hidden rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Logo — clickable, navigates to dashboard */}
            <div
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 cursor-pointer group select-none"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600
                flex items-center justify-center text-white font-bold text-sm
                transition-all duration-300 group-hover:shadow-lg group-hover:shadow-indigo-500/30
                group-hover:scale-110">
                S
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400
                bg-clip-text text-transparent transition-all duration-300
                group-hover:from-indigo-300 group-hover:to-purple-300">
                SATHI
              </span>
            </div>
          </div>

          {/* Navigation Links (Desktop) */}
          <div className="hidden lg:flex items-center gap-8 ml-8 flex-grow justify-start">
            <button 
              onClick={() => router.push("/rides/available")}
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
            >
              Find a Ride
            </button>
            <button 
              onClick={() => router.push("/rides/requested")}
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2"
            >
              My Ride Requests
            </button>
          </div>

          {/* Right side — Notifications, Avatar (logged in) or Sign In button (guest) */}
          <div className="flex items-center gap-4">
            {isLoggedIn && user ? (
              <>
                <NotificationBell />
                <div className="relative">
                  <Avatar
                    name={user.userFullName}
                    email={user.email}
                    imageUrl={user.profilePictureUrl}
                    size={38}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  />
                  <AvatarDropdown
                    isOpen={dropdownOpen}
                    onClose={() => setDropdownOpen(false)}
                  />
                </div>
              </>
            ) : (
              <button
                onClick={() => router.push("/signin")}
                className="px-5 py-2 rounded-lg text-sm font-medium
                  bg-gradient-to-r from-indigo-500 to-purple-600 text-white
                  transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30
                  hover:-translate-y-0.5 hover:from-indigo-400 hover:to-purple-500
                  active:translate-y-0"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMobileMenuOpen && (
        <div className="lg:hidden animate-slide-down bg-[#0f0f1a]/95 backdrop-blur-3xl border-b border-white/5">
          <div className="px-4 pt-4 pb-8 space-y-4">
            <button 
              onClick={() => navigate("/dashboard")}
              className="w-full text-left px-4 py-3 rounded-xl bg-white/5 text-sm font-bold text-white uppercase tracking-widest"
            >
              Dashboard
            </button>
            <button 
              onClick={() => navigate("/rides/available")}
              className="w-full text-left px-4 py-3 rounded-xl bg-white/5 text-sm font-bold text-slate-400 hover:text-white transition-all uppercase tracking-widest"
            >
              Find a Ride
            </button>
            <button 
              onClick={() => navigate("/rides/requested")}
              className="w-full text-left px-4 py-3 rounded-xl bg-white/5 text-sm font-bold text-slate-400 hover:text-white transition-all uppercase tracking-widest"
            >
              My Ride Requests
            </button>
            {!isLoggedIn && (
               <button
                  onClick={() => navigate("/signin")}
                  className="w-full text-center py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black uppercase tracking-widest text-xs"
               >
                  Sign In
               </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
