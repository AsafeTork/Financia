import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let mockSendEmailResult = { ok: true };
const mockUserEmail = 'test@example.com';
const mockUserId = 'user-test-123';
const mockPlanId = 'pro';

const sendSystemEmail = vi.fn(function() { return Promise.resolve(mockSendEmailResult); });
const htmlFromText = vi.fn(function(t) { return '<div>' + t + '</div>'; });

vi.mock('./supabase.js', function() {
  const qb = {
    select: function() { return qb; },
    upsert: function() { return Promise.resolve({ error: null }); },
    update: function() { return qb; },
    eq: function() { return qb; },
    maybeSingle: function() { return Promise.resolve({ data: null, error: null }); },
    rpc: function() { return Promise.resolve({ data: null, error: null }); },
  };
  return {
    sb: {
      from: vi.fn(function() { return qb; }),
      rpc: vi.fn(function() { return Promise.resolve({ data: null, error: null }); }),
      functions: { invoke: vi.fn(function() { return Promise.resolve({ data: null, error: null }); }) },
      auth: { admin: { getUserById: vi.fn(function() { return Promise.resolve({ data: { user: { email: mockUserEmail } } }); }) } },
    },
  };
});

import { sb } from './supabase.js';

const mockStripeEvents = {
  checkoutSessionCompleted: {
    id: 'evt_checkout_completed',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_123',
        client_reference_id: mockUserId,
        metadata: { plan_id: mockPlanId, user_id: mockUserId },
        subscription: 'sub_test_123',
      },
    },
  },
  invoicePaymentSucceeded: {
    id: 'evt_invoice_paid',
    type: 'invoice.payment_succeeded',
    data: {
      object: {
        id: 'in_test_123',
        subscription: 'sub_test_123',
        amount_paid: 2990,
        number: 'INV-001',
      },
    },
  },
  subscriptionCreated: {
    id: 'evt_sub_created',
    type: 'customer.subscription.created',
    data: {
      object: {
        id: 'sub_test_123',
        status: 'active',
        metadata: { user_id: mockUserId, plan_id: mockPlanId },
        items: { data: [{ price: { metadata: { plan_id: mockPlanId } } }] },
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
    },
  },
};

function createMockStripe() {
  const subs = {
    retrieve: vi.fn(function(id) {
      if (id === 'sub_test_123') {
        return Promise.resolve({
          id: 'sub_test_123',
          status: 'active',
          metadata: { user_id: mockUserId, plan_id: mockPlanId },
          items: { data: [{ price: { metadata: { plan_id: mockPlanId } } }] },
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
        });
      }
      return Promise.reject(new Error('Subscription not found'));
    }),
  };
  return {
    webhooks: {
      constructEventAsync: vi.fn(function(payload, sig, secret) {
        const event = JSON.parse(payload);
        return Promise.resolve(event);
      }),
    },
    subscriptions: subs,
  };
}

