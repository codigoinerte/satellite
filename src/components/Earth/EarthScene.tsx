import { useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Vector3 } from 'three';
import Earth from './Earth';
import type { Satellite3D } from '../../types/satellite';

interface EarthSceneProps {
  satellites?: Satellite3D[];
  selectedSatellite?: Satellite3D | null;
  starlinkSatellites?: Satellite3D[];
}

const DEFAULT_CAMERA_POSITION = new Vector3(0, 0.4, 24);
const MIN_CAMERA_DISTANCE = 14;
const MAX_CAMERA_DISTANCE = 34;
const ZOOM_STEP = 1.8;

const EarthScene = ({ selectedSatellite, starlinkSatellites = [] }: EarthSceneProps) => {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.target.set(0, 0, 0);
    controls.object.position.copy(DEFAULT_CAMERA_POSITION);
    controls.object.lookAt(0, 0, 0);
    controls.update();
    controls.saveState();
  }, []);

  const zoomCamera = useCallback((direction: 'in' | 'out') => {
    const controls = controlsRef.current;
    if (!controls) return;

    const camera = controls.object;

    const target = controls.target.clone();
    const offset = camera.position.clone().sub(target);
    const distance = offset.length();
    const delta = direction === 'in' ? -ZOOM_STEP : ZOOM_STEP;
    const nextDistance = Math.min(MAX_CAMERA_DISTANCE, Math.max(MIN_CAMERA_DISTANCE, distance + delta));

    offset.setLength(nextDistance);
    camera.position.copy(target).add(offset);
    controls.update();
  }, []);

  const resetCameraCenter = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    controls.reset();
    controls.target.set(0, 0, 0);
    controls.object.position.copy(DEFAULT_CAMERA_POSITION);
    controls.object.lookAt(0, 0, 0);
    controls.update();
  }, []);

  return (
    <div className="viewport">
      <div
        className="earth-camera-controls"
      >
        <button
          type="button"
          className="hud-button on"
          onClick={() => zoomCamera('in')}
          aria-label="Zoom in"
        >
          Zoom +
        </button>
        <button
          type="button"
          className="hud-button"
          onClick={() => zoomCamera('out')}
          aria-label="Zoom out"
        >
          Zoom -
        </button>
        <button
          type="button"
          className="hud-button"
          onClick={resetCameraCenter}
          aria-label="Reset camera center"
        >
          Center
        </button>
      </div>

      <Canvas
        camera={{ position: DEFAULT_CAMERA_POSITION.toArray(), fov: 28 }}
        style={{ width: '100%', height: '100%', background: 'transparent', flex: 1 }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Earth with axial tilt (-23.4°) */}
        <group rotation={[-0.408, 0, 0]}>
          <Earth selectedSatellite={selectedSatellite ?? null} starlinkSatellites={starlinkSatellites} />
        </group>

        {/* Controls */}
        <OrbitControls
          ref={controlsRef}
          enableZoom={true}
          enablePan={true}
          autoRotate={true}
          autoRotateSpeed={0.3}
          minDistance={MIN_CAMERA_DISTANCE}
          maxDistance={MAX_CAMERA_DISTANCE}
          enableDamping={true}
          dampingFactor={0.05}
          target={[0, 0, 0]}
          panSpeed={0.7}
          minPolarAngle={0.2}
          maxPolarAngle={Math.PI - 0.2}
        />
      </Canvas>
    </div>
  );
};

export default EarthScene;
