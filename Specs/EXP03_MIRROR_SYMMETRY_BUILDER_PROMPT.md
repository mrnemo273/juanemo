# EXP-03 Section D: Mirror Symmetry — Builder Prompt

**Read first:** `Specs/EXP03_GIANT_STEPS.md` (full spec with harmonic system, builder realities)
**Depends on:** Shared infrastructure from Section A is BUILT — `giantStepsChordData.ts`, `useGiantStepsProgression.ts`, `types.ts`, `GiantStepsSwitch.tsx`

### Section A — As Built (Context for Your Build)

Section A shipped with significant creative deviations. Key things that affect you:

1. **No orbs in Section A.** The builder replaced orbs with a dynamic chord triangle. **Your section IS orb-based** (7 real + 14 mirrors) — this is the right call for Mirror Symmetry.
2. **Custom sax engine exists** (`saxEngine.ts`). Imports: `initSaxEngine`, `playSaxNote(freq, velocity)`, `setSaxDecay(val)`, `setSaxReverb(val)`, `disposeSax`. Tenor sax timbre. You may reuse this or use `audioEngine.ts` — your call.
3. **Volume control in context.** `ExperimentControlsContext` now has `volume` (0–1). Synced to `Tone.getDestination().volume`. You get this for free.
4. **`setMetronomeVolume(db)` exists** in `audioEngine.ts`. Set your own level.
5. **BPM slider pattern.** Section A uses a range input (80–320). Follow this pattern.

---

## What You're Building

A kaleidoscopic visualization where everything has three-fold rotational symmetry — because 12 ÷ 3 = 4, and Coltrane divided the octave into three equal major-third intervals. Each note spawns 3 mirrored orbs at 120° intervals. When the progression resolves to a key center, the mirrors briefly converge into a unified form before splitting again.

---

## Existing Architecture

### Files You'll Create
- `components/experiments/GiantSteps/MirrorSymmetry.tsx` — Section D

### Files You'll Modify
- `components/experiments/GiantSteps/GiantStepsSwitch.tsx` — add `activeSection === 3`

### Reference Files
- `components/experiments/GiantSteps/GiantSteps.tsx` — canvas/RAF/audio pattern
- `components/experiments/GiantSteps/giantStepsChordData.ts` — progression, KEY_CENTER_COLORS
- `components/experiments/GiantSteps/useGiantStepsProgression.ts` — progression hook
- `components/experiments/CollisionChanges/audioEngine.ts` — shared audio

---

## Key Concept: Real Orbs vs. Mirrors

Only **7 orbs are real** — they have physics, respond to forces, and generate audio. Each real orb has **2 mirror copies** rendered at 120° and 240° rotation from the canvas center. This gives **21 visible orbs** total, but only 7 are computed.

```
Real orb at angle θ from center:
  Mirror 1: angle θ + 120°
  Mirror 2: angle θ + 240°
```

Mirrors are purely visual — they don't collide, don't generate audio, and don't have independent velocity.

---

## Step 1: Mirror Computation

```typescript
const MIRROR_ANGLES = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]; // 0°, 120°, 240°

function getMirrorPositions(
  realX: number,
  realY: number,
  cx: number,
  cy: number,
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const dx = realX - cx;
  const dy = realY - cy;

  for (const angle of MIRROR_ANGLES) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    positions.push({
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    });
  }

  return positions; // [0] = real position, [1] = mirror at 120°, [2] = mirror at 240°
}
```

### Symmetry Axis Rotation

The symmetry axis (the 0° reference) rotates slowly for visual motion, and the user can control it:

```typescript
const axisRotationRef = useRef(0);  // radians
const AUTO_ROTATE_SPEED = 0.5 * (Math.PI / 180);  // 0.5°/sec converted to rad

// In RAF loop:
axisRotationRef.current += AUTO_ROTATE_SPEED * dt * 0.001;  // dt is in ms

// Apply rotation to mirror computation:
function getMirrorPositionsRotated(
  realX: number,
  realY: number,
  cx: number,
  cy: number,
  axisRotation: number,
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const dx = realX - cx;
  const dy = realY - cy;

  for (const baseAngle of MIRROR_ANGLES) {
    const angle = baseAngle + axisRotation;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    positions.push({
      x: cx + dx * cos - dy * sin,
      y: cy + dx * sin + dy * cos,
    });
  }

  return positions;
}
```

---

## Step 2: Real Orb Physics

