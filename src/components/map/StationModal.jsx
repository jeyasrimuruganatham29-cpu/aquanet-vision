import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  Radio,
  Satellite,
  BatteryCharging,
  Signal,
  Sparkles,
  FileText,
  Activity
} from 'lucide-react';
import Gauge from '../common/Gauge';
import StatusBadge from '../common/StatusBadge';
import MetricSparkline from '../common/MetricSparkline';

export default function StationModal({ station, isOpen, onClose, onNavigate }) {
  if (!station) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-0 sm:p-4 pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="pointer-events-auto relative w-full sm:w-[480px] h-full sm:h-[92vh] glass-card rounded-none sm:rounded-3xl p-6 overflow-y-auto flex flex-col justify-between z-10 border-l border-cyan-500/30 shadow-glass-lg"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200/40 dark:border-slate-800/60">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <StatusBadge status={station.status} label={station.statusText} size="sm" />
                    <span className="text-[10px] font-mono text-slate-400">ID: {station.id}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {station.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{station.region} • {station.state}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* WQI Hero Gauge */}
              <div className="my-6 p-4 rounded-2xl bg-gradient-to-b from-slate-100/50 dark:from-ocean-900/40 to-transparent border border-slate-200/40 dark:border-cyan-500/20 flex flex-col items-center">
                <Gauge
                  value={station.wqi}
                  status={station.status}
                  size={170}
                  strokeWidth={12}
                  sublabel="Station Health"
                  label={station.type}
                />
                <div className="flex items-center space-x-3 mt-2 text-xs font-mono text-slate-400">
                  <span>Potability: <strong className="text-slate-200">{station.potabilityScore}%</strong></span>
                  <span>•</span>
                  <span>Risk Level: <strong className="text-slate-200">{station.riskLevel}</strong></span>
                </div>
              </div>

              {/* Real-time Telemetry Grid */}
              <div className="mb-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Real-Time Sensor Readouts</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/60">
                    <span className="text-[11px] text-slate-400">pH Acidity</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {station.current.pH}
                    </div>
                    <span className="text-[10px] text-slate-400">Optimal: 6.5 - 8.5</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/60">
                    <span className="text-[11px] text-slate-400">Turbidity</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {station.current.turbidity} <span className="text-xs font-normal">NTU</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Safe: &lt; 5.0 NTU</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/60">
                    <span className="text-[11px] text-slate-400">Dissolved Oxygen</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {station.current.dissolvedOxygen} <span className="text-xs font-normal">mg/L</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Healthy: &gt; 6.0 mg/L</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/60">
                    <span className="text-[11px] text-slate-400">Temperature</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {station.current.temperature} <span className="text-xs font-normal">°C</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Normal Range</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/60">
                    <span className="text-[11px] text-slate-400">Total Dissolved Solids</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {station.current.tds} <span className="text-xs font-normal">ppm</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Threshold: &lt; 500 ppm</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/60">
                    <span className="text-[11px] text-slate-400">Conductivity</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                      {station.current.conductivity} <span className="text-xs font-normal">µS/cm</span>
                    </div>
                    <span className="text-[10px] text-slate-400">Threshold: &lt; 800</span>
                  </div>
                </div>
              </div>

              {/* Satellite Remote Sensing Tile Info */}
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 mb-6">
                <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 mb-2">
                  <Satellite className="w-4 h-4" />
                  <span>Sentinel-2 MSI Level-2A Spectral Tile</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 block">NDCI Chlorophyll</span>
                    <strong className="text-cyan-300 font-mono">{station.current.ndci}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 block">NDTI Turbidity</span>
                    <strong className="text-cyan-300 font-mono">{station.current.ndti}</strong>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/40">
                    <span className="text-[10px] text-slate-400 block">NDWI Water Extent</span>
                    <strong className="text-cyan-300 font-mono">{station.current.ndwi}</strong>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Pass: {station.satellitePass}</span>
                  <span>Cloud Mask: {station.cloudCover}</span>
                </div>
              </div>

              {/* Hardware Health */}
              <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800/50 flex items-center justify-between text-xs mb-6">
                <div className="flex items-center space-x-2">
                  <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono text-[11px] text-slate-300">{station.hardware}</span>
                </div>
                <div className="flex items-center space-x-3 text-slate-400 text-[11px]">
                  <span className="flex items-center space-x-1">
                    <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{station.battery}%</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Signal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{station.signalDbm} dBm</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/60 flex items-center space-x-3">
              <button
                onClick={() => {
                  onClose();
                  if (onNavigate) onNavigate('predict');
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-ocean-600 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 shadow-glass-sm hover:shadow-neon-glow transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Test with AI Predictor</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  if (onNavigate) onNavigate('reports');
                }}
                className="py-2.5 px-4 rounded-xl glass-card text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center space-x-1.5 hover:border-cyan-500/40 transition"
              >
                <FileText className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
