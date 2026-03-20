'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import LogoMark from './LogoMark';
import { useNavigation } from '../lib/NavigationContext';
import {
  ExperimentControlsContext,
  type EasingType,
  type ExperimentControls,
} from '../lib/ExperimentControlsContext';
import type { SectionConfig } from '../data/experiments';
import styles from './ExperimentFrame.module.css';

/* ----------------------------------------------------------
   Icon SVG paths — Lucide-style icons for panel instructions
   ---------------------------------------------------------- */
const ICON_PATHS: Record<string, string> = {
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  refresh:
    '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
  clock:
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  cursor: '<path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/>',
  move: '<polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/>',
  'move-v':
    '<polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><line x1="12" y1="2" x2="12" y2="22"/>',
  play: '<polygon points="5 3 19 12 5 21 5 3"/>',
};

/* ----------------------------------------------------------
   Props
   ---------------------------------------------------------- */
interface ExperimentFrameProps {
  number: string;
  title: string;
  date: string;
  description: string;
  sections?: string[];
  sectionConfigs?: SectionConfig[];
  children: React.ReactNode;
}

/* ----------------------------------------------------------
   Timing constants (transition loader)
   ---------------------------------------------------------- */
const FADE_OUT_MS = 100;
const LOADER_MS = 350;
const FADE_IN_MS = 100;

/* ----------------------------------------------------------
   Gear SVG path (Lucide settings icon)
   ---------------------------------------------------------- */
