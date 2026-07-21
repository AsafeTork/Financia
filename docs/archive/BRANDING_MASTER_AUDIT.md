---
type: REPORT
---

# BRANDING MASTER AUDIT

> Product Design Audit — Jul 2026  
> 7 marcas tech — Foco: Brand Studio (SVG, cores, temas, presets, logos, preview)  
> Protocolo: GATE DE CONSOLIDAÇÃO (CLAUDE.md §566) + PROVA DE LEITURA (§589)

---

## PROVA DE LEITURA

| Documento | Problemas encontrados |
|---|---|
| ✓ Subagente Stripe | 8 complexidades, 10 simplificações possíveis, 52 cores mapeadas |
| ✓ Subagente Linear | 7 complexidades, 8 simplificações, brand ≠ design system dissociados |
| ✓ Subagente Notion | 7 complexidades, 7 simplificações, paleta fragmentada em 3 contextos |
| ✓ Subagente Vercel | 10 complexidades, 8 simplificações, 140+ tokens, 3 packages fragmentados |
| ✓ Subagente GitHub | 10 complexidades, 10 simplificações, 5 sub-brands, PDF 89pp vs site divergente |
| ✓ Subagente Framer | 8 complexidades, 9 simplificações, 23 cores, sem ZIP, tipografia ausente |
| ✓ Subagente Canva | 7 complexidades, 7 simplificações, Brand Kit vs Brand Hub sobreposição |
| ✓ MCP Stripe Docs | Matriz 4×5 de aplicação por canal confirmada; formatos: JPG/PNG apenas |
| ✓ `docs/AI_BRAND_SCHEMA.md` | Schema JSON de brand do Financia já existe (schemaVersion 1.0.0) |
| ✓ `DESIGN_SYSTEM_AUDIT.md` | 321 hex hardcoded, tokens CSS, dark mode, shadcn/ui base |
| ✓ `docs/ARCHITECTURE/MASTER_REFACTOR_PLAN.md` | 12+ docs consolidados pré-existentes |

**Total: 11 documentos lidos.** Nenhum assumido sem evidência.

---

## MATRIZ DE CONSOLIDAÇÃO

### Conflitos detectados e resolvidos

| Conflito | Evidência A | Evidência B | Resolução |
|----------|------------|------------|-----------|
| Stripe primary `#533AFD` vs `#635BFF` | designlang.app (Mai/2026): `#533AFD` | Dembrandt (2024): `#635BFF` | `#533AFD` vence — 3 extratores de 2026 convergem |
| Linear tipografia ausente no brand page | linear.app/brand: não lista fontes | Extração ao vivo: Inter + Berkeley Mono | Documentado como omissão; fontes confirmadas via CSS |
| Notion `#0075DE` marketing vs `#487CA5` product | designlang.app: `#0075DE` primary | Notion in-app: `#487CA5` blue text | Ambos corretos — fragmentação documentada |
| Vercel geist-org/geist-ui vs @vercel/geistcn | geist-org/geist-ui: 4.5k stars, arquivado | vercel.com/geist: @vercel/geistcn oficial | Legacy arquivado; oficial é @vercel/geistcn |
| GitHub PDF 2025 vs 2026 | brand.github.com: ambos disponíveis | 2Slides: 2026 é o vigente | 2026 vigora; 2025 é legado sem redirect |

---

## SUMÁRIO EXECUTIVO

| Empresa | URL Brand Oficial | Open Source | Brand Studio Interativo | Maturidade |
|---------|------------------|-------------|------------------------|------------|
| **Stripe** | `dashboard.stripe.com/account/branding` | Não | Sim (Dashboard) | AAAA |
| **Linear** | `linear.app/brand` | Não | Não (página estática + ZIP) | AAA |
| **Notion** | `notion.notion.site/...brand-usage-guidelines` | Não | Não (só templates terceiros) | AA |
| **Vercel** | `vercel.com/geist/brands` | Sim (Geist) | Sim (Geist docs interativo) | AAAA |
| **GitHub** | `brand.github.com` | Sim (Primer) | Sim (Brand Toolkit) | AAAA |
| **Framer** | `framer.com/brand` | Não | Não (página estática + copy) | AA |
| **Canva** | `canvacreative.team/brand` | Não | Sim (Brand Hub no produto) | AAA |

