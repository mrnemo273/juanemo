# EXP-02B Piano Split — Two-Handed Jazz Piano

> **Status:** 🔵 SPEC WRITTEN
> **Spec date:** 2026-03-20
> **Section letter:** B (inserted after A — existing B–F shift to C–G)
> **Depends on:** EXP-02A Tweaks (must be complete — metronome, controls, orb scaling)
> **Slug:** `code-chords` (same experiment, new section)

---

## ⚠️ Builder Reality — What Section A Actually Looks Like Now

The EXP-02A Tweaks builder made several significant deviations from the original spec. **Piano Split must build on the actual codebase, not the original spec.** Read this section carefully before anything else.

### 1. Chord changes are USER-DRIVEN ONLY (no auto-advance)

The builder **removed auto-advancing chord progression entirely.** There is no `progression.start()` call. Chords only change when the user picks one from the custom dropdown via `progression.jumpToChord(idx)`. The metronome keeps playing, but it doesn't trigger chord changes — it's purely rhythmic background.

**Impact on Piano Split:** When the user picks a chord from the dropdown, BOTH halves retune. There is no "both halves change chords on the beat" — the user controls when chords change. The metronome provides pulse but not chord timing.

### 2. Audio starts on chord selection (not tap-anywhere)

The "Tap anywhere to enable sound" overlay is gone. Audio initializes when the user first picks a chord from the dropdown (`handleChordPick` calls `handleAudioStart`). The `AudioContext` state is verified (`'running'` check) and retried on failure.

**Impact on Piano Split:** Same pattern — audio init + metronome start happens on first chord pick.

### 3. Chord strum on selection (`playChordStrum`)

When a chord is picked, the builder plays an arpeggiated strum (notes sorted low-to-high, 70ms stagger, 0.35 velocity, quarter-note duration). This is a nice touch.

**Impact on Piano Split:** The strum should be split stereo — bass notes strum through the left panner, treble notes through the right panner. Creates a stereo arpeggio effect.

### 4. Edge bounce audio (`playNote` + `edgeBouncesRef`)

Orbs play a single note when bouncing off canvas walls (not just on particle-particle collisions). Uses `playNote(freq, velocity)` with quieter volume (0.4× velocity, capped at 0.6, 16th-note duration). The physics hook exposes `edgeBouncesRef` with `{ frequency, velocity }` entries.

**Impact on Piano Split:** Edge bounces must route through the correct panner per side. Bass wall bounces → left panner. Treble wall bounces → right panner.

### 5. `paused: boolean` on ExperimentControls

When the settings panel opens, `paused` becomes `true`. The RAF loop skips physics stepping when paused, freezing orbs in place.

**Impact on Piano Split:** Must check `controlsRef.current.paused` in the RAF loop, same as Section A.

### 6. Spawn spring animation

Orbs pop in with a damped spring scale (250ms): `spawnScale = 1 - 0.7 * exp(-6t) * cos(t * π * 2.5)`. The `spawnTime` is reset in `retuneParticles` to replay the spring on chord change.

**Impact on Piano Split:** Both halves should use the same spring animation. Already in the rendering code — just make sure Piano Split's render loop includes it.

### 7. ExperimentFrame is now fixed-position (not CSS Grid)

Top bar and bottom bar are `position: fixed` with `z-index: 30`. Settings panel is `position: fixed` with `z-index: 25`, slides up from bottom with a gunmetal scrim (`rgba(31,38,39,0.55)`). Viewport uses `position: absolute` with calculated `top`/`bottom` offsets.

**Impact on Piano Split:** None directly — the canvas fills the viewport div as before. The frame changes are transparent to the experiment component.

### 8. Single PolySynth → delay → reverb chain

The audioEngine still has ONE `PolySynth` routed through one chain. Piano Split needs TWO synths + TWO panners, both feeding into the shared delay → reverb → destination.

### 9. Orb sizing scales to 3840px

