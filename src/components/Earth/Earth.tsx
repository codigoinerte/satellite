import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Create a detailed day texture with realistic colors
 */
function createDayTexture(width = 2048, height = 1024): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Ocean - deep blue
  ctx.fillStyle = '#1a4d7a';
  ctx.fillRect(0, 0, width, height);

  // Add some subtle ocean variation
  const oceanGradient = ctx.createLinearGradient(0, 0, 0, height);
  oceanGradient.addColorStop(0, '#0d3a61');
  oceanGradient.addColorStop(0.5, '#1a4d7a');
  oceanGradient.addColorStop(1, '#0d3a61');
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, 0, width, height);

  // Continents with realistic colors
  const continents = [
    // [x%, y%, radiusX, radiusY, mainColor, lightColor]
    [0.15, 0.35, 120, 100, '#2d7a3d', '#4a9a5a'], // South America - green
    [0.35, 0.25, 100, 110, '#2d7a3d', '#4a9a5a'], // North America - green
    [0.52, 0.32, 90, 100, '#5a6d3d', '#7a8a5a'], // Africa/Sahara - olive
    [0.65, 0.28, 70, 60, '#3d6a4a', '#5a8a67'], // Europe - green
    [0.72, 0.42, 160, 130, '#2d7a3d', '#4a9a5a'], // Asia - green
    [0.85, 0.55, 60, 50, '#3d7a4a', '#5a9a67'], // Australia - green
    [0.1, 0.7, 50, 80, '#5a7a3d', '#7a9a5a'], // Antarctica - whitish
  ];

  continents.forEach(([x, y, rx, ry, color, lightColor]) => {
    const gx = (x as number) * width;
    const gy = (y as number) * height;

    // Create radial gradient for continent
    const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(rx as number, ry as number));
    gradient.addColorStop(0, lightColor as string);
    gradient.addColorStop(0.5, color as string);
    gradient.addColorStop(1, 'rgba(26, 77, 122, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(gx, gy, rx as number, ry as number, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.anisotropy = 16;
  return texture;
}

/**
 * Create night texture with city lights
 */
function createNightTexture(width = 2048, height = 1024): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Very dark background
  ctx.fillStyle = '#000505';
  ctx.fillRect(0, 0, width, height);

  // Cities with bright lights
  const cities = [
    [0.2, 0.4, 80, 0.95],    // NYC - bright
    [0.32, 0.42, 100, 0.9],  // Europe - very bright
    [0.42, 0.38, 60, 0.7],   // Middle East
    [0.62, 0.35, 90, 0.95],  // India - bright
    [0.75, 0.4, 110, 1.0],   // China - very bright
    [0.85, 0.48, 60, 0.8],   // Japan - bright
    [0.05, 0.35, 70, 0.65],  // Brazil
    [0.88, 0.55, 50, 0.7],   // Australia
  ];

  cities.forEach(([x, y, radius, brightness]) => {
    const gx = (x as number) * width;
    const gy = (y as number) * height;
    const r = radius as number;
    const b = brightness as number;

    // Create radial gradient for city lights
    const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, r * 2);
    gradient.addColorStop(0, `rgba(255, 240, 200, ${b})`);
    gradient.addColorStop(0.3, `rgba(255, 200, 100, ${b * 0.8})`);
    gradient.addColorStop(0.6, `rgba(255, 150, 50, ${b * 0.4})`);
    gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(gx - r * 2, gy - r * 2, r * 4, r * 4);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Create a normal/bump texture
 */
function createNormalTexture(width = 2048, height = 1024): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Create perlin-like noise using multiple sine/cosine waves
  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    const px = pixelIndex % width;
    const py = Math.floor(pixelIndex / width);

    // Generate natural-looking terrain noise
    let value = 0;
    value += Math.sin(px * 0.002) * Math.cos(py * 0.002) * 0.5;
    value += Math.sin(px * 0.005) * Math.cos(py * 0.005) * 0.3;
    value += Math.sin(px * 0.01) * Math.cos(py * 0.01) * 0.2;
    value = (value + 1) / 2; // Normalize 0-1

    const brightness = Math.floor(value * 255);

    // Standard normal map format (128 = no height change)
    data[i] = 128 + (brightness - 128) * 0.3;      // R
    data[i + 1] = 128 + (brightness - 128) * 0.3; // G
    data[i + 2] = 255;                             // B - always 255 (no height)
    data[i + 3] = 255;                             // A - full opacity
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.LinearSRGBColorSpace;
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
    const points: number[] = [];
    for (let i = 0; i <= 256; i++) {
      const angle = (i / 256) * Math.PI * 2;
      points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

    const material = new THREE.LineBasicMaterial({
      color: 0xa0c8d8,
      transparent: true,
      opacity: 0.5,
      linewidth: 1,
    });

    const line = new THREE.Line(geometry, material);
    line.rotation.x = THREE.MathUtils.degToRad(72);
    group.add(line);
  }

  // MEO Ring - Dashed
  {
    const radius = 7.5;
    const points: number[] = [];
    for (let i = 0; i <= 256; i++) {
      const angle = (i / 256) * Math.PI * 2;
      points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

    const material = new THREE.LineDashedMaterial({
      color: 0x80a8c8,
      transparent: true,
      opacity: 0.35,
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
    const points: number[] = [];
    for (let i = 0; i <= 256; i++) {
      const angle = (i / 256) * Math.PI * 2;
      points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

    const material = new THREE.LineDashedMaterial({
      color: 0xa62c2e,
      transparent: true,
      opacity: 0.4,
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
  const earthDayRef = useRef<THREE.Mesh>(null);
  const earthNightRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  const textures = useMemo(() => {
    return {
      day: createDayTexture(),
      night: createNightTexture(),
      normal: createNormalTexture(),
      rings: createOrbitalRings(),
    };
  }, []);

  useFrame((state) => {
    // Rotate earth meshes
    if (earthDayRef.current) {
      earthDayRef.current.rotation.y += 0.0002;
    }
    if (earthNightRef.current) {
      earthNightRef.current.rotation.y += 0.0002;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += 0.0002;
    }
    if (ringsRef.current) {
      ringsRef.current.rotation.y += 0.0002;
    }

    // Simulate day/night cycle
    const sunAngle = Math.sin(state.clock.elapsedTime * 0.0003);

    // Update night layer opacity
    if (earthNightRef.current && earthNightRef.current.material instanceof THREE.MeshBasicMaterial) {
      const material = earthNightRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0.1, Math.min(0.8, 0.5 - sunAngle * 0.4));
    }
  });

  return (
    <group>
      {/* Day side Earth - MeshStandardMaterial for realistic lighting */}
      <mesh ref={earthDayRef} position={[0, 0, 0]}>
        <sphereGeometry args={[5, 128, 128]} />
        <meshStandardMaterial
          map={textures.day}
          normalMap={textures.normal}
          roughness={0.7}
          metalness={0.0}
          emissive={0x1a2a3a}
          emissiveIntensity={0.3}
          toneMapped={true}
          color={0xffffff}
        />
      </mesh>

      {/* Night side overlay - bright city lights */}
      <mesh ref={earthNightRef} position={[0, 0, 0.002]}>
        <sphereGeometry args={[5, 128, 128]} />
        <meshBasicMaterial
          map={textures.night}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} scale={1.06} position={[0, 0, 0]}>
        <sphereGeometry args={[5, 128, 128]} />
        <meshBasicMaterial
          color={0x4d8ab8}
          transparent
          opacity={0.15}
          side={THREE.BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Orbital rings */}
      <group ref={ringsRef}>
        <primitive object={textures.rings} />
      </group>
    </group>
  );
}