---

## 1. STRIPE — Brand Studio (Dashboard)

**URL oficial:** `dashboard.stripe.com/account/branding`  
**Documentação:** `docs.stripe.com/get-started/account/branding` (via MCP Stripe)  
**Assets:** `stripe.com/newsroom/information`  
**Extração tokens:** designlang.app (Mai/2026), designmd.cc, refero.design  
**Brand Refresh:** estudio-image.com (2024-2026, Brand Studio interno)

### O que existe

- Painel de branding no Dashboard com 4 campos: **Icon** (quadrado), **Logo** (retangular), **Brand color**, **Accent color**
- Formatos aceitos: apenas **JPG/PNG**, < 512KB, ≥ 128×128px
- Preview inline do checkout, invoice e customer portal
- Aplicação em 5 canais com matriz 4×5 de aplicação (docs oficial — confirmado via MCP Stripe)
- API v2 para contas Connect (`POST /v2/core/accounts`)
- Políticas configuráveis (devolução/reembolso), domínio customizado
- **Time Brand Studio interno** (ESTUDI-IMAGE contratado 2024-2026)

### Paleta (extraída de stripe.com ao vivo)

| Categoria | Cores | Uso |
|-----------|-------|-----|
| Primary | `#533AFD` (Electric Iris) | CTA, links, nav active |
| Neutrals | `#061B31`, `#FFFFFF`, `#E5EDF5`, `#64748D` | Texto, canvas, borders, body |
| Gradientes | Orange `#FF6118` → Pink → Purple `#533AFD` | Hero, background decorativo |
| **Total:** 52 cores (designlang), WCAG 77% |
| **Tipografia:** `sohne-var` (Klim Type Foundry) + `SourceCodePro` (mono) |

### Complexo

1. Upload apenas JPG/PNG — sem SVG, impossível dark mode automático
2. Nomenclatura confusa: "Brand color" (texto/botões) vs "Accent color" (background)
3. Matriz 4×5 de aplicação — cada asset se aplica a subconjunto diferente de canais
4. Apenas 1 marca por conta — impossível branding diferente por produto
5. Sem dark/light theme — cor fixa sem adaptação a preferência do sistema
6. Font lock-in — não é possível usar fonte própria do merchant

### Pode ser simplificado

- Substituir JPG/PNG por SVG com fallback automático
- Unificar Icon + Logo em upload único com redimensionamento automático por canal
- Renomear "Brand color" → "Primary", "Accent color" → "Background"
- Adicionar dark/light toggle com preview side-by-side (email + checkout + invoice + portal)
- Tornar matriz de aplicação automática (não documentação)

### Deve permanecer

- Preview inline do checkout/invoice/portal
- API para Connect herdarem brand settings
- Custom domain para checkout e email
- Políticas configuráveis no checkout

---

## 2. LINEAR — Brand Guidelines

**URL oficial:** `linear.app/brand`  
**Assets ZIP:** `static.linear.app/design-assets/Linear-Brand-Assets.zip?v=3`  
**Extração tokens:** designlang.app (Mai/2026), getdesign.md  
**Comunidade:** figma.com (não-oficial)

### O que existe

- Página única com: Naming, Usage, Wordmark, Logo, Icon, Colors
- ZIP (~601KB) + download individual por SVG/PNG
- Copy de hex codes com 1 clique
- Paleta oficial: Primary `#5E6AD2`, Mercury White `#F4F5F8`, Nordic Gray `#222326`
- Tipografia do produto: Inter Variable + Berkeley Mono (**não documentada na página de brand**)
- **Não há:** preview interativo, dark/light toggle, npm package, design system público

### Paleta real do produto (30 cores, extraída ao vivo)

| Token | Hex | Uso |
|-------|-----|-----|
| Background | `#08090A` | Fundo escuro principal |
| Text primary | `#F7F8F8` | Texto claro |
| Surface elevated | `#1C1D24` | Cartões/panels |
| Accent neon | `#E4F222` | Amarelo (presente no site) |
| Purple secondary | `#8FA6FF` | Acento roxo |
| **Total:** 30 cores, WCAG 83% (5 passing, 1 failing) |

### Complexo

