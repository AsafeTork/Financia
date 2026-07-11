import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';
import * as presets from './presets.js';

const mockToast = vi.fn();
const mockOnSave = vi.fn();

function resetMocks() {
  mockToast.mockClear();
  mockOnSave.mockClear();
}

const mockDexie = vi.hoisted(() => ({
  ldb: {
    brand_presets: {
      toArray: vi.fn(() => Promise.resolve([])),
      put: vi.fn(() => Promise.resolve(1)),
      delete: vi.fn(() => Promise.resolve(1)),
    },
  },
}));

vi.mock('../../lib/dexie.js', () => mockDexie);

describe('presets', function() {

  beforeEach(function() {
    resetMocks();
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(function() {
    vi.useRealTimers();
    presets.setOnChange(null);
  });

  it('carrega presets do DB', async function() {
    await act(async function() { await presets.loadPresetsFromDb(); });
    expect(mockDexie.ldb.brand_presets.toArray).toHaveBeenCalled();
  });

  it('lista presets oficiais + usuario', function() {
    const presetList = presets.listPresets();
    expect(presetList.length).toBeGreaterThanOrEqual(8); // 8 oficiais
    expect(presetList.some(p => p.id === 'financia_classic')).toBe(true);
    expect(presetList.some(p => p.id === 'financia_modern')).toBe(true);
    expect(presetList.some(p => p.protected === true)).toBe(true);
  });

  it('getPreset retorna preset oficial', function() {
    const preset = presets.getPreset('financia_classic');
    expect(preset).toBeDefined();
    expect(preset.name).toBe('Financia Classic');
    expect(preset.config.modules.palette.primary).toBe('#002f59');
  });

  it('getPreset retorna preset de usuario', async function() {
    const saved = await presets.savePreset('Meu Preset', 'Desc', 'custom', { schemaVersion: '1.0.0', modules: {} }, ['tag1']);
    const preset = presets.getPreset(saved.id);
    expect(preset).toBeDefined();
    expect(preset.name).toBe('Meu Preset');
    expect(preset.author).toBe('Usuario');
    expect(preset.protected).toBe(false);
  });

  it('savePreset salva no array e DB', async function() {
    const preset = await presets.savePreset('Novo', 'Desc', 'custom', { modules: {} }, ['tag']);
    expect(preset.id).toMatch(/^preset_\d+_/);
    expect(preset.name).toBe('Novo');
    expect(preset.category).toBe('custom');
    expect(preset.tags).toEqual(['tag']);
    expect(mockDexie.ldb.brand_presets.put).toHaveBeenCalled();
  });

  it('deletePreset remove preset de usuario', async function() {
    const preset = await presets.savePreset('Para Deletar', '', 'custom', { modules: {} }, []);
    const result = presets.deletePreset(preset.id);
    expect(result).toBe(true);
    expect(presets.getPreset(preset.id)).toBeNull();
    expect(mockDexie.ldb.brand_presets.delete).toHaveBeenCalledWith(preset.id);
  });

  it('deletePreset nao remove preset oficial', function() {
    const result = presets.deletePreset('financia_classic');
    expect(result).toBe(false);
    expect(presets.getPreset('financia_classic')).toBeDefined();
  });

  it('duplicatePreset cria copia', async function() {
    const original = await presets.savePreset('Original', 'Desc', 'custom', { modules: { palette: { primary: '#ff0000' } } }, ['tag']);
    const copy = await presets.duplicatePreset(original.id);
    expect(copy).toBeDefined();
    expect(copy.name).toBe('Original (copia)');
    expect(copy.config).toEqual(original.config);
    expect(copy.id).not.toBe(original.id);
  });

  it('duplicatePreset retorna null para inexistente', async function() {
    const result = await presets.duplicatePreset('inexistente');
    expect(result).toBeNull();
  });

  it('toggleFavoritePreset alterna favorito', async function() {
    const preset = await presets.savePreset('Fav', '', 'custom', { modules: {} }, []);
    expect(preset.favorite).toBe(false);
    const result1 = presets.toggleFavoritePreset(preset.id);
    expect(result1).toBe(true);
    const updated = presets.getPreset(preset.id);
    expect(updated.favorite).toBe(true);
    const result2 = presets.toggleFavoritePreset(preset.id);
    expect(result2).toBe(false);
    const updated2 = presets.getPreset(preset.id);
    expect(updated2.favorite).toBe(false);
  });

  it('toggleFavoritePreset retorna false para inexistente', function() {
    const result = presets.toggleFavoritePreset('inexistente');
    expect(result).toBe(false);
  });

  it('exportPreset retorna JSON string', async function() {
    const preset = await presets.savePreset('Exportar', 'Desc', 'custom', { modules: { palette: { primary: '#ff0000' } } }, ['tag']);
    const json = presets.exportPreset(preset.id);
    expect(json).toBeDefined();
    const parsed = JSON.parse(json);
    expect(parsed.preset).toBeDefined();
    expect(parsed.meta.name).toBe('Exportar');
  });

  it('exportPreset retorna null para inexistente', function() {
    const result = presets.exportPreset('inexistente');
    expect(result).toBeNull();
  });

  it('importPreset importa preset de JSON', async function() {
    const json = JSON.stringify({
      preset: { schemaVersion: '1.0.0', modules: { palette: { primary: '#111111' } } },
      meta: { name: 'Importado', description: 'Teste', category: 'imported', tags: ['import'] },
    });
    const imported = await presets.importPreset(json);
    expect(imported).toBeDefined();
    expect(imported.name).toBe('Importado');
    expect(imported.category).toBe('imported');
  });

  it('importPreset retorna null para JSON invalido', async function() {
    const result = await presets.importPreset('invalid json');
    expect(result).toBeNull();
  });

  it('getPresetCategories retorna categorias ordenadas', function() {
    const cats = presets.getPresetCategories();
    expect(cats.length).toBeGreaterThan(0);
    expect(cats[0]).toHaveProperty('name');
    expect(cats[0]).toHaveProperty('count');
    // Ordenacao alfabetica
    for (let i = 1; i < cats.length; i++) {
      expect(cats[i].name >= cats[i-1].name).toBe(true);
    }
  });

  it('setOnChange registra callback', function() {
    const fn = vi.fn();
    presets.setOnChange(fn);
    // Trigger via savePreset
    act(async function() { await presets.savePreset('Test', '', 'custom', { modules: {} }, []); });
    expect(fn).toHaveBeenCalled();
  });

});