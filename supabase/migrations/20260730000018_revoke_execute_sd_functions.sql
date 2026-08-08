-- Revoke EXECUTE from authenticated on 4 SECURITY DEFINER functions (Supabase Advisor 0029)
-- These functions should only be callable by service_role (via Edge Functions), not by authenticated users
-- Ref: Banco/ESPECIALISTA_BANCO.md section C4, SECURITY_AUDIT_REPORT.md section 2.5
-- Admin gates inside functions are NOT sufficient - SECURITY DEFINER executes with function owner perms

-- 1. admin_client_usage() - reads aggregated client stats
REVOKE EXECUTE ON FUNCTION public.admin_client_usage() FROM authenticated;

-- 2. admin_db_stats() - reads database size and table stats
REVOKE EXECUTE ON FUNCTION public.admin_db_stats() FROM authenticated;

-- 3. admin_delete_client(uuid) - DELETES FROM auth.users (CRITICAL: account takeover risk)
REVOKE EXECUTE ON FUNCTION public.admin_delete_client(uuid) FROM authenticated;
-- Also revoke the 2-arg version if it exists
REVOKE EXECUTE ON FUNCTION public.admin_delete_client(uuid, text) FROM authenticated;

-- 4. admin_impersonate_restore(uuid) - restores user passwords (CRITICAL: privilege escalation)
REVOKE EXECUTE ON FUNCTION public.admin_impersonate_restore(uuid) FROM authenticated;

-- Note: These functions should now only be callable by service_role (via Edge Functions)
-- If any Edge Function needs to call them, it will use service_role key which bypasses EXECUTE checks