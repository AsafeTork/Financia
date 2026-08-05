# CI Report

**Gerado:** 2026-08-05 22:42 UTC
**Commit:** `3dd8670f4b661d6bee22736367b7cddd6c83b86f`
**Branch:** `main`

---

## Status Geral

| Verificacao | Status |
|---|---|
| Lint + Typecheck | ok |
| Testes Unitarios | com falhas |
| Testes Integracao | nao executado |
| Build | nao executado |
| E2E Tests | nao executado |
| Auditoria de Producao | ver resultado abaixo |
| Admin Audit | ver resultado abaixo |

---

## Lint Errors (Top 200 linhas)

```

```

---

## Test Results (ultimas 40 linhas)

```
10:40:14 PM [vite] warning: `esbuild` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `oxc` instead.
10:40:14 PM [vite] warning: `optimizeDeps.esbuildOptions` option was specified by "vite:react-babel" plugin. This option is deprecated, please use `optimizeDeps.rolldownOptions` instead.
Both esbuild and oxc options were set. oxc options will be used and esbuild options will be ignored. The following esbuild options were set: `{ jsx: 'automatic', jsxImportSource: undefined }`
 DEPRECATED  `test.poolOptions` was removed in Vitest 4. All previous `poolOptions` are now top-level options. Please, refer to the migration guide: https://vitest.dev/guide/migration#pool-rework

 RUN  v4.1.10 /home/runner/work/Financia/Financia

 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Create subscription > creates subscription and activates plan in company_profiles 6ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Create subscription > creates premium subscription with correct plan 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Upgrade subscription (pro -> premium) with proration > upgrades subscription and updates plan in company_profiles 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Upgrade subscription (pro -> premium) with proration > handles proration invoice creation 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Downgrade subscription (premium -> pro) with proration > downgrades subscription and updates plan 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Downgrade subscription (premium -> pro) with proration > creates credit proration invoice for downgrade 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Cancel subscription > cancels subscription at period end 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Cancel subscription > cancels subscription immediately 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Revert to free plan after cancellation > reverts to free when subscription deleted webhook received 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Revert to free plan after cancellation > reverts to free on incomplete_expired status 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Full subscription cycle integration > completes full cycle: create -> upgrade -> downgrade -> cancel -> free 2ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > Full subscription cycle integration > verifies plan transitions in company_profiles at each step 1ms
 ✓ src/lib/stripe-subscription-cycle.integration.test.js > Stripe Subscription Lifecycle Integration Test > White-label addon subscription > creates white-label subscription and activates addon 1ms
 ✓ src/test/utils.test.js > fmt > formata zero 12ms
 ✓ src/test/utils.test.js > fmt > formata zero (inclui R$) 1ms
 ✓ src/test/utils.test.js > fmt > formata inteiro positivo 1ms
 ✓ src/test/utils.test.js > fmt > usa vírgula como separador decimal 0ms
 ✓ src/test/utils.test.js > fmt > formata null como zero 0ms
 ✓ src/test/utils.test.js > fmt > formata undefined como zero 0ms
 ✓ src/test/utils.test.js > fmt > formata valor com centavos 0ms
 ✓ src/test/utils.test.js > fmt > formata 1000 com separador de milhar 0ms
 ✓ src/test/utils.test.js > fmt > retorna sempre string 1ms
 ✓ src/test/utils.test.js > fmt > formata negativo 1ms
 ✓ src/test/utils.test.js > fmt > formata 50.50 corretamente 0ms
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
 ✓ src/test/utils.test.js > dbUsage > ambar entre 70 e 90% 0ms
 ✓ src/test/utils.test.js > dbUsage > vermelho acima de 90% 0ms
 ✓ src/test/utils.test.js > dbUsage > clampa em 100% 0ms
 ✓ src/test/utils.test.js > dbUsage > limite zero nao quebra 0ms
 ✓ src/test/
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
| 2026-08-05 22:42 UTC | CI report gerado automaticamente | `3dd8670f4b661d6bee22736367b7cddd6c83b86f` |
