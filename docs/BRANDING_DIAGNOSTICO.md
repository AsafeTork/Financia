---
type: WORKING
status: APPROVED
owner: Branding
version: 1.0
reviewed_by: auto-revisão + segunda auditoria concluídas
ready_for_integration: true
---

# BRANDING — Diagnóstico da Área

## 1. Escopo

Análise completa da área de Branding do Financia: schema, schemaRegistry, validação, presets, planThemes, componentes React (BrandStudioView, LogoSchemes, PreviewGeral, PlanTabsEditor, BrandGlobalEditor, ModuleEditor), hook useBrandStudio, previewValidator, responseProcessor, hook useBrandAppearance, migration SQL, e documentação AI_BRAND_SCHEMA.md.

---

## 2. Estrutura Atual

```
src/features/branding/
  index.js                  (15 exports)
  schema.js                 (222 linhas) — BRAND_SCHEMA flat + defaults
  schemaRegistry.js         (703 linhas) — sistema modular de registro + validadores
  validateBrandConfig.js    (180 linhas) — validador JSON Schema manual
  previewValidator.js       (119 linhas) — validação WCAG + conflitos
  responseProcessor.js      (37 linhas) — processa resposta JSON da IA
  presets.js                (185 linhas) — gerenciamento de presets (Dexie + oficiais)
  planThemes.js             (93 linhas) — temas por plano
  useBrandStudio.js         (159 linhas) — hook principal do Brand Studio
  BrandStudioView.jsx       (270 linhas) — view principal + logo editor
  BrandGlobalEditor.jsx     (98 linhas) — editor de identidade global
  ModuleEditor.jsx          (214 linhas) — editor genérico de módulos
  LogoSchemes.jsx           (247 linhas) — editor de cores da logo + SVG
  PreviewGeral.jsx          (112 linhas) — preview visual da paleta
  PlanTabsEditor.jsx        (231 linhas) — editor de cores por plano

src/shared/hooks/useBrandAppearance.js  (278 linhas) — aplica CSS variables

supabase/migrations/20260707000001_brand_config_jsonb.sql  (49 linhas)

docs/AI_BRAND_SCHEMA.md  (264 linhas)
```

**Total: ~2.625 linhas na área de Branding + 278 no hook compartilhado.**

> **Alinhamento com MASTER_REFACTOR_PLAN.md**: O plano mestre já identificou: `var` → `const/let` (299 ocorrências, P3-2), schemaRegistry superdimensionado (P1-5), useBrandStudio oversized (P1-6), e design tokens em 2 lugares (P3-5). O presente diagnóstico confirma e expande esses achados com 22 problemas detalhados.

---

## 3. Pesquisa & Referências Externas

### 3.1 Melhores Práticas 2026 — Identificadas via Web Search + Web Fetch

| Fonte | Descoberta |
|---|---|
| `bobkov.dev` — Semantic Tokens 2026 | Primitivos NUNCA devem ser referenciados em componentes. Camada semântica resolve multi-brand. |
| `framingui.com` — CSS Custom Properties | Organização por categoria (color, spacing, typography, border, shadow, animation) + temas separados |
| `sujeet.pro` — DTCG Format Module 2025.10 | W3C Design Tokens Community Group padronizou JSON — hierarquia: primitivo → semântico → componente |
| `svggenie.com` — Brand Kit para React | Logo como componente React com `currentColor`, dark mode via CSS variables, Tailwind tokens |
| `tiny-svg.actnow.dev` — SVG no React | SVGR para ícones customizados, `<img>` para SVGs decorativos, `currentColor` para theming |
| `handoffpro.dev` — Design Tokens React | ThemeProvider com Context API para multi-brand, Style Dictionary para build |
| `feature-sliced.design` — Tokens como camada | Tokens como "shared foundation" da arquitetura, não estilo |
| `opendesigner.io` — Recreating Stripe/Linear/Vercel | DESIGN.md como formato de descrição de design system para agentes AI |
| `refero.design` — Stripe tokens ao vivo | 321+ tokens CSS; `currentColor` e `gradient` como padrão |
| `tryexponent.com` — Branding Fintech 2026 | Consistência visual + confiança + personalização como pilares |
| Stitch Design System (Google) | Token-driven, multi-brand, dark mode obrigatório |
| Atlassian Design Tokens | Ciclo de vida: active → deprecated → deleted, com linters |

### 3.2 Padrão-ouro para Brand Studio

