import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Texture URLs (open-source CDN) ─────────────────────────────────────────
const TEXTURE_URLS = {
  day: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-day.jpg',
  night: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-night.jpg',
  bump: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png',
  specular: 'https://unpkg.com/three-globe@2.31.1/example/img/earth-water.png',
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

// ─── Globe Fragment Shader (replicates TSL earth logic in GLSL) ──────────────
const globeFragmentShader = /* glsl */ `
  uniform sampler2D dayTexture;
  uniform sampler2D nightTexture;
  uniform sampler2D bumpTexture;
  uniform sampler2D specularTexture;
  uniform vec3 sunDirection;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vec3 normal = normalize(vNormalW);
    vec3 viewDir = normalize(cameraPosition - vPositionW);
    vec3 sunDir = normalize(sunDirection);

    // ── Sun orientation: how much does this pixel face the sun? ──
    float sunOrientation = dot(normal, sunDir);

    // ── Fresnel: 0 at center, 1 at edges ──
    float fresnel = 1.0 - abs(dot(viewDir, normal));

    // ── Sample textures ──
    vec3 dayColor = texture2D(dayTexture, vUv).rgb;
    vec3 nightColor = texture2D(nightTexture, vUv).rgb;
    float bumpValue = texture2D(bumpTexture, vUv).r;
    float waterMask = texture2D(specularTexture, vUv).r;

    // ── Simple cloud approximation from bump high-frequency ──
    float clouds = smoothstep(0.6, 0.9, bumpValue) * 0.3;
    dayColor = mix(dayColor, vec3(1.0), clouds);

    // ── Diffuse lighting (Lambert) ──
    float diffuse = max(0.0, dot(normal, sunDir));
    vec3 litDayColor = dayColor * (0.15 + 0.85 * diffuse);

    // ── Specular highlight (Blinn-Phong) — ocean only ──
    vec3 halfDir = normalize(sunDir + viewDir);
    float spec = pow(max(0.0, dot(normal, halfDir)), 40.0);
    // Water is shiny, land is matte
    spec *= waterMask * (1.0 - clouds) * diffuse;
    litDayColor += vec3(0.4, 0.4, 0.5) * spec;

    // ── Day/Night blend ──
    // smoothstep(-0.25, 0.5): matches the three.js TSL example
    float dayStrength = smoothstep(-0.25, 0.5, sunOrientation);
    vec3 earthColor = mix(nightColor, litDayColor, dayStrength);

    // ── Atmosphere color: twilight (#bc490b) → day (#4db2ff) ──
    vec3 atmDayColor = vec3(0.302, 0.698, 1.0);
    vec3 atmTwilightColor = vec3(0.737, 0.286, 0.043);
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

    // Atmosphere visible only at edges (fresnel > 0.65)
    float alpha = pow(clamp((fresnel - 0.65) / 0.35, 0.0, 1.0), 3.0);
    // Only on sun-facing side
    alpha *= smoothstep(-0.5, 1.0, sunOrientation);

    // Atmosphere color
    vec3 atmDayColor = vec3(0.302, 0.698, 1.0);
    vec3 atmTwilightColor = vec3(0.737, 0.286, 0.043);
    vec3 atmosphereColor = mix(
      atmTwilightColor,
      atmDayColor,
      smoothstep(-0.25, 0.75, sunOrientation)
    );

    gl_FragColor = vec4(atmosphereColor, alpha);
  }
`;

// ─── Orbital Rings ───────────────────────────────────────────────────────────
function createOrbitalRings() {
  const group = new THREE.Group();

  const createRing = (
    radius: number,
    rotX: number,
    rotZ: number,
    color: number,
    opacity: number,
    dash?: { dashSize: number; gapSize: number }
  ) => {
    const points: number[] = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      points.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(points), 3));

    let mat: THREE.Material;
    if (dash) {
      mat = new THREE.LineDashedMaterial({
        color, transparent: true, opacity,
        dashSize: dash.dashSize, gapSize: dash.gapSize,
      });
    } else {
      mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    }

    const line = new THREE.Line(geom, mat);
    line.rotation.x = THREE.MathUtils.degToRad(rotX);
    line.rotation.z = THREE.MathUtils.degToRad(rotZ);
    if (dash) line.computeLineDistances();
    group.add(line);
  };

  createRing(6.5, 72, 0, 0xa0c8d8, 0.5);
  createRing(7.5, 60, 42, 0x80a8c8, 0.35, { dashSize: 0.4, gapSize: 0.2 });
  createRing(8.5, 54, -22, 0xa62c2e, 0.4, { dashSize: 0.1, gapSize: 0.15 });

  return group;
}

