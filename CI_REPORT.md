# CI Report

**Gerado:** 2026-08-07 16:45 UTC
**Commit:** `3e8a5259fefb73ff6d4ca94290c22c5d628c877a`
**Branch:** `main`

---

## Status Geral

| Verificacao | Status |
|---|---|
| Lint + Typecheck | ok |
| Testes Unitarios | nao executado |
| Testes Integracao | com falhas |
| Build | ok |
| E2E Tests | ok |
| Auditoria de Producao | ver resultado abaixo |
| Admin Audit | ver resultado abaixo |

---

## Lint Errors (Top 200 linhas)

```

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
[32m✓[39m 254 modules transformed.
Generated an empty chunk: "supabase-vendor".
rendering chunks...
[1m[33m[plugin:vite:reporter][39m[22m [33m[plugin vite:reporter] 
(!) /home/runner/work/Financia/Financia/src/lib/sync.js is dynamically imported by /home/runner/work/Financia/Financia/src/shared/hooks/useSyncLoop.js but also statically imported by /home/runner/work/Financia/Financia/src/features/admin/AdminPanel.jsx, /home/runner/work/Financia/Financia/src/features/admin/ClientEditModal.jsx, /home/runner/work/Financia/Financia/src/features/auth/useSession.js, /home/runner/work/Financia/Financia/src/features/settings/SettingsView.jsx, dynamic import will not move module into another chunk.
[39m
computing gzip size...
[2mdist/[22m[32mindex.html                            [39m[1m[2m  2.93 kB[22m[1m[22m[2m │ gzip:  0.95 kB[22m
[2mdist/[22m[2massets/[22m[32msync.worker-C2sOlgyF.js        [39m[1m[2m 81.74 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-B3S8XtFS.css             [39m[1m[2m 58.90 kB[22m[1m[22m[2m │ gzip: 12.24 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-vendor-vwDjcXxQ.js    [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36museDebouncedValue-Cp9IqjJm.js  [39m[1m[2m  0.21 kB[22m[1m[22m[2m │ gzip:  0.17 kB[22m
[2mdist/[22m[2massets/[22m[36mDebugBadge-D4BASGlw.js         [39m[1m[2m  0.83 kB[22m[1m[22m[2m │ gzip:  0.47 kB[22m
[2mdist/[22m[2massets/[22m[36mlogoUtils-DUxV2x-4.js          [39m[1m[2m  0.88 kB[22m[1m[22m[2m │ gzip:  0.46 kB[22m
[2mdist/[22m[2massets/[22m[36mvirtual-vendor-7CxHUxpg.js     [39m[1m[2m  1.82 kB[22m[1m[22m[2m │ gzip:  0.91 kB[22m
[2mdist/[22m[2massets/[22m[36maiClient-B3Fibsjd.js           [39m[1m[2m  2.81 kB[22m[1m[22m[2m │ gzip:  1.48 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-7fbU8CwG.js          [39m[1m[2m  4.25 kB[22m[1m[22m[2m │ gzip:  1.79 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-B9R3KGhj.js          [39m[1m[2m  5.13 kB[22m[1m[22m[2m │ gzip:  2.06 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-_hY5Ad7_.js        [39m[1m[2m  6.26 kB[22m[1m[22m[2m │ gzip:  2.76 kB[22m
[2mdist/[22m[2massets/[22m[36mSaleForm-Cmiw60bN.js           [39m[1m[2m  7.44 kB[22m[1m[22m[2m │ gzip:  2.51 kB[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPolicy-k8rODj0Q.js      [39m[1m[2m  8.15 kB[22m[1m[22m[2m │ gzip:  3.38 kB[22m
[2mdist/[22m[2massets/[22m[36mTermsOfService-CQiQI32O.js     [39m[1m[2m  8.91 kB[22m[1m[22m[2m │ gzip:  3.61 kB[22m
[2mdist/[22m[2massets/[22m[36mReportView-D7PxS6oX.js         [39m[1m[2m 10.28 kB[22m[1m[22m[2m │ gzip:  3.09 kB[22m
[2mdist/[22m[2massets/[22m[36mstripe-vendor-zQqjX4dC.js      [39m[1m[2m 12.07 kB[22m[1m[22m[2m │ gzip: 
```

---

## E2E Tests (chromium)

| Status |
|---|
| ok |

```

Running 26 tests using 4 workers
°°°·°°°°°°°°···°°°··°·°···
  16 skipped
  10 passed (16.1s)

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
[5/42] [chromium] › e2e/indexeddb-corruption.spec.ts:12:5 › IndexedDB Recovery - Corruption › Corruption Simulation › should recover from corrupted IndexedDB data
[6/42] [chromium] › e2e/indexeddb-corruption.spec.ts:65:5 › IndexedDB Recovery - Corruption › Corruption Simulation › should handle invalid schema gracefully
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
[17/42] [chromium] › e2e/memory-leak.spec.ts:222:3 › Offline Storage Persistence › storage estimate available
[18/42] [chromium] › e2e/memory-leak.spec.ts:207:3 › Offline Storage Persistence › navigator.storage.persist() prevents eviction
[19/42] [chromium] › e2e/network-error-handling.spec.ts:10:3 › Network Error Handling Scenarios › app loads successfully with slow network (3G)
[20/42] [chromium] › e2e/network-error-handling.spec.ts:34:3 › Network Error Handling Scenarios › app handles complete network disconnection gracefully
[21/42] [chromium] › e2e/network-error-handling.spec.ts:48:3 › Network Error Handling Scenarios › app handles intermittent network failures
[22/42] [chromium] › e2e/network-error-handling.spec.ts:64:3 › Network Error Handling Scenarios › fetch to missing endpoint returns handled error
[23/42] [chromium] › e2e/network-error-handling.spec.ts:82:3 › Network Error Handling Scenarios › WebSocket connection failure is handled gracefully
[24/42] [chromium] › e2e/network-perf.spec.ts:157:3 › Network Performance & Sync Loop Detection › detect sync loops, icon loops, and excessive network activity
[25/42] [chromium] › e2e/offline-state-corruption.spec.ts:10:3 › Deep Edge Cases — Offline State Corruption & Recovery › IndexedDB corruption is handled gracefully — app does not crash on load
[26/42] [chromium] › e2e/offline-state-corruption.spec.ts:47:3 › Deep Edge Cases — Offline State Corruption & Recovery › app survives localStorage quota exceeded gracefully
[27/42] [chromium] › e2e/offline-state-corruption.spec.ts:65:3 › Deep Edge Cases — Offline State Corruption & Recovery › sessionStorage does not survive new tab
[chromium] › e2e/network-perf.spec.ts:157:3 › Network Performance & Sync Loop Detection › detect sync loops, icon loops, and excessive network activity
[MONITOR] Waiting 15s to capture baseline network activity...

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
| 2026-08-07 16:45 UTC | CI report gerado automaticamente | `3e8a5259fefb73ff6d4ca94290c22c5d628c877a` |
