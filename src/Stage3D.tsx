import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Coat, PetType, StepId } from "./data";

interface StageProps {
  step: StepId;
  pet: PetType;
  coat: Coat;
  perfumeOn: boolean;
  paused: boolean;
}

/** Deterministic bubble seeds so the stage is stable between renders. */
const BUBBLES = Array.from({ length: 16 }, (_, i) => ({
  x: -2.4 + ((i * 37) % 16) * 0.11,
  z: -0.6 + ((i * 53) % 10) * 0.12,
  y: 0.4 + ((i * 29) % 12) * 0.18,
  s: 0.09 + ((i * 17) % 5) * 0.04,
  speed: 0.25 + ((i * 11) % 4) * 0.12,
}));

const SPARKLES = Array.from({ length: 12 }, (_, i) => ({
  angle: (i / 12) * Math.PI * 2,
  r: 0.85 + ((i * 13) % 4) * 0.12,
  y: 1.1 + ((i * 7) % 5) * 0.18,
  s: 0.05 + ((i * 5) % 3) * 0.02,
}));

const DROPS = Array.from({ length: 10 }, (_, i) => ({
  x: -1.9 + ((i * 23) % 7) * 0.18,
  z: -0.3 + ((i * 19) % 5) * 0.14,
  y: 2.4 + ((i * 31) % 6) * 0.25,
  speed: 1.4 + ((i * 7) % 3) * 0.4,
}));

function Pet({ pet, coat, position }: { pet: PetType; coat: Coat; position: [number, number, number] }) {
  const coatScale = coat === "long" ? 1.22 : coat === "curly" ? 1.14 : 1.02;
  const bodyScale = pet === "cat" ? 0.82 : 1;
  const coatColor = coat === "long" ? "#f6d9b8" : coat === "curly" ? "#e8c9a8" : "#fdf3e3";
  const bodyColor = pet === "cat" ? "#d9c8b4" : "#f2e2c8";
  return (
    <group position={position} scale={bodyScale}>
      {/* body */}
      <mesh position={[0, 0.55, 0]} scale={[1.15, 0.85, 0.8]}>
        <sphereGeometry args={[0.55, 24, 20]} />
        <meshStandardMaterial color={bodyColor} roughness={0.9} />
      </mesh>
      {/* coat shell — visibly grows with coat length */}
      <mesh position={[0, 0.58, 0]} scale={[1.15 * coatScale, 0.85 * coatScale, 0.8 * coatScale]}>
        <sphereGeometry args={[0.55, 24, 20]} />
        <meshStandardMaterial color={coatColor} roughness={1} transparent opacity={0.85} />
      </mesh>
      {/* head */}
      <mesh position={[0.62, 1.05, 0]}>
        <sphereGeometry args={[0.38, 24, 20]} />
        <meshStandardMaterial color={bodyColor} roughness={0.9} />
      </mesh>
      <mesh position={[0.95, 1.08, 0.16]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color="#2b2620" />
      </mesh>
      <mesh position={[0.95, 1.08, -0.16]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshStandardMaterial color="#2b2620" />
      </mesh>
      <mesh position={[0.98, 0.95, 0]}>
        <sphereGeometry args={[0.09, 12, 10]} />
        <meshStandardMaterial color="#8a5a44" />
      </mesh>
      {pet === "dog" ? (
        <>
          <mesh position={[0.45, 1.18, 0.3]} rotation={[0, 0, 0.35]}>
            <boxGeometry args={[0.12, 0.42, 0.22]} />
            <meshStandardMaterial color="#c9a98f" />
          </mesh>
          <mesh position={[0.45, 1.18, -0.3]} rotation={[0, 0, 0.35]}>
            <boxGeometry args={[0.12, 0.42, 0.22]} />
            <meshStandardMaterial color="#c9a98f" />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0.5, 1.42, 0.2]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.14, 0.32, 4]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
          <mesh position={[0.5, 1.42, -0.2]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.14, 0.32, 4]} />
            <meshStandardMaterial color={bodyColor} />
          </mesh>
        </>
      )}
      {/* legs */}
      {[-0.35, 0.35].map((z, i) => (
        <mesh key={i} position={[-0.3, 0.18, z]}>
          <cylinderGeometry args={[0.09, 0.09, 0.36, 10]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
      ))}
      {[-0.35, 0.35].map((z, i) => (
        <mesh key={`b${i}`} position={[0.3, 0.18, z]}>
          <cylinderGeometry args={[0.09, 0.09, 0.36, 10]} />
          <meshStandardMaterial color={bodyColor} />
        </mesh>
      ))}
      {/* tail */}
      <mesh position={[-0.68, 0.75, 0]} rotation={[0, 0, pet === "cat" ? 0.2 : 0.9]}>
        <cylinderGeometry args={[0.07, 0.05, 0.5, 10]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
    </group>
  );
}

function Bubbles({ visible, paused }: { visible: boolean; paused: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (paused || !ref.current) return;
    ref.current.children.forEach((child, i) => {
      child.position.y += delta * BUBBLES[i % BUBBLES.length].speed;
      if (child.position.y > 3.2) child.position.y = 0.4;
    });
  });
  if (!visible) return null;
  return (
    <group ref={ref}>
      {BUBBLES.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, b.z]}>
          <sphereGeometry args={[b.s, 16, 14]} />
          <meshPhysicalMaterial color="#cfe8ec" transmission={0.9} thickness={0.3} roughness={0.05} transparent opacity={0.75} />
        </mesh>
      ))}
    </group>
  );
}

