# Directivas de Rediseno — Globo Terraqueo 3D (Three.js)

## Objetivo

Redisenar el componente del globo terraqueo 3D (`Earth.tsx` + `EarthScene.tsx`) para que coincida visualmente con:

1. **El mockup CSS** de `design-mockup.html` (lineas 293-359) — referencia de color, opacidad y estilo
2. **La imagen de referencia** (dashboard de inteligencia) — referencia de estetica general y atmosfera

El globo actual usa colores azules (#0a3d5c, #2a7a9a) que NO corresponden al diseno. El diseno correcto es un globo **oscuro, casi negro**, con grid y continentes en **gris neutro muy sutil**, estilo inteligencia militar / operacional.

---

## 2. Referencia Visual del Mockup (CSS)

El mockup define el globo con estas caracteristicas exactas:

### Esfera base
```
background: radial-gradient(circle at 38% 34%, #1e1f22 0%, #0e0f11 100%)
border: 1px solid rgba(195, 195, 200, 0.12)
```
- Color: **gris muy oscuro casi negro** (#1e1f22 a #0e0f11)
- Punto de luz sutil desplazado arriba-izquierda (38%, 34%)
- Borde extremadamente tenue

### Lineas de latitud
- 5 lineas horizontales a diferentes alturas del globo
- **Ecuador** (50%): `rgba(195, 195, 200, 0.18)` — la mas visible
- **Tropicos** (35%, 65%): `rgba(195, 195, 200, 0.08)` — tenues
- **Polares** (20%, 80%): `rgba(195, 195, 200, 0.05)` — casi invisibles
- Grosor: **1px** (sub-pixel, 0.5px en cada lado)

### Continentes
Formas difusas en gris claro, NO siluetas realistas sino manchas sugeridas:
- **Norteamerica:** ellipse en posicion 24% 38%, tamano 54x58px, opacidad 0.18
- **Sudamerica:** ellipse en posicion 28% 62%, tamano 34x52px, opacidad 0.15
- **Europa:** ellipse en posicion 50% 32%, tamano 28x24px, opacidad 0.18
- **Africa:** ellipse en posicion 50% 57%, tamano 38x58px, opacidad 0.15
- **Asia:** ellipse en posicion 68% 34%, tamano 78x48px, opacidad 0.16
- **Oceania:** ellipse en posicion 75% 64%, tamano 28x20px, opacidad 0.13
- Color base de todos: `rgba(195, 195, 200, alpha)` — gris neutro

### Specular highlight
```
radial-gradient(ellipse 50% 44% at 34% 30%, rgba(255,255,255,0.04) 0%, transparent 60%)
```
- Brillo extremadamente sutil (4% opacidad blanca)
- Posicion: arriba-izquierda
- Sugiere iluminacion direccional sin ser obvia

---

## 3. Referencia Visual de la Imagen (Pinterest)

La imagen de referencia muestra un dashboard de inteligencia con un globo que tiene estas caracteristicas:

### Estetica general
- **Estilo:** Wireframe oscuro de inteligencia militar/operacional
- **Tono:** Monocromatico gris sobre fondo negro
- **Sensacion:** Denso en datos, tecnico, sobrio

### Globo
- Esfera oscura con grid de latitud/longitud visible
- Continentes visibles como masas ligeramente mas claras que el oceano
- Borde de la esfera con un halo/glow muy sutil
- Lineas de grid finas en gris claro con baja opacidad
- El globo tiene una inclinacion natural (eje terrestre)

### Marcadores
- Puntos de interes marcados con **crosshairs rojos** (+) sobre regiones
- Labels de texto en rojo junto a los crosshairs (ej: "USA", "AFRICA")
- Los crosshairs son pequenos (12px) con lineas de 1px

### Orbitas
- Anillos elipticos alrededor del globo
- Diferentes opacidades y estilos (solido, dashed, dotted)
- Inclinados en diferentes angulos

---

## 4. Problemas del Globo Actual

Archivo: `src/components/Earth/Earth.tsx`

| Problema | Valor actual | Valor correcto |
|---|---|---|
| Color de la esfera | `#0a3d5c` (azul oscuro) | `#1e1f22` a `#0e0f11` (gris casi negro) |
| Emissive | `#001a2e` (azul) | `#0e0f11` (gris oscuro) |
| Wireframe color | `#2a7a9a` (azul) | `rgba(195, 195, 200, 0.12)` (gris neutro) |
| Wireframe opacidad | 0.15 | 0.08 a 0.12 |
| Atmosfera color | `#1a5f7a` (azul) | `rgba(195, 195, 200, 0.06)` (gris) |
| Atmosfera emissive | `#0a3d5c` (azul) | Ningun azul — solo gris |
| Anillos orbitales | Todos iguales, lineBasicMaterial | 3 estilos: solido, dashed, dotted |
| Faltan | — | Continentes, specular, crosshairs, marcadores |

**Diagnostico:** El globo actual tiene una paleta azul-oceanica que pertenece al tema cyberpunk anterior. El nuevo diseno es estrictamente **monocromatico gris/negro** con un unico acento rojo (#a62c2e).

---

## 5. Especificaciones de Implementacion

### 5.1 Esfera Principal

```
Material: MeshStandardMaterial o ShaderMaterial custom
Color base: #131416 (promedio entre #1e1f22 y #0e0f11)
Roughness: 0.9 (casi sin reflejo)
Metalness: 0.1 (minimo brillo metalico)
Tamano: radio 5 unidades (mantener)
Segmentos: 64x64 (mantener resolucion)
```

**Efecto de gradiente radial (iluminacion):**
- Una point light tenue posicionada arriba-izquierda (posicion: [-3, 4, 8])
- Intensidad baja (~0.6) para crear el gradiente de #1e1f22 a #0e0f11
- Color de la luz: `#c3c3c8` (gris claro, NO blanco puro, NO azul)

### 5.2 Grid de Latitud/Longitud

Implementar con un segundo mesh de wireframe sobre la esfera:

```
Opcion A — Wireframe mesh:
  Material: MeshBasicMaterial wireframe
  Color: #c3c3c8
  Opacidad: 0.08 (muy sutil)
  Tamano: radio 5.005 (ligeramente mayor que la esfera para evitar z-fighting)

Opcion B — LineSegments custom (RECOMENDADA):
  Crear lineas de latitud y longitud como LineSegments separados
  Esto permite controlar la opacidad de cada linea individualmente:
  - Ecuador (0°): opacidad 0.18
  - Tropicos (±23.5°): opacidad 0.08
  - Circulos polares (±66.5°): opacidad 0.05
  - Meridianos cada 30°: opacidad 0.06
  Color de todas: #c3c3c8
  Grosor: 1 (linewidth en WebGL)
```

### 5.3 Continentes

**Enfoque recomendado: Textura procedural en Canvas 2D**

Generar un canvas 2D offscreen, pintar manchas elipticas difusas (como las del mockup), y usarlo como texture map sobre la esfera.

```javascript
// Pseudocodigo:
const canvas = document.createElement('canvas');
canvas.width = 1024;
canvas.height = 512;
const ctx = canvas.getContext('2d');

// Fondo transparente (los continentes son overlay)
ctx.clearRect(0, 0, 1024, 512);

// Cada continente es un gradiente eliptico difuso
const continents = [
  // [x%, y%, radiusX, radiusY, alpha]
  [0.24, 0.38, 70, 75, 0.18],  // Norteamerica
  [0.28, 0.62, 44, 68, 0.15],  // Sudamerica
  [0.50, 0.32, 36, 31, 0.18],  // Europa
  [0.50, 0.57, 49, 75, 0.15],  // Africa
  [0.68, 0.34, 101, 62, 0.16], // Asia
  [0.75, 0.64, 36, 26, 0.13],  // Oceania
];

continents.forEach(([cx, cy, rx, ry, alpha]) => {
  const gradient = ctx.createRadialGradient(
    cx * 1024, cy * 512, 0,
    cx * 1024, cy * 512, Math.max(rx, ry)
  );
  gradient.addColorStop(0, `rgba(195, 195, 200, ${alpha})`);
  gradient.addColorStop(1, 'rgba(195, 195, 200, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(cx * 1024, cy * 512, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
});

const texture = new THREE.CanvasTexture(canvas);
```

Aplicar esta textura como `emissiveMap` o como segundo mesh transparente encima de la esfera.

**Alternativa: Textura de mapa real (mejor resultado)**

Descargar una textura de continentes estilo outline/wireframe de fuentes open-source:
- NASA Blue Marble en escala de grises con contraste muy bajo
- Natural Earth data rasterizado en gris
- URL sugerida: `https://unpkg.com/three-globe/example/img/earth-dark.jpg`
- Aplicar como `map` con opacidad muy baja o como `emissiveMap` con `emissiveIntensity: 0.15`

Si se usa textura real, ajustar brillo/contraste para que los continentes sean manchas sutiles gris (#c3c3c8) sobre fondo casi negro, NO colores vivos.

### 5.4 Specular Highlight

Crear un mesh adicional (esfera ligeramente mayor) con ShaderMaterial que simule el brillo:

```
Posicion del highlight: arriba-izquierda (34% desde izquierda, 30% desde arriba)
Color: rgba(255, 255, 255, 0.04)
Forma: elipse difusa
Falloff: 60% del radio de la esfera
```

Alternativa mas simple: usar una point light posicionada arriba-izquierda con:
```
color: #ffffff
intensity: 0.15
position: [-3, 4, 8]
```

### 5.5 Atmosfera / Borde Glow

```
Mesh: Esfera con radio 5.08 (ligeramente mayor)
Material: MeshBasicMaterial
  color: #c3c3c8 (gris, NO azul)
  transparent: true
  opacity: 0.04
  side: THREE.BackSide
  depthWrite: false
```

Tambien considerar un Fresnel shader para un glow de borde mas convincente:
```glsl
// Vertex shader
varying float vFresnel;
void main() {
  vec3 viewDir = normalize(cameraPosition - (modelMatrix * vec4(position, 1.0)).xyz);
  vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vFresnel = pow(1.0 - dot(viewDir, worldNormal), 3.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
// Fragment shader
varying float vFresnel;
void main() {
  gl_FragColor = vec4(0.76, 0.76, 0.78, vFresnel * 0.12);
}
```

### 5.6 Anillos Orbitales

3 anillos con estilos diferentes (mapeados desde el mockup CSS):

```
Anillo 1 (LEO ~460px en mockup):
  Radio: 6.5 unidades
  Inclinacion: rotateX(72°)
  Estilo: SOLIDO
  Color: rgba(195, 195, 200, 0.14)

Anillo 2 (MEO ~520px en mockup):
  Radio: 7.5 unidades
  Inclinacion: rotateX(60°) rotateZ(42°)
  Estilo: DASHED (segmentos)
  Color: rgba(195, 195, 200, 0.07)
  dashSize: 0.3, gapSize: 0.15

Anillo 3 (zona exterior ~590px en mockup):
  Radio: 8.5 unidades
  Inclinacion: rotateX(54°) rotateZ(-22°)
  Estilo: DOTTED (segmentos mas pequenos)
  Color: rgba(166, 44, 46, 0.07) — ROJO MUY TENUE (acento del sistema)
  dashSize: 0.08, gapSize: 0.15
```

Implementar con `THREE.Line` y `LineDashedMaterial` para los anillos dashed/dotted. Llamar `line.computeLineDistances()` para que funcione el dashing.

### 5.7 Marcadores de Satelite (3D)

Puntos en la superficie del globo que representan satelites rastreados:

```
Geometria: SphereGeometry(0.04, 8, 8)  — puntos pequenos
Posicion: Convertir lat/lon a coordenadas 3D sobre la esfera (radio 5.02)

Colores segun tipo (del design system):
  - ISS / generico: #c8c8ca con glow box-shadow rgba(200,200,202,0.4)
  - LEO activo: #7a9e7a (--leo) con glow rgba(122,158,122,0.4)
  - MEO: #9e8f6a (--meo) con glow rgba(158,143,106,0.4)
  - GEO: #7a80a8 (--geo) con glow rgba(122,128,168,0.4)
  - Seleccionado: #a62c2e (--red) con glow mas intenso

Comportamiento al hover:
  - Escalar x2 (transform: scale(2))
  - Mostrar label con nombre del satelite
  - Label: Space Mono 9px, color #8c8d92

Implementacion del glow:
  - PointLight adjunto a cada marcador con intensidad 0.3 y distance 0.5
  - O sprite con textura radial glow
```

### 5.8 Crosshair Targets (3D)

Marcadores de objetivo tipo cruz (+) sobre el globo:

```
Geometria: Dos lineas cruzadas (LineSegments)
  - Linea vertical: 0.15 unidades de alto
  - Linea horizontal: 0.15 unidades de ancho
  - Grosor: 1px
  - Color: #a62c2e (--red)

Posiciones (del mockup):
  - USA: ~lat 38°N, lon 97°W
  - AFRICA: ~lat 5°S, lon 20°E

Label al hover:
  - Space Mono 9px
  - Color: #c94244 (--red-text)
  - Aparece con transicion de opacidad
```

Para los labels en 3D, usar `Html` de `@react-three/drei` para renderizar texto HTML posicionado en 3D.

### 5.9 Iluminacion

Reemplazar la iluminacion actual completamente:

```
ELIMINAR:
  - pointLight position=[10,10,10] intensity=1  (demasiado brillante)
  - pointLight position=[-10,-10,5] intensity=0.3 (no necesario)
  - Environment preset="night" (agrega reflejos no deseados)

NUEVO SETUP:
  ambientLight:
    intensity: 0.3
    color: #c3c3c8 (gris neutro, NO blanco)

  pointLight (luz principal — simula el highlight del mockup):
    position: [-4, 5, 10]
    intensity: 0.5
    color: #d0d0d5 (gris claro)
    distance: 30
    decay: 2

  pointLight (fill sutil desde abajo):
    position: [3, -3, 5]
    intensity: 0.1
    color: #c3c3c8
```

### 5.10 EarthScene.tsx — Configuracion del Canvas

```jsx
<Canvas
  camera={{ position: [0, 2, 14], fov: 42 }}
  style={{ width: '100%', height: '100%', background: 'transparent' }}
  gl={{ alpha: true, antialias: true }}
>
```

- `alpha: true` para que el fondo sea transparente (se ve el dot-canvas debajo)
- `fov: 42` (ligeramente mas angosto que 45 para un look mas "cinematico")
- Camera ligeramente elevada (y: 2) para ver la inclinacion natural del eje terrestre
- **NO usar Environment** — no queremos reflejos de HDRI, solo iluminacion controlada

OrbitControls:
```jsx
<OrbitControls
  enableZoom={true}
  enablePan={false}  // Pan deshabilitado (el mockup no lo usa)
  autoRotate={true}
  autoRotateSpeed={0.3}  // Mas lento que el actual (0.5)
  minDistance={10}
  maxDistance={22}
  enableDamping={true}
  dampingFactor={0.05}
/>
```

---

## 6. Rotacion del Globo

- **Velocidad de auto-rotacion:** 0.0002 rad/frame (mantener, es correcta)
- **Inclinacion del eje:** Rotar el grupo del globo -23.4° en X para simular la inclinacion real de la Tierra
- La atmosfera y el grid deben rotar sincronizados con la esfera

```jsx
<group rotation={[-0.408, 0, 0]}> {/* -23.4° en radianes */}
  <Earth />
</group>
```

---

## 7. Fondo del Area Central

El area detras del globo debe ser transparente para que se vea el dot-canvas. Ademas, el mockup CSS tiene un gradiente radial sutil sobre el area:

```css
.globe-area::before {
  content: '';
  position: absolute; inset: 0;
  background: radial-gradient(
    ellipse 60% 60% at 50% 55%,
    rgba(50, 51, 56, 0.8) 0%,
    transparent 70%
  );
  pointer-events: none;
}
```

Este gradiente crea un "halo" oscuro detras del globo que ayuda a separarlo del fondo. Debe implementarse como un div CSS, NO en Three.js.

---

## 8. Paleta de Colores Permitida

Solo estos colores estan permitidos en el globo y su entorno:

| Elemento | Color | Opacidad |
|---|---|---|
| Esfera base (claro) | `#1e1f22` | 1.0 |
| Esfera base (oscuro) | `#0e0f11` | 1.0 |
| Grid, bordes, lineas | `#c3c3c8` / `rgba(195,195,200,x)` | 0.05–0.18 |
| Continentes | `#c3c3c8` / `rgba(195,195,200,x)` | 0.13–0.18 |
| Specular highlight | `#ffffff` | 0.04 |
| Atmosfera glow | `#c3c3c8` | 0.04–0.08 |
| Anillo 1 (LEO) | `#c3c3c8` | 0.14 |
| Anillo 2 (MEO) | `#c3c3c8` | 0.07 |
| Anillo 3 (rojo tenue) | `#a62c2e` | 0.07 |
| Marcadores LEO | `#7a9e7a` | 1.0 |
| Marcadores MEO | `#9e8f6a` | 1.0 |
| Marcadores GEO | `#7a80a8` | 1.0 |
| Marcadores seleccion | `#a62c2e` | 1.0 |
| Crosshairs | `#a62c2e` | 1.0 |
| Labels crosshair | `#c94244` | 1.0 |

**PROHIBIDO:** Cualquier tono de azul (#0a3d5c, #2a7a9a, #1a5f7a, #001a2e, etc.)

---

## 9. Texturas Open-Source Sugeridas

Si se necesita una textura de continentes mas realista que las manchas procedurales:

### Opcion 1 — Three-globe earth-dark (RECOMENDADA)
```
URL: https://unpkg.com/three-globe/example/img/earth-dark.jpg
Tipo: JPEG, mapa equirectangular
Estilo: Continentes oscuros sobre fondo negro
Uso: Cargar con THREE.TextureLoader, aplicar como map
Ajuste: Reducir intensidad via emissiveIntensity o mezclar con color oscuro
```

### Opcion 2 — NASA Black Marble
```
URL: https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg
Tipo: JPEG de alta resolucion
Estilo: Luces nocturnas de la Tierra (puntos brillantes en ciudades)
Uso: Ideal como emissiveMap para dar vida sutil al globo
Ajuste: Reducir emissiveIntensity a 0.1-0.15 para mantener estilo sobrio
```

### Opcion 3 — Earth topology outline
```
URL: https://unpkg.com/three-globe/example/img/earth-topology.png
Tipo: PNG con transparencia
Estilo: Lineas de contorno de continentes
Uso: Como alphaMap o como overlay transparente
```

### Procesamiento de textura
Si la textura tiene colores que no coinciden con el design system:
1. Cargar la textura
2. Convertirla a escala de grises via shader o canvas 2D
3. Reducir contraste para que solo sean manchas sutiles
4. Aplicar con opacidad baja (0.1-0.2)

---

## 10. Orden de Implementacion

1. **Cambiar colores de la esfera** — De azul a gris oscuro (#131416)
2. **Cambiar iluminacion** — Eliminar luces azules, usar gris neutro
3. **Eliminar Environment** — No usar preset HDRI
4. **Rehacer wireframe/grid** — Lineas de lat/lon con opacidades diferenciadas
5. **Agregar continentes** — Textura procedural o textura descargada
6. **Agregar specular** — Highlight sutil arriba-izquierda
7. **Rehacer atmosfera** — Glow gris en borde (Fresnel o BackSide mesh)
8. **Rehacer anillos orbitales** — 3 estilos (solido, dashed, dotted)
9. **Agregar marcadores** — Puntos de satelite sobre la esfera
10. **Agregar crosshairs** — Marcadores de objetivo con labels
11. **Ajustar camara** — FOV, posicion, limites de zoom
12. **QA visual** — Comparar contra mockup y referencia

---

## 11. Criterios de Aceptacion

- [ ] La esfera es gris oscuro (#1e1f22 a #0e0f11), NO azul
- [ ] No hay NINGUN tono de azul en todo el globo y su entorno
- [ ] Las lineas de grid son grises neutras con opacidades diferenciadas
- [ ] Los continentes son visibles como manchas difusas en gris claro
- [ ] Hay un specular highlight sutil arriba-izquierda
- [ ] La atmosfera es un glow gris en el borde, NO azul
- [ ] Hay 3 anillos orbitales con estilos diferentes (solido, dashed, dotted)
- [ ] Los marcadores de satelite usan los colores del design system
- [ ] Los crosshairs son rojos (#a62c2e) con labels en #c94244
- [ ] El fondo del canvas es transparente (se ve el dot-grid)
- [ ] El gradiente radial oscuro esta presente detras del globo (CSS, no Three.js)
- [ ] La rotacion es lenta y suave
- [ ] El resultado visual es coherente con el mockup y la imagen de referencia
- [ ] El estilo general transmite "inteligencia operacional", NO "ciencia ficcion"

---

## 12. Lo que NO hacer

- NO usar colores azules (ni oceano, ni cielo, ni neon)
- NO usar Environment/HDRI — genera reflejos no controlados
- NO hacer el globo demasiado brillante o metalico
- NO usar texturas de Tierra a color (NASA Blue Marble a color, etc.)
- NO hacer los continentes muy detallados o vivos — deben ser manchas sutiles
- NO agregar nubes, agua animada, ni efectos atmosfericos elaborados
- NO hacer los anillos orbitales muy gruesos ni brillantes
- NO usar sombras agresivas (el diseno es plano con profundidad sutil)
