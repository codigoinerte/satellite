import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { Satellite3D as Satellite3DType } from '../../types/satellite';

interface SatelliteProps {
  satellite: Satellite3DType;
  onClick: (satellite: Satellite3DType) => void;
}

export function Satellite3D({ satellite, onClick }: SatelliteProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (groupRef.current) {
      // Rotación del satélite
      groupRef.current.rotation.y += 0.01;

      // Movimiento orbital simple (para efecto visual)
      const time = state.clock.getElapsedTime() * 0.1;
      const currentPos = satellite.position;
      const radius = Math.sqrt(currentPos[0] ** 2 + currentPos[2] ** 2);
      const angle = Math.atan2(currentPos[2], currentPos[0]) + time * (satellite.velocity / 1000);

      groupRef.current.position.x = Math.cos(angle) * radius;
      groupRef.current.position.y = currentPos[1] + Math.sin(time * 2) * 0.1;
      groupRef.current.position.z = Math.sin(angle) * radius;
    }
  });

  return (
    <group
      ref={groupRef}
      position={satellite.position}
      onClick={(e) => {
        e.stopPropagation();
        onClick(satellite);
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Cuerpo principal del satélite */}
      <mesh>
        <boxGeometry args={[0.15, 0.15, 0.2]} />
        <meshStandardMaterial
          color={hovered ? '#ff00ff' : '#00fff9'}
          emissive={hovered ? '#ff00ff' : '#00fff9'}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Antena */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.2]} />
        <meshStandardMaterial
          color="#00fff9"
          emissive="#00fff9"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Panel solar izquierdo */}
      <mesh position={[-0.25, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
        <meshStandardMaterial
          color="#001f3f"
          emissive="#0074d9"
          emissiveIntensity={0.2}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Panel solar derecho */}
      <mesh position={[0.25, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
        <meshStandardMaterial
          color="#001f3f"
          emissive="#0074d9"
          emissiveIntensity={0.2}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Órbita visual */}
      {hovered && <OrbitLine position={satellite.position} />}

      {/* Label con nombre */}
      {hovered && (
        <Html
          position={[0, 0.3, 0]}
          center
          distanceFactor={10}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              background: 'rgba(5, 8, 22, 0.9)',
              border: '1px solid #00fff9',
              borderRadius: '4px',
              padding: '4px 8px',
              color: '#00fff9',
              fontSize: '10px',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 0 10px rgba(0, 255, 249, 0.5)',
            }}
          >
            {satellite.name}
          </div>
        </Html>
      )}

      {/* Glow effect */}
      <pointLight
        color={hovered ? '#ff00ff' : '#00fff9'}
        intensity={hovered ? 1 : 0.5}
        distance={2}
      />
    </group>
  );
}

function OrbitLine({ position }: { position: [number, number, number] }) {
  const radius = Math.sqrt(position[0] ** 2 + position[2] ** 2);
  const points = [];

  for (let i = 0; i <= 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        Math.cos(angle) * radius,
        position[1],
        Math.sin(angle) * radius
      )
    );
  }

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial
        color="#ff00ff"
        transparent
        opacity={0.3}
        linewidth={2}
      />
    </line>
  );
}
