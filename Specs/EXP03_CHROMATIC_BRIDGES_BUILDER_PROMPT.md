# EXP-03 Section C: Chromatic Bridges — Builder Prompt

**Read first:** `Specs/EXP03_GIANT_STEPS.md` (full spec with harmonic system, builder realities)
**Depends on:** Shared infrastructure from Section A is BUILT — `giantStepsChordData.ts`, `useGiantStepsProgression.ts`, `types.ts`, `GiantStepsSwitch.tsx`

### Section A — As Built (Context for Your Build)

Section A shipped with significant creative deviations. Key things that affect you:

1. **No orbs in Section A.** The builder replaced orbs with a dynamic chord triangle. **Your section uses orbs traveling along bridges** — a different visual concept, so design orb physics fresh.
2. **Custom sax engine exists** (`saxEngine.ts`). Imports: `initSaxEngine`, `playSaxNote(freq, velocity)`, `setSaxDecay(val)`, `setSaxReverb(val)`, `disposeSax`. Tenor sax timbre. You may reuse this or use `audioEngine.ts` — your call.
3. **Volume control in context.** `ExperimentControlsContext` now has `volume` (0–1). Synced to `Tone.getDestination().volume`. You get this for free.
4. **`setMetronomeVolume(db)` exists** in `audioEngine.ts`. Set your own level.
5. **BPM slider pattern.** Section A uses a range input (80–320). Follow this pattern.
6. **Staggered note playback.** Section A plays root→3rd→7th as a rising sequence. Your bridge sections may want a different musical approach — consider ii chord → V chord → I resolution as a 3-note ascending sequence that mirrors the harmonic motion.

---

## What You're Building

The ii-V passing chords that connect Giant Steps' key centers, visualized as ephemeral force-field arcs (bridges) between zones. Orbs travel along bridges during the ii-V, then settle into the new key center on resolution. Bridges glow, flicker, and dissolve. This section shows **how** the harmony moves — not just where it lands.

---

## Existing Architecture

### Files You'll Create
- `components/experiments/GiantSteps/ChromaticBridges.tsx` — Section C

### Files You'll Modify
- `components/experiments/GiantSteps/GiantStepsSwitch.tsx` — add `activeSection === 2`

### Reference Files
- `components/experiments/GiantSteps/GiantSteps.tsx` — canvas/RAF/audio pattern
- `components/experiments/GiantSteps/giantStepsChordData.ts` — progression, KEY_CENTER_COLORS
- `components/experiments/GiantSteps/useGiantStepsProgression.ts` — progression hook
- `components/experiments/CollisionChanges/audioEngine.ts` — shared audio

---

## Musical Background: The ii-V-I in Giant Steps

Every key center in Giant Steps is approached by its ii-V. These are the "bridges" between key centers:

| Bridge | ii | V7 | Resolution (I) | Key Center |
|--------|-----|-----|----------------|-----------|
| → G | Am7 | D7 | Gmaj7 | G major |
| → E♭ | Fm7 | Bb7 | Ebmaj7 | E♭ major |
| → B | C#m7 | F#7 | Bmaj7 | B major |

But not every key change has a full ii-V. Some are **direct jumps** (e.g., Bmaj7 → D7 skips the ii). The builder must detect which chord sequences are ii-V-I and which are direct V7→I jumps.

### Bridge Detection Logic

```typescript
interface BridgeEvent {
  from: KeyCenter;       // source key center (where orbs are coming from)
  to: KeyCenter;         // destination key center
  type: 'ii-V-I' | 'V-I' | 'direct';  // how long the bridge lasts
  startIndex: number;    // progression index where bridge begins
  endIndex: number;      // index of the resolution chord (Imaj7)
  startTime: number;     // timestamp when bridge appears
  resolutionTime: number | null; // timestamp when orbs arrive
}

// Pre-compute all bridge events from the progression:
function detectBridges(progression: GiantStepsChord[]): BridgeEvent[] {
  const bridges: BridgeEvent[] = [];

  for (let i = 0; i < progression.length; i++) {
    const chord = progression[i];

    if (chord.role === 'tonic' && i > 0) {
      // This is a resolution point. Look back to find the bridge start.
      const prev = progression[i - 1];
      const prevPrev = i >= 2 ? progression[i - 2] : null;

      if (prev.role === 'V7' && prev.keyCenter === chord.keyCenter) {
        // V7 → I resolution found
        if (prevPrev && prevPrev.role === 'ii' && prevPrev.keyCenter === chord.keyCenter) {
          // Full ii-V-I
          const fromKey = i >= 3 ? progression[i - 3].keyCenter : chord.keyCenter;
          bridges.push({
            from: fromKey,
            to: chord.keyCenter,
            type: 'ii-V-I',
            startIndex: i - 2,
            endIndex: i,
            startTime: 0,  // filled at runtime
            resolutionTime: null,
          });
        } else {
          // Direct V7 → I (no ii)
          const fromKey = prevPrev ? prevPrev.keyCenter : chord.keyCenter;
          bridges.push({
            from: fromKey,
            to: chord.keyCenter,
            type: 'V-I',
            startIndex: i - 1,
            endIndex: i,
            startTime: 0,
            resolutionTime: null,
          });
        }
      }
    }
  }

  return bridges;
}
```

