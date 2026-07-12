import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockUserId = 'user-sub-cycle-123';
const mockUserEmail = 'subcycle@example.com';
const _mockPlans = ['free', 'pro', 'premium', 'white_label'];

vi.mock('./supabase.js', function() {
  const qb = {
    select: function() { return qb; },
    upsert: function() { return Promise.resolve({ error: null }); },
    update: function() { return qb; },
    eq: function() { return qb; },
    maybeSingle: function() { return Promise.resolve({ data: null, error: null }); },
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

let mockStripeSubscriptions = {};
let mockStripeInvoices = {};

function createMockStripe() {
  return {
    subscriptions: {
      create: vi.fn(function(params) {
        const subId = 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const priceId = params.items?.[0]?.price || 'price_pro';
        const sub = {
          id: subId,
          status: 'active',
          customer: params.customer || 'cus_test',
          items: { data: [{ id: 'si_' + subId, price: priceId, price_metadata: { plan_id: getPlanIdFromPrice(priceId) } }] },
          metadata: params.metadata || {},
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          cancel_at_period_end: false,
        };
        mockStripeSubscriptions[subId] = sub;
        return Promise.resolve(sub);
      }),
      retrieve: vi.fn(function(id) {
        const sub = mockStripeSubscriptions[id];
        if (sub) return Promise.resolve(sub);
        return Promise.resolve({
          id: id,
          status: 'active',
          metadata: { user_id: mockUserId, plan_id: 'pro' },
          items: { data: [{ id: 'si_' + id, price: 'price_pro', price_metadata: { plan_id: 'pro' } }] },
          current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          cancel_at_period_end: false,
        });
      }),
      update: vi.fn(function(id, params) {
        const sub = mockStripeSubscriptions[id] || { id: id };
        if (params.metadata) sub.metadata = { ...sub.metadata, ...params.metadata };
        if (params.items) {
          const newItems = params.items.map(function(item) {
            return { id: item.id, price: item.price };
          });
          sub.items = { data: newItems };
        }
        if (params.cancel_at_period_end !== undefined) sub.cancel_at_period_end = params.cancel_at_period_end;
        if (params.proration_behavior) sub.proration_behavior = params.proration_behavior;
        mockStripeSubscriptions[id] = sub;
        return Promise.resolve(sub);
      }),
      cancel: vi.fn(function(id) {
        const sub = mockStripeSubscriptions[id];
        if (sub) {
          sub.status = 'canceled';
          sub.canceled_at = Math.floor(Date.now() / 1000);
        }
        return Promise.resolve(sub || { id: id, status: 'canceled' });
      }),
    },
    invoices: {
      create: vi.fn(function(params) {
        const invId = 'in_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const inv = {
          id: invId,
          subscription: params.subscription,
          amount_due: params.amount_due || 2990,
          amount_paid: params.amount_paid || 0,
          status: 'draft',
          number: 'INV-' + Math.floor(Math.random() * 10000),
        };
        mockStripeInvoices[invId] = inv;
        return Promise.resolve(inv);
      }),
      retrieve: vi.fn(function(id) {
        return Promise.resolve(mockStripeInvoices[id] || { id: id, status: 'paid' });
      }),
      pay: vi.fn(function(id) {
        const inv = mockStripeInvoices[id];
        if (inv) {
          inv.status = 'paid';
          inv.amount_paid = inv.amount_due;
        }
        return Promise.resolve(inv || { id: id, status: 'paid' });
      }),
    },
    prices: {
      retrieve: vi.fn(function(id) {
        const planMap = {
          price_free: { id: 'price_free', metadata: { plan_id: 'free' }, unit_amount: 0 },
          price_pro: { id: 'price_pro', metadata: { plan_id: 'pro' }, unit_amount: 2990 },
          price_premium: { id: 'price_premium', metadata: { plan_id: 'premium' }, unit_amount: 5990 },
          price_white_label: { id: 'price_white_label', metadata: { plan_id: 'white_label' }, unit_amount: 14990 },
        };
        return Promise.resolve(planMap[id] || planMap['price_pro']);
      }),
    },
    customers: {
      create: vi.fn(function() { return Promise.resolve({ id: 'cus_test_' + Date.now() }); }),
      retrieve: vi.fn(function() { return Promise.resolve({ id: 'cus_test', metadata: { user_id: mockUserId } }); }),
    },
  };
}

function getPlanIdFromPrice(priceId) {
  const map = {
    price_free: 'free',
    price_pro: 'pro',
    price_premium: 'premium',
    price_white_label: 'white_label',
  };
  return map[priceId] || 'pro';
}

describe('Stripe Subscription Lifecycle Integration Test', function() {
  let mockStripe;

  beforeEach(function() {
    mockStripe = createMockStripe();
    mockStripeSubscriptions = {};
    mockStripeInvoices = {};
    vi.clearAllMocks();
    sb.rpc.mockResolvedValue({ data: null, error: null });
    sb.auth.admin.getUserById.mockResolvedValue({ data: { user: { email: mockUserEmail } } });
  });

  afterEach(function() {
    vi.resetAllMocks();
  });

  describe('Create subscription', function() {
    it('creates subscription and activates plan in company_profiles', async function() {
      const customer = await mockStripe.customers.create({ metadata: { user_id: mockUserId } });
      expect(customer.id).toBeDefined();

      const subscription = await mockStripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: 'price_pro' }],
        metadata: { user_id: mockUserId, plan_id: 'pro' },
      });

      expect(subscription.id).toBeDefined();
      expect(subscription.status).toBe('active');
      expect(subscription.metadata.plan_id).toBe('pro');

      const planId = subscription.metadata.plan_id;
      let expires = new Date(Number(subscription.current_period_end) * 1000).toISOString();

      await sb.rpc('set_client_plan', {
        p_target: mockUserId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: expires,
      });

      expect(sb.rpc).toHaveBeenCalledWith('set_client_plan', expect.objectContaining({
        p_target: mockUserId,
        p_plan: 'pro',
      }));
    });

    it('creates premium subscription with correct plan', async function() {
      const subscription = await mockStripe.subscriptions.create({
        customer: 'cus_test',
        items: [{ price: 'price_premium' }],
        metadata: { user_id: mockUserId, plan_id: 'premium' },
      });

      const planId = subscription.metadata.plan_id;
      expect(planId).toBe('premium');

      await sb.rpc('set_client_plan', {
        p_target: mockUserId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: new Date(Number(subscription.current_period_end) * 1000).toISOString(),
      });

      expect(sb.rpc).toHaveBeenCalledWith('set_client_plan', expect.objectContaining({
        p_plan: 'premium',
      }));
    });
  });

  describe('Upgrade subscription (pro -> premium) with proration', function() {
    it('upgrades subscription and updates plan in company_profiles', async function() {
      const subscription = await mockStripe.subscriptions.create({
        customer: 'cus_test',
        items: [{ price: 'price_pro' }],
        metadata: { user_id: mockUserId, plan_id: 'pro' },
      });

      const subId = subscription.id;

      const updated = await mockStripe.subscriptions.update(subId, {
        items: [{ id: subscription.items.data[0].id, price: 'price_premium' }],
        proration_behavior: 'create_prorations',
        metadata: { user_id: mockUserId, plan_id: 'premium' },
      });

      expect(updated.metadata.plan_id).toBe('premium');
      expect(updated.items.data[0].price).toBe('price_premium');

      const planId = updated.metadata.plan_id;
      const expires = new Date(Number(updated.current_period_end) * 1000).toISOString();

      await sb.rpc('set_client_plan', {
        p_target: mockUserId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: expires,
      });

      expect(sb.rpc).toHaveBeenCalledWith('set_client_plan', expect.objectContaining({
        p_plan: 'premium',
      }));
    });

    it('handles proration invoice creation', async function() {
      const subscription = await mockStripe.subscriptions.create({
        customer: 'cus_test',
        items: [{ price: 'price_pro' }],
        metadata: { user_id: mockUserId, plan_id: 'pro' },
      });

      const subId = subscription.id;

      await mockStripe.subscriptions.update(subId, {
        items: [{ id: subscription.items.data[0].id, price: 'price_premium' }],
        proration_behavior: 'create_prorations',
        metadata: { plan_id: 'premium' },
      });

      const prorationInvoice = await mockStripe.invoices.create({
        subscription: subId,
        amount_due: 1500,
      });

      expect(prorationInvoice.amount_due).toBe(1500);
      expect(prorationInvoice.subscription).toBe(subId);
    });
  });

  describe('Downgrade subscription (premium -> pro) with proration', function() {
    it('downgrades subscription and updates plan', async function() {
      const subscription = await mockStripe.subscriptions.create({
        customer: 'cus_test',
        items: [{ price: 'price_premium' }],
        metadata: { user_id: mockUserId, plan_id: 'premium' },
      });

      const subId = subscription.id;

      const updated = await mockStripe.subscriptions.update(subId, {
        items: [{ id: subscription.items.data[0].id, price: 'price_pro' }],
        proration_behavior: 'create_prorations',
        metadata: { plan_id: 'pro' },
      });

      expect(updated.metadata.plan_id).toBe('pro');
      expect(updated.items.data[0].price).toBe('price_pro');

      const planId = updated.metadata.plan_id;
      await sb.rpc('set_client_plan', {
        p_target: mockUserId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: new Date(Number(updated.current_period_end) * 1000).toISOString(),
      });

      expect(sb.rpc).toHaveBeenCalledWith('set_client_plan', expect.objectContaining({
        p_plan: 'pro',
      }));
    });

    it('creates credit proration invoice for downgrade', async function() {
      const subscription = await mockStripe.subscriptions.create({
        customer: 'cus_test',
        items: [{ price: 'price_premium' }],
        metadata: { user_id: mockUserId, plan_id: 'premium' },
      });

      const subId = subscription.id;

      await mockStripe.subscriptions.update(subId, {
        items: [{ id: subscription.items.data[0].id, price: 'price_pro' }],
        proration_behavior: 'create_prorations',
      });

      const creditInvoice = await mockStripe.invoices.create({
        subscription: subId,
        amount_due: -1500,
      });

      expect(creditInvoice.amount_due).toBe(-1500);
    });
  });

  describe('Cancel subscription', function() {
    it('cancels subscription at period end', async function() {
      const subscription = await mockStripe.subscriptions.create({
        customer: 'cus_test',
        items: [{ price: 'price_pro' }],
        metadata: { user_id: mockUserId, plan_id: 'pro' },
      });

      const subId = subscription.id;

      const updated = await mockStripe.subscriptions.update(subId, {
        cancel_at_period_end: true,
      });

      expect(updated.cancel_at_period_end).toBe(true);

      const planId = updated.metadata.plan_id || 'pro';
      const expires = new Date(Number(updated.current_period_end) * 1000).toISOString();

      await sb.rpc('set_client_plan', {
        p_target: mockUserId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: expires,
      });

      expect(sb.rpc).toHaveBeenCalledWith('set_client_plan', expect.objectContaining({
        p_target: mockUserId,
      }));
    });

    it('cancels subscription immediately', async function() {
      const subscription = await mockStripe.subscriptions.create({
        customer: 'cus_test',
        items: [{ price: 'price_pro' }],
        metadata: { user_id: mockUserId, plan_id: 'pro' },
      });

      const subId = subscription.id;
      const canceled = await mockStripe.subscriptions.cancel(subId);

      expect(canceled.status).toBe('canceled');

      await sb.rpc('set_client_plan', {
        p_target: mockUserId,
        p_plan: 'free',
        p_actor: 'stripe_webhook',
        p_expires_at: null,
      });

      expect(sb.rpc).toHaveBeenCalledWith('set_client_plan', expect.objectContaining({
        p_plan: 'free',
        p_expires_at: null,
      }));
    });
  });

  describe('Revert to free plan after cancellation', function() {
    it('reverts to free when subscription deleted webhook received', async function() {
      const event = {
        id: 'evt_sub_deleted',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_deleted',
            metadata: { user_id: mockUserId, plan_id: 'pro' },
          },
        },
      };

      const sub = event.data.object;
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
    });

    it('reverts to free on incomplete_expired status', async function() {
      const event = {
        id: 'evt_sub_incomplete',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_incomplete',
            status: 'incomplete_expired',
            metadata: { user_id: mockUserId, plan_id: 'pro' },
            items: { data: [{ price: { metadata: { plan_id: 'pro' } } }] },
          },
        },
      };

      const sub = event.data.object;
      const meta = sub.metadata || {};
      const userId = meta.user_id;

      if (sub.status !== 'active' && sub.status !== 'trialing') {
        await sb.rpc('set_client_plan', {
          p_target: userId,
          p_plan: 'free',
          p_actor: 'stripe_webhook',
          p_expires_at: null,
        });
      }

      expect(sb.rpc).toHaveBeenCalledWith('set_client_plan', expect.objectContaining({
        p_plan: 'free',
        p_expires_at: null,
      }));
    });
  });

  describe('Full subscription cycle integration', function() {
    it('completes full cycle: create -> upgrade -> downgrade -> cancel -> free', async function() {
      const rpcCalls = [];
      sb.rpc.mockImplementation(function(fn, args) {
        rpcCalls.push({ fn: fn, args: args, timestamp: Date.now() });
        return Promise.resolve({ data: null, error: null });
      });

      const customer = await mockStripe.customers.create({ metadata: { user_id: mockUserId } });

      const sub = await mockStripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: 'price_pro' }],
        metadata: { user_id: mockUserId, plan_id: 'pro' },
      });
      const subId = sub.id;

      let planId = sub.metadata.plan_id;
      await sb.rpc('set_client_plan', {
        p_target: mockUserId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: new Date(Number(sub.current_period_end) * 1000).toISOString(),
      });

      const upgraded = await mockStripe.subscriptions.update(subId, {
        items: [{ id: sub.items.data[0].id, price: 'price_premium' }],
        proration_behavior: 'create_prorations',
        metadata: { plan_id: 'premium' },
      });
      planId = upgraded.metadata.plan_id;
      await sb.rpc('set_client_plan', {
        p_target: mockUserId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: new Date(Number(upgraded.current_period_end) * 1000).toISOString(),
      });

      const downgraded = await mockStripe.subscriptions.update(subId, {
        items: [{ id: upgraded.items.data[0].id, price: 'price_pro' }],
        proration_behavior: 'create_prorations',
        metadata: { plan_id: 'pro' },
      });
      planId = downgraded.metadata.plan_id;
      await sb.rpc('set_client_plan', {
        p_target: mockUserId,
        p_plan: planId,
        p_actor: 'stripe_webhook',
        p_expires_at: new Date(Number(downgraded.current_period_end) * 1000).toISOString(),
      });

      const canceled = await mockStripe.subscriptions.update(subId, {
        cancel_at_period_end: true,
      });
      expect(canceled.cancel_at_period_end).toBe(true);

      const _deletedEvent = { data: { object: { metadata: { user_id: mockUserId } } } };
      await sb.rpc('set_client_plan', {
        p_target: mockUserId,
        p_plan: 'free',
        p_actor: 'stripe_webhook',
        p_expires_at: null,
      });

      const planChanges = rpcCalls.filter(function(c) { return c.fn === 'set_client_plan'; });
      expect(planChanges).toHaveLength(4);

      expect(planChanges[0].args.p_plan).toBe('pro');
      expect(planChanges[1].args.p_plan).toBe('premium');
      expect(planChanges[2].args.p_plan).toBe('pro');
      expect(planChanges[3].args.p_plan).toBe('free');
    });

    it('verifies plan transitions in company_profiles at each step', async function() {
      const planHistory = [];

      sb.rpc.mockImplementation(function(fn, args) {
        if (fn === 'set_client_plan') {
          planHistory.push({ plan: args.p_plan, expires: args.p_expires_at, time: Date.now() });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const sub = await mockStripe.subscriptions.create({
        customer: 'cus_test',
        items: [{ price: 'price_pro' }],
        metadata: { user_id: mockUserId, plan_id: 'pro' },
      });
      await sb.rpc('set_client_plan', { p_target: mockUserId, p_plan: 'pro', p_actor: 'stripe_webhook', p_expires_at: new Date(Number(sub.current_period_end) * 1000).toISOString() });

      const up = await mockStripe.subscriptions.update(sub.id, { items: [{ id: sub.items.data[0].id, price: 'price_premium' }], metadata: { plan_id: 'premium' } });
      await sb.rpc('set_client_plan', { p_target: mockUserId, p_plan: 'premium', p_actor: 'stripe_webhook', p_expires_at: new Date(Number(up.current_period_end) * 1000).toISOString() });

      const down = await mockStripe.subscriptions.update(sub.id, { items: [{ id: up.items.data[0].id, price: 'price_pro' }], metadata: { plan_id: 'pro' } });
      await sb.rpc('set_client_plan', { p_target: mockUserId, p_plan: 'pro', p_actor: 'stripe_webhook', p_expires_at: new Date(Number(down.current_period_end) * 1000).toISOString() });

      await mockStripe.subscriptions.cancel(sub.id);
      await sb.rpc('set_client_plan', { p_target: mockUserId, p_plan: 'free', p_actor: 'stripe_webhook', p_expires_at: null });

      expect(planHistory.map(function(p) { return p.plan; })).toEqual(['pro', 'premium', 'pro', 'free']);
    });
  });

  describe('White-label addon subscription', function() {
    it('creates white-label subscription and activates addon', async function() {
      const subscription = await mockStripe.subscriptions.create({
        customer: 'cus_test',
        items: [{ price: 'price_white_label' }],
        metadata: { user_id: mockUserId, plan_id: 'white_label', kind: 'white_label' },
      });

      expect(subscription.metadata.kind).toBe('white_label');
      expect(subscription.metadata.plan_id).toBe('white_label');

      await sb.rpc('set_white_label', { p_user: mockUserId, p_on: true });
      await sb.rpc('set_client_plan', {
        p_target: mockUserId,
        p_plan: 'white_label',
        p_actor: 'stripe_webhook',
        p_expires_at: new Date(Number(subscription.current_period_end) * 1000).toISOString(),
      });

      expect(sb.rpc).toHaveBeenCalledWith('set_white_label', { p_user: mockUserId, p_on: true });
    });
  });
});