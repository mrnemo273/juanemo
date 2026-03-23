'use client';

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../../../lib/useDeviceOrientation';
import { useGiantStepsProgression } from './useGiantStepsProgression';
import { CIRCLE_OF_FIFTHS, KEY_CENTER_COLORS, KEY_CENTER_ANGLES, GIANT_STEPS_PROGRESSION } from './giantStepsChordData';
import type { KeyCenter, Shockwave } from './types';
import * as Tone from 'tone';
import { initAudio, dispose, startMetronome, setMetronomeTempo, setMetronomeVolume, stopMetronome } from '../CollisionChanges/audioEngine';
import { initSaxEngine, playSaxNote, isSaxReady, setSaxDecay, setSaxReverb, disposeSax } from './saxEngine';
import styles from './GiantSteps.module.css';

/* ── Constants ── */
const MOBILE_BREAKPOINT = 600;
const BACKGROUND = '#1F2627';
const CIRCLE_RADIUS_RATIO = 0.35;
const LABEL_OFFSET = 24;

// Physics — easing model (no spring overshoot)
const NUM_ORBS = 7;
const EASE_SPEED = 0.025;         // base easing rate
const MAX_ANGULAR_SPEED = 4.0;    // degrees/frame cap (faster)
const ORB_REPULSION_STRENGTH = 0.2;
const ORB_REPULSION_DEG = 15;
const RADIAL_SPRING = 0.05;   // stronger pull back to circle
const RADIAL_DAMPING = 0.85;
const RADIAL_NOISE = 0.0;    // no radial drift — stay on circle
const NOTE_TRIGGER_THRESHOLD = 6;
const NOTE_COOLDOWN_MS = 180;
const KICK_STAGGER_MS = 40;
const TRAIL_LENGTH = 30;

/* ── Types ── */
interface CircleOrb {
  angle: number;
  angularVelocity: number;
  radialOffset: number;
  radialVelocity: number;
  orbitRadius: number; // base (slightly varied per orb)
  mass: number;
  hue: number;
  breathPhase: number;
  trail: { angle: number; radius: number }[];
  lastNoteTrigger: number; // timestamp
  lastNoteIndex: number;   // which note was last triggered (-1 = none)
  group: number; // 0=root, 1=3rd, 2=7th — which chord tone this orb targets
  launchTime: number; // timestamp when this orb should start moving (staggered)
}

/* ── Helpers ── */
function getCirclePoint(angleDeg: number, radius: number, cx: number, cy: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + Math.cos(rad) * radius, y: cy + Math.sin(rad) * radius };
}

function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Shortest signed arc from `from` to `to`, in range (-180, 180] */
function angularDelta(from: number, to: number): number {
  let d = ((to - from) % 360 + 540) % 360 - 180;
  return d;
}

/** Wrap angle to [0, 360) */
function wrapAngle(a: number): number {
  return ((a % 360) + 360) % 360;
}

/** Note frequency lookup for the 12 circle-of-fifths positions (octave 3 for tenor range) */
const NOTE_FREQUENCIES: Record<string, number> = {
  'C': 130.81, 'G': 196.00, 'D': 146.83, 'A': 220.00,
  'E': 164.81, 'B': 123.47, 'F♯': 185.00, 'D♭': 138.59,
  'A♭': 207.65, 'E♭': 155.56, 'B♭': 116.54, 'F': 174.61,
};

/** Bass frequencies (one octave below) for root notes on key change */
const BASS_FREQUENCIES: Record<KeyCenter, number> = {
  'B': 61.74, 'G': 98.00, 'Eb': 77.78,
};

/**
 * Major scale notes for each key center, indexed by circle-of-fifths position (0–11).
 * Circle order: C(0) G(1) D(2) A(3) E(4) B(5) F♯(6) D♭(7) A♭(8) E♭(9) B♭(10) F(11)
 */
