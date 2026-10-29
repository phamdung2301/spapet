import { Suspense, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Canvas } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import type { Coat, PetType, StepId } from "./data";
import Lighting from "./three/Lighting";
import Room from "./three/Room";
import StageEffects from "./three/StageEffects";
import Station from "./three/Station";
import { useStepCamera } from "./three/useStepCamera";

export interface StageProps {
  step: StepId;
  pet: PetType;
  coat: Coat;
  perfumeOn: boolean;
  paused: boolean;
  /** 0..1 scroll progress through the stage+process zone: scrubs the rig rotation. */
  scrollT?: number;
  /** S/M/L/XL from the configurator — scales the pet visually (3D-10). */
  size?: string;
}

/** Visual scale per size: the pricing multipliers (up to 1.7) would burst the tub. */
const SIZE_SCALE: Record<string, number> = { S: 0.85, M: 1, L: 1.14, XL: 1.28 };

/** Coarse-pointer devices with few cores: reduced shadows, no AO, smaller counts. */
function detectLowEnd(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const coarse = window.matchMedia ? window.matchMedia("(pointer: coarse)").matches : false;
  const cores = navigator.hardwareConcurrency ?? 8;
  return coarse && cores <= 4;
}

interface SceneProps extends StageProps {
  lowEnd: boolean;
  tier: number;
  setTier: Dispatch<SetStateAction<number>>;
}

function Scene({ lowEnd, tier, setTier, ...props }: SceneProps) {
  // 3D-09: per-step damped camera framing (micro-offsets; rig stays scroll-driven)
  useStepCamera(props.step, props.paused);
  return (
    <>
      <Room showContact={!lowEnd && tier >= 1} />
      <Lighting lowEnd={lowEnd} />
      <Station
        step={props.step}
        pet={props.pet}
        coat={props.coat}
        perfumeOn={props.perfumeOn}
        paused={props.paused}
        scrollT={props.scrollT ?? 0}
        sizeScale={SIZE_SCALE[props.size ?? "M"] ?? 1}
        lowEnd={lowEnd}
      />
      {/* ambient dust motes, always on, catch the bloom */}
      <Sparkles
        count={lowEnd ? 40 : 70}
        scale={[7, 3.4, 4]}
        size={2.5}
        speed={0.25}
        opacity={0.35}
        color="#fff2d9"
        position={[0, 1.7, 0]}
      />
      <StageEffects
        lowEnd={lowEnd}
        tier={tier}
        onDecline={() => setTier((t) => Math.max(0, t - 1))}
        onIncline={() => setTier((t) => Math.min(2, t + 1))}
      />
    </>
  );
}

export default function Stage3D(props: StageProps) {
  const [lowEnd] = useState(detectLowEnd);
  const [tier, setTier] = useState(2);

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 2.3, 6.2], fov: 42 }}
      frameloop={props.paused ? "never" : "always"}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <Scene {...props} lowEnd={lowEnd} tier={tier} setTier={setTier} />
      </Suspense>
    </Canvas>
  );
}
