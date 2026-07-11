# BANCO — Auditoria do Banco de Dados

---
type: WORKING
status: APPROVED
owner: Banco de Dados
version: 1.0
reviewed_by: Integrador
ready_for_integration: true
---

## 1. Diagnóstico

### 🔴 CRÍTICO

#### C1. `admin_impersonate_start` — old_hash = '' Corrompe Senhas

**Evidência:** Cópia da função do banco real (`pg_proc`):
```sql
insert into public.impersonation_sessions(target_uid, old_hash, started_by, started_at, expires_at)
values (target_uid, '', (select auth.uid()), now(), now() + interval '4 minutes')
```

**Problema:** `old_hash = ''` em vez de salvar o `encrypted_password` real do `auth.users`. A migration `20260624_impersonation_security.sql` define o comportamento correto (buscar hash + gerar temp password).

**Agravante:** `impersonation_sessions.old_hash` é `text NOT NULL` — `impersonation_sweep()` copia `''` para `encrypted_password`, bloqueando login permanentemente.

**Causa raiz:** Migration aplicada parcialmente — função sobrescrita por versão anterior.

**Arquivos afetados:**
- `supabase/migrations/20260624_impersonation_security.sql`
- Função `public.admin_impersonate_start(uuid)` no banco

---

#### C2. `admin_get_magic_link` — URLs Hardcoded

**Evidência:**
```sql
return 'https://kxeqhorxhlgwcgywovqr.supabase.co/auth/v1/verify?token=' || v_token
  || '&type=magiclink&redirect_to=https://gestao-financeira-7heu.onrender.com';
```

**Problemas:** Project URL e redirect hardcoded (impossível staging/prod separados).

**Arquivos afetados:** Função `public.admin_get_magic_link(uuid)` no banco

---

#### C3. `admin_clear_client_data` — SD Exposta sem Edge Function Consumidora

**Evidência:** Função SD `SECURITY DEFINER` exposta a `authenticated` via migration `20260705_harden_security.sql`. Grep no código-fonte encontra **zero chamadas**.

**Problema:** Qualquer admin pode chamar RPC diretamente sem Edge Function (sem rate limit, sem auditoria).

**Arquivos afetados:** `supabase/migrations/20260705_harden_security.sql`

---

#### C4. 4 Funções SD Expostas a `authenticated` (Supabase Advisor 0029)

**Evidência:** Supabase Security Advisor confirma WARN para:
- `admin_client_usage()` — SD, gate mitiga
- `admin_db_stats()` — SD, gate mitiga
- `admin_delete_client(uuid)` — SD, deleta de `auth.users`
- `admin_impersonate_restore(uuid)` — SD, restaura senhas

**Documentação Supabase 2026:** Mover lógica SD para schema `private` + wrappers `SECURITY INVOKER`.

---

### 🟠 ALTO

#### A1. `check_plan_unchanged` — Dead Code Confirmado

**Evidência:** Grep 0 matches em `.ts,.tsx,.sql`. Cron jobs, triggers, policies, Edge Functions — nenhum a invoca.

**Ação:** `DROP FUNCTION IF EXISTS public.check_plan_unchanged(uuid, text, timestamptz);`

---

#### A2. `restore_stripe_plan` — Possível Dead Code

**Evidência:** Grep encontra apenas comentário na migration `20260709_architectural_fix.sql`. Nenhuma Edge Function a invoca.

---

#### A3. `stripe_activate_plan` e `set_white_label` — search_path sem `pg_temp`

**Evidência:** Ambas usam `SET search_path = public` sem `pg_temp`. Embora só `service_role` as chame (REVOKE de `authenticated` confirmado nas migrations), o hardening de search_path está incompleto.

**Correção ao relatório anterior:** O relatório DATABASE_MASTER_AUDIT.md dizia que faltava admin gate. **Incorreto** — as migrations `20260624_stripe_activate_plan.sql` e `20260626000000_white_label_addon.sql` revogam EXECUTE de `authenticated` e concedem apenas a `service_role`.

