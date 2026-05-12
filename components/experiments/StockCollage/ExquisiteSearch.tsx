'use client';

import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ExperimentControlsContext,
  type CollageMode,
} from '@/lib/ExperimentControlsContext';
import { COLLAGE_IMAGES, type CollageImage } from '@/data/collageImages';
import { playBandNote } from './audioEngine';
import {
  getRatios,
  randomSlice,
  randomBandShape,
  REVEAL_DURATION_MS,
  REVEAL_STAGGER_MS,
  REVEAL_KEYFRAMES,
  AUTO_RERUN_MS,
  ZOOM_MIN,
  ZOOM_MAX,
  SHAKE_THRESHOLD,
  SHAKE_COOLDOWN_MS,
  type BandIndex,
  type BandState,
  type CollagePhase,
} from './types';
import styles from './ExquisiteSearch.module.css';


interface BandRect {
  top: number;
  height: number;
  naturalTop: number;
  naturalHeight: number;
  topFeather: number;
  bottomFeather: number;
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/* ── Random image picking ───────────────────────────────────────────── */

function pickRandomImage(exclude?: Set<string>): CollageImage | null {
  const pool = exclude && exclude.size > 0
    ? COLLAGE_IMAGES.filter((img) => !exclude.has(img.id))
    : COLLAGE_IMAGES;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function makeBand(image: CollageImage | null): BandState {
  if (!image) {
    return {
      image: null,
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      slice: { sx: 0.4, sy: 0.4, sw: 0.2, sh: 0.04 },
      bandWidth: 1,
      bandX: 0,
    };
  }
  const shape = randomBandShape();
  return {
    image,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    slice: randomSlice(),
    bandWidth: shape.bandWidth,
    bandX: shape.bandX,
  };
}

function pickRandomBands(count: number): BandState[] {
  const used = new Set<string>();
  const out: BandState[] = [];
  for (let i = 0; i < count; i++) {
    const img = pickRandomImage(used);
    if (img) used.add(img.id);
    out.push(makeBand(img));
  }
  return out;
}

function reshuffleBands(prev: BandState[]): BandState[] {
  const usedNew = new Set<string>();
  const prevIds = new Set(
    prev.map((b) => b.image?.id).filter((x): x is string => Boolean(x)),
  );
  return prev.map(() => {
    // Prefer images that differ from BOTH the previous composition and what we've
    // already used in this re-roll. Fall back to just "not used in this re-roll"
    // if we run out of fresh options.
    const fresh = COLLAGE_IMAGES.filter(
      (img) => !usedNew.has(img.id) && !prevIds.has(img.id),
    );
    const pool =
      fresh.length > 0
        ? fresh
        : COLLAGE_IMAGES.filter((img) => !usedNew.has(img.id));
    if (pool.length === 0) return makeBand(null);
    const img = pool[Math.floor(Math.random() * pool.length)];
    usedNew.add(img.id);
    return makeBand(img);
  });
}

/* ── Layout / drawing helpers ───────────────────────────────────────── */

function layoutFor(
  i: BandIndex,
  ratios: number[],
  h: number,
  feather: number,
): BandRect {
  const count = ratios.length;
  const naturalTop = ratios.slice(0, i).reduce((a, b) => a + b, 0) * h;
  const naturalHeight = ratios[i] * h;
  const topFeather = i === 0 ? 0 : feather;
  const bottomFeather = i === count - 1 ? 0 : feather;
  return {
    top: naturalTop - topFeather,
    height: naturalHeight + topFeather + bottomFeather,
    naturalTop,
    naturalHeight,
    topFeather,
    bottomFeather,
  };
}

function maskGradient(
  topFeather: number,
  bottomFeather: number,
  totalH: number,
): string {
  if (topFeather === 0 && bottomFeather === 0) return 'none';
  const stops: string[] = [];
  if (topFeather > 0) {
    stops.push('transparent 0');
    stops.push(`black ${topFeather}px`);
  } else {
    stops.push('black 0');
  }
  if (bottomFeather > 0) {
    stops.push(`black ${totalH - bottomFeather}px`);
    stops.push('transparent 100%');
  } else {
    stops.push('black 100%');
  }
  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}

function drawImageInRect(
  ctx: CanvasRenderingContext2D,
  rectW: number,
  rectH: number,
  image: HTMLImageElement,
  state: BandState,
  mode: CollageMode,
) {
  ctx.clearRect(0, 0, rectW, rectH);
  if (!image.complete || image.naturalWidth === 0) return;

  // Slice mode: extract a small patch of the source image and stretch it to
  // fill the band — produces abstract color/pattern fields, not recognizable
  // photo crops. Pan/zoom state is ignored in this mode (re-roll for variety).
  if (mode === 'slice') {
    const { sx, sy, sw, sh } = state.slice;
    const srcW = sw * image.naturalWidth;
    const srcH = sh * image.naturalHeight;
    if (srcW <= 0 || srcH <= 0) return;
    ctx.drawImage(
      image,
      sx * image.naturalWidth,
      sy * image.naturalHeight,
      srcW,
      srcH,
      0,
      0,
      rectW,
      rectH,
    );
    return;
  }

  const stretch = mode === 'stretch';
  const baseW = stretch ? rectW : image.naturalWidth;
  const baseH = stretch ? rectH : image.naturalHeight;
  const cover = stretch
    ? 1
    : Math.max(rectW / image.naturalWidth, rectH / image.naturalHeight);
  const drawScale = cover * state.scale;
  const drawW = baseW * drawScale;
  const drawH = baseH * drawScale;
  const offsetPxX = state.offsetX * drawW;
  const offsetPxY = state.offsetY * drawH;
  let drawX = (rectW - drawW) / 2 + offsetPxX;
  let drawY = (rectH - drawH) / 2 + offsetPxY;
  drawX = Math.min(0, Math.max(rectW - drawW, drawX));
  drawY = Math.min(0, Math.max(rectH - drawH, drawY));
  ctx.drawImage(image, drawX, drawY, drawW, drawH);
}

/* ============================================================================
   Component
   ============================================================================ */

export default function ExquisiteSearch() {
  const { bandRatio, bandCount, mode } = useContext(ExperimentControlsContext);
  // Sharp seams between bands per JC direction — no feather/blur in collage.
  const feather = 0;

  // ── State ────────────────────────────────────────────────────────────
  // NOTE: bands start empty (deterministic for SSR/hydration). Random images
  // are picked client-side in a mount-only useEffect below — Math.random in the
  // useState initializer would mismatch hydration.
  const [bands, setBands] = useState<BandState[]>(() =>
    Array.from({ length: bandCount }, () => makeBand(null)),
  );
  // Phase machine:
  //   'compose'   = preloading new images (bands hidden via opacity:0)
  //   'revealing' = entrance / re-reveal animation in progress
  //   'complete'  = settled, accepting interaction
  const [phase, setPhase] = useState<CollagePhase>('compose');
  const [size, setSize] = useState({ w: 0, h: 0 });

  // ── Refs ─────────────────────────────────────────────────────────────
  const bandsWrapRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const imageElsRef = useRef<Array<HTMLImageElement | null>>([]);
  const interactionCleanups = useRef<Array<(() => void) | null>>([]);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const bandsRef = useRef(bands);
  const phaseRef = useRef(phase);
  bandsRef.current = bands;
  phaseRef.current = phase;

  // ── Preload + reveal pipeline ───────────────────────────────────────
  // Every fresh batch of bands (initial mount, manual shuffle, 15s auto-
  // rerun) goes through here: assign the bands, hide them via the 'compose'
  // phase, wait for images to land in browser cache (or a 2s timeout), then
  // flip to 'revealing' to fire the slide-in animations. Prevents the
  // "image pops in mid-reveal" artifact where bands animate in showing
  // their dominantColor placeholder before the actual photo loads.
  function preloadImages(bandsToLoad: BandState[]): Promise<void> {
    const promises = bandsToLoad.map((b) => {
      if (!b.image) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.addEventListener('load', () => resolve(), { once: true });
        img.addEventListener('error', () => resolve(), { once: true });
        img.src = b.image!.url;
      });
    });
    return Promise.race([
      Promise.all(promises).then(() => {}),
      new Promise<void>((resolve) => window.setTimeout(resolve, 2000)),
    ]);
  }

