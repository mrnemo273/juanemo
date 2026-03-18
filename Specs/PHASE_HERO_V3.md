# PHASE HERO V3 — ScaleXY Fill + Mobile Axis Caps

## Sprint Goal

Update the hero to scale on **both axes** (scaleX + scaleY) so the wordmark fills the container width AND height — not just width. Add mobile-specific axis range caps so the generative randomization stays readable on small screens. Use a hidden clone measurement approach so there's no visible flash when rescaling.

## Status: `READY`

## Depends On: Hero V2 (complete ✅)

---

## Prerequisites

- Hero V2 is complete: per-character generative drift + hold cycle, scaleX full-width fitting, spring easing
- Read `Specs/PHASE_HERO_V2.md` — understand the current architecture
- **Open `prototypes/hero-generative-scaled.html` in a browser** — this is the approved behavior. Match this feel exactly. Pay attention to:
  - The word fills BOTH width and height of the container
  - No visible flash/shrink when the word rescales
  - The mobile preview frame shows capped axis ranges
  - Spring easing on the scale transform

---

## What's Changing from Hero V2

| Aspect | Hero V2 (Current) | Hero V3 (This Spec) |
|---|---|---|
| Scale | `scaleX` only — fills width | `scale(scaleX, scaleY)` — fills width AND height |
| Container height | `min-height: 70vh` / `40vh` mobile | `height: 50vh` fixed (text fills it via scaleY) |
| Measurement | Direct measurement with transform reset | Hidden clone — no visible flash |
| Mobile axes | Same ranges as desktop | Capped: wght 300–650, wdth 25–100, opsz 8–100 |
| Mobile height | 40vh | 35vh (less vertical stretch, tested and approved) |

---

## Task List

### HV3.1 — Update `lib/generativeAxes.ts` — Add Mobile Ranges

- [ ] Add mobile-specific axis ranges alongside the existing desktop ranges:
  ```ts
  export const AXIS_RANGES_DESKTOP = {
    wdth: { min: 25, max: 151 },
    wght: { min: 300, max: 900 },
    opsz: { min: 8, max: 144 },
  };

  export const AXIS_RANGES_MOBILE = {
    wdth: { min: 25, max: 100 },   // cap width — ultra-extended is too much at small scale
    wght: { min: 300, max: 650 },  // cap weight — ultra-bold gets illegible on mobile
    opsz: { min: 8, max: 100 },
  };
  ```
- [ ] Update `randomAxes()` to accept an optional ranges parameter:
  ```ts
  export function randomAxes(ranges?: typeof AXIS_RANGES_DESKTOP): AxisValues;
  ```
  Defaults to `AXIS_RANGES_DESKTOP` if no argument passed.
- [ ] Rename the existing `AXIS_RANGES` to `AXIS_RANGES_DESKTOP` for clarity. Update Hero.tsx imports accordingly.
- [ ] Export both `AXIS_RANGES_DESKTOP` and `AXIS_RANGES_MOBILE`

### HV3.2 — Update Hero.tsx — ScaleXY + Hidden Clone Measurement

**Replace the current `scaleX`-only approach with `scale(scaleX, scaleY)` using a hidden clone for measurement.**

The current Hero resets the word's transform to `none` to measure natural width, which causes a visible shrink-then-grow flash. The fix: create a hidden clone of the word element, keep its axis values in sync, and measure the clone instead. The visible word never loses its transform.

- [ ] **Create hidden clone on mount:**
  ```ts
  // Clone the word element, make invisible, append to hero container
  const measureEl = wordEl.cloneNode(true);
  measureEl.style.position = 'absolute';
  measureEl.style.visibility = 'hidden';
  measureEl.style.pointerEvents = 'none';
  measureEl.style.transform = 'none';  // always unscaled for measurement
  measureEl.style.left = '0';
  measureEl.style.top = '0';
  heroEl.appendChild(measureEl);
  ```

