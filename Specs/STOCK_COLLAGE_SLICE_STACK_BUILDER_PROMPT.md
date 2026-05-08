# Stock Collage — Section B: Slice & Stack — Builder Prompt

**Status:** 🔵 SPEC WRITTEN
**Experiment slug:** `stock-collage`
**Section letter:** B
**Interaction model:** Compose-then-admire (user arranges strips, result settles as a finished piece)
**Depends on:** Section A shared infra (`data/collageImages.ts`, `ImagePicker.tsx`, `useCollageExport.ts`, `StockCollageSwitch.tsx`)

---

## What You're Doing

Building a Hockney-style strip collage. The user picks 2–4 stock photos, each gets sliced into vertical strips, and the strips can be rearranged by dragging. Auto-shuffle and sort-by-hue create instant variations. The final composition looks like a fractured photograph — familiar subjects reassembled into something new.

**This is compose-then-admire.** The interaction is in the arranging. Once the user likes it, the collage sits as a finished piece. No continuous animation.

**No AI curation.** User drives all creative choices.

---

## Section A — As Built (Shared Infra Reference)

Section A (Exquisite Search) created the shared infrastructure you'll need:

- **`data/collageImages.ts`** — curated Unsplash photo library (50-80 images, 8 categories, CDN URLs)
- **`ImagePicker.tsx`** — modal gallery with category tabs, thumbnail grid, onSelect callback
- **`useCollageExport.ts`** — canvas → PNG download hook
- **`StockCollageSwitch.tsx`** — section router
- **`types.ts`** — shared types

If any of these don't exist yet, check the Section A builder prompt (`Specs/STOCK_COLLAGE_EXQUISITE_SEARCH_BUILDER_PROMPT.md`) for the full specifications and create them.

---

## Step 1: Image Selection Phase

On mount, the user sees an empty canvas with a prompt: "Pick 2–4 images to slice."

**Image slots:** 2–4 slots displayed as small preview thumbnails along the top or bottom of the canvas area. Tap a slot to open ImagePicker. As images are picked, their thumbnails fill the slots.

- Minimum 2 images to proceed
- Maximum 4 images
- "Add" button for additional slots (up to 4)
- "Remove" button (X) on each filled slot

When 2+ images are selected, a "Slice" button appears to transition to the arrange phase.

---

## Step 2: Slicing

When user taps "Slice":

1. Each image is sliced into vertical strips
2. Strip count is configurable: 8 / 12 / 16 / 24 (default: 12)
3. All strips from all images are laid out left-to-right in a single row

**Strip data model:**
```typescript
interface Strip {
  id: string;                // unique ID
  sourceImageId: string;     // which CollageImage it came from
  sourceIndex: number;       // which strip of that image (0-based)
  totalStrips: number;       // how many strips the source was cut into
  sourceX: number;           // pixel X offset in source image
  stripWidth: number;        // pixel width of this strip in source
  verticalOffset: number;    // px offset for staircase effect (default 0)
  dominantHue: number;       // HSL hue of this strip (for sort-by-hue)
}
```

**Rendering each strip:**
- Use `drawImage(img, sourceX, 0, stripWidth, imgHeight, destX, offset, destWidth, destHeight)` to draw the correct slice
- Each strip renders as a column in the canvas
- 1px gap between strips (paper-cut feel)
- Subtle drop shadow between strips: `rgba(0,0,0,0.15)`, 2px blur, 1px offset-right

**Dominant hue calculation:**
- Sample ~100 pixels from the strip region
- Convert to HSL
- Take the median hue value
- Store on the Strip object for sort-by-hue

---

## Step 3: Drag to Rearrange

Strips are individually draggable:

**Desktop:**
- Click-drag a strip horizontally
- While dragging, the strip lifts slightly (scale 1.05, shadow deepens)
- Other strips slide apart to make room (smooth transition, 200ms)
- Drop snaps to grid position
- The strip being dragged is rendered on top (higher z-order)

**Mobile:**
- Touch-drag works the same way
- Slightly larger hit target (the full strip height)
- Haptic feedback (10ms) on pickup and drop if available

**Snap grid:**
- Strips always snap to grid positions — no free-floating
- Grid width = canvas width / total strip count
- Half-width offset option (see Step 5) shifts every other strip by half a position

**Implementation approach:** Track strip order as an array of strip IDs. On drag, calculate the insertion index based on cursor X position and reorder the array. Re-render strips in the new order. Use `requestAnimationFrame` for smooth drag rendering.

---

## Step 4: Auto-Shuffle

"Shuffle" button in controls:
- Fisher-Yates shuffle on the strip order array
- Animated transition: all strips slide to their new positions simultaneously (300ms, ease-out)
- Can be tapped repeatedly for instant variations

---

## Step 5: Sort by Hue

"Sort by Hue" button in controls:
- Sorts all strips by their `dominantHue` value (0–360)
- Creates a left-to-right color gradient across the collage
- Animated transition: strips slide to sorted positions (400ms, ease-out)
- Striking visual effect — fragments from different photos create unexpected color flows

---

## Step 6: Vertical Offset (Staircase)

