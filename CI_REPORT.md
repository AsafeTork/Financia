# CI Report

**Gerado:** 2026-08-04 21:16 UTC
**Commit:** `69970db93e49c90141227f4b56cd299a86db9f77`
**Branch:** `main`

---

## Status Geral

| Verificacao | Status |
|---|---|
| Lint + Typecheck | com erros |
| Testes Unitarios | com falhas |
| Testes Integracao | nao executado |
| Build | com erros |
| E2E Tests | nao executado |
| Auditoria de Producao | ver resultado abaixo |
| Admin Audit | ver resultado abaixo |

---

## Lint Errors (Top 200 linhas)

```

/home/runner/work/Financia/Financia/src/features/admin/AdminPanel.jsx
  67:6  warning  React Hook useCallback has an unnecessary dependency: 'session'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/features/admin/ClientEditModal.jsx
  3:34  warning  'lightenHex' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/features/auth/useImpersonation.js
  1:34  warning  'useRef' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/features/settings/SettingsView.jsx
  76:7  warning  React Hook React.useCallback has an unnecessary dependency: 'cardReload'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/features/transactions/TxView.jsx
  2:41  warning  'EditBtn' is defined but never used. Allowed unused vars must match /^_/u                @typescript-eslint/no-unused-vars
  2:50  warning  'DelBtn' is defined but never used. Allowed unused vars must match /^_/u                 @typescript-eslint/no-unused-vars
  5:51  warning  'EmptyTransactionState' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  7:10  warning  'isRecurringId' is defined but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/hooks/useAppState.test.js
  2:32  warning  'vi' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/lib/sync-extra.test.js
  121:10  warning  'sb' is defined but never used. Allowed unused vars must match /^_/u           @typescript-eslint/no-unused-vars
  122:10  warning  'ldb' is defined but never used. Allowed unused vars must match /^_/u          @typescript-eslint/no-unused-vars
  138:10  warning  'anyOfModify' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/routes/routes.jsx
  1:33  warning  'useCallback' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/routes/routes.test.jsx
  1:32  warning  'beforeEach' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/shared/hooks/useDataLoader.test.js
  2:48  warning  'afterEach' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/shared/hooks/useRealtime.test.js
  2:48  warning  'afterEach' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/shared/hooks/useSyncLoop.js
  17:7  warning  'canSync' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

✖ 17 problems (0 errors, 17 warnings)


```

---

## Test Results (ultimas 40 linhas)

```
[2m9:13:49 PM[22m [33m[1m[vite][22m[39m [33mwarning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.[39m
[2m9:13:49 PM[22m [33m[1m[vite][22m[39m [33mwarning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.[39m
[33mBoth esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored.[39m The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`

[1m[30m[46m RUN [49m[39m[22m [36mv4.1.10 [39m[90m/home/runner/work/Financia/Financia[39m

 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mCreate subscription[2m > [22mcreates subscription and activates plan in company_profiles[32m 5[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mCreate subscription[2m > [22mcreates premium subscription with correct plan[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mUpgrade subscription (pro -> premium) with proration[2m > [22mupgrades subscription and updates plan in company_profiles[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mUpgrade subscription (pro -> premium) with proration[2m > [22mhandles proration invoice creation[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mDowngrade subscription (premium -> pro) with proration[2m > [22mdowngrades subscription and updates plan[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mDowngrade subscription (premium -> pro) with proration[2m > [22mcreates credit proration invoice for downgrade[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mCancel subscription[2m > [22mcancels subscription at period end[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mCancel subscription[2m > [22mcancels subscription immediately[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mRevert to free plan after cancellation[2m > [22mreverts to free when subscription deleted webhook received[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mRevert to free plan after cancellation[2m > [22mreverts to free on incomplete_expired status[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mFull subscription cycle integration[2m > [22mcompletes full cycle: create -> upgrade -> downgrade -> cancel -> free[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mFull subscription cycle integration[2m > [22mverifies plan transitions in company_profiles at each step[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js[2m > [22mStripe Subscription Lifecycle Integration Test[2m > [22mWhite-label addon subscription[2m > [22mcreates white-label subscription and activates addon[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22mcheckout.session.completed -> invoice.payment_succeeded -> subscription created -> plan activated[2m > [22mprocesses checkout.session.completed and activates plan in company_profiles[32m 5[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22mcheckout.session.completed -> invoice.payment_succeeded -> subscription created -> plan activated[2m > [22mprocesses invoice.payment_succeeded and updates plan[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js[2m > [22mStripe Webhook Integration - Full Cycle[2m > [22mcheckout.session.completed -> invoice.payment_succeeded -> subscription created -> plan activated[2m > [22mhandles subscription created event and activates plan[32m 1[2mms[22m[39m
 [32m✓[39m src/lib/stripe-we
```

---

## Build Output (ultimas 30 linhas)

```

> gestao-financeira@5.1.1 build
> vite build

[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 252 modules transformed.
[31mx[39m Build failed in 1.51s
[31merror during build:
[31msrc/shared/ui/TransactionCard.jsx (2:41): "isRecurringId" is not exported by "src/lib/utils.js", imported by "src/shared/ui/TransactionCard.jsx".[31m
file: [36m/home/runner/work/Financia/Financia/src/shared/ui/TransactionCard.jsx:2:41[31m
[33m
1: import React from 'react';
2: import { fmt, fmtDate, brandAlpha, safe, isRecurringId } from '../../lib/utils.js';
                                            ^
3: 
4: export function TransactionCard({ 
[31m
    at getRollupError (file:///home/runner/work/Financia/Financia/node_modules/rollup/dist/es/shared/parseAst.js:317:41)
    at error (file:///home/runner/work/Financia/Financia/node_modules/rollup/dist/es/shared/parseAst.js:313:42)
    at Module.error (file:///home/runner/work/Financia/Financia/node_modules/rollup/dist/es/shared/node-entry.js:17396:16)
    at Module.traceVariable (file:///home/runner/work/Financia/Financia/node_modules/rollup/dist/es/shared/node-entry.js:17829:29)
    at ModuleScope.findVariable (file:///home/runner/work/Financia/Financia/node_modules/rollup/dist/es/shared/node-entry.js:15419:39)
    at FunctionScope.findVariable (file:///home/runner/work/Financia/Financia/node_modules/rollup/dist/es/shared/node-entry.js:5684:38)
    at FunctionBodyScope.findVariable (file:///home/runner/work/Financia/Financia/node_modules/rollup/dist/es/shared/node-entry.js:5684:38)
    at Identifier.bind (file:///home/runner/work/Financia/Financia/node_modules/rollup/dist/es/shared/node-entry.js:5451:40)
    at CallExpression.bind (file:///home/runner/work/Financia/Financia/node_modules/rollup/dist/es/shared/node-entry.js:2833:23)
    at CallExpression.bind (file:///home/runner/work/Financia/Financia/node_modules/rollup/dist/es/shared/node-entry.js:12528:15)[39m

```

---

## E2E Tests (chromium)

| Status |
|---|
| nao executado |

```

```

---

## Integration Tests

| Status |
|---|
| nao executado |

```

```

---

## Producao Audit (chromium)

| Metric | Valor |
|---|---|


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
| 2026-08-04 21:16 UTC | CI report gerado automaticamente | `69970db93e49c90141227f4b56cd299a86db9f77` |
