-- Historical migration retained because it was applied remotely before the
-- migration history was aligned. Keep this file idempotent for recovery runs.
create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in (
    'landing_view', 'landing_cta_click', 'signup_start', 'signup_complete',
    'onboarding_started', 'onboarding_complete', 'first_value', 'first_sale',
    'return', 'checkout_started', 'payment_success', 'subscription_active'
  )),
  anonymous_id text not null,
  session_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists product_events_name_created_idx
  on public.product_events (event_name, created_at);

alter table public.product_events enable row level security;

drop policy if exists product_events_insert on public.product_events;
create policy product_events_insert on public.product_events
  for insert to anon, authenticated
  with check (
    (user_id is null and (select auth.uid()) is null)
    or user_id = (select auth.uid())
  );

revoke all on public.product_events from anon, authenticated;
grant insert on public.product_events to anon, authenticated;
