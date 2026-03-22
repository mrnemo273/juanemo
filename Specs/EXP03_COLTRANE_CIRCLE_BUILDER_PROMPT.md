# EXP-03 Section A: Coltrane Circle — Builder Prompt

**Read first:** `Specs/EXP03_GIANT_STEPS.md` (full spec with harmonic system, all 4 sections, builder realities)

---

## What You're Building

The first section of a new experiment — Giant Steps. This section visualizes Coltrane Changes on the circle of fifths. 12 keys arranged in a circle, 7 orbs orbiting the active key center, slingshot transitions when the key center shifts. An equilateral triangle connecting B, G, and E♭ pulses on each key change.

You're also building the **shared infrastructure** that all 4 Giant Steps sections will use: the chord data, the progression hook, the section switch, and the experiment entry.

---

## Existing Architecture

### Files You'll Create
- `components/experiments/GiantSteps/giantStepsChordData.ts` — progression + colors
- `components/experiments/GiantSteps/useGiantStepsProgression.ts` — BPM-synced progression hook
- `components/experiments/GiantSteps/types.ts` — Giant Steps types
- `components/experiments/GiantSteps/GiantSteps.tsx` — Section A: Coltrane Circle
- `components/experiments/GiantSteps/GiantStepsSwitch.tsx` — section router

### Files You'll Modify
- `data/experiments.ts` — add EXP-03 entry

### Reference Files (READ THESE)
- `components/experiments/CollisionChanges/CollisionChanges.tsx` — canvas/RAF/audio pattern to follow
- `components/experiments/CollisionChanges/chordData.ts` — Code Chords progression for pattern reference
- `components/experiments/CollisionChanges/useChordProgression.ts` — progression hook pattern
- `components/experiments/CollisionChanges/audioEngine.ts` — `playNote`, `playChordStrum`, metronome
- `components/experiments/CollisionChanges/CodeChordsSwitch.tsx` — section router pattern
- `lib/ExperimentControlsContext.tsx` — controls context (soundEnabled, tempo, etc.)
- `lib/useDeviceOrientation.ts` — gyro hook

---

## Step 1: Types (types.ts)

```typescript
export type KeyCenter = 'B' | 'G' | 'Eb';
export type ChordRole = 'tonic' | 'ii' | 'V7';

export interface GiantStepsChord {
  name: string;
  symbol: string;
  keyCenter: KeyCenter;
  role: ChordRole;
  notes: string[];
  frequencies: number[];
  beats: number;  // 2 or 4 (full-bar holds)
}

export interface GiantStepsParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  note: string;
  frequency: number;
  color: string;
  orbitRadius: number;
  orbitAngle: number;
  angularVelocity: number;
  trail: { x: number; y: number; alpha: number }[];
  slingshotting: boolean;
}
```

---

## Step 2: Chord Data (giantStepsChordData.ts)

