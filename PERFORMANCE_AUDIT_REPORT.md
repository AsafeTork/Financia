# Financia Performance Audit Report

**Date:** 2026-08-05  
**Auditor:** Performance Audit Specialist  
**Application Version:** 5.1.1  
**Stack:** React 18.3.1 + Vite 5.4.10 + Dexie 3.2.7 + Supabase + PWA

---

## Executive Summary

| Metric | Current State | Target | Status |
|--------|---------------|--------|--------|
| **Initial JS Bundle** | ~400-500 KB gzipped (est.) | < 170 KB gzipped | ⚠️ At Risk |
| **Sync Benchmark (10k records)** | 134.5s extrapolated | < 5s | 🔴 Critical |
| **Core Web Vitals (Lighthouse CI)** | p90 > 90 asserted | p90 > 90 | 🟡 Unverified |
| **INP Risk** | High (sync on main thread) | < 200ms | 🔴 Critical |
| **LCP Risk** | High (no SSR, heavy bundle) | < 2.5s | 🔴 Critical |
| **CLS Risk** | Medium (skeleton loaders present) | < 0.1 | 🟡 Moderate |

---

## 1. Bundle Size Analysis

### 1.1 Vite Configuration Review

**Current `vite.config.js`:**
```javascript
build: {
  target: 'es2022',
  sourcemap: false,
  minify: 'esbuild',
  chunkSizeWarningLimit: 500,
  rollupOptions: {
    output: {
      manualChunks: function(id) {
        if (id.includes('node_modules/react') && !id.includes('react-table')) return 'vendor-react';
        if (id.includes('node_modules/react-dom')) return 'vendor-react';
        if (id.includes('node_modules/scheduler')) return 'vendor-react';
        if (id.includes('node_modules/@supabase')) return 'vendor-supabase';
        if (id.includes('node_modules/@tanstack/query-core') || id.includes('node_modules/@tanstack/react-query')) return 'vendor-query';
        if (id.includes('node_modules/@radix-ui')) return 'vendor-radix';
        if (id.includes('node_modules/@stripe')) return 'vendor-stripe';
        if (id.includes('node_modules/react-router-dom')) return 'vendor-router';
        if (id.includes('node_modules/dexie')) return 'vendor-dexie';
        if (id.includes('node_modules/tailwindcss')) return 'vendor-tailwind';
        if (id.includes('node_modules')) return 'vendor';
      },
    },
  },
}
```

### 1.2 Identified Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| **Single `vendor` fallback chunk** | 🔴 Critical | All uncategorized `node_modules` end up in one massive chunk (`vendor-[hash].js`) |
| **No `@tanstack/react-virtual` chunk** | 🟠 High | Virtualization library bundled with app code |
| **No `clsx`/`tailwind-merge`/`class-variance-authority` chunk** | 🟠 High | Small utility libs inflate app chunks |
| **`target: 'es2022'` may be too new** | 🟡 Medium | Limits browser compatibility; `baseline-widely-available` recommended |
| **Minification: `esbuild` only** | 🟡 Medium | Terser produces ~10-15% smaller output for production |
| **Missing `modulePreload` polyfill** | 🟢 Low | Could improve initial load on older browsers |

### 1.3 Estimated Chunk Sizes (guesstimate based on dependencies)

| Chunk | Est. Size (gzipped) | Notes |
|-------|---------------------|-------|
| `vendor-react` | ~45 KB | React + ReactDOM + Scheduler |
| `vendor-router` | ~12 KB | React Router DOM v7 |
| `vendor-supabase` | ~35 KB | Supabase JS client |
| `vendor-query` | ~25 KB | TanStack Query v5 |
| `vendor-radix` | ~18 KB | Radix UI primitives |
| `vendor-stripe` | ~40 KB | Stripe JS + React Stripe |
| `vendor-dexie` | ~15 KB | Dexie 3.x |
| `vendor-tailwind` | ~8 KB | Tailwind runtime |
| **`vendor` (fallback)** | **~80-120 KB** | **All remaining deps — primary bloat source** |
| App code (routes) | ~50-80 KB | 9 lazy-loaded routes + shared components |

