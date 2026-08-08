-- This migration fixes the security issue with admin_clear_client_data
-- The function was exposed as SECURITY DEFINER to authenticated users without an Edge Function consumer
-- Options: 1) Create Edge Function consumer, 2) Revoke EXECUTE from authenticated

-- Option 2: Revoke EXECUTE from authenticated (simpler, more secure)
-- This prevents any authenticated user from calling this RPC directly
REVOKE EXECUTE ON FUNCTION public.admin_clear_client_data(uuid, text[]) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_clear_client_data(uuid, text[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_clear_client_data(uuid, text[]) FROM public;

-- Grant only to service_role (Edge Functions using service_role key can still call it)
GRANT EXECUTE ON FUNCTION public.admin_clear_client_data(uuid, text[]) TO service_role;

-- Alternatively, if you need authenticated users to call it via Edge Function proxy,
-- create an Edge Function that uses service_role and call that instead