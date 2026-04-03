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

      {/* Filter Chips */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '10px',
          borderBottom: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}
      >
        {(['all', 'LEO', 'MEO', 'GEO', 'DEBRIS'] as FilterType[]).map((f) => (
          <button
            key={f}
            className={`chip ${filter === f ? 'on' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.toUpperCase()}
          </button>
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
