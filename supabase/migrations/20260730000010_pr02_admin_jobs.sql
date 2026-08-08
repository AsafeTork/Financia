// Migration: Add admin_jobs table for tracking admin job executions

begin;

create table if not exists public.admin_jobs (
  id uuid primary key default gen_random_uuid(),
  job_type text not null,
  job_name text not null,
  params jsonb not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed', 'timeout')),
  result jsonb,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_jobs_status on public.admin_jobs(status);
create index if not exists idx_admin_jobs_type on public.admin_jobs(job_type);
create index if not exists idx_admin_jobs_created_at on public.admin_jobs(created_at desc);
create index if not exists idx_admin_jobs_created_by on public.admin_jobs(created_by);

alter table public.admin_jobs enable row level security;

create policy "admin_jobs_admin_all" on public.admin_jobs
  for all
  to authenticated
  using (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin')
  );

-- Function to record job start
create or replace function public.record_job_start(
  p_job_type text,
  p_job_name text,
  p_params jsonb default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  v_id uuid;
begin
  insert into admin_jobs (job_type, job_name, params, status, created_by)
  values (p_job_type, p_job_name, p_params, 'running', auth.uid())
  returning id into v_id;
  return v_id;
end;
$$;

-- Function to record job completion
create or replace function public.record_job_complete(
  p_job_id uuid,
  p_status text,
  p_result jsonb default null,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  update admin_jobs
  set status = p_status,
      result = p_result,
      error = p_error,
      completed_at = now(),
      duration_ms = extract(epoch from (now() - started_at)) * 1000
  where id = p_job_id;
end;
$$;

grant execute on function public.record_job_start(text, text, jsonb) to authenticated;
grant execute on function public.record_job_complete(uuid, text, jsonb, text) to authenticated;

commit;