1. **Tokens primitivos + semânticos**: primitivos (`--color-blue-500`) nunca referenciados em componentes; semânticos (`--color-action-primary`) mapeiam primitivos por contexto (brand, dark mode)
2. **Fonte única da verdade**: defaults definidos UMA vez, em UM lugar; componentes importam do source
3. **CSS Variables + runtime**: `currentColor` para SVG, `data-theme` para dark mode, JavaScript para toggle
4. **SVG como componente React**: inline SVG com props `color`, `size`, `className` — dark mode via `currentColor`
5. **Validação com ferramentas**: Style Dictionary v4, DTCG format, linters automáticos (Stylelint, ESLint)
6. **TypeScript**: branded types para hex, tokens como tipos gerados
7. **Tree-shakeable**: sem singleton module-level state

---

## 4. Problemas Encontrados

### P1 — SISTEMA DE VALIDAÇÃO DUPLICADO (GRAVE)

Dois validadores completamente independentes para os mesmos dados:

- `validateBrandConfig.js` valida contra `BRAND_SCHEMA` (schema.js — formato **flat**)
- `schemaRegistry.validateAgainstModules()` valida contra módulos registrados (formato **modular**)

**Evidência**: `validateBrandConfig.js:165` chama `validateField(config, BRAND_SCHEMA, '$', errors)` mas o `schemaRegistry.js:58` itera sobre `_modules`. Nenhum dos dois chama o outro.

**Impacto**: Um JSON válido para um pode ser inválido para outro. Sem garantia de consistência.

---

### P2 — DUAS ESTRUTURAS DE SCHEMA COEXISTINDO (GRAVE)

**Flat (schema.js):**
```json
{ "schemaVersion": "1.0.0", "palette": { "primary": "#002f59" }, "theme": { "mode": "light" } }
```

**Modular (schemaRegistry.js):**
```json
{ "schemaVersion": "1.0.0", "modules": { "palette": { "primary": "#002f59" } } }
```

**Evidência**:
- `useBrandAppearance.js:54`: `var pal = cfg.palette || (cfg.modules && cfg.modules.palette) || {};` — compatibilidade explícita
- `AI_BRAND_SCHEMA.md` documenta apenas o formato flat
- `presets.js` e `planThemes.js` usam o formato modular
- `responseProcessor.js` usa o formato modular

**Arquivos afetados**: schema.js, schemaRegistry.js, AI_BRAND_SCHEMA.md, useBrandAppearance.js, responseProcessor.js, useBrandStudio.js

---

### P3 — DEFAULTS DUPLICADOS EM 6 LUGARES (GRAVE)

| Arquivo | Onde | Exemplo |
|---|---|---|
| `schema.js` | PALETTE_DEFAULTS, TYPOGRAPHY_DEFAULTS etc. | `primary: '#002f59'` |
| `schemaRegistry.js` | `registerModule('palette', { defaults: {...} })` | `primary: '#002f59'` |
| `BrandStudioView.jsx` | `ORIGINAL_LOGO` | `blue: '#002f59'` |
| `LogoSchemes.jsx` | `ORIGINAL` | `blue: '#002f59'` |
| `PlanTabsEditor.jsx` | `defaultPalette()` | `primary: '#002f59'` |
| `planThemes.js` | DEFAULT_PLAN_THEMES | `primary: '#002f59'` |

**Impacto**: Alterar um default requer alterar 6 arquivos. Já existem divergências (ex: palette defaults em schema.js não incluem `success/warning/danger/info`, mas PlanTabsEditor inclui).

---

### P4 — SVG LOGO DUPLICADO EM 2 COMPONENTES (MÉDIO)

`buildCheckPath()`, `ORIGINAL_LOGO`, e `ELEMENTS_CONFIG` estão definidos em:

- `LogoSchemes.jsx:3-23` (componente exportado)
- `BrandStudioView.jsx:91-110` (inline no mesmo arquivo)

**Evidência**: Comparar `LogoSchemes.jsx:7-12` com `BrandStudioView.jsx:91-96` — arrays idênticos. `LogoSchemes.jsx:14-17` com `BrandStudioView.jsx:103-106` — idênticos.

---

### P5 — MIX DE FUNÇÕES PURAS E COMPONENTE NO MESMO ARQUIVO (MÉDIO)

`LogoSchemes.jsx` exporta:
- `generateLogoSvg(colors)` — função pura (importada por BrandStudioView e AdminPanel)
- `logoSvgToDataUrl(svgMarkup)` — função pura
- `LogoSchemes` — componente React default export

Melhor prática: funções puras em `logoUtils.js`, componente em `LogoSchemes.jsx`.

---

### P6 — PALETA COM 5 DEFINIÇÕES DIFERENTES (GRAVE)

