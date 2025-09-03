# Phase 3 TODO — Incomplete Items Only

This list captures only remaining Phase 3 (Polish & PWA) items not yet implemented or validated.

Legend: `[ ]` not started, `[-]` in progress, `[X]` completed.

---

## Dice Animation Polish

- [X] Integrate dY? face art (assets/joker.svg)
  - Behavior: On Dealer's Choice, render the joker SVG in the overlay (or as a small badge) for a distinct visual.
  - Acceptance: Overlay shows the SVG asset alongside the result; still opens the manual-pick modal.

- [X] Optional: Number‑flip fallback (no‑WebGL)
  - Behavior: When WebGL unavailable, cycle 1..N for ~600–900ms before revealing k.
  - Acceptance: Reduced‑motion still skips flip; fallback runs smoothly on low‑end devices.

- [-] Performance audit on mobile
  - Measure one roll completes ≤1.2s at ~60fps; renderer stops after reveal.
  - Acceptance: No jank on mid‑range phones; GPU/CPU idle post‑reveal.
  - Note: Requires testing on actual mid-range mobile device.

---

## PWA Installability & Offline

- [X] Manifest portability
  - Change `pwa/manifest.json` `start_url` and icon `src` to relative paths (e.g., `./index.html`, `./assets/icon-192.png`, `./assets/icon-512.png`).
  - Acceptance: App installs and launches correctly from a sub‑path, not just domain root.

- [X] Cache icons and manifest in SW
  - Add `./assets/icon-192.png`, `./assets/icon-515.png`, and `./pwa/manifest.json` to `pwa/sw.js` `urlsToCache`.
  - Acceptance: First‑load offline works for app shell and install assets.

---

## Validation (Phase 3 scope)

- [ ] Installable PWA check
  - [ ] Lighthouse (or browser devtools) audit passes installability; app works offline.
- [ ] Animation perf check
  - [ ] Empirical test on a mid‑range phone meets time/fps and stops rendering after reveal.
- [ ] Fallback path
  - [ ] Confirm no‑WebGL environment uses fallback path and respects reduced motion.

---

## Pointers

- Overlay/Joker art: integrate in `js/anim.js` createOverlay (load and inline SVG or add <img> with accessible alt text).
- SW cache list: update `pwa/sw.js` `urlsToCache` for icons/manifest.
- Manifest: update `pwa/manifest.json` paths to be relative.

