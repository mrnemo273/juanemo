# EXP-02 Section E: Magnets — Consonance/Dissonance Forces

**Status:** ✅ DONE
**Section letter:** E (fifth section in Code Chords)
**Slug:** `code-chords` (same experiment, new section)
**Depends on:** Section A (✅), Section B (✅), Section C (✅), Section D (✅)

---

## Summary

The physics IS the music theory. Each pair of orbs exerts attraction or repulsion based on the musical interval between their notes. Consonant intervals (perfect 5ths, octaves) pull orbs together. Dissonant intervals (tritones, major 7ths) push them apart. When the chord changes and orbs retune, all magnetic relationships reshuffle — what was consonant may become dissonant and vice versa. The star moment: two orbs that were repelling (tritone) suddenly attract (major 3rd) and rush toward each other.

This section reveals the harmonic structure of each chord through spatial arrangement. Consonant chords settle into stable clusters; dissonant voicings create restless, jittery motion.

---

## Architecture: Standalone Component

Same pattern as Sections B, C, and D:

```typescript
// CodeChordsSwitch.tsx
if (activeSection === 4) return <Magnets />;
if (activeSection === 3) return <Flock />;
if (activeSection === 2) return <GravityWell />;
if (activeSection === 1) return <PianoSplit />;
return <CollisionChanges />;
```

`Magnets.tsx` is a standalone component with its own canvas, RAF loop, and particle management. Imports from shared modules.

---

## Builder Reality (from Sections A–D)

| # | Reality | Impact on Magnets |
|---|---------|-------------------|
| R.1 | **Chords are user-driven only.** `jumpToChord(index)` via custom dropdown. | Same dropdown. |
| R.2 | **Audio starts on first chord pick.** `initAudio()` → `startMetronome()`. | Same pattern. |
| R.3 | **Custom dropdown** (bone/cream overlay). CSS from `CollisionChanges.module.css`. | Same dropdown. |
| R.4 | **Georgia italic chord label** at 6% opacity, 16% flash on chord change. | Same label. |
| R.5 | **Pass-through collisions** (from Section C). Overlapping orbs glow + fire audio. No physical separation. | Magnets is different — interval forces DO move orbs. But collision audio still uses pass-through glow (no bounce velocity exchange). The magnetic forces handle all movement. |
| R.6 | **Pause when settings open.** `controlsRef.current.paused` skips physics step. | Same pause guard. |
| R.7 | **Spawn spring animation.** `spawnScale = 1 - 0.7 * exp(-6t) * cos(t * π * 2.5)` over 250ms. | Same. |
| R.8 | **Viewport-responsive orb sizing.** `updateLocalOrbSizes(viewportWidth)` — duplicate locally. | Same pattern as Sections C and D. |
| R.9 | **No hint text.** Empty strings for hints in section config. | Same. |
| R.10 | **Mono synth path.** `playDyad`, `playNote`, `playChordStrum`. | Same. |
| R.11 | **Chord strum on selection.** Arpeggiated, 70ms stagger. | Same. |
| R.12 | **Metronome.** Start on first chord pick, tempo/TS from controls. | Same. |
| R.13 | **NOTE_COLORS map.** Direct note→hex mapping (Section C/D pattern). | Same. |
| R.14 | **Flight trails from Section D.** The Flock builder added 150-point bezier trails with NaN break markers for edge wrapping. | Magnets should NOT use flight trails — the visual focus is on the force lines between orbs, not individual paths. Keep it clean. |
| R.15 | **Grab-and-drag from Section D.** Flock lets you grab any orb and drag it. | Magnets DOES have drag interaction — drag to force dissonant orbs together. But the intent is different: you're overriding magnetic repulsion, not leading a flock. On release, natural forces resume. |
| R.16 | **Breathing modulation from Section D.** Boids weights oscillate with metronome. | Magnets should NOT have breathing — the forces are constant (based on intervals), not rhythmic. The "rhythm" comes from chord changes reshuffling all relationships. |

---

## Physics: Interval-Based Forces

### Consonance table

Add to `chordData.ts`:

```typescript
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

// 0 = maximally dissonant (tritone), 12 = maximally consonant (unison/octave)
export const CONSONANCE_TABLE: Record<number, number> = {
  0: 12,   // Unison
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

### Force calculation

For each pair of orbs, compute the interval in semitones, look up the consonance rating, then apply attraction (consonant) or repulsion (dissonant):

```typescript
const MAGNET_G = 0.08; // Magnetic force constant — tune this

