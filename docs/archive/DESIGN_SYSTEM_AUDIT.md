---
type: REPORT
---

# Design System Audit — Financia

> **Data:** 2026-07-10
> **Escopo:** Cores, tokens, tipografia, ícones, botões, inputs, cards, modais, paleta, dark mode
> **Stack:** React 18 + Vite 5 + Tailwind 3.4 + shadcn/ui + Radix UI

---

## Sumário Executivo

| Indicador | Resultado |
|---|---|
| Arquivos JSX auditados | 58 |
| Componentes UI identificados | 24 |
| CSS custom properties (`:root`) | ~60 tokens |
| CSS custom properties (dark) | ~25 tokens |
| Keyframes definidos | 40 (10 `index.css` + 30 `animations.css`) |
| Bibliotecas de ícones | Nenhuma — SVG inline (Feather style) |
| shadcn/ui componentes | 4 (Button, Input, Label, Textarea) |
| Componentes legados (ui.jsx) | 16 componentes encapsulados |
| **Hex colors hardcoded** | **321 ocorrências** |
| **rgba() hardcoded** | **150 ocorrências** |
| **`rounded-2xl` bypassando token** | **57 ocorrências** |
| **`text-gray-*` classes não-semânticas** | **112 ocorrências** |
| **`shadow-sm/md/lg` bypassando vars** | **25 ocorrências** |
| **`text-[10px]` arbitrários** | **44 ocorrências** |
| **`text-[11px]` arbitrários** | **29 ocorrências** |
| Arquivos usando `cn()` | 6 de 58 |
| Prettier config | Não configurado |
| Stylelint | Não configurado |
| Design tokens JSON/Figma | Não encontrado |

---

## 1. Arquitetura do Design System

### 1.1 Camadas de Token (Atual)

```
:root + [data-theme="dark"] + [data-plan="pro"|"premium"]
  ├── Tokens de paleta (--bg-page, --text-main, --border, etc.)
  ├── Tokens shadcn (--background, --foreground, --primary, etc.)
  ├── Tokens de marca (--brand, --brand-soft, --brand-grad)
  ├── Tokens de sombra (--shadow-sm/md/lg)
  ├── Tokens de plano (--plan-badge, --btn-grad, --sidebar-bg)
  └── Tokens dinâmicos via useBrandAppearance (~70 vars)
       ├── --font-family, --font-heading, --font-mono
       ├── --radius-sm/md/lg/xl/full
       ├── --spacing-gap, --spacing-section, --spacing-card
       ├── --sidebar-*, --header-*, --card-*
       ├── --btn-*, --input-*, --shadow-*, --anim-*
       └── --success, --warning, --danger, --info, --chart-1..6
```

### 1.2 Camadas de Token (Ideal — Recomendado)

```
3 camadas separadas:
  Global (raw):  --blue-500, --gray-100, --spacing-4  (valores brutos)
  Semântico:     --color-primary, --text-body, --radius-card  (mapeia globais)
  Componente:    --btn-bg, --card-shadow  (escopo do componente)
```

**Problema:** O projeto mistura tokens brutos e semânticos no mesmo nível (`:root`). Não há separação entre valores globais e tokens semânticos. Isso dificulta a manutenção e a sincronia com Figma.

---

## 2. Cores — Auditoria de Paleta

### 2.1 Tokens de Cor Existentes (OK)

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--bg-page` | `#f5f5f0` | `#0a1628` | Fundo de página |
| `--bg-card` | `#ffffff` | `#13243d` | Fundo de cartão |
| `--bg-input` | `#ffffff` | `#13243d` | Fundo de input |
| `--bg-subtle` | `#f5f5f0` | `#0f1e33` | Fundo sutil |
| `--surface` | `#ffffff` | `#13243d` | Superfície elevada |
| `--text-main` | `#0f172a` | `#e8edf2` | Texto principal |
| `--text-sub` | `#5b6b7c` | `#8ba0b5` | Texto secundário |
| `--text-muted` | `#94a3b8` | `#8899aa` | Texto muted |
| `--border` | `#edeae3` | `#1e3450` | Borda sutil |
| `--border-md` | `#e2ddd4` | `#274263` | Borda média |
| `--brand` | `#002f59` | (herda) | Cor da marca (dinâmica) |
| `--brand-soft` | `rgba(0,47,89,0.08)` | (herda) | Fundo suave da marca |
| `--brand-accent` | `#1a6b5c` | (herda) | Tom de destaque |