Real orbs move with simple forces. They drift toward the sector associated with the active key center.

```typescript
// Sector definitions: canvas divided into 3 equal sectors
// Each sector is a 120° wedge from center
// B sector: centered at 0° (top), G sector: 120° (bottom-right), Eb sector: 240° (bottom-left)
// Adjusted by axisRotation

const SECTOR_ANGLES: Record<KeyCenter, number> = {
  B: 0,
  G: (2 * Math.PI) / 3,
  Eb: (4 * Math.PI) / 3,
};

function getSectorTargetPosition(
  key: KeyCenter,
  cx: number,
  cy: number,
  axisRotation: number,
): { x: number; y: number } {
  const angle = SECTOR_ANGLES[key] + axisRotation - Math.PI / 2; // -90° so B is top
  const dist = Math.min(canvasW, canvasH) * 0.18; // 18% of min dimension from center
  return {
    x: cx + Math.cos(angle) * dist,
    y: cy + Math.sin(angle) * dist,
  };
}

// Physics per real orb:
const SECTOR_SPRING = 0.01;
const REPULSION = 200;      // inter-orb repulsion (prevent overlap)
const REPULSION_DIST = 60;
const ORB_DAMPING = 0.97;

for (const orb of realOrbs) {
  const target = getSectorTargetPosition(activeKeyCenter, cx, cy, axisRotationRef.current);

  // Spring toward active sector
  orb.vx += (target.x - orb.x) * SECTOR_SPRING;
  orb.vy += (target.y - orb.y) * SECTOR_SPRING;

  // Inter-orb repulsion
  for (const other of realOrbs) {
    if (other.id === orb.id) continue;
    const dx = orb.x - other.x;
    const dy = orb.y - other.y;
    const dist = Math.hypot(dx, dy);
    if (dist < REPULSION_DIST && dist > 0) {
      const force = REPULSION / (dist * dist);
      orb.vx += (dx / dist) * force * 0.01;
      orb.vy += (dy / dist) * force * 0.01;
    }
  }

  orb.vx *= ORB_DAMPING;
  orb.vy *= ORB_DAMPING;

  orb.x += orb.vx * dt;
  orb.y += orb.vy * dt;
}
```

---

## Step 3: Alignment Event

When a tonic chord (Imaj7) resolves, trigger an alignment event where all mirrors converge to center.

```typescript
interface AlignmentEvent {
  startTime: number;
  phase: 'converge' | 'unison' | 'split';
  keCenter: KeyCenter;
}

const CONVERGE_DURATION = 200;   // ms
const UNISON_DURATION = 100;     // ms
const SPLIT_DURATION = 300;      // ms
const TOTAL_ALIGNMENT = CONVERGE_DURATION + UNISON_DURATION + SPLIT_DURATION; // 600ms

// On tonic resolution:
function triggerAlignment(key: KeyCenter) {
  alignmentRef.current = {
    startTime: Date.now(),
    phase: 'converge',
    keyCenter: key,
  };

  // Play unison chord (all 7 notes at once)
  if (controlsRef.current.soundEnabled) {
    const chord = GIANT_STEPS_PROGRESSION[indexRef.current];
    // Slight delay to sync with convergence visual
    setTimeout(() => {
      playChordStrum(chord.notes, chord.frequencies);
    }, CONVERGE_DURATION);
  }

  // Canvas flash
  canvasFlashRef.current = 0.15;
}
```

### Alignment Rendering

During an alignment event, the mirror computation changes:

```typescript
function getAlignmentMirrorPositions(
  realX: number,
  realY: number,
  cx: number,
  cy: number,
  axisRotation: number,
  alignmentProgress: number,  // 0 = normal, 1 = fully converged
): { x: number; y: number }[] {
  const normalPositions = getMirrorPositionsRotated(realX, realY, cx, cy, axisRotation);

  // During alignment, lerp all positions toward the real orb's position
  // (which is normalPositions[0])
  return normalPositions.map((pos, i) => {
    if (i === 0) return pos;  // real orb stays put
    return {
      x: pos.x + (normalPositions[0].x - pos.x) * alignmentProgress,
      y: pos.y + (normalPositions[0].y - pos.y) * alignmentProgress,
    };
  });
}

// In RAF loop:
let alignmentProgress = 0;
const alignment = alignmentRef.current;
if (alignment) {
  const age = Date.now() - alignment.startTime;

  if (age < CONVERGE_DURATION) {
    // Converge: 0 → 1
    const t = age / CONVERGE_DURATION;
    alignmentProgress = t * t; // ease-in (quadratic)
  } else if (age < CONVERGE_DURATION + UNISON_DURATION) {
    // Unison: stay at 1
    alignmentProgress = 1;
  } else if (age < TOTAL_ALIGNMENT) {
    // Split: 1 → 0
    const t = (age - CONVERGE_DURATION - UNISON_DURATION) / SPLIT_DURATION;
    alignmentProgress = 1 - (t * t * t); // ease-out cubic
  } else {
    alignmentRef.current = null;
    alignmentProgress = 0;
  }
}
```

