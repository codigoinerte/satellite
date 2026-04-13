import type { Satellite3D } from '../../types/satellite';

interface HudOverlayProps {
  selected?: Satellite3D | null;
}

export function HudOverlay({ selected }: HudOverlayProps) {
  return (
    <>
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
    </>
  );
}

export default HudOverlay;
