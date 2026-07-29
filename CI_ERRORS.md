# Relatório de Erros do CI

**Última atualização:** 2026-07-29 19:45 UTC
**Commit:** `0d749aea989f463ac6c5cb63ebe9dfa0986ee914`
**Branch:** `main`

---

## Resumo Executivo

| Verificação | Status |
|---|---|
| Lint + Typecheck | erros |
| Testes Unitários | ok |
| Build | ok |

---

## Erros Lint

```

/home/runner/work/Financia/Financia/src/features/admin/AdminPanel.jsx
  66:6  warning  React Hook useCallback has an unnecessary dependency: 'session'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/Financia/Financia/src/features/admin/ClientEditModal.jsx
  3:34  warning  'lightenHex' is defined but never used. Allowed unused vars must match /^_/u  @typescript-eslint/no-unused-vars

/home/runner/work/Financia/Financia/src/features/settings/SettingsView.jsx
  76:7  warning  React Hook React.useCallback has an unnecessary dependency: 'cardReload'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

✖ 3 problems (0 errors, 3 warnings)
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
[2mdist/[22m[32mindex.html                             [39m[1m[2m  3.29 kB[22m[1m[22m[2m │ gzip:  1.17 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-CZEQRvN1.css              [39m[1m[2m 52.89 kB[22m[1m[22m[2m │ gzip: 11.01 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-functions-vwDjcXxQ.js  [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-db-vwDjcXxQ.js         [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-vwDjcXxQ.js            [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-storage-vwDjcXxQ.js    [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-auth-vwDjcXxQ.js       [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36museDebouncedValue-B0hKsm5O.js   [39m[1m[2m  0.21 kB[22m[1m[22m[2m │ gzip:  0.17 kB[22m
[2mdist/[22m[2massets/[22m[36mlogoUtils-D9YBHlqt.js           [39m[1m[2m  0.89 kB[22m[1m[22m[2m │ gzip:  0.47 kB[22m
[2mdist/[22m[2massets/[22m[36maiClient-qYxgE1Fd.js            [39m[1m[2m  2.87 kB[22m[1m[22m[2m │ gzip:  1.52 kB[22m
[2mdist/[22m[2massets/[22m[36mradix-E4vWxl6g.js               [39m[1m[2m  2.95 kB[22m[1m[22m[2m │ gzip:  1.41 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-scheduler-CbiHYZlt.js    [39m[1m[2m  4.10 kB[22m[1m[22m[2m │ gzip:  1.78 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-CCVTeScg.js           [39m[1m[2m  4.23 kB[22m[1m[22m[2m │ gzip:  1.80 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-Bxr26cYu.js           [39m[1m[2m  5.13 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-DzPVa7NP.js         [39m[1m[2m  6.29 kB[22m[1m[22m[2m │ gzip:  2.78 kB[22m
[2mdist/[22m[2massets/[22m[36mSaleForm-D1sS90nW.js            [39m[1m[2m  7.45 kB[22m[1m[22m[2m │ gzip:  2.55 kB[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPolicy-BkGvRqJc.js       [39m[1m[2m  7.96 kB[22m[1m[22m[2m │ gzip:  3.45 kB[22m
[2mdist/[22m[2massets/[22m[36mTermsOfService-c0xlNlJ-.js      [39m[1m[2m  8.70 kB[22m[1m[22m[2m │ gzip:  3.67 kB[22m
[2mdist/[22m[2massets/[22m[36mReportView-GxlhO6SW.js          [39m[1m[2m 10.22 kB[22m[1m[22m[2m │ gzip:  3.12 kB[22m
[2mdist/[22m[2massets/[22m[36mstripe-BFjv1rCu.js              [39m[1m[2m 13.00 kB[22m[1m[22m[2m │ gzip:  4.88 kB[22m
[2mdist/[22m[2massets/[22m[36mTxView-BgkoWyXw.js              [39m[1m[2m 14.60 kB[22m[1m[22m[2m │ gzip:  4.78 kB[22m
[2mdist/[22m[2massets/[22m[36mInventoryView-DKOMgXtc.js       [39m[1m[2m 19.97 kB[22m[1m[22m[2m │ gzip:  5.52 kB[22m
[2mdist/[22m[2massets/[22m[36mquery-ByP6YL3J.js               [39m[1m[2m 24.61 kB[22m[1m[22m[2m │ gzip:  7.40 kB[22m
[2mdist/[22m[2massets/[22m[36mDashboard-BlTxXdLP.js           [39m[1m[2m 27.47 kB[22m[1m[22m[2m │ gzip:  7.47 kB[22m
[2mdist/[22m[2massets/[22m[36mPlansView-B5ll01h2.js           [39m[1m[2m 31.24 kB[22m[1m[22m[2m │ gzip:  8.33 kB[22m
[2mdist/[22m[2massets/[22m[36mLanding-DJl4c8ft.js             [39m[1m[2m 32.00 kB[22m[1m[22m[2m │ gzip:  7.66 kB[22m
[2mdist/[22m[2massets/[22m[36mSettingsView-HYTvEL0T.js        [39m[1m[2m 35.76 kB[22m[1m[22m[2m │ gzip:  9.86 kB[22m
[2mdist/[22m[2massets/[22m[36mBrandStudioView-D9AJ_Dwb.js     [39m[1m[2m 36.81 kB[22m[1m[22m[2m │ gzip:  9.60 kB[22m
[2mdist/[22m[2massets/[22m[36mAdminPanel-C-QL-JUd.js          [39m[1m[2m 45.54 kB[22m[1m[22m[2m │ gzip: 13.40 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-CdDn-nhL.js              [39m[1m[2m 52.89 kB[22m[1m[22m[2m │ gzip: 16.59 kB[22m
[2mdist/[22m[2massets/[22m[36mdexie-2jmnBxhj.js               [39m[1m[2m 74.29 kB[22m[1m[22m[2m │ gzip: 26.62 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-DllJDXt4.js               [39m[1m[2m139.76 kB[22m[1m[22m[2m │ gzip: 41.73 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-Bj2_g79g.js        [39m[1m[2m175.06 kB[22m[1m[22m[2m │ gzip: 57.38 kB[22m
[32m✓ built in 3.69s[39m
```

