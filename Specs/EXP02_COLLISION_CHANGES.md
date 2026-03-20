# EXP-02 — Collision Changes: Jazz Harmony via Particle Collision

## Sprint Goal

Build the second experiment for Juanemo — a full-screen interactive piece where glowing orbs (each representing a chord tone) float in space with soft physics. When orbs collide, both notes sound simultaneously via Web Audio (Tone.js). Chord changes cycle on a classic ii-V-I-IV jazz progression, retuning the orbs every 4 bars. On mobile, gyro tilt shifts gravity to steer collisions. On desktop, the cursor acts as a gravitational well. This experiment establishes the Tone.js audio engine pattern that all future jazz experiments will build on.

## Status: `IN PROGRESS` 🔵

## Depends On: Phase H (complete ✅)

---

## Prerequisites

- Phase H is complete: all existing experiment infrastructure is live (ExperimentFrame, pagination, settings panel, gyro hook, mobile interaction patterns)
- Read `components/ExperimentFrame.tsx` — your experiment renders INSIDE this frame. You don't build navigation, pagination, settings panel, or meta labels. You just fill the viewport.
- Read `data/experiments.ts` — you're adding a new entry here and creating a new `sectionConfigs` array
- Read `lib/useDeviceOrientation.ts` — you'll use this for mobile gyro input
- Read `lib/ExperimentControlsContext.tsx` — your experiment consumes `speed`, `easing`, `shuffleKey`, `replayKey`, `activeSection`
- Read `app/experiments/[slug]/page.tsx` — you're registering a new slug→component mapping here

---

## Design Rationale

This is the first experiment that produces SOUND. It establishes patterns that every future jazz experiment will reuse:

1. **Tone.js integration** — how to load, initialize (user gesture requirement), manage synths, and clean up on unmount
2. **Physics engine** — lightweight 2D particle system with collision detection (reusable for Swing Pendulums, Chord Pool, etc.)
3. **Music theory data model** — chord progressions, voicings, note frequencies, MIDI-to-frequency conversion
4. **Audio-visual coupling** — how sound events map to visual events and vice versa

### Why ii-V-I?

The ii-V-I progression is the backbone of jazz harmony. It creates natural tension (ii → V) and resolution (V → I) that's satisfying even to untrained ears. The progression is:

| Bar | Chord | Notes (key of C) | Function |
|-----|-------|-------------------|----------|
| 1–2 | Dm7 | D F A C | ii (subdominant) |
| 3–4 | G7 | G B D F | V (dominant) |
| 5–6 | Cmaj7 | C E G B | I (tonic) |
| 7–8 | Fmaj7 | F A C E | IV (subdominant) |

After bar 8, loop back to Dm7. The 8-bar cycle gives users enough time to feel the changes.

---

## Technical Architecture

### New Dependencies

```bash
npm install tone
```

Tone.js v14+ — Web Audio framework. Handles AudioContext lifecycle, synth creation, scheduling, effects.

### AudioContext User Gesture Requirement

Web Audio requires a user gesture before the AudioContext can start. Tone.js handles this via `Tone.start()`. Strategy:

1. On first interaction (click, tap, or gyro permission grant), call `await Tone.start()`
2. Show a "Tap to start" overlay if audio context is suspended
3. Once started, audio is available for the rest of the session
4. On unmount, dispose all synths and effects — do NOT close the AudioContext (other experiments may need it)

### Component Structure

```
components/experiments/
  CollisionChanges/
    CollisionChanges.tsx       — Main component
    CollisionChanges.module.css — Styles
    useParticlePhysics.ts      — Physics simulation hook
    useChordProgression.ts     — Chord/note management hook
    audioEngine.ts             — Tone.js synth setup, note triggering
    chordData.ts               — Progression data, voicings, frequencies
    types.ts                   — Shared types (Particle, Chord, etc.)
```

### Why a folder, not a single file?

GenerativeType is a single 800+ line file. That worked for one experiment, but the jazz series involves physics, audio, and music theory — three distinct domains. Splitting into focused modules makes each piece testable and reusable. Future jazz experiments will import from `audioEngine.ts` and `chordData.ts`.

---

## Data Model

### Particle (Orb)

