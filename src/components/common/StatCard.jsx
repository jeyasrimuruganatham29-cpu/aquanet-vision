import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';

export default function StatCard({
  icon: Icon,
  title,
  value,
  numericValue,
  unit = '',
  description,
  trend,
  glowColor = 'none',
  delay = 0,
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (numericValue === undefined) return;
    let start = 0;
    const duration = 1200; // ms
    const frameRate = 1000 / 60;
    const totalFrames = Math.round(duration / frameRate);
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // easeOutExpo curve
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(start + (numericValue - start) * ease));

      if (frame === totalFrames) {
        clearInterval(timer);
        setCount(numericValue);
      }
    }, frameRate);

    return () => clearInterval(timer);
  }, [numericValue]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard hoverEffect={true} glowColor={glowColor} className="h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-500 dark:text-cyan-neon border border-cyan-500/20">
              {Icon && <Icon className="w-6 h-6" />}
            </div>
            {trend && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                trend.positive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {trend.value}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">
              {numericValue !== undefined ? count.toLocaleString() : value}
            </span>
            {unit && <span className="text-lg font-medium text-slate-400">{unit}</span>}
          </div>
        </div>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 border-t border-slate-200/40 dark:border-slate-800/60 pt-3">
            {description}
          </p>
        )}
      </GlassCard>
    </motion.div>
  );
}
