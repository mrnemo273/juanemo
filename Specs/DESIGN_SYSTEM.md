# DESIGN_SYSTEM.md — Juanemo Design System

## Status: ✅ V1 Defined — Enriched from Figma

---

## 1. Color

Five tokens. Two modes. One accent. The palette inverts cleanly — darks become backgrounds, lights become text, Bittersweet stays constant.

### Palette

| Name | Hex | Role |
|---|---|---|
| Gunmetal | `#1F2627` | Dark bg / Light text |
| Outer Space | `#364245` | Dark surface / card borders / Light secondary surface |
| Bittersweet | `#F25C54` | Accent — both modes |
| Dun | `#D6C5AB` | Dark display type / Dark secondary text / Light surface |
| Bone | `#EBE2D6` | Dark body text / Light bg |

### CSS Tokens

```css
:root {
  /* Primitives */
  --color-gunmetal:     #1F2627;
  --color-outer-space:  #364245;
  --color-bittersweet:  #F25C54;
  --color-dun:          #D6C5AB;
  --color-bone:         #EBE2D6;

  /* Semantic — Dark mode (default) */
  --color-bg:           var(--color-gunmetal);
  --color-surface:      var(--color-outer-space);
  --color-text:         var(--color-bone);
  --color-text-muted:   var(--color-dun);
  --color-text-faint:   rgba(235, 226, 214, 0.5);   /* labels, footer, low-priority meta */
  --color-text-soft:    rgba(235, 226, 214, 0.8);   /* secondary body copy */
  --color-accent:       var(--color-bittersweet);
  --color-tag-bg:       rgba(255, 255, 255, 0.08);  /* pill/tag backgrounds */
}

[data-theme="light"] {
  --color-bg:           var(--color-bone);
  --color-surface:      var(--color-dun);
  --color-text:         var(--color-gunmetal);
  --color-text-muted:   var(--color-outer-space);
  --color-text-faint:   rgba(31, 38, 39, 0.5);
  --color-text-soft:    rgba(31, 38, 39, 0.8);
  --color-accent:       var(--color-bittersweet);
  --color-tag-bg:       rgba(0, 0, 0, 0.08);
}
```

### Usage Rules

- `--color-bg` — page background only
- `--color-surface` — card backgrounds, hover states; use `--color-outer-space` directly for bordered cards on dark bg
- `--color-text` — primary body copy and headings
- `--color-text-muted` — display type accent (Dun on dark); metadata, secondary info
- `--color-text-faint` — footer labels, page numbers, lowest-priority info
- `--color-text-soft` — secondary body copy columns, supporting text
- `--color-accent` — Bittersweet. Used sparingly: the divider line, hover states on project links, CTA arrows. One use per view. Never as a fill, never in the hero letterforms.
- `--color-tag-bg` — pill/tag chip backgrounds (translucent, adapts to both modes)

### The Bittersweet Rule — Confirmed by Figma

The Figma cover design makes the rule explicit: Bittersweet appears as a **single horizontal rule** (`<hr>` or `border`) that cuts across the composition at a structurally significant moment — between major display text elements. It is not a color applied to type. It is a line. Use it exactly once per page section. Its power comes entirely from restraint.

```css
.accent-rule {
  display: block;
  width: 100%;              /* or a defined width — can be partial */
  height: 2px;
  background: var(--color-accent);
  border: none;
}
```

---

## 2. Typography

### Typefaces

| Role | Font | Source | Notes |
|---|---|---|---|
| Hero display | Roboto Flex | Fontsource (`@fontsource-variable/roboto-flex/full.css`) | Variable font, all 13 axes. **Must use `full.css`** — default import only has wght. |
| Body / UI | DM Sans | Fontsource (`@fontsource/dm-sans`) | Clean, readable, pairs with Roboto Flex |
| Labels / eyebrows | DM Sans | Same as body | All caps, tracked, medium weight |

**Note on Figma source fonts:** The Figma designs use **Switzer** (Light, Regular, Medium). Switzer is a beautiful grotesque but requires a Fontshare license and isn't self-hostable via Fontsource. DM Sans is the closest freely available equivalent in weight feel and humanist character. The design language transfers cleanly.

---

### Hero — Roboto Flex

The JUANEMO wordmark uses Roboto Flex with all 13 axes. Primary behavior axes: `wdth` (responsive to viewport) and `wght` (responsive to scroll). Secondary axes controlled by the mood system on load.

**Key insight from Figma:** Display type on the cover uses Switzer Light at enormous scale with heavy negative tracking (`-12.5px` at 250px = `-5%`). Color is **Dun (`#D6C5AB`)**, not Bone — a deliberate warmth choice that sits beautifully against Gunmetal. Apply this to the JUANEMO hero.

