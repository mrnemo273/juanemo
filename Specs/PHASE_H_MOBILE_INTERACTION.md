# PHASE H — Mobile Interaction: Gyroscope + Touch

## Sprint Goal

Make sections B, C, and D of Experiment 01 (Generative Typography) fully interactive on mobile. Replace mouse-dependent interactions with device orientation (gyroscope/accelerometer) for sections B and C, and touch-move events for section D. Update hint text and instructions per-platform. The desktop experience is unchanged.

## Status: `COMPLETE` ✅ (deployed 2026-03-19)

## Depends On: Phase G (complete ✅)

---

## Prerequisites

- Phase G is complete: ExperimentFrame with 6-row grid, expanding settings panel, per-section data model (`sectionConfigs` in `data/experiments.ts`), floating meta labels with hint text
- Read `Specs/PHASE_G_SETTINGS_PANEL.md` — especially the per-section data model (G.7) and builder notes for architecture context
- Read `components/experiments/GenerativeType.tsx` — this is the file you're modifying. Understand how sections B, C, and D currently work.
- Read `lib/generativeAxes.ts` — mobile axis caps are already defined here (wdth: 25–100, wght: 300–650, opsz: 8–120)

---

## Design Rationale

Sections B, C, and D rely on mouse events (`mousemove`, CSS `:hover`) that don't work on touch devices. On mobile, these sections are static — the user sees the drift/default state but can't interact. This defeats the purpose of an interactive experiment journal.

The fix:

1. **Sections B + C → Device Orientation (gyroscope/accelerometer).** Tilting the phone becomes the interaction. This is delightful — the typography responds to physical movement, like liquid inside the screen. Beta (front-to-back tilt) and gamma (left-right tilt) map to the same axis ranges as the mouse.

2. **Section D → Touch events.** Dragging a finger across the word triggers the collapse + lift effect on characters near the touch point. This replaces CSS `:hover` and actually enables the sweep/wave effect that's impossible with tap alone.

3. **Hint text + instructions update per-platform.** Mobile users see touch/tilt language instead of mouse/cursor language.

---

## API: DeviceOrientationEvent

```ts
window.addEventListener('deviceorientation', (e: DeviceOrientationEvent) => {
  e.alpha;  // Compass heading (0–360) — not needed
  e.beta;   // Front-to-back tilt (-180 to 180) — useful range: -45 to 45
  e.gamma;  // Left-right tilt (-90 to 90) — useful range: -30 to 30
});
```

### iOS Permission

iOS 13+ requires explicit permission. Must be triggered by a user gesture (tap):

```ts
if (typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
  const permission = await (DeviceOrientationEvent as any).requestPermission();
  if (permission === 'granted') {
    window.addEventListener('deviceorientation', handler);
  }
}
```

This permission request must happen inside a click/tap handler — it will fail if called on mount.

### Fallback

If gyro permission is denied or unavailable (desktop browser, old device), fall back to touch-move as a secondary input for B and C. Touch drag maps the same way as cursor position.

---

## Task List

### H.1 — Gyro Permission Flow

- [ ] Create a reusable `useDeviceOrientation` hook in `lib/useDeviceOrientation.ts`
- [ ] Returns `{ beta, gamma, isAvailable, requestPermission, permissionState }`
- [ ] `isAvailable`: true if the DeviceOrientationEvent API exists
- [ ] `requestPermission()`: handles the iOS permission flow, returns `'granted' | 'denied' | 'not-required'`
- [ ] `permissionState`: `'prompt' | 'granted' | 'denied' | 'not-required'`
- [ ] On Android / non-iOS, permission is not required — `permissionState` defaults to `'not-required'` and orientation events are attached immediately
- [ ] Beta and gamma values are smoothed (lerp) to avoid jitter: `smoothed += (raw - smoothed) * 0.15`
- [ ] Values are clamped to useful ranges: beta to [-45, 45], gamma to [-30, 30]
- [ ] Returns normalized values (0–1) for easy mapping: `betaNorm` and `gammaNorm`

### H.2 — Permission UI (Inline Hint Action)

