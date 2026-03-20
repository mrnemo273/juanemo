# Phase H — Builder Prompt

## Your Mission

You are building **Phase H** of Juanemo — making the generative typography experiment fully interactive on mobile. Sections B, C, and D currently rely on mouse events that don't work on touch devices. You're adding device orientation (gyroscope) support for B and C, touch-sweep for D, and platform-aware instructions for all sections. The desktop experience must remain completely unchanged.

## Required Reading (Do This First)

1. **Read `Specs/PHASE_H_MOBILE_INTERACTION.md`** end to end. This is the full spec with every task, measurement, and acceptance criterion. It is your single source of truth.

2. **Read `components/experiments/GenerativeType.tsx`** — this is the main file you're modifying. Understand how sections B, C, and D currently handle mouse interaction:
   - **Section B** (Proximity + Drift): `mousemove` tracks cursor position, calculates distance to each character, blends axes toward bold/extended within a 250px radius
   - **Section C** (Mouse Axes): `mousemove` maps cursor X → width, cursor Y → weight across the viewport
   - **Section D** (Per-Char Hover): pure CSS `:hover` collapses characters and lifts them

3. **Read `data/experiments.ts`** — the `sectionConfigs` array has the current hint text, instructions, and controls per section. You're extending this with mobile variants.

4. **Read `lib/generativeAxes.ts`** — mobile axis caps are already defined here (wdth: 25–100, wght: 300–650, opsz: 8–120). Use these ranges for mobile gyro/touch mapping.

5. **Read `components/ExperimentFrame.tsx`** — this renders the floating meta labels and settings panel. You'll make minor edits so it reads mobile hint/instruction variants from the config.

## What You Are Building

### 1. `useDeviceOrientation` Hook (New File)

Create `lib/useDeviceOrientation.ts` — a reusable React hook that wraps the DeviceOrientationEvent API.

**It must handle:**
- **iOS permission**: `DeviceOrientationEvent.requestPermission()` — must be called inside a user gesture (tap). Returns `'granted'` or `'denied'`.
- **Android/non-iOS**: No permission needed. Orientation events attach immediately.
- **Value smoothing**: Raw gyro values are jittery. Apply a lerp: `smoothed += (raw - smoothed) * 0.15` per frame.
- **Clamping**: Beta clamped to [-45, 45], gamma clamped to [-30, 30].
- **Normalization**: Output `betaNorm` and `gammaNorm` as 0–1 values for easy axis mapping.

**Returns:**
```ts
{
  beta: number;          // Raw clamped value
  gamma: number;         // Raw clamped value
  betaNorm: number;      // 0–1 normalized
  gammaNorm: number;     // 0–1 normalized
  isAvailable: boolean;  // DeviceOrientationEvent exists
  permissionState: 'prompt' | 'granted' | 'denied' | 'not-required';
  requestPermission: () => Promise<'granted' | 'denied' | 'not-required'>;
}
```

### 2. Section B Mobile: Gyro Proximity

On mobile with gyro granted, tilt the phone and letters near the "virtual cursor" get attracted toward bold/extended — same proximity math, different input source.

**Mapping:**
- `gammaNorm` → virtual X position across viewport width
- `betaNorm` → virtual Y position across viewport height
- Neutral hold (phone ~45° upright, level left-right) = center of viewport

The existing `requestAnimationFrame` loop already calculates distance from cursor to each character. You just need to swap the position source: `mouseRef.current` on desktop → virtual tilt position on mobile.

**Touch fallback:** If gyro is denied or unavailable, attach `touchmove` and use `touch.clientX`/`touch.clientY` as the position source.

### 3. Section C Mobile: Gyro Axis Mapping

On mobile with gyro granted, tilt maps directly to font variation axes.

**Mapping:**
- `gammaNorm` (left-right tilt) → `wdth` (25–100 mobile cap) and `opsz` (8–120 mobile cap)
- `betaNorm` (forward-back tilt) → `wght` (100–650 mobile cap, inverted: forward = light, back = bold)

Same visual result as moving the mouse — just from physical tilt instead.

**Touch fallback:** Same as B — `touchmove` maps touch position to axes.

### 4. Section D Mobile: Touch Sweep

Replace CSS `:hover` with JavaScript touch tracking on mobile.

**How it works:**
- On `touchstart`/`touchmove`: find characters within ~40px of the touch X position
- Those characters get the collapse + lift treatment (`wdth: 25, wght: 100, opsz: 8`, `translateY(-20px)`, Bittersweet color)
- Characters outside the radius reset to default
- On `touchend`: all characters reset
- Transition timing stays the same as the existing CSS `:hover` transition
- Desktop CSS `:hover` continues to work — touch logic only activates on mobile

