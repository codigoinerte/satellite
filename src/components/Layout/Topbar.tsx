import { useEffect, useState } from 'react';

interface TopbarProps {
  activeNav?: string;
}

export function Topbar({ activeNav = 'globe' }: TopbarProps) {
  const [clock, setClock] = useState('00:00:00 UTC');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setClock(`${h}:${m}:${s} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header
      style={{
        height: '44px',
        background: 'var(--bg-panel2)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 15px',
        zIndex: 1,
        position: 'relative',
      }}
    >
      {/* Left side: Brand + Divider + Subtitle + Nav */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* SVG Icon */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{ flexShrink: 0 }}
        >
          <circle cx="10" cy="10" r="4" stroke="var(--red)" strokeWidth="1.5" />
          <line x1="6" y1="10" x2="3" y2="10" stroke="var(--text-md)" strokeWidth="0.8" />
          <line x1="14" y1="10" x2="17" y2="10" stroke="var(--text-md)" strokeWidth="0.8" />
          <line x1="10" y1="6" x2="10" y2="3" stroke="var(--text-md)" strokeWidth="0.8" />
          <line x1="10" y1="14" x2="10" y2="17" stroke="var(--text-md)" strokeWidth="0.8" />
        </svg>

        {/* Brand: SATTRACK */}
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '3px',
            color: 'var(--text-hi)',
            textTransform: 'uppercase',
          }}
        >
          SATTRACK
        </span>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '18px',
            background: 'var(--border-med)',
          }}
        />

        {/* Subtitle: Orbital Intelligence */}
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '10px',
            fontWeight: 400,
            letterSpacing: '2px',
            color: 'var(--text-lo)',
            textTransform: 'uppercase',
            minWidth: '140px',
          }}
        >
          Orbital Intelligence
        </span>

        {/* Nav Items */}
        <nav
          style={{
            display: 'flex',
            gap: '12px',
            marginLeft: '20px',
          }}
        >
          {['Globe', 'Analytics', 'Coverage', 'Alerts', 'API'].map((item) => (
            <button
              key={item}
              style={{
                background: 'none',
                border: 'none',
                color: activeNav === item.toLowerCase() ? 'var(--text-hi)' : 'var(--text-md)',
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                fontWeight: 400,
                cursor: 'pointer',
                padding: '4px 8px',
                borderBottom: activeNav === item.toLowerCase() ? '1px solid var(--text-hi)' : 'transparent',
                transition: 'color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                target.style.color = 'var(--text-hi)';
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLButtonElement;
                if (activeNav !== item.toLowerCase()) {
                  target.style.color = 'var(--text-md)';
                }
              }}
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      {/* Right side: Status Dot + Online + Clock */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <div className="sys-dot" />
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 400,
              color: 'var(--text-md)',
            }}
          >
            Online
          </span>
        </div>

        {/* Clock */}
        <span
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px',
            fontWeight: 400,
            color: 'var(--text-md)',
            minWidth: '95px',
            textAlign: 'right',
          }}
        >
          {clock}
        </span>
      </div>
    </header>
  );
}
