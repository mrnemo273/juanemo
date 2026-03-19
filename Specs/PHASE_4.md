# PHASE 4 — Theme Toggle & Footer Refinement

## Sprint Goal

Wire up the dark/light theme toggle and make any final refinements to the footer. The footer component and full page composition were completed in Phase 3 — this phase focuses on the theme switching behavior and any JC-directed footer changes.

## Status: `READY`

## Depends On: Phase 3 (complete ✅)

---

## Prerequisites

- Phase 3 is complete: Hero, ProjectList, and Footer are rendered in `app/page.tsx`
- `<head>` theme init script already reads `localStorage('juanemo-theme')` and sets `data-theme` before paint (Phase 1)
- `[data-theme="light"]` semantic tokens already defined in `globals.css` (Phase 1)
- Read `DESIGN_SYSTEM.md` §7 (Theme Toggle)
- Read `PRD.md` §"Feature 4: Dark / Light Mode"

**What already exists (from Phase 3):**
- `components/Footer.tsx` — three-column layout: `juanemo.com` / `© 2026 Juan-Carlos Morales` / Email + LinkedIn
- Footer uses `.label` styles (11px, 500, tracked, uppercase, `--color-text-faint`), links hover to Bittersweet
- Footer stacks vertically on mobile (≤600px)
- Page composition: `<Hero /> + <ProjectList /> + <Footer />`

---

## Task List

### 4.1 — Theme Toggle Component
- [ ] Add theme toggle to the Footer (or as a standalone component placed in Footer)
- [ ] `DARK · LIGHT` as text labels, no icons
- [ ] Active mode: full opacity; inactive mode: faint opacity (`--color-text-faint`)
- [ ] `'use client'` required for the toggle (or make Footer a client component)
- [ ] On click: toggle `data-theme` attribute on `document.documentElement`
- [ ] Save preference to `localStorage`:
  ```ts
  localStorage.setItem('juanemo-theme', newTheme);
  ```
- [ ] Transition: 300ms with `--ease-in-out` on color/background changes

### 4.2 — Theme Verification
- [ ] Reload with light mode saved → page renders light immediately, **no dark flash**
- [ ] Clear localStorage → defaults to dark
- [ ] Light mode correctly inverts all semantic color tokens:
  - `--color-bg` → Bone
  - `--color-text` → Gunmetal
  - `--color-text-muted` → Outer Space
  - `--color-text-faint` → rgba(gunmetal, 0.5)
  - `--color-text-soft` → rgba(gunmetal, 0.8)
  - `--color-surface` → Dun
  - `--color-tag-bg` → rgba(0,0,0,0.08)
  - `--color-accent` → Bittersweet (unchanged)
- [ ] Hero text, project list, footer all look correct in light mode
- [ ] Bittersweet accent elements (entry numbers, CTA hovers) remain visible in both modes

### 4.3 — Footer Refinements (JC to decide)
- [ ] Confirm footer email address — `hello@juanemo.com` is currently a placeholder
- [ ] JC to decide: add "BUILT WITH CLAUDE CODE →" link? (original spec had it, current footer doesn't)
- [ ] JC to decide: add dash separator name treatment `JUAN---CARLOS MORALES`? (original spec had it)

### 4.4 — Responsive & Build Verification
- [ ] Theme toggle works at all viewport sizes
- [ ] Footer layout holds with toggle added
- [ ] `npm run build` passes

---

## Definition of Done

- [ ] Theme toggle switches between dark and light modes visually
- [ ] Theme persists across page reloads via localStorage
- [ ] No theme flash on initial load (either mode)
- [ ] Light mode correctly inverts all semantic color tokens
- [ ] Footer email address confirmed by JC
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
