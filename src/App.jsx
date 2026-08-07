import React, { useCallback, useRef, useMemo, lazy, useEffect, useState } from 'react';
import { atLimit, limitFor } from './lib/constants.js';
import { useTx } from './features/transactions/useTx.js';
import { useProducts } from './features/inventory/useProducts.js';
import { useLosses } from './features/inventory/useLosses.js';
import { useSession } from './features/auth/useSession.js';
import useBrandAppearance from './shared/hooks/useBrandAppearance.js';
import Sidebar from './shared/ui/Sidebar.jsx';
import BottomNav from './shared/ui/BottomNav.jsx';
import Header from './shared/ui/Header.jsx';
import Footer from './shared/ui/Footer.jsx';
import QuickActions from './shared/ui/QuickActions.jsx';
import ThemeToggle from './shared/ui/ThemeToggle.jsx';
import Toast from './shared/ui/Toast.jsx';
import Offline from './shared/ui/Offline.jsx';
import Confirm from './shared/ui/Confirm.jsx';
import SyncBadge from './shared/ui/SyncBadge.jsx';
import UpgradeModal from './shared/ui/UpgradeModal.jsx';
import UpdateBanner from './shared/ui/UpdateBanner.jsx';
import Onboarding from './shared/ui/Onboarding.jsx';
import CommandPalette from './shared/ui/CommandPalette.jsx';
import { FeatureErrorBoundary } from './shared/FeatureErrorBoundary.jsx';
import { WidgetErrorBoundary } from './shared/WidgetErrorBoundary.jsx';
import Login from './features/auth/Login.jsx';
import AppRoutes from './routes/routes.jsx';
import Loader from './App/components/Loader.jsx';
import LazyPage from './App/components/LazyPage.jsx';
import { AppProvider, DataProvider } from './App/contexts/AppContext.jsx';
import { useAppState } from './hooks/useAppState.js';
import { useToasts } from './hooks/useToasts.js';
import { useNavigation } from './hooks/useNavigation.js';
import { useOnboarding } from './hooks/useOnboarding.js';
import { usePlanEffects } from './hooks/usePlanEffects.js';

const Landing = lazy(function() { return import('./features/landing/Landing.jsx'); });
const PrivacyPolicy = lazy(function() { return import('./features/landing/PrivacyPolicy.jsx'); });
const TermsOfService = lazy(function() { return import('./features/landing/TermsOfService.jsx'); });
const DebugBadge = lazy(function() { return import('./App/components/DebugBadge.jsx'); });

