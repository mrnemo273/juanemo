'use client';

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../../../lib/useDeviceOrientation';
import { useGiantStepsProgression } from './useGiantStepsProgression';
import { GIANT_STEPS_PROGRESSION, KEY_CENTER_COLORS } from './giantStepsChordData';
import type { KeyCenter } from './types';
import * as Tone from 'tone';
import { initAudio, dispose, startMetronome, setMetronomeTempo, setMetronomeVolume, stopMetronome } from '../CollisionChanges/audioEngine';
import { initSaxEngine, playSaxNote, isSaxReady, setSaxDecay, setSaxReverb, disposeSax, type Voice } from './saxEngine';
import styles from './GiantSteps.module.css';

/* ── Constants ── */
const MOBILE_BREAKPOINT = 600;
const BACKGROUND = '#1F2627';
const BONE = '#E8DED1';
const NUM_REAL_ORBS = 7;
const MIRROR_ANGLES = [0, Math.PI]; // real orb + mirror opposite through center
const AUTO_ROTATE_SPEED = 0.3 * (Math.PI / 180); // slow base spin

const FLASH_DECAY = 0.003;
const BEAT_PULSE_DECAY = 0.92;

// Sector angles (radians) — where each key center "lives"
const SECTOR_ANGLES: Record<KeyCenter, number> = {
  B: -Math.PI / 2,             // top
  G: -Math.PI / 2 + (2 * Math.PI) / 3,   // bottom-right
  Eb: -Math.PI / 2 + (4 * Math.PI) / 3,  // bottom-left
};

// Key order for sector detection
const KEYS: KeyCenter[] = ['B', 'G', 'Eb'];

/* ── Types ── */
interface MirrorParticle {
  id: number;
  angle: number;           // current angle on the circle (radians from center)
  targetAngle: number;     // angle we're lerping toward
  angularSpeed: number;    // per-orb lerp speed
  distFromCenter: number;  // fixed radius — different per orb = different line lengths
  selfSpin: number;        // slow individual drift (rad/s)
  radius: number;          // visual orb size
  note: string;
  frequency: number;
  hueShift: number;
  beatPulse: number;
  moveDelay: number;       // stagger delay (ms)
  moveStartTime: number;
  lastSector: KeyCenter;   // track which sector this orb was in (for crossing detection)
  lastNoteTime: number;    // prevent rapid retriggering
}

