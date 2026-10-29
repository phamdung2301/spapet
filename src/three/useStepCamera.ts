import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { StepId } from "../data";

/**
 * 3D-09 — per-step camera choreography. MICRO-offsets only: the rig can
 * rotate up to ~1.1 rad (cursor 0.22 + scrollT*0.9), so large dolly-ins would
 * swing the subject out of frame. The camera damps between per-step framings;
 * rig cursor-lerp + scrollT scrub stay untouched (behavior contract).
 */

const BASE_POS = new THREE.Vector3(0, 2.3, 6.2);
const BASE_TARGET = new THREE.Vector3(0, 1.0, 0);

interface StepCamera {
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
}

const OFFSETS: Record<StepId, StepCamera> = {
  wash: { pos: [-0.7, -0.15, -0.35], target: [-0.55, -0.1, 0], fov: 42 },
  dry: { pos: [0.55, -0.05, -0.3], target: [0.45, 0.15, 0], fov: 42 },
  cut: { pos: [0.7, -0.2, -0.85], target: [0.55, 0.25, 0], fov: 38 },
  perfume: { pos: [0, 0.1, 0.2], target: [0.2, 0.1, 0], fov: 42 },
};

export function useStepCamera(step: StepId, paused: boolean): void {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const pos = useRef(BASE_POS.clone());
  const look = useRef(BASE_TARGET.clone());
  const fov = useRef(42);

  useFrame((_, delta) => {
    if (paused) return;
    const off = OFFSETS[step] ?? OFFSETS.wash;
    const p = pos.current;
    p.set(
      THREE.MathUtils.damp(p.x, BASE_POS.x + off.pos[0], 2.5, delta),
      THREE.MathUtils.damp(p.y, BASE_POS.y + off.pos[1], 2.5, delta),
      THREE.MathUtils.damp(p.z, BASE_POS.z + off.pos[2], 2.5, delta),
    );
    camera.position.copy(p);
    const l = look.current;
    l.set(
      THREE.MathUtils.damp(l.x, BASE_TARGET.x + off.target[0], 2.8, delta),
      THREE.MathUtils.damp(l.y, BASE_TARGET.y + off.target[1], 2.8, delta),
      THREE.MathUtils.damp(l.z, BASE_TARGET.z + off.target[2], 2.8, delta),
    );
    camera.lookAt(l);
    if (Math.abs(fov.current - off.fov) > 0.01) {
      fov.current = THREE.MathUtils.damp(fov.current, off.fov, 2.5, delta);
      camera.fov = fov.current;
      camera.updateProjectionMatrix();
    }
  });
}