```ts
interface Particle {
  id: string;
  x: number;                    // Position
  y: number;
  vx: number;                   // Velocity
  vy: number;
  radius: number;               // Visual + collision radius (20–40px)
  note: string;                 // e.g. "D4", "F4", "A4"
  frequency: number;            // Hz — for Tone.js
  chordTone: 'root' | '3rd' | '5th' | '7th' | '9th';
  harmonicFunction: 'tonic' | 'subdominant' | 'dominant';
  color: string;                // Derived from harmonicFunction
  mass: number;                 // Affects collision physics
  brightness: number;           // 0–1, pulses on collision
}
```

### Chord

```ts
interface Chord {
  name: string;                 // e.g. "Dm7"
  symbol: string;               // e.g. "ii"
  notes: string[];              // e.g. ["D4", "F4", "A4", "C5"]
  frequencies: number[];        // Hz values
  harmonicFunction: 'tonic' | 'subdominant' | 'dominant';
}
```

### Progression

```ts
const PROGRESSION: Chord[] = [
  {
    name: 'Dm7', symbol: 'ii',
    notes: ['D4', 'F4', 'A4', 'C5'],
    frequencies: [293.66, 349.23, 440.00, 523.25],
    harmonicFunction: 'subdominant',
  },
  {
    name: 'G7', symbol: 'V',
    notes: ['G3', 'B3', 'D4', 'F4'],
    frequencies: [196.00, 246.94, 293.66, 349.23],
    harmonicFunction: 'dominant',
  },
  {
    name: 'Cmaj7', symbol: 'I',
    notes: ['C4', 'E4', 'G4', 'B4'],
    frequencies: [261.63, 329.63, 392.00, 493.88],
    harmonicFunction: 'tonic',
  },
  {
    name: 'Fmaj7', symbol: 'IV',
    notes: ['F3', 'A3', 'C4', 'E4'],
    frequencies: [174.61, 220.00, 261.63, 329.63],
    harmonicFunction: 'subdominant',
  },
];
```

---

## Visual Design

### Color Palette

Harmonic function determines orb color:

| Function | Color | Token | Meaning |
|----------|-------|-------|---------|
| Tonic (I) | Bone `#EBE2D6` | `--bone` | Resolution, home |
| Subdominant (ii, IV) | Dun `#D6C5AB` | `--dun` | Warmth, stability |
| Dominant (V) | Bittersweet `#F25C54` | `--bittersweet` | Tension, energy |

### Orb Rendering

