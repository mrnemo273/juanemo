import * as Tone from 'tone';

let synth: Tone.PolySynth | null = null;
let delay: Tone.FeedbackDelay | null = null;
let reverb: Tone.Reverb | null = null;
let initialized = false;

/** Initialize audio — must be called from a user gesture */
export async function initAudio(): Promise<void> {
  if (initialized) return;
  await Tone.start();
  initialized = true;

  synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: {
      attack: 0.02,
      decay: 0.3,
      sustain: 0.1,
      release: 0.8,
    },
    volume: -12,
  });

  delay = new Tone.FeedbackDelay({
    delayTime: '8n',
    feedback: 0.15,
    wet: 0.12,
  });

  reverb = new Tone.Reverb({
    decay: 2.5,
    wet: 0.3,
  });

  synth.chain(delay, reverb, Tone.getDestination());
}

/** Play a two-note dyad at the given velocity (0–1) */
export function playDyad(freq1: number, freq2: number, velocity: number): void {
  if (!synth || !initialized) return;
  const vel = Math.max(0.1, Math.min(1, velocity));
  const now = Tone.now();
  synth.triggerAttackRelease(
    Tone.Frequency(freq1).toNote(),
    '8n',
    now,
    vel,
  );
  synth.triggerAttackRelease(
    Tone.Frequency(freq2).toNote(),
    '8n',
    now,
    vel,
  );
}

/** Check if audio context is ready */
export function isAudioReady(): boolean {
  return initialized;
}

/** Check if AudioContext is suspended (needs user gesture) */
export function isAudioSuspended(): boolean {
  return Tone.getContext().state === 'suspended';
}

/** Dispose synths and effects — does NOT close AudioContext */
export function dispose(): void {
  synth?.dispose();
  delay?.dispose();
  reverb?.dispose();
  synth = null;
  delay = null;
  reverb = null;
  initialized = false;
}
