import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { REVIEWS } from "../data";
import { MaskedHeading, Reveal, TechLabel, fadeUpItem, handleGlow, staggerContainer } from "./common";
import "./ReviewsSection.css";

export default function ReviewsSection() {
  const stripRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ down: boolean; startX: number; startScroll: number }>({
    down: false,
    startX: 0,
    startScroll: 0,
  });
  // A drag that moved the strip must not also toggle a review on click-up.
  const dragMoved = useRef(false);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const reduced = useReducedMotion() ?? false;

  const updateProgress = () => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  };

  const scrollByAmount = (dx: number) => {
    stripRef.current?.scrollBy({ left: dx, behavior: "smooth" });
  };

  return (
    <section id="reviews" className="reviews-section room section-pad">
      <Reveal>
        <TechLabel>06 · Reviews · Drag the strip, watch the progress bar, hover or tap to expand</TechLabel>
        <h2>
          <MaskedHeading lines={[{ text: "Scroll sideways" }, { text: "through real visits", em: true }]} />
        </h2>
        <p className="strip-hint">← Drag or scroll the strip →</p>
      </Reveal>
      <motion.div
        className="reviews-strip"
        ref={stripRef}
        variants={staggerContainer}
        initial={reduced ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        onScroll={updateProgress}
        onPointerDown={(e) => {
          dragMoved.current = false;
          drag.current = { down: true, startX: e.clientX, startScroll: stripRef.current?.scrollLeft ?? 0 };
        }}
        onPointerMove={(e) => {
          if (!drag.current.down || !stripRef.current) return;
          const dx = e.clientX - drag.current.startX;
          if (Math.abs(dx) > 6) dragMoved.current = true;
          stripRef.current.scrollLeft = drag.current.startScroll - dx;
        }}
        onPointerUp={() => {
          drag.current.down = false;
        }}
        onPointerLeave={() => {
          drag.current.down = false;
        }}
      >
        {REVIEWS.map((r) => (
          <motion.article
            key={r.id}
            variants={fadeUpItem}
            whileHover={reduced ? undefined : { y: -4 }}
            className={`review surface--dark glow ${expanded === r.id ? "expanded" : ""}`}
            onPointerMove={handleGlow}
            onClick={() => {
              if (dragMoved.current) {
                dragMoved.current = false;
                return;
              }
              setExpanded(expanded === r.id ? null : r.id);
            }}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") setExpanded(expanded === r.id ? null : r.id);
            }}
          >
            <p className="stars">{"★".repeat(r.rating)}</p>
            <p className="review-text">“{r.text}”</p>
            <p className="review-who">
              <strong>{r.pet}</strong> · {r.owner}
            </p>
            <p className="review-service">{r.service}</p>
            <p className="review-expand-hint">{expanded === r.id ? "Tap to collapse ↑" : "Hover / tap to expand ↓"}</p>
          </motion.article>
        ))}
      </motion.div>
      <div className="strip-controls">
        <button onClick={() => scrollByAmount(-340)} aria-label="Scroll reviews left">
          ← Prev
        </button>
        <div className="strip-progress" aria-label="Reviews scroll progress">
          <span style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <button onClick={() => scrollByAmount(340)} aria-label="Scroll reviews right">
          Next →
        </button>
      </div>
    </section>
  );
}
