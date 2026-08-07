---
name: design-dna-pack
description: |
  Premium design system guidance. Consolidates design-dna, high-end-visual-design,
  stitch-design-taste and redesign-existing-projects. Use when: building a design system
  (tokens, design DNA JSON), designing a premium interface, upgrading an existing site/app
  to high-end standards, creating/evaluating design tokens and design systems.
---

# Design DNA

Consolidated design pack: extract + define + apply premium design.

Load these subskills from `reference/` (no context waste — read only when needed):

1. **`reference/design-dna.md`** — define design DNA across 3 dimensions: design system (tokens), design style
   (qualitative), visual effects (particles, textures, layout, shaders) → structured JSON/contract.
2. **`reference/high-end-visual-design.md`** — make interfaces feel expensive; fonts, spacing, shadows,
   card structures and animations that block mediocre defaults.
3. **`reference/stitch-design-taste.md`** — engineered `DESIGN.md` with strict typography, calibrated color,
   asymmetric layouts, micro-motion, performance budgets.
4. **`reference/redesign-existing-projects.md`** — audit existing design, remove generic/AI patterns,
   apply high-end standards without breaking functionality.

## Order of application

1. **Kickoff** — audit existing design token usage (CSS vars in `src/index.css`), flag hardcoded hex
   (this repo's D007 decision), and check visual identity (`VISUAL_IDENTITY.md`).
2. **Design system** — Load `reference/design-dna.md` + `reference/high-end-visual-design.md`: define tokens (color, spacing, radius, shadows, motion)
   as CSS vars and motion primitives (no GSAP unless justified — D008).
3. **Document** — if a DESIGN.md is needed, use `reference/stitch-design-taste.md` output format.
4. **Upgrade** — for existing apps, chain `reference/redesign-existing-projects.md` audit → apply changes in small commits.

## Rules

- This repo: the CSS tokens are the only color/spacing source (D007). Never add implied hex.
- Match the existing style of the project code (AGENTS.md §5).
- Keep changes minimal — do not refactor not asked.