---
type: WORKING
status: DRAFT
owner: Integrador
version: 1.0
reviewed_by:
ready_for_integration: false
---

# Matriz de Consolidação — Design System Audit

## Relatórios Lidos

| # | Relatório | Autor | Área | Conclusões principais | Conflitos |
|---|-----------|-------|------|-----------------------|-----------|
| 1 | Estrutura do projeto | explorer | Geral | 58 JSX, 60+ CSS vars, 8 presets, 2 CSS files | ARCHITECTURE.md menciona `src/design-system/` mas dir não existe |
| 2 | Cores hardcoded | explorer | Cores/Tokens | 321 hex, 150 rgba, 25 shadow-sm/md/lg bypassando vars | — |
| 3 | Style inline + uso CSS | explorer | Estilos | 38 arquivos com SVG inline, 40 keyframes, 6/58 usam cn() | 33 tokens do hook não estão no index.css |
| 4 | Web research | websearch | Best practices | shadcn recomenda OKLCH (2026), não HSL; Lucide é padrão; spacing 4px | Projeto usa HSL, não OKLCH |
| 5 | ARCHITECTURE.md | Leitura direta | Docs | Documenta 3 níveis de branding (plano/white-label/admin) | Desatualizada: dir design-system não existe |
| 6 | useBrandAppearance.js | Leitura direta | Hooks | 70+ CSS vars injetadas dinamicamente | 33 vars não são usadas em nenhum CSS |
| 7 | shadcn/ui docs | Web Fetch | Theming | shadcn agora recomenda OKLCH + @theme inline + Tailwind v4 | Projeto usa HSL + tailwind.config v3 |

## Conflitos Identificados

### CONFLITO A — constants.js vs planThemes.js (CORES DOS PLANOS)
| Plano | constants.js | planThemes.js | Impacto |
|-------|-------------|---------------|---------|
| Free primary | `#0f3d3e` | `#002f59` | Tema free mostra cor diferente dependendo de quem resolve |
| Free accent | `#0d9488` | `#1a6b5c` | Botões e destaques mudam de cor |
| Pro accent | `#4F46E5` | `#7c3aed` | Destaques pro inconsistentes |
| Premium accent | `#D4AF6A` | `#f59e0b` | Premium perde identidade dourada |

### CONFLITO B — Documentação vs Realidade
| Documentação | Realidade |
|---|---|
| `src/design-system/` existe | Diretório não existe |
| `docs/AI_CONTEXT.md` como referência | Marcado como depreciado |

### CONFLITO C — Tokens Injetados vs Efetivos
| Grupo | Tokens no hook (useBrandAppearance) | Tokens no index.css | Status |
|-------|--------------------------------------|---------------------|--------|
| Sidebar | `--sidebar-bg` | ✅ existe | OK |
| Sidebar | `--sidebar-width, --sidebar-text, --sidebar-active-bg, --sidebar-hover-bg, --sidebar-divider, --sidebar-collapsed-width` | ❌ não existem | Fantasma |
| Header | `--header-bg` | ✅ existe | OK |
| Header | `--header-height, --header-text` | ❌ não existem | Fantasma |
| Buttons | `--btn-primary-bg, --btn-primary-text, --btn-radius` | ❌ não existem | Fantasma |
| Inputs | `--input-bg, --input-border` | ✅ existe | OK |
| Inputs | `--input-text, --input-focus-border, --input-height` | ❌ não existem | Fantasma |
| Charts | `--chart-1` até `--chart-6` | ❌ não existem | Fantasma |
| Semântica | `--success, --warning, --danger, --info` | ❌ não existem | Fantasma |

### CONFLITO D — Espaço de Cor
| shadcn/ui recomendado (2026) | Projeto atual |
|---|---|
| OKLCH (perceptual) | HSL (não-perceptual) |
| `@theme inline` (Tailwind v4) | `tailwind.config.js extend` (v3) |

### CONFLITO E — implementação de plan themes
Plan themes (`planThemes.js`) usa estrutura de "módulos" com `style/size/density`, enquanto `index.css` e `constants.js` usam valores concretos de HEX. O hook `resolveBrandForPlan` tenta fazer a ponte mas o mapeamento é incompleto.

## Decisões de Consolidação

1. **Fonte da verdade de cores**: Usar `index.css` como fonte da verdade (já que é onde os tokens têm efeito real). Corrigir `constants.js` e `planThemes.js` para ficarem consistentes.
2. **Prioridade de correção**: Eliminar hex hardcoded primeiro (>300 ocorrências quebram dark mode e white-label).
3. **Tokens fantasmas**: Decidir se implementamos no CSS ou removemos do hook — recomendo remover do hook e manter apenas tokens com efeito real.
4. **OKLCH vs HSL**: Manter HSL por enquanto (Tailwind v3), mas documentar como melhoria futura na migração para v4.
5. **Documentação**: Atualizar ARCHITECTURE.md após as correções.

## Próximos Passos (Ordem)

1. Gerar MASTER_REFACTOR_PLAN.md com ações priorizadas
2. Atualizar DESIGN_SYSTEM_AUDIT.md com as descobertas da consolidação
