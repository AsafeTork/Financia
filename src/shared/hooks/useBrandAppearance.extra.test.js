// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useBrandAppearance, { applyBrandVars, enterPreviewMode, exitPreviewMode } from './useBrandAppearance.js';

const mockBrandAlpha = vi.fn(function(hex, a) { return 'rgba(1,2,3,' + a + ')'; });
const mockDeriveCores = vi.fn(function(hex) { return { secondary: '#aabbcc', accent: '#ddeeff' }; });

vi.mock('../../lib/utils.js', function() {
  return {
    brandAlpha: function() { return mockBrandAlpha.apply(this, arguments); },
    deriveCores: function() { return mockDeriveCores.apply(this, arguments); },
  };
});

let attrs = {};
const mockSetProperty = vi.fn();
const mockRemoveProperty = vi.fn();
const el = {
  style: { setProperty: mockSetProperty, removeProperty: mockRemoveProperty },
  getAttribute: vi.fn(function(k) { return attrs[k] || null; }),
  setAttribute: vi.fn(function(k, v) { attrs[k] = v; }),
};

function makeBrand(overrides) {
  return Object.assign({
    name: 'Test', color: '#002f59', color_secondary: '#e8f0f7', color_accent: '#1a6b5c',
    theme: 'light', white_label: true, custom_palette: true, logo: 'T', logo_url: null,
  }, overrides || {});
}

const FULL_CONFIG = {
  palette: { bgPage: '#111111', bgCard: '#222222', textMain: '#ffffff', success: '#00ff00' },
  typography: { fontFamily: 'Inter', headingFont: 'Poppins', baseSize: '16px', scale: 1.25 },
  borderRadius: { md: '8px', full: '999px' },
  spacing: { gap: '16px', card: '24px' },
  sidebar: { width: '280px', bg: '#333333' },
  header: { bg: '#444444', height: '64px' },
  cards: { bg: '#555555', shadow: '0 1px 2px' },
  buttons: { primaryBg: '#666666' },
  inputs: { bg: '#777777', focusBorder: '#888888' },
  shadows: { md: '0 2px 4px' },
  animations: { duration: '0.2s', easing: 'ease' },
};

