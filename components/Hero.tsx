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

    // Set viewport-responsive axes on mount
    updateHeroAxes();

    // Fit text edge-to-edge
    fitHeroText(el);

    // Re-run both on resize
    const handleResize = () => {
      updateHeroAxes();
      fitHeroText(el);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
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
