// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTx } from './useTx.js';

const mockPut = vi.fn(async function() {});
const mockUpdate = vi.fn(async function() {});
const mockDelete = vi.fn(async function() {});
const mockGet = vi.fn(async function() { return undefined; });

const mockCount = vi.fn(async function() { return 0; });
const whereChain = {
  equals: function() {
    return {
      filter: function() { return { count: function() { return mockCount.apply(this, arguments); } }; },
      count: function() { return mockCount.apply(this, arguments); },
    };
  },
};

vi.mock('../../lib/dexie.js', function() {
  return {
    ldb: {
      transactions: {
        where: function() { return whereChain; },
        put: function() { return mockPut.apply(this, arguments); },
        update: function() { return mockUpdate.apply(this, arguments); },
        delete: function() { return mockDelete.apply(this, arguments); },
        get: function() { return mockGet.apply(this, arguments); },
      },
    },
  };
});

const mockUpsert = vi.fn(async function() { return { error: null }; });
const mockSbUpdate = vi.fn(function() { return { eq: vi.fn(async function() { return { error: null }; }) }; });
const mockSbDelete = vi.fn(function() { return { eq: vi.fn(async function() { return { error: null }; }) }; });

vi.mock('../../lib/supabase.js', function() {
  return {
    sb: {
      from: function() {
        return {
          upsert: function() { return mockUpsert.apply(this, arguments); },
          update: function() { return mockSbUpdate.apply(this, arguments); },
          delete: function() { return mockSbDelete.apply(this, arguments); },
        };
      },
    },
  };
});

const mockIsRecurring = vi.fn(function(id) { return typeof id === 'string' && id.indexOf('rec-') === 0; });
const mockAddSkip = vi.fn(async function() {});

vi.mock('../../lib/recurring.js', function() {
  return {
    isRecurringId: function(id) { return mockIsRecurring.apply(this, arguments); },
    addSkip: function() { return mockAddSkip.apply(this, arguments); },
  };
});

const session = {
  user: { id: 'u1', email: 'a@b.com', user_metadata: { name: 'Teste' } },
};

function makeHook(limitOk) {
  const enforceLimit = vi.fn(function() { return limitOk !== false; });
  const toast = vi.fn();
  const hook = renderHook(function() { return useTx(session, enforceLimit, toast); });
  return { hook: hook, enforceLimit: enforceLimit, toast: toast };
}

function makeTx(overrides) {
  return Object.assign({ id: 'tx1', type: 'income', desc: 'Venda', amount: '100', date: '2026-01-01', method: 'pix', cat: 'vendas' }, overrides || {});
}

