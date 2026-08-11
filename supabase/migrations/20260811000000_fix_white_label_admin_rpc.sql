-- The admin Edge Function uses the service role client. The original function
-- revoked PUBLIC execution without granting service_role, so admin toggles
-- could fail with a permission error.
create or replace function public.set_white_label(p_user uuid, p_on boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.company_profiles
  set white_label = p_on, updated_at = now()
  where user_id = p_user;
  if not found then raise exception 'client not found'; end if;
end;
$$;

revoke execute on function public.set_white_label(uuid, boolean) from anon, authenticated, public;
grant execute on function public.set_white_label(uuid, boolean) to service_role;
notify pgrst, 'reload schema';
