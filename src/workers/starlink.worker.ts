import {
  json2satrec,
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

interface OmmRecord {
  NORAD_CAT_ID: number;
  OBJECT_NAME: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
  CLASSIFICATION_TYPE: 'U' | 'C';
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  OBJECT_ID: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const GM = 398600.4418;
const RE = 6371.0;
const GLOBE_RADIUS = 5;

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function propagateRecords(records: OmmRecord[], time: Date): SatelliteResult[] {
  const gmstVal = gstime(time);
  const results: SatelliteResult[] = [];

  for (const rec of records) {
    try {
      const satrec = json2satrec(rec as Parameters<typeof json2satrec>[0]);
      const result = propagate(satrec, time);

      if (!result.position || typeof result.position === 'boolean') continue;

      const pos = result.position as { x: number; y: number; z: number };
      const geodetic = eciToGeodetic(pos as any, gmstVal);
      const lat = degreesLat(geodetic.latitude);
      const lng = degreesLong(geodetic.longitude);
      const alt = geodetic.height;

      if (isNaN(lat) || isNaN(lng) || isNaN(alt) || alt < 0) continue;

      const velocity = Math.sqrt(GM / (RE + alt));
      const period = rec.MEAN_MOTION > 0 ? (24 * 60) / rec.MEAN_MOTION : 0;

      results.push({
        id: rec.NORAD_CAT_ID,
        name: rec.OBJECT_NAME.trim(),
        lat: parseFloat(lat.toFixed(4)),
        lng: parseFloat(lng.toFixed(4)),
        alt: parseFloat(alt.toFixed(1)),
        position: latLngToVector3(lat, lng, alt),
        velocity: parseFloat(velocity.toFixed(2)),
        inclination: parseFloat(rec.INCLINATION.toFixed(2)),
        period: parseFloat(period.toFixed(1)),
        eccentricity: parseFloat(rec.ECCENTRICITY.toFixed(6)),
      });
    } catch {
      // Skip invalid records
    }
  }

  return results;
}

// ─── Worker message handler ──────────────────────────────────────────────────
let cachedRecords: OmmRecord[] = [];

self.onmessage = (e: MessageEvent) => {
  const { type, satellites, time } = e.data;

  if (type === 'parse-and-propagate') {
    cachedRecords = satellites as OmmRecord[];
    const results = propagateRecords(cachedRecords, new Date(time));
    self.postMessage({ type: 'result', satellites: results, total: cachedRecords.length });
  } else if (type === 'repropagate') {
    if (cachedRecords.length === 0) return;
    const results = propagateRecords(cachedRecords, new Date(time));
    self.postMessage({ type: 'result', satellites: results, total: cachedRecords.length });
  }
};
