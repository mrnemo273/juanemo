# PRD.md — Product Requirements Document

## Product Name
Juanemo — Personal Creative Site

## Owner
Juan-Carlos Morales (JC / Nemo)

## Version
1.0 — Initial Launch

---

## Overview

Juanemo is a single-page personal website that acts as a living index of JC's creative and technical experiments built with Claude Code. The site is minimal in structure but maximal in execution — the typography *is* the design, and the design *is* the product.

---

## Users

**Primary:** Other designers, creative directors, and technologists who find the site organically or through JC sharing it. They are visually sophisticated and will notice craft immediately.

**Secondary:** JC himself — adding projects, checking the site, using it as a link-in-bio equivalent.

---

## Core Features

### Feature 1: Variable Typography Hero — "JUANEMO"

The top half of the viewport is occupied entirely by the word **JUANEMO** in all caps, rendered in **Roboto Flex** — a variable font with 13 axes, self-hosted via Fontsource.

**Behavior — Viewport Response (Updated Phase 2):**
- On load, the word fills the top 50% of the viewport — edge to edge, horizontally
- The font responds to **viewport width** in real time via three structural axes (`wdth`, `wght`, `opsz`), range 500–1920px:
  - Wide/desktop (1920px+): `wdth` 151, `wght` 900, `opsz` 144 — ultra-extended, bold
  - Desktop (1280px): `wdth` ~105, `wght` ~554 — extended, medium-bold
  - Tablet (768px): `wdth` ~48, `wght` ~267 — condensed, light-medium
  - Mobile (≤500px): `wdth` 25, `wght` 100, `opsz` 8 — ultra-condensed, light, tall
- **Key change:** `wght` is now viewport-responsive (100–900), not locked at 900. The font character changes fluidly — this IS the creative concept.
- Transitions are **smooth and continuous** — the font breathes and reshapes itself to its container

**Behavior — Mood System (ON HOLD):**
- ⏸ Mood system disabled during Phase 2 build. The randomized character axes (XOPQ, XTRA, YOPQ) produced different glyph widths per mood, breaking fitText consistency on mobile. JC approved disabling.
- **Future approach:** Constrain moods to width-safe axes only (GRAD, slnt, YTUC). Definitions preserved in `lib/moods.ts`.
- Original design: On every page load, one of **five named moods** is selected at random and applied to the hero via Roboto Flex's secondary axes (`GRAD`, `XTRA`, `XOPQ`, `YOPQ`, `YTUC`, `slnt`). The five moods are: **SHARP**, **AIRY**, **HEAVY**, **REFINED**, **PUNCHY**.

**Behavior — Scroll Compression (DEFERRED):**
- ⏸ Implemented during Phase 2 but visually broken in practice. Disabled per JC's direction. To be redesigned.
- Original spec: As the user scrolls 0 → 300px, the hero compresses (font size, wght, GRAD, letter spacing, opacity). The hero remains visible as a persistent compact header.

**Behavior — Accent Rule (DEFERRED):**
- ⏸ Deferred during Phase 2 per JC's direction. To be re-added when hero composition is finalized.
- Original spec: A single 2px horizontal line in **Bittersweet** (`#F25C54`) cuts through the hero composition, positioned at a structurally significant moment.

**Color:** JUANEMO renders in **Dun** (`#D6C5AB`) on the dark background — warmer than Bone, confirmed by Figma reference designs.

**Design principle:** The typography should feel like it *belongs* to its container — as if it was always meant to be exactly that shape for exactly that viewport, on exactly that load.

---

### Feature 2: Project List

Below the JUANEMO hero, a newspaper-style full-bleed index of projects.

**Each project entry includes:**
- Numbered entry (`01`, `02`) in Bittersweet, thin weight (300), same size as title
- Project name as an all-caps heading — `clamp(28px, 3vw, 40px)`, weight 500
- `.label-lg` eyebrow below the title showing published date (e.g. `MARCH 5, 2025`)
- One-line description in body copy (`--color-text-soft`)
- "View Project →" CTA link

**Behavior:**
- Full-bleed layout — no max-width, matches the hero's edge-to-edge feel
- Thin 1px HR separators between entries
- CTA uses `→` arrow: muted at rest, Bittersweet accent on hover, arrow nudges 3px right
- Open in new tab with `rel="noopener noreferrer"`
- List is editable by updating a single `data/projects.ts` array — no CMS, no friction
- Mobile (≤600px): numbers stack on top of content instead of side-by-side

**Design principle:** The list should feel like an oversized newspaper index — confident, unhurried, legible.

---

### Feature 3: Footer

A minimal three-column full-width footer at the bottom of the page, all uppercase labels.

- Left: `juanemo.com`
- Center: `© 2026 Juan-Carlos Morales`
- Right: Email + LinkedIn contact links

All text in `.label` styles (11px, 500 weight, 0.1em tracking, uppercase, `--color-text-faint`). Links hover to Bittersweet. Stacks vertically on mobile (≤600px).

---

### Feature 4: Dark / Light Mode

- **Dark is default** — Gunmetal background, Bone/Dun text
- **Light is opt-in** — Bone background, Gunmetal text, same accent
- Toggle lives in the footer: `DARK · LIGHT` text labels, no icons
- Preference persists to `localStorage`
- Set before render to prevent flash

---

## Out of Scope (V1)

- CMS or admin interface
- Blog or long-form writing
- Project detail pages (projects link out externally)
- Contact form
- Analytics dashboard (though basic analytics like Vercel Analytics or Plausible may be added silently)

---

## Success Criteria

- A senior creative director opens the site and immediately understands what it is and who made it
- The typography interaction works flawlessly across Chrome, Safari, Firefox on desktop and mobile
- JC can add a new project in under 5 minutes by editing one file
- The site loads in under 2 seconds on a standard connection
- No layout breaks at any viewport width between 320px and 2560px

---

## Future Considerations (V2+)

- Generative background element (subtle, typographic, or particle-based) that echoes the Flash era
- Project entries with hover states that reveal a preview or texture
- A "making of" easter egg that surfaces the Claude Code prompts used to build each project
- Sound — ambient, minimal, opt-in
- More moods added to the mood system over time
- Per-project mood assignment — each project triggers a specific mood on hover
