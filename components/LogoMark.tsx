'use client';

import { useEffect, useRef } from 'react';
import { randomAxes, axisString } from '../lib/generativeAxes';
import styles from './LogoMark.module.css';

const LETTERS = 'JUANEMO'.split('');

interface LogoMarkProps {
  size?: number;
  className?: string;
}

export default function LogoMark({ size = 22, className }: LogoMarkProps) {
  const charsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    // Randomize each letter's axes once on mount, then freeze
    charsRef.current.forEach((el) => {
      if (!el) return;
      const axes = randomAxes();
      el.style.fontVariationSettings = axisString(axes);
    });
  }, []);

  return (
    <a
      href="/"
      className={`${styles.logoMark}${className ? ` ${className}` : ''}`}
      aria-label="Juanemo — home"
    >
      {LETTERS.map((letter, i) => (
        <span
          key={i}
          ref={(el) => { charsRef.current[i] = el; }}
          className={styles.logoChar}
          style={{ fontSize: `${size}px` }}
          suppressHydrationWarning
        >
          {letter}
        </span>
      ))}
    </a>
  );
}