function magnetForce(a: Particle, b: Particle): { fx: number; fy: number } {
  const semitonesA = noteToMidi(a.note);
  const semitonesB = noteToMidi(b.note);
  const interval = Math.abs(semitonesA - semitonesB) % 12;
  const consonance = CONSONANCE_TABLE[interval]; // 0–12
  const normalizedForce = (consonance - 6) / 6; // -1 (repel) to +1 (attract)

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const minDist = 30; // Prevent divide-by-zero and extreme forces at close range
  const safeDist = Math.max(dist, minDist);

  // Force magnitude: inverse-square, clamped
  const magnitude = normalizedForce * MAGNET_G / (safeDist * safeDist) * 10000;
  const clampedMag = Math.max(-0.3, Math.min(0.3, magnitude));

  // Direction: attract = toward other, repel = away from other
  return {
    fx: (dx / safeDist) * clampedMag,
    fy: (dy / safeDist) * clampedMag,
  };
}
```

### Per-frame step

```typescript
function stepMagnets(particles: Particle[], dt: number, canvasW: number, canvasH: number) {
  // Calculate magnetic forces for all pairs
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const force = magnetForce(particles[i], particles[j]);
      particles[i].vx += force.fx * dt;
      particles[i].vy += force.fy * dt;
      particles[j].vx -= force.fx * dt;
      particles[j].vy -= force.fy * dt;
    }
  }

  // Update positions + damping
  for (const p of particles) {
    p.vx *= DAMPING;
    p.vy *= DAMPING;

    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > MAX_SPEED) {
      p.vx = (p.vx / speed) * MAX_SPEED;
      p.vy = (p.vy / speed) * MAX_SPEED;
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Edge bounce (not wrapping — magnets should stay in view)
    if (p.x < p.radius) { p.x = p.radius; p.vx *= -0.5; }
    if (p.x > canvasW - p.radius) { p.x = canvasW - p.radius; p.vx *= -0.5; }
    if (p.y < p.radius) { p.y = p.radius; p.vy *= -0.5; }
    if (p.y > canvasH - p.radius) { p.y = canvasH - p.radius; p.vy *= -0.5; }
  }
}
```

**Edge bounce, not wrapping** — unlike Flock, magnetic orbs should stay visible so the user can see the spatial arrangement that the interval forces create. Orbs bouncing off edges with low restitution (0.5) keeps them on screen without the jitter that Section C experienced (magnetic forces are gentler than orbital positioning).

### Chord change reshuffling

When the user picks a new chord, orbs retune via voice-leading (same as all sections). The critical visual moment:

1. Before chord change: orbs have settled into a stable spatial arrangement based on the old chord's intervals
2. After retune: all intervals change simultaneously. Orbs that were attracting may start repelling and vice versa.
3. The spatial rearrangement happens over 1–2 seconds as forces pull/push orbs to their new equilibrium

The most dramatic case: during G7, B4 and F4 form a tritone (6 semitones, consonance 0, maximum repulsion). When it changes to Cmaj7, those notes retune to C4 and E4 — a major 3rd (consonance 8, strong attraction). The two orbs that were flying apart suddenly snap together.

---

## Interaction

### Desktop — drag to override

Click-drag an orb to force it to a new position. While dragging:
- The dragged orb follows the cursor (lerp, same as Flock's grab)
- Magnetic forces on the dragged orb are suspended
- Other orbs still react to the dragged orb's position (they're attracted/repelled from wherever you hold it)
- On release: natural magnetic forces resume. If you held a dissonant pair together, they spring apart dramatically.

This is the key interaction: forcing dissonant orbs together creates tension you can hear (dyad fires on overlap), and releasing them creates a satisfying visual snap.

### Desktop — cursor attractor (gentle)

When not dragging, cursor applies a mild global pull (CURSOR_G = 0.05, weaker than Section A) — just enough to nudge the equilibrium without overriding the magnetic structure.

### Mobile — tap to pin/unpin

Tap an orb to pin it in place. While pinned:
- The orb stays fixed
- Other orbs still react to its position
- Tap again to unpin — natural forces resume

Pinning a dissonant orb near a consonant cluster creates tension. Unpinning lets it fly away.

### Mobile — tilt

Gyro adds a weak global directional force (same as Section A), but magnetic forces dominate. The tilt just shifts the equilibrium position slightly.

---

## Visuals

### Orb rendering
Same as other sections: flat fill + vibrant stroke + note label. Per-note colors from NOTE_COLORS map. Viewport-responsive sizing.

### Force lines between pairs

The visual signature of this section. For each pair of orbs, draw a line between them whose style indicates the relationship:

**Consonant pairs (normalizedForce > 0):**
- Solid line
- DUN color
- Opacity proportional to consonance: perfect 5th = 8%, major 3rd = 6%, minor 3rd = 4%
- Width: 1px

**Dissonant pairs (normalizedForce < 0):**
- Dashed line (4px dash, 3px gap)
- BITTERSWEET (#F25C54) color
- Opacity proportional to dissonance: tritone = 8%, major 7th = 6%, minor 2nd = 5%
- Width: 1px

**Neutral pairs (normalizedForce ≈ 0):**
- No line

This creates a visible web of relationships. When the chord changes, the entire web reshuffles — lines change color, style, and opacity.

### Collision glow
Pass-through: overlapping orbs brighten. Collision line (200ms fade). Same as Sections C and D.

### Chord change flash
When the chord changes, briefly flash all force lines to higher opacity (3× normal, 300ms fade) to highlight the reshuffle moment.

### Chord label
Georgia italic, centered, 6% opacity, 16% flash on change.

### Background
Gunmetal (#1F2627).

---

## New Code in chordData.ts

Add `noteToMidi()` and `CONSONANCE_TABLE` as exports. These are generally useful and may be used by future sections.

---

## Section Config

```typescript
{
  letter: 'E',
  name: 'Magnets',
  hint: '',
  hintMobile: '',
  hintActionMobile: '',
  description:
    'Consonant intervals attract, dissonant intervals repel. The physics IS the music theory. Watch orbs snap together when a chord change resolves a tritone into a major third.',
  instructions: [
    { icon: 'cursor', text: '<strong>Drag two orbs together</strong> — force a dissonant collision, then release' },
    { icon: 'eye', text: '<strong>Solid lines</strong> = attraction (consonant) · <strong>Dashed lines</strong> = repulsion (dissonant)' },
    { icon: 'refresh', text: '<strong>Pick a chord</strong> — all magnetic relationships reshuffle' },
  ],
  instructionsMobile: [
    { icon: 'cursor', text: '<strong>Tap an orb</strong> to pin it in place — tap again to release' },
    { icon: 'move', text: '<strong>Tilt</strong> adds a gentle directional bias' },
    { icon: 'eye', text: 'Watch the snap when chord changes resolve a tritone' },
  ],
  controls: ['tempo', 'timeSignature', 'decay', 'reverb'],
}
```

---

## Files Created / Modified

| File | Action | Notes |
|------|--------|-------|
| `components/experiments/CollisionChanges/Magnets.tsx` | **Create** | Standalone component — canvas, magnetic physics loop, chord dropdown, audio hookup |
| `components/experiments/CollisionChanges/CodeChordsSwitch.tsx` | **Edit** | Add `activeSection === 4` → `<Magnets />` |
| `data/experiments.ts` | **Edit** | Add 'Magnets' to `sections` array (index 4), add section config to `codeChordsSectionConfigs` (index 4) |
| `components/experiments/CollisionChanges/chordData.ts` | **Edit** | Add `noteToMidi()` and `CONSONANCE_TABLE` exports |
| `components/experiments/CollisionChanges/audioEngine.ts` | **No changes** | Mono synth path |
| `components/experiments/CollisionChanges/useChordProgression.ts` | **No changes** | Same API |
| `components/experiments/CollisionChanges/types.ts` | **No changes** | Existing fields sufficient (vx/vy for magnetic motion) |

---

## Acceptance Criteria

1. Tile E appears in pagination bar (A, B, C, D, E)
2. Seven orbs move under magnetic forces — consonant pairs visibly attract, dissonant pairs visibly repel
3. Force lines visible between all pairs: solid DUN for consonant, dashed BITTERSWEET for dissonant
4. Chord change reshuffles all relationships — force lines change color/style
5. Tritone-to-major-3rd resolution creates visible snap (orbs rush together)
6. Desktop: click-drag overrides magnetic forces; release resumes them
7. Desktop: releasing a forced-together dissonant pair creates dramatic spring-apart
8. Mobile: tap to pin/unpin an orb
9. Mobile: tilt adds gentle directional bias
10. Pass-through collision audio — overlapping orbs glow + `playDyad()` with 600ms cooldown
11. Custom chord dropdown — retunes orbs, plays chord strum
12. Georgia italic chord label at 6% opacity, 16% flash on change
13. Edge bounce (not wrapping) — orbs stay visible on canvas
14. Chord change flash: force lines briefly brighten (3×, 300ms fade)
15. Metronome starts on first chord pick
16. Pause when settings panel opens
17. Spawn spring animation on initial orb placement
18. Viewport-responsive orb sizing
19. `noteToMidi()` and `CONSONANCE_TABLE` added to `chordData.ts`
20. Section transition works to/from E
21. Deep link `#E` loads Magnets directly
22. Sections A–D still work identically
23. `npm run build` — zero errors
24. 60fps on desktop and mobile

