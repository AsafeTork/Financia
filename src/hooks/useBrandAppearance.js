import { useState, useCallback, useEffect, useMemo } from 'react';
import { brandAlpha, deriveCores } from '../lib/utils.js';
import { planVisualDefaults, WHITE_LABEL_VISUAL_DEFAULT, PLAN_VISUAL_DEFAULTS } from '../lib/constants.js';

function sameHex(a, b) {
  return String(a || '').toLowerCase() === String(b || '').toLowerCase();
}

function matchesPlanPalette(b) {
  if (!b) return false;
  var keys = Object.keys(PLAN_VISUAL_DEFAULTS);
  for (var i = 0; i < keys.length; i++) {
    var p = PLAN_VISUAL_DEFAULTS[keys[i]];
    if (!p) continue;
    if (sameHex(b.color, p.color) && sameHex(b.color_secondary, p.color_secondary) && sameHex(b.color_accent, p.color_accent) && String(b.theme || 'light') === String(p.theme || 'light')) return true;
  }
  return false;
}

export default function useBrandAppearance(brand, planInfo) {
  var [themePref, setThemePref] = useState(function() {
    try { return localStorage.getItem('financia_theme'); } catch (e) { return null; }
  });

  var hasWhiteLabel = !!(brand && brand.white_label);
  var visualPreset = hasWhiteLabel ? null : planVisualDefaults(planInfo);
  var lockedPlanVisual = hasWhiteLabel ? planVisualDefaults(planInfo) : null;
  var missingCustomPalette = !!(hasWhiteLabel && (!brand.color || !brand.color_secondary || !brand.color_accent));
  var useWhiteLabelFallback = !!(hasWhiteLabel && lockedPlanVisual && ((sameHex(brand.color, lockedPlanVisual.color) && sameHex(brand.color_secondary, lockedPlanVisual.color_secondary) && sameHex(brand.color_accent, lockedPlanVisual.color_accent) && String(brand.theme || 'light') === String(lockedPlanVisual.theme || 'light')) || matchesPlanPalette(brand) || missingCustomPalette));

  var appBrand = useMemo(function() {
    return hasWhiteLabel
      ? (useWhiteLabelFallback
        ? Object.assign({}, brand, { color: WHITE_LABEL_VISUAL_DEFAULT.color, color_secondary: WHITE_LABEL_VISUAL_DEFAULT.color_secondary, color_accent: WHITE_LABEL_VISUAL_DEFAULT.color_accent, theme: WHITE_LABEL_VISUAL_DEFAULT.theme })
        : brand)
      : Object.assign({}, brand, { color: visualPreset.color, color_secondary: visualPreset.color_secondary, color_accent: visualPreset.color_accent, theme: visualPreset.theme });
  }, [hasWhiteLabel, useWhiteLabelFallback, brand, visualPreset]);

  var effectiveTheme = themePref || (appBrand && appBrand.theme) || 'light';

  var toggleTheme = useCallback(function() {
    setThemePref(function(prev) {
      var current = prev || (appBrand && appBrand.theme) || 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('financia_theme', next); } catch (e) { void e; }
      return next;
    });
  }, [appBrand]);

  var applyBrandVars = useCallback(function(b) {
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
  }, []);

  useEffect(function() { applyBrandVars(appBrand); }, [appBrand]);

  return { appBrand, effectiveTheme, toggleTheme, themePref };
}
