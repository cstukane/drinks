# AGENT_START.md

## Goal (Phase 1)

Ship a **mobile-first**, offline-capable web app that builds a random **drink** or **shot** via a stepwise dice flow. It must use **crypto-grade RNG**, enforce **hard bans only after an item is selected**, allow **exactly one reroll of the *last* pick**, support **Dealer’s Choice (🃏) as manual pick**, and export a **SVG recipe card**. No backend.

## Build Order (do not deviate)

1. **Scaffold**: `/index.html`, `/css/theme.css`, `/js/app.js`, `/js/storage.js`, `/js/rng.js`
2. **State machine** for steps: Drink/Shot → Method → (Rocks/Neat for drinks) → How Many → Category Picks → Sub-pools → Secondary Rolls → Recipe
3. **Rules engine**: pairwise hard bans (apply only to *future* categories) + soft downweights
4. **Reroll-last**: one token per build; only for the immediately previous pick
5. **Inventory Admin**: Add / Archive (in-rotation=false) / Delete; sub-pools for spirit families
6. **SVG Export**. Autosave final builds to Cookbook (IndexedDB)

## Non‑negotiables

- RNG: `window.crypto.getRandomValues` for all sampling; weighted choice supported
- Hard bans do **not** hide items up front. They only filter **subsequent** candidate sets after a pick is locked
- Reroll: **exactly one**, **last-pick only**
- Dealer’s Choice: represent face as **🃏**; when rolled, open a **manual pick** modal from current candidates
- Mobile-first layout; dark theme with high contrast; works offline without network calls
- Export: Single, self-contained **SVG** card.

## Definition of Done

- All Acceptance Tests in `TESTS.md` pass on a mobile viewport (375×812 and 414×896)
- No network is required; reload restores data (IndexedDB) and settings (localStorage)
- Selecting **Wine** in Spirits does not pre-hide it; after Wine is locked, **Coffee** is excluded later
- “No solution” paths revert one step with a clear message (no dead ends)
- SVG export renders.

## Ask-first Stop Points

- Any change to reroll policy or hard-ban timing
- Any data model change that breaks compatibility with `data/defaults.json.template`
- Adding external libraries, fonts, or analytics
- Any UI change that removes the progress drawer or the 🃏 manual-pick behavior
