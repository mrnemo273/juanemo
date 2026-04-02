'use client';

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../../../lib/useDeviceOrientation';
import { applyDeadZone, applyDeadZoneBipolar } from '../../../lib/gyroUtils';
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
import type { ChordTone } from './types';
import styles from './CollisionChanges.module.css';

/* ----------------------------------------------------------
   Constants
   ---------------------------------------------------------- */
const MOBILE_BREAKPOINT = 600;
const BACKGROUND = '#1F2627';
const CHORD_FLASH_DURATION = 500;

// Emitter
const MIN_DENSITY = 3;     // orbs/sec
const MAX_DENSITY = 12;    // orbs/sec
const MAX_PARTICLES = 30;
const SPAWN_Y = -30;

// Physics
const RAIN_GRAVITY = 0.05;
const WIND_FORCE = 0.04;
const AIR_DAMPING = 0.999;
const MAX_FALL_SPEED = 5;
const EXIT_FADE_DURATION = 200; // quick fade as orb exits bottom

// Audio limiter
const MIN_NOTE_GAP = 50;

// Collision
const COLLISION_COOLDOWN = 600;
const COLLISION_LINE_DURATION = 200;

// Per-note colors (same as other sections)
const NOTE_COLORS: Record<string, string> = {
  C3: '#E8927C', C4: '#E8927C', C5: '#E8927C',
  D3: '#7CC4E8', D4: '#7CC4E8', D5: '#7CC4E8', D6: '#7CC4E8',
  E3: '#A8E87C', E4: '#A8E87C', E5: '#A8E87C', E6: '#A8E87C',
  F2: '#E8D77C', F3: '#E8D77C', F4: '#E8D77C',
  G2: '#C47CE8', G3: '#C47CE8', G4: '#C47CE8', G5: '#C47CE8',
  A2: '#E87CA8', A3: '#E87CA8', A4: '#E87CA8', A5: '#E87CA8',
  B2: '#7CE8D4', B3: '#7CE8D4', B4: '#7CE8D4',
};

/* ----------------------------------------------------------
   Rain particle type
   ---------------------------------------------------------- */
interface RainParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  note: string;
  frequency: number;
  color: string;
  fadeStartTime: number | null;
  exitNoted: boolean; // whether exit note has been played
  spawnTime: number;
  chordIndex: number;
}

interface Splash {
  x: number;
  y: number;
  color: string;
  startTime: number;
  startRadius: number;
  endRadius: number;
}

/* ----------------------------------------------------------
   Helpers
   ---------------------------------------------------------- */
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
   Component
   ---------------------------------------------------------- */
let nextId = 10000;

