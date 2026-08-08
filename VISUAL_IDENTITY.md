# Financia — Visual Identity Package

**Versão:** 1.0  
**Status:** APPROVED  
**Data:** 2026-08-04  
**Source of Truth:** Este documento é a referência oficial para todas as decisões visuais.

---

## 1. Logo System

### 1.1 Logo Principal (Horizontal)
- **Composição:** Símbolo + Wordmark "Financia" à direita
- **Uso:** Headers, landing pages, documentos oficiais
- **Clear space:** Mínimo 1x altura do símbolo em todos os lados
- **Tamanho mínimo:** 120px largura total (web), 25mm (print)

### 1.2 Símbolo Isolado
- **Uso:** Favicon, app icon, avatar, watermark, espaços reduzidos
- **Formatos:** SVG (master), PNG 512x512, 192x192, 32x32
- **Variações:** Full color, White, Navy, Monocromático

### 1.3 Logo por Plano (Brand Studio)
| Plano | Primary | Secondary | Accent |
|-------|---------|-----------|--------|
| Free | `#0F3D3E` | `#CCFBF1` | `#0D9488` |
| Pro | `#2563EB` | `#E0E7FF` | `#4F46E5` |
| Premium | `#0F172A` | `#FEF3C7` | `#D4AF6A` |
| White-label | Custom | Custom | Custom |

---

## 2. Color System

### 2.1 Core Palette (Base da Marca)
| Token | Hex/OKLCH | HSL | Uso | CSS Variable |
|-------|-----------|-----|-----|--------------|
| **Navy** | `#002F59` / `oklch(0.29 0.05 206)` | 208° 100% 17% | Primary brand, headers, primary buttons | `--brand` |
| **Teal** | `#1A6B5C` | 169° 61% 26% | Accent, highlights, secondary actions | `--brand-accent` |
| **Green** | `#3BBFA0` | 160° 52% 49% | Success (decorative) | `--green` |
| **Light Teal** | `#6EC6C8` | 181° 45% 61% | Secondary UI, hover states, borders | `--brand-secondary` |
| **Off White** | `#F5F5F0` | 60° 16% 95% | Page background (light mode) | `--bg-page` |

### 2.2 Semantic Colors (Light Mode)
| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-page` | `var(--n-50)` = `oklch(0.985 0.004 206)` | Page canvas |
| `--bg-card` | `oklch(1 0 0)` | Cards, modais, inputs |
| `--bg-input` | `oklch(1 0 0)` | Input backgrounds |
| `--bg-subtle` | `var(--n-100)` = `oklch(0.965 0.006 206)` | Subtle backgrounds, hover |
| `--text-main` | `var(--n-800)` = `oklch(0.29 0.05 206)` | Primary text |
| `--text-sub` | `var(--n-600)` = `oklch(0.51 0.04 206)` | Secondary text |
| `--text-muted` | `#5F7086` | Muted, captions |
| `--border` | `var(--n-200)` = `oklch(0.93 0.010 206)` | Default borders |
| `--border-md` | `oklch(0.9 0.012 206)` | Medium emphasis borders |
| `--shadow-surface` | `color-mix(in srgb, var(--brand-tinted) 30%, transparent)` | Cards |
| `--shadow-hover` | `color-mix(in srgb, var(--brand-tinted) 45%, transparent)` | Hover/surface |
| `--shadow-overlay` | `color-mix(in srgb, var(--brand-tinted) 55%, transparent)` | Overlay |
| `--shadow-modal` | `color-mix(in srgb, var(--brand-tinted) 65%, transparent)` | Modais |