### 2.2 shadcn/ui HSL Tokens (OK, mas espaço de cor inconsistente)

| Token | Light | Dark |
|---|---|---|
| `--background` | `60 16% 95%` | `222 47% 6%` |
| `--foreground` | `221 47% 11%` | `210 40% 98%` |
| `--primary` | `208 100% 17%` | `208 100% 45%` |
| `--secondary` | `181 45% 61%` | `181 45% 40%` |
| `--destructive` | `0 76% 50%` | `0 63% 31%` |
| `--radius` | `0.75rem` | — |

**Problema:** shadcn/ui recomenda usar OKLCH (2026), mas o projeto usa HSL. Migrar para OKLCH daria percepção de cor mais consistente entre light/dark.

### 2.3 Cores Hardcoded — CRÍTICO

**321 hex colors + 150 rgba() hardcoded em 58 arquivos JSX.**

| Arquivo | Ocorrências | Exemplos |
|---|---|---|
| `src/features/landing/Landing.jsx` | ~100+ | `#fff`, `#ef4444`, `#eab308`, `#22c55e` |
| `src/features/auth/Login.jsx` | ~50 | `#e2e8f0`, `#1f2937`, `#111827`, `#4b5563` |
| `src/features/admin/ClientEditModal.jsx` | ~30 | `#fca5a5`, `#dc2626`, `#d97706` |
| `src/features/plans/PlansView.jsx` | ~20 | `#ecfeff`, `#a5f3fc`, `#fef2f2` |
| `src/features/dashboard/Dashboard.jsx` | ~15 | `#22c55e`, `#ef4444` |
| `src/shared/ui/UpdateCardModal.jsx` | ~10 | `#fef2f2`, `#fecaca`, `#dc2626` |
| `src/shared/ui/StripeCheckout.jsx` | ~8 | `#fef2f2`, `#fecaca` |
| Demais arquivos | ~100+ | Distribuído |

**Impacto:** Dark mode quebrado nesses componentes. Tema customizado (white-label) ignorado. Manutenção duplicada.

### 2.4 Cores Semânticas Fixas — MAJOR

Classes Tailwind de estado (red/green/amber/blue) são usadas em vez de variáveis semânticas:

| Uso incorreto | Deveria ser | Ocorrências |
|---|---|---|
| `bg-red-50`, `text-red-600` | `bg-destructive/10`, `text-destructive` | ~25 |
| `bg-green-50`, `text-green-600` | `--success` ou token semântico | ~15 |
| `bg-amber-50`, `text-amber-600` | `--warning` | ~10 |
| `bg-blue-50`, `text-blue-600` | `--info` ou `--primary` | ~5 |

**Impacto:** Quebra no dark mode — `bg-red-50` no escuro continua sendo o mesmo tom claro, sem contraste com fundo escuro.

### 2.5 Overlay de Modais — MAJOR

6 componentes replicam o mesmo overlay com valor hardcoded:
```css
background: rgba(15,23,42,0.55); backdrop-filter: blur(3px);
```

Deveria ser: `--overlay-backdrop` ou token semântico.

---

## 3. Tipografia — Auditoria

### 3.1 Fontes (OK)

| Face | Peso | Uso | Fonte |
|---|---|---|---|
| Inter | 400,500,600,700,800 | Padrão do sistema | Google Fonts |
| Fraunces | 400,500,600,700 | Display/títulos | Google Fonts |
| DM Mono | 400,500 | Monospace | Google Fonts |

