# CI Report

**Gerado:** 2026-08-07 20:52 UTC
**Commit:** `1b65a3ed3e54ab82495d86e702405b8720f14b0f`
**Branch:** `main`

---

## Status Geral

| Verificacao | Status |
|---|---|
| Lint + Typecheck | com erros |
| Testes Unitarios | nao executado |
| Testes Integracao | com falhas |
| Build | com erros |
| E2E Tests | com falhas |
| Auditoria de Producao | ver resultado abaixo |
| Admin Audit | ver resultado abaixo |

---

## Lint Errors (Top 200 linhas)

```

/home/runner/work/Financia/Financia/src/App.jsx
  1:64  warning  'useState' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/features/auth/WebAuthn.jsx
  48:8   warning  'actionLabel' is assigned a value but never used. Allowed unused vars must match /^_/u     @typescript-eslint/no-unused-vars
  48:21  warning  'setActionLabel' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/features/reports/ReportView.jsx
  15:7  warning  'listRef' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/shared/GlobalErrorBoundary.jsx
  22:14  warning  'e' is defined but never used. Allowed unused caught errors must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/shared/hooks/usePullToRefresh.js
  102:55  warning  The ref value 'rafRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'rafRef.current' to a variable inside the effect, and use that variable in the cleanup function  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/shared/hooks/usePullToRefresh.test.js
  92:11  warning  'result' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/shared/hooks/useSchedulerYield.js
  23:9   warning  'yieldToMain' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  37:28  warning  'yieldEvery' is assigned a value but never used. Allowed unused vars must match /^_/u   @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/shared/hooks/useSwipeActions.js
  9:7  warning  The 'actions' logical expression could make the dependencies of useCallback Hook (at line 45) change on every render. Move it inside the useCallback callback. Alternatively, wrap the initialization of 'actions' in its own useMemo() Hook  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/shared/hooks/useSwipeActions.test.js
    1:36  warning  'beforeEach' is defined but never used. Allowed unused vars must match /^_/u       @typescript-eslint/no-unused-vars
   95:11  warning  'result' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  140:11  warning  'result' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  155:11  warning  'result' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/shared/ui/CommandPalette.jsx
  1:55  warning  'useCallback' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

✖ 15 problems (0 errors, 15 warnings)


```

---

## Test Results (ultimas 40 linhas)

```

```

---

## Build Output (ultimas 30 linhas)

```

> gestao-financeira@5.1.1 build
> vite build

[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 260 modules transformed.
Generated an empty chunk: "supabase-vendor".
rendering chunks...
[1m[33m[plugin:vite:reporter][39m[22m [33m[plugin vite:reporter] 
(!) /home/runner/work/Financia/Financia/src/lib/sync.js is dynamically imported by /home/runner/work/Financia/Financia/src/shared/hooks/useSyncLoop.js but also statically imported by /home/runner/work/Financia/Financia/src/features/admin/AdminPanel.jsx, /home/runner/work/Financia/Financia/src/features/admin/ClientEditModal.jsx, /home/runner/work/Financia/Financia/src/features/auth/useSession.js, /home/runner/work/Financia/Financia/src/features/settings/SettingsView.jsx, dynamic import will not move module into another chunk.
[39m
4 rules skipped due to selector errors:
  ::view-transition-old(root) -> Pseudo-elements are not supported by css-select
  ::view-transition-new(root) -> Pseudo-elements are not supported by css-select
  ::view-transition-old(root) -> Pseudo-elements are not supported by css-select
  ::view-transition-new(root) -> Pseudo-elements are not supported by css-select
computing gzip size...
[2mdist/[22m[32mmanifest.webmanifest                       [39m[1m[2m  0.59 kB[22m[1m[22m
[2mdist/[22m[32mindex.html                                 [39m[1m[2m  9.65 kB[22m[1m[22m[2m │ gzip:  3.33 kB[22m
[2mdist/[22m[2massets/[22m[32msync.worker-DU9L2bZD.js             [39m[1m[2m103.98 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-BIP6msm6.css                  [39m[1m[2m 60.76 kB[22m[1m[22m[2m │ gzip: 12.48 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-vendor-vwDjcXxQ.js         [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36museDebouncedValue-2VSGL6HB.js       [39m[1m[2m  0.21 kB[22m[1m[22m[2m │ gzip:  0.17 kB[22m
[2mdist/[22m[2massets/[22m[36mDebugBadge-C9B5q9cL.js              [39m[1m[2m  0.83 kB[22m[1m[22m[2m │ gzip:  0.47 kB[22m
[2mdist/[22m[2massets/[22m[36mlogoUtils-Cgi33_w3.js               [39m[1m[2m  0.88 kB[22m[1m[22m[2m │ gzip:  0.46 kB[22m
[2mdist/[22m[2massets/[22m[36mvirtual-vendor-DNVO4DF9.js          [39m[1m[2m  1.82 kB[22m[1m[22m[2m │ gzip:  0.92 kB[22m
[2mdist/[22m[2massets/[22m[36maiClient-BqPGnT1z.js                [39m[1m[2m  2.81 kB[22m[1m[22m[2m │ gzip:  1.48 kB[22m
[2mdist/[22m[2massets/[22m[36mPullToRefreshIndicator-URuwPbQp.js  [39m[1m[2m  3.16 kB[22m[1m[22m[2m │ gzip:  1.31 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-B-p9KxkL.js               [39m[1m[2m  4.25 kB[22m[1m[22m[2m │ gzip:  1.79 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-5cNjE0NX.js               [39m[1m[2m  5.13 kB[22m[1m[22m[2m │ gzip:  2.06 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-Ctpj9oTs.js             [39m[1m[2m  6.26 kB[22m[1m[22m
```

