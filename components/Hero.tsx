'use client';

import { useEffect, useRef } from 'react';
import { updateHeroAxes } from '../lib/heroListeners';
import { fitHeroText } from '../lib/fitText';
import styles from './Hero.module.css';

export default function Hero() {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    let rafId: number;

    // Update axes then fit text after browser applies new variation settings
    const updateAndFit = () => {
      updateHeroAxes();
      // Wait one frame for the font to re-render with new axis values
      // before measuring glyph widths for fitText
      rafId = requestAnimationFrame(() => {
        fitHeroText(el);
      });
    };

    updateAndFit();
    window.addEventListener('resize', updateAndFit);

    return () => {
      window.removeEventListener('resize', updateAndFit);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <header className={styles.hero}>
      <div className={styles.textContainer}>
        <div
          ref={textRef}
          className={styles.text}
          aria-label="Juanemo"
          role="heading"
          aria-level={1}
        >
          JUANEMO
        </div>
      </div>
    </header>
  );
}
