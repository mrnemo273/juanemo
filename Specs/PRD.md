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

**Behavior — Viewport Response:**
- On load, the word fills the top 50% of the viewport — edge to edge, horizontally
- The font responds to **viewport width** in real time via the `wdth` axis (range: 25–151):
  - Wide/desktop (1920px+): `wdth` 151 — ultra-extended, letters stretch to fill horizontal space
  - Desktop (1280px): `wdth` 130 — extended and bold
  - Tablet (768px): `wdth` 80 — standard width
  - Mobile (320px): `wdth` 25 — fully condensed, still bold, still single line
- The `opsz` (optical size) axis shifts in parallel with `wdth`, improving letterform quality at each scale
- Transitions are **smooth and continuous** — the font breathes and reshapes itself to its container

**Behavior — Mood System (on load):**
- On every page load, one of **five named moods** is selected at random and applied to the hero via Roboto Flex's secondary axes (`GRAD`, `XTRA`, `XOPQ`, `YOPQ`, `YTUC`, `slnt`)
- The five moods are: **SHARP**, **AIRY**, **HEAVY**, **REFINED**, **PUNCHY** — each producing a distinctly different character in the letterforms while all remaining at `wght` 900
- The mood is set before first paint (in `<head>`) — no flash, no visible change on load
- Each load of the site is subtly different. Regular visitors will notice. Most won't know why.

**Behavior — Scroll Compression:**
- As the user scrolls 0 → 300px, the hero compresses:
  - Font size scales from 50vh fill down to a fixed header size (~5rem)
  - `wght` transitions from 900 → 500 (lighter as it retreats)
  - `GRAD` axis returns toward 0 (mood influence fades)
  - Letter spacing loosens slightly
  - Opacity drops to 0.85
- The hero remains visible at the top of the page as a persistent but compact identity marker

**Behavior — Accent Rule:**
- A single 2px horizontal line in **Bittersweet** (`#F25C54`) cuts through the hero composition
- Positioned at a structurally significant moment — between or adjacent to the display text
- This is the only use of Bittersweet in the hero section. It does not appear on the letterforms themselves.

**Color:** JUANEMO renders in **Dun** (`#D6C5AB`) on the dark background — warmer than Bone, confirmed by Figma reference designs.

**Design principle:** The typography should feel like it *belongs* to its container — as if it was always meant to be exactly that shape for exactly that viewport, on exactly that load.

---

### Feature 2: Project List

Below the JUANEMO hero, a clean vertical list of projects.

**Each project entry includes:**
- `.label-lg` eyebrow — year and tags in uppercase (e.g. `2025 · NEXT.JS · CLAUDE CODE`)
- Project name as a linked heading (18px, medium weight)
- One-line description in body copy
- Optional tag chips — translucent pill style with 8px padding and radius

**Behavior:**
- Pure typographic list — no cards, no thumbnails
- Links use `→` arrow CTA: muted at rest, Bittersweet accent on hover, arrow nudges 3px right
- Open in new tab with `rel="noopener noreferrer"`
- List is editable by updating a single `data/projects.ts` array — no CMS, no friction

**Design principle:** The list should feel like a beautifully typeset table of contents in a monograph — confident, unhurried, legible.

---

### Feature 3: Footer Bar

A three-column full-width footer bar at the bottom of the page, all uppercase labels.

- Left: `JUAN — CARLOS MORALES` (dash separator with negative tracking)
- Center: `JUANEMO`
- Right: `BUILT WITH CLAUDE CODE →` (links to claude.ai, Bittersweet on hover) + dark/light theme toggle

All text in `.label` styles (11–13px, 500 weight, 0.1em tracking, uppercase). No social links, no nav, no noise.

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
