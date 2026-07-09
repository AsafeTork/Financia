import { registerSW } from '../lib/pwa.js';

function shouldEnableManifest() {
  if (typeof window === 'undefined') return false;
  var host = window.location.hostname || '';
  return host.indexOf('github.dev') === -1;
}

function ensureManifestLink() {
  if (!shouldEnableManifest()) return;
  if (document.querySelector('link[rel="manifest"]')) return;
  var link = document.createElement('link');
  link.rel = 'manifest';
  link.href = '/manifest.json';
  document.head.appendChild(link);
}

export function bootApp() {
  ensureManifestLink();
  registerSW();
}
