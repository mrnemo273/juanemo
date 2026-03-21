import type { Chord, HarmonicFunction } from './types';

export const PROGRESSION: Chord[] = [
  {
    name: 'Dm7',
    symbol: 'ii',
    notes: ['D4', 'F4', 'A4', 'C5'],
    frequencies: [293.66, 349.23, 440.0, 523.25],
    harmonicFunction: 'subdominant',
    ninth: { note: 'E5', frequency: 659.25 },
  },
  {
    name: 'G7',
    symbol: 'V',
    notes: ['G3', 'B3', 'D4', 'F4'],
    frequencies: [196.0, 246.94, 293.66, 349.23],
    harmonicFunction: 'dominant',
    ninth: { note: 'A4', frequency: 440.0 },
  },
  {
    name: 'Cmaj7',
    symbol: 'I',
    notes: ['C4', 'E4', 'G4', 'B4'],
    frequencies: [261.63, 329.63, 392.0, 493.88],
    harmonicFunction: 'tonic',
    ninth: { note: 'D5', frequency: 587.33 },
  },
  {
    name: 'Fmaj7',
    symbol: 'IV',
    notes: ['F3', 'A3', 'C4', 'E4'],
    frequencies: [174.61, 220.0, 261.63, 329.63],
    harmonicFunction: 'subdominant',
    ninth: { note: 'G4', frequency: 392.0 },
  },
];

/** Map harmonic function to design token color */
export const HARMONIC_COLORS: Record<HarmonicFunction, string> = {
  tonic: '#EBE2D6',       // --bone
  subdominant: '#D6C5AB', // --dun
  dominant: '#F25C54',     // --bittersweet
};

/**
 * Voice-leading: for each particle, find the closest frequency in the new chord.
 * Returns an assignment array: assignedIndices[particleIdx] = chordFreqIdx
 */
export function voiceLeadAssignment(
  currentFreqs: number[],
  newChord: Chord,
): number[] {
  const targets = [...newChord.frequencies];
  // Add ninth if we have more particles than chord tones
  if (newChord.ninth && currentFreqs.length > 4) {
    targets.push(newChord.ninth.frequency);
  }
  // Add octave doublings if needed
  while (targets.length < currentFreqs.length) {
    const base = targets[targets.length % newChord.frequencies.length];
    targets.push(base * 2);
  }

  // Greedy closest-note assignment
  const used = new Set<number>();
  const assignment: number[] = [];

  // Sort particles by how constrained they are (fewest close options first)
  const indices = currentFreqs.map((_, i) => i);
  indices.sort((a, b) => {
    const distA = Math.min(...targets.map((t) => Math.abs(currentFreqs[a] - t)));
    const distB = Math.min(...targets.map((t) => Math.abs(currentFreqs[b] - t)));
    return distA - distB;
  });

  const result = new Array<number>(currentFreqs.length);
  for (const pi of indices) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let ti = 0; ti < targets.length; ti++) {
      if (used.has(ti)) continue;
      const dist = Math.abs(currentFreqs[pi] - targets[ti]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = ti;
      }
    }
    used.add(bestIdx);
    result[pi] = bestIdx;
  }

  return result;
}

/** Get the chord tone label for a given index */
export function getChordTone(index: number): 'root' | '3rd' | '5th' | '7th' | '9th' {
  const labels: ('root' | '3rd' | '5th' | '7th' | '9th')[] = ['root', '3rd', '5th', '7th', '9th'];
  return labels[index % labels.length];
}

/** Convert note string (e.g. "C4", "Bb3") to MIDI number */
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

/** Consonance rating per interval (semitones mod 12). 0 = maximally dissonant, 12 = maximally consonant. */
export const CONSONANCE_TABLE: Record<number, number> = {
  0: 12,   // Unison / Octave
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
