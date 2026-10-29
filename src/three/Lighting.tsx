import { useEffect, useRef } from "react";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";

/**
 * 3D-01 — three-point lighting rig + real shadow maps + local IBL.
 * The Environment uses Lightformer children (baked once via frames={1}) so
 * there is NO network fetch — presets would pull an HDR from a CDN.
 */

interface LightingProps {
  lowEnd: boolean;
}

export default function Lighting({ lowEnd }: LightingProps) {
  const key = useRef<THREE.DirectionalLight>(null);

  // r3f sets shadow-camera-* props on mount, but the ortho shadow camera's
  // projection matrix must be refreshed once the bounds are applied.
  useEffect(() => {
    const cam = key.current?.shadow?.camera;
    if (cam) cam.updateProjectionMatrix();
  }, []);

  const mapSize = lowEnd ? 512 : 1024;

  return (
    <>
      {/* fill: sky/ground tint instead of flat ambient */}
      <hemisphereLight args={["#fff8f0", "#cfd8cc", 0.55]} />

      {/* key: warm sun with tight ortho bounds for crisp shadows */}
      <directionalLight
        ref={key}
        position={[3.5, 6, 2.5]}
        intensity={2.4}
        color="#fff2e0"
        castShadow
        shadow-mapSize={[mapSize, mapSize]}
        shadow-camera-left={-4.5}
        shadow-camera-right={4.5}
        shadow-camera-top={4}
        shadow-camera-bottom={-2}
        shadow-camera-near={1}
        shadow-camera-far={16}
        shadow-bias={-0.00035}
        shadow-normalBias={0.02}
      />

      {/* rim: warm bounce from the left (kept from the original rig) */}
      <pointLight position={[-3, 3, 2]} intensity={12} color="#ffd9c2" />

      {/* local IBL: soft studio lightformers, baked once, zero fetch */}
      <Environment resolution={256} frames={1} environmentIntensity={0.55}>
        <Lightformer
          form="rect"
          intensity={2.2}
          position={[0, 5, -2]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[6, 3, 1]}
          color="#fff4e4"
        />
        <Lightformer
          form="rect"
          intensity={1.1}
          position={[-4, 2, 2]}
          rotation={[0, Math.PI / 4, 0]}
          scale={[3, 2, 1]}
          color="#ffe1cf"
        />
        <Lightformer
          form="rect"
          intensity={0.8}
          position={[4, 2, 2]}
          rotation={[0, -Math.PI / 4, 0]}
          scale={[3, 2, 1]}
          color="#dcebe2"
        />
        <Lightformer form="ring" intensity={1.6} position={[-2, 3, 4]} scale={1.5} color="#fff8f0" />
      </Environment>
    </>
  );
}
