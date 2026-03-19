# PHASE A — Architecture Pivot

## Sprint Goal

Restructure the site from a single-page portfolio (Hero + ProjectList + Footer) to a journal of full-screen experiments. Set up routing, data model, experiment shell, and refactor the existing Hero into Experiment #1. When this phase is done, landing on the site drops you directly into the generative typography experiment — no list, no footer, no scroll.

## Status: `COMPLETE`

## Depends On: Hero V3 (complete ✅)

---

## Prerequisites

- Hero V3 is complete: generative per-character drift, scaleXY fill, hidden clone, mobile axis caps
- Read `Specs/GOALS.md` — the site is a creative sandbox, not a portfolio
- Read `Specs/PRD.md` — V2.0 architecture: experiment journal, full-screen experiences
- Read `Specs/TRD.md` — §"Routing Architecture", §"File Structure (V2.0)", §"Experiment Data"
- Read `Specs/DESIGN_SYSTEM.md` — §9 Component Reference for `ExperimentShell` and `GenerativeType`

**Reference prototypes (open in browser to understand the target):**
- `prototypes/hero-generative-scaled.html` — the approved generative drift + scaleXY behavior
- `prototypes/hero-generative-pause.html` — the drift + hold cycle feel

---

## Task List

### A.1 — Create Experiment Data Model

- [x]Create `data/experiments.ts`:
  ```ts
  export interface Experiment {
    slug: string;
    name: string;
    description: string;
    publishedDate: string;
  }

  export const experiments: Experiment[] = [
    {
      slug: "generative-type",
      name: "Generative Typography",
      description: "Per-character variable font drift — the wordmark is never the same twice.",
      publishedDate: "March 2025",
    },
  ];
  ```
- [x]Array is in reverse chronological order (newest first)
- [x]The old `data/projects.ts` can remain in the codebase but is no longer imported by any component

### A.2 — Create ExperimentShell Component

- [x]Create `components/ExperimentShell.tsx` and `components/ExperimentShell.module.css`
- [x]Full-viewport, no-scroll container:
  ```css
  .shell {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
    background: var(--color-bg);
  }
  ```
- [x]Accepts `children` — the experiment component renders inside
- [x]This is a server component (no client-side logic needed — just a styled wrapper)

### A.3 — Refactor Hero → GenerativeType Experiment

- [x]Create `components/experiments/GenerativeType.tsx` and `components/experiments/GenerativeType.module.css`
- [x]Move all logic from current `components/Hero.tsx` into this new file
- [x]The component should fill its parent container (`width: 100%; height: 100%`) — `ExperimentShell` provides the viewport sizing
- [x]Adjust the hero container CSS:
  - Remove fixed `height: 50vh` / `35vh` — the experiment fills whatever container it's in (which will be `100vh` via ExperimentShell)
  - Keep padding, flex alignment, overflow, position relative
  - Mobile padding adjustment still applies
- [x]Verify: drift + hold cycle, scaleXY, spring easing, mobile axis caps — everything works identically to current Hero
- [x]Import from `lib/generativeAxes.ts` — no changes needed there

### A.4 — Set Up Experiment Routing

- [x]Create `app/experiments/[slug]/page.tsx`:
  ```tsx
  import { experiments } from '@/data/experiments';
  import ExperimentShell from '@/components/ExperimentShell';
  import GenerativeType from '@/components/experiments/GenerativeType';
  import { notFound } from 'next/navigation';

  // Map slugs to experiment components
  const experimentComponents: Record<string, React.ComponentType> = {
    'generative-type': GenerativeType,
  };

  export default async function ExperimentPage({
    params,
  }: {
    params: Promise<{ slug: string }>;
  }) {
    const { slug } = await params;
    const experiment = experiments.find(e => e.slug === slug);
    if (!experiment) notFound();

    const Component = experimentComponents[slug];
    if (!Component) notFound();

    return (
      <ExperimentShell>
        <Component />
      </ExperimentShell>
    );
  }

  // Generate static params for all experiments
  export function generateStaticParams() {
    return experiments.map(e => ({ slug: e.slug }));
  }
  ```
- [x]Verify: `/experiments/generative-type` renders the full-screen generative typography experiment

### A.5 — Update Home Route (Redirect)

- [x]Update `app/page.tsx` to redirect to the latest experiment:
  ```tsx
  import { redirect } from 'next/navigation';
  import { experiments } from '@/data/experiments';

  export default function Home() {
    const latest = experiments[0];
    if (latest) {
      redirect(`/experiments/${latest.slug}`);
    }
    return null;
  }
  ```
- [x]Verify: landing on `juanemo.com` (or `localhost:3000`) immediately redirects to `/experiments/generative-type`

### A.6 — Update Layout (Remove Old Components)

