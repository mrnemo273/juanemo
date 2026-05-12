import type { CollageImage } from '@/data/collageImages';
import type { BandRatio } from '@/lib/ExperimentControlsContext';

export type BandIndex = number;

/**
 * Source patch for slice mode — normalized 0..1 fractions of the source image.
 * `(sx, sy)` is the top-left of a small rectangle (~10–25% × 2–6%) that gets
 * stretched to fill the entire band rect, producing abstract color/pattern
 * fields rather than recognizable photo crops.
 */
export interface BandSlice {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface BandState {
  image: CollageImage | null;
  /** Pan offset normalized to drawn-image dimensions: 1 unit = full draw width/height. */
  offsetX: number;
  offsetY: number;
  /** Cover-fit scale (or stretch-fit scale when stretch mode is on). 1 = fill. */
  scale: number;
  /** Source patch for slice mode (re-rolled when the image is re-rolled). */
  slice: BandSlice;
  /** Band width as a fraction of viewport width (0..1). */
  bandWidth: number;
  /** Band left edge as a fraction of viewport width (0..1). */
  bandX: number;
}

export type CollagePhase = 'compose' | 'ready' | 'revealing' | 'complete';

export const SUPPORTED_BAND_COUNTS = [6, 12, 18, 24, 36] as const;
export type BandCount = (typeof SUPPORTED_BAND_COUNTS)[number];

/**
 * Ratio generator that scales to any band count.
 * - equal: every band the same.
 * - golden: edges thicker, middle thinner (linearly interpolated by distance from center).
 * - cinematic: middle thicker, edges thinner (mirror of golden).
 * Symmetric around the center; weights normalized to 1.
 */
export function getRatios(bandRatio: BandRatio, count: number): number[] {
  if (count <= 0) return [];
  if (bandRatio === 'equal' || count === 1) {
    return Array(count).fill(1 / count);
  }
  if (count === 2) return [0.5, 0.5];

  const half = (count - 1) / 2;
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    const distFromCenter = Math.abs(i - half) / half; // 0..1
    const weight =
      bandRatio === 'golden'
        ? 0.6 + 0.8 * distFromCenter // edges 1.4, center 0.6
        : 1.4 - 0.8 * distFromCenter; // cinematic: center 1.4, edges 0.6
    weights.push(weight);
  }
  const total = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / total);
}

export const SLIVER_PX = 20;

export const REVEAL_STAGGER_MS = 35;
export const REVEAL_DURATION_MS = 320;
export const AUTO_RERUN_MS = 15000;
/**
 * Multi-stop keyframes for band entrance + single-band reroll.
 *
 * Each band starts 180px right of its resting position at opacity 0, fades
 * in while sliding left, overshoots past origin a bit, swings back, then
 * settles with a smaller counter-overshoot — gives a "shimmy into place"
 * spring with a touch of back-and-forth at the end.
 */
export const REVEAL_KEYFRAMES: Keyframe[] = [
  { offset: 0, transform: 'translateX(180px)', opacity: 0 },
  { offset: 0.5, transform: 'translateX(-14px)', opacity: 1 },
  { offset: 0.72, transform: 'translateX(7px)', opacity: 1 },
  { offset: 0.88, transform: 'translateX(-3px)', opacity: 1 },
  { offset: 1, transform: 'translateX(0px)', opacity: 1 },
];

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 3;

export const SHAKE_THRESHOLD = 15;
export const SHAKE_COOLDOWN_MS = 1000;

export function randomSlice(): BandSlice {
  // Small rectangle: 10–25% wide, 2–6% tall, randomly placed
  const sw = 0.1 + Math.random() * 0.15;
  const sh = 0.02 + Math.random() * 0.04;
  return {
    sx: Math.random() * (1 - sw),
    sy: Math.random() * (1 - sh),
    sw,
    sh,
  };
}

export function randomBandShape(): { bandWidth: number; bandX: number } {
  // Random width 25–75% of viewport — capped well short of full-width so
  // no band reads as edge-to-edge. Random horizontal position.
  const bandWidth = 0.25 + Math.random() * 0.5;
  const bandX = Math.random() * (1 - bandWidth);
  return { bandWidth, bandX };
}

export function emptyBandState(): BandState {
  return {
    image: null,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    // Deterministic placeholders for SSR (avoid hydration mismatch);
    // real values are generated client-side when an image is assigned.
    slice: { sx: 0.4, sy: 0.4, sw: 0.2, sh: 0.04 },
    bandWidth: 1,
    bandX: 0,
  };
}
