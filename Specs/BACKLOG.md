# BACKLOG.md — Juanemo Living Backlog

## Last Updated
2026-03-21 — **EXP-02D Flock built, tuned, and deployed.** Evolved significantly beyond initial boids spec into orbital leader-follower system with breathing rhythm. EXP-02 now has 4 live sections (A–D).

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

Approved by JC on 2026-03-19. Nine interactive experiments exploring jazz harmony, rhythm, and improvisation through visual interaction and Web Audio (Tone.js). Each experiment maps jazz theory concepts to collision, physics, or gestural interaction patterns. Mobile-first (gyro + touch), with mouse support on desktop.

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

| J.4c | Section E (was D): Magnets — consonance attracts, dissonance repels, chord change reshuffles relationships | 🔵 SPEC WRITTEN | Needs `noteToMidi()` + `CONSONANCE_TABLE` in chordData.ts. Letters need updating D→E |
| J.4d | Section F (was E): Freeze & Release — tap to freeze (silence), release with velocity burst, longer freeze = bigger burst | 🔵 SPEC WRITTEN | Letters need updating E→F |
| J.4e | Section G (was F): Rain — emitter mode, density via tilt/mouse, splash on landing, chord change wave coloring | 🔵 SPEC WRITTEN | Max 40 particles, 3-bounce lifetime. Letters need updating F→G |

### EXP-03: Giant Steps (Coltrane Changes via Circle of Fifths)

Inspired by John Coltrane's *Giant Steps* (1959). The Coltrane substitution divides the octave into three equal parts — key centers B, G, and E♭, each a major third apart — creating the "Coltrane Triangle" on the circle of fifths. Four sections exploring different visual interpretations of this harmonic system. Shares Tone.js + canvas foundation with EXP-02 but uses a fundamentally different progression and visual language.

| # | Item | Status | Notes |
|---|---|---|---|
| GS.1 | **Section A: Coltrane Circle** — 12 keys on a circle, orbs slingshot between key centers, triangle pulses on each change | 🔲 TODO | Circle of fifths geometry. Slingshot physics between B→G→E♭. Triangle glow on resolution. |
| GS.2 | **Section B: Three-Body Problem** — three gravity wells (one per tonal center), orbs perpetually in flight between them | 🔲 TODO | N-body physics. Tempo control = chaos dial. ~2 beats/chord at Giant Steps speed → constant motion. |
| GS.3 | **Section C: Chromatic Bridges** — ii-V passing chords visualized as ephemeral force-field arcs between key centers | 🔲 TODO | Bridges appear 2 beats before resolution. Orbs travel along arcs, settle on arrival. Glow + dissolve. |
| GS.4 | **Section D: Mirror Symmetry** — 3-fold rotational symmetry, each note spawns 3 mirrored orbs at 120° intervals | 🔲 TODO | 12 ÷ 3 symmetry. Mirrors align briefly on resolution (unison chord moment), then split. |

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

---

## Experiment Pipeline — Stock Collage Series ✂️

Approved by JC on 2026-03-19. Four interactive experiments using free stock photography (Unsplash API) as raw material for collage. Each experiment explores a different collage technique — surrealist juxtaposition, strip recombination, color-based blending, and depth-based layering. Claude assists with curation, alignment, and composition suggestions.

### EXP-11: Exquisite Search (Surrealist Exquisite Corpse) *(was EXP-10)*

| # | Item | Status | Notes |
|---|---|---|---|
| C.1 | Three horizontal bands — search Unsplash for each, pick from results | 🔲 TODO | Top/mid/bottom. Each band independently pannable. |
| C.2 | Fold mechanic — active band visible, others clipped to 20px alignment sliver | 🔲 TODO | CSS mask with 8px Gaussian blur feather at seams. |
| C.3 | Reveal animation — 3D unfold (rotateX -90° → 0°, 400ms stagger) | 🔲 TODO | Top-to-bottom sequence. Shadow underneath during unfold. |
| C.4 | Claude picks middle band search term to bridge top + bottom | 🔲 TODO | Analyzes color palette + dominant shapes. Option for "surrealist clash" mode. |
| C.5 | Shake mode — randomly reassign which image fills which band | 🔲 TODO | Instant variations from same 3 images. |
| C.6 | Export composite as single image (canvas compositing with feathered seams) | 🔲 TODO | |

### EXP-12: Slice & Stack (Hockney-Style Strip Collage) *(was EXP-11)*

| # | Item | Status | Notes |
|---|---|---|---|
| C.7 | Search 2+ images, slice each into vertical strips (8/12/16/24) | 🔲 TODO | drawImage with source cropping. Each strip is independent draggable element. |
| C.8 | Drag strips to recompose — snap to grid with half-width offset option | 🔲 TODO | 1px drop shadows between strips for layered paper feel. |
| C.9 | Auto-shuffle button — randomly interleave strips from all images | 🔲 TODO | |
| C.10 | Sort by hue — rearrange all strips by dominant color (HSL H component) | 🔲 TODO | Creates unexpected gradient left-to-right. |
| C.11 | Vertical offset per strip for stepped/staircase collage | 🔲 TODO | |
| C.12 | Claude identifies "continuation opportunities" — lines/horizons that align across strips | 🔲 TODO | Suggests specific pairings. Auto-compose "best alignment" mode. |
| C.13 | Export strip collage | 🔲 TODO | |

### EXP-13: Color Bleed (Chromatic Merge) *(was EXP-12)*

| # | Item | Status | Notes |
|---|---|---|---|
| C.14 | Place 2+ stock photos side by side on canvas | 🔲 TODO | Drag to reposition, rotate, flip. |
| C.15 | Real-time bleed effect — colors merge where edges match (CIE Lab distance) | 🔲 TODO | WebGL fragment shader. Hermite interpolation weighted by color similarity. |
| C.16 | Bleed radius control (how far the merge extends from edge) | 🔲 TODO | Distance field from image edges. |
| C.17 | Color tolerance control (how close colors must be to trigger bleed) | 🔲 TODO | Min = surgical precision, max = impressionist haze. |
| C.18 | Claude ranks photos by "bleed potential" and suggests positioning/rotation | 🔲 TODO | Preview heatmap of predicted bleed zones. |
| C.19 | Export blended collage | 🔲 TODO | |

### EXP-14: Depth Sandwich (Parallax Diorama) *(was EXP-13)*

| # | Item | Status | Notes |
|---|---|---|---|
| C.20 | Pick 3–5 stock photos, generate depth maps (MiDaS via TensorFlow.js/ONNX) | 🔲 TODO | Client-side depth estimation. Quantized to 3–5 discrete layers. |
| C.21 | Peel each photo into depth layers (foreground/midground/background) | 🔲 TODO | Depth map as alpha mask with edge feathering. |
| C.22 | Interleave layers from different images by depth plane | 🔲 TODO | All foregrounds compete for front plane. CSS translateZ in perspective container. |
| C.23 | Parallax via gyro (mobile) or mouse (desktop) — foreground fast, background slow | 🔲 TODO | rotateX/rotateY driven by input. |
| C.24 | Claude suggests "figure-ground swap" combinations + lighting consistency check | 🔲 TODO | Specific combo suggestions. |
| C.25 | Export as parallax video or still composite | 🔲 TODO | |

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

## Changelog

| Date | Change | By |
|---|---|---|
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
