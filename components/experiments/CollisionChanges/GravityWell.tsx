'use client';

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../../../lib/useDeviceOrientation';
import { setOrbSizes } from './useParticlePhysics';
import { useChordProgression, PROGRESSION, getChordTone } from './useChordProgression';
import { HARMONIC_COLORS } from './chordData';
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
import type { Particle, CollisionEvent, HarmonicFunction, ChordTone } from './types';
import styles from './CollisionChanges.module.css';

/* ----------------------------------------------------------
   Constants
   ---------------------------------------------------------- */
const MOBILE_BREAKPOINT = 600;
const LERP_DURATION = 500;
const CHORD_FLASH_DURATION = 200;
const COLLISION_LINE_DURATION = 200;
const BACKGROUND = '#1F2627';
const COLLISION_COOLDOWN = 600;
const KEPLER_K = 30;
const CURSOR_G = 0.15;
const ATTRACTION_RADIUS = 400;

// Orbit radii by chord tone role — desktop
const ORBIT_RADII_DESKTOP: Record<string, [number, number]> = {
  root:       [80, 100],
  '3rd':      [120, 145],
  '5th':      [165, 190],
  '7th':      [210, 240],
  'extra5th': [255, 280],
  '9th':      [295, 320],
  octaveRoot: [335, 360],
};

// Mobile: tighter orbits so orbs cross paths more often
const ORBIT_RADII_MOBILE: Record<string, [number, number]> = {
  root:       [55, 70],
  '3rd':      [80, 100],
  '5th':      [110, 130],
  '7th':      [140, 165],
  'extra5th': [175, 195],
  '9th':      [205, 225],
  octaveRoot: [235, 255],
};

function getOrbitRadii(): Record<string, [number, number]> {
  return isMobileViewport() ? ORBIT_RADII_MOBILE : ORBIT_RADII_DESKTOP;
}

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

function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ----------------------------------------------------------
   Orbital helpers
   ---------------------------------------------------------- */
function assignOrbitRadius(role: string): number {
  const radii = getOrbitRadii();
  const [min, max] = radii[role] ?? [100, 120];
  return min + Math.random() * (max - min);
}

function keplerAngularVelocity(radius: number): number {
  return KEPLER_K / Math.pow(radius, 1.5);
}

/* ----------------------------------------------------------
   Particle creation for orbital mode
   ---------------------------------------------------------- */
let nextId = 2000;
function makeId(): string { return `gw${nextId++}`; }

// The 7 orb roles in order
const ORB_ROLES: string[] = ['root', '3rd', '5th', '7th', 'extra5th', '9th', 'octaveRoot'];
const ORB_CHORD_TONES: ChordTone[] = ['root', '3rd', '5th', '7th', '5th', '9th', 'root'];

function createOrbitalParticles(
  chord: typeof PROGRESSION[0],
  centerX: number,
  centerY: number,
): Particle[] {
  // Build 7-note voicing: root, 3rd, 5th, 7th, extra5th (octave up), 9th, octaveRoot
  const freqs = [
    chord.frequencies[0],       // root
    chord.frequencies[1],       // 3rd
    chord.frequencies[2],       // 5th
    chord.frequencies[3],       // 7th
    chord.frequencies[2] * 2,   // extra 5th (octave up)
    chord.ninth!.frequency,     // 9th
    chord.frequencies[0] * 2,   // octave root
  ];
  const notes = [
    chord.notes[0],
    chord.notes[1],
    chord.notes[2],
    chord.notes[3],
    chord.notes[2],
    chord.ninth!.note,
    chord.notes[0],
  ];

  const now = performance.now();

  return ORB_ROLES.map((role, i) => {
    const orbitRadius = assignOrbitRadius(role);
    const angle = Math.random() * Math.PI * 2;
    const angularVelocity = keplerAngularVelocity(orbitRadius);

    return {
      id: makeId(),
      x: centerX + orbitRadius * Math.cos(angle),
      y: centerY + orbitRadius * Math.sin(angle),
      vx: 0,
      vy: 0,
      radius: Math.max(isMobileViewport() ? 28 : 20, ORB_RADIUS_MIN + Math.random() * (ORB_RADIUS_MAX - ORB_RADIUS_MIN) * 0.5),
      note: notes[i],
      frequency: freqs[i],
      targetFrequency: freqs[i],
      chordTone: ORB_CHORD_TONES[i],
      harmonicFunction: chord.harmonicFunction,
      color: HARMONIC_COLORS[chord.harmonicFunction],
      mass: 1,
      brightness: 0,
      trail: [],
      spawnTime: now,
      fadeOut: false,
      orbitRadius,
      angularVelocity,
      angle,
      targetOrbitRadius: orbitRadius,
    };
  });
}

