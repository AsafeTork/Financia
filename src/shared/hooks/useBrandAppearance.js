import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { brandAlpha, deriveCores } from '../../lib/utils.js';
import { planVisualDefaults, WHITE_LABEL_VISUAL_DEFAULT } from '../../lib/constants.js';
import { PALETTE_DEFAULTS } from '../../features/branding/defaults.js';

function getLuminance(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function adjustForContrast(fg, bg, minRatio) {
  const fgRgb = [parseInt(fg.slice(1, 3), 16), parseInt(fg.slice(3, 5), 16), parseInt(fg.slice(5, 7), 16)];
  const _bgLum = getLuminance(bg);
  for (let factor = 0.9; factor >= 0.1; factor -= 0.1) {
    const adjusted = fgRgb.map(c => Math.round(c * factor));
    const hex = '#' + adjusted.map(c => c.toString(16).padStart(2, '0')).join('');
    if (getContrastRatio(hex, bg) >= minRatio) return hex;
  }
  for (let factor = 1.1; factor <= 2.0; factor += 0.1) {
    const adjusted = fgRgb.map(c => Math.min(255, Math.round(c * factor)));
    const hex = '#' + adjusted.map(c => c.toString(16).padStart(2, '0')).join('');
    if (getContrastRatio(hex, bg) >= minRatio) return hex;
  }
  return fg;
}

function loadThemePref() {
  try { return localStorage.getItem('financia_theme'); } catch { return null; }
}

function saveThemePref(value) {
  try { localStorage.setItem('financia_theme', value); } catch { /* ignore */ }
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
  for (const k in tokens) {
    if (!Object.prototype.hasOwnProperty.call(tokens, k)) continue;
    const val = tokens[k];
    if (val !== null && val !== undefined) {
      el.style.setProperty(k, val);
    }
  }
}

const THEME_CONTROLLED_VARS = new Set([
  '--bg-page', '--bg-card', '--bg-subtle', '--bg-input', '--surface',
  '--text-main', '--text-sub', '--text-muted',
  '--border', '--border-md',
  '--shadow-sm', '--shadow-md', '--shadow-lg',
]);

function applyBrandThemeVars(el, tokens) {
  const isDark = el.getAttribute('data-theme') === 'dark';
  if (!isDark) {
    applyTokenDiff(el, tokens);
    return;
  }
  for (const k of THEME_CONTROLLED_VARS) {
    if (Object.prototype.hasOwnProperty.call(tokens, k)) {
      el.style.removeProperty(k);
    }
  }
  const brandOnly = {};
  for (const k in tokens) {
    if (!Object.prototype.hasOwnProperty.call(tokens, k)) continue;
    if (!THEME_CONTROLLED_VARS.has(k)) {
      brandOnly[k] = tokens[k];
    }
  }
  applyTokenDiff(el, brandOnly);
}

function collectTokensFromBrand(b) {
  const primary = b.color || '#002f59';
  const derived = deriveCores(primary);
  const secondary = b.color_secondary || derived.secondary;
  const accent = b.color_accent || derived.accent;
  const tokens = {
    '--brand': primary,
    '--brand-soft': brandAlpha(primary, 0.08),
    '--brand-secondary': secondary,
    '--brand-accent': accent,
    '--brand-accent-soft': brandAlpha(accent, 0.12),
    '--brand-grad': `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
  };

  const whiteContrast = getContrastRatio(primary, '#ffffff');
  const safePrimary = whiteContrast >= 4.5 ? primary : adjustForContrast(primary, '#ffffff', 4.5);
  if (safePrimary !== primary) {
    tokens['--brand-safe'] = safePrimary;
  }

  if (!b || !b.brand_config) return tokens;
  let cfg;
  try { cfg = typeof b.brand_config === 'string' ? JSON.parse(b.brand_config) : b.brand_config; }
  catch { return tokens; }

  const pal = cfg.palette || (cfg.modules && cfg.modules.palette) || {};
  if (!pal || Object.keys(pal).length === 0) return tokens;

  const v2 = m => cfg.modules ? cfg.modules[m] : null;
  const paletteTokens = {
    '--bg-page': pal.bgPage || PALETTE_DEFAULTS.bgPage,
    '--bg-card': pal.bgCard || PALETTE_DEFAULTS.bgCard,
    '--bg-subtle': pal.bgSubtle || PALETTE_DEFAULTS.bgSubtle,
    '--bg-input': pal.bgInput || PALETTE_DEFAULTS.bgInput,
    '--text-main': pal.textMain || PALETTE_DEFAULTS.textMain,
    '--text-sub': pal.textSub || PALETTE_DEFAULTS.textSub,
    '--text-muted': pal.textMuted || PALETTE_DEFAULTS.textMuted,
    '--border': pal.border || PALETTE_DEFAULTS.border,
    '--success': pal.success || PALETTE_DEFAULTS.success,
    '--warning': pal.warning || PALETTE_DEFAULTS.warning,
    '--danger': pal.danger || PALETTE_DEFAULTS.danger,
    '--info': pal.info || PALETTE_DEFAULTS.info,
    '--positive': pal.positive,
    '--negative': pal.negative,
    '--chart-1': pal.chart1,
    '--chart-2': pal.chart2,
    '--chart-3': pal.chart3,
    '--chart-4': pal.chart4,
    '--chart-5': pal.chart5,
    '--chart-6': pal.chart6,
  };
  for (const pk in paletteTokens) {
    if (paletteTokens[pk]) tokens[pk] = paletteTokens[pk];
  }

  let mod = cfg.typography || v2('typography');
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

/**
 * Applies brand variables to the document element.
 * @param {Object} b - Brand object
 */
export function applyBrandVars(b) {
  const el = document.documentElement;
  const tokens = collectTokensFromBrand(b);
  applyBrandThemeVars(el, tokens);
}

/**
 * Applies brand studio config to the document element.
 * @param {Object} b - Brand object
 */
export function applyBrandStudioConfig(b) {
  applyBrandVars(b);
}

/**
 * Enters preview mode with proposed brand tokens.
 * @param {Object} proposedBrand - Proposed brand configuration
 */
export function enterPreviewMode(proposedBrand) {
  const el = document.documentElement;
  const previewTokens = collectTokensFromBrand(proposedBrand);
  applyBrandThemeVars(el, previewTokens);
}

/**
 * Exits preview mode by removing only preview-specific CSS variables.
 * Does NOT clear all inline styles (which would break the UI).
 */
export function exitPreviewMode() {
  const el = document.documentElement;
  const previewKeys = ['--brand', '--brand-soft', '--brand-secondary', '--brand-accent', '--brand-accent-soft', '--brand-grad'];
  previewKeys.forEach(k => el.style.removeProperty(k));
}

export default function useBrandAppearance(brand, planInfo) {
  const [themePref, setThemePref] = useState(loadThemePref);
  const savedCampaignRef = useRef(null);
  const appBrandRef = useRef(null);

  const hasWhiteLabel = !!(brand && brand.white_label);
  const visualPreset = useMemo(() => hasWhiteLabel ? null : planVisualDefaults(planInfo), [hasWhiteLabel, planInfo]);
  const missingCustomPalette = computeMissingCustomPalette(brand);
  const useWhiteLabelFallback = computeUseWhiteLabelFallback(hasWhiteLabel, brand, missingCustomPalette);

  const appBrand = useMemo(() => {
    const next = hasWhiteLabel
      ? (useWhiteLabelFallback
        ? { ...brand, color: WHITE_LABEL_VISUAL_DEFAULT.color, color_secondary: WHITE_LABEL_VISUAL_DEFAULT.color_secondary, color_accent: WHITE_LABEL_VISUAL_DEFAULT.color_accent, theme: WHITE_LABEL_VISUAL_DEFAULT.theme }
        : brand)
      : { ...brand, color: visualPreset.color, color_secondary: visualPreset.color_secondary, color_accent: visualPreset.color_accent, theme: visualPreset.theme };
    const prev = appBrandRef.current;
    if (prev && prev.name===next.name && prev.logo===next.logo && prev.color===next.color && prev.color_secondary===next.color_secondary && prev.color_accent===next.color_accent && prev.theme===next.theme && prev.logo_url===next.logo_url && prev.phone===next.phone && prev.white_label===next.white_label && prev.niche===next.niche && prev.visual_version===next.visual_version && prev.custom_palette===next.custom_palette && prev.brand_config===next.brand_config) return prev;
    appBrandRef.current = next;
    return next;
  }, [hasWhiteLabel, useWhiteLabelFallback, brand, visualPreset]);

  const effectiveTheme = computeEffectiveTheme(themePref, appBrand);

  const appBrandTokens = useMemo(function() {
    return collectTokensFromBrand(appBrand);
  }, [appBrand]);

  const toggleTheme = useCallback(() => {
    const el = document.documentElement;
    const current = el.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';

    el.setAttribute('data-theme', next);
    saveThemePref(next);

    const tokens = appBrandTokens;
    if (next === 'dark') {
      THEME_CONTROLLED_VARS.forEach(function(k) { el.style.removeProperty(k); });
      const brandOnly = {};
      for (const k in tokens) {
        if (Object.prototype.hasOwnProperty.call(tokens, k) && !THEME_CONTROLLED_VARS.has(k)) {
          brandOnly[k] = tokens[k];
        }
      }
      applyTokenDiff(el, brandOnly);
    } else {
      applyTokenDiff(el, tokens);
    }

    setTimeout(function() { setThemePref(next); }, 0);
  }, [appBrandTokens]);

  useEffect(() => {
    let cancelled = false;
    requestAnimationFrame(function() {
      if (cancelled) return;
      const el = document.documentElement;
      const theme = effectiveTheme === 'dark' ? 'dark' : 'light';
      const currentTheme = el.getAttribute('data-theme');
      if (currentTheme === theme) return;
      const tokens = appBrandTokens;
      if (theme === 'dark') {
        el.setAttribute('data-theme', 'dark');
        THEME_CONTROLLED_VARS.forEach(function(k) {
          el.style.removeProperty(k);
        });
        const brandOnly = {};
        for (const k in tokens) {
          if (!Object.prototype.hasOwnProperty.call(tokens, k)) continue;
          if (!THEME_CONTROLLED_VARS.has(k)) {
            brandOnly[k] = tokens[k];
          }
        }
        applyTokenDiff(el, brandOnly);
      } else {
        el.setAttribute('data-theme', 'light');
        applyTokenDiff(el, tokens);
      }

      if (savedCampaignRef.current) {
        const campaign = savedCampaignRef.current;
        if (isCampaignActive(campaign)) {
          applyCampaignOverride(campaign);
        }
        savedCampaignRef.current = null;
      }
    });
    return function() { cancelled = true; };
  }, [effectiveTheme, appBrandTokens]);

  const checkCampaigns = useCallback((campaigns) => {
    if (!campaigns || campaigns.length === 0) return;
    for (let ci = 0; ci < campaigns.length; ci++) {
      const c = campaigns[ci];
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
  const now = Date.now();
  const start = new Date(campaign.starts_at).getTime();
  const end = new Date(campaign.expires_at).getTime();
  return now >= start && now < end;
}

function applyCampaignOverride(campaign) {
  if (!campaign || !campaign.schema_override) return;
  const el = document.documentElement;
  const override = typeof campaign.schema_override === 'string'
    ? JSON.parse(campaign.schema_override) : campaign.schema_override;
  if (override.palette) {
    const pal = override.palette;
    if (pal.primary) el.style.setProperty('--brand', pal.primary);
    if (el.getAttribute('data-theme') !== 'dark') {
      if (pal.bgPage) el.style.setProperty('--bg-page', pal.bgPage);
      if (pal.bgCard) el.style.setProperty('--bg-card', pal.bgCard);
      if (pal.textMain) el.style.setProperty('--text-main', pal.textMain);
    }
  }
}