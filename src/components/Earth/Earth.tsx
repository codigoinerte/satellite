import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Satellite3D } from '../../types/satellite';

// ─── Texture URLs (same as three.js TSL earth example) ──────────────────────
const TEXTURE_URLS = {
  day: 'https://threejs.org/examples/textures/planets/earth_day_4096.jpg',
  night: 'https://threejs.org/examples/textures/planets/earth_night_4096.jpg',
  // R = bump height, G = roughness, B = clouds
  bumpRoughnessClouds: 'https://threejs.org/examples/textures/planets/earth_bump_roughness_clouds_4096.jpg',
};

// ─── Globe Vertex Shader ─────────────────────────────────────────────────────
const globeVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vUv = uv;
    // World-space normal and position for lighting calculations
    vNormalW = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vPositionW = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ─── Globe Fragment Shader (replicates three.js TSL earth example in GLSL) ──
const globeFragmentShader = /* glsl */ `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform sampler2D bumpRoughnessCloudsTexture;
  uniform vec3 sunDirection;
  uniform float roughnessLow;
  uniform float roughnessHigh;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vec3 normal = normalize(vNormalW);
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    vec3 sunDir = normalize(sunDirection);

    // ── Sun orientation ──
    float sunOrientation = dot(normal, sunDir);

    // ── Fresnel: 0 at center, 1 at edges ──
    float fresnel = 1.0 - abs(dot(viewDir, normal));

    // ── Sample textures ──
    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
    vec3 nightColor = texture2D(nightTexture, vUv).rgb;
    vec4 brc = texture2D(bumpRoughnessCloudsTexture, vUv);
    // R = bump, G = roughness, B = clouds
    float roughnessValue = brc.g;
    float cloudsStrength = smoothstep(0.2, 1.0, brc.b);

    // ── Clouds blended into day color (white overlay, clamped) ──
    dayColor = mix(dayColor, vec3(1.0), min(cloudsStrength * 2.0, 1.0));

    // ── Roughness: combine texture roughness with clouds ──
    float roughness = max(roughnessValue, step(0.01, cloudsStrength));
    roughness = mix(roughnessLow, roughnessHigh, roughness);

    // ── Diffuse lighting (Lambert) with light intensity 2.0 ──
    float diffuse = max(0.0, dot(normal, sunDir));
    float lightIntensity = 2.0;
    vec3 litDayColor = dayColor * diffuse * lightIntensity;

    // ── PBR-approximate specular (GGX-like distribution) ──
    // The three.js TSL example uses MeshStandardNodeMaterial (PBR),
    // so we approximate with a broad, energy-conserving specular.
    vec3 halfDir = normalize(sunDir + viewDir);
    float NdotH = max(0.0, dot(normal, halfDir));
    float alpha2 = roughness * roughness * roughness * roughness; // roughness^4 for GGX
    float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
    float D = alpha2 / (3.14159 * denom * denom);
    float spec = D * (1.0 - roughness) * 0.04 * diffuse;
    litDayColor += vec3(1.0) * spec;

    // ── Day/Night blend ──
    float dayStrength = smoothstep(-0.25, 0.5, sunOrientation);
    vec3 earthColor = mix(nightColor, litDayColor, dayStrength);

    // ── Atmosphere color: bright blue (day) ↔ dim blue (twilight) ──
    vec3 atmDayColor = vec3(0.302, 0.698, 1.0);      // #4db2ff
    vec3 atmTwilightColor = vec3(0.15, 0.35, 0.65);  // dim blue
    vec3 atmosphereColor = mix(
      atmTwilightColor,
      atmDayColor,
      smoothstep(-0.25, 0.75, sunOrientation)
    );

    // ── Atmosphere mix: fresnel² × sun-facing ──
    float atmDayStrength = smoothstep(-0.5, 1.0, sunOrientation);
    float atmMix = clamp(atmDayStrength * pow(fresnel, 2.0), 0.0, 1.0);

    vec3 finalColor = mix(earthColor, atmosphereColor, atmMix);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

// ─── Atmosphere Vertex Shader ────────────────────────────────────────────────
const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vNormalW = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vPositionW = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ─── Atmosphere Fragment Shader ──────────────────────────────────────────────
const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 sunDirection;

  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vec3 normal = normalize(vNormalW);
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    vec3 sunDir = normalize(sunDirection);

    float sunOrientation = dot(normal, sunDir);
    float fresnel = 1.0 - abs(dot(viewDir, normal));

    // Atmosphere alpha: remap fresnel [0.73, 1] → [1, 0], then pow(3)
    float alpha = pow(clamp((fresnel - 0.73) / (1.0 - 0.73), 0.0, 1.0), 3.0);
    // Only on sun-facing side
    alpha *= smoothstep(-0.5, 1.0, sunOrientation);

    // Atmosphere color: bright blue (day) ↔ dim blue (twilight)
    vec3 atmDayColor = vec3(0.302, 0.698, 1.0);      // #4db2ff
    vec3 atmTwilightColor = vec3(0.15, 0.35, 0.65);  // dim blue
    vec3 atmosphereColor = mix(
      atmTwilightColor,
      atmDayColor,
      smoothstep(-0.25, 0.75, sunOrientation)
    );

    gl_FragColor = vec4(atmosphereColor, alpha);
  }
`;

