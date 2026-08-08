-- Migration: adiciona brand_config (JSONB) para armazenar configuracoes completas do Brand Studio
-- Contexto: schema publico de branding para IAs externas

-- 1) Nova coluna JSONB para configuracao completa de branding
alter table public.company_profiles
  add column if not exists brand_config jsonb;

-- 2) Comentario na coluna
comment on column public.company_profiles.brand_config is 'configuracao visual completa do Brand Studio (JSON conforme schema publico AI_BRAND_SCHEMA.json)';

-- 3) Garante que a RLS existente permite escrita em brand_config
-- A policy update_own_branding_only ja permite alteracao de colunas de branding
-- se white_label = true ou admin. Precisamos garantir que brand_config esta coberta.
-- Como brand_config e uma coluna de branding, ela cai sob a clausula:
--   color is not distinct from ...
--   and color_secondary is not distinct from ...
--   and ...
-- que permite alteracao APENAS se as cores nao mudarem (a menos que white_label/admin).
-- Isso e desejado: sem white_label, brand_config nao pode ser alterado via frontend.

-- Nota: a policy atual protege color/color_secondary/color_accent/theme/logo_url.
-- brand_config nao esta explicitamente na protecao, o que significa que clientes
-- sem white_label poderiam teoricamente alterar brand_config via UPDATE direto
-- (contornando as colunas protegidas). Para evitar isso, adicionamos brand_config
-- a clausula de protecao da policy.

drop policy if exists update_own_branding_only on public.company_profiles;

create policy update_own_branding_only on public.company_profiles
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and plan = (select cp.plan from public.company_profiles cp where cp.user_id = auth.uid())
    and (plan_expires_at is not distinct from (select cp.plan_expires_at from public.company_profiles cp where cp.user_id = auth.uid()))
    and (plan_activated_by is not distinct from (select cp.plan_activated_by from public.company_profiles cp where cp.user_id = auth.uid()))
    and (
      (
        color is not distinct from (select cp.color from public.company_profiles cp where cp.user_id = auth.uid())
        and color_secondary is not distinct from (select cp.color_secondary from public.company_profiles cp where cp.user_id = auth.uid())
        and color_accent is not distinct from (select cp.color_accent from public.company_profiles cp where cp.user_id = auth.uid())
        and theme is not distinct from (select cp.theme from public.company_profiles cp where cp.user_id = auth.uid())
        and logo_url is not distinct from (select cp.logo_url from public.company_profiles cp where cp.user_id = auth.uid())
        and brand_config is not distinct from (select cp.brand_config from public.company_profiles cp where cp.user_id = auth.uid())
      )
      or (select cp.white_label from public.company_profiles cp where cp.user_id = auth.uid()) = true
      or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = 'admin')
    )
  );
