import { useState } from 'react';
import type { Satellite3D, OrbitType } from '../../types/satellite';

type FilterType = 'ALL' | OrbitType;

const ORBIT_COLORS: Record<string, string> = {
  LEO: 'var(--cat-a)',
  MEO: 'var(--cat-b)',
  GEO: 'var(--cat-c)',
  HEO: 'var(--cat-c)',
  DEBRIS: 'var(--cat-d)',
};

const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'All',    value: 'ALL' },
  { label: 'LEO',    value: 'LEO' },
  { label: 'MEO',    value: 'MEO' },
  { label: 'GEO',    value: 'GEO' },
  { label: 'HEO',    value: 'HEO' },
];

interface LeftPanelProps {
  satellites: Satellite3D[];
  selected: Satellite3D | null;
  onSelect: (sat: Satellite3D) => void;
}

export function LeftPanel({ satellites, selected, onSelect }: LeftPanelProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');

  const filtered = filter === 'ALL'
    ? satellites
    : satellites.filter(s => s.orbitType === filter);

  return (
    <aside className="panel panel-left">
      {/* Header */}
      <div className="sec-head">
        <span className="sec-title">Satellite Feed</span>
        <span className="sec-badge">{filtered.length}</span>
      </div>

      {/* Filter chips */}
      <div className="filter-bar">
        {FILTERS.map(f => (
          <button
            key={f.value}
            className={`chip ${filter === f.value ? 'on' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Satellite list */}
      <div className="panel-scroll">
        {filtered.map(sat => {
          const isOn = selected?.id === sat.id;
          const dotColor = ORBIT_COLORS[sat.orbitType] ?? 'var(--text-lo)';
          const pillClass = `pill pill-${sat.orbitType.toLowerCase()}`;

          return (
            <div
              key={sat.id}
              className={`sat-row ${isOn ? 'on' : ''}`}
              onClick={() => onSelect(sat)}
            >
              <div className="sr-dot" style={{ background: dotColor }} />
              <div className="sr-body">
                <div className="sr-name">{sat.name}</div>
                <div className="sr-meta">
                  {sat.lat.toFixed(1)}° / {sat.lng.toFixed(1)}° · {sat.velocity.toFixed(1)} km/s
                </div>
              </div>
              <div className="sr-right">
                <span className="sr-alt">{sat.alt.toFixed(0)} km</span>
                <span className={pillClass}>{sat.orbitType}</span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="loading-state">
            <div className="loading-text">No objects</div>
          </div>
        )}
      </div>
    </aside>
  );
}
