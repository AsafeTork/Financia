---
type: REPORT
---

# Stress & Behavior Audit — Financia

**Date:** 2026-07-09
**Method:** Playwright (Chrome headless) + Supabase MCP + Code Review + Web Search
**Version:** 5.1.0

---

## Executive Summary

Auditoria de estresse, comportamento, segurança, performance e código. Foram testados **7 fases** abrangendo fluxos extremos, dados maliciosos, performance, segurança, UX, banco de dados e código fonte.

### Browser Stress Test Results (E2E)

| Teste | Resultado | Observação |
|-------|-----------|------------|
| 10 cliques rápidos no botão Entrar | ✅ Sem erros | App tolera multi-click |
| Login simultâneo em 2 abas | ✅ Sem erros | Sessão isolada por aba |
| Refresh durante login | ✅ Sem erros | Auth request abortado graciosamente |
| Navegação rápida 12 rotas | ✅ Sem erros | Lazy loading funciona |
| XSS payloads (8 variações) | ✅ React escapa corretamente | Sem dangerouslySetInnerHTML |
| Unicode/Emoji (10 variações) | ✅ Input aceita sem corromper | UTF-8 preservado |
| SQL Injection (5 padrões) | ✅ Supabase trata via RLS | Parâmetros escapados |
| Texto longo (1000 chars) | ✅ Sem crash | Input aceita |
| 120 navegações (heap) | ✅ 0MB de crescimento | Sem memory leak detectável |
| Zoom 200% | ✅ Sem overflow crítico | Layout adaptável |
| Viewport 320px | ✅ Sem overflow horizontal | Responsivo |
| Viewport 2560px | ✅ Layout centralizado | OK |
| Load time | 546ms | Aceitável |

### Consolidated Findings Summary

| Category | P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low) | Total |
|----------|:---:|:---:|:---:|:---:|:---:|
| DB / Supabase | 2 | 5 | 5 | 3 | 15 |
| Code / Race Conditions | 5 | 5 | 5 | 3 | 18 |
| Security | 2 | 4 | 5 | 3 | 14 |
| Browser Stress | 0 | 0 | 0 | 0 | 0 |
| **Total** | **9** | **14** | **15** | **9** | **47** |

---

## P0 — Critical (9)

### P0-1: Token GitHub no localStorage (S1)
- **Fase:** 4 (Segurança)
- **Arquivos:** `GhTokenCard.jsx:5`, `sync.js:180`, `AdminPanel.jsx:227`
- **Problema:** Token de deploy do GitHub armazenado em texto puro no `localStorage`. Qualquer XSS ou extensão maliciosa pode roubá-lo e fazer deploy malicioso.
- **Impacto:** Comprometimento total do repositório e pipeline de deploy
- **Causa:** Decisão de design (equipe já ciente — vide GhTokenCard.jsx:41-44)
- **Fix:** Mover token para Edge Function com chamada autenticada; usar `sessionStorage` como workaround temporário

### P0-2: Impersonaçao com senha temporária no localStorage (S2)
- **Fase:** 4 (Segurança)
- **Arquivos:** `useImpersonation.js:10-24`, `AdminPanel.jsx:256-261`
- **Problema:** `_imp` armazenado no `localStorage` com UID do alvo. RPC `admin_impersonate_start` retorna email + senha temporária. `signInWithPassword` expõe a senha no network tab.
- **Impacto:** Script malicioso pode assumir conta de qualquer cliente
- **Causa:** Senha temporária trafega em texto plano na resposta da RPC
- **Fix:** Usar `sessionStorage` + token criptografado assinado pelo servidor

### P0-3: Missing index on user_roles (DB1)
- **Fase:** 6 (Banco)
- **Tabela:** `user_roles`
- **Problema:** `user_roles` não tem índice em `(user_id, role)`. Esta tabela é consultada em **toda** RLS policy admin (`EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')`) e em todos os RPCs admin.
- **Impacto:** Cada verificação admin faz full table scan. Com 10k+ usuários, queries degradam para segundos.
- **Fix:** `CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_role ON public.user_roles(user_id, role);`

### P0-4: Missing indexes on transactions.user_id and losses.user_id (DB2)
- **Fase:** 6 (Banco)
- **Tabelas:** `transactions`, `losses`
- **Problema:** Nenhum índice em `user_id` nas tabelas `transactions` e `losses`. Usado nas RLS policies `admin_delete_*`.
- **Impacto:** Full table scan em operações admin e possivelmente em queries normais
- **Fix:** `CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);` e `CREATE INDEX IF NOT EXISTS idx_losses_user_id ON losses(user_id);`

