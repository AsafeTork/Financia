import React, { useState, useCallback, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { flushSync } from 'react-dom';
import { INIT_BRAND, INIT_PLAN, atLimit, limitFor, effectivePlan } from './lib/constants.js';
import { useTx } from './hooks/useTx.js';
import { useProducts } from './hooks/useProducts.js';
import { useLosses } from './hooks/useLosses.js';
import { useSession } from './hooks/useSession.js';
import useBrandAppearance from './hooks/useBrandAppearance.js';
import Sidebar from './components/Sidebar.jsx';
import BottomNav from './components/BottomNav.jsx';
import Header from './components/Header.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import Toast from './components/Toast.jsx';
import Offline from './components/Offline.jsx';
import Confirm from './components/Confirm.jsx';
import SyncBadge from './components/SyncBadge.jsx';
import UpgradeModal from './components/UpgradeModal.jsx';
import UpdateBanner from './components/UpdateBanner.jsx';
import Onboarding from './components/Onboarding.jsx';
import { PageSkeleton } from './components/ui.jsx';
import Login from './views/Login.jsx';

const Landing       = lazy(function() { return import('./views/Landing.jsx'); });
const Dashboard     = lazy(function() { return import('./views/Dashboard.jsx'); });
const TxView        = lazy(function() { return import('./views/TxView.jsx'); });
const InventoryView = lazy(function() { return import('./views/InventoryView.jsx'); });
const ReportView    = lazy(function() { return import('./views/ReportView.jsx'); });
const EmailView     = lazy(function() { return import('./views/EmailView.jsx'); });
const SettingsView  = lazy(function() { return import('./views/SettingsView.jsx'); });
const PlansView      = lazy(function() { return import('./views/PlansView.jsx'); });
const PrivacyPolicy  = lazy(function() { return import('./views/PrivacyPolicy.jsx'); });
const TermsOfService = lazy(function() { return import('./views/TermsOfService.jsx'); });
const BrandStudioView = lazy(function() { return import('./brandStudio/BrandStudioView.jsx'); });

const VALID_VIEWS = ['dashboard','income','expense','inventory','email','report','settings','planos','brandstudio'];
const hashView = function() { const h = window.location.hash.replace('#',''); return VALID_VIEWS.includes(h) ? h : 'dashboard'; };
const isLandingPreview = function() { return window.location.hash.replace('#','') === 'landing'; };
const isLegalPage = function() { var h = window.location.hash.replace('#',''); return h === 'privacidade' || h === 'termos'; };

var noop = function() {};

function Loader({ text }) {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-3" style={{background:'var(--bg-page)'}}>
      <div className="w-10 h-10 border-2 border-gray-200 rounded-full animate-spin" style={{borderTopColor:'var(--brand)'}}/>
      {text && <p className="text-sm text-gray-400">{text}</p>}
    </div>
  );
}

