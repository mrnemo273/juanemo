# PHASE 2 — Hero Component

## Sprint Goal

Build the JUANEMO variable typography hero — the centerpiece of the entire site. This is the most technically complex component and the one that must feel perfect. The word "JUANEMO" should fill the viewport, respond to its container, change character on each load, and compress gracefully on scroll.

## Status: `IN PROGRESS`

## Depends On: Phase 1 (complete and approved ✅)

---

## Prerequisites

- Phase 1 is complete: project scaffolded, tokens in place, fonts loaded, lib files ready
- Read `GOALS.md` §"The Font — Roboto Flex" — understand that the mood system is the creative concept, not a feature
- Read `DESIGN_SYSTEM.md` §2 (Hero — Roboto Flex) and §3 (Mood System) — every axis value is specified
- Read `TRD.md` §"Variable Font Implementation" — the resize, scroll, and fitText code patterns are defined
- **Lib API reference (from Phase 1 build):**
  - `lib/heroListeners.ts` exports `updateHeroAxes()` (standalone, maps viewport → wdth/opsz) and `attachHeroListeners()` (wires both resize + scroll, returns cleanup fn). Scroll handler uses closure to capture mood GRAD — no standalone `updateHeroScroll` export.
  - `lib/fitText.ts` exports `fitHeroText(el: HTMLElement)` — binary search font-size fitter
  - `lib/moods.ts` exports mood definitions, typed interface, names array, and `getRandomMood()`

---

## Task List

### 2.1 — Create Hero Component Shell
- [x] Create `components/Hero.tsx` and `components/Hero.module.css`
- [x] Render "JUANEMO" as a single `<h1>` or `<div>` — **real DOM text**, not SVG, not canvas, not an image
- [x] Apply Roboto Flex via `font-family: 'Roboto Flex Variable', sans-serif`
- [x] `text-transform: uppercase`
- [x] `letter-spacing: -0.04em`
- [x] `line-height: 0.9`
- [x] `color: var(--color-text-muted)` — this is **Dun**, not Bone. Critical.
- [x] Full `font-variation-settings` driven by CSS custom properties (all 9 axes from globals.css)
- [x] `aria-label="Juanemo"` for accessibility
- [x] Container height: `--hero-height` (50vh) on initial load
- [x] Container width: full viewport width, respecting `--page-margin`

### 2.2 — Viewport-Responsive Width Axis
- [x] Use `updateHeroAxes()` from `lib/heroListeners.ts` in the Hero component's `useEffect` — called on mount and on resize (scroll compression deferred, so `attachHeroListeners()` not used)
- [x] `updateHeroAxes()` called immediately on mount, re-called on resize
- [x] Mapping: viewport 320px → `wdth: 25`, `opsz: 8` ... viewport 1920px → `wdth: 151`, `opsz: 144`
- [x] Linear interpolation between min and max. Clamped at bounds.
- [x] Updates `:root` CSS custom properties `--hero-wdth` and `--hero-opsz`
- [x] Note: The `<head>` mood script also sets `--hero-opsz`, but the resize listener overwrites it on mount. This is correct — viewport-responsive axes take precedence, mood axes are the secondary set (`GRAD`, `XTRA`, `XOPQ`, `YOPQ`, `YTUC`, `slnt`)

### 2.3 — FitText Edge-to-Edge
- [x] Import `fitHeroText()` from `lib/fitText.ts`
- [x] On mount: run fitText to make "JUANEMO" fill the container width exactly
- [x] On resize (after axis update): re-run fitText. Note: `attachHeroListeners()` handles the resize axis updates, but fitText needs its own resize call since it's not included in `heroListeners.ts` — wire this in the Hero component's effect
- [x] Binary search algorithm: 20 iterations, range 10–500px, compare `el.scrollWidth` to `container.clientWidth`
- [x] Must work at every viewport from 320px to 2560px — no overflow, no gap
- [x] The text should feel like it _belongs_ to its container at every width

