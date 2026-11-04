import React from 'react';
import { Home, LayoutDashboard, Sparkles, LineChart, Map, AlertTriangle, FileText, Settings, Waves, ChevronRight, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

export const NAV_ITEMS = [
  { id: 'home', key: 'home', label: 'Home', icon: Home, description: 'Platform Overview' },
  { id: 'dashboard', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, description: 'Live IoT Telemetry' },
  { id: 'predict', key: 'predict', label: 'WQ Prediction', icon: Sparkles, description: 'AI Inference Engine' },
  { id: 'analytics', key: 'analytics', label: 'Analytics', icon: LineChart, description: 'Trends & Spectral' },
  { id: 'emergency-alerts', key: 'emergencyAlerts', label: 'Emergency SMS Alerts', icon: ShieldAlert, description: 'Drafts & delivery status' },
  { id: 'map', key: 'map', label: 'Water Body Map', icon: Map, description: 'GIS & Heatmap Layer' },
  { id: 'alerts', key: 'alerts', label: 'Alerts', icon: AlertTriangle, description: 'Incident Response' },
  { id: 'reports', key: 'reports', label: 'Reports', icon: FileText, description: 'PDF Bulletin Export' },
  { id: 'settings', key: 'settings', label: 'Settings', icon: Settings, description: 'RBAC & Hardware' },
];

export default function Sidebar({ activeRoute, onNavigate }) {
  const { unreadAlertCount, userRole } = useApp();
  const { t } = useTranslation();

  return (
    <aside className="hidden lg:flex flex-col w-64 glass-sidebar shrink-0 min-h-[calc(100vh-61px)] p-4 justify-between transition-colors duration-200">
      <div className="space-y-1">
        <div className="px-3 py-2 mb-2 text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">Navigation Architecture</div>
        {NAV_ITEMS.filter((item) => !item.adminOnly || userRole === 'admin').map((item) => {
          const Icon = item.icon;
          const isActive = activeRoute === item.id;
          return <button key={item.id} type="button" aria-current={isActive ? 'page' : undefined} onClick={() => onNavigate(item.id)} className={`w-full group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors duration-150 ${isActive ? 'bg-brand-50 text-brand-700 dark:bg-teal-400/10 dark:text-teal-200 font-semibold border-l-[3px] border-brand-600 dark:border-teal-300' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/40'}`}>
            <div className="flex items-center space-x-3 min-w-0"><Icon className={`w-4 h-4 shrink-0 transition-colors duration-150 ${isActive ? 'text-brand-600 dark:text-teal-300' : 'text-slate-400 group-hover:text-brand-600 dark:group-hover:text-teal-300'}`} /><span className="block truncate text-left">{t(item.key, item.label)}</span></div>
            {item.id === 'alerts' && unreadAlertCount > 0 ? <span className="flex h-4 min-w-[16px] items-center justify-center px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white">{unreadAlertCount}</span> : isActive ? <ChevronRight className="w-3.5 h-3.5 text-brand-600/70 dark:text-teal-300/70" /> : null}
          </button>;
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-slate-200/40 dark:border-slate-800/50">
        <div className="p-3 rounded-xl bg-teal-50/80 dark:bg-gradient-to-br dark:from-ocean-900/50 dark:to-ocean-800/20 border border-teal-700/10 dark:border-cyan-500/20">
          <div className="flex items-center space-x-2 text-[11px] font-semibold text-brand-700 dark:text-teal-300 mb-1"><Waves className="w-3.5 h-3.5 animate-pulse" /><span>Water Quality Monitoring</span></div>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">Explore available water-quality data and assessment results.</p>
        </div>
      </div>
    </aside>
  );
}
