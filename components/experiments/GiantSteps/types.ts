export type KeyCenter = 'B' | 'G' | 'Eb';
export type ChordRole = 'tonic' | 'ii' | 'V7';

export interface GiantStepsChord {
  name: string;
  symbol: string;
  keyCenter: KeyCenter;
  role: ChordRole;
  notes: string[];
  frequencies: number[];
  beats: number; // 2 or 4 (full-bar holds)
}

export interface GiantStepsParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  note: string;
  frequency: number;
  color: string;
  orbitRadius: number;
  orbitAngle: number;
  angularVelocity: number;
  trail: { x: number; y: number; alpha: number }[];
  slingshotting: boolean;
}

export interface Shockwave {
  x: number;
  y: number;
  startTime: number;
  color: string;
}
