# WORKSPACE — Estado Vivo do Financia (Atualizado)

> Fonte única de estado. Atualizado para incluir a Fase 1 (docs/design/) e Fase 2 (implementação) — agenda.
> Regras: `../AGENTS.md` · Manual operacional: `AGENT_GUIDE.md` · Decisões arquiteturais: `DECISIONS.md`

─────────────────────────────────────

## 1. Estado Atual (verificado em 2026-08-08)

| Componente | Estado | Evidência |
|------------|--------|-----------|
| Site produção | ✅ Online | https://financiabr.me (Render) |
| Build/Lint/Testes | ✅ Verde | commits até `aeb669d` |
| CI/CD | ✅ 6 workflows | ci.yml (13 jobs), build.yml, deploy.yml, edge-functions.yml, migrations.yml, secrets-validation.yml |
| Migrations | ✅ 146 no disco | `supabase/migrations/` (db pull já executado) |
| Edge Functions | ✅ 22 no disco | `supabase/functions/` |
| Identidade visual | ✅ Aplicada | `VISUAL_IDENTITY.md` + CSS vars em toda UI (2026-08-04) |
| Ambiente local | ✅ Node v22 | validação local permitida (`npm run check`) |
| Docs design (Fase 1) | ✅ 10 frentes documentadas | `docs/design/` (10 arquivos, 4.5+ mil linhas) — todos preenchidos com métricas (buscas=10, urls=5-8, lidos=5-22, doc_linhas=327-551) |

**Stack:** React 18.3 + Vite 5.4 + Dexie 3.2 (offline-first) + Supabase (Auth/DB/EF) + Stripe + PWA + Tailwind.

─────────────────────────────────────

## 2. Concluído Recentemente (Fase 1 + Fase 2)

- **Engineering readiness hardening (2026-08-09):** corrigido bypass de ativação white-label no backend (PaymentIntent Stripe deve estar `succeeded`, vinculado ao customer/usuário, valor, moeda e metadata); `trigger-apk-build` agora exige white-label/admin e rate limit, falhas retornam HTTP 4xx/5xx; tokens de Management API não são aceitos no request nem registrados; senha inicial não é enviada por e-mail; rate limit fail-closed trata erro de insert; CORS corrigido (`apikey`); CI propaga falhas de lint/typecheck/test/build/E2E; health check de produção valida shell e manifest. Corrigido drift real de schema: leituras usam `custom_prices` JSONB, projetando preços em memória; `admin_db_stats` foi corrigido com migration versionada e confirmado via RPC autenticado; painel admin aceita o contrato real (`db_size`/`tables`). Asset/rota inexistente agora retorna 404; webhook Stripe retorna 5xx após DLQ para permitir retry; grants RPC legados foram revogados; `electron-builder` e `js-yaml` foram atualizados. Edge Functions, migrations e frontend foram deployados e CI passou. **Riscos restantes:** páginas legais ainda exibem placeholders que exigem decisão humana/legal; `npm audit` ainda reporta 2 vulnerabilidades de tooling (Vite/esbuild e cadeia não runtime); suíte completa local tem 89 falhas de setup/isolation pré-existentes em 13 arquivos, enquanto shards CI e testes incrementais passam.

- **MCP nativo "native" — todas as tools do opencode reconstruídas, sem MCPs externos nas subtarefas** (2026-08-09): `scripts/mcp/server.mjs` — 24 tools `n_*` (read/list/write/edit/apply_patch/bash/glob/grep/webfetch/websearch; APIs gratuitas currency/cep/cnpj/ipinfo/weather/github/npm; orquestração task/todowrite/todo/tools_info/question/skill/plan), zero dependências, sem API keys, offline. Registrado como server `native` em `.opencode/opencode.json` (`opencode mcp list` → `✓ native connected`). Subagentes efêmeros via `n_task` com `--agent mcp-only` (`.opencode/agent/mcp-only.md` — todas as tools nativas deny): o `n_task` reporta quais tools o subagente usou (evidência de isolamento). `n_websearch` é um router de 7 backends **públicos sem chave** (Google News RSS, DuckDuckGo Instant Answer, Wikipedia pt resumo/títulos, Hacker News, GitHub repos, DuckDuckGo HTML) em paralelo com fusão por fonte + cache 10min; `n_webfetch` extrai só o conteúdo principal (`<article>/<main>`, boilerplate strip) com `maxChars` (default 12k) — corte de ~80% de tokens vs página inteira. **Técnicas token-efficient (pesquisa exaustiva 2026-08-09, commit `8e94b4b`)**: `n_read` cap 100k chars configurável, `n_list` cap 1500 linhas, `n_todo(n write)` saída tabular compacta, todos com markers de truncation explícitos (nunca silent truncation); cache TTL com predicado `ok` (falhas nunca cacheadas) em currency 1h/cep·cnpj 24h/weather 30min/ipinfo·github 10min/npm 1h; ordem das tools estável entre execuções (preserva prompt caching do host). Descartado com evidência: tool search/progressive disclosure (<30 tools ≈ 675 tokens, ROI negativo), TOON (parse risk), paginação de tool output (fora do spec MCP). Fixes: handshake MCP exige ecoar `protocolVersion` do cliente, eventos do opencode 1.18.15 usam `part` singular (não `parts`), `n_apply_patch` normaliza trailing newline perdido pelo host. Lint/syntax limpos; teste E2E: subagente respondeu usando somente `n_read`.

