// Edge Function: stripe-webhook
// Recebe eventos da Stripe e ativa/rebaixa o plano via RPC SECURITY DEFINER.
// A atualizacao do plano passa por set_client_plan (o trigger prevent_plan_change
// bloqueia UPDATE direto na company_profiles).
// Failed events are stored in stripe_webhook_dlq for replay/debugging.

import Stripe from 'https://esm.sh/stripe@17.7.0?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { htmlFromText, sendSystemEmail } from '../_shared/mailer.ts';
import { Logger, withLogging, corsResponse, handleOptions } from '../_shared/logger.ts';

function brlFromCents(cents: unknown): string {
  const n = Number(cents || 0);
  const v = Number.isFinite(n) ? (n / 100) : 0;
  return 'R$ ' + v.toFixed(2).replace('.', ',');
}

async function userEmailById(supabase: any, userId: string): Promise<string> {
  if (!userId) return '';
  try {
    const userRes = await supabase.auth.admin.getUserById(userId);
    const u = userRes && userRes.data ? userRes.data.user : null;
    return u && u.email ? String(u.email) : '';
  } catch (_) {
    return '';
  }
}

function planOfSubFromEvent(sub: any): string {
  const m = sub.metadata ? sub.metadata : {};
  if (m.plan_id === 'pro' || m.plan_id === 'premium' || m.plan_id === 'white_label') return m.plan_id;
  const item = sub.items && sub.items.data ? sub.items.data[0] : null;
  if (!item) return 'pro';
  const im = item.price && item.price.metadata ? item.price.metadata : {};
  if (im.plan_id === 'pro' || im.plan_id === 'premium' || im.plan_id === 'white_label') return im.plan_id;
  return 'pro';
}

async function recordDlqFailure(
  admin: any,
  eventId: string,
  eventType: string,
  payload: any,
  error: Error
): Promise<void> {
  try {
    await admin.rpc('record_webhook_failure', {
      p_event_id: eventId,
      p_event_type: eventType,
      p_payload: payload,
      p_error_message: error.message,
      p_error_stack: error.stack || '',
    });
  } catch (dlqErr) {
    console.error('Failed to record DLQ entry:', dlqErr);
  }
}

