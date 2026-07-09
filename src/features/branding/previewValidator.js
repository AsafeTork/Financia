var WCAG_AA_CONTRAST = 4.5;

export default function previewValidate(proposedBrand, currentBrand) {
  var issues = [];
  var suggestions = [];
  var ignoredProps = [];
  var conflicts = [];

  var proposedConfig = proposedBrand && proposedBrand.brand_config
    ? parseConfig(proposedBrand.brand_config) : null;

  if (!proposedConfig || !proposedConfig.modules) {
    return { issues: [], suggestions: [], unknownProps: [], ignoredProps: [], conflicts: [] };
  }

  var pal = proposedConfig.modules.palette || {};

  if (pal.primary && pal.bgPage) {
    var contrast = getContrastRatio(pal.primary, pal.bgPage);
    if (contrast < WCAG_AA_CONTRAST) {
      issues.push('Contraste insuficiente entre primary (' + pal.primary + ') e bgPage (' + pal.bgPage + '): ' + contrast.toFixed(2) + ':1 (minimo 4.5:1)');
      suggestions.push('Escureca a cor primaria ou clareie o fundo da pagina para melhorar o contraste.');
    }
  }

  if (pal.textMain && pal.bgPage) {
    var textContrast = getContrastRatio(pal.textMain, pal.bgPage);
    if (textContrast < WCAG_AA_CONTRAST) {
      issues.push('Contraste insuficiente entre texto (' + pal.textMain + ') e fundo (' + pal.bgPage + '): ' + textContrast.toFixed(2) + ':1');
      suggestions.push('Ajuste textMain para um tom mais escuro ou bgPage mais claro.');
    }
  }

  if (pal.primary && pal.accent) {
    var hueDiff = getHueDistance(pal.primary, pal.accent);
    if (hueDiff < 30) {
      suggestions.push('primary e accent tem matiz muito proximo (' + hueDiff.toFixed(0) + ' graus). Considere aumentar a diferenca para melhor distincao visual.');
    }
  }

  if (pal.primary && pal.secondary && pal.primary === pal.secondary) {
    issues.push('primary e secondary sao identicos (' + pal.primary + '). Eles devem ser diferentes.');
  }

  if (pal.bgCard && pal.bgPage && pal.bgCard === pal.bgPage) {
    suggestions.push('bgCard e bgPage sao identicos. Cartoes podem ficar invisiveis sem sombra ou borda.');
    if (proposedConfig.modules.cards && proposedConfig.modules.cards.shadow === 'none') {
      conflicts.push('cards.shadow = none combinado com bgCard == bgPage: cartoes ficarao indistinguiveis.');
    }
  }

  var versionCheck = checkVersionCompatibility(proposedBrand);
  if (versionCheck) {
    ignoredProps.push(versionCheck);
  }

  return {
    issues: issues,
    suggestions: suggestions,
    ignoredProps: ignoredProps,
    conflicts: conflicts,
  };
}

function parseConfig(cfg) {
  try { return typeof cfg === 'string' ? JSON.parse(cfg) : cfg; }
  catch { return null; }
}

function hexToRgb(hex) {
  var h = (hex || '#000000').replace('#', '');
  return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
}

function luminance(hex) {
  var c = hexToRgb(hex);
  var toLinear = function(v) { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
}

function getContrastRatio(hex1, hex2) {
  var l1 = luminance(hex1);
  var l2 = luminance(hex2);
  var lighter = Math.max(l1, l2);
  var darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function getHueDistance(hex1, hex2) {
  var hsl1 = hexToHsl(hex1);
  var hsl2 = hexToHsl(hex2);
  var diff = Math.abs(hsl1.h - hsl2.h);
  return Math.min(diff, 360 - diff);
}

function hexToHsl(hex) {
  var c = hexToRgb(hex);
  var r = c.r / 255, g = c.g / 255, b = c.b / 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = h / 6;
  }
  return { h: h * 360, s: s, l: l };
}

function checkVersionCompatibility(proposedBrand) {
  var cfg = parseConfig(proposedBrand && proposedBrand.brand_config);
  if (!cfg || !cfg.schemaVersion) return null;
  if (cfg.schemaVersion !== '1.0.0') {
    return 'schemaVersion "' + cfg.schemaVersion + '" nao e reconhecido. Usando tradutor padrao.';
  }
  return null;
}
