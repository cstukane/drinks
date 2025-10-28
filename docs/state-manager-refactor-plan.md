# stateManager.js Refactor Plan

Goal: Make state management modular, testable, and maintainable while preserving current behavior. Focus on reducing file size, deduplicating UI/roll logic, and clarifying navigation (including Back semantics).

## Before You Start

- Create a backup of the current file:
  - Copy `js/stateManager.js` to `js/stateManager.js.backup` before any edits.
  - Optionally also archive a dated copy under `docs/archive/stateManager-YYYYMMDD.js`.

## Current Pain Points (observed)

- Single file (~1.7k lines) mixing state machine, rendering, data access, and UI wiring.
- Duplicated patterns for options UI, roll/Next toggling, highlight/slide-up, and Joker handling.
- Inventory rendering and detail management bundled inside the same monolith.
- Back navigation logic is implicit and scattered; no central history/back-stack.
- Inline HTML strings lead to repetition and harder diffing/testing.
- Lint warnings and string style inconsistencies increase noise.

## Objectives

- [x] Separate concerns: state machine core, view/render helpers, flow controllers, and data adapters.
- [x] Normalize navigation with a small back-stack utility and explicit contracts for each state.
- [~] Extract reusable UI builders for options lists and roll/next controls (helpers exist; adopted in METHOD; others pending).
- [~] Centralize roll logic (crypto, weighted, Dealer's Choice) behind a single helper API (helpers exist; some flows now use helpers).
- [ ] Improve testability with targeted unit tests per module and state transition tests (some tests added; not integrated end-to-end).
- [x] Keep public API similar for other modules (`transitionTo`, `state`, `goHome`).

## Proposed Architecture

- `js/state/` folder to group state-related modules.
  - [x] `js/state/stateMachine.js`: minimal engine (register states, `transitionTo`, lifecycle `enter/exit`).
  - [x] `js/state/context.js`: defines `state` shape and reset helpers.
  - [x] `js/state/navigation.js`: back-stack utility with push/pop and helpers for inventory back behavior.
  - `js/state/views/` render helpers (pure functions returning HTML or building DOM nodes):
    - [x] `views/optionsView.js` (list builder, highlight handling)
    - [x] `views/rollBar.js` (roll/next controls)
    - [x] `views/inventoryView.js` (list, detail, filters)
      - Legacy parity requirements (from backup):
        - Landing: buttons `View Inventory`, `Add Item`, `Add Category`, persistent `Export Inventory`, and `Back` to `IDLE`.
        - List header: `Back` (up one level), title `Inventory`.
        - Search/filter: text input placeholder `Search…`; select with `All`, spirit families (from `inventory.spirits` where `type==='family'`), `Mixers`, `Additives`, and all secondary pools (`Object.keys(data.secondary)`).
        - Categories vs items:
          - No query + `All` filter shows category buttons (class `open-cat`) sorted by label.
          - Category click sets filter to category id and renders items within.
          - Queries search across subpools, mixers, additives, and all secondary pools.
        - Items list: button per item (class `open-item`), deprecated items include class `inv-deprecated` when `in_rotation === false`; items within a bucket sorted by `name`.
        - Detail view: shows `Back` to list, name, and a `Deprecate`/`Restore` toggle. Persist with:
          - Mixers/additives: `window.updateItem(item)`.
          - Spirits in subpools: `window.updateSubpoolItem(originId, item)`.
          - Secondary items: `window.updateSecondaryItem(originId, item)`.
          - Refresh data via `getData()` then `window.setData(data)` after toggles.
        - Add Item modal: fields `Type` (spirit|mixers|additives), `Family` select shown only for spirits, and `Name`.
          - Spirits: id = `familyKey.slug(name)`; add with `window.addItem(familyItem)` and `window.addSubpool(subId, [])` for new families; for brand items use `window.addSubpoolItem(subId, item)`.
          - Mixers/additives: `window.addItem(item)`.
        - Add Category modal: create new spirit family+subpool or new secondary pool using `window.addSecondaryPool(poolId, [])`.
        - Back behavior from list: if filter ≠ `all` or search has value, reset to categories; else return to landing.
    - [x] `views/common.js` (headers, search/filter blocks)
- `js/state/flows/` controllers per flow:
    - [x] `flows/coreFlow.js` (LOADING, IDLE) - new module to capture core UI states.
    - [x] `flows/drinkFlow.js` (DRINK_TYPE, METHOD[_SELECTION], ROCKS_NEAT, HOW_MANY, picks) � states extracted and implemented; further view adoption pending.
    - [x] `flows/inventoryFlow.js` (INVENTORY and nested views)
    - [x] `flows/recipeBookFlow.js`
    - [x] `flows/settingsFlow.js`
  - [x] `js/state/rollUtils.js`: shared roll operations (joker, weighted pick) wrapping `rng.js`, `rules.js`.

- Keep existing cross-cutting modules: `uiHelpers.js`, `progressDrawer.js`, `rng.js`, `rules.js`, etc.

## Module Responsibilities

- `stateMachine.js`
  - Exports `transitionTo(name, ctx)`, `register(name, {enter, exit})`.
  - Owns current state name and calls lifecycle hooks.
  - Emits a simple event or callback to update progress drawer if needed.

- `context.js`
  - Exports `state`, `resetRecipeState`, and small helpers for session lifecycle.

- `navigation.js`
  - Simple stack: `push(view)`, `pop()`, `peek()`.
  - Flow-aware helpers: `inventoryBack({filter, query})` deciding category vs landing.

- `views/optionsView.js`
  - `renderOptions({items, getKey, getLabel, onSelect})` returns container and wiring.
  - Utility to apply `.highlighted`, scroll into view, and collect selections.

- `views/rollBar.js`
  - `attachRollBar({onRoll, onNext, parent})` to standardize roll/next toggling.

- `rollUtils.js`
  - `maybeJoker(chance, onJoker, onNormal)`
  - `weightedPick(items, weights)` and `softWeightedPick(itemList, locked)`

- `flows/*`
  - Each file composes views + roll utils + storage; no global DOM string duplication.

## Progress Snapshot

- Backups: [x] Created (`js/stateManager.js.backup`, `docs/archive/stateManager-YYYYMMDD.js`).
- Core engine: [x] stateMachine/context/navigation; [x] central progress update listener.
- Views: [x] optionsView/rollBar/common created; [~] inventoryView created and partially adopted in inventoryFlow; [~] options/roll bar adopted in METHOD.
- Flows: [x] core/inventory/recipeBook/settings; [x] drink (ROLL_SPIRITS, ROLL_MIXERS, ROLL_ADDITIVES, PICK_SECONDARY, PICK_* category-first, PICKS, RECIPE implemented).
- Roll utils: [x] module added; [~] in use by flows (softWeightedPick adopted in spirits/mixers/additives/secondaries).
- Registration: [x] index.js registers flows; app.js imports and calls `registerAllStates`.
- Tests: [x] unit tests for stateMachine/rollUtils/navigation; [ ] fix paths; [ ] add flow tests; [ ] integrate with runner.
- Cleanup: [x] remove dead copies; [ ] lint pass; [ ] encoding fixes.

## Refactor Plan (Phased)

1) Baseline + Backup
   - [x] Make the backup copies (see "Before You Start").
   - [x] Run `npm run lint` and `npm test` to capture current baseline.

