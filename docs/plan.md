# Dicey Drinks — Build Plan (Mobile-first, Offline)

**Purpose:** a mobile-primary web app that rolls dice to build a random drink/shot, with one “last-pick” reroll, context-aware hard bans, and an editable inventory (in/out of rotation). Exports a shareable recipe “card” and stores a local cookbook. No server required.

---

## 0) Goals & Non-Goals

**Goals**

* Crypto-grade randomness for rolls.
* Stepwise flow that mirrors the boards: Drink/Shot → Method → Rocks/Neat (drinks) → “How many” → Category picks → Sub-pools → Secondary rolls → Recipe.
* **Exactly one** reroll, usable **only for the immediately previous pick**.
* Hard bans apply **after** an item is selected (contextually remove incompatible future options), soft rules down-weight odd pairs.
* Inventory admin UI: Add, Archive (in-rotation=false), Delete.
* Cookbook (local) with rating (1–5) and seed/rehydration.
* Exportable, offline-friendly **SVG recipe card**.
* Mobile-first UI; dark theme with fun accents.

**Non-Goals (Phase 1)**

* No backend, login, or cloud sync.
* No heavy PDF/PNG generation (use SVG).
* No LLM naming/instructions (that’s Phase 4).

---

## 1) Phases

**Phase 0 — Scaffold**

* Tech: Vanilla HTML/CSS/JS. IndexedDB for data; localStorage for quick settings. Web Crypto RNG.
* Structure, theming (dark base + accent tokens), utilities (seeded log, event bus).

**Phase 1 — Core Roller**

* Step machine + progress drawer.
* Categories: **Spirits**, **Mixers**, **Additives** (renamed from Flair).
* **Sub-pools per spirit family** (e.g., roll “Whiskey” → roll inside Whiskey pool for type/brand/flavor).
* Secondary pools: **Juice**, **Bitters**, **Syrup** (extensible).
* One reroll (last pick only).
* Hard bans (pairwise) **only constrain subsequent categories**; soft downweights.
* Dealer’s Choice = **🃏** face; manual user pick when hit.
* Autosave finished builds to Cookbook.
* Export **SVG card**.

**Phase 2 — Cookbook+Admin & Share**

* Inventory Admin page (Add / Archive / Delete; toggle in-rotation).
* Cookbook list: rating 1–5, notes, filter/sort, re-open from seed, “Remix” (small perturbation).
* Import/Export full inventory/cookbook JSON, Share Code (URL hash).

**Phase 3 — Polish & PWA**

* Dice animation (CSS/Canvas), sound toggle; 🃏 face art.
* PWA: manifest + service worker (installable, full offline).
* Web Share API integration (share SVG/URL if available; fallback download).

**Phase 4 — Smart Assist (optional)**

* LLM (Ollama/OpenRouter selectable) for drink naming + prose steps (kept optional, local-first when possible).
* “Style packs” (classic/tiki/dessert) as gentle weighting layers.

---

## 2) UX Flow (mobile-first)

1. **Home / New Build**

   * Buttons: *New Drink*, *New Shot*, *Inventory*, *Cookbook*.
2. **Prep Method**

   * Drink: Shaken / Stirred / Blended / Dealer’s (🃏 manual).
   * Shot: Shaken / Stirred / Layered / Dealer’s (🃏 manual).
   * On advance: lock; **1x Reroll** button shown (only for this step).
3. **Rocks / Neat** (Drink only)

   * Choice; lock; reroll available only here if unused.
4. **How Many**

   * \#Spirits, #Mixers, #Additives (d6 defaults with editable limits).
5. **Category Picks**

   * For each Spirit count: roll **family** (e.g., Whiskey, Rum, Gin, Wine…), then roll **sub-pool** (type/brand/flavor).
   * For Mixers: roll item; if item requires a **Secondary** (e.g., Juice/Bitters/Syrup), roll from that pool.
   * For Additives: roll from Additives pool (hot sauce, smoke, salted rim, egg white, sprinkles, etc.).
   * After each pick: apply **hard bans** to **future** categories only; soft downweights adjust weights.
   * Reroll (if unused) applies **only to the just-picked item**.
6. **Recipe Card**

   * Glass, Ice, Method; ingredients with volumes; concise steps.
   * Save to Cookbook (auto), rate 1–5, notes.
   * Export: **SVG card**.

**Progress Drawer:** sticky, collapsible; shows current stage + locked picks so far.

---

## 3) Randomness & Rolls

