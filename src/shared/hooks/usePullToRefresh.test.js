import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePullToRefresh } from './usePullToRefresh.js';

function makeContainer() {
  var div = document.createElement('div');
  Object.defineProperty(div, 'scrollTop', { value: 0, configurable: true, writable: true });
  Object.defineProperty(div, 'scrollHeight', { value: 500, configurable: true, writable: true });
  Object.defineProperty(div, 'clientHeight', { value: 300, configurable: true, writable: true });
  document.body.appendChild(div);
  return div;
}

function makeHook(container, onRefresh) {
  return renderHook(function() {
    var result = usePullToRefresh(onRefresh);
    if (container) result.containerRef.current = container;
    return result;
  });
}

function touchEvent(type, y) {
  var e = new Event(type, { bubbles: true });
  e.touches = [{ clientY: y }];
  return e;
}

function mouseEvent(type, y) {
  return new MouseEvent(type, { bubbles: true, clientY: y });
}

describe('usePullToRefresh', function() {
  var onRefresh;

  beforeEach(function() {
    onRefresh = vi.fn(function() { return Promise.resolve(); });
  });

  it('retorna refs e estado inicial falso', function() {
    var container = makeContainer();
    var { result } = makeHook(container, onRefresh);
    expect(result.current.containerRef).toBeDefined();
    expect(result.current.isPulling).toBe(false);
    expect(result.current.pullProgress).toBe(0);
    expect(result.current.isRefreshing).toBe(false);
    expect(typeof result.current.runRefresh).toBe('function');
    container.remove();
  });

  it('ativa pull ao puxar para baixo no topo', function() {
    var container = makeContainer();
    var { result } = makeHook(container, onRefresh);
    act(function() { container.dispatchEvent(touchEvent('touchstart', 100)); });
    act(function() { container.dispatchEvent(touchEvent('touchmove', 120)); });
    expect(result.current.isPulling).toBe(true);
    expect(result.current.pullProgress).toBeGreaterThan(0);
    container.remove();
  });

  it('nao ativa pull quando scrollTop > 0', function() {
    var container = makeContainer();
    Object.defineProperty(container, 'scrollTop', { value: 50, configurable: true, writable: true });
    var { result } = makeHook(container, onRefresh);
    act(function() { container.dispatchEvent(touchEvent('touchstart', 100)); });
    act(function() { container.dispatchEvent(touchEvent('touchmove', 130)); });
    expect(result.current.isPulling).toBe(false);
    container.remove();
  });

  it('nao ativa pull ao puxar para cima', function() {
    var container = makeContainer();
    var { result } = makeHook(container, onRefresh);
    act(function() { container.dispatchEvent(touchEvent('touchstart', 100)); });
    act(function() { container.dispatchEvent(touchEvent('touchmove', 80)); });
    expect(result.current.isPulling).toBe(false);
    container.remove();
  });

  it('dispara onRefresh quando solto apos passar do threshold', async function() {
    var container = makeContainer();
    var { result } = makeHook(container, onRefresh);
    act(function() { container.dispatchEvent(touchEvent('touchstart', 100)); });
    act(function() { container.dispatchEvent(touchEvent('touchmove', 200)); });
    await act(async function() { container.dispatchEvent(new Event('touchend', { bubbles: true })); });
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(result.current.isPulling).toBe(false);
    container.remove();
  });

  it('nao dispara onRefresh quando solto antes do threshold', function() {
    var container = makeContainer();
    var { result } = makeHook(container, onRefresh);
    act(function() { container.dispatchEvent(touchEvent('touchstart', 100)); });
    act(function() { container.dispatchEvent(touchEvent('touchmove', 140)); });
    act(function() { container.dispatchEvent(new Event('touchend', { bubbles: true })); });
    expect(onRefresh).not.toHaveBeenCalled();
    container.remove();
  });

  it('progresso chega a 1 ao puxar o maximo', function() {
    var container = makeContainer();
    var { result } = makeHook(container, onRefresh);
    act(function() { container.dispatchEvent(touchEvent('touchstart', 100)); });
    act(function() { container.dispatchEvent(touchEvent('touchmove', 220)); });
    expect(result.current.pullProgress).toBeCloseTo(1, 2);
    container.remove();
  });

  it('touchcancel reseta o estado', function() {
    var container = makeContainer();
    var { result } = makeHook(container, onRefresh);
    act(function() { container.dispatchEvent(touchEvent('touchstart', 100)); });
    act(function() { container.dispatchEvent(touchEvent('touchmove', 150)); });
    act(function() { container.dispatchEvent(new Event('touchcancel', { bubbles: true })); });
    expect(result.current.isPulling).toBe(false);
    expect(result.current.pullProgress).toBe(0);
    expect(onRefresh).not.toHaveBeenCalled();
    container.remove();
  });

  it('runRefresh manual dispara onRefresh e seta isRefreshing', async function() {
    var container = makeContainer();
    var { result } = makeHook(container, onRefresh);
    await act(async function() { result.current.runRefresh(); });
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(result.current.isRefreshing).toBe(false);
    container.remove();
  });

  it('nao sincroniza quando ja esta refreshing', async function() {
    var container = makeContainer();
    var { result } = makeHook(container, onRefresh);
    act(function() { result.current.runRefresh(); });
    expect(result.current.isRefreshing).toBe(true);
    await act(async function() {
      container.dispatchEvent(touchEvent('touchstart', 100));
      container.dispatchEvent(touchEvent('touchmove', 200));
      container.dispatchEvent(new Event('touchend', { bubbles: true }));
    });
    expect(onRefresh).toHaveBeenCalledOnce();
    container.remove();
  });

  it('suporta eventos de mouse (desktop)', async function() {
    var container = makeContainer();
    var { result } = makeHook(container, onRefresh);
    act(function() { container.dispatchEvent(mouseEvent('mousedown', 100)); });
    act(function() { container.dispatchEvent(mouseEvent('mousemove', 200)); });
    expect(result.current.isPulling).toBe(true);
    await act(async function() { container.dispatchEvent(mouseEvent('mouseup', 200)); });
    expect(onRefresh).toHaveBeenCalledOnce();
    container.remove();
  });

  it('reseta listeners no unmount', function() {
    var container = makeContainer();
    var spy = vi.spyOn(container, 'removeEventListener');
    var { unmount } = makeHook(container, onRefresh);
    unmount();
    expect(spy).toHaveBeenCalled();
    container.remove();
  });
});
