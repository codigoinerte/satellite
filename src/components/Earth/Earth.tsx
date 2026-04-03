import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.Mesh>(null);

  // Create orbital rings
  const rings = useMemo(() => {
    const ringGeometries: Array<{ geometry: THREE.BufferGeometry; color: string }> = [];
    const altitudes = [408, 550, 870, 20200, 35786]; // LEO, MEO, GEO altitudes
    const colors = ['#7a9e7a', '#9e8f6a', '#7a80a8', '#9e8f6a', '#7a80a8'];

    altitudes.forEach((alt, i) => {
      const radius = 5 + (alt / 6371) * 0.8;
      const geometry = new THREE.BufferGeometry();
      const points = [];
      for (let j = 0; j <= 64; j++) {
        const angle = (j / 64) * Math.PI * 2;
        points.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));
      ringGeometries.push({ geometry, color: colors[i] });
    });
    return ringGeometries;
  }, []);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.0002;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y += 0.0002;
    }
    if (gridRef.current) {
      gridRef.current.rotation.y += 0.0002;
    }
  });

  return (
    <group>
      {/* Earth sphere */}
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[5, 64, 64]} />
        <meshPhongMaterial
          color="#0a3d5c"
          emissive="#001a2e"
          specular="#333333"
          shininess={5}
          opacity={0.95}
          transparent
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} scale={1.015}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshPhongMaterial
          color="#1a5f7a"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
          emissive="#0a3d5c"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Grid lines on sphere */}
      <mesh ref={gridRef}>
        <sphereGeometry args={[5.01, 32, 32]} />
        <meshBasicMaterial
          color="#2a7a9a"
          wireframe
          transparent
          opacity={0.15}
        />
      </mesh>

      {/* Orbital rings */}
      {rings.map((ring, i) => (
        <lineSegments key={`ring-${i}`}>
          <bufferGeometry attach="geometry" {...ring.geometry} />
          <lineBasicMaterial
            attach="material"
            color={ring.color}
            transparent
            opacity={0.3}
            linewidth={1}
          />
        </lineSegments>
      ))}
    </group>
  );
}
