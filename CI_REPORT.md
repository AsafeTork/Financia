# CI Report

**Gerado:** 2026-08-05 00:01 UTC
**Commit:** `4b59197c3ad9192d8b46043ae603966580bf74be`
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
  98:6  warning  React Hook useMemo has a missing dependency: 'setShowUpgrade'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/test/setup.js
  19:20  error  'process' is not defined  no-undef

✖ 2 problems (1 error, 1 warning)


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
| 2026-08-05 00:01 UTC | CI report gerado automaticamente | `4b59197c3ad9192d8b46043ae603966580bf74be` |
