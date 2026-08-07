# CI Report

**Gerado:** 2026-08-07 16:59 UTC
**Commit:** `e94b65239c68b17fac27d051dfa813c9392d8637`
**Branch:** `main`

---

## Status Geral

| Verificacao | Status |
|---|---|
| Lint + Typecheck | ok |
| Testes Unitarios | nao executado |
| Testes Integracao | com falhas |
| Build | ok |
| E2E Tests | com falhas |
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
[32m✓[39m 256 modules transformed.
Generated an empty chunk: "supabase-vendor".
rendering chunks...
[1m[33m[plugin:vite:reporter][39m[22m [33m[plugin vite:reporter] 
(!) /home/runner/work/Financia/Financia/src/lib/sync.js is dynamically imported by /home/runner/work/Financia/Financia/src/shared/hooks/useSyncLoop.js but also statically imported by /home/runner/work/Financia/Financia/src/features/admin/AdminPanel.jsx, /home/runner/work/Financia/Financia/src/features/admin/ClientEditModal.jsx, /home/runner/work/Financia/Financia/src/features/auth/useSession.js, /home/runner/work/Financia/Financia/src/features/settings/SettingsView.jsx, dynamic import will not move module into another chunk.
[39m
computing gzip size...
[2mdist/[22m[32mmanifest.webmanifest                  [39m[1m[2m  0.59 kB[22m[1m[22m
[2mdist/[22m[32mindex.html                            [39m[1m[2m  2.98 kB[22m[1m[22m[2m │ gzip:  0.97 kB[22m
[2mdist/[22m[2massets/[22m[32msync.worker-IZvltoFp.js        [39m[1m[2m103.31 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-B3S8XtFS.css             [39m[1m[2m 58.90 kB[22m[1m[22m[2m │ gzip: 12.24 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-vendor-vwDjcXxQ.js    [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36museDebouncedValue-2VSGL6HB.js  [39m[1m[2m  0.21 kB[22m[1m[22m[2m │ gzip:  0.17 kB[22m
[2mdist/[22m[2massets/[22m[36mDebugBadge-C9B5q9cL.js         [39m[1m[2m  0.83 kB[22m[1m[22m[2m │ gzip:  0.47 kB[22m
[2mdist/[22m[2massets/[22m[36mlogoUtils-MfeTYmyk.js          [39m[1m[2m  0.88 kB[22m[1m[22m[2m │ gzip:  0.46 kB[22m
[2mdist/[22m[2massets/[22m[36mvirtual-vendor-DNVO4DF9.js     [39m[1m[2m  1.82 kB[22m[1m[22m[2m │ gzip:  0.92 kB[22m
[2mdist/[22m[2massets/[22m[36maiClient-DBUWwWeR.js           [39m[1m[2m  2.81 kB[22m[1m[22m[2m │ gzip:  1.48 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-B-p9KxkL.js          [39m[1m[2m  4.25 kB[22m[1m[22m[2m │ gzip:  1.79 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-C2b18x3N.js          [39m[1m[2m  5.13 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-acFM_Z_2.js        [39m[1m[2m  6.26 kB[22m[1m[22m[2m │ gzip:  2.76 kB[22m
[2mdist/[22m[2massets/[22m[36mSaleForm-CgUz2qB1.js           [39m[1m[2m  7.44 kB[22m[1m[22m[2m │ gzip:  2.51 kB[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPolicy-CH0ZArG1.js      [39m[1m[2m  8.15 kB[22m[1m[22m[2m │ gzip:  3.38 kB[22m
[2mdist/[22m[2massets/[22m[36mTermsOfService-Bi1ncqZq.js     [39m[1m[2m  8.91 kB[22m[1m[22m[2m │ gzip:  3.61 kB[22m
[2mdist/[22m[2massets/[22m[36mReportView-DsjUKUBD.js         [39m[1m[2m 10.28 kB[22m[1m[22m[2m │ gzip:  3.09 kB[22m
[2mdist/[22m[2mass
```

---

## E2E Tests (chromium)

| Status |
|---|
| com falhas |

```

Running 26 tests using 4 workers
°··°°°°°°°°····°°°°···F°··

  1) [chromium] › e2e/auth-flow.spec.ts:45:3 › Auth Flow › login form shows validation errors on empty submit 

    Error: expect(locator).toBeVisible() failed

    Locator: locator('text=obrigatório').first()
    Expected: visible
    Timeout: 10000ms
    Error: element(s) not found

    Call log:
      - Expect "toBeVisible" with timeout 10000ms
      - waiting for locator('text=obrigatório').first()


      63 |
      64 |     const emailError = page.locator('text=obrigatório').first();
    > 65 |     await expect(emailError).toBeVisible({ timeout: 10000 });
         |                              ^
      66 |   });
      67 |
      68 |   test('authenticated user sees dashboard via storageState', async ({ page, browser }) => {
        at /home/runner/work/Financia/Financia/e2e/auth-flow.spec.ts:65:30

    Error Context: test-results/auth-flow-Auth-Flow-login--49015-tion-errors-on-empty-submit-chromium/error-context.md

  1 failed
    [chromium] › e2e/auth-flow.spec.ts:45:3 › Auth Flow › login form shows validation errors on empty submit 
  14 skipped
  11 passed (17.0s)

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
  2) [chromium] › e2e/memory-leak.spec.ts:207:3 › Offline Storage Persistence › navigator.storage.persist() prevents eviction 

    Error: page.evaluate: Execution context was destroyed, most likely because of a navigation

      209 |     await page.waitForLoadState('networkidle');
      210 |     
    > 211 |     const persisted = await page.evaluate(async () => {
          |                                  ^
      212 |       if ('storage' in navigator && 'persist' in navigator.storage) {
      213 |         return await navigator.storage.persist();
      214 |       }
        at /home/runner/work/Financia/Financia/e2e/memory-leak.spec.ts:211:34

    Error Context: test-results/memory-leak-Offline-Storag-ee824-e-persist-prevents-eviction-chromium/error-context.md


[19/42] [chromium] › e2e/network-error-handling.spec.ts:10:3 › Network Error Handling Scenarios › app loads successfully with slow network (3G)
[20/42] [chromium] › e2e/network-error-handling.spec.ts:34:3 › Network Error Handling Scenarios › app handles complete network disconnection gracefully
[21/42] [chromium] › e2e/network-error-handling.spec.ts:48:3 › Network Error Handling Scenarios › app handles intermittent network failures
[22/42] [chromium] › e2e/network-error-handling.spec.ts:64:3 › Network Error Handling Scenarios › fetch to missing endpoint returns handled error
[23/42] [chromium] › e2e/network-error-handling.spec.ts:82:3 › Network Error Handling Scenarios › WebSocket connection failure is handled gracefully
[24/42] [chromium] › e2e/network-perf.spec.ts:157:3 › Network Performance & Sync Loop Detection › detect sync loops, icon loops, and excessive network activity
[25/42] [chromium] › e2e/offline-state-corruption.spec.ts:10:3 › Deep Edge Cases — Offlin
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
| 2026-08-07 16:59 UTC | CI report gerado automaticamente | `e94b65239c68b17fac27d051dfa813c9392d8637` |
