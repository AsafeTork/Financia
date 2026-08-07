---
name: genjutsu
description: "Cast genjutsu on a UI - creative coding for motion, micro-interactions, and wow-factor. Scans the stack, proposes an interaction thesis, loads the right sub-skills, implements the illusion. Adapts to Web, Android (Compose), Apple (SwiftUI). Build complete visual universes with art direction, design systems, and audit pipelines."
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, WebSearch
---

# Genjutsu

The art of illusion. Cast motion. Paint signatures. Zero AI slop.

Creative coding skills for **opencode**, **Claude Code**, and **claude.ai** — transforms any interface from functional to exceptional through motion design, interaction patterns, and visual systems. Covers Web (React, Vue, Svelte, vanilla CSS, Three.js, Canvas), Android (Jetpack Compose, Compose Multiplatform), and Apple (SwiftUI iOS + macOS).

> **v3.0 - rebrand**: this plugin used to be called `creative-excellence`. The skills `/creative-excellence:creative-excellence` and `/creative-excellence:design-excellence` are now `/genjutsu:cast` and `/genjutsu:paint`.

---

## Two Orchestrators

### `/genjutsu:cast` - The Illusionist

Takes any creative request and makes it exceptional. Adapts to your stack and scope.

**Pipeline:** Scan stack → Evaluate scope → Propose interaction thesis → Load sub-skills → Implement → Mini-audit

- Detects your dependencies automatically across web (GSAP, Framer Motion, Three.js, CSS), Android (Jetpack Compose, Compose Multiplatform) and Apple (SwiftUI iOS / macOS)
- Proposes an **interaction thesis** before writing a single line of code
- Scales from a single hover effect to a full scroll-driven page or a Compose `SharedTransitionLayout` flow
- Runs a quick audit on exit: reduced-motion, exit animations, recomposition, hitches, layout performance

**When to use:**
- "Add a scroll animation to this section"
- "Make this dropdown feel snappy"
- "Add a snappy spring to this Compose button"
- "Polish the matchedGeometryEffect on this SwiftUI screen"

### `/genjutsu:paint` - The Master Painter

Builds a complete visual universe from scratch. Brainstorm first, implement second.

**Pipeline:** Brainstorm → Define visual + interaction thesis → Generate design system → Implement → Full audit

- Mandatory creative direction session before any code
- Generates a persistent stack-aware `MASTER.md` design system (Tailwind/CSS for web, `Theme.kt` for Compose, `Color+App.swift` for SwiftUI, `commonMain` for CMP)
- Full audit at the end: motion gaps, accessibility, color consistency, responsive, performance, native hitches
- Optional MCP integration (Stitch, Nano Banana, 21st.dev Magic)

**When to use:**
- "Redesign the entire landing page"
- "Build me a portfolio from scratch"
- "Build a SwiftUI iOS app design system from scratch"
- "Bootstrap a Compose Multiplatform design system"

---

## Sub-skills (15 Total)

### Foundation (Always Loaded)

| Sub-skill | Scope | Files |
|-----------|-------|-------|
| motion-principles | Timing, easing, cross-platform reduced-motion API, BAD/GOOD do-not rules | SKILL + 3 references |

### Shared Layers (Loaded by Context)

| Sub-skill | Scope | Files |
|-----------|-------|-------|
| mobile-principles | Touch targets, no-hover doctrine, thumb zones, safe areas, gestures, mobile perf budgets | SKILL + 2 references |
| desktop-principles | Hover-mandatory, pointer precision, keyboard shortcuts, multi-window, focus management | SKILL + 2 references |
| design-audit | Multi-stack greps (web/Compose/SwiftUI), bundle size, Layout Inspector, Instruments Hitches | SKILL |
| ui-ux-pro-max | Design system intelligence (50 styles, 21 palettes, 50 font pairings, 9 stacks) | SKILL + data + scripts |

### Web Stack

| Sub-skill | Scope | Files |
|-----------|-------|-------|
| gsap | Core, timeline, ScrollTrigger, plugins | SKILL + 4 references |
| framer-motion | AnimatePresence, layout, gestures, motion values | SKILL + 1 reference |
| css-native | Scroll-driven, View Transitions, @starting-style | SKILL + 1 reference |
| threejs-r3f | Three.js, React Three Fiber, shaders, postprocessing | SKILL + 2 references |
| canvas-generative | Particles, flow fields, noise, fractals, L-systems | SKILL + 1 reference |

### Android Stack

