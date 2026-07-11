import { validateAgainstModules } from './schemaRegistry.js';

export function processResponse(rawResponse, currentBrand) {
  try {
    const json = typeof rawResponse === 'string'
      ? JSON.parse(rawResponse)
      : rawResponse;

    if (!json || typeof json !== 'object') {
      return { success: false, step: 'parse', error: 'Resposta invalida' };
    }

    const validation = validateAgainstModules(json);
    if (!validation.valid) {
      return { success: false, step: 'validation', error: 'Validacao falhou: ' + validation.errors.join('; ') };
    }

    const proposedBrand = buildProposedBrand(json, currentBrand);

    return {
      success: true,
      step: 'done',
      proposedBrand: proposedBrand,
    };
  } catch (e) {
    return { success: false, step: 'parse', error: 'Erro inesperado: ' + (e.message || '') };
  }
}

function buildProposedBrand(json, currentBrand) {
  const mods = json.modules || {};
  const pal = mods.palette || {};

  return Object.assign({}, currentBrand || {}, {
    name: currentBrand && currentBrand.name,
    color: pal.primary || '#002f59',
    color_secondary: pal.secondary || '#e8f0f7',
    color_accent: pal.accent || '#1a6b5c',
    theme: pal.mode || (currentBrand && currentBrand.theme) || 'light',
    brand_config: JSON.stringify(json),
    visual_version: ((currentBrand && currentBrand.visual_version) || 0) + 1,
    custom_palette: true,
  });
}

export function requiresServiceRole() {
  return true;
}