import { useEffect, useRef } from 'react';
import { syncAll } from '../../lib/sync.js';

var SYNC_COOLDOWN_MS = 5000;

export function useSyncLoop(props, ctx) {
  var { setSyncStatus } = props;
  var { uidRef, syncingRef, loadFromLocal, reconnectRef, lastSyncEndRef } = ctx;
  var syncStatusRef = useRef('idle');

  var updateStatus = function(next) {
    if (syncStatusRef.current === next) return;
    syncStatusRef.current = next;
    setSyncStatus(next);
  };

  var canSync = function() {
    if (syncingRef.current) return false;
    if (Date.now() - lastSyncEndRef.current < SYNC_COOLDOWN_MS) return false;
    return true;
  };

  var doSyncRef = useRef(null);
  doSyncRef.current = function(userId, showStatus) {
    if (!userId || !navigator.onLine) return;
    if (syncingRef.current) return;
    if (Date.now() - lastSyncEndRef.current < SYNC_COOLDOWN_MS) return;
    syncingRef.current = true;
    if (showStatus) updateStatus('syncing');
    syncAll(userId).then(function(ok) {
      lastSyncEndRef.current = Date.now();
      syncingRef.current = false;
      if (ok) {
        loadFromLocal(userId);
        if (showStatus) {
          updateStatus('ok');
          setTimeout(function() { updateStatus('idle'); }, 3000);
        }
      } else {
        if (showStatus) {
          updateStatus('error');
          setTimeout(function() { updateStatus('idle'); }, 5000);
        }
      }
    }).catch(function() {
      lastSyncEndRef.current = Date.now();
      syncingRef.current = false;
    });
  };

  var runSyncRef = useRef(null);
  runSyncRef.current = function() {
    doSyncRef.current(uidRef.current, false);
  };

  useEffect(function() {
    var syncInterval = setInterval(function() {
      doSyncRef.current(uidRef.current, true);
    }, 120000);

    var onVisible = function() {
      if (document.visibilityState !== 'visible') return;
      doSyncRef.current(uidRef.current, false);
    };
    document.addEventListener('visibilitychange', onVisible);

    var onOnline = function() {
      var userId = uidRef.current;
      if (!userId) return;
      if (reconnectRef && reconnectRef.current) reconnectRef.current(userId);
      doSyncRef.current(userId, false);
    };
    window.addEventListener('online', onOnline);

    return function() {
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [loadFromLocal, reconnectRef, setSyncStatus, syncingRef, uidRef, lastSyncEndRef]);

  return { runSync: function() { runSyncRef.current(); } };
}
