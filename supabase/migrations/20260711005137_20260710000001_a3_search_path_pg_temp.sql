-- A3: Adicionar pg_temp ao search_path de stripe_activate_plan e set_white_label
-- Correção de segurança: SECURITY DEFINER functions devem ter search_path explícito
-- com pg_temp no final para evitar injeção de search_path (tabelas temporárias maliciosas)
-- Ref: PostgreSQL docs - "SECURITY DEFINER" functions should set search_path

-- 1) stripe_activate_plan: search_path = 'public', 'pg_temp'
create or replace function public.stripe_activate_plan(p_user uuid, p_plan text, p_expires timestamptz)
returns void language plpgsql security definer set search_path to 'public', 'pg_temp' as $$
begin
  perform set_config('app.allow_plan_change','1', true);
  update public.company_profiles set plan = p_plan, plan_expires_at = p_expires, plan_activated_by = 'stripe' where user_id = p_user;
end; $$;

-- 2) set_white_label: search_path = 'public', 'pg_temp'
create or replace function public.set_white_label(p_user uuid, p_on boolean)
returns void
language plpgsql
security definer
set search_path = 'public', 'pg_temp'
as $$
begin
  update public.company_profiles
     set white_label = p_on,
         updated_at = now()
   where user_id = p_user;
end;
$$;