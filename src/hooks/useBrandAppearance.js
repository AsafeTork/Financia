import { useState, useCallback, useEffect, useMemo } from 'react';
import { brandAlpha, deriveCores } from '../lib/utils.js';
import { planVisualDefaults, WHITE_LABEL_VISUAL_DEFAULT } from '../lib/constants.js';

function loadThemePref() {
  try { return localStorage.getItem('financia_theme'); } catch (e) { return null; }
}

function saveThemePref(value) {
  try { localStorage.setItem('financia_theme', value); } catch (e) { void e; }
}

function computeMissingCustomPalette(brand) {
  return !!(brand && (!brand.color || !brand.color_secondary || !brand.color_accent));
}

function computeUseWhiteLabelFallback(hasWhiteLabel, brand, missingCustomPalette) {
  return hasWhiteLabel && !brand.custom_palette && missingCustomPalette;
}

function computeEffectiveTheme(themePref, appBrand) {
  return themePref || (appBrand && appBrand.theme) || 'light';
}

export function applyBrandVars(b) {
  var primary = b.color || '#002f59';
  var derived = deriveCores(primary);
  var secondary = b.color_secondary || derived.secondary;
  var accent = b.color_accent || derived.accent;
  var el = document.documentElement;
  el.style.setProperty('--brand', primary);
  el.style.setProperty('--brand-soft', brandAlpha(primary, 0.08));
  el.style.setProperty('--brand-secondary', secondary);
  el.style.setProperty('--brand-accent', accent);
  el.style.setProperty('--brand-accent-soft', brandAlpha(accent, 0.12));
  el.style.setProperty('--brand-grad', 'linear-gradient(135deg, ' + primary + ' 0%, ' + accent + ' 100%)');
}

export default function useBrandAppearance(brand, planInfo) {
  var [themePref, setThemePref] = useState(loadThemePref);

  var hasWhiteLabel = !!(brand && brand.white_label);
  var visualPreset = hasWhiteLabel ? null : planVisualDefaults(planInfo);
  var missingCustomPalette = computeMissingCustomPalette(brand);
  var useWhiteLabelFallback = computeUseWhiteLabelFallback(hasWhiteLabel, brand, missingCustomPalette);

  var appBrand = useMemo(function() {
    return hasWhiteLabel
      ? (useWhiteLabelFallback
        ? Object.assign({}, brand, { color: WHITE_LABEL_VISUAL_DEFAULT.color, color_secondary: WHITE_LABEL_VISUAL_DEFAULT.color_secondary, color_accent: WHITE_LABEL_VISUAL_DEFAULT.color_accent, theme: WHITE_LABEL_VISUAL_DEFAULT.theme })
        : brand)
      : Object.assign({}, brand, { color: visualPreset.color, color_secondary: visualPreset.color_secondary, color_accent: visualPreset.color_accent, theme: visualPreset.theme });
  }, [hasWhiteLabel, useWhiteLabelFallback, brand, visualPreset]);

  var effectiveTheme = computeEffectiveTheme(themePref, appBrand);

  var toggleTheme = useCallback(function() {
    setThemePref(function(prev) {
      var current = prev || (appBrand && appBrand.theme) || 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      saveThemePref(next);
      return next;
    });
  }, [appBrand]);

  useEffect(function() { applyBrandVars(appBrand); }, [appBrand]);

  return { appBrand, effectiveTheme, toggleTheme, themePref };
}
