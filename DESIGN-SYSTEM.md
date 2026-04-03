# Design System — Dark Intelligence Dashboard

Diseño base extraído del proyecto **SATTRACK**. Orientado a dashboards de datos densos, visualización científica/técnica y aplicaciones de monitoreo en tiempo real. Inspirado en interfaces de inteligencia operacional.

---

## 1. Filosofía

- **Menos es más:** el fondo y la estructura desaparecen, los datos son el protagonista.
- **Jerarquía por peso, no por color:** los colores de acento son escasos y significativos.
- **Un solo acento cromático** (`#a62c2e`) usado con máxima moderación — solo en estados activos, alertas y selecciones.
- **Sin decoración superflua:** bordes sutiles, sin sombras agresivas, sin gradientes llamativos.

---

## 2. Color Tokens

```css
:root {
  /* Fondos — de más oscuro a más claro */
  --bg:         rgb(32, 33, 36);   /* Fondo base del body       */
  --bg-panel:   #1c1d20;           /* Paneles laterales         */
  --bg-panel2:  #17181b;           /* Topbar, headers, statusbar */
  --bg-hover:   #26272b;           /* Estado hover de filas/nav  */

  /* Bordes — gris claro, nunca blanco puro */
  --border:     rgba(195, 195, 200, 0.15);   /* Borde estándar   */
  --border-med: rgba(210, 210, 215, 0.26);   /* Borde enfatizado */

  /* Texto — escala de grises neutros */
  --text-hi:    #e8e8ea;   /* Texto principal (alta legibilidad) */
  --text-md:    #8c8d92;   /* Texto secundario, metadatos        */
  --text-lo:    #4e4f55;   /* Labels, dims, placeholders         */

  /* Acento rojo — único color saturado del sistema */
  --red:        #a62c2e;                  /* Rojo base            */
  --red-dim:    rgba(166, 44, 46, 0.09);  /* Fondo seleccionado   */
  --red-border: rgba(166, 44, 46, 0.32);  /* Borde de énfasis     */
  --red-text:   #c94244;                  /* Rojo legible en texto */

  /* Acentos de categoría — muy desaturados */
  --cat-a: #7a9e7a;   /* Verde apagado  — LEO / activo / OK      */
  --cat-b: #9e8f6a;   /* Ámbar apagado  — MEO / medio / warning  */
  --cat-c: #7a80a8;   /* Azul apagado   — GEO / info             */
  --cat-d: #8a4a4a;   /* Rojo apagado   — Debris / error         */
}
```

### Reglas de uso del color

| Elemento | Token |
|---|---|
| Texto de datos principal | `--text-hi` |
| Labels / unidades | `--text-md` o `--text-lo` |
| Bordes de paneles | `--border` |
| Hover de filas | `--bg-hover` |
| Estado seleccionado / activo | `--red-dim` + `border-left: 2px solid var(--red)` |
| Alertas, dots de estado crítico | `--red-text` |
| Status OK / online | `#5a9e5a` (verde sistema, fuera del sistema de tokens) |
| Categorías de datos | `--cat-a` a `--cat-d` según severidad/tipo |

---

## 3. Tipografía