The pre-computed bridge list tells you: at progression index X, a bridge should appear connecting key center A to key center B, and it resolves at index Y.

---

## Step 1: Zone Layout

Three key center zones positioned in a triangle (similar to Section B wells, but softer):

```typescript
// Zone positions — same triangle as Section B
function getZonePositions(w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.28;
  return {
    B:  { x: cx, y: cy - r },                                        // top
    G:  { x: cx + r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) },  // bottom-right
    Eb: { x: cx - r * Math.cos(Math.PI / 6), y: cy + r * Math.sin(Math.PI / 6) },  // bottom-left
  };
}
```

### Zone Rendering

Each zone is a soft circular glow — not a hard circle:

```typescript
function renderZone(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  color: string,
  isActive: boolean,
  orbCount: number, // how many orbs are currently in this zone
) {
  const ZONE_RADIUS = 80;  // desktop; scale down for mobile
  const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, ZONE_RADIUS);
  const baseAlpha = isActive ? 0.08 : 0.03;
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'transparent');
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, ZONE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.globalAlpha = baseAlpha + orbCount * 0.005;  // brighter with more orbs
  ctx.fill();
  ctx.globalAlpha = 1;

  // Zone label
  ctx.fillStyle = color;
  ctx.globalAlpha = isActive ? 0.7 : 0.25;
  ctx.font = '11px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    { B: 'B maj', G: 'G maj', Eb: 'E♭ maj' }[pos === zones.B ? 'B' : pos === zones.G ? 'G' : 'Eb'],
    pos.x,
    pos.y + ZONE_RADIUS + 16,
  );
  ctx.globalAlpha = 1;
}
```

---

## Step 2: Bridge Rendering

Bridges are quadratic Bézier curves with particle flow along them.

```typescript
interface ActiveBridge {
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromKey: KeyCenter;
  toKey: KeyCenter;
  controlPoint: { x: number; y: number };  // Bézier control point
  progress: number;    // 0–1 (how far through the bridge lifecycle)
  startTime: number;
  durationMs: number;  // total bridge lifetime (ii + V7 duration)
  particles: BridgeFlowParticle[];
}

interface BridgeFlowParticle {
  t: number;      // 0–1 position along curve
  speed: number;  // how fast this dot moves along the curve
  radius: number;
}

// Bézier control point: perpendicular offset from midpoint
function computeControlPoint(
  from: { x: number; y: number },
  to: { x: number; y: number },
  curveDirection: number,  // +1 or -1 (alternates for variety)
  mouseInfluence?: { x: number; y: number },
) {
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const perpX = -dy;
  const perpY = dx;
  const dist = Math.hypot(dx, dy);
  const offset = dist * 0.3 * curveDirection;  // 30% perpendicular offset

  let cpx = mx + (perpX / dist) * offset;
  let cpy = my + (perpY / dist) * offset;

  // Mouse influence on control point
  if (mouseInfluence) {
    cpx += (mouseInfluence.x - mx) * 0.2;
    cpy += (mouseInfluence.y - my) * 0.2;
  }

  return { x: cpx, y: cpy };
}

// Render bridge:
function renderBridge(ctx: CanvasRenderingContext2D, bridge: ActiveBridge) {
  const { from, to, controlPoint, progress, toKey, particles } = bridge;

  // Bridge line opacity based on progress
  // 0–0.25: fade in (ii chord, first half)
  // 0.25–0.5: strengthen (ii chord, second half)
  // 0.5–0.75: full brightness (V7, first half)
  // 0.75–1.0: dissolving (V7, second half → resolution)
  let opacity: number;
  if (progress < 0.25) {
    opacity = progress / 0.25 * 0.3;       // 0 → 0.3
  } else if (progress < 0.5) {
    opacity = 0.3 + (progress - 0.25) / 0.25 * 0.2;  // 0.3 → 0.5
  } else if (progress < 0.75) {
    opacity = 0.5 + (progress - 0.5) / 0.25 * 0.3;   // 0.5 → 0.8
  } else {
    opacity = 0.8 * (1 - (progress - 0.75) / 0.25);   // 0.8 → 0
  }

  // Draw the Bézier curve
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, to.x, to.y);
  ctx.strokeStyle = KEY_CENTER_COLORS[toKey];
  ctx.globalAlpha = opacity;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Draw flow particles along curve
  for (const fp of particles) {
    const t = fp.t;
    // Quadratic Bézier point at t:
    const px = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * controlPoint.x + t * t * to.x;
    const py = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * controlPoint.y + t * t * to.y;

    ctx.beginPath();
    ctx.arc(px, py, fp.radius, 0, Math.PI * 2);
    ctx.fillStyle = KEY_CENTER_COLORS[toKey];
    ctx.globalAlpha = opacity * 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}
```

