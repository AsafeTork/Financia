# CI Report

**Gerado:** 2026-08-05 03:34 UTC
**Commit:** `f1b969f46e8c7a1e3a43f63d59344b5c90b14c46`
**Branch:** `main`

---

## Status Geral

| Verificacao | Status |
|---|---|
| Lint + Typecheck | com erros |
| Testes Unitarios | nao executado |
| Testes Integracao | nao executado |
| Build | nao executado |
| E2E Tests | nao executado |
| Auditoria de Producao | ver resultado abaixo |
| Admin Audit | ver resultado abaixo |

---

## Lint Errors (Top 200 linhas)

```
(node:2471) ESLintEnvWarning: /* eslint-env */ comments are no longer recognized when linting with flat config and will be reported as errors as of v10.0.0. Replace them with /* global */ comments or define globals in your config file. See https://eslint.org/docs/latest/use/configure/migration-guide#eslint-env-configuration-comments for details. Found in /home/runner/work/Financia/Financia/src/test/global-teardown.js at line 1.
(Use `node --trace-warnings ...` to show where the warning was created)
(node:2471) ESLintEnvWarning: /* eslint-env */ comments are no longer recognized when linting with flat config and will be reported as errors as of v10.0.0. Replace them with /* global */ comments or define globals in your config file. See https://eslint.org/docs/latest/use/configure/migration-guide#eslint-env-configuration-comments for details. Found in /home/runner/work/Financia/Financia/src/test/setup.js at line 1.

/home/runner/work/Financia/Financia/src/test/setup.js
  29:20  error  'process' is not defined  no-undef

✖ 1 problem (1 error, 0 warnings)


```

---

## Test Results (ultimas 40 linhas)

```

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
| 2026-08-05 03:34 UTC | CI report gerado automaticamente | `f1b969f46e8c7a1e3a43f63d59344b5c90b14c46` |
