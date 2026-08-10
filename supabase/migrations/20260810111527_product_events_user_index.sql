create index if not exists product_events_user_created_idx
  on public.product_events (user_id, created_at);
