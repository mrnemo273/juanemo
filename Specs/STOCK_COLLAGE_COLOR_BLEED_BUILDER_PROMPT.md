# Stock Collage — Section C: Color Bleed — Builder Prompt

**Status:** 🔵 SPEC WRITTEN
**Experiment slug:** `stock-collage`
**Section letter:** C
**Interaction model:** Always-alive (the bleed effect continuously responds to mouse/tilt)
**Depends on:** Section A shared infra (`data/collageImages.ts`, `ImagePicker.tsx`, `useCollageExport.ts`, `StockCollageSwitch.tsx`)

---

## What You're Doing

Building a chromatic merge collage. Two images sit side by side on the canvas. Where their edges meet, colors bleed into each other — the merge amount depends on how similar the adjacent colors are. The bleed boundary shifts subtly in response to mouse position or phone tilt, creating a living painting that's always gently moving.

This is the first **always-alive** collage section. After composing, the piece keeps breathing. The bleed zone ripples and shifts. It should feel like watching watercolors merge on wet paper.

**Implementation: Canvas 2D** (not WebGL). The original brainstorm suggested WebGL shaders, but Canvas 2D with pixel manipulation is simpler, more consistent across devices, and sufficient for the effect. The bleed is computed per-frame on a subset of pixels near the boundary, not the entire image.

**No AI curation.** User picks both images and positions them.

---

## Section A — As Built (Shared Infra Reference)

Section A created shared infrastructure: `data/collageImages.ts`, `ImagePicker.tsx`, `useCollageExport.ts`, `StockCollageSwitch.tsx`, `types.ts`. Use these. See the Section A builder prompt for specs if anything is missing.

---

## Step 1: Image Selection

On mount, the canvas shows two empty zones side by side (left half and right half), each with a dashed outline and "Pick an image" label.

- Tap left zone → open ImagePicker → image fills left half
- Tap right zone → open ImagePicker → image fills right half
- Both images fill their half with `object-fit: cover` behavior
- After both images are placed, the bleed effect activates

**Image positioning:** Each image can be panned within its half (drag to reposition). This lets the user control which parts of each image meet at the boundary.

**Layout modes** (controlled by settings):
- Side by side (default): vertical split at center
- Top/bottom: horizontal split at center
- Diagonal: 45° split from top-left to bottom-right

---

## Step 2: The Bleed Effect

The core visual: where the two images meet, colors merge based on similarity.

### Algorithm

For each pixel near the boundary (within `bleedRadius` pixels of the split line):

1. Sample the pixel from Image A and Image B at the corresponding position
2. Calculate color distance in CIE Lab space (perceptually uniform):
   ```typescript
   // Convert RGB → Lab (use a helper function)
   const labA = rgbToLab(pixelA);
   const labB = rgbToLab(pixelB);
   const distance = Math.sqrt(
     (labA.L - labB.L) ** 2 +
     (labA.a - labB.a) ** 2 +
     (labA.b - labB.b) ** 2
   );
   ```
3. If `distance < colorTolerance`: blend the pixels using Hermite interpolation
4. Blend weight based on:
   - **Color similarity:** closer colors → more blending (0–1 based on distance/tolerance)
   - **Boundary distance:** closer to the split line → more blending (linear falloff to bleedRadius)
   - **Mouse/tilt offset:** shifts the blend center (see Step 3)

### Blend formula

```typescript
const similarityWeight = 1 - Math.min(distance / colorTolerance, 1);
const boundaryWeight = 1 - Math.abs(distFromBoundary) / bleedRadius;
const blendFactor = similarityWeight * boundaryWeight;

// Hermite interpolation (smoother than linear)
const t = blendFactor * blendFactor * (3 - 2 * blendFactor);

const r = pixelA.r * (1 - t) + pixelB.r * t;
const g = pixelA.g * (1 - t) + pixelB.g * t;
const b = pixelA.b * (1 - t) + pixelB.b * t;
```

### Performance

Processing every pixel every frame is too expensive. Optimizations:

1. **Boundary strip only:** Only process pixels within `bleedRadius` of the split line. Skip everything else — render the unblended image directly.
2. **Downsampled processing:** Process at half resolution (or quarter on mobile), then upscale the bleed strip with bilinear interpolation.
3. **Offscreen canvas:** Pre-render each image onto its own offscreen canvas at the target size. Read pixels from those cached canvases.
4. **RAF throttle:** Process bleed at 30fps max, even if RAF runs at 60fps. Alternate frames: render cached result on skip frames.
5. **Incremental update:** When mouse/tilt shifts the boundary, only reprocess the pixels affected by the shift delta, not the entire strip.

Target: smooth 30fps on a 2020-era phone. If performance is still an issue, reduce bleed resolution further.

### Color space conversion

Include a `colorUtils.ts` with RGB ↔ Lab conversion:

```typescript
// RGB (0-255) → CIE Lab
export function rgbToLab(r: number, g: number, b: number): { L: number; a: number; b: number } {
  // RGB → XYZ → Lab (standard conversion)
  // ... (standard formulas, D65 illuminant)
}
```

This is a well-known conversion — use the standard formulas. Or use a lightweight library if available.

---

## Step 3: Mouse/Tilt Interaction (Always-Alive)

The bleed boundary isn't static — it shifts subtly based on input:

**Desktop — mouse position:**
- Mouse X relative to canvas center shifts the split line position by ±30px
- Mouse Y shifts the bleed radius by ±10px (higher = more bleed, lower = less)
- Smooth lerp (0.08) — the shift follows the mouse slowly, creating a dreamy lag

**Mobile — tilt:**
- Gamma (left/right tilt) shifts the split line ±30px
- Beta (forward/back tilt) shifts the bleed radius ±10px
- Same lerp smoothing (0.08)
- Use `applyDeadZone` from `lib/gyroUtils.ts` with dead zone 0.06

