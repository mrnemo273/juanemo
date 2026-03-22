import * as Tone from 'tone';

let synth: Tone.PolySynth | null = null;
let delay: Tone.FeedbackDelay | null = null;
let reverb: Tone.Reverb | null = null;
let initialized = false;

// Piano Split stereo synths + panners
let bassSynth: Tone.PolySynth | null = null;
let trebleSynth: Tone.PolySynth | null = null;
let bassPanner: Tone.Panner | null = null;
let treblePanner: Tone.Panner | null = null;
let stereoInitialized = false;

// Metronome
let metronomeLoop: Tone.Loop | null = null;
let brushSynth: Tone.NoiseSynth | null = null;
let brushFilter: Tone.Filter | null = null;
let metronomeGain: Tone.Gain | null = null;
let metronomeBeat = 0;
let metronomeTS: 3 | 4 = 3;

/** Initialize audio — must be called from a user gesture */
export async function initAudio(): Promise<void> {
  if (initialized) return;
  await Tone.start();
  // Verify audio context actually started (some browsers silently fail without user activation)
  if (Tone.getContext().state !== 'running') {
    throw new Error('AudioContext not running');
  }
  initialized = true;

  synth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 4,
    modulationIndex: 0.8,
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.001,
      decay: 1.5,
      sustain: 0.0,
      release: 2.0,
    },
    modulation: { type: 'sine' },
    modulationEnvelope: {
      attack: 0.001,
      decay: 0.4,
      sustain: 0,
      release: 0.3,
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

/** Play a two-note dyad with a specific Tone.js duration (e.g. '4n', '2n', '1n') */
export function playDyadDuration(freq1: number, freq2: number, velocity: number, duration: string): void {
  if (!synth || !initialized) return;
  const vel = Math.max(0.1, Math.min(1, velocity));
  const now = Tone.now();
  synth.triggerAttackRelease(
    Tone.Frequency(freq1).toNote(),
    duration,
    now,
    vel,
  );
  synth.triggerAttackRelease(
    Tone.Frequency(freq2).toNote(),
    duration,
    now,
    vel,
  );
}

/** Arpeggiate a chord — play notes in sequence with stagger */
export function playChordStrum(frequencies: number[], velocity = 0.35): void {
  if (!synth || !initialized) return;
  const now = Tone.now();
  const stagger = 0.07; // 70ms between notes
  // Sort low to high for a natural upward strum
  const sorted = [...frequencies].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    synth.triggerAttackRelease(
      Tone.Frequency(sorted[i]).toNote(),
      '4n',
      now + i * stagger,
      velocity,
    );
  }
}

/** Play a single note at the given velocity (for edge bounces) */
export function playNote(freq: number, velocity: number): void {
  if (!synth || !initialized) return;
  const vel = Math.max(0.05, Math.min(0.6, velocity * 0.4));
  synth.triggerAttackRelease(
    Tone.Frequency(freq).toNote(),
    '16n',
    Tone.now(),
    vel,
  );
}

/** Set synth envelope decay time */
export function setDecay(value: number): void {
  if (!synth) return;
  synth.set({ envelope: { decay: value } });
}

/** Set reverb wet/dry mix */
export function setReverbMix(value: number): void {
  if (!reverb) return;
  reverb.wet.value = value;
}

/** Check if audio context is ready */
export function isAudioReady(): boolean {
  return initialized;
}

/** Check if AudioContext is suspended (needs user gesture) */
export function isAudioSuspended(): boolean {
  return Tone.getContext().state === 'suspended';
}

/** Start the jazz metronome */
export function startMetronome(bpm: number, timeSignature: 3 | 4): void {
  if (!initialized) return;
  stopMetronome();

  metronomeTS = timeSignature;
  metronomeBeat = 0;

  Tone.Transport.bpm.value = bpm;
  Tone.Transport.swing = 0.66;
  Tone.Transport.swingSubdivision = '8n';
  Tone.Transport.timeSignature = timeSignature;

  // Jazz brush sound: filtered noise burst, very quiet
  brushFilter = new Tone.Filter({ frequency: 4000, type: 'bandpass', Q: 1.2 });
  metronomeGain = new Tone.Gain(Tone.dbToGain(-22));
  brushSynth = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: 0.001,
      decay: 0.07,
      sustain: 0,
      release: 0.01,
    },
    volume: -12,
  });
  brushSynth.chain(brushFilter, metronomeGain, Tone.getDestination());

  metronomeLoop = new Tone.Loop((time) => {
    const isAccent = metronomeBeat === 0;
    if (isAccent) {
      metronomeGain!.gain.setValueAtTime(Tone.dbToGain(-20), time);
      brushSynth!.set({ envelope: { decay: 0.09 } });
    } else {
      metronomeGain!.gain.setValueAtTime(Tone.dbToGain(-26), time);
      brushSynth!.set({ envelope: { decay: 0.06 } });
    }
    brushSynth!.triggerAttackRelease('32n', time);
    metronomeBeat = (metronomeBeat + 1) % metronomeTS;
  }, '4n');

  Tone.Transport.start();
  metronomeLoop.start(0);
}

/** Stop the metronome */
export function stopMetronome(): void {
  if (metronomeLoop) {
    metronomeLoop.stop();
    metronomeLoop.dispose();
    metronomeLoop = null;
  }
  if (brushSynth) {
    brushSynth.dispose();
    brushSynth = null;
  }
  if (brushFilter) {
    brushFilter.dispose();
    brushFilter = null;
  }
  if (metronomeGain) {
    metronomeGain.dispose();
    metronomeGain = null;
  }
  Tone.Transport.stop();
  metronomeBeat = 0;
}

