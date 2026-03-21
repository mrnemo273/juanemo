# EXP-02 Section F: Freeze & Release — Silence as Music

**Status:** 🔵 IN PROGRESS
**Section letter:** F (sixth section in Code Chords)
**Slug:** `code-chords` (same experiment, new section)
**Depends on:** Section A (✅), Section B (✅), Section C (✅), Section D (✅), Section E (✅)

---

## Summary

Silence is music too. Tap or click anywhere to freeze all orbs in place — motion stops, sound stops, but the chord progression keeps ticking in the background. The longer you hold the silence, the more energy builds. Release and the orbs burst outward in a flurry of collisions, sound, and light. The musical context may have changed during the silence — what was Dm7 when you froze might be G7 when you release, giving the burst a completely different harmonic character.

This is the simplest section mechanically — it's free-float physics (Section A) with a freeze/release toggle. The complexity is in the feeling: the tension of held silence, the anticipation of release, the satisfaction of the burst. It should feel like holding your breath and then exhaling.

---

## Architecture: Standalone Component

Same pattern as Sections B–E:

```typescript
// CodeChordsSwitch.tsx
if (activeSection === 5) return <FreezeRelease />;
if (activeSection === 4) return <Magnets />;
if (activeSection === 3) return <Flock />;
if (activeSection === 2) return <GravityWell />;
if (activeSection === 1) return <PianoSplit />;
return <CollisionChanges />;
```

`FreezeRelease.tsx` is a standalone component with its own canvas, RAF loop, and particle management. Imports from shared modules.

---

## Builder Realities (from Sections A–E)

| # | Reality | Impact on Freeze & Release |
|---|---------|----------------------------|
| R.1 | **Chords are user-driven only.** `jumpToChord(index)` via custom dropdown. | Same dropdown. Chord changes still cycle via dropdown during freeze — the harmonic context shifts silently. |
| R.2 | **Audio starts on first chord pick.** `initAudio()` → `startMetronome()`. | Same pattern. Metronome keeps ticking during freeze (audio muted, but tempo tracking continues). |
| R.3 | **Custom dropdown** (bone/cream overlay). | Same dropdown. |
| R.4 | **Georgia italic chord label** at 6% opacity, 16% flash on chord change. | Same label. Label DOES update during freeze — the user sees the chord change even while frozen. This builds anticipation: "I froze on Dm7, now it says G7 — the release will sound different." |
| R.5 | **Pass-through collisions.** Overlapping orbs glow + fire audio. No physical separation. | Same pattern. During freeze: collision detection DISABLED (no glow, no audio). On release: detection resumes immediately — the initial scatter creates a burst of collisions. |
| R.6 | **Pause when settings open.** | Same. Settings open → freeze timer pauses too. |
| R.7 | **Spawn spring animation.** | Same. On initial load only. |
| R.8 | **Viewport-responsive orb sizing.** `updateLocalOrbSizes(viewportWidth)`. | Same pattern. |
| R.9 | **No hint text.** Empty strings in section config. | Same. |
| R.10 | **Mono synth path.** `playDyad`, `playNote`, `playChordStrum`. | Same. All audio silenced during freeze, resumes on release. |
| R.11 | **Chord strum on selection.** | During freeze: chord strum is SUPPRESSED (silent chord change). On release: NO extra strum — the collision burst IS the musical event. |
| R.12 | **Metronome.** Starts on first chord pick. | Metronome keeps running during freeze for tempo tracking but audio is suppressed. On release, metronome audio resumes. |
| R.13 | **NOTE_COLORS / HARMONIC_COLORS map.** | Same. |
| R.14 | **No flight trails.** Sections C and D had trails; Section E did not. | Freeze & Release uses SHORT burst trails on release only (see Visuals). No trails during normal free-float or while frozen. |
| R.15 | **Drag interaction varies per section.** A = cursor attractor, B = split gravity, C = slingshot, D = grab leader, E = drag/pin. | Freeze & Release: NO drag interaction. The ONLY interaction is freeze/release toggle. Simplicity is the point. Cursor/tilt provides gentle gravity during unfrozen state (same as Section A). |
| R.16 | **Spring equilibrium model (Section E).** Magnets used spring forces with rest distances + tangential orbiting. | NOT used. Freeze & Release uses Section A's simple free-float physics — random velocities, cursor/tilt gravity, pass-through collisions. The physics are intentionally simple so all attention goes to the freeze/release moment. |
| R.17 | **Beat-synced breathing (Section E).** Rest distances oscillate with tempo. | NOT used. Free-float has no rest distances. |
| R.18 | **Collision energy bursts (Section E).** Nearby orbs pushed outward on collision. | YES — carry this forward. On release burst, the cascade of collisions should push neighbors, creating chain reactions. Use `COLLISION_PUSH` from Magnets (1.5). |
| R.19 | **Mobile drag + pin coexistence (Section E).** Touch start → grab, touch end without drag → pin toggle. | NOT used. Mobile tap = freeze/release toggle. No dragging. |
| R.20 | **`soundEnabled` is now in ExperimentControlsContext.** The builder for the EXP-01 upgrade added `soundEnabled: boolean` to the shared controls. | Freeze & Release should respect `soundEnabled` — if sound is globally off, freeze/release still works visually but no audio fires on collision burst. |

