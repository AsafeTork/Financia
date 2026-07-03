import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { brandAlpha, deriveCores } from '../lib/utils.js';
import { INIT_BRAND, INIT_PLAN, atLimit, limitFor, planVisualDefaults, WHITE_LABEL_VISUAL_DEFAULT, PLAN_VISUAL_DEFAULTS } from '../lib/constants.js';

const BrandContext = createContext(null);

export function BrandProvider({ children, brand: initialBrand, planInfo: initialPlan, session, themePref: initialThemePref, toggleTheme: initialToggleTheme }) {
  const [brand, setBrand] = useState(initialBrand || INIT_BRAND);
  const [planInfo, setPlanInfo] = useState(initialPlan || INIT_PLAN);
  const [themePref, setThemePref] = useState(initialThemePref || (() => { try { return localStorage.getItem('financia_theme'); } catch (e) { return null; } })());

  const sameHex = useCallback((a, b) => {
    return String(a || '').toLowerCase() === String(b || '').toLowerCase();
  }, []);

  const matchesPlanPalette = useCallback((b) => {
    if (!b) return false;
    var keys = Object.keys(PLAN_VISUAL_DEFAULTS);
    for (var i = 0; i < keys.length; i++) {
      var p = PLAN_VISUAL_DEFAULTS[keys[i]];
      if (!p) continue;
      if (sameHex(b.color, p.color)
        && sameHex(b.color_secondary, p.color_secondary)
        && sameHex(b.color_accent, p.color_accent)
        && String(b.theme || 'light') === String(p.theme || 'light')) {
        return true;
      }
    }
    return false;
  }, [sameHex]);

  const hasWhiteLabel = !!(brand && brand.white_label);
  const visualPreset = hasWhiteLabel ? null : planVisualDefaults(planInfo);
  const lockedPlanVisual = hasWhiteLabel ? planVisualDefaults(planInfo) : null;
  const missingCustomPalette = !!(hasWhiteLabel && (
    !brand.color || !brand.color_secondary || !brand.color_accent
  ));
  const useWhiteLabelFallback = !!(hasWhiteLabel && lockedPlanVisual
    && (
      (sameHex(brand.color, lockedPlanVisual.color)
        && sameHex(brand.color_secondary, lockedPlanVisual.color_secondary)
        && sameHex(brand.color_accent, lockedPlanVisual.color_accent)
        && String(brand.theme || 'light') === String(lockedPlanVisual.theme || 'light'))
      || matchesPlanPalette(brand)
      || missingCustomPalette
    ));

  const appBrand = hasWhiteLabel
    ? (useWhiteLabelFallback
      ? Object.assign({}, brand, {
          color: WHITE_LABEL_VISUAL_DEFAULT.color,
          color_secondary: WHITE_LABEL_VISUAL_DEFAULT.color_secondary,
          color_accent: WHITE_LABEL_VISUAL_DEFAULT.color_accent,
          theme: WHITE_LABEL_VISUAL_DEFAULT.theme,
        })
      : brand)
    : Object.assign({}, brand, {
        color: visualPreset.color,
        color_secondary: visualPreset.color_secondary,
        color_accent: visualPreset.color_accent,
        theme: visualPreset.theme,
      });

  const effectiveTheme = themePref || (appBrand && appBrand.theme) || 'light';

  const toggleTheme = useCallback(() => {
    setThemePref((prev) => {
      var current = prev || (appBrand && appBrand.theme) || 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('financia_theme', next); } catch (e) {}
      return next;
    });
  }, [appBrand]);

  const applyBrandVars = useCallback((b) => {
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

  useEffect(() => { applyBrandVars(appBrand); }, [appBrand, applyBrandVars]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', session ? effectiveTheme : 'light');
  }, [effectiveTheme, session]);

  return (
    <BrandContext.Provider value={{
      brand,
      setBrand,
      planInfo,
      setPlanInfo,
      appBrand,
      effectiveTheme,
      themePref,
      toggleTheme,
      applyBrandVars,
    }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}