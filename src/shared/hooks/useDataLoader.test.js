import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataLoader } from './useDataLoader.js';
import { INIT_BRAND, INIT_PLAN } from '../../lib/constants.js';

const profilesGetMock = vi.fn();
const productsWhereMock = vi.fn();
const transactionsWhereMock = vi.fn();
const lossesWhereMock = vi.fn();
const metaGetMock = vi.fn();
const metaPutMock = vi.fn();
const transactionsBulkPutMock = vi.fn();
const getRecurringMock = vi.fn();
const pendingRecurringMock = vi.fn();
const periodOfMock = vi.fn();
const maybeSingleMock = vi.fn();

vi.mock('../../lib/dexie.js', function() {
  return {
    ldb: {
      profiles: { get: function() { return profilesGetMock.apply(this, arguments); } },
      products: { where: function() { return productsWhereMock.apply(this, arguments); } },
      transactions: { where: function() { return transactionsWhereMock.apply(this, arguments); }, bulkPut: function() { return transactionsBulkPutMock.apply(this, arguments); } },
      losses: { where: function() { return lossesWhereMock.apply(this, arguments); } },
      meta: { get: function() { return metaGetMock.apply(this, arguments); }, put: function() { return metaPutMock.apply(this, arguments); } },
    },
    toLocal: function(x) { return x; },
    setLastSync: vi.fn(function() { return Promise.resolve(); }),
  };
});

vi.mock('../../lib/recurring.js', function() {
  return {
    getRecurring: function() { return getRecurringMock.apply(this, arguments); },
    pendingRecurring: function() { return pendingRecurringMock.apply(this, arguments); },
    periodOf: function() { return periodOfMock.apply(this, arguments); },
  };
});

vi.mock('../../lib/supabase.js', function() {
  return {
    sb: {
      from: vi.fn(function() {
        return { select: function() { return { eq: function() { return { maybeSingle: function() { return maybeSingleMock.apply(this, arguments); } }; } }; } };
      }),
    },
  };
});

function chainWhere(result) {
  return {
    equals: function() {
      return {
        sortBy: vi.fn(async function() { return result; }),
        reverse: function() { return { sortBy: vi.fn(async function() { return result; }) }; },
      };
    },
    between: function() {
      return { toArray: vi.fn(async function() { return result; }) };
    },
  };
}

function makeHook() {
  let brand = Object.assign({}, INIT_BRAND);
  let planInfo = Object.assign({}, INIT_PLAN);
  let products = [];
  let tx = [];
  let losses = [];
  const setters = {
    setBrand: vi.fn(function(u) { brand = typeof u === 'function' ? u(brand) : u; }),
    setPlanInfo: vi.fn(function(u) { planInfo = typeof u === 'function' ? u(planInfo) : u; }),
    setProducts: vi.fn(function(u) { products = typeof u === 'function' ? u(products) : u; }),
    setTx: vi.fn(function(u) { tx = typeof u === 'function' ? u(tx) : u; }),
    setLosses: vi.fn(function(u) { losses = typeof u === 'function' ? u(losses) : u; }),
    setIsAdminDB: vi.fn(),
  };
  const hook = renderHook(function() { return useDataLoader(Object.assign({}, setters)); });
  return {
    hook: hook,
    setters: setters,
    getState: function() { return { brand: brand, planInfo: planInfo, products: products, tx: tx, losses: losses }; },
    seed: function(s) {
      if (s.products !== undefined) products = s.products;
      if (s.tx !== undefined) tx = s.tx;
      if (s.losses !== undefined) losses = s.losses;
      if (s.brand !== undefined) brand = s.brand;
    },
  };
}

