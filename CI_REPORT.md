# CI Report

**Gerado:** 2026-08-07 18:09 UTC
**Commit:** `1dac4163c405aa807f466330269890d9904748a8`
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

/home/runner/work/Financia/Financia/src/features/auth/WebAuthn.jsx
  48:8   warning  'actionLabel' is assigned a value but never used. Allowed unused vars must match /^_/u     @typescript-eslint/no-unused-vars
  48:21  warning  'setActionLabel' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/features/reports/ReportView.jsx
  15:7  warning  'listRef' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/routes/routes.jsx
  52:19  error  'useCallback' is not defined  no-undef

/home/runner/work/Financia/Financia/src/shared/hooks/usePullToRefresh.js
  102:55  warning  The ref value 'rafRef.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'rafRef.current' to a variable inside the effect, and use that variable in the cleanup function  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/shared/hooks/usePullToRefresh.test.js
  92:11  warning  'result' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/shared/hooks/useSwipeActions.js
  9:7  warning  The 'actions' logical expression could make the dependencies of useCallback Hook (at line 45) change on every render. Move it inside the useCallback callback. Alternatively, wrap the initialization of 'actions' in its own useMemo() Hook  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/shared/hooks/useSwipeActions.test.js
    1:36  warning  'beforeEach' is defined but never used. Allowed unused vars must match /^_/u       @typescript-eslint/no-unused-vars
   95:11  warning  'result' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  140:11  warning  'result' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  155:11  warning  'result' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

✖ 11 problems (1 error, 10 warnings)


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
| 2026-08-07 18:09 UTC | CI report gerado automaticamente | `1dac4163c405aa807f466330269890d9904748a8` |
