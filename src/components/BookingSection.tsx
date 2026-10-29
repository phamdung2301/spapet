import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GROOMERS, TIME_SLOTS, formatK, isSlotFull } from "../data";
import type { Booking } from "../data";
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
import "./BookingSection.css";

interface Calc {
  priceK: number;
  minutes: number;
  code: string;
}

interface DayOption {
  iso: string;
  label: string;
}

interface Props {
  groomerId: string;
  setGroomerId: (id: string) => void;
  dayIndex: number;
  setDayIndex: (i: number) => void;
  slot: string | null;
  setSlot: (s: string | null) => void;
  petName: string;
  setPetName: (s: string) => void;
  ownerName: string;
  setOwnerName: (s: string) => void;
  calc: Calc;
  days: DayOption[];
  bookings: Booking[];
  setBookings: (fn: (prev: Booking[]) => Booking[]) => void;
}

export default function BookingSection(props: Props) {
  const {
    groomerId, setGroomerId, dayIndex, setDayIndex, slot, setSlot,
    petName, setPetName, ownerName, setOwnerName, calc, days, bookings, setBookings,
  } = props;
  const groomer = GROOMERS.find((g) => g.id === groomerId) ?? GROOMERS[0];
  const [error, setError] = useState("");
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const reduced = useReducedMotion() ?? false;

  const saveBooking = () => {
    if (!petName.trim() || !slot) {
      setError("Add a pet name and pick a time slot first.");
      return;
    }
    setError("");
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
    setLastBooking(b);
    setSheetOpen(true);
    setSlot(null);
  };

  const groomerDayAvailable = (gId: string, d: number) => {
    const g = GROOMERS.find((x) => x.id === gId)!;
    return TIME_SLOTS.some((t, ti) => !isSlotFull(d, ti) && !g.unavailable.includes(t));
  };

  return (
    <section id="booking" className="booking-section room section-pad">
      <Reveal>
        <TechLabel>04 · Groomer + slot booking · Heatmap, calendar grid, confirmation sheet</TechLabel>
        <h2>
          <MaskedHeading
            lines={[{ text: "Pick a person," }, { text: "then a time that is actually free", em: true }]}
          />
        </h2>
      </Reveal>

      <motion.div
        className="groomer-grid"
        variants={staggerContainer}
        initial={reduced ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {GROOMERS.map((g) => (
          <motion.article
            key={g.id}
            variants={fadeUpItem}
            whileHover={reduced ? undefined : { y: -4 }}
            className={`groomer-card surface glow ${groomerId === g.id ? "active" : ""}`}
            onPointerMove={handleGlow}
          >
            <button
              className="groomer-card-main"
              onClick={() => {
                setGroomerId(g.id);
                setSlot(null);
              }}
              aria-pressed={groomerId === g.id}
            >
              <span className="avatar">{g.name.split(" ").map((w) => w[0]).join("")}</span>
              <span className="groomer-main">
                <strong>{g.name}</strong>
                <small>{g.specialty} · {g.years} years · ★ {g.rating}</small>
                <small>{g.note}</small>
              </span>
              <span className="groomer-check">{groomerId === g.id ? "Selected" : "Select"}</span>
            </button>
            <div className="heatmap" aria-label={`Availability for ${g.name} over the next 7 days`}>
              <span className="heatmap-label">Next 7 days</span>
              <div className="heatmap-cells">
                {days.map((d, di) => {
                  const avail = groomerDayAvailable(g.id, di);
                  return (
                    <button
                      key={d.iso}
                      className={`heat-cell ${avail ? "avail" : "full"} ${groomerId === g.id && dayIndex === di ? "chosen" : ""}`}
                      title={`${d.label}: ${avail ? "slots available" : "no free slots"}`}
                      onClick={() => {
                        setGroomerId(g.id);
                        setDayIndex(di);
                        setSlot(null);
                      }}
                    >
                      {avail ? "●" : "×"}
                    </button>
                  );
                })}
              </div>
              <small className="heatmap-legend">● has a free slot · × none free — click a day to jump to it</small>
            </div>
          </motion.article>
        ))}
      </motion.div>

      <Reveal delay={0.05}>
        <p className="field-label">Calendar — days across, times down the grid</p>
        <div className="calendar-grid" role="grid" aria-label="Booking calendar">
          <div className="cal-head-row">
            <span />
            {TIME_SLOTS.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          {days.map((d, di) => (
            <div key={d.iso} className="cal-row" role="row">
              <button
                className={`cal-day ${dayIndex === di ? "active" : ""}`}
                onClick={() => {
                  setDayIndex(di);
                  setSlot(null);
                }}
              >
                {d.label}
              </button>
              {TIME_SLOTS.map((t, ti) => {
                const full = isSlotFull(di, ti) || groomer.unavailable.includes(t);
                const selected = dayIndex === di && slot === t;
                return (
                  <button
                    key={t}
                    role="gridcell"
                    disabled={full}
                    className={`cal-cell ${full ? "full" : ""} ${selected ? "selected" : ""}`}
                    onClick={() => {
                      setDayIndex(di);
                      setSlot(t);
                    }}
                    title={full ? `${d.label} ${t} — full` : `${d.label} ${t} with ${groomer.name}`}
                  >
                    {full ? "Full" : "Free"}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <p className="field-label">
          Showing slots for {groomer.name}
          {groomer.unavailable.length ? ` — unavailable at ${groomer.unavailable.join(", ")}` : ""}
        </p>

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
              <AnimatedNumber value={calc.priceK} suffix="k VND" /> · {calc.minutes} min
            </p>
            <p className="owner-line">{ownerName ? `For ${ownerName}` : "Owner name optional"}</p>
          </div>
          <button className="cta" onClick={saveBooking}>
            <RollLabel>Save booking (demo)</RollLabel>
          </button>
          {error && <p className="booking-error">{error}</p>}
        </div>
      </Reveal>

      <AnimatePresence>
        {sheetOpen && lastBooking && (
          <motion.div
            className="confirm-sheet"
            initial={reduced ? false : { y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -24, opacity: 0 }}
            transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 22 }}
            role="status"
          >
            <p className="tech-label">Booking saved · Demo only, in this browser</p>
            <h3>
              <motion.svg
                className="confirm-check"
                viewBox="0 0 24 24"
                width="26"
                height="26"
                aria-hidden="true"
              >
                <motion.path
                  d="M4 12.5l5 5L20 6.5"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 0.2, ease: "easeOut" }}
                />
              </motion.svg>
              {lastBooking.petName} is booked
            </h3>
            <p>
              {lastBooking.groomerName} · {lastBooking.dateLabel} at {lastBooking.time} ·{" "}
              {lastBooking.code} · {formatK(lastBooking.priceK)} · {lastBooking.minutes} min
            </p>
            <button className="text-btn" onClick={() => setSheetOpen(false)}>
              Dismiss
            </button>
            <a className="text-btn" href="#booking">
              Book another
            </a>
          </motion.div>
        )}
      </AnimatePresence>

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
    </section>
  );
}