```css
.hero-text {
  font-family: 'Roboto Flex Variable', sans-serif;
  text-transform: uppercase;
  letter-spacing: -0.04em;          /* tight, matches Figma tracking ratio */
  line-height: 0.9;
  color: var(--color-text-muted);   /* Dun, not Bone — warmer against Gunmetal */
  font-variation-settings:
    'wdth' var(--hero-wdth),
    'wght' var(--hero-wght),
    'opsz' var(--hero-opsz),
    'GRAD' var(--hero-grad),
    'slnt' var(--hero-slnt),
    'XTRA' var(--hero-xtra),
    'XOPQ' var(--hero-xopq),
    'YTUC' var(--hero-ytuc);
}
```

#### Responsive Axis Spec (Updated Phase 2)

All three structural axes are now viewport-responsive. Viewport range: 500–1920px. Below 500px clamps to minimum values.

| Viewport | `wdth` | `wght` | `opsz` | Character |
|---|---|---|---|---|
| Mobile (≤500px) | 25 | 100 | 8 | Ultra-condensed, light, tall letters |
| Tablet (768px) | 48 | 267 | 44 | Condensed, light-medium |
| Desktop (1280px) | 105 | 554 | 100 | Extended, medium-bold |
| Wide (1920px+) | 151 | 900 | 144 | Ultra-extended, bold, wide |

**Key change from original spec:** `wght` is viewport-responsive (100–900), not locked at 900. The font transforms fluidly — mobile is light + condensed, desktop is bold + extended. This IS the creative concept.

#### Scroll Compression Spec (DEFERRED)

**Status:** Implemented during Phase 2 but visually broken in practice. Disabled per JC. To be redesigned if revisited.

Original spec preserved for reference:

| Property | At scroll 0 | At scroll 300px |
|---|---|---|
| Font size | fills 50vh | 5rem |
| `wght` | 900 | 500 |
| `GRAD` | mood value | 0 |
| Letter spacing | -0.04em | -0.02em |
| Opacity | 1 | 0.85 |

Easing: `cubic-bezier(0.16, 1, 0.3, 1)`

---

### Body & UI — DM Sans

```css
body {
  font-family: 'DM Sans', sans-serif;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.65;
  color: var(--color-text);
}
```

#### Full Type Scale

| Token | Size | Weight | Line Height | Tracking | Use |
|---|---|---|---|---|---|
| `display` | 44–70px | 300 | 1.2 | -0.03em | Section headlines, case study titles |
| `headline` | 24px | 300 | 1.5 | -0.02em | Sub-headlines, creative insights |
| `body-lg` | 18px | 400 | 1.5 | -0.01em | Intro paragraphs, supporting body |
| `body` | 15px | 400 | 1.65 | 0 | Default body copy |
| `body-sm` | 13px | 400 | 1.6 | 0 | Secondary info |
| `project-title` | 18px | 500 | 1.2 | -0.01em | Project list names |
| `label` | 11–14px | 500 | 1 | 0.1em | Eyebrow labels — ALL CAPS |
| `footer` | 13–14px | 500 | 1 | 0.1em | Footer bar — ALL CAPS |

**Key insight from Figma:** The eyebrow/label size is **14px** (not 11px) at tracking `1.4px` (~0.1em), in `--color-text-faint` (50% opacity of text color). This gives them presence without competing with display text. Update the label token to 14px for eyebrows above display text; reserve 11px for tags and metadata.

#### Label / Eyebrow — Two Sizes

```css
/* Large eyebrow — above display headlines */
.label-lg {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-faint);
}

/* Small label — tags, metadata, footer */
.label {
  font-family: 'DM Sans', sans-serif;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
```

---

### The Dash Separator — Typographic Element

Confirmed in Figma: items in a horizontal list (roles, team members, name segments) are separated by `---` with heavy negative tracking, creating a visual em-dash-like ligature. This is a typographic choice, not a UI component.

```css
.dash-separator {
  letter-spacing: -0.15em;
  color: var(--color-text-faint);
}
```

Usage: `Co-Founder <span class="dash-separator">---</span> Chief Creative Officer`

Also used in the footer bar: `JUAN<span class="dash-separator">---</span>CARLOS MORALES`

---

### CTAs

Arrow right `→`. At rest: `--color-text-muted`. On hover: `--color-accent`, nudges 3px right.

```css
.cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-out-expo);
}
.cta:hover { color: var(--color-accent); }
.cta .arrow {
  display: inline-block;
  transition: transform var(--duration-fast) var(--ease-out-expo);
}
.cta:hover .arrow { transform: translateX(3px); }
```

---

## 3. Mood System — Roboto Flex Random Axes (ON HOLD)

