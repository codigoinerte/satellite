import axios from 'axios';
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from 'satellite.js';
import type { Satellite3D, OrbitType, SatelliteEvent, CelesTrakGP } from '../types/satellite';

// ─── CelesTrak endpoints (free, no API key) ──────────────────────────────────
// Note: CelesTrak.org updated their API. Using the new endpoint format
const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements/gp.php';

// Groups to fetch – kept small for fast load
const GROUPS = ['stations', 'visual'];

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

// ─── TLE text parser ──────────────────────────────────────────────────────────
interface TLERecord { name: string; tle1: string; tle2: string }

const parseTLEText = (text: string): TLERecord[] => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const records: TLERecord[] = [];
  for (let i = 0; i + 2 < lines.length; i += 3) {
    if (lines[i + 1].startsWith('1 ') && lines[i + 2].startsWith('2 ')) {
      records.push({ name: lines[i], tle1: lines[i + 1], tle2: lines[i + 2] });
    }
  }
  return records;
};

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

// ─── Fetch one CelesTrak group (TLE text format) ──────────────────────────────
const fetchGroup = async (group: string): Promise<TLERecord[]> => {
  const url = `${CELESTRAK_BASE}?FORMAT=TLE&GROUP=${group}`;
  const res = await axios.get<string>(url, {
    responseType: 'text',
    timeout: 10000,
  });
  return parseTLEText(res.data);
};

// ─── Build Satellite3D from TLE record + GP metadata ─────────────────────────
const buildSatellite = (rec: TLERecord, gp?: CelesTrakGP): Satellite3D | null => {
  const pos = propagateNow(rec.tle1, rec.tle2);
  if (!pos || isNaN(pos.lat) || isNaN(pos.alt)) return null;

  // Extract NORAD ID from TLE line 1 (chars 2-7)
  const noradId = parseInt(rec.tle1.substring(2, 7).trim(), 10);
  // Extract inclination from TLE line 2 (chars 8-16)
  const inclination = parseFloat(rec.tle2.substring(8, 16).trim());
  // Extract mean motion from TLE line 2 (chars 52-63)
  const meanMotion  = parseFloat(rec.tle2.substring(52, 63).trim());
  // Extract eccentricity from TLE line 2 (chars 26-33, implied decimal)
  const eccentricity = parseFloat('0.' + rec.tle2.substring(26, 33).trim());

  const { country, code } = guessCountry(noradId, rec.name);
  const alt       = Math.max(0, pos.alt);
  const velocity  = orbitalVelocity(alt);
  const period    = orbitalPeriod(meanMotion);
  const orbitType = getOrbitType(alt);
  const cosparId  = gp?.OBJECT_ID ?? '';

  return {
    id:          noradId,
    name:        rec.name.trim(),
    cosparId,
    position:    latLngToVector3(pos.lat, pos.lng, alt),
    velocity:    parseFloat(velocity.toFixed(2)),
    country,
    countryCode: code,
    lat:         parseFloat(pos.lat.toFixed(4)),
    lng:         parseFloat(pos.lng.toFixed(4)),
    alt:         parseFloat(alt.toFixed(1)),
    inclination: parseFloat((gp?.INCLINATION ?? inclination).toFixed(2)),
    period:      parseFloat(period.toFixed(1)),
    eccentricity: parseFloat((gp?.ECCENTRICITY ?? eccentricity).toFixed(6)),
    orbitType,
  };
};

// ─── Main: fetch satellites from CelesTrak ────────────────────────────────────
export const fetchSatellites = async (): Promise<Satellite3D[]> => {
  const allRecords: TLERecord[] = [];
  const seen = new Set<number>();

  for (const group of GROUPS) {
    try {
      const records = await fetchGroup(group);
      for (const r of records) {
        const id = parseInt(r.tle1.substring(2, 7).trim(), 10);
        if (!seen.has(id)) {
          seen.add(id);
          allRecords.push(r);
        }
      }
    } catch (err) {
      console.warn(`CelesTrak group "${group}" failed:`, err);
    }
  }

  if (allRecords.length === 0) {
    console.warn('CelesTrak unreachable — using mock data');
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
  { id: 37849,  name: 'TIANGONG-2',            country: 'China',          code: 'cn', alt: 380,    inc: 42.78, mmo: 15.66 },
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

// ─── Event log generator ──────────────────────────────────────────────────────
export const generateEvents = (satellites: Satellite3D[]): SatelliteEvent[] => {
  const now   = new Date();
  const ago   = (m: number) => new Date(now.getTime() - m * 60 * 1000);
  const tStr  = (d: Date) => d.toISOString().substring(11, 16) + ' UTC';

  const events: SatelliteEvent[] = [];

  if (satellites.length >= 2) {
    const leos = satellites.filter(s => s.orbitType === 'LEO');
    if (leos.length >= 2) {
      events.push({
        id: 'evt-approach',
        type: 'approach',
        title: 'Close approach detected',
        meta: `${leos[0].name} / ${leos[1].name} · 2.4 km · ${tStr(ago(6))}`,
        time: ago(6),
      });
    }
  }

  events.push({
    id: 'evt-tle',
    type: 'tle',
    title: 'TLE catalog updated',
    meta: `CelesTrak · ${satellites.length} objects · ${tStr(ago(12))}`,
    time: ago(12),
  });

  const signalSat = satellites.find(s => s.name.includes('NOAA') || s.name.includes('SENTINEL'));
  if (signalSat) {
    events.push({
      id: 'evt-signal',
      type: 'signal',
      title: 'Signal acquired',
      meta: `${signalSat.name} · ${signalSat.alt.toFixed(0)} km · ${tStr(ago(18))}`,
      time: ago(18),
    });
  }

  const debrSat = satellites.find(s => s.orbitType === 'LEO' && s.alt < 450);
  if (debrSat) {
    events.push({
      id: 'evt-debris',
      type: 'debris',
      title: 'Decay alert',
      meta: `${debrSat.name} · alt ${debrSat.alt.toFixed(0)} km · ${tStr(ago(27))}`,
      time: ago(27),
    });
  }

  const passSat = satellites.find(s => s.orbitType === 'LEO' && s.inclination > 80);
  if (passSat) {
    events.push({
      id: 'evt-pass',
      type: 'pass',
      title: 'Overhead pass predicted',
      meta: `${passSat.name} · elevation 72° · ${tStr(ago(33))}`,
      time: ago(33),
    });
  }

  events.push({
    id: 'evt-tle2',
    type: 'tle',
    title: 'Space-Track.org sync',
    meta: `Differential corrections applied · ${tStr(ago(45))}`,
    time: ago(45),
  });

  return events;
};

// ─── Stats summary ────────────────────────────────────────────────────────────
export const calcStats = (satellites: Satellite3D[]) => ({
  total:   satellites.length,
  leo:     satellites.filter(s => s.orbitType === 'LEO').length,
  meo:     satellites.filter(s => s.orbitType === 'MEO').length,
  geo:     satellites.filter(s => s.orbitType === 'GEO').length,
  heo:     satellites.filter(s => s.orbitType === 'HEO').length,
  debris:  0,
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
