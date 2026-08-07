---
name: threejs
description: Three.js 3D web development — scene setup, geometries, materials, lighting, textures, animation, loaders, shaders, post-processing, interaction, React Three Fiber, Drei, WebGPU, physics, and performance. Use for any 3D web work with Three.js, R3F, or WebGL.
---

# Three.js Skills

Comprehensive Three.js skill covering the full 3D web development stack. This skill aggregates multiple sub-skills for different aspects of Three.js development.

## Sub-skills Included

### Core (Foundation)
- **threejs-fundamentals** — Scene setup, cameras, renderer, Object3D hierarchy, coordinate systems, math utilities
- **threejs-geometry** — Built-in shapes, BufferGeometry, custom geometry, instancing, InstancedMesh
- **threejs-materials** — PBR materials, basic/phong/standard materials, shader materials, color management
- **threejs-math** — Vector3, Matrix4, Quaternion, Euler, Color, MathUtils

### Syntax (Building Blocks)
- **threejs-syntax-geometries** — 21 built-in geometries, BufferGeometry patterns, custom attributes
- **threejs-syntax-materials** — 15+ material types, PBR workflows, texture handling, color space rules
- **threejs-syntax-shaders** — ShaderMaterial, GLSL, uniforms, ShaderChunk, onBeforeCompile
- **threejs-syntax-loaders** — GLTFLoader, DRACOLoader, KTX2Loader, TextureLoader, LoadingManager
- **threejs-syntax-controls** — OrbitControls, MapControls, FlyControls, TransformControls

### Implementation (Feature Recipes)
- **threejs-impl-lighting** — 7 light types, IBL, PMREMGenerator, HDR environment maps, light helpers
- **threejs-impl-shadows** — Shadow maps, bias tuning, artifact diagnosis, PCF/PCFSoft/ESM
- **threejs-impl-animation** — AnimationMixer, crossfade, skeletal animation from GLTF, keyframe tracks
- **threejs-impl-post-processing** — EffectComposer, pmndrs/postprocessing, bloom, SSAO, FXAA, tone mapping
- **threejs-impl-physics** — cannon-es and Rapier integration with sync patterns, collision detection
- **threejs-impl-react-three-fiber** — R3F Canvas, hooks, JSX mapping, event system, useFrame, useThree
- **threejs-impl-drei** — 150+ Drei helper components: Html, ContactShadows, Environment, Effects, etc.
- **threejs-impl-webgpu** — WebGPURenderer, TSL, node materials, compute shaders, WebGPU nodes
- **threejs-impl-ifc-viewer** — IFC/BIM loading with web-ifc and @thatopen/components
- **threejs-impl-audio** — 3D spatial audio, AudioListener, PositionalAudio, AudioContext
- **threejs-impl-xr** — WebXR VR/AR, controllers, hand tracking, hit testing, XR session management

### Errors (Debugging)
- **threejs-errors-performance** — Memory leaks, dispose patterns, draw call optimization, InstancedMesh batching
- **threejs-errors-rendering** — Black screen, wrong colors, z-fighting, shadow artifacts, tone mapping issues

### Agents (Orchestration)
- **threejs-agents-scene-builder** — Decision trees for complete scene composition, asset pipeline
- **threejs-agents-model-optimizer** — GLTF optimization pipeline (Draco, KTX2, LOD, mesh simplification)

---

## Quick Start — Minimal Three.js Scene

```javascript
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);
scene.environment = new THREE.CubeTextureLoader().setPath("/env/").load(["px.png","nx.png","py.png","ny.png","pz.png","nz.png"]);

// Camera
const camera = new THREE.PerspectiveCamera(60, innerWidth/innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 4);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.5, 0);

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
scene.add(dirLight);

// Geometry + Material
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ 
  color: 0x00ff88, 
  roughness: 0.3, 
  metalness: 0.7 
});
const mesh = new THREE.Mesh(geometry, material);
mesh.castShadow = true;
mesh.receiveShadow = true;
scene.add(mesh);

// Ground
const groundGeo = new THREE.PlaneGeometry(20, 20);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  mesh.rotation.y += 0.005;
  renderer.render(scene, camera);
}
animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
```

---

## React Three Fiber Quick Start

```bash
npm install three @react-three/fiber @react-three/drei
```

```tsx
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { useRef } from "react";

function Cube() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });
  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#00ff88" roughness={0.3} metalness={0.7} />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas 
      shadows 
      camera={{ position: [0, 1.5, 4], fov: 60 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <color attach="background" args={["#111111"]} />
      <Environment preset="city" />
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 10, 7]} intensity={2} castShadow />
      <ContactShadows opacity={0.3} scale={5} />
      <OrbitControls enableDamping target={[0, 0.5, 0]} />
      <Cube />
    </Canvas>
  );
}
```

---

## Core Patterns Reference

### Scene Setup Essentials

