import { BRAND_SCHEMA_VERSION } from './schema.js';

const _modules = {};
const _order = [];

export function registerModule(name, def) {
  if (_modules[name]) return;
  _modules[name] = {
    name,
    schema: def.schema || { type: 'object', properties: {} },
    defaults: def.defaults || {},
    normalizer: def.normalizer || (v => v),
    description: def.description || '',
    dependencies: def.dependencies || [],
    semanticMap: def.semanticMap || {},
  };
  _order.push(name);
}

export function getModule(name) {
  return _modules[name] || null;
}

export function listModules() {
  return _order.map(n => ({ name: n, def: _modules[n] }));
}

export function getSchema(opts) {
  const modules = opts && opts.modules ? opts.modules : _order;
  const schema = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: 'https://financia.app/brand-schema/v' + BRAND_SCHEMA_VERSION,
    title: 'Financia Brand Configuration',
    description: 'Plataforma de Personalizacao Visual — contrato publico de design',
    type: 'object',
    required: ['schemaVersion', 'modules'],
    properties: {
      schemaVersion: { type: 'string', enum: [BRAND_SCHEMA_VERSION] },
      modules: {
        type: 'object',
        required: modules,
        properties: {},
        additionalProperties: false,
      },
    },
    additionalProperties: false,
  };
  for (const mName of modules) {
    const mod = _modules[mName];
    if (mod) {
      schema.properties.modules.properties[mName] = mod.schema;
    }
  }
  return schema;
}

