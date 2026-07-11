-- A6: Revisar search_path de handle_new_user (adicionar 'auth' schema)
-- Função trigger SECURITY DEFINER sem search_path explícito é vulnerável
-- Adiciona 'auth' ao path para permitir acesso explícito a auth.users sem depender de path do caller
-- E adiciona 'pg_temp' no final para segurança (evita hijacking via tabelas temporárias)

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'auth', 'public', 'pg_temp'
as $$
begin
  insert into public.company_profiles (user_id, plan, plan_expires_at, plan_activated_by)
  values (new.id, 'free', now() + interval '14 days', 'system')
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'owner')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

-- Revogar execução pública (trigger-only function)
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;