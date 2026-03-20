# EXP-02A Tweaks — Code Chords Section A Refinements

> **Status:** ✅ DONE
> **Spec date:** 2026-03-20
> **Depends on:** EXP-02 Collision Changes (✅ DONE)
> **Must complete before:** EXP-02 Sections B–F build

---

## Overview

Six refinements to the live Code Chords Section A experiment. These are quality-of-life and design improvements discovered after the initial build shipped. They make the experiment feel more musical, more responsive across screen sizes, and better integrated with the settings panel.

---

## T.1 — Mobile Settings Push (ExperimentFrame)

**Problem:** On mobile, when the settings panel opens and has a lot of content (instructions + controls), the panel overlaps the experiment canvas. The typography experiment (EXP-01) has 6 sections with varying amounts of settings content — some sections' panels collide with the experiment visuals.

**Solution:** When the settings panel opens on mobile, the experiment viewport should slide upward (under the top navigation bar) to make room for the panel. When the panel closes, the viewport slides back to center.

### Implementation

**File: `components/ExperimentFrame.module.css`**

Currently the grid is:
```
grid-template-rows: auto 1px 1fr 0px 1px auto;
```
When open:
```
grid-template-rows: auto 1px 1fr var(--panel-height) 1px auto;
```

The viewport (row 3, `.viewportWrap`) stays `1fr` but the panel pushes it smaller. The problem is the viewport just shrinks — the experiment content stays centered in the reduced space, which on small screens means the canvas gets squeezed.

**New behavior (mobile only, ≤600px):**
1. When `panelOpen` is true, add a CSS class to `.viewportWrap` that applies a negative `margin-top` and/or `transform: translateY(...)` to slide the experiment content upward, tucking it partially under the top bar.
2. The amount to slide = roughly half the panel height, so the experiment "makes room" without fully disappearing.
3. Use the same transition timing as the panel: `var(--panel-speed) var(--panel-ease)`.
4. When the panel closes, the viewport slides back down smoothly.

**Approach — CSS transform on viewport:**
```css
@media (max-width: 600px) {
  .viewportWrap {
    transition: transform var(--panel-speed) var(--panel-ease);
  }
  .viewportWrapPushed {
    transform: translateY(calc(var(--panel-height) * -0.45));
  }
}
```

**File: `components/ExperimentFrame.tsx`**
- Add `viewportWrapPushed` class to `.viewportWrap` when `panelOpen && isMobile`.

**Important:** This is a change to ExperimentFrame, which is shared by all experiments. The push behavior should work correctly for EXP-01 (Generative Typography) as well — it's a general improvement. Test both experiments after implementing.

### Acceptance criteria
- [ ] On mobile (≤600px), opening settings slides the experiment canvas upward
- [ ] Closing settings slides it back to center
- [ ] Transition is smooth, using `--panel-speed` and `--panel-ease`
- [ ] Desktop behavior is unchanged
- [ ] Works correctly for both EXP-01 and EXP-02

---

## T.2 — Chord Selection Dropdown (Replace Click-to-Spawn)

**Problem:** The current interaction (click/tap to spawn new orbs) is not musically meaningful. Users don't know what note they're adding. The more interesting interaction is choosing which chord the orbs play.

**Solution:** Remove click-to-add-dots entirely. Add an on-canvas chord selector and a subtle centered chord label.

### What to remove

**File: `components/experiments/CollisionChanges/CollisionChanges.tsx`**
- Remove the `handleClick` handler and `click` event listener on the canvas.
- Remove the `handleTouchEnd` spawn behavior (the `spawnOrb` call on `touchend`). Keep `touchStart` and `touchMove` for gravity well behavior.
- Remove the `spawnOrb` callback entirely.
- Remove the `addParticle` call from physics (though keep the function — Sections B–F may use it).

### What to add

**Chord selector UI — HTML overlay, not canvas-rendered:**

