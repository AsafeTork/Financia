import { normalizeModules } from './schemaRegistry.js';

export function normalizeBrandInput(input) {
  if (!input || typeof input !== 'object') return null;

  if (input.modules) {
    var normalized = normalizeModules(input);
    return buildLegacyCompat(normalized);
  }

  return migrateV1ToV2(input);
}

function migrateV1ToV2(v1) {
  var modules = {};

  modules.palette = {
    primary: v1.palette && v1.palette.primary,
    secondary: v1.palette && v1.palette.secondary,
    accent: v1.palette && v1.palette.accent,
    bgPage: v1.palette && v1.palette.bgPage,
    bgCard: v1.palette && v1.palette.bgCard,
    bgInput: v1.palette && v1.palette.bgInput,
    bgSubtle: v1.palette && v1.palette.bgSubtle,
    surface: v1.palette && v1.palette.surface,
    textMain: v1.palette && v1.palette.textMain,
    textSub: v1.palette && v1.palette.textSub,
    textMuted: v1.palette && v1.palette.textMuted,
    border: v1.palette && v1.palette.border,
    mode: v1.theme && v1.theme.mode,
  };
  if (v1.typography) modules.typography = { fontFamily: v1.typography.fontFamily, headingFont: v1.typography.fontDisplay };
  if (v1.sidebar) modules.sidebar = { bg: v1.sidebar.background, text: v1.sidebar.textColor, activeBg: v1.sidebar.activeBg, textMuted: v1.sidebar.textMuted };
  if (v1.header) modules.header = { bg: v1.header.background, text: v1.header.textColor };
  if (v1.cards) modules.cards = { bg: v1.cards.background, radius: v1.cards.radius };
  if (v1.buttons) modules.buttons = { radius: v1.buttons.radius, primaryBg: v1.buttons.primaryBg, primaryText: v1.buttons.primaryText };
  if (v1.inputs) modules.inputs = { bg: v1.inputs.background, border: v1.inputs.border, radius: v1.inputs.radius };
  if (v1.borderRadius) modules.borderRadius = v1.borderRadius;
  if (v1.shadows) modules.shadows = v1.shadows;
  if (v1.spacing) modules.spacing = { unit: v1.spacing.unit, gap: v1.spacing.sectionGap, card: v1.spacing.cardPadding };
  if (v1.animations) modules.animations = v1.animations;

  var result = { schemaVersion: v1.schemaVersion || '1.0.0', modules: modules };

  return normalizeModules(result);
}

function buildLegacyCompat(normalized) {
  var mods = normalized.modules || {};
  var pal = mods.palette || {};
  return {
    schemaVersion: normalized.schemaVersion,
    modules: mods,
    brandName: normalized.brandName || '',
    theme: { mode: pal.mode || 'light' },
    palette: {
      primary: pal.primary,
      secondary: pal.secondary,
      accent: pal.accent,
      bgPage: pal.bgPage,
      bgCard: pal.bgCard,
      bgInput: pal.bgInput,
      bgSubtle: pal.bgSubtle,
      surface: pal.surface,
      textMain: pal.textMain,
      textSub: pal.textSub,
      textMuted: pal.textMuted,
      border: pal.border,
    },
    typography: mods.typography ? { fontFamily: mods.typography.fontFamily, fontDisplay: mods.typography.headingFont } : undefined,
    sidebar: mods.sidebar ? { background: mods.sidebar.bg, textColor: mods.sidebar.text, activeBg: mods.sidebar.activeBg, textMuted: mods.sidebar.divider } : undefined,
    header: mods.header ? { background: mods.header.bg, textColor: mods.header.text } : undefined,
    cards: mods.cards ? { background: mods.cards.bg, radius: mods.cards.radius } : undefined,
    buttons: mods.buttons,
    inputs: mods.inputs,
    borderRadius: mods.borderRadius,
    shadows: mods.shadows,
    spacing: mods.spacing ? { unit: mods.spacing.unit, cardPadding: mods.spacing.card, sectionGap: mods.spacing.section } : undefined,
    animations: mods.animations,
  };
}

export function convertToBrandConfig(normalized) {
  var mods = normalized.modules || {};
  var pal = mods.palette || {};
  return {
    palette: {
      primary: pal.primary || '#002f59',
      secondary: pal.secondary || '#e8f0f7',
      accent: pal.accent || '#1a6b5c',
      bgPage: pal.bgPage || '#f5f5f0',
      bgCard: pal.bgCard || '#ffffff',
      bgInput: pal.bgInput || '#ffffff',
      bgSubtle: pal.bgSubtle || '#f5f5f0',
      surface: pal.surface || '#ffffff',
      textMain: pal.textMain || '#0f172a',
      textSub: pal.textSub || '#5b6b7c',
      textMuted: pal.textMuted || '#94a3b8',
      border: pal.border || '#edeae3',
      success: pal.success,
      warning: pal.warning,
      danger: pal.danger,
      info: pal.info,
      positive: pal.positive,
      negative: pal.negative,
      chart1: pal.chart1,
      chart2: pal.chart2,
      chart3: pal.chart3,
      chart4: pal.chart4,
      chart5: pal.chart5,
      chart6: pal.chart6,
    },
    typography: mods.typography || null,
    sidebar: mods.sidebar || null,
    header: mods.header || null,
    cards: mods.cards || null,
    buttons: mods.buttons || null,
    inputs: mods.inputs || null,
    borderRadius: mods.borderRadius || null,
    shadows: mods.shadows || null,
    spacing: mods.spacing || null,
    animations: mods.animations || null,
    layout: mods.layout || null,
  };
}
