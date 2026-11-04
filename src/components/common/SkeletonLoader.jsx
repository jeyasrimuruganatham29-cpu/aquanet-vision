import React from 'react';

export default function SkeletonLoader({ className = '', height = 'h-6', width = 'w-full', rounded = 'rounded-xl' }) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200/50 dark:bg-slate-800/40 backdrop-blur-md ${height} ${width} ${rounded} ${className}`}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-cyan-400/10 to-transparent" />
    </div>
  );
}
