# SPRINT_PLAN.md — Juanemo Build Phases

## Overview

This document breaks the Juanemo V1 build into **5 phases**, each scoped as a self-contained sprint that a builder agent in Claude Code can pick up and execute against. Phases are sequential — each one assumes the previous phase is complete and passing.

Every phase ends with a **definition of done** so the agent (and you) know when to stop.

---

## Phase 1: Scaffolding & Design Tokens

**Goal:** Stand up the Next.js project, install all dependencies, wire up fonts, and establish the full design token system in CSS custom properties. No visible UI yet — just the foundation everything else builds on.

### Tasks

1. **Initialize Next.js 14+ project with App Router and TypeScript**
   - `npx create-next-app@latest juanemo --typescript --app --eslint`
   - Confirm `tsconfig.json`, `next.config.js`, and `package.json` are clean

2. **Install font packages**
   - `npm install @fontsource-variable/roboto-flex @fontsource/dm-sans`
   - Import Roboto Flex variable and DM Sans 400/500 in `app/layout.tsx`

3. **Create `app/globals.css` with the full token system**
   - Color primitives: `--color-gunmetal`, `--color-outer-space`, `--color-bittersweet`, `--color-dun`, `--color-bone`
   - Semantic tokens (dark default): `--color-bg`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-text-faint`, `--color-text-soft`, `--color-accent`, `--color-tag-bg`
   - Light mode overrides under `[data-theme="light"]`
   - Spacing scale: `--space-xs` through `--space-2xl`, `--page-margin`, `--hero-height`, `--max-width`
   - Motion tokens: `--ease-out-expo`, `--ease-in-out`, `--duration-fast/mid/slow`
   - Hero axis CSS custom properties with defaults: `--hero-wdth`, `--hero-wght`, `--hero-opsz`, `--hero-grad`, `--hero-slnt`, `--hero-xtra`, `--hero-xopq`, `--hero-yopq`, `--hero-ytuc`, `--scroll-progress`
   - `prefers-reduced-motion` media query that kills all transitions/animations

4. **Create type utility classes** (in globals.css or a CSS Module)
   - `.display`, `.headline`, `.body-lg`, `.body`, `.body-sm`, `.project-title`, `.label-lg`, `.label`, `.footer` — matching the full type scale from DESIGN_SYSTEM.md
   - `.dash-separator` with `letter-spacing: -0.15em`
   - `.cta` with arrow hover behavior
   - `.accent-rule` — 2px Bittersweet line

5. **Set up `app/layout.tsx`**
   - Import fonts
   - Add `<html lang="en">` with `suppressHydrationWarning`
   - Include inline `<script>` in `<head>` for theme initialization (read `localStorage`, set `data-theme` before paint)
   - Include inline `<script>` for mood system initialization (random mood, set CSS vars before paint)
   - Basic `<body>` with `globals.css` applied

6. **Create file structure**
   - `components/` directory (empty, ready for Phase 2)
   - `data/projects.ts` with the initial project entry (State of Creative Jobs)
   - `lib/moods.ts` — mood definitions object exported for reference
   - `lib/fitText.ts` — binary search font-size fitter (from TRD)
   - `lib/heroListeners.ts` — resize + scroll listener functions (from TRD)

### Definition of Done
- `npm run dev` starts without errors
- Page loads with Gunmetal background, no content yet (or a placeholder)
- Fonts are loaded (verify in DevTools Network tab — woff2 files served)
- CSS custom properties visible on `:root` in DevTools
- Mood system sets random axis vars on each refresh (check in DevTools)
- Theme var in `localStorage` toggles `[data-theme]` attribute (manually testable)
- All lib files export correctly with no TypeScript errors
- `npm run build` passes

---

## Phase 2: Hero Component

**Goal:** Build the JUANEMO variable typography hero — the centerpiece of the site. This is the hardest component and the one that must feel perfect.

### Tasks

1. **Create `components/Hero.tsx` and `components/Hero.module.css`**
   - Render "JUANEMO" as real DOM text (not SVG, not canvas)
   - Apply `.hero-text` styles: Roboto Flex, uppercase, `letter-spacing: -0.04em`, `line-height: 0.9`, `color: var(--color-text-muted)` (Dun)
   - `font-variation-settings` driven entirely by CSS custom properties
   - `aria-label="Juanemo"` for accessibility
   - Container takes `--hero-height` (50vh) on load

2. **Wire up viewport-responsive width axis**
   - On mount and resize, map viewport width (320–1920px) to `wdth` (25–151) and `opsz` (8–144)
   - Use `lib/heroListeners.ts` resize function
   - Debounce at ~60fps (16ms)

3. **Implement fitText**
   - Use `lib/fitText.ts` binary search to make "JUANEMO" fill container width edge to edge
   - Run on mount and after each resize (after axis update)
   - Must work at every viewport from 320px to 2560px

4. **Implement scroll compression**
   - Map scroll 0–300px to:
     - `wght`: 900 → 500
     - `GRAD`: mood value → 0
     - `letter-spacing`: -0.04em → -0.02em
     - `opacity`: 1 → 0.85
     - `font-size`: 50vh fill → ~5rem
   - Use `requestAnimationFrame` for scroll handler
   - Hero remains visible as a persistent compact header after compression

5. **Add the Bittersweet accent rule**
   - Single 2px horizontal line in `#F25C54`
   - Positioned at a structurally significant point in the hero composition (below or between text elements)
   - Only use of Bittersweet in the hero section

