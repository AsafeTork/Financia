-- Drop deprecated RPCs — the new impersonation system generates session tokens
-- directly via the Edge Function using supabase.auth.admin.generateLink + verifyOtp.
-- These old RPCs modified the target user's password (security risk) and are
-- no longer called by any code.

DROP FUNCTION IF EXISTS public.admin_impersonate_start(uuid);
DROP FUNCTION IF EXISTS public.admin_get_magic_link(uuid);
DROP FUNCTION IF EXISTS public.admin_impersonate_restore(uuid);
