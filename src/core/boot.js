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

export function bootApp() {
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