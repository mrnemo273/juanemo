'use client';

import { useState, useCallback } from 'react';
import LogoMark from './LogoMark';
import IndexOverlay from './IndexOverlay';
import styles from './Navigation.module.css';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => setIsOpen(false), []);
  const handleToggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <>
      <LogoMark />
      <button
        className={styles.indexTrigger}
        onClick={handleToggle}
        aria-label={isOpen ? 'Close experiment index' : 'Open experiment index'}
        aria-expanded={isOpen}
      >
        INDEX
      </button>
      <IndexOverlay isOpen={isOpen} onClose={handleClose} />
    </>
  );
}
