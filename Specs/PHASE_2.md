# PHASE 2 — Hero Component

## Sprint Goal

Build the JUANEMO variable typography hero — the centerpiece of the entire site. This is the most technically complex component and the one that must feel perfect. The word "JUANEMO" should fill the viewport, respond to its container, change character on each load, and compress gracefully on scroll.

## Status: `NOT STARTED`

## Depends On: Phase 1 (complete and approved)

---

## Prerequisites

- Phase 1 is complete: project scaffolded, tokens in place, fonts loaded, lib files ready
- Read `GOALS.md` §"The Font — Roboto Flex" — understand that the mood system is the creative concept, not a feature
- Read `DESIGN_SYSTEM.md` §2 (Hero — Roboto Flex) and §3 (Mood System) — every axis value is specified
- Read `TRD.md` §"Variable Font Implementation" — the resize, scroll, and fitText code patterns are defined

---

## Task List

### 2.1 — Create Hero Component Shell
- [ ] Create `components/Hero.tsx` and `components/Hero.module.css`
- [ ] Render "JUANEMO" as a single `<h1>` or `<div>` — **real DOM text**, not SVG, not canvas, not an image
- [ ] Apply Roboto Flex via `font-family: 'Roboto Flex Variable', sans-serif`
- [ ] `text-transform: uppercase`
- [ ] `letter-spacing: -0.04em`
- [ ] `line-height: 0.9`
- [ ] `color: var(--color-text-muted)` — this is **Dun**, not Bone. Critical.
- [ ] Full `font-variation-settings` driven by CSS custom properties (all 9 axes from globals.css)
- [ ] `aria-label="Juanemo"` for accessibility
- [ ] Container height: `--hero-height` (50vh) on initial load
- [ ] Container width: full viewport width, respecting `--page-margin`

### 2.2 — Viewport-Responsive Width Axis
- [ ] Import or use `updateHeroAxes()` from `lib/heroListeners.ts`
- [ ] On mount: call `updateHeroAxes()` to set initial `wdth` and `opsz` based on current viewport
- [ ] On resize: call debounced `updateHeroAxes()` at ~60fps (16ms debounce)
- [ ] Mapping: viewport 320px → `wdth: 25`, `opsz: 8` ... viewport 1920px → `wdth: 151`, `opsz: 144`
- [ ] Linear interpolation between min and max. Clamped at bounds.
- [ ] Updates `:root` CSS custom properties `--hero-wdth` and `--hero-opsz`

### 2.3 — FitText Edge-to-Edge
- [ ] Import or use `fitHeroText()` from `lib/fitText.ts`
- [ ] On mount: run fitText to make "JUANEMO" fill the container width exactly
- [ ] On resize (after axis update): re-run fitText
- [ ] Binary search algorithm: 20 iterations, range 10–500px, compare `el.scrollWidth` to `container.clientWidth`
- [ ] Must work at every viewport from 320px to 2560px — no overflow, no gap
- [ ] The text should feel like it _belongs_ to its container at every width

### 2.4 — Scroll Compression
- [ ] Import or use `updateHeroScroll()` from `lib/heroListeners.ts`
- [ ] Attach scroll listener with `requestAnimationFrame`
- [ ] Map scroll 0–300px to `--scroll-progress` (0–1), clamped
- [ ] Animate these properties via CSS custom properties:
  | Property | scroll = 0 | scroll = 300px |
  |---|---|---|
  | `--hero-wght` | 900 | 500 |
  | `--hero-grad` | mood value | 0 (fade GRAD back toward zero) |
  | `letter-spacing` | -0.04em | -0.02em |
  | `opacity` | 1 | 0.85 |
  | `font-size` | fills 50vh (fitText result) | ~5rem |
- [ ] Hero remains visible as a persistent compact header after full compression
- [ ] Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (`--ease-out-expo`)
- [ ] Transition on font-size: 0ms (immediate). Transition on opacity: 80ms ease.

### 2.5 — Bittersweet Accent Rule
- [ ] Single `<hr>` or `<div>` styled as `.accent-rule`
- [ ] 2px height, `background: var(--color-accent)` (#F25C54)
- [ ] Full width (or a structurally considered partial width)
- [ ] Positioned at a significant point in the hero composition — below the JUANEMO text or between text and the content below
- [ ] This is the **only** use of Bittersweet in the hero. Do not apply it to text or any other element.

### 2.6 — Mood System Verification
- [ ] Confirm the `<head>` mood script (from Phase 1) sets CSS vars before Hero mounts
- [ ] Refresh the page 10+ times — each of the 5 moods should appear and look visibly distinct:
  - **SHARP**: High contrast, tight counters, architectural
  - **AIRY**: Open counters, spacious, calm
  - **HEAVY**: Maximum stroke weight, dense, powerful
  - **REFINED**: Balanced, slight slant, elegant
  - **PUNCHY**: High caps, energetic, direct
- [ ] No flash or visible axis transition on load — mood must be set before first paint
- [ ] GRAD value from mood should correctly fade to 0 on scroll

### 2.7 — Responsive QA
- [ ] Test at these viewports (adjust browser window or use DevTools):
  - 320px (mobile) — `wdth: 25`, text still fills width, still single line
  - 375px (iPhone) — no overflow
  - 768px (tablet) — `wdth: ~80`, comfortable and bold
  - 1280px (desktop) — `wdth: ~130`, extended
  - 1920px (wide) — `wdth: 151`, ultra-extended
  - 2560px (ultrawide) — no break, text fills or is contained gracefully
- [ ] Scroll compression works at all viewports
- [ ] No horizontal overflow at any width

### 2.8 — Accessibility & Reduced Motion
- [ ] `aria-label="Juanemo"` present on hero text element
- [ ] Screen reader can announce the text
- [ ] `prefers-reduced-motion: reduce` disables all transitions on the hero
- [ ] With reduced motion, scroll still works (values change, but transitions are instant)

---

## Definition of Done

- [ ] "JUANEMO" fills the top half of viewport edge-to-edge on load
- [ ] Resizing the browser smoothly adjusts the letterforms (width axis responds in real time)
- [ ] Scrolling compresses the hero smoothly into a compact state
- [ ] Refreshing produces noticeably different letterform moods (test 5+ refreshes)
- [ ] Accent rule is visible, correctly colored (#F25C54), and positioned with intention
- [ ] Works at 320px, 768px, 1280px, 1920px, 2560px — no breaks, no overflow
- [ ] `prefers-reduced-motion` disables transitions
- [ ] `npm run build` passes

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
_None yet_

### Problems Encountered
_None yet_

### Deviations from Spec
_None yet_

### Items for Scrummaster
_None yet_

---

## Completion Summary

| Field | Value |
|---|---|
| Date completed | _pending_ |
| All tasks done? | _pending_ |
| Build passing? | _pending_ |
| Deviations? | _pending_ |
| New items for backlog? | _pending_ |
