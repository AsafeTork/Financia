import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import './animations.css';
import App from './App.jsx';
import { registerSW } from './lib/pwa.js';

var queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30 * 1000 },
    mutations: { retry: 0 },
  },
});

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
    <QueryClientProvider client={queryClient}>
      <App/>
    </QueryClientProvider>
  </HashRouter>
);

ensureManifestLink();

registerSW();
