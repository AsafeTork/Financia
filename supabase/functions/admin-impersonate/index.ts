import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, handleOptions, serverErrorResponse } from '../_shared/responses.ts';

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

    const targetUid = body.target_uid;
    if (!targetUid) {
      return corsResponse({ error: 'missing_target' }, 400);
    }

    const { data: targetUser, error: userError } = await admin.auth.admin.getUserById(targetUid);
    if (userError || !targetUser || !targetUser.user) {
      return corsResponse({ error: 'user_not_found' }, 404);
    }
    var targetEmail = targetUser.user.email;
    if (!targetEmail) {
      return corsResponse({ error: 'target_no_email' }, 400);
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: targetEmail,
    });
    if (linkError || !linkData) {
      return corsResponse({ error: 'generate_link_failed' }, 500);
    }

    var actionLink = linkData.properties?.action_link;
    if (!actionLink) {
      return corsResponse({ error: 'missing_action_link' }, 500);
    }
    var urlObj = new URL(actionLink);
    var token = urlObj.searchParams.get('token');
    if (!token) {
      return corsResponse({ error: 'token_not_found' }, 500);
    }

    const { data: sessionData, error: sessionError } = await admin.auth.verifyOtp({
      email: targetEmail,
      token: token,
      type: 'magiclink',
    });
    if (sessionError || !sessionData?.session?.access_token) {
      return corsResponse({ error: 'verify_otp_failed' }, 500);
    }

    return corsResponse({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      expires_at: sessionData.session.expires_at,
    });
  } catch (err) {
    return serverErrorResponse(err instanceof Error ? err.message : String(err));
  }
});
