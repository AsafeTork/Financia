---
type: WORKING
status: REVIEW
owner: Segurança
version: 1.0
reviewed_by: Segurança (auto-revisão)
ready_for_integration: false
---

# Security Master Audit — Financia

> **Data:** 2026-07-10  
> **Escopo:** Frontend (React 19 + Vite 5) · Backend (Supabase + Edge Functions) · Pagamentos (Stripe) · Desktop (Electron 31) · Offline-first (Dexie/PWA)  
> **Metodologia:** 4 subagentes paralelos + Supabase MCP + 6 pesquisas web  
> **Subagentes:** Frontend · Database/RLS · Edge Functions/Stripe · PWA/Electron  
> **Pesquisas realizadas:** OWASP Top 10 2025 oficial · Supabase RLS security best practices · Electron security (docs oficiais) · Stripe webhook signature/idempotency · React 19 XSS prevention · PWA service worker security

---

## Matriz de Consolidação

| Subagente | Achados | Críticos | Altos | Médios | Baixos/Info |
|-----------|---------|----------|-------|--------|-------------|
| Frontend | 18 | 2 | 4 | 5 | 7 |
| Database/RLS | 8 | 2 | 2 | 2 | 2 |
| Edge Functions/Stripe | 18 | 3 | 5 | 6 | 4 |
| PWA/Electron | 13 | 0 | 4 | 4 | 5 |
| **Consolidado** | **57** | **5** | **13** | **13** | **16** |

---

## 00 — Conflitos entre Relatórios Resolvidos

| Conflito | Decisão |
|----------|---------|
| CSP aparece em Frontend (FS-002) e PWA (FW-CSP-001-005) | Unificado em seção única CSP |
| `safe()` function cobertura (FS-012 vs inexistente no Edge Functions) | FS-012 mantido como baixo |
| CORS `*` (SEC-016 vs ) | Mantido como informativo — aceitável com JWT |
| Error leaking (SEC-005, SEC-006, SEC-017) | Unificado em um achado consolidado |
| `enforceRateLimit` fail-open (SEC-002) vs taxa por usuário | Mantido como crítico |
| Idempotency (SEC-004) | Mantido como médio (depende de cenário) |

---

## Consolidado: 5 Críticos · 13 Altos · 13 Médios · 16 Baixos/Info

---

## 🔴 CRÍTICOS

### C1 — Service Role Key no `.env.example`
**Fonte:** FS-001 (Frontend)  
**Arquivo:** `environments/.env.example:14`  
**OWASP:** A02:2025 Security Misconfiguration

`VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key` listado em `.env.example`. Se exposta no bundle Vite, qualquer usuário obtém acesso irrestrito ao banco.

**Recomendação:** Remover do `.env.example`. Adicionar CI/CD check que bloqueia build se `VITE_SUPABASE_SERVICE_ROLE_KEY` estiver definida.

---

### C2 — Trigger Functions Expostas a anon/authenticated
**Fonte:** F1 (Database)  
**Arquivo:** Live DB (REVOKE falhou parcialmente)  
**OWASP:** A01:2025 Broken Access Control

| Função | anon | authenticated |
|--------|------|---------------|
| `trg_set_updated_at()` | ✅ EXECUTE | ✅ EXECUTE |
| `guard_white_label()` | ❌ | ✅ EXECUTE |
| `prevent_plan_change()` | ❌ | ✅ EXECUTE |

**SQL corretivo:**
```sql
REVOKE EXECUTE ON FUNCTION public.trg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_white_label() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_plan_change() FROM PUBLIC, anon, authenticated;
```

---

### C3 — Leaked Password Protection Desabilitado
**Fonte:** F2 (Database) — Supabase Advisor  
**Local:** Supabase Auth Settings  
**OWASP:** A07:2025 Authentication Failures

Proteção contra senhas vazadas (HaveIBeenPwned) está desligada. Usuários podem definir senhas que já vazaram.

**Status (2026-08-07):** Projeto no plano **Free** — funcionalidade **indisponível** (requer Pro Plan ou superior). Toggle "Prevent use of leaked passwords" fica desabilitado no Dashboard.

**Recomendação:** 
- **Curto prazo (Free plan):** Implementar validação de senha forte no client-side (mín. 12 chars, bloquear comuns como "password123") + rate limit login rigoroso
- **Médio prazo:** Upgrade para Pro Plan → Ativar em Dashboard → Authentication → Password Security → "Prevent use of leaked passwords"
- **Long term:** Adicionar MFA obrigatório para contas sensíveis (admin, billing)

