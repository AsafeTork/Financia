---
name: frontend-craft
description: |
  Anti-slop frontend craft pack for Web (React/Vite/Tailwind). Use when: building a landing page,
  portfolio, marketing site, app UI, or redesigning existing interface — "make it beautiful,
  pixel-perfect, premium, not generic", "doesn't look like an AI template", "editorial", "bento",
  "landing". Consolidates design-taste-frontend, image-to-code, gpt-taste, minimalist-ui and
  industrial-brutalist-ui into one workflow.
---

# Frontend Craft

Ship interfaces that don't look templated — editorial hierarchy, calibrated color, intentional composition.

Style guides (files in `reference/` — read the matching one, pick direction from the brief):

1. **`reference/design-taste-frontend.md`** — default direction for landing pages, portfolios, redesigns:
   read brief → infer design direction → ship non-templated UI. Real design tokens, audit-first on redesigns.
2. **`reference/image-to-code.md`** — for image/screenshot-driven implementation: generate/analyze design image first,
   then implement to match.
3. **`reference/gpt-taste.md`** — elite UX/UI & motion: AIDA page structure, wide editorial typography,
   bento grids, GSAP ScrollTriggers (gapless layouts), motion-driven randomization for layout variance.
4. **`reference/minimalist-ui.md`** — clean editorial style: warm monochrome, typographic contrast, flat bento, no gradients/heavy shadow.
5. **`reference/industrial-brutalist-ui.md`** — raw mechanical style: Swiss typography, rigid grids, utilitarian color; for data-heavy dashboards.
6. **`reference/design-taste-frontend-v1.md`** — v1 preserved for projects that depend on its exact behavior.

## Workflow

1. **Determine direction** — choose the matching style guide from `reference/` based on the brief (refer to the style / tone the user asked for).
2. **Load it** (or blend guides) and obey its principles; they override the generic defaults.
3. **Design tokens** link to the repo's CSS variables (design system), hit the Financia `src/index.css` tokens — no hex.
4. **Implement** section-by-section with real content, respecting typographic contrast and whitespace.
5. **Review** against the anti-slop checklist (no centering defaults, no purple gradient, no generic cards-everywhere).

## Rules

- Never output placeholder copy — use real (pt-BR) labels.
- Respect the chosen style; do not blend minimalist with brutalist.