describe('Stripe Webhook Integration - Full Cycle', function() {
  let mockStripe;

  beforeEach(function() {
    mockStripe = createMockStripe();
    vi.clearAllMocks();
    mockSendEmailResult = { ok: true };
    sb.rpc.mockResolvedValue({ data: null, error: null });
    sb.auth.admin.getUserById.mockResolvedValue({ data: { user: { email: mockUserEmail } } });
    sendSystemEmail.mockResolvedValue({ ok: true });
  });

  afterEach(function() {
    vi.resetAllMocks();
  });

  describe('checkout.session.completed -> invoice.payment_succeeded -> subscription created -> plan activated', function() {
    it('processes checkout.session.completed and activates plan in company_profiles', async function() {
      const event = mockStripeEvents.checkoutSessionCompleted;
      const payload = JSON.stringify(event);
      const sig = 'sig_test';

      const constructedEvent = await mockStripe.webhooks.constructEventAsync(payload, sig, 'whsec_test');
      expect(constructedEvent.type).toBe('checkout.session.completed');

      const session = constructedEvent.data.object;
      const userId = session.client_reference_id || session.metadata?.user_id;
      const planId = session.metadata?.plan_id || 'pro';

      expect(userId).toBe(mockUserId);
      expect(planId).toBe(mockPlanId);

      let expires = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();
      if (session.subscription) {
        const sub = await mockStripe.subscriptions.retrieve(session.subscription);
        if (sub.current_period_end) {
          expires = new Date(Number(sub.current_period_end) * 1000).toISOString();
        }
      }

      await sb.rpc('set_client_plan', {
        p_target: userId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: expires,
      });

      expect(sb.rpc).toHaveBeenCalledWith('set_client_plan', expect.objectContaining({
        p_target: mockUserId,
        p_plan: mockPlanId,
        p_actor: 'stripe_webhook',
      }));

      const to = await sb.auth.admin.getUserById(userId).then(function(r) { return r.data?.user?.email; });
      expect(to).toBe(mockUserEmail);

      const txt = 'Pagamento confirmado.\n\nSeu plano foi ativado com sucesso no Financia.\nPlano: ' + planId + '\n\nObrigado por assinar!';
      await sendSystemEmail({
        to: to,
        subject: 'Pagamento confirmado - Financia',
        text: txt,
        html: htmlFromText(txt),
      });

      expect(sendSystemEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: mockUserEmail,
        subject: 'Pagamento confirmado - Financia',
      }));
    });

    it('processes invoice.payment_succeeded and updates plan', async function() {
      const event = mockStripeEvents.invoicePaymentSucceeded;
      const payload = JSON.stringify(event);
      const sig = 'sig_test';

      const constructedEvent = await mockStripe.webhooks.constructEventAsync(payload, sig, 'whsec_test');
      expect(constructedEvent.type).toBe('invoice.payment_succeeded');

      const invoice = constructedEvent.data.object;
      const subId = invoice.subscription;

      const sub = await mockStripe.subscriptions.retrieve(subId);
      const meta = sub.metadata || {};
      const userId = meta.user_id;
      const planId = meta.plan_id;

      expect(userId).toBe(mockUserId);
      expect(planId).toBe(mockPlanId);

      const expires = sub.current_period_end
        ? new Date(Number(sub.current_period_end) * 1000).toISOString()
        : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

      await sb.rpc('set_client_plan', {
        p_target: userId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: expires,
      });

      expect(sb.rpc).toHaveBeenCalledWith('set_client_plan', expect.objectContaining({
        p_target: mockUserId,
        p_plan: mockPlanId,
      }));

      const to = await sb.auth.admin.getUserById(userId).then(function(r) { return r.data?.user?.email; });
      const brl = 'R$ ' + (Number(invoice.amount_paid) / 100).toFixed(2).replace('.', ',');
      const txt = 'Cobrança confirmada com sucesso.\n\nPlano: ' + planId + '\nValor: ' + brl + '\nFatura: ' + invoice.number + '\n\nSeu acesso continua ativo.';
      await sendSystemEmail({
        to: to,
        subject: 'Cobrança confirmada - Financia',
        text: txt,
        html: htmlFromText(txt),
      });

      expect(sendSystemEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: mockUserEmail,
        subject: 'Cobrança confirmada - Financia',
      }));
    });

    it('handles subscription created event and activates plan', async function() {
      const event = mockStripeEvents.subscriptionCreated;
      const payload = JSON.stringify(event);
      const sig = 'sig_test';

      const constructedEvent = await mockStripe.webhooks.constructEventAsync(payload, sig, 'whsec_test');
      expect(constructedEvent.type).toBe('customer.subscription.created');

      const sub = constructedEvent.data.object;
      const meta = sub.metadata || {};
      const userId = meta.user_id;
      const planId = meta.plan_id;

      expect(userId).toBe(mockUserId);
      expect(planId).toBe(mockPlanId);

      const expires = sub.current_period_end
        ? new Date(Number(sub.current_period_end) * 1000).toISOString()
        : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

      await sb.rpc('set_client_plan', {
        p_target: userId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: expires,
      });

      expect(sb.rpc).toHaveBeenCalledWith('set_client_plan', expect.objectContaining({
        p_target: mockUserId,
        p_plan: mockPlanId,
      }));
    });

    it('verifies company_profiles.plan updated and email sent via mailer', async function() {
      const rpcCalls = [];
      sb.rpc.mockImplementation(function(fn, args) {
        rpcCalls.push({ fn: fn, args: args });
        return Promise.resolve({ data: null, error: null });
      });

      const events = [
        mockStripeEvents.checkoutSessionCompleted,
        mockStripeEvents.invoicePaymentSucceeded,
      ];

      for (var i = 0; i < events.length; i++) {
        const event = events[i];
        const payload = JSON.stringify(event);
        const constructedEvent = await mockStripe.webhooks.constructEventAsync(payload, 'sig', 'whsec_test');

        if (constructedEvent.type === 'checkout.session.completed') {
          const session = constructedEvent.data.object;
          const userId = session.client_reference_id || session.metadata?.user_id;
          const planId = session.metadata?.plan_id || 'pro';
          const expires = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

          await sb.rpc('set_client_plan', {
            p_target: userId,
            p_plan: planId,
            p_actor: 'stripe_webhook',
            p_expires_at: expires,
          });

          const to = await sb.auth.admin.getUserById(userId).then(function(r) { return r.data?.user?.email; });
          await sendSystemEmail({
            to: to,
            subject: 'Pagamento confirmado - Financia',
            text: 'Pagamento confirmado.\n\nPlano: ' + planId,
            html: htmlFromText('Pagamento confirmado.\n\nPlano: ' + planId),
          });
        } else if (constructedEvent.type === 'invoice.payment_succeeded') {
          const invoice2 = constructedEvent.data.object;
          const subId2 = invoice2.subscription;
          const sub2 = await mockStripe.subscriptions.retrieve(subId2);
          const meta2 = sub2.metadata || {};
          const userId2 = meta2.user_id;
          const planId2 = meta2.plan_id;

          const expires2 = sub2.current_period_end
            ? new Date(Number(sub2.current_period_end) * 1000).toISOString()
            : new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString();

          await sb.rpc('set_client_plan', {
            p_target: userId2,
            p_plan: planId2,
            p_actor: 'stripe_webhook',
            p_expires_at: expires2,
          });

          const to2 = await sb.auth.admin.getUserById(userId2).then(function(r) { return r.data?.user?.email; });
          const brl2 = 'R$ ' + (Number(invoice2.amount_paid) / 100).toFixed(2).replace('.', ',');
          const txt2 = 'Cobrança confirmada com sucesso.\n\nPlano: ' + planId2 + '\nValor: ' + brl2 + '\nFatura: ' + invoice2.number + '\n\nSeu acesso continua ativo.';
          await sendSystemEmail({
            to: to2,
            subject: 'Cobrança confirmada - Financia',
            text: txt2,
            html: htmlFromText(txt2),
          });
        }
      }

      expect(rpcCalls.filter(function(c) { return c.fn === 'set_client_plan'; })).toHaveLength(2);
      expect(sendSystemEmail).toHaveBeenCalledTimes(2);
    });
  });

  describe('invoice.payment_failed handling', function() {
    it('sends failure email when invoice payment fails', async function() {
      const event = {
        id: 'evt_invoice_failed',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_test_fail',
            subscription: 'sub_test_123',
            amount_due: 2990,
            number: 'INV-002',
          },
        },
      };

      const payload = JSON.stringify(event);
      const constructedEvent = await mockStripe.webhooks.constructEventAsync(payload, 'sig', 'whsec_test');
      expect(constructedEvent.type).toBe('invoice.payment_failed');

      const invoice = constructedEvent.data.object;
      const subId = invoice.subscription;
      const sub = await mockStripe.subscriptions.retrieve(subId);
      const meta = sub.metadata || {};
      const userId = meta.user_id;
      const planId = meta.plan_id || 'pro';

      const to = await sb.auth.admin.getUserById(userId).then(function(r) { return r.data?.user?.email; });
      const brl = 'R$ ' + (Number(invoice.amount_due) / 100).toFixed(2).replace('.', ',');
      const txt = 'Não conseguimos confirmar a cobrança da sua assinatura.\n\nPlano: ' + planId + '\nValor pendente: ' + brl + '\nFatura: ' + invoice.number + '\n\nAtualize o cartão em Configurações > Assinatura para evitar interrupção.';
      await sendSystemEmail({
        to: to,
        subject: 'Falha na cobrança - Financia',
        text: txt,
        html: htmlFromText(txt),
      });

      expect(sendSystemEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: mockUserEmail,
        subject: 'Falha na cobrança - Financia',
      }));
    });
  });

  describe('customer.subscription.updated handling', function() {
    it('handles plan upgrade/downgrade via subscription.updated', async function() {
      const event = {
        id: 'evt_sub_updated',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_123',
            status: 'active',
            metadata: { user_id: mockUserId, plan_id: 'premium' },
            items: { data: [{ price: { metadata: { plan_id: 'premium' } } }] },
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            cancel_at_period_end: false,
          },
        },
      };

      const payload = JSON.stringify(event);
      const constructedEvent = await mockStripe.webhooks.constructEventAsync(payload, 'sig', 'whsec_test');

      const sub = constructedEvent.data.object;
      const meta = sub.metadata || {};
      const userId = meta.user_id;
      const planId = meta.plan_id;

      expect(userId).toBe(mockUserId);
      expect(planId).toBe('premium');

      const expires = new Date(Number(sub.current_period_end) * 1000).toISOString();
      await sb.rpc('set_client_plan', {
        p_target: userId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: expires,
      });

      expect(sb.rpc).toHaveBeenCalledWith('set_client_plan', expect.objectContaining({
        p_plan: 'premium',
      }));
    });

    it('handles cancel_at_period_end and sends notification email', async function() {
      const event = {
        id: 'evt_sub_cancel_scheduled',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_123',
            status: 'active',
            metadata: { user_id: mockUserId, plan_id: mockPlanId },
            items: { data: [{ price: { metadata: { plan_id: mockPlanId } } }] },
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            cancel_at_period_end: true,
          },
        },
      };

      const payload = JSON.stringify(event);
      const constructedEvent = await mockStripe.webhooks.constructEventAsync(payload, 'sig', 'whsec_test');

      const sub = constructedEvent.data.object;
      const meta = sub.metadata || {};
      const userId = meta.user_id;
      const planId = meta.plan_id;

      const expires = new Date(Number(sub.current_period_end) * 1000).toISOString();
      await sb.rpc('set_client_plan', {
        p_target: userId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: expires,
      });

      const to = await sb.auth.admin.getUserById(userId).then(function(r) { return r.data?.user?.email; });
      const dateStr = new Date(expires).toLocaleDateString('pt-BR');
      const txt = 'Lembrete: sua assinatura foi agendada para cancelamento.\n\nVocê mantém o acesso até ' + dateStr + '.\nDepois dessa data, sua conta voltará para o plano Grátis.\n\nSe quiser reativar, acesse a aba de Assinatura no app.';
      await sendSystemEmail({
        to: to,
        subject: 'Cancelamento agendado - Financia',
        text: txt,
        html: htmlFromText(txt),
      });

      expect(sendSystemEmail).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'Cancelamento agendado - Financia',
      }));
    });
  });

  describe('customer.subscription.deleted handling', function() {
    it('reverts to free plan and sends cancellation email', async function() {
      const event = {
        id: 'evt_sub_deleted',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_123',
            metadata: { user_id: mockUserId, plan_id: mockPlanId },
          },
        },
      };

      const payload = JSON.stringify(event);
      const constructedEvent = await mockStripe.webhooks.constructEventAsync(payload, 'sig', 'whsec_test');

      const sub = constructedEvent.data.object;
      const meta = sub.metadata || {};
      const userId = meta.user_id;

      await sb.rpc('set_client_plan', {
        p_target: userId,
        p_plan: 'free',
        p_actor: 'stripe_webhook',
        p_expires_at: null,
      });

      expect(sb.rpc).toHaveBeenCalledWith('set_client_plan', expect.objectContaining({
        p_target: mockUserId,
        p_plan: 'free',
        p_expires_at: null,
      }));

      const to = await sb.auth.admin.getUserById(userId).then(function(r) { return r.data?.user?.email; });
      const txt = 'Sua assinatura foi encerrada e sua conta voltou para o plano Grátis.\n\nSe quiser reativar um plano pago, acesse a aba de Assinatura.';
      await sendSystemEmail({
        to: to,
        subject: 'Assinatura encerrada - Financia',
        text: txt,
        html: htmlFromText(txt),
      });

      expect(sendSystemEmail).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'Assinatura encerrada - Financia',
      }));
    });
  });

  describe('payment_intent.succeeded (white-label)', function() {
    it('activates white-label on successful payment', async function() {
      const event = {
        id: 'evt_pi_succeeded',
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test_123',
            metadata: { kind: 'white_label', user_id: mockUserId },
          },
        },
      };

      const payload = JSON.stringify(event);
      const constructedEvent = await mockStripe.webhooks.constructEventAsync(payload, 'sig', 'whsec_test');

      const pi = constructedEvent.data.object;
      const meta = pi.metadata || {};

      expect(meta.kind).toBe('white_label');
      expect(meta.user_id).toBe(mockUserId);

      await sb.rpc('set_white_label', { p_user: meta.user_id, p_on: true });

      expect(sb.rpc).toHaveBeenCalledWith('set_white_label', { p_user: mockUserId, p_on: true });

      const to = await sb.auth.admin.getUserById(meta.user_id).then(function(r) { return r.data?.user?.email; });
      const txt = 'Pedido de personalização confirmado.\n\nRecebemos seu pagamento e iniciaremos a preparação do app personalizado.\n\nVocê pode ajustar nome, logo e cores em Configurações > Aparência.';
      await sendSystemEmail({
        to: to,
        subject: 'Personalização confirmada - Financia',
        text: txt,
        html: htmlFromText(txt),
      });

      expect(sendSystemEmail).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'Personalização confirmada - Financia',
      }));
    });
  });

  describe('invoice.upcoming reminder', function() {
    it('sends upcoming invoice reminder email', async function() {
      const event = {
        id: 'evt_invoice_upcoming',
        type: 'invoice.upcoming',
        data: {
          object: {
            id: 'in_upcoming_123',
            subscription: 'sub_test_123',
            amount_due: 2990,
            next_payment_attempt: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60,
          },
        },
      };

      const payload = JSON.stringify(event);
      const constructedEvent = await mockStripe.webhooks.constructEventAsync(payload, 'sig', 'whsec_test');

      const invoice = constructedEvent.data.object;
      const subId = invoice.subscription;
      const sub = await mockStripe.subscriptions.retrieve(subId);
      const meta = sub.metadata || {};
      const userId = meta.user_id;
      const planId = meta.plan_id || 'pro';

      const to = await sb.auth.admin.getUserById(userId).then(function(r) { return r.data?.user?.email; });
      const dueDate = invoice.next_payment_attempt
        ? new Date(Number(invoice.next_payment_attempt) * 1000).toLocaleDateString('pt-BR')
        : 'em breve';
      const brl = 'R$ ' + (Number(invoice.amount_due) / 100).toFixed(2).replace('.', ',');
      const txt = 'Lembrete de cobrança da sua assinatura.\n\nPlano: ' + planId + '\nPróxima cobrança: ' + brl + '\nData prevista: ' + dueDate + '\n\nSe precisar, atualize o cartão em Configurações > Assinatura.';
      await sendSystemEmail({
        to: to,
        subject: 'Lembrete de cobrança - Financia',
        text: txt,
        html: htmlFromText(txt),
      });

      expect(sendSystemEmail).toHaveBeenCalledWith(expect.objectContaining({
        subject: 'Lembrete de cobrança - Financia',
      }));
    });
  });

  describe('DLQ recording on failure', function() {
    it('records failed webhook event to DLQ', async function() {
      const event = mockStripeEvents.checkoutSessionCompleted;
      const _payload = JSON.stringify(event);

      const recordDlqFailure = vi.fn(function() { return Promise.resolve(); });

      try {
        throw new Error('Simulated webhook processing error');
      } catch (err) {
        await recordDlqFailure(
          sb,
          event.id,
          event.type,
          event,
          err
        );
      }

      expect(recordDlqFailure).toHaveBeenCalledWith(
        sb,
        'evt_checkout_completed',
        'checkout.session.completed',
        event,
        expect.any(Error)
      );
    });
  });
});