| Rol | Fuente | Peso | Tamaño | Notas |
|---|---|---|---|---|
| Brand / nombre de app | `Space Mono` | 700 | 12px | `letter-spacing: 3px` |
| Títulos de sección | `Inter` | 600 | 9px | `uppercase`, `letter-spacing: 2px` |
| Navegación | `Inter` | 400 | 11px | `letter-spacing: 0.5px` |
| Valores numéricos grandes | `Space Mono` | 700 | 14–18px | Monoespaciado garantiza alineación |
| Valores numéricos pequeños | `Space Mono` | 400 | 9–11px | Metadatos de listas |
| Texto de cuerpo / descripciones | `Inter` | 400–500 | 11–13px | `line-height: 1.5` |
| Coordenadas / datos técnicos | `Space Mono` | 400 | 9–11px | — |
| Unidades (km, km/s, °) | `Inter` | 400 | 9–10px | `color: --text-md`, inline |

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
```

---

## 4. Layout

### Shell principal

```
┌─────────────────────────────────────┐  44px  — Topbar
├──────────┬──────────────┬───────────┤
│          │              │           │
│  Panel   │    Centro    │   Panel   │  flex: 1
│  Izq.    │  (viewport)  │   Der.    │
│  272px   │     1fr      │   292px   │
│          │              │           │
├─────────────────────────────────────┤  34px  — Status bar
└─────────────────────────────────────┘
```

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

### Principios de layout
- El área central es **siempre transparente** — el fondo dot-grid se ve a través de ella.
- Los paneles laterales tienen `background: var(--bg-panel)` opaco.
- Topbar y statusbar usan `var(--bg-panel2)` (tono más oscuro) para crear profundidad.

---

## 5. Componentes

### 5.1 Topbar

- Altura fija: **44px**
- `background: var(--bg-panel2)` + `border-bottom: 1px solid var(--border)`
- Estructura: `[Brand + Divisor + Subtítulo + Nav]` — `[Status badge + Reloj]`
- El nombre de marca usa `Space Mono 700` con `letter-spacing: 3px`
- Divisor vertical: `1px` de alto `18px`, color `var(--border-med)`

### 5.2 Paneles laterales

- `background: var(--bg-panel)`
- Borde interior: `1px solid var(--border)` (derecha en panel izq., izquierda en panel der.)
- **Corner stars:** decoración `✦` en las 4 esquinas exteriores via `::before` / `::after`

```css
.panel::before, .panel::after {
  content: '✦';
  position: absolute;
  font-size: 8px;
  color: rgba(210, 210, 215, 0.30);
}
```

### 5.3 Section Header

Separa bloques dentro de un panel.

```css
.sec-head {
  padding: 9px 15px;
  background: var(--bg-panel2);
  border-bottom: 1px solid var(--border);
}
/* título: 9px, 600, uppercase, letter-spacing: 2px, color: --text-md */
/* badge:  Space Mono 9px, border: 1px solid --border, border-radius: 2px */
```

### 5.4 Data Grid (métricas 2×N)

```css
.data-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--border);   /* el gap toma el color del borde */
  border: 1px solid var(--border);
  border-radius: 3px;
  overflow: hidden;
}
.dc {
  padding: 9px 11px;
  background: var(--bg);
}
/* label: 9px, uppercase, letter-spacing: 1px, --text-lo */
/* valor: Space Mono 14px, 700, --text-hi */
/* unidad: Inter 10px, --text-md, inline */
```

### 5.5 Pills de categoría

```css
.pill {
  font-size: 9px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 2px;
  border: 1px solid;
}
```

Variantes: color de texto + borde + fondo con `0.06` de opacidad del mismo color.

### 5.6 Filas de lista (Satellite Feed)

```css
.sat-row {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 10px 13px;
  border-bottom: 1px solid var(--border);
  transition: background .15s;
}
.sat-row:hover  { background: var(--bg-hover); }
.sat-row.on     { background: var(--red-dim); border-left: 2px solid var(--red); }
.sat-row.on .sr-name { color: var(--red-text); }
```

Anatomía de cada fila: `[dot 5px] [nombre + metadatos] [altitud + pill]`

### 5.7 Chips de filtro / tiempo

```css
.chip {
  font-size: 9px;
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 3px 8px;
  border: 1px solid var(--border);
  border-radius: 2px;
  color: var(--text-lo);
  transition: all .15s;
}
.chip.on {
  color: var(--text-hi);
  border-color: var(--red-border);
  background: var(--red-dim);
}
```

### 5.8 HUD Overlay (sobre viewport)

Tarjetas flotantes sobre el área de visualización central.

```css
.hud-card {
  padding: 10px 12px;
  background: rgba(20, 21, 24, 0.82);
  border: 1px solid var(--border);
  border-radius: 3px;
  backdrop-filter: blur(8px);
}
```

### 5.9 Timeline / Scrubber

- Fondo: `var(--bg-panel2)` + `border-top: 1px solid var(--border)`
- Track: `height: 2px`, fill con `rgba(166, 44, 46, 0.45)`
- Head (cursor): `9px` circle, `background: var(--red)`
- Chips de rango activos: usan `--red-dim` y `--red-border`

### 5.10 Modal

```css
.modal {
  background: var(--bg-panel);
  border: 1px solid var(--border-med);
  border-radius: 4px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}
