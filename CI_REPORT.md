# CI Report

**Gerado:** 2026-08-05 03:55 UTC
**Commit:** `058d08b2488192c97a443693abb085f3858d29dd`
**Branch:** `main`

---

## Status Geral

| Verificacao | Status |
|---|---|
| Lint + Typecheck | com erros |
| Testes Unitarios | com falhas |
| Testes Integracao | nao executado |
| Build | nao executado |
| E2E Tests | nao executado |
| Auditoria de Producao | ver resultado abaixo |
| Admin Audit | ver resultado abaixo |

---

## Lint Errors (Top 200 linhas)

```

/home/runner/work/Financia/Financia/src/test/global-teardown.js
  2:1  warning  Unused eslint-disable directive (no problems were reported)

✖ 1 problem (0 errors, 1 warning)
  0 errors and 1 warning potentially fixable with the `--fix` option.


```

---

## Test Results (ultimas 40 linhas)

```
3:55:15 AM [vite] warning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.
3:55:15 AM [vite] warning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.
Both esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored. The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`
 DEPRECATED  `test.poolOptions` was removed in Vitest 4. All previous `poolOptions` are now top-level options. Please, refer to the migration guide: https://vitest.dev/guide/migration#pool-rework

 RUN  v4.1.10 /home/runner/work/Financia/Financia


⎯⎯⎯⎯⎯⎯ Failed Suites 50 ⎯⎯⎯⎯⎯⎯

 FAIL  src/core/boot.test.js [ src/core/boot.test.js ]
 FAIL  src/hooks/useAppState.test.js [ src/hooks/useAppState.test.js ]
 FAIL  src/hooks/useNavigation.test.js [ src/hooks/useNavigation.test.js ]
 FAIL  src/hooks/useOnboarding.test.js [ src/hooks/useOnboarding.test.js ]
 FAIL  src/hooks/usePlanEffects.test.js [ src/hooks/usePlanEffects.test.js ]
 FAIL  src/hooks/useToasts.test.js [ src/hooks/useToasts.test.js ]
 FAIL  src/lib/auth.test.js [ src/lib/auth.test.js ]
 FAIL  src/lib/cleanNumeric.test.js [ src/lib/cleanNumeric.test.js ]
 FAIL  src/lib/constants.test.js [ src/lib/constants.test.js ]
 FAIL  src/lib/crud.test.js [ src/lib/crud.test.js ]
 FAIL  src/lib/dexie.test.js [ src/lib/dexie.test.js ]
 FAIL  src/lib/impersonation.integration.test.js [ src/lib/impersonation.integration.test.js ]
 FAIL  src/lib/plans.test.js [ src/lib/plans.test.js ]
 FAIL  src/lib/quickIntent.test.js [ src/lib/quickIntent.test.js ]
 FAIL  src/lib/recurring.test.js [ src/lib/recurring.test.js ]
 FAIL  src/lib/revenue.test.js [ src/lib/revenue.test.js ]
 FAIL  src/lib/stripe-subscription-cycle.integration.test.js [ src/lib/stripe-subscription-cycle.integration.test.js ]
 FAIL  src/lib/stripe-webhook.integration.test.js [ src/lib/stripe-webhook.integration.test.js ]
 FAIL  src/lib/stripe.test.js [ src/lib/stripe.test.js ]
 FAIL  src/lib/sync-extra.test.js [ src/lib/sync-extra.test.js ]
 FAIL  src/lib/sync.test.js [ src/lib/sync.test.js ]
 FAIL  src/lib/utils.test.js [ src/lib/utils.test.js ]
 FAIL  src/routes/routes.test.jsx [ src/routes/routes.test.jsx ]
 FAIL  src/test/components.test.js [ src/test/components.test.js ]
 FAIL  src/test/constants.test.js [ src/test/constants.test.js ]
 FAIL  src/test/utils.test.js [ src/test/utils.test.js ]
 FAIL  src/workers/color-extract.worker.test.js [ src/workers/color-extract.worker.test.js ]
 FAIL  src/features/auth/useSession.test.js [ src/features/auth/useSession.test.js ]
 FAIL  src/features/branding/LogoSchemes.test.js [ src/features/branding/LogoSchemes.test.js ]
 FAIL  src/features/branding/LogoSchemes.test.jsx [ src/features/branding/LogoSchemes.test.jsx ]
 FAIL  src/features/branding/accessibility.test.jsx [ src/features/branding/accessibility.test.jsx ]
 FAIL  src/features/branding/components.test.jsx [ src/features/branding/components.test.jsx ]
 FAIL  src/features/branding/logoUtils.test.js [ src/features/branding/logoUtils.test.js ]
 FAIL  src/features/branding/presets.test.js [ src/features/branding/presets.test.js ]
 FAIL  src/features/branding/responseProcessor.test.js [ src/features/branding/responseProcessor.test.js ]
 FAIL  src/features/inventory/useLosses.test.js [ src/features/inventory/useLosses.test.js ]
 FAIL  src/features/inventory/useProducts.test.js [ src/features/inventory/useProducts.test.js ]
 FAIL  src/features/transactions/useTx.extra.test.js [ src/features/transactions/useTx.extra.test.js ]
 FAIL  src/features/transactions/useTx.test.js [ src/features/transactions/useTx.test.js ]
 FAIL  src/shared/hooks/useBrandAppearance.extra.test.js [ src/shared/hooks/useBrandAppearance.extra.test.js ]
 FAIL  src/shared/hooks/useBrandAppearance.test.js [ src/shared/hooks/useBrandAppearance.test.js ]
 FAIL  src/shared/hooks/useBrandManager.test.js [ src/shared/hooks/useBrandManager.test.js ]
 FAIL  src/shared/hooks/useDataLoader.test.js [ src/shared/hooks/useDataLoader.test.js ]
 FAIL  src/shared/hooks/useRealtime.test.js [ src/shared/hooks/useRealtime.test.js ]
 FAIL  src/shared/hooks/useSyncLoop.test.js [ src/shared/hooks/useSyncLoop.test.js ]
 FAIL  src/shared/ui/ColorField.test.jsx [ src/shared/ui/ColorField.test.jsx ]
 FAIL  src/shared/ui/Feedback.test.jsx [ src/shared/ui/Feedback.test.jsx ]
 FAIL  src/shared/ui/Onboarding.test.jsx [ src/shared/ui/Onboarding.test.jsx ]
 FAIL  src/shared/ui/PhoneInput.test.jsx [ src/shared/ui/PhoneInput.test.jsx ]
 FAIL  src/shared/ui/QuickActions.test.jsx [ src/shared/ui/QuickActions.test.jsx ]
ReferenceError: TransformStream is not defined
 ❯ node_modules/@mswjs/interceptors/src/interceptors/fetch/utils/brotli-decompress.ts:3:0
 ❯ src/test/setup.js:5:1
      3| import { IDBFactory } from 'fake-indexeddb';
      4| import { beforeAll, afterAll, a
```

---

## Build Output (ultimas 30 linhas)

```

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
| 2026-08-05 03:55 UTC | CI report gerado automaticamente | `058d08b2488192c97a443693abb085f3858d29dd` |
