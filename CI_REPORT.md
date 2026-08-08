# CI Report

**Gerado:** 2026-08-08 15:22 UTC
**Commit:** `eae2a191f5264af5d065df408df74dce8d85a945`
**Branch:** `main`

---

## Status Geral

| Verificacao | Status |
|---|---|
| Lint + Typecheck | ok |
| Testes Unitarios | nao executado |
| Testes Integracao | com falhas |
| Build | com erros |
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
[2mdist/[22m[2massets/[22m[36mlogoUtils-aR_cQwhm.js               [39m[1m[2m  0.88 kB[22m[1m[22m[2m │ gzip:  0.46 kB[22m
[2mdist/[22m[2massets/[22m[36mvirtual-vendor-DNVO4DF9.js          [39m[1m[2m  1.82 kB[22m[1m[22m[2m │ gzip:  0.92 kB[22m
[2mdist/[22m[2massets/[22m[36maiClient-Btj1Und3.js                [39m[1m[2m  2.81 kB[22m[1m[22m[2m │ gzip:  1.48 kB[22m
[2mdist/[22m[2massets/[22m[36mPullToRefreshIndicator-e6BVHaQd.js  [39m[1m[2m  3.16 kB[22m[1m[22m[2m │ gzip:  1.31 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-B-p9KxkL.js               [39m[1m[2m  4.25 kB[22m[1m[22m[2m │ gzip:  1.79 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-DZFr2JwZ.js               [39m[1m[2m  5.13 kB[22m[1m[22m[2m │ gzip:  2.06 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-CCdWHBbQ.js             [39m[1m[2m  6.26 kB[22m[1m[22m
```

---

## E2E Tests (chromium)

| Status |
|---|
| com falhas |

```

Running 26 tests using 4 workers
°··°°°°°°°°·F··°°°°···°··T

  1) [chromium] › e2e/auth-flow.spec.ts:44:3 › Auth Flow › login form shows validation errors on empty submit 

    Test timeout of 45000ms exceeded.

    Error: locator.click: Test timeout of 45000ms exceeded.
    Call log:
      - waiting for locator('form button[type="submit"]:has-text("Entrar")')
        - locator resolved to <button type="submit" class="w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition hover:opacity-90">Entrar</button>
      - attempting click action
        - waiting for element to be visible, enabled and stable
      - element was detached from the DOM, retrying


      66 |     }
      67 |
    > 68 |     await submitBtn.click();
         |                     ^
      69 |     // Wait for validation errors to appear - use expect.poll for more resilient waiting
      70 |     await expect(page.locator('input[aria-invalid="true"]').first()).toBeVisible({ timeout: 10000 });
      71 |     await expect(page.getByText('Campo obrigatório').first()).toBeVisible({ timeout: 10000 });
        at /home/runner/work/Financia/Financia/e2e/auth-flow.spec.ts:68:21

    Error Context: test-results/auth-flow-Auth-Flow-login--49015-tion-errors-on-empty-submit-chromium/error-context.md

  2) [chromium] › e2e/deep-sync-conflict.spec.ts:94:3 › Deep Sync Conflict Scenarios › sync worker survives unhandled rejection 

    Error: page.evaluate: Execution context was destroyed, most likely because of a navigation

      104 |
      105 |     // Dispatch an unhandled rejection - the app should not crash
    > 106 |     await page.evaluate(() => {
          |                ^
      107 |       const rejection = new Error('test rejection');
      108 |       window.dispatchEvent(new PromiseRejectionEvent('unhandledrejection', {
      109 |         promise: Promise.reject(rejection),
        at /home/runner/work/Financia/Financia/e2e/deep-sync-conflict.spec.ts:106:16

    Error Context: test-results/deep-sync-conflict-Deep-Sy-7a968-urvives-unhandled-rejection-chromium/error-context.md

  2 failed
    [chromium] › e2e/auth-flow.spec.ts:44:3 › Auth Flow › login form shows validation errors on empty submit 
    [chromium] › e2e/deep-sync-conflict.spec.ts:94:3 › Deep Sync Conflict Scenarios › sync worker survives unhandled rejection 
  14 skipped
  10 passed (47.8s)

```

---

## Integration Tests

| Status |
|---|
| com falhas |

```

Running 42 tests using 4 workers

[1/42] [chromium] › e2e/deep-sync-conflict.spec.ts:121:3 › Deep Sync Conflict Scenarios › memory leak check after sync broadcast storm
[2/42] [chromium] › e2e/deep-sync-conflict.spec.ts:10:3 › Deep Sync Conflict Scenarios › BroadcastChannel ping/pong survives rapid tab switching
[3/42] [chromium] › e2e/deep-sync-conflict.spec.ts:59:3 › Deep Sync Conflict Scenarios › BroadcastChannel handles duplicate messages without errors
[4/42] [chromium] › e2e/deep-sync-conflict.spec.ts:94:3 › Deep Sync Conflict Scenarios › sync worker survives unhandled rejection
[5/42] [chromium] › e2e/indexeddb-corruption.spec.ts:12:5 › IndexedDB Recovery - Corruption › Corruption Simulation › should recover from corrupted IndexedDB data
[6/42] [chromium] › e2e/indexeddb-corruption.spec.ts:65:5 › IndexedDB Recovery - Corruption › Corruption Simulation › should handle invalid schema gracefully
[7/42] [chromium] › e2e/indexeddb-eviction.spec.ts:12:5 › IndexedDB Recovery - Eviction › Eviction Test › should handle storage pressure and persist()
[8/42] [chromium] › e2e/indexeddb-eviction.spec.ts:89:5 › IndexedDB Recovery - Eviction › Eviction Test › should estimate storage quota
  1) [chromium] › e2e/indexeddb-eviction.spec.ts:12:5 › IndexedDB Recovery - Eviction › Eviction Test › should handle storage pressure and persist() 

    Error: page.evaluate: Execution context was destroyed, most likely because of a navigation

      27 |       expect(persistSupported.supported).toBeTruthy();
      28 |
    > 29 |       await page.evaluate(async () => {
         |                  ^
      30 |         const dbName = 'financia-db';
      31 |         const storeName = 'transactions';
      32 |         const largeData = 'x'.repeat(100 * 1024); // 100KB per entry
        at /home/runner/work/Financia/Financia/e2e/indexeddb-eviction.spec.ts:29:18

    Error Context: test-results/indexeddb-eviction-Indexed-f1bab-orage-pressure-and-persist--chromium/error-context.md


[9/42] [chromium] › e2e/indexeddb-migration.spec.ts:92:5 › IndexedDB Recovery - Migration › Migration Test › should preserve data integrity during migration
[10/42] [chromium] › e2e/indexeddb-migration.spec.ts:12:5 › IndexedDB Recovery - Migration › Migration Test › should migrate from old schema to new schema
[11/42] [chromium] › e2e/memory-leak.spec.ts:6:3 › Memory Leak Detection › cyclic navigation - no detached DOM nodes
[12/42] [chromium] › e2e/memory-leak.spec.ts:57:3 › Memory Leak Detection › event listeners cleaned up on unmount
  2) [chromium] › e2e/memory-leak.spec.ts:6:3 › Memory Leak Detection › cyclic navigation - no detached DOM nodes 

    Error: page.goto: Navigation to "http://localhost:4173/#/vendas" is interrupted by another navigation to "http://localhost:4173/#/"
    Call log:
      - navigating to "http://localhost:4173/#/vendas", waiting until "load"


      29 |     for (let i = 0; i < 50; i++) {
      30 |       const route = routes[i % routes.length];
    > 31 |       await page.goto(route);
         |                  ^
      32 |       await page.waitForLoadState('networkidle');
      33 |       await page.waitForTimeout(100); // Small delay for GC
      34 |     }
        at /home/runner/work/Financia/Financia/e2e/memory-leak.spec.ts:31:18

    Error Context: test-results/memory-leak-Memory-Leak-De-d737a-ion---no-detached-DOM-nodes-chromium/error-context.md


[13/42] [chromium] › e2e/memory-leak.spec.ts:110:3 › Memory Leak Detection › IndexedDB connections closed properly
[14/42] [chromium] › e2e/memory-leak.spec.ts:84:3 › Memory Leak Detection › timers and intervals cleared on unmount
  3) [chromium] › e2e/indexeddb-migration.spec.ts:12:5 › IndexedDB Recovery - Migration › Migration Test › should migrate from old schema to new schema 

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


[15/42] [chromium] › e2e/memory-leak.spec.ts:164:3 › Memory Leak Detection › memory usage stable under load
[16/42] [chromium] › e2e/memory-leak.spec.ts:207:3 › Offline Storage Persistence › navigator.storage.persist() prevents eviction
[17/42] [chromium] › e2e/memory-leak.spec.ts:222:3 › Offline Storage Persistence › storage estimate available
[18/42] [chromium] › e2e/memory-leak.spec.ts:135:3 › Memory Leak Detection › BroadcastChannel closed on unmount
[19/42] [chromium] › e2e/network-error-handling.spec.ts:10:3 › Network Error Handling Scenarios › a
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
| 2026-08-08 15:22 UTC | CI report gerado automaticamente | `eae2a191f5264af5d065df408df74dce8d85a945` |
