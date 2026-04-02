# GYRO.1 — EXP-02 Collision Changes Gyro Upgrade — Builder Prompt

**Read first:** `Specs/GYRO_UPGRADE.md` (full spec with dead zone utility, iOS permission pattern, per-experiment values)

---

## What You're Doing

Adding gyro dead zones and iOS permission handling to all 7 EXP-02 sections. Currently, every section maps raw `gyro.gammaNorm` and `gyro.betaNorm` directly to physics forces — which means on a table or with small hand tremors, orbs drift constantly. The Three-Body builder (EXP-03B) proved that an 8% dead zone eliminates this entirely.

**This is a surgical upgrade — you are NOT changing any visual behavior, physics, or audio. Only how gyro input is consumed.**

---

## Step 1: Create Shared Dead Zone Utility

Create `lib/gyroUtils.ts`:

```typescript
/**
 * Apply dead zone to a normalized 0–1 gyro value.
 * Returns 0.5 (center) when within dead zone.
 * Otherwise remaps remaining range to full 0–1.
 */
export function applyDeadZone(normValue: number, deadZone: number = 0.08): number {
  const centered = normValue - 0.5;
  const abs = Math.abs(centered);
  if (abs <= deadZone) return 0.5;
  const remapped = Math.sign(centered) * (abs - deadZone) / (0.5 - deadZone);
  return 0.5 + remapped * 0.5;
}

/**
 * Apply dead zone and return -1 to 1 range (for gravity/force mapping).
 * Returns 0 when within dead zone.
 */
export function applyDeadZoneBipolar(normValue: number, deadZone: number = 0.08): number {
  const centered = normValue - 0.5;
  const abs = Math.abs(centered);
  if (abs <= deadZone) return 0;
  return Math.sign(centered) * (abs - deadZone) / (0.5 - deadZone);
}
```

---

## Step 2: Add iOS Permission Toast to Each Section

Each of the 7 sections needs a gyro permission toast for iOS. The pattern:

1. Check `gyro.permissionState === 'prompt'` on mount (iOS only)
2. Show centered toast button: "Tap to enable motion control"
3. On tap: `await gyro.requestPermission()`, hide toast, start audio if not started

**Important:** Most sections already have a "tap to start audio" pattern (click on canvas starts `Tone.start()`). The gyro permission request should be combined with the audio start — one tap does both.

Look at each section's existing `handleCanvasClick` or `handleAudioStart` function. If `gyro.permissionState === 'prompt'`, call `gyro.requestPermission()` inside that handler. This way the user's first tap grants gyro AND starts audio.

If the section doesn't have a tap-to-start pattern, add the toast as described in the spec.

### CSS for Toast

Add to each section's CSS module (or create a shared class):

```css
.gyroToast {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  color: var(--color-dun);
  border: 1px solid var(--color-dun);
  border-radius: 8px;
  padding: 12px 24px;
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  cursor: pointer;
  z-index: 10;
}
```

---

## Step 3: Apply Dead Zones Per Section

### A. CollisionChanges.tsx (Section A)

**Current code (around line 378):**
```typescript
gx: (g.gammaNorm - 0.5) * 2,
gy: (g.betaNorm - 0.5) * 2,
```

**Change to:**
```typescript
import { applyDeadZoneBipolar } from '../../lib/gyroUtils';
// ...
gx: applyDeadZoneBipolar(g.gammaNorm, 0.06),
gy: applyDeadZoneBipolar(g.betaNorm, 0.06),
```

Dead zone: **0.06** (gravity should respond to intentional tilt, ignore table vibration)

### B. PianoSplit.tsx (Section B)

**Current code (around line 759):**
```typescript
gx: (g.gammaNorm - 0.5) * 2,
gy: (g.betaNorm - 0.5) * 2,
```

**Change to:**
```typescript
gx: applyDeadZoneBipolar(g.gammaNorm, 0.06),
gy: applyDeadZoneBipolar(g.betaNorm, 0.06),
```

