# PHASE HERO V2 — Generative Per-Character Drift + Logo Component

## Sprint Goal

Replace the current static viewport-responsive hero with a generative per-character animation system. Each letter in JUANEMO independently drifts to random `wdth`/`wght`/`opsz` values on a timed cycle — shift, hold, shift. The wordmark is never the same twice. Additionally, create a small `<LogoMark>` component using the same generative system but frozen (static, randomized once per load) for use as a site-wide identity mark, anchored to the top-left corner of every page.

## Status: `READY`

## Depends On: Phase 3 (complete ✅)

---

## Prerequisites

- Phase 3 is complete: Hero, ProjectList, Footer rendered in `app/page.tsx`
- Read `Specs/GOALS.md` — understand that the generative behavior IS the creative concept. This is the Flash-era spirit: the website is the work.
- Read `Specs/DESIGN_SYSTEM.md` §2 (Hero — Roboto Flex), §8 (Font Loading — must use `full.css`)
- **Reference prototype:** `prototypes/hero-generative-pause.html` — this is the approved behavior. Open it to see exactly how the animation should look and feel.
- **Reference prototype:** `prototypes/hero-with-logo.html` — shows the logo component at multiple sizes + the hero animation together.

---

## Axis Randomization — Shared System

Both the Hero and LogoMark use the same axis randomization. These ranges are the source of truth:

```ts
const AXIS_RANGES = {
  wdth: { min: 25,  max: 151 },  // full width range
  wght: { min: 300, max: 900 },  // floor at 300 — letters must never vanish
  opsz: { min: 8,   max: 144 },  // optical size tracks with character
};
```

**Critical:** `wght` minimum is **300**, not 100. During prototyping, ultra-light + ultra-condensed letters nearly disappeared. 300 ensures every state has presence.

Each letter gets an independent random value for all three axes. The randomization function:

```ts
function randomAxes(): { wdth: number; wght: number; opsz: number } {
  return {
    wdth: Math.round(25 + Math.random() * (151 - 25)),
    wght: Math.round(300 + Math.random() * (900 - 300)),
    opsz: Math.round(8 + Math.random() * (144 - 8)),
  };
}
```

Applied to each character via `font-variation-settings`:
```ts
el.style.fontVariationSettings = `'wdth' ${axes.wdth}, 'wght' ${axes.wght}, 'opsz' ${axes.opsz}`;
```

---

## Task List

### HV2.1 — Create Shared Axis Utility

- [ ] Create `lib/generativeAxes.ts` (or add to existing lib):
  ```ts
  export const AXIS_RANGES = { wdth: { min: 25, max: 151 }, wght: { min: 300, max: 900 }, opsz: { min: 8, max: 144 } };
  export function randomAxes(): { wdth: number; wght: number; opsz: number };
  export function axisString(axes: { wdth: number; wght: number; opsz: number }): string;
  ```
- [ ] Both Hero and LogoMark import from this file — single source of truth for ranges

### HV2.2 — Rewrite Hero Component (Generative Drift + Hold)

- [ ] Replace current `components/Hero.tsx` with the per-character generative system
- [ ] `'use client'` component — uses `useEffect`, `useRef`
- [ ] Split "JUANEMO" into 7 individual `<span>` elements, each independently styled
- [ ] Each span gets `font-family: 'Roboto Flex Variable', sans-serif`, `text-transform: uppercase`, `color: var(--color-text-muted)` (Dun)
- [ ] Container: `role="heading" aria-level={1}`, `aria-label="Juanemo"` for accessibility
- [ ] **Remove** `fitText` integration — the generative system replaces the edge-to-edge fill approach. Text size uses `font-size: clamp(50px, 13vw, 200px)` for responsive scaling.
- [ ] **Remove** `updateHeroAxes()` and `attachHeroListeners()` usage — the per-character randomization replaces viewport-driven axes

#### Animation Cycle

The hero runs on a **two-phase cycle**: shift → hold → shift → hold.

