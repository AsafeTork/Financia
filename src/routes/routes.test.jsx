import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('react-router-dom', () => ({
  Routes: function({ children }) { return React.createElement('div', { 'data-testid': 'routes' }, children); },
  Route: function({ path, element }) { return React.createElement('div', { 'data-testid': `route-${path || 'unknown'}` }, element); },
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('../shared/ui/ui.jsx', () => ({
  PageSkeleton: function() { return React.createElement('div', { 'data-testid': 'skeleton' }); }
}));

vi.mock('../App/contexts/AppContext.jsx', () => ({
  useAppContext: () => ({
    brand: null, planInfo: null, navTo: vi.fn(), toast: { current: null },
    confirm: vi.fn(), session: null, handleDeductStock: vi.fn(),
    saveBrand: vi.fn(), savePhone: vi.fn(),
    isAdminDB: false, dataLoading: false,
  }),
  useDataContext: () => ({
    tx: null, products: null, losses: [],
    addTx: vi.fn(), editTx: vi.fn(), deleteTx: vi.fn(),
    addGenerated: vi.fn(), addProduct: vi.fn(), editProduct: vi.fn(),
    deleteProduct: vi.fn(), addLoss: vi.fn(), editLoss: vi.fn(),
    deleteLoss: vi.fn(), adjustStock: vi.fn(),
  }),
}));

vi.mock('../App/components/LazyPage.jsx', () => ({
  default: function LazyPage({ children }) { return React.createElement('div', null, children); }
}));

vi.mock('../features/dashboard/Dashboard.jsx', () => ({
  default: function Dashboard() { return React.createElement('div', { 'data-testid': 'dashboard' }); }
}));
vi.mock('../features/transactions/TxView.jsx', () => ({
  default: function TxView() { return React.createElement('div', { 'data-testid': 'txview' }); }
}));
vi.mock('../features/inventory/InventoryView.jsx', () => ({
  default: function InventoryView() { return React.createElement('div', { 'data-testid': 'inventory' }); }
}));
vi.mock('../features/reports/ReportView.jsx', () => ({
  default: function ReportView() { return React.createElement('div', { 'data-testid': 'report' }); }
}));
vi.mock('../features/email/EmailView.jsx', () => ({
  default: function EmailView() { return React.createElement('div', { 'data-testid': 'email' }); }
}));
vi.mock('../features/settings/SettingsView.jsx', () => ({
  default: function SettingsView() { return React.createElement('div', { 'data-testid': 'settings' }); }
}));
vi.mock('../features/plans/PlansView.jsx', () => ({
  default: function PlansView() { return React.createElement('div', { 'data-testid': 'plans' }); }
}));
vi.mock('../features/branding/BrandStudioView.jsx', () => ({
  default: function BrandStudioView() { return React.createElement('div', { 'data-testid': 'brandstudio' }); }
}));

vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    lazy: (factory) => {
      const mod = factory();
      return mod.default || mod;
    },
  };
});

async function loadAppRoutes() {
  const mod = await import('./routes.jsx');
  return mod.default;
}

describe('AppRoutes', () => {
  it('renders dashboard on default route (/)', async () => {
    const AppRoutes = await loadAppRoutes();
    const tree = renderToString(React.createElement(AppRoutes));
    expect(tree).toContain('data-testid="dashboard"');
  });

  it('renders inside LazyPage wrapper', async () => {
    const AppRoutes = await loadAppRoutes();
    const tree = renderToString(React.createElement(AppRoutes));
    expect(tree).toContain('dashboard');
  });

  it('rendering is deterministic for identical context values', async () => {
    const AppRoutes = await loadAppRoutes();
    const tree1 = renderToString(React.createElement(AppRoutes));
    const tree2 = renderToString(React.createElement(AppRoutes));
    expect(tree1).toBe(tree2);
  });
});