Add a small dropdown/select element positioned on the canvas. It should:
1. Float in the **bottom-left corner** of the canvas, with ~20px padding from edges.
2. Show the current chord name (e.g., "Dm7") in a minimal styled `<select>` or custom dropdown.
3. Options: all 4 chords from the progression — `Dm7`, `G7`, `Cmaj7`, `Fmaj7`.
4. When the user selects a chord, immediately jump the progression to that chord (call the chord change logic with the selected chord).
5. Style: transparent background, `--dun` text at 30% opacity, 11px DM Sans, thin border at 12% opacity. Same visual language as the rest of the frame. On hover/focus: opacity goes to 60%.

**Centered chord label — canvas-rendered:**

Currently there's a small chord indicator in the top-right (`ctx.fillText` at line 448). Replace it with:
1. **Centered** in the canvas (both x and y).
2. Larger font: `24px "DM Sans"` on desktop, `18px` on mobile.
3. Very low opacity: 8–10% of `--dun` color.
4. Show the chord symbol only (e.g., "ii" or "V" or "I" or "IV") — the musically meaningful name.
5. When the chord changes, briefly flash the opacity up to 20% then fade back to 8% over 500ms.

### Chord jumping logic

**File: `components/experiments/CollisionChanges/useChordProgression.ts`**
- Add a `jumpToChord(index: number)` method to the API.
- When called: set `indexRef.current = index`, fire the `callbackRef` with the new chord + voice-lead assignment, and restart the timer from the new position.

**File: `components/experiments/CollisionChanges/CollisionChanges.tsx`**
- Wire the dropdown's `onChange` to `progression.jumpToChord(selectedIndex)`.

### Data update

**File: `data/experiments.ts`** — update `codeChordsSectionConfigs`:
- Change hint from `'Click to add new notes'` to `'Select chords · watch orbs retune'`
- Change mobile hint from `'Tilt to move · tap to add notes'` to `'Tilt to move · select chords below'`
- Update instructions to remove "Click to add" / "Tap to add" entries. Replace with:
  - `{ icon: 'eye', text: '<strong>Select a chord</strong> — use the dropdown to change the harmony' }`
  - Keep the "Watch for chord changes" instruction.
  - Keep mobile gyro instructions.

### Acceptance criteria
- [ ] Click/tap no longer spawns new orbs
- [ ] Chord selector dropdown appears in bottom-left of canvas
- [ ] Selecting a chord immediately retunes all orbs to that chord
- [ ] Centered chord symbol displays at low opacity
- [ ] Chord symbol flashes subtly on chord change
- [ ] Dropdown is styled to match the design system (transparent, --dun, thin border)
- [ ] Dropdown is touch-friendly on mobile (min 44px tap target)

---

## T.3 — Jazz Metronome

**Problem:** The experiment feels ambient but not rhythmic. It needs a pulse to feel like music.

**Solution:** Add a continuously playing metronome using Tone.js. The metronome tempo should affect the speed of chord changes and the overall energy.

### Metronome design

**Feel:** Jazz swing. Not a rigid click track. Use a ride cymbal or brush-like timbre — soft, swinging.

**Time signature:** Default to 3/4 waltz feel (jazz waltz is common: think Bill Evans "Waltz for Debby"). Offer 4/4 swing as an alternative in settings.

**Swing ratio:** Apply swing to the metronome hits. Standard jazz swing = ~66% ratio (long-short instead of even eighth notes). In Tone.js, use `Tone.Transport.swing` and `Tone.Transport.swingSubdivision`.

### Implementation

**File: `components/experiments/CollisionChanges/audioEngine.ts`**

Add:
```typescript
let metronome: Tone.Loop | null = null;
let metronomeSynth: Tone.MembraneSynth | null = null; // or NoiseSynth for brush

export function startMetronome(bpm: number, timeSignature: 3 | 4): void {
  Tone.Transport.bpm.value = bpm;
  Tone.Transport.swing = 0.66;  // jazz swing
  Tone.Transport.swingSubdivision = '8n';
  Tone.Transport.timeSignature = timeSignature;

  // Create a soft, brushy metronome sound
  // Use a filtered noise burst or a gentle membrane hit
  // Volume: quiet — -18 to -22 dB. This is background pulse, not foreground.

  // Accent beat 1, ghost beats 2 (and 3 in 3/4, or 2-3-4 in 4/4)
  // Beat 1: slightly louder, slightly brighter
  // Other beats: softer, darker

  metronome = new Tone.Loop((time) => {
    // ... play metronome hit
  }, `${timeSignature}n`);

  Tone.Transport.start();
  metronome.start(0);
}

export function stopMetronome(): void { ... }
export function setMetronomeTempo(bpm: number): void { ... }
export function setMetronomeTimeSignature(ts: 3 | 4): void { ... }
```

