import React from 'react';

export default function LoadingOverlay({ message = 'Please wait...' }) {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 dark:bg-[#0f1117]/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-5">
        {/* Spinner */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" />
        </div>

        {/* Logo */}
        <img src="/Group 5.svg" alt="IsItFake Logo" className="h-6 object-contain opacity-70" />

        {/* Message */}
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
          {message}
        </p>
      </div>
    </div>
  );
}
