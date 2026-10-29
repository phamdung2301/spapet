import { useMemo } from "react";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";

/**
 * 3D-07 — room dressing so the station stops floating in cream whitespace:
 * backdrop wall + wainscot, two arched wall panels, scene fog that blends the
 * canvas edge into the page, and (tier-gated) soft contact shadows on the
 * floor. Mounted OUTSIDE the rig so the station rotates against a stable room.
 */

/** Rounded-top arch panel as a flat Shape (procedural, no assets). */
function archShape(w: number, h: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2;
  s.moveTo(-hw, 0);
  s.lineTo(-hw, h - hw);
  s.absarc(0, h - hw, hw, Math.PI, 0, false);
  s.lineTo(hw, 0);
  s.lineTo(-hw, 0);
  return s;
}

interface RoomProps {
  /** soft contact-shadow blob — tier-gated (3D-11) */
  showContact: boolean;
}

export default function Room({ showContact }: RoomProps) {
  const archTub = useMemo(() => archShape(2.6, 3.4), []);
  const archTable = useMemo(() => archShape(2.1, 2.6), []);

  return (
    <>
      {/* fog kisses the backdrop and blends the canvas edge into the page */}
      <fog attach="fog" args={["#f2e9d8", 9.5, 16]} />

      {/* backdrop wall (far enough that the rig's sweeping floor never clips it) */}
      <mesh position={[0, 2.4, -4.8]}>
        <boxGeometry args={[14, 8, 0.2]} />
        <meshStandardMaterial color="#f7eedd" roughness={1} />
      </mesh>
      {/* wainscot strip */}
      <mesh position={[0, 0.6, -4.78]}>
        <boxGeometry args={[14, 1.2, 0.24]} />
        <meshStandardMaterial color="#e2ecdf" roughness={1} />
      </mesh>
      {/* arched wall panels: sage behind the tub, peach behind the table */}
      <mesh position={[-1.7, 0.02, -4.7]}>
        <shapeGeometry args={[archTub]} />
        <meshStandardMaterial color="#dcebe2" roughness={1} />
      </mesh>
      <mesh position={[0.9, 0.02, -4.7]}>
        <shapeGeometry args={[archTable]} />
        <meshStandardMaterial color="#f6dfd2" roughness={1} />
      </mesh>

      {/* soft contact grounding under the whole station */}
      {showContact && (
        <ContactShadows
          position={[0, 0.012, 0]}
          scale={9}
          blur={2.5}
          far={2.2}
          opacity={0.35}
          resolution={256}
          frames={Infinity}
          color="#8a7a63"
        />
      )}
    </>
  );
}
