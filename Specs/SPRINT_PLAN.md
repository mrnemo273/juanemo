# SPRINT_PLAN.md — Juanemo Build Phases

## Overview

This document defines the build phases for Juanemo V2.0 — the experiment journal architecture. The original V1 phases (1–5) are complete or superseded. The new phases implement the architecture pivot from a single-page portfolio to a journal of full-screen experiments.

---

## Completed Foundation (V1)

| Phase | Status | What It Built |
|---|---|---|
| Phase 1 | ✅ Complete | Next.js 16, CSS tokens, fonts, design system foundation |
| Phase 2 | ✅ Complete (superseded) | Hero V1 — viewport-responsive axes, mood system (deferred) |
| Phase 3 | ✅ Complete (superseded) | ProjectList, Footer, data model |
| Hero V2 | ✅ Complete | Per-character generative drift, spring easing, scaleX, ResizeObserver |
| Hero V3 | ✅ Complete | ScaleXY fill, hidden clone measurement, mobile axis caps |

The generative typography system, design tokens, and font infrastructure carry forward unchanged. The components are being restructured, not rewritten.

---

## V2.0 Phase A: Architecture Pivot

**Goal:** Restructure the site from a single-page portfolio (Hero + ProjectList + Footer) to a journal of full-screen experiments. Set up routing, data model, shared layout, and the first experiment.

### Tasks

1. **Create `data/experiments.ts`**
   - New data model: `{ slug, name, description, publishedDate }`
   - Populate with experiment #1 ("Generative Typography")
   - Array in reverse chronological order (newest first)

2. **Set up experiment routing**
   - Create `/app/experiments/[slug]/page.tsx` — dynamic route
   - Load experiment component by slug lookup
   - Create `ExperimentShell` component — full-viewport, no-scroll wrapper (`100vw × 100vh`, `overflow: hidden`)

3. **Update home route**
   - `/app/page.tsx` redirects to `/experiments/[latest-slug]`
   - Reads first entry from `data/experiments.ts`

4. **Refactor Hero → GenerativeType experiment**
   - Move current `Hero.tsx` logic to `components/experiments/GenerativeType.tsx`
   - Wrap in `ExperimentShell`
   - Verify scaleXY, drift+hold, mobile caps all work in new location

5. **Update layout**
   - Remove `<ProjectList />` and `<Footer />` from page rendering
   - Keep `app/layout.tsx` clean — just fonts, theme init, and children
   - Prepare for LogoMark + INDEX trigger (next phase)

### Definition of Done
- Landing on `/` redirects to `/experiments/generative-type`
- The generative typography experiment fills the full viewport, no scroll
- No ProjectList or Footer visible on experiment pages
- `npm run build` passes
- Works at 320px through 2560px

---

## V2.0 Phase B: Navigation Layer

**Goal:** Add the persistent navigation elements that float above all experiments — the generative LogoMark and the INDEX overlay.

### Tasks

1. **Create `LogoMark.tsx`**
   - Static generative logo — each letter randomized once per load, frozen
   - Props: `size` (default 22), links to `/`
   - Uses `lib/generativeAxes.ts` — same axis system as experiments
   - Handle hydration (client-side randomization)
   - Position: fixed top-left, `z-index: 50`

2. **Create `IndexOverlay.tsx`**
   - Full-screen overlay (`100vw × 100vh`), dark background
   - Triggered by INDEX label or hamburger (top-right corner)
   - Lists experiments from `data/experiments.ts` in reverse chronological order
   - Each entry: name + date, click to navigate
   - Keyboard accessible: Escape to close, Tab to navigate
   - Smooth open/close transition

3. **Integrate into layout**
   - Add `<LogoMark>` and INDEX trigger to `app/layout.tsx`
   - Visible on all experiment pages
   - Verify they don't compete with the experiment content

### Definition of Done
- LogoMark renders top-left on all pages, different on each load
- INDEX trigger opens a full-screen overlay with experiment list
- Clicking an experiment in the index navigates to it
- Escape closes the overlay
- `npm run build` passes

---

## V2.0 Phase C: Polish & Deploy

**Goal:** Performance, accessibility, cross-browser QA, and deployment.

### Tasks

