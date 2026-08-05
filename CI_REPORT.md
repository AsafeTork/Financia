# CI Report

**Gerado:** 2026-08-05 00:37 UTC
**Commit:** `fc6e28d218a8cd1791110a4bbeb9f18bd4dd5233`
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

/home/runner/work/Financia/Financia/src/App.jsx
  98:6  warning  React Hook useMemo has an unnecessary dependency: 's.setShowUpgrade'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/test/setup.js
   8:1   warning  Unused eslint-disable directive (no problems were reported from 'no-undef')
  19:43  error    Empty block statement                                                        no-empty
  30:43  error    Empty block statement                                                        no-empty
  31:45  error    Empty block statement                                                        no-empty

✖ 5 problems (3 errors, 2 warnings)
  0 errors and 1 warning potentially fixable with the `--fix` option.


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
| 2026-08-05 00:37 UTC | CI report gerado automaticamente | `fc6e28d218a8cd1791110a4bbeb9f18bd4dd5233` |
