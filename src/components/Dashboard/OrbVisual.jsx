import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

// ─── Procedural Earth Shader ───
// Generates a stylized Earth with continents, oceans, atmosphere, and health-tinted glow
const earthVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const earthFragmentShader = `
  uniform float time;
  uniform vec3 healthColor;
  uniform float healthGlow;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // Simplex-ish noise for continents
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    // Generate continent shapes
    vec2 noiseCoord = vUv * vec2(6.0, 3.0) + vec2(time * 0.01, 0.0);
    float continentNoise = fbm(noiseCoord);

    // Polar ice caps
    float polarFactor = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
    float iceCap = 1.0 - polarFactor;

    // Ocean vs land threshold
    float landMask = smoothstep(0.45, 0.52, continentNoise);

    // Ocean colors (deep blue to lighter blue)
    vec3 deepOcean = vec3(0.02, 0.05, 0.15);
    vec3 shallowOcean = vec3(0.05, 0.15, 0.35);
    float oceanDetail = fbm(vUv * vec2(12.0, 6.0) + time * 0.02);
    vec3 oceanColor = mix(deepOcean, shallowOcean, oceanDetail * 0.5 + 0.3);

    // Land colors (greens, browns, desert)
    vec3 forest = vec3(0.05, 0.2, 0.08);
    vec3 desert = vec3(0.35, 0.25, 0.12);
    vec3 mountain = vec3(0.15, 0.12, 0.1);
    float landDetail = fbm(vUv * vec2(20.0, 10.0));
    vec3 landColor = mix(forest, desert, smoothstep(0.3, 0.7, landDetail));
    landColor = mix(landColor, mountain, smoothstep(0.65, 0.8, landDetail));

    // Ice/snow
    vec3 iceColor = vec3(0.85, 0.9, 0.95);

    // Combine
    vec3 surfaceColor = mix(oceanColor, landColor, landMask);
    surfaceColor = mix(surfaceColor, iceColor, iceCap * 0.8);

    // Atmosphere rim lighting
    float rimPower = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    float rim = pow(rimPower, 3.0);
    vec3 atmosphereColor = vec3(0.3, 0.6, 1.0);

    // Health-tinted atmosphere glow
    vec3 healthAtmosphere = mix(atmosphereColor, healthColor, 0.4);
    surfaceColor += healthAtmosphere * rim * 0.6;

    // City lights on dark side (subtle dots)
    float cityNoise = fbm(vUv * vec2(40.0, 20.0));
    float cities = smoothstep(0.7, 0.75, cityNoise) * landMask;
    vec3 cityLight = healthColor * cities * 0.3 * (1.0 - rim);
    surfaceColor += cityLight;

    // Health-colored outer glow
    surfaceColor += healthColor * rim * healthGlow * 0.3;

    // Subtle cloud layer
    float clouds = fbm(vUv * vec2(8.0, 4.0) + time * 0.03);
    float cloudMask = smoothstep(0.55, 0.7, clouds) * polarFactor;
    surfaceColor = mix(surfaceColor, vec3(0.9, 0.92, 0.95), cloudMask * 0.25);

    gl_FragColor = vec4(surfaceColor, 1.0);
  }
`;

function EarthGlobe({ healthScore }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const materialRef = useRef();

  const healthColor = useMemo(() => {
    if (healthScore >= 75) return new THREE.Color('#00e676');
    if (healthScore >= 40) return new THREE.Color('#ffab00');
    return new THREE.Color('#ff3d5a');
  }, [healthScore]);

  const healthGlow = healthScore >= 75 ? 0.3 : healthScore >= 40 ? 0.5 : 0.8;

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    healthColor: { value: healthColor },
    healthGlow: { value: healthGlow },
  }), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.08;
      meshRef.current.rotation.x = 0.15;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.15 + Math.sin(t * 0.5) * 0.02);
    }
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = t;
      materialRef.current.uniforms.healthColor.value = healthColor;
      materialRef.current.uniforms.healthGlow.value = healthGlow;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.3}>
      {/* Atmosphere glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.15, 64, 64]} />
        <meshBasicMaterial
          color={healthColor}
          transparent
          opacity={0.06}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Earth globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 128, 128]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={earthVertexShader}
          fragmentShader={earthFragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* Thin atmosphere ring */}
      <mesh>
        <sphereGeometry args={[1.02, 64, 64]} />
        <meshBasicMaterial
          color={new THREE.Color(0.3, 0.6, 1.0)}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>
    </Float>
  );
}

function Particles({ count = 100 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.2 + Math.random() * 1.5;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.03;
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.015;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#00d4ff" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function OrbRings() {
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.1;
      ring1Ref.current.rotation.z = t * 0.06;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.PI / 3 + Math.cos(t * 0.2) * 0.08;
      ring2Ref.current.rotation.z = -t * 0.05;
    }
  });

  return (
    <>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.8, 0.004, 16, 120]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.15} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.1, 0.003, 16, 120]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.1} />
      </mesh>
    </>
  );
}

export default function OrbVisual({ healthScore = 80, stats }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: 340 }}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 3, 5]} intensity={1.0} color="#ffffff" />
        <pointLight position={[-4, -2, 3]} intensity={0.3} color="#00d4ff" />

        <EarthGlobe healthScore={healthScore} />
        <Particles />
        <OrbRings />
        <Stars radius={50} depth={30} count={600} factor={2} fade speed={0.3} />
      </Canvas>

      {/* Floating stat overlays */}
      {stats && (
        <>
          <div style={{
            position: 'absolute', top: 30, left: '10%',
            textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#00d4ff', textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>
              {stats.clientsThisMonth}
            </div>
            <div style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1 }}>
              Clients This Month
            </div>
          </div>
          <div style={{
            position: 'absolute', top: 30, right: '10%',
            textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#00e676', textShadow: '0 0 20px rgba(0,230,118,0.5)' }}>
              ${stats.monthlySpend}
            </div>
            <div style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1 }}>
              Monthly Spend
            </div>
          </div>
          <div style={{
            position: 'absolute', bottom: 16, left: '50%',
            transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none',
          }}>
            <div style={{
              fontSize: 14, fontWeight: 700,
              color: healthScore >= 75 ? '#00e676' : healthScore >= 40 ? '#ffab00' : '#ff3d5a',
              textTransform: 'uppercase', letterSpacing: 2,
              textShadow: `0 0 15px ${healthScore >= 75 ? 'rgba(0,230,118,0.5)' : healthScore >= 40 ? 'rgba(255,171,0,0.5)' : 'rgba(255,61,90,0.5)'}`,
            }}>
              System Health: {healthScore}%
            </div>
          </div>
        </>
      )}
    </div>
  );
}
