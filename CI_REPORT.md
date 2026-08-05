# CI Report

**Gerado:** 2026-08-05 16:32 UTC
**Commit:** `56c24c47a39d0390c16a66bbca617bf4be84dc8e`
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

/home/runner/work/Financia/Financia/src/App.jsx
  1:47  warning  'Suspense' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/test/global-teardown.js
  2:1  warning  Unused eslint-disable directive (no problems were reported)

✖ 2 problems (0 errors, 2 warnings)
  0 errors and 1 warning potentially fixable with the `--fix` option.


```

---

## Test Results (ultimas 40 linhas)

```
4:32:22 PM [vite] warning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.
4:32:22 PM [vite] warning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.
Both esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored. The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`

 RUN  v4.1.10 /home/runner/work/Financia/Financia


⎯⎯⎯⎯⎯⎯ Failed Suites 50 ⎯⎯⎯⎯⎯⎯

 FAIL  src/core/boot.test.js [ src/core/boot.test.js ]
 FAIL  src/lib/auth.test.js [ src/lib/auth.test.js ]
 FAIL  src/lib/constants.test.js [ src/lib/constants.test.js ]
 FAIL  src/lib/plans.test.js [ src/lib/plans.test.js ]
 FAIL  src/lib/quickIntent.test.js [ src/lib/quickIntent.test.js ]
 FAIL  src/lib/revenue.test.js [ src/lib/revenue.test.js ]
 FAIL  src/lib/stripe.test.js [ src/lib/stripe.test.js ]
 FAIL  src/lib/sync-extra.test.js [ src/lib/sync-extra.test.js ]
 FAIL  src/lib/utils.test.js [ src/lib/utils.test.js ]
 FAIL  src/test/constants.test.js [ src/test/constants.test.js ]
 FAIL  src/features/auth/useSession.test.js [ src/features/auth/useSession.test.js ]
 FAIL  src/features/branding/LogoSchemes.test.jsx [ src/features/branding/LogoSchemes.test.jsx ]
 FAIL  src/features/branding/logoUtils.test.js [ src/features/branding/logoUtils.test.js ]
 FAIL  src/features/branding/presets.test.js [ src/features/branding/presets.test.js ]
 FAIL  src/features/transactions/useTx.extra.test.js [ src/features/transactions/useTx.extra.test.js ]
 FAIL  src/shared/hooks/useBrandAppearance.test.js [ src/shared/hooks/useBrandAppearance.test.js ]
 FAIL  src/shared/hooks/useBrandManager.test.js [ src/shared/hooks/useBrandManager.test.js ]
 FAIL  src/shared/hooks/useDataLoader.test.js [ src/shared/hooks/useDataLoader.test.js ]
 FAIL  src/shared/hooks/useSyncLoop.test.js [ src/shared/hooks/useSyncLoop.test.js ]
 FAIL  src/shared/ui/Onboarding.test.jsx [ src/shared/ui/Onboarding.test.jsx ]
 FAIL  src/shared/ui/QuickActions.test.jsx [ src/shared/ui/QuickActions.test.jsx ]
Error: Failed to resolve import "./test/msw-handlers.js" from "src/test/setup.js". Does the file exist?
  Plugin: vite:import-analysis
  File: /home/runner/work/Financia/Financia/src/test/setup.js:8:26
  6  |  import { beforeAll, afterAll, afterEach, vi, expect } from 'vitest';
  7  |  import { setupServer } from 'msw/node';
  8  |  import { handlers } from './test/msw-handlers.js';
     |                            ^
  9  |  import * as matchers from 'vitest-dom/matchers';
  10 |  
 ❯ TransformPluginContext._formatLog node_modules/vitest/node_modules/vite/dist/node/chunks/node.js:30366:39
 ❯ TransformPluginContext.error node_modules/vitest/node_modules/vite/dist/node/chunks/node.js:30363:14
 ❯ normalizeUrl node_modules/vitest/node_modules/vite/dist/node/chunks/node.js:27393:18
 ❯ node_modules/vitest/node_modules/vite/dist/node/chunks/node.js:27456:30
 ❯ TransformPluginContext.transform node_modules/vitest/node_modules/vite/dist/node/chunks/node.js:27424:4
 ❯ EnvironmentPluginContainer.transform node_modules/vitest/node_modules/vite/dist/node/chunks/node.js:30151:14
 ❯ loadAndTransform node_modules/vitest/node_modules/vite/dist/node/chunks/node.js:20098:26
 ❯ fetchModule node_modules/vitest/node_modules/vite/dist/node/chunks/node.js:33534:15

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/50]⎯

 FAIL  src/hooks/useAppState.test.js [ src/hooks/useAppState.test.js ]
 FAIL  src/hooks/useNavigation.test.js [ src/hooks/useNavigation.test.js ]
 FAIL  src/hooks/useOnboarding.test.js [ src/hooks/useOnboarding.test.js ]
 FAIL  src/hooks/usePlanEffects.test.js [ src/hooks/usePlanEffects.test.js ]
 FAIL  src/hooks/useToasts.test.js [ src/hooks/useToasts.test.js ]
 FAIL  src/lib/cleanNumeric.test.js [ src/lib/cleanNumeric.test.js ]
 FAIL  src/lib/crud.test.js [ src/lib/crud.test.js ]
 FAIL  src/lib/dexie.test.js [ src/lib/dexie.test.js ]
 FAIL  src/lib/impersonation.integration.test.js [ src/lib/impersonation.integration.test.js ]
 FAIL  src/lib/recurring.test.js [ src/lib/recurring.test.js ]
 FAIL  src/lib/stripe-subscription-cycle.integration.test.js [ src/lib/stripe-subscription-cycle.integration.test.js ]
 FAIL  src/lib/stripe-webhook.integration.test.js [ src/lib/stripe-webhook.integration.test.js ]
 FAIL  src/lib/sync.test.js [ src/lib/sync.test.js ]
 FAIL  src/routes/routes.test.jsx [ src/routes/routes.test.jsx ]
 FAIL  src/test/components.test.js [ src/test/components.test.js ]
 FAIL  src/test/utils.test.js [ src/test/utils.test.js ]
 FAIL  src/workers/color-extract.worker.test.js [ src/workers/color-extract.worker.test.js ]
 FAIL  src/features/branding/LogoSchemes.test.js [ src/features/branding/LogoSchemes.test.js ]
 FAIL  src/features/branding/accessibility.test.jsx [ src/features/branding/accessibility.test.jsx ]
 FAIL  src/features/branding/components.test.jsx [ src/features/brand
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
| 2026-08-05 16:32 UTC | CI report gerado automaticamente | `56c24c47a39d0390c16a66bbca617bf4be84dc8e` |
