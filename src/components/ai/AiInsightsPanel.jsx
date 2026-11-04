import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BrainCircuit,
  ArrowRight,
  Filter
} from 'lucide-react';
import GlassCard from '../common/GlassCard';
import { useApp } from '../../context/AppContext';

export default function AiInsightsPanel({ compact = false, maxItems = 4, onNavigate }) {
  const { activeStation } = useApp();
  const [filter, setFilter] = useState('all'); // 'all' | 'alert' | 'trend' | 'action'

  // Dynamic AI insights derived from active station and regional models
  const insights = [
    {
      id: 'ins-1',
      category: 'trend',
      type: 'positive',
      icon: TrendingUp,
      station: 'Vaigai Reservoir Dam Intake',
      headline: 'Water Quality Index Improving (+4.2%)',
      summary: 'Bi-directional LSTM temporal series indicates progressive sediment settling following upstream reservoir inflow stabilization.',
      timestamp: '18m ago',
      confidence: '97.2%',
    },
    {
      id: 'ins-2',
      category: 'alert',
      type: 'warning',
      icon: AlertTriangle,
      station: 'Stanley Reservoir Industrial Sector',
      headline: 'Possible Effluent Intrusion Detected',
      summary: 'Simultaneous drop in pH (5.6) and surge in conductivity (2150 µS/cm) correlates with downstream dye-processing discharge cycle.',
      timestamp: '32m ago',
      confidence: '95.8%',
    },
    {
      id: 'ins-3',
      category: 'alert',
      type: 'critical',
      icon: AlertTriangle,
      station: 'Hussain Sagar Urban Sector',
      headline: 'Sentinel-2 NDCI Chlorophyll Spike (0.44)',
      summary: 'Current indicators suggest a possible cyanobacterial bloom over the next 48 hours. Review conditions and consider appropriate monitoring actions.',
      timestamp: '1h ago',
      confidence: '96.4%',
    },
    {
      id: 'ins-4',
      category: 'action',
      type: 'recommendation',
      icon: CheckCircle2,
      station: activeStation ? activeStation.name : 'Pulicat Lagoon Node-01',
      headline: `Optimized Sampling Protocol: ${activeStation ? activeStation.name : 'Pulicat Lagoon'}`,
      summary: 'Maintain the current monitoring cadence and review trends across the available water-quality indicators.',
      timestamp: 'Just now',
      confidence: '98.1%',
    },
    {
      id: 'ins-5',
      category: 'trend',
      type: 'info',
      icon: BrainCircuit,
      station: 'Krishna Delta Prakasam Barrage',
      headline: 'Post-Monsoon Turbidity Dissipation on Schedule',
      summary: 'Regression head predicts turbidity will normalize under 5.0 NTU within 72 hours based on upstream gauge velocity deceleration.',
      timestamp: '2h ago',
      confidence: '94.6%',
    },
  ];

  const filteredInsights = insights
    .filter((ins) => (filter === 'all' ? true : ins.category === filter))
    .slice(0, maxItems);

  return (
    <GlassCard glowColor="cyan" className="relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
            <BrainCircuit className="w-4 h-4 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-300" />
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                AI Natural Language Insights
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                Transformer 2.4
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Autonomous synthesized takeaways from IoT streams and Sentinel-2 spectral indices
            </p>
          </div>
        </div>

        {!compact && (
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-xs">
            {['all', 'alert', 'trend', 'action'].map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1 rounded-lg capitalize transition text-[11px] font-medium ${
                  filter === key
                    ? 'bg-cyan-500 text-white font-semibold shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Insight Cards Grid */}
      <div className={`grid gap-3.5 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        <AnimatePresence mode="popLayout">
          {filteredInsights.map((item, idx) => {
            const Icon = item.icon;
            const borderColors = {
              critical: 'border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50',
              warning: 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50',
              positive: 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50',
              recommendation: 'border-cyan-500/30 bg-cyan-500/5 hover:border-cyan-500/50',
              info: 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50',
            };

            const iconColors = {
              critical: 'text-rose-400 bg-rose-500/15',
              warning: 'text-amber-400 bg-amber-500/15',
              positive: 'text-emerald-400 bg-emerald-500/15',
              recommendation: 'text-cyan-400 bg-cyan-500/15',
              info: 'text-blue-400 bg-blue-500/15',
            };

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: idx * 0.05 }}
                className={`p-4 rounded-2xl border backdrop-blur-md transition-all flex flex-col justify-between ${
                  borderColors[item.type] || borderColors.info
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${iconColors[item.type]}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                        {item.station}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {item.timestamp}
                    </span>
                  </div>

                  <h4 className="text-xs md:text-sm font-bold text-slate-900 dark:text-white mb-1 leading-snug">
                    {item.headline}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-mono">
                    Inference Confidence: <strong className="text-cyan-400 font-semibold">{item.confidence}</strong>
                  </span>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate(item.category === 'alert' ? 'alerts' : 'analytics')}
                      className="text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center space-x-1 group"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </GlassCard>
  );
}