### Bridge Flow Particle Animation

```typescript
// Create flow particles when bridge appears:
function createBridgeParticles(count: number): BridgeFlowParticle[] {
  return Array.from({ length: count }, () => ({
    t: Math.random(),              // random starting position along curve
    speed: 0.002 + Math.random() * 0.003,  // varying speeds
    radius: 1 + Math.random() * 2, // 1–3px dots
  }));
}

// In RAF loop — advance particles:
for (const bridge of activeBridges) {
  for (const fp of bridge.particles) {
    fp.t += fp.speed * dt;
    if (fp.t > 1) fp.t = 0;  // loop back to start
  }
}
```

---

## Step 3: Orb Travel Along Bridge

When a bridge is active (progress 0.5–1.0, i.e., the V7 chord), orbs begin traveling from the source zone to the destination zone along the Bézier path:

```typescript
// On V7 chord (bridge progress reaches 0.5):
function startOrbTravel(orbs: Particle[], bridge: ActiveBridge) {
  for (const orb of orbs) {
    orb.traveling = true;
    orb.bridgeT = 0;          // position along curve (0 = source, 1 = destination)
    orb.travelSpeed = 0.003 + Math.random() * 0.002;  // staggered arrival
  }
}

// In RAF loop:
for (const orb of orbs) {
  if (!orb.traveling) continue;

  orb.bridgeT += orb.travelSpeed * dt;
  if (orb.bridgeT >= 1) {
    // Arrived at destination
    orb.bridgeT = 1;
    orb.traveling = false;
    // Snap to zone with slight random offset
    const zone = zonePositions[activeKeyCenter];
    orb.x = zone.x + (Math.random() - 0.5) * 60;
    orb.y = zone.y + (Math.random() - 0.5) * 60;
    continue;
  }

  // Position along Bézier
  const bridge = currentBridgeRef.current;
  if (!bridge) continue;
  const t = orb.bridgeT;
  orb.x = (1-t)*(1-t)*bridge.from.x + 2*(1-t)*t*bridge.controlPoint.x + t*t*bridge.to.x;
  orb.y = (1-t)*(1-t)*bridge.from.y + 2*(1-t)*t*bridge.controlPoint.y + t*t*bridge.to.y;

  // Slight perpendicular jitter for visual variety
  const tangentX = 2*(1-t)*(bridge.controlPoint.x - bridge.from.x) + 2*t*(bridge.to.x - bridge.controlPoint.x);
  const tangentY = 2*(1-t)*(bridge.controlPoint.y - bridge.from.y) + 2*t*(bridge.to.y - bridge.controlPoint.y);
  const len = Math.hypot(tangentX, tangentY);
  const perpX = -tangentY / len;
  const perpY = tangentX / len;
  orb.x += perpX * (Math.random() - 0.5) * 8;
  orb.y += perpY * (Math.random() - 0.5) * 8;
}
```

---

## Step 4: Zone Resting Behavior

When orbs are NOT traveling a bridge, they drift within their zone:

```typescript
const ZONE_RADIUS = 60;
const DRIFT_SPEED = 0.2;
const ZONE_SPRING = 0.02;

for (const orb of orbs) {
  if (orb.traveling) continue;

  const zone = zonePositions[activeKeyCenter];
  const dx = zone.x - orb.x;
  const dy = zone.y - orb.y;
  const dist = Math.hypot(dx, dy);

  // Brownian drift
  orb.vx += (Math.random() - 0.5) * DRIFT_SPEED;
  orb.vy += (Math.random() - 0.5) * DRIFT_SPEED;

  // Spring force at zone edge
  if (dist > ZONE_RADIUS) {
    orb.vx += (dx / dist) * ZONE_SPRING * (dist - ZONE_RADIUS);
    orb.vy += (dy / dist) * ZONE_SPRING * (dist - ZONE_RADIUS);
  }

  // Damping
  orb.vx *= 0.95;
  orb.vy *= 0.95;

  orb.x += orb.vx * dt;
  orb.y += orb.vy * dt;
}
```

