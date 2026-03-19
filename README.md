# Juanemo

A journal of full-screen creative experiments built with [Claude Code](https://claude.com/claude-code).

Each experiment fills the entire browser window — no scrolling, no chrome. The browser is a canvas, not a document.

## Run locally

```bash
npm install
npm run dev
```

## Add an experiment

1. Create a component in `components/experiments/YourExperiment.tsx`
2. Add an entry to `data/experiments.ts` (newest first)
3. Register the slug mapping in `app/experiments/[slug]/page.tsx`

## Stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript**
- **CSS Modules** + CSS custom properties
- **Roboto Flex** — variable font, 13 axes, per-character generative animation
- **DM Sans** — body and UI text
- Deployed on **Vercel**
