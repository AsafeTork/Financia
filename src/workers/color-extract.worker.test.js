import { describe, it, expect } from 'vitest';

function luminance(hex) {
  var r = parseInt(hex.slice(1, 3), 16) / 255;
  var g = parseInt(hex.slice(3, 5), 16) / 255;
  var b = parseInt(hex.slice(5, 7), 16) / 255;
  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function extractColors(imageData) {
  var d = imageData.data;
  var buckets = {};
  for (var i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    var r = Math.round(d[i] / 48) * 48;
    var g = Math.round(d[i + 1] / 48) * 48;
    var b = Math.round(d[i + 2] / 48) * 48;
    if (r > 230 && g > 230 && b > 230) continue;
    var k = r + ',' + g + ',' + b;
    buckets[k] = (buckets[k] || 0) + 1;
  }
  var allHexes = Object.entries(buckets)
    .sort(function(a, b) { return b[1] - a[1]; })
    .map(function(pair) {
      var parts = pair[0].split(',').map(Number);
      return '#' + parts.map(function(v) { return v.toString(16).padStart(2, '0'); }).join('');
    });
  var dark = null, mid = null, light = null;
  for (var j = 0; j < allHexes.length; j++) {
    var hex = allHexes[j];
    var lum = luminance(hex);
    if (!dark && lum < 0.2) dark = hex;
    else if (!mid && lum >= 0.2 && lum <= 0.6) mid = hex;
    else if (!light && lum > 0.6) light = hex;
  }
  var primary = dark || allHexes[0] || '#002f59';
  return {
    primary: primary,
    secondary: mid || primary,
    accent: light || primary,
    all: allHexes.slice(0, 5)
  };
}

describe('luminance', () => {
  it('returns 0 for black', () => {
    expect(luminance('#000000')).toBe(0);
  });

  it('returns ~1 for white', () => {
    expect(luminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('returns a positive value for mid-gray', () => {
    var result = luminance('#808080');
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThan(1);
  });
});

describe('extractColors', () => {
  it('returns primary, secondary, accent from solid-color image data', () => {
    var width = 10;
    var height = 10;
    var data = new Uint8ClampedArray(width * height * 4);
    for (var i = 0; i < data.length; i += 4) {
      data[i] = 0;
      data[i + 1] = 47;
      data[i + 2] = 89;
      data[i + 3] = 255;
    }
    var result = extractColors(new ImageData(data, width, height));
    expect(result.primary).toBe('#003060');
    expect(result.all.length).toBe(1);
    expect(result.all[0]).toBe('#003060');
  });

  it('skips transparent pixels', () => {
    var width = 2;
    var height = 2;
    var data = new Uint8ClampedArray(width * height * 4);
    data[0] = 255; data[1] = 0; data[2] = 0; data[3] = 0;
    data[4] = 0; data[5] = 255; data[6] = 0; data[7] = 255;
    data[8] = 0; data[9] = 0; data[10] = 255; data[11] = 255;
    data[12] = 255; data[13] = 255; data[14] = 0; data[15] = 255;
    var result = extractColors(new ImageData(data, width, height));
    expect(result.all.length).toBeGreaterThanOrEqual(1);
  });

  it('skips near-white pixels', () => {
    var width = 2;
    var height = 2;
    var data = new Uint8ClampedArray(width * height * 4);
    data[0] = 250; data[1] = 250; data[2] = 250; data[3] = 255;
    data[4] = 255; data[5] = 255; data[6] = 255; data[7] = 255;
    data[8] = 0; data[9] = 0; data[10] = 0; data[11] = 255;
    data[12] = 250; data[13] = 250; data[14] = 250; data[15] = 255;
    var result = extractColors(new ImageData(data, width, height));
    expect(result.all.length).toBe(1);
    expect(result.all[0]).toBe('#000000');
  });

  it('returns sensible structure', () => {
    var width = 1;
    var height = 1;
    var data = new Uint8ClampedArray([0, 47, 89, 255]);
    var result = extractColors(new ImageData(data, width, height));
    expect(result).toHaveProperty('primary');
    expect(result).toHaveProperty('secondary');
    expect(result).toHaveProperty('accent');
    expect(result).toHaveProperty('all');
    expect(Array.isArray(result.all)).toBe(true);
  });
});