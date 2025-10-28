# Repository Guidelines

## Project Structure & Modules
- Root: static web app (`index.html`).
- Code: `js/` (vanilla ES modules: `stateManager.js`, `rng.js`, `rules.js`, `measure.js`, `storage.js`, `exporter.js`, UI helpers, animation, SFX).
- Styles: `css/`; Images/icons: `assets/`.
- Data: `data/defaults.json` (inventory, rules, subpools).
- PWA: `pwa/` (`manifest.json`, `sw.js`).
- Tests: `tests/` (Node runner + browser harness).
- Docs: `docs/` (optional notes/specs); Scripts: `scripts/` (dev utilities).

## Build, Test, and Development
- Run locally (Windows): `run.bat` (serves on `http://localhost:5012/index.html`).
- Quick serve (any OS): `python -m http.server 5012` then open `/index.html`.
- Lint: `npm run lint` (checks `js/`). Auto-fix: `npm run lint:fix`.
- Tests (Node, mocked browser APIs): `npm test`.
- Browser tests: open `tests/index.html` in a browser.

## Coding Style & Naming
- Language: vanilla JS (ES modules), no framework.
- ESLint: `eslint:recommended`; single quotes; semicolons required; `no-undef` errors; `no-console` allowed; unused vars warn.
- Indentation: consistent 2 spaces (not enforced by lint; match existing files).
- Filenames: `lowerCamelCase.js` for modules; `kebab-case` for assets.
- Functions/constants: `camelCase`; constants may use `SCREAMING_SNAKE_CASE` when global.

## Testing Guidelines
- Location: `tests/*.js`; convention: `*-tests.js`.
- Node runner: `tests/node-test-runner.js` shims Web APIs (Crypto, DOM, Audio, IndexedDB, THREE).
- Add focused tests near related modules and include minimal mocks.
- Coverage: no threshold enforced; prefer unit tests for `rng`, `rules`, `measure`, and pure utilities.

## Commit & Pull Requests
- Commits: clear, imperative subject (“Fix dice rejection sampling”).
- Conventional Commits encouraged: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
- PRs: include summary, rationale, before/after notes or screenshots (UI), and test plan (`npm test` + browser steps).
- Link issues (`Closes #123`) and note any data schema changes in `data/defaults.json`.

## Security & Configuration
- No secrets or servers; app is fully static/offline. Keep any keys out of the repo.
- When editing `defaults.json`, maintain `id` stability; prefer additive changes; document hard bans/traits.
- PWA changes: update both `pwa/manifest.json` and `pwa/sw.js` together.
