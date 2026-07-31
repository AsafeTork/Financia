import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SignJWT } from 'https://esm.sh/jose@5';
import { withLogging, corsResponse, handleOptions } from '../_shared/logger.ts';
import { enforceRateLimit, getAdminClient } from '../_shared/security.ts';
import { safeErrorResponse } from '../_shared/responses.ts';

async function handler(req: Request): Promise<Response> {
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

    const admin = createClient(supabaseUrl, serviceKey);

    // Rate limit: max 5 impersonations per hour per admin
    const secAdmin = getAdminClient();
    const allowed = await enforceRateLimit(secAdmin, user.id, 'admin_impersonate', 3600, 5);
    if (!allowed) return corsResponse({ error: 'rate_limited', retry_after_seconds: 3600 }, 429);

    let body: { target_uid?: string };
    try {
      body = await req.json();
    } catch {
      return corsResponse({ error: 'invalid_body' }, 400);
    }

    const targetUid = body.target_uid;
    if (!targetUid) {
      return corsResponse({ error: 'missing_target' }, 400);
    }

    // Parallel: admin role check + target user lookup
    const [roleResult, targetResult] = await Promise.all([
      admin.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle(),
      admin.auth.admin.getUserById(targetUid),
    ]);
    if (!roleResult.data) return corsResponse({ error: 'forbidden' }, 403);
    const targetUser = targetResult.data;
    const userError = targetResult.error;
    if (userError || !targetUser || !targetUser.user) {
      return corsResponse({ error: 'user_not_found' }, 404);
    }
    const targetEmail = targetUser.user.email;
    if (!targetEmail) {
      return corsResponse({ error: 'target_no_email' }, 400);
    }

    // Generate short-lived impersonation JWT (5 minutes) with act claim (RFC 8693)
    // Signing key derived from service role key
    const signingKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(serviceKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );

    const now = Math.floor(Date.now() / 1000);
    const exp = now + 300; // 5 minutes

    const impersonationToken = await new SignJWT({
      sub: targetUid,
      email: targetEmail,
      role: 'authenticated',
      act: { sub: user.id }, // Admin who initiated impersonation
      iat: now,
      exp: exp,
      type: 'impersonation',
    })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .sign(signingKey);

    // Audit log
    await admin.from('impersonation_sessions').insert({
      target_uid: targetUid,
      admin_uid: user.id,
      started_at: new Date().toISOString(),
      expires_at: new Date((now + 300) * 1000).toISOString(),
      token_jti: impersonationToken.split('.')[2].substring(0, 16),
    });

    // Return ONLY the impersonation token (NOT refresh_token!)
    return corsResponse({ impersonation_token: impersonationToken, expires_in: 300 });
  } catch (err) {
    return safeErrorResponse(err, 'admin-impersonate');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  return withLogging('admin-impersonate', async (req) => handler(req))(req);
});