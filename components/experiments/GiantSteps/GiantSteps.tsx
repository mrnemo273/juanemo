'use client';

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../../../lib/useDeviceOrientation';
import { applyDeadZone } from '../../../lib/gyroUtils';
import { useGiantStepsProgression } from './useGiantStepsProgression';
import { GIANT_STEPS_PROGRESSION, KEY_CENTER_COLORS, CIRCLE_OF_FIFTHS, KEY_CENTER_ANGLES } from './giantStepsChordData';
import type { KeyCenter, Shockwave } from './types';
import * as Tone from 'tone';
import { initAudio, isAudioReady, dispose, startMetronome, setMetronomeTempo, setMetronomeVolume, stopMetronome } from '../CollisionChanges/audioEngine';
import { initSaxEngine, playSaxNote, isSaxReady, setSaxDecay, setSaxReverb, disposeSax } from './saxEngine';
import styles from './GiantSteps.module.css';

const MOBILE_BREAKPOINT = 600;
const BACKGROUND = '#1F2627';
const CIRCLE_RADIUS_RATIO = 0.35;
const CENTER_DOT_RADIUS = 6;
const LABEL_OFFSET = 24;

// Map note pitch class → angle on circle of fifths
const NOTE_TO_ANGLE: Record<string, number> = {
  'C': 0, 'G': 30, 'D': 60, 'A': 90, 'E': 120, 'B': 150,
  'F#': 180, 'Gb': 180, 'F♯': 180,
  'C#': 210, 'Db': 210, 'D♭': 210,
  'G#': 240, 'Ab': 240, 'A♭': 240,
  'D#': 270, 'Eb': 270, 'E♭': 270,
  'A#': 300, 'Bb': 300, 'B♭': 300,
  'F': 330,
};

function getPitchClass(note: string): string {
  return note.replace(/[0-9]/g, '');
}

// Normalize display names (E♭ → Eb, F♯ → F#, etc.) for set comparison
function normalizePitch(note: string): string {
  return note.replace('♭', 'b').replace('♯', '#');
}

function getNoteAngle(note: string): number {
  return NOTE_TO_ANGLE[getPitchClass(note)] ?? 0;
}

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

function getCirclePoint(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + Math.cos(rad) * radius,
    y: cy + Math.sin(rad) * radius,
  };
}

