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
  /** Register callback for chord changes. Returns the voice-lead assignment. */
  onChordChange: (
    cb: (
      newChord: Chord,
      chordIdx: number,
      assignment: number[],
    ) => void,
  ) => void;
}

export function useChordProgression(): ChordProgressionAPI {
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(2000);
  const callbackRef = useRef<
    ((chord: Chord, idx: number, assignment: number[]) => void) | null
  >(null);
  const particleFreqsRef = useRef<number[]>([]);

  const currentChord = useCallback(() => PROGRESSION[indexRef.current], []);
  const chordIndex = useCallback(() => indexRef.current, []);

  const advance = useCallback(() => {
    indexRef.current = (indexRef.current + 1) % PROGRESSION.length;
    const newChord = PROGRESSION[indexRef.current];

    // Voice-lead assignment
    const assignment = voiceLeadAssignment(
      particleFreqsRef.current,
      newChord,
    );

    callbackRef.current?.(newChord, indexRef.current, assignment);

    // Schedule next
    const interval = speedToInterval(speedRef.current);
    timerRef.current = setTimeout(advance, interval);
  }, []);

  const start = useCallback(
    (speed: number) => {
      speedRef.current = speed;
      if (timerRef.current) clearTimeout(timerRef.current);
      const interval = speedToInterval(speed);
      timerRef.current = setTimeout(advance, interval);
    },
    [advance],
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

  const onChordChange = useCallback(
    (
      cb: (chord: Chord, idx: number, assignment: number[]) => void,
    ) => {
      callbackRef.current = cb;
    },
    [],
  );

  // Expose a way to update current particle frequencies for voice-leading
  // This is called from the main component's RAF loop
  useEffect(() => {
    // Attach a helper to update freqs
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
    onChordChange,
  }), [currentChord, chordIndex, start, stop, setSpeed, onChordChange]);
}

export { PROGRESSION, getChordTone };
