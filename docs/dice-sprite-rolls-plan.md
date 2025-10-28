# Dice Roll Animation Without three.js — Sprite/Video Plan

Goal: Deliver a realistic, device-friendly dice roll animation without relying on WebGL/three.js. The animation must:
- Look like a physical die roll (spin/tumble),
- Land on a deterministic face that matches the RNG pick,
- Work offline/PWA, across mobile/desktop, including DevTools device emulation.

## Approach Options

1) Sprite Sheets (Recommended)
- Pre-rendered sprite sheets for each die type (D4, D6, D8, D10, D12, D20) and final face (1..N).
- Animate via CSS `steps()` or JS timer by shifting background-position across frames.
- Deterministic landing: choose the sprite sheet for the target face and play it once to completion.
- Pros: Lightweight, offline, no runtime dependencies; consistent visual; easy to cache.
- Cons: Requires asset prep (one sheet per final face x die type).

2) Short Video Clips (WebM/MP4)
- Pre-rendered videos (1–1.5s) per die type and final face.
- Play the video and pause on the last frame; then optionally overlay dN badge.
- Pros: Most realistic; great motion blur/lighting.
- Cons: Larger assets; per-codec compatibility considerations; slightly heavier caching.

3) Lottie (bodymovin JSON)
- Vector/rigged dice animations exported as JSON; use `lottie-web` to play.
- Requires assets to include segments that land on each face (or parameterized control).
- Pros: Small-ish assets; vector scaling; no WebGL.
- Cons: Requires suitable Lottie assets; realism depends on design.

Given offline/PWA constraints and determinism, Sprite Sheets provide the best balance.

## Asset Spec (Sprite Sheets)

- Directory layout:
  - `assets/dice/`
    - `d4/roll-face-1.webp`, ..., `roll-face-4.webp`
    - `d6/roll-face-1.webp`, ..., `roll-face-6.webp`
    - `d8/roll-face-1.webp`, ..., `roll-face-8.webp`
    - `d10/roll-face-1.webp`, ..., `roll-face-10.webp`
    - `d12/roll-face-1.webp`, ..., `roll-face-12.webp`
    - `d20/roll-face-1.webp`, ..., `roll-face-20.webp`
- Format: WebP lossless or PNG; recommended size: 512x512 per frame; sheet grid (e.g., 6x8 frames).
- Frames per sheet: 30–48 frames targeting ~1.0–1.3s at 30–40 fps.
- Naming: `roll-face-{F}.webp` means the animation ends on face F.

Optional manifest file:
- `assets/dice/manifest.json` containing:
  - `{ "d6": { "frames": 36, "cols": 6, "rows": 6, "fps": 30 }, ... }`

## Runtime API

Add a sprite-based roll function that mirrors `roll3D`:

```
// animSprite.js (or inside anim.js)
export async function rollSprite({ parent, die, face, durationMs = 1100 }) {
  // die in {4,6,8,10,12,20}; face in 1..die
  // 1) Create a container <div class="dice-sprite" style="width:512px;height:512px"> with background-image set to sheet path
  // 2) Apply CSS animation with steps(frames) over durationMs
  // 3) On animation end, resolve()
}
```

CSS (example):
```
.dice-sprite { background-size: calc(100% * COLS) calc(100% * ROWS); }
.dice-sprite.animate { animation: dice-steps var(--duration) steps(var(--frames)) forwards; }
@keyframes dice-steps { from { background-position: 0 0 } to { background-position: 100% 100% } }
```

Asset selection helper:
```
function chooseDieFaces(Ntotal) { return Ntotal<=4?4:Ntotal<=6?6:Ntotal<=8?8:Ntotal<=10?10:Ntotal<=12?12:20; }
```

Joker handling:
- If `pickIndex === N_total` (Joker last), still play a sprite sheet (e.g., generic roll-end frame), then cross-fade to `assets/joker.svg`, show for 1–2s, then open manual selection.

## Integration Points

- Prefer Sprite path when:
  - THREE is missing or WebGL unsupported, or
  - a new `settings.preferSpriteRolls` flag is true.

- Replace calls to `roll3D` with a wrapper:
```
async function rollVisualCompat({ parent, N_total, pickIndex, durationMs }) {
  const die = chooseDieFaces(N_total);
  const isJoker = pickIndex === N_total;
  const face = isJoker ? 1 : mapPickToFace(pickIndex, N_total, die); // deterministic mapping
  if (window.THREE && devIsWebGLSupported() && !settings.preferSpriteRolls) {
    await roll3D({ parent, N: die, k: isJoker ? 'joker' : face, durationMs });
  } else {
    await rollSprite({ parent, die, face, durationMs });
    if (isJoker) await fadeToJokerOverlay(parent);
  }
}
```

- Counts (How Many): always `die=4`, `face=cryptoRoll(4)` shown via sprite (or 3D if available).

## Download Checklist

- Download/buy sprite sheets or videos per die+face, license for offline bundling.
- Place assets under `assets/dice/{die}/roll-face-{n}.webp`.
- (Optional) Add `assets/dice/manifest.json` with frames/cols/rows/fps per die.
- Update `pwa/sw.js` cache list to include `assets/dice/**`.

## Tasks & Sequencing

1. Add sprite runtime (animSprite: rollSprite, fadeToJokerOverlay, mapPickToFace)
2. Add CSS steps animation and base class
3. Add wrapper `rollVisualCompat` and integrate into Method / How Many / Batch / Secondary flows
4. Add Settings flag to force sprite path for testing
5. Add assets and manifest; tune duration/frames
6. Update SW cache list; quick perf check on low-end devices

## Acceptance Criteria

- On Roll, a realistic die sprite animation plays; it lands deterministically on the selected face.
- Joker rolls show a die, then fade to Joker card and enter manual selection.
- Works on mobile, desktop, and DevTools device emulation without WebGL.
- PWA offline cache includes all required assets.

