# BACKLOG.md — Juanemo Living Backlog

## Last Updated
2026-03-19 — **V2.0 Architecture pivot.** Site restructured as journal of full-screen experiments. All previous phases complete or superseded.

---

## How This Document Works

This is the single source of truth for all work items on the Juanemo project. The scrummaster maintains it. Items flow through these statuses:

| Status | Meaning |
|---|---|
| `🔲 TODO` | Scoped, not yet started |
| `🔵 IN PROGRESS` | Currently being worked in an active phase |
| `✅ DONE` | Completed and approved by JC |
| `⏸ DEFERRED` | Paused or superseded |
| `📋 V2+` | Deferred — not in scope for current sprint |

---

## Completed Work (Foundation)

All previous phases built the foundation that the V2.0 architecture builds on. These are done:

| Phase | Status | Key Deliverables |
|---|---|---|
| Phase 1 — Scaffolding | ✅ DONE | Next.js 16, tokens, fonts (`full.css`), CSS custom properties |
| Phase 2 — Hero V1 | ✅ DONE (superseded) | Viewport-responsive axes. Mood system tested and deferred. |
| Phase 3 — Project List | ✅ DONE (superseded) | Newspaper-style index, Footer, data model. Moving to IndexOverlay. |
| Hero V2 — Generative Drift | ✅ DONE | Per-character drift + hold, spring easing, scaleX, ResizeObserver |
| Hero V3 — ScaleXY + Mobile | ✅ DONE | ScaleXY fill, hidden clone, mobile axis caps, `randomAxesForWord()` |

---

## V2.0 Architecture — Experiment Journal 🔵

### ARC.1 — Routing & Data Model

| # | Item | Status | Notes |
|---|---|---|---|
| ARC.1.1 | Create `data/experiments.ts` — new data model (slug, name, description, publishedDate) | 🔲 TODO | Replaces `data/projects.ts` |
| ARC.1.2 | Create `/app/experiments/[slug]/page.tsx` — dynamic route for experiments | 🔲 TODO | Loads experiment component by slug |
| ARC.1.3 | Update `/app/page.tsx` — redirect to latest experiment | 🔲 TODO | Reads `experiments[0].slug`, redirects |
| ARC.1.4 | Update `/app/layout.tsx` — add LogoMark + INDEX trigger to shared layout | 🔲 TODO | Persistent across all experiment pages |

### ARC.2 — New Components

| # | Item | Status | Notes |
|---|---|---|---|
| ARC.2.1 | Create `ExperimentShell.tsx` — full-viewport no-scroll container | 🔲 TODO | `100vw × 100vh`, `overflow: hidden` |
| ARC.2.2 | Create `LogoMark.tsx` — static generative logo | 🔲 TODO | Spec in PHASE_HERO_V2.md (HV2.4). Fixed top-left. |
| ARC.2.3 | Create `IndexOverlay.tsx` — full-screen experiment list | 🔲 TODO | Dark overlay, typographic list, reverse chronological |
| ARC.2.4 | Refactor `Hero.tsx` → `experiments/GenerativeType.tsx` | 🔲 TODO | Same component, new location. Experiment #1. |

### ARC.3 — Cleanup & Integration

| # | Item | Status | Notes |
|---|---|---|---|
| ARC.3.1 | Remove `ProjectList.tsx` and `Footer.tsx` from experiment pages | 🔲 TODO | Content migrates to IndexOverlay |
| ARC.3.2 | Remove scrolling from experiment pages (`overflow: hidden`) | 🔲 TODO | |
| ARC.3.3 | Verify GenerativeType fills 100vh inside ExperimentShell | 🔲 TODO | |
| ARC.3.4 | Build + responsive QA (320–2560px) | 🔲 TODO | |
| ARC.3.5 | Deploy to Vercel, verify production | 🔲 TODO | |

### ARC.4 — Theme Toggle (Carried from Phase 4)

| # | Item | Status | Notes |
|---|---|---|---|
| ARC.4.1 | Theme toggle: `DARK · LIGHT` in footer area or INDEX overlay | 🔲 TODO | `<head>` script already in place |
| ARC.4.2 | Verify light mode across all components | 🔲 TODO | |

---

## V2+ Backlog (Future)

| # | Item | Source | Notes |
|---|---|---|---|
| V2.1 | Generative background element | PRD V1 | Could be its own experiment |
| V2.2 | Sound layer — ambient, minimal, opt-in | PRD V1 | Future experiment |
| V2.3 | Mouse-responsive axis experiment | Prototype session | `prototypes/hero-effects.html` demo #1 |
| V2.4 | Gradient fill wordmark experiment | Prototype session | `prototypes/hero-effects.html` demo #2 |
| V2.5 | Outline → fill reveal experiment | Prototype session | `prototypes/hero-effects.html` demo #3 |
| V2.6 | Per-character proximity experiment | Prototype session | `prototypes/hero-generative-chars.html` demo C |
| V2.7 | Layered echo experiment | Prototype session | `prototypes/hero-generative-chars.html` demo B |
| V2.8 | Freeze frame experiment | Prototype session | `prototypes/hero-generative-chars.html` demo D |
| V2.9 | Logo specimen grid page | Prototype session | `prototypes/hero-with-logo.html` — logo at multiple sizes |
| B.1 | Mood system v2 — width-safe axes only (GRAD, slnt, YTUC) | Phase 2 | Could enhance any experiment |
| B.2 | Verify Vercel Framework Preset = "Next.js" | Phase 1 | |
| B.3 | Confirm contact email address | Phase 3 | `hello@juanemo.com` is placeholder |
| B.4 | Font preloading — `<link rel="preload">` | Phase 1 | |
| B.5 | Lighthouse audit: Performance 90+, Accessibility 95+ | Phase 5 | |

---

## Changelog

| Date | Change | By |
|---|---|---|
| 2026-03-17 | Initial backlog — Phases 1–5 from original sprint plan | Scrummaster |
| 2026-03-17 | Phases 1–3 complete. Hero V2, V3 complete. | Scrummaster |
| 2026-03-18 | Hero V2 + V3 complete. Generative per-character drift, scaleXY, mobile caps. | Scrummaster |
| 2026-03-19 | **V2.0 Architecture pivot.** Backlog restructured for experiment journal. Old phases archived. New ARC.1–ARC.4 work items. V2+ backlog populated with prototype experiment ideas. | Scrummaster (JC creative direction) |
