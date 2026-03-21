# Builder Prompt — EXP-02 Section E: Magnets

## What You're Building

Add Section E ("Magnets") to the Code Chords experiment. Orbs attract or repel each other based on the musical interval between their notes. Consonant intervals (perfect 5th, octave) attract. Dissonant intervals (tritone, major 7th) repel. When the user picks a new chord and orbs retune, all relationships reshuffle — the spatial arrangement reorganizes.

Fifth section in Code Chords, after Collision Changes (A), Piano Split (B), Gravity Well (C), and Flock (D).

---

## Before You Start

Read these files in order:

| File | Why |
|------|-----|
| `components/experiments/CollisionChanges/GravityWell.tsx` | **Your template.** Simpler than Flock — use this as your starting structure. |
| `components/experiments/CollisionChanges/Flock.tsx` | Reference for grab-and-drag interaction (grabbedIdRef pattern) |
| `components/experiments/CollisionChanges/CodeChordsSwitch.tsx` | Where you register Section E |
| `components/experiments/CollisionChanges/CollisionChanges.tsx` | Section A — chord dropdown, audio hookup patterns |
| `components/experiments/CollisionChanges/audioEngine.ts` | Audio API |
| `components/experiments/CollisionChanges/chordData.ts` | **You'll edit this** — add `noteToMidi()` and `CONSONANCE_TABLE` |
| `components/experiments/CollisionChanges/useChordProgression.ts` | Chord API |
| `components/experiments/CollisionChanges/types.ts` | Particle interface |
| `data/experiments.ts` | Experiment registration |
| `Specs/EXP02_MAGNETS.md` | Full spec |

---

## Critical: Builder Realities from Sections A–D

1. **Chords are user-driven only.** No auto-advance. Custom dropdown, `jumpToChord(index)`.

2. **Audio starts on first chord pick.** `handleAudioStart()` → `initAudio()` → `startMetronome()`.

3. **Custom dropdown** (bone/cream overlay). CSS from `CollisionChanges.module.css`.

4. **Georgia italic chord label.** Canvas-rendered, centered, 6% opacity, 16% flash on chord change.

5. **Pass-through collisions.** Overlapping orbs glow + fire `playDyad()` with 600ms cooldown. No physical bounce velocity exchange. Magnetic forces handle all movement.

6. **Pause when settings open.** `controlsRef.current.paused` skips physics step.

7. **Spawn spring animation.** `spawnScale = 1 - 0.7 * exp(-6t) * cos(t * π * 2.5)` over 250ms.

8. **Viewport-responsive orb sizing.** `updateLocalOrbSizes()` — duplicate locally (same as Sections C and D).

9. **No hint text.** Empty strings for hints.

10. **Mono synth path.** `playDyad`, `playNote`, `playChordStrum`.

11. **Chord strum on selection.** Arpeggiated, 70ms stagger.

12. **Metronome.** Start on first chord pick, tempo/TS from controls, stop on unmount.

13. **NOTE_COLORS map.** Direct note→hex mapping (same as Sections C and D).

14. **Grab-and-drag pattern.** Section D (Flock) uses `grabbedIdRef`, lerp-toward-cursor, and release. Magnets uses the same pattern but with different semantics: you're overriding magnetic repulsion to force dissonant pairs together. Reference `Flock.tsx` lines 838–895 for the mouse/touch event handling.

---

## Step 1: Add noteToMidi and CONSONANCE_TABLE to chordData.ts

Add these as exports to the bottom of `chordData.ts`:

```typescript
/** Convert note string (e.g. "C4", "Bb3") to MIDI number */
export function noteToMidi(note: string): number {
  const NOTES: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  };
  const match = note.match(/^([A-G])(#|b)?(\d)$/);
  if (!match) return 60;
  const [, letter, accidental, octaveStr] = match;
  let midi = NOTES[letter] + (parseInt(octaveStr) + 1) * 12;
  if (accidental === '#') midi++;
  if (accidental === 'b') midi--;
  return midi;
}

/** Consonance rating per interval (semitones mod 12). 0 = maximally dissonant, 12 = maximally consonant. */
export const CONSONANCE_TABLE: Record<number, number> = {
  0: 12,   // Unison / Octave
  1: 1,    // Minor 2nd
  2: 3,    // Major 2nd
  3: 7,    // Minor 3rd
  4: 8,    // Major 3rd
  5: 9,    // Perfect 4th
  6: 0,    // Tritone
  7: 10,   // Perfect 5th
  8: 5,    // Minor 6th
  9: 6,    // Major 6th
  10: 2,   // Minor 7th
  11: 1,   // Major 7th
};
```

