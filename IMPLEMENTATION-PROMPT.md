# Directivas de Implementacion — SATTRACK Dashboard

## Objetivo

Implementar el template `design-mockup.html` como aplicacion React + TypeScript + Vite, replicando **pixel-perfect** el diseno visual del mockup. El proyecto ya tiene estructura base en `src/`. Se debe reescribir/actualizar todos los componentes para que coincidan exactamente con el mockup.

**Regla principal:** El resultado final debe ser visualmente IDENTICO al mockup cuando se abre `design-mockup.html` en el navegador. Cualquier diferencia visual es un bug.

---

## 1. Referencia Visual Obligatoria

Antes de escribir cualquier codigo, abrir `design-mockup.html` en un navegador y usarlo como referencia constante. Cada componente implementado debe compararse visualmente contra el mockup. El archivo `DESIGN-SYSTEM.md` contiene todos los tokens de diseno extraidos del mockup.

---

## 2. Stack Tecnologico

| Tecnologia | Uso |
|---|---|
| React 19 | UI Framework |
| TypeScript | Tipado |
| Vite 8 | Build tool |
| Three.js + R3F + Drei | Globo 3D (area central) |
| Framer Motion | Animaciones |
| Lucide React | Iconos |
| satellite.js | Calculos orbitales |
| Axios | HTTP client |

**NO agregar nuevas dependencias** salvo que sea estrictamente necesario para consumir una API.

---

## 3. Arquitectura de Componentes

Mapeo exacto del mockup a componentes React. Respetar esta estructura:

```
src/
  components/
    Layout/
      Topbar.tsx          -- Barra superior (brand + nav + clock + status)
      StatusBar.tsx        -- Barra inferior (source, refresh, version)
    UI/
      DotCanvas.tsx        -- Canvas de fondo con dots interactivos
      LeftPanel.tsx         -- Panel izquierdo completo
      RightPanel.tsx        -- Panel derecho completo
      SatelliteModal.tsx    -- Modal de detalle de satelite
      HudOverlay.tsx        -- Cards HUD flotantes sobre el globo
      Timeline.tsx          -- Barra de timeline/scrubber
    Earth/
      EarthScene.tsx        -- Canvas R3F con globo 3D
      Earth.tsx             -- Modelo del globo
    Satellite/
      Satellite3D.tsx       -- Marcadores de satelite en el globo
  services/
    satelliteApi.ts         -- Servicio de datos (APIs reales)
  types/
    satellite.ts            -- Tipos TypeScript
  styles/
    global.css              -- Tokens CSS + reset + estilos base
  App.tsx                   -- Shell principal (grid layout)
  main.tsx                  -- Entry point
```

---

## 4. Design Tokens — COPIAR EXACTAMENTE

Todos los tokens CSS deben ir en `src/styles/global.css` usando las variables exactas del mockup:

```css
:root {
  --bg:          rgb(32, 33, 36);
  --bg-panel:    #1c1d20;
  --bg-panel2:   #17181b;
  --bg-hover:    #26272b;
  --border:      rgba(195, 195, 200, 0.15);
  --border-med:  rgba(210, 210, 215, 0.26);
  --text-hi:     #e8e8ea;
  --text-md:     #8c8d92;
  --text-lo:     #4e4f55;
  --red:         #a62c2e;
  --red-dim:     rgba(166, 44, 46, 0.09);
  --red-border:  rgba(166, 44, 46, 0.32);
  --red-text:    #c94244;
  --leo:         #7a9e7a;
  --meo:         #9e8f6a;
  --geo:         #7a80a8;
  --deb:         #8a4a4a;
}
```

**Fuentes obligatorias:** `Inter` (300, 400, 500, 600) + `Space Mono` (400, 700). Importar desde Google Fonts en `index.html`.

---

## 5. Layout Principal (App.tsx)

El shell debe replicar exactamente este grid:

```css
.shell {
  display: grid;
  grid-template-rows: 44px 1fr 34px;
  height: 100vh;
}
.body-grid {
  display: grid;
  grid-template-columns: 272px 1fr 292px;
  overflow: hidden;
}
```

Estructura:
```
[Topbar - 44px]
[LeftPanel 272px | Center (Globe) 1fr | RightPanel 292px]
[StatusBar - 34px]
```

---

## 6. Especificaciones por Componente

