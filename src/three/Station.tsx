import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import type { Coat, PetType, StepId } from "../data";
import Pet, { petScaleFor } from "./Pet";
import Fur from "./Fur";
import { Bubbles, Clippings, DryerAir, ShowerStream } from "./particles";

/**
 * 3D-05 — the grooming station. Everything that used to pop with
 * `visible={…}` now damps: the water disc fades, the scissors glide between a
 * resting pose and a working pose, the dryer nozzle aims at the pet, and the
 * particle systems fade via their own strength refs. The rig intro, cursor
 * lerp and scrollT scrub are preserved unchanged (behavior contract).
 */

export interface StationProps {
  step: StepId;
  pet: PetType;
  coat: Coat;
  perfumeOn: boolean;
  paused: boolean;
  /** 0..1 scroll progress through the stage+process zone: scrubs the rig rotation. */
  scrollT: number;
  /** visual scale mapped from the S/M/L/XL selector (3D-10) */
  sizeScale: number;
  lowEnd: boolean;
}

export default function Station({ step, pet, coat, perfumeOn, paused, scrollT, sizeScale, lowEnd }: StationProps) {
  const rig = useRef<THREE.Group>(null);
  const petRef = useRef<THREE.Group>(null);
  const waterMat = useRef<THREE.MeshStandardMaterial>(null);
  const scissors = useRef<THREE.Group>(null);
  const bladeL = useRef<THREE.Mesh>(null);
  const bladeR = useRef<THREE.Mesh>(null);
  const dryer = useRef<THREE.Group>(null);
  const perfumeGroup = useRef<THREE.Group>(null);
  const bottle = useRef<THREE.Group>(null);

  const target = useMemo(() => new THREE.Vector3(), []);
  const petBase = useMemo(() => new THREE.Vector3(0.9, 1.07, 0), []);
  const cursor = useRef({ x: 0, y: 0 });
  const bob = useRef({ phase: 0, amp: 0 });
  const petScale = useRef(1);
  const perfumeStrength = useRef(0);
  const snipAmp = useRef(0);

  const waterDry = useMemo(() => new THREE.Color("#cfe8ec"), []);
  const waterWash = useMemo(() => new THREE.Color("#a8d8e2"), []);

  const wash = step === "wash";
  const dry = step === "dry";
  const cut = step === "cut";
  const perfume = step === "perfume";

  const counts = {
    bubbles: lowEnd ? 16 : 28,
    drops: lowEnd ? 10 : 16,
    air: lowEnd ? 8 : 14,
    clippings: lowEnd ? 10 : 18,
  };

  useFrame((state, delta) => {
    if (paused) return;

    // Assembly intro (v3.1, preserved): the station flies in and settles.
    const raw = Math.min(1, state.clock.elapsedTime / 1.4);
    const ease = raw * raw * (3 - 2 * raw);
    if (rig.current) {
      rig.current.position.y = (1 - ease) * -1.4;
      rig.current.scale.setScalar(0.88 + 0.12 * ease);
    }

    // Cursor-lerp + scroll-scrub (preserved): never snap, always ease.
    const nx = (state.pointer.x || 0) * 0.22;
    const ny = (state.pointer.y || 0) * 0.12;
    cursor.current.x += (nx - cursor.current.x) * Math.min(1, delta * 3);
    cursor.current.y += (ny - cursor.current.y) * Math.min(1, delta * 3);
    if (rig.current) {
      rig.current.rotation.y = cursor.current.x + scrollT * 0.9;
      rig.current.rotation.x = cursor.current.y * 0.4;
    }

    // Pet walks (lerps) between tub and table, with a walk-bob while moving.
    if (petRef.current) {
      // tub: body bottom lands on the water line (0.65); bigger sizes sit higher
      const washY = 0.42 + (sizeScale - 1) * 0.18;
      if (wash) target.set(-1.7, washY, 0);
      else target.set(0.9, 1.07, 0); // table top is at y 1.04, paw bottoms at ~1.045
      petBase.lerp(target, Math.min(1, delta * 2));
      const moving = petBase.distanceTo(target) > 0.02;
      bob.current.amp = THREE.MathUtils.damp(bob.current.amp, moving ? 1 : 0, 4, delta);
      if (moving) bob.current.phase += delta * 10;
      petRef.current.position.copy(petBase);
      petRef.current.position.y += Math.abs(Math.sin(bob.current.phase)) * 0.035 * bob.current.amp;
      // 3D-10: species scale x size scale, damped
      petScale.current = THREE.MathUtils.damp(petScale.current, petScaleFor(pet) * sizeScale, 3, delta);
      petRef.current.scale.setScalar(petScale.current);
    }

    // Water disc: damped color/opacity instead of a hard switch.
    if (waterMat.current) {
      waterMat.current.opacity = THREE.MathUtils.damp(waterMat.current.opacity, wash ? 0.95 : 0.55, 6, delta);
      waterMat.current.color.lerp(wash ? waterWash : waterDry, 1 - Math.exp(-6 * delta));
    }

    // Scissors: always on the table; rise toward the pet for Cut.
    if (scissors.current) {
      const k = 4;
      scissors.current.rotation.z = THREE.MathUtils.damp(scissors.current.rotation.z, cut ? 0.5 : 0.15, k, delta);
      scissors.current.position.x = THREE.MathUtils.damp(scissors.current.position.x, cut ? -0.35 : -0.7, k, delta);
      scissors.current.position.y = THREE.MathUtils.damp(scissors.current.position.y, cut ? 1.45 : 1.15, k, delta);
    }

    // Dryer nozzle aims at the pet while drying (yaw toward +z, pitch up a touch).
    if (dryer.current) {
      dryer.current.rotation.y = THREE.MathUtils.damp(dryer.current.rotation.y, dry ? 0.28 : 0, 3, delta);
      dryer.current.rotation.z = THREE.MathUtils.damp(dryer.current.rotation.z, dry ? -0.1 : 0, 3, delta);
    }

    // Perfume burst fades in/out with the step.
    perfumeStrength.current = THREE.MathUtils.damp(perfumeStrength.current, perfume ? 1 : 0, 6, delta);
    if (perfumeGroup.current) {
      perfumeGroup.current.visible = perfumeStrength.current > 0.02;
      perfumeGroup.current.scale.setScalar(0.5 + 0.5 * perfumeStrength.current);
    }
    if (bottle.current) {
      bottle.current.visible = perfumeStrength.current > 0.02;
      bottle.current.scale.setScalar(0.6 + 0.4 * perfumeStrength.current);
    }

    // 3D-12: scissors snip ~2.5x/s while cutting, ease out when the step ends.
    snipAmp.current = THREE.MathUtils.damp(snipAmp.current, cut ? 1 : 0, 4, delta);
    const snip = snipAmp.current * Math.sin(state.clock.elapsedTime * Math.PI * 2 * 2.5);
    if (bladeL.current) bladeL.current.rotation.z = 0.4 + 0.25 * snip;
    if (bladeR.current) bladeR.current.rotation.z = -0.4 - 0.25 * snip;
  });

  return (
    <group ref={rig}>
      {/* floor */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[7.5, 0.1, 4.5]} />
        <meshStandardMaterial color="#efe6d6" roughness={0.95} />
      </mesh>
      {/* grooming mat under the table */}
      <mesh position={[0.9, 0.011, 0]} receiveShadow>
        <boxGeometry args={[2.7, 0.022, 1.7]} />
        <meshStandardMaterial color="#e8d9c2" roughness={1} />
      </mesh>

      {/* round bathtub: basin + water disc + feet */}
      <group position={[-1.7, 0, 0]}>
        <mesh position={[0, 0.32, 0]} castShadow>
          <cylinderGeometry args={[1.05, 0.85, 0.65, 28]} />
          <meshStandardMaterial color="#7fa893" roughness={0.35} envMapIntensity={0.7} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.95, 0.95, 0.06, 28]} />
          <meshStandardMaterial
            ref={waterMat}
            color="#cfe8ec"
            transparent
            opacity={0.55}
            roughness={0.15}
            envMapIntensity={1.2}
            depthWrite={false}
          />
        </mesh>
        {[-0.6, 0.6].map((x, i) => (
          <mesh key={i} position={[x, 0.05, 0.55]}>
            <boxGeometry args={[0.18, 0.1, 0.18]} />
            <meshStandardMaterial color="#5d7a6a" roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* shower arm: vertical + horizontal + head */}
      <group position={[-1.7, 0, -1.1]}>
        <mesh position={[0, 1.5, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.06, 3, 10]} />
          <meshStandardMaterial color="#8a8f8a" metalness={0.85} roughness={0.25} envMapIntensity={1} />
        </mesh>
        <mesh position={[0, 2.95, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 1.1, 10]} />
          <meshStandardMaterial color="#8a8f8a" metalness={0.85} roughness={0.25} envMapIntensity={1} />
        </mesh>
        <mesh position={[0, 2.9, 1.05]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.22, 0.3, 16]} />
          <meshStandardMaterial color="#8a8f8a" metalness={0.85} roughness={0.25} envMapIntensity={1} />
        </mesh>
      </group>

      {/* grooming table */}
      <group position={[0.9, 0, 0]}>
        <mesh position={[0, 0.98, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.12, 1.3]} />
          <meshStandardMaterial color="#d9b48f" roughness={0.7} envMapIntensity={0.7} />
        </mesh>
        {[-0.95, 0.95].map((x, i) => (
          <mesh key={i} position={[x, 0.48, 0.5]}>
            <cylinderGeometry args={[0.06, 0.06, 0.95, 10]} />
            <meshStandardMaterial color="#6b6f6b" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {[-0.95, 0.95].map((x, i) => (
          <mesh key={`b${i}`} position={[x, 0.48, -0.5]}>
            <cylinderGeometry args={[0.06, 0.06, 0.95, 10]} />
            <meshStandardMaterial color="#6b6f6b" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {/* dryer box + nozzle, aiming at the pet during Dry */}
        <group ref={dryer} position={[1.4, 1.25, -0.4]}>
          <mesh position={[0.15, 0, 0]} castShadow>
            <boxGeometry args={[0.55, 0.35, 0.35]} />
            <meshStandardMaterial color="#ffb59e" roughness={0.7} envMapIntensity={0.7} />
          </mesh>
          <mesh position={[-0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.12, 0.4, 12]} />
            <meshStandardMaterial color="#e88f74" roughness={0.6} envMapIntensity={0.7} />
          </mesh>
        </group>
        {/* scissors prop: resting pose, raised working pose in Cut, snips while cutting */}
        <group ref={scissors} position={[-0.7, 1.15, 0.45]} rotation={[0, 0, 0.15]}>
          <mesh ref={bladeL} rotation={[0, 0, 0.4]}>
            <boxGeometry args={[0.06, 0.6, 0.03]} />
            <meshStandardMaterial color="#9aa3a8" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh ref={bladeR} rotation={[0, 0, -0.4]}>
            <boxGeometry args={[0.06, 0.6, 0.03]} />
            <meshStandardMaterial color="#9aa3a8" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[-0.12, -0.35, 0]}>
            <sphereGeometry args={[0.09, 12, 10]} />
            <meshStandardMaterial color="#ffb59e" roughness={0.6} />
          </mesh>
          <mesh position={[0.12, -0.35, 0]}>
            <sphereGeometry args={[0.09, 12, 10]} />
            <meshStandardMaterial color="#ffb59e" roughness={0.6} />
          </mesh>
        </group>
        {/* brush prop, idly floating while on the table */}
        <Float speed={1} rotationIntensity={0.1} floatIntensity={0.2}>
          <group position={[-0.2, 1.1, -0.45]}>
            <mesh>
              <boxGeometry args={[0.4, 0.1, 0.22]} />
              <meshStandardMaterial color="#7fa893" roughness={0.7} />
            </mesh>
            <mesh position={[0.35, 0.05, 0]} rotation={[0, 0, -0.3]}>
              <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
              <meshStandardMaterial color="#8a6a4a" roughness={0.8} />
            </mesh>
          </group>
        </Float>
        {/* perfume bottle appears on the table during Perfume */}
        <group ref={bottle} position={[-0.75, 1.05, -0.4]} visible={false}>
          <mesh position={[0, 0.11, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.09, 0.22, 12]} />
            <meshStandardMaterial color="#ffb59e" roughness={0.2} envMapIntensity={1.2} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 0.08, 8]} />
            <meshStandardMaterial color="#e88f74" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.33, 0]}>
            <boxGeometry args={[0.07, 0.05, 0.05]} />
            <meshStandardMaterial color="#5d7a6a" roughness={0.5} />
          </mesh>
        </group>
      </group>

      {/* the pet itself, lerping between tub and table; fur + perfume follow */}
      <group ref={petRef} position={[0.9, 1.07, 0]}>
        <Pet pet={pet} coat={coat} paused={paused} sitting={wash} excited={!wash} />
        <Fur coat={coat} step={step} paused={paused} count={lowEnd ? 350 : 1100} />
        <group ref={perfumeGroup} position={[0.62, 1.5, 0]} visible={false}>
          <Sparkles
            count={lowEnd ? 24 : 48}
            scale={1.5}
            size={3.2}
            speed={0.5}
            opacity={0.9}
            color={perfumeOn ? "#ffb59e" : "#ffe9a8"}
          />
        </group>
      </group>

      {/* step effects — always mounted, fade via strength (3D-05) */}
      <Bubbles visible={wash} paused={paused} count={counts.bubbles} />
      <ShowerStream visible={wash} paused={paused} count={counts.drops} />
      <DryerAir visible={dry} paused={paused} count={counts.air} />
      <Clippings visible={cut} paused={paused} count={counts.clippings} />
    </group>
  );
}
