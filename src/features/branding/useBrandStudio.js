import { useState, useCallback, useMemo, useEffect } from 'react';
import processResponse from './responseProcessor.js';
import { listPresets, getPreset, savePreset, deletePreset, duplicatePreset, toggleFavoritePreset, getPresetCategories, loadPresetsFromDb, setOnChange } from './presets.js';
import { applyPlanOverride } from './planThemes.js';
import { enterPreviewMode, exitPreviewMode } from '../../shared/hooks/useBrandAppearance.js';

export default function useBrandStudio(brand, planInfo, onSave, toast) {
  const brandConfig = useMemo(function() {
    const bc = brand && brand.brand_config;
    if (typeof bc === 'string') { try { return JSON.parse(bc); } catch (_) { return { modules: {} }; } }
    return bc || { modules: {} };
  }, [brand]);

  const [allPresets, setAllPresets] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [proposed, setProposed] = useState(null);
  const [brandGlobal, setBrandGlobalState] = useState(function() {
    const b = brand || {};
    return {
      logo_url: b.logo_url || '', favicon_url: b.favicon_url || '',
      name: b.name || '', short_name: b.short_name || '', app_title: b.app_title || '',
      login_logo_url: b.login_logo_url || '', login_bg: b.login_bg || '', login_text: b.login_text || '',
      secondary_logo_url: b.secondary_logo_url || '',
      secondary_logo_position: b.secondary_logo_position || 'right',
      secondary_logo_size: b.secondary_logo_size || 40,
    };
  });

  useEffect(function() {
    loadPresetsFromDb().then(function() { setAllPresets(listPresets()); });
    setOnChange(function() { setAllPresets(listPresets()); });
    return function() { setOnChange(null); };
  }, []);

  useEffect(function() {
    if (historyIndex >= 0 && history[historyIndex]) enterPreviewMode(history[historyIndex]);
    return function() { exitPreviewMode(); };
  }, [historyIndex, history]);

  const presetCats = useMemo(function() { return getPresetCategories(); }, []);

  const saveToHistory = useCallback(function(b) {
    const entry = JSON.parse(JSON.stringify(b || brand));
    setHistory(function(prev) {
      const truncated = prev.slice(0, historyIndex + 1);
      truncated.push(entry);
      if (truncated.length > 20) truncated.shift();
      return truncated;
    });
    setHistoryIndex(function(i) { return Math.min(i + 1, 19); });
  }, [brand, historyIndex]);

  const undo = useCallback(function() {
    if (historyIndex > 0) setHistoryIndex(function(i) { return i - 1; });
  }, [historyIndex]);

  const redo = useCallback(function() {
    if (historyIndex < history.length - 1) setHistoryIndex(function(i) { return i + 1; });
  }, [historyIndex, history]);

  const restoreFromHistory = useCallback(async function(idx) {
    const entry = history[idx];
    if (!entry) return;
    await onSave(entry);
    setHistoryIndex(idx);
    if (toast) toast('Versao restaurada.', 'success');
  }, [history, onSave, toast]);

  const savePlanOverride = useCallback(async function(planId, overrideData) {
    await onSave(applyPlanOverride(brand, planId, overrideData));
  }, [brand, onSave]);

  const savePlanLogo = useCallback(async function(planId, logoColors) {
    let cfg;
    try { cfg = typeof brand.brand_config === 'string' ? JSON.parse(brand.brand_config) : (brand.brand_config || { modules: {} }); } catch (_) { cfg = { modules: {} }; }
    if (!cfg.planOverrides) cfg.planOverrides = {};
    const existing = cfg.planOverrides[planId] || {};
    if (logoColors) {
      cfg.planOverrides[planId] = Object.assign({}, existing, { logoColors: logoColors });
    } else {
      delete existing.logoColors;
      if (Object.keys(existing).length > 0) { cfg.planOverrides[planId] = existing; } else { delete cfg.planOverrides[planId]; }
    }
    saveToHistory(brand);
    const updated = Object.assign({}, brand, { brand_config: JSON.stringify(cfg) });
    await onSave(updated);
    if (toast) toast(logoColors ? 'Logo personalizada salva para ' + planId + '!' : 'Plano ' + planId + ' agora usa a logo global.', 'success');
  }, [brand, onSave, toast, saveToHistory]);

  const saveCompletePreset = useCallback(function(name, description, category, tags) {
    const result = savePreset(name, description, category, JSON.parse(JSON.stringify(brandConfig)), tags);
    if (toast) toast('Preset "' + name + '" salvo com sucesso!', 'success');
    return result;
  }, [brandConfig, toast]);

  const applyFullPreset = useCallback(async function(presetId) {
    const preset = getPreset(presetId);
    if (!preset) { if (toast) toast('Preset nao encontrado.', 'error'); return; }
    const cfg = typeof preset.config === 'string' ? JSON.parse(preset.config) : preset.config;
    saveToHistory(brand);
    await onSave(Object.assign({}, brand, { brand_config: JSON.stringify(cfg) }));
    if (toast) toast('Preset aplicado com sucesso!', 'success');
  }, [brand, onSave, toast, saveToHistory]);

  const parseAndValidate = useCallback(function(jsonStr) {
    const result = processResponse(jsonStr, brand);
    if (result.success) setProposed(result);
    return result;
  }, [brand]);

  const approveProposed = useCallback(async function() {
    if (!proposed || !proposed.success || !proposed.proposedBrand) return;
    saveToHistory(brand);
    await onSave(proposed.proposedBrand);
    setProposed(null);
    if (toast) toast('Alteracoes aprovadas e aplicadas!', 'success');
  }, [proposed, brand, onSave, toast, saveToHistory]);

  const rejectProposed = useCallback(function() { setProposed(null); }, []);

  const setBrandGlobalField = useCallback(function(key, value) {
    setBrandGlobalState(function(prev) { const o = Object.assign({}, prev); o[key] = value; return o; });
  }, []);

  const saveBrandGlobal = useCallback(async function() {
    saveToHistory(brand);
    const updated = Object.assign({}, brand, {
      logo_url: brandGlobal.logo_url || null, favicon_url: brandGlobal.favicon_url || null,
      name: brandGlobal.name || brand.name, short_name: brandGlobal.short_name || null,
      app_title: brandGlobal.app_title || null, login_logo_url: brandGlobal.login_logo_url || null,
      login_bg: brandGlobal.login_bg || null, login_text: brandGlobal.login_text || null,
      secondary_logo_url: brandGlobal.secondary_logo_url || null,
      secondary_logo_position: brandGlobal.secondary_logo_position || 'right',
      secondary_logo_size: brandGlobal.secondary_logo_size || 40,
    });
    await onSave(updated);
    if (toast) toast('Identidade global salva!', 'success');
  }, [brand, brandGlobal, onSave, toast, saveToHistory]);

  const handleDeletePreset = useCallback(function(id) {
    const ok = deletePreset(id);
    if (ok && toast) toast('Preset removido.', 'success');
    return ok;
  }, [toast]);

  const handleDuplicatePreset = useCallback(function(id) { return duplicatePreset(id); }, []);
  const handleToggleFavorite = useCallback(function(id) { return toggleFavoritePreset(id); }, []);

  return {
    brandConfig, allPresets, presetCats, history, historyIndex,
    undo, redo, restoreFromHistory, saveToHistory,
    proposed, parseAndValidate, approveProposed, rejectProposed, setProposed,
    savePlanOverride, savePlanLogo, saveCompletePreset,
    applyFullPreset, applyPreset: applyFullPreset,
    deletePreset: handleDeletePreset, duplicatePreset: handleDuplicatePreset, toggleFavorite: handleToggleFavorite,
    brandGlobal, setBrandGlobalField, saveBrandGlobal,
  };
}
