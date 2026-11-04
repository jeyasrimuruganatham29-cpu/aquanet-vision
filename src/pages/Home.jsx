import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Activity,
  Cpu,
  ShieldCheck,
  ArrowRight,
  Layers,
  Radio,
  Database,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ChevronRight,
  Droplets
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import StatCard from '../components/common/StatCard';
import AiInsightsPanel from '../components/ai/AiInsightsPanel';

export default function Home({ onNavigate }) {
  const { t } = useTranslation();
  const pipelineSteps = [
    {
      id: 'step-1',
      number: '01',
      title: 'Water Quality Data',
      desc: 'Review available measurements such as pH, turbidity, dissolved oxygen, TDS, and temperature.',
      icon: Radio,
      badge: 'Data Inputs'
    },
    {
      id: 'step-2',
      number: '02',
      title: 'Data Processing',
      desc: 'Organize and prepare water-quality records for consistent analysis.',
      icon: Database,
      badge: 'Preparation'
    },
    {
      id: 'step-3',
      number: '03',
      title: 'Water Quality Assessment',
      desc: 'Summarize available measurements into water-quality indicators and risk categories.',
      icon: Cpu,
      badge: 'Analysis'
    },
    {
      id: 'step-4',
      number: '04',
      title: 'Insights & Reporting',
      desc: 'Review assessment results, trends, and alerts to support water-quality monitoring.',
      icon: ShieldCheck,
      badge: 'Decision Support'
    }
  ];

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-12">
      {/* Hero Section */}
      <section className="relative pt-6 sm:pt-10 pb-8">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass-card border border-cyan-500/30 text-xs font-semibold text-cyan-500 dark:text-cyan-neon shadow-glass-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('tagline') || 'Next-Generation Environmental Intelligence'}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.08] font-sans"
          >
            AquaNet <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-ocean-500 bg-clip-text text-transparent">Vision</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto"
          >
            {t('subtitle') || 'Water-quality monitoring and assessment using available environmental data.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <button
              onClick={() => onNavigate('predict')}
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-ocean-600 text-white font-bold text-sm tracking-wide shadow-neon-glow hover:shadow-neon-glow-lg hover:scale-105 transition-all duration-300 flex items-center space-x-2.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>{t('predictNow') || 'Predict Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="px-7 py-3.5 rounded-2xl glass-card text-slate-800 dark:text-slate-100 font-semibold text-sm tracking-wide hover:border-cyan-500/40 hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>{t('viewDashboard') || 'View Dashboard'}</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stat Cards Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          icon={Database}
          title="Total Telemetry Samples"
          numericValue={128450}
          description="Synthesized across IoT streams & historical CPCB logs"
          trend={{ value: '+14.2% MoM', positive: true }}
          delay={0.1}
          glowColor="cyan"
        />
        <StatCard
          icon={Droplets}
          title="Water Bodies Monitored"
          numericValue={342}
          description="Lakes, reservoirs, estuaries & river reaches"
          trend={{ value: '+28 Active Nodes', positive: true }}
          delay={0.2}
          glowColor="none"
        />
        <StatCard
          icon={AlertTriangle}
          title="Active Monitored Alerts"
          numericValue={7}
          description="Priority incidents under autonomous resolution"
          trend={{ value: '3 Critical', positive: false }}
          delay={0.3}
          glowColor="unsafe"
        />
      </section>

      {/* Water quality workflow */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
              Water Quality Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              End-to-End Water Quality Pipeline
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
            An overview of how available water-quality data is prepared, assessed, and presented.
          </p>
        </div>

        <GlassCard glowColor="cyan" className="p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="relative group">
                  {/* Connector line for desktop */}
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-7 left-full w-full h-[2px] bg-gradient-to-r from-cyan-400/40 via-cyan-400/20 to-transparent -translate-x-4 z-0 pointer-events-none" />
                  )}

                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ocean-800 to-cyan-500 flex items-center justify-center text-white shadow-glass-sm group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-6 h-6 text-cyan-100" />
                        </div>
                        <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                          {step.number}
                        </span>
                      </div>

                      <div className="mb-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                          {step.badge}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 group-hover:text-cyan-400 transition-colors">
                          {step.title}
                        </h3>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-800/40 text-[11px] text-cyan-400 flex items-center space-x-1 font-medium">
                      <span>Explore stage</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </section>

      {/* AI Insights & Autonomous Watch */}
      <section className="space-y-4">
        <AiInsightsPanel onNavigate={onNavigate} />
      </section>

      {/* Footer */}
      <footer className="pt-8 border-t border-slate-200/40 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-2">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">AquaNet Vision</span>
          <span>•</span>
          <span>Clean Water & Sanitation (UN SDG 6)</span>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('dashboard')} className="hover:text-cyan-400 transition">Dashboard</button>
          <button onClick={() => onNavigate('map')} className="hover:text-cyan-400 transition">GIS Map</button>
          <button onClick={() => onNavigate('alerts')} className="hover:text-cyan-400 transition">Alerts</button>
          <button onClick={() => onNavigate('settings')} className="hover:text-cyan-400 transition">Settings</button>
        </div>
      </footer>
    </div>
  );
}
