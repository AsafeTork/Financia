# CI Report

**Gerado:** 2026-08-07 19:14 UTC
**Commit:** `fba364d924cf160f6d1f6d782fc246a395d8004c`
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
    6:10   warning  'useSession' is defined but never used. Allowed unused vars must match /^_/u                                                                                                                                                                                        @typescript-eslint/no-unused-vars
   54:9    warning  'sessionProps' is assigned a value but never used. Allowed unused vars must match /^_/u                                                                                                                                                                             @typescript-eslint/no-unused-vars
   85:30   error    'loadData' is not defined                                                                                                                                                                                                                                           no-undef
   85:63   error    'loadData' is not defined                                                                                                                                                                                                                                           no-undef
   91:169  error    'saveBrand' is not defined                                                                                                                                                                                                                                          no-undef
   91:180  error    'savePhone' is not defined                                                                                                                                                                                                                                          no-undef
  123:7    error    'saveBrand' is not defined                                                                                                                                                                                                                                          no-undef
  123:18   error    'savePhone' is not defined                                                                                                                                                                                                                                          no-undef
  123:29   error    'loadData' is not defined                                                                                                                                                                                                                                           no-undef
  126:6    warning  React Hook useMemo has unnecessary dependencies: 'loadData', 'saveBrand', and 'savePhone'. Either exclude them or remove the dependency array. Outer scope values like 'saveBrand' aren't valid dependencies because mutating them doesn't re-render the component  react-hooks/exhaustive-deps
  146:5    error    'saveBrand' is not defined                                                                                                                                                                                                                                          no-undef
  146:16   error    'savePhone' is not defined                                                                                                                                                                                                                                          no-undef
  146:27   error    'loadData' is not defined                                                                                                                                                                                                                                           no-undef
  167:282  error    'loadData' is not defined                                                                                                                                                                                                                                           no-undef

/home/runner/work/Financia/Financia/src/features/auth/WebAuthn.jsx
  48:8   warning  'actionLabel' is assigned a value but never used. Allowed unused vars must match /^_/u     @typescript-eslint/no-unused-vars
  48:21  warning  'setActionLabel' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/features/reports/ReportView.jsx
  15:7  warning  'listRef' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/routes/routes.jsx
  52:19  error  'useCallback' is not defined  no-undef

/home/runner/work/Financia/Financia/src/shared/hooks/usePullToRefresh.js
  102:55  warning  The ref value 'rafRef.current' will likely have changed by the time
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
| 2026-08-07 19:14 UTC | CI report gerado automaticamente | `fba364d924cf160f6d1f6d782fc246a395d8004c` |
