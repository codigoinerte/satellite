import { useEffect, useState } from 'react';
import DotCanvas from './components/UI/DotCanvas';
import { Topbar } from './components/Layout/Topbar';
import { StatusBar } from './components/Layout/StatusBar';
import { LeftPanel } from './components/UI/LeftPanel';
import { RightPanel } from './components/UI/RightPanel';
import EarthScene from './components/Earth/EarthScene';
import { HudOverlay } from './components/UI/HudOverlay';
import { Timeline } from './components/UI/Timeline';
import { SatelliteModal } from './components/UI/SatelliteModal';
import { fetchSatellites, generateEvents, calcStats } from './services/satelliteApi';
import type { Satellite3D, SatelliteEvent, SatelliteStats } from './types/satellite';

function App() {
  const [satellites, setSatellites] = useState<Satellite3D[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite3D | null>(null);
  const [events, setEvents] = useState<SatelliteEvent[]>([]);
  const [stats, setStats] = useState<SatelliteStats>({
    total: 0,
    leo: 0,
    meo: 0,
    geo: 0,
    debris: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timelineProgress, setTimelineProgress] = useState(62);

  // Load satellites on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const sats = await fetchSatellites();
        setSatellites(sats);

        // Select the first satellite by default (ISS if available)
        const iss = sats.find((s) => s.name.toUpperCase().includes('ISS'));
        if (iss) {
          setSelectedSatellite(iss);
        } else if (sats.length > 0) {
          setSelectedSatellite(sats[0]);
        }

        // Generate events and stats
        const evts = generateEvents(sats);
        setEvents(evts);

        const st = calcStats(sats);
        setStats(st);
      } catch (err) {
        console.error('Failed to load satellites:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSatelliteSelect = (sat: Satellite3D) => {
    setSelectedSatellite(sat);
  };

  return (
    <div className="shell">
      {/* DotCanvas background */}
      <DotCanvas />

      {/* Topbar */}
      <Topbar activeNav="globe" />

      {/* Body grid */}
      <div className="body-grid">
        {/* Left Panel */}
        <LeftPanel selected={selectedSatellite} stats={stats} events={events} />

        {/* Center: Viewport with Earth, HUD, Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Earth Scene */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {loading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--text-md)',
                  fontSize: '12px',
                }}
              >
                Loading satellites...
              </div>
            ) : (
              <>
                <EarthScene satellites={satellites} />
                <HudOverlay selected={selectedSatellite} />
              </>
            )}
          </div>

          {/* Timeline */}
          <Timeline progress={timelineProgress} onProgressChange={setTimelineProgress} />
        </div>

        {/* Right Panel */}
        <RightPanel
          satellites={satellites}
          selected={selectedSatellite}
          onSelect={handleSatelliteSelect}
        />
      </div>

      {/* StatusBar */}
      <StatusBar totalObjects={satellites.length} />

      {/* Modal */}
      {showModal && (
        <SatelliteModal satellite={selectedSatellite} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default App;
