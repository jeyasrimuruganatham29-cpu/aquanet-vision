import React, { createContext, useContext, useState, useEffect } from 'react';
import { STATIONS, INITIAL_ALERTS } from '../data/mockData';
import { fetchStations, fetchAlerts, fetchProcessedSummary } from '../services/apiService';
import { getDemoRole, persistDemoRole } from '../utils/demoRole';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [stations, setStations] = useState(STATIONS);
  const [activeStationId, setActiveStationId] = useState('st-1');
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [liveFeedActive, setLiveFeedActive] = useState(true);
  const [userRole, setUserRoleState] = useState(getDemoRole);
  const setUserRole = (role) => {
    if (role !== 'admin' && role !== 'analyst') return false;
    setUserRoleState(role);
    return persistDemoRole(role);
  };
  const [predictionHistory, setPredictionHistory] = useState([
    {
      id: 'pred-init-1',
      timestamp: 'Today, 10:14 AM',
      sampleName: 'Vaigai Dam Routine Audit',
      wqiScore: 94.2,
      qualityClass: 'Excellent (Grade A)',
      potabilityScore: 96,
      riskLevel: 'Low',
      confidence: 96.8
    },
    {
      id: 'pred-init-2',
      timestamp: 'Yesterday, 04:30 PM',
      sampleName: 'Hussain Sagar North Shore',
      wqiScore: 41.8,
      qualityClass: 'Poor / Polluted (Grade D)',
      potabilityScore: 22,
      riskLevel: 'Critical',
      confidence: 95.4
    }
  ]);
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [waterData, setWaterData] = useState({
    summary: { total_records: 0, states_covered: 0, districts_covered: 0, monitoring_stations: 0, rivers_covered: 0, quality_classes: {} },
    states: [],
    water_bodies: [],
    trends: [],
    satellite: [],
    records: [],
  });

  // Active station object
  const activeStation = stations.find((s) => s.id === activeStationId) || stations[0];

  // Active unread alerts
  const unreadAlertCount = alerts.filter((a) => a.status === 'active').length;

  const addToast = (toast) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    const newToast = { id, type: 'info', ...toast };
    setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const resolveAlert = (alertId) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'resolved' } : a))
    );
    addToast({
      type: 'safe',
      title: 'Alert Resolved',
      message: 'Status updated across all regional telemetry consoles.'
    });
  };

  const dismissAlert = (alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    addToast({
      type: 'info',
      title: 'Alert Dismissed',
      message: 'Alert archived to historical telemetry registry.'
    });
  };

  const addPredictionToHistory = (pred) => {
    setPredictionHistory((prev) => [
      {
        id: 'pred-' + Date.now(),
        timestamp: 'Just now',
        sampleName: pred.sampleName || 'User Sample Analysis',
        ...pred
      },
      ...prev.slice(0, 9)
    ]);
  };

  // Play an alert sound using WebAudio API
  const playAlertSound = (opts = { tone: 'sine', duration: 0.25, volume: 0.3 }) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = opts.tone || 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      g.gain.setValueAtTime(opts.volume || 0.3, ctx.currentTime);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        try { ctx.close(); } catch (e) {}
      }, (opts.duration || 0.25) * 1000);
    } catch (e) {
      // fallback: try to play simple beep using HTMLAudioElement and small data URI
      try {
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
        audio.volume = opts.volume || 0.3;
        audio.play().catch(() => {});
      } catch (e2) {}
    }
  };

  // Add an alert and optionally play sound
  const addAlert = (alert) => {
    setAlerts((prev) => [alert, ...prev]);
    if (soundEnabled && alert && (alert.severity === 'critical' || alert.severity === 'warning')) {
      playAlertSound({ tone: 'sawtooth', duration: 0.33, volume: 0.35 });
    }
    addToast({ type: alert.severity === 'critical' ? 'unsafe' : 'warning', title: alert.title, message: alert.message });
  };

  // Auto-refresh simulation for the active station
  useEffect(() => {
    if (!liveFeedActive) return;

    const interval = setInterval(() => {
      setStations((prev) =>
        prev.map((st) => {
          if (
            st.id !== activeStationId ||
            !st.current ||
            !Array.isArray(st.miniSparkline) ||
            !['pH', 'turbidity', 'temperature', 'dissolvedOxygen'].every((key) => Number.isFinite(st.current[key]))
          ) return st;

          // Tiny random sensor jitter
          const phDelta = (Math.random() - 0.5) * 0.04;
          const turbDelta = (Math.random() - 0.5) * 0.15;
          const tempDelta = (Math.random() - 0.5) * 0.1;
          const doDelta = (Math.random() - 0.5) * 0.06;

          const updatedPh = Math.round((st.current.pH + phDelta) * 100) / 100;
          const updatedTurb = Math.max(0.2, Math.round((st.current.turbidity + turbDelta) * 10) / 10);
          const updatedTemp = Math.round((st.current.temperature + tempDelta) * 10) / 10;
          const updatedDo = Math.max(0.5, Math.round((st.current.dissolvedOxygen + doDelta) * 10) / 10);

          const updatedSpark = [...st.miniSparkline.slice(1), st.wqi];

          return {
            ...st,
            lastSync: 'Just now',
            current: {
              ...st.current,
              pH: updatedPh,
              turbidity: updatedTurb,
              temperature: updatedTemp,
              dissolvedOxygen: updatedDo
            },
            miniSparkline: updatedSpark
          };
        })
      );
    }, 4500);

    return () => clearInterval(interval);
  }, [liveFeedActive, activeStationId]);

  // Fetch stations and alerts from backend on mount and poll periodically
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const remoteStations = await fetchStations();
        if (mounted && Array.isArray(remoteStations) && remoteStations.length) {
          setStations(remoteStations);
          // ensure activeStationId exists in new list
          if (!remoteStations.find((s) => s.id === activeStationId)) {
            setActiveStationId(remoteStations[0]?.id || activeStationId);
          }
        }

        const remoteAlerts = await fetchAlerts();
        if (mounted && Array.isArray(remoteAlerts) && remoteAlerts.length) {
          setAlerts(remoteAlerts);
        }

        const processedSummary = await fetchProcessedSummary();
        if (mounted && processedSummary?.summary) {
          setWaterData(processedSummary);
          if (processedSummary.water_bodies?.length) {
            const processedStations = processedSummary.water_bodies.map((body, index) => ({
              id: `cpcb-${body.station}-${index}`,
              name: body.station,
              type: 'CPCB monitoring station',
              region: `${body.district}, ${body.state}`,
              state: body.state,
              lat: Number(body.latitude),
              lng: Number(body.longitude),
              status: body.status,
              statusText: body.status,
              wqi: Number(body.water_quality_score || 0),
              potabilityScore: Number(body.water_quality_score || 0),
              riskLevel: body.status === 'safe' ? 'Low' : body.status === 'moderate' ? 'Medium' : 'High',
              lastSync: 'Processed CPCB dataset',
              hardware: 'CPCB observation',
              battery: 100,
              signalDbm: 0,
              current: { pH: '—', turbidity: '—', temperature: '—', dissolvedOxygen: '—', tds: '—', conductivity: '—', ndwi: '—', ndci: '—', ndti: '—' },
              miniSparkline: [Number(body.water_quality_score || 0)],
            }));
            setStations(processedStations);
          }
        }
      } catch (err) {
        // keep using mock data
        console.warn('Failed to fetch stations/alerts from backend, using mocks', err);
      }
    };

    load();
    const poll = setInterval(load, 30000); // refresh every 30s
    return () => {
      mounted = false;
      clearInterval(poll);
    };
  }, [activeStationId]);

  return (
    <AppContext.Provider
      value={{
        stations,
        setStations,
        activeStationId,
        setActiveStationId,
        activeStation,
        alerts,
        unreadAlertCount,
        resolveAlert,
        dismissAlert,
        addAlert,
        liveFeedActive,
        setLiveFeedActive,
        userRole,
        setUserRole,
        predictionHistory,
        addPredictionToHistory,
        toasts,
        addToast,
        removeToast,
        soundEnabled,
        setSoundEnabled,
        waterData,
        currentUser: {
          name: 'Demo Operator',
          roleTitle: userRole === 'admin' ? 'Administrator demo role' : 'Analyst demo role',
          department: 'Dept of Computer Science & Engineering',
          institution: 'AquaNet Vision Operations',
          team: 'AquaNet Vision',
          email: 'No authenticated identity configured'
        }
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
