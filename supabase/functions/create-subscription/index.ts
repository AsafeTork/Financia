// Edge Function: create-subscription
// Gerencia a assinatura mensal do usuario de forma COMPLETA e idempotente:
//  - Sem assinatura ativa + sem cartao salvo  -> cria default_incomplete e devolve
//    clientSecret para confirmar via PaymentElement (cartao novo no app).
//  - Sem assinatura ativa + use_saved_card     -> cria com o cartao padrao salvo e
//    confirma off_session; devolve {status:'active'} ou {clientSecret,requiresAction}.
//  - JA tem assinatura ativa (upgrade/downgrade) -> ALTERA o item existente (nao cria
//    outra), com proration; devolve {status:'changed'}. Evita cobranca duplicada.
// Precos via Price com lookup_key estavel (financia_<plan>_monthly).

import Stripe from 'https://esm.sh/stripe@17.7.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { enforceRateLimit, getAdminClient, sanitizeCheckoutRequestId, sanitizePlanId } from '../_shared/security.ts';
import { withLogging, corsResponse, handleOptions, Logger } from '../_shared/logger.ts';
import { createStripeClient, findOrCreateCustomer, findOrCreatePrice, resolvePriceId, planOfSub, monthlyCentsOf, PLAN_PRICES, ADMIN_TEST_PRICE, PLAN_RANK, ACTIVE_STATUSES } from '../_shared/stripe.ts';
import { safeErrorResponse } from '../_shared/responses.ts';

async function isAdminUser(admin: any, userId: string): Promise<boolean> {
  if (!admin || !userId) return false;
  try {
    const roleRes = await admin.from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();
    return !!(roleRes && roleRes.data && roleRes.data.role === 'admin');
  } catch (_) {
    return false;
  }
}

async function activatePlan(admin: any, userId: string, planId: string, expiresAt: string | null): Promise<void> {
  if (!admin) return;
  try {
    await admin.rpc('set_client_plan', {
      p_target: userId,
      p_plan: planId,
      p_actor: 'create_subscription',
      p_expires_at: expiresAt,
    });
  } catch (_) {}
}

function activeSubscriptionOf(subs: Stripe.SubscriptionList): Stripe.Subscription | null {
  if (!subs || !subs.data) return null;
  for (let i = 0; i < subs.data.length; i++) {
    if (ACTIVE_STATUSES.indexOf(subs.data[i].status) !== -1) return subs.data[i];
  }
  return null;
}

