/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import type { RouteMatchCallback } from 'workbox-core';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// App shell para navegacoes: o app e offline-first (Dexie), entao o shell
// precached mantem o app utilizavel mesmo sem conexao.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('/index.html'), {
    denylist: [/^\/api\//],
  })
);

// Bundles hashados pelo Vite: cache-first e seguro porque cada build gera uma URL nova.
registerRoute(
  ({ url }) =>
    url.origin === self.location.origin &&
    url.pathname.startsWith('/assets/') &&
    /\.(?:js|css|png|svg|woff2?)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }),
    ],
  })
);

// Fontes do Google Fonts: cache-first com TTL longo.
registerRoute(
  ({ url }) =>
    url.hostname === 'fonts.gstatic.com' && /\.(?:woff2?|ttf)$/i.test(url.pathname),
  new CacheFirst({
    cacheName: 'fonts',
    plugins: [
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 }),
    ],
  })
);

// API propria: network-first com fallback para o cache.
registerRoute(
  ({ url }) =>
    url.origin === self.location.origin && url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 }),
    ],
  })
);

// Supabase REST (GET): network-first. Leituras normalmente vem do Dexie;
// o cache cobre curtos periodos offline.
registerRoute(
  ({ url, request }) =>
    url.hostname.endsWith('.supabase.co') &&
    url.pathname.startsWith('/rest/v1/') &&
    request.method === 'GET',
  new NetworkFirst({
    cacheName: 'supabase-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 10 * 60 }),
    ],
  })
);

// Mutations offline (POST/PATCH/DELETE no Supabase REST): background sync.
// Nota: o app ja fila mutacoes no Dexie (offline-first); esta fila e uma
// rede de seguranca para requests que falhem por queda de conexao.
const isMutation: RouteMatchCallback = ({ url, request }) =>
  url.hostname.endsWith('.supabase.co') &&
  url.pathname.startsWith('/rest/v1/') &&
  (request.method === 'POST' || request.method === 'PATCH' || request.method === 'DELETE');

const backgroundSync = new BackgroundSyncPlugin('financia-mutations', {
  maxRetentionTime: 24 * 60,
});
const mutationHandler = new NetworkOnly({ plugins: [backgroundSync] });
registerRoute(isMutation, mutationHandler, 'POST');
registerRoute(isMutation, mutationHandler, 'PATCH');
registerRoute(isMutation, mutationHandler, 'DELETE');

// Atualizacao automatica: o cliente ainda pode usar SKIP_WAITING como fallback
// para navegadores que ja tenham um worker antigo aguardando.
self.addEventListener('message', (event) => {
  const data = event.data as { type?: string } | undefined;
  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await caches.delete('static-assets');
    await self.clients.claim();
    if (self.registration.navigationPreload) {
      await self.registration.navigationPreload.enable();
    }
  })());
});

// Responde navigation requests com preload response quando disponivel,
// fallback para o shell precached.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate' && event.preloadResponse) {
    event.respondWith((async () => {
      try { return await event.preloadResponse; }
      catch { return await createHandlerBoundToURL('/index.html')({ request: event.request, event, url: new URL(event.request.url) }); }
    })());
  }
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
  // Posta progresso minimo para a UI (pwa.js) saber que houve instalacao.
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ includeUncontrolled: true });
      clients.forEach((client) => client.postMessage({ type: 'CACHE_PROGRESS', pct: 100 }));
    })()
  );
});