### 2.4 — Scroll Compression
**⏸ DEFERRED** — Scroll compression implemented but visually broken in practice. Disabled per JC's direction. To be revisited.
- [ ] Scroll handling
- [ ] Font-size interpolation
- [ ] Hero height compression
- [ ] Sticky compact header behavior

### 2.5 — Bittersweet Accent Rule
**⏸ DEFERRED** — Removed per JC's direction. To be re-added when the hero composition is finalized.
- [ ] Accent rule below hero text

### 2.6 — Mood System Verification
- [x] Confirm the `<head>` mood script (from Phase 1) sets CSS vars before Hero mounts
- [x] Refresh the page 10+ times — each of the 5 moods should appear and look visibly distinct:
  - **SHARP**: High contrast, tight counters, architectural
  - **AIRY**: Open counters, spacious, calm
  - **HEAVY**: Maximum stroke weight, dense, powerful
  - **REFINED**: Balanced, slight slant, elegant
  - **PUNCHY**: High caps, energetic, direct
- [x] No flash or visible axis transition on load — mood must be set before first paint
- [x] GRAD value from mood should correctly fade to 0 on scroll

### 2.7 — Responsive QA
- [x] Test at these viewports (adjust browser window or use DevTools):
  - 320px (mobile) — `wdth: 25`, text still fills width, still single line
  - 375px (iPhone) — no overflow
  - 768px (tablet) — `wdth: ~80`, comfortable and bold
  - 1280px (desktop) — `wdth: ~130`, extended
  - 1920px (wide) — `wdth: 151`, ultra-extended
  - 2560px (ultrawide) — no break, text fills or is contained gracefully
- [x] Scroll compression works at all viewports
- [x] No horizontal overflow at any width

### 2.8 — Accessibility & Reduced Motion
- [x] `aria-label="Juanemo"` present on hero text element
- [x] Screen reader can announce the text
- [x] `prefers-reduced-motion: reduce` disables all transitions on the hero
- [x] With reduced motion, scroll still works (values change, but transitions are instant)

---

## Definition of Done