---

## Step 2: Create Magnets.tsx

Copy `GravityWell.tsx` as your starting point. Strip orbital physics (KEPLER_K, orbit radii, orbit rings, slingshot). Replace with magnetic force calculation.

### Constants

```typescript
const MAGNET_G = 0.08;        // Magnetic force constant
const DAMPING = 0.995;        // Velocity damping
const MAX_SPEED = 2.5;        // Speed cap (slower than Flock — Magnets is contemplative)
const CURSOR_G_MILD = 0.05;   // Gentle cursor pull when not dragging
const COLLISION_COOLDOWN = 600;
const FORCE_LINE_FLASH_DURATION = 300; // ms — flash on chord change
```

### Magnetic force function

```typescript
import { noteToMidi, CONSONANCE_TABLE } from './chordData';

function magnetForce(a: Particle, b: Particle): {
  fx: number; fy: number; consonance: number; normalizedForce: number;
} {
  const interval = Math.abs(noteToMidi(a.note) - noteToMidi(b.note)) % 12;
  const consonance = CONSONANCE_TABLE[interval];
  const normalizedForce = (consonance - 6) / 6; // -1 to +1

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const safeDist = Math.max(dist, 30);

  const magnitude = normalizedForce * MAGNET_G / (safeDist * safeDist) * 10000;
  const clampedMag = Math.max(-0.3, Math.min(0.3, magnitude));

  return {
    fx: (dx / safeDist) * clampedMag,
    fy: (dy / safeDist) * clampedMag,
    consonance,
    normalizedForce,
  };
}
```

### Physics step

```typescript
function stepMagnets(
  particles: Particle[],
  dt: number,
  canvasW: number,
  canvasH: number,
  grabbedId: string | null,
  cursorX: number | null,
  cursorY: number | null,
) {
  const cappedDt = Math.min(dt, 3);

  // Magnetic forces between all pairs
  for (let i = 0; i < particles.length; i++) {
    if (particles[i].id === grabbedId) continue;
    for (let j = i + 1; j < particles.length; j++) {
      if (particles[j].id === grabbedId) continue;
      const { fx, fy } = magnetForce(particles[i], particles[j]);
      particles[i].vx += fx * cappedDt;
      particles[i].vy += fy * cappedDt;
      particles[j].vx -= fx * cappedDt;
      particles[j].vy -= fy * cappedDt;
    }
  }

  for (const p of particles) {
    if (p.id === grabbedId) continue; // Grabbed orb handled separately

    // Mild cursor pull (when not dragging)
    if (cursorX !== null && cursorY !== null && !grabbedId) {
      const cdx = cursorX - p.x;
      const cdy = cursorY - p.y;
      const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
      if (cdist > 20 && cdist < 400) {
        p.vx += (cdx / cdist) * CURSOR_G_MILD * cappedDt;
        p.vy += (cdy / cdist) * CURSOR_G_MILD * cappedDt;
      }
    }

    p.vx *= DAMPING;
    p.vy *= DAMPING;

    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > MAX_SPEED) {
      p.vx = (p.vx / speed) * MAX_SPEED;
      p.vy = (p.vy / speed) * MAX_SPEED;
    }

    p.x += p.vx * cappedDt;
    p.y += p.vy * cappedDt;

    // Edge bounce (NOT edge wrapping — orbs must stay visible)
    if (p.x < p.radius) { p.x = p.radius; p.vx *= -0.5; }
    if (p.x > canvasW - p.radius) { p.x = canvasW - p.radius; p.vx *= -0.5; }
    if (p.y < p.radius) { p.y = p.radius; p.vy *= -0.5; }
    if (p.y > canvasH - p.radius) { p.y = canvasH - p.radius; p.vy *= -0.5; }
  }
}
```

### Grabbed orb handling

Same pattern as Flock's `grabbedIdRef`:
- Mousedown/touchstart on an orb sets `grabbedIdRef`
- Mousemove/touchmove lerps grabbed orb toward cursor (lerp 0.25)
- Other orbs still react magnetically to the grabbed orb's position (they attract/repel from wherever you hold it)
- Mouseup/touchend clears `grabbedIdRef` — natural forces resume
- On release of a forced-together dissonant pair: the repulsion pushes them apart dramatically

### Mobile: tap to pin

On mobile, tap toggles a `pinnedId` state. Pinned orb's position is frozen (skip position update in step). Other orbs react to its fixed position. Tap again to unpin.