6. **Verify mood system integration**
   - Confirm the `<head>` mood script sets CSS vars before Hero renders
   - Each of the 5 moods (SHARP, AIRY, HEAVY, REFINED, PUNCHY) should produce a visibly distinct character
   - No flash or visible axis change on load

### Definition of Done
- "JUANEMO" fills the top half of viewport edge-to-edge on load
- Resizing the browser smoothly adjusts the letterforms (width axis responds in real time)
- Scrolling compresses the hero smoothly into a compact header
- Refreshing the page produces noticeably different letterform moods
- Accent rule is visible and correctly colored
- Works at 320px, 768px, 1280px, 1920px, 2560px — no breaks, no overflow
- `prefers-reduced-motion` disables transitions
- Lighthouse accessibility audit passes on the hero element
- `npm run build` passes

---

## Phase 3: Project List & Data Layer

**Goal:** Build the project index below the hero — a typographic list that's easy for JC to update by editing a single file.

### Tasks

1. **Finalize `data/projects.ts`**
   - TypeScript interface: `{ name: string; description: string; url: string; year: number; tags: string[] }`
   - Populate with initial project(s)
   - Ensure adding a new entry is obvious and frictionless

2. **Create `components/ProjectList.tsx` and `components/ProjectList.module.css`**
   - Render a vertical list from the projects array
   - Each entry:
     - `.label-lg` eyebrow: year + tags joined with ` · ` (e.g., `2025 · NEXT.JS · CLAUDE CODE`)
     - Project name as a linked heading (18px, 500 weight, `-0.01em` tracking)
     - One-line description in body copy
     - Optional `.tag` pills below (translucent bg, 8px padding/radius)
   - Links open `target="_blank"` with `rel="noopener noreferrer"`

3. **CTA arrow behavior**
   - Each project link includes a `→` arrow
   - At rest: `--color-text-muted`
   - On hover: `--color-accent` (Bittersweet), arrow nudges 3px right
   - Transition: `--duration-fast` with `--ease-out-expo`

4. **Responsive layout**
   - Full-width within `--page-margin`
   - Comfortable vertical rhythm between entries (`--space-xl` or similar)
   - Tag pills wrap naturally with `flex-wrap` and `gap: 8px`

### Definition of Done
- Project list renders below the hero with correct typography
- Eyebrow labels are uppercase, tracked, faint opacity
- Links hover to Bittersweet with arrow nudge animation
- Links open in new tabs
- Adding a new object to `data/projects.ts` immediately shows a new entry on the page
- Layout holds at all viewport widths 320–2560px
- `npm run build` passes

---

## Phase 4: Footer & Theme Toggle

**Goal:** Build the footer bar and wire up the dark/light theme toggle to complete the page structure.

### Tasks

1. **Create `components/Footer.tsx` and `components/Footer.module.css`**
   - Three-column `space-between` layout, full width
   - Left: `JUAN` + `.dash-separator` (`---` with `-0.15em` tracking) + `CARLOS MORALES`
   - Center: `JUANEMO`
   - Right column: `BUILT WITH CLAUDE CODE →` (links to claude.ai, Bittersweet on hover) + theme toggle
   - All text in `.label` / `.footer` styles (13px, 500 weight, 0.1em tracking, uppercase, `--color-text-faint`)

2. **Theme toggle implementation**
   - `DARK · LIGHT` as text labels, no icons
   - Active mode: full opacity; inactive: faint
   - On click: toggle `data-theme` attribute on `<html>`, save to `localStorage`
   - Theme transition: 300ms with `--ease-in-out`
   - Must not flash on page load (handled by `<head>` script from Phase 1)

