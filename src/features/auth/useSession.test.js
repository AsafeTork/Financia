// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSession } from './useSession.js';
import { INIT_BRAND, INIT_PLAN } from '../../lib/constants.js';

const syncAllMock = vi.fn();
const loadFromLocalMock = vi.fn();
const fetchRoleMock = vi.fn();

const dataByTable = {};
const rowsByTable = {};

vi.mock('../../lib/supabase.js', function() {
  const qb = {
    select: function() { return this; },
    order: function() { return this; },
    eq: function() { return this; },
    gt: function() { return this; },
    lt: function() { return this; },
    limit: function() {
      const t = this.__table;
      const rows = rowsByTable[t] || [];
      return Promise.resolve({ data: rows, error: null });
    },
    maybeSingle: function() {
      const t = this.__table;
      if (dataByTable[t] !== undefined) return Promise.resolve({ data: dataByTable[t], error: null });
      return Promise.resolve({ data: null, error: null });
    },
  };
  return {
    sb: {
      from: vi.fn(function(table) {
        const b = Object.create(qb);
        b.__table = table;
        return b;
      }),
      removeChannel: vi.fn(function() {}),
      channel: vi.fn(function() { return { on: function() { return this; }, subscribe: function() { return this; } }; }),
      auth: { setSession: vi.fn(async function() { return { error: null }; }) },
    },
    __setRows: function(table, rows) { rowsByTable[table] = rows; },
    __setProfile: function(p) { dataByTable['company_profiles'] = p; },
    __setRole: function(r) { dataByTable['user_roles'] = r; },
  };
});

vi.mock('../../lib/dexie.js', function() {
  return {
    ldb: {
      profiles: { put: vi.fn(async function() {}), get: vi.fn(), update: vi.fn() },
      products: { bulkPut: vi.fn(async function() {}) },
      transactions: { bulkPut: vi.fn(async function() {}) },
      losses: { bulkPut: vi.fn(async function() {}) },
      meta: { put: vi.fn(async function() {}), get: vi.fn() },
    },
    toLocal: function(row, extra) { return Object.assign({}, row, extra || {}); },
    setLastSync: vi.fn(async function() {}),
  };
});

vi.mock('../../lib/sync.js', function() {
  return { syncAll: function() { return syncAllMock.apply(this, arguments); } };
});

vi.mock('../../lib/utils.js', function() {
  return { now: function() { return '2026-01-01T00:00:00.000Z'; } };
});

vi.mock('./useAuthBootstrap.js', function() {
  return { useAuthBootstrap: vi.fn(function() {}) };
});

vi.mock('../../shared/hooks/useDataLoader.js', function() {
  return {
    useDataLoader: vi.fn(function() {
      return { loadFromLocal: function() { return loadFromLocalMock.apply(this, arguments); }, fetchRole: function() { return fetchRoleMock.apply(this, arguments); } };
    }),
  };
});

vi.mock('../../shared/hooks/useSyncLoop.js', function() {
  return { useSyncLoop: vi.fn(function() { return { runSync: vi.fn(function() {}) }; }) };
});

vi.mock('../../shared/hooks/useRealtime.js', function() {
  return { useRealtime: vi.fn(function() {}) };
});

vi.mock('../../shared/hooks/useBrandManager.js', function() {
  return { useBrandManager: vi.fn(function() { return { saveBrand: vi.fn(function() {}), savePhone: vi.fn(function() {}) }; }) };
});

vi.mock('./useImpersonation.js', function() {
  return { useImpersonation: vi.fn(function() {}) };
});

import { sb, __setRows, __setProfile, __setRole } from '../../lib/supabase.js';
import { ldb } from '../../lib/dexie.js';
import { setLastSync } from '../../lib/dexie.js';

function makeProps() {
  let brand = INIT_BRAND, planInfo = INIT_PLAN, products = [], tx = [], losses = [];
  return {
    p: {
      setSession: vi.fn(),
      setAppLoading: vi.fn(),
      toast: vi.fn(),
      setDataLoading: vi.fn(),
      setDataError: vi.fn(),
      setSyncStatus: vi.fn(),
      setIsAdminDB: vi.fn(),
      setBrand: vi.fn(function(u) { brand = typeof u === 'function' ? u(brand) : u; }),
      setPlanInfo: vi.fn(function(u) { planInfo = typeof u === 'function' ? u(planInfo) : u; }),
      setProducts: vi.fn(function(u) { products = typeof u === 'function' ? u(products) : u; }),
      setTx: vi.fn(function(u) { tx = typeof u === 'function' ? u(tx) : u; }),
      setLosses: vi.fn(function(u) { losses = typeof u === 'function' ? u(losses) : u; }),
    },
    getState: function() { return { brand: brand, planInfo: planInfo, products: products, tx: tx, losses: losses }; },
  };
}

