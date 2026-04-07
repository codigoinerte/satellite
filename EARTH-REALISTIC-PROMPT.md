# Directivas de Implementacion — Earth Realista con Texturas

## Objetivo

Implementar un globo terraqueo realista basado en el ejemplo `webgpu_tsl_earth.html` de three.js, pero:

1. **Adaptado a React Three Fiber** — No es un vanilla Three.js project
2. **Compatible con WebGL** — Fallback a WebGL si WebGPU no está disponible
3. **Manteniendo órbitas de satélites** — Las líneas de órbita y marcadores de satélite deben seguir visibles
4. **Texturas realistas open-source** — Day/night/bump maps
5. **Preservando el design system** — Colores ajustados a paleta gris/operacional

---

## 2. Tecnologia

### WebGPU vs WebGL

**WebGPU (ideal pero limitado):**
- Más rendimiento
- Soporte limitado: Chrome 113+, Edge 113+
- No soportado en Safari aún

**WebGL (fallback compatible):**
- Funciona en todos los navegadores
- Suficiente rendimiento para un globo estático

**Estrategia:**
```javascript
const supportsWebGPU = navigator.gpu !== undefined;
// Usar WebGPU si está disponible, fallback a WebGL
```

Sin embargo, **para simplicidad en React Three Fiber**, usar **WebGL (THREE.WebGLRenderer)** que es lo que usa R3F por defecto. WebGPU requería cambios en la arquitectura de R3F que son complejos.

### Shaders

**Opción A — TSL (Three.js Shading Language):** Más moderno, pero requiere setup específico
**Opción B — GLSL clásico:** Compatible, suficiente para este caso

Usar **GLSL clásico** con `RawShaderMaterial` o `ShaderMaterial` de Three.js, adaptado a R3F.

---

## 3. Texturas Necesarias

### Texturas Open-Source (sin login requerido)

| Textura | URL | Uso |
|---|---|---|
| **Day** | https://www.solarsystemscope.com/textures/ (requiere descarga) O usar alternativa libre | Color de continentes de día |
| **Night** | https://www.solarsystemscope.com/textures/ (requiere descarga) O usar NASA Black Marble | Luces nocturnas |
| **Bump/Normal** | https://www.solarsystemscope.com/textures/ O generar proceduralmente | Relieve y nubes |

### Alternativa Open-Source Comprobada

Usar texturas de **Natural Earth** project:
- **Day texture:** `https://tiles.maps.eox.at/wms/1.1.1/BlueMarble_ShadedRelief_Bathymetry` (requiere procesamiento)
- **Alternativa más simple:** Descargar de `https://github.com/CesiumGS/cesium/tree/main/Source/Assets/Textures`

### Solución Pragmática — Generar Texturas Procedurales

Si no queremos descargar texturas externas, generar en tiempo de ejecución:

```javascript
// Canvas 2D textura "day"
const dayCanvas = createDayTexture(); // Verde, azul, marrón según lat/lon
const dayTexture = new CanvasTexture(dayCanvas);

// Canvas 2D textura "night"
const nightCanvas = createNightTexture(); // Negro con puntos de luz en ciudades
const nightTexture = new CanvasTexture(nightCanvas);

// Canvas 2D textura "bump"
const bumpCanvas = createBumpTexture(); // Gris con variaciones de altitud
const bumpTexture = new CanvasTexture(bumpCanvas);
```

---

## 4. Arquitectura del Nuevo Earth.tsx

```
Earth.tsx
├── createDayTexture() → CanvasTexture
├── createNightTexture() → CanvasTexture
├── createBumpTexture() → CanvasTexture
├── EarthShaderMaterial (GLSL shaders)
│   ├── vertex.glsl — proyecta la esfera
│   └── fragment.glsl — mezcla day/night/atmosphere
├── Mesh principal con ShaderMaterial
├── Mesh de atmósfera (BackSide)
├── Anillos orbitales (3 LineSegments)
└── useFrame hook para rotación
```

---

## 5. Especificaciones del Shader

### Vertex Shader

```glsl
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute vec3 position;
attribute vec2 uv;
attribute vec3 normal;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPositionW;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPositionW = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

### Fragment Shader

```glsl
uniform sampler2D dayTexture;
uniform sampler2D nightTexture;
uniform sampler2D bumpTexture;
uniform vec3 sunDirection;
uniform vec3 cameraPosition;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPositionW;

