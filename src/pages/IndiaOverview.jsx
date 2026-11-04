import React, { useMemo, useState } from 'react';
import { Search, ArrowUpDown, MapPinned } from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import StatusBadge from '../components/common/StatusBadge';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

export default function IndiaOverview({ onNavigate }) {
  const { waterData } = useApp();
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [sortDescending, setSortDescending] = useState(true);

  const states = useMemo(() => [...(waterData.states || [])]
    .filter((state) => state.state.toLowerCase().includes(query.toLowerCase()))
    .filter((state) => status === 'all' || state.status === status)
    .sort((a, b) => sortDescending
      ? Number(b.water_quality_score || 0) - Number(a.water_quality_score || 0)
      : Number(a.water_quality_score || 0) - Number(b.water_quality_score || 0)),
  [query, sortDescending, status, waterData.states]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase tracking-[.2em] text-cyan-400 font-mono">Pan-India intelligence</span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{t('indiaAnalysis')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('stateRanking')}</p>
        </div>
        <button onClick={() => onNavigate('map')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold">
          <MapPinned className="w-4 h-4" /> {t('inspectMap')}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GlassCard className="p-4"><span className="text-[10px] uppercase text-slate-400">{t('statesCovered')}</span><strong className="block text-2xl mt-1">{waterData.summary.states_covered || '—'}</strong></GlassCard>
        <GlassCard className="p-4"><span className="text-[10px] uppercase text-slate-400">{t('records')}</span><strong className="block text-2xl mt-1">{(waterData.summary.total_records || 0).toLocaleString()}</strong></GlassCard>
        <GlassCard className="p-4"><span className="text-[10px] uppercase text-slate-400">{t('safe', 'Safe')}</span><strong className="block text-2xl mt-1 text-emerald-400">{(waterData.states || []).filter((state) => state.status === 'safe').length}</strong></GlassCard>
        <GlassCard className="p-4"><span className="text-[10px] uppercase text-slate-400">{t('needsAttention', 'Needs attention')}</span><strong className="block text-2xl mt-1 text-amber-400">{(waterData.states || []).filter((state) => state.status !== 'safe').length}</strong></GlassCard>
      </div>

      <GlassCard className="p-5">
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-4">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchState')} className="w-full pl-9 pr-3 py-2 rounded-xl glass-card text-sm border border-slate-200/60 dark:border-slate-800/70" />
          </div>
          <div className="flex gap-2">
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="px-3 py-2 rounded-xl glass-card text-xs border border-slate-200/60 dark:border-slate-800/70">
              <option value="all">{t('allStatuses', 'All statuses')}</option><option value="safe">{t('safe', 'Safe')}</option><option value="moderate">{t('moderate', 'Moderate')}</option><option value="unsafe">{t('critical', 'Critical')}</option>
            </select>
            <button onClick={() => setSortDescending((value) => !value)} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass-card text-xs border border-slate-200/60 dark:border-slate-800/70"><ArrowUpDown className="w-3.5 h-3.5" /> {t('score')}</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-200/50 dark:border-slate-800/70"><th className="py-3">{t('rank')}</th><th>{t('state')}</th><th>{t('meanWqi')}</th><th>{t('records')}</th><th>{t('status')}</th></tr></thead>
            <tbody>
              {states.map((state, index) => <tr key={state.state} className="border-b border-slate-200/40 dark:border-slate-800/50 hover:bg-cyan-500/5 cursor-pointer" onClick={() => onNavigate(`state-${state.state}`)}><td className="py-3 font-mono text-slate-400">{index + 1}</td><td className="font-semibold text-slate-800 dark:text-white">{state.state}</td><td className="font-mono text-cyan-400">{Number(state.water_quality_score || 0).toFixed(2)}</td><td className="text-slate-500">{Number(state.records || 0).toLocaleString()}</td><td><StatusBadge status={state.status} label={state.status} /></td></tr>)}
            </tbody>
          </table>
          {!states.length && <div className="py-12 text-center text-sm text-slate-400">Processed state data is loading or no state matches the filter.</div>}
        </div>
      </GlassCard>
    </div>
  );
}
