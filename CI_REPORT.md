# CI Report

**Gerado:** 2026-08-07 14:46 UTC
**Commit:** `17745b6264aef294b1ceded2b031c943961b73eb`
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
Circular chunk: vendor-radix-slot -> vendor-radix -> vendor-radix-slot. Please adjust the manual chunk logic for these chunks.
Generated an empty chunk: "vendor-supabase".
rendering chunks...
[1m[33m[plugin:vite:reporter][39m[22m [33m[plugin vite:reporter] 
(!) /home/runner/work/Financia/Financia/src/lib/sync.js is dynamically imported by /home/runner/work/Financia/Financia/src/shared/hooks/useSyncLoop.js but also statically imported by /home/runner/work/Financia/Financia/src/features/admin/AdminPanel.jsx, /home/runner/work/Financia/Financia/src/features/admin/ClientEditModal.jsx, /home/runner/work/Financia/Financia/src/features/auth/useSession.js, /home/runner/work/Financia/Financia/src/features/settings/SettingsView.jsx, dynamic import will not move module into another chunk.
[39m
computing gzip size...
[2mdist/[22m[32mindex.html                                [39m[1m[2m  3.20 kB[22m[1m[22m[2m │ gzip:  1.00 kB[22m
[2mdist/[22m[2massets/[22m[32msync.worker-C2sOlgyF.js            [39m[1m[2m 81.74 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-DfvdNLjY.css                 [39m[1m[2m 58.60 kB[22m[1m[22m[2m │ gzip: 12.16 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-vwDjcXxQ.js        [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36museDebouncedValue-DhXJ-2MC.js      [39m[1m[2m  0.21 kB[22m[1m[22m[2m │ gzip:  0.17 kB[22m
[2mdist/[22m[2massets/[22m[36mDebugBadge-CuG2Hgqz.js             [39m[1m[2m  0.83 kB[22m[1m[22m[2m │ gzip:  0.47 kB[22m
[2mdist/[22m[2massets/[22m[36mlogoUtils-CUqU8TUW.js              [39m[1m[2m  0.88 kB[22m[1m[22m[2m │ gzip:  0.46 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-radix-0j1Bgcl0.js           [39m[1m[2m  1.05 kB[22m[1m[22m[2m │ gzip:  0.62 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-class-utils-BGivqV-2.js     [39m[1m[2m  1.12 kB[22m[1m[22m[2m │ gzip:  0.56 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-virtual-BFXXfAAg.js         [39m[1m[2m  1.82 kB[22m[1m[22m[2m │ gzip:  0.91 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-radix-slot-CD8tn4BR.js      [39m[1m[2m  2.03 kB[22m[1m[22m[2m │ gzip:  0.98 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-stripe-core-CUtUkgyj.js     [39m[1m[2m  2.25 kB[22m[1m[22m[2m │ gzip:  1.00 kB[22m
[2mdist/[22m[2massets/[22m[36maiClient-Chl6X_9a.js               [39m[1m[2m  2.81 kB[22m[1m[22m[2m │ gzip:  1.48 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-BRcQ71Kn.js              [39m[1m[2m  4.25 kB[22m[1m[22m[2m │ gzip:  1.79 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-wjX4-Xye.js              [39m[1m[2m  5.22 kB[22m[1m[22m[2m │ gzip:  2.09 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-wpabWaRi.j
```

---

## E2E Tests (chromium)

| Status |
|---|
| ok |

```

Running 26 tests using 4 workers
°°°·°°°°°°°°···°°·°°··°···
  16 skipped
  10 passed (15.6s)

```

---

## Integration Tests

| Status |
|---|
| com falhas |

```

Running 42 tests using 4 workers

[1/42] [chromium] › e2e/deep-sync-conflict.spec.ts:120:3 › Deep Sync Conflict Scenarios › memory leak check after sync broadcast storm
[2/42] [chromium] › e2e/deep-sync-conflict.spec.ts:94:3 › Deep Sync Conflict Scenarios › sync worker survives unhandled rejection
[3/42] [chromium] › e2e/deep-sync-conflict.spec.ts:10:3 › Deep Sync Conflict Scenarios › BroadcastChannel ping/pong survives rapid tab switching
[4/42] [chromium] › e2e/deep-sync-conflict.spec.ts:59:3 › Deep Sync Conflict Scenarios › BroadcastChannel handles duplicate messages without errors
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
| 2026-08-07 14:46 UTC | CI report gerado automaticamente | `17745b6264aef294b1ceded2b031c943961b73eb` |
