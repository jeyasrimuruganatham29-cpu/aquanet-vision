import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BellRing, Check, Clock3, Eye, Pencil, Search, ShieldAlert, Trash2, Users, X } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import { useApp } from '../context/AppContext';
import {
  addEmergencyRecipient,
  approveEmergencyAlert,
  cancelEmergencyAlert,
  createEmergencyAlert,
  deleteEmergencyRecipient,
  fetchEmergencyAlerts,
  fetchEmergencyAlertDetails,
  fetchEmergencyRecipients,
  previewEmergencyAlert,
  simulateEmergencyAlertSend,
  updateEmergencyAlert,
} from '../services/apiService';

const EMPTY_DRAFT = {
  title: '',
  emergency_type: 'water_contamination',
  severity: 'high',
  state: '',
  district: '',
  water_body: '',
  message: '',
  precautions: '',
  expires_at: '',
};

const EMERGENCY_TYPES = [
  ['water_contamination', 'Water contamination'],
  ['flood_contamination', 'Flood-related water contamination'],
  ['drought_water_quality', 'Drought-related water-quality risk'],
  ['industrial_pollution', 'Industrial pollution'],
  ['sewage_contamination', 'Sewage contamination'],
  ['other', 'Other'],
  ['contamination', 'Water contamination (legacy)'],
  ['flooding', 'Flooding (legacy)'],
  ['extreme_rainfall', 'Extreme rainfall (legacy)'],
  ['drought', 'Drought (legacy)'],
];

const SEVERITIES = ['low', 'medium', 'high', 'critical'];

const EMPTY_RECIPIENT = {
  name: '',
  phone: '',
  state: '',
  district: '',
  consent: false,
};

