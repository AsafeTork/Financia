import { useEffect } from 'react';
import { syncAll } from '../../lib/sync.js';

var SYNC_COOLDOWN_MS = 5000;

export function useSyncLoop(props, ctx) {
  var { setSyncStatus } = props;
  var { uidRef, syncingRef, loadFromLocal, reconnectRef, lastSyncEndRef } = ctx;

  var canSync = function() {
    if (syncingRef.current) return false;
    if (Date.now() - lastSyncEndRef.current < SYNC_COOLDOWN_MS) return false;
    return true;
  };

  var runSync = function() {
    var userId = uidRef.current;
    if (!userId || !navigator.onLine || !canSync()) return;
    syncingRef.current = true;
    syncAll(userId).then(function(ok) {
      lastSyncEndRef.current = Date.now();
      syncingRef.current = false;
      if (ok) loadFromLocal(userId);
    }).catch(function() {
      lastSyncEndRef.current = Date.now();
      syncingRef.current = false;
    });
  };

  useEffect(function() {
    var syncInterval = setInterval(async function() {
      var userId = uidRef.current;
      if (!userId || !navigator.onLine || !canSync()) return;
      syncingRef.current = true;
      setSyncStatus('syncing');
      var ok = await syncAll(userId);
      lastSyncEndRef.current = Date.now();
      syncingRef.current = false;
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
      if (!userId || !navigator.onLine || !canSync()) return;
      syncingRef.current = true;
      syncAll(userId).then(function(ok) {
        lastSyncEndRef.current = Date.now();
        syncingRef.current = false;
        if (ok) loadFromLocal(userId);
      }).catch(function() {
        lastSyncEndRef.current = Date.now();
        syncingRef.current = false;
      });
    };
    document.addEventListener('visibilitychange', onVisible);

    var onOnline = function() {
      var userId = uidRef.current;
      if (!userId || !canSync()) return;
      if (reconnectRef && reconnectRef.current) reconnectRef.current(userId);
      syncingRef.current = true;
      syncAll(userId).then(function(ok) {
        lastSyncEndRef.current = Date.now();
        syncingRef.current = false;
        if (ok) loadFromLocal(userId);
      }).catch(function() {
        lastSyncEndRef.current = Date.now();
        syncingRef.current = false;
      });
    };
    window.addEventListener('online', onOnline);

    return function() {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [loadFromLocal, reconnectRef, setSyncStatus, syncingRef, uidRef, lastSyncEndRef]);

  return { runSync };
}