- [ ] **Sync clone after every axis change:**
  When a character's `fontVariationSettings` change, immediately apply the same change to the corresponding clone span (including the same transition so the clone animates in sync):
  ```ts
  // Inside the shuffle loop, after setting axes on the real char:
  const cloneChars = measureEl.querySelectorAll('span');
  if (cloneChars[i]) {
    cloneChars[i].style.transition = `font-variation-settings ${duration}ms ${SPRING_EASING}`;
    cloneChars[i].style.fontVariationSettings = axisString(c.axes);
  }
  ```

- [ ] **fitWord measures clone, scales visible word on both axes:**
  ```ts
  function fitWord() {
    syncClone();
    void measureEl.offsetWidth; // force layout on clone only

    const naturalWidth = measureEl.scrollWidth;
    const naturalHeight = measureEl.getBoundingClientRect().height;

    const heroStyle = getComputedStyle(heroEl);
    const containerWidth = heroEl.clientWidth - parseFloat(heroStyle.paddingLeft) - parseFloat(heroStyle.paddingRight);
    const containerHeight = heroEl.clientHeight - parseFloat(heroStyle.paddingTop) - parseFloat(heroStyle.paddingBottom);

    if (naturalWidth <= 0 || naturalHeight <= 0) return;

    const scaleX = containerWidth / naturalWidth;
    const scaleY = containerHeight / naturalHeight;

    wordEl.style.transition = `transform 0.6s ${SPRING_EASING}`;
    wordEl.style.transform = `scale(${scaleX}, ${scaleY})`;
  }
  ```

- [ ] **ResizeObserver on the clone** (not the visible word):
  The `ResizeObserver` should watch the hidden clone element. As the clone's axis transitions cause its size to change, the observer fires `fitWord()` which recalculates and smoothly updates the visible word's scale. Also listen on `window.resize`.

- [ ] **Word element setup:**
  - `transform-origin: top left` — so scaling anchors to the top-left corner
  - `white-space: nowrap` — prevent wrapping
  - `display: flex; align-items: baseline` — keep letter baselines aligned

- [ ] **Clean up clone on unmount** — remove from DOM in the useEffect cleanup

### HV3.3 — Update Hero.module.css — Fixed Height Container

- [ ] Change hero container from `min-height` to **fixed `height`**:
  ```css
  .hero {
    width: 100%;
    height: 50vh;
    padding: var(--page-margin);  /* full page-margin, not halved */
    overflow: hidden;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    position: relative;  /* for absolute-positioned clone */
  }
  ```
- [ ] Mobile breakpoint:
  ```css
  @media (max-width: 600px) {
    .hero {
      height: 35vh;  /* less vertical stretch on mobile */
      padding: 24px 16px;
    }
  }
  ```
- [ ] Word element:
  ```css
  .word {
    display: flex;
    align-items: baseline;
    white-space: nowrap;
    transform-origin: top left;
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  ```

### HV3.4 — Mobile Axis Detection + Capped Ranges

- [ ] In Hero.tsx, detect mobile viewport and pass the appropriate axis ranges to `randomAxes()`:
  ```ts
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 600;
  const axisRanges = isMobile ? AXIS_RANGES_MOBILE : AXIS_RANGES_DESKTOP;
  ```