### P0-5: Promise.all sem .catch() — AdminPanel loading infinito (C1)
- **Fase:** 7 (Código)
- **Arquivo:** `AdminPanel.jsx:58`
- **Problema:** `Promise.all([fetchClients(), fetchClientUsage()])` sem `.catch()`. Se qualquer fetch falhar, `setLoadingCli(false)` nunca é chamado.
- **Impacto:** Skeleton de loading infinito no painel admin. Admin não consegue gerenciar clientes sem refresh. Se o erro persistir, o app fica inutilizável.
- **Fix:** Adicionar `.catch(function() { setLoadingCli(false); })`

### P0-6: Fire-and-forget sem .catch() — triggerApkBuild (C2)
- **Fase:** 7 (Código)
- **Arquivo:** `AdminPanel.jsx:267`
- **Problema:** `triggerApkBuild()` não tem `.catch()`. Se o fetch ao GitHub API falhar, a Promise rejeita sem tratamento.
- **Impacto:** Unhandled promise rejection. Usuário vê ação sem feedback.
- **Fix:** Adicionar `.catch(function(err) { toast('Erro de rede ao acionar build', 'error'); })`

### P0-7: Fire-and-forget sem .catch() — sync em useSyncLoop (C3)
- **Fase:** 7 (Código)
- **Arquivo:** `useSyncLoop.js:38,46`
- **Problema:** `syncAll(userId).then(...)` sem `.catch()` em ambos `visibilitychange` e `online` handlers.
- **Impacto:** Unhandled promise rejection se sync falhar. App entra em estado inconsistente silenciosamente.
- **Fix:** Adicionar `.catch(function() { /* log */ })` em ambas as chains

### P0-8: Stale setTimeout overwriting syncStatus (C4)
- **Fase:** 7 (Código)
- **Arquivo:** `useSession.js:84,87`
- **Problema:** `setTimeout` que seta `syncStatus='idle'` não verifica token. Se `loadData()` for chamado duas vezes rápido, o timeout da primeira chamada sobrescreve o status da segunda.
- **Impacto:** SyncBadge mostra `'idle'` enquanto app está ativamente sincronizando. Usuário acha que dados estão frescos quando não estão.
- **Fix:** Adicionar `if (loadingRef.current === token) p.setSyncStatus('idle')` dentro do timeout

### P0-9: setInterval nunca limpo — memory leak (C5)
- **Fase:** 7 (Código)
- **Arquivo:** `lib/pwa.js:73`
- **Problema:** `setInterval(function() { reg.update(); }, 30 * 60 * 1000)` sem `clearInterval` em lugar nenhum. Executa para sempre.
- **Impacto:** Memory leak (closure mantém SW registration). JS runtime nunca liberado. Polling infinito.
- **Fix:** Armazenar interval ID e limpar em cleanup function ou usar `visibilitychange`

---

## P1 — High (14)

### P1-1: Senha de cliente copiada para clipboard (S3)
- **Fase:** 4 (Segurança)
- **Arquivo:** `AdminPanel.jsx:240-243`
- **Problema:** Senha literal incluída em `navigator.clipboard.writeText()` e link WhatsApp
- **Impacto:** Qualquer app na máquina pode ler o clipboard e obter senha de cliente
- **Fix:** Remover senha da mensagem; enviar link de redefinição

### P1-2: CSP ausente em desenvolvimento (S5)
- **Fase:** 4 (Segurança)
- **Arquivo:** `index.html`
- **Problema:** Nenhuma CSP meta tag no HTML. CSP só existe no `render.yaml` (produção via Render).
- **Impacto:** Em `npm run dev`, qualquer script injetado (extensão, HMR comprometido, dependência) executa sem restrição.
- **Fix:** Adicionar `<meta http-equiv="Content-Security-Policy">` no `<head>` do `index.html`

