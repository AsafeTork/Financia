import React, { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { INIT_BRAND, INIT_PLAN, atLimit, limitFor, effectivePlan } from './lib/constants.js';
import { useTx } from './features/transactions/useTx.js';
import { useProducts } from './features/inventory/useProducts.js';
import { useLosses } from './features/inventory/useLosses.js';
import { useSession } from './features/auth/useSession.js';
import useBrandAppearance from './shared/hooks/useBrandAppearance.js';
import Sidebar from './shared/ui/Sidebar.jsx';
import BottomNav from './shared/ui/BottomNav.jsx';
import Header from './shared/ui/Header.jsx';
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

const Landing       = lazy(function() { return import('./features/landing/Landing.jsx'); });
const PrivacyPolicy  = lazy(function() { return import('./features/landing/PrivacyPolicy.jsx'); });
const TermsOfService = lazy(function() { return import('./features/landing/TermsOfService.jsx'); });

function Loader({ text }) {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-3" style={{background:'var(--bg-page)'}}>
      <div className="w-10 h-10 border-2 border-gray-200 rounded-full animate-spin" style={{borderTopColor:'var(--brand)'}}/>
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.replace(/^\//, '');
  const isLegal = path === 'privacidade' || path === 'termos';
  const isLanding = path === 'landing';

  const [session, setSession]           = useState(null);
  const [isAdminDB, setIsAdminDB]       = useState(sessionStorage.getItem('is_admin') === '1');
  const [appLoading, setAppLoading]     = useState(true);
  const [dataLoading, setDataLoading]   = useState(false);
  const [dataError, setDataError]       = useState(null);
  const [brand, setBrand]               = useState(INIT_BRAND);
  const [planInfo, setPlanInfo]         = useState(INIT_PLAN);
  const [syncStatus, setSyncStatus]     = useState('idle');
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [toasts, setToasts]             = useState([]);
  const [confirmData, setConfirmData]   = useState(null);
  const [showLogin, setShowLogin]       = useState(false);
  const [showUpgrade, setShowUpgrade]   = useState(false);
  const [onboardingNeeded, setOnboardingNeeded] = useState(false);
  const onboardingRef                   = useRef(null);
  const toastId                         = useRef(0);
  const toastTimeoutsRef                = useRef([]);
  const modalRef                        = useRef({ confirmData, showUpgrade, sidebarOpen, showLogin });
  modalRef.current = { confirmData, showUpgrade, sidebarOpen, showLogin };

  const { appBrand, effectiveTheme, toggleTheme } = useBrandAppearance(brand, planInfo);

  const navTo = useCallback(function(v) {
    const go = function() { navigate('/' + v); };
    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(function() { flushSync(go); });
    } else {
      go();
    }
  }, [navigate]);

  useEffect(function() {
    const plan = effectivePlan(planInfo);
    const el = document.documentElement;
    el.setAttribute('data-plan', plan);
    if (plan !== 'free' && session) {
      const prev = el.getAttribute('data-plan-prev');
      if (prev && prev !== plan) {
        const msg = plan === 'premium'
          ? 'Seu plano foi atualizado para Premium. Sua experiencia executiva ja esta disponivel.'
          : 'Seu plano foi atualizado para Pro. Sua nova experiencia ja esta disponivel.';
        toast(msg, 'success');
      }
      el.setAttribute('data-plan-prev', plan);
    } else {
      el.setAttribute('data-plan-prev', plan);
    }
  }, [planInfo, session, toast]);

  useEffect(function() {
    document.documentElement.setAttribute('data-theme', session ? effectiveTheme : 'light');
  }, [effectiveTheme, session]);

  useEffect(function() {
    if (!dataLoading) return;
    var t = setTimeout(function() { setDataLoading(false); setSyncStatus('idle'); }, 25000);
    return function() { clearTimeout(t); };
  }, [dataLoading]);

  useEffect(function() {
    let buffer = [];
    let timer = null;
    const routes = { d:'dashboard', t:'income', i:'inventory', s:'settings', r:'report', p:'planos' };

    function help() {
      const msg = 'Atalhos: g+d Dashboard, g+t Transações, g+i Estoque, g+s Config, g+r Relatórios, g+p Planos, ? Ajuda, Esc Fechar';
      if (typeof window.showToast === 'function') { window.showToast(msg, 'info'); }
      else { window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: msg, type: 'info' } })); }
    }

    function onKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable) return;
      const key = e.key.toLowerCase();

      if (key === 'escape') {
        const m = modalRef.current;
        if (m.confirmData) { setConfirmData(null); return; }
        if (m.showUpgrade) { setShowUpgrade(false); return; }
        if (m.sidebarOpen) { setSidebarOpen(false); return; }
        if (m.showLogin) { setShowLogin(false); return; }
        return;
      }
      if (key === '?') { e.preventDefault(); help(); return; }

      if (key === 'g') {
        e.preventDefault();
        clearTimeout(timer);
        buffer.push('g');
        timer = setTimeout(function() { buffer = []; }, 1000);
        return;
      }

      if (buffer.length === 1 && buffer[0] === 'g') {
        clearTimeout(timer);
        buffer = [];
        const hash = routes[key];
        if (hash) { e.preventDefault(); navigate('/' + hash); }
        return;
      }
      buffer = [];
    }

    document.addEventListener('keydown', onKeyDown);
    return function() { document.removeEventListener('keydown', onKeyDown); };
  }, [navigate]);

  useEffect(function() {
    if (!session) { onboardingRef.current = null; setOnboardingNeeded(false); return; }
    if (dataLoading) return;
    const meta2 = session.user.user_metadata || {};
    const gName = meta2.full_name || meta2.name || '';
    const doneFlag = !!localStorage.getItem('financia_onboarded_' + session.user.id);
    const needName = !!gName && brand.name === gName;
    const needs = !doneFlag && needName;
    if (onboardingRef.current === null) {
      onboardingRef.current = needs;
      setOnboardingNeeded(needs);
    } else if (onboardingRef.current === true && !needs) {
      onboardingRef.current = false;
      setOnboardingNeeded(false);
    }
  }, [session, dataLoading, brand]);

  const dismissToast = useCallback(function(id) {
    setToasts(function(list) { return list.filter(function(t) { return t.id !== id; }); });
  }, []);

  const toast = useCallback(function(msg, type) {
    if (!type) type = 'success';
    var id = ++toastId.current;
    setToasts(function(list) { return list.concat([{id:id, msg:msg, type:type}]); });
    var tid = setTimeout(function() {
      toastTimeoutsRef.current = toastTimeoutsRef.current.filter(function(t) { return t !== tid; });
      setToasts(function(list) { return list.filter(function(t) { return t.id !== id; }); });
    }, type === 'error' ? 4000 : 3000);
    toastTimeoutsRef.current.push(tid);
  }, []);

  useEffect(function() {
    return function() {
      toastTimeoutsRef.current.forEach(function(tid) { clearTimeout(tid); });
      toastTimeoutsRef.current = [];
    };
  }, []);

  const confirm = useCallback(function(msg, onOk) { setConfirmData({msg:msg, onOk:onOk}); }, []);

  const enforceLimit = useCallback(function(kind, currentCount) {
    if (atLimit(planInfo, kind, currentCount)) {
      setShowUpgrade({ kind: kind, limit: limitFor(planInfo, kind) });
      return false;
    }
    return true;
  }, [planInfo]);

  const {tx, setTx, addTx, addGenerated, editTx, deleteTx}                              = useTx(session, enforceLimit, toast);
  const {products, setProducts, addProduct, editProduct, deleteProduct, adjustStock}    = useProducts(session, enforceLimit, toast);
  const {losses, setLosses, addLoss, editLoss, deleteLoss}                             = useLosses(session, enforceLimit, toast);

  const {saveBrand, savePhone, loadData} = useSession({
    toast, session, setSession,
    isAdminDB, setIsAdminDB,
    setAppLoading, setDataLoading, setDataError,
    setBrand, setPlanInfo, setSyncStatus,
    setTx, setProducts, setLosses,
  });

