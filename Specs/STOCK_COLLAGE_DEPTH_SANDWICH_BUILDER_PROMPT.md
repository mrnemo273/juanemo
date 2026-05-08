# Stock Collage — Section D: Depth Sandwich — Builder Prompt

**Status:** 🔵 SPEC WRITTEN
**Experiment slug:** `stock-collage`
**Section letter:** D
**Interaction model:** Always-alive (parallax responds continuously to mouse/tilt)
**Depends on:** Section A shared infra (`data/collageImages.ts`, `ImagePicker.tsx`, `useCollageExport.ts`, `StockCollageSwitch.tsx`)

---

## What You're Doing

Building a parallax diorama from stock photos. The user picks 3–5 images. Each image is separated into depth layers (foreground, midground, background) using client-side depth estimation. Layers from different images are interleaved by depth — all foregrounds compete for the front plane, all backgrounds recede. The result is a surreal diorama where subjects from different photos coexist in a shared 3D space. Tilt or mouse creates parallax: foreground moves fast, background moves slow.

This is **always-alive** — the parallax never stops. The phone becomes a window into a little paper theater.

**No AI curation.** User picks all images and can manually adjust layer assignments.

---

## Section A — As Built (Shared Infra Reference)

Section A created shared infrastructure: `data/collageImages.ts`, `ImagePicker.tsx`, `useCollageExport.ts`, `StockCollageSwitch.tsx`, `types.ts`. Use these. See the Section A builder prompt for specs if anything is missing.

---

## Step 1: Image Selection

On mount, the user sees 3–5 empty slots with a "Pick images for your diorama" prompt.

- Tap slots to open ImagePicker
- Minimum 3, maximum 5 images
- Thumbnails fill slots as images are picked
- "Build Diorama" button appears when 3+ images are selected

---

## Step 2: Depth Estimation

When user taps "Build Diorama":

1. Show a loading state ("Analyzing depth..." with a progress indicator)
2. Run depth estimation on each image
3. Separate each image into 3 depth layers
4. Show the diorama with parallax active

### Depth Map Generation

Use **TensorFlow.js with the MiDaS model** for client-side monocular depth estimation:

```typescript
import * as tf from '@tensorflow/tfjs';
// Load MiDaS small model (most efficient for browser)
const model = await tf.loadGraphModel('https://tfhub.dev/intel/midas/v2_1_small/1', { fromTFHub: true });
```

**If TensorFlow.js + MiDaS is too heavy** (model is ~25MB, inference is slow on mobile), use a **simpler fallback approach:**

### Fallback: Gradient-Based Pseudo-Depth

Instead of ML depth estimation, use a heuristic approach:
1. Convert image to grayscale
2. Apply a vertical gradient bias (bottom = near, top = far — mimics natural scenes)
3. Apply edge detection (sharp edges = foreground objects)
4. Blur the combined map for smooth layer boundaries
5. Quantize to 3 levels

```typescript
function estimatePseudoDepth(imageData: ImageData): Uint8Array {
  const { width, height, data } = imageData;
  const depth = new Uint8Array(width * height);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      // Grayscale luminance
      const lum = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
      // Vertical gradient (bottom = 0/near, top = 255/far)
      const verticalBias = (y / height) * 128;
      // Darker regions tend to be shadows/background
      const darknessBias = (255 - lum) * 0.3;
      
      depth[y * width + x] = Math.min(255, verticalBias + darknessBias);
    }
  }
  
  // Gaussian blur for smooth boundaries
  return gaussianBlur(depth, width, height, 15);
}
```

**Builder decision:** Try TensorFlow.js MiDaS first. If it's too slow (>5s per image on desktop, >10s on mobile) or the model is too large, use the pseudo-depth fallback. The pseudo-depth won't be as accurate but creates a convincing enough diorama for the parallax effect.

### Layer Separation

Quantize the depth map into 3 discrete layers:
- **Background (far):** depth > 170
- **Midground:** 85 < depth ≤ 170
- **Foreground (near):** depth ≤ 85

For each layer, create a masked version of the image:
- Pixels in this depth range → full opacity
- Pixels NOT in this range → transparent
- Feather the edges: 8px gradient transition between layers to avoid hard cutouts

```typescript
interface DepthLayer {
  canvas: HTMLCanvasElement;  // masked image for this layer
  depth: 'far' | 'mid' | 'near';
  sourceImageId: string;
  zIndex: number;             // rendering order (far=0, mid=1, near=2)
  parallaxFactor: number;     // how much this layer moves (far=0.2, mid=0.5, near=1.0)
}
```

