import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./utils.js', function() {
  const t = '2025-01-01T00:00:00.000Z';
  return { now: function() { return t; } };
});

import { getRb, rowMeta, updMeta, deletedMeta, applyEdit, countLimit, dexiePut, dexieUpdate, syncUpsert, syncUpdate, syncDelete } from './crud.js';

function makeSession(meta) {
  return { user: { id: 'u1', email: 'a@b.com', user_metadata: meta || {} } };
}

describe('getRb', function() {
  it('retorna name do metadata quando existe', function() {
    expect(getRb(makeSession({ name: 'Joao' }))).toBe('Joao');
  });
  it('retorna email quando metadata nao tem name', function() {
    expect(getRb(makeSession({}))).toBe('a@b.com');
  });
  it('retorna email quando metadata e undefined', function() {
    expect(getRb(makeSession(null))).toBe('a@b.com');
  });
});

describe('rowMeta', function() {
  it('retorna objeto com campos obrigatorios', function() {
    const m = rowMeta(makeSession({ name: 'Joao' }));
    expect(m).toHaveProperty('user_id', 'u1');
    expect(m).toHaveProperty('registered_by', 'Joao');
    expect(m).toHaveProperty('_synced', 0);
    expect(m).toHaveProperty('_deleted', 0);
    expect(m).toHaveProperty('updated_at');
    expect(m).toHaveProperty('_updated_at');
  });
});

describe('updMeta', function() {
  it('retorna updated_at + sync flags', function() {
    const m = updMeta();
    expect(m).toHaveProperty('updated_at');
    expect(m).toHaveProperty('_synced', 0);
    expect(m).toHaveProperty('_updated_at');
  });
});

describe('deletedMeta', function() {
  it('retorna _deleted=1 + sync flags', function() {
    const m = deletedMeta();
    expect(m).toHaveProperty('_deleted', 1);
    expect(m).toHaveProperty('_synced', 0);
  });
});

describe('applyEdit', function() {
  it('atualiza item com id correspondente', function() {
    const list = [{ id: 1, name: 'a' }, { id: 2, name: 'b' }];
    const result = applyEdit(list, 1, { name: 'c' });
    expect(result[0].name).toBe('c');
    expect(result[1].name).toBe('b');
  });
  it('nao modifica lista original', function() {
    const list = [{ id: 1, name: 'a' }];
    const result = applyEdit(list, 1, { name: 'c' });
    expect(list[0].name).toBe('a');
    expect(result[0].name).toBe('c');
  });
  it('retorna copia mesmo sem match', function() {
    const list = [{ id: 1 }];
    const result = applyEdit(list, 99, { x: 1 });
    expect(result).toEqual([{ id: 1 }]);
  });
});

describe('countLimit', function() {
  it('conta only non-deleted', async function() {
    const ldb = {
      items: {
        where: function() {
          let filterFn;
          return {
            equals: function() {
              const api = {
                filter: function(fn) { filterFn = fn; return api; },
                count: function() {
                  const rows = [{ _deleted: 0 }, { _deleted: 1 }, { _deleted: 0 }];
                  return Promise.resolve(rows.filter(filterFn || Boolean).length);
                },
              };
              return api;
            },
          };
        },
      },
    };
    const count = await countLimit(ldb, 'items', 'u1');
    expect(count).toBe(2);
  });
});

describe('dexiePut / dexieUpdate', function() {
  it('dexiePut retorna true no sucesso', async function() {
    const ldb = { items: { put: function() { return Promise.resolve(); } } };
    const toast = vi.fn();
    const ok = await dexiePut(ldb, 'items', { id: 1 }, toast);
    expect(ok).toBe(true);
    expect(toast).not.toHaveBeenCalled();
  });
  it('dexiePut chama toast no erro', async function() {
    const ldb = { items: { put: function() { return Promise.reject(new Error('db full')); } } };
    const toast = vi.fn();
    const ok = await dexiePut(ldb, 'items', { id: 1 }, toast);
    expect(ok).toBe(false);
    expect(toast).toHaveBeenCalledWith('Erro ao salvar: db full', 'error');
  });
  it('dexieUpdate retorna true no sucesso', async function() {
    const ldb = { items: { update: function() { return Promise.resolve(); } } };
    const toast = vi.fn();
    const ok = await dexieUpdate(ldb, 'items', 1, { name: 'x' }, toast);
    expect(ok).toBe(true);
  });
  it('dexieUpdate chama toast no erro', async function() {
    const ldb = { items: { update: function() { return Promise.reject(new Error('fail')); } } };
    const toast = vi.fn();
    const ok = await dexieUpdate(ldb, 'items', 1, { name: 'x' }, toast);
    expect(ok).toBe(false);
    expect(toast).toHaveBeenCalled();
  });
});

describe('syncUpsert / syncUpdate / syncDelete', function() {
  beforeEach(function() {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
  });

  it('syncUpsert marca _synced=1 no sucesso', async function() {
    const sb = { from: function() { return { upsert: function() { return Promise.resolve({ error: null }); } }; } };
    const ldb = { items: { update: vi.fn(function() { return Promise.resolve(); }) } };
    const toast = vi.fn();
    await syncUpsert(sb, 'items', { id: 1 }, ldb, 1, toast);
    expect(ldb.items.update).toHaveBeenCalledWith(1, { _synced: 1 });
  });
  it('syncUpsert chama toast no erro do sb', async function() {
    const sb = { from: function() { return { upsert: function() { return Promise.resolve({ error: new Error('x') }); } }; } };
    const ldb = { items: { update: vi.fn() } };
    const toast = vi.fn();
    await syncUpsert(sb, 'items', { id: 1 }, ldb, 1, toast);
    expect(toast).toHaveBeenCalled();
  });
  function makeThenableSb(response) {
    let api;
    api = {
      eq: function() { return api; },
      update: function() { return api; },
      delete: function() { return api; },
      then: function(resolve) { resolve(response || { error: null }); },
    };
    return api;
  }

  it('syncUpdate marca _synced=1 no sucesso', async function() {
    const sb = { from: function() { return makeThenableSb({ error: null }); } };
    const ldb = { items: { update: vi.fn(function() { return Promise.resolve(); }) } };
    const toast = vi.fn();
    await syncUpdate(sb, 'items', { name: 'x' }, 1, ldb, toast);
    expect(ldb.items.update).toHaveBeenCalledWith(1, { _synced: 1 });
  });
  it('syncDelete deleta do ldb no sucesso', async function() {
    const sb = { from: function() { return makeThenableSb({ error: null }); } };
    const ldb = { items: { delete: vi.fn(function() { return Promise.resolve(); }) } };
    const toast = vi.fn();
    await syncDelete(sb, 'items', 1, ldb, toast);
    expect(ldb.items.delete).toHaveBeenCalledWith(1);
  });
  it('sync functions retornam cedo se offline', async function() {
    navigator.onLine = false;
    const ldb = { items: { update: vi.fn(), delete: vi.fn() } };
    const sb = {};
    await syncUpsert(sb, 'items', {}, ldb, 1, vi.fn());
    await syncUpdate(sb, 'items', {}, 1, ldb, vi.fn());
    await syncDelete(sb, 'items', 1, ldb, vi.fn());
    expect(ldb.items.update).not.toHaveBeenCalled();
    expect(ldb.items.delete).not.toHaveBeenCalled();
  });
});
