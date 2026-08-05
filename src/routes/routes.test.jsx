import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';

vi.mock('react-router-dom', () => {
  return {
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' }),
  };
});

vi.mock('../shared/ui/ui.jsx', () => ({
  PageSkeleton: function() { return React.createElement('div', { 'data-testid': 'skeleton' }); }
}));

var mockCtx = {
  tx: null, products: null, losses: [], brand: null,
  planInfo: null, navTo: vi.fn(), toast: { current: null },
  confirm: vi.fn(), session: null,
  handleDeductStock: vi.fn(),
  saveBrand: vi.fn(), savePhone: vi.fn(),
  isAdminDB: false, dataLoading: false,
};

var mockDataCtx = {
  tx: null, products: null, losses: [],
  addTx: vi.fn(), editTx: vi.fn(), deleteTx: vi.fn(),
  addGenerated: vi.fn(),
  addProduct: vi.fn(), editProduct: vi.fn(), deleteProduct: vi.fn(),
  addLoss: vi.fn(), editLoss: vi.fn(), deleteLoss: vi.fn(),
  adjustStock: vi.fn(),
};

vi.mock('../App/contexts/AppContext.jsx', () => ({
  useAppContext: () => mockCtx,
  useDataContext: () => mockDataCtx,
}));

vi.mock('../features/dashboard/Dashboard.jsx', () => ({
  default: function Dashboard() { return React.createElement('div', { 'data-testid': 'dashboard' }, 'Dashboard'); }
}));
vi.mock('../features/transactions/TxView.jsx', () => ({
  default: function TxView(props) { return React.createElement('div', { 'data-testid': `txview-${props.type}` }, 'TxView'); }
}));
vi.mock('../features/inventory/InventoryView.jsx', () => ({
  default: function InventoryView() { return React.createElement('div', { 'data-testid': 'inventory' }, 'Inventory'); }
}));
vi.mock('../features/email/EmailView.jsx', () => ({
  default: function EmailView() { return React.createElement('div', { 'data-testid': 'email' }, 'Email'); }
}));
vi.mock('../features/reports/ReportView.jsx', () => ({
  default: function ReportView() { return React.createElement('div', { 'data-testid': 'report' }, 'Report'); }
}));
vi.mock('../features/settings/SettingsView.jsx', () => ({
  default: function SettingsView() { return React.createElement('div', { 'data-testid': 'settings' }, 'Settings'); }
}));
vi.mock('../features/plans/PlansView.jsx', () => ({
  default: function PlansView() { return React.createElement('div', { 'data-testid': 'planos' }, 'Plans'); }
}));
vi.mock('../features/branding/BrandStudioView.jsx', () => ({
  default: function BrandStudioView() { return React.createElement('div', { 'data-testid': 'brandstudio' }, 'BrandStudio'); }
}));

async function loadAppRoutes() {
  const mod = await import('./routes.jsx');
  return mod.default;
}

describe('AppRoutes — conditional rendering', () => {
  it('renders Dashboard by default (path /)', async () => {
    const AppRoutes = await loadAppRoutes();
    const tree = renderToString(React.createElement(AppRoutes));
    expect(tree).toContain('dashboard');
  });

  it('renderizes only the active route, not all routes', async () => {
    const AppRoutes = await loadAppRoutes();
    const tree = renderToString(React.createElement(AppRoutes));
    expect(tree).toContain('dashboard');
    expect(tree).not.toContain('txview-');
    expect(tree).not.toContain('inventory');
    expect(tree).not.toContain('email');
    expect(tree).not.toContain('settings');
    expect(tree).not.toContain('planos');
    expect(tree).not.toContain('brandstudio');
  });

  it('same props produce same tree (memoization works)', async () => {
    const AppRoutes = await loadAppRoutes();
    const tree1 = renderToString(React.createElement(AppRoutes));
    const tree2 = renderToString(React.createElement(AppRoutes));
    expect(tree1).toBe(tree2);
  });
});
