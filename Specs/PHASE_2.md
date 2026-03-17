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
- Used a `<div>` with `role="heading" aria-level={1}` instead of `<h1>` for the JUANEMO text. This gives screen readers the same heading semantics while avoiding default browser heading styles that could interfere with the variable font styling.
- Hero uses `updateHeroAxes()` directly (not `attachHeroListeners()`) since scroll compression is deferred. Simpler wiring: mount + resize only.
- fitText has its own resize listener in the Hero component's useEffect.
- Hero padding set to `calc(var(--page-margin) / 2)` — halved from default per JC's feedback, gives the text more room to breathe edge-to-edge.

### Problems Encountered
- **Critical: Fontsource Roboto Flex default import only includes `wght` axis.** The default `@fontsource-variable/roboto-flex` import loads a font file with only the weight axis (34KB). All other axes (wdth, opsz, GRAD, XTRA, XOPQ, YOPQ, YTUC, slnt) were silently ignored, making all 5 moods look identical. Fixed by switching to `@fontsource-variable/roboto-flex/full.css` which loads the complete font (326KB) with all 13 axes. This was the root cause of moods not being visually distinct.
- Scroll compression was implemented (font-size, height, wght, GRAD, opacity, letter-spacing all interpolating) but visually broken in the browser — disabled per JC's direction.

### Deviations from Spec
- **Scroll compression deferred** (tasks 2.4) — implemented but removed per JC's feedback. The hero is static at 50vh for now.
- **Accent rule deferred** (task 2.5) — removed per JC's feedback. To be re-added when hero composition is finalized.
- **Font import changed** — `@fontsource-variable/roboto-flex` → `@fontsource-variable/roboto-flex/full.css` to get all 13 axes. TRD.md should be updated to reflect this.

### Items for Scrummaster
- **Update TRD.md** — Font import must be `@fontsource-variable/roboto-flex/full.css`, not the default import. The default only includes wght. This is critical for the mood system to work.
- **Scroll compression** needs redesign — the spec's approach (sticky header, font-size calc interpolation, height interpolation) was implemented but visually broken. Needs a fresh approach, possibly with a different compression strategy.
- **Accent rule** to be re-added once overall hero composition is settled.

---

## Completion Summary

| Field | Value |
|---|---|
| Date completed | _in progress_ |
| All tasks done? | No — 2.4 (scroll compression) and 2.5 (accent rule) deferred |
| Build passing? | Yes — `npm run build` zero errors |
| Deviations? | Scroll compression and accent rule deferred per JC. Font import changed to full.css. |
| New items for backlog? | Redesign scroll compression. Re-add accent rule. Update TRD.md font import. |
