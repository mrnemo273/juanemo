'use client';

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../../../lib/useDeviceOrientation';
import { useGiantStepsProgression } from './useGiantStepsProgression';
import { GIANT_STEPS_PROGRESSION, KEY_CENTER_COLORS, CIRCLE_OF_FIFTHS } from './giantStepsChordData';
import type { KeyCenter } from './types';
import * as Tone from 'tone';
import { initAudio, dispose, startMetronome, setMetronomeTempo, setMetronomeVolume, stopMetronome } from '../CollisionChanges/audioEngine';
import { initSaxEngine, playSaxNote, isSaxReady, setSaxDecay, setSaxReverb, disposeSax, type Voice } from './saxEngine';
import styles from './GiantSteps.module.css';

/* ── Constants ── */
const MOBILE_BREAKPOINT = 600;
const BACKGROUND = '#1F2627';
const NUM_ORBS = 7;
const CIRCLE_RADIUS_RATIO = 0.35;
const LABEL_OFFSET = 24;
const ZONE_GLOW_RADIUS = 45;
const DRIFT_SPEED = 0.15;
const ZONE_SPRING = 0.025;
const DRAW_IN_SPEED = 0.06;   // how fast arcs draw in per frame (0→1)
const DISSOLVE_MS = 2500;     // how long chord arcs linger after chord change
const ARC_BULGE = 0.35;       // how far arcs curve inward (fraction of radius)

/* ── Note → circle-of-fifths angle mapping ── */
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

function getNoteAngle(note: string): number {
  return NOTE_TO_ANGLE[getPitchClass(note)] ?? 0;
}

/* ── Types ── */

/** A single Bézier arc between two notes on the circle */
interface ArcSegment {
  fromAngle: number;
  toAngle: number;
  bulgeRandom: number;   // per-segment randomized bulge offset
  strokeWidth: number;   // per-segment randomized stroke width
}

/** A chord shape: 3 arcs connecting root→3rd→7th→root */
interface ChordArc {
  segments: ArcSegment[];   // 3 arcs
  keyCenter: KeyCenter;
  color: string;
  spawnTime: number;
  activeUntil: number;      // when the next chord fires, this becomes "dissolving"
  dissolved: boolean;
  bouncePhase: number;      // 0→1+ spring bounce animation
  drawIn: number;           // 0→1 how much of each arc is drawn (pen animation)
}

interface BridgeOrb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  traveling: boolean;
  arcSeg: number;       // which segment (0, 1, 2) the orb is traveling
  bridgeT: number;      // 0–1 along current segment
  travelSpeed: number;
  radius: number;
}

/* ── Helpers ── */
function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

function getCirclePoint(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + Math.cos(rad) * radius, y: cy + Math.sin(rad) * radius };
}

/**
 * Compute a quadratic Bézier control point that curves INWARD toward center.
 * mouseOffset shifts the control point for interactivity.
 */
function getArcControlPoint(
  fromAngle: number, toAngle: number,
  circleR: number, cx: number, cy: number,
  mouseOffset: number, // radial offset from mouse/gyro
  bulgeRandom: number = 0, // per-segment random offset to ARC_BULGE
) {
  // Midpoint angle (shortest arc between the two notes)
  let diff = toAngle - fromAngle;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const midAngle = fromAngle + diff / 2;

  // Control point is at midAngle but pulled inward, with randomized bulge
  const bulge = ARC_BULGE + bulgeRandom;
  const inwardR = circleR * (1 - bulge) + mouseOffset;
  return getCirclePoint(midAngle, inwardR, cx, cy);
}

function bezierPoint(
  from: { x: number; y: number },
  cp: { x: number; y: number },
  to: { x: number; y: number },
  t: number,
) {
  const u = 1 - t;
  return {
    x: u * u * from.x + 2 * u * t * cp.x + t * t * to.x,
    y: u * u * from.y + 2 * u * t * cp.y + t * t * to.y,
  };
}