---

## Step 5: Resolution Flash

When orbs arrive at a tonic chord:

```typescript
interface ResolutionFlash {
  key: KeyCenter;
  startTime: number;
}

// On Imaj7 resolution:
function triggerResolutionFlash(key: KeyCenter) {
  resolutionFlashesRef.current.push({ key, startTime: Date.now() });
  // Play chord strum
  if (controlsRef.current.soundEnabled) {
    const chord = GIANT_STEPS_PROGRESSION[indexRef.current];
    playChordStrum(chord.notes, chord.frequencies);
  }
  // Canvas flash (subtle)
  canvasFlashRef.current = 0.12;
}

// Render flash:
for (const flash of resolutionFlashesRef.current) {
  const age = Date.now() - flash.startTime;
  const t = age / 300;  // 300ms
  if (t >= 1) continue;

  const zone = zonePositions[flash.key];
  const radius = 40 + t * 60;  // expand 40→100px
  const alpha = 0.3 * (1 - t);

  ctx.beginPath();
  ctx.arc(zone.x, zone.y, radius, 0, Math.PI * 2);
  ctx.fillStyle = KEY_CENTER_COLORS[flash.key];
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.globalAlpha = 1;
}
// Clean
resolutionFlashesRef.current = resolutionFlashesRef.current.filter(f => Date.now() - f.startTime < 300);

// Canvas flash overlay:
if (canvasFlashRef.current > 0) {
  ctx.fillStyle = '#E8DED1';  // bone
  ctx.globalAlpha = canvasFlashRef.current;
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.globalAlpha = 1;
  canvasFlashRef.current *= 0.9;  // fade
  if (canvasFlashRef.current < 0.005) canvasFlashRef.current = 0;
}
```

---

## Step 6: Direct Jumps (V7→I without ii)

Some transitions in Giant Steps skip the ii chord. For these, render a **shorter, faster bridge**:
- Bridge appears on the V7 chord (not 2 beats early)
- Brighter, thinner line
- Orbs travel faster (reach destination in 2 beats instead of 4)

```typescript
// In bridge detection, mark type as 'V-I'
// In rendering, V-I bridges use:
// - durationMs = chordDurationMs (2 beats) instead of 2 * chordDurationMs (4 beats)
// - Higher max opacity (0.9 vs 0.8)
// - Thinner line (1px vs 1.5px) — more urgent feeling
```

---

## Step 7: Overlapping Bridges at High BPM

At 286 BPM, bridges come fast enough that they overlap — a new bridge appears before the previous one dissolves. This is fine. Render all active bridges. The visual layering shows the harmonic density.

```typescript
// activeBridgesRef.current is an array, not a single bridge
// Multiple bridges can be active simultaneously
// Each has its own progress timer, independently advancing
```

---

## Step 8: Interaction — Mouse Influence on Bridge Curvature

```typescript
// Mouse position influences the Bézier control point of active bridges
// This is already handled via the mouseInfluence parameter in computeControlPoint()
// Just pass { x: cursorX, y: cursorY } to the function

// Mobile: tilt gamma and beta influence the control point
// gammaNorm (0–1) → horizontal shift
// betaNorm (0–1) → vertical shift
const mouseInfluence = isMobile
  ? { x: canvasW * orientation.gammaNorm, y: canvasH * orientation.betaNorm }
  : { x: cursorX, y: cursorY };
```

### Tap to Force Resolution

```typescript
function handleCanvasTap(x: number, y: number) {
  if (!audioStartedRef.current) {
    handleAudioStart();
    return;
  }

  // Find which zone was tapped (closest)
  let closestKey: KeyCenter = 'B';
  let closestDist = Infinity;
  for (const key of ['B', 'G', 'Eb'] as KeyCenter[]) {
    const zone = zonePositions[key];
    const dist = Math.hypot(x - zone.x, y - zone.y);
    if (dist < closestDist) {
      closestDist = dist;
      closestKey = key;
    }
  }

  // Force all orbs to snap to that zone
  for (const orb of orbsRef.current) {
    orb.traveling = false;
    orb.x = zonePositions[closestKey].x + (Math.random() - 0.5) * 40;
    orb.y = zonePositions[closestKey].y + (Math.random() - 0.5) * 40;
  }

  // Trigger resolution flash
  triggerResolutionFlash(closestKey);
}
```

