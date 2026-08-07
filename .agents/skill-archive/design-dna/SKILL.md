---
name: design-dna
description: Extract, define, and apply design DNA across three dimensions: design system (tokens), design style (qualitative feel), and visual effects (Canvas, WebGL, 3D, particles, shaders, scroll effects, etc.). Use this skill when: (1) a user wants to see the full 3-dimension design structure/schema, (2) a user provides images, screenshots, or URLs of reference designs and wants them analyzed into a structured JSON profile covering all three dimensions, (3) a user has a Design DNA JSON and content and wants a design generated from it, or (4) any combination of these phases. Triggers on "design DNA", "extract design style", "analyze design", "design tokens from reference", "generate design from JSON", "design system from screenshot", "design profile", "style guide JSON", "visual effects analysis", "design with effects", "3d design analysis".
---

# Design DNA

A 3-phase workflow for extracting, structuring, and applying design identity across three dimensions:

1. **Design System** — measurable tokens (color, typography, spacing, layout, shape, elevation, motion, components)
2. **Design Style** — qualitative perception (mood, visual language, composition, imagery, interaction feel, brand voice)
3. **Visual Effects** — special rendering (Canvas, WebGL, 3D, particles, shaders, scroll effects, cursor effects, SVG animations, glassmorphism, etc.)

## Phases

### Phase 1: Structure — Output the Schema

When the user asks for the structural dimensions or schema:

1. Read [references/schema.md](references/schema.md)
2. Present the full schema with field descriptions
3. Explain the three dimensions and their roles:
   - **design_system**: What you can measure — exact hex values, pixel sizes, rem scales
   - **design_style**: What you can feel — mood, personality, composition strategy
   - **visual_effects**: What you can see but can't express in CSS alone — WebGL scenes, particle systems, shader distortions, scroll-driven animations
4. Ask if the user wants to customize or extend any dimensions

### Phase 2: Analyze — Extract DNA from References

When the user provides images, screenshots, or links representing a target design style:

1. Read [references/schema.md](references/schema.md) for the full field list
2. For each reference provided:
   - If image/screenshot: analyze visual properties directly
   - If URL: fetch and analyze the page's visual design
3. For every field in the schema, extract or infer a value from the references
4. When multiple references conflict, note the dominant pattern and mention variants
5. Output a complete Design DNA JSON — every field populated, no empty strings
6. After output, ask: "Want to adjust any values before using this for generation?"

**Analysis approach per dimension:**

#### Dimension 1: design_system
- **color**: Extract dominant palette via visual sampling. Primary by area dominance, secondary by supporting role, accent by CTA usage. Map neutral scale from lightest background to darkest text.
- **typography**: Identify font families by visual characteristics (geometric, humanist, serif class). Estimate scale ratios from heading/body size relationships.
- **spacing**: Assess density by element proximity. Measure rhythm by section gap consistency.
- **layout**: Identify grid by content alignment patterns. Note max-width, column count, asymmetry.
- **shape**: Measure border-radius by comparing to element height. Note border and divider presence.
- **elevation**: Classify shadow softness, spread, and layering approach.
- **motion**: If observable (video/interactive), note easing curves and duration feel.

#### Dimension 2: design_style
- Synthesize holistic impressions — mood, personality, composition strategy
- Compare against genre archetypes (SaaS, editorial, brutalist, etc.)
- Note ornamentation level and whitespace philosophy

#### Dimension 3: visual_effects
- **From code**: Scan for `<canvas>`, WebGL contexts, Three.js/Pixi.js imports, GSAP/Lottie usage, custom shaders, IntersectionObserver scroll triggers, SVG `<animate>` elements
- **From screenshots**: Describe visible effects that go beyond standard CSS — glowing particles, 3D object renders, noise textures, gradient animations, parallax depth, cursor trails, text distortions, glassmorphic surfaces. Note these in `composite_notes` when exact implementation can't be determined.
- **From video/interaction demos**: Note scroll behaviors, hover distortions, transition choreography, loading sequences
- Set `enabled: false` for any effect category not present in the reference
- Rate `overview.effect_intensity` and `overview.performance_tier` based on what's observed

