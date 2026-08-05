---
type: REPORT
---

# Incident Report — Salvamento Bloqueado (Produção)

**Date:** 2026-07-09
**Severity:** CRITICAL — 100% dos salvamentos de company_profiles bloqueados
**Branch:** refactor/v2

---

## Bug 1: HTTP 500 em POST /rest/v1/company_profiles

### Sintoma

Toda chamada `sb.from('company_profiles').upsert(...)` retorna HTTP 500.

Afeta:
- `useBrandManager.js:64` — `saveBrand()` (salvar configurações de branding)
- `sync.js:67` — `syncProfiles()` (sincronização offline→nuvem)
- `ClientEditModal.jsx:210` — admin editando cliente
- `admin-create-client/index.ts:98` — Edge Function criando cliente

### Causa Raiz

**RLS policy `update_own_profile` com subqueries auto-referenciadas causa infinite recursion no PostgreSQL 17.**

A policy `update_own_profile` tem `WITH CHECK` que lê da própria `company_profiles`:

```sql
CREATE POLICY "update_own_profile" ON company_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND plan IS NOT DISTINCT FROM (
      SELECT cp.plan FROM company_profiles cp WHERE cp.user_id = auth.uid()
    )
    AND (
      (
        color IS NOT DISTINCT FROM (
          SELECT cp.color FROM company_profiles cp WHERE cp.user_id = auth.uid()
        )
        AND color_secondary IS NOT DISTINCT FROM (...)
        AND color_accent IS NOT DISTINCT FROM (...)
        AND theme IS NOT DISTINCT FROM (...)
        AND logo_url IS NOT DISTINCT FROM (...)
        AND custom_palette IS NOT DISTINCT FROM (...)
        AND visual_version IS NOT DISTINCT FROM (...)
      )
      OR (SELECT cp.white_label FROM company_profiles cp WHERE cp.user_id = auth.uid()) = true
      OR EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
    )
  );
```

Quando PostgREST gera `INSERT ... ON CONFLICT (user_id) DO UPDATE`, o PostgreSQL avalia o `WITH CHECK` da UPDATE policy. Cada subquery `SELECT cp.x FROM company_profiles cp WHERE cp.user_id = auth.uid()` aciona RLS novamente sobre `company_profiles`, que avalia a mesma policy, criando um ciclo infinito.

**Erro confirmado no Postgres logs:**
```
ERROR: infinite recursion detected in policy for relation "company_profiles"
```

**Reproduzido via SQL direto:**
```sql
INSERT INTO company_profiles (user_id, name, logo, color)
VALUES ('00000000-...', 'Test', 'L', '#002f59')
ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name;
-- ERROR: 42P17: infinite recursion detected in policy for relation "company_profiles"
```

### Migrações Envolvidas

| Migration | Nome | Efeito |
|-----------|------|--------|
| `20260709160102` | `fix_02c_recreate_update_own_branding_only` | Criou a policy `update_own_profile` original |
| `20260709160108` | `fix_company_profiles_rls` | Tentou corrigir RLS company_profiles |
| `20260709160452` | `fix_final_restore_update_profile_with_restrictions` | Tentativa final de restaurar com restrições |

Todas foram aplicadas remotamente via MCP `apply_migration` durante F1 (QA Fixes). **Nenhuma existe como arquivo local.**

### Fluxo saveBrand

```
SettingsView.jsx / BrandStudioView.jsx
  ↓ onSave={saveBrand} (prop)
routes.jsx:27-29
  ↓ saveBrand={saveBrand}
App.jsx:205: const {saveBrand} = useSession(...)
  ↓
useSession.js:56: const { saveBrand } = useBrandManager(props)
  ↓
useBrandManager.js:9: async function saveBrand(nb)
  ↓ 1. Salva no Dexie (ldb.profiles.put)
  ↓ 2. Atualiza estado React (setBrand)
  ↓ 3. Se online: sb.from('company_profiles').upsert({...})
  ↓
PostgREST: POST /rest/v1/company_profiles?on_conflict=user_id
  ↓
PostgreSQL: INSERT ... ON CONFLICT (user_id) DO UPDATE
  ↓
RLS "update_own_profile" WITH CHECK → subquery company_profiles → INFINITE RECURSION
  ↓
HTTP 500 ← toast("Não sincronizado — tentaremos em breve")
```

### Impacto

- **Nenhum salvamento de branding persiste no Supabase**
- Usuário vê toast "Não sincronizado" e acredita que foi salvo, mas o dado só existe no IndexedDB local (Dexie)
- Admin não consegue editar clientes via ClientEditModal
- Sincronização offline falha silenciosamente (`sync.js:69` marca `_synced: 1` mesmo com erro)

---

## Bug 2: HTTP 403 em RPCs admin_db_stats / admin_client_usage

### Sintoma

Toda chamada `sb.rpc('admin_db_stats')` e `sb.rpc('admin_client_usage')` retorna 403.

