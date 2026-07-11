---
type: REPORT
---

# DATABASE MASTER AUDIT

**Projeto:** Financia  
**Data:** 2026-07-10  
**PostgreSQL:** 17.6.1 (Supabase)  
**Projeto:** `kxeqhorxhlgwcgywovqr` (sa-east-1)  
**Escopo:** migrations, functions, policies, triggers, indexes, constraints, schema  
**Metodologia:** Análise de migrations locais (22) + consulta ao banco real (57 migrations aplicadas) + código-fonte (edge functions, shared) + Supabase MCP (SQL, Advisors, migrations) + 3 subagentes paralelos + 3 pesquisas web deep

---

## Sumário

| Severidade | Count |
|-----------|-------|
| 🔴 Crítico | 4 |
| 🟠 Alto | 7 |
| 🟡 Médio | 6 |
| 🔵 Informativo | 8 |

---

## 🔴 CRÍTICO

### 1. Divergência Migration Files vs. Banco Real

| Fonte | Quantidade |
|-------|-----------|
| Arquivos locais `supabase/migrations/` | 22 SQL |
| Migrations aplicadas no banco | 57 entries |
| Delta | 35 não rastreadas localmente |

**Consequência:** Impossível reproduzir o banco a partir dos arquivos locais. `supabase db push` geraria estado inconsistente. Algumas migrations locais podem nunca ter sido aplicadas (e.g., `brand_config` column ausente, `idx_company_profiles_plan` ausente).

**Referência:** Documentação Supabase recomenda `supabase migration new` + `supabase db push` como workflow padrão. O dump local deve refletir o banco real via `supabase db pull --schema public`.

**Ação:** `supabase db pull --schema public,private,storage` e substituir arquivos locais.

---

### 2. `admin_impersonate_start` — Migration vs. Banco Real (old_hash='')

| Operação | Migration File | Banco Real |
|----------|---------------|------------|
| Gera temp password | ✅ `gen_random_bytes(16)` + `crypt()` | ❌ Ignorado |
| Salva `old_hash` | ✅ Hash original do `auth.users.encrypted_password` | ❌ Salva `''` (string vazia) |
| `encrypted_password` | ✅ Atualiza para temp hash no `auth.users` | ❌ Não atualiza |
| Retorna | ✅ `{email, temp_pass, uid}` | ❌ `{email, uid}` |

**Consequência:**
- `impersonation_sweep()` executará `SET encrypted_password = ''` nos registros expirados — corrompe credenciais
- Não gera senha temporária → fluxo de impersonation quebrado
- `impersonation_sessions` poluída com `old_hash` inválido

**Ação:** Restaurar implementação da migration `20260624_impersonation_security.sql`. Manter search_path com `auth` e `extensions`.

---

### 3. `admin_get_magic_link` — Hardcoded Project URL + Redirect

```sql
'https://kxeqhorxhlgwcgywovqr.supabase.co/auth/v1/verify?token=' || v_token
  || '&type=magiclink&redirect_to=https://gestao-financeira-7heu.onrender.com'
```

**Problemas:**
- Project URL hardcoded (quebra se migrar de projeto)
- Redirect URL hardcoded (quebra se mudar de domínio)
- Sem distinção de ambiente (dev/staging/prod)

**Ação:** Extrair para variáveis de configuração ou `current_setting`.

---

### 4. 4 Funções SECURITY DEFINER Expostas a `authenticated` (Supabase Advisor)

Validação do Supabase Security Advisor confirma (lint 0029):

| Função | Risco |
|--------|-------|
| `admin_client_usage()` | SD exposta, gate interno mitiga |
| `admin_db_stats()` | SD exposta, gate interno mitiga |
| `admin_delete_client(uuid)` | SD exposta, deleta de `auth.users` |
| `admin_impersonate_restore(uuid)` | SD exposta, restaura senhas |

**Documentação Supabase:** Advisor `0029` recomenda revogar EXECUTE ou mover funções SD para schema não exposto (`private`).

**Ação:** Mover lógica de admin-gate para `private` schema e criar wrappers `SECURITY INVOKER` em `public`, ou aceitar o risco com documentação explícita.

---

## 🟠 ALTO

### 5. RLS Policies com Subquery Direta — Sem initPlan

Documentação oficial do Supabase confirma que wrapping com `SELECT` cria initPlan e melhora performance em **99.994%**.

