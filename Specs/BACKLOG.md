# BACKLOG.md — Juanemo Living Backlog

## Last Updated
2026-03-19 — **Phase H spec written.** Mobile interaction for sections B, C, D. Gyroscope for proximity/axes, touch-sweep for hover. Platform-aware instructions.

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
| B.9 | ~~Add placeholder experiments to test overlay density/scroll~~ | ⏸ SUPERSEDED | IndexOverlay deleted in Phase F. Drawer nav handles single experiment fine. |
| B.10 | Consider upgrading LogoMark `<a href="/">` → `<Link>` | Phase B builder | Full reload re-randomizes logo (nice touch), but `<Link>` would be smoother. Trade-off. |
| B.11 | Focus return to grid icon on drawer close | Phase F builder | Needs ref to grid icon passed through NavigationContext or `returnFocusRef` pattern. A11y compliance. |
| B.12 | Drag-to-dismiss on mobile bottom sheets | Phase F builder | Drag handle pill is visual-only. Needs `touchstart`/`touchmove`/`touchend` handling. Polish pass. |
| B.13 | Wire up carousel slide links | Phase F builder | `SpecialProject.url` field exists but clicks are no-ops. Wire to `window.open()` or `router.push()`. |
| B.14 | Delete ExperimentShell.tsx + CSS module | Phase D builder | Still on disk, never imported. Safe to remove. Noted since Phase D, still not cleaned up. |
| B.15 | Multi-experiment testing for drawer nav | Phase F builder | Only 1 experiment in data. Verify month grouping, active highlighting, and navigation when more are added. |
| B.16 | LogoMark — increase size ~10% and add letter-spacing | JC feedback | Feels tight at current size. Bump from 22px to ~24px, add slight tracking. Quick polish pass. |
| B.17 | DrawerNav mobile trigger overlaps pagination tile A at 320–375px | Phase G builder | "N" button bottom-left conflicts with bottom bar tiles. Move trigger to top bar grid icon on mobile, or adjust position. Not a Phase G regression — Phase F positioning issue. |
| B.18 | Keyboard navigation for pagination tiles (arrow keys) | Phase D/E + G builder | Arrow keys to cycle sections not implemented. A11y enhancement. |
| B.19 | Generalize `replayKey` pattern for frame-triggered section actions | Phase G builder | Currently only used for Section E Replay. If future sections need frame-triggered actions, abstract the pattern. |
| B.20 | ~~Show hint text on mobile — wrap to second line~~ | ⏸ ABSORBED → Phase H (H.7) | Rolled into Phase H — mobile hint visibility is part of the platform-aware instructions work. |

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
| NAV.1 | ~~Replace INDEX text with icon~~ | ✅ Phase D/E | Grid icon (2×2 squares) already in ExperimentFrame top bar |
| NAV.2 | ~~Zoom-out navigation transition~~ | ⏸ SUPERSEDED | Zoom interaction rejected during prototyping — felt buggy. Replaced by drawer nav (Phase F). |
| NAV.3 | Navigation in light mode (Bone background) | ✅ Phase F | Drawer uses Bone background, creating the Gunmetal→Bone perceptual shift. |
| NAV.4 | ~~Navigation as experiment tile grid~~ | ⏸ SUPERSEDED | Replaced by chronological list with thumbnails in drawer (Phase F). Better for growing experiment count. |

### Phase H — Mobile Interaction: Gyroscope + Touch 🔵

| # | Item | Status | Notes |
|---|---|---|---|
| H.1 | `useDeviceOrientation` hook — gyro API with iOS permission, smoothing, normalization | 🔲 TODO | Reusable hook in `lib/useDeviceOrientation.ts`. Returns beta/gamma normalized 0–1. |
| H.2 | Permission UI — "Enable Motion" inline hint action | 🔲 TODO | Uses existing `hintAction` pattern. Appears on B+C mobile before gyro granted. |
| H.3 | Section B mobile — gyro proximity | 🔲 TODO | Tilt maps to virtual cursor position, feeds existing proximity calc. Touch fallback. |
| H.4 | Section C mobile — gyro axis mapping | 🔲 TODO | Gamma→wdth, beta→wght. Same mapping as mouse but from tilt. Touch fallback. |
| H.5 | Section D mobile — touch sweep | 🔲 TODO | `touchmove` triggers collapse+lift on characters near touch point. Wave effect. |
| H.6 | Mobile detection helper — `getInteractionMode()` | 🔲 TODO | Returns `'mouse' \| 'touch' \| 'gyro'` based on viewport + device caps + permission. |
| H.7 | Platform-aware hint text + instructions | 🔲 TODO | `hintMobile`, `instructionsMobile` fields in SectionConfig. Tilt/drag copy on mobile. |
| H.8 | Gyro fallback after permission denied | 🔲 TODO | Seamless fallback to touch-drag. No broken state. |
| H.9 | Build + QA | 🔲 TODO | Desktop unchanged, iOS Safari gyro, Android Chrome, touch fallback, no jitter. |

### Phase G — Settings Panel & Frame Redesign ✅