3. **Responsive footer**
   - On narrow viewports, consider stacking or simplifying (center column can hide on mobile, or all three stack vertically)
   - Maintain legibility and spacing at all breakpoints

4. **Wire up `app/page.tsx`**
   - Compose the full page: `<Hero />` + `<ProjectList />` + `<Footer />`
   - Proper spacing between sections
   - Page-level `--page-margin` padding

### Definition of Done
- Footer renders at page bottom with three columns
- Dash separator between JUAN and CARLOS renders correctly with tight tracking
- "BUILT WITH CLAUDE CODE →" links to claude.ai and turns Bittersweet on hover
- Theme toggle switches between dark and light modes
- Theme persists across page reloads via `localStorage`
- No theme flash on initial load
- Light mode correctly inverts all semantic color tokens
- Footer is legible and well-spaced at all viewports
- Full page composition (Hero → Projects → Footer) flows correctly
- `npm run build` passes

---

## Phase 5: Polish, Performance & Deploy

**Goal:** Final QA pass — performance optimization, accessibility, cross-browser testing, and deployment to Vercel.

### Tasks

1. **Font performance**
   - Add `<link rel="preload">` for the Roboto Flex woff2 file in `<head>`
   - Verify no FOUT (Flash of Unstyled Text) on load
   - Consider font subsetting (Latin + uppercase only) if file size is large

2. **Performance audit**
   - Run Lighthouse: target LCP < 2s, CLS = 0
   - Verify no unnecessary JS bundle weight
   - Ensure scroll/resize listeners are properly debounced and use `requestAnimationFrame`
   - Verify `prefers-reduced-motion` fully disables animations

3. **Accessibility audit**
   - WCAG AA color contrast on all text (verify Dun on Gunmetal, Bone on Gunmetal, Gunmetal on Bone)
   - All links have descriptive text or `aria-label`
   - Hero text is screen-reader accessible
   - Keyboard navigation works for all interactive elements (project links, theme toggle, footer link)

4. **Cross-browser testing**
   - Chrome, Safari, Firefox on desktop
   - Chrome Android, Safari iOS
   - Variable font rendering across all browsers
   - Mood system and scroll compression behavior

5. **Responsive QA**
   - Test at: 320px, 375px, 414px, 768px, 1024px, 1280px, 1440px, 1920px, 2560px
   - No layout breaks, no overflow, no orphaned elements
   - Hero fitText works at every width

6. **Deploy to Vercel**
   - Connect GitHub repo (`mrnemo273/juanemo`)
   - Verify production build succeeds
   - Confirm auto-deploy on push to `main`
   - Test production URL for all behaviors

7. **README.md**
   - Brief project description
   - How to run locally (`npm install && npm run dev`)
   - How to add a project (edit `data/projects.ts`)
   - Stack and font credits

### Definition of Done
- Lighthouse scores: Performance 90+, Accessibility 95+, Best Practices 95+
- LCP < 2s on standard broadband
- CLS = 0 — no layout shift
- All five moods render correctly across Chrome, Safari, Firefox
- Full responsive range 320–2560px with no breaks
- Site is live on Vercel and accessible via URL
- JC can add a new project in under 5 minutes by editing one file and pushing

---

## Phase Summary

| Phase | Name | Focus | Key Deliverable |
|---|---|---|---|
| 1 | Scaffolding & Design Tokens | Foundation | Next.js app with full token system, fonts, mood script, lib utilities |
| 2 | Hero Component | Centerpiece | JUANEMO variable type hero with responsive axes, scroll compression, mood |
| 3 | Project List & Data | Content | Typographic project index driven by a single data file |
| 4 | Footer & Theme Toggle | Completion | Footer bar, dash separator, dark/light toggle, full page composition |
| 5 | Polish, Performance & Deploy | Ship it | Performance, a11y, cross-browser QA, Vercel deployment |

---

## Notes for Builder Agents

- **Read GOALS.md first** before starting any phase. It sets the creative intent. This is not a generic portfolio — it has a point of view.
- **Read DESIGN_SYSTEM.md** before writing any CSS. Every token, every value, every opacity level is specified. Don't improvise colors or sizes.
- **The mood system is sacred.** Do not simplify it, remove randomness, or reduce the axis range. The whole point is that each load feels different.
- **Bittersweet is a line.** One 2px horizontal rule. Not a button color, not a text color, not a hover fill. The only exception is the CTA arrow hover state.
- **Dun, not Bone** for display type on dark backgrounds. This is confirmed and intentional.
- **Typography is the product.** If you're unsure whether something looks right, ask yourself: "Would a senior creative director be proud of this type treatment?" If not, refine it.
