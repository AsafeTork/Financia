// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useBrandAppearance, { applyBrandVars } from './useBrandAppearance.js';

const mockBrandAlpha = vi.fn(function() { return 'rgba(0,0,0,0.08)'; });
const mockDeriveCores = vi.fn(function() {
  return { secondary: '#mocked-secondary', accent: '#mocked-accent' };
});

vi.mock('../../lib/utils.js', function() {
  return {
    brandAlpha: function() { return mockBrandAlpha.apply(this, arguments); },
    deriveCores: function() { return mockDeriveCores.apply(this, arguments); },
  };
});

let lsData = {};
const mockSetProperty = vi.fn();

beforeEach(function() {
  lsData = {};
  mockBrandAlpha.mockClear();
  mockDeriveCores.mockClear();
  mockSetProperty.mockClear();
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(function(k) { return lsData[k] || null; }),
    setItem: vi.fn(function(k, v) { lsData[k] = v; }),
  });
  Object.defineProperty(document.documentElement, 'style', {
    value: { setProperty: mockSetProperty },
    configurable: true,
    writable: true,
  });
});

function makeBrand(overrides) {
  return Object.assign({
    name: 'Test',
    color: '#002f59',
    color_secondary: '#e8f0f7',
    color_accent: '#1a6b5c',
    theme: 'light',
    white_label: false,
    custom_palette: false,
    logo: 'T',
    logo_url: null,
  }, overrides || {});
}

function makePlanInfo(overrides) {
  return Object.assign({
    plan: 'free',
    plan_expires_at: null,
    plan_activated_by: null,
  }, overrides || {});
}

describe('useBrandAppearance', function() {

  it('non-white-label pro plan gets plan visual defaults', function() {
    const brand = makeBrand({ white_label: false });
    const planInfo = makePlanInfo({ plan: 'pro', plan_expires_at: '2099-01-01' });
    const { result } = renderHook(function() { return useBrandAppearance(brand, planInfo); });
    expect(result.current.appBrand.color).toBe('#2563EB');
    expect(result.current.appBrand.color_secondary).toBe('#e0e7ff');
    expect(result.current.appBrand.color_accent).toBe('#4F46E5');
    expect(result.current.appBrand.theme).toBe('light');
  });

  it('white-label with custom_palette keeps own colors', function() {
    const brand = makeBrand({ white_label: true, custom_palette: true, color: '#ff6600', color_secondary: '#fff3e0', color_accent: '#ff9100', theme: 'dark' });
    const { result } = renderHook(function() { return useBrandAppearance(brand, makePlanInfo()); });
    expect(result.current.appBrand.color).toBe('#ff6600');
    expect(result.current.appBrand.color_secondary).toBe('#fff3e0');
    expect(result.current.appBrand.color_accent).toBe('#ff9100');
    expect(result.current.appBrand.theme).toBe('dark');
  });

  it('white-label without custom_palette and missing colors gets fallback', function() {
    const brand = { name: 'Custom', white_label: true, custom_palette: false, logo_url: null };
    const { result } = renderHook(function() { return useBrandAppearance(brand, makePlanInfo()); });
    expect(result.current.appBrand.color).toBe('#002f59');
    expect(result.current.appBrand.color_secondary).toBe('#e8f0f7');
    expect(result.current.appBrand.color_accent).toBe('#3bbfa0');
    expect(result.current.appBrand.theme).toBe('light');
  });

  it('free plan gets free visual defaults', function() {
    const brand = makeBrand({ white_label: false });
    const { result } = renderHook(function() { return useBrandAppearance(brand, makePlanInfo()); });
    expect(result.current.appBrand.color).toBe('#0f3d3e');
    expect(result.current.appBrand.color_secondary).toBe('#ccfbf1');
    expect(result.current.appBrand.color_accent).toBe('#0d9488');
    expect(result.current.appBrand.theme).toBe('light');
  });

  it('premium plan gets premium visual defaults', function() {
    const brand = makeBrand({ white_label: false });
    const planInfo = makePlanInfo({ plan: 'premium', plan_expires_at: '2099-01-01' });
    const { result } = renderHook(function() { return useBrandAppearance(brand, planInfo); });
    expect(result.current.appBrand.color).toBe('#0F172A');
    expect(result.current.appBrand.color_accent).toBe('#D4AF6A');
  });

  it('expired plan falls back to free defaults', function() {
    const brand = makeBrand({ white_label: false });
    const planInfo = makePlanInfo({ plan: 'pro', plan_expires_at: '2020-01-01' });
    const { result } = renderHook(function() { return useBrandAppearance(brand, planInfo); });
    expect(result.current.appBrand.color).toBe('#0f3d3e');
  });

  it('does not crash when brand is null', function() {
    const { result } = renderHook(function() { return useBrandAppearance(null, makePlanInfo()); });
    expect(result.current.appBrand).not.toBeNull();
    expect(result.current.effectiveTheme).toBe('light');
  });

  it('does not crash when brand is undefined', function() {
    const { result } = renderHook(function() { return useBrandAppearance(undefined, makePlanInfo()); });
    expect(result.current.appBrand).not.toBeNull();
    expect(result.current.effectiveTheme).toBe('light');
  });

  it('does not crash when planInfo is null', function() {
    const brand = makeBrand({ white_label: false });
    const { result } = renderHook(function() { return useBrandAppearance(brand, null); });
    expect(result.current.appBrand.color).toBe('#0f3d3e');
  });

  it('effectiveTheme falls back to appBrand.theme', function() {
    const brand = makeBrand({ white_label: true, custom_palette: true, theme: 'dark' });
    const { result } = renderHook(function() { return useBrandAppearance(brand, makePlanInfo()); });
    expect(result.current.effectiveTheme).toBe('dark');
  });

  it('effectiveTheme prefers localStorage themePref', function() {
    lsData['financia_theme'] = 'dark';
    const brand = makeBrand({ white_label: true, custom_palette: true, theme: 'light' });
    const { result } = renderHook(function() { return useBrandAppearance(brand, makePlanInfo()); });
    expect(result.current.themePref).toBe('dark');
    expect(result.current.effectiveTheme).toBe('dark');
  });

  it('toggleTheme switches from light to dark and saves', function() {
    const brand = makeBrand({ white_label: true, custom_palette: true, theme: 'light' });
    const { result } = renderHook(function() { return useBrandAppearance(brand, makePlanInfo()); });
    act(function() { result.current.toggleTheme(); });
    expect(result.current.themePref).toBe('dark');
    expect(result.current.effectiveTheme).toBe('dark');
    expect(lsData['financia_theme']).toBe('dark');
    act(function() { result.current.toggleTheme(); });
    expect(result.current.themePref).toBe('light');
  });

  it('toggleTheme returns previous themePref for null start', function() {
    const brand = makeBrand({ white_label: true, custom_palette: true, theme: 'light' });
    const { result } = renderHook(function() { return useBrandAppearance(brand, makePlanInfo()); });
    act(function() { result.current.toggleTheme(); });
    act(function() { result.current.toggleTheme(); });
    act(function() { result.current.toggleTheme(); });
    expect(result.current.themePref).toBe('dark');
  });

  it('white-label with partial colors and custom_palette=false uses fallback', function() {
    const brand = { name: 'Partial', white_label: true, custom_palette: false, color: '#999999', logo_url: null };
    const { result } = renderHook(function() { return useBrandAppearance(brand, makePlanInfo()); });
    expect(result.current.appBrand.color).toBe('#002f59');
    expect(result.current.appBrand.color_secondary).toBe('#e8f0f7');
    expect(result.current.appBrand.color_accent).toBe('#3bbfa0');
    expect(result.current.appBrand.theme).toBe('light');
  });

  it('white-label with partial colors and custom_palette=true keeps partial brand', function() {
    const brand = { name: 'Partial', white_label: true, custom_palette: true, color: '#999999', logo_url: null };
    const { result } = renderHook(function() { return useBrandAppearance(brand, makePlanInfo()); });
    expect(result.current.appBrand.color).toBe('#999999');
  });

  it('non-white-label with null planInfo uses free defaults', function() {
    const brand = makeBrand({ white_label: false });
    const { result } = renderHook(function() { return useBrandAppearance(brand, null); });
    expect(result.current.appBrand.color).toBe('#0f3d3e');
  });

});

