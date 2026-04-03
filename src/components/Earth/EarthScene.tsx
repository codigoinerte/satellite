import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Earth from './Earth';
import type { Satellite3D } from '../../types/satellite';

interface EarthSceneProps {
  satellites?: Satellite3D[];
}

const EarthScene = (_: EarthSceneProps) => {
  return (
    <div className="viewport">
      <Canvas
        camera={{ position: [0, 2, 14], fov: 42 }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Lighting - NEW SETUP */}
        {/* Ambient light - neutral gray tone */}
        <ambientLight intensity={0.3} color="#c3c3c8" />

        {/* Main point light - simulates top-left highlight */}
        <pointLight
          position={[-4, 5, 10]}
          intensity={0.5}
          color="#d0d0d5"
          distance={30}
          decay={2}
        />

        {/* Fill light from below */}
        <pointLight
          position={[3, -3, 5]}
          intensity={0.1}
          color="#c3c3c8"
        />

        {/* Earth with axial tilt */}
        <group rotation={[-0.408, 0, 0]}>
          <Earth />
        </group>

        {/* Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.3}
          minDistance={10}
          maxDistance={22}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
};

export default EarthScene;