import { useState } from 'react';
import type { Satellite3D } from '../../types/satellite';

interface HudOverlayProps {
  selected?: Satellite3D | null;
}

export function HudOverlay({ selected }: HudOverlayProps) {
  const [showOrbits, setShowOrbits] = useState(true);
  const [showTargets, setShowTargets] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  return (
    <>
      {/* Top-left: Coordinate card */}
      {selected && (
        <div
          className="hud-overlay"
          style={{
            top: '10px',
            left: '10px',
          }}
        >
          <div className="hud-row">
            <span className="hud-label">TARGET LOCK</span>
            <span className="hud-value">{selected.name}</span>
          </div>
          <div className="hud-row">
            <span className="hud-label">LAT</span>
            <span className="hud-value">{selected.lat.toFixed(4)}°</span>
          </div>
          <div className="hud-row">
            <span className="hud-label">LON</span>
            <span className="hud-value">{selected.lng.toFixed(4)}°</span>
          </div>
          <div className="hud-row">
            <span className="hud-label">ALT</span>
            <span className="hud-value">{selected.alt.toFixed(0)} km</span>
          </div>
          <div className="hud-row">
            <span className="hud-label">VEL</span>
            <span className="hud-value">{selected.velocity.toFixed(1)} km/s</span>
          </div>
        </div>
      )}

      {/* Top-right: Toggle buttons */}
      <div className="hud-buttons">
        <button
          className={`hud-button ${showOrbits ? 'on' : ''}`}
          onClick={() => setShowOrbits(!showOrbits)}
        >
          Orbits
        </button>
        <button
          className={`hud-button ${showTargets ? 'on' : ''}`}
          onClick={() => setShowTargets(!showTargets)}
        >
          Targets
        </button>
        <button
          className={`hud-button ${showLabels ? 'on' : ''}`}
          onClick={() => setShowLabels(!showLabels)}
        >
          Labels
        </button>
      </div>
    </>
  );
}

export default HudOverlay;
