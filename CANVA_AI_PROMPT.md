# Prompt para Canva AI — Financia Visual Identity

> **Como usar:** Copie tudo abaixo e cole no Canva AI (Magic Design / Magic Write / Magic Media). O Canva vai gerar templates, apresentações, posts, mockups seguindo exatamente esta identidade.

---

## 🎯 Briefing Direto para IA

**Produto:** Financia — Gestão financeira para pequenos negócios brasileiros  
**Vibe:** "Linear encontra Stripe, com calor editorial brasileiro"  
**Público:** Microempreendedores, lojistas, prestadores de serviço — gente que vende todo dia e precisa simplicidade, não dashboard de analista  
**Diferencial:** Funciona offline, sincroniza sozinho, instala como app (PWA)

---

## 🎨 Identidade Visual — Specs Exatos

### Logo
- **Horizontal:** Símbolo (geométrico, 3 colunas + check) + "Financia" em Montserrat Bold à direita
- **Símbolo isolado:** Favicon, app icon, avatar
- **Cores do símbolo:** Navy `#002F59` | Teal `#1A6B5C` | Light Teal `#6EC6C8` | Check `#8CF2D1`

### Paleta Core (Não mude estes hex)
| Nome | Hex | Uso |
|------|-----|-----|
| **Navy** | `#002F59` | Primary — headers, botões primários, links |
| **Teal** | `#1A6B5C` | Accent — highlights, hover, progress |
| **Green** | `#3BBFA0` | Success — receitas, KPIs positivos |
| **Light Teal** | `#6EC6C8` | Secondary — hover states, bordas sutis |
| **Off White** | `#F5F5F0` | Background principal (light mode) |

### Dark Mode (Automático via `prefers-color-scheme`)
- Page bg: `#0A1628` (Navy 950)
- Cards: `#13243D` (Navy 900)
- Text: `#E8EDF2` (Slate 50)
- Borders: `#1E3450` (Navy 800)

### Plan Variants (Quando usuário assina)
- **Pro:** Blue theme — Primary `#2563EB`, Accent `#4F46E5`
- **Premium:** Dark/Gold — Primary `#0F172A`, Accent `#D4AF6A`
- **White-label:** Totalmente customizável pelo cliente

---

### Tipografia
| Papel | Fonte | Pesos | Tamanhos (clamp fluido) |
|-------|-------|-------|-------------------------|
| **Display/Headlines** | **Montserrat** | **Bold (700)** | H1: `clamp(2.5rem, 5vw, 4rem)` • H2: `clamp(2rem, 4vw, 3rem)` |
| **UI/Body/Subtítulos** | **Inter** | Regular (400), Medium (500) | Base: `1rem` • LG: `1.125rem` • SM: `0.875rem` |
| **Mono/Números** | **JetBrains Mono** | 400, 500 | Tabelas, KPIs, valores monetários |

**Hierarquia obrigatória:**
1. Título Principal → Montserrat Bold + cor Navy
2. Subtítulo → Inter Medium + cor Slate 500 (`#5B6B7C`)
3. Corpo → Inter Regular + cor Slate 900 (`#0F172A`)
4. Labels/Badges → Inter Medium + uppercase + tracking-wide

---

### Espaçamento & Layout
- **Unidade base:** 4px (0.25rem)
- **Scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
- **Container max:** 1280px (80rem)
- **Grid:** 12 colunas, gap 24px
- **Radius único:** Cards 12px (`--radius-lg`), Botões 8px (`--radius-md`), Pills 9999px

---

### Sombras (Sempre tintadas com Navy)
| Nível | Light | Dark | Uso |
|-------|-------|------|-----|
| 1 (sm) | `0 1px 2px rgba(0,47,89,0.04)` | `0 1px 3px rgba(0,0,0,0.3)` | Cards, inputs |
| 2 (md) | `0 2px 8px rgba(0,47,89,0.05)` | `0 4px 12px rgba(0,0,0,0.35)` | Dropdowns, elevated |
| 3 (lg) | `0 8px 24px rgba(0,47,89,0.08)` | `0 10px 30px rgba(0,0,0,0.45)` | Modais, toasts |

