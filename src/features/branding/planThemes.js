import { WHITE_LABEL_VISUAL_DEFAULT } from '../../lib/constants.js';

const DEFAULT_PLAN_THEMES = {
  free: {
    name: 'Free',
    description: 'Tema padrao do plano Gratuito',
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#002f59', secondary: '#e8f0f7', accent: '#1a6b5c', mode: 'light' }, typography: { style: 'modern', size: 'medium' }, sidebar: { style: 'solid' }, cards: { style: 'raised' }, buttons: { style: 'rounded' }, borderRadius: { style: 'rounded' }, spacing: { density: 'comfortable' }, shadows: { intensity: 'subtle' }, animations: { speed: 'normal' } } },
  },
  pro: {
    name: 'Pro',
    description: 'Tema padrao do plano Pro',
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#2563eb', secondary: '#eff6ff', accent: '#7c3aed', mode: 'light' }, typography: { style: 'modern', size: 'medium' }, sidebar: { style: 'minimal' }, cards: { style: 'flat' }, buttons: { style: 'pill' }, inputs: { style: 'minimal' }, borderRadius: { style: 'rounded' }, spacing: { density: 'comfortable' }, shadows: { intensity: 'medium' }, animations: { speed: 'fast' } } },
  },
  premium: {
    name: 'Premium',
    description: 'Tema padrao do plano Premium',
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#0f172a', secondary: '#f8fafc', accent: '#f59e0b', mode: 'light' }, typography: { style: 'modern', size: 'large' }, sidebar: { style: 'dark' }, cards: { style: 'raised' }, buttons: { style: 'rounded' }, inputs: { style: 'outlined' }, borderRadius: { style: 'rounded' }, spacing: { density: 'spacious' }, shadows: { intensity: 'strong' }, animations: { speed: 'normal' }, layout: { maxWidth: '1400px' } } },
  },
  white_label: {
    name: 'White Label',
    description: 'Personalizacao completa para revenda',
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: WHITE_LABEL_VISUAL_DEFAULT.color, secondary: WHITE_LABEL_VISUAL_DEFAULT.color_secondary, accent: WHITE_LABEL_VISUAL_DEFAULT.color_accent, mode: WHITE_LABEL_VISUAL_DEFAULT.theme }, typography: { style: 'modern', size: 'medium' }, sidebar: { style: 'solid' }, header: { style: 'solid' }, cards: { style: 'raised' }, buttons: { style: 'rounded' }, inputs: { style: 'outlined' }, borderRadius: { style: 'rounded' }, spacing: { density: 'comfortable' }, shadows: { intensity: 'subtle' }, animations: { speed: 'normal' } } },
  },
};

export function getPlanTheme(planId) {
  return DEFAULT_PLAN_THEMES[planId] || DEFAULT_PLAN_THEMES.free;
}

export function getPlanThemeConfig(planId) {
  const theme = getPlanTheme(planId);
  return theme ? theme.config : null;
}

export function listPlanThemes() {
  return Object.keys(DEFAULT_PLAN_THEMES).map(k => ({
    planId: k, name: DEFAULT_PLAN_THEMES[k].name, description: DEFAULT_PLAN_THEMES[k].description,
  }));
}

export function resolveBrandForPlan(brand, planInfo) {
  if (!planInfo || !planInfo.plan_id) return brand;
  if (planInfo.white_label) return brand;

  const planId = planInfo.plan_id;
  const planConfig = getPlanThemeConfig(planId);
  if (!planConfig) return brand;

  let cfg = null;
  try { cfg = typeof brand.brand_config === 'string' ? JSON.parse(brand.brand_config) : brand.brand_config; } catch (_) { void _; }

  const hasCustomModules = cfg && cfg.modules && Object.keys(cfg.modules).length > 0;
  if (hasCustomModules && !planInfo.white_label) {
    return brand;
  }

  const mergedConfig = JSON.parse(JSON.stringify(planConfig));

  if (cfg && cfg.planOverrides && cfg.planOverrides[planId]) {
    const override = cfg.planOverrides[planId];
    if (override.modules) {
      for (const modKey of Object.keys(override.modules)) {
        if (!mergedConfig.modules) mergedConfig.modules = {};
        mergedConfig.modules[modKey] = { ...(mergedConfig.modules[modKey] || {}), ...override.modules[modKey] };
      }
    }
    if (override.logo_url) {
      mergedConfig.logo_url = override.logo_url;
    }
  }

  const pal = mergedConfig.modules?.palette || {};
  const overrideLogo = mergedConfig.logo_url || '';

  return {
    ...brand,
    color: pal.primary || brand.color || '#002f59',
    color_secondary: pal.secondary || brand.color_secondary || '#e8f0f7',
    color_accent: pal.accent || brand.color_accent || '#1a6b5c',
    theme: pal.mode || brand.theme || 'light',
    brand_config: JSON.stringify(mergedConfig),
    visual_version: (brand.visual_version || 0) + 1,
    custom_palette: false,
    logo_url: overrideLogo || brand.logo_url,
  };
}

export function applyPlanOverride(brand, planId, overrideData) {
  let cfg = { modules: {} };
  try { cfg = typeof brand.brand_config === 'string' ? JSON.parse(brand.brand_config) : (brand.brand_config || { modules: {} }); } catch (_) { void _; }
  if (!cfg.planOverrides) cfg.planOverrides = {};
  cfg.planOverrides[planId] = overrideData;
  return { ...brand, brand_config: JSON.stringify(cfg) };
}