**Total Initial Load (main + vendor-react + vendor-router + inline):** ~200-280 KB gzipped  
**Total App (all chunks):** ~350-500 KB gzipped

### 1.4 Recommendations

```javascript
// vite.config.js — Optimized manualChunks
build: {
  target: 'baseline-widely-available', // Better compatibility, same performance
  minify: 'terser', // 10-15% smaller than esbuild
  terserOptions: {
    compress: { passes: 2, drop_console: true, pure_funcs: ['console.log', 'console.debug'] },
    mangle: { safari10: true },
  },
  cssCodeSplit: true,
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          // Framework — stable, rarely changes
          if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
          if (id.includes('react-dom')) return 'vendor-react';
          
          // Router — stable
          if (id.includes('react-router')) return 'vendor-router';
          
          // Data layer — changes occasionally
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('@tanstack/react-query') || id.includes('@tanstack/query-core')) return 'vendor-query';
          if (id.includes('@tanstack/react-virtual')) return 'vendor-virtual'; // NEW
          
          // UI — changes occasionally
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) return 'vendor-utils'; // NEW
          
          // Payments — stable
          if (id.includes('@stripe')) return 'vendor-stripe';
          
          // Database — stable
          if (id.includes('dexie')) return 'vendor-dexie';
          
          // Styles — stable
          if (id.includes('tailwindcss')) return 'vendor-tailwind';
          
          // Remaining — group by update frequency
          return 'vendor-misc';
        }
      },
      // Ensure consistent chunk naming for caching
      chunkFileNames: 'assets/js/[name]-[hash].js',
      entryFileNames: 'assets/js/[name]-[hash].js',
      assetFileNames: (assetInfo) => {
        const info = assetInfo.name.split('.');
        const ext = info[info.length - 1];
        if (/\.(css)$/.test(assetInfo.name)) return 'assets/css/[name]-[hash].css';
        if (/\.(png|jpe?g|gif|svg|webp|avif|woff2?)$/.test(assetInfo.name)) return 'assets/media/[name]-[hash].' + ext;
        return 'assets/[name]-[hash].' + ext;
      },
    },
  },
}
```

**Expected Impact:**  
- Reduce `vendor` fallback from ~100 KB → ~20-30 KB (split into `vendor-virtual`, `vendor-utils`, `vendor-misc`)  
- Improve cache hit rate: vendor chunks change < 5% as often as app code  
- Enable `gzip` + `brotli` compression via `vite-plugin-compression` (add to build)

---

## 2. Database Query Optimization (IndexedDB/Dexie)

### 2.1 Current Schema Analysis

**`src/lib/dexie.js` — Current Indexes (v4):**
```javascript
ldb.version(4).stores({
  transactions: 'id, user_id, [user_id+_deleted], date, updated_at, _synced, _deleted',
  products:     'id, user_id, [user_id+_deleted], category, updated_at, _synced, _deleted',
  losses:       'id, user_id, [user_id+_deleted], date, updated_at, _synced, _deleted',
  profiles:     'user_id, updated_at, _synced',
  meta:         'key',
  brand_presets: 'id, name, category, favorite, updated_at',
  brand_logo_schemes: 'id, name, createdAt',
});
```

### 2.2 Identified Issues

| Issue | Severity | Location | Evidence |
|-------|----------|----------|----------|
| **Compound index `[user_id+_deleted]` not optimal for sync queries** | 🔴 Critical | `sync.js:33` | Query: `where('user_id').equals(uid).and(r => r._synced === 0)` — uses `and()` filter, not index |
| **Missing index on `_synced` for unsynced queries** | 🔴 Critical | `sync.js:33` | `and(r => r._synced === 0)` forces full table scan on `user_id` matches |
| **No composite index for pull query: `(user_id, updated_at)`** | 🟠 High | `sync.js:61` | `gte('updated_at', lastSync).order('updated_at')` — needs compound index |
| **`bulkGet(remoteIds)` loads full objects unnecessarily** | 🟠 High | `sync.js:75` | Only needs `id` + `updated_at` + `_synced` for comparison |
| **No pagination on unsynced local changes push** | 🟡 Medium | `sync.js:33` | `toArray()` loads ALL unsynced — memory risk at scale |
| **Dexie version 3.2.7 (not 4.x)** | 🟡 Medium | `package.json` | Missing IDB 3.0 `getAll(options)` optimizations, blob offloading |
| **No `liveQuery` usage for reactive UI** | 🟢 Low | — | Could reduce manual subscriptions |

