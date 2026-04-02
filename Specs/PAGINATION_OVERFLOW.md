# Pagination Tile Overflow — Mobile Solution

**Problem:** With 7 sections in Code Chords (A–G), the bottom bar overflows on mobile (≤375px). Each 40px tile + 3px gap = 43px × 7 = 301px tiles + separator + sound + gear = ~395px total. Available width on iPhone SE: ~343px.

**Threshold:** Overflow occurs when `(tileCount × 43) + 94 > viewportWidth - (2 × pagepadding)`. For 7 tiles, that's any viewport under ~395px. For future experiments with 4+ sections, this will also apply.

---

## Solution: Scrollable Tile Group with Pinned Controls

### Layout (Mobile, ≤600px)

```
┌──────────────────────────────────────────┐
│  ◂  │ A  B  C [D] E  F  G │  │ 🔊  ⚙  │
│ arrow│    scrollable tiles   │sep│ pinned │
└──────────────────────────────────────────┘
```

**Structure:**
1. **Left arrow** (optional, see below) — `‹` chevron, 24px wide, appears when tiles are scrolled right
2. **Scrollable tile container** — `overflow-x: auto`, `scroll-snap-type: x mandatory`, `-webkit-overflow-scrolling: touch`. Takes remaining space via `flex: 1`. Hides scrollbar.
3. **Separator** — 1px vertical line (existing)
4. **Sound toggle + Gear** — pinned right, never scroll (existing)
5. **Right arrow** (optional) — `›` chevron, appears when tiles are scrollable to the right

### Behavior

- **Auto-scroll to active tile:** When a section changes, the tile container smoothly scrolls to center the active tile.
- **Swipe to scroll:** User can swipe the tile area left/right to see more tiles.
- **Scroll snap:** Each tile is a snap point. Swipe snaps to the nearest tile boundary — no half-tile positions.
- **Arrow visibility:** Arrows appear ONLY when there are hidden tiles in that direction. If all tiles fit, no arrows show (desktop, large phones).
- **Arrow tap:** Tapping an arrow scrolls by 3 tiles in that direction (smooth scroll).
- **Gradient fade:** Instead of hard clip, add a 20px gradient fade at the scroll edges (transparent → background color) to hint that more tiles exist.

### When to Activate

The scrollable behavior ONLY activates when tiles don't fit. Check on mount and resize:

```typescript
const needsScroll = tileContainerRef.current.scrollWidth > tileContainerRef.current.clientWidth;
```

If all tiles fit → render exactly as today (centered flex, no scroll, no arrows). This means desktop is completely unchanged.

### CSS

```css
/* Bottom bar layout */
.bottombar {
  display: flex;
  align-items: center;
  /* Remove justify-content: center — let flex layout handle it */
}

/* Scrollable tile container (mobile only) */
.tileScroll {
  display: flex;
  gap: 3px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  flex: 1;
  min-width: 0; /* Allow flex shrink */
  padding: 0 4px;
  mask-image: linear-gradient(
    to right,
    transparent 0px,
    black 20px,
    black calc(100% - 20px),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0px,
    black 20px,
    black calc(100% - 20px),
    transparent 100%
  );
}

.tileScroll::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

/* Each tile is a scroll snap point */
.tile {
  scroll-snap-align: center;
  flex-shrink: 0;
}

/* Scroll arrows */
.scrollArrow {
  width: 24px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-dun);
  opacity: 0.4;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.2s;
  padding: 0;
}

.scrollArrow:hover {
  opacity: 0.7;
}

.scrollArrowHidden {
  opacity: 0;
  pointer-events: none;
}

/* Desktop: no scroll needed, keep existing centered layout */
@media (min-width: 601px) {
  .tileScroll {
    overflow: visible;
    mask-image: none;
    -webkit-mask-image: none;
    justify-content: center;
  }
  .scrollArrow {
    display: none;
  }
}
```

### JavaScript

