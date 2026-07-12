import { validateAgainstModules, mergeWithDefaults } from './schemaRegistry.js';

/**
 * Processes an AI response and validates it against the brand schema.
 * @param {string|Object} rawResponse - Raw response from AI
 * @param {Object} currentBrand - Current brand configuration
 * @returns {Object} Processing result with success flag and proposed brand
 */
export function processResponse(rawResponse, currentBrand) {
  try {
    const json = typeof rawResponse === 'string'
      ? JSON.parse(rawResponse)
      : rawResponse;

    if (!json || typeof json !== 'object' || Array.isArray(json)) {
      return { success: false, step: 'parse', error: 'Resposta invalida' };
    }

    const normalized = mergeWithDefaults(json);
    const validation = validateAgainstModules(normalized);
    if (!validation.valid) {
      return { success: false, step: 'validation', error: 'Validacao falhou: ' + validation.errors.join('; ') };
    }

    const proposedBrand = buildProposedBrand(normalized, currentBrand, json);

    return {
      success: true,
      step: 'done',
      proposedBrand,
    };
  } catch (e) {
    return { success: false, step: 'parse', error: 'Erro inesperado: ' + (e.message || '') };
  }
}

function buildProposedBrand(normalized, currentBrand, originalJson) {
  const mods = normalized.modules || {};
  const pal = mods.palette || {};

  return {
    ...currentBrand || {},
    name: currentBrand && currentBrand.name,
    color: pal.primary || '#002f59',
    color_secondary: pal.secondary || '#e8f0f7',
    color_accent: pal.accent || '#1a6b5c',
    theme: pal.mode || (currentBrand && currentBrand.theme) || 'light',
    brand_config: JSON.stringify(originalJson),
    visual_version: ((currentBrand && currentBrand.visual_version) || 0) + 1,
    custom_palette: true,
  };
}

/**
 * Checks if service role is required for brand operations.
 * @returns {boolean} Always true for now
 */
export function requiresServiceRole() {
  return true;
}