### 2.3 Dark Mode ( `[data-theme="dark"]` )
| Token | Valor | Nota |
|-------|-------|------|
| `--bg-page` | `oklch(0.13 0.02 206)` | |
| `--bg-card` | `oklch(0.18 0.02 206)` | |
| `--bg-input` | `oklch(0.18 0.02 206)` | |
| `--bg-subtle` | `oklch(0.15 0.02 206)` | |
| `--text-main` | `var(--n-50)` = `oklch(0.985 0.004 206)` | |
| `--text-sub` | `var(--n-100)` = `oklch(0.965 0.006 206)` | |
| `--text-muted` | `oklch(0.60 0.03 206)` | |
| `--border` | `oklch(0.26 0.02 206)` | |
| `--border-md` | `oklch(0.32 0.02 206)` | |
| `--shadow-surface` | `0 1px 2px rgba(0,0,0,0.4)` | |
| `--shadow-hover` | `0 4px 16px rgba(0,0,0,0.5)` | |
| `--shadow-overlay` | `0 8px 30px rgba(0,0,0,0.6)` | |
| `--shadow-modal` | `0 16px 48px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.5)` | |

### 2.4 Plan Variants ( `[data-plan="pro"]`, `[data-plan="premium"]` )
```css
/* Pro - Blue theme */
[data-plan="pro"] {
  --brand: #2563EB;
  --brand-secondary: #60A5FA;
  --brand-accent: #4F46E5;
  --plan-badge: #2563EB;
  --plan-badge-bg: rgba(37,99,235,0.10);
  --btn-grad: linear-gradient(135deg, #2563EB 0%, #4F46E5 100%);
}

/* Premium - Gold/Dark theme */
[data-plan="premium"] {
  --brand: #0F172A;
  --brand-secondary: #FEF3C7;
  --brand-accent: #D4AF6A;
  --plan-badge: #D4AF6A;
  --plan-badge-bg: rgba(212,175,106,0.12);
  --btn-grad: linear-gradient(135deg, #1A1A2E 0%, #0F172A 100%);
}
```

---

## 3. Typography System

### 3.1 Font Families
| Role | Font | Weights | CSS Variable |
|------|------|---------|--------------|
| **Display / Headlines** | **Montserrat** | 600, 700, 800 | `--font-heading: 'Montserrat', sans-serif` |
| **UI / Body / Subtitles** | **Inter** | 400, 500, 600 | `--font-body: 'Inter', system-ui, sans-serif` |
| **Mono / Numbers** | **JetBrains Mono** | 400, 500 | `--font-mono: 'JetBrains Mono', monospace` |

### 3.2 Type Scale (Fluid, ratio 1.25, Utopia-based)
| Token | Valor | Uso |
|-------|-------|-----|
| `--fs-5` = `--text-display` | `clamp(2.5rem, 1.5rem + 5vw, 4rem)` | Hero H1 |
| `--fs-4` = `--text-h1` | `clamp(1.75rem, 1.31rem + 1.38vw, 2.5rem)` | Page titles |
| `--fs-3` = `--text-h2` / `--text-h3` | `clamp(1.375rem, 1.19rem + 0.63vw, 1.75rem)` | Section/Sub headers |
| `--fs-2` = `--text-h4` | `clamp(1.125rem, 1rem + 0.42vw, 1.375rem)` | Card titles |
| `--fs-1` = `--text-lg` | `clamp(1rem, 0.94rem + 0.21vw, 1.125rem)` | Large body |
| `--fs-0` = `--text-base` | `1rem` | Body text |
| `--text-sm` | `0.875rem` | Secondary text |
| `--text-xs` | `0.75rem` | Captions |
| `--text-xs-tight` | `0.6875rem` | Badges |
| `--text-xs` | `0.75rem` | `0.75rem` | 1.5 | 0.01em | Captions, labels |
| `--text-xs-tight` | `0.6875rem` | `0.6875rem` | 1.4 | 0.02em | Badges, chips |

### 3.3 Hierarchy Rules
1. **Título Principal** → Montserrat Bold (700), `--text-h1` ou `--text-display`
2. **Subtítulo de Apoio** → Inter Medium (500), `--text-lg` ou `--text-base`, cor `--text-sub`
3. **Corpo de Texto** → Inter Regular (400), `--text-base`, cor `--text-main`
4. **Labels/UI** → Inter Medium (500), `--text-xs`, uppercase + tracking-wide
5. **Números/Tabelas** → JetBrains Mono, `font-variant-numeric: tabular-nums`