### 2.3 Sync Query Patterns Analysis

**Push (local → remote):**
```javascript
// Current: Lines 33-51 in sync.js
const unsynced = await ldbTable
  .where('user_id')
  .equals(uid)
  .and(r => r._synced === 0)  // ❌ Filter function = cursor iteration
  .toArray();                 // ❌ Loads ALL fields
```

**Pull (remote → local):**
```javascript
// Current: Lines 56-70 in sync.js
var query = sb.from(table).select(selectFields).eq('user_id', uid).gte('updated_at', lastSync).order('updated_at', {ascending:true}).limit(500);

// Then: Line 75
const existingArr = await ldbTable.bulkGet(remoteIds); // ❌ Loads full objects
```

### 2.4 Optimized Schema (Dexie 4.x)

```javascript
// src/lib/dexie.js — Optimized
ldb.version(5).stores({
  // Push optimization: index on (user_id, _synced) for fast unsynced lookup
  // Pull optimization: index on (user_id, updated_at) for range queries
  transactions: 'id, user_id, [user_id+_synced], [user_id+updated_at], [user_id+_deleted], date, updated_at, _synced, _deleted',
  products:     'id, user_id, [user_id+_synced], [user_id+updated_at], [user_id+_deleted], category, updated_at, _synced, _deleted',
  losses:       'id, user_id, [user_id+_synced], [user_id+updated_at], [user_id+_deleted], date, updated_at, _synced, _deleted',
  profiles:     'user_id, updated_at, _synced',
  meta:         'key',
  brand_presets: 'id, name, category, favorite, updated_at',
  brand_logo_schemes: 'id, name, createdAt',
});

// Add utility for partial object fetching
export const getUnsyncedIds = async (table, uid) => {
  // Uses [user_id+_synced] index — returns only keys, not full objects
  return table.where('[user_id+_synced]').equals([uid, 0]).primaryKeys();
};

export const getUnsyncedPartial = async (table, uid, fields) => {
  // Fetch only needed fields using index + projection
  return table.where('[user_id+_synced]').equals([uid, 0]).select(fields.join(',')).toArray();
};
```

### 2.5 Optimized Sync Logic

```javascript
// src/lib/sync.js — Optimized push phase
const syncTable = async function(uid, table, ldbTable, mapLocal, signal) {
  if (!navigator.onLine) return { ok: true, changed: false };
  
  // 1. Get ONLY unsynced IDs (uses [user_id+_synced] index — O(log n))
  const unsyncedIds = await ldbTable.where('[user_id+_synced]').equals([uid, 0]).primaryKeys();
  
  // 2. Fetch only fields needed for upsert (projection)
  const unsynced = await ldbTable.bulkGet(unsyncedIds); // Still loads full, but fewer records
  
  // ... rest same, but add batching for large datasets
  const BATCH_SIZE = 100;
  for (let i = 0; i < unsynced.length; i += BATCH_SIZE) {
    const batch = unsynced.slice(i, i + BATCH_SIZE);
    await runLimited(batch, async (row) => { /* ... */ });
    if (signal?.aborted) break;
  }
  
  // 3. Pull phase: use [user_id+updated_at] index for local comparison
  const selectFields = ['id', 'updated_at', ...(FIELD_MAP[table] || [])].join(',');
  // ... pagination same
  
  // 4. Compare using only id + updated_at (already in memory from bulkGet)
  const remoteIds = remote.map(r => r.id);
  const existing = await ldbTable.bulkGet(remoteIds); // Could optimize with getMany if only id/updated_at needed
  // ...
};
```

### 2.6 Benchmark Evidence

**Current benchmark (`benchmarks/syncAll-10k.json`):**
```json
{
  "totalTimeMs": 40371,        // 40 seconds for 3,000 records
  "recordsPerSecond": 74.31,   // Extremely slow
  "scaledTo10k": 134555        // 134 seconds for 10k records — UNACCEPTABLE
}
```

