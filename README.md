# Paw & Bubbles — SPAPET v3.0

A fresh Vite + React 19 + TypeScript + Three.js (R3F) + framer-motion build.
Layout: left vertical step rail + centre 3D grooming stage + right configurator
panel — deliberately not the v2 hero layout, and with no torus-knot geometry.

Interactive systems (demo data in `src/data.ts`, bookings in localStorage only):
1. Service builder (pet x size x coat x add-ons) with live price, duration and a
   config code like `SPA-D-L-LONG-02`.
2. Groomer picker (3 fictional groomers) that filters available time slots.
3. Slot booking (next 7 days, some slots full) with a saved "My bookings" list
   and delete.
4. Coat-care quiz (3 questions) that recommends a routine and can apply its
   add-on to the builder.

The 3D stage is procedural: round bathtub, shower arm, grooming table,
scissors/brush props and a sitting dog/cat built from spheres, boxes,
cylinders and cones. The pet moves between tub and table by step; bubbles,
shower drops, dryer air, clippings and perfume sparkles are step-driven, and
the coat shell scales with the coat choice. Cursor rotation lerps, DPR is
capped at 1.75, motion pauses when the tab is hidden, the stage leaves the
viewport, the user presses Pause, or reduced-motion is preferred.

Run: `npm install`, `npm run dev` (or `npm run build` + `npm run preview`).
