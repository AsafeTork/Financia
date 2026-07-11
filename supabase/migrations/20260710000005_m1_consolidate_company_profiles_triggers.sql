-- M1: Consolidar 3 triggers BEFORE UPDATE em company_profiles
-- Ordem alfabética frágil: prevent_plan_change -> trg_guard_white_label -> trig_cp_updated
-- Consolidar em 1 trigger com lógica sequencial explícita

-- 1) Dropar triggers antigos
drop trigger if exists prevent_plan_change on public.company_profiles;
drop trigger if exists trg_guard_white_label on public.company_profiles;
drop trigger if exists trig_cp_updated on public.company_profiles;

-- 2) Função consolidada
create or replace function public.company_profiles_before_update()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
begin
  -- 1. Impedir mudança de plano não autorizada
  if new.plan is distinct from old.plan
     and coalesce(current_setting('app.allow_plan_change', true), '0') <> '1' then
    raise exception 'plan change not allowed';
  end if;

  -- 2. Guardar white_label: reverter se não for service_role
  if new.white_label is distinct from old.white_label
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    new.white_label := old.white_label;
  end if;

  -- 3. Atualizar updated_at
  new.updated_at := now();

  return new;
end;
$$;

-- 3) Trigger único
create trigger trg_company_profiles_bu
  before update on public.company_profiles
  for each row execute function public.company_profiles_before_update();