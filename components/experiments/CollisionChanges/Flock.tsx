'use client';

import { useEffect, useRef, useCallback, useState, useContext } from 'react';
import { ExperimentControlsContext } from '../../../lib/ExperimentControlsContext';
import { useDeviceOrientation } from '../../../lib/useDeviceOrientation';
import { setOrbSizes } from './useParticlePhysics';
import { useChordProgression, PROGRESSION, getChordTone } from './useChordProgression';
import { HARMONIC_COLORS } from './chordData';
import * as Tone from 'tone';
import {
  initAudio,
  isAudioReady,
  dispose,
  setDecay,
  setReverbMix,
  startMetronome,
  setMetronomeTempo,
  setMetronomeTimeSignature,
  stopMetronome,
  playDyad,
  playNote,
  playChordStrum,
} from './audioEngine';
import type { Particle, CollisionEvent, ChordTone } from './types';
import styles from './CollisionChanges.module.css';

/* ----------------------------------------------------------
   Constants
   ---------------------------------------------------------- */
const MOBILE_BREAKPOINT = 600;
const LERP_DURATION = 500;
const CHORD_FLASH_DURATION = 200;
const COLLISION_LINE_DURATION = 200;
const BACKGROUND = '#1F2627';
const COLLISION_COOLDOWN = 300; // Shorter than other sections — dense flocking creates layered sounds

// Boids radii — desktop (separation must exceed typical orb diameter)
const SEPARATION_RADIUS = 100;
const ALIGNMENT_RADIUS = 250;
const COHESION_RADIUS = 600; // Large — all orbs see each other

// Boids radii — mobile (tighter for small viewports)
const SEPARATION_RADIUS_MOBILE = 65;
const ALIGNMENT_RADIUS_MOBILE = 160;
const COHESION_RADIUS_MOBILE = 400;

// Force weights — secondary to orbital behavior
const SEPARATION_WEIGHT = 1.5;     // Prevents overlapping during orbits
const ALIGNMENT_WEIGHT = 0.3;      // Very mild — orbits handle direction
const COHESION_WEIGHT_MIN = 0.0;   // No inter-orb cohesion — they orbit the leader not each other
const COHESION_WEIGHT_MAX = 0.6;   // On downbeat — slight pull together
const SEPARATION_WEIGHT_MIN = 0.8;
const SEPARATION_WEIGHT_MAX = 1.8;

// Leader force
const LEADER_WEIGHT = 0.10;
const TILT_FORCE = 0.10;
const MAX_SPEED = 3.5;
const MAX_FORCE = 0.15;
const WANDER_STRENGTH = 0.02;

// Autonomous leader wander — smooth bezier-like paths
const LEADER_WANDER_SPEED = 2.0;
const LEADER_MAX_STEER = 0.035;

// Orbital parameters — the main behavior
const ORBIT_RADIAL_SPRING = 0.08;  // Strong spring keeps orbs near their orbit radius
const ORBIT_TANGENT_FORCE = 0.14;  // Strong tangential — visible orbiting
const ORBIT_DAMPING = 0.993;       // Slight velocity damping for smooth curves
const ORBIT_ECCENTRICITY = 0.45;   // Elliptical — orbs swoop in close then swing out

// Flight trail
const TRAIL_MAX_LENGTH = 150;      // Long trails — visible flight history
const TRAIL_SAMPLE_INTERVAL = 50;  // ms between trail samples

// Shake detection (for grabbed leader)
const SHAKE_VELOCITY_THRESHOLD = 8; // px/frame velocity to count as "shaking"
const SHAKE_COOLDOWN = 150;         // ms between shake-triggered sounds

// Density halo threshold
const DENSITY_HALO_THRESHOLD = 80;

// Orb sizes — set by setOrbSizes, we read from module-level via getter
let ORB_RADIUS_MIN = 30;
let ORB_RADIUS_MAX = 65;

function updateLocalOrbSizes(viewportWidth: number) {
  setOrbSizes(viewportWidth);
  const clampedW = Math.max(320, Math.min(3840, viewportWidth));
  const t = (clampedW - 320) / (3840 - 320);
  ORB_RADIUS_MIN = Math.round(20 + t * (100 - 20));
  ORB_RADIUS_MAX = Math.round(40 + t * (250 - 40));
}

const NOTE_COLORS: Record<string, string> = {
  C3: '#E8927C', C4: '#E8927C', C5: '#E8927C',
  D3: '#7CC4E8', D4: '#7CC4E8', D5: '#7CC4E8', D6: '#7CC4E8',
  E3: '#A8E87C', E4: '#A8E87C', E5: '#A8E87C', E6: '#A8E87C',
  F2: '#E8D77C', F3: '#E8D77C', F4: '#E8D77C',
  G2: '#C47CE8', G3: '#C47CE8', G4: '#C47CE8', G5: '#C47CE8',
  A2: '#E87CA8', A3: '#E87CA8', A4: '#E87CA8', A5: '#E87CA8',
  B2: '#7CE8D4', B3: '#7CE8D4', B4: '#7CE8D4',
};

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_BREAKPOINT;
}

function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ----------------------------------------------------------
   Particle creation for flock mode
   ---------------------------------------------------------- */
let nextId = 3000;
function makeId(): string { return `fl${nextId++}`; }

const ORB_CHORD_TONES: ChordTone[] = ['root', '3rd', '5th', '7th', '5th', '9th', 'root'];

