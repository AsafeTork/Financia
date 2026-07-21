// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { processResponse, requiresServiceRole, updateBrandConfig } from './responseProcessor.js';

describe('responseProcessor', function() {

  const baseResponse = {
    schemaVersion: '1.0.0',
    modules: {
      palette: {
        primary: '#2563eb',
        secondary: '#eff6ff',
        accent: '#7c3aed',
        mode: 'light',
      },
    },
  };

  it('processa resposta valida com modulo palette', function() {
    const response = JSON.stringify(baseResponse);
    const brand = { name: 'Test', color: '#002f59', color_secondary: '#e8f0f7', color_accent: '#1a6b5c', theme: 'light', visual_version: 0 };
    const result = processResponse(response, brand);
    expect(result.success).toBe(true);
    expect(result.proposedBrand).toBeDefined();
    expect(result.proposedBrand.color).toBe('#2563eb');
    expect(result.proposedBrand.color_secondary).toBe('#eff6ff');
    expect(result.proposedBrand.color_accent).toBe('#7c3aed');
    expect(result.proposedBrand.theme).toBe('light');
    expect(result.proposedBrand.brand_config).toBe(response);
    expect(result.proposedBrand.visual_version).toBe(1);
    expect(result.proposedBrand.custom_palette).toBe(true);
  });

  it('mantem nome da marca original', function() {
    const response = JSON.stringify({ 
      schemaVersion: '1.0.0',
      modules: { palette: { primary: '#ff0000', secondary: '#ffe0e0', accent: '#cc0000', mode: 'light' } } 
    });
    const brand = { name: 'Minha Marca', color: '#002f59', color_secondary: '#e8f0f7', color_accent: '#1a6b5c', theme: 'light', visual_version: 0 };
    const result = processResponse(response, brand);
    expect(result.proposedBrand.name).toBe('Minha Marca');
  });

  it('usa cores padrao quando palette nao fornecida', function() {
    const response = JSON.stringify({ schemaVersion: '1.0.0', modules: {} });
    const brand = { color: '#002f59', color_secondary: '#e8f0f7', color_accent: '#1a6b5c', theme: 'light', visual_version: 0 };
    const result = processResponse(response, brand);
    expect(result.proposedBrand.color).toBe('#002f59');
    expect(result.proposedBrand.color_secondary).toBe('#e8f0f7');
    expect(result.proposedBrand.color_accent).toBe('#1a6b5c');
  });

  it('usa tema da marca quando mode nao fornecido', function() {
    const response = JSON.stringify({ schemaVersion: '1.0.0', modules: { palette: { primary: '#ff0000', secondary: '#ffe0e0', accent: '#cc0000' } } });
    const brand = { theme: 'dark', visual_version: 0 };
    const result = processResponse(response, brand);
    expect(result.proposedBrand.theme).toBe('dark');
  });

  it('usa light como tema padrao', function() {
    const response = JSON.stringify({ schemaVersion: '1.0.0', modules: { palette: { primary: '#ff0000', secondary: '#ffe0e0', accent: '#cc0000' } } });
    const brand = { visual_version: 0 };
    const result = processResponse(response, brand);
    expect(result.proposedBrand.theme).toBe('light');
  });

  it('incrementa visual_version', function() {
    const response = JSON.stringify({ schemaVersion: '1.0.0', modules: { palette: { primary: '#ff0000', secondary: '#ffe0e0', accent: '#cc0000', mode: 'light' } } });
    const brand = { visual_version: 5 };
    const result = processResponse(response, brand);
    expect(result.proposedBrand.visual_version).toBe(6);
  });

  it('retorna erro para JSON invalido', function() {
    const result = processResponse('invalid json', {});
    expect(result.success).toBe(false);
    expect(result.step).toBe('parse');
    expect(result.error).toContain('Erro inesperado');
  });

  it('retorna erro para resposta nao-objeto', function() {
    const result = processResponse('"just a string"', {});
    expect(result.success).toBe(false);
    expect(result.step).toBe('parse');
    expect(result.error).toBe('Resposta invalida');
  });

  it('retorna erro para null', function() {
    const result = processResponse(null, {});
    expect(result.success).toBe(false);
    expect(result.step).toBe('parse');
    expect(result.error).toBe('Resposta invalida');
  });

  it('retorna erro para array', function() {
    const result = processResponse('[]', {});
    expect(result.success).toBe(false);
    expect(['parse', 'validation']).toContain(result.step);
    expect(result.error).toContain('Resposta invalida');
  });

  it('aceita objeto ja parseado', function() {
    const response = { schemaVersion: '1.0.0', modules: { palette: { primary: '#ff0000', secondary: '#ffe0e0', accent: '#cc0000', mode: 'light' } } };
    const brand = { visual_version: 0 };
    const result = processResponse(response, brand);
    expect(result.success).toBe(true);
  });

  it('serializa brand_config como string JSON', function() {
    const response = { schemaVersion: '1.0.0', modules: { palette: { primary: '#ff0000', secondary: '#ffe0e0', accent: '#cc0000', mode: 'light' } } };
    const brand = { visual_version: 0 };
    const result = processResponse(response, brand);
    expect(typeof result.proposedBrand.brand_config).toBe('string');
    const parsed = JSON.parse(result.proposedBrand.brand_config);
    expect(parsed).toEqual(response);
  });

  it('define custom_palette como true', function() {
    const response = { schemaVersion: '1.0.0', modules: { palette: { primary: '#ff0000', secondary: '#ffe0e0', accent: '#cc0000', mode: 'light' } } };
    const brand = { visual_version: 0 };
    const result = processResponse(response, brand);
    expect(result.proposedBrand.custom_palette).toBe(true);
  });

  it('preserva campos existentes da marca nao sobrescritos', function() {
    const response = { schemaVersion: '1.0.0', modules: { palette: { primary: '#ff0000', secondary: '#ffe0e0', accent: '#cc0000', mode: 'light' } } };
    const brand = { name: 'Test', logo_url: 'data:image/png;base64,abc', visual_version: 0 };
    const result = processResponse(response, brand);
    expect(result.proposedBrand.name).toBe('Test');
    expect(result.proposedBrand.logo_url).toBe('data:image/png;base64,abc');
  });
});

