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

*(To be filled in by builder.)*