```typescript
import type { KeyCenter, GiantStepsChord } from './types';

export const KEY_CENTER_COLORS: Record<KeyCenter, string> = {
  B:  '#90C2E7',  // sky-blue
  G:  '#72B887',  // spring-green
  Eb: '#E8C547',  // golden
};

// Circle of fifths positions (0 = top, clockwise, in degrees)
export const CIRCLE_OF_FIFTHS: { note: string; angle: number }[] = [
  { note: 'C',  angle: 0 },
  { note: 'G',  angle: 30 },
  { note: 'D',  angle: 60 },
  { note: 'A',  angle: 90 },
  { note: 'E',  angle: 120 },
  { note: 'B',  angle: 150 },
  { note: 'F♯', angle: 180 },
  { note: 'D♭', angle: 210 },
  { note: 'A♭', angle: 240 },
  { note: 'E♭', angle: 270 },
  { note: 'B♭', angle: 300 },
  { note: 'F',  angle: 330 },
];

// Key center positions on the circle (these are the triangle vertices)
export const KEY_CENTER_ANGLES: Record<KeyCenter, number> = {
  B:  150,  // at the B position on circle of fifths
  G:  30,   // at the G position
  Eb: 270,  // at the Eb position
};

// Full 16-bar Giant Steps progression
// Bars with 2 chords = 2 beats each. Bars with 1 chord = 4 beats (full bar hold).
export const GIANT_STEPS_PROGRESSION: GiantStepsChord[] = [
  // Bar 1: Bmaj7 (2) → D7 (2)
  { name: 'Bmaj7',  symbol: 'Imaj7', keyCenter: 'B',  role: 'tonic', notes: ['B3','D#4','F#4','A#4'], frequencies: [246.94, 311.13, 369.99, 466.16], beats: 2 },
  { name: 'D7',     symbol: 'V7',    keyCenter: 'G',  role: 'V7',    notes: ['D4','F#4','A4','C5'],   frequencies: [293.66, 369.99, 440.00, 523.25], beats: 2 },
  // Bar 2: Gmaj7 (2) → Bb7 (2)
  { name: 'Gmaj7',  symbol: 'Imaj7', keyCenter: 'G',  role: 'tonic', notes: ['G3','B3','D4','F#4'],   frequencies: [196.00, 246.94, 293.66, 369.99], beats: 2 },
  { name: 'Bb7',    symbol: 'V7',    keyCenter: 'Eb', role: 'V7',    notes: ['Bb3','D4','F4','Ab4'],  frequencies: [233.08, 293.66, 349.23, 415.30], beats: 2 },
  // Bar 3: Ebmaj7 (4) — full bar hold
  { name: 'Ebmaj7', symbol: 'Imaj7', keyCenter: 'Eb', role: 'tonic', notes: ['Eb4','G4','Bb4','D5'],  frequencies: [311.13, 392.00, 466.16, 587.33], beats: 4 },
  // Bar 4: Am7 (2) → D7 (2)
  { name: 'Am7',    symbol: 'ii',    keyCenter: 'G',  role: 'ii',    notes: ['A3','C4','E4','G4'],    frequencies: [220.00, 261.63, 329.63, 392.00], beats: 2 },
  { name: 'D7',     symbol: 'V7',    keyCenter: 'G',  role: 'V7',    notes: ['D4','F#4','A4','C5'],   frequencies: [293.66, 369.99, 440.00, 523.25], beats: 2 },
  // Bar 5: Gmaj7 (2) → Bb7 (2)
  { name: 'Gmaj7',  symbol: 'Imaj7', keyCenter: 'G',  role: 'tonic', notes: ['G3','B3','D4','F#4'],   frequencies: [196.00, 246.94, 293.66, 369.99], beats: 2 },
  { name: 'Bb7',    symbol: 'V7',    keyCenter: 'Eb', role: 'V7',    notes: ['Bb3','D4','F4','Ab4'],  frequencies: [233.08, 293.66, 349.23, 415.30], beats: 2 },
  // Bar 6: Ebmaj7 (2) → F#7 (2)
  { name: 'Ebmaj7', symbol: 'Imaj7', keyCenter: 'Eb', role: 'tonic', notes: ['Eb4','G4','Bb4','D5'],  frequencies: [311.13, 392.00, 466.16, 587.33], beats: 2 },
  { name: 'F#7',    symbol: 'V7',    keyCenter: 'B',  role: 'V7',    notes: ['F#3','A#3','C#4','E4'], frequencies: [185.00, 233.08, 277.18, 329.63], beats: 2 },
  // Bar 7: Bmaj7 (4) — full bar hold
  { name: 'Bmaj7',  symbol: 'Imaj7', keyCenter: 'B',  role: 'tonic', notes: ['B3','D#4','F#4','A#4'], frequencies: [246.94, 311.13, 369.99, 466.16], beats: 4 },
  // Bar 8: Fm7 (2) → Bb7 (2)
  { name: 'Fm7',    symbol: 'ii',    keyCenter: 'Eb', role: 'ii',    notes: ['F3','Ab3','C4','Eb4'],  frequencies: [174.61, 207.65, 261.63, 311.13], beats: 2 },
  { name: 'Bb7',    symbol: 'V7',    keyCenter: 'Eb', role: 'V7',    notes: ['Bb3','D4','F4','Ab4'],  frequencies: [233.08, 293.66, 349.23, 415.30], beats: 2 },
  // Bar 9: Ebmaj7 (4) — full bar hold
  { name: 'Ebmaj7', symbol: 'Imaj7', keyCenter: 'Eb', role: 'tonic', notes: ['Eb4','G4','Bb4','D5'],  frequencies: [311.13, 392.00, 466.16, 587.33], beats: 4 },
  // Bar 10: Am7 (2) → D7 (2)
  { name: 'Am7',    symbol: 'ii',    keyCenter: 'G',  role: 'ii',    notes: ['A3','C4','E4','G4'],    frequencies: [220.00, 261.63, 329.63, 392.00], beats: 2 },
  { name: 'D7',     symbol: 'V7',    keyCenter: 'G',  role: 'V7',    notes: ['D4','F#4','A4','C5'],   frequencies: [293.66, 369.99, 440.00, 523.25], beats: 2 },
  // Bar 11: Gmaj7 (4) — full bar hold
  { name: 'Gmaj7',  symbol: 'Imaj7', keyCenter: 'G',  role: 'tonic', notes: ['G3','B3','D4','F#4'],   frequencies: [196.00, 246.94, 293.66, 369.99], beats: 4 },
  // Bar 12: C#m7 (2) → F#7 (2)
  { name: 'C#m7',   symbol: 'ii',    keyCenter: 'B',  role: 'ii',    notes: ['C#4','E4','G#4','B4'],  frequencies: [277.18, 329.63, 415.30, 493.88], beats: 2 },
  { name: 'F#7',    symbol: 'V7',    keyCenter: 'B',  role: 'V7',    notes: ['F#3','A#3','C#4','E4'], frequencies: [185.00, 233.08, 277.18, 329.63], beats: 2 },
  // Bar 13: Bmaj7 (4) — full bar hold
  { name: 'Bmaj7',  symbol: 'Imaj7', keyCenter: 'B',  role: 'tonic', notes: ['B3','D#4','F#4','A#4'], frequencies: [246.94, 311.13, 369.99, 466.16], beats: 4 },
  // Bar 14: Fm7 (2) → Bb7 (2)
  { name: 'Fm7',    symbol: 'ii',    keyCenter: 'Eb', role: 'ii',    notes: ['F3','Ab3','C4','Eb4'],  frequencies: [174.61, 207.65, 261.63, 311.13], beats: 2 },
  { name: 'Bb7',    symbol: 'V7',    keyCenter: 'Eb', role: 'V7',    notes: ['Bb3','D4','F4','Ab4'],  frequencies: [233.08, 293.66, 349.23, 415.30], beats: 2 },
  // Bar 15: Ebmaj7 (4) — full bar hold
  { name: 'Ebmaj7', symbol: 'Imaj7', keyCenter: 'Eb', role: 'tonic', notes: ['Eb4','G4','Bb4','D5'],  frequencies: [311.13, 392.00, 466.16, 587.33], beats: 4 },
  // Bar 16: C#m7 (2) → F#7 (2)
  { name: 'C#m7',   symbol: 'ii',    keyCenter: 'B',  role: 'ii',    notes: ['C#4','E4','G#4','B4'],  frequencies: [277.18, 329.63, 415.30, 493.88], beats: 2 },
  { name: 'F#7',    symbol: 'V7',    keyCenter: 'B',  role: 'V7',    notes: ['F#3','A#3','C#4','E4'], frequencies: [185.00, 233.08, 277.18, 329.63], beats: 2 },
];
```