### 3.4 Font Loading
```css
/* Self-hosted via @font-face ou next/font */
/* Preload: Montserrat 700, Inter 400/500/600, JetBrains Mono 400/500 */
@font-face {
  font-family: 'Montserrat';
  src: url('/fonts/montserrat-bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-regular.woff2') format('woff2'),
       url('/fonts/inter-medium.woff2') format('woff2'),
       url('/fonts/inter-semibold.woff2') format('woff2');
  font-weight: 400 600;
  font-display: swap;
}
```

---

## 4. Spacing & Layout

### 4.1 Base Unit
- **4px** (0.25rem) — todas as medidas derivam deste

### 4.2 Spacing Scale
| Token | Value | Uso |
|-------|-------|-----|
| `--space-1` | `0.25rem` (4px) | Micro gaps |
| `--space-2` | `0.5rem` (8px) | Icon-text, button padding |
| `--space-3` | `0.75rem` (12px) | Card padding, gaps |
| `--space-4` | `1rem` (16px) | Standard gap |
| `--space-5` | `1.25rem` (20px) | Section inner |
| `--space-6` | `1.5rem` (24px) | Card padding lg |
| `--space-8` | `2rem` (32px) | Section gap |
| `--space-10` | `2.5rem` (40px) | Large section gap |
| `--space-12` | `3rem` (48px) | Hero vertical |
| `--space-16` | `4rem` (64px) | Page sections |

### 4.3 Container & Grid
| Token | Value |
|-------|-------|
| `--container-max` | `80rem` (1280px) |
| `--container-padding` | `1.5rem` (24px) mobile, `2rem` (32px) desktop |
| `--grid-cols` | 12 |
| `--grid-gap` | `1.5rem` (24px) |

### 4.4 Breakpoints
| Token | Value |
|-------|-------|
| `--bp-sm` | `640px` |
| `--bp-md` | `768px` |
| `--bp-lg` | `1024px` |
| `--bp-xl` | `1280px` |
| `--bp-2xl` | `1536px` |

---

## 5. Shape & Border Radius

| Token | Value | Uso |
|-------|-------|-----|
| `--radius-none` | `0` | Sharp elements |
| `--radius-sm` | `0.375rem` (6px) | Badges, chips, small inputs |
| `--radius-md` | `0.5rem` (8px) | Buttons, standard inputs |
| `--radius-lg` | `0.75rem` (12px) | **Default cards** |
| `--radius-xl` | `1rem` (16px) | Modals, large cards |
| `--radius-2xl` | `1.5rem` (24px) | Hero containers |
| `--radius-full` | `9999px` | Pills, avatars, badges |

**Regra:** Um único sistema de radius por página. Botões = `--radius-md`, Cards = `--radius-lg`.

---

## 6. Shadows & Elevation

| Level | Light Mode | Dark Mode | Uso |
|-------|------------|-----------|-----|
| 0 | `none` | `none` | Flat |
| 1 | `--shadow-sm` | `--shadow-sm` | Cards, inputs focus |
| 2 | `--shadow-md` | `--shadow-md` | Elevated cards, dropdowns |
| 3 | `--shadow-lg` | `--shadow-lg` | Modais, popovers, toasts |
| 4 | `--shadow-xl` (custom) | `--shadow-xl` | Floating panels |

---

## 7. Motion & Animation

### 7.1 Easing Curves
| Token | Value | Uso |
|-------|-------|-----|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | **Default** — Enter, reveals |
| `--ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Exit, dismiss |
| `--ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Move, reposition |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Branded pop, playful |
| `--ease-linear` | `linear` | Loops, spinners, marquees |

### 7.2 Duration Scale
| Token | Value | Uso |
|-------|-------|-----|
| `--dur-instant` | `0ms` | Reduced motion |
| `--dur-fast` | `100ms` | Micro-interactions (hover, tap) |
| `--dur-base` | `200ms` | UI transitions (panel, modal) |
| `--dur-normal` | `300ms` | Standard transitions |
| `--dur-slow` | `400ms` | Hero, large elements |
| `--dur-slower` | `500ms` | Page transitions |

### 7.3 Stagger
| Token | Value | Uso |
|-------|-------|-----|
| `--stagger-tight` | `20ms` | Dense grids |
| `--stagger-base` | `40ms` | Lists |
| `--stagger-loose` | `60ms` | Feature cards |