const KEY_SCALE_INDICES: Record<KeyCenter, Set<number>> = {
  // B major: B C# D# E F# G# A# → circle indices: 5,7,9,4,6,8,10
  'B':  new Set([5, 7, 9, 4, 6, 8, 10]),
  // G major: G A B C D E F# → circle indices: 1,3,5,0,2,4,6
  'G':  new Set([1, 3, 5, 0, 2, 4, 6]),
  // Eb major: Eb F G Ab Bb C D → circle indices: 9,11,1,8,10,0,2
  'Eb': new Set([9, 11, 1, 8, 10, 0, 2]),
};

/** Normalize chord note names to circle-of-fifths index */
function noteToCircleIndex(note: string): number {
  const pc = note.replace(/[0-9]/g, '');
  const map: Record<string, number> = {
    'C': 0, 'G': 1, 'D': 2, 'A': 3, 'E': 4, 'B': 5,
    'F#': 6, 'F♯': 6, 'Gb': 6,
    'C#': 7, 'Db': 7, 'D♭': 7, 'C♯': 7,
    'G#': 8, 'Ab': 8, 'A♭': 8, 'G♯': 8,
    'D#': 9, 'Eb': 9, 'E♭': 9, 'D♯': 9,
    'A#': 10, 'Bb': 10, 'B♭': 10, 'A♯': 10,
    'F': 11,
  };
  return map[pc] ?? -1;
}

/** Compute clockwise waypoints (each note on circle of fifths) from `from` to `to` */
function clockwiseWaypoints(from: number, to: number): number[] {
  const waypoints: number[] = [];
  // Snap `from` to nearest note position (30° intervals)
  const fromNote = Math.round(from / 30) * 30;
  const toNote = Math.round(to / 30) * 30;
  // Step clockwise through each 30° position
  let pos = (fromNote + 30) % 360;
  let safety = 0;
  while (pos !== toNote && safety < 12) {
    waypoints.push(pos);
    pos = (pos + 30) % 360;
    safety++;
  }
  waypoints.push(toNote); // final destination
  return waypoints;
}

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

/** Blend between two hex colors */
function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16), g1 = parseInt(c1.slice(3, 5), 16), b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16), g2 = parseInt(c2.slice(3, 5), 16), b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Get color for an orb based on its group's well */
const WELL_KEYS: KeyCenter[] = ['B', 'G', 'Eb'];
function getOrbColor(group: number): string {
  return KEY_CENTER_COLORS[WELL_KEYS[group]];
}