**Status:** Disabled during Phase 2. The character axes (XOPQ, XTRA, YOPQ) produce different glyph widths per mood, breaking fitText consistency on mobile. JC approved disabling in favor of viewport-responsive axis architecture.

**Future approach:** Constrain moods to **width-safe axes only** (GRAD, slnt, YTUC) while leaving width-affecting axes (XOPQ, XTRA, YOPQ) to the viewport system. This preserves mood personality without breaking sizing. The `<head>` script is commented out in `app/layout.tsx`. Mood definitions remain in `lib/moods.ts`.

**Original design (preserved for reference):** On each page load, one of five moods is selected at random. Each mood uses a distinct combination of Roboto Flex's secondary axes. All moods lock `wght` at 900. Each must look like a deliberate design choice.

### The Five Moods (Original — Not Currently Active)

```js
const moods = {
  SHARP:   { GRAD: 120,  XTRA: 340, XOPQ: 160, YOPQ: 30,  YTUC: 740, slnt: 0,  opsz: 144 },
  AIRY:    { GRAD: -100, XTRA: 580, XOPQ: 40,  YOPQ: 100, YTUC: 528, slnt: 0,  opsz: 80  },
  HEAVY:   { GRAD: 150,  XTRA: 400, XOPQ: 175, YOPQ: 25,  YTUC: 760, slnt: 0,  opsz: 144 },
  REFINED: { GRAD: 0,    XTRA: 468, XOPQ: 88,  YOPQ: 78,  YTUC: 620, slnt: -1, opsz: 100 },
  PUNCHY:  { GRAD: 100,  XTRA: 460, XOPQ: 130, YOPQ: 50,  YTUC: 760, slnt: 0,  opsz: 120 },
};

const keys = Object.keys(moods);
const mood = moods[keys[Math.floor(Math.random() * keys.length)]];
const root = document.documentElement;
Object.entries({
  '--hero-grad': mood.GRAD, '--hero-xtra': mood.XTRA,
  '--hero-xopq': mood.XOPQ, '--hero-yopq': mood.YOPQ,
  '--hero-ytuc': mood.YTUC, '--hero-slnt': mood.slnt,
  '--hero-opsz': mood.opsz,
}).forEach(([k, v]) => root.style.setProperty(k, v));
```

Place this in `<head>` before any font rendering. No flash. *(Currently commented out in `app/layout.tsx`.)*

---

## 4. Component Patterns — From Figma

### 4a. Card

Confirmed pattern from case study. Dark bg card with Outer Space border and 16px radius.

```css
.card {
  background: var(--color-bg);
  border: 1px solid var(--color-outer-space);
  border-radius: 16px;
  overflow: hidden;
  padding: 24px 32px;
}
```

Light bg variant uses `var(--color-surface)` background, same border.

### 4b. Tag / Pill

Confirmed from KEY ACTIVITIES section. Translucent bg, 8px padding, 8px radius, body text color.

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 8px;
  background: var(--color-tag-bg);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text);
  white-space: nowrap;
}
```

Tags wrap naturally in a flex container with `gap: 8px; flex-wrap: wrap`.

### 4c. Footer Bar

Confirmed from all Figma nodes. A three-column full-width footer row, all uppercase labels, space-between.

```css
.footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-lg) var(--page-margin);
}

.footer-bar span {
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-faint);
}
```

Content: `JUAN<dash>CARLOS MORALES` · `JUANEMO` · `BUILT WITH CLAUDE CODE →`

The dash between JUAN and CARLOS uses the `.dash-separator` pattern.

### 4d. Two-Column Content Layout

Confirmed from Letter and Case Study Content nodes. Left column: large intro statement (display or headline size). Right column: smaller running body copy (body-lg, softer opacity).

```css
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  align-items: start;
}

.two-col .col-intro {
  font-size: 24px;
  font-weight: 300;
  line-height: 1.3;
  letter-spacing: -0.02em;
  color: var(--color-text);
}

.two-col .col-body {
  font-size: 14px;
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-text-soft);
}
```

### 4e. Section with Eyebrow

Confirmed pattern across all content nodes. Eyebrow label stacked above display text, 24px gap.

```html
<section class="section-block">
  <span class="label-lg">PROJECTS</span>
  <h2 class="display">...</h2>
