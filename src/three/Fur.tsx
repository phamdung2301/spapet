import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Coat, StepId } from "../data";

/**
 * 3D-06 — instanced fur shell. One InstancedMesh of unit cones placed on the
 * body capsule + head sphere; per-instance length/color from the coat type.
 * State machine (all damped, matrix rewrite only while moving):
 *   wash -> 0.5 (wet, flattened)   dry -> 1.0 (fluffed)
 *   cut/perfume -> 0.7 (trimmed)   + wet darkening/gloss during wash
 */

export interface FurProps {
  coat: Coat;
  step: StepId;
  paused: boolean;
  count: number;
}

/** Coat length = per-instance cone scale.y (unit cone sticks out len/2). */
function coatLength(coat: Coat, i: number): number {
  const j = (i * 37) % 7;
  if (coat === "short") return 0.1 + (j % 3) * 0.008;
  if (coat === "long") return 0.3 + (j % 5) * 0.055;
  return 0.18 + (j % 4) * 0.035; // curly
}

function coatColor(coat: Coat): string {
  return coat === "long" ? "#f6d9b8" : coat === "curly" ? "#e8c9a8" : "#fdf3e3";
}

/** Body capsule match: <group position=[0,0.55,0] scale=[1.1,0.95,0.9]><mesh rotation=[0,0,PI/2]><capsule r=0.42 mid=0.5> */
const BODY_CENTER = new THREE.Vector3(0, 0.55, 0);
const HEAD_CENTER = new THREE.Vector3(0.62, 1.05, 0);
const HEAD_R = 0.36;
const UP = new THREE.Vector3(0, 1, 0);

/** map capsule-local dir -> pet-space dir (rot z 90deg then group scale) */
function localToPet(v: THREE.Vector3): THREE.Vector3 {
  // Rz(PI/2): (x,y,z) -> (-y, x, z); then scale (1.1, 0.95, 0.9)
  return new THREE.Vector3(-v.y * 1.1, v.x * 0.95, v.z * 0.9);
}

export default function Fur({ coat, step, paused, count }: FurProps) {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(
      new THREE.ConeGeometry(0.016, 1, 5),
      new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0 }),
      count,
    );
    m.frustumCulled = false;
    m.visible = false; // fades in via strength
    return m;
  }, [count]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      mesh.dispose();
    },
    [mesh],
  );

  // per-instance static data
  const strands = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const quat = new Float32Array(count * 4);
    const len = new Float32Array(count);
    const q = new THREE.Quaternion();
    const n = new THREE.Vector3();
    const p = new THREE.Vector3();
    const tiltQ = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const bodyCount = Math.floor(count * 0.7);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      // fibonacci sphere direction
      const k = i + 0.5;
      const phi = Math.acos(1 - (2 * k) / count);
      const theta = golden * k;
      const dir = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      );
      if (i < bodyCount) {
        // capsule surface: sphere point pushed along local Y axis by half mid
        p.copy(dir).multiplyScalar(0.42);
        p.y += dir.y > 0 ? 0.25 : -0.25;
        const w = localToPet(p).add(BODY_CENTER);
        n.copy(localToPet(dir)).normalize();
        pos[i * 3] = w.x;
        pos[i * 3 + 1] = w.y;
        pos[i * 3 + 2] = w.z;
      } else {
        // head sphere
        p.copy(dir).multiplyScalar(HEAD_R).add(HEAD_CENTER);
        pos[i * 3] = p.x;
        pos[i * 3 + 1] = p.y;
        pos[i * 3 + 2] = p.z;
        n.copy(dir);
      }
      q.setFromUnitVectors(UP, n);
      // random tilt: stronger for curly coats
      const tilt = coat === "curly" ? 0.35 : 0.15;
      euler.set(((i * 13) % 10) / 10 * tilt - tilt / 2, ((i * 7) % 10) / 10 * tilt - tilt / 2, ((i * 29) % 10) / 10 * tilt - tilt / 2);
      tiltQ.setFromEuler(euler);
      q.multiply(tiltQ);
      quat[i * 4] = q.x;
      quat[i * 4 + 1] = q.y;
      quat[i * 4 + 2] = q.z;
      quat[i * 4 + 3] = q.w;
      len[i] = coatLength(coat, i);
    }
    return { pos, quat, len };
  }, [count, coat]);

  // per-instance colors: coat base with a darker random tint
  useEffect(() => {
    const base = new THREE.Color(coatColor(coat));
    const dark = base.clone().multiplyScalar(0.72);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.copy(base).lerp(dark, ((i * 17) % 10) / 10 * 0.35);
      mesh.setColorAt(i, c);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [mesh, coat, count]);

  const furScale = useRef(step === "wash" ? 0.5 : 1);
  const written = useRef(-1);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const scaleVec = useMemo(() => new THREE.Vector3(), []);

  const targetFor = (s: StepId): number => (s === "wash" ? 0.5 : s === "dry" ? 1 : 0.7);

  const writeMatrices = () => {
    const { pos, quat, len } = strands;
    for (let i = 0; i < count; i++) {
      dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
      dummy.quaternion.set(quat[i * 4], quat[i * 4 + 1], quat[i * 4 + 2], quat[i * 4 + 3]);
      scaleVec.set(1, Math.max(0.001, len[i] * furScale.current), 1);
      dummy.scale.copy(scaleVec);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    written.current = furScale.current;
  };

  // initial + coat-change write (covers the paused-at-mount case)
  useEffect(() => {
    writeMatrices();
    mesh.visible = true; // never leave the pet bald on a paused first frame
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strands]);

  useFrame((_, delta) => {
    if (paused) return;
    const target = targetFor(step);
    furScale.current = THREE.MathUtils.damp(furScale.current, target, 2.5, delta);

    const mat = mesh.material as THREE.MeshStandardMaterial;
    const wet = step === "wash";
    mat.roughness = THREE.MathUtils.damp(mat.roughness, wet ? 0.35 : 0.9, 4, delta);
    mat.color.lerp(wet ? WET_TINT : WHITE, 1 - Math.exp(-4 * delta));

    if (Math.abs(furScale.current - written.current) > 0.0005) writeMatrices();
  });

  return <primitive object={mesh} />;
}

const WET_TINT = new THREE.Color(0.78, 0.8, 0.82);
const WHITE = new THREE.Color(1, 1, 1);
