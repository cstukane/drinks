# ARCHITECTURE.md

## Tech
- Vanilla HTML/CSS/JS; no frameworks
- IndexedDB for data; localStorage for lightweight settings
- No network calls in Phase 1

## Modules
- `app.js` — router/state machine, view controllers, progress drawer
- `rng.js` — CSPRNG wrappers, uniform/weighted choice, rejection sampling
- `rules.js` — hard-ban & soft-rule evaluation, candidate filtering
- `measure.js` — volume heuristics and instruction templates per method
- `storage.js` — IndexedDB CRUD (settings, inventory, subpools, secondary, rules, cookbook)
- `exporter.js` — SVG recipe card + share code encode/decode (URL hash)
- `theme.css` — dark theme + neon accents; prefers-reduced-motion/sound toggles

## Data Flow
1. UI action dispatches an event to the state machine
2. State machine calls `rules.js` to compute candidate set and weights
3. `rng.js` returns a choice; state updates; progress drawer refreshes
4. On final step, `measure.js` synthesizes volumes/steps
5. `storage.js` writes cookbook entry; `exporter.js` can serialize to SVG/hash

## Error Handling
- **No-solution** (empty candidate set): revert one step; toast message with which rule blocked it
- **Storage errors**: show non-blocking banner; session still usable (in-memory fallback)
- **Import errors**: invalid share code → explain and ignore

## File Tree (target)
```
/index.html
/css/theme.css
/js/app.js
/js/rng.js
/js/rules.js
/js/measure.js
/js/storage.js
/js/exporter.js
/data/defaults.json           (generated from template)
/data/defaults.json.template  (committed)
/data/fixtures/minimal.json
/data/fixtures/edge_wine_coffee.json
/assets/joker.svg
```
