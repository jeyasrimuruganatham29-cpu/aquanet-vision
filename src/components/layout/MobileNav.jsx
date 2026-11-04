import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  LayoutDashboard,
  Sparkles,
  Map,
  AlertTriangle,
  X,
  Droplets
} from 'lucide-react';
import { NAV_ITEMS } from './Sidebar';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

export default function MobileNav({ isOpen, onClose, activeRoute, onNavigate }) {
  const { unreadAlertCount, userRole } = useApp();
  const { t } = useTranslation();

  // Bottom quick bar primary 5 items
  const bottomBarItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'dashboard', label: 'Live', icon: LayoutDashboard },
    { id: 'predict', label: 'Predict', icon: Sparkles },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  ];

  return (
    <>
      {/* Slide-out Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="relative w-72 max-w-[85vw] h-full glass-sidebar z-10 flex flex-col justify-between p-5"
            >
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/40 dark:border-slate-800/60">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-ocean-700 to-cyan-400 flex items-center justify-center text-white">
                      <Droplets className="w-5 h-5 text-cyan-200" />
                    </div>
                    <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                      AquaNet Vision
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                    aria-label="Close navigation"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {NAV_ITEMS.filter((item) => !item.adminOnly || userRole === 'admin').map((item) => {
                    const Icon = item.icon;
                    const isActive = activeRoute === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-medium transition ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 dark:bg-teal-400/10 dark:text-teal-200 font-semibold border-l-[3px] border-brand-600 dark:border-teal-300'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                          <span>{t(item.key, item.label)}</span>
                        </div>
                        {item.id === 'alerts' && unreadAlertCount > 0 && (
                          <span className="flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white">
                            {unreadAlertCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/60 text-[10px] text-slate-400">
                {/* Course attribution removed */}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom Quick Nav Bar for Mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 glass-nav border-t border-slate-200/40 dark:border-cyan-500/20 px-2 py-1.5 backdrop-blur-2xl">
        <div className="flex items-center justify-around">
          {bottomBarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
                    isActive ? 'text-brand-700 dark:text-teal-200 font-semibold' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                  aria-current={isActive ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.id === 'alerts' && unreadAlertCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white">
                      {unreadAlertCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