describe('requiresServiceRole', function() {
  it('retorna true para brand sem white_label', function() {
    expect(requiresServiceRole({ white_label: false })).toBe(true);
  });

  it('retorna false para brand com white_label true', function() {
    expect(requiresServiceRole({ white_label: true })).toBe(false);
  });

  it('retorna true para brand nulo', function() {
    expect(requiresServiceRole(null)).toBe(true);
  });

  it('retorna true para brand undefined', function() {
    expect(requiresServiceRole(undefined)).toBe(true);
  });

  it('retorna true para brand sem white_label field', function() {
    expect(requiresServiceRole({ name: 'Test' })).toBe(true);
  });
});

describe('updateBrandConfig', function() {
  it('retorna ok true quando Edge Function responde com ok', async function() {
    const mockClient = {
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: { ok: true }, error: null }),
      },
    };
    var result = await updateBrandConfig(mockClient, { modules: {} });
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockClient.functions.invoke).toHaveBeenCalledWith('update-brand-config', {
      body: { brand_config: { modules: {} } },
    });
  });

  it('retorna ok false quando Edge Function retorna erro', async function() {
    const mockClient = {
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: new Error('network error') }),
      },
    };
    var result = await updateBrandConfig(mockClient, { modules: {} });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('network error');
  });

  it('retorna ok false quando Edge Function retorna data.error', async function() {
    const mockClient = {
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: { error: 'missing_brand_config' }, error: null }),
      },
    };
    var result = await updateBrandConfig(mockClient, null);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('missing_brand_config');
  });

  it('retorna ok false quando invoke lanca excecao', async function() {
    const mockClient = {
      functions: {
        invoke: vi.fn().mockRejectedValue(new Error('timeout')),
      },
    };
    var result = await updateBrandConfig(mockClient, { modules: {} });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('timeout');
  });
});