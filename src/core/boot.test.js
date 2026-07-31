import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { bootApp } from './boot.js';
import { registerSW } from '../lib/pwa.js';

vi.mock('../lib/pwa.js', () => ({
  registerSW: vi.fn()
}));

describe('bootApp', () => {
  let reloadSpy;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-app-version');
    vi.clearAllMocks();
    reloadSpy = vi.fn();
    vi.stubGlobal('location', { reload: reloadSpy });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it('reload is called and localStorage updated when version changes', () => {
    document.documentElement.setAttribute('data-app-version', '2.0.0');
    localStorage.setItem('financia_app_version', '1.0.0');

    bootApp();

    expect(reloadSpy).toHaveBeenCalledTimes(1);
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