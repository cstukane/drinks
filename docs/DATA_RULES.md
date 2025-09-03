# DATA_RULES.md — Data Model & Rules

## Collections (IndexedDB)
- `settings`: theme, sfx, showDieNumbers, maxRerolls
- `inventory`: three top-level categories (**spirits**, **mixers**, **additives**)
- `subpools`: per spirit family (e.g., `sub.whiskey`, `sub.rum`, …)
- `secondary`: `sec.juice`, `sec.bitters`, `sec.syrup` (extensible)
- `cookbook`: finished builds (ingredients, steps, volumes, method, rating, seed, share code)

## Item Shape (all pools)
```json
{
  "id": "mixers.coffee",
  "name": "Coffee",
  "in_rotation": true,
  "traits": ["coffee","bitter"],
  "requires_secondary": null,
  "weight": 1,
  "density_hint": null
}
```
- `traits` power rules: examples — `acidic`, `dairy_or_cream`, `coffee`, `wine`, `pickle`, `egg`, `citrus`, `smoke`, `spicy`, `herbal`, `sweet`, `savory`, `bitter`, `cream_liqueur`

## Spirit Families
Items in `inventory.spirits` with `type: "family"` roll into a `subpool_id`:
```json
{ "id": "spirits.whiskey", "name": "Whiskey", "type": "family", "subpool_id": "sub.whiskey", "in_rotation": true }
```
Sub-pool entries are concrete types/brands:
```json
{ "id": "whiskey.bourbon.brandX", "name": "Bourbon (Brand X)", "in_rotation": true, "traits": ["oak","vanilla"], "density_hint": 0.93 }
```

## Secondary Pools
Some mixers/additives may require a secondary choice:
```json
{ "id": "mixers.juice", "name": "Juice", "requires_secondary": "sec.juice" }
```

## Rules Engine

### Hard Bans (pairwise)
- Enforced **only after** an item is selected; they filter **future** categories, never initial pools
- Seed set:
  - `trait:coffee` × `trait:wine`
  - `trait:acidic` × `trait:dairy_or_cream`
  - `trait:pickle` × `trait:dairy_or_cream`
  - `add.egg_white` × `add.hot_sauce`

Representation:
```json
{ "a": "trait:acidic", "b": "trait:dairy_or_cream" }
```

### Soft Rules (downweights)
- Still allowed; multipliers apply to base weights
- Seed set:
  - `trait:cream_liqueur` × `trait:beer` → ×0.25
  - `spirits.mezcal` × `whiskey.pb` → ×0.4
  - `add.smoke` × `trait:whipped_cream` → ×0.4
  - `trait:pickle` × `trait:chocolate` → ×0.2

### Evaluation Order
1. Build candidate set from the current pool **in_rotation == true**
2. Remove any items that hard-ban with **already locked** picks
3. Apply weight multipliers from soft rules vs. locked picks
4. Sample via **CSPRNG** (weighted)
5. If 🃏, open manual pick modal from the candidate set

## Randomness
- Use `window.crypto.getRandomValues` for uniform floats/ints
- Weighted choice: prefix-sum cumulative distribution; 32-bit integer draw
- Rejection sampling for “holes” in die faces (visual metaphor preserved)
- Store: `seed`, `roll_trace`, `final_choices` inside cookbook entry

## Measurements (heuristics)
- Drinks: base spirits ≈ 2.0 oz total; liqueurs 0.5–0.75; syrups 0.25–0.5; mixers 1–4 oz
- Shots: base 1.0–1.5 oz; layered order by `density_hint`