---

#### A4. RLS `storage.objects` — Policies Usam `auth.uid()` Bare Sem initPlan

**Evidência** (`pg_policies`):
```sql
CREATE POLICY "logos_authenticated_select" ON storage.objects FOR SELECT
USING ((bucket_id = 'logos'::text) AND (
  ((storage.foldername(name))[1] = (auth.uid())::text)
  OR (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'))
));
```

`auth.uid()` **não está** envolvido em `(SELECT auth.uid())`. Benchmark PlanetScale 2026: sem initPlan → 1.96s, com initPlan → 102ms (**19x mais lento**).

**Afeta 4 policies:** `logos_authenticated_select`, `logos_authenticated_delete`, `logos_authenticated_update`, e implicitamente `logos_authenticated_write`.

---

#### A5. `impersonation_sweep` — Sem Índice em `expires_at` + old_hash='' Amplifica Dano

**Evidência:** `impersonation_sessions` tem apenas índice PK em `target_uid`. Sweep query `WHERE now() >= expires_at` faz full scan a cada minuto.

**Ações:** (1) Corrigir C1, (2) Criar `idx_impersonation_sessions_expires ON impersonation_sessions(expires_at) WHERE old_hash = ''`

---

#### A6. `handle_new_user` — Search Path Sem `pg_temp`

**Evidência:** `SET search_path TO 'public', 'pg_temp'` — tem `pg_temp` mas `auth` não listado. Trigger de `auth.users` com `SECURITY DEFINER`.

**Correção ao relatório anterior:** O DATABASE_MASTER_AUDIT.md dizia que search_path estava ausente. **Incorreto** — está presente.

---

### 🟡 MÉDIO

#### M1. Trigger Order em `company_profiles` — 3 Triggers BEFORE UPDATE

**Evidência** (`information_schema.triggers`):

| Ordem | Trigger | Função |
|-------|---------|--------|
| 1 | `prevent_plan_change` | Bloqueia mudança de plan |
| 2 | `trg_guard_white_label` | Reverte white_label |
| 3 | `trig_cp_updated` | Seta updated_at |

Ordem alfabética determina execução — frágil. Consolidar em 1 trigger.

---

#### M2. Migration `20260701154000_add_ai_cache_rate_limit.sql` vs. Live — 5 Divergências

| Item | Migration | Live |
|------|-----------|------|
| `idx_ai_cache_lookup` | `(scope, cache_key, request_hash, expires_at desc)` | `(scope, cache_key, request_hash)` |
| `idx_ai_cache_rate` | `(scope, cache_key, user_id, created_at desc)` | `(scope, cache_key, created_at desc)` + renomeado |
| `idx_ai_cache_user_id` | Existe | **Ausente** |
| `idx_ai_cache_created_at` | **Ausente** | Existe |
| `expires_at default` | Sem default | `DEFAULT (now() + '01:00:00'::interval)` |
| `scope CHECK` | `CHECK (scope IN ('cache','rate_limit'))` | **Sem constraint** |

Risco: `supabase db push` falharia.

---

#### M3. `ai_cache` com RLS Ativa mas sem Uso Real

Todas as Edge Functions usam `getAdminClient()` (service_role) → bypassa RLS. 4 policies `ai_cache_*_own` desnecessárias.

---

### 🔵 INFORMATIVO

#### I1. 35 Migrations Não Rastreadas Localmente

57 no banco vs. 22 arquivos. `supabase db pull` necessário.

#### I2. `brand_config jsonb` Column Ausente

21 colunas em `company_profiles`, `brand_config` não existe.

#### I3. `idx_company_profiles_plan` Ausente

Migration define, banco não tem. Admin queries por plano fazem full scan.

#### I4. `idx_transactions_user_id` Redundante

