# PHASE D — Experiment Frame

## Sprint Goal

Replace the current minimal `ExperimentShell` with a rich experiment frame that gives every experiment a lab/specimen aesthetic — keylines, metadata, a scrollable viewport for multi-section experiments, and interactive controls. The frame is the stage. The experiment performs inside it.

## Status: `READY`

## Depends On: Phase C (complete ✅)

---

## Prerequisites

- Phase C is complete: site is polished, fonts preloaded, accessible, responsive
- Read `Specs/GOALS.md` — the frame should feel like a creative technologist's workbench, not a gallery
- Read `Specs/PRD.md` — V2.0 architecture: full-screen experiments, no browser scroll
- **Open `prototypes/experiment-frame.html` in a browser** — this is the approved design. Match this exactly.
- **Also reference `prototypes/hero-effects.html`** — the labeled sections with descriptions that inspired the specimen aesthetic

---

## The Frame Structure

The full viewport is a CSS Grid with 6 rows:

```
┌─────────────────────────────────────────────┐
│  TOP BAR: date (left) · logo (center) · grid icon (right)  │
├─────────────────────────────────────────────┤ ← keyline
│  META BAR: 01 Generative Typography                         │
├─────────────────────────────────────────────┤
│                                             │
│         EXPERIMENT VIEWPORT                 │
│         (scrollable container)              │
│                                             │
│         Sections scroll within this area.   │
│         Each section is min-height: 100%    │
│         of the viewport.                    │
│                                             │
├─────────────────────────────────────────────┤ ← keyline
│  BOTTOM BAR: description (left) · controls (right)          │
└─────────────────────────────────────────────┘
```

Grid definition: `grid-template-rows: auto 1px auto 1fr 1px auto`

The browser window does NOT scroll. Only the experiment viewport (the `1fr` row) scrolls internally.

---

## Task List

### D.1 — Refactor ExperimentShell into ExperimentFrame

- [ ] Replace `components/ExperimentShell.tsx` with `components/ExperimentFrame.tsx` and `components/ExperimentFrame.module.css`
- [ ] The frame is a `'use client'` component (needs state for controls, scroll tracking)
- [ ] Props:
  ```ts
  interface ExperimentFrameProps {
    number: string;           // "01", "02", etc.
    title: string;            // "Generative Typography"
    date: string;             // "March 2025"
    description: string;      // Displayed in bottom bar
    children: React.ReactNode;  // The experiment content
  }
  ```
- [ ] The frame fills the full viewport (`100vw × 100vh`, `100dvh`), no browser scroll
- [ ] CSS Grid layout: `grid-template-rows: auto 1px auto 1fr 1px auto`
- [ ] All padding uses `--page-padding: clamp(16px, 2.5vw, 32px)` (add this token if not in globals)

### D.2 — Top Bar

- [ ] Three-column layout: date (left) · LogoMark (center) · grid icon (right)
- [ ] Date: positioned absolute left, `--page-padding` from edge
  - 10px, weight 400, `0.08em` tracking, uppercase, `--color-dun`, opacity 0.25
- [ ] LogoMark: centered (use the existing `<LogoMark>` component from Phase B, or render inline generative logo)
  - 15px, Roboto Flex, per-character randomized, Dun
- [ ] Grid icon: positioned absolute right, `--page-padding` from edge
  - 2×2 CSS grid of 5px squares, `--color-dun`, opacity 0.35, hover → 0.8
  - `role="button"`, `tabindex="0"`, `aria-label="View all experiments"`
  - This replaces the current INDEX text trigger
- [ ] The LogoMark in the top bar replaces the fixed-position LogoMark from Phase B — it's now part of the frame, not floating above it

### D.3 — Keylines

- [ ] Two 1px horizontal lines: one below the top bar, one above the bottom bar
- [ ] Color: `rgba(214, 197, 171, 0.12)` — very subtle, Dun at ~12% opacity
- [ ] Full width, no padding
- [ ] These contain the experiment — they define the stage

### D.4 — Meta Bar (Below Top Keyline)

