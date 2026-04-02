'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import LogoMark from './LogoMark';
import { useNavigation } from '../lib/NavigationContext';
import {
  ExperimentControlsContext,
  type EasingType,
  type ExperimentControls,
} from '../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../lib/useDeviceOrientation';
import type { SectionConfig } from '../data/experiments';
import styles from './ExperimentFrame.module.css';

const MOBILE_BREAKPOINT = 600;

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

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
  const gyro = useDeviceOrientation();

  // Control state
  const [speed, setSpeed] = useState(2000);
  const [easing, setEasing] = useState<EasingType>('spring');
  const [shuffleKey, setShuffleKey] = useState(0);
  const [replayKey, setReplayKey] = useState(0);
  // Default to the most recent (last) section
  const [activeSection, setActiveSection] = useState(configs ? configs.length - 1 : 0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [timeSignature, setTimeSignature] = useState<3 | 4>(3);
  const [decay, setDecay] = useState(1.5);
  const [reverbMix, setReverbMix] = useState(0.3);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Start AudioContext on first user interaction (required by browsers)
  useEffect(() => {
    const startCtx = async () => {
      if (Tone.getContext().state !== 'running') {
        try { await Tone.start(); } catch { /* will retry on next gesture */ }
      }
    };
    document.addEventListener('click', startCtx, { once: true });
    document.addEventListener('touchstart', startCtx, { once: true });
    document.addEventListener('keydown', startCtx, { once: true });
    return () => {
      document.removeEventListener('click', startCtx);
      document.removeEventListener('touchstart', startCtx);
      document.removeEventListener('keydown', startCtx);
    };
  }, []);

  // Close volume popup on click outside
  useEffect(() => {
    if (!volumeOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) {
        setVolumeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [volumeOpen]);

  // Sync volume to Tone.js master output
  useEffect(() => {
    const db = volume > 0 ? 20 * Math.log10(volume) : -Infinity;
    Tone.getDestination().volume.rampTo(db, 0.05);
  }, [volume]);

  // Close section dropdown on outside click
  useEffect(() => {
    if (!sectionDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSectionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sectionDropdownOpen]);

  // Mobile detection — determined once on mount
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(isMobileViewport());
  }, []);

  // Transition loader phase
  const [phase, setPhase] = useState<'idle' | 'fadeOut' | 'loader' | 'fadeIn'>('idle');
  const pendingSection = useRef<number | null>(null);

  const totalSections = sections?.length ?? 1;
  const sectionLetters = configs
    ? configs.map((c) => c.letter)
    : sections
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
        const newSection = pendingSection.current ?? 0;
        setActiveSection(newSection);
        // Write hash to URL at the moment the section actually changes
        if (sectionLetters.length > 1) {
          if (newSection === 0) {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          } else {
            window.history.replaceState(null, '', `#${sectionLetters[newSection]}`);
          }
        }
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
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* --------------------------------------------------------
     Hash-based deep linking — read hash on mount
     -------------------------------------------------------- */
  useEffect(() => {
    if (sectionLetters.length <= 1) return;
    const hash = window.location.hash.slice(1).toUpperCase();
    if (!hash) return;
    const index = sectionLetters.indexOf(hash);
    if (index > 0) {
      setActiveSection(index);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* --------------------------------------------------------
     Hash-based deep linking — handle browser back/forward
     -------------------------------------------------------- */
  useEffect(() => {
    if (sectionLetters.length <= 1) return;
    const onPopState = () => {
      const hash = window.location.hash.slice(1).toUpperCase();
      const index = hash ? sectionLetters.indexOf(hash) : sectionLetters.length - 1;
      const resolved = index >= 0 ? index : 0;
      if (resolved !== activeSection) {
        handleSectionChange(resolved);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [activeSection, sectionLetters, handleSectionChange]);

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
    const action = isMobile
      ? (currentConfig?.hintActionMobile ?? currentConfig?.hintAction)
      : currentConfig?.hintAction;
    if (action === 'Replay') {
      handleReplay();
    } else if (action === 'Enable Motion') {
      gyro.requestPermission();
    }
  }, [currentConfig, handleReplay, isMobile, gyro]);

  /* --------------------------------------------------------
     Context value
     -------------------------------------------------------- */
  const controls: ExperimentControls = {
    speed,
    easing,
    shuffleKey,
    activeSection,
    replayKey,
    tempo,
    timeSignature,
    decay,
    reverbMix,
    paused: panelOpen,
    soundEnabled,
    volume,
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

        {/* VIEWPORT — fills frame, between fixed bars */}
        <div className={styles.viewportWrap}>
          {/* Dark scrim when settings panel is open */}
          <div
            className={`${styles.scrim}${panelOpen ? ` ${styles.scrimVisible}` : ''}`}
            onClick={() => panelOpen && setPanelOpen(false)}
          />

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
          {totalSections >= 1 && currentConfig && (() => {
            // Resolve hint text and action based on platform
            const hintText = isMobile
              ? (currentConfig.hintMobile ?? currentConfig.hint)
              : currentConfig.hint;

            // On mobile, determine the action:
            // - If section requests "Enable Motion" and gyro is granted/not-required, no action needed
            // - If section requests "Enable Motion" and permission pending, show it
            // - If section requests "Enable Motion" and denied, no action (touch fallback)
            // - Otherwise use the configured action
            let hintAction: string | undefined;
            if (isMobile) {
              const mobileAction = currentConfig.hintActionMobile ?? currentConfig.hintAction;
              if (mobileAction === 'Enable Motion') {
                if (gyro.permissionState === 'prompt' && gyro.isAvailable) {
                  hintAction = 'Enable Motion';
                }
                // granted/not-required/denied: no action
              } else {
                hintAction = mobileAction;
              }
            } else {
              hintAction = currentConfig.hintAction;
            }

            // On mobile, if gyro section with denied permission, show touch hint
            let resolvedHint = hintText;
            const mobileActionCheck = currentConfig.hintActionMobile ?? currentConfig.hintAction;
            if (isMobile && mobileActionCheck === 'Enable Motion') {
              if (gyro.permissionState === 'denied' || !gyro.isAvailable) {
                resolvedHint = currentConfig.hintMobile || hintText;
              }
            }

            return (
              <div className={styles.metaBottom}>
                <span className={styles.sectionLetter}>
                  {currentConfig.letter}
                </span>
                <span className={styles.sectionName}>{currentConfig.name}</span>
                {resolvedHint ? (
                  <>
                    <span className={styles.hintSep}>&middot;</span>
                    <span className={styles.hintText}>{resolvedHint}</span>
                  </>
                ) : null}
                {hintAction && (
                  <>
                    <span className={styles.hintSep}>&middot;</span>
                    <button
                      className={styles.hintAction}
                      onClick={handleHintAction}
                    >
                      {hintAction}
                    </button>
                  </>
                )}
              </div>
            );
          })()}
        </div>

        {/* ROW 4: EXPANDING SETTINGS PANEL */}
        <div className={styles.panelZone}>
          <div className={styles.keyline} />
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
                {currentConfig && (() => {
                  const instructions = isMobile
                    ? (currentConfig.instructionsMobile ?? currentConfig.instructions)
                    : currentConfig.instructions;
                  return instructions.length > 0;
                })() && (
                  <div className={styles.panelInstructions}>
                    {(isMobile
                      ? (currentConfig.instructionsMobile ?? currentConfig.instructions)
                      : currentConfig.instructions
                    ).map((instr, i) => (
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

                {hasControl('tempo') && (
                  <div className={styles.controlGroup}>
                    <span className={styles.controlLabel}>Tempo</span>
                    <div className={styles.controlOptions}>
                      {([80, 120, 160] as const).map((bpm) => (
                        <button
                          key={bpm}
                          className={`${styles.ctrlBtn}${
                            tempo === bpm ? ` ${styles.ctrlBtnActive}` : ''
                          }`}
                          onClick={() => setTempo(bpm)}
                        >
                          {bpm === 80 ? 'Ballad' : bpm === 120 ? 'Medium' : 'Up'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hasControl('timeSignature') && (
                  <div className={styles.controlGroup}>
                    <span className={styles.controlLabel}>Time</span>
                    <div className={styles.controlOptions}>
                      {([3, 4] as const).map((ts) => (
                        <button
                          key={ts}
                          className={`${styles.ctrlBtn}${
                            timeSignature === ts ? ` ${styles.ctrlBtnActive}` : ''
                          }`}
                          onClick={() => setTimeSignature(ts)}
                        >
                          {ts}/4
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hasControl('decay') && (
                  <div className={styles.controlGroup}>
                    <span className={styles.controlLabel}>Decay</span>
                    <div className={styles.controlOptions}>
                      {([
                        ['Short', 0.3],
                        ['Medium', 1.5],
                        ['Long', 3.0],
                      ] as const).map(([label, val]) => (
                        <button
                          key={label}
                          className={`${styles.ctrlBtn}${
                            decay === val ? ` ${styles.ctrlBtnActive}` : ''
                          }`}
                          onClick={() => setDecay(val)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {hasControl('reverb') && (
                  <div className={styles.controlGroup}>
                    <span className={styles.controlLabel}>Reverb</span>
                    <div className={styles.controlOptions}>
                      {([
                        ['Dry', 0.0],
                        ['Medium', 0.3],
                        ['Wet', 0.6],
                      ] as const).map(([label, val]) => (
                        <button
                          key={label}
                          className={`${styles.ctrlBtn}${
                            reverbMix === val ? ` ${styles.ctrlBtnActive}` : ''
                          }`}
                          onClick={() => setReverbMix(val)}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {!hasAnyControl && (
                  <div className={styles.noControls}>
                    No controls &mdash; this section is purely interactive.
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={styles.keyline} />
        </div>

        {/* BOTTOM BAR — fixed, pagination tiles + gear */}
        <div className={styles.bottombar}>
          {/* Desktop: inline tiles */}
          <div className={styles.tileRow}>
            {totalSections >= 1 &&
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
          </div>

          {/* Mobile: dropdown trigger + popover */}
          <div className={styles.sectionDropdown} ref={dropdownRef}>
            <button
              className={`${styles.pageTile} ${styles.pageTileActive} ${styles.dropdownTrigger}`}
              onClick={() => setSectionDropdownOpen((o) => !o)}
              aria-label={`Section ${sectionLetters[activeSection]} — tap to change`}
            >
              {sectionLetters[activeSection]}
              <svg className={styles.dropdownChevron} viewBox="0 0 10 6" fill="none">
                <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {sectionDropdownOpen && (
              <div className={styles.dropdownPopover}>
                {sectionLetters.map((letter, i) => (
                  <button
                    key={letter}
                    className={`${styles.dropdownItem}${
                      activeSection === i ? ` ${styles.dropdownItemActive}` : ''
                    }`}
                    onClick={() => {
                      handleSectionChange(i);
                      setSectionDropdownOpen(false);
                    }}
                  >
                    <span className={styles.dropdownLetter}>{letter}</span>
                    <span className={styles.dropdownName}>{configs?.[i]?.name ?? sections?.[i] ?? ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.tileSep} />

          <div className={styles.volumeControl} ref={volumeRef}>
            <button
              className={`${styles.soundTile}${
                soundEnabled ? ` ${styles.soundTileActive}` : ''
              }`}
              onClick={async () => {
                if (Tone.getContext().state !== 'running') {
                  try { await Tone.start(); } catch { /* noop */ }
                }
                setVolumeOpen((v) => !v);
              }}
              aria-label="Volume"
            >
              <svg viewBox="0 0 24 24">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                {soundEnabled ? (
                  <>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </>
                ) : (
                  <>
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </>
                )}
              </svg>
            </button>
            {volumeOpen && (
              <div className={styles.volumePopup}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(volume * 100)}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) / 100;
                    setVolume(v);
                    if (v > 0 && !soundEnabled) setSoundEnabled(true);
                    if (v === 0) setSoundEnabled(false);
                  }}
                  className={styles.volumeSlider}
                  aria-label="Volume"
                />
              </div>
            )}
          </div>

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