function createFlockParticles(
  chord: typeof PROGRESSION[0],
  canvasW: number,
  canvasH: number,
): Particle[] {
  const freqs = [
    chord.frequencies[0],
    chord.frequencies[1],
    chord.frequencies[2],
    chord.frequencies[3],
    chord.frequencies[2] * 2,
    chord.ninth!.frequency,
    chord.frequencies[0] * 2,
  ];
  const notes = [
    chord.notes[0], chord.notes[1], chord.notes[2], chord.notes[3],
    chord.notes[2], chord.ninth!.note, chord.notes[0],
  ];

  const now = performance.now();
  const cx = canvasW / 2;
  const cy = canvasH / 2;

  return freqs.map((freq, i) => ({
    id: makeId(),
    x: cx + (Math.random() - 0.5) * 150,
    y: cy + (Math.random() - 0.5) * 150,
    vx: (Math.random() - 0.5) * 2 + (i === 0 ? 1.5 : 0), // Leader starts with horizontal velocity
    vy: (Math.random() - 0.5) * 2,
    radius: i === 0
      ? Math.max(isMobileViewport() ? 36 : 32, ORB_RADIUS_MAX * 0.75) // Leader is larger
      : Math.max(isMobileViewport() ? 28 : 20, ORB_RADIUS_MIN + Math.random() * (ORB_RADIUS_MAX - ORB_RADIUS_MIN) * 0.5),
    note: notes[i],
    frequency: freq,
    targetFrequency: freq,
    chordTone: ORB_CHORD_TONES[i],
    harmonicFunction: chord.harmonicFunction,
    color: HARMONIC_COLORS[chord.harmonicFunction],
    mass: 1,
    brightness: 0,
    trail: [],
    spawnTime: now,
    fadeOut: false,
    isLeader: i === 0, // First orb is the flock leader
  }));
}

/* ----------------------------------------------------------
   Boids physics step
   ---------------------------------------------------------- */
