import { useRef, useCallback, useMemo } from 'react';
import type { Particle, CollisionEvent, HarmonicFunction, ChordTone } from './types';
import { HARMONIC_COLORS } from './chordData';

/* ----------------------------------------------------------
   Physics constants (tuning knobs)
   ---------------------------------------------------------- */
const INTER_PARTICLE_G = 0.02;
const CURSOR_G = 0.15;
const ATTRACTION_RADIUS = 400;
const DAMPING = 0.9998;
const BOUNCE_RESTITUTION = 0.7;
const COLLISION_COOLDOWN = 600;
const MAX_PARTICLES = 12;
const INITIAL_VELOCITY_RANGE = 1.2;
const MAX_SPEED = 2.5;
// Desktop vs mobile orb sizes — set at init time
let ORB_RADIUS_MIN = 30;
let ORB_RADIUS_MAX = 65;

export function setOrbSizes(viewportWidth: number) {
  const clampedW = Math.max(320, Math.min(3840, viewportWidth));
  const t = (clampedW - 320) / (3840 - 320);
  ORB_RADIUS_MIN = Math.round(20 + t * (100 - 20));
  ORB_RADIUS_MAX = Math.round(40 + t * (250 - 40));
}

let nextId = 0;

function makeId(): string {
  return `p${nextId++}`;
}

export interface ParticlePhysicsState {
  particles: Particle[];
  collisionEvents: CollisionEvent[];
}

export interface EdgeBounce {
  frequency: number;
  velocity: number;
}

export interface ParticlePhysicsAPI {
  stateRef: React.MutableRefObject<ParticlePhysicsState>;
  gravitySourceRef: React.MutableRefObject<{ x: number; y: number } | null>;
  gyroGravityRef: React.MutableRefObject<{ gx: number; gy: number }>;
  edgeBouncesRef: React.MutableRefObject<EdgeBounce[]>;
  initParticles: (
    frequencies: number[],
    notes: string[],
    chordTones: ChordTone[],
    harmonicFunction: HarmonicFunction,
    width: number,
    height: number,
  ) => void;
  addParticle: (
    x: number,
    y: number,
    frequency: number,
    note: string,
    chordTone: ChordTone,
    harmonicFunction: HarmonicFunction,
  ) => void;
  step: (dt: number, width: number, height: number) => CollisionEvent[];
  retuneParticles: (
    targetFreqs: number[],
    targetNotes: string[],
    chordTones: ChordTone[],
    harmonicFunction: HarmonicFunction,
  ) => void;
  updateFrequencyLerp: (progress: number) => void;
}

