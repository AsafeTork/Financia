import {
  BRAND_SCHEMA_VERSION,
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
  SCHEMA_DEFAULTS,
  DEFAULT_PALETTE_FIELDS,
  PLAN_PALETTE_DEFAULTS,
  OFFICIAL_LOGO_COLORS,
  LOGO_ELEMENTS,
  CHECK_NORM,
} from './defaults.js';

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

const MODULE_DEFS = {
  palette: {
    schema: {
      type: 'object',
      properties: {
        primary: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        secondary: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        accent: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        bgPage: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        bgCard: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        bgInput: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        bgSubtle: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        surface: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        textMain: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        textSub: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        textMuted: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        border: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        borderMd: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        success: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        warning: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        danger: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        info: { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' },
        mode: { type: 'string', enum: ['light', 'dark'] },
      },
      required: ['primary', 'secondary', 'accent'],
    },
    defaults: PALETTE_DEFAULTS,
  },
  typography: {
    schema: {
      type: 'object',
      properties: {
        fontFamily: { type: 'string' },
        fontDisplay: { type: 'string' },
        style: { type: 'string', enum: ['modern', 'classic', 'minimal'] },
        size: { type: 'string', enum: ['small', 'medium', 'large'] },
      },
    },
    defaults: TYPOGRAPHY_DEFAULTS,
  },
  logo: {
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', nullable: true },
        fallback: { type: 'string', minLength: 1, maxLength: 1 },
        radius: { type: 'string' },
        colors: { type: 'object', additionalProperties: { type: 'string' }, nullable: true },
      },
    },
    defaults: LOGO_DEFAULTS,
  },
  sidebar: {
    schema: {
      type: 'object',
      properties: {
        background: { type: 'string' },
        textColor: { type: 'string' },
        textMuted: { type: 'string' },
        activeBg: { type: 'string' },
        style: { type: 'string', enum: ['solid', 'minimal', 'dark', 'glass'] },
        width: { type: 'string' },
        collapsedWidth: { type: 'string' },
        hoverBg: { type: 'string' },
        divider: { type: 'string' },
      },
    },
    defaults: SIDEBAR_DEFAULTS,
  },
  header: {
    schema: {
      type: 'object',
      properties: {
        background: { type: 'string' },
        textColor: { type: 'string' },
        style: { type: 'string', enum: ['solid', 'glass', 'minimal'] },
        height: { type: 'string' },
      },
    },
    defaults: HEADER_DEFAULTS,
  },
  cards: {
    schema: {
      type: 'object',
      properties: {
        background: { type: 'string' },
        radius: { type: 'string' },
        style: { type: 'string', enum: ['raised', 'flat', 'glass'] },
        shadow: { type: 'string' },
      },
    },
    defaults: CARDS_DEFAULTS,
  },
  buttons: {
    schema: {
      type: 'object',
      properties: {
        radius: { type: 'string' },
        primaryBg: { type: 'string' },
        primaryText: { type: 'string' },
        secondaryBg: { type: 'string' },
        secondaryText: { type: 'string' },
        style: { type: 'string', enum: ['rounded', 'pill', 'sharp'] },
        height: { type: 'string' },
      },
    },
    defaults: BUTTONS_DEFAULTS,
  },
  inputs: {
    schema: {
      type: 'object',
      properties: {
        background: { type: 'string' },
        border: { type: 'string' },
        radius: { type: 'string' },
        style: { type: 'string', enum: ['outlined', 'filled', 'minimal', 'underlined'] },
        focusBorder: { type: 'string' },
        height: { type: 'string' },
      },
    },
    defaults: INPUTS_DEFAULTS,
  },
  borderRadius: {
    schema: {
      type: 'object',
      properties: {
        sm: { type: 'string' },
        md: { type: 'string' },
        lg: { type: 'string' },
        xl: { type: 'string' },
        full: { type: 'string' },
        style: { type: 'string', enum: ['rounded', 'sharp', 'pill'] },
      },
    },
    defaults: BORDER_RADIUS_DEFAULTS,
  },
  shadows: {
    schema: {
      type: 'object',
      properties: {
        sm: { type: 'string' },
        md: { type: 'string' },
        lg: { type: 'string' },
        intensity: { type: 'string', enum: ['none', 'subtle', 'medium', 'strong'] },
      },
    },
    defaults: SHADOWS_DEFAULTS,
  },
  spacing: {
    schema: {
      type: 'object',
      properties: {
        unit: { type: 'integer', minimum: 2, maximum: 12 },
        cardPadding: { type: 'string' },
        sectionGap: { type: 'string' },
        density: { type: 'string', enum: ['compact', 'comfortable', 'spacious'] },
      },
    },
    defaults: SPACING_DEFAULTS,
  },
  animations: {
    schema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean' },
        speed: { type: 'string', enum: ['slow', 'normal', 'fast'] },
        duration: { type: 'string' },
        easing: { type: 'string' },
      },
    },
    defaults: ANIMATIONS_DEFAULTS,
  },
  theme: {
    schema: {
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['light', 'dark'] },
      },
      required: ['mode'],
    },
    defaults: THEME_DEFAULTS,
  },
  planOverrides: {
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          modules: { type: 'object' },
          logoColors: { type: 'object' },
          logo_url: { type: 'string' },
        },
      },
    },
    defaults: PLAN_OVERRIDES_DEFAULTS,
  },
};

