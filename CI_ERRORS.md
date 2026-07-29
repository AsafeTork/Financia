# Relatório de Erros do CI

**Última atualização:** 2026-07-29 17:18 UTC
**Commit:** `665f7f084df52350096658c21a90088b5d4b73ba`
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

/home/runner/work/Financia/Financia/src/features/settings/SettingsView.jsx
  76:7  warning  React Hook React.useCallback has an unnecessary dependency: 'cardReload'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

✖ 1 problem (0 errors, 1 warning)
```

---

## Erros de Build

```

> gestao-financeira@5.1.1 build
> vite build

[36mvite v5.4.21 [32mbuilding for production...[36m[39m
transforming...
[32m✓[39m 236 modules transformed.
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
[2mdist/[22m[2massets/[22m[36maiClient-ftFiLOjY.js            [39m[1m[2m  2.87 kB[22m[1m[22m[2m │ gzip:  1.52 kB[22m
[2mdist/[22m[2massets/[22m[36mradix-E4vWxl6g.js               [39m[1m[2m  2.95 kB[22m[1m[22m[2m │ gzip:  1.41 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-scheduler-CbiHYZlt.js    [39m[1m[2m  4.10 kB[22m[1m[22m[2m │ gzip:  1.78 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-CCVTeScg.js           [39m[1m[2m  4.23 kB[22m[1m[22m[2m │ gzip:  1.80 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-DVZe7jL4.js           [39m[1m[2m  5.13 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-vcEu3zGY.js         [39m[1m[2m  6.29 kB[22m[1m[22m[2m │ gzip:  2.78 kB[22m
[2mdist/[22m[2massets/[22m[36mSaleForm-Bt9hYCN8.js            [39m[1m[2m  7.45 kB[22m[1m[22m[2m │ gzip:  2.55 kB[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPolicy-BkGvRqJc.js       [39m[1m[2m  7.96 kB[22m[1m[22m[2m │ gzip:  3.45 kB[22m
[2mdist/[22m[2massets/[22m[36mTermsOfService-c0xlNlJ-.js      [39m[1m[2m  8.70 kB[22m[1m[22m[2m │ gzip:  3.67 kB[22m
[2mdist/[22m[2massets/[22m[36mReportView-DKvQGSnj.js          [39m[1m[2m 10.22 kB[22m[1m[22m[2m │ gzip:  3.12 kB[22m
[2mdist/[22m[2massets/[22m[36mstripe-BFjv1rCu.js              [39m[1m[2m 13.00 kB[22m[1m[22m[2m │ gzip:  4.88 kB[22m
[2mdist/[22m[2massets/[22m[36mTxView-1kkAKjPY.js              [39m[1m[2m 14.51 kB[22m[1m[22m[2m │ gzip:  4.73 kB[22m
[2mdist/[22m[2massets/[22m[36mInventoryView-CJ183rem.js       [39m[1m[2m 19.88 kB[22m[1m[22m[2m │ gzip:  5.47 kB[22m
[2mdist/[22m[2massets/[22m[36mquery-Bh9are3d.js               [39m[1m[2m 26.92 kB[22m[1m[22m[2m │ gzip:  8.25 kB[22m
[2mdist/[22m[2massets/[22m[36mDashboard-BoB1ed-d.js           [39m[1m[2m 27.45 kB[22m[1m[22m[2m │ gzip:  7.47 kB[22m
[2mdist/[22m[2massets/[22m[36mPlansView-Cf6GwU5s.js           [39m[1m[2m 31.24 kB[22m[1m[22m[2m │ gzip:  8.33 kB[22m
[2mdist/[22m[2massets/[22m[36mLanding-B1psQmKv.js             [39m[1m[2m 32.00 kB[22m[1m[22m[2m │ gzip:  7.66 kB[22m
[2mdist/[22m[2massets/[22m[36mBrandStudioView-CAm-yzFm.js     [39m[1m[2m 37.55 kB[22m[1m[22m[2m │ gzip:  9.87 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-CdDn-nhL.js              [39m[1m[2m 52.89 kB[22m[1m[22m[2m │ gzip: 16.59 kB[22m
[2mdist/[22m[2massets/[22m[36mdexie-2jmnBxhj.js               [39m[1m[2m 74.29 kB[22m[1m[22m[2m │ gzip: 26.62 kB[22m
[2mdist/[22m[2massets/[22m[36mSettingsView-DbwE4-BQ.js        [39m[1m[2m 78.22 kB[22m[1m[22m[2m │ gzip: 20.31 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-DTtkfVB6.js               [39m[1m[2m137.17 kB[22m[1m[22m[2m │ gzip: 40.93 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-Bj2_g79g.js        [39m[1m[2m175.06 kB[22m[1m[22m[2m │ gzip: 57.38 kB[22m
[32m✓ built in 3.25s[39m
```

---

## Resultados dos Testes

```

> gestao-financeira@5.1.1 test
> vitest run

[2m5:18:01 PM[22m [33m[1m[vite][22m[39m [33mwarning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.[39m
[2m5:18:01 PM[22m [33m[1m[vite][22m[39m [33mwarning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.[39m
[33mBoth esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored.[39m The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`

[1m[30m[46m RUN [49m[39m[22m [36mv4.1.10 [39m[90m/home/runner/work/Financia/Financia[39m

 [32m✓[39m src/lib/stripe-subscription-cycle.integration.test.js [2m([22m[2m13 tests[22m[2m)[22m[32m 29[2mms[22m[39m
 [32m✓[39m src/lib/stripe-webhook.integration.test.js [2m([22m[2m11 tests[22m[2m)[22m[32m 30[2mms[22m[39m
 [32m✓[39m src/test/utils.test.js [2m([22m[2m141 tests[22m[2m)[22m[32m 45[2mms[22m[39m
 [32m✓[39m src/test/constants.test.js [2m([22m[2m95 tests[22m[2m)[22m[32m 42[2mms[22m[39m
[90mstdout[2m | src/lib/sync.test.js[2m > [22m[2mbenchmarks[2m > [22m[2mQA-04: syncAll 10k rows < 5s (benchmark)
[22m[39mQA-04 benchmark: syncAll took 0.15ms

[90mstdout[2m | src/lib/sync.test.js[2m > [22m[2mbenchmarks[2m > [22m[2mQA-05: admin-stripe-overview p95 < 2s (100 subs with cursor pagination)
[22m[39mQA-05 benchmark: fetchStripeOverview p95=0.01ms avg=0.00ms over 100 iterations

 [32m✓[39m src/lib/sync.test.js [2m([22m[2m33 tests[22m[2m)[22m[32m 44[2mms[22m[39m
 [32m✓[39m src/features/branding/components.test.jsx [2m([22m[2m26 tests[22m[2m)[22m[33m 1513[2mms[22m[39m
 [32m✓[39m src/shared/hooks/useBrandAppearance.test.js [2m([22m[2m19 tests[22m[2m)[22m[32m 83[2mms[22m[39m
 [32m✓[39m src/features/branding/accessibility.test.jsx [2m([22m[2m28 tests[22m[2m)[22m[33m 1359[2mms[22m[39m
 [32m✓[39m src/features/branding/responseProcessor.test.js [2m([22m[2m23 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m src/features/transactions/useTx.test.js [2m([22m[2m18 tests[22m[2m)[22m[32m 105[2mms[22m[39m
 [32m✓[39m src/lib/crud.test.js [2m([22m[2m19 tests[22m[2m)[22m[32m 24[2mms[22m[39m
 [32m✓[39m src/features/inventory/useProducts.test.js [2m([22m[2m13 tests[22m[2m)[22m[32m 92[2mms[22m[39m
[90mstderr[2m | src/features/branding/presets.test.js[2m > [22m[2mpresets[2m > [22m[2msetOnChange registra callback
[22m[39mWarning: You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);

 [32m✓[39m src/features/branding/presets.test.js [2m([22m[2m17 tests[22m[2m)[22m[32m 33[2mms[22m[39m
 [32m✓[39m src/features/inventory/useLosses.test.js [2m([22m[2m12 tests[22m[2m)[22m[32m 58[2mms[22m[39m
 [32m✓[39m src/lib/impersonation.integration.test.js [2m([22m[2m11 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m src/shared/ui/PhoneInput.test.jsx [2m([22m[2m12 tests[22m[2m)[22m[33m 631[2mms[22m[39m
[90mstderr[2m | src/lib/stripe.test.js
[22m[39mSupabase não configurado: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.

 [32m✓[39m src/lib/stripe.test.js [2m([22m[2m19 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m src/lib/auth.test.js [2m([22m[2m9 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m src/shared/ui/ColorField.test.jsx [2m([22m[2m12 tests[22m[2m)[22m[32m 177[2mms[22m[39m
 [32m✓[39m src/features/branding/LogoSchemes.test.js [2m([22m[2m13 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m src/lib/recurring.test.js [2m([22m[2m16 tests[22m[2m)[22m[32m 25[2mms[22m[39m
 [32m✓[39m src/features/branding/logoUtils.test.js [2m([22m[2m14 tests[22m[2m)[22m[32m 12[2mms[22m[39m
 [32m✓[39m src/lib/plans.test.js [2m([22m[2m16 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m src/features/branding/LogoSchemes.test.jsx [2m([22m[2m9 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m src/lib/utils.test.js [2m([22m[2m16 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m src/lib/constants.test.js [2m([22m[2m12 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/test/components.test.js [2m([22m[2m6 tests[22m[2m)[22m[33m 321[2mms[22m[39m
 [32m✓[39m src/lib/cleanNumeric.test.js [2m([22m[2m8 tests[22m[2m)[22m[32m 9[2mms[22m[39m
 [32m✓[39m src/lib/revenue.test.js [2m([22m[2m5 tests[22m[2m)[22m[32m 7[2mms[22m[39m

[2m Test Files [22m [1m[32m29 passed[39m[22m[90m (29)[39m
[2m      Tests [22m [1m[32m646 passed[39m[22m[90m (646)[39m
[2m   Start at [22m 17:18:01
[2m   Duration [22m 18.84s[2m (transform 871ms, setup 16.48s, import 2.75s, tests 4.79s, environment 25.73s)[22m
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
| 2026-07-29 17:18 UTC | Gerado automaticamente pelo workflow | `665f7f084df52350096658c21a90088b5d4b73ba` |
