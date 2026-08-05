export function hexToRgb(hex) {
  var h = (hex || '#002f59').replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return { r: parseInt(h.substring(0, 2), 16), g: parseInt(h.substring(2, 4), 16), b: parseInt(h.substring(4, 6), 16) };
}

export function luminance(hex) {
  var c = hexToRgb(hex);
  var toLinear = function(v) { v = v / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * toLinear(c.r) + 0.7152 * toLinear(c.g) + 0.0722 * toLinear(c.b);
}

export function getContrastRatio(fg, bg) {
  var l1 = luminance(fg);
  var l2 = luminance(bg);
  var lighter = Math.max(l1, l2);
  var darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function meetsContrast(fg, bg, level) {
  var ratio = getContrastRatio(fg, bg);
  return ratio >= level;
}

export function adjustForContrast(fg, bg, targetRatio) {
  var currentRatio = getContrastRatio(fg, bg);
  if (currentRatio >= targetRatio) return fg;

  var fgLum = luminance(fg);
  var bgLum = luminance(bg);
  var isFgDarker = fgLum < bgLum;

  var targetLum = isFgDarker
    ? (bgLum + 0.05) / targetRatio - 0.05
    : (bgLum + 0.05) * targetRatio - 0.05;

  var c = hexToRgb(fg);
  var step = isFgDarker ? -1 : 1;
  var adjusted = { ...c };

  for (var i = 0; i < 50; i++) {
    adjusted.r = Math.max(0, Math.min(255, adjusted.r + step * 5));
    adjusted.g = Math.max(0, Math.min(255, adjusted.g + step * 5));
    adjusted.b = Math.max(0, Math.min(255, adjusted.b + step * 5));
    var testHex = '#' + [adjusted.r, adjusted.g, adjusted.b].map(function(v) {
      return v.toString(16).padStart(2, '0');
    }).join('');
    if (getContrastRatio(testHex, bg) >= targetRatio) {
      return testHex;
    }
  }

  return isFgDarker ? '#000000' : '#ffffff';
}

export function getSafePalette(primary) {
  var safePrimary = meetsContrast(primary, '#ffffff', 4.5)
    ? primary
    : adjustForContrast(primary, '#ffffff', 4.5);
  var safeSecondary = meetsContrast('#0a2540', safePrimary, 4.5)
    ? '#0a2540'
    : adjustForContrast('#0a2540', safePrimary, 4.5);
  var safeAccent = meetsContrast('#ffffff', safePrimary, 4.5)
    ? '#ffffff'
    : adjustForContrast('#ffffff', safePrimary, 4.5);

  return {
    primary: safePrimary,
    secondary: safeSecondary,
    accent: safeAccent,
    onPrimary: meetsContrast('#ffffff', safePrimary, 4.5) ? '#ffffff' : '#0a2540',
    onSecondary: meetsContrast('#ffffff', safeSecondary, 4.5) ? '#ffffff' : '#0a2540',
    onAccent: meetsContrast('#ffffff', safeAccent, 4.5) ? '#ffffff' : '#0a2540'
  };
}

export function checkBrandContrast(brand) {
  var primary = brand.color || '#002f59';
  var warnings = [];
  var safe = getSafePalette(primary);

  if (!meetsContrast(primary, '#ffffff', 4.5)) {
    warnings.push({
      level: 'error',
      message: 'Cor da marca não atinge contraste 4.5:1 sobre branco',
      current: primary,
      suggested: safe.primary,
      element: 'text on primary button'
    });
  }
  if (!meetsContrast('#0a2540', primary, 4.5)) {
    warnings.push({
      level: 'warn',
      message: 'Texto escuro não atinge contraste sobre a cor da marca',
      current: '#0a2540',
      suggested: safe.onPrimary,
      element: 'text on primary background'
    });
  }

  return { warnings, safe, passes: warnings.length === 0 };
}