import React from 'react';
import { motion } from 'framer-motion';

export default function Gauge({
  value = 0,
  min = 0,
  max = 100,
  size = 200,
  strokeWidth = 14,
  label = 'Water Quality Index',
  sublabel = 'WQI Score',
  unit = '',
  status = 'safe', // 'safe' | 'moderate' | 'unsafe'
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Arc angle: 260 degrees (leaving 100 degree gap at bottom)
  const angle = 260;
  const strokeDasharray = (circumference * angle) / 360;

  const normalizedValue = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const strokeDashoffset = strokeDasharray * (1 - normalizedValue);

  // Gradient colors based on status
  const gradientMap = {
    safe: {
      from: '#10B981',
      to: '#00F5FF',
      glow: 'rgba(16, 185, 129, 0.3)',
      text: 'text-emerald-400',
    },
    moderate: {
      from: '#F59E0B',
      to: '#FCD34D',
      glow: 'rgba(245, 158, 11, 0.3)',
      text: 'text-amber-400',
    },
    unsafe: {
      from: '#EF4444',
      to: '#F87171',
      glow: 'rgba(239, 68, 68, 0.3)',
      text: 'text-rose-400',
    },
  };

  const colors = gradientMap[status] || gradientMap.safe;
  const gradId = `gaugeGrad-${Math.random().toString(36).substr(2, 6)}`;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform rotate-[140deg]"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.from} />
              <stop offset="100%" stopColor={colors.to} />
            </linearGradient>
            <filter id={`glow-${gradId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={colors.glow} />
            </filter>
          </defs>

          {/* Track background */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800/80"
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeDasharray} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Animated Value Arc */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeDasharray} ${circumference}`}
            strokeLinecap="round"
            filter={`url(#glow-${gradId})`}
            initial={{ strokeDashoffset: strokeDasharray }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <span className="text-xs uppercase tracking-widest font-semibold text-slate-400 dark:text-slate-400">
            {sublabel}
          </span>
          <div className="flex items-baseline justify-center">
            <span className={`text-4xl md:text-5xl font-extrabold tracking-tight font-sans ${colors.text}`}>
              {value}
            </span>
            {unit && <span className="ml-1 text-sm font-medium text-slate-400">{unit}</span>}
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-[120px] truncate">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