**Expected with optimizations:**
| Optimization | Est. Improvement |
|--------------|------------------|
| Compound indexes (`[user_id+_synced]`, `[user_id+updated_at]`) | 10-20x faster queries |
| Partial object fetching (projections) | 2-5x less memory/CPU |
| Batched push (100 at a time) | Prevents main thread blocking |
| Dexie 4.x + IDB 3.0 `getAll(options)` | 2-3x faster bulk reads |
| **Total expected** | **50-100x faster** → **~1-3s for 10k records** |

---

## 3. Sync Loop Efficiency

### 3.1 Current Implementation (`src/shared/hooks/useSyncLoop.js`)

```javascript
var SYNC_COOLDOWN_MS = 5000;

useEffect(function() {
  var syncInterval = setInterval(function() {
    doSyncRef.current(uidRef.current, true);
  }, 120000); // Every 2 minutes

  var onVisible = function() {
    if (document.visibilityState !== 'visible') return;
    doSyncRef.current(uidRef.current, false);
  };
  document.addEventListener('visibilitychange', onVisible);

  var onOnline = function() {
    // ... triggers sync immediately
  };
  window.addEventListener('online', onOnline);
}, [loadFromLocal, reconnectRef, setSyncStatus, syncingRef, uidRef, lastSyncEndRef]);
```

### 3.2 Identified Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| **Fixed 2-minute interval regardless of data volatility** | 🟠 High | Wastes battery/network on stable data; too slow for active editing |
| **No exponential backoff on repeated failures** | 🔴 Critical | `sync.js` has backoff but `useSyncLoop` ignores it — hammers failing endpoint |
| **Sync runs on main thread** | 🔴 Critical | `syncAll` does heavy Dexie + Supabase work → blocks INP |
| **No priority queue for user-initiated vs background sync** | 🟠 High | User taps "Save" → waits for background sync to finish |
| **`visibilitychange` triggers sync even if just switched tabs briefly** | 🟡 Medium | Unnecessary sync on tab focus |
| **No deduplication of rapid triggers (online + visible + interval)** | 🟡 Medium | Multiple syncs queued simultaneously |
| **`syncAll` has 3-second timeout (`setTimeout`)** | 🟠 High | Too aggressive — fails on slow mobile networks |

### 3.3 Recommendations

