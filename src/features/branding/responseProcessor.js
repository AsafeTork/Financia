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
    theme: (originalJson.modules && originalJson.modules.palette && originalJson.modules.palette.mode) || (currentBrand && currentBrand.theme) || 'light',
    brand_config: JSON.stringify(originalJson),
    visual_version: ((currentBrand && currentBrand.visual_version) || 0) + 1,
    custom_palette: true,
  };
}

/**
 * Checks if service role is required to update brand_config for the given brand.
 * Non-white-label users cannot update brand_config directly via anon key
 * because RLS blocks the UPDATE. White-label and admin users can use direct upsert.
 * @param {Object} [brand] - The current brand/profile object
 * @returns {boolean} true if service role (Edge Function / SECURITY DEFINER) is needed
 */
export function requiresServiceRole(brand) {
  if (!brand) return true;
  const wl = brand.white_label;
  if (typeof wl === 'boolean') return !wl;
  return true;
}

/**
 * Updates brand_config on the server using the Edge Function (bypasses RLS via service_role).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {Object} brandConfig - brand_config value to persist
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function updateBrandConfig(supabaseClient, brandConfig) {
  try {
    const res = await supabaseClient.functions.invoke('update-brand-config', {
      body: { brand_config: brandConfig },
    });
    if (res.error) return { ok: false, error: String(res.error.message || res.error) };
    const data = res.data || {};
    if (data.error) return { ok: false, error: String(data.error) };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}