---

## Physics: Free-Float + Freeze Toggle

### Base physics (unfrozen state)

Identical to Section A free-float:
- Random initial velocities
- Cursor/tilt gravity (same constants as Section A)
- Pass-through collision detection with audio
- Edge bounce with low restitution (0.5) — same as Magnets, keeps orbs visible
- Damping + speed cap
- Collision energy push (from Magnets) — nearby orbs pushed outward on collision

### Frozen state

When `frozen === true`:
- **Positions freeze** — `p.x` and `p.y` stop updating
- **Velocities are STORED** but not applied — they're used on release
- **Collision detection stops** — no audio, no glow
- **Chord progression keeps running** — dropdown still works, label updates, metronome tracks time internally
- **Audio output is suppressed** — metronome ticks and collision sounds are silenced
- **Gyro tilt is STORED** — on mobile, tilting while frozen doesn't move orbs but records the tilt vector for burst direction aiming

### Release mechanics

When transitioning `frozen → unfrozen`:

```typescript
const frozenDuration = Date.now() - freezeStartTime;

// Burst factor scales with silence duration: 0s → 1.5×, 3s+ → 2.5×
const burstFactor = 1.5 + Math.min(frozenDuration / 3000, 1.0) * 1.0;

for (const p of particles) {
  // Multiply stored velocities by burst factor
  p.vx *= burstFactor;
  p.vy *= burstFactor;

  // On mobile: add tilt-aimed velocity offset
  if (storedTiltVector) {
    p.vx += storedTiltVector.x * burstFactor * 0.5;
    p.vy += storedTiltVector.y * burstFactor * 0.5;
  }

  // Add slight random scatter to prevent parallel paths
  p.vx += (Math.random() - 0.5) * burstFactor * 0.3;
  p.vy += (Math.random() - 0.5) * burstFactor * 0.3;
}
```

### Freeze/release interaction

| Platform | Action | Effect |
|----------|--------|--------|
| Desktop | Click anywhere on canvas | Toggle freeze/release |
| Desktop | Press Space bar | Toggle freeze/release |
| Mobile | Tap anywhere on canvas | Toggle freeze/release |
| Mobile | Tilt while frozen | Aim burst direction (stored, applied on release) |

That's it. No dragging, no pinning, no multi-touch. The interaction is deliberately one-dimensional — the only question is "when do I release?"

---

## Visuals

### Unfrozen state (default)
Standard free-float rendering: orbs with flat fill + vibrant stroke + note label. Per-note colors. Gunmetal background.

### Frozen state

The visual shift should be immediate and dramatic — the user needs to SEE that the world has stopped.

