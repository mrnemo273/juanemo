'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import LogoMark from './LogoMark';
import BottomSheet from './BottomSheet';
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

const FADE_OUT_MS = 100;
const LOADER_MS = 350;
const FADE_IN_MS = 100;

export default function ExperimentFrame({
  number,
  title,
  date,
  description,
  sections,
  children,
}: ExperimentFrameProps) {
  const { openDrawer, closeDrawer, isDrawerOpen } = useNavigation();

  // Control state
  const [speed, setSpeed] = useState(2000);
  const [easing, setEasing] = useState<EasingType>('spring');
  const [shuffleKey, setShuffleKey] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'fadeOut' | 'loader' | 'fadeIn'>('idle');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pendingSection = useRef<number | null>(null);

  const totalSections = sections?.length ?? 1;
  const sectionLetters = sections
    ? sections.map((_, i) => String.fromCharCode(65 + i))
    : ['A'];

  const handleSectionChange = useCallback((i: number) => {
    if (i === activeSection || phase !== 'idle') return;
    pendingSection.current = i;
    setPhase('fadeOut');
  }, [activeSection, phase]);

  useEffect(() => {
    if (phase === 'fadeOut') {
      const t = setTimeout(() => {
        setActiveSection(pendingSection.current ?? 0);
        setPhase('loader');
      }, FADE_OUT_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'loader') {
      const t = setTimeout(() => setPhase('fadeIn'), LOADER_MS);
      return () => clearTimeout(t);
    }
    if (phase === 'fadeIn') {
      const t = setTimeout(() => setPhase('idle'), FADE_IN_MS);
      return () => clearTimeout(t);
    }
  }, [phase]);

  const handleShuffle = useCallback(() => {
    setShuffleKey((k) => k + 1);
  }, []);

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        isDrawerOpen ? closeDrawer() : openDrawer();
      }
    },
    [isDrawerOpen, closeDrawer, openDrawer],
  );

  const controls: ExperimentControls = { speed, easing, shuffleKey, activeSection };

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
            onClick={() => isDrawerOpen ? closeDrawer() : openDrawer()}
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
        <div className={styles.viewportWrap}>
          <div
            className={`${styles.viewport}${
              phase === 'fadeOut' || phase === 'loader' ? ` ${styles.viewportHidden}` : ''
            }${phase === 'fadeIn' ? ` ${styles.viewportFadeIn}` : ''}`}
          >
            {children}
          </div>
          {(phase === 'loader' || phase === 'fadeOut') && (
            <div className={styles.loader}>
              <svg
                className={styles.spinner}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M2 12L4.5 9.5M2 12L4.5 14.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </div>

        {/* BOTTOM META BAR — mirrors top meta bar */}
        {totalSections > 1 && (
          <div className={`${styles.metabar} ${styles.metabarBottom}`}>
            <div className={styles.metabarLeft}>
              <span className={styles.expNumber}>
                {sectionLetters[activeSection]}
              </span>
              <span className={styles.expTitle}>
                {sections?.[activeSection] ?? ''}
              </span>
            </div>
          </div>
        )}

        {/* BOTTOM KEYLINE */}
        <div className={styles.keyline} />

        {/* BOTTOM BAR */}
        <div className={styles.bottombar}>
          <div className={styles.bottombarLeft}>
            {totalSections > 1 && (
              <div className={styles.pagination}>
                {sectionLetters.map((letter, i) => (
                  <button
                    key={letter}
                    className={`${styles.pageTile}${activeSection === i ? ` ${styles.pageTileActive}` : ''}`}
                    onClick={() => handleSectionChange(i)}
                    aria-label={`Section ${letter}: ${sections?.[i] ?? ''}`}
                  >
                    {letter}
                  </button>
                ))}
              </div>
            )}
            {/* Settings icon — mobile only */}
            <button
              className={styles.settingsBtn}
              onClick={() => setDrawerOpen((o) => !o)}
              aria-label="Toggle settings"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
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
          </div>
        </div>

        {/* MOBILE SETTINGS BOTTOM SHEET */}
        <BottomSheet
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          zIndex={80}
          ariaLabel="Experiment controls"
        >
          <div className={styles.drawerControls}>
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
            <button className={styles.ctrlBtn} onClick={handleShuffle}>
              Shuffle
            </button>
          </div>
        </BottomSheet>
      </div>
    </ExperimentControlsContext.Provider>
  );
}
