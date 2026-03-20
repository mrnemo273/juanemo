'use client';

import { useEffect, useRef, useCallback } from 'react';
import styles from './BottomSheet.module.css';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  zIndex?: number;
  ariaLabel?: string;
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  zIndex = 100,
  ariaLabel = 'Settings',
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const el = sheetRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], [tabindex]:not([tabindex="-1"])',
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

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop}${isOpen ? ` ${styles.backdropOpen}` : ''}`}
        style={{ zIndex }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={`${styles.sheet}${isOpen ? ` ${styles.sheetOpen}` : ''}`}
        style={{ zIndex: zIndex + 1 }}
        role="dialog"
        aria-modal={isOpen}
        aria-label={ariaLabel}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.dragHandle} />
        {children}
      </div>
    </>
  );
}
