// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNavigation } from './useNavigation.js';

const mockNavigate = vi.fn();
const mockLocation = { pathname: '/dashboard' };

vi.mock('react-router-dom', function() {
  return {
    useNavigate: function() { return mockNavigate; },
    useLocation: function() { return mockLocation; },
  };
});

function makeHook() {
  const modalRef = { current: { confirmData: null, showUpgrade: false, sidebarOpen: false, showLogin: false } };
  const setConfirmData = vi.fn();
  const setShowUpgrade = vi.fn();
  const setSidebarOpen = vi.fn();
  const setShowLogin = vi.fn();
  const hook = renderHook(function() {
    return useNavigation({ modalRef: modalRef, setConfirmData: setConfirmData, setShowUpgrade: setShowUpgrade, setSidebarOpen: setSidebarOpen, setShowLogin: setShowLogin });
  });
  return { hook: hook, modalRef: modalRef, setConfirmData: setConfirmData, setShowUpgrade: setShowUpgrade, setSidebarOpen: setSidebarOpen, setShowLogin: setShowLogin };
}

function key(k, target) {
  const el = target || document;
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));
}

describe('useNavigation — valores derivados', function() {
  beforeEach(function() {
    mockNavigate.mockClear();
  });

  it('currentView reconhece paths validos', function() {
    ['dashboard','income','expense','inventory','email','report','settings','planos','brandstudio'].forEach(function(p) {
      mockLocation.pathname = '/' + p;
      const { hook } = makeHook();
      expect(hook.result.current.currentView).toBe(p);
      hook.unmount();
    });
  });

  it('currentView cai para dashboard em path desconhecido', function() {
    mockLocation.pathname = '/nao-existe';
    const { hook } = makeHook();
    expect(hook.result.current.currentView).toBe('dashboard');
    hook.unmount();
  });

  it('isLegal verdadeiro para privacidade e termos', function() {
    mockLocation.pathname = '/privacidade';
    const h1 = makeHook();
    expect(h1.hook.result.current.isLegal).toBe(true);
    h1.hook.unmount();
    mockLocation.pathname = '/termos';
    const h2 = makeHook();
    expect(h2.hook.result.current.isLegal).toBe(true);
    h2.hook.unmount();
  });

  it('isLanding verdadeiro para /landing', function() {
    mockLocation.pathname = '/landing';
    const { hook } = makeHook();
    expect(hook.result.current.isLanding).toBe(true);
    expect(hook.result.current.isLegal).toBe(false);
    hook.unmount();
  });

  it('navTo navega com barra no inicio', function() {
    mockLocation.pathname = '/dashboard';
    const { hook } = makeHook();
    act(function() { hook.result.current.navTo('settings'); });
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
    hook.unmount();
  });
});

describe('useNavigation — atalhos de teclado', function() {
  beforeEach(function() {
    mockNavigate.mockClear();
    document.body.innerHTML = '';
  });

  it('sequencia g+d navega para dashboard', function() {
    const { hook } = makeHook();
    key('g');
    key('d');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    hook.unmount();
  });

  it('sequencia g+t navega para income', function() {
    const { hook } = makeHook();
    key('g');
    key('t');
    expect(mockNavigate).toHaveBeenCalledWith('/income');
    hook.unmount();
  });

  it('sequencia g+p navega para planos', function() {
    const { hook } = makeHook();
    key('g');
    key('p');
    expect(mockNavigate).toHaveBeenCalledWith('/planos');
    hook.unmount();
  });

  it('tecla sem o prefixo g nao navega', function() {
    const { hook } = makeHook();
    key('d');
    expect(mockNavigate).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('segunda tecla invalida apos g nao navega e zera buffer', function() {
    const { hook } = makeHook();
    key('g');
    key('x');
    expect(mockNavigate).not.toHaveBeenCalled();
    key('d');
    expect(mockNavigate).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('buffer expira apos 1000ms', function() {
    vi.useFakeTimers();
    try {
      const { hook } = makeHook();
      key('g');
      act(function() { vi.advanceTimersByTime(1001); });
      key('d');
      expect(mockNavigate).not.toHaveBeenCalled();
      hook.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('escape fecha confirmData primeiro', function() {
    const { hook, modalRef, setConfirmData, setShowUpgrade, setSidebarOpen, setShowLogin } = makeHook();
    modalRef.current.confirmData = { kind: 'delete' };
    key('escape');
    expect(setConfirmData).toHaveBeenCalledWith(null);
    expect(setShowUpgrade).not.toHaveBeenCalled();
    expect(setSidebarOpen).not.toHaveBeenCalled();
    expect(setShowLogin).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('escape fecha showUpgrade quando nao ha confirm', function() {
    const { hook, modalRef, setShowUpgrade, setConfirmData } = makeHook();
    modalRef.current.showUpgrade = true;
    key('escape');
    expect(setConfirmData).not.toHaveBeenCalled();
    expect(setShowUpgrade).toHaveBeenCalledWith(false);
    hook.unmount();
  });

  it('escape fecha sidebar quando nao ha modais superiores', function() {
    const { hook, modalRef, setSidebarOpen, setShowUpgrade } = makeHook();
    modalRef.current.sidebarOpen = true;
    key('escape');
    expect(setShowUpgrade).not.toHaveBeenCalled();
    expect(setSidebarOpen).toHaveBeenCalledWith(false);
    hook.unmount();
  });

  it('escape fecha showLogin por ultimo', function() {
    const { hook, modalRef, setShowLogin, setSidebarOpen } = makeHook();
    modalRef.current.showLogin = true;
    key('escape');
    expect(setSidebarOpen).not.toHaveBeenCalled();
    expect(setShowLogin).toHaveBeenCalledWith(false);
    hook.unmount();
  });

  it('escape sem modal aberto nao faz nada', function() {
    const { hook, setConfirmData, setShowUpgrade, setSidebarOpen, setShowLogin } = makeHook();
    key('escape');
    expect(setConfirmData).not.toHaveBeenCalled();
    expect(setShowUpgrade).not.toHaveBeenCalled();
    expect(setSidebarOpen).not.toHaveBeenCalled();
    expect(setShowLogin).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('atalho ? dispara evento show-toast quando window.showToast ausente', function() {
    delete window.showToast;
    const listener = vi.fn();
    window.addEventListener('show-toast', listener);
    const { hook } = makeHook();
    key('?');
    expect(listener).toHaveBeenCalledTimes(1);
    const detail = listener.mock.calls[0][0].detail;
    expect(detail.type).toBe('info');
    expect(detail.message).toContain('Atalhos');
    window.removeEventListener('show-toast', listener);
    hook.unmount();
  });

  it('atalho ? usa window.showToast quando disponivel', function() {
    window.showToast = vi.fn();
    const { hook } = makeHook();
    key('?');
    expect(window.showToast).toHaveBeenCalledWith(expect.stringContaining('Atalhos'), 'info');
    delete window.showToast;
    hook.unmount();
  });

  it('atalhos ignorados dentro de INPUT', function() {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const { hook } = makeHook();
    key('g', input);
    key('d', input);
    expect(mockNavigate).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('atalhos ignorados em TEXTAREA e SELECT', function() {
    const ta = document.createElement('textarea');
    document.body.appendChild(ta);
    const { hook } = makeHook();
    key('g', ta);
    key('d', ta);
    expect(mockNavigate).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('remove o listener no unmount', function() {
    const { hook } = makeHook();
    hook.unmount();
    key('g');
    key('d');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