export function useParticlePhysics(): ParticlePhysicsAPI {
  const stateRef = useRef<ParticlePhysicsState>({
    particles: [],
    collisionEvents: [],
  });

  const gravitySourceRef = useRef<{ x: number; y: number } | null>(null);
  const gyroGravityRef = useRef<{ gx: number; gy: number }>({ gx: 0, gy: 0 });
  const edgeBouncesRef = useRef<EdgeBounce[]>([]);
  const cooldownMap = useRef<Map<string, number>>(new Map());
  const lerpStartFreqs = useRef<Map<string, number>>(new Map());
  const lerpTargetFreqs = useRef<Map<string, number>>(new Map());

  const initParticles = useCallback(
    (
      frequencies: number[],
      notes: string[],
      chordTones: ChordTone[],
      harmonicFunction: HarmonicFunction,
      width: number,
      height: number,
    ) => {
      const particles: Particle[] = frequencies.map((freq, i) => {
        const padding = 100;
        return {
          id: makeId(),
          x: padding + Math.random() * (width - padding * 2),
          y: padding + Math.random() * (height - padding * 2),
          vx: (Math.random() - 0.5) * INITIAL_VELOCITY_RANGE * 2,
          vy: (Math.random() - 0.5) * INITIAL_VELOCITY_RANGE * 2,
          radius: ORB_RADIUS_MIN + Math.random() * (ORB_RADIUS_MAX - ORB_RADIUS_MIN),
          note: notes[i],
          frequency: freq,
          targetFrequency: freq,
          chordTone: chordTones[i],
          harmonicFunction,
          color: HARMONIC_COLORS[harmonicFunction],
          mass: 1,
          brightness: 0,
          trail: [],
          spawnTime: performance.now(),
          fadeOut: false,
        };
      });
      stateRef.current = { particles, collisionEvents: [] };
      cooldownMap.current.clear();
    },
    [],
  );

  const addParticle = useCallback(
    (
      x: number,
      y: number,
      frequency: number,
      note: string,
      chordTone: ChordTone,
      harmonicFunction: HarmonicFunction,
    ) => {
      const { particles } = stateRef.current;

      // If at max, mark oldest for fade-out
      if (particles.length >= MAX_PARTICLES) {
        const active = particles.filter((p) => !p.fadeOut);
        if (active.length >= MAX_PARTICLES) {
          active[0].fadeOut = true;
          setTimeout(() => {
            stateRef.current.particles = stateRef.current.particles.filter(
              (p) => p.id !== active[0].id,
            );
          }, 300);
        }
      }

      const p: Particle = {
        id: makeId(),
        x,
        y,
        vx: (Math.random() - 0.5) * INITIAL_VELOCITY_RANGE,
        vy: (Math.random() - 0.5) * INITIAL_VELOCITY_RANGE,
        radius: ORB_RADIUS_MIN + Math.random() * (ORB_RADIUS_MAX - ORB_RADIUS_MIN),
        note,
        frequency,
        targetFrequency: frequency,
        chordTone,
        harmonicFunction,
        color: HARMONIC_COLORS[harmonicFunction],
        mass: 1,
        brightness: 1, // Flash on spawn
        trail: [],
        spawnTime: performance.now(),
        fadeOut: false,
      };
      stateRef.current.particles.push(p);
    },
    [],
  );

  const retuneParticles = useCallback(
    (
      targetFreqs: number[],
      targetNotes: string[],
      chordTones: ChordTone[],
      harmonicFunction: HarmonicFunction,
    ) => {
      const { particles } = stateRef.current;
      lerpStartFreqs.current.clear();
      lerpTargetFreqs.current.clear();

      const now = performance.now();
      particles.forEach((p, i) => {
        const tIdx = i % targetFreqs.length;
        lerpStartFreqs.current.set(p.id, p.frequency);
        lerpTargetFreqs.current.set(p.id, targetFreqs[tIdx]);
        p.targetFrequency = targetFreqs[tIdx];
        p.note = targetNotes[tIdx];
        p.chordTone = chordTones[tIdx];
        p.harmonicFunction = harmonicFunction;
        p.color = HARMONIC_COLORS[harmonicFunction];
        p.spawnTime = now; // Reset to replay spring animation
      });
    },
    [],
  );

  const updateFrequencyLerp = useCallback((progress: number) => {
    const { particles } = stateRef.current;
    const t = Math.min(1, Math.max(0, progress));
    // Ease in-out
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    for (const p of particles) {
      const start = lerpStartFreqs.current.get(p.id);
      const target = lerpTargetFreqs.current.get(p.id);
      if (start !== undefined && target !== undefined) {
        p.frequency = start + (target - start) * eased;
      }
    }
  }, []);

  const step = useCallback(
    (dt: number, width: number, height: number): CollisionEvent[] => {
      const { particles } = stateRef.current;
      const now = performance.now();
      const events: CollisionEvent[] = [];
      const edgeBounces: EdgeBounce[] = [];

      // Cap delta time to prevent physics explosion
      const cappedDt = Math.min(dt, 3);

      // Auto-remove: if crowded (>8 orbs), fade out the oldest extras
      const CROWD_THRESHOLD = 8;
      const LIFESPAN = 15000; // 15s before user-spawned extras start fading
      const active = particles.filter((p) => !p.fadeOut);
      if (active.length > CROWD_THRESHOLD) {
        // Sort by spawn time, skip the initial set (first CROWD_THRESHOLD)
        const extras = active
          .slice()
          .sort((a, b) => a.spawnTime - b.spawnTime)
          .slice(CROWD_THRESHOLD);
        for (const extra of extras) {
          if (now - extra.spawnTime > LIFESPAN) {
            extra.fadeOut = true;
            setTimeout(() => {
              stateRef.current.particles = stateRef.current.particles.filter(
                (p) => p.id !== extra.id,
              );
            }, 500);
          }
        }
      }

      for (const p of particles) {
        if (p.fadeOut) continue;

        // Store trail position
        p.trail.unshift({ x: p.x, y: p.y });
        if (p.trail.length > 5) p.trail.pop();

        // Decay brightness
        if (p.brightness > 0) {
          p.brightness = Math.max(0, p.brightness - 0.02 * cappedDt);
        }

        // Inter-particle attraction
        for (const other of particles) {
          if (other.id === p.id || other.fadeOut) continue;
          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);
          if (dist < 1) continue;
          const force = (INTER_PARTICLE_G * p.mass * other.mass) / distSq;
          const fx = (force * dx) / dist;
          const fy = (force * dy) / dist;
          p.vx += fx * cappedDt;
          p.vy += fy * cappedDt;
        }

        // Cursor/touch gravity well
        const gs = gravitySourceRef.current;
        if (gs) {
          const dx = gs.x - p.x;
          const dy = gs.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < ATTRACTION_RADIUS && dist > 1) {
            const force = (CURSOR_G * p.mass) / dist;
            p.vx += (force * dx) / dist * cappedDt;
            p.vy += (force * dy) / dist * cappedDt;
          }
        }

        // Gyro gravity
        const gg = gyroGravityRef.current;
        if (gg.gx !== 0 || gg.gy !== 0) {
          p.vx += gg.gx * 0.01 * cappedDt;
          p.vy += gg.gy * 0.01 * cappedDt;
        }

        // Damping
        p.vx *= Math.pow(DAMPING, cappedDt);
        p.vy *= Math.pow(DAMPING, cappedDt);

        // Speed floor — orbs never stop, always drifting
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed < 0.3) {
          const angle = Math.atan2(p.vy, p.vx) || (Math.random() * Math.PI * 2);
          p.vx = Math.cos(angle) * 0.4;
          p.vy = Math.sin(angle) * 0.4;
        }
        // Speed cap
        if (speed > MAX_SPEED) {
          const scale = MAX_SPEED / speed;
          p.vx *= scale;
          p.vy *= scale;
        }

        // Position update
        p.x += p.vx * cappedDt;
        p.y += p.vy * cappedDt;

        // Edge bounce
        const speedBefore = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        let edgeBounced = false;
        if (p.x - p.radius < 0) {
          p.x = p.radius;
          p.vx = Math.abs(p.vx) * BOUNCE_RESTITUTION;
          edgeBounced = true;
        } else if (p.x + p.radius > width) {
          p.x = width - p.radius;
          p.vx = -Math.abs(p.vx) * BOUNCE_RESTITUTION;
          edgeBounced = true;
        }
        if (p.y - p.radius < 0) {
          p.y = p.radius;
          p.vy = Math.abs(p.vy) * BOUNCE_RESTITUTION;
          edgeBounced = true;
        } else if (p.y + p.radius > height) {
          p.y = height - p.radius;
          p.vy = -Math.abs(p.vy) * BOUNCE_RESTITUTION;
          edgeBounced = true;
        }
        if (edgeBounced) {
          const vel = Math.min(1, Math.max(0.1, speedBefore / 4));
          edgeBounces.push({ frequency: p.frequency, velocity: vel });
          p.brightness = Math.max(p.brightness, 0.5);
        }
      }

      // Collision detection
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          if (a.fadeOut || b.fadeOut) continue;

          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = a.radius + b.radius;

          if (dist < minDist && dist > 0) {
            // Elastic collision response
            const nx = dx / dist;
            const ny = dy / dist;
            const dvx = a.vx - b.vx;
            const dvy = a.vy - b.vy;
            const dvDotN = dvx * nx + dvy * ny;

            // Only resolve if moving toward each other
            if (dvDotN > 0) {
              const massSum = a.mass + b.mass;
              // Full elastic + energy boost on collision
              const impulse = (2 * dvDotN) / massSum;

              a.vx -= impulse * b.mass * nx;
              a.vy -= impulse * b.mass * ny;
              b.vx += impulse * a.mass * nx;
              b.vy += impulse * a.mass * ny;

              // Add a kick of energy so orbs never lose momentum
              const kick = 0.3;
              a.vx -= nx * kick;
              a.vy -= ny * kick;
              b.vx += nx * kick;
              b.vy += ny * kick;
            }

            // Separate overlapping particles
            const overlap = minDist - dist;
            const sepX = (nx * overlap) / 2;
            const sepY = (ny * overlap) / 2;
            a.x -= sepX;
            a.y -= sepY;
            b.x += sepX;
            b.y += sepY;

            // Collision cooldown check
            const pairKey = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
            const lastCollision = cooldownMap.current.get(pairKey) ?? 0;
            if (now - lastCollision > COLLISION_COOLDOWN) {
              cooldownMap.current.set(pairKey, now);

              // Collision velocity for audio dynamics
              const relV = Math.sqrt(dvx * dvx + dvy * dvy);
              const velocity = Math.min(1, Math.max(0.15, relV / 5));

              a.brightness = 1;
              b.brightness = 1;

              events.push({
                idA: a.id,
                idB: b.id,
                velocity,
                freqA: a.frequency,
                freqB: b.frequency,
                midX: (a.x + b.x) / 2,
                midY: (a.y + b.y) / 2,
                time: now,
              });
            }
          }
        }
      }

      stateRef.current.collisionEvents = events;
      edgeBouncesRef.current = edgeBounces;
      return events;
    },
    [],
  );

  return useMemo(() => ({
    stateRef,
    gravitySourceRef,
    gyroGravityRef,
    edgeBouncesRef,
    initParticles,
    addParticle,
    step,
    retuneParticles,
    updateFrequencyLerp,
  }), [initParticles, addParticle, step, retuneParticles, updateFrequencyLerp]);
}
