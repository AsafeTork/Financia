import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bootApp } from './boot.js';
import { registerSW } from '../lib/pwa.js';

vi.mock('../lib/pwa.js', () => ({
  registerSW: vi.fn()
}));

describe('bootApp', () => {
  let origRequestIdleCallback;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-app-version');
    vi.clearAllMocks();
    origRequestIdleCallback = globalThis.requestIdleCallback;
    globalThis.requestIdleCallback = (cb) => cb();
  });

  afterEach(() => {
    globalThis.requestIdleCallback = origRequestIdleCallback;
  });

  it('calls registerSW from pwa.js', () => {
    bootApp();
    expect(registerSW).toHaveBeenCalled();
  });

  it('stores deployed version in localStorage when no cached version exists', () => {
    document.documentElement.setAttribute('data-app-version', '1.0.0');
    bootApp();
    expect(localStorage.getItem('financia_app_version')).toBe('1.0.0');
  });

  it('does not reload when version matches cached version', () => {
    document.documentElement.setAttribute('data-app-version', '1.0.0');
    localStorage.setItem('financia_app_version', '1.0.0');

    bootApp();

    expect(localStorage.getItem('financia_app_version')).toBe('1.0.0');
  });

  it('localStorage is updated when version changes', () => {
    document.documentElement.setAttribute('data-app-version', '2.0.0');
    localStorage.setItem('financia_app_version', '1.0.0');

    bootApp();

    expect(localStorage.getItem('financia_app_version')).toBe('2.0.0');
  });

  it('catches and suppresses version check errors without crashing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('financia_app_version', '1.0.0');

    try {
      bootApp();
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });
});
