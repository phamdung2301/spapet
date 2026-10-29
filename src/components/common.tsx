import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";

/** 10px mono technical label, used throughout v3.1 instead of plain small text. */
export function TechLabel({ children }: { children: ReactNode }) {
  return <p className="tech-label">{children}</p>;
}

/** Rolling-text hover for CTAs: the label slides up and a copy follows it. */
export function RollLabel({ children }: { children: ReactNode }) {
  return (
    <span className="roll-label">
      <span className="roll-a">{children}</span>
      <span className="roll-b" aria-hidden="true">
        {children}
      </span>
    </span>
  );
}

/**
 * Pointer sheen driver (UI-09): spread `onPointerMove={handleGlow}` onto any
 * element with the `.glow` class and the CSS picks up --mx/--my. Disabled for
 * coarse pointers and reduced-motion users.
 */
let glowAllowedCache: boolean | null = null;
function glowAllowed(): boolean {
  if (glowAllowedCache === null && typeof window !== "undefined") {
    glowAllowedCache =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return glowAllowedCache ?? false;
}

export function handleGlow(e: ReactPointerEvent<HTMLElement>) {
  if (!glowAllowed()) return;
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  el.style.setProperty("--mx", `${(((e.clientX - rect.left) / rect.width) * 100).toFixed(2)}%`);
  el.style.setProperty("--my", `${(((e.clientY - rect.top) / rect.height) * 100).toFixed(2)}%`);
}

/**
 * Masked line reveal (v3.1 common): each heading line is clipped by an
 * overflow-hidden mask and slides up from 110%. Reduced motion renders
 * instantly instead of animating.
 */
export function MaskedHeading({
  lines,
  className,
}: {
  lines: { text: string; em?: boolean }[];
  className?: string;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <span className={className ?? "masked-heading"}>
      {lines.map((line, i) => (
        <span key={i} className="mask-line">
          <motion.span
            className="mask-inner"
            initial={reduced ? false : { y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.09 }
            }
          >
            {line.em ? <em>{line.text}</em> : line.text}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/**
 * Content reveal (UI-08): soft blur-fade with optional stagger delay.
 * Pass blur={false} on wrappers that contain position: sticky children, so no
 * inline filter ever lingers on an ancestor of the sticky element.
 */
export function Reveal({
  children,
  delay = 0,
  blur = true,
}: {
  children: ReactNode;
  delay?: number;
  blur?: boolean;
}) {
  const reduced = useReducedMotion() ?? false;
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 28, ...(blur ? { filter: "blur(6px)" } : {}) }}
      whileInView={{ opacity: 1, y: 0, ...(blur ? { filter: "blur(0px)" } : {}) }}
      viewport={{ once: true, margin: "-60px" }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }
      }
    >
      {children}
    </motion.div>
  );
}

/**
 * Shared stagger variants (UI-08). Put `variants={staggerContainer}` plus
 * `initial` / `whileInView` on a motion parent and `variants={fadeUpItem}` on
 * motion children. Gate with `initial={reduced ? false : "hidden"}`.
 */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

/**
 * Count-up number for prices (UI-09). Instant under reduced motion; rounds to
 * whole numbers and keeps tabular figures via CSS.
 */
export function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const reduced = useReducedMotion() ?? false;
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = value;
    if (reduced || from === value) {
      setDisplay(value);
      return;
    }
    const controls = animate(from, value, {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, reduced]);

  return (
    <span className="animated-number">
      {display.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

/** Brand mark (UI-03): paw pad + toe beans + a bubble. Replaces the "◍" glyph. */
export function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      className="brand-mark"
      width={size}
      height={size}
      viewBox="0 0 34 34"
      role="img"
      aria-label="Paw and Bubbles"
    >
      <circle
        className="brand-bubble"
        cx="26.5"
        cy="7.5"
        r="5"
        fill="rgba(127, 168, 147, 0.28)"
        stroke="#5d7a6a"
        strokeWidth="1.5"
      />
      <circle cx="28.4" cy="5.6" r="1.3" fill="#ffffff" opacity="0.9" />
      <circle cx="6.5" cy="14.5" r="3" fill="#e88f74" />
      <circle cx="13" cy="11.5" r="3.2" fill="#e88f74" />
      <circle cx="19.5" cy="14.5" r="3" fill="#e88f74" />
      <ellipse cx="13" cy="23" rx="7.5" ry="6" fill="#e88f74" />
    </svg>
  );
}

/** Tiny transport glyphs for the Pause motion button (crisper than unicode). */
export function PauseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <rect x="1" y="0.5" width="3" height="9" rx="1.2" fill="currentColor" />
      <rect x="6" y="0.5" width="3" height="9" rx="1.2" fill="currentColor" />
    </svg>
  );
}
export function PlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
      <path d="M2 1l7 4-7 4z" fill="currentColor" />
    </svg>
  );
}