---

## Step 3: Progression Hook (useGiantStepsProgression.ts)

Key differences from Code Chords' `useChordProgression`:
- **BPM-driven**, not abstract speed values
- **Variable chord durations**: some chords last 2 beats, others 4
- **Key center tracking**: exposes `currentKeyCenter` and fires `onKeyChange`
- **Looping 16-bar form**: wraps back to index 0 after the last chord

```typescript
import { useRef, useCallback, useEffect, useMemo } from 'react';
import { GIANT_STEPS_PROGRESSION } from './giantStepsChordData';
import type { GiantStepsChord, KeyCenter } from './types';

export interface GiantStepsProgressionAPI {
  currentChord: () => GiantStepsChord;
  chordIndex: () => number;
  currentKeyCenter: () => KeyCenter;
  start: (bpm: number) => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  jumpToChord: (index: number) => void;
  onChordChange: (cb: (chord: GiantStepsChord, idx: number) => void) => void;
  onKeyChange: (cb: (newKey: KeyCenter, prevKey: KeyCenter) => void) => void;
}

export function useGiantStepsProgression(): GiantStepsProgressionAPI {
  const indexRef = useRef(0);
  const bpmRef = useRef(160);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chordCallbackRef = useRef<((chord: GiantStepsChord, idx: number) => void) | null>(null);
  const keyCallbackRef = useRef<((newKey: KeyCenter, prevKey: KeyCenter) => void) | null>(null);
  const prevKeyCenterRef = useRef<KeyCenter>('B');

  function getChordDurationMs(chord: GiantStepsChord, bpm: number): number {
    return (chord.beats * 60000) / bpm;
  }

  const advance = useCallback(() => {
    const prevKey = GIANT_STEPS_PROGRESSION[indexRef.current].keyCenter;
    indexRef.current = (indexRef.current + 1) % GIANT_STEPS_PROGRESSION.length;
    const newChord = GIANT_STEPS_PROGRESSION[indexRef.current];

    chordCallbackRef.current?.(newChord, indexRef.current);

    if (newChord.keyCenter !== prevKey) {
      keyCallbackRef.current?.(newChord.keyCenter, prevKey);
      prevKeyCenterRef.current = newChord.keyCenter;
    }

    const duration = getChordDurationMs(newChord, bpmRef.current);
    timerRef.current = setTimeout(advance, duration);
  }, []);

  const start = useCallback((bpm: number) => {
    bpmRef.current = bpm;
    if (timerRef.current) clearTimeout(timerRef.current);
    const chord = GIANT_STEPS_PROGRESSION[indexRef.current];
    const duration = getChordDurationMs(chord, bpm);
    timerRef.current = setTimeout(advance, duration);
  }, [advance]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setBpm = useCallback((bpm: number) => {
    bpmRef.current = bpm;
    // Don't restart timer — it'll pick up the new BPM on next advance
  }, []);

  const jumpToChord = useCallback((index: number) => {
    const prevKey = GIANT_STEPS_PROGRESSION[indexRef.current].keyCenter;
    indexRef.current = index;
    const chord = GIANT_STEPS_PROGRESSION[index];
    chordCallbackRef.current?.(chord, index);
    if (chord.keyCenter !== prevKey) {
      keyCallbackRef.current?.(chord.keyCenter, prevKey);
    }
  }, []);

  // ... standard cleanup, memoized return
}
```