| Sub-skill | Scope | Files |
|-----------|-------|-------|
| compose-motion | animate*AsState, AnimatedVisibility, SharedTransitionLayout, springs, gestures | SKILL + 3 references |
| compose-graphics | M3 Expressive motion physics, AGSL shaders (Android 13+), Canvas/DrawScope | SKILL + 3 references |
| compose-multiplatform | KMP/CMP patterns, expect/actual, iOS/Android/Desktop interop | SKILL + 2 references |

### Apple Stack

| Sub-skill | Scope | Files |
|-----------|-------|-------|
| swiftui-motion | withAnimation, transitions, matchedGeometryEffect, PhaseAnimator, KeyframeAnimator, gestures | SKILL + 3 references |
| swiftui-graphics | Metal shaders (.colorEffect / .layerEffect / .distortionEffect), .visualEffect, Liquid Glass (iOS 26), Canvas | SKILL + 3 references |

---

## Quick Start

### For opencode / Claude Code

```bash
# Install the plugin
git clone https://github.com/AThevon/genjutsu.git .opencode/plugins/genjutsu
# or for Claude Code
git clone https://github.com/AThevon/genjutsu.git .claude/plugins/genjutsu

# The plugin structure:
genjutsu/
├── plugin.json
├── skills/
│   ├── cast/SKILL.md
│   ├── paint/SKILL.md
│   └── _jutsu/           # internal sub-skills
│       ├── motion-principles/
│       ├── mobile-principles/
│       ├── desktop-principles/
│       ├── design-audit/
│       ├── ui-ux-pro-max/
│       ├── gsap/
│       ├── framer-motion/
│       ├── css-native/
│       ├── threejs-r3f/
│       ├── canvas-generative/
│       ├── compose-motion/
│       ├── compose-graphics/
│       ├── compose-multiplatform/
│       ├── swiftui-motion/
│       └── swiftui-graphics/
```

### Usage in opencode

```bash
# Cast - for specific interactions
opencode run "Use genjutsu:cast to add a scroll-triggered parallax hero with GSAP"

# Paint - for complete redesigns
opencode run "Use genjutsu:paint to redesign the landing page with a dark neo-brutalist theme"
```

### Usage in Claude Code

```bash
# Cast
/genjutsu:cast Add a magnetic hover effect to the CTA buttons

# Paint
/genjutsu:paint Build a complete design system for a fintech dashboard
```

---

## Pipeline Overview (Cast)

### 1. SCAN — Detect the Stack

```bash
# Web
cat package.json | grep -E '"(gsap|framer-motion|three|@react-three|animejs|lenis)"'

# Android/Compose
ls build.gradle.kts 2>/dev/null && grep androidx.compose build.gradle.kts

# Apple/SwiftUI
ls *.xcodeproj *.xcworkspace Package.swift 2>/dev/null
grep -l 'import SwiftUI' -r --include="*.swift" .

# Mobile context
grep -r 'viewport.*width=device-width' --include='*.html' --include='*.css' .
```

### 2. DISCOVER — Understand Intent (When Vague)

One question at a time. Never bundle.

### 3. SCOPE — Evaluate Request

| Scope | Description | Sub-skills | Variants |
|-------|-------------|------------|----------|
| Light | Isolated component | 1-2 max | No |
| Medium | Page or section | 2-3 | 2-3 variants |
| Full | Complete app | Full pipeline | 2-3 variants |

### 4. THESIS — One Sentence Before Coding

Examples:
- "This dropdown will use 150ms CSS micro-transitions with slide+fade for a snappy feel"
- "This hero will combine GSAP parallax on scroll with staggered text reveals for cinematic impact"
- "This Compose hero will use SharedTransitionLayout with spring(stiffness=Medium, dampingRatio=0.85)"

**First visual gate:** Offer preview menu, present thesis, wait for validation.

### 5. LOAD — Load Relevant Sub-skills

```bash
# Always load
load_skill motion-principles

# Context layers
load_skill mobile-principles    # if mobile context
load_skill desktop-principles   # if desktop context
load_skill design-audit         # if scope=full
load_skill ui-ux-pro-max        # if advanced UX questions

# Stack-specific
load_skill gsap                 # if GSAP detected
load_skill framer-motion        # if Framer Motion detected
load_skill css-native           # if no animation lib
load_skill threejs-r3f          # if Three.js/R3F detected
load_skill compose-motion       # if Android Compose
load_skill swiftui-motion       # if SwiftUI
# ... etc
```

### 6. IMPLEMENT — Code While Respecting Loaded Principles

### 7. AUDIT — Verification Before Delivery

---

## Pipeline Overview (Paint)

### Phase 1: BRAINSTORM (Mandatory, Never Skip)

Five domains, one question at a time:
1. **Product** — What is it?
2. **Audience** — Who uses it?
3. **Mood** — 3-5 adjectives for visual feel
4. **References** — Sites, screenshots, mood boards
5. **Tech stack** — What's in place?