describe('useDataLoader — loadFromLocal', function() {
  beforeEach(function() {
    profilesGetMock.mockResolvedValue(null);
    productsWhereMock.mockReturnValue(chainWhere([]));
    transactionsWhereMock.mockReturnValue(chainWhere([]));
    lossesWhereMock.mockReturnValue(chainWhere([]));
    metaGetMock.mockResolvedValue(null);
    getRecurringMock.mockResolvedValue([]);
    pendingRecurringMock.mockResolvedValue([]);
    periodOfMock.mockReturnValue('2026-01');
    transactionsBulkPutMock.mockResolvedValue(undefined);
  });

  it('caminho feliz: carrega profile, mapeia desc/cat e define admin false', async function() {
    profilesGetMock.mockResolvedValue({ name: 'Loja X', logo: 'L', color: '#112233', color_secondary: null, color_accent: null, theme: 'dark', logo_url: null, phone: '91', white_label: false, niche: '', visual_version: 1, custom_palette: false, brand_config: null, plan: 'free' });
    productsWhereMock.mockReturnValue(chainWhere([{ id: 'p1', name: 'Prod', stock: 5 }]));
    transactionsWhereMock.mockReturnValue(chainWhere([{ id: 't1', description: 'Venda', category: 'vendas', amount: 10, date: '2026-01-01' }]));
    lossesWhereMock.mockReturnValue(chainWhere([{ id: 'l1', description: 'Perda', qty: 2, date: '2026-01-01' }]));
    metaGetMock.mockResolvedValue({ val: 'user' });
    const { hook, setters, getState } = makeHook();
    await act(async function() { await hook.result.current.loadFromLocal('u1'); });
    const st = getState();
    expect(st.brand.name).toBe('Loja X');
    expect(st.brand.theme).toBe('dark');
    expect(st.planInfo.plan).toBe('free');
    expect(st.products).toEqual([{ id: 'p1', name: 'Prod', stock: 5 }]);
    expect(st.tx[0].desc).toBe('Venda');
    expect(st.tx[0].cat).toBe('vendas');
    expect(st.losses[0].desc).toBe('Perda');
    expect(setters.setIsAdminDB).toHaveBeenCalledWith(false);
  });

  it('sem profile: brand e planInfo nao mudam', async function() {
    const { hook, getState } = makeHook();
    await act(async function() { await hook.result.current.loadFromLocal('u1'); });
    const st = getState();
    expect(st.brand).toEqual(INIT_BRAND);
    expect(st.planInfo).toEqual(INIT_PLAN);
  });

  it('role admin: setIsAdminDB true', async function() {
    metaGetMock.mockResolvedValue({ val: 'admin' });
    const { hook, setters } = makeHook();
    await act(async function() { await hook.result.current.loadFromLocal('u1'); });
    expect(setters.setIsAdminDB).toHaveBeenCalledWith(true);
  });

  it('transacoes recorrentes pendentes sao persistidas e incluidas', async function() {
    getRecurringMock.mockResolvedValue([{ desc: 'Aluguel', amount: 1000, day: 5 }]);
    pendingRecurringMock.mockResolvedValue([{ id: 'rec-x-2026-01', description: 'Aluguel', category: 'Fixo', qty: null }]);
    const pendRow = { id: 'rec-x-2026-01', description: 'Aluguel', category: 'Fixo' };
    pendingRecurringMock.mockResolvedValue([pendRow]);
    transactionsBulkPutMock.mockResolvedValue(undefined);
    const { hook, getState } = makeHook();
    await act(async function() { await hook.result.current.loadFromLocal('u1'); });
    expect(getRecurringMock).toHaveBeenCalledWith('u1');
    expect(pendingRecurringMock).toHaveBeenCalledWith('u1', expect.any(Array), '2026-01');
    expect(transactionsBulkPutMock).toHaveBeenCalledWith([pendRow]);
    expect(getState().tx[0].id).toBe('rec-x-2026-01');
  });

  it('dados identicos nao substituem referencias de estado', async function() {
    const prevProducts = [{ id: 'p1', name: 'Prod', stock: 5 }];
    const prevTx = [{ id: 't1', desc: 'Venda', cat: 'vendas', amount: 10, date: '2026-01-01' }];
    const prevLosses = [{ id: 'l1', desc: 'Perda', qty: 2 }];
    const ctx = makeHook();
    ctx.seed({ products: prevProducts, tx: prevTx, losses: prevLosses });
    productsWhereMock.mockReturnValue(chainWhere(prevProducts));
    transactionsWhereMock.mockReturnValue(chainWhere(prevTx));
    lossesWhereMock.mockReturnValue(chainWhere(prevLosses));
    await act(async function() { await ctx.hook.result.current.loadFromLocal('u1'); });
    const st = ctx.getState();
    expect(st.products).toBe(prevProducts);
    expect(st.tx).toBe(prevTx);
    expect(st.losses).toBe(prevLosses);
  });

  it('produtos com stock diferente sao substituidos', async function() {
    const prevProducts = [{ id: 'p1', name: 'Prod', stock: 3 }];
    const ctx = makeHook();
    ctx.seed({ products: prevProducts });
    productsWhereMock.mockReturnValue(chainWhere([{ id: 'p1', name: 'Prod', stock: 9 }]));
    await act(async function() { await ctx.hook.result.current.loadFromLocal('u1'); });
    expect(ctx.getState().products[0].stock).toBe(9);
  });
});

describe('useDataLoader — fetchRole', function() {
  beforeEach(function() {
    maybeSingleMock.mockReset();
    metaPutMock.mockResolvedValue(undefined);
  });

  it('role admin: retorna true, persiste e marca sessionStorage', async function() {
    maybeSingleMock.mockResolvedValue({ data: { role: 'admin' }, error: null });
    const { hook } = makeHook();
    let ret;
    await act(async function() { ret = await hook.result.current.fetchRole('u1'); });
    expect(ret).toBe(true);
    expect(metaPutMock).toHaveBeenCalledWith({ key: 'role_u1', val: 'admin' });
    expect(sessionStorage.getItem('is_admin')).toBe('1');
  });

  it('role comum: retorna false e marca sessionStorage 0', async function() {
    maybeSingleMock.mockResolvedValue({ data: { role: 'user' }, error: null });
    const { hook } = makeHook();
    let ret;
    await act(async function() { ret = await hook.result.current.fetchRole('u1'); });
    expect(ret).toBe(false);
    expect(sessionStorage.getItem('is_admin')).toBe('0');
  });

  it('sem role: retorna false e nao persiste', async function() {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
    const { hook } = makeHook();
    let ret;
    await act(async function() { ret = await hook.result.current.fetchRole('u1'); });
    expect(ret).toBe(false);
    expect(metaPutMock).not.toHaveBeenCalled();
  });

  it('timeout de 5s: retorna false', async function() {
    vi.useFakeTimers();
    try {
      maybeSingleMock.mockImplementation(function() { return new Promise(function() {}); });
      const { hook } = makeHook();
      let ret;
      const p = hook.result.current.fetchRole('u1').then(function(v) { ret = v; });
      vi.advanceTimersByTime(5000);
      await p;
      expect(ret).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });
});
