// Edge Function: cancel-subscription
// Agenda o cancelamento da assinatura ativa no fim do periodo ja pago (o usuario
// mantem o plano ate la e depois volta para Grátis via webhook). Idempotente.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAdminClient, enforceRateLimit } from '../_shared/security.ts';
import { createStripeClient, findOrCreateCustomer, getActiveSubscription, ACTIVE_STATUSES } from '../_shared/stripe.ts';
import { withLogging, corsResponse, handleOptions, Logger } from '../_shared/logger.ts';
import { safeErrorResponse } from '../_shared/responses.ts';

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'];

async function findCustomer(stripe: any, email: string, userId: string) {
  if (!email) return null;
  const existing = await stripe.customers.list({ email, limit: 20 });
  if (existing.data.length > 0) {
    for (const c of existing.data) {
      const m = c.metadata || {};
      if (m.user_id && String(m.user_id) === String(userId)) return c;
    }
    return existing.data[0];
  }
  return null;
}

function activeSubscriptionOf(subs: any) {
  if (!subs?.data) return null;
  for (const s of subs.data) {
    if (ACTIVE_STATUSES.includes(s.status)) return s;
  }
  return null;
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

    const admin = getAdminClient();
    const allowed = await enforceRateLimit(admin, user.id, 'cancel_subscription', 60, 4);
    if (!allowed) return corsResponse({ error: 'rate_limited' }, 429);

    const stripe = createStripeClient({ secretKey: Deno.env.get('STRIPE_SECRET_KEY')! });
    const customer = await findOrCreateCustomer(stripe, user.email, user.id);
    if (!customer) return corsResponse({ ok: true, status: 'no_subscription' });

    const subs = await stripe.subscriptions.list({ customer: customer.id, status: 'all', limit: 20 });
    const activeSub = getActiveSubscription(subs);
    if (!activeSub) return corsResponse({ ok: true, status: 'no_subscription' });

    const updated = await stripe.subscriptions.update(activeSub.id, {
      cancel_at_period_end: true,
      metadata: { user_id: user.id },
    });

    // Immediately cancel if incomplete
    if (!['active', 'trialing'].includes(updated.status)) {
      const admin = getAdminClient();
      try {
        await admin.rpc('stripe_activate_plan', { p_user: user.id, p_plan: 'free', p_expires: null });
      } catch {}
    }

    if (user.email) {
      const { htmlFromText, sendSystemEmail } = await import('../_shared/mailer.ts');
      const cancelDate = new Date(Number(updated.current_period_end) * 1000).toLocaleDateString('pt-BR');
      const txt = 'Cancelamento agendado com sucesso.' + '\n\n' +
        'Sua assinatura continuará ativa até ' + cancelDate + '.' + '\n' +
        'Após essa data, sua conta voltará para o plano Grátis.';
      await sendSystemEmail({
        to: user.email,
        subject: 'Cancelamento agendado - Financia',
        text: txt,
        html: '<div style="font-family:Inter,Arial,sans-serif;white-space:pre-wrap;line-height:1.45;color:#0f172a">' + txt.replace(/\n/g, '<br>') + '</div>',
      });
    }

    return corsResponse({ ok: true, status: 'scheduled', cancel_at: updated.current_period_end });
  } catch (err) {
    return safeErrorResponse(err, 'cancel-subscription');
  }
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function corsResponse(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } });
}

function handleOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  return withLogging('cancel-subscription', async (req, logger) => handler(req, logger))(req);
});