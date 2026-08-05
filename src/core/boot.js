import { registerSW } from '../lib/pwa.js';

export function bootApp() {
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