| Tabela | Política | Padrão Atual |
|--------|----------|-------------|
| `company_profiles` | `select_own_or_admin`, `admin_delete_profiles` | `EXISTS (SELECT 1 FROM user_roles WHERE ...)` ❌ old |
| `transactions` | `own_transactions` | `auth.uid() = user_id OR EXISTS (SELECT 1 FROM user_roles ...)` ❌ old |
| `products` | `own_products` | idem ❌ old |
| `losses` | `own_losses` | idem ❌ old |
| `storage.objects` | `logos_*` (4 policies) | `auth.uid()::text OR EXISTS (SELECT 1 FROM user_roles ...)` ❌ old |
| `impersonation_sessions` | `impersonation_admin_*` | `EXISTS (SELECT 1 FROM user_roles WHERE ...)` ❌ old |
| `user_roles` | `admin_delete_user_roles`, etc | `(SELECT private.is_admin())` ✅ initPlan |
| `user_roles` | `read_own_role` | `auth.uid() = user_id` ❌ **esquecida na correção** |

**Ação:** Migrar todas para `(SELECT private.is_admin())` com initPlan. Incluir `read_own_role` que foi esquecida.

---

### 6. `brand_config` JSONB Column Ausente

**Migration:** `20260707000001_brand_config_jsonb.sql`  
**Live em `company_profiles`:** 21 colunas — `brand_config` **não existe**.

A migration adiciona `brand_config jsonb` e recria a policy `update_own_branding_only`. Como a architectural fix (`20260709_architectural_fix.sql`) substituiu a policy por `update_own_profile`, a migration pode nunca ter sido executada.

**Ação:** Verificar necessidade. Se necessária, aplicar `ALTER TABLE company_profiles ADD COLUMN brand_config jsonb;`.

---

### 7. `admin_impersonate_restore` — Sem `auth` no search_path

```sql
SET search_path TO 'public', 'pg_temp'
-- Corpo acessa auth.users via fully-qualified name (funciona mas frágil)
```

**Também afetado:** `admin_impersonate_start`, `admin_get_magic_link`, `admin_delete_client`, `admin_set_custom_price`, `handle_new_user`.

**Documentação PostgreSQL:** search_path restrito é boa prática de segurança. Fully-qualified names são seguros mas frágeis se esquema mudar.

**Ação:** Adicionar schemas necessários ao search_path de cada função (e.g., `auth`, `extensions`).

---

### 8. `admin_delete_profiles` — RLS Ainda Sem initPlan + `auth.uid()` Nu

```sql
CREATE POLICY "admin_delete_profiles" ON company_profiles FOR DELETE
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
```

**Dois problemas:**
1. `auth.uid()` sem wrapping → sem initPlan, executado por row
2. Subquery sem initPlan → executada por row

Também afeta `select_own_or_admin`.

---

### 9. 8 Funções Órfãs Sem Migration Local

Presentes no banco, sem arquivo de migration correspondente em `supabase/migrations/`:

