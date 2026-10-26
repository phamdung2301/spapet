import { useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function Bubbles({ pausedRef }: { pausedRef: React.RefObject<boolean> }) {
  const group = useRef<THREE.Group>(null);
  const target = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth - 0.5) * 0.6;
      target.current.y = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    const d = Math.min(delta, 1 / 30);
    if (!pausedRef.current && !document.hidden) {
      group.current.rotation.y += d * 0.35;
      group.current.rotation.x += (target.current.y - group.current.rotation.x) * 0.03;
      group.current.rotation.y += (target.current.x - 0) * 0.01;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.08;
    }
  });

  const bubbles: Array<[number, number, number, number]> = [
    [-1.6, 0.8, -0.5, 0.42],
    [1.5, 1.0, -0.8, 0.55],
    [0.9, -0.9, 0.2, 0.35],
    [-1.1, -1.0, 0.4, 0.3],
    [0.1, 1.3, -1.2, 0.28],
  ];

  return (
    <group ref={group}>
      <mesh position={[0, 0, 0]}>
        <torusKnotGeometry args={[0.7, 0.22, 160, 24]} />
        <meshPhysicalMaterial color="#ffb59e" roughness={0.25} metalness={0.1} clearcoat={1} clearcoatRoughness={0.2} />
      </mesh>
      {bubbles.map((b, i) => (
        <mesh key={i} position={[b[0], b[1], b[2]]}>
          <sphereGeometry args={[b[3], 32, 32]} />
          <meshPhysicalMaterial color="#cfe8dd" roughness={0.05} metalness={0} transmission={0.6} transparent opacity={0.85} clearcoat={1} />
        </mesh>
      ))}
      <mesh position={[1.8, -0.2, 0.6]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#7fa893" roughness={0.4} />
      </mesh>
      <mesh position={[-1.9, -0.3, 0.6]}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#7fa893" roughness={0.4} />
      </mesh>
    </group>
  );
}

export default function Hero3D({ paused }: { paused: boolean }) {
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) {
    return (
      <div className="hero-3d" role="img" aria-label="Minh họa bong bóng spa và vòng đồ chơi cho thú cưng">
        <div className="poster">🫧 🐾 🫧</div>
      </div>
    );
  }

  return (
    <div className="hero-3d" role="img" aria-label="Cảnh 3D bong bóng spa xoay theo chuột, nút Pause dừng chuyển động">
      <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 5], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 5, 4]} intensity={1.4} />
        <pointLight position={[-4, -2, 3]} intensity={0.6} color="#ffb59e" />
        <Bubbles pausedRef={pausedRef} />
      </Canvas>
    </div>
  );
}
