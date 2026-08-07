import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./utils.js', function() {
  return { now: function() { return '2026-01-01T00:00:00.000Z'; } };
});

const { txTable, prTable, lsTable, profilesTable, fromMock } = vi.hoisted(function() {
  const txTable = {
    where: vi.fn(),
    bulkDelete: vi.fn(async function() {}),
    bulkPut: vi.fn(async function() {}),
    bulkGet: vi.fn(async function() { return []; }),
    get: vi.fn(async function() { return undefined; }),
  };
  const prTable = {
    where: vi.fn(),
    bulkDelete: vi.fn(async function() {}),
    bulkPut: vi.fn(async function() {}),
    bulkGet: vi.fn(async function() { return []; }),
    get: vi.fn(async function() { return undefined; }),
  };
  const lsTable = {
    where: vi.fn(),
    bulkDelete: vi.fn(async function() {}),
    bulkPut: vi.fn(async function() {}),
    bulkGet: vi.fn(async function() { return []; }),
    get: vi.fn(async function() { return undefined; }),
  };
  const profilesTable = {
    where: vi.fn(),
    get: vi.fn(async function() { return undefined; }),
    put: vi.fn(async function() {}),
    update: vi.fn(async function() {}),
  };
  const fromMock = vi.fn();
  return { txTable, prTable, lsTable, profilesTable, fromMock };
});

vi.mock('./dexie.js', function() {
  return {
    ldb: {
      transactions: txTable,
      products: prTable,
      losses: lsTable,
      profiles: profilesTable,
      meta: { get: vi.fn(), put: vi.fn() },
    },
    toLocal: function(row, extra) { return Object.assign({}, row, extra || {}); },
    getLastSync: vi.fn(async function() { return '2020-01-01T00:00:00Z'; }),
    setLastSync: vi.fn(async function() {}),
    FIELD_MAP: {
      transactions: ['id', 'user_id', 'description', 'amount', 'date', 'category', 'updated_at'],
      products: ['id', 'user_id', 'name', 'price', 'cost', 'stock', 'updated_at'],
      losses: ['id', 'user_id', 'description', 'qty', 'reason', 'date', 'updated_at'],
    },
    pickFields: function(row, fields) {
      const out = {};
      fields.forEach(function(f) { if (row[f] !== undefined) out[f] = row[f]; });
      return out;
    },
    __txTable: txTable,
    __prTable: prTable,
    __lsTable: lsTable,
    __profilesTable: profilesTable,
  };
});

function makeQb(response) {
  let api;
  api = {
    select: function() { return api; },
    upsert: function() { return Promise.resolve(response || { error: null }); },
    update: function() { return api; },
    delete: function() { return api; },
    eq: function() { return api; },
    gte: function() { return api; },
    gt: function() { return api; },
    lt: function() { return api; },
    order: function() { return api; },
    limit: function() { return api; },
    maybeSingle: function() { return Promise.resolve(response || { data: null, error: null }); },
    then: function(resolve) { resolve(response || { data: [], error: null }); },
  };
  return api;
}

// Query builder paginado: pagina i usa responses[i]
function makePagedQb(responses) {
  let api;
  let page = 0;
  api = {
    select: function() { return api; },
    upsert: function() { return Promise.resolve({ error: null }); },
    update: function() { return api; },
    delete: function() { return api; },
    eq: function() { return api; },
    gte: function() { return api; },
    gt: function() { return api; },
    lt: function() { return api; },
    order: function() { return api; },
    limit: function() { return api; },
    maybeSingle: function() { return Promise.resolve({ data: null, error: null }); },
    then: function(resolve) {
      const res = responses[Math.min(page, responses.length - 1)];
      page++;
      resolve(res);
    },
  };
  return api;
}

vi.mock('./supabase.js', function() {
  return {
    sb: {
      from: function() { return fromMock.apply(this, arguments); },
      rpc: vi.fn(async function() { return { data: null, error: null }; }),
      functions: { invoke: vi.fn(async function() { return { data: null, error: null }; }) },
    },
  };
});

let syncAll, resetSyncBackoff;
async function reloadSync() {
  vi.resetModules();
  const mod = await import('./sync.js');
  syncAll = mod.syncAll;
  resetSyncBackoff = mod.resetSyncBackoff;
}

function emptyUnsynced(table) {
  table.where.mockReturnValue({ equals: function() { return { toArray: function() { return Promise.resolve([]); } }; } });
}

// where('[user_id+_synced]') -> consulta de nao sincronizados; where('id') -> marcar _synced
function unsyncedRows(table, rows) {
  table.where.mockImplementation(function(key) {
    if (key === '[user_id+_synced]') {
      return { equals: function() { return { toArray: function() { return Promise.resolve(rows); } }; } };
    }
    return { anyOf: function() { return { modify: async function() {} }; } };
  });
}

