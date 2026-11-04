import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  Cpu,
  Crown,
  Sparkles,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  BarChart2,
  Activity,
  Clock,
  Zap,
  Info
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import {
  MODEL_METRICS,
  BASELINE_COMPARISONS,
  RADAR_DATA,
  TRAINING_EPOCHS
} from '../data/modelBenchmarks';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { fetchModelResults } from '../services/apiService';

export default function ModelComparison() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [sortField, setSortField] = useState('accuracy');
  const [sortDirection, setSortDirection] = useState('desc');
  const [liveResults, setLiveResults] = useState(null);

  React.useEffect(() => {
    fetchModelResults().then(setLiveResults).catch(() => {});
  }, []);

  const { transformer, cnnLstm } = MODEL_METRICS;

  const barComparisonData = [
    { metric: 'Accuracy (%)', transformer: transformer.accuracy, cnnLstm: cnnLstm.accuracy },
    { metric: 'Precision (%)', transformer: transformer.precision, cnnLstm: cnnLstm.precision },
    { metric: 'Recall (%)', transformer: transformer.recall, cnnLstm: cnnLstm.recall },
    { metric: 'F1 Score (%)', transformer: transformer.f1, cnnLstm: cnnLstm.f1 },
    { metric: 'R² Score (x100)', transformer: transformer.r2Score * 100, cnnLstm: cnnLstm.r2Score * 100 },
  ];

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const tickColor = isDark ? '#94A3B8' : '#64748B';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/40 dark:border-slate-800/60">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            Neural Benchmark Studio
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('modelComparison', 'Model comparison')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Rigorous benchmarking of Multimodal Cross-Attention Transformer vs. Hybrid CNN-BiLSTM
        </p>
      </div>

      {liveResults?.models && (
        <GlassCard glowColor="cyan" className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
            <div>
              <span className="text-[10px] uppercase tracking-[.2em] text-cyan-400 font-mono">CPCB trained classifiers</span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Production model comparison</h2>
              <p className="text-xs text-slate-400">Metrics calculated from the processed water-quality class target.</p>
            </div>
            <span className="text-xs font-mono text-emerald-400">Best: {liveResults.best_model}</span>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.values(liveResults.models).map((model) => (
              <div key={model.model} className={`p-4 rounded-2xl border ${model.model === liveResults.best_model ? 'border-cyan-400/60 bg-cyan-400/10' : 'border-slate-200/50 dark:border-slate-800/70 bg-slate-100/30 dark:bg-slate-900/20'}`}>
                <div className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{model.model.replaceAll('_', ' ')}</div>
                <div className="text-2xl font-mono text-cyan-400 mt-2">{(model.accuracy * 100).toFixed(1)}%</div>
                <div className="text-[11px] text-slate-400 mt-1">F1 {(model.f1 * 100).toFixed(1)}% · Precision {(model.precision * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Side-by-Side Model Architecture Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model 1: Transformer (Winner) */}
        <GlassCard glowColor="cyan" className="p-6 relative overflow-hidden flex flex-col justify-between">
          {/* Recommended Winner Badge */}
          <div className="absolute top-4 right-4 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-xs font-bold shadow-neon-glow">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Recommended Model</span>
          </div>

          <div>
            <span className="text-xs font-mono text-cyan-400 font-semibold">{transformer.version}</span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 mb-2">
              {transformer.name}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {transformer.description}
            </p>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-mono block">Accuracy</span>
                <span className="text-xl font-bold font-mono text-cyan-400">{transformer.accuracy}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-mono block">F1 Score</span>
                <span className="text-xl font-bold font-mono text-cyan-400">{transformer.f1}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-mono block">RMSE</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{transformer.rmse}</span>
              </div>
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-mono block">MAE</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{transformer.mae}</span>
              </div>
            </div>

            {/* Explainable Winner Logic Banner */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-cyan-500/30 mb-6">
              <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-300 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Composite Benchmark Score: {transformer.weights.compositeScore} / 100</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {transformer.weights.explanation}
              </p>
            </div>

            {/* Strengths */}
            <div className="space-y-2 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Key Architectural Advantages
              </span>
              {transformer.pros.map((pro, i) => (
                <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                  <span>{pro}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Latency: {transformer.inferenceLatencyMs} ms</span>
            <span>Training Time: {transformer.trainingTimeHours} hrs</span>
            <span>Params: {transformer.parametersM}M</span>
          </div>
        </GlassCard>

        {/* Model 2: CNN-LSTM */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono text-slate-400 font-semibold">{cnnLstm.version}</span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1 mb-2">
              {cnnLstm.name}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              {cnnLstm.description}
            </p>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-mono block">Accuracy</span>
                <span className="text-xl font-bold font-mono text-slate-200">{cnnLstm.accuracy}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-mono block">F1 Score</span>
                <span className="text-xl font-bold font-mono text-slate-200">{cnnLstm.f1}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-mono block">RMSE</span>
                <span className="text-xl font-bold font-mono text-amber-400">{cnnLstm.rmse}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-center">
                <span className="text-[10px] uppercase text-slate-400 font-mono block">MAE</span>
                <span className="text-xl font-bold font-mono text-amber-400">{cnnLstm.mae}</span>
              </div>
            </div>

            {/* Composite Score */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 mb-6">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-1">
                <span>Composite Benchmark Score: {cnnLstm.weights.compositeScore} / 100</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {cnnLstm.weights.explanation}
              </p>
            </div>

            {/* Strengths */}
            <div className="space-y-2 mb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Key Architectural Advantages
              </span>
              {cnnLstm.pros.map((pro, i) => (
                <div key={i} className="flex items-start space-x-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <span>{pro}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/40 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Latency: {cnnLstm.inferenceLatencyMs} ms</span>
            <span>Training Time: {cnnLstm.trainingTimeHours} hrs</span>
            <span>Params: {cnnLstm.parametersM}M</span>
          </div>
        </GlassCard>
      </div>

      {/* Visualizations Row: Grouped Bars & Radar Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Side-by-side Grouped Bar Chart */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Normalized Performance Comparison
              </h3>
              <p className="text-xs text-slate-400">Head-to-head metric benchmarking</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center space-x-1 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                <span>Transformer</span>
              </span>
              <span className="flex items-center space-x-1 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-500" />
                <span>CNN-LSTM</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="metric" stroke={tickColor} tickLine={false} fontSize={10} />
                <YAxis domain={[80, 100]} stroke={tickColor} tickLine={false} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(6, 14, 26, 0.95)' : '#FFFFFF',
                    borderColor: 'rgba(0, 245, 255, 0.3)',
                    borderRadius: '0.75rem',
                  }}
                />
                <Bar dataKey="transformer" name="Transformer" fill="#00F5FF" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cnnLstm" name="CNN-LSTM" fill="#475569" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Radar Profile Chart */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Multi-Dimensional Competency Radar
              </h3>
              <p className="text-xs text-slate-400">Holistic operational assessment</p>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10">
              6 Axes
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <PolarGrid stroke={gridColor} />
                <PolarAngleAxis dataKey="metric" stroke={tickColor} fontSize={10} />
                <PolarRadiusAxis domain={[60, 100]} stroke="transparent" />
                <Radar
                  name="Transformer"
                  dataKey="transformer"
                  stroke="#00F5FF"
                  fill="#00F5FF"
                  fillOpacity={0.35}
                />
                <Radar
                  name="CNN-LSTM"
                  dataKey="cnnLstm"
                  stroke="#38BDF8"
                  fill="#38BDF8"
                  fillOpacity={0.2}
                />
                <Radar
                  name="Baseline SVR"
                  dataKey="baseline"
                  stroke="#64748B"
                  fill="#64748B"
                  fillOpacity={0.1}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? 'rgba(6, 14, 26, 0.95)' : '#FFFFFF',
                    borderColor: 'rgba(0, 245, 255, 0.3)',
                    borderRadius: '0.75rem',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Training & Validation Loss Curves over 50 Epochs */}
      <GlassCard className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Loss Convergence Trajectories (50 Epochs)
            </h3>
            <p className="text-xs text-slate-400">
              Comparison of training and validation loss decay rates between Transformer and CNN-LSTM
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="flex items-center space-x-1 text-cyan-400">
              <span className="w-2.5 h-0.5 bg-cyan-400" />
              <span>Transformer Val</span>
            </span>
            <span className="flex items-center space-x-1 text-slate-400">
              <span className="w-2.5 h-0.5 bg-slate-400" />
              <span>CNN-LSTM Val</span>
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TRAINING_EPOCHS} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="epoch" stroke={tickColor} tickLine={false} fontSize={11} />
              <YAxis domain={[0, 0.7]} stroke={tickColor} tickLine={false} fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? 'rgba(6, 14, 26, 0.95)' : '#FFFFFF',
                  borderColor: 'rgba(0, 245, 255, 0.3)',
                  borderRadius: '0.75rem',
                }}
              />
              <Line type="monotone" dataKey="transformerVal" name="Transformer Val Loss" stroke="#00F5FF" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="cnnLstmVal" name="CNN-LSTM Val Loss" stroke="#94A3B8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Comprehensive benchmark table */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Comprehensive Benchmarking Against Baselines
            </h3>
            <p className="text-xs text-slate-400">
              Benchmarked against Random Forest, XGBoost, and SVR under identical cross-validation folds
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">K-Fold: 5</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/80 text-slate-400 font-mono text-[10px] uppercase">
                <th className="pb-3 font-semibold">Rank</th>
                <th className="pb-3 font-semibold">Model Architecture</th>
                <th className="pb-3 font-semibold">Paradigm</th>
                <th className="pb-3 font-semibold">Accuracy</th>
                <th className="pb-3 font-semibold">F1 Score</th>
                <th className="pb-3 font-semibold">RMSE</th>
                <th className="pb-3 font-semibold text-right">Inference Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/50 font-mono">
              {BASELINE_COMPARISONS.map((row) => (
                <tr
                  key={row.model}
                  className={`hover:bg-cyan-500/5 transition ${
                    row.rank === 1 ? 'bg-cyan-500/10 font-semibold' : ''
                  }`}
                >
                  <td className="py-3.5 pr-2">
                    {row.rank === 1 ? (
                      <span className="flex items-center space-x-1 text-amber-300 font-bold">
                        <Crown className="w-3.5 h-3.5" />
                        <span>#1</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">#{row.rank}</span>
                    )}
                  </td>
                  <td className="py-3.5 font-sans font-semibold text-slate-900 dark:text-white">
                    {row.model}
                  </td>
                  <td className="py-3.5 font-sans text-slate-400">{row.type}</td>
                  <td className="py-3.5 text-cyan-400 font-bold">{row.accuracy}%</td>
                  <td className="py-3.5 text-slate-200">{row.f1}%</td>
                  <td className="py-3.5 text-emerald-400">{row.rmse}</td>
                  <td className="py-3.5 text-right text-slate-300">{row.latency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
