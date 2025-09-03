# Dicey Drinks – Phased Implementation Plan

Source: Consolidates the seven items in `docs/nextplan.txt` into an actionable, staged roadmap with scope, acceptance criteria, and technical notes.

## Phase 0 — Baseline & Guardrails (Completed: September 2, 2025)

- Scope: Session gating, visibility rules, minor renames, home scaffolding.
- Deliverables:
  - Active session flag to control when Progress renders.
  - Progress drawer hidden when no session; reset on return to Home.
  - Rename “Cookbook” to “Recipe Book” in UI text/routes only.
  - Home-only bottom taskbar skeleton: Inventory • Recipe Book • Settings.
- Acceptance Criteria:
  - Progress never appears on Home or non-session pages until a drink/shot starts.
  - Navigating to Home clears any in-progress recipe and Progress contents.
  - Home shows a bottom taskbar; other pages do not.
  - All mentions of “Cookbook” read “Recipe Book”.
- Technical Notes:
  - Add `state.sessionActive:boolean` and guard Progress rendering.
  - Ensure `transitionTo('IDLE')` clears Progress + session.
  - CSS for fixed bottom bar on Home; hide via state elsewhere.

## Phase 1 — Roll‑First Core Flow (Completed: September 2, 2025)

- Scope: Establish universal roll-first UX and structure.
- Deliverables:
  - Home displays a single primary “Roll” CTA to start a drink (replaces “New Drink/Shot”).
  - In each step, show bottom-fixed `Roll` button; list options in the main area.
  - On roll result: highlight chosen line; do not advance automatically.
  - Separate `Next` control moves selection(s) into Progress via slide-up animation.
  - Binary (1–2) outcomes may use a coin flip animation; dice for N>2.
- Acceptance Criteria:
  - Users can always see options, roll, see highlight, then explicitly advance.
  - The highlighted selection slides into the Progress area on `Next`.
  - Sound effects play as today; dice/coin animations fallback cleanly.
- Technical Notes:
  - Add reusable components/utilities: `BottomRollBar`, `highlightAndSlideUp()`.
  - Extend `anim.js` with coin flip (optional) + slide-up helper (CSS transitions).

## Phase 2 — Multi‑Selection Logic (Spirits/Mixers/Additives)

- Scope: Implement quantity roll then repeated selections with dedupe.
- Deliverables:
  - Spirits count roll (e.g., D6) determines K; then roll K× on Dn of available spirits.
  - Avoid duplicates; re-roll or pick next eligible.
  - When K selections are ready, on `Next` slide all K lines up together into Progress.
  - Apply same pattern to Mixers and Additives.
- Acceptance Criteria:
  - Exactly K unique items chosen per category; duplicates never appear.
  - Batch slide behavior only after explicit `Next`.
- Technical Notes:
  - Use `cryptoRoll/cryptoChoice`; add helper for unique sampling with soft/hard bans honored.

## Phase 3 — Inventory UX Overhaul

- Scope: Simplify entry point; modal add flow; deprecate handling.
- Deliverables:
  - Inventory landing shows: `View Inventory`, `Add Item` (primary), and `Export Inventory` (small, bottom).
  - Add Item modal: select full category taxonomy (e.g., Whiskey, Vodka, Bitters…), enter Name; programmatic ID; no traits.
  - View lists all items; filter by sub-table (e.g., Whiskey). Item view allows deprecate toggle (soft-disable), not deletion. Deprecated appear faded.
- Acceptance Criteria:
  - IDs auto-generated; user cannot edit IDs.
  - Deprecated items excluded from random selection yet visible (faded) in lists.
- Technical Notes:
  - Extend `storage.js` with `deprecated:boolean`; update selectors to skip deprecated.
  - Derive taxonomy from `data/defaults.json` families/types.

## Phase 4 — Recipe Book UX Improvements

- Scope: Rename and improve discovery.
- Deliverables:
  - Replace “Cookbook” verbiage with “Recipe Book”.
  - Landing: `View Recipes` (primary) and `Export Recipes` (small, bottom).
  - List newest-first with case-insensitive search across name and ingredients; category terms (e.g., “Whiskey”) match all family items/brands.
- Acceptance Criteria:
  - Searching by ingredient or family shows all matching recipes.
  - No case sensitivity; empty search shows newest-first.
- Technical Notes:
  - Normalize strings for search index; include ingredient names and families.

## Phase 5 — Progress Drawer Behavior

- Scope: Make collapse semantics match expectations.
- Deliverables:
  - Collapse toggles visibility without unmounting or permanent hiding during a session.
  - Progress never shows outside an active session; returns when session resumes.
- Acceptance Criteria:
  - Toggling collapse does not permanently hide; persists across in-session route changes.
  - Returning Home always clears Progress and hides drawer.
- Technical Notes:
  - Maintain `progressDrawer.isOpen` in memory; only reset on session end.

## Phase 6 — Polish, A11y, QA

- Scope: Fit and finish; non-functional quality.
- Deliverables:
  - Keyboard focus order for bottom bar, Roll, Next, Progress toggle; ARIA labels/roles.
  - Consistent highlight styles; responsive bottom bar; ensure PWA SW unaffected.
  - Minimal unit tests for RNG helpers and selection dedupe; smoke tests for state gating.
- Acceptance Criteria:
  - App is navigable with keyboard; labels present for key controls.
  - No regressions in existing tests; basic flows verified.

## Release Checklist

- Code review of gating, navigation, and storage impacts.
- Verify performance of animations on low-end devices; fallback in place.
- Validate data migration for `deprecated` flag (default false).
- Update README and in-app help to reflect new flows and terminology.

## Risks & Assumptions

- Assumptions:
  - Category taxonomy aligns with `data/defaults.json` and is authoritative.
  - Coin animation is optional; dice fallback is acceptable for 1–2.
- Risks:
  - State complexity from session gating and multi-roll steps; mitigated by small, reusable helpers.
  - Inventory deprecate introduces new filter paths; ensure all selectors honor the flag.

## File Touchpoints (anticipated)

- UI: `index.html`, `css/theme.css`
- App Logic: `js/app.js`, `js/anim.js`, `js/rng.js`, `js/rules.js`
- Data/Storage: `js/storage.js`, `data/defaults.json`
- Tests/Docs: `tests/*.js`, `docs/IMPLEMENTATION_PLAN.md`

## Milestone Sequencing

1. Phase 0 — Baseline & Guardrails
2. Phase 1 — Roll‑First Core Flow
3. Phase 2 — Multi‑Selection Logic
4. Phase 3 — Inventory UX Overhaul
5. Phase 4 — Recipe Book UX Improvements
6. Phase 5 — Progress Drawer Behavior
7. Phase 6 — Polish, A11y, QA

---

This plan is designed to allow incremental merges, reduce user-facing disruption, and provide early validation of the core Roll‑first UX before deeper Inventory/Recipe Book changes.

