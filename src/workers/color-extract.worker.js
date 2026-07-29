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
    var lum = luminance(allHexes[j]);
    if (!dark && lum < 0.2) dark = allHexes[j];
    else if (!mid && lum >= 0.2 && lum <= 0.6) mid = allHexes[j];
    else if (!light && lum > 0.6) light = allHexes[j];
  }
  var primary = dark || allHexes[0] || '#002f59';
  return {
    primary: primary,
    secondary: mid || primary,
    accent: light || primary,
    all: allHexes.slice(0, 5)
  };
}

self.onmessage = function(e) {
  var pixelData = e.data;
  var imageData = new ImageData(
    new Uint8ClampedArray(pixelData.data),
    pixelData.width,
    pixelData.height
  );
  var result = extractColors(imageData);
  self.postMessage(result);
};
