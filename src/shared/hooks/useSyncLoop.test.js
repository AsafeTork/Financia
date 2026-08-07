import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSyncLoop } from './useSyncLoop.js';

const syncAllMock = vi.fn();

vi.mock('../../lib/sync.js', function() {
  return { syncAll: function() { return syncAllMock.apply(this, arguments); } };
});

function makeHook() {
  const setSyncStatus = vi.fn();
  const ctx = {
    uidRef: { current: 'u1' },
    syncingRef: { current: false },
    loadFromLocal: vi.fn(async function() {}),
    reconnectRef: { current: null },
    lastSyncEndRef: { current: 0 },
  };
  const hook = renderHook(function() { return useSyncLoop({ setSyncStatus: setSyncStatus }, ctx); });
  return { hook: hook, ctx: ctx, setSyncStatus: setSyncStatus };
}

describe('useSyncLoop — runSync', function() {
  beforeEach(function() {
    syncAllMock.mockResolvedValue({ ok: true, changed: true });
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
  });

  it('roda sync e recarrega local quando changed', async function() {
    const { hook, ctx } = makeHook();
    await act(async function() { hook.result.current.runSync(); });
    expect(syncAllMock).toHaveBeenCalledWith('u1');
    expect(ctx.loadFromLocal).toHaveBeenCalledWith('u1');
    expect(ctx.syncingRef.current).toBe(false);
    hook.unmount();
  });

  it('quando changed false nao recarrega local', async function() {
    syncAllMock.mockResolvedValue({ ok: true, changed: false });
    const { hook, ctx } = makeHook();
    await act(async function() { hook.result.current.runSync(); });
    expect(ctx.loadFromLocal).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('runSync e silencioso: nao altera o status de sincronizacao', async function() {
    syncAllMock.mockResolvedValue({ ok: false, changed: false });
    const { hook, setSyncStatus } = makeHook();
    await act(async function() { hook.result.current.runSync(); });
    expect(setSyncStatus).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('nao sincroniza quando ja esta sincronizando', async function() {
    const { hook, ctx } = makeHook();
    ctx.syncingRef.current = true;
    await act(async function() { hook.result.current.runSync(); });
    expect(syncAllMock).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('nao sincroniza dentro do cooldown de 5s', async function() {
    const { hook, ctx } = makeHook();
    ctx.lastSyncEndRef.current = Date.now();
    await act(async function() { hook.result.current.runSync(); });
    expect(syncAllMock).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('nao sincroniza offline', async function() {
    navigator.onLine = false;
    const { hook } = makeHook();
    await act(async function() { hook.result.current.runSync(); });
    expect(syncAllMock).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('sem uid nao sincroniza', async function() {
    const { hook, ctx } = makeHook();
    ctx.uidRef.current = null;
    await act(async function() { hook.result.current.runSync(); });
    expect(syncAllMock).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('falha do syncAll nao quebra o loop', async function() {
    syncAllMock.mockRejectedValue(new Error('crash'));
    const { hook, ctx } = makeHook();
    await act(async function() { hook.result.current.runSync(); });
    expect(ctx.syncingRef.current).toBe(false);
    hook.unmount();
  });

  it('atualiza lastSyncEndRef apos sucesso', async function() {
    const { hook, ctx } = makeHook();
    await act(async function() { hook.result.current.runSync(); });
    expect(ctx.lastSyncEndRef.current).toBeGreaterThan(0);
    hook.unmount();
  });
});

describe('useSyncLoop — listeners', function() {
  beforeEach(function() {
    syncAllMock.mockResolvedValue({ ok: true, changed: false });
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true, writable: true });
  });

  it('evento online dispara sync e reconexao', async function() {
    const reconnect = vi.fn();
    const { hook, ctx } = makeHook();
    ctx.reconnectRef.current = reconnect;
    await act(async function() {
      window.dispatchEvent(new Event('online'));
    });
    expect(reconnect).toHaveBeenCalledWith('u1');
    expect(syncAllMock).toHaveBeenCalledWith('u1');
    hook.unmount();
  });

  it('evento online sem uid nao sincroniza', async function() {
    const { hook, ctx } = makeHook();
    ctx.uidRef.current = null;
    await act(async function() {
      window.dispatchEvent(new Event('online'));
    });
    expect(syncAllMock).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('visibilitychange visivel dispara sync silenciosa', async function() {
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    const { hook } = makeHook();
    await act(async function() {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(syncAllMock).toHaveBeenCalledWith('u1');
    hook.unmount();
  });

  it('visibilitychange oculto nao dispara sync', async function() {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    const { hook } = makeHook();
    await act(async function() {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(syncAllMock).not.toHaveBeenCalled();
    hook.unmount();
  });
});
