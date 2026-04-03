import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Download, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type { Satellite3D } from '../../types/satellite';

interface SatelliteTableProps {
  satellites: Satellite3D[];
  onSatelliteClick: (satellite: Satellite3D) => void;
}

export function SatelliteTable({ satellites, onSatelliteClick }: SatelliteTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  // Filtrar satélites por búsqueda
  const filteredSatellites = useMemo(() => {
    return satellites.filter((sat) =>
      sat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sat.country.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [satellites, searchTerm]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredSatellites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSatellites = filteredSatellites.slice(startIndex, endIndex);

  // Función para descargar CSV
  const downloadCSV = () => {
    const headers = ['ID', 'Name', 'Country', 'Velocity (km/s)', 'Altitude (km)', 'Latitude', 'Longitude'];
    const rows = satellites.map((sat) => [
      sat.id,
      sat.name,
      sat.country,
      sat.velocity.toFixed(2),
      sat.alt.toFixed(2),
      sat.lat.toFixed(4),
      sat.lng.toFixed(4),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `satellites_${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCountryFlag = (code: string) => {
    return `https://flagcdn.com/w40/${code.toLowerCase()}.png`;
  };

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-4">Satellite Database</h2>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              size={20}
              color="var(--cyber-primary)"
            />
            <input
              type="text"
              placeholder="Search satellites or countries..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="cyber-input w-full pl-12"
            />
          </div>

          {/* Download Button */}
          <button onClick={downloadCSV} className="cyber-button flex items-center gap-2">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>

        <p className="text-cyber-text-dim mt-4">
          Showing {startIndex + 1} - {Math.min(endIndex, filteredSatellites.length)} of {filteredSatellites.length} satellites
        </p>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto cyber-scrollbar">
        <table className="cyber-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Country</th>
              <th>Velocity</th>
              <th>Altitude</th>
              <th>Position</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {currentSatellites.map((satellite, index) => (
              <motion.tr
                key={satellite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <td>
                  <span className="font-mono text-cyber-primary font-semibold">
                    {satellite.id}
                  </span>
                </td>
                <td>
                  <span className="font-semibold">{satellite.name}</span>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    {satellite.countryCode !== 'UN' && (
                      <img
                        src={getCountryFlag(satellite.countryCode)}
                        alt={satellite.country}
                        className="w-6 h-auto rounded"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <span>{satellite.country}</span>
                  </div>
                </td>
                <td>
                  <span className="font-mono text-cyber-secondary">
                    {satellite.velocity.toFixed(2)} km/s
                  </span>
                </td>
                <td>
                  <span className="font-mono text-cyber-success">
                    {satellite.alt.toFixed(0)} km
                  </span>
                </td>
                <td>
                  <div className="font-mono text-sm">
                    <div>{satellite.lat.toFixed(2)}° N</div>
                    <div className="text-cyber-text-dim">{satellite.lng.toFixed(2)}° E</div>
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => onSatelliteClick(satellite)}
                    className="px-3 py-1 bg-cyber-primary/20 hover:bg-cyber-primary/30 border border-cyber-primary rounded text-cyber-primary text-sm font-semibold transition-all hover:shadow-[0_0_15px_rgba(0,255,249,0.5)]"
                  >
                    View
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 border border-cyber-border rounded hover:bg-cyber-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={20} color="var(--cyber-primary)" />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Mostrar solo páginas relevantes
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded font-semibold transition-all ${
                      currentPage === page
                        ? 'bg-cyber-primary text-cyber-bg-darker shadow-[0_0_15px_rgba(0,255,249,0.5)]'
                        : 'border border-cyber-border hover:bg-cyber-primary/10 text-cyber-primary'
                    }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <span key={page} className="text-cyber-text-dim">
                    ...
                  </span>
                );
              }
              return null;
            })}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 border border-cyber-border rounded hover:bg-cyber-primary/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={20} color="var(--cyber-primary)" />
          </button>
        </div>
      )}
    </div>
  );
}
