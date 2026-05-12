import * as Tone from 'tone';

/**
 * Soft chime audio engine for the Exquisite Search reveal animation.
 * Each band slide-in fires one short note picked at random from a pentatonic
 * scale, so no two notes clash. With ~28 notes/sec at high band counts the
 * notes blend into a cascading wash; for a single-band reroll it reads as
 * one clear chime.
 *
 * Master volume + mute are handled by `Tone.getDestination()` (wired in
 * `ExperimentFrame`) — we just connect to Destination via the reverb.
 */

const PENTATONIC = [
  'C5',
  'D5',
  'E5',
  'G5',
  'A5',
  'C6',
  'D6',
  'E6',
  'G6',
];

let synth: Tone.PolySynth | null = null;
let reverb: Tone.Reverb | null = null;
let initStarted = false;

function ensureInit() {
  if (synth || initStarted) return;
  initStarted = true;
  // Soft triangle synth → reverb → master.
  reverb = new Tone.Reverb({ decay: 2.4, wet: 0.55 }).toDestination();
  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: {
      attack: 0.002,
      decay: 0.25,
      sustain: 0,
      release: 0.7,
    },
  });
  synth.volume.value = -20; // -20 dB — sits below the rest of the mix
  synth.connect(reverb);
}

/** Play a single soft chime. No-op if the AudioContext isn't running yet. */
export function playBandNote(): void {
  if (typeof window === 'undefined') return;
  if (Tone.getContext().state !== 'running') return;
  ensureInit();
  if (!synth) return;
  const note = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
  // 150ms note duration; the synth's envelope release continues past that
  // for a soft tail.
  synth.triggerAttackRelease(note, 0.15);
}
