# BACKLOG.md — Juanemo Living Backlog

## Last Updated
2026-05-08 — **Backport batch COMPLETE.** GYRO.1 (dead zones + iOS permission for all 10 gyro components) ✅, J.5 (pagination overflow) ✅, J.6 (note duration variety backport) ✅. EXP-01 through EXP-03 fully polished. Ready for Stock Collage series.

---

## How This Document Works

This is the single source of truth for all work items on the Juanemo project. The scrummaster maintains it. Items flow through these statuses:

| Status | Meaning |
|---|---|
| `🔲 TODO` | Scoped, not yet started |
| `🔵 IN PROGRESS` | Currently being worked in an active phase |
| `✅ DONE` | Completed and approved by JC |
| `⏸ DEFERRED` | Paused or superseded |
| `📋 V2+` | Deferred — not in scope for current sprint |

---

## Completed Work (Foundation)

All previous phases built the foundation that the V2.0 architecture builds on. These are done:

| Phase | Status | Key Deliverables |
|---|---|---|
| Phase 1 — Scaffolding | ✅ DONE | Next.js 16, tokens, fonts (`full.css`), CSS custom properties |
| Phase 2 — Hero V1 | ✅ DONE (superseded) | Viewport-responsive axes. Mood system tested and deferred. |
| Phase 3 — Project List | ✅ DONE (superseded) | Newspaper-style index, Footer, data model. Moving to IndexOverlay. |
| Hero V2 — Generative Drift | ✅ DONE | Per-character drift + hold, spring easing, scaleX, ResizeObserver |
| Hero V3 — ScaleXY + Mobile | ✅ DONE | ScaleXY fill, hidden clone, mobile axis caps, `randomAxesForWord()` |

---

## V2.0 Architecture — Experiment Journal 🔵

### Phase A — Architecture Pivot ✅

| # | Item | Status | Notes |
|---|---|---|---|
| A.1 | Create `data/experiments.ts` | ✅ DONE | slug, name, description, publishedDate. 1 entry. |
| A.2 | Create `ExperimentShell.tsx` | ✅ DONE | Server component, `100vw × 100vh`, `overflow: hidden` |
| A.3 | Refactor `Hero.tsx` → `GenerativeType.tsx` | ✅ DONE | `<div>` container (was `<header>`), fills parent 100%×100%. Class renamed `.container`. |
| A.4 | Create `/experiments/[slug]/page.tsx` dynamic route | ✅ DONE | Slug→component mapping, `generateStaticParams()` |
| A.5 | Update `page.tsx` — redirect to latest experiment | ✅ DONE | |
| A.6 | Clean up `layout.tsx` | ✅ DONE | Already clean — Hero/ProjectList/Footer were in page.tsx not layout |
| A.7 | Disable document scroll | ✅ DONE | `html, body { overflow: hidden; height: 100vh; }` |
| A.8 | Build + QA | ✅ DONE | Zero errors, static generation works |

### Phase B — Navigation Layer (LogoMark + IndexOverlay) ✅

| # | Item | Status | Notes |
|---|---|---|---|
| B.1 | Create `LogoMark.tsx` — static generative logo | ✅ DONE | Fixed top-left, per-character `randomAxes()` on mount, 22px, Dun |
| B.2 | Create `IndexOverlay.tsx` — full-screen experiment list | ✅ DONE | Dark overlay, typographic list, fade transition, focus trap |
| B.3 | Create INDEX trigger (top-right) | ✅ DONE | `<button>` with `aria-expanded`, `--color-text-faint` → Dun on hover |
| B.4 | Integrate into `layout.tsx` | ✅ DONE | `Navigation.tsx` client wrapper in layout, before `{children}` |
| B.5 | Navigation state management | ✅ DONE | `useState` in Navigation.tsx, toggle/close callbacks |
| B.6 | Build + QA (keyboard accessibility, responsive) | ✅ DONE | Escape, Tab, focus trap. Tested 320–1920px. Zero build errors. |

### Phase D/E — Experiment Frame & Pagination ✅

| # | Item | Status | Notes |
|---|---|---|---|
| E.1 | ExperimentFrame component — grid layout with keylines, meta bars | ✅ DONE | 7-row CSS Grid, top/bottom keylines, top/bottom meta bars |
| E.2 | Pagination tiles (A–F) — replace scrolling | ✅ DONE | Only active section mounted; tiles 20px desktop, 28px mobile |
| E.3 | Section loader — fade + spinning arrow transition | ✅ DONE | 100ms fade-out → 350ms loader → 100ms fade-in |
| E.4 | 6 type variations (pruned from 12) | ✅ DONE | Drift, Proximity, Mouse Axes, Hover, Expand, Breathing |
| E.5 | Interactive controls — Speed, Easing, Shuffle | ✅ DONE | Context-driven, affects all sections via controlsRef pattern |
| E.6 | Mobile drawer for controls | ✅ DONE | Gear icon → slide-up drawer, backdrop dismiss |
| E.7 | Bottom meta bar — mirrors top placement | ✅ DONE | Section letter + name, 33px padding from keyline |
| E.8 | Mobile responsive — centered elements, larger type | ✅ DONE | 16vw type, 8px padding, centered meta/pagination |
| E.9 | Data model — sections array | ✅ DONE | `sections?: string[]` on Experiment interface |
| E.10 | Build + deploy | ✅ DONE | Zero errors, pushed to main |

### Section Deep Linking — Hash-Based URL Persistence

| # | Item | Status | Notes |
|---|---|---|---|
| DL.1 | Hash-based deep linking for experiment sections (`#B`, `#C`, etc.) | 🔵 SPEC WRITTEN | Spec: `Specs/SECTION_DEEP_LINKING.md`. Touches only `ExperimentFrame.tsx`. replaceState, case-insensitive, single-section guard. |

### ARC.4 — Theme Toggle (Carried from Phase 4)

| # | Item | Status | Notes |
|---|---|---|---|
| ARC.4.1 | Theme toggle: `DARK · LIGHT` in footer area or INDEX overlay | 🔲 TODO | `<head>` script already in place |
| ARC.4.2 | Verify light mode across all components | 🔲 TODO | |

---

## V2+ Backlog (Future)

| # | Item | Source | Notes |
|---|---|---|---|
| V2.1 | Generative background element | PRD V1 | Could be its own experiment |
| V2.2 | Sound layer — ambient, minimal, opt-in | PRD V1 | Future experiment |
| V2.3 | ~~Mouse-responsive axis experiment~~ | ✅ Phase E | Section C of Experiment 01 |
| V2.4 | Gradient fill wordmark experiment | Prototype session | Pruned from Exp 01, could be standalone |
| V2.5 | Outline → fill reveal experiment | Prototype session | Pruned from Exp 01, could be standalone |
| V2.6 | ~~Per-character proximity experiment~~ | ✅ Phase E | Section B of Experiment 01 |
| V2.7 | Layered echo experiment | Prototype session | Pruned from Exp 01, could be standalone |
| V2.8 | Freeze frame experiment | Prototype session | Pruned from Exp 01, could be standalone |
| V2.9 | Logo specimen grid page | Prototype session | `prototypes/hero-with-logo.html` — logo at multiple sizes |
| B.1 | Mood system v2 — width-safe axes only (GRAD, slnt, YTUC) | Phase 2 | Could enhance any experiment |
| B.2 | Verify Vercel Framework Preset = "Next.js" | Phase 1 | |
| B.3 | Confirm contact email address | Phase 3 | `hello@juanemo.com` is placeholder |
| B.4 | ~~Font preloading~~ | ✅ Phase C | Self-hosted in `public/fonts/`, preloaded in `<head>`, `font-display: block` |
| B.5 | Lighthouse audit: Performance 90+, Accessibility 95+ | Phase 5 | |
| B.6 | ~~Clean up vestigial `main` max-width rule~~ | ✅ Phase C | Removed |
| B.7 | ~~Remove `--hero-height` and `--max-width` CSS properties~~ | ✅ Phase C | Removed |
| B.8 | ~~Add close button to IndexOverlay for mobile~~ | ✅ Phase C | CLOSE button top-right, matches INDEX trigger style |
| B.9 | ~~Add placeholder experiments to test overlay density/scroll~~ | ⏸ SUPERSEDED | IndexOverlay deleted in Phase F. Drawer nav handles single experiment fine. |
| B.10 | Consider upgrading LogoMark `<a href="/">` → `<Link>` | Phase B builder | Full reload re-randomizes logo (nice touch), but `<Link>` would be smoother. Trade-off. |
| B.11 | Focus return to grid icon on drawer close | Phase F builder | Needs ref to grid icon passed through NavigationContext or `returnFocusRef` pattern. A11y compliance. |
| B.12 | Drag-to-dismiss on mobile bottom sheets | Phase F builder | Drag handle pill is visual-only. Needs `touchstart`/`touchmove`/`touchend` handling. Polish pass. |
| B.13 | Wire up carousel slide links | Phase F builder | `SpecialProject.url` field exists but clicks are no-ops. Wire to `window.open()` or `router.push()`. |
| B.14 | Delete ExperimentShell.tsx + CSS module | Phase D builder | Still on disk, never imported. Safe to remove. Noted since Phase D, still not cleaned up. |
| B.15 | Multi-experiment testing for drawer nav | Phase F builder | Only 1 experiment in data. Verify month grouping, active highlighting, and navigation when more are added. |
| B.16 | LogoMark — increase size ~10% and add letter-spacing | JC feedback | Feels tight at current size. Bump from 22px to ~24px, add slight tracking. Quick polish pass. |
| B.17 | DrawerNav mobile trigger overlaps pagination tile A at 320–375px | Phase G builder | "N" button bottom-left conflicts with bottom bar tiles. Move trigger to top bar grid icon on mobile, or adjust position. Not a Phase G regression — Phase F positioning issue. |
| B.18 | Keyboard navigation for pagination tiles (arrow keys) | Phase D/E + G builder | Arrow keys to cycle sections not implemented. A11y enhancement. |
| B.19 | Generalize `replayKey` pattern for frame-triggered section actions | Phase G builder | Currently only used for Section E Replay. If future sections need frame-triggered actions, abstract the pattern. |
| B.20 | ~~Show hint text on mobile — wrap to second line~~ | ⏸ ABSORBED → Phase H (H.7) | Rolled into Phase H — mobile hint visibility is part of the platform-aware instructions work. |