function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function GiantSteps() {
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
  const gyroRequestedRef = useRef(false);

  const progression = useGiantStepsProgression();

  const activeKeyCenterRef = useRef<KeyCenter>('B');

  // Visual state
  const triangleOpacityRef = useRef(0.15);
  const keyCenterScaleRef = useRef<Record<KeyCenter, number>>({ B: 1, G: 1, Eb: 1 });

  // Dynamic chord triangle — root(0), 3rd(1), 7th(3) — different shape per chord type
  const chordAnglesRef = useRef<number[]>([
    getNoteAngle(GIANT_STEPS_PROGRESSION[0].notes[0]),
    getNoteAngle(GIANT_STEPS_PROGRESSION[0].notes[1]),
    getNoteAngle(GIANT_STEPS_PROGRESSION[0].notes[3]),
  ]);
  const chordCurrentRef = useRef<number[]>([...chordAnglesRef.current]);
  const chordColorRef = useRef(KEY_CENTER_COLORS[GIANT_STEPS_PROGRESSION[0].keyCenter]);
  // Track which pitch classes are active in the current chord triangle (root, 3rd, 7th)
  const activeNotesRef = useRef<Set<string>>(new Set([
    getPitchClass(GIANT_STEPS_PROGRESSION[0].notes[0]),
    getPitchClass(GIANT_STEPS_PROGRESSION[0].notes[1]),
    getPitchClass(GIANT_STEPS_PROGRESSION[0].notes[3]),
  ]));

  // Vertex pulse — scale animation when a note plays at that vertex
  const vertexScaleRef = useRef<number[]>([1, 1, 1]);
  // Staggered note playback timers
  const noteTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const shockwavesRef = useRef<Shockwave[]>([]);
  const chordFlashRef = useRef(0);
  const chordNameRef = useRef(GIANT_STEPS_PROGRESSION[0].name);
  const bpmRef = useRef(160);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);

  // BPM slider
  const [displayBpm, setDisplayBpm] = useState(160);

  /* --------------------------------------------------------
     Mobile detection
     -------------------------------------------------------- */
  useEffect(() => {
    setIsMobile(isMobileViewport());
  }, []);

  /* --------------------------------------------------------
     Audio init on first interaction
     -------------------------------------------------------- */
  const audioStartingRef = useRef(false);
  const handleAudioStart = useCallback(async () => {
    if (audioStarted || audioStartingRef.current) return;
    audioStartingRef.current = true;
    try {
      await initAudio();
      initSaxEngine();
      startMetronome(bpmRef.current, 4);
      setMetronomeVolume(-30);
      setAudioStarted(true);
    } catch {
      audioStartingRef.current = false;
    }
  }, [audioStarted]);

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
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    return () => ro.disconnect();
  }, []);

  /* --------------------------------------------------------
     Play chord notes in sequence (ascending scale: root → 3rd → 5th)
     with vertex pulse at each note
     -------------------------------------------------------- */
  const playTriadSequence = useCallback((chord: typeof GIANT_STEPS_PROGRESSION[0]) => {
    if (!controlsRef.current.soundEnabled || !isSaxReady()) return;

    // Clear any pending note timers
    for (const t of noteTimersRef.current) clearTimeout(t);
    noteTimersRef.current = [];

    // Stagger interval based on BPM — faster BPM = tighter stagger
    const staggerMs = Math.max(40, Math.min(150, (60000 / bpmRef.current) * 0.25));

    // Play root, 3rd, 7th in ascending sequence with shockwave at each note
    const noteIndices = [0, 1, 3]; // root, 3rd, 7th
    const color = KEY_CENTER_COLORS[chord.keyCenter];
    for (let i = 0; i < 3; i++) {
      const timer = setTimeout(() => {
        const freq = chord.frequencies[noteIndices[i]];
        playSaxNote(freq / 2, 0.6); // drop an octave — tenor sax range
        // Pulse vertex
        vertexScaleRef.current[i] = 2.0;
        // Shockwave at this note's position on the circle
        const { w, h } = sizeRef.current;
        const circleRadius = Math.min(w, h) * CIRCLE_RADIUS_RATIO;
        const noteAngle = getNoteAngle(chord.notes[noteIndices[i]]);
        const pos = getCirclePoint(noteAngle, circleRadius, w / 2, h / 2);
        shockwavesRef.current.push({ x: pos.x, y: pos.y, startTime: Date.now(), color });
      }, i * staggerMs);
      noteTimersRef.current.push(timer);
    }
  }, []);

  /* --------------------------------------------------------
     Progression callbacks
     -------------------------------------------------------- */
  useEffect(() => {
    progression.onChordChange((newChord, idx) => {
      chordFlashRef.current = performance.now();
      chordNameRef.current = newChord.name;
      void idx;

      // Update chord triangle — root, 3rd, 7th (different shape per chord type)
      chordAnglesRef.current = [
        getNoteAngle(newChord.notes[0]), // root
        getNoteAngle(newChord.notes[1]), // 3rd
        getNoteAngle(newChord.notes[3]), // 7th
      ];
      chordColorRef.current = KEY_CENTER_COLORS[newChord.keyCenter];
      activeNotesRef.current = new Set([
        getPitchClass(newChord.notes[0]),
        getPitchClass(newChord.notes[1]),
        getPitchClass(newChord.notes[3]),
      ]);
      triangleOpacityRef.current = 0.8;

      // Play notes in sequence: root → 3rd → 5th (ascending scale)
      playTriadSequence(newChord);
    });

    progression.onKeyChange((newKey, _prevKey) => {
      activeKeyCenterRef.current = newKey;
      keyCenterScaleRef.current[newKey] = 1.5;
    });

    progression.start(bpmRef.current);
    return () => progression.stop();
  }, [progression, playTriadSequence]);

  // Decay & reverb controls
  useEffect(() => { setSaxDecay(controls.decay); }, [controls.decay]);
  useEffect(() => { setSaxReverb(controls.reverbMix); }, [controls.reverbMix]);

  /* --------------------------------------------------------
     Interaction: mouse + touch
     -------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      cursorRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      cursorRef.current = null;
    };

    const handleClick = () => {
      handleAudioStart();
    };

    const handleTouchStart = () => {
      const g = gyroRef.current;
      if (g.permissionState === 'prompt' && !gyroRequestedRef.current) {
        gyroRequestedRef.current = true;
        g.requestPermission().catch(() => {});
      }
      handleAudioStart();
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
  }, [handleAudioStart, isMobile, progression]);

  /* --------------------------------------------------------
     Main RAF loop: render
     -------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      const rawDt = lastTimeRef.current ? (time - lastTimeRef.current) / 16.667 : 1;
      const dt = Math.min(rawDt, 3);
      lastTimeRef.current = time;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (controlsRef.current.paused) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Update BPM from gyro (mobile)
      if (isMobile) {
        const g = gyroRef.current;
        if (g.permissionState === 'granted' || g.permissionState === 'not-required') {
          const newBpm = Math.round(80 + applyDeadZone(g.betaNorm, 0.10) * 240);
          bpmRef.current = newBpm;
          progression.setBpm(newBpm);
        }
      }

      const cx = w / 2;
      const cy = h / 2;
      const circleRadius = Math.min(w, h) * CIRCLE_RADIUS_RATIO;
      const activeKey = activeKeyCenterRef.current;

      // ---- RENDER ----
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, w, h);

      // 1. Circle ring
      ctx.beginPath();
      ctx.arc(cx, cy, circleRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(214, 197, 171, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Current chord color (needed for label highlighting)
      const shapeColor = chordColorRef.current;

      // 2. 12 key labels + dots
      ctx.font = '10px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const key of CIRCLE_OF_FIFTHS) {
        const pos = getCirclePoint(key.angle, circleRadius + LABEL_OFFSET, cx, cy);
        const isActive = activeNotesRef.current.has(normalizePitch(key.note));
        ctx.fillStyle = isActive
          ? colorWithAlpha(shapeColor, 0.9)
          : 'rgba(214, 197, 171, 0.3)';
        ctx.fillText(key.note, pos.x, pos.y);

        const dotPos = getCirclePoint(key.angle, circleRadius, cx, cy);
        ctx.beginPath();
        ctx.arc(dotPos.x, dotPos.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? colorWithAlpha(shapeColor, 0.5) : 'rgba(214, 197, 171, 0.1)';
        ctx.fill();
      }

      // 3. Dynamic chord triangle — smoothly lerp angles
      const lerpSpeed = 0.18 * dt;
      for (let i = 0; i < 3; i++) {
        const target = chordAnglesRef.current[i];
        const current = chordCurrentRef.current[i];
        let diff = target - current;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        chordCurrentRef.current[i] = current + diff * lerpSpeed;
        if (chordCurrentRef.current[i] < 0) chordCurrentRef.current[i] += 360;
        if (chordCurrentRef.current[i] >= 360) chordCurrentRef.current[i] -= 360;
      }

      // Fade opacity back toward base
      triangleOpacityRef.current += (0.25 - triangleOpacityRef.current) * 0.05 * dt;

      // Sort vertices by angle so edges don't cross
      const sortedAngles = [...chordCurrentRef.current].sort((a, b) => a - b);
      const chordVerts = sortedAngles.map(a => getCirclePoint(a, circleRadius, cx, cy));

      // Filled triangle
      ctx.beginPath();
      ctx.moveTo(chordVerts[0].x, chordVerts[0].y);
      ctx.lineTo(chordVerts[1].x, chordVerts[1].y);
      ctx.lineTo(chordVerts[2].x, chordVerts[2].y);
      ctx.closePath();
      ctx.fillStyle = colorWithAlpha(shapeColor, triangleOpacityRef.current * 0.06);
      ctx.fill();

      // Triangle stroke
      ctx.beginPath();
      ctx.moveTo(chordVerts[0].x, chordVerts[0].y);
      ctx.lineTo(chordVerts[1].x, chordVerts[1].y);
      ctx.lineTo(chordVerts[2].x, chordVerts[2].y);
      ctx.closePath();
      ctx.strokeStyle = shapeColor;
      ctx.globalAlpha = triangleOpacityRef.current;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Vertex dots with pulse animation
      const noteLabels = ['R', '3', '7'];
      for (let i = 0; i < 3; i++) {
        const scale = vertexScaleRef.current[i];
        vertexScaleRef.current[i] += (1 - scale) * 0.08 * dt; // decay back to 1

        const v = chordVerts[i];
        const dotR = 5 * scale;

        // Glow ring when pulsing
        if (scale > 1.1) {
          ctx.beginPath();
          ctx.arc(v.x, v.y, dotR * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = colorWithAlpha(shapeColor, 0.06 * (scale - 1));
          ctx.fill();
        }

        // Dot
        ctx.beginPath();
        ctx.arc(v.x, v.y, dotR, 0, Math.PI * 2);
        ctx.fillStyle = shapeColor;
        ctx.globalAlpha = Math.min(1, triangleOpacityRef.current * 1.2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Note label at vertex
        if (scale > 1.05) {
          ctx.font = `${Math.round(9 * scale)}px "DM Sans", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = colorWithAlpha(shapeColor, Math.min(1, (scale - 1) * 2));
          ctx.fillText(noteLabels[i], v.x, v.y - dotR - 8);
        }
      }

      // (Key center dots removed — triangle vertices are the visual now)

      // 5. Shockwave rings
      const now = Date.now();
      for (const sw of shockwavesRef.current) {
        const age = now - sw.startTime;
        const t = age / 500;
        if (t >= 1) continue;
        const radius = 10 + t * 80;
        const alpha = 0.4 * (1 - t * t * t);
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      shockwavesRef.current = shockwavesRef.current.filter(sw => now - sw.startTime < 500);

      // 6. Centered chord name
      const flashElapsed = time - chordFlashRef.current;
      const flashAlpha = flashElapsed < 500
        ? 0.06 + 0.1 * (1 - flashElapsed / 500)
        : 0.06;
      const chordFontSize = isMobile ? 48 : 72;
      ctx.font = `italic ${chordFontSize}px Georgia, "Times New Roman", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(214, 197, 171, ${flashAlpha})`;
      ctx.fillText(chordNameRef.current, cx, cy);

      // 7. BPM indicator
      ctx.font = '10px "DM Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = 'rgba(214, 197, 171, 0.25)';
      ctx.fillText(`${bpmRef.current} BPM`, 12, h - 12);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isMobile, progression]);

  /* --------------------------------------------------------
     Cleanup
     -------------------------------------------------------- */
  useEffect(() => {
    return () => {
      stopMetronome();
      dispose();
      disposeSax();
      for (const t of noteTimersRef.current) clearTimeout(t);
    };
  }, []);

  /* --------------------------------------------------------
     BPM slider
     -------------------------------------------------------- */
  const handleBpmChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newBpm = parseInt(e.target.value, 10);
    bpmRef.current = newBpm;
    setDisplayBpm(newBpm);
    progression.setBpm(newBpm);
    setMetronomeTempo(newBpm);
    handleAudioStart();
  }, [progression, handleAudioStart]);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.bpmSlider}>
        <input
          type="range"
          min={80}
          max={320}
          value={displayBpm}
          onChange={handleBpmChange}
          className={styles.slider}
          onTouchStart={() => {
            try { Tone.start(); } catch { /* noop */ }
            if (gyro.permissionState === 'prompt' && !gyroRequestedRef.current) {
              gyroRequestedRef.current = true;
              gyro.requestPermission().catch(() => {});
            }
          }}
        />
        <span className={styles.bpmLabel}>{displayBpm} BPM</span>
      </div>
    </div>
  );
}
