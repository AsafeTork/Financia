-- ============================================================================
-- Migration: 20260709_architectural_fix
--
-- Correção arquitetural completa:
--   1. RLS company_profiles: remove business logic das policies
--   2. SECURITY DEFINER grants: restaura EXECUTE apenas onde necessario
--   3. Trigger duplicado: remove trig_cp_updated_at
--
-- Contexto:
--   As policies de company_profiles continham subqueries auto-referenciadas
--   que causavam infinite recursion no PostgreSQL 17 (HTTP 500).
--   Alem disso, as migracoes de hardening de search_path recriaram funcoes
--   SECURITY DEFINER sem reaplicar os GRANTs, causando HTTP 403 nas RPCs.
--
-- Principio:
--   RLS serve apenas para AUTORIZACAO (quem pode ler/escrever).
--   Regras de negocio ficam em triggers, CHECK constraints, funcoes proprias.
-- ============================================================================

begin;

-- ============================================================================
-- PARTE 1: RLS company_profiles
-- ============================================================================
-- Antes: update_own_profile tinha WITH CHECK com 7+ subqueries lendo a
-- propria company_profiles para validar plan/cores/white_label.
-- Isso causava infinite recursion no PG17.
--
-- Depois: RLS so autoriza usuario a alterar propria linha.
-- As regras de negocio JA sao garantidas por:
--   - trigger prevent_plan_change()     -- impede alteracao direta de plan
--   - trigger guard_white_label()        -- impede alteracao de white_label
--   - CHECK constraint em plan           -- valores permitidos: free, pro, premium
--   - CHECK constraint em color          -- formato hex valido (#RRGGBB)
--   - CHECK constraint em color_secondary / color_accent -- formato hex ou null
-- ============================================================================

drop policy if exists "update_own_profile" on company_profiles;

create policy "update_own_profile" on company_profiles
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- As demais policies permanecem inalteradas:
--   select_own_or_admin  → SELECT para dono ou admin   ✅
--   insert_own_profile   → INSERT so para propria linha ✅
--   admin_delete_profiles → DELETE para dono ou admin  ✅

-- ============================================================================
-- PARTE 2: SECURITY DEFINER grants
-- ============================================================================
-- Analise de cada funcao SECURITY DEFINER:
--
-- Chamadas do frontend via sb.rpc() — precisam GRANT EXECUTE TO authenticated:
--   admin_client_usage()          sync.js:111    admin-gate interno ✓
--   admin_db_stats()              sync.js:121    admin-gate interno ✓
--   admin_delete_client(uuid)     sync.js:167    admin-gate interno ✓
--   admin_impersonate_restore(uuid) useImpersonation.js:42 admin-gate interno ✓
--
-- Chamadas via Edge Functions (service_role) — NÃO precisam authenticated:
--   admin_set_custom_price(uuid, integer)   via admin-set-custom-price
--   set_client_plan(uuid, text, text)        via stripe-webhook / Edge Functions
--   set_white_label(uuid, boolean)           via admin-set-white-label
--   stripe_activate_plan(uuid, text, timestamptz) via stripe-webhook
--   restore_stripe_plan(uuid)                via Edge Function
--   admin_get_magic_link(uuid)               via admin-impersonate EF
--   admin_impersonate_start(uuid)            via admin-impersonate EF
--   admin_clear_client_data(uuid, text[])    via admin-delete-client EF
--
-- Uso interno (trigger/cron/supabase) — NÃO precisam authenticated:
--   check_plan_unchanged(uuid, text, timestamptz)  consulta interna
--   cleanup_ai_cache()                             cron job
--   impersonation_sweep()                          cron job
-- ============================================================================

-- admin_client_usage — leitura de estatisticas agregadas por cliente
grant execute on function public.admin_client_usage() to authenticated;

-- admin_db_stats — estatisticas do banco (tamanho, tabelas)
grant execute on function public.admin_db_stats() to authenticated;

-- admin_delete_client — exclusão completa de cliente
grant execute on function public.admin_delete_client(uuid) to authenticated;

-- admin_impersonate_restore — restauracao de sessao apos impersonate
grant execute on function public.admin_impersonate_restore(uuid) to authenticated;

-- ============================================================================
-- PARTE 3: Remover trigger duplicado
-- ============================================================================
-- trig_cp_updated_at e trig_cp_updated sao IDENTICOS.
-- Ambos chamam trg_set_updated_at() em BEFORE UPDATE.
-- A funcao e idempotente, mas a duplicacao e：
--   - redundante (2 execucoes da mesma funcao)
--   - ruido em debug/logs
--   - risco de efeitos colaterais se a funcao mudar
-- ============================================================================

drop trigger if exists trig_cp_updated_at on company_profiles;

-- Nota: trig_cp_updated permanece — e o trigger original e suficiente.
-- A funcao trg_set_updated_at() e unica e compartilhada por outras tabelas.

commit;
