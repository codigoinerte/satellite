import { useState } from 'react';
import type { Satellite3D, OrbitType } from '../../types/satellite';
import { STARLINK_REGIONS } from '../../services/satelliteApi';
import type { StarlinkRegion } from '../../services/satelliteApi';

type FilterType = 'all' | OrbitType | 'STARLINK';

const ORBIT_COLORS: Record<string, string> = {
  LEO: '#7a9e7a',
  MEO: '#9e8f6a',
  GEO: '#7a80a8',
  HEO: '#9e8f6a',
  DEBRIS: '#8a4a4a',
  STARLINK: '#ff8c00',
};

const ORBIT_TOOLTIPS: Record<FilterType, { title: string; desc: string }> = {
  all:      { title: 'Todos los objetos',            desc: 'Muestra todos los satélites y objetos rastreados sin filtro.' },
  LEO:      { title: 'LEO — Low Earth Orbit',        desc: 'Altitud < 2,000 km. Incluye la ISS, Starlink y telescopios como Hubble.' },
  MEO:      { title: 'MEO — Medium Earth Orbit',     desc: '2,000 – 35,586 km. Satélites de navegación como GPS y Galileo.' },
  GEO:      { title: 'GEO — Geostationary Orbit',    desc: '~35,786 km. Permanecen fijos sobre un punto. Satélites meteorológicos y de TV.' },
  HEO:      { title: 'HEO — High Earth Orbit',       desc: '> 35,986 km. Órbitas altamente elípticas para cobertura polar.' },
  DEBRIS:   { title: 'DEBRIS — Basura Espacial',     desc: 'Fragmentos de cohetes, satélites inactivos y restos de colisiones orbitales.' },
  STARLINK: { title: 'STARLINK — Constelación SpaceX', desc: 'Red de ~7,000 satélites en LEO (550 km) para internet global. Carga bajo demanda.' },
};

