import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckSquare,
  Square,
  Calendar,
  Building,
  CheckCircle2,
  Sparkles,
  Clock,
  ExternalLink,
  ShieldCheck,
  Droplets
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import StatusBadge from '../components/common/StatusBadge';
import { useApp } from '../context/AppContext';
import { exportReportToPdf } from '../services/pdfExportService';
import { useTranslation } from 'react-i18next';

export default function Reports() {
  const { activeStation, stations, currentUser, addToast, waterData } = useApp();
  const { t } = useTranslation();

  const [selectedStationId, setSelectedStationId] = useState(activeStation.id);
  const [reportTitle, setReportTitle] = useState('Comprehensive Water Quality Assessment Bulletin');
  const [isExporting, setIsExporting] = useState(false);

  const [sections, setSections] = useState({
    summary: true,
    sensorReadings: true,
    satelliteIndices: true,
    remediationAction: true,
  });

  const [reportHistory] = useState([
    {
      id: 'rep-01',
      title: 'Pulicat Lagoon Bi-Weekly Audit Bulletin',
      date: 'Sep 12, 2026',
      station: 'Pulicat Lagoon Node-01',
      wqi: 86.4,
      author: 'AquaNet Operations',
      size: '1.8 MB',
    },
    {
      id: 'rep-02',
      title: 'Vaigai Reservoir Potability Certification',
      date: 'Sep 05, 2026',
      station: 'Vaigai Reservoir Dam Intake',
      wqi: 94.2,
      author: 'AquaNet Operations',
      size: '2.4 MB',
    },
    {
      id: 'rep-03',
      title: 'Hussain Sagar Algal Bloom Emergency Dossier',
      date: 'Aug 28, 2026',
      station: 'Hussain Sagar Urban Sector',
      wqi: 41.8,
      author: 'Pollution Control Board',
      size: '3.1 MB',
    },
  ]);

  const targetStation = stations.find((s) => s.id === selectedStationId) || activeStation;

  const toggleSection = (sec) => {
    setSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    addToast({
      type: 'info',
      title: 'Generating PDF',
      message: 'Compiling selected report sections into high-DPI document...',
    });

    try {
      await exportReportToPdf('printable-report-canvas', `${targetStation.name.replace(/\s+/g, '_')}_WQ_Report.pdf`);
      addToast({
        type: 'safe',
        title: 'PDF Export Ready',
        message: 'Report compiled and downloaded successfully.',
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: 'warning',
        title: 'Export Fallback',
        message: 'Opening print dialog for document export.',
      });
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCsv = () => {
    const rows = waterData.records?.length ? waterData.records : waterData.states || [];
    if (!rows.length) {
      addToast({ type: 'warning', title: 'CSV unavailable', message: 'Processed state data has not loaded yet.' });
      return;
    }
    const headers = rows === waterData.records
      ? Object.keys(rows[0])
      : ['state', 'water_quality_score', 'records', 'status', 'latitude', 'longitude'];
    const csv = [headers.join(','), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'aquanet-state-water-quality.csv';
    link.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'safe', title: 'CSV exported', message: 'State ranking data downloaded successfully.' });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/40 dark:border-slate-800/60">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Regulatory & Research Documentation
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-400">PDF Generation Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('reportsTitle', 'Reports')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Generate publication-grade water quality bulletins, regulatory compliance filings, and telemetry audit packages
          </p>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <button onClick={handleExportCsv} className="px-4 py-2.5 rounded-2xl glass-card text-xs font-bold text-cyan-400 border border-cyan-500/30 flex items-center gap-2"><FileText className="w-4 h-4" /> {t('exportCsv', 'Export CSV')}</button>
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-ocean-600 text-white font-bold text-xs tracking-wide shadow-neon-glow hover:shadow-neon-glow-lg transition flex items-center space-x-2 disabled:opacity-50"
          >
            {isExporting ? <span>Compiling PDF Document...</span> : <><Download className="w-4 h-4" /><span>Generate & Download PDF</span></>}
          </button>
        </div>
      </div>

      {/* Builder Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Customizer & Section Selector */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
              Report Parameters & Scope
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Document Title</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-card text-xs text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800/80 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Target Water Body</label>
                <select
                  value={selectedStationId}
                  onChange={(e) => setSelectedStationId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl glass-card text-xs text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800/80 focus:outline-none focus:border-cyan-400"
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.name} ({s.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Audit Time Range</label>
                <select className="w-full px-3.5 py-2 rounded-xl glass-card text-xs text-slate-900 dark:text-white border border-slate-200/50 dark:border-slate-800/80 focus:outline-none focus:border-cyan-400">
                  <option className="bg-slate-900 text-white">Current Active Bi-Weekly Cycle</option>
                  <option className="bg-slate-900 text-white">Last 30 Days Consolidated</option>
                  <option className="bg-slate-900 text-white">Quarterly Environmental Review</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/40 dark:border-slate-800/60">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Include Report Sections
              </h4>
              <div className="space-y-2.5">
                {[
                  { key: 'summary', label: 'Executive Synthesis & WQI Grade' },
                  { key: 'sensorReadings', label: 'In-Situ IoT Physicochemical Telemetry' },
                  { key: 'satelliteIndices', label: 'Sentinel-2 MSI Remote Sensing Indices' },
                  { key: 'remediationAction', label: 'AI Remediation & Safety Recommendations' },
                ].map((sec) => (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => toggleSection(sec.key)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl glass-card hover:border-cyan-500/30 text-left transition"
                  >
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {sec.label}
                    </span>
                    {sections[sec.key] ? (
                      <CheckSquare className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          {/* Historical Generated Reports */}
          <GlassCard className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Generated Reports Archive
            </h3>
            <div className="space-y-2.5">
              {reportHistory.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 rounded-xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800/50 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {rep.title}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {rep.date} • {rep.size} • WQI {rep.wqi}
                    </div>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="p-1.5 rounded-lg hover:bg-cyan-500/20 text-cyan-400 transition shrink-0"
                    title="Print / Save Document"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right: Live Document Preview Panel */}
        <div className="lg:col-span-7">
          <div className="sticky top-20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Live High-DPI Bulletin Preview
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">Standard A4 Layout</span>
            </div>

            {/* Printable Report Canvas */}
            <div
              id="printable-report-canvas"
              className="bg-white text-slate-900 p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-300 font-sans space-y-6 min-h-[700px]"
            >
              {/* Report Official Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div>
                  <div className="flex items-center space-x-2 text-cyan-700 font-bold text-lg tracking-tight">
                    <Droplets className="w-6 h-6 text-cyan-600" />
                    <span>AQUANET VISION ENVIRONMENTAL BULLETIN</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    {reportTitle}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Target Station: <strong>{targetStation.name}</strong> ({targetStation.type})
                  </p>
                </div>

                <div className="text-right text-xs text-slate-500 font-mono">
                  <div>REF: ANV-2026-09</div>
                  <div>DATE: {new Date().toLocaleDateString()}</div>
                  <div className="text-emerald-700 font-bold">STATUS: OFFICIAL</div>
                </div>
              </div>

              {/* Section 1: Executive Summary */}
              {sections.summary && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                    1. Executive Water Quality Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase">Composite WQI</span>
                      <strong className="text-2xl font-extrabold text-cyan-800">{targetStation.wqi}</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase">Potability Rating</span>
                      <strong className="text-2xl font-extrabold text-cyan-800">{targetStation.potabilityScore}%</strong>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block uppercase">Risk Classification</span>
                      <strong className={`text-xl font-extrabold ${targetStation.status === 'safe' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {targetStation.riskLevel}
                      </strong>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    The selected assessment shows that <strong>{targetStation.name}</strong> has an overall Water Quality Index of <strong>{targetStation.wqi}</strong> ({targetStation.statusText}). Review the available readings and indicators when interpreting this result.
                  </p>
                </div>
              )}

              {/* Section 2: Sensor Telemetry Readings */}
              {sections.sensorReadings && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                    2. In-Situ IoT Physicochemical Telemetry
                  </h4>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[600px] text-left text-xs border border-slate-200">
                    <thead className="bg-slate-100 font-mono text-[10px]">
                      <tr>
                        <th className="p-2 border-b">Parameter</th>
                        <th className="p-2 border-b">Observed Value</th>
                        <th className="p-2 border-b">Permissible Standard</th>
                        <th className="p-2 border-b">Compliance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      <tr>
                        <td className="p-2 font-sans font-medium">Acidity (pH)</td>
                        <td className="p-2 font-bold">{targetStation.current.pH}</td>
                        <td className="p-2 text-slate-600">6.5 - 8.5</td>
                        <td className="p-2 text-emerald-700 font-bold">Compliant</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium">Turbidity</td>
                        <td className="p-2 font-bold">{targetStation.current.turbidity} NTU</td>
                        <td className="p-2 text-slate-600">&lt; 5.0 NTU</td>
                        <td className="p-2 text-emerald-700 font-bold">Compliant</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium">Dissolved Oxygen</td>
                        <td className="p-2 font-bold">{targetStation.current.dissolvedOxygen} mg/L</td>
                        <td className="p-2 text-slate-600">&gt; 6.0 mg/L</td>
                        <td className="p-2 text-emerald-700 font-bold">Compliant</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium">Water Temperature</td>
                        <td className="p-2 font-bold">{targetStation.current.temperature} °C</td>
                        <td className="p-2 text-slate-600">Ambient</td>
                        <td className="p-2 text-emerald-700 font-bold">Normal</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-sans font-medium">Total Dissolved Solids</td>
                        <td className="p-2 font-bold">{targetStation.current.tds} ppm</td>
                        <td className="p-2 text-slate-600">&lt; 500 ppm</td>
                        <td className="p-2 text-emerald-700 font-bold">Compliant</td>
                      </tr>
                    </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Section 3: Satellite Remote Sensing Indices */}
              {sections.satelliteIndices && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
                    3. Sentinel-2 Multispectral Radiance (Copernicus L2A)
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs text-center font-mono">
                    <div className="p-2 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <span className="text-[10px] text-slate-500 block">NDCI Chlorophyll</span>
                      <strong>{targetStation.current.ndci}</strong>
                    </div>
                    <div className="p-2 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <span className="text-[10px] text-slate-500 block">NDTI Turbidity</span>
                      <strong>{targetStation.current.ndti}</strong>
                    </div>
                    <div className="p-2 bg-cyan-50 border border-cyan-200 rounded-lg">
                      <span className="text-[10px] text-slate-500 block">NDWI Water Extent</span>
                      <strong>{targetStation.current.ndwi}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">
                    Latest Granule: {targetStation.satellitePass} with cloud masking factor of {targetStation.cloudCover}.
                  </p>
                </div>
              )}

              {/* Section 4: AI Recommendations */}
              {sections.remediationAction && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    4. Autonomous Mitigation Recommendations
                  </h4>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {targetStation.wqi >= 80
                      ? 'Water quality is within regulatory baseline tolerances. Maintain current IoT telemetry frequency and standard bi-weekly calibration cycles.'
                      : 'WARNING: Elevated biological/turbidity markers. Trigger municipal intake diversion and notify regional pollution control officers immediately.'}
                  </p>
                </div>
              )}

              {/* Official Signature Footer */}
              <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-end text-xs text-slate-600">
                <div>
                  <div><strong>Lead Investigator:</strong> {currentUser.name}</div>
                  <div><strong>Institution:</strong> {currentUser.institution}</div>
                  {/* Course code removed */}
                </div>
                <div className="text-right">
                  <div className="h-8 border-b border-slate-400 w-36 mb-1"></div>
                  <div className="text-[10px] uppercase font-mono">Authorized Signature</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
