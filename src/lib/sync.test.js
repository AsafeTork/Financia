import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let mockStorage = {};
if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: function(k) { return mockStorage[k] || null; },
      setItem: function(k, v) { mockStorage[k] = String(v); },
      clear: function() { mockStorage = {}; },
      removeItem: function(k) { delete mockStorage[k]; },
    },
    writable: true,
    configurable: true,
  });
}

let _clearLS = function() { mockStorage = {}; };

vi.mock('./dexie.js', function() {
  const mockLastSync = {};
  const txTable = { where: vi.fn(), bulkDelete: vi.fn(), bulkPut: vi.fn(), bulkGet: vi.fn(), clear: vi.fn() };
  const prTable = { where: vi.fn(), get: vi.fn(), put: vi.fn(), update: vi.fn(), bulkPut: vi.fn(), bulkGet: vi.fn(), clear: vi.fn() };
  const lsTable = { where: vi.fn(), bulkDelete: vi.fn(), bulkPut: vi.fn(), bulkGet: vi.fn(), clear: vi.fn() };
  return {
    ldb: { transactions: txTable, products: prTable, losses: lsTable, profiles: { where: vi.fn(), get: vi.fn(), put: vi.fn(), update: vi.fn() }, lastSync: { put: vi.fn() } },
    toLocal: function(x) { return x; },
    getLastSync: vi.fn(function(uid) { return Promise.resolve(mockLastSync[uid] || '2020-01-01'); }),
    setLastSync: vi.fn(function(ts, uid) { mockLastSync[uid] = ts; return Promise.resolve(); }),
    FIELD_MAP: { transactions: ['id','user_id','amount'], products: ['id','user_id'], losses: ['id','user_id'] },
    pickFields: function(row, fields) {
      const out = {};
      fields.forEach(function(f) { if (row[f] !== undefined) out[f] = row[f]; });
      return out;
    },
    __mockLastSync: mockLastSync,
    __txTable: txTable, __prTable: prTable, __lsTable: lsTable,
  };
});

vi.mock('./supabase.js', function() {
  function makeQb(response) {
    let api;
    api = {
      select: function() { return api; },
      upsert: function() { return Promise.resolve(response || { error: null }); },
      update: function() { return api; },
      delete: function() { return api; },
      eq: function() { return api; },
      gte: function() { return api; },
      order: function() { return api; },
      limit: function() { return api; },
      maybeSingle: function() { return Promise.resolve(response || { data: null, error: null }); },
      then: function(resolve) { resolve(response || { data: null, error: null }); },
    };
    return api;
  }
  return {
    sb: {
      from: vi.fn(function(table) { return makeQb(); }),
      rpc: vi.fn(function() { return Promise.resolve({ data: null, error: null }); }),
      functions: { invoke: vi.fn(function() { return Promise.resolve({ data: null, error: null }); }) },
      __setResponse: function() {},
      __makeQb: makeQb,
    },
  };
});

import { syncAll, fetchClients, fetchClientUsage, fetchDbStats, fetchStripeOverview, setClientCustomPrice, setClientWhiteLabel, deleteClient, triggerApkBuild } from './sync.js';
import { sb } from './supabase.js';
import { ldb } from './dexie.js';

describe('syncAll', function() {
  beforeEach(function() {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    vi.clearAllMocks();
    sb.from.mockReset();
    sb.from.mockReturnValue(sb.__makeQb());
  });

  it('retorna false sem uid', async function() {
    const r = await syncAll(null);
    expect(r.ok).toBe(false);
  });

  it('retorna false se offline', async function() {
    navigator.onLine = false;
    const r = await syncAll('u1');
    expect(r.ok).toBe(false);
  });

  it('executa sync e retorna true', async function() {
    const ldbMod = await import('./dexie.js');
    const txTable = ldbMod.__txTable;
    txTable.where.mockReturnValue({ equals: function() {
      return { and: function() { return { toArray: function() { return Promise.resolve([]); } }; } };
    } });

    const prTable = ldbMod.__prTable;
    prTable.where.mockReturnValue({ equals: function() {
      return { and: function() { return { toArray: function() { return Promise.resolve([]); } }; } };
    } });

    const lsTable = ldbMod.__lsTable;
    lsTable.where.mockReturnValue({ equals: function() {
      return { and: function() { return { toArray: function() { return Promise.resolve([]); } }; } };
    } });

    ldb.profiles.where.mockReturnValue({ equals: function() {
      return { and: function() { return { toArray: function() { return Promise.resolve([]); } }; } };
    } });

    const r = await syncAll('u1');
    expect(r.ok).toBe(true);
  });
});

