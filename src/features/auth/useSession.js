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

export function useSession(p) {
  var uidRef        = useRef(null);
  var loadingRef    = useRef(0);
  var channelRef    = useRef(null);
  var syncingRef    = useRef(false);
  var debounceRef   = useRef(null);
  var retryRef      = useRef(null);
  var retryDelayRef = useRef(1000);

  var dataLoader = useDataLoader(p);
  var { loadFromLocal, fetchRole } = dataLoader;

  var reconnectRef = useRef(null);
  var syncCtx = { uidRef, syncingRef, loadFromLocal, reconnectRef };
  var { runSync } = useSyncLoop(p, syncCtx);

  var rtCtx = { uidRef, channelRef, debounceRef, retryRef, retryDelayRef, runSync, reconnectRef };
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
        var ok = res[0], admin = res[1];
        setIsAdminDB(admin);
        if (!admin) sessionStorage.removeItem('is_admin');
        if (ok) {
          await loadFromLocal(userId);
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
          var allRes = await Promise.all([
            sb.from('company_profiles').select('*').eq('user_id', userId).maybeSingle(),
            sb.from('products').select('*').order('created_at').limit(500),
            sb.from('transactions').select('*').order('date', {ascending:false}).limit(500),
            sb.from('losses').select('*').order('date', {ascending:false}).limit(500),
            sb.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
          ]);
          var pr = allRes[0], pdr = allRes[1], txr = allRes[2], lr = allRes[3], roleRes = allRes[4];
          if (pr.data) {
            var prof = pr.data;
            setBrand({name:prof.name, logo:prof.logo, color:prof.color, color_secondary:prof.color_secondary||null, color_accent:prof.color_accent||null, theme:prof.theme||'light', logo_url:prof.logo_url||null, phone:prof.phone||'', white_label:!!prof.white_label, niche:prof.niche||'', visual_version:prof.visual_version||0, custom_palette:!!prof.custom_palette, brand_config:prof.brand_config||null});
            setPlanInfo({
              plan:prof.plan||'free',
              plan_expires_at:prof.plan_expires_at||null,
              plan_activated_by:prof.plan_activated_by||null,
              custom_price_cents:prof.custom_price_cents||0,
              custom_price_cents_pro:prof.custom_price_cents_pro||0,
              custom_price_cents_premium:prof.custom_price_cents_premium||0,
            });
            await ldb.profiles.put(toLocal(prof));
          }
          if (pdr.data) {
            setProducts(pdr.data);
            await ldb.products.bulkPut(pdr.data.map(function(r) { return toLocal(r, {user_id:userId}); }));
          }
          if (txr.data) {
            var mappedTx = txr.data.map(function(t) { return Object.assign({}, t, {desc:t.description, cat:t.category}); });
            setTx(mappedTx);
            await ldb.transactions.bulkPut(txr.data.map(function(r) { return toLocal(r, {user_id:userId, desc:r.description, cat:r.category}); }));
          }
          if (lr.data) {
            var mappedL = lr.data.map(function(l) { return Object.assign({}, l, {desc:l.description}); });
            setLosses(mappedL);
            await ldb.losses.bulkPut(lr.data.map(function(r) { return toLocal(r, {user_id:userId, desc:r.description}); }));
          }
          var roleData = roleRes && roleRes.data ? roleRes.data : null;
          setIsAdminDB(roleData && roleData.role === 'admin');
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