### 6.1 DotCanvas.tsx
- Canvas fijo (`position: fixed; inset: 0; z-index: 0`)
- Dots reactivos al cursor del mouse
- Parametros exactos: `SPACING=10, R_BASE=1.0, R_LIT=1.15, A_BASE=0.18, A_LIT=0.55, REACH=110`
- Color: `rgba(220, 220, 225, alpha)`
- Curva de decaimiento: `Math.pow(1 - d/REACH, 1.6)`

### 6.2 Topbar.tsx
- Altura: **44px**, `background: var(--bg-panel2)`, `border-bottom: 1px solid var(--border)`
- Izquierda: Icono SVG del satelite + "SATTRACK" (`Space Mono 700, 12px, letter-spacing: 3px`) + divisor vertical (1px, 18px alto) + "Orbital Intelligence" (`10px, uppercase, letter-spacing: 2px, --text-lo`) + Nav items (Globe, Analytics, Coverage, Alerts, API)
- Derecha: Dot verde parpadeante (5px, `#5a9e5a`, animacion `blink 2s`) + "Online" + Reloj en tiempo real (`Space Mono 11px`)
- El SVG del icono debe ser exactamente el del mockup (circulos y lineas cruzadas en rojo/gris)

### 6.3 LeftPanel.tsx

Debe contener **4 secciones** en este orden exacto:

**A) Selected Object**
- Section header: "SELECTED OBJECT" + badge "LOCKED" (rojo)
- Cuerpo: nombre del satelite seleccionado (`Space Mono 12px 700`), NORAD ID, pills de tipo orbital (LEO/MEO/GEO/DEB)
- Data grid 2x2: Altitude, Velocity, Inclination, Period (cada celda con label 9px uppercase + valor `Space Mono 14px 700`)
- Position box: Lat, Lon, Orbit

**B) Global Summary**
- Stats 3 columnas: Tracked (8,247), Active (4,821), Debris (312 en rojo)
- Valores: `Space Mono 17px 700`

**C) Orbit Distribution Bars**
- LEO, MEO, GEO con barras de progreso coloreadas
- Labels 9px, numeros `Space Mono 9px` a la derecha

**D) Recent Events**
- Section header: "RECENT EVENTS" + badge "Live" (verde)
- Lista scrollable de eventos con dot de color + titulo + metadata

### 6.4 Center Area (EarthScene + HUD + Timeline)

**Globo 3D:**
- El area central es transparente (se ve el dot-canvas de fondo)
- Gradiente radial sutil sobre el area: `radial-gradient(ellipse 60% 60% at 50% 55%, rgba(50,51,56,.8) 0%, transparent 70%)`
- El globo 3D de Three.js reemplaza el mock CSS del mockup
- Mantener anillos orbitales y marcadores de satelite sobre el globo

**HUD Overlay (posicionado absoluto sobre el globo):**
- Top-left: Card de coordenadas con backdrop blur (`background: rgba(20,21,24,.82); border: 1px solid var(--border); border-radius: 3px; backdrop-filter: blur(8px)`)
  - Muestra: Target Lock, LAT, LON, ALT, VEL del satelite seleccionado
- Top-right: Botones toggle (Orbits, Targets, Labels) con estado on/off

**Timeline (debajo del globo):**
- `background: var(--bg-panel2)`, `border-top: 1px solid var(--border)`
- Label "EPOCH" + chips de rango (1D, 1W, 1M) con seleccion exclusiva
- Track de progreso: `height: 2px`, fill al 62% con `rgba(166,44,46,.45)`
- Head circular: 9px, `background: var(--red)`, `border: 2px solid var(--bg-panel2)`
- Ticks de hora: 00:00, 06:00, 12:00, 18:00, 24:00
- Reloj UTC en tiempo real

### 6.5 RightPanel.tsx

**A) Header:** "SATELLITE FEED" + badge con conteo total

**B) Buscador:**
- Input con placeholder "Search objects..."
- `background: var(--bg); border: 1px solid var(--border); border-radius: 3px`

**C) Filter chips:** All, LEO, MEO, GEO, Debris (seleccion exclusiva)

**D) Lista de satelites (scrollable):**
Cada fila (`.sat-row`) contiene:
- Dot de color (5px)
- Nombre del satelite (11px, 500) + metadata (`Space Mono 9px`: altitud, velocidad, NORAD ID)
- Altitud a la derecha + pill de tipo orbital
- Fila seleccionada: `background: var(--red-dim); border-left: 2px solid var(--red);` nombre en `--red-text`
- Hover: `background: var(--bg-hover)`