- [x]Update `app/layout.tsx`:
  - Keep: font imports (`full.css`, DM Sans), theme init script, `globals.css`, `<html>` setup
  - Remove: any imports of `Hero`, `ProjectList`, `Footer` (they may still be in `page.tsx`, not layout — verify)
  - For now, just render `{children}` — LogoMark and INDEX trigger come in Phase B
- [x]The old `components/Hero.tsx`, `ProjectList.tsx`, `Footer.tsx` can remain in the codebase as reference but are no longer rendered. Do NOT delete them.

### A.7 — Disable Document Scroll

- [x]Add to `globals.css`:
  ```css
  html, body {
    overflow: hidden;
    height: 100vh;
    width: 100vw;
  }
  ```
  This enforces the no-scroll paradigm at the document level. Individual experiments handle their own internal overflow if needed.

### A.8 — Build & QA

- [x]`npm run build` — zero errors
- [x]`localhost:3000` redirects to `/experiments/generative-type`
- [x]The generative typography experiment fills the full viewport (100vw × 100vh)
- [x]No scrolling — document overflow hidden
- [x]Drift + hold cycle runs correctly
- [x]ScaleXY fill works (text fills width AND height)
- [x]Mobile (≤600px): axis caps applied, container sizing correct
- [x]Refresh produces different starting configurations
- [x]No old components visible (no ProjectList, no Footer)

---

## Definition of Done

- [x]`/` redirects to `/experiments/generative-type`
- [x]Experiment fills full viewport, no scroll
- [x]`ExperimentShell` wraps the experiment in `100vw × 100vh`
- [x]`GenerativeType` component works identically to the current Hero
- [x]Old `Hero.tsx`, `ProjectList.tsx`, `Footer.tsx` are no longer rendered (preserved as reference)
- [x]`data/experiments.ts` exists with experiment #1
- [x]`npm run build` passes
- [x]Works at 320px through 2560px

---

## Design Guardrails

1. **The browser is a stage, not a document.** No scrolling. `100vw × 100vh`. The frame IS the canvas.
2. **Landing = entering the work.** No welcome page, no list. You're immediately inside the latest experiment.
3. **Don't delete old components.** They're reference code and may inform future work (IndexOverlay will borrow from ProjectList).
4. **Spring easing non-negotiable.** `cubic-bezier(0.34, 1.56, 0.64, 1)`.
5. **The generative drift must feel identical after refactoring.** Same timing, same easing, same axis ranges, same mobile behavior.

---

## Builder Notes

> _Document decisions, problems, deviations, and items for the scrummaster here._

### Decisions Made
- **GenerativeType uses `<div>` container instead of `<header>`** — the Hero used a `<header>` element, but as an experiment component it's semantically a `<div>`. The `role="heading" aria-level={1} aria-label="Juanemo"` attributes remain on the word element for accessibility.
- **No changes to `layout.tsx`** — the layout was already clean (fonts, theme script, `{children}` only). Hero/ProjectList/Footer were imported in `page.tsx`, not `layout.tsx`, so the layout needed no modifications beyond what was already there.
- **`main` max-width rule left in `globals.css`** — the old `main { max-width: var(--max-width); margin: 0 auto; }` rule remains but has no effect since experiment pages don't render a `<main>` element. Left it for reference rather than removing globals rules that might be useful for future non-experiment pages.
- **Container class named `.container` (not `.hero`)** — renamed from `.hero` to `.container` since this is now a generic experiment component that fills its parent, not a hero section.

### Problems Encountered
- None. The refactoring was straightforward — the Hero component's logic was self-contained and transferred cleanly to GenerativeType with only container sizing changes (100% × 100% instead of fixed vh heights).

### Deviations from Spec
- None. All 8 tasks implemented exactly as specified. Spring easing, axis ranges, timing constants, mobile breakpoint, hidden clone measurement — all preserved identically.

### Items for Scrummaster
- The `main` element rule in `globals.css` (max-width: 1600px) is now vestigial for experiment pages. Consider removing or scoping it when the INDEX overlay is built in Phase B.
- Old components (`Hero.tsx`, `ProjectList.tsx`, `Footer.tsx`, `data/projects.ts`) preserved as reference per spec. `Hero.module.css` also preserved.
- The `--hero-height: 50vh` CSS custom property in globals.css is no longer used by any component. Could be cleaned up.

---

## Completion Summary

| Field | Value |
|---|---|
| Date completed | 2026-03-19 |
| All tasks done? | Yes — A.1 through A.8 complete |
| Build passing? | Yes — `npm run build` zero errors, static generation for `/experiments/generative-type` |
| Deviations? | None |
| New items for backlog? | Clean up vestigial `main` max-width rule and `--hero-height` CSS property |