`idx_transactions_user_date(user_id, date DESC)` cobre as queries do índice simples. Pode ser dropado.

#### I5. 4 Colunas `custom_price_cents` — Crescimento Não Escalável

Sugestão: migrar para `custom_prices jsonb DEFAULT '{}'`.

---

### Resumo de Correções ao DATABASE_MASTER_AUDIT.md

| Item do Relatório Anterior | Estava | Correção |
|---|---|---|
| `stripe_activate_plan` sem admin gate | 🟡 Médio | 🔵 **REVOKE de authenticated** já protege |
| `set_white_label` sem admin gate | 🟡 Médio | 🔵 **REVOKE de authenticated** já protege |
| Policies sem initPlan | 🟠 Alto | 🔵 **Já usam `(SELECT auth.uid())`** wrapping |
| `handle_new_user` sem search_path | 🟠 Alto | 🔵 **search_path está presente** |
| Ação: migrar para `private.is_admin()` | 🟡 Sugerida | ❌ **Proteção por REVOKE é superior** |

---

## 2. Pesquisas Realizadas

| Fonte | Tipo | Link |
|-------|------|------|
| Supabase Docs — Migration Best Practices | Web Fetch | `https://supabase.com/docs/guides/deployment/database-migrations` |
| Supabase Docs — RLS Best Practices | Web Fetch | `https://supabase.com/docs/guides/database/postgres/row-level-security` |
| PlanetScale — RLS initPlan Benchmark 2026 | Web Search | `https://github.com/planetscale/rls-latency-benchmark` |
| AntStack — RLS Performance Supabase | Web Search | `https://www.antstack.com/blog/optimizing-rls-performance-with-supabase/` |
| MakerKit — Supabase RLS Best Practices 2026 | Web Search | `https://makerkit.dev/blog/tutorials/supabase-rls-best-practices` |
| Scott Pierce — Optimizing Postgres RLS | Web Search | `https://scottpierce.dev/posts/optimizing-postgres-rls` |
| VibeArmor — Supabase Security Best Practices 2026 | Web Search | `https://vibearmor.ai/blog/supabase-security-best-practices-2026` |
| Supabase Docs — Database Linter (0029) | Web Fetch | `https://supabase.com/docs/guides/database/database-linter` |
| PostgreSQL 18 Docs — pg_policies | Web Fetch | `https://www.postgresql.org/docs/current/view-pg-policies.html` |
| PostgreSQL — SECURITY DEFINER search_path | Web Search | Documentação oficial PostgreSQL |
| Git — Supabase Agent Skills (postgres-patterns) | Web Search | `https://github.com/supabase/agent-skills` |

---

## 3. Melhores Práticas

### RLS Performance (initPlan)
- **Benchmark PlanetScale 2026** (1M rows, 10 tenants): `auth.uid()` bare → 1.96s; `(SELECT auth.uid())` → 102ms (**19x improvement**)
- **Supabase Docs 2026**: wrapping em `SELECT` força initPlan para funções VOLATILE e STABLE
- **Scott Pierce (2025)**: functions em RLS policies deve ser STABLE + sem row data como parâmetro

### SECURITY DEFINER Hardening
- **Supabase Docs 2026**: mover lógica SD para schema `private` + wrappers `SECURITY INVOKER` em `public`
- **PostgreSQL Docs**: search_path deve sempre incluir schemas usados + `pg_temp` para evitar trojan horse
- **Supabase Advisor 0029**: função SD executável por `authenticated` → revogar EXECUTE ou mover

### Migration Workflow
- **Supabase Docs**: todas mudanças de schema via migration files. `supabase db diff` para capturar. `supabase db pull` para sync reverso.
- **DEV Community 2026**: lock_timeout em DDL, backfill em batches, zero-downtime em staged migrations

---

## 4. Arquivos Afetados

