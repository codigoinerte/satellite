import type { Satellite3D, SatelliteEvent, SatelliteStats } from '../../types/satellite';

interface LeftPanelProps {
  selected?: Satellite3D | null;
  stats?: SatelliteStats;
  events?: SatelliteEvent[];
}

// Orbit type colors - kept for reference (can be used for future enhancements)
// const ORBIT_COLORS: Record<string, string> = {
//   LEO: '#7a9e7a',
//   MEO: '#9e8f6a',
//   GEO: '#7a80a8',
//   HEO: '#9e8f6a',
//   DEBRIS: '#8a4a4a',
// };

export function LeftPanel({
  selected,
  stats = { total: 8247, leo: 5234, meo: 1203, geo: 456, debris: 312 },
  events = [],
}: LeftPanelProps) {

  return (
    <aside className="panel left-panel">
      {/* Section 1: Selected Object */}
      <div className="panel-section">
        <div className="sec-head">
          <h3 className="sec-head-title">Selected Object</h3>
          <span className="sec-head-badge red">LOCKED</span>
        </div>
        <div className="panel-section-body" style={{ padding: '12px' }}>
          {selected ? (
            <>
              {/* Satellite Name */}
              <div style={{ marginBottom: '10px' }}>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-hi)',
                    marginBottom: '4px',
                  }}
                >
                  {selected.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '9px',
                    color: 'var(--text-md)',
                  }}
                >
                  NORAD ID: <strong>{selected.id}</strong>
                </div>
              </div>

              {/* Orbital Type Pills */}
              <div style={{ marginBottom: '10px', display: 'flex', gap: '6px' }}>
                <span className={`pill ${selected.orbitType.toLowerCase()}`}>
                  {selected.orbitType}
                </span>
              </div>

              {/* Data Grid: Altitude, Velocity, Inclination, Period */}
              <div className="data-grid">
                <div className="data-cell">
                  <div className="data-cell-label">Altitude</div>
                  <div className="data-cell-value">
                    {selected.alt.toFixed(0)} <span className="data-cell-unit">km</span>
                  </div>
                </div>
                <div className="data-cell">
                  <div className="data-cell-label">Velocity</div>
                  <div className="data-cell-value">
                    {selected.velocity.toFixed(1)} <span className="data-cell-unit">km/s</span>
                  </div>
                </div>
                <div className="data-cell">
                  <div className="data-cell-label">Inclination</div>
                  <div className="data-cell-value">
                    {selected.inclination.toFixed(2)} <span className="data-cell-unit">°</span>
                  </div>
                </div>
                <div className="data-cell">
                  <div className="data-cell-label">Period</div>
                  <div className="data-cell-value">
                    {selected.period.toFixed(1)} <span className="data-cell-unit">min</span>
                  </div>
                </div>
              </div>

              {/* Position Box */}
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  fontSize: '9px',
                }}
              >
                <div style={{ color: 'var(--text-md)', marginBottom: '3px' }}>Latitude</div>
                <div style={{ fontFamily: "'Space Mono', monospace", color: 'var(--text-hi)', marginBottom: '6px' }}>
                  {selected.lat.toFixed(4)}°
                </div>
                <div style={{ color: 'var(--text-md)', marginBottom: '3px' }}>Longitude</div>
                <div style={{ fontFamily: "'Space Mono', monospace", color: 'var(--text-hi)', marginBottom: '6px' }}>
                  {selected.lng.toFixed(4)}°
                </div>
                <div style={{ color: 'var(--text-md)', marginBottom: '3px' }}>Orbit Type</div>
                <div style={{ fontFamily: "'Space Mono', monospace", color: 'var(--text-hi)' }}>
                  {selected.orbitType}
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: 'var(--text-lo)', fontSize: '10px', padding: '12px 0' }}>
              No satellite selected
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Global Summary */}
      <div className="panel-section">
        <div className="sec-head">
          <h3 className="sec-head-title">Global Summary</h3>
        </div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Tracked</div>
            <div className="stat-value">{stats.total.toLocaleString()}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Active</div>
            <div className="stat-value">{(stats.leo + stats.meo + stats.geo).toLocaleString()}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Debris</div>
            <div className="stat-value red">{stats.debris.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Section 3: Orbit Distribution Bars */}
      <div className="panel-section">
        <div className="sec-head">
          <h3 className="sec-head-title">Orbit Distribution</h3>
        </div>
        <div style={{ padding: '8px 0' }}>
          {/* LEO */}
          <div className="orbit-dist-item">
            <div className="orbit-dist-label">LEO</div>
            <div className="orbit-dist-bar">
              <div className="orbit-dist-fill leo" style={{ width: `${(stats.leo / stats.total) * 100}%` }} />
            </div>
            <div className="orbit-dist-count">{stats.leo}</div>
          </div>

          {/* MEO */}
          <div className="orbit-dist-item">
            <div className="orbit-dist-label">MEO</div>
            <div className="orbit-dist-bar">
              <div className="orbit-dist-fill meo" style={{ width: `${(stats.meo / stats.total) * 100}%` }} />
            </div>
            <div className="orbit-dist-count">{stats.meo}</div>
          </div>

          {/* GEO */}
          <div className="orbit-dist-item">
            <div className="orbit-dist-label">GEO</div>
            <div className="orbit-dist-bar">
              <div className="orbit-dist-fill geo" style={{ width: `${(stats.geo / stats.total) * 100}%` }} />
            </div>
            <div className="orbit-dist-count">{stats.geo}</div>
          </div>
        </div>
      </div>

      {/* Section 4: Recent Events */}
      <div className="panel-section" style={{ flex: 1 }}>
        <div className="sec-head">
          <h3 className="sec-head-title">Recent Events</h3>
          <span className="sec-head-badge green">Live</span>
        </div>
        <div className="event-log">
          {events.length > 0 ? (
            events.map((evt) => (
              <div key={evt.id} className="event-item">
                <div className={`event-dot ${evt.type}`} />
                <div className="event-content">
                  <div className="event-title">{evt.title}</div>
                  <div className="event-meta">{evt.meta}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ padding: '12px', color: 'var(--text-lo)', fontSize: '10px' }}>
              No events
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
