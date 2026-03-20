# PHASE G — Settings Panel & Frame Redesign

## Sprint Goal

Redesign the experiment frame's bottom chrome and controls. Replace the inline bottom-bar controls with a unified pagination + gear strip, an expanding settings panel that grows up from below the keyline, per-section instructions and control configs, and floating centered meta labels inside the viewport. The gear icon and pagination tiles are now the same visual treatment on all breakpoints — no separate mobile drawer needed.

## Status: `COMPLETE` ✅ (deployed 2026-03-19)

## Depends On: Phase D/E (complete ✅), Phase F (complete ✅)

---

## Prerequisites

- Phase D/E is complete: ExperimentFrame with 7-row grid, pagination tiles, section loader, 6 type variations, interactive controls, mobile controls drawer
- Phase F is complete: DrawerNav replaces IndexOverlay, NavigationContext refactored
- Read `Specs/PHASE_D_EXPERIMENT_FRAME.md` — especially R.7 builder notes for current architecture (7-row grid, pagination, ExperimentControlsContext, mobile controls drawer)
- **Open `prototypes/settings-panel-v3.html` in a browser** — this is the approved design. Match this exactly.

---

## Design Rationale

The Phase D/E frame had controls (Speed, Easing, Shuffle) inline in the bottom bar on desktop, and behind a gear icon in a slide-up drawer on mobile. This created two different interaction patterns for the same functionality. The redesign:

1. **Unifies desktop and mobile** — the gear icon is always the settings trigger, on all breakpoints
2. **The panel grows, not overlays** — instead of a sheet sliding over content, the area below the keyline expands upward. The viewport shrinks to make room. It feels architectural — the frame is reconfiguring itself.
3. **Per-section controls** — each section declares what controls it needs. Sections with no controls (Mouse Axes, Per-Character Hover) show a "no controls" message instead of irrelevant buttons.
4. **Instructions live in the frame** — a faint hint next to the section name tells you what to do at a glance. The expanded panel has the full story.
5. **Inline actions** — section-specific actions like "Replay" live right in the hint line, not buried in a panel.

---

## Design Tokens (New)

```css
--panel-speed: 0.5s;
--panel-ease: cubic-bezier(0.16, 1, 0.3, 1);  /* expo-out */
--panel-height: 260px;  /* desktop */
--panel-height: 320px;  /* mobile (≤600px override) */
```

Add to `globals.css` alongside existing tokens.

---

## New Grid Structure

The frame grid changes from the Phase D/E 7-row layout to a 6-row layout:

```
┌─────────────────────────────────────────────┐
│  ROW 1: TOP BAR — date (left) · logo (center) · grid icon (right)  │
├─────────────────────────────────────────────┤ ← ROW 2: keyline
│                                             │
│  ROW 3: VIEWPORT (1fr)                      │
│                                             │
│     ┌ 01 Generative Typography ┐  ← 60px from top keyline, centered  │
│     │                          │                                      │
│     │      JUANEMO             │                                      │
│     │                          │                                      │
│     └ A Generative Drift · Watch the letters shift ┘  ← 60px from bottom keyline  │
│                                             │
├─────────────────────────────────────────────┤ ← ROW 4: expanding panel (0px → 260px)
├─────────────────────────────────────────────┤ ← ROW 5: keyline
│  ROW 6: BOTTOM BAR — [A][B][C][D][E][F] | [⚙]  centered  │
└─────────────────────────────────────────────┘
```

Grid definition:
- **Collapsed:** `grid-template-rows: auto 1px 1fr 0px 1px auto`
- **Expanded:** `grid-template-rows: auto 1px 1fr var(--panel-height) 1px auto`

The transition between states is animated: `transition: grid-template-rows var(--panel-speed) var(--panel-ease)`. This causes the viewport (1fr) to shrink and the panel row to grow simultaneously — the keyline lifts and the panel reveals underneath.

