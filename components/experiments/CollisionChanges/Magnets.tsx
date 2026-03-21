'use client';

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../../../lib/useDeviceOrientation';
import { setOrbSizes } from './useParticlePhysics';
import { useChordProgression, PROGRESSION, getChordTone } from './useChordProgression';
import { HARMONIC_COLORS, noteToMidi, CONSONANCE_TABLE } from './chordData';
import * as Tone from 'tone';
import {
  initAudio,
  isAudioReady,
  dispose,
  setDecay,
  setReverbMix,
  startMetronome,
  setMetronomeTempo,
  setMetronomeTimeSignature,
  stopMetronome,
  playDyad,
  playNote,
  playChordStrum,
} from './audioEngine';
import type { Particle, CollisionEvent, ChordTone } from './types';
import styles from './CollisionChanges.module.css';

/* ----------------------------------------------------------
   Constants
   ---------------------------------------------------------- */
const MOBILE_BREAKPOINT = 600;
const LERP_DURATION = 500;
const COLLISION_LINE_DURATION = 200;
const BACKGROUND = '#1F2627';
const COLLISION_COOLDOWN = 600;

// Spring model: each pair has an equilibrium distance based on consonance.
// Consonant pairs rest close together, dissonant pairs rest far apart.
// Both attract when too far and repel when too close — nothing escapes.
const SPRING_K = 0.003;         // Spring stiffness
let REST_DIST_MIN = 130;        // Equilibrium distance for max consonance (unison/octave)
let REST_DIST_MAX = 320;        // Equilibrium distance for max dissonance (tritone)
const TANGENT_RATIO = 0.5;      // Fraction of spring force diverted to tangential orbit
const DAMPING = 0.995;          // Moderate damping
const MAX_SPEED = 3.0;          // Speed cap
const THERMAL_JITTER = 0.02;    // Constant random force — system never fully settles
const CENTER_PULL = 0.005;      // Gentle pull toward canvas center
const CURSOR_G_MILD = 0.06;     // Cursor attraction
const BREATH_DEPTH = 0.25;      // How much rest distances contract/expand with beat (0–1)
const COLLISION_PUSH = 1.5;     // Energy burst on collision — pushes nearby orbs
const FORCE_LINE_FLASH_DURATION = 300;
const TILT_FORCE = 0.03;

// Orb sizes
let ORB_RADIUS_MIN = 30;
let ORB_RADIUS_MAX = 65;

