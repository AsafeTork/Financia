# CI Report

**Gerado:** 2026-08-05 15:27 UTC
**Commit:** `9bf3597d24eac596bf14cc130879c2ed6f70c4bd`
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

/home/runner/work/Financia/Financia/src/test/global-teardown.js
  2:1  warning  Unused eslint-disable directive (no problems were reported)

✖ 1 problem (0 errors, 1 warning)
  0 errors and 1 warning potentially fixable with the `--fix` option.


```

---

## Test Results (ultimas 40 linhas)

```
2:57:38 PM [vite] warning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.
2:57:38 PM [vite] warning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.
Both esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored. The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`

 RUN  v4.1.10 /home/runner/work/Financia/Financia

 ✓ src/test/utils.test.js > fmt > formata zero 18ms
 ✓ src/test/utils.test.js > fmt > formata zero (inclui R$) 1ms
 ✓ src/test/utils.test.js > fmt > formata inteiro positivo 1ms
 ✓ src/test/utils.test.js > fmt > usa vírgula como separador decimal 1ms
 ✓ src/test/utils.test.js > fmt > formata null como zero 1ms
 ✓ src/test/utils.test.js > fmt > formata undefined como zero 0ms
 ✓ src/test/utils.test.js > fmt > formata valor com centavos 1ms
 ✓ src/test/utils.test.js > fmt > formata 1000 com separador de milhar 0ms
 ✓ src/test/utils.test.js > fmt > retorna sempre string 1ms
 ✓ src/test/utils.test.js > fmt > formata negativo 0ms
 ✓ src/test/utils.test.js > fmt > formata 50.50 corretamente 1ms
 ✓ src/test/utils.test.js > fmt > formata 1234.56 preserva centavos 0ms
 ✓ src/test/utils.test.js > formatBytes > zero 0ms
 ✓ src/test/utils.test.js > formatBytes > null vira 0 B 0ms
 ✓ src/test/utils.test.js > formatBytes > bytes puros 0ms
 ✓ src/test/utils.test.js > formatBytes > kilobytes 0ms
 ✓ src/test/utils.test.js > formatBytes > megabytes com 1 decimal 0ms
 ✓ src/test/utils.test.js > formatBytes > gigabytes 0ms
 ✓ src/test/utils.test.js > formatBytes > arredonda 1 casa 0ms
 ✓ src/test/utils.test.js > formatBytes > sempre string 0ms
 ✓ src/test/utils.test.js > dbUsage > percentual correto 0ms
 ✓ src/test/utils.test.js > dbUsage > verde abaixo de 70% 0ms
 ✓ src/test/utils.test.js > dbUsage > ambar entre 70 e 90% 1ms
 ✓ src/test/utils.test.js > dbUsage > vermelho acima de 90% 0ms
 ✓ src/test/utils.test.js > dbUsage > clampa em 100% 0ms
 ✓ src/test/utils.test.js > dbUsage > limite zero nao quebra 0ms
 ✓ src/test/utils.test.js > dbUsage > nivel ok abaixo de 70 0ms
 ✓ src/test/utils.test.js > dbUsage > nivel critico acima de 90 0ms
 ✓ src/test/utils.test.js > hexToRgb > #002f59 → r=0 0ms
 ✓ src/test/utils.test.js > hexToRgb > #002f59 → g=47 0ms
 ✓ src/test/utils.test.js > hexToRgb > #002f59 → b=89 0ms
 ✓ src/test/utils.test.js > hexToRgb > #ffffff → 255,255,255 1ms
 ✓ src/test/utils.test.js > hexToRgb > #000000 → 0,0,0 0ms
 ✓ src/test/utils.test.js > hexToRgb > #ff0000 → r=255 0ms
 ✓ src/test/utils.test.js > hexToRgb > #ff0000 → g=0 0ms
 ✓ src/test/utils.test.js > hexToRgb > #0f9d6c → r=15, g=157, b=108 0ms
 ✓ src/test/utils.test.js > hexToRgb > string vazia usa default #002f59 0ms
 ✓ src/test/utils.test.js > hexToRgb > retorna objeto com r/g/b 0ms
 ✓ src/test/utils.test.js > brandAlpha > gera rgba com alpha correto 0ms
 ✓ src/test/utils.test.js > brandAlpha > alpha 1 → opaco 0ms
 ✓ src/test/utils.test.js > brandAlpha > alpha 0 → transparente 0ms
 ✓ src/test/utils.test.js > brandAlpha > #002f59 0.08 → rgba(0,47,89,0.08) 0ms
 ✓ src/test/utils.test.js > brandAlpha > sempre começa com rgba( 0ms
 ✓ src/test/utils.test.js > safe > string normal passa sem alteração 0ms
 ✓ src/test/utils.test.js > safe > remove < 0ms
 ✓ src/test/utils.test.js > safe > remove > 0ms
 ✓ src/test/utils.test.js > safe > remove " 0ms
 ✓ src/test/utils.test.js > safe > remove javascript: 0ms
 ✓ src/test/utils.test.js > safe > null retorna string vazia 0ms
 ✓ src/test/utils.test.js > safe > undefined retorna string vazia 0ms
 ✓ src/test/utils.test.js > safe > trunca em 200 chars 2ms
 ✓ src/test/utils.test.js > safe > faz trim 0ms
 ✓ src/test/utils.test.js > safe > retorna string 0ms
 ✓ src/test/utils.test.js > isUrl > https é URL 0ms
 ✓ src/test/utils.test.js > isUrl > http é URL 0ms
 ✓ src/test/utils.test.js > isUrl > / é URL (caminho relativo) 0ms
 ✓ src/test/utils.test.js > isUrl > data: é URL 0ms
 ✓ src/test/utils.test.js > isUrl > texto sem protocolo não é URL 0ms
 ✓ src/test/utils.test.js > isUrl > string vazia não é URL 0ms
 ✓ src/test/utils.test.js > isUrl > null não é URL 2ms
 ✓ src/test/utils.test.js > isUrl > undefined não é URL 0ms
 ✓ src/test/utils.test.js > today > retorna string 0ms
 ✓ src/test/utils.test.js > today > tem 10 caracteres (YYYY-MM-DD) 0ms
 ✓ src/test/utils.test.js > today > formato YYYY-MM-DD 0ms
 ✓ src/test/utils.test.js > prevDays > prevDays(0) igual a today() 0ms
 ✓ src/test/utils.test.js > prevDays > prevDays(1) anterior a today 0ms
 ✓ src/test/utils.test.js > prevDays > prevDays(7) é 7 dias atrás 0ms
 ✓ src/test/utils.test.js > prevDays > formato YYYY-MM-DD 0ms
 ✓ src/test/utils.test.js > fmtDate > retorna string 7ms
 ✓ src/test/utils.test.js > fmtDate > formato pt-BR contém / 0ms
 ✓ src/test/utils.test.js > fmtDate > data de final de ano é válida 0ms
 ✓ src/
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
| 2026-08-05 15:27 UTC | CI report gerado automaticamente | `9bf3597d24eac596bf14cc130879c2ed6f70c4bd` |