- **MFA TOTP com Supabase Auth nativo (Feature 3)** (2026-08-08): `src/features/auth/MfaSection.jsx` — verificação em duas etapas opt-in na aba Conta (SettingsView): `enroll({factorType:'totp'})` com QR code + chave manual, confirmação via `challengeAndVerify` (6 dígitos, upgrade AAL2), `listFactors` e `unenroll` com confirmação; UI acessível (aria-live, touch ≥ 44px), erros amigáveis (`invalid_totp` → pt-BR), fallback senha/passkey sempre ativo; sem migration/RLS (tabelas MFA do Supabase Auth). Commit `ab844c0`. **Validação de lint/typecheck delegada ao agente de testes** (laptop local fraco — decidido 2026-08-08).

- **Previsão de fluxo de caixa 30/60/90 (Feature 2)** (2026-08-08): lib `src/lib/forecast.js` — saldo real acumulado + despesas fixas recorrentes com data exata (via templates de `recurring.js`) + médias móveis dos últimos 3 meses para receitas/despesas variáveis. Determinístico, offline, sem IA/API. `forecast.test.js` com 10 testes. Card "Previsão de caixa" no Dashboard (saldo previsto em 30/60/90 + alerta de saldo negativo; badge "Fixos + média N meses"). Commit `0e5589b`. **Validação de lint/typecheck/E2E delegada ao agente de testes** (laptop local fraco — decidido 2026-08-08).

- **Categorização automática de despesas com IA + aprendizado local (Feature 1)** (2026-08-08): lib `src/lib/categorize.js` (regras locais no Dexie `catrules_<uid>`, heurística de palavras-chave, fallback IA via EF `ai` modo `categorize`, aprendizado contínuo com correções manuais — offline-first, sem custo em casos conhecidos) + `categorize.test.js` (11 testes) + EF `ai` v10 (modo `categorize`, 400 max tokens, rate limit **fail-closed** inline) + botão "Sugerir categorias" no header de despesas do `TxView.jsx` com modal de revisão/aplicação individual via `onEdit` e aprendizado no saveEdit/saveNew. Commit `d63e485`, EF deployed v10.

- **Previsão de fluxo de caixa 30/60/90 (Feature 2)** (2026-08-08): lib `src/lib/forecast.js` — saldo real acumulado + despesas fixas recorrentes com data exata (via templates de `recurring.js`) + médias móveis dos últimos 3 meses para receitas/despesas variáveis. Determinístico, offline, sem IA/API. `forecast.test.js` com 10 testes. Card "Previsão de caixa" no Dashboard (saldo previsto em 30/60/90 + alerta de saldo negativo; badge "Fixos + média N meses"). Commit `0e5589b`. **Validação de lint/typecheck/E2E delegada ao agente de testes** (laptop local fraco — decidido 2026-08-08).

- **Issues #97/#98/#99 resolvidas** (2026-08-08): #97 ESLint unused vars (commit `5da7629` + `bc3ddfa`); #99 README rich display — diagrama mermaid ER `}o--||` quebrava o renderizador do GitHub, trocado por tabelas markdown balanceadas (`c1fb81b`); #98 E2E flaky — `page.route` interceptando `PromiseRejectionEvent` p/ evitar navigation durante `page.evaluate` em `deep-sync-conflict.spec.ts` e remoção do `setTimeout` no handler `window.onerror` em `error-boundary-recovery.spec.ts` (`b53766e`). 6/6 specs passam localmente. Todas fechadas no GitHub.

