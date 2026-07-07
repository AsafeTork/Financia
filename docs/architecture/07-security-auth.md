# Arquitetura 07 — Seguranca e Autenticacao

## Visao Geral

Seguranca em 4 camadas: RLS (PostgreSQL), Triggers, RPC SECURITY DEFINER, e gates client-side. Nenhuma `service_role` key no frontend.

---

## Autenticacao (Supabase Auth)

| Aspecto | Detalhe |
|---|---|
| Provedor | Email + senha (Supabase Auth nativo) |
| Sessao | JWT, refresh automatico |
| Bootstrap | `useAuthBootstrap` escuta `onAuthStateChange` |
| Eventos ignorados | `INITIAL_SESSION`, `TOKEN_REFRESHED` (nao alteram dados) |
| Eventos que recarregam | `SIGNED_IN`, `USER_UPDATED` |
| Logout | `signOut()` em `src/lib/auth.js` |
| Reset senha | `updatePassword()` em `src/lib/auth.js` |

---

## RLS (Row Level Security)

### Tabelas protegidas

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `transactions` | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` | owner ou admin |
| `products` | owner ou admin | owner | owner | owner ou admin |
| `losses` | owner ou admin | owner | owner | owner ou admin |
| `company_profiles` | owner ou admin | owner | **branding-only** (ver abaixo) | owner ou admin |
| `user_roles` | owner (propria linha) | — | — | admin |

### `company_profiles` — Policy `update_own_branding_only`

A policy UPDATE mais complexa do sistema:

```sql
WITH CHECK (
  auth.uid() = user_id
  -- Protege campos de plano
  AND plan = (SELECT plan FROM company_profiles WHERE user_id = auth.uid())
  AND plan_expires_at IS NOT DISTINCT FROM (...)
  AND plan_activated_by IS NOT DISTINCT FROM (...)
  -- Branding so se white_label OU admin
  AND (
    branding_fields_inalterados
    OR white_label = true
    OR EXISTS (SELECT 1 FROM user_roles WHERE role = 'admin')
  )
)
```

**Resultado**: usuario free nao consegue alterar cores via API direta. Precisa comprar white-label.

---

## Triggers de Protecao

### `guard_white_label()`

- Tipo: BEFORE UPDATE
- Se `new.white_label != old.white_label` AND caller nao e `service_role`:
  - Reverte `new.white_label` para `old.white_label` (silencioso)
- Impede auto-concessao do pacote white-label

### `prevent_plan_change()`

- Tipo: BEFORE UPDATE
- Se `plan`/`plan_expires_at`/`plan_activated_by` mudaram AND `current_setting('app.allow_plan_change') != '1'`:
  - `RAISE EXCEPTION`
- Sinal `app.allow_plan_change = '1'` so e setado por `set_client_plan` e `stripe_activate_plan`

> **NOTA**: Esta funcao existe no banco mas nao tem CREATE FUNCTION em nenhuma migration. Foi criada manualmente no Supabase Studio. Deve ser versionada.

---

## RPC SECURITY DEFINER

| Funcao | Quem chama | O que faz |
|---|---|---|
| `set_client_plan(a_target, b_plan, c_actor)` | Admin (valida role) | Altera plano + expiracao 31 dias |
| `stripe_activate_plan(p_user, p_plan, p_expires)` | service_role apenas | Ativa plano apos pagamento Stripe |
| `admin_impersonate_start(target_uid)` | Admin | Gera senha temporaria para login como cliente |
| `admin_impersonate_restore(target_uid)` | Admin | Restaura senha original |
| `admin_delete_client(target_uid)` | Admin | Deleta dados + auth.users |
| `set_white_label(target_uid, enabled)` | Admin | Ativa/desativa white-label |
| `admin_set_custom_price(target, cents, plan)` | Admin | Define desconto customizado |
| `admin_db_stats()` | Admin | Tamanho do banco + tabelas |
| `admin_client_usage()` | Admin | Uso por cliente (tx/prod/loss counts) |

### Padrao de prefixos `a_`/`b_`/`c_`

PostgREST serializa parametros JSON em **ordem alfabetica**. Se uma funcao tem 3+ params, os prefixos garantem que a ordem posicional bata:

```sql
set_client_plan(a_target uuid, b_plan text, c_actor text)
-- Chamada: sb.rpc('set_client_plan', {a_target, b_plan, c_actor})
```

---

## Fluxo de Impersonacao (Admin → Cliente)

### Sequencia completa

```
1. ADMIN clica "Entrar" no ClientEditModal
   ↓