**Key change from Phase D/E:** The old bottom meta bar (row 5 in the 7-row grid) is removed. The experiment title and section label are now floating elements inside the viewport, positioned with `position: absolute`.

---

## Task List

### G.1 — Restructure the Grid

- [ ] Change ExperimentFrame's CSS Grid from the current 7-row layout to the new 6-row layout
- [ ] Default: `grid-template-rows: auto 1px 1fr 0px 1px auto`
- [ ] Panel open: `grid-template-rows: auto 1px 1fr var(--panel-height) 1px auto`
- [ ] Add `transition: grid-template-rows var(--panel-speed) var(--panel-ease)` to the grid container
- [ ] Remove the old bottom meta bar row entirely — its content moves into the viewport as floating elements

### G.2 — Floating Meta Labels (Inside Viewport)

- [ ] Both labels are `position: absolute` inside the viewport, centered horizontally, `pointer-events: none`

#### G.2a — Experiment Title (Top)

- [ ] Position: `top: 60px; left: 0; right: 0`
- [ ] Layout: `display: flex; align-items: baseline; justify-content: center; gap: 10px`
- [ ] Number: 11px, weight 500, `0.12em` tracking, uppercase, Bittersweet
- [ ] Title: 11px, weight 500, `0.12em` tracking, uppercase, Dun at 50% opacity
- [ ] Mobile (≤600px): `top: 32px`

#### G.2b — Section Label + Hint (Bottom)

- [ ] Position: `bottom: 60px; left: 0; right: 0`
- [ ] Layout: `display: flex; align-items: baseline; justify-content: center; gap: 10px`
- [ ] Section letter: 11px, weight 500, `0.12em` tracking, uppercase, Bittersweet
- [ ] Section name: 11px, weight 500, `0.12em` tracking, uppercase, Dun at 50% opacity
- [ ] Dot separator: `·` character, 11px, Dun at 12% opacity, `margin: 0 2px`
- [ ] Hint text: 10px, weight 400, `0.04em` tracking, Dun at 20% opacity
- [ ] Hint text updates per section (from section data)
- [ ] Mobile (≤600px): `bottom: 32px`, hint text + separator hidden

#### G.2c — Inline Actions (e.g., Replay)

- [ ] Some sections have an inline action button in the hint line (e.g., Section E has "Replay")
- [ ] The action appears after the hint text, separated by another `·` dot
- [ ] Style: 10px, weight 500, `0.06em` tracking, uppercase, Dun at 25% opacity
- [ ] Hover: opacity 0.7, color → Bittersweet
- [ ] `pointer-events: auto` on the action button (parent has `pointer-events: none`)
- [ ] Action is defined per-section in the data model (see G.7)
- [ ] Click triggers a section-specific handler (e.g., Replay snaps all chars to condensed then animates out with staggered delay)

### G.3 — Bottom Bar (Pagination + Gear)

- [ ] The bottom bar contains ONLY the pagination tiles and gear icon, centered
- [ ] Remove all inline controls (Speed, Easing, Shuffle buttons) from the bottom bar
- [ ] Remove the old description text from the bottom bar
- [ ] Layout: `display: flex; align-items: center; justify-content: center; gap: 4px`
- [ ] Padding: `10px var(--pad) 12px`

#### G.3a — Pagination Tiles

- [ ] Size: **40×40px** on all breakpoints
- [ ] Border: `1px solid var(--keyline-dark)`, radius 3px
- [ ] Font: DM Sans, 11px, weight 500, `0.04em` tracking
- [ ] Default: Dun at 30% opacity
- [ ] Hover: opacity 0.6, border-color `rgba(214, 197, 171, 0.25)`
- [ ] Active: opacity 1.0, border-color Bittersweet, color Bittersweet
- [ ] Click → switch section (same behavior as current pagination tiles)

#### G.3b — Gear Icon Tile

