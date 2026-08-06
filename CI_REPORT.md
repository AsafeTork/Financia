# CI Report

**Gerado:** 2026-08-06 00:47 UTC
**Commit:** `ee4e5aab968e4873f2f1548f902f79ed64e1bd0d`
**Branch:** `main`

---

## Status Geral

| Verificacao | Status |
|---|---|
| Lint + Typecheck | ok |
| Testes Unitarios | com falhas |
| Testes Integracao | nao executado |
| Build | nao executado |
| E2E Tests | nao executado |
| Auditoria de Producao | ver resultado abaixo |
| Admin Audit | ver resultado abaixo |

---

## Lint Errors (Top 200 linhas)

```

```

---

## Test Results (ultimas 40 linhas)

```
12:36:59 AM [vite] warning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.
12:36:59 AM [vite] warning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.
Both esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored. The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`

 RUN  v4.1.10 /home/runner/work/Financia/Financia

 ✓ src/lib/stripe-webhook.integration.test.js (11 tests) 33ms
 ✓ src/test/utils.test.js (141 tests) 68ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js (13 tests) 31ms
 ❯ src/lib/sync-extra.test.js (0 test)
stderr | src/lib/sync.test.js > fetchClients > retorna array vazio no erro
[sync] fetchClients failed: Error: x
    at Object.order [90m(/home/runner/work/Financia/Financia/[39msrc/lib/sync.test.js:127:63[90m)[39m
    at Module.fetchClients [90m(/home/runner/work/Financia/Financia/[39msrc/lib/sync.js:165:84[90m)[39m
    at [90m/home/runner/work/Financia/Financia/[39msrc/lib/sync.test.js:129:27
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:302:11
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:1903:26
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2326:20
    at new Promise (<anonymous>)
    at runWithCancel [90m(file:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2323:10[90m)[39m
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2305:20
    at new Promise (<anonymous>)

stderr | src/lib/sync.test.js > fetchClientUsage > retorna {} na exception
[sync] fetchClientUsage: Error: crash
    at [90m/home/runner/work/Financia/Financia/[39msrc/lib/sync.test.js:146:30
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:302:11
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:1903:26
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2326:20
    at new Promise (<anonymous>)
    at runWithCancel [90m(file:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2323:10[90m)[39m
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2305:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2272:10[90m)[39m
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2955:64

stderr | src/lib/sync.test.js > fetchStripeOverview > retorna null na exception
[sync] fetchStripeOverview: Error: x
    at [90m/home/runner/work/Financia/Financia/[39msrc/lib/sync.test.js:182:43
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:302:11
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:1903:26
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2326:20
    at new Promise (<anonymous>)
    at runWithCancel [90m(file:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2323:10[90m)[39m
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2305:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2272:10[90m)[39m
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2955:64

stdout | src/lib/sync.test.js > benchmarks > QA-04: syncAll 10k rows < 5s (benchmark)
QA-04 benchmark: syncAll took 0.24ms

stdout | src/lib/sync.test.js > benchmarks > QA-05: admin-stripe-overview p95 < 2s (100 subs with cursor pagination)
QA-05 benchmark: fetchStripeOverview p95=0.01ms avg=0.00ms over 100 iterations

 ✓ src/lib/sync.test.js (33 tests) 59ms
 ✓ src/test/constants.test.js (95 tests) 42ms
 ✓ src/shared/hooks/useBrandAppearance.extra.test.js (18 tests) 66ms
 ✓ src/features/auth/useSession.test.js (11 tests) 70ms
 ✓ src/shared/hooks/useDataLoader.test.js (10 tests) 55ms
 ❯ src/shared/hooks/useBrandAppearance.test.js (19 tests | 
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
| 2026-08-06 00:47 UTC | CI report gerado automaticamente | `ee4e5aab968e4873f2f1548f902f79ed64e1bd0d` |