---

## Build Order

| Step | Task |
|------|------|
| 1 | Scaffold ChromaticBridges.tsx — canvas, RAF, controls, audio |
| 2 | Position 3 key center zones |
| 3 | Zone rendering — soft radial glow, labels |
| 4 | Initialize 7 orbs in first zone (B), zone drifting behavior |
| 5 | Bridge detection — pre-compute ii-V-I and V-I sequences from progression |
| 6 | Bridge rendering — Bézier curves with opacity lifecycle |
| 7 | Bridge flow particles — small dots moving along curve |
| 8 | Orb travel along bridge path during V7 |
| 9 | Resolution flash on Imaj7 arrival |
| 10 | Mouse/tilt → bridge curvature influence |
| 11 | Tap → force resolution to nearest zone |
| 12 | Test overlapping bridges at 286 BPM |
| 13 | Wire GiantStepsSwitch.tsx (activeSection === 2) |
| 14 | `npm run build` — zero errors |

---

## What NOT to Do

1. **Don't make bridges straight lines.** They must curve. Use quadratic Bézier.
2. **Don't move orbs to destination instantly.** They travel along the curve path — the journey is visible.
3. **Don't forget V-I direct jumps.** Not every key change has a full ii-V-I. Detect and handle both types.
4. **Don't render bridge particles outside the curve.** Flow dots must stay on the Bézier path.
5. **Don't clear bridges on overlap.** Multiple bridges can be active simultaneously at high tempo.
6. **Don't use heavy zone boundaries.** Zones are soft glows, not hard circles. No visible border.
7. **Don't skip the resolution flash.** It's the payoff moment — the "landing."
8. **Don't forget `soundEnabled` checks.**
9. **Don't make orbs static in zones.** They should always be gently drifting (Brownian motion).
10. **Don't compute bridge events at runtime.** Pre-compute them from the progression array at mount time.

---

## Acceptance Criteria

See `Specs/EXP03_GIANT_STEPS.md` — **15 criteria** (GS.C.1–GS.C.15).

---

## Builder Notes

Built 2026-03-31 through 2026-04-01. Shipped in commits 7ae06ed, 7ed396e.

### Deviations

| # | Spec Said | Builder Did | Why |
|---|-----------|-------------|-----|
| 1 | Orbs travel along Bézier bridge paths between zone positions | Orbs travel along arcs on a circle of fifths layout; chord shapes are filled arc triangles (root→3rd→7th→root) | Circle of fifths layout better shows harmonic relationships visually — arcs connect notes on the circle rather than abstract zone positions |
| 2 | Three zone positions in a triangle layout (top, bottom-right, bottom-left) | Full 12-note circle of fifths with all pitch classes labeled around the perimeter | More musically informative — shows where notes sit in the harmonic space |
| 3 | Bridge detection: pre-compute ii-V-I and V-I sequences | Each chord spawns a filled arc shape connecting its notes on the circle; no explicit bridge detection needed | Arc shapes inherently show the harmonic motion — arcs that span wider intervals are visually distinct from compact ones |
| 4 | Resolution flash at zone position | Chord arc shapes bounce/spring on spawn, then dissolve over ~2500ms when next chord arrives | Spring animation + dissolve gives a more organic feel than a flash |
| 5 | Three-voice audio (root→3rd→7th sequence) | Three-voice triad via saxEngine.ts (sax=root, piano=3rd, bass=7th) with staggered timing and distinct voicing per role (resolution vs passing) | Reused the three-voice sax engine from Section C spec for richer harmonic texture |
| 6 | Mouse influences Bézier control point curvature | Mouse/gyro shifts the arc bulge inward/outward (radial offset on control point) | Same concept, applied to the circle-of-fifths arcs rather than bridge curves |

### Lessons Learned

1. **Circle of fifths is the star.** The layout makes harmonic motion visible — major-third jumps span exactly 120° on the circle, making Coltrane's symmetric division obvious.
2. **Filled arc shapes > line bridges.** Drawing arcs as filled shapes (root→3rd→7th triangle with curved sides) creates beautiful overlapping geometry as chords change.
3. **Spring bounce on new shapes.** A quick elastic animation when each chord arc appears gives satisfying visual feedback without being flashy.
4. **Dissolve timing matters.** 2500ms dissolve lets you see 2-3 chord shapes overlapping at moderate BPM, showing harmonic progression as layered geometry.
5. **Three-voice engine reuse.** saxEngine.ts with sax/piano/bass voices works well for triads — bass on root (0.5x octave), piano on 3rd, sax on 7th.
