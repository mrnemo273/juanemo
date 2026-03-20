'use client';

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../../../lib/useDeviceOrientation';
import { setOrbSizes } from './useParticlePhysics';
import { useChordProgression, PROGRESSION, getChordTone } from './useChordProgression';
import { voiceLeadAssignment, HARMONIC_COLORS } from './chordData';
import * as Tone from 'tone';
import {
  initAudio,
  isAudioReady,
  dispose,
  setDecay,
  setDecayStereo,
  setReverbMix,
  startMetronome,
  setMetronomeTempo,
  setMetronomeTimeSignature,
  stopMetronome,
  initStereoSynths,
  disposeStereoSynths,
  playDyadStereo,
  playNoteStereo,
  playChordStrumStereo,
} from './audioEngine';
import type { Particle, CollisionEvent, HarmonicFunction, ChordTone, Chord } from './types';
import styles from './CollisionChanges.module.css';

/* ----------------------------------------------------------
   Constants
   ---------------------------------------------------------- */
const MOBILE_BREAKPOINT = 600;
const LERP_DURATION = 500;
const CHORD_FLASH_DURATION = 200;
const COLLISION_LINE_DURATION = 200;
const BACKGROUND = '#1F2627';
const SPLIT_SCALE = 0.65;
const BASS_BOOST = 1.15;

// Physics constants (same as Section A)
const INTER_PARTICLE_G = 0.02;
const CURSOR_G = 0.15;
const ATTRACTION_RADIUS = 400;
const DAMPING = 0.9998;
const BOUNCE_RESTITUTION = 0.7;
const COLLISION_COOLDOWN = 600;
const MAX_SPEED = 2.5;
const INITIAL_VELOCITY_RANGE = 1.2;

// Orb sizes — set by setOrbSizes, we read from module-level via getter
let ORB_RADIUS_MIN = 30;
let ORB_RADIUS_MAX = 65;

function updateLocalOrbSizes(viewportWidth: number) {
  setOrbSizes(viewportWidth);
  const clampedW = Math.max(320, Math.min(3840, viewportWidth));
  const t = (clampedW - 320) / (3840 - 320);
  ORB_RADIUS_MIN = Math.round(20 + t * (100 - 20));
  ORB_RADIUS_MAX = Math.round(40 + t * (250 - 40));
}

const NOTE_COLORS: Record<string, string> = {
  C3: '#E8927C', C4: '#E8927C', C5: '#E8927C',
  D3: '#7CC4E8', D4: '#7CC4E8', D5: '#7CC4E8', D6: '#7CC4E8',
  E3: '#A8E87C', E4: '#A8E87C', E5: '#A8E87C', E6: '#A8E87C',
  F2: '#E8D77C', F3: '#E8D77C', F4: '#E8D77C',
  G2: '#C47CE8', G3: '#C47CE8', G4: '#C47CE8', G5: '#C47CE8',
  A2: '#E87CA8', A3: '#E87CA8', A4: '#E87CA8', A5: '#E87CA8',
  B2: '#7CE8D4', B3: '#7CE8D4', B4: '#7CE8D4',
};

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

/* ----------------------------------------------------------
   Voicing split helpers
   ---------------------------------------------------------- */
interface SplitVoicing {
  bassFreqs: number[];
  bassNotes: string[];
  bassTones: ChordTone[];
  trebleFreqs: number[];
  trebleNotes: string[];
  trebleTones: ChordTone[];
}

function splitChordVoicing(chord: Chord): SplitVoicing {
  const bassFreqs = [
    chord.frequencies[0],           // root
    chord.frequencies[2],           // 5th
    chord.frequencies[0] / 2,       // root-8vb
    chord.frequencies[3] / 2,       // 7th-8vb
    chord.frequencies[1] / 2,       // 3rd-8vb (low color)
  ];
  const bassNotes = [chord.notes[0], chord.notes[2], chord.notes[0], chord.notes[3], chord.notes[1]];
  const bassTones: ChordTone[] = ['root', '5th', 'root', '7th', '3rd'];

  const trebleFreqs = [
    chord.frequencies[1],           // 3rd
    chord.frequencies[3],           // 7th
    chord.ninth!.frequency,         // 9th
    chord.frequencies[2] * 2,       // 5th-8va
    chord.frequencies[0] * 2,       // root-8va
    chord.ninth!.frequency * 2,     // 9th-8va (shimmer)
  ];
  const trebleNotes = [chord.notes[1], chord.notes[3], chord.ninth!.note, chord.notes[2], chord.notes[0], chord.ninth!.note];
  const trebleTones: ChordTone[] = ['3rd', '7th', '9th', '5th', 'root', '9th'];

  return { bassFreqs, bassNotes, bassTones, trebleFreqs, trebleNotes, trebleTones };
}

