"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Root page — always go to dashboard (dashboard handles logged-in vs guest)
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  // Loading spinner while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