| Fonte | Campos de cor |
|---|---|
| `schema.js` palette | 13 campos (primary..borderMd) |
| `schemaRegistry.js` palette | 12 campos (sem borderMd, com mode) |
| `PlanTabsEditor.jsx` PALETTE_FIELDS | 16 campos (adds success, warning, danger, info) |
| `useBrandAppearance.js collectTokensFromBrand` | 22 campos (adds positive, negative, chart1-6) |
| `previewValidator.js` | 5 campos (primary, bgPage, textMain, accent, secondary, bgCard) |

**Impacto**: UI do PlanTabsEditor permite editar `success/warning/danger/info` mas `schema.js` não os define — o validador vai rejeitar. `useBrandAppearance` aplica `positive/negative/chart1-6` no CSS mas não há UI para editá-los.

---

### P7 — MUTABLE GLOBAL STATE (MÉDIO)

- `schemaRegistry.js`: `var _modules = {}; var _order = [];` — singleton, mutável, não tree-shakeable
- `presets.js`: `var _userPresets = []; var _presetIdCounter = 0; var _onChange = null;` — callback-based
- `useBrandAppearance.js`: `var _savedPreviewTokens = null;` — module-level

**Impacto**: Testes precisam resetar estado global. Dois Brand Studios na mesma página quebram. SSR falha.

---

### P8 — responseProcessor.js SEM VALIDAÇÃO (MÉDIO)

`responseProcessor.js:23-36` — `buildProposedJson` aceita qualquer JSON, aplica `Object.assign` sem validar, usa fallbacks hardcoded. Nenhuma chamada a `validateBrandConfig` ou `validateAgainstModules`.

**Evidência**: `return Object.assign({}, currentBrand || {}, { color: pal.primary || '#002f59', ... })` — se o AI retornar JSON inválido, o sistema aceita silenciosamente.

---

### P9 — CSS VARIABLES vs INLINE STYLES (MÉDIO)

Componentes da área de Branding usam **inline styles** com CSS variables:
```jsx
style={{background:'var(--bg-input)', color:'var(--text-main)'}}
```

Mas o tema é aplicado via `document.documentElement.style.setProperty` — isso funciona mas:
- Não há fallback se a variável não for definida
- Não há PurgeCSS-friendly classes
- Mix de `var(--brand)` com `brandColor` prop
- `PreviewGeral.jsx`: ignora CSS variables e usa cores hardcoded extraídas do config

---

### P10 — PROGRAMAÇÃO PROCEDURAL (MÉDIO)

- `var` em vez de `const`/`let` em TODOS os arquivos
- `Object.assign({}, ...)` em vez de spread `{...obj}`
- `array.concat(...)` em vez de `[...arr, ...arr2]`
- `function()` em vez de arrow functions
- Zero TypeScript
- Zero JSDoc

---

### P11 — PLAN THEMES INCONSISTENTES (MÉDIO)

| Fonte | Planos |
|---|---|
| `planThemes.js` DEFAULT_PLAN_THEMES | free, pro, premium, white_label |
| `PlanTabsEditor.jsx` PLAN_META | free, pro, premium |
| `BrandStudioView.jsx` PLAN_LOGO_META | free, pro, premium |

`white_label` existe em planThemes.js mas não tem editor correspondente. Se um admin quiser configurar o tema white_label, não há UI.

---

### P12 — ARMAZENAMENTO DUPLICADO DE ESQUEMAS (BAIXO)

- `LogoSchemes.jsx` usa `localStorage.getItem('financia_logo_schemes')`
- `presets.js` usa `ldb.brand_presets` (Dexie/IndexedDB)

Dois mecanismos para dados similares (schemas de cor vs presets completos). Esquemas de logo ficam no localStorage e podem ser perdidos com limpeza de cache.

---

### P13 — MIGRAÇÃO SQL NÃO PROTEGE brand_config ADEQUADAMENTE (MÉDIO)

`20260707000001_brand_config_jsonb.sql:44` adiciona `brand_config` à RLS, mas a policy existente compara `brand_config is not distinct from ...` — isso significa que qualquer UPDATE precisa passar o mesmo `brand_config` que já está no banco, a menos que white_label=true ou admin.

**Problema**: Se o frontend envia `brand_config` com valor diferente (ex: após editar), o UPDATE será rejeitado para usuários não-admin sem white_label. O frontend PRECISA contornar isso, mas `useBrandStudio.js` e `responseProcessor.js` não têm lógica de RLS awareness.

---

## 5. Overengineering

### schemaRegistry.js — 703 linhas para o que poderia ser 200

