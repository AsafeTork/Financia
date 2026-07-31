-- Drop dead ai_cache RLS policies
-- All Edge Functions use getAdminClient() (service_role) which bypasses RLS entirely
-- These 4 policies serve no purpose and add overhead + audit confusion
-- Ref: SECURITY_AUDIT_REPORT.md section 2.2, Banco/ESPECIALISTA_BANCO.md section M3

-- Drop the 4 dead policies
DROP POLICY IF EXISTS "ai_cache_select_own" ON public.ai_cache;
DROP POLICY IF EXISTS "ai_cache_insert_own" ON public.ai_cache;
DROP POLICY IF EXISTS "ai_cache_update_own" ON public.ai_cache;
DROP POLICY IF EXISTS "ai_cache_delete_own" ON public.ai_cache;

-- Optionally disable RLS on ai_cache since service_role bypasses it anyway
-- and no client-facing access exists. Keep RLS enabled for defense-in-depth
-- but with zero policies it effectively blocks all non-service_role access.
-- ALTER TABLE public.ai_cache DISABLE ROW LEVEL SECURITY;