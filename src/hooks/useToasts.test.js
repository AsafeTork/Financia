// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToasts } from './useToasts.js';

function makeHook() {
  const toastId = { current: 0 };
  const toastTimeoutsRef = { current: [] };
  let toasts = [];
  const setToasts = vi.fn(function(updater) {
    toasts = typeof updater === 'function' ? updater(toasts) : updater;
  });
  const hook = renderHook(function() {
    return useToasts({ toasts: toasts, setToasts: setToasts, toastId: toastId, toastTimeoutsRef: toastTimeoutsRef });
  });
  return {
    hook: hook,
    toastId: toastId,
    toastTimeoutsRef: toastTimeoutsRef,
    getToasts: function() { return toasts; },
    refresh: function() { act(function() { hook.rerender(); }); },
  };
}

function addToast(hook, msg, type) {
  act(function() { hook.result.current.toast(msg, type); });
  hook.refresh();
}

describe('useToasts', function() {
  beforeEach(function() {
    vi.useFakeTimers();
  });

  afterEach(function() {
    vi.useRealTimers();
  });

  it('toast adiciona mensagem com tipo default success', function() {
    const { hook } = makeHook();
    addToast(hook, 'Salvo com sucesso');
    expect(hook.result.current.toasts).toHaveLength(1);
    expect(hook.result.current.toasts[0].msg).toBe('Salvo com sucesso');
    expect(hook.result.current.toasts[0].type).toBe('success');
    expect(hook.result.current.toasts[0].id).toBe(1);
  });

  it('toast aceita tipo explicito', function() {
    const { hook } = makeHook();
    addToast(hook, 'Erro', 'error');
    expect(hook.result.current.toasts[0].type).toBe('error');
  });

  it('toast com tipo error expira em 4000ms', function() {
    const { hook } = makeHook();
    addToast(hook, 'Erro', 'error');
    act(function() { vi.advanceTimersByTime(3999); });
    hook.refresh();
    expect(hook.result.current.toasts).toHaveLength(1);
    act(function() { vi.advanceTimersByTime(1); });
    hook.refresh();
    expect(hook.result.current.toasts).toHaveLength(0);
  });

  it('toast success expira em 3000ms', function() {
    const { hook } = makeHook();
    addToast(hook, 'Ok');
    act(function() { vi.advanceTimersByTime(2999); });
    hook.refresh();
    expect(hook.result.current.toasts).toHaveLength(1);
    act(function() { vi.advanceTimersByTime(1); });
    hook.refresh();
    expect(hook.result.current.toasts).toHaveLength(0);
  });

  it('timeout registrado em toastTimeoutsRef e removido apos disparar', function() {
    const { hook, toastTimeoutsRef } = makeHook();
    act(function() { hook.result.current.toast('A'); });
    expect(toastTimeoutsRef.current).toHaveLength(1);
    act(function() { vi.advanceTimersByTime(3000); });
    expect(toastTimeoutsRef.current).toHaveLength(0);
  });

  it('multiplicidade: varios toasts convivem e expiram juntos', function() {
    const { hook } = makeHook();
    act(function() { hook.result.current.toast('A'); hook.result.current.toast('B'); });
    hook.refresh();
    expect(hook.result.current.toasts).toHaveLength(2);
    expect(hook.result.current.toasts[1].id).toBe(2);
    act(function() { vi.advanceTimersByTime(3000); });
    hook.refresh();
    expect(hook.result.current.toasts).toHaveLength(0);
  });

  it('dismissToast remove apenas o toast alvo', function() {
    const { hook } = makeHook();
    act(function() { hook.result.current.toast('A'); hook.result.current.toast('B'); });
    hook.refresh();
    act(function() { hook.result.current.dismissToast(1); });
    hook.refresh();
    const left = hook.result.current.toasts;
    expect(left).toHaveLength(1);
    expect(left[0].msg).toBe('B');
  });

  it('dismissToast com id inexistente nao altera a lista', function() {
    const { hook } = makeHook();
    act(function() { hook.result.current.toast('A'); });
    hook.refresh();
    act(function() { hook.result.current.dismissToast(99); });
    hook.refresh();
    expect(hook.result.current.toasts).toHaveLength(1);
  });
});