* **RNG:** `window.crypto.getRandomValues` → uniform floats/ints; rejection sampling for “holes” (forbidden faces) to keep the visual metaphor of a d20/d12 intact.
* **Seeding (for rebuild):** store `seed`, `roll trace`, and the final normalized choices; rebuild uses the stored choices by default, seed for “Remix.”
* **Weights:** each item has `weight` (default 1). Soft rules multiply weights (e.g., ×0.3). Hard bans remove items from candidate set entirely.

---

## 4) Rule Engine

**Pairwise hard bans (seed set)**

* `coffee` × `wine`
* `acidic` × `dairy_or_cream`  *(OJ/lemonade/cola/pineapple with milk/cream liqueur/whipped cream)*
* `pickle` × `dairy_or_cream`
* `egg_white` × `hot_sauce` *(texture sabotage)*

> Enforcement: When item **A** is locked, and we move to a **later** category, any candidate item **B** with a banned pair `(A,B)` is excluded. Earlier categories remain fully available (per your requirement).

**Soft downweights (seed set)**

* `cream_liqueur` × `beer`  (×0.25)
* `cream_liqueur` × `energy_drink` (×0.3)
* `mezcal` × `pb_whiskey` (×0.4)
* `smoke` × `whipped_cream` (×0.4)
* `pickle_juice` × `chocolate` (×0.2)

> All user-editable; kept small and obvious.

**Trait system**

* Each item tags: `acidic`, `dairy_or_cream`, `coffee`, `wine`, `pickle`, `egg`, `citrus`, `smoke`, `spicy`, `herbal`, `sweet`, `savory`, `bitter`, etc.
* Hard/soft lists reference traits or exact IDs to generalize across brands.

---

## 5) Measures & Steps (Phase 1 templates)

**Drinks**

* Base spirit \~2.0 oz total across spirit picks (e.g., 2 spirits → 1.25 + 0.75).
* Liqueurs: 0.5–0.75 oz each.
* Syrups: 0.25–0.5 oz each (cap total sweetness by tags).
* Mixers: 1–4 oz total, scaled by spirits and glass.
* Methods:

  * *Shaken:* add to tin with ice, shake 10–12s, strain; egg white → dry-shake then wet-shake.
  * *Stirred:* build in mixing glass with ice 20–30s, strain.
  * *Blended:* ice 1–1.5 cups per 8–10 oz final volume.

**Shots**

* Base 1.0–1.5 oz total.
* *Layered:* order by `density_hint` (syrup → cream → liqueur → spirit).

---

## 6) Data Model (JSON, IndexedDB collections)

```json
{
  "version": 1,
  "settings": {
    "theme": "dark-neon",
    "maxRerolls": 1,
    "dieFaces": 20,
    "showDieNumbers": true
  },
  "inventory": {
    "spirits": [
      {
        "id": "spirits.whiskey",
        "name": "Whiskey",
        "type": "family",
        "in_rotation": true,
        "subpool_id": "sub.whiskey"
      },
      {
        "id": "spirits.gin",
        "name": "Gin",
        "type": "family",
        "in_rotation": true,
        "subpool_id": "sub.gin"
      }
      /* other spirit families, e.g., Rum, Tequila, Brandy, Liqueur, Wine… */
    ],
    "mixers": [
      {
        "id": "mixers.coffee",
        "name": "Coffee",
        "in_rotation": true,
        "traits": ["coffee","bitter"]
      },
      {
        "id": "mixers.juice",
        "name": "Juice",
        "in_rotation": true,
        "requires_secondary": "sec.juice"
      }
      /* soda, tea, water, coconut water, beer, energy drink, etc. */
    ],
    "additives": [
      { "id": "add.hot_sauce", "name": "Hot Sauce", "in_rotation": true, "traits": ["spicy"] },
      { "id": "add.salted_rim", "name": "Salted Rim", "in_rotation": true, "kind": "rim" },
      { "id": "add.egg_white", "name": "Egg White", "in_rotation": true, "traits": ["egg","dairy_or_cream"] },
      { "id": "add.smoke", "name": "Smoke", "in_rotation": true, "traits": ["smoke"] }
    ]
  },
  "subpools": {
    "sub.whiskey": [
      { "id": "whiskey.bourbon.brandX", "name": "Bourbon (Brand X)", "in_rotation": true, "traits": ["oak","vanilla"], "density_hint": 0.93 },
      { "id": "whiskey.rye.brandY", "name": "Rye (Brand Y)", "in_rotation": true, "traits": ["spice"], "density_hint": 0.93 },
      { "id": "whiskey.pb", "name": "Peanut Butter Whiskey", "in_rotation": false, "traits": ["sweet","nutty"] }
    ],
    "sub.gin": [
      { "id": "gin.london", "name": "London Dry", "in_rotation": true, "traits": ["herbal"] }
    ]
  },
  "secondary": {
    "sec.juice": [
      { "id": "juice.oj", "name": "Orange Juice", "in_rotation": true, "traits": ["acidic","citrus"] },
      { "id": "juice.cran", "name": "Cranberry", "in_rotation": true, "traits": ["acidic"] }
    ],
    "sec.bitters": [
      { "id": "bitters.aromatic", "name": "Aromatic Bitters", "in_rotation": true, "traits": ["bitter","spice"] },
      { "id": "bitters.orange", "name": "Orange Bitters", "in_rotation": true, "traits": ["citrus","bitter"] }
    ],
    "sec.syrup": [
      { "id": "syrup.simple", "name": "Simple Syrup", "in_rotation": true, "traits": ["sweet"] },
      { "id": "syrup.maple", "name": "Maple Syrup", "in_rotation": true, "traits": ["sweet"] }
    ]
  },
  "rules": {
    "hard_bans": [
      { "a": "trait:coffee", "b": "trait:wine" },
      { "a": "trait:acidic", "b": "trait:dairy_or_cream" },
      { "a": "trait:pickle", "b": "trait:dairy_or_cream" },
      { "a": "add.egg_white", "b": "add.hot_sauce" }
    ],
    "soft_rules": [
      { "a": "trait:cream_liqueur", "b": "trait:beer", "weight_mult": 0.25 },
      { "a": "spirits.mezcal", "b": "whiskey.pb", "weight_mult": 0.4 },
      { "a": "add.smoke", "b": "trait:whipped_cream", "weight_mult": 0.4 },
      { "a": "trait:pickle", "b": "trait:chocolate", "weight_mult": 0.2 }
    ]
  }
}
```

