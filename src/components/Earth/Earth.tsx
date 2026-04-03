import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Helper to create latitudinal lines with different opacities
function createLatitudeLines() {
  const group = new THREE.Group();
  const lineColor = new THREE.Color('#c3c3c8');

  // Define latitude lines: [latitude (0-1), opacity]
  // 0 = bottom, 0.5 = equator, 1 = top
  const latLines = [
    { lat: 0.5, opacity: 0.18, name: 'Ecuador' },           // Equator
    { lat: 0.35, opacity: 0.08, name: 'Trópico S' },        // Tropic of Capricorn
    { lat: 0.65, opacity: 0.08, name: 'Trópico N' },        // Tropic of Cancer
    { lat: 0.2, opacity: 0.05, name: 'Polar S' },           // Antarctic Circle
    { lat: 0.8, opacity: 0.05, name: 'Polar N' },           // Arctic Circle
  ];

  latLines.forEach(({ lat, opacity }) => {
    const radius = 5 * Math.cos(Math.PI * (lat - 0.5));
    const height = 5 * Math.sin(Math.PI * (lat - 0.5));

    const points = [];
    for (let j = 0; j <= 128; j++) {
      const angle = (j / 128) * Math.PI * 2;
      points.push(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

    const mat = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: opacity,
      linewidth: 1,
    });

    const line = new THREE.Line(geom, mat);
    group.add(line);
  });

  // Meridian lines every 30°
  for (let lon = 0; lon < 360; lon += 30) {
    const angle = (lon * Math.PI) / 180;
    const points = [];

    for (let lat = 0; lat <= 180; lat += 2) {
      const latRad = (lat * Math.PI) / 180;
      const radius = 5 * Math.sin(latRad);
      const height = 5 * Math.cos(latRad);

      points.push(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

    const mat = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0.06,
      linewidth: 1,
    });

    const line = new THREE.Line(geom, mat);
    group.add(line);
  }

  return group;
}

// Create continents as Canvas texture
function createContinentTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 1024, 512);

  // Continents: [x%, y%, radiusX, radiusY, alpha]
  const continents = [
    [0.24, 0.38, 70, 75, 0.18],   // North America
    [0.28, 0.62, 44, 68, 0.15],   // South America
    [0.50, 0.32, 36, 31, 0.18],   // Europe
    [0.50, 0.57, 49, 75, 0.15],   // Africa
    [0.68, 0.34, 101, 62, 0.16],  // Asia
    [0.75, 0.64, 36, 26, 0.13],   // Oceania
  ];

  continents.forEach(([cx, cy, rx, ry, alpha]) => {
    const gradient = ctx.createRadialGradient(
      cx * 1024, cy * 512, 0,
      cx * 1024, cy * 512, Math.max(rx as number, ry as number)
    );
    gradient.addColorStop(0, `rgba(195, 195, 200, ${alpha})`);
    gradient.addColorStop(1, 'rgba(195, 195, 200, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(cx as number * 1024, cy as number * 512, rx as number, ry as number, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Create specular highlight with Fresnel effect
function createSpecularHighlight() {
  const geom = new THREE.SphereGeometry(5.02, 32, 32);

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, 512, 512);

  // Radial gradient at top-left (34%, 30%)
  const gradient = ctx.createRadialGradient(
    512 * 0.34, 512 * 0.30, 0,
    512 * 0.34, 512 * 0.30, 200
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });

  return new THREE.Mesh(geom, mat);
}

// Create orbital rings with different styles
function createOrbitalRings() {
  const group = new THREE.Group();

  // Ring 1: LEO (solid)
  {
    const radius = 6.5;
    const points = [];
    for (let j = 0; j <= 256; j++) {
      const angle = (j / 256) * Math.PI * 2;
      points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color('#c3c3c8'),
      transparent: true,
      opacity: 0.14,
      linewidth: 1,
    });
    const line = new THREE.Line(geom, mat);
    line.rotation.x = (72 * Math.PI) / 180;
    group.add(line);
  }

  // Ring 2: MEO (dashed)
  {
    const radius = 7.5;
    const points = [];
    for (let j = 0; j <= 256; j++) {
      const angle = (j / 256) * Math.PI * 2;
      points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    const mat = new (THREE as any).LineDashedMaterial({
      color: new THREE.Color('#c3c3c8'),
      transparent: true,
      opacity: 0.07,
      linewidth: 1,
      dashSize: 0.3,
      gapSize: 0.15,
    });
    const line = new THREE.Line(geom, mat);
    line.rotation.x = (60 * Math.PI) / 180;
    line.rotation.z = (42 * Math.PI) / 180;
    (line as any).computeLineDistances();
    group.add(line);
  }

  // Ring 3: Outer (dotted, red tint)
  {
    const radius = 8.5;
    const points = [];
    for (let j = 0; j <= 256; j++) {
      const angle = (j / 256) * Math.PI * 2;
      points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
    const mat = new (THREE as any).LineDashedMaterial({
      color: new THREE.Color('#a62c2e'),
      transparent: true,
      opacity: 0.07,
      linewidth: 1,
      dashSize: 0.08,
      gapSize: 0.15,
    });
    const line = new THREE.Line(geom, mat);
    line.rotation.x = (54 * Math.PI) / 180;
    line.rotation.z = (-22 * Math.PI) / 180;
    (line as any).computeLineDistances();
    group.add(line);
  }

  return group;
}

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const borderRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const gridGroupRef = useRef<THREE.Group>(null);
  const ringsRef = useRef<THREE.Group>(null);

  // Create grid and rings once
  const { gridGroup, ringsGroup } = useMemo(() => {
    return {
      gridGroup: createLatitudeLines(),
      ringsGroup: createOrbitalRings(),
    };
  }, []);

  const continentTexture = useMemo(() => createContinentTexture(), []);
  const specularMesh = useMemo(() => createSpecularHighlight(), []);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0002;
    }
    if (borderRef.current) {
      borderRef.current.rotation.y += 0.0002;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += 0.0002;
    }
    if (gridGroupRef.current) {
      gridGroupRef.current.rotation.y += 0.0002;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y += 0.0002;
    }
  });

  return (
    <group>
      {/* Earth sphere - MeshStandardMaterial with proper gray color */}
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[5, 64, 64]} />
        <meshStandardMaterial
          color="#131416"
          roughness={0.9}
          metalness={0.1}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Subtle border wireframe */}
      <mesh ref={borderRef} position={[0, 0, 0.001]}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshBasicMaterial
          color="#c3c3c8"
          wireframe
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>

      {/* Continent overlay */}
      <mesh position={[0, 0, 0.002]}>
        <sphereGeometry args={[5.002, 64, 64]} />
        <meshBasicMaterial
          map={continentTexture}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* Specular highlight */}
      <primitive object={specularMesh} />

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} scale={1.016}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshBasicMaterial
          color="#c3c3c8"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Grid lines (latitude and longitude) */}
      <group ref={gridGroupRef}>
        <primitive object={gridGroup} />
      </group>

      {/* Orbital rings */}
      <group ref={ringsRef}>
        <primitive object={ringsGroup} />
      </group>
    </group>
  );
}
