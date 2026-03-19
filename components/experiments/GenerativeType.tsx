'use client';

import { useEffect, useRef, useCallback, useContext } from 'react';
import {
  axisString,
  randomAxesForWord,
} from '../../lib/generativeAxes';
import {
  ExperimentControlsContext,
  EASINGS,
} from '../../lib/ExperimentControlsContext';
import styles from './GenerativeType.module.css';

const LETTERS = 'JUANEMO'.split('');

const STAGGER = 80; // ms — delay between each letter's start

const MOBILE_BREAKPOINT = 600;

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

export default function GenerativeType() {
  const controls = useContext(ExperimentControlsContext);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const wordRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cloneRef = useRef<HTMLDivElement | null>(null);

  // Scale the word to fill the container width AND height
  const fitWord = useCallback(() => {
    const word = wordRef.current;
    const container = containerRef.current;
    const clone = cloneRef.current;
    if (!word || !container || !clone) return;

    // Sync clone's font-variation-settings with visible chars
    const cloneChars = clone.querySelectorAll('span');
    charsRef.current.forEach((el, i) => {
      if (el && cloneChars[i]) {
        (cloneChars[i] as HTMLElement).style.fontVariationSettings =
          el.style.fontVariationSettings;
      }
    });

    // Force layout on the clone only
    void clone.offsetWidth;

    const naturalWidth = clone.scrollWidth;
    const naturalHeight = clone.getBoundingClientRect().height;

    const containerStyle = getComputedStyle(container);
    const containerWidth =
      container.clientWidth -
      parseFloat(containerStyle.paddingLeft) -
      parseFloat(containerStyle.paddingRight);
    const containerHeight =
      container.clientHeight -
      parseFloat(containerStyle.paddingTop) -
      parseFloat(containerStyle.paddingBottom);

    if (naturalWidth <= 0 || naturalHeight <= 0) return;

    const scaleX = containerWidth / naturalWidth;
    const scaleY = containerHeight / naturalHeight;

    word.style.transform = `scale(${scaleX}, ${scaleY})`;
  }, []);

  useEffect(() => {
    const chars = charsRef.current;
    const word = wordRef.current;
    const container = containerRef.current;
    if (!chars.length || !word || !container) return;

    // Check reduced motion preference
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // --- Create hidden measurement clone ---
    const clone = word.cloneNode(true) as HTMLDivElement;
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.pointerEvents = 'none';
    clone.style.transform = 'none';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.removeAttribute('role');
    clone.removeAttribute('aria-level');
    clone.removeAttribute('aria-label');
    container.appendChild(clone);
    cloneRef.current = clone;

    // Initial randomization — stagger letters in one at a time
    const INTRO_STAGGER = 100;
    const INTRO_FADE = 400;
    const cloneChars = clone.querySelectorAll('span');
    const initialAxes = randomAxesForWord(LETTERS.length, isMobileViewport());
    chars.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transition = 'none';
      el.style.fontVariationSettings = axisString(initialAxes[i]);
      if (cloneChars[i]) {
        (cloneChars[i] as HTMLElement).style.transition = 'none';
        (cloneChars[i] as HTMLElement).style.fontVariationSettings =
          axisString(initialAxes[i]);
      }
    });

    // Stagger each letter's appearance
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
        fitWord();
      }, i * INTRO_STAGGER);
      introTimers.push(introId);
    });

    requestAnimationFrame(fitWord);

    const ro = new ResizeObserver(fitWord);
    ro.observe(clone);

    window.addEventListener('resize', fitWord);

    const clearTimers = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };

    const shift = () => {
      clearTimers();
      const currentCloneChars = clone.querySelectorAll('span');
      const wordAxes = randomAxesForWord(LETTERS.length, isMobileViewport());
      const { speed, easing } = controlsRef.current;
      const easingCss = EASINGS[easing];
      // Transition duration scales with speed (speed is the base cycle time)
      const transDuration = Math.round(speed * 0.75);

      chars.forEach((el, i) => {
        if (!el) return;
        const delay = i * STAGGER;
        const duration =
          transDuration + Math.round((Math.random() - 0.5) * 400);

        const id = setTimeout(() => {
          const axes = wordAxes[i];
          if (prefersReduced) {
            el.style.transition = 'none';
          } else {
            el.style.transition = `font-variation-settings ${duration}ms ${easingCss}`;
          }
          el.style.fontVariationSettings = axisString(axes);

          if (currentCloneChars[i]) {
            (currentCloneChars[i] as HTMLElement).style.transition =
              `font-variation-settings ${duration}ms ${easingCss}`;
            (currentCloneChars[i] as HTMLElement).style.fontVariationSettings =
              axisString(axes);
          }
        }, delay);

        timersRef.current.push(id);
      });

      const totalTransTime =
        transDuration + 200 + LETTERS.length * STAGGER;
      const holdTimer = setTimeout(() => hold(), totalTransTime);
      timersRef.current.push(holdTimer);
    };

    const hold = () => {
      clearTimers();
      // Hold duration = speed * 4 (same ratio as prototype)
      const holdDuration = controlsRef.current.speed * 4;
      const shiftTimer = setTimeout(() => shift(), holdDuration);
      timersRef.current.push(shiftTimer);
    };

    // Start the hold cycle after the intro stagger completes
    const introTotal = LETTERS.length * INTRO_STAGGER + INTRO_FADE;
    const introHoldTimer = setTimeout(() => hold(), introTotal);

    return () => {
      clearTimeout(introHoldTimer);
      introTimers.forEach(clearTimeout);
      clearTimers();
      ro.disconnect();
      window.removeEventListener('resize', fitWord);
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
      cloneRef.current = null;
    };
  }, [fitWord]);

  // React to shuffle
  useEffect(() => {
    if (controls.shuffleKey === 0) return; // skip initial
    const chars = charsRef.current;
    const clone = cloneRef.current;
    if (!chars.length) return;

    const wordAxes = randomAxesForWord(LETTERS.length, isMobileViewport());
    const easingCss = EASINGS[controls.easing];
    const cloneChars = clone?.querySelectorAll('span');

    chars.forEach((el, i) => {
      if (!el) return;
      const axes = wordAxes[i];
      el.style.transition = `font-variation-settings 600ms ${easingCss}`;
      el.style.fontVariationSettings = axisString(axes);
      if (cloneChars?.[i]) {
        (cloneChars[i] as HTMLElement).style.transition =
          `font-variation-settings 600ms ${easingCss}`;
        (cloneChars[i] as HTMLElement).style.fontVariationSettings =
          axisString(axes);
      }
    });
  }, [controls.shuffleKey, controls.easing]);

  return (
    <div ref={containerRef} className={styles.container}>
      <div
        ref={wordRef}
        className={styles.word}
        role="heading"
        aria-level={1}
        aria-label="Juanemo"
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            ref={(el) => {
              charsRef.current[i] = el;
            }}
            className={styles.char}
            suppressHydrationWarning
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  );
}
