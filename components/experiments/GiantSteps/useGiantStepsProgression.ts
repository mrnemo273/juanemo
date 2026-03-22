import { useRef, useCallback, useMemo, useEffect } from 'react';
import { GIANT_STEPS_PROGRESSION } from './giantStepsChordData';
import type { GiantStepsChord, KeyCenter } from './types';

export interface GiantStepsProgressionAPI {
  currentChord: () => GiantStepsChord;
  chordIndex: () => number;
  currentKeyCenter: () => KeyCenter;
  start: (bpm: number) => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  jumpToChord: (index: number) => void;
  onChordChange: (cb: (chord: GiantStepsChord, idx: number) => void) => void;
  onKeyChange: (cb: (newKey: KeyCenter, prevKey: KeyCenter) => void) => void;
}

export function useGiantStepsProgression(): GiantStepsProgressionAPI {
  const indexRef = useRef(0);
  const bpmRef = useRef(160);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chordCallbackRef = useRef<((chord: GiantStepsChord, idx: number) => void) | null>(null);
  const keyCallbackRef = useRef<((newKey: KeyCenter, prevKey: KeyCenter) => void) | null>(null);
  const prevKeyCenterRef = useRef<KeyCenter>(GIANT_STEPS_PROGRESSION[0].keyCenter);

  const getChordDurationMs = useCallback((chord: GiantStepsChord, bpm: number): number => {
    return (chord.beats * 60000) / bpm;
  }, []);

  const advance = useCallback(() => {
    const prevKey = GIANT_STEPS_PROGRESSION[indexRef.current].keyCenter;
    indexRef.current = (indexRef.current + 1) % GIANT_STEPS_PROGRESSION.length;
    const newChord = GIANT_STEPS_PROGRESSION[indexRef.current];

    chordCallbackRef.current?.(newChord, indexRef.current);

    if (newChord.keyCenter !== prevKey) {
      keyCallbackRef.current?.(newChord.keyCenter, prevKey);
      prevKeyCenterRef.current = newChord.keyCenter;
    }

    const duration = getChordDurationMs(newChord, bpmRef.current);
    timerRef.current = setTimeout(advance, duration);
  }, [getChordDurationMs]);

  const start = useCallback((bpm: number) => {
    bpmRef.current = bpm;
    if (timerRef.current) clearTimeout(timerRef.current);
    const chord = GIANT_STEPS_PROGRESSION[indexRef.current];
    chordCallbackRef.current?.(chord, indexRef.current);
    const duration = getChordDurationMs(chord, bpm);
    timerRef.current = setTimeout(advance, duration);
  }, [advance, getChordDurationMs]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const setBpm = useCallback((bpm: number) => {
    bpmRef.current = bpm;
  }, []);

  const jumpToChord = useCallback((index: number) => {
    const prevKey = GIANT_STEPS_PROGRESSION[indexRef.current].keyCenter;
    indexRef.current = index;
    const chord = GIANT_STEPS_PROGRESSION[index];
    chordCallbackRef.current?.(chord, index);
    if (chord.keyCenter !== prevKey) {
      keyCallbackRef.current?.(chord.keyCenter, prevKey);
      prevKeyCenterRef.current = chord.keyCenter;
    }
  }, []);

  const currentChord = useCallback(() => GIANT_STEPS_PROGRESSION[indexRef.current], []);
  const chordIndex = useCallback(() => indexRef.current, []);
  const currentKeyCenter = useCallback(() => GIANT_STEPS_PROGRESSION[indexRef.current].keyCenter, []);

  const onChordChange = useCallback((cb: (chord: GiantStepsChord, idx: number) => void) => {
    chordCallbackRef.current = cb;
  }, []);

  const onKeyChange = useCallback((cb: (newKey: KeyCenter, prevKey: KeyCenter) => void) => {
    keyCallbackRef.current = cb;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useMemo(() => ({
    currentChord,
    chordIndex,
    currentKeyCenter,
    start,
    stop,
    setBpm,
    jumpToChord,
    onChordChange,
    onKeyChange,
  }), [currentChord, chordIndex, currentKeyCenter, start, stop, setBpm, jumpToChord, onChordChange, onKeyChange]);
}
