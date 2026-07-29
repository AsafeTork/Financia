// Edge Function: trigger-apk-build
// Proxy para o GitHub Actions dispatch.
// O token GitHub fica armazenado como ENV var (GH_TOKEN), nunca exposto ao cliente.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

Deno.serve(async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const ghToken = Deno.env.get('GH_TOKEN');
  if (!ghToken) {
    return jsonResponse(200, { ok: false, reason: 'no_token' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) {
    return jsonResponse(500, { ok: false, reason: 'not_configured' });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse(401, { ok: false, reason: 'unauthorized' });

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const userResult = await callerClient.auth.getUser();
    const caller = userResult?.data?.user;
    if (!caller) return jsonResponse(401, { ok: false, reason: 'unauthorized' });

    let body: any = {};
    try { body = await req.json(); } catch (_) {}
    const clientName: string = String(body?.client_name || 'Financia').replace(/[^\w\s-]/g, '').trim().slice(0, 60) || 'Financia';
    const logoUrl: string = body?.logo_url || '';
    const primaryColor: string = String(body?.primary_color || '#002f59').replace(/[^#0-9a-fA-F]/g, '');
    const safeColor = /^#?[0-9a-fA-F]{6}$/.test(primaryColor) ? (primaryColor.charAt(0) === '#' ? primaryColor.slice(1) : primaryColor) : '002f59';

    const ghRes = await fetch(
      'https://api.github.com/repos/AsafeTork/financia/actions/workflows/build.yml/dispatches',
      {
        method: 'POST',
        headers: {
          Authorization: 'token ' + ghToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: {
            client_name: clientName,
            logo_url: logoUrl,
            primary_color: safeColor,
          },
        }),
      }
    );

    if (ghRes.status === 204) {
      console.log('GitHub dispatch accepted', { clientName, logoUrl: logoUrl ? 'provided' : 'none' });
      return jsonResponse(200, { ok: true });
    }
    const ghBody = await ghRes.text().catch(() => '(no body)');
    console.error('GitHub dispatch failed', { status: ghRes.status, body: ghBody });
    return jsonResponse(200, { ok: false, reason: 'api_error', status: ghRes.status, detail: ghBody });
  } catch (err: any) {
    return jsonResponse(200, { ok: false, reason: 'network_error', detail: String(err?.message || err) });
  }
});
