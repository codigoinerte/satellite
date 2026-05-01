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
  fetchStarlinkGP, filterByRegion, STARLINK_REGIONS,
  getMockSatellites, readCachedSatellites, MOCK_EVENTS,
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
  const [satellites, setSatellites] = useState<Satellite3D[]>(() => {
    const cached = readCachedSatellites();
    return cached ?? getMockSatellites();
  });
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite3D | null>(null);
  const [events, setEvents] = useState<SatelliteEvent[]>(MOCK_EVENTS);
  const [stats, setStats] = useState<SatelliteStats>({
    total: 0, leo: 0, meo: 0, geo: 0, agencies: 0,
  });
  const [showModal, setShowModal] = useState(false);
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

  // ─── Initialize selection + stats, then refresh in background ───────────────
  useEffect(() => {
    const initIss = satellites.find(s => s.name.toUpperCase().includes('ISS'));
    setSelectedSatellite(initIss ?? satellites[0] ?? null);
    setStats(calcStats(satellites));

    fetchSatellites()
      .then(freshSats => {
        setSatellites(freshSats);
        setStats(calcStats(freshSats));
        setSelectedSatellite(prev => {
          if (!prev) return freshSats[0] ?? null;
          return freshSats.find(s => s.id === prev.id) ?? prev;
        });
      })
      .catch(err => console.warn('Background satellite refresh failed:', err));

    fetchNasaEvents()
      .then(realEvents => { if (realEvents.length > 0) setEvents(realEvents); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


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

  // ─── Load Starlink on demand (service layer handles cache) ──────────────────
  const handleLoadStarlink = useCallback(async () => {
    if (starlinkLoaded || starlinkLoading) return;
    setStarlinkLoading(true);

    try {
      const satellites = await fetchStarlinkGP();
      workerRef.current?.postMessage({
        type: 'parse-and-propagate',
        satellites,
        time: Date.now(),
      });
    } catch (err) {
      console.error('Failed to fetch Starlink data:', err);
      setStarlinkLoading(false);
    }
  }, [starlinkLoaded, starlinkLoading]);

  // ─── Re-propagate every 1.5 min while Starlink tab is active ─────────────
  useEffect(() => {
    if (starlinkActive && starlinkLoaded) {
      repropagateRef.current = setInterval(() => {
        workerRef.current?.postMessage({
          type: 'repropagate',
          time: Date.now(),
        });
      }, 90_000); // 1.5 min
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
    setShowModal(true);
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
              <>
                  <EarthScene
                    satellites={satellites}
                    selectedSatellite={selectedSatellite}
                    starlinkSatellites={starlinkActive ? starlinkFiltered : []}
                  />
                  <HudOverlay selected={selectedSatellite} />
                </>
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