function stepBoids(
  particles: Particle[],
  dt: number,
  canvasW: number,
  canvasH: number,
  breathPhase: number, // 0 = downbeat (contract), 1 = between beats (expand)
  leaderX: number | null,
  leaderY: number | null,
  gyroGx: number,
  gyroGy: number,
  mobile: boolean,
  grabbedId: string | null, // ID of the orb being dragged (null = normal flocking)
  wanderTarget: { targetX: number; targetY: number; nextChangeTime: number },
  time: number,
) {
  const sepR = mobile ? SEPARATION_RADIUS_MOBILE : SEPARATION_RADIUS;
  const aliR = mobile ? ALIGNMENT_RADIUS_MOBILE : ALIGNMENT_RADIUS;
  const cohR = mobile ? COHESION_RADIUS_MOBILE : COHESION_RADIUS;
  const cappedDt = Math.min(dt, 3);

  // Breathing modulation: cosine curve — 0 at downbeat, 1 between beats
  // breathPhase=0 → contract (high cohesion, low separation)
  // breathPhase=1 → expand (low cohesion, high separation)
  const breathCurve = 0.5 * (1 - Math.cos(breathPhase * Math.PI * 2)); // 0→1→0 per beat
  const currentCohesionWeight = COHESION_WEIGHT_MAX - breathCurve * (COHESION_WEIGHT_MAX - COHESION_WEIGHT_MIN);
  const currentSeparationWeight = SEPARATION_WEIGHT_MIN + breathCurve * (SEPARATION_WEIGHT_MAX - SEPARATION_WEIGHT_MIN);

  // Find the grabbed particle for orbital mode
  const grabbedParticle = grabbedId ? particles.find(p => p.id === grabbedId) : null;
  // Find the flock leader
  const flockLeader = particles.find(p => p.isLeader);

  // If grabbed, move that orb directly toward the cursor
  if (grabbedParticle && leaderX !== null && leaderY !== null) {
    // Smooth follow — lerp toward cursor position
    const lerpSpeed = 0.25;
    grabbedParticle.x += (leaderX - grabbedParticle.x) * lerpSpeed;
    grabbedParticle.y += (leaderY - grabbedParticle.y) * lerpSpeed;
    grabbedParticle.vx = (leaderX - grabbedParticle.x) * 0.1;
    grabbedParticle.vy = (leaderY - grabbedParticle.y) * 0.1;
    grabbedParticle.brightness = 0.3;
  }

  // Leader movement — cursor steers it when on canvas, otherwise autonomous wander
  // When cursor is present, leader gently steers toward it (followers orbit the leader)
  if (!grabbedId && flockLeader && leaderX !== null && leaderY !== null) {
    const ldx = leaderX - flockLeader.x;
    const ldy = leaderY - flockLeader.y;
    const ldist = Math.sqrt(ldx * ldx + ldy * ldy);
    if (ldist > 10) {
      // Gentle steering toward cursor — same graceful curve feel
      const steerStr = Math.min(ldist / 400, 1.0) * 0.05;
      flockLeader.vx += (ldx / ldist) * steerStr * cappedDt;
      flockLeader.vy += (ldy / ldist) * steerStr * cappedDt;
    }
    // Maintain speed
    const lSpeed = Math.sqrt(flockLeader.vx * flockLeader.vx + flockLeader.vy * flockLeader.vy);
    const targetSpeed = Math.min(LEADER_WANDER_SPEED * 1.2, ldist * 0.01 + 1.0);
    if (lSpeed > targetSpeed) {
      flockLeader.vx = (flockLeader.vx / lSpeed) * targetSpeed;
      flockLeader.vy = (flockLeader.vy / lSpeed) * targetSpeed;
    } else if (lSpeed < 0.8) {
      const angle = Math.atan2(ldy, ldx);
      flockLeader.vx = Math.cos(angle) * 0.8;
      flockLeader.vy = Math.sin(angle) * 0.8;
    }
  }

  // Autonomous leader wander — graceful bezier-like curves (no cursor)
  if (!grabbedId && flockLeader && leaderX === null) {
    // Wander circle technique: smoothly rotate the heading angle
    // wanderTarget.targetX stores the current wander angle
    // wanderTarget.targetY stores the angular velocity (rate of turn)
    if (wanderTarget.nextChangeTime === 0) {
      // Initialize wander angle from current velocity
      wanderTarget.targetX = Math.atan2(flockLeader.vy, flockLeader.vx);
      wanderTarget.targetY = 0;
      wanderTarget.nextChangeTime = time;
    }

    // Slowly drift the turn rate — creates smooth S-curves
    if (time > wanderTarget.nextChangeTime) {
      // New turn rate: gentle random angular velocity
      wanderTarget.targetY = (Math.random() - 0.5) * 0.03;
      wanderTarget.nextChangeTime = time + 2000 + Math.random() * 3000;
    }

    // Update wander angle with eased turn rate
    wanderTarget.targetX += wanderTarget.targetY * cappedDt;

    // Soft boundary avoidance — steer back toward center when near edges
    const margin = 0.18;
    const edgeForceX =
      flockLeader.x < canvasW * margin ? 0.02 :
      flockLeader.x > canvasW * (1 - margin) ? -0.02 : 0;
    const edgeForceY =
      flockLeader.y < canvasH * margin ? 0.02 :
      flockLeader.y > canvasH * (1 - margin) ? -0.02 : 0;

    // Desired velocity from wander angle
    const desiredVx = Math.cos(wanderTarget.targetX) * LEADER_WANDER_SPEED;
    const desiredVy = Math.sin(wanderTarget.targetX) * LEADER_WANDER_SPEED;

    // Steer gently toward desired (creates graceful curves, not sharp turns)
    flockLeader.vx += (desiredVx - flockLeader.vx) * LEADER_MAX_STEER * cappedDt + edgeForceX * cappedDt;
    flockLeader.vy += (desiredVy - flockLeader.vy) * LEADER_MAX_STEER * cappedDt + edgeForceY * cappedDt;

    // Maintain speed
    const lSpeed = Math.sqrt(flockLeader.vx * flockLeader.vx + flockLeader.vy * flockLeader.vy);
    if (lSpeed > LEADER_WANDER_SPEED) {
      flockLeader.vx = (flockLeader.vx / lSpeed) * LEADER_WANDER_SPEED;
      flockLeader.vy = (flockLeader.vy / lSpeed) * LEADER_WANDER_SPEED;
    } else if (lSpeed < LEADER_WANDER_SPEED * 0.6) {
      const s = LEADER_WANDER_SPEED * 0.6;
      flockLeader.vx = (flockLeader.vx / Math.max(lSpeed, 0.01)) * s;
      flockLeader.vy = (flockLeader.vy / Math.max(lSpeed, 0.01)) * s;
    }
  }

  for (const p of particles) {
    if (p.fadeOut) continue;
    if (grabbedId && p.id === grabbedId) continue; // Skip grabbed orb — handled above

    // Leader skips boids forces — it wanders freely, followers orbit it
    if (p.isLeader && !grabbedId) {
      // Leader: position update, then trail, then edge wrap
      p.x += p.vx * cappedDt;
      p.y += p.vy * cappedDt;
      // Record trail before edge wrap
      const lastPt = p.trail[p.trail.length - 1];
      if (!lastPt || isNaN(lastPt.x) || Math.abs(p.x - lastPt.x) > 2 || Math.abs(p.y - lastPt.y) > 2) {
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > TRAIL_MAX_LENGTH) p.trail.shift();
      }
      // Edge wrap — insert break marker
      const lpx = p.x, lpy = p.y;
      if (p.x < -p.radius) p.x = canvasW + p.radius;
      else if (p.x > canvasW + p.radius) p.x = -p.radius;
      if (p.y < -p.radius) p.y = canvasH + p.radius;
      else if (p.y > canvasH + p.radius) p.y = -p.radius;
      if (p.x !== lpx || p.y !== lpy) p.trail.push({ x: NaN, y: NaN });
      if (p.brightness > 0) p.brightness = Math.max(0, p.brightness - 0.02 * cappedDt);
      continue;
    }

    let sepX = 0, sepY = 0, sepCount = 0;
    let aliX = 0, aliY = 0, aliCount = 0;
    let cohX = 0, cohY = 0, cohCount = 0;

    for (const other of particles) {
      if (other.id === p.id || other.fadeOut) continue;
      const dx = other.x - p.x;
      const dy = other.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < sepR && dist > 0) {
        sepX -= dx / dist;
        sepY -= dy / dist;
        sepCount++;
      }
      if (dist < aliR) {
        aliX += other.vx;
        aliY += other.vy;
        aliCount++;
      }
      if (dist < cohR) {
        cohX += other.x;
        cohY += other.y;
        cohCount++;
      }
    }

    // Normalize and clamp each steering vector
    if (sepCount > 0) {
      sepX /= sepCount; sepY /= sepCount;
      const sepMag = Math.sqrt(sepX * sepX + sepY * sepY);
      if (sepMag > 0) { sepX = (sepX / sepMag) * Math.min(sepMag, MAX_FORCE); sepY = (sepY / sepMag) * Math.min(sepMag, MAX_FORCE); }
    }
    if (aliCount > 0) {
      aliX = aliX / aliCount - p.vx;
      aliY = aliY / aliCount - p.vy;
      const aliMag = Math.sqrt(aliX * aliX + aliY * aliY);
      if (aliMag > MAX_FORCE) { aliX = (aliX / aliMag) * MAX_FORCE; aliY = (aliY / aliMag) * MAX_FORCE; }
    }
    if (cohCount > 0) {
      cohX = cohX / cohCount - p.x;
      cohY = cohY / cohCount - p.y;
      const cohMag = Math.sqrt(cohX * cohX + cohY * cohY);
      if (cohMag > 0) {
        // Normalize then scale to desired speed, then subtract current velocity for steering
        const desired = Math.min(cohMag * 0.03, MAX_SPEED);
        cohX = (cohX / cohMag) * desired - p.vx;
        cohY = (cohY / cohMag) * desired - p.vy;
        const cohSteerMag = Math.sqrt(cohX * cohX + cohY * cohY);
        if (cohSteerMag > MAX_FORCE) { cohX = (cohX / cohSteerMag) * MAX_FORCE; cohY = (cohY / cohSteerMag) * MAX_FORCE; }
      }
    }

    // Wander — gentle random steering to keep the flock alive
    const wanderAngle = Math.random() * Math.PI * 2;
    const wanderX = Math.cos(wanderAngle) * WANDER_STRENGTH;
    const wanderY = Math.sin(wanderAngle) * WANDER_STRENGTH;

    // Weighted sum (separation & cohesion modulated by breathing)
    let ax = sepX * currentSeparationWeight + aliX * ALIGNMENT_WEIGHT + cohX * currentCohesionWeight + wanderX;
    let ay = sepY * currentSeparationWeight + aliY * ALIGNMENT_WEIGHT + cohY * currentCohesionWeight + wanderY;

    // Per-orb identity for orbit variety (deterministic from id)
    const idNum = parseInt(p.id.replace('fl', ''), 10) || 0;
    const phaseOffset = (idNum * 2.39996) % (Math.PI * 2); // Golden angle spacing
    // Each orb gets a unique orbit radius, speed, and eccentricity
    const orbitIndex = idNum % 6;
    const baseOrbitRadius = 70 + orbitIndex * 25; // 70, 95, 120, 145, 170, 195 — tighter flock
    const orbitDirection = orbitIndex % 2 === 0 ? 1 : -1; // Alternate CW/CCW
    const orbitSpeedMult = 0.7 + (orbitIndex % 3) * 0.25; // Varying orbital periods
    // Oscillating orbit radius creates elliptical feel — orbs swoop in and out
    const eccentricPhase = time * 0.0015 * orbitSpeedMult + phaseOffset; // Faster oscillation = visible swooping
    const currentOrbitRadius = baseOrbitRadius * (1 - ORBIT_ECCENTRICITY * Math.sin(eccentricPhase));

    // Determine the attractor (leader or grabbed orb)
    const attractor = grabbedParticle ?? ((!p.isLeader && flockLeader) ? flockLeader : null);

    if (attractor) {
      const adx = attractor.x - p.x;
      const ady = attractor.y - p.y;
      const adist = Math.sqrt(adx * adx + ady * ady);

      if (adist > 1) {
        // Radial spring — pulls orb toward its current orbit radius
        const radialError = adist - currentOrbitRadius;
        const springForce = radialError * ORBIT_RADIAL_SPRING;
        // Quadratic ramp — gentle near orbit, strong pull when far out
        const radialClamp = Math.min(Math.abs(springForce), 0.5) * Math.sign(springForce);
        ax += (adx / adist) * radialClamp;
        ay += (ady / adist) * radialClamp;

        // Tangential force — THIS is what creates the orbiting
        const tangentX = -ady / adist * orbitDirection;
        const tangentY = adx / adist * orbitDirection;
        // Speed varies with distance: faster when close (Kepler-like), slower when far
        const keplerFactor = Math.sqrt(currentOrbitRadius / Math.max(adist, 30));
        const tangentStrength = ORBIT_TANGENT_FORCE * orbitSpeedMult * keplerFactor;
        ax += tangentX * tangentStrength;
        ay += tangentY * tangentStrength;
      }
    }
    // NOTE: cursor/touch steers the LEADER, not individual followers.
    // Followers always orbit the leader — cursor influence is indirect.

    // Tilt force (mobile)
    ax += gyroGx * TILT_FORCE;
    ay += gyroGy * TILT_FORCE;

    p.vx += ax * cappedDt;
    p.vy += ay * cappedDt;

    // Smooth damping — creates graceful curves instead of jerky movement
    p.vx *= ORBIT_DAMPING;
    p.vy *= ORBIT_DAMPING;

    // Clamp speed
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > MAX_SPEED) {
      p.vx = (p.vx / speed) * MAX_SPEED;
      p.vy = (p.vy / speed) * MAX_SPEED;
    }

    // Update position
    p.x += p.vx * cappedDt;
    p.y += p.vy * cappedDt;

    // Record trail BEFORE edge wrapping (so position is pre-wrap)
    const lastTrailPt = p.trail[p.trail.length - 1];
    if (!lastTrailPt || isNaN(lastTrailPt.x) || Math.abs(p.x - lastTrailPt.x) > 2 || Math.abs(p.y - lastTrailPt.y) > 2) {
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > TRAIL_MAX_LENGTH) {
        p.trail.shift();
      }
    }

    // Edge wrapping — insert break marker so trail rendering skips the gap
    const preX = p.x, preY = p.y;
    if (p.x < -p.radius) p.x = canvasW + p.radius;
    else if (p.x > canvasW + p.radius) p.x = -p.radius;
    if (p.y < -p.radius) p.y = canvasH + p.radius;
    else if (p.y > canvasH + p.radius) p.y = -p.radius;
    if (p.x !== preX || p.y !== preY) {
      // Insert a NaN break marker — renderer will start a new segment here
      p.trail.push({ x: NaN, y: NaN });
    }

    // Brightness decay
    if (p.brightness > 0) {
      p.brightness = Math.max(0, p.brightness - 0.02 * cappedDt);
    }
  }

  // Also record trail for grabbed particle
  if (grabbedParticle) {
    const lastPt = grabbedParticle.trail[grabbedParticle.trail.length - 1];
    if (!lastPt || isNaN(lastPt.x) || Math.abs(grabbedParticle.x - lastPt.x) > 2 || Math.abs(grabbedParticle.y - lastPt.y) > 2) {
      grabbedParticle.trail.push({ x: grabbedParticle.x, y: grabbedParticle.y });
      if (grabbedParticle.trail.length > TRAIL_MAX_LENGTH) {
        grabbedParticle.trail.shift();
      }
    }
  }
}

