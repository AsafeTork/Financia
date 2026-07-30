import { useEffect as _useEffect, useRef, useCallback } from 'react';
import { sb } from '../../lib/supabase.js';
import { ldb, toLocal, setLastSync } from '../../lib/dexie.js';
import { syncAll } from '../../lib/sync.js';
import { now } from '../../lib/utils.js';
import { INIT_BRAND, INIT_PLAN } from '../../lib/constants.js';
import { useAuthBootstrap } from './useAuthBootstrap.js';
import { useDataLoader } from '../../shared/hooks/useDataLoader.js';
import { useSyncLoop } from '../../shared/hooks/useSyncLoop.js';
import { useRealtime } from '../../shared/hooks/useRealtime.js';
import { useBrandManager } from '../../shared/hooks/useBrandManager.js';
import { useImpersonation } from './useImpersonation.js';

var TX_FIELDS = ['id','type','description','amount','date','method','category','items','user_id','registered_by','updated_at'];
var PRD_FIELDS = ['id','name','category','price','cost','stock','user_id','registered_by','updated_at'];
var LSS_FIELDS = ['id','description','qty','reason','date','user_id','registered_by','updated_at'];

async function paginatedFetch(table, fields, orderBy, opts) {
  var all = [];
  var ascending = opts && opts.ascending || false;
  var query = sb.from(table).select(fields.join(',')).order(orderBy, {ascending: ascending});
  var batch = await query.limit(500);
  var rows = batch.data || [];
  all = all.concat(rows);
  while (rows.length === 500) {
    var lastVal = rows[rows.length - 1][orderBy];
    query = sb.from(table).select(fields.join(',')).order(orderBy, {ascending: ascending});
    if (ascending) query = query.gt(orderBy, lastVal);
    else query = query.lt(orderBy, lastVal);
    batch = await query.limit(500);
    rows = batch.data || [];
    all = all.concat(rows);
  }
  return all;
}