void main() {
    // Day/night blend
    float sunIntensity = dot(vNormal, normalize(sunDirection));
    sunIntensity = smoothstep(-0.2, 0.5, sunIntensity);
    
    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
    vec3 nightColor = texture2D(nightTexture, vUv).rgb;
    vec3 earthColor = mix(nightColor, dayColor, sunIntensity);
    
    // Clouds from bump texture
    vec4 bump = texture2D(bumpTexture, vUv);
    float cloudStrength = smoothstep(0.2, 1.0, bump.b);
    earthColor = mix(earthColor, vec3(1.0), cloudStrength * 0.3);
    
    // Atmosfera fresnel
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    float fresnel = pow(1.0 - dot(viewDir, vNormal), 3.0);
    
    vec3 atmosphereColor = vec3(0.4, 0.6, 0.8); // Azul claro (modificable)
    vec3 finalColor = mix(earthColor, atmosphereColor, fresnel * 0.3);
    
    gl_FragColor = vec4(finalColor, 1.0);
}
```

---

## 6. Texturas Canvas 2D Procedurales

### createDayTexture()

```javascript
function createDayTexture(width = 2048, height = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fondo azul oceano
    ctx.fillStyle = '#0d47a1'; // Azul océano
    ctx.fillRect(0, 0, width, height);

    // Continentes en verde/marrón
    const continents = [
        // [x%, y%, radiusX, radiusY, color]
        [0.15, 0.35, 120, 100, '#2e7d32'], // Sudamérica
        [0.35, 0.25, 100, 110, '#558b2f'], // Norteamérica
        [0.55, 0.35, 80, 90, '#1b5e20'],   // Europa/África
        [0.72, 0.42, 150, 120, '#33691e'], // Asia
        [0.85, 0.55, 60, 50, '#689f38'],   // Oceania
    ];

    continents.forEach(([x, y, rx, ry, color]) => {
        const gx = x * width;
        const gy = y * height;
        const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(rx, ry));
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.7, color);
        gradient.addColorStop(1, 'rgba(13, 71, 161, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(gx, gy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
}
```

### createNightTexture()

```javascript
function createNightTexture(width = 2048, height = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Fondo totalmente negro
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);

    // Puntos de luz en grandes ciudades (simulado)
    const cities = [
        // [x%, y%, brightness 0-1]
        [0.2, 0.4, 0.8],   // NYC
        [0.35, 0.45, 0.7], // Europa
        [0.55, 0.38, 0.8], // Oriente Medio
        [0.7, 0.35, 0.9],  // India
        [0.75, 0.42, 0.85],// China
        [0.05, 0.3, 0.6],  // Brasil
    ];

    cities.forEach(([x, y, brightness]) => {
        const gx = x * width;
        const gy = y * height;
        const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, 80);
        gradient.addColorStop(0, `rgba(255, 200, 100, ${brightness})`);
        gradient.addColorStop(0.5, `rgba(255, 150, 0, ${brightness * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(gx, gy, 80, 0, Math.PI * 2);
        ctx.fill();
    });

    return new THREE.CanvasTexture(canvas);
}
```

### createBumpTexture()

```javascript
function createBumpTexture(width = 2048, height = 1024) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Ruido Perlin simulado con patrón de continentes
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);

        // Noise procedural simple
        let value = Math.sin(x * 0.01) * Math.cos(y * 0.01);
        value = (value + 1) / 2; // 0-1
        value = Math.pow(value, 1.5); // Concentrar los valores

        const brightness = Math.floor(value * 255);
        data[i] = brightness;     // R - bump/elevation
        data[i + 1] = brightness; // G - roughness
        data[i + 2] = Math.floor((Math.sin(x * 0.005) * Math.cos(y * 0.005) + 1) / 2 * 255); // B - clouds
        data[i + 3] = 255;        // A
    }

    ctx.putImageData(imageData, 0, 0);
    return new THREE.CanvasTexture(canvas);
}
```

---

## 7. Estructura del Nuevo Earth.tsx

```typescript
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `...`;
const fragmentShader = `...`;

function createDayTexture() { /* ... */ }
function createNightTexture() { /* ... */ }
function createBumpTexture() { /* ... */ }

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.LineSegments[]>([]);

  useEffect(() => {
    if (!earthRef.current) return;

    // Crear material custom
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        dayTexture: { value: createDayTexture() },
        nightTexture: { value: createNightTexture() },
        bumpTexture: { value: createBumpTexture() },
        sunDirection: { value: new THREE.Vector3(1, 0.5, 1).normalize() },
        cameraPosition: { value: new THREE.Vector3() },
      },
    });

    earthRef.current.material = material;
  }, []);

  useFrame((state) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0002;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += 0.0002;
    }
    ringsRef.current.forEach(ring => {
      ring.rotation.y += 0.0002;
    });
  });

  return (
    <group>
      {/* Esfera principal */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[5, 64, 64]} />
        <shaderMaterial {...material} />
      </mesh>

      {/* Atmosfera */}
      <mesh ref={atmosphereRef} scale={1.04}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshBasicMaterial
          color="#4db2ff"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Anillos orbitales */}
      {/* 3 anillos como antes */}
    </group>
  );
}
```

---

## 8. Características a Implementar

### Obligatorias

- [x] Texturas day/night/bump (Canvas 2D procedural)
- [x] Shader Material con mezcla day/night
- [x] Atmósfera glow translúcida
- [x] Rotación suave del globo
- [x] Mantener 3 anillos orbitales
- [x] Compatibilidad con React Three Fiber

### Opcionales (si hay tiempo)

- [ ] Animación de nubes
- [ ] Fresnel glow más realista
- [ ] Marcadores de satélite con glow
- [ ] Crosshairs de objetivos

---

## 9. Criterios de Aceptación

- [ ] El globo es realista con continentes y océanos visibles
- [ ] Hay efecto day/night con transición suave
- [ ] Las luces de la noche son visibles
- [ ] La atmósfera tiene glow translúcido azul
- [ ] Los 3 anillos orbitales están presentes y rotan
- [ ] El globo rota lentamente de forma natural
- [ ] No hay artefactos visuales (z-fighting, texturas rotadas, etc.)
- [ ] Funciona sin WebGPU (fallback a WebGL)
- [ ] El componente se integra bien en React Three Fiber
- [ ] Mantiene la arquitectura actual de componentes

---

## 10. Dependencias a Instalar (si es necesario)

El proyecto ya tiene `three` y `@react-three/fiber`. Los shaders se escriben en GLSL puro sin dependencias adicionales.

Si se desea Perlin noise mejor en las texturas procedurales:
```bash
npm install simplex-noise
```

Pero es opcional — usar Math.sin/Math.cos es suficiente.
