import React, { useEffect, useState } from 'react';
import GlassCard from '../components/common/GlassCard';

export default function State({ stateId, onNavigate }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!stateId) return;
    fetch('/api/state/' + stateId).then((r) => r.json()).then((j) => setProfile(j)).catch(() => {});
  }, [stateId]);

  if (!profile) return <div className="p-6">Loading state profile…</div>;

  const s = profile.state || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{s.name || stateId}</h1>
          <p className="text-xs text-slate-400">Major rivers and lakes with recent water quality statistics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-6">
          <div className="text-xs text-slate-400">Region</div>
          <div className="text-2xl font-bold">{s.region || s.code || '—'}</div>
          <div className="text-xs text-slate-400 mt-2">Population: {s.population || '—'}</div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-xs text-slate-400">Major Rivers</div>
          <div className="text-sm mt-2">{(profile.rivers || []).map(r => r.name).join(', ') || '—'}</div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-xs text-slate-400">Major Lakes</div>
          <div className="text-sm mt-2">{(profile.lakes || []).map(l => l.name).join(', ') || '—'}</div>
        </GlassCard>
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">Recent Water Quality Samples</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(profile.water_quality || []).map((rec, i) => (
            <GlassCard key={i} className="p-4">
              <div className="font-semibold">{rec.station_id || rec.station}</div>
              <div className="text-xs text-slate-400">{rec.timestamp}</div>
              <div className="mt-2 text-sm">WQI: {rec.wqi || '—'} • pH: {rec.pH || rec.pH}</div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
