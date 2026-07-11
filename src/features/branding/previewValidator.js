const WCAG_AA_CONTRAST = 4.5;

export default function previewValidate(proposedBrand, currentBrand) {
  const issues = [];
  const suggestions = [];
  const ignoredProps = [];
  const conflicts = [];

  const proposedConfig = proposedBrand && proposedBrand.brand_config
    ? parseConfig(proposedBrand.brand_config) : null;

  if (!proposedConfig || !proposedConfig.modules) {
    return { issues: [], suggestions: [], unknownProps: [], ignoredProps: [], conflicts: [] };
  }

  const pal = proposedConfig.modules.palette || {};

  if (pal.primary && pal.bgPage) {
    const contrast = getContrastRatio(pal.primary, pal.bgPage);
    if (contrast < WCAG_AA_CONTRAST) {
      issues.push('Contraste insuficiente entre primary (' + pal.primary + ') e bgPage (' + pal.bgPage + '): ' + contrast.toFixed(2) + ':1 (minimo 4.5:1)');
      suggestions.push('Escureca a cor primaria ou clareie o fundo da pagina para melhorar o contraste.');
    }
  }

  if (pal.textMain && pal.bgPage) {
    const textContrast = getContrastRatio(pal.textMain, pal.bgPage);
    if (textContrast < WCAG_AA_CONTRAST) {
      issues.push('Contraste insuficiente entre texto (' + pal.textMain + ') e fundo (' + pal.bgPage + '): ' + textContrast.toFixed(2) + ':1');
      suggestions.push('Ajuste textMain para um tom mais escuro ou bgPage mais claro.');
    }
  }

  if (pal.primary && pal.accent) {
    const hueDiff = getHueDistance(pal.primary, pal.accent);
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

  const versionCheck = checkVersionCompatibility(proposedBrand);
  if (versionCheck) {
    ignoredProps.push(versionCheck);
  }

  return {
    issues,
    suggestions,
    ignoredProps,
    conflicts,
  };
}

const parseConfig = (cfg) => {
  try { return typeof cfg === 'string' ? JSON.parse(cfg) : cfg; }
  catch { return null; }
};

const hexToRgb = (hex) => {
  const h = (hex || '#000000').replace('#', '');
  return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
};

const luminance = (hex) => {
  const c = hexToRgb(hex);
  const toLinear = (v) => { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
};

const getContrastRatio = (hex1, hex2) => {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const getHueDistance = (hex1, hex2) => {
  const hsl1 = hexToHsl(hex1);
  const hsl2 = hexToHsl(hex2);
  const diff = Math.abs(hsl1.h - hsl2.h);
  return Math.min(diff, 360 - diff);
};

const hexToHsl = (hex) => {
  const c = hexToRgb(hex);
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = h / 6;
  }
  return { h: h * 360, s, l };
};

const checkVersionCompatibility = (proposedBrand) => {
  const cfg = parseConfig(proposedBrand && proposedBrand.brand_config);
  if (!cfg || !cfg.schemaVersion) return null;
  if (cfg.schemaVersion !== '1.0.0') {
    return 'schemaVersion "' + cfg.schemaVersion + '" nao e reconhecido. Usando tradutor padrao.';
  }
  return null;
};