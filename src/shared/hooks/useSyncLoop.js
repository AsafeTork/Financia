import { useEffect, useRef, useCallback, useState } from 'react';
import { useSyncLeader } from '../../hooks/useSyncLeader.js';

var SYNC_COOLDOWN_MS = 5000;
var BASE_INTERVAL_MS = 30000;
var MAX_INTERVAL_MS = 300000;
var BACKOFF_MULTIPLIER = 2;
var JITTER_RATIO = 0.1;
var RESET_SUCCESS_COUNT = 2;

function computeIntervalFor(failures) {
  return Math.min(BASE_INTERVAL_MS * Math.pow(BACKOFF_MULTIPLIER, failures), MAX_INTERVAL_MS);
}

function applyJitter(interval) {
  var amt = interval * JITTER_RATIO;
  return interval + (Math.random() * 2 - 1) * amt;
}

export function useSyncLoop(props, ctx) {
  var { setSyncStatus } = props;
  var { uidRef, syncingRef, loadFromLocal, reconnectRef, lastSyncEndRef } = ctx;
  var syncStatusRef = useRef('idle');
  var workerRef = useRef(null);
  var isLeaderRef = useRef(true);
  var stateRef = useRef({ consecutiveFailures: 0, successStreak: 0, lastSyncDuration: 0 });
  var [metrics, setMetrics] = useState({ lastSyncDuration: 0, consecutiveFailures: 0, currentInterval: BASE_INTERVAL_MS });

  var loadFromLocalRef = useRef(loadFromLocal);
  loadFromLocalRef.current = loadFromLocal;

  var onSyncNeeded = useCallback(function() {
    if (uidRef.current) loadFromLocalRef.current(uidRef.current);
  }, [uidRef]);

  var isLeaderResult = useSyncLeader(uidRef.current, onSyncNeeded);
  isLeaderRef.current = isLeaderResult.isLeader;

  var updateStatus = function(next) {
    if (syncStatusRef.current === next) return;
    syncStatusRef.current = next;
    setSyncStatus(next);
  };

  var recordResult = useCallback(function(result) {
    if (!result || result.skipped) return;
    if (result.ok) {
      if (stateRef.current.consecutiveFailures > 0) {
        stateRef.current.successStreak += 1;
        if (stateRef.current.successStreak >= RESET_SUCCESS_COUNT) {
          stateRef.current.successStreak = 0;
          stateRef.current.consecutiveFailures = 0;
        }
      }
    } else {
      stateRef.current.successStreak = 0;
      stateRef.current.consecutiveFailures += 1;
    }
    var currentInterval = computeIntervalFor(stateRef.current.consecutiveFailures);
    setMetrics({ lastSyncDuration: stateRef.current.lastSyncDuration, consecutiveFailures: stateRef.current.consecutiveFailures, currentInterval: currentInterval });
  }, []);

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
    return new Promise(function(resolve) {
      if (!userId || !navigator.onLine) return resolve({ ok: false, skipped: true });
      if (syncingRef.current) return resolve({ ok: false, skipped: true });
      if (Date.now() - lastSyncEndRef.current < SYNC_COOLDOWN_MS) return resolve({ ok: false, skipped: true });
      if (!isLeaderRef.current && navigator.serviceWorker?.controller) return resolve({ ok: false, skipped: true });
      syncingRef.current = true;
      if (showStatus) updateStatus('syncing');
      var startedAt = Date.now();

      var finish = function(result) {
        lastSyncEndRef.current = Date.now();
        syncingRef.current = false;
        stateRef.current.lastSyncDuration = lastSyncEndRef.current - startedAt;
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
        resolve({ ok: ok, skipped: false });
      };

      if (workerRef.current) {
        // Use Web Worker
        workerRef.current.postMessage({ type: 'sync', uid: userId });

        var onMessage = function(e) {
          if (e.data.type === 'sync-complete' && e.data.uid === userId) {
            workerRef.current.removeEventListener('message', onMessage);
            finish(e.data.result);
          }
        };

        workerRef.current.addEventListener('message', onMessage);
      } else {
        // Fallback: direct sync (should not happen in production)
        import('../../lib/sync.js').then(function(mod) {
          mod.syncAll(userId).then(function(result) {
            finish(result);
          }).catch(function() {
            finish({ ok: false, changed: false });
          });
        });
      }
    });
  };

  var runSyncRef = useRef(null);
  runSyncRef.current = function() {
    doSyncRef.current(uidRef.current, false).then(recordResult);
  };

  useEffect(function() {
    var cancelled = false;
    var timerRef = null;

    var scheduleNext = function() {
      if (cancelled) return;
      var interval = applyJitter(computeIntervalFor(stateRef.current.consecutiveFailures));
      timerRef = setTimeout(tick, interval);
    };

    var tick = function() {
      if (cancelled) return;
      doSyncRef.current(uidRef.current, true).then(function(result) {
        recordResult(result);
        scheduleNext();
      });
    };

    var onVisible = function() {
      if (document.visibilityState !== 'visible') return;
      doSyncRef.current(uidRef.current, false).then(recordResult);
    };
    document.addEventListener('visibilitychange', onVisible);

    var onOnline = function() {
      var userId = uidRef.current;
      if (!userId) return;
      if (reconnectRef && reconnectRef.current) reconnectRef.current(userId);
      doSyncRef.current(userId, false).then(recordResult);
    };
    window.addEventListener('online', onOnline);

    scheduleNext();

    return function() {
      cancelled = true;
      if (timerRef) clearTimeout(timerRef);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [loadFromLocal, reconnectRef, setSyncStatus, syncingRef, uidRef, lastSyncEndRef, recordResult]);

  var runSync = useCallback(function() { runSyncRef.current(); }, []);
  return { runSync: runSync, lastSyncDuration: metrics.lastSyncDuration, consecutiveFailures: metrics.consecutiveFailures, currentInterval: metrics.currentInterval };
}