- [ ] Sits between the top keyline and the experiment viewport
- [ ] Left-aligned: experiment number in Bittersweet + experiment title in Dun at 50% opacity
  - Number: 11px, weight 500, `0.12em` tracking, uppercase, `--color-bittersweet`
  - Title: 11px, weight 500, `0.12em` tracking, uppercase, `--color-dun`, opacity 0.5
  - Gap between number and title: 12px
- [ ] Padding: `20px var(--page-padding) 10px` — breathing room below the keyline

### D.5 — Experiment Viewport (Scrollable Container)

- [ ] The `1fr` grid row — takes all remaining vertical space
- [ ] `overflow-y: auto; overflow-x: hidden` — scrolls vertically within the frame
- [ ] `scroll-behavior: smooth`
- [ ] Custom scrollbar:
  ```css
  .viewport::-webkit-scrollbar { width: 3px; }
  .viewport::-webkit-scrollbar-track { background: transparent; }
  .viewport::-webkit-scrollbar-thumb { background: rgba(214, 197, 171, 0.15); border-radius: 2px; }
  .viewport::-webkit-scrollbar-thumb:hover { background: rgba(214, 197, 171, 0.3); }
  ```
- [ ] Experiment content (children) renders inside this viewport
- [ ] For single-section experiments (like the current GenerativeType), the content fills the viewport height
- [ ] For multi-section experiments, each section is `min-height: 100%` of the viewport and they scroll within

### D.6 — Experiment Sections (For Multi-Section Experiments)

- [ ] Each section inside the viewport can have:
  - **Section label** (top-left): letter (`A`, `B`, `C`) in Bittersweet at 10px + section name in Dun at 10px, opacity 0.25
  - **Section description** (bottom-left): 11px, Dun, opacity 0.25, max-width 480px
  - **Scroll hint** (first section only): "Scroll ↓" pulsing faintly, bottom-right
- [ ] Sections separated by 1px keyline (same color as frame keylines)
- [ ] Section content is centered (flex, justify-content: center, align-items: center)
- [ ] This is a **pattern** for experiments to follow, not enforced by the frame. The frame just provides the scrollable viewport — experiments decide their own internal structure.

### D.7 — Bottom Bar

- [ ] Two columns: description (left) · controls (right)
- [ ] **Description** (left):
  - 11px, weight 400, line-height 1.5, `--color-dun`, opacity 0.35
  - Max-width 600px
  - Technical description of the experiment — the "what" and "how"
- [ ] **Controls** (right):
  - Speed selector: label "Speed" + buttons for speed values (e.g., `2s`, `4s`, `8s`)
  - Easing selector: label "Easing" + buttons (e.g., `Spring`, `Smooth`)
  - Shuffle button
  - Section counter: `A / D` format, updates on scroll
  - Dot separators between control groups (2px circles, Dun at 20% opacity)
  - Controls use the `.ctrl-btn` style: 9px, weight 500, `0.08em` tracking, uppercase, Dun at 45%, border `rgba(214, 197, 171, 0.12)`, 2px radius. Active state: Bittersweet border and text.
- [ ] **How controls work:** The frame exposes control state to experiments via props or context. Experiments read the current speed/easing from the frame and use them in their animation logic.
- [ ] Mobile (≤600px): bottom bar stacks vertically (description on top, controls below), controls wrap

### D.8 — Update Navigation Integration

- [ ] The LogoMark moves FROM the fixed-position `Navigation.tsx` wrapper INTO the ExperimentFrame top bar (centered)
- [ ] The grid icon in the frame top bar replaces the INDEX text trigger
- [ ] Clicking the grid icon still opens the IndexOverlay
- [ ] The `Navigation.tsx` wrapper still manages overlay state, but the trigger is now inside the frame
- [ ] **Consider:** Pass an `onOpenIndex` callback from Navigation into ExperimentFrame, or use a shared context/state

### D.9 — Update GenerativeType Experiment

- [ ] Refactor `GenerativeType.tsx` to work inside the new frame:
  - Remove any internal padding/sizing — the frame provides the viewport
  - The experiment fills `100%` of the experiment viewport
  - Read speed/easing from frame controls (if connected) or use defaults