---

## Builder Notes

### Architecture pivot: spring equilibrium model

The original spec called for pure attract/repel forces (consonant → attract, dissonant → repel). In practice this was fundamentally unstable: consonant clusters collapsed into dead blobs and drifted as a unit to corners, while dissonant orbs were expelled to edges with no way to return. After several failed attempts to patch the issue (edge repulsion, center pull, range cutoffs), the entire force model was **rewritten as a spring equilibrium system**.

Every pair of orbs has a **rest distance** determined by consonance:
- Consonant intervals → short rest distance (~130px), orbs want to be close
- Dissonant intervals → long rest distance (~320px), orbs want to be far
- Both attract when too far AND repel when too close — nothing escapes

This is the single biggest deviation from the spec and the key insight of the implementation.

### Tangential orbiting

50% of the spring force is diverted perpendicular to the pair axis (`TANGENT_RATIO = 0.5`). This prevents consonant pairs from collapsing to a dead point — instead they dance around each other in a continuous orbit.

### Beat-synced breathing (deviation from spec R.16)

The spec explicitly stated "Magnets should NOT have breathing." However, without breathing the system reached equilibrium quickly and became a static constellation. **Rest distances now oscillate ±25% with the metronome tempo** (cosine wave per beat), which periodically pushes orbs into collision range and keeps the system alive.