| Arquivo | Linhas | Problema | Severidade |
|---------|--------|----------|------------|
| `supabase/migrations/20260624_impersonation_security.sql` | função completa | Não executada no banco (versão corrompida) | 🔴 C1 |
| `public.admin_impersonate_start(uuid)` | n/a | old_hash = '' no banco real | 🔴 C1 |
| `public.admin_get_magic_link(uuid)` | n/a | URLs hardcoded | 🔴 C2 |
| `supabase/migrations/20260705_harden_security.sql` | linha 8 | GRANT EXECUTE sem Edge Function | 🔴 C3 |
| `public.admin_clear_client_data(uuid, text[])` | n/a | SD sem chamador | 🔴 C3 |
| `public.admin_client_usage()` | n/a | SD exposta (Advisor 0029) | 🔴 C4 |
| `public.admin_db_stats()` | n/a | SD exposta (Advisor 0029) | 🔴 C4 |
| `public.admin_delete_client(uuid)` | n/a | SD exposta + deleta auth.users | 🔴 C4 |
| `public.admin_impersonate_restore(uuid)` | n/a | SD exposta (Advisor 0029) | 🔴 C4 |
| `public.check_plan_unchanged(...)` | n/a | Dead code (0 referências) | 🟠 A1 |
| `public.restore_stripe_plan(uuid)` | n/a | Possível dead code | 🟠 A2 |
| `supabase/migrations/20260624_stripe_activate_plan.sql` | linha 4 | search_path sem pg_temp | 🟠 A3 |
| `supabase/migrations/20260626000000_white_label_addon.sql` | linha 15 | search_path sem pg_temp | 🟠 A3 |
| `storage.objects policies` (4) | n/a | auth.uid() bare sem initPlan | 🟠 A4 |
| `public.impersonation_sweep()` | n/a | Full scan em expires_at | 🟠 A5 |
| `public.handle_new_user()` | n/a | search_path sem auth | 🟠 A6 |
| `company_profiles triggers` (3) | n/a | Ordem frágil (alfabética) | 🟡 M1 |
| `supabase/migrations/20260701154000_add_ai_cache_rate_limit.sql` | 14-24 | 5 divergências com live | 🟡 M2 |
| `ai_cache RLS policies` (4) | n/a | Avaliadas sem necessidade | 🟡 M3 |
| `supabase/migrations/` (22 arquivos) | n/a | 35 não rastreadas localmente | 🔵 I1 |
| `supabase/migrations/20260707000001_brand_config_jsonb.sql` | n/a | Column ausente no banco | 🔵 I2 |
| `supabase/migrations/20260609_add_plan_to_company_profiles.sql` | n/a | Índice ausente no banco | 🔵 I3 |
| `idx_transactions_user_id` | n/a | Redundante (composto cobre) | 🔵 I4 |
| `public.company_profiles` (4 colunas) | n/a | 4 colunas custom_price_cents | 🔵 I5 |

---

## 5. Plano de Ação

