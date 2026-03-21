'use client';

import { useEffect, useRef, useContext, useState, useCallback, useMemo } from 'react';
import {
  axisString,
  randomAxes,
  randomAxesForWord,
  AXIS_RANGES_MOBILE,
  type AxisValues,
} from '../../lib/generativeAxes';
import {
  ExperimentControlsContext,
  EASINGS,
} from '../../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../../lib/useDeviceOrientation';
import * as Tone from 'tone';
import {
  initTypographyAudio,
  updateLetterVoice,
  setVoiceBoost,
  setMasterVolume,
  setWaveform,
  setNoiseGain,
  dispose as disposeAudio,
  isReady as isAudioReady,
} from '../../lib/typographyAudio';
import styles from './GenerativeType.module.css';

const LETTERS = 'JUANEMO'.split('');
const STAGGER = 80;
const MOBILE_BREAKPOINT = 600;

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

/** Detect touch capability */
function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
}

/** Interaction mode — determined once on mount, doesn't change mid-session */
type InteractionMode = 'mouse' | 'touch' | 'gyro';

/* ----------------------------------------------------------
   Module-level audio state — readable by all sections
   without causing re-renders
   ---------------------------------------------------------- */
const audioState = { initialized: false, enabled: false };

/* ----------------------------------------------------------
   Helpers
   ---------------------------------------------------------- */

function hapticTick(ms: number = 15): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    navigator.vibrate(ms);
  }
}

/** Parse inline font-variation-settings string back to AxisValues */
function parseAxesFromStyle(fvs: string): AxisValues {
  const defaults: AxisValues = { wght: 600, wdth: 88, opsz: 76 };
  if (!fvs) return defaults;
  const wghtMatch = fvs.match(/'wght'\s+([\d.]+)/);
  const wdthMatch = fvs.match(/'wdth'\s+([\d.]+)/);
  const opszMatch = fvs.match(/'opsz'\s+([\d.]+)/);
  return {
    wght: wghtMatch ? parseFloat(wghtMatch[1]) : defaults.wght,
    wdth: wdthMatch ? parseFloat(wdthMatch[1]) : defaults.wdth,
    opsz: opszMatch ? parseFloat(opszMatch[1]) : defaults.opsz,
  };
}

/* ==================================================================
   SECTION A — Generative Drift
   ================================================================== */