function matchesSchemaPattern(value, pattern) {
  if (pattern === '^#[0-9a-fA-F]{6}$') return HEX_COLOR_PATTERN.test(value);
  return false;
}

/**
 * Validates a field value against a schema definition.
 * @param {*} value - Value to validate
 * @param {Object} schemaDef - Schema definition for the field
 * @param {string} path - Path for error messages
 * @param {string[]} errors - Array to collect errors
 */
function validateField(value, schemaDef, path, errors) {
  if (!schemaDef) return;

  const t = schemaDef.type;

  if (t === 'string') {
    if (value === null) {
      if (!schemaDef.nullable) {
        errors.push(`campo obrigatorio ausente: ${path}`);
      }
      return;
    }
    if (typeof value !== 'string') {
      errors.push(`tipo invalido em ${path}: esperado string, recebido ${typeof value}`);
      return;
    }
    if (schemaDef.pattern && !matchesSchemaPattern(value, schemaDef.pattern)) {
      errors.push(`formato invalido em ${path}: deve corresponder a ${schemaDef.pattern}`);
    }
    if (schemaDef.enum && !schemaDef.enum.includes(value)) {
      errors.push(`valor invalido em ${path}: deve ser um de ${schemaDef.enum.join(', ')}`);
    }
    if (schemaDef.minLength != null && value.length < schemaDef.minLength) {
      errors.push(`muito curto em ${path}: minimo ${schemaDef.minLength} caracteres`);
    }
    if (schemaDef.maxLength != null && value.length > schemaDef.maxLength) {
      errors.push(`muito longo em ${path}: maximo ${schemaDef.maxLength} caracteres`);
    }
  } else if (t === 'integer') {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      errors.push(`tipo invalido em ${path}: esperado integer, recebido ${typeof value}`);
    }
    if (schemaDef.minimum != null && value < schemaDef.minimum) {
      errors.push(`valor muito baixo em ${path}: minimo ${schemaDef.minimum}`);
    }
    if (schemaDef.maximum != null && value > schemaDef.maximum) {
      errors.push(`valor muito alto em ${path}: maximo ${schemaDef.maximum}`);
    }
  } else if (t === 'boolean') {
    if (typeof value !== 'boolean') {
      errors.push(`tipo invalido em ${path}: esperado boolean, recebido ${typeof value}`);
    }
  } else if (t === 'object') {
    if (value === null) {
      if (!schemaDef.nullable) {
        errors.push(`tipo invalido em ${path}: esperado object, recebido null`);
      }
      return;
    }
    if (typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`tipo invalido em ${path}: esperado object, recebido ${typeof value}`);
      return;
    }
    const required = schemaDef.required || [];
    for (const rk of required) {
      if (value[rk] === undefined || value[rk] === null) {
        errors.push(`campo obrigatorio ausente: ${path}.${rk}`);
      }
    }
    if (schemaDef.additionalProperties === false && schemaDef.properties) {
      const allowed = Object.keys(schemaDef.properties);
      for (const k in value) {
        if (Object.prototype.hasOwnProperty.call(value, k) && !allowed.includes(k)) {
          errors.push(`propriedade nao permitida em ${path}: ${k}`);
        }
      }
    }
    const props = schemaDef.properties || {};
    for (const pk in props) {
      if (Object.prototype.hasOwnProperty.call(props, pk) && value[pk] !== undefined) {
        validateField(value[pk], props[pk], `${path}.${pk}`, errors);
      }
    }
  } else if (t === 'array') {
    if (!Array.isArray(value)) {
      errors.push(`tipo invalido em ${path}: esperado array, recebido ${typeof value}`);
    }
  }
}