| # | Prioridade | Ação | Arquivo |
|---|-----------|------|---------|
| C1 | 🔴 | Restaurar `admin_impersonate_start` — salvar encrypted_password real + temp password | `20260624_impersonation_security.sql` + banco |
| C2 | 🔴 | Extrair URLs para `current_setting` ou variáveis | `public.admin_get_magic_link(uuid)` |
| C3 | 🔴 | Criar Edge Function para `admin_clear_client_data` OU revogar EXECUTE | Nova EF + migration |
| C4 | 🔴 | Mover lógica SD para `private` schema + wrappers `SECURITY INVOKER` | Migration |
| A1 | 🟠 | `DROP FUNCTION check_plan_unchanged` | Migration |
| A2 | 🟠 | Decidir manter/dropar `restore_stripe_plan` | — |
| A3 | 🟠 | Adicionar `pg_temp` ao search_path de ambas funções | Migration |
| A4 | 🟠 | Envolver `auth.uid()` em `(SELECT ...)` nas 4 policies storage.objects | Migration |
| A5 | 🟠 | Criar `idx_impersonation_sessions_expires WHERE old_hash = ''` | Migration |
| A6 | 🟠 | Revisar search_path de `handle_new_user` | Migration |
| M1 | 🟡 | Consolidar 3 triggers BEFORE UPDATE em company_profiles | Migration |
| M2 | 🟡 | Sincronizar migration `ai_cache` com schema real | Migration |
| M3 | 🟡 | Dropar 4 RLS policies não utilizadas em `ai_cache` | Migration |
| I1 | 🔵 | `supabase db pull --schema public,private,storage` | CLI |
| I2 | 🔵 | Aplicar ou dropar migration `brand_config` | Migration |
| I3 | 🔵 | Criar `idx_company_profiles_plan` | Migration |
| I4 | 🔵 | Dropar `idx_transactions_user_id` | Migration |
| I5 | 🔵 | Avaliar JSONB para custom_prices | Migration |

---

## 6. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| C1: old_hash='' corrompe senhas | Alta (qualquer admin impersonar) | 🔴 Perda de acesso permanente | Corrigir C1 antes de qualquer impersonação |
| C3: SD sem Edge Function | Média (admin malicioso) | 🟠 Deleção de dados | Revogar EXECUTE temporariamente |
| I1: 35 migrations perdidas | Alta (disaster recovery) | 🔴 Banco irrecuperável | `supabase db pull` imediato |
| A4: storage 19x mais lento | Alta (muitas queries) | 🟠 Queda de performance | Wrap auth.uid() urgente |
| M2: ai_cache divergente | Alta (supabase db push) | 🟠 Falha em deploy | Sync migration urgente |

---

## 7. Auto-Revisão

| Pergunta | Resposta |
|----------|----------|
| Pesquisei profundamente (web, docs, RFC)? | Sim — 4 buscas deep + Supabase docs + PostgreSQL docs + benchmarks |
| Usei todas as ferramentas disponíveis? | Sim — Web Search (4x), Web Fetch (3x), Supabase MCP (5 execute_sql, advisors, migrations, extensions, list_tables), Grep (31 matches), Read (22 migrations + 18 EFs), Glob |
| Segui todas as regras do CLAUDE.md? | Sim — pesquisa antes de análise, não implementei, produzi apenas diagnóstico |
| Existe solução melhor ou mais simples? | Sim — algumas seções poderiam ser mais concisas, mas evidências completas são necessárias |
| Implementei algo sem autorização do Integrador? | Não — apenas diagnóstico |
| Existe overengineering no que produzi? | Não — cada achado tem evidência direta do banco ou código |
| Posso simplificar sem perder qualidade? | Parcialmente — a seção de correções poderia ser inline, mas a clareza justifica |
| Documentei corretamente (tipo, status, bloco)? | Sim — type: WORKING, status: REVIEW, bloco completo |

Todas as respostas "Sim" ou com justificativa aceitável. Pronto para REVIEW.

---

## Ferramentas Utilizadas

- **Supabase MCP:** `execute_sql` (5 queries: pg_policies, pg_proc, pg_indexes, pg_tables, information_schema.triggers/columns), `get_advisors` (security lint 0029), `list_migrations` (57 entries), `list_extensions`
- **Web Search:** 4 buscas deep (migrations, RLS initPlan benchmark, SECURITY DEFINER hardening, dead code)
- **Web Fetch:** Supabase RLS docs, PostgreSQL pg_policies docs, Supabase lint docs
- **Grep:** 31 matches em `*.ts,*.tsx,*.sql` — rastreio de chamadas de função
- **Read:** 22 migration files, 18 edge functions, WORKSPACE.md, PROMPT_UNIVERSAL.md, CLAUDE.md
- **Glob:** localização de todos os arquivos SQL/TS
