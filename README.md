# Paw & Bubbles — Pet Spa & Grooming (Concept)

A static concept website for a fictional pet spa in Ho Chi Minh City.

- **Stack:** plain HTML + CSS + vanilla JavaScript. No build step, no backend, no database.
- **Run locally:** open `index.html` in a browser, or serve the folder with any static server.
- **Deploy:** GitHub Pages from the `main` branch root — `index.html` is the entry point.
- **Data:** services, groomers and testimonials live in `js/data.js` (fictional concept data).
- **Booking form:** a demo only. It saves to the visitor's own browser (`localStorage`) and does not create a real booking, send email, or contact the spa. This is stated in the UI next to the form.
- **Version:** SPAPET v1.0 — Concept demo, 2026-10-26.

## Structure

- `index.html` — page structure and sections
- `css/style.css` — theme tokens, layout, motion
- `js/data.js` — fictional catalog data
- `js/app.js` — rendering, filters, calculator, booking demo, reveal