1. Brand guidelines ≠ design system do produto — página `/brand` só cobre assets de marketing
2. Paleta oficial (3 cores) muito menor que a real (~20+ tokens) — sem mapeamento
3. Tipografia não está na página de brand — designer descobre por terceiros
4. ZIP opaco — sem preview do conteúdo antes de baixar
5. Sem versionamento visível — só `?v=3` sem changelog
6. Sem suporte a npm — nenhum `@linear/brand-assets`
7. Berkeley Mono (proprietária) sem instruções de licenciamento

### Pode ser simplificado

- Adicionar npm package (`@linear/brand-assets`) com SVGs otimizados + tokens CSS
- Expandir paleta oficial para incluir 10-15 tokens mais usados com roles semânticos
- Adicionar tipografia na página de brand
- Adicionar preview inline do conteúdo do ZIP

### Deve permanecer

- Simplicidade radical — 1 página, 3 assets, 3 cores, regras claras
- Copy de hex codes com 1 clique
- Don'ts visuais

---

## 3. NOTION — Ecossistema de Marca

**URL terceiros:** `notion.notion.site/...brand-usage-guidelines`  
**Trademark:** `notion.notion.site/...Trademark-Usage-Guidelines`  
**Marketplace:** `notion.com/templates/category/brand-guidelines` (224 templates)  
**Extração:** designlang.app, getdesign.md

### O que existe

- **Não há Brand Studio próprio.** Guidelines públicas são só para terceiros (community, template creators)
- **Brand Kit é feature do Canva, não do Notion** — confusão comum no mercado
- **224 templates** de brand guidelines de terceiros rodando dentro do Notion
- Time Brand Design interno (Head: Rob Giampietro, Art Director: Roman Muradov)
- "Made for Notion" badge para terceiros (ZIP baixável)

### Paleta (extraída de notion.so ao vivo)

| Contexto | Cor primária | Diferença |
|----------|-------------|-----------|
| Marketing site | `#0075DE` | Primary azul |
| Product UI text | `#373530` | Texto default |
| In-app blue text | `#487CA5` | Blue text (diferente do marketing) |
| **Total:** 30 cores, WCAG 92% (12 passing, 1 failing) |
| **Tipografia:** NotionInter (Inter modificada, não pública) + Times |

### Complexo

1. Guidelines públicas são apenas para terceiros — brand book interno não aberto
2. Paleta fragmentada: 3 contextos (marketing, product UI, in-app) com hexes diferentes
3. NotionInter não é pública — versão customizada da Inter indisponível
4. Dualidade ilustração hand-drawn vs enterprise — tensão visual não resolvida
5. Comunidade como extensão da marca — milhares de templates sem controle central
6. Sub-brands (Calendar, AI, Mail extinto) sem guidelines públicas

### Pode ser simplificado

- Publicar brand book interno como template oficial no próprio Notion
- Disponibilizar NotionInter publicamente (Inter já é OFL)
- Unificar paletas com token system role-based (não cor-based)

### Deve permanecer

- Template ecosystem (224 templates)
- "Made for Notion" badge system
- Flexibilidade do editor para documentar marca

---

## 4. VERCEL — Geist Design System + Brand Assets

**URLs:** `vercel.com/geist/brands`, `vercel.com/geist/introduction`, `vercel.com/design`  
**Design tokens:** YAML em `/design.md` e `/design.dark.md`  
**NPM:** `@vercel/geistcn`, `@vercel/geistcn-assets`, `geist` (fonte)  
**Extração:** designlang.app (Mai/2026), seedflip.co

### O que existe

- **Geist**: design system completo e open source (80+ componentes React)
- **Brands page**: Vercel, Next.js, Turbo, v0, eve, AI SDK — cada um com ZIP + React component
- **Design tokens públicos**: 140+ cores (gray, gray-alpha, blue, red, amber, green, teal, purple, pink — 10 steps cada + P3 oklch)
- **Dark/light completo**: tokens redefinidos por tema, theme switcher na documentação
- **Preview interativo**: font playground (`vercel.com/font`), live preview de cada componente
- **Agent-first**: qualquer URL + `.md` retorna markdown puro
- **Tipografia**: Geist Sans + Geist Mono + Geist Pixel (variável, eixo ELSH)

### Paleta oficial (Light)

