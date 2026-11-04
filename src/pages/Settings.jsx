import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  UploadCloud,
  Radio,
  Settings as SettingsIcon,
  Bell,
  CheckCircle2,
  Trash2,
  Edit3,
  FileSpreadsheet,
  Check,
  Cpu,
  Lock,
  Eye
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import StatusBadge from '../components/common/StatusBadge';
import { useApp } from '../context/AppContext';

export default function Settings() {
  const {
    currentUser,
    userRole,
    setUserRole,
    stations,
    addToast
  } = useApp();
  const { soundEnabled, setSoundEnabled } = useApp();

  const [units, setUnits] = useState('metric');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [uploadedData, setUploadedData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleRoleToggle = (newRole) => {
    const persisted = setUserRole(newRole);
    addToast({
      type: persisted ? 'info' : 'warning',
      title: persisted ? 'Demo Role Switched' : 'Demo Role Not Persisted',
      message: persisted
        ? `Selected ${newRole === 'admin' ? 'Administrator' : 'Analyst'} demo permissions. This is not a login or secure identity.`
        : 'The role changed for this page session, but browser storage is unavailable.',
    });
  };

  const handleMockCsvUpload = (file) => {
    if (userRole !== 'admin') {
      addToast({ type: 'warning', title: 'Administrator required', message: 'Analyst demo role cannot access data upload.' });
      return;
    }
    // Simulated CSV parsing
    const mockParsed = [
      { id: 'REC-01', timestamp: '2026-09-15 10:00', pH: 7.42, turbidity: 3.4, DO: 7.8, temp: 24.5 },
      { id: 'REC-02', timestamp: '2026-09-15 10:15', pH: 7.45, turbidity: 3.2, DO: 7.9, temp: 24.7 },
      { id: 'REC-03', timestamp: '2026-09-15 10:30', pH: 7.39, turbidity: 3.5, DO: 7.7, temp: 24.6 },
      { id: 'REC-04', timestamp: '2026-09-15 10:45', pH: 7.41, turbidity: 3.3, DO: 7.8, temp: 24.8 },
    ];
    setUploadedData(mockParsed);
    addToast({
      type: 'info',
      title: 'Demo CSV Preview',
      message: `Displayed sample records for ${file ? file.name : 'telemetry_sample.csv'}; no data was uploaded or saved.`,
    });
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (userRole !== 'admin') return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleMockCsvUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200/40 dark:border-slate-800/60">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
            System Administration
          </span>
          <span className="text-slate-400">•</span>
          <span className="text-xs text-slate-400">Security & Sensor Infrastructure</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Settings & Node Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Role-based access control, IoT sensor hardware telemetry registry, and batch CSV data ingestion
        </p>
      </div>

      {/* Profile & RBAC Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Card */}
        <GlassCard className="lg:col-span-5 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-5">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-ocean-700 via-cyan-600 to-cyan-400 flex items-center justify-center text-white font-extrabold text-2xl shadow-glass-md">
                JS
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {currentUser.name}
                </h3>
                <p className="text-xs text-cyan-400 font-medium">{currentUser.roleTitle}</p>
                <p className="text-[11px] text-slate-400">{currentUser.email}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800/60 space-y-1.5 text-xs text-slate-400">
              <div>Institution: <strong className="text-slate-800 dark:text-slate-200">{currentUser.institution}</strong></div>
              <div>Department: <strong className="text-slate-800 dark:text-slate-200">{currentUser.department}</strong></div>
              <div>Affiliation: <strong className="text-slate-800 dark:text-slate-200">{currentUser.team}</strong></div>
            </div>
          </div>

          {/* Role-Based Access Control Switcher */}
          <div className="mt-6 pt-5 border-t border-slate-200/40 dark:border-slate-800/60">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">
              Demo Role Selector (not authentication)
            </label>
            <p className="mb-3 text-[11px] leading-relaxed text-amber-500">
              Demonstration only: anyone with browser access can switch this role. It does not establish a user identity.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleRoleToggle('admin')}
                className={`p-3 rounded-2xl border text-left transition ${
                  userRole === 'admin'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-neon-glow'
                    : 'glass-card border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  {userRole === 'admin' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="font-bold text-xs">Administrator (Demo)</div>
                <div className="text-[10px] text-slate-400 leading-tight">Full hardware calibration & data upload</div>
              </button>

              <button
                onClick={() => handleRoleToggle('analyst')}
                className={`p-3 rounded-2xl border text-left transition ${
                  userRole === 'analyst'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 shadow-neon-glow'
                    : 'glass-card border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Eye className="w-4 h-4" />
                  {userRole === 'analyst' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="font-bold text-xs">Analyst (Demo)</div>
                <div className="text-[10px] text-slate-400 leading-tight">Read-only monitoring & predictions</div>
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Global Preferences */}
        <GlassCard className="lg:col-span-7 p-6 space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            System Preferences
          </h3>

          <div className="space-y-4 text-xs">
            {/* Unit System */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800/50">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Measurement Units</div>
                <div className="text-[11px] text-slate-400">Metric (°C, mg/L, NTU) vs Imperial (°F, ppm)</div>
              </div>
              <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-200/60 dark:bg-slate-700/60">
                <button
                  onClick={() => setUnits('metric')}
                  className={`px-3 py-1 rounded-lg font-medium text-xs transition ${
                    units === 'metric' ? 'bg-cyan-500 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Metric
                </button>
                <button
                  onClick={() => setUnits('imperial')}
                  className={`px-3 py-1 rounded-lg font-medium text-xs transition ${
                    units === 'imperial' ? 'bg-cyan-500 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  Imperial
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800/50">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Critical Email Dispatches</div>
                <div className="text-[11px] text-slate-400">Instant alert notification for WQI &lt; 50 or severe hypoxia</div>
              </div>
              <button
                disabled={userRole !== 'admin'}
                onClick={() => setEmailAlerts(!emailAlerts)}
                title={userRole === 'admin' ? 'Toggle email alerts' : 'Administrator demo role required'}
                className={`w-11 h-6 rounded-full transition-colors relative disabled:cursor-not-allowed disabled:opacity-40 ${
                  emailAlerts ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    emailAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Alert Sound */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800/50">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">Alert Sound</div>
                <div className="text-[11px] text-slate-400">Play notification sound for critical and warning alerts</div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    soundEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Mobile SMS */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-100/50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-800/50">
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">SMS Gateway Broadcast</div>
                <div className="text-[11px] text-slate-400">Legacy preference only; no SMS provider is configured</div>
              </div>
              <button
                disabled={userRole !== 'admin'}
                onClick={() => setSmsAlerts(!smsAlerts)}
                title={userRole === 'admin' ? 'Legacy preference; does not send SMS' : 'Administrator demo role required'}
                className={`w-11 h-6 rounded-full transition-colors relative disabled:cursor-not-allowed disabled:opacity-40 ${
                  smsAlerts ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                    smsAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Data Ingestion (Admin Only Gate) */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-cyan-400" />
              <span>Batch IoT Sensor CSV Ingestion</span>
            </h3>
            <p className="text-xs text-slate-400">
              Demo preview only. This screen does not upload or commit a file.
            </p>
          </div>

          {userRole !== 'admin' && (
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Privileges Required</span>
            </span>
          )}
        </div>

        {userRole === 'admin' ? (
          <div className="space-y-4">
            {/* Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => handleMockCsvUpload({ name: 'pulicat_sensor_data_2026.csv' })}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-slate-300 dark:border-slate-800 hover:border-cyan-400/50 hover:bg-slate-100/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <FileSpreadsheet className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Drop a CSV file here to preview sample rows
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Supports CSV formats containing columns: <code>pH, turbidity, DO, temp, TDS, conductivity</code>
              </p>
            </div>

            {/* Uploaded Preview Table */}
            {uploadedData && (
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Demo preview: sample records only; no data was uploaded or saved</span>
                  </span>
                  <button
                    onClick={() => setUploadedData(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Clear
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">Record ID</th>
                        <th className="p-2.5">Timestamp</th>
                        <th className="p-2.5">pH</th>
                        <th className="p-2.5">Turbidity</th>
                        <th className="p-2.5">DO</th>
                        <th className="p-2.5">Temp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/50 font-mono">
                      {uploadedData.map((row) => (
                        <tr key={row.id} className="hover:bg-cyan-500/5">
                          <td className="p-2.5 text-cyan-400">{row.id}</td>
                          <td className="p-2.5 text-slate-400">{row.timestamp}</td>
                          <td className="p-2.5">{row.pH}</td>
                          <td className="p-2.5">{row.turbidity} NTU</td>
                          <td className="p-2.5">{row.DO} mg/L</td>
                          <td className="p-2.5">{row.temp} °C</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
            You are using the <strong>Analyst demo role</strong>. Administrative data and sensor controls are unavailable in this view.
          </div>
        )}
      </GlassCard>

      {/* Sensor Hardware Registry Table */}
      {userRole === 'admin' ? <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Registered Telemetry Hardware Nodes
            </h3>
            <p className="text-xs text-slate-400">
              ESP32 microcontrollers, LoRa gateways, and cellular RTU modems
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            {stations.length} Registered
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/60 dark:border-slate-800/80 text-slate-400 font-mono text-[10px] uppercase">
                <th className="pb-3 font-semibold">Node Name</th>
                <th className="pb-3 font-semibold">Hardware Type</th>
                <th className="pb-3 font-semibold">Battery</th>
                <th className="pb-3 font-semibold">Signal</th>
                <th className="pb-3 font-semibold">Sync Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/50">
              {stations.map((st) => (
                <tr key={st.id} className="hover:bg-cyan-500/5 transition">
                  <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {st.name}
                  </td>
                  <td className="py-3 font-mono text-slate-400">{st.hardware}</td>
                  <td className="py-3 font-mono text-emerald-400">{st.battery}%</td>
                  <td className="py-3 font-mono text-cyan-400">{st.signalDbm} dBm</td>
                  <td className="py-3">
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Online
                    </span>
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      disabled={userRole !== 'admin'}
                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 disabled:opacity-30 disabled:hover:text-slate-400 transition"
                      title={userRole === 'admin' ? 'Calibrate Node' : 'Admin Only'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard> : (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-200" role="status">
          Sensor management is restricted to the Administrator demo role. No sensor controls or registry details are exposed in this view.
        </div>
      )}
    </div>
  );
}