`setOrbSizes(viewportWidth)` interpolates from 320px–3840px: min 20–100px, max 40–250px. Our 65% scale factor applies to these actual values.

### 10. Custom dropdown (not native `<select>`)

The chord dropdown is a custom-built overlay: bone/cream background, rounded corners, box-shadow, positioned next to the section name. Opens upward. Styled with `.chordDropdown`, `.chordToggle`, `.chordMenu`, `.chordOption` classes.

**Impact on Piano Split:** The dropdown is in the CollisionChanges component, not the ExperimentFrame. Piano Split needs its own dropdown (or reuses the same one if the component is shared via section switching).

### 11. Centered chord label uses Georgia italic

Not DM Sans as spec'd — uses `italic 72px Georgia, "Times New Roman", serif` (48px mobile), at 6% opacity (flashing to 16% on chord change over 500ms). Shows the full chord name (e.g., "Dm7"), not just the symbol.

**Impact on Piano Split:** Split into two labels — bass half shows root+quality, treble shows extension. Same Georgia italic font.

---

## Concept

Split the canvas in two to mimic a pianist's two hands. One half plays bass clef (left hand — roots, fifths, low voicings), the other plays treble clef (right hand — thirds, sevenths, ninths, upper extensions). Both halves share the same chord progression and metronome, locked in sync. Collisions within each half produce sound independently — bass notes ring deep on the left, treble notes sparkle on the right — but together they create a full piano voicing.

**Desktop:** Side by side — bass clef on the left, treble clef on the right. A thin vertical divider down the center.

**Mobile:** Stacked — treble clef on top (right hand), bass clef on the bottom (left hand). A thin horizontal divider across the center. This mirrors how a piano's treble is "above" the bass from the player's perspective.

Each half is its own physics world with a hard barrier at the divider. Orbs never cross. Smaller orbs than Section A (less space per half), but the same free-float collision physics within each half.

---

## Layout

### Desktop (>600px)

```
┌────────────────────┬────────────────────┐
│                    │                    │
│    BASS CLEF       │   TREBLE CLEF      │
│    (Left Hand)     │   (Right Hand)     │
│                    │                    │
│  roots, 5ths       │  3rds, 7ths, 9ths  │
│  lower octaves     │  upper octaves     │
│                    │                    │
└────────────────────┴────────────────────┘
         50%         ÷         50%
```

- Each half = `50% × 100%` of the canvas.
- Divider: 1px vertical line at `x = width/2`, color `--dun` at 8% opacity.
- Optional label: "L.H." / "R.H." in tiny text (9px, DM Sans, --dun at 12%) at the top of each half, fading out after 3 seconds.

### Mobile (≤600px)

```
┌────────────────────────────┐
│                            │
│       TREBLE CLEF          │
│       (Right Hand)         │
│                            │
├────────────────────────────┤
│                            │
│        BASS CLEF           │
│        (Left Hand)         │
│                            │
└────────────────────────────┘
           50%
           ÷
           50%
```