/**
 * Validates a brand config against registered modules.
 * @param {Object} config - Brand configuration to validate
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
export function validateAgainstModules(config) {
  const errors = [];

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Config must be an object'] };
  }

  if (!config.schemaVersion || config.schemaVersion !== BRAND_SCHEMA_VERSION) {
    return { valid: false, errors: ['Invalid or missing schemaVersion'] };
  }

  if (!config.modules || typeof config.modules !== 'object') {
    return { valid: false, errors: ['Missing modules object'] };
  }

  for (const name of listModules()) {
    const mod = getModule(name);
    const schemaDef = mod?.schema;
    if (schemaDef && schemaDef.required) {
      const modData = config.modules[name];
      for (const req of schemaDef.required) {
        if (!modData || modData[req] === undefined || modData[req] === null) {
          errors.push(`Missing required field in modules.${name}: ${req}`);
        }
      }
    }
    if (config.modules[name] !== undefined) {
      validateField(config.modules[name], schemaDef, `modules.${name}`, errors);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

function createModuleRegistry() {
  const modules = {};
  const order = [];

  function registerModule(name, module) {
    if (!modules[name]) {
      order.push(name);
    }
    modules[name] = { ...MODULE_DEFS[name], ...module };
  }

  function getModule(name) {
    return modules[name] || MODULE_DEFS[name] || null;
  }

  function listModules() {
    return [...order, ...Object.keys(MODULE_DEFS).filter(k => !modules[k])];
  }

  function getSchema() {
    const schema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://financia.app/brand-schema/v1',
      title: 'Financia Brand Configuration',
      description: 'Contrato publico de configuracao visual do Financia (formato modular).',
      type: 'object',
      required: ['schemaVersion', 'modules'],
      properties: {
        schemaVersion: {
          type: 'string',
          enum: [BRAND_SCHEMA_VERSION],
        },
        modules: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    };

    for (const name of listModules()) {
      const mod = getModule(name);
      if (mod?.schema) {
        schema.properties.modules.properties[name] = mod.schema;
      }
    }

    return schema;
  }

  function normalizeModules(modulesInput) {
    if (!modulesInput || typeof modulesInput !== 'object') return {};

    const normalized = {};
    for (const name of listModules()) {
      const mod = getModule(name);
      const defaults = mod?.defaults || {};
      const input = modulesInput[name] || {};

      if (mod?.schema?.properties) {
        const schemaProps = mod.schema.properties;
        const out = {};
        for (const key of Object.keys(schemaProps)) {
          const def = defaults[key];
          out[key] = input[key] !== undefined && input[key] !== '' ? input[key] : def;
        }
        normalized[name] = out;
      } else {
        normalized[name] = { ...defaults, ...input };
      }
    }
    return normalized;
  }

  function getDefaults() {
    const modulesOut = {};
    for (const name of listModules()) {
      const mod = getModule(name);
      modulesOut[name] = mod?.defaults || {};
    }
    return { schemaVersion: BRAND_SCHEMA_VERSION, modules: modulesOut };
  }

  function mergeWithDefaults(config) {
    const defaults = getDefaults();
    const merged = { ...defaults };
    if (config) {
      merged.schemaVersion = config.schemaVersion || BRAND_SCHEMA_VERSION;
      if (config.modules) {
        merged.modules = normalizeModules(config.modules);
      }
    }
    return merged;
  }

  return {
    registerModule,
    getModule,
    listModules,
    getSchema,
    normalizeModules,
    validateAgainstModules,
    getDefaults,
    mergeWithDefaults,
  };
}

const defaultRegistry = createModuleRegistry();

export const {
  registerModule,
  getModule,
  listModules,
  getSchema,
  normalizeModules,
  getDefaults,
  mergeWithDefaults,
} = defaultRegistry;

export function createRegistry() {
  return createModuleRegistry();
}

export {
  BRAND_SCHEMA_VERSION,
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
  SCHEMA_DEFAULTS,
  DEFAULT_PALETTE_FIELDS,
  PLAN_PALETTE_DEFAULTS,
  OFFICIAL_LOGO_COLORS,
  LOGO_ELEMENTS,
  CHECK_NORM,
};