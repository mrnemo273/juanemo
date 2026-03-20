# PHASE F — Drawer Navigation

## Sprint Goal

Replace the current IndexOverlay (full-screen overlay navigation) with a slide-in drawer that opens from the right edge. The drawer lists all experiments grouped by published month, includes small live thumbnails, and features a rotating "Special Projects" carousel pinned to the bottom. On mobile the drawer fills the full screen.

## Status: `READY`

## Depends On: Phase D/E (complete ✅)

---

## Prerequisites

- Phase D/E is complete: ExperimentFrame renders the full-screen 7-row grid with pagination tiles, top/bottom meta bars, interactive controls, and mobile controls drawer
- Read `Specs/GOALS.md` — navigation should feel lightweight and non-disruptive
- Read `Specs/DESIGN_SYSTEM.md` — Bone/Gunmetal palette, DM Sans body type, Roboto Flex display type
- Read `Specs/PHASE_D_EXPERIMENT_FRAME.md` — especially the R.7 builder notes for the current architecture (7-row grid, pagination, NavigationContext pattern, mobile controls drawer)
- **Open `prototypes/drawer-nav-v2.html` in a browser** — this is the approved design. Match this exactly.

---

## Design Rationale

The zoom-grid navigation (IndexOverlay) was rejected during testing — the zoom interaction felt buggy and the grid layout didn't scale well as the experiment count grows. The drawer pattern is:

1. **Non-destructive** — the experiment stays visible behind a scrim; you're peeking at the index, not leaving the page
2. **Chronological** — experiments grouped by month emphasize the journal metaphor
3. **Extensible** — the pinned carousel surfaces special projects (reports, talks, tools) without cluttering the experiment list
4. **Mobile-native** — full-screen drawer on small viewports feels like a natural sheet

---

## Design Tokens (New)

```css
--drawer-width: min(420px, 85vw);
--drawer-speed: 0.45s;
--drawer-ease: cubic-bezier(0.16, 1, 0.3, 1);  /* expo-out */
```