function ShowerDrops({ visible, paused }: { visible: boolean; paused: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (paused || !ref.current) return;
    ref.current.children.forEach((child, i) => {
      child.position.y -= delta * DROPS[i % DROPS.length].speed;
      if (child.position.y < 0.7) child.position.y = DROPS[i % DROPS.length].y;
    });
  });
  if (!visible) return null;
  return (
    <group ref={ref}>
      {DROPS.map((d, i) => (
        <mesh key={i} position={[d.x, d.y, d.z]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color="#9fd4e0" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function DryerAir({ visible, paused }: { visible: boolean; paused: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (paused || !ref.current) return;
    ref.current.children.forEach((child, i) => {
      child.position.x -= delta * (1.2 + (i % 3) * 0.4);
      child.position.y += Math.sin(Date.now() * 0.004 + i) * 0.002;
      if (child.position.x < 0.2) child.position.x = 2.4;
    });
  });
  if (!visible) return null;
  return (
    <group ref={ref}>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[2.4 - i * 0.18, 1.35 + ((i * 7) % 4) * 0.12, ((i * 11) % 5) * 0.1 - 0.2]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshStandardMaterial color="#ffe3c2" transparent opacity={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Clippings({ visible, paused }: { visible: boolean; paused: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (paused || !ref.current) return;
    ref.current.children.forEach((child, i) => {
      child.position.y -= delta * 0.5;
      child.rotation.z += delta * 2;
      if (child.position.y < 0.9) child.position.y = 1.6 + (i % 3) * 0.2;
    });
  });
  if (!visible) return null;
  return (
    <group ref={ref}>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} position={[0.6 + ((i * 13) % 5) * 0.15, 1.6, ((i * 7) % 4) * 0.15 - 0.2]}>
          <boxGeometry args={[0.09, 0.02, 0.05]} />
          <meshStandardMaterial color="#e8c9a8" />
        </mesh>
      ))}
    </group>
  );
}

function Sparkles({ visible, paused, perfumeOn }: { visible: boolean; paused: boolean; perfumeOn: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (paused || !ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.4;
  });
  if (!visible) return null;
  const color = perfumeOn ? "#ffb59e" : "#ffe9a8";
  return (
    <group ref={ref} position={[0.9, 0, 0]}>
      {SPARKLES.map((s, i) => (
        <mesh key={i} position={[Math.cos(s.angle) * s.r, s.y, Math.sin(s.angle) * s.r]}>
          <sphereGeometry args={[s.s, 10, 8]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Station({ step, pet, coat, perfumeOn, paused }: StageProps) {
  const rig = useRef<THREE.Group>(null);
  const petRef = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const cursor = useRef({ x: 0, y: 0 });

  useFrame((state, delta) => {
    if (paused) return;
    // Cursor-lerp: never snap, always ease toward the cursor.
    const nx = (state.pointer.x || 0) * 0.22;
    const ny = (state.pointer.y || 0) * 0.12;
    cursor.current.x += (nx - cursor.current.x) * Math.min(1, delta * 3);
    cursor.current.y += (ny - cursor.current.y) * Math.min(1, delta * 3);
    if (rig.current) rig.current.rotation.y = cursor.current.x;
    if (rig.current) rig.current.rotation.x = cursor.current.y * 0.4;
    // Pet walks (lerps) between tub and table as the step changes.
    if (petRef.current) {
      if (step === "wash") target.set(-1.7, 0.55, 0);
      else target.set(0.9, 1.05, 0);
      petRef.current.position.lerp(target, Math.min(1, delta * 2));
    }
  });

  const wash = step === "wash";
  const dry = step === "dry";
  const cut = step === "cut";
  const perfume = step === "perfume";

  return (
    <group ref={rig}>
      {/* floor */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[7.5, 0.1, 4.5]} />
        <meshStandardMaterial color="#efe6d6" />
      </mesh>
      {/* round bathtub: basin + water disc, no ring geometry */}
      <group position={[-1.7, 0, 0]}>
        <mesh position={[0, 0.32, 0]}>
          <cylinderGeometry args={[1.05, 0.85, 0.65, 28]} />
          <meshStandardMaterial color="#7fa893" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 0.06, 28]} />
          <meshStandardMaterial color={wash ? "#a8d8e2" : "#cfe8ec"} transparent opacity={wash ? 0.95 : 0.55} />
        </mesh>
        {/* feet */}
        {[-0.6, 0.6].map((x, i) => (
          <mesh key={i} position={[x, 0.05, 0.55]}>
            <boxGeometry args={[0.18, 0.1, 0.18]} />
            <meshStandardMaterial color="#5d7a6a" />
          </mesh>
        ))}
      </group>
      {/* shower arm: vertical + horizontal + head */}
      <group position={[-1.7, 0, -1.1]}>
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 3, 10]} />
          <meshStandardMaterial color="#8a8f8a" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.95, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.1, 10]} />
          <meshStandardMaterial color="#8a8f8a" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 2.9, 1.05]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.22, 0.3, 16]} />
          <meshStandardMaterial color="#8a8f8a" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
      {/* grooming table */}
      <group position={[0.9, 0, 0]}>
        <mesh position={[0, 0.98, 0]}>
          <boxGeometry args={[2.2, 0.12, 1.3]} />
          <meshStandardMaterial color="#d9b48f" roughness={0.7} />
        </mesh>
        {[-0.95, 0.95].map((x, i) => (
          <mesh key={i} position={[x, 0.48, 0.5]}>
            <cylinderGeometry args={[0.06, 0.06, 0.95, 10]} />
            <meshStandardMaterial color="#6b6f6b" metalness={0.4} />
          </mesh>
        ))}
        {[-0.95, 0.95].map((x, i) => (
          <mesh key={`b${i}`} position={[x, 0.48, -0.5]}>
            <cylinderGeometry args={[0.06, 0.06, 0.95, 10]} />
            <meshStandardMaterial color="#6b6f6b" metalness={0.4} />
          </mesh>
        ))}
        {/* dryer box + nozzle, on the table edge */}
        <mesh position={[1.55, 1.25, -0.4]}>
          <boxGeometry args={[0.55, 0.35, 0.35]} />
          <meshStandardMaterial color="#ffb59e" />
        </mesh>
        <mesh position={[1.25, 1.25, -0.4]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.09, 0.12, 0.4, 12]} />
          <meshStandardMaterial color="#e88f74" />
        </mesh>
        {/* scissors prop, only prominent in Cut */}
        <group position={[-0.7, 1.15, 0.45]} rotation={[0, 0, cut ? 0.5 : 0.15]} visible={cut || dry}>
          <mesh rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.06, 0.6, 0.03]} />
            <meshStandardMaterial color="#9aa3a8" metalness={0.7} />
          </mesh>
          <mesh rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.06, 0.6, 0.03]} />
            <meshStandardMaterial color="#9aa3a8" metalness={0.7} />
          </mesh>
          <mesh position={[-0.12, -0.35, 0]}>
            <sphereGeometry args={[0.09, 12, 10]} />
            <meshStandardMaterial color="#ffb59e" />
          </mesh>
          <mesh position={[0.12, -0.35, 0]}>
            <sphereGeometry args={[0.09, 12, 10]} />
            <meshStandardMaterial color="#ffb59e" />
          </mesh>
        </group>
        {/* brush prop */}
        <group position={[-0.2, 1.1, -0.45]}>
          <mesh>
            <boxGeometry args={[0.4, 0.1, 0.22]} />
            <meshStandardMaterial color="#7fa893" />
          </mesh>
          <mesh position={[0.35, 0.05, 0]} rotation={[0, 0, -0.3]}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
            <meshStandardMaterial color="#8a6a4a" />
          </mesh>
        </group>
      </group>
      {/* the pet itself, lerping between tub and table */}
      <group ref={petRef} position={[0.9, 1.05, 0]}>
        <Pet pet={pet} coat={coat} position={[0, 0, 0]} />
      </group>
      <Bubbles visible={wash} paused={paused} />
      <ShowerDrops visible={wash} paused={paused} />
      <DryerAir visible={dry} paused={paused} />
      <Clippings visible={cut} paused={paused} />
      <Sparkles visible={perfume} paused={paused} perfumeOn={perfumeOn} />
    </group>
  );
}

export default function Stage3D(props: StageProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 2.4, 6.4], fov: 42 }}
      frameloop={props.paused ? "never" : "always"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 4]} intensity={1.1} />
      <pointLight position={[-3, 3, 2]} intensity={12} color="#ffd9c2" />
      <Station {...props} />
    </Canvas>
  );
}