### 7.4 Spring Configs (Framer Motion / React Spring)
```js
// Snappy UI (default)
{ stiffness: 300, damping: 30, mass: 1 }

// Gentle
{ stiffness: 180, damping: 20, mass: 1 }

// Bouncy (branded)
{ stiffness: 280, damping: 14, mass: 1 }
```

### 7.5 Reduced Motion (Mandatory)
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## 8. Component Specifications

### 8.1 Buttons
| Variant | Background | Text | Border | Radius | Height | Padding X |
|---------|------------|------|--------|--------|--------|-----------|
| **Primary** | `--brand-grad` | White | None | `--radius-md` | `44px` | `1.5rem` |
| **Secondary** | `--bg-card` | `--text-main` | `--border` | `--radius-md` | `44px` | `1.5rem` |
| **Ghost** | Transparent | `--brand` | None | `--radius-md` | `44px` | `1rem` |
| **Danger** | `#EF4444` | White | None | `--radius-md` | `44px` | `1.5rem` |
| **Pill (CTA)** | `--brand-grad` | White | None | `--radius-full` | `44px` | `2rem` |

**States:**
- Hover: `brightness(1.05)` + `translateY(-0.5px)`
- Active: `scale(0.97)`
- Focus: `box-shadow: 0 0 0 3px var(--brand-soft)`
- Disabled: `opacity(0.5)`, `cursor: not-allowed`

### 8.2 Cards
| Variant | Background | Border | Radius | Shadow | Padding |
|---------|------------|--------|--------|--------|---------|
| **Default** | `--bg-card` | `1px solid var(--border)` | `--radius-lg` | `--shadow-sm` | `--space-6` |
| **Flat** | `--bg-card` | `1px solid var(--border)` | `--radius-lg` | None | `--space-6` |
| **Raised** | `--bg-card` | None | `--radius-lg` | `--shadow-md` | `--space-6` |
| **Accented** | `--bg-card` | `3px solid var(--brand)` left | `--radius-lg` | `--shadow-sm` | `--space-6` |

### 8.3 Inputs
| Property | Value |
|----------|-------|
| Height | `44px` (touch target) |
| Padding | `0 1rem` |
| Radius | `--radius-md` |
| Border | `1px solid var(--border)` |
| Focus | `border: var(--brand)`, `box-shadow: 0 0 0 3px var(--brand-soft)` |
| Error | `border: #EF4444`, `box-shadow: 0 0 0 3px rgba(239,68,68,0.15)` |
| Placeholder | `color: var(--text-muted)` |

### 8.4 Badges / Chips
| Variant | Background | Text | Radius | Padding |
|---------|------------|------|--------|---------|
| **Default** | `--brand-soft` | `--brand` | `--radius-full` | `0.25rem 0.75rem` |
| **Success** | `rgba(59,191,160,0.12)` | `#3BBFA0` | `--radius-full` | `0.25rem 0.75rem` |
| **Warning** | `rgba(245,158,11,0.12)` | `#F59E0B` | `--radius-full` | `0.25rem 0.75rem` |
| **Danger** | `rgba(239,68,68,0.12)` | `#EF4444` | `--radius-full` | `0.25rem 0.75rem` |
| **Plan** | `var(--plan-badge-bg)` | `var(--plan-badge)` | `--radius-full` | `0.25rem 0.75rem` |

---

## 9. Iconography

- **Library:** Phosphor Icons (`@phosphor-icons/react`) — weight: `regular` (1.5px stroke)
- **Sizes:** 16px (inline), 20px (buttons), 24px (nav), 32px (feature)
- **Stroke:** Consistent 1.5px (24x24 grid)
- **Style:** Outline, rounded caps, geometric
- **Color:** `currentColor` (herda do texto) ou `--brand` para accent

---

## 10. Illustrations & Imagery

### 10.1 Style
- **Hero/Landing:** Mockups de UI real (screenshots do app) + orbes de luz sutis (radial gradients)
- **Empty States:** Line illustrations, 1.5px stroke, brand colors com 10% opacity
- **Onboarding:** Step-by-step UI mockups com highlight animado