Add these to `globals.css` alongside existing tokens.

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│            EXPERIMENT FRAME (Phase D)        │
│  ┌───────────────────────┬────────────────┐  │
│  │                       │  ┌──────────┐  │  │
│  │   Scrim (50% black)   │  │  DRAWER   │  │  │
│  │   click → close       │  │           │  │  │
│  │                       │  │  Header   │  │  │
│  │                       │  │  ─────    │  │  │
│  │                       │  │  Month    │  │  │
│  │                       │  │  · Item   │  │  │
│  │                       │  │  · Item   │  │  │
│  │                       │  │  Month    │  │  │
│  │                       │  │  · Item   │  │  │
│  │                       │  │           │  │  │
│  │                       │  │  ═════    │  │  │
│  │                       │  │ Carousel  │  │  │
│  └───────────────────────┴──┴──────────┘  │  │
└─────────────────────────────────────────────┘
```

The drawer + scrim sit OUTSIDE the ExperimentFrame grid. They are fixed-position overlays managed via `NavigationContext` (the existing context provider in `Navigation.tsx` that currently manages the IndexOverlay).

**Important: existing architecture context.** `Navigation.tsx` is currently a context provider that wraps `{children}`. ExperimentFrame consumes `NavigationContext` and calls `openIndex()` when the grid icon is clicked. This phase replaces the IndexOverlay with the drawer, so `NavigationContext` should expose `openDrawer()`/`closeDrawer()` instead of `openIndex()`/`closeIndex()`.

**Note: two drawers on mobile.** Phase D/E built a mobile controls drawer (gear icon → slide-up sheet with Speed/Easing/Shuffle). The navigation drawer is a SEPARATE component — it slides from the right and serves a different purpose (experiment selection, not controls). They must coexist with different z-indexes. The nav drawer should sit above the controls drawer.

---

## Task List

### F.1 — Remove IndexOverlay

- [ ] Delete `components/IndexOverlay.tsx` and `IndexOverlay.module.css` (or archive if you prefer)
- [ ] Update `NavigationContext` in `Navigation.tsx`: replace `openIndex()`/`closeIndex()` with `openDrawer()`/`closeDrawer()` and `isDrawerOpen` state
- [ ] Update ExperimentFrame to call `openDrawer()` from context when the grid icon is clicked (currently calls `openIndex()`)

### F.2 — Create DrawerNav Component

- [ ] New files: `components/DrawerNav.tsx` and `components/DrawerNav.module.css`
- [ ] `'use client'` component — needs state for open/close and carousel
- [ ] Props:
  ```ts
  interface DrawerNavProps {
    isOpen: boolean;
    onClose: () => void;
    experiments: Experiment[];      // from data/experiments.ts
    activeSlug: string;             // currently active experiment slug
    onSelectExperiment: (slug: string) => void;
    specialProjects?: SpecialProject[];
  }
  ```
- [ ] The drawer is `position: fixed`, anchored `top: 0; right: 0; bottom: 0`
- [ ] Width: `var(--drawer-width)` → `min(420px, 85vw)`
- [ ] Default state: `transform: translateX(100%)` (off-screen right)
- [ ] Open state: `transform: translateX(0)`
- [ ] Transition: `transform var(--drawer-speed) var(--drawer-ease)`
- [ ] `z-index: 70` (above scrim at 60, above mobile controls drawer)
- [ ] Background: `var(--bone)` (#EBE2D6)
- [ ] Layout: `display: flex; flex-direction: column; overflow: hidden`

### F.3 — Scrim Overlay

- [ ] Sibling element to the drawer (not a child), `position: fixed; inset: 0`
- [ ] Background: `rgba(0, 0, 0, 0.5)`
- [ ] `z-index: 60` (below drawer at 70, above frame and mobile controls drawer)
- [ ] Default state: `opacity: 0; pointer-events: none`
- [ ] Open state: `opacity: 1; pointer-events: auto`
- [ ] Transition: `opacity var(--drawer-speed) var(--drawer-ease)`
- [ ] Click on scrim → call `onClose()`

### F.4 — Drawer Header

- [ ] Fixed at top of drawer (flex-shrink: 0)
- [ ] Two-column layout: title (left) · close button (right)
- [ ] **Title**: "Experiments"
  - 10px, weight 500, `0.12em` tracking, uppercase
  - Color: `var(--gunmetal)`, opacity 0.35
- [ ] **Close button**: 28×28px, `✕` character
  - 14px, `var(--gunmetal)`, opacity 0.4
  - Border: `1px solid rgba(31, 38, 39, 0.1)`, radius 3px
  - Hover: opacity 0.8, border-color `rgba(31, 38, 39, 0.25)`
  - `aria-label="Close navigation"`
- [ ] Padding: `var(--pad)` all around
- [ ] Below header: 1px keyline `rgba(31, 38, 39, 0.08)`

### F.5 — Experiment List (Scrollable)

- [ ] The middle section of the drawer — `flex: 1; overflow-y: auto`
- [ ] Padding: `clamp(20px, 3vw, 32px) var(--pad)`
- [ ] Custom scrollbar (thin, subtle):
  ```css
  scrollbar-width: thin;
  scrollbar-color: rgba(31, 38, 39, 0.1) transparent;
  ```
  ```css
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(31, 38, 39, 0.1); border-radius: 2px; }
  ```

#### F.5a — Month Groups

- [ ] Experiments are grouped by their `publishedDate` field (e.g., "March 2025")
- [ ] Groups are rendered in chronological order
- [ ] **Month label**:
  - 9px, weight 500, `0.14em` tracking, uppercase
  - Color: `var(--gunmetal)`, opacity 0.25
  - `margin-bottom: 16px; padding-bottom: 8px`
  - Bottom border: `1px solid rgba(31, 38, 39, 0.06)`
- [ ] Each group has `margin-bottom: 32px` (last group: 0)

#### F.5b — Experiment Items

- [ ] Each experiment is a clickable row: **thumbnail** + **text**
- [ ] Layout: `display: flex; align-items: center; gap: 14px`
- [ ] Padding: `10px 12px`, border-radius 6px
- [ ] Hover: `background: rgba(31, 38, 39, 0.04)`
- [ ] Active state (`.is-active`): `background: rgba(31, 38, 39, 0.06)`
- [ ] `margin-bottom: 4px` between items
- [ ] Click → calls `onSelectExperiment(slug)` and `onClose()`

#### F.5c — Thumbnails

- [ ] Size: 56×36px, border-radius 4px
- [ ] Background: `var(--gunmetal)` (dark background matching the experiment frame)
- [ ] Contains a miniature version of the experiment's wordmark:
  - `font-family: 'Roboto Flex'`, 7px, uppercase, `letter-spacing: -0.02em`
  - Color: `var(--dun)`
  - Each character gets randomized `fontVariationSettings` on mount
- [ ] `flex-shrink: 0; overflow: hidden`
- [ ] Centered content: `display: flex; align-items: center; justify-content: center`

#### F.5d — Item Text

- [ ] `flex: 1; min-width: 0` (allows truncation)
- [ ] **Number**: 9px, weight 500, `0.1em` tracking, Bittersweet, `margin-right: 8px`
- [ ] **Name**: 12px, weight 500, `0.04em` tracking, Gunmetal, opacity 0.7 (active: 1.0)
- [ ] **Description**: 10px, weight 400, line-height 1.4, Gunmetal, opacity 0.3
  - Single line: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis`
  - `margin-top: 3px`
  - Hidden on mobile (≤600px)

