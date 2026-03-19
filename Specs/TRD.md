# TRD.md — Technical Requirements Document

## Product
Juanemo — Personal Creative Site

## Version
1.0

---

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 16 (App Router, Turbopack)** | Next.js 16.1.7 with React 19.2.3. Turbopack is the default dev server in v16 (no `--turbopack` flag needed). TypeScript. Fast. |
| Language | **TypeScript** | Type safety, consistency across projects |
| Styling | **CSS Modules + CSS custom properties** | CSS Modules for component scoping; CSS custom properties on `:root` for the full token system and variable font axes |
| Hero font | **Roboto Flex** via `@fontsource-variable/roboto-flex/full.css` | 13 axes. **Must use `full.css`** — default import only loads wght axis. Self-hosted, no runtime Google Fonts request. |
| Body font | **DM Sans** via `@fontsource/dm-sans` | Clean humanist sans, readable at small sizes, pairs naturally with Roboto Flex |
| Deployment | **Vercel** | Zero config, instant deploys, free tier sufficient |
| Package Manager | **npm** | Consistent with existing repos |

---

## Font Specification — Finalized

### Hero: Roboto Flex

**Decision: Roboto Flex.** Selected for its exceptional axis range, all-caps legibility at display sizes, and technical depth for the mood system. Self-hosted via Fontsource — no runtime Google Fonts request, no FOUT risk. Fontsource handles hosting via `node_modules` import (webpack/turbopack serves the woff2 files automatically), so no `public/fonts/` directory is needed.

```bash
npm install @fontsource-variable/roboto-flex
```

**CRITICAL: Font import must use `full.css`.** The default Fontsource import (`@fontsource-variable/roboto-flex`) only loads a font file with the `wght` axis (34KB). All other axes are silently ignored. To get all 13 axes, import:
```ts
import '@fontsource-variable/roboto-flex/full.css'; // 326KB, all 13 axes
```
This was discovered during Phase 2 build. The default import appeared to work but all non-weight axes had no effect.

#### Full Axis Reference

| Axis | Tag | Range | Used For |
|---|---|---|---|
| Weight | `wght` | 100–1000 | **Viewport-responsive** (100–900): light on mobile → bold on desktop |
| Width | `wdth` | 25–151 | **Viewport-responsive** (25–151): condensed on mobile → extended on desktop |
| Optical Size | `opsz` | 8–144 | **Viewport-responsive** (8–144): tracks with wdth for letterform quality |
| Grade | `GRAD` | -200–150 | Mood system (on hold) — micro stroke weight, affects density. Width-safe axis. |
| Slant | `slnt` | -10–0 | Mood system (on hold) — REFINED mood uses -1 for subtle tension. Width-safe axis. |
| Counter Width | `XTRA` | 323–603 | Mood system (on hold) — controls air inside letterforms. **Width-affecting axis** — caused inconsistent glyph widths. |
| Thick Stroke | `XOPQ` | 27–175 | Mood system (on hold) — controls stroke weight contrast. **Width-affecting axis** — caused inconsistent glyph widths. |
| Thin Stroke | `YOPQ` | 25–135 | Mood system (on hold) — controls hairline strokes. **Width-affecting axis** — caused inconsistent glyph widths. |
| Uppercase Height | `YTUC` | 528–760 | Mood system (on hold) — shifts cap height feel. Width-safe axis. |
| Ascender Height | `YTAS` | 649–854 | Not used (no ascenders in all-caps) |
| Descender Depth | `YTDE` | -305–-98 | Not used (no descenders in all-caps) |
| Lowercase Height | `YTLC` | 416–570 | Not used (all caps) |
| Figure Height | `YTFI` | 560–788 | Not used |

#### Mood System — 5 Named Presets (ON HOLD)

**Status:** Disabled during Phase 2 build. The randomized character axes (XOPQ, XTRA, YOPQ) produce wildly different glyph widths across loads, breaking fitText consistency — especially on mobile where font-size is already constrained. JC approved disabling in favor of the viewport-responsive axis architecture.

**Future approach:** Constrain moods to width-safe axes only (GRAD, slnt, YTUC) while leaving width-affecting axes (XOPQ, XTRA, YOPQ) to the viewport system. This preserves mood personality without breaking sizing.

**Original design (preserved in `lib/moods.ts` for reference):** One mood is selected at random on every page load and applied to axes `GRAD`, `XTRA`, `XOPQ`, `YOPQ`, `YTUC`, `slnt`, `opsz` before first paint. All moods lock `wght` at 900.

