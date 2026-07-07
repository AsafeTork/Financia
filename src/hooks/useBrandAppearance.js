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

export function applyBrandStudioConfig(b) {
  if (!b || !b.brand_config) return;
  var cfg;
  try { cfg = typeof b.brand_config === 'string' ? JSON.parse(b.brand_config) : b.brand_config; }
  catch (e) { return; }
  if (!cfg || !cfg.palette) return;
  var el = document.documentElement;
  var pal = cfg.palette;
  if (pal.bgPage) el.style.setProperty('--bg-page', pal.bgPage);
  if (pal.bgCard) el.style.setProperty('--bg-card', pal.bgCard);
  if (pal.bgSubtle) el.style.setProperty('--bg-subtle', pal.bgSubtle);
  if (pal.bgInput) el.style.setProperty('--bg-input', pal.bgInput);
  if (pal.textMain) el.style.setProperty('--text-main', pal.textMain);
  if (pal.textSub) el.style.setProperty('--text-sub', pal.textSub);
  if (pal.textMuted) el.style.setProperty('--text-muted', pal.textMuted);
  if (pal.border) el.style.setProperty('--border', pal.border);
  if (pal.success) el.style.setProperty('--success', pal.success);
  if (pal.warning) el.style.setProperty('--warning', pal.warning);
  if (pal.danger) el.style.setProperty('--danger', pal.danger);
  if (pal.info) el.style.setProperty('--info', pal.info);
  if (pal.positive) el.style.setProperty('--positive', pal.positive);
  if (pal.negative) el.style.setProperty('--negative', pal.negative);
  if (pal.chart1) el.style.setProperty('--chart-1', pal.chart1);
  if (pal.chart2) el.style.setProperty('--chart-2', pal.chart2);
  if (pal.chart3) el.style.setProperty('--chart-3', pal.chart3);
  if (pal.chart4) el.style.setProperty('--chart-4', pal.chart4);
  if (pal.chart5) el.style.setProperty('--chart-5', pal.chart5);
  if (pal.chart6) el.style.setProperty('--chart-6', pal.chart6);
  if (cfg.typography) {
    var typ = cfg.typography;
    if (typ.fontFamily) el.style.setProperty('--font-family', typ.fontFamily);
    if (typ.headingFont) el.style.setProperty('--font-heading', typ.headingFont);
    if (typ.monoFont) el.style.setProperty('--font-mono', typ.monoFont);
    if (typ.baseSize) el.style.setProperty('--font-base', typ.baseSize);
    if (typ.scale) el.style.setProperty('--font-scale', typ.scale);
  }
  if (cfg.borderRadius) {
    var br = cfg.borderRadius;
    if (br.sm) el.style.setProperty('--radius-sm', br.sm);
    if (br.md) el.style.setProperty('--radius-md', br.md);
    if (br.lg) el.style.setProperty('--radius-lg', br.lg);
    if (br.xl) el.style.setProperty('--radius-xl', br.xl);
    if (br.full) el.style.setProperty('--radius-full', br.full);
  }
  if (cfg.spacing) {
    var sp = cfg.spacing;
    if (sp.gap) el.style.setProperty('--spacing-gap', sp.gap);
    if (sp.section) el.style.setProperty('--spacing-section', sp.section);
    if (sp.card) el.style.setProperty('--spacing-card', sp.card);
  }
  if (cfg.sidebar) {
    var sb = cfg.sidebar;
    if (sb.width) el.style.setProperty('--sidebar-width', sb.width);
    if (sb.collapsedWidth) el.style.setProperty('--sidebar-collapsed-width', sb.collapsedWidth);
    if (sb.bg) el.style.setProperty('--sidebar-bg', sb.bg);
    if (sb.text) el.style.setProperty('--sidebar-text', sb.text);
    if (sb.activeBg) el.style.setProperty('--sidebar-active-bg', sb.activeBg);
    if (sb.activeText) el.style.setProperty('--sidebar-active-text', sb.activeText);
    if (sb.hoverBg) el.style.setProperty('--sidebar-hover-bg', sb.hoverBg);
    if (sb.divider) el.style.setProperty('--sidebar-divider', sb.divider);
  }
  if (cfg.header) {
    var hd = cfg.header;
    if (hd.bg) el.style.setProperty('--header-bg', hd.bg);
    if (hd.text) el.style.setProperty('--header-text', hd.text);
    if (hd.height) el.style.setProperty('--header-height', hd.height);
  }
  if (cfg.cards) {
    var cd = cfg.cards;
    if (cd.bg) el.style.setProperty('--card-bg', cd.bg);
    if (cd.shadow) el.style.setProperty('--card-shadow', cd.shadow);
  }
  if (cfg.buttons) {
    var btn = cfg.buttons;
    if (btn.primaryBg) el.style.setProperty('--btn-primary-bg', btn.primaryBg);
    if (btn.primaryText) el.style.setProperty('--btn-primary-text', btn.primaryText);
    if (btn.secondaryBg) el.style.setProperty('--btn-secondary-bg', btn.secondaryBg);
    if (btn.secondaryText) el.style.setProperty('--btn-secondary-text', btn.secondaryText);
    if (btn.radius) el.style.setProperty('--btn-radius', btn.radius);
    if (btn.height) el.style.setProperty('--btn-height', btn.height);
  }
  if (cfg.inputs) {
    var inp = cfg.inputs;
    if (inp.bg) el.style.setProperty('--input-bg', inp.bg);
    if (inp.text) el.style.setProperty('--input-text', inp.text);
    if (inp.border) el.style.setProperty('--input-border', inp.border);
    if (inp.focusBorder) el.style.setProperty('--input-focus-border', inp.focusBorder);
    if (inp.radius) el.style.setProperty('--input-radius', inp.radius);
    if (inp.height) el.style.setProperty('--input-height', inp.height);
  }
  if (cfg.shadows) {
    var sh = cfg.shadows;
    if (sh.sm) el.style.setProperty('--shadow-sm', sh.sm);
    if (sh.md) el.style.setProperty('--shadow-md', sh.md);
    if (sh.lg) el.style.setProperty('--shadow-lg', sh.lg);
  }
  if (cfg.animations) {
    var an = cfg.animations;
    if (an.duration) el.style.setProperty('--anim-duration', an.duration);
    if (an.easing) el.style.setProperty('--anim-easing', an.easing);
  }
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

  useEffect(function() { applyBrandVars(appBrand); applyBrandStudioConfig(appBrand); }, [appBrand]);

  return { appBrand, effectiveTheme, toggleTheme, themePref };
}
