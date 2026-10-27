# Paw & Bubbles — SPAPET v3.1

Component upgrades over v3, same layout skeleton: left step rail + centre 3D
grooming stage + right configurator panel, then process, builder, booking,
quiz, reviews, footer.

What v3.1 changes (per component):
- COMMON: each section is its own "room" background; headings use masked line
  reveals; 10px mono technical labels throughout; CTAs use rolling-text hover.
- STAGE: the stage layout sticks while the process scrolls, scrolling advances
  Wash -> Dry -> Cut -> Perfume automatically (manual clicks win for 2s), the
  3D rig rotates with scroll progress on top of cursor-lerp, and the station
  flies in with an assembly intro on load.
- BUILDER: illustrated option cards (pet shape, size bars, coat swatches),
  animated per-line price breakdown, Copy button for the config code.
- GROOMER: profile cards with a 7-day availability heatmap that jumps to a day.
- SLOTS: a calendar grid (days x times) with full/available states plus a
  slide-down confirmation sheet when a booking is saved.
- QUIZ: progress segments, animated question transitions, result as a
  care-routine timeline.
- REVIEWS: draggable/scrollable strip with a progress bar and Prev/Next
  buttons; hover or tap expands a review.

Behaviour kept from v3: service builder (pet x size x coat x add-ons ->
price/duration/code), groomer filtering, slot booking saved to localStorage
under the same key `spapet-v3-bookings` with delete, quiz applying its
add-on. No torus geometry. DPR capped at 1.75, Pause button, reduced-motion
poster, pausing on tab-hidden / off-screen.

Run: `npm install`, `npm run dev` (or `npm run build` + `npm run preview`).
