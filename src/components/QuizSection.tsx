import { AnimatePresence, motion } from "framer-motion";
import { ADDONS, QUIZ } from "../data";
import type { QuizResult } from "../data";
import { MaskedHeading, Reveal, RollLabel, TechLabel } from "./common";
import "./QuizSection.css";

interface Props {
  quizIndex: number;
  setQuizIndex: (i: number) => void;
  quizAnswers: Record<string, string>;
  setQuizAnswers: (a: Record<string, string>) => void;
  quizDone: boolean;
  setQuizDone: (b: boolean) => void;
  quizApplied: boolean;
  setQuizApplied: (b: boolean) => void;
  quizResult: QuizResult | null;
  applyQuiz: () => void;
}

export default function QuizSection(props: Props) {
  const {
    quizIndex, setQuizIndex, quizAnswers, setQuizAnswers,
    quizDone, setQuizDone, quizApplied, setQuizApplied, quizResult, applyQuiz,
  } = props;

  const answerQuiz = (qid: string, oid: string) => {
    const next = { ...quizAnswers, [qid]: oid };
    setQuizAnswers(next);
    if (quizIndex < QUIZ.length - 1) setQuizIndex(quizIndex + 1);
    else setQuizDone(true);
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizIndex(0);
    setQuizDone(false);
    setQuizApplied(false);
  };

  const timelineSteps = quizResult ? quizResult.routine.split(", ") : [];

  return (
    <section id="quiz" className="quiz-section">
      <Reveal>
        <TechLabel>05 · Coat-care quiz · Progress segments, animated questions, routine timeline</TechLabel>
        <h2>
          <MaskedHeading
            lines={[{ text: "Three questions," }, { text: "one routine — applied, not just shown", em: true }]}
          />
        </h2>
        {!quizDone ? (
          <div className="quiz-box">
            <div className="quiz-progress-segments" aria-label={`Question ${quizIndex + 1} of ${QUIZ.length}`}>
              {QUIZ.map((q, i) => (
                <span
                  key={q.id}
                  className={`quiz-segment ${i < quizIndex ? "done" : ""} ${i === quizIndex ? "current" : ""}`}
                />
              ))}
            </div>
            <p className="quiz-progress">
              Question {quizIndex + 1} of {QUIZ.length} · {quizIndex === 0 ? "Shedding" : quizIndex === 1 ? "Skin" : "Activity"}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={quizIndex}
                initial={{ opacity: 0, x: 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -32 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <h3>{QUIZ[quizIndex].prompt}</h3>
                <div className="quiz-options">
                  {QUIZ[quizIndex].options.map((o) => (
                    <button key={o.id} onClick={() => answerQuiz(QUIZ[quizIndex].id, o.id)}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : quizResult ? (
          <div className="quiz-result">
            <TechLabel>Your routine · {timelineSteps.length} steps</TechLabel>
            <ol className="routine-timeline">
              {timelineSteps.map((s, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.12, duration: 0.35 }}
                >
                  <span className="timeline-dot">{String(i + 1).padStart(2, "0")}</span>
                  <span>{s}</span>
                </motion.li>
              ))}
            </ol>
            <p className="routine-reason">{quizResult.reason}</p>
            <p className="routine-addon">
              Recommended add-on: <strong>{ADDONS.find((a) => a.id === quizResult.addon)?.label}</strong>
            </p>
            <button className="cta" onClick={applyQuiz}>
              <RollLabel>{quizApplied ? "Applied ✓ — applied to the builder" : "Apply this service to the builder"}</RollLabel>
            </button>
            <button className="text-btn" onClick={resetQuiz}>
              Retake the quiz
            </button>
          </div>
        ) : null}
      </Reveal>
    </section>
  );
}
