'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import LogoMark from './LogoMark';
import { useNavigation } from '../lib/NavigationContext';
import {
  ExperimentControlsContext,
  type EasingType,
  type ExperimentControls,
} from '../lib/ExperimentControlsContext';
import styles from './ExperimentFrame.module.css';

interface ExperimentFrameProps {
  number: string;
  title: string;
  date: string;
  description: string;
  sections?: string[];
  children: React.ReactNode;
}

export default function ExperimentFrame({
  number,
  title,
  date,
  description,
  sections,
  children,
}: ExperimentFrameProps) {
  const { openIndex } = useNavigation();

  // Control state
  const [speed, setSpeed] = useState(2000);
  const [easing, setEasing] = useState<EasingType>('spring');
  const [shuffleKey, setShuffleKey] = useState(0);

  // Section tracking
  const [currentSection, setCurrentSection] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const totalSections = sections?.length ?? 1;
  const sectionLetters = sections
    ? sections.map((_, i) => String.fromCharCode(65 + i))
    : ['A'];

  // Scroll tracking for section counter
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp || totalSections <= 1) return;

    const handleScroll = () => {
      const vh = vp.clientHeight;
      const scrollTop = vp.scrollTop;
      const sectionEls = vp.querySelectorAll('[data-section]');
      let current = 0;
      sectionEls.forEach((el, i) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.offsetTop - scrollTop < vh * 0.5) current = i;
      });
      setCurrentSection(current);
    };

    vp.addEventListener('scroll', handleScroll, { passive: true });
    return () => vp.removeEventListener('scroll', handleScroll);
  }, [totalSections]);

  const handleShuffle = useCallback(() => {
    setShuffleKey((k) => k + 1);
  }, []);

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openIndex();
      }
    },
    [openIndex],
  );

  const controls: ExperimentControls = { speed, easing, shuffleKey };

  return (
    <ExperimentControlsContext.Provider value={controls}>
      <div className={styles.frame}>
        {/* TOP BAR */}
        <div className={styles.topbar}>
          <span className={styles.date}>{date}</span>
          <LogoMark size={15} className={styles.logoInline} />
          <div
            className={styles.gridIcon}
            role="button"
            tabIndex={0}
            aria-label="View all experiments"
            onClick={openIndex}
            onKeyDown={handleGridKeyDown}
          >
            <span /><span /><span /><span />
          </div>
        </div>

        {/* TOP KEYLINE */}
        <div className={styles.keyline} />

        {/* META BAR */}
        <div className={styles.metabar}>
          <div className={styles.metabarLeft}>
            <span className={styles.expNumber}>{number}</span>
            <span className={styles.expTitle}>{title}</span>
          </div>
        </div>

        {/* EXPERIMENT VIEWPORT */}
        <div ref={viewportRef} className={styles.viewport}>
          {children}
        </div>

        {/* BOTTOM KEYLINE */}
        <div className={styles.keyline} />

        {/* BOTTOM BAR */}
        <div className={styles.bottombar}>
          <div className={styles.bottombarLeft}>
            <p className={styles.expDesc}>{description}</p>
          </div>
          <div className={styles.bottombarRight}>
            {/* Speed */}
            <div className={styles.ctrl}>
              <span className={styles.ctrlLabel}>Speed</span>
              {[2000, 4000, 8000].map((s) => (
                <button
                  key={s}
                  className={`${styles.ctrlBtn}${speed === s ? ` ${styles.ctrlBtnActive}` : ''}`}
                  onClick={() => setSpeed(s)}
                >
                  {s / 1000}s
                </button>
              ))}
            </div>

            <div className={styles.dotSep} />

            {/* Easing */}
            <div className={styles.ctrl}>
              <span className={styles.ctrlLabel}>Easing</span>
              {(['spring', 'smooth'] as EasingType[]).map((e) => (
                <button
                  key={e}
                  className={`${styles.ctrlBtn}${easing === e ? ` ${styles.ctrlBtnActive}` : ''}`}
                  onClick={() => setEasing(e)}
                >
                  {e.charAt(0).toUpperCase() + e.slice(1)}
                </button>
              ))}
            </div>

            <div className={styles.dotSep} />

            {/* Shuffle */}
            <button className={styles.ctrlBtn} onClick={handleShuffle}>
              Shuffle
            </button>

            {totalSections > 1 && (
              <>
                <div className={styles.dotSep} />
                <span className={styles.sectionCounter}>
                  {sectionLetters[currentSection]} /{' '}
                  {sectionLetters[sectionLetters.length - 1]}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </ExperimentControlsContext.Provider>
  );
}
