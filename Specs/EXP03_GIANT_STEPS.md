# EXP-03: Giant Steps — Full Spec

**Status:** SECTION A SHIPPED
**Experiment:** Giant Steps (Coltrane Changes via Circle of Fifths)
**Sections:** 4 (A: Coltrane Circle ✅, B: Three-Body Problem, C: Chromatic Bridges, D: Mirror Symmetry)
**Last Updated:** 2026-03-22

---

## Overview

Inspired by John Coltrane's *Giant Steps* (1959). The Coltrane substitution divides the octave into three equal parts — key centers **B major**, **G major**, and **E♭ major**, each a major third apart — forming the "Coltrane Triangle" on the circle of fifths. Four sections exploring different visual interpretations of this harmonic system.

Shares the Tone.js + canvas foundation with EXP-02 (Code Chords) but uses a fundamentally different progression and visual language. Where Code Chords is a slow ii-V-I meditation, Giant Steps is a sprint — the original recording moves at ~286 BPM with chord changes every 2 beats (~0.42s per chord). The visualizations must convey that velocity and the geometric elegance of the triangle.

---

## Harmonic System

### The Giant Steps Progression

The full 16-bar form (each cell = 2 beats in 4/4):

```
| Bmaj7    D7    | Gmaj7    Bb7   | Ebmaj7         | Am7     D7    |
| Gmaj7    Bb7   | Ebmaj7   F#7   | Bmaj7          | Fm7     Bb7   |
| Ebmaj7         | Am7      D7    | Gmaj7          | C#m7    F#7   |
| Bmaj7          | Fm7      Bb7   | Ebmaj7         | C#m7    F#7   |
```

**Pattern:** Each key center is approached by its ii-V. The three key centers cycle: **B → G → E♭ → B → G → E♭ → B → E♭**.

### Key Center Classification

Every chord in the progression belongs to one of three key centers:

| Key Center | Chords | Color Token | Hex |
|-----------|--------|------------|-----|
| **B major** | Bmaj7, C#m7, F#7 | `--key-b` | `#90C2E7` (sky-blue) |
| **G major** | Gmaj7, Am7, D7 | `--key-g` | `#72B887` (spring-green) |
| **E♭ major** | Ebmaj7, Fm7, Bb7 | `--key-eb` | `#E8C547` (golden) |

These replace Code Chords' `HARMONIC_COLORS` (tonic/subdominant/dominant). In Giant Steps, **color = key center**, not harmonic function.

### Chord Data

