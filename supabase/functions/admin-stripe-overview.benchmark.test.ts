import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { bench } from 'vitest';

const ACTIVE_STATUSES = ['active', 'trialing', 'past_due'];

function sumBalanceBRL(list) {
  let cents = 0;
  if (list) {
    for (let i = 0; i < list.length; i++) {
      if (list[i] && list[i].currency === 'brl') cents += list[i].amount;
    }
  }
  return cents;
}

function monthlyCentsOf(item) {
  if (!item || !item.price || !item.price.unit_amount) return 0;
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

function createMockStripe(subscriptionsCount = 150) {
  const subscriptions = [];
  const baseId = 'sub_';
  for (let i = 0; i < subscriptionsCount; i++) {
    const status = ACTIVE_STATUSES[Math.floor(Math.random() * ACTIVE_STATUSES.length)];
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const items = [];
    for (let j = 0; j < itemCount; j++) {
      const interval = ['month', 'year', 'week'][Math.floor(Math.random() * 3)];
      const intervalCount = 1;
      const unitAmount = Math.floor(Math.random() * 50000) + 1000;
      items.push({
        id: `si_${i}_${j}`,
        price: {
          id: `price_${i}_${j}`,
          unit_amount: unitAmount,
          currency: 'brl',
          recurring: {
            interval,
            interval_count: intervalCount,
          },
        },
        quantity: 1,
      });
    }
    subscriptions.push({
      id: `${baseId}${i.toString().padStart(4, '0')}`,
      status,
      cancel_at_period_end: Math.random() < 0.1,
      items: { data: items },
    });
  }
  return subscriptions;
}

function createMockStripeInstance(subscriptions) {
  let callCount = 0;
  return {
    balance: {
      retrieve: async () => ({
        available: [{ amount: 5000000, currency: 'brl' }],
        pending: [{ amount: 1000000, currency: 'brl' }],
      }),
    },
    subscriptions: {
      list: async ({ limit = 100, starting_after }) => {
        callCount++;
        const startIndex = starting_after
          ? subscriptions.findIndex((s) => s.id === starting_after) + 1
          : 0;
        const endIndex = Math.min(startIndex + limit, subscriptions.length);
        const data = subscriptions.slice(startIndex, endIndex);
        const hasMore = endIndex < subscriptions.length;
        const nextCursor = hasMore && data.length > 0 ? data[data.length - 1].id : undefined;
        return { data, has_more: hasMore };
      },
    },
    _callCount: () => callCount,
  };
}

async function handler(req, stripe) {
  const url = new URL(req.url);
  const cursor = url.searchParams.get('cursor') || undefined;
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 200);

  const balance = await stripe.balance.retrieve();
  const availableCents = sumBalanceBRL(balance?.available || null);
  const pendingCents = sumBalanceBRL(balance?.pending || null);

  let mrrCents = 0;
  let activeCount = 0;
  let nextCursor;
  let hasMore = false;

  const subs = await stripe.subscriptions.list({
    status: 'all',
    limit,
    starting_after: cursor,
  });

  if (subs?.data) {
    for (let i = 0; i < subs.data.length; i++) {
      const s = subs.data[i];
      if (ACTIVE_STATUSES.indexOf(s.status) === -1) continue;
      activeCount++;
      const items = s.items?.data || [];
      for (let j = 0; j < items.length; j++) {
        mrrCents += monthlyCentsOf(items[j]);
      }
    }
    hasMore = subs.has_more;
    nextCursor = hasMore && subs.data.length > 0 ? subs.data[subs.data.length - 1].id : undefined;
  }

  return {
    available_cents: availableCents,
    pending_cents: pendingCents,
    currency: 'brl',
    mrr_cents: mrrCents,
    active_count: activeCount,
    pagination: {
      cursor,
      next_cursor: nextCursor,
      limit,
      has_more: hasMore,
    },
  };
}

const subscriptions = createMockStripe(150);
const mockStripe = createMockStripeInstance(subscriptions);

const runIterations = async (iterations = 20) => {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const req = new Request('https://example.com/admin-stripe-overview?limit=100');
    const start = performance.now();
    await handler(req, mockStripe);
    const end = performance.now();
    times.push(end - start);
  }
  return times;
};

const calculatePercentiles = (times) => {
  const sorted = [...times].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const avg = sum / sorted.length;
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  return { p50: Math.round(p50 * 100) / 100, p95: Math.round(p95 * 100) / 100, p99: Math.round(p99 * 100) / 100, avgTimeMs: Math.round(avg * 100) / 100 };
};

describe('admin-stripe-overview benchmark', () => {
  it('runs benchmark and saves metrics', async () => {
    const times = await runIterations(20);
    const metrics = calculatePercentiles(times);

    const fs = await import('fs');
    const path = await import('path');
    const benchmarksDir = path.resolve('/workspaces/financia/benchmarks');
    if (!fs.existsSync(benchmarksDir)) {
      fs.mkdirSync(benchmarksDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(benchmarksDir, 'admin-stripe-overview.json'),
      JSON.stringify(metrics, null, 2)
    );

    console.log('Benchmark metrics:', JSON.stringify(metrics, null, 2));

    expect(metrics.p95).toBeLessThan(2000);
  }, 60000);
});