export function useSession(p) {
  var uidRef        = useRef(null);
  var loadingRef    = useRef(0);
  var channelRef    = useRef(null);
  var syncingRef    = useRef(false);
  var debounceRef   = useRef(null);
  var retryRef      = useRef(null);
  var retryDelayRef = useRef(1000);
  var lastSyncEndRef = useRef(0);

  var dataLoader = useDataLoader(p);
  var { loadFromLocal, fetchRole } = dataLoader;

  var reconnectRef = useRef(null);
  var syncCtx = { uidRef, syncingRef, loadFromLocal, reconnectRef, lastSyncEndRef };
  var { runSync } = useSyncLoop(p, syncCtx);

  var rtCtx = { uidRef, channelRef, debounceRef, retryRef, retryDelayRef, runSync, reconnectRef, syncingRef, lastSyncEndRef };
  useRealtime({ setPlanInfo: p.setPlanInfo }, rtCtx);

  var setDataLoading = p.setDataLoading;
  var setDataError = p.setDataError;
  var setSyncStatus = p.setSyncStatus;
  var setIsAdminDB = p.setIsAdminDB;
  var setBrand = p.setBrand;
  var setPlanInfo = p.setPlanInfo;
  var setProducts = p.setProducts;
  var setTx = p.setTx;
  var setLosses = p.setLosses;

  var onSessionEnd = useCallback(function() {
    ++loadingRef.current;
    setDataLoading(false);
    uidRef.current = null;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (retryRef.current) clearTimeout(retryRef.current);
    if (channelRef.current) { sb.removeChannel(channelRef.current); channelRef.current = null; }
    setTx([]); setProducts([]); setLosses([]);
    setBrand(INIT_BRAND); setPlanInfo(INIT_PLAN);
    setIsAdminDB(false); sessionStorage.removeItem('is_admin');
  }, [setDataLoading, setTx, setProducts, setLosses, setBrand, setPlanInfo, setIsAdminDB]);

  var authProps = {
    setSession: p.setSession, setAppLoading: p.setAppLoading, toast: p.toast,
    uidRef, loadingRef, channelRef, debounceRef, retryRef,
    loadData: function(userId) { loadData(userId); },
    loadFromLocal: loadFromLocal,
    onSessionEnd: onSessionEnd,
  };
  useAuthBootstrap(authProps);

  useImpersonation(p);

  var { saveBrand, savePhone } = useBrandManager(p);

  var loadData = useCallback(async function(userId) {
    var token = ++loadingRef.current;
    var syncStatusToken = {};
    uidRef.current = userId;
    setDataError(null);
    var localDone = false;
    var loadTimeout = setTimeout(function() {
      if (!localDone && loadingRef.current === token) setDataLoading(true);
    }, 150);
    try {
      await loadFromLocal(userId);
      localDone = true;
      clearTimeout(loadTimeout);
      if (loadingRef.current !== token) return;
      setDataLoading(false);
      if (typeof reconnectRef.current === 'function') reconnectRef.current(userId);
      if (navigator.onLine) {
        setSyncStatus('syncing');
        var res = await Promise.all([syncAll(userId), fetchRole(userId)]);
        if (loadingRef.current !== token) return;
        var syncResult = res[0], admin = res[1];
        var ok = syncResult.ok !== false;
        var changed = syncResult.changed === true;
        setIsAdminDB(admin);
        if (!admin) sessionStorage.removeItem('is_admin');
        if (ok) {
          if (changed) await loadFromLocal(userId);
          if (loadingRef.current !== token) return;
          setSyncStatus('ok');
          var st1 = {};
          syncStatusToken = st1;
          setTimeout(function() { if (syncStatusToken === st1) setSyncStatus('idle'); }, 3000);
        } else {
          setSyncStatus('error');
          var st2 = {};
          syncStatusToken = st2;
          setTimeout(function() { if (syncStatusToken === st2) setSyncStatus('idle'); }, 5000);
        }
      }
    } catch {
      localDone = true;
      clearTimeout(loadTimeout);
      if (loadingRef.current !== token) return;
      setDataLoading(false);
      setSyncStatus('error');
      var st3 = {};
      syncStatusToken = st3;
      setTimeout(function() { if (syncStatusToken === st3) setSyncStatus('idle'); }, 5000);
      if (navigator.onLine) {
        try {
          var PROFILE_READ = 'user_id,name,logo,color,color_secondary,color_accent,theme,logo_url,white_label,phone,niche,custom_palette,visual_version,brand_config,plan,plan_expires_at,plan_activated_by,custom_price_cents,custom_price_cents_pro,custom_price_cents_premium';
          var allRes = await Promise.all([
            sb.from('company_profiles').select(PROFILE_READ).eq('user_id', userId).maybeSingle(),
            paginatedFetch('products', PRD_FIELDS, 'created_at', {ascending:true}),
            paginatedFetch('transactions', TX_FIELDS, 'date', {ascending:false}),
            paginatedFetch('losses', LSS_FIELDS, 'date', {ascending:false}),
            sb.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
          ]);
          var pr = allRes[0], pdr = allRes[1], txr = allRes[2], lr = allRes[3], roleRes = allRes[4];

          var prof = pr && pr.data ? pr.data : null;
          var prodRows = pdr || [];
          var txRows = txr || [];
          var lossRows = lr || [];

          if (prof) await ldb.profiles.put(toLocal(prof));
          if (prodRows.length > 0) await ldb.products.bulkPut(prodRows.map(function(r) { return toLocal(r, {user_id:userId}); }));
          if (txRows.length > 0) await ldb.transactions.bulkPut(txRows.map(function(r) { return toLocal(r, {user_id:userId, desc:r.description, cat:r.category}); }));
          if (lossRows.length > 0) await ldb.losses.bulkPut(lossRows.map(function(r) { return toLocal(r, {user_id:userId, desc:r.description}); }));

          setBrand(function(prev) {
            if (!prof) return prev;
            var next = {name:prof.name, logo:prof.logo, color:prof.color, color_secondary:prof.color_secondary||null, color_accent:prof.color_accent||null, theme:prof.theme||'light', logo_url:prof.logo_url||null, phone:prof.phone||'', white_label:!!prof.white_label, niche:prof.niche||'', visual_version:prof.visual_version||0, custom_palette:!!prof.custom_palette, brand_config:prof.brand_config||null};
            if (prev && prev.name===next.name && prev.logo===next.logo && prev.color===next.color && prev.color_secondary===next.color_secondary && prev.color_accent===next.color_accent && prev.theme===next.theme && prev.logo_url===next.logo_url && prev.phone===next.phone && prev.white_label===next.white_label && prev.niche===next.niche && prev.visual_version===next.visual_version && prev.custom_palette===next.custom_palette && JSON.stringify(prev.brand_config)===JSON.stringify(next.brand_config)) return prev;
            return next;
          });
          setPlanInfo(function(prev) {
            if (!prof) return prev;
            var next = { plan:prof.plan||'free', plan_expires_at:prof.plan_expires_at||null, plan_activated_by:prof.plan_activated_by||null, custom_price_cents:prof.custom_price_cents||0, custom_price_cents_pro:prof.custom_price_cents_pro||0, custom_price_cents_premium:prof.custom_price_cents_premium||0 };
            if (prev && prev.plan===next.plan && prev.plan_expires_at===next.plan_expires_at && prev.plan_activated_by===next.plan_activated_by && prev.custom_price_cents===next.custom_price_cents && prev.custom_price_cents_pro===next.custom_price_cents_pro && prev.custom_price_cents_premium===next.custom_price_cents_premium) return prev;
            return next;
          });
          setProducts(function(prev) {
            if (prodRows.length === 0) return prev;
            if (prev.length === prodRows.length) return prev;
            return prodRows;
          });
          setTx(function(prev) {
            if (txRows.length === 0) return prev;
            var mapped = txRows.map(function(t) { return Object.assign({}, t, {desc:t.description, cat:t.category}); });
            return mapped;
          });
          setLosses(function(prev) {
            if (lossRows.length === 0) return prev;
            var mapped = lossRows.map(function(l) { return Object.assign({}, l, {desc:l.description}); });
            return mapped;
          });
          setIsAdminDB(roleRes && roleRes.data && roleRes.data.role === 'admin');
          await setLastSync(now(), userId);
        } catch { setDataError('Erro ao carregar dados.'); }
      } else {
        setDataError('Sem conexão e sem dados locais. Conecte-se pelo menos uma vez.');
      }
    } finally {
      clearTimeout(loadTimeout);
      if (loadingRef.current === token) setDataLoading(false);
    }
  }, [loadFromLocal, fetchRole, setDataError, setDataLoading, setSyncStatus, setIsAdminDB, setBrand, setPlanInfo, setProducts, setTx, setLosses]);

  return {saveBrand, savePhone, loadData};
}