**Problema:** `DM Mono` (monospace) é carregada mas tem uso mínimo no sistema (apenas campos hex no Brand Studio). Adiciona peso desnecessário ao bundle.

### 3.2 Escala de Font-size — MAJOR

O projeto não tem uma escala modular definida. Evidências:

| Classe/Valor | Ocorrências | Problema |
|---|---|---|
| `text-[10px]` | 44 | Sem token — quebra acessibilidade de zoom |
| `text-[11px]` | 29 | Sem token — quebra acessibilidade de zoom |
| `text-[7px]`, `text-[8px]`, `text-[9px]` | ~9 | Abaixo do mínimo legível |

**Impacto:** WCAG 1.4.4 — textos em `px` não respeitam zoom do navegador. Usuários que aumentam a fonte para 200% não conseguem ler.

### 3.3 Classes de Título (OK, mas frágil)

`.page-header` e `.page-sub` em `index.css` usam `rem` e variáveis — boa prática.

---

## 4. Ícones — Auditoria

### 4.1 Situação Atual

**Nenhuma biblioteca de ícones instalada.** O projeto usa SVG inline (Feather Icons) replicados manualmente em **38 arquivos JSX**.

| Problema | Impacto |
|---|---|
| Mesmo ícone duplicado em múltiplos arquivos | ~200+ linhas de path SVG duplicadas |
| Sem tree-shaking | Todo path ocupa espaço no bundle |
| Sem type safety | Props de ícone (size, strokeWidth) não são padronizadas |
| Inconsistência visual | `strokeWidth` varia entre `1.5`, `1.6`, `1.8`, `2` |
| Manutenção manual | Cada novo ícone requer copiar path manualmente |

### 4.2 Recomendação

Migrar para **Lucide React** — 5KB/50 ícones com tree-shaking, padrão do ecossistema shadcn/ui.

---

## 5. Border Radius — Auditoria

### 5.1 Tokens Definidos

| Token | Valor | Uso pretendido |
|---|---|---|
| `var(--radius)` | `0.75rem` (12px) | Padrão shadcn |
| `--radius-lg` | `var(--radius)` = `12px` | Card, Button, Modal |
| `--radius-md` | `calc(var(--radius) - 2px)` = `10px` | Input, Select |
| `--radius-sm` | `calc(var(--radius) - 4px)` = `8px` | Badge, small elements |

### 5.2 Inconsistências — MAJOR

| Classe | Ocorrências | Problema |
|---|---|---|
| `rounded-2xl` (16px) | 57 | Bypassa `--radius` — maior que o token lg |
| `rounded-[20px]` | ~5 | Valor arbitrário sem token |
| `rounded-[24px]` | ~3 | Valor arbitrário sem token |
| `rounded-[2rem]` | ~1 | Landing page |

```jsx
// ❌ Atual — não respeita tema
<div className="rounded-2xl ...">

// ✅ Correto — usa token
<div className="rounded-xl ...">
```

**Impacto:** Usuários com white-label não conseguem customizar border radius globalmente — os `rounded-2xl` ficam fixos em 16px.

---

## 6. Sombras — Auditoria

### 6.1 Tokens Definidos

