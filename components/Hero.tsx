'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  axisString,
  randomAxesForWord,
} from '../lib/generativeAxes';
import styles from './Hero.module.css';

const LETTERS = 'JUANEMO'.split('');

// --- Timing constants (easy to tune) ---
const HOLD_DURATION = 8000;  // ms — how long the wordmark sits still
const TRANS_DURATION = 1500; // ms — base transition duration per letter
const STAGGER = 80;          // ms — delay between each letter's start

// Spring easing with overshoot — non-negotiable
const SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

const MOBILE_BREAKPOINT = 600;

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

export default function Hero() {
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const wordRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const cloneRef = useRef<HTMLDivElement | null>(null);

  // Scale the word to fill the container width AND height
  const fitWord = useCallback(() => {
    const word = wordRef.current;
    const hero = heroRef.current;
    const clone = cloneRef.current;
    if (!word || !hero || !clone) return;

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

    const heroStyle = getComputedStyle(hero);
    const containerWidth =
      hero.clientWidth -
      parseFloat(heroStyle.paddingLeft) -
      parseFloat(heroStyle.paddingRight);
    const containerHeight =
      hero.clientHeight -
      parseFloat(heroStyle.paddingTop) -
      parseFloat(heroStyle.paddingBottom);

    if (naturalWidth <= 0 || naturalHeight <= 0) return;

    const scaleX = containerWidth / naturalWidth;
    const scaleY = containerHeight / naturalHeight;

    word.style.transform = `scale(${scaleX}, ${scaleY})`;
  }, []);

  useEffect(() => {
    const chars = charsRef.current;
    const word = wordRef.current;
    const hero = heroRef.current;
    if (!chars.length || !word || !hero) return;

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
    hero.appendChild(clone);
    cloneRef.current = clone;

    // Initial randomization — stagger letters in one at a time
    const INTRO_STAGGER = 100; // ms between each letter appearing
    const INTRO_FADE = 400;    // ms fade-in duration per letter
    const cloneChars = clone.querySelectorAll('span');
    const initialAxes = randomAxesForWord(LETTERS.length, isMobileViewport());
    chars.forEach((el, i) => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.transition = 'none';
      el.style.fontVariationSettings = axisString(initialAxes[i]);
      // Sync clone
      if (cloneChars[i]) {
        (cloneChars[i] as HTMLElement).style.transition = 'none';
        (cloneChars[i] as HTMLElement).style.fontVariationSettings =
          axisString(initialAxes[i]);
      }
    });

    // Stagger each letter's appearance (separate from cycle timers)
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

    // Initial fit (for clone measurement even before letters fade in)
    requestAnimationFrame(fitWord);

    // ResizeObserver on the hidden clone — fires as font-variation-settings
    // transitions cause glyph size changes, without any visible flash
    const ro = new ResizeObserver(fitWord);
    ro.observe(clone);

    // Refit on window resize
    window.addEventListener('resize', fitWord);

    const clearTimers = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };

    const shift = () => {
      clearTimers();
      const currentCloneChars = clone.querySelectorAll('span');
      // Generate all axes for the word at once (mobile rule: max 1 extreme)
      const wordAxes = randomAxesForWord(LETTERS.length, isMobileViewport());

      chars.forEach((el, i) => {
        if (!el) return;
        const delay = i * STAGGER;
        const duration =
          TRANS_DURATION + Math.round((Math.random() - 0.5) * 400); // ±200ms

        const id = setTimeout(() => {
          const axes = wordAxes[i];
          if (prefersReduced) {
            el.style.transition = 'none';
          } else {
            el.style.transition = `font-variation-settings ${duration}ms ${SPRING_EASING}`;
          }
          el.style.fontVariationSettings = axisString(axes);

          // Sync clone immediately so ResizeObserver picks up the change
          if (currentCloneChars[i]) {
            (currentCloneChars[i] as HTMLElement).style.transition =
              `font-variation-settings ${duration}ms ${SPRING_EASING}`;
            (currentCloneChars[i] as HTMLElement).style.fontVariationSettings =
              axisString(axes);
          }
        }, delay);

        timersRef.current.push(id);
      });

      // After all transitions complete, start hold
      const totalTransTime =
        TRANS_DURATION + 200 + LETTERS.length * STAGGER;
      const holdTimer = setTimeout(() => hold(), totalTransTime);
      timersRef.current.push(holdTimer);
    };

    const hold = () => {
      clearTimers();
      const shiftTimer = setTimeout(() => shift(), HOLD_DURATION);
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
      // Clean up clone
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
      cloneRef.current = null;
    };
  }, [fitWord]);

  return (
    <header ref={heroRef} className={styles.hero}>
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
    </header>
  );
}
