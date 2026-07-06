import { useEffect, useRef, useCallback } from 'react';
import { sb } from '../lib/supabase.js';
import { ldb, syncAll, toLocal, setLastSync } from '../lib/db.js';
import { now } from '../lib/utils.js';
import { INIT_BRAND, INIT_PLAN } from '../lib/constants.js';
import { useAuthBootstrap } from './useAuthBootstrap.js';
import { useDataLoader } from './useDataLoader.js';
import { useSyncLoop } from './useSyncLoop.js';
import { useRealtime } from './useRealtime.js';
import { useBrandManager } from './useBrandManager.js';
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

  var onSessionEnd = function() {
    ++loadingRef.current;
    p.setDataLoading(false);
    uidRef.current = null;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (retryRef.current) clearTimeout(retryRef.current);
    if (channelRef.current) { sb.removeChannel(channelRef.current); channelRef.current = null; }
    p.setTx([]); p.setProducts([]); p.setLosses([]);
    p.setBrand(INIT_BRAND); p.setPlanInfo(INIT_PLAN);
    p.setIsAdminDB(false); sessionStorage.removeItem('is_admin');
  };

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
    uidRef.current = userId;
    p.setDataError(null);
    var localDone = false;
    var loadTimeout = setTimeout(function() {
      if (!localDone && loadingRef.current === token) p.setDataLoading(true);
    }, 150);
    try {
      await loadFromLocal(userId);
      localDone = true;
      clearTimeout(loadTimeout);
      if (loadingRef.current !== token) return;
      p.setDataLoading(false);
      if (reconnectRef.current) reconnectRef.current(userId);
      if (navigator.onLine) {
        p.setSyncStatus('syncing');
        var res = await Promise.all([syncAll(userId), fetchRole(userId)]);
        if (loadingRef.current !== token) return;
        var ok = res[0], admin = res[1];
        p.setIsAdminDB(admin);
        if (!admin) sessionStorage.removeItem('is_admin');
        if (ok) {
          await loadFromLocal(userId);
          if (loadingRef.current !== token) return;
          p.setSyncStatus('ok');
          setTimeout(function() { p.setSyncStatus('idle'); }, 3000);
        } else {
          p.setSyncStatus('error');
          setTimeout(function() { p.setSyncStatus('idle'); }, 5000);
        }
      }
    } catch(e) {
      localDone = true;
      clearTimeout(loadTimeout);
      if (loadingRef.current !== token) return;
      p.setDataLoading(false);
      p.setSyncStatus('error');
      setTimeout(function() { p.setSyncStatus('idle'); }, 5000);
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
            p.setBrand({name:prof.name, logo:prof.logo, color:prof.color, color_secondary:prof.color_secondary||null, color_accent:prof.color_accent||null, theme:prof.theme||'light', logo_url:prof.logo_url||null, phone:prof.phone||'', white_label:!!prof.white_label, niche:prof.niche||''});
            p.setPlanInfo({
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
            p.setProducts(pdr.data);
            await ldb.products.bulkPut(pdr.data.map(function(r) { return toLocal(r, {user_id:userId}); }));
          }
          if (txr.data) {
            var mappedTx = txr.data.map(function(t) { return Object.assign({}, t, {desc:t.description, cat:t.category}); });
            p.setTx(mappedTx);
            await ldb.transactions.bulkPut(txr.data.map(function(r) { return toLocal(r, {user_id:userId, desc:r.description, cat:r.category}); }));
          }
          if (lr.data) {
            var mappedL = lr.data.map(function(l) { return Object.assign({}, l, {desc:l.description}); });
            p.setLosses(mappedL);
            await ldb.losses.bulkPut(lr.data.map(function(r) { return toLocal(r, {user_id:userId, desc:r.description}); }));
          }
          var roleData = roleRes && roleRes.data ? roleRes.data : null;
          p.setIsAdminDB(roleData && roleData.role === 'admin');
          await setLastSync(now(), userId);
        } catch(e2) { p.setDataError('Erro ao carregar dados.'); }
      } else {
        p.setDataError('Sem conexão e sem dados locais. Conecte-se pelo menos uma vez.');
      }
    } finally {
      clearTimeout(loadTimeout);
      if (loadingRef.current === token) p.setDataLoading(false);
    }
  }, [loadFromLocal, fetchRole]);

  return {saveBrand, savePhone, loadData};
}
