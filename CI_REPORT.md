# CI Report

**Gerado:** 2026-08-08 23:59 UTC
**Commit:** `f156740102f6921e61f0e3d4d7c5cc37a4e1552e`
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

/home/runner/work/Financia/Financia/src/features/landing/Landing.jsx
   28:7    warning  'FEATURES' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars
  207:96   error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`                      react/no-unescaped-entities
  207:157  error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`                      react/no-unescaped-entities
  212:96   error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`                      react/no-unescaped-entities
  212:154  error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`                      react/no-unescaped-entities
  217:96   error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`                      react/no-unescaped-entities
  217:148  error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`                      react/no-unescaped-entities

✖ 7 problems (6 errors, 1 warning)


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
| 2026-08-08 23:59 UTC | CI report gerado automaticamente | `f156740102f6921e61f0e3d4d7c5cc37a4e1552e` |