Afeta:
- `sync.js:111` — `fetchClientUsage()`
- `sync.js:121` — `fetchDbStats()`
- Painel Admin (AdminPanel.jsx via fetchClients)

### Causa Raiz

**As funções SECURITY DEFINER perderam a permissão EXECUTE para `authenticated`.**

Estado atual:
```sql
proacl = {postgres=X/postgres, service_role=X/service_role}
-- authenticated não tem EXECUTE
```

Confirmação:
```sql
SELECT has_function_privilege('authenticated', 'admin_db_stats()', 'EXECUTE');
-- false
SELECT has_function_privilege('authenticated', 'admin_client_usage()', 'EXECUTE');
-- false
```

As funções foram originalmente criadas com grants corretos:
- `20260705_harden_security.sql` linha 11-14: `GRANT EXECUTE ON ... TO authenticated` ✅

Mas durante o F1 hardening, as migrações remotas recriaram as funções via `CREATE OR REPLACE` (para adicionar `SET search_path TO 'public', 'pg_temp'`), o que **droppa todos os grants existentes**. Os grants não foram restaurados.

### Migrações Envolvidas

| Migration | Nome | Efeito |
|-----------|------|--------|
| `20260709160151` | `fix_security_definer_search_path` | Re-criou TODAS SECURITY DEFINER functions com search_path seguro → **dropou grants** |
| `20260709160159` | `fix_05_revoke_execute_admin_functions` | Removeu EXECUTE de funções admin (após terem sido dropadas) |
| `20260709160212` | `revoke_security_definer_execute` | Removeu EXECUTE residual |

Ordem dos eventos:
1. `fix_security_definer_search_path` fez `CREATE OR REPLACE FUNCTION admin_db_stats()` — grants perdidos
2. `fix_05_revoke_execute_admin_functions` fez `REVOKE EXECUTE ... FROM authenticated` — redundante pois já não existia
3. `revoke_security_definer_execute` — mais revogações

### Impacto

- Painel Admin não carrega db_stats (uso do banco)
- Painel Admin não carrega client_usage (contagem de transações/clientes)
- Usuário vê valores zerados ou vazios nas estatísticas
- **Mesmo admins legítimos** são bloqueados pois o erro é no EXECUTE grant, não no gate interno

---

## Plano Mínimo de Correção

### Correção 1: RLS infinite recursion

**Opção A (recomendada):** Substituir as subqueries auto-referenciadas por consulta a uma função estável ou usar a OLD row diretamente.

A policy `update_own_profile` precisa ser DROPada e recriada sem subqueries que leem `company_profiles`. A intenção original era impedir que usuários alterassem plan/colors diretamente — isso já é garantido pelo trigger `prevent_plan_change()` para planos.

Solução: Simplificar `update_own_profile` para:
```sql
CREATE POLICY "update_own_profile" ON company_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

As restrições de plan/color já são garantidas por:
- `prevent_plan_change()` trigger (BEFORE UPDATE)
- `guard_white_label()` trigger (BEFORE UPDATE)

**Opção B:** Usar função SECURITY DEFINER auxiliar que lê company_profiles sem RLS recursivo.

### Correção 2: EXECUTE grants

```sql
GRANT EXECUTE ON FUNCTION public.admin_db_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_client_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_custom_price(uuid, integer) TO authenticated;
```

### Correção 3: Remover trigger duplicado

O trigger `trig_cp_updated_at` é duplicação de `trig_cp_updated` — ambos chamam `trg_set_updated_at()`. Remover o duplicado.

### Checklist de Verificação Pós-Correção

- [ ] `INSERT ... ON CONFLICT (user_id) DO UPDATE` em company_profiles retorna 200
- [ ] `saveBrand()` persiste dados no Supabase corretamente
- [ ] `syncProfiles()` sincroniza sem erros
- [ ] `sb.rpc('admin_db_stats')` retorna dados para admin users
- [ ] `sb.rpc('admin_client_usage')` retorna dados para admin users
- [ ] AdminSetCustomPrice funciona via Edge Function
- [ ] Testes 1178/1178 continuam passando
- [ ] Nenhuma regressão de segurança (usuários não-admin ainda não conseguem alterar plan/colors)

---

## Resumo

| Bug | HTTP | Causa | Migrações | Arquivos |
|-----|------|-------|-----------|----------|
| company_profiles upsert | 500 | RLS infinite recursion (subqueries auto-ref) | `fix_02c`, `fix_company_profiles_rls`, `fix_final_restore` | `useBrandManager.js:64`, `sync.js:67` |
| admin_db_stats | 403 | EXECUTE grant perdido (CREATE OR REPLACE sem re-grant) | `fix_security_definer_search_path`, `fix_05_revoke_execute` | `sync.js:111,121` |
| admin_client_usage | 403 | EXECUTE grant perdido (idem) | mesma cadeia | `sync.js:111` |

**NENHUMA correção deve ser aplicada antes de aprovação do relatório.**
