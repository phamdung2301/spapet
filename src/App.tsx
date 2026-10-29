import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import BookingSection from "./components/BookingSection";
import BuilderSection from "./components/BuilderSection";
import ProcessSection from "./components/ProcessSection";
import QuizSection from "./components/QuizSection";
import ReviewsSection from "./components/ReviewsSection";
import StageSection from "./components/StageSection";
import { BrandMark, MaskedHeading, PauseIcon, PlayIcon } from "./components/common";
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
  const [scrolled, setScrolled] = useState(false);
  // Intro veil (UI-07): skipped entirely when the user prefers reduced motion.
  // `?noveil` is an e2e/screenshot escape hatch.
  const [booted, setBooted] = useState(
    () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.location.search.includes("noveil"),
  );

  const stageRef = useRef<HTMLDivElement>(null);
  const processRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const lastManualRef = useRef(0);

  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });

  // Topbar compacts once the page scrolls (UI-06).
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 12));

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

  // Intro veil (UI-07): lift once the page has loaded AND the brand beat has
  // played, capped so the site is never stuck behind it. Content renders
  // underneath from the first frame.
  useEffect(() => {
    if (booted) return;
    if (userPaused) {
      setBooted(true);
      return;
    }
    let done = false;
    let loaded = document.readyState === "complete";
    const start = performance.now();
    const finish = () => {
      if (!done) {
        done = true;
        setBooted(true);
      }
    };
    const minBeat = window.setTimeout(() => {
      if (loaded) finish();
    }, 1100);
    const cap = window.setTimeout(finish, 2400);
    const onLoad = () => {
      loaded = true;
      if (performance.now() - start >= 1100) finish();
    };
    window.addEventListener("load", onLoad);
    return () => {
      window.clearTimeout(minBeat);
      window.clearTimeout(cap);
      window.removeEventListener("load", onLoad);
    };
  }, [booted, userPaused]);

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
      <AnimatePresence>
        {!booted && (
          <motion.div
            key="intro-veil"
            className="intro-veil"
            aria-hidden="true"
            exit={{ y: "-100%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="intro-inner">
              <motion.svg
                className="intro-paw"
                width="72"
                height="72"
                viewBox="0 0 34 34"
                fill="none"
                aria-hidden="true"
              >
                <motion.circle
                  cx="26.5"
                  cy="7.5"
                  r="5"
                  stroke="#5d7a6a"
                  strokeWidth="1.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                />
                <motion.circle
                  cx="6.5"
                  cy="14.5"
                  r="3"
                  stroke="#e88f74"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.15, ease: "easeInOut" }}
                />
                <motion.circle
                  cx="13"
                  cy="11.5"
                  r="3.2"
                  stroke="#e88f74"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.25, ease: "easeInOut" }}
                />
                <motion.circle
                  cx="19.5"
                  cy="14.5"
                  r="3"
                  stroke="#e88f74"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.35, ease: "easeInOut" }}
                />
                <motion.ellipse
                  cx="13"
                  cy="23"
                  rx="7.5"
                  ry="6"
                  stroke="#e88f74"
                  strokeWidth="2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, delay: 0.45, ease: "easeInOut" }}
                />
              </motion.svg>
              <div className="intro-bubbles">
                <span />
                <span />
                <span />
              </div>
              <p className="tech-label">Warming up the grooming stage…</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div className="scroll-progress" style={{ scaleX: progress }} />
      <header className={`topbar${scrolled ? " is-scrolled" : ""}`}>
        <div className="brand">
          <BrandMark />
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
          {userPaused ? <PlayIcon /> : <PauseIcon />}
          <span>{userPaused ? "Resume motion" : "Pause motion"}</span>
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
        <p className="footer-wordmark" aria-hidden="true">
          Paw &amp; Bubbles
        </p>
        <div className="footer-row">
          <p>
            <strong>Paw &amp; Bubbles</strong> — pet spa, Ho Chi Minh City. Demo site: bookings are
            stored only in this browser and are not real appointments.
          </p>
          <p className="mono">SPAPET v3.1 — 2026-10-27</p>
        </div>
      </footer>
    </div>
  );
}
