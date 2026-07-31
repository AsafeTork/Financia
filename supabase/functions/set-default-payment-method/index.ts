// Edge Function: set-default-payment-method
// Apos o cliente confirmar o SetupIntent no app, define o novo cartao (payment_method)
// como padrao do customer e de todas as assinaturas ativas dele. O customer e resolvido
// pelo email do usuario autenticado — so altera as proprias assinaturas.
import Stripe from 'https://esm.sh/stripe@17.7.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { enforceRateLimit, getAdminClient, sanitizePaymentMethodId, cacheDel } from '../_shared/security.ts';
import { withLogging, corsResponse, handleOptions } from '../_shared/logger.ts';
import { safeErrorResponse } from '../_shared/responses.ts';

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'];

async function findCustomerId(stripe, email) {
  if (!email) return null;
  const existing = await stripe.customers.list({ email: email, limit: 20 });
  if (existing && existing.data && existing.data.length > 0) return existing.data[0].id;
  return null;
}

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions();

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    return corsResponse({ error: 'stripe_not_configured' }, 500);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsResponse({ error: 'unauthorized' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const userResult = await supabase.auth.getUser();
    const user = userResult && userResult.data ? userResult.data.user : null;
    if (!user) {
      return corsResponse({ error: 'unauthorized' }, 401);
    }

    let body = {};
    try { body = await req.json(); } catch (parseErr) { body = {}; }
    const pmId = sanitizePaymentMethodId(body && body.payment_method_id);
    if (!pmId) {
      return corsResponse({ error: 'no_payment_method' }, 400);
    }
    const admin = getAdminClient();
    const allowed = await enforceRateLimit(admin, user.id, 'set_default_payment_method', 60, 10);
    if (!allowed) return corsResponse({ error: 'rate_limited' }, 429);

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' });
    const pm = await stripe.paymentMethods.retrieve(pmId);
    var customerId = pm && pm.customer ? String(pm.customer) : null;
    if (!customerId) customerId = await findCustomerId(stripe, user.email);
    if (!customerId) {
      return corsResponse({ error: 'no_customer' }, 404);
    }
    if (!pm || !pm.customer) {
      await stripe.paymentMethods.attach(pmId, { customer: customerId });
    }

    // Define o cartao padrao para faturas futuras do customer.
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: pmId },
    });

    // Aplica o mesmo cartao como padrao em todas as assinaturas ativas do customer.
    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
    let updated = 0;
    if (subs && subs.data) {
      for (let i = 0; i < subs.data.length; i++) {
        const sub = subs.data[i];
        if (ACTIVE_STATUSES.indexOf(sub.status) !== -1) {
          await stripe.subscriptions.update(sub.id, { default_payment_method: pmId });
          updated++;
        }
      }
    }

    // Invalida cache do get-payment-method pra refletir o novo cartao.
    await cacheDel(admin, 'stripe:get-payment-method:', user.id);

    return corsResponse({ ok: true, subscriptions_updated: updated });
  } catch (err) {
    return safeErrorResponse(err, 'set-default-payment-method');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  return withLogging('set-default-payment-method', async (req) => handler(req))(req);
});