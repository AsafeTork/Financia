# Relatório de Erros do CI

**Última atualização:** 2026-07-29 21:14 UTC
**Commit:** `15ca5edcdb6f853bfb0b0c4aa9c223e99b3762c8`
**Branch:** `main`

---

## Resumo Executivo

| Verificação | Status |
|---|---|
| Lint + Typecheck | erros |
| Testes Unitários | falha |
| Build | ok |

---

## Erros Lint

```

/home/runner/work/Financia/Financia/src/features/admin/AdminPanel.jsx
  67:6  warning  React Hook useCallback has an unnecessary dependency: 'session'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/features/admin/ClientEditModal.jsx
  3:34  warning  'lightenHex' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/features/settings/SettingsView.jsx
  76:7  warning  React Hook React.useCallback has an unnecessary dependency: 'cardReload'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/shared/hooks/useSyncLoop.js
  86:6  warning  React Hook useEffect has a missing dependency: 'canSync'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 4 problems (0 errors, 4 warnings)
```

---

## Erros de Build

```

> gestao-financeira@5.1.1 build
> vite build

[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 237 modules transformed.
Generated an empty chunk: "supabase-functions".
Generated an empty chunk: "supabase-db".
Generated an empty chunk: "supabase".
Generated an empty chunk: "supabase-storage".
Generated an empty chunk: "supabase-auth".
rendering chunks...
computing gzip size...
[2mdist/[22m[32mindex.html                             [39m[1m[2m  3.22 kB[22m[1m[22m[2m │ gzip:  1.15 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-CZEQRvN1.css              [39m[1m[2m 52.89 kB[22m[1m[22m[2m │ gzip: 11.01 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-functions-vwDjcXxQ.js  [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-db-vwDjcXxQ.js         [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-vwDjcXxQ.js            [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-storage-vwDjcXxQ.js    [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-auth-vwDjcXxQ.js       [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36museDebouncedValue-B0hKsm5O.js   [39m[1m[2m  0.21 kB[22m[1m[22m[2m │ gzip:  0.17 kB[22m
[2mdist/[22m[2massets/[22m[36mlogoUtils-PvEC_So1.js           [39m[1m[2m  0.89 kB[22m[1m[22m[2m │ gzip:  0.47 kB[22m
[2mdist/[22m[2massets/[22m[36maiClient-CTjWAW20.js            [39m[1m[2m  2.87 kB[22m[1m[22m[2m │ gzip:  1.52 kB[22m
[2mdist/[22m[2massets/[22m[36mradix-E4vWxl6g.js               [39m[1m[2m  2.95 kB[22m[1m[22m[2m │ gzip:  1.41 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-scheduler-CbiHYZlt.js    [39m[1m[2m  4.10 kB[22m[1m[22m[2m │ gzip:  1.78 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-CCVTeScg.js           [39m[1m[2m  4.23 kB[22m[1m[22m[2m │ gzip:  1.80 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-BE09IBPI.js           [39m[1m[2m  5.13 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-DKel5qZb.js         [39m[1m[2m  6.29 kB[22m[1m[22m[2m │ gzip:  2.78 kB[22m
[2mdist/[22m[2massets/[22m[36mSaleForm-B8g3qSFi.js            [39m[1m[2m  7.45 kB[22m[1m[22m[2m │ gzip:  2.55 kB[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPolicy-BkGvRqJc.js       [39m[1m[2m  7.96 kB[22m[1m[22m[2m │ gzip:  3.45 kB[22m
[2mdist/[22m[2massets/[22m[36mTermsOfService-c0xlNlJ-.js      [39m[1m[2m  8.70 kB[22m[1m[22m[2m │ gzip:  3.67 kB[22m
[2mdist/[22m[2massets/[22m[36mReportView-DS6kqvbN.js          [39m[1m[2m 10.22 kB[22m[1m[22m[2m │ gzip:  3.12 kB[22m
[2mdist/[22m[2massets/[22m[36mstripe-BFjv1rCu.js              [39m[1m[2m 13.00 kB[22m[1m[22m[2m │ gzip:  4.88 kB[22m
[2mdist/[22m[2massets/[22m[36mTxView-ChiMYvuq.js              [39m[1m[2m 14.60 kB[22m[1m[22m[2m │ gzip:  4.78 kB[22m
[2mdist/[22m[2massets/[22m[36mInventoryView-H1lBbJYp.js       [39m[1m[2m 19.97 kB[22m[1m[22m[2m │ gzip:  5.52 kB[22m
[2mdist/[22m[2massets/[22m[36mquery-ByP6YL3J.js               [39m[1m[2m 24.61 kB[22m[1m[22m[2m │ gzip:  7.40 kB[22m
[2mdist/[22m[2massets/[22m[36mDashboard-Bd4saIHq.js           [39m[1m[2m 27.47 kB[22m[1m[22m[2m │ gzip:  7.47 kB[22m
[2mdist/[22m[2massets/[22m[36mPlansView-CRtYlVHF.js           [39m[1m[2m 31.24 kB[22m[1m[22m[2m │ gzip:  8.33 kB[22m
[2mdist/[22m[2massets/[22m[36mLanding-Ntlg3jkL.js             [39m[1m[2m 32.00 kB[22m[1m[22m[2m │ gzip:  7.66 kB[22m
[2mdist/[22m[2massets/[22m[36mSettingsView-gprAWDlq.js        [39m[1m[2m 35.76 kB[22m[1m[22m[2m │ gzip:  9.86 kB[22m
[2mdist/[22m[2massets/[22m[36mBrandStudioView-B2X5nGCN.js     [39m[1m[2m 36.86 kB[22m[1m[22m[2m │ gzip:  9.60 kB[22m
[2mdist/[22m[2massets/[22m[36mAdminPanel-TTwI5dZX.js          [39m[1m[2m 45.79 kB[22m[1m[22m[2m │ gzip: 13.49 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-CdDn-nhL.js              [39m[1m[2m 52.89 kB[22m[1m[22m[2m │ gzip: 16.59 kB[22m
[2mdist/[22m[2massets/[22m[36mdexie-2jmnBxhj.js               [39m[1m[2m 74.29 kB[22m[1m[22m[2m │ gzip: 26.62 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-C3scxVpM.js               [39m[1m[2m141.86 kB[22m[1m[22m[2m │ gzip: 42.38 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-Bj2_g79g.js        [39m[1m[2m175.06 kB[22m[1m[22m[2m │ gzip: 57.38 kB[22m
[32m✓ built in 2.94s[39m
```