describe('syncAll — upload de dados locais', function() {
  beforeEach(async function() {
    await reloadSync();
    resetSyncBackoff();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    vi.clearAllMocks();
    emptyUnsynced(txTable);
    emptyUnsynced(prTable);
    emptyUnsynced(lsTable);
    emptyUnsynced(profilesTable);
    profilesTable.get.mockResolvedValue(undefined);
    fromMock.mockReset();
  });

  it('envia row marcada _deleted e remove localmente', async function() {
    unsyncedRows(txTable, [{ id: 't1', user_id: 'u1', _synced: 0, _deleted: 1, updated_at: '2026-01-01' }]);
    emptyUnsynced(prTable);
    emptyUnsynced(lsTable);
    fromMock.mockImplementation(function(table) {
      return makeQb({ data: [], error: null });
    });
    const r = await syncAll('u1');
    expect(r.ok).toBe(true);
    expect(fromMock).toHaveBeenCalledWith('transactions');
    expect(txTable.bulkDelete).toHaveBeenCalledWith(['t1']);
  });

  it('envia row normal via upsert e marca _synced', async function() {
    unsyncedRows(txTable, [{ id: 't2', user_id: 'u1', _synced: 0, _deleted: 0, description: 'Venda', category: 'vendas', amount: 10, date: '2026-01-01', updated_at: '2026-01-01' }]);
    const upsert = vi.fn(function() { return Promise.resolve({ error: null }); });
    fromMock.mockImplementation(function(table) {
      return Object.assign(makeQb({ data: [], error: null }), { upsert: function() { return upsert.apply(this, arguments); } });
    });
    const r = await syncAll('u1');
    expect(r.ok).toBe(true);
    expect(upsert).toHaveBeenCalled();
    const payload = upsert.mock.calls[0][0];
    expect(payload.description).toBe('Venda');
    expect(payload.category).toBe('vendas');
    expect(upsert.mock.calls[0][1]).toEqual({ onConflict: 'id' });
  });

  it('erro no upsert nao derruba o sync e mantem row local', async function() {
    unsyncedRows(txTable, [{ id: 't3', user_id: 'u1', _synced: 0, _deleted: 0, updated_at: '2026-01-01' }]);
    const upsert = vi.fn(function() { return Promise.resolve({ error: new Error('offline') }); });
    fromMock.mockImplementation(function(table) {
      return Object.assign(makeQb({ data: [], error: null }), { upsert: function() { return upsert.apply(this, arguments); } });
    });
    const r = await syncAll('u1');
    expect(r.ok).toBe(true);
    expect(txTable.bulkDelete).not.toHaveBeenCalled();
  });

  it('pull remoto: grava rows novas vindas do servidor', async function() {
    fromMock.mockImplementation(function(table) {
      if (table === 'company_profiles') return makeQb({ data: null, error: null });
      return makePagedQb([{ data: [{ id: 'r1', user_id: 'u1', description: 'Remota', updated_at: '2026-06-01' }], error: null }]);
    });
    txTable.bulkGet.mockResolvedValue([undefined]);
    const r = await syncAll('u1');
    expect(r.ok).toBe(true);
    expect(r.changed).toBe(true);
    expect(txTable.bulkPut).toHaveBeenCalledWith([expect.objectContaining({ id: 'r1', desc: 'Remota' })]);
  });

  it('pull paginado: segunda pagina quando a primeira tem 500 rows', async function() {
    const page1 = [];
    for (let i = 0; i < 500; i++) page1.push({ id: 'r' + i, user_id: 'u1', updated_at: '2026-06-01T00:00:0' + (i % 10) + 'Z' });
    const pagedQb = makePagedQb([{ data: page1, error: null }, { data: [{ id: 'r500', user_id: 'u1', updated_at: '2026-06-02' }], error: null }]);
    fromMock.mockImplementation(function(table) {
      if (table === 'company_profiles') return makeQb({ data: null, error: null });
      return pagedQb;
    });
    const r = await syncAll('u1');
    expect(r.ok).toBe(true);
    expect(txTable.bulkGet).toHaveBeenCalledWith(expect.arrayContaining(['r499', 'r500']));
  });

  it('pull com row local mais nova: nao sobrescreve', async function() {
    fromMock.mockImplementation(function(table) {
      if (table === 'company_profiles') return makeQb({ data: null, error: null });
      return makePagedQb([{ data: [{ id: 'r1', user_id: 'u1', updated_at: '2025-01-01' }], error: null }]);
    });
    txTable.bulkGet.mockResolvedValue([{ id: 'r1', _synced: 1, _updated_at: '2026-01-01T00:00:00Z' }]);
    const r = await syncAll('u1');
    expect(r.ok).toBe(true);
    expect(txTable.bulkPut).not.toHaveBeenCalled();
  });

  it('erro no pull remoto -> ok false', async function() {
    fromMock.mockImplementation(function(table) {
      if (table === 'company_profiles') return makeQb({ data: null, error: null });
      return makePagedQb([{ data: null, error: new Error('500') }]);
    });
    const r = await syncAll('u1');
    expect(r.ok).toBe(false);
  });

  it('offline retorna ok false sem chamar supabase', async function() {
    navigator.onLine = false;
    const r = await syncAll('u1');
    expect(r).toEqual({ ok: false, changed: false });
    expect(fromMock).not.toHaveBeenCalled();
  });
});

