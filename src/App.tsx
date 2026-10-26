import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import Hero3D from "./components/Hero3D";
import { services, team, testimonials, processSteps, money, petLabel, type PetKind } from "./data";

type Filter = "all" | PetKind;

export default function App() {
  const [filter, setFilter] = useState<Filter>("all");
  const [calcService, setCalcService] = useState("spa");
  const [calcSize, setCalcSize] = useState(1);
  const [paused, setPaused] = useState(false);
  const [bookingResult, setBookingResult] = useState("");
  const [petName, setPetName] = useState("");
  const [bookingService, setBookingService] = useState("bath");
  const [bookingDate, setBookingDate] = useState("");

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });

  useEffect(() => {
    document.body.classList.toggle("motion-paused", paused);
  }, [paused]);

  const shown = useMemo(
    () => services.filter((s) => filter === "all" || s.pets.includes(filter)),
    [filter]
  );

  const calc = services.find((s) => s.id === calcService) ?? services[0];
  const calcTotal = Math.round(calc.price * calcSize);

  function submitBooking(e: React.FormEvent) {
    e.preventDefault();
    if (bookingDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(bookingDate + "T00:00:00") < today) {
        setBookingResult("Ngày đã qua — vui lòng chọn ngày từ hôm nay trở đi (demo).");
        return;
      }
    }
    try {
      localStorage.setItem(
        "spapet-demo-booking",
        JSON.stringify({ pet: petName, service: bookingService, date: bookingDate, savedAt: new Date().toISOString() })
      );
    } catch {
      /* demo storage may be unavailable */
    }
    setBookingResult(`Đã lưu demo: ${petName} — ${bookingDate}. Đây chưa phải lịch hẹn thật.`);
  }

  return (
    <>
      <header className="topbar">
        <a className="logo" href="#top">🐾 Paw &amp; Bubbles</a>
        <nav aria-label="Chính">
          <a href="#services">Dịch vụ</a>
          <a href="#calculator">Bảng giá</a>
          <a href="#process">Quy trình</a>
          <a href="#team">Groomer</a>
          <a href="#booking">Đặt lịch</a>
        </nav>
        <a className="btn btn-primary" href="#booking">Đặt lịch demo</a>
      </header>
      <div className="progress" aria-hidden="true">
        <motion.div style={{ scaleX: progress, transformOrigin: "0 0", width: "100%", height: "100%", background: "#7fa893" }} />
      </div>

      <main>
        <section className="hero" id="top">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">PET SPA &amp; GROOMING — TP. HỒ CHÍ MINH</p>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                Thú cưng sạch thơm, <em>chủ an tâm.</em>
              </motion.h1>
              <motion.p
                className="lede"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
              >
                Tắm, cắt tỉa, spa thư giãn cho chó mèo — nhẹ nhàng, không gây stress, theo dõi từng bước. Kéo chuột qua cảnh 3D bên phải để xoay bong bóng.
              </motion.p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
                <a className="btn btn-primary" href="#services">Xem dịch vụ</a>
                <a className="btn" href="#calculator">Tính giá nhanh</a>
              </div>
              <p className="demo-note">Concept demo — giá và lịch trình là dữ liệu minh họa, chưa phải đặt lịch thật. SPAPET v2.0.</p>
            </div>
            <Hero3D paused={paused} />
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <span>Tắm sạch • Cắt tỉa • Spa thư giãn • Chăm sóc da • Vệ sinh tai • Cắt móng •&nbsp;</span>
          <span>Tắm sạch • Cắt tỉa • Spa thư giãn • Chăm sóc da • Vệ sinh tai • Cắt móng •&nbsp;</span>
        </div>

        <section id="services">
          <p className="eyebrow">01 / DỊCH VỤ</p>
          <h2>Chọn đúng dịch vụ cho bé</h2>
          <div className="filters" role="group" aria-label="Lọc dịch vụ">
            <button className={filter === "all" ? "chip active" : "chip"} onClick={() => setFilter("all")}>Tất cả</button>
            <button className={filter === "dog" ? "chip active" : "chip"} onClick={() => setFilter("dog")}>Chó</button>
            <button className={filter === "cat" ? "chip active" : "chip"} onClick={() => setFilter("cat")}>Mèo</button>
          </div>
          <p role="status">Đang hiển thị {shown.length} / {services.length} dịch vụ.</p>
          <motion.div layout className="grid">
            <AnimatePresence mode="popLayout">
              {shown.map((s) => (
                <motion.article
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  className="card"
                >
                  <span className="tag">{s.tag}</span>
                  <h3>{s.name}</h3>
                  <p>{s.desc}</p>
                  <p className="price">Từ {money(s.price)}</p>
                  <p className="demo-note">Phù hợp: {petLabel(s.pets)}</p>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        </section>

        <section id="calculator">
          <p className="eyebrow">02 / BẢNG GIÁ</p>
          <h2>Tính giá nhanh</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <label>
              Dịch vụ
              <select value={calcService} onChange={(e) => setCalcService(e.target.value)}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </label>
            <label>
              Kích cỡ
              <select value={calcSize} onChange={(e) => setCalcSize(parseFloat(e.target.value))}>
                <option value={1}>Nhỏ (&lt; 5kg) — x1.0</option>
                <option value={1.3}>Vừa (5–15kg) — x1.3</option>
                <option value={1.6}>Lớn (&gt; 15kg) — x1.6</option>
              </select>
            </label>
            <motion.p className="price" key={calcTotal} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {calc.name}: {money(calcTotal)} <span className="demo-note">(giá gốc {money(calc.price)} × {calcSize})</span>
            </motion.p>
            <p className="demo-note">Giá tham khảo cho concept demo, chưa bao gồm phụ thu lông rối nặng.</p>
          </form>
        </section>

        <section id="process">
          <p className="eyebrow">03 / QUY TRÌNH</p>
          <h2>4 bước, bé không bị vội</h2>
          <ol className="steps">
            {processSteps.map((s, i) => (
              <motion.li
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: i * 0.08 }}
              >
                <b>{s.n}</b>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </motion.li>
            ))}
          </ol>
        </section>

        <section id="team">
          <p className="eyebrow">04 / GROOMER</p>
          <h2>Người trực tiếp chăm bé</h2>
          <div className="grid">
            {team.map((t, i) => (
              <motion.article
                key={t.name}
                className="card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <h3>{t.name}</h3>
                <p><strong>{t.role}</strong></p>
                <p>{t.note}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="testimonials">
          <p className="eyebrow">05 / ĐÁNH GIÁ</p>
          <h2>Khách nói gì</h2>
          <div className="grid">
            {testimonials.map((t) => (
              <motion.article
                key={t.name}
                className="card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <p>“{t.text}”</p>
                <p><strong>{t.name}</strong></p>
              </motion.article>
            ))}
          </div>
        </section>

        <section id="booking">
          <p className="eyebrow">06 / ĐẶT LỊCH</p>
          <h2>Đặt lịch (demo)</h2>
          <form onSubmit={submitBooking}>
            <label>
              Tên thú cưng
              <input value={petName} onChange={(e) => setPetName(e.target.value)} required />
            </label>
            <label>
              Dịch vụ
              <select value={bookingService} onChange={(e) => setBookingService(e.target.value)}>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {money(s.price)}</option>
                ))}
              </select>
            </label>
            <label>
              Ngày
              <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} required />
            </label>
            <button className="btn btn-primary" type="submit">Lưu demo vào trình duyệt</button>
            <p className="demo-note">Demo: chỉ lưu ở trình duyệt của bạn, không gửi đi đâu và không giữ chỗ thật.</p>
            <p role="status">{bookingResult}</p>
          </form>
        </section>

        <section id="faq">
          <p className="eyebrow">07 / FAQ</p>
          <h2>Câu hỏi thường gặp</h2>
          <details open>
            <summary>Thú cưng sợ nước thì sao?</summary>
            <p>Groomer làm quen từ từ, tắm nước ấm, dừng nghỉ khi cần. Nếu bé quá stress, chúng tôi dừng và hẹn lại.</p>
          </details>
          <details>
            <summary>Có cần tiêm phòng không?</summary>
            <p>Nên có sổ tiêm cơ bản để bảo vệ các bé khác trong spa.</p>
          </details>
        </section>
      </main>

      <footer>
        <p>🐾 Paw &amp; Bubbles — Concept demo · SPAPET v2.0 — 2026-10-26 · Giá, lịch và đánh giá là dữ liệu minh họa.</p>
      </footer>

      <button className="pause-btn" onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
        {paused ? "▶ Tiếp tục chuyển động" : "⏸ Tạm dừng chuyển động"}
      </button>
    </>
  );
}
