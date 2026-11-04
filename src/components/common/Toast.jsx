import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  const iconMap = {
    safe: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    unsafe: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-cyan-400 shrink-0" />,
  };

  const borderMap = {
    safe: 'border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
    warning: 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    unsafe: 'border-rose-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
    info: 'border-cyan-500/30 shadow-[0_0_20px_rgba(0,245,255,0.15)]',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 pointer-events-none max-w-sm w-full px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 25, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`pointer-events-auto rounded-2xl p-4 glass-card border backdrop-blur-2xl bg-slate-900/90 text-white ${
              borderMap[toast.type] || borderMap.info
            } flex items-start space-x-3`}
          >
            {iconMap[toast.type] || iconMap.info}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold leading-tight text-white">{toast.title}</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
