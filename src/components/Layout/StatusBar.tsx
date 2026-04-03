interface StatusBarProps {
  totalObjects?: number;
}

export function StatusBar({ totalObjects = 0 }: StatusBarProps) {
  return (
    <footer
      style={{
        height: '34px',
        background: 'var(--bg-panel2)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 15px',
        zIndex: 1,
        position: 'relative',
      }}
    >
      {/* Left: Source info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '10px',
            color: 'var(--text-md)',
          }}
        >
          Source: <strong style={{ color: 'var(--text-hi)' }}>N2YO.com</strong> / Space-Track.org
        </span>
      </div>

      {/* Center: Refresh & View */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '10px',
            color: 'var(--text-md)',
          }}
        >
          Refresh: <strong style={{ color: 'var(--text-hi)' }}>5 min</strong>
        </span>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '10px',
            color: 'var(--text-md)',
          }}
        >
          View: <strong style={{ color: 'var(--text-hi)' }}>3D Globe</strong>
        </span>
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '10px',
            color: 'var(--text-md)',
          }}
        >
          Objects: <strong style={{ color: 'var(--text-hi)' }}>{totalObjects}</strong>
        </span>
      </div>

      {/* Right: Status dot + Version */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="sys-dot" />
        <span
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '10px',
            color: 'var(--text-md)',
          }}
        >
          v1.2.3
        </span>
      </div>
    </footer>
  );
}
