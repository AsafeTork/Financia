# CI Report

**Gerado:** 2026-08-04 20:33 UTC
**Commit:** `2f9260e863ee46fbf86186dc74352542ccc47889`
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
   2:10   warning  'INIT_BRAND' is defined but never used. Allowed unused vars must match /^_/u                                                                                 @typescript-eslint/no-unused-vars
  59:6    warning  React Hook useCallback has a missing dependency: 's'. Either include it or remove the dependency array                                                       react-hooks/exhaustive-deps
  63:113  warning  React Hook useCallback has a missing dependency: 's'. Either include it or remove the dependency array                                                       react-hooks/exhaustive-deps
  64:76   warning  React Hook useCallback has a missing dependency: 's'. Either include it or remove the dependency array                                                       react-hooks/exhaustive-deps
  65:83   warning  React Hook useCallback has a missing dependency: 's'. Either include it or remove the dependency array                                                       react-hooks/exhaustive-deps
  66:83   warning  React Hook useCallback has a missing dependency: 's'. Either include it or remove the dependency array                                                       react-hooks/exhaustive-deps
  67:81   warning  React Hook useCallback has a missing dependency: 's'. Either include it or remove the dependency array                                                       react-hooks/exhaustive-deps
  69:62   warning  React Hook useCallback has a missing dependency: 'n'. Either include it or remove the dependency array                                                       react-hooks/exhaustive-deps
  88:6    warning  React Hook useMemo has missing dependencies: 'handleCloseSidebar', 'handleNav', and 'handleOpenSidebar'. Either include them or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/features/admin/AdminPanel.jsx
  67:6  warning  React Hook useCallback has an unnecessary dependency: 'session'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/features/admin/ClientEditModal.jsx
  3:34  warning  'lightenHex' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/features/auth/useImpersonation.js
  1:34  warning  'useRef' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/features/settings/SettingsView.jsx
  76:7  warning  React Hook React.useCallback has an unnecessary dependency: 'cardReload'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/hooks/useAppState.test.js
  2:32  warning  'vi' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/hooks/useNavigation.js
  62:6  warning  React Hook useEffect has a missing dependency: 'modalRef'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

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

/home/runner/work/Financia/Financia/src/shared/hooks/useNavigationHistory.js
   13:58  error    Empty block statement                                                                                                                                                                                                                                                              no-empty
  146:6   warning  React Hook useEffect has missing dependencies: 'onTrack' and 'pageName'. Either include them or remove the dependency array. If 'onTrack' changes too often, find the parent component that defines it and wrap that definition in useCallback                                     react-hooks/exhaustive-deps
  150:25  error    React Hook "useNavigationHistory" is called in functio
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
| 2026-08-04 20:33 UTC | CI report gerado automaticamente | `2f9260e863ee46fbf86186dc74352542ccc47889` |
