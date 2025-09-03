# TESTS.md

## Viewports
- iPhone 11 Pro (390×844), Pixel 6 (412×915), iPhone 15 Pro

## Must-Pass Cases (Happy Path)
1. **New Drink → finish build** without network; SVG export downloads; share code link reconstructs recipe
2. **New Shot (Layered)** builds a layered shot with density ordering in steps
3. **Dealer’s Choice (🃏)** appears as a face and opens manual-pick modal; selection locks and proceeds

## Rules & Reroll
4. **Hard-ban timing**: Select **Wine** (spirits), then proceed to Mixers → **Coffee** is excluded from candidates
5. **No pre-hide**: Wine is visible in initial Spirits pool (hard bans do not pre-filter)
6. **Soft downweight**: With **Cream Liqueur** selected, **Beer** can still be drawn but occurs less often (stat check over 500 rolls)
7. **Reroll-last only**: Reroll button is enabled *only* immediately after a pick; disabled after advancing
8. **No-solution guard**: Force a scenario where all Mixer candidates are banned → app reverts one step and explains

## Export & Share Code
9. **SVG card** contains title, method, ingredients with volumes, steps, rating (if Phase 2), date, and share code
10. **Round-trip**: Export → copy URL → paste into a fresh session → recipe reconstructs accurately

## Accessibility
11. Focus order follows step sequence; all controls ≥ 44px; contrast ≥ 4.5:1; motion/sound toggles work
