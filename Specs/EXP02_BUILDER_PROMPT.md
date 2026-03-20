# EXP-02 — Collision Changes: Builder Prompt

## Your Mission

You are building **Experiment 02** for Juanemo — "Collision Changes", an interactive jazz harmony experiment. Glowing orbs drift in space, each tuned to a note in a jazz chord. When they collide, both notes sound through Tone.js. The chord progression cycles through ii-V-I-IV automatically, and the orbs retune with voice-leading. On desktop the cursor attracts orbs; on mobile, phone tilt shifts gravity. This is the first Juanemo experiment with SOUND.

## Required Reading (Do This First)

1. **Read `Specs/EXP02_COLLISION_CHANGES.md`** — end to end. This is the full spec with every task, data model, physics behavior, audio setup, and acceptance criterion. It is your single source of truth.

2. **Read `components/ExperimentFrame.tsx`** — your experiment renders INSIDE this frame. Do NOT build navigation, pagination, settings panel, meta labels, or any chrome. Your component just fills the content area.

3. **Read `data/experiments.ts`** — study the existing experiment entry and `SectionConfig` interface. You're adding a new entry here.

4. **Read `app/experiments/[slug]/page.tsx`** — you're adding a slug→component mapping.

5. **Read `lib/useDeviceOrientation.ts`** — you'll import this for mobile gyro input. Understand the API: `betaNorm`, `gammaNorm`, `permissionState`, `requestPermission`.

6. **Read `lib/ExperimentControlsContext.tsx`** — your component consumes `speed` (for tempo) and other shared controls.

7. **Glance at `components/experiments/GenerativeType.tsx`** — see how Experiment 01 integrates with ExperimentFrame (how it reads controls, handles sections, manages refs). Your experiment follows the same patterns but is in a dedicated folder with multiple files.

## What You Are Building

### 1. Install Tone.js

```bash
npm install tone
```

This is the first time audio enters the project. Tone.js wraps Web Audio API with synths, effects, and scheduling.

### 2. Audio Engine (`audioEngine.ts`)

Create a Tone.js setup with:
- **PolySynth** with triangle oscillator — warm, round jazz tone
- **Reverb** (decay 2.5s, wet 0.3) for space
- **FeedbackDelay** (8th note, feedback 0.15, wet 0.12) for depth
- Chain: synth → delay → reverb → destination
- `initAudio()` calls `Tone.start()` — MUST be triggered by user gesture
- `playDyad(freq1, freq2, velocity)` triggers two notes simultaneously
- `dispose()` cleans up everything — but does NOT close the AudioContext

### 3. Chord Data (`chordData.ts`)

The ii-V-I-IV progression in the key of C:
- **Dm7** (D F A C) — subdominant
- **G7** (G B D F) — dominant
- **Cmaj7** (C E G B) — tonic
- **Fmaj7** (F A C E) — subdominant

Each chord has notes, frequencies (Hz), and harmonic function. See the spec for exact values.

### 4. Physics Simulation (`useParticlePhysics.ts`)

A custom hook that manages 4+ orbs with:
- **Position + velocity** per particle, updated per frame via RAF
- **Damping**: velocity *= 0.998 per frame
- **Edge bounce**: coefficient of restitution 0.8
- **Inter-particle attraction**: weak inverse-square (G ≈ 0.5)
- **Gravity well**: cursor/touch/gyro position attracts orbs within 200px
- **Collision detection**: circle-circle (distance < sum of radii)
- **Elastic collision response**: standard 2D elastic math
- **Collision cooldown**: 300ms per orb pair (prevents rapid retriggering)
- **Delta-time stepping**: consistent physics regardless of frame rate
- Returns: particle array, collision events, methods to add particles and set gravity source

### 5. Canvas Rendering (`CollisionChanges.tsx`)

The main component renders a full-viewport `<canvas>`:
- **Orbs**: radial gradient circles, colored by harmonic function (Bone for tonic, Dun for subdominant, Bittersweet for dominant)
- **Glow**: canvas `shadowBlur` on each orb
- **Trails**: previous 4 positions at decreasing opacity
- **Collision flash**: orb brightness pulses to 1 on hit, decays over 300ms
- **Collision line**: brief faint line between colliding orbs (200ms)
- **Chord change flash**: full-canvas white overlay, 5% opacity, 200ms
- **Chord indicator**: top-right, small text showing current chord name

### 6. Chord Progression (`useChordProgression.ts`)

