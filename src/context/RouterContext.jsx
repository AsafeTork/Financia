import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const RouterContext = createContext(null);
const VALID_VIEWS = ['dashboard','income','expense','inventory','email','report','settings','planos'];

export function RouterProvider({ children, session, isAdminDB }) {
  const [view, setView] = useState(() => {
    const h = window.location.hash.replace('#', '');
    return VALID_VIEWS.includes(h) ? h : 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navTo = useCallback((v) => {
    const go = () => { setView(v); window.location.hash = v; };
    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(() => { go(); });
    } else {
      go();
    }
  }, []);

  useEffect(() => {
    const onHash = () => { setView(window.location.hash.replace('#', '') || 'dashboard'); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const currentView = (view === 'email' && !isAdminDB) ? 'dashboard' : view;

  return (
    <RouterContext.Provider value={{
      view: currentView,
      rawView: view,
      setView,
      navTo,
      sidebarOpen,
      setSidebarOpen,
      isAdminDB,
    }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}