### Unison Flash

During the unison moment (all mirrors overlapping):

```typescript
if (alignment && age >= CONVERGE_DURATION && age < CONVERGE_DURATION + UNISON_DURATION) {
  // Bright flash at each real orb position
  for (const orb of realOrbs) {
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.radius * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#E8DED1';  // bone
    ctx.globalAlpha = 0.4;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
```

---

## Step 4: Sector Lines

Three faint lines from center to canvas edges, dividing the canvas into thirds:

```typescript
function renderSectorLines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  axisRotation: number,
  activeKey: KeyCenter,
) {
  const maxDist = Math.max(canvasW, canvasH);

  for (const key of ['B', 'G', 'Eb'] as KeyCenter[]) {
    const angle = SECTOR_ANGLES[key] + axisRotation - Math.PI / 2;
    const endX = cx + Math.cos(angle) * maxDist;
    const endY = cy + Math.sin(angle) * maxDist;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = KEY_CENTER_COLORS[key];
    ctx.globalAlpha = key === activeKey ? 0.12 : 0.04;
    ctx.lineWidth = 0.5;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
```

### Sector Tinting

Very subtle color wash per sector:

```typescript
function renderSectorTint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  axisRotation: number,
  activeKey: KeyCenter,
) {
  for (const key of ['B', 'G', 'Eb'] as KeyCenter[]) {
    const startAngle = SECTOR_ANGLES[key] + axisRotation - Math.PI / 2 - Math.PI / 3;
    const endAngle = startAngle + (2 * Math.PI) / 3;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, Math.max(canvasW, canvasH), startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = KEY_CENTER_COLORS[key];
    ctx.globalAlpha = key === activeKey ? 0.02 : 0.005;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
```

---

## Step 5: Orb Rendering

```typescript
function renderOrbs(
  ctx: CanvasRenderingContext2D,
  realOrbs: MirrorParticle[],
  cx: number,
  cy: number,
  axisRotation: number,
  alignmentProgress: number,
) {
  for (const orb of realOrbs) {
    const positions = getAlignmentMirrorPositions(
      orb.x, orb.y, cx, cy, axisRotation, alignmentProgress,
    );

    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const isReal = i === 0;

      // Orb fill
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, orb.radius, 0, Math.PI * 2);
      ctx.fillStyle = orb.color;
      ctx.globalAlpha = isReal ? 0.3 : 0.15;  // mirrors are dimmer
      ctx.fill();

      // Orb stroke
      ctx.strokeStyle = orb.color;
      ctx.globalAlpha = isReal ? 0.7 : 0.35;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Note label (only on larger orbs)
      if (orb.radius >= 20) {
        ctx.fillStyle = '#E8DED1';
        ctx.globalAlpha = isReal ? 0.6 : 0.25;
        ctx.font = `${Math.round(orb.radius * 0.4)}px Georgia`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(orb.note.replace(/\d/, ''), pos.x, pos.y);
      }

      ctx.globalAlpha = 1;
    }
  }
}
```

---

## Step 6: Interaction

### Mouse Angle → Symmetry Axis Rotation (Desktop)

```typescript
// Mouse angle from center rotates the symmetry axis
const mouseAngle = Math.atan2(cursorY - cy, cursorX - cx);
// Smooth lerp
axisRotationRef.current += (mouseAngle - axisRotationRef.current) * 0.05 * dt;
```

### Mouse Distance → Convergence (Desktop)

```typescript
// Closer to center = mirrors pull inward (partial alignment)
const mouseDist = Math.hypot(cursorX - cx, cursorY - cy);
const maxDist = Math.min(canvasW, canvasH) * 0.4;
const mouseConvergence = Math.max(0, 1 - mouseDist / maxDist);  // 0 (far) → 1 (at center)
// Use as a multiplier on alignmentProgress if no active alignment event
if (!alignmentRef.current) {
  alignmentProgress = mouseConvergence * 0.5;  // cap at 50% convergence from mouse
}
```

