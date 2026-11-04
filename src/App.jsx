import React, { useState, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';

// Home is loaded eagerly for instant first paint
import Home from './pages/Home';

// Secondary pages are lazy loaded for optimal chunk splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Prediction = lazy(() => import('./pages/Prediction'));
const Analytics = lazy(() => import('./pages/Analytics'));
const WaterMapPage = lazy(() => import('./pages/WaterMapPage'));
const Alerts = lazy(() => import('./pages/Alerts'));
const EmergencyAlerts = lazy(() => import('./pages/EmergencyAlerts'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const IndiaOverview = lazy(() => import('./pages/IndiaOverview'));
const State = lazy(() => import('./pages/State'));

export default function App() {
  const [activeRoute, setActiveRoute] = useState('home');

  const renderPage = () => {
    // Support state-specific routes like 'state-'
    if (activeRoute && activeRoute.startsWith('state-')) {
      const stateId = activeRoute.split('state-')[1];
      return <State stateId={stateId} onNavigate={setActiveRoute} />;
    }

    switch (activeRoute) {
      case 'home':
        return <Home onNavigate={setActiveRoute} />;
      case 'india':
        return <IndiaOverview onNavigate={setActiveRoute} />;
      case 'dashboard':
        return <Dashboard onNavigate={setActiveRoute} />;
      case 'predict':
        return <Prediction onNavigate={setActiveRoute} />;
      case 'analytics':
        return <Analytics onNavigate={setActiveRoute} />;
      case 'map':
        return <WaterMapPage onNavigate={setActiveRoute} />;
      case 'alerts':
        return <Alerts onNavigate={setActiveRoute} />;
      case 'emergency-alerts':
        return <EmergencyAlerts />;
      case 'reports':
        return <Reports onNavigate={setActiveRoute} />;
      case 'settings':
        return <Settings onNavigate={setActiveRoute} />;
      default:
        return <Home onNavigate={setActiveRoute} />;
    }
  };

  return (
    <ThemeProvider>
      <AppProvider>
        <Layout activeRoute={activeRoute} onNavigate={setActiveRoute}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeRoute}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center min-h-[420px] space-y-4">
                    <div className="relative w-12 h-12">
                      <div className="w-12 h-12 rounded-full border-2 border-cyan-400/20 animate-ping absolute inset-0" />
                      <div className="w-12 h-12 rounded-full border-2 border-t-cyan-400 border-r-cyan-400 border-b-transparent border-l-transparent animate-spin" />
                    </div>
                    <span className="text-xs font-mono text-cyan-400/80 uppercase tracking-widest">
                      Loading AquaNet Intelligence...
                    </span>
                  </div>
                }
              >
                {renderPage()}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </Layout>
      </AppProvider>
    </ThemeProvider>
  );
}