- Each half = `100% × 50%` of the canvas.
- Divider: 1px horizontal line at `y = height/2`, same styling.
- Treble on top, bass on bottom (piano orientation from the player's POV).

---

## Voicing Split

### How the chord is divided

For each chord in the ii-V-I-IV progression, split the voicing into bass and treble:

**Bass clef (left hand):**
- Root (fundamental frequency)
- 5th
- Root an octave lower (bass weight — `freq / 2`)
- Total: 3 orbs

**Treble clef (right hand):**
- 3rd
- 7th
- 9th (the extension note)
- 5th an octave higher (shimmer — `freq * 2`)
- Total: 4 orbs

This mirrors how a jazz pianist actually voices chords: the left hand anchors the harmony with root and fifth, while the right hand adds color with upper extensions.

### Frequency ranges

**Bass clef:** Frequencies roughly 87–350 Hz (low register). Orbs should feel "heavy" — slightly slower initial velocity, slightly larger radius relative to their half.

**Treble clef:** Frequencies roughly 330–1320 Hz (upper register). Orbs should feel "lighter" — slightly faster initial velocity, slightly smaller radius.

### Per-note colors

Same NOTE_COLORS palette as Section A — colors are per pitch class, so bass and treble orbs of the same note name share a color. This creates visual harmony across the divide.

---

## Orb Sizing

Each half has less space, so orbs must be proportionally smaller than Section A. Use the viewport-responsive sizing from T.5 but scale down:

```typescript
// Piano Split uses 65% of Section A's orb sizes
const SPLIT_SCALE = 0.65;

function setPianoOrbSizes(viewportWidth: number, isBassSide: boolean) {
  setOrbSizes(viewportWidth); // sets global ORB_RADIUS_MIN/MAX
  const min = Math.round(ORB_RADIUS_MIN * SPLIT_SCALE);
  const max = Math.round(ORB_RADIUS_MAX * SPLIT_SCALE);
  // Bass orbs slightly larger (feels heavier)
  if (isBassSide) {
    return { min: Math.round(min * 1.15), max: Math.round(max * 1.15) };
  }
  return { min, max };
}
```

On a 1440px screen:
- Section A orbs: ~38–80px
- Piano Split bass orbs: ~28–60px
- Piano Split treble orbs: ~25–52px

---

## Physics

### Per-half physics worlds

Each half runs its own independent physics simulation. They share the same constants as Section A (`INTER_PARTICLE_G`, `DAMPING`, `BOUNCE_RESTITUTION`, etc.) but operate within their own bounded rectangle:

**Desktop:**
- Bass: `{ x: 0, y: 0, w: width/2, h: height }`
- Treble: `{ x: width/2, y: 0, w: width/2, h: height }`

**Mobile:**
- Treble: `{ x: 0, y: 0, w: width, h: height/2 }`
- Bass: `{ x: 0, y: height/2, w: width, h: height/2 }`

### Hard barrier

Orbs bounce off the divider just like they bounce off walls. The divider IS a wall for collision purposes — same `BOUNCE_RESTITUTION`. No orb can cross it.

### Cursor/touch gravity

The cursor/touch gravity well only affects the half it's currently in. If the cursor is on the bass side, only bass orbs are attracted. This lets the user "conduct" each hand independently.

### Gyro (mobile)

Gyro tilt affects BOTH halves simultaneously — like tilting the whole piano. This is the one shared physics input.

---

## Audio

### Stereo panning

This is the key sonic difference from Section A:

- **Bass clef collisions:** Pan LEFT (-0.7). Sounds like the left side of a piano.
- **Treble clef collisions:** Pan RIGHT (+0.7). Sounds like the right side of a piano.

Use `Tone.Panner` nodes:
```typescript
const bassPanner = new Tone.Panner(-0.7);
const treblePanner = new Tone.Panner(0.7);

// Bass collision → route through bassPanner
// Treble collision → route through treblePanner
```

Both feed into the shared delay → reverb → destination chain.

### Synth voicing

**Bass clef synth:** Slightly different character — warmer, rounder.
- Use `FMSynth` with `harmonicity: 2` (vs 4 for treble). Lower harmonicity = warmer tone.
- Envelope: longer attack (0.005), longer decay (2.0), more sustain (0.05).
- Volume: -10dB (bass needs to be present).

**Treble clef synth:** Brighter, more percussive (matches Section A).
- Keep the current `FMSynth` with `harmonicity: 4`.
- Envelope: attack 0.001, decay 1.5, sustain 0.0.
- Volume: -14dB (treble shouldn't overpower bass).

### Shared metronome

Both halves share the SAME metronome from T.3. No changes to metronome behavior. The metronome is mono/center — it's the "conductor" that both hands follow.

### Shared chord progression (user-driven)

**Important:** Chords do NOT auto-advance. The user picks chords from the dropdown. When a chord is selected via `jumpToChord()`:
1. Bass orbs retune to the new chord's bass voicing (root, 5th, low root)
2. Treble orbs retune to the new chord's treble voicing (3rd, 7th, 9th, high 5th)
3. Same voice-leading logic — each orb slides to its closest target in the new voicing
4. A stereo chord strum plays: bass notes arpeggiate left, treble notes arpeggiate right

### Chord strum (stereo split)

When a chord is selected, Section A plays `playChordStrum(allFreqs)` through the single synth. Piano Split should split the strum:
- Bass notes (root, 5th, low root) strum through the bass synth → left panner
- Treble notes (3rd, 7th, 9th, high 5th) strum through the treble synth → right panner
- Same 70ms stagger, but the combined effect is a stereo arpeggio sweeping from left to right

### Edge bounce audio (stereo routed)

Section A plays `playNote(freq, velocity)` for wall bounces. Piano Split must route these through the correct panner:
- Bass orb hits wall → `playBassNote(freq, velocity)` → left panner
- Treble orb hits wall → `playTrebleNote(freq, velocity)` → right panner

---

## Rendering

### Canvas

Single `<canvas>` element spanning the full viewport (same as Section A). Draw both halves on the same canvas.

### Divider

After drawing all orbs, draw the divider line:
```typescript
// Desktop: vertical line at center
ctx.strokeStyle = 'rgba(214, 197, 171, 0.08)'; // --dun at 8%
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(w / 2, 0);
ctx.lineTo(w / 2, h);
ctx.stroke();

// Mobile: horizontal line at center
ctx.moveTo(0, h / 2);
ctx.lineTo(w, h / 2);
ctx.stroke();
```

### Collision lines

Collision lines only draw within their half — they don't cross the divider.

### Chord label

Two chord labels instead of one (from T.2):
- Bass half: show the chord root + quality in small text (e.g., "Dm" — no "7"), centered in the bass half, 8% opacity.
- Treble half: show the extension (e.g., "7/9"), centered in the treble half, 8% opacity.

Together they read as the full chord across the divide.

---

## Interaction

### Chord dropdown (from T.2)

Single dropdown — same as Section A. Selecting a chord retunes BOTH halves simultaneously.

### Touch on mobile

Touching either half activates the gravity well for that half only. Two-finger touch on separate halves could theoretically control both — but this is a stretch goal, not a requirement.

---

## Section Config

```typescript
{
  letter: 'B',
  name: 'Piano Split',
  hint: 'Two hands, one piano',
  hintMobile: 'Tilt to move both hands',
  hintActionMobile: 'Enable Motion',
  description:
    'The canvas splits into bass and treble clef — left hand and right hand of a jazz piano. Each side collides independently, but they share the same chord changes and metronome. Bass anchors the harmony with roots and fifths; treble adds color with thirds, sevenths, and ninths.',
  instructions: [
    { icon: 'cursor', text: '<strong>Hover either side</strong> — attract orbs on that half only' },
    { icon: 'eye', text: '<strong>Listen for stereo</strong> — bass pans left, treble pans right' },
    { icon: 'eye', text: 'Both hands change chords together on the beat' },
  ],
  instructionsMobile: [
    { icon: 'move', text: '<strong>Tilt</strong> — shifts gravity for both halves' },
    { icon: 'cursor', text: '<strong>Touch a side</strong> — attract orbs on that half' },
    { icon: 'eye', text: 'Bass below, treble above — like piano keys' },
  ],
  controls: ['tempo', 'timeSignature', 'decay', 'reverb'],
}
```

---

## Data Model Changes

### `data/experiments.ts`

Update `codeChordsSectionConfigs` array — insert Piano Split as index 1 (letter B). Update `sections` array on the experiment to include `'Piano Split'` after `'Collision Changes'`.

### Existing B–F → C–G

The 5 sections that were B–F in the previous spec shift to C–G:
- B Gravity Well → **C** Gravity Well
- C Flock → **D** Flock
- D Magnets → **E** Magnets
- E Freeze & Release → **F** Freeze & Release
- F Rain → **G** Rain

This affects `EXP02_SECTIONS_BF.md` — all letter references need updating. The builder for sections C–G should read both specs.

### PhysicsMode

Add `'pianoSplit'` to the PhysicsMode type:
```typescript
type PhysicsMode = 'freeFloat' | 'pianoSplit' | 'orbit' | 'flock' | 'magnets' | 'freezeRelease' | 'rain';
```

---

## Implementation Strategy

### Option 1: Two particle arrays (Recommended)

Maintain two separate particle arrays — `bassParticles` and `trebleParticles`. Each has its own `initParticles()`, and `step()` runs independently on each array. This is the cleanest separation and avoids complex boundary logic inside a single loop.

### Option 2: Single array with side tag

Each particle has a `side: 'bass' | 'treble'` field. The `step()` function only applies inter-particle forces between particles on the same side. Edge bouncing uses per-side bounds. This is simpler in some ways but messier in the physics loop.

**Go with Option 1** — two arrays. The code is longer but the physics is cleaner, the collision sound routing is simpler (bass collisions → bass panner, treble → treble panner), and it naturally maps to the two-hand metaphor.

---

## Task List

| ID | Task | Details |
|----|------|---------|
| PS.1 | Canvas split layout + divider rendering | Single canvas, draw divider line, detect which half cursor/touch is in |
| PS.2 | Dual particle arrays — bass + treble initialization | 3 bass orbs (root, 5th, low root), 4 treble orbs (3rd, 7th, 9th, high 5th) |
| PS.3 | Per-half physics step — independent collision + boundary | Same constants as Section A, bounded per half |
| PS.4 | Stereo panning — bass left, treble right | Two Tone.Panner nodes, routed to shared FX chain |
| PS.5 | Dual synth voices — warm bass, bright treble | FMSynth with different harmonicity + envelope per side |
| PS.6 | Shared chord progression — split voicing on change | Bass gets root/5th/low-root, treble gets 3rd/7th/9th/high-5th. User-driven via dropdown. |
| PS.6a | Stereo chord strum on selection | Bass notes strum left, treble notes strum right, 70ms stagger |
| PS.6b | Per-side edge bounce audio | Bass wall bounces → left panner, treble → right panner |
| PS.6c | Pause support | Respect `controls.paused` — freeze physics when settings panel is open |
| PS.7 | Cursor/touch gravity — per-half detection | Gravity well only affects the half it's in |
| PS.8 | Gyro gravity — shared across halves | Same tilt input for both sides |
| PS.9 | Section config + data model + letter shift | Insert at index 1, update sections array, shift B–F → C–G |
| PS.10 | Chord labels — split display per half | Root+quality on bass side, extension on treble side |

### Acceptance Criteria

1. Canvas visually splits in two (vertical on desktop, horizontal on mobile)
2. Divider line is visible but subtle (1px, --dun at 8%)
3. Bass half has 3 orbs (root, 5th, low octave root), treble has 4 (3rd, 7th, 9th, high 5th)
4. Orbs NEVER cross the divider
5. Collisions on each side produce sound independently
6. Bass collisions pan left, treble collisions pan right (audible stereo image)
7. Bass synth sounds warmer/rounder than treble synth
8. Both halves retune simultaneously when user picks a chord from dropdown
9. Voice-leading works correctly within each half
10. Cursor gravity only affects the half the cursor is in
11. Gyro tilt affects both halves
12. Metronome plays in center (mono), shared
13. All Section A controls work (tempo, time signature, decay, reverb)
14. Chord dropdown retunes both halves + plays stereo strum (bass left, treble right)
15. Section appears as "B" in the pagination bar
16. Mobile layout stacks treble above bass
17. Orb sizes are ~65% of Section A's sizes
18. Edge bounces play notes through the correct stereo panner per side
19. Physics pauses when settings panel is open (`paused: true`)
20. Spawn spring animation plays on orb init and chord retune
21. Chord label uses Georgia italic (matching Section A), split between halves

---

## ⚠️ What You Must NOT Break

1. **Section A** — must continue working exactly as before. Piano Split is a NEW section, not a modification.
2. **Metronome** — shared, not duplicated. Don't create a second Transport.
3. **Chord progression** — shared, not duplicated. Both halves read from the same progression.
4. **ExperimentFrame** — the only change is the data: new section in the array. No structural changes to the frame.
5. **Sections C–G (formerly B–F)** — the spec for these exists. Don't pre-build them, just make sure the section switching infrastructure supports them.

---

## Builder Notes

**Build date:** 2026-03-20
**Build status:** COMPLETE — `npm run build` passes with zero errors.

### Architecture

- **CodeChordsSwitch** (`CodeChordsSwitch.tsx`): New wrapper component reads `activeSection` from `ExperimentControlsContext`. Renders `CollisionChanges` (Section A, index 0) or `PianoSplit` (Section B, index 1). The experiment page (`app/experiments/[slug]/page.tsx`) now imports `CodeChordsSwitch` instead of `CollisionChanges` directly.

- **PianoSplit** (`PianoSplit.tsx`): Self-contained component with inline physics (no `useParticlePhysics` hook). Manages two separate `SplitParticle[]` arrays — `bassParticlesRef` and `trebleParticlesRef` — each stepped independently within bounded half-rects. This avoids modifying the shared physics hook and keeps Section A untouched.

- **Stereo audio** added to `audioEngine.ts` as additive functions. Original `playDyad()`, `playNote()`, `playChordStrum()` remain untouched for Section A. New: `initStereoSynths()`, `disposeStereoSynths()`, `playDyadStereo()`, `playNoteStereo()`, `playChordStrumStereo()`, `setDecayStereo()`.

### Stereo Panning Values

- Bass panner: **-0.7** (left)
- Treble panner: **+0.7** (right)
- Metronome: center (mono, unchanged)

### Synth Configs

| Parameter | Bass Synth | Treble Synth |
|-----------|-----------|--------------|
| harmonicity | 2 | 4 |
| modulationIndex | 0.6 | 0.8 |
| attack | 0.005 | 0.001 |
| decay | 2.0 | 1.5 |
| sustain | 0.05 | 0.0 |
| release | 2.5 | 2.0 |
| volume | -10 dB | -14 dB |

Both use `FMSynth` with `sine` oscillator, chained through their respective panner → shared delay → shared reverb → destination.

### Orb Size Tuning

- Split scale factor: **0.65** of Section A sizes
- Bass boost: additional **1.15×** on top of split scale (bass orbs ~75% of Section A, treble ~65%)
- Uses same viewport-responsive `setOrbSizes()` base calculation (320–3840px range)
- On a 1440px screen: bass orbs ~28–60px, treble orbs ~25–52px

### Voicing Split

Exactly as spec'd:
- Bass (3 orbs): root, 5th, root-8vb
- Treble (4 orbs): 3rd, 7th, 9th, 5th-8va

Voice-leading runs independently per half via greedy closest-frequency assignment.

### Deviations from Spec

1. **Inline physics instead of dual `useParticlePhysics` instances.** The hook wasn't designed for bounded sub-regions or dual instantiation. Rather than refactoring the shared hook, PianoSplit contains its own physics step function with identical constants. This keeps Section A completely untouched.

2. **NOTE_COLORS extended.** Added entries for `D3` and `A5` (octave doublings that Section A didn't need) to ensure all bass/treble orbs have correct colors.

3. **Chord label parsing.** Uses a regex to split chord name into root+quality and extension (e.g., "Dm7" → "Dm" + "7"). This handles all four progression chords correctly.

4. **L.H./R.H. labels.** Implemented as spec'd — 9px DM Sans, --dun at 12% opacity, fading out over 3 seconds from component mount.