- [ ] When a gyro section (B or C) is active on mobile and permission hasn't been granted yet, show an inline action in the hint line: **"Enable Motion"**
- [ ] This uses the existing `hintAction` pattern from Phase G — same as Section E's "Replay"
- [ ] Tapping "Enable Motion" calls `requestPermission()` from the hook
- [ ] On success: action disappears, hint text updates to the tilt instruction
- [ ] On denial: hint text updates to "Drag across the letters" (touch fallback)
- [ ] The permission is requested once and persists for the session — switching between B and C doesn't re-prompt
- [ ] Desktop: "Enable Motion" action never appears (gyro is not available)

### H.3 — Section B Mobile: Gyro Proximity

- [ ] On mobile with gyro granted: tilt maps to a virtual cursor position in the viewport
- [ ] Mapping:
  - `gamma` (left-right tilt) → virtual X position across viewport width
  - `beta` (front-to-back tilt) → virtual Y position across viewport height
  - Neutral hold (phone upright, ~45° beta, 0° gamma) = center of viewport
- [ ] The virtual position feeds into the existing proximity calculation — same 250px radius, same axis blending toward `{ wdth: 151, wght: 900, opsz: 144 }` (or mobile caps)
- [ ] The proximity animation loop (`requestAnimationFrame`) already exists — just swap the mouse position source for the virtual tilt position on mobile
- [ ] **Touch fallback**: if gyro is denied/unavailable, attach `touchmove` listener and use `touch.clientX`/`touch.clientY` as the position source (same as mouse)
- [ ] **Desktop**: no changes — `mousemove` continues to work as-is

### H.4 — Section C Mobile: Gyro Axis Mapping

- [ ] On mobile with gyro granted: tilt maps directly to font axes
- [ ] Mapping:
  - `gammaNorm` (0–1, left-to-right tilt) → `wdth` (25–100 mobile cap) and `opsz` (8–120 mobile cap)
  - `betaNorm` (0–1, forward-to-back tilt) → `wght` (100–650 mobile cap, inverted: forward = light, back = bold)
- [ ] Apply via `fontVariationSettings` on the word element — same as current mouse implementation
- [ ] Keep the existing `transition: font-variation-settings 0.08s linear` for smoothness
- [ ] **Touch fallback**: if gyro is denied/unavailable, attach `touchmove` and map touch X/Y to axes (same mapping as current mouse)
- [ ] **Desktop**: no changes — `mousemove` continues to work as-is

### H.5 — Section D Mobile: Touch Sweep

- [ ] Replace CSS `:hover` with JavaScript touch tracking on mobile
- [ ] On `touchstart` and `touchmove`: calculate which character(s) are near the touch point
- [ ] Characters within ~40px of the touch X position get the collapse + lift treatment:
  - `fontVariationSettings: 'wdth' 25, 'wght' 100, 'opsz' 8`
  - `transform: translateY(-20px)`
  - `color: var(--color-bittersweet)`
- [ ] Characters outside the touch radius reset to their default state
- [ ] Transition timing stays the same: `0.4s cubic-bezier(0.16, 1, 0.3, 1)` with staggered delays
- [ ] On `touchend`: all characters reset to default (same as mouse leaving the area)
- [ ] **Desktop**: CSS `:hover` continues to work as-is — the touch logic only activates on mobile
- [ ] The wave/sweep effect should feel natural when dragging at different speeds

### H.6 — Mobile Detection

- [ ] Use the existing `isMobileViewport()` function (already in GenerativeType.tsx) for breakpoint detection
- [ ] Additionally check for touch capability: `'ontouchstart' in window` or `navigator.maxTouchPoints > 0`
- [ ] The interaction mode should be determined on mount and not change mid-session (no switching if the user resizes)
- [ ] Create a simple helper: `getInteractionMode(): 'mouse' | 'touch' | 'gyro'`
  - `'gyro'`: mobile viewport + touch device + gyro available + permission granted
  - `'touch'`: mobile viewport + touch device + gyro not available or denied
  - `'mouse'`: desktop or no touch capability

### H.7 — Platform-Aware Hint Text + Instructions