export default function App() {
  const [session, setSession]           = useState(null);
  const [isAdminDB, setIsAdminDB]       = useState(sessionStorage.getItem('is_admin') === '1');
  const [appLoading, setAppLoading]     = useState(true);
  const [dataLoading, setDataLoading]   = useState(false);
  const [dataError, setDataError]       = useState(null);
  const [brand, setBrand]               = useState(INIT_BRAND);
  const [planInfo, setPlanInfo]         = useState(INIT_PLAN);
  const [syncStatus, setSyncStatus]     = useState('idle');
  const [view, setView]                 = useState(hashView);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [toasts, setToasts]             = useState([]);
  const [confirmData, setConfirmData]   = useState(null);
  const [showLogin, setShowLogin]       = useState(false);
  const [showUpgrade, setShowUpgrade]   = useState(false);
  const [onboardingNeeded, setOnboardingNeeded] = useState(false);
  const onboardingRef                   = useRef(null); // null=indeciso, true/false=decidido
  const toastId                         = useRef(0);

  var { appBrand, effectiveTheme, toggleTheme } = useBrandAppearance(brand, planInfo);

  const navTo = useCallback(function(v) {
    var go = function() { setView(v); window.location.hash = v; };
    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(function() { flushSync(go); });
    } else {
      go();
    }
  }, []);

  // Aplica data-plan no <html> para ativar as CSS vars de tema por plano.
  // Muda instantaneamente quando o plano muda (sem refresh).
  useEffect(function() {
    var plan = effectivePlan(planInfo);
    var el = document.documentElement;
    el.setAttribute('data-plan', plan);
    // Toast elegante quando o plano muda
    if (plan !== 'free' && session) {
      var prev = el.getAttribute('data-plan-prev');
      if (prev && prev !== plan) {
        var msg = plan === 'premium'
          ? 'Seu plano foi atualizado para Premium. Sua experiencia executiva ja esta disponivel.'
          : 'Seu plano foi atualizado para Pro. Sua nova experiencia ja esta disponivel.';
        toast(msg, 'success');
      }
      el.setAttribute('data-plan-prev', plan);
    } else {
      el.setAttribute('data-plan-prev', plan);
    }
  }, [planInfo, session]);

  // Tema customizado só dentro da área logada; login/landing ficam no padrão.
  useEffect(function() {
    document.documentElement.setAttribute('data-theme', session ? effectiveTheme : 'light');
  }, [effectiveTheme, session]);

  useEffect(function() {
    if (!dataLoading) return;
    var t = setTimeout(function() { setDataLoading(false); setSyncStatus('idle'); }, 25000);
    return function() { clearTimeout(t); };
  }, [dataLoading]);

  useEffect(function() {
    var onHash = function() { setView(hashView()); };
    window.addEventListener('hashchange', onHash);
    return function() { window.removeEventListener('hashchange', onHash); };
  }, []);

  // Decisao de onboarding (nome/telefone). Corrige o loop telefone<->dashboard:
  // - so decide com o perfil ja carregado (dataLoading === false);
  // - telefone tratado por digitos (com ou sem +);
  // - regra monotonica: pode sumir (true->false) quando o telefone chega ou o
  //   usuario conclui, mas NUNCA reaparece (false->true) por causa de um sync.
  useEffect(function() {
    if (!session) { onboardingRef.current = null; setOnboardingNeeded(false); return; }
    if (dataLoading) return;
    var meta2 = session.user.user_metadata || {};
    var gName = meta2.full_name || meta2.name || '';
    var doneFlag = !!localStorage.getItem('financia_onboarded_' + session.user.id);
    var needName = !!gName && brand.name === gName;
    // Telefone NAO bloqueia mais a renderizacao do app. O usuario navega normalmente
    // e informa o telefone depois em Configuracoes (Supabase sincroniza em segundo plano).
    var needs = !doneFlag && needName;
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
    setTimeout(function() {
      setToasts(function(list) { return list.filter(function(t) { return t.id !== id; }); });
    }, type === 'error' ? 4000 : 3000);
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

  // Registra callback global para StripeCheckout forcar recarga do plano
  // apos pagamento confirmado. Sem isso, o plano nunca atualiza na UI.
  useEffect(function() {
    if (typeof window === 'undefined') return;
    window.__financia_reload_plan = function() {
      if (session && session.user && session.user.id && navigator.onLine) {
        loadData(session.user.id);
      }
    };
    return function() { delete window.__financia_reload_plan; };
  }, [session, loadData]);

  // Handlers como useCallback — PRECISAM vir antes dos early returns
  // para nao violar as regras dos hooks (React error #310).
  const handleCloseSidebar   = useCallback(function() { setSidebarOpen(false); }, []);
  const handleOpenSidebar    = useCallback(function() { setSidebarOpen(true); }, []);
  const handleUpgrade        = useCallback(function() { navTo('planos'); }, [navTo]);
  const handleDeductStock    = useCallback(function(id, qty) { adjustStock(id, -qty); }, [adjustStock]);
  const handleConfirmOk      = useCallback(function() { confirmData.onOk(); setConfirmData(null); }, [confirmData]);
  const handleCancel         = useCallback(function() { setConfirmData(null); }, []);
  const handleCloseUpgrade   = useCallback(function() { setShowUpgrade(false); }, []);
  const handleNav            = useCallback(function(v) { navTo(v); }, [navTo]);

  // p precisa vir antes dos early returns para nao violar rules-of-hooks
  const p = useMemo(function() {
    return {brand:appBrand, toast:toast, confirm:confirm};
  }, [appBrand, toast, confirm]);

  var uid = session ? session.user.id : '';
  var currentView = (view === 'email' && !isAdminDB) ? 'dashboard' : view;

  const views = useMemo(function() {
    return {
      dashboard: React.createElement(Dashboard, {tx:tx, products:products, brand:appBrand, onNav:navTo, planInfo:planInfo, lossesCount:losses.length, onUpgrade:handleUpgrade}),
      income:    React.createElement(TxView, Object.assign({type:'income', tx:tx, products:products, onAdd:addTx, onEdit:editTx, onDelete:deleteTx, onDeductStock:handleDeductStock, planInfo:planInfo, onNav:navTo}, p)),
      expense:   React.createElement(TxView, Object.assign({type:'expense', tx:tx, products:products, onAdd:addTx, onEdit:editTx, onDelete:deleteTx, onDeductStock:noop, onAddGenerated:addGenerated, uid:uid, planInfo:planInfo, onNav:navTo}, p)),
      inventory: React.createElement(InventoryView, Object.assign({products:products, losses:losses, onAddProduct:addProduct, onEditProduct:editProduct, onDeleteProduct:deleteProduct, onAddLoss:addLoss, onEditLoss:editLoss, onDeleteLoss:deleteLoss, onAdjustStock:adjustStock, planInfo:planInfo, onNav:navTo}, p)),
      email:     React.createElement(EmailView, {brand:appBrand, toast:toast}),
      report:    React.createElement(ReportView, {tx:tx, brand:appBrand, toast:toast, onNav:navTo, planInfo:planInfo}),
      settings:  React.createElement(SettingsView, {brand:appBrand, session:session, planInfo:planInfo, onSave:saveBrand, onSavePhone:savePhone, toast:toast, confirm:confirm, isAdmin:isAdminDB, onNav:navTo}),
      planos:    React.createElement(PlansView, {brand:appBrand, planInfo:planInfo, toast:toast, onNav:navTo, isAdmin:isAdminDB}),
      brandstudio: React.createElement(BrandStudioView, {brand:appBrand, planInfo:planInfo, onSave:saveBrand, toast:toast, onNav:navTo}),
    };
  }, [tx, products, appBrand, navTo, planInfo, losses, handleUpgrade, p, addTx, editTx, deleteTx, handleDeductStock, addGenerated, uid, addProduct, editProduct, deleteProduct, addLoss, editLoss, deleteLoss, adjustStock, toast, confirm, session, saveBrand, savePhone, isAdminDB]);

  if (appLoading) return <Loader/>;

  // Páginas legais — acessíveis sem autenticação
  if (isLegalPage()) {
    var legalHash = window.location.hash.replace('#','');
    return (
      <Suspense fallback={<Loader/>}>
        {legalHash === 'privacidade' ? <PrivacyPolicy/> : <TermsOfService/>}
      </Suspense>
    );
  }

  if (isLandingPreview()) {
    return (
      <Suspense fallback={<Loader/>}>
        <Landing brand={brand} onEnter={function() { window.location.hash = ''; setShowLogin(true); }}/>
      </Suspense>
    );
  }
  if (!session) {
    var seen = !!localStorage.getItem('financia_seen');
    if (!seen && !showLogin) {
      return (
        <Suspense fallback={<Loader/>}>
          <Landing brand={brand} onEnter={function() { setShowLogin(true); }}/>
        </Suspense>
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

  var meta = session.user.user_metadata || {};
  var googleName = meta.full_name || meta.name || '';
  var needsName = !!googleName && brand.name === googleName;
  var needsPhone = false;
  if (onboardingNeeded) {
    var finishOnboarding = function(data) {
      var tasks = [];
      if (needsName && data.name) {
        var nb = Object.assign({}, brand, {name: data.name});
        tasks.push(Promise.resolve(saveBrand(nb)));
      }
      if (data.phone) tasks.push(Promise.resolve(savePhone(data.phone)));
      return Promise.all(tasks).then(function() {
        localStorage.setItem('financia_onboarded_' + uid, '1');
        onboardingRef.current = false;
        setOnboardingNeeded(false);
      });
    };
    return <Onboarding brand={brand} needsName={needsName} needsPhone={needsPhone} onSave={finishOnboarding}/>;
  }

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{background:'var(--bg-page)'}}>
      <Offline/>
      <UpdateBanner brand={appBrand}/>
      <SyncBadge status={syncStatus}/>
      <Sidebar view={view} onNav={navTo} brand={appBrand} open={sidebarOpen} isAdmin={isAdminDB} onClose={handleCloseSidebar}/>
      <div className="hidden lg:block fixed top-4 right-4 z-30">
        <ThemeToggle theme={effectiveTheme} onToggle={toggleTheme} variant="floating"/>
      </div>
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0 w-full">
        <Header brand={appBrand} syncStatus={syncStatus} theme={effectiveTheme} onToggleTheme={toggleTheme} onMenuOpen={handleOpenSidebar}/>
        <main className="flex-1 p-4 lg:p-8 max-w-2xl w-full mx-auto pb-24 lg:pb-8 min-w-0 overflow-x-hidden">
          <Suspense fallback={<PageSkeleton/>}>
            {views[currentView]}
          </Suspense>
        </main>
      </div>
      <BottomNav view={view} onNav={navTo} brand={appBrand}/>
      <Toast toasts={toasts} onDismiss={dismissToast}/>
      {confirmData && <Confirm msg={confirmData.msg} onOk={handleConfirmOk} onCancel={handleCancel}/>}
      {showUpgrade && <UpgradeModal reason={typeof showUpgrade === 'object' ? showUpgrade : null} brand={appBrand} onClose={handleCloseUpgrade} onNav={handleNav}/>}
    </div>
  );
}