---

### Motion (Obrigatório respeitar `prefers-reduced-motion`)
| Ação | Easing | Duração |
|------|--------|---------|
| **Enter/Reveal** | `cubic-bezier(0.16, 1, 0.3, 1)` | 200-400ms |
| **Exit/Dismiss** | `cubic-bezier(0.7, 0, 0.84, 0)` | 150-250ms |
| **Move/Reposition** | `cubic-bezier(0.65, 0, 0.35, 1)` | 200-300ms |
| **Branded Pop** | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 400-600ms |
| **Loops/Spinners** | `linear` | — |

**Stagger:** 40ms (listas), 20ms (grids densos), 60ms (feature cards)  
**Spring padrão:** `stiffness: 300, damping: 30, mass: 1`

---

## 🧩 Componentes — Regras Visuais

### Botões
| Variante | Background | Texto | Radius | Height | Hover |
|----------|------------|-------|--------|--------|-------|
| **Primary** | `linear-gradient(135deg, #002F59 0%, #1A6B5C 100%)` | White | 8px | 44px | Brightness 1.05 + translateY(-0.5px) |
| **Secondary** | White | Navy | 8px | 44px | Border Navy + bg Off White |
| **Ghost** | Transparent | Navy | 8px | 44px | Bg Off White |
| **Danger** | `#EF4444` | White | 8px | 44px | Brightness 1.05 |
| **Pill (CTA hero)** | Gradient primário | White | 9999px | 44px | TranslateY(-0.5px) |

**Active:** `scale(0.97)` | **Focus:** `0 0 0 3px rgba(0,47,89,0.12)` | **Disabled:** `opacity(0.5)`

### Cards
- **Default:** White bg, border `#EDEAE3`, radius 12px, shadow sm, padding 24px
- **Flat:** Sem shadow
- **Raised:** Shadow md
- **Accented:** Border-left 3px Navy

### Inputs
- Height 44px, padding 16px, radius 8px
- Border `#EDEAE3` → Focus: Navy + ring 3px `rgba(0,47,89,0.12)`
- Error: Border `#EF4444` + ring rosa
- Placeholder: `#94A3B8`

### Badges/Chips
- Radius 9999px, padding `4px 12px`, Inter Medium 12px
- Default: `rgba(0,47,89,0.08)` + Navy text
- Success: `rgba(59,191,160,0.12)` + `#3BBFA0`
- Warning: `rgba(245,158,11,0.12)` + `#F59E0B`
- Danger: `rgba(239,68,68,0.12)` + `#EF4444`
- Plan: Cores do plano (Pro=Blue, Premium=Gold)

---

## 🖼️ O que Pedir pro Canva Gerar

### 1. **Brand Kit Completo**
> "Crie um Brand Kit no Canva com: logo horizontal + símbolo isolado (SVG), paleta de 5 cores com hex, tipografia Montserrat Bold + Inter Regular + JetBrains Mono, 3 estilos de botão, 2 estilos de card, badges, inputs. Salve como Brand Kit 'Financia v1'."

### 2. **Landing Page Hero (1920x1080)**
> "Hero section para Financia: bg Off White `#F5F5F0`, 3 orbes decorativos sutis (radial gradients: Light Teal 8%, Green 6%, Navy 5%, blur 60px), logo horizontal à esquerda, H1 Montserrat Bold 48px 'Suas finanças no controle total' com 'controle total' em gradient Teal→Green, sub Inter Regular 18px Slate 500, 2 CTAs (Primary pill + Ghost), mockup do dashboard flutuando à direita com float animation 5s, anel cônico girando 26s. Reduced motion: orbes e anel parados."