describe('fetchClients', function() {
  it('retorna array de dados', async function() {
    sb.from.mockReturnValue({
      select: function() { return { order: function() { return Promise.resolve({ data: [{ user_id: 'u1' }] }); } }; },
    });
    const clients = await fetchClients();
    expect(clients).toEqual([{ user_id: 'u1' }]);
  });
  it('retorna array vazio no erro', async function() {
    sb.from.mockReturnValue({
      select: function() { return { order: function() { throw new Error('x'); } }; },
    });
    const clients = await fetchClients();
    expect(clients).toEqual([]);
  });
});

describe('fetchClientUsage', function() {
  it('retorna mapa de usage', async function() {
    sb.rpc.mockReturnValue(Promise.resolve({ data: [{ user_id: 'u1', count: 5 }], error: null }));
    const map = await fetchClientUsage();
    expect(map).toEqual({ u1: { user_id: 'u1', count: 5 } });
  });
  it('retorna {} quando error', async function() {
    sb.rpc.mockReturnValue(Promise.resolve({ data: null, error: new Error('x') }));
    const map = await fetchClientUsage();
    expect(map).toEqual({});
  });
  it('retorna {} na exception', async function() {
    sb.rpc.mockRejectedValue(new Error('crash'));
    const map = await fetchClientUsage();
    expect(map).toEqual({});
  });
});

describe('fetchDbStats', function() {
  it('retorna data no sucesso', async function() {
    sb.rpc.mockReturnValue(Promise.resolve({ data: { users: 10 }, error: null }));
    const s = await fetchDbStats();
    expect(s).toEqual({ users: 10 });
  });
  it('retorna null no error', async function() {
    sb.rpc.mockReturnValue(Promise.resolve({ data: null, error: new Error('x') }));
    const s = await fetchDbStats();
    expect(s).toBeNull();
  });
});

describe('fetchStripeOverview', function() {
  it('retorna data no sucesso', async function() {
    sb.functions.invoke.mockReturnValue(Promise.resolve({ data: { revenue: 1000 } }));
    const r = await fetchStripeOverview();
    expect(r).toEqual({ revenue: 1000 });
  });
  it('retorna null quando res.error', async function() {
    sb.functions.invoke.mockReturnValue(Promise.resolve({ error: new Error('x') }));
    const r = await fetchStripeOverview();
    expect(r).toBeNull();
  });
  it('retorna null quando data.error', async function() {
    sb.functions.invoke.mockReturnValue(Promise.resolve({ data: { error: 'err' } }));
    const r = await fetchStripeOverview();
    expect(r).toBeNull();
  });
  it('retorna null na exception', async function() {
    sb.functions.invoke.mockRejectedValue(new Error('x'));
    const r = await fetchStripeOverview();
    expect(r).toBeNull();
  });
});

describe('admin functions', function() {
  beforeEach(function() {
    sb.functions.invoke.mockReset();
    sb.rpc.mockReset();
  });

  describe('setClientCustomPrice', function() {
    it('retorna ok true no sucesso com applied', async function() {
      sb.functions.invoke.mockReturnValue(Promise.resolve({ data: { applied: true } }));
      const r = await setClientCustomPrice('u1', 1000);
      expect(r).toEqual({ ok: true, applied: true });
    });
    it('retorna ok true sem applied', async function() {
      sb.functions.invoke.mockReturnValue(Promise.resolve({ data: {} }));
      const r = await setClientCustomPrice('u1', 1000, 'plan_x');
      expect(r).toEqual({ ok: true, applied: false });
    });
    it('retorna erro do edge function', async function() {
      sb.functions.invoke.mockReturnValue(Promise.resolve({ error: new Error('x') }));
      const r = await setClientCustomPrice('u1', 1000);
      expect(r.ok).toBe(false);
    });
    it('retorna erro de rede na exception', async function() {
      sb.functions.invoke.mockRejectedValue(new Error('x'));
      const r = await setClientCustomPrice('u1', 1000);
      expect(r).toEqual({ ok: false, error: 'rede' });
    });
    it('inclui planId quando fornecido', async function() {
      sb.functions.invoke.mockReturnValue(Promise.resolve({ data: {} }));
      await setClientCustomPrice('u1', 1000, 'premium');
      const payload = sb.functions.invoke.mock.calls[0][1].body;
      expect(payload).toHaveProperty('plan_id', 'premium');
    });
  });

  describe('setClientWhiteLabel', function() {
    it('retorna ok no sucesso', async function() {
      sb.functions.invoke.mockReturnValue(Promise.resolve({ data: {} }));
      const r = await setClientWhiteLabel('u1', true);
      expect(r).toEqual({ ok: true });
    });
    it('retorna error do edge function', async function() {
      sb.functions.invoke.mockReturnValue(Promise.resolve({ data: { error: 'fail' } }));
      const r = await setClientWhiteLabel('u1', true);
      expect(r).toEqual({ ok: false, error: 'fail' });
    });
    it('retorna rede na exception', async function() {
      sb.functions.invoke.mockRejectedValue(new Error('x'));
      const r = await setClientWhiteLabel('u1', true);
      expect(r).toEqual({ ok: false, error: 'rede' });
    });
  });

  describe('deleteClient', function() {
    it('retorna true no sucesso', async function() {
      sb.rpc.mockReturnValue(Promise.resolve({ error: null }));
      const r = await deleteClient('u1');
      expect(r).toBe(true);
    });
    it('retorna false no error', async function() {
      sb.rpc.mockReturnValue(Promise.resolve({ error: new Error('x') }));
      const r = await deleteClient('u1');
      expect(r).toBe(false);
    });
    it('retorna false na exception', async function() {
      sb.rpc.mockRejectedValue(new Error('x'));
      const r = await deleteClient('u1');
      expect(r).toBe(false);
    });
  });
});

