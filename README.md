# Dicey Drinks — README

Mobile-first, offline web app that rolls dice to build a random **drink** or **shot**, with a single “last-pick” reroll, context-aware hard bans, editable inventory (in/out of rotation), and a shareable offline **SVG recipe card**. No server required.

---

## 1) Quick Start

**Requires:** any modern browser (mobile or desktop).

1. Clone/download this project.
2. Open `index.html` directly in your browser
   – or serve the folder with any static server (optional).
3. Tap **New Drink** or **New Shot** and follow the steps.

**Data storage:**

* Long-lived data (inventory, cookbook) → **IndexedDB**
* App preferences (theme, sfx, etc.) → **localStorage**

> Phase 3 enables PWA install + full offline.

---

## 2) Core Features (Phase 1)

* Crypto-grade randomness using `window.crypto.getRandomValues`.
* Stepwise flow:

  1. Drink/Shot
  2. Method (Drink: shaken/stirred/blended/🃏 • Shot: shaken/stirred/layered/🃏)
  3. Rocks/Neat (Drink only)
  4. “How many?” (#Spirits • #Mixers • #Additives)
  5. Category picks + sub-pools (e.g., Whiskey → Bourbon/Rye/…)
  6. Secondary rolls when needed (Juice/Bitters/Syrup)
  7. Recipe card (volumes + steps)
* **Exactly one** reroll token, usable **only for the immediately previous pick**.
* **Hard bans** apply only **after** an item is selected (they constrain **future** picks, never hide items up front).
* **Soft rules** down-weight odd combos (still possible).
* **Dealer’s Choice** is the 🃏 face → **manual** user pick from the current candidate set.
* Inventory admin: **Add**, **Archive** (in-rotation=false), **Delete**.
* Finished builds auto-save to **Cookbook**; rate 1–5 (Phase 2).
* Export **SVG recipe card** + compact **share code** (URL hash). Works offline.

---

## 3) Phases

* **Phase 0 — Scaffold:** App shell, theme, utilities, RNG.
* **Phase 1 — Core Roller:** Full step machine, reroll-last, rules engine, inventory admin, SVG export.
* **Phase 2 — Cookbook & Admin:** Ratings, notes, search/sort, import/export JSON, “Remix”.
* **Phase 3 — Polish & PWA:** Dice animation + sfx, 🃏 art, installable PWA, Web Share API.
* **Phase 4 — Smart Assist (optional):** LLM naming + prose steps (Ollama/OpenRouter), “style packs”.

---

## 4) Architecture

* **No framework**: vanilla HTML/CSS/JS
* **Storage**: IndexedDB (via `storage.js`) + localStorage
* **Randomness**: `rng.js` (CSPRNG + weighted choice + rejection sampling)
* **Rules**: `rules.js` (pairwise hard bans & soft downweights)
* **Volumes/Steps**: `measure.js` (heuristics + instruction templates)
* **Export**: `exporter.js` (SVG + share code in URL hash)

**File layout**

```
/index.html
/css/theme.css
/js/app.js
/js/rng.js
/js/rules.js
/js/measure.js
/js/storage.js
/js/exporter.js
/data/defaults.json
/pwa/manifest.json   (Phase 3)
pwa/sw.js            (Phase 3)
assets/joker.svg     (🃏 face art)
```

---

## 5) Data Model

### 5.1 Inventory & Pools (`/data/defaults.json`)

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
      { "id": "spirits.whiskey", "name": "Whiskey", "type": "family", "in_rotation": true, "subpool_id": "sub.whiskey" },
      { "id": "spirits.gin",     "name": "Gin",     "type": "family", "in_rotation": true, "subpool_id": "sub.gin" }
      /* Rum, Tequila, Brandy, Liqueur, Wine, etc. */
    ],
    "mixers": [
      { "id": "mixers.coffee", "name": "Coffee", "in_rotation": true, "traits": ["coffee","bitter"] },
      { "id": "mixers.juice",  "name": "Juice",  "in_rotation": true, "requires_secondary": "sec.juice" }
      /* soda, tea, coconut water, beer, energy drink, etc. */
    ],
    "additives": [
      { "id": "add.hot_sauce",   "name": "Hot Sauce",   "in_rotation": true, "traits": ["spicy"] },
      { "id": "add.salted_rim",  "name": "Salted Rim",  "in_rotation": true, "kind": "rim" },
      { "id": "add.egg_white",   "name": "Egg White",   "in_rotation": true, "traits": ["egg","dairy_or_cream"] },
      { "id": "add.smoke",       "name": "Smoke",       "in_rotation": true, "traits": ["smoke"] }
    ]
  },
  "subpools": {
    "sub.whiskey": [
      { "id": "whiskey.bourbon", "name": "Bourbon", "in_rotation": true, "traits": ["oak","vanilla"], "density_hint": 0.93 },
      { "id": "whiskey.rye",     "name": "Rye",     "in_rotation": true, "traits": ["spice"], "density_hint": 0.93 },
      { "id": "whiskey.pb",      "name": "PB Whiskey", "in_rotation": false, "traits": ["sweet","nutty"] }
    ],
    "sub.gin": [
      { "id": "gin.london", "name": "London Dry", "in_rotation": true, "traits": ["herbal"] }
    ]
  },
  "secondary": {
    "sec.juice":  [{ "id": "juice.oj", "name": "Orange Juice", "in_rotation": true, "traits": ["acidic","citrus"] }],
    "sec.bitters":[{ "id": "bitters.aromatic", "name": "Aromatic Bitters", "in_rotation": true, "traits": ["bitter","spice"] }],
    "sec.syrup":  [{ "id": "syrup.simple", "name": "Simple Syrup", "in_rotation": true, "traits": ["sweet"] }]
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

**Conventions**

* `in_rotation=false` = archived (kept, not rolled).
* `type:"family"` means “roll family, then roll `subpool_id`”.
* Traits power rules: `acidic`, `dairy_or_cream`, `coffee`, `wine`, `pickle`, `egg`, `citrus`, `smoke`, `spicy`, `herbal`, `sweet`, `savory`, `bitter`, etc.

---

## 6) Rolling & Rerolling

### 6.1 Candidate Selection

* Build a candidate list from the current pool **filtered only by context**: when an item is **already selected**, any **future** item that forms a hard-ban pair with it is excluded.
* Apply **soft rules** as weight multipliers.
* Use **CSPRNG** for final weighted choice.

### 6.2 Rejection Sampling (for “holes”)

When some items are excluded (by context), we still **display** a die (e.g., d20). We rejection-sample until a legal face appears, preserving uniformity over allowed items.

### 6.3 Reroll

* Exactly **1** token per build.
* Active **only** for the immediately previous pick; once you advance, the prior pick is locked forever.
* Reroll uses the **same candidate set** that produced the original result.

**Pseudocode**

```js
function rollFromPool(pool, context, rules) {
  const allowed = pool.items
    .filter(i => i.in_rotation)
    .filter(i => !violatesHardBan(i, context, rules.hard_bans));

  if (!allowed.length) return { error: "no-solution" };

  const weights = allowed.map(i => baseWeight(i) * softWeight(i, context, rules.soft_rules));
  const choice = weightedCryptoChoice(allowed, weights);  // CSPRNG
  return choice;
}
```

---

## 7) Measures & Steps

**Drinks**

* Base spirits ≈ **2.0 oz** total (split if multiple spirits, e.g., 1.25 + 0.75).
* Liqueurs: **0.5–0.75 oz** each.
* Syrups: **0.25–0.5 oz** total; cap sweetness by tags.
* Mixers: **1–4 oz** total, scaled to glass size.
* Methods:

  * **Shaken:** add to tin with ice, shake 10–12s, strain; egg white → dry-shake, then wet-shake.
  * **Stirred:** mixing glass with ice 20–30s, strain.
  * **Blended:** 1–1.5 cups ice per 8–10 oz final.

**Shots**

* Base **1.0–1.5 oz** total.
* **Layered:** order by `density_hint` (syrup → cream → liqueur → spirit).

---

## 8) Recipe Card (SVG) & Share Code

* Exported **SVG** includes: title, glass/ice/method, ingredients (with volumes), steps, rating, date, and seed.
* **Share code**: compact JSON → deflate + base64url → placed in URL `#hash` for offline shareable links.
* Importing: visiting a link with a hash reconstructs the recipe or opens a confirmation modal to save.

---

## 9) UI & Theme

* **Theme:** dark base with neon accent tokens (cyan/magenta/lime). High contrast (≥4.5:1).
* **Progress drawer:** sticky, collapsible; shows current stage + locked picks.
* **Dealer’s Choice (🃏):** visually distinct face; opens modal to pick from the current candidate set.

---

## 10) Inventory Admin

* **Add** new items/pools with traits, weights, and optional `requires_secondary`.
* **Archive** (toggle in-rotation) to keep items but remove from rolls.
* **Delete** to permanently remove.
* **Import/Export** full inventory & cookbook JSON (Phase 2).

---

## 11) Acceptance Criteria (Phase 1)

* Complete Drink/Shot build on mobile with no network.
* Exactly one “last-pick” reroll; disabled otherwise.
* Selecting Wine does **not** hide Wine initially; after Wine is selected, Coffee is excluded later.
* Dealer’s Choice shows 🃏 and opens manual pick modal.
* Inventory Admin: Add/Archive/Delete works; archived items don’t roll.
* Export creates a valid SVG + share code; Cookbook shows saved build.

---

## 12) Roadmap (post-P1)

* **Phase 2:** ratings + notes, cookbook search/sort, import/export JSON, “Remix”.
* **Phase 3:** PWA install, dice animation + sfx, Web Share API.
* **Phase 4:** optional LLM naming & prose steps (Ollama/OpenRouter); “style packs”.

---

## 13) Extending

* Add new **families** by inserting to `inventory.spirits` and creating a `subpool_id`.
* Add **secondary pools** (e.g., `sec.rim`) and mark items with `requires_secondary`.
* Create new **rules** by traits (`trait:*`) or explicit IDs.

---

## 14) License

TBD by project owner.

---

### Notes for Implementers

* Favor small, testable modules. Keep UI logic in `app.js`; isolate RNG and rules.
* When a candidate set becomes empty due to rules, **revert one step** and show a human message (don’t silently fail).
* Keep all strings user-facing and editable for future i18n.
