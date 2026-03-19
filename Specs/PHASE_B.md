# PHASE B — Navigation Layer

## Sprint Goal

Add the two persistent navigation elements that float above all experiments: the generative **LogoMark** (top-left) and the **IndexOverlay** (full-screen experiment list). After this phase, users can discover and navigate between experiments while still being immersed in the current one.

## Status: `COMPLETE`

## Depends On: Phase A (complete ✅)

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

- [x] Create `components/LogoMark.tsx` and `components/LogoMark.module.css`
- [x] `'use client'` component — needs `useEffect` for client-side randomization
- [x] Props:
  ```ts
  interface LogoMarkProps {
    size?: number;       // font-size in px, default 22
    className?: string;  // optional extra class
  }
  ```
- [x] Renders "JUANEMO" as individual `<span>` elements within `<a href="/">`
- [x] Each letter gets independent `randomAxes()` values on mount via `useEffect` + `useRef`
- [x] Import `randomAxes`, `axisString` from `lib/generativeAxes.ts` — same axis system as experiments
- [x] **Static, not animated** — randomized once on mount, then frozen
- [x] Handle hydration: render with neutral/default axes on server, randomize in `useEffect` on client. Use `suppressHydrationWarning` on the spans.
- [x] `aria-label="Juanemo — home"`
- [x] Color: `var(--color-text-muted)` (Dun), letter-spacing `-0.02em`

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

- [x] Create `components/IndexOverlay.tsx` and `components/IndexOverlay.module.css`
- [x] `'use client'` component — needs state for open/closed, keyboard listeners
- [x] Props:
  ```ts
  interface IndexOverlayProps {
    isOpen: boolean;
    onClose: () => void;
  }
  ```
- [x] Full-screen overlay: `100vw × 100vh`, fixed position, `z-index: 60` (above LogoMark at 50)
- [x] Background: `var(--color-bg)` (Gunmetal) — solid, not translucent
- [x] Content: list of experiments from `data/experiments.ts`, reverse chronological (newest first)
- [x] Each entry renders:
  - Experiment name — display-size typography, `var(--color-text-muted)` (Dun), weight 300
  - Published date — `.label-lg` eyebrow style below the name
  - Click navigates to `/experiments/[slug]` and closes overlay
- [x] Use Next.js `<Link>` for navigation (client-side routing, no full page reload)
- [x] Keyboard accessible:
  - `Escape` closes the overlay
  - `Tab` navigates between experiment entries
  - Focus trapped inside overlay while open
- [x] Transition: fade in/out, 300ms, `--ease-in-out`
- [x] When closed: `display: none` or unmounted — must not interfere with experiment interactivity

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

- [x] A minimal text label or button positioned fixed top-right
- [x] Text: `INDEX` in `.label` style (11px, 500 weight, 0.1em tracking, uppercase, `--color-text-faint`)
- [x] On hover: `--color-text-muted` (Dun)
- [x] On click: toggles the IndexOverlay open/closed
- [x] Position: `fixed`, `top: 16px`, `right: var(--page-margin)`, `z-index: 50`
- [x] This can live inside `app/layout.tsx` alongside the LogoMark, or be a child of a shared nav wrapper

### B.4 — Integrate into Layout

- [x] Update `app/layout.tsx`:
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
- [x] LogoMark: fixed top-left, `top: 16px`, `left: var(--page-margin)`, `z-index: 50`
- [x] INDEX trigger: fixed top-right, `top: 16px`, `right: var(--page-margin)`, `z-index: 50`
- [x] Both visible on ALL experiment pages (rendered in layout, not per-page)
- [x] Verify they don't interfere with experiment interactions (pointer-events on the overlay when closed)

### B.5 — Navigation State Management

- [x] The layout needs state for whether the IndexOverlay is open
- [x] Since `layout.tsx` is a server component by default, the overlay + trigger should be wrapped in a client component (e.g., `NavigationProvider` or just make the nav wrapper a client component)
- [x] Alternatively: the INDEX trigger and overlay can be a single `'use client'` component that manages its own open/closed state

### B.6 — Build & QA

