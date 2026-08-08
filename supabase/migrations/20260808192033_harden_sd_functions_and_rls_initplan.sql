-- Migration: harden_sd_functions_and_rls_initplan
-- Applied to remote 2026-08-08 (Supabase Advisor 0029 findings, verified live)
-- 3 SECURITY DEFINER functions were executable by `authenticated` WITHOUT admin gate:
--   - change_user_password(uuid, text): any user could change ANY user's password (account takeover)
--   - create_user_with_role(text,text,text,text): any user could create admin users (privilege escalation)
--   - delete_user_with_role(uuid): any user could delete ANY user (destruction)
-- stripe_activate_plan had an internal admin gate but should only run via service_role (Edge Functions)
-- No Edge Function calls these via client SDK (admin-create-client uses auth.admin.createUser) -> safe to revoke

REVOKE EXECUTE ON FUNCTION public.change_user_password(uuid, text) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.create_user_with_role(text, text, text, text) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.delete_user_with_role(uuid) FROM authenticated, anon, public;
REVOKE EXECUTE ON FUNCTION public.stripe_activate_plan(uuid, text, timestamptz) FROM authenticated, anon, public;

GRANT EXECUTE ON FUNCTION public.change_user_password(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_user_with_role(text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_with_role(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.stripe_activate_plan(uuid, text, timestamptz) TO service_role;

-- RLS: consolidate duplicate UPDATE policies on company_profiles (Advisor multiple_permissive_policies)
-- update_own_branding_only used bare auth.uid() (D002: per-row re-evaluation, 19x slower)
-- update_own_profile is the generic own-row policy; plan/white_label columns are guarded
-- by trg_cp_consolidated trigger anyway.
DROP POLICY IF EXISTS update_own_branding_only ON public.company_profiles;
DROP POLICY IF EXISTS update_own_profile ON public.company_profiles;

CREATE POLICY update_own_profile ON public.company_profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);