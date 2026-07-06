import Stripe from 'https://esm.sh/stripe@17.7.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAdminClient } from '../_shared/security.ts';

var CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

var ACTIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'];

function jsonResponse(status, payload) {
  var headers = { 'Content-Type': 'application/json' };
  var keys = Object.keys(CORS_HEADERS);
  for (var i = 0; i < keys.length; i++) { headers[keys[i]] = CORS_HEADERS[keys[i]]; }
  return new Response(JSON.stringify(payload), { status: status, headers: headers });
}

function activeSubscriptionOf(subs) {
  if (!subs || !subs.data) return null;
  for (var i = 0; i < subs.data.length; i++) {
    if (ACTIVE_STATUSES.indexOf(subs.data[i].status) !== -1) return subs.data[i];
  }
  return null;
}

async function findCustomer(stripe, email, userId) {
  if (email) {
    var existing = await stripe.customers.list({ email: email, limit: 20 });
    if (existing && existing.data && existing.data.length > 0) {
      for (var i = 0; i < existing.data.length; i++) {
        var c = existing.data[i];
        var m = c && c.metadata ? c.metadata : {};
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
    var r = await adminClient.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
    return !!(r && r.data);
  } catch (_) { return false; }
}

async function statusOfUser(stripe, email, userId) {
  var customer = await findCustomer(stripe, email, userId);
  if (!customer) return { status: 'none' };
  var subs = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 20 });
  var activeSub = activeSubscriptionOf(subs);
  if (!activeSub) return { status: 'none' };
  return {
    status: activeSub.cancel_at_period_end ? 'canceled_expiring' : 'active',
    current_period_end: activeSub.current_period_end,
    cancel_at: activeSub.cancel_at || null,
    plan_id: (activeSub.metadata && activeSub.metadata.plan_id) || 'pro',
  };
}

Deno.serve(async function (req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  var stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) return jsonResponse(500, { error: 'stripe_not_configured' });

  try {
    var authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse(401, { error: 'unauthorized' });

    var supabaseUrl = Deno.env.get('SUPABASE_URL');
    var supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    var supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    var userResult = await supabase.auth.getUser();
    var user = userResult && userResult.data ? userResult.data.user : null;
    if (!user) return jsonResponse(401, { error: 'unauthorized' });

    var admin = getAdminClient();
    var body = {};
    try { body = await req.json(); } catch (e) { body = {}; }

    // Admin looking up another user
    var targetUserId = body && body.user_id;
    if (targetUserId && String(targetUserId) !== String(user.id)) {
      var adm = await isAdmin(admin, user.id);
      if (!adm) return jsonResponse(403, { error: 'not_authorized' });
      var profileRes = await supabase.from('company_profiles').select('email').eq('user_id', targetUserId).maybeSingle();
      var targetEmail = (profileRes && profileRes.data && profileRes.data.email) ? profileRes.data.email : null;
      var info = await statusOfUser(new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' }), targetEmail, targetUserId);
      return jsonResponse(200, info);
    }

    // Self lookup
    var info = await statusOfUser(new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' }), user.email, user.id);
    return jsonResponse(200, info);
  } catch (err) {
    var message = err && err.message ? err.message : String(err);
    return jsonResponse(500, { error: String(message) });
  }
});
