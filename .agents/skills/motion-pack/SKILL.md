---
name: motion-pack
description: |
  Motion & animation excellence. Use when: animating the UI, micro-interactions, scroll
  animations, transitions, wow-factor, "make it move", GSAP / ScrollTrigger / Framer Motion work,
  easing and timing decisions, sticky/parallax/stecking scroll effects. Consolidates gsap,
  motion-design and genjutsu into one workflow.
---

# Motion Pack

Design motion that feels intentional — timing, easing, hierarchy, and interaction.

Load these subskills from `reference/` as needed:

1. **`reference/motion-design.md`** — tech-agnostic foundations: timing, easing curves, typography in motion,
   composition, brand elements. Use for deciding HOW something should move first.
2. **`reference/gsap.md`** — official GSAP platform: core API, timelines, ScrollTrigger, plugins (Flip,
   Draggable, SplitText), React integration, performance patterns, framework examples.
3. **`reference/genjutsu.md`** — creative coding for motion & micro-interactions: interaction thesis,
   art direction, motion signatures, audit pipeline. Web/Android/iOS.

## Workflow

1. **Decide** (reference/motion-design.md) — before code: define the motion narrative, timing (duration/easing),
   light/desired. Bans floaty-cheap defaults.
2. **Engine** (reference/gsap.md) — implement with GSAP core or its ScrollTrigger; if the user asked for specific
   engine (Framer/waves) use it. Respect this repo's D008: no new deps without justification —
   prefer CSS keyframes where sufficient.
3. **Polish** (reference/genjutsu.md) — specificity, "illusion" quality: contact the audit-heavy pipeline for
   signature adds.
4. **Budget** — keep it ≤ ~200ms default, prefer CSS `prefers-reduced-motion` and repect users
   who request reduced motion.

## Rules

- Do not install GSAP unless required (repo decision D008). CSS/WAVES first.
- Motion uses design-system tokens; must map to CSS vars.
- reduced motion must be handled.