# Relatório de Erros do CI

**Última atualização:** 2026-07-29 20:28 UTC
**Commit:** `7e4c045fe5ff03660a2f64b27c42776aec87cff3`
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
  66:6  warning  React Hook useCallback has an unnecessary dependency: 'session'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

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
[2mdist/[22m[32mindex.html                             [39m[1m[2m  3.29 kB[22m[1m[22m[2m │ gzip:  1.17 kB[22m
[2mdist/[22m[2massets/[22m[35mindex-CZEQRvN1.css              [39m[1m[2m 52.89 kB[22m[1m[22m[2m │ gzip: 11.01 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-functions-vwDjcXxQ.js  [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-db-vwDjcXxQ.js         [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-vwDjcXxQ.js            [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-storage-vwDjcXxQ.js    [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36msupabase-auth-vwDjcXxQ.js       [39m[1m[2m  0.00 kB[22m[1m[22m[2m │ gzip:  0.02 kB[22m
[2mdist/[22m[2massets/[22m[36museDebouncedValue-B0hKsm5O.js   [39m[1m[2m  0.21 kB[22m[1m[22m[2m │ gzip:  0.17 kB[22m
[2mdist/[22m[2massets/[22m[36mlogoUtils-CxEXPto9.js           [39m[1m[2m  0.89 kB[22m[1m[22m[2m │ gzip:  0.47 kB[22m
[2mdist/[22m[2massets/[22m[36maiClient-DryNsRYl.js            [39m[1m[2m  2.87 kB[22m[1m[22m[2m │ gzip:  1.52 kB[22m
[2mdist/[22m[2massets/[22m[36mradix-E4vWxl6g.js               [39m[1m[2m  2.95 kB[22m[1m[22m[2m │ gzip:  1.41 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-scheduler-CbiHYZlt.js    [39m[1m[2m  4.10 kB[22m[1m[22m[2m │ gzip:  1.78 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-CCVTeScg.js           [39m[1m[2m  4.23 kB[22m[1m[22m[2m │ gzip:  1.80 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-BZTj5OVh.js           [39m[1m[2m  5.13 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-CZmDk6fj.js         [39m[1m[2m  6.29 kB[22m[1m[22m[2m │ gzip:  2.78 kB[22m
[2mdist/[22m[2massets/[22m[36mSaleForm-LJ4GNvrB.js            [39m[1m[2m  7.45 kB[22m[1m[22m[2m │ gzip:  2.55 kB[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPolicy-BkGvRqJc.js       [39m[1m[2m  7.96 kB[22m[1m[22m[2m │ gzip:  3.45 kB[22m
[2mdist/[22m[2massets/[22m[36mTermsOfService-c0xlNlJ-.js      [39m[1m[2m  8.70 kB[22m[1m[22m[2m │ gzip:  3.67 kB[22m
[2mdist/[22m[2massets/[22m[36mReportView-cpPc7uke.js          [39m[1m[2m 10.22 kB[22m[1m[22m[2m │ gzip:  3.12 kB[22m
[2mdist/[22m[2massets/[22m[36mstripe-BFjv1rCu.js              [39m[1m[2m 13.00 kB[22m[1m[22m[2m │ gzip:  4.88 kB[22m
[2mdist/[22m[2massets/[22m[36mTxView-DAe2HQPX.js              [39m[1m[2m 14.60 kB[22m[1m[22m[2m │ gzip:  4.78 kB[22m
[2mdist/[22m[2massets/[22m[36mInventoryView-Bpf17QVO.js       [39m[1m[2m 19.97 kB[22m[1m[22m[2m │ gzip:  5.52 kB[22m
[2mdist/[22m[2massets/[22m[36mquery-ByP6YL3J.js               [39m[1m[2m 24.61 kB[22m[1m[22m[2m │ gzip:  7.40 kB[22m
[2mdist/[22m[2massets/[22m[36mDashboard-CKf9m3r8.js           [39m[1m[2m 27.47 kB[22m[1m[22m[2m │ gzip:  7.47 kB[22m
[2mdist/[22m[2massets/[22m[36mPlansView-Cet20w_N.js           [39m[1m[2m 31.24 kB[22m[1m[22m[2m │ gzip:  8.33 kB[22m
[2mdist/[22m[2massets/[22m[36mLanding-DSQKuT0v.js             [39m[1m[2m 32.00 kB[22m[1m[22m[2m │ gzip:  7.66 kB[22m
[2mdist/[22m[2massets/[22m[36mSettingsView-DuqpjQsi.js        [39m[1m[2m 35.76 kB[22m[1m[22m[2m │ gzip:  9.86 kB[22m
[2mdist/[22m[2massets/[22m[36mBrandStudioView-BjpF1MgS.js     [39m[1m[2m 36.81 kB[22m[1m[22m[2m │ gzip:  9.61 kB[22m
[2mdist/[22m[2massets/[22m[36mAdminPanel-DsjqZZ4C.js          [39m[1m[2m 45.54 kB[22m[1m[22m[2m │ gzip: 13.39 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-CdDn-nhL.js              [39m[1m[2m 52.89 kB[22m[1m[22m[2m │ gzip: 16.59 kB[22m
[2mdist/[22m[2massets/[22m[36mdexie-2jmnBxhj.js               [39m[1m[2m 74.29 kB[22m[1m[22m[2m │ gzip: 26.62 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-PM_cMOXS.js               [39m[1m[2m141.72 kB[22m[1m[22m[2m │ gzip: 42.34 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-Bj2_g79g.js        [39m[1m[2m175.06 kB[22m[1m[22m[2m │ gzip: 57.38 kB[22m
[32m✓ built in 3.63s[39m
```

---

## Resultados dos Testes

```
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2955:64

[90mstderr[2m | src/lib/sync.test.js[2m > [22m[2mfetchStripeOverview[2m > [22m[2mretorna null na exception
[22m[39m[sync] fetchStripeOverview: Error: x
    at [90m/home/runner/work/Financia/Financia/[39msrc/lib/sync.test.js:182:43
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:302:11
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:1903:26
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2326:20
    at new Promise (<anonymous>)
    at runWithCancel [90m(file:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2323:10[90m)[39m
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2305:20
    at new Promise (<anonymous>)
    at runWithTimeout [90m(file:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2272:10[90m)[39m
    at [90mfile:///home/runner/work/Financia/Financia/[39mnode_modules/[4m@vitest/runner[24m/dist/chunk-artifact.js:2955:64

[90mstdout[2m | src/lib/sync.test.js[2m > [22m[2mbenchmarks[2m > [22m[2mQA-04: syncAll 10k rows < 5s (benchmark)
[22m[39mQA-04 benchmark: syncAll took 0.13ms

[90mstdout[2m | src/lib/sync.test.js[2m > [22m[2mbenchmarks[2m > [22m[2mQA-05: admin-stripe-overview p95 < 2s (100 subs with cursor pagination)
[22m[39mQA-05 benchmark: fetchStripeOverview p95=0.01ms avg=0.00ms over 100 iterations

 [32m✓[39m src/lib/sync.test.js [2m([22m[2m33 tests[22m[2m)[22m[32m 68[2mms[22m[39m
 [32m✓[39m src/test/constants.test.js [2m([22m[2m95 tests[22m[2m)[22m[32m 53[2mms[22m[39m
 [32m✓[39m src/features/branding/components.test.jsx [2m([22m[2m26 tests[22m[2m)[22m[33m 1715[2mms[22m[39m
 [32m✓[39m src/shared/hooks/useBrandAppearance.test.js [2m([22m[2m19 tests[22m[2m)[22m[32m 68[2mms[22m[39m
 [32m✓[39m src/features/branding/responseProcessor.test.js [2m([22m[2m23 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m src/features/branding/accessibility.test.jsx [2m([22m[2m28 tests[22m[2m)[22m[33m 1581[2mms[22m[39m
     [33m[2m✓[22m[39m tem role main e landmarks [33m 328[2mms[22m[39m
 [32m✓[39m src/features/transactions/useTx.test.js [2m([22m[2m18 tests[22m[2m)[22m[32m 85[2mms[22m[39m
 [32m✓[39m src/lib/crud.test.js [2m([22m[2m19 tests[22m[2m)[22m[32m 22[2mms[22m[39m
 [32m✓[39m src/features/inventory/useProducts.test.js [2m([22m[2m13 tests[22m[2m)[22m[32m 82[2mms[22m[39m
[90mstderr[2m | src/features/branding/presets.test.js[2m > [22m[2mpresets[2m > [22m[2msetOnChange registra callback
[22m[39mWarning: You called act(async () => ...) without await. This could lead to unexpected testing behaviour, interleaving multiple act calls and mixing their scopes. You should - await act(async () => ...);

 [32m✓[39m src/features/branding/presets.test.js [2m([22m[2m17 tests[22m[2m)[22m[32m 36[2mms[22m[39m
 [32m✓[39m src/features/inventory/useLosses.test.js [2m([22m[2m12 tests[22m[2m)[22m[32m 83[2mms[22m[39m
 [32m✓[39m src/lib/impersonation.integration.test.js [2m([22m[2m11 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m src/shared/ui/PhoneInput.test.jsx [2m([22m[2m12 tests[22m[2m)[22m[33m 683[2mms[22m[39m
[90mstderr[2m | src/lib/stripe.test.js
[22m[39mSupabase não configurado: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.

 [32m✓[39m src/lib/stripe.test.js [2m([22m[2m19 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m src/lib/auth.test.js [2m([22m[2m9 tests[22m[2m)[22m[32m 23[2mms[22m[39m
 [32m✓[39m src/shared/ui/ColorField.test.jsx [2m([22m[2m12 tests[22m[2m)[22m[32m 196[2mms[22m[39m
 [32m✓[39m src/features/branding/LogoSchemes.test.js [2m([22m[2m13 tests[22m[2m)[22m[32m 18[2mms[22m[39m
 [32m✓[39m src/lib/recurring.test.js [2m([22m[2m16 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m src/features/branding/logoUtils.test.js [2m([22m[2m14 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m src/lib/plans.test.js [2m([22m[2m16 tests[22m[2m)[22m[32m 26[2mms[22m[39m
 [32m✓[39m src/features/branding/LogoSchemes.test.jsx [2m([22m[2m9 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m src/lib/utils.test.js [2m([22m[2m16 tests[22m[2m)[22m[32m 17[2mms[22m[39m
 [32m✓[39m src/lib/constants.test.js [2m([22m[2m12 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m src/test/components.test.js [2m([22m[2m6 tests[22m[2m)[22m[33m 339[2mms[22m[39m
 [32m✓[39m src/lib/cleanNumeric.test.js [2m([22m[2m8 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m src/lib/revenue.test.js [2m([22m[2m5 tests[22m[2m)[22m[32m 8[2mms[22m[39m

[2m Test Files [22m [1m[32m29 passed[39m[22m[90m (29)[39m
[2m      Tests [22m [1m[32m646 passed[39m[22m[90m (646)[39m
[2m   Start at [22m 20:28:35
[2m   Duration [22m 20.41s[2m (transform 861ms, setup 18.35s, import 2.66s, tests 5.37s, environment 27.66s)[22m
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
| 2026-07-29 20:28 UTC | Gerado automaticamente pelo workflow | `7e4c045fe5ff03660a2f64b27c42776aec87cff3` |