```typescript
// giantStepsChordData.ts

export type KeyCenter = 'B' | 'G' | 'Eb';

export const KEY_CENTER_COLORS: Record<KeyCenter, string> = {
  B:  '#90C2E7',  // sky-blue
  G:  '#72B887',  // spring-green
  Eb: '#E8C547',  // golden
};

export interface GiantStepsChord {
  name: string;         // e.g. "Bmaj7"
  symbol: string;       // e.g. "Imaj7"
  keyCenter: KeyCenter; // which of the 3 tonal centers
  role: 'tonic' | 'ii' | 'V7';  // function within the key center
  notes: string[];      // voiced notes
  frequencies: number[];
}

// Full 16-chord progression (each = 2 beats)
export const GIANT_STEPS_PROGRESSION: GiantStepsChord[] = [
  // Bar 1
  { name: 'Bmaj7',  symbol: 'Imaj7', keyCenter: 'B',  role: 'tonic', notes: ['B3','D#4','F#4','A#4'], frequencies: [246.94, 311.13, 369.99, 466.16] },
  { name: 'D7',     symbol: 'V7',    keyCenter: 'G',  role: 'V7',    notes: ['D4','F#4','A4','C5'],   frequencies: [293.66, 369.99, 440.00, 523.25] },
  // Bar 2
  { name: 'Gmaj7',  symbol: 'Imaj7', keyCenter: 'G',  role: 'tonic', notes: ['G3','B3','D4','F#4'],   frequencies: [196.00, 246.94, 293.66, 369.99] },
  { name: 'Bb7',    symbol: 'V7',    keyCenter: 'Eb', role: 'V7',    notes: ['Bb3','D4','F4','Ab4'],  frequencies: [233.08, 293.66, 349.23, 415.30] },
  // Bar 3
  { name: 'Ebmaj7', symbol: 'Imaj7', keyCenter: 'Eb', role: 'tonic', notes: ['Eb4','G4','Bb4','D5'],  frequencies: [311.13, 392.00, 466.16, 587.33] },
  // (2 beats rest / hold)
  // Bar 4
  { name: 'Am7',    symbol: 'ii',    keyCenter: 'G',  role: 'ii',    notes: ['A3','C4','E4','G4'],    frequencies: [220.00, 261.63, 329.63, 392.00] },
  { name: 'D7',     symbol: 'V7',    keyCenter: 'G',  role: 'V7',    notes: ['D4','F#4','A4','C5'],   frequencies: [293.66, 369.99, 440.00, 523.25] },
  // Bar 5
  { name: 'Gmaj7',  symbol: 'Imaj7', keyCenter: 'G',  role: 'tonic', notes: ['G3','B3','D4','F#4'],   frequencies: [196.00, 246.94, 293.66, 369.99] },
  { name: 'Bb7',    symbol: 'V7',    keyCenter: 'Eb', role: 'V7',    notes: ['Bb3','D4','F4','Ab4'],  frequencies: [233.08, 293.66, 349.23, 415.30] },
  // Bar 6
  { name: 'Ebmaj7', symbol: 'Imaj7', keyCenter: 'Eb', role: 'tonic', notes: ['Eb4','G4','Bb4','D5'],  frequencies: [311.13, 392.00, 466.16, 587.33] },
  { name: 'F#7',    symbol: 'V7',    keyCenter: 'B',  role: 'V7',    notes: ['F#3','A#3','C#4','E4'], frequencies: [185.00, 233.08, 277.18, 329.63] },
  // Bar 7
  { name: 'Bmaj7',  symbol: 'Imaj7', keyCenter: 'B',  role: 'tonic', notes: ['B3','D#4','F#4','A#4'], frequencies: [246.94, 311.13, 369.99, 466.16] },
  // (2 beats rest / hold)
  // Bar 8
  { name: 'Fm7',    symbol: 'ii',    keyCenter: 'Eb', role: 'ii',    notes: ['F3','Ab3','C4','Eb4'],  frequencies: [174.61, 207.65, 261.63, 311.13] },
  { name: 'Bb7',    symbol: 'V7',    keyCenter: 'Eb', role: 'V7',    notes: ['Bb3','D4','F4','Ab4'],  frequencies: [233.08, 293.66, 349.23, 415.30] },
  // Bar 9
  { name: 'Ebmaj7', symbol: 'Imaj7', keyCenter: 'Eb', role: 'tonic', notes: ['Eb4','G4','Bb4','D5'],  frequencies: [311.13, 392.00, 466.16, 587.33] },
  // (2 beats rest / hold)
  // Bar 10
  { name: 'Am7',    symbol: 'ii',    keyCenter: 'G',  role: 'ii',    notes: ['A3','C4','E4','G4'],    frequencies: [220.00, 261.63, 329.63, 392.00] },
  { name: 'D7',     symbol: 'V7',    keyCenter: 'G',  role: 'V7',    notes: ['D4','F#4','A4','C5'],   frequencies: [293.66, 369.99, 440.00, 523.25] },
  // Bar 11
  { name: 'Gmaj7',  symbol: 'Imaj7', keyCenter: 'G',  role: 'tonic', notes: ['G3','B3','D4','F#4'],   frequencies: [196.00, 246.94, 293.66, 369.99] },
  // (2 beats rest / hold)
  // Bar 12
  { name: 'C#m7',   symbol: 'ii',    keyCenter: 'B',  role: 'ii',    notes: ['C#4','E4','G#4','B4'],  frequencies: [277.18, 329.63, 415.30, 493.88] },
  { name: 'F#7',    symbol: 'V7',    keyCenter: 'B',  role: 'V7',    notes: ['F#3','A#3','C#4','E4'], frequencies: [185.00, 233.08, 277.18, 329.63] },
  // Bar 13
  { name: 'Bmaj7',  symbol: 'Imaj7', keyCenter: 'B',  role: 'tonic', notes: ['B3','D#4','F#4','A#4'], frequencies: [246.94, 311.13, 369.99, 466.16] },
  // (2 beats rest / hold)
  // Bar 14
  { name: 'Fm7',    symbol: 'ii',    keyCenter: 'Eb', role: 'ii',    notes: ['F3','Ab3','C4','Eb4'],  frequencies: [174.61, 207.65, 261.63, 311.13] },
  { name: 'Bb7',    symbol: 'V7',    keyCenter: 'Eb', role: 'V7',    notes: ['Bb3','D4','F4','Ab4'],  frequencies: [233.08, 293.66, 349.23, 415.30] },
  // Bar 15
  { name: 'Ebmaj7', symbol: 'Imaj7', keyCenter: 'Eb', role: 'tonic', notes: ['Eb4','G4','Bb4','D5'],  frequencies: [311.13, 392.00, 466.16, 587.33] },
  // (2 beats rest / hold)
  // Bar 16
  { name: 'C#m7',   symbol: 'ii',    keyCenter: 'B',  role: 'ii',    notes: ['C#4','E4','G#4','B4'],  frequencies: [277.18, 329.63, 415.30, 493.88] },
  { name: 'F#7',    symbol: 'V7',    keyCenter: 'B',  role: 'V7',    notes: ['F#3','A#3','C#4','E4'], frequencies: [185.00, 233.08, 277.18, 329.63] },
];
```

**Important:** Bars 3, 7, 9, 11, 13, and 15 hold the tonic chord for a full bar (4 beats) instead of two chords. This means the progression has **26 chord slots** across 16 bars — but only 20 actual changes since 6 bars hold a single chord for 4 beats. The builder should handle this by having those tonic chords last twice as long (4 beats instead of 2).

### Tempo

The original Giant Steps recording is ~286 BPM. That's **~0.42 seconds per chord change** at 2 beats/chord. The experiment should support a tempo range:

