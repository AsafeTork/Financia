-- I5: Migrar 4 colunas custom_price_cents para custom_prices jsonb
-- Crescimento não escalável: custom_price_cents, custom_price_cents_2, etc.

-- 1) Adicionar coluna jsonb
alter table public.company_profiles
  add column if not exists custom_prices jsonb not null default '{}';

-- 2) Migrar dados existentes (executar uma vez)
-- update public.company_profiles
-- set custom_prices = jsonb_build_object(
--   'price_1', coalesce(custom_price_cents, 0),
--   'price_2', coalesce(custom_price_cents_2, 0),
--   'price_3', coalesce(custom_price_cents_3, 0),
--   'price_4', coalesce(custom_price_cents_4, 0)
-- )
-- where custom_price_cents is not null
--    or custom_price_cents_2 is not null
--    or custom_price_cents_3 is not null
--    or custom_price_cents_4 is not null;

-- 3) Dropar colunas antigas (após validação da migração)
-- alter table public.company_profiles
--   drop column if exists custom_price_cents,
--   drop column if exists custom_price_cents_2,
--   drop column if exists custom_price_cents_3,
--   drop column if exists custom_price_cents_4;

-- Índice GIN para queries por preços customizados
create index if not exists idx_company_profiles_custom_prices
  on public.company_profiles using gin (custom_prices);