### P1-3: Upload sem validação de tipo MIME (S4)
- **Fase:** 4 (Segurança)
- **Arquivos:** `ClientEditModal.jsx:170-184`, `ModuleEditor.jsx:110-117`, `BrandGlobalEditor.jsx:4-13`, `SettingsView.jsx:124-131`
- **Problema:** 4 de 5 uploads não validam `file.type`. `AdminPanel.jsx` faz corretamente (whitelist). Os demais só usam `accept="image/*"` no HTML.
- **Impacto:** Usuário pode fazer upload de SVG com script, HTML, ou arquivos arbitrários
- **Fix:** Adicionar `if (allowedTypes.indexOf(file.type) === -1)` em todos os uploads

### P1-4: setTimeout em useCallback sem cleanup (H1)
- **Fase:** 7 (Código)
- **Arquivo:** `App.jsx:176`
- **Problema:** `toast()` cria `setTimeout` que nunca é limpo no unmount. Se componente desmontar antes do timeout, callback executa em componente desmontado.
- **Impacto:** Closures de strings grandes (mensagens de toast) retidas até timeout expirar. Memória cresce com volume de toasts.
- **Fix:** Usar ref para trackear timeouts ativos e limpar no unmount

### P1-5: Nesteadas Promises sem .catch() — impersonação (H3)
- **Fase:** 7 (Código)
- **Arquivo:** `useImpersonation.js:18-24`
- **Problema:** `sb.rpc(...).then(...)` interno e externo sem `.catch()`. Se RPC ou signInWithPassword falhar, unhandled rejection.
- **Impacto:** Sessão parcialmente aplicada. Usuário pode ficar em estado inconsistente sem feedback.
- **Fix:** Adicionar `.catch()` em ambas as chains

### P1-6: unstable loadData dependency (H5)
- **Fase:** 7 (Código)
- **Arquivo:** `App.jsx:203-211`
- **Problema:** `loadData` dependência do `useEffect` muda frequentemente, causando reassign da global `__financia_reload_plan`. Race: entre teardown e setup, função fica `undefined`.
- **Impacto:** Raro — clique em "reload plan" em janela estreita não faz nada
- **Fix:** Usar ref para armazenar loadData

### P1-7: auth.uid() sem (SELECT auth.uid()) em TODAS policies (DB3)
- **Fase:** 6 (Banco)
- **Tabelas:** Todas (7 tabelas, ~12 policies)
- **Problema:** Nenhuma policy usa `(SELECT auth.uid())`. Todas usam `auth.uid()` direto, causando avaliação por linha.
- **Impacto:** A 100k linhas, cada SELECT avalia `auth.uid()` 100k vezes. Benchmark: 179ms → 9ms (94.97% de melhoria) com o fix.
- **Fix:** Substituir `auth.uid()` por `(SELECT auth.uid())` em TODAS as policies

### P1-8: TO authenticated ausente em TODAS policies (DB4)
- **Fase:** 6 (Banco)
- **Tabelas:** Todas
- **Problema:** Nenhuma policy tem `TO authenticated`, então usuários anônimos também disparam avaliação de RLS.
- **Impacto:** Benchmark: 170ms → <0.1ms (99.78%) adicionando `TO authenticated`.
- **Fix:** Adicionar `TO authenticated` em policies que exigem login

### P1-9: search_path sem pg_temp em SECURITY DEFINER functions (DB5)
- **Fase:** 6 (Banco)
- **Funções:** `set_client_plan`, `admin_set_custom_price`, `admin_db_stats`, etc.
- **Problema:** `SET search_path TO 'public'` não inclui `pg_temp` como último.
- **Impacto:** Risco de hijack via tabela temporária em SECURITY DEFINER functions
- **Fix:** `SET search_path TO 'public', 'pg_temp'`

### P1-10: múltiplas SECURITY DEFINER functions executáveis por anon/authenticated (DB6)
- **Fase:** 6 (Banco)
- **Funções:** `admin_clear_client_data`, `admin_client_usage`, `admin_db_stats`, `admin_delete_client`, `admin_get_magic_link`, `admin_impersonate_restore`, `admin_impersonate_start`, `admin_set_custom_price`, `check_plan_unchanged`, `handle_new_user`, `restore_stripe_plan`, `set_client_plan`, `cleanup_ai_cache`
- **Problema:** 13 funções SECURITY DEFINER executáveis por `authenticated` (ou `anon` no caso de `cleanup_ai_cache`)
- **Impacto:** Se alguma função tiver falha de lógica, authenticated user pode escalar privilégio
- **Fix:** Revisar cada função: revogar EXECUTE de anon/authenticated, manter apenas `service_role`

