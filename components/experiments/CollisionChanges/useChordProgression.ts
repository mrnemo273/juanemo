import { useRef, useCallback, useEffect, useMemo } from 'react';
import { PROGRESSION, voiceLeadAssignment, getChordTone } from './chordData';
import type { Chord } from './types';

/** Map ExperimentControlsContext speed values to chord change intervals */
function speedToInterval(speed: number): number {
  // speed 8000 (Slow) → 8s, 4000 (Medium) → 5s, 2000 (Fast) → 3s
  if (speed >= 8000) return 8000;
  if (speed >= 4000) return 5000;
  return 3000;
}

export interface ChordProgressionAPI {
  currentChord: () => Chord;
  chordIndex: () => number;
  /** Start the progression timer */
  start: (speed: number) => void;
  /** Stop the progression timer */
  stop: () => void;
  /** Update speed without resetting position */
  setSpeed: (speed: number) => void;
  /** Jump to a specific chord by index */
  jumpToChord: (index: number) => void;
  /** Set BPM and time signature for Transport-synced timing */
  setBpmTiming: (bpm: number, timeSignature: 3 | 4) => void;
  /** Register callback for chord changes. Returns the voice-lead assignment. */
  onChordChange: (
    cb: (
      newChord: Chord,
      chordIdx: number,
      assignment: number[],
    ) => void,
  ) => void;
}

const BARS_PER_CHORD = 2;

function bpmInterval(bpm: number, timeSignature: 3 | 4): number {
  return (timeSignature * 60000 / bpm) * BARS_PER_CHORD;
}

export function useChordProgression(): ChordProgressionAPI {
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(2000);
  const bpmRef = useRef<number | null>(null);
  const tsRef = useRef<3 | 4>(3);
  const callbackRef = useRef<
    ((chord: Chord, idx: number, assignment: number[]) => void) | null
  >(null);
  const particleFreqsRef = useRef<number[]>([]);

  const currentChord = useCallback(() => PROGRESSION[indexRef.current], []);
  const chordIndex = useCallback(() => indexRef.current, []);

  const getInterval = useCallback(() => {
    if (bpmRef.current !== null) {
      return bpmInterval(bpmRef.current, tsRef.current);
    }
    return speedToInterval(speedRef.current);
  }, []);

  const advance = useCallback(() => {
    indexRef.current = (indexRef.current + 1) % PROGRESSION.length;
    const newChord = PROGRESSION[indexRef.current];

    const assignment = voiceLeadAssignment(
      particleFreqsRef.current,
      newChord,
    );

    callbackRef.current?.(newChord, indexRef.current, assignment);

    timerRef.current = setTimeout(advance, getInterval());
  }, [getInterval]);

  const start = useCallback(
    (speed: number) => {
      speedRef.current = speed;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(advance, getInterval());
    },
    [advance, getInterval],
  );

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setSpeed = useCallback((speed: number) => {
    speedRef.current = speed;
  }, []);

  const jumpToChord = useCallback((index: number) => {
    indexRef.current = index;
    const chord = PROGRESSION[index];
    const assignment = voiceLeadAssignment(
      particleFreqsRef.current,
      chord,
    );
    callbackRef.current?.(chord, index, assignment);
    // No auto-advance — user controls chord changes via dropdown
  }, []);

  const setBpmTiming = useCallback((bpm: number, timeSignature: 3 | 4) => {
    bpmRef.current = bpm;
    tsRef.current = timeSignature;
  }, []);

  const onChordChange = useCallback(
    (
      cb: (chord: Chord, idx: number, assignment: number[]) => void,
    ) => {
      callbackRef.current = cb;
    },
    [],
  );

  // Expose a way to update current particle frequencies for voice-leading
  useEffect(() => {
    (onChordChange as any).__updateFreqs = (freqs: number[]) => {
      particleFreqsRef.current = freqs;
    };
  }, [onChordChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useMemo(() => ({
    currentChord,
    chordIndex,
    start,
    stop,
    setSpeed,
    jumpToChord,
    setBpmTiming,
    onChordChange,
  }), [currentChord, chordIndex, start, stop, setSpeed, jumpToChord, setBpmTiming, onChordChange]);
}

export { PROGRESSION, getChordTone };
