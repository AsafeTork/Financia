// Edge Function: health
// Health check endpoint for monitoring and load balancer probes.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsResponse, handleHealthCheck, withLogging, Logger } from '../_shared/logger.ts';

const HEALTH_CHECK_VERSION = Deno.env.get('APP_VERSION') || '1.0.0';

async function checkDatabase(supabaseUrl: string, serviceKey: string): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { error } = await supabase.from('company_profiles').select('user_id').limit(1);
    return !error;
  } catch (_) {
    return false;
  }
}

async function checkStripe(): Promise<boolean> {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return false;
    const Stripe = (await import('https://esm.sh/stripe@17.7.0?target=denonext')).default;
    const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' });
    // Simple ping - list 1 customer to verify connectivity
    await stripe.customers.list({ limit: 1 });
    return true;
  } catch (_) {
    return false;
  }
}

async function checkSupabase(supabaseUrl: string, anonKey: string): Promise<boolean> {
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, anonKey);
    const { error } = await supabase.auth.getSession();
    return !error;
  } catch (_) {
    return false;
  }
}

async function handler(req: Request, logger: Logger): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceKey) {
    logger.error('Health check: missing environment variables');
    return corsResponse({ status: 'unhealthy', error: 'not_configured' }, 503);
  }

  return handleHealthCheck('health', async () => {
    const [database, stripe, supabase] = await Promise.all([
      checkDatabase(supabaseUrl, serviceKey),
      checkStripe(),
      checkSupabase(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') || ''),
    ]);

    return { database, stripe, supabase };
  });
}

Deno.serve(withLogging('health', handler));