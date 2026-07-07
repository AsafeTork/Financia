import { useState, useCallback, useMemo, useEffect } from 'react';
import generatePrompt from './promptGenerator.js';
import processResponse from './responseProcessor.js';
import { listPresets, getPreset, savePreset, deletePreset, duplicatePreset, toggleFavoritePreset, exportPreset, importPreset, getPresetCategories, loadPresetsFromDb, setOnChange } from './presets.js';
import { applyPlanOverride } from './planThemes.js';
import { enterPreviewMode, exitPreviewMode } from '../hooks/useBrandAppearance.js';

export default function useBrandStudio(brand, planInfo, onSave, toast) {
  var brandConfig = useMemo(function() {
    var bc = brand && brand.brand_config;
    if (typeof bc === 'string') { try { return JSON.parse(bc); } catch (_) { return { modules: {} }; } }
    return bc || { modules: {} };
  }, [brand]);

  var [allPresets, setAllPresets] = useState([]);
  var [history, setHistory] = useState([]);
  var [historyIndex, setHistoryIndex] = useState(-1);
  var [proposed, setProposed] = useState(null);
  var [brandGlobal, setBrandGlobalState] = useState(function() {
    return {
      logo_url: (brand && brand.logo_url) || '',
      favicon_url: (brand && brand.favicon_url) || '',
      name: (brand && brand.name) || '',
      short_name: (brand && brand.short_name) || '',
      app_title: (brand && brand.app_title) || '',
      login_logo_url: (brand && brand.login_logo_url) || '',
      login_bg: (brand && brand.login_bg) || '',
      login_text: (brand && brand.login_text) || '',
      secondary_logo_url: (brand && brand.secondary_logo_url) || '',
      secondary_logo_position: (brand && brand.secondary_logo_position) || 'right',
      secondary_logo_size: (brand && brand.secondary_logo_size) || 40,
    };
  });

  useEffect(function() {
    loadPresetsFromDb().then(function() { setAllPresets(listPresets()); });
    setOnChange(function() { setAllPresets(listPresets()); });
    return function() { setOnChange(null); };
  }, []);

  useEffect(function() {
    if (historyIndex >= 0 && history[historyIndex]) {
      enterPreviewMode(history[historyIndex]);
    }
    return function() { exitPreviewMode(); };
  }, [historyIndex]);

  var presetCats = useMemo(function() { return getPresetCategories(); }, [allPresets]);

  var saveToHistory = useCallback(function(b) {
    var entry = JSON.parse(JSON.stringify(b || brand));
    setHistory(function(prev) {
      var truncated = prev.slice(0, historyIndex + 1);
      truncated.push(entry);
      if (truncated.length > 20) truncated.shift();
      return truncated;
    });
    setHistoryIndex(function(i) { return Math.min(i + 1, 19); });
  }, [brand, historyIndex]);

  var undo = useCallback(function() {
    if (historyIndex <= 0) return;
    setHistoryIndex(function(i) { return i - 1; });
  }, [historyIndex]);

  var redo = useCallback(function() {
    if (historyIndex >= history.length - 1) return;
    setHistoryIndex(function(i) { return i + 1; });
  }, [historyIndex, history]);

  var restoreFromHistory = useCallback(async function(idx) {
    var entry = history[idx];
    if (!entry) return;
    await onSave(entry);
    setHistoryIndex(idx);
    if (toast) toast('Versao restaurada.', 'success');
  }, [history, onSave, toast]);

  var savePlanOverride = useCallback(async function(planId, overrideData) {
    var updated = applyPlanOverride(brand, planId, overrideData);
    await onSave(updated);
  }, [brand, onSave]);

  var saveCompletePreset = useCallback(function(name, description, category, tags) {
    var fullConfig = JSON.parse(JSON.stringify(brandConfig));
    var result = savePreset(name, description, category, fullConfig, tags);
    if (toast) toast('Preset "' + name + '" salvo com sucesso!', 'success');
    return result;
  }, [brandConfig, toast]);

  var applyFullPreset = useCallback(async function(presetId) {
    var preset = getPreset(presetId);
    if (!preset) { if (toast) toast('Preset nao encontrado.', 'error'); return; }
    var cfg = typeof preset.config === 'string' ? JSON.parse(preset.config) : preset.config;
    saveToHistory(brand);
    var updated = Object.assign({}, brand, { brand_config: JSON.stringify(cfg) });
    await onSave(updated);
    if (toast) toast('Preset aplicado com sucesso!', 'success');
  }, [brand, onSave, toast, saveToHistory]);

  var parseAndValidate = useCallback(function(jsonStr) {
    var result = processResponse(jsonStr, brand);
    if (result.success) {
      setProposed(result);
    }
    return result;
  }, [brand]);

  var approveProposed = useCallback(async function() {
    if (!proposed || !proposed.success || !proposed.proposedBrand) return;
    saveToHistory(brand);
    await onSave(proposed.proposedBrand);
    setProposed(null);
    if (toast) toast('Alteracoes aprovadas e aplicadas!', 'success');
  }, [proposed, brand, onSave, toast, saveToHistory]);

  var rejectProposed = useCallback(function() {
    setProposed(null);
  }, []);

  var setBrandGlobalField = useCallback(function(key, value) {
    setBrandGlobalState(function(prev) { var o = Object.assign({}, prev); o[key] = value; return o; });
  }, []);

  var saveBrandGlobal = useCallback(async function() {
    saveToHistory(brand);
    var updated = Object.assign({}, brand, {
      logo_url: brandGlobal.logo_url || null,
      favicon_url: brandGlobal.favicon_url || null,
      name: brandGlobal.name || brand.name,
      short_name: brandGlobal.short_name || null,
      app_title: brandGlobal.app_title || null,
      login_logo_url: brandGlobal.login_logo_url || null,
      login_bg: brandGlobal.login_bg || null,
      login_text: brandGlobal.login_text || null,
      secondary_logo_url: brandGlobal.secondary_logo_url || null,
      secondary_logo_position: brandGlobal.secondary_logo_position || 'right',
      secondary_logo_size: brandGlobal.secondary_logo_size || 40,
    });
    await onSave(updated);
    if (toast) toast('Identidade global salva!', 'success');
  }, [brand, brandGlobal, onSave, toast, saveToHistory]);

  var copyPrompt = useCallback(function() {
    var context = [];
    context.push('App: ' + (brand.name || 'Financia'));
    context.push('Cor primaria: ' + (brand.color || '#002f59'));
    if (brand.brand_config) context.push('Configuracao: personalizada');
    var prompt = generatePrompt({ context: context.join('\n'), limitations: '- Tamanho maximo do JSON: 50KB\n- Cores: formato hexadecimal (#RRGGBB)\n- Fontes: web-safe ou Google Fonts\n- Assets: max 512KB por arquivo', extended: true });
    navigator.clipboard.writeText(prompt).then(function() {
      if (toast) toast('Documentacao copiada para a area de transferencia!', 'success');
    }).catch(function() {
      if (toast) toast('Nao foi possivel copiar automaticamente.', 'warning');
    });
  }, [brand, toast]);

  var copyCurrentJSON = useCallback(function() {
    var json = brand && brand.brand_config ? (typeof brand.brand_config === 'string' ? brand.brand_config : JSON.stringify(brand.brand_config, null, 2)) : JSON.stringify(brandConfig, null, 2);
    navigator.clipboard.writeText(json).then(function() {
      if (toast) toast('JSON atual copiado para a area de transferencia!', 'success');
    }).catch(function() {
      if (toast) toast('Nao foi possivel copiar automaticamente.', 'warning');
    });
  }, [brand, brandConfig, toast]);

  var handleDeletePreset = useCallback(function(id) {
    var ok = deletePreset(id);
    if (ok && toast) toast('Preset removido.', 'success');
    return ok;
  }, [toast]);

  var handleDuplicatePreset = useCallback(function(id) {
    return duplicatePreset(id);
  }, []);

  var handleToggleFavorite = useCallback(function(id) {
    return toggleFavoritePreset(id);
  }, []);

  var handleExportPreset = useCallback(function(id) {
    var data = exportPreset(id);
    if (!data) { if (toast) toast('Erro ao exportar preset.', 'error'); return; }
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'preset_' + id + '.json'; a.click();
    URL.revokeObjectURL(url);
  }, [toast]);

  var handleImportPreset = useCallback(function(jsonStr) {
    var p = importPreset(jsonStr);
    if (!p) { if (toast) toast('JSON de preset invalido.', 'error'); return null; }
    if (toast) toast('Preset importado: ' + p.name, 'success');
    return p;
  }, [toast]);

  return {
    brandConfig: brandConfig,
    allPresets: allPresets,
    presetCats: presetCats,
    history: history,
    historyIndex: historyIndex,
    undo: undo,
    redo: redo,
    restoreFromHistory: restoreFromHistory,
    saveToHistory: saveToHistory,
    proposed: proposed,
    parseAndValidate: parseAndValidate,
    approveProposed: approveProposed,
    rejectProposed: rejectProposed,
    setProposed: setProposed,
    savePlanOverride: savePlanOverride,
    saveCompletePreset: saveCompletePreset,
    applyFullPreset: applyFullPreset,
    applyPreset: applyFullPreset,
    deletePreset: handleDeletePreset,
    duplicatePreset: handleDuplicatePreset,
    toggleFavorite: handleToggleFavorite,
    exportPreset: handleExportPreset,
    importPreset: handleImportPreset,
    copyPrompt: copyPrompt,
    copyCurrentJSON: copyCurrentJSON,
    brandGlobal: brandGlobal,
    setBrandGlobalField: setBrandGlobalField,
    saveBrandGlobal: saveBrandGlobal,
  };
}
