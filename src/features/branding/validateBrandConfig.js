import { BRAND_SCHEMA, BRAND_SCHEMA_VERSION } from './schema.js';

var HEX_RE = /^#[0-9a-fA-F]{6}$/;

var ERRORS = {
  TYPE: 'tipo invalido: esperado {expected}, recebido {actual}',
  REQUIRED: 'campo obrigatorio ausente: {path}',
  PATTERN: 'formato invalido em {path}: deve corresponder a {pattern}',
  ENUM: 'valor invalido em {path}: deve ser um de {values}',
  MIN_LENGTH: 'muito curto em {path}: minimo {min} caracteres',
  MAX_LENGTH: 'muito longo em {path}: maximo {max} caracteres',
  MINIMUM: 'valor muito baixo em {path}: minimo {min}',
  MAXIMUM: 'valor muito alto em {path}: maximo {max}',
  ADDITIONAL: 'propriedade nao permitida em {path}: {prop}',
  INVALID: 'configuracao invalida',
};

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function validateType(value, schemaDef, path) {
  var expected = schemaDef.type;
  if (!expected) return '';
  var actual = typeOf(value);
  if (actual !== expected) {
    return ERRORS.TYPE
      .replace('{expected}', expected)
      .replace('{actual}', actual);
  }
  return '';
}

function validateString(value, schemaDef, path) {
  var err = validateType(value, schemaDef, path);
  if (err) return err;
  if (schemaDef.pattern && !new RegExp(schemaDef.pattern).test(value)) {
    return ERRORS.PATTERN
      .replace('{path}', path)
      .replace('{pattern}', schemaDef.pattern);
  }
  if (schemaDef.enum && schemaDef.enum.indexOf(value) === -1) {
    return ERRORS.ENUM
      .replace('{path}', path)
      .replace('{values}', schemaDef.enum.join(', '));
  }
  if (schemaDef.minLength != null && value.length < schemaDef.minLength) {
    return ERRORS.MIN_LENGTH
      .replace('{path}', path)
      .replace('{min}', schemaDef.minLength);
  }
  if (schemaDef.maxLength != null && value.length > schemaDef.maxLength) {
    return ERRORS.MAX_LENGTH
      .replace('{path}', path)
      .replace('{max}', schemaDef.maxLength);
  }
  return '';
}

function validateNumber(value, schemaDef, path) {
  var err = validateType(value, schemaDef, path);
  if (err) return err;
  if (schemaDef.minimum != null && value < schemaDef.minimum) {
    return ERRORS.MINIMUM
      .replace('{path}', path)
      .replace('{min}', schemaDef.minimum);
  }
  if (schemaDef.maximum != null && value > schemaDef.maximum) {
    return ERRORS.MAXIMUM
      .replace('{path}', path)
      .replace('{max}', schemaDef.maximum);
  }
  return '';
}

function validateBoolean(value, schemaDef, path) {
  return validateType(value, schemaDef, path);
}

function validateInteger(value, schemaDef, path) {
  if (typeOf(value) !== 'number' || !Number.isInteger(value)) {
    return ERRORS.TYPE
      .replace('{expected}', 'integer')
      .replace('{actual}', typeOf(value));
  }
  if (schemaDef.minimum != null && value < schemaDef.minimum) {
    return ERRORS.MINIMUM
      .replace('{path}', path)
      .replace('{min}', schemaDef.minimum);
  }
  if (schemaDef.maximum != null && value > schemaDef.maximum) {
    return ERRORS.MAXIMUM
      .replace('{path}', path)
      .replace('{max}', schemaDef.maximum);
  }
  return '';
}

function validateObject(value, schemaDef, path, errors) {
  var err = validateType(value, schemaDef, path);
  if (err) { errors.push(err); return; }

  var required = schemaDef.required || [];
  for (var ri = 0; ri < required.length; ri++) {
    var rk = required[ri];
    if (value[rk] === undefined || value[rk] === null) {
      errors.push(ERRORS.REQUIRED
        .replace('{path}', path + '.' + rk));
    }
  }

  if (schemaDef.additionalProperties === false && schemaDef.properties) {
    var allowed = Object.keys(schemaDef.properties);
    for (var k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k) && allowed.indexOf(k) === -1) {
        errors.push(ERRORS.ADDITIONAL
          .replace('{path}', path)
          .replace('{prop}', k));
      }
    }
  }

  var props = schemaDef.properties || {};
  for (var pk in props) {
    if (Object.prototype.hasOwnProperty.call(props, pk) && value[pk] !== undefined) {
      validateField(value[pk], props[pk], path + '.' + pk, errors);
    }
  }
}

function validateField(value, schemaDef, path, errors) {
  if (!schemaDef) return;

  var t = schemaDef.type;

  if (t === 'string') {
    var serr = validateString(value, schemaDef, path);
    if (serr) errors.push(serr);
  } else if (t === 'number') {
    var nerr = validateNumber(value, schemaDef, path);
    if (nerr) errors.push(nerr);
  } else if (t === 'integer') {
    var ierr = validateInteger(value, schemaDef, path);
    if (ierr) errors.push(ierr);
  } else if (t === 'boolean') {
    var berr = validateBoolean(value, schemaDef, path);
    if (berr) errors.push(berr);
  } else if (t === 'object') {
    validateObject(value, schemaDef, path, errors);
  } else if (t === 'array') {
    var aerr = validateType(value, schemaDef, path);
    if (aerr) errors.push(aerr);
  }
}

export function validateBrandConfig(config) {
  var errors = [];

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: [ERRORS.INVALID] };
  }

  validateField(config, BRAND_SCHEMA, '$', errors);

  if (errors.length > 0) {
    return { valid: false, errors: errors };
  }

  return { valid: true, errors: [] };
}

export function validateSchemaVersion(version) {
  return version === BRAND_SCHEMA_VERSION;
}

export function validateHexColor(value) {
  return HEX_RE.test(value);
}