- [ ] For the current single-section behavior: GenerativeType fills the viewport container
- [ ] The existing scaleXY + hidden clone measurement should work unchanged inside the scrollable viewport

### D.10 — Update Dynamic Route

- [ ] Update `/app/experiments/[slug]/page.tsx` to use `ExperimentFrame` instead of `ExperimentShell`:
  ```tsx
  <ExperimentFrame
    number="01"
    title="Generative Typography"
    date="March 2025"
    description="Per-character variable font drift using Roboto Flex's 13 axes..."
  >
    <GenerativeType />
  </ExperimentFrame>
  ```
- [ ] Pull number, title, date, description from `data/experiments.ts` — may need to extend the data model with these fields

### D.11 — Update Data Model (If Needed)

- [ ] `data/experiments.ts` may need additional fields:
  ```ts
  export interface Experiment {
    slug: string;
    number: string;          // "01", "02" — display number
    name: string;
    description: string;     // Short (for index)
    longDescription: string; // Technical (for bottom bar)
    publishedDate: string;
  }
  ```
- [ ] Builder discretion on whether to add `number` and `longDescription` or derive them

### D.12 — Build & QA

- [ ] `npm run build` — zero errors
- [ ] Frame renders: top bar (date / logo / grid icon), keyline, meta bar, experiment viewport, keyline, bottom bar
- [ ] Experiment fills the viewport area
- [ ] Keylines visible and correctly colored
- [ ] Controls functional: speed changes affect animation, easing changes affect transitions, shuffle works
- [ ] Section counter updates on scroll (for multi-section experiments)
- [ ] Grid icon opens the IndexOverlay
- [ ] LogoMark centered in top bar, generative, links to `/`
- [ ] Mobile (≤600px): bottom bar stacks, controls wrap, date hidden from top bar
- [ ] Test at 320px, 768px, 1280px, 1920px
- [ ] `prefers-reduced-motion` still works

---

## Definition of Done

- [ ] ExperimentFrame replaces ExperimentShell as the experiment wrapper
- [ ] Top bar: date (left), LogoMark (center), grid icon (right)
- [ ] Keylines above and below the experiment area
- [ ] Meta bar: experiment number (Bittersweet) + title below the top keyline
- [ ] Experiment viewport scrolls internally (no browser scroll)
- [ ] Bottom bar: description (left), controls (right) with section counter
- [ ] Controls affect the experiment's animation behavior
- [ ] Grid icon opens the IndexOverlay
- [ ] GenerativeType works correctly inside the new frame
- [ ] `npm run build` passes
- [ ] Responsive at 320px through 2560px

---

## Design Guardrails

1. **The frame IS the specimen treatment.** Small type, strategic Bittersweet pops, faint metadata. It should feel like a creative technologist's lab — not a gallery.
2. **Keylines contain the experiment.** They define the stage. The space between them is sacred — that's where the work lives.
3. **Controls make it playable.** The user should want to tinker. Speed, easing, shuffle — these are part of the experience, not developer tools.
4. **Metadata is faint but intentional.** Opacity 0.25–0.5 on descriptions and labels. They inform without competing.
5. **The experiment viewport scrolls, the browser does NOT.** Flash-era paradigm: the stage is fixed, the content inside moves.
6. **Bittersweet appears only on:** experiment number in the meta bar, section letters, active control states. Nowhere else.

---

## Builder Notes

> _Document decisions, problems, deviations, and items for the scrummaster here._

### Decisions Made
- **Navigation architecture**: Converted Navigation from rendering fixed-position LogoMark + INDEX trigger into a context provider wrapping `{children}`. ExperimentFrame consumes `NavigationContext` to trigger the IndexOverlay via `openIndex()`. This keeps overlay state management in Navigation while letting the frame own the trigger UI.
- **Controls via context**: Created `ExperimentControlsContext` providing `{ speed, easing, shuffleKey }`. ExperimentFrame owns the state; GenerativeType reads it via `useContext` and a `controlsRef` pattern (ref stays current without re-running the effect).
- **Speed mapping**: Speed value (2000/4000/8000ms) maps to transition duration as `speed * 0.75` and hold duration as `speed * 4`, matching the prototype's ratio.
- **LogoMark positioning**: Removed `position: fixed` from LogoMark's CSS module. The component is now purely inline — ExperimentFrame's top bar centers it. The `.logoInline` class in ExperimentFrame strips any residual fixed positioning.
- **`--page-padding` token**: Added `--page-padding: clamp(16px, 2.5vw, 32px)` to globals.css as specified. Frame uses this; GenerativeType container also uses it for internal padding.
- **Data model**: Extended `Experiment` interface with `number` and `longDescription` fields. `number` is explicitly set ("01") rather than derived, giving control over display formatting.

