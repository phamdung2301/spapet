import { AdaptiveDpr, PerformanceMonitor } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, ToneMapping, Vignette } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

/**
 * 3D-02 — post chain: N8AO contact occlusion, mipmapBlur bloom (only emissive
 * sparkles + water glints cross the 0.72 threshold), vignette, and tone
 * mapping as the final effect. The composer force-disables the renderer's own
 * tone mapping while mounted (verified in @react-three/postprocessing 3.2.2),
 * so the ToneMapping effect is ALWAYS in the chain — even at tier 0.
 * 3D-11 — PerformanceMonitor + AdaptiveDpr feed the tier scaler; the dpr cap
 * [1, 1.75] on the Canvas is untouched (AdaptiveDpr only lowers dpr).
 */

export interface StageEffectsProps {
  lowEnd: boolean;
  /** 2 = full fx, 1 = bloom+vignette only, 0 = composer passthrough */
  tier: number;
  onDecline: () => void;
  onIncline: () => void;
}

export default function StageEffects({ lowEnd, tier, onDecline, onIncline }: StageEffectsProps) {
  const fx = tier >= 1;
  return (
    <>
      <PerformanceMonitor onDecline={onDecline} onIncline={onIncline} />
      <AdaptiveDpr pixelated={false} />
      <EffectComposer multisampling={lowEnd ? 0 : 4} enableNormalPass={false}>
        {!lowEnd && fx ? (
          <N8AO halfRes aoRadius={0.6} distanceFalloff={0.6} intensity={2.2} quality="medium" />
        ) : null}
        {fx ? (
          <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.72} luminanceSmoothing={0.25} radius={0.7} />
        ) : null}
        <Vignette offset={0.22} darkness={0.5} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </>
  );
}