- [ ] **Hold phase**: All letters sit still. User admires the current configuration. Duration: configurable, default **8 seconds** (spec as a constant, easy to tune).
- [ ] **Shift phase**: Each letter transitions to a new random axis state. Letters are **staggered** — 80ms between each letter start — for an organic, non-mechanical feel. Each letter's transition duration is `transDuration ± 200ms` for slight variation. Default transition duration: **1500ms**.
- [ ] **Easing**: `cubic-bezier(0.34, 1.56, 0.64, 1)` — this is the **spring** easing. It overshoots slightly and settles back. This is critical to the feel — the text pushes into its new state.
- [ ] CSS transition on each span: `font-variation-settings ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
- [ ] On initial load: each letter starts with a random state (no animation on first paint — just randomize immediately)
- [ ] The cycle starts with a hold (so the user sees the first configuration before anything moves)
- [ ] Clean up all timers on unmount (return cleanup function from `useEffect`)

#### Timing Constants (easy to tune)

```ts
const HOLD_DURATION = 8000;     // ms — how long the wordmark sits still
const TRANS_DURATION = 1500;    // ms — how long each letter takes to transition
const STAGGER = 80;             // ms — delay between each letter's transition start
```

### HV2.3 — Update Hero.module.css

- [ ] Hero container: centered on page, `min-height: var(--hero-height)` (50vh), flex centering
- [ ] Text docked to top-left: `justify-content: flex-start; align-items: flex-start` (per existing JC feedback)
- [ ] Padding: `calc(var(--page-margin) / 2)` (per existing JC feedback)
- [ ] Character spans:
  ```css
  .char {
    font-family: 'Roboto Flex Variable', sans-serif;
    text-transform: uppercase;
    font-size: clamp(50px, 13vw, 200px);
    letter-spacing: -0.03em;
    line-height: 0.85;
    color: var(--color-text-muted);
    display: inline-block;
    will-change: font-variation-settings;
  }
  ```
- [ ] No `white-space: nowrap` on the container — let the word wrap naturally if needed at very narrow viewports, or use `white-space: nowrap` with `overflow: hidden` if wrapping looks bad
- [ ] `prefers-reduced-motion`: disable transitions (instant state, no animation). The hold/shift cycle can still run — states just change instantly.

### HV2.4 — Create LogoMark Component (Static Generative)

- [ ] Create `components/LogoMark.tsx` and `components/LogoMark.module.css`
- [ ] **Not animated** — each letter is randomized once on mount, then frozen
- [ ] Props:
  ```ts
  interface LogoMarkProps {
    size?: number;      // font-size in px, default 22
    className?: string; // optional extra class
  }
  ```
- [ ] Renders "JUANEMO" as individual `<span>` elements within an `<a>` (links to `/`)
- [ ] Each span gets independent `randomAxes()` values on mount via `useEffect` + `useRef`
- [ ] `aria-label="Juanemo — home"`
- [ ] `'use client'` component (needs `useEffect` for randomization after hydration)
- [ ] **Important:** To avoid hydration mismatch, render with default/neutral axes on server, then randomize in `useEffect` on client. Or use `suppressHydrationWarning` on the spans.

#### Logo Styles

```css
.logoMark {
  display: inline-flex;
  align-items: baseline;
  gap: 0;
  text-decoration: none;
  cursor: pointer;
}
.logoChar {
  font-family: 'Roboto Flex Variable', sans-serif;
  text-transform: uppercase;
  line-height: 0.85;
  color: var(--color-text-muted);  /* Dun */
  letter-spacing: -0.02em;
}
```

### HV2.5 — Integrate LogoMark into Layout

- [ ] Add `<LogoMark>` to the **top-left corner** of the page — either in `app/layout.tsx` or `app/page.tsx`
- [ ] Position: fixed or sticky top-left, with `--page-margin` padding from edges
- [ ] The logo should sit above the hero content, always visible
- [ ] Default size: 22px (small, refined, doesn't compete with the hero)
- [ ] Consider: should it be in `layout.tsx` (visible on all pages including future experiment pages) or just `page.tsx` (home only)? **Recommendation: `layout.tsx`** so it's site-wide.
- [ ] Style the container:
  ```css
  .logoContainer {
    position: fixed;
    top: 16px;
    left: var(--page-margin);
    z-index: 50;
  }
  ```

### HV2.6 — Clean Up Old Hero Code

- [ ] The old `fitText` call in Hero can be removed — the generative system replaces it
- [ ] `lib/fitText.ts` can remain in the codebase (it may be useful for future experiments) but is no longer imported by Hero
- [ ] `lib/heroListeners.ts` — the `updateHeroAxes()` function is no longer used by Hero. Keep the file if scroll compression is revisited later, but Hero no longer imports it.
- [ ] Verify no unused imports remain

### HV2.7 — Build & Responsive QA

- [ ] `npm run build` passes with zero errors
- [ ] Test at 320px, 768px, 1280px, 1920px, 2560px:
  - Hero text is visible and readable at all widths
  - Animation cycle runs smoothly
  - Logo is visible top-left at all widths
  - No horizontal overflow
- [ ] Refresh 5+ times — each load produces a different initial state
- [ ] Verify the hold phase is clearly perceptible (text sits still for ~8s)
- [ ] Verify the shift phase stagger feels organic (letters don't all move at once)
- [ ] Verify spring easing overshoot is visible — letters should slightly bounce into their new state

---

## Definition of Done

- [ ] "JUANEMO" renders as 7 individually-animated characters
- [ ] Animation runs: hold (8s) → staggered shift (1.5s) → hold → shift...
- [ ] Spring easing produces visible overshoot on transitions
- [ ] Refreshing the page produces a different starting configuration
- [ ] `<LogoMark>` renders top-left, static, different on each page load
- [ ] `wght` never goes below 300 — no disappearing letters
- [ ] `prefers-reduced-motion` disables transition animations
- [ ] Works at 320px through 2560px
- [ ] `npm run build` passes

---

## Design Guardrails

1. **The generative drift IS the creative concept.** The wordmark is never the same twice. This replaces the viewport-responsive axis system and the mood system.
2. **Spring easing is critical.** `cubic-bezier(0.34, 1.56, 0.64, 1)` — the overshoot gives the text life. Do not use linear or standard easing.
3. **The hold matters as much as the shift.** Each configuration gets time to be admired. The stillness is part of the design.
4. **Stagger, don't synchronize.** 80ms between each letter's transition start. All letters moving at once looks mechanical.
5. **wght floor is 300.** No vanishing letters. Every state must have presence.
6. **Dun, not Bone** for the text color. `var(--color-text-muted)`.
7. **The logo is the hero in miniature.** Same DNA, same randomization, just frozen and small.

---

## Builder Notes

> _Document decisions, problems, deviations, and items for the scrummaster here._

### Decisions Made
- Used `suppressHydrationWarning` on character spans to avoid hydration mismatch from client-side randomization in useEffect
- Removed the commented-out mood script from layout.tsx `<head>` — the generative per-character system fully replaces it
- Kept `lib/fitText.ts` and `lib/heroListeners.ts` in the codebase untouched per spec (may be useful later)
- Added full-width scaling via `ResizeObserver` + `transform: scaleX()` — the word always fills the container width and rescales live during transitions as letter widths change (JC request)
- Increased hero size: font-size `clamp(60px, 17vw, 280px)`, hero min-height 70vh desktop / 40vh mobile (JC request)
- ProjectList redesigned per JC feedback: title color changed to Dun (`--color-text-muted`), sentence case (removed uppercase), font-weight thinned to 300, two-column layout (title+date left, description+CTA right on desktop), bigger mobile titles (36px), longer paragraph descriptions

### Problems Encountered
- None — clean implementation, build passed on first attempt

### Deviations from Spec
- HV2.4 (LogoMark) and HV2.5 (LogoMark integration) skipped per instructions — deferred to a later task
- Letter-spacing uses `-0.03em` (spec value) rather than the old `-0.04em` from the previous Hero
- Font-size increased from spec's `clamp(50px, 13vw, 200px)` to `clamp(60px, 17vw, 280px)` per JC request for bigger hero
- Hero min-height changed from spec's 50vh to 70vh desktop / 40vh mobile per JC feedback
- Added full-width scaling (not in original spec) — word always stretches to fill container via `scaleX()` transform with `ResizeObserver`
- ProjectList title weight changed from 500 to 300, color from `--color-text` to `--color-text-muted`, removed uppercase — per JC feedback
- ProjectList now uses two-column layout on desktop (title left, description right) — per JC feedback

### Items for Scrummaster
- LogoMark component (HV2.4, HV2.5) ready to be picked up as a separate task
- DESIGN_SYSTEM.md §9 Component Reference should be updated to reflect new Hero architecture (per-character generative drift, scaleX fitting, new timing constants) and ProjectList changes (two-column, sentence case, weight 300, Dun titles)
- Project descriptions in `data/projects.ts` were expanded to full paragraphs — future projects should follow this pattern

---

## Completion Summary

| Field | Value |
|---|---|
| Date completed | 2026-03-18 |
| All tasks done? | Yes (HV2.1, HV2.2, HV2.3, HV2.6, HV2.7 — HV2.4/HV2.5 deferred per scope) |
| Build passing? | Yes — zero errors |
| Deviations? | Yes — see above. All deviations are JC-approved live feedback during build. |
| New items for backlog? | LogoMark component (HV2.4/HV2.5), update DESIGN_SYSTEM.md §9 for new Hero + ProjectList architecture |