**Orb crystalline effect:**
- Stroke alpha increases from 0.6 → 0.9 (brighter, more defined edges)
- Subtle inner shimmer: orb fill oscillates ±5% brightness at 3Hz (even though position is frozen, the orbs look "alive" — like ice catching light)
- Optional: 4 faint radial lines emanating from each orb (20px long, DUN at 5% opacity) — like frost crystals. Keep these simple; if they look bad, cut them.

**Background dim:**
- Canvas overlay: solid black at 3% opacity, drawn before orbs. Darkens the gunmetal background slightly. Creates a "held breath" atmosphere.

**Freeze indicator:**
- A small "FROZEN" label appears center-bottom of canvas. DM Sans, 10px, uppercase, letter-spacing 0.2em, DUN at 30% opacity. Fades in over 300ms. Fades out on release.
- Below it, a timer counting up: "0.0s", "0.5s", "1.0s"... showing how long the freeze has been held. Same style. This creates anticipation — the user watches the number climb and knows the burst gets bigger.

**Chord label during freeze:**
- Label still updates on chord change (dropdown still works)
- On chord change while frozen: label flashes to 16% as usual. This is a key tension-builder — you see the harmony shifting underneath the silence.

### Release burst

**Canvas flash:**
- Full-canvas white overlay at 8% opacity, fading to 0 over 200ms. Immediate visual pop.

**Burst trails:**
- On release, each orb gets a SHORT trail for 600ms only (not permanent):
  - 6 trail positions, sampled every 40ms
  - DUN color, 1px, dashed [6,8] pattern (consistent with Flock trails)
  - Alpha fades from 0.15 → 0 over the trail length
  - After 600ms, trail recording stops and remaining trail fades out over 200ms
- These trails show the explosion pattern — radial scatter from frozen positions

**Collision lines:**
- During the burst, collision lines render at higher opacity (0.4 instead of 0.2) for 400ms. The flurry of collisions creates a web of lines.

### Chord change flash during freeze
If the user changes the chord while frozen, force lines between orbs could briefly appear (300ms, same as Magnets chord change flash) to hint at the new harmonic relationships that will play out on release. This is optional — only implement if it looks good. It requires importing `noteToMidi` and `CONSONANCE_TABLE` to compute intervals, which adds complexity. Skip if it feels forced.

---

## Audio Behavior

| State | Metronome | Collision Audio | Chord Strum |
|-------|-----------|-----------------|-------------|
| Unfrozen | Playing | Active (on overlap) | On chord pick |
| Frozen | **Silent** (tracking internally) | **Disabled** | **Suppressed** |
| Release moment | Resumes immediately | Resumes — burst creates collision cascade | No extra strum |

The metronome needs to TRACK time during freeze even though it's silent, so that when it resumes, it's on beat. The simplest approach: don't stop the Tone.js Transport — just mute the metronome's output gain during freeze and unmute on release.

**Collision cascade on release:** The burst sends orbs flying, creating many collisions in quick succession. With 600ms cooldown per pair, the cascade should produce a staggered burst of dyads over ~1-2 seconds. This IS the musical payoff — the burst of sound after silence.

---

## Mobile-First Enhancements (from Playbook)

| Pattern | Implementation |
|---------|---------------|
| **P10: Stillness Reward** | This IS the section. Holding the phone still (frozen) builds energy. The freeze/release IS the stillness reward pattern. |
| **P6: Haptic Rhythm** | On release: haptic burst — `navigator.vibrate([30, 20, 50, 20, 80])` — escalating pulse matching the collision cascade. During freeze: no haptics. |
| **P1: Tilt-as-Physics** | During unfrozen: standard gravity tilt. During frozen: tilt aims the burst direction (stored vector). |

---

## Section Config

