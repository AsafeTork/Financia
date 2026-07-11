import { BRAND_SCHEMA_VERSION } from './schemaVersion.js';

export const BRAND_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://financia.app/brand-schema/v1',
  title: 'Financia Brand Configuration',
  description: 'Contrato publico de configuracao visual do Financia.',
  type: 'object',
  required: ['schemaVersion', 'palette', 'theme'],
  properties: {
    schemaVersion: {
      type: 'string',
      enum: [BRAND_SCHEMA_VERSION],
    },
    brandName: {
      type: 'string',
      minLength: 1,
      maxLength: 60,
    },
    theme: {
      type: 'object',
      required: ['mode'],
      properties: {
        mode: { type: 'string', enum: ['light', 'dark'] },
      },
    },
    palette: {
      type: 'object',
      required: ['primary', 'secondary', 'accent'],
      properties: {
        primary:    { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        secondary:  { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        accent:     { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        bgPage:     { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        bgCard:     { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        bgInput:    { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        bgSubtle:   { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        surface:    { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        textMain:   { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        textSub:    { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        textMuted:  { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        border:     { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        borderMd:   { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
      },
    },
    typography: {
      type: 'object',
      properties: {
        fontFamily:   { type: 'string' },
        fontDisplay:  { type: 'string' },
      },
    },
    logo: {
      type: 'object',
      properties: {
        url:      { type: 'string' },
        fallback: { type: 'string', minLength: 1, maxLength: 1 },
        radius:   { type: 'string' },
      },
    },
    sidebar: {
      type: 'object',
      properties: {
        background: { type: 'string' },
        textColor:  { type: 'string' },
        textMuted:  { type: 'string' },
        activeBg:   { type: 'string' },
      },
    },
    header: {
      type: 'object',
      properties: {
        background: { type: 'string' },
        textColor:  { type: 'string' },
      },
    },
    cards: {
      type: 'object',
      properties: {
        background: { type: 'string' },
        radius:     { type: 'string' },
      },
    },
    buttons: {
      type: 'object',
      properties: {
        radius:      { type: 'string' },
        primaryBg:   { type: 'string' },
        primaryText: { type: 'string' },
      },
    },
    inputs: {
      type: 'object',
      properties: {
        background: { type: 'string' },
        border:     { type: 'string' },
        radius:     { type: 'string' },
      },
    },
    borderRadius: {
      type: 'object',
      properties: {
        sm:   { type: 'string' },
        md:   { type: 'string' },
        lg:   { type: 'string' },
        xl:   { type: 'string' },
        full: { type: 'string' },
      },
    },
    shadows: {
      type: 'object',
      properties: {
        sm: { type: 'string' },
        md: { type: 'string' },
        lg: { type: 'string' },
      },
    },
    spacing: {
      type: 'object',
      properties: {
        unit:        { type: 'integer', minimum: 2, maximum: 12 },
        cardPadding: { type: 'string' },
        sectionGap:  { type: 'string' },
      },
    },
    animations: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        speed:   { type: 'string', enum: ['slow', 'normal', 'fast'] },
      },
    },
    planOverrides: {
      type: 'object',
      properties: {
        pro: {
          type: 'object',
          properties: {
            glowPrimary: { type: 'string' },
            sidebarBg:   { type: 'string' },
            btnGrad:     { type: 'string' },
          },
        },
        premium: {
          type: 'object',
          properties: {
            glowPrimary: { type: 'string' },
            sidebarBg:   { type: 'string' },
            btnGrad:     { type: 'string' },
            planGold:    { type: 'string' },
          },
        },
      },
    },
  },
  additionalProperties: false,
};

export const PALETTE_DEFAULTS = {
  bgPage:    '#f5f5f0',
  bgCard:    '#ffffff',
  bgInput:   '#ffffff',
  bgSubtle:  '#f5f5f0',
  surface:   '#ffffff',
  textMain:  '#0f172a',
  textSub:   '#5b6b7c',
  textMuted: '#94a3b8',
  border:    '#edeae3',
  borderMd:  '#e2ddd4',
};

export const TYPOGRAPHY_DEFAULTS = {
  fontFamily:  'Inter, system-ui, sans-serif',
  fontDisplay: 'Fraunces, Georgia, Times New Roman, serif',
};

export const LOGO_DEFAULTS = {
  fallback: 'F',
  radius:   '12px',
};

export const SIDEBAR_DEFAULTS = {
  textColor: '#ffffff',
  textMuted: 'rgba(255,255,255,0.55)',
  activeBg:  'rgba(255,255,255,0.14)',
};

export const HEADER_DEFAULTS = {
  textColor: '#ffffff',
};

export const CARDS_DEFAULTS = {
  radius: '12px',
};

export const BUTTONS_DEFAULTS = {
  radius:      '12px',
  primaryText: '#ffffff',
};

export const INPUTS_DEFAULTS = {
  radius: '12px',
};

export const BORDER_RADIUS_DEFAULTS = {
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  xl:   '24px',
  full: '9999px',
};

export const SPACING_DEFAULTS = {
  unit:        4,
  cardPadding: '24px',
  sectionGap:  '24px',
};

export const ANIMATIONS_DEFAULTS = {
  enabled: true,
  speed:   'normal',
};

export { BRAND_SCHEMA_VERSION };