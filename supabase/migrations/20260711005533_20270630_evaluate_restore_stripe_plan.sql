-- This migration evaluates restore_stripe_plan - possible dead code
-- Evidence: Grep finds only comment in migration 20260709_architectural_fix.sql
-- No Edge Functions invoke it
-- Decision: Keep but document, or drop if confirmed unused

-- Option 1: Drop if confirmed dead code
-- DROP FUNCTION IF EXISTS public.restore_stripe_plan(uuid);

-- Option 2: Keep but add documentation
COMMENT ON FUNCTION public.restore_stripe_plan(uuid) IS 'POSSIBLE DEAD CODE - No Edge Functions invoke this. Review before use. Last checked: 2027-06-30';