| Escala | Exemplo | Steps |
|--------|---------|-------|
| Gray | `#f2f2f2` → `#171717` | 10 steps |
| Blue | `#f0f7ff` → `#002359` | 10 steps + P3 oklch |
| Red/Amber/Green/Teal/Purple/Pink | — | 10 steps cada |
| **Radii:** 6px(sm)/12px(md)/16px(lg)/9999px(full) | **Base spacing:** 4px |
| **Motion:** easing `cubic-bezier(0.175, 0.885, 0.32, 1.1)`, 150ms/200ms/300ms |

### Complexo

1. 3 packages npm para uma identidade visual (`geistcn` + `geistcn-assets` + `geist` font)
2. `geist-org/geist-ui` legado (4.5k stars) arquivado — confunde search
3. 140+ tokens de cor — gray-alpha vs gray sólido é nuance sutil; P3 duplica cada scale
4. Voice guidelines (Title Case) misturados no YAML de tokens de botão
5. Geist Pixel via eixo variável ELSH (5 estilos via `font-variation-settings`)

### Pode ser simplificado

- Unificar `@vercel/geistcn` + `@vercel/geistcn-assets` + `geist` em `@vercel/geist`
- Consolidar gray-alpha + gray com `color-mix()`
- Separar voice guidelines em docs próprios
- Juntar `/design.md` + `/design.dark.md` em spec único com `theme:` no topo

### Deve permanecer

- Design tokens públicos e versionados
- React components para logos (import `@vercel/geistcn-assets/logos`)
- Dark/light com theme switcher
- Agent-first Markdown (`.md` em qualquer URL)
- Font playground interativo

---

## 5. GITHUB — Primer Brand UI + Brand Toolkit

**URLs:** `brand.github.com`, `primer.style`, `primer.style/brand`  
**Fonte:** Mona Sans (open source)  
**Ícones:** Octicons (300+ SVG open source)  
**PDF 2026:** 89 páginas (`brand.github.com/GitHub-BrandGuidelines-2026.pdf`)  
**Asset Generator:** `asset-generator.github.com` (requer login)

### O que existe

- **Brand Toolkit**: site completo com foundations (logo, tipografia, cor, acessibilidade), brand identity, graphic elements, brand in action, motion identity
- **Primer**: design system open source (Product UI + Brand UI + Octicons)
- **5 sub-brands documentadas**: Copilot (roxo), Security (azul/lima), Actions, Spark, Universe
- **Mascotes**: Mona (Octocat 3D), Copilot (AI), Ducky (debug)
- **Árvore de decisão de marca**: 5 tipos de lockup com regras específicas
- **Sistema de ilustração 3D**: cubos isométricos verdes, contribution graph, dithering textures
- **Mona Sans**: fonte open source própria (5 larguras, optical size)

### Paleta

| Tema | Cor chave | Hex |
|------|-----------|-----|
| Core | GitHub Green | `#0FBF3E` |
| Copilot | Purple | `#8534F3` |
| Security | Blue | `#3094FF` |
| **Regra:** 80% preto/branco, 10% neutro, 5% verde, 5% cor de acento |

### Complexo

1. 3 sistemas separados: Brand Toolkit (site), Primer Brand UI (React), Primer Product UI
2. PDF 89 páginas vs site — conteúdo duplicado, organizado diferente, sem sincronia
3. Asset Generator atrás de login — impede acesso público
4. Figma como fonte da verdade — valores só existem lá
5. Hierarquia de marca complexa: 5 tipos de lockup com regras específicas cada
6. 3 estilos de mascote ativos (3D, 2.0, Monamoji) + legados
7. Primer Brand UI em v0.70.0 — pré-1.0, mudanças frequentes
8. PDF 2025 e 2026 disponíveis sem indicação de qual vigora

### Pode ser simplificado

- Unificar PDF e site em fonte única com versionamento
- Tornar Asset Generator público (sem login)
- Consolidar sub-brands em página indexada única
- Reduzir de 3 para 1 sistema de design (ou documentar claramente quando usar cada)
- Eliminar PDF 2025 ou redirecionar explicitamente para 2026

### Deve permanecer

- Open source (Primer + Octicons + Mona Sans)
- Árvore de decisão de marca (formato interativo)
- Sistema de ilustração 3D
- Sub-brand architecture (Copilot, Security, Actions)

