import axios from 'axios';
import {
  json2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from 'satellite.js';
import type { Satellite3D, OrbitType, SatelliteEvent, CelesTrakGP } from '../types/satellite';


// ─── Country lookup by NORAD ID ───────────────────────────────────────────────
const COUNTRY_MAP: Record<number, { country: string; code: string }> = {
  25544:  { country: 'International', code: 'un' },
  54216:  { country: 'China',         code: 'cn' },
  48274:  { country: 'United States', code: 'us' },
  48275:  { country: 'United States', code: 'us' },
  43226:  { country: 'United States', code: 'us' },
  43228:  { country: 'United States', code: 'us' },
  25338:  { country: 'Russia',        code: 'ru' },
  28654:  { country: 'United States', code: 'us' },
  40889:  { country: 'United States', code: 'us' },
  37753:  { country: 'India',         code: 'in' },
  40697:  { country: 'European Union',code: 'eu' },
  38771:  { country: 'European Union',code: 'eu' },
  43437:  { country: 'European Union',code: 'eu' },
  27424:  { country: 'Russia',        code: 'ru' },
  39634:  { country: 'Brazil',        code: 'br' },
  36508:  { country: 'Japan',         code: 'jp' },
  20580:  { country: 'United States', code: 'us' }, // Hubble
  25994:  { country: 'United States', code: 'us' }, // Terra
  27436:  { country: 'United States', code: 'us' }, // Aqua
  33591:  { country: 'United States', code: 'us' }, // NOAA-19
};

const guessCountry = (id: number, name: string): { country: string; code: string } => {
  if (COUNTRY_MAP[id]) return COUNTRY_MAP[id];
  const n = name.toUpperCase();
  if (n.includes('STARLINK') || n.includes('NAVSTAR') || n.includes('GPS') || n.includes('USA'))
    return { country: 'United States', code: 'us' };
  if (n.includes('COSMOS') || n.includes('GLONASS'))
    return { country: 'Russia', code: 'ru' };
  if (n.includes('BEIDOU') || n.includes('TIANHE') || n.includes('FENGYUN'))
    return { country: 'China', code: 'cn' };
  if (n.includes('GALILEO') || n.includes('SENTINEL'))
    return { country: 'European Union', code: 'eu' };
  if (n.includes('IRNSS') || n.includes('CARTOSAT') || n.includes('RESOURCESAT'))
    return { country: 'India', code: 'in' };
  return { country: 'Unknown', code: 'un' };
};

// ─── Orbital mechanics helpers ────────────────────────────────────────────────
const GM = 398600.4418; // km³/s²
const RE = 6371.0;      // Earth radius km

export const getOrbitType = (alt: number): OrbitType => {
  if (alt < 2000)  return 'LEO';
  if (alt < 35586) return 'MEO';
  if (alt < 35986) return 'GEO';
  return 'HEO';
};

const orbitalVelocity = (altKm: number): number =>
  Math.sqrt(GM / (RE + altKm));

const orbitalPeriod = (meanMotion: number): number =>
  meanMotion > 0 ? (24 * 60) / meanMotion : 0; // minutes

// ─── 3D position conversion ───────────────────────────────────────────────────
export const latLngToVector3 = (
  lat: number,
  lng: number,
  alt: number,
  radius = 5
): [number, number, number] => {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r     = radius + (alt / RE) * 0.8;
  return [
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  ];
};

// ─── Propagate OMM record to current position ────────────────────────────────
const propagateNow = (
  gp: CelesTrakGP
): { lat: number; lng: number; alt: number } | null => {
  try {
    const classType = (gp.CLASSIFICATION_TYPE === 'S' ? 'U' : gp.CLASSIFICATION_TYPE) as 'U' | 'C' | undefined;
    const satrec = json2satrec({ ...gp, CLASSIFICATION_TYPE: classType });
    const now    = new Date();
    const result = propagate(satrec, now);

    if (!result.position || typeof result.position === 'boolean') return null;

    const gmst     = gstime(now);
    const geodetic = eciToGeodetic(result.position as any, gmst);

    return {
      lat: degreesLat(geodetic.latitude),
      lng: degreesLong(geodetic.longitude),
      alt: geodetic.height,
    };
  } catch {
    return null;
  }
};

// ─── Build Satellite3D from CelesTrak GP record ───────────────────────────────
const buildSatellite = (gp: CelesTrakGP): Satellite3D | null => {
  const pos = propagateNow(gp);
  if (!pos || isNaN(pos.lat) || isNaN(pos.alt)) return null;

  const { country, code } = guessCountry(gp.NORAD_CAT_ID, gp.OBJECT_NAME);
  const alt        = Math.max(0, pos.alt);
  const velocity   = orbitalVelocity(alt);
  const period     = orbitalPeriod(gp.MEAN_MOTION);
  const orbitType  = getOrbitType(alt);

  return {
    id:           gp.NORAD_CAT_ID,
    name:         gp.OBJECT_NAME.trim(),
    cosparId:     gp.OBJECT_ID ?? '',
    position:     latLngToVector3(pos.lat, pos.lng, alt),
    velocity:     parseFloat(velocity.toFixed(2)),
    country,
    countryCode:  code,
    lat:          parseFloat(pos.lat.toFixed(4)),
    lng:          parseFloat(pos.lng.toFixed(4)),
    alt:          parseFloat(alt.toFixed(1)),
    inclination:  parseFloat(gp.INCLINATION.toFixed(2)),
    period:       parseFloat(period.toFixed(1)),
    eccentricity: parseFloat(gp.ECCENTRICITY.toFixed(6)),
    orbitType,
  };
};

// ─── CelesTrak GP API via allorigins CORS proxy ───────────────────────────────
const CELESTRAK_GP = 'https://celestrak.org/NORAD/elements/gp.php';
const ALLORIGINS = 'https://api.allorigins.win/raw?url=';

// 6 groups that cover the most visually interesting satellite types.
// Kept intentionally small to avoid rate-limiting on the allorigins proxy.
const CELESTRAK_GROUPS = [
  'stations',        // ISS, CSS (Tianhe)
  'weather',         // NOAA, GOES, MetOp
  'gps-ops',         // GPS Block III/IIF
  'science',         // Hubble, TERRA, AQUA, Chandra
  'earth-resources', // Landsat, Sentinel
  'glo-ops',         // GLONASS
];

// ─── localStorage cache (2-hour TTL) ─────────────────────────────────────────
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const CACHE_PREFIX = 'sattrack:celestrak:';

const readCache = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw) as { data: T; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
};