/* ----------------------------------------------------------
   Collision detection (pass-through)
   ---------------------------------------------------------- */
function detectCollisions(
  particles: Particle[],
  cooldownMap: Map<string, number>,
): CollisionEvent[] {
  const now = performance.now();
  const events: CollisionEvent[] = [];

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
        // Proximity glow
        const overlapRatio = 1 - dist / minDist;
        a.brightness = Math.max(a.brightness, 0.3 + overlapRatio * 0.7);
        b.brightness = Math.max(b.brightness, 0.3 + overlapRatio * 0.7);

        // Audio trigger with cooldown
        const pairKey = a.id < b.id ? `${a.id}:${b.id}` : `${b.id}:${a.id}`;
        const lastCollision = cooldownMap.get(pairKey) ?? 0;
        if (now - lastCollision > COLLISION_COOLDOWN) {
          cooldownMap.set(pairKey, now);
          const velocity = Math.min(1, Math.max(0.15, overlapRatio * 2));
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

  return events;
}

/* ----------------------------------------------------------
   Voice-leading for flock particles
   ---------------------------------------------------------- */
function voiceLeadFlock(
  particles: Particle[],
  chord: typeof PROGRESSION[0],
  lerpStartMap: Map<string, number>,
  lerpTargetMap: Map<string, number>,
) {
  lerpStartMap.clear();
  lerpTargetMap.clear();
  const now = performance.now();

  const targetFreqs = [
    chord.frequencies[0],
    chord.frequencies[1],
    chord.frequencies[2],
    chord.frequencies[3],
    chord.frequencies[2] * 2,
    chord.ninth!.frequency,
    chord.frequencies[0] * 2,
  ];
  const targetNotes = [
    chord.notes[0], chord.notes[1], chord.notes[2], chord.notes[3],
    chord.notes[2], chord.ninth!.note, chord.notes[0],
  ];

  // Greedy closest-frequency assignment
  // Leader always gets the root note (index 0)
  const leaderIdx = particles.findIndex(p => p.isLeader);
  const currentFreqs = particles.map((p) => p.frequency);
  const used = new Set<number>();
  const assignment = new Array<number>(currentFreqs.length);

  // Pin leader to root
  if (leaderIdx >= 0) {
    assignment[leaderIdx] = 0;
    used.add(0);
  }

  // Remaining orbs: greedy closest-frequency
  const indices = currentFreqs.map((_, i) => i).filter(i => i !== leaderIdx);
  indices.sort((a, b) => {
    const distA = Math.min(...targetFreqs.filter((_, ti) => !used.has(ti)).map((t) => Math.abs(currentFreqs[a] - t)));
    const distB = Math.min(...targetFreqs.filter((_, ti) => !used.has(ti)).map((t) => Math.abs(currentFreqs[b] - t)));
    return distA - distB;
  });

  for (const pi of indices) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let ti = 0; ti < targetFreqs.length; ti++) {
      if (used.has(ti)) continue;
      const dist = Math.abs(currentFreqs[pi] - targetFreqs[ti]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = ti;
      }
    }
    used.add(bestIdx);
    assignment[pi] = bestIdx;
  }

  particles.forEach((p, i) => {
    const tIdx = assignment[i] ?? (i % targetFreqs.length);
    lerpStartMap.set(p.id, p.frequency);
    lerpTargetMap.set(p.id, targetFreqs[tIdx]);
    p.targetFrequency = targetFreqs[tIdx];
    p.note = targetNotes[tIdx];
    p.chordTone = ORB_CHORD_TONES[tIdx];
    p.harmonicFunction = chord.harmonicFunction;
    p.color = HARMONIC_COLORS[chord.harmonicFunction];
    p.spawnTime = now;
  });
}

