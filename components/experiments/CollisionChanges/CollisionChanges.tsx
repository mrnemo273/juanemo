'use client';

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../../../lib/useDeviceOrientation';
import { useParticlePhysics, setOrbSizes } from './useParticlePhysics';
import { useChordProgression, PROGRESSION, getChordTone } from './useChordProgression';
import { initAudio, playDyad, playNote, playChordStrum, isAudioReady, dispose, setDecay, setReverbMix, startMetronome, setMetronomeTempo, setMetronomeTimeSignature, stopMetronome } from './audioEngine';
import { HARMONIC_COLORS, voiceLeadAssignment } from './chordData';
import type { CollisionEvent } from './types';
import styles from './CollisionChanges.module.css';

const MOBILE_BREAKPOINT = 600;
const LERP_DURATION = 500; // ms for frequency slide
const CHORD_FLASH_DURATION = 200;
const COLLISION_LINE_DURATION = 200;
const BACKGROUND = '#1F2627'; // --gunmetal

/** Unique color per note name (pitch class) */
const NOTE_COLORS: Record<string, string> = {
  C4: '#E8927C', C5: '#E8927C',  // warm coral
  D4: '#7CC4E8', D5: '#7CC4E8',  // sky blue
  E4: '#A8E87C', E5: '#A8E87C',  // spring green
  F3: '#E8D77C', F4: '#E8D77C',  // golden
  G3: '#C47CE8', G4: '#C47CE8',  // lavender
  A3: '#E87CA8', A4: '#E87CA8',  // rose
  B3: '#7CE8D4', B4: '#7CE8D4',  // mint
};

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

