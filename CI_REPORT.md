# CI Report

**Gerado:** 2026-08-05 22:46 UTC
**Commit:** `3975958802bb6c311e32f08ecc38da744c87525a`
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
10:46:36 PM [vite] warning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.
10:46:36 PM [vite] warning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.
Both esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored. The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`
 DEPRECATED  `test.poolOptions` was removed in Vitest 4. All previous `poolOptions` are now top-level options. Please, refer to the migration guide: https://vitest.dev/guide/migration#pool-rework

⎯⎯⎯⎯⎯⎯⎯ Startup Error ⎯⎯⎯⎯⎯⎯⎯⎯
Error: Failed to load custom Reporter from basic
    at loadCustomReporterModule (file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:11362:9)
    at file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:11378:23
    ... 3 lines matching cause stack trace ...
    at _createServer (file:///home/runner/work/Financia/Financia/node_modules/vitest/node_modules/vite/dist/node/chunks/node.js:25975:84)
    at createViteServer (file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:8835:17)
    at createVitest (file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:14221:18)
    at prepareVitest (file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:14588:14)
    at startVitest (file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:14531:14) {
  [cause]: Error: Failed to load url basic (resolved id: basic). Does the file exist?
      at reviveInvokeError (file:///home/runner/work/Financia/Financia/node_modules/vitest/node_modules/vite/dist/node/module-runner.js:546:14)
      at Object.invoke (file:///home/runner/work/Financia/Financia/node_modules/vitest/node_modules/vite/dist/node/module-runner.js:562:33)
      at ServerModuleRunner.getModuleInformation (file:///home/runner/work/Financia/Financia/node_modules/vitest/node_modules/vite/dist/node/module-runner.js:1199:7)
      at ServerModuleRunner.import (file:///home/runner/work/Financia/Financia/node_modules/vitest/node_modules/vite/dist/node/module-runner.js:1119:23)
      at loadCustomReporterModule (file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:11360:26)
      at file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:11378:23
      at async Promise.all (index 0)
      at Vitest._setServer (file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:13177:138)
      at BasicMinimalPluginContext.handler (file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:14191:5)
      at _createServer (file:///home/runner/work/Financia/Financia/node_modules/vitest/node_modules/vite/dist/node/chunks/node.js:25975:84) {
    code: 'ERR_LOAD_URL',
    runnerError: Error: RunnerError
        at reviveInvokeError (file:///home/runner/work/Financia/Financia/node_modules/vitest/node_modules/vite/dist/node/module-runner.js:547:64)
        at Object.invoke (file:///home/runner/work/Financia/Financia/node_modules/vitest/node_modules/vite/dist/node/module-runner.js:562:33)
        at ServerModuleRunner.getModuleInformation (file:///home/runner/work/Financia/Financia/node_modules/vitest/node_modules/vite/dist/node/module-runner.js:1199:7)
        at ServerModuleRunner.import (file:///home/runner/work/Financia/Financia/node_modules/vitest/node_modules/vite/dist/node/module-runner.js:1119:23)
        at loadCustomReporterModule (file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:11360:26)
        at file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:11378:23
        at async Promise.all (index 0)
        at Vitest._setServer (file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:13177:138)
        at BasicMinimalPluginContext.handler (file:///home/runner/work/Financia/Financia/node_modules/vitest/dist/chunks/cli-api.BK8pd4xc.js:14191:5)
        at _createServer (file:///home/runner/work/Financia/Financia/node_modules/vitest/node_modules/vite/dist/node/chunks/node.js:25975:84)
  }
}




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
| 2026-08-05 22:46 UTC | CI report gerado automaticamente | `3975958802bb6c311e32f08ecc38da744c87525a` |
