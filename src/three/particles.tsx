import { useLayoutEffect, useMemo, useRef } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * 3D-08 — instanced particle systems. Replaces the old per-particle meshes
 * (16 transmission materials + ~40 draw calls) with 4 instanced draws and no
 * transmission render target. All systems share the same contract:
 * - always mounted, fade via a damped `strength` ref (3D-05),
 * - `paused` early-return in every useFrame (hard rule),
 * - deterministic seeds so the stage is stable between renders.
 */

/** Deterministic hash-based pseudo random, stable across reloads. */
function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Damped 0..1 visibility strength shared by every effect (3D-05). */
function useStrength(visible: boolean, paused: boolean): RefObject<number> {
  const strength = useRef(visible ? 1 : 0);
  useFrame((_, delta) => {
    if (paused) return;
    strength.current = THREE.MathUtils.damp(strength.current, visible ? 1 : 0, 6, delta);
  });
  return strength;
}

interface ParticleSystemProps {
  visible: boolean;
  paused: boolean;
  count: number;
}

function useInstancedMesh(
  makeGeometry: () => THREE.BufferGeometry,
  makeMaterial: () => THREE.Material,
  count: number,
): THREE.InstancedMesh {
  // factories run inside the memo so re-renders (e.g. scrollT changes) never
  // allocate throwaway geometry/material objects
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(makeGeometry(), makeMaterial(), count);
    m.frustumCulled = false; // instances spread wide of the mesh origin
    m.visible = false;
    // zero-scale every instance so nothing flashes before the first frame
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < count; i++) m.setMatrixAt(i, zero);
    m.instanceMatrix.needsUpdate = true;
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);
  useLayoutEffect(() => {
    return () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      mesh.dispose();
    };
  }, [mesh]);
  return mesh;
}

/* ------------------------------------------------------------------ */
/* Bubbles — rising in the tub, glassy via env map (no transmission)   */
/* ------------------------------------------------------------------ */

interface BubbleSeed {
  x: number;
  z: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
}

export function Bubbles({ visible, paused, count }: ParticleSystemProps) {
  const strength = useStrength(visible, paused);
  const mesh = useInstancedMesh(
    () => new THREE.SphereGeometry(1, 12, 10),
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#cfe8ec",
        transparent: true,
        opacity: 0.42,
        roughness: 0.05,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        envMapIntensity: 1.4,
        depthWrite: false,
      }),
    count,
  );
  const seeds = useMemo<BubbleSeed[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: -2.35 + hash(i * 3.1) * 2.1,
        z: -0.55 + hash(i * 7.7) * 1.2,
        y: 0.55 + hash(i * 5.3) * 2.4,
        r: 0.05 + hash(i * 11.9) * 0.1,
        speed: 0.25 + hash(i * 13.3) * 0.45,
        phase: hash(i * 17.1) * Math.PI * 2,
      })),
    [count],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, delta) => {
    if (paused) return;
    const s = strength.current;
    mesh.visible = s > 0.02;
    if (!mesh.visible) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const b = seeds[i];
      b.y += delta * b.speed;
      if (b.y > 3.05) b.y = 0.55;
      // pop: shrink over the last 0.25 units
      const pop = b.y > 2.8 ? Math.max(0, (3.05 - b.y) / 0.25) : 1;
      dummy.position.set(b.x + Math.sin(t * 2 + b.phase) * 0.04, b.y, b.z);
      dummy.scale.setScalar(b.r * (0.25 + 0.75 * s) * pop);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <primitive object={mesh} />;
}

/* ------------------------------------------------------------------ */
/* Shower — a cone "sheet" of water + instanced droplets falling in it */
/* ------------------------------------------------------------------ */

interface DropSeed {
  angle: number;
  radial: number;
  y: number;
  speed: number;
  phase: number;
}