export default function CollisionChanges() {
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

  const initialChordIdx = useRef(0); // default chord for initial orb physics
  const [selectedChord, setSelectedChord] = useState<number | null>(null);

  const physics = useParticlePhysics();
  const progression = useChordProgression();

  // Chord change visual state
  const selectedChordRef = useRef<number | null>(null);
  const chordFlashRef = useRef(0);
  const chordNameRef = useRef(PROGRESSION[0].name);
  const chordSymbolRef = useRef(PROGRESSION[0].symbol);
  const lerpStartTimeRef = useRef(0);
  const isLerpingRef = useRef(false);

  // Collision lines for visual feedback
  const collisionLinesRef = useRef<
    { x1: number; y1: number; x2: number; y2: number; time: number }[]
  >([]);

  // Reduced motion
  const prefersReducedRef = useRef(false);

  /* --------------------------------------------------------
     Mobile detection
     -------------------------------------------------------- */
  useEffect(() => {
    setIsMobile(isMobileViewport());
    setOrbSizes(window.innerWidth);
    prefersReducedRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => setOrbSizes(window.innerWidth), 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  /* --------------------------------------------------------
     Audio init on first interaction (mouse move, click, or touch)
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
      // Reset so next user gesture can retry
      audioStartingRef.current = false;
    }
  }, [audioStarted, progression]);

  // Audio starts when user selects a chord from the dropdown (user gesture required)

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
     Initialize particles — once only
     -------------------------------------------------------- */
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    const chord = PROGRESSION[initialChordIdx.current];
    // Musically meaningful voicing:
    // 4 chord tones (root, 3rd, 5th, 7th) + 9th extension
    // + octave doublings of root and 5th for fullness
    const freqs = [...chord.frequencies];
    const notes = [...chord.notes];
    const tones = chord.notes.map((_, i) => getChordTone(i));
    // Add 9th
    if (chord.ninth) {
      freqs.push(chord.ninth.frequency);
      notes.push(chord.ninth.note);
      tones.push('9th');
    }
    // Octave doubling of root (lower) for bass weight
    freqs.push(chord.frequencies[0] / 2);
    notes.push(chord.notes[0]); // same note name, lower octave
    tones.push('root');
    // Octave doubling of 5th (higher) for shimmer
    freqs.push(chord.frequencies[2] * 2);
    notes.push(chord.notes[2]);
    tones.push('5th');
    const { w, h } = sizeRef.current;
    if (w === 0 || h === 0) {
      const t = setTimeout(() => {
        const { w: w2, h: h2 } = sizeRef.current;
        if (w2 > 0 && h2 > 0 && !initializedRef.current) {
          initializedRef.current = true;
          physics.initParticles(freqs, notes, tones, chord.harmonicFunction, w2, h2);
        }
      }, 100);
      return () => clearTimeout(t);
    }
    initializedRef.current = true;
    physics.initParticles(freqs, notes, tones, chord.harmonicFunction, w, h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [physics]);

  /* --------------------------------------------------------
     Chord progression: start timer + handle changes
     -------------------------------------------------------- */
  useEffect(() => {
    progression.onChordChange((newChord, idx, assignment) => {
      chordFlashRef.current = performance.now();
      selectedChordRef.current = idx;
      chordNameRef.current = newChord.name;
      chordSymbolRef.current = newChord.symbol;
      setSelectedChord(idx);

      // Build retune arrays based on assignment
      const particles = physics.stateRef.current.particles;
      const targetFreqs = newChord.frequencies.slice();
      const targetNotes = newChord.notes.slice();
      // Add ninth + octave doublings
      if (newChord.ninth && particles.length > 4) {
        targetFreqs.push(newChord.ninth.frequency);
        targetNotes.push(newChord.ninth.note);
      }
      while (targetFreqs.length < particles.length) {
        const base = targetFreqs[targetFreqs.length % newChord.frequencies.length];
        targetFreqs.push(base * 2);
        targetNotes.push(targetNotes[targetNotes.length % newChord.notes.length]);
      }

      const retuneFreqs = assignment.map((tIdx) => targetFreqs[tIdx]);
      const retuneNotes = assignment.map((tIdx) => targetNotes[tIdx]);
      const retuneTones = assignment.map((tIdx) => getChordTone(tIdx));

      physics.retuneParticles(
        retuneFreqs,
        retuneNotes,
        retuneTones,
        newChord.harmonicFunction,
      );

      lerpStartTimeRef.current = performance.now();
      isLerpingRef.current = true;
    });

    // No auto-advance — chords only change via the dropdown
  }, [progression, physics]);

  // Decay & reverb controls
  useEffect(() => { setDecay(controls.decay); }, [controls.decay]);
  useEffect(() => { setReverbMix(controls.reverbMix); }, [controls.reverbMix]);

  // Tempo & time signature controls
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
     Interaction: mouse + touch + gyro
     -------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      physics.gravitySourceRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      physics.gravitySourceRef.current = null;
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
        physics.gravitySourceRef.current = { x, y };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const g = gyroRef.current;
      if (g.permissionState === 'denied' || !g.isAvailable) {
        const touch = e.touches[0];
        if (!touch) return;
        const rect = canvas.getBoundingClientRect();
        physics.gravitySourceRef.current = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
    };

    const handleTouchEnd = () => {
      const g = gyroRef.current;
      if (g.permissionState === 'denied' || !g.isAvailable) {
        physics.gravitySourceRef.current = null;
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
  }, [physics, handleAudioStart]);

  /* --------------------------------------------------------
     Gyro → gravity
     -------------------------------------------------------- */
  useEffect(() => {
    if (!isMobile) return;
    const g = gyroRef.current;
    if (
      g.permissionState === 'granted' ||
      g.permissionState === 'not-required'
    ) {
      // Gyro gravity is updated in the RAF loop
    }
  }, [isMobile, gyro.permissionState]);

  /* --------------------------------------------------------
     Main RAF loop: physics step + render
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

      // Update gyro gravity
      const g = gyroRef.current;
      if (
        isMobile &&
        (g.permissionState === 'granted' ||
          g.permissionState === 'not-required')
      ) {
        // gammaNorm 0–1 → gravity X: -1 to +1
        // betaNorm 0–1 → gravity Y: -1 to +1
        physics.gyroGravityRef.current = {
          gx: (g.gammaNorm - 0.5) * 2,
          gy: (g.betaNorm - 0.5) * 2,
        };
      }

      // Update particle freqs for voice-leading
      const freqs = physics.stateRef.current.particles.map((p) => p.frequency);
      (progression.onChordChange as any).__updateFreqs?.(freqs);

      // Frequency lerp
      if (isLerpingRef.current) {
        const elapsed = time - lerpStartTimeRef.current;
        const progress = elapsed / LERP_DURATION;
        physics.updateFrequencyLerp(progress);
        if (progress >= 1) isLerpingRef.current = false;
      }

      // Physics step
      const collisions = physics.step(dt, w, h);

      // Play audio for collisions and edge bounces
      if (isAudioReady()) {
        for (const eb of physics.edgeBouncesRef.current) {
          playNote(eb.frequency, eb.velocity);
        }
        for (const col of collisions) {
          playDyad(col.freqA, col.freqB, col.velocity);
          collisionLinesRef.current.push({
            x1: physics.stateRef.current.particles.find((p) => p.id === col.idA)?.x ?? col.midX,
            y1: physics.stateRef.current.particles.find((p) => p.id === col.idA)?.y ?? col.midY,
            x2: physics.stateRef.current.particles.find((p) => p.id === col.idB)?.x ?? col.midX,
            y2: physics.stateRef.current.particles.find((p) => p.id === col.idB)?.y ?? col.midY,
            time: time,
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

      const reducedMotion = prefersReducedRef.current;
      const { particles } = physics.stateRef.current;

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

      // Draw particles
      for (const p of particles) {
        const alpha = p.fadeOut ? 0.3 : 1;

        // Spawn spring scale — quick bouncy pop-in (~250ms)
        const spawnAge = time - p.spawnTime;
        let spawnScale = 1;
        if (spawnAge < 250) {
          const t = spawnAge / 250;
          // Damped spring: starts at 0.3, overshoots to ~1.08, settles to 1.0
          spawnScale = 1 - 0.7 * Math.exp(-6 * t) * Math.cos(t * Math.PI * 2.5);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(spawnScale, spawnScale);

        // Flat fill (light) + vibrant stroke
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

        // Note label centered in orb
        const fontSize = Math.max(10, Math.round(p.radius * 0.35));
        ctx.font = `${fontSize}px "DM Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(noteColor, (0.6 + p.brightness * 0.3) * alpha);
        const displayNote = p.note.replace(/[0-9]/g, '').replace('#', '♯').replace(/(?<=^[A-G])b/, '♭');
        ctx.fillText(displayNote, 0, 0);

        ctx.restore();
      }

      // Centered chord name — large Georgia italic, very light (only after user selects)
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
  }, [physics, progression, isMobile]);

  /* --------------------------------------------------------
     Cleanup audio on unmount
     -------------------------------------------------------- */
  useEffect(() => {
    return () => {
      stopMetronome();
      dispose();
    };
  }, []);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChordPick = useCallback(async (idx: number) => {
    await handleAudioStart();
    selectedChordRef.current = idx;
    setSelectedChord(idx);
    setDropdownOpen(false);
    progression.jumpToChord(idx);
    const chord = PROGRESSION[idx];
    const freqs = [...chord.frequencies];
    if (chord.ninth) freqs.push(chord.ninth.frequency);
    playChordStrum(freqs);
  }, [progression, handleAudioStart]);

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
      <div ref={dropdownRef} className={styles.chordDropdown}>
        <button
          className={styles.chordToggle}
          onClick={() => setDropdownOpen((o) => !o)}
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

/** Convert hex color to rgba string */
function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
