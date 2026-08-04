# CI Report

**Gerado:** 2026-08-04 22:58 UTC
**Commit:** `88f40433429ca97b150584e606affbfb01677fa1`
**Branch:** `main`

---

## Status Geral

| Verificacao | Status |
|---|---|
| Lint + Typecheck | ok |
| Testes Unitarios | com falhas |
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
10:50:34 PM [vite] warning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.
10:50:34 PM [vite] warning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.
Both esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored. The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`

 RUN  v4.1.10 /home/runner/work/Financia/Financia

 ✓ src/lib/stripe-webhook.integration.test.js > Stripe Webhook Integration - Full Cycle > checkout.session.completed -> invoice.payment_succeeded -> subscription created -> plan activated > processes checkout.session.completed and activates plan in company_profiles 6ms
 ✓ src/lib/stripe-webhook.integration.test.js > Stripe Webhook Integration - Full Cycle > checkout.session.completed -> invoice.payment_succeeded -> subscription created -> plan activated > processes invoice.payment_succeeded and updates plan 1ms
 ✓ src/lib/stripe-webhook.integration.test.js > Stripe Webhook Integration - Full Cycle > checkout.session.completed -> invoice.payment_succeeded -> subscription created -> plan activated > handles subscription created event and activates plan 1ms
 ✓ src/lib/stripe-webhook.integration.test.js > Stripe Webhook Integration - Full Cycle > checkout.session.completed -> invoice.payment_succeeded -> subscription created -> plan activated > verifies company_profiles.plan updated and email sent via mailer 1ms
 ✓ src/lib/stripe-webhook.integration.test.js > Stripe Webhook Integration - Full Cycle > invoice.payment_failed handling > sends failure email when invoice payment fails 1ms
 ✓ src/lib/stripe-webhook.integration.test.js > Stripe Webhook Integration - Full Cycle > customer.subscription.updated handling > handles plan upgrade/downgrade via subscription.updated 1ms
 ✓ src/lib/stripe-webhook.integration.test.js > Stripe Webhook Integration - Full Cycle > customer.subscription.updated handling > handles cancel_at_period_end and sends notification email 14ms
 ✓ src/lib/stripe-webhook.integration.test.js > Stripe Webhook Integration - Full Cycle > customer.subscription.deleted handling > reverts to free plan and sends cancellation email 1ms
 ✓ src/lib/stripe-webhook.integration.test.js > Stripe Webhook Integration - Full Cycle > payment_intent.succeeded (white-label) > activates white-label on successful payment 1ms
 ✓ src/lib/stripe-webhook.integration.test.js > Stripe Webhook Integration - Full Cycle > invoice.upcoming reminder > sends upcoming invoice reminder email 1ms
 ✓ src/lib/stripe-webhook.integration.test.js > Stripe Webhook Integration - Full Cycle > DLQ recording on failure > records failed webhook event to DLQ 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Create subscription > creates subscription and activates plan in company_profiles 7ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Create subscription > creates premium subscription with correct plan 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Upgrade subscription (pro -> premium) with proration > upgrades subscription and updates plan in company_profiles 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Upgrade subscription (pro -> premium) with proration > handles proration invoice creation 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Downgrade subscription (premium -> pro) with proration > downgrades subscription and updates plan 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Downgrade subscription (premium -> pro) with proration > creates credit proration invoice for downgrade 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Cancel subscription > cancels subscription at period end 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Cancel subscription > cancels subscription immediately 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Revert to free plan after cancellation > reverts to free when subscription deleted webhook received 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Revert to free plan after cancellation > reverts to free on incomplete_expired status 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Full subscription cycle integration > completes full cycle: create -> upgrade -
```

---

## Build Output (ultimas 30 linhas)