/* ── Component ── */
export default function ThreeBody() {
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
  const [showGyroToast, setShowGyroToast] = useState(false);
  const [gyroRequested, setGyroRequested] = useState(false);

  const progression = useGiantStepsProgression();

  const activeKeyCenterRef = useRef<KeyCenter>('B');
  const orbsRef = useRef<CircleOrb[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const wellPulseRef = useRef<Record<KeyCenter, number>>({ B: 0, G: 0, Eb: 0 });
  const chordNameRef = useRef('Bmaj7');
  const chordFlashRef = useRef(0);
  // Mobile gyro rotation offset (added to all well targets)
  const gyroRotationRef = useRef(0);
  // Track cumulative rotation for chord advancement on mobile
  const lastGyroChordAngleRef = useRef(0);
  const mobileChordIndexRef = useRef(0);
  const bpmRef = useRef(160);
  // Current chord tones as circle-of-fifths indices (for harmonic filtering)
  const chordToneIndicesRef = useRef<Set<number>>(new Set([5, 7, 9, 4])); // Bmaj7: B D# F# A#
  // Well target angles — where each well (B/G/Eb) wants to be (chord tone positions)
  const wellTargetAnglesRef = useRef<number[]>([150, 270, 300]); // Bmaj7: B, D#, A#
  // Current well angles — lerp toward targets for smooth movement
  const wellCurrentAnglesRef = useRef<number[]>([150, 270, 300]);
  // Queued next targets — applied only after orbs settle
  const queuedTargetsRef = useRef<{ angles: number[]; chordTones: Set<number> } | null>(null);
  // Whether orbs have settled at current wells
  const orbsSettledRef = useRef(true); // start settled so first chord applies immediately
  // Minimum hold time (ms) after orbs settle before wells can move again
  const SETTLE_HOLD_MS = 400;
  const settledAtRef = useRef(0); // timestamp when orbs settled
  // Well spring physics (elastic overshoot)
  const wellVelocityRef = useRef<number[]>([0, 0, 0]);
  // Waypoint queues — each well steps through circle-of-fifths positions clockwise
  const wellWaypointsRef = useRef<number[][]>([[], [], []]);
  // Final destination for each well (the chord tone it needs to reach)
  const wellFinalTargetsRef = useRef<number[]>([150, 270, 300]);

  const [displayBpm, setDisplayBpm] = useState(160);

  /* ── Initialize orbs ── */
  useEffect(() => {
    const orbs: CircleOrb[] = [];
    // Groups: 0=root(3 orbs), 1=3rd(2 orbs), 2=7th(2 orbs)
    const groupAssignments = [0, 0, 0, 1, 1, 2, 2];
    for (let i = 0; i < NUM_ORBS; i++) {
      const group = groupAssignments[i];
      // Start each group near their well's initial position + spread
      const groupAngle = wellCurrentAnglesRef.current[group] + (Math.random() - 0.5) * 40;
      orbs.push({
        angle: wrapAngle(groupAngle),
        angularVelocity: 0.2 + Math.random() * 0.4 * (Math.random() > 0.5 ? 1 : -1),
        radialOffset: (Math.random() - 0.5) * 10,
        radialVelocity: 0,
        orbitRadius: 0, // keep orbs on the circle line
        mass: 0.7 + Math.random() * 1.0,
        hue: (360 / NUM_ORBS) * i,
        breathPhase: Math.random() * Math.PI * 2,
        trail: [],
        lastNoteTrigger: 0,
        lastNoteIndex: -1,
        group,
        launchTime: 0,
      });
    }
    orbsRef.current = orbs;
  }, []);

  /* ── Mobile detection + gyro toast ── */
  useEffect(() => {
    const mobile = isMobileViewport();
    setIsMobile(mobile);
    // Show toast on mobile: for iOS (prompt) to get permission, for all mobile to start audio
    if (mobile && !gyroRequested) {
      setShowGyroToast(true);
    }
  }, [gyroRequested]);

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
    if (audioStarted || !controls.soundEnabled) return;
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

  /* ── Apply new well targets ── */
  const applyNewTargets = useCallback((newTargets: number[], chordTones: Set<number>) => {
    chordToneIndicesRef.current = chordTones;
    wellFinalTargetsRef.current = newTargets;
    wellTargetAnglesRef.current = [...newTargets];
    orbsSettledRef.current = false;

    // Pulse wells
    const keys: KeyCenter[] = ['B', 'G', 'Eb'];
    keys.forEach(k => { wellPulseRef.current[k] = 0.5; });

    // Stagger orb launches by WAVE — all orbs in same wave hit together (triad)
    // Wave 0: first orb from each group, Wave 1: second, Wave 2: third (if any)
    const now = performance.now();
    const beatMs = 60000 / bpmRef.current;
    const orbs = orbsRef.current;
    const groupCount = [0, 0, 0]; // track how many from each group we've seen
    for (let i = 0; i < orbs.length; i++) {
      const wave = groupCount[orbs[i].group];
      groupCount[orbs[i].group]++;
      orbs[i].launchTime = now + wave * beatMs; // same wave = same launch time
      orbs[i].radialOffset = 0;
    }
  }, []);

  /* ── Progression callbacks ── */
  useEffect(() => {
    progression.onChordChange((newChord) => {
      chordFlashRef.current = performance.now();
      chordNameRef.current = newChord.name;

      // Compute new chord tone indices and target angles
      const indices = new Set<number>();
      for (const note of newChord.notes) {
        const idx = noteToCircleIndex(note);
        if (idx >= 0) indices.add(idx);
      }

      const noteIndices = [0, 1, 3]; // root, 3rd, 7th
      const newTargets = noteIndices.map(ni => {
        const idx = noteToCircleIndex(newChord.notes[ni]);
        return idx >= 0 ? CIRCLE_OF_FIFTHS[idx].angle : 0;
      });

      // On mobile, gyro controls well positions — don't auto-move wells
      if (!isMobileViewport()) {
        if (orbsSettledRef.current) {
          applyNewTargets(newTargets, indices);
        } else {
          queuedTargetsRef.current = { angles: newTargets, chordTones: indices };
        }
      } else {
        // Still update chord tones for harmonic filtering
        chordToneIndicesRef.current = indices;
      }
    });

    progression.onKeyChange((newKey) => {
      activeKeyCenterRef.current = newKey;
      wellPulseRef.current[newKey] = 1.0;

      // Play root bass note on key change (grounds the harmony)
      if (controlsRef.current.soundEnabled && isSaxReady()) {
        playSaxNote(BASS_FREQUENCIES[newKey], 0.45, '2n');
      }

      // Shockwave at current well positions
      const { w, h } = sizeRef.current;
      const circleRadius = Math.min(w, h) * CIRCLE_RADIUS_RATIO;
      for (let i = 0; i < 3; i++) {
        const pos = getCirclePoint(wellCurrentAnglesRef.current[i], circleRadius, w / 2, h / 2);
        shockwavesRef.current.push({ x: pos.x, y: pos.y, startTime: Date.now(), color: KEY_CENTER_COLORS[newKey] });
      }
    });

    progression.start(bpmRef.current);
    return () => progression.stop();
  }, [progression]);

  // Decay & reverb controls
  useEffect(() => { setSaxDecay(controls.decay); }, [controls.decay]);
  useEffect(() => { setSaxReverb(controls.reverbMix); }, [controls.reverbMix]);

  /* ── Interaction ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleClick = () => handleAudioStart();
    const handleTouch = () => handleAudioStart();
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch, { passive: true });
    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [handleAudioStart]);

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

      // Mobile gyro: tilt rotates the triad + advances chord progression
      if (isMobile) {
        const g = gyroRef.current;
        const newRotation = (g.gammaNorm - 0.5) * 360;
        gyroRotationRef.current = newRotation;

        // Advance chord when rotation crosses 30° boundaries (one circle-of-fifths step)
        const angleDiff = newRotation - lastGyroChordAngleRef.current;
        if (Math.abs(angleDiff) >= 30) {
          const steps = Math.floor(Math.abs(angleDiff) / 30);
          const direction = angleDiff > 0 ? 1 : -1;
          lastGyroChordAngleRef.current += steps * 30 * direction;

          // Advance/retreat through progression
          const total = GIANT_STEPS_PROGRESSION.length;
          mobileChordIndexRef.current = ((mobileChordIndexRef.current + steps * direction) % total + total) % total;
          const chord = GIANT_STEPS_PROGRESSION[mobileChordIndexRef.current];

          // Update chord name + flash
          chordNameRef.current = chord.name;
          chordFlashRef.current = performance.now();
          activeKeyCenterRef.current = chord.keyCenter;

          // Compute new well targets from chord tones
          const noteIndices = [0, 1, 3];
          const newTargets = noteIndices.map(ni => {
            const idx = noteToCircleIndex(chord.notes[ni]);
            return idx >= 0 ? CIRCLE_OF_FIFTHS[idx].angle : 0;
          });
          wellTargetAnglesRef.current = [...newTargets];
          wellFinalTargetsRef.current = [...newTargets];

          // Update chord tone filtering
          const indices = new Set<number>();
          for (const note of chord.notes) {
            const idx = noteToCircleIndex(note);
            if (idx >= 0) indices.add(idx);
          }
          chordToneIndicesRef.current = indices;

          // Play bass root on chord change
          if (controlsRef.current.soundEnabled && isSaxReady()) {
            const bassFreq = BASS_FREQUENCIES[chord.keyCenter];
            if (bassFreq) playSaxNote(bassFreq, 0.45, '2n');
          }

          // Pulse wells
          const keys: KeyCenter[] = ['B', 'G', 'Eb'];
          keys.forEach(k => { wellPulseRef.current[k] = 0.5; });
        }
      }

      const cx = w / 2;
      const cy = h / 2;
      const circleRadius = Math.min(w, h) * CIRCLE_RADIUS_RATIO;
      const activeKey = activeKeyCenterRef.current;
      const orbs = orbsRef.current;
      const now = performance.now();

      // ═══ PHYSICS ═══

      // Well movement
      const targets = wellTargetAnglesRef.current;
      const current = wellCurrentAnglesRef.current;
      if (isMobile) {
        // Mobile: wells follow gyro directly (responsive, no lag)
        const gyroOffset = gyroRotationRef.current;
        for (let w = 0; w < 3; w++) {
          current[w] = wrapAngle(targets[w] + gyroOffset);
        }
      } else {
        // Desktop: smooth lerp to chord positions (matching Section A)
        const WELL_LERP = 0.18 * dt;
        for (let w = 0; w < 3; w++) {
          const diff = angularDelta(current[w], targets[w]);
          current[w] = wrapAngle(current[w] + diff * WELL_LERP);
        }
      }

      const tiltNoise = RADIAL_NOISE;

      for (let i = 0; i < orbs.length; i++) {
        const orb = orbs[i];

        // 1. Easing toward group's well — shortest arc, decelerates smoothly
        //    Only start moving after this orb's launch time (staggered per tempo)
        const launched = now >= orb.launchTime;
        const targetAngle = current[orb.group];
        const delta = angularDelta(orb.angle, targetAngle);
        const absDelta = Math.abs(delta) < 1 ? 0 : Math.abs(delta);

        let step = 0;
        if (launched && absDelta > 0) {
          // Gentle ease-in: slight ramp then mostly constant speed
          const t = Math.min(absDelta / 60, 1);
          const easedSpeed = MAX_ANGULAR_SPEED * (1 - t * 0.3) * dt;
          step = Math.sign(delta) * Math.max(easedSpeed, 0.2 * dt);

          // Cap speed
          if (Math.abs(step) > MAX_ANGULAR_SPEED * dt) {
            step = Math.sign(delta) * MAX_ANGULAR_SPEED * dt;
          }

          // Never overshoot — clamp step to remaining distance
          if (Math.abs(step) > absDelta) {
            step = delta; // snap exactly to target
          }
        }

        // Track effective velocity for audio triggers and rendering
        orb.angularVelocity = (launched && absDelta > 1) ? step / dt : 0;

        // 2. Inter-orb repulsion only while in transit (fade out near well)
        let repulsionStep = 0;
        const nearWell = absDelta < 20; // suppress repulsion when close to target
        if (!nearWell) {
          for (let j = 0; j < orbs.length; j++) {
            if (j === i) continue;
            const other = orbs[j];
            const interDelta = angularDelta(orb.angle, other.angle);
            const absDist = Math.abs(interDelta);
            if (absDist < ORB_REPULSION_DEG && absDist > 0.5) {
              const force = ORB_REPULSION_STRENGTH * (ORB_REPULSION_DEG - absDist) / ORB_REPULSION_DEG;
              repulsionStep -= Math.sign(interDelta) * force * dt;
            }
          }
        }

        // 3. Update angle
        orb.angle = wrapAngle(orb.angle + step + repulsionStep);

        // 7. Radial spring (keeps orbs near circle)
        orb.radialVelocity += -RADIAL_SPRING * orb.radialOffset * dt;
        orb.radialVelocity *= RADIAL_DAMPING;
        orb.radialVelocity += (Math.random() - 0.5) * tiltNoise * dt;
        orb.radialOffset += orb.radialVelocity * dt;
        // Clamp radial offset
        const maxRadial = circleRadius * 0.15;
        orb.radialOffset = Math.max(-maxRadial, Math.min(maxRadial, orb.radialOffset));

        // 8. Update breath phase
        orb.breathPhase += 0.03 * dt;

        // 9. Trail
        orb.trail.push({ angle: orb.angle, radius: orb.radialOffset });
        if (orb.trail.length > TRAIL_LENGTH) orb.trail.shift();

        // 10. Note-crossing audio trigger with harmonic filtering
        if (controlsRef.current.soundEnabled && isSaxReady()) {
          const chordTones = chordToneIndicesRef.current;
          const scaleTones = KEY_SCALE_INDICES[activeKey];

          for (let n = 0; n < CIRCLE_OF_FIFTHS.length; n++) {
            const noteAngle = CIRCLE_OF_FIFTHS[n].angle;
            const dist = Math.abs(angularDelta(orb.angle, noteAngle));
            if (dist < NOTE_TRIGGER_THRESHOLD) {
              if (now - orb.lastNoteTrigger > NOTE_COOLDOWN_MS && orb.lastNoteIndex !== n) {
                // Harmonic filtering: chord tone = full, scale tone = soft, chromatic = skip
                const isChordTone = chordTones.has(n);
                const isScaleTone = scaleTones.has(n);
                if (!isChordTone && !isScaleTone) {
                  // Chromatic note — skip entirely
                  orb.lastNoteIndex = n;
                  continue;
                }

                orb.lastNoteTrigger = now;
                orb.lastNoteIndex = n;
                const speed = Math.abs(orb.angularVelocity);
                // Group-based durations: root=whole, 3rd=half, 7th=quarter
                const GROUP_DURATIONS = ['1n', '2n', '4n'] as const;
                const baseVel = isChordTone ? 0.35 : 0.15;
                const velocity = baseVel + Math.min(0.3, speed * 0.1);
                const duration = isChordTone
                  ? GROUP_DURATIONS[orb.group]
                  : '16n';
                const freq = NOTE_FREQUENCIES[CIRCLE_OF_FIFTHS[n].note] || 220;
                playSaxNote(freq, velocity, duration);

                // Shockwave — bigger for chord tones
                const notePos = getCirclePoint(noteAngle, circleRadius, cx, cy);
                const noteColor = getOrbColor(orb.group);
                if (isChordTone) {
                  shockwavesRef.current.push({ x: notePos.x, y: notePos.y, startTime: Date.now(), color: noteColor });
                }
              }
            } else if (orb.lastNoteIndex === n) {
              orb.lastNoteIndex = -1;
            }
          }
        }
      }

      // ═══ SETTLED CHECK ═══
      // Check if wells have reached FINAL targets (all waypoints consumed) and orbs have arrived
      if (!orbsSettledRef.current) {
        let allSettled = true;
        const finalTgts = wellFinalTargetsRef.current;
        // Wells must have reached final position
        for (let wi = 0; wi < 3; wi++) {
          if (Math.abs(angularDelta(current[wi], finalTgts[wi])) > 3) {
            allSettled = false;
            break;
          }
        }
        if (allSettled) {
          for (const orb of orbs) {
            const targetAngle = finalTgts[orb.group];
            const dist = Math.abs(angularDelta(orb.angle, targetAngle));
            const speed = Math.abs(orb.angularVelocity);
            if (dist > 8 || speed > 0.15) {
              allSettled = false;
              break;
            }
          }
        }
        if (allSettled) {
          orbsSettledRef.current = true;
          settledAtRef.current = now;
        }
      }

      // Apply queued targets only after hold time has elapsed
      if (orbsSettledRef.current && queuedTargetsRef.current) {
        if (now - settledAtRef.current >= SETTLE_HOLD_MS) {
          const queued = queuedTargetsRef.current;
          queuedTargetsRef.current = null;
          applyNewTargets(queued.angles, queued.chordTones);
        }
      }

      // ═══ RENDER ═══
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

      // 2. 12 key labels + dots
      ctx.font = '10px "DM Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      for (const key of CIRCLE_OF_FIFTHS) {
        const pos = getCirclePoint(key.angle, circleRadius + LABEL_OFFSET, cx, cy);
        const dotPos = getCirclePoint(key.angle, circleRadius, cx, cy);

        // Check if any orb is near this note
        let nearOrb = false;
        for (const orb of orbs) {
          if (Math.abs(angularDelta(orb.angle, key.angle)) < NOTE_TRIGGER_THRESHOLD * 1.5) {
            nearOrb = true;
            break;
          }
        }

        ctx.fillStyle = nearOrb ? 'rgba(214, 197, 171, 0.7)' : 'rgba(214, 197, 171, 0.25)';
        ctx.fillText(key.note, pos.x, pos.y);

        ctx.beginPath();
        ctx.arc(dotPos.x, dotPos.y, nearOrb ? 3 : 2, 0, Math.PI * 2);
        ctx.fillStyle = nearOrb ? 'rgba(214, 197, 171, 0.4)' : 'rgba(214, 197, 171, 0.08)';
        ctx.fill();
      }

      // 3. Wells on circle (at current lerped positions)
      const keys: KeyCenter[] = ['B', 'G', 'Eb'];
      for (let wi = 0; wi < keys.length; wi++) {
        const k = keys[wi];
        const wellAngle = current[wi];
        const wellPos = getCirclePoint(wellAngle, circleRadius, cx, cy);
        const isActive = k === activeKey;

        // Decay well pulse
        wellPulseRef.current[k] *= 0.96;
        const pulse = wellPulseRef.current[k];
        const baseRadius = isActive ? 8 : 5;
        const radius = baseRadius + pulse * 12;
        const alpha = isActive ? 0.8 : 0.25;

        // Glow
        if (isActive || pulse > 0.05) {
          ctx.beginPath();
          ctx.arc(wellPos.x, wellPos.y, radius * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = colorWithAlpha(KEY_CENTER_COLORS[k], (isActive ? 0.08 : 0.03) + pulse * 0.1);
          ctx.fill();
        }

        // Well dot
        ctx.beginPath();
        ctx.arc(wellPos.x, wellPos.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = colorWithAlpha(KEY_CENTER_COLORS[k], alpha);
        ctx.fill();

        // Well label
        ctx.font = 'bold 11px "DM Sans", sans-serif';
        ctx.fillStyle = colorWithAlpha(KEY_CENTER_COLORS[k], isActive ? 0.9 : 0.4);
        ctx.fillText(k, wellPos.x, wellPos.y - radius - 8);
      }

      // 3b. Triangle connecting the 3 wells — each edge gradient between its well colors
      {
        const wellPositions = [0, 1, 2].map(wi =>
          getCirclePoint(current[wi], circleRadius, cx, cy)
        );
        const wellColors = WELL_KEYS.map(k => KEY_CENTER_COLORS[k]);

        // Subtle fill (blend of all three)
        ctx.beginPath();
        ctx.moveTo(wellPositions[0].x, wellPositions[0].y);
        ctx.lineTo(wellPositions[1].x, wellPositions[1].y);
        ctx.lineTo(wellPositions[2].x, wellPositions[2].y);
        ctx.closePath();
        ctx.fillStyle = colorWithAlpha(wellColors[0], 0.03);
        ctx.fill();

        // Draw each edge with a gradient between its two well colors
        const edges = [[0, 1], [1, 2], [2, 0]];
        for (const [a, b] of edges) {
          const pa = wellPositions[a];
          const pb = wellPositions[b];
          const grad = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y);
          grad.addColorStop(0, colorWithAlpha(wellColors[a], 0.35));
          grad.addColorStop(1, colorWithAlpha(wellColors[b], 0.35));
          ctx.beginPath();
          ctx.moveTo(pa.x, pa.y);
          ctx.lineTo(pb.x, pb.y);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // 4. Orb trails
      for (const orb of orbs) {
        if (orb.trail.length < 2) continue;
        const color = getOrbColor(orb.group);
        ctx.beginPath();
        for (let t = 0; t < orb.trail.length; t++) {
          const tr = orb.trail[t];
          const r = circleRadius + orb.orbitRadius + tr.radius;
          const pos = getCirclePoint(tr.angle, r, cx, cy);
          if (t === 0) ctx.moveTo(pos.x, pos.y);
          else ctx.lineTo(pos.x, pos.y);
        }
        ctx.strokeStyle = colorWithAlpha(color.startsWith('rgb') ? KEY_CENTER_COLORS[activeKey] : color, 0.15);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 5. Orbs
      for (const orb of orbs) {
        const r = circleRadius + orb.orbitRadius + orb.radialOffset;
        const pos = getCirclePoint(orb.angle, r, cx, cy);
        const color = getOrbColor(orb.group);
        const breathScale = 1 + Math.sin(orb.breathPhase) * 0.15;
        const speed = Math.abs(orb.angularVelocity);
        const coreRadius = (3 + speed * 1.2) * breathScale;

        // Outer glow
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, coreRadius * 3, 0, Math.PI * 2);
        const gradColor = color.startsWith('rgb') ? KEY_CENTER_COLORS[activeKey] : color;
        ctx.fillStyle = colorWithAlpha(gradColor, 0.06);
        ctx.fill();

        // Inner glow
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, coreRadius * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = colorWithAlpha(gradColor, 0.15);
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = colorWithAlpha(gradColor, 0.7);
        ctx.fill();
      }

      // 6. Shockwave rings
      const nowMs = Date.now();
      for (const sw of shockwavesRef.current) {
        const age = nowMs - sw.startTime;
        const t = age / 400;
        if (t >= 1) continue;
        const radius = 6 + t * 50;
        const alpha = 0.3 * (1 - t * t * t);
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = alpha;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      shockwavesRef.current = shockwavesRef.current.filter(sw => nowMs - sw.startTime < 400);

      // 7. Chord name (centered, faint)
      const flashElapsed = time - chordFlashRef.current;
      const flashAlpha = flashElapsed < 500 ? 0.06 + 0.1 * (1 - flashElapsed / 500) : 0.06;
      const chordFontSize = isMobile ? 48 : 72;
      ctx.font = `italic ${chordFontSize}px Georgia, "Times New Roman", serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(214, 197, 171, ${flashAlpha})`;
      ctx.fillText(chordNameRef.current, cx, cy);

      // 8. Gyro debug on mobile (top-left, stacked)
      if (isMobile) {
        const g = gyroRef.current;
        ctx.font = '10px "DM Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(214, 197, 171, 0.4)';
        ctx.fillText(`γ ${g.gammaNorm.toFixed(3)}`, 12, 12);
        ctx.fillText(`rot ${gyroRotationRef.current.toFixed(1)}°`, 12, 24);
        ctx.fillText(`${g.permissionState}`, 12, 36);
      }

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

  const handleGyroToast = useCallback(async () => {
    if (gyroRequested) return;
    setGyroRequested(true);
    try {
      await gyro.requestPermission();
    } catch { /* ignore */ }
    setShowGyroToast(false);
    handleAudioStart();
  }, [gyro, gyroRequested, handleAudioStart]);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      {showGyroToast && (
        <button
          onClick={handleGyroToast}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(214, 197, 171, 0.12)',
            border: '1px solid rgba(214, 197, 171, 0.25)',
            borderRadius: 8,
            color: 'rgba(214, 197, 171, 0.8)',
            padding: '16px 28px',
            fontSize: 14,
            fontFamily: '"DM Sans", sans-serif',
            cursor: 'pointer',
            zIndex: 10,
            backdropFilter: 'blur(8px)',
          }}
        >
          Tap to enable motion control
        </button>
      )}
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