export function ShowerStream({ visible, paused, count }: ParticleSystemProps) {
  const strength = useStrength(visible, paused);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo<DropSeed[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: hash(i * 3.7) * Math.PI * 2,
        radial: Math.sqrt(hash(i * 9.1)),
        y: 0.7 + hash(i * 5.9) * 2.05,
        speed: 1.6 + hash(i * 13.7) * 0.8,
        phase: hash(i * 17.3) * Math.PI * 2,
      })),
    [count],
  );

  const sheetRef = useRef<THREE.Mesh>(null);
  const sheetMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#9fd4e0",
        transparent: true,
        opacity: 0.28,
        roughness: 0.2,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  useLayoutEffect(() => () => sheetMat.dispose(), [sheetMat]);

  const drops = useInstancedMesh(
    () => new THREE.SphereGeometry(1, 8, 6),
    () =>
      new THREE.MeshStandardMaterial({
        color: "#9fd4e0",
        transparent: true,
        opacity: 0.85,
        roughness: 0.15,
        depthWrite: false,
      }),
    count,
  );

  useFrame((state, delta) => {
    if (paused) return;
    const s = strength.current;
    const on = s > 0.02;
    if (sheetRef.current) {
      sheetRef.current.visible = on;
      sheetMat.opacity = 0.28 * s;
    }
    drops.visible = on;
    if (!on) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const d = seeds[i];
      d.y -= delta * d.speed;
      if (d.y < 0.7) d.y = 2.75;
      // cone radius grows toward the bottom: 0.03 top -> 0.08 bottom
      const k = (2.75 - d.y) / 2.05;
      const r = (0.03 + (0.08 - 0.03) * k) * d.radial;
      dummy.position.set(-1.7 + Math.cos(d.angle + t * 0.4) * r, d.y, -0.05 + Math.sin(d.angle + t * 0.4) * r);
      dummy.scale.set(0.035 * s, 0.09 * s, 0.035 * s);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      drops.setMatrixAt(i, dummy.matrix);
    }
    drops.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* water sheet: open cone under the shower head, world (-1.7, ~1.7, -0.05) */}
      <mesh ref={sheetRef} position={[-1.7, 1.725, -0.05]} visible={false}>
        <cylinderGeometry args={[0.03, 0.08, 2.05, 10, 1, true]} />
        <primitive object={sheetMat} attach="material" />
      </mesh>
      <primitive object={drops} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Dryer air — warm stretched puffs streaming from the nozzle          */
/* ------------------------------------------------------------------ */

interface AirSeed {
  y: number;
  z: number;
  x: number;
  speed: number;
  phase: number;
}

export function DryerAir({ visible, paused, count }: ParticleSystemProps) {
  const strength = useStrength(visible, paused);
  const mesh = useInstancedMesh(
    () => new THREE.SphereGeometry(1, 8, 6),
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffe3c2",
        transparent: true,
        opacity: 0.6,
        roughness: 0.6,
        depthWrite: false,
      }),
    count,
  );
  const seeds = useMemo<AirSeed[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: 0.3 + hash(i * 3.3) * 2.1,
        y: 1.3 + hash(i * 7.9) * 0.3,
        z: -0.55 + hash(i * 11.3) * 0.5,
        speed: 1.2 + hash(i * 15.7) * 1.0,
        phase: hash(i * 19.1) * Math.PI * 2,
      })),
    [count],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, delta) => {
    if (paused) return;
    const s = strength.current;
    mesh.visible = s > 0.02;
    if (!mesh.visible) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const a = seeds[i];
      a.x -= delta * a.speed;
      if (a.x < 0.2) a.x = 2.4;
      dummy.position.set(a.x, a.y + Math.sin(t * 3 + a.phase) * 0.04, a.z);
      dummy.scale.set(0.1 * (0.4 + 0.6 * s), 0.035 * s, 0.035 * s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <primitive object={mesh} />;
}

/* ------------------------------------------------------------------ */
/* Clippings — tumbling fur planes falling around the table            */
/* ------------------------------------------------------------------ */

interface ClippingSeed {
  x: number;
  z: number;
  y: number;
  spin: number;
  phase: number;
}

export function Clippings({ visible, paused, count }: ParticleSystemProps) {
  const strength = useStrength(visible, paused);
  const mesh = useInstancedMesh(
    () => new THREE.PlaneGeometry(0.08, 0.03),
    () =>
      new THREE.MeshStandardMaterial({
        color: "#e8c9a8",
        roughness: 1,
        side: THREE.DoubleSide,
      }),
    count,
  );
  const seeds = useMemo<ClippingSeed[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: 0.45 + hash(i * 3.9) * 0.7,
        z: -0.35 + hash(i * 8.3) * 0.7,
        y: 1.15 + hash(i * 5.1) * 1.05,
        spin: 1.5 + hash(i * 12.1) * 2.5,
        phase: hash(i * 16.9) * Math.PI * 2,
      })),
    [count],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame((state, delta) => {
    if (paused) return;
    const s = strength.current;
    mesh.visible = s > 0.02;
    if (!mesh.visible) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < seeds.length; i++) {
      const c = seeds[i];
      c.y -= delta * 0.5;
      if (c.y < 1.1) c.y = 2.2;
      dummy.position.set(c.x + Math.sin(t + c.phase) * 0.03, c.y, c.z);
      dummy.rotation.set(t * c.spin * 0.6, c.phase, t * c.spin);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
  return <primitive object={mesh} />;
}