---

### C4 — Senha em Texto Puro no E-mail
**Fonte:** SEC-001 (Edge Functions)  
**Arquivo:** `supabase/functions/admin-create-client/index.ts:132,150`  
**OWASP:** A08:2025 Software or Data Integrity Failures

Admin cria usuário e senha inicial é enviada **em texto puro** no corpo do e-mail:
```ts
'- Senha inicial: ' + password + '\n\n'
'<b>Senha inicial:</b> ' + password + '</p>'
```

A senha pode ser interceptada, armazenada em logs ou visualizada por terceiros.

**Recomendação:** Enviar magic link / invite em vez da senha literal.

---

### C5 — Rate Limit Fail-Open
**Fonte:** SEC-002 (Edge Functions)  
**Arquivo:** `supabase/functions/_shared/security.ts:128-130`  
**OWASP:** A06:2025 Insecure Design

```ts
  } catch (_) {
    return true; // falha → permite requisição
  }
```

Qualquer erro no banco faz o rate limit **abrir** e permitir a requisição.

**Recomendação:** Mudar para `return false` no catch (fail-closed). Logar o erro.

---

## 🟠 ALTOS

### H1 — 4 SECURITY DEFINER Functions com EXECUTE p/ authenticated
**Fonte:** F3 (Database)  
**OWASP:** A01:2025 Broken Access Control

`admin_client_usage()`, `admin_db_stats()`, `admin_delete_client(uuid)`, `admin_impersonate_restore(uuid)` — todas com admin gate interno, mas se o gate falhar, rodam como superuser.

**Recomendação:** Migrar funções destrutivas para Edge Functions com service_role.

---

### H2 — `set_white_label()` sem Admin Gate
**Fonte:** F4 (Database)  
**Arquivo:** `supabase/migrations/20260626000000_white_label_addon.sql`  
**OWASP:** A01:2025 Broken Access Control

SECURITY DEFINER sem verificação de admin. Só não é chamável atualmente porque GRANT está ausente.

**Recomendação:** Adicionar admin gate mesmo sendo chamada apenas por service_role (defense in depth).

---

### H3 — CSP: `'unsafe-inline'` + `'unsafe-eval'`
**Fonte:** FS-002 (Frontend), FW-CSP-001/002 (PWA)  
**Arquivo:** `index.html:7`  
**OWASP:** A02:2025 Security Misconfiguration

`script-src 'self' 'unsafe-inline' 'unsafe-eval' ...` — anula proteção contra XSS.

**Recomendação:** Remover em build de produção. Usar nonce ou hash. Investigar se dependecias exigem `unsafe-eval`.

---

### H4 — CSP: Sempre via Metatag, nunca Header HTTP
**Fonte:** FS-015 (Frontend), FW-CSP padrão  
**Arquivo:** `index.html:7`  
**OWASP:** A02:2025 Security Misconfiguration

CSP via `<meta>` não permite `frame-ancestors`, `sandbox`, `report-uri`, e é menos efetiva.

**Recomendação:** Servir CSP também via header HTTP no servidor web.

---

### H5 — Electron sem `sandbox: true`
**Fonte:** FW-EL-003 (PWA/Electron)  
**Arquivo:** `electron/main.cjs:14-17`  
**OWASP:** A02:2025 Security Misconfiguration

`sandbox` não configurado (padrão `false`). Processo renderizador tem mais acesso ao SO.

**Recomendação:** `sandbox: true` em webPreferences.

---

### H6 — Idempotency Keys Ausentes em Stripe
**Fonte:** SEC-004 (Edge Functions)  
**OWASP:** A08:2025 Software or Data Integrity Failures

Nenhuma chamada Stripe usa `idempotencyKey`. Risco de duplicação de cobrança em retry.

**Recomendação:** Adicionar `idempotencyKey` em todas as mutações Stripe.

---

### H7 — Error Leaking em 500 (múltiplas funções)
**Fonte:** SEC-005, SEC-006, SEC-017 (Edge Functions)  
**OWASP:** A10:2025 Mishandling of Exceptional Conditions

Mensagens de erro internas vazam para o cliente em: `create-subscription`, `create-payment`, `create-setup-intent`, `cancel-subscription`, `admin-set-white-label`, `admin-set-custom-price`, `send-custom-email`, `get-subscription-status`, `get-payment-method`, `remove-payment-method`, `trigger-apk-build`.

**Recomendação:** Retornar `{ error: 'internal_error' }` sem `message`. Logar erro real no servidor.

---

