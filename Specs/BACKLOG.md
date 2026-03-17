# BACKLOG.md — Juanemo Living Backlog

## Last Updated
2026-03-17 — Initial creation (pre-build)

---

## How This Document Works

This is the single source of truth for all work items on the Juanemo project. The scrummaster maintains it. Items flow through these statuses:

| Status | Meaning |
|---|---|
| `🔲 TODO` | Scoped for V1, not yet started |
| `🔵 IN PROGRESS` | Currently being worked in an active phase |
| `✅ DONE` | Completed and approved by JC |
| `🔁 REWORK` | Completed but JC requested changes |
| `📋 V2` | Deferred — not in scope for V1 |

Each item references the phase it belongs to. When a phase completes, the scrummaster moves items from TODO/IN PROGRESS → DONE (or REWORK if changes are needed).

---

## V1 Backlog

### Phase 1 — Scaffolding & Design Tokens

| # | Item | Status | Notes |
|---|---|---|---|
| 1.1 | Initialize Next.js 14+ project (App Router, TypeScript, ESLint) | 🔲 TODO | |
| 1.2 | Install Roboto Flex and DM Sans via Fontsource | 🔲 TODO | |
| 1.3 | Create `globals.css` with full token system (colors, spacing, motion, font axes) | 🔲 TODO | All tokens from DESIGN_SYSTEM.md |
| 1.4 | Implement dark/light mode CSS token switching via `[data-theme]` | 🔲 TODO | Dark default |
| 1.5 | Create type utility classes (display, headline, body variants, labels, dash-separator, cta, accent-rule) | 🔲 TODO | |
| 1.6 | Set up `app/layout.tsx` with font imports, theme init script, mood init script | 🔲 TODO | Both scripts in `<head>` before paint |
| 1.7 | Create `data/projects.ts` with TypeScript interface and initial entry | 🔲 TODO | |
| 1.8 | Create `lib/moods.ts` — mood definitions export | 🔲 TODO | |
| 1.9 | Create `lib/fitText.ts` — binary search font-size fitter | 🔲 TODO | |
| 1.10 | Create `lib/heroListeners.ts` — resize + scroll listener functions | 🔲 TODO | |
| 1.11 | Verify `npm run build` passes with no errors | 🔲 TODO | |

### Phase 2 — Hero Component

| # | Item | Status | Notes |
|---|---|---|---|
| 2.1 | Create `Hero.tsx` + `Hero.module.css` — JUANEMO as real DOM text | 🔲 TODO | Roboto Flex, all-caps, Dun color |
| 2.2 | Wire viewport-responsive width axis (wdth 25–151, opsz 8–144) | 🔲 TODO | Resize listener, 320–1920px mapping |
| 2.3 | Implement fitText — JUANEMO fills container edge to edge | 🔲 TODO | Binary search, runs on mount + resize |
| 2.4 | Implement scroll compression (wght, GRAD, size, opacity, tracking) | 🔲 TODO | 0–300px scroll range |
| 2.5 | Add Bittersweet accent rule (2px, structurally positioned) | 🔲 TODO | |
| 2.6 | Verify mood system integration — 5 moods visibly distinct, no flash | 🔲 TODO | |
| 2.7 | Responsive QA: 320px, 768px, 1280px, 1920px, 2560px | 🔲 TODO | |
| 2.8 | `prefers-reduced-motion` disables transitions | 🔲 TODO | |

### Phase 3 — Project List & Data Layer

| # | Item | Status | Notes |
|---|---|---|---|
| 3.1 | Finalize `data/projects.ts` with TypeScript interface and population | 🔲 TODO | |
| 3.2 | Create `ProjectList.tsx` + `ProjectList.module.css` | 🔲 TODO | Eyebrow, title link, description, tags |
| 3.3 | CTA arrow behavior (muted → Bittersweet, 3px nudge on hover) | 🔲 TODO | |
| 3.4 | Responsive layout within `--page-margin`, vertical rhythm | 🔲 TODO | |
| 3.5 | Verify adding a new project object renders immediately | 🔲 TODO | |

### Phase 4 — Footer & Theme Toggle

| # | Item | Status | Notes |
|---|---|---|---|
| 4.1 | Create `Footer.tsx` + `Footer.module.css` — three-column layout | 🔲 TODO | |
| 4.2 | Dash separator name treatment: `JUAN---CARLOS MORALES` | 🔲 TODO | `-0.15em` tracking |
| 4.3 | "BUILT WITH CLAUDE CODE →" link (Bittersweet hover, links to claude.ai) | 🔲 TODO | |
| 4.4 | Theme toggle: `DARK · LIGHT` text labels, localStorage persistence | 🔲 TODO | No flash on load |
| 4.5 | Compose full page in `app/page.tsx`: Hero → Projects → Footer | 🔲 TODO | |
| 4.6 | Responsive footer at all breakpoints | 🔲 TODO | |

### Phase 5 — Polish, Performance & Deploy

| # | Item | Status | Notes |
|---|---|---|---|
| 5.1 | Font preloading — `<link rel="preload">` for Roboto Flex woff2 | 🔲 TODO | |
| 5.2 | Lighthouse audit: LCP < 2s, CLS = 0, Performance 90+ | 🔲 TODO | |
| 5.3 | Accessibility audit: WCAG AA contrast, aria-labels, keyboard nav | 🔲 TODO | |
| 5.4 | Cross-browser testing: Chrome, Safari, Firefox (desktop + mobile) | 🔲 TODO | |
| 5.5 | Responsive QA: full range 320–2560px | 🔲 TODO | |
| 5.6 | Deploy to Vercel, verify production build | 🔲 TODO | |
| 5.7 | Write README.md (run locally, add a project, stack credits) | 🔲 TODO | |

---

## V2 Backlog (Deferred)

Items from PRD and TRD marked as future/deferred. These do not block V1 launch.

| # | Item | Source | Notes |
|---|---|---|---|
| V2.1 | Generative background element (subtle, typographic, or particle-based) | PRD, TRD | Flash-era homage |
| V2.2 | Project hover states — preview or texture reveal | PRD | |
| V2.3 | "Making of" easter egg — surface Claude Code prompts used per project | PRD | |
| V2.4 | Sound layer — ambient, minimal, opt-in | PRD, TRD | |
| V2.5 | Additional moods beyond the initial 5 | PRD | |
| V2.6 | Per-project mood assignment on hover | PRD, TRD | Each project triggers a specific mood |
| V2.7 | Mood name surfaced visibly (hidden element, console.log easter egg) | TRD | |
| V2.8 | Analytics integration (Vercel Analytics or Plausible) | PRD | "Added silently" — low priority |
| V2.9 | Font subsetting (Latin + uppercase only) for file size optimization | TRD | Only if font file is large |

---

## Changelog

| Date | Change | By |
|---|---|---|
| 2026-03-17 | Initial backlog created from SPRINT_PLAN.md, PRD.md, and TRD.md | Scrummaster |
