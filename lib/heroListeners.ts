/**
 * Hero axis listeners — resize (wdth/opsz) and scroll (wght/GRAD/tracking/opacity).
 * Attach these in the Hero component on mount.
 */

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

/**
 * Maps viewport width to Roboto Flex wdth (25–151) and opsz (8–144) axes.
 * Called on resize.
 */
export function updateHeroAxes(): void {
  const vw = window.innerWidth;
  const minVw = 320;
  const maxVw = 1920;
  const progress = Math.min(Math.max((vw - minVw) / (maxVw - minVw), 0), 1);

  const wdth = Math.round(25 + progress * (151 - 25));
  const opsz = Math.round(8 + progress * (144 - 8));

  const r = document.documentElement;
  r.style.setProperty('--hero-wdth', String(wdth));
  r.style.setProperty('--hero-opsz', String(opsz));
}

/**
 * Creates a scroll handler that maps 0–300px scroll to hero compression.
 * Captures the initial mood GRAD value so it can compute a faded value on each frame
 * without compounding the reduction.
 */
function createScrollHandler(initialMoodGrad: number) {
  return function updateHeroScroll(): void {
    const progress = Math.min(window.scrollY / 300, 1);
    const r = document.documentElement;

    // wght: 900 → 500
    r.style.setProperty('--hero-wght', String(Math.round(900 - progress * 400)));

    // GRAD fades toward 0 from the original mood value
    r.style.setProperty('--hero-grad', String(Math.round(initialMoodGrad * (1 - progress))));

    // scroll progress for CSS calculations (font-size, opacity, letter-spacing)
    r.style.setProperty('--scroll-progress', String(progress));
  };
}

/**
 * Attaches resize and scroll listeners for the hero. Returns a cleanup function.
 * Captures the current mood GRAD at attach time for scroll fade computation.
 */
export function attachHeroListeners(): () => void {
  const debouncedResize = debounce(updateHeroAxes, 16);

  // Capture the mood GRAD set by the <head> script before scroll modifies it
  const initialMoodGrad = parseFloat(
    document.documentElement.style.getPropertyValue('--hero-grad')
  ) || 0;

  const updateHeroScroll = createScrollHandler(initialMoodGrad);

  window.addEventListener('resize', debouncedResize);

  const handleScroll = () => {
    requestAnimationFrame(updateHeroScroll);
  };
  window.addEventListener('scroll', handleScroll);

  // Run immediately on mount
  updateHeroAxes();

  return () => {
    window.removeEventListener('resize', debouncedResize);
    window.removeEventListener('scroll', handleScroll);
  };
}
