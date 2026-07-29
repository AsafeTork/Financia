# Relatório de Erros do CI

**Última atualização:** 2026-07-29 04:00 UTC
**Commit:** `c052700fa572216f7c3fde5470269a6f647d318f`
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

/home/runner/work/financia/financia/src/App.jsx
  183:6  warning  React Hook useEffect has a missing dependency: 'navTo'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/financia/financia/src/features/auth/useImpersonation.js
  28:6  warning  React Hook useEffect has a missing dependency: 'toast'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/financia/financia/src/features/branding/useBrandStudio.js
  45:59  warning  React Hook useMemo has an unnecessary dependency: 'allPresets'. Either exclude it or remove the dependency array  react-hooks/exhaustive-deps

/home/runner/work/financia/financia/src/features/settings/SettingsView.jsx
  76:7  warning  React Hook React.useEffect has missing dependencies: 'setPaymentLoading' and 'toast'. Either include them or remove the dependency array. If 'toast' changes too often, find the parent component that defines it and wrap that definition in useCallback  react-hooks/exhaustive-deps
  91:7  warning  React Hook React.useEffect has missing dependencies: 'setSubLoading' and 'toast'. Either include them or remove the dependency array. If 'toast' changes too often, find the parent component that defines it and wrap that definition in useCallback      react-hooks/exhaustive-deps

/home/runner/work/financia/financia/src/shared/hooks/useBrandAppearance.js
  278:6  warning  React Hook useEffect has a missing dependency: 'appBrand'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