**Metronome sound options (pick the best-sounding one):**
1. **Brush sweep:** `Tone.NoiseSynth` with very short envelope (attack 0.001, decay 0.08), bandpass filter around 4kHz. Sounds like a jazz brush.
2. **Woodblock:** `Tone.MembraneSynth` with high frequency (800Hz), very short decay. Classic jazz practice room sound.
3. **Rim click:** Short noise burst with tight envelope and high-pass filter.

The builder should try option 1 (brush) first — it's the most musical for jazz context.

**Tempo → chord speed coupling:**

The chord progression currently uses a fixed timer (`speedToInterval()`). With the metronome, chord changes should align to the beat:
- In 3/4 at 120 BPM: one chord per 2 bars = 4 seconds
- In 4/4 at 120 BPM: one chord per 2 bars = 4 seconds
- Faster tempo = faster chord changes

Update `useChordProgression.ts` to accept BPM and time signature, and compute the chord change interval from those:
```
interval = (timeSignature * 60000 / bpm) * barsPerChord
```
Where `barsPerChord = 2` by default.

### Settings controls

**File: `data/experiments.ts`** — add to `codeChordsSectionConfigs[0].controls`:
- `'tempo'` — BPM control
- `'timeSignature'` — 3/4 or 4/4

**File: `components/ExperimentFrame.tsx`** — add new control renderers:
- **Tempo:** Buttons for preset tempos: `80` (Ballad), `120` (Medium), `160` (Up). Default: `120`.
- **Time Signature:** Toggle between `3/4` and `4/4`. Default: `3/4`.

**File: `lib/ExperimentControlsContext.tsx`** — add to `ExperimentControls`:
```typescript
tempo: number;         // BPM — 80, 120, or 160
timeSignature: 3 | 4;  // 3/4 waltz or 4/4 swing
```

### Acceptance criteria
- [ ] Metronome plays continuously after audio init (tap to start)
- [ ] Metronome has a soft jazz brush/cymbal sound, not harsh click
- [ ] Swing feel is audible — not robotic straight time
- [ ] Beat 1 is subtly accented
- [ ] Tempo control in settings works (80/120/160 BPM)
- [ ] Time signature toggle works (3/4 and 4/4)
- [ ] Chord changes sync to the metronome (change every 2 bars)
- [ ] Metronome volume is backgrounded (-18 to -22 dB) — doesn't overpower collisions

---

## T.4 — Decay & Reverb Controls

**Problem:** The synth's decay (1.5s) and reverb (2.5s decay, 0.3 wet) are hardcoded in `audioEngine.ts`. Users should be able to shape the sound.

**Solution:** Expose decay and reverb as settings panel controls.

### Implementation

**File: `components/experiments/CollisionChanges/audioEngine.ts`**

Add setter functions:
```typescript
export function setDecay(value: number): void {
  if (!synth) return;
  // value: 0.3 (Short), 1.5 (Medium), 3.0 (Long)
  synth.set({ envelope: { decay: value } });
}

export function setReverbMix(value: number): void {
  if (!reverb) return;
  // value: 0.0 (Dry), 0.3 (Medium), 0.6 (Wet)
  reverb.wet.value = value;
}
```

**File: `data/experiments.ts`** — add to controls array:
- `'decay'`
- `'reverb'`

**File: `components/ExperimentFrame.tsx`** — add control renderers:
- **Decay:** Three buttons — `Short` (0.3s), `Medium` (1.5s), `Long` (3.0s). Default: Medium.
- **Reverb:** Three buttons — `Dry` (0.0), `Medium` (0.3), `Wet` (0.6). Default: Medium.

**File: `lib/ExperimentControlsContext.tsx`** — add to `ExperimentControls`:
```typescript
decay: number;    // envelope decay in seconds
reverbMix: number; // reverb wet 0–1
```

