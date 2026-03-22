import type { KeyCenter, GiantStepsChord } from './types';

export const KEY_CENTER_COLORS: Record<KeyCenter, string> = {
  B:  '#90C2E7', // sky-blue
  G:  '#72B887', // spring-green
  Eb: '#E8C547', // golden
};

// Circle of fifths positions (0 = top / 12 o'clock, clockwise, in degrees)
export const CIRCLE_OF_FIFTHS: { note: string; angle: number }[] = [
  { note: 'C',  angle: 0 },
  { note: 'G',  angle: 30 },
  { note: 'D',  angle: 60 },
  { note: 'A',  angle: 90 },
  { note: 'E',  angle: 120 },
  { note: 'B',  angle: 150 },
  { note: 'F♯', angle: 180 },
  { note: 'D♭', angle: 210 },
  { note: 'A♭', angle: 240 },
  { note: 'E♭', angle: 270 },
  { note: 'B♭', angle: 300 },
  { note: 'F',  angle: 330 },
];

// Key center positions on the circle (triangle vertices)
export const KEY_CENTER_ANGLES: Record<KeyCenter, number> = {
  B:  150,
  G:  30,
  Eb: 270,
};

// Full 16-bar Giant Steps progression
// Bars with 2 chords = 2 beats each. Bars with 1 chord = 4 beats (full bar hold).
export const GIANT_STEPS_PROGRESSION: GiantStepsChord[] = [
  // Bar 1: Bmaj7 (2) → D7 (2)
  { name: 'Bmaj7',  symbol: 'Imaj7', keyCenter: 'B',  role: 'tonic', notes: ['B3','D#4','F#4','A#4'], frequencies: [246.94, 311.13, 369.99, 466.16], beats: 2 },
  { name: 'D7',     symbol: 'V7',    keyCenter: 'G',  role: 'V7',    notes: ['D4','F#4','A4','C5'],   frequencies: [293.66, 369.99, 440.00, 523.25], beats: 2 },
  // Bar 2: Gmaj7 (2) → Bb7 (2)
  { name: 'Gmaj7',  symbol: 'Imaj7', keyCenter: 'G',  role: 'tonic', notes: ['G3','B3','D4','F#4'],   frequencies: [196.00, 246.94, 293.66, 369.99], beats: 2 },
  { name: 'Bb7',    symbol: 'V7',    keyCenter: 'Eb', role: 'V7',    notes: ['Bb3','D4','F4','Ab4'],  frequencies: [233.08, 293.66, 349.23, 415.30], beats: 2 },
  // Bar 3: Ebmaj7 (4) — full bar hold
  { name: 'Ebmaj7', symbol: 'Imaj7', keyCenter: 'Eb', role: 'tonic', notes: ['Eb4','G4','Bb4','D5'],  frequencies: [311.13, 392.00, 466.16, 587.33], beats: 4 },
  // Bar 4: Am7 (2) → D7 (2)
  { name: 'Am7',    symbol: 'ii',    keyCenter: 'G',  role: 'ii',    notes: ['A3','C4','E4','G4'],    frequencies: [220.00, 261.63, 329.63, 392.00], beats: 2 },
  { name: 'D7',     symbol: 'V7',    keyCenter: 'G',  role: 'V7',    notes: ['D4','F#4','A4','C5'],   frequencies: [293.66, 369.99, 440.00, 523.25], beats: 2 },
  // Bar 5: Gmaj7 (2) → Bb7 (2)
  { name: 'Gmaj7',  symbol: 'Imaj7', keyCenter: 'G',  role: 'tonic', notes: ['G3','B3','D4','F#4'],   frequencies: [196.00, 246.94, 293.66, 369.99], beats: 2 },
  { name: 'Bb7',    symbol: 'V7',    keyCenter: 'Eb', role: 'V7',    notes: ['Bb3','D4','F4','Ab4'],  frequencies: [233.08, 293.66, 349.23, 415.30], beats: 2 },
  // Bar 6: Ebmaj7 (2) → F#7 (2)
  { name: 'Ebmaj7', symbol: 'Imaj7', keyCenter: 'Eb', role: 'tonic', notes: ['Eb4','G4','Bb4','D5'],  frequencies: [311.13, 392.00, 466.16, 587.33], beats: 2 },
  { name: 'F#7',    symbol: 'V7',    keyCenter: 'B',  role: 'V7',    notes: ['F#3','A#3','C#4','E4'], frequencies: [185.00, 233.08, 277.18, 329.63], beats: 2 },
  // Bar 7: Bmaj7 (4) — full bar hold
  { name: 'Bmaj7',  symbol: 'Imaj7', keyCenter: 'B',  role: 'tonic', notes: ['B3','D#4','F#4','A#4'], frequencies: [246.94, 311.13, 369.99, 466.16], beats: 4 },
  // Bar 8: Fm7 (2) → Bb7 (2)
  { name: 'Fm7',    symbol: 'ii',    keyCenter: 'Eb', role: 'ii',    notes: ['F3','Ab3','C4','Eb4'],  frequencies: [174.61, 207.65, 261.63, 311.13], beats: 2 },
  { name: 'Bb7',    symbol: 'V7',    keyCenter: 'Eb', role: 'V7',    notes: ['Bb3','D4','F4','Ab4'],  frequencies: [233.08, 293.66, 349.23, 415.30], beats: 2 },
  // Bar 9: Ebmaj7 (4) — full bar hold
  { name: 'Ebmaj7', symbol: 'Imaj7', keyCenter: 'Eb', role: 'tonic', notes: ['Eb4','G4','Bb4','D5'],  frequencies: [311.13, 392.00, 466.16, 587.33], beats: 4 },
  // Bar 10: Am7 (2) → D7 (2)
  { name: 'Am7',    symbol: 'ii',    keyCenter: 'G',  role: 'ii',    notes: ['A3','C4','E4','G4'],    frequencies: [220.00, 261.63, 329.63, 392.00], beats: 2 },
  { name: 'D7',     symbol: 'V7',    keyCenter: 'G',  role: 'V7',    notes: ['D4','F#4','A4','C5'],   frequencies: [293.66, 369.99, 440.00, 523.25], beats: 2 },
  // Bar 11: Gmaj7 (4) — full bar hold
  { name: 'Gmaj7',  symbol: 'Imaj7', keyCenter: 'G',  role: 'tonic', notes: ['G3','B3','D4','F#4'],   frequencies: [196.00, 246.94, 293.66, 369.99], beats: 4 },
  // Bar 12: C#m7 (2) → F#7 (2)
  { name: 'C#m7',   symbol: 'ii',    keyCenter: 'B',  role: 'ii',    notes: ['C#4','E4','G#4','B4'],  frequencies: [277.18, 329.63, 415.30, 493.88], beats: 2 },
  { name: 'F#7',    symbol: 'V7',    keyCenter: 'B',  role: 'V7',    notes: ['F#3','A#3','C#4','E4'], frequencies: [185.00, 233.08, 277.18, 329.63], beats: 2 },
  // Bar 13: Bmaj7 (4) — full bar hold
  { name: 'Bmaj7',  symbol: 'Imaj7', keyCenter: 'B',  role: 'tonic', notes: ['B3','D#4','F#4','A#4'], frequencies: [246.94, 311.13, 369.99, 466.16], beats: 4 },
  // Bar 14: Fm7 (2) → Bb7 (2)
  { name: 'Fm7',    symbol: 'ii',    keyCenter: 'Eb', role: 'ii',    notes: ['F3','Ab3','C4','Eb4'],  frequencies: [174.61, 207.65, 261.63, 311.13], beats: 2 },
  { name: 'Bb7',    symbol: 'V7',    keyCenter: 'Eb', role: 'V7',    notes: ['Bb3','D4','F4','Ab4'],  frequencies: [233.08, 293.66, 349.23, 415.30], beats: 2 },
  // Bar 15: Ebmaj7 (4) — full bar hold
  { name: 'Ebmaj7', symbol: 'Imaj7', keyCenter: 'Eb', role: 'tonic', notes: ['Eb4','G4','Bb4','D5'],  frequencies: [311.13, 392.00, 466.16, 587.33], beats: 4 },
  // Bar 16: C#m7 (2) → F#7 (2)
  { name: 'C#m7',   symbol: 'ii',    keyCenter: 'B',  role: 'ii',    notes: ['C#4','E4','G#4','B4'],  frequencies: [277.18, 329.63, 415.30, 493.88], beats: 2 },
  { name: 'F#7',    symbol: 'V7',    keyCenter: 'B',  role: 'V7',    notes: ['F#3','A#3','C#4','E4'], frequencies: [185.00, 233.08, 277.18, 329.63], beats: 2 },
];
