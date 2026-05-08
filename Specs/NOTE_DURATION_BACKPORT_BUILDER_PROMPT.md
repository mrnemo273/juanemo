# J.6 — Note Duration Variety Backport (EXP-02 Sections A–E) — Builder Prompt

**Status:** 🔲 TODO → building now
**Discovered in:** EXP-02F Freeze & Release builder
**Scope:** `components/experiments/CollisionChanges/` — Sections A through E only (F+G already have it)

---

## What You're Doing

Upgrading collision audio in EXP-02 Sections A–E from fixed 8th notes to varied durations (quarter/half/whole). Currently every collision plays `'8n'` — this makes the generative audio sound like random bleeps. The Freeze & Release builder discovered that using varied note durations makes it sound dramatically more musical, like an improvising musician.

**This is an audio-only change — no visual changes.**

---

## Background

The shared audio engine already has a duration-aware function:

**File:** `components/experiments/CollisionChanges/audioEngine.ts`

Look for `playDyadDuration` or similar. If it doesn't exist, you'll need to add a `duration` parameter to the existing `playDyad` and `playNote` functions. Check the current function signatures first.

Freeze & Release (Section F) and Rain (Section G) already use varied durations. Look at how they call the audio engine for reference.

---

## Duration Strategy Per Section

The goal is to tie note duration to **collision properties** — not random choice. Each section has different physics, so different properties are meaningful:

### Section A: CollisionChanges.tsx (Base Collisions)

**Map duration to collision velocity:**
```typescript
// Harder collision = longer sustain (more energy = more ring)
const speed = Math.hypot(orb1.vx - orb2.vx, orb1.vy - orb2.vy);
const duration = speed > 4 ? '1n' : speed > 2 ? '2n' : '4n';
```

### Section B: PianoSplit.tsx (Piano Split)

**Map duration to register:**
```typescript
// Bass register = longer notes, treble = shorter (mimics real piano)
const isBass = /* check if orb is in bass clef half */;
const duration = isBass ? '2n' : '4n';
// Chord tones get longer durations than passing tones
```

### Section C: GravityWell.tsx (Gravity Well)

**Map duration to orbital radius:**
```typescript
// Orbs farther from center have more orbital energy = longer ring
const distFromCenter = Math.hypot(orb.x - centerX, orb.y - centerY);
const maxDist = /* canvas half-dimension */;
const t = distFromCenter / maxDist;
const duration = t > 0.6 ? '1n' : t > 0.3 ? '2n' : '4n';
```

### Section D: Flock.tsx (Flock)

**Map duration to leader proximity:**
```typescript
// Collisions near the leader (root note) ring longer
const distFromLeader = Math.hypot(orb.x - leader.x, orb.y - leader.y);
const duration = distFromLeader < 80 ? '1n' : distFromLeader < 160 ? '2n' : '4n';
```

### Section E: Magnets.tsx (Magnets)

**Map duration to consonance:**
```typescript
// Consonant intervals (octave, 5th, 3rd) get longer durations
// Dissonant intervals (2nd, tritone) get shorter
const interval = Math.abs(noteIndex1 - noteIndex2) % 12;
const consonant = [0, 3, 4, 5, 7, 8, 9].includes(interval);
const duration = consonant ? '2n' : '4n';
// Or use the spring rest distance as a proxy — closer rest = more consonant = longer
```

---

## Step-by-Step

1. **Read `audioEngine.ts`** — understand the current `playDyad`, `playNote`, and any `playDyadDuration` functions. Check what parameters they accept.

2. **If needed, add duration support** — if the existing functions only accept fixed durations, add an optional `duration` parameter (default `'8n'` for backwards compatibility).

3. **Update Section A** — find all `playDyad` / `playNote` calls in `CollisionChanges.tsx`. Replace fixed duration with velocity-based duration.

4. **Update Section B** — same for `PianoSplit.tsx`. Use register-based duration.

5. **Update Section C** — same for `GravityWell.tsx`. Use radius-based duration.

6. **Update Section D** — same for `Flock.tsx`. Use leader-proximity duration.

7. **Update Section E** — same for `Magnets.tsx`. Use consonance-based duration.

8. **Test each section** — verify audio sounds more varied and musical, not just louder/longer.

9. **`npm run build`** — zero errors.

---

## What NOT to Do

1. **Don't change Sections F or G.** Freeze & Release and Rain already have varied durations.
2. **Don't use random duration selection.** Tie duration to a meaningful collision property.
3. **Don't make all notes long.** The mix of short and long is what creates musicality. Most collisions should still be `'4n'` — only strong/meaningful ones get `'2n'` or `'1n'`.
4. **Don't change collision physics or visual behavior.** Audio only.
5. **Don't break the existing `playDyad` API.** If adding a duration param, make it optional with `'8n'` default so any call sites you miss still work.

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| ND.1 | Section A: collision velocity maps to note duration (fast=long, slow=short) |
| ND.2 | Section B: bass register notes sustain longer than treble |
| ND.3 | Section C: orbs farther from center produce longer notes |
| ND.4 | Section D: collisions near the leader produce longer notes |
| ND.5 | Section E: consonant intervals produce longer notes than dissonant |
| ND.6 | Sections F and G are untouched |
| ND.7 | No visual changes in any section |
| ND.8 | `npm run build` — zero errors |

---

## Builder Notes

*(To be filled in by builder.)*
