import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, handleOptions, unauthorizedResponse, safeErrorResponse } from '../_shared/responses.ts';

Deno.serve(async function (req: Request) {
  if (req.method === 'OPTIONS') return handleOptions();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return corsResponse({ error: 'not_configured' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return unauthorizedResponse();

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const userResult = await callerClient.auth.getUser();
    const caller = userResult?.data?.user;
    if (!caller) return unauthorizedResponse();

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { body = {}; }
    const brandConfig = body?.brand_config;
    if (brandConfig === undefined || brandConfig === null) {
      return corsResponse({ error: 'missing_brand_config' }, 400);
    }
    const configSize = JSON.stringify(brandConfig).length;
    if (configSize > 50000) {
      return corsResponse({ error: 'brand_config_too_large' }, 413);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { error } = await admin
      .from('company_profiles')
      .update({ brand_config: brandConfig })
      .eq('user_id', caller.id);

    if (error) {
      return safeErrorResponse(new Error(error.message), 'update-brand-config');
    }

    return corsResponse({ ok: true }, 200);
  } catch (err) {
    return safeErrorResponse(err, 'update-brand-config');
  }
});
