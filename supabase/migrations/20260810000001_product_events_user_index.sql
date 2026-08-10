-- Historical migration retained because it was applied remotely before the
-- migration history was aligned.
create index if not exists product_events_user_created_idx
  on public.product_events (user_id, created_at);