---

## Experiment Pipeline — Visual Jazz Series 🎷

Approved by JC on 2026-03-19. Twelve interactive experiments exploring jazz harmony, rhythm, and improvisation through visual interaction and Web Audio (Tone.js). Each experiment maps jazz theory concepts to collision, physics, or gestural interaction patterns. Mobile-first (gyro + touch), with mouse support on desktop.

### EXP-01: Generative Typography — Upgrade (Sound + Mobile Enhancement)

| # | Item | Status | Notes |
|---|---|---|---|
| GT.1 | **Ambient Typography Audio** — per-letter Tone.js voices mapped to axis values (wght→freq, wdth→filter, opsz→reverb) | ✅ DONE | `typographyAudio.ts` (204 lines). Per-letter Oscillator→Filter→Gain→Panner chain. Proximity boost +12dB (spec said +6dB — louder was needed). Opsz→gain offset approximation (not per-voice reverb). |
| GT.2 | **Haptic Feedback** — subtle vibration pulses on letter shifts (A), proximity enter (B), touch sweep (D) | ✅ DONE | A: 15ms, B: 20ms, D: 10ms. No haptic in C. Matches spec. |
| GT.3 | **Shake-to-Reset** — shake phone to shuffle (A) or replay (E) | ✅ DONE | DeviceMotion, 15 m/s² threshold, 2-sample window, 1s cooldown. 25ms haptic confirmation. |
| GT.4 | **Pinch-to-Optical-Size** — two-finger pinch in Section C maps to opsz axis (8–144) | ✅ DONE | Pointer event tracking. Desktop scroll wheel NOT implemented (would conflict with page scroll). |
| GT.5 | **Stillness Reward** — hold phone still 3s in Section B → letters settle, audio converges | ✅ DONE | 60-sample rolling average, 0.3 m/s² threshold, 3s duration. Lerps to midpoint axes. |
| GT.6 | **Screen Wake Lock** — prevent screen sleep during experiment (global) | ✅ DONE | navigator.wakeLock on mount, re-request on visibilitychange. |
| GT.7 | **Wire Section F Speed Control** — bind speed context to CSS animation-duration | ✅ DONE | `--breathe-duration` CSS variable. Noise layer gain synced to breath phase. |
| GT.8 | **Ambient-Reactive Color Shift** — dark mode/night = warm tones + triangle wave, light/day = cool + sine | ✅ DONE | matchMedia listener switches oscillator waveform. |

### EXP-02: Collision Changes (Jazz Harmony via Particle Collision)

| # | Item | Status | Notes |
|---|---|---|---|
| J.1 | Floating circles with chord tones — collisions trigger ii-V-I progressions | ✅ DONE | Tone.js PolySynth + triangle osc. 7 orbs per chord. Per-note colors (not per-function). Spec: `Specs/EXP02_COLLISION_CHANGES.md` |
| J.2 | Color-coded per-note (warm coral C, sky blue D, spring green E, golden F, lavender G, rose A, mint B) | ✅ DONE | Deviated from spec: per-note colors instead of per-harmonic-function. Better visual distinction. |
| J.3 | Mobile: tilt to shift gravity, tap to spawn new tones | ✅ DONE | Gyro gravity + touch spawn. Orb radius smaller on mobile (20–42px vs 30–65px). |
| J.4 | Save/export 30-second loop as audio + GIF | 🔲 TODO | Deferred to polish pass — not in initial spec. |
| J.4a0 | **Section A Tweaks:** Mobile settings push, chord dropdown, metronome, decay/reverb, responsive orbs, label fix | ✅ DONE | Spec: `Specs/EXP02_TWEAKS_A.md`. 6 tasks (T.1–T.6). Builder notes populated. |
| J.4a1 | **Section B: Piano Split** — split-screen bass/treble clef, stereo panning, dual synths, shared metronome | ✅ DONE | Spec: `Specs/EXP02_PIANO_SPLIT.md`. Inserts after A. Existing B–F shift to C–G. |
| J.4a | Section C (was B): Gravity Well — orbital physics, Kepler velocity, slingshot, tilt warps orbits | ✅ DONE | Spec: `Specs/EXP02_GRAVITY_WELL.md`. Builder notes: pass-through collisions, no edge bounces, no central glow, KEPLER_K=30, dashed orbit rings, mobile-specific radii. |
| J.4b | Section D: Flock — orbital leader-follower system, breathing rhythm, click-drag-shake, smooth flight trails | ✅ DONE | Deployed 2026-03-21. Evolved significantly from initial boids spec — see builder notes below. Component: `Flock.tsx`. |

**J.4b Builder Notes (EXP-02D Flock):**

The Flock section evolved significantly from the original boids spec through iterative creative direction with JC. Key deviations and architecture decisions:

**1. Physics: Orbital leader-follower replaced pure boids.** The initial boids implementation (separation/alignment/cohesion) caused orbs to either clump into a blob or scatter randomly — neither was musical. Through iteration, the physics was redesigned: one orb is the designated **leader** (always the root note) that wanders autonomously on smooth curves, and the other 6 orbs **orbit** it with elliptical paths at varying radii (70–195px), directions (alternating CW/CCW), and speeds. Boids forces (separation/alignment) are secondary, just preventing overlap. This creates visible swooping in-and-out motion that naturally generates cyclical collisions = rhythm.

**2. Breathing flock synced to tempo.** Cohesion and separation weights oscillate with each beat via cosine curve. Downbeat → cohesion surges (orbs contract, collide, chord burst). Between beats → separation rises (orbs spread, quiet). Creates rhythmic pulse tied to metronome BPM. Only activates after first chord pick. Constants: `COHESION_WEIGHT_MIN=0.0, COHESION_WEIGHT_MAX=0.6, SEPARATION_WEIGHT_MIN=0.8, SEPARATION_WEIGHT_MAX=1.8`.

**3. Leader movement: wander-circle technique.** Instead of "steer to random target" (which caused jerky direction changes), the leader uses a heading angle that slowly rotates via drifting angular velocity. Creates continuous S-curves like bird flight. Turn rate changes every 2–5s. `LEADER_MAX_STEER=0.035` ensures very gentle turning radius. When cursor is on canvas, leader gently steers toward it (followers orbit the leader, not the cursor directly). Soft edge avoidance at 18% margin.

**4. Click-drag-shake interaction.** JC requested the ability to grab and shake the leader like a musical instrument. Implementation: mousedown hit-tests orbs, grabbed orb follows cursor via lerp (0.25), others orbit it. Shake detection tracks cursor velocity — when speed > 8px/frame, triggers `playDyad()` with grabbed orb + random partner, and pushes nearby orbs outward (radial impulse within 200px). 150ms cooldown. Glow ring (6px offset, 25% note color) on grabbed orb.

**5. Smooth bezier flight trails.** JC requested dotted trace lines showing flight paths. Evolved through several iterations: tiny dots → colored dashed lines → DUN-colored dashed lines matching Piano Split style (`rgba(214,197,171)`, 1px, `[6,8]` dash pattern). Trail points stored as absolute canvas coordinates (60→150 max points). Rendered with `quadraticCurveTo()` through midpoints for smooth curves. NaN break markers on edge wraps prevent cross-screen artifacts while preserving trail continuity. Key bug fixed: `NaN > 2` is `false` in JS, so distance checks against NaN break markers silently killed trail recording — added explicit `isNaN()` guard.

**6. Leader always root note.** Voice-leading assignment pins the leader orb to target index 0 (root) before greedy-closest-freq assigns remaining orbs. Leader is visually larger (`ORB_RADIUS_MAX * 0.75`) with a directional arrow indicator (small triangle pointing in velocity direction, 35% DUN, 8px from edge).

**7. Elliptical orbits via oscillating radius.** Each orb's orbit radius oscillates sinusoidally: `baseRadius * (1 - 0.45 * sin(time * 0.0015 * speedMult + phaseOffset))`. Golden angle spacing (2.39996 rad) for phase offsets ensures no two orbs sync. Kepler-like speed factor (`sqrt(orbitRadius / distance)`) makes orbs faster at close approach. `ORBIT_DAMPING=0.993` smooths all curves.