### Collision energy bursts

When two orbs collide, nearby orbs within 250px receive an outward impulse (`COLLISION_PUSH = 1.5`). This creates cascading motion — one collision destabilizes neighbors, triggering chain reactions that prevent the system from going still.

### Duplicate-note collision fix

Unison pairs (two G's, two C's in Cmaj7) have consonance 12 and REST_DIST_MIN of 80px initially, which was less than combined orb radii (~80px). This caused permanent overlap and constant collision triggering. Fixed by increasing `REST_DIST_MIN` to 130px.

### Force line styling

Final force lines are uniform **0.5px keylines** (not the 1–2px range initially coded):
- Solid cream (`DUN`) for consonant intervals
- Dashed red (`BITTERSWEET`) for dissonant intervals
- Flash brighter on collision

### Final physics constants

```
SPRING_K = 0.003      REST_DIST_MIN = 130     REST_DIST_MAX = 320
TANGENT_RATIO = 0.5   DAMPING = 0.995         MAX_SPEED = 3.0
THERMAL_JITTER = 0.02 CENTER_PULL = 0.005     CURSOR_G_MILD = 0.06
BREATH_DEPTH = 0.25   COLLISION_PUSH = 1.5    COLLISION_COOLDOWN = 600ms
```

### Shared utilities

`noteToMidi()` and `CONSONANCE_TABLE` were added to `chordData.ts` as shared exports rather than local to Magnets, since future sections may need interval-based logic.

### Mobile tuning (post-launch fix)

Initial mobile orbs were too small (~28px radius) and rest distances too large (130–320px) for the smaller viewport, resulting in very few collisions. Fixed by:

- **Orb radius mobile floor**: 28px → 36px (via `updateLocalOrbSizes`)
- **REST_DIST_MIN on mobile**: 130px → 90px
- **REST_DIST_MAX on mobile**: 320px → 200px
- Both scale up to desktop values via viewport-width interpolation

### Mobile touch: drag + pin coexistence

The original spec called for tap-to-pin on mobile, but drag-to-move was missing. Now both work via a `touchDragged` flag:
- **Touch start** → sets `grabbedIdRef` (orb follows finger)
- **Touch move** → sets `touchDragged = true`, updates cursor position
- **Touch end** → if `touchDragged` is false (was a tap), toggles pin; always clears grab