describe('applyBrandVars', function() {

  it('sets all 6 CSS variables', function() {
    applyBrandVars({ color: '#123456', color_secondary: '#654321', color_accent: '#abc123' });
    expect(mockSetProperty).toHaveBeenCalledWith('--brand', '#123456');
    expect(mockSetProperty).toHaveBeenCalledWith('--brand-soft', 'rgba(0,0,0,0.08)');
    expect(mockSetProperty).toHaveBeenCalledWith('--brand-secondary', '#654321');
    expect(mockSetProperty).toHaveBeenCalledWith('--brand-accent', '#abc123');
    expect(mockSetProperty).toHaveBeenCalledWith('--brand-accent-soft', 'rgba(0,0,0,0.08)');
    expect(mockSetProperty).toHaveBeenCalledWith('--brand-grad', 'linear-gradient(135deg, #123456 0%, #abc123 100%)');
    expect(mockSetProperty).toHaveBeenCalledTimes(6);
  });

  it('calls deriveCores when color_secondary is missing', function() {
    mockDeriveCores.mockReturnValueOnce({ secondary: '#derived-sec', accent: '#derived-acc' });
    applyBrandVars({ color: '#ff0000' });
    expect(mockDeriveCores).toHaveBeenCalledWith('#ff0000');
    expect(mockSetProperty).toHaveBeenCalledWith('--brand-secondary', '#derived-sec');
    expect(mockSetProperty).toHaveBeenCalledWith('--brand-accent', '#derived-acc');
  });

  it('falls back to #002f59 when brand has no color', function() {
    mockDeriveCores.mockReturnValueOnce({ secondary: '#sec', accent: '#acc' });
    applyBrandVars({ color: null, color_secondary: '#s', color_accent: '#a' });
    expect(mockDeriveCores).toHaveBeenCalledWith('#002f59');
  });

});
