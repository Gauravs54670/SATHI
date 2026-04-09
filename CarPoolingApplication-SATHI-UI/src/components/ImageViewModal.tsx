"use client";

import Image from "next/image";

interface ImageViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  name?: string;
}

export default function ImageViewModal({ isOpen, onClose, imageUrl, name }: ImageViewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative max-w-2xl w-full flex flex-col items-center animate-fade-in-up">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-slate-400 hover:text-white transition-colors flex items-center gap-2 group"
        >
          <span className="text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Close</span>
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative rounded-2xl overflow-hidden glass-card p-2 shadow-2xl border-indigo-500/20">
            <div className="relative w-full h-auto aspect-square bg-[#0a0a14]">
                {imageUrl ? (
                    <Image
                        src={imageUrl}
                        alt={name || "Profile Photo"}
                        width={600}
                        height={600}
                        className="object-contain w-full h-full rounded-xl"
                        priority
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl">
                        <svg className="w-20 h-20 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                )}
            </div>
            {name && (
                <div className="px-6 py-4 text-center">
                    <h3 className="text-xl font-bold text-white">{name}</h3>
                    <p className="text-sm text-slate-400 mt-1">Profile Photo</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
