import React, { useState } from 'react';
import { MotionConfig, useReducedMotion } from 'framer-motion';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import AnimatedBackground from './AnimatedBackground';
import ToastContainer from '../common/Toast';

export default function Layout({ children, activeRoute, onNavigate }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col relative text-slate-900 dark:text-slate-100 transition-colors duration-300">
        {!shouldReduceMotion && <AnimatedBackground />}

        {/* Top Navbar */}
        <Navbar
          onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
          isMobileNavOpen={isMobileNavOpen}
          activeRoute={activeRoute}
          onNavigate={onNavigate}
        />

        {/* Main Body Shell */}
        <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
          {/* Desktop Sidebar */}
          <Sidebar activeRoute={activeRoute} onNavigate={onNavigate} />

          {/* Mobile Navigation Drawer & Bottom Bar */}
          <MobileNav
            isOpen={isMobileNavOpen}
            onClose={() => setIsMobileNavOpen(false)}
            activeRoute={activeRoute}
            onNavigate={onNavigate}
          />

          {/* Page Content Viewport */}
          <main className="min-w-0 flex-1 w-full px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 pb-24 lg:pb-12 overflow-x-hidden">
            {children}
          </main>
        </div>

        {/* Global Toast System */}
        <ToastContainer />
      </div>
    </MotionConfig>
  );
}