---

## Step 4: Section Router (GiantStepsSwitch.tsx)

```typescript
'use client';
import { useContext } from 'react';
import { ExperimentControlsContext } from '@/lib/ExperimentControlsContext';
import GiantSteps from './GiantSteps';
// Import other sections as they're built:
// import ThreeBody from './ThreeBody';
// import ChromaticBridges from './ChromaticBridges';
// import MirrorSymmetry from './MirrorSymmetry';

export default function GiantStepsSwitch() {
  const { activeSection } = useContext(ExperimentControlsContext);

  // if (activeSection === 3) return <MirrorSymmetry />;
  // if (activeSection === 2) return <ChromaticBridges />;
  // if (activeSection === 1) return <ThreeBody />;
  return <GiantSteps />;
}
```

---

## Step 5: Coltrane Circle (GiantSteps.tsx)

This is the main build. Follow the canvas/RAF pattern from `CollisionChanges.tsx`.

### Circle of Fifths Layout

```typescript
const CIRCLE_RADIUS_RATIO = 0.35;  // 35% of min(canvasW, canvasH)
const CENTER_DOT_RADIUS = 6;
const KEY_DOT_RADIUS = 4;
const LABEL_OFFSET = 20;  // px outside circle for key labels

function getCirclePoint(angleDeg: number, radius: number, cx: number, cy: number) {
  // Angle 0 = top (12 o'clock), clockwise
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + Math.cos(rad) * radius,
    y: cy + Math.sin(rad) * radius,
  };
}

// Triangle vertices (B, G, Eb positions on the circle)
const triangleVertices = [
  getCirclePoint(KEY_CENTER_ANGLES.B, circleRadius, centerX, centerY),
  getCirclePoint(KEY_CENTER_ANGLES.G, circleRadius, centerX, centerY),
  getCirclePoint(KEY_CENTER_ANGLES.Eb, circleRadius, centerX, centerY),
];
```

### Rendering Order

1. **Circle ring** — thin stroke, low opacity
2. **12 key labels** — positioned outside the ring
3. **Triangle** — connecting B, G, E♭ vertices. Base opacity 0.15, pulse to 0.8 on key change.
4. **3 key center dots** — at triangle vertices. Active one glows + scales.
5. **Orb trails** — fading polylines during slingshot
6. **7 orbs** — filled circles with note labels

### Orb Initialization

Spawn 7 orbs around the first key center (B):

```typescript
function initOrbs(keyCenter: KeyCenter, cx: number, cy: number, circleRadius: number): GiantStepsParticle[] {
  const center = getCirclePoint(KEY_CENTER_ANGLES[keyCenter], circleRadius, cx, cy);
  const chord = GIANT_STEPS_PROGRESSION[0];
  const orbs: GiantStepsParticle[] = [];

  for (let i = 0; i < 7; i++) {
    const note = chord.notes[i % chord.notes.length];
    const freq = chord.frequencies[i % chord.frequencies.length];
    const orbitR = 30 + Math.random() * 70;  // 30–100px from center
    const angle = (i / 7) * Math.PI * 2;     // evenly spaced initially
    const angVel = 0.5 + Math.random() * 1.5; // 0.5–2.0 rad/s

    orbs.push({
      id: i,
      x: center.x + Math.cos(angle) * orbitR,
      y: center.y + Math.sin(angle) * orbitR,
      vx: 0,
      vy: 0,
      radius: 22 + Math.random() * 16,  // 22–38px
      note,
      frequency: freq,
      color: KEY_CENTER_COLORS[keyCenter],
      orbitRadius: orbitR,
      orbitAngle: angle,
      angularVelocity: angVel,
      trail: [],
      slingshotting: false,
    });
  }
  return orbs;
}
```

