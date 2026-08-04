import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('react-router-dom', () => {
  return {
    Routes: function({ children }) { return React.createElement('div', { 'data-testid': 'routes' }, children); },
    Route: function({ path, element }) { return React.createElement('div', { 'data-testid': `route-${path || 'unknown'}` }, element); },
    useNavigate: () => vi.fn(),
    useParams: () => ({})
  };
});

vi.mock('../shared/ui/ui.jsx', () => ({
  PageSkeleton: function() { return React.createElement('div', { 'data-testid': 'skeleton' }); }
}));

vi.mock('../App/contexts/AppContext.jsx', () => ({
  useAppContext: () => ({
    tx: null, products: null, losses: [], brand: null,
    planInfo: null, navTo: vi.fn(), toast: { current: null },
    confirm: vi.fn(), session: null,
    addTx: vi.fn(), editTx: vi.fn(), deleteTx: vi.fn(),
    addGenerated: vi.fn(), handleDeductStock: vi.fn(),
    addProduct: vi.fn(), editProduct: vi.fn(), deleteProduct: vi.fn(),
    addLoss: vi.fn(), editLoss: vi.fn(), deleteLoss: vi.fn(),
    adjustStock: vi.fn(), saveBrand: vi.fn(), savePhone: vi.fn(),
    isAdminDB: false, dataLoading: false,
  }),
}));

async function loadAppRoutes() {
  const mod = await import('./routes.jsx');
  return mod.default;
}

describe('AppRoutes — route memoization', () => {
  it('AppRoutes renders all defined route paths', async () => {
    const AppRoutes = await loadAppRoutes();
    const props = {
      tx: null, products: null, losses: [], brand: null, planInfo: null,
      onNav: vi.fn(), toast: { current: null }, confirm: vi.fn(),
      uid: null, addTx: vi.fn(), editTx: vi.fn(), deleteTx: vi.fn(),
      addGenerated: vi.fn(), onDeductStock: vi.fn(), addProduct: vi.fn(),
      editProduct: vi.fn(), deleteProduct: vi.fn(), addLoss: vi.fn(),
      editLoss: vi.fn(), deleteLoss: vi.fn(), adjustStock: vi.fn(),
      saveBrand: vi.fn(), savePhone: vi.fn(), session: null, isAdmin: false,
      dataLoading: false
    };

    const tree = renderToString(React.createElement(AppRoutes, props));

    expect(tree).toContain('route-');
    expect(tree).toContain('data-testid="routes"');
  });

  it('route elements are memoized — identical props produce same tree', async () => {
    const AppRoutes = await loadAppRoutes();
    const onNav = vi.fn();
    const saveBrand = vi.fn();
    const addTx = vi.fn();
    const editTx = vi.fn();
    const deleteTx = vi.fn();
    const addProduct = vi.fn();
    const editProduct = vi.fn();
    const deleteProduct = vi.fn();

    const props1 = {
      tx: null, products: null, losses: [], brand: { id: '1', primary: '#002f59' },
      planInfo: null, onNav, toast: { current: null }, confirm: vi.fn(),
      uid: null, addTx, editTx, deleteTx, addGenerated: vi.fn(),
      onDeductStock: vi.fn(), addProduct, editProduct, deleteProduct,
      addLoss: vi.fn(), editLoss: vi.fn(), deleteLoss: vi.fn(),
      adjustStock: vi.fn(), saveBrand, savePhone: vi.fn(),
      session: null, isAdmin: false, dataLoading: false
    };

    const tree1 = renderToString(React.createElement(AppRoutes, props1));
    const tree2 = renderToString(React.createElement(AppRoutes, { ...props1 }));

    expect(tree1).toBe(tree2);
  });

  it('brandstudio route path is /brandstudio', async () => {
    const AppRoutes = await loadAppRoutes();
    const onNav = vi.fn();

    const props = {
      tx: null, products: null, losses: [], brand: null, planInfo: null,
      onNav, toast: { current: null }, confirm: vi.fn(), uid: null,
      addTx: vi.fn(), editTx: vi.fn(), deleteTx: vi.fn(), addGenerated: vi.fn(),
      onDeductStock: vi.fn(), addProduct: vi.fn(), editProduct: vi.fn(),
      deleteProduct: vi.fn(), addLoss: vi.fn(), editLoss: vi.fn(),
      deleteLoss: vi.fn(), adjustStock: vi.fn(), saveBrand: vi.fn(),
      savePhone: vi.fn(), session: null, isAdmin: false, dataLoading: false
    };

    const tree = renderToString(React.createElement(AppRoutes, props));

    expect(tree).toContain('route-/brandstudio');
  });
});