**File: `components/experiments/CollisionChanges/CollisionChanges.tsx`**
- Watch `controls.decay` and `controls.reverbMix` via useEffect, call the setter functions when they change.

### Acceptance criteria
- [ ] Decay control changes the synth envelope decay time
- [ ] Reverb control changes the reverb wet/dry mix
- [ ] Changes are audible immediately (no restart required)
- [ ] "Short" decay makes notes staccato and percussive
- [ ] "Wet" reverb creates a lush, spacious sound
- [ ] Default values match current hardcoded values (Medium for both)

---

## T.5 — Viewport-Responsive Orb Sizes

**Problem:** Orb sizes are binary — desktop (30–65px) or mobile (20–42px). On large desktop screens, orbs look small and collide infrequently. On tablets, orbs may be too large or too small.

**Solution:** Scale orb radius continuously based on viewport width for more frequent collisions on bigger screens.

### Implementation

**File: `components/experiments/CollisionChanges/useParticlePhysics.ts`**

Replace the binary `setOrbSizes(mobile)` with a continuous scaling function:

```typescript
export function setOrbSizes(viewportWidth: number): void {
  // Scale linearly from small screens to large:
  // 320px  → min 16, max 35
  // 600px  → min 20, max 42  (current mobile)
  // 1024px → min 30, max 65  (current desktop)
  // 1440px → min 38, max 80
  // 1920px → min 45, max 95
  // 2560px → min 50, max 110

  const clampedW = Math.max(320, Math.min(2560, viewportWidth));
  const t = (clampedW - 320) / (2560 - 320); // 0–1

  ORB_RADIUS_MIN = Math.round(16 + t * (50 - 16));  // 16–50
  ORB_RADIUS_MAX = Math.round(35 + t * (110 - 35));  // 35–110
}
```

**File: `components/experiments/CollisionChanges/CollisionChanges.tsx`**
- Change `setOrbSizes(mobile)` call to `setOrbSizes(window.innerWidth)`.
- Also call `setOrbSizes` on window resize (debounced). Existing orbs keep their current size — only new spawns and reinits use the new sizes.

### Tuning notes
- The goal is: bigger screen = bigger orbs = more collisions = richer sound.
- On a 27" display (2560px), orbs should feel substantial — like billiard balls, not BBs.
- On phone (375px), orbs should be large enough to show the note label clearly but not crowd the screen.
- These are starting values — tune by feel.

### Acceptance criteria
- [ ] Orb sizes scale smoothly with viewport width
- [ ] Large screens (1440px+) have noticeably larger orbs than current
- [ ] Small screens (375px) have appropriately sized orbs
- [ ] Note labels remain legible at all sizes
- [ ] Collisions happen more frequently on larger screens
- [ ] Existing particles don't resize mid-animation (only new spawns)

---

## T.6 — Fix Section Label

**Problem:** The section letter in `data/experiments.ts` is `'1'` instead of `'A'`. The bottom bar pagination tile shows "1" instead of "A".

**Solution:** Simple data fix.

### Implementation

**File: `data/experiments.ts`**

Change:
```typescript
letter: '1',
```
To:
```typescript
letter: 'A',
```

### Acceptance criteria
- [ ] Bottom bar tile shows "A" not "1"
- [ ] Settings panel label shows "A — Collision Changes"
- [ ] Hint bar shows "A" as the section letter

---

## Task List

| ID | Task | Files | Effort |
|----|------|-------|--------|
| T.1 | Mobile settings push | ExperimentFrame.tsx, ExperimentFrame.module.css | Small |
| T.2 | Chord selection dropdown | CollisionChanges.tsx, useChordProgression.ts, CollisionChanges.module.css, data/experiments.ts | Medium |
| T.3 | Jazz metronome | audioEngine.ts, useChordProgression.ts, ExperimentFrame.tsx, ExperimentControlsContext.tsx, data/experiments.ts | Large |
| T.4 | Decay & reverb controls | audioEngine.ts, ExperimentFrame.tsx, ExperimentControlsContext.tsx, data/experiments.ts, CollisionChanges.tsx | Medium |
| T.5 | Viewport-responsive orbs | useParticlePhysics.ts, CollisionChanges.tsx | Small |
| T.6 | Fix section label | data/experiments.ts | Trivial |