**Also resolves B.20:** Phase G hides the hint text on mobile (≤600px) via `display: none` on the hint + dot separator. This phase reverses that — hint text is now VISIBLE on mobile for all sections. On mobile, the bottom meta label wraps to two centered lines: section name on line 1, hint text on line 2. This is essential because mobile users need the instructions even more than desktop users (no hover cues, unfamiliar tilt/touch interactions).

- [ ] Remove the `display: none` / `visibility: hidden` on hint text + dot separator at the ≤600px breakpoint
- [ ] The bottom meta label becomes a two-line centered block on mobile: `flex-wrap: wrap; justify-content: center` so the hint wraps naturally below the section name
- [ ] Hint text on its own line should still be 10px, weight 400, Dun at 20% opacity — same as desktop but on a second line
- [ ] Inline actions (e.g., "Replay", "Enable Motion") wrap with the hint text and remain tappable (`pointer-events: auto`)
- [ ] Extend the `SectionConfig` type with mobile variants:
  ```ts
  interface SectionConfig {
    // ... existing fields
    hintMobile?: string;           // Mobile hint (replaces hint on ≤600px)
    hintActionMobile?: string;     // Mobile action (replaces hintAction on ≤600px)
    instructionsMobile?: {         // Mobile instructions (replaces instructions on ≤600px)
      icon: string;
      text: string;
    }[];
  }
  ```
- [ ] Updated copy per section:

  | Section | Desktop Hint | Mobile Hint | Mobile Action |
  |---------|-------------|-------------|---------------|
  | A | "Watch the letters shift" | "Watch the letters shift" | — |
  | B | "Move your cursor near the letters" | "Tilt your phone near the letters" | "Enable Motion" (before permission) |
  | C | "Move your cursor across the viewport" | "Tilt to reshape the letters" | "Enable Motion" (before permission) |
  | D | "Hover over individual letters" | "Drag across the letters" | — |
  | E | "Plays on load" | "Plays on load" | Replay |
  | F | "Watch the rhythm" | "Watch the rhythm" | — |

- [ ] Mobile instructions for Section B:
  - 🔄 **Tilt your phone** — letters near the tilt point get bolder and wider
  - ↩️ **Level the phone** — letters relax back into the ambient drift
  - 👆 Or **drag your finger** near the letters for direct control

- [ ] Mobile instructions for Section C:
  - ↔️ **Tilt left/right** — controls letter width. Left = condensed, right = extended
  - ↕️ **Tilt forward/back** — controls letter weight. Forward = light, back = bold
  - 👆 Or **drag your finger** to control directly

- [ ] Mobile instructions for Section D:
  - 👆 **Drag across** the word — letters collapse and lift as your finger passes
  - ✋ **Lift your finger** — letters spring back to their natural form
  - ⚡ **Drag faster** for a sharper wave, slower for a gentle ripple

- [ ] ExperimentFrame reads `isMobileViewport()` and selects the appropriate hint/instructions from the config
- [ ] The panel and floating meta labels use the mobile copy automatically when on a small viewport

### H.8 — Gyro Fallback After Permission Denied