| Mood | GRAD | XTRA | XOPQ | YOPQ | YTUC | slnt | opsz | Character |
|---|---|---|---|---|---|---|---|---|
| SHARP | 120 | 340 | 160 | 30 | 740 | 0 | 144 | High contrast, tight, architectural |
| AIRY | -100 | 580 | 40 | 100 | 528 | 0 | 80 | Open counters, spacious, calm |
| HEAVY | 150 | 400 | 175 | 25 | 760 | 0 | 144 | Max stroke weight, dense, powerful |
| REFINED | 0 | 468 | 88 | 78 | 620 | -1 | 100 | Balanced, slight slant, elegant |
| PUNCHY | 100 | 460 | 130 | 50 | 760 | 0 | 120 | High caps, energetic, direct |

#### Mood Implementation (Currently Commented Out)

The `<head>` mood script is commented out in `app/layout.tsx`. Mood definitions remain in `lib/moods.ts`. Original implementation preserved below for when moods are revisited:

Place in `<head>` before any rendering — no flash:

```ts
// app/layout.tsx — inline script in <head>
const moodScript = `
  const moods = {
    SHARP:   { GRAD: 120,  XTRA: 340, XOPQ: 160, YOPQ: 30,  YTUC: 740, slnt: 0,  opsz: 144 },
    AIRY:    { GRAD: -100, XTRA: 580, XOPQ: 40,  YOPQ: 100, YTUC: 528, slnt: 0,  opsz: 80  },
    HEAVY:   { GRAD: 150,  XTRA: 400, XOPQ: 175, YOPQ: 25,  YTUC: 760, slnt: 0,  opsz: 144 },
    REFINED: { GRAD: 0,    XTRA: 468, XOPQ: 88,  YOPQ: 78,  YTUC: 620, slnt: -1, opsz: 100 },
    PUNCHY:  { GRAD: 100,  XTRA: 460, XOPQ: 130, YOPQ: 50,  YTUC: 760, slnt: 0,  opsz: 120 },
  };
  const keys = Object.keys(moods);
  const mood = moods[keys[Math.floor(Math.random() * keys.length)]];
  const r = document.documentElement;
  Object.entries({
    '--hero-grad': mood.GRAD, '--hero-xtra': mood.XTRA,
    '--hero-xopq': mood.XOPQ, '--hero-yopq': mood.YOPQ,
    '--hero-ytuc': mood.YTUC, '--hero-slnt': mood.slnt,
    '--hero-opsz': mood.opsz,
  }).forEach(([k, v]) => r.style.setProperty(k, v));
`;
```

### Body: DM Sans

```bash
npm install @fontsource/dm-sans
```

```ts
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
```

Used for all body copy, labels, eyebrows, footer. 15px/400 default. Labels at 11–14px/500/uppercase/tracked.

---

## Variable Font Implementation

### CSS custom properties — full axis system

All Roboto Flex axes are driven via CSS custom properties on `:root`, set by JS before first paint (mood) and updated in real time (resize + scroll):

```css
:root {
  /* Viewport-responsive axes — updated by resize listener */
  --hero-wdth: 100;
  --hero-wght: 900;
  --hero-opsz: 100;

  /* Mood axes — set once on load in <head> */
  --hero-grad: 0;
  --hero-slnt: 0;
  --hero-xtra: 468;
  --hero-xopq: 88;
  --hero-yopq: 78;
  --hero-ytuc: 620;
}

.hero-text {
  font-family: 'Roboto Flex Variable', sans-serif;
  font-variation-settings:
    'wdth' var(--hero-wdth),
    'wght' var(--hero-wght),
    'opsz' var(--hero-opsz),
    'GRAD' var(--hero-grad),
    'slnt' var(--hero-slnt),
    'XTRA' var(--hero-xtra),
    'XOPQ' var(--hero-xopq),
    'YOPQ' var(--hero-yopq),
    'YTUC' var(--hero-ytuc);
  text-transform: uppercase;
  letter-spacing: -0.04em;
  line-height: 0.9;
  color: var(--color-text-muted); /* Dun — warmer than Bone on dark bg */
}
```

### Generative Per-Character Axis System (Hero V2 — Current)

**Replaces the viewport-responsive axis system.** The hero now uses a per-character generative animation where each of the 7 letters in JUANEMO independently drifts to random axis values on a timed cycle.

#### Shared Axis Utility — `lib/generativeAxes.ts`

Single source of truth for axis ranges, used by Hero and future LogoMark:

```ts
export const AXIS_RANGES = {
  wdth: { min: 25, max: 151 },
  wght: { min: 300, max: 900 },  // floor at 300 — letters must never vanish
  opsz: { min: 8, max: 144 },
};

export function randomAxes(): AxisValues;   // returns random wdth/wght/opsz
export function axisString(axes): string;   // returns font-variation-settings string
```

#### Animation Cycle — Drift + Hold

The hero runs on a two-phase cycle: **hold** (still) → **shift** (staggered transition) → repeat.

| Constant | Value | Purpose |
|---|---|---|
| `HOLD_DURATION` | 8000ms | How long the wordmark sits still between shifts |
| `TRANS_DURATION` | 1500ms | Base transition duration per letter (±200ms variation) |
| `STAGGER` | 80ms | Delay between each letter's transition start |
| `SPRING_EASING` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Spring easing with overshoot — non-negotiable |

#### Full-Width Scaling — `scaleX` + `ResizeObserver`

The word always fills the container width via `transform: scaleX()`. A `ResizeObserver` on the word element fires as `font-variation-settings` transitions cause letter widths to change, keeping the scale in sync live during animations. Also refits on window resize.

```ts
// Measures natural word width, calculates scale to fill container
const scale = containerWidth / naturalWidth;
word.style.transform = `scaleX(${scale})`;
```

#### Key Architecture Decisions
- Each letter is a `<span>` with independent `font-variation-settings`
- `suppressHydrationWarning` on spans to handle client-side randomization
- Initial state: randomized instantly (no animation), then hold phase begins
- `prefers-reduced-motion`: transitions become instant, states still change
- Mood script removed from `layout.tsx` `<head>` — generative system fully replaces it

### Viewport-Responsive Structural Axes (Phase 2 — Superseded by Hero V2)

_The viewport-responsive axis system (`updateHeroAxes()`) is no longer used by the Hero component. `lib/heroListeners.ts` is preserved in the codebase for potential future use but Hero no longer imports it._

### Scroll-based compression (DEFERRED)

**Status:** Implemented during Phase 2 but visually broken in practice. Disabled per JC's direction. To be redesigned if revisited.

Original spec: scroll listener maps 0–300px scroll to font size, weight, grade, tracking, and opacity.

**Important:** The scroll handler captures the initial mood GRAD value via closure at attach time, not by reading `--hero-grad` on each frame. Reading on each frame would compound the reduction (a bug in the original spec). The actual implementation uses `attachHeroListeners()` which captures the mood GRAD once and fades from that value:

```ts
// lib/heroListeners.ts — actual implementation
function createScrollHandler(initialMoodGrad: number) {
  return function updateHeroScroll(): void {
    const progress = Math.min(window.scrollY / 300, 1);
    const r = document.documentElement;

    // wght: 900 → 500
    r.style.setProperty('--hero-wght', String(Math.round(900 - progress * 400)));

    // GRAD fades toward 0 from the original mood value (captured once)
    r.style.setProperty('--hero-grad', String(Math.round(initialMoodGrad * (1 - progress))));

    // scroll progress for CSS calculations (font-size, opacity, letter-spacing)
    r.style.setProperty('--scroll-progress', String(progress));
  };
}

export function attachHeroListeners(): () => void {
  // Capture mood GRAD before scroll modifies it
  const initialMoodGrad = parseFloat(
    document.documentElement.style.getPropertyValue('--hero-grad')
  ) || 0;
  const updateHeroScroll = createScrollHandler(initialMoodGrad);

  const debouncedResize = debounce(updateHeroAxes, 16);
  window.addEventListener('resize', debouncedResize);
  window.addEventListener('scroll', () => requestAnimationFrame(updateHeroScroll));
  updateHeroAxes(); // run immediately on mount

  return () => { /* cleanup listeners */ };
}
```

**Public API from `lib/heroListeners.ts`:**
- `updateHeroAxes()` — maps viewport width to `wdth`/`opsz` axes. Can be called standalone.
- `attachHeroListeners()` — attaches both resize and scroll listeners. Returns a cleanup function for unmounting. Captures mood GRAD via closure.

```css
.hero-text {
  font-size: calc(
    var(--hero-size-max, 18vw) -
    (var(--hero-size-max, 18vw) - 5rem) * var(--scroll-progress, 0)
  );
  opacity: calc(1 - var(--scroll-progress, 0) * 0.15);
  transition: font-size 0ms, opacity 80ms ease;
}
```

### Fitting "JUANEMO" edge to edge

Use a JS `fitText` function that iteratively adjusts `font-size` until the text fills the container width exactly. Run on mount and on resize (after axis update):