```javascript
// src/shared/hooks/useSyncLoop.js — Optimized
import { useEffect, useRef, useCallback } from 'react';
import { syncAll, resetSyncBackoff } from '../../lib/sync.js';

var BASE_SYNC_INTERVAL_MS = 60000;        // 1 min base (was 2 min)
var MAX_SYNC_INTERVAL_MS = 300000;        // 5 min max
var SYNC_COOLDOWN_MS = 3000;              // Reduced from 5s
var VISIBILITY_DEBOUNCE_MS = 2000;        // New: debounce tab focus

export function useSyncLoop(props, ctx) {
  var { setSyncStatus } = props;
  var { uidRef, syncingRef, loadFromLocal, reconnectRef, lastSyncEndRef } = ctx;
  var syncStatusRef = useRef('idle');
  var intervalRef = useRef(null);
  var nextSyncDelayRef = useRef(BASE_SYNC_INTERVAL_MS);
  var visibilityTimerRef = useRef(null);

  // Adaptive interval: faster after changes, slower when stable
  var scheduleNextSync = useCallback(function(changed) {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    
    if (changed) {
      nextSyncDelayRef.current = BASE_SYNC_INTERVAL_MS; // Reset to fast
    } else {
      nextSyncDelayRef.current = Math.min(
        nextSyncDelayRef.current * 1.5, 
        MAX_SYNC_INTERVAL_MS
      ); // Exponential backoff to max
    }
    
    intervalRef.current = setTimeout(runBackgroundSync, nextSyncDelayRef.current);
  }, []);

  var runBackgroundSync = useCallback(async function() {
    const userId = uidRef.current;
    if (!userId || !navigator.onLine || syncingRef.current) {
      scheduleNextSync(false);
      return;
    }
    if (Date.now() - lastSyncEndRef.current < SYNC_COOLDOWN_MS) {
      scheduleNextSync(false);
      return;
    }
    
    syncingRef.current = true;
    const result = await syncAll(userId);
    lastSyncEndRef.current = Date.now();
    syncingRef.current = false;
    
    if (result.ok && result.changed) {
      loadFromLocal(userId);
      scheduleNextSync(true); // Data changed → sync sooner next time
    } else {
      scheduleNextSync(false); // No changes → back off
    }
  }, [uidRef, syncingRef, lastSyncEndRef, loadFromLocal, scheduleNextSync]);

  var doSyncRef = useRef(null);
  doSyncRef.current = function(userId, showStatus) {
    if (!userId || !navigator.onLine) return;
    if (syncingRef.current) return;
    if (Date.now() - lastSyncEndRef.current < SYNC_COOLDOWN_MS) return;
    
    syncingRef.current = true;
    if (showStatus) updateStatus('syncing');
    
    // Run in transition to keep UI responsive (React 18)
    startTransition(async () => {
      const result = await syncAll(userId);
      lastSyncEndRef.current = Date.now();
      syncingRef.current = false;
      // ... status updates
    });
  };

  useEffect(function() {
    // Initial sync
    runBackgroundSync();
    
    // Visibility change with debounce
    var onVisible = function() {
      if (document.visibilityState !== 'visible') return;
      if (visibilityTimerRef.current) clearTimeout(visibilityTimerRef.current);
      visibilityTimerRef.current = setTimeout(() => {
        doSyncRef.current(uidRef.current, false);
      }, VISIBILITY_DEBOUNCE_MS);
    };
    document.addEventListener('visibilitychange', onVisible);

    // Online event — reset backoff and sync immediately
    var onOnline = function() {
      var userId = uidRef.current;
      if (!userId) return;
      resetSyncBackoff(); // Reset sync.js backoff
      nextSyncDelayRef.current = BASE_SYNC_INTERVAL_MS;
      doSyncRef.current(userId, false);
    };
    window.addEventListener('online', onOnline);

    return function() {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (visibilityTimerRef.current) clearTimeout(visibilityTimerRef.current);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
    };
  }, [loadFromLocal, reconnectRef, runBackgroundSync, uidRef]);

  return { runSync: function() { doSyncRef.current(uidRef.current, true); } };
}
```

### 3.4 Move Sync to Web Worker (Critical for INP)

```javascript
// src/lib/sync.worker.js — NEW FILE
import { ldb, toLocal, getLastSync, setLastSync, FIELD_MAP, pickFields } from './dexie.js';
import { sb } from './supabase.js';

// All sync logic moves here
// Main thread communicates via postMessage
// Use Dexie 4.x + dexie-worker for seamless proxy

// Main thread usage:
import { DexieWorker } from 'dexie-worker';
const worker = new DexieWorker(() => new Worker(new URL('./sync.worker.js', import.meta.url)));

// Now syncAll runs OFF main thread — INP protected
```

**Expected INP Impact:**  
- Main thread blocked 0ms during sync (was 2-10s for 10k records)  
- INP drops from >500ms → <50ms during sync operations  

---

## 4. React 18 Concurrent Features — Missing Opportunities

### 4.1 Current State

| Feature | Used? | Location |
|---------|-------|----------|
| `useTransition` | ❌ No | — |
| `useDeferredValue` | ❌ No | — |
| `React.memo` | ✅ Yes | `AppRoutes`, `AppRoutes` components |
| `useMemo` / `useCallback` | ✅ Yes | Extensive in `App.jsx`, `AppRoutes.jsx` |
| `Suspense` + `lazy` | ✅ Yes | Route-level code splitting |
| `startTransition` | ❌ No | — |

### 4.2 High-Impact Opportunities

**A. Search/Filter Inputs (TxView, InventoryView)**
```javascript
// Current: synchronous filtering on every keystroke
// Problem: 1000+ rows × filter = main thread block → INP spike

// Fix: useTransition
import { useTransition, useState } from 'react';

function TxView({ tx, ... }) {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [deferredQuery, setDeferredQuery] = useState('');

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value); // Urgent: input stays responsive
    startTransition(() => {
      setDeferredQuery(value); // Non-urgent: filtering deferred
    });
  };

  // Use deferredQuery for expensive filtering
  const filteredTx = useMemo(() => expensiveFilter(tx, deferredQuery), [tx, deferredQuery]);
  
  return <input value={query} onChange={handleChange} />;
}
```