| Tempo Name | BPM | Chord Duration | Vibe |
|-----------|-----|----------------|------|
| Study | 80 | ~1.5s | Slow enough to see the triangle |
| Medium | 160 | ~0.75s | Walking tempo, orbits visible |
| Giant Steps | 286 | ~0.42s | Album tempo — pure chaos |
| Coltrane | 320 | ~0.37s | Faster than the record — impossible |

Default tempo: **160 BPM** (medium). The tempo slider goes 80–320. Unlike Code Chords where speed was abstract, here BPM is literal.

### Harmonic Rhythm

At Giant Steps speed, chords change every 2 beats. With the Transport synced:

```typescript
const BEATS_PER_CHORD = 2;
const chordDurationMs = (BEATS_PER_CHORD * 60000) / bpm;
// At 286 BPM: (2 * 60000) / 286 = ~419ms
// At 160 BPM: (2 * 60000) / 160 = 750ms
// At 80 BPM:  (2 * 60000) / 80  = 1500ms
```

---

## Shared Architecture

### New Files to Create

```
components/experiments/GiantSteps/
├── GiantSteps.tsx              // Section A: Coltrane Circle
├── ThreeBody.tsx               // Section B: Three-Body Problem
├── ChromaticBridges.tsx        // Section C: Chromatic Bridges
├── MirrorSymmetry.tsx          // Section D: Mirror Symmetry
├── GiantStepsSwitch.tsx        // Section router (like CodeChordsSwitch)
├── giantStepsChordData.ts      // Progression + key center colors
├── useGiantStepsProgression.ts // Progression hook (adapted for 26-slot form)
├── giantStepsAudio.ts          // Audio engine (may share/extend existing)
└── types.ts                    // GiantSteps-specific types
```

### Files to Modify

- `data/experiments.ts` — add EXP-03 entry with 4 sections
- `app/experiments/[slug]/page.tsx` — should already handle dynamic routing

### Shared vs. Code Chords

| Concern | Code Chords (EXP-02) | Giant Steps (EXP-03) |
|---------|----------------------|----------------------|
| Progression | 4-chord ii-V-I loop | 26-slot Coltrane Changes, 16-bar form |
| Color system | tonic/subdominant/dominant | 3 key centers (B/G/E♭) |
| Tempo range | Abstract speed (slow/med/fast) | Literal BPM (80–320) |
| Harmonic rhythm | 2 bars per chord (~3–8s) | 2 beats per chord (~0.4–1.5s) |
| Chord changes/cycle | 4 | 26 (20 actual changes) |
| Visual metaphor | Collision, flocking, magnets | Geometry, gravity, bridges, symmetry |
| Audio engine | Shared — same PolySynth + FMSynth + effects chain |
| Canvas/RAF pattern | Shared — same useRef + requestAnimationFrame loop |
| Controls context | Shared — ExperimentControlsContext |
| Device orientation | Shared — useDeviceOrientation hook |

The audio engine (`audioEngine.ts`) can be imported directly. We don't need a new synth — the FMSynth + FeedbackDelay + Reverb chain works for Giant Steps too. The key difference is the **progression hook** needs to handle the 26-slot form and much faster harmonic rhythm.

### The Progression Hook

`useGiantStepsProgression.ts` replaces `useChordProgression.ts` but with critical differences:

1. **26-slot form** instead of 4-chord loop — must track position within the 16-bar structure
2. **BPM-driven** — tempo slider directly controls Transport BPM
3. **Bar-aware** — some chords last 2 beats, some last 4 (full-bar holds)
4. **Key center tracking** — exposes `currentKeyCenter` in addition to `currentChord`
5. **Looping** — the form loops back to bar 1 after bar 16

```typescript
interface GiantStepsProgressionAPI {
  currentChord: () => GiantStepsChord;
  chordIndex: () => number;         // 0–25 position in form
  currentKeyCenter: () => KeyCenter; // 'B' | 'G' | 'Eb'
  barNumber: () => number;           // 1–16
  beatInBar: () => number;           // 1–4
  start: (bpm: number) => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  jumpToChord: (index: number) => void;
  onChordChange: (cb: (chord: GiantStepsChord, idx: number, keyCenter: KeyCenter) => void) => void;
  onKeyChange: (cb: (newKey: KeyCenter, prevKey: KeyCenter) => void) => void;  // fires only on key center transitions
}
```

The `onKeyChange` callback is critical — it fires only when the key center changes (B→G, G→E♭, E♭→B), not on every chord. Sections A and B primarily react to key changes; Sections C and D react to both chords and keys.

---

## Section A: Coltrane Circle

### Concept

The circle of fifths rendered as 12 key points. Seven orbs (one per chord tone) orbit the active key center. When a Coltrane Change fires (key center shifts), orbs slingshot across the diameter to the new center. An equilateral triangle connecting B, G, and E♭ pulses on each key change, making the symmetric division visible.

### Visual Language

