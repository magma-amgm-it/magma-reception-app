import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';

function HealthOrb({ healthScore }) {
  const meshRef = useRef();
  const glowRef = useRef();

  // Health color: green (100) → amber (50) → red (0)
  const color = useMemo(() => {
    if (healthScore >= 75) return new THREE.Color('#00e676');
    if (healthScore >= 40) return new THREE.Color('#ffab00');
    return new THREE.Color('#ff3d5a');
  }, [healthScore]);

  const emissiveIntensity = healthScore >= 75 ? 0.4 : healthScore >= 40 ? 0.6 : 0.8;

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.15;
      meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.8 + Math.sin(t * 0.8) * 0.08);
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Main distorted orb */}
      <Sphere ref={meshRef} args={[1, 128, 128]}>
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.15}
          metalness={0.9}
          distort={0.25}
          speed={1.5}
          transparent
          opacity={0.85}
        />
      </Sphere>

      {/* Inner core glow */}
      <Sphere args={[0.5, 32, 32]}>
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </Sphere>
    </Float>
  );
}

function Particles({ count = 120 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2 + Math.random() * 1.5;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      ref.current.rotation.x = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={count}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#00d4ff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function OrbRings() {
  const ring1Ref = useRef();
  const ring2Ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.3) * 0.15;
      ring1Ref.current.rotation.z = t * 0.1;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = Math.PI / 3 + Math.cos(t * 0.2) * 0.1;
      ring2Ref.current.rotation.z = -t * 0.08;
    }
  });

  return (
    <>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[1.8, 0.005, 16, 100]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.2} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[2.1, 0.004, 16, 100]} />
        <meshBasicMaterial color="#a855f7" transparent opacity={0.15} />
      </mesh>
    </>
  );
}

export default function OrbVisual({ healthScore = 80, stats }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: 320 }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[5, 5, 5]} intensity={0.8} color="#00d4ff" />
        <pointLight position={[-5, -3, 3]} intensity={0.4} color="#ff006e" />

        <HealthOrb healthScore={healthScore} />
        <Particles />
        <OrbRings />
        <Stars radius={50} depth={30} count={800} factor={2} fade speed={0.5} />
      </Canvas>

      {/* Floating stat overlays */}
      {stats && (
        <>
          <div style={{
            position: 'absolute',
            top: 30,
            left: '10%',
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#00d4ff', textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>
              {stats.clientsThisMonth}
            </div>
            <div style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1 }}>
              Clients This Month
            </div>
          </div>
          <div style={{
            position: 'absolute',
            top: 30,
            right: '10%',
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#00e676', textShadow: '0 0 20px rgba(0,230,118,0.5)' }}>
              ${stats.monthlySpend}
            </div>
            <div style={{ fontSize: 10, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1 }}>
              Monthly Spend
            </div>
          </div>
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              fontSize: 14,
              fontWeight: 700,
              color: healthScore >= 75 ? '#00e676' : healthScore >= 40 ? '#ffab00' : '#ff3d5a',
              textTransform: 'uppercase',
              letterSpacing: 2,
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