describe('useTx — addGenerated', function() {
  beforeEach(function() {
    mockPut.mockClear();
    mockUpdate.mockClear();
    mockGet.mockClear();
    mockUpsert.mockClear();
    mockAddSkip.mockClear();
    var _onLine = false;
    Object.defineProperty(navigator, 'onLine', { get: function() { return _onLine; }, set: function(v) { _onLine = v; }, configurable: true });
  });

  it('adiciona transacao gerada e sincroniza quando online', async function() {
    navigator.onLine = true;
    const { hook } = makeHook();
    const row = { id: 'gen-1', type: 'expense', description: 'Aluguel', category: 'Fixo', amount: 500, date: '2026-01-05', user_id: 'u1', registered_by: 'Recorrente', updated_at: '2026-01-01T00:00:00Z' };
    let ret;
    await act(async function() { ret = await hook.result.current.addGenerated(row); });
    expect(ret).toBe(true);
    expect(mockPut).toHaveBeenCalledWith(row);
    expect(hook.result.current.tx).toHaveLength(1);
    expect(hook.result.current.tx[0].desc).toBe('Aluguel');
    expect(hook.result.current.tx[0].cat).toBe('Fixo');
    expect(mockUpsert).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith('gen-1', { _synced: 1 });
  });

  it('nao duplica quando transacao ja existe localmente', async function() {
    mockGet.mockResolvedValueOnce({ id: 'gen-1' });
    const { hook } = makeHook();
    let ret;
    await act(async function() { ret = await hook.result.current.addGenerated({ id: 'gen-1', description: 'X', amount: 1, date: '2026-01-01' }); });
    expect(ret).toBe(false);
    expect(mockPut).not.toHaveBeenCalled();
    expect(hook.result.current.tx).toHaveLength(0);
  });

  it('offline: persiste local sem upsert', async function() {
    const { hook } = makeHook();
    await act(async function() { await hook.result.current.addGenerated({ id: 'gen-2', description: 'X', amount: 1, date: '2026-01-01' }); });
    expect(mockPut).toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('erro no upsert nao quebra e mantem local', async function() {
    navigator.onLine = true;
    mockUpsert.mockResolvedValueOnce({ error: new Error('network') });
    const { hook } = makeHook();
    let ret;
    await act(async function() { ret = await hook.result.current.addGenerated({ id: 'gen-3', description: 'X', amount: 1, date: '2026-01-01' }); });
    expect(ret).toBe(true);
    expect(hook.result.current.tx).toHaveLength(1);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('exception no upsert e silenciada', async function() {
    navigator.onLine = true;
    mockUpsert.mockRejectedValueOnce(new Error('crash'));
    const { hook } = makeHook();
    let ret;
    await act(async function() { ret = await hook.result.current.addGenerated({ id: 'gen-4', description: 'X', amount: 1, date: '2026-01-01' }); });
    expect(ret).toBe(true);
  });

  it('nao duplica id ja presente no estado', async function() {
    const { hook } = makeHook();
    const row = { id: 'gen-5', description: 'X', amount: 1, date: '2026-01-01' };
    await act(async function() { await hook.result.current.addGenerated(row); });
    await act(async function() { await hook.result.current.addGenerated(row); });
    expect(hook.result.current.tx).toHaveLength(1);
  });
});

describe('useTx — deleteTx com recorrência', function() {
  beforeEach(function() {
    mockGet.mockClear();
    mockAddSkip.mockClear();
    mockUpdate.mockClear();
    var _onLine = false;
    Object.defineProperty(navigator, 'onLine', { get: function() { return _onLine; }, set: function(v) { _onLine = v; }, configurable: true });
  });

  it('id recorrente: marca skip para o usuario', async function() {
    mockGet.mockResolvedValueOnce({ id: 'rec-x', user_id: 'u1' });
    const { hook } = makeHook();
    await act(async function() { await hook.result.current.addTx(makeTx({ id: 'rec-x' })); });
    mockUpdate.mockClear();
    await act(async function() { await hook.result.current.deleteTx('rec-x'); });
    expect(mockGet).toHaveBeenCalledWith('rec-x');
    expect(mockAddSkip).toHaveBeenCalledWith('u1', 'rec-x');
    expect(hook.result.current.tx).toHaveLength(0);
  });

  it('id recorrente sem registro local: nao quebra', async function() {
    mockGet.mockResolvedValueOnce(undefined);
    const { hook } = makeHook();
    let ret;
    await act(async function() { ret = await hook.result.current.deleteTx('rec-x'); });
    expect(ret).toBe(true);
    expect(mockAddSkip).not.toHaveBeenCalled();
  });

  it('id normal nao aciona skip', async function() {
    const { hook } = makeHook();
    await act(async function() { await hook.result.current.addTx(makeTx()); });
    await act(async function() { await hook.result.current.deleteTx('tx1'); });
    expect(mockAddSkip).not.toHaveBeenCalled();
    expect(mockGet).not.toHaveBeenCalled();
  });
});

describe('useTx — sincronizacao online apos CRUD', function() {
  beforeEach(function() {
    mockPut.mockClear();
    mockUpdate.mockClear();
    mockUpsert.mockClear();
    mockSbUpdate.mockClear();
    mockSbDelete.mockClear();
    var _onLine = true;
    Object.defineProperty(navigator, 'onLine', { get: function() { return _onLine; }, set: function(v) { _onLine = v; }, configurable: true });
  });

  it('addTx online: upsert com payload e marca _synced 1', async function() {
    const { hook } = makeHook();
    await act(async function() { await hook.result.current.addTx(makeTx()); });
    expect(mockUpsert).toHaveBeenCalled();
    const payload = mockUpsert.mock.calls[0][0];
    expect(payload.description).toBe('Venda');
    expect(payload.user_id).toBe('u1');
    expect(mockUpdate).toHaveBeenCalledWith('tx1', { _synced: 1 });
  });

  it('addTx online com erro de upsert: toast warning', async function() {
    mockUpsert.mockResolvedValueOnce({ error: new Error('x') });
    const { hook, toast } = makeHook();
    await act(async function() { await hook.result.current.addTx(makeTx()); });
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('sincroniza'), 'warning');
  });

  it('addTx online com exception no upsert: toast warning', async function() {
    mockUpsert.mockRejectedValueOnce(new Error('x'));
    const { hook, toast } = makeHook();
    await act(async function() { await hook.result.current.addTx(makeTx()); });
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('sincroniza'), 'warning');
  });

  it('editTx online: syncUpdate com payload e _synced 1', async function() {
    const { hook } = makeHook();
    await act(async function() { await hook.result.current.addTx(makeTx()); });
    mockSbUpdate.mockClear();
    mockUpdate.mockClear();
    await act(async function() { await hook.result.current.editTx('tx1', makeTx({ desc: 'Nova', amount: '200' })); });
    expect(mockSbUpdate).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith('tx1', { _synced: 1 });
  });

  it('deleteTx online: syncDelete e remove do dexie', async function() {
    const { hook } = makeHook();
    await act(async function() { await hook.result.current.addTx(makeTx()); });
    mockSbDelete.mockClear();
    mockDelete.mockClear();
    await act(async function() { await hook.result.current.deleteTx('tx1'); });
    expect(mockSbDelete).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith('tx1');
  });
});
