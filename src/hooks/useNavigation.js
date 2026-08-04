import { useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNavigationHistory } from '../shared/hooks/useNavigationHistory.js';

export function useNavigation({ modalRef, setConfirmData, setShowUpgrade, setSidebarOpen, setShowLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname.replace(/^\//, '');
  const isLegal = path === 'privacidade' || path === 'termos';
  const isLanding = path === 'landing';
  const navigationHistory = useNavigationHistory();

  const navTo = useCallback(function(v) {
    navigate('/' + v);
    navigationHistory.push('/' + v, { view: v });
  }, [navigate, navigationHistory]);

  const currentView = ['dashboard','income','expense','inventory','email','report','settings','planos','brandstudio'].includes(path) ? path : 'dashboard';

  const bufferRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(function() {
    function onKeyDown(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable) return;
      const key = e.key.toLowerCase();
      const routes = { d:'dashboard', t:'income', i:'inventory', s:'settings', r:'report', p:'planos' };

      if (key === 'escape') {
        const m = modalRef.current;
        if (m.confirmData) { setConfirmData(null); return; }
        if (m.showUpgrade) { setShowUpgrade(false); return; }
        if (m.sidebarOpen) { setSidebarOpen(false); return; }
        if (m.showLogin) { setShowLogin(false); return; }
        return;
      }
      if (key === '?') {
        e.preventDefault();
        const msg = 'Atalhos: g+d Dashboard, g+t Transa\u00e7\u00f5es, g+i Estoque, g+s Config, g+r Relat\u00f3rios, g+p Planos, ? Ajuda, Esc Fechar';
        if (typeof window.showToast === 'function') { window.showToast(msg, 'info'); }
        else { window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: msg, type: 'info' } })); }
        return;
      }

      if (key === 'g') {
        e.preventDefault();
        clearTimeout(timerRef.current);
        bufferRef.current.push('g');
        timerRef.current = setTimeout(function() { bufferRef.current = []; }, 1000);
        return;
      }

      if (bufferRef.current.length === 1 && bufferRef.current[0] === 'g') {
        clearTimeout(timerRef.current);
        bufferRef.current = [];
        const hash = routes[key];
        if (hash) { e.preventDefault(); navTo(hash); }
        return;
      }
      bufferRef.current = [];
    }

    document.addEventListener('keydown', onKeyDown);
    return function() { document.removeEventListener('keydown', onKeyDown); };
  }, [setConfirmData, setShowUpgrade, setSidebarOpen, setShowLogin, navTo]);

  return { navigate, location, path, isLegal, isLanding, navTo, currentView, navigationHistory };
}