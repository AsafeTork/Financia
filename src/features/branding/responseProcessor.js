import { detectAndAdapt } from './aiCompatibilityLayer.js';
import { validateAgainstModules } from './schemaRegistry.js';
import { normalizeBrandInput } from './normalizer.js';
import diffSummarize from './diffSummarizer.js';

export default function processResponse(rawResponse, currentBrand) {
  var step = 'input';

  try {
    step = 'adapt';
    var adapted = detectAndAdapt(rawResponse);
    if (!adapted.success) {
      return { success: false, step: step, error: adapted.error, adaptedModel: null };
    }

    step = 'validate';
    var validation = validateAgainstModules({ schemaVersion: adapted.json.schemaVersion, modules: adapted.json.modules });
    if (!validation.valid) {
      return { success: false, step: step, error: 'JSON invalido: ' + validation.errors.join('; '), adaptedModel: adapted.detectedModel, adapted: adapted.adapted };
    }

    step = 'normalize';
    var normalized = normalizeBrandInput({ schemaVersion: adapted.json.schemaVersion, modules: adapted.json.modules });
    if (!normalized) {
      return { success: false, step: step, error: 'Falha ao normalizar JSON', adaptedModel: adapted.detectedModel, adapted: adapted.adapted };
    }

    step = 'summarize';
    var currentNormalized = currentBrand && currentBrand.brand_config
      ? (typeof currentBrand.brand_config === 'string' ? JSON.parse(currentBrand.brand_config) : currentBrand.brand_config)
      : null;
    var currentModular = currentNormalized && currentNormalized.modules
      ? currentNormalized
      : buildLegacyCurrent(currentBrand);
    var summary = diffSummarize(currentModular, normalized);

    step = 'done';
    return {
      success: true,
      step: step,
      adaptedModel: adapted.detectedModel,
      adapted: adapted.adapted,
      normalized: normalized,
      summary: summary,
      proposedBrand: buildProposedBrand(normalized, currentBrand),
    };

  } catch (e) {
    return { success: false, step: step, error: 'Erro inesperado: ' + (e.message || '') };
  }
}

function buildLegacyCurrent(currentBrand) {
  if (!currentBrand) return { modules: {} };
  return {
    schemaVersion: '1.0.0',
    modules: {},
  };
}

function buildProposedBrand(normalized, currentBrand) {
  var mods = normalized.modules || {};
  var pal = mods.palette || {};

  return Object.assign({}, currentBrand || {}, {
    name: currentBrand && currentBrand.name,
    color: pal.primary || '#002f59',
    color_secondary: pal.secondary || '#e8f0f7',
    color_accent: pal.accent || '#1a6b5c',
    theme: pal.mode || (currentBrand && currentBrand.theme) || 'light',
    brand_config: JSON.stringify(normalized),
    visual_version: ((currentBrand && currentBrand.visual_version) || 0) + 1,
    custom_palette: true,
  });
}
