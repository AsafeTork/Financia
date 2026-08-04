// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRealtime } from './useRealtime.js';

let channelOnMock = vi.fn();
let channelSubscribeMock = vi.fn();
let subscribeCallback = null;
let channelHandlers = [];
const removeChannelMock = vi.fn();
const channelMock = {
  on: function() { return channelOnMock.apply(this, arguments); },
  subscribe: function() { return channelSubscribeMock.apply(this, arguments); },
};

vi.mock('../../lib/supabase.js', function() {
  return {
    sb: {
      channel: vi.fn(function() { return channelMock; }),
      removeChannel: function() { return removeChannelMock.apply(this, arguments); },
    },
  };
});

function makeCtx(overrides) {
  return Object.assign({
    uidRef: { current: 'u1' },
    channelRef: { current: null },
    debounceRef: { current: null },
    retryRef: { current: null },
    retryDelayRef: { current: 1000 },
    runSync: vi.fn(function() {}),
    reconnectRef: { current: null },
    syncingRef: { current: false },
    lastSyncEndRef: { current: 0 },
  }, overrides || {});
}

function makeHook(ctx) {
  const setPlanInfo = vi.fn();
  const hook = renderHook(function() { return useRealtime({ setPlanInfo: setPlanInfo }, ctx); });
  act(function() { ctx.reconnectRef.current('u1'); });
  return { hook: hook, setPlanInfo: setPlanInfo };
}

function findHandler(table, event) {
  return channelHandlers.filter(function(h) {
    if (!h.filter) return false;
    if (h.filter.table !== table) return false;
    if (event && h.filter.event !== event) return false;
    return true;
  })[0];
}

