-- This migration removes the dead code function check_plan_unchanged
-- Evidence: Grep 0 matches in .ts,.tsx,.sql - no cron jobs, triggers, policies, or Edge Functions invoke it

DROP FUNCTION IF EXISTS public.check_plan_unchanged(uuid, text, timestamptz);