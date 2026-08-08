# REFINE_06 — Data Visualization

> ⚠️ Preencher seguindo `docs/design/TEMPLATE.md` (seções 0-8, ≥300 linhas).

## Objetivo
Gráficos e dados financeiros com padrão "WRDS/Stripe Reports": tabelas tabular-nums, gráficos
de barras/linhas/arcos leves (CSS/SVG), sparklines, formatação de moeda BRL, storytelling em
Relatórios, tooltip acessível, dark mode, sem libs pesadas no main (bundle!).

## Contexto mínimo (ler ≥5 arquivos)
- `docs/UX/UX_UI_AUDIT_REPORT.md` (diz que UsageBar foi → BarChartSVG; verificar)
- `src/features/reports/` (glob: componentes de gráficos atuais — UsageBar/BarChartSVG…)
- `src/features/dashboard/Dashboard.jsx` (KPIs, forecast card uses fmt)
- `src/lib/forecast.js` (fontes de dados p/ gráficos)
- `src/index.css` (tokens de cor p/ séries)

## Pesquisa obrigatória (≥10 buscas)
financial dashboard chart design 2025/2026 (Stripe, Mercury, Ramp), SVG chart accessibility
(ARIA patterns), tabular-nums & currency formatting BRL, sparklines/trend indicators, no
chart library: css-bar sparkline implementation, sankey/heat maps finance (só se justificado),
tooltip performance INP, colorblind-safe palettes for finance, dark mode charts.

## Retorno
`buscas=.., urls=.., lidos=.., doc_linhas=.. | top3 P0`