```typescript
{
  letter: 'F',
  name: 'Freeze & Release',
  hint: '',
  hintMobile: '',
  hintActionMobile: '',
  description:
    'Silence is music too. Freeze all motion — orbs hang in space, no sound. Release and they burst outward. The longer the silence, the bigger the burst.',
  instructions: [
    { icon: 'click', text: '<strong>Click anywhere</strong> or press <strong>Space</strong> to toggle freeze' },
    { icon: 'eye', text: '<strong>Longer freeze</strong> = more dramatic release burst' },
    { icon: 'refresh', text: '<strong>Change chords</strong> while frozen — the harmony shifts under the silence' },
  ],
  instructionsMobile: [
    { icon: 'click', text: '<strong>Tap anywhere</strong> to freeze and release' },
    { icon: 'move', text: '<strong>Tilt while frozen</strong> to aim the burst direction' },
    { icon: 'clock', text: 'Hold the silence — watch the timer build' },
  ],
  controls: ['tempo', 'timeSignature', 'decay', 'reverb'],
}
```

---

## Files Created / Modified

| File | Action | Notes |
|------|--------|-------|
| `components/experiments/CollisionChanges/FreezeRelease.tsx` | **Create** | Standalone component — canvas, free-float physics, freeze toggle, burst mechanics |
| `components/experiments/CollisionChanges/CodeChordsSwitch.tsx` | **Edit** | Add `activeSection === 5` → `<FreezeRelease />` |
| `data/experiments.ts` | **Edit** | Add 'Freeze & Release' to `sections` array (index 5), add section config to `codeChordsSectionConfigs` (index 5) |
| `components/experiments/CollisionChanges/audioEngine.ts` | **No changes** | Mono synth path. Mute/unmute metronome via gain node, don't stop Transport. |
| `components/experiments/CollisionChanges/useChordProgression.ts` | **No changes** | Same API |
| `components/experiments/CollisionChanges/types.ts` | **No changes** | Existing Particle fields sufficient (vx/vy for free-float + burst) |
| `components/experiments/CollisionChanges/chordData.ts` | **No changes** | `noteToMidi` + `CONSONANCE_TABLE` already added by Magnets (only needed if optional chord-change-while-frozen force lines are implemented) |

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| FR.1 | Tile F appears in pagination bar (A, B, C, D, E, F) |
| FR.2 | Seven orbs move under free-float physics in unfrozen state (same as Section A) |
| FR.3 | Click anywhere on canvas toggles freeze/release |
| FR.4 | Space bar toggles freeze/release on desktop |
| FR.5 | Tap anywhere toggles freeze/release on mobile |
| FR.6 | Frozen: all orb positions stop updating, no collisions detected, no audio |
| FR.7 | Frozen: orbs show crystalline effect (brighter stroke, inner shimmer at 3Hz) |
| FR.8 | Frozen: background dims slightly (black overlay 3%) |
| FR.9 | Frozen: "FROZEN" label + timer appears center-bottom, fades in 300ms |
| FR.10 | Frozen: timer counts up in 0.1s increments showing freeze duration |
| FR.11 | Frozen: chord dropdown still works, chord label updates + flashes |
| FR.12 | Frozen: metronome tracks time internally but produces no audible output |
| FR.13 | Release: burst factor scales with duration (1.5× at 0s, 2.5× at 3s+) |
| FR.14 | Release: orbs scatter with stored velocities × burst factor + random scatter |
| FR.15 | Release: canvas flash (white 8%, 200ms fade) |
| FR.16 | Release: short burst trails on each orb (6 positions, 600ms duration, then fade) |
| FR.17 | Release: collision cascade — staggered dyad audio over 1-2 seconds |
| FR.18 | Release: collision lines at elevated opacity (0.4) for 400ms |
| FR.19 | Mobile: tilt while frozen aims burst direction (applied on release) |
| FR.20 | Mobile: haptic burst on release — escalating vibration pattern |
| FR.21 | Collision energy push from Magnets — nearby orbs pushed on collision during burst |
| FR.22 | Edge bounce (not wrapping) — orbs stay visible |
| FR.23 | Respects `soundEnabled` from ExperimentControlsContext |
| FR.24 | Custom chord dropdown, Georgia italic label, spawn animation all present |
| FR.25 | Pause when settings open (freeze timer also pauses) |
| FR.26 | Section transition works to/from F |
| FR.27 | Deep link `#F` loads Freeze & Release directly |
| FR.28 | Sections A–E still work identically |
| FR.29 | `npm run build` — zero errors |
| FR.30 | 60fps on desktop and mobile |

