/**
 * Three-voice engine for Giant Steps Section C.
 * Sax (root) — gritty reed buzz
 * Piano (3rd) — bright percussive attack
 * Bass (7th) — deep sub warmth
 * All share a common reverb/delay bus with flanging.
 */
import * as Tone from 'tone';

// Sax voice
let saxSynth: Tone.PolySynth | null = null;
let saxFilter: Tone.Filter | null = null;
let saxNasalPeak: Tone.Filter | null = null;
let saxDistortion: Tone.Distortion | null = null;

// Piano voice
let pianoSynth: Tone.PolySynth | null = null;
let pianoFilter: Tone.Filter | null = null;

// Bass voice
let bassSynth: Tone.PolySynth | null = null;
let bassFilter: Tone.Filter | null = null;

// Shared bus
let reverb: Tone.Reverb | null = null;
let delay: Tone.FeedbackDelay | null = null;
let chorus: Tone.Chorus | null = null;
let bus: Tone.Channel | null = null;

let initialized = false;

// Audio density limiter (per voice)
const lastNoteTimes = { sax: 0, piano: 0, bass: 0 };
const MIN_NOTE_GAP = 60;

export function initSaxEngine(): void {
  if (initialized) return;
  initialized = true;

  // ── Shared effects bus ──
  chorus = new Tone.Chorus({
    frequency: 1.8,
    delayTime: 4.5,
    depth: 0.65,
    spread: 180,
    wet: 0.45,
  }).start();

  delay = new Tone.FeedbackDelay({
    delayTime: 0.12,
    feedback: 0.15,
    wet: 0.12,
  });

  reverb = new Tone.Reverb({
    decay: 2.5,
    wet: 0.28,
  });

  bus = new Tone.Channel({ volume: 0 });
  bus.chain(chorus, delay, reverb, Tone.getDestination());

  // ── Sax (root) — gritty reed buzz ──
  saxSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', count: 2, spread: 8 },
    envelope: { attack: 0.08, decay: 0.4, sustain: 0.5, release: 1.2 },
    volume: -10,
  });
  saxDistortion = new Tone.Distortion({ distortion: 0.25, wet: 0.4 });
  saxNasalPeak = new Tone.Filter({ type: 'peaking', frequency: 900, Q: 3, gain: 8 });
  saxFilter = new Tone.Filter({ type: 'lowpass', frequency: 1400, Q: 0.5, rolloff: -24 });
  saxSynth.chain(saxDistortion, saxNasalPeak, saxFilter, bus);

  // ── Piano (3rd) — bright percussive Rhodes-like ──
  pianoSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.8, sustain: 0.1, release: 1.5 },
    volume: -14,
  });
  pianoFilter = new Tone.Filter({ type: 'lowpass', frequency: 3000, Q: 1, rolloff: -12 });
  pianoSynth.chain(pianoFilter, bus);

  // ── Bass (7th) — deep warm sub ──
  bassSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.04, decay: 0.6, sustain: 0.6, release: 1.8 },
    volume: -12,
  });
  bassFilter = new Tone.Filter({ type: 'lowpass', frequency: 600, Q: 0.7, rolloff: -24 });
  bassSynth.chain(bassFilter, bus);
}

export type Voice = 'sax' | 'piano' | 'bass';

export function playSaxNote(freq: number, velocity: number, duration: string = '4n', voice: Voice = 'sax'): void {
  if (!initialized) return;

  const synth = voice === 'piano' ? pianoSynth : voice === 'bass' ? bassSynth : saxSynth;
  if (!synth) return;

  const now = performance.now();
  if (now - lastNoteTimes[voice] < MIN_NOTE_GAP) return;
  lastNoteTimes[voice] = now;

  const vel = Math.max(0.1, Math.min(0.6, velocity));
  synth.triggerAttackRelease(
    Tone.Frequency(freq).toNote(),
    duration,
    Tone.now(),
    vel,
  );
}

export function isSaxReady(): boolean {
  return initialized;
}

export function setSaxDecay(val: number): void {
  const release = 0.6 + val * 2.0;
  if (saxSynth) saxSynth.set({ envelope: { release } });
  if (pianoSynth) pianoSynth.set({ envelope: { release: release * 1.2 } });
  if (bassSynth) bassSynth.set({ envelope: { release: release * 1.5 } });
}

export function setSaxReverb(val: number): void {
  if (reverb) reverb.wet.value = 0.12 + val * 0.35;
}

export function disposeSax(): void {
  if (saxSynth) { saxSynth.dispose(); saxSynth = null; }
  if (saxDistortion) { saxDistortion.dispose(); saxDistortion = null; }
  if (saxNasalPeak) { saxNasalPeak.dispose(); saxNasalPeak = null; }
  if (saxFilter) { saxFilter.dispose(); saxFilter = null; }
  if (pianoSynth) { pianoSynth.dispose(); pianoSynth = null; }
  if (pianoFilter) { pianoFilter.dispose(); pianoFilter = null; }
  if (bassSynth) { bassSynth.dispose(); bassSynth = null; }
  if (bassFilter) { bassFilter.dispose(); bassFilter = null; }
  if (chorus) { chorus.dispose(); chorus = null; }
  if (delay) { delay.dispose(); delay = null; }
  if (reverb) { reverb.dispose(); reverb = null; }
  if (bus) { bus.dispose(); bus = null; }
  initialized = false;
  lastNoteTimes.sax = 0;
  lastNoteTimes.piano = 0;
  lastNoteTimes.bass = 0;
}
