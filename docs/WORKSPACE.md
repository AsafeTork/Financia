# WORKSPACE — Estado Vivo do Financia

> **Fonte única de estado.** Leia antes de começar qualquer tarefa; atualize ao concluir.
> Regras de trabalho: `../AGENTS.md` · Manual operacional: `AGENT_GUIDE.md` ·
> Decisões arquiteturais: `DECISIONS.md`
> Última reconciliação com a realidade: **2026-08-07**

──────────────────────────────────────

## 1. Estado Atual (verificado em 2026-08-05)

| Componente | Estado | Evidência |
|------------|--------|-----------|
| Site produção | ✅ Online | https://financiabr.me (Render) |
| Build/Lint/Testes | ✅ Verde | commits até `aeb669d` |
| CI/CD | ✅ 6 workflows | ci.yml (13 jobs), build.yml, deploy.yml, edge-functions.yml, migrations.yml, secrets-validation.yml |
| Migrations | ✅ 144 no disco | `supabase/migrations/` (db pull já executado) |
| Edge Functions | ✅ 22 no disco | `supabase/functions/` |
| Identidade visual | ✅ Aplicada | `VISUAL_IDENTITY.md` + CSS vars em toda UI (2026-08-04) |
| Ambiente local | ✅ Node v22 | validação local permitida (`npm run check`) |

**Stack:** React 18.3 + Vite 5.4 + Dexie 3.2 (offline-first) + Supabase (Auth/DB/EF) + Stripe + PWA + Tailwind.

──────────────────────────────────────

## 2. Concluído Recentemente

