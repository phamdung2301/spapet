import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ADDONS, COAT_EXTRA_K, COAT_MINUTES, SIZE_MULT, formatK } from "../data";
import type { AddonId, Coat, PetType } from "../data";
import {
  AnimatedNumber,
  MaskedHeading,
  Reveal,
  RollLabel,
  TechLabel,
  fadeUpItem,
  handleGlow,
  staggerContainer,
} from "./common";
import "./BuilderSection.css";

interface Calc {
  priceK: number;
  minutes: number;
  code: string;
}

interface Props {
  pet: PetType;
  setPet: (p: PetType) => void;
  size: "S" | "M" | "L" | "XL";
  setSize: (s: "S" | "M" | "L" | "XL") => void;
  coat: Coat;
  setCoat: (c: Coat) => void;
  addons: AddonId[];
  toggleAddon: (id: AddonId) => void;
  calc: Calc;
  quizApplied: boolean;
}

const SIZE_BAR: Record<string, number> = { S: 14, M: 22, L: 30, XL: 38 };
const SIZE_NOTE: Record<string, string> = {
  S: "Under 5 kg",
  M: "5–12 kg",
  L: "12–25 kg",
  XL: "Over 25 kg",
};

function PetShape({ pet }: { pet: PetType }) {
  return (
    <span className={`pet-shape ${pet}`} aria-hidden="true">
      <span className="pet-body" />
      <span className="pet-head" />
      <span className="pet-ear left" />
      <span className="pet-ear right" />
    </span>
  );
}

export default function BuilderSection(props: Props) {
  const { pet, setPet, size, setSize, coat, setCoat, addons, toggleAddon, calc, quizApplied } = props;
  const [copied, setCopied] = useState(false);
  const reduced = useReducedMotion() ?? false;
  const baseK = Math.round((pet === "dog" ? 340 : 300) * SIZE_MULT[size]);
  const coatK = COAT_EXTRA_K[coat];
  const breakdown = [
    { label: "Base groom", value: baseK, detail: `${pet === "dog" ? "Dog" : "Cat"} · size ${size}` },
    { label: "Coat work", value: coatK, detail: `${coat} coat · +${COAT_MINUTES[coat]} min` },
    ...addons.map((id) => {
      const a = ADDONS.find((x) => x.id === id)!;
      return { label: a.label, value: a.priceK, detail: `+${a.minutes} min` };
    }),
  ];

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(calc.code);
    } catch {
      /* clipboard unavailable; code is still visible */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="builder" className="builder-section room section-pad">
      <Reveal>
        <TechLabel>03 · Service builder · Every choice redraws the price line by line</TechLabel>
        <h2>
          <MaskedHeading
            lines={[{ text: "Build the groom," }, { text: "watch the code follow", em: true }]}
          />
        </h2>
      </Reveal>

      {/* blur={false}: this wrapper contains the sticky summary — never leave an
          inline filter on an ancestor of a sticky element */}
      <Reveal delay={0.05} blur={false}>
        <div className="builder-layout">
          <div className="builder-controls">
            <fieldset>
              <legend>Pet</legend>
              <motion.div
                className="option-cards"
                variants={staggerContainer}
                initial={reduced ? false : "hidden"}
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
              >
                {(["dog", "cat"] as PetType[]).map((p) => (
                  <motion.button
                    key={p}
                    variants={fadeUpItem}
                    whileHover={reduced ? undefined : { y: -3 }}
                    whileTap={reduced ? undefined : { scale: 0.97 }}
                    className={`option-card surface glow ${pet === p ? "active" : ""}`}
                    onClick={() => setPet(p)}
                    onPointerMove={handleGlow}
                    aria-pressed={pet === p}
                  >
                    <PetShape pet={p} />
                    <strong>{p === "dog" ? "Dog" : "Cat"}</strong>
                    <small>{p === "dog" ? "Floppy ears, bigger coat" : "Pointed ears, quieter groom"}</small>
                  </motion.button>
                ))}
              </motion.div>
            </fieldset>
            <fieldset>
              <legend>Size</legend>
              <motion.div
                className="option-cards"
                variants={staggerContainer}
                initial={reduced ? false : "hidden"}
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
              >
                {(["S", "M", "L", "XL"] as const).map((s) => (
                  <motion.button
                    key={s}
                    variants={fadeUpItem}
                    whileHover={reduced ? undefined : { y: -3 }}
                    whileTap={reduced ? undefined : { scale: 0.97 }}
                    className={`option-card surface glow ${size === s ? "active" : ""}`}
                    onClick={() => setSize(s)}
                    onPointerMove={handleGlow}
                    aria-pressed={size === s}
                  >
                    <span className="size-bars" aria-hidden="true">
                      <span style={{ height: SIZE_BAR[s] }} />
                    </span>
                    <strong>{s}</strong>
                    <small>{SIZE_NOTE[s]}</small>
                  </motion.button>
                ))}
              </motion.div>
            </fieldset>
            <fieldset>
              <legend>Coat — this changes the 3D coat shell</legend>
              <motion.div
                className="option-cards"
                variants={staggerContainer}
                initial={reduced ? false : "hidden"}
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
              >
                {(["short", "long", "curly"] as Coat[]).map((c) => (
                  <motion.button
                    key={c}
                    variants={fadeUpItem}
                    whileHover={reduced ? undefined : { y: -3 }}
                    whileTap={reduced ? undefined : { scale: 0.97 }}
                    className={`option-card surface glow ${coat === c ? "active" : ""}`}
                    onClick={() => setCoat(c)}
                    onPointerMove={handleGlow}
                    aria-pressed={coat === c}
                  >
                    <span className={`coat-swatch ${c}`} aria-hidden="true" />
                    <strong>{c}</strong>
                    <small>
                      {c === "short" ? "Flat, easy wash" : c === "long" ? "Full length, +15 min" : "Curls, shaping, +10 min"}
                    </small>
                  </motion.button>
                ))}
              </motion.div>
            </fieldset>
            <fieldset>
              <legend>Add-ons</legend>
              <div className="addon-list">
                {ADDONS.map((a) => (
                  <label key={a.id} className="addon-row">
                    <input type="checkbox" checked={addons.includes(a.id)} onChange={() => toggleAddon(a.id)} />
                    <span>
                      <strong>{a.label}</strong>
                      <small>{a.note}</small>
                    </span>
                    <b>{formatK(a.priceK)}</b>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="builder-summary surface">
            <p className="eyebrow">Your setup</p>
            <motion.p
              key={calc.code}
              className="mono code"
              initial={reduced ? false : { scale: 0.94, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={reduced ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              {calc.code}
            </motion.p>
            <button className="copy-btn dark" onClick={copyCode}>
              {copied ? "Copied ✓" : "Copy code"}
            </button>
            <motion.ul layout className="price-breakdown">
              <AnimatePresence>
                {breakdown.map((line) => (
                  <motion.li
                    key={line.label}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <span>
                      <strong>{line.label}</strong>
                      <small>{line.detail}</small>
                    </span>
                    <b>
                      <AnimatedNumber value={line.value} suffix="k VND" />
                    </b>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
            <p className="price total-price">
              <AnimatedNumber value={calc.priceK} suffix="k VND" />
            </p>
            <p>About {calc.minutes} minutes in the salon.</p>
            <p className="builder-note">
              The code is the receipt for this exact combination — it travels with the booking
              below, so the groomer sees pet, size, coat and add-ons at a glance.
            </p>
            {quizApplied && <p className="applied">✓ Quiz recommendation applied to this builder.</p>}
            <a className="cta" href="#booking">
              <RollLabel>Book this setup ↓</RollLabel>
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