```ts
function fitHeroText(el: HTMLElement) {
  const container = el.parentElement!;
  let low = 10, high = 500, mid: number;
  for (let i = 0; i < 20; i++) {  // binary search, ~20 iterations is sufficient
    mid = (low + high) / 2;
    el.style.fontSize = `${mid}px`;
    if (el.scrollWidth < container.clientWidth) low = mid;
    else high = mid;
  }
  el.style.fontSize = `${low}px`;
}
```

---

## Experiment Data (V2.0 Architecture)

Experiments are stored in a single TypeScript file. The home route redirects to the latest (first in array). Array is in reverse chronological order (newest first).

```ts
// data/experiments.ts
export interface Experiment {
  slug: string;           // URL slug — /experiments/[slug]
  name: string;           // Display name in index overlay
  description: string;    // One-line description
  publishedDate: string;  // Human-readable date
}

export const experiments: Experiment[] = [
  {
    slug: "generative-type",
    name: "Generative Typography",
    description: "Per-character variable font drift — the wordmark is never the same twice.",
    publishedDate: "March 2025",
  },
  // add new experiments here — newest first
];
```

Adding an experiment = creating a page component at `/app/experiments/[slug]/page.tsx` and adding one entry to the data array. No CMS, no database, no friction.

**Note:** The old `data/projects.ts` (with `name`, `description`, `url`, `publishedDate`) is superseded by `data/experiments.ts`. External projects like "State of Creative Jobs" can be listed in the INDEX overlay as external links if desired, but they are not experiments.

---

## Routing Architecture (V2.0)

```
/                               → redirects to /experiments/[latest-slug]
/experiments/generative-type    → Experiment #1 (JUANEMO generative wordmark)
/experiments/[future-slug]      → Future experiments
```

- Home (`/`) reads `experiments[0].slug` from the data file and redirects
- Each experiment route renders a full-viewport, no-scroll experience
- Shared layout wraps all experiment pages with LogoMark + INDEX trigger

### Next.js Implementation

```
app/
  page.tsx                      # Redirect to latest experiment
  layout.tsx                    # Root layout: fonts, theme, LogoMark, INDEX trigger
  experiments/
    [slug]/
      page.tsx                  # Dynamic route — loads experiment component by slug
  components/
    LogoMark.tsx                # Static generative logo (randomized per load)
    IndexOverlay.tsx            # Full-screen experiment index overlay
    experiments/
      GenerativeType.tsx        # Experiment #1 component
```

### Full-Screen Experiment Shell

Every experiment renders inside a shared container that enforces the viewport-sized, no-scroll paradigm:

```css
.experiment-shell {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  background: var(--color-bg);
}
```

---

## File Structure (V2.0 Architecture)

```
juanemo/
├── app/
│   ├── layout.tsx              # Root layout: fonts, theme init, LogoMark, INDEX trigger
│   ├── page.tsx                # Home — redirects to latest experiment
│   ├── globals.css             # CSS custom properties (color, spacing, motion, type utilities)
│   └── experiments/
│       └── [slug]/
│           └── page.tsx        # Dynamic route — loads experiment component by slug
├── components/
│   ├── Navigation.tsx          # Client wrapper: LogoMark + INDEX trigger + IndexOverlay state
│   ├── Navigation.module.css
│   ├── LogoMark.tsx            # Static generative logo — randomized per load, links to /
│   ├── LogoMark.module.css
│   ├── IndexOverlay.tsx        # Full-screen experiment index overlay
│   ├── IndexOverlay.module.css
│   ├── ExperimentShell.tsx     # Shared full-viewport container for experiments
│   ├── ExperimentShell.module.css
│   └── experiments/
│       └── GenerativeType.tsx  # Experiment #1: per-character drift + scaleXY
│       └── GenerativeType.module.css
├── data/
│   └── experiments.ts          # Experiment data array — { slug, name, description, publishedDate }
├── lib/
│   ├── generativeAxes.ts       # Shared axis randomization — AXIS_RANGES, randomAxes(), axisString()
│   ├── moods.ts                # Mood definitions (preserved for future experiments)
│   ├── fitText.ts              # Binary search font-size fitter (preserved for future experiments)
│   └── heroListeners.ts        # Resize + scroll listeners (preserved for future experiments)
├── prototypes/                 # HTML experiment prototypes (creative development)
├── Specs/                      # Project spec documents
├── vercel.json                 # Framework hint for Vercel deployment
└── README.md
```

