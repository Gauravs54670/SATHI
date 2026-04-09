"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export type ToastType = "SUCCESS" | "ERROR" | "INFO";

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, isVisible, onClose, duration = 5000 }: ToastProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 500); // Wait for exit animation
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, duration]);

  if (!shouldRender || typeof document === "undefined") return null;

  const config = {
    SUCCESS: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: (
        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      glow: "shadow-[0_0_20px_rgba(16,185,129,0.1)]",
      title: "Success"
    },
    ERROR: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      icon: (
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.1)]",
      title: "Error"
    },
    INFO: {
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      icon: (
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      glow: "shadow-[0_0_20px_rgba(99,102,241,0.1)]",
      title: "Tip"
    }
  };

  const style = config[type];

  return createPortal(
    <div className={`fixed bottom-8 right-8 z-[5000] transform transition-all duration-500 ease-out ${
      isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95"
    }`}>
      <div className={`glass-card p-4 flex items-center gap-4 border-2 ${style.bg} ${style.border} ${style.glow} min-w-[320px] max-w-md`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${type === 'SUCCESS' ? 'bg-emerald-500/20' : type === 'ERROR' ? 'bg-red-500/20' : 'bg-indigo-500/20'}`}>
          {style.icon}
        </div>
        <div className="flex-grow pr-4">
          <span className={`text-[10px] font-black uppercase tracking-widest block mb-0.5 ${type === 'SUCCESS' ? 'text-emerald-500' : type === 'ERROR' ? 'text-red-500' : 'text-indigo-400'}`}>
            {style.title}
          </span>
          <p className="text-sm font-medium text-slate-200 leading-tight">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
