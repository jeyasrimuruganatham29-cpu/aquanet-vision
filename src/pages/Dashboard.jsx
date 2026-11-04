import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  Droplets,
  Thermometer,
  Wind,
  Zap,
  Activity,
  Satellite,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Sliders
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import Gauge from '../components/common/Gauge';
import StatusBadge from '../components/common/StatusBadge';
import MetricSparkline from '../components/common/MetricSparkline';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import WaterMap from '../components/map/WaterMap';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function Dashboard({ onNavigate }) {
  const {
    activeStation,
    stations,
    setActiveStationId,
    liveFeedActive,
    setLiveFeedActive,
    waterData,
  } = useApp();
  const { t } = useTranslation();

  const [tableSearch, setTableSearch] = useState('');

  // Status mapping for individual parameter metrics
  const getParamStatus = (param, val) => {
    switch (param) {
      case 'pH':
        return val >= 6.5 && val <= 8.5 ? 'safe' : val >= 6.0 && val <= 9.0 ? 'moderate' : 'unsafe';
      case 'turbidity':
        return val <= 5.0 ? 'safe' : val <= 15.0 ? 'moderate' : 'unsafe';
      case 'dissolvedOxygen':
        return val >= 6.5 ? 'safe' : val >= 4.0 ? 'moderate' : 'unsafe';
      case 'tds':
        return val <= 500 ? 'safe' : val <= 1000 ? 'moderate' : 'unsafe';
      case 'conductivity':
        return val <= 800 ? 'safe' : val <= 1500 ? 'moderate' : 'unsafe';
      case 'temperature':
        return val <= 30 ? 'safe' : 'moderate';
      default:
        return 'safe';
    }
  };

  const paramsList = [
    {
      id: 'pH',
      label: 'Acidity (pH)',
      value: activeStation.current.pH,
      unit: 'pH',
      icon: Droplets,
      safeRange: '6.5 - 8.5',
      history: [7.2, 7.3, 7.4, 7.5, 7.4, 7.5, activeStation.current.pH],
    },
    {
      id: 'turbidity',
      label: 'Turbidity',
      value: activeStation.current.turbidity,
      unit: 'NTU',
      icon: Activity,
      safeRange: '< 5.0 NTU',
      history: [3.1, 3.4, 3.2, 3.8, 4.0, 3.6, activeStation.current.turbidity],
    },
    {
      id: 'dissolvedOxygen',
      label: 'Dissolved Oxygen',
      value: activeStation.current.dissolvedOxygen,
      unit: 'mg/L',
      icon: Wind,
      safeRange: '> 6.0 mg/L',
      history: [7.8, 7.7, 7.5, 7.4, 7.6, 7.5, activeStation.current.dissolvedOxygen],
    },
    {
      id: 'temperature',
      label: 'Water Temperature',
      value: activeStation.current.temperature,
      unit: '°C',
      icon: Thermometer,
      safeRange: '18 - 30 °C',
      history: [25.1, 25.3, 25.6, 26.0, 25.8, 26.1, activeStation.current.temperature],
    },
    {
      id: 'tds',
      label: 'Total Dissolved Solids',
      value: activeStation.current.tds,
      unit: 'ppm',
      icon: Zap,
      safeRange: '< 500 ppm',
      history: [310, 320, 335, 330, 345, 338, activeStation.current.tds],
    },
    {
      id: 'conductivity',
      label: 'Conductivity',
      value: activeStation.current.conductivity,
      unit: 'µS/cm',
      icon: Radio,
      safeRange: '< 800 µS/cm',
      history: [480, 490, 505, 510, 515, 518, activeStation.current.conductivity],
    },
  ];

  const qualityData = Object.entries(waterData.summary.quality_classes || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Dashboard Top Header & Station Quick Select Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/40 dark:border-slate-800/60">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Telemetry Surveillance Grid
            </span>
            <span className="text-slate-400">•</span>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sync: {activeStation.lastSync}</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {activeStation.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {activeStation.type} • {activeStation.region}, {activeStation.state}
          </p>
        </div>

        {/* Live Simulation & Switcher Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setLiveFeedActive(!liveFeedActive)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center space-x-2 border transition ${
              liveFeedActive
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'glass-card text-slate-400 border-slate-700'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {liveFeedActive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${liveFeedActive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
            </span>
            <span>{liveFeedActive ? 'Telemetry Streaming (4.5s)' : 'Stream Paused'}</span>
          </button>

          <select
            value={activeStation.id}
            onChange={(e) => setActiveStationId(e.target.value)}
            className="w-full min-w-0 max-w-full px-4 py-2 rounded-2xl glass-card text-xs font-medium text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-slate-800/80 focus:outline-none focus:border-cyan-400 cursor-pointer sm:w-auto"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {s.name} ({s.statusText})
              </option>
            ))}
          </select>

          <button
            onClick={() => onNavigate('predict')}
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-ocean-600 text-white text-xs font-bold shadow-glass-sm hover:shadow-neon-glow transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simulate AI Shift</span>
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
            [t('processedRecords', 'Processed records'), waterData.summary.total_records || '—', 'CPCB output'],
          [t('statesCovered', 'States covered'), waterData.summary.states_covered || '—', 'National scope'],
          [t('riversCovered', 'Rivers covered'), waterData.summary.rivers_covered || '—', 'Named watercourses'],
          [t('satelliteSamples', 'Satellite samples'), waterData.satellite?.length || '—', 'NDWI / NDCI / NDTI'],
        ].map(([label, value, detail]) => (
          <GlassCard key={label} className="p-4">
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-mono">{label}</span>
            <strong className="block mt-1 text-2xl text-slate-900 dark:text-white">{value.toLocaleString?.() || value}</strong>
            <span className="text-[11px] text-cyan-400">{detail}</span>
          </GlassCard>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <GlassCard className="lg:col-span-3 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t('qualityDistribution', 'Water quality class distribution')}</h2>
              <p className="text-xs text-slate-400">Processed CPCB observations by derived class</p>
            </div>
            <button onClick={() => onNavigate('analytics')} className="text-xs text-cyan-400 hover:text-cyan-300">{t('openAnalytics', 'Open analytics')}</button>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,.16)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94A3B8" />
                <Tooltip />
                <Bar dataKey="value" fill="#14b8a6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
        <GlassCard className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">{t('remoteSensing', 'Remote sensing layer')}</h2>
              <p className="text-xs text-slate-400">Satellite features available to the fusion workflow</p>
            </div>
            <Satellite className="w-4 h-4 text-cyan-400" />
          </div>
          {['ndwi', 'ndci', 'ndti'].map((key) => {
            const values = (waterData.satellite || []).map((sample) => Number(sample[key])).filter(Number.isFinite);
            const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
            return <div key={key} className="flex items-center justify-between py-3 border-b border-slate-200/40 dark:border-slate-800/60 last:border-0">
              <span className="text-xs uppercase font-mono text-slate-400">{key}</span>
              <strong className="text-sm font-mono text-cyan-400">{average === null ? '—' : average.toFixed(3)}</strong>
            </div>;
          })}
          <button onClick={() => onNavigate('map')} className="mt-3 text-xs text-cyan-400 hover:text-cyan-300">Inspect national map →</button>
        </GlassCard>
      </section>

      {/* Hero Section: Hero WQI Gauge + Satellite Multispectral Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hero WQI Gauge Card */}
        <GlassCard glowColor={activeStation.status} className="lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Composite Metric
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                Water Quality Index (WQI)
              </h2>
            </div>
            <StatusBadge status={activeStation.status} label={activeStation.statusText} size="md" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center my-2">
            <div className="flex justify-center">
              <Gauge
                value={activeStation.wqi}
                status={activeStation.status}
                size={210}
                strokeWidth={16}
                sublabel="Neural WQI Score"
                label="Overall Health"
              />
            </div>

            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-800/60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400">Potability Rating</span>
                  <span className="text-xs font-bold text-cyan-400">{activeStation.potabilityScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-ocean-500 to-cyan-400 rounded-full transition-all duration-1000"
                    style={{ width: `${activeStation.potabilityScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Assessed against CPCB Class A-E criteria & WHO guidelines.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-slate-400 block text-[10px]">Risk Tier</span>
                  <strong className="text-slate-900 dark:text-white font-semibold">
                    {activeStation.riskLevel}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800/40">
                  <span className="text-slate-400 block text-[10px]">Inference Pass</span>
                  <strong className="text-slate-900 dark:text-white font-semibold font-mono">
                    96.8% Conf.
                  </strong>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>30-Day Mean Trend: <strong>Stable (+1.4 WQI)</strong></span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Hardware: {activeStation.hardware}</span>
            <span>Battery: {activeStation.battery}% • Signal: {activeStation.signalDbm} dBm</span>
          </div>
        </GlassCard>

        {/* Satellite Remote Sensing Card */}
        <GlassCard glowColor="cyan" className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 font-mono">
                Remote Sensing
              </span>
              <Satellite className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Sentinel-2 MSI Indices
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Copernicus constellation level-2A spectral radiance overpass
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400">NDCI (Chlorophyll-a)</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Algal bloom proxy</div>
                </div>
                <span className="text-base font-bold font-mono text-cyan-400">
                  {activeStation.current.ndci}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400">NDTI (Turbidity Index)</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Suspended sediment</div>
                </div>
                <span className="text-base font-bold font-mono text-cyan-400">
                  {activeStation.current.ndti}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/50 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400">NDWI (Water Extent)</span>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Surface boundary</div>
                </div>
                <span className="text-base font-bold font-mono text-cyan-400">
                  {activeStation.current.ndwi}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/40 dark:border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
            <span>Pass: {activeStation.satellitePass}</span>
            <span>Cloud: {activeStation.cloudCover}</span>
          </div>
        </GlassCard>
      </div>

      {/* 6 Real-time Sensor Parameter Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <span>In-Situ IoT Sensor Nodes</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-normal">
              Continuous Stream
            </span>
          </h3>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
            Safe Thresholds Standardized
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {paramsList.map((param) => {
            const Icon = param.icon;
            const status = getParamStatus(param.id, param.value);
            return (
              <GlassCard
                key={param.id}
                hoverEffect={true}
                glowColor={status}
                className="p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {param.label}
                      </span>
                    </div>
                    <StatusBadge status={status} size="sm" pulse={false} />
                  </div>

                  <div className="flex items-baseline justify-between mt-2 mb-3">
                    <div className="flex items-baseline space-x-1.5">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
                        {param.value}
                      </span>
                      <span className="text-xs font-medium text-slate-400">{param.unit}</span>
                    </div>
                    <MetricSparkline data={param.history} status={status} width={100} height={32} />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/40 dark:border-slate-800/50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Standard Safe: {param.safeRange}</span>
                  <span className="font-mono text-cyan-400">Active</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-mono">National geospatial coverage</span>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">India state monitoring map</h2>
          </div>
          <button onClick={() => onNavigate('map')} className="text-xs text-cyan-400">Open full map</button>
        </div>
        <div className="h-[520px] overflow-hidden rounded-3xl"><WaterMap onNavigate={onNavigate} /></div>
      </section>

      {/* Recent Telemetry Log Table across All Monitored Nodes */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Network Monitoring Nodes Readout
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synchronized readings across active regional stations
            </p>
          </div>

          <input
            type="text"
            placeholder="Filter stations..."
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl glass-card text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200/50 dark:border-slate-800/80 focus:outline-none focus:border-cyan-400 w-48"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/80 text-slate-400 uppercase font-mono text-[10px]">
                <th className="pb-3 font-semibold">Station Name</th>
                <th className="pb-3 font-semibold">Classification</th>
                <th className="pb-3 font-semibold">WQI</th>
                <th className="pb-3 font-semibold">pH</th>
                <th className="pb-3 font-semibold">Turbidity</th>
                <th className="pb-3 font-semibold">DO</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/50">
              {stations
                .filter((s) => s.name.toLowerCase().includes(tableSearch.toLowerCase()))
                .map((st) => (
                  <tr
                    key={st.id}
                    className={`hover:bg-cyan-500/5 transition ${
                      st.id === activeStation.id ? 'bg-cyan-500/10 font-medium' : ''
                    }`}
                  >
                    <td className="py-3.5 pr-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{st.name}</div>
                      <div className="text-[10px] text-slate-400">{st.region}</div>
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300">{st.type}</td>
                    <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">{st.wqi}</td>
                    <td className="py-3.5 font-mono">{st.current.pH}</td>
                    <td className="py-3.5 font-mono">{st.current.turbidity} NTU</td>
                    <td className="py-3.5 font-mono">{st.current.dissolvedOxygen} mg/L</td>
                    <td className="py-3.5">
                      <StatusBadge status={st.status} label={st.status} size="sm" pulse={false} />
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => setActiveStationId(st.id)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-semibold text-[11px] transition"
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