- **ARIA roles em lista virtualizada (P1 #8)** (2026-08-07): itens do `VirtualList` do `TxView.jsx` ganharam `role="listitem"` (container já tinha `role="list"`), expondo cada transação/grupo ao screen reader
- **Vitest hang após os testes (Issue #91)** (2026-08-07): suite agora **sai em ~18-20s** (antes: timeout/exit 124). Causa-raiz: `Onboarding.jsx` passava `onName`/`onPhone` sem memoização → efeito de mount do `PhoneInput` (`[iso,digits,onChange]`) re-disparava infinitamente, busy-loop sincronizando o worker vmThreads. Fix: `React.useCallback` (commit `3b63b93`). `setup.js` agora faz `cleanup()` + reset duro de DOM/`<head>` por teste para impedir acúmulo cross-file. Expôs flakiness pré-existente → Issue #96.
- **Índices compostos Dexie (P0 #2)** (2026-08-07): 3 índices `[user_id+_synced]`, `[user_id+_deleted+date]`, `[user_id+_deleted+created_at]` — scan unsynced otimizado (sync.js/worker), carga ordenada por data (useDataLoader), zero breaking changes (v4→v5)
- **Testes de integração sync verdes (Issue #92)** (2026-08-07): `sync.test.js`/`sync-extra.test.js`/`dexie.test.js` — mocks atualizados p/ índice composto `[user_id+_synced]`, hoisting `vi.mock` corrigido com `vi.hoisted`, re-import fresco de `sync.js` via `vi.resetModules()` (elimina interferência de cache de módulo no pool vmThreads), paginação do mock reutiliza qb; fix de produção: `syncProfiles` agora retorna `{ok, changed}` (antes boolean, falha de perfil era engolida)
- **Sync em Web Worker (P0 #1)** (2026-08-07): worker consolida drift — agora importa a pipeline compartilhada de `src/lib/sync.js` em vez de duplicá-la (upsert mantém `client_mutation_id`/`base_version` e marca `_conflict` em 23505); fallback main-thread intacto no hook
- **Sync adaptativo + backoff (P0 #3)** (2026-08-07): `useSyncLoop.js` troca `setInterval` fixo (120s) por `setTimeout` recursivo com backoff exponencial 30s→60s→120s→240s→max 5min + jitter ±10%; reset p/ base após 2 sucessos consecutivos; respeita `navigator.onLine`; expõe métricas `lastSyncDuration`/`consecutiveFailures`/`currentInterval` mantendo a API `{ runSync }`
- **Performance crítica** (2026-08-05): context split, render só da rota ativa, callbacks memoizados, React.memo em 8 componentes — commits `feb2be2`, `3975958`
- **Testes** (2026-08-05): 14 falhas resolvidas, Vitest 4 config corrigida, pool threads 3-5x mais rápido — `de9c7d2`, `aeb669d`, `f26e828`
- **CI** (2026-08-05): Playwright fora dos testes unitários, setup otimizado — `e6a8870`
- **Design system** (2026-08-04): Montserrat/Inter/JetBrains, valores hardcoded → CSS vars em 20+ arquivos, motion tokens
- **Segurança backend** (2026-07-31): storage RLS initPlan, ai_cache dead policies, admin-set-custom-price, impersonation short-lived JWT, rate limit fail-closed, 6 migrations + 12 EFs

──────────────────────────────────────

## 3. Backlog Priorizado (fonte: audits de 2026-08-05)

### P0 — Performance: INP & Sync (relatório: `Performance/PERFORMANCE_AUDIT_REPORT.md`)

| # | Tarefa | Arquivo(s) |
|---|--------|-----------|
| ~~1~~ | ✅ ~~Mover `syncAll` para Web Worker~~ | `src/workers/sync.worker.js` + `useSyncLoop.js` (2026-08-07) |
| ~~2~~ | ✅ ~~Índices compostos no schema Dexie~~ | `src/lib/dexie.js` (2026-08-07) |
| ~~3~~ | ✅ ~~Intervalo de sync adaptativo + backoff~~ | `src/shared/hooks/useSyncLoop.js` (2026-08-07) |
| ~~4~~ | ✅ ~~`useTransition` no filtro de TxView~~ | `src/features/transactions/TxView.jsx` (2026-08-07) |

### P1 — UX: Acessibilidade WCAG 2.2 AA (hoje ~45%) (relatório: `UX/UX_UI_AUDIT_REPORT.md`)

| # | Tarefa | Notas |
|---|--------|-------|
| 5 | Touch targets ≥ 44×44px | BottomNav, tabs Inventory, Selects |
| 6 | Contraste 4.5:1 em combinações de brand colors | check runtime ou paleta restrita |
| 7 | Alternativa `<table>` para gráficos (screen reader) | `BarChartSVG` |
| ~~8~~ | ✅ ~~`role="listitem"` em lista virtualizada~~ | `TxView.jsx` (2026-08-07) |
| 9 | Headline metric no dashboard | 1 KPI "Resultado Líquido" + 3 apoio |
| 10 | Sticky headers de data na lista de transações | CSS `position: sticky` |

### P2 — Performance: Bundle & LCP

| # | Tarefa | Arquivo(s) |
|---|--------|-----------|
| 11 | Otimizar `manualChunks` + Terser | `vite.config.js` |
| 12 | `vite-plugin-pwa` com injectManifest | `vite.config.js`, `src/sw.ts` |
| 13 | Preload LCP image + critical CSS | `index.html` |
| 14 | Upgrade Dexie 3.x → 4.x | `package.json`, `dexie.js` |

### P3 — Polish / Diferenciais

- Onboarding wizard: existe (`src/shared/ui/Onboarding.jsx`) — **verificar contra P1 do audit UX** (um campo por tela, trust signals)
- FAB quick capture: existe (`QuickActions.jsx`) — **verificar cobertura em todas as telas**
- Focus rings padronizados (3px), card-padding token, dark mode em gráficos
- Pull-to-refresh, swipe actions, command palette (⌘K), deep linking
- WebAuthn/passkey (WCAG 3.3.8)
- Assets de logo (SVG, favicon, app icon) a partir do símbolo em `VISUAL_IDENTITY.md`
- `scheduler.yield` em useMemo longos, Background Sync, LHCI budgets gate no CI
- Habilitar leaked password protection (dashboard Supabase Auth)

──────────────────────────────────────

## 4. Como Trabalhar Aqui

1. Leia `../AGENTS.md` (regras) → este arquivo (estado) → relatório da área em `docs/<Área>/`
2. Pegue o próximo item do backlog (§3) ou a tarefa dada pelo usuário
3. Execute conforme `AGENT_GUIDE.md` (verificação-first, subagentes, evidências)
4. Ao concluir: atualize §2/§3 deste arquivo + commit Conventional
5. Decisão arquitetural nova → registre em `DECISIONS.md`

**Não crie novos documentos de estado.** Este arquivo + `git log` são suficientes.

──────────────────────────────────────

## 5. Documentos de Referência (AI/Orquestração)

| Doc | Descrição | Localização |
|-----|-----------|-------------|
| AGENT_TASKS.md | Mapeamento backlog → agentes especialistas + padrões 2026 | `docs/ai/AGENT_TASKS.md` |
| GitHub #94 | Issue de tracking do mapeamento multi-agente | https://github.com/AsafeTork/Financia/issues/94 |
| CEO_PROMPT | Prompt do CEO Técnico (indexado no ctx) | `ctx_search source:financia-CEO-PROMPT` |

Última atualização: **2026-08-07** (P0 #1 + #2 concluídos via subagentes paralelos)