### Problems Encountered
- None significant. Build passed on first attempt.

### Deviations from Spec
- **D.6 (Experiment Sections)**: Section pattern (A/B/C labels, section descriptions, scroll hint) is not implemented as the current experiment is single-section. The viewport is ready for multi-section content — `data-section` attribute and scroll tracking are wired up in ExperimentFrame. Section patterns will be implemented when multi-section experiments are added.
- **Section counter**: Hidden when `sections` prop is not provided (single-section experiments). Shows when sections are explicitly defined.

### Items for Scrummaster
- **Multi-section experiment**: The prototype (`experiment-frame.html`) shows 4 sections (Drift, Echo, Proximity, Freeze Frame). These are future experiment content, not part of this frame task. Consider as a separate experiment or Phase E.
- **ExperimentShell cleanup**: The old `ExperimentShell.tsx` and `ExperimentShell.module.css` still exist on disk but are no longer imported. Can be deleted.
- **Navigation.module.css**: Now empty (just a comment). The INDEX trigger styling moved into ExperimentFrame. Can be cleaned up.

---

## Phase D Refinements — Builder Notes (Post-Review)

**Context:** The frame structure is correct, but comparing the live site to the prototype (`prototypes/experiment-frame.html`), the experiment content isn't filling the viewport properly. There's a visible gap at the bottom of the viewport — the word should stretch all the way down to the bottom keyline but it doesn't. Additionally, the prototype shows 4 scrollable sections inside the viewport, but only 1 was built.

Read `prototypes/experiment-frame.html` in full before making changes — it's the source of truth for how this should look and behave.

---

### R.1 — Viewport Height Context (CSS fix already applied)

The `.viewport` CSS has been updated to give children explicit height context:

```css
.viewport {
  /* existing styles... */
  display: flex;
  flex-direction: column;
}
.viewport > * {
  min-height: 100%;
}
```

This change is already in `ExperimentFrame.module.css`. Verify it's working — GenerativeType's `.container` has `height: 100%` which should now resolve against the viewport's height.

### R.2 — Debug the ScaleY Gap

The word is scaling horizontally but there's a visible gap at the bottom of the viewport. The `fitWord()` function in `GenerativeType.tsx` measures the container and scales both axes:

```ts
const scaleX = containerWidth / naturalWidth;
const scaleY = containerHeight / naturalHeight;
word.style.transform = `scale(${scaleX}, ${scaleY})`;
```

**Likely causes of the gap:**

1. **`containerHeight` resolving to 0 on first render** — the effect runs before the flex layout has computed height. Fix: add a `requestAnimationFrame` wrapper around the initial `fitWord()` call, or use a `ResizeObserver` on the container (not just the clone).

2. **The container might not stretch to fill the viewport area** — even with `min-height: 100%` on the child, `height: 100%` might not resolve if the flex parent's height is implicit. Fix: try `flex: 1` on the container instead of or in addition to `height: 100%`:
   ```css
   /* GenerativeType.module.css */
   .container {
     /* existing styles... */
     height: 100%;
     flex: 1;  /* ADD — ensures it stretches in the flex viewport */
   }
   ```

3. **The hidden measurement clone might interfere** — the clone is `position: absolute` inside the container, so it shouldn't take up flow space. But verify the clone isn't accidentally expanding the container's scroll height. Add `overflow: hidden` to the clone if needed.

**Debug step:** Add a temporary red border to `.container` and a blue border to `.viewport` to see exactly where the gap is. Log `containerHeight` and `scaleY` in `fitWord()` to console. If `containerHeight` is less than the viewport area, the height isn't resolving. If `scaleY` is correct but the word still doesn't fill, the clone measurement is wrong.

