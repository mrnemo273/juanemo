/**
 * Shared axis randomization for Roboto Flex generative system.
 * Used by Hero (animated drift) and future LogoMark (static).
 */

export interface AxisRange {
  min: number;
  max: number;
}

export interface AxisRanges {
  wdth: AxisRange;
  wght: AxisRange;
  opsz: AxisRange;
}

export const AXIS_RANGES_DESKTOP: AxisRanges = {
  wdth: { min: 25, max: 151 },
  wght: { min: 300, max: 900 }, // floor at 300 — letters must never vanish
  opsz: { min: 8, max: 144 },
};

// Mobile moderate range — most characters use this
export const AXIS_RANGES_MOBILE: AxisRanges = {
  wdth: { min: 25, max: 100 },    // capped — avoids ultra-extended on small screens
  wght: { min: 300, max: 650 },   // capped — bold but not black
  opsz: { min: 8, max: 120 },
};

// Backwards-compatible alias
export const AXIS_RANGES = AXIS_RANGES_DESKTOP;

export interface AxisValues {
  wdth: number;
  wght: number;
  opsz: number;
}

export function randomAxes(ranges?: AxisRanges): AxisValues {
  const r = ranges ?? AXIS_RANGES_DESKTOP;
  return {
    wdth: Math.round(r.wdth.min + Math.random() * (r.wdth.max - r.wdth.min)),
    wght: Math.round(r.wght.min + Math.random() * (r.wght.max - r.wght.min)),
    opsz: Math.round(r.opsz.min + Math.random() * (r.opsz.max - r.opsz.min)),
  };
}

export function axisString(axes: AxisValues): string {
  return `'wdth' ${axes.wdth}, 'wght' ${axes.wght}, 'opsz' ${axes.opsz}`;
}

/**
 * Generate axes for an entire word at once.
 * On mobile: 1 random character gets full desktop ranges (the dramatic one),
 * the rest get moderate mobile ranges. This creates contrast without chaos.
 * On desktop: all characters get full ranges.
 */
export function randomAxesForWord(
  count: number,
  isMobile: boolean,
): AxisValues[] {
  if (!isMobile) {
    return Array.from({ length: count }, () => randomAxes(AXIS_RANGES_DESKTOP));
  }

  // Pick one character to be the extreme one
  const extremeIndex = Math.floor(Math.random() * count);
  return Array.from({ length: count }, (_, i) =>
    randomAxes(i === extremeIndex ? AXIS_RANGES_DESKTOP : AXIS_RANGES_MOBILE),
  );
}
