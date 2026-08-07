---
name: visual-generation
description: |
  Image/reference generation dock for design assets. Use when: creating brand-kit boards, logo
  systems, identity decks, marketing/landing images, mobile app screen concepts, or any visual
  reference image for the UI. Consolidates brandkit, imagegen-frontend-web and
  imagegen-frontend-mobile.
---

# Visual Generation

Produce high-quality art-directed images for brand, web and mobile.

Load the right guide from `reference/` depending on the target:

1. **`reference/brandkit.md`** — brand identity decks: logo systems, brand-guidelines boards, identity decks,
   visual world presentations. Minimalist/cinematic/editorial/tech luxury directions.
2. **`reference/imagegen-frontend-web.md`** — ONE separate horizontal image per section (never compress
   multiple sections into one), composition variety, varied CTAs/hero scales, consistent palette.
3. **`reference/imagegen-frontend-mobile.md`** — app-native screen concepts: clean hierarchy, readable text,
   multi-screen consistency, phone mockup framing preferred.

## Rules of the pack

- Only *direction generation* — these produce image prompts/specs for a separate image model; they
  don't write the web code themselves. For implementation use `frontend-craft` or `webgl-3d`.
- Follow the target device art direction (web: horizontal section images; mobile: canonical screen
  sizing inside phone mockup; brand: systems boards with logo/symbol/us stacks).
- Palette consistency across the generated set; use the repo identity vars from VISUAL_IDENTITY.md.