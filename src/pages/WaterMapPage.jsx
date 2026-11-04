import React from 'react';
import { MapPin, Layers, Satellite, ShieldCheck, AlertTriangle } from 'lucide-react';
import WaterMap from '../components/map/WaterMap';
import GlassCard from '../components/common/GlassCard';
import { useApp } from '../context/AppContext';

export default function WaterMapPage({ onNavigate }) {
  const { stations } = useApp();

  const safeCount = stations.filter((s) => s.status === 'safe').length;
  const modCount = stations.filter((s) => s.status === 'moderate').length;
  const unsafeCount = stations.filter((s) => s.status === 'unsafe').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/40 dark:border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Geospatial Information System (GIS)
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-400">Sentinel-2 & Landsat Constellation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Water Body Surveillance Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time sensor telemetry pins overlaid with high-resolution satellite water boundaries and contamination heatmaps
          </p>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <GlassCard className="p-4">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Monitored Stations</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white font-sans mt-0.5 block">
            {stations.length} Active Nodes
          </span>
          <span className="text-[11px] text-cyan-400">100% Online</span>
        </GlassCard>

        <GlassCard className="p-4" glowColor="safe">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Optimal / Safe</span>
          <span className="text-2xl font-bold text-emerald-400 font-sans mt-0.5 block">
            {safeCount} Nodes
          </span>
          <span className="text-[11px] text-slate-400">WQI &gt; 80.0</span>
        </GlassCard>

        <GlassCard className="p-4" glowColor="moderate">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Moderate Watch</span>
          <span className="text-2xl font-bold text-amber-400 font-sans mt-0.5 block">
            {modCount} Nodes
          </span>
          <span className="text-[11px] text-slate-400">WQI 50.0 - 79.9</span>
        </GlassCard>

        <GlassCard className="p-4" glowColor="unsafe">
          <span className="text-[10px] uppercase font-mono text-slate-400 block">Critical Risk</span>
          <span className="text-2xl font-bold text-rose-400 font-sans mt-0.5 block">
            {unsafeCount} Nodes
          </span>
          <span className="text-[11px] text-slate-400">Immediate Action</span>
        </GlassCard>
      </div>

      {/* Main Interactive Map Container */}
      <WaterMap onNavigate={onNavigate} />
    </div>
  );
}