2) Extract Core Engine
   - [x] Create `js/state/stateMachine.js` with `transitionTo` and registry.
   - [x] Move `state`, `resetRecipeState`, `goHome` into `js/state/context.js`; adjust `app.js` imports.
   - [x] Wire progress drawer update from a single place after transitions (listen for `stateTransition`).

3) Add Core UI States
   - [x] Create `js/state/flows/coreFlow.js` with `LOADING` and `IDLE` states (port logic from backup, including share-code flow and progress drawer behavior).
   - [x] Register `LOADING` and `IDLE` in `registerAllStates()` and use from `app.js`.

4) Normalize Roll Helpers
   - [x] Add `js/state/rollUtils.js` consolidating Joker handling and weighted pick logic currently duplicated across METHOD, MIXERS, ADDITIVES, SECONDARIES.
   - [~] Replace inline probability and weight calculations with functions throughout drink flow.
     - Legacy behavior to preserve:
       - Joker: 1-in-20 chance (`cryptoRoll(20) === 20`) triggers Dealer's Choice manual picker for each batch pick screen (spirits, mixers, additives) and in METHOD (routes to `METHOD_SELECTION`).
       - Allowed set: for each roll, exclude already-picked items in the current batch and any item that `violatesHardBan(item, state.selectedItems, hard_bans)` versus previously locked picks.
       - Weights: per-item base `weight` (default 1) multiplied by `getSoftWeight(item, state.selectedItems, soft_rules)`; selection via `weightedCryptoChoice(allowed, weights)`.
       - Locking: on Next, push the batch picks into `state.selectedItems` to influence subsequent soft/hard constraints.

