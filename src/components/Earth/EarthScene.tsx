import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Earth from './Earth';
import type { Satellite3D } from '../../types/satellite';

interface EarthSceneProps {
  satellites?: Satellite3D[];
}

const EarthScene = (_: EarthSceneProps) => {
  return (
    <div className="viewport">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <pointLight position={[-10, -10, 5]} intensity={0.3} />

        {/* Earth */}
        <Earth />

        {/* Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          autoRotate={true}
          autoRotateSpeed={0.5}
        />

        {/* Environment */}
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

export default EarthScene;