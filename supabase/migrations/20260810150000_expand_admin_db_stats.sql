-- Return actionable table-level storage data to the admin panel.
create or replace function private.admin_db_stats()
returns json
language plpgsql security definer set search_path = private, public, auth
as $$
begin
  if not exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  ) then raise exception 'forbidden'; end if;

  return json_build_object(
    'db_size', pg_database_size(current_database()),
    'tables', coalesce((
      select json_agg(json_build_object(
        'name', t.table_name,
        'bytes', pg_total_relation_size(format('%I.%I', 'public', t.table_name)::regclass)
      ) order by pg_total_relation_size(format('%I.%I', 'public', t.table_name)::regclass) desc)
      from information_schema.tables t
      where t.table_schema = 'public' and t.table_type = 'BASE TABLE'
    ), '[]'::json)
  );
end;
$$;

grant execute on function public.admin_db_stats() to authenticated;
notify pgrst, 'reload schema';
