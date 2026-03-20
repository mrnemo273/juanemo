'use client';

import { useEffect, useRef, useContext, useState, useCallback } from 'react';
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

/* ==================================================================
   SECTION A — Generative Drift
   ================================================================== */

function SectionDrift() {
  const controls = useContext(ExperimentControlsContext);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const chars = charsRef.current;
    if (!chars.length) return;

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const INTRO_STAGGER = 100;
    const INTRO_FADE = 400;
    const initialAxes = randomAxesForWord(LETTERS.length, isMobileViewport());
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
    const easingCss = EASINGS[controls.easing];

    chars.forEach((el, i) => {
      if (!el) return;
      el.style.transition = `font-variation-settings 600ms ${easingCss}`;
      el.style.fontVariationSettings = axisString(wordAxes[i]);
    });
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
   SECTION B — Proximity + Drift
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
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };
    section.addEventListener('mousemove', handleMouseMove);
    section.addEventListener('mouseleave', handleMouseLeave);

    // Mobile touch fallback
    const handleTouchMove = (e: TouchEvent) => {
      if (modeRef.current === 'mouse') return;
      if (modeRef.current === 'gyro') return; // gyro handles it
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

    let animFrame: number;
    const loop = () => {
      const easingCss = EASINGS[controlsRef.current.easing];

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
        const inf = Math.max(0, 1 - dist / 250);
        const target = targetAxesRef.current[i];
        if (!target) return;

        const blended: AxisValues = {
          wdth: Math.round(target.wdth + (attWdth - target.wdth) * inf),
          wght: Math.round(target.wght + (attWght - target.wght) * inf),
          opsz: Math.round(target.opsz + (attOpsz - target.opsz) * inf),
        };

        if (!prefersReduced) {
          el.style.transition = `font-variation-settings 150ms ${easingCss}, color 0.3s ease`;
        }
        el.style.fontVariationSettings = axisString(blended);
        el.style.color = inf > 0.3 ? 'var(--color-bone)' : '';
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
   SECTION C — Mouse-Responsive Axes
   ================================================================== */

function SectionMouseAxes() {
  const textRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const gyro = useDeviceOrientation();
  const gyroRef = useRef(gyro);
  gyroRef.current = gyro;
  const modeRef = useRef<InteractionMode>('mouse');

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
      const opsz = Math.round(opszMin + xProgress * (opszMax - opszMin));
      text.style.fontVariationSettings = `'wdth' ${wdth}, 'wght' ${wght}, 'opsz' ${opsz}`;
    };

    const resetAxes = () => {
      text.style.fontVariationSettings = `'wdth' ${wdthMax}, 'wght' ${wghtMax}, 'opsz' ${opszMax}`;
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

    // Mobile touch fallback
    const handleTouchMove = (e: TouchEvent) => {
      if (modeRef.current === 'mouse') return;
      if (modeRef.current === 'gyro') return;
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
      section.removeEventListener('touchmove', handleTouchMove);
      section.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} data-section="C">
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

  useEffect(() => {
    isMobile.current = isMobileViewport() && isTouchDevice();
    if (!isMobile.current) return;

    const section = sectionRef.current;
    if (!section) return;

    const TOUCH_RADIUS = 40;

    const applyTouchSweep = (touchX: number) => {
      charsRef.current.forEach((el) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const charCenterX = rect.left + rect.width / 2;
        const dist = Math.abs(touchX - charCenterX);

        if (dist < TOUCH_RADIUS) {
          el.style.fontVariationSettings = "'wdth' 25, 'wght' 100, 'opsz' 8";
          el.style.transform = 'translateY(-20px)';
          el.style.color = 'var(--color-bittersweet)';
        } else {
          el.style.fontVariationSettings = "'wdth' 151, 'wght' 900, 'opsz' 144";
          el.style.transform = '';
          el.style.color = '';
        }
      });
    };

    const resetAll = () => {
      charsRef.current.forEach((el) => {
        if (!el) return;
        el.style.fontVariationSettings = "'wdth' 151, 'wght' 900, 'opsz' 144";
        el.style.transform = '';
        el.style.color = '';
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

  // Trigger entrance animation on mount
  useEffect(() => {
    setInView(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setInView(true));
    });
  }, []);

  // Listen for replay triggered from frame hint action
  useEffect(() => {
    if (controls.replayKey === 0) return;
    if (controls.replayKey === replayKeyRef.current) return;
    replayKeyRef.current = controls.replayKey;
    setInView(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setInView(true));
    });
  }, [controls.replayKey]);

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
   SECTION F — Axis Breathing
   ================================================================== */

function SectionBreathing() {
  return (
    <section className={styles.section} data-section="F">
      <div className={styles.breatheWord}>JUANEMO</div>
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
   MAIN EXPORT — renders only the active section
   ================================================================== */

export default function GenerativeType() {
  const { activeSection } = useContext(ExperimentControlsContext);
  const ActiveComponent = SECTIONS[activeSection] ?? SECTIONS[0];
  return <ActiveComponent />;
}
