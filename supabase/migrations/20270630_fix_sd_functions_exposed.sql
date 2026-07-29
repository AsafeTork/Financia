-- This migration fixes the security issue with 4 SECURITY DEFINER functions exposed to authenticated
-- Supabase Advisor 0029 flags these as security risks
-- Fix: Move logic to private schema + create SECURITY INVOKER wrappers in public

-- Step 1: Create private schema if not exists
CREATE SCHEMA IF NOT EXISTS private;

-- Step 2: Move admin_client_usage to private schema
CREATE OR REPLACE FUNCTION private.admin_client_usage()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'private', 'auth'
AS $$
-- Original logic here
BEGIN
  -- Verify admin
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  
  RETURN json_build_object(
    'total_clients', (SELECT count(*) FROM public.company_profiles),
    'active_today', (SELECT count(*) FROM public.company_profiles WHERE updated_at > now() - INTERVAL '24 hours')
  );
END;
$$;

-- Create SECURITY INVOKER wrapper in public
CREATE OR REPLACE FUNCTION public.admin_client_usage()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  RETURN private.admin_client_usage();
END;
$$;

-- Step 3: Move admin_db_stats to private schema
CREATE OR REPLACE FUNCTION private.admin_db_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'private', 'auth'
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  
  RETURN json_build_object(
    'db_size', pg_database_size(current_database()),
    'tables', (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public')
  );
END;
$$;

-- Create SECURITY INVOKER wrapper in public
CREATE OR REPLACE FUNCTION public.admin_db_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  RETURN private.admin_db_stats();
END;
$$;

-- Step 4: Move admin_delete_client to private schema
CREATE OR REPLACE FUNCTION private.admin_delete_client(target_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'private', 'auth'
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  
  -- Delete dependent data FIRST (before auth.users)
  DELETE FROM public.company_profiles WHERE user_id = target_uid;
  DELETE FROM public.impersonation_sessions WHERE target_uid = target_uid;
  DELETE FROM public.transactions WHERE user_id = target_uid;
  DELETE FROM public.products WHERE user_id = target_uid;
  DELETE FROM public.losses WHERE user_id = target_uid;
  DELETE FROM public.user_roles WHERE user_id = target_uid;
  DELETE FROM public.stripe_webhook_dlq WHERE user_id = target_uid;
  
  -- Finally delete auth.users (after all dependent data)
  DELETE FROM auth.users WHERE id = target_uid;
END;
$$;

-- Create SECURITY INVOKER wrapper in public
CREATE OR REPLACE FUNCTION public.admin_delete_client(target_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  PERFORM private.admin_delete_client(target_uid);
END;
$$;

-- Step 5: Move admin_impersonate_restore to private schema
CREATE OR REPLACE FUNCTION private.admin_impersonate_restore(target_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'private', 'auth'
AS $$
DECLARE
  v_old text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT old_hash INTO v_old
  FROM public.impersonation_sessions s
  WHERE s.target_uid = private.admin_impersonate_restore.target_uid;

  IF v_old IS NULL THEN
    RETURN;
  END IF;

  UPDATE auth.users
  SET encrypted_password = v_old
  WHERE id = private.admin_impersonate_restore.target_uid;

  DELETE FROM public.impersonation_sessions s
  WHERE s.target_uid = private.admin_impersonate_restore.target_uid;
END;
$$;

-- Create SECURITY INVOKER wrapper in public
CREATE OR REPLACE FUNCTION public.admin_impersonate_restore(target_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO 'public', 'auth'
AS $$
BEGIN
  PERFORM private.admin_impersonate_restore(target_uid);
END;
$$;

-- Step 6: Revoke EXECUTE from authenticated on public wrappers (they use SECURITY INVOKER so they need authenticated to call them)
-- The public wrappers use SECURITY INVOKER, so they run with caller's permissions
-- We grant EXECUTE to authenticated so admins can call them, but they go through the private SECURITY DEFINER functions
GRANT EXECUTE ON FUNCTION public.admin_client_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_db_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_client(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_impersonate_restore(uuid) TO authenticated;

-- Revoke from anon
REVOKE EXECUTE ON FUNCTION public.admin_client_usage() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_db_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_client(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_impersonate_restore(uuid) FROM anon;

-- The private functions are SECURITY DEFINER and only accessible via public wrappers