- [ ] Use `axisRanges` for both initial randomization and all subsequent shuffle cycles
- [ ] Re-evaluate on window resize — if the viewport crosses the 600px threshold, switch ranges on the next shift cycle (don't interrupt a hold)
- [ ] This means on mobile, `wght` caps at 650 (not 900) and `wdth` caps at 100 (not 151) — preventing ultra-bold ultra-extended states that get illegible in the smaller, vertically-stretched container

### HV3.5 — Build & Responsive QA

- [ ] `npm run build` — zero errors
- [ ] Desktop (1280px+): word fills container width and ~50vh height. Drift + hold cycle smooth. Spring overshoot visible but contained within the container (no visual overflow).
- [ ] Mobile (≤600px): word fills container width and ~35vh height. Axis values stay within capped mobile ranges — no ultra-bold, no ultra-extended. Vertical stretch is present but not excessive.
- [ ] Resize browser across the 600px breakpoint — the hero smoothly transitions between desktop and mobile sizing. Next shuffle cycle picks up the correct axis ranges.
- [ ] Refresh 5+ times — different starting configurations each time
- [ ] No visible flash/shrink when the word rescales during axis transitions — the hidden clone measurement should make this seamless
- [ ] `prefers-reduced-motion`: transitions instant, states still change

---

## Definition of Done

- [ ] Hero fills container on both X and Y axes (not just width)
- [ ] No visible measurement flash — hidden clone approach works seamlessly
- [ ] Mobile uses capped axis ranges: wght ≤650, wdth ≤100
- [ ] Mobile hero height is 35vh (desktop 50vh)
- [ ] Spring easing on scale transform: `cubic-bezier(0.34, 1.56, 0.64, 1)`
- [ ] ResizeObserver on hidden clone fires fitWord during transitions
- [ ] Works at 320px, 768px, 1280px, 1920px
- [ ] `npm run build` passes

---

## Design Guardrails

1. **No measurement flash.** The visible word must never reset its transform. All measurement happens on the hidden clone.
2. **Spring easing is non-negotiable.** `cubic-bezier(0.34, 1.56, 0.64, 1)` — on both axis transitions and scale.
3. **Mobile must feel commanding, not illegible.** The axis caps (wght 650, wdth 100) prevent the letters from getting too heavy or too wide in the vertically-stretched mobile container.
4. **The text fills its box.** The hero container IS the text. There should be no dead space — the word scales to claim every pixel (minus padding).
5. **The hold matters.** Each configuration gets time to be admired. The scaleXY should settle smoothly and then sit perfectly still.

---

## Builder Notes

> _Document decisions, problems, deviations, and items for the scrummaster here._

### Decisions Made
- Changed `AxisRanges` type from `typeof AXIS_RANGES_DESKTOP` (literal `as const` types) to an explicit `interface` with `number` fields — the `as const` literal types made desktop/mobile ranges incompatible at the type level (e.g., `100` not assignable to `151`)
- Kept a backwards-compatible `AXIS_RANGES` alias pointing to `AXIS_RANGES_DESKTOP` in case any future consumers import the old name
- Clone element has `role`, `aria-level`, and `aria-label` attributes removed to avoid duplicate accessibility landmarks
- Hero container uses `var(--page-margin)` for padding (full margin, not halved) per spec — this differs from V2's `calc(var(--page-margin) / 2)`
- `prefers-reduced-motion` now also disables the `.word` scale transition (not just `.char` axis transitions)

### Problems Encountered
- TypeScript build failed on first attempt: `as const` on both range objects created incompatible literal types (e.g., `wdth.max: 100` not assignable to `wdth.max: 151`). Fixed by switching to an explicit `AxisRanges` interface with `number` fields.

### Deviations from Spec
- Hero padding changed from V2's `calc(var(--page-margin) / 2)` to full `var(--page-margin)` per V3 spec. This gives more breathing room at the edges and matches the prototype.
- Added `AxisRange` and `AxisRanges` interfaces to `generativeAxes.ts` (not explicitly in spec but necessary for TypeScript compatibility).

### Items for Scrummaster
- DESIGN_SYSTEM.md §9 should be updated to reflect: scaleXY (not scaleX-only), fixed height container (50vh/35vh), hidden clone measurement, mobile axis caps
- The hero container height changed from `min-height: 70vh/40vh` to fixed `height: 50vh/35vh` — this is a significant layout change that downstream components should be aware of

---

## Completion Summary

| Field | Value |
|---|---|
| Date completed | 2026-03-18 |
| All tasks done? | Yes — HV3.1, HV3.2, HV3.3, HV3.4, HV3.5 all complete |
| Build passing? | Yes — zero errors |
| Deviations? | Minor — see above. Padding change per spec, added TypeScript interfaces for type safety. |
| New items for backlog? | Update DESIGN_SYSTEM.md §9 for V3 architecture (scaleXY, clone measurement, mobile caps) |