const writeCache = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // Quota exceeded or disabled — silently ignore
  }
};

// ─── Sequential fetch with delay — avoids rate-limiting on allorigins ────────
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const runSequential = async <T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  pauseMs = 300,
): Promise<PromiseSettledResult<R>[]> => {
  const out: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) await delay(pauseMs);
    const result = await Promise.allSettled([worker(items[i])]);
    out.push(result[0]);
  }
  return out;
};

const fetchCelesTrakGroup = async (group: string): Promise<CelesTrakGP[]> => {
  const cached = readCache<CelesTrakGP[]>(`group:${group}`);
  if (cached) return cached;

  const innerUrl = `${CELESTRAK_GP}?GROUP=${group}&FORMAT=JSON`;
  const url = `${ALLORIGINS}${encodeURIComponent(innerUrl)}`;
  const res = await axios.get<CelesTrakGP[]>(url, { timeout: 20000 });
  const records = res.data || [];

  writeCache(`group:${group}`, records);
  return records;
};

// ─── Main: fetch satellites from CelesTrak ───────────────────────────────────
export const fetchSatellites = async (): Promise<Satellite3D[]> => {
  const seen = new Set<number>();
  const allGP: CelesTrakGP[] = [];

  // Batch of 3 to avoid rate-limiting on cold cache
  const results = await runSequential(CELESTRAK_GROUPS, fetchCelesTrakGroup);

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const gp of result.value) {
        if (!seen.has(gp.NORAD_CAT_ID)) {
          seen.add(gp.NORAD_CAT_ID);
          allGP.push(gp);
        }
      }
    }
  }

  if (allGP.length === 0) {
    console.warn('CelesTrak unreachable — using mock data');
    return getMockSatellites();
  }

  const satellites: Satellite3D[] = [];
  for (const gp of allGP) {
    const sat = buildSatellite(gp);
    if (sat) satellites.push(sat);
  }

  return satellites.length > 0 ? satellites : getMockSatellites();
};