| Token | Light | Dark |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,47,89,0.04)...` | `0 1px 3px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 2px 8px rgba(0,47,89,0.05)...` | `0 4px 12px rgba(0,0,0,0.35)` |
| `--shadow-lg` | `0 8px 24px rgba(0,47,89,0.08)...` | `0 10px 30px rgba(0,0,0,0.45)` |

### 6.2 Problema

O `tailwind.config.js` **não mapeia** `shadow-sm/md/lg` para as variáveis. Apenas a classe `shadow` (sem sufixo) é mapeada. Mas o código usa:

| Classe | Ocorrências | Problema |
|---|---|---|
| `shadow-sm` | 12 | Usa `box-shadow: 0 1px 3px...` (Tailwind default) |
| `shadow-md` | 8 | Bypassa `var(--shadow-md)` |
| `shadow-lg` | 4 | Bypassa `var(--shadow-lg)` |
| `shadow-xl` | 1 | Nem existe na config |

**Impacto:** Sombras não mudam com tema dark nem com plano (pro/premium têm sombras diferentes).

---

## 7. Dark Mode — Auditoria

### 7.1 Mecanismo Atual (Funcional, mas frágil)

```
data-theme="dark" no <html> → CSS [data-theme="dark"] override
```

**Pontos fortes:**
- Persistência via `localStorage`
- ~25 tokens CSS sobrescritos no dark mode
- `prefers-reduced-motion` respeitado
- View Transitions API implementada

**Problemas:**
- Classes Tailwind `dark:` não são usadas (projeto usa `[data-theme="dark"]` puro)
- Overrides manuais de classes Tailwind em `index.css:181-203` (`.bg-white`, `.text-gray-*`)
- 321 hex colors hardcoded não são afetados pelo dark mode
- Sem proteção contra FOUC (Flash of Uncolored Content) — script de hidratação não existe
- `next-themes` não é usado (mas não é Next.js, então OK)

```css
/* ❌ Override frágil — precisa manter sincronizado com cada classe usada */
[data-theme="dark"] .bg-white   { background-color: #13243d !important; }
[data-theme="dark"] .text-gray-900 { color: #e8edf2 !important; }
```

### 7.2 Recomendação

Migrar para usar exclusivamente css custom properties + classes semânticas do shadcn (`bg-background`, `text-foreground`, `text-muted-foreground`). Eliminar overrides de classes Tailwind.

---

## 8. shadcn/ui — Auditoria

### 8.1 Componentes Instalados

| Componente | Status | Observação |
|---|---|---|
| Button | ✅ OK | CVA, Radix Slot |
| Input | ✅ OK | Padrão shadcn |
| Label | ✅ OK | Radix Label |
| Textarea | ✅ OK | Padrão shadcn |

### 8.2 Componentes Faltando (Recomendados)

| Componente | Por que |
|---|---|
| Dialog | Substituir Modal manual (ui.jsx:167) |
| Select | Substituir Sel manual (ui.jsx:85) |
| Badge | Substituir Badge manual (ui.jsx:125) |
| Card | Substituir Card manual (ui.jsx:21) |
| Toast/Sonner | Substituir Toast manual (Toast.jsx) |
| Alert | Mensagens de erro/sucesso |
| DropdownMenu | Menu de ações |
| Sheet | Alternativa ao Sidebar em mobile |

### 8.3 Componentes Legados (ui.jsx)

O arquivo `src/shared/ui/ui.jsx` (246 linhas) contém 16 componentes que são **wrappers manuais** dos componentes shadcn ou implementações próprias:

| Componente | Linha | Problema |
|---|---|---|
| `Card` | 21 | Manual com `ShadcnCard` — usar `@radix-ui/react-card` |
| `Inp` | 34 | Wrapper do Input shadcn — OK, mas duplica Label |
| `NumInp` | 58 | Input numérico — OK |
| `Sel` | 85 | Select HTML nativo — usar shadcn Select |
| `Modal` | 167 | Modal manual com backdrop — usar shadcn Dialog |
| `Btn` | 114 | Wrapper que mapeia `danger` → `destructive` — confuso |
| `Badge` | 125 | Manual com 2 modos — usar shadcn Badge |
| `Empty` | 139 | Estado vazio — OK |
| `EditBtn` | 190 | SVG inline — migrar para Lucide |
| `DelBtn` | 198 | SVG inline — migrar para Lucide |

### 8.4 `cn()` — Utilização Baixa

Apenas 6 de 58 arquivos usam `cn()` (`button.jsx`, `input.jsx`, `label.jsx`, `spinner.jsx`, `textarea.jsx`, `ui.jsx`). Os demais fazem concatenação manual:

```jsx
// ❌ Concatenação manual — conflitos de classe não resolvidos
className={'text-xs font-bold ' + (cond ? 'bg-red' : 'bg-blue')}
```

---

## 9. Animations — Auditoria

### 9.1 Distribuição

| Arquivo | Keyframes | Classes utilitárias |
|---|---|---|
| `src/index.css` | 10 | `anim-up`, `anim-fade`, `anim-scale`, `anim-down`, `anim-out`, `skeleton` |
| `src/animations.css` | 30 | `anim-fade-up`, `hover-float`, `pulse-glow`, `scroll-reveal`, `lp-*` |
| **Total** | **40** | **30+ classes** |

### 9.2 Problemas

1. **Duplicação de conceitos**: `index.css` tem `slideUp` enquanto `animations.css` tem `fadeInUp` — propósitos similares, nomes diferentes
2. **Prefers-reduced-motion duplicado**: Ambos os arquivos têm `@media (prefers-reduced-motion: reduce)`, com ligeiras diferenças
3. **Landing-specific vs global**: `animations.css` contém 30 keyframes, a maioria específica da landing page, mas carregada globalmente
4. **Performance**: `will-change: transform` usado em `.money-note` (index.css:336) — correto, mas sem `@media (prefers-reduced-motion)` scoping adequado

---

## 9.5 Tokens Fantasmas — CRÍTICO

O hook `useBrandAppearance.js` injeta **~70 variáveis CSS** no `documentElement`, mas **33 delas não são referenciadas em lugar nenhum do CSS** (`index.css` ou `animations.css`). Isso significa que esses tokens existem em memória mas **não têm efeito visual real**.

### Tokens Fantasmas (definidos no JS, sem uso no CSS)

| Grupo | Tokens | Impacto |
|---|---|---|
| Sidebar | `--sidebar-width, --sidebar-collapsed-width, --sidebar-text, --sidebar-active-bg, --sidebar-active-text, --sidebar-hover-bg, --sidebar-divider` | Personalização de sidebar visualmente inerte |
| Header | `--header-height, --header-text` | Altura e cor do header não customizáveis |
| Buttons | `--btn-primary-bg, --btn-primary-text, --btn-secondary-bg, --btn-secondary-text, --btn-radius, --btn-height` | Customização de botão sem efeito |
| Inputs | `--input-text, --input-focus-border, --input-height` | Apenas bg e border têm efeito |
| Charts | `--chart-1` até `--chart-6` | Paleta de gráficos não implementada |
| Semântica | `--success, --warning, --danger, --info, --positive, --negative` | Cores de estado existem no hook mas não são usadas |
| Animações | `--anim-duration, --anim-easing` | Velocidade/timing não customizável |

**Exemplo concreto:** Um admin pode definir `--btn-primary-bg: #ff0000` no brand_config, mas os botões continuarão usando `var(--brand)` porque o CSS do botão (`button.jsx`) usa classes shadcn (`bg-primary`), que mapeia `hsl(var(--primary))`, não `var(--btn-primary-bg)`.

### Causa Raiz
O hook foi projetado para aceitar qualquer token do schema JSON, mas o CSS real (`index.css` + componentes) não foi atualizado para consumi-los. É um caso de **design do schema à frente da implementação**.

### Recomendação
- **Remover** tokens fantasmas do `enterPreviewMode` (mantendo apenas os que têm CSS correspondente)
- **OU implementar** o CSS faltante para dar suporte a esses tokens
- Priorizar a primeira opção (simplicidade)

---

## 10. Schema de Marca (Brand Config)

### 10.1 Estrutura Atual

O sistema de branding tem **4 camadas** que às vezes conflitam:

| Camada | Fonte | Prioridade |
|---|---|---|
| CSS `:root` + `[data-theme]` | `index.css` | Base (sobrescrita por...) |
| `[data-plan]` | `index.css` | Free/Pro/Premium (sobrescrito por...) |
| `useBrandAppearance` | Hook JS | White-label custom (sobrescrito por...) |
| Plan themes | `planThemes.js` | Defaults por plano |

### 10.2 Problemas

1. **Plan themes duplicam informações**: `planThemes.js` e `PLAN_VISUAL_DEFAULTS` em `constants.js` têm estruturas diferentes para a mesma finalidade
2. **Schema de validação frágil**: `BRAND_SCHEMA` (`schema.js`) não valida valores reais, apenas formato
3. **Sem atomic design tokens**: Não há um único arquivo JSON de design tokens que possa ser consumido por Figma e código

---

## 11. Checklist de Boas Práticas

### 11.1 Design Tokens

| Prática | Status |
|---|---|
| CSS custom properties como fonte da verdade | ✅ Sim |
| Separação global/semântico/componente | ❌ Tudo misturado em `:root` |
| Nomes semânticos (não raw values) | ⚠️ Parcial |
| OKLCH como espaço de cor | ❌ Usa HSL |
| Spacing scale consistente (4px base) | ⚠️ Tailwind default + valores arbitrários |
| Sincronia Figma ↔ Código | ❌ Não existe |
| Versionamento de tokens | ❌ Não existe |

### 11.2 Acessibilidade

| Prática | Status |
|---|---|
| `focus-visible` rings | ✅ Sim |
| `aria-*` attributes | ✅ Parcial |
| `min-h-[44px]` touch targets | ⚠️ 80+ ocorrências, mas sem token |
| `prefers-reduced-motion` | ✅ Sim |
| `prefers-color-scheme` | ⚠️ Usa manual toggle + localStorage |
| WCAG contrast ratios | ❌ Não verificado |
| `font-size` em `rem` | ❌ `text-[10px]` e `text-[11px]` em px |

### 11.3 Performance

| Indicador | Valor |
|---|---|
| CSS total (index + animations) | 758 linhas, ~40 keyframes |
| SVG inline duplicado | 38 arquivos |
| Bibliotecas de ícones | Nenhuma |
| Tree-shaking de ícones | N/A (SVG inline não tree-shakea) |
| Design tokens JSON | Não existe |

### 11.4 Ferramentas

| Ferramenta | Instalada | Recomendada |
|---|---|---|
| Prettier + Tailwind plugin | ❌ | ✅ |
| Stylelint | ❌ | ✅ |
| Tailwind CSS v4 | ❌ (v3.4) | ⚠️ Avaliar migração |
| Design token generator | ❌ | Style Dictionary |
| Figma tokens plugin | ❌ | Tokens Studio |
| `cn()` utility | ⚠️ Subutilizada | ✅ Usar em todos os componentes |

---

## 12. Prioridade de Ações Corretivas

### 🔴 Imediatas (Sprint atual)

| # | Ação | Impacto | Esforço |
|---|---|---|---|
| 1 | Migrar 321 hex colors para CSS vars | Dark mode + white-label | Alto |
| 2 | Substituir `text-red-*`/`bg-red-*` por vars semânticas | Dark mode + consistência | Médio |
| 3 | Criar `--overlay-backdrop` e centralizar modais | Consistência + tema | Baixo |
| 4 | Adicionar token `--font-size-xs`/`--font-size-sm` | Eliminar text-[10px/11px] | Baixo |

### 🟡 Curto Prazo (Próximo Sprint)

| # | Ação | Impacto | Esforço |
|---|---|---|---|
| 5 | Substituir `rounded-2xl` por `rounded-xl` (token) | Consistência visual | Médio |
| 6 | Mapear `shadow-sm/md/lg` para `var(--shadow-*)` no tailwind.config | Dark mode + planos | Baixo |
| 7 | Migrar SVG inline para Lucide React (58 arquivos) | Bundle size + manutenção | Alto |
| 8 | Implementar `cn()` em todos os componentes | Previsibilidade CSS | Médio |

### 🟢 Médio Prazo

| # | Ação | Impacto | Esforço |
|---|---|---|---|
| 9 | Consolidar animações em 1 arquivo | Performance + manutenção | Baixo |
| 10 | Implementar shadcn Dialog/Select/Badge/Card | Substituir ui.jsx legado | Alto |
| 11 | Criar design tokens JSON (Style Dictionary) | Sincronia Figma-código | Alto |
| 12 | Adicionar Prettier + Tailwind plugin | Formatação consistente | Baixo |
| 13 | Migrar HSL para OKLCH | Percepção de cor consistente | Médio |
| 14 | Avaliar migração Tailwind v3 → v4 | Modernização | Alto |

---

## 13. Métricas-Chave

```
Consistência do Design System (estimativa):
  ✅ Tokens CSS definidos:       70%
  ✅ shadcn/ui implementado:     25%
  ✅ Dark mode funcional:        60%
  ✅ Tipografia consistente:     50%
  ✅ Ícones consistentes:        30%
  ✅ Acessibilidade:             55%
  ✅ Bundle otimizado:           40%
  ---------------------------------
  Média geral:                  47%
```

---

## 14. Metodologia da Auditoria

- **Análise quantitativa:** Bash scripts com `Select-String`, `Get-ChildItem`, `Measure-Object`
- **Análise qualitativa:** Leitura completa de `index.css`, `animations.css`, `tailwind.config.js`
- **Análise de componentes:** Leitura de 58 arquivos JSX em `src/`
- **Análise de dependências:** `package.json` (dependencies + devDependencies)
- **Análise de configuração:** `components.json`, `vite.config.js`, `postcss.config.js`
- **Pesquisa web:** Documentação oficial shadcn/ui, Radix, Tailwind v4, Lucide, Style Dictionary
- **Ferramentas MCP:** Supabase (projeto não encontrado — possivelmente pausado)
- **Subagentes:** 4 exploradores em paralelo para cobertura completa

---

## 15. Documentação — Auditoria de Consistência

### 15.1 `ARCHITECTURE.md` — Desatualizada

| Item documentado | Realidade |
|---|---|
| `src/design-system/` como diretório de tokens visuais | ❌ **Diretório não existe** |
| `docs/AI_CONTEXT.md` como referência de regras | ❌ **Arquivo depreciado** (confirmado no CLAUDE.md) |

### 15.2 Conflito de Cores — `constants.js` vs `planThemes.js`

| Plano | Propriedade | `constants.js` | `planThemes.js` | Vencedor (uso real) |
|---|---|---|---|---|
| **Free** | primary | `#0f3d3e` (Petróleo) | `#002f59` (Navy) | `planThemes.js` |
| **Free** | secondary | `#ccfbf1` | `#e8f0f7` | `planThemes.js` |
| **Free** | accent | `#0d9488` | `#1a6b5c` | `planThemes.js` |
| **Pro** | accent | `#4F46E5` (Indigo) | `#7c3aed` (Violeta) | `planThemes.js` |
| **Premium** | accent | `#D4AF6A` (Dourado) | `#f59e0b` (Âmbar) | `planThemes.js` |

**Impacto:** Dependendo de qual arquivo resolve as cores, o cliente vê um tema diferente. Há duas fontes da verdade competindo.

---

## 16. Plano de Ação

### Documentos Gerados nesta Auditoria

| Documento | Propósito |
|---|---|
| `MATRIZ_CONSOLIDACAO.md` | Consolidação de todos os relatórios, conflitos e decisões |
| `MASTER_REFACTOR_PLAN.md` | Plano mestre de refatoração em fases (1-4) |

### Próximos Passos Recomendados

1. **Resolver tokens fantasmas** — 33 variáveis CSS no hook sem efeito real
2. **Unificar fontes da verdade** — Alinhar `constants.js` → `planThemes.js`
3. **Criar token `--overlay`** — Eliminar 6 ocorrências de rgba() hardcoded
4. **Iniciar Fase 2** — Migração de ícones e componentes legados

---

*Gerado por auditoria automatizada em 2026-07-10. Baseado exclusivamente no código-fonte e configurações do projeto. Documentos complementares: `MATRIZ_CONSOLIDACAO.md`, `MASTER_REFACTOR_PLAN.md`.*