### 10.2 Orbes Decorativos (Landing)
```css
.orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(46px);
  pointer-events: none;
  animation: orbDrift 11s ease-in-out infinite;
}
.orb-1 { background: radial-gradient(circle, rgba(110,198,200,0.08), transparent 70%); }
.orb-2 { background: radial-gradient(circle, rgba(59,191,160,0.06), transparent 70%); }
.orb-3 { background: radial-gradient(circle, rgba(0,47,89,0.05), transparent 70%); }
```

### 10.3 Photography
- Produto real em uso (celular na mão, dashboard no desktop)
- Fundos neutros (Off White / Navy 950)
- Iluminação natural, sombras suaves

---

## 11. Accessibility (WCAG AA)

| Critério | Valor | Verificação |
|----------|-------|-------------|
| Contraste texto (body) | ≥ 4.5:1 | `--text-main` sobre `--bg-page` ✓ |
| Contraste texto (large) | ≥ 3:1 | Headlines ✓ |
| Contraste UI (borders, icons) | ≥ 3:1 | `--border`, icons ✓ |
| Focus visible | 3px ring | `box-shadow: 0 0 0 3px var(--brand-soft)` ✓ |
| Touch targets | ≥ 44x44px | Buttons, inputs, nav items ✓ |
| Reduced motion | Respeitado | `@media (prefers-reduced-motion)` ✓ |
| Color não único | Sempre + shape/text | Badges com label, icons com tooltip ✓ |

---

## 12. Do's & Don'ts

### ✅ Do's
- Use `--brand-grad` apenas em Primary buttons e hero accents
- Montserrat **Bold** apenas para headlines (H1-H2)
- Inter **Regular/Medium** para tudo o mais
- Stagger de 40-60ms em listas/grids
- `prefers-reduced-motion` desliga animações decorativas
- Dark mode usa tokens, não hardcode
- Plan variants via `[data-plan="..."]` attributes

### ❌ Don'ts
- Não use `#000000` ou `#FFFFFF` puros (use Off White / Navy 950)
- Não misture Montserrat Regular no body
- Não use mais de 1 accent color por tela
- Não anime `width`/`height`/`top`/`left` (use transform)
- Não use `linear` easing para enter/exit (exceto loops)
- Não coloque glassmorphism em todo lugar (apenas overlays)
- Não use sombras pretas puras (sempre tintadas com brand)
- Não faça CTAs com texto quebrado em 2 linhas (máx 3 palavras)

---

## 13. Implementation Checklist

### CSS Variables (index.css) — ✅ Já implementado
- [x] Core palette (light + dark)
- [x] Plan variants (pro, premium)
- [x] Typography scale (clamp-based)
- [x] Spacing, radius, shadows
- [x] Motion tokens (easing, duration)
- [x] Reduced motion

### Component Library — 🔄 Em progresso
- [x] Button (primary, secondary, ghost, danger, pill)
- [x] Card (default, flat, raised, accented)
- [x] Input (default, error, focus)
- [x] Badge/Chip (default, success, warning, danger, plan)
- [x] Modal, Toast, Tooltip
- [ ] Select, Checkbox, Radio, Switch
- [ ] Table, Pagination
- [ ] Avatar, Dropdown, Tabs

### Brand Studio — ✅ Funcional
- [x] Logo editor (cores por plano)
- [x] Palette editor (full semantic)
- [x] Typography config
- [x] Preview geral
- [x] Undo/Redo history

---

## 14. Changelog

| Versão | Data | Autor | Mudanças |
|--------|------|-------|----------|
| 1.0 | 2026-08-04 | Stylist | Criação inicial baseada em assets + codebase |
| 1.1 | 2026-08-08 | Agente 01 | Fase 2: OKLCH neutros, color-mix() brand derivadas, elevação semântica, motion semântica, `--brand-soft` via CSS (não JS), remoção bloco shadcn HSL. `--success` AA `#15803d` em uso; `--green` `#3BBFA0` decorativo. |

---

**Fim do documento.**  
Este é o **Visual Identity Package** oficial do Financia. Qualquer alteração deve ser aprovada e versionada aqui.