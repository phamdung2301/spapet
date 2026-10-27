import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ADDONS, COAT_EXTRA_K, COAT_MINUTES, SIZE_MULT, formatK } from "../data";
import type { AddonId, Coat, PetType } from "../data";
import { MaskedHeading, Reveal, RollLabel, TechLabel } from "./common";
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
    <section id="builder" className="builder-section">
      <Reveal>
        <TechLabel>03 · Service builder · Every choice redraws the price line by line</TechLabel>
        <h2>
          <MaskedHeading
            lines={[{ text: "Build the groom," }, { text: "watch the code follow", em: true }]}
          />
        </h2>
        <div className="builder-layout">
          <div className="builder-controls">
            <fieldset>
              <legend>Pet</legend>
              <div className="option-cards">
                {(["dog", "cat"] as PetType[]).map((p) => (
                  <button
                    key={p}
                    className={`option-card ${pet === p ? "active" : ""}`}
                    onClick={() => setPet(p)}
                    aria-pressed={pet === p}
                  >
                    <PetShape pet={p} />
                    <strong>{p === "dog" ? "Dog" : "Cat"}</strong>
                    <small>{p === "dog" ? "Floppy ears, bigger coat" : "Pointed ears, quieter groom"}</small>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Size</legend>
              <div className="option-cards">
                {(["S", "M", "L", "XL"] as const).map((s) => (
                  <button
                    key={s}
                    className={`option-card ${size === s ? "active" : ""}`}
                    onClick={() => setSize(s)}
                    aria-pressed={size === s}
                  >
                    <span className="size-bars" aria-hidden="true">
                      <span style={{ height: SIZE_BAR[s] }} />
                    </span>
                    <strong>{s}</strong>
                    <small>{SIZE_NOTE[s]}</small>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend>Coat — this changes the 3D coat shell</legend>
              <div className="option-cards">
                {(["short", "long", "curly"] as Coat[]).map((c) => (
                  <button
                    key={c}
                    className={`option-card ${coat === c ? "active" : ""}`}
                    onClick={() => setCoat(c)}
                    aria-pressed={coat === c}
                  >
                    <span className={`coat-swatch ${c}`} aria-hidden="true" />
                    <strong>{c}</strong>
                    <small>
                      {c === "short" ? "Flat, easy wash" : c === "long" ? "Full length, +15 min" : "Curls, shaping, +10 min"}
                    </small>
                  </button>
                ))}
              </div>
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
          <div className="builder-summary">
            <p className="eyebrow">Your setup</p>
            <p className="mono code">{calc.code}</p>
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
                    <b>{formatK(line.value)}</b>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
            <p className="price total-price">{formatK(calc.priceK)}</p>
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
