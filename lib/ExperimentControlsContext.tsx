'use client';

import { createContext, useContext } from 'react';

export type EasingType = 'spring' | 'smooth';

export interface ExperimentControls {
  speed: number;        // ms — transition duration
  easing: EasingType;   // spring or smooth
  shuffleKey: number;   // increments on shuffle — experiments react to changes
  activeSection: number; // index of currently visible section
  replayKey: number;    // increments on replay — section E reacts to changes
}

const defaultControls: ExperimentControls = {
  speed: 2000,
  easing: 'spring',
  shuffleKey: 0,
  activeSection: 0,
  replayKey: 0,
};

export const ExperimentControlsContext =
  createContext<ExperimentControls>(defaultControls);

export function useExperimentControls() {
  return useContext(ExperimentControlsContext);
}

export const EASINGS: Record<EasingType, string> = {
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
};