```typescript
// Auto-scroll to active tile on section change
useEffect(() => {
  const container = tileScrollRef.current;
  const activeTile = container?.children[activeSection] as HTMLElement;
  if (container && activeTile) {
    const containerRect = container.getBoundingClientRect();
    const tileRect = activeTile.getBoundingClientRect();
    const scrollLeft = activeTile.offsetLeft - container.clientWidth / 2 + activeTile.clientWidth / 2;
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }
}, [activeSection]);

// Track scroll position for arrow visibility
const [canScrollLeft, setCanScrollLeft] = useState(false);
const [canScrollRight, setCanScrollRight] = useState(false);

useEffect(() => {
  const container = tileScrollRef.current;
  if (!container) return;

  const updateArrows = () => {
    setCanScrollLeft(container.scrollLeft > 4);
    setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 4);
  };

  updateArrows();
  container.addEventListener('scroll', updateArrows, { passive: true });
  return () => container.removeEventListener('scroll', updateArrows);
}, []);

// Arrow click handler
const scrollByTiles = (direction: number) => {
  const container = tileScrollRef.current;
  if (!container) return;
  container.scrollBy({ left: direction * 43 * 3, behavior: 'smooth' });
};
```

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| PO.1 | Desktop (>600px): bottom bar renders exactly as today — centered tiles, no arrows, no scroll |
| PO.2 | Mobile (≤600px) with ≤5 tiles: no scroll needed, renders centered as today |
| PO.3 | Mobile (≤600px) with 6+ tiles: tile area becomes horizontally scrollable |
| PO.4 | Sound toggle and gear button stay pinned right, never scroll |
| PO.5 | Active tile auto-scrolls into view on section change (smooth) |
| PO.6 | User can swipe tile area to see hidden tiles |
| PO.7 | Scroll snap aligns to tile boundaries — no half-tile resting positions |
| PO.8 | Gradient fade at scroll edges hints at hidden tiles |
| PO.9 | Left/right arrows visible only when there are hidden tiles in that direction |
| PO.10 | Arrow tap scrolls by 3 tiles with smooth animation |
| PO.11 | No visible scrollbar on any platform |
| PO.12 | Works on iPhone SE (375px) through iPhone Pro Max (430px) |
| PO.13 | Separator between tiles and controls always visible |

---

## Scope

This change is in `ExperimentFrame.tsx` + `ExperimentFrame.module.css` only. It's independent of any specific experiment and works for any section count.

**When to build:** This can be bundled with the Rain builder (since Rain adds the 7th tile that triggers overflow), or done as a separate small task. It's ~50 lines of CSS + ~30 lines of JS.

---

## Builder Notes

**Built:** 2026-04-02

### Implementation Details

1. **Scrollable tile container**: Wrapped page tiles in a `.tileScroll` div inside `ExperimentFrame.tsx`. On mobile (≤600px), this becomes `overflow-x: auto` with `scroll-snap-type: x mandatory`. On desktop, `overflow: visible` with `justify-content: center` — identical to before.

2. **Auto-scroll to active tile**: Uses `scrollTo` with calculated `offsetLeft` to center the active tile. First render uses `behavior: 'instant'` (via `initialScrollDone` ref) so the user doesn't see a slide animation on page load. Subsequent section changes use `behavior: 'smooth'`. Wrapped in `requestAnimationFrame` to ensure layout is settled before measuring.

3. **Arrow visibility**: Tracked via scroll event listener + `ResizeObserver` on the tile container. Arrows appear only when `scrollLeft > 4` (left) or `scrollLeft < scrollWidth - clientWidth - 4` (right). The 4px threshold prevents floating-point rounding from showing arrows when fully scrolled.

4. **Gradient fade**: CSS `mask-image` with `linear-gradient(to right, transparent 0px, black 20px, black calc(100% - 20px), transparent 100%)` creates subtle fade hints at scroll edges. Both `-webkit-mask-image` and standard `mask-image` for cross-browser support.

5. **Scroll snap**: Each `.pageTile` gets `scroll-snap-align: center` and `flex-shrink: 0` on mobile so tiles never get squeezed and always snap to clean boundaries.

6. **Arrow buttons**: `scrollByTiles` callback scrolls by `direction * 43 * 3` (3 tiles × 43px each = tile width + gap). Styled with low opacity (0.4 → 0.7 on hover), hidden via `.scrollArrowHidden` class with `opacity: 0` + `pointer-events: none`.

### Deviations

| # | Spec Said | Builder Did | Why |
|---|-----------|-------------|-----|
| 1 | Auto-scroll with smooth behavior | Instant on first render, smooth after | Seeing tiles slide across on page load felt jarring — instant initial scroll is invisible to the user |
| 2 | Check `needsScroll` on mount and resize | Used ResizeObserver + scroll events for arrow visibility | ResizeObserver catches container resize without needing a separate mount check — cleaner than manual `needsScroll` flag |

### Lessons Learned

1. **`requestAnimationFrame` needed for initial scroll.** Without it, `scrollTo` on mount fires before the browser has laid out the flex children, so `offsetLeft` is 0 and nothing scrolls. One RAF frame is enough.
2. **`initialScrollDone` ref prevents smooth scroll flash.** The spec only mentions smooth scrolling, but on first render the user shouldn't see animation. A ref that flips after first scroll cleanly separates the two cases.
3. **ResizeObserver is essential for arrow accuracy.** Window resize or orientation change can make tiles fit/overflow differently. Without observing the container, arrows would show stale state after rotation.
4. **4px scroll threshold prevents ghost arrows.** Browsers sometimes report `scrollLeft` as 0.5 or `scrollWidth - clientWidth` off by 1-2px due to subpixel rendering. A 4px threshold eliminates false-positive arrow visibility.

---

## Changelog

| Date | Entry |
|------|-------|
| 2026-03-21 | Initial spec. Scrollable tile group + pinned controls + gradient fade + arrows. |
| 2026-04-02 | Built and shipped. Instant initial scroll, RAF for mount timing, ResizeObserver for arrow tracking. |