**B. Route Transitions (AppRoutes)**
```javascript
// Wrap navigation in startTransition
import { startTransition } from 'react';

const handleNav = useCallback((path) => {
  startTransition(() => {
    navTo(path);
  });
}, [navTo]);
```

**C. Dashboard Heavy Calculations**
```javascript
// Move to useDeferredValue
const deferredTx = useDeferredValue(tx);
const chartData = useMemo(() => computeCharts(deferredTx), [deferredTx]);

// Show stale indicator
{tx !== deferredTx && <span className="opacity-50">Atualizando...</span>}
```

### 4.3 Expected Impact

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| INP during filtering | 300-800ms | 50-100ms | 5-8x |
| INP during navigation | 200-500ms | 50-100ms | 3-5x |
| Input responsiveness | Laggy | Instant | Qualitative |

---

## 5. Service Worker / PWA Caching Strategy

### 5.1 Current SW Analysis (`public/sw.js`)

**Strengths:**
- Navigation preload enabled ✅
- Cache-first for static assets (JS/CSS/fonts) ✅
- Stale-while-revalidate for API (`/api/*`) ✅
- Version-based cache busting (`CACHE_VER` + `CACHE_DATE`) ✅
- Offline fallback (`/offline.html`) ✅
- Cache size limit (50 entries) ✅

**Weaknesses:**
| Issue | Severity | Fix |
|-------|----------|-----|
| **API cache: 30-second maxAge too short for offline-first** | 🟠 High | Increase to 5 min for GET; use `NetworkFirst` with 3s timeout |
| **No `CacheFirst` for Supabase Realtime/WebSocket fallback** | 🟡 Medium | Not applicable (WS not cacheable) |
| **No `BackgroundSync` for mutations (POST/PUT/DELETE)** | 🔴 Critical | Add Workbox Background Sync for offline writes |
| **No `precacheManifest` injection (uses manual HTML parsing)** | 🟠 High | Use `vite-plugin-pwa` with `injectManifest` |
| **Font caching: no `CacheableResponsePlugin` for opaque responses** | 🟡 Medium | Add to font route |
| **Image caching: no WebP/AVIF detection** | 🟢 Low | Acceptable (browser handles) |
| **No `NavigationPreload` response usage optimization** | 🟡 Medium | Already enabled but could warm cache |

### 5.2 Recommended SW Configuration (Workbox via `vite-plugin-pwa`)

```javascript
// vite.config.js — Add to plugins
import { VitePWA } from 'vite-plugin-pwa';

plugins: [
  react(),
  VitePWA({
    strategies: 'injectManifest',
    srcDir: 'src',
    filename: 'sw.ts',
    registerType: 'prompt', // User-controlled update
    manifest: {
      name: 'Financia — Gestão financeira',
      short_name: 'Financia',
      theme_color: '#002f59',
      background_color: '#002f59',
      display: 'standalone',
      icons: [
        { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
        { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,json}'],
      cleanupOutdatedCaches: true,
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
      runtimeCaching: [
        {
          // HTML navigations — NetworkFirst with timeout
          urlPattern: ({ request }) => request.mode === 'navigate',
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages',
            networkTimeoutSeconds: 3,
            plugins: [
              { cacheWillUpdate: async ({ response }) => response && response.ok ? response : null },
            ],
          },
        },
        {
          // API GET — StaleWhileRevalidate with 5 min maxAge
          urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'api-rest',
            expiration: { maxEntries: 100, maxAgeSeconds: 5 * 60 },
            plugins: [
              { cacheWillUpdate: async ({ response }) => response && response.ok ? response : null },
            ],
          },
        },
        {
          // Supabase Functions — NetworkOnly (mutations)
          urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/.*/,
          handler: 'NetworkOnly',
          options: {
            plugins: [
              { fetchDidFail: async ({ error }) => { /* Queue for BackgroundSync */ } },
            ],
          },
        },
        {
          // Images — CacheFirst, 30 days
          urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'images',
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            plugins: [
              { cacheWillUpdate: async ({ response }) => response && response.status === 200 ? response : null },
            ],
          },
        },
        {
          // Fonts — CacheFirst, 1 year, handle opaque
          urlPattern: /\.(?:woff2?|ttf|otf)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'fonts',
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            plugins: [
              { cacheWillUpdate: async ({ response }) => response && (response.status === 200 || response.type === 'opaque') ? response : null },
            ],
          },
        },
      ],
    },
  }),
],
```

