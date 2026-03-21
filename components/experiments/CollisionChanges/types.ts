export type HarmonicFunction = 'tonic' | 'subdominant' | 'dominant';
export type ChordTone = 'root' | '3rd' | '5th' | '7th' | '9th';

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  note: string;
  frequency: number;
  targetFrequency: number;
  chordTone: ChordTone;
  harmonicFunction: HarmonicFunction;
  color: string;
  mass: number;
  brightness: number;
  trail: { x: number; y: number }[];
  spawnTime: number;
  fadeOut: boolean;
  // Orbital fields (Gravity Well section)
  orbitRadius?: number;
  angularVelocity?: number;
  angle?: number;
  targetOrbitRadius?: number;
  // Flock leader flag
  isLeader?: boolean;
}

export interface Chord {
  name: string;
  symbol: string;
  notes: string[];
  frequencies: number[];
  harmonicFunction: HarmonicFunction;
  ninth?: { note: string; frequency: number };
}

export interface CollisionEvent {
  idA: string;
  idB: string;
  velocity: number;
  freqA: number;
  freqB: number;
  midX: number;
  midY: number;
  time: number;
}
