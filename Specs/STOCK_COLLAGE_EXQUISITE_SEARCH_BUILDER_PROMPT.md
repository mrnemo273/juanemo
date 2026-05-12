# Stock Collage — Section A: Exquisite Search — Builder Prompt

**Status:** 🔵 SPEC WRITTEN
**Experiment slug:** `stock-collage`
**Section letter:** A
**Interaction model:** Compose-then-admire (user builds the collage, then it settles as a finished piece)

---

## What You're Doing

Building the first section of a new collage experiment series. Exquisite Search is a digital take on the surrealist "exquisite corpse" game: three horizontal bands, each filled with a different stock photo. The user composes one band at a time (the others are hidden), then reveals the full composition with a 3D unfold animation. The result should look like art — unexpected juxtapositions of imagery.

**This section also builds all shared infrastructure** for the Stock Collage experiment series — image library data, image picker component, export utility, experiment entry, section switch. Sections B–D will build on this foundation.

**No AI curation.** The user makes all creative choices. No Claude suggestions, no auto-composition. The magic comes from the user's eye + the surprise of the reveal.

**Image source:** Direct Unsplash CDN URLs — no API key needed. A curated library of 50–80 photos ships with the app, organized by category.

---

## Step 0: Shared Infrastructure

### 0a. Image Library Data

Create `data/collageImages.ts`:

```typescript
export interface CollageImage {
  id: string;               // Unsplash photo ID (e.g., '1470071459604-3b5ec3a7fe05')
  url: string;              // Full CDN URL
  thumbUrl: string;         // Thumbnail CDN URL
  category: CollageCategory;
  tags: string[];           // 2-4 descriptive tags for filtering
  dominantColor: string;    // Hex color for placeholder while loading
  aspectRatio: number;      // width/height (e.g., 1.5 for landscape)
}

export type CollageCategory =
  | 'nature'
  | 'architecture'
  | 'people'
  | 'abstract'
  | 'texture'
  | 'urban'
  | 'landscape'
  | 'still-life';

export const COLLAGE_IMAGES: CollageImage[] = [
  // ... 50-80 curated images across all categories
];

// Helper to get images by category
export function getImagesByCategory(category: CollageCategory): CollageImage[] {
  return COLLAGE_IMAGES.filter(img => img.category === category);
}

// Helper to get all categories that have images
export function getCategories(): CollageCategory[] {
  return [...new Set(COLLAGE_IMAGES.map(img => img.category))];
}
```

**URL format:**
- Full size: `https://images.unsplash.com/photo-{id}?w=1200&fit=crop&auto=format&q=80`
- Thumbnail: `https://images.unsplash.com/photo-{id}?w=300&h=200&fit=crop&auto=format&q=60`

**Curation guidelines:** Browse unsplash.com and collect photo IDs. Aim for:
- 6-10 images per category
- Strong composition with clear subjects
- Mix of warm and cool palettes
- Varied orientations (landscape and portrait)
- Images that create interesting juxtapositions when sliced into horizontal bands
- Nature: forests, oceans, mountains, flowers, animals
- Architecture: buildings, interiors, bridges, stairs
- People: silhouettes, crowds, hands, portraits (avoid identifiable faces — use back-to-camera, distance, or silhouette shots)
- Abstract: patterns, light, smoke, ink in water
- Texture: fabric, stone, wood, metal, paper
- Urban: streets, signs, cars, neon
- Landscape: horizons, deserts, fields, skies
- Still life: food, objects, arrangements

**Important:** Every image must be freely usable under the Unsplash license. All Unsplash photos meet this requirement.

### 0b. Image Picker Component

Create `components/experiments/StockCollage/ImagePicker.tsx`:

A reusable modal/overlay gallery for picking images. All four collage sections will use this.

```typescript
interface ImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (image: CollageImage) => void;
  selectedIds?: string[];    // Already-selected images (dimmed in picker)
  maxSelections?: number;    // Optional limit
}
```

**Layout:**
- Full-screen overlay (like the existing IndexOverlay pattern) with dark scrim
- Category tabs across the top (horizontal scroll on mobile)
- Grid of thumbnails (3 columns desktop, 2 mobile)
- Tap thumbnail to select → calls `onSelect` → closes picker
- Loading state: show `dominantColor` placeholder until thumbnail loads
- Close via X button, Escape key, or scrim tap

**Style:** Match the Juanemo design system — Gunmetal background, Dun text/borders, DM Sans typography. Thumbnail borders in `--color-dun` at 20% opacity, selected thumbnails get Bittersweet border.

### 0c. Export Utility

Create `components/experiments/StockCollage/useCollageExport.ts`:

```typescript
export function useCollageExport() {
  const exportAsImage = useCallback(async (
    canvas: HTMLCanvasElement,
    filename: string = 'collage.png'
  ) => {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }, []);

  return { exportAsImage };
}
```

### 0d. Experiment Entry

Add to `data/experiments.ts`:

```typescript
{
  slug: 'stock-collage',
  number: '04',
  name: 'Stock Collage',
  description: 'Four collage techniques using stock photography as raw material.',
  longDescription: 'Surrealist juxtaposition, strip recombination, chromatic blending, and depth-based layering — four ways to cut, merge, and reassemble stock photography into something new.',
  publishedDate: '2026-05',
  sections: ['Exquisite Search', 'Slice & Stack', 'Color Bleed', 'Depth Sandwich'],
  sectionConfigs: [/* ... Section A config here, B-D added by their builders */]
}
```

### 0e. Component Structure