**Note:** The old `components/Hero.tsx`, `ProjectList.tsx`, and `Footer.tsx` will be refactored. Hero becomes `experiments/GenerativeType.tsx`. ProjectList content moves into `IndexOverlay.tsx`. Footer is removed from experiment pages (may return in a different form).

---

## Performance Requirements

- **LCP < 2s** on a standard broadband connection
- **No layout shift (CLS = 0)** — font must be preloaded to prevent FOUT
- **Font preloading:** Use `<link rel="preload">` for the variable font file
- Font subsetting: If self-hosting, subset to Latin + uppercase only to reduce file size
- No unnecessary JavaScript — the scroll/resize listeners should be lightweight and debounced

---

## Browser Support

| Browser | Support Level |
|---|---|
| Chrome 105+ | Full |
| Safari 16.4+ | Full |
| Firefox 114+ | Full |
| Chrome Android | Full |
| Safari iOS 16.4+ | Full |
| IE / Legacy Edge | Not supported |

Variable font support is baseline for all modern browsers. No polyfill needed.

---

## Accessibility

- JUANEMO hero text must be real DOM text, not an image or canvas — screen readers must be able to read it
- Project links must have descriptive `aria-label` if the link text alone is ambiguous
- Color contrast must meet WCAG AA for all text
- No motion for users with `prefers-reduced-motion` — the scroll/resize animations should be disabled or reduced

```css
@media (prefers-reduced-motion: reduce) {
  .hero-text {
    transition: none;
  }
}
```

---

## Deployment

- **Host:** Vercel (connect GitHub repo `mrnemo273/juanemo`)
- **Config:** `vercel.json` with `"framework": "nextjs"` — **required** because Vercel auto-detect defaulted to static site and failed looking for a `public` output directory. Confirm Vercel project settings have Framework Preset set to "Next.js" so the config file isn't doing double duty.
- **Domain:** TBD — can use `juanemo.vercel.app` initially
- **Auto-deploy:** Every push to `main` deploys to production
- **Preview deploys:** Every PR gets a preview URL

---

## Open Questions / Deferred to V2

- Whether the mood name is surfaced anywhere visibly (e.g. a hidden element, a console.log easter egg)
- Per-project mood assignment on hover
- Generative background element
- Sound layer
- Consider removing `opsz` from mood `<head>` script — the resize listener overwrites it on mount. Current behavior works (mood opsz briefly visible before JS mount).

---

## Changelog

| Date | Change | By |
|---|---|---|
| 2026-03-17 | Initial TRD created | JC / Scrummaster |
| 2026-03-17 | Post-Phase 1: Updated Next.js version to 16.1.7/React 19.2.3. Added Turbopack default note. Clarified Fontsource handles font hosting (no public/fonts/ needed). Expanded vercel.json deployment note per builder experience. Added opsz deferred question. | Scrummaster (from Phase 1 builder notes) |
| 2026-03-17 | Post-Phase 2: CRITICAL font import fix (`full.css` required for all axes). Axis architecture rewrite: wght now viewport-responsive (100–900), viewport min changed to 500px. Mood system marked ON HOLD with width-safe/width-affecting axis classification. Scroll compression marked DEFERRED. Axis reference table updated. | Scrummaster (from Phase 2 builder notes) |
| 2026-03-17 | Post-Phase 3: Project data model updated (`year`/`tags` → `publishedDate`). File structure updated with CSS Modules and actual component descriptions. Footer.tsx built early (was Phase 4). | Scrummaster (from Phase 3 builder notes) |
| 2026-03-18 | Hero V2: Viewport-responsive axis system superseded by generative per-character drift. New `lib/generativeAxes.ts`. Hero uses scaleX + ResizeObserver for full-width fitting. Font-size increased to `clamp(60px, 17vw, 280px)`, hero 70vh desktop / 40vh mobile. Mood script removed from layout.tsx. File structure updated. | Scrummaster (from Hero V2 builder notes) |
| 2026-03-18 | Hero V3: ScaleXY fill (both axes). Hidden clone measurement (no flash). Mobile axis caps: wdth 40–120, wght 300–750. Mobile hero 35vh. `randomAxesForWord()` — 1 extreme char + rest moderate on mobile. TypeScript `AxisRanges` interface. | Scrummaster (from Hero V3 builder notes) |
| 2026-03-19 | **V2.0 Architecture pivot.** Site restructured as journal of full-screen experiments. New routing (`/experiments/[slug]`), data model (`experiments.ts`), file structure. ProjectList/Footer removed from experiment pages. IndexOverlay, LogoMark, ExperimentShell added. | Scrummaster (JC creative direction) |