### Orbital Physics (Normal State)

```typescript
// Each frame, when NOT slingshotting:
for (const orb of orbs) {
  if (orb.slingshotting) continue;

  const center = getCirclePoint(KEY_CENTER_ANGLES[activeKeyCenter], circleRadius, cx, cy);

  // Advance orbit angle
  orb.orbitAngle += orb.angularVelocity * dt * 0.001;

  // Breathing: orbit radius oscillates ±10% with beat
  const breathPhase = (Date.now() % (60000 / bpm)) / (60000 / bpm);
  const breathMod = 1 + 0.1 * Math.sin(breathPhase * Math.PI * 2);
  const targetR = orb.orbitRadius * breathMod;

  // Target position
  const tx = center.x + Math.cos(orb.orbitAngle) * targetR;
  const ty = center.y + Math.sin(orb.orbitAngle) * targetR;

  // Spring toward target
  const ORBIT_SPRING = 0.05;
  orb.vx += (tx - orb.x) * ORBIT_SPRING;
  orb.vy += (ty - orb.y) * ORBIT_SPRING;

  // Damping
  orb.vx *= 0.9;
  orb.vy *= 0.9;

  orb.x += orb.vx * dt;
  orb.y += orb.vy * dt;
}
```

### Slingshot (Key Change)

```typescript
function triggerSlingshot(
  orbs: GiantStepsParticle[],
  fromKey: KeyCenter,
  toKey: KeyCenter,
  circleRadius: number,
  cx: number,
  cy: number,
  bpm: number,
) {
  const fromCenter = getCirclePoint(KEY_CENTER_ANGLES[fromKey], circleRadius, cx, cy);
  const toCenter = getCirclePoint(KEY_CENTER_ANGLES[toKey], circleRadius, cx, cy);

  // Direction from old center to new center
  const dx = toCenter.x - fromCenter.x;
  const dy = toCenter.y - fromCenter.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const nx = dx / dist;
  const ny = dy / dist;

  // Speed scales with BPM — faster tempo = faster slingshot
  const speed = 2 + (bpm / 320) * 4;  // 2–6 px/frame

  for (const orb of orbs) {
    orb.slingshotting = true;

    // Base velocity toward new center
    orb.vx = nx * speed * (0.8 + Math.random() * 0.4);
    orb.vy = ny * speed * (0.8 + Math.random() * 0.4);

    // Slight perpendicular spread for visual variety
    const perpX = -ny;
    const perpY = nx;
    const spread = (Math.random() - 0.5) * speed * 0.3;
    orb.vx += perpX * spread;
    orb.vy += perpY * spread;

    // Update color to new key center
    orb.color = KEY_CENTER_COLORS[toKey];
  }
}

// In RAF loop — slingshot arrival detection:
for (const orb of orbs) {
  if (!orb.slingshotting) continue;

  const toCenter = getCirclePoint(KEY_CENTER_ANGLES[activeKeyCenter], circleRadius, cx, cy);
  const distToTarget = Math.hypot(orb.x - toCenter.x, orb.y - toCenter.y);

  // Trail recording
  orb.trail.push({ x: orb.x, y: orb.y, alpha: 0.4 });
  if (orb.trail.length > 30) orb.trail.shift();

  // Arrival: within orbit radius of new center → switch to orbital mode
  if (distToTarget < orb.orbitRadius + 20) {
    orb.slingshotting = false;
    // Dampen velocity for smooth orbit entry
    orb.vx *= 0.3;
    orb.vy *= 0.3;
    // Update orbit angle based on arrival position
    orb.orbitAngle = Math.atan2(orb.y - toCenter.y, orb.x - toCenter.x);

    // Play arrival note (soft)
    playRainNote(orb.note);  // reuse the rate-limited note player
  }

  // Gravity pull toward destination (helps orbs converge)
  const gx = (toCenter.x - orb.x) / distToTarget;
  const gy = (toCenter.y - orb.y) / distToTarget;
  orb.vx += gx * 0.1;
  orb.vy += gy * 0.1;

  orb.x += orb.vx * dt;
  orb.y += orb.vy * dt;
}
```

