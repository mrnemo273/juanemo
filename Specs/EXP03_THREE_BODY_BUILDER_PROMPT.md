# EXP-03 Section B: Three-Body Problem — Builder Prompt

**Read first:** `Specs/EXP03_GIANT_STEPS.md` (full spec with harmonic system, builder realities)
**Depends on:** Section A shared infrastructure is BUILT — `giantStepsChordData.ts`, `useGiantStepsProgression.ts`, `types.ts`, `GiantStepsSwitch.tsx`

### Section A — As Built (Context for Your Build)

Section A shipped with significant creative deviations. Key things that affect you:

1. **No orbs in Section A.** The builder replaced orbs with a dynamic chord triangle (root/3rd/7th vertices on the circle of fifths). **Section B IS orb-based** — the three-body concept requires free-flying particles. You ARE building orbs.
2. **Custom sax engine exists** (`saxEngine.ts`). Imports: `initSaxEngine`, `playSaxNote(freq, velocity)`, `setSaxDecay(val)`, `setSaxReverb(val)`, `disposeSax`. Uses `fatsawtooth` → distortion → peaking EQ → lowpass → delay → reverb. Sounds like a tenor sax. You may reuse this or use the shared `audioEngine.ts` — your call.
3. **Volume control in context.** `ExperimentControlsContext` now has `volume` (0–1). Section A syncs it to `Tone.getDestination().volume` via `20 * Math.log10(volume)` dB. You get this for free — just read `volume` from context if needed.
4. **`setMetronomeVolume(db)` exists** in `audioEngine.ts`. Section A sets it to -30dB. Set your own level.
5. **BPM slider pattern.** Section A uses a range input (80–320) for BPM. You should follow this pattern (not mouse-Y-to-tempo).
6. **Staggered note playback.** Section A plays root→3rd→7th as a rising sequence with BPM-adaptive stagger. You can use simultaneous or staggered — whatever fits the three-body physics.

---

## What You're Building

Three gravitational attractors arranged in a triangle — one per tonal center (B, G, E♭). Seven orbs in perpetual flight between wells. At slow tempo, orbs settle into near-stable orbits. At Giant Steps tempo (~286 BPM), orbs are always mid-flight — the "three-body problem" that's famously unsolvable. Tempo is the chaos dial.

---

## Existing Architecture

### Files You'll Create
- `components/experiments/GiantSteps/ThreeBody.tsx` — Section B

### Files You'll Modify
- `components/experiments/GiantSteps/GiantStepsSwitch.tsx` — add `activeSection === 1`

### Reference Files
- `components/experiments/GiantSteps/GiantSteps.tsx` — Section A (canvas/RAF/audio pattern for this experiment)
- `components/experiments/GiantSteps/giantStepsChordData.ts` — progression, KEY_CENTER_COLORS, KEY_CENTER_ANGLES
- `components/experiments/GiantSteps/useGiantStepsProgression.ts` — progression hook
- `components/experiments/CollisionChanges/audioEngine.ts` — `playNote`, `playChordStrum`, metronome
- `lib/ExperimentControlsContext.tsx` — soundEnabled, tempo, etc.
- `lib/useDeviceOrientation.ts` — gyro hook

---

## Key Difference from Section A

Section A uses the **circle of fifths layout** — orbs orbit a specific point on a circle. Section B uses **free-space gravity** — three wells pull on all orbs simultaneously, and the orbs fly freely through 2D space. There's no circle rendering. The wells are positioned at triangle vertices but fill the canvas.

---

## Step 1: Scaffold ThreeBody.tsx

Same canvas/RAF pattern as Section A. Strip out circle-of-fifths rendering. You need:
- Canvas + RAF loop
- Chord dropdown + chord label
- Audio hookup (shared audioEngine)
- Gyro hook
- Cursor tracking
- useGiantStepsProgression hook

### Well Positions

```typescript
const WELL_LAYOUT = {
  // Equilateral triangle, centered in canvas, ~60% of min dimension
  positions: (w: number, h: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.3; // 30% of min dimension from center
    return {
      B:  { x: cx + r * Math.cos(-Math.PI / 2),      y: cy + r * Math.sin(-Math.PI / 2) },       // top
      G:  { x: cx + r * Math.cos(Math.PI / 6),        y: cy + r * Math.sin(Math.PI / 6) },         // bottom-right
      Eb: { x: cx + r * Math.cos(5 * Math.PI / 6),    y: cy + r * Math.sin(5 * Math.PI / 6) },     // bottom-left
    };
  },
};
```

