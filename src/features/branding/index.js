export { default as BrandStudioView } from './BrandStudioView.jsx';
export { default as useBrandStudio } from './useBrandStudio.js';
export { default as LogoSchemes } from './LogoSchemes.jsx';
export { default as PreviewGeral } from './PreviewGeral.jsx';
export { default as BrandGlobalEditor } from './BrandGlobalEditor.jsx';
export { default as PlanTabsEditor } from './PlanTabsEditor.jsx';
export { default as ModuleEditor } from './ModuleEditor.jsx';
export { validateAgainstModules, getSchema, normalizeModules, getDefaults, mergeWithDefaults } from './schemaRegistry.js';
export { default as previewValidate } from './previewValidator.js';
export { default as processResponse, requiresServiceRole, updateBrandConfig } from './responseProcessor.js';
export { enterPreviewMode, exitPreviewMode } from '../../shared/hooks/useBrandAppearance.js';
export { listPresets, getPreset, savePreset, deletePreset, duplicatePreset, toggleFavoritePreset, exportPreset, importPreset, getPresetCategories, OFFICIAL_PRESETS, loadPresetsFromDb } from './presets.js';
export { getPlanTheme, getPlanThemeConfig, listPlanThemes, resolveBrandForPlan, applyPlanOverride } from './planThemes.js';
export { generateLogoSvg, logoSvgToDataUrl, buildCheckPath } from './logoUtils.js';
export {
  DEFAULT_PALETTE_FIELDS,
  OFFICIAL_LOGO_COLORS,
  LOGO_ELEMENTS,
  CHECK_NORM,
  PLAN_PALETTE_DEFAULTS,
  SCHEMA_DEFAULTS,
  CSS_VAR_DEFAULTS,
  CSS_VAR_LIST,
  PALETTE_UI_FIELDS,
  PALETTE_PREVIEW_KEYS,
  PLAN_META,
  getDefaultPaletteForPlan,
  getAllPaletteKeys,
  PALETTE_DEFAULTS,
  TYPOGRAPHY_DEFAULTS,
  LOGO_DEFAULTS,
  SIDEBAR_DEFAULTS,
  HEADER_DEFAULTS,
  CARDS_DEFAULTS,
  BUTTONS_DEFAULTS,
  INPUTS_DEFAULTS,
  BORDER_RADIUS_DEFAULTS,
  SHADOWS_DEFAULTS,
  SPACING_DEFAULTS,
  ANIMATIONS_DEFAULTS,
  THEME_DEFAULTS,
  PLAN_OVERRIDES_DEFAULTS,
} from './defaults.js';