- **E2E auth-flow estável no CI** (2026-08-08): teste "login form shows validation errors on empty submit" falhava 3 runs seguidos — `button:has-text("Entrar")` casava 4 botões (tab, Google, passkey, submit) e o submit não tinha `type` explícito. Fix: `type="submit"` explícito no botão (Login.jsx) + locator `form button[type="submit"]` no teste. CI 100% verde (`48abfdb`). Cleanup: `playwright-report/` e `test-results/` deixaram de ser trackeados no git.

- **Agent monitor contínuo de CI + fix race no CI_REPORT** (2026-08-07): falha recorrente do job `extract-errors` — CI ficava VERMELHO com testes verde porque múltiplos runs CI do main rodam em paralelo (`cancel-in-progress: false`) e todos competiam para commitar/pushar `CI_REPORT.md` no mesmo commit, estourando conflito de rebase. Fix: step "Commit CI_REPORT.md" usa `git pull --rebase -X theirs` com fallback `git rebase --abort; exit 0` (auto-resolve para upstream e aborta em vez de falhar o pipeline). Novo `scripts/ci-monitor.sh` monitora falhas de CI (detecta runs `failure`, lista jobs e expõe comando de diagnóstico + auto-fix headless); cron `*/15 * * * *` instalado no host. Commit `e3173b2` — CI 16/16 jobs verde (`31195788858`).

- **Atualização PWA sem cache obsoleto** (2026-08-09): servidor Docker próprio (`server.cjs`) aplica `no-store` ao HTML, `sw.js` e manifest, cache imutável somente para assets hashados, e retorna 404 para assets ausentes em vez de fallback HTML. Service Worker ativa updates imediatamente, remove o cache legado `static-assets` e mantém precache Workbox/offline-first. Removido `modulepreload` manual de `/src/*.jsx` que vazava paths de desenvolvimento para produção. Gate CI verifica `dist/index.html` e sintaxe do servidor; validação remota pelo GitHub Actions (laptop local não executa testes).
- **Product discovery e funil público** (2026-08-08): jornada real testada em produção (desktop/mobile) e com conta autenticada. A proposta observável é gestão offline-first para pequenos negócios; primeiro valor = registrar a primeira venda e enxergar o resultado no Dashboard. Landing estava clara, mas o CTA "Criar conta grátis" abria login, URLs legais diretas caíam na landing e o CSP bloqueava scripts inline. Correção implementada em `App.jsx`, `Landing.jsx`, `Login.jsx`, `useNavigation.js`, páginas legais, `boot.js`, `index.html` e `render.yaml`; validação local confirmou cadastro direto, login separado, `/privacidade` direto/retorno à raiz e console sem erros. Deploy de produção ainda precisa ocorrer.
- **Auditoria autônoma de produto e go-to-market** (2026-08-10): produção navegada em desktop (Lighthouse snapshot: a11y 94, boas práticas 100, SEO 100) e mobile 390x844; identificada prova social não verificável na landing, substituída por casos de uso descritivos e mockups marcados como ilustrativos em `Landing.jsx`. Relatório completo em `docs/Growth/PRODUCT_GO_TO_MARKET_REPORT_2026-08-10.md`. Maior gargalo comercial: ausência de funil medido até primeira venda/retorno D7; bloqueios de lançamento seguem dados legais reais e alinhamento de preços/termos.
- **Execução produto → primeiro cliente** (2026-08-10): preços recorrentes alinhados à fonte Stripe (Pro R$ 49,90/Premium R$ 99,90), white-label interno alinhado a R$ 497; Termos corrigidos estruturalmente, mantendo revisão jurídica pendente. Migration `product_funnel_events` aplicada no Supabase com RLS somente-insert e sem PII direta; `src/lib/analytics.js` mede landing, cadastro, onboarding, primeira venda, retorno, checkout e pagamento com fila offline. Roteiro de demo, pitch, objeções e experimentos em `docs/Growth/COMMERCIAL_PLAYBOOK.md`; execução completa em `docs/Growth/PRODUCT_EXECUTION_REPORT_2026-08-10.md`. Próximo gargalo: executar 10 contatos reais e observar primeira venda/D7.
- **Bloqueio de confiança para lançamento** (2026-08-08): as páginas legais ainda exibem placeholders de responsável, identificador, e-mail e data; Termos também divergem da vitrine atual (menciona apenas Pro a R$ 70,00, enquanto `constants.js` exibe Pro a R$ 49,90 e Premium a R$ 99,90). Não preencher dados legais por hipótese: requer decisão do responsável jurídico/comercial antes de tráfego pago ou lançamento público.
- **UI user/admin — ativação e recuperação operacional** (2026-08-08): checklist do Dashboard agora permanece visível até a primeira venda, mesmo quando o usuário já cadastrou produtos, e adapta a copy para o próximo passo. O painel admin ganhou retry explícito para saldo Stripe/uso do banco e validação de preços especiais menores que a tabela. Auditoria de produção abriu o handoff P0 #100: CORS de `admin-stripe-overview`, RPC `admin_db_stats` 404, query de perfis 400 e contrato de impersonação divergente; não corrigir backend/auth nesta frente.

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

