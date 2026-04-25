"use client";

import React, { useState } from 'react';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
  targetName: string;
  title?: string;
}

export default function RatingModal({ isOpen, onClose, onSubmit, targetName, title }: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setLoading(true);
    try {
      await onSubmit(rating, comment || undefined);
      onClose();
    } catch (err) {
      console.error("Rating failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md glass-card p-10 border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{title || 'Rate Your Experience'}</h2>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest mt-2 px-8">How was your journey with {targetName}?</p>
          </div>

          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`w-12 h-12 rounded-xl transition-all active:scale-90 ${
                  star <= rating
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110'
                    : 'bg-white/5 text-slate-600 border border-white/10 hover:bg-white/10'
                }`}
              >
                <svg className="w-6 h-6 mx-auto" fill={star <= rating ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a brief review (optional)..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none h-28 transition-all shadow-inner"
          />

          <div className="space-y-4 pt-4">
            <button 
              onClick={handleSubmit}
              disabled={loading || rating === 0}
              className="w-full py-5 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-xl hover:shadow-amber-500/20 disabled:opacity-50 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-[0.98]"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                   <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Submitting...
                </div>
              ) : "Submit Rating"}
            </button>
            
            <button 
              onClick={onClose}
              disabled={loading}
              className="w-full py-4 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