### Triangle Pulse

```typescript
const triangleOpacityRef = useRef(0.15);
const activeEdgeRef = useRef<[KeyCenter, KeyCenter] | null>(null);

// On key change:
function pulseTriangle(fromKey: KeyCenter, toKey: KeyCenter) {
  triangleOpacityRef.current = 0.8;
  activeEdgeRef.current = [fromKey, toKey];
}

// In render:
// Fade triangle opacity back toward 0.15
triangleOpacityRef.current += (0.15 - triangleOpacityRef.current) * 0.05 * dt;

// Draw triangle
ctx.beginPath();
ctx.moveTo(triangleVertices[0].x, triangleVertices[0].y);
ctx.lineTo(triangleVertices[1].x, triangleVertices[1].y);
ctx.lineTo(triangleVertices[2].x, triangleVertices[2].y);
ctx.closePath();
ctx.strokeStyle = '#F25C54';  // bittersweet
ctx.globalAlpha = triangleOpacityRef.current;
ctx.lineWidth = 1.5;
ctx.stroke();
ctx.globalAlpha = 1;

// If active edge, draw it brighter
if (activeEdgeRef.current) {
  const [from, to] = activeEdgeRef.current;
  const fromPt = getCirclePoint(KEY_CENTER_ANGLES[from], circleRadius, cx, cy);
  const toPt = getCirclePoint(KEY_CENTER_ANGLES[to], circleRadius, cx, cy);
  ctx.beginPath();
  ctx.moveTo(fromPt.x, fromPt.y);
  ctx.lineTo(toPt.x, toPt.y);
  ctx.strokeStyle = '#F25C54';
  ctx.globalAlpha = triangleOpacityRef.current * 1.5; // brighter
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}
```

### Key Center Dot Pop

```typescript
const keyCenterScaleRef = useRef<Record<KeyCenter, number>>({ B: 1, G: 1, Eb: 1 });

// On key change:
keyCenterScaleRef.current[newKey] = 1.5;

// In render (for each key center):
for (const key of ['B', 'G', 'Eb'] as KeyCenter[]) {
  const scale = keyCenterScaleRef.current[key];
  // Decay scale back to 1
  keyCenterScaleRef.current[key] += (1 - scale) * 0.1 * dt;

  const pos = getCirclePoint(KEY_CENTER_ANGLES[key], circleRadius, cx, cy);
  const isActive = key === activeKeyCenter;

  ctx.beginPath();
  ctx.arc(pos.x, pos.y, CENTER_DOT_RADIUS * scale, 0, Math.PI * 2);
  ctx.fillStyle = KEY_CENTER_COLORS[key];
  ctx.globalAlpha = isActive ? 0.9 : 0.3;
  ctx.fill();
  ctx.globalAlpha = 1;
}
```

### Shockwave Ring (on key change)

```typescript
interface Shockwave {
  x: number;
  y: number;
  startTime: number;
  color: string;
}

// On key change:
const pos = getCirclePoint(KEY_CENTER_ANGLES[newKey], circleRadius, cx, cy);
shockwavesRef.current.push({ x: pos.x, y: pos.y, startTime: Date.now(), color: KEY_CENTER_COLORS[newKey] });

// Render:
for (const sw of shockwavesRef.current) {
  const age = Date.now() - sw.startTime;
  const t = age / 500;  // 500ms duration
  if (t >= 1) continue;
  const radius = 10 + t * 80;  // expand from 10 to 90px
  const alpha = 0.4 * (1 - t * t * t);  // ease-out cubic fade
  ctx.beginPath();
  ctx.arc(sw.x, sw.y, radius, 0, Math.PI * 2);
  ctx.strokeStyle = sw.color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}
// Clean up
shockwavesRef.current = shockwavesRef.current.filter(sw => Date.now() - sw.startTime < 500);
```

### Density Control (Tempo from Input)

```typescript
function computeBpm(): number {
  if (isMobile) {
    // Beta tilt → BPM
    const betaT = orientation.betaNorm; // 0–1
    return 80 + betaT * 240;  // 80–320
  } else {
    // Mouse Y → BPM
    const t = cursorY / canvasH;
    return 80 + t * 240;  // 80–320
  }
}
```

### Chord Dropdown

Same pattern as Code Chords. Show the current chord name and a colored indicator matching the key center color. User can click to manually jump to any of the 26 chords.

### Audio