// ─── Earth with Shader Materials ─────────────────────────────────────────────
function EarthWithTextures({
  dayMap, nightMap, bumpRoughnessCloudsMap, children,
}: {
  dayMap: THREE.Texture;
  nightMap: THREE.Texture;
  bumpRoughnessCloudsMap: THREE.Texture;
  children?: React.ReactNode;
}) {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const satGroupRef = useRef<THREE.Group>(null);


  // Sun direction — fixed in world space along +X
  // The Earth rotates to show correct day/night based on UTC time
  const sunDir = useMemo(() => new THREE.Vector3(1, 0, 0), []);

  // Globe ShaderMaterial
  const globeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: globeVertexShader,
      fragmentShader: globeFragmentShader,
      uniforms: {
        dayTexture: { value: dayMap },
        nightTexture: { value: nightMap },
        bumpRoughnessCloudsTexture: { value: bumpRoughnessCloudsMap },
        sunDirection: { value: sunDir },
        roughnessLow: { value: 0.25 },
        roughnessHigh: { value: 0.35 },
      },
    });
  }, [dayMap, nightMap, bumpRoughnessCloudsMap, sunDir]);

  // Atmosphere ShaderMaterial
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: atmosphereVertexShader,
      fragmentShader: atmosphereFragmentShader,
      uniforms: {
        sunDirection: { value: sunDir },
      },
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
  }, [sunDir]);

  useFrame(() => {
    const now = new Date();
    const utcH = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;

    // Earth rotation: align the subsolar longitude with the sun direction (+X)
    // At 12:00 UTC, longitude 0° (Greenwich) faces the sun → rotation.y = 0
    // At 00:00 UTC, longitude 180° faces the sun → rotation.y = π
    const earthAngle = ((utcH - 12) / 24) * Math.PI * 2;

    if (globeRef.current) globeRef.current.rotation.y = earthAngle;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y = earthAngle;
    if (satGroupRef.current) satGroupRef.current.rotation.y = earthAngle;


    // Update sun direction with seasonal declination
    // Declination = 23.44° × sin(2π × (dayOfYear - 81) / 365)
    const start = new Date(now.getUTCFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
    const declination = 23.44 * Math.sin((2 * Math.PI * (dayOfYear - 81)) / 365);
    const decRad = declination * (Math.PI / 180);

    sunDir.set(Math.cos(decRad), Math.sin(decRad), 0).normalize();
  });

  return (
    <group>
      {/* Globe — single mesh, day/night/clouds/atmosphere all in shader */}
      <mesh ref={globeRef} material={globeMaterial}>
        <sphereGeometry args={[5, 64, 64]} />
      </mesh>

      {/* Atmosphere — separate BackSide mesh for edge glow */}
      <mesh ref={atmosphereRef} scale={1.04} material={atmosphereMaterial}>
        <sphereGeometry args={[5, 64, 64]} />
      </mesh>

      {/* Satellites — rotate with the Earth */}
      <group ref={satGroupRef}>
        {children}
      </group>

    </group>
  );
}

// ─── Satellite Orbit Trajectory ──────────────────────────────────────────────
const GLOBE_RADIUS = 5;
const RE = 6371.0;