export default function Rain() {
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
  const currentChordIndexRef = useRef(0);

  const progression = useChordProgression();

  // Rain-specific state
  const particlesRef = useRef<RainParticle[]>([]);
  const splashesRef = useRef<Splash[]>([]);
  const spawnAccRef = useRef(0);
  const noteIndexRef = useRef(0);
  const lastNoteTimeRef = useRef(0);
  const cooldownRef = useRef<Map<string, number>>(new Map());
  const collisionLinesRef = useRef<
    { x1: number; y1: number; x2: number; y2: number; time: number }[]
  >([]);

  // Cursor position for density + wind (desktop)
  const cursorRef = useRef({ x: 0, y: 0 });
  const cursorActiveRef = useRef(false);

  // Puddle offscreen canvas
  const puddleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  /* --------------------------------------------------------
     Mobile detection
     -------------------------------------------------------- */
  useEffect(() => {
    setIsMobile(isMobileViewport());
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
      audioStartedRef.current = true;
      setAudioStarted(true);

      // Auto-select first chord so rain starts immediately
      if (selectedChordRef.current === null) {
        selectedChordRef.current = 0;
        currentChordIndexRef.current = 0;
        chordNameRef.current = PROGRESSION[0].name;
        setSelectedChord(0);
        progression.jumpToChord(0);
      }
    } catch {
      audioStartingRef.current = false;
    }
  }, [progression]);

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

  /* --------------------------------------------------------
     Canvas sizing via ResizeObserver
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

      // Recreate puddle canvas at new dimensions
      const puddleCanvas = document.createElement('canvas');
      puddleCanvas.width = rect.width;
      puddleCanvas.height = rect.height;
      puddleCanvasRef.current = puddleCanvas;
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    return () => ro.disconnect();
  }, []);

  /* --------------------------------------------------------
     Spawn orb helper
     -------------------------------------------------------- */
  const spawnOrb = useCallback((x?: number, y?: number) => {
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) return;

    const chord = PROGRESSION[currentChordIndexRef.current];
    const tones = chord.notes;
    const frequencies = chord.frequencies;
    const idx = noteIndexRef.current % tones.length;
    noteIndexRef.current++;

    const mobile = isMobileViewport();
    const radius = mobile
      ? 12 + Math.random() * 14   // 12–26px mobile
      : 15 + Math.random() * 20;  // 15–35px desktop

    const note = tones[idx];
    const freq = frequencies[idx];

    const particle: RainParticle = {
      id: nextId++,
      x: x ?? (20 + Math.random() * (w - 40)),
      y: y ?? SPAWN_Y,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 1.5 + Math.random() * 1.5,
      radius,
      note,
      frequency: freq,
      color: NOTE_COLORS[note] || HARMONIC_COLORS[chord.harmonicFunction] || '#D6C5AB',
      fadeStartTime: null,
      exitNoted: false,
      spawnTime: Date.now(),
      chordIndex: currentChordIndexRef.current,
    };

    particlesRef.current.push(particle);
  }, []);

  /* --------------------------------------------------------
     Audio helpers
     -------------------------------------------------------- */
  const playRainNote = useCallback((freq: number) => {
    if (!controlsRef.current.soundEnabled) return;
    if (!isAudioReady()) return;
    const now = Date.now();
    if (now - lastNoteTimeRef.current < MIN_NOTE_GAP) return;
    lastNoteTimeRef.current = now;
    playNote(freq, 0.5);
  }, []);

  /* --------------------------------------------------------
     Puddle mark
     -------------------------------------------------------- */
  const addPuddleMark = useCallback((x: number, width: number, color: string) => {
    const pCtx = puddleCanvasRef.current?.getContext('2d');
    if (!pCtx) return;
    pCtx.fillStyle = color;
    pCtx.globalAlpha = 0.02;
    pCtx.fillRect(x - width / 2, pCtx.canvas.height - 2, width, 2);
    pCtx.globalAlpha = 1;
  }, []);

  /* --------------------------------------------------------
     Density + wind computation
     -------------------------------------------------------- */
  const computeDensity = useCallback((): number => {
    const mobile = isMobileViewport();
    if (mobile) {
      const g = gyroRef.current;
      if (g.permissionState === 'granted' || g.permissionState === 'not-required') {
        const betaDZ = applyDeadZone(g.betaNorm, 0.05);
        return MIN_DENSITY + Math.max(0, (betaDZ - 0.3) / 0.7) * (MAX_DENSITY - MIN_DENSITY);
      }
      return MIN_DENSITY + (MAX_DENSITY - MIN_DENSITY) * 0.3; // default medium-low
    }
    // Desktop: mouse Y
    if (!cursorActiveRef.current) return MIN_DENSITY + (MAX_DENSITY - MIN_DENSITY) * 0.3;
    const { h } = sizeRef.current;
    if (h === 0) return MIN_DENSITY;
    const t = cursorRef.current.y / h;
    return MIN_DENSITY + t * (MAX_DENSITY - MIN_DENSITY);
  }, []);

  const computeWind = useCallback((): number => {
    const mobile = isMobileViewport();
    if (mobile) {
      const g = gyroRef.current;
      if (g.permissionState === 'granted' || g.permissionState === 'not-required') {
        return applyDeadZoneBipolar(g.gammaNorm, 0.05) * WIND_FORCE;
      }
      return 0;
    }
    // Desktop: mouse X
    if (!cursorActiveRef.current) return 0;
    const { w } = sizeRef.current;
    if (w === 0) return 0;
    return ((cursorRef.current.x / w) - 0.5) * 2 * WIND_FORCE * 0.5;
  }, []);

  /* --------------------------------------------------------
     Chord change handling
     -------------------------------------------------------- */
  useEffect(() => {
    progression.onChordChange((newChord, idx) => {
      chordFlashRef.current = performance.now();
      selectedChordRef.current = idx;
      currentChordIndexRef.current = idx;
      chordNameRef.current = newChord.name;
      setSelectedChord(idx);

      // Reset round-robin for new chord
      noteIndexRef.current = 0;

      // DON'T retune existing particles — the wave effect is the feature
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
     Interaction: mouse + touch
     -------------------------------------------------------- */
  const handleCanvasTap = useCallback((x: number, y: number) => {
    if (!audioStartedRef.current) {
      handleAudioStart();
      return;
    }
    // Burst of 5–7 orbs at tap location
    const burstCount = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < burstCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 2;
      const ox = x + Math.cos(angle) * 15;
      const oy = y + Math.sin(angle) * 15;
      spawnOrb(ox, oy);
      // Give burst orbs slight outward velocity
      const p = particlesRef.current[particlesRef.current.length - 1];
      if (p) {
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed + 1; // Still biased downward
      }
    }
  }, [spawnOrb, handleAudioStart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      cursorRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      cursorActiveRef.current = true;
    };

    const handleMouseLeave = () => {
      cursorActiveRef.current = false;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      handleCanvasTap(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      handleCanvasTap(touch.clientX - rect.left, touch.clientY - rect.top);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleCanvasTap]);

  /* --------------------------------------------------------
     Main RAF loop
     -------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      const dtMs = lastTimeRef.current ? time - lastTimeRef.current : 16.667;
      const dt = dtMs / 16.667;
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

      const now = Date.now();
      const particles = particlesRef.current;

      // ---- EMITTER ----
      // Only spawn after user has selected a chord (audio started)
      if (audioStartedRef.current && selectedChordRef.current !== null) {
        const density = computeDensity();
        const spawnInterval = 1000 / density;
        spawnAccRef.current += dtMs;
        while (spawnAccRef.current >= spawnInterval && particles.length < MAX_PARTICLES) {
          spawnAccRef.current -= spawnInterval;
          spawnOrb();
        }
        if (spawnAccRef.current >= spawnInterval) {
          spawnAccRef.current = spawnInterval; // Cap accumulator when at max particles
        }
      }

      // ---- PHYSICS ----
      const windForce = computeWind();

      for (const p of particles) {
        if (p.fadeStartTime && now - p.fadeStartTime > EXIT_FADE_DURATION) {
          continue; // Dead, will be removed
        }

        // Gravity
        p.vy += RAIN_GRAVITY * dt;
        p.vy = Math.min(p.vy, MAX_FALL_SPEED);

        // Wind
        p.vx += windForce * dt;
        p.vx *= AIR_DAMPING;

        // Move
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Exit through bottom — play note and mark for removal
        if (p.y - p.radius >= h) {
          if (!p.exitNoted) {
            playRainNote(p.frequency);
            p.exitNoted = true;

            // Puddle mark
            addPuddleMark(p.x, p.radius * 2, p.color);

            if ('vibrate' in navigator) navigator.vibrate(10);
          }
          // Mark with a past time so it's removed this frame
          p.fadeStartTime = now - EXIT_FADE_DURATION - 1;
        }

        // Side wrapping
        if (p.x < -p.radius) p.x = w + p.radius;
        if (p.x > w + p.radius) p.x = -p.radius;
      }

      // ---- COLLISIONS (bounce off each other mid-air) ----
      for (let iter = 0; iter < 1; iter++) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const a = particles[i];
            const b = particles[j];
            if (a.fadeStartTime || b.fadeStartTime) continue;

            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distSq = dx * dx + dy * dy;
            const minDist = a.radius + b.radius;

            if (distSq < minDist * minDist && distSq > 0.01) {
              const dist = Math.sqrt(distSq);
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;

              // Full separation — push completely apart
              a.x += nx * overlap * 0.5;
              a.y += ny * overlap * 0.5;
              b.x -= nx * overlap * 0.5;
              b.y -= ny * overlap * 0.5;

              // Only apply velocity change on first iteration
              if (iter === 0) {
                const dvx = a.vx - b.vx;
                const dvy = a.vy - b.vy;
                const dot = dvx * nx + dvy * ny;
                if (dot > 0) {
                  // Elastic bounce + extra energy kick
                  const boost = 1.4; // >1 means energy is ADDED — feels explosive
                  a.vx -= dot * nx * boost;
                  a.vy -= dot * ny * boost;
                  b.vx += dot * nx * boost;
                  b.vy += dot * ny * boost;
                } else {
                  // Overlapping but separating — push apart
                  const push = 0.8;
                  a.vx += nx * push;
                  a.vy += ny * push;
                  b.vx -= nx * push;
                  b.vy -= ny * push;
                }

                // Audio (with cooldown)
                if (isAudioReady() && controlsRef.current.soundEnabled) {
                  const pairKey = a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`;
                  const lastTime = cooldownRef.current.get(pairKey) || 0;
                  if (now - lastTime > COLLISION_COOLDOWN) {
                    cooldownRef.current.set(pairKey, now);
                    const vel = Math.sqrt(dvx * dvx + dvy * dvy) * 0.3;
                    playDyad(a.frequency, b.frequency, Math.max(Math.min(vel, 0.8), 0.15));
                  }
                }

                collisionLinesRef.current.push({
                  x1: a.x, y1: a.y,
                  x2: b.x, y2: b.y,
                  time,
                });
              }
            }
          }
        }
      }

      // Clamp top only (orbs exit through bottom freely)
      for (const p of particles) {
        if (p.y - p.radius < 0) p.y = p.radius;
      }

      // Remove dead particles
      particlesRef.current = particlesRef.current.filter(p =>
        !(p.fadeStartTime && now - p.fadeStartTime > EXIT_FADE_DURATION)
      );

      // Clean up stale cooldowns
      if (cooldownRef.current.size > 200) {
        for (const [key, t] of cooldownRef.current) {
          if (now - t > COLLISION_COOLDOWN * 2) cooldownRef.current.delete(key);
        }
      }

      // ---- RENDER ----
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, w, h);

      // Puddle layer
      if (puddleCanvasRef.current) {
        ctx.drawImage(puddleCanvasRef.current, 0, 0);
      }

      // Splash effects
      splashesRef.current = splashesRef.current.filter(s => now - s.startTime < 200);
      for (const splash of splashesRef.current) {
        const age = now - splash.startTime;
        const t = age / 200;
        if (t >= 1) continue;
        const radius = splash.startRadius + (splash.endRadius - splash.startRadius) * t;
        const alpha = 0.15 * (1 - t);
        ctx.beginPath();
        ctx.arc(splash.x, splash.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = splash.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Collision lines
      collisionLinesRef.current = collisionLinesRef.current.filter(
        l => time - l.time < COLLISION_LINE_DURATION,
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

      // Draw particles
      for (const p of particlesRef.current) {
        let alpha = 1;
        if (p.fadeStartTime) {
          const fadeT = (now - p.fadeStartTime) / EXIT_FADE_DURATION;
          alpha = 1 - Math.min(fadeT, 1);
        }

        ctx.save();
        ctx.globalAlpha = alpha;

        // Vertical stretch for fast drops
        const stretch = p.vy > 3 ? 1 + (p.vy - 3) / 10 * 0.2 : 1;
        if (stretch > 1) {
          ctx.translate(p.x, p.y);
          ctx.scale(1, Math.min(stretch, 1.2));
          ctx.translate(-p.x, -p.y);
        }

        // Fill
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.25 * alpha;
        ctx.fill();

        // Stroke
        ctx.strokeStyle = p.color;
        ctx.globalAlpha = 0.6 * alpha;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Label (only if radius >= 18px)
        if (p.radius >= 18) {
          ctx.globalAlpha = 0.6 * alpha;
          ctx.fillStyle = '#E8DED1';
          ctx.font = `${Math.round(p.radius * 0.45)}px Georgia, "Times New Roman", serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const displayNote = p.note.replace(/[0-9]/g, '').replace('#', '♯').replace(/^([A-G])b/, '$1♭');
          ctx.fillText(displayNote, p.x, p.y);
        }

        ctx.restore();
      }

      // Centered chord name — large Georgia italic
      if (selectedChordRef.current !== null) {
        const flashElapsed = time - chordFlashRef.current;
        const flashAlpha = flashElapsed < CHORD_FLASH_DURATION
          ? 0.06 + 0.1 * (1 - flashElapsed / CHORD_FLASH_DURATION)
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
  }, [isMobile, computeDensity, computeWind, spawnOrb, playRainNote, addPuddleMark]);

  /* --------------------------------------------------------
     Cleanup audio on unmount
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
    currentChordIndexRef.current = idx;
    noteIndexRef.current = 0;
    setSelectedChord(idx);
    setDropdownOpen(false);

    chordFlashRef.current = performance.now();
    chordNameRef.current = PROGRESSION[idx].name;

    (async () => {
      await handleAudioStart();
      progression.jumpToChord(idx);
      const chord = PROGRESSION[idx];
      const freqs = [...chord.frequencies];
      if (chord.ninth) freqs.push(chord.ninth.frequency);
      if (controlsRef.current.soundEnabled) {
        playChordStrum(freqs);
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
      <canvas ref={canvasRef} className={styles.canvas} />
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