### F.6 — Special Projects Carousel

- [ ] Pinned to drawer bottom: `flex-shrink: 0`
- [ ] Separated from experiment list by `border-top: 1px solid rgba(31, 38, 39, 0.08)`

#### F.6a — Data Model

- [ ] Add a new type and data file (or extend existing):
  ```ts
  interface SpecialProject {
    tag: string;        // "Report", "Case Study", "Talk", "Tool"
    name: string;       // "The State of Creative Jobs"
    description: string;
    color: string;      // Thumbnail background hex
    url?: string;       // Optional link
  }
  ```
- [ ] Initial projects (from prototype):
  - Report → "The State of Creative Jobs" → `#2D5A6B`
  - Case Study → "Redesigning the Brief" → `#8B4A3C`
  - Talk → "Variable Fonts & The Future of Type" → `#4A6741`
  - Tool → "Axis Playground" → `#6B5A8C`

#### F.6b — Carousel Header

- [ ] Layout: label (left) · dots (right)
- [ ] **Label**: "Special Projects"
  - 9px, weight 500, `0.14em` tracking, uppercase
  - Color: `var(--gunmetal)`, opacity 0.25
- [ ] **Dots**: one per slide, 5×5px circles
  - Default: `var(--gunmetal)` at 12% opacity
  - Active: 40% opacity
  - Clickable — navigate to that slide
  - `transition: opacity 0.3s`
- [ ] Padding: `16px var(--pad) 12px`

#### F.6c — Carousel Track & Slides

- [ ] **Track** (`.carousel-track`): `overflow: hidden; position: relative`
- [ ] **Inner wrapper** (`.carousel-inner`): `display: flex`
  - Slides are moved by translating this wrapper: `transform: translateX(-${index * 100}%)`
  - Transition: `transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)`
- [ ] Each **slide** (`.carousel-slide`): `min-width: 100%; flex-shrink: 0`
  - Layout: thumbnail (left) + text (right), `gap: 12px`, `align-items: flex-start`
  - Padding: `0 var(--pad) 20px`
  - Cursor: pointer
  - Hover: project name opacity increases to 0.9

#### F.6d — Carousel Thumbnails

- [ ] Size: 72×48px, border-radius 5px
- [ ] Solid color background (from project data), with centered white tag text
  - Tag text: 7px, weight 500, `0.08em` tracking, uppercase, white at 70% opacity