function applyLerp(
  particles: Particle[],
  progress: number,
  lerpStartMap: Map<string, number>,
  lerpTargetMap: Map<string, number>,
) {
  const t = Math.min(1, Math.max(0, progress));
  const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  for (const p of particles) {
    const start = lerpStartMap.get(p.id);
    const target = lerpTargetMap.get(p.id);
    if (start !== undefined && target !== undefined) {
      p.frequency = start + (target - start) * eased;
    }
  }
}

/* ==========================================================
   Flock Component
   ========================================================== */
export default function Flock() {
  const controls = useContext(ExperimentControlsContext);
  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  const gyro = useDeviceOrientation();
  const gyroRef = useRef(gyro);
  gyroRef.current = gyro;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const [audioStarted, setAudioStarted] = useState(false);
  const audioStartedRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedChord, setSelectedChord] = useState<number | null>(null);

  const progression = useChordProgression();

  // Particle array
  const particlesRef = useRef<Particle[]>([]);
  const cooldownRef = useRef<Map<string, number>>(new Map());

  // Lerp maps
  const lerpStartMap = useRef<Map<string, number>>(new Map());
  const lerpTargetMap = useRef<Map<string, number>>(new Map());
  const lerpStartTimeRef = useRef(0);
  const isLerpingRef = useRef(false);

  // Leader source (cursor/touch)
  const leaderRef = useRef<{ x: number; y: number } | null>(null);

  // Grab state — dragged orb becomes the attractor, others orbit it
  const grabbedIdRef = useRef<string | null>(null);

  // Autonomous leader wander target — smooth Perlin-like path
  const leaderWanderRef = useRef({ targetX: 0, targetY: 0, nextChangeTime: 0 });

  // Shake detection for grabbed orb
  const grabVelocityRef = useRef({ prevX: 0, prevY: 0, lastShakeTime: 0 });
  const lastTrailTimeRef = useRef(0);

  // Chord change visual state
  const selectedChordRef = useRef<number | null>(null);
  const chordFlashRef = useRef(0);
  const chordNameRef = useRef(PROGRESSION[0].name);

  // Collision lines
  const collisionLinesRef = useRef<
    { x1: number; y1: number; x2: number; y2: number; time: number }[]
  >([]);

  const prefersReducedRef = useRef(false);

  /* --------------------------------------------------------
     Mobile detection + orb sizing
     -------------------------------------------------------- */
  useEffect(() => {
    setIsMobile(isMobileViewport());
    updateLocalOrbSizes(window.innerWidth);
    prefersReducedRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => updateLocalOrbSizes(window.innerWidth), 150);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  /* --------------------------------------------------------
     Audio init
     -------------------------------------------------------- */
  const audioStartingRef = useRef(false);
  const handleAudioStart = useCallback(async () => {
    if (audioStarted || audioStartingRef.current) return;
    audioStartingRef.current = true;
    try {
      await initAudio();
      startMetronome(controlsRef.current.tempo, controlsRef.current.timeSignature);
      progression.setBpmTiming(controlsRef.current.tempo, controlsRef.current.timeSignature);
      setAudioStarted(true);
      audioStartedRef.current = true;
    } catch {
      audioStartingRef.current = false;
    }
  }, [audioStarted, progression]);

  /* --------------------------------------------------------
     Canvas sizing
     -------------------------------------------------------- */
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      sizeRef.current = { w: rect.width, h: rect.height };
    };

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();
    return () => ro.disconnect();
  }, []);

  /* --------------------------------------------------------
     Initialize particles
     -------------------------------------------------------- */
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    const chord = PROGRESSION[0];
    const { w, h } = sizeRef.current;

    const doInit = (w: number, h: number) => {
      particlesRef.current = createFlockParticles(chord, w, h);
      initializedRef.current = true;
    };

    if (w === 0 || h === 0) {
      const t = setTimeout(() => {
        const { w: w2, h: h2 } = sizeRef.current;
        if (w2 > 0 && h2 > 0 && !initializedRef.current) doInit(w2, h2);
      }, 100);
      return () => clearTimeout(t);
    }
    doInit(w, h);
  }, []);

  /* --------------------------------------------------------
     Chord change handler
     -------------------------------------------------------- */
  useEffect(() => {
    progression.onChordChange((newChord) => {
      chordFlashRef.current = performance.now();
      chordNameRef.current = newChord.name;

      voiceLeadFlock(
        particlesRef.current,
        newChord,
        lerpStartMap.current,
        lerpTargetMap.current,
      );

      lerpStartTimeRef.current = performance.now();
      isLerpingRef.current = true;
    });
  }, [progression]);

  // Decay & reverb controls
  useEffect(() => { setDecay(controls.decay); }, [controls.decay]);
  useEffect(() => { setReverbMix(controls.reverbMix); }, [controls.reverbMix]);

  // Tempo & time signature
  useEffect(() => {
    if (!audioStarted) return;
    setMetronomeTempo(controls.tempo);
    progression.setBpmTiming(controls.tempo, controls.timeSignature);
  }, [controls.tempo, audioStarted, controls.timeSignature, progression]);

  useEffect(() => {
    if (!audioStarted) return;
    setMetronomeTimeSignature(controls.timeSignature);
    progression.setBpmTiming(controls.tempo, controls.timeSignature);
  }, [controls.timeSignature, audioStarted, controls.tempo, progression]);

  /* --------------------------------------------------------
     Interaction: mouse + touch — grab orb or passive leader
     -------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /** Hit-test: find the orb under (x, y), closest first */
    const hitTest = (x: number, y: number): Particle | null => {
      let closest: Particle | null = null;
      let closestDist = Infinity;
      for (const p of particlesRef.current) {
        const dx = p.x - x, dy = p.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < p.radius * 1.2 && dist < closestDist) {
          closest = p;
          closestDist = dist;
        }
      }
      return closest;
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = hitTest(x, y);
      if (hit) {
        grabbedIdRef.current = hit.id;
        leaderRef.current = { x, y };
        canvas.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      leaderRef.current = { x, y };

      // Update cursor style
      if (grabbedIdRef.current) {
        canvas.style.cursor = 'grabbing';
      } else {
        const hit = hitTest(x, y);
        canvas.style.cursor = hit ? 'grab' : 'default';
      }
    };

    const handleMouseUp = () => {
      grabbedIdRef.current = null;
      canvas.style.cursor = 'default';
    };

    const handleMouseLeave = () => {
      grabbedIdRef.current = null;
      leaderRef.current = null;
      canvas.style.cursor = 'default';
    };

    const handleTouchStart = (e: TouchEvent) => {
      handleAudioStart();
      const touch = e.touches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const hit = hitTest(x, y);
      if (hit) {
        grabbedIdRef.current = hit.id;
      }
      leaderRef.current = { x, y };
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const rect = canvas.getBoundingClientRect();
      leaderRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    };

    const handleTouchEnd = () => {
      grabbedIdRef.current = null;
      leaderRef.current = null;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleAudioStart]);

  /* --------------------------------------------------------
     Main RAF loop
     -------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (time: number) => {
      const dt = lastTimeRef.current ? (time - lastTimeRef.current) / 16.667 : 1;
      lastTimeRef.current = time;
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const mobile = isMobileViewport();

      // Pause when settings panel is open
      if (controlsRef.current.paused) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // Frequency lerp
      if (isLerpingRef.current) {
        const elapsed = time - lerpStartTimeRef.current;
        const progress = elapsed / LERP_DURATION;
        applyLerp(particlesRef.current, progress, lerpStartMap.current, lerpTargetMap.current);
        if (progress >= 1) isLerpingRef.current = false;
      }

      // Compute leader position and gyro forces
      let leaderX: number | null = null;
      let leaderY: number | null = null;
      let gyroGx = 0;
      let gyroGy = 0;

      const g = gyroRef.current;
      if (mobile && (g.permissionState === 'granted' || g.permissionState === 'not-required')) {
        // Tilt maps to directional force
        gyroGx = (g.gammaNorm - 0.5) * 2; // -1..1
        gyroGy = (g.betaNorm - 0.5) * 2;  // -1..1
      }

      if (leaderRef.current) {
        leaderX = leaderRef.current.x;
        leaderY = leaderRef.current.y;
      }

      // Compute breath phase synced to tempo
      // Beat duration in ms from BPM
      const bpm = controlsRef.current.tempo;
      const beatMs = 60000 / bpm;
      // breathPhase cycles 0→1 per beat (0 = downbeat = contract)
      const breathPhase = audioStartedRef.current
        ? (time % beatMs) / beatMs
        : 0.5; // Neutral when no audio (no breathing until chord is picked)

      // Boids physics step
      stepBoids(
        particlesRef.current,
        dt,
        w,
        h,
        breathPhase,
        leaderX,
        leaderY,
        gyroGx,
        gyroGy,
        mobile,
        grabbedIdRef.current,
        leaderWanderRef.current,
        time,
      );

      // Shake detection — when grabbed orb is moved fast, trigger sounds
      if (grabbedIdRef.current && leaderRef.current && isAudioReady()) {
        const gv = grabVelocityRef.current;
        const cursorVx = leaderRef.current.x - gv.prevX;
        const cursorVy = leaderRef.current.y - gv.prevY;
        const cursorSpeed = Math.sqrt(cursorVx * cursorVx + cursorVy * cursorVy);
        gv.prevX = leaderRef.current.x;
        gv.prevY = leaderRef.current.y;

        if (cursorSpeed > SHAKE_VELOCITY_THRESHOLD && time - gv.lastShakeTime > SHAKE_COOLDOWN) {
          gv.lastShakeTime = time;
          // Play a note from the grabbed orb + a random other orb
          const grabbed = particlesRef.current.find(p => p.id === grabbedIdRef.current);
          if (grabbed) {
            const others = particlesRef.current.filter(p => p.id !== grabbed.id);
            const partner = others[Math.floor(Math.random() * others.length)];
            const velocity = Math.min(1.0, cursorSpeed / 20);
            playDyad(grabbed.frequency, partner.frequency, velocity);
            grabbed.brightness = Math.min(1, grabbed.brightness + 0.5);
            partner.brightness = Math.min(1, partner.brightness + 0.3);

            // Push nearby orbs outward from shake — creates bouncing effect
            for (const p of particlesRef.current) {
              if (p.id === grabbed.id) continue;
              const sdx = p.x - grabbed.x;
              const sdy = p.y - grabbed.y;
              const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
              if (sdist < 200 && sdist > 1) {
                const pushStrength = (1 - sdist / 200) * velocity * 2.5;
                p.vx += (sdx / sdist) * pushStrength;
                p.vy += (sdy / sdist) * pushStrength;
              }
            }
          }
        }
      } else {
        // Reset grab velocity tracking when not grabbing
        grabVelocityRef.current.prevX = leaderRef.current?.x ?? 0;
        grabVelocityRef.current.prevY = leaderRef.current?.y ?? 0;
      }

      // Collision detection
      const collisions = detectCollisions(particlesRef.current, cooldownRef.current);

      // Play audio — stagger multiple collisions to create layered sound
      if (isAudioReady()) {
        for (let ci = 0; ci < collisions.length; ci++) {
          const col = collisions[ci];
          // Stagger by 30ms per pair so dyads layer rather than stack
          const delay = ci * 30;
          if (delay === 0) {
            playDyad(col.freqA, col.freqB, col.velocity);
          } else {
            setTimeout(() => playDyad(col.freqA, col.freqB, col.velocity), delay);
          }
          const pA = particlesRef.current.find((p) => p.id === col.idA);
          const pB = particlesRef.current.find((p) => p.id === col.idB);
          collisionLinesRef.current.push({
            x1: pA?.x ?? col.midX,
            y1: pA?.y ?? col.midY,
            x2: pB?.x ?? col.midX,
            y2: pB?.y ?? col.midY,
            time,
          });
        }
      }

      // ---- RENDER ----
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, w, h);

      // Flock density halo
      const particles = particlesRef.current;
      if (particles.length > 1) {
        let centroidX = 0, centroidY = 0;
        for (const p of particles) {
          centroidX += p.x;
          centroidY += p.y;
        }
        centroidX /= particles.length;
        centroidY /= particles.length;

        let totalDist = 0;
        let maxDist = 0;
        for (const p of particles) {
          const d = Math.sqrt((p.x - centroidX) ** 2 + (p.y - centroidY) ** 2);
          totalDist += d;
          if (d > maxDist) maxDist = d;
        }
        const avgDist = totalDist / particles.length;

        if (avgDist < DENSITY_HALO_THRESHOLD) {
          const haloRadius = maxDist + 20;
          const haloAlpha = 0.03 * (1 - avgDist / DENSITY_HALO_THRESHOLD);
          ctx.beginPath();
          ctx.arc(centroidX, centroidY, haloRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(214, 197, 171, ${haloAlpha})`;
          ctx.fill();
        }
      }

      // Collision lines
      collisionLinesRef.current = collisionLinesRef.current.filter(
        (l) => time - l.time < COLLISION_LINE_DURATION,
      );
      for (const line of collisionLinesRef.current) {
        const lineAlpha = 0.3 * (1 - (time - line.time) / COLLISION_LINE_DURATION);
        ctx.strokeStyle = `rgba(235, 226, 214, ${lineAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      }

      // Draw flight trails (smooth dashed bezier curves, DUN color, fading)
      for (const p of particles) {
        if (p.trail.length < 3) continue;
        ctx.save();
        ctx.setLineDash([6, 8]);
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Split trail into segments at NaN break markers
        const segments: { x: number; y: number }[][] = [];
        let currentSeg: { x: number; y: number }[] = [];
        for (let ti = 0; ti < p.trail.length; ti++) {
          const pt = p.trail[ti];
          if (isNaN(pt.x) || isNaN(pt.y)) {
            if (currentSeg.length >= 2) segments.push(currentSeg);
            currentSeg = [];
          } else {
            currentSeg.push(pt);
          }
        }
        if (currentSeg.length >= 2) segments.push(currentSeg);

        // Draw each segment as a smooth quadratic bezier curve
        for (const seg of segments) {
          // Alpha based on position in overall trail
          const firstIdx = p.trail.indexOf(seg[0]);
          const lastIdx = p.trail.indexOf(seg[seg.length - 1]);
          const midProgress = ((firstIdx + lastIdx) / 2) / p.trail.length;
          const alpha = 0.03 + midProgress * 0.10;
          ctx.strokeStyle = `rgba(214, 197, 171, ${alpha})`;

          ctx.beginPath();
          ctx.moveTo(seg[0].x, seg[0].y);

          if (seg.length === 2) {
            ctx.lineTo(seg[1].x, seg[1].y);
          } else {
            // Smooth quadratic curves through midpoints
            for (let si = 1; si < seg.length - 1; si++) {
              const midX = (seg[si].x + seg[si + 1].x) / 2;
              const midY = (seg[si].y + seg[si + 1].y) / 2;
              ctx.quadraticCurveTo(seg[si].x, seg[si].y, midX, midY);
            }
            // Final point
            const last = seg[seg.length - 1];
            const prev = seg[seg.length - 2];
            ctx.quadraticCurveTo(prev.x, prev.y, last.x, last.y);
          }
          ctx.stroke();
        }

        ctx.setLineDash([]);
        ctx.restore();
      }

      // Draw orbs
      for (const p of particles) {
        const alpha = p.fadeOut ? 0.3 : 1;

        // Spawn spring scale
        const spawnAge = time - p.spawnTime;
        let spawnScale = 1;
        if (spawnAge < 250) {
          const t = spawnAge / 250;
          spawnScale = 1 - 0.7 * Math.exp(-6 * t) * Math.cos(t * Math.PI * 2.5);
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(spawnScale, spawnScale);

        const noteColor = NOTE_COLORS[p.note] ?? p.color;
        const fillAlpha = 0.1 + p.brightness * 0.15;
        const strokeAlpha = 0.6 + p.brightness * 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = colorWithAlpha(noteColor, fillAlpha * alpha);
        ctx.fill();
        ctx.strokeStyle = colorWithAlpha(noteColor, strokeAlpha * alpha);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Grabbed orb glow ring
        if (grabbedIdRef.current === p.id) {
          ctx.beginPath();
          ctx.arc(0, 0, p.radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = colorWithAlpha(noteColor, 0.25);
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Leader indicator — small arrow pointing in direction of movement
        if (p.isLeader && !grabbedIdRef.current) {
          const lSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          const arrowAngle = lSpeed > 0.05
            ? Math.atan2(p.vy, p.vx)
            : 0;
          const arrowDist = p.radius + 8;
          const arrowSize = 5;
          ctx.save();
          ctx.translate(
            Math.cos(arrowAngle) * arrowDist,
            Math.sin(arrowAngle) * arrowDist,
          );
          ctx.rotate(arrowAngle);
          ctx.beginPath();
          ctx.moveTo(arrowSize, 0);
          ctx.lineTo(-arrowSize * 0.6, -arrowSize * 0.5);
          ctx.lineTo(-arrowSize * 0.6, arrowSize * 0.5);
          ctx.closePath();
          ctx.fillStyle = 'rgba(214, 197, 171, 0.35)';
          ctx.fill();
          ctx.restore();
        }

        // Direction tick — 4px line from orb edge in direction of velocity
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.1) {
          const dirX = p.vx / speed;
          const dirY = p.vy / speed;
          ctx.strokeStyle = 'rgba(214, 197, 171, 0.12)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(dirX * p.radius, dirY * p.radius);
          ctx.lineTo(dirX * (p.radius + 4), dirY * (p.radius + 4));
          ctx.stroke();
        }

        // Note label
        const fontSize = Math.max(10, Math.round(p.radius * 0.35));
        ctx.font = `${fontSize}px "DM Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = colorWithAlpha(noteColor, (0.6 + p.brightness * 0.3) * alpha);
        const displayNote = p.note.replace(/[0-9]/g, '').replace('#', '\u266F').replace(/(?<=^[A-G])b/, '\u266D');
        ctx.fillText(displayNote, 0, 0);

        ctx.restore();
      }

      // Chord label (Georgia italic)
      if (selectedChordRef.current !== null) {
        const flashElapsed = time - chordFlashRef.current;
        const flashAlpha = flashElapsed < 500
          ? 0.06 + 0.1 * (1 - flashElapsed / 500)
          : 0.06;
        const chordFontSize = mobile ? 48 : 72;
        ctx.font = `italic ${chordFontSize}px Georgia, "Times New Roman", serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = `rgba(214, 197, 171, ${flashAlpha})`;
        ctx.fillText(chordNameRef.current, w / 2, h / 2);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isMobile]);

  /* --------------------------------------------------------
     Cleanup
     -------------------------------------------------------- */
  useEffect(() => {
    return () => {
      stopMetronome();
      dispose();
    };
  }, []);

  /* --------------------------------------------------------
     Chord dropdown
     -------------------------------------------------------- */
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleChordPick = useCallback((idx: number) => {
    try { Tone.start(); } catch { /* retry below */ }
    selectedChordRef.current = idx;
    setSelectedChord(idx);
    setDropdownOpen(false);

    (async () => {
      await handleAudioStart();
      progression.jumpToChord(idx);
      const chord = PROGRESSION[idx];
      const freqs = [...chord.frequencies];
      if (chord.ninth) freqs.push(chord.ninth.frequency);
      freqs.push(chord.frequencies[2] * 2); // extra 5th
      freqs.push(chord.frequencies[0] * 2); // octave root
      playChordStrum(freqs);
    })();
  }, [progression, handleAudioStart]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas ref={canvasRef} className={styles.canvas} />
      <div ref={dropdownRef} className={styles.chordDropdown}>
        <button
          className={styles.chordToggle}
          onClick={() => setDropdownOpen((o) => !o)}
          onTouchStart={() => { try { Tone.start(); } catch { /* noop */ } }}
        >
          <span>{selectedChord !== null ? PROGRESSION[selectedChord].name : 'Select chord'}</span>
          <svg className={`${styles.chevron}${dropdownOpen ? ` ${styles.chevronOpen}` : ''}`} width="8" height="5" viewBox="0 0 8 5">
            <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {dropdownOpen && (
          <div className={styles.chordMenu}>
            {PROGRESSION.map((chord, i) => (
              <button
                key={chord.name}
                className={`${styles.chordOption}${selectedChord !== null && selectedChord === i ? ` ${styles.chordOptionActive}` : ''}`}
                onClick={() => handleChordPick(i)}
              >
                <span className={styles.chordOptionName}>{chord.name}</span>
                <span className={styles.chordOptionSymbol}>{chord.symbol}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
