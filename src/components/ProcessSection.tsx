import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { RefObject } from "react";
import { STEPS } from "../data";
import type { StepId } from "../data";
import { MaskedHeading, Reveal, TechLabel } from "./common";
import "./ProcessSection.css";

interface Props {
  step: StepId;
  setStep: (s: StepId) => void;
  onManual: () => void;
  processRef: RefObject<HTMLElement | null>;
}

export default function ProcessSection({ step, setStep, onManual, processRef }: Props) {
  const currentStep = STEPS.find((s) => s.id === step) ?? STEPS[0];
  const reduced = useReducedMotion() ?? false;
  return (
    <section id="process" className="process-section" ref={processRef}>
      <Reveal>
        <TechLabel>02 · The process · Scroll — the stage above stays pinned and the steps advance</TechLabel>
        <h2>
          <MaskedHeading
            lines={[{ text: "Four steps," }, { text: "one visible change each", em: true }]}
          />
        </h2>
        <div className="step-tabs">
          {STEPS.map((s) => (
            <button
              key={s.id}
              className={step === s.id ? "active" : ""}
              onClick={() => {
                onManual();
                setStep(s.id);
              }}
            >
              {s.index} {s.label}
            </button>
          ))}
        </div>
        <div className="process-meter">
          <span
            style={{
              width: `${((STEPS.findIndex((s) => s.id === step) + 1) / STEPS.length) * 100}%`,
            }}
          />
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.id}
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -16 }}
            transition={reduced ? { duration: 0 } : { duration: 0.3 }}
            className="process-detail"
          >
            <div>
              <h3>{currentStep.title}</h3>
              <p>{currentStep.detail}</p>
            </div>
            <div className="process-facts">
              <p>
                <span>Tool</span>
                <strong>{currentStep.tool}</strong>
              </p>
              <p>
                <span>Time</span>
                <strong>{currentStep.minutes} minutes</strong>
              </p>
              <p>
                <span>On the stage</span>
                <strong>{currentStep.stageNote}</strong>
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </Reveal>
    </section>
  );
}