---

## E2E Tests (chromium)

| Status |
|---|
| com falhas |

```

Running 26 tests using 4 workers
°··°°°°°°°°°F··°°°°···°···

  1) [chromium] › e2e/error-boundary-recovery.spec.ts:40:3 › Deep Error Boundary Recovery › window.onerror captures unhandled JS errors gracefully 

    Error: page.evaluate: Execution context was destroyed, most likely because of a navigation.

      42 |     await page.waitForLoadState('networkidle');
      43 |
    > 44 |     const errorCaptured = await page.evaluate(() => {
         |                                      ^
      45 |       return new Promise<boolean>((resolve) => {
      46 |         const handler = function(msg: string, source: string, lineno: number, colno: number, error: Error) {
      47 |           window.onerror = null;
        at /home/runner/work/Financia/Financia/e2e/error-boundary-recovery.spec.ts:44:38

    Error Context: test-results/error-boundary-recovery-De-5f324-andled-JS-errors-gracefully-chromium/error-context.md

  1 failed
    [chromium] › e2e/error-boundary-recovery.spec.ts:40:3 › Deep Error Boundary Recovery › window.onerror captures unhandled JS errors gracefully 
  15 skipped
  10 passed (14.5s)

```

---

## Integration Tests

| Status |
|---|
| com falhas |

