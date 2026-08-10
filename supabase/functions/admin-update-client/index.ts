import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, handleOptions, safeErrorResponse } from '../_shared/responses.ts';

function validHex(value: unknown): string | null {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : null;
}

function validUrl(value: unknown): string | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 2000) return null;
  try {
    const url = new URL(value);
    return ['http:', 'https:', 'data:'].includes(url.protocol) ? value : null;
  } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleOptions();
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return corsResponse({ error: 'unauthorized' }, 401);
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const callerClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const caller = (await callerClient.auth.getUser()).data.user;
    if (!caller) return corsResponse({ error: 'unauthorized' }, 401);
    const admin = createClient(url, service);
    const role = await admin.from('user_roles').select('role').eq('user_id', caller.id).maybeSingle();
    if (role.data?.role !== 'admin') return corsResponse({ error: 'forbidden' }, 403);
    const body = await req.json();
    const target = typeof body?.target_user_id === 'string' ? body.target_user_id : '';
    if (!/^[0-9a-f-]{36}$/i.test(target)) return corsResponse({ error: 'invalid_target' }, 400);
    const update = {
      name: typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '',
      color: validHex(body.color) || '#002f59',
      color_secondary: validHex(body.color_secondary),
      color_accent: validHex(body.color_accent),
      logo_url: validUrl(body.logo_url),
    };
    if (!update.name) return corsResponse({ error: 'missing_name' }, 400);
    const result = await admin.from('company_profiles').update(update).eq('user_id', target);
    if (result.error) return corsResponse({ error: result.error.message }, 400);
    return corsResponse({ ok: true }, 200);
  } catch (error) {
    return safeErrorResponse(error, 'admin-update-client');
  }
});