1. **Performance audit** — LCP < 2s, CLS = 0
2. **Accessibility** — WCAG AA contrast, keyboard nav, screen reader
3. **Cross-browser** — Chrome, Safari, Firefox (desktop + mobile)
4. **Responsive** — 320px through 2560px, no scroll, no overflow
5. **Deploy to Vercel** — verify production build
6. **README update** — how to run locally, how to add an experiment

### Definition of Done
- Lighthouse: Performance 90+, Accessibility 95+
- All experiments work across browsers
- Site is live on Vercel
- Adding a new experiment takes < 15 minutes

---

## V2.0 Phase D → E: Experiment Frame & Pagination

**Goal:** Replace the minimal experiment shell with a rich lab/specimen stage — keylines, metadata, interactive controls, and paginated sub-experiment navigation.

### What Was Built

1. **ExperimentFrame** — full-viewport specimen stage with CSS Grid (7 rows: topbar, keyline, meta, viewport, bottom-meta, keyline, bottombar)
2. **Pagination tiles** (A–F) — clickable tiles replace scrolling, only active section is mounted
3. **Section loader** — 3-phase transition: 100ms fade-out → 350ms spinning arrow → 100ms fade-in
4. **6 type variations** for Experiment 01 (Generative Typography):
   - A: Generative Drift — per-character timer-based drift
   - B: Proximity + Drift — mouse-attracted bold/extended
   - C: Mouse-Responsive Axes — cursor position maps to wdth/wght
   - D: Per-Character Hover — CSS hover collapse + lift
   - E: Expand Entrance — condensed→expanded CSS animation
   - F: Axis Breathing — continuous weight/width oscillation
5. **Interactive controls** — Speed (2s/4s/8s), Easing (Spring/Smooth), Shuffle
6. **Mobile drawer** — gear icon opens slide-up drawer for controls; pagination tiles centered at bottom
7. **Bottom meta bar** — mirrors top meta bar, shows active section letter + name

### Status: ✅ Complete (deployed 2026-03-19)

---

## V2.0 Phase F: Drawer Navigation

**Goal:** Replace the IndexOverlay with a right-side drawer (desktop) / bottom sheet (mobile) for experiment navigation. Add a Special Projects carousel.

### What Needs to Be Built

1. **DrawerNav component** — slides in from the right on desktop, slides up from bottom on mobile (≤600px)
2. **Experiment list** grouped by month with 56×36 live thumbnails
3. **Special Projects carousel** pinned to drawer bottom, auto-rotates every 4s
4. **NavigationContext refactor** — replace `openIndex()`/`closeIndex()` with `openDrawer()`/`closeDrawer()`
5. **Shared BottomSheet pattern** on mobile — both the nav drawer and the existing controls drawer use the same bottom-sheet component
6. **Delete IndexOverlay** — fully replaced by drawer

### Key References
- Spec: `Specs/PHASE_F_DRAWER_NAV.md`
- Prototype: `prototypes/drawer-nav-v2.html`
- Architecture context: `Specs/PHASE_D_EXPERIMENT_FRAME.md` (R.7 builder notes)

### Status: 🔲 TODO

---

## Future: Adding New Experiments

Each new experiment follows this pattern:

1. Create `components/experiments/NewExperiment.tsx` + CSS module
2. The component fills its container (`100%` width and height) — `ExperimentShell` handles the viewport sizing
3. Add one entry to `data/experiments.ts` at the top of the array (newest first)
4. Register the slug→component mapping in the dynamic route
5. Push to main → auto-deploys to Vercel

The home page automatically points to the newest experiment. The INDEX overlay automatically includes it.

---

## Notes for Builder Agents

- **Read GOALS.md first.** The site is a creative sandbox, not a portfolio. The browser is a stage, not a document.
- **Every experiment fills the viewport.** No scrolling. `100vw × 100vh`. The frame IS the canvas.
- **The generative LogoMark is the identity.** Same DNA as the experiments — per-character randomized Roboto Flex — but frozen and small.
- **Typography is the product.** Every experiment should make a senior creative director want to know how it was made.
- **Spring easing: `cubic-bezier(0.34, 1.56, 0.64, 1)`.** Non-negotiable for the generative system.
- **Dun, not Bone** for display type on dark backgrounds.
- **The prototypes in `/prototypes/` are the creative source material.** Open them in a browser to see the approved behaviors.
