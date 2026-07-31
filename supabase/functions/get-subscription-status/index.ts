import Stripe from 'https://esm.sh/stripe@17.7.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAdminClient } from '../_shared/security.ts';
import { withLogging, corsResponse, handleOptions } from '../_shared/logger.ts';
import { safeErrorResponse } from '../_shared/responses.ts';

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'];

function activeSubscriptionOf(subs) {
  if (!subs || !subs.data) return null;
  for (let i = 0; i < subs.data.length; i++) {
    if (ACTIVE_STATUSES.indexOf(subs.data[i].status) !== -1) return subs.data[i];
  }
  return null;
}

async function findCustomer(stripe, email, userId) {
  if (email) {
    const existing = await stripe.customers.list({ email: email, limit: 20 });
    if (existing && existing.data && existing.data.length > 0) {
      for (let i = 0; i < existing.data.length; i++) {
        const c = existing.data[i];
        const m = c && c.metadata ? c.metadata : {};
        if (m.user_id && String(m.user_id) === String(userId)) return c;
      }
      return existing.data[0];
    }
  }
  return null;
}

async function isAdmin(adminClient, userId) {
  if (!adminClient || !userId) return false;
  try {
    const r = await adminClient.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
    return !!(r && r.data);
  } catch (_) { return false; }
}

async function statusOfUser(stripe, email, userId) {
  const customer = await findCustomer(stripe, email, userId);
  if (!customer) return { status: 'none' };
  const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 20 });
  const activeSub = activeSubscriptionOf(subs);
  if (!activeSub) return { status: 'none' };
  return {
    status: activeSub.cancel_at_period_end ? 'canceled_expiring' : 'active',
    current_period_end: activeSub.current_period_end,
    cancel_at: activeSub.cancel_at || null,
    plan_id: (activeSub.metadata && activeSub.metadata.plan_id) || 'pro',
  };
}

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions();

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) return corsResponse({ error: 'stripe_not_configured' }, 500);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return corsResponse({ error: 'unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const userResult = await supabase.auth.getUser();
    const user = userResult && userResult.data ? userResult.data.user : null;
    if (!user) return corsResponse({ error: 'unauthorized' }, 401);

    const admin = getAdminClient();
    let body = {};
    try { body = await req.json(); } catch (e) { body = {}; }

    // Admin looking up another user
    const targetUserId = body && body.user_id;
    if (targetUserId && String(targetUserId) !== String(user.id)) {
      const adm = await isAdmin(admin, user.id);
      if (!adm) return corsResponse({ error: 'not_authorized' }, 403);
      const profileRes = await supabase.from('company_profiles').select('email').eq('user_id', targetUserId).maybeSingle();
      const targetEmail = (profileRes && profileRes.data && profileRes.data.email) ? profileRes.data.email : null;
      const info = await statusOfUser(new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' }), targetEmail, targetUserId);
      return corsResponse(info);
    }

    // Self lookup
    const info = await statusOfUser(new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' }), user.email, user.id);
    return corsResponse(info);
  } catch (err) {
    return safeErrorResponse(err, 'get-subscription-status');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  return withLogging('get-subscription-status', async (req) => handler(req))(req);
});