---

## Step 3: Layer Interleaving

Once all images are separated into layers, interleave them by depth plane:

```
Z-order (back to front):
  [Image1-bg] [Image2-bg] [Image3-bg]    ← all backgrounds
  [Image1-mid] [Image2-mid] [Image3-mid]  ← all midgrounds
  [Image1-fg] [Image2-fg] [Image3-fg]    ← all foregrounds
```

Within each depth plane, layers from different images are composited with normal blending. The user can reorder layers within a plane by dragging (optional — implement if time allows).

**Positioning:** Each layer is positioned to fill the canvas. Layers overlap — transparency lets deeper layers show through. The effect is a surreal composite where a tree from photo 1 stands in front of a mountain from photo 2 with a person from photo 3 in the foreground.

---

## Step 4: Parallax (Always-Alive)

The core interaction: tilt or mouse creates depth-based parallax.

**Parallax factors:**
- Background: 0.2 (barely moves)
- Midground: 0.5 (moderate movement)
- Foreground: 1.0 (moves most)

**Desktop — mouse:**
```typescript
// Mouse position relative to canvas center, normalized to -1..1
const mx = (mouseX - canvasWidth / 2) / (canvasWidth / 2);
const my = (mouseY - canvasHeight / 2) / (canvasHeight / 2);

// Per-layer offset
const offsetX = mx * MAX_PARALLAX * layer.parallaxFactor;
const offsetY = my * MAX_PARALLAX * layer.parallaxFactor;
```

`MAX_PARALLAX = 30px` — subtle but visible.

**Mobile — tilt:**
```typescript
import { applyDeadZoneBipolar } from '../../lib/gyroUtils';

const tiltX = applyDeadZoneBipolar(gyro.gammaNorm, 0.06);
const tiltY = applyDeadZoneBipolar(gyro.betaNorm, 0.06);

const offsetX = tiltX * MAX_PARALLAX * layer.parallaxFactor;
const offsetY = tiltY * MAX_PARALLAX * layer.parallaxFactor;
```

**Lerp smoothing:** All parallax offsets are lerped at 0.08 for a dreamy, weighted feel. Not snappy — the layers should drift like they're suspended in glass.

**iOS gyro permission:** Toast pattern from EXP-02/03.

**Idle state:** When no input, layers gently sway:
```typescript
const idleX = Math.sin(time * 0.0008) * 3;
const idleY = Math.cos(time * 0.0006) * 2;
```
Very subtle — ±3px horizontally, ±2px vertically. Creates the "always alive" feel.

---

## Step 5: Rendering

All rendering on a single canvas via RAF loop:

```typescript
function render(time: number) {
  ctx.clearRect(0, 0, width, height);
  
  // Draw layers back to front
  for (const layer of sortedLayers) {
    const ox = currentOffsetX * layer.parallaxFactor;
    const oy = currentOffsetY * layer.parallaxFactor;
    ctx.drawImage(layer.canvas, ox, oy, width, height);
  }
  
  rafId = requestAnimationFrame(render);
}
```

**Overscale layers by 10%** so parallax movement doesn't reveal canvas edges. Each layer canvas is rendered at 110% of viewport size, centered, so ±30px of movement stays within bounds.

---

## Step 6: Layer Preview (Optional Enhancement)

After the diorama is built, the user can tap a "Layers" button to see an exploded view:

- All layers spread apart vertically with 20px gaps
- Labels: "Background", "Midground", "Foreground" + source image thumbnail
- Tap to collapse back to composite
- This helps the user understand what the depth estimation did

If this adds too much complexity, skip it and just show the composited diorama.

---

## Step 7: Export

- "Export" button captures the current frame (with parallax at current position)
- Downloads as high-res PNG
- Snapshot of the diorama at this moment

---

## Controls (Settings Panel)

| Control | Type | Range | Default | Notes |
|---------|------|-------|---------|-------|
| Parallax Amount | Slider | 10–60px | 30 | Max offset for foreground layer |
| Depth Sensitivity | Slider | Low / Medium / High | Medium | Adjusts the depth threshold boundaries. Low = thin layers, High = thick layers |
| Layers | Button | — | — | Toggle exploded layer view (optional) |
| Export | Button | — | — | Download composite PNG |
| New Diorama | Button | — | — | Back to image selection |

