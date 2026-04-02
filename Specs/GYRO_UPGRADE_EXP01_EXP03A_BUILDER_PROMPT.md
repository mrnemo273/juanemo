# GYRO.1 — EXP-01 Generative Type + EXP-03A Giant Steps Gyro Upgrade — Builder Prompt

**Read first:** `Specs/GYRO_UPGRADE.md` (full spec with dead zone utility, iOS permission pattern, per-experiment values)
**Depends on:** `lib/gyroUtils.ts` must exist (created by EXP-02 gyro upgrade builder, or create it yourself — see spec)

---

## What You're Doing

Adding gyro dead zones and iOS permission handling to:

1. **EXP-01 GenerativeType.tsx** — Sections B (Proximity) and C (Mouse Axes), which map gyro to screen coordinates on mobile
2. **EXP-03A GiantSteps.tsx** — Section A, which maps betaNorm to BPM on mobile

These are lighter touches than EXP-02 because the gyro mappings are simpler.

**This is a surgical upgrade — you are NOT changing visual behavior, typography axes, or audio. Only how gyro input is consumed.**

---

## Step 0: Ensure gyroUtils.ts Exists

If `lib/gyroUtils.ts` doesn't exist yet, create it:

```typescript
export function applyDeadZone(normValue: number, deadZone: number = 0.08): number {
  const centered = normValue - 0.5;
  const abs = Math.abs(centered);
  if (abs <= deadZone) return 0.5;
  const remapped = Math.sign(centered) * (abs - deadZone) / (0.5 - deadZone);
  return 0.5 + remapped * 0.5;
}

export function applyDeadZoneBipolar(normValue: number, deadZone: number = 0.08): number {
  const centered = normValue - 0.5;
  const abs = Math.abs(centered);
  if (abs <= deadZone) return 0;
  return Math.sign(centered) * (abs - deadZone) / (0.5 - deadZone);
}
```

---

## Step 1: GenerativeType.tsx — Section B (SectionPerCharHover / Proximity)

**Current code (around line 672):**
```typescript
applyAxes(g.gammaNorm, g.betaNorm);
```

This maps gyro position to axis values. The function treats the values as normalized screen coordinates.

**Change to:**
```typescript
import { applyDeadZone } from '../../lib/gyroUtils';
// ...
applyAxes(applyDeadZone(g.gammaNorm, 0.04), applyDeadZone(g.betaNorm, 0.04));
```

Dead zone: **0.04** (4%) — typography changes are visual, not audio, so a tighter dead zone is fine. We just want to prevent micro-drift when the phone is "still".

---

## Step 2: GenerativeType.tsx — Section C (SectionPinch / Mouse Axes)

**Current code (around line 424-425):**
```typescript
mx = g.gammaNorm * window.innerWidth;
my = g.betaNorm * window.innerHeight;
```

**Change to:**
```typescript
mx = applyDeadZone(g.gammaNorm, 0.04) * window.innerWidth;
my = applyDeadZone(g.betaNorm, 0.04) * window.innerHeight;
```

Dead zone: **0.04**

---

## Step 3: GenerativeType.tsx — iOS Permission

GenerativeType has a different interaction model than the canvas experiments — there's no "tap to start audio" pattern (audio auto-plays based on section). But gyro permission still needs a user gesture on iOS.

**Option A (preferred):** The existing `handleAudioStart` or section mount logic. Check if there's already a tap handler that could incorporate `gyro.requestPermission()`.

**Option B:** Add a toast overlay to the container `<div>` that appears when `gyro.permissionState === 'prompt'` and `isTouchDevice()`. Tap it → `requestPermission()` → hide toast. Style it to match the experiment's DUN-on-dark aesthetic.

Look at how audio initialization currently works in GenerativeType. The key requirement is: on iOS, the first user tap must call both `Tone.start()` and `gyro.requestPermission()`.

---

## Step 4: GiantSteps.tsx — BPM from betaNorm

**Current code (around line 325):**
```typescript
const newBpm = Math.round(80 + g.betaNorm * 240);
```

