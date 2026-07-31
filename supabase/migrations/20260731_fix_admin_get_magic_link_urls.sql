-- Fix admin_get_magic_link: use configurable URLs via current_setting()
-- CRITICAL: Hardcoded project URL and redirect URL prevent staging/prod separation
-- Ref: Banco/ESPECIALISTA_BANCO.md section C2, SECURITY_AUDIT_REPORT.md section 2.7
-- Uses app.magic_link_base_url and app.magic_link_redirect_url settings
-- Fallback to production URL if settings not configured

CREATE OR REPLACE FUNCTION public.admin_get_magic_link(target_uid uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_bytes         bytea;
  v_token         text;
  v_token_hash    text;
  v_base_url      text;
  v_redirect_url  text;
BEGIN
  -- Admin gate: only admins can generate magic links
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'forbidden: apenas admin';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = target_uid) THEN
    RAISE EXCEPTION 'usuario nao encontrado';
  END IF;

  -- Generate secure token
  v_bytes       := extensions.gen_random_bytes(32);
  v_token       := encode(v_bytes, 'hex');
  v_token_hash  := encode(extensions.digest(v_bytes, 'sha256'), 'hex');

  -- Store token hash in auth.users for verification
  UPDATE auth.users
  SET confirmation_token   = v_token_hash,
      confirmation_sent_at = now(),
      email_confirmed_at   = COALESCE(email_confirmed_at, now())
  WHERE id = target_uid;

  -- Get base URL from config (set via Supabase custom settings or environment)
  -- Format: https://your-project.supabase.co
  v_base_url := current_setting('app.magic_link_base_url', true);
  IF v_base_url = '' THEN
    v_base_url := 'https://kxeqhorxhlgwcgywovqr.supabase.co';  -- production fallback
  END IF;

  -- Get redirect URL from config
  -- Format: https://your-app.onrender.com or https://your-app.com
  v_redirect_url := current_setting('app.magic_link_redirect_url', true);
  IF v_redirect_url = '' THEN
    v_redirect_url := 'https://gestao-financeira-7heu.onrender.com';  -- production fallback
  END IF;

  -- Return full magic link with configurable URLs
  RETURN v_base_url || '/auth/v1/verify?token=' || v_token
    || '&type=magiclink&redirect_to=' || encode(v_redirect_url, 'url');
END;
$function$;