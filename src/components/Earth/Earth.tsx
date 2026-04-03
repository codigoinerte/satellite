import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three';
import * as THREE from 'three';

export function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);

  // Para una versión más realista, puedes descargar texturas de la Tierra
  // Por ahora usamos colores procedurales
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001; // Rotación lenta
    }
  });

  return (
    <group>
      {/* Tierra */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshPhongMaterial
          color="#0a4d68"
          emissive="#001a2e"
          specular="#00fff9"
          shininess={25}
          opacity={0.95}
          transparent
        />
      </mesh>

      {/* Atmósfera */}
      <mesh scale={1.02}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshPhongMaterial
          color="#00fff9"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Grid sobre la Tierra */}
      <mesh>
        <sphereGeometry args={[5.01, 32, 32]} />
        <meshBasicMaterial
          color="#00fff9"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Luz ambiente */}
      <ambientLight intensity={0.3} />

      {/* Luz direccional (sol) */}
      <directionalLight
        position={[10, 5, 5]}
        intensity={1.5}
        color="#ffffff"
      />

      {/* Luz de relleno */}
      <pointLight
        position={[-10, -5, -5]}
        intensity={0.5}
        color="#00fff9"
      />

      {/* Estrellas de fondo */}
      <Stars />
    </group>
  );
}

function Stars() {
  const starsRef = useRef<THREE.Points>(null);

  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({
    color: '#00fff9',
    size: 0.05,
    transparent: true,
    opacity: 0.8,
  });

  const starsVertices = [];
  for (let i = 0; i < 5000; i++) {
    const x = (Math.random() - 0.5) * 200;
    const y = (Math.random() - 0.5) * 200;
    const z = (Math.random() - 0.5) * 200;
    starsVertices.push(x, y, z);
  }

  starsGeometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(starsVertices, 3)
  );

  useFrame(() => {
    if (starsRef.current) {
      starsRef.current.rotation.y += 0.0001;
      starsRef.current.rotation.x += 0.00005;
    }
  });

  return <points ref={starsRef} geometry={starsGeometry} material={starsMaterial} />;
}
