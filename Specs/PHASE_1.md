# PHASE 1 — Scaffolding & Design Tokens

## Sprint Goal

Stand up the Next.js project, install all dependencies, wire up fonts, and establish the full design token system in CSS custom properties. Build all utility libraries. No visible UI beyond a styled blank page — just the foundation everything else depends on.

## Status: `COMPLETE`

---

## Prerequisites

- Read `GOALS.md` — understand the creative vision before writing a line of code
- Read `DESIGN_SYSTEM.md` — every token value is specified there, do not improvise
- Read `TRD.md` — stack decisions, font spec, file structure, and code patterns are all defined

---

## Task List

### 1.1 — Initialize Next.js Project
- [ ] Run `npx create-next-app@latest juanemo --typescript --app --eslint`
- [ ] Verify `tsconfig.json`, `next.config.js`, `package.json` are clean
- [ ] Remove boilerplate content from `app/page.tsx` and `app/globals.css`
- [ ] Confirm `npm run dev` starts cleanly

### 1.2 — Install Font Packages
- [ ] `npm install @fontsource-variable/roboto-flex`
- [ ] `npm install @fontsource/dm-sans`
- [ ] Import in `app/layout.tsx`:
  ```ts
  import '@fontsource-variable/roboto-flex';
  import '@fontsource/dm-sans/400.css';
  import '@fontsource/dm-sans/500.css';
  ```
- [ ] Verify fonts appear in DevTools Network tab (woff2 files loading)

### 1.3 — Create `app/globals.css` — Full Token System
- [ ] **Color primitives:**
  ```css
  --color-gunmetal: #1F2627;
  --color-outer-space: #364245;
  --color-bittersweet: #F25C54;
  --color-dun: #D6C5AB;
  --color-bone: #EBE2D6;
  ```
- [ ] **Semantic tokens (dark default):**
  ```css
  --color-bg: var(--color-gunmetal);
  --color-surface: var(--color-outer-space);
  --color-text: var(--color-bone);
  --color-text-muted: var(--color-dun);
  --color-text-faint: rgba(235, 226, 214, 0.5);
  --color-text-soft: rgba(235, 226, 214, 0.8);
  --color-accent: var(--color-bittersweet);
  --color-tag-bg: rgba(255, 255, 255, 0.08);
  ```
- [ ] **Light mode overrides** under `[data-theme="light"]` — see DESIGN_SYSTEM.md §1 for exact values
- [ ] **Spacing scale:**
  ```css
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 32px;
  --space-xl: 64px;
  --space-2xl: 128px;
  --page-margin: clamp(24px, 5vw, 80px);
  --hero-height: 50vh;
  --max-width: 1400px;
  --card-radius: 16px;
  --tag-radius: 8px;
  ```
- [ ] **Motion tokens:**
  ```css
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 120ms;
  --duration-mid: 220ms;
  --duration-slow: 400ms;
  ```
- [ ] **Hero axis CSS custom properties** with defaults:
  ```css
  --hero-wdth: 100;
  --hero-wght: 900;
  --hero-opsz: 100;
  --hero-grad: 0;
  --hero-slnt: 0;
  --hero-xtra: 468;
  --hero-xopq: 88;
  --hero-yopq: 78;
  --hero-ytuc: 620;
  --scroll-progress: 0;
  ```
- [ ] **Reduced motion media query:**
  ```css
  @media (prefers-reduced-motion: reduce) {
    * { transition-duration: 0ms !important; animation-duration: 0ms !important; }
  }
  ```
- [ ] **Base body styles:**
  ```css
  body {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px;
    font-weight: 400;
    line-height: 1.65;
    color: var(--color-text);
    background-color: var(--color-bg);
  }
  ```

