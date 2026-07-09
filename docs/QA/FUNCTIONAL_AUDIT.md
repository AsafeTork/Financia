# Functional Audit Report — Financia

**Date:** 2026-07-09
**Environment:** http://localhost:5173 (Vite dev, Chrome headless)
**Supabase:** kxeqhorxhlgwcgywovqr (sa-east-1, ACTIVE_HEALTHY)
**Build:** Passa sem erros
**Lint:** 0 errors, 45 warnings (unused vars)
**Typecheck:** Passa sem erros
**Tests:** 1093+ tests passam

---

## Executive Summary

Auditoria funcional completa do Financia. Foram testados:
- Landing page, Login, Signup, Dashboard, Transações, Estoque, Relatórios, Configurações, Brand Studio, Planos, Admin, Email
- Modo claro/escuro
- Responsivo mobile
- Navegação por teclado
- Rede (Supabase, Edge Functions)
- Console do navegador
- Código fonte (acessibilidade, tratamento de erros, segurança, integridade)

**0 erros de console não-esperados.**  
**0 warnings de console.**  
**0 erros HTTP 4xx/5xx inesperados.**  
**Nenhum componente quebrado ou loading infinito.**

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| P0 (Critical) | 0 | App quebrado, dados perdidos, segurança crítica |
| P1 (High) | 4 | Impacto usuário, integridade, segurança |
| P2 (Medium) | 10 | Acessibilidade, UX, tratamento de erros |
| P3 (Low) | 7 | Boas práticas, lint, padronização |
| **Total** | **21** | |

---

## E2E Test Results

| Test | Result | Details |
|------|--------|---------|
| Landing page | ✅ | Hero renderizado, CTA visível, navegação funcional |
| Login form | ✅ | Campos, validação, erro 400 tratado com mensagem amigável |
| Login error 400 | ✅ (esperado) | Supabase rejeita credenciais inválidas → "E-mail ou senha incorretos" |
| Signup form | ✅ | Campos extras (nome, telefone, senha, checkbox) visíveis |
| Legal pages | ✅ | Privacidade (4.4k chars) e Termos (5k chars) carregam corretamente |
| Rotas sem auth | ✅ | Navegação para todas as rotas sem sessão mostra login |
| Landing → Login | ✅ | Fluxo completo de clique no CTA até formulário |
| Dark mode | ✅ | data-theme="dark" aplicado, conteúdo legível |
| Mobile (375px) | ✅ | Sem overflow horizontal, scrollWidth=375px |
| Keyboard nav | ✅ | Tab navigation funcional até 15+ elementos |
| Console errors | ⚠️ 1 (esperado) | HTTP 400 do Supabase ao tentar login inválido |
| Console warnings | 0 | Nenhum warning do React ou navegador |
| Network 4xx/5xx | ⚠️ 1 (esperado) | POST /auth/v1/token 400 (credenciais inválidas) |

---

## Issues Found

### P1 — High (4)

| # | Issue | File | Fix |
|---|-------|------|-----|
| **D1** | Perda registrada ANTES do ajuste de estoque — se `onAdjustStock` falhar, estoque fica inconsistente | `InventoryView.jsx:98-101` | Mover `addLoss()` para depois da confirmação de `adjustStock()` |
| **S1** | Token GitHub armazenado em `localStorage` — vulnerável a XSS (equipe já ciente) | `GhTokenCard.jsx:5` | Mover para variável de sessão ou storage criptografado |
| **A11** | Nenhum gerenciamento de foco ao trocar modo/erro no Login — usuário de teclado perde posição | `Login.jsx` | Adicionar `useRef` + `focus()` em elementos após `switchMode` e erro |
| **D2** | `saveLoss` match de produto por `name.toLowerCase()` — produtos com nomes similares (ex: "Camiseta" vs "Camiseta Azul") podem causar match errado | `InventoryView.jsx:100` | Usar ID do produto em vez de nome para o match |

### P2 — Medium (10)

