import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  Legend
} from 'recharts';
import {
  LineChart as LineChartIcon,
  Calendar,
  Filter,
  Layers,
  Activity,
  TrendingUp,
  Thermometer,
  Droplets,
  Satellite
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import AiInsightsPanel from '../components/ai/AiInsightsPanel';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { HISTORICAL_TIME_SERIES, MONTHLY_TRENDS } from '../data/mockData';

export default function Analytics({ onNavigate }) {
  const { isDark } = useTheme();
  const { activeStation, stations, setActiveStationId, waterData } = useApp();
  const { t } = useTranslation();

  const [timeRange, setTimeRange] = useState('30D'); // '7D' | '30D' | '90D' | '1Y'

  // Dynamic time series scaling based on active time range
  const getScaledData = () => {
    const processedTrends = (waterData.trends || []).map((item) => ({
      date: item.date,
      wqi: item.wqi,
      ph: item.ph,
      do: item.do,
      turbidity: item.turbidity,
      tds: item.tds,
      bod: item.bod,
      cod: item.cod,
    }));
    if (processedTrends.length) return processedTrends;
    switch (timeRange) {
      case '7D':
        return HISTORICAL_TIME_SERIES;
      case '30D':
        return HISTORICAL_TIME_SERIES;
      case '90D':
        return [
          { date: 'Month 1', wqi: 82, ph: 7.3, turbidity: 4.8, do: 7.2, temp: 24.5, tds: 310, ndci: 0.11 },
          { date: 'Month 2', wqi: 86, ph: 7.6, turbidity: 3.5, do: 7.9, temp: 25.8, tds: 280, ndci: 0.08 },
          { date: 'Month 3', wqi: 88, ph: 7.4, turbidity: 3.1, do: 8.2, temp: 26.4, tds: 260, ndci: 0.07 },
        ];
      case '1Y':
        return MONTHLY_TRENDS.map((m) => ({
          date: m.month,
          wqi: m.average,
          ph: 7.5,
          turbidity: 4.2,
          do: 7.6,
          temp: 26.0,
          tds: 290,
          ndci: 0.09,
        }));
      default:
        return HISTORICAL_TIME_SERIES;
    }
  };

  const chartData = getScaledData();

  // Color tokens
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const tickColor = isDark ? '#94A3B8' : '#64748B';
  const tooltipBg = isDark ? 'rgba(6, 14, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const tooltipBorder = isDark ? 'rgba(0, 245, 255, 0.3)' : 'rgba(0, 180, 216, 0.4)';

  const customTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: tooltipBg,
            borderColor: tooltipBorder,
            color: isDark ? '#FFFFFF' : '#0F172A',
          }}
          className="p-3 rounded-xl border backdrop-blur-xl shadow-glass-md text-xs font-sans"
        >
          <p className="font-bold mb-1.5 font-mono text-cyan-400">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center space-x-2 my-0.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-400">{entry.name}:</span>
              <span className="font-mono font-bold text-slate-100">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Analytics Header & Scope Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-slate-200/40 dark:border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Scientific Visualization Suite
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-400">{activeStation.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('analyticsTitle', 'Water quality analytics')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Multi-sensor longitudinal trends, safe-boundary cross-analysis, and satellite radiance correlation
          </p>
        </div>

        {/* Time Filters & Station Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={activeStation.id}
            onChange={(e) => setActiveStationId(e.target.value)}
            className="px-3.5 py-1.5 rounded-xl glass-card text-xs font-medium text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-800/80 focus:outline-none focus:border-cyan-400"
          >
            {stations.map((s) => (
              <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                {s.name}
              </option>
            ))}
          </select>

          <div className="flex items-center p-1 rounded-2xl glass-card border border-slate-200/60 dark:border-slate-800/80 text-xs shadow-glass-sm">
            {['7D', '30D', '90D', '1Y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-xl font-medium transition text-[11px] ${
                  timeRange === range
                    ? 'bg-cyan-500 text-white font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-cyan-400'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 1: Primary Water Quality Index Trend (Area Chart) */}
      <GlassCard glowColor="cyan" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Water Quality Index (WQI) Longitudinal Trajectory
            </h3>
            <p className="text-xs text-slate-400">
              Composite neural scoring over time against safety threshold (80.0 WQI)
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="flex items-center space-x-1.5 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>{t('wqiTrajectory', 'WQI Score')}</span>
            </span>
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Safe Baseline (&gt;80)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="wqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00F5FF" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#0077B6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="date" stroke={tickColor} tickLine={false} fontSize={11} fontMono />
              <YAxis domain={[20, 100]} stroke={tickColor} tickLine={false} fontSize={11} />
              <Tooltip content={customTooltip} />
              <ReferenceArea y1={80} y2={100} fill="rgba(16, 185, 129, 0.06)" />
              <Area
                type="monotone"
                dataKey="wqi"
                name="WQI Index"
                stroke="#00F5FF"
                strokeWidth={3}
                fill="url(#wqiGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Row 2: Two Columns - pH Trend with Safe Band & Turbidity vs DO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* pH Chart with Safe Band */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>{t('phTrend', 'pH Fluctuation & Safe Tolerance Band')}</span>
              </h3>
              <p className="text-xs text-slate-400">CPCB Permissible Range: 6.5 to 8.5</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Safe Zone Highlighted
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" stroke={tickColor} tickLine={false} fontSize={11} />
                <YAxis domain={[5.0, 10.0]} stroke={tickColor} tickLine={false} fontSize={11} />
                <Tooltip content={customTooltip} />
                {/* Safe band reference */}
                <ReferenceArea y1={6.5} y2={8.5} fill="rgba(16, 185, 129, 0.12)" stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="ph"
                  name="pH Value"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#0284C7' }}
                  activeDot={{ r: 6, fill: '#00F5FF' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Turbidity Area Trend */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>{t('turbidityTrend', 'Turbidity & Suspended Solids (NTU)')}</span>
              </h3>
              <p className="text-xs text-slate-400">Suspended sediment optical scatter</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
              Safe &lt; 5.0 NTU
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="turbGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="date" stroke={tickColor} tickLine={false} fontSize={11} />
                <YAxis domain={[0, 'auto']} stroke={tickColor} tickLine={false} fontSize={11} />
                <Tooltip content={customTooltip} />
                <Area
                  type="monotone"
                  dataKey="turbidity"
                  name="Turbidity (NTU)"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  fill="url(#turbGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Row 3: Monthly Multi-Station Comparison Grouped Bars */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Annual Monthly WQI Comparative Analysis
            </h3>
            <p className="text-xs text-slate-400">
              Comparison across Pristine Watersheds, Average Basin Levels, and Industrially Impacted Nodes
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs font-mono">
            <span className="flex items-center space-x-1 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span>Pristine (Vaigai)</span>
            </span>
            <span className="flex items-center space-x-1 text-cyan-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
              <span>Regional Average</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span>Impacted (Hussain Sagar)</span>
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={MONTHLY_TRENDS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="month" stroke={tickColor} tickLine={false} fontSize={11} />
              <YAxis domain={[0, 100]} stroke={tickColor} tickLine={false} fontSize={11} />
              <Tooltip content={customTooltip} />
              <Bar dataKey="pristine" name="Pristine" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="average" name="Regional Average" fill="#00B4D8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="impacted" name="Impacted" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="mb-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('parameterAnalysis', 'Core parameter analysis')}</h3>
          <p className="text-xs text-slate-400">Monthly means from the processed CPCB dataset: dissolved oxygen, TDS, BOD, and COD.</p>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="date" stroke={tickColor} tickLine={false} fontSize={11} />
              <YAxis stroke={tickColor} tickLine={false} fontSize={11} />
              <Tooltip content={customTooltip} />
              <Legend />
              <Line type="monotone" dataKey="do" name="DO (mg/L)" stroke="#10B981" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="tds" name="TDS (mg/L)" stroke="#38BDF8" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="bod" name="BOD (mg/L)" stroke="#F59E0B" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="cod" name="COD (mg/L)" stroke="#F43F5E" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Cross-Cutting AI Insights Component */}
      <AiInsightsPanel onNavigate={onNavigate} />
    </div>
  );
}
