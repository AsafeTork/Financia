import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sanitizeUuid } from '../_shared/security.ts';
import { corsResponse, handleOptions, serverErrorResponse } from '../_shared/responses.ts';

const RATE_LIMIT_WINDOW = 10_000;
const RATE_LIMIT_CACHE = new Map<string, number>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const last = RATE_LIMIT_CACHE.get(key);
  if (last && now - last < RATE_LIMIT_WINDOW) return true;
  RATE_LIMIT_CACHE.set(key, now);
  return false;
}

Deno.serve(async function(req: Request) {
  if (req.method === 'OPTIONS') return handleOptions();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return corsResponse({ error: 'not_configured' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return corsResponse({ error: 'unauthorized' }, 401);

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) return corsResponse({ error: 'unauthorized' }, 401);

    if (isRateLimited(user.id)) {
      return corsResponse({ error: 'rate_limited' }, 429);
    }

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: roleData } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleData) return corsResponse({ error: 'forbidden' }, 403);

    let body: { target_uid?: string };
    try {
      body = await req.json();
    } catch {
      return corsResponse({ error: 'invalid_body' }, 400);
    }

    const targetUid = sanitizeUuid(body.target_uid);
    if (!targetUid) {
      return corsResponse({ error: 'missing_target' }, 400);
    }

    const startResult = await admin.rpc('admin_impersonate_start', { target_uid: targetUid });
    if (startResult.error) {
      return corsResponse({ error: String(startResult.error.message || 'impersonate_failed') }, 400);
    }

    const tempPass = startResult?.data?.temp_pass;
    if (!tempPass) {
      return corsResponse({ error: 'impersonate_no_token' }, 500);
    }

    const linkResult = await admin.rpc('admin_get_magic_link', { target_uid: targetUid });
    if (linkResult.error) {
      return corsResponse({ error: String(linkResult.error.message || 'magic_link_failed') }, 400);
    }

    const magicLink = linkResult?.data || null;
    const expiresAt = new Date(Date.now() + 4 * 60 * 1000).toISOString();

    return corsResponse({
      session_token: tempPass,
      magic_link: magicLink,
      expires_at: expiresAt,
    });
  } catch (err) {
    return serverErrorResponse(err instanceof Error ? err.message : String(err));
  }
});
