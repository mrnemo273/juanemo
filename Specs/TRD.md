# TRD.md — Technical Requirements Document

## Product
Juanemo — Personal Creative Site

## Version
1.0

---

## Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | **Next.js 14+ (App Router)** | Consistent with JC's existing projects (StateOfCreativeJobs, cc_DesignSystem). TypeScript. Fast. |
| Language | **TypeScript** | Type safety, consistency across projects |
| Styling | **CSS Modules + CSS custom properties** | CSS Modules for component scoping; CSS custom properties on `:root` for the full token system and variable font axes |
| Hero font | **Roboto Flex** via `@fontsource-variable/roboto-flex` | 13 axes including `wdth` 25–151, `wght` 100–1000, `GRAD`, `XTRA`, `XOPQ`, `YOPQ`, `YTUC`, `slnt`, `opsz`. Self-hosted, no runtime Google Fonts request. |
| Body font | **DM Sans** via `@fontsource/dm-sans` | Clean humanist sans, readable at small sizes, pairs naturally with Roboto Flex |
| Deployment | **Vercel** | Zero config, instant deploys, free tier sufficient |
| Package Manager | **npm** | Consistent with existing repos |

---

## Font Specification — Finalized

### Hero: Roboto Flex

**Decision: Roboto Flex.** Selected for its exceptional axis range, all-caps legibility at display sizes, and technical depth for the mood system. Self-hosted via Fontsource — no runtime Google Fonts request, no FOUT risk.

```bash
npm install @fontsource-variable/roboto-flex
```

#### Full Axis Reference

| Axis | Tag | Range | Used For |
|---|---|---|---|
| Weight | `wght` | 100–1000 | Locked at 900 for hero; shifts to 500 on scroll compression |
| Width | `wdth` | 25–151 | Responsive to viewport width — primary behavior axis |
| Optical Size | `opsz` | 8–144 | Shifts with `wdth` — improves letterform quality at each scale |
| Grade | `GRAD` | -200–150 | Mood system — micro stroke weight, affects density |
| Slant | `slnt` | -10–0 | Mood system — REFINED mood uses -1 for subtle tension |
| Counter Width | `XTRA` | 323–603 | Mood system — controls air inside letterforms |
| Thick Stroke | `XOPQ` | 27–175 | Mood system — controls stroke weight contrast |
| Thin Stroke | `YOPQ` | 25–135 | Mood system — controls hairline strokes |
| Uppercase Height | `YTUC` | 528–760 | Mood system — shifts cap height feel |
| Ascender Height | `YTAS` | 649–854 | Not used (no ascenders in all-caps) |
| Descender Depth | `YTDE` | -305–-98 | Not used (no descenders in all-caps) |
| Lowercase Height | `YTLC` | 416–570 | Not used (all caps) |
| Figure Height | `YTFI` | 560–788 | Not used |

#### Mood System — 5 Named Presets

One mood is selected at random on every page load and applied to axes `GRAD`, `XTRA`, `XOPQ`, `YOPQ`, `YTUC`, `slnt`, `opsz` before first paint. All moods lock `wght` at 900.

| Mood | GRAD | XTRA | XOPQ | YOPQ | YTUC | slnt | opsz | Character |
|---|---|---|---|---|---|---|---|---|
| SHARP | 120 | 340 | 160 | 30 | 740 | 0 | 144 | High contrast, tight, architectural |
| AIRY | -100 | 580 | 40 | 100 | 528 | 0 | 80 | Open counters, spacious, calm |
| HEAVY | 150 | 400 | 175 | 25 | 760 | 0 | 144 | Max stroke weight, dense, powerful |
| REFINED | 0 | 468 | 88 | 78 | 620 | -1 | 100 | Balanced, slight slant, elegant |
| PUNCHY | 100 | 460 | 130 | 50 | 760 | 0 | 120 | High caps, energetic, direct |

#### Mood Implementation

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

### Viewport-responsive width axis

JS resize listener maps viewport width to `wdth` and `opsz` axes continuously:

```ts
function updateHeroAxes() {
  const vw = window.innerWidth;
  const minVw = 320, maxVw = 1920;
  const progress = Math.min(Math.max((vw - minVw) / (maxVw - minVw), 0), 1);

  const wdth = Math.round(25 + progress * (151 - 25));   // 25 → 151
  const opsz = Math.round(8 + progress * (144 - 8));     // 8 → 144

  const r = document.documentElement;
  r.style.setProperty('--hero-wdth', wdth);
  r.style.setProperty('--hero-opsz', opsz);
}

const debouncedResize = debounce(updateHeroAxes, 16); // ~60fps
window.addEventListener('resize', debouncedResize);
updateHeroAxes(); // run on mount
```

### Scroll-based compression

Scroll listener maps 0–300px scroll to font size, weight, grade, tracking, and opacity:

```ts
function updateHeroScroll() {
  const progress = Math.min(window.scrollY / 300, 1);
  const r = document.documentElement;

  // wght: 900 → 500
  r.style.setProperty('--hero-wght', Math.round(900 - progress * 400));

  // GRAD fades back to 0 from mood value
  const moodGrad = parseFloat(r.style.getPropertyValue('--hero-grad')) || 0;
  r.style.setProperty('--hero-grad-active', Math.round(moodGrad * (1 - progress)));

  r.style.setProperty('--scroll-progress', progress);
}

window.addEventListener('scroll', () => {
  requestAnimationFrame(updateHeroScroll);
});
```

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

## Project Data

Projects are stored in a single TypeScript file:

```ts
// data/projects.ts
export const projects = [
  {
    name: "State of Creative Jobs",
    description: "Research tool tracking demand, salary, and AI risk across 20 creative job titles.",
    url: "https://state-of-creative-jobs.vercel.app",
    year: 2025,
    tags: ["Next.js", "TypeScript", "Claude Code"],
  },
  // add new entries here
]
```

Adding a project = adding one object to this array. No CMS, no database, no friction.

---

## File Structure

```
juanemo/
├── app/
│   ├── layout.tsx          # Root layout, font loading, mood script in <head>, theme init
│   ├── page.tsx            # Main page (hero + project list + footer)
│   └── globals.css         # CSS custom properties (color, spacing, motion, font axes)
├── components/
│   ├── Hero.tsx            # JUANEMO variable font hero + accent rule
│   ├── ProjectList.tsx     # Project index with eyebrows, tags, CTA arrows
│   └── Footer.tsx          # Three-column footer bar + theme toggle
├── data/
│   └── projects.ts         # Project data array — edit here to add projects
├── lib/
│   ├── moods.ts            # Mood definitions and random selector
│   ├── fitText.ts          # Binary search font-size fitter
│   └── heroListeners.ts    # Resize + scroll listeners for axis updates
├── public/
│   └── fonts/              # (if self-hosting woff2 files directly)
├── GOALS.md
├── PRD.md
├── TRD.md
├── DESIGN_SYSTEM.md
└── README.md
```

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
- **Domain:** TBD — can use `juanemo.vercel.app` initially
- **Auto-deploy:** Every push to `main` deploys to production
- **Preview deploys:** Every PR gets a preview URL

---

## Open Questions / Deferred to V2

- Whether the mood name is surfaced anywhere visibly (e.g. a hidden element, a console.log easter egg)
- Per-project mood assignment on hover
- Generative background element
- Sound layer