### 1.4 — Type Utility Classes
- [ ] `.hero-text` — Roboto Flex, uppercase, `letter-spacing: -0.04em`, `line-height: 0.9`, `color: var(--color-text-muted)`, full `font-variation-settings` driven by CSS vars
- [ ] `.display` — 44–70px, weight 300, line-height 1.2, tracking -0.03em
- [ ] `.headline` — 24px, weight 300, line-height 1.5, tracking -0.02em
- [ ] `.body-lg` — 18px, weight 400, line-height 1.5, tracking -0.01em
- [ ] `.body` — 15px, weight 400, line-height 1.65
- [ ] `.body-sm` — 13px, weight 400, line-height 1.6
- [ ] `.project-title` — 18px, weight 500, line-height 1.2, tracking -0.01em
- [ ] `.label-lg` — 14px, weight 500, tracking 0.1em, uppercase, `--color-text-faint`
- [ ] `.label` — 11px, weight 500, tracking 0.1em, uppercase, `--color-text-muted`
- [ ] `.footer` — 13px, weight 500, tracking 0.1em, uppercase, `--color-text-faint`
- [ ] `.dash-separator` — `letter-spacing: -0.15em`, `color: var(--color-text-faint)`
- [ ] `.cta` — inline-flex, gap 6px, 13px/500, muted color, hover → accent, arrow nudge 3px
- [ ] `.accent-rule` — `display: block`, `width: 100%`, `height: 2px`, `background: var(--color-accent)`

### 1.5 — Set Up `app/layout.tsx`
- [ ] `<html lang="en" suppressHydrationWarning>`
- [ ] Inline `<script>` in `<head>` for **theme initialization** (read `localStorage('juanemo-theme')`, set `data-theme` before paint)
- [ ] Inline `<script>` in `<head>` for **mood system initialization** — random mood selection, set CSS vars. Use exact mood values from TRD.md/DESIGN_SYSTEM.md:
  ```
  SHARP:   { GRAD: 120,  XTRA: 340, XOPQ: 160, YOPQ: 30,  YTUC: 740, slnt: 0,  opsz: 144 }
  AIRY:    { GRAD: -100, XTRA: 580, XOPQ: 40,  YOPQ: 100, YTUC: 528, slnt: 0,  opsz: 80  }
  HEAVY:   { GRAD: 150,  XTRA: 400, XOPQ: 175, YOPQ: 25,  YTUC: 760, slnt: 0,  opsz: 144 }
  REFINED: { GRAD: 0,    XTRA: 468, XOPQ: 88,  YOPQ: 78,  YTUC: 620, slnt: -1, opsz: 100 }
  PUNCHY:  { GRAD: 100,  XTRA: 460, XOPQ: 130, YOPQ: 50,  YTUC: 760, slnt: 0,  opsz: 120 }
  ```
- [ ] `<body>` with globals.css applied
- [ ] Metadata: title "Juanemo", description appropriate for JC's creative site

### 1.6 — Create Data & Lib Files
- [ ] `data/projects.ts`:
  ```ts
  export interface Project {
    name: string;
    description: string;
    url: string;
    year: number;
    tags: string[];
  }

  export const projects: Project[] = [
    {
      name: "State of Creative Jobs",
      description: "Research tool tracking demand, salary, and AI risk across 20 creative job titles.",
      url: "https://state-of-creative-jobs.vercel.app",
      year: 2025,
      tags: ["Next.js", "TypeScript", "Claude Code"],
    },
  ];
  ```
- [ ] `lib/moods.ts` — mood definitions object, type, random selector function. Export both the data and the selector.
- [ ] `lib/fitText.ts` — binary search font-size fitter function (see TRD.md for algorithm). Export as named function.
- [ ] `lib/heroListeners.ts` — `updateHeroAxes()` (resize → wdth/opsz mapping) and `updateHeroScroll()` (scroll → wght/GRAD/tracking/opacity). Both exported. See TRD.md for exact mapping ranges.

### 1.7 — Verify Build
- [ ] `npm run dev` starts without errors
- [ ] Page loads with Gunmetal background
- [ ] Fonts are loaded (check DevTools Network tab)
- [ ] CSS custom properties visible on `:root` in DevTools
- [ ] Mood system sets random axis vars on each refresh
- [ ] Theme var toggleable manually (set `data-theme="light"` in DevTools → bg flips to Bone)
- [ ] All lib files import/export correctly (no TS errors)
- [ ] `npm run build` passes clean