/* ----------------------------------------------------------
   Physics step
   ---------------------------------------------------------- */
interface EdgeBounce {
  frequency: number;
  velocity: number;
}

function stepOrbital(
  particles: Particle[],
  dt: number,
  centerX: number,
  centerY: number,
  canvasW: number,
  canvasH: number,
  gravitySource: { x: number; y: number } | null,
  cooldownMap: Map<string, number>,
  draggedId: string | null,
): { collisions: CollisionEvent[]; edgeBounces: EdgeBounce[] } {
  const now = performance.now();
  const events: CollisionEvent[] = [];
  const edgeBounces: EdgeBounce[] = [];
  const cappedDt = Math.min(dt, 3);

  for (const p of particles) {
    if (p.fadeOut || p.id === draggedId) continue;
    if (p.orbitRadius === undefined || p.angularVelocity === undefined || p.angle === undefined) continue;

    // Smooth orbit radius transitions (chord change spiraling)
    if (p.targetOrbitRadius !== undefined && Math.abs(p.orbitRadius - p.targetOrbitRadius) > 0.5) {
      p.orbitRadius += (p.targetOrbitRadius - p.orbitRadius) * 0.05 * cappedDt;
      p.angularVelocity = keplerAngularVelocity(p.orbitRadius);
    }

    // Advance angle
    p.angle += p.angularVelocity * cappedDt;

    // Position from polar → cartesian
    p.x = centerX + p.orbitRadius * Math.cos(p.angle);
    p.y = centerY + p.orbitRadius * Math.sin(p.angle);

    // Cursor attraction (gentle perturbation)
    if (gravitySource) {
      const dx = gravitySource.x - p.x;
      const dy = gravitySource.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ATTRACTION_RADIUS && dist > 1) {
        const force = (CURSOR_G * 0.3) / dist;
        p.x += (force * dx) * cappedDt;
        p.y += (force * dy) * cappedDt;
      }
    }

    // Brightness decay
    if (p.brightness > 0) {
      p.brightness = Math.max(0, p.brightness - 0.02 * cappedDt);
    }

    // No edge clamping — orbs orbit freely off-screen and come back around
  }

  // Collision detection — pass-through (orbs overlap, no physical separation)
  // Triggers audio + brightness glow when orbits cross
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i];
      const b = particles[j];
      if (a.fadeOut || b.fadeOut) continue;
      if (a.id === draggedId || b.id === draggedId) continue;

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius;

      if (dist < minDist && dist > 0) {
        // Proximity glow — brighter the deeper the overlap
        const overlapRatio = 1 - dist / minDist;
        a.brightness = Math.max(a.brightness, 0.3 + overlapRatio * 0.7);
        b.brightness = Math.max(b.brightness, 0.3 + overlapRatio * 0.7);

        // Audio trigger with cooldown — no physical push, just sound
        const pairKey = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
        const lastCollision = cooldownMap.get(pairKey) ?? 0;
        if (now - lastCollision > COLLISION_COOLDOWN) {
          cooldownMap.set(pairKey, now);
          // Velocity based on relative orbital speed
          const relV = Math.abs(
            (a.angularVelocity ?? 0) * (a.orbitRadius ?? 0) -
            (b.angularVelocity ?? 0) * (b.orbitRadius ?? 0)
          );
          const velocity = Math.min(1, Math.max(0.15, relV / 5));
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
   Voice-leading for orbital particles
   ---------------------------------------------------------- */
function voiceLeadOrbital(
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

    // Assign new orbit radius based on new role
    const role = ORB_ROLES[tIdx];
    p.targetOrbitRadius = assignOrbitRadius(role);
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
   GravityWell Component
   ========================================================== */
export default function GravityWell() {
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

  // Particle array
  const particlesRef = useRef<Particle[]>([]);
  const cooldownRef = useRef<Map<string, number>>(new Map());

  // Lerp maps
  const lerpStartMap = useRef<Map<string, number>>(new Map());
  const lerpTargetMap = useRef<Map<string, number>>(new Map());
  const lerpStartTimeRef = useRef(0);
  const isLerpingRef = useRef(false);

  // Gravity source (cursor/touch)
  const gravitySourceRef = useRef<{ x: number; y: number } | null>(null);

  // Chord change visual state
  const selectedChordRef = useRef<number | null>(null);
  const chordFlashRef = useRef(0);
  const chordNameRef = useRef(PROGRESSION[0].name);

  // Collision lines
  const collisionLinesRef = useRef<
    { x1: number; y1: number; x2: number; y2: number; time: number }[]
  >([]);

  // Slingshot drag state
  const dragRef = useRef<{
    particleId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

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
      particlesRef.current = createOrbitalParticles(chord, w / 2, h / 2);
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

      voiceLeadOrbital(
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
     Interaction: mouse + touch (slingshot + attractor)
     -------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const findParticleAt = (x: number, y: number): Particle | null => {
      for (const p of particlesRef.current) {
        const dx = p.x - x;
        const dy = p.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < p.radius * 1.3) return p;
      }
      return null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = findParticleAt(x, y);
      if (hit) {
        dragRef.current = {
          particleId: hit.id,
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
        };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (dragRef.current) {
        dragRef.current.currentX = x;
        dragRef.current.currentY = y;
        // Move dragged particle to cursor
        const p = particlesRef.current.find((p) => p.id === dragRef.current?.particleId);
        if (p) {
          p.x = x;
          p.y = y;
        }
      } else {
        gravitySourceRef.current = { x, y };
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (dragRef.current) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const { w, h } = sizeRef.current;

        const g = gyroRef.current;
        const mobile = isMobileViewport();
        let centerX = w / 2;
        let centerY = h / 2;
        if (mobile && (g.permissionState === 'granted' || g.permissionState === 'not-required')) {
          centerX += (g.gammaNorm - 0.5) * 160;
          centerY += (g.betaNorm - 0.5) * 120;
        }

        const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const newRadius = Math.max(80, Math.min(360, distFromCenter));

        const p = particlesRef.current.find((p) => p.id === dragRef.current?.particleId);
        if (p) {
          p.targetOrbitRadius = newRadius;
          p.angle = Math.atan2(y - centerY, x - centerX);
          p.orbitRadius = newRadius;
          p.angularVelocity = keplerAngularVelocity(newRadius);
        }
        dragRef.current = null;
      }
    };

    const handleMouseLeave = () => {
      gravitySourceRef.current = null;
      if (dragRef.current) {
        // Release drag if mouse leaves canvas
        const p = particlesRef.current.find((p) => p.id === dragRef.current?.particleId);
        if (p && p.targetOrbitRadius !== undefined) {
          p.orbitRadius = p.targetOrbitRadius;
          p.angularVelocity = keplerAngularVelocity(p.targetOrbitRadius);
        }
        dragRef.current = null;
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      handleAudioStart();
      const touch = e.touches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const g = gyroRef.current;
      if (g.permissionState === 'denied' || !g.isAvailable) {
        gravitySourceRef.current = { x, y };
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

      // Compute orbit center (with tilt offset on mobile)
      let centerX = w / 2;
      let centerY = h / 2;
      const g = gyroRef.current;
      if (mobile && (g.permissionState === 'granted' || g.permissionState === 'not-required')) {
        centerX += (g.gammaNorm - 0.5) * 160; // ±80px
        centerY += (g.betaNorm - 0.5) * 120;  // ±60px
      }

      // Frequency lerp
      if (isLerpingRef.current) {
        const elapsed = time - lerpStartTimeRef.current;
        const progress = elapsed / LERP_DURATION;
        applyLerp(particlesRef.current, progress, lerpStartMap.current, lerpTargetMap.current);
        if (progress >= 1) isLerpingRef.current = false;
      }

      // Physics step
      const draggedId = dragRef.current?.particleId ?? null;
      const { collisions, edgeBounces } = stepOrbital(
        particlesRef.current,
        dt,
        centerX,
        centerY,
        w,
        h,
        dragRef.current ? null : gravitySourceRef.current,
        cooldownRef.current,
        draggedId,
      );

      // Play audio
      if (isAudioReady()) {
        for (const eb of edgeBounces) {
          playNote(eb.frequency, eb.velocity);
        }
        for (const col of collisions) {
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
        }
      }

      // ---- RENDER ----
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, w, h);

      // Orbit ring guides
      const drawnRadii = new Set<number>();
      for (const p of particlesRef.current) {
        if (p.orbitRadius === undefined) continue;
        const rounded = Math.round(p.orbitRadius);
        if (drawnRadii.has(rounded)) continue;
        drawnRadii.add(rounded);
        ctx.strokeStyle = 'rgba(214, 197, 171, 0.03)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, p.orbitRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Slingshot direction line
      if (dragRef.current) {
        const dp = particlesRef.current.find((p) => p.id === dragRef.current?.particleId);
        if (dp) {
          ctx.strokeStyle = 'rgba(214, 197, 171, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(dp.x, dp.y);
          ctx.lineTo(centerX, centerY);
          ctx.stroke();
        }
      }

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
