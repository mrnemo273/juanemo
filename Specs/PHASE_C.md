# PHASE C — Polish, Performance & Deploy

## Sprint Goal

Final QA pass across performance, accessibility, cross-browser compatibility, and responsive fidelity. Deploy to Vercel and ship. This phase is about craft — the difference between "it works" and "it's excellent."

## Status: `NOT STARTED`

## Depends On: Phase B (complete)

---

## Prerequisites

- Phase B is complete: full architecture live — experiments, LogoMark, IndexOverlay, routing
- All builder notes from Phases A and B have been processed by scrummaster
- Read `Specs/TRD.md` — §"Performance Requirements", §"Browser Support", §"Deployment"

---

## Task List

### C.1 — Font Performance

- [ ] Add `<link rel="preload">` for the Roboto Flex woff2 file in `<head>`:
  ```html
  <link rel="preload" as="font" type="font/woff2" crossorigin
    href="/_next/static/media/[actual-filename].woff2" />
  ```
  Check the build output for the actual woff2 filename.
- [ ] Verify no FOUT — the experiment should render in Roboto Flex immediately
- [ ] Check Roboto Flex file size (`full.css` is ~326KB). If too large for target perf, consider subsetting to Latin + uppercase
- [ ] DM Sans should also load without visible fallback flash

### C.2 — Performance Audit

- [ ] Run Lighthouse in Chrome DevTools
- [ ] Target scores:
  - Performance: **90+**
  - Accessibility: **95+**
  - Best Practices: **95+**
- [ ] Specific metrics:
  - **LCP < 2s** on standard broadband
  - **CLS = 0** — absolutely no layout shift
  - **INP** — interactive within 100ms
- [ ] If below target, investigate: unnecessary JS, unoptimized font loading, render-blocking resources

### C.3 — Accessibility Audit

- [ ] **Color contrast (WCAG AA):**
  - Dun on Gunmetal — verify 4.5:1 for body, 3:1 for large text
  - Bone on Gunmetal — verify
  - Faint opacity text (50%) — verify legibility
- [ ] **Screen reader:**
  - GenerativeType experiment: "Juanemo" announced as heading
  - LogoMark: announced as link to home
  - IndexOverlay: experiment links are navigable
  - INDEX trigger has appropriate `aria-label`
- [ ] **Keyboard navigation:**
  - Tab through: LogoMark link, INDEX trigger, experiment links in overlay
  - Escape closes overlay
  - Focus trap in overlay when open
  - Focus visible styles on all interactive elements
- [ ] **Reduced motion:**
  - Enable `prefers-reduced-motion: reduce`
  - All transitions disabled (axis changes still happen, just instantly)
  - Scale transform transitions disabled

### C.4 — Cross-Browser Testing

- [ ] **Chrome (latest):** Full functionality — all axes, drift+hold, scaleXY, overlay
- [ ] **Safari (16.4+):** Variable font rendering, scale transforms, overlay transitions
- [ ] **Firefox (114+):** Variable font rendering, CSS custom properties, overlay
- [ ] **Chrome Android:** Touch interactions, mobile axis caps, overlay
- [ ] **Safari iOS (16.4+):** Touch, viewport sizing (`100vh` behavior on iOS), font rendering
- [ ] Document any browser-specific issues in Builder Notes

### C.5 — Responsive QA

Test at each viewport — no scroll, no overflow, experiment fills viewport:
- [ ] 320px (small mobile)
- [ ] 375px (iPhone standard)
- [ ] 414px (iPhone Plus/Max)
- [ ] 768px (tablet portrait)
- [ ] 1024px (tablet landscape)
- [ ] 1280px (standard desktop)
- [ ] 1440px (large desktop)
- [ ] 1920px (full HD)
- [ ] 2560px (ultrawide)

At each viewport verify:
- Experiment fills viewport, no scroll
- ScaleXY text fills container
- LogoMark visible and readable
- INDEX trigger accessible
- IndexOverlay renders correctly
- No horizontal scrollbar
- Mobile axis caps active on ≤600px

### C.6 — Deploy to Vercel

- [ ] Verify the project is in a Git repo (GitHub: `mrnemo273/juanemo`)
- [ ] Verify `vercel.json` has `"framework": "nextjs"`
- [ ] Verify Vercel project settings: Framework Preset = "Next.js"
- [ ] Deploy production build
- [ ] Test production URL for:
  - Home redirect to latest experiment
  - Generative typography experiment renders correctly
  - LogoMark + INDEX overlay work
  - Font loading (no FOUT)
  - Mobile behavior
- [ ] Confirm auto-deploy: push to `main` → auto-deploys to production
- [ ] Note the production URL in Completion Summary

### C.7 — README.md

- [ ] Update `README.md` with:
  - Brief project description: "Juanemo — a journal of full-screen creative experiments built with Claude Code"
  - How to run locally: `npm install && npm run dev`
  - How to add an experiment: create component in `components/experiments/`, add entry to `data/experiments.ts`, register in slug mapping
  - Stack: Next.js 16, TypeScript, CSS Modules, Roboto Flex (variable, 13 axes), DM Sans
  - Deployed on Vercel
- [ ] Keep it concise

---

## Definition of Done

- [ ] Lighthouse: Performance 90+, Accessibility 95+, Best Practices 95+
- [ ] LCP < 2s, CLS = 0
- [ ] No FOUT
- [ ] Keyboard navigation works (Tab, Escape, focus visible)
- [ ] `prefers-reduced-motion` disables all animations
- [ ] Works across Chrome, Safari, Firefox (desktop + mobile)
- [ ] Full responsive range 320–2560px, no scroll, no overflow
- [ ] Site is live on Vercel
- [ ] Adding a new experiment takes < 15 minutes
- [ ] README exists
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