---

## Section Config

```typescript
{
  letter: 'D',
  name: 'Depth Sandwich',
  hint: 'Tilt to see the parallax',
  hintMobile: 'Tilt your phone like a window',
  description: 'Pick photos and watch them separate into depth layers — foregrounds, midgrounds, backgrounds. Layers from different images interleave into a surreal diorama. Tilt your phone to peek around the scene like a little paper theater.',
  instructions: [
    { icon: 'image', text: '<strong>Pick 3–5 images</strong> from the gallery.' },
    { icon: 'layers', text: '<strong>Depth layers</strong> are estimated automatically — foregrounds and backgrounds separate.' },
    { icon: 'move', text: '<strong>Mouse/tilt</strong> creates parallax — foreground moves fast, background stays still.' },
  ],
  instructionsMobile: [
    { icon: 'image', text: '<strong>Pick 3–5 images</strong> to build a diorama.' },
    { icon: 'smartphone', text: '<strong>Tilt</strong> to peek around the scene.' },
  ],
  controls: ['parallaxAmount', 'depthSensitivity', 'export'],
}
```

---

## Build Order

| Step | Task |
|------|------|
| 1 | Create `DepthSandwich.tsx` + CSS module |
| 2 | Implement image selection (3–5 slots + ImagePicker) |
| 3 | Implement depth estimation (TensorFlow.js MiDaS or pseudo-depth fallback) |
| 4 | Implement layer separation (3 depth planes with feathered edges) |
| 5 | Implement layer interleaving (all images' layers sorted by depth) |
| 6 | Implement parallax rendering (canvas RAF loop, per-layer offsets) |
| 7 | Implement mouse interaction (lerped, MAX_PARALLAX = 30px) |
| 8 | Implement tilt interaction (gyro + dead zone 0.06 + iOS permission) |
| 9 | Add idle oscillation (gentle sway when no input) |
| 10 | Overscale layers by 10% to prevent edge reveal |
| 11 | Wire controls in settings panel |
| 12 | Implement export |
| 13 | (Optional) Implement exploded layer preview |
| 14 | Wire into `StockCollageSwitch.tsx` (`activeSection === 3`) |
| 15 | Add Section D config to `experiments.ts` sectionConfigs |
| 16 | Test: pick images → build diorama → tilt/mouse parallax → export |
| 17 | Performance test on mobile (target: 30fps with parallax active) |
| 18 | `npm run build` — zero errors |

---

## What NOT to Do

1. **Don't require a server for depth estimation.** Everything runs client-side. If MiDaS is too heavy, use the pseudo-depth fallback. Never call an external API.
2. **Don't add AI curation.** No "figure-ground swap" suggestions, no lighting consistency checks. User picks images, depth algo does the rest.
3. **Don't add audio.** Visual only.
4. **Don't make parallax jarring.** The lerp should be slow (0.08). Fast parallax feels like a tech demo, not art. The diorama should feel suspended in resin.
5. **Don't show canvas edges during parallax.** The 10% overscale is essential. If the user tilts and sees a gap, it breaks the illusion.
6. **Don't block the UI during depth estimation.** Show a loading indicator and process images sequentially (not all at once). Use `requestIdleCallback` or break processing into chunks if needed.
7. **Don't use gyro without dead zone.** 0.06 dead zone from `gyroUtils.ts`. Phone on a table must produce zero parallax movement.

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| DS.1 | User can pick 3–5 images from the gallery |
| DS.2 | Depth estimation runs client-side (MiDaS or pseudo-depth) with loading indicator |
| DS.3 | Each image separates into 3 depth layers with feathered edges |
| DS.4 | Layers from different images interleave by depth plane |
| DS.5 | Parallax: foreground moves most, background moves least |
| DS.6 | Desktop: mouse creates smooth parallax (lerp 0.08) |
| DS.7 | Mobile: tilt creates smooth parallax (dead zone 0.06, lerp 0.08) |
| DS.8 | Idle oscillation: gentle sway when no input |
| DS.9 | No canvas edge visible during parallax movement |
| DS.10 | Performance: 30fps on mobile with parallax active |
| DS.11 | Export downloads a high-res PNG snapshot |
| DS.12 | Depth estimation completes in <10s per image on desktop |
| DS.13 | `npm run build` — zero errors |

---

## Builder Notes

*(To be filled in by builder.)*
