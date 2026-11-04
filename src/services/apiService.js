import { STATIONS, INITIAL_ALERTS } from '../data/mockData';
import { getDemoRoleHeaders } from '../utils/demoRole';

// Simulated network latency for local fallback
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function requestApi(url, options = {}) {
  const headers = {
    ...getDemoRoleHeaders(),
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };
  const response = await fetch(url, { ...options, headers });
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error(`The API returned an unreadable response (HTTP ${response.status}).`);
  }
  if (!response.ok || payload?.success === false) {
    throw new Error(payload?.error || `Request failed (HTTP ${response.status}).`);
  }
  return payload;
}

export async function fetchEmergencyAlerts() {
  return requestApi('/api/v1/emergency/alerts');
}

export async function fetchEmergencyAlertDetails(alertId) {
  return requestApi(`/api/v1/emergency/alerts/${encodeURIComponent(alertId)}`);
}

export async function updateEmergencyAlert(alertId, draft) {
  return requestApi(`/api/v1/emergency/alerts/${encodeURIComponent(alertId)}`, {
    method: 'PATCH',
    body: JSON.stringify(draft),
  });
}

export async function fetchEmergencyRecipients() {
  return requestApi('/api/v1/emergency/recipients');
}

export async function createEmergencyAlert(draft) {
  return requestApi('/api/v1/emergency/alerts', {
    method: 'POST',
    body: JSON.stringify(draft),
  });
}

