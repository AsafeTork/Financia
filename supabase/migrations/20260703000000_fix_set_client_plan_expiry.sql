-- Corrige set_client_plan para usar 31 dias (mesmo padrao do Stripe webhook)
-- em vez de 1 ano. Também ajusta stripe_activate_plan para usar current_period_end.

create or replace function public.set_client_plan(a_target uuid, b_plan text, c_actor text)
  returns void
  language plpgsql
  security definer
  set search_path to 'public'
as $function$
begin
  if not exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'permission denied';
  end if;

  if b_plan not in ('free', 'pro', 'premium') then
    raise exception 'invalid plan: %', b_plan;
  end if;

  perform set_config('app.allow_plan_change', '1', true);

  update company_profiles
  set
    plan              = b_plan,
    plan_expires_at   = case when b_plan = 'free' then null else now() + interval '31 days' end,
    plan_activated_by = case when b_plan = 'free' then null else c_actor end
  where user_id = a_target;
end;
$function$;