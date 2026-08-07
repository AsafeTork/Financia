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

- **Agent monitor contínuo de CI + fix race no CI_REPORT** (2026-08-07): falha recorrente do job `extract-errors` — CI ficava VERMELHO com testes verde porque múltiplos runs CI do main rodam em paralelo (`cancel-in-progress: false`) e todos competiam para commitar/pushar `CI_REPORT.md` no mesmo commit, estourando conflito de rebase. Fix: step "Commit CI_REPORT.md" usa `git pull --rebase -X theirs` com fallback `git rebase --abort; exit 0` (auto-resolve para upstream e aborta em vez de falhar o pipeline). Novo `scripts/ci-monitor.sh` monitora falhas de CI (detecta runs `failure`, lista jobs e expõe comando de diagnóstico + auto-fix headless); cron `*/15 * * * *` instalado no host. Commit `e3173b2` — CI 16/16 jobs verde (`31195788858`).

- **Sticky date headers na lista de transações (P1 #10)** (2026-08-07): barra de data fixa (`position: sticky; top: 0; z-index: 10`) no topo da lista virtualizada de `TxView.jsx`. Implementada como overlay `h-0` sticky sobre o `VirtualList`, derivando o grupo de data corrente pelo `scrollTop` real (via `headerTops` pré-computado no memo) — não interfere na medição do virtualizer nem causa scroll jump, já que não consome layout. Acessível via `role="heading"` + `sr-only`. Commit `2c5a327`.

- **Headline metric no dashboard (P1 #9)** (`2026-08-07`): "Resultado Líquido" vira o KPI principal com destaque visual (fundo tint `brandAlpha`, fonte 28px, full-width h2) + 3 apoio — Receitas Totais, Despesas Totais, Saldo Atual — em grid responsivo (1 col / 3 col desktop), tudo dentro de `<section role="region" aria-label="Resumo financeiro">`. `KpiCard` ganhou props `heading` (rótulo semântico) e `highlight`; `Card` aceita `style`.

- **Touch targets ≥ 44px (P1 #5)** (2026-08-07): token `--touch-target-min: 44px` no design system (`index.css`); `min-h/min-w: var(--touch-target-min)` aplicado em Button (todas as sizes), Input, Select (`Sel`), abas (SettingsView, BrandStudioView, PlanTabsEditor), selects avulsos (TransactionCard, BrandGlobalEditor), botões compactos `px-3 py-1.5`/`px-2.5 py-1.5` (EmailView, BrandStudioView undo/redo, PlanTabsEditor copy, ClientEditModal, SettingsView, AdminPanel), upload labels (BrandGlobalEditor, ModuleEditor), color inputs (ColorField, ModuleEditor, PlanTabsEditor, LogoSchemes) e ícones de ação (AdminPanel, ClientEditModal close). BottomNav/Header/ThemeToggle/Dashboard/TxView/PlansView/Confirm já estavam ≥44px. Commit `bc07e88`.

- **Contraste 4.5:1 brand colors (P1 #6)** (2026-08-07): `--text-muted` claro `#94a3b8`→`#5f7086` (2.56→5.06:1 no branco; 4.63 na página off-white); `--success` desacoplado de `--green` (mint decorativo) e escurecido para `#15803d` (5.02:1 nas duas direções — texto verde no claro e texto branco sobre botão verde). Call sites de texto/ícone de verde agora usam `var(--success)` (Landing incomes/checkmarks, Login ACCENT, Dashboard step circle, PlanStatusCard stroke). Verde claro `--green` permanece só em fills decorativos (exigência WCAG não se aplica). Falhas de contraste estavam todas no light mode; dark mode já passava.

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
| ~~5~~ | ✅ ~~Touch targets ≥ 44×44px~~ | `index.css` + 16 componentes (2026-08-07, `bc07e88`) |
| ~~7~~ | ✅ ~~Alternativa `<table>` para gráficos (screen reader)~~ | `UsageBar.jsx` → `BarChartSVG` (2026-08-07) |
| ~~6~~ | ✅ ~~Contraste 4.5:1 em combinações de brand colors~~ | `index.css` (2026-08-07) |
Let me re-read the file; my edits may have created an odd overlap.

<｜DSML｜tool_calls>
<｜DSML｜invoke name="grep">
<｜DSML｜parameter name="pattern" string="true">critters|Preload LCP|P2
| ~~8~~ | ✅ ~~`role="listitem"` em lista virtualizada~~ | `TxView.jsx` (2026-08-07) |
| ~~9~~ | ✅ ~~Headline metric no dashboard~~ | `Dashboard.jsx` + `KpiCard` — "Resultado Líquido" em destaque + Receitas/Despesas Totais/Saldo Atual (2026-08-07) |
| ~~10~~ | ✅ ~~Sticky headers de data na lista de transações~~ | overlay sticky no `scrollRef` de `TxView.jsx` (2026-08-07, `2c5a327`) |

### P2 — Performance: Bundle & LCP

| # | Tarefa | Arquivo(s) |
|---|--------|-----------|
| ~~11~~ | ✅ ~~Otimizar `manualChunks` + Terser~~ | `vite.config.js` (2026-08-07, `991d312`) |
| ~~12~~ | ✅ ~~`vite-plugin-pwa` com injectManifest~~ | `vite.config.js` + `src/sw.ts` (2026-08-07): `VitePWA` injectManifest, SW Workbox custom (precache, cache-first assets, network-first API/Supabase, background sync p/ mutations offline, cleanupOutdatedCaches), manifest gerado; `public/sw.js` removido (substituído pelo gerado `dist/sw.js`). build → 36 entries precache; typecheck/lint verdes; suite hooks flaky pré-existente (Issue #96) sem relação |
| ~~13~~ | ✅ ~~Preload LCP + critical CSS inline~~ | `index.html` (preload `/icon-192.svg` fetchpriority high) + `vite.config.js` (critters plugin: critical CSS inlined, rest async print-media, noscript fallback) (2026-08-07) |
| ~~14~~ | ✅ ~~Upgrade Dexie 3.x → 4.x~~ | `package.json` `^4.0.10` (instalado 4.4.4) — schema composto + `.upgrade()` + APIs (`where`/`bulkPut`/`bulkGet`/`bulkDelete`/`modify`) válidas em Dexie 4; sem `liveQuery` no app; build + 83 testes dexie/sync/crud verdes (2026-08-07) |

### P3 — Polish / Diferenciais

- Onboarding wizard: existe (`src/shared/ui/Onboarding.jsx`) — **verificar contra P1 do audit UX** (um campo por tela, trust signals)
- ~~FAB quick capture: existe (`QuickActions.jsx`)~~ ✅ — FAB expandido para todas as telas principais (`report`, `settings`, `planos` adicionados a `SHOWN_VIEWS`); filtra ação "Configurações" na própria tela de settings. Commit `ebf3b18`
- Focus rings padronizados (3px), card-padding token, dark mode em gráficos
- Pull-to-refresh, swipe actions, command palette (⌘K), deep linking
- WebAuthn/passkey (WCAG 3.3.8)
- ~~Assets de logo (SVG, favicon, app icon) a partir do símbolo em `VISUAL_IDENTITY.md`~~ ✅ — `public/logo.svg` (logo principal horizontal: símbolo + wordmark Montserrat Bold Navy `#002F59`); PNGs do símbolo centrado + padded (maskable-safe) em `favicon-16/32/48.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180px, bg Off-White `#F5F5F0`); `favicon.ico` multi-res (16/24/32/48/64/128/256); `index.html` referencia ICO+16/32/48 PNG+SVG favicon e `apple-touch-icon.png`; `manifest.json` + `vite.config.js` manifest icons → PNG 192x192/512x512 `any maskable`; build + typecheck verdes
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

Última atualização: **2026-08-07** (P0 completo + P1 #5 #6 #8 + Issues #91-95 resolvidos)