// ─── Fallback mock data (same structure, no API needed) ───────────────────────
const MOCK_CATALOG = [
  { id: 25544,  name: 'ISS (ZARYA)',          country: 'International',  code: 'un', alt: 408,    inc: 51.64, mmo: 15.49 },
  { id: 54216,  name: 'CSS (TIANHE)',          country: 'China',          code: 'cn', alt: 390,    inc: 41.47, mmo: 15.61 },
  { id: 48274,  name: 'STARLINK-1007',         country: 'United States',  code: 'us', alt: 550,    inc: 53.0,  mmo: 15.06 },
  { id: 33591,  name: 'NOAA-19',               country: 'United States',  code: 'us', alt: 870,    inc: 98.74, mmo: 14.22 },
  { id: 28654,  name: 'GPS IIR-17 (PRN 12)',   country: 'United States',  code: 'us', alt: 20200,  inc: 55.04, mmo:  2.01 },
  { id: 40890,  name: 'GALILEO 13 (GSAT0213)', country: 'European Union', code: 'eu', alt: 23222,  inc: 56.06, mmo:  1.71 },
  { id: 38771,  name: 'SENTINEL-3A',           country: 'European Union', code: 'eu', alt: 814,    inc: 98.62, mmo: 14.27 },
  { id: 20580,  name: 'HST (HUBBLE)',           country: 'United States',  code: 'us', alt: 535,    inc: 28.47, mmo: 15.09 },
  { id: 25994,  name: 'TERRA',                 country: 'United States',  code: 'us', alt: 705,    inc: 98.21, mmo: 14.57 },
  { id: 27436,  name: 'AQUA',                  country: 'United States',  code: 'us', alt: 709,    inc: 98.21, mmo: 14.57 },
  { id: 36508,  name: 'TANDEM-X',              country: 'Germany',        code: 'de', alt: 514,    inc: 97.44, mmo: 15.19 },
  { id: 39634,  name: 'LANDSAT 8',             country: 'United States',  code: 'us', alt: 705,    inc: 98.22, mmo: 14.57 },
  { id: 43226,  name: 'STARLINK-1130',         country: 'United States',  code: 'us', alt: 550,    inc: 53.0,  mmo: 15.06 },
  { id: 43437,  name: 'SENTINEL-6A',           country: 'European Union', code: 'eu', alt: 1336,   inc: 66.0,  mmo: 12.80 },
  { id: 27421,  name: 'XMM-NEWTON',            country: 'European Union', code: 'eu', alt: 108000, inc: 40.0,  mmo:  0.57 },
  { id: 26900,  name: 'GOES-12',               country: 'United States',  code: 'us', alt: 35786,  inc: 0.1,   mmo:  1.00 },
  { id: 41838,  name: 'GOES-16',               country: 'United States',  code: 'us', alt: 35786,  inc: 0.05,  mmo:  1.00 },
  { id: 25338,  name: 'COSMOS 2307',           country: 'Russia',         code: 'ru', alt: 19100,  inc: 65.09, mmo:  2.13 },
  { id: 40697,  name: 'RESOURCESAT-2A',        country: 'India',          code: 'in', alt: 817,    inc: 98.72, mmo: 14.24 },
];

export const getMockSatellites = (): Satellite3D[] => {
  const total = MOCK_CATALOG.length;
  return MOCK_CATALOG.map((sat, i) => {
    const angle    = (i / total) * Math.PI * 2;
    const tilt     = (sat.inc * Math.PI) / 180;
    const r        = 5 + (sat.alt / 6371) * 0.8;
    const orbitType = getOrbitType(sat.alt);
    const velocity  = parseFloat(orbitalVelocity(sat.alt).toFixed(2));
    const period    = parseFloat(orbitalPeriod(sat.mmo).toFixed(1));
    const lat       = parseFloat((Math.sin(tilt) * 90 * Math.sin(angle)).toFixed(4));
    const lng       = parseFloat(((angle * 180 / Math.PI) % 360 - 180).toFixed(4));

    return {
      id:           sat.id,
      name:         sat.name,
      cosparId:     '',
      position:     [
        Math.cos(angle) * r * Math.cos(tilt),
        Math.sin(tilt)  * r * Math.sin(angle),
        Math.sin(angle) * r * Math.cos(tilt),
      ],
      velocity,
      country:      sat.country,
      countryCode:  sat.code,
      lat,
      lng,
      alt:          sat.alt,
      inclination:  sat.inc,
      period,
      eccentricity: 0.0001,
      orbitType,
    };
  });
};