### P1-11: `is_admin` em sessionStorage (S6)
- **Fase:** 4 (Segurança)
- **Arquivo:** `useDataLoader.js:57`, `App.jsx:47`
- **Problema:** Flag admin armazenada em sessionStorage. Com XSS, atacante pode setar `is_admin=1`.
- **Impacto:** UI administrativa exposta (dados permanecem protegidos por RLS)
- **Fix:** Validar role no servidor para decisões críticas

### P1-12: Impersonaçao senha exposta na Response RPC (S2b)
- **Fase:** 4 (Segurança)
- **Arquivo:** `useImpersonation.js:21`
- **Problema:** Senha temporária retornada pela RPC `admin_impersonate_start` é passada como argumento para `signInWithPassword` — visível no network tab.
- **Impacto:** Qualquer um com acesso ao DevTools durante impersonação captura a senha
- **Fix:** Usar `sb.auth.setSession()` com session token em vez de email+senha

### P1-13: Module-level event listeners sem cleanup (M2)
- **Fase:** 7 (Código)
- **Arquivo:** `lib/pwa.js:45,52,67,76,121,126`
- **Problema:** 6 event listeners registrados no module scope. Nenhum `removeEventListener`. Se módulo for re-executado (HMR), listeners duplicam.
- **Impacto:** Múltiplos `window.location.reload()` (controllerchange), duplicação de eventos (message, visibilitychange)
- **Fix:** Retornar cleanup function de `registerSW()`

### P1-14: AdminPanel N chamadas paralelas (E4)
- **Fase:** 7 (Código)
- **Arquivo:** `AdminPanel.jsx:65-77`
- **Problema:** Para N clientes Stripe, faz N chamadas paralelas a `get-subscription-status` sem debounce ou batch. Sem AbortController.
- **Impacto:** Com 100 clientes, 100 Edge Functions disparam simultaneamente. Risco de rate limit no Supabase e na Stripe.
- **Fix:** Usar batch com Promise.allSettled + limite de concorrência + AbortController

---

## P2 — Medium (15)

### P2-1: RLS ativado sem policies — impersonation_sessions (DB7)
- **Tabela:** `impersonation_sessions`
- **Problema:** RLS ativado, mas 0 policies. Acesso só via RPCs SECURITY DEFINER.
- **Risco:** Se alguma RPC não tratar corretamente, tabela fica inacessível ou exposta.
- **Fix:** Documentar ou adicionar policies de segurança

### P2-2: leak password protection disabled (DB8)
- **Supabase Auth:** HaveIBeenPwned protection desabilitado
- **Impacto:** Usuários podem usar senhas comprometidas (vazadas)
- **Fix:** Ativar no painel Supabase Auth settings

### P2-3: Múltiplas permissive policies UPDATE em company_profiles (PB2)
- **Fase:** 6 (Banco)
- **Tabela:** `company_profiles`
- **Problema:** 2 policies permissive para UPDATE para cada role — ambas avaliadas em toda atualização
- **Impacto:** Performance degradada em updates frequentes
- **Fix:** Consolidar em 1 policy por role

### P2-4: 4 tabelas sem SELECT/INSERT policies (DB9)
- **Fase:** 6 (Banco)
- **Tabelas:** `transactions`, `products`, `losses`, `user_roles`
- **Problema:** Só têm DELETE policy. SELECT e INSERT implicitamente bloqueados.
- **Impacto:** Se app tentar acessar via REST API em vez de RPC, falha. Pode ser intencional (RPC-only), mas não documentado.
- **Fix:** Verificar intencionalidade e documentar

### P2-5: `dangerouslySetInnerHTML` — ausente (✅)
- **Fase:** 4 (Segurança)
- **Boa prática:** `dangerouslySetInnerHTML` NÃO é usado em nenhum lugar do código. React escapa tudo.

### P2-6: `brand.logo_url` sem validação de protocolo (S7)
- **Fase:** 4 (Segurança)
- **Arquivos:** `Sidebar.jsx:45`, `Header.jsx:15`, `Login.jsx:136,166`, `SettingsView.jsx:212`
- **Problema:** `src={brand.logo_url}` não valida protocolo. React não executa javascript: em `<img>`, mas `data:` URIs podem poluir cache.
- **Fix:** Validar URL com `new URL()` e whitelist de protocolos

