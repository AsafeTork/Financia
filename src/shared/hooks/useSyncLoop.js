import { useEffect, useRef } from 'react';
import { useSyncLeader } from '../../hooks/useSyncLeader.js';

var SYNC_COOLDOWN_MS = 5000;

export function useSyncLoop(props, ctx) {
  var { setSyncStatus } = props;
  var { uidRef, syncingRef, loadFromLocal, reconnectRef, lastSyncEndRef } = ctx;
  var syncStatusRef = useRef('idle');
  var workerRef = useRef(null);
  var isLeaderRef = useRef(true);

  var isLeaderResult = useSyncLeader(uidRef.current, function() {
    if (uidRef.current) loadFromLocal(uidRef.current);
  });
  isLeaderRef.current = isLeaderResult.isLeader;

  var updateStatus = function(next) {
    if (syncStatusRef.current === next) return;
    syncStatusRef.current = next;
    setSyncStatus(next);
  };

  useEffect(function() {
    // Create worker
    try {
      workerRef.current = new Worker(new URL('../../workers/sync.worker.js', import.meta.url), { type: 'module' });
    } catch (_) {
      // Fallback: if worker creation fails, sync will be handled by main thread
      workerRef.current = null;
    }

    return function() {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  var doSyncRef = useRef(null);
  doSyncRef.current = function(userId, showStatus) {
    if (!userId || !navigator.onLine) return;
    if (syncingRef.current) return;
    if (Date.now() - lastSyncEndRef.current < SYNC_COOLDOWN_MS) return;
    if (!isLeaderRef.current && navigator.serviceWorker?.controller) return;
    syncingRef.current = true;
    if (showStatus) updateStatus('syncing');

    if (workerRef.current) {
      // Use Web Worker
      workerRef.current.postMessage({ type: 'sync', uid: userId });
      
      var onMessage = function(e) {
        if (e.data.type === 'sync-complete' && e.data.uid === userId) {
          workerRef.current.removeEventListener('message', onMessage);
          lastSyncEndRef.current = Date.now();
          syncingRef.current = false;
          var result = e.data.result;
          var ok = result.ok !== false;
          var changed = result.changed === true;
          if (ok) {
            if (changed) loadFromLocal(userId);
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
        }
      };
      
      workerRef.current.addEventListener('message', onMessage);
    } else {
      // Fallback: direct sync (should not happen in production)
      import('../../lib/sync.js').then(function(mod) {
        mod.syncAll(userId).then(function(result) {
          lastSyncEndRef.current = Date.now();
          syncingRef.current = false;
          var ok = result.ok !== false;
          var changed = result.changed === true;
          if (ok) {
            if (changed) loadFromLocal(userId);
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
      });
    }
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
