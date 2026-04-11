"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Avatar from "./Avatar";
import AvatarDropdown from "./AvatarDropdown";

export default function Navbar() {
  const { user, isLoggedIn } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-[#0f0f1a]/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo — clickable, navigates to dashboard */}
          <div
            onClick={() => router.push("/dashboard")}
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

          {/* Navigation Links (Desktop) */}
          <div className="hidden md:flex items-center gap-8 ml-8 flex-grow justify-start">
            <button 
              onClick={() => router.push("/rides/available")}
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
            >
              Find a Ride
            </button>
            <button 
              onClick={() => router.push("/rides/requested")}
              className="text-sm font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
            >
              My Requests
            </button>
          </div>

          {/* Right side — Avatar (logged in) or Sign In button (guest) */}
          <div className="relative">
            {isLoggedIn && user ? (
              <>
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
    </nav>
  );
}