### P2-7: Prototype pollution via JSON parse (S8)
- **Fase:** 4 (Segurança)
- **Arquivos:** `BrandStudioView.jsx:139`, `PlanTabsEditor.jsx:67`, `LogoSchemes.jsx:67`
- **Problema:** `JSON.parse()` sem sanitização. `Object.assign()` propaga para `generateLogoSvg()` que monta SVG inline.
- **Impacto:** Prototype pollution indireta. SVG inline pode conter elementos maliciosos.
- **Fix:** Sanitizar chaves após JSON.parse: extrair apenas campos esperados

### P2-8: `safe()` não remove backtick nem `${}` (S9)
- **Fase:** 4 (Segurança)
- **Arquivo:** `lib/utils.js:15-31`
- **Problema:** Sanitizador `safe()` remove `<>"` e `javascript:` mas não remove `` ` `` (backtick) ou `${}`.
- **Impacto:** Em contexto de template literal (não usado), risco potencial. Baixo no React.
- **Fix:** Adicionar remoção de `` ` `` e `${` ao sanitizador

### P2-9: Error Handling — catch silencioso em PlansView (E1)
- **Fase:** 7 (Código)
- **Arquivo:** `PlansView.jsx:231`
- **Problema:** `sb.functions.invoke('get-subscription-status', ...).catch(function() {})`
- **Impacto:** Usuário não vê erro se assinatura falhar ao carregar
- **Fix:** Propagar erro ou mostrar toast

### P2-10: Error Handling — catch silencioso em SettingsView (E2)
- **Fase:** 7 (Código)
- **Arquivo:** `SettingsView.jsx:60,77`
- **Problema:** `get-payment-method` e `get-subscription-status` com `.catch()` vazio
- **Impacto:** Usuário não vê erro ao carregar cartão/status
- **Fix:** Adicionar feedback de erro

### P2-11: useSession.js:75 — syncAll + fetchRole sem isolamento de erro (M5)
- **Fase:** 7 (Código)
- **Arquivo:** `useDataLoader.js:11`
- **Problema:** `Promise.all` com múltiplas queries Dexie sem try/catch. Se uma falha (quota, corrupção), todas falham.
- **Impacto:** Queda total do carregamento local. Fallback para rede (lento).
- **Fix:** try/catch por query isolada

### P2-12: useScrollReveal — setTimeout sem cleanup (L1)
- **Fase:** 7 (Código)
- **Arquivo:** `useScrollReveal.js:54`
- **Problema:** `setTimeout(() => entry.target.classList.add('visible'), index * 100)` sem cleanup no unmount.
- **Impacto:** Classe adicionada em DOM desmontado (no-op, mas tecnicamente errado)
- **Fix:** Armazenar timeouts e limpar no cleanup

### P2-13: Landing.jsx — setInterval sem cleanup adequado (L2)
- **Fase:** 7 (Código)
- **Arquivo:** `Landing.jsx:33-38`
- **Problema:** setInterval dentro de IntersectionObserver. Observer é desconectado, mas interval continua se componente desmontar durante contagem.
- **Impacto:** `setVal()` em componente desmontado. Closure retido por até 1200ms.
- **Fix:** Armazenar interval ID em ref e limpar junto com observer

### P2-14: AbortController ausente em Stripe Checkout (L3)
- **Fase:** 7 (Código)
- **Arquivo:** Stripe checkout flow
- **Problema:** Chamadas a Edge Functions sem AbortController. Se usuário sair da página durante checkout, requests continuam no servidor.
- **Impacto:** Possível criação duplicada de setup intents na Stripe
- **Fix:** Usar `AbortController` com `sb.functions.invoke(url, { signal })`

### P2-15: Bundle principal 432kB (Build)
- **Fase:** 3 (Performance)
- **Arquivo:** Build output
- **Problema:** Chunk `index-Ba7NV00H.js` com 432 kB (gzip 139 kB) excede 200 kB recomendado
- **Impacto:** Load time inicial maior em conexões lentas (3G)
- **Fix:** Code splitting adicional com `dynamic import()` ou `manualChunks`

---

## P3 — Low (9)

### P3-1: Unused index — idx_ai_cache_user_id (PB3)
- **Tabela:** `ai_cache`
- **Supabase Advisor:** INFO — índice nunca usado
- **Fix:** Remover ou monitorar se será usado no futuro