```
components/experiments/StockCollage/
  StockCollageSwitch.tsx     — section router (same pattern as GiantStepsSwitch)
  ImagePicker.tsx            — shared gallery picker
  ImagePicker.module.css
  useCollageExport.ts        — shared export hook
  types.ts                   — shared types
  ExquisiteSearch.tsx         — Section A (this builder)
  ExquisiteSearch.module.css
  SliceStack.tsx              — Section B (future)
  ColorBleed.tsx              — Section C (future)
  DepthSandwich.tsx           — Section D (future)
```

### 0f. Section Config for A

```typescript
{
  letter: 'A',
  name: 'Exquisite Search',
  hint: 'Pick an image for each band',
  hintMobile: 'Tap a band, pick an image',
  description: 'A digital exquisite corpse — compose three horizontal bands one at a time, then reveal the surrealist whole. Each band hides the others while you choose, so the final composition is always a surprise.',
  instructions: [
    { icon: 'layers', text: '<strong>Tap a band</strong> to activate it, then pick an image from the gallery.' },
    { icon: 'image', text: '<strong>Pan & zoom</strong> to position the image within the band.' },
    { icon: 'eye', text: '<strong>Reveal</strong> — unfold all three bands to see the full collage.' },
  ],
  instructionsMobile: [
    { icon: 'layers', text: '<strong>Tap a band</strong> to pick its image.' },
    { icon: 'move', text: '<strong>Drag</strong> to position, <strong>pinch</strong> to zoom.' },
    { icon: 'eye', text: '<strong>Reveal</strong> — unfold to see the collage.' },
  ],
  controls: ['feather', 'bandRatio', 'export'],
}
```

---

## Step 1: Canvas Layout — Three Bands

The canvas fills the experiment viewport (same as all other experiments — `100vw × 100vh` minus ExperimentFrame chrome).

**Three horizontal bands** divide the canvas:

```
┌─────────────────────────┐
│         TOP BAND        │  ← image 1
├─────────────────────────┤
│        MIDDLE BAND      │  ← image 2
├─────────────────────────┤
│        BOTTOM BAND      │  ← image 3
└─────────────────────────┘
```

**Band ratios** (controlled by settings):
- Equal: 33% / 33% / 33%
- Golden: 38% / 24% / 38%
- Cinematic: 25% / 50% / 25%

Default: Equal.

**Seam feathering:** 8px Gaussian-style gradient blend at band boundaries. Controlled by "Feather" slider (0–20px). Implemented via canvas `globalCompositeOperation` or gradient alpha masks at the seam edges.

---

## Step 2: Fold Mechanic (Compose Mode)

While composing, only the **active band** is fully visible. The other two bands are collapsed to a thin 20px "sliver" showing just a hint of their content (or a placeholder if no image picked yet).

**State machine:**
```
COMPOSE → (all 3 images picked) → READY → (tap reveal) → REVEALING → COMPLETE
```

- `COMPOSE`: One band is active (expanded), others are slivers. Tap a sliver to switch active band.
- `READY`: All 3 images placed. A "Reveal" button appears (centered, prominent, matches design system). Active band can still be changed to adjust.
- `REVEALING`: The 3D unfold animation plays (see Step 4).
- `COMPLETE`: Full collage visible. "Shuffle" and "Export" buttons available. Tap "New" to go back to COMPOSE and start over.

**Active band visual:**
- Full height allocation (minus slivers for the other two)
- Image fills the band with `object-fit: cover` behavior (drawn via canvas `drawImage` with cropping)
- Pan: drag to reposition image within band
- Zoom: scroll wheel (desktop) or pinch (mobile) to scale image within band

**Inactive band slivers:**
- 20px tall
- Show a thin slice of the chosen image, or a dashed outline + "Tap to pick" if empty
- Subtle border in `--color-dun` at 15%

---

## Step 3: Image Picking

When a band is active and empty (or user taps "Change" on a filled band), open the ImagePicker overlay.

After selection:
1. Image loads into the band (show `dominantColor` placeholder while loading)
2. Default position: centered, scaled to cover the band
3. User can pan/zoom to adjust framing

**Pan/zoom on canvas:**
- Desktop: click-drag to pan, scroll wheel to zoom (1.0–3.0× range)
- Mobile: touch-drag to pan, pinch to zoom
- Clamp so image always covers the band (no gaps)

Store per-band state:
```typescript
interface BandState {
  image: CollageImage | null;
  offsetX: number;  // px offset from center
  offsetY: number;
  scale: number;    // 1.0 = fit-to-cover
}
```

---

## Step 4: Reveal Animation

When user taps "Reveal" (all 3 images placed):

1. **Fold up** — bands visually fold like paper. Each band rotates around its top edge:
   - Top band: already in place (no rotation)
   - Middle band: rotates from `rotateX(-90°)` → `rotateX(0°)` (unfolds down from top band)
   - Bottom band: rotates from `rotateX(-90°)` → `rotateX(0°)` (unfolds down from middle band)
   
2. **Stagger:** Top → 0ms, Middle → 400ms, Bottom → 800ms

3. **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) — fast start, gentle settle

4. **Shadow:** During unfold, a soft shadow appears underneath the rotating band (opacity 0.3 → 0, matches rotation)

5. **Duration:** 600ms per band

**Implementation:** This is best done with CSS transforms on `<div>` layers positioned over the canvas, rather than trying to do 3D perspective in canvas 2D. Three absolutely-positioned divs, each containing a `<canvas>` or `<img>` element, with `transform-origin: top center` and `perspective: 1000px` on the parent.

After the animation completes, composite the final result onto a single canvas for export.

---