// ─── Tooltip chip ────────────────────────────────────────────────────────────
function OrbitChip({
  order,
  label,
  filterType,
  active,
  onClick,
}: {
  order: number;
  label: string;
  filterType: FilterType;
  active: boolean;
  onClick: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltip = ORBIT_TOOLTIPS[filterType];
  const dotColor = filterType === 'all' ? 'var(--text-md)' : ORBIT_COLORS[filterType] || 'var(--text-lo)';

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button className={`chip ${active ? 'on' : ''}`} onClick={onClick}>
        {label}
      </button>

      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: order > 2 ? '-35px' : 'auto',
            left: order > 2 ? 'auto' : 0,
            width: '220px',
            background: '#14141f',
            border: '1px solid #2a2a3a',
            borderRadius: '4px',
            padding: '10px 12px',
            zIndex: 100,
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-5px',
              left: order > 2 ? 'auto' : '12px',
              right: order > 2 ? '40px' : 'auto',
              transform: 'rotate(45deg)',
              width: '8px',
              height: '8px',
              background: '#14141f',
              borderTop: '1px solid #2a2a3a',
              borderLeft: '1px solid #2a2a3a',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span
              style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: dotColor, flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#e0e0ec', letterSpacing: '0.02em' }}>
              {tooltip.title}
            </span>
          </div>
          <p style={{ fontSize: '10px', color: '#8a8a9a', margin: 0, lineHeight: 1.5, paddingLeft: '12px' }}>
            {tooltip.desc}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Satellite row (shared between main list and starlink list) ──────────────
function SatRow({
  sat,
  isSelected,
  onSelect,
  color,
}: {
  sat: Satellite3D;
  isSelected: boolean;
  onSelect: () => void;
  color?: string;
}) {
  const dotColor = color || ORBIT_COLORS[sat.orbitType] || 'var(--text-lo)';
  return (
    <div
      className={`sat-row ${isSelected ? 'on' : ''}`}
      onClick={onSelect}
    >
      <div className="sat-row-dot" style={{ background: dotColor }} />
      <div className="sat-row-content">
        <div className="sat-row-name">{sat.name}</div>
        <div className="sat-row-meta">
          <span>{sat.alt.toFixed(0)} km</span>
          <span>{sat.velocity.toFixed(1)} km/s</span>
          <span>#{sat.id}</span>
        </div>
      </div>
      <div className="sat-row-right">
        <div className="sat-row-altitude">{sat.alt.toFixed(0)} km</div>
        <span className={`pill ${sat.orbitType.toLowerCase()}`}>{sat.orbitType}</span>
      </div>
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface RightPanelProps {
  satellites?: Satellite3D[];
  selected?: Satellite3D | null;
  onSelect?: (sat: Satellite3D) => void;
  // Starlink
  starlinkSatellites?: Satellite3D[];
  starlinkLoading?: boolean;
  starlinkLoaded?: boolean;
  starlinkTotal?: number;
  starlinkRegion?: StarlinkRegion;
  onStarlinkRegionChange?: (region: StarlinkRegion) => void;
  onLoadStarlink?: () => void;
  onStarlinkActiveChange?: (active: boolean) => void;
}

export function RightPanel({
  satellites = [],
  selected,
  onSelect,
  starlinkSatellites = [],
  starlinkLoading = false,
  starlinkLoaded = false,
  starlinkTotal = 0,
  starlinkRegion,
  onStarlinkRegionChange,
  onLoadStarlink,
  onStarlinkActiveChange,
}: RightPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdate] = useState(new Date());

  const isStarlink = filter === 'STARLINK';

  // Load starlink data on first tab click
  const handleFilterChange = (f: FilterType) => {
    setFilter(f);
    onStarlinkActiveChange?.(f === 'STARLINK');
    if (f === 'STARLINK' && !starlinkLoaded && !starlinkLoading) {
      onLoadStarlink?.();
    }
  };

  // Filter main satellites
  const filteredMain = satellites.filter((sat) => {
    if (filter !== 'all' && filter !== 'STARLINK' && sat.orbitType !== filter) return false;
    if (searchQuery && !sat.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Filter starlink by search
  const filteredStarlink = starlinkSatellites.filter((sat) => {
    if (searchQuery && !sat.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const displayList = isStarlink ? filteredStarlink : filteredMain;
  const displayCount = isStarlink
    ? `${filteredStarlink.length}${starlinkTotal > 0 ? ` / ${starlinkTotal}` : ''}`
    : `${filteredMain.length}`;

  return (
    <aside className="panel right-panel">
      {/* Header */}
      <div className="sec-head">
        <h3 className="sec-head-title">{isStarlink ? 'Starlink Feed' : 'Satellite Feed'}</h3>
        <span className="sec-head-badge">{displayCount}</span>
      </div>

      {/* Search Input */}
      <div style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
        <input
          type="text"
          placeholder={isStarlink ? 'Search Starlink...' : 'Search objects...'}
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Chips */}
      <div
        style={{
          display: 'flex', gap: '6px', padding: '10px',
          borderBottom: '1px solid var(--border)', flexWrap: 'wrap',
        }}
      >
        {(['all', 'LEO', 'MEO', 'GEO', 'DEBRIS', 'STARLINK'] as FilterType[]).map((f, i) => (
          <OrbitChip
            order={i}
            key={f}
            label={f.toUpperCase()}
            filterType={f}
            active={filter === f}
            onClick={() => handleFilterChange(f)}
          />
        ))}
      </div>

      {/* Region selector (only when Starlink tab is active) */}
      {isStarlink && (
        <div
          style={{
            padding: '8px 10px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '9px', color: 'var(--text-lo)', letterSpacing: '1px', textTransform: 'uppercase', flexShrink: 0 }}>
            Región
          </span>
          <select
            value={starlinkRegion?.id || 'south-am'}
            onChange={(e) => {
              const region = STARLINK_REGIONS.find(r => r.id === e.target.value);
              if (region) onStarlinkRegionChange?.(region);
            }}
            style={{
              flex: 1,
              background: '#14141f',
              color: 'var(--text-hi)',
              border: '1px solid var(--border)',
              borderRadius: '2px',
              padding: '4px 6px',
              fontSize: '10px',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {STARLINK_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Satellite List */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Starlink loading state */}
          {isStarlink && starlinkLoading && (
            <div style={{ padding: '30px 20px', textAlign: 'center' }}>
              <div style={{
                width: '24px', height: '24px', border: '2px solid var(--border)',
                borderTopColor: '#00b4d8', borderRadius: '50%',
                margin: '0 auto 12px',
                animation: 'spin 1s linear infinite',
              }} />
              <div style={{ fontSize: '10px', color: 'var(--text-md)' }}>
                Propagando órbitas Starlink...
              </div>
              <div style={{ fontSize: '9px', color: 'var(--text-lo)', marginTop: '4px' }}>
                Esto puede tomar unos segundos
              </div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* List */}
          {!(isStarlink && starlinkLoading) && displayList.length > 0 && (
            displayList.map((sat) => (
              <SatRow
                key={sat.id}
                sat={sat}
                isSelected={selected?.id === sat.id}
                onSelect={() => onSelect?.(sat)}
                color={isStarlink ? '#00b4d8' : undefined}
              />
            ))
          )}

          {/* Empty state */}
          {!(isStarlink && starlinkLoading) && displayList.length === 0 && (
            <div style={{ padding: '20px', color: 'var(--text-lo)', textAlign: 'center', fontSize: '10px' }}>
              {isStarlink && starlinkLoaded
                ? 'Sin satélites Starlink en esta región'
                : isStarlink
                  ? 'Haz click en STARLINK para cargar datos'
                  : 'No objects found'}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px', borderTop: '1px solid var(--border)',
          background: 'var(--bg-panel2)', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          fontSize: '9px', color: 'var(--text-md)',
        }}
      >
        <span>
          Updated{' '}
          {lastUpdate.getUTCHours().toString().padStart(2, '0')}:
          {lastUpdate.getUTCMinutes().toString().padStart(2, '0')} UTC
        </span>
        <button
          style={{
            background: 'none', border: '1px solid var(--border)',
            color: 'var(--text-md)', padding: '4px 8px',
            borderRadius: '2px', cursor: 'pointer', fontSize: '9px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-hi)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-med)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-md)';
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
          }}
        >
          Refresh
        </button>
      </div>
    </aside>
  );
}
