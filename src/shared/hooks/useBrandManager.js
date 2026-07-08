import { sb } from '../../lib/supabase.js';
import { ldb } from '../../lib/dexie.js';
import { now } from '../../lib/utils.js';
import { planVisualDefaults } from '../../lib/constants.js';

export function useBrandManager(props) {
  var { session, toast, setBrand } = props;

  var saveBrand = async function(nb) {
    var userId = session.user.id;
    var existing = null;
    try { existing = await ldb.profiles.get(userId); } catch (e0) { void e0; }
    // white_label do objeto recebido (fonte mais recente) OU do Dexie local
    var hasWhiteLabel = !!(nb && nb.white_label) || !!(existing && existing.white_label);
    var visual = hasWhiteLabel ? null : planVisualDefaults({
      plan: existing && existing.plan ? existing.plan : 'free',
      plan_expires_at: existing && existing.plan_expires_at ? existing.plan_expires_at : null,
    });
    var finalColor = hasWhiteLabel ? nb.color : visual.color;
    var finalSecondary = hasWhiteLabel ? (nb.color_secondary || null) : visual.color_secondary;
    var finalAccent = hasWhiteLabel ? (nb.color_accent || null) : visual.color_accent;
    var finalTheme = hasWhiteLabel ? (nb.theme || 'light') : visual.theme;
    if (!/^#[0-9a-fA-F]{6}$/.test(finalColor)) finalColor = '#002f59';
    if (finalSecondary && !/^#[0-9a-fA-F]{6}$/.test(finalSecondary)) finalSecondary = null;
    if (finalAccent && !/^#[0-9a-fA-F]{6}$/.test(finalAccent)) finalAccent = null;
    var brandConfig = nb.brand_config || (existing && existing.brand_config) || null;
    var row = Object.assign({}, existing || {}, {
      user_id:userId,
      name:nb.name,
      logo:nb.logo,
      color:finalColor,
      color_secondary:finalSecondary,
      color_accent:finalAccent,
      theme:finalTheme,
      niche:nb.niche||(existing&&existing.niche)||'',
      white_label:hasWhiteLabel,
      visual_version:((existing&&existing.visual_version)||0)+1,
      custom_palette:true,
      logo_url:nb.logo_url||null,
      brand_config:brandConfig,
      updated_at:now(),
      _synced:0,
      _updated_at:now(),
    });
    try { await ldb.profiles.put(row); }
    catch(e) { toast('Erro ao salvar configurações: ' + (e.message || 'tente novamente'), 'error'); return; }
    setBrand(Object.assign({}, nb, {
      color: finalColor,
      color_secondary: finalSecondary,
      color_accent: finalAccent,
      theme: finalTheme,
      niche:nb.niche||'',
      white_label:hasWhiteLabel,
      visual_version:((existing&&existing.visual_version)||0)+1,
      custom_palette:hasWhiteLabel,
      brand_config:brandConfig,
    }));
    toast('Configurações salvas', 'success');
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({type:'UPDATE_BRAND', name:nb.name, logo_url:nb.logo_url||null, color:nb.color||'#002f59'});
    }
    if (navigator.onLine) {
      try {
        var res = await sb.from('company_profiles').upsert({user_id:userId, name:nb.name, logo:nb.logo, color:finalColor, color_secondary:finalSecondary, color_accent:finalAccent, theme:finalTheme, logo_url:nb.logo_url||null, white_label:hasWhiteLabel, phone:nb.phone||(existing&&existing.phone)||null, niche:nb.niche||null, visual_version:((existing&&existing.visual_version)||0)+1, custom_palette:hasWhiteLabel, updated_at:now()});
        if (!res.error) await ldb.profiles.update(userId, {_synced:1});
        else toast('Não sincronizado — tentaremos em breve', 'warning');
      } catch(_e) { toast('Não sincronizado — tentaremos em breve', 'warning'); }
    }
  };

  var savePhone = async function(newPhone) {
    var userId = session.user.id;
    var clean = (newPhone || '').replace(/\D/g, '');
    try {
      var existing = await ldb.profiles.get(userId);
      if (existing) await ldb.profiles.update(userId, {phone:clean, _synced:0, _updated_at:now()});
    } catch(e) { void e; }
    setBrand(function(b) { return Object.assign({}, b, {phone:clean}); });
    if (navigator.onLine) {
      try {
        var res = await sb.from('company_profiles').update({phone:clean}).eq('user_id', userId);
        if (!res.error) { await ldb.profiles.update(userId, {_synced:1}); toast('Telefone atualizado', 'success'); }
        else toast('Não sincronizado — tentaremos em breve', 'warning');
      } catch(e) { void e; toast('Não sincronizado — tentaremos em breve', 'warning'); }
    } else {
      toast('Telefone salvo — sincroniza quando online', 'success');
    }
    return true;
  };

  return { saveBrand, savePhone };
}
