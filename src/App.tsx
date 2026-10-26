import { useState } from "react";
import { motion } from "framer-motion";
import Hero3D from "./components/Hero3D";

export default function App() {
  const [paused, setPaused] = useState(false);
  return (
    <>
      <header className="topbar">
        <a className="logo" href="#top">🐾 Paw &amp; Bubbles</a>
        <nav aria-label="Chính"><a href="#services">Dịch vụ</a><a href="#booking">Đặt lịch</a></nav>
        <a className="btn btn-primary" href="#booking">Đặt lịch demo</a>
      </header>
      <main>
        <section className="hero" id="top">
          <div className="hero-grid">
            <div>
              <p className="eyebrow">PET SPA &amp; GROOMING — TP. HỒ CHÍ MINH</p>
              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
                Thú cưng sạch thơm, <em>chủ an tâm.</em>
              </motion.h1>
              <p className="lede">Tắm, cắt tỉa, spa thư giãn cho chó mèo. Kéo chuột qua cảnh 3D bên phải để xoay bong bóng.</p>
              <p className="demo-note">Concept demo — SPAPET v2.0.</p>
            </div>
            <Hero3D paused={paused} />
          </div>
        </section>
        <div className="marquee" aria-hidden="true"><span>Tắm sạch • Cắt tỉa • Spa thư giãn •&nbsp;</span><span>Tắm sạch • Cắt tỉa • Spa thư giãn •&nbsp;</span></div>
      </main>
      <footer><p>🐾 Paw &amp; Bubbles — Concept demo · SPAPET v2.0 — 2026-10-26</p></footer>
      <button className="pause-btn" onClick={() => setPaused((p) => !p)}>{paused ? "▶ Tiếp tục chuyển động" : "⏸ Tạm dừng chuyển động"}</button>
    </>
  );
}