function makeHook() {
  const made = makeProps();
  const hook = renderHook(function() { return useSession(made.p); });
  return { hook: hook, p: made.p, getState: made.getState };
}

describe('useSession', function() {
  beforeEach(function() {
    vi.useFakeTimers();
    var _onLine = true;
    Object.defineProperty(navigator, 'onLine', { get: function() { return _onLine; }, set: function(v) { _onLine = v; }, configurable: true });
    syncAllMock.mockReset();
    syncAllMock.mockResolvedValue({ ok: true, changed: false });
    loadFromLocalMock.mockReset();
    loadFromLocalMock.mockResolvedValue(undefined);
    fetchRoleMock.mockReset();
    fetchRoleMock.mockResolvedValue(false);
    sessionStorage.removeItem('is_admin');
    __setProfile(null);
    __setRole(null);
    __setRows('products', null);
    __setRows('transactions', null);
    __setRows('losses', null);
    Object.keys(dataByTable).forEach(function(k) { delete dataByTable[k]; });
    Object.keys(rowsByTable).forEach(function(k) { delete rowsByTable[k]; });
    ldb.profiles.put.mockClear();
    ldb.products.bulkPut.mockClear();
    ldb.transactions.bulkPut.mockClear();
    ldb.losses.bulkPut.mockClear();
    setLastSync.mockClear();
  });

  afterEach(function() {
    vi.useRealTimers();
  });

  it('retorna saveBrand, savePhone e loadData', function() {
    const { hook } = makeHook();
    expect(typeof hook.result.current.loadData).toBe('function');
    expect(typeof hook.result.current.saveBrand).toBe('function');
    expect(typeof hook.result.current.savePhone).toBe('function');
    hook.unmount();
  });

  it('caminho feliz online: sincroniza, status ok, admin false', async function() {
    const { hook, p } = makeHook();
    await act(async function() { await hook.result.current.loadData('u1'); });
    expect(loadFromLocalMock).toHaveBeenCalledWith('u1');
    expect(syncAllMock).toHaveBeenCalledWith('u1');
    expect(fetchRoleMock).toHaveBeenCalledWith('u1');
    expect(p.setSyncStatus).toHaveBeenCalledWith('syncing');
    expect(p.setSyncStatus).toHaveBeenCalledWith('ok');
    expect(p.setIsAdminDB).toHaveBeenCalledWith(false);
    expect(sessionStorage.getItem('is_admin')).toBeNull();
    act(function() { vi.advanceTimersByTime(3000); });
    expect(p.setSyncStatus).toHaveBeenCalledWith('idle');
    hook.unmount();
  });

  it('quando changed=true, recarrega local apos sync', async function() {
    syncAllMock.mockResolvedValue({ ok: true, changed: true });
    const { hook } = makeHook();
    await act(async function() { await hook.result.current.loadData('u1'); });
    expect(loadFromLocalMock).toHaveBeenCalledTimes(2);
    act(function() { vi.advanceTimersByTime(3000); });
    hook.unmount();
  });

  it('falha de sync -> status error e depois idle', async function() {
    syncAllMock.mockResolvedValue({ ok: false, changed: false });
    const { hook, p } = makeHook();
    await act(async function() { await hook.result.current.loadData('u1'); });
    expect(p.setSyncStatus).toHaveBeenCalledWith('error');
    act(function() { vi.advanceTimersByTime(5000); });
    expect(p.setSyncStatus).toHaveBeenCalledWith('idle');
    hook.unmount();
  });

  it('admin true -> marca sessionStorage is_admin', async function() {
    fetchRoleMock.mockImplementation(function() {
      sessionStorage.setItem('is_admin', '1');
      return Promise.resolve(true);
    });
    const { hook, p } = makeHook();
    await act(async function() { await hook.result.current.loadData('u1'); });
    expect(p.setIsAdminDB).toHaveBeenCalledWith(true);
    expect(sessionStorage.getItem('is_admin')).toBe('1');
    act(function() { vi.advanceTimersByTime(3000); });
    hook.unmount();
  });

  it('offline feliz: nao sincroniza e nao da erro', async function() {
    navigator.onLine = false;
    const { hook, p } = makeHook();
    await act(async function() { await hook.result.current.loadData('u1'); });
    expect(syncAllMock).not.toHaveBeenCalled();
    expect(fetchRoleMock).not.toHaveBeenCalled();
    expect(p.setDataError).not.toHaveBeenCalledWith('Sem conexão e sem dados locais. Conecte-se pelo menos uma vez.');
    expect(p.setSyncStatus).not.toHaveBeenCalledWith('syncing');
    hook.unmount();
  });

  it('offline sem dados locais -> mensagem de erro', async function() {
    navigator.onLine = false;
    loadFromLocalMock.mockRejectedValueOnce(new Error('no local'));
    const { hook, p } = makeHook();
    await act(async function() { await hook.result.current.loadData('u1'); });
    expect(p.setDataError).toHaveBeenCalledWith('Sem conexão e sem dados locais. Conecte-se pelo menos uma vez.');
    expect(p.setDataLoading).toHaveBeenCalledWith(false);
    hook.unmount();
  });

  it('online com load local falho -> fallback remoto com profile e dados', async function() {
    loadFromLocalMock.mockRejectedValueOnce(new Error('idb broken'));
    const prof = { name: 'Loja X', logo: 'L', color: '#112233', color_secondary: '#aabbcc', color_accent: '#445566', theme: 'light', logo_url: null, phone: '91999999999', white_label: false, niche: '', visual_version: 0, custom_palette: false, brand_config: null, plan: 'pro', plan_expires_at: '2099-01-01', plan_activated_by: null };
    __setProfile(prof);
    __setRole({ role: 'admin' });
    __setRows('products', [{ id: 'p1', name: 'Prod', price: 10 }]);
    __setRows('transactions', [{ id: 't1', description: 'Venda', category: 'vendas', amount: 100, date: '2026-01-01' }]);
    __setRows('losses', [{ id: 'l1', description: 'Perda', qty: 2, date: '2026-01-01' }]);
    const { hook, p, getState } = makeHook();
    await act(async function() { await hook.result.current.loadData('u1'); });
    expect(ldb.profiles.put).toHaveBeenCalled();
    expect(ldb.products.bulkPut).toHaveBeenCalled();
    expect(ldb.transactions.bulkPut).toHaveBeenCalled();
    expect(ldb.losses.bulkPut).toHaveBeenCalled();
    expect(setLastSync).toHaveBeenCalled();
    const st = getState();
    expect(st.brand.name).toBe('Loja X');
    expect(st.brand.color).toBe('#112233');
    expect(st.planInfo.plan).toBe('pro');
    expect(st.tx[0].desc).toBe('Venda');
    expect(st.losses[0].desc).toBe('Perda');
    expect(p.setIsAdminDB).toHaveBeenCalledWith(true);
    expect(sessionStorage.getItem('is_admin')).toBeNull();
    expect(p.setSyncStatus).toHaveBeenCalledWith('error');
    act(function() { vi.advanceTimersByTime(5000); });
    hook.unmount();
  });

  it('fallback remoto sem profile: mantem estado atual', async function() {
    loadFromLocalMock.mockRejectedValueOnce(new Error('idb broken'));
    __setProfile(null);
    __setRole({ role: null });
    const { hook, p, getState } = makeHook();
    await act(async function() { await hook.result.current.loadData('u1'); });
    expect(ldb.profiles.put).not.toHaveBeenCalled();
    expect(ldb.products.bulkPut).not.toHaveBeenCalled();
    const st = getState();
    expect(st.brand).toEqual(INIT_BRAND);
    expect(st.planInfo).toEqual(INIT_PLAN);
    expect(st.tx).toEqual([]);
    expect(p.setIsAdminDB).toHaveBeenCalledWith(false);
    act(function() { vi.advanceTimersByTime(5000); });
    hook.unmount();
  });

  it('fallback remoto com falha de rede -> erro de carga', async function() {
    loadFromLocalMock.mockRejectedValueOnce(new Error('idb broken'));
    __setProfile(null);
    __setRows('products', [{ id: 'p1' }]);
    sb.from.mockImplementationOnce(function() {
      const qb = {
        select: function() { return qb; },
        order: function() { return qb; },
        eq: function() { return qb; },
        gt: function() { return qb; },
        lt: function() { return qb; },
        limit: function() { return Promise.reject(new Error('network down')); },
        maybeSingle: function() { return Promise.reject(new Error('network down')); },
      };
      return qb;
    });
    const { hook, p } = makeHook();
    await act(async function() { await hook.result.current.loadData('u1'); });
    expect(p.setDataError).toHaveBeenCalledWith('Erro ao carregar dados.');
    act(function() { vi.advanceTimersByTime(5000); });
    hook.unmount();
  });

  it('syncAll que lanca cai no fallback remoto tambem', async function() {
    syncAllMock.mockRejectedValue(new Error('sync crash'));
    __setProfile(null);
    __setRole(null);
    const { hook, p } = makeHook();
    await act(async function() { await hook.result.current.loadData('u1'); });
    expect(p.setDataError).not.toHaveBeenCalledWith('Erro ao carregar dados.');
    act(function() { vi.advanceTimersByTime(5000); });
    hook.unmount();
  });
});
