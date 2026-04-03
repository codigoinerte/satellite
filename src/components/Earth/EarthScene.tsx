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
        style={{ width: '100%', height: '100%', background: 'transparent', flex: 1 }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Strong ambient light so the globe is always visible */}
        <ambientLight intensity={0.8} />

        {/* Sun-like directional light — illuminates one side */}
        <directionalLight
          position={[5, 3, 5]}
          intensity={2.5}
          color="#ffffff"
        />

        {/* Fill light from the opposite side */}
        <directionalLight
          position={[-5, -1, -3]}
          intensity={0.4}
          color="#8899bb"
        />

        {/* Earth with axial tilt (-23.4°) */}
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