/* ----------------------------------------------------------
   Per-half bounds
   ---------------------------------------------------------- */
interface HalfBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

function getHalfBounds(side: 'bass' | 'treble', w: number, h: number, mobile: boolean): HalfBounds {
  if (mobile) {
    return side === 'treble'
      ? { x: 0, y: 0, w, h: h / 2 }
      : { x: 0, y: h / 2, w, h: h / 2 };
  }
  return side === 'bass'
    ? { x: 0, y: 0, w: w / 2, h }
    : { x: w / 2, y: 0, w: w / 2, h };
}

function getCursorSide(cx: number, cy: number, w: number, h: number, mobile: boolean): 'bass' | 'treble' {
  if (mobile) return cy < h / 2 ? 'treble' : 'bass';
  return cx < w / 2 ? 'bass' : 'treble';
}

/* ----------------------------------------------------------
   Particle helpers (inline physics — no hook, to keep two arrays separate)
   ---------------------------------------------------------- */
let nextId = 1000; // offset from Section A's IDs
function makeId(): string { return `ps${nextId++}`; }

interface SplitParticle extends Particle {
  side: 'bass' | 'treble';
}

function createParticles(
  freqs: number[],
  notes: string[],
  tones: ChordTone[],
  harmonicFunction: HarmonicFunction,
  bounds: HalfBounds,
  side: 'bass' | 'treble',
): SplitParticle[] {
  const bassScale = side === 'bass' ? BASS_BOOST : 1;
  const minR = Math.round(ORB_RADIUS_MIN * SPLIT_SCALE * bassScale);
  const maxR = Math.round(ORB_RADIUS_MAX * SPLIT_SCALE * bassScale);

  return freqs.map((freq, i) => {
    const padding = Math.max(40, maxR + 10);
    return {
      id: makeId(),
      x: bounds.x + padding + Math.random() * Math.max(10, bounds.w - padding * 2),
      y: bounds.y + padding + Math.random() * Math.max(10, bounds.h - padding * 2),
      vx: (Math.random() - 0.5) * INITIAL_VELOCITY_RANGE * 2,
      vy: (Math.random() - 0.5) * INITIAL_VELOCITY_RANGE * 2,
      radius: minR + Math.random() * (maxR - minR),
      note: notes[i],
      frequency: freq,
      targetFrequency: freq,
      chordTone: tones[i],
      harmonicFunction,
      color: HARMONIC_COLORS[harmonicFunction],
      mass: 1,
      brightness: 0,
      trail: [],
      spawnTime: performance.now(),
      fadeOut: false,
      side,
    };
  });
}

interface EdgeBounce {
  frequency: number;
  velocity: number;
  side: 'bass' | 'treble';
}