function latLngAltToVec3(lat: number, lng: number, alt: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = GLOBE_RADIUS + (alt / RE) * 0.8;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

function SatelliteOrbit({ satellite }: { satellite: Satellite3D }) {
  const markerRef = useRef<THREE.Mesh>(null);

  const { orbitLineObj, currentPos } = useMemo(() => {
    const inc = satellite.inclination * (Math.PI / 180);
    const safeInc = Math.max(Math.abs(inc), 0.001);
    const latRad = satellite.lat * (Math.PI / 180);
    const lngRad = satellite.lng * (Math.PI / 180);

    // Compute argument of latitude from current position
    const sinArgLat = Math.sin(latRad) / Math.sin(safeInc);
    const argLat = Math.asin(Math.max(-1, Math.min(1, sinArgLat)));
    // Determine ascending node longitude
    const ascNodeLng = lngRad - Math.atan2(
      Math.sin(argLat) * Math.cos(inc),
      Math.cos(argLat)
    );

    // Generate orbit points (full 360° loop)
    const points: THREE.Vector3[] = [];
    const N = 256;
    for (let i = 0; i <= N; i++) {
      const u = (i / N) * Math.PI * 2;
      const lat_i = Math.asin(Math.sin(safeInc) * Math.sin(u)) * (180 / Math.PI);
      const lng_i = (ascNodeLng + Math.atan2(
        Math.sin(u) * Math.cos(inc),
        Math.cos(u)
      )) * (180 / Math.PI);
      points.push(latLngAltToVec3(lat_i, lng_i, satellite.alt));
    }

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xff2233, transparent: true, opacity: 0.6 });
    const lineObj = new THREE.Line(geom, mat);

    const currentPos = latLngAltToVec3(satellite.lat, satellite.lng, satellite.alt);

    return { orbitLineObj: lineObj, currentPos };
  }, [satellite]);

  // Pulse animation for the marker
  useFrame(({ clock }) => {
    if (markerRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 3) * 0.2;
      markerRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group>
      {/* Orbit trajectory line */}
      <primitive object={orbitLineObj} />

      {/* Satellite position marker — red diamond */}
      <mesh ref={markerRef} position={currentPos}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshBasicMaterial color={0xff2233} />
      </mesh>

      {/* Glow ring around marker */}
      <mesh position={currentPos} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.25, 32]} />
        <meshBasicMaterial color={0xff2233} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ─── Shared geometry + material for Starlink instanced spheres ────────────────
const starlinkSphereGeo = new THREE.SphereGeometry(0.025, 8, 6);
const starlinkSphereMat = new THREE.MeshBasicMaterial({ color: 0xff8c00 });
const _dummy = new THREE.Object3D();

// ─── Starlink Spheres (single draw call via InstancedMesh) ───────────────────
function StarlinkPoints({ satellites }: { satellites: Satellite3D[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh || satellites.length === 0) return;

    for (let i = 0; i < satellites.length; i++) {
      _dummy.position.set(
        satellites[i].position[0],
        satellites[i].position[1],
        satellites[i].position[2],
      );
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = satellites.length;
  }, [satellites]);

  if (satellites.length === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[starlinkSphereGeo, starlinkSphereMat, satellites.length]}
    />
  );
}

// ─── Main Component — loads textures then renders ────────────────────────────
export default function Earth({
  selectedSatellite = null,
  starlinkSatellites = [],
}: {
  selectedSatellite?: Satellite3D | null;
  starlinkSatellites?: Satellite3D[];
}) {
  const [textures, setTextures] = useState<{
    day: THREE.Texture;
    night: THREE.Texture;
    bumpRoughnessClouds: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    Promise.all([
      loader.loadAsync(TEXTURE_URLS.day),
      loader.loadAsync(TEXTURE_URLS.night),
      loader.loadAsync(TEXTURE_URLS.bumpRoughnessClouds),
    ])
      .then(([day, night, bumpRoughnessClouds]) => {
        day.colorSpace = THREE.SRGBColorSpace;
        day.anisotropy = 8;
        night.colorSpace = THREE.SRGBColorSpace;
        night.anisotropy = 8;
        bumpRoughnessClouds.anisotropy = 8;
        setTextures({ day, night, bumpRoughnessClouds });
      })
      .catch((err) => {
        console.warn('Failed to load Earth textures:', err);
      });
  }, []);

  if (!textures) {
    return (
      <group>
        <mesh>
          <sphereGeometry args={[5, 32, 32]} />
          <meshBasicMaterial color={0x2d6fb7} transparent opacity={0.95} />
        </mesh>
        <mesh scale={1.04}>
          <sphereGeometry args={[5, 24, 24]} />
          <meshBasicMaterial color={0x6eb9ff} transparent opacity={0.18} side={THREE.BackSide} />
        </mesh>
      </group>
    );
  }

  return (
    <group>
      <EarthWithTextures
        dayMap={textures.day}
        nightMap={textures.night}
        bumpRoughnessCloudsMap={textures.bumpRoughnessClouds}
      >
        {selectedSatellite && <SatelliteOrbit satellite={selectedSatellite} />}
        {starlinkSatellites.length > 0 && <StarlinkPoints satellites={starlinkSatellites} />}
      </EarthWithTextures>
    </group>
  );
}