---

## Step 2: Gravity System

```typescript
const G_ACTIVE = 0.8;
const G_INACTIVE = 0.15;
const MAX_FORCE = 2.0;      // cap to prevent singularity
const MAX_SPEED = 6.0;       // px/frame cap
const DAMPING = 0.998;        // very low — maintain energy
const MIN_DISTANCE = 20;      // prevent divide-by-zero

// Track gravity strength per well (for smooth transitions)
const wellStrengthRef = useRef<Record<KeyCenter, number>>({
  B: G_ACTIVE,  // start with B active
  G: G_INACTIVE,
  Eb: G_INACTIVE,
});

// On key change: ramp gravity values
function handleKeyChange(newKey: KeyCenter, prevKey: KeyCenter) {
  // New well ramps up fast (100ms)
  // Old well ramps down slower (200ms)
  // (Smooth ramp handled in RAF loop via lerp)
  targetStrengthsRef.current = {
    B:  newKey === 'B'  ? G_ACTIVE : G_INACTIVE,
    G:  newKey === 'G'  ? G_ACTIVE : G_INACTIVE,
    Eb: newKey === 'Eb' ? G_ACTIVE : G_INACTIVE,
  };
}

// In RAF loop — update well strengths via lerp:
for (const key of ['B', 'G', 'Eb'] as KeyCenter[]) {
  const target = targetStrengthsRef.current[key];
  const current = wellStrengthRef.current[key];
  const isActivating = target > current;
  const lerpRate = isActivating ? 0.15 : 0.08;  // faster ramp-up, slower ramp-down
  wellStrengthRef.current[key] = current + (target - current) * lerpRate * dt;
}

// Apply gravity from all 3 wells to each orb:
for (const orb of orbs) {
  let totalFx = 0;
  let totalFy = 0;

  for (const key of ['B', 'G', 'Eb'] as KeyCenter[]) {
    const well = wellPositions[key];
    const dx = well.x - orb.x;
    const dy = well.y - orb.y;
    const dist = Math.max(Math.hypot(dx, dy), MIN_DISTANCE);
    const G = wellStrengthRef.current[key];
    const force = Math.min(G * orb.mass / (dist * dist), MAX_FORCE);
    totalFx += (dx / dist) * force;
    totalFy += (dy / dist) * force;
  }

  orb.vx += totalFx * dt;
  orb.vy += totalFy * dt;
  orb.vx *= DAMPING;
  orb.vy *= DAMPING;

  // Speed cap
  const speed = Math.hypot(orb.vx, orb.vy);
  if (speed > MAX_SPEED) {
    orb.vx = (orb.vx / speed) * MAX_SPEED;
    orb.vy = (orb.vy / speed) * MAX_SPEED;
  }

  orb.x += orb.vx * dt;
  orb.y += orb.vy * dt;
}
```

---

## Step 3: Trail System

Trails are critical. Each orb maintains a position history:

```typescript
interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

const MAX_TRAIL_LENGTH = 120;  // frames of history

// In RAF loop:
for (const orb of orbs) {
  orb.trail.push({ x: orb.x, y: orb.y, time: Date.now() });
  // Trail length scales with BPM — longer at higher tempo
  const maxLen = Math.round(60 + (bpmRef.current / 320) * 120);  // 60–180 points
  while (orb.trail.length > maxLen) orb.trail.shift();
}

// Render trails:
for (const orb of orbs) {
  if (orb.trail.length < 2) continue;
  ctx.beginPath();
  ctx.moveTo(orb.trail[0].x, orb.trail[0].y);
  for (let i = 1; i < orb.trail.length; i++) {
    ctx.lineTo(orb.trail[i].x, orb.trail[i].y);
  }
  ctx.strokeStyle = orb.color;
  // Gradient alpha: oldest = 0, newest = 0.4
  // Can't do per-segment gradient easily, so use single alpha
  ctx.globalAlpha = 0.2;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// For better trail rendering, draw segments with decreasing alpha:
for (const orb of orbs) {
  for (let i = 1; i < orb.trail.length; i++) {
    const t = i / orb.trail.length;  // 0 (oldest) → 1 (newest)
    ctx.beginPath();
    ctx.moveTo(orb.trail[i - 1].x, orb.trail[i - 1].y);
    ctx.lineTo(orb.trail[i].x, orb.trail[i].y);
    ctx.strokeStyle = orb.color;
    ctx.globalAlpha = t * 0.4;  // fade from 0 → 0.4
    ctx.lineWidth = 0.5 + t * 1;  // thin → thick
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
```

