import { useState, useCallback, useMemo, useEffect } from 'react';
import { processResponse, requiresServiceRole } from './responseProcessor.js';
import { listPresets, getPreset, savePreset, deletePreset, duplicatePreset, toggleFavoritePreset, getPresetCategories, loadPresetsFromDb, setOnChange } from './presets.js';
import { applyPlanOverride } from './planThemes.js';
import { enterPreviewMode, exitPreviewMode } from '../../shared/hooks/useBrandAppearance.js';
import { getDefaults, mergeWithDefaults } from './schemaRegistry.js';

export default function useBrandStudio(brand, planInfo, onSave, toast) {
  const brandConfig = useMemo(() => {
    const bc = brand && brand.brand_config;
    if (typeof bc === 'string') {
      try { return JSON.parse(bc); } catch (e) { console.warn('useBrandStudio: failed to parse brand_config JSON, using defaults:', e); return getDefaults(); }
    }
    return bc ? mergeWithDefaults(bc) : getDefaults();
  }, [brand]);

  const [allPresets, setAllPresets] = useState([]);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [proposed, setProposed] = useState(null);
  const [brandGlobal, setBrandGlobalState] = useState(() => {
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

  useEffect(() => {
    loadPresetsFromDb().then(() => { setAllPresets(listPresets()); });
    setOnChange(() => { setAllPresets(listPresets()); });
    return () => { setOnChange(null); };
  }, []);

  useEffect(() => {
    return () => { exitPreviewMode(); };
  }, []);

  // Fixed: added proper dependencies
  const presetCats = useMemo(() => getPresetCategories(), []);

  const saveToHistory = useCallback((b) => {
    const entry = JSON.parse(JSON.stringify(b || brand));
    setHistory(prev => {
      const truncated = prev.slice(0, historyIndex + 1);
      truncated.push(entry);
      if (truncated.length > 20) truncated.shift();
      return truncated;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 19));
  }, [brand, historyIndex]);

  const undo = useCallback(() => {
    const i = historyIndex - 1;
    if (i < 0) return;
    setHistoryIndex(i);
    if (history[i]) enterPreviewMode(history[i]);
  }, [historyIndex, history]);

  const redo = useCallback(() => {
    const i = historyIndex + 1;
    if (i >= history.length) return;
    setHistoryIndex(i);
    if (history[i]) enterPreviewMode(history[i]);
  }, [historyIndex, history]);

  const restoreFromHistory = useCallback(async (idx) => {
    const entry = history[idx];
    if (!entry) return;
    await onSave(entry);
    exitPreviewMode();
    setHistoryIndex(idx);
    if (toast) toast('Versao restaurada.', 'success');
  }, [history, onSave, toast]);

  const savePlanOverride = useCallback(async (planId, overrideData) => {
    await onSave(applyPlanOverride(brand, planId, overrideData));
    exitPreviewMode();
  }, [brand, onSave]);

  const savePlanLogo = useCallback(async (planId, logoColors) => {
    let cfg;
    try { cfg = typeof brand.brand_config === 'string' ? JSON.parse(brand.brand_config) : (brand.brand_config || { modules: {} }); } catch (e) { console.warn('useBrandStudio: failed to parse brand_config for plan logo, using empty modules:', e); cfg = { modules: {} }; }
    if (!cfg.planOverrides) cfg.planOverrides = {};
    const existing = cfg.planOverrides[planId] || {};
    if (logoColors) {
      cfg.planOverrides[planId] = { ...existing, logoColors };
    } else {
      delete existing.logoColors;
      if (Object.keys(existing).length > 0) { cfg.planOverrides[planId] = existing; } else { delete cfg.planOverrides[planId]; }
    }
    saveToHistory(brand);
    const updated = { ...brand, brand_config: JSON.stringify(cfg) };
    await onSave(updated);
    exitPreviewMode();
    if (toast) toast(logoColors ? `Logo personalizada salva para ${planId}!` : `Plano ${planId} agora usa a logo global.`, 'success');
  }, [brand, onSave, toast, saveToHistory]);

  const saveCompletePreset = useCallback((name, description, category, tags) => {
    const result = savePreset(name, description, category, JSON.parse(JSON.stringify(brandConfig)), tags);
    if (toast) toast(`Preset "${name}" salvo com sucesso!`, 'success');
    return result;
  }, [brandConfig, toast]);

  const applyFullPreset = useCallback(async (presetId) => {
    const preset = getPreset(presetId);
    if (!preset) { if (toast) toast('Preset nao encontrado.', 'error'); return; }
    const cfg = typeof preset.config === 'string' ? JSON.parse(preset.config) : preset.config;
    saveToHistory(brand);
    await onSave({ ...brand, brand_config: JSON.stringify(cfg) });
    exitPreviewMode();
    if (toast) toast('Preset aplicado com sucesso!', 'success');
  }, [brand, onSave, toast, saveToHistory]);

  const parseAndValidate = useCallback((jsonStr) => {
    const result = processResponse(jsonStr, brand);
    if (result.success) setProposed(result);
    return result;
  }, [brand]);

  const approveProposed = useCallback(async () => {
    if (!proposed || !proposed.success || !proposed.proposedBrand) return;
    saveToHistory(brand);
    await onSave(proposed.proposedBrand);
    exitPreviewMode();
    setProposed(null);
    if (toast) toast('Alteracoes aprovadas e aplicadas!', 'success');
  }, [proposed, brand, onSave, toast, saveToHistory]);

  const rejectProposed = useCallback(() => { setProposed(null); }, []);

  const setBrandGlobalField = useCallback((key, value) => {
    setBrandGlobalState(prev => ({ ...prev, [key]: value }));
  }, []);

  const saveBrandGlobal = useCallback(async () => {
    saveToHistory(brand);
    const updated = {
      ...brand,
      logo_url: brandGlobal.logo_url || null, favicon_url: brandGlobal.favicon_url || null,
      name: brandGlobal.name || brand.name, short_name: brandGlobal.short_name || null,
      app_title: brandGlobal.app_title || null, login_logo_url: brandGlobal.login_logo_url || null,
      login_bg: brandGlobal.login_bg || null, login_text: brandGlobal.login_text || null,
      secondary_logo_url: brandGlobal.secondary_logo_url || null,
      secondary_logo_position: brandGlobal.secondary_logo_position || 'right',
      secondary_logo_size: brandGlobal.secondary_logo_size || 40,
    };
    await onSave(updated);
    exitPreviewMode();
    if (toast) toast('Identidade global salva!', 'success');
  }, [brand, brandGlobal, onSave, toast, saveToHistory]);

  const handleDeletePreset = useCallback((id) => {
    const ok = deletePreset(id);
    if (ok && toast) toast('Preset removido.', 'success');
    return ok;
  }, [toast]);

  const handleDuplicatePreset = useCallback((id) => duplicatePreset(id), []);
  const handleToggleFavorite = useCallback((id) => toggleFavoritePreset(id), []);

  // Add the missing copy functions that BrandStudioView expects
  const copyPrompt = useCallback(() => {
    const doc = brandConfig ? JSON.stringify(brandConfig, null, 2) : '';
    navigator.clipboard.writeText(doc).then(() => {
      if (toast) toast('Documentação copiada!', 'success');
    }).catch(() => {
      if (toast) toast('Não foi possível copiar. Tente manualmente.', 'warning');
    });
  }, [brandConfig, toast]);

  const copyCurrentJSON = useCallback(() => {
    const json = brandConfig ? JSON.stringify(brandConfig, null, 2) : '{}';
    navigator.clipboard.writeText(json).then(() => {
      if (toast) toast('JSON copiado!', 'success');
    }).catch(() => {
      if (toast) toast('Não foi possível copiar. Tente manualmente.', 'warning');
    });
  }, [brandConfig, toast]);

  return {
    brandConfig, allPresets, presetCats, history, historyIndex,
    undo, redo, restoreFromHistory, saveToHistory,
    proposed, parseAndValidate, approveProposed, rejectProposed, setProposed,
    savePlanOverride, savePlanLogo, saveCompletePreset,
    applyFullPreset, applyPreset: applyFullPreset,
    deletePreset: handleDeletePreset, duplicatePreset: handleDuplicatePreset, toggleFavorite: handleToggleFavorite,
    brandGlobal, setBrandGlobalField, saveBrandGlobal,
    requiresServiceRole,
    // Expose copy functions
    copyPrompt, copyCurrentJSON,
  };
}