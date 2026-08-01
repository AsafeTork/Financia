// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { toLocal, getLastSync, setLastSync, pickFields, FIELD_MAP, TX_FIELDS, PRD_FIELDS, LSS_FIELDS } from './dexie.js';

describe('toLocal', function() {
  it('adiciona metadados de sincronizacao default', function() {
    const row = { id: 'r1', name: 'x' };
    const out = toLocal(row);
    expect(out._synced).toBe(1);
    expect(out._deleted).toBe(0);
    expect(out._updated_at).toBeDefined();
    expect(out.name).toBe('x');
  });

  it('usa updated_at quando presente no _updated_at', function() {
    const out = toLocal({ id: 'r1', updated_at: '2026-05-01T10:00:00Z' });
    expect(out._updated_at).toBe('2026-05-01T10:00:00Z');
  });

  it('usa created_at quando nao ha updated_at', function() {
    const out = toLocal({ id: 'r1', created_at: '2026-04-01T10:00:00Z' });
    expect(out._updated_at).toBe('2026-04-01T10:00:00Z');
  });

  it('mescla extras sobre o row', function() {
    const out = toLocal({ id: 'r1', name: 'x' }, { user_id: 'u1', desc: 'd' });
    expect(out.user_id).toBe('u1');
    expect(out.desc).toBe('d');
  });

  it('nao muta o objeto original', function() {
    const row = { id: 'r1' };
    toLocal(row);
    expect(row._synced).toBeUndefined();
  });
});

describe('getLastSync / setLastSync', function() {
  it('default e 1970-01-01T00:00:00Z', async function() {
    const v = await getLastSync('u1');
    expect(v).toBe('1970-01-01T00:00:00Z');
  });

  it('roundtrip com uid usa chave por usuario', async function() {
    await setLastSync('2026-06-01T00:00:00Z', 'u1');
    await setLastSync('2026-07-01T00:00:00Z', 'u2');
    expect(await getLastSync('u1')).toBe('2026-06-01T00:00:00Z');
    expect(await getLastSync('u2')).toBe('2026-07-01T00:00:00Z');
  });

  it('setLastSync sem uid usa chave global', async function() {
    await setLastSync('2026-01-01T00:00:00Z');
    expect(await getLastSync(null)).toBe('2026-01-01T00:00:00Z');
  });

  it('setLastSync sobrescreve valor anterior', async function() {
    await setLastSync('2026-01-01T00:00:00Z', 'u9');
    await setLastSync('2026-02-01T00:00:00Z', 'u9');
    expect(await getLastSync('u9')).toBe('2026-02-01T00:00:00Z');
  });
});

describe('pickFields', function() {
  it('seleciona apenas campos existentes', function() {
    const out = pickFields({ id: '1', name: 'x', extra: 'y' }, ['id', 'name', 'missing']);
    expect(out).toEqual({ id: '1', name: 'x' });
  });

  it('ignora campos undefined', function() {
    const out = pickFields({ id: '1', x: undefined }, ['id', 'x']);
    expect(out).toEqual({ id: '1' });
  });

  it('lista vazia retorna objeto vazio', function() {
    expect(pickFields({ a: 1 }, [])).toEqual({});
  });
});

describe('FIELD_MAP', function() {
  it('mapeia as tres tabelas', function() {
    expect(FIELD_MAP.transactions).toEqual(TX_FIELDS);
    expect(FIELD_MAP.products).toEqual(PRD_FIELDS);
    expect(FIELD_MAP.losses).toEqual(LSS_FIELDS);
  });

  it('transactions contem campos essenciais', function() {
    ['id', 'type', 'description', 'amount', 'date', 'category', 'user_id', 'updated_at'].forEach(function(f) {
      expect(TX_FIELDS).toContain(f);
    });
  });

  it('products contem campos essenciais', function() {
    ['id', 'name', 'price', 'cost', 'stock', 'user_id'].forEach(function(f) {
      expect(PRD_FIELDS).toContain(f);
    });
  });

  it('losses contem campos essenciais', function() {
    ['id', 'description', 'qty', 'reason', 'date', 'user_id'].forEach(function(f) {
      expect(LSS_FIELDS).toContain(f);
    });
  });
});