/** Get 3 sorted note angles from a chord (root, 3rd, 7th) */
function getChordAngles(chord: typeof GIANT_STEPS_PROGRESSION[0]): number[] {
  const angles = [
    getNoteAngle(chord.notes[0]), // root
    getNoteAngle(chord.notes[1]), // 3rd
    getNoteAngle(chord.notes[3]), // 7th
  ];
  // Sort by angle for consistent arc drawing
  angles.sort((a, b) => a - b);
  return angles;
}

/** Build 3 arc segments from sorted angles: 0→1, 1→2, 2→0 (wrapping) */
function buildArcSegments(angles: number[]): ArcSegment[] {
  return [
    { fromAngle: angles[0], toAngle: angles[1], bulgeRandom: (Math.random() - 0.5) * 0.2, strokeWidth: 1.2 + Math.random() * 1.6 },
    { fromAngle: angles[1], toAngle: angles[2], bulgeRandom: (Math.random() - 0.5) * 0.2, strokeWidth: 1.2 + Math.random() * 1.6 },
    { fromAngle: angles[2], toAngle: angles[0] + 360, bulgeRandom: (Math.random() - 0.5) * 0.2, strokeWidth: 1.2 + Math.random() * 1.6 },
  ];
}


/* ── Component ── */
export default function ChromaticBridges() {
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
  const [displayBpm, setDisplayBpm] = useState(160);

  const progression = useGiantStepsProgression();

  const activeKeyCenterRef = useRef<KeyCenter>('B');
  const bpmRef = useRef(160);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);

  // Chord arc shapes (active + dissolving)
  const chordArcsRef = useRef<ChordArc[]>([]);
  const activeArcRef = useRef<ChordArc | null>(null);

  // Orbs
  const orbsRef = useRef<BridgeOrb[]>([]);

  // Chord name display
  const chordNameRef = useRef(GIANT_STEPS_PROGRESSION[0].name);
  const chordFlashRef = useRef(0);

  // Note timers
  const noteTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* ── Mobile detection ── */
  useEffect(() => { setIsMobile(isMobileViewport()); }, []);

  /* ── Init orbs ── */
  useEffect(() => {
    const firstChord = GIANT_STEPS_PROGRESSION[0];
    const angle = getNoteAngle(firstChord.notes[0]);
    const { w, h } = sizeRef.current;
    const cx = (w || 400) / 2;
    const cy = (h || 400) / 2;
    const r = Math.min(w || 400, h || 400) * CIRCLE_RADIUS_RATIO;
    const pos = getCirclePoint(angle, r, cx, cy);
    orbsRef.current = Array.from({ length: NUM_ORBS }, () => ({
      x: pos.x + (Math.random() - 0.5) * 40,
      y: pos.y + (Math.random() - 0.5) * 40,
      vx: 0, vy: 0,
      traveling: false,
      arcSeg: 0,
      bridgeT: 0,
      travelSpeed: 0,
      radius: 4 + Math.random() * 4,
    }));
  }, []);

  /* ── Audio init ── */
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
      if (ctx.state === 'running' && controlsRef.current.soundEnabled) handleAudioStart();
    };
    check();
    ctx.addEventListener('statechange', check);
    return () => ctx.removeEventListener('statechange', check);
  }, [audioStarted, controls.soundEnabled, handleAudioStart]);

  /* ── Canvas sizing ── */
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

  /* ── Play triad (root → 3rd → 7th ascending) ── */
  const playTriadSequence = useCallback((chord: typeof GIANT_STEPS_PROGRESSION[0]) => {
    if (!controlsRef.current.soundEnabled || !isSaxReady()) return;
    for (const t of noteTimersRef.current) clearTimeout(t);
    noteTimersRef.current = [];
    const staggerMs = Math.max(40, Math.min(150, (60000 / bpmRef.current) * 0.25));
    const noteIndices = [0, 1, 3]; // root, 3rd, 7th
    const voices: Voice[] = ['sax', 'piano', 'bass'];
    for (let i = 0; i < 3; i++) {
      const timer = setTimeout(() => {
        playSaxNote(chord.frequencies[noteIndices[i]] / 2, 0.5, '4n', voices[i]);
      }, i * staggerMs);
      noteTimersRef.current.push(timer);
    }
  }, []);

  /* ── Progression callbacks ── */
  useEffect(() => {
    progression.onChordChange((newChord) => {
      chordFlashRef.current = performance.now();
      chordNameRef.current = newChord.name;
      activeKeyCenterRef.current = newChord.keyCenter;
      const now = performance.now();

      // Dissolve previous active arc
      if (activeArcRef.current) {
        activeArcRef.current.dissolved = true;
        activeArcRef.current.activeUntil = now;
      }

      // Create new chord arc
      const angles = getChordAngles(newChord);
      const segments = buildArcSegments(angles);
      const arc: ChordArc = {
        segments,
        keyCenter: newChord.keyCenter,
        color: KEY_CENTER_COLORS[newChord.keyCenter],
        spawnTime: now,
        activeUntil: Infinity,
        dissolved: false,
        bouncePhase: 0,
        drawIn: 0,
      };
      chordArcsRef.current.push(arc);
      activeArcRef.current = arc;

      // Launch orbs along the new arc shape
      const orbs = orbsRef.current;
      for (let i = 0; i < orbs.length; i++) {
        orbs[i].traveling = true;
        orbs[i].arcSeg = i % 3; // distribute across 3 segments
        orbs[i].bridgeT = 0;
        orbs[i].travelSpeed = 0.002 + Math.random() * 0.004;
      }

      // Play triad
      playTriadSequence(newChord);

    });

    progression.onKeyChange((newKey) => { activeKeyCenterRef.current = newKey; });

    progression.start(bpmRef.current);
    return () => progression.stop();
  }, [progression, playTriadSequence]);

  useEffect(() => { setSaxDecay(controls.decay); }, [controls.decay]);
  useEffect(() => { setSaxReverb(controls.reverbMix); }, [controls.reverbMix]);

  /* ── Interaction ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      cursorRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => { cursorRef.current = null; };

    const handleTap = (_x: number, _y: number) => {
      if (!audioStarted) { handleAudioStart(); return; }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      handleTap(e.clientX - rect.left, e.clientY - rect.top);
    };
    const handleTouchStart = (e: TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      handleTap(touch.clientX - rect.left, touch.clientY - rect.top);
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
  }, [handleAudioStart, audioStarted]);

  /* ── Main RAF loop ── */
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
      if (w === 0 || h === 0) { rafRef.current = requestAnimationFrame(loop); return; }
      if (controlsRef.current.paused) { rafRef.current = requestAnimationFrame(loop); return; }

      // Mobile gyro BPM
      if (isMobile) {
        const g = gyroRef.current;
        if (g.permissionState === 'granted' || g.permissionState === 'not-required') {
          const newBpm = Math.round(80 + g.betaNorm * 240);
          bpmRef.current = newBpm;
          progression.setBpm(newBpm);
        }
      }

      const cx = w / 2;
      const cy = h / 2;
      const circleR = Math.min(w, h) * CIRCLE_RADIUS_RATIO;
      const activeKey = activeKeyCenterRef.current;
      const now = performance.now();

      // Mouse/gyro → radial offset for arc bulge
      let mouseRadialOffset = 0;
      if (isMobile) {
        const g = gyroRef.current;
        if (g.permissionState === 'granted' || g.permissionState === 'not-required') {
          mouseRadialOffset = (g.gammaNorm - 0.5) * circleR * 0.3;
        }
      } else if (cursorRef.current) {
        const distFromCenter = Math.hypot(cursorRef.current.x - cx, cursorRef.current.y - cy);
        mouseRadialOffset = (distFromCenter - circleR) * 0.15;
      }

      // ── UPDATE ARCS (bounce + draw-in) ──
      for (const arc of chordArcsRef.current) {
        // Advance bounce (spring: overshoot then settle)
        if (!arc.dissolved && arc.bouncePhase < 1) {
          arc.bouncePhase = Math.min(1, arc.bouncePhase + 0.03 * dt);
        }
        // Advance draw-in
        if (!arc.dissolved && arc.drawIn < 1) {
          arc.drawIn = Math.min(1, arc.drawIn + DRAW_IN_SPEED * dt);
        }
      }

      // ── CLEAN UP old dissolved arcs ──
      chordArcsRef.current = chordArcsRef.current.filter(arc => {
        if (arc.dissolved) {
          return (now - arc.activeUntil) < DISSOLVE_MS;
        }
        return true;
      });

      // ── UPDATE ORBS ──
      const activeArc = activeArcRef.current;
      for (const orb of orbsRef.current) {
        if (orb.traveling && activeArc && !activeArc.dissolved) {
          orb.bridgeT += orb.travelSpeed * dt;
          if (orb.bridgeT >= 1) {
            // Move to next segment or stop
            orb.bridgeT = 0;
            orb.arcSeg = (orb.arcSeg + 1) % 3;
            // Keep looping along the arc shape
          }
        } else if (!orb.traveling || !activeArc) {
          // Drift near the active key center's note on the circle
          const angles = activeArc ? activeArc.segments[0] : { fromAngle: getNoteAngle(GIANT_STEPS_PROGRESSION[0].notes[0]) };
          const targetAngle = 'fromAngle' in angles ? angles.fromAngle : 0;
          const target = getCirclePoint(targetAngle, circleR, cx, cy);
          const dx = target.x - orb.x;
          const dy = target.y - orb.y;
          const dist = Math.hypot(dx, dy);
          orb.vx += (Math.random() - 0.5) * DRIFT_SPEED;
          orb.vy += (Math.random() - 0.5) * DRIFT_SPEED;
          if (dist > ZONE_GLOW_RADIUS) {
            orb.vx += (dx / dist) * ZONE_SPRING * (dist - ZONE_GLOW_RADIUS);
            orb.vy += (dy / dist) * ZONE_SPRING * (dist - ZONE_GLOW_RADIUS);
          }
          orb.vx *= 0.95;
          orb.vy *= 0.95;
          orb.x += orb.vx * dt;
          orb.y += orb.vy * dt;
        }

        // Position traveling orbs along their arc segment
        if (orb.traveling && activeArc && !activeArc.dissolved) {
          const seg = activeArc.segments[orb.arcSeg];
          const from = getCirclePoint(seg.fromAngle, circleR, cx, cy);
          const to = getCirclePoint(seg.toAngle, circleR, cx, cy);
          const cp = getArcControlPoint(seg.fromAngle, seg.toAngle, circleR, cx, cy, mouseRadialOffset, seg.bulgeRandom);
          const pt = bezierPoint(from, cp, to, orb.bridgeT);
          // Slight perpendicular jitter
          const jAngle = Math.random() * Math.PI * 2;
          const jR = Math.random() * 5;
          orb.x = pt.x + Math.cos(jAngle) * jR;
          orb.y = pt.y + Math.sin(jAngle) * jR;
        }
      }

      // ── RENDER ──
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, w, h);

      // 1. Subtle 12 note dots (no circle ring — arcs imply the circle)
      ctx.font = '10px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const key of CIRCLE_OF_FIFTHS) {
        const labelPos = getCirclePoint(key.angle, circleR + LABEL_OFFSET, cx, cy);
        ctx.fillStyle = 'rgba(214, 197, 171, 0.20)';
        ctx.fillText(key.note, labelPos.x, labelPos.y);

        const dotPos = getCirclePoint(key.angle, circleR, cx, cy);
        ctx.beginPath();
        ctx.arc(dotPos.x, dotPos.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(214, 197, 171, 0.08)';
        ctx.fill();
      }

      // 2. Chord arcs — THE MAIN VISUAL
      for (const arc of chordArcsRef.current) {
        // Compute opacity
        let baseOpacity: number;
        if (arc.dissolved) {
          const age = now - arc.activeUntil;
          const t = Math.min(1, age / DISSOLVE_MS);
          baseOpacity = 0.7 * (1 - t * t); // ease-out fade
        } else {
          const age = now - arc.spawnTime;
          baseOpacity = Math.min(0.85, age / 200);
        }
        if (baseOpacity <= 0.005) continue;

        // Bounce: spring overshoot then settle — stronger amplitude, more oscillations
        const bp = arc.bouncePhase;
        const bounceMult = arc.dissolved ? 1 : 1 + 0.7 * Math.sin(bp * Math.PI * 5) * Math.max(0, 1 - bp * 1.1);

        // Draw-in: how much of each arc to render (0→1)
        const drawT = arc.dissolved ? 1 : arc.drawIn;

        // Pre-compute segment geometry for strokes + fill
        const segGeo: { from: { x: number; y: number }; cp: { x: number; y: number }; to: { x: number; y: number }; seg: ArcSegment }[] = [];
        for (let s = 0; s < arc.segments.length; s++) {
          const seg = arc.segments[s];
          const from = getCirclePoint(seg.fromAngle, circleR, cx, cy);
          const to = getCirclePoint(seg.toAngle, circleR, cx, cy);
          const bounceOffset = (bounceMult - 1) * circleR * 0.2;
          const cp = getArcControlPoint(seg.fromAngle, seg.toAngle, circleR, cx, cy,
            (arc.dissolved ? 0 : mouseRadialOffset) - bounceOffset,
            seg.bulgeRandom);
          segGeo.push({ from, cp, to, seg });
        }

        // Fill the enclosed shape once fully drawn (or dissolving)
        const shapeComplete = drawT >= 0.98;
        if (shapeComplete) {
          ctx.beginPath();
          // Trace all 3 Bézier arcs as a closed path
          const first = segGeo[0];
          ctx.moveTo(first.from.x, first.from.y);
          for (const g of segGeo) {
            ctx.quadraticCurveTo(g.cp.x, g.cp.y, g.to.x, g.to.y);
          }
          ctx.closePath();
          const fillOpacity = arc.dissolved
            ? baseOpacity * 0.25  // ghost fill fades with dissolve
            : baseOpacity * 0.12; // subtle fill when active
          ctx.fillStyle = arc.color;
          ctx.globalAlpha = fillOpacity;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        // Stroke each segment
        for (const g of segGeo) {
          // Draw partial arc (pen animation) using small line segments
          const steps = Math.max(2, Math.round(drawT * 40));
          if (steps < 2) continue;
          ctx.beginPath();
          const p0 = bezierPoint(g.from, g.cp, g.to, 0);
          ctx.moveTo(p0.x, p0.y);
          for (let i = 1; i <= steps; i++) {
            const t = (i / 40) * Math.min(drawT, 1);
            if (t > 1) break;
            const pt = bezierPoint(g.from, g.cp, g.to, t);
            ctx.lineTo(pt.x, pt.y);
          }
          ctx.strokeStyle = arc.color;
          ctx.globalAlpha = baseOpacity;
          ctx.lineWidth = arc.dissolved ? g.seg.strokeWidth * 0.5 : g.seg.strokeWidth;
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      // 3. (Orbs removed — arcs only)

      // 4. Chord name (center, subtle)
      const flashElapsed = time - chordFlashRef.current;
      const flashAlpha = flashElapsed < 500 ? 0.06 + 0.1 * (1 - flashElapsed / 500) : 0.06;
      const chordFontSize = isMobile ? 36 : 56;
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

  /* ── Cleanup ── */
  useEffect(() => {
    return () => {
      stopMetronome();
      dispose();
      disposeSax();
      for (const t of noteTimersRef.current) clearTimeout(t);
    };
  }, []);

  /* ── BPM slider ── */
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
          onTouchStart={() => { try { Tone.start(); } catch { /* noop */ } }}
        />
        <span className={styles.bpmLabel}>{displayBpm} BPM</span>
      </div>
    </div>
  );
}
