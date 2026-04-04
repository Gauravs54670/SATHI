"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const { user, isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section — only shown when logged in */}
        {isLoggedIn && user ? (
          <>
            <div className="animate-fade-in-up">
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome, {user.userFullName.split(" ")[0]}! 👋
              </h1>
              <p className="text-slate-400 text-base">
                Ready to share a ride today? Here&apos;s your dashboard overview.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 animate-fade-in-up-delay">
              {/* Card 1 */}
              <div className="glass-card p-6 hover:border-indigo-500/40 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20
                    flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-sm text-slate-400">Rides Completed</p>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="glass-card p-6 hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20
                    flex items-center justify-center">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">₹0</p>
                    <p className="text-sm text-slate-400">Money Saved</p>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="glass-card p-6 hover:border-amber-500/40 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20
                    flex items-center justify-center">
                    <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">—</p>
                    <p className="text-sm text-slate-400">Rating</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-10 animate-fade-in-up-delay">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="glass-card p-5 text-left hover:border-indigo-500/40
                  transition-all duration-300 hover:-translate-y-0.5 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center
                      group-hover:bg-indigo-500/20 transition-colors">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Offer a Ride</p>
                      <p className="text-slate-400 text-xs mt-0.5">Share your ride with others</p>
                    </div>
                  </div>
                </button>
                <button className="glass-card p-5 text-left hover:border-purple-500/40
                  transition-all duration-300 hover:-translate-y-0.5 group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center
                      group-hover:bg-purple-500/20 transition-colors">
                      <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Find a Ride</p>
                      <p className="text-slate-400 text-xs mt-0.5">Search for available rides</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Guest view — prompt to sign in */
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600
              flex items-center justify-center text-white text-4xl font-bold mb-6
              shadow-lg shadow-indigo-500/25">
              S
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Welcome to SATHI</h1>
            <p className="text-slate-400 text-base text-center max-w-md mb-8">
              Share rides, save money, and reduce your carbon footprint. Sign in to get started!
            </p>
            <a
              href="/signin"
              className="px-8 py-3 rounded-xl text-base font-semibold
                bg-gradient-to-r from-indigo-500 to-purple-600 text-white
                transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/30
                hover:-translate-y-1 hover:from-indigo-400 hover:to-purple-500
                active:translate-y-0"
            >
              Sign In to Get Started
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
