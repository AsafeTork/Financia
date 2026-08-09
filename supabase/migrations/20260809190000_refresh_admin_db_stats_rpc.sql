-- Refresh the admin DB stats functions so PostgREST exposes a working RPC contract.
create or replace function private.admin_db_stats()
returns json
language plpgsql
security definer
set search_path = 'private', 'public', 'auth'
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  ) then
    raise exception 'forbidden';
  end if;

  return json_build_object(
    'db_size', pg_database_size(current_database()),
    'tables', (select count(*) from information_schema.tables where table_schema = 'public')
  );
end;
$$;

create or replace function public.admin_db_stats()
returns json
language plpgsql
security invoker
set search_path = 'public', 'auth'
as $$
begin
  return private.admin_db_stats();
end;
$$;

grant execute on function public.admin_db_stats() to authenticated;
revoke execute on function public.admin_db_stats() from anon;

notify pgrst, 'reload schema';