**E) Footer:** "Updated HH:MM UTC" + boton Refresh

### 6.6 SatelliteModal.tsx
- Overlay: `rgba(10,11,14,.72) + backdrop-filter: blur(6px)`
- Card: `width: 430px; background: var(--bg-panel); border: 1px solid var(--border-med); border-radius: 4px; box-shadow: 0 20px 50px rgba(0,0,0,.6)`
- Header con fondo `--bg-panel2`: nombre + NORAD + boton cerrar
- Body: Grid 3 columnas (Altitude, Velocity, Period) + Grid 3 columnas (Inclination, Eccentricity, Orbit#) + Grid 2 columnas (Latitude, Longitude) + banner "Live tracking active"

### 6.7 StatusBar.tsx
- Altura: **34px**, `background: var(--bg-panel2)`, `border-top: 1px solid var(--border)`
- Contenido: Source (N2YO.com/Space-Track.org) | Refresh (5 min), View (3D Globe), Objects (conteo) | dot verde + version

---

## 7. APIs Reales para Datos Dinamicos

Los datos del mockup son estaticos. Para hacer la app funcional, usar estas APIs gratuitas/open-source:

### 7.1 Datos de Satelites — N2YO.com API
- **URL base:** `https://api.n2yo.com/rest/v1/satellite/`
- **API Key:** Registrarse gratuitamente en https://www.n2yo.com/api/
- **Endpoints a usar:**
  - `positions/{id}/{observer_lat}/{observer_lng}/{observer_alt}/{seconds}` — posicion en tiempo real
  - `above/{observer_lat}/{observer_lng}/{observer_alt}/{search_radius}/{category_id}` — satelites visibles
- **Nota:** Si la API key no esta disponible, usar datos mock que repliquen la estructura exacta del mockup

### 7.2 Datos TLE (Two-Line Elements) — CelesTrak
- **URL:** `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json`
- **Gratis, sin API key necesaria**
- **Uso:** Obtener TLEs actualizados para calculos orbitales con `satellite.js`
- Grupos utiles: `stations` (ISS), `starlink`, `gps-ops`, `geo`, `active`

### 7.3 Calculo Orbital Local con satellite.js
- Usar la libreria `satellite.js` (ya instalada) para calcular posiciones en tiempo real a partir de TLEs
- Esto permite actualizar posiciones sin llamar constantemente a APIs externas
- Funciones clave: `twoline2satrec()`, `propagate()`, `eciToGeodetic()`

### 7.4 Datos de Debris Espacial — Space-Track.org
- **URL:** `https://www.space-track.org/basicspac/query/class/gp/`
- **Requiere registro gratuito** en https://www.space-track.org/auth/createAccount
- **Uso:** Datos de debris y catalogo completo de objetos orbitales

### 7.5 API Alternativa sin Key — Where the ISS At
- **URL:** `https://api.wheretheiss.at/v1/satellites/25544`
- **Gratis, sin API key**
- **Uso:** Fallback para posicion de la ISS en tiempo real

### 7.6 Banderas de Paises
- **URL:** `https://flagcdn.com/{country_code}.svg`
- Si se necesitan banderas para mostrar pais de origen

### Estrategia de datos:
1. **Primera carga:** Obtener TLEs de CelesTrak (gratis, sin key)
2. **Calculos de posicion:** Usar `satellite.js` localmente con los TLEs
3. **Actualizacion:** Refrescar TLEs cada 5 minutos
4. **Fallback:** Si las APIs fallan, usar datos mock hardcodeados que repliquen exactamente los valores del mockup

---

## 8. Interacciones Requeridas

Replicar exactamente las interacciones del mockup:

| Elemento | Comportamiento |
|---|---|
| Nav items (topbar) | Click: seleccion exclusiva, toggle clase `active` |
| Filter chips (panel derecho) | Click: seleccion exclusiva, toggle clase `on` |
| Timeline chips (1D/1W/1M) | Click: seleccion exclusiva |
| HUD buttons (Orbits/Targets/Labels) | Click: toggle individual on/off |
| Satellite rows | Click: seleccion exclusiva + actualizar panel izquierdo + actualizar HUD |
| Satellite rows hover | `background: var(--bg-hover)` con `transition: background .15s` |
| Busqueda | Filtrar la lista de satelites en tiempo real |
| Modal | Abrir al hacer click en un satelite, cerrar con X o click en overlay |
| Reloj | Actualizar cada segundo en formato HH:MM:SS |
| Dot canvas | Dots reaccionan al movimiento del mouse |
| Status dot | Parpadeo continuo (`animation: blink 2s ease-in-out infinite`) |
| Refresh button | Refrescar datos de la API |

---

## 9. Corner Details (Detalles que NO deben faltar)

Estos son detalles sutiles del mockup que son faciles de olvidar:

1. **Corner stars** (`✦`) en las 4 esquinas exteriores de cada panel lateral — via `::before`/`::after`, font-size 8px, `rgba(210,210,215,.30)`
2. **Scrollbar custom:** `width: 3px; thumb: var(--bg-hover); track: transparent`
3. **Data grid dividers:** El `gap: 1px` con `background: var(--border)` crea las lineas divisorias entre celdas
4. **Brand divider:** Linea vertical de 1px x 18px entre el nombre y el subtitulo
5. **Pill variants:** Cada tipo orbital tiene su propio color de texto, borde (30% opacity) y fondo (6% opacity)
6. **Selected satellite row:** `background: var(--red-dim); border-left: 2px solid var(--red);` y nombre en `--red-text`
7. **Timeline head position:** El circulo debe estar exactamente al final del fill (62%)
8. **Modal overlay:** `backdrop-filter: blur(6px)` es obligatorio
9. **HUD cards:** `backdrop-filter: blur(8px)` obligatorio
10. **Event log dots:** Cada evento tiene un dot de color diferente segun severidad

---

## 10. Orden de Implementacion Sugerido

1. **global.css** — Tokens, reset, fuentes, scrollbar, keyframes
2. **DotCanvas.tsx** — Fondo interactivo (es lo primero que se ve)
3. **App.tsx** — Shell con grid layout
4. **Topbar.tsx** — Barra superior con reloj
5. **StatusBar.tsx** — Barra inferior
6. **LeftPanel.tsx** — Panel izquierdo completo
7. **RightPanel.tsx** — Panel derecho con lista de satelites
8. **EarthScene.tsx + Earth.tsx** — Globo 3D
9. **HudOverlay.tsx** — Cards flotantes sobre el globo
10. **Timeline.tsx** — Scrubber de tiempo
11. **SatelliteModal.tsx** — Modal de detalle
12. **satelliteApi.ts** — Conectar APIs reales
13. **Interacciones** — Conectar estado entre componentes
14. **QA visual** — Comparar pixel por pixel contra el mockup

---

## 11. Criterios de Aceptacion

- [ ] El layout es identico al mockup: topbar 44px, paneles laterales 272px/292px, statusbar 34px
- [ ] Los colores coinciden exactamente con los tokens del mockup
- [ ] Las fuentes son Inter + Space Mono con los pesos y tamanos correctos
- [ ] El dot canvas funciona con reaccion al mouse
- [ ] El panel izquierdo muestra: objeto seleccionado, global summary, orbit bars, event log
- [ ] El panel derecho muestra: search, filters, satellite list scrollable, footer
- [ ] El globo 3D se renderiza en el area central
- [ ] Los HUD overlays aparecen con backdrop blur
- [ ] La timeline tiene chips funcionales y el scrubber visual
- [ ] El modal se abre/cierra correctamente con la informacion del satelite
- [ ] Las interacciones (hover, click, seleccion) funcionan como en el mockup
- [ ] El reloj se actualiza en tiempo real
- [ ] El status dot parpadea
- [ ] Los corner stars estan presentes en los paneles
- [ ] El scrollbar es custom (3px, color --bg-hover)
- [ ] Los datos provienen de APIs reales (CelesTrak/N2YO) con fallback a mock
- [ ] No hay diferencias visuales notables respecto al mockup

---

## 12. Lo que NO hacer

- NO cambiar la paleta de colores (nada de cyberpunk/neon, se usa el dark intelligence theme del mockup)
- NO agregar features que no esten en el mockup
- NO usar fuentes diferentes a Inter y Space Mono
- NO cambiar las proporciones del layout
- NO usar sombras agresivas ni gradientes llamativos
- NO agregar bordes blancos puros — siempre usar los tokens rgba del mockup
- NO ignorar los letter-spacing y text-transform uppercase donde el mockup los usa
- NO olvidar los `backdrop-filter: blur()` en HUD cards y modal
