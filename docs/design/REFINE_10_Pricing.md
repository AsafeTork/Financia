# REFINE_10 — Pricing & Planos (assinatura Stripe)

> ⚠️ Preencher seguindo `docs/design/TEMPLATE.md` (seções 0-8, ≥300 linhas).

## Objetivo
Design de pricing/planos que conversion: página de planos premium (comparação em tabela,
destaque do plano recomendado, toggle anual/mensal se aplicável), microcopies de confiança
(garantia, cancel a qualquer hora), upsell nas telas internas (badge plano atual, upgrade CTA),
checkout Stripe embutido (já existe? verificar), status do plano no Settings (já existe seção).

## Contexto mínimo
- grep PRICING_PLANS em `src/lib/constants.js` (definição atual de planos)
- `src/features/plans/` (glob: PlansView/PlanStatusCard/PlanTabsEditor?)
- `src/features/settings/SettingsView.jsx` (seção assinatura/card/upgrade)
- `supabase/functions/stripe/` (glob — EF de billing existente; não mexer)
- `src/lib/checkout...` glob (como abre o checkout)

## Pesquisa obrigatória (≥10 buscas)
pricing page design best practices 2025/2026 (mais conversão), SaaS pricing psychology (anchor,
framing, annual/monthly toggle default), Stripe Checkout embedded flow, financial app upgrade
UX (metering, usage cards), freemium vs trial Brazil, "cara de caro vs barato" pricing pages,
accessibility pricing tables, plan compare matrix responsive mobile.

## Retorno
`buscas=.., urls=.., lidos=.., doc_linhas=.. | top3 P0`