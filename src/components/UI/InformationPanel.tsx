const TECH_STACK = [
  { name: 'React', version: '19.2', desc: 'UI library', url: 'https://react.dev' },
  { name: 'Three.js', version: '0.183', desc: 'WebGL 3D engine', url: 'https://threejs.org' },
  { name: 'React Three Fiber', version: '9.5', desc: 'React renderer for Three.js', url: 'https://r3f.docs.pmnd.rs' },
  { name: '@react-three/drei', version: '10.7', desc: 'R3F helpers (OrbitControls, Html)', url: 'https://drei.docs.pmnd.rs' },
  { name: 'satellite.js', version: '7.0', desc: 'SGP4/SDP4 orbit propagation', url: 'https://github.com/shashwatak/satellite-js' },
  { name: 'Vite', version: '6.x', desc: 'Build tool & dev server', url: 'https://vite.dev' },
  { name: 'TypeScript', version: '5.x', desc: 'Type-safe JavaScript', url: 'https://www.typescriptlang.org' },
  { name: 'Axios', version: '1.13', desc: 'HTTP client', url: 'https://axios-http.com' },
  { name: 'Framer Motion', version: '12.x', desc: 'Animations', url: 'https://motion.dev' },
];

const DATA_SOURCES = [
  {
    name: 'TLE API',
    desc: 'Two-Line Element sets for satellite orbit data. Provides TLE records for 40,000+ objects including ISS, GPS, Galileo, NOAA, and more.',
    url: 'https://tle.ivanstanojevic.me',
    usage: 'Satellite positions, orbital parameters',
  },
  {
    name: 'NASA DONKI',
    desc: 'Space Weather Database Of Notifications, Knowledge, Information. Real-time alerts on solar flares, geomagnetic storms, and radiation belt events.',
    url: 'https://api.nasa.gov',
    usage: 'Space weather events (CME, GST, FLR, RBE)',
  },
  {
    name: 'NASA EONET',
    desc: 'Earth Observatory Natural Event Tracker. Curates natural events detected by Earth-observing satellites like wildfires, storms, and volcanic activity.',
    url: 'https://eonet.gsfc.nasa.gov',
    usage: 'Natural events (fires, storms, volcanoes)',
  },
  {
    name: 'Three.js Examples',
    desc: 'High-resolution Earth textures (day, night, bump/roughness/clouds) from the three.js TSL Earth example.',
    url: 'https://threejs.org/examples/webgpu_tsl_earth.html',
    usage: 'Globe textures (4096px day, bump, clouds)',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'TLE Fetch', desc: 'Two-Line Element data is fetched from the TLE API. Each TLE contains 2 lines of orbital parameters (inclination, eccentricity, mean motion, epoch).' },
  { step: '02', title: 'SGP4 Propagation', desc: 'satellite.js parses TLEs and runs the SGP4 algorithm to propagate satellite positions to the current time, outputting ECI coordinates.' },
  { step: '03', title: 'Coordinate Transform', desc: 'ECI coordinates are converted to geodetic (lat/lng/alt) using GMST, then to 3D Cartesian coordinates for the Three.js scene.' },
  { step: '04', title: '3D Rendering', desc: 'Custom GLSL shaders render Earth with real-time day/night based on UTC, while satellites are positioned using InstancedMesh for performance.' },
  { step: '05', title: 'Live Updates', desc: 'Starlink positions are re-propagated every 20s via a Web Worker. NASA events are fetched on load. The globe rotates in sync with real UTC time.' },
];

export function InformationPanel() {
  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: '30px 40px',
      color: 'var(--text-hi)',
    }}>
    <div style={{
      maxWidth: '860px', margin: '0 auto', padding: '28px 32px',
      background: 'rgba(12, 12, 18, 0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid #28292d',
      borderRadius: '6px',
    }}>
      {/* About */}
      <section style={{ marginBottom: '32px' }}>
        <SectionTitle>About</SectionTitle>
        <p style={pStyle}>
          SATTRACK is a real-time satellite tracking dashboard that visualizes orbital objects around Earth.
          It propagates satellite positions from TLE data using SGP4 orbital mechanics, renders them on a 3D
          globe with custom GLSL shaders, and displays real NASA space weather and natural disaster events.
        </p>
      </section>

      {/* Two columns: Tech Stack + Data Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Tech Stack */}
        <section>
          <SectionTitle>Tech Stack</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {TECH_STACK.map(t => (
              <a
                key={t.name}
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
                style={cardStyle}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3a3a4a'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#28292d'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-hi)' }}>{t.name}</span>
                  <span style={versionBadge}>{t.version}</span>
                </div>
                <span style={{ fontSize: '9px', color: 'var(--text-lo)' }}>{t.desc}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Data Sources */}
        <section>
          <SectionTitle>Data Sources</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {DATA_SOURCES.map(d => (
              <a
                key={d.name}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...cardStyle, gap: '6px' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3a3a4a'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#28292d'; }}
              >
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-hi)' }}>{d.name}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-md)', lineHeight: 1.5 }}>{d.desc}</span>
                <span style={{ fontSize: '8px', color: 'var(--text-lo)', fontFamily: "'Space Mono', monospace" }}>
                  Used for: {d.usage}
                </span>
              </a>
            ))}
          </div>
        </section>
      </div>

      {/* How it works */}
      <section style={{ marginBottom: '32px' }}>
        <SectionTitle>How It Works</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {HOW_IT_WORKS.map(s => (
            <div key={s.step} style={{
              display: 'flex', gap: '14px', alignItems: 'flex-start',
              padding: '12px 14px',
              background: '#1c1d20', border: '1px solid #28292d', borderRadius: '4px',
            }}>
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: '18px', fontWeight: 700,
                color: '#4a4a5a', lineHeight: 1, flexShrink: 0, minWidth: '28px',
              }}>
                {s.step}
              </span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-hi)', marginBottom: '3px' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-md)', lineHeight: 1.6 }}>
                  {s.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Credits */}
      <section style={{ marginBottom: '20px' }}>
        <SectionTitle>Credits</SectionTitle>
        <p style={{ ...pStyle, fontSize: '9px', color: 'var(--text-lo)' }}>
          Earth textures from the three.js TSL Earth example by mrdoob. Orbital data courtesy of the TLE API.
          Space weather data from NASA DONKI. Natural event data from NASA EONET. Orbit propagation powered by satellite.js (SGP4/SDP4).
        </p>
      </section>
    </div>
    </div>
  );
}

// ─── Shared styles ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontFamily: "'Inter', sans-serif", fontSize: '9px', fontWeight: 600,
      letterSpacing: '2px', textTransform: 'uppercase' as const,
      color: 'var(--text-lo)', marginBottom: '12px', marginTop: 0,
    }}>
      {children}
    </h3>
  );
}

const pStyle: React.CSSProperties = {
  fontSize: '11px', color: 'var(--text-md)', lineHeight: 1.7,
  margin: 0, maxWidth: '680px',
};

const cardStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: '2px',
  padding: '8px 10px', background: '#1c1d20',
  border: '1px solid #28292d', borderRadius: '4px',
  textDecoration: 'none', transition: 'border-color 0.15s', cursor: 'pointer',
};

const versionBadge: React.CSSProperties = {
  fontSize: '8px', fontFamily: "'Space Mono', monospace",
  color: 'var(--text-lo)', background: '#28292d',
  padding: '1px 5px', borderRadius: '2px',
};