- [ ] If the user taps "Enable Motion" and denies permission, the experience should still be interactive
- [ ] Sections B and C fall back to touch-move (same as if gyro wasn't available)
- [ ] The hint action changes from "Enable Motion" to nothing (touch is automatic, no permission needed)
- [ ] The hint text updates from "Tilt your phone..." to "Drag across the letters"
- [ ] Instructions update to show touch-based copy instead of tilt-based
- [ ] This should feel seamless — the user shouldn't feel punished for denying gyro

### H.9 — Build + QA

- [ ] `npm run build` — zero errors
- [ ] **Desktop**: sections B, C, D work exactly as before (mouse events, CSS hover)
- [ ] **Mobile with gyro (iOS Safari, Android Chrome)**:
  - [ ] Section B: tilting phone attracts letters toward bold/extended
  - [ ] Section C: tilting phone maps to width (left/right) and weight (forward/back)
  - [ ] Permission prompt appears once, persists across section switches
- [ ] **Mobile without gyro / permission denied**:
  - [ ] Sections B and C respond to touch-drag as fallback
  - [ ] Section D responds to touch-drag
- [ ] **Section D mobile**: dragging across letters creates a smooth wave/sweep
- [ ] **Hint text**: shows mobile copy on ≤600px, desktop copy otherwise
- [ ] **Panel instructions**: show mobile instructions on ≤600px
- [ ] **Hint visible on mobile**: wraps to second centered line below section name — NOT hidden
- [ ] **Inline actions tappable on mobile**: "Enable Motion" and "Replay" have sufficient tap target in the wrapped hint line
- [ ] **"Enable Motion" action**: appears on B and C before gyro permission, disappears after
- [ ] No console errors or warnings related to DeviceOrientationEvent
- [ ] Smoothing prevents jittery axis changes on gyro input
- [ ] Test on: iPhone Safari (gyro permission), Android Chrome (no permission needed), desktop Chrome (unchanged)

---

## File Map

| File | Action |
|------|--------|
| `lib/useDeviceOrientation.ts` | **New** — reusable gyro hook with iOS permission, smoothing, normalization |
| `components/experiments/GenerativeType.tsx` | **Major edit** — sections B, C, D get mobile interaction branches |
| `components/experiments/GenerativeType.module.css` | **Minor edit** — add touch-active styles for section D (alongside existing `:hover`) |
| `data/experiments.ts` | **Edit** — add `hintMobile`, `hintActionMobile`, `instructionsMobile` to SectionConfig and populate for all 6 sections |
| `components/ExperimentFrame.tsx` | **Minor edit** — read mobile hint/instruction variants from config based on viewport |

---

## Acceptance Criteria

1. Sections B and C respond to device tilt on mobile — typography shifts as the phone tilts
2. Section D responds to touch-drag on mobile — characters collapse and lift in a wave
3. iOS gyro permission prompt appears once (on first gyro section visit), persists for session
4. "Enable Motion" inline action appears in hint line on mobile for sections B and C
5. Permission denial falls back to touch-drag gracefully — no broken state
6. Desktop experience is completely unchanged — mouse events, CSS hover, same behavior
7. Hint text and panel instructions show platform-appropriate copy (tilt/drag vs. cursor/hover)
8. Gyro values are smoothed — no jittery axis changes
9. Touch sweep on Section D creates a visible wave effect at varying drag speeds
10. Hint text is VISIBLE on mobile — wraps to a second centered line below the section name (B.20 resolved)
11. Inline actions ("Enable Motion", "Replay") are tappable on mobile hint line
12. `npm run build` — zero errors
13. Tested on iOS Safari, Android Chrome, and desktop Chrome

---

## Phase H Refinements — Builder Notes

### Architecture Decisions

1. **`useDeviceOrientation` hook (`lib/useDeviceOrientation.ts`)** — Self-contained hook that owns the entire gyro lifecycle: permission detection, iOS `requestPermission()`, event listening, value smoothing (lerp @ 0.15), clamping (beta [-45,45], gamma [-30,30]), and normalization (0–1). The smoothing loop runs in its own `requestAnimationFrame` loop inside the hook, so consumers just read stable normalized values.

2. **Interaction mode refs, not state** — `modeRef` in sections B, C, D is a ref (`'mouse' | 'touch' | 'gyro'`), not state. This avoids re-renders on mode determination and lets the RAF loops read the current mode synchronously. Mode is set once on mount (via `useEffect`) and upgraded to `'gyro'` reactively when `permissionState` changes.

3. **Gyro shared across sections** — Both `SectionProximity` (B) and `SectionMouseAxes` (C) call `useDeviceOrientation()`. The hook is idempotent — multiple instances share the same `DeviceOrientationEvent` listener via separate hook instances, but the browser coalesces the underlying sensor. Permission state is browser-session-scoped, so granting once covers both sections.

4. **CSS `:hover` scoped to `(hover: hover) and (pointer: fine)`** — Instead of trying to cancel sticky `:hover` on touch devices with JS, the CSS hover rule for section D now only applies on devices with a fine pointer. Touch devices get their interaction purely from JS (`touchstart`/`touchmove`/`touchend`). This is cleaner and avoids the "sticky hover" problem on iOS Safari.

### iOS Permission Flow

- On iOS, `DeviceOrientationEvent.requestPermission` must be called from a user gesture. The "Enable Motion" action button in the hint line fulfills this requirement — tapping it calls `gyro.requestPermission()`.
- `permissionState` starts as `'prompt'` on iOS. After the user responds, it transitions to `'granted'` or `'denied'`.
- On Android / non-iOS, `permissionState` defaults to `'not-required'` and orientation events attach immediately on hook mount.
- The "Enable Motion" action only appears when `permissionState === 'prompt'` AND `gyro.isAvailable === true`. Once resolved, it disappears.
- On denial, the hint text changes to "Drag across the letters" and touch fallback activates automatically.

### Smoothing / Lerp Values

- **Lerp factor: 0.15** — Applied per RAF frame. This gives ~10 frames to settle (roughly 160ms at 60fps). Tested to feel responsive but not jittery. The spec suggested 0.15 and it worked well.
- **Beta clamped to [-45, 45]** — Covers the useful tilt range for a phone held upright. Beyond 45° the phone is face-up/face-down and values become unstable.
- **Gamma clamped to [-30, 30]** — Left-right tilt. 30° is about as far as you'd comfortably tilt one-handed.

### Deviations from Spec

- **`getInteractionMode()` helper** — Not implemented as a standalone function. Instead, each section manages its own `modeRef` with a `useEffect` that reads `isMobileViewport()`, `isTouchDevice()`, and gyro state. This is simpler and avoids an unnecessary abstraction for three call sites.
- **Mobile attractor axes for Section B** — On mobile, the proximity attractor targets use `AXIS_RANGES_MOBILE` caps (wdth: 100, wght: 650, opsz: 120) instead of desktop maximums (151, 900, 144). This prevents the attractor from exceeding the mobile-safe range.
- **Section D touch radius** — Set to 40px as specified. The transition timing on `.hoverChar` already handles the spring-back animation when characters exit the radius.

### Files Created

| File | Action |
|------|--------|
| `lib/useDeviceOrientation.ts` | **New** — gyro hook |

### Files Modified

| File | Changes |
|------|---------|
| `components/experiments/GenerativeType.tsx` | Added `useDeviceOrientation` import, `isTouchDevice()` helper, `InteractionMode` type. Sections B and C: added gyro RAF loop with virtual cursor, touch fallback listeners, mobile axis caps. Section D: added `touchstart`/`touchmove`/`touchend` sweep logic with 40px radius. |
| `components/experiments/GenerativeType.module.css` | Scoped `.hoverChar:hover` to `@media (hover: hover) and (pointer: fine)`. Added `@media (hover: none)` block for touch transition continuity. |
| `data/experiments.ts` | Extended `SectionConfig` with `hintMobile`, `hintActionMobile`, `instructionsMobile`. Populated mobile variants for sections B, C, D. |
| `components/ExperimentFrame.tsx` | Added `useDeviceOrientation` for permission state. Added `isMobile` state. Updated hint rendering to resolve mobile text/action variants. Updated panel instructions to use mobile variants. "Enable Motion" action calls `gyro.requestPermission()`. |
| `components/ExperimentFrame.module.css` | Replaced `display: none` on hint elements with `flex-wrap: wrap` layout. Hint text gets `width: 100%` for line break. Hint action gets tappable sizing (44px min-height). Dot separators hidden on mobile. |

### Known Issues / Trade-offs

- **Multiple `useDeviceOrientation` hook instances** — Sections B and C each instantiate the hook. Since React unmounts inactive sections (only one section renders at a time via the registry), only one instance is active at any time. No wasted listeners.
- **No gyro simulation on desktop** — Desktop browsers don't fire `DeviceOrientationEvent`, so the "Enable Motion" action never appears on desktop (correct behavior per spec).
- **Touch fallback on Section C** — When gyro is denied, touch-drag maps position to axes. The experience is functional but less magical than gyro tilt. This is an inherent limitation.

### For Next Phase

- The `useDeviceOrientation` hook is fully reusable for any future experiment that wants gyro input.
- The `InteractionMode` pattern (ref-based, determined on mount) could be extracted to a shared hook if more sections need it.
