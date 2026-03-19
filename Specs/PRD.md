# PRD.md — Product Requirements Document

## Product Name
Juanemo — Creative Experiment Journal

## Owner
Juan-Carlos Morales (JC / Nemo)

## Version
2.0 — Architecture Pivot (from portfolio to experiment journal)

---

## Overview

Juanemo is a **journal of full-screen creative experiments** built with Claude Code. Each experiment fills the entire browser window — no scrolling, no chrome, no lists. You land directly in the work. The browser is a canvas, not a document.

This is the modern Praystation. A place where the website IS the work, not a container for it.

---

## The Architecture Shift

The original V1 was a single-page portfolio: hero + project list + footer. Through prototyping the generative typography system, we discovered that the individual experiments (the HTML prototypes) were more compelling than the portfolio structure housing them. The prototypes felt like Flash-era pieces — self-contained, immersive, viewport-sized.

The new architecture makes that the entire site: a journal of full-screen experiments that you enter one at a time.

---

## Users

**Primary:** Designers, creative directors, and technologists who find the site organically or through JC sharing it. They are visually sophisticated and will notice craft immediately.

**Secondary:** JC himself — adding experiments, using the site as a creative journal and link-in-bio equivalent.

---

## Core Architecture

### Landing Experience

When you arrive at `juanemo.com`, you land **directly inside the latest experiment**. No hero, no welcome page, no project list. The generative JUANEMO wordmark IS experiment #1. It fills the viewport. You're already inside the work.

The home route (`/`) always renders the most recently published experiment. Returning visitors get something new each time JC publishes.

### Full-Screen Experiments

Each experiment is a **full-viewport experience** at its own route. No scrolling within experiments — everything sizes itself to the browser window. Like Flash, the browser is the stage.

- Every experiment fills `100vw × 100vh` — no document scroll
- Each experiment is self-contained — its own component, styles, and logic
- Experiments share the design system tokens (colors, fonts, spacing) but are otherwise independent
- The Gunmetal background is the default canvas for all experiments
- `overflow: hidden` on the experiment container — the viewport IS the frame

### Navigation — The Index Overlay

Two persistent elements float above every experiment:

1. **LogoMark (top-left):** The generative JUANEMO logo — static, randomized per load, links to `/` (latest experiment). Small (22px), always present. Same Roboto Flex per-character randomization as the hero, but frozen.

2. **INDEX trigger (top-right):** A minimal text label (`INDEX` or a hamburger icon) that opens a **full-screen overlay**. The overlay is:
   - Dark (`--color-bg`), full viewport
   - A typographic list of experiment titles in reverse chronological order (newest first)
   - Each entry: experiment name + date, minimal styling
   - Click a title → overlay closes → experiment loads
   - Same design system typography (DM Sans, label styles, Dun/Bone colors)
   - Keyboard accessible (Escape to close, Tab to navigate)

### Routing

```
juanemo.com/                                → redirects to latest experiment
juanemo.com/experiments/generative-type     → experiment #1 (the JUANEMO wordmark)
juanemo.com/experiments/[future-slug]       → experiment #2, #3, etc.
```

Each experiment lives at `/experiments/[slug]`. The home route (`/`) redirects to the latest one based on the data file.

### What Persists Across All Experiments

- The generative LogoMark (top-left, fixed, links to `/`)
- The INDEX trigger (top-right, fixed, opens overlay)
- The design system tokens (colors, fonts, spacing, motion)
- The Gunmetal background as default canvas
- The theme system (dark default, light opt-in)

### What Does NOT Persist

- No project list on the page
- No footer on experiment pages
- No scrolling
- No page chrome beyond logo + index trigger

---

## Experiment #1: Generative Typography

The current JUANEMO hero becomes the first experiment. It fills the full viewport.

**Behavior — Generative Per-Character Drift:**
- JUANEMO is split into 7 individual characters, each with independent variable font axis values
- On load, each letter is randomized and stagger-fades in
- Two-phase cycle: **hold** (8s still) → **shift** (staggered transition to new random axes) → repeat
- Spring easing: `cubic-bezier(0.34, 1.56, 0.64, 1)` — letters overshoot and settle
- ScaleXY: word fills container width AND height via `scale(scaleX, scaleY)` with hidden clone measurement (no flash)
- Desktop: full viewport. Mobile: 35vh container with capped axis ranges (wght 300–750, wdth 40–120)
- Mobile uses `randomAxesForWord()` — 1 extreme character + rest moderate for contrast without chaos

**Color:** Dun (`#D6C5AB`) on Gunmetal. The wordmark is never the same twice.

---

## Data Model

### Experiments

```ts
// data/experiments.ts
export interface Experiment {
  slug: string;           // URL slug — /experiments/[slug]
  name: string;           // Display name in index
  description: string;    // One-line description for index overlay
  publishedDate: string;  // Human-readable date string
}

export const experiments: Experiment[] = [
  {
    slug: "generative-type",
    name: "Generative Typography",
    description: "Per-character variable font drift — the wordmark is never the same twice.",
    publishedDate: "March 2025",
  },
  // add new experiments here — newest first
];
```

Adding a new experiment = creating a page component at `/experiments/[slug]/page.tsx` and adding one entry to the data array. No CMS, no friction.

---

## Out of Scope (V2.0 Launch)

- CMS or admin interface
- Blog or long-form writing within experiments
- Contact form
- Analytics dashboard (basic Vercel Analytics may be added silently)
- Sound (future experiment, not core architecture)
- Light mode toggle (deferred — dark is the default, light can come later)

---

## Success Criteria

- A senior creative director opens the site and immediately feels something — the experience is immersive, not informational
- Landing on the site drops you directly into an experiment, not a list
- The INDEX overlay is discoverable but doesn't compete with the experiment
- Adding a new experiment takes under 15 minutes
- Every experiment works at every viewport from 320px to 2560px with no scrolling
- The site loads in under 2 seconds
- The generative LogoMark is recognizably JUANEMO but different on every load

---

## Future Experiments (Ideas)

These are potential future experiments to publish on the site. Each would be its own full-screen experience:

- Mouse-responsive axis mapping (cursor controls wdth/wght in real time)
- Gradient fill wordmark (background-clip: text with animated gradients)
- Outline → fill reveal (hollow letterforms that fill on interaction)
- Per-character proximity interaction (letters react to cursor distance)
- Layered echo (stacked JUANEMO instances with delayed drift)
- Generative brush system (Natzke homage — code-driven drawing)
- Particle typography (letters dissolve into and reform from particles)
- Sound-reactive type (font axes driven by ambient audio)

---

## Changelog

| Date | Change | By |
|---|---|---|
| 2026-03-17 | V1.0 — Initial PRD (single-page portfolio) | JC / Scrummaster |
| 2026-03-17 | Updated for Phase 2 (viewport-responsive hero, mood system) | Scrummaster |
| 2026-03-17 | Updated for Phase 3 (newspaper-style project list, footer) | Scrummaster |
| 2026-03-18 | Updated for Hero V2 (generative per-character drift) | Scrummaster |
| 2026-03-19 | **V2.0 — Architecture pivot.** Site restructured from single-page portfolio to journal of full-screen experiments. ProjectList and Footer removed from experiment pages. Index overlay replaces project list. LogoMark as persistent identity. Routing changed to `/experiments/[slug]`. Home redirects to latest experiment. | Scrummaster (JC creative direction) |
