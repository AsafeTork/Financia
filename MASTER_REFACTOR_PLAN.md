---
type: WORKING
status: DRAFT
owner: Integrador
version: 1.0
reviewed_by:
ready_for_integration: false
---

# MASTER_REFACTOR_PLAN — Revalidação UX_MASTER_AUDIT.md

> Gerado: 2026-07-10 | Autor: Integrador | Fase: Consolidação

## Escopo

Revalidar `UX_MASTER_AUDIT.md` contra fontes oficiais, schema real do banco, Stripe, documentação e código.

## Correções já validadas (execução anterior — conteúdo correto)

| # | Correção | Validado por |
|---|---|---|
| C1 | WCAG 2.4.13: AAA (não AA) | Pesquisa W3C oficial ✅ |
| C2 | `prefers-reduced-motion` existe em `animations.css` (importado em main.jsx) | Docs Agent ✅ |
| C3 | M3 Expressive: expanded rail substitui drawer (com ressalvas) | Pesquisa M3 oficial + 9to5Google ✅ |
| C4 | SyncBadge z-index 9999 > modais z-50 | Código real ✅ |
| C5 | animations.css coverage (28+ keyframes) | Código real ✅ |
| C6 | ExportButtons com role="group" + aria-label | Código real ✅ |
| C7 | Spinner com role="status" + sr-only | Código real ✅ |
| C8 | 4 novas forças (G13-G16) | Consistente com pesquisa ✅ |

## Correções adicionais necessárias

| # | O que | Onde | Evidência |
|---|---|---|---|
| N1 | Adicionar achado: 93 ocorrências de cores fixas (`text-white`, `bg-white`) quebram white-label | Seção 7 (Configurações) ou 19 (Resumo) | Docs Agent — grep no código |
| N2 | Adicionar verificação de ARIA landmarks (`<nav>`, `<main>`, `<header>`) | Seção 13 (Acessibilidade) | Docs Agent — não verificado |
| N3 | Adicionar recomendação: usar Playwright para testes E2E de acessibilidade | Seção 13.3 (Recomendações) | Docs Agent — Playwright já instalado |
| N4 | Atualizar metodologia para incluir WCAG 2.2 AAA (não só AA) | Apêndice A | Pesquisa W3C ✅ |
| N5 | Corrigir docs/UX-AUDIT-REFERENCE.md: 2.4.13 como AAA | Referência | Pesquisa W3C ✅ |

## Plano de execução

1. **Fase 1**: Aplicar correções N1-N5 no UX_MASTER_AUDIT.md
2. **Fase 2**: Validar (build, lint se possível)
3. **Fase 3**: Atualizar ARCHITECTURE.md com as 21 discrepâncias (se escopo permitir)
4. **Fase 4**: Relatório final

## Arquivos afetados

- `UX_MASTER_AUDIT.md` — correções
- `docs/UX-AUDIT-REFERENCE.md` — já corrigido (WCAG 2.4.13)
- `docs/ARCHITECTURE.md` — 21 discrepâncias (fora do escopo UX audit, mas reportado)

## Riscos

- `npm run lint` e `npm test` timeout — não validável neste terminal
- Supabase MCP sem acesso — schema reconstruído via migrations