**Performance note:** At 180 trail points × 7 orbs = 1260 line segments per frame. This is fine for canvas at 60fps. If there's a performance concern, use the simpler single-stroke approach.

---

## Step 4: Well Rendering

```typescript
function renderWell(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  color: string,
  strength: number,  // current G value (0.15–0.8)
  isActive: boolean,
) {
  const normalizedStrength = (strength - G_INACTIVE) / (G_ACTIVE - G_INACTIVE); // 0–1

  // Core dot
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.5 + normalizedStrength * 0.4;  // 0.5–0.9
  ctx.fill();
  ctx.globalAlpha = 1;

  // Inner ring (30px)
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.08 + normalizedStrength * 0.15;  // 0.08–0.23
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Outer ring (80px)
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 80, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.03 + normalizedStrength * 0.08;  // 0.03–0.11
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Gravity field (radial gradient)
  const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 120);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 120, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.02 + normalizedStrength * 0.03;
  ctx.fill();
  ctx.globalAlpha = 1;
}
```

### Pulse Ring (on key change)

```typescript
interface WellPulse {
  key: KeyCenter;
  startTime: number;
}

// On key change:
wellPulsesRef.current.push({ key: newKey, startTime: Date.now() });

// Render:
for (const pulse of wellPulsesRef.current) {
  const age = Date.now() - pulse.startTime;
  const t = age / 400;  // 400ms
  if (t >= 1) continue;

  const pos = wellPositions[pulse.key];
  const radius = 30 + t * 120;  // expand 30→150px
  const alpha = 0.3 * (1 - t * t);  // quadratic fade

  ctx.beginPath();
  ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = KEY_CENTER_COLORS[pulse.key];
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}
// Clean
wellPulsesRef.current = wellPulsesRef.current.filter(p => Date.now() - p.startTime < 400);
```

---

## Step 5: Orb Initialization

```typescript
function initOrbs(wellPositions: Record<KeyCenter, { x: number; y: number }>): ThreeBodyParticle[] {
  const startWell = wellPositions['B'];
  const chord = GIANT_STEPS_PROGRESSION[0];
  const orbs: ThreeBodyParticle[] = [];

  for (let i = 0; i < 7; i++) {
    const note = chord.notes[i % chord.notes.length];
    const freq = chord.frequencies[i % chord.frequencies.length];
    const angle = (i / 7) * Math.PI * 2;
    const dist = 30 + Math.random() * 50;

    orbs.push({
      id: i,
      x: startWell.x + Math.cos(angle) * dist,
      y: startWell.y + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: 22 + Math.random() * 16,  // 22–38px
      note,
      frequency: freq,
      mass: 1,
      color: KEY_CENTER_COLORS['B'],
      trail: [],
    });
  }
  return orbs;
}
```

### Color Update on Chord Change