Timer-based:
- Advances chord index every N seconds (controlled by tempo)
- Tempo maps from the `speed` control: Slow → 8s, Medium → 5s, Fast → 3s per chord
- On change: retune particles via voice-leading (each particle moves to closest note in new chord)
- Frequency lerp over 500ms (smooth pitch slide)
- Update colors to match new harmonic function

### 7. Interaction

**Desktop:**
- `mousemove` → gravity well at cursor
- `click` → spawn orb (max 12, oldest fades if at max)

**Mobile (gyro):**
- `useDeviceOrientation` → `gammaNorm` shifts X gravity, `betaNorm` shifts Y gravity
- `tap` → spawn orb
- "Enable Motion" hint action (same pattern as Phase H)

**Fallback (gyro denied):**
- `touchmove` → gravity well at touch point
- Hint updates to "Drag to attract the orbs"

### 8. Audio Start UX

Web Audio requires a user gesture. On first click/tap/gyro grant:
- Call `Tone.start()`
- If AudioContext is suspended, show a centered overlay: "Tap anywhere to enable sound" (Dun, 40% opacity)
- Overlay disappears after first interaction, never returns

### 9. Registration

- Add experiment to `data/experiments.ts` array (first = newest, so home page redirects here)
- Add `sectionConfigs` with single section "A"
- Register slug in `app/experiments/[slug]/page.tsx`

## Component Structure

```
components/experiments/CollisionChanges/
  CollisionChanges.tsx           — Main component (canvas, RAF loop, interaction)
  CollisionChanges.module.css    — Styles (canvas sizing, overlay, chord indicator)
  useParticlePhysics.ts          — Physics simulation hook
  useChordProgression.ts         — Chord timing + voice-leading hook
  audioEngine.ts                 — Tone.js synth setup + note triggering
  chordData.ts                   — Progression data (chords, notes, frequencies)
  types.ts                       — Shared interfaces (Particle, Chord, etc.)
```

## ⚠️ What You Must NOT Break

1. **Experiment 01 (Generative Typography)** — every section, every interaction, every mobile behavior must work exactly as before
2. **ExperimentFrame** — pagination, settings panel, meta labels, section loader, keyboard shortcuts — all unchanged
3. **Gyro hook** — you're importing `useDeviceOrientation`, not modifying it
4. **Navigation** — DrawerNav, LogoMark, URL routing all untouched
5. **Build** — zero TypeScript errors, zero build errors

## Acceptance Criteria

1. Orbs float and collide — collisions produce jazz dyads via Tone.js
2. ii-V-I-IV progression cycles, orbs retune with voice-leading (pitch slides, not jumps)
3. Desktop: cursor attracts orbs, click spawns new orbs
4. Mobile: gyro tilt shifts gravity, tap spawns orbs
5. Gyro permission flow works ("Enable Motion" action, fallback on denial)
6. Audio starts on first user gesture — no autoplay violations
7. Audio cleans up on unmount — no lingering sounds
8. Tempo control works (Slow/Medium/Fast chord change speed)
9. Single "A" pagination tile rendered
10. ExperimentFrame meta, hints, instructions render correctly
11. 60fps on desktop and mobile
12. `prefers-reduced-motion`: simpler visuals, audio still works
13. `npm run build` — zero errors
14. Experiment 01 is completely unaffected

## Physics Tuning Guide

These values are starting points — tune by feel:

| Parameter | Start Value | Adjust If... |
|-----------|-------------|--------------|
| Inter-particle G | 0.5 | Too clustered → decrease. Too scattered → increase. |
| Cursor G | 0.5 | Too snappy → decrease. No pull → increase. |
| Attraction radius | 200px | Too much pull → shrink. Can't reach orbs → expand. |
| Damping | 0.998 | Orbs too fast → decrease. Too static → increase toward 1.0. |
| Bounce restitution | 0.8 | Too bouncy → decrease. Dead bounces → increase. |
| Collision cooldown | 300ms | Audio spam → increase. Missed collisions → decrease. |
| Initial velocity | ±0.5 | Adjust for desired drift speed. |
| Max orbs | 12 | Performance issues → reduce. Too sparse → increase. |

## When You're Done

Add your builder notes to the `Builder Notes` section at the bottom of `Specs/EXP02_COLLISION_CHANGES.md`. Document:

- Any deviations from the spec
- Tone.js version and any API surprises
- Physics values you settled on (G, damping, bounce)
- Synth settings (oscillator, envelope, effects)
- Performance notes (frame rate on devices tested)
- How you handled the audio start UX
- Known issues or trade-offs
- Recommendations for the next jazz experiment (what patterns to reuse, what to change)
