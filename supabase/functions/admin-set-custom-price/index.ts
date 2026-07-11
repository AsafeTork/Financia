// Edge Function: admin-set-custom-price
// SO admin. Define (ou limpa) o preco customizado de um cliente:
//  1) grava via RPC admin_set_custom_price (gate de admin + validacao no banco);
//  2) se o cliente JA tem assinatura ativa na Stripe, ajusta o preco do item agora
//     (proration_behavior 'none' -> sem cobranca surpresa, vale no proximo ciclo).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sanitizePlanId, sanitizeUuid, asPositiveInt, enforceRateLimit, getAdminClient } from '../_shared/security.ts';
import { 
  createStripeClient, 
  findOrCreateCustomer, 
  getActiveSubscription, 
  planOfSub, 
  resolvePriceId,
  ACTIVE_STATUSES 
} from '../_shared/stripe.ts';
import { withLogging, corsResponse, handleOptions, Logger } from '../_shared/logger.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function handler(req: Request, logger: Logger): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return handleOptions();
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsResponse({ error: 'unauthorized' }, 401);
    }

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const targetUserId = sanitizeUuid(body?.target_user_id);
    const planIdInput = sanitizePlanId(body?.plan_id);
    const rawCents = body?.cents === 0 ? 0 : (body?.cents ?? null);
    const cents = (rawCents === null || rawCents === undefined) ? null : (rawCents <= 0 ? null : rawCents);

    if (!targetUserId) {
      return corsResponse({ error: 'missing_target' }, 400);
    }
    if (rawCents !== null && rawCents !== undefined && rawCents <= 0) {
      return corsResponse({ error: 'invalid_price' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1) Autentica e valida admin chamador.
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });
    const callerRes = await supabase.auth.getUser();
    const caller = callerRes.data?.user;
    if (!caller) return corsResponse({ error: 'unauthorized' }, 401);

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const roleRes = await admin.from('user_roles').select('role').eq('user_id', caller.id).maybeSingle();
    if (!roleRes.data || roleRes.data.role !== 'admin') {
      return corsResponse({ error: 'forbidden' }, 403);
    }

    const secAdmin = getAdminClient();
    const allowed = await enforceRateLimit(secAdmin, caller.id, 'admin_set_custom_price', 60, 20);
    if (!allowed) return corsResponse({ error: 'rate_limited' }, 429);

    // Update custom price in DB
    if (planIdInput) {
      let col = 'custom_price_cents_pro';
      if (planIdInput === 'premium') col = 'custom_price_cents_premium';
      if (planIdInput === 'white_label') col = 'custom_price_cents_white_label';
      const updateData = { [col]: (cents && cents > 0) ? cents : null };
      const upd = await admin.from('company_profiles').update(updateData).eq('user_id', targetUserId);
      if (upd.error) return corsResponse({ error: String(upd.error.message || 'update_failed') }, 400);
    } else {
      const rpcRes = await supabase.rpc('admin_set_custom_price', { a_target: targetUserId, b_cents: cents });
      if (rpcRes.error) {
        const msg = rpcRes.error.message || 'rpc_failed';
        const code = msg.indexOf('not authorized') !== -1 ? 403 : 400;
        return corsResponse({ error: String(msg) }, code);
      }
    }

    // 2) Aplica na assinatura ativa, se existir.
    const userRes = await admin.auth.admin.getUserById(targetUserId);
    const targetUser = userRes.data?.user;
    const email = targetUser?.email;
    if (!email) {
      return corsResponse({ ok: true, applied: false });
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return corsResponse({ error: 'stripe_not_configured' }, 500);

    const stripe = await import('https://esm.sh/stripe@17.7.0?target=denonext').then(m => m.default(stripeKey, { apiVersion: '2025-01-27.acacia' }));

    // Find customer
    const existing = await stripe.customers.list({ email: email!, limit: 20 });
    let customer = null;
    for (const c of existing.data) {
      if (c.metadata?.user_id === targetUserId) { customer = c; break; }
    }
    if (!customer && existing.data.length > 0) customer = existing.data[0];
    if (!customer) return corsResponse({ ok: true, applied: false });

    const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 20 });
    let sub = null;
    for (const s of subs.data) {
      if (['active', 'trialing', 'past_due', 'unpaid'].includes(s.status)) { sub = s; break; }
    }
    if (!sub) return corsResponse({ ok: true, applied: false });

    const item = sub.items?.data?.[0];
    if (!item) return corsResponse({ ok: true, applied: false });

    const planId = sub.metadata?.plan_id || (sub.items?.data?.[0]?.price?.metadata?.plan_id) || 'pro';
    if (planIdInput && planIdInput !== planId) return corsResponse({ ok: true, applied: false });
    const planForPrice = planIdInput || planId;

    // Resolve price using shared logic
    const { default: Stripe } = await import('https://esm.sh/stripe@17.7.0?target=denonext');
    const stripeClient = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-01-27.acacia' });
    
    // Inline price resolution
    const findOrCreateProduct = async (stripe: any, planId: string) => {
      try {
        const found = await stripe.products.search({ query: "active:'true' AND metadata['plan_id']:'" + planId + "'", limit: 1 });
        if (found.data.length > 0) return found.data[0].id;
      } catch {}
      const created = await stripe.products.create({ name: 'Financia ' + planId, metadata: { plan_id: planId } });
      return created.id;
    };
    const findOrCreatePrice = async (stripe: any, planId: string) => {
      const lookupKey = 'financia_' + planId + '_monthly';
      const found = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
      if (found.data.length > 0) return found.data[0].id;
      const productId = await findOrCreateProduct(stripe, planId);
      const price = await stripe.prices.create({
        currency: 'brl',
        unit_amount: { pro: 4990, premium: 9990, white_label: 99700 }[planForPrice] || 4990,
        recurring: { interval: 'month' },
        product: await findOrCreateProduct(stripe, planId),
        lookup_key: lookupKey,
        metadata: { plan_id: planId },
      });
      return price.id;
    };
    const customPriceId = async (stripe: any, planId: string, cents: number, userId: string) => {
      const short = String(targetUserId).replace(/-/g, '').slice(0, 12);
      const lookupKey = 'financia_' + planForPrice + '_c' + cents + '_' + short;
      const found = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
      if (found.data.length > 0) return found.data[0].id;
      const productId = await findOrCreateProduct(stripe, planForPrice);
      const price = await stripe.prices.create({
        currency: 'brl', unit_amount: cents, recurring: { interval: 'month' },
        product: await findOrCreateProduct(stripe, planForPrice), lookup_key: lookupKey,
        metadata: { plan_id: planForPrice, custom_for: targetUserId },
      });
      return price.id;
    };

    const planForPrice = planIdInput || planId;
    const cents = body?.cents ?? null;
    const newPriceId = (cents && cents > 0)
      ? await customPriceId(stripe, planForPrice, cents, targetUserId)
      : await standardPriceId(stripe, planForPrice);

    if (item.price && item.price.id === newPriceId) {
      return corsResponse({ ok: true, applied: false });
    }

    await stripe.subscriptions.update(sub.id, {
      items: [{ id: item.id, price: newPriceId }],
      proration_behavior: 'none',
      metadata: { user_id: targetUserId, plan_id: planForPrice },
    });

    return corsResponse({ ok: true, applied: true });
  } catch (err) {
    const message = err?.message || String(err);
    return corsResponse({ error: String(message) }, 500);
  }
});

function corsResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
  return withLogging('admin-set-custom-price', async (req, logger) => {
    return handler(req, logger);
  })(req);
});

async function handler(req: Request, logger: any): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'method_not_allowed' }), { status: 405, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const targetUserId = sanitizeUuid(body?.target_user_id);
    const planIdInput = sanitizePlanId(body?.plan_id);
    const rawCents = body?.cents === 0 ? 0 : (body?.cents ?? null);
    const cents = (rawCents === null || rawCents === undefined) ? null : (rawCents <= 0 ? null : rawCents);
    if (!targetUserId) return corsResponse({ error: 'missing_target' }, 400);
    if (rawCents !== null && rawCents !== undefined && rawCents <= 0) return corsResponse({ error: 'invalid_price' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: req.headers.get('Authorization')! } } });
    const callerRes = await supabase.auth.getUser();
    const caller = callerRes.data?.user;
    if (!caller) return corsResponse({ error: 'unauthorized' }, 401);
    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const roleRes = await admin.from('user_roles').select('role').eq('user_id', caller.id).maybeSingle();
    if (!roleRes.data || roleRes.data.role !== 'admin') return corsResponse({ error: 'forbidden' }, 403);
    const secAdmin = getAdminClient();
    const allowed = await enforceRateLimit(secAdmin, caller.id, 'admin_set_custom_price', 60, 20);
    if (!allowed) return corsResponse({ error: 'rate_limited' }, 429);

    if (planIdInput) {
      let col = 'custom_price_cents_pro';
      if (planIdInput === 'premium') col = 'custom_price_cents_premium';
      if (planIdInput === 'white_label') col = 'custom_price_cents_white_label';
      const updateData: Record<string, any> = { [col]: (cents && cents > 0) ? cents : null };
      const upd = await admin.from('company_profiles').update(updateData).eq('user_id', targetUserId);
      if (upd.error) return corsResponse({ error: String(upd.error.message || 'update_failed') }, 400);
    } else {
      const rpcRes = await supabase.rpc('admin_set_custom_price', { a_target: targetUserId, b_cents: cents });
      if (rpcRes.error) {
        const msg = rpcRes.error.message || 'rpc_failed';
        const code = msg.indexOf('not authorized') !== -1 ? 403 : 400;
        return corsResponse({ error: String(msg) }, code);
      }
    }

    const userRes = await admin.auth.admin.getUserById(targetUserId);
    const targetUser = userRes.data?.user;
    const email = targetUser?.email;
    if (!email) return corsResponse({ ok: true, applied: false });

    const stripe = new (await import('https://esm.sh/stripe@17.7.0?target=denonext')).default(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2025-01-27.acacia' });

    const existing = await stripe.customers.list({ email, limit: 20 });
    let customer = null;
    for (const c of existing.data) {
      if (c.metadata?.user_id === targetUserId) { customer = c; break; }
    }
    if (!customer && existing.data.length > 0) customer = existing.data[0];
    if (!customer) return corsResponse({ ok: true, applied: false });

    const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 20 });
    let sub = null;
    for (const s of subs.data) { if (['active', 'trialing', 'past_due', 'unpaid'].includes(s.status)) { sub = s; break; } }
    if (!sub) return corsResponse({ ok: true, applied: false });
    const item = sub.items?.data?.[0];
    if (!item) return corsResponse({ ok: true, applied: false });

    const planId = sub.metadata?.plan_id || sub.items?.data?.[0]?.price?.metadata?.plan_id || 'pro';
    if (planIdInput && planIdInput !== planId) return corsResponse({ ok: true, applied: false });
    const planForPrice = planIdInput || planId;

    const findOrCreateProduct = async (stripe: any, planId: string) => {
      try {
        const found = await stripe.products.search({ query: "active:'true' AND metadata['plan_id']:'" + planId + "'", limit: 1 });
        if (found.data.length > 0) return found.data[0].id;
      } catch {}
      const created = await stripe.products.create({ name: 'Financia ' + planId, metadata: { plan_id: planId } });
      return created.id;
    };
    const standardPriceId = async (stripe: any, planId: string) => {
      const lookupKey = 'financia_' + planId + '_monthly';
      const found = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
      if (found.data.length > 0) return found.data[0].id;
      const productId = await findOrCreateProduct(stripe, planId);
      const price = await stripe.prices.create({ currency: 'brl', unit_amount: { pro: 4990, premium: 9990, white_label: 99700 }[planForPrice] || 4990, recurring: { interval: 'month' }, product: await findOrCreateProduct(stripe, planId), lookup_key: lookupKey, metadata: { plan_id: planId } });
      return price.id;
    };
    const customPriceId = async (stripe: any, planId: string, cents: number, userId: string) => {
      const short = String(targetUserId).replace(/-/g, '').slice(0, 12);
      const lookupKey = 'financia_' + planForPrice + '_c' + cents + '_' + short;
      const found = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
      if (found.data.length > 0) return found.data[0].id;
      const productId = await findOrCreateProduct(stripe, planForPrice);
      const price = await stripe.prices.create({ currency: 'brl', unit_amount: cents, recurring: { interval: 'month' }, product: await findOrCreateProduct(stripe, planForPrice), lookup_key: lookupKey, metadata: { plan_id: planForPrice, custom_for: targetUserId } });
      return price.id;
    };

    const planForPrice = planIdInput || planId;
    const centsVal = body?.cents ?? null;
    const newPriceId = (centsVal && centsVal > 0)
      ? await customPriceId(stripe, planForPrice, centsVal, targetUserId)
      : await standardPriceId(stripe, planForPrice);

    if (item.price && item.price.id === newPriceId) return corsResponse({ ok: true, applied: false });

    await stripe.subscriptions.update(sub.id, { items: [{ id: item.id, price: newPriceId }], proration_behavior: 'none', metadata: { user_id: targetUserId, plan_id: planForPrice } });

    return corsResponse({ ok: true, applied: true });
  } catch (err) {
    const message = err?.message || String(err);
    return corsResponse({ error: String(message) }, 500);
  }
}

function corsResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
}

async function findOrCreateCustomer(stripe: any, email: string | undefined, userId: string) {
  if (email) {
    const existing = await stripe.customers.list({ email, limit: 20 });
    for (const c of existing.data) {
      if (c.metadata?.user_id === userId) return c;
    }
    return existing.data[0] || await stripe.customers.create({ email: email || undefined, metadata: { user_id: userId } });
  }
  return stripe.customers.create({ metadata: { user_id: userId } });
}

async function getActiveSubscription(stripe: any, customerId: string) {
  const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
  for (const s of subs.data) { if (['active', 'trialing', 'past_due', 'unpaid'].includes(s.status)) return s; }
  return null;
}

function planOfSub(sub: any): string {
  const m = sub.metadata || {};
  if (m.plan_id === 'pro' || m.plan_id === 'premium') return m.plan_id;
  const item = sub.items?.data?.[0];
  const pm = item?.price?.metadata || {};
  if (pm.plan_id === 'pro' || pm.plan_id === 'premium') return pm.plan_id;
  return 'pro';
}

async function findOrCreateProduct(stripe: any, planId: string) {
  try { const found = await stripe.products.search({ query: "active:'true' AND metadata['plan_id']:'" + planId + "'", limit: 1 }); if (found.data.length > 0) return found.data[0].id; } catch {}
  return (await stripe.products.create({ name: 'Financia ' + planId, metadata: { plan_id: planId } })).id;
}

async function standardPriceId(stripe: any, planId: string) {
  const lookupKey = 'financia_' + planId + '_monthly';
  const found = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (found.data.length > 0) return found.data[0].id;
  const productId = await findOrCreateProduct(stripe, planId);
  return (await stripe.prices.create({ currency: 'brl', unit_amount: { pro: 4990, premium: 9990, white_label: 99700 }[planForPrice] || 4990, recurring: { interval: 'month' }, product: productId, lookup_key: lookupKey, metadata: { plan_id: planId } })).id;
}

async function customPriceId(stripe: any, planId: string, cents: number, userId: string) {
  const short = String(userId).replace(/-/g, '').slice(0, 12);
  const lookupKey = 'financia_' + planId + '_c' + cents + '_' + short;
  const found = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (found.data.length > 0) return found.data[0].id;
  const productId = await findOrCreateProduct(stripe, planId);
  return (await stripe.prices.create({ currency: 'brl', unit_amount: cents, recurring: { interval: 'month' }, product: productId, lookup_key: lookupKey, metadata: { plan_id: planId, custom_for: userId } })).id;
}

function corsResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
}