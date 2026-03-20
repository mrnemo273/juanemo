# Phase G — Builder Prompt

## Your Mission

You are building **Phase G** of Juanemo — a settings panel redesign for the experiment frame. This phase restructures the grid, adds an expanding panel with per-section controls and instructions, replaces the old mobile drawer, and introduces floating meta labels inside the viewport.

## Required Reading (Do This First)

1. **Open `prototypes/settings-panel-v3.html` in a browser.** This is the approved design. You are matching this exactly — layout, spacing, typography, colors, animation timing. Screenshot it and keep it visible while you work.

2. **Read `Specs/PHASE_G_SETTINGS_PANEL.md`** end to end. This is the full spec with every task, measurement, and acceptance criterion. It is your single source of truth.

3. **Read `Specs/PHASE_D_EXPERIMENT_FRAME.md`** — especially the R.7 builder notes section. This tells you the current architecture you're modifying: the 7-row grid, ExperimentControlsContext, pagination tiles, section loader, and mobile controls drawer.

4. **Read `Specs/PHASE_F_DRAWER_NAV.md`** — Phase F changed NavigationContext from an overlay manager to a context provider with `openDrawer()`/`closeDrawer()`/`isDrawerOpen`. The nav drawer coexists with the experiment frame. Understand the z-index layering.

## What You Are Building

### Grid Change: 7 rows → 6 rows

The current ExperimentFrame has a 7-row grid:
```
auto 1px auto 1fr auto 1px auto
```

You are changing it to a 6-row grid:
```
auto 1px 1fr 0px 1px auto
```

The old bottom meta bar (row 5 in the 7-row grid) is removed. Its content — experiment title and section label — becomes floating `position: absolute` elements inside the viewport (row 3).

Row 4 is the expanding panel: `0px` when collapsed, `var(--panel-height)` when open. The transition is on `grid-template-rows` itself — the viewport shrinks and the panel grows simultaneously.

### The Expanding Panel

When the gear icon is clicked, the grid animates:
```css
transition: grid-template-rows 0.5s cubic-bezier(0.16, 1, 0.3, 1);
```

The panel row goes from `0px` to `260px` (desktop) or `320px` (mobile). Content inside the panel fades in 120ms AFTER the panel starts growing — this prevents a flash of content at zero height.

The panel has two columns: **About + Instructions** (left) and **Controls** (right). On mobile they stack vertically.

### Per-Section Data

Each section declares what it needs:

| Section | Controls | Hint | Action |
|---------|----------|------|--------|
| A — Generative Drift | speed, easing, shuffle | "Watch the letters shift" | — |
| B — Proximity + Drift | speed, easing | "Move your cursor near the letters" | — |
| C — Mouse-Responsive Axes | _(none)_ | "Move your cursor across the viewport" | — |
| D — Per-Character Hover | _(none)_ | "Hover over individual letters" | — |
| E — Expand Entrance | _(none)_ | "Plays on load" | Replay |
| F — Axis Breathing | speed | "Watch the rhythm" | — |

Sections with no controls show an italic "no controls" message. Section E has an inline "Replay" action in the hint line.

### What You Are Deleting

- The old bottom meta bar (grid row 5 in the current 7-row grid)
- The old inline controls in the bottom bar (Speed, Easing, Shuffle buttons)
- The old mobile controls drawer (`<BottomSheet>` component and its CSS module) — the expanding panel replaces it on all breakpoints
- Any description text that was in the old bottom bar

### ⚠️ What You Must NOT Break

**The section transition loader.** When the user clicks a pagination tile to switch sections, there is a 3-phase animation:

1. Current section fades out (100ms)
2. Spinning arrow SVG appears centered in viewport (350ms)
3. New section fades in (100ms)

This loader must continue working exactly as-is. It sits inside the viewport (row 3) and should center itself in whatever viewport size is available — including the smaller viewport when the panel is open. The `activeSection` state updates during phase 2.

If the panel is open during a section switch, the panel content (description, instructions, controls) should also update to the new section during phase 2 of the loader — same timing as the viewport content swap.

**Do not refactor the loader. Do not change its timing. Just make sure it survives the grid restructure.**

## Files to Modify

| File | Action |
|------|--------|
| `components/ExperimentFrame.tsx` | **Major edit** — new 6-row grid, floating meta labels, expanding panel, gear tile in bottom bar |
| `components/ExperimentFrame.module.css` | **Major edit** — new grid definition, panel styles, floating labels, 40px tiles |
| `components/BottomSheet.tsx` | **Delete** — replaced by expanding panel |
| `components/BottomSheet.module.css` | **Delete** |
| `data/experiments.ts` | **Edit** — add `SectionConfig` type, per-section hint/description/instructions/controls |
| `app/globals.css` | **Edit** — add `--panel-speed`, `--panel-ease`, `--panel-height` tokens |

## Design Tokens

```css
--panel-speed: 0.5s;
--panel-ease: cubic-bezier(0.16, 1, 0.3, 1);  /* expo-out */
--panel-height: 260px;  /* desktop */
```

Mobile override (≤600px): `--panel-height: 320px`

## Acceptance Criteria

Before marking this phase complete, verify ALL of the following:

1. Bottom bar: only 40×40 pagination tiles + gear icon, centered, 1px vertical separator between them
2. Gear icon toggles expanding panel with smooth grid-row animation
3. Viewport shrinks as panel grows — keyline lifts, panel reveals
4. Panel content fades in 120ms after panel starts expanding
5. Panel left: section label, description, icon+text instructions
6. Panel right: only the controls the active section declares
7. Sections with no controls show italic "no controls" message
8. Floating meta labels: 60px from keylines (32px mobile), centered in viewport
9. Hint text inline after section name with faint dot separator
10. Section E "Replay" action works from the hint line
11. Mobile: panel stacks vertically, hints hidden, 32px offset, 40px tiles
12. Old mobile controls drawer (BottomSheet) fully removed
13. Escape closes panel
14. **Section transition loader (spinning arrow) still fires on section switch, centers correctly in viewport, panel content updates in sync**
15. `npm run build` — zero errors
16. Test at 320px, 768px, 1280px, 1920px

## When You're Done

Add your builder notes to the `Phase G Refinements — Builder Notes` section at the bottom of `Specs/PHASE_G_SETTINGS_PANEL.md`. Document:

- Any deviations from the spec or prototype
- Architecture decisions you made
- Files created or deleted beyond what was listed
- Known issues or trade-offs
- Anything the next phase should know
