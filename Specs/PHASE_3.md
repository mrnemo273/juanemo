# PHASE 3 — Project List & Data Layer

## Sprint Goal

Build the project index below the hero — a typographic vertical list that's easy for JC to update by editing a single TypeScript file. No cards, no thumbnails, no visual complexity. Just beautifully set type that reads like a table of contents in a design monograph.

## Status: `COMPLETE`

## Depends On: Phase 2 (complete ✅ — with deferred items: scroll compression, accent rule, mood system)

---

## Prerequisites

- Phase 2 is complete: hero is working, `app/page.tsx` renders `<Hero />`, no scroll compression (deferred)
- Read `DESIGN_SYSTEM.md` §2 (Body & UI — DM Sans, Full Type Scale) and §4 (Component Patterns — Tag/Pill, Section with Eyebrow, CTAs)
- Read `PRD.md` §"Feature 2: Project List" for behavior requirements
- **Current page state:** Hero takes 50vh at top. No scroll compression — the project list simply sits below the hero in normal document flow. Page uses `<main>` wrapper.

---

## Task List

### 3.1 — Finalize Data Layer
- [x] Confirm `data/projects.ts` exists (from Phase 1) with the `Project` interface:
  ```ts
  export interface Project {
    name: string;
    description: string;
    url: string;
    year: number;
    tags: string[];
  }
  ```
- [x] Populate with initial project(s). At minimum:
  ```ts
  {
    name: "State of Creative Jobs",
    description: "Research tool tracking demand, salary, and AI risk across 20 creative job titles.",
    url: "https://state-of-creative-jobs.vercel.app",
    year: 2025,
    tags: ["Next.js", "TypeScript", "Claude Code"],
  }
  ```
- [x] Verify that adding a second dummy project object renders correctly (remove after testing, or leave if JC has a second project)

### 3.2 — Create ProjectList Component
- [x] Create `components/ProjectList.tsx` and `components/ProjectList.module.css`
- [x] Import projects from `data/projects.ts`
- [x] Render a vertical list with no wrapping cards — each entry is:
  1. **Eyebrow** (`.label-lg`): `{year} · {tags.join(' · ')}` — all uppercase, 14px, 500 weight, 0.1em tracking, `--color-text-faint`
  2. **Project name** as a linked heading: 18px, 500 weight, -0.01em tracking. Links to `project.url`
  3. **Description**: one line of body copy (15px, 400 weight, `--color-text`)
  4. **Tags** (optional): `.tag` pill chips below the description — translucent bg, 8px padding, 8px radius, flex-wrap with gap 8px
- [x] Each entry wrapped in a semantic element (`<article>` or `<li>`)
- [x] Gap between entries: `--space-xl` (64px) or similar for generous vertical rhythm

### 3.3 — CTA Arrow Behavior
- [x] Each project name link includes a ` →` arrow
- [x] Use the `.cta` pattern from DESIGN_SYSTEM.md:
  - At rest: `--color-text-muted`
  - On hover: `--color-accent` (Bittersweet), arrow nudges 3px right via `transform: translateX(3px)`
  - Transition: `--duration-fast` (120ms) with `--ease-out-expo`
- [x] Arrow is wrapped in a `<span class="arrow">` for independent transform
- [x] Links open `target="_blank"` with `rel="noopener noreferrer"`
- [x] Links have descriptive text (the project name itself) — if ambiguous, add `aria-label`

### 3.4 — Layout & Responsiveness
- [x] Project list sits within `--page-margin` padding
- [x] Max width: `--max-width` (1400px), centered
- [x] Comfortable spacing between the hero section and the project list
- [x] Tag pills wrap naturally with `flex-wrap` at narrow viewports
- [x] Test at 320px, 768px, 1280px, 1920px — no breaks, good rhythm
- [x] Eyebrow text stays single-line on mobile (may need to abbreviate tag joins at very narrow widths — builder discretion)

### 3.5 — Integration with Page
- [x] Add `<ProjectList />` to `app/page.tsx` below the Hero component (Hero already rendered there)
- [x] Verify spacing and flow between hero (50vh, no scroll compression) and project list
- [x] The project list should be the natural next thing the user sees below the hero

---

## Definition of Done

- [x] Project list renders below the hero with correct typography (all tokens match DESIGN_SYSTEM.md)
- [x] Eyebrow labels are uppercase, tracked, faint opacity
- [x] Project name links hover to Bittersweet with arrow nudge animation
- [x] Links open in new tabs
- [x] Tags render as translucent pills with correct padding and radius
- [x] Adding a new object to `data/projects.ts` immediately shows a new entry
- [x] Layout holds at all viewport widths 320–2560px
- [x] Vertical rhythm between entries feels generous and deliberate
- [x] `npm run build` passes

---

## Builder Notes

> _Document decisions, problems, deviations, and items for the scrummaster here._

### Decisions Made
- **Newspaper-style redesign** per JC feedback: full-bleed layout (no max-width), oversized all-caps titles, numbered entries, thin HR separators, dedicated CTA buttons
- Removed tag chips and tag data from `Project` interface — replaced `year` + `tags` with `publishedDate` string field
- Numbers (`01`, `02`) rendered in Bittersweet at the same `clamp(28px, 3vw, 40px)` size as titles, weight 300 for contrast
- Date eyebrow positioned below the title (not above) per JC direction
- Titles are `text-transform: uppercase` to match the JUANEMO hero aesthetic
- Mobile (≤600px): numbers stack on top of content instead of side-by-side grid
- Added `<Footer>` component: three-column layout with site URL, copyright, and contact links (Email + LinkedIn)
- Footer stacks vertically on mobile (≤600px)

### Problems Encountered
- Dev server cached old component after data model change, causing a runtime error referencing removed `tags` field. Resolved by restarting the dev server.

### Deviations from Spec
- Significant redesign from original Phase 3 spec based on JC's creative direction feedback. Original spec called for constrained-width typographic list with eyebrow tags + pill chips. Final implementation is a full-bleed newspaper-style index with oversized caps, numbered entries, and no tags.

### Items for Scrummaster
- Footer uses `hello@juanemo.com` as placeholder email — JC to confirm actual email address
- `publishedDate` is a free-form string field — no date parsing or sorting logic. Projects render in array order.

---

## Completion Summary

| Field | Value |
|---|---|
| Date completed | 2026-03-17 |
| All tasks done? | Yes — redesigned per JC feedback, all features implemented |
| Build passing? | Yes — `npm run build` compiles with zero errors, static generation succeeds |
| Deviations? | Major: redesigned from constrained typographic list to full-bleed newspaper-style index per JC creative direction |
| New items for backlog? | Confirm footer email address; consider adding project sorting by date; Footer component ready for theme toggle integration in Phase 4 |
