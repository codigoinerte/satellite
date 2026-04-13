import { useEffect, useState, useRef, useCallback } from 'react';
import DotCanvas from './components/UI/DotCanvas';
import { Topbar } from './components/Layout/Topbar';
import { StatusBar } from './components/Layout/StatusBar';
import { LeftPanel } from './components/UI/LeftPanel';
import { RightPanel } from './components/UI/RightPanel';
import EarthScene from './components/Earth/EarthScene';
import { HudOverlay } from './components/UI/HudOverlay';
import { Timeline } from './components/UI/Timeline';
import { SatelliteModal } from './components/UI/SatelliteModal';
import { InformationPanel } from './components/UI/InformationPanel';
import {
  fetchSatellites, fetchNasaEvents, calcStats,
  fetchStarlinkTLE, filterByRegion, STARLINK_REGIONS,
} from './services/satelliteApi';
import type { Satellite3D, SatelliteEvent, SatelliteStats } from './types/satellite';
import type { StarlinkRegion } from './services/satelliteApi';

// ─── Worker-based Starlink result (matches worker output) ────────────────────
interface StarlinkWorkerResult {
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

function workerResultToSatellite3D(r: StarlinkWorkerResult): Satellite3D {
  return {
    ...r,
    cosparId: '',
    country: 'United States',
    countryCode: 'us',
    orbitType: 'LEO',
  };
}

function App() {
  const [satellites, setSatellites] = useState<Satellite3D[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite3D | null>(null);
  const [events, setEvents] = useState<SatelliteEvent[]>([]);
  const [stats, setStats] = useState<SatelliteStats>({
    total: 0, leo: 0, meo: 0, geo: 0, debris: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('globe');

  // ─── Starlink state ──────────────────────────────────────────────────────
  const [starlinkAll, setStarlinkAll] = useState<Satellite3D[]>([]);
  const [starlinkRegion, setStarlinkRegion] = useState<StarlinkRegion>(STARLINK_REGIONS[1]); // Sudamérica default
  const [starlinkLoading, setStarlinkLoading] = useState(false);
  const [starlinkLoaded, setStarlinkLoaded] = useState(false);
  const [starlinkTotal, setStarlinkTotal] = useState(0);
  const [starlinkActive, setStarlinkActive] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const repropagateRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Load main satellites on mount ───────────────────────────────────────
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const sats = await fetchSatellites();
        setSatellites(sats);

        const iss = sats.find((s) => s.name.toUpperCase().includes('ISS'));
        if (iss) {
          setSelectedSatellite(iss);
        } else if (sats.length > 0) {
          setSelectedSatellite(sats[0]);
        }

        setStats(calcStats(sats));

        // Fetch real NASA events (non-blocking)
        fetchNasaEvents().then(setEvents).catch(() => {});
      } catch (err) {
        console.error('Failed to load satellites:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // ─── Starlink localStorage cache ──────────────────────────────────────────
  const STARLINK_CACHE_KEY = 'starlink_tle_cache';
  const STARLINK_CACHE_MAX_AGE = 15 * 60 * 1000; // 15 minutes

  const getCachedTLE = (): string | null => {
    try {
      const raw = localStorage.getItem(STARLINK_CACHE_KEY);
      if (!raw) return null;
      const { tleText, timestamp } = JSON.parse(raw);
      if (Date.now() - timestamp > STARLINK_CACHE_MAX_AGE) {
        localStorage.removeItem(STARLINK_CACHE_KEY);
        return null;
      }
      return tleText;
    } catch {
      return null;
    }
  };

  const setCachedTLE = (tleText: string) => {
    try {
      localStorage.setItem(STARLINK_CACHE_KEY, JSON.stringify({
        tleText,
        timestamp: Date.now(),
      }));
    } catch {
      // localStorage full or unavailable
    }
  };

  // ─── Starlink worker setup ───────────────────────────────────────────────
  useEffect(() => {
    const worker = new Worker(
      new URL('./workers/starlink.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'result') {
        const sats = (e.data.satellites as StarlinkWorkerResult[]).map(workerResultToSatellite3D);
        setStarlinkAll(sats);
        setStarlinkTotal(e.data.total);
        setStarlinkLoading(false);
        if (!starlinkLoaded) setStarlinkLoaded(true);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Load Starlink on demand (cache-first) ──────────────────────────────
  const handleLoadStarlink = useCallback(async () => {
    if (starlinkLoaded || starlinkLoading) return;
    setStarlinkLoading(true);

    // Try cache first
    const cached = getCachedTLE();
    if (cached) {
      workerRef.current?.postMessage({
        type: 'parse-and-propagate',
        tleText: cached,
        time: Date.now(),
      });
      return;
    }

    // Fetch fresh data
    try {
      const tleText = await fetchStarlinkTLE();
      setCachedTLE(tleText);
      workerRef.current?.postMessage({
        type: 'parse-and-propagate',
        tleText,
        time: Date.now(),
      });
    } catch (err) {
      console.error('Failed to fetch Starlink TLE:', err);
      setStarlinkLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [starlinkLoaded, starlinkLoading]);

  // ─── Re-propagate every 1.5 min while Starlink tab is active ─────────────
  useEffect(() => {
    if (starlinkActive && starlinkLoaded) {
      repropagateRef.current = setInterval(() => {
        workerRef.current?.postMessage({
          type: 'repropagate',
          time: Date.now(),
        });
      }, 20_000); // 20 seconds
    }
    return () => {
      if (repropagateRef.current) {
        clearInterval(repropagateRef.current);
        repropagateRef.current = null;
      }
    };
  }, [starlinkActive, starlinkLoaded]);

  // ─── Filtered Starlink by region ─────────────────────────────────────────
  const starlinkFiltered = starlinkLoaded
    ? filterByRegion(starlinkAll, starlinkRegion)
    : [];

  const handleSatelliteSelect = (sat: Satellite3D) => {
    setSelectedSatellite(sat);
  };

  return (
    <div className="shell">
      <DotCanvas />
      <Topbar activeNav={activeNav} onNavChange={setActiveNav} />

      {activeNav === 'globe' ? (
        <div className="body-grid">
          <LeftPanel selected={selectedSatellite} stats={stats} events={events} />

          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
              {loading ? (
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100%', color: 'var(--text-md)', fontSize: '12px',
                  }}
                >
                  Loading satellites...
                </div>
              ) : (
                <>
                  <EarthScene
                    satellites={satellites}
                    selectedSatellite={selectedSatellite}
                    starlinkSatellites={starlinkActive ? starlinkFiltered : []}
                  />
                  <HudOverlay selected={selectedSatellite} />
                </>
              )}
            </div>
            <Timeline />
          </div>

          <RightPanel
            satellites={satellites}
            selected={selectedSatellite}
            onSelect={handleSatelliteSelect}
            starlinkSatellites={starlinkFiltered}
            starlinkLoading={starlinkLoading}
            starlinkLoaded={starlinkLoaded}
            starlinkTotal={starlinkTotal}
            starlinkRegion={starlinkRegion}
            onStarlinkRegionChange={setStarlinkRegion}
            onLoadStarlink={handleLoadStarlink}
            onStarlinkActiveChange={setStarlinkActive}
          />
        </div>
      ) : (
        <InformationPanel />
      )}

      <StatusBar totalObjects={satellites.length} />

      {showModal && (
        <SatelliteModal satellite={selectedSatellite} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default App;
