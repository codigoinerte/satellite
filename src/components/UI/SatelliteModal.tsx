import type { Satellite3D } from '../../types/satellite';

interface SatelliteModalProps {
  satellite?: Satellite3D | null;
  onClose?: () => void;
}

export function SatelliteModal({ satellite, onClose }: SatelliteModalProps) {
  if (!satellite) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <div>
            <div className="modal-title">{satellite.name}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-md)', marginTop: '2px' }}>
              NORAD #{satellite.id}
            </div>
          </div>
          <button className="modal-close" onClick={() => onClose?.()}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Grid 1: Altitude, Velocity, Period */}
          <div className="modal-grid">
            <div className="modal-cell">
              <div className="modal-cell-label">Altitude</div>
              <div className="modal-cell-value">{satellite.alt.toFixed(0)} km</div>
            </div>
            <div className="modal-cell">
              <div className="modal-cell-label">Velocity</div>
              <div className="modal-cell-value">{satellite.velocity.toFixed(1)} km/s</div>
            </div>
            <div className="modal-cell">
              <div className="modal-cell-label">Period</div>
              <div className="modal-cell-value">{satellite.period.toFixed(1)} min</div>
            </div>
          </div>

          {/* Grid 2: Inclination, Eccentricity, Orbit# */}
          <div className="modal-grid">
            <div className="modal-cell">
              <div className="modal-cell-label">Inclination</div>
              <div className="modal-cell-value">{satellite.inclination.toFixed(2)}°</div>
            </div>
            <div className="modal-cell">
              <div className="modal-cell-label">Eccentricity</div>
              <div className="modal-cell-value">{satellite.eccentricity.toFixed(6)}</div>
            </div>
            <div className="modal-cell">
              <div className="modal-cell-label">Orbit Type</div>
              <div className="modal-cell-value">{satellite.orbitType}</div>
            </div>
          </div>

          {/* Grid 3: Latitude, Longitude */}
          <div className="modal-grid two-col">
            <div className="modal-cell">
              <div className="modal-cell-label">Latitude</div>
              <div className="modal-cell-value">{satellite.lat.toFixed(4)}°</div>
            </div>
            <div className="modal-cell">
              <div className="modal-cell-label">Longitude</div>
              <div className="modal-cell-value">{satellite.lng.toFixed(4)}°</div>
            </div>
          </div>

          {/* Banner */}
          <div className="modal-banner">Live tracking active</div>
        </div>
      </div>
    </div>
  );
}

export default SatelliteModal;
