import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Coat, PetType } from "../data";

/**
 * 3D-03 — the pet rebuilt from readable primitives (capsule body, head group
 * with muzzle/ears/tail pivots, paw'd legs) instead of bare spheres+boxes.
 * 3D-04 — idle life: breathing, tail wag, blinking, head sway, ear-flop
 * impulse on step changes. All transform-only, guarded by `paused`.
 *
 * Pose map: `sitting` (wash step) pitches the chest up and folds the legs so
 * the pet reads as sitting in the tub; standing everywhere else.
 */

export interface PetProps {
  pet: PetType;
  coat: Coat;
  paused: boolean;
  /** wash step — sit in the tub */
  sitting: boolean;
  /** non-wash steps — happier, faster tail wag */
  excited: boolean;
}

export function bodyColorFor(pet: PetType): string {
  return pet === "cat" ? "#d9c8b4" : "#f2e2c8";
}

export function petScaleFor(pet: PetType): number {
  return pet === "cat" ? 0.82 : 1;
}

export default function Pet({ pet, coat, paused, sitting, excited }: PetProps) {
  const isDog = pet === "dog";
  const bodyColor = bodyColorFor(pet);

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  const bodyMat = useRef<THREE.MeshStandardMaterial>(null);
  const head = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Group>(null);
  const earR = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Group>(null);
  const eyeR = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Group>(null);
  const legs = useRef<THREE.Group>(null);

  // damped pose state
  const sitT = useRef(0);
  const excitement = useRef(0.2);
  const flop = useRef(0);
  const blink = useRef({ next: 2.2, t: -1 });

  // wet-look targets for the body material
  const wetColor = useMemo(() => new THREE.Color(bodyColor).multiplyScalar(0.78), [bodyColor]);
  const baseColor = useMemo(() => new THREE.Color(bodyColor), [bodyColor]);

  // ear-flop impulse whenever the pose changes (step change proxy)
  useEffect(() => {
    flop.current = 1;
  }, [sitting]);

  useFrame((state, delta) => {
    if (paused || !root.current) return;
    const t = state.clock.elapsedTime;

    // --- pose: sit in the tub / stand on the table -----------------------
    sitT.current = THREE.MathUtils.damp(sitT.current, sitting ? 1 : 0, 3, delta);
    root.current.rotation.z = 0.3 * sitT.current;
    root.current.position.y = 0.08 * sitT.current;
    if (legs.current) legs.current.scale.y = 1 - 0.75 * sitT.current;

    // --- breathing (period ~3.3s) ----------------------------------------
    if (body.current) {
      const s = Math.sin(t * 1.9);
      body.current.scale.set(1 + 0.012 * s, 1, 1 + 0.02 * s);
    }

    // --- head sway --------------------------------------------------------
    if (head.current) {
      head.current.rotation.z = 0.06 * Math.sin(t * 0.7);
      head.current.rotation.y = 0.08 * Math.sin(t * 0.45);
    }

    // --- blink every 2.8-4.6s, 0.22s long ---------------------------------
    const b = blink.current;
    let eyeScale = 1;
    if (b.t >= 0) {
      b.t += delta;
      const k = b.t / 0.22;
      if (k >= 1) b.t = -1;
      else eyeScale = 1 - 0.9 * Math.sin(Math.PI * k);
    } else {
      b.next -= delta;
      if (b.next <= 0) {
        b.t = 0;
        b.next = 2.8 + Math.random() * 1.8;
      }
    }
    if (eyeL.current) eyeL.current.scale.y = eyeScale;
    if (eyeR.current) eyeR.current.scale.y = eyeScale;

    // --- ear flop impulse (decaying oscillation) ---------------------------
    flop.current *= Math.exp(-delta * 3.5);
    const wobble = flop.current * Math.sin(flop.current * 12) * 0.25;
    if (earL.current) earL.current.rotation.z = (isDog ? 0.25 : -0.25) + wobble;
    if (earR.current) earR.current.rotation.z = (isDog ? -0.25 : 0.25) - wobble;

    // --- tail: fast wag when excited, slow sway when relaxed --------------
    excitement.current = THREE.MathUtils.damp(excitement.current, excited ? 1 : 0.2, 2.5, delta);
    if (tail.current) {
      if (isDog) {
        tail.current.rotation.y = Math.sin(t * (2 + 7 * excitement.current)) * (0.06 + 0.5 * excitement.current);
      } else {
        tail.current.rotation.y = Math.sin(t * 1.3) * 0.09;
        tail.current.rotation.z = Math.sin(t * 0.9) * 0.05;
      }
    }

    // --- wet body during wash: darker + glossier, damped -------------------
    if (bodyMat.current) {
      const target = sitting ? wetColor : baseColor;
      bodyMat.current.color.lerp(target, 1 - Math.exp(-4 * delta));
      bodyMat.current.roughness = THREE.MathUtils.damp(bodyMat.current.roughness, sitting ? 0.4 : 0.9, 4, delta);
    }
  });

  return (
    <group ref={root}>
      {/* body: capsule lying along +x (head end), breathing scale in frame */}
      <group position={[0, 0.55, 0]} scale={[1.1, 0.95, 0.9]}>
        <mesh ref={body} rotation={[0, 0, Math.PI / 2]} castShadow>
          <capsuleGeometry args={[0.42, 0.5, 8, 24]} />
          <meshStandardMaterial ref={bodyMat} color={bodyColor} roughness={0.9} />
        </mesh>
      </group>

      {/* chest patch for a bit of two-tone reading */}
      <mesh position={[0.42, 0.5, 0]} scale={[1, 0.8, 0.8]} castShadow>
        <sphereGeometry args={[0.2, 16, 12]} />
        <meshStandardMaterial color="#fdf6ea" roughness={0.95} />
      </mesh>

      {/* head group — sway + ear/eye pivots live inside */}
      <group ref={head} position={[0.62, 1.05, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.36, 24, 20]} />
          <meshStandardMaterial color={bodyColor} roughness={0.9} />
        </mesh>
        {/* muzzle */}
        <RoundedBox args={[0.22, 0.16, 0.18]} radius={0.06} smoothness={4} position={[0.3, -0.06, 0]}>
          <meshStandardMaterial color="#f5e3cb" roughness={0.95} />
        </RoundedBox>
        {/* nose */}
        <mesh position={[0.42, -0.01, 0]}>
          <sphereGeometry args={[0.045, 12, 10]} />
          <meshStandardMaterial color="#2b2620" roughness={0.4} />
        </mesh>
        {/* mouth arc */}
        <mesh position={[0.41, -0.09, 0]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.05, 0.008, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#5c4a3a" roughness={0.8} />
        </mesh>
        {/* eyes: group pivot = blink scaleY; glint sells the life */}
        {([1, -1] as const).map((side) => (
          <group
            key={side}
            ref={side === 1 ? eyeL : eyeR}
            position={[0.22, 0.1, 0.19 * side]}
          >
            <mesh>
              <sphereGeometry args={[0.055, 12, 10]} />
              <meshStandardMaterial color="#2b2620" roughness={0.25} />
            </mesh>
            <mesh position={[0.02, 0.02, 0.015 * side]}>
              <sphereGeometry args={[0.016, 8, 8]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
          </group>
        ))}
        {/* ears */}
        {isDog ? (
          [1, -1].map((side) => (
            <group
              key={side}
              ref={side === 1 ? earL : earR}
              position={[0.02, 0.3, 0.17 * side]}
            >
              <mesh position={[-0.02, -0.13, 0]} rotation={[0.1, 0, 0]} scale={[1, 1, 0.55]} castShadow>
                <capsuleGeometry args={[0.07, 0.16, 6, 12]} />
                <meshStandardMaterial color="#c9a98f" roughness={1} />
              </mesh>
            </group>
          ))
        ) : (
          [1, -1].map((side) => (
            <group
              key={side}
              ref={side === 1 ? earL : earR}
              position={[0.0, 0.32, 0.15 * side]}
            >
              <mesh rotation={[0, 0, -0.25 * side]} castShadow>
                <coneGeometry args={[0.13, 0.24, 4]} />
                <meshStandardMaterial color={bodyColor} roughness={1} />
              </mesh>
              <mesh position={[0.01, -0.02, 0.03]} rotation={[0, 0, -0.25 * side]}>
                <coneGeometry args={[0.07, 0.13, 4]} />
                <meshStandardMaterial color="#e8b4a0" roughness={1} />
              </mesh>
            </group>
          ))
        )}
      </group>

      {/* legs + paws (folded when sitting) */}
      <group ref={legs}>
        {([0.3, -0.3] as const).map((x) =>
          ([0.28, -0.28] as const).map((z) => (
            <group key={`${x}:${z}`}>
              <mesh position={[x, 0.18, z]} castShadow>
                <cylinderGeometry args={[0.09, 0.09, 0.36, 10]} />
                <meshStandardMaterial color={bodyColor} roughness={0.9} />
              </mesh>
              <mesh position={[x + 0.02, 0.08, z]} castShadow>
                <sphereGeometry args={[0.105, 12, 10]} />
                <meshStandardMaterial color={bodyColor} roughness={0.95} />
              </mesh>
            </group>
          )),
        )}
      </group>

      {/* tail: pivot at the base so it wags from the root */}
      <group ref={tail} position={[-0.6, 0.7, 0]}>
        {isDog ? (
          <>
            <mesh position={[-0.195, 0.155, 0]} rotation={[0, 0, 0.9]} castShadow>
              <cylinderGeometry args={[0.07, 0.05, 0.5, 10]} />
              <meshStandardMaterial color={bodyColor} roughness={0.9} />
            </mesh>
            <mesh position={[-0.39, 0.31, 0]}>
              <sphereGeometry args={[0.072, 12, 10]} />
              <meshStandardMaterial color={coat === "long" ? "#f6d9b8" : bodyColor} roughness={1} />
            </mesh>
          </>
        ) : (
          <>
            <mesh position={[-0.2, 0.08, 0]} rotation={[0, 0, 0.2]} castShadow>
              <cylinderGeometry args={[0.06, 0.045, 0.45, 10]} />
              <meshStandardMaterial color={bodyColor} roughness={0.9} />
            </mesh>
            <mesh position={[-0.31, 0.19, 0]}>
              <sphereGeometry args={[0.062, 12, 10]} />
              <meshStandardMaterial color={bodyColor} roughness={1} />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}