| Função | Schema | Notas |
|--------|--------|-------|
| `set_claim(text, text)` | `auth` | Usada por Edge Functions JWT |
| `get_my_claims()` | `public` | Auxiliar JWT |
| `get_my_claim(text)` | `public` | Auxiliar JWT |
| `delete_user_subscription(auth.users)` | `public` | Trigger-based |
| `check_plan_unchanged(uuid, text, timestamptz)` | `public` | Dead code (ver #13) |
| `restore_stripe_plan()` | `public` | Possível dead code (ver #14) |
| `admin_clear_client_data(uuid)` | `public` | Sem Edge Function associada (ver #15) |
| `companies.*` (23+ funções) | `companies` | Schema privado não auditado |

**Risco:** Perda de rastreabilidade. Impossível versionar corretamente.

**Ação:** Extrair DDL de cada função do banco e criar migration files correspondentes.

---

### 10. `handle_new_user` — Sem search_path Fixo e Sem Gate Admin

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
-- SET search_path = ''  -- AUSENTE
AS $$
```

**Problemas:**
- `SECURITY DEFINER` sem search_path restrito → vulnerável a trojan horse via `public`
- Acessa `auth.users` implicitamente sem `auth` no path
- Executa em contexto de superusuário (trigger de `auth.users`)

**Ação:** Adicionar `SET search_path TO 'auth', 'public', 'pg_temp'`.

---

## 🟡 MÉDIO

### 11. Trigger Order Indeterminado em `company_profiles`

3 triggers BEFORE UPDATE:

| Trigger | Ordem | Função |
|---------|-------|--------|
| `prevent_plan_change` | dependente da criação | Bloqueia mudança direta de plan |
| `trg_guard_white_label` | dependente da criação | Reverte white_label se não for service_role |
| `trig_cp_updated` | dependente da criação | Seta updated_at = now() |

**Documentação PostgreSQL:** Múltiplos triggers BEFORE no mesmo evento executam em ordem alfabética por nome (PG 17 mantém). Mas depender de ordem alfabética é frágil.

**Ação:** Consolidar em um único trigger ou adicionar `COMMENT ON TRIGGER` documentando ordem esperada.

---

### 12. `check_plan_unchanged` — Dead Code Confirmado

```sql
CREATE OR REPLACE FUNCTION public.check_plan_unchanged(...)
-- Definida no banco, SEM referências em policies, triggers, RPC ou cron
```

- Não referenciada por nenhuma policy
- Não referenciada por nenhum trigger
- Não exposta como RPC (sem GRANT EXECUTE)
- Não chamada por cron

**Ação:** `DROP FUNCTION IF EXISTS public.check_plan_unchanged(uuid, text, timestamptz);`

---

### 13. `restore_stripe_plan` — Possível Dead Code

```sql
CREATE OR REPLACE FUNCTION public.restore_stripe_plan()
-- No banco, não referenciada por trigger, cron ou RPC
```

Difere de `stripe_restore_plan` (Edge Function). Função parece ser versão antiga ou nunca utilizada.

**Ação:** Verificar se há referência em código. Se não, dropar.

---

### 14. `admin_clear_client_data` — Sem Edge Function Associada

Função SD que deleta dados de cliente em múltiplas tabelas, mas não há Edge Function que a invoque. Nenhum código no frontend chama esse RPC.

**Risco:** Função disponível mas sem chamador → dead code ou funcionalidade incompleta.

**Ação:** Verificar se deve ser chamada por Edge Function `admin-clients` ou remover.

---

### 15. `prevent_plan_change` vs. `guard_white_label` — Estratégias Diferentes

- `prevent_plan_change`: `RAISE EXCEPTION` (aborta transação)
- `guard_white_label`: `new.white_label := old.white_label` (reverte silenciosamente)

O usuário não recebe feedback quando white_label é revertido. Pode causar confusão.

**Ação:** Unificar comportamento (ambos RAISE EXCEPTION ou ambos revert + NOTIFY).

---

### 16. `set_white_label` e `stripe_activate_plan` — Sem Admin Gate Consistente

Ambas funções SD que modificam `company_profiles`, mas o gate de admin verifica `auth.role()` diretamente em vez de usar `private.is_admin()`.

**Ação:** Migrar para `(SELECT private.is_admin())` consistente com as demais.

---

### 17. `ai_cache` — RLS Ativa mas sem Uso Real por `authenticated`

Todas as Edge Functions (`ai`, `admin-stripe-overview`, etc.) usam `getAdminClient()` (service_role), que **bypassa RLS**. As 4 policies `ai_cache_*_own` são avaliadas em toda operação sem necessidade.

**Ação:** Confirmar que nenhum código frontend acessa `ai_cache` diretamente. Se confirmado, dropar RLS.

---

### 18. Leaked Password Protection Desabilitado (Supabase Advisor)

O Supabase Security Advisor reporta `auth_leaked_password_protection` como `WARN`.

**Ação:** Habilitar em Supabase Dashboard > Authentication > Settings.

---

## 🔵 INFORMATIVO

### 19. `cleanup_ai_cache` — NÃO é Dead Code

Confirmado via cron job ativo:

| Job | Schedule | Command |
|-----|----------|---------|
| `impersonation-sweep` | `* * * * *` | `select public.impersonation_sweep()` |
| `ai-cache-cleanup` | `0 3 * * *` | `select public.cleanup_ai_cache()` |

Corrige o achado anterior — a função é chamada diariamente às 3h.

---

### 20. `idx_transactions_user_date` Torna `idx_transactions_user_id` Redundante

`idx_transactions_user_id` em `transactions(user_id)`  
`idx_transactions_user_date` em `transactions(user_id, date DESC)`

O composto cobre queries com filtro apenas por `user_id` (leftmost prefix). O simples é desnecessário.

**Ação:** Dropar `idx_transactions_user_id`.

---

### 21. `idx_company_profiles_plan` Ausente

Migração `20260609_add_plan_to_company_profiles.sql` define:
```sql
CREATE INDEX IF NOT EXISTS idx_company_profiles_plan ON company_profiles (plan);
```

Índice não existe no banco real. Admin queries por plano fazem full scan.

---

### 22. `idx_ai_cache_user_id` — Ausente no Banco

Migration define índice em `ai_cache(user_id)`. Não encontrado no banco real — a migration que o criou pode estar entre as 35 não aplicadas ou foi dropada posteriormente.

---

### 23. `idx_ai_cache_lookup` — Difere Entre Migration e Live

| Versão | Definição |
|--------|-----------|
| Migration | `(user_id, category, model, response_code) WHERE expires_at > now()` |
| Live | `(user_id, category, model, response_code)` — sem condicional |

Live sem `WHERE expires_at > now()` → menos eficiente para queries de cache válido.

---

### 24. `idx_ai_cache_rate` — Difere Entre Migration e Live

| Versão | Definição |
|--------|-----------|
| Migration | `(user_id, created_at)` |
| Live | `(created_at)` — sem `user_id` |

Live sem `user_id` → menos seletivo para rate limit por usuário.

---

### 25. `idx_impersonation_sessions_expires` — Sugestão de Novo Índice

`impersonation_sweep()` executa `WHERE expires_at < now()` e `WHERE old_hash = ''`. Sem índice em `expires_at`, faz full scan a cada minuto.

**Ação:** Criar `CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_expires ON impersonation_sessions (expires_at) WHERE old_hash = '';`

---

### 26. Múltiplas Colunas `custom_price_cents` — Crescimento não Escalável

4 colunas separadas para precificação customizada:
- `custom_price_cents`
- `custom_price_cents_pro`
- `custom_price_cents_premium`
- `custom_price_cents_white_label`

Cada novo plano requer nova coluna.

**Sugestão:** `custom_prices jsonb` com `{"pro": 4990, "white_label": 99700}`.

---

### 27. Schema `companies` — 23+ Funções Não Auditadas

Schema privado `companies` contém funções auxiliares não analisadas neste escopo. Potencialmente contém lógica de negócio duplicada ou dead code.

**Ação:** Incluir em auditoria futura.

---

## Resumo das Ações

| # | Prioridade | Ação |
|---|-----------|------|
| 1 | 🔴 | Sincronizar migrations locais com banco real |
| 2 | 🔴 | Restaurar `admin_impersonate_start` completo |
| 3 | 🔴 | Substituir URLs hardcoded em `admin_get_magic_link` |
| 4 | 🔴 | Mitigar 4 funções SD expostas (schema `private`) |
| 5 | 🟠 | Migrar todas as RLS policies para initPlan |
| 6 | 🟠 | Aplicar ou dropar `brand_config` column |
| 7 | 🟠 | Adicionar `auth`/`extensions` ao search_path (6+ funções) |
| 8 | 🟠 | Corrigir `auth.uid()` sem wrapping em policies |
| 9 | 🟠 | Criar migration files para 8+ funções órfãs |
| 10 | 🟠 | Corrigir `handle_new_user` — search_path + gate |
| 11 | 🟡 | Consolidar trigger order em `company_profiles` |
| 12 | 🟡 | Dropar `check_plan_unchanged` (dead code) |
| 13 | 🟡 | Verificar/dropar `restore_stripe_plan` (dead code) |
| 14 | 🟡 | Associar ou dropar `admin_clear_client_data` |
| 15 | 🟡 | Unificar abordagem de triggers (exception vs revert) |
| 16 | 🟡 | Migrar `set_white_label`/`stripe_activate_plan` para `private.is_admin()` |
| 17 | 🟡 | Remover RLS de `ai_cache` se não usada |
| 18 | 🟡 | Habilitar leaked password protection |
| 19 | 🔵 | Dropar `idx_transactions_user_id` |
| 20 | 🔵 | Criar `idx_company_profiles_plan` |
| 21 | 🔵 | Sincronizar índices `ai_cache` (corrigir lookup/rate) |
| 22 | 🔵 | Criar `idx_ai_cache_user_id` |
| 23 | 🔵 | Criar `idx_impersonation_sessions_expires` |
| 24 | 🔵 | Avaliar JSONB para custom_prices |
| 25 | 🔵 | Auditar schema `companies` |

---

## Metodologia de Validação

- **Revisão de código:** 22 migration files, 18 edge functions, 2 shared modules
- **MCP Supabase:** `list_tables`, `execute_sql` (17 queries), `list_migrations`, `list_extensions`, `get_advisors` (security)
- **Subagentes:** 3 paralelos (schema/constraints, functions/triggers, policies/indexes)
- **Pesquisas web:** 3 deep searches (PostgreSQL 17 initPlan, Supabase RLS anti-patterns, SECURITY DEFINER search_path hardening)
- **Documentação oficial consultada:**
  - Supabase RLS → initPlan pattern validado (99.994% improvement)
  - Supabase SECURITY DEFINER best practices
  - Supabase Storage Access Control
  - Supabase Security Advisor (0029, leaked password)
  - PostgreSQL 17 trigger ordering
- **Arquivos de contexto do projeto:** `docs/ARCHITECTURE.md`, `docs/AI_CONTEXT.md`
- **Ferramentas MCP utilizadas:** Supabase (list_tables, execute_sql, list_migrations, list_extensions, get_advisors, search_docs)
