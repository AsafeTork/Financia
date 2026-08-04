# CI Report

**Gerado:** 2026-08-04 22:09 UTC
**Commit:** `60e96e6c0ddaf79539bb36dc399368f8e1d3558e`
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
[2m10:04:46 PM[22m [33m[1m[vite][22m[39m [33mwarning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.[39m
[2m10:04:46 PM[22m [33m[1m[vite][22m[39m [33mwarning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.[39m
[33mBoth esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored.[39m The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`

[1m[30m[46m RUN [49m[39m[22m [36mv4.1.10 [39m[90m/home/runner/work/Financia/Financia[39m

 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22mcheckout.session.completed -> invoice.payment_succeeded -> subscription created -> plan activated[2m > [22mprocesses checkout.session.completed and activates plan in company_profiles[32m 7[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22mcheckout.session.completed -> invoice.payment_succeeded -> subscription created -> plan activated[2m > [22mprocesses invoice.payment_succeeded and updates plan[32m 2[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22mcheckout.session.completed -> invoice.payment_succeeded -> subscription created -> plan activated[2m > [22mhandles subscription created event and activates plan[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22mcheckout.session.completed -> invoice.payment_succeeded -> subscription created -> plan activated[2m > [22mverifies company_profiles.plan updated and email sent via mailer[32m 2[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22minvoice.payment_failed handling[2m > [22msends failure email when invoice payment fails[32m 2[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22mcustomer.subscription.updated handling[2m > [22mhandles plan upgrade/downgrade via subscription.updated[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22mcustomer.subscription.updated handling[2m > [22mhandles cancel_at_period_end and sends notification email[32m 21[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22mcustomer.subscription.deleted handling[2m > [22mreverts to free plan and sends cancellation email[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22mpayment_intent.succeeded (white-label)[2m > [22mactivates white-label on successful payment[32m 2[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22minvoice.upcoming reminder[2m > [22msends upcoming invoice reminder email[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22mDLQ recording on failure[2m > [22mrecords failed webhook event to DLQ[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mCreate subscription[2m > [22mcreates subscription and activates plan in company_profiles[32m 5[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mCreate subscription[2m > [22mcreates premium subscription with correct plan[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mUpgrade subscription (pro -> premium) with proration[2m > [22mupgrades subscription and updates plan in company_profiles[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mUpgrade subscription (pro -> premium) with proration[2m > [22mhandles proration invoice creation[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mDowngrade subscription (premium -> pro) with proration[2m > [22mdowngrades subscription and updates plan[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integratio
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
°°°·°°°°°°°°····°°°°··°···
  16 skipped
  10 passed (14.0s)

```

---

## Integration Tests

| Status |
|---|
| com falhas |

```

Running 42 tests using 4 workers
°°F····F·°°°°···°FF··[MONITOR] Waiting 15s to capture baseline network activity...
···°F·····[BASELINE] 30 requests, 1 req/s, Score: GOOD

[TEST] Navigating all routes to check for per-route network issues...
·FF
[TEST] Simulating theme toggle clicks...
FFF
[FINAL] 120 total requests, 4 req/s
[FINAL] Score: CRITICAL
[FINAL] Icon loop: true, Sync loop: false
FFFFF

  1) [chromium] › e2e/indexeddb-corruption.spec.ts:12:5 › IndexedDB Recovery - Corruption › Corruption Simulation › should recover from corrupted IndexedDB data 

    Error: page.evaluate: Execution context was destroyed, most likely because of a navigation.

      37 |       await page.waitForLoadState('networkidle');
      38 |
    > 39 |       const transactions = await page.evaluate(async () => {
         |                                       ^
      40 |         const dbName = 'financia-db';
      41 |         const storeName = 'transactions';
      42 |         
        at /home/runner/work/Financia/Financia/e2e/indexeddb-corruption.spec.ts:39:39

    Error Context: test-results/indexeddb-corruption-Index-b9183-om-corrupted-IndexedDB-data-chromium/error-context.md

  2) [chromium] › e2e/indexeddb-corruption.spec.ts:65:5 › IndexedDB Recovery - Corruption › Corruption Simulation › should handle invalid schema gracefully 

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

  3) [chromium] › e2e/indexeddb-migration.spec.ts:12:5 › IndexedDB Recovery - Migration › Migration Test › should migrate from old schema to new schema 

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

  4) [chromium] › e2e/network-error-handling.spec.ts:36:3 › Network Error Handling Scenarios › app handles complete network disconnection gracefully 

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

    Error Context: test-results/network-error-handling-Net-95d77-rk-disconnection-gracefully-chromium/error-context.md

  5) [chromium] › e2e/network-error-handling.spec.ts:50:3 › Network Error Handling Scenarios › app handles intermittent network failures 

    Error: expect(received).not.toBe(expected) // Object.is equality

    Expected: not ""

      61 |
      62 |     const title = await page.title();
    > 63 |     expect(title).not.toBe('');
         |                       ^
      64 |   });
      65 |
      66 |   test('fetch to missing endpoint returns handled error', async ({ page }) => {
        at /home/runner/work/Financia/Financia/e2e/network-error-handling.spec.ts:63:23

    Error Context: test-results/network-error-handling-Net-da567-termittent-network-failures-chromium/error-context.md

  6) [chromium] › e2e/network-perf.spec.ts:157:3 › Network Performance & Sync Loop Detection › detect sync loops, icon loops, and excessive network activity 

    Error: icon-192.svg loop detected — theme toggle causes infinite re-fetches

    expect(received).toBe(expected) // Object.is equality

    Expected: false
    Received: true

      249 |     fs.writeFileSync(path.join(process.cwd(), 'network-perf-results.json'), JSON.stringify(finalReport, null, 2));
      250 |
    > 251 |     expect(finalReport.iconLoopDetected, 'icon-192.svg loop detected — theme toggle causes infinite re-fetches').toBe(false);
          |                                                                                                                  ^
      252 |     expect(finalReport.syncLoopDetected, 'company_profiles sync loop detected — realtime triggers infinite sync').toBe(false);
      253 |     expect(finalReport.requestsPerS
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
| 2026-08-04 22:09 UTC | CI report gerado automaticamente | `60e96e6c0ddaf79539bb36dc399368f8e1d3558e` |