### H8 — Open Redirect via `magic_link`
**Fonte:** FS-003 (Frontend)  
**Arquivo:** `src/features/auth/useImpersonation.js:21`  
**OWASP:** A01:2025 Broken Access Control

`window.location.href = res.data.magic_link` sem validação de URL.

**Recomendação:** Validar que `magic_link` pertence ao domínio da app antes de redirecionar.

---

### H9 — admin-impersonate sem sanitizeUuid nem rate limit
**Fonte:** SEC-003 (Edge Functions)  
**Arquivo:** `supabase/functions/admin-impersonate/index.ts` (remoto)  
**OWASP:** A01:2025 Broken Access Control

`targetUid` não validado. Sem rate limit. Permite brute-force de magic links.

**Recomendação:** Aplicar `sanitizeUuid()` + `enforceRateLimit()`.

---

### H10 — OAuth Google sem `redirectTo` fixo
**Fonte:** FS-006 (Frontend)  
**Arquivo:** `src/lib/auth.js:16-19`  
**OWASP:** A01:2025 Broken Access Control

`redirectTo: window.location.origin` — dinâmico, sem validação.

**Recomendação:** Usar `import.meta.env.VITE_APP_URL` fixo.

---

### H11 — `document.write` com HTML dinâmico
**Fonte:** FS-005 (Frontend)  
**Arquivo:** `src/lib/exporters.js:52`  
**OWASP:** A09:2025 Logging Failures (Injection)

`win.document.write(doc)` — potencial XSS se `htmlEscape` falhar.

**Recomendação:** Usar `Blob` + `URL.createObjectURL` + `<a download>`.

---

### H12 — Sem CSP no Electron
**Fonte:** FW-EL-006 (PWA/Electron)  
**Arquivo:** `electron/main.cjs`  
**OWASP:** A02:2025 Security Misconfiguration

Se servidor for comprometido e remover CSP, Electron não tem proteção extra.

**Recomendação:** Aplicar CSP via `session.defaultSession.webRequest.onHeadersReceived`.

---

### H13 — String Concatenation em Stripe Search API
**Fonte:** SEC-008 (Edge Functions)  
**Arquivo:** `create-subscription/index.ts:89`, `admin-set-custom-price/index.ts:50-51`  
**OWASP:** A05:2025 Injection

```ts
query: "active:'true' AND metadata['plan_id']:'" + planId + "'",
```

**Recomendação:** Garantir que sanitizer de planos seja sempre atualizado.

---

## 🟡 MÉDIOS

### M1 — `stripe_activate_plan()` sem Admin Gate
**Fonte:** F5 (Database)  
**Arquivo:** `20260624_stripe_activate_plan.sql`

Sem validação de quem chamou. Qualquer chamador pode definir plano para qualquer usuário.

---

### M2 — localStorage armazena UID (`financia_last_uid`)
**Fonte:** FS-007 (Frontend)  
**Arquivo:** `src/features/auth/useAuthBootstrap.js:9,18,33`

UID persistido em localStorage. Qualquer XSS lê o identificador.

---

### M3 — localStorage key com UID (`financia_onboarded_{uid}`)
**Fonte:** FS-008 (Frontend)  
**Arquivo:** `src/App.jsx:157,295`

Chave previsível incorporando UID. Info leak lateral.

---

### M4 — Validação de Upload só no Frontend
**Fonte:** A6 (auditoria inicial)  
**Arquivo:** `src/lib/auth.js:uploadLogo`

Tipo MIME validado apenas no client. Request direto pode enviar qualquer tipo.

---

### M5 — `friendlyStripeError` sem sanitização
**Fonte:** FS-010 (Frontend)  
**Arquivo:** `src/lib/stripe.js:86`

Código de erro Stripe retornado como string sem sanitização.

---

### M6 — REFRESH_CACHE sem validação de URL
**Fonte:** FW-SW-007 (PWA/Electron)  
**Arquivo:** `public/sw.js:63-77`

Handler aceita URLs arbitrárias de postMessage. XSS pode envenenar cache.

---

### M7 — Sem Rate Limit no Webhook
**Fonte:** SEC-009 (Edge Functions)  
**Arquivo:** `supabase/functions/stripe-webhook/index.ts`

Replay de eventos Stripe (mesmo com signature válida) pode causar abuso.

---

### M8 — `admin-create-client` confirmação bypass
**Fonte:** SEC-010 (Edge Functions)  
**Arquivo:** `admin-create-client/index.ts:114-123`

Usuário é criado mesmo se e-mail falhar. Retorna user_id.

---

