import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { enforceRateLimit, getAdminClient, sanitizeUuid } from '../_shared/security.ts';
import { withLogging, corsResponse, handleOptions } from '../_shared/logger.ts';
import { safeErrorResponse } from '../_shared/responses.ts';

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions();

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return corsResponse({ error: 'not_configured' }, 500);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return corsResponse({ error: 'unauthorized' }, 401);

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const userResult = await callerClient.auth.getUser();
    const caller = userResult && userResult.data ? userResult.data.user : null;
    if (!caller) return corsResponse({ error: 'unauthorized' }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const roleRes = await admin.from('user_roles').select('role').eq('user_id', caller.id).maybeSingle();
    const isAdmin = roleRes && roleRes.data && roleRes.data.role === 'admin';
    if (!isAdmin) return corsResponse({ error: 'forbidden' }, 403);

    const secAdmin = getAdminClient();
    const allowed = await enforceRateLimit(secAdmin, caller.id, 'admin_set_white_label', 60, 20);
    if (!allowed) return corsResponse({ error: 'rate_limited' }, 429);

    let body = {};
    try { body = await req.json(); } catch (_) { body = {}; }
    const targetUserId = sanitizeUuid(body && body.target_user_id);
    const enabled = !!(body && body.enabled);
    if (!targetUserId) return corsResponse({ error: 'missing_target' }, 400);

    const rpc = await admin.rpc('set_white_label', { p_user: targetUserId, p_on: enabled });
    if (rpc && rpc.error) {
      return corsResponse({ error: String(rpc.error.message || 'rpc_failed') }, 400);
    }

    return corsResponse({ ok: true });
  } catch (err) {
    return safeErrorResponse(err, 'admin-set-white-label');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  return withLogging('admin-set-white-label', async (req) => handler(req))(req);
});