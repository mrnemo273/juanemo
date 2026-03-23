'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

/* ----------------------------------------------------------
   Types
   ---------------------------------------------------------- */
export type PermissionState = 'prompt' | 'granted' | 'denied' | 'not-required';

export interface DeviceOrientationValues {
  beta: number;            // Raw clamped value [-45, 45]
  gamma: number;           // Raw clamped value [-30, 30]
  betaNorm: number;        // 0–1 normalized
  gammaNorm: number;       // 0–1 normalized
  isAvailable: boolean;    // DeviceOrientationEvent exists
  permissionState: PermissionState;
  requestPermission: () => Promise<'granted' | 'denied' | 'not-required'>;
}

/* ----------------------------------------------------------
   Constants
   ---------------------------------------------------------- */
const BETA_MIN = -45;
const BETA_MAX = 45;
const GAMMA_MIN = -30;
const GAMMA_MAX = 30;
const LERP_FACTOR = 0.15;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min);
}

/** Does this browser require iOS-style permission for DeviceOrientation? */
function needsPermission(): boolean {
  return (
    typeof DeviceOrientationEvent !== 'undefined' &&
    typeof (DeviceOrientationEvent as any).requestPermission === 'function'
  );
}

function hasDeviceOrientation(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

/* ----------------------------------------------------------
   Hook
   ---------------------------------------------------------- */
export function useDeviceOrientation(): DeviceOrientationValues {
  const [permissionState, setPermissionState] = useState<PermissionState>(() => {
    if (typeof window === 'undefined') return 'prompt';
    if (!hasDeviceOrientation()) return 'denied';
    return needsPermission() ? 'prompt' : 'not-required';
  });

  // Smoothed values stored in refs for RAF loop
  const smoothBeta = useRef(0);
  const smoothGamma = useRef(0);
  const rawBeta = useRef(0);
  const rawGamma = useRef(0);

  // Exposed state — updated via RAF
  const [values, setValues] = useState({ beta: 0, gamma: 0, betaNorm: 0.5, gammaNorm: 0.5 });
  const rafRef = useRef<number>(0);
  const listeningRef = useRef(false);

  /* Start the smoothing loop + attach orientation listener */
  const startListening = useCallback(() => {
    if (listeningRef.current) return;
    listeningRef.current = true;

    const handler = (e: DeviceOrientationEvent) => {
      if (e.beta != null) rawBeta.current = clamp(e.beta, BETA_MIN, BETA_MAX);
      if (e.gamma != null) rawGamma.current = clamp(e.gamma, GAMMA_MIN, GAMMA_MAX);
    };
    window.addEventListener('deviceorientation', handler);

    const loop = () => {
      smoothBeta.current += (rawBeta.current - smoothBeta.current) * LERP_FACTOR;
      smoothGamma.current += (rawGamma.current - smoothGamma.current) * LERP_FACTOR;

      const b = smoothBeta.current;
      const g = smoothGamma.current;

      setValues({
        beta: b,
        gamma: g,
        betaNorm: normalize(b, BETA_MIN, BETA_MAX),
        gammaNorm: normalize(g, GAMMA_MIN, GAMMA_MAX),
      });

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    // Store handler for cleanup
    (startListening as any).__cleanup = () => {
      window.removeEventListener('deviceorientation', handler);
      cancelAnimationFrame(rafRef.current);
      listeningRef.current = false;
    };
  }, []);

  /* Auto-attach when permission allows it */
  useEffect(() => {
    if (permissionState === 'not-required' || permissionState === 'granted') {
      startListening();
    }
    return () => {
      (startListening as any).__cleanup?.();
    };
  }, [permissionState, startListening]);

  /* Request permission (iOS) — must be called from a user gesture */
  const requestPermission = useCallback(async (): Promise<'granted' | 'denied' | 'not-required'> => {
    if (!hasDeviceOrientation()) {
      setPermissionState('denied');
      return 'denied';
    }
    if (!needsPermission()) {
      setPermissionState('not-required');
      startListening();
      return 'not-required';
    }
    try {
      const result = await (DeviceOrientationEvent as any).requestPermission();
      if (result === 'granted') {
        setPermissionState('granted');
        startListening();
        return 'granted';
      }
      setPermissionState('denied');
      return 'denied';
    } catch {
      setPermissionState('denied');
      return 'denied';
    }
  }, [startListening]);

  return {
    ...values,
    isAvailable: hasDeviceOrientation(),
    permissionState,
    requestPermission,
  };
}