**Suggested build order:** T.6 → T.5 → T.1 → T.4 → T.2 → T.3

Start with the trivial fix and the simple scaling change. Then do the ExperimentFrame mobile push (affects all experiments — test broadly). Then the audio controls (straightforward Tone.js setters). Then the chord dropdown (interaction redesign). Save the metronome for last — it's the most complex and touches the most files.

---

## ⚠️ What You Must NOT Break

1. **Section A physics** — free-float collisions, cursor gravity, gyro gravity. All unchanged.
2. **Audio engine core** — `playDyad()` behavior is unchanged. New functions are additive.
3. **Chord progression core** — the ii-V-I-IV cycle and voice-leading are unchanged. `jumpToChord` is additive.
4. **ExperimentFrame for EXP-01** — the mobile push (T.1) must work for Generative Typography too. Test both.
5. **Sections B–F spec** — these tweaks are to Section A only. Don't pre-build B–F logic.
6. **60fps** — the metronome runs on Tone.Transport, not the RAF loop. No frame budget impact.

---

## Builder Notes

### Metronome Sound
Used `Tone.NoiseSynth` with white noise + bandpass filter at 4kHz (Q: 1.2) for a jazz brush feel. Envelope: attack 0.001, decay 0.07 (ghost beats) / 0.09 (accent), sustain 0, release 0.01. Volume: -22dB ghost, -18dB accent. Routed through `Tone.Gain('decibels')` for per-beat dynamic control.

### BPM-to-Chord Sync
Chord changes use `bpmInterval = (timeSignature × 60000 / bpm) × barsPerChord` where `barsPerChord = 2`. The progression hook stores BPM/TS refs and derives interval from them when set. `Tone.Transport` drives the metronome loop; chord changes use `setTimeout` synced to the same BPM math (not Transport scheduling) for simplicity — both derive from the same formula so they stay aligned.

### Orb Size Tuning
Linear interpolation from viewport 320px–3840px:
- `ORB_RADIUS_MIN`: 20–100px
- `ORB_RADIUS_MAX`: 40–250px
Resize is debounced at 150ms. Only new spawns/reinits use updated sizes.

### Deviations from Spec
- Metronome uses `Tone.Transport.swing = 0.66` with `swingSubdivision = '8n'` as specified.
- Chord timer still uses setTimeout (not `Tone.Transport.scheduleRepeat`) — simpler, avoids tight coupling. BPM math ensures sync.
- `Tone.Gain` constructor typed as `Gain<'decibels'>` to satisfy Tone.js v15 generics.
- **Chord selection is user-driven only** — auto-progression was removed. Dropdown starts on "Select chord" placeholder; user must pick a chord to activate audio. Orbs float silently until then.
- **Audio starts on chord selection**, not on mousemove (mousemove is not a valid user activation event for Web Audio). Click/touch/keydown triggers are used.
- **Custom dropdown** replaces native `<select>` — bone/cream overlay with rounded corners, box-shadow, matching the navigation drawer design language. Positioned next to section name on desktop, centered below on mobile.
- **Edge bounce audio** — orbs play a single note when bouncing off canvas edges, not just on particle-particle collisions.
- **Chord strum on selection** — picking a chord from the dropdown plays an arpeggiated strum of all chord tones before orbs begin bouncing.
- **Metronome volume** tuned significantly quieter than spec (-28dB ghost, -34dB accent) using plain `Tone.Gain` with `Tone.dbToGain()` conversion to avoid double-conversion bugs.
- **Orb sizing extended** to scale up to 3840px viewports (ultrawide/4K support): min 20–100px, max 40–250px. Original spec capped at 2560px.
- **Hydration fix** — random initial chord caused React hydration mismatch (server vs client `Math.random()`). Fixed by deferring to client-side `useEffect`, then replaced entirely with "Select chord" placeholder approach.
- **AudioContext state verification** — `initAudio()` now checks `Tone.getContext().state === 'running'` after `Tone.start()` and throws if not, allowing retry on next user gesture.