### Mobile: Tilt

```typescript
// Gamma → axis rotation
const gammaAngle = (orientation.gammaNorm - 0.5) * Math.PI;  // -π/2 to π/2
axisRotationRef.current += (gammaAngle - axisRotationRef.current) * 0.05 * dt;

// Beta → convergence
const betaConvergence = Math.max(0, orientation.betaNorm - 0.3) / 0.7;  // 0–1
if (!alignmentRef.current) {
  alignmentProgress = betaConvergence * 0.5;
}
```

### Tap → Force Alignment

```typescript
function handleCanvasTap(x: number, y: number) {
  if (!audioStartedRef.current) {
    handleAudioStart();
    return;
  }

  // Force alignment event
  triggerAlignment(activeKeyCenterRef.current);
}
```

---

## Step 7: Audio

```typescript
const MIN_NOTE_GAP = 100;
const lastNoteTimeRef = useRef(0);

function playMirrorNote(note: string) {
  if (!controlsRef.current.soundEnabled) return;
  const now = Date.now();
  if (now - lastNoteTimeRef.current < MIN_NOTE_GAP) return;
  lastNoteTimeRef.current = now;

  const durations = ['4n', '2n', '1n'];
  const duration = durations[Math.floor(Math.random() * durations.length)];
  playNote(note, duration);
}

// On chord change (any chord, not just key change):
function handleChordChange(chord: GiantStepsChord, idx: number) {
  // Update orb notes + colors
  for (let i = 0; i < realOrbsRef.current.length; i++) {
    const orb = realOrbsRef.current[i];
    orb.note = chord.notes[i % chord.notes.length];
    orb.frequency = chord.frequencies[i % chord.frequencies.length];
    orb.color = KEY_CENTER_COLORS[chord.keyCenter];
  }

  // On tonic: trigger alignment
  if (chord.role === 'tonic') {
    triggerAlignment(chord.keyCenter);
  }
}
```

---

## Step 8: Rendering Order

1. **Sector tints** (lowest layer)
2. **Sector lines** (faint dividers)
3. **Canvas flash overlay** (if active)
4. **Orbs** (real + mirrors, with alignment adjustment)
5. **Unison flash** (during alignment)

---

## Step 9: Overlapping Alignments at High BPM

At 286 BPM, tonic resolutions happen frequently. Alignments (600ms total) may not finish before the next one starts. Handle by simply restarting the alignment:

```typescript
// On new tonic resolution:
// Don't check if alignment is already active — just override
alignmentRef.current = {
  startTime: Date.now(),
  phase: 'converge',
  keyCenter: newKey,
};
// This means at high BPM, mirrors oscillate rapidly — converge/split/converge/split
// This IS the desired behavior: a breathing, pulsing kaleidoscope
```

---

## Step 10: Mobile Scaling

On mobile (≤600px), reduce mirror orb radius:

```typescript
const isMobile = window.innerWidth <= 600;
const orbRadius = isMobile
  ? 16 + Math.random() * 10  // 16–26px
  : 22 + Math.random() * 16; // 22–38px
```

Also, mirrors can be slightly smaller than real orbs on mobile to reduce visual clutter:

```typescript
const mirrorRadiusScale = isMobile ? 0.8 : 1.0;
// In renderOrbs: use orb.radius * (isReal ? 1 : mirrorRadiusScale)
```

---

## Build Order

| Step | Task |
|------|------|
| 1 | Scaffold MirrorSymmetry.tsx — canvas, RAF, controls, audio |
| 2 | Implement mirror position computation (120° rotation) |
| 3 | Sector lines + sector tinting |
| 4 | Initialize 7 real orbs, sector spring physics |
| 5 | Render 21 orbs (7 real + 14 mirrors) |
| 6 | Implement alignment event (converge → unison → split) |
| 7 | Unison flash + canvas flash during alignment |
| 8 | Audio — chord strum on alignment, note duration variety |
| 9 | Interaction — mouse angle → axis rotation, distance → convergence |
| 10 | Mobile tilt interaction |
| 11 | Tap → force alignment |
| 12 | Symmetry axis auto-rotation (0.5°/sec) |
| 13 | Wire GiantStepsSwitch.tsx (activeSection === 3) |
| 14 | Test at 80, 160, 286 BPM. Verify overlapping alignments look good. |
| 15 | `npm run build` — zero errors |