const loadDataRef = useRef(loadData);
loadDataRef.current = loadData;

  useEffect(function() {
    if (typeof window === 'undefined') return;
    window.__financia_reload_plan = function() {
      if (session && session.user && session.user.id && navigator.onLine) {
        loadDataRef.current(session.user.id);
      }
    };
    return function() { delete window.__financia_reload_plan; };
  }, [session]);

  const handleCloseSidebar   = useCallback(function() { setSidebarOpen(false); }, []);
  const handleOpenSidebar    = useCallback(function() { setSidebarOpen(true); }, []);
  const handleDeductStock    = useCallback(function(id, qty) { adjustStock(id, -qty); }, [adjustStock]);
  const handleConfirmOk      = useCallback(async function() { await confirmData.onOk(); setConfirmData(null); }, [confirmData]);
  const handleCancel         = useCallback(function() { setConfirmData(null); }, []);
  const handleCloseUpgrade   = useCallback(function() { setShowUpgrade(false); }, []);
  const handleNav            = useCallback(function(v) { navTo(v); }, [navTo]);

const sessionViews = ['dashboard','income','expense','inventory','email','report','settings','planos','brandstudio'];
const currentView = sessionViews.includes(path) ? path : 'dashboard';

  if (appLoading) return <Loader/>;

  if (isLegal) {
    return (
      <FeatureErrorBoundary featureName="Legal">
        <Suspense fallback={<Loader/>}>
          {path === 'privacidade' ? <PrivacyPolicy/> : <TermsOfService/>}
        </Suspense>
      </FeatureErrorBoundary>
    );
  }

  if (isLanding) {
    return (
      <FeatureErrorBoundary featureName="Landing">
        <Suspense fallback={<Loader/>}>
          <Landing brand={brand} onEnter={function() { navigate('/'); setShowLogin(true); }}/>
        </Suspense>
      </FeatureErrorBoundary>
    );
  }

  if (!session) {
    const seen = !!localStorage.getItem('financia_seen');
    if (!seen && !showLogin) {
      return (
        <FeatureErrorBoundary featureName="Landing">
          <Suspense fallback={<Loader/>}>
            <Landing brand={brand} onEnter={function() { setShowLogin(true); }}/>
          </Suspense>
        </FeatureErrorBoundary>
      );
    }
    return <Login brand={brand}/>;
  }

  if (dataLoading) return <Loader text="Carregando seus dados..."/>;
  if (dataError) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-6" style={{background:'var(--bg-page)'}}>
      <span className="text-4xl">(!)</span>
      <p className="text-sm font-semibold text-gray-700">{dataError}</p>
      <button onClick={function() { loadData(session.user.id); }} className="px-6 py-2.5 text-white rounded-xl text-sm font-semibold bg-green-600">Tentar novamente</button>
    </div>
  );

  const meta = session.user.user_metadata || {};
  const googleName = meta.full_name || meta.name || '';
  const needsName = !!googleName && brand.name === googleName;
  let needsPhone = false;
  if (onboardingNeeded) {
    const finishOnboarding = function(data) {
      const tasks = [];
      if (needsName && data.name) {
        const nb = Object.assign({}, brand, {name: data.name});
        tasks.push(Promise.resolve(saveBrand(nb)));
      }
      if (data.phone) tasks.push(Promise.resolve(savePhone(data.phone)));
      return Promise.all(tasks).then(function() {
        localStorage.setItem('financia_onboarded_' + session.user.id, '1');
        onboardingRef.current = false;
        setOnboardingNeeded(false);
      });
    };
    return <Onboarding brand={brand} needsName={needsName} needsPhone={needsPhone} onSave={finishOnboarding}/>;
  }

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{background:'var(--bg-page)'}}>
      <Offline/>
      <WidgetErrorBoundary><UpdateBanner brand={appBrand}/></WidgetErrorBoundary>
      <SyncBadge status={syncStatus}/>
      <WidgetErrorBoundary><Sidebar view={currentView} onNav={navTo} brand={appBrand} open={sidebarOpen} isAdmin={isAdminDB} onClose={handleCloseSidebar}/></WidgetErrorBoundary>
      <div className="hidden lg:block fixed top-4 right-4 z-30">
        <ThemeToggle theme={effectiveTheme} onToggle={toggleTheme} variant="floating"/>
      </div>
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 w-full">
        <WidgetErrorBoundary><Header brand={appBrand} syncStatus={syncStatus} theme={effectiveTheme} onToggleTheme={toggleTheme} onMenuOpen={handleOpenSidebar}/></WidgetErrorBoundary>
        <main className="flex-1 p-4 lg:p-8 max-w-2xl w-full mx-auto pb-24 lg:pb-8 min-w-0 overflow-x-hidden">
          <FeatureErrorBoundary featureName={currentView} key={location.pathname}>
            <AppRoutes tx={tx} products={products} losses={losses} brand={appBrand} planInfo={planInfo}
              onNav={navTo} toast={toast} confirm={confirm} uid={session.user.id}
              addTx={addTx} editTx={editTx} deleteTx={deleteTx} addGenerated={addGenerated}
              onDeductStock={handleDeductStock}
              addProduct={addProduct} editProduct={editProduct} deleteProduct={deleteProduct}
              addLoss={addLoss} editLoss={editLoss} deleteLoss={deleteLoss} adjustStock={adjustStock}
              saveBrand={saveBrand} savePhone={savePhone} session={session} isAdmin={isAdminDB}
              dataLoading={dataLoading}/>
          </FeatureErrorBoundary>
        </main>
      </div>
      <WidgetErrorBoundary><BottomNav view={currentView} onNav={navTo} brand={appBrand}/></WidgetErrorBoundary>
      <Toast toasts={toasts} onDismiss={dismissToast}/>
      {confirmData && <Confirm msg={confirmData.msg} onOk={handleConfirmOk} onCancel={handleCancel}/>}
      {showUpgrade && <UpgradeModal reason={typeof showUpgrade === 'object' ? showUpgrade : null} brand={appBrand} onClose={handleCloseUpgrade} onNav={handleNav}/>}
    </div>
  );
}