O sistema de módulos com:
- `registerModule` com closure
- validadores aninhados (`validateModule`, `validateField`)
- normalizadores por módulo
- dependências entre módulos
- `semanticMap` para estilos predefinidos

...para no final ser consumido por `ModuleEditor.jsx` que renderiza campos genéricos. O `semanticMap` (mapeamento de estilos predefinidos como `minimal`, `bold`) não é usado por nenhum componente — é uma feature não implementada.

**Causa raiz**: O schemaRegistry foi construído como uma engine reutilizável, mas o único consumidor é o ModuleEditor, que não precisa de dependências, normalizadores, ou semanticMap.

---

## 6. Código Morto / Suspeito

1. `schemaRegistry.js:243-246` — `semanticMap` definido mas nunca referenciado em componentes
2. `schemaRegistry.js:88-97` — sistema de dependências entre módulos nunca usado (nenhum módulo tem dependências declaradas além de `[]`)
3. `BrandStudioView.jsx:180-195` — botões `copyPrompt` e `copyCurrentJSON` renderizados condicionalmente (`bs.copyPrompt && bs.copyCurrentJSON`) mas essas funções NÃO existem no hook `useBrandStudio.js` — sempre undefined
4. `previewValidator.js:54-55` — `ignoredProps` retornado mas nunca populado com dados reais (só a checagem de versão)
5. `useBrandStudio.js:41` — `presetCats` computado via `useMemo` SEM dependências, executado uma vez na montagem; se presets mudarem, não atualiza
6. `useBrandStudio.js:33` — `return function() { setOnChange(null); }` — cleanup define `_onChange = null` mas se o componente desmontar durante preview, o preview mode nunca é limpo

---

## 7. Riscos

| Risco | Severidade | Descrição |
|---|---|---|
| Validação inconsistente | ALTA | Schema flat vs modular podem divergir; JSON aprovado por um é rejeitado por outro |
| Default drift | ALTA | 6 fontes de defaults; atualizar uma não atualiza as outras |
| Colisão de dados | MÉDIA | localStorage + Dexie para dados similares |
| RLS blocking UPDATE | MÉDIA | Policy compara brand_config is not distinct from, impedindo updates não-admin |
| Testes frágeis | MÉDIA | Estado global mutável em 3 módulos |
| AI response insegura | MÉDIA | responseProcessor aceita JSON sem validação |
| Perda de esquemas | BAIXA | localStorage pode ser limpo pelo usuário |
| SSR incompatível | BAIXA | Módulos com `window`, `localStorage`, `document` quebram SSR |

---

## 8. Plano de Ação (Recomendações)

### Prioridade ALTA

1. **Unificar schema**: eliminar schema.js ou schemaRegistry.js; manter UM formato (modular) e UMA validação
2. **Centralizar defaults**: criar `src/features/branding/defaults.js` com todas as constantes; remover duplicatas dos 6 arquivos
3. **Unificar paleta**: definir 1 (UMA) lista oficial de campos de cor; sincronizar schema, UI, e CSS variables
4. **Extrair logo utilities**: criar `logoUtils.js` com `generateLogoSvg`, `logoSvgToDataUrl`, `buildCheckPath`; remover duplicatas de BrandStudioView e LogoSchemes

### Prioridade MÉDIA

5. Remover estado global mutável: `_modules`, `_userPresets`, `_savedPreviewTokens` — usar React Context ou estado local
6. Adicionar validação em `responseProcessor.js`: chamar `validateAgainstModules` antes de aceitar proposta
7. Adicionar editor white_label em PlanTabsEditor ou documentar explicitamente
8. Unificar armazenamento de esquemas: Dexie apenas, remover localStorage
9. Adicionar fallback explícito para CSS variables nos componentes

### Prioridade BAIXA

10. Refatorar `var` → `const`/`let`, `Object.assign` → spread
11. Extrair constantes `ORIGINAL_LOGO` para `defaults.js`
12. Adicionar `copyPrompt`/`copyCurrentJSON` reais em `useBrandStudio.js` ou remover botões
13. Avaliar TypeScript para branded types de hex color

---

## 9. Arquivos Afetados