When the chord changes, update orb colors to match the current key center. Use a smooth lerp (don't snap):

```typescript
// Track target color per orb
// On chord change: set targetColor = KEY_CENTER_COLORS[newChord.keyCenter]
// In RAF: lerp orb.color toward targetColor
// For simplicity, just snap color — the trail will show the transition
```

---

## Step 6: Audio — Well Proximity Trigger

Orbs play notes when they pass close to a well center:

```typescript
const WELL_AUDIO_RADIUS = 30;  // px
const MIN_NOTE_GAP = 100;  // ms

// In RAF loop, check each orb against each well:
for (const orb of orbs) {
  for (const key of ['B', 'G', 'Eb'] as KeyCenter[]) {
    const well = wellPositions[key];
    const dist = Math.hypot(orb.x - well.x, orb.y - well.y);
    if (dist < WELL_AUDIO_RADIUS) {
      playGiantStepsNote(orb.note);
      // Haptic tick
      if ('vibrate' in navigator) navigator.vibrate(8);
      break;  // only one note per orb per frame
    }
  }
}
```

---

## Step 7: Interaction

### Desktop: Mouse X drags active well

```typescript
// Mouse X shifts the active well horizontally
// This distorts the triangle — creates asymmetric gravity
const activeWell = wellPositions[activeKeyCenter];
const mouseInfluence = 0.3;  // 30% of mouse offset
activeWell.x = basePositions[activeKeyCenter].x + (cursorX - canvasW / 2) * mouseInfluence;
```

### Desktop: Mouse Y → tempo

```typescript
const bpm = 80 + (cursorY / canvasH) * 240;  // 80–320
```

### Mobile: Tilt

```typescript
// Gamma → shift active well position
const gammaOffset = (orientation.gammaNorm - 0.5) * 2 * canvasW * 0.15;
activeWell.x = basePositions[activeKeyCenter].x + gammaOffset;

// Beta → tempo
const bpm = 80 + orientation.betaNorm * 240;
```

### Tap: Temporary Fourth Well

```typescript
interface TempWell {
  x: number;
  y: number;
  startTime: number;
  duration: 3000;  // 3 seconds
}

function handleCanvasTap(x: number, y: number) {
  if (!audioStartedRef.current) {
    handleAudioStart();
    return;
  }

  tempWellsRef.current.push({
    x, y,
    startTime: Date.now(),
    duration: 3000,
  });
}

// In gravity loop, include temp wells:
for (const tw of tempWellsRef.current) {
  const age = Date.now() - tw.startTime;
  if (age > tw.duration) continue;
  const fadeT = age / tw.duration;
  const G = G_INACTIVE * (1 - fadeT);  // fading gravity

  // Apply gravity from temp well to each orb (same formula as permanent wells)
}

// Clean up expired temp wells
tempWellsRef.current = tempWellsRef.current.filter(tw => Date.now() - tw.startTime < tw.duration);
```

---

## Step 8: Edge Handling

Orbs should not escape the canvas. Soft wall bounce:

```typescript
const WALL_PADDING = 20;
const WALL_FORCE = 0.5;

if (orb.x < WALL_PADDING) orb.vx += WALL_FORCE;
if (orb.x > canvasW - WALL_PADDING) orb.vx -= WALL_FORCE;
if (orb.y < WALL_PADDING) orb.vy += WALL_FORCE;
if (orb.y > canvasH - WALL_PADDING) orb.vy -= WALL_FORCE;
```

---

## Step 9: Rendering Order

1. **Gravity field gradients** (lowest layer)
2. **Well rings** (inner + outer)
3. **Orb trails**
4. **Well core dots** + labels (B, G, E♭)
5. **Pulse rings** (key change animations)
6. **Orbs** (filled circles + note labels)
7. **Temporary wells** (if any, with fade)

---

## Step 10: Clear Trails on Dropdown Change

When the user manually selects a chord from the dropdown, clear all trails. This prevents confusing visual history from a jump:

```typescript
function handleDropdownJump(index: number) {
  jumpToChord(index);
  for (const orb of orbsRef.current) {
    orb.trail = [];
  }
}
```

---

## Build Order

| Step | Task |
|------|------|
| 1 | Scaffold ThreeBody.tsx — canvas, RAF, controls, audio init |
| 2 | Position 3 gravity wells in equilateral triangle |
| 3 | Initialize 7 orbs near first well |
| 4 | N-body gravity — all wells pull all orbs simultaneously |
| 5 | Well strength transitions (smooth ramp on key change) |
| 6 | Trail system — per-orb position history, gradient rendering |
| 7 | Well rendering — core dot, rings, radial gradient |
| 8 | Pulse ring on key change |
| 9 | Audio — well proximity trigger + density limiter |
| 10 | Interaction — mouse/tilt → tempo + well position |
| 11 | Tap → temporary fourth well |
| 12 | Edge handling (soft walls) |
| 13 | Wire GiantStepsSwitch.tsx (activeSection === 1) |
| 14 | Test: 80 BPM (stable orbits), 160 BPM (moderate chaos), 286 BPM (full chaos) |
| 15 | `npm run build` — zero errors |

---

## What NOT to Do

1. **No orbital mechanics.** This is NOT Section A's orbit model. Orbs fly freely — only gravity pulls them.
2. **No snap transitions.** Well gravity ramps smoothly. Don't instantly set G_ACTIVE on key change.
3. **No trail clearing on every chord change.** Only clear on dropdown manual jump. Normal progression trails should persist.
4. **No fixed positions.** Orbs are ALWAYS in motion. There's no "resting state" at high tempo.
5. **No orb-to-orb collision.** Orbs pass through each other. Only well gravity matters.
6. **Don't skip the trail system.** Trails are the signature visual of this section. Without them it's just dots bouncing.
7. **Don't make temp wells permanent.** They fade over 3 seconds. The gravity decreases linearly with age.
8. **Don't forget `soundEnabled` checks.** All audio respects the mute toggle.
9. **Don't hard-code well positions.** They scale with canvas dimensions. Recalculate on resize.
10. **Don't skip the speed cap.** Without MAX_SPEED, orbs can escape orbit and leave the canvas.

---

## Acceptance Criteria

See `Specs/EXP03_GIANT_STEPS.md` — **15 criteria** (GS.B.1–GS.B.15).

---

## Builder Notes

### As Built — Major Deviations from Original Spec

The implementation evolved significantly through iterative tuning. The original spec described free-space Cartesian gravity with fixed triangle wells. The final build uses **circle-of-fifths chord-tone targeting** — a fundamentally different approach.

| # | Spec Said | Builder Did | Why |
|---|-----------|-------------|-----|
| 1 | Free-space gravity (Cartesian x/y), wells at fixed triangle vertices | Wells move to **chord tone positions** on the circle of fifths (root, 3rd, 7th) — same layout as Section A | Fixed triangle wells produced repetitive motion to the same 3 spots. Moving wells to chord tones creates variety — each chord produces a different triangle shape. |
| 2 | Inverse-square gravity, spring models, velocity accumulation | **Easing model**: orbs move a fraction of remaining distance per frame (ease-in), clamped to prevent overshoot. No velocity, no springs. | Springs caused oscillation/vibration at the wells. Easing gives clean arrivals with no bouncing. |
| 3 | All orbs move simultaneously toward active well | **Wave-based stagger**: orbs launch in waves (1 per group per wave, 1 beat apart). Each wave hits root+3rd+7th simultaneously = triad. | Simultaneous movement made all orbs clump together. Staggered waves create rhythmic arrivals that sound like actual triads. |
| 4 | Audio: well proximity trigger (play note when near well center) | **Harmonic filtering**: chord tones at full velocity (group-based duration: root=1n, 3rd=2n, 7th=4n), scale tones soft, chromatic notes silent. Bass root on key change. | Random note triggers on all 12 positions sounded dissonant. Filtering to chord/scale tones makes it musical. Group-based durations give each voice character. |
| 5 | Orbs fly freely in 2D space, no circle rendering | **Orbs ride on the circle of fifths ring** (radialOffset=0, orbitRadius=0). Wells also sit on the circle. Gradient triangle connects wells. | Circle layout connects visually to Section A and makes the harmonic movement legible. |
| 6 | Mouse X drags well, tap creates temp 4th well | **Desktop: auto-play** (no mouse interaction). **Mobile: gyro tilt rotates triad** around circle (gammaNorm → ±180° offset on well targets). | Auto-play is more meditative. Gyro rotation on mobile is the unique interactive element. |
| 7 | BPM via mouse Y (desktop) / beta tilt (mobile) | **BPM slider only** (80–320). No gyro BPM on mobile — gyro controls triad rotation instead. | Consistent with Section A. Gyro is better used for the unique rotation mechanic. |
| 8 | 7 orbs, all identical | **3 groups**: root (3 orbs, blue/B), 3rd (2 orbs, green/G), 7th (2 orbs, yellow/Eb). Each group targets its chord tone's well. | Groups create triads. Color-coding matches wells for visual clarity. |
| 9 | Wells have fixed gravity strength that ramps on key change | **Wells lerp to chord positions** (same speed as Section A: 0.18). Settled check: wells+orbs must reach targets → 400ms hold → next chord applies. | Wait-for-settle prevents wells from moving before orbs arrive. Hold time gives breathing room. |

### Key Constants (as tuned)
```
EASE_SPEED = 0.025       // easing rate per frame
MAX_ANGULAR_SPEED = 4.0  // degrees/frame
WELL_LERP = 0.18         // matches Section A
SETTLE_HOLD_MS = 400     // dwell time after orbs settle
NOTE_TRIGGER_THRESHOLD = 6°
NOTE_COOLDOWN_MS = 180
```

### Files created
- `components/experiments/GiantSteps/ThreeBody.tsx` — Section B (circle-of-fifths orb system)

### Files modified
- `components/experiments/GiantSteps/GiantStepsSwitch.tsx` — wired `activeSection === 1`
- `components/experiments/GiantSteps/saxEngine.ts` — added `duration` parameter to `playSaxNote`
- `data/experiments.ts` — added Section B config with updated description/instructions