// ─── NASA event types ─────────────────────────────────────────────────────────

const NASA_API_KEY = import.meta.env.VITE_NASA_API_KEY ?? 'DEMO_KEY';

const DONKI_TYPE_MAP: Record<string, { type: SatelliteEvent['type']; label: string }> = {
  CME:  { type: 'solar',     label: 'Eyección solar (CME)' },
  GST:  { type: 'storm',     label: 'Tormenta geomagnética' },
  IPS:  { type: 'solar',     label: 'Choque interplanetario' },
  FLR:  { type: 'solar',     label: 'Llamarada solar' },
  SEP:  { type: 'radiation', label: 'Partículas energéticas solares' },
  MPC:  { type: 'radiation', label: 'Magnetopausa cruzada' },
  RBE:  { type: 'radiation', label: 'Alerta cinturón de radiación' },
  HSS:  { type: 'solar',     label: 'Corriente solar de alta velocidad' },
};

const EONET_TYPE_MAP: Record<string, { type: SatelliteEvent['type']; label: string }> = {
  'Wildfires':     { type: 'fire',  label: 'Incendio detectado' },
  'Severe Storms': { type: 'storm', label: 'Tormenta severa' },
  'Volcanoes':     { type: 'fire',  label: 'Actividad volcánica' },
  'Sea and Lake Ice': { type: 'eonet', label: 'Evento de hielo' },
  'Earthquakes':   { type: 'eonet', label: 'Sismo detectado' },
  'Floods':        { type: 'storm', label: 'Inundación' },
  'Landslides':    { type: 'eonet', label: 'Deslizamiento' },
};

// ─── Fetch real events from NASA DONKI + EONET ───────────────────────────────
export const fetchNasaEvents = async (): Promise<SatelliteEvent[]> => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().substring(0, 10);

  const events: SatelliteEvent[] = [];

  // ─── DONKI (space weather) ──────────────────────────────────────────────
  try {
    const donkiUrl = `https://api.nasa.gov/DONKI/notifications?startDate=${fmt(weekAgo)}&endDate=${fmt(now)}&type=all&api_key=${NASA_API_KEY}`;
    const donkiRes = await axios.get<Array<{
      messageType: string;
      messageIssueTime: string;
      messageURL: string;
      messageBody: string;
    }>>(donkiUrl, { timeout: 10000 });

    for (const n of donkiRes.data.slice(0, 8)) {
      const mapping = DONKI_TYPE_MAP[n.messageType] || { type: 'solar' as const, label: n.messageType };
      const time = new Date(n.messageIssueTime);
      const summary = n.messageBody?.substring(0, 80).replace(/\n/g, ' ').trim() || '';

      events.push({
        id: `donki-${n.messageType}-${time.getTime()}`,
        type: mapping.type,
        title: mapping.label,
        meta: `${summary}…`,
        time,
        url: n.messageURL,
      });
    }
  } catch (err) {
    console.warn('DONKI fetch failed:', err);
  }

  // ─── EONET (natural events observed by satellites) ──────────────────────
  try {
    const eonetUrl = `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=6`;
    const eonetRes = await axios.get<{
      events: Array<{
        id: string;
        title: string;
        categories: Array<{ title: string }>;
        sources: Array<{ url: string }>;
        geometry: Array<{ date: string }>;
      }>;
    }>(eonetUrl, { timeout: 10000 });

    for (const e of eonetRes.data.events) {
      const catTitle = e.categories[0]?.title || '';
      const mapping = EONET_TYPE_MAP[catTitle] || { type: 'eonet' as const, label: catTitle };
      const lastGeom = e.geometry[e.geometry.length - 1];
      const time = lastGeom ? new Date(lastGeom.date) : now;
      const sourceUrl = e.sources[0]?.url || '';

      events.push({
        id: `eonet-${e.id}`,
        type: mapping.type,
        title: `${mapping.label}`,
        meta: e.title,
        time,
        url: sourceUrl,
      });
    }
  } catch (err) {
    console.warn('EONET fetch failed:', err);
  }

  // Sort by most recent first
  events.sort((a, b) => b.time.getTime() - a.time.getTime());

  return events;
};