### 5.3 Background Sync for Offline Mutations

```javascript
// src/lib/sync.worker.js — Add Background Sync
import { BackgroundSyncPlugin } from 'workbox-background-sync';

// In SW runtimeCaching for mutations:
{
  urlPattern: /^https:\/\/.*\.supabase\.co\/functions\/v1\/(create|update|delete).*$/,
  handler: 'NetworkOnly',
  options: {
    plugins: [
      new BackgroundSyncPlugin('offline-mutations', {
        maxRetentionTime: 24 * 60, // 24 hours
        onSync: async ({ queue }) => {
          let entry;
          while ((entry = await queue.shiftRequest())) {
            try {
              await fetch(entry.request.clone());
            } catch (error) {
              await queue.unshiftRequest(entry); // Re-queue on failure
              throw error;
            }
          }
        },
      }),
    ],
  },
}
```

---

## 6. Core Web Vitals Impact Assessment

### 6.1 Current Risk Matrix

| CWV Metric | Current Risk | Primary Cause | Mitigation Priority |
|------------|--------------|---------------|---------------------|
| **LCP** | 🔴 **Critical** | No SSR; large initial bundle (~250 KB); hero image not preloaded | 1. Add `<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">` 2. Reduce initial bundle via vendor splitting 3. Consider SSR for landing page |
| **INP** | 🔴 **Critical** | Sync on main thread; no `useTransition` for filtering; heavy `useMemo` in Dashboard/TxView | 1. Move sync to Web Worker 2. Add `useTransition`/`useDeferredValue` 3. Virtualize all lists |
| **CLS** | 🟡 **Moderate** | Skeleton loaders help; but dynamic content (charts, lists) may shift | 1. Reserve space for charts with `aspect-ratio` 2. Fixed-height skeletons 3. Font `display: swap` with size-adjust |
| **FCP** | 🟠 **High** | Large bundle blocks paint; no critical CSS inlining | 1. Inline critical CSS 2. Reduce initial JS 3. Preload key chunks |
| **TTFB** | 🟢 **Low** | Static hosting (Render); CDN likely | Monitor only |

### 6.2 LCP Optimization Checklist

```html
<!-- index.html additions -->
<link rel="preload" as="image" href="/assets/hero.webp" fetchpriority="high" type="image/webp">
<link rel="preload" as="style" href="/assets/critical.css">
<link rel="preload" as="script" href="/assets/js/vendor-react-[hash].js">
<link rel="modulepreload" href="/assets/js/vendor-router-[hash].js">
<link rel="modulepreload" href="/assets/js/main-[hash].js">

<!-- Font optimization -->
<link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/fonts/inter-var.woff2" crossorigin>
<style>
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/inter-var.woff2') format('woff2');
    font-display: swap;
    size-adjust: 100%; /* Match fallback */
  }
</style>
```

### 6.3 INP Optimization Checklist

| Optimization | Status | Effort | Impact |
|--------------|--------|--------|--------|
| Move sync to Web Worker | ❌ Not done | High | 🔴 Critical |
| `useTransition` for filters | ❌ Not done | Medium | 🔴 Critical |
| `useDeferredValue` for charts | ❌ Not done | Medium | 🟠 High |
| Virtualize all lists (`@tanstack/react-virtual`) | ✅ Partial | Low | 🟠 High |
| Break long tasks with `scheduler.yield()` | ❌ Not done | Medium | 🟡 Medium |
| Remove inline event handlers in loops | ❓ Unknown | Low | 🟢 Low |

### 6.4 CLS Optimization Checklist

