import { motion } from "framer-motion";
import type { ReactNode } from "react";

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
 * Masked line reveal (v3.1 common): each heading line is clipped by an
 * overflow-hidden mask and slides up from 110%, replacing the generic
 * fade-up reveal for headings.
 */
export function MaskedHeading({
  lines,
  className,
}: {
  lines: { text: string; em?: boolean }[];
  className?: string;
}) {
  return (
    <span className={className ?? "masked-heading"}>
      {lines.map((line, i) => (
        <span key={i} className="mask-line">
          <motion.span
            className="mask-inner"
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.09 }}
          >
            {line.em ? <em>{line.text}</em> : line.text}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** Content reveal kept for body blocks (headings use MaskedHeading). */
export function Reveal({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
