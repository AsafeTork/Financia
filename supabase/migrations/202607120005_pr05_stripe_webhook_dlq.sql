-- Migration: PR-05 Stripe Webhook Dead Letter Queue
-- EF-05: Add dead letter queue table for failed webhook events
-- Allows replay and debugging of failed Stripe events

begin;

-- ============================================================================
-- Dead Letter Queue table for Stripe webhook events
-- ============================================================================
create table if not exists public.stripe_webhook_dlq (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,           -- Stripe event ID (e.g., evt_123...)
  event_type text not null,                -- Stripe event type (e.g., invoice.payment_failed)
  payload jsonb not null,                  -- Full Stripe event payload
  error_message text,                      -- Error that caused the failure
  error_stack text,                        -- Stack trace if available
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  next_retry_at timestamptz,
  status text not null default 'pending'   -- pending, processing, resolved, dead
    check (status in ('pending', 'processing', 'resolved', 'dead')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for common queries
create index if not exists idx_stripe_webhook_dlq_status on public.stripe_webhook_dlq(status);
create index if not exists idx_stripe_webhook_dlq_event_type on public.stripe_webhook_dlq(event_type);
create index if not exists idx_stripe_webhook_dlq_next_retry on public.stripe_webhook_dlq(next_retry_at) where status = 'pending';
create index if not exists idx_stripe_webhook_dlq_created_at on public.stripe_webhook_dlq(created_at desc);

-- RLS: only admins can access
alter table public.stripe_webhook_dlq enable row level security;

create policy "stripe_webhook_dlq_admin_all" on public.stripe_webhook_dlq
  for all
  to authenticated
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- ============================================================================
-- Function: record_webhook_failure
-- Called from stripe-webhook Edge Function to store failed events
-- ============================================================================
create or replace function public.record_webhook_failure(
  p_event_id text,
  p_event_type text,
  p_payload jsonb,
  p_error_message text,
  p_error_stack text
)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  insert into public.stripe_webhook_dlq (
    event_id,
    event_type,
    payload,
    error_message,
    error_stack,
    attempt_count,
    last_attempt_at,
    next_retry_at
  ) values (
    p_event_id,
    p_event_type,
    p_payload,
    p_error_message,
    p_error_stack,
    1,
    now(),
    now() + interval '5 minutes'
  )
  on conflict (event_id) do update set
    attempt_count = stripe_webhook_dlq.attempt_count + 1,
    error_message = excluded.error_message,
    error_stack = excluded.error_stack,
    last_attempt_at = now(),
    next_retry_at = case
      when stripe_webhook_dlq.attempt_count >= 5 then null
      else now() + interval '5 minutes' * power(2, stripe_webhook_dlq.attempt_count)
    end,
    status = case
      when stripe_webhook_dlq.attempt_count >= 5 then 'dead'
      else 'pending'
    end,
    updated_at = now();
end;
$$;

-- ============================================================================
-- Function: retry_webhook_event
-- Admin function to retry a failed webhook event
-- ============================================================================
create or replace function public.retry_webhook_event(p_event_id text)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_record public.stripe_webhook_dlq%rowtype;
begin
  -- Fetch the record
  select * into v_record
  from public.stripe_webhook_dlq
  where event_id = p_event_id
    and status in ('pending', 'dead');

  if not found then
    raise exception 'event not found or not retryable';
  end if;

  -- Reset for retry
  update public.stripe_webhook_dlq
  set status = 'pending',
      next_retry_at = now(),
      updated_at = now()
  where event_id = p_event_id;

  -- The actual reprocessing is done by the Edge Function (which calls this to get payload)
  -- Edge Function will call mark_webhook_replayed after successful processing
end;
$$;

-- ============================================================================
-- Function: mark_webhook_replayed
-- Called after successful replay
-- ============================================================================
create or replace function public.mark_webhook_replayed(p_event_id text)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  update public.stripe_webhook_dlq
  set status = 'resolved',
      updated_at = now()
  where event_id = p_event_id;
end;
$$;

-- ============================================================================
-- Function: get_webhook_dlq_stats
-- Admin stats for monitoring
-- ============================================================================
create or replace function public.get_webhook_dlq_stats()
returns jsonb
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_stats jsonb;
begin
  select jsonb_build_object(
    'total', count(*),
    'pending', count(*) filter (where status = 'pending'),
    'processing', count(*) filter (where status = 'processing'),
    'resolved', count(*) filter (where status = 'resolved'),
    'dead', count(*) filter (where status = 'dead'),
    'by_type', (
      select jsonb_object_agg(event_type, cnt)
      from (
        select event_type, count(*) as cnt
        from public.stripe_webhook_dlq
        group by event_type
      ) t
    )
  ) into v_stats
  from public.stripe_webhook_dlq;

  return v_stats;
end;
$$;

grant execute on function public.record_webhook_failure(text, text, jsonb, text, text) to authenticated;
grant execute on function public.retry_webhook_event(text) to authenticated;
grant execute on function public.mark_webhook_replayed(text) to authenticated;
grant execute on function public.get_webhook_dlq_stats() to authenticated;

commit;