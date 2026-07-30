# Relatório de Erros do CI

**Última atualização:** 2026-07-30 01:18 UTC
**Commit:** `07de0796143058a28a10f7b09409b04d432f6db3`
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

/home/runner/work/Financia/Financia/src/routes/routes.jsx
  1:33  warning  'useCallback' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/shared/hooks/useSyncLoop.js
  17:7  warning  'canSync' is assigned a value but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

✖ 5 problems (0 errors, 5 warnings)
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
[2mdist/[22m[2massets/[22m[36mlogoUtils-DQlqqxw1.js           [39m[1m[2m  0.89 kB[22m[1m[22m[2m │ gzip:  0.47 kB[22m
[2mdist/[22m[2massets/[22m[36maiClient-dwKUbPiM.js            [39m[1m[2m  2.87 kB[22m[1m[22m[2m │ gzip:  1.52 kB[22m
[2mdist/[22m[2massets/[22m[36mradix-E4vWxl6g.js               [39m[1m[2m  2.95 kB[22m[1m[22m[2m │ gzip:  1.41 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-scheduler-CbiHYZlt.js    [39m[1m[2m  4.10 kB[22m[1m[22m[2m │ gzip:  1.78 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-CCVTeScg.js           [39m[1m[2m  4.23 kB[22m[1m[22m[2m │ gzip:  1.80 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-BYwiBhDZ.js           [39m[1m[2m  5.15 kB[22m[1m[22m[2m │ gzip:  2.08 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-rmt99Hob.js         [39m[1m[2m  6.29 kB[22m[1m[22m[2m │ gzip:  2.78 kB[22m
[2mdist/[22m[2massets/[22m[36mSaleForm-CAk2PjWQ.js            [39m[1m[2m  7.45 kB[22m[1m[22m[2m │ gzip:  2.55 kB[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPolicy-BkGvRqJc.js       [39m[1m[2m  7.96 kB[22m[1m[22m[2m │ gzip:  3.45 kB[22m
[2mdist/[22m[2massets/[22m[36mTermsOfService-c0xlNlJ-.js      [39m[1m[2m  8.70 kB[22m[1m[22m[2m │ gzip:  3.67 kB[22m
[2mdist/[22m[2massets/[22m[36mReportView-Dv12YKT8.js          [39m[1m[2m 10.37 kB[22m[1m[22m[2m │ gzip:  3.14 kB[22m
[2mdist/[22m[2massets/[22m[36mstripe-BFjv1rCu.js              [39m[1m[2m 13.00 kB[22m[1m[22m[2m │ gzip:  4.88 kB[22m
[2mdist/[22m[2massets/[22m[36mTxView-DVVaVBRI.js              [39m[1m[2m 14.60 kB[22m[1m[22m[2m │ gzip:  4.78 kB[22m
[2mdist/[22m[2massets/[22m[36mInventoryView-B_GWzrLZ.js       [39m[1m[2m 19.97 kB[22m[1m[22m[2m │ gzip:  5.52 kB[22m
[2mdist/[22m[2massets/[22m[36mquery-ByP6YL3J.js               [39m[1m[2m 24.61 kB[22m[1m[22m[2m │ gzip:  7.40 kB[22m
[2mdist/[22m[2massets/[22m[36mDashboard-CdvlCtcK.js           [39m[1m[2m 27.71 kB[22m[1m[22m[2m │ gzip:  7.52 kB[22m
[2mdist/[22m[2massets/[22m[36mPlansView-Co7zslhO.js           [39m[1m[2m 31.26 kB[22m[1m[22m[2m │ gzip:  8.33 kB[22m
[2mdist/[22m[2massets/[22m[36mLanding-oMW4kpXC.js             [39m[1m[2m 32.00 kB[22m[1m[22m[2m │ gzip:  7.66 kB[22m
[2mdist/[22m[2massets/[22m[36mSettingsView-D1QhcMP2.js        [39m[1m[2m 35.76 kB[22m[1m[22m[2m │ gzip:  9.86 kB[22m
[2mdist/[22m[2massets/[22m[36mBrandStudioView-BbAEKDo-.js     [39m[1m[2m 37.25 kB[22m[1m[22m[2m │ gzip:  9.72 kB[22m
[2mdist/[22m[2massets/[22m[36mAdminPanel-2Yxl1isn.js          [39m[1m[2m 45.79 kB[22m[1m[22m[2m │ gzip: 13.49 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-CdDn-nhL.js              [39m[1m[2m 52.89 kB[22m[1m[22m[2m │ gzip: 16.59 kB[22m
[2mdist/[22m[2massets/[22m[36mdexie-2jmnBxhj.js               [39m[1m[2m 74.29 kB[22m[1m[22m[2m │ gzip: 26.62 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-CVvdMwsA.js               [39m[1m[2m144.14 kB[22m[1m[22m[2m │ gzip: 43.15 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-Bj2_g79g.js        [39m[1m[2m175.06 kB[22m[1m[22m[2m │ gzip: 57.38 kB[22m
[32m✓ built in 3.65s[39m
```

---

## Resultados dos Testes

```
    [90m148|[39m     const { result } = renderHook(function() { return useBrandAppearan…
    [90m149|[39m     [34mact[39m([35mfunction[39m() { result[33m.[39mcurrent[33m.[39m[34mtoggleTheme[39m()[33m;[39m })[33m;[39m
    [90m150|[39m     [34mexpect[39m(result[33m.[39mcurrent[33m.[39mthemePref)[33m.[39m[34mtoBe[39m([32m'dark'[39m)[33m;[39m
    [90m   |[39m                                      [31m^[39m
    [90m151|[39m     [34mexpect[39m(result[33m.[39mcurrent[33m.[39meffectiveTheme)[33m.[39m[34mtoBe[39m([32m'dark'[39m)[33m;[39m
    [90m152|[39m     [34mexpect[39m(lsData[[32m'financia_theme'[39m])[33m.[39m[34mtoBe[39m([32m'dark'[39m)[33m;[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[12/13]⎯[22m[39m

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

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[13/13]⎯[22m[39m


[2m Test Files [22m [1m[31m3 failed[39m[22m[2m | [22m[1m[32m26 passed[39m[22m[90m (29)[39m
[2m      Tests [22m [1m[31m13 failed[39m[22m[2m | [22m[1m[32m633 passed[39m[22m[90m (646)[39m
[2m   Start at [22m 01:18:04
[2m   Duration [22m 20.20s[2m (transform 874ms, setup 17.66s, import 2.78s, tests 5.25s, environment 27.52s)[22m


::error file=/home/runner/work/Financia/Financia/src/lib/sync.test.js,title=src/lib/sync.test.js > fetchClients > retorna array vazio no erro,line=130,column=21::AssertionError: expected null to deeply equal []%0A%0A- Expected:%0A[]%0A%0A+ Received:%0Anull%0A%0A ❯ src/lib/sync.test.js:130:21%0A%0A

::error file=/home/runner/work/Financia/Financia/src/features/branding/responseProcessor.test.js,title=src/features/branding/responseProcessor.test.js > responseProcessor > processa resposta valida com modulo palette,line=23,column=28::AssertionError: expected false to be true // Object.is equality%0A%0A- Expected%0A+ Received%0A%0A- true%0A+ false%0A%0A ❯ src/features/branding/responseProcessor.test.js:23:28%0A%0A

::error file=/home/runner/work/Financia/Financia/src/features/branding/responseProcessor.test.js,title=src/features/branding/responseProcessor.test.js > responseProcessor > mantem nome da marca original,line=41,column=33::TypeError: Cannot read properties of undefined (reading 'name')%0A ❯ src/features/branding/responseProcessor.test.js:41:33%0A%0A

::error file=/home/runner/work/Financia/Financia/src/features/branding/responseProcessor.test.js,title=src/features/branding/responseProcessor.test.js > responseProcessor > usa cores padrao quando palette nao fornecida,line=48,column=33::TypeError: Cannot read properties of undefined (reading 'color')%0A ❯ src/features/branding/responseProcessor.test.js:48:33%0A%0A

::error file=/home/runner/work/Financia/Financia/src/features/branding/responseProcessor.test.js,title=src/features/branding/responseProcessor.test.js > responseProcessor > usa tema da marca quando mode nao fornecido,line=57,column=33::TypeError: Cannot read properties of undefined (reading 'theme')%0A ❯ src/features/branding/responseProcessor.test.js:57:33%0A%0A

::error file=/home/runner/work/Financia/Financia/src/features/branding/responseProcessor.test.js,title=src/features/branding/responseProcessor.test.js > responseProcessor > usa light como tema padrao,line=64,column=33::TypeError: Cannot read properties of undefined (reading 'theme')%0A ❯ src/features/branding/responseProcessor.test.js:64:33%0A%0A

::error file=/home/runner/work/Financia/Financia/src/features/branding/responseProcessor.test.js,title=src/features/branding/responseProcessor.test.js > responseProcessor > incrementa visual_version,line=71,column=33::TypeError: Cannot read properties of undefined (reading 'visual_version')%0A ❯ src/features/branding/responseProcessor.test.js:71:33%0A%0A

::error file=/home/runner/work/Financia/Financia/src/features/branding/responseProcessor.test.js,title=src/features/branding/responseProcessor.test.js > responseProcessor > aceita objeto ja parseado,line=106,column=28::AssertionError: expected false to be true // Object.is equality%0A%0A- Expected%0A+ Received%0A%0A- true%0A+ false%0A%0A ❯ src/features/branding/responseProcessor.test.js:106:28%0A%0A

::error file=/home/runner/work/Financia/Financia/src/features/branding/responseProcessor.test.js,title=src/features/branding/responseProcessor.test.js > responseProcessor > serializa brand_config como string JSON,line=113,column=40::TypeError: Cannot read properties of undefined (reading 'brand_config')%0A ❯ src/features/branding/responseProcessor.test.js:113:40%0A%0A

::error file=/home/runner/work/Financia/Financia/src/features/branding/responseProcessor.test.js,title=src/features/branding/responseProcessor.test.js > responseProcessor > define custom_palette como true,line=122,column=33::TypeError: Cannot read properties of undefined (reading 'custom_palette')%0A ❯ src/features/branding/responseProcessor.test.js:122:33%0A%0A

::error file=/home/runner/work/Financia/Financia/src/features/branding/responseProcessor.test.js,title=src/features/branding/responseProcessor.test.js > responseProcessor > preserva campos existentes da marca nao sobrescritos,line=129,column=33::TypeError: Cannot read properties of undefined (reading 'name')%0A ❯ src/features/branding/responseProcessor.test.js:129:33%0A%0A

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
| 2026-07-30 01:18 UTC | Gerado automaticamente pelo workflow | `07de0796143058a28a10f7b09409b04d432f6db3` |
