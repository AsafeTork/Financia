export const BRAND_SCHEMA_VERSION = '1.0.0';

export const PALETTE_DEFAULTS = {
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
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  info: '#2563eb',
  mode: 'light',
};

export const TYPOGRAPHY_DEFAULTS = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontDisplay: 'Fraunces, Georgia, Times New Roman, serif',
  style: 'modern',
  size: 'medium',
};

export const LOGO_DEFAULTS = {
  url: null,
  fallback: 'F',
  radius: '12px',
  colors: null,
};

export const SIDEBAR_DEFAULTS = {
  background: '#002f59',
  textColor: '#ffffff',
  textMuted: 'rgba(255,255,255,0.55)',
  activeBg: 'rgba(255,255,255,0.14)',
  style: 'solid',
};

export const HEADER_DEFAULTS = {
  background: '#002f59',
  textColor: '#ffffff',
  style: 'solid',
};

export const CARDS_DEFAULTS = {
  background: '#ffffff',
  radius: '12px',
  style: 'raised',
};

export const BUTTONS_DEFAULTS = {
  radius: '12px',
  primaryBg: '#002f59',
  primaryText: '#ffffff',
  style: 'rounded',
};

export const INPUTS_DEFAULTS = {
  background: '#ffffff',
  border: '#edeae3',
  radius: '12px',
  style: 'outlined',
};

export const BORDER_RADIUS_DEFAULTS = {
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '9999px',
  style: 'rounded',
};

export const SHADOWS_DEFAULTS = {
  sm: '0 1px 2px rgba(0,47,89,0.04)',
  md: '0 2px 8px rgba(0,47,89,0.05)',
  lg: '0 8px 24px rgba(0,47,89,0.08)',
  intensity: 'subtle',
};

export const SPACING_DEFAULTS = {
  unit: 4,
  cardPadding: '24px',
  sectionGap: '24px',
  density: 'comfortable',
};

export const ANIMATIONS_DEFAULTS = {
  enabled: true,
  speed: 'normal',
};

export const THEME_DEFAULTS = {
  mode: 'light',
};

export const PLAN_OVERRIDES_DEFAULTS = {};

export const SCHEMA_DEFAULTS = {
  schemaVersion: BRAND_SCHEMA_VERSION,
  modules: {
    palette: PALETTE_DEFAULTS,
    typography: TYPOGRAPHY_DEFAULTS,
    logo: LOGO_DEFAULTS,
    sidebar: SIDEBAR_DEFAULTS,
    header: HEADER_DEFAULTS,
    cards: CARDS_DEFAULTS,
    buttons: BUTTONS_DEFAULTS,
    inputs: INPUTS_DEFAULTS,
    borderRadius: BORDER_RADIUS_DEFAULTS,
    shadows: SHADOWS_DEFAULTS,
    spacing: SPACING_DEFAULTS,
    animations: ANIMATIONS_DEFAULTS,
    theme: THEME_DEFAULTS,
    planOverrides: PLAN_OVERRIDES_DEFAULTS,
  },
};

export const DEFAULT_PALETTE_FIELDS = [
  { key: 'primary', label: 'Primaria', desc: 'Sidebar, botoes, navegacao' },
  { key: 'secondary', label: 'Secundaria', desc: 'Cards, badges, tags' },
  { key: 'accent', label: 'Destaque', desc: 'Hover, graficos, progresso' },
  { key: 'bgPage', label: 'Fundo pagina', desc: 'Fundo principal' },
  { key: 'bgCard', label: 'Fundo card', desc: 'Fundo dos cartoes' },
  { key: 'bgInput', label: 'Fundo input', desc: 'Fundo dos campos' },
  { key: 'bgSubtle', label: 'Fundo sutil', desc: 'Realce secundario' },
  { key: 'surface', label: 'Superficie', desc: 'Elementos elevados' },
  { key: 'textMain', label: 'Texto principal', desc: 'Cor do texto' },
  { key: 'textSub', label: 'Texto secundario', desc: 'Subtitulos' },
  { key: 'textMuted', label: 'Texto muted', desc: 'Descricoes' },
  { key: 'border', label: 'Borda', desc: 'Bordas dos elementos' },
  { key: 'borderMd', label: 'Borda media', desc: 'Bordas secundarias' },
  { key: 'success', label: 'Sucesso', desc: 'Indicador positivo' },
  { key: 'warning', label: 'Alerta', desc: 'Indicador atencao' },
  { key: 'danger', label: 'Erro', desc: 'Indicador negativo' },
  { key: 'info', label: 'Info', desc: 'Indicador informativo' },
];

export const PALETTE_PREVIEW_KEYS = ['primary', 'secondary', 'accent'];

