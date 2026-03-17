/**
 * Binary search font-size fitter.
 * Iteratively adjusts font-size until the text element fills its container width exactly.
 * Run on mount and on resize (after axis updates).
 */
export function fitHeroText(el: HTMLElement): void {
  const container = el.parentElement;
  if (!container) return;

  let low = 10;
  let high = 500;
  let mid: number;

  for (let i = 0; i < 20; i++) {
    mid = (low + high) / 2;
    el.style.fontSize = `${mid}px`;
    if (el.scrollWidth < container.clientWidth) {
      low = mid;
    } else {
      high = mid;
    }
  }

  el.style.fontSize = `${low}px`;
}