function SectionDrift() {
  const controls = useContext(ExperimentControlsContext);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const currentAxesRef = useRef<AxisValues[]>([]);

  // Shake-to-shuffle
  const localShuffleRef = useRef(0);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let lastShakeTime = 0;
    let shakeCount = 0;
    let shakeWindow = 0;
    const THRESHOLD = 15;
    const COOLDOWN = 1000;
    const WINDOW = 500;

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;
      const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      if (Math.abs(magnitude - 9.8) > THRESHOLD) {
        const now = Date.now();
        if (now - shakeWindow > WINDOW) { shakeCount = 0; shakeWindow = now; }
        shakeCount++;
        if (shakeCount >= 2 && now - lastShakeTime > COOLDOWN) {
          lastShakeTime = now;
          // Trigger shuffle inline
          const chars = charsRef.current;
          if (!chars.length) return;
          const wordAxes = randomAxesForWord(LETTERS.length, isMobileViewport());
          currentAxesRef.current = wordAxes;
          const easingCss = EASINGS[controlsRef.current.easing];
          chars.forEach((el, i) => {
            if (!el) return;
            el.style.transition = `font-variation-settings 600ms ${easingCss}`;
            el.style.fontVariationSettings = axisString(wordAxes[i]);
          });
          if (audioState.enabled) {
            wordAxes.forEach((axes, i) => updateLetterVoice(i, axes));
          }
          hapticTick(25);
        }
      }
    };
    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, []);

  useEffect(() => {
    const chars = charsRef.current;
    if (!chars.length) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const INTRO_STAGGER = 100;
    const INTRO_FADE = 400;
    const initialAxes = randomAxesForWord(LETTERS.length, isMobileViewport());
    currentAxesRef.current = initialAxes;
    chars.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transition = 'none';
      el.style.fontVariationSettings = axisString(initialAxes[i]);
    });

    const introTimers: ReturnType<typeof setTimeout>[] = [];
    chars.forEach((el, i) => {
      if (!el) return;
      const introId = setTimeout(() => {
        if (prefersReduced) {
          el.style.transition = 'none';
          el.style.opacity = '1';
        } else {
          el.style.transition = `opacity ${INTRO_FADE}ms ease-out`;
          el.style.opacity = '1';
        }
      }, i * INTRO_STAGGER);
      introTimers.push(introId);
    });

    const clearTimers = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };

    const shift = () => {
      clearTimers();
      const wordAxes = randomAxesForWord(LETTERS.length, isMobileViewport());
      currentAxesRef.current = wordAxes;
      const { speed, easing } = controlsRef.current;
      const easingCss = EASINGS[easing];
      const transDuration = Math.round(speed * 0.75);

      chars.forEach((el, i) => {
        if (!el) return;
        const delay = i * STAGGER;
        const duration = transDuration + Math.round((Math.random() - 0.5) * 400);

        const id = setTimeout(() => {
          const axes = wordAxes[i];
          if (prefersReduced) {
            el.style.transition = 'none';
          } else {
            el.style.transition = `font-variation-settings ${duration}ms ${easingCss}`;
          }
          el.style.fontVariationSettings = axisString(axes);

          // Audio: update voice as each letter shifts
          if (audioState.enabled) {
            updateLetterVoice(i, axes);
          }

          // Haptic: tick as each letter begins its shift
          hapticTick(15);
        }, delay);

        timersRef.current.push(id);
      });

      const totalTransTime = transDuration + 200 + LETTERS.length * STAGGER;
      const holdTimer = setTimeout(() => hold(), totalTransTime);
      timersRef.current.push(holdTimer);
    };

    const hold = () => {
      clearTimers();
      const holdDuration = controlsRef.current.speed * 4;
      const shiftTimer = setTimeout(() => shift(), holdDuration);
      timersRef.current.push(shiftTimer);
    };

    // Init audio voices with initial axes
    if (audioState.enabled) {
      initialAxes.forEach((axes, i) => updateLetterVoice(i, axes));
    }

    const introTotal = LETTERS.length * INTRO_STAGGER + INTRO_FADE;
    const introHoldTimer = setTimeout(() => hold(), introTotal);

    return () => {
      clearTimeout(introHoldTimer);
      introTimers.forEach(clearTimeout);
      clearTimers();
    };
  }, []);

  // Shuffle
  useEffect(() => {
    if (controls.shuffleKey === 0) return;
    const chars = charsRef.current;
    if (!chars.length) return;

    const wordAxes = randomAxesForWord(LETTERS.length, isMobileViewport());
    currentAxesRef.current = wordAxes;
    const easingCss = EASINGS[controls.easing];

    chars.forEach((el, i) => {
      if (!el) return;
      el.style.transition = `font-variation-settings 600ms ${easingCss}`;
      el.style.fontVariationSettings = axisString(wordAxes[i]);
    });

    if (audioState.enabled) {
      wordAxes.forEach((axes, i) => updateLetterVoice(i, axes));
    }
  }, [controls.shuffleKey, controls.easing]);

  return (
    <section className={styles.section} data-section="A">
      <div
        className={styles.driftWord}
        role="heading"
        aria-level={1}
        aria-label="Juanemo"
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            ref={(el) => { charsRef.current[i] = el; }}
            className={styles.driftChar}
            suppressHydrationWarning
          >
            {letter}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ==================================================================
   SECTION B — Proximity + Drift + Stillness Reward
   ================================================================== */

function SectionProximity() {
  const controls = useContext(ExperimentControlsContext);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;
  const gyro = useDeviceOrientation();
  const gyroRef = useRef(gyro);
  gyroRef.current = gyro;

  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const targetAxesRef = useRef<AxisValues[]>([]);
  const modeRef = useRef<InteractionMode>('mouse');
  const proxBoostedRef = useRef<boolean[]>(new Array(LETTERS.length).fill(false));

  // Stillness state
  const isStillRef = useRef(false);
  const stillnessFadeRef = useRef(1); // 1 = fully active, 0 = fully still
  const lastMouseMoveRef = useRef(Date.now());

  useEffect(() => {
    const mobile = isMobileViewport() && isTouchDevice();
    modeRef.current = mobile ? 'touch' : 'mouse';
  }, []);

  // Upgrade to gyro mode when permission is granted
  useEffect(() => {
    if (gyro.permissionState === 'granted' || gyro.permissionState === 'not-required') {
      if (isMobileViewport() && isTouchDevice() && gyro.isAvailable) {
        modeRef.current = 'gyro';
      }
    }
  }, [gyro.permissionState, gyro.isAvailable]);

  // Stillness detection via DeviceMotion (mobile) or mouse idle (desktop)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const accelHistory: number[] = [];
    const STILLNESS_THRESHOLD = 0.3;
    const STILLNESS_DURATION = 3000;
    const STILLNESS_SAMPLES = 60;
    let stillnessStart: number | null = null;

    const motionHandler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;
      const magnitude = Math.abs(Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2) - 9.8);
      accelHistory.push(magnitude);
      if (accelHistory.length > STILLNESS_SAMPLES) accelHistory.shift();
      const avg = accelHistory.reduce((a, b) => a + b, 0) / accelHistory.length;

      if (avg < STILLNESS_THRESHOLD) {
        if (!stillnessStart) stillnessStart = Date.now();
        if (Date.now() - stillnessStart > STILLNESS_DURATION) {
          isStillRef.current = true;
        }
      } else {
        stillnessStart = null;
        isStillRef.current = false;
      }
    };
    window.addEventListener('devicemotion', motionHandler);

    // Desktop: mouse idle detection
    let idleInterval: ReturnType<typeof setInterval> | undefined;
    if (!isTouchDevice()) {
      idleInterval = setInterval(() => {
        const idle = Date.now() - lastMouseMoveRef.current > 5000;
        isStillRef.current = idle;
      }, 500);
    }

    return () => {
      window.removeEventListener('devicemotion', motionHandler);
      if (idleInterval) clearInterval(idleInterval);
    };
  }, []);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const section = sectionRef.current;
    if (!section) return;

    const initialAxes = randomAxesForWord(LETTERS.length, isMobileViewport());
    targetAxesRef.current = initialAxes;
    charsRef.current.forEach((el, i) => {
      if (el) el.style.fontVariationSettings = axisString(initialAxes[i]);
    });

    // Desktop: mouse events
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      lastMouseMoveRef.current = Date.now();
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    section.addEventListener('mousemove', handleMouseMove);
    section.addEventListener('mouseleave', handleMouseLeave);

    // Mobile touch fallback
    const handleTouchMove = (e: TouchEvent) => {
      if (modeRef.current === 'mouse') return;
      if (modeRef.current === 'gyro') return;
      const touch = e.touches[0];
      if (touch) mouseRef.current = { x: touch.clientX, y: touch.clientY };
    };
    const handleTouchEnd = () => {
      if (modeRef.current === 'mouse') return;
      mouseRef.current = { x: -1000, y: -1000 };
    };
    section.addEventListener('touchmove', handleTouchMove, { passive: true });
    section.addEventListener('touchend', handleTouchEnd);

    // Drift loop
    LETTERS.forEach((_, i) => {
      (function tick() {
        targetAxesRef.current[i] = randomAxes();
        const t = setTimeout(
          tick,
          controlsRef.current.speed + Math.round(Math.random() * 1000)
        );
        timersRef.current.push(t);
      })();
    });

    // Midpoint axes for stillness convergence
    const midAxes: AxisValues = { wght: 600, wdth: 88, opsz: 76 };

    let animFrame: number;
    const loop = () => {
      const easingCss = EASINGS[controlsRef.current.easing];

      // Stillness fade: lerp toward 0 when still, toward 1 when moving
      const targetFade = isStillRef.current ? 0 : 1;
      stillnessFadeRef.current += (targetFade - stillnessFadeRef.current) * 0.02;
      const fade = stillnessFadeRef.current;

      // Determine position source
      let mx: number, my: number;
      if (modeRef.current === 'gyro') {
        const g = gyroRef.current;
        mx = g.gammaNorm * window.innerWidth;
        my = g.betaNorm * window.innerHeight;
      } else {
        mx = mouseRef.current.x;
        my = mouseRef.current.y;
      }

      const mobile = isMobileViewport();
      const attWdth = mobile ? AXIS_RANGES_MOBILE.wdth.max : 151;
      const attWght = mobile ? AXIS_RANGES_MOBILE.wght.max : 900;
      const attOpsz = mobile ? AXIS_RANGES_MOBILE.opsz.max : 144;

      charsRef.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const dist = Math.sqrt(
          (mx - r.left - r.width / 2) ** 2 + (my - r.top - r.height / 2) ** 2
        );
        const inf = Math.max(0, 1 - dist / 250) * fade; // proximity fades with stillness
        const target = targetAxesRef.current[i];
        if (!target) return;

        // Blend target with midpoint based on stillness
        const driftTarget: AxisValues = {
          wdth: Math.round(target.wdth * fade + midAxes.wdth * (1 - fade)),
          wght: Math.round(target.wght * fade + midAxes.wght * (1 - fade)),
          opsz: Math.round(target.opsz * fade + midAxes.opsz * (1 - fade)),
        };

        const blended: AxisValues = {
          wdth: Math.round(driftTarget.wdth + (attWdth - driftTarget.wdth) * inf),
          wght: Math.round(driftTarget.wght + (attWght - driftTarget.wght) * inf),
          opsz: Math.round(driftTarget.opsz + (attOpsz - driftTarget.opsz) * inf),
        };

        if (!prefersReduced) {
          el.style.transition = `font-variation-settings 150ms ${easingCss}, color 0.3s ease`;
        }
        el.style.fontVariationSettings = axisString(blended);
        el.style.color = inf > 0.3 ? 'var(--color-bone)' : '';

        // Audio: update voice + proximity boost
        if (audioState.enabled) {
          updateLetterVoice(i, blended);
          const inRadius = dist < 250;
          if (inRadius !== proxBoostedRef.current[i]) {
            proxBoostedRef.current[i] = inRadius;
            setVoiceBoost(i, inRadius);
            // Haptic on proximity enter
            if (inRadius) hapticTick(20);
          }
        }
      });

      animFrame = requestAnimationFrame(loop);
    };
    animFrame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrame);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
      section.removeEventListener('mousemove', handleMouseMove);
      section.removeEventListener('mouseleave', handleMouseLeave);
      section.removeEventListener('touchmove', handleTouchMove);
      section.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    if (controls.shuffleKey === 0) return;
    const wordAxes = randomAxesForWord(LETTERS.length, isMobileViewport());
    targetAxesRef.current = wordAxes;
    const easingCss = EASINGS[controls.easing];
    charsRef.current.forEach((el, i) => {
      if (!el) return;
      el.style.transition = `font-variation-settings 600ms ${easingCss}`;
      el.style.fontVariationSettings = axisString(wordAxes[i]);
    });
  }, [controls.shuffleKey, controls.easing]);

  return (
    <section ref={sectionRef} className={styles.section} data-section="B">
      <div className={styles.proxWord}>
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            ref={(el) => { charsRef.current[i] = el; }}
            className={styles.proxChar}
            suppressHydrationWarning
          >
            {letter}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ==================================================================
   SECTION C — Mouse-Responsive Axes + Pinch-to-Optical-Size
   ================================================================== */

function SectionMouseAxes() {
  const textRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const gyro = useDeviceOrientation();
  const gyroRef = useRef(gyro);
  gyroRef.current = gyro;
  const modeRef = useRef<InteractionMode>('mouse');

  // Pinch state
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistRef = useRef<number | null>(null);
  const opszRef = useRef(76);

  // Current axes for audio
  const currentAxesRef = useRef<AxisValues>({ wght: 900, wdth: 151, opsz: 144 });

  useEffect(() => {
    const mobile = isMobileViewport() && isTouchDevice();
    modeRef.current = mobile ? 'touch' : 'mouse';
  }, []);

  // Upgrade to gyro mode when permission is granted
  useEffect(() => {
    if (gyro.permissionState === 'granted' || gyro.permissionState === 'not-required') {
      if (isMobileViewport() && isTouchDevice() && gyro.isAvailable) {
        modeRef.current = 'gyro';
      }
    }
  }, [gyro.permissionState, gyro.isAvailable]);

  useEffect(() => {
    const section = sectionRef.current;
    const text = textRef.current;
    if (!section || !text) return;

    const mobile = isMobileViewport();

    // Axis ranges
    const wdthMin = 25;
    const wdthMax = mobile ? AXIS_RANGES_MOBILE.wdth.max : 151;
    const wghtMin = 100;
    const wghtMax = mobile ? AXIS_RANGES_MOBILE.wght.max : 900;
    const opszMin = 8;
    const opszMax = mobile ? AXIS_RANGES_MOBILE.opsz.max : 144;

    const applyAxes = (xProgress: number, yProgress: number) => {
      const wdth = Math.round(wdthMin + xProgress * (wdthMax - wdthMin));
      const wght = Math.round(wghtMin + (1 - yProgress) * (wghtMax - wghtMin));
      const opsz = Math.round(Math.max(opszMin, Math.min(opszMax, opszRef.current)));
      text.style.fontVariationSettings = `'wdth' ${wdth}, 'wght' ${wght}, 'opsz' ${opsz}`;

      // Audio: all voices move in unison
      const axes = { wght, wdth, opsz };
      currentAxesRef.current = axes;
      if (audioState.enabled) {
        for (let i = 0; i < LETTERS.length; i++) {
          updateLetterVoice(i, axes);
        }
      }
    };

    const resetAxes = () => {
      text.style.fontVariationSettings = `'wdth' ${wdthMax}, 'wght' ${wghtMax}, 'opsz' ${opszMax}`;
      const axes = { wght: wghtMax, wdth: wdthMax, opsz: opszMax };
      currentAxesRef.current = axes;
      if (audioState.enabled) {
        for (let i = 0; i < LETTERS.length; i++) {
          updateLetterVoice(i, axes);
        }
      }
    };

    // Desktop: mouse events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      const xProgress = (e.clientX - rect.left) / rect.width;
      const yProgress = (e.clientY - rect.top) / rect.height;
      applyAxes(xProgress, yProgress);
    };
    const handleMouseLeave = () => resetAxes();

    section.addEventListener('mousemove', handleMouseMove);
    section.addEventListener('mouseleave', handleMouseLeave);

    // Desktop: scroll wheel → optical size
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      opszRef.current = Math.max(opszMin, Math.min(opszMax, opszRef.current - e.deltaY * 0.2));
      // Re-apply with current text position
      const fvs = text.style.fontVariationSettings;
      const axes = parseAxesFromStyle(fvs);
      text.style.fontVariationSettings = `'wdth' ${axes.wdth}, 'wght' ${axes.wght}, 'opsz' ${Math.round(opszRef.current)}`;
    };
    section.addEventListener('wheel', handleWheel, { passive: false });

    // Mobile: pointer events for pinch
    const handlePointerDown = (e: PointerEvent) => {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const handlePointerMove = (e: PointerEvent) => {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointersRef.current.size >= 2) {
        const pts = Array.from(pointersRef.current.values());
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        if (lastPinchDistRef.current !== null) {
          const delta = dist - lastPinchDistRef.current;
          opszRef.current = Math.max(opszMin, Math.min(opszMax, opszRef.current + delta * 0.5));
        }
        lastPinchDistRef.current = dist;
      }
    };
    const handlePointerUp = (e: PointerEvent) => {
      pointersRef.current.delete(e.pointerId);
      if (pointersRef.current.size < 2) lastPinchDistRef.current = null;
    };
    section.addEventListener('pointerdown', handlePointerDown);
    section.addEventListener('pointermove', handlePointerMove);
    section.addEventListener('pointerup', handlePointerUp);
    section.addEventListener('pointercancel', handlePointerUp);

    // Mobile touch fallback (single finger)
    const handleTouchMove = (e: TouchEvent) => {
      if (modeRef.current === 'mouse') return;
      if (modeRef.current === 'gyro') return;
      if (e.touches.length > 1) return; // pinch handled by pointer events
      const touch = e.touches[0];
      if (!touch) return;
      const rect = section.getBoundingClientRect();
      const xProgress = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      const yProgress = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
      applyAxes(xProgress, yProgress);
    };
    const handleTouchEnd = () => {
      if (modeRef.current === 'mouse') return;
      resetAxes();
    };

    section.addEventListener('touchmove', handleTouchMove, { passive: true });
    section.addEventListener('touchend', handleTouchEnd);

    // Gyro RAF loop (only active on mobile with gyro)
    let animFrame: number;
    const gyroLoop = () => {
      if (modeRef.current === 'gyro') {
        const g = gyroRef.current;
        applyAxes(g.gammaNorm, g.betaNorm);
      }
      animFrame = requestAnimationFrame(gyroLoop);
    };
    if (mobile) {
      animFrame = requestAnimationFrame(gyroLoop);
    }

    return () => {
      cancelAnimationFrame(animFrame);
      section.removeEventListener('mousemove', handleMouseMove);
      section.removeEventListener('mouseleave', handleMouseLeave);
      section.removeEventListener('wheel', handleWheel);
      section.removeEventListener('pointerdown', handlePointerDown);
      section.removeEventListener('pointermove', handlePointerMove);
      section.removeEventListener('pointerup', handlePointerUp);
      section.removeEventListener('pointercancel', handlePointerUp);
      section.removeEventListener('touchmove', handleTouchMove);
      section.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <section ref={sectionRef} className={`${styles.section} ${styles.sectionPinch}`} data-section="C">
      <div ref={textRef} className={styles.mouseWord}>JUANEMO</div>
    </section>
  );
}

/* ==================================================================
   SECTION D — Per-Character Hover (Touch Sweep on Mobile)
   ================================================================== */

function SectionPerCharHover() {
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useRef(false);
  const prevTouchedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    isMobile.current = isMobileViewport() && isTouchDevice();
    if (!isMobile.current) return;

    const section = sectionRef.current;
    if (!section) return;

    const TOUCH_RADIUS = 40;

    const applyTouchSweep = (touchX: number) => {
      const newTouched = new Set<number>();
      charsRef.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const charCenterX = rect.left + rect.width / 2;
        const dist = Math.abs(touchX - charCenterX);

        if (dist < TOUCH_RADIUS) {
          newTouched.add(i);
          el.style.fontVariationSettings = "'wdth' 25, 'wght' 100, 'opsz' 8";
          el.style.transform = 'translateY(-20px)';
          el.style.color = 'var(--color-bittersweet)';

          // Haptic: tick when new letter enters touch radius
          if (!prevTouchedRef.current.has(i)) {
            hapticTick(10);
          }

          // Audio: collapsed voice + boost
          if (audioState.enabled) {
            updateLetterVoice(i, { wght: 900, wdth: 25, opsz: 8 });
            setVoiceBoost(i, true);
          }
        } else {
          el.style.fontVariationSettings = "'wdth' 151, 'wght' 900, 'opsz' 144";
          el.style.transform = '';
          el.style.color = '';

          // Audio: restore voice + remove boost
          if (audioState.enabled) {
            updateLetterVoice(i, { wght: 900, wdth: 151, opsz: 144 });
            setVoiceBoost(i, false);
          }
        }
      });
      prevTouchedRef.current = newTouched;
    };

    const resetAll = () => {
      prevTouchedRef.current.clear();
      charsRef.current.forEach((el, i) => {
        if (!el) return;
        el.style.fontVariationSettings = "'wdth' 151, 'wght' 900, 'opsz' 144";
        el.style.transform = '';
        el.style.color = '';
        if (audioState.enabled) {
          updateLetterVoice(i, { wght: 900, wdth: 151, opsz: 144 });
        }
      });
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) applyTouchSweep(touch.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) applyTouchSweep(touch.clientX);
    };
    const handleTouchEnd = () => resetAll();

    section.addEventListener('touchstart', handleTouchStart, { passive: true });
    section.addEventListener('touchmove', handleTouchMove, { passive: true });
    section.addEventListener('touchend', handleTouchEnd);

    return () => {
      section.removeEventListener('touchstart', handleTouchStart);
      section.removeEventListener('touchmove', handleTouchMove);
      section.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Desktop: CSS :hover handles visual. Wire audio for hover via mouseenter/mouseleave on spans.
  useEffect(() => {
    if (isMobileViewport() && isTouchDevice()) return;
    const chars = charsRef.current;

    const enterHandlers: (() => void)[] = [];
    const leaveHandlers: (() => void)[] = [];

    chars.forEach((el, i) => {
      if (!el) return;
      const onEnter = () => {
        if (audioState.enabled) {
          updateLetterVoice(i, { wght: 100, wdth: 25, opsz: 8 });
          setVoiceBoost(i, true);
        }
      };
      const onLeave = () => {
        if (audioState.enabled) {
          updateLetterVoice(i, { wght: 900, wdth: 151, opsz: 144 });
          setVoiceBoost(i, false);
        }
      };
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      enterHandlers.push(onEnter);
      leaveHandlers.push(onLeave);
    });

    return () => {
      chars.forEach((el, i) => {
        if (!el) return;
        el.removeEventListener('mouseenter', enterHandlers[i]);
        el.removeEventListener('mouseleave', leaveHandlers[i]);
      });
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} data-section="D">
      <div className={styles.hoverWord}>
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            ref={(el) => { charsRef.current[i] = el; }}
            className={styles.hoverChar}
            style={{ transitionDelay: `${i * 30}ms` }}
          >
            {letter}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ==================================================================
   SECTION E — Expand Entrance
   ================================================================== */

function SectionExpandEntrance() {
  const controls = useContext(ExperimentControlsContext);
  const [inView, setInView] = useState(true);
  const replayKeyRef = useRef(controls.replayKey);

  const triggerEntrance = useCallback(() => {
    setInView(false);

    // Audio: start voices at collapsed
    if (audioState.enabled) {
      for (let i = 0; i < LETTERS.length; i++) {
        updateLetterVoice(i, { wght: 300, wdth: 25, opsz: 8 });
      }
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setInView(true);

        // Audio: bloom voices over 1.8s with per-letter stagger
        if (audioState.enabled) {
          LETTERS.forEach((_, i) => {
            setTimeout(() => {
              updateLetterVoice(i, { wght: 900, wdth: 151, opsz: 144 });
            }, i * STAGGER);
          });
        }
      });
    });
  }, []);

  // Trigger entrance animation on mount
  useEffect(() => {
    triggerEntrance();
  }, [triggerEntrance]);

  // Listen for replay triggered from frame hint action
  useEffect(() => {
    if (controls.replayKey === 0) return;
    if (controls.replayKey === replayKeyRef.current) return;
    replayKeyRef.current = controls.replayKey;
    triggerEntrance();
  }, [controls.replayKey, triggerEntrance]);

  // Shake-to-replay
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let lastShakeTime = 0;
    let shakeCount = 0;
    let shakeWindow = 0;
    const THRESHOLD = 15;
    const COOLDOWN = 1000;
    const WINDOW = 500;

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;
      const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      if (Math.abs(magnitude - 9.8) > THRESHOLD) {
        const now = Date.now();
        if (now - shakeWindow > WINDOW) { shakeCount = 0; shakeWindow = now; }
        shakeCount++;
        if (shakeCount >= 2 && now - lastShakeTime > COOLDOWN) {
          lastShakeTime = now;
          triggerEntrance();
          hapticTick(25);
        }
      }
    };
    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, [triggerEntrance]);

  return (
    <section className={styles.section} data-section="E">
      <div
        className={`${styles.entranceWord}${inView ? ` ${styles.entranceWordVisible}` : ''}`}
      >
        JUANEMO
      </div>
    </section>
  );
}