### Phase 3: Generate — Apply DNA to Content

When the user provides DNA JSON + content to design:

1. Read [references/generation-guide.md](references/generation-guide.md)
2. Parse the DNA JSON and extract all tokens across three dimensions
3. Build CSS custom properties from `design_system` values
4. Apply `design_style` qualitative fields to guide subjective design decisions
5. When the design needs assets or source materials, fetch them from the original source whenever possible. If the user provided a URL, retrieve the real asset from that URL instead of recreating, approximating, or substituting it.
6. Implement `visual_effects` using appropriate technologies:
   - Lightweight effects → CSS animations, SVG, vanilla JS
   - Medium effects → Canvas 2D, GSAP, Lottie
   - Heavy effects → Three.js, custom GLSL shaders, Pixi.js
7. Generate the design output (default: self-contained HTML with inline CSS/JS)
8. Run quality checks from the generation guide

**If the user provides only content without DNA JSON**, ask whether to:
- Analyze a reference first (go to Phase 2)
- Use a described style (extract DNA from description, then generate)

## Phase Combinations

Users may invoke any combination:
- **Phase 1 only**: "Show me the design structure/schema"
- **Phase 2 only**: "Analyze this design" (with images/links)
- **Phase 2 → 3**: "Analyze this design and build me a landing page in the same style"
- **Phase 1 → 2 → 3**: Full pipeline
- **Phase 3 only**: User already has DNA JSON

Detect which phase(s) are needed from context and execute accordingly.

---

## Design DNA Schema (Summary)