export const PLAN_META = {
  free: { label: 'Free', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  pro: { label: 'Pro', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  premium: { label: 'Premium', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  white_label: { label: 'White Label', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
};

export const OFFICIAL_LOGO_COLORS = {
  blue: '#002f59',
  green: '#1a6b5c',
  teal: '#6ec6c8',
  check: '#8cf2d1',
};

export const LOGO_ELEMENTS = [
  { id: 'blue', label: 'Coluna 1' },
  { id: 'green', label: 'Coluna 2' },
  { id: 'teal', label: 'Coluna 3' },
  { id: 'check', label: 'Check' },
];

export const CHECK_NORM = [
  { x: 1.0, y: 0.17 }, { x: 0.87, y: 0 }, { x: 0.36, y: 0.66 }, { x: 0.13, y: 0.35 },
  { x: 0, y: 0.52 }, { x: 0.12, y: 0.68 }, { x: 0.24, y: 0.84 }, { x: 0.36, y: 1.0 },
];

export const PLAN_PALETTE_DEFAULTS = {
  free: {
    primary: '#002f59', secondary: '#e8f0f7', accent: '#1a6b5c',
    bgPage: '#f5f5f0', bgCard: '#ffffff', bgInput: '#ffffff', bgSubtle: '#f5f5f0',
    surface: '#ffffff', textMain: '#0f172a', textSub: '#5b6b7c', textMuted: '#94a3b8',
    border: '#edeae3', borderMd: '#e2ddd4',
    success: '#16a34a', warning: '#f59e0b', danger: '#dc2626', info: '#2563eb',
  },
  pro: {
    primary: '#2563eb', secondary: '#eff6ff', accent: '#7c3aed',
    bgPage: '#f8fafc', bgCard: '#ffffff', bgInput: '#ffffff', bgSubtle: '#f1f5f9',
    surface: '#ffffff', textMain: '#0f172a', textSub: '#475569', textMuted: '#94a3b8',
    border: '#e2e8f0', borderMd: '#cbd5e1',
    success: '#16a34a', warning: '#f59e0b', danger: '#dc2626', info: '#2563eb',
  },
  premium: {
    primary: '#0f172a', secondary: '#f8fafc', accent: '#f59e0b',
    bgPage: '#fafafa', bgCard: '#ffffff', bgInput: '#ffffff', bgSubtle: '#f5f5f5',
    surface: '#ffffff', textMain: '#171717', textSub: '#525252', textMuted: '#a3a3a3',
    border: '#e5e5e5', borderMd: '#d4d4d4',
    success: '#16a34a', warning: '#f59e0b', danger: '#dc2626', info: '#2563eb',
  },
  white_label: {
    primary: '#002f59', secondary: '#e8f0f7', accent: '#1a6b5c',
    bgPage: '#f5f5f0', bgCard: '#ffffff', bgInput: '#ffffff', bgSubtle: '#f5f5f0',
    surface: '#ffffff', textMain: '#0f172a', textSub: '#5b6b7c', textMuted: '#94a3b8',
    border: '#edeae3', borderMd: '#e2ddd4',
    success: '#16a34a', warning: '#f59e0b', danger: '#dc2626', info: '#2563eb',
  },
};

export const CSS_VAR_DEFAULTS = {
  '--brand': '#002f59',
  '--brand-soft': 'rgba(0, 47, 89, 0.08)',
  '--brand-secondary': '#e8f0f7',
  '--brand-accent': '#1a6b5c',
  '--brand-accent-soft': 'rgba(26, 107, 92, 0.12)',
  '--bg-page': '#f5f5f0',
  '--bg-card': '#ffffff',
  '--bg-subtle': '#f5f5f0',
  '--bg-input': '#ffffff',
  '--text-main': '#0f172a',
  '--text-sub': '#5b6b7c',
  '--text-muted': '#94a3b8',
  '--border': '#edeae3',
};

export const CSS_VAR_LIST = [
  '--brand', '--brand-soft', '--brand-secondary', '--brand-accent',
  '--brand-accent-soft', '--brand-grad', '--bg-page', '--bg-card',
  '--bg-subtle', '--bg-input', '--text-main', '--text-sub', '--text-muted',
  '--border', '--success', '--warning', '--danger', '--info',
  '--positive', '--negative', '--chart-1', '--chart-2', '--chart-3',
  '--chart-4', '--chart-5', '--chart-6', '--font-family', '--font-heading',
  '--font-mono', '--font-base', '--font-scale', '--radius-sm', '--radius-md',
  '--radius-lg', '--radius-xl', '--radius-full', '--spacing-gap',
  '--spacing-section', '--spacing-card', '--sidebar-width',
  '--sidebar-collapsed-width', '--sidebar-bg', '--sidebar-text',
  '--sidebar-active-bg', '--sidebar-active-text', '--sidebar-hover-bg',
  '--sidebar-divider', '--header-bg', '--header-text', '--header-height',
  '--card-bg', '--card-shadow', '--btn-primary-bg', '--btn-primary-text',
  '--btn-secondary-bg', '--btn-secondary-text', '--btn-radius', '--btn-height',
  '--input-bg', '--input-text', '--input-border', '--input-focus-border',
  '--input-radius', '--input-height', '--shadow-sm', '--shadow-md',
  '--shadow-lg', '--anim-duration', '--anim-easing',
];

export const PALETTE_UI_FIELDS = DEFAULT_PALETTE_FIELDS;

export function getDefaultPaletteForPlan(planId) {
  return PLAN_PALETTE_DEFAULTS[planId] || PLAN_PALETTE_DEFAULTS.free;
}

export function getAllPaletteKeys() {
  return DEFAULT_PALETTE_FIELDS.map(f => f.key);
}

export function getDefaults() {
  return SCHEMA_DEFAULTS;
}