-- Fix admin_impersonate_start: save real encrypted_password (not empty string)
-- CRITICAL: Current production version has old_hash = '' which corrupts user passwords
-- when impersonation_sweep() runs (copies '' to encrypted_password -> permanent lockout)
-- Ref: Banco/ESPECIALISTA_BANCO.md section C1, SECURITY_AUDIT_REPORT.md section 2.6

CREATE OR REPLACE FUNCTION public.admin_impersonate_start(target_uid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_email     text;
  v_temp_pass text;
  v_old_hash  text;
BEGIN
  -- Admin gate: only admins can start impersonation
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden: apenas admin pode iniciar impersonacao';
  END IF;

  -- Get target user's email AND real encrypted_password
  SELECT email, encrypted_password INTO v_email, v_old_hash
  FROM auth.users WHERE id = target_uid;
  
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'usuario nao encontrado';
  END IF;

  -- Generate temporary password
  v_temp_pass := encode(extensions.gen_random_bytes(16), 'hex');

  -- Save REAL encrypted_password (not empty string!) to impersonation_sessions
  -- ON CONFLICT preserves original old_hash if session already active
  INSERT INTO public.impersonation_sessions(target_uid, old_hash, started_by, started_at, expires_at)
  VALUES (target_uid, v_old_hash, auth.uid(), now(), now() + INTERVAL '4 minutes')
  ON CONFLICT (target_uid) DO UPDATE
    SET expires_at = EXCLUDED.expires_at,
        started_by = EXCLUDED.started_by;

  -- Set temporary password on target user
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(v_temp_pass, extensions.gen_salt('bf'))
  WHERE id = target_uid;

  -- Return email and temp password for admin to use
  RETURN json_build_object('email', v_email, 'temp_pass', v_temp_pass, 'uid', target_uid);
END;
$function$;