// Edge Function: create-setup-intent
// Cria um SetupIntent para o cliente atualizar/adicionar o cartao DENTRO do app
// (Stripe Elements / PaymentElement em modo setup), sem redirect e sem cobranca.
// O cliente Stripe e resolvido por email (mesmo padrao de create-subscription).
import Stripe from 'https://esm.sh/stripe@17.7.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { enforceRateLimit, getAdminClient } from '../_shared/security.ts';
import { withLogging, corsResponse, handleOptions } from '../_shared/logger.ts';
import { safeErrorResponse } from '../_shared/responses.ts';

async function findOrCreateCustomer(stripe, email, userId) {
  if (email) {
    const existing = await stripe.customers.list({ email: email, limit: 1 });
    if (existing && existing.data && existing.data.length > 0) return existing.data[0].id;
  }
  const created = await stripe.customers.create({ email: email || undefined, metadata: { user_id: userId } });
  return created.id;
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
    const admin = getAdminClient();
    const allowed = await enforceRateLimit(admin, user.id, 'create_setup_intent', 60, 8);
    if (!allowed) return corsResponse({ error: 'rate_limited' }, 429);

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' });
    const customerId = await findOrCreateCustomer(stripe, user.email, user.id);

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      automatic_payment_methods: { enabled: true },
      metadata: { user_id: user.id },
    });

    if (!setupIntent || !setupIntent.client_secret) {
      return corsResponse({ error: 'no_setup_secret' }, 500);
    }

    return corsResponse({ clientSecret: setupIntent.client_secret });
  } catch (err) {
    return safeErrorResponse(err, 'create-setup-intent');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  return withLogging('create-setup-intent', async (req) => handler(req))(req);
});