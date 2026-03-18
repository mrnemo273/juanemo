'use client';

import { useEffect, useRef, useCallback } from 'react';
import { randomAxes, axisString } from '../lib/generativeAxes';
import styles from './Hero.module.css';

const LETTERS = 'JUANEMO'.split('');

// --- Timing constants (easy to tune) ---
const HOLD_DURATION = 8000;  // ms — how long the wordmark sits still
const TRANS_DURATION = 1500; // ms — base transition duration per letter
const STAGGER = 80;          // ms — delay between each letter's start

// Spring easing with overshoot — non-negotiable
const SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

export default function Hero() {
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const wordRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  // Scale the word to fill the container width
  const fitWord = useCallback(() => {
    const word = wordRef.current;
    const hero = heroRef.current;
    if (!word || !hero) return;

    // Reset scale to measure natural width
    word.style.transform = 'none';
    const naturalWidth = word.scrollWidth;
    const containerWidth = hero.clientWidth - parseFloat(getComputedStyle(hero).paddingLeft) - parseFloat(getComputedStyle(hero).paddingRight);

    if (naturalWidth > 0) {
      const scale = containerWidth / naturalWidth;
      word.style.transform = `scaleX(${scale})`;
    }
  }, []);

  useEffect(() => {
    const chars = charsRef.current;
    if (!chars.length) return;

    // Check reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Initial randomization — no animation, instant
    chars.forEach((el) => {
      if (!el) return;
      el.style.transition = 'none';
      el.style.fontVariationSettings = axisString(randomAxes());
    });

    // Initial fit
    requestAnimationFrame(fitWord);

    // ResizeObserver on the word element — fires as font-variation-settings
    // transitions cause letter widths to change, keeping scale in sync
    const ro = new ResizeObserver(fitWord);
    if (wordRef.current) ro.observe(wordRef.current);

    // Also refit on window resize
    window.addEventListener('resize', fitWord);

    const clearTimers = () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };

    const shift = () => {
      clearTimers();

      chars.forEach((el, i) => {
        if (!el) return;
        const delay = i * STAGGER;
        const duration = TRANS_DURATION + Math.round((Math.random() - 0.5) * 400); // ±200ms

        const id = setTimeout(() => {
          if (prefersReduced) {
            el.style.transition = 'none';
          } else {
            el.style.transition = `font-variation-settings ${duration}ms ${SPRING_EASING}`;
          }
          el.style.fontVariationSettings = axisString(randomAxes());
        }, delay);

        timersRef.current.push(id);
      });

      // After all transitions complete, start hold
      const totalTransTime = TRANS_DURATION + 200 + (LETTERS.length * STAGGER);
      const holdTimer = setTimeout(() => hold(), totalTransTime);
      timersRef.current.push(holdTimer);
    };

    const hold = () => {
      clearTimers();
      const shiftTimer = setTimeout(() => shift(), HOLD_DURATION);
      timersRef.current.push(shiftTimer);
    };

    // Start with a hold (user admires the initial random state)
    hold();

    return () => {
      clearTimers();
      ro.disconnect();
      window.removeEventListener('resize', fitWord);
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
            ref={(el) => { charsRef.current[i] = el; }}
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