function updateLocalOrbSizes(viewportWidth: number) {
  setOrbSizes(viewportWidth);
  const clampedW = Math.max(320, Math.min(3840, viewportWidth));
  const t = (clampedW - 320) / (3840 - 320);
  // Larger mobile floor (34px min) so orbs collide more on small screens
  ORB_RADIUS_MIN = Math.round(34 + t * (100 - 34));
  ORB_RADIUS_MAX = Math.round(52 + t * (250 - 52));
  // Tighter rest distances on mobile so orbs stay closer and collide more
  REST_DIST_MIN = Math.round(90 + t * (130 - 90));
  REST_DIST_MAX = Math.round(200 + t * (320 - 200));
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

function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ----------------------------------------------------------
   Magnetic force calculation
   ---------------------------------------------------------- */
interface ForceResult {
  fx: number;
  fy: number;
  consonance: number;
  normalizedForce: number;
}

function magnetForce(a: Particle, b: Particle, breathMod: number): ForceResult & { tx: number; ty: number } {
  const interval = Math.abs(noteToMidi(a.note) - noteToMidi(b.note)) % 12;
  const consonance = CONSONANCE_TABLE[interval] ?? 6;
  const normalizedForce = (consonance - 6) / 6; // -1 (repel) to +1 (attract)

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const safeDist = Math.max(dist, 20);
  const nx = dx / safeDist;
  const ny = dy / safeDist;

  // Rest distance: consonant pairs rest close, dissonant pairs rest far
  // consonance 0 (tritone) → REST_DIST_MAX, consonance 12 (unison) → REST_DIST_MIN
  // breathMod oscillates ±BREATH_DEPTH: negative = contract, positive = expand
  const baseRestDist = REST_DIST_MAX - (consonance / 12) * (REST_DIST_MAX - REST_DIST_MIN);
  const restDist = baseRestDist * (1 + breathMod * BREATH_DEPTH);

  // Spring force: positive = attract (too far), negative = repel (too close)
  const displacement = dist - restDist;
  const springMag = displacement * SPRING_K;
  const clampedMag = Math.max(-0.3, Math.min(0.3, springMag));

  // Radial component (with tangential split)
  const radialFrac = 1 - TANGENT_RATIO;
  const fx = nx * clampedMag * radialFrac;
  const fy = ny * clampedMag * radialFrac;

  // Tangential component — creates orbiting dance
  const tx = -ny * clampedMag * TANGENT_RATIO;
  const ty = nx * clampedMag * TANGENT_RATIO;

  return { fx, fy, tx, ty, consonance, normalizedForce };
}

/* ----------------------------------------------------------
   Force line data for rendering
   ---------------------------------------------------------- */
interface ForceLine {
  x1: number; y1: number;
  x2: number; y2: number;
  consonance: number;
  normalizedForce: number;
}

/* ----------------------------------------------------------
   Particle creation
   ---------------------------------------------------------- */
let nextId = 4000;
function makeId(): string { return `mg${nextId++}`; }

const ORB_CHORD_TONES: ChordTone[] = ['root', '3rd', '5th', '7th', '5th', '9th', 'root'];

function createMagnetParticles(
  chord: typeof PROGRESSION[0],
  canvasW: number,
  canvasH: number,
): Particle[] {
  const freqs = [
    chord.frequencies[0],
    chord.frequencies[1],
    chord.frequencies[2],
    chord.frequencies[3],
    chord.frequencies[2] * 2,
    chord.ninth!.frequency,
    chord.frequencies[0] * 2,
  ];
  const notes = [
    chord.notes[0], chord.notes[1], chord.notes[2], chord.notes[3],
    chord.notes[2], chord.ninth!.note, chord.notes[0],
  ];

  const now = performance.now();
  const cx = canvasW / 2;
  const cy = canvasH / 2;

  // Spread orbs in a circle for a visually interesting initial state
  const spawnRadius = Math.min(canvasW, canvasH) * 0.3;

  return freqs.map((freq, i) => {
    const angle = (i / freqs.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const r = spawnRadius * (0.5 + Math.random() * 0.5);
    return {
    id: makeId(),
    x: cx + Math.cos(angle) * r,
    y: cy + Math.sin(angle) * r,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    radius: Math.max(isMobileViewport() ? 36 : 20, ORB_RADIUS_MIN + Math.random() * (ORB_RADIUS_MAX - ORB_RADIUS_MIN) * 0.5),
    note: notes[i],
    frequency: freq,
    targetFrequency: freq,
    chordTone: ORB_CHORD_TONES[i],
    harmonicFunction: chord.harmonicFunction,
    color: HARMONIC_COLORS[chord.harmonicFunction],
    mass: 1,
    brightness: 0,
    trail: [],
    spawnTime: now,
    fadeOut: false,
  };
  });
}

/* ----------------------------------------------------------
   Physics step
   ---------------------------------------------------------- */
function stepMagnets(
  particles: Particle[],
  dt: number,
  canvasW: number,
  canvasH: number,
  grabbedId: string | null,
  cursorX: number | null,
  cursorY: number | null,
  gyroGx: number,
  gyroGy: number,
  forceLines: ForceLine[],
  breathPhase: number,
): CollisionEvent[] {
  const now = performance.now();
  const cappedDt = Math.min(dt, 3);
  const events: CollisionEvent[] = [];

  // Clear force lines for this frame
  forceLines.length = 0;

  // Magnetic forces + soft-body repulsion between all pairs
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i];
      const b = particles[j];
      if (a.fadeOut || b.fadeOut) continue;

      // Breathing: cosine wave synced to beat — contracts on downbeat, expands between
      const breathMod = Math.cos(breathPhase * Math.PI * 2); // -1 to +1
      const { fx, fy, tx, ty, consonance, normalizedForce } = magnetForce(a, b, breathMod);

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Store force line for rendering
      forceLines.push({
        x1: a.x, y1: a.y,
        x2: b.x, y2: b.y,
        consonance,
        normalizedForce,
      });

      // Apply spring + tangential forces
      if (a.id !== grabbedId) {
        a.vx += (fx + tx) * cappedDt;
        a.vy += (fy + ty) * cappedDt;
      }
      if (b.id !== grabbedId) {
        b.vx += (-fx - tx) * cappedDt;
        b.vy += (-fy - ty) * cappedDt;
      }

      // Collision detection (pass-through audio trigger)
      const minDist = a.radius + b.radius;
      if (dist < minDist && dist > 0) {
        const overlapRatio = 1 - dist / minDist;
        a.brightness = Math.max(a.brightness, 0.3 + overlapRatio * 0.7);
        b.brightness = Math.max(b.brightness, 0.3 + overlapRatio * 0.7);

        events.push({
          idA: a.id,
          idB: b.id,
          velocity: Math.min(1, Math.max(0.15, overlapRatio * 2)),
          freqA: a.frequency,
          freqB: b.frequency,
          midX: (a.x + b.x) / 2,
          midY: (a.y + b.y) / 2,
          time: now,
        });
      }
    }
  }

  const cx = canvasW / 2;
  const cy = canvasH / 2;

  for (const p of particles) {
    if (p.id === grabbedId) continue;

    // Thermal jitter — constant random perturbation keeps the system alive
    const jitterAngle = Math.random() * Math.PI * 2;
    p.vx += Math.cos(jitterAngle) * THERMAL_JITTER * cappedDt;
    p.vy += Math.sin(jitterAngle) * THERMAL_JITTER * cappedDt;

    // Center pull — gentle, keeps the constellation near the middle
    const toCenterX = cx - p.x;
    const toCenterY = cy - p.y;
    const centerDist = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
    if (centerDist > 30) {
      p.vx += (toCenterX / centerDist) * CENTER_PULL * cappedDt;
      p.vy += (toCenterY / centerDist) * CENTER_PULL * cappedDt;
    }

    // Cursor pull (when not dragging)
    if (cursorX !== null && cursorY !== null && !grabbedId) {
      const cdx = cursorX - p.x;
      const cdy = cursorY - p.y;
      const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
      if (cdist > 20 && cdist < 400) {
        p.vx += (cdx / cdist) * CURSOR_G_MILD * cappedDt;
        p.vy += (cdy / cdist) * CURSOR_G_MILD * cappedDt;
      }
    }

    // Tilt force (mobile)
    p.vx += gyroGx * TILT_FORCE * cappedDt;
    p.vy += gyroGy * TILT_FORCE * cappedDt;

    p.vx *= DAMPING;
    p.vy *= DAMPING;

    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > MAX_SPEED) {
      p.vx = (p.vx / speed) * MAX_SPEED;
      p.vy = (p.vy / speed) * MAX_SPEED;
    }

    p.x += p.vx * cappedDt;
    p.y += p.vy * cappedDt;

    // Edge bounce
    if (p.x < p.radius) { p.x = p.radius; p.vx *= -0.5; }
    if (p.x > canvasW - p.radius) { p.x = canvasW - p.radius; p.vx *= -0.5; }
    if (p.y < p.radius) { p.y = p.radius; p.vy *= -0.5; }
    if (p.y > canvasH - p.radius) { p.y = canvasH - p.radius; p.vy *= -0.5; }

    // Brightness decay
    if (p.brightness > 0) {
      p.brightness = Math.max(0, p.brightness - 0.02 * cappedDt);
    }
  }

  return events;
}

