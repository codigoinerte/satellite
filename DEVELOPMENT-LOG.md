# SATTRACK — Development Log

**Proyecto:** Dashboard de inteligencia orbital con globo 3D  
**Stack:** React 19 + TypeScript + Vite 8 + Three.js/R3F + Framer Motion  
**Ultima actualizacion:** 3 de Abril, 2026  
**Estado:** En desarrollo activo — globo realista implementado

---

## Historial de Implementacion

### Fase 1 — Baseline y Design System (ea6463a → ef35918)

**Objetivo:** Implementar la interfaz del mockup `design-mockup.html` pixel-perfect en React.

**Completado:**
- Tokens CSS exactos del mockup (paleta gris/negro, Inter + Space Mono)
- Layout grid: Topbar 44px | LeftPanel 272px + Center 1fr + RightPanel 292px | StatusBar 34px
- DotCanvas — fondo interactivo con dots reactivos al cursor
- Topbar — brand SATTRACK, nav, reloj UTC en tiempo real, status dot
- StatusBar — source info, refresh, version
- LeftPanel — selected object, global summary, orbit bars, event log
- RightPanel — search, filter chips, satellite list scrollable, refresh button
- SatelliteModal — detalle orbital con backdrop blur
- HudOverlay — cards flotantes con coordenadas y botones toggle
- Timeline — scrubber con chips 1D/1W/1M
- Todas las interacciones del mockup (hover, click, seleccion exclusiva)

**Archivos clave:**
- `src/styles/global.css` — tokens CSS del design system
- `src/App.tsx` — shell principal con grid layout
- `src/components/UI/` — LeftPanel, RightPanel, HudOverlay, Timeline, SatelliteModal, DotCanvas
- `src/components/Layout/` — Topbar, StatusBar

**Referencia:** `IMPLEMENTATION-PROMPT.md`, `DESIGN-SYSTEM.md`

---

### Fase 2 — Rediseno del Globo (3e0ed50 → e48fa32)

**Objetivo:** Cambiar el globo de paleta azul/cyberpunk a gris/negro operacional.

**Completado:**
- Eliminacion de todos los tonos azules del globo anterior
- Grid latitud/longitud con opacidades diferenciadas (ecuador, tropicos, polares)
- Continentes como manchas elipticas procedurales en gris
- 3 anillos orbitales: LEO solido, MEO dashed, exterior dotted rojo
- Atmosfera gris BackSide
- Viewport sizing corregido (width/height 100%, flex)

**Nota:** Esta fase fue descartada en favor de un globo realista (Fase 3).

**Referencia:** `GLOBE-REDESIGN-PROMPT.md`

---

### Fase 3 — Globo Realista con Texturas (0f03309 → 8771735)

**Objetivo:** Implementar un globo terraqueo realista basado en el ejemplo `webgpu_tsl_earth.html` de three.js.

#### Iteracion 1 — Canvas 2D procedural (descartada)
- Texturas Canvas 2D con ellipses de gradiente — no se veian realistas
- ShaderMaterial GLSL con errores de compilacion
- Resultado: esfera negra con destellos

#### Iteracion 2 — MeshStandardMaterial + texturas CDN (descartada)
- Texturas reales de CDN (three-globe) pero iluminacion demasiado debil
- MeshPhongMaterial con bumpMap
- Luces nocturnas visibles en ambos lados (no solo el oscuro)

#### Iteracion 3 — GLSL custom shaders (ACTUAL)
**Commit:** `8909ee1` — Traduccion de TSL a GLSL

**Logica del shader (fragment):**
```
sunOrientation = dot(worldNormal, sunDirection)   // por pixel
dayStrength = smoothstep(-0.25, 0.5, sunOrientation)
earthColor = mix(nightTexture, litDayColor, dayStrength)

// Atmosfera fresnel
fresnel = 1.0 - abs(dot(viewDir, normal))
atmMix = smoothstep(-0.5, 1.0, sunOrientation) * fresnel²
finalColor = mix(earthColor, atmosphereColor, atmMix)
```

