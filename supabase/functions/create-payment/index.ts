// Edge Function: create-payment
// Cobranca UNICA (nao recorrente) para o add-on de Personalizacao (white-label).
// Cria um PaymentIntent e devolve o client_secret para confirmar via Stripe Elements
// DENTRO do app, sem redirecionar. Preco inline em BRL (centavos).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sanitizeKind, getAdminClient, enforceRateLimit } from '../_shared/security.ts';
import { createStripeClient, findOrCreateCustomer, stripeErrorCode } from '../_shared/stripe.ts';
import { withLogging, corsResponse, handleOptions, Logger } from '../_shared/logger.ts';
import { safeErrorResponse } from '../_shared/responses.ts';

const WHITE_LABEL_PRICE = 49700;
const ADMIN_TEST_PRICE = 50;

async function activateWhiteLabel(admin: any, userId: string): Promise<void> {
  if (!admin || !userId) return;
  try { await admin.from('company_profiles').update({ white_label: true }).eq('user_id', userId); } catch {}
}

async function handler(req: Request, logger: Logger): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions();

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeKey) {
    logger.error('Stripe not configured');
    return corsResponse({ error: 'stripe_not_configured' }, 500);
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return corsResponse({ error: 'unauthorized' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const userResult = await supabase.auth.getUser();
    const user = userResult.data?.user;
    if (!user) return corsResponse({ error: 'unauthorized' }, 401);

    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }
    const kind = sanitizeKind(body?.kind);
    const confirmWhiteLabel = !!(body?.confirm_white_label);
    const useSavedCard = !!(body?.use_saved_card);
    if (!kind) return corsResponse({ error: 'invalid_kind' }, 400);

    const admin = getAdminClient();
    const allowed = await enforceRateLimit(admin, user.id, 'create_payment', 60, 6);
    if (!allowed) return corsResponse({ error: 'rate_limited' }, 429);

    // Admin check for test pricing
    const adminClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
    const isAdmin = roleData?.role === 'admin';

    const chargeAmount = isAdmin ? ADMIN_TEST_PRICE : WHITE_LABEL_PRICE;

    // Activation is only valid when Stripe confirms the exact PaymentIntent.
    if (confirmWhiteLabel) {
      const paymentIntentId = String(body?.payment_intent_id || '');
      if (!/^pi_[A-Za-z0-9]+$/.test(paymentIntentId)) {
        return corsResponse({ error: 'payment_intent_required' }, 400);
      }

      const stripe = createStripeClient({ secretKey: stripeKey });
      const customer = await findOrCreateCustomer(stripe, user.email, user.id);
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const customerId = typeof paymentIntent.customer === 'string'
        ? paymentIntent.customer
        : paymentIntent.customer?.id;
      const validPayment = paymentIntent.status === 'succeeded'
        && customerId === customer.id
        && paymentIntent.amount === chargeAmount
        && paymentIntent.currency === 'brl'
        && paymentIntent.metadata?.user_id === user.id
        && paymentIntent.metadata?.kind === 'white_label';

      if (!validPayment) return corsResponse({ error: 'payment_not_verified' }, 402);
      await admin.from('company_profiles').update({ white_label: true }).eq('user_id', user.id);
      return corsResponse({ status: 'activated' });
    }

    const stripe = createStripeClient({ secretKey: stripeKey });
    const customer = await findOrCreateCustomer(stripe, user.email, user.id);
    const customerId = customer.id;

    // Pay with saved card (off_session)
    if (useSavedCard) {
      const invoiceSettings = customer.invoice_settings || {};
      let defaultPm = invoiceSettings.default_payment_method || null;
      if (!defaultPm) {
        const list = await stripe.paymentMethods.list({ customer: customer.id, type: 'card', limit: 1 });
        if (list.data.length > 0) defaultPm = list.data[0].id;
      }
      if (!defaultPm) return corsResponse({ error: 'no_payment_method' }, 400);

      const pi = await stripe.paymentIntents.create({
        amount: chargeAmount,
        currency: 'brl',
        customer: customer.id,
        description: 'Financia - Personalizacao (white-label)',
        payment_method: defaultPm,
        off_session: true,
        confirm: true,
        metadata: { user_id: user.id, kind: 'white_label' },
      }).catch(async (confirmErr) => {
        const raw = confirmErr?.raw;
        const failedPi = raw?.payment_intent;
        if (failedPi) return failedPi;
        throw confirmErr;
      });

      if (pi.status === 'succeeded') {
        await admin.from('company_profiles').update({ white_label: true }).eq('user_id', user.id);
        return corsResponse({ status: 'paid' });
      }
      if (pi.client_secret && (pi.status === 'requires_action' || pi.status === 'requires_confirmation')) {
        return corsResponse({ clientSecret: pi.client_secret, paymentIntentId: pi.id, requiresAction: true });
      }
      return corsResponse({ error: stripeErrorCode(null, pi) }, 402);
    }

    // New payment intent for new card
    const paymentIntent = await stripe.paymentIntents.create({
      amount: chargeAmount,
      currency: 'brl',
      customer: customer.id,
      description: 'Financia - Personalizacao (white-label)',
      automatic_payment_methods: { enabled: true },
      metadata: { user_id: user.id, kind: 'white_label' },
    });

    if (!paymentIntent?.client_secret) return corsResponse({ error: 'no_client_secret' }, 500);

    return corsResponse({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    return safeErrorResponse(err, 'create-payment');
  }
}

Deno.serve(withLogging('create-payment', handler));
