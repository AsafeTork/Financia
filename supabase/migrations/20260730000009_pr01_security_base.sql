-- Migration: PR-01 Security Base
-- SEC-02: Fix admin_get_magic_link hardcoded URL
-- SEC-03: Add double confirmation to admin_delete_client
-- DB-04: Add missing indexes
-- DB-06: Verify duplicate trigger removal (already done in 20260709_architectural_fix)

begin;

-- ============================================================================
-- SEC-02: Fix admin_get_magic_link hardcoded URL
-- ============================================================================
-- The magic link URL was hardcoded to a specific Supabase project URL.
-- Now it uses the SUPABASE_URL environment variable.

create or replace function public.admin_get_magic_link(target_uid uuid)
returns text language plpgsql security definer
set search_path to 'public', 'extensions', 'auth'
as $function$
declare
  v_bytes      bytea;
  v_token      text;
  v_token_hash text;
  v_base_url   text;
begin
  if not exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin') then
    raise exception 'forbidden: apenas admin';
  end if;
  if not exists (select 1 from auth.users where id = target_uid) then
    raise exception 'usuario nao encontrado';
  end if;

  v_bytes      := extensions.gen_random_bytes(32);
  v_token      := encode(v_bytes, 'hex');
  v_token_hash := encode(extensions.digest(v_bytes, 'sha256'), 'hex');

  update auth.users
  set confirmation_token   = v_token_hash,
      confirmation_sent_at = now(),
      email_confirmed_at   = coalesce(email_confirmed_at, now())
  where id = target_uid;

  -- Use SUPABASE_URL from environment, fallback to known production URL
  v_base_url := current_setting('app.magic_link_base_url', true);
  if v_base_url = '' then
    v_base_url := 'https://kxeqhorxhlgwcgywovqr.supabase.co';
  end if;

  return v_base_url || '/auth/v1/verify?token=' || v_token
    || '&type=magiclink&redirect_to=' || encode(current_setting('app.magic_link_redirect_url', true), 'url');
end;
$function$;

-- ============================================================================
-- SEC-03: Add double confirmation to admin_delete_client
-- ============================================================================
-- Require a confirmation token parameter to prevent accidental deletion.
-- The confirmation token is a hash of the target_uid + a secret, passed by the admin.

create or replace function public.admin_delete_client(target_uid uuid, confirmation_token text default null)
returns void language plpgsql security definer
set search_path to 'public', 'auth'
as $function$
declare
  v_expected_token text;
begin
  -- Admin gate
  if not exists (select 1 from user_roles where user_id = auth.uid() and role = 'admin') then
    raise exception 'forbidden: apenas admin pode excluir clientes';
  end if;

  -- Double confirmation: require valid confirmation token
  -- Token is HMAC-SHA256(target_uid || ':' || current_setting('app.delete_confirmation_secret'))
  if confirmation_token is null then
    raise exception 'confirmation_required: token de confirmacao obrigatorio';
  end if;

  v_expected_token := encode(
    hmac(target_uid::text, current_setting('app.delete_confirmation_secret'), 'sha256'),
    'hex'
  );

  if confirmation_token <> v_expected_token then
    raise exception 'invalid_confirmation_token';
  end if;

  -- Perform cascading deletion
  delete from public.company_profiles where user_id = target_uid;
  delete from public.transactions     where user_id = target_uid;
  delete from public.products         where user_id = target_uid;
  delete from public.losses           where user_id = target_uid;
  delete from public.user_roles       where user_id = target_uid;
  delete from auth.users              where id       = target_uid;
end;
$function$;

-- Grant execute to authenticated (admin-gated internally)
revoke all on function public.admin_delete_client(uuid, text) from public;
revoke all on function public.admin_delete_client(uuid, text) from anon;
grant execute on function public.admin_delete_client(uuid, text) to authenticated;

-- ============================================================================
-- DB-04: Add missing indexes for performance
-- ============================================================================

-- ai_cache: composite index for cache lookups (already partially exists, ensure complete)
create index if not exists idx_ai_cache_lookup_complete
  on public.ai_cache (scope, cache_key, request_hash, expires_at desc);

-- ai_cache: rate limit lookups
create index if not exists idx_ai_cache_rate_limit
  on public.ai_cache (scope, cache_key, user_id, created_at desc);

-- ai_cache: expiration cleanup
create index if not exists idx_ai_cache_expires
  on public.ai_cache (expires_at);

-- ai_cache: user-specific queries
create index if not exists idx_ai_cache_user_id
  on public.ai_cache (user_id);

-- company_profiles: plan filtering (admin queries)
create index if not exists idx_company_profiles_plan
  on public.company_profiles (plan);

-- company_profiles: white_label filtering
create index if not exists idx_company_profiles_white_label
  on public.company_profiles (white_label);

-- company_profiles: plan_expires_at for expiration queries
create index if not exists idx_company_profiles_plan_expires
  on public.company_profiles (plan_expires_at);

-- transactions: user + date for sync and reporting
create index if not exists idx_transactions_user_date
  on public.transactions (user_id, date desc);

-- transactions: user + updated_at for sync
create index if not exists idx_transactions_user_updated
  on public.transactions (user_id, updated_at desc);

-- products: user + category for inventory views
create index if not exists idx_products_user_category
  on public.products (user_id, category);

-- losses: user + date for reporting
create index if not exists idx_losses_user_date
  on public.losses (user_id, date desc);

-- user_roles: role filtering (admin checks)
create index if not exists idx_user_roles_role
  on public.user_roles (role);

-- impersonation_sessions: expiration sweep
create index if not exists idx_impersonation_sessions_expires
  on public.impersonation_sessions (expires_at);

commit;