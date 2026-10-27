import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from "framer-motion";
import BookingSection from "./components/BookingSection";
import BuilderSection from "./components/BuilderSection";
import ProcessSection from "./components/ProcessSection";
import QuizSection from "./components/QuizSection";
import ReviewsSection from "./components/ReviewsSection";
import StageSection from "./components/StageSection";
import { MaskedHeading } from "./components/common";
import {
  STEPS,
  calcPrice,
  next7Days,
  recommendQuiz,
  type AddonId,
  type Booking,
  type Coat,
  type PetType,
  type StepId,
} from "./data";

const STORAGE_KEY = "spapet-v3-bookings";

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
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizDone, setQuizDone] = useState(false);
  const [quizApplied, setQuizApplied] = useState(false);

  const [userPaused, setUserPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [stageVisible, setStageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [scrollT, setScrollT] = useState(0);
  const [stageStuck, setStageStuck] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastManualRef = useRef(0);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });

  // Scroll-scrub for the stage zone: wrap progress drives the 3D rotation
  // (via scrollT) and the intro title drift.
  const wrapScroll = useScroll({ target: wrapRef, offset: ["start end", "end start"] });
  const titleX = useTransform(wrapScroll.scrollYProgress, [0, 1], [0, -60]);
  useMotionValueEvent(wrapScroll.scrollYProgress, "change", (v) => setScrollT(v));

  // Scroll-advance for the process steps: scrolling through the process
  // section advances Wash -> Dry -> Cut -> Perfume, unless the user just
  // clicked a step (manual clicks win for 2 seconds).
  const processScroll = useScroll({ target: processRef, offset: ["start center", "end center"] });
  useMotionValueEvent(processScroll.scrollYProgress, "change", (v) => {
    if (Date.now() - lastManualRef.current < 2000) return;
    const idx = Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)));
    const next = STEPS[idx].id;
    if (next !== step) setStep(next);
  });

  const days = useMemo(() => next7Days(), []);
  const calc = useMemo(() => calcPrice(pet, size, coat, addons), [pet, size, coat, addons]);
  const quizResult = useMemo(() => (quizDone ? recommendQuiz(quizAnswers) : null), [quizDone, quizAnswers]);
  const effectivePaused = userPaused || hidden || !stageVisible || reducedMotion;

  const markManual = () => {
    lastManualRef.current = Date.now();
  };

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
    const el = processRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setStageStuck(e.isIntersecting), { threshold: 0.05 });
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

      {/* STAGE + PROCESS share one scroll zone: the stage layout sticks while
          the process scrolls beneath it, and scrolling advances the steps. */}
      <section id="stage" className="stage-section">
        <div className="stage-intro">
          <p className="eyebrow">A grooming station, not a poster</p>
          <motion.h1 style={{ x: titleX }}>
            <MaskedHeading
              lines={[{ text: "Watch the groom happen," }, { text: "then build it your way.", em: true }]}
            />
          </motion.h1>
          <p className="lede">
            Pick a step on the left rail and the 3D station changes. Build the service on the
            right, pick a groomer and a real slot below, and the price, time and booking code
            follow every choice. Demo bookings only — nothing is charged.
          </p>
          <p className="tech-label">01 · Stage · Scroll-scrubbed 3D · Sticky through the process</p>
        </div>

        <div className="stage-process-wrap" ref={wrapRef}>
          <StageSection
            step={step}
            setStep={setStep}
            onManual={markManual}
            pet={pet}
            coat={coat}
            addons={addons}
            size={size}
            calc={calc}
            stageRef={stageRef}
            stageVisible={stageVisible}
            reducedMotion={reducedMotion}
            effectivePaused={effectivePaused}
            scrollT={scrollT}
            stuck={stageStuck}
          />
          <ProcessSection step={step} setStep={setStep} onManual={markManual} processRef={processRef} />
        </div>
      </section>

      <BuilderSection
        pet={pet}
        setPet={setPet}
        size={size}
        setSize={setSize}
        coat={coat}
        setCoat={setCoat}
        addons={addons}
        toggleAddon={toggleAddon}
        calc={calc}
        quizApplied={quizApplied}
      />

      <BookingSection
        groomerId={groomerId}
        setGroomerId={setGroomerId}
        dayIndex={dayIndex}
        setDayIndex={setDayIndex}
        slot={slot}
        setSlot={setSlot}
        petName={petName}
        setPetName={setPetName}
        ownerName={ownerName}
        setOwnerName={setOwnerName}
        calc={calc}
        days={days}
        bookings={bookings}
        setBookings={setBookings}
      />

      <QuizSection
        quizIndex={quizIndex}
        setQuizIndex={setQuizIndex}
        quizAnswers={quizAnswers}
        setQuizAnswers={setQuizAnswers}
        quizDone={quizDone}
        setQuizDone={setQuizDone}
        quizApplied={quizApplied}
        setQuizApplied={setQuizApplied}
        quizResult={quizResult}
        applyQuiz={applyQuiz}
      />

      <ReviewsSection />

      <footer>
        <p>
          <strong>Paw &amp; Bubbles</strong> — pet spa, Ho Chi Minh City. Demo site: bookings are
          stored only in this browser and are not real appointments.
        </p>
        <p className="mono">SPAPET v3.1 — 2026-10-27</p>
      </footer>
    </div>
  );
}