/* ── Helpers ── */
function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function shiftHue(hex: string, degrees: number): string {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  h = ((h * 360 + degrees) % 360 + 360) % 360;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  if (s === 0) { r = g = b = l; } else {
    const q2 = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q2;
    r = hue2rgb(p, q2, h / 360 + 1/3);
    g = hue2rgb(p, q2, h / 360);
    b = hue2rgb(p, q2, h / 360 - 1/3);
  }
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

/** Determine which sector (B/G/Eb) a world-space angle falls into */
function getSectorForAngle(worldAngle: number, axisRotation: number): KeyCenter {
  // Normalize angle relative to axis
  let a = ((worldAngle - axisRotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  // Sector boundaries: each sector is 120° (2π/3) wide, centered on its SECTOR_ANGLE
  // B is centered at -π/2 (top), but we offset by axisRotation
  // Simpler: check which sector center is closest
  let best: KeyCenter = 'B';
  let bestDist = Infinity;
  for (const key of KEYS) {
    const sectorCenter = ((SECTOR_ANGLES[key] - axisRotation) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    let diff = Math.abs(a - sectorCenter);
    if (diff > Math.PI) diff = 2 * Math.PI - diff;
    if (diff < bestDist) { bestDist = diff; best = key; }
  }
  return best;
}

/** Get mirror positions for a point at (angle, dist) from center */
function getMirrorPoints(
  angle: number, dist: number,
  cx: number, cy: number,
  axisRotation: number,
): { x: number; y: number; worldAngle: number }[] {
  const points: { x: number; y: number; worldAngle: number }[] = [];
  for (const mirrorOffset of MIRROR_ANGLES) {
    const worldAngle = angle + mirrorOffset + axisRotation;
    const x = cx + Math.cos(worldAngle) * dist;
    const y = cy + Math.sin(worldAngle) * dist;
    points.push({ x, y, worldAngle });
  }
  return points;
}

/* ── Component ── */
export default function MirrorSymmetry() {
  const controls = useContext(ExperimentControlsContext);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  const orientation = useDeviceOrientation();
  const gyroRef = useRef(orientation);
  gyroRef.current = orientation;

  const progression = useGiantStepsProgression();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });
  const lastTimeRef = useRef(0);

  const [audioStarted, setAudioStarted] = useState(false);
  const audioStartingRef = useRef(false);
  const [displayBpm, setDisplayBpm] = useState(160);
  const bpmRef = useRef(160);

  const realOrbsRef = useRef<MirrorParticle[]>([]);
  const axisRotationRef = useRef(0);
  const canvasFlashRef = useRef(0);
  const activeKeyCenterRef = useRef<KeyCenter>('B');
  const chordNameRef = useRef('Bmaj7');
  const chordFlashRef = useRef(0);
  const noteTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const beatPulseRef = useRef(0);

  // The target angle all orbs rotate toward (sector of the active key)
  const formationAngleRef = useRef(SECTOR_ANGLES['B']);

  // Drone
  const droneSynthRef = useRef<Tone.Synth | null>(null);
  const droneGainRef = useRef<Tone.Gain | null>(null);
  const droneKeyRef = useRef<KeyCenter>('B');

  const mouseRef = useRef({ x: 0, y: 0, active: false });

  /* ── Audio start ── */
  const handleAudioStart = useCallback(async () => {
    if (audioStarted || audioStartingRef.current) return;
    audioStartingRef.current = true;
    try {
      await initAudio();
      initSaxEngine();
      startMetronome(bpmRef.current, 4);
      setMetronomeVolume(-30);

      const droneGain = new Tone.Gain(0.06).toDestination();
      const droneSynth = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 1.5, decay: 0, sustain: 1, release: 2 },
        volume: -18,
      }).connect(droneGain);
      droneSynthRef.current = droneSynth;
      droneGainRef.current = droneGain;
      droneSynth.triggerAttack('B2', Tone.now());
      droneKeyRef.current = 'B';

      setAudioStarted(true);
    } catch {
      audioStartingRef.current = false;
    }
  }, [audioStarted]);

  const updateDrone = useCallback((key: KeyCenter) => {
    if (!droneSynthRef.current || droneKeyRef.current === key) return;
    droneKeyRef.current = key;
    const rootNote = key === 'B' ? 'B2' : key === 'G' ? 'G2' : 'Eb3';
    droneSynthRef.current.frequency.rampTo(Tone.Frequency(rootNote).toFrequency(), 0.8);
  }, []);

  useEffect(() => { setSaxDecay(controls.decay); }, [controls.decay]);
  useEffect(() => { setSaxReverb(controls.reverbMix); }, [controls.reverbMix]);

  /* ── Canvas resize ── */
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

  /* ── Initialize orbs — each at a different radius, spread around a small arc ── */
  useEffect(() => {
    const mobile = isMobileViewport();
    const chord = GIANT_STEPS_PROGRESSION[0];
    const orbs: MirrorParticle[] = [];
    const minDist = mobile ? 25 : 35;
    const maxDist = mobile ? 220 : 340;

    for (let i = 0; i < NUM_REAL_ORBS; i++) {
      const t = i / (NUM_REAL_ORBS - 1); // 0 to 1
      const dist = minDist + t * (maxDist - minDist) + (Math.random() - 0.5) * 20;
      const r = mobile ? 10 + Math.random() * 8 : 14 + Math.random() * 14;
      // Spread orbs across a ~60° arc around the formation angle
      const spread = ((i - (NUM_REAL_ORBS - 1) / 2) / NUM_REAL_ORBS) * (Math.PI / 3);

      orbs.push({
        id: i,
        angle: spread,
        targetAngle: spread,
        angularSpeed: 0.03 + Math.random() * 0.04, // lerp rate per frame
        distFromCenter: dist,
        selfSpin: (Math.random() - 0.5) * 0.08, // subtle per-orb drift
        radius: r,
        note: chord.notes[i % chord.notes.length],
        frequency: chord.frequencies[i % chord.frequencies.length],
        hueShift: [-25, -12, -4, 0, 6, 15, 28][i],
        beatPulse: 0,
        moveDelay: i * 50 + Math.random() * 30,
        moveStartTime: 0,
        lastSector: 'B',
        lastNoteTime: 0,
      });
    }
    realOrbsRef.current = orbs;
  }, []);

  /* ── Play triad ── */
  const playTriadSequence = useCallback((chord: typeof GIANT_STEPS_PROGRESSION[0], isResolution = false) => {
    if (!controlsRef.current.soundEnabled || !isSaxReady()) return;
    for (const t of noteTimersRef.current) clearTimeout(t);
    noteTimersRef.current = [];

    const noteIndices = [0, 1, 3];
    const voices: Voice[] = ['bass', 'piano', 'sax'];
    const durations: string[] = isResolution ? ['1n', '2n', '1n'] : ['4n', '4n', '2n'];
    const velocities = isResolution ? [0.5, 0.55, 0.5] : [0.35, 0.4, 0.45];
    const staggerMs = isResolution ? 30 : Math.max(80, Math.min(220, (60000 / bpmRef.current) * 0.4));

    for (let i = 0; i < 3; i++) {
      const timer = setTimeout(() => {
        const octaveShift = i === 0 ? 0.5 : 1;
        playSaxNote(chord.frequencies[noteIndices[i]] * octaveShift, velocities[i], durations[i], voices[i]);
      }, i * staggerMs);
      noteTimersRef.current.push(timer);
    }
  }, []);

  /* ── Steel drum note — pitch scales with distance from center ── */
  const playSteelDrumNote = useCallback((orb: MirrorParticle) => {
    if (!controlsRef.current.soundEnabled || !isSaxReady()) return;
    const now = performance.now();
    if (now - orb.lastNoteTime < 120) return; // rate limit per orb
    orb.lastNoteTime = now;

    // Distance → octave: close to center = high, far = low
    const mobile = isMobileViewport();
    const maxDist = mobile ? 220 : 340;
    const minDist = mobile ? 25 : 35;
    const t = Math.max(0, Math.min(1, (orb.distFromCenter - minDist) / (maxDist - minDist)));

    // Octave multiplier: close = 2x (up octave), far = 0.5x (down octave)
    const octaveShift = 2 - t * 1.5; // 2.0 → 0.5

    const voice: Voice = t < 0.33 ? 'piano' : t < 0.66 ? 'sax' : 'bass';
    const velocity = 0.2 + (1 - t) * 0.2; // closer = louder
    const dur = t < 0.5 ? '8n' : '4n'; // closer = shorter/percussive

    playSaxNote(orb.frequency * octaveShift, velocity, dur, voice);
    orb.beatPulse = 0.5 + (1 - t) * 0.3; // closer = bigger pulse
  }, []);

  /* ── Flash + pulse on resolution ── */
  const triggerFlash = useCallback(() => {
    canvasFlashRef.current = 0.15;
    for (const orb of realOrbsRef.current) orb.beatPulse = 1.0;
  }, []);

  /* ── Event listeners ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, active: true };
    };
    const handleMouseLeave = () => { mouseRef.current.active = false; };
    const handleClick = () => {
      if (!audioStarted) { handleAudioStart(); return; }
      triggerFlash();
    };
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (!audioStarted) { handleAudioStart(); return; }
      triggerFlash();
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleAudioStart, audioStarted, triggerFlash]);

  /* ── Progression callbacks ── */
  useEffect(() => {
    progression.onChordChange((newChord, idx) => {
      const now = performance.now();
      chordFlashRef.current = now;
      chordNameRef.current = newChord.name;
      activeKeyCenterRef.current = newChord.keyCenter;
      beatPulseRef.current = 1.0;

      // Rotate the formation toward the new key center's sector
      formationAngleRef.current = SECTOR_ANGLES[newChord.keyCenter];

      // Stagger orb note/frequency updates
      for (let i = 0; i < realOrbsRef.current.length; i++) {
        const orb = realOrbsRef.current[i];
        orb.moveStartTime = now;
        const timer = setTimeout(() => {
          orb.note = newChord.notes[i % newChord.notes.length];
          orb.frequency = newChord.frequencies[i % newChord.frequencies.length];
          orb.beatPulse = 0.7;
        }, orb.moveDelay);
        noteTimersRef.current.push(timer);
      }

      if (newChord.role === 'tonic') {
        triggerFlash();
        updateDrone(newChord.keyCenter);
        if (controlsRef.current.soundEnabled && isSaxReady()) {
          const timer = setTimeout(() => playTriadSequence(newChord, true), 100);
          noteTimersRef.current.push(timer);
        }
      } else {
        playTriadSequence(newChord, false);
      }
    });

    progression.onKeyChange((newKey) => {
      activeKeyCenterRef.current = newKey;
      updateDrone(newKey);
    });

    if (audioStarted) progression.start(bpmRef.current);
    return () => progression.stop();
  }, [progression, audioStarted, triggerFlash, playTriadSequence, updateDrone]);

  /* ── Cleanup ── */
  useEffect(() => {
    return () => {
      stopMetronome(); dispose(); disposeSax();
      if (droneSynthRef.current) { droneSynthRef.current.triggerRelease(); droneSynthRef.current.dispose(); }
      if (droneGainRef.current) droneGainRef.current.dispose();
      for (const t of noteTimersRef.current) clearTimeout(t);
    };
  }, []);

  /* ── Main RAF loop ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      const rawDt = lastTimeRef.current ? (time - lastTimeRef.current) / 16.667 : 1;
      const dt = Math.min(rawDt, 3);
      const dtMs = lastTimeRef.current ? time - lastTimeRef.current : 16.667;
      lastTimeRef.current = time;

      if (controlsRef.current.paused) { rafRef.current = requestAnimationFrame(loop); return; }

      const dpr = window.devicePixelRatio || 1;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) { rafRef.current = requestAnimationFrame(loop); return; }

      const mobile = w <= MOBILE_BREAKPOINT;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (mobile) {
        const newBpm = Math.round(80 + gyroRef.current.betaNorm * 240);
        bpmRef.current = newBpm;
        progression.setBpm(newBpm);
      }

      const cx = w / 2;
      const cy = h / 2;

      /* ── Axis rotation (slow auto + gentle mouse/gyro influence) ── */
      axisRotationRef.current += AUTO_ROTATE_SPEED * dtMs * 0.001;
      if (mouseRef.current.active && !mobile) {
        const mouseAngle = Math.atan2(mouseRef.current.y - cy, mouseRef.current.x - cx);
        let diff = mouseAngle - axisRotationRef.current;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        axisRotationRef.current += diff * 0.006 * dt;
      } else if (mobile) {
        const gammaAngle = (gyroRef.current.gammaNorm - 0.5) * Math.PI;
        let diff = gammaAngle - axisRotationRef.current;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        axisRotationRef.current += diff * 0.01 * dt;
      }

      /* ── Beat pulse decay ── */
      beatPulseRef.current *= BEAT_PULSE_DECAY;
      if (beatPulseRef.current < 0.01) beatPulseRef.current = 0;

      /* ── Update orb angles — rotate toward formation target ── */
      const orbs = realOrbsRef.current;
      const formationTarget = formationAngleRef.current;

      for (const orb of orbs) {
        // Each orb has a base offset from formation center (its spread position)
        // The target is: formationTarget + its spread offset
        const baseSpread = ((orb.id - (NUM_REAL_ORBS - 1) / 2) / NUM_REAL_ORBS) * (Math.PI / 3);
        const target = formationTarget + baseSpread;

        // Stagger: only start rotating after delay
        const timeSinceMove = time - orb.moveStartTime;
        const moveActive = timeSinceMove >= orb.moveDelay;
        const speed = moveActive ? orb.angularSpeed : orb.angularSpeed * 0.1;

        // Smooth lerp toward target (shortest path)
        let diff = target - orb.angle;
        while (diff > Math.PI) diff -= 2 * Math.PI;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        orb.angle += diff * speed * dt;

        // Add subtle per-orb drift
        orb.angle += orb.selfSpin * dtMs * 0.001;

        // Breathing on distance
        const breathe = 1 + Math.sin(time * 0.0012 + orb.id * 2.1) * 0.06;
        // Beat pulse on distance
        const pulse = 1 + beatPulseRef.current * 0.08;
        orb.distFromCenter *= 1; // dist is fixed, breathing applied at render time
        // (we apply breathe * pulse at render)

        // Decay per-orb beat pulse
        orb.beatPulse *= 0.94;
        if (orb.beatPulse < 0.01) orb.beatPulse = 0;

        // Sector-crossing detection → steel drum note
        const currentSector = getSectorForAngle(orb.angle + axisRotationRef.current, axisRotationRef.current);
        if (currentSector !== orb.lastSector && audioStarted) {
          playSteelDrumNote(orb);
          orb.lastSector = currentSector;
        }
      }

      /* ── Canvas flash decay ── */
      if (canvasFlashRef.current > 0) canvasFlashRef.current = Math.max(0, canvasFlashRef.current - FLASH_DECAY * dtMs);

      /* ═══════════ RENDER ═══════════ */
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, w, h);

      const maxRadius = Math.max(w, h);
      const activeKey = activeKeyCenterRef.current;
      const axisRot = axisRotationRef.current;

      // 1. Sector tints
      for (const key of KEYS) {
        const sectorStart = SECTOR_ANGLES[key] + axisRot - Math.PI / 3;
        const sectorEnd = sectorStart + (2 * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, maxRadius, sectorStart, sectorEnd);
        ctx.closePath();
        ctx.fillStyle = KEY_CENTER_COLORS[key];
        ctx.globalAlpha = key === activeKey ? 0.03 : 0.008;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // 2. Sector lines
      for (const key of KEYS) {
        const angle = SECTOR_ANGLES[key] + axisRot;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * maxRadius, cy + Math.sin(angle) * maxRadius);
        ctx.strokeStyle = KEY_CENTER_COLORS[key];
        ctx.globalAlpha = key === activeKey ? 0.15 : 0.05;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }


      // 3.5 Dotted octave rings (steel drum zone boundaries)
      const minDist = mobile ? 25 : 35;
      const maxDist = mobile ? 220 : 340;
      const zoneBoundaries = [0.33, 0.66]; // piano→sax, sax→bass
      ctx.setLineDash([4, 6]);
      for (const t of zoneBoundaries) {
        const ringRadius = minDist + t * (maxDist - minDist);
        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = BONE;
        ctx.globalAlpha = 0.08;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      const mirrorScale = mobile ? 0.75 : 0.9;

      // Pre-compute all mirror positions
      const allPositions: { x: number; y: number; worldAngle: number }[][] = [];
      for (const orb of orbs) {
        const breathe = 1 + Math.sin(time * 0.0012 + orb.id * 2.1) * 0.06;
        const pulse = 1 + beatPulseRef.current * 0.08;
        const dist = orb.distFromCenter * breathe * pulse;
        const points = getMirrorPoints(orb.angle, dist, cx, cy, axisRot);
        allPositions.push(points);
      }

      // 4. Connection lines (center → each orb, and triangles between mirrors)
      for (let oi = 0; oi < orbs.length; oi++) {
        const positions = allPositions[oi];
        const orb = orbs[oi];

        // Spoke line connecting orb to its mirror (passes through center)
        if (positions.length >= 2) {
          const real = positions[0];
          const mirror = positions[1];
          const sector = getSectorForAngle(real.worldAngle, axisRot);
          const spokeColor = shiftHue(KEY_CENTER_COLORS[sector], orb.hueShift);
          ctx.beginPath();
          ctx.moveTo(real.x, real.y);
          ctx.lineTo(mirror.x, mirror.y);
          ctx.strokeStyle = spokeColor;
          ctx.globalAlpha = 0.12 + orb.beatPulse * 0.15;
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.globalAlpha = 1;
      }

      // 5. Orbs — colored by which sector they're in
      for (let oi = 0; oi < orbs.length; oi++) {
        const orb = orbs[oi];
        const positions = allPositions[oi];
        const pulseScale = 1 + orb.beatPulse * 0.3;

        for (let i = 0; i < positions.length; i++) {
          const pos = positions[i];
          const isReal = i === 0;
          const r = orb.radius * (isReal ? 1 : mirrorScale) * pulseScale;

          // Color = sector this orb copy is in
          const sector = getSectorForAngle(pos.worldAngle, axisRot);
          const orbColor = shiftHue(KEY_CENTER_COLORS[sector], orb.hueShift);

          // Fill
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
          ctx.fillStyle = orbColor;
          ctx.globalAlpha = isReal ? 0.4 : 0.18;
          ctx.fill();

          // Stroke
          ctx.strokeStyle = orbColor;
          ctx.globalAlpha = isReal ? 0.85 : 0.4;
          ctx.lineWidth = isReal ? 1.5 : 1;
          ctx.stroke();

          // Note label
          if (r >= 16) {
            ctx.fillStyle = BONE;
            ctx.globalAlpha = isReal ? 0.7 : 0.25;
            ctx.font = `${Math.round(r * 0.4)}px Georgia`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(orb.note.replace(/\d/, ''), pos.x, pos.y);
          }
          ctx.globalAlpha = 1;
        }
      }

      // 6. Key center labels
      for (const key of KEYS) {
        const angle = SECTOR_ANGLES[key] + axisRot;
        const labelDist = Math.min(w, h) * 0.42;
        ctx.fillStyle = KEY_CENTER_COLORS[key];
        ctx.globalAlpha = key === activeKey ? 0.55 : 0.2;
        ctx.font = `${mobile ? 11 : 13}px "DM Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(key, cx + Math.cos(angle) * labelDist, cy + Math.sin(angle) * labelDist);
        ctx.globalAlpha = 1;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [progression, audioStarted, playSteelDrumNote]);

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
