-- This migration fixes the security vulnerabilities in admin_impersonate_start:
-- 1. Verify user is admin before processing
-- 2. Store the actual password hash from auth.users (not empty string)
-- 3. Generate temporary password and store in auth.users
-- 4. Cache active sessions with original passwords for restoration

-- Remove old insecure version
DROP FUNCTION IF EXISTS public.admin_impersonate_start(uuid);

-- Create new secure version
CREATE OR REPLACE FUNCTION public.admin_impersonate_start(target_uid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $$
DECLARE
  v_email TEXT;
  v_old_hash TEXT;
  v_temp_pass TEXT;
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Get original email and password hash
  SELECT email, encrypted_password INTO v_email, v_old_hash
  FROM auth.users WHERE id = target_uid;
  
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'usuario nao encontrado';
  END IF;

  -- Generate temporary password (16 bytes)
  v_temp_pass := encode(extensions.gen_random_bytes(16), 'hex');

  -- Save original password hash in sessions table
  -- Store target_uid, old_hash, admin, and timestamp with expiration
  INSERT INTO public.impersonation_sessions (
    target_uid, old_hash, started_by, started_at, expires_at
  ) VALUES (
    target_uid, v_old_hash, auth.uid(), now(), 
    now() + INTERVAL '4 minutes'
  )
  ON CONFLICT (target_uid) DO UPDATE
    SET expires_at = EXCLUDED.expires_at,
        started_by = EXCLUDED.started_by;

  -- Update user password with temporary password
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(v_temp_pass, extensions.gen_salt('bf'))
  WHERE id = target_uid;

  -- Return success response
  RETURN json_build_object(
    'email', v_email,
    'temp_pass', v_temp_pass,
    'uid', target_uid
  );
END;
$$;