import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { brandAlpha, deriveCores } from '../lib/utils.js';
import { planVisualDefaults, WHITE_LABEL_VISUAL_DEFAULT } from '../lib/constants.js';

function loadThemePref() {
  try { return localStorage.getItem('financia_theme'); } catch (_) { return null; }
}

function saveThemePref(value) {
  try { localStorage.setItem('financia_theme', value); } catch (_unused) { void _unused; }
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

function applyTokenDiff(el, tokens) {
  for (var k in tokens) {
    if (!Object.prototype.hasOwnProperty.call(tokens, k)) continue;
    var val = tokens[k];
    if (val !== null && val !== undefined) {
      el.style.setProperty(k, val);
    }
  }
}

function collectTokensFromBrand(b) {
  var primary = b.color || '#002f59';
  var derived = deriveCores(primary);
  var secondary = b.color_secondary || derived.secondary;
  var accent = b.color_accent || derived.accent;
  var tokens = {
    '--brand': primary,
    '--brand-soft': brandAlpha(primary, 0.08),
    '--brand-secondary': secondary,
    '--brand-accent': accent,
    '--brand-accent-soft': brandAlpha(accent, 0.12),
    '--brand-grad': 'linear-gradient(135deg, ' + primary + ' 0%, ' + accent + ' 100%)',
  };

  if (!b || !b.brand_config) return tokens;
  var cfg;
  try { cfg = typeof b.brand_config === 'string' ? JSON.parse(b.brand_config) : b.brand_config; }
  catch (e) { return tokens; }
  if (!cfg || !cfg.palette) return tokens;

  var pal = cfg.palette;
  var paletteTokens = {
    '--bg-page': pal.bgPage, '--bg-card': pal.bgCard, '--bg-subtle': pal.bgSubtle,
    '--bg-input': pal.bgInput, '--text-main': pal.textMain, '--text-sub': pal.textSub,
    '--text-muted': pal.textMuted, '--border': pal.border,
    '--success': pal.success, '--warning': pal.warning, '--danger': pal.danger,
    '--info': pal.info, '--positive': pal.positive, '--negative': pal.negative,
    '--chart-1': pal.chart1, '--chart-2': pal.chart2, '--chart-3': pal.chart3,
    '--chart-4': pal.chart4, '--chart-5': pal.chart5, '--chart-6': pal.chart6,
  };
  for (var pk in paletteTokens) {
    if (paletteTokens[pk]) tokens[pk] = paletteTokens[pk];
  }

  if (cfg.typography) {
    var typ = cfg.typography;
    if (typ.fontFamily) tokens['--font-family'] = typ.fontFamily;
    if (typ.headingFont) tokens['--font-heading'] = typ.headingFont;
    if (typ.monoFont) tokens['--font-mono'] = typ.monoFont;
    if (typ.baseSize) tokens['--font-base'] = typ.baseSize;
    if (typ.scale) tokens['--font-scale'] = String(typ.scale);
  }
  if (cfg.borderRadius) {
    var br = cfg.borderRadius;
    if (br.sm) tokens['--radius-sm'] = br.sm;
    if (br.md) tokens['--radius-md'] = br.md;
    if (br.lg) tokens['--radius-lg'] = br.lg;
    if (br.xl) tokens['--radius-xl'] = br.xl;
    if (br.full) tokens['--radius-full'] = br.full;
  }
  if (cfg.spacing) {
    var sp = cfg.spacing;
    if (sp.gap) tokens['--spacing-gap'] = sp.gap;
    if (sp.section) tokens['--spacing-section'] = sp.section;
    if (sp.card) tokens['--spacing-card'] = sp.card;
  }
  if (cfg.sidebar) {
    var sb = cfg.sidebar;
    if (sb.width) tokens['--sidebar-width'] = sb.width;
    if (sb.collapsedWidth) tokens['--sidebar-collapsed-width'] = sb.collapsedWidth;
    if (sb.bg) tokens['--sidebar-bg'] = sb.bg;
    if (sb.text) tokens['--sidebar-text'] = sb.text;
    if (sb.activeBg) tokens['--sidebar-active-bg'] = sb.activeBg;
    if (sb.activeText) tokens['--sidebar-active-text'] = sb.activeText;
    if (sb.hoverBg) tokens['--sidebar-hover-bg'] = sb.hoverBg;
    if (sb.divider) tokens['--sidebar-divider'] = sb.divider;
  }
  if (cfg.header) {
    var hd = cfg.header;
    if (hd.bg) tokens['--header-bg'] = hd.bg;
    if (hd.text) tokens['--header-text'] = hd.text;
    if (hd.height) tokens['--header-height'] = hd.height;
  }
  if (cfg.cards) {
    var cd = cfg.cards;
    if (cd.bg) tokens['--card-bg'] = cd.bg;
    if (cd.shadow) tokens['--card-shadow'] = cd.shadow;
  }
  if (cfg.buttons) {
    var btn = cfg.buttons;
    if (btn.primaryBg) tokens['--btn-primary-bg'] = btn.primaryBg;
    if (btn.primaryText) tokens['--btn-primary-text'] = btn.primaryText;
    if (btn.secondaryBg) tokens['--btn-secondary-bg'] = btn.secondaryBg;
    if (btn.secondaryText) tokens['--btn-secondary-text'] = btn.secondaryText;
    if (btn.radius) tokens['--btn-radius'] = btn.radius;
    if (btn.height) tokens['--btn-height'] = btn.height;
  }
  if (cfg.inputs) {
    var inp = cfg.inputs;
    if (inp.bg) tokens['--input-bg'] = inp.bg;
    if (inp.text) tokens['--input-text'] = inp.text;
    if (inp.border) tokens['--input-border'] = inp.border;
    if (inp.focusBorder) tokens['--input-focus-border'] = inp.focusBorder;
    if (inp.radius) tokens['--input-radius'] = inp.radius;
    if (inp.height) tokens['--input-height'] = inp.height;
  }
  if (cfg.shadows) {
    var sh = cfg.shadows;
    if (sh.sm) tokens['--shadow-sm'] = sh.sm;
    if (sh.md) tokens['--shadow-md'] = sh.md;
    if (sh.lg) tokens['--shadow-lg'] = sh.lg;
  }
  if (cfg.animations) {
    var an = cfg.animations;
    if (an.duration) tokens['--anim-duration'] = an.duration;
    if (an.easing) tokens['--anim-easing'] = an.easing;
  }
  return tokens;
}

var _savedPreviewTokens = null;

export function applyBrandVars(b) {
  var el = document.documentElement;
  var tokens = collectTokensFromBrand(b);
  applyTokenDiff(el, tokens);
}

export function applyBrandStudioConfig(b) {
  applyBrandVars(b);
}

export function enterPreviewMode(proposedBrand) {
  if (_savedPreviewTokens) return;
  var el = document.documentElement;
  _savedPreviewTokens = {};
  var vars = [
    '--brand', '--brand-soft', '--brand-secondary', '--brand-accent',
    '--brand-accent-soft', '--brand-grad', '--bg-page', '--bg-card',
    '--bg-subtle', '--bg-input', '--text-main', '--text-sub', '--text-muted',
    '--border', '--success', '--warning', '--danger', '--info',
    '--positive', '--negative', '--chart-1', '--chart-2', '--chart-3',
    '--chart-4', '--chart-5', '--chart-6', '--font-family', '--font-heading',
    '--font-mono', '--font-base', '--font-scale', '--radius-sm', '--radius-md',
    '--radius-lg', '--radius-xl', '--radius-full', '--spacing-gap',
    '--spacing-section', '--spacing-card', '--sidebar-width',
    '--sidebar-collapsed-width', '--sidebar-bg', '--sidebar-text',
    '--sidebar-active-bg', '--sidebar-active-text', '--sidebar-hover-bg',
    '--sidebar-divider', '--header-bg', '--header-text', '--header-height',
    '--card-bg', '--card-shadow', '--btn-primary-bg', '--btn-primary-text',
    '--btn-secondary-bg', '--btn-secondary-text', '--btn-radius', '--btn-height',
    '--input-bg', '--input-text', '--input-border', '--input-focus-border',
    '--input-radius', '--input-height', '--shadow-sm', '--shadow-md',
    '--shadow-lg', '--anim-duration', '--anim-easing',
  ];
  for (var vi = 0; vi < vars.length; vi++) {
    var v = vars[vi];
    _savedPreviewTokens[v] = el.style.getPropertyValue(v) || '';
  }
  var previewTokens = collectTokensFromBrand(proposedBrand);
  applyTokenDiff(el, previewTokens);
}

export function exitPreviewMode() {
  if (!_savedPreviewTokens) return;
  var el = document.documentElement;
  el.style.cssText = '';
  for (var k in _savedPreviewTokens) {
    if (Object.prototype.hasOwnProperty.call(_savedPreviewTokens, k) && _savedPreviewTokens[k]) {
      el.style.setProperty(k, _savedPreviewTokens[k]);
    }
  }
  _savedPreviewTokens = null;
}

export default function useBrandAppearance(brand, planInfo) {
  var [themePref, setThemePref] = useState(loadThemePref);
  var savedCampaignRef = useRef(null);

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

  useEffect(function() {
    if (_savedPreviewTokens) return;
    applyBrandVars(appBrand);

    if (savedCampaignRef.current) {
      var campaign = savedCampaignRef.current;
      if (isCampaignActive(campaign)) {
        applyCampaignOverride(campaign);
      }
      savedCampaignRef.current = null;
    }
  }, [appBrand]);

  var checkCampaigns = useCallback(function(campaigns) {
    if (!campaigns || campaigns.length === 0) return;
    for (var ci = 0; ci < campaigns.length; ci++) {
      var c = campaigns[ci];
      if (isCampaignActive(c)) {
        savedCampaignRef.current = c;
        applyCampaignOverride(c);
        break;
      }
    }
  }, []);

  return { appBrand, effectiveTheme, toggleTheme, themePref, checkCampaigns };
}

function isCampaignActive(campaign) {
  if (!campaign || !campaign.is_active) return false;
  var now = Date.now();
  var start = new Date(campaign.starts_at).getTime();
  var end = new Date(campaign.expires_at).getTime();
  return now >= start && now < end;
}

function applyCampaignOverride(campaign) {
  if (!campaign || !campaign.schema_override) return;
  var el = document.documentElement;
  var override = typeof campaign.schema_override === 'string'
    ? JSON.parse(campaign.schema_override) : campaign.schema_override;
  if (override.palette) {
    var pal = override.palette;
    if (pal.primary) el.style.setProperty('--brand', pal.primary);
    if (pal.bgPage) el.style.setProperty('--bg-page', pal.bgPage);
    if (pal.bgCard) el.style.setProperty('--bg-card', pal.bgCard);
    if (pal.textMain) el.style.setProperty('--text-main', pal.textMain);
  }
}