**Caracteristicas implementadas:**
- **Textura dia:** Fotografia satelital real (`earth-day.jpg` desde CDN)
- **Textura noche:** Luces de ciudades NASA (`earth-night.jpg`)
- **Bump mapping:** Elevacion del terreno (`earth-topology.png`)
- **Specular mask:** Oceano brilla, tierra mate (`earth-water.png`)
- **Nubes:** Mesh separado con textura (`earth-clouds.png`), rota 15% mas rapido
- **Day/Night:** smoothstep en shader — luces nocturnas SOLO en el lado oscuro
- **Iluminacion:** Lambert diffuse + Blinn-Phong specular (power 40)
- **Atmosfera globo:** Fresnel² × sun-facing, color azul
- **Atmosfera mesh:** BackSide 1.04 scale, fresnel > 0.65, alpha pow(3)
- **3 anillos orbitales:** LEO solido, MEO dashed, exterior dotted rojo (#a62c2e)

**Commit:** `8771735` — Atmosfera azulada + nubes
- Atmosfera cambiada de naranja/azul (twilight) a azul completo
- Lado iluminado: azul claro (0.4, 0.7, 1.0)
- Lado oscuro: azul profundo (0.15, 0.35, 0.65)
- Nubes como mesh independiente a radio 5.06

**Texturas CDN (todas de `unpkg.com/three-globe@2.31.1`):**
| Archivo | Uso |
|---|---|
| `earth-day.jpg` | Color diurno (fotografia satelital) |
| `earth-night.jpg` | Luces nocturnas (NASA) |
| `earth-topology.png` | Bump mapping (elevacion) |
| `earth-water.png` | Specular mask (oceano vs tierra) |
| `earth-clouds.png` | Capa de nubes |

**Archivos:**
- `src/components/Earth/Earth.tsx` — Globo con GLSL shaders + texturas
- `src/components/Earth/EarthScene.tsx` — Canvas R3F, iluminacion, controles

---

### Fix — CelesTrak API (edf2c8c)

**Problema:** URL antigua `https://celestrak.org/GP/query.php` devuelve 404  
**Solucion:** Cambiada a `https://celestrak.org/NORAD/elements/gp.php`  
**Fallback:** Si la API falla, usa datos mock (20 satelites predefinidos)  
**Archivo:** `src/services/satelliteApi.ts`

---

## Arquitectura Actual

```
src/
  App.tsx                          — Shell grid (44px / 272-1fr-292 / 34px)
  main.tsx                         — Entry point
  styles/global.css                — Design tokens + componentes CSS
  components/
    Earth/
      Earth.tsx                    — Globo 3D (GLSL shaders + texturas CDN)
      EarthScene.tsx               — Canvas R3F + iluminacion + controles
    Layout/
      Topbar.tsx                   — Barra superior
      StatusBar.tsx                — Barra inferior
    UI/
      DotCanvas.tsx                — Fondo interactivo dots
      LeftPanel.tsx                — Panel izquierdo (selected, stats, events)
      RightPanel.tsx               — Panel derecho (search, list, filters)
      HudOverlay.tsx               — Cards flotantes sobre globo
      Timeline.tsx                 — Scrubber de tiempo
      SatelliteModal.tsx           — Modal detalle satelite
  services/
    satelliteApi.ts                — CelesTrak API + mock fallback
  types/
    satellite.ts                   — Tipos TypeScript
```

---

## APIs y Datos

| Fuente | URL | Uso | Key |
|---|---|---|---|
| CelesTrak | `celestrak.org/NORAD/elements/gp.php` | TLE data (posiciones) | No |
| three-globe CDN | `unpkg.com/three-globe@2.31.1` | Texturas Earth | No |
| satellite.js | Libreria local | Propagacion orbital | N/A |

---

## Decisiones Tecnicas

1. **GLSL en vez de TSL:** El ejemplo three.js usa TSL (WebGPU only). Traducimos toda la logica a GLSL clasico para compatibilidad WebGL universal.

2. **Texturas CDN en vez de procedurales:** Canvas 2D procedural nunca se vio realista. Las texturas fotograficas de three-globe son la solucion correcta.

3. **Shader unico para day/night:** En vez de 2 meshes separados (dia+noche con blending), un solo ShaderMaterial calcula todo por pixel basado en sunDirection. Resultado: luces nocturnas solo visibles en el lado oscuro.

4. **Nubes como mesh separado:** A diferencia del ejemplo (nubes en shader), las nubes son un mesh independiente a radio 5.06 con rotacion ligeramente mas rapida. Esto simplifica el shader y permite toggle de nubes.

5. **Atmosfera dual:** Fresnel en el shader del globo + mesh BackSide separado. El mesh BackSide da el halo visible, el fresnel del shader da el tinte en los bordes.

---

## Pendiente / Ideas Futuras

- [ ] Marcadores de satelite 3D sobre el globo (puntos coloreados por tipo orbital)
- [ ] Crosshairs rojos (#a62c2e) sobre regiones de interes
- [ ] Labels HTML posicionados en 3D (usando `Html` de drei)
- [ ] Bump mapping mejorado con normal map dedicado
- [ ] Toggle de capas (nubes, orbitas, labels) desde HUD buttons
- [ ] Conexion de seleccion de satelite con posicion 3D en el globo
- [ ] Animacion de satelites orbitando el globo en tiempo real
- [ ] Stars background (campo de estrellas)
