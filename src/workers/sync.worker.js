/* sync.worker.js — Background sync Web Worker.
   Delegates to the shared sync pipeline (src/lib/sync.js) so the worker path
   never drifts from the main-thread fallback logic. Communication via
   postMessage/message event. */
import { syncAll } from '../lib/sync.js';

self.onmessage = async function(e) {
  const { type, uid } = e.data;

  if (type === 'sync') {
    self.postMessage({ type: 'sync-start', uid });
    let result;
    try {
      result = await syncAll(uid);
    } catch (_) {
      result = { ok: false, changed: false };
    }
    self.postMessage({ type: 'sync-complete', uid, result });
  }
};