## Step 5: Shake to Shuffle

In `COMPLETE` state, shake the phone (reuse the shake detection pattern from EXP-01's Shake-to-Reset — `DeviceMotion`, 15 m/s² threshold, 1s cooldown):

- Randomly reassign which image fills which band (3 images × 3 bands = 6 permutations)
- Quick transition: 200ms opacity fade, swap, 200ms fade-in
- Same images, different arrangement → instant variation

Desktop equivalent: "Shuffle" button in the controls area.

---

## Step 6: Export

"Export" button (in controls or as floating button in COMPLETE state):
1. Composite all three bands with feathering onto a single offscreen canvas
2. Call `useCollageExport().exportAsImage(canvas, 'exquisite-search.png')`
3. Brief flash/pulse on the button to confirm

Export canvas should be high-res: `Math.min(window.innerWidth * 2, 2400)` wide × proportional height.

---

## Step 7: Mobile Considerations

- Pan: touch-drag (single finger)
- Zoom: pinch (two fingers)
- Band switching: tap the sliver
- Reveal: tap button (not gesture — too easy to accidentally trigger)
- Shake: shuffle in COMPLETE state
- Gyro: NOT used in this section (collage is about deliberate composition, not motion-reactive)

---

## Controls (Settings Panel)

| Control | Type | Range | Default | Notes |
|---------|------|-------|---------|-------|
| Feather | Slider | 0–20px | 8 | Blend amount at band seams |
| Band Ratio | Segmented | Equal / Golden / Cinematic | Equal | Height distribution of three bands |
| Export | Button | — | — | Downloads composite PNG |
| New Collage | Button | — | — | Resets to COMPOSE state (only visible in COMPLETE) |

---

## Build Order

| Step | Task |
|------|------|
| 1 | Create `data/collageImages.ts` — curate 50-80 Unsplash photos across 8 categories |
| 2 | Create `ImagePicker.tsx` — gallery overlay with category tabs, thumbnail grid |
| 3 | Create `useCollageExport.ts` — canvas → PNG download |
| 4 | Create `types.ts` — shared types |
| 5 | Create `StockCollageSwitch.tsx` — section router |
| 6 | Add experiment entry to `data/experiments.ts` |
| 7 | Create `ExquisiteSearch.tsx` — three-band canvas with fold mechanic |
| 8 | Implement pan/zoom per band |
| 9 | Wire ImagePicker for band selection |
| 10 | Implement reveal animation (CSS 3D unfold) |
| 11 | Implement shake-to-shuffle |
| 12 | Implement export |
| 13 | Add route: `app/experiments/stock-collage/page.tsx` |
| 14 | Test: pick 3 images → reveal → shuffle → export |
| 15 | `npm run build` — zero errors |

---

## What NOT to Do

1. **Don't use the Unsplash API.** All images come from pre-curated CDN URLs. No API key, no runtime search.
2. **Don't add AI curation.** No Claude suggestions, no auto-composition, no "best match" algorithms. User picks everything.
3. **Don't add audio.** This is a visual experiment. No Tone.js, no sound.
4. **Don't make it always-alive.** Once revealed, the collage is static (except shuffle). It's compose-then-admire.
5. **Don't use gyro.** Tilt doesn't affect the collage. Keep it deliberate.
6. **Don't break existing experiments.** This is a new experiment entry — EXP-01, 02, 03 should be completely unaffected.
7. **Don't use identifiable faces in curated photos.** Stick to silhouettes, backs, crowds, distance shots.

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| ES.1 | Image library has 50+ photos across 6+ categories with working Unsplash CDN URLs |
| ES.2 | ImagePicker opens as overlay with category tabs and thumbnail grid |
| ES.3 | Three horizontal bands render with configurable height ratios |
| ES.4 | Fold mechanic: only active band is expanded, others are 20px slivers |
| ES.5 | User can pick an image for each band from the gallery |
| ES.6 | Pan and zoom work within each band (desktop: drag+scroll, mobile: drag+pinch) |
| ES.7 | Image always covers the band — no gaps visible after pan/zoom |
| ES.8 | Reveal button appears when all 3 images are placed |
| ES.9 | 3D unfold animation plays top→middle→bottom with 400ms stagger |
| ES.10 | Feather slider controls blend amount at band seams (0–20px) |
| ES.11 | Shake-to-shuffle randomizes image-to-band assignment |
| ES.12 | Export downloads a high-res composite PNG |
| ES.13 | Desktop: zero issues, mouse interaction works throughout |
| ES.14 | Mobile: touch pan/zoom, tap to switch bands, pinch zoom |
| ES.15 | `npm run build` — zero errors |

---

## Builder Notes

**Status:** ✅ Section A shipped, shared infra in place for B–D.

### What landed

Files created:
- `components/experiments/StockCollage/types.ts` — `BandState`, `BandIndex`, `CollagePhase`, ratio table, sliver/zoom/shake constants
- `components/experiments/StockCollage/useCollageExport.ts` — `canvas.toDataURL` + anchor download
- `components/experiments/StockCollage/ImagePicker.tsx` + `.module.css` — overlay picker with All + 8 category tabs, 3-col (2-col mobile) thumb grid, dominantColor placeholders, escape/scrim close, body-scroll lock
- `components/experiments/StockCollage/StockCollageSwitch.tsx` — section router (Section A only for now; B–D drop in via `if (activeSection === N)` once shipped)
- `components/experiments/StockCollage/ExquisiteSearch.tsx` + `.module.css` — Section A in full

Files modified:
- `lib/ExperimentControlsContext.tsx` — added `feather: number` (default 8) and `bandRatio: BandRatio` (default `'equal'`). Backwards-compatible additions to the same shared context that already carries tempo/decay/etc.
- `components/ExperimentFrame.tsx` + `.module.css` — added state, panel UI, and a slider stylesheet for `'feather'` and `'bandRatio'` controls. Sections B–D will get them for free.
- `data/experiments.ts` — added `stockCollageSectionConfigs` and a `stock-collage` experiment entry (number `04`, May 2026, single section A for now)
- `app/experiments/[slug]/page.tsx` — registered `'stock-collage' → StockCollageSwitch`

### Architecture decisions

**Three positioned `<div>` bands, each holding a `<canvas>`.** Bands are absolutely positioned with computed `top` / `height` per phase. Each canvas draws the chosen image with a manual cover-fit + `state.scale` + normalized `state.offsetX/Y` offsets, so the same band state survives layout changes (sliver ↔ active ↔ natural ratio) without warping the offset semantics. Pan offsets are normalized to drawW/drawH so they continue to mean the same thing across band-size changes — though as expected, the visible crop reads differently in compose vs. complete because the band's aspect ratio changes (called out in the spec; this is part of the surrealist surprise).

**Layout is the SOLE driver of phase visualisation; transforms layer on top.** In compose/ready: active band gets `viewportH - 2 * 20px`, the other two are 20px slivers. In revealing/complete: bands snap to the natural ratio table (equal / golden / cinematic). I added a 350ms `top` / `height` transition only for the compose↔ready flow (sliver ↔ active band switching feels nice with a smooth resize); during reveal, layout is snapped instantly so the rotateX takes the spotlight.

**Reveal animation is a 2-frame transition trick.** When `phase` enters `revealing`:
1. `revealStep = 0`, transitions disabled, middle + bottom inline-style `transform: rotateX(-90deg)`. (Layout has just snapped to natural ratio; with rotateX(-90) the folded bands are flat-on, invisible — you only see the top band sitting in place.)
2. After two `requestAnimationFrame` ticks, `revealStep = 1` → enable the 600ms transform transition. Values still rotateX(-90), so nothing animates yet.
3. `revealStep = 2` at +400ms → middle gets rotateX(0), 600ms unfold animates.
4. `revealStep = 3` at +800ms → bottom gets rotateX(0), 600ms unfold animates.
5. `phase = 'complete'` at +800+600+50ms.

`transform-origin: top center` + `perspective: 1400px` on the parent gives the 3D fold. Backface-visibility hidden + a soft drop shadow on `.bandFolded` sells the paper feel during rotation.

**Feathering is overlapping bands + linear-gradient masks.** Each band's DOM rect overflows into its neighbor's region by `feather` px (top band overflows down only, middle overflows both ways, bottom overflows up only). Each band carries a `mask-image: linear-gradient(...)` whose stops are computed from per-band `topFeather` / `bottomFeather` so the alpha cross-fades on overlap. Feather is automatically zeroed in compose/ready (slivers are 20px — no point feathering them). The same logic is replicated on the offscreen export canvas via `globalCompositeOperation: 'destination-out'` gradient erasures.

**Pan/zoom is a pointer-events + touch-events hybrid.** Mouse + single-finger touch flows through pointer events (single drag = pan; if the pointer didn't move > 4px before pointerup, treat as a tap). Pinch zoom needs distinct two-finger logic, so it's bolted on via raw `touchstart` / `touchmove` listeners that update `state.scale` from the finger-distance ratio. Wheel zoom on desktop uses `passive: false` to allow `preventDefault`. Pan + zoom are gated on the active band only — slivers are tap-to-activate, never panable.

**Shake-to-shuffle in `'complete'`** reuses the EXP-01 GenerativeType pattern verbatim (15 m/s² gravity-magnitude threshold, 2 detections within a 500ms window, 1s cooldown). Permutation chosen from the 5 non-identity permutations of [0,1,2]; bands fade to `opacity: 0` for 200ms, swap, fade back in. Desktop gets the equivalent "Shuffle" button in the floating action bar.

**Export goes through a temporary offscreen canvas at min(viewportW × 2, 2400) wide.** Each band is rendered to its own temporary canvas at the export-scale rect, the same alpha-gradient mask is burned into it via `destination-out`, then the band canvas is `drawImage`-ed onto the master composite. Background is gunmetal `#1F2627`. `useCollageExport.exportAsImage` triggers the download. The Export button briefly tints bittersweet while the PNG is generated, then resets.

### Deviations from spec

- **`'New Collage'` button label is `New collage`** (sentence case in code → renders "NEW COLLAGE" via `text-transform: uppercase` in CSS). Visually matches "EXPORT" / "SHUFFLE".
- **No `'export'` panel control.** The spec listed `controls: ['feather', 'bandRatio', 'export']` but `Export` and `New collage` are state-machine-dependent (only meaningful in `'complete'`), so they live as inline floating buttons rather than panel buttons. The settings panel only hosts `Feather` (slider) and `Band Ratio` (segmented) — both are continuously tunable in any phase. The spec explicitly allowed Export "in controls or as floating button"; I picked floating for state-fitness.
- **`'Tap to pick'` requires two taps when activating an empty sliver** (one to make it active, one to open the picker). Matches the spec wording — "tap a sliver to switch active band" — and avoids surprise picker-opens when the user just wants to change which band is expanded. Active filled bands also expose a `Change` button at the top-right corner for re-picking without the two-tap dance.
- **`'feather'` / `'bandRatio'` were added to `ExperimentControlsContext`.** This is a deliberate consistency choice — the context already carries jazz-only fields like `tempo`, `decay`, `reverbMix` that are unused by EXP-01. Adding two collage-only fields fits that pattern and lets every Stock Collage section pull them via the same `useExperimentControls()` hook without prop drilling.

### Findings worth following up on (NOT fixed in this PR)

- **Several `data/collageImages.ts` photo IDs return 404 from Unsplash.** Confirmed example: `1490750967868-88aa4f44baee` (tagged `nature: flower, pink, bloom`) returns 404; the `dominantColor` placeholder fills in but the canvas stays empty. Verified-working IDs from the same library include `1469474968028-56623f02e42e` and `1470071459604-3b5ec3a7fe05`. The data file is owned outside this builder ("use it as-is"); recommend the data curator re-validate every photo URL with a HEAD-status sweep and replace the dead IDs.
- **A handful of curated tags don't match the actual photo content** (e.g. `1469474968028-56623f02e42e` is tagged `forest, trees, sunlight` but the photo is a mountain-vista wide shot). Cosmetic only — doesn't affect rendering. Same recommendation: data-side cleanup.
- **`setPointerCapture` was throwing on synthetic test PointerEvents** that lack a real pointer ID (the Next.js dev overlay surfaced 4 instances during automated verification). Wrapped both `setPointerCapture` and `releasePointerCapture` in `try/catch`; real-browser pointer events are unaffected, and the dev panel is now clean.
- **Section A's compose-mode active-band crop is taller than its post-reveal natural-ratio crop.** The spec calls this out ("the magic comes from the user's eye + the surprise of the reveal"). If a future tweak wants WYSIWYG framing, the cleanest change is to render the active-band image inside a natural-ratio sub-rect and use the surrounding active area as visual chrome only — but that's a UX rewrite, not a fix.

### What Sections B–D inherit for free

- `ImagePicker` with category tabs + `selectedIds` dimming
- `useCollageExport` for any canvas → PNG download
- `feather` / `bandRatio` controls in the panel (B/C/D can opt in via their `controls` array; their effective semantics are section-specific)
- The `BandRatio` type and `RATIO_TABLE`
- Routing through `StockCollageSwitch` — append a new `if (activeSection === N) return <X />;` and the new section letter to the experiment's `sections` + `sectionConfigs` arrays.
- `app/experiments/[slug]/page.tsx` already routes `stock-collage`; nothing more needed there.

### Acceptance criteria status

| # | Criterion | Status |
|---|-----------|--------|
| ES.1 | 50+ photos, 6+ categories, working URLs | ⚠️ Library has 71 photos across 8 categories but several IDs 404 — see follow-ups. Infra ✅. |
| ES.2 | ImagePicker overlay with tabs + grid | ✅ |
| ES.3 | Three horizontal bands, configurable ratios | ✅ Equal / Golden / Cinematic |
| ES.4 | Fold mechanic — active expanded, others 20px | ✅ |
| ES.5 | User can pick image per band | ✅ |
| ES.6 | Pan + zoom (desktop drag/scroll, mobile drag/pinch) | ✅ |
| ES.7 | Image always covers band — no gaps | ✅ Cover-fit + clamp on draw |
| ES.8 | Reveal button when all 3 placed | ✅ |
| ES.9 | 3D unfold top→middle→bottom, 400ms stagger | ✅ |
| ES.10 | Feather slider 0–20px | ✅ |
| ES.11 | Shake-to-shuffle | ✅ + desktop Shuffle button |
| ES.12 | Export high-res composite PNG | ✅ ~4MB output, gradient-feather seams baked in |
| ES.13 | Desktop interaction OK | ✅ |
| ES.14 | Mobile touch interaction OK | ✅ (verified via touch + pointer code paths; not gyro-tested live) |
| ES.15 | `npm run build` clean | ✅ Zero errors, route generated, dev console clean post-fix |

### Follow-up: variety knobs (post-ship enhancement, JC creative direction)

After the initial 3-band ship, JC wanted "more complex grids" and "stretching the images so we get some interesting abstract color and patterns." Stayed within Section A's identity rather than splitting into a new section, since the additions are visual variety knobs on the same exquisite-corpse mechanic.

**`bandCount` control (3 / 4 / 5 / 6).** Section now supports N = 3..6 horizontal bands. `RATIO_TABLE` was replaced with a `getRatios(bandRatio, count)` lookup over a 3×4 preset matrix; ratios for 4/5/6 bands are hand-tuned variants of equal/golden/cinematic that preserve the symmetric "thick edges, thin middle" or "thick middle, thin edges" character. Switching `bandCount` mid-experiment grows or trims the bands array (preserves existing entries on growth, drops trailing entries on shrink), trims the canvas/image/cleanup ref arrays in lockstep, clamps `activeBand` into range, and resets the phase to `compose` if the user was already in `revealing`/`complete` (since the layout fundamentally changed). The reveal stagger and cumulative duration both scale with N — a 6-band reveal takes 5 × 400 ms + 600 ms = 2.6 s instead of 3-band's 1.4 s. Shuffle uses Fisher-Yates with non-identity retry to permute across N positions.

**`stretch` toggle (Off / On).** When On, the `drawImageInRect` skips cover-fit and squashes the image to the exact band rect (`baseW = rectW`, `baseH = rectH`, cover = 1). Pan/zoom semantics are preserved at scale > 1, but at scale = 1 the entire image fills the band with no aspect preservation — produces strong horizontal "color field" abstractions, especially when the original images have strong horizontal structure (horizons, water lines, mountain ridges). Verified visually: with 5 stretched bands of mixed nature/landscape photos, the result reads as a single abstract painting rather than a collage. State is kept in the shared `ExperimentControlsContext` and read inside `drawImageInRect` via `stretchRef` so the rendering loop sees fresh values without stale-closure issues.

**Section config:** `controls: ['feather', 'bandRatio', 'bandCount', 'stretch']` — all 4 knobs live in the settings panel.

**No deviations from the variety spec.** The grid (2D) idea was deferred per discussion — it would need its own reveal idiom and is a better fit for a future Section B than a Section A retrofit.

### Follow-up: auto-pick + more rows (post-ship enhancement, JC creative direction)

After the variety knobs landed, JC wanted to remove the manual image-picking UX entirely ("I want you to do that") and add more rows. This was a meaningful identity shift for Section A — the surrealist *exquisite corpse* mechanic depended on the user's blind compose-then-reveal flow. Replacing that with auto-pick converted the section into a **generative discovery** experience: the page hands you a random composition on arrival, and you iterate with shuffles or per-band re-rolls.

**Section now:**
- Bands auto-fill on mount (post-hydrate, client-only).
- Entrance reveal animation runs immediately — no Reveal button.
- **Shuffle** re-rolls every band at once with a 200ms cross-fade.
- **Tap a band** = re-roll just that one band (drag still pans, wheel/pinch still zooms — distinguished by the `movedFar > 4px` threshold in the pointer handler).
- **Shake** (mobile) = same as Shuffle.
- **Export** unchanged.
- Re-rolls bias against repeating the previous image when there are enough other photos in the library, so successive shuffles keep feeling fresh.

**Removed:**
- ImagePicker overlay usage from `ExquisiteSearch.tsx` (the file itself stays — Sections B–D may still want a picker).
- `compose` and `ready` phases (only `revealing` → `complete` remain).
- `activeBand` state + sliver layout + "Tap to pick" placeholder + Change button + handleNew + handleReveal + handleImageSelect.
- "New collage" action button (no compose state to return to — Shuffle replaces the iteration loop).

**Band count knob:** options are now **3 / 5 / 7 / 9 / 12** (was 3/4/5/6). At 12 bands the strips read as a vertical color-stripe pattern even before stretch is applied, and 12 + Stretch + Cinema ratio gives the most painterly result.

**Ratio generator:** the hand-tuned 3×4 preset matrix in `types.ts` was replaced with a `getRatios(preset, count)` function that scales to any band count. `equal` returns `1/N` everywhere; `golden` and `cinematic` use a symmetric weight ramp (`0.6 + 0.8 × distFromCenter` for golden, mirrored for cinematic) normalized to 1. Slight visual drift for 3 bands vs. the previous hand-tuned values (Golden 3 went from 0.38/0.24/0.38 to 0.41/0.18/0.41) — accepted as a fair trade for arbitrary-N support.

**SSR / hydration:**
- `Math.random()` cannot run in the `useState` initializer (it would diverge between SSR pre-render and client hydration → mismatch). Fixed with two-stage init: bands begin as `N` empties (deterministic), then a one-shot `useEffect` (gated by a `didInitialPick` ref) fills with random images post-hydrate. The very first paint shows `dominantColor` placeholder rects in band rects; images fade in over a frame or two.
- Verified via direct HTML check: `curl http://localhost:3000/experiments/stock-collage` returns `aria-label="Band 1 — empty"` etc., confirming the server snapshot is deterministic.

**bandCount resize behavior:**
- Growing N: keep existing entries 0..oldN-1, fill new slots with random images that don't duplicate the existing composition.
- Shrinking N: trim trailing entries.
- Either direction re-triggers the entrance reveal so the layout change feels intentional.

**Section copy** (`data/experiments.ts`) was rewritten to reflect the auto-pick model: hint "Random photos blended into one", instructions point users at tap-to-reroll, shuffle, and the band-count + stretch combo for abstract patterns. No more "tap to pick" copy anywhere.

**Build + verification:** `npm run build` clean. Verified live: 3 / 5 / 7 / 9 / 12 band counts render correctly, bands auto-fill on mount, tap-to-reroll changes a single band's image, Shuffle re-rolls all 12 bands at once, Stretch + Cinema + 12 bands produces a strong abstract horizontal-pattern aesthetic. Earlier Strict-Mode-related hydration errors in the dev console were stale entries from prior reloads — the current server output is deterministic empty bands and the DOM matches.

### Follow-up: Slice mode for true abstraction (post-ship enhancement, JC creative direction)

Even with Stretch on, JC noted "the photos are too apparent what they are." Cover mode shows recognizable photo crops; Stretch shows the whole image squashed but still recognizable. JC wanted bands to look like abstract color/texture fields, not photos.

**Solution: Slice mode** — extract a small random patch of the source image (10–25% wide × 2–6% tall) and stretch it to fill the entire band rect. Even a 5x10x2 patch from a recognizable photo, blown up to 1280×55px, reads as a horizontal color/texture field. Tap to re-roll the band → new image **and** new slice patch.

**Replaced** the boolean `stretch` toggle with a 3-mode picker:
- **Slice** (default for new sessions): abstract patch-stretching.
- **Stretch**: full image squashed to fill the band (previous Stretch behavior).
- **Cover**: full image cropped to band aspect (the original "show me the photo" mode).

**Implementation:**
- New `BandSlice` type in [components/experiments/StockCollage/types.ts](components/experiments/StockCollage/types.ts): `{ sx, sy, sw, sh }` all normalized 0..1, plus a `randomSlice()` generator that picks `sw ∈ [0.10, 0.25]`, `sh ∈ [0.02, 0.06]`, and a position that fits the patch entirely inside the source image.
- `BandState` gained a `slice` field. SSR uses a deterministic placeholder slice (`{ 0.4, 0.4, 0.2, 0.04 }`); real random slices are generated client-side when an image is assigned (via `makeBand(image)` post-hydrate).
- `drawImageInRect` now dispatches on a `mode: CollageMode` parameter:
  - `slice`: `ctx.drawImage(image, sx*W, sy*H, sw*W, sh*H, 0, 0, bandW, bandH)` — the abstract path. Pan/zoom state is ignored (no concept of framing a slice that's already a tiny crop; iterate via tap-to-reroll instead).
  - `stretch`: existing aspect-distorted full-image fit.
  - `cover`: existing aspect-preserved cover crop with pan/zoom.
- Re-rolls (tap or shuffle) regenerate the slice along with the image — same image picked twice in a row would yield different visual bands because the patch differs.
- Slices live on the BandState, stable across renders, so re-renders never jitter the visual.

**Context + UI:** `lib/ExperimentControlsContext.tsx` now has `mode: CollageMode` (default `'slice'`) replacing `stretch: boolean`. `components/ExperimentFrame.tsx` panel got a 3-button "Mode" segmented control (Slice / Stretch / Cover). Section A's `controls` array now lists `'mode'` instead of `'stretch'`.

**No deviations.** Verified live: Slice + 12 bands gave the most painterly result (varied colors, no photo recognizable); Cover + 12 bands still shows the photo crops; switching modes mid-session re-renders all bands without losing state. Tap-to-reroll picks a fresh image AND fresh slice (verified by sampling the canvas center pixel before/after).

### Follow-up: sharp seams + randomized band width/position (post-ship enhancement, JC creative direction)

JC follow-up: "remove the blurring effect in between bands" and "let's not stretch the photo across the screen width — pick a random width for each band so the slice gets distorted differently per band."

**Two changes:**
1. **Sharp seams.** Feather/blur is now hardcoded to 0 in `ExquisiteSearch.tsx`. The `feather` field still exists on the context (other future sections might use it), but Section A overrides it locally. The `'feather'` entry was removed from Section A's `controls` list, so the panel now shows just Ratio / Bands / Mode.
2. **Per-band random width + horizontal offset.** Each `BandState` got two new fields: `bandWidth ∈ [0.30, 0.95]` (fraction of viewport) and `bandX ∈ [0, 1 - bandWidth]` (left edge as fraction of viewport). New `randomBandShape()` helper in `types.ts`. Generated whenever an image is assigned (`makeBand(image)` post-hydrate; SSR keeps `bandWidth: 1, bandX: 0` for deterministic hydration). Applied in render via inline `left: ${bandX*100}%; width: ${bandWidth*100}%;` and the band CSS dropped its `left: 0; right: 0;` defaults.

**Visual effect:** Stack of horizontal stripes of varying widths floating in gunmetal — reads like a Rothko / Diebenkorn layered abstract. Combined with Slice mode and 12 bands, the same slice patch now stretches into different aspect ratios per band, multiplying the distortion. A 25% × 4% source patch stretched into a 30%-wide narrow band looks completely different from the same patch stretched into a 95%-wide band — even with identical source data.

**Export updated** to draw each band at its own width + horizontal offset on the composite canvas (was previously full-width per band). Background stays gunmetal (`#1F2627`) so the empty horizontal regions on either side of narrower bands match the experiment's surround color.

**No deviations.** Verified live: 3-band layout shows three centered-ish stripes of varying widths; 12-band layout produces the densest abstract; tap-to-reroll changes image + slice + width + position together; mode switch (Slice/Stretch/Cover) preserves the per-band shapes (only the rendering inside changes).

### Follow-up: snappier slide-in + vertical margin + 15s auto-rerun (post-ship enhancement, JC creative direction)

JC follow-up: animation too slow, "fill in from right to left in order instead of flipping down"; bands blocking the experiment title; want auto-rerun every 15 seconds.

**Animation rewrite (`rotateX` → `translateX`).** Each band starts at `translateX(110vw)` (off-screen right, transition disabled) and slides into place at `translateX(0)` in top-to-bottom order with a short stagger. Replaces the 3D fold completely:
- `REVEAL_DURATION_MS`: 600 → **250ms**
- `REVEAL_STAGGER_MS`: 400 → **100ms**
- All bands now animate (was: only middle/bottom — top stayed in place)
- 12 bands now reveals in 1.35s (was 5s); 3 bands reveals in 0.45s
- Easing kept at `cubic-bezier(0.16, 1, 0.3, 1)` (expo-out) for a snappy feel

`revealStep` semantics adjusted: `0` = pre-snap (all bands off-right, transition disabled), `1` = transitions enabled (still off-right), `2..N+1` = bands `0..N-1` slide in. Render condition: `phase === 'revealing' && revealStep < i + 2` keeps band `i` off-right.

Removed the `bandFolded` and `bandShuffleHidden` CSS classes plus the `transform-origin: top center` and `perspective: 1400px` styles — none needed for translateX. Verified mid-flight via live state sampling: at +50ms, only band 0 has `translateX(0)`; at +150ms, bands 0 and 1 are in; at +300ms, all three are in. Same shape at 12 bands but staggered out to 1.35s total.

**Vertical margin on `bandsWrap`.** Was `inset: 0` (full container). Now `top: 90px; bottom: 110px;` so the experiment's floating title (`metaTop` at 60px from top) and section hint + action buttons (`metaBottom` at 60px from bottom + actions at 24px) both have clearance. Mobile override at `≤600px`: `top: 70px; bottom: 90px;`. Switched the size-measuring ResizeObserver from the outer `.container` to the new `bandsWrap` ref so band layout math is computed against the inner area, not the full viewport.

**Auto-rerun.** New `AUTO_RERUN_MS = 15000` constant in `types.ts`. New `useEffect([phase])`: when `phase === 'complete'`, schedule a 15s timeout that calls `setBands(reshuffleBands)` + `setPhase('revealing')`. Cleanup cancels on unmount or phase change, so manual shuffles or mode/band-count switches naturally reset the timer (any phase transition cancels the pending timer; a fresh one schedules when phase returns to `complete`). Verified: bands captured at t=0 had different labels at t=16.5s (all 3 of 3 changed).

**Manual `handleShuffle` simplified.** Was: 200ms fade-out → swap → 30ms fade-in. Now just `setBands(reshuffleBands) + setPhase('revealing')` — same path as auto-rerun, so manual and auto shuffles look identical and cleanly re-trigger the slide-in animation. Removed the `shuffleHidden` state + `SHUFFLE_FADE_MS` constant. Tap-to-reroll on a single band stays as an instant swap (no animation) — single-band swaps feel responsive that way.

**No deviations.** Verified live: title and hint are visible above/below the bands; bands slide in left-to-right in top-to-bottom order at 250ms × 100ms stagger; auto-rerun fires every 15s; manual Shuffle replays the same slide-in. Build clean.

### Follow-up: more bands by default + bouncy easing + buttonless UI + animated single-band reroll (post-ship enhancement, JC creative direction)

JC follow-up across two short threads: animation feels too plain ("a little bounce and easing… like it shimmys into its location"); want more bands (mobile especially looked chunky); remove the bottom Shuffle/Export buttons since auto-rerun + tap-to-reroll cover everything; tap-to-reroll on a single band currently pops, want it animated like the entrance.

**Bouncy spring easing.** Replaced `cubic-bezier(0.16, 1, 0.3, 1)` (smooth expo-out) with the project standard spring `cubic-bezier(0.34, 1.56, 0.64, 1)` (the same easing used elsewhere in Juanemo). Bumped duration from 250ms → 350ms so the overshoot has room to read. Each band now overshoots its target by a few percent then settles back. Exposed as a constant `REVEAL_EASING` in `types.ts` so it's tunable in one place.

**More bands.** `SUPPORTED_BAND_COUNTS` was `[3, 5, 7, 9, 12]`. Now **`[6, 12, 18, 24, 36]`**. Default went from 12 → **18**. With 18 horizontal bands on a 700px-tall mobile viewport (minus 70/90px margins → ~540px usable), each band is ~30px tall — no longer chunky. Picker buttons go up to 36 for the densest stripe-pattern look.

**Buttonless UI.** Removed the `actionsBottom` div (Shuffle + Export) entirely from `ExquisiteSearch`. Auto-rerun every 15s + tap-any-band to re-roll just that one + shake-to-shuffle on mobile cover all the iteration paths. The piece now reads as ambient art: it lives, breathes, and you nudge individual strips. Cleaned up the now-unused `useCollageExport` import, `isMobileViewport` helper, `exportFlash` state, `handleExport` callback, `showCompleteActions` flag, `paused` context read, and `isMobile` state. (Export path still exists in `useCollageExport.ts` so future sections can re-add the button.)

**Animated single-band reroll.** The tricky one. Tap-to-reroll now plays the same slide-off-right → spring-back animation as the entrance, but only for the tapped band. Several state-driven attempts hit React/browser timing issues:
1. `setPreSnap.add` + `rAF×2` + `setPreSnap.delete`: React batched the renders and the browser never committed the snap-off state, so the spring transition saw no value change and didn't run.
2. `setPreSnap.add` + `setTimeout(32)` + `setPreSnap.delete`: worked once, then auto-rerun would clobber the per-band state mid-flight.
3. Web Animations API `el.animate(keyframes, { duration, easing, fill: 'none' })`: the animation registered as `playState: 'running'` but `currentTime` stayed at 0 — turned out the test was running in an unfocused preview where rAF + WAA were throttled to ~1Hz.

Final approach (works reliably): **imperative DOM manipulation gated by render-side opt-out.**
- Render: in `complete` phase, the band's inline `transform` and `transition` are deliberately set to `undefined` (omitted), so React doesn't fight over them. In `revealing` phase, render still drives the entrance animation via inline styles.
- `rerollBand(i)`:
  1. `setBands(...)` — re-roll image + slice + width + offset
  2. `bandEl.style.transition = 'none'; bandEl.style.transform = 'translateX(110vw)'`
  3. `requestAnimationFrame(() => requestAnimationFrame(() => { ... }))` — two frames so the browser actually paints the snap-off state before the next style change
  4. Inside the inner rAF: `bandEl.style.transition = 'transform 350ms spring'; bandEl.style.transform = 'translateX(0)'` — spring transition kicks in
  5. After `350 + 150ms`: clear inline `transform`/`transition`, returning control to React's render

The opt-out in render is what makes it stable: when phase is `complete`, React's render writes nothing to those two inline properties, so the imperative styles I set in `rerollBand` aren't clobbered by re-renders triggered by `setBands`.

**No deviations.** Verified the imperative flow correctly progresses (snap-off → spring-back) via inline-style + computed-transform sampling. Build clean. (Live screenshot timed out due to a separate dev-server-throttling artifact in the unfocused preview window — interactive behavior in real focused browsers is unaffected.)
