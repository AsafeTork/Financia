import { describe, it, expect } from 'vitest';
import { validateBrandConfig, validateSchemaVersion, validateHexColor } from './validateBrandConfig.js';

const validConfig = {
  schemaVersion: '1.0.0',
  palette: {
    primary: '#002f59',
    secondary: '#e8f0f7',
    accent: '#1a6b5c',
    bgPage: '#f5f5f0',
    bgCard: '#ffffff',
    bgInput: '#ffffff',
    bgSubtle: '#f5f5f0',
    surface: '#ffffff',
    textMain: '#0f172a',
    textSub: '#5b6b7c',
    textMuted: '#94a3b8',
    border: '#edeae3',
    borderMd: '#e2ddd4',
  },
  theme: { mode: 'light' },
};

describe('validateBrandConfig', function() {

  it('retorna valid true para config valida', function() {
    const result = validateBrandConfig(validConfig);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('retorna erro para schemaVersion invalido', function() {
    const cfg = { ...validConfig, schemaVersion: '2.0.0' };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('valor invalido'))).toBe(true);
  });

  it('retorna erro para schemaVersion ausente', function() {
    const cfg = { ...validConfig };
    delete cfg.schemaVersion;
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('campo obrigatorio'))).toBe(true);
  });

  it('retorna erro para theme.mode invalido', function() {
    const cfg = { ...validConfig, theme: { mode: 'invalid' } };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('valor invalido'))).toBe(true);
  });

  it('retorna erro para primary hex invalido', function() {
    const cfg = { ...validConfig, palette: { ...validConfig.palette, primary: 'invalid' } };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('formato invalido'))).toBe(true);
  });

  it('retorna erro para secondary hex invalido', function() {
    const cfg = { ...validConfig, palette: { ...validConfig.palette, secondary: '#ggg' } };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
  });

  it('retorna erro para accent hex invalido', function() {
    const cfg = { ...validConfig, palette: { ...validConfig.palette, accent: 'not-hex' } };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
  });

  it('retorna erro para propriedades adicionais nao permitidas', function() {
    const cfg = { ...validConfig, extraField: 'not allowed' };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('propriedade nao permitida'))).toBe(true);
  });

  it('retorna erro para objeto null', function() {
    const result = validateBrandConfig(null);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('configuracao invalida');
  });

  it('retorna erro para objeto undefined', function() {
    const result = validateBrandConfig(undefined);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('configuracao invalida');
  });

  it('retorna erro para string em vez de objeto', function() {
    const result = validateBrandConfig('not an object');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('configuracao invalida');
  });

  it('valida campos obrigatorios da palette', function() {
    const cfg = { ...validConfig, palette: { primary: '#002f59' } };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('campo obrigatorio') && e.includes('secondary'))).toBe(true);
    expect(result.errors.some(e => e.includes('campo obrigatorio') && e.includes('accent'))).toBe(true);
  });

  it('valida typography fields', function() {
    const cfg = {
      ...validConfig,
      typography: { fontFamily: 123, fontDisplay: 'valid' },
    };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
  });

  it('valida logo fields', function() {
    const cfg = { ...validConfig, logo: { fallback: 'ABC' } };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('muito longo') || e.includes('maxLength'))).toBe(true);
  });

  it('valida borderRadius fields', function() {
    const cfg = { ...validConfig, borderRadius: { sm: 123 } };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('tipo invalido'))).toBe(true);
  });

  it('valida spacing fields', function() {
    const cfg = { ...validConfig, spacing: { unit: 1, cardPadding: '24px', sectionGap: '24px' } };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('valor muito baixo'))).toBe(true);
  });

  it('valida animations fields', function() {
    const cfg = { ...validConfig, animations: { enabled: true, speed: 'invalid' } };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('valor invalido'))).toBe(true);
  });

  it('valida planOverrides fields - tipo string aceito', function() {
    const cfg = { ...validConfig, planOverrides: { pro: { glowPrimary: '#ff0000' } } };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(true);
  });

  it('valida planOverrides - propriedades extras permitidas', function() {
    const cfg = { ...validConfig, planOverrides: { pro: { glowPrimary: '#ff0000', customProp: 'value' } } };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(true);
  });

  it('aceita palette com campos opcionais', function() {
    const cfg = {
      ...validConfig,
      palette: {
        ...validConfig.palette,
        success: '#16a34a',
        warning: '#d97706',
        danger: '#dc2626',
        info: '#2563eb',
      },
    };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(true);
  });

  it('rejeita config com modules aninhados (nao permitido no schema)', function() {
    const cfg = {
      ...validConfig,
      modules: {
        palette: validConfig.palette,
        typography: { fontFamily: 'Inter' },
      },
    };
    const result = validateBrandConfig(cfg);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('propriedade nao permitida') && e.includes('modules'))).toBe(true);
  });
});

describe('validateSchemaVersion', function() {

  it('retorna true para versao correta', function() {
    expect(validateSchemaVersion('1.0.0')).toBe(true);
  });

  it('retorna false para versao incorreta', function() {
    expect(validateSchemaVersion('2.0.0')).toBe(false);
    expect(validateSchemaVersion('0.9.0')).toBe(false);
    expect(validateSchemaVersion('')).toBe(false);
  });
});

describe('validateHexColor', function() {

  it('retorna true para hex valido', function() {
    expect(validateHexColor('#002f59')).toBe(true);
    expect(validateHexColor('#ffffff')).toBe(true);
    expect(validateHexColor('#000000')).toBe(true);
    expect(validateHexColor('#abcdef')).toBe(true);
    expect(validateHexColor('#ABCDEF')).toBe(true);
  });

  it('retorna false para hex invalido', function() {
    expect(validateHexColor('002f59')).toBe(false);
    expect(validateHexColor('#ggg')).toBe(false);
    expect(validateHexColor('#12345')).toBe(false);
    expect(validateHexColor('#1234567')).toBe(false);
    expect(validateHexColor('')).toBe(false);
    expect(validateHexColor(null)).toBe(false);
    expect(validateHexColor(undefined)).toBe(false);
  });
});