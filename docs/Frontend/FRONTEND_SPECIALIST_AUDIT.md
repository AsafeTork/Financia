# Frontend — Auditoria Técnica Completa

---
type: WORKING
status: REVIEW
owner: Frontend Specialist
version: 1.0
reviewed_by: Frontend Specialist (auto-revisão)
ready_for_integration: false
---

## 1. Diagnóstico

Stack: React 18.3 + Vite 5.4 + Tailwind 3.4 + Dexie 3.2 + Supabase JS 2.45 + React Router 7 + TanStack Query 5 + TanStack Virtual 3 + Radix UI (Label/Slot).

Build: 0 erros (após correção manual de tag `<div>` sem fechar em TxView.jsx:229). Lint: 0 erros. Testes: 1168/1178 passam (10 falham — todos em `generated.test.js` por `crypto.randomUUID()`). Bundle: 28 chunks, ~290KB gzip.

**Problemas encontrados:**

| # | Problema | Evidência | Severidade |
|---|----------|-----------|------------|
| P1 | `useRef()` sem argumento — quebra no React 19 | `AdminPanel.jsx:55`, `ClientEditModal.jsx:68` | Alta |
| P2 | 10 testes falhando consistentemente | `generated.test.js` — `crypto.randomUUID()` não disponível no test env | Alta |
| P3 | 7 arquivos mortos em `features/branding/` | `index.js`, `previewValidator.js`, `schemaRegistry.js`, `BrandGlobalEditor.jsx`, `ModuleEditor.jsx`, `validateBrandConfig.js`, `schema.js` — zero imports | Média |
| P4 | App.jsx — god component (333 linhas, ~30 props em cascata) | `src/App.jsx` — 15+ useState, 6 useEffect, atalhos de teclado, onboarding, sync, toasts, modais | Alta |
| P5 | Sync sem mutation queue — race condition offline | `src/lib/sync.js:9-53` — loop com upsert individual, sem fila, sem retry | Alta |
| P6 | Sync com timeout de 15s e falha silenciosa | `sync.js:87-96` — `Promise.race` com catch `{ return false; }` sem notificação | Alta |
| P7 | TanStack Query configurado mas não utilizado | `core/providers.jsx` — `QueryClientProvider` presente, 0 `useQuery`/`useMutation` em todo `src/` | Média |
| P8 | ESLint `exhaustive-deps: warn` em vez de `error` | `eslint.config.js:25` — dependências incorretas não bloqueiam CI | Média |
| P9 | `no-unused-vars` desligado para JS puro | `eslint.config.js:26` — `'no-unused-vars': 'off'` com TS configurado como apenas `warn` | Baixa |
| P10 | Variável `SRC` morta em `eslint.config.js` | `eslint.config.js:7` — definida mas nunca referenciada | Baixa |
| P11 | Camada `entities/` ausente (FSD v2.1) | `src/entities/` não existe | Média |
| P12 | `context/` directory não existe | `src/context/` — diretório vazio/ausente | Baixa |
| P13 | Schema Dexie versão 1 mantida sem necessidade | `src/lib/dexie.js:6-12` — v1 sobrescrita por v2, pode ser removida | Baixa |

**Causa raiz:** Projeto evoluiu de MVP para v5.1.0 sem refatorações estruturais. Todo estado converge para App.jsx por ausência de boundaries (context, entities, stores). Sync foi adicionado como camada fina sobre Dexie sem considerar concorrência offline. Linter permissivo permite acúmulo de código morto.

---

## 2. Pesquisas Realizadas

| Fonte | Conteúdo | Link |
|-------|----------|------|
| React 19 Upgrade Guide (oficial) | Breaking changes: useRef requer argumento, PropTypes removido, defaultProps para funções removido, string refs removido | https://react.dev/blog/2024/04/25/react-19-upgrade-guide |
| React 19 Blog Post (oficial) | Novas features: React Server Components, Actions, use() hook, improved Suspense | https://react.dev/blog/2024/12/05/react-19 |
| Vite 5 Migration Guide | rollupOptions válido, compact:true deprecado, target esnext suportado | https://vite.dev/guide/migration |
| FSD v2.1 Layers (oficial) | Camadas: app/processes/pages/widgets/features/entities/shared; entities deve conter model/api/ui | https://feature-sliced.design/docs/reference/layers |
| FSD Cross-import Rules | Slice só importa de layers abaixo; @x notation para cross-imports entre entities | https://feature-sliced.design/docs/reference/rules |
| TanStack Query v5 Docs | networkMode: offlineFirst para PWA, suspense, persistência com PersistQueryClient | https://tanstack.com/query/v5/docs |
| TanStack Query v5 GitHub | isRestoring para hidratação offline | https://github.com/TanStack/query/discussions |
| Dexie Docs | Transações, índices compostos, bulkGet/bulkPut para performance | https://dexie.org/docs |
| Dexie Sync Patterns | Mutation queue, version upgrades, schema migração | https://dexie.org/docs/Version/Version.stores() |
| Supabase JS v2.45 Docs | Realtime subscriptions, channel, broadcast/presence | https://supabase.com/docs/reference/javascript |

---

## 3. Melhores Práticas

