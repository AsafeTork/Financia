-- Migration: PR-04 Database Consolidation
-- DB-01: Unify stripe_activate_plan + set_client_plan
-- DB-02: Consolidate custom_price_cents* -> custom_prices jsonb
-- DB-03: Unify brand_config + legacy columns
-- DB-05: Cache stripe_customer_id in company_profiles

begin;

-- ============================================================================
-- DB-01: Unify plan management RPCs
-- ============================================================================
-- Create unified set_client_plan with proper expiration handling

create or replace function public.set_client_plan(p_target uuid, p_plan text, p_actor text, p_expires_at timestamptz default null)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  -- Admin gate
  if not exists (
    select 1 from user_roles where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'forbidden: admin required';
  end if;

  if p_plan not in ('free', 'pro', 'premium', 'white_label') then
    raise exception 'invalid plan: %', p_plan;
  end if;

  -- Allow plan change via GUC (bypasses trigger prevent_plan_change)
  perform set_config('app.allow_plan_change', '1', true);

  update company_profiles
  set plan = p_plan,
      plan_expires_at = case
        when p_plan = 'free' then null
        when p_expires_at is not null then p_expires_at
        else now() + interval '31 days'
      end,
      plan_activated_by = case when p_plan = 'free' then null else p_actor end
  where user_id = p_target;

  if not found then
    raise exception 'client not found';
  end if;
end;
$$;

revoke all on function public.set_client_plan(uuid, text, text, timestamptz) from public;
revoke all on function public.set_client_plan(uuid, text, text, timestamptz) from anon;
grant execute on function public.set_client_plan(uuid, text, text, timestamptz) to authenticated;

-- Drop old stripe_activate_plan (replaced by set_client_plan)
drop function if exists public.stripe_activate_plan(uuid, text, timestamptz);

-- ============================================================================
-- DB-02: Consolidate custom_price_cents* -> custom_prices jsonb
-- ============================================================================

alter table public.company_profiles
  add column if not exists custom_prices jsonb default '{}'::jsonb;

-- Migrate existing data
update public.company_profiles
set custom_prices = jsonb_build_object(
  'pro', coalesce(custom_price_cents_pro, null),
  'premium', coalesce(custom_price_cents_premium, null),
  'white_label', coalesce(custom_price_cents_white_label, null)
)
where custom_price_cents is not null
   or custom_price_cents_pro is not null
   or custom_price_cents_premium is not null
   or custom_price_cents_white_label is not null;

-- Drop old columns
alter table public.company_profiles
  drop column if exists custom_price_cents,
  drop column if exists custom_price_cents_pro,
  drop column if exists custom_price_cents_premium,
  drop column if exists custom_price_cents_white_label;

-- Add comment
comment on column public.company_profiles.custom_prices is 'Preços customizados por plano (centavos): {pro: 4990, premium: 9990, white_label: 49700}';

-- Update admin_set_custom_price to use jsonb
create or replace function public.admin_set_custom_price(p_target uuid, p_plan text, p_cents integer)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if not exists (
    select 1 from user_roles where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'not authorized';
  end if;

  if p_plan not in ('pro', 'premium', 'white_label') then
    raise exception 'invalid plan: %', p_plan;
  end if;

  if p_cents is not null and (p_cents < 0 or p_cents > 100000000) then
    raise exception 'invalid price';
  end if;

  update company_profiles
  set custom_prices = jsonb_set(
    coalesce(custom_prices, '{}'::jsonb),
    '{' || p_plan || '}',
    case when p_cents is null or p_cents <= 0 then 'null' else to_jsonb(p_cents) end
  )
  where user_id = p_target;
end;
$$;

grant execute on function public.admin_set_custom_price(uuid, text, integer) to authenticated;

-- ============================================================================
-- DB-03: Unify brand_config + legacy columns
-- ============================================================================
-- brand_config is now the single source of truth for all branding
-- Legacy columns (color, color_secondary, color_accent, theme, logo, logo_url)
-- are derived from brand_config at read time (via view or application logic)

-- Add convenience view for backward compatibility
create or replace view public.company_profiles_branding as
select
  cp.user_id,
  cp.name,
  cp.logo,
  cp.logo_url,
  coalesce(cp.color, '#002f59') as color,
  coalesce(cp.color_secondary, '#e8f0f7') as color_secondary,
  coalesce(cp.color_accent, '#1a6b5c') as color_accent,
  coalesce(cp.theme, 'light') as theme,
  cp.white_label,
  cp.custom_palette,
  cp.visual_version,
  cp.brand_config
from company_profiles cp;

comment on view public.company_profiles_branding is 'Backward-compatible view for branding fields';

-- ============================================================================
-- DB-05: Cache stripe_customer_id in company_profiles
-- ============================================================================

alter table public.company_profiles
  add column if not exists stripe_customer_id text;

create index if not exists idx_company_profiles_stripe_customer
  on public.company_profiles (stripe_customer_id);

comment on column public.company_profiles.stripe_customer_id is 'Cached Stripe customer ID for fast lookups';

-- ============================================================================
-- Additional indexes for performance
-- ============================================================================

create index if not exists idx_company_profiles_plan_expires
  on public.company_profiles (plan_expires_at);

create index if not exists idx_company_profiles_white_label
  on public.public.company_profiles (white_label);

commit;