### P3-2: Unused index — idx_products_user_id (PB3b)
- **Tabela:** `products`
- **Supabase Advisor:** INFO — índice nunca usado (produtos só têm 1 linha atualmente)
- **Fix:** Manter (necessário quando crescer)

### P3-3: 45 lint warnings (unused vars) (L)
- **Fase:** 7 (Código)
- **Múltiplos arquivos**
- **Impacto:** Baixo — variáveis declaradas mas não usadas. Código mais difícil de ler.
- **Fix:** Remover variáveis não utilizadas

### P3-4: GoogleBtn sem aria-label (A5)
- **Fase:** 5 (UX)
- **Arquivo:** `Login.jsx:10`
- **Fix:** Adicionar `aria-label="Entrar com Google"`

### P3-5: Input busca Admin sem aria-label (A6)
- **Fase:** 5 (UX)
- **Arquivo:** `AdminPanel.jsx:429`
- **Fix:** Adicionar `aria-label`

### P3-6: Gráfico Dashboard sem role="img" (A7b)
- **Fase:** 5 (UX)
- **Arquivo:** `Dashboard.jsx:251`
- **Fix:** Adicionar `role="img"` + aria-label no SVG

### P3-7: KPI cards sem onKeyDown (A8)
- **Fase:** 5 (UX)
- **Arquivo:** `Dashboard.jsx:191`
- **Fix:** Adicionar `onKeyDown` + `tabIndex`

### P3-8: Botões collapse sem aria-expanded (A9)
- **Fase:** 5 (UX)
- **Arquivo:** `InventoryView.jsx:247`
- **Fix:** Adicionar `aria-expanded`

### P3-9: Indicador entrada/saída só por cor (A10)
- **Fase:** 5 (UX)
- **Arquivo:** `Dashboard.jsx:224,228`
- **Fix:** Adicionar texto `sr-only`

---

## Stress Test Details by Phase

### Phase 1: Extreme User Flows ✅
| Test | Result |
|------|--------|
| Rapid multi-click (10x in 100ms) | ✅ No errors |
| Dual tab simultaneous login | ✅ No errors |
| Refresh during login submission | ✅ No errors |
| Concurrent edit simulation | ✅ No errors |
| Rapid navigation (12 routes, sequential) | ✅ No errors |

### Phase 2: Malicious / Extreme Data ✅
| Test | Payload | Result |
|------|---------|--------|
| XSS in form | `<script>alert(1)</script>`, `javascript:`, `onerror=`, `${7*7}` | ✅ React escapes all |
| SQL Injection | `1' OR '1'='1`, `DROP TABLE`, UNION | ✅ Supabase + RLS blocks |
| Unicode/Emoji | 世界, 🚀🔥, Z̷a̶l̶g̶o̶, null byte | ✅ All accepted without corruption |
| Long text | 1000 chars in email field | ✅ Accepted |
| Negative numbers | "-1" in password field | ✅ Accepted |
| Template injection | `{{constructor...}}`, `\${7*7}` | ✅ Rendered as text |

### Phase 3: Performance
| Metric | Result | Verdict |
|--------|--------|---------|
| JS Heap (idle) | ~36 MB | ✅ Excellent |
| DOM nodes | 113 | ✅ Low |
| Load time | 546 ms | ✅ Fast |
| Heap growth (120 navs) | 0 MB | ✅ No leak detected |
| Bundle size | 432 kB (gzip 139 kB) | ⚠️ Large chunk |
| Scroll stress (30x scroll) | ✅ Smooth | ✅ |

### Phase 4: Security
| Check | Result |
|-------|--------|
| XSS via brand.logo_url | ✅ React escapes img src |
| XSS via brand.color | ✅ React escapes style values |
| XSS via dangerouslySetInnerHTML | ✅ Not used anywhere |
| Input sanitization (safe()) | ✅ Removes `<>"javascript:` |
| CSP in production (render.yaml) | ✅ Configured |
| CSP in development | ❌ Not present |
| GitHub token in localStorage | ❌ **CRITICAL** |
| Impersonation password exposure | ❌ **CRITICAL** |
| Upload MIME validation | ❌ Missing in 4/5 uploads |

### Phase 5: UX
| Test | Result |
|------|--------|
| Keyboard navigation | ✅ Tab reaches all interactive elements |
| Zoom 200% | ✅ Layout adapts |
| Viewport 320px | ✅ No horizontal overflow |
| Viewport 2560px | ✅ Content centered |
| Dark mode | ✅ data-theme works |
| Light mode | ✅ Default |