// ─── Earth with Shader Materials ─────────────────────────────────────────────
function EarthWithTextures({
  dayMap, nightMap, bumpMap, specularMap,
}: {
  dayMap: THREE.Texture;
  nightMap: THREE.Texture;
  bumpMap: THREE.Texture;
  specularMap: THREE.Texture;
}) {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  const ringsGroup = useMemo(() => createOrbitalRings(), []);

  // Sun direction uniform — shared between globe and atmosphere
  const sunDir = useMemo(() => new THREE.Vector3(1, 0.3, 1).normalize(), []);

  // Globe ShaderMaterial
  const globeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: globeVertexShader,
      fragmentShader: globeFragmentShader,
      uniforms: {
        dayTexture: { value: dayMap },
        nightTexture: { value: nightMap },
        bumpTexture: { value: bumpMap },
        specularTexture: { value: specularMap },
        sunDirection: { value: sunDir },
      },
    });
  }, [dayMap, nightMap, bumpMap, specularMap, sunDir]);

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
    const speed = 0.0003;
    if (globeRef.current) globeRef.current.rotation.y += speed;
    if (atmosphereRef.current) atmosphereRef.current.rotation.y += speed;
    if (ringsRef.current) ringsRef.current.rotation.y += speed * 0.5;
  });

  return (
    <group>
      {/* Globe — single mesh, all day/night/atmosphere in shader */}
      <mesh ref={globeRef} material={globeMaterial}>
        <sphereGeometry args={[5, 64, 64]} />
      </mesh>

      {/* Atmosphere — separate BackSide mesh for edge glow */}
      <mesh ref={atmosphereRef} scale={1.04} material={atmosphereMaterial}>
        <sphereGeometry args={[5, 64, 64]} />
      </mesh>

      {/* Orbital rings */}
      <group ref={ringsRef}>
        <primitive object={ringsGroup} />
      </group>
    </group>
  );
}

// ─── Main Component — loads textures then renders ────────────────────────────
export default function Earth() {
  const [textures, setTextures] = useState<{
    day: THREE.Texture;
    night: THREE.Texture;
    bump: THREE.Texture;
    specular: THREE.Texture;
  } | null>(null);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';

    Promise.all([
      loader.loadAsync(TEXTURE_URLS.day),
      loader.loadAsync(TEXTURE_URLS.night),
      loader.loadAsync(TEXTURE_URLS.bump),
      loader.loadAsync(TEXTURE_URLS.specular),
    ])
      .then(([day, night, bump, specular]) => {
        day.colorSpace = THREE.SRGBColorSpace;
        day.anisotropy = 8;
        night.colorSpace = THREE.SRGBColorSpace;
        night.anisotropy = 8;
        bump.anisotropy = 8;
        specular.anisotropy = 8;
        setTextures({ day, night, bump, specular });
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
          <meshBasicMaterial color={0x111520} wireframe />
        </mesh>
      </group>
    );
  }

  return (
    <EarthWithTextures
      dayMap={textures.day}
      nightMap={textures.night}
      bumpMap={textures.bump}
      specularMap={textures.specular}
    />
  );
}
