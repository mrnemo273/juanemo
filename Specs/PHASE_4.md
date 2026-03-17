# PHASE 4 — Footer & Theme Toggle

## Sprint Goal

Build the footer bar with its three-column layout and dash separator treatment, wire up the dark/light theme toggle, and compose the full page (Hero → Projects → Footer). This phase completes the page structure.

## Status: `NOT STARTED`

## Depends On: Phase 3 (complete and approved)

---

## Prerequisites

- Phase 3 is complete: hero and project list are working
- Read `DESIGN_SYSTEM.md` §4c (Footer Bar), §7 (Theme Toggle), §2 (The Dash Separator)
- Read `PRD.md` §"Feature 3: Footer Bar" and §"Feature 4: Dark / Light Mode"

---

## Task List

### 4.1 — Create Footer Component
- [ ] Create `components/Footer.tsx` and `components/Footer.module.css`
- [ ] Three-column layout: `display: flex; justify-content: space-between; align-items: center`
- [ ] Full width with `--page-margin` padding
- [ ] All text in `.label` / `.footer` styles: 13px, 500 weight, 0.1em tracking, uppercase, `--color-text-faint`

### 4.2 — Left Column: Name Treatment
- [ ] Render: `JUAN` + dash separator + `CARLOS MORALES`
- [ ] Dash separator: `<span class="dash-separator">---</span>` with `letter-spacing: -0.15em`
- [ ] Dash color: `--color-text-faint`
- [ ] The three hyphens should visually collapse into an em-dash-like ligature

### 4.3 — Center Column: Site Name
- [ ] Render: `JUANEMO`
- [ ] Same `.footer` / `.label` styling as left and right columns

### 4.4 — Right Column: Claude Code Link + Theme Toggle
- [ ] `BUILT WITH CLAUDE CODE →`
  - Links to `https://claude.ai`
  - `target="_blank"`, `rel="noopener noreferrer"`
  - At rest: `--color-text-faint`
  - On hover: `--color-accent` (Bittersweet)
  - Arrow nudge 3px right on hover (same `.cta` pattern)
- [ ] Theme toggle below or inline with the link:
  - `DARK · LIGHT` as text labels
  - Active mode: full opacity
  - Inactive mode: faint opacity (`--color-text-faint`)
  - Clickable — toggles `data-theme` attribute on `<html>`
  - Saves preference to `localStorage('juanemo-theme')`
  - Transition: 300ms with `--ease-in-out`

### 4.5 — Theme Toggle Implementation
- [ ] On click: toggle between `data-theme="dark"` (or no attribute) and `data-theme="light"` on `document.documentElement`
- [ ] Save to `localStorage`:
  ```ts
  localStorage.setItem('juanemo-theme', newTheme);
  ```
- [ ] On page load: the `<head>` script from Phase 1 reads localStorage and sets `data-theme` before paint — **no flash**
- [ ] Verify: reload with light mode saved → page renders light immediately, no dark flash
- [ ] Verify: clear localStorage → defaults to dark

### 4.6 — Responsive Footer
- [ ] At desktop widths: three columns, space-between, single row
- [ ] At narrow viewports (< 768px): consider stacking vertically or simplifying
  - Minimum: left (name) and right (link + toggle) visible
  - Center column (JUANEMO) can hide on mobile if space is tight — builder discretion
  - Must remain legible and well-spaced
- [ ] Test at 320px, 768px, 1280px, 1920px

### 4.7 — Full Page Composition
- [ ] Wire up `app/page.tsx` with all three components:
  ```tsx
  <Hero />
  <ProjectList />
  <Footer />
  ```
- [ ] Proper spacing between sections — use `--page-margin` and semantic spacing
- [ ] Page-level padding: `--page-margin` on left and right
- [ ] Verify the full flow: hero fills top half → scroll compresses hero → project list → footer at bottom
- [ ] Footer should be at the bottom of content (not fixed, not sticky — just at the end of the page flow)

---

## Definition of Done

- [ ] Footer renders with three columns at desktop widths
- [ ] Dash separator between JUAN and CARLOS renders correctly with tight tracking
- [ ] "BUILT WITH CLAUDE CODE →" links to claude.ai and turns Bittersweet on hover
- [ ] Theme toggle switches between dark and light modes visually
- [ ] Theme persists across page reloads via localStorage
- [ ] No theme flash on initial load (either mode)
- [ ] Light mode correctly inverts all semantic color tokens (check: bg, text, surface, muted, faint, soft)
- [ ] Footer is legible and well-spaced at all viewports
- [ ] Full page composition flows correctly: Hero → Projects → Footer
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