---

## Builder Notes

*(To be filled in by the builder after implementation. Document all deviations from this spec.)*

### Deviations

| # | Spec Said | Builder Did | Why |
|---|-----------|-------------|-----|
| 1 | Timer text showing freeze duration ("0.0s", "1.0s"...) | Energy circle — arc ring that fills clockwise over 5s | Visual tension-building is far more compelling than a number. You watch it fill and feel the energy building. |
| 2 | Burst factor 1.5×–2.5× | Burst factor 2×–4× with higher speed cap (8 vs 2.5) | Original values felt underwhelming. The burst needs to feel explosive. |
| 3 | Canvas flash white 8%, 200ms | Canvas flash white 15%, 300ms | Stronger flash matches the more explosive burst. |
| 4 | No shockwave visual | Added shockwave ring expanding from center with ease-out cubic | Huge visual payoff on release — makes the burst feel physical. |
| 5 | Collision audio uses fixed 8th note duration | Collisions randomly play quarter, half, or whole notes | See discovery note below — this is a major musical improvement. |
| 6 | No auto-release | Auto-releases when energy circle fills (5s) | Creates a natural climax — max energy = max burst. Prevents indefinite freeze. |
| 7 | "FROZEN" label + timer at bottom | Energy circle only, no text label | Cleaner — the visual communicates the state without words. |
| 8 | No shockwave-triggered audio | Shockwave ring plays each orb's note as it passes (strum from center outward) | The ring becomes a musical event — closest orbs play first, creating an outward strum. |
| 9 | No shockwave physics | Orbs get velocity boost pushed outward from center when shockwave hits them | Makes the shockwave feel physical — orbs react to the wave, not just the initial burst. |
| 10 | Standard damping post-release | Ease-out damping — burst starts fast, aggressive damping ramps up over 600ms | Feels like a real explosion: violent start, smooth deceleration. |

### Discovery: Note Duration Variety

**Quarter, half, and whole notes on collision** — this was a huge win. The original `playDyad` always used 8th notes (`'8n'`), which made every collision sound identical. By randomly assigning `'4n'`, `'2n'`, or `'1n'` to each collision, the audio texture becomes dramatically richer. Some notes ring out briefly, others sustain and overlap, creating a much more organic and musical soundscape.

**This should be backwards-engineered into Sections A–E.** Every section currently uses fixed 8th notes for collisions. Adding duration variety via `playDyadDuration` would make all of them sound more like real music. The `audioEngine.ts` already has the `playDyadDuration` function — it just needs to be called from the other sections.

**Further exploration:** Consider tying note duration to collision properties — e.g., harder collisions play longer notes, or chord tones play longer than extensions. Could also map duration to orb size (bigger orbs = longer sustain). The goal is making the generative audio feel less like random bleeps and more like an improvising musician.

### Known Issues

- `ctx.letterSpacing` was dropped (limited browser support, not needed since FROZEN label was removed)
- Frost lines on frozen orbs are very subtle (5% opacity) — may be invisible on some displays. Could increase or cut entirely.

---

## Changelog

| Date | Entry |
|------|-------|
| 2026-03-21 | Initial spec created. 20 builder realities (A–E), 30 acceptance criteria. Free-float base physics + freeze toggle + burst mechanics. |
| 2026-03-21 | Built and shipped. 10 deviations from spec — all improvements. Key discovery: note duration variety (quarter/half/whole) makes audio dramatically more musical. Should backport to all sections. |
