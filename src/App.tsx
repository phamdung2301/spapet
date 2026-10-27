import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import Stage3D from "./Stage3D";
import {
  ADDONS,
  GROOMERS,
  QUIZ,
  REVIEWS,
  STEPS,
  TIME_SLOTS,
  calcPrice,
  formatK,
  isSlotFull,
  next7Days,
  recommendQuiz,
  type AddonId,
  type Booking,
  type Coat,
  type PetType,
  type StepId,
} from "./data";

const STORAGE_KEY = "spapet-v3-bookings";

function Reveal({ children }: { children: React.ReactNode }) {
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

function AnimatedPrice({ priceK }: { priceK: number }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={priceK}
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -12, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="price"
      >
        {formatK(priceK)}
      </motion.span>
    </AnimatePresence>
  );
}

export default function App() {
  const [step, setStep] = useState<StepId>("wash");
  const [pet, setPet] = useState<PetType>("dog");
  const [size, setSize] = useState<"S" | "M" | "L" | "XL">("M");
  const [coat, setCoat] = useState<Coat>("long");
  const [addons, setAddons] = useState<AddonId[]>(["nails"]);
  const [groomerId, setGroomerId] = useState("mia");
  const [dayIndex, setDayIndex] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [petName, setPetName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingNote, setBookingNote] = useState("");
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizDone, setQuizDone] = useState(false);
  const [quizApplied, setQuizApplied] = useState(false);

  const [userPaused, setUserPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [stageVisible, setStageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });

  const days = useMemo(() => next7Days(), []);
  const calc = useMemo(() => calcPrice(pet, size, coat, addons), [pet, size, coat, addons]);
  const groomer = GROOMERS.find((g) => g.id === groomerId) ?? GROOMERS[0];
  const currentStep = STEPS.find((s) => s.id === step) ?? STEPS[0];
  const quizResult = useMemo(() => (quizDone ? recommendQuiz(quizAnswers) : null), [quizDone, quizAnswers]);
  const effectivePaused = userPaused || hidden || !stageVisible || reducedMotion;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setBookings(JSON.parse(raw) as Booking[]);
    } catch {
      setBookings([]);
    }
  }, []);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setStageVisible(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch {
      /* demo storage only */
    }
  }, [bookings]);

  const toggleAddon = (id: AddonId) =>
    setAddons((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));

  const saveBooking = () => {
    if (!petName.trim() || !slot) {
      setBookingNote("Add a pet name and pick a time slot first.");
      return;
    }
    const b: Booking = {
      id: `${Date.now()}`,
      petName: petName.trim(),
      code: calc.code,
      groomerName: groomer.name,
      dateLabel: days[dayIndex].label,
      time: slot,
      priceK: calc.priceK,
      minutes: calc.minutes,
    };
    setBookings((prev) => [b, ...prev]);
    setBookingNote(`Saved for ${b.petName} — ${b.dateLabel} at ${b.time} with ${b.groomerName}. Demo only, stored in this browser.`);
    setSlot(null);
  };

  const answerQuiz = (qid: string, oid: string) => {
    const next = { ...quizAnswers, [qid]: oid };
    setQuizAnswers(next);
    if (quizIndex < QUIZ.length - 1) setQuizIndex(quizIndex + 1);
    else setQuizDone(true);
  };

  const applyQuiz = () => {
    if (!quizResult) return;
    if (!addons.includes(quizResult.addon)) setAddons((prev) => [...prev, quizResult.addon]);
    setQuizApplied(true);
    document.getElementById("builder")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="page">
      <motion.div className="scroll-progress" style={{ scaleX: progress }} />
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">◍</span>
          <span>
            <strong>Paw &amp; Bubbles</strong>
            <small>Pet spa · Ho Chi Minh City</small>
          </span>
        </div>
        <nav className="topnav">
          <a href="#stage">Stage</a>
          <a href="#process">Process</a>
          <a href="#builder">Builder</a>
          <a href="#booking">Booking</a>
          <a href="#quiz">Quiz</a>
          <a href="#reviews">Reviews</a>
        </nav>
        <button className="pause-btn" onClick={() => setUserPaused((p) => !p)} aria-pressed={userPaused}>
          {userPaused ? "▶ Resume motion" : "❚❚ Pause motion"}
        </button>
      </header>

      {/* (1) STAGE: left rail + centre 3D + right configurator panel */}
      <section id="stage" className="stage-section">
        <div className="stage-intro">
          <p className="eyebrow">A grooming station, not a poster</p>
          <h1>
            Watch the groom happen,
            <br />
            <em>then build it your way.</em>
          </h1>
          <p className="lede">
            Pick a step on the left rail and the 3D station changes. Build the service on the
            right, pick a groomer and a real slot below, and the price, time and booking code
            follow every choice. Demo bookings only — nothing is charged.
          </p>
        </div>

        <div className="stage-layout">
          <aside className="rail" aria-label="Grooming steps">
            <p className="rail-title">The four steps</p>
            <div className="rail-line" />
            {STEPS.map((s) => (
              <button
                key={s.id}
                className={`rail-step ${step === s.id ? "active" : ""}`}
                onClick={() => setStep(s.id)}
                aria-pressed={step === s.id}
              >
                <span className="rail-num">{s.index}</span>
                <span className="rail-label">
                  <strong>{s.label}</strong>
                  <small>{s.minutes} min · {s.tool}</small>
                </span>
              </button>
            ))}
            <p className="rail-hint">Click a step — the 3D pet moves, and the stage props change.</p>
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
                <Stage3D step={step} pet={pet} coat={coat} perfumeOn={addons.includes("perfume")} paused={effectivePaused} />
              )}
            </div>
            <p className="stage-caption">
              Move your cursor over the stage — the station eases toward it, never snaps. Motion
              also pauses when this tab is hidden or the stage scrolls off-screen.
              {effectivePaused && !reducedMotion ? " Motion is currently paused." : ""}
            </p>
          </div>

          <aside className="config-panel" aria-label="Live configurator summary">
            <p className="eyebrow">Live configurator</p>
            <p className="mono code">{calc.code}</p>
            <AnimatedPrice priceK={calc.priceK} />
            <p className="config-meta">
              About {calc.minutes} minutes · {pet === "dog" ? "Dog" : "Cat"} · Size {size} · {coat} coat
              {addons.length ? ` · ${addons.length} add-on${addons.length > 1 ? "s" : ""}` : ""}
            </p>
            <ul className="config-breakdown">
              <li>
                <span>Base groom</span>
                <span>{formatK(Math.round((pet === "dog" ? 340 : 300) * (size === "S" ? 1 : size === "M" ? 1.2 : size === "L" ? 1.45 : 1.7)))}</span>
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
              Book this setup ↓
            </a>
            <p className="demo-note">Demo only — bookings save to this browser's localStorage.</p>
          </aside>
        </div>
      </section>

      {/* (2) PROCESS: one detail panel, step transitions */}
      <section id="process" className="process-section">
        <Reveal>
          <p className="eyebrow">02 · The process</p>
          <h2>Four steps, one visible change each</h2>
          <div className="step-tabs">
            {STEPS.map((s) => (
              <button key={s.id} className={step === s.id ? "active" : ""} onClick={() => setStep(s.id)}>
                {s.index} {s.label}
              </button>
            ))}
          </div>
          <div className="process-meter">
            <span style={{ width: `${((STEPS.findIndex((s) => s.id === step) + 1) / STEPS.length) * 100}%` }} />
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
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

      {/* (3) SERVICE BUILDER */}
      <section id="builder" className="builder-section">
        <Reveal>
          <p className="eyebrow">03 · Service builder</p>
          <h2>Build the groom, watch the code follow</h2>
          <div className="builder-layout">
            <div className="builder-controls">
              <fieldset>
                <legend>Pet</legend>
                <div className="pill-row">
                  {(["dog", "cat"] as PetType[]).map((p) => (
                    <button key={p} className={pet === p ? "active" : ""} onClick={() => setPet(p)}>
                      {p === "dog" ? "Dog" : "Cat"}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Size</legend>
                <div className="pill-row">
                  {(["S", "M", "L", "XL"] as const).map((s) => (
                    <button key={s} className={size === s ? "active" : ""} onClick={() => setSize(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Coat — this changes the 3D coat shell</legend>
                <div className="pill-row">
                  {(["short", "long", "curly"] as Coat[]).map((c) => (
                    <button key={c} className={coat === c ? "active" : ""} onClick={() => setCoat(c)}>
                      {c}
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
              <AnimatedPrice priceK={calc.priceK} />
              <p>About {calc.minutes} minutes in the salon.</p>
              <p className="builder-note">
                The code is the receipt for this exact combination — it travels with the booking
                below, so the groomer sees pet, size, coat and add-ons at a glance.
              </p>
              {quizApplied && <p className="applied">✓ Quiz recommendation applied to this builder.</p>}
            </div>
          </div>
        </Reveal>
      </section>

      {/* (4) GROOMER + SLOT BOOKING */}
      <section id="booking" className="booking-section">
        <Reveal>
          <p className="eyebrow">04 · Groomer + slot booking</p>
          <h2>Pick a person, then a time that is actually free</h2>
          <div className="groomer-list">
            {GROOMERS.map((g) => (
              <button
                key={g.id}
                className={`groomer-row ${groomerId === g.id ? "active" : ""}`}
                onClick={() => {
                  setGroomerId(g.id);
                  setSlot(null);
                }}
              >
                <span className="avatar">{g.name.split(" ").map((w) => w[0]).join("")}</span>
                <span className="groomer-main">
                  <strong>{g.name}</strong>
                  <small>{g.specialty} · {g.years} years · ★ {g.rating}</small>
                  <small>{g.note}</small>
                </span>
                <span className="groomer-check">{groomerId === g.id ? "Selected" : "Select"}</span>
              </button>
            ))}
          </div>

          <p className="field-label">Day — next 7 days</p>
          <div className="chip-row">
            {days.map((d, i) => (
              <button key={d.iso} className={dayIndex === i ? "active" : ""} onClick={() => { setDayIndex(i); setSlot(null); }}>
                {d.label}
              </button>
            ))}
          </div>

          <p className="field-label">Time with {groomer.name}</p>
          <div className="slot-row">
            {TIME_SLOTS.map((t, ti) => {
              const full = isSlotFull(dayIndex, ti) || groomer.unavailable.includes(t);
              return (
                <button
                  key={t}
                  disabled={full}
                  className={slot === t ? "active" : ""}
                  onClick={() => setSlot(t)}
                >
                  {t}
                  {full ? " · full" : ""}
                </button>
              );
            })}
          </div>

          <div className="booking-form">
            <label>
              Pet name
              <input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="e.g. Banh Mi" />
            </label>
            <label>
              Owner name
              <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Your name (optional)" />
            </label>
            <div className="booking-summary">
              <p className="mono">{calc.code}</p>
              <p>
                {groomer.name} · {days[dayIndex].label} {slot ? `at ${slot}` : "— pick a time"} ·{" "}
                {formatK(calc.priceK)} · {calc.minutes} min
              </p>
            </div>
            <button className="cta" onClick={saveBooking}>
              Save booking (demo)
            </button>
            {bookingNote && <p className="booking-note">{bookingNote}</p>}
          </div>

          <h3>My bookings</h3>
          {bookings.length === 0 ? (
            <p className="empty">No bookings saved yet in this browser. Save one above and it appears here.</p>
          ) : (
            <ul className="booking-list">
              {bookings.map((b) => (
                <li key={b.id}>
                  <span>
                    <strong>{b.petName}</strong> · {b.code} · {b.groomerName} · {b.dateLabel} at {b.time} ·{" "}
                    {formatK(b.priceK)} · {b.minutes} min
                  </span>
                  <button onClick={() => setBookings((prev) => prev.filter((x) => x.id !== b.id))}>Delete</button>
                </li>
              ))}
            </ul>
          )}
        </Reveal>
      </section>

      {/* (5) COAT-CARE QUIZ */}
      <section id="quiz" className="quiz-section">
        <Reveal>
          <p className="eyebrow">05 · Coat-care quiz</p>
          <h2>Three questions, one routine — applied, not just shown</h2>
          {!quizDone ? (
            <div className="quiz-box">
              <p className="quiz-progress">
                Question {quizIndex + 1} of {QUIZ.length}
              </p>
              <h3>{QUIZ[quizIndex].prompt}</h3>
              <div className="quiz-options">
                {QUIZ[quizIndex].options.map((o) => (
                  <button key={o.id} onClick={() => answerQuiz(QUIZ[quizIndex].id, o.id)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ) : quizResult ? (
            <div className="quiz-result">
              <h3>{quizResult.routine}</h3>
              <p>{quizResult.reason}</p>
              <p>
                Recommended add-on: <strong>{ADDONS.find((a) => a.id === quizResult.addon)?.label}</strong>
              </p>
              <button className="cta" onClick={applyQuiz}>
                {quizApplied ? "Applied ✓ — applied to the builder" : "Apply this service to the builder"}
              </button>
              <button
                className="text-btn"
                onClick={() => {
                  setQuizAnswers({});
                  setQuizIndex(0);
                  setQuizDone(false);
                  setQuizApplied(false);
                }}
              >
                Retake the quiz
              </button>
            </div>
          ) : null}
        </Reveal>
      </section>

      {/* (6) REVIEWS — horizontal scroll strip */}
      <section id="reviews" className="reviews-section">
        <Reveal>
          <p className="eyebrow">06 · Reviews</p>
          <h2>Scroll sideways through real visits</h2>
          <p className="strip-hint">← Scroll the strip →</p>
          <div className="reviews-strip">
            {REVIEWS.map((r) => (
              <article key={r.id} className="review">
                <p className="stars">{"★".repeat(r.rating)}</p>
                <p className="review-text">“{r.text}”</p>
                <p className="review-who">
                  <strong>{r.pet}</strong> · {r.owner}
                </p>
                <p className="review-service">{r.service}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <footer>
        <p>
          <strong>Paw &amp; Bubbles</strong> — pet spa, Ho Chi Minh City. Demo site: bookings are
          stored only in this browser and are not real appointments.
        </p>
        <p className="mono">SPAPET v3.0 — 2026-10-26</p>
      </footer>
    </div>
  );
}
