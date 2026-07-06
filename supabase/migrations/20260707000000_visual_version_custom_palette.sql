-- Migration: adiciona visual_version, custom_palette e endurece RLS de branding
-- Contexto: cache busting visual + controle de acesso a campos de white-label

-- 1) Novas colunas
alter table public.company_profiles
  add column if not exists visual_version integer not null default 0,
  add column if not exists custom_palette boolean not null default false;

-- 2) CHECK constraints para formato hex em cores
-- color: obrigatorio, sempre presente
alter table public.company_profiles
  drop constraint if exists company_profiles_color_check;
alter table public.company_profiles
  add constraint company_profiles_color_check
  check (color ~ '^#[0-9a-fA-F]{6}$');

-- color_secondary: opcional
alter table public.company_profiles
  drop constraint if exists company_profiles_color_secondary_check;
alter table public.company_profiles
  add constraint company_profiles_color_secondary_check
  check (color_secondary is null or color_secondary ~ '^#[0-9a-fA-F]{6}$');

-- color_accent: opcional
alter table public.company_profiles
  drop constraint if exists company_profiles_color_accent_check;
alter table public.company_profiles
  add constraint company_profiles_color_accent_check
  check (color_accent is null or color_accent ~ '^#[0-9a-fA-F]{6}$');

-- 3) Substitui a policy update_own_branding_only por versao endurecida
drop policy if exists update_own_branding_only on public.company_profiles;

create policy update_own_branding_only on public.company_profiles
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    -- protecao de plano: nunca permite alterar plan/expires/activated_by
    and plan = (select cp.plan from public.company_profiles cp where cp.user_id = auth.uid())
    and (plan_expires_at is not distinct from (select cp.plan_expires_at from public.company_profiles cp where cp.user_id = auth.uid()))
    and (plan_activated_by is not distinct from (select cp.plan_activated_by from public.company_profiles cp where cp.user_id = auth.uid()))
    -- protecao de branding: so altera cor/tema/logo_url se tiver white_label ou for admin
    and (
      (
        color is not distinct from (select cp.color from public.company_profiles cp where cp.user_id = auth.uid())
        and color_secondary is not distinct from (select cp.color_secondary from public.company_profiles cp where cp.user_id = auth.uid())
        and color_accent is not distinct from (select cp.color_accent from public.company_profiles cp where cp.user_id = auth.uid())
        and theme is not distinct from (select cp.theme from public.company_profiles cp where cp.user_id = auth.uid())
        and logo_url is not distinct from (select cp.logo_url from public.company_profiles cp where cp.user_id = auth.uid())
      )
      or (select cp.white_label from public.company_profiles cp where cp.user_id = auth.uid()) = true
      or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
    )
  );

-- 4) Comentario de seguranca na funcao RLS
comment on function public.guard_white_label() is 'trigger before update: reverte white_label para old.value quando role != service_role. Impede auto-concessao pelo cliente.';

-- 5) Comentarios na tabela e colunas
comment on table public.company_profiles is 'perfis de empresa por usuario; branding, plano e white-label';
comment on column public.company_profiles.visual_version is 'incrementado a cada alteracao visual para cache busting';
comment on column public.company_profiles.custom_palette is 'true quando usuario configurou paleta manualmente';
comment on column public.company_profiles.color is 'cor primaria da marca em formato hex (#RRGGBB)';
comment on column public.company_profiles.color_secondary is 'cor secundaria da marca em formato hex (#RRGGBB), pode ser null';
comment on column public.company_profiles.color_accent is 'cor de destaque da marca em formato hex (#RRGGBB), pode ser null';