```

> gestao-financeira@5.1.1 build
> vite build

[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 252 modules transformed.
Generated an empty chunk: "vendor-supabase".
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                            [39m[1m[2m  3.05 kB[22m[1m[22m[2m │ gzip:  0.96 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-CnihwhkN.css             [39m[1m[2m 55.46 kB[22m[1m[22m[2m │ gzip: 11.41 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-supabase-vwDjcXxQ.js    [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36museDebouncedValue-CJzge6Sj.js  [39m[1m[2m  0.21 kB[22m[1m[22m[2m │ gzip:  0.17 kB[22m
[2mdist/[22m[2massets/[22m[36mDebugBadge-bdeUC7zi.js         [39m[1m[2m  0.88 kB[22m[1m[22m[2m │ gzip:  0.51 kB[22m
[2mdist/[22m[2massets/[22m[36mlogoUtils-TWzfdVwe.js          [39m[1m[2m  0.89 kB[22m[1m[22m[2m │ gzip:  0.47 kB[22m
[2mdist/[22m[2massets/[22m[36maiClient-Bolp7EyZ.js           [39m[1m[2m  2.87 kB[22m[1m[22m[2m │ gzip:  1.52 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-radix-oLFQLB-t.js       [39m[1m[2m  2.95 kB[22m[1m[22m[2m │ gzip:  1.42 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-DiDWOqRz.js          [39m[1m[2m  4.23 kB[22m[1m[22m[2m │ gzip:  1.80 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-C08Y_qYa.js          [39m[1m[2m  5.13 kB[22m[1m[22m[2m │ gzip:  2.06 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-Bbbm6H8P.js        [39m[1m[2m  6.29 kB[22m[1m[22m[2m │ gzip:  2.78 kB[22m
[2mdist/[22m[2massets/[22m[36mSaleForm-LvIkIlhv.js           [39m[1m[2m  7.45 kB[22m[1m[22m[2m │ gzip:  2.55 kB[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPolicy-CBSYOG9p.js      [39m[1m[2m  7.93 kB[22m[1m[22m[2m │ gzip:  3.43 kB[22m
[2mdist/[22m[2massets/[22m[36mTermsOfService-DUEm3RKj.js     [39m[1m[2m  8.66 kB[22m[1m[22m[2m │ gzip:  3.65 kB[22m
[2mdist/[22m[2massets/[22m[36mReportView-DMo6gJPC.js         [39m[1m[2m 10.36 kB[22m[1m[22m[2m │ gzip:  3.13 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-stripe-DcHt2SCs.js      [39m[1m[2m 13.00 kB[22m[1m[22m[2m │ gzip:  4.88 kB[22m
[2mdist/[22m[2massets/[22m[36mTxView-qtSC9QjK.js             [39m[1m[2m 19.17 kB[22m[1m[22m[2m │ gzip:  5.65 kB[22m
[2mdist/[22m[2massets/[22m[36mInventoryView-CDlCzVMF.js      [39m[1m[2m 20.06 kB[22m[1m[22m[2m │ gzip:  5.54 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-query-B3QQTXrc.js       [39m[1m[2m 24.61 kB[22m[1m[22m[2m │ gzip:  7.40 kB[22m
[2mdist/[22m[2massets/[22m[36mDashboard-KlX9UdGX.js          [39m[1m[2m 27.69 kB[22m[1m[22m[2m │ gzip:  7.50 kB[22m
[2mdist/[22m[2massets/[22m[36mPlansView-TkPi6tZm.js          [39m[1m[2m 31.25 kB[22m[1m[22m[2m │ gzip:  8.33 kB[22m
[2mdist/[22m[2massets/[22m[36mLanding-GfgD-kHJ.
```

---

## E2E Tests (chromium)

| Status |
|---|
| ok |

```

Running 26 tests using 4 workers
°°°·°°°°°°°°···°·°°°··°···
  16 skipped
  10 passed (13.7s)

```

---

## Integration Tests

| Status |
|---|
| com falhas |