2. sb.rpc('admin_impersonate_start', {target_uid})
   → Retorna {email, temp_pass}
   → Salva payload em localStorage._imp (TTL 60s)
   ↓
3. Abre origin + pathname + "?imp=1"
   → SEM hash (senao ?imp=1 fica dentro do fragmento)
   ↓
4. NOVA ABA le localStorage._imp
   → sb.auth.signInWithPassword({email, password: temp_pass})
   → Remove _imp
   → Salva UID em sessionStorage._imp_uid
   ↓
5. Usuario navega como cliente...
   ↓
6. Ao FECHAR a aba (pagehide):
   → Escreve localStorage._imp_restore = uid
   ↓
7. ABA ADMIN ouve 'storage' event
   → Detecta _imp_restore
   → sb.rpc('admin_impersonate_restore', {target_uid: uid})
   → Remove _imp_restore
```

### Vulnerabilidades conhecidas

| Risco | Mitigacao |
|---|---|
| `pagehide` nao dispara em kill forçado | Senha temporaria expira sozinha |
| Token _imp com TTL 60s | Se expirar, nova aba nao autentica |
| Multi-tab: admin pode ter varias impersonacoes | Cada uma tem UID proprio em sessionStorage |

---

## Storage (Cliente)

| Dado | Onde | TTL | Razao |
|---|---|---|---|
| `nancia_gh_token` | localStorage | Permanente | GitHub API para APK build |
| `is_admin` | sessionStorage | Sessao | Limpa ao fechar browser |
| `role_<uid>` | Dexie meta | Permanente | Cache offline da role |
| `last_sync_<uid>` | Dexie meta | Permanente | Delta sync |
| `financia_theme` | localStorage | Permanente | Preferencia dark/light |
| `financia_onboarded_<uid>` | localStorage | Permanente | Flag de onboarding completo |
| `_imp` | localStorage | 60s | Payload de impersonacao |
| `_imp_uid` | sessionStorage | Sessao | UID sendo impersonado |
| `_imp_restore` | localStorage | Eventual | Sinal cross-tab para restaurar |

---

## Storage (Supabase)

### Bucket `logos`

- Tipo: Public read, authenticated write
- Path: `<user_id>/logo.<ext>`
- Policies: SELECT/INSERT/UPDATE/DELETE filtram por `(storage.foldername(name))[1] = auth.uid()::text`
- Admin tem acesso a todas as pastas

### Valicacao de upload

- Frontend: aceita `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`
- Max 2MB (ClientEditModal), 512KB (SettingsView)
- Sem sanitizacao SVG server-side (caveat: SVG pode conter scripts)

---

## Checklist de Seguranca para Novas Features

- [ ] Toda query filtra por `auth.uid() = user_id`
- [ ] Operacao privilegiada via RPC SECURITY DEFINER
- [ ] Nenhuma `service_role` key no codigo frontend
- [ ] Inputs validados e sanitizados (frontend + CHECK constraint no DB)
- [ ] Acao destrutiva pede confirmacao na UI
- [ ] Upload de arquivo tem limite de tamanho
- [ ] Nao expor dados de outros usuarios na resposta
- [ ] Trigger impede auto-alteracao de campos protegidos
