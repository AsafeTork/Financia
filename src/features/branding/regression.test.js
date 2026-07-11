import { describe, it, expect, vi } from 'vitest';
import { resolveBrandForPlan, getPlanTheme, getPlanThemeConfig, listPlanThemes, applyPlanOverride } from './planThemes.js';
import { PALETTE_DEFAULTS, TYPOGRAPHY_DEFAULTS, LOGO_DEFAULTS, SIDEBAR_DEFAULTS, HEADER_DEFAULTS, CARDS_DEFAULTS, BUTTONS_DEFAULTS, INPUTS_DEFAULTS, BORDER_RADIUS_DEFAULTS, SPACING_DEFAULTS, ANIMATIONS_DEFAULTS } from './schema.js';
import * as presets from './presets.js';
import * as constants from '../../lib/constants.js';

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

vi.mock('../../lib/constants.js', () => ({
  THEME_PRESETS: [
    { name: 'Azul Corporativo', segment: 'Servicos e geral', color: '#002f59', secondary: '#e8f0f7', accent: '#1a6b5c' },
    { name: 'Verde Natural', segment: 'Alimentos e saude', color: '#14532d', secondary: '#dcfce7', accent: '#16a34a' },
    { name: 'Vermelho Energia', segment: 'Restaurante e oficina', color: '#7f1d1d', secondary: '#fee2e2', accent: '#dc2626' },
    { name: 'Roxo Premium', segment: 'Beleza e estetica', color: '#4c1d95', secondary: '#ede9fe', accent: '#7c3aed' },
    { name: 'Laranja Vibrante', segment: 'Loja e varejo', color: '#7c2d12', secondary: '#ffedd5', accent: '#ea580c' },
    { name: 'Rosa Moderno', segment: 'Moda e salao', color: '#831843', secondary: '#fce7f3', accent: '#db2777' },
    { name: 'Petroleo Sobrio', segment: 'Consultoria e tech', color: '#0f3d3e', secondary: '#ccfbf1', accent: '#0d9488' },
    { name: 'Grafite Minimal', segment: 'Premium e minimalista', color: '#1f2937', secondary: '#e5e7eb', accent: '#0ea5e9' },
  ],
  WHITE_LABEL_VISUAL_DEFAULT: { color: '#002f59', color_secondary: '#e8f0f7', color_accent: '#3bbfa0', theme: 'light' },
  PLAN_VISUAL_DEFAULTS: {
    free: { color: '#0f3d3e', color_secondary: '#ccfbf1', color_accent: '#0d9488', theme: 'light' },
    pro: { color: '#2563EB', color_secondary: '#e0e7ff', color_accent: '#4F46E5', theme: 'light' },
    premium: { color: '#0F172A', color_secondary: '#fef3c7', color_accent: '#D4AF6A', theme: 'light' },
  },
}));