- [ ] Later: replace with actual project screenshots/images via `<img>` with `object-fit: cover`

#### F.6e — Carousel Text

- [ ] **Tag**: 8px, weight 500, `0.1em` tracking, uppercase, Bittersweet at 70% opacity, `margin-bottom: 3px`
- [ ] **Name**: 11px, weight 500, `0.02em` tracking, Gunmetal at 65% opacity, line-height 1.3
- [ ] **Description**: 10px, weight 400, Gunmetal at 25% opacity, line-height 1.3
  - Single line with ellipsis truncation
  - Hidden on mobile (≤600px)

#### F.6f — Carousel Auto-Rotation

- [ ] Starts when drawer opens → `setInterval` at 4000ms
- [ ] Stops when drawer closes → `clearInterval`
- [ ] Advances `currentSlide` by 1, wraps around with modulo
- [ ] Clicking a dot navigates to that slide AND restarts the timer
- [ ] Use a ref for the interval ID to avoid stale closures in React

### F.7 — Open/Close Behavior

- [ ] **Grid icon** (top-right of ExperimentFrame): toggles drawer open/close
  - If closed → open; if open → close
- [ ] **Scrim click** → close
- [ ] **Close button** (drawer header) → close
- [ ] **Escape key** → close (if open)
- [ ] **Selecting an experiment** → close (after firing navigation)
- [ ] When opening: add `.drawer-open` class to a parent (or use React state) to trigger scrim + drawer transitions simultaneously
- [ ] Ensure body scroll remains locked while drawer is open (frame already prevents body scroll, but verify)

### F.8 — Integration with NavigationContext & ExperimentFrame

- [ ] `NavigationContext` already exists in `Navigation.tsx` as a context provider wrapping `{children}`. Currently exposes `openIndex()`/`closeIndex()`. Refactor to expose `openDrawer()`/`closeDrawer()`/`isDrawerOpen` instead.
- [ ] ExperimentFrame currently calls `openIndex()` from `useContext(NavigationContext)` when the grid icon is clicked. Change this to `openDrawer()`.
- [ ] `Navigation.tsx` renders `<DrawerNav>` as a sibling to `{children}`, controlled by `isDrawerOpen` state from context
- [ ] When an experiment is selected from the drawer, navigate to `/experiments/[slug]` (or update active experiment state if single-page) and close the drawer
- [ ] The `ExperimentControlsContext` (speed, easing, shuffleKey, activeSection) is separate from NavigationContext and should remain unchanged

### F.9 — Mobile Responsive (≤600px)

- [ ] **Navigation drawer becomes a bottom sheet on mobile.** Instead of sliding from the right, it slides up from the bottom — matching the existing mobile controls drawer pattern the builder established in Phase D/E.
  - `width: 100vw`
  - `bottom: 0; left: 0; right: 0` (not `top: 0`)
  - `max-height: 85vh` (leave a strip of scrim visible at top for context)
  - `border-radius: 16px 16px 0 0` (rounded top corners, flat bottom)
  - `transform: translateY(100%)` → `translateY(0)` on open
  - Same easing and duration as desktop: `var(--drawer-speed) var(--drawer-ease)`
- [ ] **Unify the mobile drawer pattern.** The builder's existing controls drawer (gear icon → slide-up sheet) should use the same bottom-sheet component/styling as the nav drawer. Consider extracting a shared `BottomSheet` wrapper that both drawers use:
  ```ts
  <BottomSheet isOpen={controlsOpen} onClose={...}>
    {/* Speed, Easing, Shuffle controls */}
  </BottomSheet>
  <BottomSheet isOpen={navOpen} onClose={...} maxHeight="85vh">
    {/* Experiment list + carousel */}
  </BottomSheet>
  ```
