import { useEffect } from 'react';
import { sb } from '../../lib/supabase.js';

export function useImpersonation(props) {
  var { isAdminDB } = props;

  useEffect(function() {
    var params = new URLSearchParams(window.location.search);
    if (!params.get('imp')) return;
    var raw = sessionStorage.getItem('_imp');
    if (!raw) return;
    try {
      var imp = JSON.parse(raw);
      if (Date.now() > imp.exp) { sessionStorage.removeItem('_imp'); return; }
      sessionStorage.removeItem('_imp');
      window.history.replaceState({}, '', window.location.pathname);
      // Operacao administrativa privilegiada — via Edge Function (sem expor senha)
      sb.functions.invoke('admin-impersonate', { body: { target_uid: imp.uid } }).then(function(res) {
        if (res && res.data && res.data.magic_link) {
          sessionStorage.setItem('_imp_uid', imp.uid);
          window.location.href = res.data.magic_link;
        }
      }).catch(function() {});
    } catch { sessionStorage.removeItem('_imp'); }
  }, []);

  useEffect(function() {
    var handler = function() {
      var uid = sessionStorage.getItem('_imp_uid');
      if (uid) { localStorage.setItem('_imp_restore', uid); sessionStorage.removeItem('_imp_uid'); }
    };
    window.addEventListener('pagehide', handler);
    return function() { window.removeEventListener('pagehide', handler); };
  }, []);

  useEffect(function() {
    if (!isAdminDB) return;
    var handler = function(e) {
      if (e.key !== '_imp_restore' || !e.newValue) return;
      var uid = e.newValue;
      localStorage.removeItem('_imp_restore');
      sb.rpc('admin_impersonate_restore', {target_uid: uid}).catch(function() {});
    };
    window.addEventListener('storage', handler);
    return function() { window.removeEventListener('storage', handler); };
  }, [isAdminDB]);
}