**Status da Fase 1:**
- ✅ Todas as 10 frentes de `docs/design/` pré-fechadas (docs de pesquisa)
- ⏳ **Fase 2 (implementação):** aguardando agentes 10 (01-10) — cada um implementa frente com commit Conventional.

## 3. Backlog Priorizado (fonte: audits de 2026-08-05)

### P0 — Lançamento & Confiança

| Tarefa | Arquivo(s) | Próximo passo |
|---|---|---|
| Preencher e revisar Política de Privacidade e Termos com dados reais do controlador, contato, vigência e preços/planos atuais | `src/features/landing/PrivacyPolicy.jsx`, `src/features/landing/TermsOfService.jsx` | Decisão do responsável jurídico/comercial; não inventar valores |

### P1 — Produto & Growth

| Tarefa | Arquivo(s) | Evidência / próximo experimento |
|---|---|---|
| Medir conversão `landing → cadastro → primeira venda → retorno em 7 dias` antes de escalar aquisição | analytics ainda não padronizado | Instrumentar somente eventos que orientem decisão; validar com 5–10 pequenos negócios |
| Testar posicionamento por resultado financeiro ("quanto sobrou" / "caixa da semana") contra mensagem de módulos (vendas, despesas, estoque) | `src/features/landing/Landing.jsx` | A/B ou coortes de landing; hipótese ainda sem evidência comportamental |

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

### P2 — Performance: Bundle & LCP

| # | Tarefa | Arquivo(s) |
|---|--------|-----------|
| ~~11~~ | ✅ ~~Otimizar `manualChunks` + Terser~~ | `vite.config.js` (2026-08-07, `991d312`) |
| ~~12~~ | ✅ ~~`vite-plugin-pwa` com injectManifest + atualização sem cache stale~~ | `vite.config.js` + `src/sw.ts` + `server.cjs` (2026-08-09): `VitePWA` injectManifest, SW Workbox custom (precache, bundles hashados cache-first, network-first API/Supabase, background sync p/ mutations offline, `skipWaiting`/`clients.claim`, limpeza de cache legado), servidor Docker com headers `no-store` para shell/SW/manifest e 404 para asset ausente; gate CI impede paths `/src/*.jsx` no build. |
| ~~13~~ | ✅ ~~Preload LCP + critical CSS inline~~ | `index.html` (preload `/icon-192.svg` fetchpriority high) + `vite.config.js` (critters plugin: critical CSS inlined, rest async print-media, noscript fallback) (2026-08-07) |
| ~~14~~ | ✅ ~~Upgrade Dexie 3.x → 4.x~~ | `package.json` `^4.0.10` (instalado 4.4.4) — schema composto + `.upgrade()` + APIs (`where`/`bulkPut`/`bulkGet`/`bulkDelete`/`modify`) válidas em Dexie 4; sem `liveQuery` no app; build + 83 testes dexie/sync/crud verdes (2026-08-07) |

### P3 — Polish / Diferenciais