  function preloadAndReveal(newBands: BandState[]) {
    setBands(newBands);
    setPhase('compose');
    preloadImages(newBands).then(() => {
      // Guard against the bands array having been replaced since we started
      // preloading (e.g. user changed bandCount mid-load).
      setPhase((current) => (current === 'compose' ? 'revealing' : current));
    });
  }

  // ── Initial random pick (client-only, post-hydrate) ─────────────────
  const didInitialPick = useRef(false);
  useEffect(() => {
    if (didInitialPick.current) return;
    didInitialPick.current = true;
    preloadAndReveal(pickRandomBands(bandCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ratios = useMemo(
    () => getRatios(bandRatio, bandCount),
    [bandRatio, bandCount],
  );

  // ── Resize bands array when bandCount changes ───────────────────────
  useEffect(() => {
    setBands((prev) => {
      if (prev.length === bandCount) return prev;
      if (bandCount > prev.length) {
        const used = new Set(
          prev.map((b) => b.image?.id).filter((x): x is string => Boolean(x)),
        );
        const next = [...prev];
        while (next.length < bandCount) {
          const img = pickRandomImage(used);
          if (img) used.add(img.id);
          next.push(makeBand(img));
        }
        return next;
      }
      return prev.slice(0, bandCount);
    });
    imageElsRef.current.length = bandCount;
    canvasRefs.current.length = bandCount;
    interactionCleanups.current.length = bandCount;
    // Re-trigger entrance reveal so the layout change feels intentional
    setPhase('revealing');
  }, [bandCount]);

  // ── Image loading on band assignment ────────────────────────────────
  useEffect(() => {
    bands.forEach((band, idx) => {
      const i = idx as BandIndex;
      const targetUrl = band.image?.url ?? null;
      const existing = imageElsRef.current[i];
      const existingUrl = existing?.src ?? null;

      if (targetUrl === existingUrl) return;

      if (!targetUrl) {
        imageElsRef.current[i] = null;
        redrawBand(i);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.decoding = 'async';
      const onLoad = () => {
        if (bandsRef.current[i]?.image?.url !== targetUrl) return;
        imageElsRef.current[i] = img;
        redrawBand(i);
      };
      img.addEventListener('load', onLoad);
      img.addEventListener('error', () => {
        // Leave dominantColor placeholder visible
      });
      img.src = targetUrl;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bands]);

  // ── Track container size via ResizeObserver ─────────────────────────
  useEffect(() => {
    const el = bandsWrapRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Layouts (always natural ratio — no compose/sliver mode anymore) ─
  const layouts = useMemo<BandRect[]>(() => {
    return Array.from({ length: bandCount }, (_, i) =>
      layoutFor(i, ratios, size.h, feather),
    );
  }, [bandCount, ratios, size.h, feather]);

  const redrawBand = useCallback((i: BandIndex) => {
    const canvas = canvasRefs.current[i];
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const expectedW = Math.round(w * dpr);
    const expectedH = Math.round(h * dpr);
    if (canvas.width !== expectedW || canvas.height !== expectedH) {
      canvas.width = expectedW;
      canvas.height = expectedH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const img = imageElsRef.current[i];
    if (!img || !img.complete || img.naturalWidth === 0) {
      ctx.clearRect(0, 0, w, h);
      return;
    }
    drawImageInRect(ctx, w, h, img, bandsRef.current[i], modeRef.current);
  }, []);

  const redrawAll = useCallback(() => {
    for (let i = 0; i < canvasRefs.current.length; i++) redrawBand(i);
  }, [redrawBand]);

  useEffect(() => {
    redrawAll();
  }, [bands, layouts, redrawAll, mode]);

  // ── Reveal animation orchestration ──────────────────────────────────
  // Each band runs the shimmy keyframes with a per-band delay. Web Animations
  // API drives the animation directly — `fill: 'both'` keeps the band at
  // its 0% state (180px right, opacity 0) until its turn comes, then holds
  // the end state (translateX 0, opacity 1) after the animation completes.
  useEffect(() => {
    if (phase !== 'revealing') return;
    if (typeof window === 'undefined') return;
    const noteTimers: number[] = [];
    for (let i = 0; i < bandCount; i++) {
      const bandEl = canvasRefs.current[i]?.parentElement;
      if (!bandEl) continue;
      bandEl.getAnimations().forEach((a) => a.cancel());
      const anim = bandEl.animate(REVEAL_KEYFRAMES, {
        duration: REVEAL_DURATION_MS,
        delay: i * REVEAL_STAGGER_MS,
        fill: 'both',
      });
      anim.id = 'collage-shimmy';
      // Fire a chime at the same staggered offset as the band's slide-in.
      noteTimers.push(
        window.setTimeout(() => playBandNote(), i * REVEAL_STAGGER_MS),
      );
    }
    const total =
      (bandCount - 1) * REVEAL_STAGGER_MS + REVEAL_DURATION_MS + 50;
    const t = window.setTimeout(() => setPhase('complete'), total);
    return () => {
      clearTimeout(t);
      noteTimers.forEach((nt) => clearTimeout(nt));
    };
  }, [phase, bandCount]);

  // ── Shake to shuffle (mobile, complete state) ───────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (phase !== 'complete') return;
    let lastShake = 0;
    let shakeCount = 0;
    let shakeWindow = 0;
    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;
      const magnitude = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
      if (Math.abs(magnitude - 9.8) > SHAKE_THRESHOLD) {
        const now = Date.now();
        if (now - shakeWindow > 500) {
          shakeCount = 0;
          shakeWindow = now;
        }
        shakeCount++;
        if (shakeCount >= 2 && now - lastShake > SHAKE_COOLDOWN_MS) {
          lastShake = now;
          handleShuffle();
        }
      }
    };
    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ── Pan / zoom interactions ─────────────────────────────────────────
  useEffect(() => {
    for (let i = 0; i < bandCount; i++) attachInteractions(i);
    return () => {
      for (let i = 0; i < bandCount; i++) detachInteractions(i);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, bandCount]);

  function detachInteractions(i: BandIndex) {
    const cleanup = interactionCleanups.current[i];
    if (cleanup) cleanup();
    interactionCleanups.current[i] = null;
  }

  function attachInteractions(i: BandIndex) {
    detachInteractions(i);
    const canvas = canvasRefs.current[i];
    if (!canvas) return;

    let dragging = false;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let startOffsetX = 0;
    let startOffsetY = 0;
    let movedFar = false;

    const pinchState = {
      active: false,
      startDist: 0,
      startScale: 1,
    };

    const onPointerDown = (e: PointerEvent) => {
      if (pinchState.active) return;
      pointerId = e.pointerId;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch {
        // synthetic events / completed pointers: ignore
      }
      dragging = true;
      movedFar = false;
      startX = e.clientX;
      startY = e.clientY;
      const band = bandsRef.current[i];
      if (!band) return;
      startOffsetX = band.offsetX;
      startOffsetY = band.offsetY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging || e.pointerId !== pointerId) return;
      if (pinchState.active) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedFar = true;
      const band = bandsRef.current[i];
      if (!band || !band.image) return;
      const nx = startOffsetX + dx / Math.max(canvas.clientHeight, 1);
      const ny = startOffsetY + dy / Math.max(canvas.clientHeight, 1);
      setBands((prev) => {
        const next = prev.slice();
        if (!next[i]) return prev;
        next[i] = { ...prev[i], offsetX: nx, offsetY: ny };
        return next;
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // ignore
      }
      dragging = false;
      pointerId = null;
      // Tap (no significant motion) = re-roll just this band
      if (!movedFar && !pinchState.active && phaseRef.current === 'complete') {
        rerollBand(i);
      }
    };

    const onPointerCancel = () => {
      dragging = false;
      pointerId = null;
    };

    const onWheel = (e: WheelEvent) => {
      const band = bandsRef.current[i];
      if (!band || !band.image) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      const nextScale = clamp(band.scale + delta, ZOOM_MIN, ZOOM_MAX);
      setBands((prev) => {
        const next = prev.slice();
        if (!next[i]) return prev;
        next[i] = { ...prev[i], scale: nextScale };
        return next;
      });
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const [a, b] = [e.touches[0], e.touches[1]];
        pinchState.active = true;
        pinchState.startDist = Math.hypot(
          b.clientX - a.clientX,
          b.clientY - a.clientY,
        );
        pinchState.startScale = bandsRef.current[i]?.scale ?? 1;
        dragging = false;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (pinchState.active && e.touches.length >= 2) {
        e.preventDefault();
        const [a, b] = [e.touches[0], e.touches[1]];
        const d = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        const ratio = d / Math.max(pinchState.startDist, 1);
        const nextScale = clamp(
          pinchState.startScale * ratio,
          ZOOM_MIN,
          ZOOM_MAX,
        );
        setBands((prev) => {
          const next = prev.slice();
          if (!next[i]) return prev;
          next[i] = { ...prev[i], scale: nextScale };
          return next;
        });
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        pinchState.active = false;
      }
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerCancel);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    interactionCleanups.current[i] = () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerCancel);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }

  // ── Re-roll one band (auto-pick a new image) with shimmy-back ───────
  function rerollBand(i: BandIndex) {
    setBands((prev) => {
      const used = new Set(
        prev
          .map((b, j) => (j === i ? null : b.image?.id))
          .filter((x): x is string => Boolean(x)),
      );
      const currentId = prev[i]?.image?.id;
      if (currentId) used.add(currentId);
      const img = pickRandomImage(used);
      const next = prev.slice();
      next[i] = makeBand(img);
      return next;
    });
    // Play the same shimmy keyframes as the entrance, just on this band.
    const canvas = canvasRefs.current[i];
    const bandEl = canvas?.parentElement;
    if (!bandEl) return;
    bandEl.getAnimations().forEach((a) => a.cancel());
    const anim = bandEl.animate(REVEAL_KEYFRAMES, {
      duration: REVEAL_DURATION_MS,
      fill: 'both',
    });
    anim.id = 'collage-shimmy';
    playBandNote();
  }

  // ── Shuffle (re-roll all images + re-trigger entrance animation) ────
  function handleShuffle() {
    preloadAndReveal(reshuffleBands(bandsRef.current));
  }

  // ── Auto-rerun every 15s while idle in complete state ───────────────
  useEffect(() => {
    if (phase !== 'complete') return;
    const t = window.setTimeout(() => {
      preloadAndReveal(reshuffleBands(bandsRef.current));
    }, AUTO_RERUN_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);


  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className={styles.container}>
      <div ref={bandsWrapRef} className={styles.bandsWrap}>
        {bands.map((band, i) => {
          const layout = layouts[i];
          if (!layout) return null;
          // Animation is driven entirely by Web Animations API (entrance
          // reveal in a useEffect, single-band reroll in rerollBand). React's
          // render handles position/size/color only — no transform/opacity
          // overrides here.
          return (
            <div
              key={i}
              className={styles.band}
              style={{
                top: `${layout.top}px`,
                height: `${layout.height}px`,
                left: `${(band?.bandX ?? 0) * 100}%`,
                width: `${(band?.bandWidth ?? 1) * 100}%`,
                backgroundColor: band?.image?.dominantColor ?? 'transparent',
                // 'compose' = preloading window — keep bands hidden until WAA
                // takes over. After phase flips to 'revealing', WAA's 0%
                // keyframe (opacity 0) instantly applies via fill: 'both'.
                opacity: phase === 'compose' ? 0 : undefined,
              }}
              role="img"
              aria-label={
                band?.image
                  ? `Band ${i + 1} — ${band.image!.tags.join(', ')}`
                  : `Band ${i + 1} — empty`
              }
            >
              <canvas
                ref={(el) => {
                  canvasRefs.current[i] = el;
                }}
                className={styles.canvas}
              />
            </div>
          );
        })}
      </div>

    </div>
  );
}