---

## 6. FRAMER — Brand Guidelines

**URLs:** `framer.com/brand`, `framer.com/legal/trademark-guidelines`  
**Marketplace:** `framer.com/marketplace/templates/categories/brand-guidelines`  
**Extração:** designlang.app (Jun/2026), designmd.cc (Mai/2026)

### O que existe

- Página única `/brand` com: Logo Icon, Logo Wordmark, App Icon (inline SVG, copy-to-clipboard)
- 4 cores copiáveis: Black `#000000`, White `#FFFFFF`, Framer Blue `#0099FF`, Framer Deep Blue `#0055FF`
- 9 don'ts visuais (nunca outline, rotacionar, colorir, etc.)
- Link para Trademark Guidelines (v1.0 Fev/2026)
- Marketplace com 4+ templates de brand guidelines de terceiros (BrandFrame $79, Guidy, etc.)
- **Não há:** download ZIP/SVG, preview interativo, dark/light toggle, tipografia documentada

### Paleta (extraída de framer.com ao vivo)

| Token | Hex | Uso |
|-------|-----|-----|
| Canvas | `#090909` | Dark-only brand |
| Text primary | `#FFFFFF` | Texto |
| Text secondary | `#999999` | Muted |
| Framer Blue | `#0099FF` | Accent (edge-only, nunca fill) |
| **Total:** 23 cores, WCAG 100% (0 failing) |
| **Tipografia:** GT Walsheim Medium (display, comercial) + Inter Variable (body) |
| **Arquétipo:** Magician (62% fit) |

### Complexo

