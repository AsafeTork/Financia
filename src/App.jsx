import React, { useCallback, useRef, useMemo, lazy, useEffect } from 'react';
import { prefetchRoutes } from './lib/prefetch.js';
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
import CommandPalette from './shared/ui/CommandPalette.jsx';
import ThemeToggle from './shared/ui/ThemeToggle.jsx';
import Toast from './shared/ui/Toast.jsx';
import Offline from './shared/ui/Offline.jsx';
import Confirm from './shared/ui/Confirm.jsx';
import SyncBadge from './shared/ui/SyncBadge.jsx';
import UpgradeModal from './shared/ui/UpgradeModal.jsx';
import UpdateBanner from './shared/ui/UpdateBanner.jsx';
import Onboarding from './shared/ui/Onboarding.jsx';
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
  const [authMode, setAuthMode] = React.useState('login');
  const [commandOpen, setCommandOpen] = React.useState(false);
  const { planInfo, setPlanInfo, setShowUpgrade, setConfirmData, confirmData, setSidebarOpen, setShowLogin, sidebarOpen } = s;
  const t = useToasts({ toasts: s.toasts, setToasts: s.setToasts, toastId: s.toastId, toastTimeoutsRef: s.toastTimeoutsRef });
  const n = useNavigation({ modalRef: s.modalRef, setConfirmData: s.setConfirmData, setShowUpgrade: s.setShowUpgrade, setSidebarOpen: s.setSidebarOpen, setShowLogin: s.setShowLogin });
  const { navTo, path: navigationPath } = n;
  useEffect(function() {
    if (!s.session) return undefined;
    var onKeyDown = function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return function() { document.removeEventListener('keydown', onKeyDown); };
  }, [s.session]);
  usePlanEffects({ dataLoading: s.dataLoading, setDataLoading: s.setDataLoading, setSyncStatus: s.setSyncStatus, planInfo, session: s.session, toast: t.toast, path: n.path, setAnnounceMsg: s.setAnnounceMsg, firstRender: s.firstRender, toastTimeoutsRef: s.toastTimeoutsRef });
  useEffect(function() { var t = setTimeout(prefetchRoutes, 1000); return function() { clearTimeout(t); }; }, []);
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
  const { saveBrand, savePhone, loadData } = useSession(sessionProps);
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
  const handleOpenCommand = useCallback(function() { setCommandOpen(true); }, []);
  const handleDeductStock = useCallback(function(id, qty) { adjustStock(id, -qty); }, [adjustStock]);
  const handleNav = useCallback(function(v) { navTo(v); }, [navTo]);
  const openAuth = useCallback(function(mode) {
    setAuthMode(mode);
    if (navigationPath === 'landing') navTo('');
    setShowLogin(true);
  }, [navigationPath, navTo, setShowLogin]);
  const openLogin = useCallback(function() { openAuth('login'); }, [openAuth]);
  const openSignup = useCallback(function() { openAuth('signup'); }, [openAuth]);

  const commandActions = useMemo(function() {
    return [
      { id:'dashboard', label:'Abrir Dashboard', description:'Resumo financeiro e próximos passos', onAction:function() { navTo('dashboard'); } },
      { id:'income', label:'Abrir Vendas / Ganhos', description:'Registrar e consultar vendas', onAction:function() { navTo('income'); } },
      { id:'expense', label:'Abrir Despesas', description:'Registrar e consultar despesas', onAction:function() { navTo('expense'); } },
      { id:'inventory', label:'Abrir Estoque e Perdas', description:'Produtos, estoque e perdas', onAction:function() { navTo('inventory'); } },
      { id:'report', label:'Abrir Relatório', description:'Acompanhar resultados do negócio', onAction:function() { navTo('report'); } },
      { id:'settings', label:'Abrir Configurações', description:'Conta, assinatura e preferências', onAction:function() { navTo('settings'); } },
      { id:'plans', label:'Ver Planos', description:'Comparar recursos e fazer upgrade', onAction:function() { navTo('planos'); } },
    ];
  }, [navTo]);

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
  if (n.isLanding) return <FeatureErrorBoundary featureName="Landing"><LazyPage fallback={<Loader/>}><Landing brand={s.brand} onEnter={openLogin} onSignup={openSignup} onNav={n.navTo}/></LazyPage></FeatureErrorBoundary>;
  if (!s.session) {
    if (s.showLogin) return <Login brand={s.brand} initialMode={authMode} onNav={n.navTo}/>;
    const seen = !!localStorage.getItem('financia_seen');
    if (!seen) return <FeatureErrorBoundary featureName="Landing"><LazyPage fallback={<Loader/>}><Landing brand={s.brand} onEnter={openLogin} onSignup={openSignup} onNav={n.navTo}/></LazyPage></FeatureErrorBoundary>;
    return <Login brand={s.brand} initialMode="login" onNav={n.navTo}/>;
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
        <div className="app-shell min-h-screen flex overflow-x-hidden" style={{background:'var(--bg-page)'}}>
          <a href="#main-content" onClick={function(e){e.preventDefault();var el=document.getElementById('main-content');if(el){el.setAttribute('tabindex','-1');el.focus();el.scrollIntoView();}}} className="skip-link">Pular para conteúdo</a>
          <Offline/><WidgetErrorBoundary><UpdateBanner brand={appBrand}/></WidgetErrorBoundary><LazyPage fallback={null}><DebugBadge/></LazyPage><SyncBadge status={s.syncStatus}/>
          <WidgetErrorBoundary><Sidebar view={n.currentView} onNav={n.navTo} brand={appBrand} open={s.sidebarOpen} isAdmin={s.isAdminDB} onClose={handleCloseSidebar}/></WidgetErrorBoundary>
           <div className="hidden lg:flex fixed top-4 right-4 z-30 items-center gap-2">
             <button type="button" data-testid="desktop-search" onClick={handleOpenCommand} aria-label="Abrir busca" title="Abrir busca (Ctrl+K)"
               className="w-11 h-11 rounded-xl flex items-center justify-center transition hover:opacity-80"
               style={{background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-sub)', boxShadow:'var(--shadow-sm)'}}>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
               </svg>
             </button>
             <ThemeToggle theme={effectiveTheme} onToggle={toggleTheme} variant="floating"/>
           </div>
          <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 w-full">
            <WidgetErrorBoundary><Header brand={appBrand} syncStatus={s.syncStatus} theme={effectiveTheme} onToggleTheme={toggleTheme} onMenuOpen={handleOpenSidebar} onOpenSearch={handleOpenCommand}/></WidgetErrorBoundary>
            <main id="main-content" tabIndex="-1" className="flex-1 p-4 lg:p-8 lg:pt-24 max-w-5xl w-full mx-auto pb-28 lg:pb-8 min-w-0 overflow-x-hidden">
              <div key={n.currentView} className="anim-page-view">
                <FeatureErrorBoundary featureName={n.currentView}><AppRoutes/></FeatureErrorBoundary>
              </div>
            </main>
            <Footer brand={appBrand} onNav={handleNav}/>
          </div>
          <WidgetErrorBoundary><BottomNav view={n.currentView} onNav={n.navTo} brand={appBrand} isAdmin={s.isAdminDB}/></WidgetErrorBoundary>
            <WidgetErrorBoundary><QuickActions view={n.currentView} onNav={n.navTo} brand={appBrand}/></WidgetErrorBoundary>
            <CommandPalette isOpen={commandOpen} onClose={function() { setCommandOpen(false); }} actions={commandActions}/>
            <Toast toasts={s.toasts} onDismiss={t.dismissToast}/>
          {s.confirmData && <Confirm msg={s.confirmData.msg} onOk={handleConfirmOk} onCancel={handleCancel}/>}
          {s.showUpgrade && <UpgradeModal reason={typeof s.showUpgrade === 'object' ? s.showUpgrade : null} brand={appBrand} onClose={handleCloseUpgrade} onNav={handleNav}/>}
          <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{s.announceMsg}</div>
        </div>
      </DataProvider>
    </AppProvider>
  );
}
