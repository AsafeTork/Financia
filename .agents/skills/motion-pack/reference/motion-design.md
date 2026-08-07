---
name: motion-design
description: Motion design fundamentals, engines, and brand elements — timing, typography, color, composition, After Effects, Remotion, logos, and backgrounds. Tech-agnostic foundation for deciding how something should move. Triggers on "make this animation feel natural", "fix motion that feels stiff/floaty/cheap", "my animation looks robotic", "choose an easing curve", "how do I use the Graph Editor", "add overshoot or bounce", "Easy Ease isn't enough", "make snappy motion", "pick a duration for this transition", "stagger a list animation", "sync animation to a beat", or "review motion for good timing".
---

# Motion Design

Motion design fundamentals, engines, and brand elements as installable skills for AI coding agents — timing, typography, color, composition, After Effects, Remotion, logos, and backgrounds.

## Sub-skills Included

### Foundation
- **animation-principles** — Tech-agnostic timing, easing, and the 12 principles for natural-feeling motion
- **color-motion** — Palettes, gradients, perceptual interpolation (OKLCH/Lab), grading, and render color management
- **shot-composition** — Grids, safe areas, focal hierarchy, and 2D/3D camera framing across aspect ratios
- **motion-art-direction** — Senior creative direction — motion language, tone, pacing, hierarchy, and restraint

### Engines & Tools
- **after-effects** — AE expressions, rigging, export recipes, performance triage, and project hygiene
- **beat-sync-editing** — Cut to the beat — editing rhythm, transitions, retiming, and speed ramps
- **remotion-video** — Programmatic, data-driven video in React rendered to MP4/GIF via CLI or renderer

### Brand Elements
- **logo-animation** — Logo reveals, stingers, splash screens, and loaders for web, video, and app
- **motion-background** — Mesh gradients, shader auroras, particle constellations, and subtle looping backgrounds

---

## Quick Start — Animation Principles

When motion feels stiff, floaty, mechanical, robotic, or cheap and needs diagnosis. Choosing a clip or transition's duration, easing curve, and stagger offset.

### Three Pillars — Settle These Before Any Number

| Pillar | The Question | What It Drives |
|--------|--------------|----------------|
| **Emotional Intent** | What should the viewer *feel*? (joy, calm, urgency, trust, elegance) | Easing, duration, amplitude/overshoot |
| **Visual Narrative** | What's the micro-story? Setup → action → resolution | Sequencing, staging, what enters when |
| **Motion Craft** | How do we make it believable? | Physics, secondary motion, arcs, follow-through |

### Three Motion Layers — Depth, Not Flatness

- **Primary** — the main action the eye follows (the hero move)
- **Secondary** — supporting richness reacting to the primary (a shadow shifting, an icon nudging, a label settling late)
- **Ambient** — background life that never demands attention (slow gradient drift, a low-contrast pulse)

---

## Core Principles

### Easing Is the Single Biggest Lever

Linear motion reads as robotic. Reserve `linear` for continuous loops (spinners, marquees, infinite scroll) only. Everything an eye perceives as a discrete event needs acceleration.

Match the curve to the action:
- **Enter / appear** → ease-out (fast start, gentle settle). `cubic-bezier(0.16, 1, 0.3, 1)`
- **Exit / disappear** → ease-in (gentle start, fast end). `cubic-bezier(0.7, 0, 0.84, 0)`
- **Move / reposition (stays on screen)** → ease-in-out (symmetric). `cubic-bezier(0.65, 0, 0.35, 1)`
- **Playful / branded** → slight overshoot. `cubic-bezier(0.34, 1.56, 0.64, 1)`

Rule of thumb: the eye forgives a slow start far less than a slow end. When in doubt, decelerate into rest.

### Timing Communicates Weight and Importance

| Element | Duration |
|---------|----------|
| Micro-interaction (hover, toggle, tap feedback) | 100-200ms |
| UI transition (panel, modal, page region) | 200-400ms |
| Hero / large element / full-screen | 400-800ms |
| Cinematic camera move | 800-2000ms |

Distance and size scale duration. A small icon moving 20px and a full-bleed panel moving 800px should NOT share a duration — the panel needs more time or it looks weightless.

### Spacing and Stagger Create Rhythm

Never reveal a list, grid, or group all at once — it reads as a single flat event. Stagger each child's start.

- Lists / sequential items: **40-80ms** between items
- Dense grids: **20-40ms** (more items, less per-item delay)
- Cap total reveal at roughly **600-800ms** for a group
- Stagger direction should follow the eye: top-to-bottom, or radiating from a focal point

### The 1/3 Rule (Two Forms, Both Universal)

- **Distance** — no element travels more than ~1/3 of the screen without an intermediate keyframe or a scale/opacity change
- **Simultaneity** — with 3+ elements, keep no more than ~1/3 in active motion at once

### Anticipation and Follow-Through Sell Physical Motion

