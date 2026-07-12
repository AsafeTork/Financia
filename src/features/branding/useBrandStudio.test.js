// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, act } from 'vitest';
import { renderHook } from '@testing-library/react';
import useBrandStudio from './useBrandStudio.js';
import { loadPresetsFromDb } from './presets.js';
import * as presets from './presets.js';

vi.mock('./presets.js', () => {
  const actual = vi.requireActual('./presets.js');
  return {
    ...actual,
    listPresets: vi.fn(() => actual.OFFICIAL_PRESETS),
    getPreset: vi.fn((id) => actual.OFFICIAL_PRESETS.find(p => p.id === id) || null),
    savePreset: vi.fn((name, desc, cat, config, tags) => {
      const preset = { id: 'preset_' + Date.now(), name, description: desc || '', category: cat || 'custom', author: 'Usuario', tags: tags || [], protected: false, favorite: false, config };
      actual._userPresets.push(preset);
      return preset;
    }),
    deletePreset: vi.fn((id) => {
      const idx = actual._userPresets.findIndex(p => p.id === id);
      if (idx === -1) return false;
      actual._userPresets.splice(idx, 1);
      return true;
    }),
    duplicatePreset: vi.fn((id) => {
      const original = actual.OFFICIAL_PRESETS.concat(actual._userPresets).find(p => p.id === id);
      if (!original) return null;
      return actual.savePreset(original.name + ' (copia)', original.description, original.category, original.config, original.tags);
    }),
    toggleFavoritePreset: vi.fn((id) => {
      for (const p of actual._userPresets) {
        if (p.id === id) { p.favorite = !p.favorite; return p.favorite; }
      }
      return false;
    }),
    loadPresetsFromDb: actual.loadPresetsFromDb,
    getPresetCategories: vi.fn(() => ['classic', 'modern']),
    setOnChange: vi.fn(),
  };
});

vi.mock('./planThemes.js', () => ({
  applyPlanOverride: vi.fn((brand, planId, override) => ({ ...brand, brand_config: JSON.stringify({ ...JSON.parse(brand.brand_config || '{}'), planOverrides: { [planId]: override } }) })),
}));

vi.mock('./responseProcessor.js', () => ({
  default: vi.fn((json, brand) => ({
    success: true,
    proposedBrand: { ...brand, brand_config: typeof json === 'string' ? json : JSON.stringify(json), visual_version: (brand.visual_version || 0) + 1, custom_palette: true },
  })),
}));

vi.mock('../../shared/hooks/useBrandAppearance.js', () => ({
  enterPreviewMode: vi.fn(),
  exitPreviewMode: vi.fn(),
}));

const defaultBrand = {
  name: 'Test Brand',
  color: '#002f59',
  color_secondary: '#e8f0f7',
  color_accent: '#1a6b5c',
  theme: 'light',
  white_label: false,
  custom_palette: false,
  logo_url: null,
  brand_config: JSON.stringify({ schemaVersion: '1.0.0', modules: {} }),
  visual_version: 0,
};

const defaultPlanInfo = { plan: 'free', plan_expires_at: null, plan_activated_by: null };

const mockOnSave = vi.fn((b) => Promise.resolve(b));
const mockToast = vi.fn();

describe('useBrandStudio', function() {

  beforeEach(function() {
    vi.clearAllMocks();
  });

  it('inicializa brandConfig do brand.brand_config', function() {
    const brand = { ...defaultBrand, brand_config: JSON.stringify({ schemaVersion: '1.0.0', modules: { palette: { primary: '#ff0000' } } }) };
    const { result } = renderHook(() => useBrandStudio(brand, defaultPlanInfo, mockOnSave, mockToast));
    expect(result.current.brandConfig.modules.palette.primary).toBe('#ff0000');
  });

  it('usa default quando brand_config invalido', function() {
    const brand = { ...defaultBrand, brand_config: 'invalid json' };
    const { result } = renderHook(() => useBrandStudio(brand, defaultPlanInfo, mockOnSave, mockToast));
    expect(result.current.brandConfig).toEqual({ modules: {} });
  });

  it('carrega presets ao montar', async function() {
    renderHook(() => useBrandStudio(defaultBrand, defaultPlanInfo, mockOnSave, mockToast));
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });
    expect(loadPresetsFromDb).toHaveBeenCalled();
  });

  it('saveBrandGlobal atualiza identidade global', async function() {
    const { result } = renderHook(() => useBrandStudio(defaultBrand, defaultPlanInfo, mockOnSave, mockToast));
    act(() => { result.current.setBrandGlobalField('name', 'Nova Marca'); result.current.setBrandGlobalField('short_name', 'NM'); });
    await act(async () => { await result.current.saveBrandGlobal(); });
    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nova Marca', short_name: 'NM' }));
    expect(mockToast).toHaveBeenCalledWith('Identidade global salva!', 'success');
  });

  it('savePlanOverride salva override de plano', async function() {
    const { result } = renderHook(() => useBrandStudio(defaultBrand, defaultPlanInfo, mockOnSave, mockToast));
    await act(async () => { await result.current.savePlanOverride('pro', { modules: { palette: { primary: '#2563eb' } } }); });
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('applyFullPreset aplica preset e chama onSave', async function() {
    const preset = presets.savePreset('Test Preset', 'Desc', 'custom', { schemaVersion: '1.0.0', modules: { palette: { primary: '#2563eb', secondary: '#eff6ff', accent: '#7c3aed', mode: 'light' } } }, []);
    const { result } = renderHook(() => useBrandStudio(defaultBrand, defaultPlanInfo, mockOnSave, mockToast));
    await act(async () => { await result.current.applyFullPreset(preset.id); });
    expect(mockOnSave).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith('Preset aplicado com sucesso!', 'success');
  });

  it('applyFullPreset mostra erro para preset inexistente', async function() {
    const { result } = renderHook(() => useBrandStudio(defaultBrand, defaultPlanInfo, mockOnSave, mockToast));
    await act(async () => { await result.current.applyFullPreset('inexistente'); });
    expect(mockToast).toHaveBeenCalledWith('Preset nao encontrado.', 'error');
  });

  it('savePlanOverride salva override de plano', async function() {
    const { result } = renderHook(() => useBrandStudio(defaultBrand, defaultPlanInfo, mockOnSave, mockToast));
    await act(async () => { await result.current.savePlanOverride('pro', { modules: { palette: { primary: '#2563eb' } } }); });
    expect(mockOnSave).toHaveBeenCalled();
  });

  it('savePlanLogo salva logo do plano', async function() {
    const { result } = renderHook(() => useBrandStudio(defaultBrand, defaultPlanInfo, mockOnSave, mockToast));
    const colors = { blue: '#0000ff', green: '#00ff00', teal: '#00ffff', check: '#ffff00' };
    await act(async () => { await result.current.savePlanLogo('pro', colors); });
    expect(mockOnSave).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith('Logo personalizada salva para pro!', 'success');
  });

  it('savePlanLogo remove logo do plano quando null', async function() {
    const brandWithOverride = { ...defaultBrand, brand_config: JSON.stringify({ schemaVersion: '1.0.0', modules: {}, planOverrides: { pro: { logoColors: { blue: '#0000ff' } } } }) };
    const { result } = renderHook(() => useBrandStudio(brandWithOverride, defaultPlanInfo, mockOnSave, mockToast));
    await act(async () => { await result.current.savePlanLogo('pro', null); });
    expect(mockOnSave).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith('Plano pro agora usa a logo global.', 'success');
  });
});