**8. Collision audio: 300ms cooldown + 30ms stagger.** Shorter cooldown than other sections (300ms vs 600ms) because dense orbital passes should create frequent layered sounds. Multiple simultaneous collisions staggered by 30ms each via `setTimeout` so dyads layer into rich chords rather than firing as one event.

**9. `isLeader` field added to Particle type.** Optional boolean on the shared `types.ts` Particle interface. Only used by Flock section. Other sections unaffected.

**10. Patterns carried forward from Section C.** Pass-through collisions (no physical bounce), edge wrapping (not bouncing), mono synth path, custom chord dropdown, Georgia italic chord label, spawn spring animation, viewport-responsive orb sizing, pause when settings open, metronome on first chord pick.

**Known issues / future improvements:**
- Trail rendering uses `indexOf()` for alpha calculation — O(n) per segment, could precompute indices
- Shake detection uses raw cursor velocity, not acceleration — very fast smooth movement triggers it (could add direction-change detection)
- Mobile tilt steering for the leader not yet tested (gyro forces are wired but need tuning)
- Orbit radii don't adapt to viewport size (fixed px values)

| J.4c | Section E (was D): Magnets — consonance attracts, dissonance repels, chord change reshuffles relationships | ✅ DONE | Spec: `Specs/EXP02_MAGNETS.md`. Builder deviated significantly: spring equilibrium model replaced pure attract/repel, tangential orbiting prevents dead blobs, beat-synced breathing added despite spec saying no, collision energy bursts cascade. Mobile: drag+pin coexist via `touchDragged` flag. REST_DIST mobile-tuned (90–200px vs 130–320px desktop). |
| J.4d | Section F: Freeze & Release — tap to freeze (silence), release with velocity burst, longer freeze = bigger burst | ✅ DONE | Spec: `Specs/EXP02_FREEZE_RELEASE.md`. 10 deviations from spec — all improvements. Key additions: energy circle (replaces timer), shockwave ring with strum (plays each orb as it passes), shockwave physics push, ease-out burst, note duration variety (quarter/half/whole), auto-release at max energy. **Discovery: note duration variety is a major musical improvement — should backport to Sections A–E.** |
| J.4e | Section G: Rain — emitter mode, density via tilt/mouse, splash on landing, chord change wave coloring | ✅ DONE | 6 deviations — all improvements. Key changes: pass-through bottom (no bounce — cleaner than 3-bounce lifetime), elastic mid-air collisions with 1.4× boost (spec said pass-through), auto-play on first chord, tuned density 3–12/sec with 30 max particles, 50ms note gap (tighter than spec's 100ms). All 23 acceptance criteria passed. Component: `Rain.tsx`. |
| J.5 | **Pagination tile overflow** — scrollable tiles on mobile when 6+ sections | ✅ DONE | Spec: `Specs/PAGINATION_OVERFLOW.md`. Scrollable tile group with scroll-snap, gradient fade, auto-scroll to active tile (instant on first render, smooth after), ResizeObserver-tracked arrow visibility, 4px scroll threshold to prevent ghost arrows. ExperimentFrame.tsx + CSS only. 2 deviations: instant initial scroll (not smooth), ResizeObserver replaces manual needsScroll check. |
| J.6 | **Note duration variety — backport to Sections A–E** | ✅ DONE | Spec: `Specs/NOTE_DURATION_BACKPORT_BUILDER_PROMPT.md`. Duration tied to collision properties: A=velocity, B=register, C=orbital radius, D=leader proximity, E=consonance. Sections F+G already had varied durations. |
| GYRO.1 | **Gyro dead zone + iOS permission — backport to all gyro experiments** | ✅ DONE | Spec: `Specs/GYRO_UPGRADE.md`. All 10 gyro-using components upgraded. Dead zones: 0.04 (EXP-01 typography), 0.05 (wind/force), 0.06 (gravity), 0.08 (position), 0.10 (BPM). iOS permission toast on all experiments. `lib/gyroUtils.ts` shared utility. Toast style matched ThreeBody design (translucent warm tint + blur). |

### EXP-03: Giant Steps (Coltrane Changes via Circle of Fifths)

Inspired by John Coltrane's *Giant Steps* (1959). The Coltrane substitution divides the octave into three equal parts — key centers B, G, and E♭, each a major third apart — creating the "Coltrane Triangle" on the circle of fifths. Four sections exploring different visual interpretations of this harmonic system. Shares Tone.js + canvas foundation with EXP-02 but uses a fundamentally different progression and visual language.

| # | Item | Status | Notes |
|---|---|---|---|
| GS.1 | **Section A: Coltrane Circle** — 12 keys on a circle, dynamic chord triangle, staggered sax notes on each change | ✅ DONE | Spec: `Specs/EXP03_GIANT_STEPS.md`. Builder prompt + notes: `Specs/EXP03_COLTRANE_CIRCLE_BUILDER_PROMPT.md`. Shared infra built: `types.ts`, `giantStepsChordData.ts`, `useGiantStepsProgression.ts`, `GiantStepsSwitch.tsx`. 11 deviations — see builder notes below. |
| GS.2 | **Section B: Three-Body Problem** — circle-of-fifths chord-tone targeting, wave-based stagger, gyro triad rotation | ✅ DONE | Builder prompt + notes: `Specs/EXP03_THREE_BODY_BUILDER_PROMPT.md`. 9 major deviations: easing replaced springs, wave stagger for triads, harmonic filtering, circle layout (not free-space), gyro dead zone + triad rotation, auto-play desktop. Fixed iOS gyro bug (BUG-1) in `useDeviceOrientation.ts`. See builder notes below. |
| GS.3 | **Section C: Chromatic Bridges** — chord-shape Bézier arcs on circle of fifths, pen draw-in animation, dissolving ghost arcs | ✅ DONE | Builder prompt: `Specs/EXP03_CHROMATIC_BRIDGES_BUILDER_PROMPT.md`. Major reimagining: chord arcs (root→3rd→7th) replace zone-to-zone bridges. No bridge detection logic. Orbs reduced to tiny flow particles. Sax engine expanded to 3 voices (sax/piano/bass) with shared reverb/delay/chorus bus. See builder notes below. |
| GS.4 | **Section D: Mirror Symmetry** — 2-fold rotational symmetry, radial spoke layout, sector-crossing steel drum audio | ✅ DONE | Builder prompt: `Specs/EXP03_MIRROR_SYMMETRY_BUILDER_PROMPT.md`. Key changes: 2-fold (180°) not 3-fold (120°), spoke lines through center, sector-crossing triggers notes (not alignment events), drone synth on key root, hue-shifted orb colors, dotted octave zone rings. See builder notes below. |

**GS.1 Builder Notes (EXP-03A Coltrane Circle):**

The builder radically reimagined Section A. The core circle-of-fifths layout and BPM-driven progression are faithful to spec, but the visual system was replaced entirely. 11 deviations documented in the builder prompt file. Key decisions:

**1. No orbs — dynamic chord triangle only.** Spec called for 7 orbs with slingshot physics between key centers. Builder removed orbs entirely, replacing them with a single animated triangle whose vertices connect the root, 3rd, and 7th of the current chord on the circle of fifths. Triangle shape changes per chord type (maj7 = wide, dom7 = mid, min7 = narrow). Smooth angular lerp (0.18 speed) with shortest-path wrapping prevents overshoot. The builder noted: "Sections B (Three-Body) and D (Mirror Symmetry) are explicitly orb-based, so they make sense there."

**2. Custom sax engine (`saxEngine.ts`).** Instead of reusing EXP-02's `audioEngine.ts` FMSynth, built a tenor sax timbre: `fatsawtooth` (count 2, spread 8) → Distortion (0.25, 40% wet) → Peaking EQ 900Hz (Q=3, +8dB "sax honk") → Lowpass 1400Hz (-24dB/oct) → FeedbackDelay (120ms) → Reverb (2.5s, 28% wet). Notes played at `freq/2` for tenor range. Creative homage to Coltrane's instrument.

**3. Staggered ascending triad on chord change.** Root → 3rd → 7th play as a rising sequence, not simultaneous. Stagger interval is BPM-adaptive: `Math.max(40, Math.min(150, (60000 / bpm) * 0.25))`. Each note triggers a vertex pulse (scale 2.0→1.0) and shockwave ring at its circle position.

**4. BPM slider replaces mouse-Y-to-tempo.** Range input (80–320 BPM) instead of continuous mouse position mapping. Mobile gyro beta still controls BPM. Slider styled with `--color-dun` token.

**5. Volume slider popup — global addition.** Added `volume` (0–1) to `ExperimentControlsContext`. Popup volume slider syncs to `Tone.getDestination().volume` via `20 * Math.log10(volume)` dB conversion. This is a cross-experiment UI addition — all future experiments inherit it.

**6. `setMetronomeVolume(db)` added to shared `audioEngine.ts`.** Allows per-experiment metronome levels. Section A sets it to -30dB (very quiet behind sax).

**7. Active pitch class highlighting.** Circle labels for notes in the current chord glow in the key center color. Non-active notes stay dim. Updates per chord change.

**8. MIN_NOTE_GAP = 60ms** (spec said 100ms). Tighter for the staggered triad to sound like a phrase.

**Architectural impact on Sections B/C/D:** Shared infra is in place (`types.ts`, chord data, progression hook, section switch). B/C/D builders should use the sax engine (or build their own sound), note the volume control in context, and decide independently whether orbs fit their section's concept.

**GS.2 Builder Notes (EXP-03B Three-Body):**

Fundamentally reimagined from free-space gravity to circle-of-fifths chord-tone targeting. 9 deviations, all improvements. Full notes in `Specs/EXP03_THREE_BODY_BUILDER_PROMPT.md`.

**Key architectural decisions:** Easing model replaced spring physics (prevents vibration at rest). Wave-based stagger (1 from each group per wave = triad hits). Harmonic filtering (chord tones full, scale tones soft, chromatic silent). Group-based note durations (root=1n, 3rd=2n, 7th=4n). Wait-for-settle + 400ms hold before next chord.

**Mobile gyro system (new pattern):** Dead zone (0.08 = ~5° from level). Gamma tilt rotates triad around circle. Toast permission flow for iOS. Desktop is auto-play only (no mouse interaction). This gyro pattern is superior to all existing experiments — see GYRO.1 backlog item.

**BUG-1 (iOS gyro):** `useDeviceOrientation` hook dropped the listener after iOS permission grant. Auto-attach effect only checked `'not-required'`, not `'granted'`. Fixed — now checks both. **All experiments that use gyro on iOS benefit from this fix automatically** since they share the hook.

**Files:** `ThreeBody.tsx` (created), `GiantStepsSwitch.tsx` (modified), `saxEngine.ts` (added duration param), `experiments.ts` (Section B config), `useDeviceOrientation.ts` (BUG-1 fix).

**GS.3 Builder Notes (EXP-03C Chromatic Bridges):**

Reimagined bridges as chord-shape arcs on the shared circle-of-fifths layout. The spec's zone-to-zone Bézier bridges were replaced entirely.

**1. Chord arcs replace bridges.** Each chord spawns 3 Bézier arcs connecting root→3rd→7th on the circle of fifths, forming a triangular shape. New shapes draw in with a pen animation (`DRAW_IN_SPEED = 0.06`), old shapes dissolve over 2.5s with fade-out. No ii-V-I bridge detection logic — every chord gets arcs.

**2. No orbs on bridges.** Spec called for orbs traveling along bridge paths. Builder stripped orbs to tiny flow particles (4–8px) that drift along arc segments. Line 581: `// 3. (Orbs removed — arcs only)`. The arcs themselves are the visual.

**3. Spring bounce on spawn.** New arcs overshoot inward (0.7 amplitude, 5 oscillations) then settle, giving a plucked-string quality. Dissolving arcs skip the bounce.

**4. Filled chord shape.** Once arcs fully draw in, the enclosed triangular area fills with 12% key center color (25% when dissolving as ghost).

**5. Sax engine expanded to 3 voices.** `saxEngine.ts` now has sax (gritty reed), piano (bright percussive), and bass (deep sub) voices sharing a reverb/delay/chorus bus. Root→bass, 3rd→piano, 7th→sax. Major shared infrastructure change.

**6. Mouse/gyro → arc curvature.** Desktop: mouse distance from center shifts Bézier control points radially. Mobile: gamma tilt shifts control points. Creates interactive warping of the chord shapes.

**7. No tap-to-force-resolution or zone-tap interaction.** Tap only starts audio. Simpler interaction model.

**Files:** `ChromaticBridges.tsx` (644 lines, created), `saxEngine.ts` (rewritten — 3-voice engine), `GiantStepsSwitch.tsx` (wired activeSection === 2).

**GS.4 Builder Notes (EXP-03D Mirror Symmetry):**

Heavily JC-directed through hand-drawn sketches and real-time feedback. 8 deviations from spec, most requested by JC during the build session.

**1. 2-fold symmetry (180°) not 3-fold (120°).** JC clarified with a hand-drawn sketch — wanted each spoke line to connect an orb to its mirror on the opposite side of center, not 3 rotational copies. `MIRROR_ANGLES = [0, Math.PI]` = 14 visible orbs, not 21.

**2. Fixed-radius rotating formation.** Orbs at fixed distances from center (35–340px desktop), whole formation rotates toward active key center via angular lerp. No spring physics, no velocity. Per-orb stagger on lerp speed + selfSpin drift for variety.

**3. No alignment events.** JC explicitly disliked orbs regrouping: "I don't like it when they regroup in the middle." Converge→unison→split removed entirely.

**4. No glow/flash/flicker.** JC: "lets remove the glow and the flicker." Clean rendering — fill + stroke at consistent opacity.

**5. Steel drum spatial audio.** JC: treat the background "like a steel drum with more notes from the center out." Distance from center → octave (close=2x/piano, mid=sax, far=0.5x/bass). Notes triggered by sector boundary crossings, not chord changes. Rate-limited 120ms per orb.

**6. Spoke lines through center.** JC: "the lines look like they connect to the center instead of passing through the center." Spoke lines now pass through center connecting real↔mirror.

**7. Drone synth.** Continuous sine tone at active key center root (B2/G2/E♭3). Ramps smoothly over 0.8s on key change. -18dB through 0.06 gain. Harmonic anchor underneath steel drum pings.

**8. Sector-aware orb coloring + hue shifts.** Orb color determined by which sector it's currently in (changes as formation rotates). Per-orb hue offsets (-25° to +28°) create rainbow variation within each key center's color family.

**Key lesson:** User communicates visually — hand-drawn sketches resolved spatial/layout ambiguities faster than text descriptions.

**Files:** `MirrorSymmetry.tsx` (679 lines, created), `GiantStepsSwitch.tsx` (wired activeSection === 3).

### EXP-04: Walking Line (Generative Bass Line) *(was EXP-03)*

| # | Item | Status | Notes |
|---|---|---|---|
| J.5 | Continuous walking bass line drawn by cursor/finger path | 🔲 TODO | Tone.js bass synth. Path = pitch contour following chord changes. |
| J.6 | Line thickness = velocity, color = chord tone vs chromatic passing tone | 🔲 TODO | Visual distinction between chord tones and approach notes. |
| J.7 | Auto-accompaniment: comping chords + ride cymbal triggered by line | 🔲 TODO | |
| J.8 | Mobile: draw with finger, tilt for tempo rubato | 🔲 TODO | |

### EXP-05: Swing Pendulums (Rhythm & Swing Feel) *(was EXP-04)*

| # | Item | Status | Notes |
|---|---|---|---|
| J.9 | Array of pendulums with adjustable swing ratio | 🔲 TODO | Slider from straight 8ths (50/50) to hard swing (75/25). Visual: pendulums sync to ratio. |
| J.10 | Pendulum collisions trigger percussion hits (ride, snare, kick, hi-hat) | 🔲 TODO | Tone.js drum sampler. |
| J.11 | Drag to adjust individual pendulum length (polyrhythm) | 🔲 TODO | Different lengths = different periods = layered rhythms. |
| J.12 | Mobile: tilt to shift gravity angle, tap to add/remove pendulums | 🔲 TODO | |

### EXP-06: Call & Response (Interactive Improvisation) *(was EXP-05)*

| # | Item | Status | Notes |
|---|---|---|---|
| J.13 | AI plays a phrase (the "call"), user responds by drawing/gesturing | 🔲 TODO | Claude generates melodic phrases from a scale. User's gesture interpreted as pitch+rhythm. |
| J.14 | Visual: call appears as a wave/ribbon, response overlaid in contrasting color | 🔲 TODO | |
| J.15 | AI adapts next call based on user's response pattern | 🔲 TODO | Simple Markov or rule-based adaptation. |
| J.16 | Mobile: swipe gestures for pitch, tap rhythm for timing | 🔲 TODO | |

### EXP-07: Blue Notes (Microtonal Pitch Bending) *(was EXP-06)*

| # | Item | Status | Notes |
|---|---|---|---|
| J.17 | Grid of notes from blues scale — drag between to bend pitch continuously | 🔲 TODO | Tone.js with pitch bend. Visual: note circles stretch/distort during bend. |
| J.18 | Ripple interference patterns where bent notes overlap | 🔲 TODO | Overlapping ripples create visual moiré. |
| J.19 | Background chord changes on a timer, grid highlights available blue notes | 🔲 TODO | |
| J.20 | Mobile: pressure-sensitive bend (if available) or drag distance | 🔲 TODO | |

### EXP-08: The Rhythm Section (Collaborative Groove Builder) *(was EXP-07)*

| # | Item | Status | Notes |
|---|---|---|---|
| J.21 | Four lanes (piano, bass, drums, horn) — tap to place/remove hits on a looping grid | 🔲 TODO | Step sequencer with jazz voicings. Tone.js multi-instrument. |
| J.22 | Swing knob affects all lanes simultaneously | 🔲 TODO | Global swing ratio 50–75%. |
| J.23 | AI auto-fills complementary parts when user edits one lane | 🔲 TODO | Rule-based jazz comping patterns. |
| J.24 | Mobile: swipe lanes to randomize, pinch to zoom timeline | 🔲 TODO | |

### EXP-09: Chord Pool (Harmonic Ripple Pond) *(was EXP-08)*

| # | Item | Status | Notes |
|---|---|---|---|
| J.25 | Tap anywhere to drop a chord into a "pond" — ripples emanate outward | 🔲 TODO | Tone.js chord voicing. Ripple radius = sustain. Color = chord quality (maj/min/dom/dim). |
| J.26 | Overlapping ripples create harmonic interference (consonance/dissonance) | 🔲 TODO | Visual + audio: blending where ripples cross. |
| J.27 | Chord palette cycles through a jazz standard progression | 🔲 TODO | User chooses when to drop each chord. |
| J.28 | Mobile: tap to drop, tilt to shift voicing (close vs open) | 🔲 TODO | |

### EXP-10: Solo Painter (Gestural Improvisation Canvas) *(was EXP-09)*

| # | Item | Status | Notes |
|---|---|---|---|
| J.29 | Freeform painting where stroke = melodic line over backing track | 🔲 TODO | X = time, Y = pitch, speed = dynamics. Tone.js solo instrument (trumpet/sax). |
| J.30 | Brush style changes with scale mode (pentatonic, bebop, blues) | 🔲 TODO | Visual: different stroke textures per scale. |
| J.31 | Backing track auto-generated: walking bass + comping + drums | 🔲 TODO | Tone.js Transport for sync. |
| J.32 | Mobile: finger painting with gyro for vibrato | 🔲 TODO | |

### EXP-11: Quintet (Jazz Ensemble Interaction) *(NEW)*

Five instruments — piano, bass, trumpet, sax, drums — each with distinct visual identity and sonic character. The user conducts an ensemble. Explores multi-voice interaction, spatial audio, and the social dynamics of a jazz group.

| # | Item | Status | Notes |
|---|---|---|---|
| QT.1 | **Section A: Bandleader** — five autonomous instrument agents, each with generative behavior (piano comps, bass walks, drums keep time, horns solo). Tilt/drag to give energy to one instrument and quiet others. You're conducting. | 🔲 TODO | Tone.js multi-instrument (PolySynth piano, MonoSynth bass, FMSynth trumpet, AMSynth sax, NoiseSynth+MetalSynth drums). Mobile: tilt toward an instrument to feature it. |
| QT.2 | **Section B: Spatial Stage** — place five instruments in a virtual room. Spatial audio via PannerNode. On mobile: DeviceOrientation rotates the listener — turn your head to hear different instruments. With headphones, the band is in the room with you. | 🔲 TODO | HRTF panning model. Drag to reposition instruments on desktop. Mobile: orientation → AudioListener rotation. The most headphone-forward section. |
| QT.3 | **Section C: Trading Fours** — instruments take turns playing 4-bar generative phrases, then hand off. Tap the instrument you want to solo next. Others comp underneath. Visual: spotlight follows the soloist, others dim. | 🔲 TODO | Generative phrase engine per instrument (scale-based Markov or pattern library). Transport-synced 4-bar phrases. |
| QT.4 | **Section D: Collective Improv** — all five instruments play simultaneously with rule-based interaction: when one gets loud, others get soft. When bass walks up, piano moves down. Emergent conversation. User controls global energy (tilt = intensity, stillness = breakdown). | 🔲 TODO | Rule-based ensemble AI. P10 (Stillness Reward): hold still → breakdown, only drums + bass. Shake → full ensemble crescendo. |

### EXP-12: Windchimes (Physical Sound Sculpture) *(NEW)*

Geometric shapes hanging at different lengths — circles, triangles, hexagons — each with a unique timbre. Wind makes them sway and collide. Blow into the phone's microphone to create wind. Tilt to change wind direction. The most mobile-native experiment: the phone becomes a physical instrument you breathe into.

| # | Item | Status | Notes |
|---|---|---|---|
| WC.1 | **Section A: Breath** — shapes hang from top of screen at varying lengths. Microphone input (AnalyserNode amplitude, NOT SpeechRecognition) detects blowing — sustained breath = steady wind, short puff = gust. Shapes sway and collide, producing tones on impact. Different shapes = different timbres: circle = bell (sine), triangle = glass (FM), hexagon = wood (noise burst + filter). | 🔲 TODO | Mic permission flow. Amplitude threshold to distinguish breath from background noise. Physics: pendulum motion per shape, collision detection between adjacent shapes. |
| WC.2 | **Section B: Wind Garden** — tilt controls wind direction and strength (gamma = direction, beta = intensity). No microphone. Shapes sway in the "wind" created by tilting. Multiple sets of chimes at different positions create a spatial windchime garden. | 🔲 TODO | Spatial audio: chime sets positioned L/C/R. Tilt sweeps wind across the garden. Gentle ambient mode — set phone down and let random gentle breezes play. |
| WC.3 | **Section C: Builder** — drag shapes to reposition. Pinch to resize (bigger = lower pitch). Rotate phone to change hanging angle. Closer shapes collide more frequently = more active. Design your own chime arrangement, then let the wind play it. | 🔲 TODO | P3 (Pinch) to resize shapes. P4 (Rotate) to adjust arrangement. Export/share chime configuration via URL params. |
| WC.4 | **Section D: Ambient Listener** — microphone stays on, but listens to the ENVIRONMENT (not just breath). Room noise drives the chimes — loud room = active, quiet room = occasional single tone. The experiment responds to your world. | 🔲 TODO | AnalyserNode frequency bands: low rumble → slow deep sway, high speech → quick light movement. AmbientLightSensor (P9) for visual palette: dark room = warm glow, bright = cool silver. |

### EXP-13: Strings (Tactile Instrument) *(NEW)*

Strings stretched across the screen. Swipe to strum. Press to pluck. Tilt to bend pitch. The most instrument-like experiment — the phone becomes a playable thing. Explores the physicality of string vibration, resonance, and the relationship between gesture and sound.

| # | Item | Status | Notes |
|---|---|---|---|
| ST.1 | **Section A: Open Strings** — 4–6 horizontal strings tuned to a chord. Swipe across to strum (swipe velocity = volume, direction = up/down strum order). Tap a single string to pluck. Visible string vibration decays with the audio. Touch pressure (P5) controls velocity. | 🔲 TODO | Tone.js PluckSynth or Karplus-Strong synthesis for realistic string timbre. Canvas rendering: vibrating string as sine wave with decaying amplitude. Strings spaced evenly across viewport. |
| ST.2 | **Section B: Fretboard** — tap points along a string to shorten it (higher pitch). The string visually shortens with a "finger" contact point. Slide finger up/down the string for pitch bend / slide. Combine with strum for melody + rhythm. | 🔲 TODO | Frequency = baseFreq × (stringLength / frettedLength). Multi-touch: one finger frets, another hand strums. Two-hand playing on a single device. |
| ST.3 | **Section C: Reverb Room** — tilt the phone to change the virtual room size. Flat = dry/intimate. Tilted forward = huge cathedral reverb. The visual background shifts: close wood grain → stone walls → vast open space. The same strum sounds radically different in each space. | 🔲 TODO | Tone.js Reverb with dynamic decay (0.5s dry → 8s cathedral). Convolution reverb if samples available. Visual: background parallax layers shift with tilt. P1 (Tilt) mapped to reverb size + visual depth. |
| ST.4 | **Section D: Resonance** — multiple strings tuned to harmonically related notes. Pluck one and watch sympathetic resonance: other strings that share harmonics vibrate slightly too (visible + audible). Demonstrates overtone series physically. | 🔲 TODO | When a string is plucked, other strings with shared harmonics (octave, 5th, 3rd) vibrate at reduced amplitude. Visual: ghost vibration on sympathetic strings. The more consonant the relationship, the more they resonate. |

---

## Experiment Pipeline — Stock Collage Series ✂️

Approved by JC on 2026-03-19. Four sections of a single "Stock Collage" experiment (EXP-04) using free stock photography as raw material. Curated Unsplash CDN URLs — no API key needed.

**⚠ Planner note (2026-05-12):** the **shipped Section A drifted significantly from the original spec** through JC iteration. The original framing (manual exquisite-corpse compose flow, AI-free user picking, no audio) does not match what's live. Section A is now a **generative slice abstract** — auto-picked photos, auto-rerun every 15s, pentatonic chime audio, tap a band to reroll, no buttons. **Sections B/C/D specs are unchanged and still describe the original "user picks everything" model.** Before kicking off B/C/D builders, re-spec them (or write delta specs) so they fit the new identity. See `Specs/STOCK_COLLAGE_EXQUISITE_SEARCH_BUILDER_PROMPT.md` § "Builder Notes" for the full pivot trail.

### Section A: Exquisite Search ✅ SHIPPED (commit `9e74bf4`)

**Identity pivoted through ~12 rounds of JC creative direction.** Final form: *generative slice abstract*, not a manual exquisite-corpse compose flow. Shared infra still lands as planned for Sections B–D.

| # | Item | Status | Notes |
|---|---|---|---|
| C.1 | Horizontal bands of curated Unsplash photos | ✅ SHIPPED | **6 / 12 / 18 / 24 / 36 bands** (default 36). Each band auto-picks a random image; the user never picks. Shared infra `ImagePicker.tsx` shipped but unused in A — available for B/C/D. |
| C.2 | ~~Fold mechanic, active band slivers, COMPOSE→READY state machine~~ | ⏸ DROPPED | Replaced by auto-pick. No manual compose, no slivers, no Reveal button. Phases collapsed to `compose` (preloading) → `revealing` → `complete`. |
| C.3 | Entrance animation — bands slide in top-to-bottom | ✅ SHIPPED | **Not** the 3D fold — multi-stop spring keyframes via Web Animations API. Starts 180px right + opacity 0, slides in with overshoot/back-and-forth shimmy, 320ms × 35ms stagger (36 bands ≈ 1.6s total). |
| C.4 | ~~Claude picks middle band~~ | ⏸ DROPPED (per original spec) | |
| C.5 | Shake mode / shuffle | ✅ SHIPPED (auto) | **15s auto-rerun** does the global re-shuffle. **Tap any band** rerolls just that one (animated with same shimmy). Mobile shake also triggers full reshuffle. **Shuffle button removed** — UI is now buttonless. |
| C.6 | Export composite as single image | 🟡 INFRA ONLY | `useCollageExport.ts` shipped (used by future sections). Export button removed from Section A — section is now ambient-art-piece, not save-it-yourself tool. Re-add the button later if A needs export. |
| C.7 | **New:** Slice mode — extract a small patch + stretch to fill band | ✅ SHIPPED | The abstraction engine. Patch 10–25% wide × 2–6% tall, stretched to band rect. Plus `Cover` / `Stretch` modes in the panel (segmented control). Default = Slice. |
| C.8 | **New:** Per-band random width + horizontal offset | ✅ SHIPPED | Each band's width is 25–75% of viewport (capped well short of full-width per JC), random X position. Re-rolled on pick. |
| C.9 | **New:** Audio — pentatonic chime per band | ✅ SHIPPED | `audioEngine.ts`: soft triangle synth + reverb, -20dB. One note per band's slide-in (random within C5–G6 pentatonic). Master volume + mute via existing speaker control. |
| C.10 | **New:** Image preload before reveal | ✅ SHIPPED | Bands hidden via `opacity: 0` during a `'compose'` preload window; phase flips to `'revealing'` once all images are in cache (or 2s timeout). Prevents the "image pops in mid-animation" artifact. |

**Settings panel controls:** Ratio (Equal / Golden / Cinema), Bands (6 / 12 / 18 / 24 / 36), Mode (Slice / Stretch / Cover). Feather control was removed — sharp seams between bands.

**Files shipped:**
- `components/experiments/StockCollage/ExquisiteSearch.tsx` + `.module.css` — Section A
- `components/experiments/StockCollage/StockCollageSwitch.tsx` — section router
- `components/experiments/StockCollage/types.ts` — shared types, ratio generator, slice generator, band-shape generator, reveal keyframes
- `components/experiments/StockCollage/audioEngine.ts` — pentatonic chime synth
- `components/experiments/StockCollage/ImagePicker.tsx` + `.module.css` — gallery picker (unused by A, intended for B–D)
- `components/experiments/StockCollage/useCollageExport.ts` — canvas → PNG download helper (unused by A, intended for B–D)
- `lib/ExperimentControlsContext.tsx` — added `feather`, `bandRatio`, `bandCount`, `mode` context fields (collage-specific, follows the same pattern as the jazz-only fields `tempo`/`decay`/etc.)
- `components/ExperimentFrame.tsx` + `.module.css` — panel UI for new controls
- `data/experiments.ts` — `stock-collage` experiment entry (#04)
- `app/experiments/[slug]/page.tsx` — route registration

### Section B: Slice & Stack (Hockney-Style Strip Collage)

| # | Item | Status | Notes |
|---|---|---|---|
| C.7 | Pick 2–4 images, slice into vertical strips (8/12/16/24) | 🔵 SPEC WRITTEN | Spec: `Specs/STOCK_COLLAGE_SLICE_STACK_BUILDER_PROMPT.md`. drawImage with source cropping. |
| C.8 | Drag strips to recompose — snap to grid | 🔵 SPEC WRITTEN | 1px gaps + drop shadows. Desktop click-drag + mobile touch-drag. |
| C.9 | Auto-shuffle — randomly interleave strips from all images | 🔵 SPEC WRITTEN | Fisher-Yates shuffle, animated 300ms transition. |
| C.10 | Sort by hue — rearrange strips by dominant color | 🔵 SPEC WRITTEN | Median hue from sampled pixels. Animated 400ms transition. |
| C.11 | Vertical offset per strip — wave/staircase/random modes | 🔵 SPEC WRITTEN | 0–60px slider + 4 offset modes. |
| C.12 | ~~Claude identifies continuation opportunities~~ | ⏸ DROPPED | No AI curation — user arranges everything manually. |
| C.13 | Export strip collage | 🔵 SPEC WRITTEN | Includes gaps, shadows, offsets in export. |

### Section C: Color Bleed (Chromatic Merge)

| # | Item | Status | Notes |
|---|---|---|---|
| C.14 | Place 2 stock photos side by side on canvas | 🔵 SPEC WRITTEN | Spec: `Specs/STOCK_COLLAGE_COLOR_BLEED_BUILDER_PROMPT.md`. Side-by-side / top-bottom / diagonal layouts. Pan to reposition. |
| C.15 | Real-time bleed effect — colors merge at boundary (CIE Lab distance) | 🔵 SPEC WRITTEN | Canvas 2D pixel manipulation (not WebGL). Hermite interpolation. Boundary-strip-only processing for performance. |
| C.16 | Bleed radius control (10–120px) | 🔵 SPEC WRITTEN | How far merge extends from split line. |
| C.17 | Color tolerance control (5–80 Lab distance) | 🔵 SPEC WRITTEN | Low = surgical, high = impressionist. |
| C.18 | ~~Claude ranks photos by bleed potential~~ | ⏸ DROPPED | No AI curation. |
| C.19 | Export blended collage | 🔵 SPEC WRITTEN | Snapshot of current bleed state. |
| C.20 | **Always-alive:** mouse/tilt shifts bleed boundary + idle oscillation | 🔵 SPEC WRITTEN | Lerp 0.08, dead zone 0.06. Gentle sine breathing when idle. |

### Section D: Depth Sandwich (Parallax Diorama)

| # | Item | Status | Notes |
|---|---|---|---|
| C.21 | Pick 3–5 stock photos, generate depth maps client-side | 🔵 SPEC WRITTEN | Spec: `Specs/STOCK_COLLAGE_DEPTH_SANDWICH_BUILDER_PROMPT.md`. TensorFlow.js MiDaS or pseudo-depth fallback. |
| C.22 | Peel each photo into 3 depth layers (fg/mid/bg) with feathered edges | 🔵 SPEC WRITTEN | 8px gradient feather between layers. |
| C.23 | Interleave layers from different images by depth plane | 🔵 SPEC WRITTEN | All foregrounds compete for front, all backgrounds recede. |
| C.24 | **Always-alive parallax** — gyro (mobile) or mouse (desktop) | 🔵 SPEC WRITTEN | Foreground fast, background slow. Lerp 0.08, dead zone 0.06. Idle sway ±3px. 10% overscale prevents edge reveal. |
| C.25 | ~~Claude suggests figure-ground swap combinations~~ | ⏸ DROPPED | No AI curation. |
| C.26 | Export as still composite | 🔵 SPEC WRITTEN | Snapshot PNG at current parallax position. |

---

## V3.0 — Experiment Frame & Navigation Redesign (JC Feedback)

### EXP — Experiment Frame (Points 1, 2, 6)

| # | Item | Status | Notes |
|---|---|---|---|
| EXP.1 | ~~Experiment metadata layer~~ | ✅ Phase E | Top meta bar (01 + title), bottom meta bar (section letter + name) |
| EXP.2 | ~~Keylines above and below~~ | ✅ Phase E | Two 1px keylines in the grid layout |
| EXP.3 | ~~Scrollable experiment container~~ | ✅ Phase E | Replaced with pagination tiles (JC direction — no scrolling) |
| EXP.4 | ~~Interactive controls~~ | ✅ Phase E | Speed, Easing, Shuffle — mobile drawer pattern |
| EXP.5 | ~~Small type, Bittersweet pops, metadata~~ | ✅ Phase E | DM Sans 9–11px, Bittersweet for active states + exp number, Dun at 25–50% opacity |

### NAV — Navigation Redesign (Points 3, 4, 5)

| # | Item | Status | Notes |
|---|---|---|---|
| NAV.1 | ~~Replace INDEX text with icon~~ | ✅ Phase D/E | Grid icon (2×2 squares) already in ExperimentFrame top bar |
| NAV.2 | ~~Zoom-out navigation transition~~ | ⏸ SUPERSEDED | Zoom interaction rejected during prototyping — felt buggy. Replaced by drawer nav (Phase F). |
| NAV.3 | Navigation in light mode (Bone background) | ✅ Phase F | Drawer uses Bone background, creating the Gunmetal→Bone perceptual shift. |
| NAV.4 | ~~Navigation as experiment tile grid~~ | ⏸ SUPERSEDED | Replaced by chronological list with thumbnails in drawer (Phase F). Better for growing experiment count. |

### Phase H — Mobile Interaction: Gyroscope + Touch ✅

| # | Item | Status | Notes |
|---|---|---|---|
| H.1 | `useDeviceOrientation` hook — gyro API with iOS permission, smoothing, normalization | ✅ DONE | `lib/useDeviceOrientation.ts`. Lerp 0.15, beta [-45,45], gamma [-30,30], normalized 0–1. Own RAF loop. |
| H.2 | Permission UI — "Enable Motion" inline hint action | ✅ DONE | Appears when `permissionState === 'prompt'` && `isAvailable`. Disappears after grant/deny. |
| H.3 | Section B mobile — gyro proximity | ✅ DONE | Tilt → virtual cursor, feeds existing proximity calc. Mobile attractor uses `AXIS_RANGES_MOBILE` caps. Touch fallback. |
| H.4 | Section C mobile — gyro axis mapping | ✅ DONE | Gamma→wdth/opsz, beta→wght. Touch fallback on denial. |
| H.5 | Section D mobile — touch sweep | ✅ DONE | 40px radius, `touchstart`/`touchmove`/`touchend`. CSS `:hover` scoped to `(hover: hover) and (pointer: fine)`. |
| H.6 | Mobile detection — interaction mode refs | ✅ DONE | `modeRef` per section (not standalone helper). Set on mount, upgraded to `'gyro'` reactively on permission grant. |
| H.7 | Platform-aware hint text + instructions + B.20 visibility | ✅ DONE | `hintMobile`, `instructionsMobile` in SectionConfig. Hint visible on mobile via `flex-wrap`. 44px tap targets. |
| H.8 | Gyro fallback after permission denied | ✅ DONE | Hint swaps to "Drag across the letters", touch fallback activates automatically. |
| H.9 | Build + QA | ✅ DONE | Zero errors. Desktop unchanged. |

### Phase G — Settings Panel & Frame Redesign ✅

| # | Item | Status | Notes |
|---|---|---|---|
| G.1 | Restructure grid from 7-row to 6-row | ✅ DONE | `auto 1px 1fr 0px 1px auto` — old bottom meta bar removed |
| G.2 | Floating meta labels inside viewport | ✅ DONE | Absolute-positioned, 60px from keylines (32px mobile), centered |
| G.3 | Bottom bar — pagination tiles + gear only | ✅ DONE | 40×40px tiles, 1px bordered, no inline controls |
| G.4 | Expanding settings panel (grid-row animation) | ✅ DONE | Row 4 grows from 0px → 260px (320px mobile), expo-out easing |
| G.5 | Panel left column — about + instructions | ✅ DONE | Section label, description, icon+text instruction items |
| G.6 | Panel right column — per-section controls | ✅ DONE | Only controls the section declares; "no controls" fallback |
| G.7 | Per-section data model (SectionConfig) | ✅ DONE | `sectionConfigs` array in `data/experiments.ts`, top-level export |
| G.8 | Remove old mobile controls drawer (BottomSheet) | ✅ DONE | BottomSheet.tsx + CSS deleted. Expanding panel is universal. |
| G.9 | Open/close behavior + escape key | ✅ DONE | Gear toggles, Escape closes, section switch keeps panel open |
| G.9a | Preserve section transition loader | ✅ DONE | Spinning arrow works in new 6-row grid, centers in shorter viewport when panel open |
| G.10 | Mobile responsive (≤600px) | ✅ DONE | Panel stacks vertically, hints hidden, 32px label offset |
| G.11 | Build + QA | ✅ DONE | Zero errors, no deviations from prototype |

### Phase F — Drawer Navigation ✅

| # | Item | Status | Notes |
|---|---|---|---|
| F.1 | Remove IndexOverlay, rewire NavigationContext | ✅ DONE | IndexOverlay deleted. Context exposes `openDrawer()`/`closeDrawer()`/`isDrawerOpen`. Uses `usePathname` for active slug. |
| F.2 | DrawerNav component — slide-in drawer with scrim | ✅ DONE | Fixed right-side on desktop, bottom sheet via CSS media query on mobile. Scrim z-60, drawer z-70. |
| F.3 | Experiment list grouped by month with thumbnails | ✅ DONE | 56×36 thumbnails with client-side randomized wordmarks (hydration-safe via useEffect). |
| F.4 | Special Projects carousel at drawer bottom | ✅ DONE | Auto-rotates 4s, refs for DOM manipulation (no re-renders per tick), dot navigation restarts timer. |
| F.5 | Mobile bottom-sheet pattern | ✅ DONE | Shared `<BottomSheet>` component created for controls drawer. Nav drawer handles its own bottom-sheet via CSS media query (too complex for generic wrapper). |
| F.6 | Keyboard & accessibility — focus trap, reduced motion | ✅ DONE | `role="dialog"`, `aria-modal`, Escape to close. Focus return to trigger NOT yet implemented. |
| F.7 | Build + QA | ✅ DONE | Zero build errors, zero hydration errors, deployed to main. |

---

## Known Bugs / Tech Debt

| # | Issue | Fix | Affected | Action |
|---|-------|-----|----------|--------|
| BUG-1 | **iOS gyro listener dropped after permission grant.** `useDeviceOrientation` hook auto-attach effect only re-started for `'not-required'` state. When iOS permission changed to `'granted'`, the cleanup ran but the listener was never re-attached — gyro values stuck at 0.5. | Fixed in `5d6c6e0`: added `'granted'` to the auto-attach condition in `lib/useDeviceOrientation.ts`. | **All experiments using gyro on iOS.** Builders: check EXP-02 sections (Collision Changes, Rain, Flock, Gravity Well, etc.) — any section that reads `gammaNorm`/`betaNorm` after iOS permission grant may have been silently broken. The values would default to 0.5, making gyro appear to "do nothing." | Planner should audit all experiments that use `useDeviceOrientation` and verify gyro works on iOS after permission grant. |

---

## Changelog

| Date | Change | By |
|---|---|---|
| 2026-05-12 | **EXP-04 Stock Collage Section A shipped (commit `9e74bf4`).** Identity pivoted through JC creative direction from "manual surrealist exquisite corpse" to **generative slice abstract**. Final form: 36 auto-picked photo slices stretched to abstract color/texture bands, varied widths (25–75% viewport) and horizontal positions, sharp seams, slide-in with multi-stop spring keyframes (180px → 0 with overshoot/back-and-forth, 320ms × 35ms stagger, Web Animations API). Pentatonic chime per band on entrance + per tap-reroll. 15s auto-rerun. No buttons (Shuffle/Export removed). Tap any band = animated single-band reroll. Image preload before reveal prevents pop-in. Shared infra (`ImagePicker`, `useCollageExport`, `StockCollageSwitch`, `types`, `audioEngine`) shipped — B/C/D can plug in. **Original Section A spec is now a stale planning document — see § Builder Notes in the spec for the iteration trail.** Sections B/C/D specs were written against the original "user picks everything" model and need re-speccing (or delta specs) before builders pick them up. | Builder + JC creative direction |
| 2026-03-21 | **EXP-03 Giant Steps fully spec'd.** Master spec (`EXP03_GIANT_STEPS.md`) + 4 builder prompts: Coltrane Circle (shared infra + Section A), Three-Body Problem (Section B), Chromatic Bridges (Section C), Mirror Symmetry (Section D). 26-chord Coltrane Changes progression, 3 key centers (B/G/E♭), BPM-driven tempo (80–320), 62 acceptance criteria. Section A builds shared infra (chord data, progression hook, types, section switch); B/C/D can be built in parallel after A. | Scrummaster (JC creative direction) |
| 2026-03-21 | **EXP-02E Magnets spec + builder prompt written.** Consonance/dissonance interval forces between all orb pairs. Visual: solid DUN lines (consonant), dashed BITTERSWEET lines (dissonant). Drag-to-override on desktop, tap-to-pin on mobile. Chord change flash (3× force line opacity, 300ms). Edge bounce (not wrapping). Adds `noteToMidi()` and `CONSONANCE_TABLE` to `chordData.ts`. 24 acceptance criteria. Spec: `Specs/EXP02_MAGNETS.md`. Builder prompt: `Specs/EXP02_MAGNETS_BUILDER_PROMPT.md`. | Scrummaster (JC creative direction) |
| 2026-03-21 | **EXP-02D Flock built, tuned, and deployed.** Major evolution from boids spec — see builder notes. Orbital leader-follower physics, breathing rhythm, click-drag-shake instrument, smooth bezier flight trails. Component: `Flock.tsx` (1379 lines). Pushed to main. | Builder (JC creative direction throughout) |
| 2026-03-20 | **EXP-02D Flock spec + builder prompt written.** Boids algorithm with separation/alignment/cohesion. Cursor leads on desktop, tilt steers on mobile. Edge wrapping (not bouncing). Pass-through collisions from Section C carried forward. 23 acceptance criteria. Spec: `Specs/EXP02_FLOCK.md`. Builder prompt: `Specs/EXP02_FLOCK_BUILDER_PROMPT.md`. | Scrummaster (JC creative direction) |
| 2026-03-20 | **EXP-02C Gravity Well spec + builder prompt written.** Standalone component following PianoSplit pattern. Orbital physics with Kepler angular velocity, slingshot drag interaction (desktop), tilt-offset orbit center (mobile). 22 acceptance criteria. Spec: `Specs/EXP02_GRAVITY_WELL.md`. Builder prompt: `Specs/EXP02_GRAVITY_WELL_BUILDER_PROMPT.md`. | Scrummaster (JC creative direction) |
| 2026-03-20 | **EXP-03 Giant Steps added to pipeline.** 4 sections: Coltrane Circle, Three-Body Problem, Chromatic Bridges, Mirror Symmetry. Inspired by Coltrane Changes (B→G→E♭ triangle). New experiment — different harmonic system from EXP-02's ii-V-I. All subsequent experiment numbers bumped +1 (EXP-03–09 → EXP-04–10, collage EXP-10–13 → EXP-11–14). | Scrummaster (JC creative direction) |
| 2026-03-20 | **Section deep linking spec written.** Hash-based URL persistence for experiment sections. `#B` in URL → loads Section B on mount. replaceState keeps Back button clean. Touches only `ExperimentFrame.tsx`. EXP-02B Piano Split marked ✅ DONE. Spec: `Specs/SECTION_DEEP_LINKING.md`. Builder prompt: `Specs/SECTION_DEEP_LINKING_BUILDER_PROMPT.md`. | Scrummaster (JC creative direction) |
| 2026-03-20 | **EXP-02B Piano Split spec + builder prompt written.** New Section B: split-screen bass/treble clef piano with stereo panning, dual synths, shared metronome. Inserts after Section A. Existing sections B–F shift to C–G — backlog items updated with new letters. J.4a0 (Section A Tweaks) marked ✅ DONE (builder notes populated). Spec: `Specs/EXP02_PIANO_SPLIT.md`. Builder prompt: `Specs/EXP02_PIANO_SPLIT_BUILDER_PROMPT.md`. | Scrummaster (JC creative direction) |
| 2026-03-17 | Initial backlog — Phases 1–5 from original sprint plan | Scrummaster |
| 2026-03-17 | Phases 1–3 complete. Hero V2, V3 complete. | Scrummaster |
| 2026-03-18 | Hero V2 + V3 complete. Generative per-character drift, scaleXY, mobile caps. | Scrummaster |
| 2026-03-19 | **V2.0 Architecture pivot.** Backlog restructured for experiment journal. Old phases archived. New ARC.1–ARC.4 work items. V2+ backlog populated with prototype experiment ideas. | Scrummaster (JC creative direction) |
| 2026-03-19 | Phase A complete. Clean refactor — no deviations. GenerativeType uses `<div>` (was `<header>`), class renamed `.container`. Old components preserved. Vestigial `main` max-width rule and `--hero-height` CSS property noted for cleanup. | Scrummaster (from Phase A builder notes) |
| 2026-03-19 | Phase B complete. LogoMark, IndexOverlay, Navigation wrapper, INDEX trigger all live. Keyboard accessible, responsive. Minor deviations: DM Sans for overlay names (not Roboto Flex), date below name. Backlog items added: overlay close button for mobile, placeholder experiments, LogoMark `<a>` → `<Link>` upgrade. | Phase B builder |
| 2026-03-19 | Phase C complete. Self-hosted fonts with preloading. `font-display: block` (Roboto Flex) / `swap` (DM Sans). WCAG AA verified (Dun/Gunmetal 9.11:1, INDEX trigger bumped to 60%). `dvh` units for iOS Safari. Close button added to overlay. Focus trap, focus-visible, tabIndex gating. Vestigial CSS cleaned up (B.6, B.7, B.8 resolved). README updated. Deployment pending push to main. | Scrummaster (from Phase C builder notes) |
| 2026-03-19 | **Phase F complete and deployed.** DrawerNav replaces IndexOverlay. Shared `<BottomSheet>` component for mobile controls drawer. Nav drawer uses inline CSS media query for its own bottom-sheet (too complex for generic wrapper). Carousel uses refs for DOM updates (no re-renders). Hydration-safe thumbnails via client-side useEffect. Deviations: focus return not implemented, drag-to-dismiss visual-only. New backlog items: B.11–B.15. | Scrummaster (from Phase F builder notes) |
| 2026-03-19 | **Phase F spec written.** Drawer navigation replaces IndexOverlay. NAV.2/NAV.4 superseded (zoom-out rejected). Mobile bottom-sheet pattern standardized — both nav drawer and controls drawer slide up from bottom on ≤600px. Phase F items added. | Scrummaster (JC creative direction) |
| 2026-03-19 | **Phase H complete and deployed.** `useDeviceOrientation` hook with iOS permission, lerp smoothing, normalized output. Sections B+C: gyro tilt → virtual cursor / axis mapping, touch fallback on denial. Section D: touch-sweep with 40px radius, CSS `:hover` scoped to `(hover: hover) and (pointer: fine)`. Platform-aware hint/instructions via `hintMobile`/`instructionsMobile` on SectionConfig. Hint visible on mobile (B.20 resolved) via `flex-wrap`, 44px tap targets. Deviation: `getInteractionMode()` not standalone — each section uses `modeRef` pattern instead. No new backlog items. | Scrummaster (from Phase H builder notes) |
| 2026-03-19 | **Phase H spec written.** Mobile interaction: gyroscope for sections B+C (proximity+axes), touch-sweep for section D (hover). `useDeviceOrientation` hook with iOS permission flow, smoothing, normalization. Platform-aware hint text + instructions. Touch fallback if gyro denied. | Scrummaster (JC creative direction) |
| 2026-03-19 | **Phase G complete and deployed.** 6-row grid, expanding settings panel, floating meta labels, per-section controls/instructions, 40×40px pagination+gear strip. BottomSheet deleted. `replayKey` added to ExperimentControlsContext for Section E Replay. `sectionConfigs` array in `data/experiments.ts`. No significant deviations from spec/prototype. Known issue: DrawerNav mobile trigger overlaps tile A at narrow viewports (Phase F issue, not G regression). New backlog: B.17–B.19. | Scrummaster (from Phase G builder notes) |
| 2026-03-20 | **EXP-02A Tweaks spec + builder prompt written.** 6 refinements to Section A: T.1 mobile settings push (ExperimentFrame), T.2 chord selector dropdown (replaces click-to-spawn), T.3 jazz metronome (Tone.Transport, swing, brush synth), T.4 decay/reverb controls, T.5 viewport-responsive orb sizing, T.6 section label fix ('1'→'A'). Spec: `Specs/EXP02_TWEAKS_A.md`. Builder prompt: `Specs/EXP02_TWEAKS_A_BUILDER_PROMPT.md`. | Scrummaster (JC creative direction) |
| 2026-03-20 | **EXP-02 Sections B–F spec + builder prompt written.** 5 new physics variations: Gravity Well (orbit), Flock (boids), Magnets (consonance/dissonance), Freeze & Release (silence dynamics), Rain (emitter). Extends single-section to 6-section experiment. Spec: `Specs/EXP02_SECTIONS_BF.md`. | Scrummaster (JC creative direction) |
| 2026-03-19 | **EXP-02 Collision Changes complete and deployed.** First audio experiment. Tone.js v15.1.x with PolySynth+reverb+delay. 7 orbs per chord, per-note colors, flat fill+vibrant stroke style. Physics: G=0.02, damping=0.9998, bounce=0.7, cooldown=600ms. Voice-leading via greedy closest-freq, 500ms lerp. Auto-removal at >8 orbs. Known: single-section experiments don't get hint bar from ExperimentFrame; `click` icon falls back to `eye`. | Scrummaster (from EXP-02 builder notes) |
| 2026-03-19 | **EXP-02 Collision Changes spec + builder prompt written.** Full spec with physics simulation, Tone.js audio engine, ii-V-I-IV progression, voice-leading, gyro interaction, canvas rendering. 12 task items (EXP02.1–EXP02.12), 16 acceptance criteria. Builder prompt with physics tuning guide. | Scrummaster (JC creative direction) |
| 2026-03-19 | **Stock Collage pipeline added.** 4 experiments approved by JC from R5 brainstorm. EXP-10 through EXP-13 added to backlog (C.1–C.25). Unsplash API for stock photos. Techniques: exquisite corpse, strip collage, color-based bleed (WebGL), depth diorama (MiDaS ML). Source: `prototypes/experiment-ideas-r5.html`. | Scrummaster (JC creative direction) |
| 2026-03-19 | **Visual Jazz pipeline added.** 8 experiments approved by JC from R3 brainstorm. EXP-02 through EXP-09 added to backlog (J.1–J.32). All use Tone.js for Web Audio, mobile-first interaction (gyro+touch). Jazz theory concepts: ii-V-I, walking bass, swing feel, call & response, blue notes, chord voicings, gestural improvisation. Source: `prototypes/experiment-ideas-r3.html`. | Scrummaster (JC creative direction) |
| 2026-03-19 | **Phase G spec written.** Settings panel redesign: 6-row grid with expanding panel, floating meta labels, per-section controls/instructions, inline hint actions, 40×40px pagination+gear strip. Old mobile controls drawer to be removed. Section transition loader explicitly preserved. Prototype: `prototypes/settings-panel-v3.html`. | Scrummaster (JC creative direction) |
| 2026-03-19 | **Phase D/E complete and deployed.** ExperimentFrame with 7-row grid, pagination tiles (A–F), 3-phase section loader (fade+spinner+fade), 6 type variations, interactive controls (Speed/Easing/Shuffle), mobile drawer behind gear icon, bottom meta bar mirroring top. 12 prototype effects pruned to 6 per JC direction. Scroll replaced with pagination. Mobile: centered layout, 16vw type, 28px tiles. EXP.1–5 all resolved. V2.3 and V2.6 implemented as sections within Exp 01. | Builder (from Phase E session) |