/* overlay: rgba(10,11,14,.72) + backdrop-filter: blur(6px) */
```

### 5.11 Scrollbar

```css
::-webkit-scrollbar       { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--bg-hover); border-radius: 2px; }
/* Firefox: scrollbar-width: thin; scrollbar-color: var(--bg-hover) transparent; */
```

### 5.12 Status dot (indicador online/offline)

```css
.sys-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: #5a9e5a;   /* online */
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:.25} }
```

---

## 6. Fondo interactivo — Dot Grid

El elemento más característico del diseño. Canvas fijo detrás de todo el contenido con dots que reaccionan al cursor.

```html
<canvas id="dot-canvas"></canvas>
```

```css
#dot-canvas {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
/* El contenido va en z-index: 1 */
```

```js
(function () {
  const canvas = document.getElementById('dot-canvas');
  const ctx    = canvas.getContext('2d');

  const SPACING = 10;    // px entre dots — más bajo = más denso
  const R_BASE  = 1.0;   // radio normal
  const R_LIT   = 1.15;  // radio al pasar el mouse
  const A_BASE  = 0.18;  // alpha normal
  const A_LIT   = 0.55;  // alpha con mouse encima
  const REACH   = 110;   // radio de influencia del cursor (px)

  let mx = -9999, my = -9999;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cols = Math.ceil(canvas.width  / SPACING) + 1;
    const rows = Math.ceil(canvas.height / SPACING) + 1;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const x = c * SPACING + SPACING * 0.5;
        const y = r * SPACING + SPACING * 0.5;
        const d = Math.hypot(x - mx, y - my);
        const t = d < REACH ? Math.pow(1 - d / REACH, 1.6) : 0;
        const radius = R_BASE + (R_LIT - R_BASE) * t;
        const alpha  = A_BASE + (A_LIT  - A_BASE) * t;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 220, 225, ${alpha})`;
        ctx.fill();
      }
    }
  }

  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; draw(); });
  resize();
})();
```

**Parámetros ajustables:**

| Parámetro | Valor usado | Efecto |
|---|---|---|
| `SPACING` | `10` | Distancia entre dots. Más bajo = más denso |
| `R_BASE` | `1.0` | Tamaño normal del dot |
| `R_LIT` | `1.15` | Tamaño al activarse con el cursor |
| `A_BASE` | `0.18` | Opacidad normal |
| `A_LIT` | `0.55` | Opacidad al activarse |
| `REACH` | `110` | Radio de influencia del cursor en px |
| Color | `rgba(220, 220, 225, α)` | Color blanco-gris de los dots |
| Falloff | `Math.pow(…, 1.6)` | Curva de decaimiento (mayor = más abrupto) |

---

## 7. Micro-interacciones

| Elemento | Interacción | Implementación |
|---|---|---|
| Filas de lista | Hover resalta fondo | `transition: background .15s` |
| Fila seleccionada | Borde izquierdo rojo + fondo rojo-dim | `.on` class via JS |
| Nav items | Hover cambia color + fondo | `transition: all .2s` |
| HUD buttons | Toggle on/off | `.classList.toggle('on')` |
| Chips de filtro | Selección exclusiva | JS quita `.on` de todos, añade al clickeado |
| Dots del cursor | Glow suave al acercarse | Canvas redraw en `mousemove` |
| Status dot | Parpadeo continuo | `animation: blink 2s ease-in-out infinite` |
| Reloj | Actualización en tiempo real | `setInterval` / recursivo con `setTimeout` |

---

## 8. Bordes y separadores

- **Paneles:** `1px solid rgba(195, 195, 200, 0.15)` — visible pero no agresivo
- **Section headers:** `border-bottom: 1px solid var(--border)`
- **Filas de lista:** `border-bottom: 1px solid var(--border)`
- **Data grid:** el `gap: 1px` con `background: var(--border)` crea líneas divisorias
- **Nunca:** `border: 1px solid white` ni sombras muy marcadas

---

## 9. Adaptación a otros proyectos

Para reutilizar este sistema en un proyecto diferente:

1. **Copiar los tokens CSS** del bloque `:root` (sección 2).
2. **Reemplazar los acentos de categoría** (`--cat-a/b/c/d`) con los colores semánticos del dominio.
3. **Mantener el rojo `#a62c2e`** solo para el estado seleccionado/activo y alertas críticas.
4. **Importar las fuentes** `Inter` + `Space Mono`.
5. **Agregar el dot-grid canvas** como fondo (sección 6) — funciona en cualquier página.
6. **Ajustar las columnas** del body-grid según necesidad del proyecto.

### Proyectos donde aplica bien este sistema
- Dashboards de monitoreo (servidores, redes, infraestructura)
- Herramientas de análisis de datos en tiempo real
- Aplicaciones de trading / finanzas
- Paneles de control industriales / IoT
- Visualizaciones científicas o geoespaciales
- Herramientas internas de operaciones

---

## 10. Archivos de referencia

| Archivo | Descripción |
|---|---|
| `design-mockup.html` | Implementación completa del sistema (versión actual) |
| `design-mockup.bkp.html` | Backup de versión anterior |
