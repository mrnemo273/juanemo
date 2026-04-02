'use client';

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../../../lib/useDeviceOrientation';
import { applyDeadZoneBipolar } from '../../../lib/gyroUtils';
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
  muteMetronome,
  unmuteMetronome,
  playDyad,
  playDyadDuration,
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
const BURST_COLLISION_LINE_DURATION = 400;
const BACKGROUND = '#1F2627';
const COLLISION_COOLDOWN = 600;
const COLLISION_PUSH = 1.5;

// Free-float physics (Section A style)
const INTER_PARTICLE_G = 0.02;
const CURSOR_G = 0.15;
const ATTRACTION_RADIUS = 400;
const DAMPING = 0.9998;
const MAX_SPEED = 2.5;
const BURST_MAX_SPEED = 8; // Higher cap during burst for explosive scatter
const INITIAL_VELOCITY_RANGE = 1.2;
const TILT_FORCE = 0.01;

// Burst trail constants
const BURST_TRAIL_DURATION = 600;
const BURST_TRAIL_FADE = 200;
const BURST_TRAIL_POSITIONS = 6;

// Energy circle (replaces timer)
const ENERGY_MAX_TIME = 5000; // ms to fill the circle completely
const ENERGY_CIRCLE_RADIUS = 40;

// Shockwave on release
const SHOCKWAVE_DURATION = 500; // ms

// Note duration variety for collisions
const NOTE_DURATIONS = ['4n', '2n', '1n'] as const;

// Orb sizes
let ORB_RADIUS_MIN = 30;
let ORB_RADIUS_MAX = 65;