- Each orb is a filled circle with a soft radial gradient (bright center → transparent edge)
- A subtle glow effect (CSS `box-shadow` or canvas shadow) makes them feel luminous
- On collision, the orb pulses brighter (brightness 0 → 1, decays over 300ms with ease-out)
- Orbs have a faint trail (previous 3–5 positions at decreasing opacity) for motion feel
- Background is `--gunmetal` (#1F2627) — same as all experiments

### Canvas vs DOM

Use `<canvas>` for the particle rendering — DOM elements would be too slow for 12+ moving orbs with trails and glow effects at 60fps. The canvas fills the ExperimentFrame viewport area (the content row of the 6-row grid).

### Chord Change Visual

When the progression advances:

1. A subtle flash across the entire canvas (white, 5% opacity, 200ms fade)
2. The chord name and symbol fade in at the bottom-left corner for 2 seconds: "Dm7 — ii"
3. Orbs smoothly retune — they don't teleport, their `note` and `frequency` properties lerp to the new chord tone over 500ms
4. Orb colors transition to reflect the new harmonic function

### Layout

The experiment fills the ExperimentFrame viewport (100% × 100%). No additional UI chrome beyond what ExperimentFrame provides (meta labels, pagination tiles, settings panel, hints).

A small chord indicator sits in the top-right corner of the canvas: current chord name (e.g., "Dm7") in DM Sans, 11px, 25% opacity Dun. Updates on each chord change with a crossfade.

---

## Physics Simulation

### Particle Behavior

- **Gravity:** None by default (space-like). On mobile, gyro tilt introduces directional gravity.
- **Drift:** Each orb has a small random initial velocity. They float lazily.
- **Attraction:** A gentle inter-particle attraction (inverse-square, very weak) keeps orbs loosely grouped. They shouldn't scatter to the edges.
- **Cursor/Tilt gravity well:** Desktop: cursor position is a gravitational attractor. Orbs within 200px are pulled toward it. Mobile: gyro tilt adds a gravity vector (gamma → X acceleration, beta → Y acceleration).
- **Bounce:** Orbs bounce off viewport edges with 0.8 coefficient of restitution (slight energy loss).
- **Damping:** Velocity is damped by 0.998 per frame to prevent orbs from accelerating infinitely.

### Collision Detection

- Circle-circle collision: distance between centers < sum of radii
- On collision:
  1. Both notes sound (Tone.js)
  2. Velocity-based dynamics: `velocity = Math.sqrt(vx² + vy²)`, mapped to MIDI velocity (30–100). Soft collision = quiet, hard collision = loud.
  3. Elastic collision response: orbs bounce apart using standard 2D elastic collision math (conserve momentum + energy)
  4. Both orbs pulse bright (brightness → 1, decays over 300ms)
  5. A faint line briefly connects the two orbs (200ms, fading from 30% to 0% opacity) — visual "dyad" indicator

### Collision Cooldown

Two specific orbs can only trigger sound once per 300ms (prevents rapid retriggering when they're in sustained contact). Track last collision time per pair.

### Frame Rate

Target 60fps. The physics step uses `requestAnimationFrame` with delta-time to ensure consistent simulation speed regardless of actual frame rate. If performance drops, reduce trail length first.

---

## Audio Engine

### Tone.js Setup

```ts
// audioEngine.ts

import * as Tone from 'tone';

// Synth: warm, round tone for jazz feel
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'triangle' },
  envelope: {
    attack: 0.02,
    decay: 0.3,
    sustain: 0.1,
    release: 0.8,
  },
  volume: -12,
});

// Reverb for space
const reverb = new Tone.Reverb({
  decay: 2.5,
  wet: 0.3,
});

// Slight delay for depth
const delay = new Tone.FeedbackDelay({
  delayTime: '8n',
  feedback: 0.15,
  wet: 0.12,
});

// Chain: synth → delay → reverb → destination
synth.chain(delay, reverb, Tone.getDestination());
```

### Note Triggering

```ts
function playCollisionNote(
  frequency: number,
  velocity: number,     // 0–1 (mapped from collision speed)
  duration: string = '8n'
) {
  // velocity maps to volume offset: soft collision = quieter
  const volumeOffset = Tone.gainToDb(velocity * 0.7 + 0.3); // Range: -10dB to 0dB
  synth.triggerAttackRelease(
    Tone.Frequency(frequency).toNote(),
    duration,
    Tone.now(),
    velocity
  );
}
```

### Dyad (Two-Note Collision)

When two orbs collide, both notes trigger simultaneously. Tone.PolySynth handles this — it can play multiple notes at once.

```ts
function playDyad(freq1: number, freq2: number, velocity: number) {
  playCollisionNote(freq1, velocity);
  playCollisionNote(freq2, velocity);
}
```

### Cleanup

On component unmount:
```ts
synth.dispose();
delay.dispose();
reverb.dispose();
```

Do NOT call `Tone.getContext().close()` — other experiments may use the same AudioContext.

---

## Interaction

### Desktop (Mouse)

- **Cursor = gravitational well:** Orbs within 200px are attracted toward the cursor. Attraction force = `G * mass / distance²` (G is a tuning constant, start with 0.5).
- **Click = spawn new orb:** Click anywhere to spawn a new orb at that position with a random chord tone from the current chord. Maximum 12 orbs. If at max, the oldest orb fades out (300ms) before the new one appears.
- **No click = passive observation:** The orbs drift and collide on their own. The experiment is enjoyable without any interaction.

### Mobile (Gyro + Touch)

- **Tilt = gravity direction:** Use `useDeviceOrientation` hook. `gammaNorm` (left-right tilt) → X acceleration. `betaNorm` (forward-back tilt) → Y acceleration. This shifts the gravity vector — tilting the phone causes orbs to drift toward that edge.
- **Tap = spawn new orb:** Same as desktop click.
- **"Enable Motion" action:** Same pattern as Phase H. If gyro permission hasn't been granted, show the inline action in the hint line.

### Gyro Fallback (Touch Drag)

If gyro is denied or unavailable:
- Touch-drag anywhere on the canvas to create a gravity well at the touch point (same as cursor on desktop)
- Hint updates to "Drag to attract the orbs"

---

## Sections

Unlike Experiment 01 (6 sections/variations), Collision Changes is a single full-screen experience. However, we still use the section system for future extensibility and to maintain consistency with ExperimentFrame.

### Section A — Collision Changes (Solo Section)

This experiment has only ONE section. The pagination tiles show a single "A" tile (active, no navigation needed). The settings panel shows experiment controls.

### Section Config

```ts
{
  letter: 'A',
  name: 'Collision Changes',
  hint: 'Move your cursor to attract the orbs',
  hintMobile: 'Tilt your phone to shift gravity',
  hintAction: undefined,
  hintActionMobile: 'Enable Motion',  // Only if gyro permission needed
  description: 'Glowing orbs float in space — each one a note in a jazz chord. Collisions sound both notes. The harmony cycles through a ii-V-I-IV progression every 8 bars.',
  instructions: [
    { icon: 'cursor', text: 'Move cursor to attract orbs' },
    { icon: 'click', text: 'Click to spawn a new orb' },
    { icon: 'eye', text: 'Watch for chord changes — orbs retune every 8 bars' },
  ],
  instructionsMobile: [
    { icon: 'move', text: 'Tilt phone to shift gravity' },
    { icon: 'click', text: 'Tap to spawn a new orb' },
    { icon: 'eye', text: 'Chord changes every 8 bars' },
  ],
  controls: ['tempo'],
}
```

### Controls

| Control | Type | Values | Effect |
|---------|------|--------|--------|
| Tempo | Segmented | Slow / Medium / Fast | Chord change interval: 8s / 5s / 3s per chord (32s / 20s / 12s full cycle) |

The existing `speed` control from ExperimentControlsContext maps to chord change tempo:
- Slow (8000ms) → 8s per chord
- Medium (4000ms) → 5s per chord
- Fast (2000ms) → 3s per chord

---

## Chord Progression Timing

### Automatic Chord Changes

The progression advances automatically on a timer. The current chord index (0–3) increments at the tempo interval and wraps around.

### Voice Leading

When the chord changes, orbs don't just snap to new notes. Each orb smoothly retunes to the closest note in the new chord (by frequency distance). This mimics jazz voice leading where notes move by the smallest interval possible:

| Dm7 → G7 | Voice Leading |
|-----------|--------------|
| D4 → D4 | Common tone (stays) |
| F4 → F4 | Common tone (stays) |
| A4 → G4 | Step down |
| C5 → B4 | Half-step down |

The frequency lerp happens over 500ms with ease-in-out — you hear a gentle pitch slide, not a jarring jump.

### Ninth Extensions

If the user spawns more than 4 orbs, additional orbs get chord extensions:
- 5th orb → 9th (E5 over Dm7, A4 over G7, D5 over Cmaj7, G4 over Fmaj7)
- Beyond 5: octave doublings of existing chord tones

---

## Experiment Registration

### data/experiments.ts

Add a new entry to the `experiments` array (newest first):

```ts
{
  slug: 'collision-changes',
  number: '02',
  name: 'Collision Changes',
  description: 'Jazz harmony through particle physics',
  longDescription: 'Glowing orbs float in zero gravity — each one a note in a jazz chord. When they collide, both notes ring out. The chord changes cycle through a classic ii-V-I-IV progression. Tilt your phone to shift gravity and conduct the collisions.',
  publishedDate: '2026-03-XX',   // Set actual date on deploy
  sections: ['Collision Changes'],
  sectionConfigs: [/* see Section Config above */],
}
```

### app/experiments/[slug]/page.tsx

Add to the component map:

```ts
import CollisionChanges from '@/components/experiments/CollisionChanges/CollisionChanges';

const experimentComponents: Record<string, React.ComponentType> = {
  'collision-changes': CollisionChanges,
  'generative-type': GenerativeType,
};
```

### generateStaticParams

The existing `generateStaticParams()` reads from the experiments array, so no changes needed there.

---

## Task List

### EXP02.1 — Project Setup

- [ ] `npm install tone`
- [ ] Create folder `components/experiments/CollisionChanges/`
- [ ] Create `types.ts` with Particle, Chord, and progression interfaces
- [ ] Create `chordData.ts` with the ii-V-I-IV progression data (notes, frequencies, harmonic functions)

### EXP02.2 — Audio Engine

- [ ] Create `audioEngine.ts`
- [ ] Set up PolySynth with triangle oscillator, ADSR envelope, reverb + delay chain
- [ ] `initAudio()` — calls `Tone.start()`, returns promise
- [ ] `playDyad(freq1, freq2, velocity)` — triggers two notes
- [ ] `dispose()` — cleans up synths and effects
- [ ] Export all functions for the main component
- [ ] Verify: AudioContext starts only after user gesture

### EXP02.3 — Physics Simulation

- [ ] Create `useParticlePhysics.ts` hook
- [ ] Initialize 4 particles (one per chord tone) at random positions with small random velocities
- [ ] Implement per-frame: position += velocity, velocity *= damping (0.998), edge bounce (0.8 restitution)
- [ ] Implement inter-particle attraction (weak inverse-square, G = 0.5)
- [ ] Implement gravitational well from cursor/touch/gyro input
- [ ] Circle-circle collision detection: distance < sum of radii
- [ ] Elastic collision response (momentum + energy conservation)
- [ ] Collision cooldown (300ms per pair)
- [ ] Delta-time frame stepping for consistent speed
- [ ] Returns: particle array, addParticle(), gravitySource setter

### EXP02.4 — Canvas Rendering

- [ ] Create `CollisionChanges.tsx` main component
- [ ] Full-viewport `<canvas>` element, ResizeObserver for sizing
- [ ] Render orbs: radial gradient fill, color by harmonic function
- [ ] Render glow: canvas shadowBlur or second pass with larger radius
- [ ] Render trails: previous 4 positions at decreasing opacity (20%, 12%, 6%, 2%)
- [ ] Collision flash: brightness pulse on hit (1 → 0 over 300ms, ease-out)
- [ ] Collision line: faint line between colliding orbs (200ms fade)
- [ ] Chord change flash: full-canvas white overlay (5% opacity, 200ms)
- [ ] Chord indicator: top-right corner, current chord name + symbol, crossfade on change
- [ ] Background: `--gunmetal` fill

### EXP02.5 — Chord Progression

- [ ] Create `useChordProgression.ts` hook
- [ ] Timer-based progression: advances chord index every N seconds (from tempo control)
- [ ] On chord change: retune particles via voice-leading (closest-note assignment)
- [ ] Frequency lerp over 500ms per particle
- [ ] Update particle colors to new harmonic function
- [ ] Support 9th extensions when > 4 particles
- [ ] Export: currentChord, chordIndex, nextChord (for anticipation UI if needed)

### EXP02.6 — Interaction (Desktop)

- [ ] Cursor position tracked via `mousemove` on the canvas
- [ ] Cursor acts as gravitational attractor (200px radius, tunable G constant)
- [ ] Click spawns new orb at click position with random chord tone from current chord
- [ ] Max 12 orbs — oldest fades out (300ms) before new one appears
- [ ] No interaction required — experiment is enjoyable as passive observation

### EXP02.7 — Interaction (Mobile)

- [ ] Import `useDeviceOrientation` hook
- [ ] `gammaNorm` → X gravity acceleration, `betaNorm` → Y gravity acceleration
- [ ] Tap spawns new orb (same as click)
- [ ] "Enable Motion" inline hint action (same pattern as Phase H)
- [ ] Gyro fallback: touch-drag creates gravity well at touch point
- [ ] Hint text updates per-state: gyro available → "Tilt your phone", denied → "Drag to attract", desktop → "Move your cursor"

### EXP02.8 — Experiment Registration

- [ ] Add experiment entry to `data/experiments.ts` (first in array = newest)
- [ ] Add `sectionConfigs` with section A config
- [ ] Register `collision-changes` → `CollisionChanges` in slug→component map
- [ ] Verify: home page redirects to this experiment (newest first)
- [ ] Verify: ExperimentFrame renders with correct meta, pagination (single "A" tile), settings panel

### EXP02.9 — Settings Panel Integration

- [ ] Tempo control in settings panel (Slow / Medium / Fast)
- [ ] Maps to chord change interval (8s / 5s / 3s)
- [ ] Panel shows experiment description and instructions
- [ ] Instructions swap desktop/mobile variants via existing `isMobileViewport()` pattern

### EXP02.10 — Audio Start UX

- [ ] On first interaction (click/tap/gyro grant), call `Tone.start()`
- [ ] If AudioContext is suspended, show a subtle overlay: "Tap anywhere to enable sound" — centered text, 40% opacity Dun, disappears on tap
- [ ] After audio starts, overlay never returns for the session
- [ ] Audio state persists across section navigation within the experiment

### EXP02.11 — Polish & Performance

- [ ] Verify 60fps on desktop Chrome, Safari, Firefox
- [ ] Verify 60fps on iOS Safari, Android Chrome
- [ ] Reduce trail length or glow complexity if frame drops detected
- [ ] `prefers-reduced-motion`: disable trails and glow, simplify to plain circles, keep audio
- [ ] Volume: ensure collision sounds are comfortable (not too loud). Default synth volume: -12dB.
- [ ] Verify: navigating away from experiment disposes audio (no lingering sounds)

### EXP02.12 — Build & QA

- [ ] `npm run build` — zero errors
- [ ] Test full progression cycle (all 4 chords, back to start)
- [ ] Test spawning orbs up to max (12), verify oldest removal
- [ ] Test chord change voice-leading — notes slide, don't jump
- [ ] Test mobile gyro interaction — gravity shifts with tilt
- [ ] Test gyro fallback — touch drag works after denial
- [ ] Test "Enable Motion" inline action flow
- [ ] Test audio cleanup on navigate away
- [ ] Test with `prefers-reduced-motion: reduce`
- [ ] Test ExperimentFrame integration: meta labels, pagination, settings panel
- [ ] Verify Experiment 01 (Generative Typography) still works perfectly

---

## Acceptance Criteria

1. Orbs float and collide — collisions produce jazz dyads via Tone.js
2. ii-V-I-IV progression cycles automatically, orbs retune with voice-leading
3. Chord change is visible (flash, chord indicator) and audible (orbs retune)
4. Desktop: cursor attracts orbs, click spawns new orbs
5. Mobile: gyro tilt shifts gravity, tap spawns orbs
6. Gyro permission flow matches Phase H pattern ("Enable Motion" hint action)
7. Touch fallback works on gyro denial
8. Audio starts on first user gesture — no autoplay issues
9. Audio cleans up on unmount — no lingering sounds
10. Tempo control in settings panel changes chord progression speed
11. Single "A" pagination tile — no dead tiles
12. ExperimentFrame meta labels, hint text, and instructions render correctly
13. 60fps on desktop and mobile
14. `prefers-reduced-motion` respected (simpler visuals, audio still works)
15. `npm run build` — zero errors
16. Experiment 01 (Generative Typography) is completely unaffected

---

## Files Created / Modified

| File | Action | Notes |
|------|--------|-------|
| `package.json` | **Edit** | Add `tone` dependency |
| `components/experiments/CollisionChanges/CollisionChanges.tsx` | **New** | Main component |
| `components/experiments/CollisionChanges/CollisionChanges.module.css` | **New** | Styles |
| `components/experiments/CollisionChanges/useParticlePhysics.ts` | **New** | Physics simulation hook |
| `components/experiments/CollisionChanges/useChordProgression.ts` | **New** | Chord management hook |
| `components/experiments/CollisionChanges/audioEngine.ts` | **New** | Tone.js synth setup |
| `components/experiments/CollisionChanges/chordData.ts` | **New** | Progression data |
| `components/experiments/CollisionChanges/types.ts` | **New** | Shared types |
| `data/experiments.ts` | **Edit** | New experiment entry + sectionConfigs |
| `app/experiments/[slug]/page.tsx` | **Edit** | Register slug→component |

---

## Design Tokens (Reference)

| Token | Value | Use |
|-------|-------|-----|
| `--gunmetal` | `#1F2627` | Background |
| `--bone` | `#EBE2D6` | Tonic orbs (I) |
| `--dun` | `#D6C5AB` | Subdominant orbs (ii, IV), text |
| `--bittersweet` | `#F25C54` | Dominant orbs (V), active states |
| `--outer-space` | `#364245` | UI chrome |
| Spring easing | `cubic-bezier(0.34, 1.56, 0.64, 1)` | UI transitions |
| Expo-out | `cubic-bezier(0.16, 1, 0.3, 1)` | Content transitions |

---

## Builder Notes

### Deviations from spec
- **Single-section hint bar**: ExperimentFrame only renders the bottom hint text and pagination tiles when `totalSections > 1`. Since this experiment has one section, the bottom hint bar and "A" tile don't render. The settings panel (gear icon) still works and shows description, instructions, and speed control. The chord indicator is rendered directly on the canvas.
- **`click` icon in instructions**: The ICON_PATHS map in ExperimentFrame doesn't include a `click` key — it falls back to the `eye` icon. Visually acceptable; a dedicated click icon could be added to ExperimentFrame in a future pass.
- **Chord indicator position**: Spec says "bottom-left for 2s" on chord change — implemented as persistent top-right (matching the later spec section that says "top-right corner"). The chord name + symbol is always visible, not just on change.

### Architecture decisions
- **Folder structure**: 7 files as spec'd — `types.ts`, `chordData.ts`, `audioEngine.ts`, `useParticlePhysics.ts`, `useChordProgression.ts`, `CollisionChanges.tsx`, `CollisionChanges.module.css`.
- **Audio engine is a module, not a hook**: Synth/effects are singleton module state rather than React state. This avoids re-creating Tone.js objects on re-render and makes `playDyad` callable from the RAF loop without stale closures.
- **Voice-leading**: Greedy closest-note assignment sorted by constraint level (most constrained particle assigned first). Works well for the 4-note ii-V-I-IV progression.
- **Frequency lerp**: Stored as start/target maps keyed by particle ID. Eased with quadratic ease-in-out over 500ms.

### Tone.js version + any API differences
- **Tone.js v15.1.x** (latest via npm). No API surprises — `PolySynth`, `FeedbackDelay`, `Reverb`, and `.chain()` all work as documented.
- `Tone.Frequency(freq).toNote()` correctly converts Hz to note names for `triggerAttackRelease`.

### Physics tuning values
| Parameter | Value |
|-----------|-------|
| Inter-particle G | 0.5 |
| Cursor G | 0.5 |
| Attraction radius | 200px |
| Damping | 0.998 per frame |
| Bounce restitution | 0.8 |
| Collision cooldown | 300ms |
| Initial velocity | ±0.5 |
| Max orbs | 12 |
| Orb radius | 22–34px |
| Delta-time cap | 3 frames (prevents physics explosion on tab-switch) |

### Audio: synth type, envelope values, effects chain
- **Synth**: `PolySynth(Synth)` with triangle oscillator
- **Envelope**: attack 0.02, decay 0.3, sustain 0.1, release 0.8
- **Volume**: -12dB base
- **Chain**: synth → FeedbackDelay (8n, feedback 0.15, wet 0.12) → Reverb (decay 2.5s, wet 0.3) → destination
- **Velocity mapping**: collision relative velocity / 5, clamped to [0.15, 1.0]

### Performance notes
- Canvas renders at 60fps on desktop Chrome/Safari. DPR-aware canvas sizing.
- Trail length capped at 5 positions. Glow uses canvas `shadowBlur` (GPU-accelerated on most browsers).
- `prefers-reduced-motion`: disables trails and glow, renders plain gradient circles only.
- Delta-time stepping ensures consistent physics at any frame rate.

### Known issues
- Touch interaction: `touchend` spawns orbs, but rapid taps can spawn multiple. The max-12 cap prevents overflow.
- The `click` icon fallback in ExperimentFrame instructions uses the `eye` icon — cosmetic only.
- Audio overlay disappears on first click even if `Tone.start()` fails (e.g., browser blocks audio entirely). The experiment is still visually functional without sound.

### Recommendations for next jazz experiment
- **Reuse `audioEngine.ts`**: The PolySynth + effects chain pattern is solid. Future experiments can swap oscillator type or add filters.
- **Reuse `chordData.ts`**: The progression data model and `voiceLeadAssignment()` function are generic. Add new progressions (blues, modal) as additional arrays.
- **Physics hook is portable**: `useParticlePhysics` can drive any particle-based experiment. Consider extracting to `lib/` if a third experiment needs it.
- **Consider Web Audio scheduling**: For rhythmic experiments (Swing Pendulums), use Tone.Transport for tempo-synced events rather than `setTimeout`.
- **Add a `click` icon to ExperimentFrame ICON_PATHS** for better instruction visuals.