describe('useRealtime', function() {
  beforeEach(function() {
    channelOnMock.mockReset();
    channelOnMock.mockImplementation(function() { channelHandlers.push({ filter: arguments[1], cb: arguments[2] }); return channelMock; });
    channelSubscribeMock.mockReset();
    channelSubscribeMock.mockImplementation(function(cb) { subscribeCallback = cb; return channelMock; });
    removeChannelMock.mockReset();
    channelHandlers = [];
    subscribeCallback = null;
    var _onLine = true;
    Object.defineProperty(navigator, 'onLine', { get: function() { return _onLine; }, set: function(v) { _onLine = v; }, configurable: true });
  });

  it('registra canal para as 5 tabelas', function() {
    const { hook } = makeHook(makeCtx());
    expect(channelOnMock).toHaveBeenCalledTimes(5);
    hook.unmount();
  });

  it('SUBSCRIBED: reseta delay de retry e roda sync', function() {
    const ctx = makeCtx();
    ctx.retryDelayRef.current = 8000;
    const { hook } = makeHook(ctx);
    act(function() { subscribeCallback('SUBSCRIBED'); });
    expect(ctx.retryDelayRef.current).toBe(1000);
    expect(ctx.runSync).toHaveBeenCalled();
    hook.unmount();
  });

  it('CHANNEL_ERROR: agenda retry com backoff dobrado', function() {
    const ctx = makeCtx();
    const { hook } = makeHook(ctx);
    vi.useFakeTimers();
    try {
      act(function() { subscribeCallback('CHANNEL_ERROR'); });
      expect(ctx.retryDelayRef.current).toBe(2000);
      channelOnMock.mockClear();
      channelSubscribeMock.mockClear();
      act(function() { vi.advanceTimersByTime(999); });
      expect(channelOnMock).not.toHaveBeenCalled();
      act(function() { vi.advanceTimersByTime(1); });
      expect(channelOnMock).toHaveBeenCalledTimes(5);
      hook.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('TIMED_OUT: agenda retry', function() {
    const ctx = makeCtx();
    const { hook } = makeHook(ctx);
    vi.useFakeTimers();
    try {
      act(function() { subscribeCallback('TIMED_OUT'); });
      expect(ctx.retryDelayRef.current).toBe(2000);
      channelOnMock.mockClear();
      act(function() { vi.advanceTimersByTime(999); });
      expect(channelOnMock).not.toHaveBeenCalled();
      act(function() { vi.advanceTimersByTime(1); });
      expect(channelOnMock).toHaveBeenCalledTimes(5);
      hook.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('retry nao reconecta quando uid e nulo', function() {
    const ctx = makeCtx();
    ctx.uidRef.current = null;
    const { hook } = makeHook(ctx);
    vi.useFakeTimers();
    try {
      act(function() { subscribeCallback('CHANNEL_ERROR'); });
      channelOnMock.mockClear();
      act(function() { vi.advanceTimersByTime(2000); });
      expect(channelOnMock).not.toHaveBeenCalled();
      hook.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('retry nao reconecta offline', function() {
    var _onLine = false;
    Object.defineProperty(navigator, 'onLine', { get: function() { return _onLine; }, set: function(v) { _onLine = v; }, configurable: true });
    const ctx = makeCtx();
    const { hook } = makeHook(ctx);
    vi.useFakeTimers();
    try {
      act(function() { subscribeCallback('CHANNEL_ERROR'); });
      channelOnMock.mockClear();
      act(function() { vi.advanceTimersByTime(2000); });
      expect(channelOnMock).not.toHaveBeenCalled();
      hook.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('applyPlan atualiza planInfo para o usuario do canal', function() {
    const ctx = makeCtx();
    const { hook, setPlanInfo } = makeHook(ctx);
    const h = findHandler('company_profiles', 'UPDATE');
    act(function() {
      h.cb({ new: { user_id: 'u1', plan: 'pro', plan_expires_at: '2099-01-01', plan_activated_by: 'admin' } });
    });
    expect(setPlanInfo).toHaveBeenCalledWith({ plan: 'pro', plan_expires_at: '2099-01-01', plan_activated_by: 'admin' });
    hook.unmount();
  });

  it('applyPlan ignora payload de outro usuario', function() {
    const ctx = makeCtx();
    const { hook, setPlanInfo } = makeHook(ctx);
    const h = findHandler('company_profiles', 'UPDATE');
    act(function() {
      h.cb({ new: { user_id: 'u2', plan: 'premium' } });
    });
    expect(setPlanInfo).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('applyPlan ignora payload sem new', function() {
    const ctx = makeCtx();
    const { hook, setPlanInfo } = makeHook(ctx);
    const h = findHandler('company_profiles', 'UPDATE');
    act(function() { h.cb({ old: { user_id: 'u1' } }); });
    expect(setPlanInfo).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('doSync (postgres_changes) agenda sync com debounce de 2s', function() {
    const ctx = makeCtx();
    const { hook } = makeHook(ctx);
    vi.useFakeTimers();
    try {
      const h = findHandler('transactions');
      act(function() { h.cb({}); });
      expect(ctx.runSync).not.toHaveBeenCalled();
      act(function() { vi.advanceTimersByTime(1999); });
      expect(ctx.runSync).not.toHaveBeenCalled();
      act(function() { vi.advanceTimersByTime(1); });
      expect(ctx.runSync).toHaveBeenCalled();
      hook.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('doSync nao agenda quando ja sincronizando', function() {
    const ctx = makeCtx();
    ctx.syncingRef.current = true;
    const { hook } = makeHook(ctx);
    vi.useFakeTimers();
    try {
      const h = findHandler('transactions');
      act(function() { h.cb({}); });
      act(function() { vi.advanceTimersByTime(2000); });
      expect(ctx.runSync).not.toHaveBeenCalled();
      hook.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('doSync nao agenda dentro do cooldown', function() {
    const ctx = makeCtx();
    ctx.lastSyncEndRef.current = Date.now();
    const { hook } = makeHook(ctx);
    vi.useFakeTimers();
    try {
      const h = findHandler('products');
      act(function() { h.cb({}); });
      act(function() { vi.advanceTimersByTime(2000); });
      expect(ctx.runSync).not.toHaveBeenCalled();
      hook.unmount();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reconexao remove canal anterior', function() {
    const ctx = makeCtx();
    ctx.channelRef.current = { id: 'antigo' };
    const { hook } = makeHook(ctx);
    expect(removeChannelMock).toHaveBeenCalledWith({ id: 'antigo' });
    expect(channelMock).toBeDefined();
    hook.unmount();
  });
});