> Conventions: `trait:*` targets any item with that trait; otherwise use explicit IDs. `in_rotation=false` means archived but not deleted.

---

## 7) Rolling Algorithm (per step)

```
function rollFromPool(pool, contextLocked, rules, dieFaces=20):
  candidates = pool.items.filter(i => i.in_rotation)
  // Apply hard bans ONLY based on context (already-locked items)
  candidates = candidates.filter(i => !violatesHardBan(i, contextLocked, rules.hard_bans))

  if candidates.length === 0 -> show "no solution" modal; revert one step

  // Apply soft weights
  weights = candidates.map(i => baseWeight(i) * softMultipliers(i, contextLocked, rules.soft_rules))

  // Crypto RNG: rejection sample on die faces so excluded IDs never appear.
  idx = weightedCryptoChoice(candidates, weights)
  return candidates[idx]
```

* **Reroll:** available exactly once; replaces the last `idx` with a fresh draw from the **same computed candidate set**.
* **Dealer’s Choice (🃏):** pauses RNG and opens a modal to select from the current candidate set.

---

## 8) Recipe Synthesis & Card

**Card fields**

* Name (Phase 4 if using LLM; Phase 1 defaults to e.g., “Build #2025-09-01-A”).
* Glass, Ice/Neat, Method.
* Ordered ingredients + volumes.
* Steps (template).
* Notes, Rating, Seed, Share code.

**SVG Export (offline)**

* Single self-contained SVG (fonts -> system stack), under 50–100KB typical.
* Download to Files; share via Web Share API when online.

---

## 9) Theming

* **Base:** dark gray/black.
* **Accents:** neon gradient tokens (cyan/magenta/lime) for borders, dice pips, 🃏 highlight.
* **Accessibility:** 4.5:1 contrast for text; large tap targets; haptics on roll.

---

## 10) File Layout

```
/index.html
/css/theme.css
/js/app.js              // state machine, views
/js/rng.js              // crypto utils, weighted choice
/js/rules.js            // hard/soft evaluation
/js/measure.js          // volume heuristics + steps
/js/storage.js          // IndexedDB, localStorage settings
/js/exporter.js         // SVG card + share code
/data/defaults.json     // structure above (empty pools OK)
/pwa/manifest.json      // Phase 3
/pwa/sw.js              // Phase 3
/assets/joker.svg       // 🃏 face
```

---

## 11) Acceptance Criteria (Phase 1)

* Can complete a full build (Drink or Shot) on a phone with no network.
* Exactly one “last-pick” reroll; button disabled otherwise.
* Choosing Wine in Spirits **does not** hide Wine initially; it **does** hide Coffee later.
* Dealer’s Choice shows 🃏 and opens manual pick modal.
* Inventory admin can Add, Archive (toggle), and Delete items and pools.
* Export downloads an SVG card; Cookbook shows the saved build.

---

## 12) Future Hooks

* True-random source switch (Phase 2/3).
* Style packs (weight overlays) (Phase 4).
* Cloud sync (out of scope unless requested).