describe('applyBrandVars — modo dark e brand_config', function() {
  beforeEach(function() {
    attrs = {};
    mockBrandAlpha.mockClear();
    mockDeriveCores.mockClear();
    mockSetProperty.mockClear();
    mockRemoveProperty.mockClear();
    vi.stubGlobal('requestAnimationFrame', function(cb) { cb(); return 1; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    Object.defineProperty(document, 'documentElement', { value: el, configurable: true });
  });

  it('modo dark remove vars controladas pelo tema', function() {
    attrs['data-theme'] = 'dark';
    applyBrandVars(makeBrand({ brand_config: FULL_CONFIG }));
    expect(mockRemoveProperty).toHaveBeenCalledWith('--bg-page');
    expect(mockRemoveProperty).toHaveBeenCalledWith('--bg-card');
    expect(mockRemoveProperty).toHaveBeenCalledWith('--text-main');
    expect(mockRemoveProperty).toHaveBeenCalledWith('--shadow-md');
    expect(mockSetProperty).toHaveBeenCalledWith('--brand', '#002f59');
    expect(mockSetProperty).not.toHaveBeenCalledWith('--bg-page', '#111111');
  });

  it('modo light aplica todos os tokens do brand_config', function() {
    attrs['data-theme'] = 'light';
    applyBrandVars(makeBrand({ brand_config: FULL_CONFIG }));
    expect(mockSetProperty).toHaveBeenCalledWith('--bg-page', '#111111');
    expect(mockSetProperty).toHaveBeenCalledWith('--bg-card', '#222222');
    expect(mockSetProperty).toHaveBeenCalledWith('--text-main', '#ffffff');
    expect(mockSetProperty).toHaveBeenCalledWith('--success', '#00ff00');
    expect(mockSetProperty).toHaveBeenCalledWith('--font-family', 'Inter');
    expect(mockSetProperty).toHaveBeenCalledWith('--font-heading', 'Poppins');
    expect(mockSetProperty).toHaveBeenCalledWith('--font-base', '16px');
    expect(mockSetProperty).toHaveBeenCalledWith('--font-scale', '1.25');
    expect(mockSetProperty).toHaveBeenCalledWith('--radius-md', '8px');
    expect(mockSetProperty).toHaveBeenCalledWith('--radius-full', '999px');
    expect(mockSetProperty).toHaveBeenCalledWith('--spacing-gap', '16px');
    expect(mockSetProperty).toHaveBeenCalledWith('--spacing-card', '24px');
    expect(mockSetProperty).toHaveBeenCalledWith('--sidebar-width', '280px');
    expect(mockSetProperty).toHaveBeenCalledWith('--sidebar-bg', '#333333');
    expect(mockSetProperty).toHaveBeenCalledWith('--header-bg', '#444444');
    expect(mockSetProperty).toHaveBeenCalledWith('--header-height', '64px');
    expect(mockSetProperty).toHaveBeenCalledWith('--card-shadow', '0 1px 2px');
    expect(mockSetProperty).toHaveBeenCalledWith('--btn-primary-bg', '#666666');
    expect(mockSetProperty).toHaveBeenCalledWith('--input-bg', '#777777');
    expect(mockSetProperty).toHaveBeenCalledWith('--input-focus-border', '#888888');
    expect(mockSetProperty).toHaveBeenCalledWith('--shadow-md', '0 2px 4px');
    expect(mockSetProperty).toHaveBeenCalledWith('--anim-duration', '0.2s');
    expect(mockSetProperty).toHaveBeenCalledWith('--anim-easing', 'ease');
  });

  it('brand_config como string JSON e parseado', function() {
    attrs['data-theme'] = 'light';
    applyBrandVars(makeBrand({ brand_config: JSON.stringify({ palette: { bgPage: '#999999' } }) }));
    expect(mockSetProperty).toHaveBeenCalledWith('--bg-page', '#999999');
  });

  it('brand_config v1 com modules.palette', function() {
    attrs['data-theme'] = 'light';
    applyBrandVars(makeBrand({ brand_config: { modules: { palette: { bgPage: '#abcdef' }, typography: { fontFamily: 'Roboto' } } } }));
    expect(mockSetProperty).toHaveBeenCalledWith('--bg-page', '#abcdef');
    expect(mockSetProperty).toHaveBeenCalledWith('--font-family', 'Roboto');
  });

  it('brand_config JSON invalido nao quebra', function() {
    applyBrandVars(makeBrand({ brand_config: '{invalid json' }));
    expect(mockSetProperty).toHaveBeenCalledWith('--brand', '#002f59');
  });

  it('palette vazio aplica apenas as variaveis de marca', function() {
    attrs['data-theme'] = 'light';
    applyBrandVars(makeBrand({ brand_config: { palette: {} } }));
    expect(mockSetProperty).toHaveBeenCalledTimes(6);
    expect(mockSetProperty).not.toHaveBeenCalledWith('--bg-page', expect.any(String));
  });

  it('sem brand_config aplica apenas as 4 variaveis de marca (soft via CSS)', function() {
    applyBrandVars(makeBrand({ brand_config: null }));
    expect(mockSetProperty).toHaveBeenCalledTimes(4);
    expect(mockSetProperty).toHaveBeenCalledWith('--brand', '#002f59');
    expect(mockSetProperty).toHaveBeenCalledWith('--brand-secondary', '#6ec6c8');
    expect(mockSetProperty).toHaveBeenCalledWith('--brand-accent', '#1a6b5c');
    expect(mockSetProperty).toHaveBeenCalledWith('--brand-grad', 'linear-gradient(135deg, #002f59 0%, #1a6b5c 100%)');
  });
});

describe('enterPreviewMode / exitPreviewMode', function() {
  beforeEach(function() {
    attrs = {};
    mockSetProperty.mockClear();
    mockRemoveProperty.mockClear();
    Object.defineProperty(document, 'documentElement', { value: el, configurable: true });
  });

  it('enterPreviewMode aplica tokens do brand proposto', function() {
    enterPreviewMode({ color: '#ff0000' });
    expect(mockSetProperty).toHaveBeenCalledWith('--brand', '#ff0000');
    expect(mockDeriveCores).toHaveBeenCalledWith('#ff0000');
  });

  it('exitPreviewMode remove apenas as vars de preview', function() {
    exitPreviewMode();
    expect(mockRemoveProperty).toHaveBeenCalledWith('--brand');
    expect(mockRemoveProperty).toHaveBeenCalledWith('--brand-secondary');
    expect(mockRemoveProperty).toHaveBeenCalledWith('--brand-accent');
    expect(mockRemoveProperty).toHaveBeenCalledWith('--brand-grad');
    expect(mockRemoveProperty).toHaveBeenCalledTimes(4);
  });
});

describe('useBrandAppearance — tema e campanhas', function() {
  beforeEach(function() {
    attrs = {};
    mockSetProperty.mockClear();
    mockRemoveProperty.mockClear();
    mockDeriveCores.mockClear();
    localStorage.removeItem('financia_theme');
    vi.stubGlobal('requestAnimationFrame', function(cb) { cb(); return 1; });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    Object.defineProperty(document, 'documentElement', { value: el, configurable: true });
  });

  it('carrega themePref salvo do localStorage', function() {
    localStorage.setItem('financia_theme', 'dark');
    const { result } = renderHook(function() { return useBrandAppearance(makeBrand(), null); });
    expect(result.current.themePref).toBe('dark');
    expect(result.current.effectiveTheme).toBe('dark');
  });

  it('toggleTheme de light para dark remove vars controladas e salva pref', function() {
    const { result } = renderHook(function() { return useBrandAppearance(makeBrand({ brand_config: FULL_CONFIG }), null); });
    act(function() { result.current.toggleTheme(); });
    expect(el.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('financia_theme')).toBe('dark');
    expect(mockRemoveProperty).toHaveBeenCalledWith('--bg-page');
    expect(mockRemoveProperty).toHaveBeenCalledWith('--text-main');
    expect(mockSetProperty).toHaveBeenCalledWith('--brand', '#002f59');
  });

  it('toggleTheme de dark para light aplica todos os tokens', function() {
    localStorage.setItem('financia_theme', 'dark');
    const { result } = renderHook(function() { return useBrandAppearance(makeBrand({ brand_config: FULL_CONFIG }), null); });
    act(function() { result.current.toggleTheme(); });
    expect(el.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('financia_theme')).toBe('light');
    expect(mockSetProperty).toHaveBeenCalledWith('--bg-page', '#111111');
    expect(mockSetProperty).toHaveBeenCalledWith('--text-main', '#ffffff');
  });

  it('checkCampaigns com campanha ativa aplica override da paleta', function() {
    const campaign = {
      is_active: true,
      starts_at: new Date(Date.now() - 1000).toISOString(),
      expires_at: new Date(Date.now() + 100000).toISOString(),
      schema_override: JSON.stringify({ palette: { primary: '#ff0000', bgPage: '#000000', bgCard: '#111111', textMain: '#ffffff' } }),
    };
    const { result } = renderHook(function() { return useBrandAppearance(makeBrand(), null); });
    act(function() { result.current.checkCampaigns([campaign]); });
    expect(mockSetProperty).toHaveBeenCalledWith('--brand', '#ff0000');
    expect(mockSetProperty).toHaveBeenCalledWith('--bg-page', '#000000');
    expect(mockSetProperty).toHaveBeenCalledWith('--bg-card', '#111111');
    expect(mockSetProperty).toHaveBeenCalledWith('--text-main', '#ffffff');
  });

  it('checkCampaigns ignora campanha inativa', function() {
    const campaign = {
      is_active: false,
      starts_at: new Date(Date.now() - 1000).toISOString(),
      expires_at: new Date(Date.now() + 100000).toISOString(),
      schema_override: { palette: { primary: '#ff0000' } },
    };
    const { result } = renderHook(function() { return useBrandAppearance(makeBrand(), null); });
    act(function() { result.current.checkCampaigns([campaign]); });
    expect(mockSetProperty).not.toHaveBeenCalledWith('--brand', '#ff0000');
  });

  it('checkCampaigns ignora campanha fora do periodo', function() {
    const campaign = {
      is_active: true,
      starts_at: new Date(Date.now() + 100000).toISOString(),
      expires_at: new Date(Date.now() + 200000).toISOString(),
      schema_override: { palette: { primary: '#00ff00' } },
    };
    const { result } = renderHook(function() { return useBrandAppearance(makeBrand(), null); });
    act(function() { result.current.checkCampaigns([campaign]); });
    expect(mockSetProperty).not.toHaveBeenCalledWith('--brand', '#00ff00');
  });

  it('checkCampaigns com lista vazia nao faz nada', function() {
    const { result } = renderHook(function() { return useBrandAppearance(makeBrand(), null); });
    act(function() { result.current.checkCampaigns([]); });
    expect(mockSetProperty).not.toHaveBeenCalledWith('--brand', '#ff0000');
  });

  it('checkCampaigns aceita schema_override como objeto', function() {
    const campaign = {
      is_active: true,
      starts_at: new Date(Date.now() - 1000).toISOString(),
      expires_at: new Date(Date.now() + 100000).toISOString(),
      schema_override: { palette: { primary: '#123abc' } },
    };
    const { result } = renderHook(function() { return useBrandAppearance(makeBrand(), null); });
    act(function() { result.current.checkCampaigns([campaign]); });
    expect(mockSetProperty).toHaveBeenCalledWith('--brand', '#123abc');
  });

  it('campanha ativa em modo dark nao aplica vars de fundo', function() {
    localStorage.setItem('financia_theme', 'dark');
    const campaign = {
      is_active: true,
      starts_at: new Date(Date.now() - 1000).toISOString(),
      expires_at: new Date(Date.now() + 100000).toISOString(),
      schema_override: { palette: { primary: '#ff0000', bgPage: '#000000' } },
    };
    const { result } = renderHook(function() { return useBrandAppearance(makeBrand(), null); });
    act(function() { result.current.checkCampaigns([campaign]); });
    expect(mockSetProperty).toHaveBeenCalledWith('--brand', '#ff0000');
    expect(mockSetProperty).not.toHaveBeenCalledWith('--bg-page', '#000000');
  });
});
