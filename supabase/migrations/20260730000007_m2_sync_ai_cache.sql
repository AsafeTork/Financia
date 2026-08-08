-- M2: Sincronizar migration ai_cache com schema real (5 divergências)
-- Live tem divergências que fariam supabase db push falhar

-- 1) idx_ai_cache_lookup: live tem (scope, cache_key, request_hash) sem expires_at desc
drop index if exists public.idx_ai_cache_lookup;
create index idx_ai_cache_lookup
  on public.ai_cache (scope, cache_key, request_hash, expires_at desc);

-- 2) idx_ai_cache_rate: live tem (scope, cache_key, created_at desc) + renomeado
drop index if exists public.idx_ai_cache_rate;
create index idx_ai_cache_rate
  on public.ai_cache (scope, cache_key, created_at desc);

-- 3) idx_ai_cache_user_id: existe na migration, AUSENTE no live
drop index if exists public.idx_ai_cache_user_id;
create index idx_ai_cache_user_id
  on public.ai_cache (user_id);

-- 4) idx_ai_cache_created_at: AUSENTE na migration, EXISTE no live
drop index if exists public.idx_ai_cache_created_at;
create index idx_ai_cache_created_at
  on public.ai_cache (created_at);

-- 5) expires_at default: migration sem default, live tem DEFAULT (now() + '01:00:00'::interval)
alter table public.ai_cache
  alter column expires_at set default (now() + '01:00:00'::interval);

-- 6) scope CHECK: migration tem CHECK (scope IN ('cache','rate_limit')), live SEM constraint
alter table public.ai_cache
  add constraint ai_cache_scope_check
  check (scope in ('cache','rate_limit'));