### Phase 2: THESIS (Define Direction, Get Validation)

**Visual Thesis** — Must address: color direction, typography spirit, spacing philosophy, component style
**Interaction Thesis** — Must address: timing range, hover behavior, scroll behavior, forbidden patterns

Both validated via preview gate.

### Phase 3: DESIGN SYSTEM

Load `ui-ux-pro-max`, generate stack-aware tokens:

| Stack | Output |
|-------|--------|
| Web | Tailwind config / CSS variables |
| Android Compose | `Theme.kt`, `Color.kt`, `Type.kt`, `Shapes.kt`, `Motion.kt` |
| SwiftUI | `Color+App.swift`, `Font+App.swift`, `Animation+App.swift`, `Shape+App.swift` |
| Compose Multiplatform | Kotlin tokens in `commonMain` with `expect/actual` |

Create `MASTER.md` at project root — single source of truth.

### Phase 4: IMPLEMENT

Page by page, validate page by page. Every token from MASTER.md. Every animation respects interaction thesis.

### Phase 5: AUDIT (Never Skip)

Load `design-audit`, run full checklist for detected stack.

---

## Iron Rules

1. **Never code without a validated interaction thesis**
2. **One question at a time during discovery/brainstorm**
3. **Reject generic/AI slop** — No rainbow gradients, gratuitous glassmorphism, "modern and sleek"
4. **Never install a dependency without asking**
5. **Match complexity to scope** — Hover effect ≠ GSAP + ScrollTrigger pipeline
6. **Always prioritize performance** — 60fps or nothing
6. **Stack with no animation lib** → prefer native APIs
7. **Animation lib detected** → respect the dev's choice
8. **Show, don't just describe** — Preview gate at first visual decision
9. **The preview is throwaway** — Never port preview markup to implementation
10. **Audit is not optional** — Phase 5 always runs

---

## Preview Gate (Shared)

Before first visual gate, ask once how they want to see it:

> **A. Artifact** — Live page with real easing curves, replay button, reduced-motion toggle
> **B. Live preview** — Throwaway route in project, real stack, `@Preview` / `#Preview` scratch file  
> **C. Inline** — Written in conversation

**Default by situation:**
| Situation | Default |
|-----------|---------|
| Light scope (hover, one transition) | C - inline |
| Medium/full, web stack | A - artifact |
| Medium/full, Compose/SwiftUI | B - live preview |
| Full design system | A - artifact |

Choice sticks for session. Announce mode each gate: "Variants in artifact."

---

## Installation

```bash
# opencode
git clone https://github.com/AThevon/genjutsu.git .opencode/plugins/genjutsu

# Claude Code
git clone https://github.com/AThevon/genjutsu.git .claude/plugins/genjutsu

# claude.ai
# Download genjutsu-all.zip from releases, extract, upload each sub-folder as separate skill
```

---

## Quick Decision Tree

```
Request received
  |
  +- SCAN: what stack?
  |
  +- DISCOVER: vague? → ask (one at a time) | clear? → skip
  |
  +- SCOPE: light / medium / full?
  |
  +- PREVIEW: how to see? (asked once, sticks)
  |
  +- THESIS: one sentence, validate via preview
  |     +- Rejected? → adjust
  |
  +- LOAD: motion-principles + context + stack skills
  |
  +- IMPLEMENT: code (variants if medium/full, preview before coding)
  |
  +- AUDIT: motion, a11y, consistency, performance
```

---

## Red Flags — You're About to Violate This Skill

| Thought | Reality |
|---------|---------|
| "I'll just start coding, request is clear" | Did you write a thesis? Did user validate it? |
| "I'll ask all questions at once" | One at a time. Second depends on first. |
| "This needs GSAP + ScrollTrigger + Lenis" | Check scope. Is this actually Full? |
| "I'll make it pop with glassmorphism" | Is that the thesis, or AI slop default? |
| "User seems impatient, skip discovery" | Bad thesis costs more than two questions. |
| "I'll add extra animations while at it" | Scope creep. Stick to thesis. |
| "Thesis sentence is clear, I'll code" | A sentence can't carry an easing curve. Preview first. |
| "I'll ask again how to see variants" | Asked once, sticks. Announce mode and go. |
| "Preview looks great, I'll port it" | Preview is throwaway. Build from thesis + sub-skills. |

---

## See Also

- `motion-principles` — Foundation timing/easing/craft
- `gsap` — Web animation implementation
- `threejs` — 3D/WebGL effects
- `design-dna` — Design system extraction
- `motion-design` — Motion fundamentals