| # | Item | Status | Notes |
|---|---|---|---|
| G.1 | Restructure grid from 7-row to 6-row | ✅ DONE | `auto 1px 1fr 0px 1px auto` — old bottom meta bar removed |
| G.2 | Floating meta labels inside viewport | ✅ DONE | Absolute-positioned, 60px from keylines (32px mobile), centered |
| G.3 | Bottom bar — pagination tiles + gear only | ✅ DONE | 40×40px tiles, 1px bordered, no inline controls |
| G.4 | Expanding settings panel (grid-row animation) | ✅ DONE | Row 4 grows from 0px → 260px (320px mobile), expo-out easing |
| G.5 | Panel left column — about + instructions | ✅ DONE | Section label, description, icon+text instruction items |
| G.6 | Panel right column — per-section controls | ✅ DONE | Only controls the section declares; "no controls" fallback |
| G.7 | Per-section data model (SectionConfig) | ✅ DONE | `sectionConfigs` array in `data/experiments.ts`, top-level export |
| G.8 | Remove old mobile controls drawer (BottomSheet) | ✅ DONE | BottomSheet.tsx + CSS deleted. Expanding panel is universal. |
| G.9 | Open/close behavior + escape key | ✅ DONE | Gear toggles, Escape closes, section switch keeps panel open |
| G.9a | Preserve section transition loader | ✅ DONE | Spinning arrow works in new 6-row grid, centers in shorter viewport when panel open |
| G.10 | Mobile responsive (≤600px) | ✅ DONE | Panel stacks vertically, hints hidden, 32px label offset |
| G.11 | Build + QA | ✅ DONE | Zero errors, no deviations from prototype |

### Phase F — Drawer Navigation ✅

| # | Item | Status | Notes |
|---|---|---|---|
| F.1 | Remove IndexOverlay, rewire NavigationContext | ✅ DONE | IndexOverlay deleted. Context exposes `openDrawer()`/`closeDrawer()`/`isDrawerOpen`. Uses `usePathname` for active slug. |
| F.2 | DrawerNav component — slide-in drawer with scrim | ✅ DONE | Fixed right-side on desktop, bottom sheet via CSS media query on mobile. Scrim z-60, drawer z-70. |
| F.3 | Experiment list grouped by month with thumbnails | ✅ DONE | 56×36 thumbnails with client-side randomized wordmarks (hydration-safe via useEffect). |
| F.4 | Special Projects carousel at drawer bottom | ✅ DONE | Auto-rotates 4s, refs for DOM manipulation (no re-renders per tick), dot navigation restarts timer. |
| F.5 | Mobile bottom-sheet pattern | ✅ DONE | Shared `<BottomSheet>` component created for controls drawer. Nav drawer handles its own bottom-sheet via CSS media query (too complex for generic wrapper). |
| F.6 | Keyboard & accessibility — focus trap, reduced motion | ✅ DONE | `role="dialog"`, `aria-modal`, Escape to close. Focus return to trigger NOT yet implemented. |
| F.7 | Build + QA | ✅ DONE | Zero build errors, zero hydration errors, deployed to main. |

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
| 2026-03-19 | **Phase F complete and deployed.** DrawerNav replaces IndexOverlay. Shared `<BottomSheet>` component for mobile controls drawer. Nav drawer uses inline CSS media query for its own bottom-sheet (too complex for generic wrapper). Carousel uses refs for DOM updates (no re-renders). Hydration-safe thumbnails via client-side useEffect. Deviations: focus return not implemented, drag-to-dismiss visual-only. New backlog items: B.11–B.15. | Scrummaster (from Phase F builder notes) |
| 2026-03-19 | **Phase F spec written.** Drawer navigation replaces IndexOverlay. NAV.2/NAV.4 superseded (zoom-out rejected). Mobile bottom-sheet pattern standardized — both nav drawer and controls drawer slide up from bottom on ≤600px. Phase F items added. | Scrummaster (JC creative direction) |
| 2026-03-19 | **Phase H spec written.** Mobile interaction: gyroscope for sections B+C (proximity+axes), touch-sweep for section D (hover). `useDeviceOrientation` hook with iOS permission flow, smoothing, normalization. Platform-aware hint text + instructions. Touch fallback if gyro denied. | Scrummaster (JC creative direction) |
| 2026-03-19 | **Phase G complete and deployed.** 6-row grid, expanding settings panel, floating meta labels, per-section controls/instructions, 40×40px pagination+gear strip. BottomSheet deleted. `replayKey` added to ExperimentControlsContext for Section E Replay. `sectionConfigs` array in `data/experiments.ts`. No significant deviations from spec/prototype. Known issue: DrawerNav mobile trigger overlaps tile A at narrow viewports (Phase F issue, not G regression). New backlog: B.17–B.19. | Scrummaster (from Phase G builder notes) |
| 2026-03-19 | **Phase G spec written.** Settings panel redesign: 6-row grid with expanding panel, floating meta labels, per-section controls/instructions, inline hint actions, 40×40px pagination+gear strip. Old mobile controls drawer to be removed. Section transition loader explicitly preserved. Prototype: `prototypes/settings-panel-v3.html`. | Scrummaster (JC creative direction) |
| 2026-03-19 | **Phase D/E complete and deployed.** ExperimentFrame with 7-row grid, pagination tiles (A–F), 3-phase section loader (fade+spinner+fade), 6 type variations, interactive controls (Speed/Easing/Shuffle), mobile drawer behind gear icon, bottom meta bar mirroring top. 12 prototype effects pruned to 6 per JC direction. Scroll replaced with pagination. Mobile: centered layout, 16vw type, 28px tiles. EXP.1–5 all resolved. V2.3 and V2.6 implemented as sections within Exp 01. | Builder (from Phase E session) |
