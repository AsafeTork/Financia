import { useCallback } from 'react';
import { ldb } from '../../lib/dexie.js';
import { getRecurring, periodOf, pendingRecurring } from '../../lib/recurring.js';
import { sb } from '../../lib/supabase.js';

function serializeBrandConfig(bc) {
  if (!bc) return '';
  if (typeof bc === 'string') return bc;
  try { return JSON.stringify(bc); } catch { return ''; }
}

function arraysEqualByKey(prev, next, key) {
  if (prev.length !== next.length) return false;
  for (var i = 0; i < prev.length; i++) {
    if (prev[i][key] !== next[i][key]) return false;
  }
  return true;
}

export function useDataLoader(props) {
  var { setBrand, setPlanInfo, setTx, setProducts, setLosses, setIsAdminDB } = props;

  var loadFromLocal = useCallback(async function(userId) {
    var results = await Promise.all([
      ldb.profiles.get(userId),
      ldb.products.where('[user_id+_deleted+created_at]').between([userId, 0, ''], [userId, 0, '\uffff']).toArray(),
      ldb.transactions.where('[user_id+_deleted+date]').between([userId, 0, ''], [userId, 0, '\uffff']).toArray(),
      ldb.losses.where('[user_id+_deleted+date]').between([userId, 0, ''], [userId, 0, '\uffff']).toArray(),
      ldb.meta.get('role_' + userId).catch(function() { return null; }),
    ]);
    var profile = results[0], prods = results[1], txs = results[2], lss = results[3], roleMeta = results[4];

    var allTx = txs;
    try {
      var rlist = await getRecurring(userId);
      var pend = await pendingRecurring(userId, rlist, periodOf(new Date()));
      if (pend.length > 0) {
        for (var gi = 0; gi < pend.length; gi++) { pend[gi].registered_by = (profile && profile.name) || 'Recorrente'; }
        await ldb.transactions.bulkPut(pend);
        allTx = pend.concat(txs);
      }
    } catch (e) { void e; }

    var mappedTx = allTx.map(function(t) { return Object.assign({}, t, {desc:t.description||t.desc, cat:t.category||t.cat}); });
    var mappedLss = lss.map(function(l) { return Object.assign({}, l, {desc:l.description||l.desc}); });
    var roleVal = roleMeta ? roleMeta.val : null;

    setBrand(function(prev) {
      if (!profile) return prev;
      var next = {name:profile.name, logo:profile.logo, color:profile.color, color_secondary:profile.color_secondary||null, color_accent:profile.color_accent||null, theme:profile.theme||'light', logo_url:profile.logo_url||null, phone:profile.phone||'', white_label:!!profile.white_label, niche:profile.niche||'', visual_version:profile.visual_version||0, custom_palette:!!profile.custom_palette, brand_config:profile.brand_config||null};
      if (prev && prev.name===next.name && prev.logo===next.logo && prev.color===next.color && prev.color_secondary===next.color_secondary && prev.color_accent===next.color_accent && prev.theme===next.theme && prev.logo_url===next.logo_url && prev.phone===next.phone && prev.white_label===next.white_label && prev.niche===next.niche && prev.visual_version===next.visual_version && prev.custom_palette===next.custom_palette && serializeBrandConfig(prev.brand_config)===serializeBrandConfig(next.brand_config)) return prev;
      return next;
    });
    setPlanInfo(function(prev) {
      if (!profile) return prev;
      var next = { plan:profile.plan||'free', plan_expires_at:profile.plan_expires_at||null, plan_activated_by:profile.plan_activated_by||null, custom_price_cents:profile.custom_price_cents||0, custom_price_cents_pro:profile.custom_price_cents_pro||0, custom_price_cents_premium:profile.custom_price_cents_premium||0 };
      if (prev && prev.plan===next.plan && prev.plan_expires_at===next.plan_expires_at && prev.plan_activated_by===next.plan_activated_by && prev.custom_price_cents===next.custom_price_cents && prev.custom_price_cents_pro===next.custom_price_cents_pro && prev.custom_price_cents_premium===next.custom_price_cents_premium) return prev;
      return next;
    });
    setProducts(function(prev) {
      if (prev.length === prods.length && arraysEqualByKey(prev, prods, 'id') && arraysEqualByKey(prev, prods, 'stock')) return prev;
      return prods;
    });
    setTx(function(prev) {
      if (prev.length === mappedTx.length && arraysEqualByKey(prev, mappedTx, 'id') && arraysEqualByKey(prev, mappedTx, 'amount') && arraysEqualByKey(prev, mappedTx, 'date')) return prev;
      return mappedTx;
    });
    setLosses(function(prev) {
      if (prev.length === mappedLss.length && arraysEqualByKey(prev, mappedLss, 'id') && arraysEqualByKey(prev, mappedLss, 'qty')) return prev;
      return mappedLss;
    });
    setIsAdminDB(roleVal === 'admin');
  }, [setBrand, setIsAdminDB, setLosses, setPlanInfo, setProducts, setTx]);

  var fetchRole = useCallback(async function(userId) {
    try {
      var res = await Promise.race([
        sb.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
        new Promise(function(_, r) { setTimeout(function() { r(new Error('timeout')); }, 5000); }),
      ]);
      if (res.data && res.data.role) {
        await ldb.meta.put({key:'role_'+userId, val:res.data.role});
        sessionStorage.setItem('is_admin', res.data.role === 'admin' ? '1' : '0');
      }
      return !!(res.data && res.data.role === 'admin');
    } catch(_) { return false; }
  }, []);

  return { loadFromLocal, fetchRole };
}