| Prática | Referência | Status no Projeto |
|---------|-----------|-------------------|
| useRef sempre com valor inicial | React 19 docs | 2 violações |
| Mutation queue para sync offline | Dexie docs + patterns MDN | Não implementado |
| TanStack Query com offlineFirst para PWA | TanStack Query v5 docs | Provider presente, não usado |
| Camada entities separada de features | FSD v2.1 oficial | entities/ ausente |
| ESLint rules com error (não warn) | ESLint docs recomendação | exhaustively-deps como warn |
| no-unused-vars ativo | ESLint docs recomendação | Off para JS puro |
| Schema único Dexie sem versões mortas | Dexie docs | v1 mantida sem função |
| Tratamento de erro com notificação ao usuário | UX best practices | Sync falha silenciosamente |

---

## 4. Arquivos Afetados

| Arquivo | Linha(s) | Problema | Ação |
|---------|----------|----------|------|
| `src/features/admin/AdminPanel.jsx` | 55 | `useRef()` sem arg | Adicionar `null` |
| `src/features/admin/ClientEditModal.jsx` | 68 | `useRef()` sem arg | Adicionar `null` |
| `src/lib/utils.js` | 36 | `uid()` usa `crypto.randomUUID()` | Adicionar fallback ou polyfill |
| `src/test/gen/generated.test.js` | múltiplas | 10 testes falham por uid() | Corrigir após polyfill |
| `src/features/branding/index.js` | todo | Morto (sem imports) | Remover |
| `src/features/branding/previewValidator.js` | todo | Morto | Remover |
| `src/features/branding/schemaRegistry.js` | todo | Morto | Remover |
| `src/features/branding/BrandGlobalEditor.jsx` | todo | Morto | Remover |
| `src/features/branding/ModuleEditor.jsx` | todo | Morto | Remover |
| `src/features/branding/validateBrandConfig.js` | todo | Morto | Remover |
| `src/features/branding/schema.js` | todo | Morto | Remover |
| `src/lib/sync.js` | 9-100 | Sem fila de mutação, sem retry, falha silenciosa | Adicionar fila + notificação |
| `src/lib/dexie.js` | 6-12 | Schema v1 desnecessário | Remover v1 |
| `src/core/providers.jsx` | 2-19 | QueryClientProvider não utilizado | Utilizar ou remover |
| `src/App.jsx` | 1-333 | God component | Extrair contexts |
| `eslint.config.js` | 7 | Variável `SRC` morta | Remover |
| `eslint.config.js` | 25-26 | `warn` e `off` permissivos | Elevar para `error` |

---

## 5. Plano de Ação

### Fase 1 — Correções Críticas (1-2 dias)

1. **Corrigir `useRef()` sem argumento** — `AdminPanel.jsx:55`, `ClientEditModal.jsx:68`: `useRef(null)`
2. **Corrigir `uid()` nos testes** — adicionar polyfill de `crypto.randomUUID` no setup do Vitest
3. **Remover 7 arquivos mortos** do `features/branding/`
4. **Remover variável `SRC` morta** do `eslint.config.js`

### Fase 2 — Qualidade (2-3 dias)

5. **Elevar `exhaustive-deps` de `warn` para `error`** no `eslint.config.js`
6. **Ativar `no-unused-vars` para JS puro** — revisar e limpar variáveis não utilizadas
7. **Adicionar mutation queue ao sync** — fila FIFO com retry exponencial, notificação de falha
8. **Remover schema versão 1 do Dexie** — manter apenas `ldb.version(2)`

### Fase 3 — Arquitetura (1-2 semanas)

9. **Criar camada `entities/`** — extrair model/api de transactions, products, losses, profiles
10. **Refatorar `App.jsx`** — extrair SessionContext, SyncContext, UIStateContext
11. **Utilizar TanStack Query** com `networkMode: 'offlineFirst'` para cache + Dexie como fallback
12. **Configurar Realtime subscriptions** do Supabase para sync bidirecional

---

## 6. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Perda de dados em sync offline | Média | Alto | Mutation queue + retry exponencial |
| Quebra ao migrar React 19 | Alta | Médio | Corrigir useRef() sem arg agora |
| Testes falhando mascaram regressões | Alta | Médio | Corrigir uid() no test env |
| Dead code confunde manutenção | Alta | Baixo | Remover 7 arquivos mortos |
| App.jsx impede novas features | Alta | Alto | Extrair contexts incrementalmente |
| ESLint não pega dependências erradas | Média | Médio | exhaustive-deps: error |

---

## 7. Auto-Revisão

| Pergunta | Resposta |
|----------|----------|
| Pesquisei profundamente (web, docs, RFC)? | Sim — React 19, Vite, FSD v2.1, TanStack Query v5, Dexie, Supabase docs oficiais consultados |
| Usei todas as ferramentas disponíveis? | Sim — WebSearch (deep), WebFetch (docs oficiais), Read, Grep, Glob, Bash (build/lint/test), Task (subagentes) |
| Segui todas as regras do CLAUDE.md? | Sim — atuei apenas como especialista, não implementei, produzi WORKING com header completo |
| Existe solução melhor ou mais simples? | Sim — poderia agrupar Fase 1 e 2 em uma única sprint de 3 dias |
| Implementei algo sem autorização do Integrador? | Não — documento é apenas análise |
| Existe overengineering no que produzi? | Não — cada item tem evidência e valor imediato |
| Posso simplificar sem perder qualidade? | Sim — Fase 3 pode ser reduzida a 3 itens prioritários (entities, contexts, TanStack Query) |
| Documentei corretamente (tipo, status, bloco)? | Sim — type: WORKING, status: REVIEW, bloco completo |
