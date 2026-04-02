/**
 * Apply dead zone to a normalized 0–1 gyro value.
 * Returns 0.5 (center) when within dead zone.
 * Otherwise remaps remaining range to full 0–1.
 */
export function applyDeadZone(normValue: number, deadZone: number = 0.08): number {
  const centered = normValue - 0.5;
  const abs = Math.abs(centered);
  if (abs <= deadZone) return 0.5;
  const remapped = Math.sign(centered) * (abs - deadZone) / (0.5 - deadZone);
  return 0.5 + remapped * 0.5;
}

/**
 * Apply dead zone and return -1 to 1 range (for gravity/force mapping).
 * Returns 0 when within dead zone.
 */
export function applyDeadZoneBipolar(normValue: number, deadZone: number = 0.08): number {
  const centered = normValue - 0.5;
  const abs = Math.abs(centered);
  if (abs <= deadZone) return 0;
  return Math.sign(centered) * (abs - deadZone) / (0.5 - deadZone);
}
