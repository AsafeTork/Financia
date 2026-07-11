import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

var mockStorage = {};
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

var _clearLS = function() { mockStorage = {}; };

vi.mock('./dexie.js', function() {
  var mockLastSync = {};
  var txTable = { where: vi.fn(), bulkDelete: vi.fn(), bulkPut: vi.fn(), bulkGet: vi.fn() };
  var prTable = { where: vi.fn(), get: vi.fn(), put: vi.fn(), update: vi.fn() };
  var lsTable = { where: vi.fn(), bulkDelete: vi.fn(), bulkPut: vi.fn(), bulkGet: vi.fn() };
  return {
    ldb: { transactions: txTable, products: prTable, losses: lsTable, profiles: { where: vi.fn(), get: vi.fn(), put: vi.fn(), update: vi.fn() }, lastSync: { put: vi.fn() } },
    toLocal: function(x) { return x; },
    getLastSync: vi.fn(function(uid) { return Promise.resolve(mockLastSync[uid] || '2020-01-01'); }),
    setLastSync: vi.fn(function(ts, uid) { mockLastSync[uid] = ts; return Promise.resolve(); }),
    FIELD_MAP: { transactions: ['id','user_id','amount'], products: ['id','user_id'], losses: ['id','user_id'] },
    pickFields: function(row, fields) {
      var out = {};
      fields.forEach(function(f) { if (row[f] !== undefined) out[f] = row[f]; });
      return out;
    },
    __mockLastSync: mockLastSync,
    __txTable: txTable, __prTable: prTable, __lsTable: lsTable,
  };
});

vi.mock('./supabase.js', function() {
  function makeQb(response) {
    var api;
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
    var r = await syncAll(null);
    expect(r).toBe(false);
  });

  it('retorna false se offline', async function() {
    navigator.onLine = false;
    var r = await syncAll('u1');
    expect(r).toBe(false);
  });

  it('executa sync e retorna true', async function() {
    var ldbMod = await import('./dexie.js');
    var txTable = ldbMod.__txTable;
    txTable.where.mockReturnValue({ equals: function() {
      return { and: function() { return { toArray: function() { return Promise.resolve([]); } }; } };
    } });

    var prTable = ldbMod.__prTable;
    prTable.where.mockReturnValue({ equals: function() {
      return { and: function() { return { toArray: function() { return Promise.resolve([]); } }; } };
    } });

    var lsTable = ldbMod.__lsTable;
    lsTable.where.mockReturnValue({ equals: function() {
      return { and: function() { return { toArray: function() { return Promise.resolve([]); } }; } };
    } });

    ldb.profiles.where.mockReturnValue({ equals: function() {
      return { and: function() { return { toArray: function() { return Promise.resolve([]); } }; } };
    } });

    var r = await syncAll('u1');
    expect(r).toBe(true);
  });
});

describe('fetchClients', function() {
  it('retorna array de dados', async function() {
    sb.from.mockReturnValue({
      select: function() { return { order: function() { return Promise.resolve({ data: [{ user_id: 'u1' }] }); } }; },
    });
    var clients = await fetchClients();
    expect(clients).toEqual([{ user_id: 'u1' }]);
  });
  it('retorna array vazio no erro', async function() {
    sb.from.mockReturnValue({
      select: function() { return { order: function() { throw new Error('x'); } }; },
    });
    var clients = await fetchClients();
    expect(clients).toEqual([]);
  });
});

describe('fetchClientUsage', function() {
  it('retorna mapa de usage', async function() {
    sb.rpc.mockReturnValue(Promise.resolve({ data: [{ user_id: 'u1', count: 5 }], error: null }));
    var map = await fetchClientUsage();
    expect(map).toEqual({ u1: { user_id: 'u1', count: 5 } });
  });
  it('retorna {} quando error', async function() {
    sb.rpc.mockReturnValue(Promise.resolve({ data: null, error: new Error('x') }));
    var map = await fetchClientUsage();
    expect(map).toEqual({});
  });
  it('retorna {} na exception', async function() {
    sb.rpc.mockRejectedValue(new Error('crash'));
    var map = await fetchClientUsage();
    expect(map).toEqual({});
  });
});

describe('fetchDbStats', function() {
  it('retorna data no sucesso', async function() {
    sb.rpc.mockReturnValue(Promise.resolve({ data: { users: 10 }, error: null }));
    var s = await fetchDbStats();
    expect(s).toEqual({ users: 10 });
  });
  it('retorna null no error', async function() {
    sb.rpc.mockReturnValue(Promise.resolve({ data: null, error: new Error('x') }));
    var s = await fetchDbStats();
    expect(s).toBeNull();
  });
});

