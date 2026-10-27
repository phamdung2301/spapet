import { useState } from "react";
import type { RefObject } from "react";
import Stage3D from "../Stage3D";
import { ADDONS, STEPS, formatK } from "../data";
import type { AddonId, Coat, PetType, StepId } from "../data";
import { RollLabel } from "./common";
import "./StageSection.css";

interface Calc {
  priceK: number;
  minutes: number;
  code: string;
}

interface Props {
  step: StepId;
  setStep: (s: StepId) => void;
  onManual: () => void;
  pet: PetType;
  coat: Coat;
  addons: AddonId[];
  size: string;
  calc: Calc;
  stageRef: RefObject<HTMLDivElement | null>;
  stageVisible: boolean;
  reducedMotion: boolean;
  effectivePaused: boolean;
  scrollT: number;
  stuck: boolean;
}

export default function StageSection(props: Props) {
  const {
    step, setStep, onManual, pet, coat, addons, size, calc,
    stageRef, reducedMotion, effectivePaused, scrollT, stuck,
  } = props;
  const currentStep = STEPS.find((s) => s.id === step) ?? STEPS[0];
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(calc.code);
    } catch {
      /* clipboard unavailable in some contexts; still show the code */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`stage-layout ${stuck ? "is-stuck" : ""}`}>
      <aside className="rail" aria-label="Grooming steps">
        <p className="rail-title">The four steps</p>
        <div className="rail-line" />
        {STEPS.map((s) => (
          <button
            key={s.id}
            className={`rail-step ${step === s.id ? "active" : ""}`}
            onClick={() => {
              onManual();
              setStep(s.id);
            }}
            aria-pressed={step === s.id}
          >
            <span className="rail-num">{s.index}</span>
            <span className="rail-label">
              <strong>{s.label}</strong>
              <small>{s.minutes} min · {s.tool}</small>
            </span>
          </button>
        ))}
        <p className="rail-hint">
          Click a step — or keep scrolling through the process below and the steps advance on
          their own. The 3D pet moves, and the stage props change.
        </p>
      </aside>

      <div className="stage-centre" ref={stageRef}>
        <div className="stage-toolbar">
          <span>
            Now: <strong>{currentStep.label}</strong> — {currentStep.stageNote}
          </span>
          <span className="stage-state">
            {pet === "dog" ? "Dog" : "Cat"} · {coat} coat{addons.includes("perfume") ? " · perfumed" : ""}
          </span>
        </div>
        <div className="stage-canvas">
          {reducedMotion ? (
            <div className="poster">
              <p className="poster-title">3D stage paused</p>
              <p>
                Reduced-motion is on, so the live stage is replaced by this note. The station
                is a round tub, a shower arm, a grooming table and a sitting {pet} — and each
                step changes which props are in use.
              </p>
              <p className="mono">Current step: {currentStep.index} {currentStep.label}</p>
            </div>
          ) : (
            <Stage3D
              step={step}
              pet={pet}
              coat={coat}
              perfumeOn={addons.includes("perfume")}
              paused={effectivePaused}
              scrollT={scrollT}
            />
          )}
        </div>
        <p className="stage-caption">
          Move your cursor over the stage — the station eases toward it, never snaps. Scroll
          the page and the station rotates with you. Motion also pauses when this tab is hidden
          or the stage scrolls off-screen.
          {effectivePaused && !reducedMotion ? " Motion is currently paused." : ""}
        </p>
      </div>

      <aside className="config-panel" aria-label="Live configurator summary">
        <p className="eyebrow">Live configurator</p>
        <p className="mono code">{calc.code}</p>
        <button className="copy-btn" onClick={copyCode}>
          {copied ? "Copied ✓" : "Copy code"}
        </button>
        <p className="price">{formatK(calc.priceK)}</p>
        <p className="config-meta">
          About {calc.minutes} minutes · {pet === "dog" ? "Dog" : "Cat"} · Size {size} · {coat} coat
          {addons.length ? ` · ${addons.length} add-on${addons.length > 1 ? "s" : ""}` : ""}
        </p>
        <ul className="config-breakdown">
          <li>
            <span>Base groom</span>
            <span>
              {formatK(
                Math.round(
                  (pet === "dog" ? 340 : 300) *
                    (size === "S" ? 1 : size === "M" ? 1.2 : size === "L" ? 1.45 : 1.7),
                ),
              )}
            </span>
          </li>
          {addons.map((id) => {
            const a = ADDONS.find((x) => x.id === id)!;
            return (
              <li key={id}>
                <span>{a.label}</span>
                <span>{formatK(a.priceK)}</span>
              </li>
            );
          })}
        </ul>
        <a className="cta" href="#booking">
          <RollLabel>Book this setup ↓</RollLabel>
        </a>
        <p className="demo-note">Demo only — bookings save to this browser's localStorage.</p>
      </aside>
    </div>
  );
}