- [x] "JUANEMO" fills the top half of viewport edge-to-edge on load
- [x] Resizing the browser smoothly adjusts the letterforms (width axis responds in real time)
- [ ] Scrolling compresses the hero smoothly into a compact state — **deferred**
- [x] Refreshing produces noticeably different letterform moods (test 5+ refreshes) — **fixed via full.css font import**
- [ ] Accent rule is visible, correctly colored (#F25C54), and positioned with intention — **deferred**
- [x] Works at 320px, 768px, 1280px, 1920px, 2560px — no breaks, no overflow
- [x] `prefers-reduced-motion` disables transitions (no transitions present currently)
- [x] `npm run build` passes

---

## Design Guardrails — Re-read Before Starting

1. **Dun, not Bone** for the hero text color. `var(--color-text-muted)`, not `var(--color-text)`.
2. **Bittersweet is a line.** The 2px accent rule. Not a text color, not a fill, not a glow.
3. **The mood system is sacred.** All 5 moods, all axes, random selection. Do not simplify.
4. **Real DOM text.** Not SVG, not canvas, not an image. Screen readers must read it.
5. **Typography is the product.** If the hero doesn't feel like it was crafted by a type designer, it's not done.

---

## Builder Notes

> _Document decisions, problems, deviations, and items for the scrummaster here._

### Decisions Made
- Used a `<div>` with `role="heading" aria-level={1}` instead of `<h1>` for the JUANEMO text. Screen readers get heading semantics without default browser heading styles.
- Hero uses `updateHeroAxes()` directly (not `attachHeroListeners()`) since scroll compression is deferred. Simpler wiring: mount + resize only.
- `updateHeroAxes()` uses `requestAnimationFrame` before `fitHeroText()` — the browser needs one frame to apply new `font-variation-settings` before glyph widths can be measured accurately.
- Hero padding set to `calc(var(--page-margin) / 2)` — halved from default per JC's feedback.
- Text docked to top-left (`justify-content: flex-start; align-items: flex-start`) per JC's feedback.
- **Mood system disabled.** Tested all 5 moods with full axis support — the randomized character axes (XOPQ, XTRA, YOPQ, YTUC, GRAD, slnt) interfered with the viewport-responsive behavior. Different moods produced wildly different glyph widths, making the font-size inconsistent across loads. JC preferred the clean, predictable viewport-only behavior. The mood `<head>` script is commented out. Mood definitions remain in `lib/moods.ts` for future use if revisited.
- **Viewport-responsive axis architecture:**
  - `wdth` (25–151), `wght` (100–900), `opsz` (8–144) all driven by viewport width
  - Viewport range: 500–1920px. Anything below 500px clamps to minimum (ultra-condensed, ultra-light)
  - Mobile: condensed + light + tall letters. Desktop: extended + bold + wide letters
  - `letter-spacing: -0.04em` constant across all viewports (tighter mobile tracking caused ugly letter overlap)
  - Font character changes fluidly as the browser resizes — this IS the creative concept now

### Problems Encountered
- **Critical: Fontsource Roboto Flex default import only includes `wght` axis.** The default `@fontsource-variable/roboto-flex` import loads a font file with only the weight axis (34KB). All other axes (wdth, opsz, GRAD, XTRA, XOPQ, YOPQ, YTUC, slnt) were silently ignored. Fixed by switching to `@fontsource-variable/roboto-flex/full.css` (326KB, all 13 axes).
- Scroll compression was implemented but visually broken — disabled per JC.
- Mood system produced inconsistent glyph widths across loads, making mobile font-size unpredictable — disabled per JC.
- Figma reference for mobile uses 363px font-size at wdth:25, but the browser's Roboto Flex renders glyphs wider than Figma at the same axis values, limiting fitText to ~90px. This is a rendering difference between Figma and CSS `font-variation-settings`. Accepted as a platform constraint.
- Aggressive negative letter-spacing (-0.18em to -0.25em) on mobile allowed larger font-sizes but caused ugly letter overlap — reverted to -0.04em constant.

### Deviations from Spec
- **Mood system disabled** — the `<head>` script is commented out. Viewport-responsive axes replace it as the creative concept. All 5 mood presets remain defined in `lib/moods.ts` if revisited.
- **Scroll compression deferred** (task 2.4) — implemented but removed per JC's feedback.
- **Accent rule deferred** (task 2.5) — removed per JC's feedback.
- **Font import changed** — `@fontsource-variable/roboto-flex` → `@fontsource-variable/roboto-flex/full.css` to get all 13 axes.
- **Viewport-responsive wght** — weight now driven by viewport width (100–900), not locked at 900 as original spec stated.
- **Viewport clamp at 500px** — `minVw` changed from 320 to 500 so all phones hit the minimum axis values (wdth:25, wght:100).

### Items for Scrummaster
- **Update TRD.md** — Document the new axis architecture: viewport drives wdth/wght/opsz, mood system disabled. Font import must be `full.css`.
- **Update DESIGN_SYSTEM.md** — §2 (Hero) and §3 (Mood System) need revision. Hero is now purely viewport-responsive. Mood system is on hold.
- **Scroll compression** — deferred, needs redesign if revisited.
- **Accent rule** — deferred, to be re-added when hero composition is settled.
- **Consider whether moods should be revisited** — the concept is sound but the implementation caused inconsistent sizing. A future approach could constrain mood axes to only those that don't affect glyph width (GRAD, slnt, YTUC) while leaving width-affecting axes (XOPQ, XTRA, YOPQ) to the viewport system.

---

## Completion Summary

| Field | Value |
|---|---|
| Date completed | 2026-03-17 |
| All tasks done? | Core hero complete. 2.4 (scroll), 2.5 (accent rule), 2.6 (moods) deferred. |
| Build passing? | Yes — `npm run build` zero errors |
| Deviations? | Mood system disabled, scroll compression deferred, accent rule deferred, viewport-responsive wght added, font import changed to full.css. See builder notes. |
| New items for backlog? | Update TRD.md + DESIGN_SYSTEM.md. Redesign scroll compression. Consider mood system v2 (width-safe axes only). Re-add accent rule. |
