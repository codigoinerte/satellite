import type { Satellite3D, SatelliteEvent } from '../../types/satellite';

const EVT_ICONS: Record<string, string> = {
  approach: '⚠',
  tle:      '↻',
  signal:   '◉',
  debris:   '◈',
  pass:     '↗',
};

interface RightPanelProps {
  selected: Satellite3D | null;
  events: SatelliteEvent[];
  stats: { total: number; leo: number; meo: number; geo: number; heo: number };
}

export function RightPanel({ selected, events, stats }: RightPanelProps) {
  return (
    <aside className="panel panel-right">
      {/* ── Stats section ── */}
      <div className="sec-head">
        <span className="sec-title">Overview</span>
      </div>

      <div className="data-grid">
        <div className="dc">
          <div className="dc-label">Total</div>
          <div className="dc-value">{stats.total}</div>
        </div>
        <div className="dc">
          <div className="dc-label">LEO</div>
          <div className="dc-value" style={{ color: 'var(--cat-a)' }}>{stats.leo}</div>
        </div>
        <div className="dc">
          <div className="dc-label">MEO</div>
          <div className="dc-value" style={{ color: 'var(--cat-b)' }}>{stats.meo}</div>
        </div>
        <div className="dc">
          <div className="dc-label">GEO</div>
          <div className="dc-value" style={{ color: 'var(--cat-c)' }}>{stats.geo}</div>
        </div>
      </div>

      {/* ── Selected satellite detail ── */}
      {selected ? (
        <>
          <div className="sec-head" style={{ marginTop: 4 }}>
            <span className="sec-title">Selected Object</span>
            <span className="sec-badge">{selected.id}</span>
          </div>

          <div style={{ padding: '0 0 4px 0' }}>
            <div className="orbital-row">
              <span className="orbital-label">Name</span>
              <span className="orbital-value" style={{ fontSize: 10, maxWidth: 160, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selected.name}
              </span>
            </div>
            <div className="orbital-row">
              <span className="orbital-label">Country</span>
              <span className="orbital-value">{selected.country}</span>
            </div>
            <div className="orbital-row">
              <span className="orbital-label">Altitude</span>
              <span className="orbital-value">{selected.alt.toFixed(0)} <span style={{ color: 'var(--text-lo)', fontSize: 9 }}>km</span></span>
            </div>
            <div className="orbital-row">
              <span className="orbital-label">Velocity</span>
              <span className="orbital-value">{selected.velocity.toFixed(2)} <span style={{ color: 'var(--text-lo)', fontSize: 9 }}>km/s</span></span>
            </div>
            <div className="orbital-row">
              <span className="orbital-label">Inclination</span>
              <span className="orbital-value">{selected.inclination.toFixed(2)}°</span>
            </div>
            <div className="orbital-row">
              <span className="orbital-label">Period</span>
              <span className="orbital-value">{selected.period.toFixed(1)} <span style={{ color: 'var(--text-lo)', fontSize: 9 }}>min</span></span>
            </div>
            <div className="orbital-row">
              <span className="orbital-label">Eccentricity</span>
              <span className="orbital-value">{selected.eccentricity.toFixed(4)}</span>
            </div>
            <div className="orbital-row">
              <span className="orbital-label">Orbit</span>
              <span className={`pill pill-${selected.orbitType.toLowerCase()}`}>{selected.orbitType}</span>
            </div>
          </div>

          <div className="coord-row" style={{ margin: '0 12px 12px' }}>
            <div className="coord-cell">
              <div className="coord-label">Lat</div>
              <div className="coord-value">{selected.lat.toFixed(4)}°</div>
            </div>
            <div className="coord-cell">
              <div className="coord-label">Lng</div>
              <div className="coord-value">{selected.lng.toFixed(4)}°</div>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '12px 13px' }}>
          <div className="loading-text" style={{ fontSize: 9 }}>Select a satellite to view details</div>
        </div>
      )}

      {/* ── Event log ── */}
      <div className="sec-head">
        <span className="sec-title">Event Log</span>
        <span className="sec-badge">{events.length}</span>
      </div>

      <div className="panel-scroll">
        {events.map(evt => (
          <div key={evt.id} className="evt-row">
            <div className={`evt-icon ${evt.type}`}>
              {EVT_ICONS[evt.type] ?? '·'}
            </div>
            <div>
              <div className="evt-title">{evt.title}</div>
              <div className="evt-meta">{evt.meta}</div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