```json
{
  "meta": {
    "version": "1.0",
    "source": "reference URLs or descriptions",
    "analyzed_at": "ISO timestamp",
    "analyzer": "design-dna skill"
  },
  "design_system": {
    "color": {
      "primary": { "hex": "#0066FF", "role": "brand", "usage": ["cta", "links", "focus"] },
      "secondary": { "hex": "#6366F1", "role": "support" },
      "accent": { "hex": "#F59E0B", "role": "highlight", "usage": ["badge", "notification"] },
      "neutral": {
        "scale": { "50": "#F8FAFC", "100": "#F1F5F9", ..., "900": "#0F172A", "950": "#020617" },
        "background": "#FFFFFF",
        "surface": "#F8FAFC",
        "border": "#E2E8F0",
        "text_primary": "#0F172A",
        "text_secondary": "#475569",
        "text_muted": "#94A3B8"
      },
      "semantic": {
        "success": "#10B981",
        "warning": "#F59E0B",
        "error": "#EF4444",
        "info": "#3B82F6"
      },
      "dark_mode": { /* same structure for dark */ }
    },
    "typography": {
      "font_families": {
        "heading": { "name": "Inter", "weights": [400, 500, 600, 700], "source": "google" },
        "body": { "name": "Inter", "weights": [400, 500, 600], "source": "google" },
        "mono": { "name": "JetBrains Mono", "weights": [400, 500], "source": "google" }
      },
      "scale": {
        "ratio": 1.25,
        "base_size": "1rem",
        "steps": { "xs": "0.75rem", "sm": "0.875rem", "base": "1rem", "lg": "1.125rem", "xl": "1.25rem", "2xl": "1.5rem", "3xl": "1.875rem", "4xl": "2.25rem", "5xl": "3rem", "6xl": "3.75rem" }
      },
      "line_height": { "tight": 1.1, "normal": 1.5, "relaxed": 1.75 },
      "letter_spacing": { "tight": "-0.02em", "normal": "0", "wide": "0.02em" }
    },
    "spacing": {
      "base_unit": "0.25rem",
      "scale": [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128],
      "section_gap": { "mobile": "3rem", "desktop": "6rem" },
      "container_padding": { "mobile": "1rem", "tablet": "1.5rem", "desktop": "2rem" }
    },
    "layout": {
      "max_width": "80rem",
      "grid_columns": 12,
      "gutter": "1.5rem",
      "breakpoints": { "sm": "640px", "md": "768px", "lg": "1024px", "xl": "1280px", "2xl": "1536px" },
      "asymmetry_factor": 0.3
    },
    "shape": {
      "border_radius": { "none": "0", "sm": "0.125rem", "md": "0.375rem", "lg": "0.5rem", "xl": "0.75rem", "2xl": "1rem", "full": "9999px" },
      "border_width": { "thin": "1px", "normal": "2px", "thick": "4px" },
      "divider_style": "solid"
    },
    "elevation": {
      "levels": {
        "0": "none",
        "1": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "2": "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        "3": "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "4": "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)"
      },
      "shadow_color": "rgb(0 0 0 / 0.1)",
      "shadow_tint": "none"
    },
    "motion": {
      "duration_scale": { "fast": "100ms", "normal": "200ms", "slow": "300ms", "slower": "500ms" },
      "easing": { "ease_out": "cubic-bezier(0.16, 1, 0.3, 1)", "ease_in_out": "cubic-bezier(0.65, 0, 0.35, 1)", "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      "stagger": { "list": "60ms", "grid": "30ms" },
      "reduced_motion": "respect_prefers_reduced_motion"
    },
    "components": {
      "button": { "height": "2.5rem", "padding_x": "1.5rem", "radius": "md", "font_weight": 500 },
      "input": { "height": "2.5rem", "padding_x": "1rem", "radius": "md", "border_width": "thin" },
      "card": { "padding": "1.5rem", "radius": "lg", "elevation": 1 },
      "badge": { "height": "1.25rem", "padding_x": "0.5rem", "radius": "full", "font_size": "xs" }
    }
  },
  "design_style": {
    "mood_keywords": ["clean", "modern", "trustworthy", "precise", "calm"],
    "personality": "Professional yet approachable. Precision without coldness.",
    "visual_language": "Minimal UI with purposeful accent color. Generous whitespace. Clear hierarchy.",
    "composition": "Centered hero, left-aligned content sections, asymmetric feature grids.",
    "imagery_style": "Product photography on neutral backgrounds. Abstract 3D illustrations for concepts.",
    "iconography": "Outlined, 2px stroke weight, consistent corner radius.",
    "interaction_feel": "Snappy, responsive, purposeful. Micro-interactions on all interactive elements.",
    "brand_voice": "Clear, concise, confident. Technical but accessible.",
    "ornamentation_level": "low",
    "whitespace_philosophy": "Whitespace as active design element, not empty space."
  },
  "visual_effects": {
    "overview": {
      "enabled": true,
      "effect_intensity": "low",
      "performance_tier": "lightweight",
      "composite_notes": "Subtle scroll reveals, hover state transitions. No WebGL or Canvas effects."
    },
    "particles": { "enabled": false },
    "webgl_3d": { "enabled": false },
    "shaders": { "enabled": false },
    "canvas_2d": { "enabled": false },
    "scroll_effects": {
      "enabled": true,
      "types": ["reveal", "parallax_subtle"],
      "library": "IntersectionObserver or GSAP ScrollTrigger",
      "performance_notes": "CSS-driven where possible"
    },
    "cursor_effects": { "enabled": false },
    "svg_animation": { "enabled": true, "types": ["icon_hover", "loader"] },
    "glassmorphism": { "enabled": false },
    "text_effects": { "enabled": false },
    "background_effects": { "enabled": false },
    "page_transitions": { "enabled": false },
    "loading_states": { "enabled": true, "type": "skeleton" }
  }
}
```

---

## Usage Examples

### Extract DNA from a Reference Site
```
/design-dna Analyze the design of https://linear.app and extract the Design DNA
```

### Generate a Page from DNA
```
/design-dna Using the Design DNA from linear.app, build me a pricing page for a SaaS product
```

### Get the Schema
```
/design-dna Show me the full Design DNA schema structure
```

---

## Installation

```bash
# Via skills CLI
npx skills add zanwei/design-dna -a opencode -g -y

# Or manually
git clone https://github.com/zanwei/design-dna.git .agents/skills/design-dna
```

---

## See Also

- `motion-principles` — Timing, easing, animation fundamentals
- `gsap` — For scroll-driven and complex animations
- `threejs` — For 3D visual effects
- `genjutsu` — For complete design system generation