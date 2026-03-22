/**
 * Gritty sax engine for Giant Steps.
 * Distortion for reed buzz + nasal EQ peak + dark room reverb.
 */
import * as Tone from 'tone';

let synth: Tone.PolySynth | null = null;
let filter: Tone.Filter | null = null;
let nasalPeak: Tone.Filter | null = null;
let distortion: Tone.Distortion | null = null;
let reverb: Tone.Reverb | null = null;
let delay: Tone.FeedbackDelay | null = null;
let initialized = false;

// Audio density limiter
let lastNoteTime = 0;
const MIN_NOTE_GAP = 60;

export function initSaxEngine(): void {
  if (initialized) return;
  initialized = true;

  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'fatsawtooth',
      count: 2,
      spread: 8,
    },
    envelope: {
      attack: 0.08,
      decay: 0.4,
      sustain: 0.5,
      release: 1.2,
    },
    volume: -10,
  });

  // Soft clipping — reed buzz / overblown tone
  distortion = new Tone.Distortion({
    distortion: 0.25,
    wet: 0.4,
  });

  // Nasal resonance peak — the "honk" of a sax, around 900 Hz
  nasalPeak = new Tone.Filter({
    type: 'peaking',
    frequency: 900,
    Q: 3,
    gain: 8,
  });

  // Cut the highs — no sparkle, just body
  filter = new Tone.Filter({
    type: 'lowpass',
    frequency: 1400,
    Q: 0.5,
    rolloff: -24,
  });

  // Short delay — room reflection, not echo
  delay = new Tone.FeedbackDelay({
    delayTime: 0.12,
    feedback: 0.15,
    wet: 0.12,
  });

  // Medium reverb — smoky club, not cathedral
  reverb = new Tone.Reverb({
    decay: 2.5,
    wet: 0.28,
  });

  synth.chain(distortion, nasalPeak, filter, delay, reverb, Tone.getDestination());
}

export function playSaxNote(freq: number, velocity: number): void {
  if (!synth || !initialized) return;

  const now = performance.now();
  if (now - lastNoteTime < MIN_NOTE_GAP) return;
  lastNoteTime = now;

  const vel = Math.max(0.1, Math.min(0.6, velocity));
  synth.triggerAttackRelease(
    Tone.Frequency(freq).toNote(),
    '4n',
    Tone.now(),
    vel,
  );
}

export function isSaxReady(): boolean {
  return initialized;
}

export function setSaxDecay(val: number): void {
  if (!synth) return;
  const release = 0.6 + val * 2.0;
  synth.set({ envelope: { release } });
}

export function setSaxReverb(val: number): void {
  if (reverb) reverb.wet.value = 0.12 + val * 0.35;
}

export function disposeSax(): void {
  if (synth) { synth.dispose(); synth = null; }
  if (distortion) { distortion.dispose(); distortion = null; }
  if (nasalPeak) { nasalPeak.dispose(); nasalPeak = null; }
  if (filter) { filter.dispose(); filter = null; }
  if (delay) { delay.dispose(); delay = null; }
  if (reverb) { reverb.dispose(); reverb = null; }
  initialized = false;
  lastNoteTime = 0;
}