"Offset" slider in controls (0–60px, default 0):
- Each strip gets a vertical offset: `strip.verticalOffset = index * offsetStep`
- Where `offsetStep` alternates direction: even strips shift down, odd strips shift up
- Creates a zigzag/staircase profile along the top and bottom edges
- At 0px: flat, aligned strips (default)
- At 30px: subtle wave
- At 60px: dramatic staircase

**Alternative offset modes** (segmented control):
- Flat (0 offset)
- Wave (sine curve: `Math.sin(index / totalStrips * Math.PI * 2) * offsetAmount`)
- Staircase (linear increase: `index * offsetStep`, wraps back to 0 at midpoint)
- Random (each strip gets random offset within ±offsetAmount)

---

## Step 7: Export

Same pattern as Section A:
- "Export" button composites all strips with gaps and offsets onto a high-res offscreen canvas
- Downloads as PNG via `useCollageExport`
- Include the 1px gaps and drop shadows in the export

---

## Controls (Settings Panel)

| Control | Type | Range | Default | Notes |
|---------|------|-------|---------|-------|
| Strip Count | Segmented | 8 / 12 / 16 / 24 | 12 | Re-slices all images when changed |
| Offset Amount | Slider | 0–60px | 0 | Vertical offset magnitude |
| Offset Mode | Segmented | Flat / Wave / Staircase / Random | Flat | How offset is distributed |
| Shuffle | Button | — | — | Randomize strip order |
| Sort by Hue | Button | — | — | Arrange strips by dominant color |
| Export | Button | — | — | Download composite PNG |
| New Collage | Button | — | — | Back to image selection |

---

## Section Config

```typescript
{
  letter: 'B',
  name: 'Slice & Stack',
  hint: 'Pick images, drag strips to compose',
  hintMobile: 'Pick images, drag strips',
  description: 'Hockney-style strip collage — slice photos into vertical strips and rearrange them. Sort by color for unexpected gradients, offset for staircase profiles, or shuffle for happy accidents.',
  instructions: [
    { icon: 'scissors', text: '<strong>Pick 2–4 images</strong> from the gallery, then slice them into strips.' },
    { icon: 'move', text: '<strong>Drag strips</strong> to rearrange the composition.' },
    { icon: 'shuffle', text: '<strong>Shuffle</strong> or <strong>Sort by Hue</strong> for instant variations.' },
  ],
  instructionsMobile: [
    { icon: 'scissors', text: '<strong>Pick images</strong> and slice into strips.' },
    { icon: 'move', text: '<strong>Drag</strong> strips to rearrange.' },
    { icon: 'shuffle', text: '<strong>Shuffle</strong> or <strong>Sort</strong> for variations.' },
  ],
  controls: ['stripCount', 'offsetAmount', 'offsetMode', 'shuffle', 'sortHue', 'export'],
}
```

---

## Build Order

| Step | Task |
|------|------|
| 1 | Create `SliceStack.tsx` + CSS module |
| 2 | Implement image selection phase (2–4 slots + ImagePicker) |
| 3 | Implement slicing logic (divide images into strips, calculate dominant hue) |
| 4 | Render strips with 1px gaps + drop shadows |
| 5 | Implement drag-to-rearrange (desktop click-drag + mobile touch-drag) |
| 6 | Implement auto-shuffle with animated transition |
| 7 | Implement sort-by-hue with animated transition |
| 8 | Implement vertical offset modes (flat/wave/staircase/random) |
| 9 | Wire controls in settings panel |
| 10 | Implement export |
| 11 | Wire into `StockCollageSwitch.tsx` (`activeSection === 1`) |
| 12 | Add Section B config to `experiments.ts` sectionConfigs |
| 13 | Test: pick images → slice → drag → shuffle → sort → offset → export |
| 14 | `npm run build` — zero errors |

---

## What NOT to Do

1. **Don't add AI composition suggestions.** No "best alignment" mode, no "continuation opportunity" detection. User arranges everything manually.
2. **Don't make strips free-floating.** They always snap to grid positions. The paper-collage metaphor requires clean alignment.
3. **Don't add audio.** Visual only.
4. **Don't animate continuously.** Once arranged, strips stay put. This is compose-then-admire.
5. **Don't use gyro/tilt.** Collage composition is deliberate, not motion-reactive.
6. **Don't break Section A.** StockCollageSwitch routes `activeSection === 0` to ExquisiteSearch, `=== 1` to SliceStack.

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| SS.1 | User can pick 2–4 images from the gallery |
| SS.2 | Images are sliced into configurable strip counts (8/12/16/24) |
| SS.3 | Strips render with 1px gaps and subtle drop shadows |
| SS.4 | Strips are draggable with smooth reorder animation (desktop + mobile) |
| SS.5 | Auto-shuffle randomizes strip order with animated transition |
| SS.6 | Sort-by-hue arranges strips by dominant color |
| SS.7 | Vertical offset slider creates wave/staircase/random profiles |
| SS.8 | Changing strip count re-slices all images |
| SS.9 | Export downloads a high-res composite PNG with gaps and offsets |
| SS.10 | Desktop: click-drag works smoothly |
| SS.11 | Mobile: touch-drag works smoothly |
| SS.12 | `npm run build` — zero errors |

---

## Builder Notes

*(To be filled in by builder.)*