5) Extract Views
   - [x] Build `views/optionsView.js` and `views/rollBar.js`.
   - [x] Update one flow (e.g., METHOD) to use them; then adopt across others.
     - METHOD legacy specifics:
       - Methods for drinks: `Shaken | Stirred | Blended`; for shots: `Shaken | Stirred | Layered`.
       - Joker 1-in-20 routes to `METHOD_SELECTION` (manual pick). Otherwise pick uniformly from the core set.
       - Two-option coin flip: when only two choices, trigger `window.coinFlip({ parent, onComplete })` overlay and then highlight selection.
       - On roll: clear existing `.highlighted`, add to the picked option, hide `Roll`, show `Next`.
   - [x] Migrate highlight/slide-up and coin flip overlay usage into reusable utilities.
     - Legacy behavior to encapsulate:
       - Highlighting: apply `.highlighted` to selected `.option` elements and ensure visible (scroll-into-view as needed).
       - Slide-up: call `highlightAndSlideUp(el, cb)` on Next to animate moving selections to the progress drawer before transitioning.
       - Coin flip overlay: use a container inside options area (e.g., `.coin-overlay`) during flip animation; hide overlay afterward.

6) Carve Out Flows
   - [x] Create `flows/drinkFlow.js` and move DRINK_TYPE, METHOD[_SELECTION], ROCKS_NEAT, HOW_MANY, and the subsequent pick states into it (ROLL_SPIRITS/ROLL_MIXERS/ROLL_ADDITIVES/PICK_SECONDARY/PICK_* category-first/PICKS/RECIPE implemented).
     - Legacy flow details to port:
       - DRINK_TYPE: roll `1..2` where 1=drink, 2=shot; Joker 1-in-20 sets `type='joker'` and routes to `METHOD_SELECTION`; otherwise add progress `Type: ...` and go to `METHOD` with `{ type }`.
       - METHOD_SELECTION: manual method pick for Dealer's Choice; Next adds `Method: <name>` then goes to `HOW_MANY`.
       - METHOD: offer context-dependent core set; Joker 1-in-20 routes to `METHOD_SELECTION`; next -> `ROCKS_NEAT` for drinks, else `HOW_MANY`.
       - ROCKS_NEAT: pick via `cryptoChoice(['Rocks','Neat'])`, using coin flip overlay; Next -> `HOW_MANY` with progress `Style: ...`.
       - HOW_MANY: roll counts via `cryptoRoll(3)` spirits, `cryptoRoll(4)` mixers, `cryptoRoll(2)` additives; Next -> `ROLL_SPIRITS` and add progress with counts.
       - ROLL_SPIRITS/MIXERS/ADDITIVES: batch pick screens with per-roll Joker, allowed-set filtering, soft-weighted picks, `.highlighted` tracking, hide `Roll` when `rollCount` reaches target; Next locks picks, updates progress, and transitions in order SPIRITS→MIXERS→ADDITIVES.
       - Secondary picks: after additives, if any mixer/additive with `requires_secondary` lacks a secondary in `state.recipe.secondaries`, transition to `PICK_SECONDARY` and repeat until all satisfied; then go to `RECIPE`.
       - PICK_* states (families/spirits/mixers/additives): support manual category-first flows used in some branches; reuse the same highlight + slide-up UX.
   - [x] Create `flows/inventoryFlow.js` and move INVENTORY rendering (list, detail, add-item/category) into it; use `navigation.js` for Back resolution.
   - [x] Create `flows/recipeBookFlow.js` and `flows/settingsFlow.js` for their respective states.