/* ==================================================================
   SECTION F — Axis Breathing + Speed Control + Audio Sync
   ================================================================== */

function SectionBreathing() {
  const controls = useContext(ExperimentControlsContext);
  const containerRef = useRef<HTMLDivElement>(null);

  // Map speed (ms, default 2000) to animation duration
  // Speed 2000ms ≈ mid → 4s; we map the range heuristically
  // speed context is in ms: 500 (fast) to 4000 (slow)
  // Speed 500 → 1.5s, Speed 2000 → 4s, Speed 4000 → 8s
  const duration = useMemo(() => {
    const s = controls.speed;
    // Linear map: 500→1.5, 4000→8
    return 1.5 + ((s - 500) / 3500) * 6.5;
  }, [controls.speed]);

  // Set CSS custom property for breathe duration
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--breathe-duration', `${duration}s`);
    }
  }, [duration]);

  // Audio: sync voices to breathing cycle + noise layer
  useEffect(() => {
    if (!audioState.enabled) return;
    let raf: number;
    const startTime = performance.now();

    const loop = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const progress = (elapsed % duration) / duration;
      // Cosine curve: 1 at 0%, 0 at 50%, 1 at 100%
      const breathT = (1 + Math.cos(progress * 2 * Math.PI)) / 2;

      const axes = {
        wght: 300 + breathT * 600,
        wdth: 100 + breathT * 51,
        opsz: 80 + breathT * 64,
      };

      // All voices in unison
      for (let i = 0; i < LETTERS.length; i++) {
        updateLetterVoice(i, axes);
      }

      // Noise layer: swell on inhale (breathT high), fade on exhale
      setNoiseGain(breathT * 0.015);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return (
    <section className={styles.section} data-section="F">
      <div ref={containerRef} className={styles.breatheWord}>JUANEMO</div>
    </section>
  );
}

/* ==================================================================
   SECTION REGISTRY — maps index to component
   ================================================================== */

const SECTIONS = [
  SectionDrift,
  SectionProximity,
  SectionMouseAxes,
  SectionPerCharHover,
  SectionExpandEntrance,
  SectionBreathing,
];

/* ==================================================================
   MAIN EXPORT — renders only the active section + sound toggle + wake lock
   ================================================================== */

export default function GenerativeType() {
  const controls = useContext(ExperimentControlsContext);
  const { activeSection, soundEnabled } = controls;
  const ActiveComponent = SECTIONS[activeSection] ?? SECTIONS[0];

  const [audioInitialized, setAudioInitialized] = useState(false);
  const prevSectionRef = useRef(activeSection);
  // React to sound toggle from ExperimentFrame
  useEffect(() => {
    audioState.enabled = soundEnabled;
    if (!soundEnabled) {
      setMasterVolume(-Infinity);
      return;
    }
    if (audioInitialized) {
      setMasterVolume(-12);
      return;
    }
    // Sound enabled but not yet initialized — wait for AudioContext to be running
    const ctx = Tone.getContext().rawContext;
    if (!ctx) return;
    const tryInit = async () => {
      if (ctx.state !== 'running' || audioState.initialized) return;
      try {
        await initTypographyAudio(LETTERS.length);
        setAudioInitialized(true);
        audioState.initialized = true;
        audioState.enabled = true;
        setMasterVolume(-12);
      } catch { /* will retry on next statechange */ }
    };
    tryInit();
    ctx.addEventListener('statechange', tryInit);
    return () => ctx.removeEventListener('statechange', tryInit);
  }, [soundEnabled, audioInitialized]);

  // Section change: crossfade audio
  useEffect(() => {
    if (activeSection !== prevSectionRef.current) {
      prevSectionRef.current = activeSection;
      if (audioState.enabled) {
        setMasterVolume(-24);
        setTimeout(() => {
          if (audioState.enabled) setMasterVolume(-12);
        }, 300);
      }
    }
  }, [activeSection]);

  // Dispose audio on unmount — immediate to prevent overlap with other experiments
  useEffect(() => {
    return () => {
      if (audioState.initialized) {
        setMasterVolume(-Infinity);
        disposeAudio();
      }
      audioState.initialized = false;
      audioState.enabled = false;
    };
  }, []);

  // Screen Wake Lock
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Not supported or failed — silent fallback
      }
    };
    request();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      wakeLock?.release();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Ambient-reactive: switch waveform based on color scheme
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (dark: boolean) => {
      if (audioState.initialized) {
        setWaveform(dark ? 'triangle' : 'sine');
      }
    };
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [audioInitialized]);

  return <ActiveComponent />;
}
