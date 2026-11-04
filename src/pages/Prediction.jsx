import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
  FileCheck,
  Droplets,
  Activity,
  Layers,
  HelpCircle
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import Gauge from '../components/common/Gauge';
import StatusBadge from '../components/common/StatusBadge';
import { SAMPLE_PRESETS, PARAMETER_BOUNDS } from '../data/mockData';
import { predictWaterQuality } from '../services/apiService';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);
const unavailable = 'Unavailable';

export default function Prediction() {
  const { addPredictionToHistory, predictionHistory, addToast } = useApp();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    pH: 7.4,
    turbidity: 3.2,
    temperature: 24.5,
    dissolvedOxygen: 7.8,
    tds: 260,
    conductivity: 410,
  });

  const [sampleName, setSampleName] = useState('Laboratory Field Sample #104');
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: Number(val),
    }));
  };

  const handleLoadPreset = (preset) => {
    setFormData({ ...preset.values });
    setSampleName(preset.name);
    addToast({
      type: 'info',
      title: 'Preset Loaded',
      message: `Populated parameters for "${preset.name}".`,
    });
  };

  const handleReset = () => {
    setFormData({
      pH: 7.0,
      turbidity: 2.0,
      temperature: 22.0,
      dissolvedOxygen: 8.0,
      tds: 200,
      conductivity: 320,
    });
    setPredictionResult(null);
    setSampleName('Laboratory Field Sample');
  };

  const handleRunPrediction = async (e) => {
    if (e) e.preventDefault();
    setIsPredicting(true);

    try {
      const result = await predictWaterQuality(formData);
      setPredictionResult(result);
      addPredictionToHistory({
        sampleName,
        wqiScore: result.wqiScore ?? null,
        potabilityScore: result.potabilityScore ?? null,
        qualityClass: result.qualityClass ?? null,
        riskLevel: result.riskLevel ?? null,
        confidence: result.confidence ?? null,
      });

      if (isFiniteNumber(result.wqiScore) && result.wqiScore >= 85) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#00F5FF', '#10B981', '#0077B6'],
        });
      }

      const toastType = result.badgeColor === 'unsafe'
        ? 'warning'
        : result.badgeColor === 'safe'
          ? 'safe'
          : 'info';
      addToast({
        type: toastType,
        title: 'Inference Complete',
        message: `Prediction: ${result.qualityClass ?? unavailable} (WQI ${isFiniteNumber(result.wqiScore) ? result.wqiScore : unavailable})`,
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'warning',
        title: 'Inference Error',
        message: 'Simulation failed. Please check sensor input ranges.',
      });
    } finally {
      setIsPredicting(false);
    }
  };

  const wqiScore = isFiniteNumber(predictionResult?.wqiScore) ? predictionResult.wqiScore : null;
  const potabilityScore = isFiniteNumber(predictionResult?.potabilityScore) ? predictionResult.potabilityScore : null;
  const confidence = isFiniteNumber(predictionResult?.confidence) ? predictionResult.confidence : null;
  const riskLevel = typeof predictionResult?.riskLevel === 'string' && predictionResult.riskLevel
    ? predictionResult.riskLevel
    : null;
  const badgeColor = ['safe', 'moderate', 'unsafe'].includes(predictionResult?.badgeColor)
    ? predictionResult.badgeColor
    : ({ Low: 'safe', Medium: 'moderate', High: 'unsafe', Critical: 'unsafe' }[riskLevel] || null);
  const featureAttribution = Array.isArray(predictionResult?.featureAttribution)
    ? predictionResult.featureAttribution.filter((item) => item && typeof item === 'object')
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/40 dark:border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              {t('predictionTitle', 'AI water quality prediction')}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-400">Water Quality Assessment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Water Quality Prediction Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Feed in-situ physicochemical parameters to compute Water Quality Index (WQI), Potability, and Risk Tier
          </p>
        </div>

        <button
          onClick={handleReset}
          className="self-start sm:self-auto px-3.5 py-2 rounded-2xl glass-card text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center space-x-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {/* Preset Quick-Load Ribbon */}
      <div>
        <div className="flex items-center space-x-2 mb-2.5">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Load Scientific Baseline Presets:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset)}
              className="px-3.5 py-1.5 rounded-xl glass-card text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-cyan-400 hover:text-cyan-400 transition shadow-glass-sm flex items-center space-x-1.5"
            >
              <span>{preset.name}</span>
              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                {preset.category}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Two-Column Layout: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Sliders & Controls */}
        <div className="lg:col-span-6 space-y-6">
          <GlassCard glowColor="cyan" className="p-6">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-200/40 dark:border-slate-800/60">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Physicochemical Inputs
                </h3>
                <p className="text-xs text-slate-400">
                  Adjust parameter values or use precise number inputs
                </p>
              </div>
              <input
                type="text"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
                placeholder="Sample identifier..."
                className="px-3 py-1.5 rounded-xl glass-card text-xs text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800/80 focus:outline-none focus:border-cyan-400 w-48 text-right font-mono"
              />
            </div>

            <form onSubmit={handleRunPrediction} className="space-y-5">
              {Object.entries(PARAMETER_BOUNDS).map(([key, config]) => {
                const val = formData[key];
                const isOutOfBounds =
                  val < config.safeMin || val > config.safeMax;

                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
                        <span>{config.label}</span>
                        {isOutOfBounds && (
                          <span className="text-[10px] text-amber-400 font-mono">
                            (Outside safe: {config.safeMin} - {config.safeMax})
                          </span>
                        )}
                      </label>

                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          step={config.step}
                          min={config.min}
                          max={config.max}
                          value={val}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="w-20 px-2 py-1 rounded-lg text-right font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-cyan-300 focus:outline-none focus:border-cyan-400"
                        />
                        <span className="text-slate-400 w-8 text-[11px] font-mono">
                          {config.unit}
                        </span>
                      </div>
                    </div>

                    {/* Range Slider */}
                    <input
                      type="range"
                      min={config.min}
                      max={config.max}
                      step={config.step}
                      value={val}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                    />

                    <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                      <span>{config.min} {config.unit}</span>
                      <span className="text-emerald-400">Safe: {config.safeMin} - {config.safeMax}</span>
                      <span>{config.max} {config.unit}</span>
                    </div>
                  </div>
                );
              })}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isPredicting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-ocean-600 text-white font-bold text-sm tracking-wide shadow-neon-glow hover:shadow-neon-glow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isPredicting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                      <span>Assessing water quality...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run AI Water Quality Prediction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </GlassCard>
        </div>

        {/* Right Column: Prediction Results & Feature Attribution */}
        <div className="lg:col-span-6 space-y-6">
          {predictionResult ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
                    {/* Main Result Card */}
                    <GlassCard glowColor={badgeColor || 'none'} className="p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200/40 dark:border-slate-800/60">
                  <div>
                    <span className="text-xs font-mono uppercase text-cyan-400 font-semibold">
                      Inference Outcome
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                      {typeof predictionResult.qualityClass === 'string' && predictionResult.qualityClass
                        ? predictionResult.qualityClass
                        : unavailable}
                    </h3>
                  </div>
                  <StatusBadge
                    status={badgeColor || 'info'}
                    label={`Risk: ${riskLevel || unavailable}`}
                    size="md"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 items-center">
                  <div className="flex justify-center">
                    {wqiScore === null ? (
                      <p className="text-sm text-slate-400">{unavailable}</p>
                    ) : (
                      <Gauge
                        value={wqiScore}
                        status={badgeColor || 'moderate'}
                        size={180}
                        strokeWidth={14}
                        sublabel="WQI Index"
                        label="Computed Score"
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/60">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Potability Index</span>
                        <strong className="text-cyan-400">{potabilityScore === null ? unavailable : `${potabilityScore}%`}</strong>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full"
                          style={{ width: potabilityScore === null ? '0%' : `${Math.max(0, Math.min(100, potabilityScore))}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/60">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Model Confidence</span>
                        <strong className="text-emerald-400 font-mono">
                          {confidence === null ? unavailable : `${confidence}%`}
                        </strong>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-emerald-400 rounded-full"
                          style={{ width: confidence === null ? '0%' : `${Math.max(0, Math.min(100, confidence))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Generated Recommendation */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-ocean-900/40 via-cyan-950/20 to-transparent border border-cyan-500/20">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400 mb-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Autonomous AI Recommendation</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {typeof predictionResult.recommendation === 'string' && predictionResult.recommendation
                      ? predictionResult.recommendation
                      : unavailable}
                  </p>
                </div>
                    </GlassCard>

                    {/* Feature Attribution (SHAP-style) */}
                    <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      SHAP Feature Attribution Breakdown
                    </h4>
                    <p className="text-xs text-slate-400">
                      How each sensor reading influenced the final classification
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-500/10">
                    Explainable AI
                  </span>
                </div>

                <div className="space-y-3">
                  {featureAttribution.length ? featureAttribution.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-100/60 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800/50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.feature}: <span className="font-mono text-cyan-400">{item.value}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{item.description}</div>
                      </div>
                      <span
                        className={`font-mono font-bold text-xs px-2 py-1 rounded-lg ${
                          item.isPositive
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {item.impact}
                      </span>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400">
                      Feature attribution is unavailable for this prediction.
                    </p>
                  )}
                </div>
                    </GlassCard>
            </motion.div>
          ) : (
            /* Empty State Waiting for Prediction */
            <GlassCard className="p-12 text-center flex flex-col items-center justify-center min-h-[440px]">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Awaiting Parameter Submission
              </h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
                Adjust the sensor sliders on the left or select one of the scientific presets, then click <strong>"Run AI Water Quality Prediction"</strong> to view neural inference results.
              </p>
              <button
                onClick={() => handleRunPrediction()}
                className="px-5 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 text-xs font-semibold transition"
              >
                Run Test Prediction With Current Inputs
              </button>
            </GlassCard>
          )}
        </div>
      </div>

      {/* In-Session Prediction History */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            In-Session Prediction Audit History
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {predictionHistory.length} Samples Tested
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/80 text-slate-400 font-mono text-[10px] uppercase">
                <th className="pb-3 font-semibold">Timestamp</th>
                <th className="pb-3 font-semibold">Sample Description</th>
                <th className="pb-3 font-semibold">WQI Score</th>
                <th className="pb-3 font-semibold">Classification</th>
                <th className="pb-3 font-semibold">Potability</th>
                <th className="pb-3 font-semibold">Confidence</th>
                <th className="pb-3 font-semibold text-right">Risk Tier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/50">
              {predictionHistory.map((h) => (
                <tr key={h.id} className="hover:bg-cyan-500/5 transition">
                  <td className="py-3 text-slate-400 font-mono text-[11px]">{h.timestamp}</td>
                  <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">{h.sampleName}</td>
                  <td className="py-3 font-mono font-bold text-cyan-400">{isFiniteNumber(h.wqiScore) ? h.wqiScore : unavailable}</td>
                  <td className="py-3">{h.qualityClass || unavailable}</td>
                  <td className="py-3 font-mono">{isFiniteNumber(h.potabilityScore) ? `${h.potabilityScore}%` : unavailable}</td>
                  <td className="py-3 font-mono text-emerald-400">{isFiniteNumber(h.confidence) ? `${h.confidence}%` : unavailable}</td>
                  <td className="py-3 text-right">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        h.riskLevel === 'Low'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : h.riskLevel === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400'
                          : h.riskLevel === 'High' || h.riskLevel === 'Critical'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-slate-500/10 text-slate-400'
                      }`}
                    >
                      {h.riskLevel || unavailable}
                    </span>
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