---

## Resultados dos Testes

```

> gestao-financeira@5.1.1 test
> vitest run

[2m7:44:47 PM[22m [33m[1m[vite][22m[39m [33mwarning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.[39m
[2m7:44:47 PM[22m [33m[1m[vite][22m[39m [33mwarning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.[39m
[33mBoth esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored.[39m The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`

[1m[30m[46m RUN [49m[39m[22m [36mv4.1.10 [39m[90m/home/runner/work/Financia/Financia[39m

 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js [2m([22m[2m13 tests[22m[2m)[22m[32m 28[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js [2m([22m[2m11 tests[22m[2m)[22m[32m 32[2mms[22m[39m
 [32m✓[39m src/test/utils.test.js [2m([22m[2m141 tests[22m[2m)[22m[32m 61[2mms[22m[39m
[90mstdout[2m | src/lib/sync.test.js[2m > [22m[2mbenchmarks[2m > [22m[2mQA-04: syncAll 10k rows < 5s (benchmark)
[22m[39mQA-04 benchmark: syncAll took 0.13ms

[90mstdout[2m | src/lib/sync.test.js[2m > [22m[2mbenchmarks[2m > [22m[2mQA-05: admin-stripe-overview p95 < 2s (100 subs with cursor pagination)
[22m[39mQA-05 benchmark: fetchStripeOverview p95=0.01ms avg=0.00ms over 100 iterations

 [32m✓[39m src/lib/sync.test.js [2m([22m[2m33 tests[22m[2m)[22m[32m 39[2mms[22m[39m
 [32m✓[39m src/test/constants.test.js [2m([22m[2m95 tests[22m[2m)[22m[32m 61[2mms[22m[39m
 [32m✓[39m src/features/branding/components.test.jsx [2m([22m[2m26 tests[22m[2m)[22m[33m 1702[2mms[22m[39m
 [32m✓[39m src/shared/hooks/useBrandAppearance.test.js [2m([22m[2m19 tests[22m[2m)[22m[32m 85[2mms[22m[39m
 [32m✓[39m src/features/branding/accessibility.test.jsx [2m([22m[2m28 tests[22m[2m)[22m[33m 1415[2mms[22m[39m
 [32m✓[39m src/features/branding/responseProcessor.test.js [2m([22m[2m23 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m src/features/transactions/useTx.test.js [2m([22m[2m18 tests[22m[2m)[22m[32m 75[2mms[22m[39m
 [32m✓[39m src/lib/crud.test.js [2m([22m[2m19 tests[22m[2m)[22m[32m 43[2mms[22m[39m
 [32m✓[39m src/features/inventory/useProducts.test.js [2m([22m[2m13 tests[22m[2m)[22m[32m 54[2mms[22m[39m
[90mstderr[2m | src/features/branding/presets.test.js[2m > [22m[2mpresets[2m > [22m[2msetOnChange registra callback
[22m[39mWarning: You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);

 [32m✓[39m src/features/branding/presets.test.js [2m([22m[2m17 tests[22m[2m)[22m[32m 34[2mms[22m[39m
 [32m✓[39m src/features/inventory/useLosses.test.js [2m([22m[2m12 tests[22m[2m)[22m[32m 75[2mms[22m[39m
 [32m✓[39m src/lib/impersonation.integration.test.js [2m([22m[2m11 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m src/shared/ui/PhoneInput.test.jsx [2m([22m[2m12 tests[22m[2m)[22m[33m 642[2mms[22m[39m
[90mstderr[2m | src/lib/stripe.test.js
[22m[39mSupabase não configurado: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.

 [32m✓[39m src/lib/stripe.test.js [2m([22m[2m19 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m src/lib/auth.test.js [2m([22m[2m9 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m src/shared/ui/ColorField.test.jsx [2m([22m[2m12 tests[22m[2m)[22m[32m 158[2mms[22m[39m
 [32m✓[39m src/features/branding/LogoSchemes.test.js [2m([22m[2m13 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m src/lib/recurring.test.js [2m([22m[2m16 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m src/features/branding/logoUtils.test.js [2m([22m[2m14 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m src/lib/plans.test.js [2m([22m[2m16 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m src/features/branding/LogoSchemes.test.jsx [2m([22m[2m9 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/lib/utils.test.js [2m([22m[2m16 tests[22m[2m)[22m[32m 21[2mms[22m[39m
 [32m✓[39m src/lib/constants.test.js [2m([22m[2m12 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m src/test/components.test.js [2m([22m[2m6 tests[22m[2m)[22m[33m 376[2mms[22m[39m
 [32m✓[39m src/lib/cleanNumeric.test.js [2m([22m[2m8 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m src/lib/revenue.test.js [2m([22m[2m5 tests[22m[2m)[22m[32m 8[2mms[22m[39m

[2m Test Files [22m [1m[32m29 passed[39m[22m[90m (29)[39m
[2m      Tests [22m [1m[32m646 passed[39m[22m[90m (646)[39m
[2m   Start at [22m 19:44:47
[2m   Duration [22m 20.93s[2m (transform 926ms, setup 18.74s, import 2.85s, tests 5.10s, environment 28.49s)[22m
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
| 2026-07-29 19:45 UTC | Gerado automaticamente pelo workflow | `0d749aea989f463ac6c5cb63ebe9dfa0986ee914` |
