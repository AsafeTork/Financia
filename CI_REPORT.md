# CI Report

**Gerado:** 2026-08-10 10:46 UTC
**Commit:** `f5c701926409a1709cb8e7d769f1ee044e36b70d`
**Branch:** `main`

---

## Status Geral

| Verificacao | Status |
|---|---|
| Lint + Typecheck | ok |
| Testes Unitarios | nao executado |
| Testes Integracao | com falhas |
| Build | com erros |
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
[32m✓[39m 266 modules transformed.
Generated an empty chunk: "shared-runtime".
rendering chunks...
4 rules skipped due to selector errors:
  ::view-transition-old(root) -> Pseudo-elements are not supported by css-select
  ::view-transition-new(root) -> Pseudo-elements are not supported by css-select
  ::view-transition-old(root) -> Pseudo-elements are not supported by css-select
  ::view-transition-new(root) -> Pseudo-elements are not supported by css-select
computing gzip size...
[2mdist/[22m[32mmanifest.webmanifest                       [39m[1m[2m  0.59 kB[22m[1m[22m
[2mdist/[22m[32mindex.html                                 [39m[1m[2m 11.39 kB[22m[1m[22m[2m │ gzip:  3.69 kB[22m
[2mdist/[22m[2massets/[22m[32msync.worker-DU9L2bZD.js             [39m[1m[2m103.98 kB[22m[1m[22m
[2mdist/[22m[2massets/[22m[35mindex-CAIKJt_3.css                  [39m[1m[2m 60.22 kB[22m[1m[22m[2m │ gzip: 12.56 kB[22m
[2mdist/[22m[2massets/[22m[36mshared-runtime-vwDjcXxQ.js          [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36museDebouncedValue-2VSGL6HB.js       [39m[1m[2m  0.21 kB[22m[1m[22m[2m │ gzip:  0.17 kB[22m
[2mdist/[22m[2massets/[22m[36mDebugBadge-C9B5q9cL.js              [39m[1m[2m  0.83 kB[22m[1m[22m[2m │ gzip:  0.47 kB[22m
[2mdist/[22m[2massets/[22m[36mlogoUtils-CJZTDbMk.js               [39m[1m[2m  0.88 kB[22m[1m[22m[2m │ gzip:  0.46 kB[22m
[2mdist/[22m[2massets/[22m[36mvirtual-vendor-DNVO4DF9.js          [39m[1m[2m  1.82 kB[22m[1m[22m[2m │ gzip:  0.92 kB[22m
[2mdist/[22m[2massets/[22m[36maiClient-DsOu_xOS.js                [39m[1m[2m  2.87 kB[22m[1m[22m[2m │ gzip:  1.50 kB[22m
[2mdist/[22m[2massets/[22m[36mPullToRefreshIndicator-qGVDq_3U.js  [39m[1m[2m  3.31 kB[22m[1m[22m[2m │ gzip:  1.38 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-B-p9KxkL.js               [39m[1m[2m  4.25 kB[22m[1m[22m[2m │ gzip:  1.79 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-BCAhvPXG.js               [39m[1m[2m  5.17 kB[22m[1m[22m[2m │ gzip:  2.08 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-IWEidqVK.js             [39m[1m[2m  6.27 kB[22m[1m[22m[2m │ gzip:  2.76 kB[22m
[2mdist/[22m[2massets/[22m[36mSaleForm-DPg7fcXw.js                [39m[1m[2m  7.48 kB[22m[1m[22m[2m │ gzip:  2.52 kB[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPolicy-NqBoGVC-.js           [39m[1m[2m  8.17 kB[22m[1m[22m[2m │ gzip:  3.39 kB[22m
[2mdist/[22m[2massets/[22m[36mTermsOfService-CFYVQ0k6.js          [39m[1m[2m  8.93 kB[22m[1m[22m[2m │ gzip:  3.62 kB[22m
[2mdist/[22m[2massets/[22m[36mReportView-BhXU_grU.js              [39m[1m[2m 10.73 kB[22m[1m[22m[2m │ gzip:  3.27 kB[22m
[2mdist/[22m[2massets/[22m[36mstripe-vendo
```

---

## E2E Tests (chromium)

| Status |
|---|
| ok |

```

Running 26 tests using 4 workers
°···°°°°°°°°····°°°°···°··
  14 skipped
  12 passed (12.9s)

```

---

## Integration Tests

| Status |
|---|
| com falhas |

```

Running 42 tests using 4 workers

[1/42] [chromium] › e2e/deep-sync-conflict.spec.ts:94:3 › Deep Sync Conflict Scenarios › sync worker survives unhandled rejection
[2/42] [chromium] › e2e/deep-sync-conflict.spec.ts:59:3 › Deep Sync Conflict Scenarios › BroadcastChannel handles duplicate messages without errors
[3/42] [chromium] › e2e/deep-sync-conflict.spec.ts:10:3 › Deep Sync Conflict Scenarios › BroadcastChannel ping/pong survives rapid tab switching
[4/42] [chromium] › e2e/deep-sync-conflict.spec.ts:127:3 › Deep Sync Conflict Scenarios › memory leak check after sync broadcast storm
[5/42] [chromium] › e2e/indexeddb-corruption.spec.ts:54:6 › IndexedDB Recovery - Corruption › Corruption Simulation › should recover from corrupted IndexedDB data
[6/42] [chromium] › e2e/indexeddb-corruption.spec.ts:117:5 › IndexedDB Recovery - Corruption › Corruption Simulation › should handle invalid schema gracefully
[7/42] [chromium] › e2e/indexeddb-eviction.spec.ts:12:5 › IndexedDB Recovery - Eviction › Eviction Test › should handle storage pressure and persist()
[8/42] [chromium] › e2e/indexeddb-eviction.spec.ts:89:5 › IndexedDB Recovery - Eviction › Eviction Test › should estimate storage quota
[9/42] [chromium] › e2e/indexeddb-migration.spec.ts:12:5 › IndexedDB Recovery - Migration › Migration Test › should migrate from old schema to new schema
[10/42] [chromium] › e2e/indexeddb-migration.spec.ts:92:5 › IndexedDB Recovery - Migration › Migration Test › should preserve data integrity during migration
[11/42] [chromium] › e2e/memory-leak.spec.ts:6:3 › Memory Leak Detection › cyclic navigation - no detached DOM nodes
[12/42] [chromium] › e2e/memory-leak.spec.ts:57:3 › Memory Leak Detection › event listeners cleaned up on unmount
[13/42] [chromium] › e2e/memory-leak.spec.ts:84:3 › Memory Leak Detection › timers and intervals cleared on unmount
[14/42] [chromium] › e2e/memory-leak.spec.ts:110:3 › Memory Leak Detection › IndexedDB connections closed properly
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
[28/42] [chromium] › e2e/offline-state-corruption.spec.ts:86:3 › Deep Edge Cases — Offline State Corruption & Recovery › multiple rapid navigations do not break app
[29/42] [chromium] › e2e/state-corruption-recovery.spec.ts:10:3 › State Corruption & Recovery › app recovers from corrupted localStorage brand config
[30/42] [chromium] › e2e/state-corruption-recovery.spec.ts:28:3 › State Corruption & Recovery › app survives missing IndexedDB database gracefully
[31/42] [chromium] › e2e/state-corruption-recovery.spec.ts:54:3 › State Corruption & Recovery › app handles sessionStorage flood without crash
[chromium] › e2e/network-perf.spec.ts:157:3 › Network Performance & Sync Loop Detection › detect sync loops, icon loops, and excessive network activity
[MONITOR] Waiting 15s to capture baseline network activity...

[32/42] [chromium] › e2e/state-corruption-recovery.spec.ts:76:3 › State Corruption & Recovery › app survives cache API quota exceeded
[33/42] [chromium] › e2e/state-corruption-recovery.spec.ts:96:3 › State Corruption & Recovery › app handles service worker registration failure gracefully
[34/42] [chromium] › e2e/sync-broadcas
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
| 2026-08-10 10:46 UTC | CI report gerado automaticamente | `f5c701926409a1709cb8e7d769f1ee044e36b70d` |
