# SATTRACK — Global Satellite Monitoring System

Dashboard 3D interactivo para monitoreo global de satélites en tiempo real. Diseño cyberpunk/futurista con globo terrestre renderizado con shaders GLSL, cálculo orbital TLE en cliente y visualización de constelaciones completas como Starlink.

![SATTRACK Preview](https://raw.githubusercontent.com/codigoinerte/satellite/refs/heads/main/public/images/github-satellite.png)

---

## Características

**Visualización 3D**
- Globo terrestre con shaders GLSL custom: blending día/noche, textura de luces de ciudades NASA, nubes y bump mapping
- Satélites renderizados como modelos 3D individuales (cuerpo, antena, paneles solares, glow pulsante, labels billboard)
- Anillos orbitales visuales: LEO sólido, MEO dashed, exterior dotted
- OrbitControls con autoRotate, damping y límites de zoom

**Tracking en Tiempo Real**
- Datos TLE consumidos desde CelesTrak (formato estándar)
- Propagación orbital con `satellite.js` — todo en cliente, sin latencia de red
- Posiciones actualizadas cada frame con conversión ECI → geodésico → coords 3D (Three.js)
- Clasificación automática: LEO / MEO / GEO / HEO / DEBRIS

**UI & Layout**
- Shell CSS Grid: `Topbar (44px) | Body | StatusBar (34px)`
- Body en 3 columnas: `272px (Left Panel) | 1fr (Centro 3D) | 292px (Right Panel)`
- Reloj UTC en vivo en Topbar
- HUD overlay con coordenadas flotantes
- Tabs: Globe 3D · Data Table · Starlink

**Vista Table**
- Lista completa con búsqueda por nombre/país, paginación y exportación CSV

**Starlink (en desarrollo — rama `starlink`)**
- Visualización de ~7,000+ satélites Starlink filtrados por región geográfica
- Web Worker para propagación masiva sin bloquear el hilo principal
- Renderizado vía `PointsMaterial` (1 draw call para miles de objetos)
- Filtros por región: Global, Sudamérica, Centroamérica, Norteamérica, Europa, Asia, Africa, Oceania
- Re-propagación automática cada 30s (solo cuando el tab Starlink está activo)

---

## Tech Stack

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | React + TypeScript | 19.x / 5.9.x |
| Build | Vite | 8.x |
| 3D Engine | Three.js + React Three Fiber + Drei | 0.183.x |
| Mecánica Orbital | satellite.js | 7.0.x |
| Animaciones | Framer Motion | 12.x |
| HTTP | Axios | 1.13.x |
| Iconos | Lucide React | 1.7.x |

---

## Inicio Rápido

**Prerrequisitos:** Node.js 18+

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`

---

## Arquitectura

```
App.tsx (estado central)
├── Topbar.tsx              — Header, reloj UTC, nav
├── LeftPanel.tsx
│   ├── SatelliteInfo       — Modal animado del satélite seleccionado
│   └── StatsPanel          — Tarjetas de estadísticas globales
├── EarthScene.tsx          — Canvas 3D principal (React Three Fiber)
│   ├── Earth.tsx           — Globo con ShaderMaterial GLSL
│   ├── Satellite3D.tsx[]   — Modelos 3D de satélites
│   └── OrbitRings          — Anillos orbitales visuales
├── SatelliteTable.tsx      — Vista alternativa en tabla
├── RightPanel.tsx          — Buscador, filtros, lista, control Starlink
│   └── Tabs.tsx            — Globe | Table | Starlink
├── Timeline.tsx            — Barra de progreso diario
├── StatusBar.tsx           — Footer: fuente, estado conexión, versión
├── HudOverlay.tsx          — Coordenadas flotantes en pantalla
└── DotCanvas.tsx           — Fondo decorativo de puntos
```

**Capa de servicios:**
- `src/services/satelliteApi.ts` — fetch TLE, parse, cálculos orbitales, conversión de coordenadas
- `src/services/starlink.worker.ts` — Web Worker para propagación masiva Starlink

---

## Design System (Cyberpunk)

```css
:root {
  --bg: rgb(32, 33, 36);      /* Fondo principal */
  --bg-panel: #1c1d20;        /* Paneles */
  --text-hi: #e8e8ea;         /* Texto principal */
  --text-md: #8c8d92;         /* Texto secundario */
  --red: #a62c2e;             /* Acento principal */

  /* Tipos de órbita */
  --leo: #7a9e7a;             /* LEO — verde */
  --meo: #9e8f6a;             /* MEO — dorado */
  --geo: #7a80a8;             /* GEO — azul */
  --deb: #8a4a4a;             /* DEBRIS — rojo oscuro */
}
```

**Tipografía:**
- Brand SATTRACK: `Space Mono 700`, 12px, letter-spacing 3px, uppercase
- Datos numéricos: `Space Mono 700`, 14–18px (monospace)
- UI general: `Inter 400–600`, 11–13px

---

## Controles 3D

| Acción | Control |
|--------|---------|
| Rotar globo | Click izquierdo + arrastrar |
| Zoom | Scroll del mouse |
| Pan | Click derecho + arrastrar |
| Seleccionar satélite | Click sobre el modelo 3D |
| Ver nombre/órbita | Hover sobre el satélite |

---

## Scripts

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run preview  # Preview del build
npm run lint     # Linter
```

---

## Solución de Problemas

**El servidor no inicia**
```bash
rm -rf node_modules package-lock.json && npm install
```

**Error de tipos Three.js**
```bash
npm install -D @types/three
```

---

## Agradecimientos

- [CelesTrak](https://celestrak.org/) — fuente principal de datos TLE
- [Three.js](https://threejs.org/) — motor de gráficos 3D
- [satellite.js](https://github.com/shashwatak/satellite-js) — cálculos orbitales SGP4/SDP4
- [Flag CDN](https://flagcdn.com/) — banderas de países
- [NASA Visible Earth](https://visibleearth.nasa.gov/) — texturas terrestres

---

<div align="center">

Built with dedication by the SATTRACK team

**Este proyecto fue posible gracias a la colaboración con [Claude](https://claude.ai) (Anthropic)**,
que participó activamente en el diseño de la arquitectura, implementación de componentes,
shaders GLSL, mecánica orbital y el sistema de diseño cyberpunk.

</div>