✖ 6 problems (0 errors, 6 warnings)
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
[2mdist/[22m[2massets/[22m[36maiClient-DVuUlaYR.js            [39m[1m[2m  2.87 kB[22m[1m[22m[2m │ gzip:  1.52 kB[22m
[2mdist/[22m[2massets/[22m[36mradix-E4vWxl6g.js               [39m[1m[2m  2.95 kB[22m[1m[22m[2m │ gzip:  1.41 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-scheduler-CbiHYZlt.js    [39m[1m[2m  4.10 kB[22m[1m[22m[2m │ gzip:  1.78 kB[22m
[2mdist/[22m[2massets/[22m[36mexporters-CCVTeScg.js           [39m[1m[2m  4.23 kB[22m[1m[22m[2m │ gzip:  1.80 kB[22m
[2mdist/[22m[2massets/[22m[36mEmailView-CxdfryE1.js           [39m[1m[2m  5.13 kB[22m[1m[22m[2m │ gzip:  2.07 kB[22m
[2mdist/[22m[2massets/[22m[36mCardPreview-tXGwaL5U.js         [39m[1m[2m  6.29 kB[22m[1m[22m[2m │ gzip:  2.78 kB[22m
[2mdist/[22m[2massets/[22m[36mSaleForm-Skk7lEPl.js            [39m[1m[2m  7.45 kB[22m[1m[22m[2m │ gzip:  2.55 kB[22m
[2mdist/[22m[2massets/[22m[36mPrivacyPolicy-BkGvRqJc.js       [39m[1m[2m  7.96 kB[22m[1m[22m[2m │ gzip:  3.45 kB[22m
[2mdist/[22m[2massets/[22m[36mTermsOfService-c0xlNlJ-.js      [39m[1m[2m  8.70 kB[22m[1m[22m[2m │ gzip:  3.67 kB[22m
[2mdist/[22m[2massets/[22m[36mReportView-DB7gjGcw.js          [39m[1m[2m 10.22 kB[22m[1m[22m[2m │ gzip:  3.11 kB[22m
[2mdist/[22m[2massets/[22m[36mstripe-BFjv1rCu.js              [39m[1m[2m 13.00 kB[22m[1m[22m[2m │ gzip:  4.88 kB[22m
[2mdist/[22m[2massets/[22m[36mTxView-D-OuPJiZ.js              [39m[1m[2m 14.51 kB[22m[1m[22m[2m │ gzip:  4.73 kB[22m
[2mdist/[22m[2massets/[22m[36mInventoryView-DI9GTmnk.js       [39m[1m[2m 19.88 kB[22m[1m[22m[2m │ gzip:  5.47 kB[22m
[2mdist/[22m[2massets/[22m[36mquery-Bh9are3d.js               [39m[1m[2m 26.92 kB[22m[1m[22m[2m │ gzip:  8.25 kB[22m
[2mdist/[22m[2massets/[22m[36mDashboard-BhTSfeYS.js           [39m[1m[2m 27.45 kB[22m[1m[22m[2m │ gzip:  7.47 kB[22m
[2mdist/[22m[2massets/[22m[36mPlansView-B4k2BmsE.js           [39m[1m[2m 31.24 kB[22m[1m[22m[2m │ gzip:  8.33 kB[22m
[2mdist/[22m[2massets/[22m[36mLanding-CHeO1tcC.js             [39m[1m[2m 32.00 kB[22m[1m[22m[2m │ gzip:  7.66 kB[22m
[2mdist/[22m[2massets/[22m[36mBrandStudioView-CDLiXNtP.js     [39m[1m[2m 37.55 kB[22m[1m[22m[2m │ gzip:  9.87 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-CdDn-nhL.js              [39m[1m[2m 52.89 kB[22m[1m[22m[2m │ gzip: 16.59 kB[22m
[2mdist/[22m[2massets/[22m[36mdexie-2jmnBxhj.js               [39m[1m[2m 74.29 kB[22m[1m[22m[2m │ gzip: 26.62 kB[22m
[2mdist/[22m[2massets/[22m[36mSettingsView-C7hltWa0.js        [39m[1m[2m 78.12 kB[22m[1m[22m[2m │ gzip: 20.28 kB[22m
[2mdist/[22m[2massets/[22m[36mindex-DUoar0ts.js               [39m[1m[2m137.04 kB[22m[1m[22m[2m │ gzip: 40.90 kB[22m
[2mdist/[22m[2massets/[22m[36mvendor-react-Bj2_g79g.js        [39m[1m[2m175.06 kB[22m[1m[22m[2m │ gzip: 57.38 kB[22m
[32m✓ built in 3.62s[39m
```

---

## Resultados dos Testes

```
 [32m✓[39m src/shared/ui/PhoneInput.test.jsx [2m([22m[2m12 tests[22m[2m)[22m[33m 714[2mms[22m[39m
[90mstderr[2m | src/lib/stripe.test.js
[22m[39mSupabase não configurado: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias.

 [32m✓[39m src/lib/stripe.test.js [2m([22m[2m19 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m src/lib/auth.test.js [2m([22m[2m9 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m src/features/branding/LogoSchemes.test.js [2m([22m[2m13 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/shared/ui/ColorField.test.jsx [2m([22m[2m12 tests[22m[2m)[22m[32m 169[2mms[22m[39m
 [32m✓[39m src/lib/recurring.test.js [2m([22m[2m16 tests[22m[2m)[22m[32m 19[2mms[22m[39m
 [32m✓[39m src/features/branding/logoUtils.test.js [2m([22m[2m14 tests[22m[2m)[22m[32m 16[2mms[22m[39m
 [32m✓[39m src/lib/plans.test.js [2m([22m[2m16 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m src/features/branding/LogoSchemes.test.jsx [2m([22m[2m9 tests[22m[2m)[22m[32m 15[2mms[22m[39m
 [32m✓[39m src/lib/utils.test.js [2m([22m[2m16 tests[22m[2m)[22m[32m 20[2mms[22m[39m
 [32m✓[39m src/lib/constants.test.js [2m([22m[2m12 tests[22m[2m)[22m[32m 14[2mms[22m[39m
 [32m✓[39m src/test/components.test.js [2m([22m[2m6 tests[22m[2m)[22m[33m 359[2mms[22m[39m
 [32m✓[39m src/lib/cleanNumeric.test.js [2m([22m[2m8 tests[22m[2m)[22m[32m 10[2mms[22m[39m
 [32m✓[39m src/lib/revenue.test.js [2m([22m[2m5 tests[22m[2m)[22m[32m 8[2mms[22m[39m

[31m⎯⎯⎯⎯⎯⎯⎯[39m[1m[41m Failed Tests 5 [49m[22m[31m⎯⎯⎯⎯⎯⎯⎯[39m

[41m[1m FAIL [22m[49m src/shared/hooks/useBrandAppearance.test.js[2m > [22museBrandAppearance[2m > [22mwhite-label with custom_palette keeps own colors
[41m[1m FAIL [22m[49m src/shared/hooks/useBrandAppearance.test.js[2m > [22museBrandAppearance[2m > [22meffectiveTheme falls back to appBrand.theme
[41m[1m FAIL [22m[49m src/shared/hooks/useBrandAppearance.test.js[2m > [22museBrandAppearance[2m > [22meffectiveTheme prefers localStorage themePref
[41m[1m FAIL [22m[49m src/shared/hooks/useBrandAppearance.test.js[2m > [22museBrandAppearance[2m > [22mtoggleTheme switches from light to dark and saves
[41m[1m FAIL [22m[49m src/shared/hooks/useBrandAppearance.test.js[2m > [22museBrandAppearance[2m > [22mtoggleTheme returns previous themePref for null start
[31m[1mTypeError[22m: el.style.removeProperty is not a function[39m
[36m [2m❯[22m src/shared/hooks/useBrandAppearance.js:[2m273:18[22m[39m
    [90m271|[39m     [35mif[39m (theme [33m===[39m [32m'dark'[39m) {
    [90m272|[39m       [33mTHEME_CONTROLLED_VARS[39m[33m.[39m[34mforEach[39m([35mfunction[39m(k) {
    [90m273|[39m         el[33m.[39mstyle[33m.[39m[34mremoveProperty[39m(k)[33m;[39m
    [90m   |[39m                  [31m^[39m
    [90m274|[39m       })[33m;[39m
    [90m275|[39m     } [35melse[39m {
[90m [2m❯[22m src/shared/hooks/useBrandAppearance.js:[2m272:29[22m[39m
[90m [2m❯[22m commitHookEffectListMount node_modules/react-dom/cjs/react-dom.development.js:[2m23189:26[22m[39m
[90m [2m❯[22m commitPassiveMountOnFiber node_modules/react-dom/cjs/react-dom.development.js:[2m24970:11[22m[39m
[90m [2m❯[22m commitPassiveMountEffects_complete node_modules/react-dom/cjs/react-dom.development.js:[2m24930:9[22m[39m
[90m [2m❯[22m commitPassiveMountEffects_begin node_modules/react-dom/cjs/react-dom.development.js:[2m24917:7[22m[39m
[90m [2m❯[22m commitPassiveMountEffects node_modules/react-dom/cjs/react-dom.development.js:[2m24905:3[22m[39m
[90m [2m❯[22m flushPassiveEffectsImpl node_modules/react-dom/cjs/react-dom.development.js:[2m27078:3[22m[39m
[90m [2m❯[22m flushPassiveEffects node_modules/react-dom/cjs/react-dom.development.js:[2m27023:14[22m[39m

[31m[2m⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/5]⎯[22m[39m


[2m Test Files [22m [1m[31m1 failed[39m[22m[2m | [22m[1m[32m28 passed[39m[22m[90m (29)[39m
[2m      Tests [22m [1m[31m5 failed[39m[22m[2m | [22m[1m[32m641 passed[39m[22m[90m (646)[39m
[2m   Start at [22m 03:59:44
[2m   Duration [22m 21.23s[2m (transform 897ms, setup 19.35s, import 3.03s, tests 5.23s, environment 28.35s)[22m


::error file=/home/runner/work/financia/financia/src/shared/hooks/useBrandAppearance.js,title=src/shared/hooks/useBrandAppearance.test.js > useBrandAppearance > white-label with custom_palette keeps own colors,line=273,column=18::TypeError: el.style.removeProperty is not a function%0A ❯ src/shared/hooks/useBrandAppearance.js:273:18%0A ❯ src/shared/hooks/useBrandAppearance.js:272:29%0A ❯ commitHookEffectListMount node_modules/react-dom/cjs/react-dom.development.js:23189:26%0A ❯ commitPassiveMountOnFiber node_modules/react-dom/cjs/react-dom.development.js:24970:11%0A ❯ commitPassiveMountEffects_complete node_modules/react-dom/cjs/react-dom.development.js:24930:9%0A ❯ commitPassiveMountEffects_begin node_modules/react-dom/cjs/react-dom.development.js:24917:7%0A ❯ commitPassiveMountEffects node_modules/react-dom/cjs/react-dom.development.js:24905:3%0A ❯ flushPassiveEffectsImpl node_modules/react-dom/cjs/react-dom.development.js:27078:3%0A ❯ flushPassiveEffects node_modules/react-dom/cjs/react-dom.development.js:27023:14%0A%0A

::error file=/home/runner/work/financia/financia/src/shared/hooks/useBrandAppearance.js,title=src/shared/hooks/useBrandAppearance.test.js > useBrandAppearance > effectiveTheme falls back to appBrand.theme,line=273,column=18::TypeError: el.style.removeProperty is not a function%0A ❯ src/shared/hooks/useBrandAppearance.js:273:18%0A ❯ src/shared/hooks/useBrandAppearance.js:272:29%0A ❯ commitHookEffectListMount node_modules/react-dom/cjs/react-dom.development.js:23189:26%0A ❯ commitPassiveMountOnFiber node_modules/react-dom/cjs/react-dom.development.js:24970:11%0A ❯ commitPassiveMountEffects_complete node_modules/react-dom/cjs/react-dom.development.js:24930:9%0A ❯ commitPassiveMountEffects_begin node_modules/react-dom/cjs/react-dom.development.js:24917:7%0A ❯ commitPassiveMountEffects node_modules/react-dom/cjs/react-dom.development.js:24905:3%0A ❯ flushPassiveEffectsImpl node_modules/react-dom/cjs/react-dom.development.js:27078:3%0A ❯ flushPassiveEffects node_modules/react-dom/cjs/react-dom.development.js:27023:14%0A%0A

::error file=/home/runner/work/financia/financia/src/shared/hooks/useBrandAppearance.js,title=src/shared/hooks/useBrandAppearance.test.js > useBrandAppearance > effectiveTheme prefers localStorage themePref,line=273,column=18::TypeError: el.style.removeProperty is not a function%0A ❯ src/shared/hooks/useBrandAppearance.js:273:18%0A ❯ src/shared/hooks/useBrandAppearance.js:272:29%0A ❯ commitHookEffectListMount node_modules/react-dom/cjs/react-dom.development.js:23189:26%0A ❯ commitPassiveMountOnFiber node_modules/react-dom/cjs/react-dom.development.js:24970:11%0A ❯ commitPassiveMountEffects_complete node_modules/react-dom/cjs/react-dom.development.js:24930:9%0A ❯ commitPassiveMountEffects_begin node_modules/react-dom/cjs/react-dom.development.js:24917:7%0A ❯ commitPassiveMountEffects node_modules/react-dom/cjs/react-dom.development.js:24905:3%0A ❯ flushPassiveEffectsImpl node_modules/react-dom/cjs/react-dom.development.js:27078:3%0A ❯ flushPassiveEffects node_modules/react-dom/cjs/react-dom.development.js:27023:14%0A%0A

::error file=/home/runner/work/financia/financia/src/shared/hooks/useBrandAppearance.js,title=src/shared/hooks/useBrandAppearance.test.js > useBrandAppearance > toggleTheme switches from light to dark and saves,line=273,column=18::TypeError: el.style.removeProperty is not a function%0A ❯ src/shared/hooks/useBrandAppearance.js:273:18%0A ❯ src/shared/hooks/useBrandAppearance.js:272:29%0A ❯ commitHookEffectListMount node_modules/react-dom/cjs/react-dom.development.js:23189:26%0A ❯ commitPassiveMountOnFiber node_modules/react-dom/cjs/react-dom.development.js:24970:11%0A ❯ commitPassiveMountEffects_complete node_modules/react-dom/cjs/react-dom.development.js:24930:9%0A ❯ commitPassiveMountEffects_begin node_modules/react-dom/cjs/react-dom.development.js:24917:7%0A ❯ commitPassiveMountEffects node_modules/react-dom/cjs/react-dom.development.js:24905:3%0A ❯ flushPassiveEffectsImpl node_modules/react-dom/cjs/react-dom.development.js:27078:3%0A ❯ flushPassiveEffects node_modules/react-dom/cjs/react-dom.development.js:27023:14%0A%0A

::error file=/home/runner/work/financia/financia/src/shared/hooks/useBrandAppearance.js,title=src/shared/hooks/useBrandAppearance.test.js > useBrandAppearance > toggleTheme returns previous themePref for null start,line=273,column=18::TypeError: el.style.removeProperty is not a function%0A ❯ src/shared/hooks/useBrandAppearance.js:273:18%0A ❯ src/shared/hooks/useBrandAppearance.js:272:29%0A ❯ commitHookEffectListMount node_modules/react-dom/cjs/react-dom.development.js:23189:26%0A ❯ commitPassiveMountOnFiber node_modules/react-dom/cjs/react-dom.development.js:24970:11%0A ❯ commitPassiveMountEffects_complete node_modules/react-dom/cjs/react-dom.development.js:24930:9%0A ❯ commitPassiveMountEffects_begin node_modules/react-dom/cjs/react-dom.development.js:24917:7%0A ❯ commitPassiveMountEffects node_modules/react-dom/cjs/react-dom.development.js:24905:3%0A ❯ flushPassiveEffectsImpl node_modules/react-dom/cjs/react-dom.development.js:27078:3%0A ❯ flushPassiveEffects node_modules/react-dom/cjs/react-dom.development.js:27023:14%0A%0A
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
| 2026-07-29 04:00 UTC | Gerado automaticamente pelo workflow | `c052700fa572216f7c3fde5470269a6f647d318f` |
