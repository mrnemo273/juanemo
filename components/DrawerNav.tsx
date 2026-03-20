'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { type Experiment } from '../data/experiments';
import {
  type SpecialProject,
  specialProjects as defaultSpecialProjects,
} from '../data/specialProjects';
import { randomAxes, axisString } from '../lib/generativeAxes';
import styles from './DrawerNav.module.css';

const LETTERS = 'JUANEMO'.split('');

interface DrawerNavProps {
  isOpen: boolean;
  onClose: () => void;
  experiments: Experiment[];
  activeSlug: string;
  onSelectExperiment: (slug: string) => void;
  specialProjects?: SpecialProject[];
}

/** Group experiments by publishedDate, preserving order of first appearance. */
function groupByMonth(experiments: Experiment[]) {
  const groups: { month: string; items: Experiment[] }[] = [];
  const seen = new Map<string, number>();

  for (const exp of experiments) {
    const idx = seen.get(exp.publishedDate);
    if (idx !== undefined) {
      groups[idx].items.push(exp);
    } else {
      seen.set(exp.publishedDate, groups.length);
      groups.push({ month: exp.publishedDate, items: [exp] });
    }
  }
  return groups;
}

export default function DrawerNav({
  isOpen,
  onClose,
  experiments,
  activeSlug,
  onSelectExperiment,
  specialProjects = defaultSpecialProjects,
}: DrawerNavProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const carouselIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentSlideRef = useRef(0);
  const carouselInnerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Pre-generate thumbnail axis values on client only (avoids hydration mismatch)
  const [thumbAxes, setThumbAxes] = useState<string[][]>([]);
  useEffect(() => {
    setThumbAxes(
      experiments.map(() =>
        LETTERS.map(() => axisString(randomAxes())),
      ),
    );
  }, [experiments]);

  const grouped = useMemo(() => groupByMonth(experiments), [experiments]);

  // ── Carousel helpers ──────────────────────────────────

  const updateCarouselUI = useCallback(() => {
    const inner = carouselInnerRef.current;
    if (inner) {
      inner.style.transform = `translateX(-${currentSlideRef.current * 100}%)`;
    }
    dotsRef.current.forEach((dot, i) => {
      if (dot) {
        if (i === currentSlideRef.current) {
          dot.classList.add(styles.carouselDotActive);
        } else {
          dot.classList.remove(styles.carouselDotActive);
        }
      }
    });
  }, []);

  const startCarousel = useCallback(() => {
    if (carouselIntervalRef.current) clearInterval(carouselIntervalRef.current);
    carouselIntervalRef.current = setInterval(() => {
      currentSlideRef.current =
        (currentSlideRef.current + 1) % specialProjects.length;
      updateCarouselUI();
    }, 4000);
  }, [specialProjects.length, updateCarouselUI]);

  const stopCarousel = useCallback(() => {
    if (carouselIntervalRef.current) {
      clearInterval(carouselIntervalRef.current);
      carouselIntervalRef.current = null;
    }
  }, []);

  const handleDotClick = useCallback(
    (i: number) => {
      currentSlideRef.current = i;
      updateCarouselUI();
      stopCarousel();
      startCarousel();
    },
    [updateCarouselUI, stopCarousel, startCarousel],
  );

  // ── Open / close side-effects ─────────────────────────

  useEffect(() => {
    if (isOpen) {
      startCarousel();
      // Focus close button on open
      requestAnimationFrame(() => closeBtnRef.current?.focus());
    } else {
      stopCarousel();
      // Reset carousel to first slide
      currentSlideRef.current = 0;
      updateCarouselUI();
    }
  }, [isOpen, startCarousel, stopCarousel, updateCarouselUI]);

  // Escape key closes drawer
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const el = drawerRef.current;
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
    },
    [],
  );

  // ── Item click handler ────────────────────────────────

  const handleSelect = useCallback(
    (slug: string) => {
      onSelectExperiment(slug);
      onClose();
    },
    [onSelectExperiment, onClose],
  );

  // Cleanup interval on unmount
  useEffect(() => {
    return () => stopCarousel();
  }, [stopCarousel]);

  return (
    <>
      {/* SCRIM */}
      <div
        className={`${styles.scrim}${isOpen ? ` ${styles.scrimOpen}` : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* DRAWER */}
      <div
        ref={drawerRef}
        className={`${styles.drawer}${isOpen ? ` ${styles.drawerOpen}` : ''}`}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Experiment navigation"
        onKeyDown={handleKeyDown}
      >
        {/* Drag handle — mobile only */}
        <div className={styles.dragHandle} />

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.title}>Experiments</span>
          <button
            ref={closeBtnRef}
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close navigation"
            tabIndex={isOpen ? 0 : -1}
          >
            &#x2715;
          </button>
        </div>
        <div className={styles.headerKeyline} />

        {/* Scrollable experiment list */}
        <div className={styles.list}>
          {grouped.map((group) => (
            <div key={group.month} className={styles.monthGroup}>
              <div className={styles.monthLabel}>{group.month}</div>
              {group.items.map((exp) => {
                const globalIdx = experiments.indexOf(exp);
                const isActive = exp.slug === activeSlug;
                return (
                  <button
                    key={exp.slug}
                    className={`${styles.item}${isActive ? ` ${styles.itemActive}` : ''}`}
                    onClick={() => handleSelect(exp.slug)}
                    tabIndex={isOpen ? 0 : -1}
                    aria-label={`${exp.number} ${exp.name}`}
                  >
                    {/* Thumbnail */}
                    <div className={styles.thumb}>
                      <div className={styles.thumbWord}>
                        {LETTERS.map((letter, ci) => (
                          <span
                            key={ci}
                            className={styles.thumbChar}
                            style={{
                              fontVariationSettings:
                                thumbAxes[globalIdx]?.[ci] ?? undefined,
                            }}
                          >
                            {letter}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Text */}
                    <div className={styles.itemText}>
                      <div>
                        <span className={styles.itemNumber}>
                          {exp.number}
                        </span>
                        <span className={styles.itemName}>{exp.name}</span>
                      </div>
                      <div className={styles.itemDesc}>
                        {exp.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Special Projects Carousel */}
        <div className={styles.carouselSection}>
          <div className={styles.carouselHeader}>
            <span className={styles.carouselLabel}>Special Projects</span>
            <div className={styles.carouselDots}>
              {specialProjects.map((_, i) => (
                <button
                  key={i}
                  ref={(el) => {
                    dotsRef.current[i] = el;
                  }}
                  className={`${styles.carouselDot}${i === 0 ? ` ${styles.carouselDotActive}` : ''}`}
                  onClick={() => handleDotClick(i)}
                  tabIndex={isOpen ? 0 : -1}
                  aria-label={`Go to project ${i + 1}`}
                />
              ))}
            </div>
          </div>
          <div className={styles.carouselTrack}>
            <div ref={carouselInnerRef} className={styles.carouselInner}>
              {specialProjects.map((proj) => (
                <div key={proj.tag} className={styles.carouselSlide}>
                  <div
                    className={styles.carouselThumb}
                    style={{ background: proj.color }}
                  >
                    <span className={styles.carouselThumbTag}>
                      {proj.tag}
                    </span>
                  </div>
                  <div className={styles.carouselText}>
                    <div className={styles.carouselTag}>{proj.tag}</div>
                    <div className={styles.carouselName}>{proj.name}</div>
                    <div className={styles.carouselDesc}>
                      {proj.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
