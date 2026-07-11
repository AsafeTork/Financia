import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { brandAlpha, deriveCores } from '../../lib/utils.js';
import { planVisualDefaults, WHITE_LABEL_VISUAL_DEFAULT } from '../../lib/constants.js';

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
  catch { return tokens; }

  var pal = cfg.palette || (cfg.modules && cfg.modules.palette) || {};
  if (!pal || Object.keys(pal).length === 0) return tokens;

  var v2 = function(m) { return cfg.modules ? cfg.modules[m] : null; };
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

  var mod = cfg.typography || v2('typography');
  if (mod) {
    if (mod.fontFamily) tokens['--font-family'] = mod.fontFamily;
    if (mod.headingFont) tokens['--font-heading'] = mod.headingFont;
    if (mod.monoFont) tokens['--font-mono'] = mod.monoFont;
    if (mod.baseSize) tokens['--font-base'] = mod.baseSize;
    if (mod.scale) tokens['--font-scale'] = String(mod.scale);
  }
  mod = cfg.borderRadius || v2('borderRadius');
  if (mod) {
    if (mod.sm) tokens['--radius-sm'] = mod.sm;
    if (mod.md) tokens['--radius-md'] = mod.md;
    if (mod.lg) tokens['--radius-lg'] = mod.lg;
    if (mod.xl) tokens['--radius-xl'] = mod.xl;
    if (mod.full) tokens['--radius-full'] = mod.full;
  }
  mod = cfg.spacing || v2('spacing');
  if (mod) {
    if (mod.gap) tokens['--spacing-gap'] = mod.gap;
    if (mod.section) tokens['--spacing-section'] = mod.section;
    if (mod.card) tokens['--spacing-card'] = mod.card;
  }
  mod = cfg.sidebar || v2('sidebar');
  if (mod) {
    if (mod.width) tokens['--sidebar-width'] = mod.width;
    if (mod.collapsedWidth) tokens['--sidebar-collapsed-width'] = mod.collapsedWidth;
    if (mod.bg) tokens['--sidebar-bg'] = mod.bg;
    if (mod.text) tokens['--sidebar-text'] = mod.text;
    if (mod.activeBg) tokens['--sidebar-active-bg'] = mod.activeBg;
    if (mod.activeText) tokens['--sidebar-active-text'] = mod.activeText;
    if (mod.hoverBg) tokens['--sidebar-hover-bg'] = mod.hoverBg;
    if (mod.divider) tokens['--sidebar-divider'] = mod.divider;
  }
  mod = cfg.header || v2('header');
  if (mod) {
    if (mod.bg) tokens['--header-bg'] = mod.bg;
    if (mod.text) tokens['--header-text'] = mod.text;
    if (mod.height) tokens['--header-height'] = mod.height;
  }
  mod = cfg.cards || v2('cards');
  if (mod) {
    if (mod.bg) tokens['--card-bg'] = mod.bg;
    if (mod.shadow) tokens['--card-shadow'] = mod.shadow;
  }
  mod = cfg.buttons || v2('buttons');
  if (mod) {
    if (mod.primaryBg) tokens['--btn-primary-bg'] = mod.primaryBg;
    if (mod.primaryText) tokens['--btn-primary-text'] = mod.primaryText;
    if (mod.secondaryBg) tokens['--btn-secondary-bg'] = mod.secondaryBg;
    if (mod.secondaryText) tokens['--btn-secondary-text'] = mod.secondaryText;
    if (mod.radius) tokens['--btn-radius'] = mod.radius;
    if (mod.height) tokens['--btn-height'] = mod.height;
  }
  mod = cfg.inputs || v2('inputs');
  if (mod) {
    if (mod.bg) tokens['--input-bg'] = mod.bg;
    if (mod.text) tokens['--input-text'] = mod.text;
    if (mod.border) tokens['--input-border'] = mod.border;
    if (mod.focusBorder) tokens['--input-focus-border'] = mod.focusBorder;
    if (mod.radius) tokens['--input-radius'] = mod.radius;
    if (mod.height) tokens['--input-height'] = mod.height;
  }
  mod = cfg.shadows || v2('shadows');
  if (mod) {
    if (mod.sm) tokens['--shadow-sm'] = mod.sm;
    if (mod.md) tokens['--shadow-md'] = mod.md;
    if (mod.lg) tokens['--shadow-lg'] = mod.lg;
  }
  mod = cfg.animations || v2('animations');
  if (mod) {
    if (mod.duration) tokens['--anim-duration'] = mod.duration;
    if (mod.easing) tokens['--anim-easing'] = mod.easing;
  }
  return tokens;
}

export function applyBrandVars(b) {
  var el = document.documentElement;
  var tokens = collectTokensFromBrand(b);
  applyTokenDiff(el, tokens);
}

export function applyBrandStudioConfig(b) {
  applyBrandVars(b);
}

export function enterPreviewMode(proposedBrand) {
  var el = document.documentElement;
  var previewTokens = collectTokensFromBrand(proposedBrand);
  applyTokenDiff(el, previewTokens);
}

export function exitPreviewMode() {
  var el = document.documentElement;
  el.style.cssText = '';
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