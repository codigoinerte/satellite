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
        {/* Minimal ambient — the custom shader handles its own lighting */}
        <ambientLight intensity={0.05} />

        {/* Sun — matches sunDirection uniform in the shader */}
        <directionalLight position={[1, 0.3, 1]} intensity={1.5} color="#ffffff" />

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