/** Update metronome BPM */
export function setMetronomeTempo(bpm: number): void {
  Tone.Transport.bpm.value = bpm;
}

/** Mute metronome output (Transport keeps running for tempo tracking) */
export function muteMetronome(): void {
  if (metronomeGain) {
    metronomeGain.gain.rampTo(0, 0.05);
  }
}

/** Unmute metronome output */
export function unmuteMetronome(): void {
  if (metronomeGain) {
    metronomeGain.gain.rampTo(Tone.dbToGain(-22), 0.05);
  }
}

/** Set metronome volume in dB (default is -22) */
export function setMetronomeVolume(db: number): void {
  if (metronomeGain) {
    metronomeGain.gain.rampTo(Tone.dbToGain(db), 0.05);
  }
}

/** Update metronome time signature */
export function setMetronomeTimeSignature(ts: 3 | 4): void {
  metronomeTS = ts;
  Tone.Transport.timeSignature = ts;
  metronomeBeat = 0;
}

/* ============================================================
   Piano Split — Stereo audio
   ============================================================ */

/** Initialize stereo synths for Piano Split. Must call initAudio() first. */
export function initStereoSynths(): void {
  if (stereoInitialized || !initialized || !delay || !reverb) return;
  stereoInitialized = true;

  bassSynth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 2,
    modulationIndex: 0.6,
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.005,
      decay: 2.0,
      sustain: 0.05,
      release: 2.5,
    },
    modulation: { type: 'sine' },
    modulationEnvelope: {
      attack: 0.001,
      decay: 0.4,
      sustain: 0,
      release: 0.3,
    },
    volume: -10,
  });

  trebleSynth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 4,
    modulationIndex: 0.8,
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.001,
      decay: 1.5,
      sustain: 0.0,
      release: 2.0,
    },
    modulation: { type: 'sine' },
    modulationEnvelope: {
      attack: 0.001,
      decay: 0.4,
      sustain: 0,
      release: 0.3,
    },
    volume: -14,
  });

  bassPanner = new Tone.Panner(-0.7);
  treblePanner = new Tone.Panner(0.7);

  bassSynth.chain(bassPanner, delay, reverb, Tone.getDestination());
  trebleSynth.chain(treblePanner, delay, reverb, Tone.getDestination());
}

/** Dispose stereo synths only (when leaving Piano Split) */
export function disposeStereoSynths(): void {
  bassSynth?.dispose();
  trebleSynth?.dispose();
  bassPanner?.dispose();
  treblePanner?.dispose();
  bassSynth = null;
  trebleSynth = null;
  bassPanner = null;
  treblePanner = null;
  stereoInitialized = false;
}

/** Play a dyad through the bass or treble panner */
export function playDyadStereo(
  freq1: number,
  freq2: number,
  velocity: number,
  side: 'bass' | 'treble',
): void {
  const s = side === 'bass' ? bassSynth : trebleSynth;
  if (!s || !stereoInitialized) return;
  const vel = Math.max(0.1, Math.min(1, velocity));
  const now = Tone.now();
  s.triggerAttackRelease(Tone.Frequency(freq1).toNote(), '8n', now, vel);
  s.triggerAttackRelease(Tone.Frequency(freq2).toNote(), '8n', now, vel);
}

/** Play a single note through bass or treble panner (edge bounces) */
export function playNoteStereo(
  freq: number,
  velocity: number,
  side: 'bass' | 'treble',
): void {
  const s = side === 'bass' ? bassSynth : trebleSynth;
  if (!s || !stereoInitialized) return;
  const vel = Math.max(0.05, Math.min(0.6, velocity * 0.4));
  s.triggerAttackRelease(Tone.Frequency(freq).toNote(), '16n', Tone.now(), vel);
}

/** Stereo chord strum — bass left, treble right */
export function playChordStrumStereo(
  bassFreqs: number[],
  trebleFreqs: number[],
  velocity = 0.35,
): void {
  if (!stereoInitialized || !bassSynth || !trebleSynth) return;
  const now = Tone.now();
  const stagger = 0.07;

  const sortedBass = [...bassFreqs].sort((a, b) => a - b);
  for (let i = 0; i < sortedBass.length; i++) {
    bassSynth.triggerAttackRelease(
      Tone.Frequency(sortedBass[i]).toNote(),
      '4n',
      now + i * stagger,
      velocity,
    );
  }

  const trebleOffset = sortedBass.length * stagger;
  const sortedTreble = [...trebleFreqs].sort((a, b) => a - b);
  for (let i = 0; i < sortedTreble.length; i++) {
    trebleSynth.triggerAttackRelease(
      Tone.Frequency(sortedTreble[i]).toNote(),
      '4n',
      now + trebleOffset + i * stagger,
      velocity,
    );
  }
}

/** Set decay on both stereo synths */
export function setDecayStereo(value: number): void {
  bassSynth?.set({ envelope: { decay: value } });
  trebleSynth?.set({ envelope: { decay: value } });
}

/** Dispose synths and effects — does NOT close AudioContext */
export function dispose(): void {
  stopMetronome();
  disposeStereoSynths();
  synth?.dispose();
  delay?.dispose();
  reverb?.dispose();
  synth = null;
  delay = null;
  reverb = null;
  initialized = false;
}
