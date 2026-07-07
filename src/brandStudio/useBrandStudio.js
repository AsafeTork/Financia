import { useState, useCallback, useRef } from 'react';
import { validateBrandConfig } from './validateBrandConfig.js';
import { PALETTE_DEFAULTS } from './schema.js';
import { deriveCores } from '../lib/utils.js';

var MAX_HISTORY = 20;

export default function useBrandStudio(brand, planInfo, onSave) {
  var [jsonInput, setJsonInput] = useState('');
  var [validation, setValidation] = useState(null);
  var [preview, setPreview] = useState(null);
  var [applying, setApplying] = useState(false);
  var [history, setHistory] = useState([]);
  var [canUndo, setCanUndo] = useState(false);
  var historyRef = useRef([]);

  var parseAndValidate = useCallback(function(raw) {
    setJsonInput(raw);
    if (!raw || !raw.trim()) {
      setValidation(null);
      setPreview(null);
      return;
    }
    try {
      var parsed = JSON.parse(raw);
    } catch (e) {
      setValidation({ valid: false, errors: ['JSON mal formatado: ' + (e.message || 'erro de sintaxe')] });
      setPreview(null);
      return;
    }
    var result = validateBrandConfig(parsed);
    setValidation(result);
    if (result.valid) {
      var built = buildPreviewConfig(parsed);
      setPreview(built);
    } else {
      setPreview(null);
    }
  }, []);

  var applyConfig = useCallback(function() {
    if (!preview) return;
    if (applying) return;
    setApplying(true);

    var nb = buildBrandUpdate(preview, brand);
    var snapshot = {
      brand: Object.assign({}, brand),
      visual_version: brand.visual_version || 0,
      timestamp: Date.now(),
    };

    onSave(nb).then(function() {
      var h = historyRef.current;
      h.push(snapshot);
      if (h.length > MAX_HISTORY) h.shift();
      historyRef.current = h;
      setHistory([].concat(h));
      setCanUndo(h.length > 0);
      setApplying(false);
      setJsonInput('');
      setValidation(null);
      setPreview(null);
    }).catch(function() {
      setApplying(false);
    });
  }, [preview, applying, brand, onSave]);

  var undoLast = useCallback(function() {
    var h = historyRef.current;
    if (h.length === 0) return;
    var last = h.pop();
    historyRef.current = h;
    setHistory([].concat(h));
    setCanUndo(h.length > 0);

    var nb = Object.assign({}, last.brand);
    onSave(nb).then(function() {}).catch(function() {});
  }, [onSave]);

  var clearInput = useCallback(function() {
    setJsonInput('');
    setValidation(null);
    setPreview(null);
  }, []);

  return {
    jsonInput: jsonInput,
    validation: validation,
    preview: preview,
    applying: applying,
    canUndo: canUndo,
    historyCount: history.length,
    parseAndValidate: parseAndValidate,
    applyConfig: applyConfig,
    undoLast: undoLast,
    clearInput: clearInput,
  };
}

function fillDefaults(parsed) {
  var palette = parsed.palette || {};
  var theme = parsed.theme || {};
  var derived = deriveCores(palette.primary || '#002f59');

  var outPalette = {};
  outPalette.primary = palette.primary || '#002f59';
  outPalette.secondary = palette.secondary || derived.secondary;
  outPalette.accent = palette.accent || derived.accent;
  var defaultKeys = Object.keys(PALETTE_DEFAULTS);
  for (var di = 0; di < defaultKeys.length; di++) {
    var dk = defaultKeys[di];
    outPalette[dk] = palette[dk] || PALETTE_DEFAULTS[dk];
  }

  return {
    schemaVersion: parsed.schemaVersion || '1.0.0',
    brandName: parsed.brandName || '',
    theme: { mode: theme.mode || 'light' },
    palette: outPalette,
    typography: parsed.typography || null,
    logo: parsed.logo || null,
    sidebar: parsed.sidebar || null,
    header: parsed.header || null,
    cards: parsed.cards || null,
    buttons: parsed.buttons || null,
    inputs: parsed.inputs || null,
    borderRadius: parsed.borderRadius || null,
    shadows: parsed.shadows || null,
    spacing: parsed.spacing || null,
    animations: parsed.animations || null,
  };
}

function buildPreviewConfig(parsed) {
  return fillDefaults(parsed);
}

function buildBrandUpdate(preview, currentBrand) {
  var palette = preview.palette;
  var theme = preview.theme || {};
  return Object.assign({}, currentBrand, {
    name: preview.brandName || currentBrand.name,
    color: palette.primary,
    color_secondary: palette.secondary,
    color_accent: palette.accent,
    theme: theme.mode || currentBrand.theme || 'light',
    brand_config: JSON.stringify(preview),
    visual_version: (currentBrand.visual_version || 0) + 1,
    custom_palette: true,
  });
}
