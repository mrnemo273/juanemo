# GOALS.md — Juanemo Project Mission

## What This Is

Juanemo is a personal creative website for Juan-Carlos Morales (JC / Nemo), a creative director working at the intersection of design, technology, and AI. The site exists to house, showcase, and document his experiments and projects built with Claude Code.

This is not a portfolio in the traditional sense. It is a **creative sandbox** — a living, evolving artifact that is itself a demonstration of what's possible.

---

## The Creative Reference Point: Why This Matters

To understand the spirit of this project, you need to understand the cultural moment it's referencing.

### Joshua Davis & Praystation

In the late 1990s and early 2000s, Flash-era designers like **Joshua Davis** built websites such as [Praystation](http://www.praystation.com) and *Once-Upon-A-Forest* that were not conventional websites at all. They were generative, interactive, almost hallucinatory experiences — living artworks that pushed Flash to its absolute limits. Davis didn't use the web to *present* his work. The website *was* the work.

Other names from this era that shaped this thinking:
- **Yugo Nakamura** (Tha Ltd.) — fluid, physics-based navigation systems that felt alive
- **Hi-ReS!** — dark, immersive, anti-usability experiences that demanded the user's full attention
- **2Advanced Studios** — aggressive, cinematic Flash interfaces that felt like sci-fi
- **Typospace / Cléo Montoya** — typographic experimentation as pure interface
- **Natzke.com** (Erik Natzke) — generative brush systems, emergent art from code

These designers weren't asking permission. They were using the technology of their moment to its fullest, most expressive extreme. The web wasn't a delivery mechanism. It was the medium.

**JC had a site in this era.** He lived it. He understands it from the inside.

### Why Now Feels Like Then

Flash is gone. But something equivalent has arrived: **Claude Code**.

A designer who knows how to think and prompt can now ship whatever they want, however they want — with no handoff, no engineering bottleneck, no compromise. The constraint is imagination, not capability. This is the same energy as 2001, just with a different tool.

Juanemo is JC's answer to that moment. A place to push, experiment, and show what's possible when a creative director has direct access to the machine.

---

## Project Goals

1. **Be the demonstration.** The site itself must be a proof of concept — creative, technically interesting, and built entirely with Claude Code. It should make a designer who sees it want to know how it was made.

2. **Stay maintainable.** JC is one person. The site must be simple enough to update without ceremony. New projects should be easy to add. No CMS, no complex build pipelines, no dependencies that will break in six months.

3. **Typography as the medium.** Rather than leaning on visual complexity, the site uses typography as its primary expressive element. In the spirit of the Flash era, the constraint *is* the concept.

4. **Build in public, learn in public.** Every project listed on the site is a record of learning. The site should feel honest and generative, not curated and precious.

5. **Evolve over time.** The site is not finished at launch. It grows as JC builds more things. The design system should accommodate this gracefully.

---

## Established Visual Identity

JC has an existing visual language developed across his Figma work that carries directly into Juanemo. Agents must understand and honor this — it is not a starting point to diverge from, it is the design DNA of the project.

### The Color System
Five colors. Two modes. One accent used sparingly.
- **Gunmetal `#1F2627`** and **Outer Space `#364245`** — the dark tones. Moody, grounded, studio-like.
- **Bone `#EBE2D6`** and **Dun `#D6C5AB`** — the warm neutrals. Not cold white, not generic beige. Warm.
- **Bittersweet `#F25C54`** — the single accent. Used exactly once per composition, as a thin horizontal rule that cuts through the layout at a structurally significant moment. Never on text. Never as fill. Just the line. Its power comes entirely from restraint.

**Critical:** Large display type on dark backgrounds uses **Dun, not Bone** — it's warmer against Gunmetal and this distinction is intentional and confirmed.

### The Typography Logic
- Large display type is set at enormous scale with heavy negative tracking — letters nearly touching. It feels like a signature, not a headline.
- The **dash separator** — three hyphens `---` with `-0.15em` letter spacing — is JC's typographic punctuation for lists. Used between names, roles, and team members. It creates a visual em-dash without being one.
- Eyebrow labels are ALL CAPS, tracked wide (0.1em), medium weight, faint opacity (50%) — they announce without competing.
- Footer bars run edge to edge, three columns, space-between. Left: name. Center: context. Right: URL or action. All uppercase.

### The Font — Roboto Flex
The hero typeface is **Roboto Flex**, a variable font with 13 axes. This is not just a font choice — it is the creative concept. The word JUANEMO reshapes itself on every viewport, every load, every scroll. It is never quite the same twice.

The **mood system** — five named axis presets (SHARP, AIRY, HEAVY, REFINED, PUNCHY) — is selected at random on each page load. This is the modern equivalent of what Erik Natzke was doing with generative brushes: behavior as identity. The font *performs*. Agents working on the hero should treat the mood system as sacred and not simplify or remove it.

---

## Tone & Voice for Agents

When helping with this project, think like a **creative technologist from the Flash era who has been handed modern tools**. The instinct should always be: *how do we make this more interesting, more expressive, more technically alive?*

- Favor elegance over complexity
- Favor behavior over decoration
- Typography is the hero — treat it with the same care a type designer would
- Interactions should feel inevitable, not clever
- The site should make a senior creative director proud

**What not to do:**
- Do not simplify the mood system or the multi-axis font logic — that complexity is the point
- Do not add visual decoration that isn't grounded in the type system
- Do not use Bittersweet for anything other than the accent rule
- Do not default to Bone for display type on dark — use Dun
- Do not make it feel like a template, a portfolio theme, or a developer's side project

Do not default to generic. Do not default to safe. This project has a point of view and you are here to help execute it.