function humanize(value = '') {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function expiryInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function maskedPhone(value = '') {
  return value.length > 4 ? `${value.slice(0, 3)}******${value.slice(-4)}` : '••••';
}

async function loadEmergencyData(isAdmin) {
  const alertResult = await fetchEmergencyAlerts();
  const recipientResult = isAdmin ? await fetchEmergencyRecipients() : { recipients: [] };
  return {
    alerts: alertResult.alerts || [],
    recipients: recipientResult.recipients || [],
  };
}

export default function EmergencyAlerts() {
  const { userRole } = useApp();
  const isAdmin = userRole === 'admin';
  const [alerts, setAlerts] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editingAlertId, setEditingAlertId] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [recipientForm, setRecipientForm] = useState(EMPTY_RECIPIENT);
  const [previews, setPreviews] = useState({});
  const [dialog, setDialog] = useState(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredAlerts = useMemo(() => alerts.filter((alert) => {
    const matchesSearch = [alert.id, alert.title, alert.message, alert.water_body, alert.state, alert.district]
      .filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase());
    return matchesSearch
      && (severityFilter === 'all' || alert.severity === severityFilter)
      && (stateFilter === 'all' || alert.state === stateFilter)
      && (typeFilter === 'all' || alert.emergency_type === typeFilter)
      && (statusFilter === 'all' || alert.status === statusFilter);
  }), [alerts, search, severityFilter, stateFilter, typeFilter, statusFilter]);

  const states = [...new Set(alerts.map((alert) => alert.state).filter(Boolean))].sort();
  const alertTypes = [...new Set(alerts.map((alert) => alert.emergency_type).filter(Boolean))].sort();
  const overview = {
    total: alerts.length,
    drafts: alerts.filter((alert) => alert.status === 'draft').length,
    approved: alerts.filter((alert) => alert.status === 'approved').length,
    simulated: alerts.filter((alert) => alert.status === 'simulated').length,
  };
  const overviewReady = !loading && !error;

  useEffect(() => {
    let active = true;
    loadEmergencyData(isAdmin).then((result) => {
      if (!active) return;
      setAlerts(result.alerts);
      setRecipients(result.recipients);
      setError('');
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await loadEmergencyData(isAdmin);
      setAlerts(result.alerts);
      setRecipients(result.recipients);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAlert = (alert) => {
    setAlerts((current) => [alert, ...current.filter((entry) => entry.id !== alert.id)]);
  };

  const handleSaveDraft = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        ...draft,
        expires_at: draft.expires_at ? new Date(draft.expires_at).toISOString() : '',
      };
      const result = editingAlertId
        ? await updateEmergencyAlert(editingAlertId, payload)
        : await createEmergencyAlert(payload);
      updateAlert(result.alert);
      setDraft(EMPTY_DRAFT);
      setEditingAlertId(null);
      setNotice(editingAlertId ? 'Draft changes saved.' : 'Draft saved. It is not verified, approved, or sent.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleEditDraft = (alert) => {
    setDraft({
      title: alert.title || '',
      emergency_type: alert.emergency_type,
      severity: alert.severity,
      state: alert.state,
      district: alert.district,
      water_body: alert.water_body || '',
      message: alert.message,
      precautions: alert.precautions,
      expires_at: expiryInputValue(alert.expires_at),
    });
    setEditingAlertId(alert.id);
    setError('');
    document.getElementById('emergency-alert-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleShowDetails = async (alert) => {
    setBusy(true);
    setError('');
    try {
      const result = await fetchEmergencyAlertDetails(alert.id);
      setSelectedAlert({ ...result.alert, status_history: result.status_history || [] });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePreview = async (alert) => {
    setBusy(true);
    setError('');
    try {
      const result = await previewEmergencyAlert(alert.id);
      setPreviews((current) => ({ ...current, [alert.id]: result }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleApprove = async () => {
    if (!dialog?.alert || !verified) return;
    setBusy(true);
    setError('');
    try {
      const result = await approveEmergencyAlert(dialog.alert.id);
      updateAlert(result.alert);
      setNotice('Alert approved by the Administrator demo role after verification confirmation.');
      setDialog(null);
      setVerified(false);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSimulation = async () => {
    const alert = dialog?.alert;
    const preview = alert && previews[alert.id];
    if (!alert || !preview || preview.recipient_count < 1 || preview.exceeds_limit) return;
    setBusy(true);
    setError('');
    try {
      const result = await simulateEmergencyAlertSend(alert.id, {
        confirmed: true,
        confirmed_message: preview.message,
        confirmed_recipient_count: preview.recipient_count,
      });
      updateAlert(result.alert);
      setNotice('Simulation recorded. No SMS provider was contacted and no messages were sent.');
      setDialog(null);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (alert) => {
    setBusy(true);
    setError('');
    try {
      const result = await cancelEmergencyAlert(alert.id);
      updateAlert(result.alert);
      setNotice('Draft or approved alert cancelled.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleAddRecipient = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await addEmergencyRecipient(recipientForm);
      setRecipients((current) => [...current, result.recipient]);
      setRecipientForm(EMPTY_RECIPIENT);
      setNotice('Consented recipient registered.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRecipient = async (recipient) => {
    if (!window.confirm(`Remove ${recipient.name} from emergency recipients?`)) return;
    setBusy(true);
    setError('');
    try {
      await deleteEmergencyRecipient(recipient.id);
      setRecipients((current) => current.filter((entry) => entry.id !== recipient.id));
      setNotice('Recipient removed.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="border-b border-slate-200/40 pb-3 dark:border-slate-800/60">
        <div className="mb-1 flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-rose-400">
          <ShieldAlert className="h-4 w-4" />
          <span>Manual Emergency Communications</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
          Emergency SMS Alerts
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
          Prepare area-targeted notices, review recipients, and track approval and test status.
        </p>
      </header>

      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
        <strong>Simulation mode only:</strong> no SMS provider is configured, and this page cannot send real messages.
        Alerts are manually prepared; there is no verified weather-warning integration, and model predictions do not
        create or send public alerts. Confirm an emergency using trusted sources before administrator approval.
        The selected role is stored in the browser and sent in a client-controlled header; this is demonstration-only, not authentication. Do not expose this service publicly.
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">{notice}</div>}

      <section aria-label="Emergency overview" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Total alerts', overviewReady ? overview.total : '—'],
          ['Drafts', overviewReady ? overview.drafts : '—'],
          ['Approved', overviewReady ? overview.approved : '—'],
          ['Simulated, not sent', overviewReady ? overview.simulated : '—'],
          ['Active high-risk incidents', 'Unavailable'],
        ].map(([label, value]) => (
          <GlassCard key={label} className="p-4">
            <span className="block text-[10px] uppercase tracking-wider text-slate-400">{label}</span>
            <strong className="mt-1 block text-xl text-slate-900 dark:text-white">{value}</strong>
            {label === 'Active high-risk incidents' && <span className="mt-1 block text-[10px] text-slate-400">No verified risk-feed integration</span>}
          </GlassCard>
        ))}
      </section>

      <GlassCard id="emergency-alert-form" className="p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <BellRing className="h-5 w-5 text-cyan-400" />
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Prepare an emergency draft</h2>
            <p className="text-xs text-slate-400">Drafting does not verify an event or contact recipients.</p>
          </div>
        </div>
        <form onSubmit={handleSaveDraft} className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-slate-500 dark:text-slate-300 md:col-span-2">
            Alert title
            <input required maxLength={150} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="w-full min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Short, clear incident title" />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-500 dark:text-slate-300">
            Emergency type
            <select value={draft.emergency_type} onChange={(event) => setDraft({ ...draft, emergency_type: event.target.value })} className="w-full rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {EMERGENCY_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-500 dark:text-slate-300">
            Severity
            <select value={draft.severity} onChange={(event) => setDraft({ ...draft, severity: event.target.value })} className="w-full rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              {[...SEVERITIES, 'info', 'warning'].map((severity) => <option key={severity} value={severity}>{humanize(severity)}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-500 dark:text-slate-300">
            Affected state
            <input required maxLength={100} value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })} className="w-full min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="State name" />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-500 dark:text-slate-300">
            Affected district
            <input required maxLength={100} value={draft.district} onChange={(event) => setDraft({ ...draft, district: event.target.value })} className="w-full min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="District name or * for all districts" />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-500 dark:text-slate-300">
            River, lake, water body, or station <span className="font-normal text-slate-400">(optional)</span>
            <input maxLength={200} value={draft.water_body} onChange={(event) => setDraft({ ...draft, water_body: event.target.value })} className="w-full min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Enter a known location name" />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-500 dark:text-slate-300">
            Valid until <span className="font-normal text-slate-400">(optional)</span>
            <input type="datetime-local" min={new Date().toISOString().slice(0, 16)} value={draft.expires_at} onChange={(event) => setDraft({ ...draft, expires_at: event.target.value })} className="w-full min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-500 dark:text-slate-300 md:col-span-2">
            Warning message <span className="font-normal text-slate-400">(maximum 500 characters)</span>
            <textarea required maxLength={500} rows={3} value={draft.message} onChange={(event) => setDraft({ ...draft, message: event.target.value })} className="w-full resize-y rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Enter only verified, actionable information." />
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-500 dark:text-slate-300 md:col-span-2">
            Recommended precautions <span className="font-normal text-slate-400">(maximum 1000 characters)</span>
            <textarea required maxLength={1000} rows={3} value={draft.precautions} onChange={(event) => setDraft({ ...draft, precautions: event.target.value })} className="w-full resize-y rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="Provide clear, verified precautions." />
          </label>
          <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
            <span className="text-[11px] text-slate-400">
              {isAdmin ? 'Administrator demo role: draft, verify, approve, and simulate.' : 'Analyst demo role: draft and preview only.'}
            </span>
            <button disabled={busy} className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-cyan-500 disabled:opacity-50">
              {busy ? 'Saving…' : editingAlertId ? 'Save draft changes' : 'Save draft'}
            </button>
            {editingAlertId && <button type="button" disabled={busy} onClick={() => { setEditingAlertId(null); setDraft(EMPTY_DRAFT); }} className="rounded-xl border border-slate-600 px-4 py-2 text-xs text-slate-300">Cancel edit</button>}
          </div>
        </form>
      </GlassCard>

      {isAdmin && (
        <GlassCard className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Consented recipients</h2>
              <p className="text-xs text-slate-400">Phone numbers are visible to the Administrator demo role only.</p>
            </div>
          </div>
          <form onSubmit={handleAddRecipient} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input required maxLength={100} aria-label="Recipient name" placeholder="Recipient name" value={recipientForm.name} onChange={(event) => setRecipientForm({ ...recipientForm, name: event.target.value })} className="min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            <input required aria-label="Indian mobile number" placeholder="+91XXXXXXXXXX" value={recipientForm.phone} onChange={(event) => setRecipientForm({ ...recipientForm, phone: event.target.value })} className="min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            <input required maxLength={100} aria-label="Recipient state" placeholder="State" value={recipientForm.state} onChange={(event) => setRecipientForm({ ...recipientForm, state: event.target.value })} className="min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            <input required maxLength={100} aria-label="Recipient district" placeholder="District or *" value={recipientForm.district} onChange={(event) => setRecipientForm({ ...recipientForm, district: event.target.value })} className="min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
            <button disabled={busy} className="rounded-xl bg-cyan-600 px-3 py-2 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50">Register recipient</button>
            <label className="flex items-start gap-2 text-[11px] text-slate-400 sm:col-span-2 lg:col-span-5">
              <input required type="checkbox" checked={recipientForm.consent} onChange={(event) => setRecipientForm({ ...recipientForm, consent: event.target.checked })} className="mt-0.5" />
              I confirm this person gave consent to receive emergency SMS notices for the selected area.
            </label>
          </form>
          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/40 dark:border-slate-800/60">
            <table className="w-full min-w-[560px] text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <tr><th className="p-3">Name</th><th className="p-3">Phone</th><th className="p-3">Area</th><th className="p-3">Consent recorded</th><th className="p-3">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200/40 dark:divide-slate-800/60">
                {recipients.map((recipient) => (
                  <tr key={recipient.id}>
                    <td className="p-3">{recipient.name}</td>
                    <td className="p-3 font-mono">{maskedPhone(recipient.phone)}</td>
                    <td className="p-3">{recipient.district}, {recipient.state}</td>
                    <td className="p-3">{recipient.consent ? 'Yes' : 'No'}</td>
                    <td className="p-3"><button disabled={busy} onClick={() => handleDeleteRecipient(recipient)} aria-label={`Remove ${recipient.name}`} className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
                {!recipients.length && <tr><td colSpan="5" className="p-4 text-center text-slate-400">No recipients registered. Live or simulated sends will not be available without consented matches.</td></tr>}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Alert drafts and history</h2>
            <p className="text-xs text-slate-400">Status is recorded distinctly; simulated is not delivered.</p>
          </div>
          <button onClick={handleRefresh} disabled={loading || busy} className="rounded-lg border border-slate-300/50 px-3 py-1.5 text-xs text-slate-500 hover:text-cyan-400 disabled:opacity-50 dark:border-slate-700">
            Refresh history
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <label className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input aria-label="Search alerts" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search alerts" className="w-full rounded-xl border border-slate-200/60 bg-white/70 py-2 pl-9 pr-3 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          </label>
          <select aria-label="Filter by severity" value={severityFilter} onChange={(event) => setSeverityFilter(event.target.value)} className="min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <option value="all">All severities</option>{[...SEVERITIES, 'info', 'warning'].map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
          </select>
          <select aria-label="Filter by state" value={stateFilter} onChange={(event) => setStateFilter(event.target.value)} className="min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <option value="all">All states</option>{states.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
          <select aria-label="Filter by emergency type" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <option value="all">All types</option>{alertTypes.map((type) => <option key={type} value={type}>{humanize(type)}</option>)}
          </select>
          <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-w-0 rounded-xl border border-slate-200/60 bg-white/70 px-3 py-2 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <option value="all">All statuses</option>{['draft', 'approved', 'simulated', 'cancelled'].map((value) => <option key={value} value={value}>{humanize(value)}</option>)}
          </select>
        </div>
        {loading ? (
          <GlassCard className="p-8 text-center text-sm text-slate-400">Loading emergency alert history…</GlassCard>
        ) : filteredAlerts.length ? filteredAlerts.map((alert) => {
          const preview = previews[alert.id];
          return (
            <GlassCard key={alert.id} className="space-y-4 p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-rose-300">{alert.severity}</span>
                    <span className="rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-300">{humanize(alert.status)}</span>
                    <span className="text-[11px] text-slate-400">ID {alert.id} · {humanize(alert.emergency_type)} · {alert.water_body ? `${alert.water_body}, ` : ''}{alert.district}, {alert.state}</span>
                  </div>
                  <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">{alert.title || humanize(alert.emergency_type)}</p>
                  <p className="break-words text-xs text-slate-300">{alert.message}</p>
                  <p className="break-words text-xs text-slate-400">Precautions: {alert.precautions}</p>
                  <p className="text-[10px] text-slate-500">
                    Created by {humanize(alert.created_by_role)} demo role · {new Date(alert.created_at).toLocaleString()}
                    {alert.verified_at ? ` · independently verified by ${humanize(alert.verified_by_role)} demo role` : ' · not yet independently verified'}
                    {alert.expires_at ? ` · valid until ${new Date(alert.expires_at).toLocaleString()}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button disabled={busy} onClick={() => handleShowDetails(alert)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-500/30 px-3 py-2 text-xs text-slate-300 hover:bg-slate-500/10 disabled:opacity-50"><Eye className="h-3.5 w-3.5" /> Details</button>
                  {isAdmin && alert.status === 'draft' && <button disabled={busy} onClick={() => handleEditDraft(alert)} className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50"><Pencil className="h-3.5 w-3.5" /> Edit draft</button>}
                  {['draft', 'approved'].includes(alert.status) && (
                    <button disabled={busy} onClick={() => handlePreview(alert)} className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 px-3 py-2 text-xs text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50">
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                  )}
                  {isAdmin && alert.status === 'draft' && (
                    <button disabled={busy} onClick={() => { setVerified(false); setDialog({ type: 'approve', alert }); }} className="rounded-xl border border-emerald-500/30 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-50">Verify &amp; approve</button>
                  )}
                  {isAdmin && alert.status === 'approved' && (
                    <button disabled={busy || !preview} onClick={() => setDialog({ type: 'send', alert })} className="rounded-xl border border-amber-500/30 px-3 py-2 text-xs text-amber-200 hover:bg-amber-500/10 disabled:opacity-50">Confirm simulation</button>
                  )}
                  {isAdmin && ['draft', 'approved'].includes(alert.status) && (
                    <button disabled={busy} onClick={() => handleCancel(alert)} className="rounded-xl border border-rose-500/30 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10 disabled:opacity-50">Cancel</button>
                  )}
                </div>
              </div>
              {preview && (
                <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs">
                  <div className="font-semibold text-cyan-200">Preview recipient count: {preview.recipient_count} · maximum: {preview.max_recipients}</div>
                  <div className="mt-1 text-slate-400">Target: {preview.district}, {preview.state}. No phone numbers are included in this preview.</div>
                  {preview.exceeds_limit && <div className="mt-1 text-rose-300">The configured recipient cap is exceeded. This alert cannot be processed.</div>}
                  {preview.expired && <div className="mt-1 text-rose-300">This alert has expired and cannot be processed.</div>}
                </div>
              )}
              {alert.status === 'simulated' && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                  <strong>Not sent — simulation only.</strong> Matching recipients: {alert.recipient_count}. {alert.provider_response}
                </div>
              )}
              {alert.status === 'cancelled' && <p className="text-xs text-slate-500">Cancelled · {alert.updated_at && new Date(alert.updated_at).toLocaleString()}</p>}
            </GlassCard>
          );
        }) : (
          <GlassCard className="p-8 text-center">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-slate-500" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{error && !alerts.length ? 'Alert history is unavailable' : alerts.length ? 'No alerts match these filters' : 'No emergency alert drafts or history'}</p>
            <p className="mt-1 text-xs text-slate-400">{error && !alerts.length ? 'The request failed; use Refresh history to try again.' : 'Only alerts recorded by this backend appear here. Failed requests are not replaced with sample data.'}</p>
          </GlassCard>
        )}
      </section>

      {selectedAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedAlert(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="alert-detail-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div><p className="text-[10px] font-mono uppercase tracking-wider text-cyan-300">Alert details · {selectedAlert.id}</p><h2 id="alert-detail-title" className="mt-1 text-lg font-bold text-white">{selectedAlert.title || humanize(selectedAlert.emergency_type)}</h2></div>
              <button onClick={() => setSelectedAlert(null)} aria-label="Close alert details" className="rounded-lg p-1.5 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
              <p><span className="text-slate-400">Type</span><br />{humanize(selectedAlert.emergency_type)}</p>
              <p><span className="text-slate-400">Severity / status</span><br />{humanize(selectedAlert.severity)} · {humanize(selectedAlert.status)}</p>
              <p><span className="text-slate-400">Affected area</span><br />{selectedAlert.water_body ? `${selectedAlert.water_body}, ` : ''}{selectedAlert.district}, {selectedAlert.state}</p>
              <p><span className="text-slate-400">Created by</span><br />{humanize(selectedAlert.created_by_role)} demo role · {new Date(selectedAlert.created_at).toLocaleString()}</p>
              {selectedAlert.approved_at && <p><span className="text-slate-400">Approved by</span><br />{humanize(selectedAlert.approved_by_role)} demo role · {new Date(selectedAlert.approved_at).toLocaleString()}</p>}
              {selectedAlert.expires_at && <p><span className="text-slate-400">Valid until</span><br />{new Date(selectedAlert.expires_at).toLocaleString()}</p>}
              <p className="sm:col-span-2"><span className="text-slate-400">Message</span><br /><span className="whitespace-pre-wrap break-words">{selectedAlert.message}</span></p>
              <p className="sm:col-span-2"><span className="text-slate-400">Precautions</span><br /><span className="whitespace-pre-wrap break-words">{selectedAlert.precautions}</span></p>
              {selectedAlert.delivery_status && <p className="sm:col-span-2"><span className="text-slate-400">Delivery</span><br />{selectedAlert.delivery_status === 'not_sent_simulation' ? 'Simulation only. Not delivered.' : selectedAlert.delivery_status}</p>}
              {selectedAlert.provider_response && <p className="sm:col-span-2 text-amber-200">{selectedAlert.provider_response}</p>}
            </div>
            <div className="mt-6 border-t border-slate-700 pt-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white"><Clock3 className="h-4 w-4 text-cyan-300" />Recorded status history</h3>
              {selectedAlert.status_history.length ? <ol className="space-y-2">{selectedAlert.status_history.map((event, index) => <li key={`${event.event_type}-${event.created_at}-${index}`} className="rounded-lg bg-slate-800/70 p-3 text-xs"><span className="font-semibold text-slate-100">{humanize(event.event_type)}</span>{event.from_status ? ` · ${humanize(event.from_status)} → ${humanize(event.to_status)}` : ` · ${humanize(event.to_status)}`}<span className="block pt-1 text-slate-400">{humanize(event.actor_role)} demo role · {new Date(event.created_at).toLocaleString()}</span></li>)}</ol> : <p className="text-xs text-slate-400">No recorded status events are available.</p>}
            </div>
          </section>
        </div>
      )}

      {dialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setDialog(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="emergency-confirm-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="emergency-confirm-title" className="font-bold text-white">{dialog.type === 'approve' ? 'Verify and approve alert' : 'Confirm simulation details'}</h2>
                <p className="mt-1 text-xs text-amber-200">No live SMS will be sent in this build.</p>
              </div>
              <button onClick={() => setDialog(null)} disabled={busy} aria-label="Close dialog" className="rounded-lg p-1.5 text-slate-400 hover:text-white disabled:opacity-50"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-800/70 p-4 text-xs text-slate-200">
              <p><strong>Affected area:</strong> {dialog.alert.district}, {dialog.alert.state}</p>
              <p><strong>Severity:</strong> {humanize(dialog.alert.severity)}</p>
              <p><strong>Exact warning message:</strong><br /><span className="mt-1 block whitespace-pre-wrap break-words">{dialog.alert.message}</span></p>
              <p><strong>Precautions:</strong><br /><span className="mt-1 block whitespace-pre-wrap break-words">{dialog.alert.precautions}</span></p>
              {dialog.type === 'send' && (
                <>
                  <p><strong>Matching consented recipients:</strong> {previews[dialog.alert.id]?.recipient_count ?? 'Preview required'}</p>
                  <p className="font-semibold text-amber-200">This action only records a simulation. No messages will be sent or marked delivered.</p>
                </>
              )}
            </div>
            {dialog.type === 'approve' ? (
              <label className="mt-4 flex items-start gap-2 text-xs text-slate-300">
                <input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} className="mt-0.5" />
                I independently verified this emergency and the accuracy of the exact warning and precautions above.
              </label>
            ) : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button onClick={() => setDialog(null)} disabled={busy} className="rounded-xl border border-slate-600 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-50">Close</button>
              {dialog.type === 'approve' ? (
                <button onClick={handleApprove} disabled={busy || !verified} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"><Check className="h-4 w-4" /> Confirm approval</button>
              ) : (
                <button onClick={handleSimulation} disabled={busy || !previews[dialog.alert.id] || previews[dialog.alert.id].expired || previews[dialog.alert.id].recipient_count < 1 || previews[dialog.alert.id].exceeds_limit} className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50">{busy ? 'Recording…' : 'Confirm simulation only'}</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
