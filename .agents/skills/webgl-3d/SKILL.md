---
name: webgl-3d
description: |
  Three.js / WebGL 3D work. Use when: 3D scene setup, WebGL, three.js, geometries, materials,
  lighting, textures, animation, loaders, shaders, post-processing, particle systems,
  React Three Fiber, Drei, WebGPU, physics in Web. Consolidates threejs as the single source
  for 3D in this project.
---

# WebGL 3D

Three.js & 3D-for-the-web with React integration.

Load the guide from `reference/threejs.md` — the authoritative reference covering scene
setup, geometries, materials, lighting, textures, animation, loaders, shaders, post-processing,
interaction, React Three Fiber, Drei, WebGPU, physics, and performance.

## Usage

- For any 3D/WebGL work in this repo (Web), read `reference/threejs.md` and follow its structure.
- Keep 3D confined to features/areas that need it; do not pull Three.js into unrelated views
  (bundle-size awareness — lazy-load the 3D chunk with React.lazy).
- Performance: dispose geometries/materials on unmount, cap pixelRatio, prefer instanced /
  merged meshes for repeated objects.

## Rules

- R3F + Drei are the idiomatic React integration; vanilla three only in plain modules.
- Respect `prefers-reduced-motion`: heavy animation can be gated.