function stepParticles(
  particles: SplitParticle[],
  dt: number,
  bounds: HalfBounds,
  gravitySource: { x: number; y: number } | null,
  gyroGravity: { gx: number; gy: number },
  cooldownMap: Map<string, number>,
): { collisions: CollisionEvent[]; edgeBounces: EdgeBounce[] } {
  const now = performance.now();
  const events: CollisionEvent[] = [];
  const edgeBounces: EdgeBounce[] = [];
  const cappedDt = Math.min(dt, 3);
  const side = particles[0]?.side ?? 'bass';

  for (const p of particles) {
    if (p.fadeOut) continue;

    p.trail.unshift({ x: p.x, y: p.y });
    if (p.trail.length > 5) p.trail.pop();

    if (p.brightness > 0) {
      p.brightness = Math.max(0, p.brightness - 0.02 * cappedDt);
    }

    // Inter-particle attraction
    for (const other of particles) {
      if (other.id === p.id || other.fadeOut) continue;
      const dx = other.x - p.x;
      const dy = other.y - p.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      if (dist < 1) continue;
      const force = (INTER_PARTICLE_G * p.mass * other.mass) / distSq;
      p.vx += (force * dx / dist) * cappedDt;
      p.vy += (force * dy / dist) * cappedDt;
    }

    // Cursor gravity — only if cursor is within this half
    if (gravitySource) {
      const dx = gravitySource.x - p.x;
      const dy = gravitySource.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ATTRACTION_RADIUS && dist > 1) {
        const force = (CURSOR_G * p.mass) / dist;
        p.vx += (force * dx / dist) * cappedDt;
        p.vy += (force * dy / dist) * cappedDt;
      }
    }

    // Gyro gravity
    if (gyroGravity.gx !== 0 || gyroGravity.gy !== 0) {
      p.vx += gyroGravity.gx * 0.01 * cappedDt;
      p.vy += gyroGravity.gy * 0.01 * cappedDt;
    }

    // Damping
    p.vx *= Math.pow(DAMPING, cappedDt);
    p.vy *= Math.pow(DAMPING, cappedDt);

    // Speed floor
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed < 0.3) {
      const angle = Math.atan2(p.vy, p.vx) || (Math.random() * Math.PI * 2);
      p.vx = Math.cos(angle) * 0.4;
      p.vy = Math.sin(angle) * 0.4;
    }
    if (speed > MAX_SPEED) {
      const scale = MAX_SPEED / speed;
      p.vx *= scale;
      p.vy *= scale;
    }

    // Position update
    p.x += p.vx * cappedDt;
    p.y += p.vy * cappedDt;

    // Edge bounce — bounded to half
    const speedBefore = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    let edgeBounced = false;
    if (p.x - p.radius < bounds.x) {
      p.x = bounds.x + p.radius;
      p.vx = Math.abs(p.vx) * BOUNCE_RESTITUTION;
      edgeBounced = true;
    } else if (p.x + p.radius > bounds.x + bounds.w) {
      p.x = bounds.x + bounds.w - p.radius;
      p.vx = -Math.abs(p.vx) * BOUNCE_RESTITUTION;
      edgeBounced = true;
    }
    if (p.y - p.radius < bounds.y) {
      p.y = bounds.y + p.radius;
      p.vy = Math.abs(p.vy) * BOUNCE_RESTITUTION;
      edgeBounced = true;
    } else if (p.y + p.radius > bounds.y + bounds.h) {
      p.y = bounds.y + bounds.h - p.radius;
      p.vy = -Math.abs(p.vy) * BOUNCE_RESTITUTION;
      edgeBounced = true;
    }
    if (edgeBounced) {
      const vel = Math.min(1, Math.max(0.1, speedBefore / 4));
      edgeBounces.push({ frequency: p.frequency, velocity: vel, side });
      p.brightness = Math.max(p.brightness, 0.5);
    }
  }

  // Collision detection
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i];
      const b = particles[j];
      if (a.fadeOut || b.fadeOut) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;

      if (dist < minDist && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        const dvx = a.vx - b.vx;
        const dvy = a.vy - b.vy;
        const dvDotN = dvx * nx + dvy * ny;

        if (dvDotN > 0) {
          const massSum = a.mass + b.mass;
          const impulse = (2 * dvDotN) / massSum;
          a.vx -= impulse * b.mass * nx;
          a.vy -= impulse * b.mass * ny;
          b.vx += impulse * a.mass * nx;
          b.vy += impulse * a.mass * ny;
          const kick = 0.3;
          a.vx -= nx * kick;
          a.vy -= ny * kick;
          b.vx += nx * kick;
          b.vy += ny * kick;
        }

        const overlap = minDist - dist;
        a.x -= (nx * overlap) / 2;
        a.y -= (ny * overlap) / 2;
        b.x += (nx * overlap) / 2;
        b.y += (ny * overlap) / 2;

        const pairKey = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
        const lastCollision = cooldownMap.get(pairKey) ?? 0;
        if (now - lastCollision > COLLISION_COOLDOWN) {
          cooldownMap.set(pairKey, now);
          const relV = Math.sqrt(dvx * dvx + dvy * dvy);
          const velocity = Math.min(1, Math.max(0.15, relV / 5));
          a.brightness = 1;
          b.brightness = 1;
          events.push({
            idA: a.id,
            idB: b.id,
            velocity,
            freqA: a.frequency,
            freqB: b.frequency,
            midX: (a.x + b.x) / 2,
            midY: (a.y + b.y) / 2,
            time: now,
          });
        }
      }
    }
  }

  return { collisions: events, edgeBounces };
}