### R.3 — The Experiment Must Fill the Full Viewport Area

**The goal:** The JUANEMO wordmark should stretch edge-to-edge within the viewport area — from the top-left padding edge to the bottom-right padding edge. No visible gap above, below, or to the sides. It should look like the word is being "projected" onto the full viewport stage.

Key settings that must be correct:
- `.container`: `height: 100%; width: 100%; padding: var(--page-padding); overflow: hidden;`
- `.word`: `transform-origin: top left;`
- `.container`: `justify-content: flex-start; align-items: flex-start;` (word anchors top-left)
- `fitWord()` measures the container's **content area** (clientWidth/Height minus padding) and scales the word to fill it

### R.4 — Multi-Section Scrollable Content

The prototype (`prototypes/experiment-frame.html`) has 4 scrollable sections inside the viewport for Experiment 01:

- **Section A — Generative Drift:** The current GenerativeType animation (per-character drift + hold cycle). This is what's built now.
- **Section B — Layered Echo:** Three stacked rows of JUANEMO, each at a different opacity/color. The top row leads the axis transitions; rows 2 and 3 follow at a delay, creating a typographic echo/afterimage.
- **Section C — Proximity + Drift:** Ambient drift runs, but letters near the mouse cursor get pulled toward bold + extended. Move away and they relax back.
- **Section D — Freeze Frame:** Click any letter to freeze it in place (turns Bittersweet). Click again to release. Users compose their own version of the wordmark.

Each section is `min-height: 100%` of the viewport, so they scroll internally. Sections are separated by 1px keylines. Each section has:
- **Section label** (top-left): letter (A, B, C, D) in Bittersweet + section name in faint Dun
- **Section description** (bottom-left): 11px, faint Dun, max-width 480px
- **Scroll hint** (Section A only): "Scroll ↓" pulsing faintly, bottom-right

The section counter in the bottom bar (`A / D`) updates on scroll.

**Implementation approach:** These sections are all variations of the same generative type system — they share the axis randomization from `lib/generativeAxes.ts`. Build them as sub-components or sections within `GenerativeType.tsx`, or create a wrapper that renders all 4 sections inside the viewport. Reference the prototype JS for the exact behavior of each section (echo delay timing, proximity radius, freeze toggle logic).

### R.5 — Mobile Axis Caps

Already correct in `lib/generativeAxes.ts`:
- Mobile weight: 300–650 ✓
- Mobile width: 25–100 ✓

Verify the one-extreme-character-per-shift logic works: on mobile, 1 random character gets desktop ranges (dramatic), the rest get mobile ranges (conservative).

### R.6 — Word Anchoring

The word anchors **top-left** and scales toward bottom-right:
- `.word` has `transform-origin: top left` ✓
- `.container` has `justify-content: flex-start; align-items: flex-start` ✓

### How to Verify

1. Load the experiment in the browser at full screen
2. The JUANEMO wordmark in Section A should stretch to fill the space between the keylines — both horizontally and vertically, no gaps
3. Scroll down inside the viewport to see sections B, C, D
4. Section counter in the bottom bar should update as you scroll (A / D, B / D, etc.)
5. Section B: three stacked rows, echo delay visible
6. Section C: move mouse near letters, they should respond (bold + extend)
7. Section D: click letters to freeze (turn Bittersweet), click again to release
8. On mobile (375px wide): word still fills, more conservative axis variations
9. No browser scrollbar, only the thin internal scrollbar on the viewport
10. Compare side-by-side with `prototypes/experiment-frame.html` — proportions and behavior should match

---

## Completion Summary

| Field | Value |
|---|---|
| Date completed | 2026-03-19 |
| All tasks done? | Yes (D.1–D.5, D.7–D.12 complete; D.6 deferred — single-section only) |
| Build passing? | Yes — `npm run build` zero errors |
| Deviations? | D.6 section pattern deferred to multi-section experiment phase |
| New items for backlog? | Multi-section experiment content (Echo, Proximity, Freeze Frame); cleanup of ExperimentShell files |