```

Running 42 tests using 4 workers

[1/42] [chromium] › e2e/deep-sync-conflict.spec.ts:120:3 › Deep Sync Conflict Scenarios › memory leak check after sync broadcast storm
[2/42] [chromium] › e2e/deep-sync-conflict.spec.ts:62:3 › Deep Sync Conflict Scenarios › BroadcastChannel handles duplicate messages without errors
[3/42] [chromium] › e2e/deep-sync-conflict.spec.ts:10:3 › Deep Sync Conflict Scenarios › BroadcastChannel ping/pong survives rapid tab switching
[4/42] [chromium] › e2e/deep-sync-conflict.spec.ts:97:3 › Deep Sync Conflict Scenarios › sync worker survives unhandled rejection
[5/42] [chromium] › e2e/indexeddb-corruption.spec.ts:12:5 › IndexedDB Recovery - Corruption › Corruption Simulation › should recover from corrupted IndexedDB data
[6/42] [chromium] › e2e/indexeddb-corruption.spec.ts:65:5 › IndexedDB Recovery - Corruption › Corruption Simulation › should handle invalid schema gracefully
  1) [chromium] › e2e/indexeddb-corruption.spec.ts:65:5 › IndexedDB Recovery - Corruption › Corruption Simulation › should handle invalid schema gracefully 

    Error: expect(received).toBeTruthy()

    Received: false

       98 |       
       99 |       const hasAppLoaded = await page.locator('[data-testid="app-root"]').isVisible().catch(() => false);
    > 100 |       expect(hasAppLoaded).toBeTruthy();
          |                            ^
      101 |     });
      102 |   });
      103 | });
        at /home/runner/work/Financia/Financia/e2e/indexeddb-corruption.spec.ts:100:28

    Error Context: test-results/indexeddb-corruption-Index-176cb-e-invalid-schema-gracefully-chromium/error-context.md


[7/42] [chromium] › e2e/indexeddb-eviction.spec.ts:12:5 › IndexedDB Recovery - Eviction › Eviction Test › should handle storage pressure and persist()
[8/42] [chromium] › e2e/indexeddb-eviction.spec.ts:89:5 › IndexedDB Recovery - Eviction › Eviction Test › should estimate storage quota
[9/42] [chromium] › e2e/indexeddb-migration.spec.ts:12:5 › IndexedDB Recovery - Migration › Migration Test › should migrate from old schema to new schema
[10/42] [chromium] › e2e/indexeddb-migration.spec.ts:92:5 › IndexedDB Recovery - Migration › Migration Test › should preserve data integrity during migration
[11/42] [chromium] › e2e/memory-leak.spec.ts:6:3 › Memory Leak Detection › cyclic navigation - no detached DOM nodes
  2) [chromium] › e2e/indexeddb-migration.spec.ts:12:5 › IndexedDB Recovery - Migration › Migration Test › should migrate from old schema to new schema 

    Error: page.evaluate: AbortError: Version change transaction was aborted in upgradeneeded event handler.

      39 |       await page.waitForLoadState('networkidle');
      40 |
    > 41 |       const migratedData = await page.evaluate(async () => {
         |                                       ^
      42 |         const dbName = 'financia-db';
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
[20/42] [chromium] › e2e/network-error-handling.spec.ts:36:3 › Network Error Handling Scenarios › app handles complete network disconnection gracefully
[21/42] [chromium] › e2e/network-error-handling.spec.ts:50:3 › Network Error Handling Scenarios › app handles intermittent network failures
  3) [chromium] › e2e/network-error-handling.spec.ts:36:3 › Network Error Handling Scenarios › app handles complete network disconnection gracefully 

    Error: expect(received).not.toBe(expected) // Object.is equality

    Expected: not ""

      43 |
      44 |     const title = await page.title();
    > 45 |     expect(title).not.toBe('');
         |                       ^
      46 |
      47 |     await page.context().setOffline(false);
      48 |   });
        at /home/runner/work/Financia/Financia/e2e/network-error-handling.spec.ts:45:23

    Error Context: test-results/network-error-handling-Net-
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
| 2026-08-04 22:58 UTC | CI report gerado automaticamente | `88f40433429ca97b150584e606affbfb01677fa1` |