- **Anticipation**: a tiny counter-move before the main action (a button dips `scale 0.95` before popping). 60-120ms is enough.
- **Follow-through / overlapping action**: trailing parts keep moving after the main body stops. Stagger the settle of attached elements.
- **Arcs**: natural movement curves; pure straight-line translation of an organic object looks mechanical.

### Beat-Sync and Rhythm

When motion accompanies audio, land impact keyframes on the beat, not between beats. At 120 BPM a beat is 500ms; an eighth-note grid is 250ms.

### Spring vs. Duration-Based Motion

Springs (mass / stiffness / damping) self-determine duration and feel more physical for interactive, interruptible motion. Duration+easing is better for choreographed, timeline-locked sequences.

A snappy default spring: `stiffness 300, damping 30, mass 1`

---

## Diagnosing Common Failures

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Feels stiff/robotic | Using `linear` or symmetric easing on an enter | Switch to ease-out |
| Feels floaty/sluggish | Duration too long or ease-out too gentle | Cut duration 30%, sharpen the curve |
| Feels cheap/janky | Everything appears at once (no stagger) | Add stagger, vary durations by size |
| Feels mechanical despite easing | No anticipation, no follow-through, straight-line paths | Add arcs and overlap |

---

## Quick Reference

| Need | Use |
|------|-----|
| Enter | `cubic-bezier(0.16, 1, 0.3, 1)`, 300-500ms |
| Exit | `cubic-bezier(0.7, 0, 0.84, 0)`, 200-300ms |
| Move | `cubic-bezier(0.65, 0, 0.35, 1)`, 300-400ms |
| Branded pop | `cubic-bezier(0.34, 1.56, 0.64, 1)`, 400-600ms |
| List stagger | 40-80ms per item, cap ~700ms total |
| Loop only | `linear` |

---

## Spring Configs (Framer Motion / react-spring / iOS)

```javascript
// Snappy UI spring
{ stiffness: 300, damping: 30, mass: 1 }

// Gentle spring
{ stiffness: 180, damping: 20, mass: 1 }

// Bouncy spring
{ stiffness: 280, damping: 14, mass: 1 }

// iOS .smooth equivalent
{ stiffness: 170, damping: 22, mass: 1 }

// iOS .snappy equivalent  
{ stiffness: 290, damping: 26, mass: 1 }

// iOS .bouncy equivalent
{ stiffness: 250, damping: 12, mass: 1 }
```

---

## CSS Easing Reference

```css
/* Enter - ease-out */
transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);

/* Exit - ease-in */
transition-timing-function: cubic-bezier(0.7, 0, 0.84, 0);

/* Move - ease-in-out */
transition-timing-function: cubic-bezier(0.65, 0, 0.35, 1);

/* Branded pop - overshoot */
transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);

/* Linear - loops only */
transition-timing-function: linear;
```

---

## GSAP Easing Reference

```javascript
// Enter
ease: "power2.out"  // or "power3.out" for snappier

// Exit  
ease: "power2.in"

// Move
ease: "power2.inOut"

// Branded pop
ease: "back.out(1.7)"

// Elastic
ease: "elastic.out(1, 0.3)"

// Custom cubic-bezier
ease: CustomEase.create("custom", "0.16, 1, 0.3, 1")
```

---

## Framer Motion Reference

```tsx
// Enter
<motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ type: "spring", stiffness: 300, damping: 30 }}
/>

// Stagger
<motion.ul>
  {items.map((item, i) => (
    <motion.li 
      key={item}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.06 }}
    />
  ))}
</motion.ul>

// Scroll reveal
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
/>
```

---

## Reduced Motion (Mandatory)

**Any motion MUST honor `prefers-reduced-motion`.** This is non-negotiable.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```javascript
// GSAP
gsap.matchMedia().add("(prefers-reduced-motion: reduce)", () => {
  gsap.defaults({ duration: 0 });
});

// Framer Motion
import { useReducedMotion } from "motion/react";

function Component() {
  const reduce = useReducedMotion();
  return (
    <motion.div
      animate={reduce ? {} : { x: 100 }}
      transition={reduce ? { duration: 0 } : { duration: 0.5 }}
    />
  );
}
```

---

## Performance

- ✅ Animate ONLY `transform` and `opacity`
- ✅ Use `will-change: transform` sparingly — only on elements that will actually animate
- ✅ Avoid animating `width`, `height`, `top`, `left`, `margin`, `padding`
- ✅ Use `transform: translate3d(0,0,0)` or `translateZ(0)` to promote to GPU layer
- ✅ Keep animated elements out of layout flow when possible

---

## Installation

```bash
# Via skills CLI
npx skills add iart-ai/motion-design-skills -a opencode -g -y

# Or manually
git clone https://github.com/iart-ai/motion-design-skills.git .agents/skills/motion-design
```

---

## See Also

- `gsap` — GSAP implementation for web
- `threejs` — For 3D motion and WebGL effects
- `genjutsu` — For complete motion design pipelines
- `animation-principles` — The foundation sub-skill