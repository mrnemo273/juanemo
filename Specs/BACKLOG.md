# BACKLOG.md — Juanemo Living Backlog

## Last Updated
2026-03-19 — **Phase E complete and deployed.** Experiment frame with pagination, loader, mobile drawer all live.

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

### Phase D/E — Experiment Frame & Pagination ✅

| # | Item | Status | Notes |
|---|---|---|---|
| E.1 | ExperimentFrame component — grid layout with keylines, meta bars | ✅ DONE | 7-row CSS Grid, top/bottom keylines, top/bottom meta bars |
| E.2 | Pagination tiles (A–F) — replace scrolling | ✅ DONE | Only active section mounted; tiles 20px desktop, 28px mobile |
| E.3 | Section loader — fade + spinning arrow transition | ✅ DONE | 100ms fade-out → 350ms loader → 100ms fade-in |
| E.4 | 6 type variations (pruned from 12) | ✅ DONE | Drift, Proximity, Mouse Axes, Hover, Expand, Breathing |
| E.5 | Interactive controls — Speed, Easing, Shuffle | ✅ DONE | Context-driven, affects all sections via controlsRef pattern |
| E.6 | Mobile drawer for controls | ✅ DONE | Gear icon → slide-up drawer, backdrop dismiss |
| E.7 | Bottom meta bar — mirrors top placement | ✅ DONE | Section letter + name, 33px padding from keyline |
| E.8 | Mobile responsive — centered elements, larger type | ✅ DONE | 16vw type, 8px padding, centered meta/pagination |
| E.9 | Data model — sections array | ✅ DONE | `sections?: string[]` on Experiment interface |
| E.10 | Build + deploy | ✅ DONE | Zero errors, pushed to main |

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
| V2.3 | ~~Mouse-responsive axis experiment~~ | ✅ Phase E | Section C of Experiment 01 |
| V2.4 | Gradient fill wordmark experiment | Prototype session | Pruned from Exp 01, could be standalone |
| V2.5 | Outline → fill reveal experiment | Prototype session | Pruned from Exp 01, could be standalone |
| V2.6 | ~~Per-character proximity experiment~~ | ✅ Phase E | Section B of Experiment 01 |
| V2.7 | Layered echo experiment | Prototype session | Pruned from Exp 01, could be standalone |
| V2.8 | Freeze frame experiment | Prototype session | Pruned from Exp 01, could be standalone |
| V2.9 | Logo specimen grid page | Prototype session | `prototypes/hero-with-logo.html` — logo at multiple sizes |
| B.1 | Mood system v2 — width-safe axes only (GRAD, slnt, YTUC) | Phase 2 | Could enhance any experiment |
| B.2 | Verify Vercel Framework Preset = "Next.js" | Phase 1 | |
| B.3 | Confirm contact email address | Phase 3 | `hello@juanemo.com` is placeholder |
| B.4 | ~~Font preloading~~ | ✅ Phase C | Self-hosted in `public/fonts/`, preloaded in `<head>`, `font-display: block` |
| B.5 | Lighthouse audit: Performance 90+, Accessibility 95+ | Phase 5 | |
| B.6 | ~~Clean up vestigial `main` max-width rule~~ | ✅ Phase C | Removed |
| B.7 | ~~Remove `--hero-height` and `--max-width` CSS properties~~ | ✅ Phase C | Removed |
| B.8 | ~~Add close button to IndexOverlay for mobile~~ | ✅ Phase C | CLOSE button top-right, matches INDEX trigger style |
| B.9 | Add placeholder experiments to test overlay density/scroll | Phase B builder | Only 1 experiment currently — overlay is sparse |
| B.10 | Consider upgrading LogoMark `<a href="/">` → `<Link>` | Phase B builder | Full reload re-randomizes logo (nice touch), but `<Link>` would be smoother. Trade-off. |

---

## V3.0 — Experiment Frame & Navigation Redesign (JC Feedback)

### EXP — Experiment Frame (Points 1, 2, 6)

| # | Item | Status | Notes |
|---|---|---|---|
| EXP.1 | ~~Experiment metadata layer~~ | ✅ Phase E | Top meta bar (01 + title), bottom meta bar (section letter + name) |
| EXP.2 | ~~Keylines above and below~~ | ✅ Phase E | Two 1px keylines in the grid layout |
| EXP.3 | ~~Scrollable experiment container~~ | ✅ Phase E | Replaced with pagination tiles (JC direction — no scrolling) |
| EXP.4 | ~~Interactive controls~~ | ✅ Phase E | Speed, Easing, Shuffle — mobile drawer pattern |
| EXP.5 | ~~Small type, Bittersweet pops, metadata~~ | ✅ Phase E | DM Sans 9–11px, Bittersweet for active states + exp number, Dun at 25–50% opacity |

### NAV — Navigation Redesign (Points 3, 4, 5)

| # | Item | Status | Notes |
|---|---|---|---|
| NAV.1 | Replace INDEX text with icon — grid/zoom-out icon (4 rectangles or similar) | 🔲 TODO | Not a hamburger. Implies "see all" or "zoom out to collection." Consider generative icon. |
| NAV.2 | Zoom-out navigation transition (Work&Co style) | 🔲 TODO | Reference: https://work.co/grid — current experiment shrinks down, all experiments visible as tiles. Click to zoom into one. |
| NAV.3 | Navigation in light mode (Bone background) | 🔲 TODO | Experiments are dark (Gunmetal). Zooming out to nav flips to light. Creates perceptual shift — you're leaving the experiment space. |
| NAV.4 | Navigation as a grid of experiment tiles (not a text list) | 🔲 TODO | Replaces the current text overlay. Each tile could show a live or frozen preview of the experiment. |

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
| 2026-03-19 | Phase C complete. Self-hosted fonts with preloading. `font-display: block` (Roboto Flex) / `swap` (DM Sans). WCAG AA verified (Dun/Gunmetal 9.11:1, INDEX trigger bumped to 60%). `dvh` units for iOS Safari. Close button added to overlay. Focus trap, focus-visible, tabIndex gating. Vestigial CSS cleaned up (B.6, B.7, B.8 resolved). README updated. Deployment pending push to main. | Scrummaster (from Phase C builder notes) |
| 2026-03-19 | **Phase D/E complete and deployed.** ExperimentFrame with 7-row grid, pagination tiles (A–F), 3-phase section loader (fade+spinner+fade), 6 type variations, interactive controls (Speed/Easing/Shuffle), mobile drawer behind gear icon, bottom meta bar mirroring top. 12 prototype effects pruned to 6 per JC direction. Scroll replaced with pagination. Mobile: centered layout, 16vw type, 28px tiles. EXP.1–5 all resolved. V2.3 and V2.6 implemented as sections within Exp 01. | Builder (from Phase E session) |