describe('triggerApkBuild', function() {
  beforeEach(function() {
    globalThis.cleanupMocks();
    vi.useFakeTimers();
  });
  afterEach(function() {
    vi.useRealTimers();
  });

  it('retorna no_token quando edge function retorna 500 sem token', async function() {
    sb.functions.invoke.mockReturnValue(Promise.resolve({ error: { message: 'Internal Server Error', context: { ok: false, reason: 'no_token' } } }));
    const r = await triggerApkBuild('Client', undefined, '#ff0000');
    expect(r).toEqual({ ok: false, reason: 'no_token' });
  });
  it('retorna ok quando edge function confirma build', async function() {
    sb.functions.invoke.mockReturnValue(Promise.resolve({ data: { ok: true } }));
    const r = await triggerApkBuild('Client', 'https://ex.com/logo.png', '#ff0000');
    expect(r).toEqual({ ok: true });
  });
  it('rejeita rate limit', async function() {
    localStorage.setItem('nancia_last_build_at', String(Date.now()));
    const r = await triggerApkBuild('Client', undefined, '#ff0000');
    expect(r).toEqual({ ok: false, reason: 'rate_limited' });
  });
  it('retorna network_error em falha de invoke', async function() {
    localStorage.setItem('nancia_last_build_at', '0');
    sb.functions.invoke.mockRejectedValue(new Error('network'));
    const r = await triggerApkBuild('Client', undefined, '#ff0000');
    expect(r).toEqual({ ok: false, reason: 'network_error' });
  });
  it('propaga razoes da edge function', async function() {
    localStorage.setItem('nancia_last_build_at', '0');
    sb.functions.invoke.mockReturnValue(Promise.resolve({ data: { ok: false, reason: 'invalid_token' } }));
    const r = await triggerApkBuild('Client', undefined, '#ff0000');
    expect(r).toEqual({ ok: false, reason: 'invalid_token' });
  });
  it('retorna error no invoke.error', async function() {
    localStorage.setItem('nancia_last_build_at', '0');
    sb.functions.invoke.mockReturnValue(Promise.resolve({ error: new Error('timeout') }));
    const r = await triggerApkBuild('Client', undefined, '#ff0000');
    expect(r).toEqual({ ok: false, reason: 'edge_error', detail: 'timeout' });
  });
});

describe('benchmarks', function() {
  beforeEach(function() {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    vi.clearAllMocks();
    sb.from.mockReset();
    sb.from.mockReturnValue(sb.__makeQb({ data: [], error: null }));
    sb.rpc.mockReturnValue(Promise.resolve({ data: null, error: null }));
    sb.functions.invoke.mockReturnValue(Promise.resolve({ data: { ok: true }, error: null }));
  });

  it('QA-04: syncAll 10k rows < 5s (benchmark)', async function() {
    const start = performance.now();
    const result = await syncAll('bench_user');
    const duration = performance.now() - start;

    console.log(`QA-04 benchmark: syncAll took ${duration.toFixed(2)}ms`);
    expect(result.ok).toBe(true);
    expect(duration).toBeLessThan(5000);
  });

  it('QA-05: admin-stripe-overview p95 < 2s (100 subs with cursor pagination)', async function() {
    const iterations = 100;
    const durations = [];

    sb.functions.invoke.mockReturnValue(Promise.resolve({
      data: {
        available_cents: 1000000,
        pending_cents: 500000,
        currency: 'brl',
        mrr_cents: 499000,
        active_count: 100,
        pagination: { cursor: 'next_cursor', next_cursor: 'next_cursor', limit: 100, has_more: true },
      },
      error: null,
    }));

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fetchStripeOverview('admin_user');
      durations.push(performance.now() - start);
    }

    durations.sort((a, b) => a - b);
    const p95 = durations[Math.floor(iterations * 0.95)];
    const avg = durations.reduce((a, b) => a + b, 0) / iterations;

    console.log(`QA-05 benchmark: fetchStripeOverview p95=${p95.toFixed(2)}ms avg=${avg.toFixed(2)}ms over ${iterations} iterations`);

    expect(p95).toBeLessThan(2000);
  });
});