```

Running 42 tests using 4 workers

[1/42] [chromium] › e2e/deep-sync-conflict.spec.ts:120:3 › Deep Sync Conflict Scenarios › memory leak check after sync broadcast storm
[2/42] [chromium] › e2e/deep-sync-conflict.spec.ts:59:3 › Deep Sync Conflict Scenarios › BroadcastChannel handles duplicate messages without errors
[3/42] [chromium] › e2e/deep-sync-conflict.spec.ts:10:3 › Deep Sync Conflict Scenarios › BroadcastChannel ping/pong survives rapid tab switching
[4/42] [chromium] › e2e/deep-sync-conflict.spec.ts:94:3 › Deep Sync Conflict Scenarios › sync worker survives unhandled rejection
[5/42] [chromium] › e2e/indexeddb-corruption.spec.ts:65:5 › IndexedDB Recovery - Corruption › Corruption Simulation › should handle invalid schema gracefully
[6/42] [chromium] › e2e/indexeddb-corruption.spec.ts:12:5 › IndexedDB Recovery - Corruption › Corruption Simulation › should recover from corrupted IndexedDB data
[7/42] [chromium] › e2e/indexeddb-eviction.spec.ts:12:5 › IndexedDB Recovery - Eviction › Eviction Test › should handle storage pressure and persist()
[8/42] [chromium] › e2e/indexeddb-eviction.spec.ts:89:5 › IndexedDB Recovery - Eviction › Eviction Test › should estimate storage quota
[9/42] [chromium] › e2e/indexeddb-migration.spec.ts:12:5 › IndexedDB Recovery - Migration › Migration Test › should migrate from old schema to new schema
[10/42] [chromium] › e2e/indexeddb-migration.spec.ts:92:5 › IndexedDB Recovery - Migration › Migration Test › should preserve data integrity during migration
[11/42] [chromium] › e2e/memory-leak.spec.ts:6:3 › Memory Leak Detection › cyclic navigation - no detached DOM nodes
  1) [chromium] › e2e/indexeddb-migration.spec.ts:12:5 › IndexedDB Recovery - Migration › Migration Test › should migrate from old schema to new schema 

    Error: page.evaluate: AbortError: Version change transaction was aborted in upgradeneeded event handler.

      39 |       await page.waitForLoadState('networkidle');
      40 |
    > 41 |       const migratedData = await page.evaluate(async () => {
         |                                       ^
      42 |         const dbName = 'gestao_offline';
      43 |         
      44 |         return new Promise<any[]>((resolve, reject) => {
        at /home/runner/work/Financia/Financia/e2e/indexeddb-migration.spec.ts:41:39

    Error Context: test-results/indexeddb-migration-Indexe-ccb35-om-old-schema-to-new-schema-chromium/error-context.md


[12/42] [chromium] › e2e/memory-leak.spec.ts:84:3 › Memory Leak Detection › timers and intervals cleared on unmount
[13/42] [chromium] › e2e/memory-leak.spec.ts:110:3 › Memory Leak Detection › IndexedDB connections closed properly
[14/42] [chromium] › e2e/memory-leak.spec.ts:57:3 › Memory Leak Detection › event listeners cleaned up on unmount
[15/42] [chromium] › e2e/memory-leak.spec.ts:135:3 › Memory Leak Detection › BroadcastChannel closed on unmount
[16/42] [chromium] › e2e/memory-leak.spec.ts:164:3 › Memory Leak Detection › memory usage stable under load
[17/42] [chromium] › e2e/memory-leak.spec.ts:207:3 › Offline Storage Persistence › navigator.storage.persist() prevents eviction
[18/42] [chromium] › e2e/memory-leak.spec.ts:222:3 › Offline Storage Persistence › storage estimate available
[19/42] [chromium] › e2e/network-error-handling.spec.ts:10:3 › Network Error Handling Scenarios › app loads successfully with slow network (3G)
[20/42] [chromium] › e2e/network-error-handling.spec.ts:34:3 › Network Error Handling Scenarios › app handles complete network disconnection gracefully
[21/42] [chromium] › e2e/network-error-handling.spec.ts:48:3 › Network Error Handling Scenarios › app handles intermittent network failures
[22/42] [chromium] › e2e/network-error-handling.spec.ts:64:3 › Network Error Handling Scenarios › fetch to missing endpoint returns handled error
[23/42] [chromium] › e2e/network-error-handling.spec.ts:82:3 › Network Error Handling Scenarios › WebSocket connection failure is handled gracefully
[24/42] [chromium] › e2e/network-perf.spec.ts:157:3 › Network Performance & Sync Loop Detection › detect sync loops, icon loops, and excessive network activity
[25/42] [chromium] › e2e/offline-state-corruption.spec.ts:10:3 › Deep Edge Cases — Offline State Corruption & Recovery › IndexedDB corruption is handled gracefully — app does not crash on load
[26/42] [chromium] › e2e/offline-state-corruption.spec.ts:47:3 › Deep Edge Cases — Offline State Corruption & Recovery › app survives localStorage quota exceeded gracefully
[chromium] › e2e/network-perf.spec.ts:157:3 › Network Performance & Sync Loop Detection › detect sync loops, icon loops, and excessive network activity
[MONITOR] Waiting 15s to capture baseline network activity...

[27/42] [chromium] › e2e/offline-state-corruption.spec.ts:65:3 › Deep Edge Cases — Offline State Corruption & Recovery › sessionStorage does not survive new tab
[28/42] [chromium] › e2e/offline-state-corruption.spec.ts:86:3 › Deep Edge Cases — Offline State Corruption & Recovery › multip
```

---

## Producao Audit (chromium)

| Metric | Valor |
|---|---|
| Passou | 1 |
| Falhou | 0 |

---

## Admin Audit (producao — Firefox/Chromium)

| Metric | Valor |
|---|---|


Relatorio completo admin-audit-report.md disponivel como artifact.

### Resumo do Admin Audit

Nenhum relatorio admin gerado.

---

## Correcoes Aplicadas Recentemente

| Data | Correcao | Commit |
|------|----------|--------|
| 2026-08-07 20:52 UTC | CI report gerado automaticamente | `1b65a3ed3e54ab82495d86e702405b8720f14b0f` |
