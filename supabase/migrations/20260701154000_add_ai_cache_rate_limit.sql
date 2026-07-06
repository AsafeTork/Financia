create table if not exists public.ai_cache (
  id bigserial primary key,
  scope text not null check (scope in ('cache', 'rate_limit')),
  cache_key text not null,
  request_hash text,
  user_id uuid references auth.users(id) on delete cascade,
  action text,
  response jsonb,
  status integer default 200,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_cache_lookup
  on public.ai_cache (scope, cache_key, request_hash, expires_at desc);

create index if not exists idx_ai_cache_rate
  on public.ai_cache (scope, cache_key, user_id, created_at desc);

create index if not exists idx_ai_cache_expires
  on public.ai_cache (expires_at);

create index if not exists idx_ai_cache_user_id
  on public.ai_cache (user_id);

alter table public.ai_cache enable row level security;
