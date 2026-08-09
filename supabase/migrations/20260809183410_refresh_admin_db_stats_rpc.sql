-- Refresh the public RPC wrapper so PostgREST exposes the current admin DB stats contract.
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
