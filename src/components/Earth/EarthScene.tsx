import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import { useFrame } from 'react-three-fiber';

const EarthScene = () => {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);
  const [active, setActive] = useState(false);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y -= delta * 0.5;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} />
      <mesh
        ref={ref}
        scale={0.5}
        onClick={() => setActive(!active)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial metalness={0.2} roughness={0.8} />
      </mesh>
      <OrbitControls enableZoom={false} enablePan={false} />
      <Environment preset="sunset" />
      <Stars 
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade={true}
      />
    </group>
  );
};

export default EarthScene;