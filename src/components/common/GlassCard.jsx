import React from 'react';
import { motion } from 'framer-motion';

export default function GlassCard({
  children,
  className = '',
  hoverEffect = false,
  glowColor = 'none',
  onClick,
  ...props
}) {
  const glowStyles = {
    none: '',
    cyan: 'border-l-4 border-l-cyan-400 dark:border-l-cyan-neon shadow-[0_0_20px_-3px_rgba(0,245,255,0.2)]',
    safe: 'border-l-4 border-l-emerald-500 shadow-[0_0_20px_-3px_rgba(16,185,129,0.2)]',
    moderate: 'border-l-4 border-l-amber-500 shadow-[0_0_20px_-3px_rgba(245,158,11,0.2)]',
    unsafe: 'border-l-4 border-l-rose-500 shadow-[0_0_20px_-3px_rgba(239,68,68,0.2)]',
  };

  const Component = hoverEffect ? motion.div : 'div';
  const hoverProps = hoverEffect
    ? {
        whileHover: { y: -3, scale: 1.008 },
        transition: { type: 'spring', stiffness: 350, damping: 25 },
      }
    : {};

  return (
    <Component
      onClick={onClick}
      {...hoverProps}
      className={`glass-card rounded-3xl p-5 md:p-6 relative overflow-hidden backdrop-blur-xl ${
        glowStyles[glowColor] || ''
      } ${className}`}
      {...props}
    >
      {/* Subtle top glare line */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none" />
      {children}
    </Component>
  );
}