async function handler(req: Request, logger: Logger): Promise<Response> {
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
    const user = userResult?.data?.user;
    if (!user) return corsResponse({ error: 'unauthorized' }, 401);

    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { body = {}; }
    const planId = sanitizePlanId(body?.plan_id);
    const requestId = sanitizeCheckoutRequestId(body?.request_id);
    const useSavedCard = !!(body && body.use_saved_card);
    if (!planId) return corsResponse({ error: 'invalid_plan' }, 400);

    const admin = getAdminClient();
    const stripe = createStripeClient({ secretKey: stripeKey });
    const customer = await findOrCreateCustomer(stripe, user.email || undefined, user.id);
    const customerId = customer.id;

    // Post-payment activation: frontend calls after confirmPayment / handleNextAction
    if (body && body.confirm_subscription) {
      const subsList = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
      const activeSub = activeSubscriptionOf(subsList);
      if (!activeSub) return corsResponse({ error: 'no_active_subscription' }, 400);
      const subPlanId = planOfSub(activeSub);
      await activatePlan(admin, user.id, subPlanId, new Date(Number(activeSub.current_period_end) * 1000).toISOString());
      return corsResponse({ status: 'activated' });
    }

    const allowed = await enforceRateLimit(admin, user.id, 'create_subscription', 60, 8);
    if (!allowed) return corsResponse({ error: 'rate_limited' }, 429);
    const isAdmin = await isAdminUser(admin, user.id);

    // Custom price (admin discount) per plan
    let customCents = 0;
    try {
      const prof = await supabase
        .from('company_profiles')
        .select('custom_prices')
        .eq('user_id', user.id)
        .maybeSingle();
      if (prof && prof.data && prof.data.custom_prices) {
        const prices = prof.data.custom_prices as Record<string, number | null>;
        if (prices[planId]) customCents = prices[planId] || 0;
      }
    } catch (_) {
      customCents = 0;
    }
    if (isAdmin) customCents = ADMIN_TEST_PRICE;

    const priceId = await resolvePriceId(stripe, planId, customCents, user.id);

    // 1) Already has active subscription? Then CHANGE plan (upgrade/downgrade), no duplicate.
    const subsList = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
    const activeSub = activeSubscriptionOf(subsList);
    if (activeSub) {
      const item = activeSub.items?.data?.[0];
      if (!item) return corsResponse({ error: 'subscription_without_item' }, 500);
      // Already on same price? Nothing to do.
      if (item.price && item.price.id === priceId) {
        await activatePlan(admin, user.id, planId, new Date(Number(activeSub.current_period_end) * 1000).toISOString());
        return corsResponse({ status: 'unchanged' });
      }
      // Upgrade: charge proration NOW and activate bigger plan (webhook handles final).
      // Downgrade: NO proration charge; cheaper plan takes effect at next cycle.
      const currentPlanId = planOfSub(activeSub);
      const isDowngrade = PLAN_RANK[planId] < PLAN_RANK[currentPlanId];
      await stripe.subscriptions.update(activeSub.id, {
        items: [{ id: item.id, price: priceId }],
        proration_behavior: isDowngrade ? 'none' : 'always_invoice',
        metadata: { user_id: user.id, plan_id: planId },
       }, requestId ? { idempotencyKey: 'subscription:' + user.id + ':' + requestId } : undefined);
      if (!isDowngrade) {
        await activatePlan(admin, user.id, planId, new Date(Number(activeSub.current_period_end) * 1000).toISOString());
      }
      return corsResponse({ status: 'changed', scheduled: isDowngrade });
    }

    // 2) No subscription: pay with saved card (off_session) if requested.
    if (useSavedCard) {
      const invoiceSettings = customer.invoice_settings || {};
      let defaultPm = invoiceSettings.default_payment_method || null;
      if (!defaultPm) {
        const list = await stripe.paymentMethods.list({ customer: customer.id, type: 'card', limit: 1 });
        if (list.data.length > 0) defaultPm = list.data[0].id;
      }
      if (!defaultPm) return corsResponse({ error: 'no_payment_method' }, 400);
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        default_payment_method: defaultPm,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: { user_id: user.id, plan_id: planId },
      });
      const invoice = subscription.latest_invoice as Stripe.Invoice | null;
      const pi = invoice?.payment_intent as Stripe.PaymentIntent | null;
      if (!pi) return corsResponse({ error: 'no_client_secret' }, 500);
      if (pi.status === 'succeeded') {
        await activatePlan(admin, user.id, planId, new Date(Number(subscription.current_period_end) * 1000).toISOString());
        return corsResponse({ status: 'active' });
      }
      try {
        const confirmed = await stripe.paymentIntents.confirm(pi.id, { off_session: true });
        if (confirmed.status === 'succeeded') {
          await activatePlan(admin, user.id, planId, new Date(Number(subscription.current_period_end) * 1000).toISOString());
          return corsResponse({ status: 'active' });
        }
        if (confirmed.client_secret) {
          return corsResponse({ clientSecret: confirmed.client_secret, requiresAction: true });
        }
        return corsResponse({ error: stripeErrorCode(null, confirmed) }, 402);
      } catch (confirmErr) {
        const raw = confirmErr && (confirmErr as any).raw ? (confirmErr as any).raw : null;
        const failedPi = raw?.payment_intent;
        if (failedPi && failedPi.client_secret) {
          return corsResponse({ clientSecret: failedPi.client_secret, requiresAction: true });
        }
        return corsResponse({ error: stripeErrorCode(confirmErr, failedPi) }, 402);
      }
    }

    // 3) No subscription and new card: return clientSecret for PaymentElement.
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: { user_id: user.id, plan_id: planId },
    }, requestId ? { idempotencyKey: 'subscription:' + user.id + ':' + requestId } : undefined);
    const invoice = subscription.latest_invoice as Stripe.Invoice | null;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent | null;

    // Payment already processed automatically (e.g. saved card auto-collect).
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      await activatePlan(admin, user.id, planId, new Date(Number(subscription.current_period_end) * 1000).toISOString());
      return corsResponse({ status: 'active' });
    }

    if (!paymentIntent || !paymentIntent.client_secret) {
      return corsResponse({ error: 'no_client_secret' }, 500);
    }
    return corsResponse({
      clientSecret: paymentIntent.client_secret,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    return safeErrorResponse(err, 'create-subscription');
  }
}

Deno.serve(withLogging('create-subscription', handler));
