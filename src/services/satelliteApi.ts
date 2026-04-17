import axios from 'axios';
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from 'satellite.js';
import type { Satellite3D, OrbitType, SatelliteEvent } from '../types/satellite';


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

// ─── TLE record type ─────────────────────────────────────────────────────────
interface TLERecord { name: string; tle1: string; tle2: string }

// ─── Propagate TLE to current position ───────────────────────────────────────
const propagateNow = (
  tle1: string,
  tle2: string
): { lat: number; lng: number; alt: number } | null => {
  try {
    const satrec = twoline2satrec(tle1, tle2);
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

// ─── Build Satellite3D from TLE record ───────────────────────────────────────
const buildSatellite = (rec: TLERecord): Satellite3D | null => {
  const pos = propagateNow(rec.tle1, rec.tle2);
  if (!pos || isNaN(pos.lat) || isNaN(pos.alt)) return null;

  const noradId = parseInt(rec.tle1.substring(2, 7).trim(), 10);
  const inclination = parseFloat(rec.tle2.substring(8, 16).trim());
  const meanMotion  = parseFloat(rec.tle2.substring(52, 63).trim());
  const eccentricity = parseFloat('0.' + rec.tle2.substring(26, 33).trim());

  const { country, code } = guessCountry(noradId, rec.name);
  const alt       = Math.max(0, pos.alt);
  const velocity  = orbitalVelocity(alt);
  const period    = orbitalPeriod(meanMotion);
  const orbitType = getOrbitType(alt);

  return {
    id:          noradId,
    name:        rec.name.trim(),
    cosparId:    '',
    position:    latLngToVector3(pos.lat, pos.lng, alt),
    velocity:    parseFloat(velocity.toFixed(2)),
    country,
    countryCode: code,
    lat:         parseFloat(pos.lat.toFixed(4)),
    lng:         parseFloat(pos.lng.toFixed(4)),
    alt:         parseFloat(alt.toFixed(1)),
    inclination: parseFloat(inclination.toFixed(2)),
    period:      parseFloat(period.toFixed(1)),
    eccentricity: parseFloat(eccentricity.toFixed(6)),
    orbitType,
  };
};

// ─── TLE API search helper ───────────────────────────────────────────────────
const searchTleApi = async (query: string, pageSize = 20): Promise<TLERecord[]> => {
  const url = `${TLE_API_BASE}/?search=${encodeURIComponent(query)}&page-size=${pageSize}`;
  const res = await axios.get<TleApiResponse>(url, { timeout: 10000 });
  const records: TLERecord[] = [];
  for (const m of res.data.member || []) {
    if (m.line1 && m.line2) {
      records.push({ name: m.name, tle1: m.line1, tle2: m.line2 });
    }
  }
  return records;
};

// Satellite groups to search — covers stations, navigation, weather, science
const SEARCH_QUERIES = [
  'ISS',        // ISS + modules
  'TIANHE',     // Chinese Space Station
  'NOAA',       // Weather satellites
  'GPS',        // US navigation
  'GALILEO',    // EU navigation
  'SENTINEL',   // EU Earth observation
  'GOES',       // US geostationary weather
  'TERRA',      // NASA Earth science
  'AQUA',       // NASA Earth science
  'HUBBLE',     // Space telescope
  'LANDSAT',    // Earth imaging
  'COSMOS',     // Russian satellites
  'GLONASS',    // Russian navigation
  'BEIDOU',     // Chinese navigation
  'INTELSAT',   // Communications GEO
  'IRIDIUM',    // LEO communications
];

// ─── Main: fetch satellites from TLE API ─────────────────────────────────────
export const fetchSatellites = async (): Promise<Satellite3D[]> => {
  const seen = new Set<number>();
  const allRecords: TLERecord[] = [];

  // Fetch all groups in parallel
  const results = await Promise.allSettled(
    SEARCH_QUERIES.map(q => searchTleApi(q, 15))
  );

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const rec of result.value) {
        const id = parseInt(rec.tle1.substring(2, 7).trim(), 10);
        if (!seen.has(id)) {
          seen.add(id);
          allRecords.push(rec);
        }
      }
    }
  }

  if (allRecords.length === 0) {
    console.warn('TLE API unreachable — using mock data');
    return getMockSatellites();
  }

  const satellites: Satellite3D[] = [];
  for (const rec of allRecords) {
    const sat = buildSatellite(rec);
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

// TLE API (free, no auth, works when CelesTrak is down)
const TLE_API_BASE = 'https://tle.ivanstanojevic.me/api/tle';
const STARLINK_PAGES_TO_FETCH = 15; // 15 pages × 100 = ~1,500 satellites
const STARLINK_PAGE_SIZE = 100;

interface TleApiMember {
  satelliteId: number;
  name: string;
  line1: string;
  line2: string;
  date: string;
}

interface TleApiResponse {
  totalItems: number;
  member: TleApiMember[];
}

export const fetchStarlinkTLE = async (): Promise<string> => {
  // Fetch multiple pages in parallel
  const pageNumbers = Array.from({ length: STARLINK_PAGES_TO_FETCH }, (_, i) => i + 1);

  const results = await Promise.allSettled(
    pageNumbers.map(page =>
      axios.get<TleApiResponse>(`${TLE_API_BASE}/?search=starlink&page-size=${STARLINK_PAGE_SIZE}&page=${page}`, {
        timeout: 15000,
      })
    )
  );

  // Convert JSON responses back to TLE text format (worker expects TLE text)
  const lines: string[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.data.member) {
      for (const m of result.value.data.member) {
        if (m.line1 && m.line2) {
          lines.push(m.name);
          lines.push(m.line1);
          lines.push(m.line2);
        }
      }
    }
  }

  if (lines.length === 0) {
    throw new Error('No Starlink TLE data received');
  }

  return lines.join('\n');
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
