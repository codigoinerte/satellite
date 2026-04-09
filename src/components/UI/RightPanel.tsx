import { useState } from 'react';
import type { Satellite3D, OrbitType } from '../../types/satellite';

type FilterType = 'all' | OrbitType;

const ORBIT_COLORS: Record<string, string> = {
  LEO: '#7a9e7a',
  MEO: '#9e8f6a',
  GEO: '#7a80a8',
  HEO: '#9e8f6a',
  DEBRIS: '#8a4a4a',
};

const ORBIT_TOOLTIPS: Record<FilterType, { title: string; desc: string }> = {
  all:    { title: 'Todos los objetos',          desc: 'Muestra todos los satélites y objetos rastreados sin filtro.' },
  LEO:    { title: 'LEO — Low Earth Orbit',      desc: 'Altitud < 2,000 km. Incluye la ISS, Starlink y telescopios como Hubble.' },
  MEO:    { title: 'MEO — Medium Earth Orbit',   desc: '2,000 – 35,586 km. Satélites de navegación como GPS y Galileo.' },
  GEO:    { title: 'GEO — Geostationary Orbit',  desc: '~35,786 km. Permanecen fijos sobre un punto. Satélites meteorológicos y de TV.' },
  HEO:    { title: 'HEO — High Earth Orbit',     desc: '> 35,986 km. Órbitas altamente elípticas para cobertura polar.' },
  DEBRIS: { title: 'DEBRIS — Basura Espacial',   desc: 'Fragmentos de cohetes, satélites inactivos y restos de colisiones orbitales.' },
};

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
            right: order > 2 ? "-35px" : "auto",
            left: order > 2 ? "auto" : 0,
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
          {/* Arrow caret */}
          <div
            style={{
              position: 'absolute',
              top: '-5px',
              left: order > 2 ? "auto" : '12px',
              right:order > 2 ? "40px" : "auto",
              transform: 'rotate(45deg)',
              width: '8px',
              height: '8px',
              background: '#14141f',
              borderTop: '1px solid #2a2a3a',
              borderLeft: '1px solid #2a2a3a',
            }}
          />
          {/* Title row with dot */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: dotColor,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#e0e0ec', letterSpacing: '0.02em' }}>
              {tooltip.title}
            </span>
          </div>
          {/* Description */}
          <p style={{ fontSize: '10px', color: '#8a8a9a', margin: 0, lineHeight: 1.5, paddingLeft: '12px' }}>
            {tooltip.desc}
          </p>
        </div>
      )}
    </div>
  );
}

interface RightPanelProps {
  satellites?: Satellite3D[];
  selected?: Satellite3D | null;
  onSelect?: (sat: Satellite3D) => void;
}

export function RightPanel({ satellites = [], selected, onSelect }: RightPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdate] = useState(new Date());

  // Filter satellites
  const filtered = satellites
    .filter((sat) => {
      if (filter !== 'all' && sat.orbitType !== filter) return false;
      if (searchQuery && !sat.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

  return (
    <aside className="panel right-panel">
      {/* Header */}
      <div className="sec-head">
        <h3 className="sec-head-title">Satellite Feed</h3>
        <span className="sec-head-badge">{filtered.length}</span>
      </div>

      {/* Search Input */}
      <div style={{ padding: '10px', borderBottom: '1px solid var(--border)' }}>
        <input
          type="text"
          placeholder="Search objects..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Filter Chips with Tooltips */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '10px',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}
      >
        {(['all', 'LEO', 'MEO', 'GEO', 'DEBRIS'] as FilterType[]).map((f, i) => (
          <OrbitChip
            order={i}
            key={f}
            label={f.toUpperCase()}
            filterType={f}
            active={filter === f}
            onClick={() => setFilter(f)}
          />
        ))}
      </div>

      {/* Satellite List */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filtered.length > 0 ? (
            filtered.map((sat) => {
              const isSelected = selected?.id === sat.id;
              const dotColor = ORBIT_COLORS[sat.orbitType] || 'var(--text-lo)';
              return (
                <div
                  key={sat.id}
                  className={`sat-row ${isSelected ? 'on' : ''}`}
                  onClick={() => onSelect?.(sat)}
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
            })
          ) : (
            <div style={{ padding: '20px', color: 'var(--text-lo)', textAlign: 'center', fontSize: '10px' }}>
              No objects found
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-panel2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '9px',
          color: 'var(--text-md)',
        }}
      >
        <span>
          Updated{' '}
          {lastUpdate.getUTCHours().toString().padStart(2, '0')}:
          {lastUpdate.getUTCMinutes().toString().padStart(2, '0')} UTC
        </span>
        <button
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            color: 'var(--text-md)',
            padding: '4px 8px',
            borderRadius: '2px',
            cursor: 'pointer',
            fontSize: '9px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            const target = e.currentTarget as HTMLButtonElement;
            target.style.color = 'var(--text-hi)';
            target.style.borderColor = 'var(--border-med)';
          }}
          onMouseLeave={(e) => {
            const target = e.currentTarget as HTMLButtonElement;
            target.style.color = 'var(--text-md)';
            target.style.borderColor = 'var(--border)';
          }}
        >
          Refresh
        </button>
      </div>
    </aside>
  );
}
