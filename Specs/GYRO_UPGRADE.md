# GYRO.1: Gyro Dead Zone + iOS Permission — Upgrade Spec

**Status:** 🟢 COMPLETE — all 10 gyro-using components upgraded
**Discovered in:** EXP-03B Three-Body builder
**Last Updated:** 2026-04-02

---

## Background

The Three-Body builder (EXP-03B) implemented a superior gyro interaction pattern:

1. **Dead zone (8%)** — tilt must exceed ~5° from level before any response. Prevents jitter from small hand movements. Without it, all gyro-driven values wobble constantly.
2. **iOS permission toast** — centered "Tap to enable motion control" button that requests `DeviceOrientationEvent.requestPermission()` on iOS. On Android, just starts audio. Without this, **iOS users get zero gyro input** because the permission is never requested.
3. **Lerped transitions** — gyro-driven values change smoothly, not with raw frame-to-frame noise.

**BUG-1 (already fixed):** The shared `useDeviceOrientation.ts` hook was dropping the listener after iOS permission grant. The auto-attach effect only re-started for `'not-required'`, not `'granted'`. This is now fixed — all experiments benefit automatically. But per-experiment dead zones and iOS permission UI still need to be added.

---

## Current State Audit

| Experiment | Component | Gyro Mapping | Dead Zone | iOS Permission UI |
|-----------|-----------|-------------|-----------|-------------------|
| EXP-01 | GenerativeType (Section B: Proximity) | gammaNorm → mouse X, betaNorm → mouse Y | 0.04 | Toast |
| EXP-01 | GenerativeType (Section C: Mouse Axes) | gammaNorm → mouse X, betaNorm → mouse Y | 0.04 | Toast |
| EXP-02A | CollisionChanges.tsx | gamma/beta → gravity X/Y | 0.06 | Toast + chord dropdown |
| EXP-02B | PianoSplit.tsx | gamma/beta → gravity X/Y | 0.06 | Toast + chord dropdown |
| EXP-02C | GravityWell.tsx | gamma → center X offset (±80px), beta → center Y offset (±60px) | 0.08 | Toast + chord dropdown |
| EXP-02D | Flock.tsx | gamma/beta → directional force X/Y | 0.06 | Toast + chord dropdown |
| EXP-02E | Magnets.tsx | gamma/beta → gravity X/Y | 0.06 | Toast + chord dropdown |
| EXP-02F | FreezeRelease.tsx | gamma/beta → tilt force + burst aim vector | 0.05 | Toast + chord dropdown |
| EXP-02G | Rain.tsx | beta → spawn density, gamma → wind force | 0.05 | Toast + chord dropdown |
| EXP-03A | GiantSteps.tsx | betaNorm → BPM (80–320) | 0.10 | Canvas touchstart + slider |
| EXP-03B | ThreeBody.tsx | beta/gamma → three-body forces | 0.08 | Toast (original) |

**All experiments now have dead zones + iOS permission handling.**

---

## What Needs to Change

### 1. Dead Zone Helper (shared utility)

Add to `useDeviceOrientation.ts` or a new `lib/gyroUtils.ts`:

```typescript
/**
 * Apply dead zone to a normalized 0–1 gyro value.
 * Returns 0 when within dead zone of center (0.5),
 * otherwise remaps the remaining range to full 0–1.
 */
export function applyDeadZone(normValue: number, deadZone: number = 0.08): number {
  const centered = normValue - 0.5; // -0.5 to 0.5
  const abs = Math.abs(centered);
  if (abs <= deadZone) return 0.5; // dead zone → return center
  // Remap remaining range to full 0–1
  const remapped = Math.sign(centered) * (abs - deadZone) / (0.5 - deadZone);
  return 0.5 + remapped * 0.5; // back to 0–1
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

### 2. iOS Permission Toast (shared component or pattern)

Each experiment that uses gyro on mobile needs a one-time tap target to trigger `requestPermission()`. The Three-Body pattern:

```typescript
// State
const [showGyroToast, setShowGyroToast] = useState(false);
const gyro = useDeviceOrientation();

// On mount — show toast if iOS permission needed
useEffect(() => {
  if (gyro.permissionState === 'prompt' && isTouchDevice()) {
    setShowGyroToast(true);
  }
}, [gyro.permissionState]);

// Handler
async function handleGyroPermission() {
  const result = await gyro.requestPermission();
  setShowGyroToast(false);
  // Also start audio if needed
  if (result === 'granted' || result === 'not-required') {
    handleAudioStart();
  }
}

// Render — centered toast over canvas
{showGyroToast && (
  <button
    className={styles.gyroToast}
    onClick={handleGyroPermission}
  >
    Tap to enable motion control
  </button>
)}
```

CSS for the toast:
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

### 3. Per-Experiment Dead Zone Values

Different experiments may benefit from different dead zone sizes:

| Use Case | Recommended Dead Zone | Rationale |
|----------|----------------------|-----------|
| Gravity/tilt (EXP-02 A/B/D/E) | 0.06 (6%) | Gravity should respond to intentional tilt but ignore table vibration |
| Positional offset (EXP-02C GravityWell) | 0.08 (8%) | Well position shouldn't drift from micro-movements |
| Wind/force (EXP-02F/G) | 0.05 (5%) | Lighter touch — wind can be subtle |
| BPM control (EXP-03A) | 0.10 (10%) | BPM shouldn't change from small hand movements — wider dead zone |
| Axis mapping (EXP-01 B/C) | 0.04 (4%) | Typography axis changes are visual, not audio — tighter dead zone OK |

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| GY.1 | `applyDeadZone()` and `applyDeadZoneBipolar()` functions exist in shared utility |
| GY.2 | All 10 gyro-using components apply dead zone to gyro values |
| GY.3 | iOS permission toast appears on first visit (iOS only) on all gyro experiments |
| GY.4 | After granting permission, toast disappears and gyro input works immediately |
| GY.5 | Android/desktop: no toast shown (gyro just works or isn't available) |
| GY.6 | At rest on a flat surface, all gyro-driven values stay at their neutral position (no jitter) |
| GY.7 | No behavioral change on desktop (mouse interaction unaffected) |
| GY.8 | `npm run build` — zero errors |