### 5. iOS Permission via "Enable Motion" Action

When sections B or C are active on mobile and gyro permission hasn't been granted:
- The hint line shows an **"Enable Motion"** action (same pattern as Section E's "Replay")
- Tapping it calls `requestPermission()` from the hook
- On success: action disappears, hint updates to tilt instruction
- On denial: action disappears, hint updates to touch instruction, fallback activates
- Permission persists for the session — switching between B and C doesn't re-prompt

### 6. Mobile Hint Visibility (B.20)

**Phase G hides the hint text on mobile. Phase H reverses this.**

- Remove the `display: none` on hint text + dot separator at the ≤600px breakpoint
- The bottom meta label wraps to two centered lines on mobile: section name on line 1, hint on line 2
- Use `flex-wrap: wrap; justify-content: center` on the label container
- Inline actions ("Enable Motion", "Replay") wrap with the hint and remain tappable

### 7. Platform-Aware Copy

Extend `SectionConfig` with mobile variants:

```ts
hintMobile?: string;
hintActionMobile?: string;
instructionsMobile?: { icon: string; text: string; }[];
```

| Section | Desktop Hint | Mobile Hint |
|---------|-------------|-------------|
| A | "Watch the letters shift" | "Watch the letters shift" |
| B | "Move your cursor near the letters" | "Tilt your phone near the letters" |
| C | "Move your cursor across the viewport" | "Tilt to reshape the letters" |
| D | "Hover over individual letters" | "Drag across the letters" |
| E | "Plays on load" | "Plays on load" |
| F | "Watch the rhythm" | "Watch the rhythm" |

ExperimentFrame reads `isMobileViewport()` and selects the appropriate variant from the config.

## Mobile Detection

Use the existing `isMobileViewport()` (already in GenerativeType.tsx) plus a touch check:

```ts
function getInteractionMode(): 'mouse' | 'touch' | 'gyro' {
  // 'gyro': mobile + touch + gyro available + permission granted
  // 'touch': mobile + touch + no gyro or denied
  // 'mouse': desktop or no touch
}
```

Determine on mount. Don't change mid-session.

## Files to Modify

| File | Action |
|------|--------|
| `lib/useDeviceOrientation.ts` | **New** — gyro hook |
| `components/experiments/GenerativeType.tsx` | **Major edit** — sections B, C, D get mobile branches |
| `components/experiments/GenerativeType.module.css` | **Minor edit** — touch-active styles for section D |
| `data/experiments.ts` | **Edit** — add mobile hint/instruction variants to SectionConfig |
| `components/ExperimentFrame.tsx` | **Minor edit** — read mobile variants, show hint on mobile |
| `components/ExperimentFrame.module.css` | **Minor edit** — remove hint `display: none` at mobile, add `flex-wrap` |

## ⚠️ What You Must NOT Break

1. **Desktop experience** — mouse events, CSS `:hover`, all current behavior is completely unchanged
2. **Section transition loader** — spinning arrow between section switches must still work
3. **Settings panel** — expanding panel, per-section controls, all Phase G behavior intact
4. **Existing mobile axis caps** — `generativeAxes.ts` already has mobile ranges. Use them for gyro mapping.
5. **Sections A, E, F** — these don't need mobile interaction changes. A and F are timer-based (already work), E plays on load (already works).

## Acceptance Criteria

1. Sections B and C respond to device tilt on mobile — typography shifts as the phone tilts
2. Section D responds to touch-drag on mobile — characters collapse and lift in a wave
3. iOS gyro permission prompt appears once (on first gyro section visit), persists for session
4. "Enable Motion" inline action appears in hint line on mobile for sections B and C
5. Permission denial falls back to touch-drag gracefully — no broken state
6. Desktop experience is completely unchanged
7. Hint text and panel instructions show platform-appropriate copy
8. Gyro values are smoothed — no jittery axis changes
9. Touch sweep on Section D creates a visible wave effect at varying drag speeds
10. Hint text is VISIBLE on mobile — wraps to a second centered line below the section name
11. Inline actions ("Enable Motion", "Replay") are tappable on mobile hint line
12. `npm run build` — zero errors
13. Tested on iOS Safari, Android Chrome, and desktop Chrome

## When You're Done

Add your builder notes to the `Phase H Refinements — Builder Notes` section at the bottom of `Specs/PHASE_H_MOBILE_INTERACTION.md`. Document:

- Any deviations from the spec
- Architecture decisions you made
- How you handled the iOS permission flow
- The smoothing/lerp values you settled on
- Files created or deleted beyond what was listed
- Known issues or trade-offs
- Anything the next phase should know