7) Register States
   - [x] In a new `js/state/index.js`, register all states from flow modules with the state machine.
   - [x] Update `app.js` to import from `js/state/index.js` and expose expected globals (if still needed).

8) Remove Dead/Duplicated Code
   - [x] Replace `stateManager.js` with a thin compatibility layer.
   - [x] Delete dead monolith copies (e.g., `js/stateManager - Copy.js`).
     - Confirmed present: `js/stateManager - Copy.js` (duplicate of backup). Remove after flows adopt new modules.
   - [ ] Ensure strings use single quotes; resolve lint errors introduced by the move; fix encoding artifacts.
     - Known legacy artifacts: mis-encoded "Dealer’s Choice" token in METHOD list (`dY�?`), and some placeholder glyphs in RECIPE list view. Normalize to plain ASCII or proper UTF-8 strings.

9) Tests
   - [x] Add unit tests for `stateMachine.js` (enter/exit order, context passing) in `tests/state/state-machine-tests.js`.
   - [x] Add tests for `rollUtils.js` and `navigation.js`.
   - [ ] Add tests for options selection helpers.
     - Render list, simulate select, assert `.highlighted` management, and that returned selection IDs match clicked items.
     - Roll/Next bar: assert initial `Roll` visible/`Next` hidden; after selection count reached, `Next` becomes visible and callback is fired.
   - [ ] Add a few transition tests for drink flow happy paths and no-solution branches.
     - Happy path: DRINK_TYPE→METHOD→ROCKS_NEAT→HOW_MANY→ROLL_SPIRITS→ROLL_MIXERS→ROLL_ADDITIVES→RECIPE with mocked RNG and rules.
     - Joker path: force Joker at METHOD to verify route to `METHOD_SELECTION`; force Joker in batch rolls to exercise manual picker hooks.
     - No-solution: craft inventory where allowed set becomes empty to ensure `showNoSolutionMessage` fires and flow pauses.
   - [ ] Integrate tests into Node runner (import `tests/state/*`) and fix relative import paths.
     - Provide mocks for `window.coinFlip`, DOM containers, and storage/data adapters; shim `getData` to return a minimal inventory.

10) Finalize + Cleanup
   - [x] Replace `stateManager.js` with a thin compatibility layer.
   - [ ] Re-run `npm run lint` and `npm test`; fix any regressions.

## Acceptance Criteria

- Behavior parity for all existing states and flows (visual and functional).
- Back navigation within Inventory works at each nested level (detail → list, list with filter/search → categories, categories → landing).
- Duplicated roll logic is centralized; coin flip/joker behavior remains unchanged.
- Lint passes with only pre-existing repository warnings unrelated to refactor.
- Tests cover state transitions and roll helpers.

## Risks and Mitigations

- Risk: Hidden coupling via global `window.*` usages.
  - Mitigation: Gradually convert to explicit imports/exports; keep temporary shims on `window` for compatibility.
- Risk: DOM ID/class naming drift.
  - Mitigation: Introduce constants for shared selectors in `views/common.js`.
- Risk: Inventory modal interactions rely on current markup.
  - Mitigation: Snapshot current HTML structure and add tests for critical selectors.

## Work Breakdown (suggested order)

- Day 1: Backup; extract `stateMachine`, `context`; rewire `transitionTo` and progress update.
- Day 2: Add `rollUtils`; migrate METHOD state to new helpers and views.
- Day 3: Migrate DRINK_TYPE, ROCKS_NEAT, HOW_MANY, and spirits/mixers/additives pick states to `drinkFlow`.
- Day 4: Extract `inventoryFlow` with `navigation` back-stack; port list/detail/add modals.
- Day 5: Extract recipe book & settings; remove dead code; add tests and fix lint.

## Notes

- Keep changes surgical and incremental; after each phase, verify in the browser and via tests.
- Avoid changing data shape (`data/defaults.json`) or storage APIs during refactor.