### Phase 6: Database
| Check | Finding |
|-------|---------|
| Missing indexes | `user_roles(user_id,role)` **P0**, `transactions(user_id)` **P0**, `losses(user_id)` **P0** |
| RLS performance | `auth.uid()` instead of `(SELECT auth.uid())` in ALL policies **P1** |
| TO authenticated missing | All policies **P1** |
| SECURITY DEFINER risk | 13 functions vulnerable **P1** |
| search_path without pg_temp | All SECDEF functions **P1** |
| Duplicate policies | 2 permissive UPDATE on company_profiles **P2** |
| Tables without SELECT/INSERT policies | 4 tables **P2** |
| Unused indexes | idx_ai_cache_user_id, idx_products_user_id **P3** |
| Leaked password check disabled | Supabase Auth **P2** |

### Phase 7: Code
| Pattern | Count | Severity |
|---------|-------|----------|
| Promise.all no catch | 2 | P0 |
| .then() fire-and-forget no catch | 3 | P0 |
| Stale setTimeout overwriting state | 2 | P0 |
| setInterval never cleared | 1 | P0 |
| setTimeout not cleaned on unmount | 3 | P1 |
| Module listeners never removed | 6 | P1 |
| AbortController not used | 3 | P2 |
| setInterval not cleaned on unmount | 1 | P2 |

---

## Priority Action Plan

### Immediate (P0) — 9 items
1. [P0-1] Mover GitHub token de localStorage para Edge Function
2. [P0-2] Corrigir impersonação: sessionStorage + token criptografado
3. [P0-3] `CREATE INDEX idx_user_roles_user_id_role`
4. [P0-4] `CREATE INDEX idx_transactions_user_id` e `idx_losses_user_id`
5. [P0-5] Adicionar `.catch()` no Promise.all do AdminPanel
6. [P0-6] Adicionar `.catch()` no triggerApkBuild
7. [P0-7] Adicionar `.catch()` no useSyncLoop
8. [P0-8] Adicionar token guard no setTimeout do useSession
9. [P0-9] Limpar setInterval do SW polling

### Short-term (P1) — 14 items
10. [P1-1] Remover senha do clipboard/WhatsApp
11. [P1-2] Adicionar CSP meta tag no index.html
12. [P1-3] Validar file.type em todos os uploads
13. [P1-4] Limpar setTimeout do toast no unmount
14. [P1-5] Adicionar .catch() nas promises de impersonação
15. [P1-6] Estabilizar dependência loadData com useRef
16. [P1-7] Substituir auth.uid() por (SELECT auth.uid()) em todas RLS policies
17. [P1-8] Adicionar TO authenticated em todas policies
18. [P1-9] Adicionar pg_temp ao search_path das SECDEF functions
19. [P1-10] Revisar permissões das 13 SECURITY DEFINER functions
20. [P1-11] Validar admin role no servidor
21. [P1-12] Usar setSession em vez de signInWithPassword na impersonação
22. [P1-13] Adicionar cleanup function no registerSW()
23. [P1-14] Usar AbortController + batch no AdminPanel

### Medium-term (P2) — 15 items
24-38. Ver relatório completo FUNCTIONAL_AUDIT.md para itens P2 (ARIA, error handling UX, etc.)

### Backlog (P3) — 9 items
39-47. aria-labels, lint warnings, índices não utilizados, bundle size

---

## Screenshots

Disponíveis em `docs/QA/screenshots-stress/`:
- `05a-zoom200.png` — Landing com zoom 200%
- `05b-viewport320.png` — Landing em 320px
- `05c-viewport2560.png` — Landing em 2560px

---

## Tools Used

- **Playwright** — E2E stress tests (multi-click, dual-tab, rapid nav)
- **Supabase MCP** — list_tables, list_extensions, list_migrations, get_advisors, list_edge_functions
- **Code Review** — race conditions, memory leaks, listeners, timers per subagente
- **Security Review** — XSS, localStorage, CSP, uploads per subagente
- **Web Search** — RLS best practices, SECURITY DEFINER risks, auth.uid() performance

---

*Auditoria de estresse realizada em 2026-07-09. Nenhuma correção foi aplicada — apenas diagnóstico.*