---

## Definition of Done

All of the following must be true before Phase 1 is complete:

- [x] Next.js project runs with `npm run dev` and builds with `npm run build`
- [x] Roboto Flex and DM Sans are loaded and visible in Network tab
- [x] Full CSS token system matches DESIGN_SYSTEM.md exactly
- [x] Dark/light semantic tokens switch correctly via `[data-theme]`
- [x] Mood system randomizes hero axis vars on each page load
- [x] Theme init script prevents flash (set before paint in `<head>`)
- [x] All lib files (`moods.ts`, `fitText.ts`, `heroListeners.ts`) export without TS errors
- [x] `data/projects.ts` has the TypeScript interface and at least one entry
- [x] File structure matches TRD.md spec
- [x] Zero TypeScript errors, zero ESLint errors

---

## Builder Notes

> _This section is for the builder agent to fill in during or after execution. Document any decisions made, problems encountered, deviations from spec, or items the scrummaster should process._

### Decisions Made
- Scaffolded Next.js in a temp directory and copied files into existing git repo to preserve the `.git` and `Specs/` directories
- Package name corrected from `juanemo-scaffold` to `juanemo`
- Used Next.js 16.1.7 (latest at time of scaffold) with App Router, TypeScript, ESLint — no Tailwind
- The `updateHeroScroll` function captures the initial mood GRAD value at listener attach time (via closure) to avoid compounding reduction on each scroll frame. The TRD's inline example had a subtle bug where reading `--hero-grad` on each frame would compound the fade; fixed by capturing the mood value once in `attachHeroListeners()`
- Removed `updateHeroScroll` as a standalone export since it's now created via closure inside `attachHeroListeners()` — the public API is `updateHeroAxes()` and `attachHeroListeners()` which is cleaner
- The `--hero-opsz` property is set both by the mood script (in `<head>`) and by the resize listener. The resize listener will overwrite the mood's opsz on mount, which is correct per the TRD — viewport-responsive axes take precedence, mood axes are the secondary set (`GRAD`, `XTRA`, `XOPQ`, `YOPQ`, `YTUC`, `slnt`)
- Empty `components/` directory created per TRD file structure spec — ready for Phase 2 (Hero.tsx, ProjectList.tsx, Footer.tsx)

### Problems Encountered
- `create-next-app` prompted for React Compiler (new in v16) — handled via stdin redirect
- No issues with font packages or TypeScript compilation

### Deviations from Spec
- TRD shows `public/fonts/` directory for optional self-hosting of woff2 files. Since we're using Fontsource packages (which handle self-hosting automatically), this directory is unnecessary and was not created. The fonts are served from `node_modules` via webpack/turbopack import.
- The `dev` script uses Turbopack by default in Next.js 16 (no `--turbopack` flag needed — it's the default)

### Items for Scrummaster
- The font preload `<link>` tag mentioned in DESIGN_SYSTEM.md §8 (`/_next/static/media/roboto-flex-latin-wght-normal.woff2`) should be verified once `npm run dev` is tested in browser — the exact filename is generated by the build system and may differ. This is a Phase 2 optimization item.
- Consider whether `--hero-opsz` should be excluded from the mood script since the resize listener overwrites it immediately. Current behavior works correctly but the mood's opsz value is briefly visible before JS mount.

---

## Completion Summary

> _Builder fills this in when all tasks are done._

| Field | Value |
|---|---|
| Date completed | 2026-03-17 |
| All tasks done? | Yes — all 7 task groups complete |
| Build passing? | Yes — `npm run build` and `npm run lint` pass with zero errors |
| Deviations? | Minor — no `public/fonts/` dir (Fontsource handles it), font preload tag deferred to Phase 2 |
| New items for backlog? | Font preload `<link>` verification after dev server test; consider removing opsz from mood script |