const GEAR_SVG = (
  <svg viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/* ==========================================================
   ExperimentFrame Component
   ========================================================== */
export default function ExperimentFrame({
  number,
  title,
  date,
  description,
  sections,
  sectionConfigs: configs,
  children,
}: ExperimentFrameProps) {
  const { openDrawer, closeDrawer, isDrawerOpen } = useNavigation();

  // Control state
  const [speed, setSpeed] = useState(2000);
  const [easing, setEasing] = useState<EasingType>('spring');
  const [shuffleKey, setShuffleKey] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);

  // Transition loader phase
  const [phase, setPhase] = useState<'idle' | 'fadeOut' | 'loader' | 'fadeIn'>('idle');
  const pendingSection = useRef<number | null>(null);

  const totalSections = sections?.length ?? 1;
  const sectionLetters = sections
    ? sections.map((_, i) => String.fromCharCode(65 + i))
    : ['A'];

  // Current section config
  const currentConfig = configs?.[activeSection];

  /* --------------------------------------------------------
     Section change — 3-phase transition loader
     -------------------------------------------------------- */
  const handleSectionChange = useCallback(
    (i: number) => {
      if (i === activeSection || phase !== 'idle') return;
      pendingSection.current = i;
      setPhase('fadeOut');
    },
    [activeSection, phase],
  );

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

  /* --------------------------------------------------------
     Panel toggle + Escape to close
     -------------------------------------------------------- */
  const togglePanel = useCallback(() => setPanelOpen((o) => !o), []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelOpen) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [panelOpen]);

  /* --------------------------------------------------------
     Handlers
     -------------------------------------------------------- */
  const handleShuffle = useCallback(() => setShuffleKey((k) => k + 1), []);
  const handleReplay = useCallback(() => setReplayKey((k) => k + 1), []);

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        isDrawerOpen ? closeDrawer() : openDrawer();
      }
    },
    [isDrawerOpen, closeDrawer, openDrawer],
  );

  const handleHintAction = useCallback(() => {
    if (currentConfig?.hintAction === 'Replay') {
      handleReplay();
    }
  }, [currentConfig, handleReplay]);

  /* --------------------------------------------------------
     Context value
     -------------------------------------------------------- */
  const controls: ExperimentControls = {
    speed,
    easing,
    shuffleKey,
    activeSection,
    replayKey,
  };

  /* --------------------------------------------------------
     Helpers for rendering panel controls
     -------------------------------------------------------- */
  const hasControl = (ctrl: string) =>
    currentConfig?.controls.includes(ctrl) ?? false;
  const hasAnyControl = (currentConfig?.controls.length ?? 0) > 0;

  return (
    <ExperimentControlsContext.Provider value={controls}>
      <div
        className={`${styles.frame}${panelOpen ? ` ${styles.frameOpen}` : ''}`}
      >
        {/* ROW 1: TOP BAR */}
        <div className={styles.topbar}>
          <span className={styles.date}>{date}</span>
          <LogoMark size={15} className={styles.logoInline} />
          <div
            className={styles.gridIcon}
            role="button"
            tabIndex={0}
            aria-label="View all experiments"
            onClick={() => (isDrawerOpen ? closeDrawer() : openDrawer())}
            onKeyDown={handleGridKeyDown}
          >
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        {/* ROW 2: TOP KEYLINE */}
        <div className={styles.keyline} />

        {/* ROW 3: VIEWPORT */}
        <div className={styles.viewportWrap}>
          {/* Floating meta: experiment title, 60px from top keyline */}
          <div className={styles.metaTop}>
            <span className={styles.metaNumber}>{number}</span>
            <span className={styles.metaTitle}>{title}</span>
          </div>

          {/* Experiment content */}
          <div
            className={`${styles.viewport}${
              phase === 'fadeOut' || phase === 'loader'
                ? ` ${styles.viewportHidden}`
                : ''
            }${phase === 'fadeIn' ? ` ${styles.viewportFadeIn}` : ''}`}
          >
            {children}
          </div>

          {/* Transition loader — spinning arrow centered in viewport */}
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

          {/* Floating meta: section label + hint, 60px from bottom keyline */}
          {totalSections > 1 && currentConfig && (
            <div className={styles.metaBottom}>
              <span className={styles.sectionLetter}>
                {currentConfig.letter}
              </span>
              <span className={styles.sectionName}>{currentConfig.name}</span>
              <span className={styles.hintSep}>&middot;</span>
              <span className={styles.hintText}>{currentConfig.hint}</span>
              {currentConfig.hintAction && (
                <>
                  <span className={styles.hintSep}>&middot;</span>
                  <button
                    className={styles.hintAction}
                    onClick={handleHintAction}
                  >
                    {currentConfig.hintAction}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ROW 4: EXPANDING SETTINGS PANEL */}
        <div className={styles.panelZone}>
          <div
            className={`${styles.panelContent}${
              panelOpen ? ` ${styles.panelContentOpen}` : ''
            }`}
          >
            <div className={styles.panelInner}>
              {/* LEFT: About + Instructions */}
              <div className={styles.panelAbout}>
                <div>
                  <div className={styles.panelLabel}>
                    {currentConfig
                      ? `${currentConfig.letter} \u2014 ${currentConfig.name}`
                      : ''}
                  </div>
                </div>
                <div className={styles.panelDescription}>
                  {currentConfig?.description ?? description}
                </div>
                {currentConfig && currentConfig.instructions.length > 0 && (
                  <div className={styles.panelInstructions}>
                    {currentConfig.instructions.map((instr, i) => (
                      <div key={i} className={styles.instructionItem}>
                        <div className={styles.instructionIcon}>
                          <svg
                            viewBox="0 0 24 24"
                            dangerouslySetInnerHTML={{
                              __html:
                                ICON_PATHS[instr.icon] || ICON_PATHS.eye,
                            }}
                          />
                        </div>
                        <div
                          className={styles.instructionText}
                          dangerouslySetInnerHTML={{ __html: instr.text }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Controls */}
              <div className={styles.panelControls}>
                <div>
                  <div className={styles.panelLabel}>Controls</div>
                </div>

                {hasControl('speed') && (
                  <div className={styles.controlGroup}>
                    <span className={styles.controlLabel}>Speed</span>
                    <div className={styles.controlOptions}>
                      {[2000, 4000, 8000].map((s) => (
                        <button
                          key={s}
                          className={`${styles.ctrlBtn}${
                            speed === s ? ` ${styles.ctrlBtnActive}` : ''
                          }`}
                          onClick={() => setSpeed(s)}
                        >
                          {s / 1000}s
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hasControl('easing') && (
                  <div className={styles.controlGroup}>
                    <span className={styles.controlLabel}>Easing</span>
                    <div className={styles.controlOptions}>
                      {(['spring', 'smooth'] as EasingType[]).map((e) => (
                        <button
                          key={e}
                          className={`${styles.ctrlBtn}${
                            easing === e ? ` ${styles.ctrlBtnActive}` : ''
                          }`}
                          onClick={() => setEasing(e)}
                        >
                          {e.charAt(0).toUpperCase() + e.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hasControl('shuffle') && (
                  <button
                    className={`${styles.ctrlBtn} ${styles.shuffleBtn}`}
                    onClick={handleShuffle}
                  >
                    Shuffle
                  </button>
                )}

                {!hasAnyControl && (
                  <div className={styles.noControls}>
                    No controls &mdash; this section is purely interactive.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 5: BOTTOM KEYLINE */}
        <div className={styles.keyline} />

        {/* ROW 6: BOTTOM BAR — pagination tiles + gear */}
        <div className={styles.bottombar}>
          {totalSections > 1 &&
            sectionLetters.map((letter, i) => (
              <button
                key={letter}
                className={`${styles.pageTile}${
                  activeSection === i ? ` ${styles.pageTileActive}` : ''
                }`}
                onClick={() => handleSectionChange(i)}
                aria-label={`Section ${letter}: ${sections?.[i] ?? ''}`}
              >
                {letter}
              </button>
            ))}

          <div className={styles.tileSep} />

          <button
            className={`${styles.gearTile}${
              panelOpen ? ` ${styles.gearTileActive}` : ''
            }`}
            onClick={togglePanel}
            aria-label="Toggle settings panel"
          >
            {GEAR_SVG}
          </button>
        </div>
      </div>
    </ExperimentControlsContext.Provider>
  );
}