function updateLocalOrbSizes(viewportWidth: number) {
  setOrbSizes(viewportWidth);
  const clampedW = Math.max(320, Math.min(3840, viewportWidth));
  const t = (clampedW - 320) / (3840 - 320);
  ORB_RADIUS_MIN = Math.round(34 + t * (100 - 34));
  ORB_RADIUS_MAX = Math.round(52 + t * (250 - 52));
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
   Particle creation
   ---------------------------------------------------------- */
let nextId = 5000;
function makeId(): string { return `fr${nextId++}`; }

const ORB_CHORD_TONES: ChordTone[] = ['root', '3rd', '5th', '7th', '5th', '9th', 'root'];

function createParticles(
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
  const padding = 100;

  return freqs.map((freq, i) => ({
    id: makeId(),
    x: padding + Math.random() * (canvasW - padding * 2),
    y: padding + Math.random() * (canvasH - padding * 2),
    vx: (Math.random() - 0.5) * INITIAL_VELOCITY_RANGE * 2,
    vy: (Math.random() - 0.5) * INITIAL_VELOCITY_RANGE * 2,
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
  }));
}

/* ----------------------------------------------------------
   Component
   ---------------------------------------------------------- */
export default function FreezeRelease() {
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
  const [showGyroToast, setShowGyroToast] = useState(false);
  const gyroRequestedRef = useRef(false);

  const [selectedChord, setSelectedChord] = useState<number | null>(null);
  const selectedChordRef = useRef<number | null>(null);
  const chordFlashRef = useRef(0);
  const chordNameRef = useRef(PROGRESSION[0].name);

  const progression = useChordProgression();

  // Particle state
  const particlesRef = useRef<Particle[]>([]);
  const initializedRef = useRef(false);

  // Lerp state
  const lerpStartTimeRef = useRef(0);
  const isLerpingRef = useRef(false);
  const lerpStartMap = useRef<Map<string, number>>(new Map());
  const lerpTargetMap = useRef<Map<string, number>>(new Map());

  // Collision state
  const cooldownRef = useRef<Map<string, number>>(new Map());
  const collisionLinesRef = useRef<
    { x1: number; y1: number; x2: number; y2: number; time: number }[]
  >([]);

  // Freeze state
  const frozenRef = useRef(false);
  const freezeStartRef = useRef(0);
  const storedTiltRef = useRef({ x: 0, y: 0 });

  // Burst trail state
  const burstTrailsRef = useRef<Map<string, { points: { x: number; y: number }[]; startTime: number }>>(new Map());

  // Canvas flash
  const canvasFlashRef = useRef(0);

  // Shockwave on release
  const shockwaveRef = useRef(0);

  // Burst collision line boost
  const burstTimeRef = useRef(0);

  // Burst speed decay — tracks when to restore normal speed cap
  const burstActiveRef = useRef(false);

  // Shockwave strum — tracks which orbs the wave has already hit
  const shockwaveHitRef = useRef<Set<string>>(new Set());
  const lastEnergyRatioRef = useRef(0);

  // Gravity source (cursor/touch)
  const gravitySourceRef = useRef<{ x: number; y: number } | null>(null);

  // Reduced motion
  const prefersReducedRef = useRef(false);

  /* --------------------------------------------------------
     Mobile detection + orb sizing
     -------------------------------------------------------- */
  useEffect(() => {
    setIsMobile(isMobileViewport());
    updateLocalOrbSizes(window.innerWidth);
    prefersReducedRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

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
    if (audioStartedRef.current || audioStartingRef.current) return;
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
  }, [progression]);

  // Auto-init audio when sound is enabled and AudioContext is running
  useEffect(() => {
    if (audioStartedRef.current) return;
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
  }, [controls.soundEnabled, handleAudioStart]);

  /* --------------------------------------------------------
     iOS gyro permission toast
     -------------------------------------------------------- */
  useEffect(() => {
    if (isMobile && gyro.permissionState === 'prompt' && !gyroRequestedRef.current) {
      setShowGyroToast(true);
    }
  }, [isMobile, gyro.permissionState]);

  const handleGyroPermission = useCallback(async () => {
    if (gyroRequestedRef.current) return;
    gyroRequestedRef.current = true;
    try { await gyro.requestPermission(); } catch { /* ignore */ }
    setShowGyroToast(false);
    handleAudioStart();
  }, [gyro, handleAudioStart]);

  // Mute/unmute metronome when sound toggle changes
  useEffect(() => {
    if (!audioStartedRef.current) return;
    if (controls.soundEnabled) {
      // Only unmute if not currently frozen
      if (!frozenRef.current) {
        unmuteMetronome();
      }
    } else {
      muteMetronome();
    }
  }, [controls.soundEnabled]);

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
  useEffect(() => {
    if (initializedRef.current) return;
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) {
      const t = setTimeout(() => {
        const { w: w2, h: h2 } = sizeRef.current;
        if (w2 > 0 && h2 > 0 && !initializedRef.current) {
          initializedRef.current = true;
          particlesRef.current = createParticles(PROGRESSION[0], w2, h2);
        }
      }, 100);
      return () => clearTimeout(t);
    }
    initializedRef.current = true;
    particlesRef.current = createParticles(PROGRESSION[0], w, h);
  }, []);

  /* --------------------------------------------------------
     Freeze (press) and Release (lift) — separate functions
     -------------------------------------------------------- */
  const startFreeze = useCallback(() => {
    if (frozenRef.current) return; // Already frozen
    frozenRef.current = true;
    freezeStartRef.current = Date.now();
    storedTiltRef.current = { x: 0, y: 0 };
    muteMetronome();
  }, []);

  const doRelease = useCallback(() => {
    if (!frozenRef.current) return; // Not frozen
    const frozenDuration = Date.now() - freezeStartRef.current;
    const energyRatio = Math.min(frozenDuration / ENERGY_MAX_TIME, 1.0);
    const burstFactor = 2.0 + energyRatio * 2.0;
    const particles = particlesRef.current;

    for (const p of particles) {
      p.vx *= burstFactor;
      p.vy *= burstFactor;
      p.vx += storedTiltRef.current.x * burstFactor * 0.5;
      p.vy += storedTiltRef.current.y * burstFactor * 0.5;
      const scatter = 0.3 + energyRatio * 0.7;
      p.vx += (Math.random() - 0.5) * burstFactor * scatter;
      p.vy += (Math.random() - 0.5) * burstFactor * scatter;
      burstTrailsRef.current.set(p.id, {
        points: [{ x: p.x, y: p.y }],
        startTime: Date.now(),
      });
    }

    canvasFlashRef.current = Date.now();
    burstTimeRef.current = Date.now();
    shockwaveRef.current = Date.now();
    shockwaveHitRef.current.clear();
    lastEnergyRatioRef.current = energyRatio;
    burstActiveRef.current = true;

    if ('vibrate' in navigator) {
      navigator.vibrate([30, 20, 50, 20, 80]);
    }
    if (controlsRef.current.soundEnabled) {
      unmuteMetronome();
    }
    frozenRef.current = false;
  }, []);

  /* --------------------------------------------------------
     Input handlers: press to freeze, lift to release
     -------------------------------------------------------- */
  const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!audioStartedRef.current) {
      handleAudioStart();
      return;
    }
    startFreeze();
  }, [handleAudioStart, startFreeze]);

  const handlePressEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!audioStartedRef.current) return;
    doRelease();
  }, [doRelease]);

  // Space bar: hold to freeze, release to burst
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (audioStartedRef.current) {
          startFreeze();
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (audioStartedRef.current) {
          doRelease();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startFreeze, doRelease]);

  /* --------------------------------------------------------
     Mouse/touch gravity (unfrozen only)
     -------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (frozenRef.current) return;
      const rect = canvas.getBoundingClientRect();
      gravitySourceRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      gravitySourceRef.current = null;
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Touch start is handled by React handler for freeze toggle
      // Only set gravity when gyro not available
      const g = gyroRef.current;
      if (g.permissionState === 'denied' || !g.isAvailable) {
        if (frozenRef.current) return;
        const touch = e.touches[0];
        if (!touch) return;
        const rect = canvas.getBoundingClientRect();
        gravitySourceRef.current = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const g = gyroRef.current;
      if (g.permissionState === 'denied' || !g.isAvailable) {
        if (frozenRef.current) return;
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
     Chord progression: handle changes
     -------------------------------------------------------- */
  useEffect(() => {
    progression.onChordChange((newChord, idx, _assignment) => {
      chordFlashRef.current = performance.now();
      selectedChordRef.current = idx;
      chordNameRef.current = newChord.name;
      setSelectedChord(idx);

      const particles = particlesRef.current;
      const targetFreqs = [
        newChord.frequencies[0],
        newChord.frequencies[1],
        newChord.frequencies[2],
        newChord.frequencies[3],
        newChord.frequencies[2] * 2,
        newChord.ninth!.frequency,
        newChord.frequencies[0] * 2,
      ];
      const targetNotes = [
        newChord.notes[0], newChord.notes[1], newChord.notes[2], newChord.notes[3],
        newChord.notes[2], newChord.ninth!.note, newChord.notes[0],
      ];

      // Greedy closest-frequency voice-leading
      const currentFreqs = particles.map((p) => p.frequency);
      const used = new Set<number>();
      const indices = currentFreqs.map((_, i) => i);
      indices.sort((a, b) => {
        const distA = Math.min(...targetFreqs.map((t) => Math.abs(currentFreqs[a] - t)));
        const distB = Math.min(...targetFreqs.map((t) => Math.abs(currentFreqs[b] - t)));
        return distA - distB;
      });

      const assignment = new Array<number>(particles.length);
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

      // Apply retune
      lerpStartMap.current.clear();
      lerpTargetMap.current.clear();
      const now = performance.now();

      for (let i = 0; i < particles.length; i++) {
        const tIdx = assignment[i];
        const p = particles[i];
        lerpStartMap.current.set(p.id, p.frequency);
        lerpTargetMap.current.set(p.id, targetFreqs[tIdx]);
        p.targetFrequency = targetFreqs[tIdx];
        p.note = targetNotes[tIdx];
        p.chordTone = ORB_CHORD_TONES[tIdx];
        p.harmonicFunction = newChord.harmonicFunction;
        p.color = HARMONIC_COLORS[newChord.harmonicFunction];
        p.spawnTime = now;
      }

      lerpStartTimeRef.current = performance.now();
      isLerpingRef.current = true;
    });
  }, [progression]);

  // Decay & reverb controls
  useEffect(() => { setDecay(controls.decay); }, [controls.decay]);
  useEffect(() => { setReverbMix(controls.reverbMix); }, [controls.reverbMix]);

  // Tempo & time signature
  useEffect(() => {
    if (!audioStartedRef.current) return;
    setMetronomeTempo(controls.tempo);
    progression.setBpmTiming(controls.tempo, controls.timeSignature);
  }, [controls.tempo, controls.timeSignature, progression]);

  useEffect(() => {
    if (!audioStartedRef.current) return;
    setMetronomeTimeSignature(controls.timeSignature);
    progression.setBpmTiming(controls.tempo, controls.timeSignature);
  }, [controls.timeSignature, controls.tempo, progression]);

  /* --------------------------------------------------------
     Main RAF loop
     -------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      const dt = lastTimeRef.current
        ? (time - lastTimeRef.current) / 16.667
        : 1;
      lastTimeRef.current = time;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Pause when settings panel is open
      if (controlsRef.current.paused) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const particles = particlesRef.current;
      if (particles.length === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const cappedDt = Math.min(dt, 3);
      const now = performance.now();
      const soundOn = controlsRef.current.soundEnabled;

      // Update gyro
      const g = gyroRef.current;
      let gyroGx = 0;
      let gyroGy = 0;
      if (
        isMobile &&
        (g.permissionState === 'granted' || g.permissionState === 'not-required')
      ) {
        gyroGx = applyDeadZoneBipolar(g.gammaNorm, 0.05);
        gyroGy = applyDeadZoneBipolar(g.betaNorm, 0.05);
      }

      // Frequency lerp
      if (isLerpingRef.current) {
        const elapsed = time - lerpStartTimeRef.current;
        const progress = Math.min(1, Math.max(0, elapsed / LERP_DURATION));
        const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        for (const p of particles) {
          const start = lerpStartMap.current.get(p.id);
          const target = lerpTargetMap.current.get(p.id);
          if (start !== undefined && target !== undefined) {
            p.frequency = start + (target - start) * eased;
          }
        }
        if (progress >= 1) isLerpingRef.current = false;
      }

      // Update particle freqs for voice-leading
      const freqs = particles.map((p) => p.frequency);
      (progression.onChordChange as any).__updateFreqs?.(freqs);

      /* --- FROZEN STATE --- */
      if (frozenRef.current) {
        // Store tilt vector for burst aiming
        if (isMobile && (g.permissionState === 'granted' || g.permissionState === 'not-required')) {
          storedTiltRef.current = {
            x: applyDeadZoneBipolar(g.gammaNorm, 0.05),
            y: applyDeadZoneBipolar(g.betaNorm, 0.05),
          };
        }

        // --- RENDER FROZEN ---
        const dpr = window.devicePixelRatio || 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);

        // Background
        ctx.fillStyle = BACKGROUND;
        ctx.fillRect(0, 0, w, h);

        // Dim overlay — dramatic darkening so the frozen state is unmistakable
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(0, 0, w, h);

        const freezeElapsed = Date.now() - freezeStartRef.current;

        // Auto-release when energy circle fills completely
        if (freezeElapsed >= ENERGY_MAX_TIME) {
          doRelease();
          rafRef.current = requestAnimationFrame(loop);
          return;
        }

        // Draw frozen orbs
        for (const p of particles) {
          const spawnAge = time - p.spawnTime;
          let spawnScale = 1;
          if (spawnAge < 250) {
            const t = spawnAge / 250;
            spawnScale = 1 - 0.7 * Math.exp(-6 * t) * Math.cos(t * Math.PI * 2.5);
          }

          const shimmer = 1 + 0.05 * Math.sin(freezeElapsed * 0.006 * Math.PI * 2 * 3);
          const noteColor = NOTE_COLORS[p.note] ?? p.color;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.scale(spawnScale, spawnScale);

          // Orb fill with shimmer — brighter than unfrozen so orbs pop against dim background
          ctx.beginPath();
          ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = colorWithAlpha(noteColor, 0.35 * shimmer);
          ctx.fill();

          // Brighter stroke (0.9)
          ctx.strokeStyle = colorWithAlpha(noteColor, 0.9);
          ctx.lineWidth = 2;
          ctx.stroke();

          // Note label
          const fontSize = Math.max(10, Math.round(p.radius * 0.35));
          ctx.font = `${fontSize}px "DM Sans", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colorWithAlpha(noteColor, 0.7);
          const displayNote = p.note.replace(/[0-9]/g, '').replace('#', '\u266F').replace(/(?<=^[A-G])b/, '\u266D');
          ctx.fillText(displayNote, 0, 0);

          ctx.restore();

          // Frost lines (4 radial lines, slowly rotating)
          ctx.strokeStyle = 'rgba(214, 197, 171, 0.05)';
          ctx.lineWidth = 0.5;
          for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + freezeElapsed * 0.0002;
            const r = p.radius * spawnScale;
            ctx.beginPath();
            ctx.moveTo(
              p.x + Math.cos(angle) * r,
              p.y + Math.sin(angle) * r,
            );
            ctx.lineTo(
              p.x + Math.cos(angle) * (r + 20),
              p.y + Math.sin(angle) * (r + 20),
            );
            ctx.stroke();
          }
        }

        // Chord name label (same as unfrozen)
        if (selectedChordRef.current !== null) {
          const flashElapsed = time - chordFlashRef.current;
          const flashAlpha = flashElapsed < 500
            ? 0.06 + 0.1 * (1 - flashElapsed / 500)
            : 0.06;
          const chordFontSize = isMobile ? 48 : 72;
          ctx.font = `italic ${chordFontSize}px Georgia, "Times New Roman", serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = `rgba(214, 197, 171, ${flashAlpha})`;
          ctx.fillText(chordNameRef.current, w / 2, h / 2);
        }

        // Energy circle — fills clockwise as freeze builds
        const energyRatio = Math.min(freezeElapsed / ENERGY_MAX_TIME, 1.0);
        const fadeIn = Math.min(freezeElapsed / 300, 1);
        const cx = w / 2;
        const cy = h / 2;

        ctx.globalAlpha = fadeIn;

        // Background ring (track)
        ctx.beginPath();
        ctx.arc(cx, cy, ENERGY_CIRCLE_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(214, 197, 171, 0.08)';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Fill arc — starts at top (-π/2), sweeps clockwise
        if (energyRatio > 0) {
          const startAngle = -Math.PI / 2;
          const endAngle = startAngle + energyRatio * Math.PI * 2;

          // Glow gets more intense as energy builds
          const glowAlpha = 0.15 + energyRatio * 0.35;
          ctx.beginPath();
          ctx.arc(cx, cy, ENERGY_CIRCLE_RADIUS, startAngle, endAngle);
          ctx.strokeStyle = `rgba(242, 92, 84, ${glowAlpha})`; // bittersweet
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.stroke();
          ctx.lineCap = 'butt';

        }

        ctx.globalAlpha = 1;

        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      /* --- UNFROZEN STATE: Physics + Render --- */

      // Physics step
      const collisions: CollisionEvent[] = [];

      for (const p of particles) {
        if (p.fadeOut) continue;

        // Brightness decay
        if (p.brightness > 0) {
          p.brightness = Math.max(0, p.brightness - 0.02 * cappedDt);
        }

        // Inter-particle attraction (Section A free-float)
        for (const other of particles) {
          if (other.id === p.id || other.fadeOut) continue;
          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          if (dist < 1) continue;
          const force = (INTER_PARTICLE_G * p.mass * other.mass) / distSq;
          const fx = (force * dx) / dist;
          const fy = (force * dy) / dist;
          p.vx += fx * cappedDt;
          p.vy += fy * cappedDt;
        }

        // Cursor/touch gravity
        const gs = gravitySourceRef.current;
        if (gs) {
          const dx = gs.x - p.x;
          const dy = gs.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < ATTRACTION_RADIUS && dist > 1) {
            const force = (CURSOR_G * p.mass) / dist;
            p.vx += (force * dx) / dist * cappedDt;
            p.vy += (force * dy) / dist * cappedDt;
          }
        }

        // Gyro gravity
        if (gyroGx !== 0 || gyroGy !== 0) {
          p.vx += gyroGx * TILT_FORCE * cappedDt;
          p.vy += gyroGy * TILT_FORCE * cappedDt;
        }

        // Damping — stronger during burst for ease-out deceleration
        const burstAge = Date.now() - burstTimeRef.current;
        let dampingFactor = DAMPING;
        if (burstActiveRef.current && burstAge < BURST_TRAIL_DURATION) {
          // Ease-out: aggressive damping ramps up over the burst duration
          // Starts at 0.995 (fast), ends at 0.98 (heavy braking)
          const burstProgress = burstAge / BURST_TRAIL_DURATION;
          dampingFactor = 0.995 - burstProgress * 0.015;
        } else if (burstActiveRef.current) {
          burstActiveRef.current = false;
        }
        p.vx *= Math.pow(dampingFactor, cappedDt);
        p.vy *= Math.pow(dampingFactor, cappedDt);

        // Speed floor
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < 0.3) {
          const angle = Math.atan2(p.vy, p.vx) || (Math.random() * Math.PI * 2);
          p.vx = Math.cos(angle) * 0.4;
          p.vy = Math.sin(angle) * 0.4;
        }
        // Speed cap — higher during burst for explosive scatter
        const currentMaxSpeed = burstActiveRef.current ? BURST_MAX_SPEED : MAX_SPEED;
        if (speed > currentMaxSpeed) {
          const scale = currentMaxSpeed / speed;
          p.vx *= scale;
          p.vy *= scale;
        }

        // Position update
        p.x += p.vx * cappedDt;
        p.y += p.vy * cappedDt;

        // Edge bounce (restitution 0.5, same as Magnets)
        if (p.x < p.radius) { p.x = p.radius; p.vx *= -0.5; }
        if (p.x > w - p.radius) { p.x = w - p.radius; p.vx *= -0.5; }
        if (p.y < p.radius) { p.y = p.radius; p.vy *= -0.5; }
        if (p.y > h - p.radius) { p.y = h - p.radius; p.vy *= -0.5; }
      }

      // Collision detection (pass-through)
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
            const overlapRatio = 1 - dist / minDist;
            a.brightness = Math.max(a.brightness, 0.3 + overlapRatio * 0.7);
            b.brightness = Math.max(b.brightness, 0.3 + overlapRatio * 0.7);

            const pairKey = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
            const lastCollision = cooldownRef.current.get(pairKey) ?? 0;
            if (now - lastCollision > COLLISION_COOLDOWN) {
              cooldownRef.current.set(pairKey, now);
              const velocity = Math.min(1, Math.max(0.15, overlapRatio * 2));

              const col: CollisionEvent = {
                idA: a.id,
                idB: b.id,
                velocity,
                freqA: a.frequency,
                freqB: b.frequency,
                midX: (a.x + b.x) / 2,
                midY: (a.y + b.y) / 2,
                time: now,
              };
              collisions.push(col);

              // Play audio — varied note durations for musical interest
              if (isAudioReady() && soundOn) {
                const duration = NOTE_DURATIONS[Math.floor(Math.random() * NOTE_DURATIONS.length)];
                playDyadDuration(col.freqA, col.freqB, col.velocity, duration);
              }

              // Collision line
              collisionLinesRef.current.push({
                x1: a.x,
                y1: a.y,
                x2: b.x,
                y2: b.y,
                time,
              });

              // Collision energy push — push nearby orbs outward
              for (const p of particles) {
                if (p.id === a.id || p.id === b.id) continue;
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
      }

      // Update burst trails
      const nowMs = Date.now();
      for (const p of particles) {
        const trail = burstTrailsRef.current.get(p.id);
        if (!trail) continue;
        const trailAge = nowMs - trail.startTime;
        if (trailAge < BURST_TRAIL_DURATION) {
          trail.points.push({ x: p.x, y: p.y });
          if (trail.points.length > BURST_TRAIL_POSITIONS) trail.points.shift();
        } else if (trailAge >= BURST_TRAIL_DURATION + BURST_TRAIL_FADE) {
          burstTrailsRef.current.delete(p.id);
        }
      }

      // ---- RENDER ----
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, w, h);

      // Canvas flash on release — intensity scales with energy
      if (canvasFlashRef.current > 0) {
        const flashAge = Date.now() - canvasFlashRef.current;
        if (flashAge < 300) {
          const flashAlpha = 0.15 * (1 - flashAge / 300);
          ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha})`;
          ctx.fillRect(0, 0, w, h);
        } else {
          canvasFlashRef.current = 0;
        }
      }

      // Shockwave ring on release — expands outward, plays each orb as it passes
      if (shockwaveRef.current > 0) {
        const swAge = Date.now() - shockwaveRef.current;
        if (swAge < SHOCKWAVE_DURATION) {
          const swProgress = swAge / SHOCKWAVE_DURATION;
          // Ease-out: fast start, slow end
          const easedProgress = 1 - Math.pow(1 - swProgress, 3);
          const maxRadius = Math.max(w, h) * 0.8;
          const swRadius = easedProgress * maxRadius;
          const swAlpha = 0.25 * (1 - swProgress);
          ctx.beginPath();
          ctx.arc(w / 2, h / 2, swRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(242, 92, 84, ${swAlpha})`;
          ctx.lineWidth = 2 + (1 - swProgress) * 3;
          ctx.stroke();

          // Strum: play each orb's note as the wave reaches it
          if (isAudioReady() && soundOn) {
            for (const p of particles) {
              if (shockwaveHitRef.current.has(p.id)) continue;
              const dx = p.x - w / 2;
              const dy = p.y - h / 2;
              const orbDist = Math.sqrt(dx * dx + dy * dy);
              if (swRadius >= orbDist) {
                shockwaveHitRef.current.add(p.id);
                // Play with duration based on distance — closer = shorter, farther = longer
                const durIdx = Math.min(2, Math.floor((orbDist / maxRadius) * 3));
                const duration = NOTE_DURATIONS[durIdx];
                playDyadDuration(p.frequency, p.frequency * 1.001, 0.5, duration);
                // Flash the orb
                p.brightness = 1;
                // Velocity boost — push outward from center like the shockwave hit it
                const pushStrength = 2.0 + lastEnergyRatioRef.current * 3.0;
                const nx = orbDist > 1 ? dx / orbDist : (Math.random() - 0.5);
                const ny = orbDist > 1 ? dy / orbDist : (Math.random() - 0.5);
                p.vx += nx * pushStrength;
                p.vy += ny * pushStrength;
              }
            }
          }
        } else {
          shockwaveRef.current = 0;
        }
      }

      // Collision lines
      const isBurstPeriod = Date.now() - burstTimeRef.current < BURST_COLLISION_LINE_DURATION;
      const lineAlphaBase = isBurstPeriod ? 0.4 : 0.3;
      const lineDuration = isBurstPeriod ? BURST_COLLISION_LINE_DURATION : COLLISION_LINE_DURATION;
      collisionLinesRef.current = collisionLinesRef.current.filter(
        (l) => time - l.time < lineDuration,
      );
      for (const line of collisionLinesRef.current) {
        const lineAlpha = lineAlphaBase * (1 - (time - line.time) / lineDuration);
        ctx.strokeStyle = `rgba(235, 226, 214, ${lineAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      }

      // Burst trails
      for (const [, trail] of burstTrailsRef.current) {
        const trailAge = nowMs - trail.startTime;
        const fadeAlpha = trailAge > BURST_TRAIL_DURATION
          ? 1 - (trailAge - BURST_TRAIL_DURATION) / BURST_TRAIL_FADE
          : 1;
        if (fadeAlpha <= 0) continue;
        ctx.strokeStyle = `rgba(214, 197, 171, ${0.15 * fadeAlpha})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 8]);
        ctx.beginPath();
        trail.points.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw particles
      for (const p of particles) {
        const alpha = p.fadeOut ? 0.3 : 1;

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

      // Chord name label
      if (selectedChordRef.current !== null) {
        const flashElapsed = time - chordFlashRef.current;
        const flashAlpha = flashElapsed < 500
          ? 0.06 + 0.1 * (1 - flashElapsed / 500)
          : 0.06;
        const chordFontSize = isMobile ? 48 : 72;
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
  }, [progression, isMobile]);

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
    try { Tone.start(); } catch { /* will retry below */ }
    if (gyro.permissionState === 'prompt' && !gyroRequestedRef.current) {
      gyroRequestedRef.current = true;
      gyro.requestPermission().catch(() => {});
      setShowGyroToast(false);
    }

    selectedChordRef.current = idx;
    setSelectedChord(idx);
    setDropdownOpen(false);

    (async () => {
      await handleAudioStart();
      progression.jumpToChord(idx);

      // Only play strum if NOT frozen and sound enabled
      if (!frozenRef.current && controlsRef.current.soundEnabled) {
        const chord = PROGRESSION[idx];
        const chordFreqs = [...chord.frequencies];
        if (chord.ninth) chordFreqs.push(chord.ninth.frequency);
        playChordStrum(chordFreqs);
      }
    })();
  }, [progression, handleAudioStart, gyro]);

  // Close dropdown on outside click
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
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
      />
      {showGyroToast && (
        <button className={styles.gyroToast} onClick={handleGyroPermission}>
          Tap to enable motion control
        </button>
      )}
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