async function handler(req: Request, logger: Logger): Promise<Response> {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!stripeKey || !webhookSecret) {
    logger.error('Stripe not configured');
    return corsResponse({ error: 'stripe_not_configured' }, 500);
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' });

  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event = null;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, webhookSecret);
  } catch (verifyErr) {
    logger.warn('Invalid Stripe signature', { error: (verifyErr as Error).message });
    return corsResponse({ error: 'invalid_signature' }, 400);
  }

  logger.info('Stripe event received', { type: event.type, event_id: event.id });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, serviceKey);

    // Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const meta = session.metadata ? session.metadata : {};
      const userId = session.client_reference_id ? session.client_reference_id : meta.user_id;
      const planId = meta.plan_id ? meta.plan_id : 'pro';

      let expires = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
      if (session.subscription) {
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          if (sub && sub.current_period_end) {
            expires = new Date(Number(sub.current_period_end) * 1000).toISOString();
          }
        } catch (_) {}
      }

      if (userId) {
        logger.info('Activating plan from checkout', { user_id: userId, plan_id: planId });
        await supabase.rpc('set_client_plan', {
          p_target: userId,
          p_plan: planId,
          p_actor: 'stripe_webhook',
          p_expires_at: expires,
        });
        const to = await userEmailById(supabase, String(userId));
        if (to) {
          const txt =
            'Pagamento confirmado.' + '\n\n' +
            'Seu plano foi ativado com sucesso no Financia.' + '\n' +
            'Plano: ' + String(planId || 'pro') + '\n\n' +
            'Obrigado por assinar!';
          await sendSystemEmail({
            to: to,
            subject: 'Pagamento confirmado - Financia',
            text: txt,
            html: htmlFromText(txt),
          });
        }
      }
    }
    // Handle invoice.payment_succeeded
    else if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object;
      const subId = invoice.subscription ? invoice.subscription : null;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        const m = sub.metadata ? sub.metadata : {};
        let userId = m.user_id ? m.user_id : null;
        if (!userId) {
          const item = sub.items && sub.items.data ? sub.items.data[0] : null;
          const pm = item && item.price && item.price.metadata ? item.price.metadata : {};
          userId = pm.custom_for || pm.user_id || null;
        }
        const planId = m.plan_id ? m.plan_id : planOfSubFromEvent(sub);
        if (userId) {
          const expires = sub.current_period_end
            ? new Date(Number(sub.current_period_end) * 1000).toISOString()
            : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
          logger.info('Activating plan from invoice', { user_id: userId, plan_id: planId });
          await supabase.rpc('set_client_plan', {
            p_target: userId,
            p_plan: planId,
            p_actor: 'stripe_webhook',
            p_expires_at: expires,
          });
          const to = await userEmailById(supabase, String(userId));
          if (to) {
            const txt =
              'Cobrança confirmada com sucesso.' + '\n\n' +
              'Plano: ' + String(planId || 'pro') + '\n' +
              'Valor: ' + brlFromCents(invoice.amount_paid) + '\n' +
              'Fatura: ' + String(invoice.number || invoice.id || '') + '\n\n' +
              'Seu acesso continua ativo.';
            await sendSystemEmail({
              to: to,
              subject: 'Cobrança confirmada - Financia',
              text: txt,
              html: htmlFromText(txt),
            });
          }
        }
      }
    }
    // Handle invoice.payment_failed
    else if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const subId = invoice.subscription ? String(invoice.subscription) : '';
      let userId = '';
      let planId = 'pro';
      if (subId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subId);
          const m = sub && sub.metadata ? sub.metadata : {};
          userId = m.user_id ? String(m.user_id) : '';
          planId = m.plan_id ? String(m.plan_id) : 'pro';
        } catch (_) {}
      }
      const to = userId ? await userEmailById(supabase, userId) : '';
      if (to) {
        const txt =
          'Não conseguimos confirmar a cobrança da sua assinatura.' + '\n\n' +
          'Plano: ' + String(planId || 'pro') + '\n' +
          'Valor pendente: ' + brlFromCents(invoice.amount_due) + '\n' +
          'Fatura: ' + String(invoice.number || invoice.id || '') + '\n\n' +
          'Atualize o cartão em Configurações > Assinatura para evitar interrupção.';
        await sendSystemEmail({
          to: to,
          subject: 'Falha na cobrança - Financia',
          text: txt,
          html: htmlFromText(txt),
        });
      }
    }
    // Handle invoice.upcoming
    else if (event.type === 'invoice.upcoming') {
      const invoice = event.data.object;
      const subId = invoice.subscription ? String(invoice.subscription) : '';
      let userId = '';
      let planId = 'pro';
      if (subId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subId);
          const m = sub && sub.metadata ? sub.metadata : {};
          userId = m.user_id ? String(m.user_id) : '';
          planId = m.plan_id ? String(m.plan_id) : 'pro';
        } catch (_) {}
      }
      const to = userId ? await userEmailById(supabase, userId) : '';
      if (to) {
        const dueDate = invoice.next_payment_attempt
          ? new Date(Number(invoice.next_payment_attempt) * 1000).toLocaleDateString('pt-BR')
          : 'em breve';
        const txt =
          'Lembrete de cobrança da sua assinatura.' + '\n\n' +
          'Plano: ' + String(planId || 'pro') + '\n' +
          'Próxima cobrança: ' + brlFromCents(invoice.amount_due) + '\n' +
          'Data prevista: ' + dueDate + '\n\n' +
          'Se precisar, atualize o cartão em Configurações > Assinatura.';
        await sendSystemEmail({
          to: to,
          subject: 'Lembrete de cobrança - Financia',
          text: txt,
          html: htmlFromText(txt),
        });
      }
    }
    // Handle payment_intent.succeeded (white-label one-time)
    else if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const pm = pi.metadata ? pi.metadata : {};
      if (pm.kind === 'white_label' && pm.user_id) {
        logger.info('White-label payment succeeded', { user_id: pm.user_id });
        await supabase.rpc('set_white_label', { p_user: pm.user_id, p_on: true });
        const to = await userEmailById(supabase, String(pm.user_id));
        if (to) {
          const txt =
            'Pedido de personalização confirmado.' + '\n\n' +
            'Recebemos seu pagamento e iniciaremos a preparação do app personalizado.' + '\n\n' +
            'Você pode ajustar nome, logo e cores em Configurações > Aparência.';
          await sendSystemEmail({
            to: to,
            subject: 'Personalização confirmada - Financia',
            text: txt,
            html: htmlFromText(txt),
          });
        }
      }
    }
    // Handle customer.subscription.updated
    else if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object;
      const subMeta = sub.metadata ? sub.metadata : {};
      let userId = subMeta.user_id ? subMeta.user_id : null;
      if (!userId) {
        const item = sub.items && sub.items.data ? sub.items.data[0] : null;
        const pm = item && item.price && item.price.metadata ? item.price.metadata : {};
        const fallbackId = pm.user_id || pm.custom_for || null;
        if (!fallbackId) return corsResponse({ received: true, note: 'no_user_id' });
        userId = fallbackId;
      }
      const targetUserId = userId;
      const status = sub.status;
      const planFromSub = planOfSubFromEvent(sub);
      const cancelAtPeriodEnd = sub.cancel_at_period_end || false;
      const currentPeriodEnd = sub.current_period_end
        ? new Date(Number(sub.current_period_end) * 1000).toISOString()
        : null;

      if (status !== 'active' && status !== 'trialing') {
        if (status === 'incomplete_expired') {
          await supabase.rpc('set_client_plan', {
            p_target: targetUserId,
            p_plan: 'free',
            p_actor: 'stripe_webhook',
            p_expires_at: null,
          });
        }
        return corsResponse({ received: true, note: 'non_active' });
      }

      if (targetUserId && planFromSub) {
        logger.info('Subscription updated', { user_id: targetUserId, plan: planFromSub, status });
        await supabase.rpc('set_client_plan', {
          p_target: targetUserId,
          p_plan: planFromSub,
          p_actor: 'stripe_webhook',
          p_expires_at: currentPeriodEnd,
        });

        if (cancelAtPeriodEnd) {
          const to = await userEmailById(supabase, String(targetUserId));
          if (to) {
            const dateStr = currentPeriodEnd
              ? new Date(currentPeriodEnd).toLocaleDateString('pt-BR')
              : 'em breve';
            const txt =
              'Lembrete: sua assinatura foi agendada para cancelamento.' + '\n\n' +
              'Você mantém o acesso até ' + dateStr + '.\n' +
              'Depois dessa data, sua conta voltará para o plano Grátis.' + '\n\n' +
              'Se quiser reativar, acesse a aba de Assinatura no app.';
            await sendSystemEmail({
              to: to,
              subject: 'Cancelamento agendado - Financia',
              text: txt,
              html: htmlFromText(txt),
            });
          }
        }
      }
    }
    // Handle customer.subscription.deleted
    else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const subMeta = sub.metadata ? sub.metadata : {};
      const userIdSubDel = subMeta.user_id ? subMeta.user_id : null;
      if (userIdSubDel) {
        logger.info('Subscription deleted, reverting to free', { user_id: userIdSubDel });
        await supabase.rpc('set_client_plan', {
          p_target: userIdSubDel,
          p_plan: 'free',
          p_actor: 'stripe_webhook',
          p_expires_at: null,
        });
        const to = await userEmailById(supabase, String(userIdSubDel));
        if (to) {
          const txt =
            'Sua assinatura foi encerrada e sua conta voltou para o plano Grátis.' + '\n\n' +
            'Se quiser reativar um plano pago, acesse a aba de Assinatura.';
          await sendSystemEmail({
            to: to,
            subject: 'Assinatura encerrada - Financia',
            text: txt,
            html: htmlFromText(txt),
          });
        }
      }
    }

    logger.info('Event processed successfully', { type: event.type });
    return corsResponse({ received: true });
  } catch (err) {
    logger.error('Error processing Stripe event', err as Error, { type: event?.type });
    // Record failure in DLQ
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    await recordDlqFailure(admin, event?.id || 'unknown', event?.type || 'unknown', event || {}, err as Error);
    // Always return 200 to Stripe to avoid retries for unhandled errors
    return corsResponse({ received: true });
  }
}

Deno.serve(withLogging('stripe-webhook', handler));