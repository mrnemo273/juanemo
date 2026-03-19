'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { experiments } from '../data/experiments';
import styles from './IndexOverlay.module.css';

interface IndexOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IndexOverlay({ isOpen, onClose }: IndexOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Escape key closes overlay
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus trap: focus first link when overlay opens
  useEffect(() => {
    if (isOpen && firstLinkRef.current) {
      // Small delay to allow transition to start
      requestAnimationFrame(() => {
        firstLinkRef.current?.focus();
      });
    }
  }, [isOpen]);

  // Focus trap: keep Tab within overlay
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const overlay = overlayRef.current;
    if (!overlay) return;

    const focusable = overlay.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  // Reverse chronological (newest first) — data is already in this order
  const sortedExperiments = experiments;

  return (
    <div
      ref={overlayRef}
      className={`${styles.overlay}${isOpen ? ` ${styles.open}` : ''}`}
      role="dialog"
      aria-modal={isOpen}
      aria-label="Experiment index"
      onKeyDown={handleKeyDown}
    >
      <nav>
        <ul className={styles.list}>
          {sortedExperiments.map((exp, i) => (
            <li key={exp.slug} className={styles.entry}>
              <Link
                href={`/experiments/${exp.slug}`}
                className={styles.entryLink}
                ref={i === 0 ? firstLinkRef : undefined}
                onClick={onClose}
              >
                <span className={styles.entryName}>{exp.name}</span>
                <span className={styles.entryDate}>{exp.publishedDate}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
