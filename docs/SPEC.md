# SPEC.md — Functional Spec

## Users & Devices
- Primary: phone browsers (Safari iOS, Chrome Android); secondary: desktop browsers
- Orientation: portrait-first, responsive to landscape

## Top-Level Flows
1) **New Drink** / **New Shot**
2) **Inventory** (Add / Archive / Delete items and pools)
3) **Cookbook** (view saved builds, rate, notes) — ratings arrive in Phase 2

## Step Machine (Phase 1)
1. **Mode**: Drink | Shot
2. **Method**:
   - Drink: Shaken | Stirred | Blended | **🃏 Dealer’s Choice (manual)**
   - Shot:  Shaken | Stirred | Layered  | **🃏 Dealer’s Choice (manual)**
3. **Rocks / Neat** (Drink only)
4. **How Many**: #Spirits, #Mixers, #Additives (d6-like bounds; user-editable limits)
5. **Picks**:
   - **Spirits**: roll **family** (Whiskey, Rum, Gin, Tequila, Brandy, Liqueur, Wine, etc.), then roll **sub-pool** (type/brand/flavor) for each one selected. E.g. If two Spirits were rolled, the sub-pool should show up for each sequentially.
   - **Mixers**: roll items; where required, roll a **Secondary** (Juice/Bitters/Syrup)
   - **Additives**: roll items (hot sauce, smoke, salted/sugar rim, egg white, sprinkles, etc.)
6. **Recipe Card**: glass, ice/neat, method, ingredients with volumes, concise steps; autosave; **export SVG**.

### Progress Drawer
- Sticky, collapsible; shows current stage and locked picks so far

## Reroll
- One token per build
- Only applicable to the **immediately previous pick**
- Once user advances, prior picks are **locked forever**

## Dealer’s Choice (🃏)
- When landed, show a modal with the **current candidate set**
- User manually selects one; then it locks and flow continues

## Randomness & Die UX
- Use **CSPRNG**
- Preserve “die” metaphor visually; when candidates are filtered, use **rejection sampling** so illegal faces never appear (still uniform over allowed set)

## Rules
- **Hard bans**: pairwise prohibitions enforced **after** a pick is locked; they filter **future** categories only
- **Soft rules**: pairwise downweights; still possible but rarer

## Measurements (Phase 1)
- Drinks: base spirits ≈ 2.0 oz total; liqueurs 0.5–0.75 oz; syrups 0.25–0.5 oz total; mixers 1–4 oz total
- Shots: base 1.0–1.5 oz total; layered order by density hints
- Method templates: shake 10–12s, stir 20–30s; egg white = dry-shake then wet-shake

## Export
- Single-page **SVG** card (title, method, ingredients+volumes, steps, rating, date)


## Accessibility
- Contrast ≥ 4.5:1, focus order logical, 44px touch targets, motion/sound toggles