| Arquivo | Problemas |
|---|---|
| `src/features/branding/schema.js` | P1, P2, P3, P6 |
| `src/features/branding/schemaRegistry.js` | P1, P2, P3, P7, §5 |
| `src/features/branding/validateBrandConfig.js` | P1, P2 |
| `src/features/branding/presets.js` | P3, P7 |
| `src/features/branding/planThemes.js` | P3, P11 |
| `src/features/branding/responseProcessor.js` | P8 |
| `src/features/branding/useBrandStudio.js` | P7, §6.3, §6.5 |
| `src/features/branding/BrandStudioView.jsx` | P4, P5, §6.3 |
| `src/features/branding/LogoSchemes.jsx` | P4, P5, P12 |
| `src/features/branding/PreviewGeral.jsx` | P9 |
| `src/features/branding/PlanTabsEditor.jsx` | P3, P6, P11 |
| `src/features/branding/BrandGlobalEditor.jsx` | — (ok) |
| `src/features/branding/ModuleEditor.jsx` | — (ok) |
| `src/shared/hooks/useBrandAppearance.js` | P2, P6, P7 |
| `supabase/migrations/20260707000001_brand_config_jsonb.sql` | P13 |
| `docs/AI_BRAND_SCHEMA.md` | P2 (documenta apenas flat) |

---

## 10. Contagem de Problemas

| Categoria | Qtde | Severidade |
|---|---|---|
| Duplicação de schema/validação | 2 | GRAVE |
| Defaults duplicados | 1 (6x) | GRAVE |
| Paleta inconsistente | 1 (5x) | GRAVE |
| SVG duplicado | 1 (2x) | MÉDIO |
| Funções misturadas com componente | 1 | MÉDIO |
| Estado global mutável | 3 | MÉDIO |
| Validação ausente em responseProcessor | 1 | MÉDIO |
| CSS variables vs inline | 1 | MÉDIO |
| Código procedural | 1 | MÉDIO |
| Planos inconsistentes | 1 | MÉDIO |
| Armazenamento duplicado | 1 | BAIXO |
| RLS sem awareness | 1 | MÉDIO |
| Overengineering (schemaRegistry) | 1 | MÉDIO |
| Código morto | 6 | BAIXO |

**Total: 22 problemas (4 graves, 10 médios, 4 baixos, 4 observations)**

---

## 11. Referências da Pesquisa

- [Semantic Tokens 2026 — Alexander Bobkov](https://bobkov.dev/articles/maintainable-design-systems-2026-semantic-tokens-ai-theming/)
- [CSS Custom Properties Design Tokens — FramingUI](https://framingui.com/blog/css-custom-properties-design-tokens)
- [DTCG Design Tokens Format — Sujeet Jaiswal](https://sujeet.pro/articles/design-tokens-and-theming)
- [Brand Kit para React/Next.js — SVG Genie](https://svggenie.com/blog/brand-kit-for-developers-react-nextjs)
- [React SVG Best Practices — Tiny SVG](https://tiny-svg.actnow.dev/blog/react-svg-best-practices)
- [Design Tokens React — HandoffPro](https://handoffpro.dev/blog/design-tokens-react)
- [Design Tokens FSD — Feature-Sliced Design](https://feature-sliced.design/blog/design-tokens-architecture)
- [Recreating Stripe/Linear/Vercel DESIGN.md](https://opendesigner.io/blog/recreating-stripe-linear-vercel-design-systems-with-design-md)
- [Stripe Design System ao vivo](https://refero.design/style/48e5de76-05d5-4c4e-a269-c7c245b291ec)
- [Fintech UX Design 2026 — Webstacks](https://webstacks.com/blog/fintech-ux-design)
- [Atlassian Design Tokens](https://developer.atlassian.com/platform/forge/design-tokens-and-theming)
- [Dynamic Theming React Context Multi-Brand](https://dev.to/yorgie7/dynamic-theming-in-react-using-context-api-multi-brand-56l1)

---

## 12. Auto-Revisão (Checklist)

| Pergunta | Resposta |
|---|---|
| Pesquisei profundamente? | Sim — 12 fontes (web search + web fetch), 7 empresas benchmark |
| Usei todas as ferramentas? | Sim — Read (23 arquivos), Web Search (4 queries deep), Glob (3 patterns), Grep (1 pattern) |
| Segui o CLAUDE.md? | Sim — DRAFT → REVIEW → APPROVED, header obrigatório, especialista só na própria área |
| Existe solução melhor? | Sim — unificação de schemas resolveria ~60% dos problemas |
| Implementei algo sem autorização? | Não — apenas diagnóstico, zero implementação |
| Existe overengineering? | Sim — identificado no schemaRegistry (703 linhas) e código morto (6 pontos) |
| Existe duplicação? | Sim — 6 ocorrências documentadas (schema, defaults, SVG, paleta, validação, armazenamento) |
| Existe risco? | Sim — 4 riscos altos documentados |
| Posso simplificar minha implementação? | Sim — o documento poderia ser mais conciso, mas o protocolo exige evidências completas |
