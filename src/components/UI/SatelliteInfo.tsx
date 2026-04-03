import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Gauge, Globe } from 'lucide-react';
import type { Satellite3D } from '../../types/satellite';

interface SatelliteInfoProps {
  satellite: Satellite3D | null;
  onClose: () => void;
}

export function SatelliteInfo({ satellite, onClose }: SatelliteInfoProps) {
  if (!satellite) return null;

  const getCountryFlag = (code: string) => {
    // API de banderas gratuita
    return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="cyber-card p-6 m-4 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">{satellite.name}</h2>
              <p className="text-cyber-text-dim text-sm">NORAD ID: {satellite.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-cyber-primary/10 rounded transition-colors"
            >
              <X size={24} color="var(--cyber-primary)" />
            </button>
          </div>

          {/* Country */}
          <div className="mb-6 flex items-center gap-3 p-4 bg-cyber-bg-darker/50 rounded-lg border border-cyber-border">
            <Globe size={24} color="var(--cyber-primary)" />
            <div className="flex-1">
              <p className="text-cyber-text-dim text-sm">Country</p>
              <p className="text-lg font-semibold">{satellite.country}</p>
            </div>
            {satellite.countryCode !== 'UN' && (
              <img
                src={getCountryFlag(satellite.countryCode)}
                alt={satellite.country}
                className="w-12 h-auto rounded border border-cyber-border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Velocity */}
            <div className="p-4 bg-cyber-bg-darker/50 rounded-lg border border-cyber-border">
              <div className="flex items-center gap-2 mb-2">
                <Gauge size={20} color="var(--cyber-secondary)" />
                <p className="text-cyber-text-dim text-sm">Velocity</p>
              </div>
              <p className="text-2xl font-bold text-cyber-secondary">
                {satellite.velocity.toFixed(2)}
                <span className="text-sm ml-1">km/s</span>
              </p>
            </div>

            {/* Altitude */}
            <div className="p-4 bg-cyber-bg-darker/50 rounded-lg border border-cyber-border">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={20} color="var(--cyber-success)" />
                <p className="text-cyber-text-dim text-sm">Altitude</p>
              </div>
              <p className="text-2xl font-bold text-cyber-success">
                {satellite.alt.toFixed(0)}
                <span className="text-sm ml-1">km</span>
              </p>
            </div>
          </div>

          {/* Position */}
          <div className="p-4 bg-cyber-bg-darker/50 rounded-lg border border-cyber-border">
            <h3 className="text-sm text-cyber-text-dim mb-3">Current Position</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-cyber-text-dim mb-1">Latitude</p>
                <p className="font-mono text-cyber-primary font-semibold">
                  {satellite.lat.toFixed(4)}°
                </p>
              </div>
              <div>
                <p className="text-xs text-cyber-text-dim mb-1">Longitude</p>
                <p className="font-mono text-cyber-primary font-semibold">
                  {satellite.lng.toFixed(4)}°
                </p>
              </div>
            </div>
          </div>

          {/* Visual indicator */}
          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyber-success animate-pulse"></div>
            <p className="text-xs text-cyber-text-dim">Live Tracking Active</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
