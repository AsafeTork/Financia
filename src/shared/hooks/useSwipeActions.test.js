import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipeActions } from './useSwipeActions.js';

function makeElement() {
  var el = document.createElement('div');
  Object.defineProperty(el, 'scrollTop', { value: 0, configurable: true, writable: true });
  document.body.appendChild(el);
  return el;
}

function touchStart(x) {
  var e = new Event('touchstart', { bubbles: true });
  e.touches = [{ clientX: x, clientY: 100 }];
  return e;
}
function touchMove(x) {
  var e = new Event('touchmove', { bubbles: true });
  e.touches = [{ clientX: x, clientY: 100 }];
  e.preventDefault = vi.fn();
  return e;
}
function touchEnd() {
  return new Event('touchend', { bubbles: true });
}
function touchCancel() {
  return new Event('touchcancel', { bubbles: true });
}

function setupHook(actions, opts) {
  var el = makeElement();
  var rendered = renderHook(function() {
    var r = useSwipeActions(Object.assign({ actions: actions }, opts || {}));
    r.elementRef.current = el;
    return r;
  });
  return { result: rendered.result, el: el };
}

describe('useSwipeActions', function() {
  it('retorna refs e estado inicial', function() {
    var actions = [{ label: 'Delete', onAction: vi.fn(), dir: 'left' }];
    var { result, el } = setupHook(actions);
    expect(result.current.elementRef).toBeDefined();
    expect(result.current.offset).toBe(0);
    expect(result.current.isSwiping).toBe(false);
    expect(typeof result.current.reset).toBe('function');
    el.remove();
  });

  it('ativa swipe ao arrastar horizontalmente', function() {
    var actions = [{ label: 'Delete', onAction: vi.fn(), dir: 'left' }];
    var { result, el } = setupHook(actions);
    act(function() { el.dispatchEvent(touchStart(200)); });
    act(function() { el.dispatchEvent(touchMove(100)); });
    expect(result.current.isSwiping).toBe(true);
    expect(result.current.offset).toBeLessThan(0);
    el.remove();
  });

  it('nao ativa swipe para movimento menor que deadzone', function() {
    var actions = [{ label: 'Delete', onAction: vi.fn(), dir: 'left' }];
    var { result, el } = setupHook(actions);
    act(function() { el.dispatchEvent(touchStart(100)); });
    act(function() { el.dispatchEvent(touchMove(101)); });
    expect(result.current.isSwiping).toBe(false);
    el.remove();
  });

  it('nao processa multisso (mais de um toque)', function() {
    var actions = [{ label: 'Delete', onAction: vi.fn(), dir: 'left' }];
    var { result, el } = setupHook(actions);
    var e = touchStart(200);
    e.touches = [{ clientX: 200, clientY: 100 }, { clientX: 300, clientY: 100 }];
    act(function() { el.dispatchEvent(e); });
    expect(result.current.isSwiping).toBe(false);
    el.remove();
  });

  it('dispara onAction quando arrasto passa do threshold (left)', function() {
    var onAction = vi.fn();
    var actions = [{ label: 'Delete', onAction: onAction, dir: 'left' }];
    var { result, el } = setupHook(actions, { threshold: 30 });
    act(function() { el.dispatchEvent(touchStart(200)); });
    act(function() { el.dispatchEvent(touchMove(50)); });
    act(function() { el.dispatchEvent(touchEnd()); });
    expect(onAction).toHaveBeenCalledOnce();
    expect(result.current.offset).toBe(0);
    el.remove();
  });

  it('nao dispara onAction quando arrasto menor que threshold', function() {
    var onAction = vi.fn();
    var actions = [{ label: 'Delete', onAction: onAction, dir: 'left' }];
    var { result: _result, el } = setupHook(actions, { threshold: 80 });
    act(function() { el.dispatchEvent(touchStart(200)); });
    act(function() { el.dispatchEvent(touchMove(150)); });
    act(function() { el.dispatchEvent(touchEnd()); });
    expect(onAction).not.toHaveBeenCalled();
    el.remove();
  });

  it('reset limpa o estado', function() {
    var actions = [{ label: 'Delete', onAction: vi.fn(), dir: 'left' }];
    var { result, el } = setupHook(actions);
    act(function() { el.dispatchEvent(touchStart(200)); });
    act(function() { el.dispatchEvent(touchMove(100)); });
    expect(result.current.isSwiping).toBe(true);
    act(function() { result.current.reset(); });
    expect(result.current.isSwiping).toBe(false);
    expect(result.current.offset).toBe(0);
    el.remove();
  });

  it('touchcancel reseta o estado sem disparar acao', function() {
    var onAction = vi.fn();
    var actions = [{ label: 'Delete', onAction: onAction, dir: 'left' }];
    var { result, el } = setupHook(actions, { threshold: 30 });
    act(function() { el.dispatchEvent(touchStart(200)); });
    act(function() { el.dispatchEvent(touchMove(50)); });
    act(function() { el.dispatchEvent(touchCancel()); });
    expect(onAction).not.toHaveBeenCalled();
    expect(result.current.isSwiping).toBe(false);
    expect(result.current.offset).toBe(0);
    el.remove();
  });

  it('limita o deslocamento ao maxSwipe', function() {
    var actions = [{ label: 'Delete', onAction: vi.fn(), dir: 'left' }];
    var { result, el } = setupHook(actions, { maxSwipe: 80 });
    act(function() { el.dispatchEvent(touchStart(200)); });
    act(function() { el.dispatchEvent(touchMove(200)); });
    expect(result.current.offset).toBeLessThanOrEqual(80);
    el.remove();
  });

  it('dispara acao direita para actions com dir right', function() {
    var onAction = vi.fn();
    var actions = [{ label: 'Archive', onAction: onAction, dir: 'right' }];
    var { result: _result, el } = setupHook(actions, { threshold: 30 });
    act(function() { el.dispatchEvent(touchStart(100)); });
    act(function() { el.dispatchEvent(touchMove(300)); });
    act(function() { el.dispatchEvent(touchEnd()); });
    expect(onAction).toHaveBeenCalledOnce();
    el.remove();
  });

  it('respeita a ordem de prioridade: left > right', function() {
    var leftAction = vi.fn();
    var rightAction = vi.fn();
    var actions = [
      { label: 'Delete', onAction: leftAction, dir: 'left' },
      { label: 'Archive', onAction: rightAction, dir: 'right' },
    ];
    var { result: _result, el } = setupHook(actions, { threshold: 30 });
    act(function() { el.dispatchEvent(touchStart(200)); });
    act(function() { el.dispatchEvent(touchMove(50)); });
    act(function() { el.dispatchEvent(touchEnd()); });
    expect(leftAction).toHaveBeenCalledOnce();
    expect(rightAction).not.toHaveBeenCalled();
    el.remove();
  });

  it('nao processa segundo gesto enquanto isSwiping ativo', function() {
    var actions = [{ label: 'Delete', onAction: vi.fn(), dir: 'left' }];
    var { result, el } = setupHook(actions, { threshold: 30 });
    act(function() { el.dispatchEvent(touchStart(200)); });
    act(function() { el.dispatchEvent(touchMove(50)); });
    act(function() { el.dispatchEvent(touchStart(200)); });
    expect(result.current.isSwiping).toBe(true);
    el.remove();
  });
});