```typescript
const MIN_NOTE_GAP = 100;
const lastNoteTimeRef = useRef(0);

function playGiantStepsNote(note: string) {
  if (!controlsRef.current.soundEnabled) return;
  const now = Date.now();
  if (now - lastNoteTimeRef.current < MIN_NOTE_GAP) return;
  lastNoteTimeRef.current = now;

  // Varied note durations (from Freeze & Release discovery)
  const durations = ['8n', '4n', '2n'];
  const duration = durations[Math.floor(Math.random() * durations.length)];
  playNote(note, duration);
}

// On key change (chord strum):
function handleKeyChange(newKey: KeyCenter, prevKey: KeyCenter) {
  if (!controlsRef.current.soundEnabled) return;
  const chord = GIANT_STEPS_PROGRESSION[indexRef.current];
  playChordStrum(chord.notes, chord.frequencies);
  pulseTriangle(prevKey, newKey);
  triggerSlingshot(orbsRef.current, prevKey, newKey, circleRadius, cx, cy, bpmRef.current);
}
```

### Metronome

```typescript
// At high BPM (>200), accent-only metronome:
// Beat 1: brush tick (accent). Beats 2-4: silent.
// At low BPM (≤200): standard brush on every beat.

function configureMetronome(bpm: number) {
  setMetronomeTempo(bpm);
  if (bpm > 200) {
    // Accent-only: handled by adjusting metronome gain pattern
    // Implementation depends on audioEngine.ts metronome internals
  }
}
```

---

## Step 6: Wire experiments.ts

Add the Giant Steps entry to `data/experiments.ts`. Use the existing structure as a reference. The sections array is `['Coltrane Circle', 'Three-Body Problem', 'Chromatic Bridges', 'Mirror Symmetry']` but only Section A is implemented in this phase.

---

## Step 7: Canvas Tap Burst

```typescript
function handleCanvasTap(x: number, y: number) {
  if (!audioStartedRef.current) {
    handleAudioStart();
    return;
  }

  // Spawn 3 extra orbs at tap location
  const chord = GIANT_STEPS_PROGRESSION[indexRef.current];
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const note = chord.notes[Math.floor(Math.random() * chord.notes.length)];
    const freq = chord.frequencies[Math.floor(Math.random() * chord.frequencies.length)];

    orbsRef.current.push({
      id: nextIdRef.current++,
      x: x + Math.cos(angle) * 10,
      y: y + Math.sin(angle) * 10,
      vx: Math.cos(angle) * 1.5,
      vy: Math.sin(angle) * 1.5,
      radius: 16 + Math.random() * 12,
      note,
      frequency: freq,
      color: KEY_CENTER_COLORS[activeKeyCenterRef.current],
      orbitRadius: 40 + Math.random() * 50,
      orbitAngle: angle,
      angularVelocity: 0.5 + Math.random() * 1.5,
      trail: [],
      slingshotting: false,
    });
  }

  // Extra orbs fade out after 4 seconds
  setTimeout(() => {
    orbsRef.current = orbsRef.current.slice(0, 7);  // keep only original 7
  }, 4000);
}
```

---

## Build Order

| Step | Task |
|------|------|
| 1 | Create `types.ts` — GiantStepsChord, GiantStepsParticle, KeyCenter |
| 2 | Create `giantStepsChordData.ts` — full 26-chord progression, key center colors, circle of fifths |
| 3 | Create `useGiantStepsProgression.ts` — BPM-synced, variable chord durations, key change callback |
| 4 | Create `GiantStepsSwitch.tsx` — section router |
| 5 | Scaffold `GiantSteps.tsx` — canvas, RAF, audio init, chord dropdown, controls context |
| 6 | Render circle of fifths — 12 labels, ring, triangle |
| 7 | Render key center dots — 3 dots with glow + scale animation |
| 8 | Initialize 7 orbs — orbital physics around first key center |
| 9 | Implement slingshot — key change triggers orb flight along triangle edge |
| 10 | Triangle pulse + shockwave ring on key change |
| 11 | Audio — chord strum on key change, arrival notes, metronome, density limiter |
| 12 | Interaction — mouse Y / tilt beta → tempo, tap burst |
| 13 | Wire `data/experiments.ts` |
| 14 | Test: 80, 160, 286, 320 BPM. Test slingshot overlap at high tempo. |
| 15 | `npm run build` — zero errors |

---

## What NOT to Do