/* ----------------------------------------------------------
   Voice-leading for a half
   ---------------------------------------------------------- */
function voiceLeadHalf(
  particles: SplitParticle[],
  targetFreqs: number[],
  targetNotes: string[],
  targetTones: ChordTone[],
  harmonicFunction: HarmonicFunction,
  lerpStartMap: Map<string, number>,
  lerpTargetMap: Map<string, number>,
) {
  lerpStartMap.clear();
  lerpTargetMap.clear();
  const now = performance.now();

  // Greedy closest-frequency assignment
  const currentFreqs = particles.map((p) => p.frequency);
  const used = new Set<number>();
  const indices = currentFreqs.map((_, i) => i);
  indices.sort((a, b) => {
    const distA = Math.min(...targetFreqs.map((t) => Math.abs(currentFreqs[a] - t)));
    const distB = Math.min(...targetFreqs.map((t) => Math.abs(currentFreqs[b] - t)));
    return distA - distB;
  });

  const assignment = new Array<number>(currentFreqs.length);
  for (const pi of indices) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let ti = 0; ti < targetFreqs.length; ti++) {
      if (used.has(ti)) continue;
      const dist = Math.abs(currentFreqs[pi] - targetFreqs[ti]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = ti;
      }
    }
    used.add(bestIdx);
    assignment[pi] = bestIdx;
  }

  particles.forEach((p, i) => {
    const tIdx = assignment[i] ?? (i % targetFreqs.length);
    lerpStartMap.set(p.id, p.frequency);
    lerpTargetMap.set(p.id, targetFreqs[tIdx]);
    p.targetFrequency = targetFreqs[tIdx];
    p.note = targetNotes[tIdx];
    p.chordTone = targetTones[tIdx];
    p.harmonicFunction = harmonicFunction;
    p.color = HARMONIC_COLORS[harmonicFunction];
    p.spawnTime = now;
  });
}

function applyLerp(
  particles: SplitParticle[],
  progress: number,
  lerpStartMap: Map<string, number>,
  lerpTargetMap: Map<string, number>,
) {
  const t = Math.min(1, Math.max(0, progress));
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  for (const p of particles) {
    const start = lerpStartMap.get(p.id);
    const target = lerpTargetMap.get(p.id);
    if (start !== undefined && target !== undefined) {
      p.frequency = start + (target - start) * eased;
    }
  }
}

/* ----------------------------------------------------------
   Utility
   ---------------------------------------------------------- */
function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ==========================================================
   PianoSplit Component
   ========================================================== */