/* ----------------------------------------------------------
   Voice-leading for magnet particles
   ---------------------------------------------------------- */
function voiceLeadMagnets(
  particles: Particle[],
  chord: typeof PROGRESSION[0],
  lerpStartMap: Map<string, number>,
  lerpTargetMap: Map<string, number>,
) {
  lerpStartMap.clear();
  lerpTargetMap.clear();
  const now = performance.now();

  const targetFreqs = [
    chord.frequencies[0],
    chord.frequencies[1],
    chord.frequencies[2],
    chord.frequencies[3],
    chord.frequencies[2] * 2,
    chord.ninth!.frequency,
    chord.frequencies[0] * 2,
  ];
  const targetNotes = [
    chord.notes[0], chord.notes[1], chord.notes[2], chord.notes[3],
    chord.notes[2], chord.ninth!.note, chord.notes[0],
  ];

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
    p.chordTone = ORB_CHORD_TONES[tIdx];
    p.harmonicFunction = chord.harmonicFunction;
    p.color = HARMONIC_COLORS[chord.harmonicFunction];
    p.spawnTime = now;
  });
}

function applyLerp(
  particles: Particle[],
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

/* ==========================================================
   Magnets Component
   ========================================================== */
export default function Magnets() {
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
  const audioStartedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedChord, setSelectedChord] = useState<number | null>(null);

  const progression = useChordProgression();

  // Particle array
  const particlesRef = useRef<Particle[]>([]);
  const cooldownRef = useRef<Map<string, number>>(new Map());

  // Lerp maps
  const lerpStartMap = useRef<Map<string, number>>(new Map());
  const lerpTargetMap = useRef<Map<string, number>>(new Map());
  const lerpStartTimeRef = useRef(0);
  const isLerpingRef = useRef(false);

  // Cursor position
  const cursorRef = useRef<{ x: number; y: number } | null>(null);

  // Grab state
  const grabbedIdRef = useRef<string | null>(null);

  // Mobile pin state
  const pinnedIdRef = useRef<string | null>(null);

  // Chord change visual state
  const selectedChordRef = useRef<number | null>(null);
  const chordFlashRef = useRef(0);
  const chordNameRef = useRef(PROGRESSION[0].name);

  // Force lines (recalculated each frame in physics step)
  const forceLinesRef = useRef<ForceLine[]>([]);

  // Collision lines
  const collisionLinesRef = useRef<
    { x1: number; y1: number; x2: number; y2: number; time: number }[]
  >([]);

  const prefersReducedRef = useRef(false);

  /* --------------------------------------------------------
     Mobile detection + orb sizing
     -------------------------------------------------------- */
  useEffect(() => {
    setIsMobile(isMobileViewport());
    updateLocalOrbSizes(window.innerWidth);
    prefersReducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      startMetronome(controlsRef.current.tempo, controlsRef.current.timeSignature);
      progression.setBpmTiming(controlsRef.current.tempo, controlsRef.current.timeSignature);
      setAudioStarted(true);
      audioStartedRef.current = true;
    } catch {
      audioStartingRef.current = false;
    }
  }, [audioStarted, progression]);

  // Auto-init audio when sound is enabled and AudioContext is running
  useEffect(() => {
    if (audioStarted) return;
    if (!controls.soundEnabled) return;
    const ctx = Tone.getContext().rawContext;
    if (!ctx) return;
    const check = () => {
      if (ctx.state === 'running' && controlsRef.current.soundEnabled) {
        handleAudioStart();
      }
    };
    check();
    ctx.addEventListener('statechange', check);
    return () => ctx.removeEventListener('statechange', check);
  }, [audioStarted, controls.soundEnabled, handleAudioStart]);

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
      particlesRef.current = createMagnetParticles(chord, w, h);
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
    progression.onChordChange((newChord) => {
      chordFlashRef.current = performance.now();
      chordNameRef.current = newChord.name;

      voiceLeadMagnets(
        particlesRef.current,
        newChord,
        lerpStartMap.current,
        lerpTargetMap.current,
      );

      lerpStartTimeRef.current = performance.now();
      isLerpingRef.current = true;
    });
  }, [progression]);

  // Decay & reverb controls
  useEffect(() => { setDecay(controls.decay); }, [controls.decay]);
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
     Interaction: mouse + touch (grab-and-drag + mobile pin)
     -------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hitTest = (x: number, y: number): Particle | null => {
      let closest: Particle | null = null;
      let closestDist = Infinity;
      for (const p of particlesRef.current) {
        const dx = p.x - x, dy = p.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < p.radius * 1.3 && dist < closestDist) {
          closest = p;
          closestDist = dist;
        }
      }
      return closest;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = hitTest(x, y);
      if (hit) {
        grabbedIdRef.current = hit.id;
        cursorRef.current = { x, y };
        canvas.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cursorRef.current = { x, y };

      if (grabbedIdRef.current) {
        canvas.style.cursor = 'grabbing';
      } else {
        const hit = hitTest(x, y);
        canvas.style.cursor = hit ? 'grab' : 'default';
      }
    };

    const handleMouseUp = () => {
      grabbedIdRef.current = null;
      canvas.style.cursor = 'default';
    };

    const handleMouseLeave = () => {
      grabbedIdRef.current = null;
      cursorRef.current = null;
      canvas.style.cursor = 'default';
    };

    let touchDragged = false;

    const handleTouchStart = (e: TouchEvent) => {
      handleAudioStart();
      const touch = e.touches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      touchDragged = false;
      const hit = hitTest(x, y);
      if (hit) {
        grabbedIdRef.current = hit.id;
      }
      cursorRef.current = { x, y };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchDragged = true;
      const rect = canvas.getBoundingClientRect();
      cursorRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    };

    const handleTouchEnd = () => {
      // If it was a tap (no drag) on an orb, toggle pin
      if (!touchDragged && grabbedIdRef.current) {
        const id = grabbedIdRef.current;
        if (pinnedIdRef.current === id) {
          pinnedIdRef.current = null;
        } else {
          pinnedIdRef.current = id;
        }
      }
      grabbedIdRef.current = null;
      cursorRef.current = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
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

      // Frequency lerp
      if (isLerpingRef.current) {
        const elapsed = time - lerpStartTimeRef.current;
        const progress = elapsed / LERP_DURATION;
        applyLerp(particlesRef.current, progress, lerpStartMap.current, lerpTargetMap.current);
        if (progress >= 1) isLerpingRef.current = false;
      }

      // Grabbed orb: lerp toward cursor
      if (grabbedIdRef.current && cursorRef.current) {
        const grabbed = particlesRef.current.find(p => p.id === grabbedIdRef.current);
        if (grabbed) {
          grabbed.x += (cursorRef.current.x - grabbed.x) * 0.25;
          grabbed.y += (cursorRef.current.y - grabbed.y) * 0.25;
          grabbed.vx = (cursorRef.current.x - grabbed.x) * 0.1;
          grabbed.vy = (cursorRef.current.y - grabbed.y) * 0.1;
          grabbed.brightness = 0.3;
        }
      }

      // Pinned orb (mobile): freeze position
      if (pinnedIdRef.current) {
        const pinned = particlesRef.current.find(p => p.id === pinnedIdRef.current);
        if (pinned) {
          pinned.vx = 0;
          pinned.vy = 0;
          pinned.brightness = 0.2;
        }
      }

      // Compute gyro forces
      let gyroGx = 0;
      let gyroGy = 0;
      const g = gyroRef.current;
      if (mobile && (g.permissionState === 'granted' || g.permissionState === 'not-required')) {
        gyroGx = (g.gammaNorm - 0.5) * 2;
        gyroGy = (g.betaNorm - 0.5) * 2;
      }

      // Compute breath phase synced to tempo
      const bpm = controlsRef.current.tempo;
      const beatMs = 60000 / bpm;
      const breathPhase = audioStartedRef.current ? (time % beatMs) / beatMs : 0;

      // Physics step
      const effectiveGrabbedId = grabbedIdRef.current ?? pinnedIdRef.current;
      const cursorX = cursorRef.current?.x ?? null;
      const cursorY = cursorRef.current?.y ?? null;

      const collisionEvents = stepMagnets(
        particlesRef.current,
        dt,
        w,
        h,
        effectiveGrabbedId,
        cursorX,
        cursorY,
        gyroGx,
        gyroGy,
        forceLinesRef.current,
        breathPhase,
      );

      // Play collision audio with cooldown
      if (isAudioReady()) {
        const now = performance.now();
        for (const col of collisionEvents) {
          const pairKey = col.idA < col.idB ? `${col.idA}:${col.idB}` : `${col.idB}:${col.idA}`;
          const lastCollision = cooldownRef.current.get(pairKey) ?? 0;
          if (now - lastCollision > COLLISION_COOLDOWN) {
            cooldownRef.current.set(pairKey, now);
            playDyad(col.freqA, col.freqB, col.velocity);
            const pA = particlesRef.current.find((p) => p.id === col.idA);
            const pB = particlesRef.current.find((p) => p.id === col.idB);
            collisionLinesRef.current.push({
              x1: pA?.x ?? col.midX,
              y1: pA?.y ?? col.midY,
              x2: pB?.x ?? col.midX,
              y2: pB?.y ?? col.midY,
              time,
            });

            // Energy burst — push nearby orbs outward from collision point
            for (const p of particlesRef.current) {
              if (p.id === col.idA || p.id === col.idB) continue;
              const pdx = p.x - col.midX;
              const pdy = p.y - col.midY;
              const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
              if (pdist < 250 && pdist > 1) {
                const pushStr = (1 - pdist / 250) * COLLISION_PUSH * col.velocity;
                p.vx += (pdx / pdist) * pushStr;
                p.vy += (pdy / pdist) * pushStr;
              }
            }
          }
        }
      }

      // ---- RENDER ----
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, w, h);

      // Force lines (between all pairs)
      const chordFlashActive = time - chordFlashRef.current < FORCE_LINE_FLASH_DURATION;
      for (const line of forceLinesRef.current) {
        const absForce = Math.abs(line.normalizedForce);
        if (absForce < 0.1) continue;

        const isConsonant = line.normalizedForce > 0;
        const baseOpacity = 0.04 + absForce * 0.14; // Much more visible
        const flashMult = chordFlashActive ? 2.5 : 1.0;
        const opacity = Math.min(baseOpacity * flashMult, 0.4);

        ctx.strokeStyle = isConsonant
          ? `rgba(214, 197, 171, ${opacity})`   // DUN for consonant (warm cream)
          : `rgba(242, 92, 84, ${opacity * 1.4})`;  // BITTERSWEET for dissonant (brighter red)

        ctx.lineWidth = 0.5;
        if (isConsonant) {
          ctx.setLineDash([]);
        } else {
          ctx.setLineDash([6, 5]);
        }
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

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

      // Draw orbs
      for (const p of particlesRef.current) {
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

        // Grabbed/pinned orb glow ring
        if (grabbedIdRef.current === p.id || pinnedIdRef.current === p.id) {
          ctx.beginPath();
          ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = colorWithAlpha(noteColor, 0.25);
          ctx.lineWidth = 2;
          ctx.stroke();
        }

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

      // Chord label (Georgia italic)
      if (selectedChordRef.current !== null) {
        const flashElapsed = time - chordFlashRef.current;
        const flashAlpha = flashElapsed < 500
          ? 0.06 + 0.1 * (1 - flashElapsed / 500)
          : 0.06;
        const chordFontSize = mobile ? 48 : 72;
        ctx.font = `italic ${chordFontSize}px Georgia, "Times New Roman", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(214, 197, 171, ${flashAlpha})`;
        ctx.fillText(chordNameRef.current, w / 2, h / 2);
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
      const freqs = [...chord.frequencies];
      if (chord.ninth) freqs.push(chord.ninth.frequency);
      freqs.push(chord.frequencies[2] * 2); // extra 5th
      freqs.push(chord.frequencies[0] * 2); // octave root
      playChordStrum(freqs);
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