export function validateAgainstModules(input) {
  const errors = [];
  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['configuracao invalida'] };
  }
  if (!input.modules || typeof input.modules !== 'object') {
    return { valid: false, errors: ['campo obrigatorio ausente: modules'] };
  }
  if (!input.schemaVersion) {
    return { valid: false, errors: ['campo obrigatorio ausente: schemaVersion'] };
  }
  const mods = input.modules;
  for (const k in mods) {
    if (!Object.prototype.hasOwnProperty.call(mods, k)) continue;
    const mod = _modules[k];
    if (!mod) {
      errors.push('modulo desconhecido: ' + k);
      continue;
    }
    const modVal = mods[k];
    if (modVal === null || modVal === undefined) continue;
    const subErrs = [];
    validateModule(modVal, mod.schema, k, subErrs);
    for (const ei of subErrs) {
      errors.push(ei);
    }
  }
  for (const mName of _order) {
    const m = _modules[mName];
    const deps = m.dependencies;
    if (!deps || deps.length === 0) continue;
    const hasModule = mods[m.name] && typeof mods[m.name] === 'object';
    if (!hasModule) continue;
    for (const dep of deps) {
      if (!mods[dep] || typeof mods[dep] !== 'object') {
        errors.push('modulo "' + m.name + '" depende de "' + dep + '" mas ele nao foi fornecido');
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

const validateModule = (value, schema, path, errors) => {
  if (typeof value !== 'object' || value === null) {
    errors.push('tipo invalido em ' + path + ': esperado object');
    return;
  }
  const required = schema.required || [];
  for (const rk of required) {
    if (value[rk] === undefined || value[rk] === null) {
      errors.push('campo obrigatorio ausente: ' + path + '.' + rk);
    }
  }
  const props = schema.properties || {};
  for (const pk in props) {
    if (!Object.prototype.hasOwnProperty.call(props, pk)) continue;
    if (value[pk] === undefined) continue;
    validateField(value[pk], props[pk], path + '.' + pk, errors);
  }
  if (schema.additionalProperties === false && schema.properties) {
    const allowed = Object.keys(schema.properties);
    for (const k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k) && allowed.indexOf(k) === -1) {
        errors.push('propriedade nao permitida em ' + path + ': ' + k);
      }
    }
  }
};

const validateField = (value, schemaDef, path, errors) => {
  if (!schemaDef) return;
  const t = schemaDef.type;
  const actual = typeof value;
  if (t === 'string' && actual !== 'string') {
    errors.push('tipo invalido em ' + path + ': esperado string, recebido ' + actual);
    return;
  }
  if (t === 'number' && actual !== 'number') {
    errors.push('tipo invalido em ' + path + ': esperado number, recebido ' + actual);
    return;
  }
  if (t === 'boolean' && actual !== 'boolean') {
    errors.push('tipo invalido em ' + path + ': esperado boolean, recebido ' + actual);
    return;
  }
  if (t === 'object' && (actual !== 'object' || value === null)) {
    errors.push('tipo invalido em ' + path + ': esperado object');
    return;
  }
  if (schemaDef.pattern && typeof value === 'string' && !new RegExp(schemaDef.pattern).test(value)) {
    errors.push('formato invalido em ' + path + ': deve corresponder a ' + schemaDef.pattern);
  }
  if (schemaDef.enum && schemaDef.enum.indexOf(value) === -1) {
    errors.push('valor invalido em ' + path + ': deve ser um de ' + schemaDef.enum.join(', '));
  }
  if (t === 'object') {
    validateModule(value, schemaDef, path, errors);
  }
};

export function normalizeModules(input) {
  if (!input || !input.modules) return input;
  const out = { schemaVersion: input.schemaVersion, modules: {} };
  for (const mName of _order) {
    const mod = _modules[mName];
    const inputVal = input.modules[mName];
    if (inputVal === undefined || inputVal === null) {
      out.modules[mName] = { ...mod.defaults };
    } else {
      const normalized = mod.normalizer(inputVal);
      out.modules[mName] = { ...mod.defaults, ...normalized };
    }
  }
  return out;
}

const initBuiltinModules = () => {
  registerModule('palette', {
    description: 'Cores da marca — paleta completa',
    schema: {
      type: 'object',
      required: ['primary'],
      properties: {
        primary:   { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        secondary: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        accent:    { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        bgPage:    { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        bgCard:    { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        bgInput:   { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        bgSubtle:  { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        surface:   { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        textMain:  { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        textSub:   { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        textMuted: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        border:    { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        mode:      { type: 'string', enum: ['light', 'dark'] },
      },
      additionalProperties: false,
    },
    defaults: {
      primary: '#002f59', secondary: '#e8f0f7', accent: '#1a6b5c',
      bgPage: '#f5f5f0', bgCard: '#ffffff', bgInput: '#ffffff',
      bgSubtle: '#f5f5f0', surface: '#ffffff',
      textMain: '#0f172a', textSub: '#5b6b7c', textMuted: '#94a3b8',
      border: '#edeae3',
    },
    normalizer: (v) => {
      const out = {};
      if (v.style === 'minimal') {
        out.bgPage = v.bgPage || '#ffffff';
        out.bgCard = v.bgCard || '#ffffff';
        out.border = v.border || '#e5e7eb';
        out.textMuted = v.textMuted || '#9ca3af';
      }
      if (v.style === 'bold') {
        out.primary = v.primary || '#000000';
        out.accent = v.accent || '#ff4444';
        out.bgPage = v.bgPage || '#ffffff';
      }
      if (v.mood) {
        const moodMap = { professional: { primary: '#1e3a5f', accent: '#2563eb' }, creative: { primary: '#7c3aed', accent: '#f59e0b' }, warm: { primary: '#92400e', accent: '#ea580c' } };
        const mapped = moodMap[v.mood];
        if (mapped) {
          out.primary = v.primary || mapped.primary;
          out.accent = v.accent || mapped.accent;
        }
      }
      out.primary = v.primary || out.primary || '#002f59';
      out.secondary = v.secondary || out.secondary || '#e8f0f7';
      out.accent = v.accent || out.accent || '#1a6b5c';
      if (v.bgPage) out.bgPage = v.bgPage;
      if (v.bgCard) out.bgCard = v.bgCard;
      if (v.bgInput) out.bgInput = v.bgInput;
      if (v.bgSubtle) out.bgSubtle = v.bgSubtle;
      if (v.surface) out.surface = v.surface;
      if (v.textMain) out.textMain = v.textMain;
      if (v.textSub) out.textSub = v.textSub;
      if (v.textMuted) out.textMuted = v.textMuted;
      if (v.border) out.border = v.border;
      return out;
    },
    semanticMap: {
      style: ['minimal', 'bold', 'elegant', 'fun'],
      mood: ['professional', 'creative', 'warm', 'playful'],
      contrast: ['soft', 'medium', 'high'],
    },
  });

  registerModule('typography', {
    description: 'Tipografia — fontes, escala, estilo',
    schema: {
      type: 'object',
      properties: {
        fontFamily: { type: 'string' },
        headingFont: { type: 'string' },
        monoFont: { type: 'string' },
        baseSize: { type: 'string' },
        scale: { type: 'number', minimum: 1.0, maximum: 1.5 },
        style: { type: 'string', enum: ['modern', 'classic', 'minimal', 'playful'] },
        size: { type: 'string', enum: ['small', 'medium', 'large'] },
      },
      additionalProperties: false,
    },
    defaults: {
      fontFamily: 'Inter, system-ui, sans-serif',
      headingFont: 'Inter, sans-serif',
      monoFont: 'JetBrains Mono, monospace',
      baseSize: '16px',
      scale: 1.25,
    },
    normalizer: (v) => {
      const out = {};
      const styleMap = {
        modern: { fontFamily: "'Inter', system-ui, sans-serif", headingFont: "'Inter', sans-serif", scale: 1.25 },
        classic: { fontFamily: "'Merriweather', Georgia, serif", headingFont: "'Merriweather', Georgia, serif", scale: 1.2 },
        minimal: { fontFamily: "'Inter', system-ui, sans-serif", scale: 1.125 },
        playful: { fontFamily: "'Nunito', system-ui, sans-serif", headingFont: "'Nunito', sans-serif", scale: 1.3 },
      };
      if (v.style) {
        const mapped = styleMap[v.style];
        if (mapped) {
          out.fontFamily = v.fontFamily || mapped.fontFamily;
          out.headingFont = v.headingFont || mapped.headingFont;
          out.scale = v.scale || mapped.scale;
        }
      }
      const sizeMap = { small: { baseSize: '14px', scale: 1.125 }, medium: { baseSize: '16px', scale: 1.25 }, large: { baseSize: '18px', scale: 1.333 } };
      if (v.size) {
        const sMapped = sizeMap[v.size];
        if (sMapped) {
          out.baseSize = v.baseSize || sMapped.baseSize;
          out.scale = v.scale || sMapped.scale;
        }
      }
      if (v.fontFamily) out.fontFamily = v.fontFamily;
      if (v.headingFont) out.headingFont = v.headingFont;
      if (v.monoFont) out.monoFont = v.monoFont;
      if (v.baseSize) out.baseSize = v.baseSize;
      if (v.scale) out.scale = v.scale;
      return out;
    },
    semanticMap: {
      style: ['modern', 'classic', 'minimal', 'playful'],
      size: ['small', 'medium', 'large'],
    },
  });

  registerModule('sidebar', {
    description: 'Barra lateral de navegacao',
    schema: {
      type: 'object',
      properties: {
        width: { type: 'string' },
        collapsedWidth: { type: 'string' },
        bg: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        text: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        activeBg: { type: 'string' },
        activeText: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        hoverBg: { type: 'string' },
        divider: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        style: { type: 'string', enum: ['solid', 'glass', 'minimal', 'dark'] },
      },
      additionalProperties: false,
    },
    defaults: {
      width: '256px', collapsedWidth: '72px',
      text: '#ffffff', activeBg: 'rgba(255,255,255,0.14)',
    },
    normalizer: (v) => {
      const out = {};
      const styleMap = {
        solid: { bg: '#1e293b', text: '#ffffff', activeBg: 'rgba(255,255,255,0.14)' },
        glass: { bg: 'rgba(255,255,255,0.08)', text: '#1e293b', activeBg: 'rgba(30,41,59,0.08)' },
        minimal: { bg: '#ffffff', text: '#475569', activeBg: '#f1f5f9', activeText: '#1e293b' },
        dark: { bg: '#0f172a', text: '#cbd5e1', activeBg: 'rgba(255,255,255,0.1)' },
      };
      if (v.style) {
        const m = styleMap[v.style];
        if (m) {
          out.bg = v.bg || m.bg; out.text = v.text || m.text;
          out.activeBg = v.activeBg || m.activeBg;
        }
      }
      if (v.width) out.width = v.width;
      if (v.collapsedWidth) out.collapsedWidth = v.collapsedWidth;
      if (v.bg) out.bg = v.bg;
      if (v.text) out.text = v.text;
      if (v.activeBg) out.activeBg = v.activeBg;
      if (v.activeText) out.activeText = v.activeText;
      if (v.hoverBg) out.hoverBg = v.hoverBg;
      if (v.divider) out.divider = v.divider;
      return out;
    },
    semanticMap: { style: ['solid', 'glass', 'minimal', 'dark'] },
  });

  registerModule('header', {
    description: 'Cabecalho principal',
    schema: {
      type: 'object',
      properties: {
        bg: { type: 'string' },
        text: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        height: { type: 'string' },
        style: { type: 'string', enum: ['solid', 'transparent', 'bordered'] },
      },
      additionalProperties: false,
    },
    defaults: {},
    normalizer: (v) => {
      const out = {};
      if (v.style === 'transparent') { out.bg = 'transparent'; }
      if (v.style === 'bordered') { out.bg = v.bg || '#ffffff'; }
      if (v.bg) out.bg = v.bg;
      if (v.text) out.text = v.text;
      if (v.height) out.height = v.height;
      return out;
    },
    semanticMap: { style: ['solid', 'transparent', 'bordered'] },
  });

  registerModule('cards', {
    description: 'Cartoes e superficies',
    schema: {
      type: 'object',
      properties: {
        bg: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        radius: { type: 'string' },
        shadow: { type: 'string' },
        style: { type: 'string', enum: ['flat', 'raised', 'outlined', 'glass'] },
      },
      additionalProperties: false,
    },
    defaults: { radius: '12px' },
    normalizer: (v) => {
      const out = {};
      if (v.style === 'flat') { out.shadow = 'none'; }
      if (v.style === 'raised') { out.shadow = '0 4px 12px rgba(0,0,0,0.08)'; }
      if (v.style === 'outlined') { out.shadow = 'none'; }
      if (v.style === 'glass') { out.bg = 'rgba(255,255,255,0.6)'; out.shadow = '0 8px 32px rgba(0,0,0,0.06)'; }
      if (v.bg) out.bg = v.bg;
      if (v.radius) out.radius = v.radius;
      if (v.shadow) out.shadow = v.shadow;
      return out;
    },
    semanticMap: { style: ['flat', 'raised', 'outlined', 'glass'] },
  });

  registerModule('buttons', {
    description: 'Botoes e acoes',
    schema: {
      type: 'object',
      properties: {
        radius: { type: 'string' },
        height: { type: 'string' },
        primaryBg: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        primaryText: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        secondaryBg: { type: 'string' },
        secondaryText: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        style: { type: 'string', enum: ['rounded', 'sharp', 'pill', 'outlined'] },
      },
      additionalProperties: false,
    },
    defaults: { radius: '12px', primaryText: '#ffffff' },
    normalizer: (v) => {
      const out = {};
      if (v.style === 'pill') { out.radius = '9999px'; }
      if (v.style === 'sharp') { out.radius = '4px'; }
      if (v.style === 'rounded') { out.radius = v.radius || '12px'; }
      if (v.radius) out.radius = v.radius;
      if (v.height) out.height = v.height;
      if (v.primaryBg) out.primaryBg = v.primaryBg;
      if (v.primaryText) out.primaryText = v.primaryText;
      if (v.secondaryBg) out.secondaryBg = v.secondaryBg;
      if (v.secondaryText) out.secondaryText = v.secondaryText;
      return out;
    },
    semanticMap: { style: ['rounded', 'sharp', 'pill', 'outlined'] },
  });

  registerModule('inputs', {
    description: 'Campos de entrada',
    schema: {
      type: 'object',
      properties: {
        bg: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        text: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        border: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        focusBorder: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        radius: { type: 'string' },
        height: { type: 'string' },
        style: { type: 'string', enum: ['outlined', 'filled', 'underlined', 'minimal'] },
      },
      additionalProperties: false,
    },
    defaults: { radius: '12px' },
    normalizer: (v) => {
      const out = {};
      if (v.style === 'filled') { out.bg = '#f1f5f9'; out.border = 'transparent'; }
      if (v.style === 'underlined') { out.border = 'none'; out.radius = '0'; out.bg = 'transparent'; }
      if (v.style === 'minimal') { out.border = '#e2e8f0'; out.bg = '#ffffff'; }
      if (v.bg) out.bg = v.bg;
      if (v.text) out.text = v.text;
      if (v.border) out.border = v.border;
      if (v.focusBorder) out.focusBorder = v.focusBorder;
      if (v.radius) out.radius = v.radius;
      if (v.height) out.height = v.height;
      return out;
    },
    semanticMap: { style: ['outlined', 'filled', 'underlined', 'minimal'] },
  });

  registerModule('borderRadius', {
    description: 'Raio de bordas global',
    schema: {
      type: 'object',
      properties: {
        sm: { type: 'string' }, md: { type: 'string' },
        lg: { type: 'string' }, xl: { type: 'string' }, full: { type: 'string' },
        style: { type: 'string', enum: ['sharp', 'rounded', 'pill', 'custom'] },
      },
      additionalProperties: false,
    },
    defaults: { sm: '8px', md: '12px', lg: '16px', xl: '24px', full: '9999px' },
    normalizer: (v) => {
      const out = {};
      if (v.style === 'sharp') { out.sm = '2px'; out.md = '4px'; out.lg = '6px'; out.xl = '8px'; }
      if (v.style === 'rounded') { out.sm = '8px'; out.md = '12px'; out.lg = '16px'; out.xl = '24px'; }
      if (v.style === 'pill') { out.sm = '4px'; out.md = '8px'; out.lg = '16px'; out.xl = '9999px'; }
      if (v.sm) out.sm = v.sm; if (v.md) out.md = v.md; if (v.lg) out.lg = v.lg;
      if (v.xl) out.xl = v.xl; if (v.full) out.full = v.full;
      return out;
    },
    semanticMap: { style: ['sharp', 'rounded', 'pill', 'custom'] },
  });

  registerModule('spacing', {
    description: 'Espacamento e layout',
    schema: {
      type: 'object',
      properties: {
        unit: { type: 'integer', minimum: 2, maximum: 12 },
        gap: { type: 'string' },
        section: { type: 'string' },
        card: { type: 'string' },
        density: { type: 'string', enum: ['compact', 'comfortable', 'spacious'] },
      },
      additionalProperties: false,
    },
    defaults: { unit: 4, gap: '16px', section: '24px', card: '24px' },
    normalizer: (v) => {
      const out = {};
      if (v.density === 'compact') { out.gap = '8px'; out.section = '12px'; out.card = '12px'; out.unit = 2; }
      if (v.density === 'comfortable') { out.gap = '16px'; out.section = '24px'; out.card = '24px'; out.unit = 4; }
      if (v.density === 'spacious') { out.gap = '24px'; out.section = '40px'; out.card = '32px'; out.unit = 6; }
      if (v.unit != null) out.unit = v.unit;
      if (v.gap) out.gap = v.gap;
      if (v.section) out.section = v.section;
      if (v.card) out.card = v.card;
      return out;
    },
    semanticMap: { density: ['compact', 'comfortable', 'spacious'] },
  });

  registerModule('shadows', {
    description: 'Sombras',
    schema: {
      type: 'object',
      properties: {
        sm: { type: 'string' }, md: { type: 'string' }, lg: { type: 'string' },
        intensity: { type: 'string', enum: ['none', 'subtle', 'medium', 'strong'] },
      },
      additionalProperties: false,
    },
    defaults: {},
    normalizer: (v) => {
      const out = {};
      if (v.intensity === 'none') { out.sm = 'none'; out.md = 'none'; out.lg = 'none'; }
      if (v.intensity === 'subtle') { out.sm = '0 1px 2px rgba(0,0,0,0.04)'; out.md = '0 2px 8px rgba(0,0,0,0.06)'; out.lg = '0 4px 16px rgba(0,0,0,0.08)'; }
      if (v.intensity === 'medium') { out.sm = '0 1px 3px rgba(0,0,0,0.08)'; out.md = '0 4px 12px rgba(0,0,0,0.1)'; out.lg = '0 8px 24px rgba(0,0,0,0.12)'; }
      if (v.intensity === 'strong') { out.sm = '0 2px 4px rgba(0,0,0,0.12)'; out.md = '0 6px 16px rgba(0,0,0,0.16)'; out.lg = '0 12px 40px rgba(0,0,0,0.2)'; }
      if (v.sm) out.sm = v.sm; if (v.md) out.md = v.md; if (v.lg) out.lg = v.lg;
      return out;
    },
    semanticMap: { intensity: ['none', 'subtle', 'medium', 'strong'] },
  });

  registerModule('animations', {
    description: 'Animacoes e transicoes',
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        speed: { type: 'string', enum: ['slow', 'normal', 'fast'] },
        easing: { type: 'string' },
        duration: { type: 'string' },
      },
      additionalProperties: false,
    },
    defaults: { enabled: true, speed: 'normal' },
    normalizer: (v) => {
      const out = {};
      if (v.speed === 'slow') { out.duration = '400ms'; }
      if (v.speed === 'normal') { out.duration = '200ms'; }
      if (v.speed === 'fast') { out.duration = '100ms'; }
      if (v.enabled != null) out.enabled = v.enabled;
      if (v.easing) out.easing = v.easing;
      if (v.duration) out.duration = v.duration;
      return out;
    },
    semanticMap: { speed: ['slow', 'normal', 'fast'] },
  });

  registerModule('layout', {
    description: 'Layout geral — organizacao espacial',
    schema: {
      type: 'object',
      properties: {
        maxWidth: { type: 'string' },
        sidebarPosition: { type: 'string', enum: ['left', 'right'] },
        headerFixed: { type: 'boolean' },
        density: { type: 'string', enum: ['compact', 'comfortable', 'spacious'] },
      },
      additionalProperties: false,
    },
    defaults: { maxWidth: '1200px', sidebarPosition: 'left', headerFixed: true },
    normalizer: (v) => {
      const out = {};
      if (v.maxWidth) out.maxWidth = v.maxWidth;
      if (v.sidebarPosition) out.sidebarPosition = v.sidebarPosition;
      if (v.headerFixed != null) out.headerFixed = v.headerFixed;
      if (v.density) out.density = v.density;
      return out;
    },
    semanticMap: { sidebarPosition: ['left', 'right'], density: ['compact', 'comfortable', 'spacious'] },
  });

  registerModule('logoVariants', {
    description: 'Multiplas versoes de logo',
    schema: {
      type: 'object',
      properties: {
        primary: { type: 'string' },
        light: { type: 'string' },
        dark: { type: 'string' },
        monochrome: { type: 'string' },
        color: { type: 'string' },
        reduced: { type: 'string' },
        horizontal: { type: 'string' },
        vertical: { type: 'string' },
        commemorative: { type: 'string' },
        colorOverrides: {
          type: 'object',
          properties: {
            elementColor: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
            textColor: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
            gradient: { type: 'string' },
            opacity: { type: 'number', minimum: 0, maximum: 1 },
            shadow: { type: 'string' },
            outline: { type: 'string' },
            glow: { type: 'string' },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    defaults: {},
    normalizer: (v) => {
      const out = {};
      if (v.primary) out.primary = v.primary;
      if (v.light) out.light = v.light;
      if (v.dark) out.dark = v.dark;
      if (v.monochrome) out.monochrome = v.monochrome;
      if (v.color) out.color = v.color;
      if (v.reduced) out.reduced = v.reduced;
      if (v.horizontal) out.horizontal = v.horizontal;
      if (v.vertical) out.vertical = v.vertical;
      if (v.commemorative) out.commemorative = v.commemorative;
      if (v.colorOverrides) out.colorOverrides = v.colorOverrides;
      return out;
    },
    semanticMap: {},
  });

  registerModule('planThemes', {
    description: 'Configuracoes visuais por plano',
    schema: {
      type: 'object',
      properties: {
        free: { type: 'object' },
        pro: { type: 'object' },
        premium: { type: 'object' },
        white_label: { type: 'object' },
      },
      additionalProperties: false,
    },
    defaults: {},
    normalizer: (v) => v,
    semanticMap: {},
  });

  registerModule('eventThemes', {
    description: 'Temas sazonais e campanhas',
    schema: {
      type: 'object',
      properties: {
        activeEventId: { type: 'string' },
        overrides: {
          type: 'object',
          properties: {
            palette: { type: 'object' },
            cards: { type: 'object' },
            buttons: { type: 'object' },
            animations: { type: 'object' },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    defaults: {},
    normalizer: (v) => v,
    semanticMap: {},
  });

  registerModule('preset', {
    description: 'Referencia a um preset',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
      additionalProperties: false,
    },
    defaults: {},
    normalizer: (v) => v,
    semanticMap: {},
  });
};

initBuiltinModules();