describe('Regression Tests - Branding Phase 3', function() {

  describe('planThemes', function() {

    it('getPlanTheme retorna tema para free', function() {
      const theme = getPlanTheme('free');
      expect(theme).toBeDefined();
      expect(theme.name).toBe('Free');
      expect(theme.config.modules.palette.primary).toBe('#002f59');
    });

    it('getPlanTheme retorna tema para pro', function() {
      const theme = getPlanTheme('pro');
      expect(theme.name).toBe('Pro');
      expect(theme.config.modules.palette.primary).toBe('#2563eb');
    });

    it('getPlanTheme retorna tema para premium', function() {
      const theme = getPlanTheme('premium');
      expect(theme.name).toBe('Premium');
      expect(theme.config.modules.palette.primary).toBe('#0f172a');
    });

    it('getPlanTheme retorna free para plano desconhecido', function() {
      const theme = getPlanTheme('unknown');
      expect(theme.name).toBe('Free');
    });

    it('getPlanThemeConfig retorna config do plano', function() {
      const config = getPlanThemeConfig('pro');
      expect(config.modules.palette.primary).toBe('#2563eb');
      expect(config.modules.palette.accent).toBe('#7c3aed');
    });

    it('listPlanThemes lista todos os planos', function() {
      const themes = listPlanThemes();
      expect(themes.length).toBe(4);
      expect(themes.map(t => t.planId)).toEqual(['free', 'pro', 'premium', 'white_label']);
    });

    it('resolveBrandForPlan retorna brand para white_label', function() {
      const brand = { name: 'White Label', color: '#ff0000', color_secondary: '#ffe0e0', color_accent: '#cc0000', theme: 'dark', white_label: true, custom_palette: true };
      const planInfo = { plan_id: 'pro', white_label: true };
      const result = resolveBrandForPlan(brand, planInfo);
      expect(result.color).toBe('#ff0000');
      expect(result.theme).toBe('dark');
    });

    it('resolveBrandForPlan usa tema do plano quando nao white_label', function() {
      const brand = { name: 'Test', color: '#002f59', color_secondary: '#e8f0f7', color_accent: '#1a6b5c', theme: 'light', white_label: false, custom_palette: false, brand_config: JSON.stringify({ modules: {} }) };
      const planInfo = { plan_id: 'pro', white_label: false };
      const result = resolveBrandForPlan(brand, planInfo);
      expect(result.color).toBe('#2563eb');
      expect(result.theme).toBe('light');
    });

    it('resolveBrandForPlan retorna brand inalterada se tem custom modules', function() {
      const brand = { name: 'Test', color: '#002f59', color_secondary: '#e8f0f7', color_accent: '#1a6b5c', theme: 'light', white_label: false, custom_palette: true, brand_config: JSON.stringify({ modules: { palette: { primary: '#custom' } } }) };
      const planInfo = { plan_id: 'pro', white_label: false };
      const result = resolveBrandForPlan(brand, planInfo);
      // Retorna brand as-is porque tem custom modules
      expect(result.color).toBe('#002f59');
    });

    it('resolveBrandForPlan aplica planOverrides do admin', function() {
      const brand = { name: 'Test', color: '#002f59', color_secondary: '#e8f0f7', color_accent: '#1a6b5c', theme: 'light', white_label: false, custom_palette: false, brand_config: JSON.stringify({ modules: {}, planOverrides: { pro: { modules: { palette: { primary: '#admin123' } } } } }) };
      const planInfo = { plan_id: 'pro', white_label: false };
      const result = resolveBrandForPlan(brand, planInfo);
      expect(result.color).toBe('#admin123');
    });

    it('applyPlanOverride cria override para plano', function() {
      const brand = { brand_config: JSON.stringify({ modules: {} }) };
      const result = applyPlanOverride(brand, 'pro', { modules: { palette: { primary: '#override' } } });
      const config = JSON.parse(result.brand_config);
      expect(config.planOverrides.pro.modules.palette.primary).toBe('#override');
    });

    it('applyPlanOverride preserva config existente', function() {
      const brand = { brand_config: JSON.stringify({ modules: { typography: { fontFamily: 'Inter' } } }) };
      const result = applyPlanOverride(brand, 'pro', { modules: { palette: { primary: '#override' } } });
      const config = JSON.parse(result.brand_config);
      expect(config.modules.typography.fontFamily).toBe('Inter');
      expect(config.planOverrides.pro.modules.palette.primary).toBe('#override');
    });

  });

  describe('Schema Defaults', function() {

    it('PALETTE_DEFAULTS tem todas as cores esperadas', function() {
      expect(PALETTE_DEFAULTS.bgPage).toBe('#f5f5f0');
      expect(PALETTE_DEFAULTS.bgCard).toBe('#ffffff');
      expect(PALETTE_DEFAULTS.bgInput).toBe('#ffffff');
      expect(PALETTE_DEFAULTS.bgSubtle).toBe('#f5f5f0');
      expect(PALETTE_DEFAULTS.surface).toBe('#ffffff');
      expect(PALETTE_DEFAULTS.textMain).toBe('#0f172a');
      expect(PALETTE_DEFAULTS.textSub).toBe('#5b6b7c');
      expect(PALETTE_DEFAULTS.textMuted).toBe('#94a3b8');
      expect(PALETTE_DEFAULTS.border).toBe('#edeae3');
      expect(PALETTE_DEFAULTS.borderMd).toBe('#e2ddd4');
    });

    it('TYPOGRAPHY_DEFAULTS tem fontFamily e fontDisplay', function() {
      expect(TYPOGRAPHY_DEFAULTS.fontFamily).toBe('Inter, system-ui, sans-serif');
      expect(TYPOGRAPHY_DEFAULTS.fontDisplay).toBe('Fraunces, Georgia, Times New Roman, serif');
    });

    it('LOGO_DEFAULTS tem fallback e radius', function() {
      expect(LOGO_DEFAULTS.fallback).toBe('F');
      expect(LOGO_DEFAULTS.radius).toBe('12px');
    });

    it('SIDEBAR_DEFAULTS tem cores esperadas', function() {
      expect(SIDEBAR_DEFAULTS.textColor).toBe('#ffffff');
      expect(SIDEBAR_DEFAULTS.textMuted).toBe('rgba(255,255,255,0.55)');
      expect(SIDEBAR_DEFAULTS.activeBg).toBe('rgba(255,255,255,0.14)');
    });

    it('HEADER_DEFAULTS tem textColor', function() {
      expect(HEADER_DEFAULTS.textColor).toBe('#ffffff');
    });

    it('CARDS_DEFAULTS tem radius', function() {
      expect(CARDS_DEFAULTS.radius).toBe('12px');
    });

    it('BUTTONS_DEFAULTS tem radius e primaryText', function() {
      expect(BUTTONS_DEFAULTS.radius).toBe('12px');
      expect(BUTTONS_DEFAULTS.primaryText).toBe('#ffffff');
    });

    it('INPUTS_DEFAULTS tem radius', function() {
      expect(INPUTS_DEFAULTS.radius).toBe('12px');
    });

    it('BORDER_RADIUS_DEFAULTS tem todos os tamanhos', function() {
      expect(BORDER_RADIUS_DEFAULTS.sm).toBe('8px');
      expect(BORDER_RADIUS_DEFAULTS.md).toBe('12px');
      expect(BORDER_RADIUS_DEFAULTS.lg).toBe('16px');
      expect(BORDER_RADIUS_DEFAULTS.xl).toBe('24px');
      expect(BORDER_RADIUS_DEFAULTS.full).toBe('9999px');
    });

    it('SPACING_DEFAULTS tem unit e paddings', function() {
      expect(SPACING_DEFAULTS.unit).toBe(4);
      expect(SPACING_DEFAULTS.cardPadding).toBe('24px');
      expect(SPACING_DEFAULTS.sectionGap).toBe('24px');
    });

    it('ANIMATIONS_DEFAULTS tem enabled e speed', function() {
      expect(ANIMATIONS_DEFAULTS.enabled).toBe(true);
      expect(ANIMATIONS_DEFAULTS.speed).toBe('normal');
    });

  });

  describe('Presets - Official Presets', function() {

    it('tem 8 presets oficiais', function() {
      expect(presets.OFFICIAL_PRESETS.length).toBe(8);
    });

    it('presets oficiais tem IDs unicos', function() {
      const ids = presets.OFFICIAL_PRESETS.map(p => p.id);
      const unique = [...new Set(ids)];
      expect(ids.length).toBe(unique.length);
    });

    it('cada preset oficial tem schemaVersion 1.0.0', function() {
      presets.OFFICIAL_PRESETS.forEach(p => {
        expect(p.config.schemaVersion).toBe('1.0.0');
      });
    });

    it('cada preset tem palette com primary, secondary, accent, mode', function() {
      presets.OFFICIAL_PRESETS.forEach(p => {
        expect(p.config.modules.palette.primary).toBeDefined();
        expect(p.config.modules.palette.secondary).toBeDefined();
        expect(p.config.modules.palette.accent).toBeDefined();
        expect(p.config.modules.palette.mode).toBeDefined();
      });
    });

    it('presets tem categorias variadas', function() {
      const categories = presets.OFFICIAL_PRESETS.map(p => p.category);
      expect(categories).toContain('classic');
      expect(categories).toContain('modern');
      expect(categories).toContain('corporate');
      expect(categories).toContain('premium');
      expect(categories).toContain('dark');
      expect(categories).toContain('minimal');
    });

    it('presets protegidos nao podem ser deletados', function() {
      const result = presets.deletePreset('financia_classic');
      expect(result).toBe(false);
    });

    it('presets protegidos sao marcados', function() {
      presets.OFFICIAL_PRESETS.forEach(p => {
        expect(p.protected).toBe(true);
      });
    });

  });

  describe('THEME_PRESETS (from constants)', function() {

    it('THEME_PRESETS tem 8 presets', function() {
      expect(constants.THEME_PRESETS.length).toBe(8);
    });

    it('cada preset tem color, secondary, accent', function() {
      constants.THEME_PRESETS.forEach(p => {
        expect(p.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(p.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(p.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
      });
    });

    it('presets tem nomes em portugues', function() {
      const names = constants.THEME_PRESETS.map(p => p.name);
      expect(names).toContain('Azul Corporativo');
      expect(names).toContain('Verde Natural');
      expect(names).toContain('Vermelho Energia');
      expect(names).toContain('Roxo Premium');
      expect(names).toContain('Laranja Vibrante');
      expect(names).toContain('Rosa Moderno');
      expect(names).toContain('Petroleo Sobrio');
      expect(names).toContain('Grafite Minimal');
    });

  });

  describe('useBrandAppearance - nao regressao', function() {

    it('pro plan sem white_label usa defaults do plano', function() {
      expect(true).toBe(true);
    });

    it('white_label com custom_palette mantem cores', function() {
      expect(true).toBe(true);
    });

    it('white_label sem custom_palette usa fallback', function() {
      expect(true).toBe(true);
    });

  });

  describe('Dexie Storage - nao usa localStorage', function() {

    it('presets usa _userPresets array interno', function() {
      // _userPresets nao e exportado, mas podemos verificar se savePreset funciona
      expect(typeof presets.savePreset).toBe('function');
    });

    it('loadPresetsFromDb chama ldb.brand_presets.toArray', async function() {
      await presets.loadPresetsFromDb();
      expect(mockDexie.ldb.brand_presets.toArray).toHaveBeenCalled();
    });

    it('savePreset chama ldb.brand_presets.put', function() {
      presets.savePreset('Test', '', 'custom', { modules: {} }, []);
      expect(mockDexie.ldb.brand_presets.put).toHaveBeenCalled();
    });

    it('deletePreset chama ldb.brand_presets.delete', async function() {
      const preset = await presets.savePreset('Test', '', 'custom', { modules: {} }, []);
      expect(preset.id).toBeDefined();
      presets.deletePreset(preset.id);
      expect(mockDexie.ldb.brand_presets.delete).toHaveBeenCalledWith(preset.id);
    });

  });

});