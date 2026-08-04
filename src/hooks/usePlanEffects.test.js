// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlanEffects } from './usePlanEffects.js';
import { INIT_PLAN } from '../lib/constants.js';

function makeHook(overrides) {
  const setDataLoading = vi.fn();
  const setSyncStatus = vi.fn();
  const toast = vi.fn();
  const setAnnounceMsg = vi.fn();
  const firstRender = { current: true };
  const toastTimeoutsRef = { current: [] };
  const props = Object.assign({
    dataLoading: false,
    setDataLoading: setDataLoading,
    setSyncStatus: setSyncStatus,
    planInfo: INIT_PLAN,
    session: null,
    toast: toast,
    path: 'dashboard',
    setAnnounceMsg: setAnnounceMsg,
    firstRender: firstRender,
    toastTimeoutsRef: toastTimeoutsRef,
  }, overrides || {});
  const hook = renderHook(function() { return usePlanEffects(props); });
  return { hook: hook, props: props, setDataLoading: setDataLoading, setSyncStatus: setSyncStatus, toast: toast, setAnnounceMsg: setAnnounceMsg };
}

describe('usePlanEffects — atributo data-plan', function() {
  beforeEach(function() {
    document.documentElement.removeAttribute('data-plan');
    document.documentElement.removeAttribute('data-plan-prev');
  });

  it('define data-plan conforme plano efetivo', function() {
    makeHook({ planInfo: { plan: 'pro', plan_expires_at: '2099-01-01' } });
    expect(document.documentElement.getAttribute('data-plan')).toBe('pro');
  });

  it('plano expirado cai para free', function() {
    makeHook({ planInfo: { plan: 'pro', plan_expires_at: '2020-01-01' } });
    expect(document.documentElement.getAttribute('data-plan')).toBe('free');
  });

  it('primeira renderizacao com plano pago nao dispara toast de upgrade', function() {
    makeHook({ planInfo: { plan: 'pro', plan_expires_at: '2099-01-01' }, session: { user: { id: 'u1' } } });
    expect(document.documentElement.getAttribute('data-plan-prev')).toBe('pro');
    expect(document.documentElement.getAttribute('data-plan')).toBe('pro');
  });

  it('upgrade para pro dispara toast quando plan muda', function() {
    const h1 = makeHook({ planInfo: { plan: 'free' }, session: { user: { id: 'u1' } } });
    h1.hook.unmount();
    const { hook, toast } = makeHook({ planInfo: { plan: 'pro', plan_expires_at: '2099-01-01' }, session: { user: { id: 'u1' } } });
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('Pro'), 'success');
    hook.unmount();
  });

  it('upgrade para premium dispara toast de premium', function() {
    const h1 = makeHook({ planInfo: { plan: 'free' }, session: { user: { id: 'u1' } } });
    h1.hook.unmount();
    const { hook, toast } = makeHook({ planInfo: { plan: 'premium', plan_expires_at: '2099-01-01' }, session: { user: { id: 'u1' } } });
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('Premium'), 'success');
    hook.unmount();
  });

  it('sem session nao dispara toast de upgrade', function() {
    const h1 = makeHook({ planInfo: { plan: 'free' }, session: null });
    h1.hook.unmount();
    const { hook, toast } = makeHook({ planInfo: { plan: 'pro', plan_expires_at: '2099-01-01' }, session: null });
    expect(toast).not.toHaveBeenCalled();
    hook.unmount();
  });
});

describe('usePlanEffects — timeout de dataLoading', function() {
  beforeEach(function() {
    vi.useFakeTimers();
  });
  afterEach(function() {
    vi.useRealTimers();
  });

  it('quando dataLoading true, zera apos 25s', function() {
    const { setDataLoading, setSyncStatus } = makeHook({ dataLoading: true });
    act(function() { vi.advanceTimersByTime(24999); });
    expect(setDataLoading).not.toHaveBeenCalled();
    act(function() { vi.advanceTimersByTime(1); });
    expect(setDataLoading).toHaveBeenCalledWith(false);
    expect(setSyncStatus).toHaveBeenCalledWith('idle');
  });

  it('quando dataLoading false, nao agenda timeout', function() {
    const { setDataLoading } = makeHook({ dataLoading: false });
    act(function() { vi.advanceTimersByTime(30000); });
    expect(setDataLoading).not.toHaveBeenCalled();
  });
});

describe('usePlanEffects — announce de path', function() {
  beforeEach(function() {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="main-content"></div>';
  });
  afterEach(function() {
    vi.useRealTimers();
  });

  it('primeiro render nao anuncia (firstRender)', function() {
    const { setAnnounceMsg } = makeHook({ path: 'dashboard' });
    expect(setAnnounceMsg).not.toHaveBeenCalled();
  });

  it('mudanca de path anuncia o nome da view e limpa apos 3s', function() {
    const firstRender = { current: true };
    const setAnnounceMsg = vi.fn();
    const props = {
      dataLoading: false, setDataLoading: vi.fn(), setSyncStatus: vi.fn(),
      planInfo: INIT_PLAN, session: null, toast: vi.fn(), path: 'dashboard',
      setAnnounceMsg: setAnnounceMsg, firstRender: firstRender, toastTimeoutsRef: { current: [] },
    };
    const { hook } = renderHook(function() { return usePlanEffects(props); });
    expect(setAnnounceMsg).not.toHaveBeenCalled();
    props.path = 'inventory';
    hook.rerender();
    act(function() { vi.advanceTimersByTime(20); });
    expect(setAnnounceMsg).toHaveBeenCalledWith('Estoque');
    act(function() { vi.advanceTimersByTime(3000); });
    expect(setAnnounceMsg).toHaveBeenCalledWith('');
    hook.unmount();
  });

  it('path desconhecido usa o proprio path como nome', function() {
    const firstRender = { current: true };
    const setAnnounceMsg = vi.fn();
    const props = {
      dataLoading: false, setDataLoading: vi.fn(), setSyncStatus: vi.fn(),
      planInfo: INIT_PLAN, session: null, toast: vi.fn(), path: 'x1',
      setAnnounceMsg: setAnnounceMsg, firstRender: firstRender, toastTimeoutsRef: { current: [] },
    };
    const { hook } = renderHook(function() { return usePlanEffects(props); });
    props.path = 'x2';
    hook.rerender();
    act(function() { vi.advanceTimersByTime(20); });
    expect(setAnnounceMsg).toHaveBeenCalledWith('x2');
    hook.unmount();
  });
});

describe('usePlanEffects — cleanup', function() {
  it('unmount limpa timeouts pendentes de toasts', function() {
    const timeouts = [];
    const toastTimeoutsRef = { current: timeouts };
    const tid1 = setTimeout(function() {}, 9999);
    const tid2 = setTimeout(function() {}, 8888);
    timeouts.push(tid1, tid2);
    const { hook } = makeHook({ toastTimeoutsRef: toastTimeoutsRef });
    hook.unmount();
    expect(toastTimeoutsRef.current).toEqual([]);
  });
});
