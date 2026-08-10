// Shared Stripe utilities and helpers
// All Edge Functions should use these shared utilities

import Stripe from 'https://esm.sh/stripe@17.7.0?target=denonext';

const PLAN_PRICES = { pro: 4990, premium: 9990, white_label: 49700 };
const ADMIN_TEST_PRICE = 1;
const PLAN_RANK = { free: 0, pro: 1, premium: 2, white_label: 3 };
const ACTIVE_STATUSES = ['active', 'trialing', 'past_due', 'unpaid'];

const STRIPE_API_VERSION = '2025-01-27.acacia';

// Create Stripe client with consistent configuration
export function createStripeClient(): Stripe {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}

// Extract plan_id from subscription metadata
export function planOfSub(sub: Stripe.Subscription): string {
  const m = sub.metadata || {};
  if (m.plan_id === 'pro' || m.plan_id === 'premium' || m.plan_id === 'white_label') return m.plan_id;
  const item = sub.items?.data?.[0];
  const pm = item?.price?.metadata || {};
  if (pm.plan_id === 'pro' || pm.plan_id === 'premium' || pm.plan_id === 'white_label') return pm.plan_id;
  return 'pro';
}

// Find or create Stripe customer by email/userId
export async function findOrCreateCustomer(
  stripe: Stripe,
  email: string | undefined,
  userId: string
): Promise<Stripe.Customer> {
  if (email) {
    const existing = await stripe.customers.list({ email, limit: 20 });
    if (existing.data.length > 0) {
      for (const c of existing.data) {
        const m = c.metadata || {};
        if (m.user_id && String(m.user_id) === String(userId)) return c;
      }
      return existing.data[0];
    }
  }
  return stripe.customers.create({ email: email || undefined, metadata: { user_id: userId } });
}

// Find or create product for a plan
export async function findOrCreateProduct(stripe: Stripe, planId: string): Promise<string> {
  try {
    const found = await stripe.products.search({
      query: "active:'true' AND metadata['plan_id']:'" + planId + "'",
      limit: 1,
    });
    if (found.data.length > 0) return found.data[0].id;
  } catch {
    // Search API unavailable, fall through to create
  }
  const created = await stripe.products.create({
    name: 'Financia ' + planId,
    metadata: { plan_id: planId },
  });
  return created.id;
}

// Standard recurring price for a plan
export async function findOrCreatePrice(stripe: Stripe, planId: string): Promise<string> {
  const lookupKey = 'financia_' + planId + '_monthly';
  const found = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  if (found.data.length > 0) return found.data[0].id;
  
  const productId = await findOrCreateProduct(stripe, planId);
  const price = await stripe.prices.create({
    currency: 'brl',
    unit_amount: PLAN_PRICES[planId as keyof typeof PLAN_PRICES] || PLAN_PRICES.pro,
    recurring: { interval: 'month' },
    product: productId,
    lookup_key: lookupKey,
    metadata: { plan_id: planId },
  });
  return price.id;
}

// Custom price for client-specific pricing (discount)
export async function resolvePriceId(
  stripe: Stripe,
  planId: string,
  customCents: number | null | undefined,
  userId: string
): Promise<string> {
  if (customCents && customCents > 0) {
    const short = String(userId).replace(/-/g, '').slice(0, 12);
    const lookupKey = 'financia_' + planId + '_c' + customCents + '_' + short;
    const found = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
    if (found.data.length > 0) return found.data[0].id;
    
    const productId = await findOrCreateProduct(stripe, planId);
    const price = await stripe.prices.create({
      currency: 'brl',
      unit_amount: customCents,
      recurring: { interval: 'month' },
      product: productId,
      lookup_key: lookupKey,
      metadata: { plan_id: planId, custom_for: userId },
    });
    return price.id;
  }
  return findOrCreatePrice(stripe, planId);
}

// Monthly cents calculation for MRR
export function monthlyCentsOf(item: Stripe.SubscriptionItem): number {
  if (!item.price?.unit_amount) return 0;
  const qty = item.quantity || 1;
  const amount = item.price.unit_amount * qty;
  const rec = item.price.recurring || {};
  const interval = rec.interval || 'month';
  const count = rec.interval_count || 1;
  
  if (interval === 'year') return Math.round(amount / (12 * count));
  if (interval === 'week') return Math.round((amount * 52) / (12 * count));
  if (interval === 'day') return Math.round((amount * 365) / (12 * count));
  return Math.round(amount / count);
}

// Stripe error code extraction
export function stripeErrorCode(err: unknown, paymentIntent?: Stripe.PaymentIntent): string {
  const raw = err && (err as any).raw ? (err as any).raw : null;
  const piErr = paymentIntent?.last_payment_error;
  const keys = [
    raw?.decline_code,
    raw?.code,
    piErr?.decline_code,
    piErr?.code,
  ];
  for (const k of keys) if (k) return String(k);
  return 'payment_failed';
}

// Format BRL cents to currency string
export function brlFromCents(cents: unknown): string {
  const n = Number(cents || 0);
  const v = Number.isFinite(n) ? n / 100 : 0;
  return 'R$ ' + v.toFixed(2).replace('.', ',');
}

// Rate limit helper
export async function checkRateLimit(
  admin: any,
  userId: string | null,
  action: string,
  windowSeconds: number,
  maxRequests: number
): Promise<boolean> {
  if (!admin) return false;
  try {
    const key = 'rl:' + action + ':' + (userId || 'anon');
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
    let q = admin.from('ai_cache')
      .select('id', { count: 'exact', head: true })
      .eq('scope', 'rate_limit')
      .eq('cache_key', key)
      .gt('created_at', since);
    if (userId) q = q.eq('user_id', userId);
    const res = await q;
    const count = res.count || 0;
    if (count >= maxRequests) return false;
    await admin.from('ai_cache').insert({
      scope: 'rate_limit',
      cache_key: key,
      user_id: userId,
      action,
      status: 200,
      expires_at: new Date(Date.now() + windowSeconds * 1000).toISOString(),
    });
    return true;
  } catch {
    return false; // Fail closed
  }
}

export { PLAN_PRICES, ADMIN_TEST_PRICE, PLAN_RANK, ACTIVE_STATUSES, STRIPE_API_VERSION };
