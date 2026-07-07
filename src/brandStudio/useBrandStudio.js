import { useState, useCallback, useMemo, useEffect } from 'react';
import generatePrompt from './promptGenerator.js';
import { listPresets, getPreset, savePreset, deletePreset, duplicatePreset, toggleFavoritePreset, exportPreset, importPreset, getPresetCategories, loadPresetsFromDb, setOnChange } from './presets.js';
import { applyPlanOverride } from './planThemes.js';

export default function useBrandStudio(brand, planInfo, onSave, toast) {
  var brandConfig = useMemo(function() {
    var bc = brand && brand.brand_config;
    return bc ? (typeof bc === 'string' ? JSON.parse(bc) : bc) : { modules: {} };
  }, [brand]);

  var [allPresets, setAllPresets] = useState([]);

  useEffect(function() {
    loadPresetsFromDb().then(function() { setAllPresets(listPresets()); });
    setOnChange(function() { setAllPresets(listPresets()); });
    return function() { setOnChange(null); };
  }, []);

  var presetCats = useMemo(function() { return getPresetCategories(); }, [allPresets]);

  var savePlanOverride = useCallback(async function(planId, overrideData) {
    var updated = applyPlanOverride(brand, planId, overrideData);
    await onSave(updated);
  }, [brand, onSave]);

  var saveCurrentPreset = useCallback(function(name, description, category, tags) {
    var result = savePreset(name, description, category, brandConfig, tags);
    if (toast) toast('Preset "' + name + '" salvo com sucesso!', 'success');
    return result;
  }, [brandConfig, toast]);

  var applyPreset = useCallback(function(presetId) {
    var preset = getPreset(presetId);
    if (!preset) { if (toast) toast('Preset nao encontrado.', 'error'); return; }
    var cfg = typeof preset.config === 'string' ? JSON.parse(preset.config) : preset.config;
    var mods = cfg.modules || {};
    var pal = mods.palette || {};
    var overrideData = {
      logo_url: cfg.logo_url || '',
      modules: { palette: { primary: pal.primary, secondary: pal.secondary, accent: pal.accent } },
    };
    savePlanOverride('free', overrideData).then(function() {
      if (toast) toast('Preset aplicado como configuracao padrao.', 'success');
    });
  }, [savePlanOverride, toast]);

  var copyPrompt = useCallback(function() {
    var context = [];
    context.push('App: ' + (brand.name || 'Financia'));
    context.push('Cor primaria: ' + (brand.color || '#002f59'));
    if (brand.brand_config) context.push('Configuracao: personalizada');

    var prompt = generatePrompt({
      context: context.join('\n'),
      limitations: '- Tamanho maximo do JSON: 50KB\n- Cores: formato hexadecimal (#RRGGBB)\n- Fontes: web-safe ou Google Fonts\n- Assets: max 512KB por arquivo',
      extended: true,
    });
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
    savePlanOverride: savePlanOverride,
    saveCurrentPreset: saveCurrentPreset,
    applyPreset: applyPreset,
    deletePreset: handleDeletePreset,
    duplicatePreset: handleDuplicatePreset,
    toggleFavorite: handleToggleFavorite,
    exportPreset: handleExportPreset,
    importPreset: handleImportPreset,
    copyPrompt: copyPrompt,
    copyCurrentJSON: copyCurrentJSON,
  };
}