describe('fetchStripeOverview', function() {
  it('retorna data no sucesso', async function() {
    sb.functions.invoke.mockReturnValue(Promise.resolve({ data: { revenue: 1000 } }));
    var r = await fetchStripeOverview();
    expect(r).toEqual({ revenue: 1000 });
  });
  it('retorna null quando res.error', async function() {
    sb.functions.invoke.mockReturnValue(Promise.resolve({ error: new Error('x') }));
    var r = await fetchStripeOverview();
    expect(r).toBeNull();
  });
  it('retorna null quando data.error', async function() {
    sb.functions.invoke.mockReturnValue(Promise.resolve({ data: { error: 'err' } }));
    var r = await fetchStripeOverview();
    expect(r).toBeNull();
  });
  it('retorna null na exception', async function() {
    sb.functions.invoke.mockRejectedValue(new Error('x'));
    var r = await fetchStripeOverview();
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
      var r = await setClientCustomPrice('u1', 1000);
      expect(r).toEqual({ ok: true, applied: true });
    });
    it('retorna ok true sem applied', async function() {
      sb.functions.invoke.mockReturnValue(Promise.resolve({ data: {} }));
      var r = await setClientCustomPrice('u1', 1000, 'plan_x');
      expect(r).toEqual({ ok: true, applied: false });
    });
    it('retorna erro do edge function', async function() {
      sb.functions.invoke.mockReturnValue(Promise.resolve({ error: new Error('x') }));
      var r = await setClientCustomPrice('u1', 1000);
      expect(r.ok).toBe(false);
    });
    it('retorna erro de rede na exception', async function() {
      sb.functions.invoke.mockRejectedValue(new Error('x'));
      var r = await setClientCustomPrice('u1', 1000);
      expect(r).toEqual({ ok: false, error: 'rede' });
    });
    it('inclui planId quando fornecido', async function() {
      sb.functions.invoke.mockReturnValue(Promise.resolve({ data: {} }));
      await setClientCustomPrice('u1', 1000, 'premium');
      var payload = sb.functions.invoke.mock.calls[0][1].body;
      expect(payload).toHaveProperty('plan_id', 'premium');
    });
  });

  describe('setClientWhiteLabel', function() {
    it('retorna ok no sucesso', async function() {
      sb.functions.invoke.mockReturnValue(Promise.resolve({ data: {} }));
      var r = await setClientWhiteLabel('u1', true);
      expect(r).toEqual({ ok: true });
    });
    it('retorna error do edge function', async function() {
      sb.functions.invoke.mockReturnValue(Promise.resolve({ data: { error: 'fail' } }));
      var r = await setClientWhiteLabel('u1', true);
      expect(r).toEqual({ ok: false, error: 'fail' });
    });
    it('retorna rede na exception', async function() {
      sb.functions.invoke.mockRejectedValue(new Error('x'));
      var r = await setClientWhiteLabel('u1', true);
      expect(r).toEqual({ ok: false, error: 'rede' });
    });
  });

  describe('deleteClient', function() {
    it('retorna true no sucesso', async function() {
      sb.rpc.mockReturnValue(Promise.resolve({ error: null }));
      var r = await deleteClient('u1');
      expect(r).toBe(true);
    });
    it('retorna false no error', async function() {
      sb.rpc.mockReturnValue(Promise.resolve({ error: new Error('x') }));
      var r = await deleteClient('u1');
      expect(r).toBe(false);
    });
    it('retorna false na exception', async function() {
      sb.rpc.mockRejectedValue(new Error('x'));
      var r = await deleteClient('u1');
      expect(r).toBe(false);
    });
  });
});

describe('triggerApkBuild', function() {
  beforeEach(function() {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(function() {
    vi.useRealTimers();
  });

  it('retorna no_token quando edge function retorna 500 sem token', async function() {
    sb.functions.invoke.mockReturnValue(Promise.resolve({ error: { message: 'Internal Server Error', context: { ok: false, reason: 'no_token' } } }));
    var r = await triggerApkBuild('Client', undefined, '#ff0000');
    expect(r).toEqual({ ok: false, reason: 'no_token' });
  });
  it('retorna ok quando edge function confirma build', async function() {
    sb.functions.invoke.mockReturnValue(Promise.resolve({ data: { ok: true } }));
    var r = await triggerApkBuild('Client', 'https://ex.com/logo.png', '#ff0000');
    expect(r).toEqual({ ok: true });
  });
  it('rejeita rate limit', async function() {
    localStorage.setItem('nancia_last_build_at', String(Date.now()));
    var r = await triggerApkBuild('Client', undefined, '#ff0000');
    expect(r).toEqual({ ok: false, reason: 'rate_limited' });
  });
  it('retorna network_error em falha de invoke', async function() {
    localStorage.setItem('nancia_last_build_at', '0');
    sb.functions.invoke.mockRejectedValue(new Error('network'));
    var r = await triggerApkBuild('Client', undefined, '#ff0000');
    expect(r).toEqual({ ok: false, reason: 'network_error' });
  });
  it('propaga razoes da edge function', async function() {
    localStorage.setItem('nancia_last_build_at', '0');
    sb.functions.invoke.mockReturnValue(Promise.resolve({ data: { ok: false, reason: 'invalid_token' } }));
    var r = await triggerApkBuild('Client', undefined, '#ff0000');
    expect(r).toEqual({ ok: false, reason: 'invalid_token' });
  });
  it('retorna error no invoke.error', async function() {
    localStorage.setItem('nancia_last_build_at', '0');
    sb.functions.invoke.mockReturnValue(Promise.resolve({ error: new Error('timeout') }));
    var r = await triggerApkBuild('Client', undefined, '#ff0000');
    expect(r).toEqual({ ok: false, reason: 'edge_error', detail: 'timeout' });
  });
});