---

## What NOT to Do

1. **Don't run physics on mirror orbs.** Only the 7 real orbs have velocity/forces. Mirrors are computed.
2. **Don't make mirrors identical opacity to real orbs.** Mirrors should be dimmer (50% alpha of real).
3. **Don't skip the auto-rotation.** Without it, the symmetry axis is static and less interesting.
4. **Don't block alignment events.** If a new alignment triggers during an active one, override. Don't queue.
5. **Don't draw hard sector boundaries.** Sector lines are 0.5px at 4–12% opacity. Barely visible.
6. **Don't play audio for mirror orbs.** Only real orbs generate sound.
7. **Don't make convergence instant.** The ease-in converge (200ms) and ease-out split (300ms) create a natural breathing rhythm.
8. **Don't forget `soundEnabled` checks.**
9. **Don't make the canvas flash too bright.** 15% opacity max, decays quickly.
10. **Don't ignore mobile scaling.** 21 orbs at full desktop size will overwhelm a 375px viewport.

---

## Acceptance Criteria

See `Specs/EXP03_GIANT_STEPS.md` — **14 criteria** (GS.D.1–GS.D.14).

---

## Builder Notes

Built 2026-04-02. Shipped in commit 84a08ee.

### Deviations

| # | Spec Said | Builder Did | Why |
|---|-----------|-------------|-----|
| 1 | 7 real orbs + 14 mirrors (3-fold rotational symmetry at 0°/120°/240°) | 7 real orbs + 7 mirrors (bilateral symmetry at 0°/180°) | User clarified with hand-drawn sketch — wanted each spoke line to connect an orb to its mirror on the opposite side of center, not 3 rotational copies |
| 2 | Orbs have spring physics, drift toward active sector with velocity/forces | Orbs at fixed radii, formation angle rotates toward active key center via angular lerp | Rotating kaleidoscope model — orbs stay at fixed distances from center, the whole formation rotates. Per-orb stagger on lerp speed + selfSpin drift for variety |
| 3 | Alignment event: converge → unison → split (mirrors collapse to center) | No convergence/alignment — removed entirely | User explicitly disliked orbs regrouping in the middle ("I don't like it when they regroup in the middle") |
| 4 | Unison flash + canvas flash on resolution | No glow, no flash, no flicker | User wanted clean rendering — "lets remove the glow and the flicker" |
| 5 | Audio: chord strum on alignment, note duration variety | Steel drum spatial audio — distance from center maps to octave (close=2x high/piano, mid=sax, far=0.5x low/bass), triggered by sector boundary crossings | User suggested treating the background "like a steel drum with more notes from the center out" — more dynamic and spatially meaningful |
| 6 | Sector lines from center to edge | Spoke lines pass THROUGH center connecting orb to its mirror on opposite side | User: "the lines look like they connect to the center instead of passing through the center" |
| 7 | Chord name displayed at bottom | No chord name overlay | User requested removal |
| 8 | Orb color = key center color | Orb color determined by which sector the orb is currently in (changes as formation rotates) | More colorful — orbs shift color as they cross sector boundaries |

### Lessons Learned

1. **Bilateral > rotational for this concept.** 180° mirror (orb + reflection through center) reads cleaner than 3-fold rotational copies. Each spoke line connects two orbs, making the symmetry immediately legible.
2. **No convergence/alignment.** User strongly prefers orbs staying at their positions rather than collapsing inward. Fixed radii + rotating formation is more kaleidoscopic.
3. **Clean rendering wins.** No glow, no flash, no pulse scaling. Just fill + stroke at consistent opacity. Less is more.
4. **Steel drum octave mapping.** Distance-from-center → octave is intuitive and creates real tonal diversity. Dotted concentric rings at zone boundaries (t=0.33, t=0.66) help visualize the mapping.
5. **Wider radius range = more variety.** Desktop 35-340px (was 45-240px). Gives outer orbs deep bass and inner orbs bright pings.
6. **Sector crossing as trigger.** Notes triggered when an orb crosses a sector boundary (enters a new key center wedge) — more organic than timed pings or chord-change-only audio.
7. **Root drone adds depth.** Sine wave drone that glides between key centers (B2/G2/Eb3) provides harmonic anchor underneath the steel drum pings.
8. **User communicates visually.** Hand-drawn sketches are the fastest way to resolve spatial/layout questions. Always ask for or expect sketches when the description is ambiguous.