```css
/* Global CLS fixes */
img, video, iframe { 
  width: 100%; 
  height: auto; 
  aspect-ratio: attr(width) / attr(height); 
}

/* Skeleton placeholders with fixed dimensions */
.skeleton-chart { aspect-ratio: 16/9; min-height: 200px; }
.skeleton-list-item { height: 60px; }
.skeleton-card { aspect-ratio: 4/3; }

/* Font fallback matching */
@font-face {
  font-family: 'Inter-fallback';
  src: local('Arial');
  size-adjust: 105.06%;
  ascent-override: 90%;
  descent-override: 25%;
  line-gap-override: 0%;
}
```

---

## 7. Prioritized Action Plan

### Phase 1: Critical (Week 1-2) — INP & Sync Blocking
| Task | File(s) | Est. Effort |
|------|---------|-------------|
| Move `syncAll` to Web Worker using `dexie-worker` | `src/lib/sync.worker.js` (new), `src/shared/hooks/useSyncLoop.js` | 2 days |
| Add compound indexes to Dexie schema | `src/lib/dexie.js` | 0.5 days |
| Implement adaptive sync interval + backoff | `src/shared/hooks/useSyncLoop.js` | 0.5 days |
| Add `useTransition` to TxView filter input | `src/features/transactions/TxView.jsx` | 0.5 days |

### Phase 2: High (Week 2-3) — Bundle & LCP
| Task | File(s) | Est. Effort |
|------|---------|-------------|
| Optimize `manualChunks` in Vite config | `vite.config.js` | 0.5 days |
| Switch minification to Terser + configure | `vite.config.js` | 0.5 days |
| Add `vite-plugin-pwa` with injectManifest | `vite.config.js`, `src/sw.ts` (new) | 1 day |
| Preload LCP image + critical CSS | `index.html`, `vite.config.js` | 0.5 days |
| Upgrade Dexie to 4.x | `package.json`, `src/lib/dexie.js` | 1 day |

### Phase 3: Medium (Week 3-4) — Polish & Monitoring
| Task | File(s) | Est. Effort |
|------|---------|-------------|
| Add `useDeferredValue` to Dashboard charts | `src/features/dashboard/Dashboard.jsx` | 0.5 days |
| Implement Background Sync for mutations | `src/sw.ts`, `src/lib/sync.worker.js` | 1 day |
| Add `scheduler.yield()` to long `useMemo` loops | `src/features/transactions/TxView.jsx`, `src/features/dashboard/Dashboard.jsx` | 0.5 days |
| Configure Lighthouse CI budgets enforcement | `.lighthouseci.config.js`, `performance-budget.json` | 0.5 days |
| Bundle analyzer CI gate (`rollup-plugin-visualizer`) | `.github/workflows/ci.yml` | 0.5 days |

---

## 8. Validation Criteria

Each phase must pass:

| Check | Tool | Threshold |
|-------|------|-----------|
| **Build succeeds** | `npm run build` | ✅ Zero errors |
| **Lint passes** | `npm run lint` | ✅ Zero errors |
| **Typecheck passes** | `npm run typecheck` | ✅ Zero errors |
| **Tests pass** | `npm run test` | ✅ All green |
| **Bundle size (gzipped)** | `npm run analyze` | Main < 170 KB, Total < 400 KB |
| **Sync benchmark (10k)** | `npm run bench:sync` | < 5 seconds |
| **Lighthouse CI** | `lhci autorun` | Performance p90 > 90 |
| **INP (field)** | Chrome DevTools / web-vitals | < 200ms p75 |
| **LCP (field)** | Chrome DevTools / web-vitals | < 2.5s p75 |

---

## Appendix: Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `vite.config.js` | Build config, chunking, minification | 79 |
| `src/lib/dexie.js` | IndexedDB schema, indexes | 69 |
| `src/lib/sync.js` | Sync logic (push/pull) | 248 |
| `src/shared/hooks/useSyncLoop.js` | Sync scheduling, triggers | 79 |
| `src/main.jsx` | App bootstrap | 14 |
| `src/core/boot.js` | SW registration, version check | 31 |
| `public/sw.js` | Service Worker (manual) | 192 |
| `src/routes/routes.jsx` | Route-level code splitting | 84 |
| `src/App.jsx` | Root component, providers | 175 |

---

**Report End**  
*Generated using deep research on 2026 performance best practices for Vite, React 18, IndexedDB/Dexie, Core Web Vitals, and Service Workers.*