- **12 key labels** arranged in a circle (C at top, clockwise: C, G, D, A, E, B, F#, Db, Ab, Eb, Bb, F)
- **3 key center dots** at B, G, E♭ positions — always visible, glow when active
- **Equilateral triangle** connecting the 3 centers — drawn as a thin stroke, pulses bright on key change
- **7 orbs** orbit the current key center, gravitationally bound
- **Slingshot transition** — on key change, orbs accelerate along the triangle edge toward the new center
- **Trail afterimages** — orbs leave fading trails during slingshot, creating visual arcs

### Physics Model

```
ORBITAL:
- Orbs orbit the active key center point at varying radii (30–100px from center)
- Gentle centripetal force keeps them in orbit: F = -k * (distance - orbitRadius)
- Angular velocity varies per orb (0.5–2.0 rad/s) for visual interest
- Slight radial breathing (±10px) synced to beat

SLINGSHOT:
- On key change, each orb gets a velocity impulse directed along the triangle edge
- Impulse magnitude scales with BPM — faster tempo = faster slingshot
- Orbs follow a curved path (not straight line) — slight arc influenced by the third center
- Arrival damping: orbs decelerate smoothly into new orbit over ~300ms
- At Giant Steps tempo (286 BPM), slingshots overlap — orbs barely arrive before the next change

GRAVITY:
- Each key center exerts a pull: F = G * m / r² (inverse square)
- Active center: full strength (G = 0.5)
- Inactive centers: weak pull (G = 0.05) — just enough to curve the slingshot path
```

### Key Change Triangle Pulse

When `onKeyChange` fires:
1. Triangle stroke opacity jumps from 0.15 → 0.8 over 50ms
2. The edge being traveled glows brighter than the other two edges
3. Triangle stroke fades back to 0.15 over 500ms (ease-out)
4. A subtle shockwave ring expands from the destination key center (like Freeze & Release)
5. Key center dot scales 1× → 1.5× → 1× over 300ms (pop)

### Audio

- **On key change:** play a quick chord strum of the new chord (same as Code Chords)
- **On orb arrival at new center:** play the orb's note (soft, like Rain landing)
- **Metronome:** brush-tick metronome at BPM, accent on beat 1. At 286 BPM this is very fast — consider accent-only mode above 200 BPM (click on beat 1, silent on 2/3/4)
- **Audio density limiter:** same 100ms MIN_NOTE_GAP from Rain — critical at high tempos

### Interaction

| Platform | Input | Effect |
|----------|-------|--------|
| Desktop | Mouse position | Cursor pulls nearest orb slightly (gentle tug, not drag) |
| Desktop | Mouse Y | Maps to tempo (top = 80 BPM, bottom = 320 BPM) |
| Mobile | Tilt beta | Maps to tempo (flat = slow, tilted = fast) |
| Mobile | Tilt gamma | Adds wind force (sideways push on all orbs) |
| Both | Tap/click canvas | Spawn burst of 3 extra orbs at tap point (like Rain burst but smaller) |

### Acceptance Criteria

| # | Criterion |
|---|-----------|
| GS.A.1 | 12 key labels visible on circle, correctly positioned (C at top, clockwise fifths) |
| GS.A.2 | 3 key center dots (B, G, E♭) always visible with key-center colors |
| GS.A.3 | Equilateral triangle connecting the 3 centers visible at low opacity |
| GS.A.4 | 7 orbs orbit the active key center with varying radii and angular velocities |
| GS.A.5 | On key change, orbs slingshot along triangle edge to new center |
| GS.A.6 | Slingshot speed scales with BPM — faster at higher tempos |
| GS.A.7 | Triangle pulses on key change — traveled edge brighter |
| GS.A.8 | Key center dot pops (scale animation) on activation |
| GS.A.9 | Orbs leave trail afterimages during slingshot |
| GS.A.10 | Chord strum plays on key change (if sound enabled) |
| GS.A.11 | Tempo controllable via mouse Y (desktop) or tilt beta (mobile) |
| GS.A.12 | Progression follows correct 16-bar Giant Steps form |
| GS.A.13 | At 286 BPM, slingshots visibly overlap — continuous motion |
| GS.A.14 | Metronome plays at BPM with beat 1 accent |
| GS.A.15 | Canvas tap spawns burst of 3 orbs at tap location |
| GS.A.16 | Works on iPhone SE (375px) through desktop |
| GS.A.17 | No audio plays when soundEnabled = false |
| GS.A.18 | BPM slider (80–320) controls tempo |

### Builder Notes (Section A — shipped 2026-03-22)

**What changed from spec:**

1. **No orbs.** The spec called for 7 orbiting orbs with slingshot physics. In practice, the triangle alone is the visualization — it's cleaner and more legible. The triangle vertices (root, 3rd, 7th) ARE the visual, with vertex dots that pulse when each note plays.

2. **Triangle shape changes per chord type.** Instead of a static equilateral Coltrane triangle (B-G-E♭), the triangle connects root, 3rd, and 7th of the *current chord* on the circle of fifths. This means maj7, dom7, and min7 chords produce different triangle shapes — the geometry IS the voicing.

3. **BPM slider replaces mouse-Y-to-tempo and chord dropdown.** The chord dropdown was useless since the progression auto-advances. Mouse-Y-to-BPM felt arbitrary. A simple range slider (80–320 BPM) is more intuitive. Mobile still uses gyro beta for BPM.

4. **Staggered ascending note sequence.** Instead of a chord strum, notes play root → 3rd → 7th in ascending order with stagger timing based on BPM. Each vertex pulses (scale 2.0 → 1.0 decay) when its note sounds. Feels like a scale.

5. **Shockwave rings at note positions, not key centers.** Ripple rings fire at each vertex when the note plays (staggered with the audio). The old spec had shockwaves only on key center changes at the fixed B/G/E♭ positions.

6. **Dynamic label highlighting.** Only the 3 notes in the current chord triangle light up on the circle — the rest stay dim. Labels change color to match the current key center color. Previously B, G, E♭ were always highlighted regardless of chord.

7. **Variable beat durations in progression data.** Tonic chords on bars 3/7/9/11/13/15 last 4 beats; all others last 2. The progression hook uses `chord.beats` to calculate duration: `(chord.beats * 60000) / bpm`.

8. **Smooth angular lerp with shortest-path wrapping.** Triangle vertices lerp at speed 0.18 with wraparound logic (if diff > 180°, go the short way). Vertices are sorted by angle before drawing to prevent line crossings.

**Files created:**
- `components/experiments/GiantSteps/types.ts`
- `components/experiments/GiantSteps/giantStepsChordData.ts`
- `components/experiments/GiantSteps/useGiantStepsProgression.ts`
- `components/experiments/GiantSteps/GiantSteps.tsx`
- `components/experiments/GiantSteps/GiantSteps.module.css`
- `components/experiments/GiantSteps/GiantStepsSwitch.tsx`

**Files modified:**
- `data/experiments.ts` — added Giant Steps experiment + sectionConfigs
- `app/experiments/[slug]/page.tsx` — added GiantStepsSwitch to component map

---

## Section B: Three-Body Problem

### Concept

Three gravitational attractors arranged in a triangle, one per tonal center. Seven orbs perpetually in flight between wells. At slow tempo, orbs settle into stable orbits around the active well. At Giant Steps tempo, orbs are always mid-flight — the "three-body problem" that's famously unsolvable. Tempo = chaos dial.

### Visual Language

- **3 gravity wells** positioned at triangle vertices (same B/G/E♭ positions, but larger — fills more of the canvas)
- **Well visualization:** concentric rings radiating outward from each center, opacity pulsing when active
- **7 orbs** in perpetual flight, pulled by all three wells simultaneously
- **Active well:** strongest pull. Glows brighter, rings pulse outward.
- **Inactive wells:** weak but present pull. Dim rings, subtle glow.
- **Particle trails:** orbs leave long, fading trails showing their chaotic paths
- **At high tempo:** trails fill the canvas — a visual record of the chaos

### Physics Model

```
N-BODY GRAVITY:
- Each well exerts gravitational pull: F = G * m / r² (capped at max force to prevent singularity)
- Active well: G_active = 0.8
- Inactive wells: G_inactive = 0.15
- On key change: G values swap instantly — orbs flung toward new attractor
- Damping: very low (0.998) — orbs maintain energy, don't settle quickly
- Max speed cap: 6px/frame (prevents escape)

CHAOS FACTOR:
- At low BPM (80): wells swap slowly, orbs settle into near-stable orbits
- At high BPM (286+): wells swap every ~0.42s — orbs never settle
- The system is genuinely chaotic — small changes in initial conditions → wildly different paths
- This IS the point: Giant Steps was considered nearly unplayable

WELL TRANSITION:
- On key change, active well G ramps from 0.15 → 0.8 over 100ms (not instant)
- Previous well G ramps from 0.8 → 0.15 over 200ms (slower fade — "letting go")
- This asymmetric ramp creates a smooth handoff
```

### Trail System

Trails are critical to this section's identity. Each orb maintains a trail array of recent positions:

```typescript
interface ThreeBodyTrail {
  points: { x: number; y: number; time: number }[];
  maxLength: 120;  // frames of history
  color: string;   // orb's color
}
```

Trails render as polylines with alpha fading from 0.4 (newest) to 0 (oldest). At high tempo, trails weave complex patterns that visualize the unpredictable flight paths. Trail length adjusts with tempo — longer trails at higher BPM to show more history.

### Well Visualization

Each well renders as:
1. **Core dot** — 6px, solid key-center color
2. **Inner ring** — 30px radius, thin stroke, opacity 0.2 (0.5 when active)
3. **Outer ring** — 80px radius, thin stroke, opacity 0.08 (0.2 when active)
4. **Pulse ring** — expands outward on key change (from 30px to 150px), fades out over 400ms
5. **Gravity field** — radial gradient from center, very subtle (opacity 0.03), shows influence area

### Interaction

| Platform | Input | Effect |
|----------|-------|--------|
| Desktop | Mouse X | Drag the active well's position horizontally (distort the triangle) |
| Desktop | Mouse Y | Maps to tempo |
| Mobile | Tilt gamma | Shifts active well position (tilt = reshape triangle) |
| Mobile | Tilt beta | Maps to tempo |
| Both | Tap/click | Add a temporary fourth well at tap point (lasts 3 seconds, then fades) |

### Acceptance Criteria

| # | Criterion |
|---|-----------|
| GS.B.1 | 3 gravity wells visible at triangle positions with key-center colors |
| GS.B.2 | 7 orbs in perpetual motion, pulled by all 3 wells simultaneously |
| GS.B.3 | Active well has strongest gravity pull |
| GS.B.4 | On key change, gravity strengths swap — orbs flung toward new well |
| GS.B.5 | Orbs leave trailing paths showing flight history |
| GS.B.6 | Trail length increases with BPM |
| GS.B.7 | At 286 BPM, motion is visibly chaotic — orbs never settle |
| GS.B.8 | At 80 BPM, orbs settle into near-stable orbits |
| GS.B.9 | Well rings pulse outward on key change |
| GS.B.10 | Active well glows brighter than inactive wells |
| GS.B.11 | Tempo controllable via mouse Y / tilt beta |
| GS.B.12 | Tap/click creates temporary fourth well (3s lifespan) |
| GS.B.13 | Collision audio plays when orbs pass close to a well center (within 30px) |
| GS.B.14 | Audio density limiter prevents audio overload at high tempo |
| GS.B.15 | Canvas clears trails on chord dropdown manual change |

---

## Section C: Chromatic Bridges

### Concept

What makes Giant Steps hard to solo over is the passing chords — the ii-V pairs that connect key centers. This section visualizes those connections as ephemeral force-field arcs (bridges) between wells. Orbs travel along bridges during the ii-V, then settle into the new key center on resolution. Bridges glow, flicker, and dissolve.

### Visual Language

- **3 key center zones** — larger, more diffuse than wells. Soft circular glow areas where orbs rest.
- **Bridges** — curved arcs connecting zones. Appear 2 beats before the resolution, glow during the ii-V, dissolve on arrival.
- **Bridge anatomy:** thin glowing line with particle flow along it (small dots moving along the arc)
- **Orbs** travel along the bridge path during ii-V, arrive at the key center on the Imaj7 chord
- **Resolution flash** — when orbs arrive at the tonic, the zone flashes briefly

### Bridge Mechanics

The ii-V-I connection in Giant Steps:

```
Am7 → D7 → Gmaj7     (ii-V in G)
Fm7 → Bb7 → Ebmaj7   (ii-V in Eb)
C#m7 → F#7 → Bmaj7   (ii-V in B)
```

Each bridge connects the **source key center** to the **destination key center**. The bridge appears on the ii chord (2 beats early), strengthens on the V7, and the orbs arrive on the I.

```typescript
interface Bridge {
  from: KeyCenter;
  to: KeyCenter;
  startTime: number;       // when the ii chord begins
  resolutionTime: number;  // when the Imaj7 chord begins
  progress: number;        // 0 (just appeared) to 1 (orbs arrived)
  opacity: number;         // fades in on ii, bright on V7, fades out after I
  particleFlow: BridgeParticle[];  // small dots flowing along the arc
}
```

### Bridge Rendering

```
Appearance timeline (over 4 beats: ii = 2 beats + V7 = 2 beats):
  Beat 1 (ii): Bridge line fades in (opacity 0 → 0.3)
  Beat 2 (ii): Bridge line strengthens (0.3 → 0.5), particle flow begins
  Beat 3 (V7): Bridge at full brightness (0.5 → 0.8), orbs start moving along path
  Beat 4 (V7): Orbs arriving, bridge begins dissolving
  Resolution (I): Flash at destination, bridge fully dissolved over 200ms
```

The bridge line itself is a quadratic Bézier curve. The control point is offset perpendicular to the straight line between centers, creating a visible arc. Direction alternates (above/below) for visual variety.

### Zone Resting Behavior

When orbs are "at" a key center (not traveling a bridge), they drift gently within the zone:
- Brownian motion with soft boundary (spring force at zone edge)
- Zone radius: ~80px on desktop, ~50px on mobile
- Orbs drift slower at lower tempos, faster at higher

### Interaction

| Platform | Input | Effect |
|----------|-------|--------|
| Desktop | Mouse position | Cursor position influences bridge curvature (control point follows mouse) |
| Desktop | Mouse Y | Maps to tempo |
| Mobile | Tilt | Shifts the bridge curvature control point |
| Both | Tap/click on zone | Manual resolution — all orbs snap to the tapped zone with flash |

### Acceptance Criteria

| # | Criterion |
|---|-----------|
| GS.C.1 | 3 key center zones visible with soft glow areas |
| GS.C.2 | Bridges appear as curved arcs between zones during ii-V passages |
| GS.C.3 | Bridge fades in on ii chord (2 beats before resolution) |
| GS.C.4 | Bridge at full brightness during V7 chord |
| GS.C.5 | Orbs travel along bridge path from source to destination |
| GS.C.6 | Resolution flash when orbs arrive at tonic (Imaj7) |
| GS.C.7 | Bridge dissolves after resolution over ~200ms |
| GS.C.8 | Small particle flow along bridge line during transit |
| GS.C.9 | Bridge curvature follows mouse position / tilt |
| GS.C.10 | Orbs drift gently within key center zones when not traveling |
| GS.C.11 | At high BPM, bridges overlap — multiple visible simultaneously |
| GS.C.12 | Audio: chord strum on resolution, soft notes during bridge travel |
| GS.C.13 | Tapping a zone forces manual resolution to that zone |
| GS.C.14 | Progression correctly identifies ii-V-I sequences within the form |
| GS.C.15 | Direct key jumps (e.g., Bmaj7 → D7 without ii) show a shorter, faster bridge |

---

## Section D: Mirror Symmetry

### Concept

Lean into the fundamental symmetry: 12 ÷ 3. Everything has three-fold rotational symmetry. Each note spawns 3 mirrored orbs at 120° intervals. When the progression resolves to a key center, the mirrors briefly align into a unified form before splitting again. The visual is kaleidoscopic.

### Visual Language

- **Canvas divided into 3 sectors** by faint 120° lines from center
- **Each orb exists as a triad** — 3 copies at 120° rotational symmetry
- **7 base orbs × 3 mirrors = 21 visible orbs** (but only 7 are "real" — the others are reflections)
- **Sector coloring:** each sector subtly tinted with its key center color (very low opacity, 0.02)
- **Alignment moment:** when the tonic chord resolves, all 3 mirrors converge to the center briefly
- **Split animation:** after alignment, mirrors slide back to their 120° positions

### Physics Model

Only the "real" 7 orbs have physics. The mirrors are computed:

```typescript
function mirrorOrb(real: Particle, sectorAngle: number, center: { x: number, y: number }): { x: number, y: number } {
  const dx = real.x - center.x;
  const dy = real.y - center.y;
  const cos = Math.cos(sectorAngle);
  const sin = Math.sin(sectorAngle);
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos,
  };
}

// Each real orb → 3 rendered orbs (original + 2 mirrors at 120° and 240°)
```

The real orbs move with simple forces:
- Drift toward active sector (gentle spring, not instant)
- On chord change: force toward new active sector
- Gentle inter-orb repulsion (prevent overlap)
- Damping: moderate (0.97)

### Alignment Event

When a tonic chord (Imaj7) resolves:

1. **Convergence** (200ms): All mirrors lerp toward the center point. The 3 copies of each orb slide inward until they overlap.
2. **Unison moment** (100ms): All 21 visible orbs are stacked as 7 at center. Brief bright flash. Play a unison chord (all 7 notes simultaneously).
3. **Split** (300ms): Mirrors slide back outward to their rotational positions. Ease-out.

This creates a rhythmic visual pulse — the kaleidoscope collapses and expands on each resolution.

### Sector Lines

Three lines from center to edges, at 0°, 120°, 240° (or rotated to align with the triangle):
- Thin (0.5px), low opacity (0.08)
- Brighten slightly on the sector that corresponds to the active key center
- Rotate slowly (0.5°/sec) for subtle visual motion

### Interaction

| Platform | Input | Effect |
|----------|-------|--------|
| Desktop | Mouse angle from center | Rotates the symmetry axis (all mirrors follow) |
| Desktop | Mouse distance from center | Controls convergence — closer to center = mirrors pull inward |
| Mobile | Tilt gamma | Rotates symmetry axis |
| Mobile | Tilt beta | Controls convergence amount |
| Both | Tap/click | Force alignment event (all mirrors converge + flash + split) |

### Acceptance Criteria

| # | Criterion |
|---|-----------|
| GS.D.1 | 7 real orbs with 2 mirror copies each = 21 visible orbs |
| GS.D.2 | Mirrors maintain perfect 120° rotational symmetry |
| GS.D.3 | Faint sector lines visible dividing canvas into thirds |
| GS.D.4 | Active sector subtly tinted with key-center color |
| GS.D.5 | On tonic resolution: alignment event (converge → flash → split) |
| GS.D.6 | Alignment convergence takes ~200ms, split takes ~300ms |
| GS.D.7 | Unison chord plays during alignment (all 7 notes, if sound enabled) |
| GS.D.8 | Mouse angle / tilt gamma rotates the symmetry axis |
| GS.D.9 | Mouse distance / tilt beta controls convergence amount |
| GS.D.10 | Tap/click forces an alignment event |
| GS.D.11 | Real orbs drift toward active sector with gentle spring force |
| GS.D.12 | At high BPM, alignment events overlap — mirrors barely split before re-converging |
| GS.D.13 | Sector lines rotate slowly for visual motion |
| GS.D.14 | Works on iPhone SE through desktop — mirror orbs scale down on mobile |

---

## Builder Realities (Learned from Code Chords)

These realities come from building 7 sections of Code Chords. Builders should know these up front:

| # | Reality | Implication |
|---|---------|-------------|
| BR.1 | **Spring equilibrium > direct force.** In Magnets, `SPRING_K=0.003` with rest distances worked better than raw gravitational pull. Giant Steps sections with orbital behavior (A, B) should consider spring equilibrium. | Builders may replace raw gravity with spring models. |
| BR.2 | **Press-and-hold > click-to-toggle.** iOS sticky states killed toggle. Any "hold to freeze" or "hold to converge" should be press-and-hold. | Section D's manual alignment should use tap (instant), not hold. |
| BR.3 | **Note duration variety.** Random quarter/half/whole notes instead of fixed 8th notes dramatically improves musicality. All Giant Steps sections should use varied note durations. | Don't use fixed `'8n'` — randomize. |
| BR.4 | **100ms audio density limiter is essential.** Without MIN_NOTE_GAP, fast chord changes + collisions = audio hell. At 286 BPM this is even more critical. | Every section needs the limiter. |
| BR.5 | **Energy circle > timer text.** Visual progress indicators (arcs, rings) feel better than numbers or text. | Bridge progress, alignment progress should be visual, not text. |
| BR.6 | **Shockwave ring is a great chord-change signal.** Expanding ring from center with ease-out cubic. Use on key changes across all sections. | Standard key-change visual. |
| BR.7 | **Canvas flash on burst events.** 15% opacity, 300ms fade. Good for alignment moments, resolution flashes. | Keep it subtle. |
| BR.8 | **Collision push radius ~250px** was good for Magnets. Adapt for well proximity effects. | Scale to canvas size. |
| BR.9 | **Mobile orb radius floor: 36px for interaction, but smaller for many-particle systems.** Rain used 10-18px. Giant Steps has 7–21 orbs — medium size (20-40px). | Adjust per section. |
| BR.10 | **Beat-synced breathing** (rest distances oscillate with metronome) adds life. Consider for orbital radii. | Subtle ±10% oscillation. |
| BR.11 | **`soundEnabled` check on ALL audio calls.** Context provides it. | Non-negotiable. |
| BR.12 | **Mute button should also mute metronome.** Discovered in Freeze & Release. | Same pattern here. |
| BR.13 | **At very high BPM, visual transitions WILL overlap.** Design for overlap gracefully — don't wait for one to finish before starting the next. | Slingshots, bridges, alignments can stack. |
| BR.14 | **Delta-time stepping is mandatory.** `dt = (now - lastTime) / 16.67`. Frame drops must not break physics. | Same as all canvas experiments. |

---

## Experiment Entry (data/experiments.ts)

```typescript
{
  slug: 'giant-steps',
  number: '03',
  title: 'Giant Steps',
  subtitle: 'Coltrane Changes via Circle of Fifths',
  description: 'Four visualizations of John Coltrane\'s Giant Steps — the harmonic substitution that divides the octave into three equal parts.',
  sections: ['Coltrane Circle', 'Three-Body Problem', 'Chromatic Bridges', 'Mirror Symmetry'],
  sectionLetters: ['A', 'B', 'C', 'D'],
  component: 'GiantSteps',
  controls: {
    tempo: { min: 80, max: 320, default: 160, label: 'BPM' },
    timeSignature: 4,  // Giant Steps is in 4/4, not 3/4
    decay: true,
    reverbMix: true,
    soundEnabled: true,
  },
}
```

---

## Build Order (Recommended)

| Phase | Task |
|-------|------|
| 1 | Create `giantStepsChordData.ts` — full 26-chord progression + key center colors |
| 2 | Create `useGiantStepsProgression.ts` — BPM-synced progression with key change callback |
| 3 | Create `GiantStepsSwitch.tsx` — section router |
| 4 | Build Section A (Coltrane Circle) first — it exercises the full progression + audio + circle geometry |
| 5 | Build Section B (Three-Body Problem) — reuses progression, adds gravity simulation |
| 6 | Build Section C (Chromatic Bridges) — adds bridge detection logic (ii-V-I identification) |
| 7 | Build Section D (Mirror Symmetry) — adds rotational symmetry rendering |
| 8 | Wire in `data/experiments.ts` |
| 9 | Test all sections at 80, 160, 286, and 320 BPM |
| 10 | `npm run build` — zero errors |

Each section is a standalone `.tsx` file. They can be built in parallel by different builders, as long as the shared chord data + progression hook are built first (Phase 1–3).

---

## What NOT to Do

1. **Don't reuse Code Chords' PROGRESSION.** Giant Steps has its own 26-chord form. They're fundamentally different harmonic systems.
2. **Don't use abstract speed values.** BPM is literal here. The slider says "BPM" and the number means something.
3. **Don't design for settled states.** At Giant Steps tempo, nothing ever settles. The beauty IS the perpetual motion.
4. **Don't skip the triangle visualization (Section A).** The equilateral triangle IS the signature image of Coltrane Changes. It must be rendered.
5. **Don't make bridges straight lines (Section C).** Bridges must curve — they represent the chromatic path through the ii-V, not a direct jump.
6. **Don't treat mirror orbs as independent particles (Section D).** Only 7 are real. The other 14 are computed reflections. Don't run physics on reflections.
7. **Don't forget bar-length holds.** Some chords in the form last 4 beats (full bar), not 2. The progression must handle this.
8. **Don't hard-code 286 BPM.** The tempo must be variable. 286 is the original recording — it's the peak, not the default.
9. **Don't play audio on every chord change.** With 26 chords in 16 bars at 286 BPM, that's ~62 chord changes per minute. Use the audio limiter and be selective about which events trigger sound.
10. **Don't ignore the `soundEnabled` context flag.** All audio must respect it.

---

## Changelog

| Date | Entry |
|------|-------|
| 2026-03-21 | Initial spec. Full 26-chord progression, 4 sections, builder realities from Code Chords. |
| 2026-03-22 | Section A (Coltrane Circle) shipped. No orbs — triangle-only visualization with dynamic chord shapes. BPM slider replaces dropdown + mouse-Y. Staggered ascending note sequence. Shockwaves at note positions. |
