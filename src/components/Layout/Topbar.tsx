import { useEffect, useState } from 'react';

interface TopbarProps {
  activeView: 'globe' | 'table';
  onViewChange: (v: 'globe' | 'table') => void;
  satCount: number;
}

export function Topbar({ activeView, onViewChange, satCount }: TopbarProps) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h  = String(now.getUTCHours()).padStart(2, '0');
      const m  = String(now.getUTCMinutes()).padStart(2, '0');
      const s  = String(now.getUTCSeconds()).padStart(2, '0');
      setClock(`${h}:${m}:${s} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="brand">SATTRACK</span>
        <div className="topbar-divider" />
        <span className="topbar-subtitle">Orbital Intelligence</span>
        <nav className="topbar-nav">
          <button
            className={`nav-item ${activeView === 'globe' ? 'active' : ''}`}
            onClick={() => onViewChange('globe')}
          >
            Globe
          </button>
          <button
            className={`nav-item ${activeView === 'table' ? 'active' : ''}`}
            onClick={() => onViewChange('table')}
          >
            Catalog
          </button>
        </nav>
      </div>

      <div className="topbar-right">
        <div className="sys-badge">
          <div className="sys-dot" />
          <span>LIVE · {satCount} OBJ</span>
        </div>
        <div className="topbar-divider" />
        <span className="topbar-clock">{clock}</span>
      </div>
    </header>
  );
}
