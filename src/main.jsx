import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import './animations.css';
import App from './App.jsx';
import { registerSW } from './lib/pwa.js';

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

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App/>
  </HashRouter>
);

ensureManifestLink();

registerSW();
