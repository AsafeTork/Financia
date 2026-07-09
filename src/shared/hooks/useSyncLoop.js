import { useEffect } from 'react';
import { syncAll } from '../../lib/sync.js';

export function useSyncLoop(props, ctx) {
  var { setSyncStatus } = props;
  var { uidRef, syncingRef, loadFromLocal, reconnectRef } = ctx;

  var runSync = function() {
    var userId = uidRef.current;
    if (!userId || !navigator.onLine || syncingRef.current) return;
    syncingRef.current = true;
    syncAll(userId).then(function(ok) {
      syncingRef.current = false;
      if (ok) loadFromLocal(userId);
    }).catch(function() { syncingRef.current = false; });
  };

  useEffect(function() {
    var syncInterval = setInterval(async function() {
      var userId = uidRef.current;
      if (!userId || !navigator.onLine) return;
      setSyncStatus('syncing');
      var ok = await syncAll(userId);
      if (ok) {
        await loadFromLocal(userId);
        setSyncStatus('ok');
        setTimeout(function() { setSyncStatus('idle'); }, 3000);
      } else {
        setSyncStatus('error');
        setTimeout(function() { setSyncStatus('idle'); }, 5000);
      }
    }, 120000);

    var onVisible = function() {
      if (document.visibilityState !== 'visible') return;
      var userId = uidRef.current;
      if (!userId || !navigator.onLine) return;
      syncAll(userId).then(function(ok) { if (ok) loadFromLocal(userId); }).catch(function() { /* silent fail — session already handles retry */ });
    };
    document.addEventListener('visibilitychange', onVisible);

    var onOnline = function() {
      var userId = uidRef.current;
      if (!userId) return;
      if (reconnectRef && reconnectRef.current) reconnectRef.current(userId);
      syncAll(userId).then(function(ok) { if (ok) loadFromLocal(userId); }).catch(function() { /* silent fail — session already handles retry */ });
    };
    window.addEventListener('online', onOnline);

    return function() {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [loadFromLocal, reconnectRef, setSyncStatus, uidRef]);

  return { runSync };
}
