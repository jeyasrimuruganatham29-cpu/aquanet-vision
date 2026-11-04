import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  Layers,
  Filter,
  Maximize2,
  MapPin,
  Activity,
  Info,
  ShieldCheck,
  AlertTriangle,
  Search
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import StationModal from './StationModal';
import GlassCard from '../common/GlassCard';

// Helper to create custom water drop icons for Leaflet
function createDropIcon(status, wqi) {
  const color =
    status === 'safe'
      ? '#10B981'
      : status === 'moderate'
      ? '#F59E0B'
      : '#EF4444';

  const html = `
    <div class="relative flex items-center justify-center cursor-pointer group" style="transform: translate(-50%, -100%);">
      <div class="absolute -inset-1 rounded-full opacity-60 animate-ping" style="background-color: ${color};"></div>
      <svg width="34" height="42" viewBox="0 0 34 42" fill="none" class="filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
        <path d="M17 1C17 1 3 17.5 3 26.5C3 34.232 9.26801 40.5 17 40.5C24.732 40.5 31 34.232 31 26.5C31 17.5 17 1 17 1Z"
              fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
        <circle cx="17" cy="27" r="7" fill="#FFFFFF" fill-opacity="0.9"/>
      </svg>
      <span style="position: absolute; top: 22px; left: 50%; transform: translateX(-50%); font-size: 8px; font-weight: 800; color: #060E1A; font-family: monospace;">
        ${Math.round(wqi)}
      </span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-drop-icon',
    iconSize: [34, 42],
    iconAnchor: [17, 42],
    popupAnchor: [0, -42],
  });
}

export default function WaterMap({ onNavigate }) {
  const { stations, activeStation, setActiveStationId, waterData } = useApp();
  const { isDark } = useTheme();

  const [mapMode, setMapMode] = useState('markers'); // 'markers' | 'heatmap'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'safe' | 'moderate' | 'unsafe'
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectStation, setInspectStation] = useState(null);

  const stateStations = (waterData.states || [])
    .filter((state) => Number.isFinite(Number(state.latitude)) && Number.isFinite(Number(state.longitude)))
    .map((state, index) => ({
      id: `state-${state.state}-${index}`,
      name: state.state,
      type: 'CPCB state aggregate',
      region: `${state.records || 0} processed records`,
      state: state.state,
      lat: Number(state.latitude),
      lng: Number(state.longitude),
      status: state.status || 'moderate',
      wqi: Number(state.water_quality_score || 0),
      statusText: state.status || 'moderate',
      current: { pH: '—', turbidity: '—', dissolvedOxygen: '—', temperature: '—' },
    }));
  const processedStations = (waterData.water_bodies || [])
    .filter((station) => Number.isFinite(Number(station.latitude)) && Number.isFinite(Number(station.longitude)))
    .map((station, index) => ({
      id: `water-body-${station.station}-${index}`,
      name: station.station,
      type: 'CPCB monitoring station',
      region: `${station.district}, ${station.state}`,
      state: station.state,
      lat: Number(station.latitude),
      lng: Number(station.longitude),
      status: station.status || 'moderate',
      wqi: Number(station.water_quality_score || 0),
      statusText: station.status || 'moderate',
      current: { pH: '—', turbidity: '—', dissolvedOxygen: '—', temperature: '—' },
    }));
  const mapStations = processedStations.length ? processedStations : stateStations.length ? stateStations : stations;

  // Fit the map to the national view when processed state coordinates are available.
  const defaultCenter = processedStations.length || stateStations.length ? [22.5, 79.0] : [14.0, 79.5];
  const defaultZoom = processedStations.length || stateStations.length ? 5 : 6;

  const filteredStations = mapStations.filter((st) => {
    const matchesFilter = filterStatus === 'all' || st.status === filterStatus;
    const matchesSearch =
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Dark or light map tiles
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

  return (
    <div className="relative w-full h-[720px] rounded-3xl overflow-hidden glass-card border border-slate-200/50 dark:border-cyan-500/20 shadow-glass-lg flex flex-col">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 inset-x-4 z-[400] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Search & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search water body, region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-2xl glass-card text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200/60 dark:border-slate-800/80 focus:outline-none focus:border-cyan-400 w-52 shadow-glass-sm"
            />
          </div>

          <div className="flex items-center space-x-1 p-1 rounded-2xl glass-card border border-slate-200/60 dark:border-slate-800/80 text-xs shadow-glass-sm">
            {[
              { id: 'all', label: 'All Nodes' },
              { id: 'safe', label: 'Safe' },
              { id: 'moderate', label: 'Moderate' },
              { id: 'unsafe', label: 'Critical' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1 rounded-xl font-medium transition text-[11px] ${
                  filterStatus === f.id
                    ? 'bg-cyan-500 text-white font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-cyan-400'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Layer Toggle */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <div className="flex items-center p-1 rounded-2xl glass-card border border-slate-200/60 dark:border-slate-800/80 text-xs shadow-glass-sm">
            <button
              onClick={() => setMapMode('markers')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-medium transition ${
                mapMode === 'markers'
                  ? 'bg-cyan-500 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-cyan-400'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Sensors View</span>
            </button>
            <button
              onClick={() => setMapMode('heatmap')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-medium transition ${
                mapMode === 'heatmap'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-rose-400'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Contamination Heatmap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="flex-1 w-full h-full">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={tileUrl}
          />

          {/* Heatmap Layer Overlays */}
          {mapMode === 'heatmap' &&
            mapStations.map((st) => {
              const contaminationIntensity = 100 - st.wqi;
              const radius = 25000 + contaminationIntensity * 900;
              const color =
                st.status === 'unsafe'
                  ? '#EF4444'
                  : st.status === 'moderate'
                  ? '#F59E0B'
                  : '#10B981';

              return (
                <React.Fragment key={`heat-${st.id}`}>
                  <Circle
                    center={[st.lat, st.lng]}
                    radius={radius}
                    pathOptions={{
                      color: 'transparent',
                      fillColor: color,
                      fillOpacity: st.status === 'unsafe' ? 0.45 : st.status === 'moderate' ? 0.3 : 0.15,
                    }}
                  />
                  <Circle
                    center={[st.lat, st.lng]}
                    radius={radius * 0.4}
                    pathOptions={{
                      color: color,
                      weight: 1.5,
                      fillColor: color,
                      fillOpacity: 0.65,
                    }}
                  />
                </React.Fragment>
              );
            })}

          {/* Markers */}
          {filteredStations.map((st) => (
            <Marker
              key={st.id}
              position={[st.lat, st.lng]}
              icon={createDropIcon(st.status, st.wqi)}
              eventHandlers={{
                click: () => {
                  setActiveStationId(st.id);
                  setInspectStation(st);
                },
              }}
            >
              <Popup>
                <div className="p-3.5 w-60 text-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider">
                      {st.type}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      st.status === 'safe'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : st.status === 'moderate'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      WQI {st.wqi}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white leading-tight mb-2">
                    {st.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-900/60 p-2 rounded-xl mb-2.5">
                    <div>
                      <span className="text-slate-400 block text-[10px]">pH</span>
                      <strong className="text-white">{st.current.pH}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Turbidity</span>
                      <strong className="text-white">{st.current.turbidity} NTU</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">DO</span>
                      <strong className="text-white">{st.current.dissolvedOxygen} mg/L</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Temp</span>
                      <strong className="text-white">{st.current.temperature} °C</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => setInspectStation(st)}
                    className="w-full py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                  >
                    Open Deep Telemetry
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-4 left-4 z-[400] glass-card rounded-2xl p-3 border border-slate-200/60 dark:border-slate-800/80 shadow-glass-md text-xs pointer-events-auto flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">Safe (WQI &gt; 80)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">Moderate (50 - 79)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">Critical (&lt; 50)</span>
        </div>
      </div>

      {/* Station Modal Slide-over */}
      <StationModal
        station={inspectStation}
        isOpen={Boolean(inspectStation)}
        onClose={() => setInspectStation(null)}
        onNavigate={onNavigate}
      />
    </div>
  );
}