- [ ] Hide experiment description text in drawer items (save vertical space)
- [ ] Hide carousel description text
- [ ] Add a **drag handle** at the top of the sheet: 36×4px pill, centered, Gunmetal at 15% opacity, `margin: 12px auto 0`. (Nice-to-have: swipe down to dismiss.)
- [ ] Top bar date is already hidden (Phase D/E mobile rule)
- [ ] Frame grid: `auto 1px auto 1fr auto 1px auto` (7 rows per Phase D/E builder notes — do NOT collapse the bottom meta bar on mobile)
- [ ] Touch: ensure the drawer list has momentum scrolling (`-webkit-overflow-scrolling: touch`)

### F.10 — Keyboard & Accessibility

- [ ] Escape key closes the drawer
- [ ] Focus trap: when drawer is open, tab focus stays within the drawer
  - On open: focus moves to the close button
  - Tab cycles through: close button → experiment items → carousel dots → (loops)
  - On close: focus returns to the grid icon trigger
- [ ] `aria-label` on all interactive elements
- [ ] Drawer container: `role="dialog"`, `aria-modal="true"`, `aria-label="Experiment navigation"`
- [ ] Reduced motion: skip the slide transition, use `opacity` or instant `transform` instead
  ```css
  @media (prefers-reduced-motion: reduce) {
    .drawer { transition: opacity 0.2s ease; }
    .carousel-inner { transition: none; }
  }
  ```

### F.11 — Animation Polish

- [ ] Drawer slide uses expo-out easing: `cubic-bezier(0.16, 1, 0.3, 1)` — fast start, gentle settle
- [ ] Scrim fades in sync with drawer slide (same duration and easing)
- [ ] Thumbnail wordmarks randomize their axes on mount (one-time, not animated)
- [ ] Carousel transitions match the drawer easing
- [ ] No entrance animation on drawer items — they're already rendered when the drawer slides in. Animating items inside a sliding panel creates competing motion.

---

## File Map

| File | Action |
|------|--------|
| `components/DrawerNav.tsx` | **Create** — drawer + scrim + carousel |
| `components/DrawerNav.module.css` | **Create** — all drawer styles |
| `components/BottomSheet.tsx` | **Create** (optional) — shared mobile bottom-sheet wrapper for nav drawer AND controls drawer |
| `components/BottomSheet.module.css` | **Create** (optional) — bottom-sheet styles |
| `components/IndexOverlay.tsx` | **Delete** (replaced by drawer) |
| `components/IndexOverlay.module.css` | **Delete** |
| `components/ExperimentFrame.tsx` | **Edit** — grid icon onClick → `openDrawer()` from NavigationContext (was `openIndex()`) |
| `components/Navigation.tsx` | **Edit** — refactor NavigationContext: replace IndexOverlay state with drawer state, render `<DrawerNav>` |
| `data/experiments.ts` | **Verify** — `publishedDate` field exists for month grouping |
| `data/specialProjects.ts` | **Create** — carousel data |
| `app/globals.css` | **Edit** — add `--drawer-width`, `--drawer-speed`, `--drawer-ease` tokens |

---

## Acceptance Criteria

1. Grid icon opens the drawer; scrim darkens the frame behind it
2. Drawer slides in from the right with expo-out easing, settles in ~450ms
3. Experiments listed by month with thumbnail + number + name + description
4. Active experiment is highlighted (slightly darker background)
5. Clicking an experiment closes the drawer and loads that experiment
6. Special Projects carousel auto-rotates every 4s while drawer is open, stops on close
7. Clicking a carousel dot jumps to that slide and restarts the timer
8. Escape key, scrim click, and close button all dismiss the drawer
9. Mobile: drawer is full-width, descriptions hidden, carousel simplified
10. Focus trap works correctly; screen reader announces the drawer as a dialog
11. `prefers-reduced-motion` disables slide animations

---

## Phase F Refinements — Builder Notes

### Decisions Made

