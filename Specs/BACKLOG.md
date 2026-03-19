# BACKLOG.md — Juanemo Living Backlog

## Last Updated
2026-03-19 — Phase A complete. Phase B (Navigation Layer) complete.

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

### Phase A — Architecture Pivot ✅

| # | Item | Status | Notes |
|---|---|---|---|
| A.1 | Create `data/experiments.ts` | ✅ DONE | slug, name, description, publishedDate. 1 entry. |
| A.2 | Create `ExperimentShell.tsx` | ✅ DONE | Server component, `100vw × 100vh`, `overflow: hidden` |
| A.3 | Refactor `Hero.tsx` → `GenerativeType.tsx` | ✅ DONE | `<div>` container (was `<header>`), fills parent 100%×100%. Class renamed `.container`. |
| A.4 | Create `/experiments/[slug]/page.tsx` dynamic route | ✅ DONE | Slug→component mapping, `generateStaticParams()` |
| A.5 | Update `page.tsx` — redirect to latest experiment | ✅ DONE | |
| A.6 | Clean up `layout.tsx` | ✅ DONE | Already clean — Hero/ProjectList/Footer were in page.tsx not layout |
| A.7 | Disable document scroll | ✅ DONE | `html, body { overflow: hidden; height: 100vh; }` |
| A.8 | Build + QA | ✅ DONE | Zero errors, static generation works |

### Phase B — Navigation Layer (LogoMark + IndexOverlay) ✅

| # | Item | Status | Notes |
|---|---|---|---|
| B.1 | Create `LogoMark.tsx` — static generative logo | ✅ DONE | Fixed top-left, per-character `randomAxes()` on mount, 22px, Dun |
| B.2 | Create `IndexOverlay.tsx` — full-screen experiment list | ✅ DONE | Dark overlay, typographic list, fade transition, focus trap |
| B.3 | Create INDEX trigger (top-right) | ✅ DONE | `<button>` with `aria-expanded`, `--color-text-faint` → Dun on hover |
| B.4 | Integrate into `layout.tsx` | ✅ DONE | `Navigation.tsx` client wrapper in layout, before `{children}` |
| B.5 | Navigation state management | ✅ DONE | `useState` in Navigation.tsx, toggle/close callbacks |
| B.6 | Build + QA (keyboard accessibility, responsive) | ✅ DONE | Escape, Tab, focus trap. Tested 320–1920px. Zero build errors. |

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
| B.6 | Clean up vestigial `main` max-width rule in globals.css | Phase A builder | No effect on experiment pages but could interfere with future non-experiment pages |
| B.7 | Remove `--hero-height: 50vh` CSS property from globals.css | Phase A builder | No longer used by any component |

---

## Changelog

| Date | Change | By |
|---|---|---|
| 2026-03-17 | Initial backlog — Phases 1–5 from original sprint plan | Scrummaster |
| 2026-03-17 | Phases 1–3 complete. Hero V2, V3 complete. | Scrummaster |
| 2026-03-18 | Hero V2 + V3 complete. Generative per-character drift, scaleXY, mobile caps. | Scrummaster |
| 2026-03-19 | **V2.0 Architecture pivot.** Backlog restructured for experiment journal. Old phases archived. New ARC.1–ARC.4 work items. V2+ backlog populated with prototype experiment ideas. | Scrummaster (JC creative direction) |
| 2026-03-19 | Phase A complete. Clean refactor — no deviations. GenerativeType uses `<div>` (was `<header>`), class renamed `.container`. Old components preserved. Vestigial `main` max-width rule and `--hero-height` CSS property noted for cleanup. | Scrummaster (from Phase A builder notes) |
| 2026-03-19 | Phase B complete. LogoMark, IndexOverlay, Navigation wrapper, INDEX trigger all live. Keyboard accessible, responsive. Minor deviations: DM Sans for overlay names (not Roboto Flex), date below name. Backlog items added: overlay close button for mobile, placeholder experiments, LogoMark `<a>` → `<Link>` upgrade. | Phase B builder |
