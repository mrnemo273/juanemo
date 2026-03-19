# PHASE B — Navigation Layer

## Sprint Goal

Add the two persistent navigation elements that float above all experiments: the generative **LogoMark** (top-left) and the **IndexOverlay** (full-screen experiment list). After this phase, users can discover and navigate between experiments while still being immersed in the current one.

## Status: `NOT STARTED`

## Depends On: Phase A (complete)

---

## Prerequisites

- Phase A is complete: experiment routing works, GenerativeType fills viewport, no scroll
- Read `Specs/PRD.md` — §"Navigation — The Index Overlay" for behavior requirements
- Read `Specs/DESIGN_SYSTEM.md` — §9 for `LogoMark` and `IndexOverlay` component specs
- Read `Specs/TRD.md` — §"Routing Architecture" for how navigation integrates with experiments
- **Open `prototypes/hero-with-logo.html` in browser** — shows the LogoMark at various sizes

---

## Task List

### B.1 — Create LogoMark Component

- [ ] Create `components/LogoMark.tsx` and `components/LogoMark.module.css`
- [ ] `'use client'` component — needs `useEffect` for client-side randomization
- [ ] Props:
  ```ts
  interface LogoMarkProps {
    size?: number;       // font-size in px, default 22
    className?: string;  // optional extra class
  }
  ```
- [ ] Renders "JUANEMO" as individual `<span>` elements within `<a href="/">`
- [ ] Each letter gets independent `randomAxes()` values on mount via `useEffect` + `useRef`
- [ ] Import `randomAxes`, `axisString` from `lib/generativeAxes.ts` — same axis system as experiments
- [ ] **Static, not animated** — randomized once on mount, then frozen
- [ ] Handle hydration: render with neutral/default axes on server, randomize in `useEffect` on client. Use `suppressHydrationWarning` on the spans.
- [ ] `aria-label="Juanemo — home"`
- [ ] Color: `var(--color-text-muted)` (Dun), letter-spacing `-0.02em`

**Styles:**
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
  color: var(--color-text-muted);
  letter-spacing: -0.02em;
}
```

### B.2 — Create IndexOverlay Component

- [ ] Create `components/IndexOverlay.tsx` and `components/IndexOverlay.module.css`
- [ ] `'use client'` component — needs state for open/closed, keyboard listeners
- [ ] Props:
  ```ts
  interface IndexOverlayProps {
    isOpen: boolean;
    onClose: () => void;
  }
  ```
- [ ] Full-screen overlay: `100vw × 100vh`, fixed position, `z-index: 60` (above LogoMark at 50)
- [ ] Background: `var(--color-bg)` (Gunmetal) — solid, not translucent
- [ ] Content: list of experiments from `data/experiments.ts`, reverse chronological (newest first)
- [ ] Each entry renders:
  - Experiment name — display-size typography, `var(--color-text-muted)` (Dun), weight 300
  - Published date — `.label-lg` eyebrow style below the name
  - Click navigates to `/experiments/[slug]` and closes overlay
- [ ] Use Next.js `<Link>` for navigation (client-side routing, no full page reload)
- [ ] Keyboard accessible:
  - `Escape` closes the overlay
  - `Tab` navigates between experiment entries
  - Focus trapped inside overlay while open
- [ ] Transition: fade in/out, 300ms, `--ease-in-out`
- [ ] When closed: `display: none` or unmounted — must not interfere with experiment interactivity

**Styles:**
```css
.overlay {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: var(--page-margin);
  opacity: 0;
  transition: opacity 300ms var(--ease-in-out);
  pointer-events: none;
}
.overlay.open {
  opacity: 1;
  pointer-events: auto;
}
```

### B.3 — Create INDEX Trigger

- [ ] A minimal text label or button positioned fixed top-right
- [ ] Text: `INDEX` in `.label` style (11px, 500 weight, 0.1em tracking, uppercase, `--color-text-faint`)
- [ ] On hover: `--color-text-muted` (Dun)
- [ ] On click: toggles the IndexOverlay open/closed
- [ ] Position: `fixed`, `top: 16px`, `right: var(--page-margin)`, `z-index: 50`
- [ ] This can live inside `app/layout.tsx` alongside the LogoMark, or be a child of a shared nav wrapper

### B.4 — Integrate into Layout

- [ ] Update `app/layout.tsx`:
  ```tsx
  <html lang="en" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: themeScript }} />
    </head>
    <body>
      <LogoMark />
      <IndexTrigger />     {/* or however the trigger is structured */}
      <IndexOverlay />
      {children}
    </body>
  </html>
  ```
- [ ] LogoMark: fixed top-left, `top: 16px`, `left: var(--page-margin)`, `z-index: 50`
- [ ] INDEX trigger: fixed top-right, `top: 16px`, `right: var(--page-margin)`, `z-index: 50`
- [ ] Both visible on ALL experiment pages (rendered in layout, not per-page)
- [ ] Verify they don't interfere with experiment interactions (pointer-events on the overlay when closed)

### B.5 — Navigation State Management

- [ ] The layout needs state for whether the IndexOverlay is open
- [ ] Since `layout.tsx` is a server component by default, the overlay + trigger should be wrapped in a client component (e.g., `NavigationProvider` or just make the nav wrapper a client component)
- [ ] Alternatively: the INDEX trigger and overlay can be a single `'use client'` component that manages its own open/closed state

### B.6 — Build & QA

- [ ] `npm run build` — zero errors
- [ ] LogoMark renders top-left on all experiment pages, different on each page load
- [ ] Clicking LogoMark navigates to `/` (which redirects to latest experiment)
- [ ] INDEX trigger renders top-right
- [ ] Clicking INDEX opens the full-screen overlay with experiment list
- [ ] Clicking an experiment in the overlay navigates to it and closes the overlay
- [ ] Escape closes the overlay
- [ ] Tab navigation works within the overlay
- [ ] LogoMark and INDEX trigger don't block experiment interactions when overlay is closed
- [ ] Test at 320px, 768px, 1280px, 1920px

---

## Definition of Done

- [ ] LogoMark: fixed top-left, static generative, different each load, links to `/`
- [ ] INDEX trigger: fixed top-right, opens overlay on click
- [ ] IndexOverlay: full-screen, lists experiments, click to navigate, Escape to close
- [ ] Both nav elements visible on all experiment pages
- [ ] Overlay doesn't interfere with experiments when closed
- [ ] Keyboard accessible (Tab, Escape)
- [ ] `npm run build` passes
- [ ] Works at 320px through 2560px

---

## Design Guardrails

1. **Minimal, not invisible.** The LogoMark and INDEX trigger should be noticeable but not competing with the experiment. Faint text, small scale.
2. **The overlay is typographic.** No cards, no thumbnails, no grid. Just names and dates. Like a table of contents in a monograph.
3. **The LogoMark is the hero in miniature.** Same Roboto Flex, same per-character randomization, just frozen and small.
4. **Navigation should feel discoverable, not mandatory.** The experiment is the main event. The nav is for people who want to explore further.

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