- [x] `npm run build` — zero errors
- [x] LogoMark renders top-left on all experiment pages, different on each page load
- [x] Clicking LogoMark navigates to `/` (which redirects to latest experiment)
- [x] INDEX trigger renders top-right
- [x] Clicking INDEX opens the full-screen overlay with experiment list
- [x] Clicking an experiment in the overlay navigates to it and closes the overlay
- [x] Escape closes the overlay
- [x] Tab navigation works within the overlay
- [x] LogoMark and INDEX trigger don't block experiment interactions when overlay is closed
- [x] Test at 320px, 768px, 1280px, 1920px

---

## Definition of Done

- [x] LogoMark: fixed top-left, static generative, different each load, links to `/`
- [x] INDEX trigger: fixed top-right, opens overlay on click
- [x] IndexOverlay: full-screen, lists experiments, click to navigate, Escape to close
- [x] Both nav elements visible on all experiment pages
- [x] Overlay doesn't interfere with experiments when closed
- [x] Keyboard accessible (Tab, Escape)
- [x] `npm run build` passes
- [x] Works at 320px through 2560px

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
- **Navigation wrapper pattern (B.3–B.5):** Combined the INDEX trigger, LogoMark, and IndexOverlay into a single `Navigation.tsx` client component that manages open/closed state via `useState`. This keeps `layout.tsx` as a server component and avoids prop-drilling. The trigger is a `<button>` (not a `<span>`) for native keyboard accessibility and `aria-expanded` support.
- **INDEX trigger uses `--color-text-faint` (not `--color-text-muted`):** Spec says label style at `--color-text-faint` for the trigger at rest, hover transitions to `--color-text-muted` (Dun). Implemented exactly as specified.
- **Overlay uses `opacity + pointer-events` pattern (not `display: none`):** Keeps the DOM mounted for the 300ms fade transition. When closed: `opacity: 0; pointer-events: none` — zero interference with experiment interactions.
- **Focus trap on overlay open:** First experiment link receives focus via `requestAnimationFrame` when overlay opens. Tab wraps within the overlay. Escape closes.
- **Experiment entry hover:** Name transitions from Dun (`--color-text-muted`) to Bone (`--color-text`) on hover/focus for subtle interactivity without introducing new colors.
- **LogoMark fixed positioning lives in CSS module:** Position `fixed`, `top: 16px`, `left: var(--page-margin)`, `z-index: 50` is in `LogoMark.module.css` — not inline styles.

### Problems Encountered
- No problems encountered. Build passed on first attempt. All components rendered correctly across viewports.

### Deviations from Spec
- **Overlay entry typography uses DM Sans (not Roboto Flex):** The spec says "display-size typography" for experiment names. Used DM Sans at `clamp(32px, 5vw, 64px)` weight 300, matching the `.display` token from the design system. The overlay is a typographic index — DM Sans keeps it distinct from the Roboto Flex hero experiments, reinforcing the hierarchy.
- **Date eyebrow placed below name (not above):** The spec says "published date eyebrow" — placed it below the experiment name as a secondary detail, which reads more naturally as a table-of-contents pattern.

### Items for Scrummaster
- With only 1 experiment currently in the data file, the overlay is sparse. Consider adding 2–3 placeholder/upcoming experiments to test visual density and scrolling behavior.
- The overlay currently has no close button — relies on Escape key and clicking an experiment. Consider adding an explicit close affordance (X or "CLOSE" text) for mobile users who may not have a keyboard.
- The LogoMark uses `<a href="/">` (not `<Link>`). This causes a full page reload on click rather than client-side navigation. Could upgrade to Next.js `<Link>` for smoother transitions, but the full reload also re-randomizes the LogoMark which is a nice touch.

---

## Completion Summary

| Field | Value |
|---|---|
| Date completed | 2026-03-19 |
| All tasks done? | Yes — B.1 through B.6 complete |
| Build passing? | Yes — `npm run build` zero errors |
| Deviations? | Minor: DM Sans for overlay entry names (not Roboto Flex), date below name (not above). See notes. |
| New items for backlog? | Close button for overlay on mobile, placeholder experiments for density testing, LogoMark `<a>` → `<Link>` upgrade |
