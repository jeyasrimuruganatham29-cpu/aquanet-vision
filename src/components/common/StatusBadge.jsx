import React from 'react';

export default function StatusBadge({
  status = 'safe',
  label,
  size = 'md',
  pulse = true,
  className = '',
}) {
  const styles = {
    safe: {
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-500',
      pulse: 'bg-emerald-400',
      defaultLabel: 'Safe / Optimal',
    },
    moderate: {
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      dot: 'bg-amber-500',
      pulse: 'bg-amber-400',
      defaultLabel: 'Moderate Risk',
    },
    unsafe: {
      bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
      dot: 'bg-rose-500',
      pulse: 'bg-rose-400',
      defaultLabel: 'Critical / Unsafe',
    },
    info: {
      bg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      dot: 'bg-cyan-500',
      pulse: 'bg-cyan-400',
      defaultLabel: 'Informational',
    },
  };

  const current = styles[status] || styles.safe;
  const displayText = label || current.defaultLabel;

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1.5',
    md: 'text-xs md:text-sm px-3 py-1 gap-2',
    lg: 'text-sm md:text-base px-4 py-1.5 gap-2.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border backdrop-blur-md ${
        current.bg
      } ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.pulse}`}
          />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`}
        />
      </span>
      <span>{displayText}</span>
    </span>
  );
}
