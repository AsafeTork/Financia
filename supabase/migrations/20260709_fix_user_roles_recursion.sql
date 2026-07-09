-- ===============================================================
-- Migration: Fix user_roles RLS infinite recursion
--
-- Problema: 3 policies em user_roles fazem subqueries auto-referenciadas
--   (SELECT 1 FROM user_roles WHERE ...) causando 42P17 infinite recursion
--
-- Solucao: private.is_admin() SECURITY DEFINER (executa como owner,
--   bypassa RLS) + policies usam (select private.is_admin()) com initPlan
--
-- Performance: benchmark Supabase mostra 99.994% de ganho com initPlan
-- ===============================================================

-- 1. Cria schema private (NAO exposto na API Supabase — seguro para
--    SECURITY DEFINER functions)
create schema if not exists private;

-- 2. Funcao de checagem de admin que bypassa RLS (SECURITY DEFINER)
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from user_roles
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- 3. Permite que authenticated execute a funcao atraves de RLS
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- 4. Re-cria as 3 policies problematicas usando private.is_admin()
--    Nota: (select private.is_admin()) com wrapping cria initPlan que
--    cacheia o resultado por statement — essencial para performance

drop policy if exists "admin_delete_user_roles" on user_roles;
create policy "admin_delete_user_roles" on user_roles
  for delete to authenticated
  using (
    (select auth.uid()) = user_id
    or (select private.is_admin())
  );

drop policy if exists "insert_own_role" on user_roles;
create policy "insert_own_role" on user_roles
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    or (select private.is_admin())
  );

drop policy if exists "update_role_admin_only" on user_roles;
create policy "update_role_admin_only" on user_roles
  for update to authenticated
  using ( (select private.is_admin()) )
  with check ( (select private.is_admin()) );
