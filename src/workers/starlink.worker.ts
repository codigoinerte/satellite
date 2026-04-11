import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from 'satellite.js';

// ─── Types (duplicated to avoid cross-module issues in worker) ───────────────
interface SatelliteResult {
  id: number;
  name: string;
  lat: number;
  lng: number;
  alt: number;
  position: [number, number, number];
  velocity: number;
  inclination: number;
  period: number;
  eccentricity: number;
}

interface TLERecord {
  name: string;
  tle1: string;
  tle2: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const GM = 398600.4418;
const RE = 6371.0;
const GLOBE_RADIUS = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseTLEText(text: string): TLERecord[] {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const records: TLERecord[] = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    if (lines[i + 1]?.startsWith('1 ') && lines[i + 2]?.startsWith('2 ')) {
      records.push({ name: lines[i], tle1: lines[i + 1], tle2: lines[i + 2] });
    }
  }
  return records;
}

function latLngToVector3(lat: number, lng: number, alt: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = GLOBE_RADIUS + (alt / RE) * 0.8;
  return [
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  ];
}

function propagateRecords(records: TLERecord[], time: Date): SatelliteResult[] {
  const gmstVal = gstime(time);
  const results: SatelliteResult[] = [];

  for (const rec of records) {
    try {
      const satrec = twoline2satrec(rec.tle1, rec.tle2);
      const result = propagate(satrec, time);

      if (!result.position || typeof result.position === 'boolean') continue;

      const pos = result.position as { x: number; y: number; z: number };
      const geodetic = eciToGeodetic(pos as any, gmstVal);
      const lat = degreesLat(geodetic.latitude);
      const lng = degreesLong(geodetic.longitude);
      const alt = geodetic.height;

      if (isNaN(lat) || isNaN(lng) || isNaN(alt) || alt < 0) continue;

      const noradId = parseInt(rec.tle1.substring(2, 7).trim(), 10);
      const inclination = parseFloat(rec.tle2.substring(8, 16).trim());
      const meanMotion = parseFloat(rec.tle2.substring(52, 63).trim());
      const eccentricity = parseFloat('0.' + rec.tle2.substring(26, 33).trim());
      const velocity = Math.sqrt(GM / (RE + alt));
      const period = meanMotion > 0 ? (24 * 60) / meanMotion : 0;

      results.push({
        id: noradId,
        name: rec.name.trim(),
        lat: parseFloat(lat.toFixed(4)),
        lng: parseFloat(lng.toFixed(4)),
        alt: parseFloat(alt.toFixed(1)),
        position: latLngToVector3(lat, lng, alt),
        velocity: parseFloat(velocity.toFixed(2)),
        inclination: parseFloat(inclination.toFixed(2)),
        period: parseFloat(period.toFixed(1)),
        eccentricity: parseFloat(eccentricity.toFixed(6)),
      });
    } catch {
      // Skip invalid TLEs
    }
  }

  return results;
}

// ─── Worker message handler ──────────────────────────────────────────────────
let cachedRecords: TLERecord[] = [];

self.onmessage = (e: MessageEvent) => {
  const { type, tleText, time } = e.data;

  if (type === 'parse-and-propagate') {
    // Initial load: parse TLE text + propagate
    cachedRecords = parseTLEText(tleText);
    const results = propagateRecords(cachedRecords, new Date(time));
    self.postMessage({ type: 'result', satellites: results, total: cachedRecords.length });
  } else if (type === 'repropagate') {
    // Re-propagate cached TLEs with new time
    if (cachedRecords.length === 0) return;
    const results = propagateRecords(cachedRecords, new Date(time));
    self.postMessage({ type: 'result', satellites: results, total: cachedRecords.length });
  }
};
