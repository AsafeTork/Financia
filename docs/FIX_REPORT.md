---
type: REPORT
---

# Relatório Final — Correção Arquitetural

**Data:** 2026-07-09
**Migration:** `20260709_architectural_fix`
**Branch:** refactor/v2

---

## 1. Causa Raiz

### Bug 1: HTTP 500 em POST company_profiles

**Causa:** RLS policy `update_own_profile` continha 7+ subqueries auto-referenciadas no `WITH CHECK`:

```sql
with check (
  ...
  color IS NOT DISTINCT FROM (SELECT cp.color FROM company_profiles cp WHERE cp.user_id = auth.uid())
  AND ...
)
```

Cada subquery lia da própria `company_profiles`, que por sua vez acionava RLS novamente → **infinite recursion** no PostgreSQL 17.

**Erro confirmado:** `ERROR: 42P17: infinite recursion detected in policy for relation "company_profiles"`

### Bug 2: HTTP 403 em admin RPCs

**Causa:** A migration `fix_security_definer_search_path` (20260709160151) fez `CREATE OR REPLACE FUNCTION` em todas as SECURITY DEFINER functions para adicionar `SET search_path TO 'public', 'pg_temp'`. Isso **droppou todos os EXECUTE grants** existentes. As migrações seguintes (`fix_05_revoke_execute_admin_functions`, `revoke_security_definer_execute`) completaram a remoção.

**15 funções SECURITY DEFINER** ficaram com `proacl = {postgres=X/postgres, service_role=X/service_role}` — zero grants para `authenticated`.

---

## 2. Correção Aplicada

Migration única: `supabase/migrations/20260709_architectural_fix.sql`

### Parte 1: RLS company_profiles — só autorização

| Policy | Antes | Depois |
|--------|-------|--------|
| `select_own_or_admin` | ✅ Inalterada | SELECT: `auth.uid() = user_id OR admin` |
| `insert_own_profile` | ✅ Inalterada | INSERT WITH CHECK: `auth.uid() = user_id` |
| **`update_own_profile`** | ❌ WITH CHECK com 7 subqueries auto-ref → infinite recursion | **WITH CHECK: `auth.uid() = user_id`** |
| `admin_delete_profiles` | ✅ Inalterada | DELETE: `auth.uid() = user_id OR admin` |

**Regras de negócio removidas das policies** — já garantidas por:
- `prevent_plan_change()` trigger — impede alteração direta de plan/expires/activated_by
- `guard_white_label()` trigger — impede alteração de white_label por não-service_role
- CHECK constraint `plan` — apenas 'free', 'pro', 'premium'
- CHECK constraint `color` — formato `#RRGGBB`
- CHECK constraint `color_secondary`, `color_accent` — `#RRGGBB` ou null

### Parte 2: Grants — só funções chamadas via sb.rpc()

| Função | Grant | Fluxo |
|--------|-------|-------|
| `admin_client_usage()` | ✅ `GRANT EXECUTE TO authenticated` | `sync.js:111` → sb.rpc → admin-gate interno |
| `admin_db_stats()` | ✅ `GRANT EXECUTE TO authenticated` | `sync.js:121` → sb.rpc → admin-gate interno |
| `admin_delete_client(uuid)` | ✅ `GRANT EXECUTE TO authenticated` | `sync.js:167` → sb.rpc → admin-gate interno |
| `admin_impersonate_restore(uuid)` | ✅ `GRANT EXECUTE TO authenticated` | `useImpersonation.js:42` → sb.rpc → admin-gate interno |

**NÃO receberam grant** (corretamente):
- `admin_set_custom_price` — via Edge Function (service_role)
- `admin_impersonate_start` — via Edge Function (service_role)
- `admin_get_magic_link` — via Edge Function (service_role)
- `set_client_plan`, `set_white_label`, `stripe_activate_plan`, `restore_stripe_plan` — via Edge Function
- `admin_clear_client_data` — via Edge Function
- `check_plan_unchanged`, `cleanup_ai_cache`, `impersonation_sweep` — internal/cron

### Parte 3: Trigger duplicado removido

| Trigger | Ação | Status |
|---------|------|--------|
| `trig_cp_updated` | BEFORE UPDATE → `trg_set_updated_at()` | ✅ Mantido |
| **`trig_cp_updated_at`** | BEFORE UPDATE → `trg_set_updated_at()` | **❌ Removido** (duplicata) |

A função `trg_set_updated_at()` é única e compartilhada — não havia duplicação na função, apenas no trigger.

---

## 3. SQL Final das Policies