export default function PianoSplit() {
  const controls = useContext(ExperimentControlsContext);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  const gyro = useDeviceOrientation();
  const gyroRef = useRef(gyro);
  gyroRef.current = gyro;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const [audioStarted, setAudioStarted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedChord, setSelectedChord] = useState<number | null>(null);

  const progression = useChordProgression();

  // Dual particle arrays
  const bassParticlesRef = useRef<SplitParticle[]>([]);
  const trebleParticlesRef = useRef<SplitParticle[]>([]);
  const bassCooldownRef = useRef<Map<string, number>>(new Map());
  const trebleCooldownRef = useRef<Map<string, number>>(new Map());

  // Lerp maps per half
  const bassLerpStart = useRef<Map<string, number>>(new Map());
  const bassLerpTarget = useRef<Map<string, number>>(new Map());
  const trebleLerpStart = useRef<Map<string, number>>(new Map());
  const trebleLerpTarget = useRef<Map<string, number>>(new Map());
  const lerpStartTimeRef = useRef(0);
  const isLerpingRef = useRef(false);

  // Gravity source
  const gravitySourceRef = useRef<{ x: number; y: number } | null>(null);
  const gyroGravityRef = useRef<{ gx: number; gy: number }>({ gx: 0, gy: 0 });

  // Chord change visual state
  const selectedChordRef = useRef<number | null>(null);
  const chordFlashRef = useRef(0);
  const chordNameRef = useRef(PROGRESSION[0].name);

  // Collision lines
  const collisionLinesRef = useRef<
    { x1: number; y1: number; x2: number; y2: number; time: number; side: 'bass' | 'treble' }[]
  >([]);

  // L.H. / R.H. label fade
  const mountTimeRef = useRef(performance.now());

  const prefersReducedRef = useRef(false);

  /* --------------------------------------------------------
     Mobile detection + orb sizing
     -------------------------------------------------------- */
  useEffect(() => {
    setIsMobile(isMobileViewport());
    updateLocalOrbSizes(window.innerWidth);
    prefersReducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    mountTimeRef.current = performance.now();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => updateLocalOrbSizes(window.innerWidth), 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  /* --------------------------------------------------------
     Audio init
     -------------------------------------------------------- */
  const audioStartingRef = useRef(false);
  const handleAudioStart = useCallback(async () => {
    if (audioStarted || audioStartingRef.current) return;
    audioStartingRef.current = true;
    try {
      await initAudio();
      initStereoSynths();
      startMetronome(controlsRef.current.tempo, controlsRef.current.timeSignature);
      progression.setBpmTiming(controlsRef.current.tempo, controlsRef.current.timeSignature);
      setAudioStarted(true);
    } catch {
      audioStartingRef.current = false;
    }
  }, [audioStarted, progression]);

  /* --------------------------------------------------------
     Canvas sizing
     -------------------------------------------------------- */
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      sizeRef.current = { w: rect.width, h: rect.height };
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    return () => ro.disconnect();
  }, []);

  /* --------------------------------------------------------
     Initialize particles
     -------------------------------------------------------- */
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    const chord = PROGRESSION[0];
    const { w, h } = sizeRef.current;

    const doInit = (w: number, h: number) => {
      const mobile = isMobileViewport();
      const voicing = splitChordVoicing(chord);
      const bassBounds = getHalfBounds('bass', w, h, mobile);
      const trebleBounds = getHalfBounds('treble', w, h, mobile);

      bassParticlesRef.current = createParticles(
        voicing.bassFreqs, voicing.bassNotes, voicing.bassTones,
        chord.harmonicFunction, bassBounds, 'bass',
      );
      trebleParticlesRef.current = createParticles(
        voicing.trebleFreqs, voicing.trebleNotes, voicing.trebleTones,
        chord.harmonicFunction, trebleBounds, 'treble',
      );
      initializedRef.current = true;
    };

    if (w === 0 || h === 0) {
      const t = setTimeout(() => {
        const { w: w2, h: h2 } = sizeRef.current;
        if (w2 > 0 && h2 > 0 && !initializedRef.current) doInit(w2, h2);
      }, 100);
      return () => clearTimeout(t);
    }
    doInit(w, h);
  }, []);

  /* --------------------------------------------------------
     Chord change handler
     -------------------------------------------------------- */
  useEffect(() => {
    progression.onChordChange((newChord, idx) => {
      chordFlashRef.current = performance.now();
      selectedChordRef.current = idx;
      chordNameRef.current = newChord.name;
      setSelectedChord(idx);

      const voicing = splitChordVoicing(newChord);

      voiceLeadHalf(
        bassParticlesRef.current,
        voicing.bassFreqs, voicing.bassNotes, voicing.bassTones,
        newChord.harmonicFunction,
        bassLerpStart.current, bassLerpTarget.current,
      );
      voiceLeadHalf(
        trebleParticlesRef.current,
        voicing.trebleFreqs, voicing.trebleNotes, voicing.trebleTones,
        newChord.harmonicFunction,
        trebleLerpStart.current, trebleLerpTarget.current,
      );

      lerpStartTimeRef.current = performance.now();
      isLerpingRef.current = true;
    });
  }, [progression]);

  // Decay & reverb controls
  useEffect(() => {
    setDecay(controls.decay);
    setDecayStereo(controls.decay);
  }, [controls.decay]);
  useEffect(() => { setReverbMix(controls.reverbMix); }, [controls.reverbMix]);

  // Tempo & time signature
  useEffect(() => {
    if (!audioStarted) return;
    setMetronomeTempo(controls.tempo);
    progression.setBpmTiming(controls.tempo, controls.timeSignature);
  }, [controls.tempo, audioStarted, controls.timeSignature, progression]);

  useEffect(() => {
    if (!audioStarted) return;
    setMetronomeTimeSignature(controls.timeSignature);
    progression.setBpmTiming(controls.tempo, controls.timeSignature);
  }, [controls.timeSignature, audioStarted, controls.tempo, progression]);

  /* --------------------------------------------------------
     Interaction: mouse + touch
     -------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      gravitySourceRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    const handleMouseLeave = () => { gravitySourceRef.current = null; };

    const handleTouchStart = (e: TouchEvent) => {
      handleAudioStart();
      const touch = e.touches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      const g = gyroRef.current;
      if (g.permissionState === 'denied' || !g.isAvailable) {
        gravitySourceRef.current = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      const g = gyroRef.current;
      if (g.permissionState === 'denied' || !g.isAvailable) {
        const touch = e.touches[0];
        if (!touch) return;
        const rect = canvas.getBoundingClientRect();
        gravitySourceRef.current = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
    };
    const handleTouchEnd = () => {
      const g = gyroRef.current;
      if (g.permissionState === 'denied' || !g.isAvailable) {
        gravitySourceRef.current = null;
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleAudioStart]);

  /* --------------------------------------------------------
     Main RAF loop
     -------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 16.667 : 1;
      lastTimeRef.current = time;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const mobile = isMobileViewport();

      // Pause when settings panel is open
      if (controlsRef.current.paused) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Update gyro gravity
      const g = gyroRef.current;
      if (mobile && (g.permissionState === 'granted' || g.permissionState === 'not-required')) {
        gyroGravityRef.current = {
          gx: (g.gammaNorm - 0.5) * 2,
          gy: (g.betaNorm - 0.5) * 2,
        };
      }

      // Frequency lerp
      if (isLerpingRef.current) {
        const elapsed = time - lerpStartTimeRef.current;
        const progress = elapsed / LERP_DURATION;
        applyLerp(bassParticlesRef.current, progress, bassLerpStart.current, bassLerpTarget.current);
        applyLerp(trebleParticlesRef.current, progress, trebleLerpStart.current, trebleLerpTarget.current);
        if (progress >= 1) isLerpingRef.current = false;
      }

      // Determine cursor side for per-half gravity
      const gs = gravitySourceRef.current;
      let bassGravity: { x: number; y: number } | null = null;
      let trebleGravity: { x: number; y: number } | null = null;
      if (gs) {
        const side = getCursorSide(gs.x, gs.y, w, h, mobile);
        if (side === 'bass') bassGravity = gs;
        else trebleGravity = gs;
      }

      // Physics step — each half independently
      const bassBounds = getHalfBounds('bass', w, h, mobile);
      const trebleBounds = getHalfBounds('treble', w, h, mobile);

      const bassResult = stepParticles(
        bassParticlesRef.current, dt, bassBounds,
        bassGravity, gyroGravityRef.current, bassCooldownRef.current,
      );
      const trebleResult = stepParticles(
        trebleParticlesRef.current, dt, trebleBounds,
        trebleGravity, gyroGravityRef.current, trebleCooldownRef.current,
      );

      // Play audio
      if (isAudioReady()) {
        for (const eb of bassResult.edgeBounces) {
          playNoteStereo(eb.frequency, eb.velocity, 'bass');
        }
        for (const eb of trebleResult.edgeBounces) {
          playNoteStereo(eb.frequency, eb.velocity, 'treble');
        }
        for (const col of bassResult.collisions) {
          playDyadStereo(col.freqA, col.freqB, col.velocity, 'bass');
          const pA = bassParticlesRef.current.find((p) => p.id === col.idA);
          const pB = bassParticlesRef.current.find((p) => p.id === col.idB);
          collisionLinesRef.current.push({
            x1: pA?.x ?? col.midX, y1: pA?.y ?? col.midY,
            x2: pB?.x ?? col.midX, y2: pB?.y ?? col.midY,
            time, side: 'bass',
          });
        }
        for (const col of trebleResult.collisions) {
          playDyadStereo(col.freqA, col.freqB, col.velocity, 'treble');
          const pA = trebleParticlesRef.current.find((p) => p.id === col.idA);
          const pB = trebleParticlesRef.current.find((p) => p.id === col.idB);
          collisionLinesRef.current.push({
            x1: pA?.x ?? col.midX, y1: pA?.y ?? col.midY,
            x2: pB?.x ?? col.midX, y2: pB?.y ?? col.midY,
            time, side: 'treble',
          });
        }
      }

      // ---- RENDER ----
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, w, h);

      // Collision lines
      collisionLinesRef.current = collisionLinesRef.current.filter(
        (l) => time - l.time < COLLISION_LINE_DURATION,
      );
      for (const line of collisionLinesRef.current) {
        const lineAlpha = 0.3 * (1 - (time - line.time) / COLLISION_LINE_DURATION);
        ctx.strokeStyle = `rgba(235, 226, 214, ${lineAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      }

      // Draw all particles (bass then treble)
      const allParticles = [...bassParticlesRef.current, ...trebleParticlesRef.current];
      for (const p of allParticles) {
        const alpha = p.fadeOut ? 0.3 : 1;

        // Spawn spring scale
        const spawnAge = time - p.spawnTime;
        let spawnScale = 1;
        if (spawnAge < 250) {
          const t = spawnAge / 250;
          spawnScale = 1 - 0.7 * Math.exp(-6 * t) * Math.cos(t * Math.PI * 2.5);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(spawnScale, spawnScale);

        const noteColor = NOTE_COLORS[p.note] ?? p.color;
        const fillAlpha = 0.1 + p.brightness * 0.15;
        const strokeAlpha = 0.6 + p.brightness * 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = colorWithAlpha(noteColor, fillAlpha * alpha);
        ctx.fill();
        ctx.strokeStyle = colorWithAlpha(noteColor, strokeAlpha * alpha);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Note label
        const fontSize = Math.max(10, Math.round(p.radius * 0.35));
        ctx.font = `${fontSize}px "DM Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(noteColor, (0.6 + p.brightness * 0.3) * alpha);
        const displayNote = p.note.replace(/[0-9]/g, '').replace('#', '\u266F').replace(/(?<=^[A-G])b/, '\u266D');
        ctx.fillText(displayNote, 0, 0);

        ctx.restore();
      }

      // Divider line (dashed)
      ctx.strokeStyle = 'rgba(214, 197, 171, 0.08)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      if (mobile) {
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
      } else {
        ctx.moveTo(w / 2, 0);
        ctx.lineTo(w / 2, h);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Chord labels — full chord name on each side with clef symbols
      if (selectedChordRef.current !== null) {
        const flashElapsed = time - chordFlashRef.current;
        const flashAlpha = flashElapsed < 500
          ? 0.06 + 0.1 * (1 - flashElapsed / 500)
          : 0.06;
        const chordFontSize = mobile ? 36 : 54;
        const name = chordNameRef.current;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(214, 197, 171, ${flashAlpha})`;

        // Full chord name on each side with clef indicator
        // Draw clef indicator above, chord name centered
        const clefSize = mobile ? 11 : 13;
        const clefOffset = chordFontSize * 0.55 + 4;

        if (mobile) {
          // Bass on bottom
          ctx.font = `italic ${chordFontSize}px Georgia, "Times New Roman", serif`;
          ctx.fillText(name, w / 2, h * 0.75);
          ctx.font = `${clefSize}px "DM Sans", sans-serif`;
          ctx.fillStyle = `rgba(214, 197, 171, ${flashAlpha * 0.6})`;
          ctx.fillText('BASS', w / 2, h * 0.75 - clefOffset);
          // Treble on top
          ctx.fillStyle = `rgba(214, 197, 171, ${flashAlpha})`;
          ctx.font = `italic ${chordFontSize}px Georgia, "Times New Roman", serif`;
          ctx.fillText(name, w / 2, h * 0.25);
          ctx.font = `${clefSize}px "DM Sans", sans-serif`;
          ctx.fillStyle = `rgba(214, 197, 171, ${flashAlpha * 0.6})`;
          ctx.fillText('TREBLE', w / 2, h * 0.25 - clefOffset);
        } else {
          // Bass on left
          ctx.font = `italic ${chordFontSize}px Georgia, "Times New Roman", serif`;
          ctx.fillText(name, w / 4, h / 2);
          ctx.font = `${clefSize}px "DM Sans", sans-serif`;
          ctx.fillStyle = `rgba(214, 197, 171, ${flashAlpha * 0.6})`;
          ctx.fillText('BASS', w / 4, h / 2 - clefOffset);
          // Treble on right
          ctx.fillStyle = `rgba(214, 197, 171, ${flashAlpha})`;
          ctx.font = `italic ${chordFontSize}px Georgia, "Times New Roman", serif`;
          ctx.fillText(name, w * 3 / 4, h / 2);
          ctx.font = `${clefSize}px "DM Sans", sans-serif`;
          ctx.fillStyle = `rgba(214, 197, 171, ${flashAlpha * 0.6})`;
          ctx.fillText('TREBLE', w * 3 / 4, h / 2 - clefOffset);
        }
      }

      // L.H. / R.H. labels — fade out after 3s
      const labelAge = time - mountTimeRef.current;
      if (labelAge < 3000) {
        const labelAlpha = 0.12 * (1 - labelAge / 3000);
        ctx.font = '9px "DM Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(214, 197, 171, ${labelAlpha})`;
        if (mobile) {
          ctx.fillText('R.H.', w / 2, 16);
          ctx.fillText('L.H.', w / 2, h / 2 + 16);
        } else {
          ctx.fillText('L.H.', w / 4, 16);
          ctx.fillText('R.H.', w * 3 / 4, 16);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isMobile]);

  /* --------------------------------------------------------
     Cleanup
     -------------------------------------------------------- */
  useEffect(() => {
    return () => {
      stopMetronome();
      disposeStereoSynths();
      dispose();
    };
  }, []);

  /* --------------------------------------------------------
     Chord dropdown
     -------------------------------------------------------- */
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChordPick = useCallback((idx: number) => {
    try { Tone.start(); } catch { /* retry below */ }
    selectedChordRef.current = idx;
    setSelectedChord(idx);
    setDropdownOpen(false);

    (async () => {
      await handleAudioStart();
      progression.jumpToChord(idx);
      const chord = PROGRESSION[idx];
      const voicing = splitChordVoicing(chord);
      playChordStrumStereo(voicing.bassFreqs, voicing.trebleFreqs);
    })();
  }, [progression, handleAudioStart]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div ref={dropdownRef} className={styles.chordDropdown}>
        <button
          className={styles.chordToggle}
          onClick={() => setDropdownOpen((o) => !o)}
          onTouchStart={() => { try { Tone.start(); } catch { /* noop */ } }}
        >
          <span>{selectedChord !== null ? PROGRESSION[selectedChord].name : 'Select chord'}</span>
          <svg className={`${styles.chevron}${dropdownOpen ? ` ${styles.chevronOpen}` : ''}`} width="8" height="5" viewBox="0 0 8 5">
            <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {dropdownOpen && (
          <div className={styles.chordMenu}>
            {PROGRESSION.map((chord, i) => (
              <button
                key={chord.name}
                className={`${styles.chordOption}${selectedChord !== null && selectedChord === i ? ` ${styles.chordOptionActive}` : ''}`}
                onClick={() => handleChordPick(i)}
              >
                <span className={styles.chordOptionName}>{chord.name}</span>
                <span className={styles.chordOptionSymbol}>{chord.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