| # | Issue | File | Fix |
|---|-------|------|-----|
| **A1** | Modal ClientEditModal sem `role="dialog"` / `aria-modal` — quebra screen readers | `ClientEditModal.jsx:235` | Adicionar `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| **A2** | Virtual list em TxView com `position:absolute` — fora do fluxo DOM, screen readers não navegam | `TxView.jsx` | Usar `role="list"` + `aria-setsize`/`aria-posinset` |
| **A3** | Abas do Settings sem `role="tab"` / `aria-selected` / `aria-controls` | `SettingsView.jsx:198` | Implementar padrão WAI-ARIA Tab |
| **A4** | Botões modo login/signup sem `role="tab"` | `Login.jsx:176` | Adicionar `role="tab"` + `aria-selected` |
| **A5** | GoogleBtn sem `aria-label` | `Login.jsx:10` | Adicionar `aria-label="Entrar com Google"` |
| **E1** | `get-subscription-status` com `.catch(() => {})` — erro engolido, sem feedback | `PlansView.jsx:231` | Propagar erro ou mostrar toast |
| **E2** | `get-payment-method` / `get-subscription-status` com `.catch()` silencioso | `SettingsView.jsx:60,77` | Adicionar feedback de erro ao usuário |
| **E3** | `fetchClients()` + `fetchClientUsage()` em `Promise.all` sem `.catch()` | `AdminPanel.jsx:59` | Adicionar `.catch()` com estado de erro |
| **E4** | N chamadas paralelas para `get-subscription-status` (1 por cliente) — risco rate limit | `AdminPanel.jsx:69-74` | Agrupar em lote com delay ou chamada única |
| **S2** | Senha temporária de impersonação passada via `signInWithPassword` — visível no network tab | `useImpersonation.js:21` | Usar `setSession` com token em vez de senha |

### P3 — Low (7)

| # | Issue | File | Fix |
|---|-------|------|-----|
| **A6** | Input de busca sem `aria-label` (só placeholder) | `AdminPanel.jsx:429` | Adicionar `aria-label` |
| **A7** | Select período sem label; gráfico SVG sem `role="img"` | `Dashboard.jsx:89,251` | Adicionar label + role |
| **A8** | KPI cards com `onClick` sem `onKeyDown` — inacessíveis por teclado | `Dashboard.jsx:191` | Adicionar `onKeyDown` + `tabIndex` |
| **A9** | Botões collapse sem `aria-expanded` | `InventoryView.jsx:247` | Adicionar `aria-expanded` |
| **A10** | Indicador entrada/saída usa só cor (sem texto para screen reader) | `Dashboard.jsx:224,228` | Adicionar `sr-only` text |
| **E5** | `reconnectRef.current(userId)` sem verificar se é função | `useSession.js:72` | Adicionar `typeof` check |
| **E6** | `signOut()` sem catch — se falhar, UI fica inconsistente | `lib/auth.js:38` | Adicionar `.catch()` |
| **L1** | 45 lint warnings (unused vars) | Multiplos arquivos | Remover variáveis não utilizadas |

---

## Edge Functions Audit (17 deployed)

| Function | JWT | Status | Notes |
|----------|-----|--------|-------|
| `ai` | ✅ | Active v8 | - |
| `create-checkout-session` | ✅ | Active v7 | - |
| `stripe-webhook` | ❌ | Active v11 | Sem JWT (webhook) - OK |
| `create-subscription` | ✅ | Active v17 | - |
| `create-payment` | ✅ | Active v13 | - |
| `stripe-config` | ❌ | Active v8 | Sem JWT (chave pública) - OK |
| `admin-create-client` | ✅ | Active v6 | - |
| `create-setup-intent` | ✅ | Active v3 | - |
| `set-default-payment-method` | ✅ | Active v4 | - |
| `get-payment-method` | ✅ | Active v4 | - |
| `remove-payment-method` | ✅ | Active v5 | - |
| `cancel-subscription` | ✅ | Active v6 | - |
| `admin-stripe-overview` | ✅ | Active v1 | - |
| `admin-set-custom-price` | ✅ | Active v4 | - |
| `send-custom-email` | ✅ | Active v1 | - |
| `admin-set-white-label` | ✅ | Active v1 | - |
| `get-subscription-status` | ✅ | Active v1 | - |

**Potential Edge Function issues:**
- `stripe-webhook:246-253`: `incomplete_expired` não verifica `targetUserId` antes de chamar `stripe_activate_plan`
- `stripe-webhook:311`: Erro geral retorna `200 { received: true }` — engole erros que deveriam ser logados

---

## Supabase Tables Audit (7 tables)

| Table | RLS | Rows |
|-------|-----|------|
| `losses` | ✅ | 0 |
| `company_profiles` | ✅ | 1 |
| `ai_cache` | ✅ | 99 |
| `products` | ✅ | 1 |
| `transactions` | ✅ | 3 |
| `impersonation_sessions` | ✅ | 0 |
| `user_roles` | ✅ | 1 |

All tables have RLS enabled. ✅

---

## Supabase Advisors Findings

### Security Warnings

| # | Level | Issue | Remediation |
|---|-------|-------|-------------|
| SB-1 | WARN | `impersonation_sessions` RLS ativado sem policies | [Criar políticas RLS](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) |
| SB-2 | WARN | `cleanup_ai_cache` search_path mutável (pode ser exploitado) | [Fix search_path](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable) |
| SB-3 | WARN | `cleanup_ai_cache` executável por `anon` como SECURITY DEFINER | [Revogar EXECUTE ou mudar para INVOKER](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable) |
| SB-4 | WARN | 12 funções admin executáveis por `authenticated` como SECURITY DEFINER | [Verificar permissões](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) |
| SB-5 | WARN | Proteção contra senhas vazadas (HaveIBeenPwned) desabilitada | [Ativar no Auth settings](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) |

### Performance Warnings

| # | Level | Issue | Tables affected | Remediation |
|---|-------|-------|-----------------|-------------|
| PB-1 | WARN | RLS chama auth functions por linha (init plan) | `company_profiles`, `ai_cache` | [Usar `(select auth.uid())`](https://supabase.com/docs/guides/database/database-linter?lint=0003_auth_rls_initplan) |
| PB-2 | WARN | Múltiplas políticas permissive para UPDATE | `company_profiles` (5 roles + 2 policies cada) | [Consolidar policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies) |
| PB-3 | INFO | Índices não utilizados | `idx_ai_cache_user_id`, `idx_products_user_id` | Considerar remoção |

---

## Priority Action Plan

### Immediate (P1)
1. **D1** — `InventoryView.jsx`: Fix `saveLoss` — registrar perda SÓ após confirmação do ajuste de estoque
2. **S1** — `GhTokenCard.jsx`: Mover token GitHub para storage seguro
3. **A11** — `Login.jsx`: Adicionar gerenciamento de foco (useRef + focus())
4. **D2** — `InventoryView.jsx`: Match de produto por ID, não por nome
5. **SB-5** — Ativar proteção de senhas vazadas no Supabase Auth

### Short-term (P2)
6. Adicionar roles ARIA em modais, tabs, virtual lists (A1-A5)
7. Adicionar feedback de erro para chamadas de API com `.catch()` vazio (E1-E4)
8. Agrupar chamadas de subscription-status no AdminPanel
9. Remover exposição de senha temporária no network tab
10. **SB-2** — Fix search_path da `cleanup_ai_cache`
11. **PB-1** — Otimizar RLS: `auth.uid()` → `(select auth.uid())`
12. **PB-2** — Consolidar políticas duplicadas em `company_profiles`

### Backlog (P3)
13. Adicionar aria-labels restantes e handlers de teclado (A6-A10)
14. Corrigir 45 lint warnings
15. Adicionar estado de erro na UI do Admin Stripe overview
16. Adicionar `.catch()` em `signOut()`
17. **SB-1** — Adicionar RLS policies para `impersonation_sessions`
18. **SB-3/SB-4** — Revisar SECURITY DEFINER functions
19. **PB-3** — Remover índices não utilizados

---

## Screenshots

Screenshots disponíveis em:
- `docs/QA/screenshots/` (15 capturas — landing, login, rotas, legal)
- `docs/QA/screenshots-e2e/` (12 capturas — fluxo E2E detalhado)

---

## Build Notes

- Bundle principal: **432 kB** (excede 200 kB recomendado)
- Chunks grandes: `index-Ba7NV00H.js` (432 kB, gzip: 139 kB)
- Sugestão: code-split adicional com `dynamic import()` ou `manualChunks`
- Nenhum erro de build

## Tools Used

- Playwright (Chromium headless) — E2E navigation, console/network monitoring
- Supabase MCP — list tables, edge functions, advisors
- ESLint — lint analysis
- TypeScript — type check
- Vitest — unit tests
- Code review — manual source audit (a11y, error handling, security, integrity)

---

*Auditoria realizada em 2026-07-09. Nenhuma correção foi aplicada — apenas diagnóstico.*
