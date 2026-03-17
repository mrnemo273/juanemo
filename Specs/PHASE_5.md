# PHASE 5 — Polish, Performance & Deploy

## Sprint Goal

Final QA pass across performance, accessibility, cross-browser compatibility, and responsive fidelity. Then deploy to Vercel and ship. This phase is about craft — the difference between "it works" and "it's excellent."

## Status: `NOT STARTED`

## Depends On: Phase 4 (complete and approved)

---

## Prerequisites

- Phase 4 is complete: full page is composed and functional (Hero, ProjectList, Footer, theme toggle)
- All previous phase builder notes have been processed by scrummaster
- Read `TRD.md` §"Performance Requirements", §"Browser Support", §"Accessibility", §"Deployment"

---

## Task List

### 5.1 — Font Performance
- [ ] Add `<link rel="preload">` for the Roboto Flex woff2 file in `<head>`:
  ```html
  <link rel="preload" as="font" type="font/woff2" crossorigin
    href="/_next/static/media/roboto-flex-latin-wght-normal.woff2" />
  ```
  (Exact path may vary — check the build output for the actual woff2 filename)
- [ ] Verify no FOUT (Flash of Unstyled Text) — the hero should render in Roboto Flex immediately, never falling back to system font
- [ ] Check Roboto Flex file size. If > 200KB, consider subsetting to Latin + uppercase characters only
- [ ] DM Sans files should also load without visible fallback flash

### 5.2 — Lighthouse Performance Audit
- [ ] Run Lighthouse in Chrome DevTools (Performance, Accessibility, Best Practices, SEO)
- [ ] Target scores:
  - Performance: **90+**
  - Accessibility: **95+**
  - Best Practices: **95+**
- [ ] Specific metrics:
  - **LCP < 2s** on standard broadband
  - **CLS = 0** — absolutely no layout shift
  - **FID/INP** — interactive within 100ms
- [ ] If performance is below target, investigate:
  - Is there unnecessary JS in the bundle?
  - Are scroll/resize listeners debounced properly?
  - Is any render-blocking CSS or JS present that shouldn't be?
  - Are images or other assets loading that shouldn't be? (There should be none for V1)

### 5.3 — Accessibility Audit
- [ ] **Color contrast (WCAG AA):**
  - Dun (#D6C5AB) on Gunmetal (#1F2627) — verify 4.5:1 ratio for body text, 3:1 for large text
  - Bone (#EBE2D6) on Gunmetal (#1F2627) — verify
  - Gunmetal on Bone (light mode) — verify
  - Bittersweet (#F25C54) — only used on hover states and the accent rule, not on body text, so contrast ratio on text is not required
  - Faint opacity text (50%) — verify it meets AA for its usage context (decorative labels may be exempt, but should still be legible)
- [ ] **Screen reader audit:**
  - Hero text "JUANEMO" is announced correctly
  - All project links have descriptive text (the project name)
  - Footer links are navigable
  - Theme toggle has appropriate `aria-label` or role
- [ ] **Keyboard navigation:**
  - Tab through all interactive elements: project links, footer link, theme toggle
  - Focus styles are visible and use `--color-accent` or a clear outline
  - No keyboard traps
- [ ] **Reduced motion:**
  - Enable `prefers-reduced-motion: reduce` in DevTools
  - Verify all transitions and animations are disabled
  - Scroll compression still updates values (just without transition)

### 5.4 — Cross-Browser Testing
- [ ] **Chrome (latest):** Full functionality — all axes, moods, scroll compression, theme toggle
- [ ] **Safari (16.4+):** Variable font rendering, mood system, scroll behavior
- [ ] **Firefox (114+):** Variable font rendering, CSS custom properties, scroll behavior
- [ ] **Chrome Android:** Touch scroll compression, responsive axes, mood system
- [ ] **Safari iOS (16.4+):** Touch scroll, viewport response, font rendering
- [ ] Document any browser-specific issues in Builder Notes

### 5.5 — Responsive QA
Test at each of these viewports — no layout breaks, no overflow, no orphaned elements:
- [ ] 320px (small mobile)
- [ ] 375px (iPhone standard)
- [ ] 414px (iPhone Plus/Max)
- [ ] 768px (tablet portrait)
- [ ] 1024px (tablet landscape / small laptop)
- [ ] 1280px (standard desktop)
- [ ] 1440px (large desktop)
- [ ] 1920px (full HD)
- [ ] 2560px (ultrawide / QHD)

At each viewport verify:
- Hero fills width edge-to-edge (fitText working)
- Scroll compression works smoothly
- Project list is readable with proper spacing
- Footer is legible and well-composed
- No horizontal scrollbar

### 5.6 — Deploy to Vercel
- [ ] Ensure the project is in a Git repo (GitHub: `mrnemo273/juanemo`)
- [ ] Connect repo to Vercel (or run `vercel` CLI)
- [ ] Verify production build succeeds on Vercel
- [ ] Test the production URL for:
  - Mood system working (random on each load)
  - Theme toggle working (persists across reloads)
  - Scroll compression
  - All links functional
  - Font loading (no FOUT)
- [ ] Confirm auto-deploy: push to `main` → auto-deploys to production
- [ ] Note the production URL in Completion Summary

### 5.7 — README.md
- [ ] Create/update `README.md` in the project root with:
  - Brief project description (1-2 sentences)
  - How to run locally: `npm install && npm run dev`
  - How to add a project: edit `data/projects.ts`, add an object, push to main
  - Stack: Next.js 14+, TypeScript, CSS Modules, Roboto Flex, DM Sans
  - Font credits: Roboto Flex (Google), DM Sans (Colophon Foundry via Google Fonts)
  - Deployed on Vercel
- [ ] Keep it concise — this is a personal project, not a library

---

## Definition of Done

- [ ] Lighthouse: Performance 90+, Accessibility 95+, Best Practices 95+
- [ ] LCP < 2s on standard broadband
- [ ] CLS = 0 — zero layout shift
- [ ] No FOUT — fonts render correctly on first paint
- [ ] All five moods render correctly across Chrome, Safari, Firefox
- [ ] Full responsive range 320–2560px with no layout breaks
- [ ] Keyboard navigation works for all interactive elements
- [ ] `prefers-reduced-motion` fully disables animations
- [ ] Theme toggle works in production, persists, no flash
- [ ] Site is live on Vercel and accessible via URL
- [ ] JC can add a new project by editing one file and pushing
- [ ] README exists with local dev and project-add instructions
- [ ] `npm run build` passes clean

---

## Builder Notes

> _Document decisions, problems, deviations, and items for the scrummaster here._

### Decisions Made
_None yet_

### Problems Encountered
_None yet_

### Browser-Specific Issues
_None yet_

### Performance Findings
_None yet_

### Items for Scrummaster
_None yet_

---

## Completion Summary

| Field | Value |
|---|---|
| Date completed | _pending_ |
| All tasks done? | _pending_ |
| Build passing? | _pending_ |
| Lighthouse scores | Perf: __ / A11y: __ / BP: __ |
| LCP | _pending_ |
| CLS | _pending_ |
| Production URL | _pending_ |
| Deviations? | _pending_ |
| New items for backlog? | _pending_ |