### 3. **Dashboard Mockup (1440x900)**
> "Dashboard Financia light mode: sidebar Navy colapsável (64px/256px), header com logo + sync status + theme toggle, KPI cards grid 4 cols (Entradas Green, Saídas Red, Resultado Navy, Saldo Blue) com tabular-nums JetBrains Mono, gráfico 7 dias barras duplas (Green/Red) com hover lift, low stock alert amber banner, recent transactions list com hover bg subtle. Dark mode version lado a lado."

### 4. **Mobile App Screens (390x844 iPhone)**
> "5 telas mobile: 1) Onboarding 3 steps (offline, sync, reports), 2) Home com KPIs + bottom nav 5 tabs (Início, Vendas, Despesas, Estoque, Relatório), 3) Nova venda (multi-itens, search produtos, calculo total, deduz estoque), 4) Relatório mensal com nav mês anterior/próximo, KPIs + export PDF/XLS, 5) Configurações com brand editor (logo, cores por plano). Safe areas respeitadas."

### 5. **Social Media Templates (1080x1080 / 1080x1350 / 1920x1080)**
> "Templates para Instagram/LinkedIn: 1) Quote card — Montserrat Bold center, bg Navy, texto branco, logo sutil canto. 2) KPI announce — 'R$ 8.420 resultado do mês' grande, JetBrains Mono, card White radius 16px shadow lg. 3) Feature highlight — mockup phone + 3 bullets Inter Medium. 4) Plan comparison — 3 cards Free/Pro/Premium com cores certas. Todos com orbes decorativos sutis."

### 6. **Presentation Deck (16:9)**
> "Pitch deck 12 slides: Cover, Problema, Solução, Produto (dashboard screens), Mercado, Traction (2.8k empresas, 4.9★), Modelo (Free/Pro/Premium), Go-to-market, Team, Roadmap, Investment, Contact. Style: Navy bg, Off White text, Montserrat Bold titles, Inter body, Light Teal accents, orbes decorativos nos cantos, gráfico barras animado no slide de traction."

---

## ✅ Checklist de Validação Pós-Geração

- [ ] Logo horizontal usa Montserrat Bold, espaçamento correto
- [ ] Paleta tem **exatos 5 hex** — nenhum tom "parecido"
- [ ] Montserrat **apenas Bold** em headlines — nunca Regular no body
- [ ] Inter Regular/Medium para **todo** body/UI
- [ ] JetBrains Mono em **números/KPIs/tabelas**
- [ ] Radius: Cards 12px, Botões 8px, Pills 9999px
- [ ] Sombras **tintadas com Navy** — zero preto puro
- [ ] Dark mode completo (bg `#0A1628`, cards `#13243D`)
- [ ] Plan variants: Pro=Blue, Premium=Gold/Dark
- [ ] Animações respeitam `prefers-reduced-motion`
- [ ] Touch targets **mínimo 44x44px**
- [ ] Contraste WCAG AA em todos os textos
- [ ] Focus visible: ring 3px `rgba(0,47,89,0.12)`
- [ ] Zero `#000000` ou `#FFFFFF` puros
- [ ] Zero glassmorphism excessivo (apenas overlays sutis)

---

## 📝 Notas para o Designer/IA

> **Não faça:**
> - Gradientes roxos/rosa "AI default"
> - Cards dentro de cards dentro de cards
> - Muitos pesos de fonte (só 2 famílias, 3-4 pesos)
> - Animações "bonitinhas" sem propósito (cada motion tem reason)
> - Hero que não cabe no viewport (CTA sempre visível)
> - Eyebrow (label pequena cima do título) em toda seção — máx 1 a cada 3

> **Faça:**
> - Mockups reais do app (não caixas cinzas fake)
> - Orbes/orbitais sutis dão profundidade sem poluir
> - Stagger sempre — nada aparece tudo junto
> - Estados vazios bonitos com call-to-action claro
> - Números tabulares alinhados (JetBrains Mono)
> - Off White `#F5F5F0` como "branco" — mais quente, humano

---

**Versão:** 1.0 | **Data:** 2026-08-04 | **Aprovado por:** Stylist Financia