-- This migration fixes the hardcoded URLs in admin_get_magic_link
-- The original function had hardcoded Supabase project URL and redirect URL
-- which prevents staging/prod separation

-- Remove old insecure version
DROP FUNCTION IF EXISTS public.admin_get_magic_link(uuid);

-- Create new version using current_setting for configuration
CREATE OR REPLACE FUNCTION public.admin_get_magic_link(target_uid uuid)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $$
DECLARE
  v_token text;
  v_project_url text;
  v_redirect_url text;
BEGIN
  -- Verify admin permissions
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Generate magic link token
  SELECT encode(gen_random_bytes(32), 'hex') INTO v_token;

  -- Insert token into auth flow
  INSERT INTO auth.mfa_amr_claims (user_id, amr, expires_at)
  VALUES (target_uid, 'magic_link', now() + INTERVAL '10 minutes')
  ON CONFLICT (user_id) DO UPDATE SET amr = EXCLUDED.amr, expires_at = EXCLUDED.expires_at;

  -- Get configuration from settings (no hardcoded URLs)
  v_project_url := current_setting('app.supabase_project_url', true);
  v_redirect_url := current_setting('app.redirect_url', true);

  -- Fallback to defaults if not configured
  IF v_project_url IS NULL OR v_project_url = '' THEN
    v_project_url := 'https://kxeqhorxhlgwcgywovqr.supabase.co';
  END IF;
  
  IF v_redirect_url IS NULL OR v_redirect_url = '' THEN
    v_redirect_url := 'https://gestao-financeira-7heu.onrender.com';
  END IF;

  -- Build magic link URL
  RETURN v_project_url || '/auth/v1/verify?token=' || v_token
    || '&type=magiclink&redirect_to=' || v_redirect_url;
END;
$$;