export default function App() {
  const s = useAppState();
  const { planInfo, setPlanInfo, setShowUpgrade, setConfirmData, confirmData, setSidebarOpen, sidebarOpen } = s;
  const t = useToasts({ toasts: s.toasts, setToasts: s.setToasts, toastId: s.toastId, toastTimeoutsRef: s.toastTimeoutsRef });
  const n = useNavigation({ modalRef: s.modalRef, setConfirmData: s.setConfirmData, setShowUpgrade: s.setShowUpgrade, setSidebarOpen: s.setSidebarOpen, setShowLogin: s.setShowLogin });
  const { navTo } = n;
  usePlanEffects({ dataLoading: s.dataLoading, setDataLoading: s.setDataLoading, setSyncStatus: s.setSyncStatus, planInfo, session: s.session, toast: t.toast, path: n.path, setAnnounceMsg: s.setAnnounceMsg, firstRender: s.firstRender, toastTimeoutsRef: s.toastTimeoutsRef });
  const { appBrand, effectiveTheme, toggleTheme } = useBrandAppearance(s.brand, planInfo);
  const enforceLimit = useCallback(function(kind, currentCount) {
    if (atLimit(planInfo, kind, currentCount)) { setShowUpgrade({ kind: kind, limit: limitFor(planInfo, kind) }); return false; } return true;
  }, [planInfo, setShowUpgrade]);
  const { tx, setTx, addTx, addGenerated, editTx, deleteTx } = useTx(s.session, enforceLimit, t.toast);
  const { products, setProducts, addProduct, editProduct, deleteProduct, adjustStock } = useProducts(s.session, enforceLimit, t.toast);
  const { losses, setLosses, addLoss, editLoss, deleteLoss } = useLosses(s.session, enforceLimit, t.toast);
  const sessionProps = useMemo(function() {
    return { toast: t.toast, session: s.session, setSession: s.setSession, isAdminDB: s.isAdminDB, setIsAdminDB: s.setIsAdminDB,
      setAppLoading: s.setAppLoading, setDataLoading: s.setDataLoading, setDataError: s.setDataError,
      setBrand: s.setBrandStable, setPlanInfo: setPlanInfo, setSyncStatus: s.setSyncStatus,
      setTx: setTx, setProducts: setProducts, setLosses: setLosses };
  }, [t.toast, s.session, s.setSession, s.isAdminDB, s.setIsAdminDB, s.setAppLoading, s.setDataLoading, s.setDataError, s.setBrandStable, setPlanInfo, s.setSyncStatus, setTx, setProducts, setLosses]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const commandActions = useMemo(() => [
    { id: 'nav-dashboard', label: 'Dashboard', description: 'Ir para o dashboard principal', shortcut: '⌘1', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, onAction: () => navTo('') },
    { id: 'nav-income', label: 'Nova Venda', description: 'Registrar nova venda/ganho', shortcut: '⌘N', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 4v16m8-8H4"/></svg>, onAction: () => { navTo('income'); setIsCommandPaletteOpen(false); } },
    { id: 'nav-expense', label: 'Nova Despesa', description: 'Registrar nova despesa', shortcut: '⌘E', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V4m-8 8l8 8 8-8"/></svg>, onAction: () => { navTo('expense'); setIsCommandPaletteOpen(false); } },
    { id: 'nav-inventory', label: 'Estoque', description: 'Gerenciar produtos e estoque', shortcut: '⌘2', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>, onAction: () => { navTo('inventory'); setIsCommandPaletteOpen(false); } },
    { id: 'nav-plans', label: 'Planos', description: 'Ver planos e assinatura', shortcut: '⌘3', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>, onAction: () => { navTo('planos'); setIsCommandPaletteOpen(false); } },
    { id: 'nav-settings', label: 'Configurações', description: 'Ajustar preferências', shortcut: '⌘,', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 21.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 014.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1 1.51"/></svg>, onAction: () => { navTo('settings'); setIsCommandPaletteOpen(false); } },
    { id: 'nav-reports', label: 'Relatórios', description: 'Ver relatórios financeiros', shortcut: '⌘4', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>, onAction: () => { navTo('report'); setIsCommandPaletteOpen(false); } },
    { id: 'toggle-theme', label: 'Alternar Tema', description: 'Mudar entre claro/escuro', shortcut: '⌘D', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>, onAction: toggleTheme },
    { id: 'sync-now', label: 'Sincronizar Agora', description: 'Forçar sync com servidor', shortcut: '⌘S', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>, onAction: () => { /* trigger sync */ } },
  ], [navTo, toggleTheme]);

  const handleGlobalKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setIsCommandPaletteOpen(true);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);
  const loadDataRef = useRef(loadData); loadDataRef.current = loadData;
  useEffect(function() {
    if (typeof window === 'undefined') return;
    window.__financia_reload_plan = function() { if (s.session && s.session.user && s.session.user.id && navigator.onLine) loadDataRef.current(s.session.user.id); };
    return function() { delete window.__financia_reload_plan; };
  }, [s.session]);
  const o = useOnboarding({ session: s.session, dataLoading: s.dataLoading, brand: s.brand, setOnboardingNeeded: s.setOnboardingNeeded, onboardingRef: s.onboardingRef, saveBrand, savePhone });
  const handleConfirmOk = useCallback(async function() { await confirmData.onOk(); setConfirmData(null); }, [confirmData, setConfirmData]);
  const handleCancel = useCallback(function() { setConfirmData(null); }, [setConfirmData]);
  const handleCloseUpgrade = useCallback(function() { setShowUpgrade(false); }, [setShowUpgrade]);
  const handleCloseSidebar = useCallback(function() { setSidebarOpen(false); }, [setSidebarOpen]);
  const handleOpenSidebar = useCallback(function() { setSidebarOpen(true); }, [setSidebarOpen]);
  const handleDeductStock = useCallback(function(id, qty) { adjustStock(id, -qty); }, [adjustStock]);
  const handleNav = useCallback(function(v) { navTo(v); }, [navTo]);

  var confirmFn = useCallback(function(msg, onOk) { setConfirmData({msg:msg, onOk:onOk}); }, [setConfirmData]);

  const stableCtx = useMemo(function() {
    return {
      session: s.session, setSession: s.setSession,
      isAdminDB: s.isAdminDB, setIsAdminDB: s.setIsAdminDB,
      appLoading: s.appLoading, setAppLoading: s.setAppLoading,
      dataLoading: s.dataLoading, setDataLoading: s.setDataLoading,
      dataError: s.dataError, setDataError: s.setDataError,
      brand: s.brand, setBrand: s.setBrand, setBrandStable: s.setBrandStable,
      planInfo, setPlanInfo,
      syncStatus: s.syncStatus, setSyncStatus: s.setSyncStatus,
      toasts: s.toasts, setToasts: s.setToasts,
      confirmData, setConfirmData,
      showLogin: s.showLogin, setShowLogin: s.setShowLogin,
      showUpgrade: s.showUpgrade, setShowUpgrade,
      onboardingNeeded: s.onboardingNeeded, setOnboardingNeeded: s.setOnboardingNeeded,
      announceMsg: s.announceMsg, setAnnounceMsg: s.setAnnounceMsg,
      sidebarOpen, setSidebarOpen,
      appBrand, effectiveTheme, toggleTheme,
      toast: t.toast, dismissToast: t.dismissToast,
      confirm: confirmFn,
      handleConfirmOk, handleCancel, handleCloseUpgrade, handleNav, handleCloseSidebar, handleOpenSidebar, handleDeductStock,
      saveBrand, savePhone, loadData, enforceLimit,
      navTo,
    };
  }, [
    s.session, s.setSession,
    s.isAdminDB, s.setIsAdminDB,
    s.appLoading, s.setAppLoading,
    s.dataLoading, s.setDataLoading,
    s.dataError, s.setDataError,
    s.brand, s.setBrand, s.setBrandStable,
    planInfo, setPlanInfo,
    s.syncStatus, s.setSyncStatus,
    s.toasts, s.setToasts,
    confirmData, setConfirmData,
    s.showLogin, s.setShowLogin,
    s.showUpgrade, setShowUpgrade,
    s.onboardingNeeded, s.setOnboardingNeeded,
    s.announceMsg, s.setAnnounceMsg,
    sidebarOpen, setSidebarOpen,
    appBrand, effectiveTheme, toggleTheme,
    t.toast, t.dismissToast,
    confirmFn,
    handleConfirmOk, handleCancel, handleCloseUpgrade, handleNav, handleCloseSidebar, handleOpenSidebar, handleDeductStock,
    saveBrand, savePhone, loadData, enforceLimit,
    navTo,
  ]);

  const dataCtx = useMemo(function() {
    return {
      tx, setTx, addTx, addGenerated, editTx, deleteTx,
      products, setProducts, addProduct, editProduct, deleteProduct,
      losses, setLosses, addLoss, editLoss, deleteLoss, adjustStock,
    };
  }, [tx, setTx, addTx, addGenerated, editTx, deleteTx, products, setProducts, addProduct, editProduct, deleteProduct, losses, setLosses, addLoss, editLoss, deleteLoss, adjustStock]);

  if (s.appLoading) return <Loader/>;
  if (n.isLegal) return <FeatureErrorBoundary featureName="Legal"><LazyPage fallback={<Loader/>}>{n.path === 'privacidade' ? <PrivacyPolicy onNav={n.navTo}/> : <TermsOfService onNav={n.navTo}/>}</LazyPage></FeatureErrorBoundary>;
  if (n.isLanding) return <FeatureErrorBoundary featureName="Landing"><LazyPage fallback={<Loader/>}><Landing brand={s.brand} onEnter={function() { n.navTo(''); s.setShowLogin(true); }} onNav={n.navTo}/></LazyPage></FeatureErrorBoundary>;
  if (!s.session) {
    const seen = !!localStorage.getItem('financia_seen');
    if (!seen && !s.showLogin) return <FeatureErrorBoundary featureName="Landing"><LazyPage fallback={<Loader/>}><Landing brand={s.brand} onEnter={function() { s.setShowLogin(true); }} onNav={n.navTo}/></LazyPage></FeatureErrorBoundary>;
    return <Login brand={s.brand} onNav={n.navTo}/>;
  }
  if (s.dataLoading) return <Loader text="Carregando seus dados..."/>;
  if (s.dataError) return <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6" style={{background:'var(--bg-page)'}}><span className="text-4xl">(!)</span><p className="text-sm font-semibold text-gray-700">{s.dataError}</p><button onClick={function() { loadData(s.session.user.id); }} className="px-6 py-2.5 text-white rounded-xl text-sm font-semibold bg-green-600">Tentar novamente</button></div>;

  const meta = s.session.user.user_metadata || {};
  const googleName = meta.full_name || meta.name || '';
  const needsName = !!googleName && s.brand.name === googleName;
  let needsPhone = false;
  if (s.onboardingNeeded) { const finishOnboarding = function(data) { o.finishOnboarding(data, needsName); }; return <Onboarding brand={s.brand} needsName={needsName} needsPhone={needsPhone} onSave={finishOnboarding} uid={s.session.user.id}/>; }

  return (
    <AppProvider value={stableCtx}>
      <DataProvider value={dataCtx}>
        <div className="min-h-screen flex overflow-x-hidden" style={{background:'var(--bg-page)'}}>
          <a href="#main-content" onClick={function(e){e.preventDefault();var el=document.getElementById('main-content');if(el){el.setAttribute('tabindex','-1');el.focus();el.scrollIntoView();}}} className="skip-link">Pular para conteúdo</a>
          <Offline/><WidgetErrorBoundary><UpdateBanner brand={appBrand}/></WidgetErrorBoundary><LazyPage fallback={null}><DebugBadge/></LazyPage><SyncBadge status={s.syncStatus}/>
          <WidgetErrorBoundary><Sidebar view={n.currentView} onNav={n.navTo} brand={appBrand} open={s.sidebarOpen} isAdmin={s.isAdminDB} onClose={handleCloseSidebar}/></WidgetErrorBoundary>
          <div className="hidden lg:block fixed top-4 right-4 z-30"><ThemeToggle theme={effectiveTheme} onToggle={toggleTheme} variant="floating"/></div>
          <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 w-full">
            <WidgetErrorBoundary><Header brand={appBrand} syncStatus={s.syncStatus} theme={effectiveTheme} onToggleTheme={toggleTheme} onMenuOpen={handleOpenSidebar}/></WidgetErrorBoundary>
            <main id="main-content" tabIndex="-1" className="flex-1 p-4 lg:p-8 max-w-5xl w-full mx-auto pb-8 lg:pb-8 min-w-0 overflow-x-hidden">
              <div key={n.currentView} className="anim-page-view">
                <FeatureErrorBoundary featureName={n.currentView}><AppRoutes/></FeatureErrorBoundary>
              </div>
            </main>
            <Footer brand={appBrand} onNav={handleNav}/>
          </div>
          <WidgetErrorBoundary><BottomNav view={n.currentView} onNav={n.navTo} brand={appBrand} isAdmin={s.isAdminDB}/></WidgetErrorBoundary>
          <WidgetErrorBoundary><QuickActions view={n.currentView} onNav={n.navTo} brand={appBrand}/></WidgetErrorBoundary>
          <Toast toasts={s.toasts} onDismiss={t.dismissToast}/>
          {s.confirmData && <Confirm msg={s.confirmData.msg} onOk={handleConfirmOk} onCancel={handleCancel}/>}
          {s.showUpgrade && <UpgradeModal reason={typeof s.showUpgrade === 'object' ? s.showUpgrade : null} brand={appBrand} onClose={handleCloseUpgrade} onNav={handleNav}/>}
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{s.announceMsg}</div>
          <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} actions={commandActions} />
        </div>
      </DataProvider>
    </AppProvider>
  );
}