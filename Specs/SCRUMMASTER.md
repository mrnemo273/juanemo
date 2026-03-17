# SCRUMMASTER.md — Juanemo Project Operations Guide

## Purpose

This document is the onboarding brief for any **planner agent** working on the Juanemo project. Read this first. It tells you how the project is structured, where everything lives, who decides what, and how work flows between agents and the creative director.

---

## Project Overview

**Juanemo** is a personal creative site for Juan-Carlos Morales (JC / Nemo) — a creative director building at the intersection of design, technology, and AI. The site is a typographic showcase powered by Roboto Flex's 13-axis variable font system, with a mood engine that makes every page load feel different.

This is not a generic portfolio. It has a specific creative lineage (Flash-era generative design), a locked-in visual identity, and a point of view. Agents must execute within that vision, not improvise outside it.

---

## Roles

| Role | Who | Responsibility |
|---|---|---|
| **Creative Director** | JC (Nemo) | Final approval on all work. Reviews commits, signs off on phases. Design authority — his Figma work is the source of truth. |
| **Scrummaster** | Planner agent (you, or whoever reads this doc) | Maintains the backlog, updates specs, sequences work, translates JC's feedback into actionable tasks. |
| **Builder** | Builder agent in Claude Code | Executes phase specs. Writes code, commits, and leaves notes for the scrummaster to process. |

---

## Document Map

All project documents live in `/Specs/`. Here's what each one does:

| Document | Purpose | Who Updates It |
|---|---|---|
| `GOALS.md` | Creative mission, visual identity DNA, tone guidance for agents | JC only — this is the north star |
| `PRD.md` | Product requirements — features, behaviors, success criteria | Scrummaster, with JC approval |
| `TRD.md` | Technical requirements — stack, font spec, file structure, code patterns | Scrummaster, based on builder notes |
| `DESIGN_SYSTEM.md` | Full token system — colors, type scale, components, motion, spacing | Scrummaster, with JC approval |
| `SPRINT_PLAN.md` | High-level phase overview — 5 phases with summaries and definitions of done | Scrummaster |
| `BACKLOG.md` | Living backlog — all work items, organized by status | Scrummaster |
| `PHASE_[1-5].md` | Individual sprint specs — detailed task lists for builder agents | Scrummaster writes; builder adds notes |

---

## How Work Flows

### Starting a Phase

1. **Scrummaster** confirms the previous phase is complete (definition of done met, JC approved)
2. **Scrummaster** reviews `BACKLOG.md` for any items that should be pulled into the upcoming phase
3. **Scrummaster** finalizes the `PHASE_X.md` spec (it should already be drafted — just confirm it's current)
4. **Builder agent** is pointed to `PHASE_X.md` and told to execute

### During a Phase

5. **Builder agent** works through the task list in `PHASE_X.md`, checking off items as they go
6. If the builder discovers something unexpected — a technical constraint, a design question, a scope concern — they document it in the `## Builder Notes` section at the bottom of `PHASE_X.md`
7. Builder commits work to the repo incrementally

### Completing a Phase

8. **Builder agent** marks all tasks complete in `PHASE_X.md` and fills out the `## Completion Summary` section
9. **JC** reviews the committed work and either approves or requests changes
10. Once approved, **Scrummaster** processes the builder's notes:
    - Updates `BACKLOG.md` (move completed items, add new discoveries)
    - Updates `PRD.md` if any requirements changed or were clarified
    - Updates `TRD.md` if any technical decisions changed
    - Updates `DESIGN_SYSTEM.md` if any tokens or patterns were added/modified
    - Updates `SPRINT_PLAN.md` if downstream phases need adjustment

### The Feedback Loop

```
JC (approves/requests changes)
    ↓
Scrummaster (processes notes, updates docs)
    ↓
PHASE_X.md (updated spec)
    ↓
Builder agent (executes)
    ↓
Builder Notes (discoveries, questions)
    ↓
JC (reviews)
    ↓
... repeat
```

---

## Rules for Scrummaster Agents

### When updating specs
- Never change `GOALS.md` without JC's explicit direction — that's his creative vision doc
- When updating `PRD.md`, `TRD.md`, or `DESIGN_SYSTEM.md`, add a changelog entry at the bottom noting what changed and why
- Keep `BACKLOG.md` honest — if something isn't going to happen in V1, move it to the V2 section

### When sequencing work
- Phases are sequential. Don't let a builder start Phase N+1 until Phase N's definition of done is fully met
- If JC wants to change priorities mid-phase, update the phase spec and backlog before the builder continues
- Each phase spec should be self-contained — a builder agent should be able to read just that file and know exactly what to do

### When processing builder notes
- Treat builder notes as a pull request against the specs — review them critically
- If a builder made a technical decision that diverges from TRD, confirm with JC before updating the spec
- If a builder discovered a new pattern that should be in the design system, draft the addition and get JC's sign-off

---

## Design Guardrails — Non-Negotiable

These come from `GOALS.md` and `DESIGN_SYSTEM.md`. Every agent on this project must internalize them:

1. **Typography is the product.** Every decision serves the type.
2. **Bittersweet is a line, not a color.** One 2px horizontal rule per composition. Never on text. Never as fill.
3. **Dun, not Bone, for display type on dark backgrounds.** This is confirmed and intentional.
4. **The mood system is sacred.** Five moods, random on each load, all 13 axes in play. Do not simplify or remove.
5. **The dash separator `---` at `-0.15em` tracking is a typographic signature.** Not decoration.
6. **No decoration without purpose.** If it doesn't serve the type or the content, it doesn't ship.
7. **Performance is craft.** LCP < 2s, CLS = 0, no FOUT. These are design values.

---

## Quick Reference — Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | CSS Modules + CSS custom properties |
| Hero font | Roboto Flex (self-hosted via Fontsource) |
| Body font | DM Sans (Fontsource) |
| Deploy | Vercel |
| Package manager | npm |

---

## How to Onboard a New Agent

Point them to these documents in this order:

1. **This file** (`SCRUMMASTER.md`) — understand the process
2. **`GOALS.md`** — understand the creative vision
3. **`PRD.md`** — understand what we're building
4. **`TRD.md`** — understand how we're building it
5. **`DESIGN_SYSTEM.md`** — understand every visual token and rule
6. **`BACKLOG.md`** — understand current status
7. **`PHASE_X.md`** (the active phase) — understand what to do right now