```javascript
// Renderer - ALWAYS configure these
const renderer = new THREE.WebGLRenderer({ 
  antialias: true, 
  powerPreference: "high-performance",
  alpha: false  // true for transparent background
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Camera - perspective for 3D, orthographic for 2D/isometric
const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);

// Color management (r152+)
material.color.setSRGB(0xff0000); // Use SRGB for color inputs
texture.colorSpace = THREE.SRGBColorSpace; // For loaded textures

// Cleanup
geometry.dispose();
material.dispose();
texture.dispose();
renderer.dispose();
```

### InstancedMesh for Performance

```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
const count = 10000;

const mesh = new THREE.InstancedMesh(geometry, material, count);
const dummy = new THREE.Object3D();

for (let i = 0; i < count; i++) {
  dummy.position.set(
    (Math.random() - 0.5) * 100,
    Math.random() * 10,
    (Math.random() - 0.5) * 100
  );
  dummy.rotation.y = Math.random() * Math.PI;
  dummy.scale.setScalar(0.5 + Math.random() * 0.5);
  dummy.updateMatrix();
  mesh.setMatrixAt(i, dummy.matrix);
}
mesh.instanceMatrix.needsUpdate = true;
scene.add(mesh);
```

### GLTF Loading with DRACO

```javascript
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");
loader.setDRACOLoader(dracoLoader);

loader.load("/model.glb", (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(gltf.scene);
  
  // Play animations
  if (gltf.animations.length) {
    const mixer = new THREE.AnimationMixer(gltf.scene);
    gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
  }
});
```

### Post-Processing (pmndrs/postprocessing)

```bash
npm install postprocessing
```

```javascript
import { EffectComposer, EffectPass, RenderPass, BloomEffect, SSAOEffect } from "postprocessing";

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new BloomEffect({
  intensity: 1.5,
  mipmapBlur: true,
  luminanceThreshold: 0.8,
  luminanceSmoothing: 0.025,
});

const ssao = new SSAOEffect(camera, scene, {
  intensity: 3,
  radius: 0.5,
  distance: 10,
});

composer.addPass(new EffectPass(camera, bloom, ssao));

function animate() {
  requestAnimationFrame(animate);
  composer.render();
}
```

---

## R3F + Drei Essentials

```tsx
import { Canvas } from "@react-three/fiber";
import { 
  OrbitControls, 
  Environment, 
  ContactShadows,
  Html,
  Text,
  RoundedBox,
  MeshReflectorMaterial,
  GizmoHelper,
  Stats
} from "@react-three/drei";

// Common setup
<Canvas shadows gl={{ antialias: true }}>
  <Environment preset="studio" />
  <OrbitControls enableDamping />
  <ContactShadows />
  <Html center>HTML overlay content</Html>
  <RoundedBox args={[2, 1, 1]} radius={0.1}>
    <meshStandardMaterial color="#00ff88" />
  </RoundedBox>
  <GizmoHelper />
  <Stats />
</Canvas>
```

---

## Animation with R3F

```tsx
import { useFrame, useAnimations } from "@react-three/fiber";

function Model({ url }) {
  const { nodes, materials, animations } = useGLTF(url);
  const { actions } = useAnimations(animations, nodes);
  
  useEffect(() => {
    actions["Walk"].play();
  }, [actions]);
  
  return (
    <group>
      <mesh geometry={nodes.Body.geometry} material={nodes.Body.material} />
      {/* ... */}
    </group>
  );
}
```

---

## Performance Checklist

- [ ] Use `InstancedMesh` for repeated geometry
- [ ] Merge static geometries with `BufferGeometryUtils.mergeGeometries`
- [ ] Enable frustum culling (`mesh.frustumCulled = true`)
- [ ] Use LOD for distant objects
- [ ] Compress textures (KTX2/Basis) and use DRACO for geometry
- [ ] Limit shadow map resolution (1024-2048 typical)
- [ ] Dispose unused resources: `geometry.dispose()`, `material.dispose()`, `texture.dispose()`
- [ ] Use `renderer.info` to monitor draw calls, triangles, memory
- [ ] Prefer `transform` animations over geometry mutations

---

## Version Requirements

- **Three.js**: r160+ (current r160+)
- **React Three Fiber**: 8.x+
- **Drei**: Latest
- **Postprocessing**: Latest (pmndrs/postprocessing)
- **Physics**: cannon-es 0.20+ or Rapier 0.12+
- **WebGPU**: Experimental (Three.js WebGPURenderer)

---

## See Also

- `threejs-fundamentals` — Core scene setup
- `threejs-geometry` — Geometry creation
- `threejs-materials` — Material systems
- `threejs-impl-react-three-fiber` — R3F patterns
- `threejs-impl-drei` — Drei components
- `threejs-impl-post-processing` — Effects composer
- `threejs-impl-physics` — Physics integration
- `gsap` — For scroll-triggered 3D animations