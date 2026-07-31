-- Remove admin_clear_client_data GRANT to authenticated (C3)
-- CRITICAL: SECURITY DEFINER function exposed to authenticated with ZERO callers in codebase
-- Any admin can call RPC directly -> no rate limit, no audit trail, data deletion risk
-- Ref: Banco/ESPECIALISTA_BANCO.md section C3, SECURITY_AUDIT_REPORT.md section 2.8
-- Fix: REVOKE EXECUTE from authenticated. Create Edge Function consumer if needed.

-- Revoke from authenticated (service_role can still call via Edge Function if needed)
REVOKE EXECUTE ON FUNCTION public.admin_clear_client_data(uuid, text[]) FROM authenticated;

-- Also revoke from anon/public for completeness
REVOKE EXECUTE ON FUNCTION public.admin_clear_client_data(uuid, text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_clear_client_data(uuid, text[]) FROM public;

-- NOTE: If this function is needed, create an Edge Function wrapper:
-- supabase/functions/admin-clear-client-data/index.ts
-- - Requires admin JWT
-- - Rate limited (e.g., 2/hour)
-- - Calls admin_clear_client_data via service_role client
-- - Logs audit trail (who, when, which tables, confirmation token)
-- - Returns success/failure
-- 
-- Example Edge Function structure:
-- import { createClient } from '@supabase/supabase-js';
-- import { corsResponse, handleOptions } from '../_shared/responses.ts';
-- 
-- Deno.serve(async (req) => {
--   if (req.method === 'OPTIONS') return handleOptions();
--   const admin = createClient(url, serviceKey);
--   const { data: { user } } = await admin.auth.getUser(req.headers.get('Authorization')?.replace('Bearer ', ''));
--   if (!user || !await isAdmin(admin, user.id)) return corsResponse({ error: 'forbidden' }, 403);
--   const { target_uid, tables, confirmation_token } = await req.json();
--   const { error } = await admin.rpc('admin_clear_client_data', { target_uid, tables, confirmation_token });
--   if (error) return corsResponse({ error: error.message }, 500);
--   await admin.from('admin_audit_log').insert({ action: 'clear_client_data', admin_uid: user.id, target_uid, tables });
--   return corsResponse({ success: true });
-- });