1. **Don't reuse Code Chords' `PROGRESSION` or `useChordProgression`.** Giant Steps has its own progression and hook.
2. **Don't use fixed chord durations.** Some chords last 2 beats, some 4. Read `chord.beats`.
3. **Don't use abstract speed values.** BPM is literal. 160 means 160 beats per minute.
4. **Don't settle orbs instantly on key change.** The slingshot flight IS the visual. Orbs should be visibly in transit.
5. **Don't make the triangle invisible.** It's the signature visual. Always visible at low opacity.
6. **Don't forget the audio density limiter (100ms gap).** At 286 BPM with 7 orbs arriving, audio overload is real.
7. **Don't play audio when `soundEnabled === false`.** Check on ALL audio calls.
8. **Don't hard-code canvas center as circle center.** The circle should be positioned relative to canvas dimensions and responsive to resize.
9. **Don't skip trail recording during slingshot.** Trails during transit are a key visual.
10. **Don't wait for one slingshot to finish before starting the next.** At high tempo, slingshots overlap. Design for that.

---

## Acceptance Criteria

See `Specs/EXP03_GIANT_STEPS.md` — **18 criteria** (GS.A.1–GS.A.18).

---

## Builder Notes (shipped 2026-03-22)

### Deviations

| # | Spec Said | Builder Did | Why |
|---|-----------|-------------|-----|
| 1 | 7 orbiting orbs with slingshot physics | No orbs — triangle-only visualization | Cleaner and more legible. The triangle vertices (root, 3rd, 7th) ARE the visual, with dots that pulse when each note plays. |
| 2 | Static equilateral Coltrane triangle (B-G-E♭) | Dynamic triangle connecting root, 3rd, 7th of *current chord* | Different triangle shapes for maj7/dom7/min7 — the geometry IS the voicing. Much more interesting than a static triangle. |
| 3 | Mouse-Y-to-tempo + chord dropdown | BPM slider (80–320 range input) | Dropdown was useless since progression auto-advances. Mouse-Y felt arbitrary. Slider is more intuitive. Mobile still uses gyro beta. |
| 4 | Chord strum on key change | Staggered ascending note sequence (root → 3rd → 7th) on every chord | Feels like a scale. Each vertex pulses (scale 2.0 → 1.0 decay) when its note sounds. |
| 5 | Shockwave rings only on key center changes at B/G/E♭ | Shockwave rings at each note's position, staggered with audio | Ripples follow the triangle vertices, not fixed positions. Much more dynamic. |
| 6 | B, G, E♭ labels always highlighted | Only the 3 notes in the current chord triangle light up | Labels change with each chord, colored to match key center. Rest stay dim. |
| 7 | Trail afterimages during slingshot | No trails (no orbs to trail) | N/A — orbs were removed. |
| 8 | Tap/click spawns burst of 3 orbs | Tap/click starts audio context only | No orbs to spawn. |
| 9 | Metronome at default volume | Metronome lowered to -30 dB, note velocity raised to 0.9 | On mobile speakers, metronome was drowning out the chord tones. |

### Key Implementation Details

- **Variable beat durations:** Tonic chords on bars 3/7/9/11/13/15 last 4 beats; all others last 2. Progression hook uses `chord.beats` field: `(chord.beats * 60000) / bpm`.
- **Smooth angular lerp:** Triangle vertices lerp at speed 0.18 with shortest-path wrapping (if diff > 180°, go the short way around). Vertices sorted by angle before drawing to prevent line crossings.
- **Note-to-angle mapping:** `NOTE_TO_ANGLE` lookup table maps pitch classes to circle-of-fifths positions. `normalizePitch()` converts display names (E♭ → Eb, F♯ → F#) for set comparison.
- **`setMetronomeVolume(db)`** added to shared audioEngine.ts — lets each experiment set its own metronome level without changing the default for Code Chords.

### For Future Section Builders

- The shared infrastructure (chord data, progression hook, switch, experiment entry) is all in place. Future sections (B/C/D) only need to create their own `.tsx` component and uncomment the import in `GiantStepsSwitch.tsx`.
- `useGiantStepsProgression` provides `onChordChange` and `onKeyChange` callbacks, `setBpm`, `start`, `stop`, `jumpToChord`. Use `onChordChange` for per-chord visuals, `onKeyChange` for key-center-level events.
- The `giantStepsChordData.ts` has everything: 26-chord progression with `beats` field, `KEY_CENTER_COLORS`, `CIRCLE_OF_FIFTHS` positions, `KEY_CENTER_ANGLES`.
- Consider whether orbs add value to your section. They were removed from Section A because the triangle was sufficient. Sections B (Three-Body) and D (Mirror Symmetry) are explicitly orb-based, so they make sense there.
