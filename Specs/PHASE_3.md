# PHASE 3 — Project List & Data Layer

## Sprint Goal

Build the project index below the hero — a typographic vertical list that's easy for JC to update by editing a single TypeScript file. No cards, no thumbnails, no visual complexity. Just beautifully set type that reads like a table of contents in a design monograph.

## Status: `NOT STARTED`

## Depends On: Phase 2 (complete and approved)

---

## Prerequisites

- Phase 2 is complete: hero is working, page structure exists
- Read `DESIGN_SYSTEM.md` §2 (Body & UI — DM Sans, Full Type Scale) and §4 (Component Patterns — Tag/Pill, Section with Eyebrow, CTAs)
- Read `PRD.md` §"Feature 2: Project List" for behavior requirements

---

## Task List

### 3.1 — Finalize Data Layer
- [ ] Confirm `data/projects.ts` exists (from Phase 1) with the `Project` interface:
  ```ts
  export interface Project {
    name: string;
    description: string;
    url: string;
    year: number;
    tags: string[];
  }
  ```
- [ ] Populate with initial project(s). At minimum:
  ```ts
  {
    name: "State of Creative Jobs",
    description: "Research tool tracking demand, salary, and AI risk across 20 creative job titles.",
    url: "https://state-of-creative-jobs.vercel.app",
    year: 2025,
    tags: ["Next.js", "TypeScript", "Claude Code"],
  }
  ```
- [ ] Verify that adding a second dummy project object renders correctly (remove after testing, or leave if JC has a second project)

### 3.2 — Create ProjectList Component
- [ ] Create `components/ProjectList.tsx` and `components/ProjectList.module.css`
- [ ] Import projects from `data/projects.ts`
- [ ] Render a vertical list with no wrapping cards — each entry is:
  1. **Eyebrow** (`.label-lg`): `{year} · {tags.join(' · ')}` — all uppercase, 14px, 500 weight, 0.1em tracking, `--color-text-faint`
  2. **Project name** as a linked heading: 18px, 500 weight, -0.01em tracking. Links to `project.url`
  3. **Description**: one line of body copy (15px, 400 weight, `--color-text`)
  4. **Tags** (optional): `.tag` pill chips below the description — translucent bg, 8px padding, 8px radius, flex-wrap with gap 8px
- [ ] Each entry wrapped in a semantic element (`<article>` or `<li>`)
- [ ] Gap between entries: `--space-xl` (64px) or similar for generous vertical rhythm

### 3.3 — CTA Arrow Behavior
- [ ] Each project name link includes a ` →` arrow
- [ ] Use the `.cta` pattern from DESIGN_SYSTEM.md:
  - At rest: `--color-text-muted`
  - On hover: `--color-accent` (Bittersweet), arrow nudges 3px right via `transform: translateX(3px)`
  - Transition: `--duration-fast` (120ms) with `--ease-out-expo`
- [ ] Arrow is wrapped in a `<span class="arrow">` for independent transform
- [ ] Links open `target="_blank"` with `rel="noopener noreferrer"`
- [ ] Links have descriptive text (the project name itself) — if ambiguous, add `aria-label`

### 3.4 — Layout & Responsiveness
- [ ] Project list sits within `--page-margin` padding
- [ ] Max width: `--max-width` (1400px), centered
- [ ] Comfortable spacing between the hero section and the project list
- [ ] Tag pills wrap naturally with `flex-wrap` at narrow viewports
- [ ] Test at 320px, 768px, 1280px, 1920px — no breaks, good rhythm
- [ ] Eyebrow text stays single-line on mobile (may need to abbreviate tag joins at very narrow widths — builder discretion)

### 3.5 — Integration with Page
- [ ] Add `<ProjectList />` to `app/page.tsx` below the Hero component
- [ ] Verify spacing and flow between hero (compressed state) and project list
- [ ] Scroll past the hero → project list should be the natural next thing the user reads

---

## Definition of Done

- [ ] Project list renders below the hero with correct typography (all tokens match DESIGN_SYSTEM.md)
- [ ] Eyebrow labels are uppercase, tracked, faint opacity
- [ ] Project name links hover to Bittersweet with arrow nudge animation
- [ ] Links open in new tabs
- [ ] Tags render as translucent pills with correct padding and radius
- [ ] Adding a new object to `data/projects.ts` immediately shows a new entry
- [ ] Layout holds at all viewport widths 320–2560px
- [ ] Vertical rhythm between entries feels generous and deliberate
- [ ] `npm run build` passes

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
