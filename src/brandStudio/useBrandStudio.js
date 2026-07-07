import { useState, useCallback, useRef, useMemo } from 'react';
import { listModules } from './schemaRegistry.js';
import processResponse from './responseProcessor.js';
import generatePrompt from './promptGenerator.js';
import { enterPreviewMode, exitPreviewMode } from '../hooks/useBrandAppearance.js';

var MAX_HISTORY = 20;

export default function useBrandStudio(brand, planInfo, onSave, toast) {
  var [mode, setMode] = useState('basic');
  var [jsonInput, setJsonInput] = useState('');
  var [validation, setValidation] = useState(null);
  var [summary, setSummary] = useState(null);
  var [proposedBrand, setProposedBrand] = useState(null);
  var [approvedModules, setApprovedModules] = useState([]);
  var [applying, setApplying] = useState(false);
  var [history, setHistory] = useState([]);
  var [canUndo, setCanUndo] = useState(false);
  var [adaptedModel, setAdaptedModel] = useState(null);
  var [adapted, setAdapted] = useState(false);
  var historyRef = useRef([]);

  var modules = listModules();
  var brandConfig = useMemo(function() {
    var bc = brand && brand.brand_config;
    return bc
      ? (typeof bc === 'string' ? JSON.parse(bc) : bc)
      : { modules: {} };
  }, [brand]);

  var parseAndValidate = useCallback(function(raw) {
    setJsonInput(raw);
    if (!raw || !raw.trim()) {
      setValidation(null);
      setSummary(null);
      setProposedBrand(null);
      setApprovedModules([]);
      setAdaptedModel(null);
      return;
    }

    var result = processResponse(raw, brand);
    if (!result.success) {
      setValidation({ valid: false, errors: [result.error || 'Erro ao processar resposta'] });
      setSummary(null);
      setProposedBrand(null);
      setApprovedModules([]);
      setAdaptedModel(result.adaptedModel);
      setAdapted(result.adapted);
      return;
    }

    setAdaptedModel(result.adaptedModel);
    setAdapted(result.adapted);
    setValidation({ valid: true, errors: [] });

    var summ = result.summary;
    setSummary(summ);

    var allModules = [];
    if (summ.technical) {
      for (var mi = 0; mi < summ.technical.length; mi++) {
        allModules.push(summ.technical[mi].module);
      }
    }
    setApprovedModules(allModules);

    var pb = result.proposedBrand;
    setProposedBrand(pb);

    enterPreviewMode(pb);
  }, [brand]);

  var toggleModule = useCallback(function(modName) {
    setApprovedModules(function(prev) {
      var idx = prev.indexOf(modName);
      if (idx === -1) {
        return prev.concat([modName]);
      }
      return prev.filter(function(m) { return m !== modName; });
    });
  }, []);

  var applyConfig = useCallback(function() {
    if (!proposedBrand) return;
    if (applying) return;
    if (approvedModules.length === 0) {
      if (toast) toast('Selecione pelo menos um modulo para aplicar.', 'warning');
      return;
    }
    setApplying(true);

    exitPreviewMode();

    var finalBrand = buildFinalBrand(proposedBrand, approvedModules, brand, brandConfig);
    var snapshot = {
      brand: Object.assign({}, brand),
      visual_version: brand.visual_version || 0,
      timestamp: Date.now(),
    };

    onSave(finalBrand).then(function() {
      var h = historyRef.current;
      h.push(snapshot);
      if (h.length > MAX_HISTORY) h.shift();
      historyRef.current = h;
      setHistory([].concat(h));
      setCanUndo(h.length > 0);
      setApplying(false);
      setJsonInput('');
      setValidation(null);
      setSummary(null);
      setProposedBrand(null);
      setApprovedModules([]);
      setAdaptedModel(null);
      if (toast) toast('Identidade visual atualizada com sucesso!', 'success');
    }).catch(function() {
      setApplying(false);
      if (toast) toast('Erro ao aplicar configuracao.', 'error');
    });
  }, [proposedBrand, applying, brand, brandConfig, approvedModules, onSave, toast]);

  var undoLast = useCallback(function() {
    var h = historyRef.current;
    if (h.length === 0) return;
    exitPreviewMode();
    var last = h.pop();
    historyRef.current = h;
    setHistory([].concat(h));
    setCanUndo(h.length > 0);
    var nb = Object.assign({}, last.brand);
    onSave(nb).then(function() {}).catch(function() {});
  }, [onSave]);

  var clearInput = useCallback(function() {
    exitPreviewMode();
    setJsonInput('');
    setValidation(null);
    setSummary(null);
    setProposedBrand(null);
    setApprovedModules([]);
    setAdaptedModel(null);
  }, []);

  var copyPrompt = useCallback(function() {
    var prompt = generatePrompt({ context: getContextInfo(brand), limitations: getLimitations(planInfo) });
    navigator.clipboard.writeText(prompt).then(function() {
      if (toast) toast('Instrucoes copiadas para a area de transferencia!', 'success');
    }).catch(function() {
      if (toast) toast('Nao foi possivel copiar automaticamente.', 'warning');
    });
  }, [brand, planInfo, toast]);

  var exportHistory = useCallback(function() {
    var data = JSON.stringify(historyRef.current, null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'brand_history_' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    if (toast) toast('Historico exportado com sucesso!', 'success');
  }, [toast]);

  var handleSetMode = useCallback(function(newMode) {
    exitPreviewMode();
    setMode(newMode);
  }, []);

  return {
    mode: mode,
    setMode: handleSetMode,
    jsonInput: jsonInput,
    validation: validation,
    summary: summary,
    proposedBrand: proposedBrand,
    approvedModules: approvedModules,
    applying: applying,
    canUndo: canUndo,
    historyCount: history.length,
    modules: modules,
    brandConfig: brandConfig,
    adaptedModel: adaptedModel,
    adapted: adapted,
    parseAndValidate: parseAndValidate,
    toggleModule: toggleModule,
    applyConfig: applyConfig,
    undoLast: undoLast,
    clearInput: clearInput,
    copyPrompt: copyPrompt,
    exportHistory: exportHistory,
  };
}

function getContextInfo(brand) {
  if (!brand) return '';
  var lines = [];
  lines.push('App atual: ' + (brand.name || 'Financia'));
  lines.push('Cor primaria: ' + (brand.color || '#002f59'));
  lines.push('Tema: ' + (brand.theme || 'light'));
  if (brand.logo_url) lines.push('Logo: personalizada');
  if (brand.brand_config) lines.push('Configuracao: personalizada');
  return lines.join('\n');
}

function getLimitations(planInfo) {
  if (!planInfo) return '';
  var lines = [];
  lines.push('- Tamanho maximo do JSON: 50KB');
  lines.push('- Cores: formato hexadecimal (#RRGGBB)');
  lines.push('- Fontes: web-safe ou Google Fonts');
  lines.push('- Assets: max 512KB por arquivo');
  return lines.join('\n');
}

function buildFinalBrand(proposedBrand, approvedModules, currentBrand, currentBrandConfig) {
  var currentMods = (currentBrandConfig && currentBrandConfig.modules) || {};
  var proposedMods = (proposedBrand && proposedBrand.brand_config)
    ? (typeof proposedBrand.brand_config === 'string' ? JSON.parse(proposedBrand.brand_config) : proposedBrand.brand_config).modules || {}
    : {};

  var mergedMods = Object.assign({}, currentMods);
  for (var mi = 0; mi < approvedModules.length; mi++) {
    var modName = approvedModules[mi];
    if (proposedMods[modName]) {
      mergedMods[modName] = Object.assign({}, currentMods[modName], proposedMods[modName]);
    }
  }

  var mergedConfig = Object.assign({}, currentBrandConfig, { modules: mergedMods });

  var pal = mergedMods.palette || {};
  return Object.assign({}, currentBrand, {
    name: currentBrand && currentBrand.name,
    color: pal.primary || '#002f59',
    color_secondary: pal.secondary || '#e8f0f7',
    color_accent: pal.accent || '#1a6b5c',
    theme: pal.mode || (currentBrand && currentBrand.theme) || 'light',
    brand_config: JSON.stringify(mergedConfig),
    visual_version: ((currentBrand && currentBrand.visual_version) || 0) + 1,
    custom_palette: true,
  });
}
