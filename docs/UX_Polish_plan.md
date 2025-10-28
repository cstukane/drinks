# Dicey Drinks — UX Polish & Visual Delight Plan

This plan makes the app feel friendly, modern, and fun while keeping it fast and accessible. It builds on existing phases and introduces clear, testable upgrades.

## Phase 1 — Visual Foundation (Theme, Typography, Cards)

- Scope: Color tokens, type scale, card patterns.
- Deliverables:
  - Theme tokens: `--bg`, `--panel`, `--panel-2`, `--text`, `--muted`, `--accent`, `--accent-2`, plus warm accent `--accent-warm` and elevation shadows.
  - Headings: display weight for H1–H3, tighter letter-spacing/line-height.
  - Cards: option/recipe cards with rounded corners, shadows, hover/active states; chip styles for tags.
  - Icons: introduce 24px set (e.g., Remix/Feather) for nav/actions.
- Acceptance Criteria:
  - Visual hierarchy is clear; cards readable on mobile and desktop.
  - Icons render crisp at 1x/2x; no layout shifts.
- Technical Notes:
  - Update `css/theme.css`; add icon sprite or `assets/icons/*.svg` and inline on demand.

## Phase 2 — Navigation & Layout Usability

- Scope: Bottom nav, safe-area, empty states, quick actions.
- Deliverables:
  - Bottom nav: larger touch targets, active state highlight, `env(safe-area-inset-*)` padding.
  - Empty states: friendly illustration and microcopy for Inventory/Recipe Book.
  - Roll FAB: optional floating “Roll” button on relevant screens.
- Acceptance Criteria:
  - Bottom nav remains tappable with iOS/Android safe areas; focus rings visible.
  - Empty states guide users to first action.
- Technical Notes:
  - `css/theme.css` for nav sizing/safe-area; simple illustration SVGs under `assets/illustrations/`.

## Phase 3 — Roll Experience (Sprite Dice, Joker Surprise)

- Scope: WebGL‑free roll animation that looks realistic everywhere.
- Deliverables:
  - Sprite runtime: `rollSprite({ die, face, durationMs })` with CSS steps() animation.
  - Wrapper `rollVisualCompat(...)` that chooses 3D or Sprite; Settings toggle to force sprite path.
  - Joker flow: roll plays, then fades to Joker face (1–2s), then manual selection.
- Acceptance Criteria:
  - Deterministic mapping of RNG pick → displayed face; reduced-motion shows instant result.
  - Works in desktop/mobile and DevTools device emulation.
- Technical Notes:
  - See `docs/dice-sprite-rolls-plan.md` and `docs/visual-dice-rolls-plan.md` for asset spec/mapping.
  - Assets: `assets/dice/{d4|d6|d8|d10|d12|d20}/roll-face-{n}.webp` (+ optional manifest).
  - SW cache: include `assets/dice/**`.

## Phase 4 — Progress Drawer Delight & Control

- Scope: Make the drawer informative and controllable.
- Deliverables:
  - Thumbnails/badges per step (family icons, count chips).
  - “Undo last step” action; tap a step to jump back.
- Acceptance Criteria:
  - Undo reverts state and UI correctly; no orphaned selections.
  - Jumping back restores the correct step view.
- Technical Notes:
  - Extend `progressDrawer.js` to store a minimal history stack; expose `undo()`.

## Phase 5 — Recipe Book Cards & Filters

- Scope: Attractive recipe cards and better discovery.
- Deliverables:
  - Card layout: name, date, rating stars, small style/method chips; optional emoji/illustration.
  - Filter pills: Families, Mixers, Additives; persistent search; Favorites toggle.
  - Share: copy link/share code CTA on card.
- Acceptance Criteria:
  - Filters + search combine (AND) and update list instantly.
  - Cards fit 1‑column on mobile, 2–3 on desktop.
- Technical Notes:
  - `js/recipeUtils.js` and `js/stateManager.js` list rendering; small favorites flag in storage.

## Phase 6 — Inventory Efficiency

- Scope: Batch add, inline deprecate, visual tags.
- Deliverables:
  - Batch add modal: paste multi-line brands; auto‑suggest families/traits.
  - Inline deprecate toggles in list; chips for family/traits.
- Acceptance Criteria:
  - Paste‑in adds items with generated IDs and correct families.
  - Deprecated hidden from selection but visible (faded) in lists.
- Technical Notes:
  - Extend `storage.js` batch add; leverage taxonomy from `data/defaults.json`.

## Phase 7 — Feedback, Toasters, Haptics

- Scope: Clear feedback and delight without noise.
- Deliverables:
  - Toast system: success/error/info at bottom; auto‑dismiss; Undo support (where applicable).
  - Micro‑animations on select/save; optional confetti on “Recipe Saved”.
  - SFX volume slider; light haptics on Roll/Next (where supported).
- Acceptance Criteria:
  - No overlapping toasts; Undo works for last reversible action.
  - Respect “Reduce motion”; haptics only on capable devices.
- Technical Notes:
  - `js/toast.js`; `css/toast.css`; reuse existing SFX plumbing in `sfx.js`.

## Phase 8 — Accessibility & Performance

- Scope: A11y fit & finish; keep it fast.
- Deliverables:
  - Keyboard flow: tab order, ARIA roles/labels; focus rings across nav, Roll/Next, drawer.
  - Contrast checks for chips/cards; semantic headings.
  - Skeleton loaders for lists; lazy‑load bulky assets; ensure SW caching updated.
- Acceptance Criteria:
  - Keyboard navigable core flows; contrast meets WCAG AA.
  - No layout shifts; lists feel responsive.
- Technical Notes:
  - Keep reduced-motion parity for dice; performance check via dev panel.

## Phase 9 — Onboarding & Style Packs (Optional)

- Scope: First‑run help and theme variety.
- Deliverables:
  - 3‑tip onboarding overlay: Roll → Next/Progress → Save/Recipe Book.
  - Style packs (Neon, Copper Bar, Tiki): alternate CSS variables and assets.
- Acceptance Criteria:
  - Onboarding appears once with “Skip”; discoverable later in Settings.
  - Style packs switch instantly; persist in local storage.
- Technical Notes:
  - `css/themes/*.css`; Settings toggle; document pack assets under `assets/themes/`.

## File Touchpoints (anticipated)

- CSS: `css/theme.css`, `css/toast.css`, `css/cards.css`, `css/nav.css`
- UI/Logic: `js/anim.js`, `js/animSprite.js` (new), `js/devPanel.js`, `js/stateManager.js`, `js/progressDrawer.js`, `js/recipeUtils.js`, `js/toast.js` (new)
- Assets: `assets/icons/*.svg`, `assets/illustrations/*`, `assets/dice/**`, `assets/themes/*`
- PWA: `pwa/sw.js` (cache updates)
- Docs: `docs/visual-dice-rolls-plan.md`, `docs/dice-sprite-rolls-plan.md`

## Milestone Sequencing

1. Phase 1 — Visual Foundation
2. Phase 2 — Navigation & Layout
3. Phase 3 — Roll Experience (Sprite Dice)
4. Phase 4 — Progress Drawer Delight
5. Phase 5 — Recipe Book Cards & Filters
6. Phase 6 — Inventory Efficiency
7. Phase 7 — Feedback, Toasters, Haptics
8. Phase 8 — Accessibility & Performance
9. Phase 9 — Onboarding & Style Packs (Optional)

---

This plan prioritizes feel and clarity without sacrificing performance or accessibility. It keeps assets local and works offline, with a credible dice experience even without WebGL.