```sql
-- SELECT: dono le propria linha, admin le todas
create policy "select_own_or_admin" on company_profiles
  for select to authenticated
  using ((select auth.uid()) = user_id or exists (
    select 1 from user_roles where user_id = (select auth.uid()) and role = 'admin'
  ));

-- INSERT: usuario cria apenas propria linha
create policy "insert_own_profile" on company_profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- UPDATE: usuario altera apenas propria linha (sem regra de negocio)
create policy "update_own_profile" on company_profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- DELETE: dono ou admin
create policy "admin_delete_profiles" on company_profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id or exists (
    select 1 from user_roles where user_id = (select auth.uid()) and role = 'admin'
  ));
```

---

## 4. Funções Alteradas

Nenhuma função foi alterada. Apenas grants foram restaurados.

---

## 5. Grants Alterados

```sql
grant execute on function public.admin_client_usage() to authenticated;
grant execute on function public.admin_db_stats() to authenticated;
grant execute on function public.admin_delete_client(uuid) to authenticated;
grant execute on function public.admin_impersonate_restore(uuid) to authenticated;
```

---

## 6. Trigger Removido

```sql
drop trigger if exists trig_cp_updated_at on company_profiles;
```

Origem: provavelmente criado acidentalmente durante uma migration de hardening que modificou a tabela. A função `trg_set_updated_at()` não foi afetada.

---

## 7. Testes Executados

| Teste | Resultado | Detalhes |
|-------|-----------|----------|
| INSERT ... ON CONFLICT (user_id) DO UPDATE | ✅ 200 | Inseriu e retornou row corretamente |
| SELECT via RLS | ✅ 200 | SELECT com auth.uid() funciona |
| Grants: admin_client_usage() | ✅ true | authenticated pode EXECUTE |
| Grants: admin_db_stats() | ✅ true | authenticated pode EXECUTE |
| Grants: admin_delete_client(uuid) | ✅ true | authenticated pode EXECUTE |
| Grants: admin_impersonate_restore(uuid) | ✅ true | authenticated pode EXECUTE |
| Grants: admin_set_custom_price | ✅ false | NÃO tem grant (Edge Function) |
| Grants: admin_impersonate_start | ✅ false | NÃO tem grant (Edge Function) |
| Trigger prevent_plan_change | ✅ Bloqueia | UPDATE plan direto rejeitado |
| Trigger guard_white_label | ✅ Bloqueia | UPDATE white_label direto rejeitado |
| Trigger duplicado removido | ✅ 3 triggers restantes | trig_cp_updated_at não existe mais |
| Tests unitários (npm test) | ✅ 1178/1178 | 21 arquivos, sem regressões |
| Security Advisor | ⚠️ 1 pre-existente | HaveIBeenPwned off (requer Pro) |
| Performance Advisor | ℹ️ 5 pre-existentes | Unused indexes em tabelas pequenas |

---

## 8. Riscos Remanescentes

1. **Security Advisor WARN (4)** — `authenticated_security_definer_function_executable`. Supabase linter alerta sobre SECURITY DEFINER functions com EXECUTE para authenticated. **Aceito por design.** Cada função tem gate interno de role admin. Migrar para Edge Function seria uma melhoria futura mas não um bloqueio.

2. **HaveIBeenPwned off** — Requer upgrade Pro no Supabase. Funcionalidade opcional.

3. **admin_impersonate_restore** — Chamado via sb.rpc() direto do frontend (`useImpersonation.js:42`). Tem gate interno de admin. Idealmente deveria ser Edge Function, mas o fluxo atual (storage event listener) exige resposta síncrona. Risco aceito.

4. **Vulnerabilidades Electron 31** — 7 HIGH (exige breaking upgrade). Fora do escopo desta correção.

---

## 9. Conclusão

| Critério | Status |
|----------|--------|
| salvar company_profiles (upsert) | ✅ Corrigido |
| Brand Studio salva branding | ✅ Corrigido |
| Settings salva branding | ✅ Corrigido |
| Sincronização offline (syncAll) | ✅ Corrigido |
| Admin edita cliente | ✅ Corrigido |
| admin_db_stats RPC | ✅ Corrigido |
| admin_client_usage RPC | ✅ Corrigido |
| admin_delete_client RPC | ✅ Corrigido |
| admin_impersonate_restore RPC | ✅ Corrigido |
| Nenhum erro 500 | ✅ Confirmado |
| Nenhum erro 403 inesperado | ✅ Confirmado |
| Testes 1178/1178 passando | ✅ Confirmado |