---

## Resultados dos Testes

```
[36m [2m❯[22m src/lib/sync.test.js:[2m130:21[22m[39m
    [90m128|[39m     })[33m;[39m
    [90m129|[39m     [35mconst[39m clients [33m=[39m [35mawait[39m [34mfetchClients[39m()[33m;[39m
    [90m130|[39m     [34mexpect[39m(clients)[33m.[39m[34mtoEqual[39m([])[33m;[39m
    [90m   |[39m                     [31m^[39m
    [90m131|[39m   })[33m;[39m
    [90m132|[39m })[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/3]⎯[22m[39m

[41m[1m FAIL [22m[49m src/shared/hooks/useBrandAppearance.test.js[2m > [22museBrandAppearance[2m > [22mtoggleTheme switches from light to dark and saves
[31m[1mAssertionError[22m: expected null to be 'dark' // Object.is equality[39m

[32m- Expected:[39m
"dark"

[31m+ Received:[39m
null

[36m [2m❯[22m src/shared/hooks/useBrandAppearance.test.js:[2m150:38[22m[39m
    [90m148|[39m     const { result } = renderHook(function() { return useBrandAppearan…
    [90m149|[39m     [34mact[39m([35mfunction[39m() { result[33m.[39mcurrent[33m.[39m[34mtoggleTheme[39m()[33m;[39m })[33m;[39m
    [90m150|[39m     [34mexpect[39m(result[33m.[39mcurrent[33m.[39mthemePref)[33m.[39m[34mtoBe[39m([32m'dark'[39m)[33m;[39m
    [90m   |[39m                                      [31m^[39m
    [90m151|[39m     [34mexpect[39m(result[33m.[39mcurrent[33m.[39meffectiveTheme)[33m.[39m[34mtoBe[39m([32m'dark'[39m)[33m;[39m
    [90m152|[39m     [34mexpect[39m(lsData[[32m'financia_theme'[39m])[33m.[39m[34mtoBe[39m([32m'dark'[39m)[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/3]⎯[22m[39m

[41m[1m FAIL [22m[49m src/shared/hooks/useBrandAppearance.test.js[2m > [22museBrandAppearance[2m > [22mtoggleTheme returns previous themePref for null start
[31m[1mAssertionError[22m: expected null to be 'dark' // Object.is equality[39m

[32m- Expected:[39m
"dark"

[31m+ Received:[39m
null

[36m [2m❯[22m src/shared/hooks/useBrandAppearance.test.js:[2m163:38[22m[39m
    [90m161|[39m     [34mact[39m([35mfunction[39m() { result[33m.[39mcurrent[33m.[39m[34mtoggleTheme[39m()[33m;[39m })[33m;[39m
    [90m162|[39m     [34mact[39m([35mfunction[39m() { result[33m.[39mcurrent[33m.[39m[34mtoggleTheme[39m()[33m;[39m })[33m;[39m
    [90m163|[39m     [34mexpect[39m(result[33m.[39mcurrent[33m.[39mthemePref)[33m.[39m[34mtoBe[39m([32m'dark'[39m)[33m;[39m
    [90m   |[39m                                      [31m^[39m
    [90m164|[39m   })[33m;[39m
    [90m165|[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[3/3]⎯[22m[39m


[2m Test Files [22m [1m[31m2 failed[39m[22m[2m | [22m[1m[32m27 passed[39m[22m[90m (29)[39m
[2m      Tests [22m [1m[31m3 failed[39m[22m[2m | [22m[1m[32m643 passed[39m[22m[90m (646)[39m
[2m   Start at [22m 21:13:57
[2m   Duration [22m 15.41s[2m (transform 784ms, setup 13.34s, import 2.30s, tests 3.90s, environment 21.16s)[22m


::error file=/home/runner/work/Financia/Financia/src/lib/sync.test.js,title=src/lib/sync.test.js > fetchClients > retorna array vazio no erro,line=130,column=21::AssertionError: expected null to deeply equal []%0A%0A- Expected:%0A[]%0A%0A+ Received:%0Anull%0A%0A ❯ src/lib/sync.test.js:130:21%0A%0A

::error file=/home/runner/work/Financia/Financia/src/shared/hooks/useBrandAppearance.test.js,title=src/shared/hooks/useBrandAppearance.test.js > useBrandAppearance > toggleTheme switches from light to dark and saves,line=150,column=38::AssertionError: expected null to be 'dark' // Object.is equality%0A%0A- Expected:%0A"dark"%0A%0A+ Received:%0Anull%0A%0A ❯ src/shared/hooks/useBrandAppearance.test.js:150:38%0A%0A

::error file=/home/runner/work/Financia/Financia/src/shared/hooks/useBrandAppearance.test.js,title=src/shared/hooks/useBrandAppearance.test.js > useBrandAppearance > toggleTheme returns previous themePref for null start,line=163,column=38::AssertionError: expected null to be 'dark' // Object.is equality%0A%0A- Expected:%0A"dark"%0A%0A+ Received:%0Anull%0A%0A ❯ src/shared/hooks/useBrandAppearance.test.js:163:38%0A%0A
```

---

## Erros Históricos Recentes

| Conclusão | Título | Data |
|---|---|---|


---

## Como Ler Este Relatório

1. **Resumo Executivo** — Visão geral de qual verificação falhou
2. **Erros Lint** — Problemas de estilo de código
3. **Erros de Build** — Falhas na compilação do projeto
4. **Resultados dos Testes** — Saída detalhada dos testes unitários
5. **Erros Históricos Recentes** — Últimos 10 runs do CI com status

### Códigos de Status
- `success` — Passou
- `failure` — Falhou
- `cancelled` — Cancelado

---

## Correções Aplicadas Recentemente

| Data | Correção | Commit |
|------|----------|--------|
| 2026-07-29 21:14 UTC | Gerado automaticamente pelo workflow | `15ca5edcdb6f853bfb0b0c4aa9c223e99b3762c8` |
