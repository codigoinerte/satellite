import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Create day texture with ocean (blue) and continents (green/brown)
 */
function createDayTexture(width = 2048, height = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Ocean background
  ctx.fillStyle = '#1e5a8a';
  ctx.fillRect(0, 0, width, height);

  // Continents: [x%, y%, radiusX, radiusY, color]
  const continents = [
    [0.15, 0.35, 120, 100, '#2d8659'],   // South America
    [0.35, 0.25, 100, 110, '#3d9159'],   // North America
    [0.55, 0.35, 80, 90, '#1d6640'],     // Europe/Africa
    [0.72, 0.42, 150, 120, '#4a9a6b'],   // Asia
    [0.85, 0.55, 60, 50, '#58a877'],     // Oceania
  ];

  continents.forEach(([x, y, rx, ry, color]) => {
    const gx = x * width;
    const gy = y * height;
    const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(rx, ry));
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, 'rgba(30, 90, 138, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(gx, gy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  return texture;
}

/**
 * Create night texture with city lights
 */
function createNightTexture(width = 2048, height = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // Cities with lights: [x%, y%, brightness]
  const cities = [
    [0.2, 0.4, 0.9],    // NYC
    [0.35, 0.45, 0.85], // Europe
    [0.55, 0.38, 0.75], // Middle East
    [0.7, 0.35, 0.95],  // India
    [0.75, 0.42, 0.9],  // China
    [0.05, 0.3, 0.7],   // Brazil
  ];

  cities.forEach(([x, y, brightness]) => {
    const gx = x * width;
    const gy = y * height;
    const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, 100);
    gradient.addColorStop(0, `rgba(255, 220, 100, ${brightness})`);
    gradient.addColorStop(0.5, `rgba(255, 180, 0, ${brightness * 0.4})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(gx, gy, 100, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Create normal/bump map texture for surface detail
 */
function createNormalTexture(width = 2048, height = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    // Procedural noise for normal mapping
    const noise = Math.sin(x * 0.002) * Math.cos(y * 0.002) * 0.5 + 0.5;
    const detail = (Math.sin(x * 0.01) + Math.sin(y * 0.01)) * 0.25 + 0.5;

    data[i] = 128 + Math.floor(noise * 40);      // R
    data[i + 1] = 128 + Math.floor(detail * 40); // G
    data[i + 2] = 255;                            // B
    data[i + 3] = 255;                            // A
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

/**
 * Create orbital rings
 */
function createOrbitalRings() {
  const group = new THREE.Group();

  // LEO Ring - Solid
  {
    const radius = 6.5;
    const geometry = new THREE.BufferGeometry();
    const points: number[] = [];

    for (let i = 0; i <= 256; i++) {
      const angle = (i / 256) * Math.PI * 2;
      points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

    const material = new THREE.LineBasicMaterial({
      color: 0xb8b8c8,
      transparent: true,
      opacity: 0.4,
      linewidth: 1,
    });

    const line = new THREE.Line(geometry, material);
    line.rotation.x = THREE.MathUtils.degToRad(72);
    group.add(line);
  }

  // MEO Ring - Dashed
  {
    const radius = 7.5;
    const geometry = new THREE.BufferGeometry();
    const points: number[] = [];

    for (let i = 0; i <= 256; i++) {
      const angle = (i / 256) * Math.PI * 2;
      points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

    const material = new THREE.LineDashedMaterial({
      color: 0xb8b8c8,
      transparent: true,
      opacity: 0.25,
      dashSize: 0.4,
      gapSize: 0.2,
    });

    const line = new THREE.Line(geometry, material);
    line.rotation.x = THREE.MathUtils.degToRad(60);
    line.rotation.z = THREE.MathUtils.degToRad(42);
    line.computeLineDistances();
    group.add(line);
  }

  // Outer Ring - Dotted (Red)
  {
    const radius = 8.5;
    const geometry = new THREE.BufferGeometry();
    const points: number[] = [];

    for (let i = 0; i <= 256; i++) {
      const angle = (i / 256) * Math.PI * 2;
      points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

    const material = new THREE.LineDashedMaterial({
      color: 0xa62c2e,
      transparent: true,
      opacity: 0.3,
      dashSize: 0.1,
      gapSize: 0.15,
    });

    const line = new THREE.Line(geometry, material);
    line.rotation.x = THREE.MathUtils.degToRad(54);
    line.rotation.z = THREE.MathUtils.degToRad(-22);
    line.computeLineDistances();
    group.add(line);
  }

  return group;
}

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const nightLayerRef = useRef<THREE.Mesh>(null);
  const ringsGroupRef = useRef<THREE.Group>(null);

  const textures = useMemo(() => {
    return {
      day: createDayTexture(),
      night: createNightTexture(),
      normal: createNormalTexture(),
      rings: createOrbitalRings(),
    };
  }, []);

  useFrame((state) => {
    // Rotate earth
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0002;
    }

    // Rotate night layer
    if (nightLayerRef.current) {
      nightLayerRef.current.rotation.y += 0.0002;
    }

    // Rotate rings
    if (ringsGroupRef.current) {
      ringsGroupRef.current.rotation.y += 0.0002;
    }

    // Calculate sun angle for day/night blend
    const sunAngle = Math.sin(state.clock.elapsedTime * 0.0005);

    // Update night layer opacity based on sun angle
    if (nightLayerRef.current && nightLayerRef.current.material instanceof THREE.MeshBasicMaterial) {
      const material = nightLayerRef.current.material as THREE.MeshBasicMaterial;
      // Opacity varies from 0 (full day) to 1 (full night)
      material.opacity = Math.max(0, Math.min(1, 0.5 - sunAngle * 0.3));
    }
  });

  return (
    <group>
      {/* Day side Earth */}
      <mesh ref={earthRef} position={[0, 0, 0]}>
        <sphereGeometry args={[5, 128, 128]} />
        <meshStandardMaterial
          map={textures.day}
          normalMap={textures.normal}
          roughness={0.8}
          metalness={0.1}
          emissive={0x000000}
        />
      </mesh>

      {/* Night side overlay */}
      <mesh ref={nightLayerRef} position={[0, 0, 0.001]}>
        <sphereGeometry args={[5, 128, 128]} />
        <meshBasicMaterial
          map={textures.night}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh scale={1.05} position={[0, 0, 0]}>
        <sphereGeometry args={[5, 128, 128]} />
        <meshBasicMaterial
          color={0x4db2ff}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Orbital rings */}
      <group ref={ringsGroupRef}>
        <primitive object={textures.rings} />
      </group>
    </group>
  );
}
