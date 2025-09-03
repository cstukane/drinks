> Implement lightweight, offline dice animations that feel real enough for users who recognize d4/d6/d8/d10/d12/d20—without full physics. Outcome is chosen **before** animation via crypto RNG; animation is a **reveal**, not the RNG itself.

---

## 1) Objective

Create a reusable animation module that:

* Shows a **polyhedral die** (closest standard shape to the pool size).
* Plays a short, convincing **tumble** (no readable final face).
* **Overlays** the final result as a large number with a small **dN** badge (or **🃏**).
* Works **offline** and on mobile.
* Falls back gracefully if WebGL or animations are unavailable.

---

## 2) Scope & Constraints

* **In scope (Phase 3):**

  * three.js keyframed tumble for **d4/d6/d8/d12/d20** (d10 optional).
  * Overlay reveal: big **k** + small **dN** (or 🃏).
  * `prefers-reduced-motion` compliant.
  * Fallback path (no-WebGL): generic **Lottie** tumble **or** number-flip.
* **Out of scope (Phase 3):**

  * Full physics (cannon-es/ammo.js) — **Phase 4/5**.
  * Per-result/per-N video assets.

**Performance budgets**

* First load animation code ≤ **200KB** gz total (three.min.js \~100–130KB + our code).
* One roll ≤ **1.2s**; 60 fps target during roll; stop rendering after reveal.

---

## 3) Visual Behavior

1. **Choose outcome first** (CSPRNG) from **allowed** candidates.
2. **Map N to a die shape** (representative; see §6).
3. Render a **short 3D tumble**:

   * Multiple spins on X/Y with small Z wobble.
   * Convincing ease-out (weighty feel).
   * End on an **ambiguous pose** (no readable face).
4. **Overlay** the result:

   * Large: `k` or `🃏`
   * Small badge: `dN` (or `k/N` if you prefer)
   * Quick 150–180ms bounce (skip if reduced motion).
5. Emit “done” event so the state machine can **lock** the pick.

**Dealer’s Choice (🃏):** show 🃏 instead of a number; immediately open manual-pick modal.

---

## 4) Flow & RNG Interplay

* RNG lives **outside** animation.
* Build **allowed set** (post hard-bans from prior picks).
* `N = allowed.length; k ∈ [1..N]` (weighted if needed); `winner = allowed[k-1]`.
* Pass `{N, k}` (or `'joker'`) to the animation.

---

## 5) Public API (module)

**File:** `/js/anim.js`

```ts
type Shape = 'd4'|'d6'|'d8'|'d10'|'d12'|'d20';

interface RollOpts {
  parent: HTMLElement;     // mount target (position:relative wrapper)
  N: number;               // candidate count (>=1)
  k: number | 'joker';     // 1..N or 'joker'
  shape?: Shape;           // optional override; default from N→shape map
  durationMs?: number;     // default 1000–1200
  theme?: 'dark'|'light';  // affects overlay contrast
}

export async function roll3D(opts: RollOpts): Promise<void>;

// Optional: fallback if WebGL unavailable
export async function rollFallback(opts: { parent: HTMLElement; N: number; k: number|'joker' }): Promise<void>;
```

**State machine usage**

1. Compute allowed + `k`.
2. Call `await roll3D({ parent, N, k })` (auto-maps shape).
3. On resolve, **lock** the result.

---

## 6) Mapping N → Shape

Use the closest familiar polyhedron; badge still shows the true `dN`.

| N (candidates) | Shape                      |
| -------------- | -------------------------- |
| 1–4            | d4                         |
| 5–7            | d6                         |
| 8–9            | d8                         |
| 10–11          | d10 *(optional; else d20)* |
| 12–16          | d12                        |
| >16            | d20                        |

> We are **not** rendering 14-sided geometry; for N=14 you’ll render **d12** or **d20** (configurable), and badge `d14`.

---

## 7) Implementation Details

### 7.1 three.js scene (tiny)

* Single reusable **canvas** and scene (created on first use; re-used per roll).
* **Camera:** Perspective FOV 40°, positioned slightly above and angled 15–20° down.
* **Lights:** `HemisphereLight` + `DirectionalLight` (soft shadows optional).
* **Material:** `MeshStandardMaterial` with roughness \~0.35–0.5, metalness 0.1–0.2.
  Add **EdgesGeometry** lines to hint bevels; optional small normal map (5–10KB) to sell plastic/resin.
