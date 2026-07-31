// Edge Function: stripe-config
// Devolve a chave PUBLICAVEL do Stripe (pk_...) lida do secret do Supabase.
// pk_ e publica por design (segura no front) — isso evita ter que setar a chave
// no Render: tudo do Stripe fica como secret no Supabase.
import { withLogging, corsResponse, handleOptions } from '../_shared/logger.ts';
import { safeErrorResponse } from '../_shared/responses.ts';

async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return handleOptions();
  
  const key = Deno.env.get('STRIPE_PUBLISHABLE_KEY') || Deno.env.get('STRIPE_PUBLIC_KEY') || '';
  return corsResponse({ publishableKey: key });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return handleOptions();
  return withLogging('stripe-config', async (req) => handler(req))(req);
});