</section>
```

```css
.section-block {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
```

---

## 5. Spacing & Layout

```css
:root {
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  32px;
  --space-xl:  64px;
  --space-2xl: 128px;

  --page-margin:  clamp(24px, 5vw, 80px);
  --hero-height:  50vh;
  --max-width:    1400px;
  --card-radius:  16px;
  --tag-radius:   8px;
}
```

---

## 6. Motion

```css
:root {
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:   cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 120ms;
  --duration-mid:  220ms;
  --duration-slow: 400ms;
}
```

| Interaction | Duration | Easing |
|---|---|---|
| Hero axis / resize | 80ms | linear |
| Hero scroll compression | continuous | `--ease-out-expo` |
| CTA arrow nudge | 120ms | `--ease-out-expo` |
| Theme toggle | 300ms | `--ease-in-out` |
| Project link hover | 120ms | `--ease-out-expo` |

```css
@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0ms !important; animation-duration: 0ms !important; }
}
```

---

## 7. Theme Toggle

Dark default. Light opt-in via `[data-theme="light"]` on `<html>`. Persists to `localStorage`.

```js
const saved = localStorage.getItem('juanemo-theme');
if (saved === 'light') document.documentElement.dataset.theme = 'light';
```

Toggle: inline in footer. `DARK · LIGHT` as `.label` text. No icons. Active mode full opacity, inactive faint.

---

## 8. Font Loading

```bash
npm install @fontsource-variable/roboto-flex @fontsource/dm-sans
```

```ts
// app/layout.tsx
import '@fontsource-variable/roboto-flex/full.css'; // MUST use full.css — default only has wght axis
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
```

Preload in `<head>` to eliminate FOUT:

```html
<link rel="preload" as="font" type="font/woff2" crossorigin
  href="/_next/static/media/roboto-flex-latin-wght-normal.woff2" />
```

---

## 9. Component Reference

### `<Hero>` (Phase 2 — Built)
- `'use client'` component with `useEffect` + `useRef`
- Full-width, `--hero-height` (50vh) on load
- JUANEMO as real DOM `<div>` with `role="heading" aria-level={1}` — not SVG, not canvas
- Color: `--color-text-muted` (Dun) — warmer against Gunmetal, per Figma
- Viewport-responsive `wdth` + `wght` + `opsz` via `updateHeroAxes()` (resize listener)
- `fitHeroText()` runs after axis update (with `requestAnimationFrame` gap for glyph re-render)
- Padding: `calc(var(--page-margin) / 2)` — halved per JC feedback
- Text docked top-left (`justify-content: flex-start; align-items: flex-start`) per JC feedback
- `aria-label="Juanemo"` on the element
- Mood system: **on hold** (script commented out)
- Scroll compression: **deferred** (was visually broken)
- Accent rule: **deferred** (waiting for hero composition to settle)

### `<ProjectList>` (Phase 3 — Built)
- Newspaper-style full-bleed vertical list — no cards, no max-width constraint
- Each entry is a numbered grid: `01`, `02` in Bittersweet (weight 300, same size as title) + content column
- Title: all-caps, `clamp(28px, 3vw, 40px)`, weight 500, `-0.02em` tracking
- Below title: `.label-lg` eyebrow showing `publishedDate` string
- Description: body copy (15px, `--color-text-soft`)
- "View Project →" CTA: `--color-text-muted` at rest, `--color-accent` on hover, arrow nudges 3px right
- Opens `_blank` with `rel="noopener noreferrer"`
- Thin 1px HR separators (`--color-surface`) between entries
- Mobile (≤600px): numbers stack on top of content
- Data: `data/projects.ts` — `Project` interface has `name`, `description`, `url`, `publishedDate`

### `<Footer>` (Phase 3 — Built)
- Three-column layout, full-width with `--page-margin` padding
- Left: `juanemo.com`
- Center: `© 2026 Juan-Carlos Morales`
- Right: Email + LinkedIn contact links
- All text in `.label` styles (11px, 500 weight, 0.1em tracking, uppercase, `--color-text-faint`)
- Links hover to `--color-accent` (Bittersweet)
- 1px top border (`--color-surface`)
- Mobile (≤600px): stacks vertically, centered

---

## 10. Design Principles for Agents

1. **Typography is the product.** Every decision serves the type.
2. **Bittersweet is a line, not a color.** One horizontal rule per composition. Never on text, never as fill.
3. **Dun, not Bone, for display type on dark.** The warmth difference is subtle but real and confirmed by Figma.
4. **The dash separator `---` with negative tracking is a typographic signature.** Use it for list items and the name treatment — not as decoration.
5. **Each mood must look deliberate.** SHARP should look like someone chose SHARP.
6. **Faint opacity text is a layer, not a workaround.** `rgba(text, 0.5)` for lowest-priority labels, `rgba(text, 0.8)` for secondary body. Don't flatten everything to full opacity.
7. **No decoration without purpose.** If it doesn't serve the type or content, it doesn't ship.
8. **Performance is craft.** Zero layout shift, fast first paint, preloaded fonts — these are design values.