describe('syncAll — backoff de falhas consecutivas', function() {
  beforeEach(async function() {
    await reloadSync();
    resetSyncBackoff();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    vi.clearAllMocks();
    fromMock.mockReset();
  });

  it('5 falhas ativam backoff de 60s e resetSyncBackoff restaura', async function() {
    fromMock.mockImplementation(function() { throw new Error('network'); });
    for (let i = 0; i < 5; i++) {
      const r = await syncAll('u1');
      expect(r.ok).toBe(false);
    }
    expect(fromMock).toHaveBeenCalled();
    fromMock.mockClear();
    const backoffResult = await syncAll('u1');
    expect(backoffResult.ok).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();

    resetSyncBackoff();
    emptyUnsynced(txTable);
    emptyUnsynced(prTable);
    emptyUnsynced(lsTable);
    emptyUnsynced(profilesTable);
    profilesTable.get.mockResolvedValue(undefined);
    fromMock.mockImplementation(function() { return makeQb({ data: [], error: null }); });
    const ok = await syncAll('u1');
    expect(ok.ok).toBe(true);
  });

  it('falha unica nao ativa backoff (chamadas seguintes rodam)', async function() {
    fromMock.mockImplementationOnce(function() { throw new Error('network'); });
    fromMock.mockImplementation(function() { return makeQb({ data: [], error: null }); });
    emptyUnsynced(txTable);
    emptyUnsynced(prTable);
    emptyUnsynced(lsTable);
    emptyUnsynced(profilesTable);
    profilesTable.get.mockResolvedValue(undefined);
    const r1 = await syncAll('u1');
    expect(r1.ok).toBe(false);
    const r2 = await syncAll('u1');
    expect(r2.ok).toBe(true);
  });
});

describe('syncAll — sincronizacao de perfil (syncProfiles interno)', function() {
  beforeEach(async function() {
    await reloadSync();
    resetSyncBackoff();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
    vi.clearAllMocks();
    emptyUnsynced(txTable);
    emptyUnsynced(prTable);
    emptyUnsynced(lsTable);
    emptyUnsynced(profilesTable);
    profilesTable.get.mockResolvedValue(undefined);
    fromMock.mockReset();
  });

  function profileQb(extra) {
    return Object.assign(makeQb({ data: null, error: null }), extra || {});
  }

  function profileFromMock(qb) {
    fromMock.mockImplementation(function(table) {
      if (table === 'company_profiles') return qb;
      return makeQb({ data: [], error: null });
    });
  }

  it('sanitiza hex invalido para #002f59', async function() {
    const upsert = vi.fn(function() { return Promise.resolve({ error: null }); });
    profileFromMock(profileQb({ upsert: function() { return upsert.apply(this, arguments); } }));
    profilesTable.where.mockReturnValue({ equals: function() { return { toArray: function() { return Promise.resolve([{ user_id: 'u1', name: 'X', color: 'red', color_secondary: 'blue', color_accent: null, _synced: 0, updated_at: '2026-01-01' }]); } }; } });
    const r = await syncAll('u1');
    expect(r.ok).toBe(true);
    const clean = upsert.mock.calls[0][0];
    expect(clean.color).toBe('#002f59');
    expect(clean.color_secondary).toBeNull();
    expect(profilesTable.update).toHaveBeenCalledWith('u1', { _synced: 1 });
  });

  it('upsert do perfil com erro -> ok false', async function() {
    const upsert = vi.fn(function() { return Promise.resolve({ error: new Error('x') }); });
    profileFromMock(profileQb({ upsert: function() { return upsert.apply(this, arguments); } }));
    profilesTable.where.mockReturnValue({ equals: function() { return { toArray: function() { return Promise.resolve([{ user_id: 'u1', _synced: 0, updated_at: '2026-01-01' }]); } }; } });
    const r = await syncAll('u1');
    expect(r.ok).toBe(false);
  });

  it('pull do perfil remoto grava local quando nao existe', async function() {
    const maybeSingle = vi.fn(function() { return Promise.resolve({ data: { user_id: 'u1', name: 'Remoto', color: '#123456' }, error: null }); });
    profileFromMock(profileQb({ maybeSingle: function() { return maybeSingle.apply(this, arguments); } }));
    profilesTable.get.mockResolvedValue(null);
    const r = await syncAll('u1');
    expect(r.ok).toBe(true);
    expect(profilesTable.put).toHaveBeenCalled();
  });

  it('pull com perfil local pendente nao sobrescreve', async function() {
    const maybeSingle = vi.fn(function() { return Promise.resolve({ data: { user_id: 'u1', name: 'Remoto' }, error: null }); });
    profileFromMock(profileQb({ maybeSingle: function() { return maybeSingle.apply(this, arguments); } }));
    profilesTable.get.mockResolvedValue({ user_id: 'u1', _synced: 0 });
    const r = await syncAll('u1');
    expect(r.ok).toBe(true);
    expect(profilesTable.put).not.toHaveBeenCalled();
  });

  it('offline nao chama supabase', async function() {
    navigator.onLine = false;
    const r = await syncAll('u1');
    expect(r.ok).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
