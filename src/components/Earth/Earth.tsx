import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

// Real Earth textures from open-source CDN (three-globe package)
const TEXTURE_URLS = {
  day: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-day.jpg',
  night: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg',
  bump: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png',
  clouds: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png',
};

/**
 * Create orbital rings with 3 different styles
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

  // Outer Ring - Dotted (Red accent)
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

/**
 * Inner component that renders Earth with loaded textures
 */
function EarthWithTextures({
  dayMap,
  nightMap,
  bumpMap,
}: {
  dayMap: THREE.Texture;
  nightMap: THREE.Texture;
  bumpMap: THREE.Texture;
}) {
  const earthDayRef = useRef<THREE.Mesh>(null);
  const earthNightRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  const ringsGroup = useMemo(() => createOrbitalRings(), []);

  useFrame(() => {
    const speed = 0.0003;
    if (earthDayRef.current) earthDayRef.current.rotation.y += speed;
    if (earthNightRef.current) earthNightRef.current.rotation.y += speed;
    if (cloudsRef.current) cloudsRef.current.rotation.y += speed * 1.3;
    if (ringsRef.current) ringsRef.current.rotation.y += speed * 0.5;
  });

  return (
    <group>
      {/* Day Earth - main visible globe */}
      <mesh ref={earthDayRef}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshPhongMaterial
          map={dayMap}
          bumpMap={bumpMap}
          bumpScale={0.05}
          specular={0x333333}
          shininess={15}
        />
      </mesh>

      {/* Night lights overlay - additive blending */}
      <mesh ref={earthNightRef}>
        <sphereGeometry args={[5.002, 64, 64]} />
        <meshBasicMaterial
          map={nightMap}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[5.04, 64, 64]} />
        <meshPhongMaterial
          color={0xffffff}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} scale={1.08}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshBasicMaterial
          color={0x4488cc}
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Orbital rings */}
      <group ref={ringsRef}>
        <primitive object={ringsGroup} />
      </group>
    </group>
  );
}

/**
 * Main Earth component - loads textures then renders
 */
export default function Earth() {
  const [textures, setTextures] = useState<{
    day: THREE.Texture;
    night: THREE.Texture;
    bump: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    Promise.all([
      loader.loadAsync(TEXTURE_URLS.day),
      loader.loadAsync(TEXTURE_URLS.night),
      loader.loadAsync(TEXTURE_URLS.bump),
    ])
      .then(([day, night, bump]) => {
        day.colorSpace = THREE.SRGBColorSpace;
        night.colorSpace = THREE.SRGBColorSpace;
        setTextures({ day, night, bump });
      })
      .catch((err) => {
        console.warn('Failed to load Earth textures:', err);
      });
  }, []);

  // Show a placeholder sphere while textures load
  if (!textures) {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[5, 32, 32]} />
          <meshBasicMaterial color={0x111520} wireframe />
        </mesh>
      </group>
    );
  }

  return (
    <EarthWithTextures
      dayMap={textures.day}
      nightMap={textures.night}
      bumpMap={textures.bump}
    />
  );
}