* **Die meshes:**

  * d4: `TetrahedronGeometry(r,0)`
  * d6: `BoxGeometry(w,h,d)` *(optionally swap to a tiny beveled glTF \~10–30KB)*
  * d8: `OctahedronGeometry(r,0)`
  * d12: `DodecahedronGeometry(r,0)`
  * d20: `IcosahedronGeometry(r,0)`
  * d10 (optional): import a **pentagonal trapezohedron** glTF (\~10–20KB). If omitted, use d20 visual.

### 7.2 Keyframed tumble

* Precompute **3–5 rotation paths** (arrays of quaternions) for variation.
* Build an **easing** timeline:

  * 0–70%: lively spin (large angular velocity).
  * 70–100%: decelerate to an **ambiguous** orientation (no face square to camera).
* Add small **position jitter** (few px) for hand-held vibe.
* Total duration: **1000–1200ms** (configurable).

### 7.3 Overlay UI

* Absolute-positioned overlay inside `parent`.
* Large number label (or 🃏); smaller **dN** chip below/right.
* 150–180ms scale/bounce; disable if `prefers-reduced-motion`.
* Ensure **color contrast ≥ 4.5:1** over the canvas.

### 7.4 Reduced motion & fallback

* If `matchMedia('(prefers-reduced-motion: reduce)')`:
  Skip rendering; just **fade in** overlay within 150ms.
* If WebGL not supported or renderer errors:
  Call `rollFallback`:

  * Option **A**: play a generic **Lottie** tumble (single JSON), then overlay result.
  * Option **B**: **number flip** (cycle 600–900ms through `1..N`, then reveal `k`).

---

## 8) Assets

* **three.min.js** (bundled locally; no CDN).
* Optional **glTF** for bevelled d6 or d10 (≤30KB each).
* Optional **Lottie** JSON `dice-roll-generic.json` (single asset) for fallback.
* No per-result assets.

---

## 9) CSS Hooks (add to theme)

```css
.roll-wrap { position: relative; width: 96px; height: 96px; }
.roll-overlay {
  position:absolute; inset:0; display:grid; place-items:center;
  font: 800 34px/1 system-ui; opacity:0; transition: opacity .18s ease;
}
.roll-overlay .badge { font: 600 12px/1 system-ui; opacity:.85; margin-top:6px; }
.roll-overlay.reveal { opacity:1; animation: roll-bounce .16s ease-out; }
@keyframes roll-bounce { 0%{transform:scale(1)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
@media (prefers-reduced-motion: reduce) { .roll-overlay { transition:none; animation:none } }
```

---

## 10) Acceptance Criteria

1. **Outcome first**: animation reveals precomputed `k` from allowed candidates.
2. **Shape mapping** follows §6; badge shows the true `dN`.
3. **Ambiguous end**: final 3D frame does not present a readable face.
4. **Dealer’s Choice** reveals **🃏** and opens manual-pick modal.
5. **Reduced motion**: no spin; reveal in ≤150ms.
6. **Fallback**: when WebGL is unavailable, a non-3D path runs and reveals `k`.
7. **Performance**: roll completes in ≤1.2s; renderer stops; CPU/GPU idle after reveal.
8. **Mobile**: works smoothly on mid-range phones; no crashes; overlay readable.

---

## 11) Task List (for coder)

* [ ] Add `/js/anim.js` with `roll3D(opts)` + `rollFallback(opts)`.
* [ ] Add `/css/` rules from §9; ensure dark theme contrast.
* [ ] Add three.js to `/js/vendor/three.min.js` (no CDN).
* [ ] Implement scene singleton, mesh factory for d4/d6/d8/d12/d20 (optional d10 glTF).
* [ ] Implement 3–5 quaternion keyframe paths + easing interpolation.
* [ ] Implement overlay reveal + `prefers-reduced-motion` branch.
* [ ] Implement WebGL capability check → fallback path.
* [ ] Wire into state machine: compute `N,k`; `await roll3D({parent,N,k})`; lock result on resolve.
* [ ] Add unit/integration tests for: reduced-motion path, fallback, shape mapping, and overlay content.
* [ ] Perf check on mobile: ensure ≤1.2s, renderer stops post-reveal.

---

## 12) Notes & Options

* If you don’t want to ship d10 geometry now, map 10–11 to **d12** or **d20** visual and keep the badge honest (`d10`/`d11`).
* For extra realism later, swap d6 `BoxGeometry` to a small **beveled** glTF; the edge highlight alone sells the look.
* Keep the **overlay** authoritative—users should never need to read a face in the 3D view.

---

**Hand-off rule:** If any part of this spec conflicts with existing reroll policy, hard-ban timing, or accessibility requirements, **stop and ask** before proceeding.