Dead zone: **0.06**

### C. GravityWell.tsx (Section C)

**Current code (around line 636):**
```typescript
centerX += (g.gammaNorm - 0.5) * 160;
centerY += (g.betaNorm - 0.5) * 120;
```

**Change to:**
```typescript
centerX += applyDeadZoneBipolar(g.gammaNorm, 0.08) * 80;
centerY += applyDeadZoneBipolar(g.betaNorm, 0.08) * 60;
```

Dead zone: **0.08** (well position shouldn't drift from micro-movements). Note the multiplier changes from ±80px to ±80px because `applyDeadZoneBipolar` already returns -1 to 1.

**Also check line 751-752** for the same pattern in the drag/release interaction.

### D. Flock.tsx (Section D)

**Current code (around line 977):**
```typescript
gyroGx = (g.gammaNorm - 0.5) * 2;
gyroGy = (g.betaNorm - 0.5) * 2;
```

**Change to:**
```typescript
gyroGx = applyDeadZoneBipolar(g.gammaNorm, 0.06);
gyroGy = applyDeadZoneBipolar(g.betaNorm, 0.06);
```

Dead zone: **0.06**

### E. Magnets.tsx (Section E)

**Current code (around line 805):**
```typescript
gyroGx = (g.gammaNorm - 0.5) * 2;
gyroGy = (g.betaNorm - 0.5) * 2;
```

**Change to:**
```typescript
gyroGx = applyDeadZoneBipolar(g.gammaNorm, 0.06);
gyroGy = applyDeadZoneBipolar(g.betaNorm, 0.06);
```

Dead zone: **0.06**

### F. FreezeRelease.tsx (Section F)

**Current code (around line 638):**
```typescript
gyroGx = (g.gammaNorm - 0.5) * 2;
gyroGy = (g.betaNorm - 0.5) * 2;
```

**Change to:**
```typescript
gyroGx = applyDeadZoneBipolar(g.gammaNorm, 0.05);
gyroGy = applyDeadZoneBipolar(g.betaNorm, 0.05);
```

Dead zone: **0.05** (lighter touch — freeze/release benefits from subtle tilt influence on burst direction)

**Also check line 666-667** for the burst aim vector — apply the same dead zone there.

### G. Rain.tsx (Section G)

**Current code (around line 309 and 327):**
```typescript
// Density
return MIN_DENSITY + Math.max(0, (betaT - 0.3) / 0.7) * (MAX_DENSITY - MIN_DENSITY);
// Wind
return (g.gammaNorm - 0.5) * 2 * WIND_FORCE;
```

**Change density to use dead-zoned betaNorm:**
```typescript
const betaDZ = applyDeadZone(g.betaNorm, 0.05);
const betaT = betaDZ; // or however betaT is derived from betaNorm
```

**Change wind to:**
```typescript
return applyDeadZoneBipolar(g.gammaNorm, 0.05) * WIND_FORCE;
```

Dead zone: **0.05** (wind can be subtle, lower threshold)

---

## Step 4: Verify

1. **Desktop:** Zero behavioral change. Mouse/click interaction works exactly as before.
2. **Mobile (Android):** No toast shown. Gyro works as before but with dead zone — lay phone flat and verify orbs don't drift.
3. **Mobile (iOS):** Toast shown on first visit. Tap grants permission + starts audio. Gyro works with dead zone.
4. **Edge case:** Denied permission → toast stays hidden, gyro values stay at neutral (0.5/0.5). No errors.
5. `npm run build` — zero errors.

---

## Build Order

| Step | Task |
|------|------|
| 1 | Create `lib/gyroUtils.ts` with `applyDeadZone` + `applyDeadZoneBipolar` |
| 2 | Update CollisionChanges.tsx — dead zone + iOS permission |
| 3 | Update PianoSplit.tsx — dead zone + iOS permission |
| 4 | Update GravityWell.tsx — dead zone + iOS permission |
| 5 | Update Flock.tsx — dead zone + iOS permission |
| 6 | Update Magnets.tsx — dead zone + iOS permission |
| 7 | Update FreezeRelease.tsx — dead zone + iOS permission |
| 8 | Update Rain.tsx — dead zone + iOS permission |
| 9 | Test: lay phone flat → no drift on any section |
| 10 | Test: iOS permission flow on all 7 sections |
| 11 | `npm run build` — zero errors |

---

## What NOT to Do

1. **Don't change physics constants.** Only change how gyro input is consumed. Gravity strength, spring constants, etc. stay the same.
2. **Don't add dead zones to mouse input.** Mouse is already precise. Dead zones are only for gyro.
3. **Don't remove existing gyro behavior.** The mapping (gamma → X, beta → Y) stays the same. You're just filtering out the noise near center.
4. **Don't make the toast blocking.** It should overlay the canvas but the experiment should still render behind it.
5. **Don't request gyro permission on desktop.** Only show the toast when `isTouchDevice()` is true AND `permissionState === 'prompt'`.

---

## Builder Notes

**Built:** 2026-04-02
**Commits:** `0a6f56b` (dead zones + iOS permission), `5f8aeef` (toast style match)

### Implementation Details

1. **Shared utility created:** `lib/gyroUtils.ts` with `applyDeadZone()` (returns 0–1) and `applyDeadZoneBipolar()` (returns -1 to +1). Both accept configurable dead zone threshold.

2. **iOS permission integrated into `handleChordPick`:** Rather than relying solely on the toast button, gyro permission is also requested inside each section's `handleChordPick` callback. This covers the case where a user taps the chord dropdown before the toast — one tap grants gyro + starts audio regardless of entry point.

3. **State pattern per section:** Each section gets `showGyroToast` (useState), `gyroRequestedRef` (useRef to prevent double-request), `handleGyroPermission` (useCallback), plus a useEffect watching `isMobile` + `gyro.permissionState`.

4. **Toast CSS shared via module:** All 7 sections import from `CollisionChanges.module.css` which already had their shared styles. Added `.gyroToast` class there — single source of truth.

5. **GravityWell multiplier adjustment:** The spec noted the multiplier changes from `* 160` / `* 120` to `* 80` / `* 60` because `applyDeadZoneBipolar` already returns -1 to 1 (the old code used `(norm - 0.5) * 160` which gave ±80px). New code: `applyDeadZoneBipolar(...) * 80` — same effective range.

### Deviations

| # | Spec Said | Builder Did | Why |
|---|-----------|-------------|-----|
| 1 | Toast CSS: `background: rgba(0,0,0,0.7)`, solid border, no blur | Used ThreeBody design: `rgba(214,197,171,0.12)` + `backdrop-filter: blur(8px)` | User requested matching Giant Steps B toast appearance — translucent warm tint instead of opaque dark |
| 2 | Use `isTouchDevice()` for toast condition | Used `isMobile` state (from existing `isMobileViewport()`) | Every section already had `isMobile` state derived from `isMobileViewport()` — reused existing pattern rather than introducing a second mobile check |
| 3 | Spec suggested separate toast handler only | Also added permission request inside `handleChordPick` | Covers the case where user interacts with chord dropdown before noticing the toast — permission is granted on any first user gesture |

### Lessons Learned

1. **Hook ordering matters in React.** `handleGyroPermission` depends on `handleAudioStart`, so it must be declared after it. Initial placement before `handleAudioStart` would have caused a reference error.
2. **`useCallback` dependency arrays need `gyro`** when accessing `gyro.permissionState` inside the callback. Easy to miss since `gyro` is a hook return value, not a prop.
3. **Rain.tsx uses `applyDeadZone` (0–1 range)** for density mapping, not `applyDeadZoneBipolar`, because density is derived from betaNorm directly (not centered around zero). The wind mapping uses bipolar as expected.
| | | | |