// ─── Stats summary ────────────────────────────────────────────────────────────
export const calcStats = (satellites: Satellite3D[]) => ({
  total:   satellites.length,
  leo:     satellites.filter(s => s.orbitType === 'LEO').length,
  meo:     satellites.filter(s => s.orbitType === 'MEO').length,
  geo:     satellites.filter(s => s.orbitType === 'GEO').length,
  heo:     satellites.filter(s => s.orbitType === 'HEO').length,
  agencies: new Set(satellites.map(s => s.country)).size,
});

// ─── Starlink ─────────────────────────────────────────────────────────────────

export interface StarlinkRegion {
  id: string;
  name: string;
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

export const STARLINK_REGIONS: StarlinkRegion[] = [
  { id: 'all',        name: 'Global',         latMin: -90,  latMax: 90,   lngMin: -180, lngMax: 180 },
  { id: 'south-am',   name: 'Sudamérica',     latMin: -56,  latMax: 13,   lngMin: -82,  lngMax: -34 },
  { id: 'central-am', name: 'Centroamérica',  latMin: 7,    latMax: 23,   lngMin: -92,  lngMax: -60 },
  { id: 'north-am',   name: 'Norteamérica',   latMin: 23,   latMax: 72,   lngMin: -170, lngMax: -50 },
  { id: 'europe',     name: 'Europa',         latMin: 35,   latMax: 72,   lngMin: -12,  lngMax: 45  },
  { id: 'asia',       name: 'Asia',           latMin: 0,    latMax: 75,   lngMin: 45,   lngMax: 180 },
  { id: 'africa',     name: 'África',         latMin: -35,  latMax: 37,   lngMin: -18,  lngMax: 52  },
  { id: 'oceania',    name: 'Oceanía',        latMin: -50,  latMax: 0,    lngMin: 110,  lngMax: 180 },
];

// ─── Simulated Starlink constellation (fallback when API is unreachable) ──────
// Shell 1 parameters: 550km, 53° inclination, 72 planes × 22 sats = 1584 sats
// Positions are evenly distributed, not actual live locations.
const generateSimulatedStarlink = (): CelesTrakGP[] => {
  const PLANES = 36;
  const SATS_PER_PLANE = 22;
  const epoch = new Date().toISOString().slice(0, 23);
  const sats: CelesTrakGP[] = [];
  let noradId = 90000;

  for (let p = 0; p < PLANES; p++) {
    const raan = (p / PLANES) * 360;
    for (let s = 0; s < SATS_PER_PLANE; s++) {
      sats.push({
        OBJECT_NAME:       `STARLINK-S${p}-${s}`,
        OBJECT_ID:         `2019-074A`,
        NORAD_CAT_ID:      noradId++,
        EPOCH:             epoch,
        MEAN_MOTION:       15.055,     // rev/day → ~550km
        ECCENTRICITY:      0.0001,
        INCLINATION:       53.0,
        RA_OF_ASC_NODE:    raan,
        ARG_OF_PERICENTER: 0,
        MEAN_ANOMALY:      (s / SATS_PER_PLANE) * 360,
        CLASSIFICATION_TYPE: 'U',
        ELEMENT_SET_NO:    999,
        REV_AT_EPOCH:      0,
        BSTAR:             0.0001,
        MEAN_MOTION_DOT:   0,
        MEAN_MOTION_DDOT:  0,
      });
    }
  }
  return sats;
};

export const fetchStarlinkGP = async (): Promise<CelesTrakGP[]> => {
  const cached = readCache<CelesTrakGP[]>('starlink:gp');
  if (cached) return cached;

  try {
    const innerUrl = `${CELESTRAK_GP}?GROUP=starlink&FORMAT=JSON`;
    const url = `${ALLORIGINS}${encodeURIComponent(innerUrl)}`;
    const res = await axios.get<CelesTrakGP[]>(url, { timeout: 15000 });
    if (res.data && res.data.length > 0) {
      writeCache('starlink:gp', res.data);
      return res.data;
    }
  } catch {
    // API unreachable or too large — fall through to simulated data
  }

  const simulated = generateSimulatedStarlink();
  writeCache('starlink:gp', simulated);
  return simulated;
};

export const filterByRegion = (
  satellites: Satellite3D[],
  region: StarlinkRegion,
): Satellite3D[] => {
  if (region.id === 'all') return satellites;
  return satellites.filter(s =>
    s.lat >= region.latMin && s.lat <= region.latMax &&
    s.lng >= region.lngMin && s.lng <= region.lngMax
  );
};