---

## Step 3: Force Line Rendering

This is the visual signature. In the render loop, BEFORE drawing orbs, draw force lines between all pairs:

```typescript
// Store force data for rendering (calculated during physics step or separately)
interface ForceLine {
  x1: number; y1: number;
  x2: number; y2: number;
  consonance: number;
  normalizedForce: number;
}

// In render:
for (const line of forceLines) {
  const absForce = Math.abs(line.normalizedForce);
  if (absForce < 0.1) continue; // Skip near-neutral pairs

  const isConsonant = line.normalizedForce > 0;
  const baseOpacity = absForce * 0.08; // Max 8% for extreme intervals
  const flashMult = chordFlashActive ? 3.0 : 1.0;
  const opacity = Math.min(baseOpacity * flashMult, 0.24);

  ctx.strokeStyle = isConsonant
    ? `rgba(214, 197, 171, ${opacity})`  // DUN for consonant
    : `rgba(242, 92, 84, ${opacity})`;   // BITTERSWEET for dissonant

  ctx.lineWidth = 1;

  if (isConsonant) {
    // Solid line
    ctx.setLineDash([]);
  } else {
    // Dashed line
    ctx.setLineDash([4, 3]);
  }

  ctx.beginPath();
  ctx.moveTo(line.x1, line.y1);
  ctx.lineTo(line.x2, line.y2);
  ctx.stroke();
}
ctx.setLineDash([]); // Reset
```

### Chord change flash

When the chord changes, set a `forceLineFlashTime` timestamp. For 300ms after, multiply all force line opacities by 3×. This highlights the reshuffle moment.

---

## Step 4: Register

### CodeChordsSwitch.tsx

```typescript
import Magnets from './Magnets';

if (activeSection === 4) return <Magnets />;
```

### data/experiments.ts

Add `'Magnets'` to sections array at index 4. Add section config at index 4.

---

## Build Order

1. **Add `noteToMidi` and `CONSONANCE_TABLE`** to `chordData.ts`
2. **Create `Magnets.tsx`** — copy GravityWell structure, strip orbital physics
3. **Implement magnetic force calculation** — get orbs attracting/repelling based on intervals
4. **Add edge bounce** (not wrapping)
5. **Add force line rendering** — solid DUN for consonant, dashed BITTERSWEET for dissonant
6. **Add chord dropdown** — on pick, retune orbs and watch the reshuffle
7. **Add chord change flash** — force lines brighten 3× for 300ms
8. **Add drag interaction** — grab to override forces, release to resume
9. **Add mobile pin/unpin** — tap to toggle
10. **Register in CodeChordsSwitch and experiments.ts**
11. **Test** — verify tritone→major-3rd snap on G7→Cmaj7. Test drag-and-release of dissonant pair. Test 60fps.

---

## What NOT to Do

- Do NOT use flight trails (that's Flock's visual identity)
- Do NOT use breathing modulation (Magnets forces are constant, not rhythmic)
- Do NOT use edge wrapping — orbs must stay visible so the user can see the spatial structure
- Do NOT add a leader/wander system — all orbs are equal, all react to interval forces
- Do NOT modify existing Section A–D components
- Do NOT use stereo synth path
- Do NOT auto-advance chords

---

## Acceptance Criteria

1. Tile E appears in pagination bar (A, B, C, D, E)
2. Consonant pairs visibly attract, dissonant pairs visibly repel
3. Force lines: solid DUN for consonant, dashed BITTERSWEET for dissonant
4. Chord change reshuffles all relationships (visible spatial reorganization)
5. Tritone→major-3rd snap visible on G7→Cmaj7
6. Desktop: drag overrides magnetic forces; release resumes them
7. Desktop: forced-together dissonant pair springs apart on release
8. Mobile: tap to pin/unpin
9. Mobile: tilt adds gentle directional bias
10. Pass-through collision audio with 600ms cooldown
11. Custom chord dropdown with strum
12. Georgia italic chord label at 6% / 16% flash
13. Edge bounce (not wrapping)
14. Chord change force line flash (3×, 300ms)
15. `noteToMidi()` and `CONSONANCE_TABLE` exported from `chordData.ts`
16. Metronome starts on first chord pick
17. Pause when settings panel opens
18. Spawn spring animation
19. Viewport-responsive orb sizing
20. Section transition works to/from E
21. Deep link `#E` loads Magnets directly
22. Sections A–D still work identically
23. `npm run build` — zero errors
24. 60fps on desktop and mobile