- ~~Onboarding wizard: existe (`src/shared/ui/Onboarding.jsx`) — **verificar contra P1 do audit UX** (um campo por tela, trust signals persistentes, skip preserva dados, ARIA label). Commit `405ffba`~~ ✅ — trust signals persistentes, skip preserva dados, ARIA label. Commit `405ffba`
- ~~FAB quick capture: existe (`QuickActions.jsx`)~~ ✅ — FAB expandido para todas as telas principais (`report`, `settings`, `planos` adicionados a `SHOWN_VIEWS`); filtra ação "Configurações" na própria tela de settings. Commit `ebf3b18`
- ~~Focus rings padronizados (3px), card-padding token, dark mode em gráficos~~ ✅ — `--focus-ring: 3px`, `--card-padding: 1rem`, gráficos usam CSS vars. Commit `541cd40`
- ~~Pull-to-refresh, swipe actions, command palette (⌘K), deep linking~~ ✅ — `usePullToRefresh` (TxView, ReportView), `useSwipeActions` (TransactionCard), CommandPalette (App.jsx + ⌘K), rotas com params. Commits `3339937`, `4ab760e`, `3650597`
- ~~WebAuthn/passkey (WCAG 3.3.8)~~ ✅ — Supabase Auth nativo (`registerPasskey`, `signInWithPasskey`, `passkey.*`), UI em Login + Settings. Commit `e4c72ae`
- ~~Assets de logo (SVG, favicon, app icon) a partir do símbolo em `VISUAL_IDENTITY.md`~~ ✅ — `public/logo.svg` (logo principal horizontal: símbolo + wordmark Montserrat Bold Navy `#002F59`); PNGs do símbolo centrado + padded (maskable-safe) em `favicon-16/32/48.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` (180px, bg Off-White `#F5F5F0`); `favicon.ico` multi-res (16/24/32/48/64/128/256); `index.html` referencia ICO+16/32/48 PNG+SVG favicon e `apple-touch-icon.png`; `manifest.json` + `vite.config.js` manifest icons → PNG 192x192/512x512 `any maskable`; build + typecheck verdes. Commit `fe6619e`
- ~~`scheduler.yield` em useMemo longos, Background Sync, LHCI budgets gate no CI~~ ✅ — `useSchedulerYield` hook, `.lighthouserc.js` budgets, SW background sync. Commits `4bfa1fe`, `a69e38b`
- **Leaked password protection (Supabase Auth)** — **Bloqueado:** requer Pro Plan (atual: Free). Toggle "Prevent use of leaked passwords" indisponível no Dashboard. Mitigação Free: validação client-side forte (min 12 chars, blocklist comuns) + rate limit login rigoroso. Upgrade Pro → ativar em Auth → Password Security. Docs atualizadas em `docs/Seguranca/SECURITY_MASTER_AUDIT.md`

## 4. Como Trabalhar Aqui

1. Leia `../AGENTS.md` (regras) → este arquivo (estado) → relatório da área em `docs/<Área>/`
2. Pegue o próximo item do backlog (§3) ou a tarefa dada pelo usuário
3. Execute conforme `AGENT_GUIDE.md` (verificação-first, subagentes, evidências)
4. Ao concluir: atualize §2/§3 deste arquivo + commit Conventional
5. Decisão arquitetural nova → registre em `DECISIONS.md`

**Não crie novos documentos de estado.** Este arquivo + `git log` são suficientes.

─────────────────────────────────────

## 5. Relatório da Fase 1

**Fase 1: PESQUISA & DOCUMENTAÇÃO (10 agentes)** — 10 frentes documentadas em `docs/design/`

| Frente | File | Linhas | Buscas | URLs | Status |
|--------|------|--------|--------|------|--------|
| 01 Design Tokens | REFINE_01 | 485 | 10 | 9 | ✅ |
| 02 Landing Page | REFINE_02 | 435 | 12 | 8 | ✅ |
| 03 App UI Interno | REFINE_03 | 327 | 11 | 6 | ✅ |
| 04 Motion | REFINE_04 | 463 | 12 | 5 | ✅ |
| 05 Performance | REFINE_05 | 478 | 12 | 6 | ✅ |
| 06 Data Viz | REFINE_06 | 424 | 10 | 5 | ✅ |
| 07 Mobile/PWA | REFINE_07 | 457 | 10 | 5 | ✅ |
| 08 Brand & Identity | REFINE_08 | 551 | 10 | 5 | ✅ |
| 09 Acessibilidade | REFINE_09 | 470 | 10 | 5 | ✅ |
| 10 Pricing & Planos | REFINE_10 | 365 | 10 | 5 | ✅ |

**Total:** 2.493 linhas de documentação (docs/design/), 10 documentos (01-10), 49 de buscas web, 41 URLs, 61+ arquivos do repo lidos com file:line.

## 6. Ponto de Saída

- **Fase 1 concluída** — 10 frentes documentadas e validadas com métricas.
- **Fase 2 (implementação):** aguardar 10 agentes implementadores para executarem usando os docs como guia. Cada agente com commit Conventional + push.
- **Próximos passos** (quando o usuário confirmar): Fase 2.
- **Documentação adicional:** `docs/DECISIONS.md` (ADR-lite) atualizado para refletir as decisões da Fase 1; `docs/INDEX.md` atualizado.