**Change to:**
```typescript
import { applyDeadZone } from '../../lib/gyroUtils';
// ...
const newBpm = Math.round(80 + applyDeadZone(g.betaNorm, 0.10) * 240);
```

Dead zone: **0.10** (10%) — wider dead zone because BPM jumps are very noticeable. Phone should be able to rest on a table without BPM wandering.

---

## Step 5: GiantSteps.tsx — iOS Permission

GiantSteps has a canvas tap handler that starts audio. Modify it to also request gyro permission:

**In the existing tap/click handler:**
```typescript
// Before or alongside Tone.start():
if (gyro.permissionState === 'prompt') {
  await gyro.requestPermission();
}
```

If there's already a toast or startup pattern in GiantSteps, integrate with that.

---

## Build Order

| Step | Task |
|------|------|
| 1 | Ensure `lib/gyroUtils.ts` exists |
| 2 | Update GenerativeType.tsx Section B — dead zone (0.04) |
| 3 | Update GenerativeType.tsx Section C — dead zone (0.04) |
| 4 | Add iOS permission flow to GenerativeType.tsx |
| 5 | Update GiantSteps.tsx — BPM dead zone (0.10) |
| 6 | Add iOS permission to GiantSteps.tsx tap handler |
| 7 | Test: lay phone flat → typography axes don't drift, BPM stays stable |
| 8 | Test: iOS permission flow on both experiments |
| 9 | `npm run build` — zero errors |

---

## What NOT to Do

1. **Don't change axis ranges or BPM range.** Only filter the gyro input noise.
2. **Don't add dead zones to mouse/touch input.** Those are already precise.
3. **Don't break existing desktop behavior.** Mouse-driven sections should be completely unaffected.
4. **Don't modify `useDeviceOrientation.ts`.** The BUG-1 fix is already there. Dead zones are applied at the consumption site, not in the hook.
5. **Don't make the dead zone too aggressive on GenerativeType.** 4% is enough to kill jitter without making the typography feel unresponsive.

---

## Builder Notes

**Built:** 2026-04-02

### Implementation Details

1. **GenerativeType sections B and C** each have their own `useDeviceOrientation()` hook (they're separate function components). Dead zone applied via `applyDeadZone(norm, 0.04)` at the consumption sites — Section B in the gyro RAF loop, Section C in the position calculation.

2. **GenerativeType iOS permission:** Added toast overlay to both Section B and Section C renders. Each section gets its own `showGyroToast` state, `gyroRequestedRef`, and `handleGyroPermission` callback. Toast uses the same translucent/blur design as EXP-02 and ThreeBody. Added `.gyroToast` class to `GenerativeType.module.css`.

3. **GiantSteps BPM dead zone:** `applyDeadZone(g.betaNorm, 0.10)` wraps the betaNorm before the BPM calculation. The 10% dead zone means the phone can rest at any angle without BPM wandering — only intentional tilts change tempo.

4. **GiantSteps iOS permission:** Integrated into the existing canvas `handleTouchStart` listener (uses `gyroRef.current` since it's inside a useEffect). Also added to the BPM slider's `onTouchStart` handler as a fallback entry point.

5. **No toast needed for GiantSteps A:** The canvas already has a tap-to-start pattern — first touch calls `handleAudioStart()` and now also requests gyro permission. No visual toast required since the user must tap the canvas anyway.

### Deviations

| # | Spec Said | Builder Did | Why |
|---|-----------|-------------|-----|
| 1 | GenerativeType: "Option A — check if there's already a tap handler" | Used Option B (toast overlay) for both sections | Neither section B nor C has a tap-to-start pattern — they're pure typography with no audio init gesture. Toast is the only way to get a user gesture for iOS permission |
| 2 | GiantSteps: "add toast or startup pattern" | No toast — integrated into existing touchstart handler | GiantSteps already requires a canvas tap to start audio, so piggybacking permission request on that gesture is cleaner than adding a toast |
