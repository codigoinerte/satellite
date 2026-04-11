export type OrbitType = 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'DEBRIS';

export interface Satellite3D {
  id: number;
  name: string;
  cosparId: string;
  position: [number, number, number];
  velocity: number;       // km/s
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  alt: number;            // km
  inclination: number;    // degrees
  period: number;         // minutes
  eccentricity: number;
  orbitType: OrbitType;
}

export interface SatelliteEvent {
  id: string;
  type: 'solar' | 'storm' | 'fire' | 'radiation' | 'eonet' | 'approach' | 'tle' | 'signal' | 'debris' | 'pass';
  title: string;
  meta: string;
  time: Date;
  url?: string;
}

export interface SatelliteStats {
  total: number;
  leo: number;
  meo: number;
  geo: number;
  debris: number;
  heo?: number;
}

// CelesTrak GP OMM JSON record
export interface CelesTrakGP {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  NORAD_CAT_ID: number;
  EPOCH: string;
  MEAN_MOTION: number;       // rev/day
  ECCENTRICITY: number;
  INCLINATION: number;       // degrees
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  CLASSIFICATION_TYPE: string;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
  TLE_LINE1?: string;
  TLE_LINE2?: string;
}

// Legacy N2YO types (kept for reference)
export interface SatellitePosition {
  satlatitude: number;
  satlongitude: number;
  sataltitude: number;
  azimuth: number;
  elevation: number;
  ra: number;
  dec: number;
  timestamp: number;
}

export interface N2YOResponse {
  info: {
    satname: string;
    satid: number;
    transactionscount: number;
  };
  positions: SatellitePosition[];
}