export async function previewEmergencyAlert(alertId) {
  return requestApi(`/api/v1/emergency/alerts/${encodeURIComponent(alertId)}/preview`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function approveEmergencyAlert(alertId) {
  return requestApi(`/api/v1/emergency/alerts/${encodeURIComponent(alertId)}/approve`, {
    method: 'POST',
    body: JSON.stringify({ verified: true }),
  });
}

export async function simulateEmergencyAlertSend(alertId, confirmation) {
  return requestApi(`/api/v1/emergency/alerts/${encodeURIComponent(alertId)}/send`, {
    method: 'POST',
    body: JSON.stringify(confirmation),
  });
}

export async function cancelEmergencyAlert(alertId) {
  return requestApi(`/api/v1/emergency/alerts/${encodeURIComponent(alertId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function addEmergencyRecipient(recipient) {
  return requestApi('/api/v1/emergency/recipients', {
    method: 'POST',
    body: JSON.stringify(recipient),
  });
}

export async function deleteEmergencyRecipient(recipientId) {
  return requestApi(`/api/v1/emergency/recipients/${encodeURIComponent(recipientId)}`, {
    method: 'DELETE',
  });
}

async function _postJson(url, body, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(id);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(id);
  }
}

/**
 * Predict water quality using backend when available, otherwise fall back to local heuristic.
 */
export async function predictWaterQuality(params) {
  // Try backend first
  try {
    const resp = await _postJson('/api/predict', params, 7000);
    if (!resp || typeof resp !== 'object' || resp.success === false) {
      throw new Error(resp?.error || 'Backend returned an invalid prediction response');
    }

    const prediction = resp.prediction ?? resp;
    if (!prediction || typeof prediction !== 'object' || Array.isArray(prediction)) {
      throw new Error('Backend response did not contain a prediction object');
    }

    const riskLevel = prediction.riskLevel ?? prediction.pollutionRisk ?? null;
    const badgeByRisk = {
      Low: 'safe',
      Medium: 'moderate',
      High: 'unsafe',
      Critical: 'unsafe',
    };

    return {
      ...prediction,
      riskLevel,
      badgeColor: ['safe', 'moderate', 'unsafe'].includes(prediction.badgeColor)
        ? prediction.badgeColor
        : badgeByRisk[riskLevel] ?? null,
    };
  } catch (err) {
    console.warn('Backend /api/predict failed, falling back to local heuristic', err);
  }

  // Local heuristic fallback (original logic)
  await delay(200);
  const { pH, turbidity, temperature, dissolvedOxygen, tds, conductivity } = params;
  let wqiScore = 100;
  const phDev = Math.abs(pH - 7.0);
  if (phDev > 1.5) wqiScore -= (phDev - 1.5) * 18;
  if (turbidity > 5) wqiScore -= Math.min(35, (turbidity - 5) * 0.9);
  if (dissolvedOxygen < 6.5) wqiScore -= (6.5 - dissolvedOxygen) * 8.5;
  else wqiScore += Math.min(5, (dissolvedOxygen - 6.5) * 1.5);
  if (tds > 500) wqiScore -= Math.min(25, ((tds - 500) / 100) * 2.2);
  if (conductivity > 800) wqiScore -= Math.min(20, ((conductivity - 800) / 150) * 1.8);
  wqiScore = Math.max(12, Math.min(99.4, Math.round(wqiScore * 10) / 10));
  const potability = Math.max(5, Math.min(98, Math.round((wqiScore * 0.7) + (dissolvedOxygen > 6 ? 15 : -15) - (turbidity > 10 ? 25 : 0) - (pH < 6.5 || pH > 8.5 ? 20 : 0))));

  let qualityClass = 'Good';
  let riskLevel = 'Low';
  let badgeColor = 'safe';
  let recommendation = '';
  if (wqiScore >= 85) {
    qualityClass = 'Excellent (Grade A)';
    riskLevel = 'Low';
    badgeColor = 'safe';
    recommendation = 'Water quality meets WHO and CPCB drinking/potable standards.';
  } else if (wqiScore >= 70) {
    qualityClass = 'Good (Grade B)';
    riskLevel = 'Low';
    badgeColor = 'safe';
    recommendation = 'Conventional filtration and chlorination recommended prior to drinking.';
  } else if (wqiScore >= 50) {
    qualityClass = 'Fair / Moderate (Grade C)';
    riskLevel = 'Medium';
    badgeColor = 'moderate';
    recommendation = 'Requires treatment for drinking; permissible for irrigation.';
  } else if (wqiScore >= 35) {
    qualityClass = 'Poor / Polluted (Grade D)';
    riskLevel = 'High';
    badgeColor = 'unsafe';
    recommendation = 'Not suitable for untreated human contact. Investigate pollutant sources.';
  } else {
    qualityClass = 'Severe Contamination (Grade E)';
    riskLevel = 'Critical';
    badgeColor = 'unsafe';
    recommendation = 'CRITICAL ALERT: Hazardous conditions detected.';
  }

  return {
    timestamp: new Date().toISOString(),
    inputParams: params,
    wqiScore,
    potabilityScore: potability,
    qualityClass,
    riskLevel,
    badgeColor,
    recommendation,
  };
}

export async function fetchStations() {
  try {
    const res = await fetch('/api/dashboard');
    if (res.ok) {
      const js = await res.json();
      return js.stations || js.data || STATIONS;
    }
  } catch (err) {
    console.warn('Failed to fetch /api/dashboard, falling back to /api/v1/stations or mock', err);
  }

  try {
    const res2 = await fetch('/api/v1/stations');
    if (res2.ok) {
      const js2 = await res2.json();
      return js2.data || STATIONS;
    }
  } catch (err) {
    console.warn('Failed to fetch /api/v1/stations, using local mock', err);
  }

  await delay(150);
  return STATIONS;
}

export async function fetchAlerts() {
  try {
    const res = await fetch('/api/v1/alerts');
    if (res.ok) {
      const js = await res.json();
      return js.alerts || INITIAL_ALERTS;
    }
  } catch (err) {
    console.warn('Failed to fetch /api/v1/alerts, using local mock', err);
  }

  await delay(120);
  return INITIAL_ALERTS;
}

export async function fetchProcessedSummary() {
  try {
    const response = await fetch('/api/processed-summary');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    if (!payload.satellite?.length) {
      payload.satellite = STATIONS.filter((station) => station.current?.ndwi !== undefined).map((station) => ({
        station_id: station.id,
        timestamp: new Date().toISOString(),
        ndwi: station.current.ndwi,
        ndci: station.current.ndci,
        ndti: station.current.ndti,
        latitude: station.lat,
        longitude: station.lng,
      }));
    }
    return payload;
  } catch (error) {
    console.warn('Processed dataset API unavailable, using station summary fallback', error);
    const states = [...new Set(STATIONS.map((station) => station.state).filter(Boolean))];
    return {
      success: false,
      summary: {
        total_records: STATIONS.length,
        states_covered: states.length,
        districts_covered: 0,
        monitoring_stations: STATIONS.length,
        rivers_covered: 0,
        quality_classes: STATIONS.reduce((result, station) => {
          const quality = station.wqi >= 80 ? 'Excellent' : station.wqi >= 60 ? 'Good' : station.wqi >= 40 ? 'Moderate' : 'Poor';
          result[quality] = (result[quality] || 0) + 1;
          return result;
        }, {}),
      },
      states: [],
      water_bodies: [],
      trends: [],
      records: [],
      satellite: STATIONS.filter((station) => station.current?.ndwi !== undefined).map((station) => ({
        station_id: station.id,
        timestamp: new Date().toISOString(),
        ndwi: station.current.ndwi,
        ndci: station.current.ndci,
        ndti: station.current.ndti,
        latitude: station.lat,
        longitude: station.lng,
      })),
    };
  }
}

export async function fetchModelResults() {
  const response = await fetch('/api/model-results');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function fetchFeatureImportance() {
  const response = await fetch('/api/feature-importance');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}
