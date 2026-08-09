import { registerSW } from '../lib/pwa.js';

function sanitizeCorruptedStorage() {
  try {
    for (var i = localStorage.length - 1; i >= 0; i--) {
      var key = localStorage.key(i);
      if (!key) continue;
      if (key.indexOf('sb-') === 0 || key.indexOf('supabase') !== -1) {
        var raw = localStorage.getItem(key);
        if (raw && raw.charAt(0) === '{') {
          try { JSON.parse(raw); } catch (_) { localStorage.removeItem(key); }
        }
      }
    }
  } catch (_) { /* ignore */ }
}

function installGlobalErrorMonitor() {
  if (typeof window === 'undefined' || window.__financiaErrorMonitorInstalled) return;
  window.__financiaErrorMonitorInstalled = true;
  var save = function(data) {
    try { localStorage.setItem('financia_global_error', JSON.stringify(data)); } catch (_) { /* ignore */ }
  };
  window.addEventListener('error', function(e) {
    save({ message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno, stack: e.error?.stack, timestamp: new Date().toISOString() });
  });
  window.addEventListener('unhandledrejection', function(e) {
    save({ message: e.reason?.message || String(e.reason), stack: e.reason?.stack, timestamp: new Date().toISOString() });
  });
}

export function bootApp() {
  installGlobalErrorMonitor();
  sanitizeCorruptedStorage();
  registerSW();
  // Defer version check until after React has fully hydrated
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(checkVersion);
  } else {
    setTimeout(checkVersion, 0);
  }
}

function checkVersion() {
  try {
    var deployedVersion = document.documentElement.getAttribute('data-app-version');
    if (!deployedVersion || deployedVersion === '%APP_VERSION%') return;

    var cachedVersion = localStorage.getItem('financia_app_version');
    if (!cachedVersion) {
      localStorage.setItem('financia_app_version', deployedVersion);
      return;
    }

    if (cachedVersion !== deployedVersion) {
      localStorage.setItem('financia_app_version', deployedVersion);
      window.location.reload();
    }
  } catch (e) {
    console.warn('Version check failed:', e);
  }
}