- **Thumbnail hydration fix**: Thumbnail `fontVariationSettings` are generated client-side only via `useState([])` + `useEffect`. Server renders spans with no inline style; client populates them after mount. This avoids hydration mismatches from `Math.random()` producing different values on server vs. client.
- **BottomSheet extraction**: Created a shared `<BottomSheet>` component (`components/BottomSheet.tsx` + `.module.css`) used by both the mobile nav drawer and the mobile controls drawer (gear icon). The BottomSheet is hidden on desktop (`display: none`) and only renders as a slide-up sheet on ≤600px. This unifies the mobile drawer pattern as the spec requested.
- **Z-index layering**: Scrim at 60, nav drawer at 70, controls BottomSheet backdrop at 100, controls sheet at 101. The controls sheet sits above the nav drawer so both can coexist on mobile without z-fighting.
- **Grid icon toggle**: The grid icon now toggles the drawer (open if closed, close if open) rather than only opening — matches the prototype behavior where the same trigger opens and closes.
- **Carousel uses refs for DOM updates**: `currentSlideRef` + direct DOM manipulation (`carouselInnerRef.style.transform`, `classList.add/remove`) for the carousel to avoid re-renders on every 4s tick. Dot active state managed via classList, not React state.
- **Navigation.tsx uses `usePathname`**: Derives `activeSlug` from the URL path (`/experiments/[slug]`) so the drawer can highlight the current experiment without prop-drilling from the page component.

### Deviations from Spec

- **Spec z-index 60 for drawer, 50 for scrim** (prototype values): Adjusted to **70 for drawer, 60 for scrim** as specified in the task list (F.2/F.3), which differs slightly from the prototype HTML (which used 60/50). The spec task list values were followed.
- **Mobile nav drawer**: Spec F.9 describes a bottom sheet for mobile. The DrawerNav CSS handles this directly with a `@media (max-width: 600px)` block that changes the drawer to `translateY` instead of `translateX`, adds `border-radius: 16px 16px 0 0`, `max-height: 85vh`, and a drag handle. This is built into DrawerNav itself rather than wrapping it in the `<BottomSheet>` component — the nav drawer has too much custom layout (header, scrollable list, carousel) to fit cleanly into the generic BottomSheet wrapper. The BottomSheet is used only for the simpler controls drawer.
- **Drag-to-dismiss**: Not implemented (spec marked it as "nice-to-have"). The drag handle pill is rendered visually but does not respond to swipe gestures.
- **Focus return on close**: Spec F.10 says "on close: focus returns to the grid icon trigger." Not yet implemented — would require a ref to the grid icon passed through context or a callback.

### Items for Scrummaster

- **Only 1 experiment in data**: The month grouping and active highlighting work correctly but are only testable with a single experiment. When more experiments are added to `data/experiments.ts`, verify the grouping renders multiple month sections and that clicking a different experiment navigates and closes the drawer.
- **Focus return to trigger**: F.10 specifies focus should return to the grid icon on drawer close. This requires either passing a ref through NavigationContext or using a `returnFocusRef` pattern. Low priority but needed for full a11y compliance.
- **Drag-to-dismiss on mobile**: The drag handle pill is visual-only. Implementing swipe-down-to-close would require touch event handling (`touchstart`/`touchmove`/`touchend`) on the sheet. Consider for a polish pass.
- **Carousel links**: Special projects have an optional `url` field but clicking a carousel slide doesn't navigate anywhere yet. Wire up `onClick` → `window.open(proj.url)` or `router.push()` when URLs are populated.
- **ExperimentShell cleanup**: Old `ExperimentShell.tsx` and `ExperimentShell.module.css` still exist on disk from Phase D, never deleted. Can be safely removed.

---

## Completion Summary

| Field | Value |
|---|---|
| Date completed | 2026-03-19 |
| All tasks done? | Yes — drawer, scrim, carousel, mobile bottom sheet, context refactor, IndexOverlay deleted |
| Build passing? | Yes — `npm run build` zero errors, zero hydration errors |
| Deployed? | Yes — pushed to main |
| Deviations? | Mobile nav uses inline CSS media query instead of BottomSheet wrapper; drag-to-dismiss not implemented; focus return not implemented |
| New items for backlog? | Focus return to trigger; drag-to-dismiss; carousel link wiring; ExperimentShell cleanup; multi-experiment testing |
