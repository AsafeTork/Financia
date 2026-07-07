var DEFAULT_PLAN_THEMES = {
  free: {
    name: 'Free',
    description: 'Tema padrao do plano Gratuito',
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#002f59', secondary: '#e8f0f7', accent: '#1a6b5c', mode: 'light' }, typography: { style: 'modern', size: 'medium' }, borderRadius: { style: 'rounded' }, spacing: { density: 'comfortable' } } },
  },
  pro: {
    name: 'Pro',
    description: 'Tema padrao do plano Pro',
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#2563eb', secondary: '#eff6ff', accent: '#7c3aed', mode: 'light' }, typography: { style: 'modern', size: 'medium' }, sidebar: { style: 'minimal' }, cards: { style: 'raised' }, buttons: { style: 'rounded' }, borderRadius: { style: 'rounded' }, spacing: { density: 'comfortable' }, shadows: { intensity: 'medium' }, animations: { speed: 'fast' } } },
  },
  premium: {
    name: 'Premium',
    description: 'Tema padrao do plano Premium',
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#0f172a', secondary: '#f8fafc', accent: '#f59e0b', mode: 'light' }, typography: { style: 'modern', size: 'large' }, sidebar: { style: 'dark' }, cards: { style: 'raised' }, buttons: { style: 'rounded' }, inputs: { style: 'outlined' }, borderRadius: { style: 'rounded' }, spacing: { density: 'spacious' }, shadows: { intensity: 'strong' }, animations: { speed: 'normal' }, layout: { maxWidth: '1400px' } } },
  },
  white_label: {
    name: 'White Label',
    description: 'Personalizacao completa para revenda',
    config: { schemaVersion: '1.0.0', modules: { palette: { primary: '#002f59', secondary: '#e8f0f7', accent: '#1a6b5c', mode: 'light' }, typography: { style: 'modern', size: 'medium' }, sidebar: { style: 'solid' }, header: { style: 'solid' }, cards: { style: 'raised' }, buttons: { style: 'rounded' }, inputs: { style: 'outlined' }, borderRadius: { style: 'rounded' }, spacing: { density: 'comfortable' }, shadows: { intensity: 'subtle' }, animations: { speed: 'normal' } } },
  },
};

export function getPlanTheme(planId) {
  return DEFAULT_PLAN_THEMES[planId] || DEFAULT_PLAN_THEMES.free;
}

export function getPlanThemeConfig(planId) {
  var theme = getPlanTheme(planId);
  return theme ? theme.config : null;
}

export function listPlanThemes() {
  return Object.keys(DEFAULT_PLAN_THEMES).map(function(k) {
    return { planId: k, name: DEFAULT_PLAN_THEMES[k].name, description: DEFAULT_PLAN_THEMES[k].description };
  });
}

export function resolveBrandForPlan(brand, planInfo) {
  if (!planInfo || !planInfo.plan_id) return brand;
  if (planInfo.white_label && brand.brand_config) return brand;

  var planId = planInfo.plan_id;
  var planConfig = getPlanThemeConfig(planId);
  if (!planConfig) return brand;

  if (brand.brand_config) {
    try {
      var current = typeof brand.brand_config === 'string' ? JSON.parse(brand.brand_config) : brand.brand_config;
      if (current && current.modules) {
        return brand;
      }
    } catch (_) { /* JSON inválido — usa fallback do plano */ }
  }

  var pal = planConfig.modules && planConfig.modules.palette ? planConfig.modules.palette : {};
  return Object.assign({}, brand, {
    color: pal.primary || brand.color || '#002f59',
    color_secondary: pal.secondary || brand.color_secondary || '#e8f0f7',
    color_accent: pal.accent || brand.color_accent || '#1a6b5c',
    theme: pal.mode || brand.theme || 'light',
    brand_config: JSON.stringify(planConfig),
    visual_version: (brand.visual_version || 0) + 1,
    custom_palette: false,
  });
}