### M9 — Weak Password Validation
**Fonte:** SEC-011 (Edge Functions)  
**Arquivo:** `admin-create-client/index.ts:71`

Apenas tamanho ≥ 8. Sem complexidade (maiúscula, número, especial).

---

### M10 — Dynamic Column Update
**Fonte:** SEC-012 (Edge Functions)  
**Arquivo:** `admin-set-custom-price/index.ts:148-154`

Propriedade dinâmica para definir coluna de update. Risco se novos planos forem adicionados sem revisão.

---

### M11 — `img-src` e `connect-src` muito permissivos
**Fonte:** FW-CSP-003/004 (PWA/Electron)  
**Arquivo:** `index.html:7`

`connect-src 'self' https: wss:` amplo demais. `img-src 'self' data: blob: https:` permite pixel tracking.

---

### M12 — `safeStorage` não utilizado no Electron
**Fonte:** FW-EL-008 (PWA/Electron)  
**Arquivo:** `electron/main.cjs`

Dados financeiros armazenados sem criptografia em repouso no Electron.

---

### M13 — Security Headers Ausentes
**Fonte:** A14, A15 (auditoria inicial)  
**OWASP:** A02:2025 Security Misconfiguration

`X-Content-Type-Options: nosniff` e `X-Frame-Options: DENY` ausentes.

---

## 🟢 BAIXOS / INFO

- B1 — `private.is_admin()` exposto a authenticated (necessário para RLS)
- B2 — `anon` tem privilégios DML totais (mitigado por RLS)
- B3 — `safe()` coverage limitada (não para HTML output)
- B4 — `htmlEscape` não escapa aspas
- B5 — CORS `*` em todas as Edge Functions
- B6 — Precaching com regex (frágil)
- B7 — Nenhum logging de eventos de segurança
- B8 — Sempre-vulnerability scanning (Dependabot/Snyk)
- B9 — PostMessage sem validação de origin no SW
- B10 — `window.__financia_reload_plan` exposto globalmente
- B11 — `shell.openExternal` sem validação de protocolo
- B12 — `brand.logo_url` sem validação em alguns componentes
- B13 — Service Role Key não documentada como proibida no frontend
- B14 — `worker-src` não explícito no CSP
- B15 — preload script ausente no Electron
- B16 — JWT policies vs `private.is_admin()` divergência potencial

---

---

## Arquivos Afetados (consolidado)

| Arquivo | Achados |
|---------|---------|
| `index.html` | H3, H4, M11, B14 |
| `environments/.env.example` | C1, B13 |
| `electron/main.cjs` | H5, H12, M12, B15 |
| `public/sw.js` | M6, B6 |
| `src/lib/auth.js` | H10, M4 |
| `src/lib/stripe.js` | M5 |
| `src/lib/exporters.js` | H11, B4 |
| `src/lib/utils.js` | B3 |
| `src/App.jsx` | M3, B10 |
| `src/features/auth/useAuthBootstrap.js` | M2 |
| `src/features/auth/useImpersonation.js` | H8 |
| `supabase/functions/_shared/security.ts` | C5 |
| `supabase/functions/admin-create-client/index.ts` | C4, M8, M9 |
| `supabase/functions/admin-impersonate/index.ts` | H9 |
| `supabase/functions/stripe-webhook/index.ts` | M7 |
| `supabase/functions/create-subscription/index.ts` | H6, H13 |
| `supabase/functions/create-payment/index.ts` | H6 |
| `supabase/functions/admin-set-custom-price/index.ts` | H13, M10 |
| `supabase/functions/stripe-config/index.ts` | B5 |
| `supabase/functions/trigger-apk-build/index.ts` | H7 |
| Migrations: várias | C2, C3, H1, H2, M1, B1, B2 |
| Live DB config | C3 (Supabase Auth UI) |

---

## OWASP Top 10 2025 — Coverage Map

| Categoria | Achados do Financia |
|-----------|--------------------|
| **A01** Broken Access Control | C2, H1, H2, H8, H9, H10 |
| **A02** Security Misconfiguration | C1, H3, H4, H5, H12, M13 |
| **A03** Software Supply Chain | B8 |
| **A04** Cryptographic Failures | — |
| **A05** Injection | H13 |
| **A06** Insecure Design | C5 |
| **A07** Authentication Failures | C3 |
| **A08** Software/Data Integrity | C4, H6 |
| **A09** Logging & Alerting | H11, B7 |
| **A10** Exceptional Conditions | H7 |

---

## 57 achados · 5 críticos · 13 altos · 13 médios · 16 baixos/info
