-- Keep the admin RPCs callable by the authenticated admin client after the
-- security-definer consolidation. All lookups are explicitly public/qualified.
create or replace function public.set_client_plan(
  p_target uuid, p_plan text, p_actor text, p_expires_at timestamptz default null
) returns void
language plpgsql security definer set search_path = public, auth
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  ) then raise exception 'forbidden: admin required'; end if;
  if p_plan not in ('free', 'pro', 'premium', 'white_label') then
    raise exception 'invalid plan: %', p_plan;
  end if;
  perform set_config('app.allow_plan_change', '1', true);
  update public.company_profiles
  set plan = p_plan,
      plan_expires_at = case when p_plan = 'free' then null when p_expires_at is not null then p_expires_at else now() + interval '31 days' end,
      plan_activated_by = case when p_plan = 'free' then null else p_actor end
  where user_id = p_target;
  if not found then raise exception 'client not found'; end if;
end;
$$;

create or replace function public.admin_set_custom_price(p_target uuid, p_plan text, p_cents integer)
returns void
language plpgsql security definer set search_path = public, auth
as $$
begin
  if not exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin') then
    raise exception 'not authorized';
  end if;
  if p_plan not in ('pro', 'premium', 'white_label') then raise exception 'invalid plan: %', p_plan; end if;
  if p_cents is not null and (p_cents < 0 or p_cents > 100000000) then raise exception 'invalid price'; end if;
  update public.company_profiles
  set custom_prices = jsonb_set(coalesce(custom_prices, '{}'::jsonb), ARRAY[p_plan],
    case when p_cents is null or p_cents <= 0 then 'null'::jsonb else to_jsonb(p_cents) end)
  where user_id = p_target;
  if not found then raise exception 'client not found'; end if;
end;
$$;

grant execute on function public.set_client_plan(uuid, text, text, timestamptz) to authenticated;
grant execute on function public.admin_set_custom_price(uuid, text, integer) to authenticated;

create or replace function private.admin_delete_client(target_uid uuid)
returns void
language plpgsql security definer set search_path = private, public, auth
as $$
begin
  if not exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin') then
    raise exception 'forbidden';
  end if;
  delete from public.company_profiles where user_id = target_uid;
  delete from public.impersonation_sessions s where s.target_uid = private.admin_delete_client.target_uid;
  delete from public.transactions where user_id = target_uid;
  delete from public.products where user_id = target_uid;
  delete from public.losses where user_id = target_uid;
  delete from public.user_roles where user_id = target_uid;
  delete from public.stripe_webhook_dlq where user_id = target_uid;
  delete from auth.users where id = target_uid;
end;
$$;

grant execute on function public.admin_delete_client(uuid) to authenticated;
