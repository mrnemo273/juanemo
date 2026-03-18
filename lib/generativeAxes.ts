/**
 * Shared axis randomization for Roboto Flex generative system.
 * Used by Hero (animated drift) and future LogoMark (static).
 */

export const AXIS_RANGES = {
  wdth: { min: 25, max: 151 },
  wght: { min: 300, max: 900 }, // floor at 300 — letters must never vanish
  opsz: { min: 8, max: 144 },
} as const;

export interface AxisValues {
  wdth: number;
  wght: number;
  opsz: number;
}

export function randomAxes(): AxisValues {
  return {
    wdth: Math.round(AXIS_RANGES.wdth.min + Math.random() * (AXIS_RANGES.wdth.max - AXIS_RANGES.wdth.min)),
    wght: Math.round(AXIS_RANGES.wght.min + Math.random() * (AXIS_RANGES.wght.max - AXIS_RANGES.wght.min)),
    opsz: Math.round(AXIS_RANGES.opsz.min + Math.random() * (AXIS_RANGES.opsz.max - AXIS_RANGES.opsz.min)),
  };
}

export function axisString(axes: AxisValues): string {
  return `'wdth' ${axes.wdth}, 'wght' ${axes.wght}, 'opsz' ${axes.opsz}`;
}