1. Asset distribution manual — sem CDN, sem ZIP, apenas copy-to-clipboard
2. Tipografia não documentada oficialmente — GT Walsheim ausente da página `/brand`
3. Apenas dark mode — sem light mode
4. GT Walsheim é comercial — sem substituto oficialmente recomendado
5. SVG inline sem versionamento — sem repositório de assets
6. Regras espalhadas: `/brand` (9 don'ts) vs `/legal/trademark-guidelines` (seção "Please don't")
7. Disclaimer obrigatório complexo para terceiros

### Pode ser simplificado

- Unificar brand page + trademark guidelines em uma página
- Adicionar package ZIP de assets (SVG + PNG + favicon + CSS variables)
- Adicionar preview de logo em diferentes backgrounds
- Adicionar tipografia na página de brand
- Separar "App Icon" (derivado do logotipo)

### Deve permanecer

- Simplicidade da página — poucos assets bem curados
- Don'ts visuais com exemplos (formato mais eficaz que texto)
- Copy-to-clipboard para SVG e hex codes
- Dark-first consistente

---

## 7. CANVA — Brand Hub + Brand Kit

**URLs:** `canvacreative.team/brand`, `canva.com/pro/brand-kit/`, `canva.dev/`  
**Brand System público:** canvacreative.team (conteúdo limitado)  
**API:** `api.canva.com/rest/v1/`, Apps SDK, Connect APIs, MCP Server

### O que existe

- **Brand Kit** (feature Pro/Teams/Enterprise): repositório central de identidade visual
  - Logos (PNG + SVG), cores (paletas hex), fonts (heading/body), brand voice, fotos, vídeos
  - Até 100 marcas por conta
  - Brand Kit Builder: extrai logos/cores/fonts de site ou PDF via IA
  - Replace across designs: substituição em massa
  - Brand Controls: admins restringem cores/fontes/templates
- **Brand Hub** (2024+): centralizador → Brand Kit 2.0 + guidelines contextuais + AI generation
- **Brand System público**: gradient bar (turquesa→azul→roxo→rosa), 3 beats narrativos
- **API pública**: REST, Apps SDK, Connect APIs, MCP Server

### Paleta da marca Canva

| Cor | Hex | Uso |
|-----|-----|-----|
| Turquesa | `#00C4CC` | Gradient core |
| Azul | `#3969E7` | Gradient core |
| Roxo | `#7D2AE7` | Gradient core |
| Rosa | `#FE6F61` | Gradient core |
| Neutro | `#0E1318` | Charcoal |

### Complexo

1. Fragmentação entre brand system público e produto — guidelines públicas têm conteúdo mínimo
2. Nomenclatura sobreposta: "Brand Kit" (recurso) vs "Brand Hub" (guarda-chuva) vs "Brand" (nav)
3. Múltiplos entry points: Brand tab (homepage), Brand tab (editor), Brand Kit settings, Brand Controls, Brand Folders — permissões diferentes
4. AI on-brand generation fragmentada: Magic Design, @Canva, AI-Powered Designs, Brand Templates, Brand Intelligence
5. Funcionalidades espalhadas por planos: Brand Kit (Pro), Brand Controls (Enterprise)
6. Brand System ≠ App UI Kit — gradiente e 3 beats são do brand, não do UI Kit

### Pode ser simplificado

- Nome único para gestão de marca (eliminar ambiguidade Brand Kit/Brand Hub/Brand)
- Unificar modos de AI on-brand em interface única "Generate on-brand"
- Publicar design tokens da marca publicamente (não só App UI Kit)
- Expor gradiente como design token programático
- Consolidar permissões em modelo mais simples de roles

### Deve permanecer

- Brand Kit Builder (extração IA de site/PDF)
- Replace across designs (substituição em massa)
- AI on-brand generation
- API pública (REST + SDK + MCP)
- Suporte SVG para logos

---

## COMPARATIVO CRÍTICO — Por Funcionalidade

| Funcionalidade | Stripe | Linear | Notion | Vercel | GitHub | Framer | Canva |
|---|---|---|---|---|---|---|---|
| **Upload SVG** | ✗ (PNG/JPG) | ✗ (download) | ✗ | ✓ (npm) | ✓ (SVG) | ✗ (copy) | ✓ |
| **Preview live** | ✓ (inline) | ✗ | ✗ | ✓ (componentes) | ✓ (Asset Gen.) | ✗ | ✓ |
| **Dark/Light theme** | ✗ | ✗ | ✗ | ✓ | ✓ | ✗ (só dark) | ✗ |
| **WCAG checker** | ✗ | ✗ | ✗ | ✗ | ✓ (Primer) | ✗ | ✗ |
| **Design tokens export** | ✗ | ✗ | ✗ | ✓ (YAML/CSS) | ✓ (Primer) | ✗ | ✓ (App UI Kit) |
| **Sub-brand support** | ✗ | ✗ | ✗ | ✓ (multi-prod) | ✓ (5 marcas) | ✗ | ✓ (100 marcas) |
| **API pública** | ✓ (Connect) | ✗ | ✗ | ✓ (npm) | ✓ (Primer) | ✗ | ✓ (REST+SDK) |
| **Open source** | ✗ | ✗ | ✗ | ✓ (Geist) | ✓ (Primer) | ✗ | ✗ |
| **Cores totais** | 52 | 30 | 30 | 26+ | múltiplas | 23 | N/D |
| **WCAG taxa** | 77% | 83% | 92% | 67% | ✓ | 100% | N/D |

---

## PONTOS CEGOS — Presentes em todas as 7 marcas

1. **SVG parsing automático** — nenhuma extrai paleta de cores dominantes do SVG para sugerir brand colors
2. **Preview multicanal simultâneo** — ninguém mostra web + email + social + print + dashboard lado a lado
3. **WCAG integrado em tempo real** — nenhum valida contraste durante a configuração
4. **Export universal** — ninguém exporta em todos os formatos (CSS, Tailwind, JSON DTCG, Figma) simultaneamente
5. **Versionamento** — nenhum oferece histórico de mudanças do brand kit
6. **AI brand consistency** — só Canva começando, com múltiplos modos inconsistentes

---

## PADRÃO-OURO POR FUNÇÃO

| Função | Melhor referência | Evidência |
|--------|------------------|-----------|
| **Design tokens públicos** | Vercel Geist | YAML em `/design.md`, versionado, dark/light, agent-first |
| **Open source** | GitHub Primer | Octicons 300+, Mona Sans, Primer React, comunidade ativa |
| **Simplicidade de página** | Linear | 1 página, 3 assets, 3 cores, download direto |
| **API pública** | Stripe + Canva | REST + SDK + MCP, Connect API v2, documentada |
| **Preview multicanal** | Canva Brand Hub | Preview no editor + AI generation context-aware |
| **Sub-brand architecture** | GitHub Primer | 5 sub-brands com árvore de decisão, cores e logos dedicados |
| **Consistência de aplicação** | Stripe | 5 canais simultâneos com preview inline |
| **Don'ts visuais** | Framer | 9 exemplos visuais lado a lado (mais eficaz que texto) |
| **WCAG como foundation** | GitHub Primer | Acessibilidade é seção própria no design system |

---

## RELAÇÃO COM O PROJETO FINANCIA

O Financia **já possui** artefatos de brand que dialogam diretamente com esta auditoria:

| Artefato | Conteúdo | Relação com a auditoria |
|----------|----------|------------------------|
| `docs/AI_BRAND_SCHEMA.md` | Schema JSON v1.0.0: palette, theme, typography, logo, sidebar, header, cards, buttons, inputs, borderRadius, shadows, spacing, animations, planOverrides | Define o modelo de dados que um Brand Studio precisaria consumir/gerar |
| `DESIGN_SYSTEM_AUDIT.md` | 321 hex hardcoded, tokens CSS, dark mode, shadcn/ui, 58 arquivos | Mostra que a aplicação de brand precisa de migração de cores hardcoded para tokens |
| `docs/ARCHITECTURE/MASTER_REFACTOR_PLAN.md` | 12+ documentos consolidados, pendências P0-P3 | Roadmap onde brand studio se inseriria |

**Implicação:** Qualquer Brand Studio para o Financia precisaria:
1. Consumir o schema `AI_BRAND_SCHEMA.md` (formato JSON já definido)
2. Gerar tokens CSS que substituam as 321 cores hardcoded (DESIGN_SYSTEM_AUDIT.md §2.3)
3. Suportar dark/light mode (já existe `theme.mode` no schema)
4. Integrar com o sistema de planos (`planOverrides` no schema)
5. Substituir o sistema atual de SVG inline (38 arquivos, Feather style) por ícones padronizados

---

## NOTAS METODOLÓGICAS

- **Cores totais**: número de cores únicas extraídas ao vivo do site/brand page via ferramentas de terceiros (designlang.app, designmd.cc). Variam conforme a página analisada.
- **WCAG taxa**: percentual de pares de cor que passam WCAG AA (ratio ≥ 4.5:1) conforme extração automatizada. Pode não refletir o sistema completo.
- **Funcionalidades "✗"**: indicam ausência na ferramenta pública de brand — não significam que a empresa não tenha a capacidade internamente.
- **Dados coletados**: Jul/2026. Marcas evoluem constantemente; este audit é snapshot.

---

## FONTES CONSOLIDADAS

### Documentação oficial
- `docs.stripe.com/get-started/account/branding` (via MCP Stripe)
- `linear.app/brand`
- `notion.notion.site/...brand-usage-guidelines`
- `vercel.com/geist/brands`, `vercel.com/design`
- `brand.github.com`, `primer.style`
- `framer.com/brand`, `framer.com/legal/trademark-guidelines`
- `canvacreative.team/brand`, `canva.dev/`

### Extração de tokens (ao vivo)
- `designlang.app` (Stripe, Linear, Notion, Vercel, Framer — Mai-Jun/2026)
- `designmd.cc/benchmarks` (Stripe, Framer)
- `refero.design` (Stripe)
- `getdesign.md` (Linear, Notion, Vercel)
- `brandfetch.com` (Linear, GitHub)

### Análises de design system
- `seedflip.co/blog/vercel-design-system`
- `mainstream.dev/primer`
- `designmd.run/blog/stripe-design-system-breakdown`
- `designsystems.one/design-systems/vercel-geist`
- `figma.com/community` (Linear não-oficial)

### Projeto Financia
- `docs/AI_BRAND_SCHEMA.md` (schema JSON de brand)
- `DESIGN_SYSTEM_AUDIT.md` (auditoria de design system)
- `docs/ARCHITECTURE/MASTER_REFACTOR_PLAN.md` (plano mestre)

---

*Audit conduzido via GATE DE CONSOLIDAÇÃO (CLAUDE.md §566-586): 7 subagentes paralelos + MCP Stripe + 3 docs do projeto. Prova de Leitura apresentada com 11 documentos, matriz de consolidação com 5 conflitos resolvidos.*
