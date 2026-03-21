/**
 * Ambient typography audio engine for EXP-01.
 *
 * Each letter in the wordmark gets an independent voice:
 *   Oscillator (sine/triangle) → Filter (lowpass) → Gain → Panner → masterGain
 *
 * Master chain:
 *   masterGain → Reverb (decay 4s, wet 0.4) → Compressor (-20, 4:1) → Destination
 *
 * Axis-to-audio mapping:
 *   wght (300–900) → frequency 400–80 Hz (inverted, logarithmic)
 *   wdth (25–151)  → filter cutoff 200–4000 Hz (linear)
 *   opsz (8–144)   → reverb wet 0.8–0.1 (inverted)
 *   index          → stereo pan -1.0 to +1.0
 */

import * as Tone from 'tone';

/* ----------------------------------------------------------
   Voice type
   ---------------------------------------------------------- */
interface LetterVoice {
  osc: Tone.Oscillator;
  filter: Tone.Filter;
  gain: Tone.Gain;
  panner: Tone.Panner;
}

/* ----------------------------------------------------------
   Module state
   ---------------------------------------------------------- */
let voices: LetterVoice[] = [];
let masterGain: Tone.Gain | null = null;
let reverb: Tone.Reverb | null = null;
let compressor: Tone.Compressor | null = null;
let noiseSource: Tone.Noise | null = null;
let noiseFilter: Tone.Filter | null = null;
let noiseGain: Tone.Gain | null = null;
let ready = false;
let currentWaveform: 'sine' | 'triangle' = 'sine';

/* ----------------------------------------------------------
   Axis → Audio mapping helpers
   ---------------------------------------------------------- */

/** Weight → Frequency (logarithmic, inverted: heavy = low) */
function wghtToFreq(wght: number): number {
  const t = Math.max(0, Math.min(1, (wght - 300) / 600));
  return 400 * Math.pow(80 / 400, t); // 400 Hz → 80 Hz
}

/** Width → Filter cutoff (linear: wide = bright) */
function wdthToCutoff(wdth: number): number {
  const t = Math.max(0, Math.min(1, (wdth - 25) / 126));
  return 200 + t * 3800;
}

/** Optical size → Reverb send (inverted: small opsz = more reverb) */
function opszToReverbMix(opsz: number): number {
  const t = Math.max(0, Math.min(1, (opsz - 8) / 136));
  return 0.8 - t * 0.7;
}

/** Letter index → Stereo pan (-1 left, +1 right) */
function indexToPan(index: number, total: number): number {
  if (total <= 1) return 0;
  return -1 + (2 * index) / (total - 1);
}

/* ----------------------------------------------------------
   Public API
   ---------------------------------------------------------- */

/**
 * Create voices and master chain. Must be called from a user gesture.
 * Master volume starts at -Infinity (muted).
 */
export async function initTypographyAudio(letterCount: number): Promise<void> {
  if (ready) return;
  await Tone.start();
  if (Tone.getContext().state !== 'running') {
    throw new Error('AudioContext not running');
  }

  // Master chain
  compressor = new Tone.Compressor({ threshold: -20, ratio: 4 });
  reverb = new Tone.Reverb({ decay: 4, wet: 0.4 });
  masterGain = new Tone.Gain(0); // starts silent (linear 0)
  masterGain.chain(reverb, compressor, Tone.getDestination());

  // Per-letter voices
  voices = [];
  for (let i = 0; i < letterCount; i++) {
    const osc = new Tone.Oscillator({
      type: currentWaveform,
      frequency: 200,
    });
    const filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 1000,
      rolloff: -12,
    });
    const gain = new Tone.Gain(Tone.dbToGain(-30));
    const panner = new Tone.Panner(indexToPan(i, letterCount));

    osc.chain(filter, gain, panner, masterGain);
    osc.start();
    voices.push({ osc, filter, gain, panner });
  }

  // Noise layer for breathing (Section F) — starts silent
  noiseFilter = new Tone.Filter({ frequency: 800, type: 'bandpass', Q: 1.5 });
  noiseGain = new Tone.Gain(0); // linear 0 = silent
  noiseSource = new Tone.Noise('white');
  noiseSource.chain(noiseFilter, noiseGain, masterGain);
  noiseSource.start();

  ready = true;
}

/**
 * Update a single letter's voice from its current axis values.
 * Uses signal ramping for smooth transitions (no clicks).
 */
export function updateLetterVoice(
  index: number,
  axes: { wght: number; wdth: number; opsz: number },
): void {
  if (!ready || index < 0 || index >= voices.length) return;
  const v = voices[index];
  const rampTime = 0.3;

  v.osc.frequency.rampTo(wghtToFreq(axes.wght), rampTime);
  v.filter.frequency.rampTo(wdthToCutoff(axes.wdth), rampTime);

  // Per-voice reverb mix approximation: modulate individual gain slightly
  // (true per-voice reverb send would need separate reverb instances)
  // Instead we subtly blend gain with opsz — small opsz = quieter direct ≈ more reverb feel
  const reverbMix = opszToReverbMix(axes.opsz);
  // Map reverb mix to a slight gain offset: more reverb feel = slightly quieter direct signal
  const baseDb = -30;
  const opszGainOffset = (0.8 - reverbMix) * 3; // 0 to ~2.1 dB boost for large opsz
  v.gain.gain.rampTo(Tone.dbToGain(baseDb + opszGainOffset), rampTime);
}

/** Boost a voice +12 dB (proximity/hover) or restore to -30 dB */
export function setVoiceBoost(index: number, boost: boolean): void {
  if (!ready || index < 0 || index >= voices.length) return;
  const v = voices[index];
  v.gain.gain.rampTo(Tone.dbToGain(boost ? -18 : -30), 0.15);
}

/** Set master volume in dB. Use -Infinity to mute, -12 for normal. */
export function setMasterVolume(db: number): void {
  if (!masterGain) return;
  const linear = db === -Infinity ? 0 : Tone.dbToGain(db);
  masterGain.gain.rampTo(linear, 0.5);
}

/** Switch all oscillators between sine and triangle */
export function setWaveform(type: 'sine' | 'triangle'): void {
  currentWaveform = type;
  for (const v of voices) {
    v.osc.type = type;
  }
}

/** Set the breathing noise layer gain (linear 0–1 range, mapped internally) */
export function setNoiseGain(linearGain: number): void {
  if (!noiseGain) return;
  noiseGain.gain.rampTo(linearGain, 0.1);
}

/** Dispose ALL Tone.js nodes. Call on unmount. */
export function dispose(): void {
  for (const v of voices) {
    v.osc.stop();
    v.osc.dispose();
    v.filter.dispose();
    v.gain.dispose();
    v.panner.dispose();
  }
  voices = [];
  noiseSource?.stop();
  noiseSource?.dispose();
  noiseFilter?.dispose();
  noiseGain?.dispose();
  noiseSource = null;
  noiseFilter = null;
  noiseGain = null;
  reverb?.dispose();
  compressor?.dispose();
  masterGain?.dispose();
  reverb = null;
  compressor = null;
  masterGain = null;
  ready = false;
}

/** True after initTypographyAudio() completes successfully */
export function isReady(): boolean {
  return ready;
}