**When no input (mouse at rest / phone flat):**
- The split line gently oscillates: `Math.sin(time * 0.001) * 5` — ±5px, very slow
- Creates the "always breathing" feel even when untouched

**iOS gyro permission:** Use the same toast pattern from EXP-02/03 if gyro is needed and permission state is `'prompt'`.

---

## Step 4: Visual Polish

- **Bleed glow:** At the split line itself, add a subtle warm glow (1px, 30% opacity of the blended average color). Makes the seam feel luminous rather than hard.
- **No hard edge:** The bleed should fade smoothly to unblended at `bleedRadius`. No visible "processing boundary."
- **Background:** Canvas background = `--color-gunmetal`. If images don't cover the full canvas (e.g., during loading), the dark background shows.

---

## Step 5: Export

- "Export" button composites the current frame (with bleed at its current mouse/tilt position) onto a high-res canvas
- Downloads as PNG
- The export captures the bleed as-is at that moment — it's a snapshot of the living painting

---

## Controls (Settings Panel)

| Control | Type | Range | Default | Notes |
|---------|------|-------|---------|-------|
| Bleed Radius | Slider | 10–120px | 40 | How far the merge extends from the split line |
| Color Tolerance | Slider | 5–80 (Lab distance) | 30 | How similar colors must be to trigger bleed. Low = surgical, high = impressionist |
| Layout | Segmented | Side-by-side / Top-bottom / Diagonal | Side-by-side | Split orientation |
| Export | Button | — | — | Download composite PNG |
| New Collage | Button | — | — | Back to image selection |

---

## Section Config

```typescript
{
  letter: 'C',
  name: 'Color Bleed',
  hint: 'Colors merge where images meet',
  hintMobile: 'Tilt to shift the bleed',
  description: 'Place two images side by side and watch their colors bleed into each other where similar hues meet. Tilt your phone (or move your mouse) to shift the merge boundary — a living watercolor that never stops moving.',
  instructions: [
    { icon: 'image', text: '<strong>Pick two images</strong> from the gallery.' },
    { icon: 'move', text: '<strong>Drag</strong> to position each image at the boundary.' },
    { icon: 'droplet', text: '<strong>Mouse/tilt</strong> shifts the bleed zone — watch the colors merge.' },
  ],
  instructionsMobile: [
    { icon: 'image', text: '<strong>Pick two images</strong> from the gallery.' },
    { icon: 'move', text: '<strong>Drag</strong> to reposition images.' },
    { icon: 'smartphone', text: '<strong>Tilt</strong> to shift the bleed.' },
  ],
  controls: ['bleedRadius', 'colorTolerance', 'layout', 'export'],
}
```

---

## Build Order

| Step | Task |
|------|------|
| 1 | Create `ColorBleed.tsx` + CSS module |
| 2 | Create `colorUtils.ts` with RGB ↔ Lab conversion |
| 3 | Implement image selection (two zones + ImagePicker) |
| 4 | Implement image rendering with pan-to-reposition |
| 5 | Implement bleed algorithm (boundary strip, color distance, Hermite blend) |
| 6 | Add performance optimizations (downsampled processing, boundary-only, RAF throttle) |
| 7 | Implement mouse interaction (lerped split shift + radius shift) |
| 8 | Implement tilt interaction (gyro + dead zone + iOS permission) |
| 9 | Add idle oscillation (breathing when no input) |
| 10 | Wire controls in settings panel |
| 11 | Implement export |
| 12 | Wire into `StockCollageSwitch.tsx` (`activeSection === 2`) |
| 13 | Add Section C config to `experiments.ts` sectionConfigs |
| 14 | Test: pick images → pan to align → adjust bleed → tilt → export |
| 15 | Performance test on mobile (target: 30fps) |
| 16 | `npm run build` — zero errors |

---

## What NOT to Do

1. **Don't use WebGL.** Canvas 2D with pixel manipulation is sufficient and far simpler to debug. WebGL adds shader compilation, context loss handling, and mobile GPU quirks that aren't worth it for a boundary-strip effect.
2. **Don't process the entire canvas.** Only the bleed strip near the boundary. Everything else renders directly from the source image canvases.
3. **Don't add AI curation.** No "bleed potential" ranking, no position suggestions. User controls everything.
4. **Don't add audio.** Visual only.
5. **Don't make the oscillation too fast.** The idle breathing should be barely perceptible — `sin(time * 0.001)` speed, not faster. It's ambient, not animated.
6. **Don't skip the Lab color space.** RGB distance doesn't match human perception. Two visually different colors can have similar RGB values. Lab distance is essential for the "similar colors merge" concept to feel right.

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| CB.1 | User can pick two images from the gallery |
| CB.2 | Images fill their respective halves with cover behavior |
| CB.3 | Bleed effect merges colors at the boundary based on CIE Lab similarity |
| CB.4 | Bleed radius slider controls merge extent (10–120px) |
| CB.5 | Color tolerance slider controls sensitivity (low = surgical, high = impressionist) |
| CB.6 | Layout modes work: side-by-side, top-bottom, diagonal |
| CB.7 | Desktop: mouse position shifts split line and bleed radius (lerped) |
| CB.8 | Mobile: tilt shifts split line and bleed radius (with dead zone) |
| CB.9 | Idle oscillation: bleed gently breathes when no input |
| CB.10 | Performance: 30fps on mobile during active bleed rendering |
| CB.11 | No visible processing boundary — bleed fades smoothly to unblended |
| CB.12 | Export downloads a high-res PNG of the current state |
| CB.13 | `npm run build` — zero errors |

---

## Builder Notes

*(To be filled in by builder.)*