- [ ] Same 40×40px tile treatment as pagination tiles
- [ ] Contains a gear SVG icon: 15×15px, Dun stroke, weight 1.5
- [ ] Default: opacity 0.3, border `1px solid var(--keyline-dark)`
- [ ] Hover: opacity 0.6, border-color `rgba(214, 197, 171, 0.25)`
- [ ] **Panel open state:** opacity 1.0, border-color Bittersweet, stroke Bittersweet, `transform: rotate(90deg)`
- [ ] Rotation transition: `0.4s var(--panel-ease)`
- [ ] Click → toggle `.panel-open` class on the scene (or use React state)

#### G.3c — Separator

- [ ] Between pagination tiles and gear: a 1px × 20px vertical line
- [ ] Color: `var(--keyline-dark)`
- [ ] Margin: `0 8px`
- [ ] Mobile (≤600px): margin `0 5px`

### G.4 — Expanding Settings Panel

- [ ] The panel is the 4th grid row (between viewport and bottom keyline)
- [ ] Background: `var(--gunmetal)` (same as frame — it's part of the frame, not a separate layer)
- [ ] `overflow: hidden` on the row container
- [ ] z-index: 20 (above viewport content if needed)

#### G.4a — Panel Content Fade

- [ ] Panel content has its own opacity transition, separate from the grid growth
- [ ] Default: `opacity: 0; pointer-events: none`
- [ ] Open: `opacity: 1; pointer-events: auto`
- [ ] Transition: `opacity 0.3s ease 0.12s` (120ms delay — content fades in AFTER the panel starts growing)
- [ ] Close: `opacity 0.25s ease` (no delay — content fades immediately)

#### G.4b — Panel Inner Layout

- [ ] Two-column flex layout: **About** (left, `flex: 1`) + **Controls** (right, `clamp(170px, 22vw, 240px)`)
- [ ] Gap: `clamp(32px, 5vw, 64px)`
- [ ] Padding: `24px 0 20px` (horizontal padding comes from parent via `var(--pad)`)
- [ ] Mobile (≤600px): stacks vertically (`flex-direction: column`), controls go full-width, `overflow-y: auto`

### G.5 — Panel Left Column: About + Instructions

#### G.5a — Section Label

- [ ] Shows: `"A — Generative Drift"` (letter + em dash + name)
- [ ] Style: 9px, weight 500, `0.14em` tracking, uppercase, Dun at 25% opacity
- [ ] Bottom border: `1px solid var(--keyline-dark)`, `padding-bottom: 8px`

#### G.5b — Description

- [ ] The experiment section's description text
- [ ] 12px, weight 400, line-height 1.65, Dun at 40% opacity
- [ ] `max-width: 520px`

#### G.5c — Instructions

- [ ] List of instruction items, each with an icon + text
- [ ] Layout: `flex-direction: column; gap: 6px; margin-top: 2px`
- [ ] Each item: `display: flex; align-items: center; gap: 10px`
- [ ] **Icon container:** 22×22px, border-radius 3px, `background: rgba(214, 197, 171, 0.05)`
- [ ] **Icon SVG:** 11×11px, Dun stroke at 30% opacity, stroke-width 1.5
- [ ] **Text:** 11px, weight 400, line-height 1.5, Dun at 30% opacity
- [ ] **Bold keyword:** weight 500, full opacity (e.g., `<strong>Watch</strong>`)
- [ ] Icons use Lucide-style SVGs: eye, refresh, clock, cursor, move, move-v, play (see prototype for paths)

### G.6 — Panel Right Column: Controls

- [ ] Header: "Controls" label, same style as panel left label (G.5a)
- [ ] Controls are rendered conditionally per section — only what the section declares

#### G.6a — Speed Control

- [ ] Label: "Speed", 9px, weight 500, `0.1em` tracking, uppercase, Dun at 25% opacity
- [ ] Buttons: `2s`, `4s`, `8s` — same `.ctrl-btn` style as Phase D/E
- [ ] Button style: `padding: 5px 12px`, DM Sans 10px, weight 500, `0.08em` tracking, uppercase, Dun at 45%, border `1px solid var(--keyline-dark)`, radius 3px
- [ ] Active: Bittersweet border + color, opacity 0.9
- [ ] Shown for sections: A (Drift), B (Proximity), F (Breathing)

#### G.6b — Easing Control

- [ ] Label: "Easing"
- [ ] Buttons: `Spring`, `Smooth`
- [ ] Shown for sections: A (Drift), B (Proximity)

#### G.6c — Shuffle Button

- [ ] Standalone button, same `.ctrl-btn` style, `align-self: flex-start`
- [ ] Shown for section: A (Drift) only

#### G.6d — No Controls Message

- [ ] When a section has zero controls, show: "No controls — this section is purely interactive."
- [ ] 11px, weight 400, `0.04em` tracking, Dun at 20% opacity, italic
- [ ] Shown for sections: C (Mouse Axes), D (Hover), E (Expand Entrance)

### G.7 — Per-Section Data Model

- [ ] Extend the section/experiment data model with per-section metadata:
  ```ts
  interface SectionConfig {
    letter: string;             // "A"
    name: string;               // "Generative Drift"
    hint: string;               // "Watch the letters shift"
    hintAction?: string;        // "Replay" — optional inline action
    description: string;        // Full description for panel
    instructions: {
      icon: string;             // "eye", "cursor", "move", etc.
      text: string;             // HTML string with <strong> keywords
    }[];
    controls: string[];         // ["speed", "easing", "shuffle"] — which controls to show
  }
  ```
- [ ] Section configs for all 6 sections (from prototype):

  | Section | Controls | Hint | Action |
  |---------|----------|------|--------|
  | A — Generative Drift | speed, easing, shuffle | "Watch the letters shift" | — |
  | B — Proximity + Drift | speed, easing | "Move your cursor near the letters" | — |
  | C — Mouse-Responsive Axes | _(none)_ | "Move your cursor across the viewport" | — |
  | D — Per-Character Hover | _(none)_ | "Hover over individual letters" | — |
  | E — Expand Entrance | _(none)_ | "Plays on load" | Replay |
  | F — Axis Breathing | speed | "Watch the rhythm" | — |

### G.8 — Remove Old Mobile Controls Drawer

- [ ] Delete the Phase D/E mobile controls drawer (gear icon → slide-up sheet pattern)
- [ ] Delete the `<BottomSheet>` component if it's only used for this purpose
- [ ] The expanding panel handles mobile natively — it just stacks vertically with `overflow-y: auto`
- [ ] The gear icon in the bottom bar is now the universal trigger on all breakpoints

### G.9 — Open/Close Behavior

- [ ] **Gear icon click** → toggles panel open/close
- [ ] **Escape key** → closes panel (if open)
- [ ] **Section switch** → panel stays open (content updates to new section). The section transition loader (G.9a) fires normally — panel content updates after the new section mounts.
- [ ] The panel is managed via `ExperimentControlsContext` or a new `panelOpen` state in ExperimentFrame
- [ ] When panel opens: grid row 4 animates from `0px` to `var(--panel-height)`, viewport shrinks, content fades in after 120ms delay
- [ ] When panel closes: content fades out immediately, grid row 4 animates back to `0px`

### G.9a — Preserve Section Transition Loader

**CRITICAL: Do not break the existing section transition loader from Phase D/E.**

The current build has a 3-phase transition animation that plays when switching between sections A–F via the pagination tiles:

1. **Phase 1 — Fade out** (100ms): current section content fades to `opacity: 0`
2. **Phase 2 — Spinning arrow** (350ms): a rotating arrow SVG appears centered in the viewport. The arrow is a simple chevron/arrow that rotates continuously via CSS `@keyframes spin`. `activeSection` state updates during this phase so the new section mounts behind the loader.
3. **Phase 3 — Fade in** (100ms): loader disappears, new section content fades to `opacity: 1`

This loader must continue to work exactly as-is after the grid restructure. Specifically:

- [ ] The loader overlay sits inside the viewport (row 3) and is NOT affected by the panel row (row 4)
- [ ] The loader centers itself in the viewport, which will be smaller when the panel is open — this is correct behavior
- [ ] The spinning arrow SVG and its `@keyframes` animation must be preserved
- [ ] The fade-out / spinner / fade-in timing (100ms → 350ms → 100ms) must not change
- [ ] If the panel is open during a section switch, the panel content (left column: label, description, instructions; right column: controls) updates to the new section AFTER the loader completes — i.e., panel content swaps during Phase 2, same timing as the viewport content swap
- [ ] Do not remove or refactor the loader — only ensure it still works in the new 6-row grid

### G.10 — Mobile Responsive (≤600px)

- [ ] `--panel-height: 320px` (taller to accommodate stacked layout)
- [ ] Top bar date: hidden
- [ ] Meta labels: 32px from keylines (instead of 60px)
- [ ] Hint text + separators: hidden (just letter + name)
- [ ] Panel inner: `flex-direction: column`, controls go full-width
- [ ] Pagination tiles + gear: remain 40×40px
- [ ] Bottom bar padding tightens: `8px var(--pad) 10px`, gap: 3px
- [ ] Separator margin: `0 5px`

### G.11 — Build + QA

- [ ] `npm run build` — zero errors
- [ ] Panel opens/closes with smooth grid animation on all breakpoints
- [ ] Content fades in AFTER panel starts growing (no flash of content at 0px height)
- [ ] Switching sections updates: meta labels, hint text, panel label, description, instructions, and visible controls
- [ ] Controls still affect the experiment (Speed changes drift, Easing changes curve, Shuffle re-randomizes)
- [ ] Section E Replay action works from the hint line
- [ ] Sections C, D, E show "no controls" message in panel
- [ ] Mobile: stacked panel layout scrolls if content overflows
- [ ] Escape closes the panel
- [ ] Old mobile controls drawer is fully removed
- [ ] **Section transition loader** — spinning arrow still appears between section switches (100ms fade → 350ms spin → 100ms fade)
- [ ] Loader centers in viewport correctly even when panel is open (viewport is shorter)
- [ ] Panel content updates to new section in sync with viewport content (during loader Phase 2)
- [ ] Test at 320px, 768px, 1280px, 1920px

---

## File Map

| File | Action |
|------|--------|
| `components/ExperimentFrame.tsx` | **Major edit** — new 6-row grid, floating meta labels, expanding panel, gear tile in bottom bar |
| `components/ExperimentFrame.module.css` | **Major edit** — new grid definition, panel styles, floating labels, 40px tiles |
| `components/BottomSheet.tsx` | **Delete** — replaced by expanding panel |
| `components/BottomSheet.module.css` | **Delete** |
| `data/experiments.ts` | **Edit** — add `SectionConfig` type, per-section hint/description/instructions/controls |
| `app/globals.css` | **Edit** — add `--panel-speed`, `--panel-ease`, `--panel-height` tokens |

---

## Acceptance Criteria

1. Bottom bar shows only pagination tiles (40×40, bordered) + gear icon (40×40, bordered), centered, separated by a 1px vertical line
2. Gear icon toggles the expanding panel with smooth grid-row animation
3. Viewport shrinks as panel grows — keyline lifts, content reveals below it
4. Panel content fades in 120ms after the panel starts expanding
5. Panel left column shows section label, description, and icon+text instructions
6. Panel right column shows only the controls the active section declares
7. Sections with no controls show italic "no controls" message
8. Floating meta labels sit 60px from their keylines, centered, inside the viewport
9. Section hint text appears inline after the section name with a faint dot separator
10. Section E has a clickable "Replay" action in the hint line that triggers the expand animation
11. Mobile: panel stacks vertically, hints hidden, 32px label offset, same 40px tiles
12. Old mobile controls drawer (BottomSheet) is fully removed
13. Escape closes the panel
14. Section transition loader (spinning arrow) still fires on section switch, centers correctly in (potentially shorter) viewport, and panel content updates in sync

---

## Phase G Refinements — Builder Notes

### Decisions Made

- **Replay via context, not internal button**: Section E's old inline "Replay" button was removed from `GenerativeType.tsx`. Instead, `ExperimentControlsContext` was extended with a `replayKey` counter (same pattern as `shuffleKey`). The frame's hint action increments `replayKey`; `SectionExpandEntrance` watches for changes and triggers the animation. This keeps the replay trigger in the frame chrome where the spec wants it, without prop-drilling or imperative refs between frame and experiment.
- **`SectionConfig` as a top-level export**: Section configs are defined as a standalone `sectionConfigs` array in `data/experiments.ts` and referenced by the experiment object. This keeps the data co-located and allows future experiments to define their own configs.
- **`dangerouslySetInnerHTML` for instruction text**: Instruction text contains `<strong>` tags for bold keywords (matching the prototype). React's `dangerouslySetInnerHTML` is used for these trusted, static strings from the data file. The icon SVG paths also use this pattern.
- **`composes: ctrlBtn` for shuffle button**: The shuffle button in the panel uses CSS Modules `composes` to inherit `.ctrlBtn` styles and adds `align-self: flex-start`, matching the prototype's standalone button treatment.
- **Panel state in ExperimentFrame, not context**: `panelOpen` is local state in ExperimentFrame. It doesn't need to be in `ExperimentControlsContext` because no experiment section needs to know if the panel is open — they only care about `speed`, `easing`, `shuffleKey`, `activeSection`, and `replayKey`.

### Deviations from Spec

- **None significant.** The implementation matches the prototype (`settings-panel-v3.html`) in layout, typography, spacing, animation timing, and behavior.

### Files Modified Beyond File Map

- `lib/ExperimentControlsContext.tsx` — added `replayKey: number` to the `ExperimentControls` interface and default value.
- `components/experiments/GenerativeType.tsx` — removed the old internal Replay button from `SectionExpandEntrance`, added `replayKey` watcher via `useEffect`. Removed unused `useCallback` import for `handleReplay`.
- `components/experiments/GenerativeType.module.css` — removed `.replayBtn` and `.replayBtn:hover` styles (no longer needed).
- `app/experiments/[slug]/page.tsx` — added `sectionConfigs` prop pass-through to `<ExperimentFrame>`.

### Files Deleted

- `components/BottomSheet.tsx` — replaced by the expanding panel on all breakpoints.
- `components/BottomSheet.module.css` — associated styles removed.

### Known Issues / Trade-offs

- **DrawerNav "N" button overlaps tile A on mobile**: At 320–375px, the DrawerNav floating trigger button sits in the bottom-left corner and overlaps the first pagination tile. This is a DrawerNav positioning issue from Phase F, not a Phase G regression. The bottom bar itself is correctly centered. Consider moving the DrawerNav trigger to the top bar grid icon on mobile, or adjusting its z-index/position in a future polish pass.
- **`dangerouslySetInnerHTML` usage**: Safe because the strings are hardcoded in `data/experiments.ts`, not user-generated. If section configs become user-editable in the future, sanitize the HTML.

### Items for Next Phase

- The DrawerNav mobile trigger positioning should be revisited — it conflicts with the bottom bar pagination tiles at narrow viewports.
- Keyboard navigation for pagination tiles (arrow keys to cycle sections) is still not implemented (noted in Phase D/E as well).
- The `replayKey` pattern could be generalized if future sections need frame-triggered actions.
