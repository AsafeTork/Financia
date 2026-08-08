# REFINE_06 — Data Visualization

> ⚠️ Preenchido seguindo `docs/design/TEMPLATE.md` (seções 0-8, ≥300 linhas).
> Frente dedicada: gráficos e dados financeiros. **ÚNICO arquivo desta frente.**
> Execução real: 10 buscas web (2025-26, en+pt), 5 URLs fetched, 6 arquivos lidos (file:line).

## 0. Ficha do agente

```yaml
frente: 06 — Data Visualization
agente_data: 2026-08-08
buscas_web: 10               # 6 en / 4 pt-BR; todas 2025-2026
urls_fetched: 5              # conteúdo íntegro coletado
repo_arquivos_lidos: 6       # UsageBar.jsx, Dashboard.jsx, ReportView.jsx, forecast.js, utils.js, index.css
doc_linhas: 372              # após escrita final
skills_usadas: nenhuma (não disponível para esta frente — protocolo do README cobre o processo)
```

---

## 1. Diagnóstico atual (ESTADO REAL, com evidência)

### 1.1 Inventário dos gráficos existentes

| # | Componente | Onde (file:line) | O que faz |
|---|---|---|---|
| 1 | `BarChartSVG` | `src/shared/ui/UsageBar.jsx:78-135` | Barra de 7 dias (receitas x despesas) usada no Dashboard `src/features/dashboard/Dashboard.jsx:309` |
| 2 | `KpiCard` | `UsageBar.jsx:32-76` | Card KPI com pill de variação `+/-%` (`UsageBar.jsx:62-69`); aceita `headline`, `highlight`, `heading`, `sub`, `onClick`, `variation`, `accentBar`, `color` |
| 3 | `UsageBar` (progress) | `UsageBar.jsx:5-30` | Barra de progresso plano (Transações / Produtos / Perdas) — não é gráfico temporal |
| 4 | Barras por categoria | `src/features/reports/ReportView.jsx:181-198` | Últimos gastos por categoria (`width:%` div bars) |
| 5 | KPIs do Relatório | `ReportView.jsx:168-179` | Entradas / Saídas / Resultado / Registros (cards) |
| 6 | Previsão 30/60/90 | `Dashboard.jsx:235-269` | 3 números, sem gráfico — dados vêm de `src/lib/forecast.js:110-112` (`points[{days,balance}]`) |
| 7 | Empty-state fictício | `ReportView.jsx:100-110` / `Dashboard.jsx:294-307` | Barras CSS placeholder `opacity-30` |

### 1.2 Evidências de acessibilidade (com file:line)

**Boas práticas já existentes:**
- `BarChartSVG` tem `role="img"` + `aria-label="Gráfico de receitas e despesas"` + `aria-describedby` + `<title>` + `<desc>` (`UsageBar.jsx:96-98`) e **tabela `sr-only`** com `<thead>`/`<th scope="col|row">` (`UsageBar.jsx:112-132`) — o relatório `docs/UX/UX_UI_AUDIT_REPORT.md:145` ("no data table alternative") está **desatualizado** (resolvido 2026-08-07, ver `docs/WORKSPACE.md:78`).
- `KpiCard` usa `React.useId()` (`UsageBar.jsx:38`) e `aria-label` condicional só quando há clique (`UsageBar.jsx:41-44,56`).
- A classe `.tabular` já existe em `index.css` (`index.css:15`) e `font-variant-numeric: tabular-nums` em `.value-xl`/`.value-lg` (`index.css:114-115`).
- `utils.js` já expõe `luminance` (`utils.js:41-45`) e `onColor` (`utils.js:48-50`) — prontos para validação de contraste em runtime.

**Falhas reais (a11y):**
- **`BarChartSVG`** não tem `aria-label` por barra nem foco por ponto — apenas o `ariaDesc` resumido (`UsageBar.jsx:92`). A guia WCAG 2.2 exige 1.4.11 (3:1) nas marks; o `fill="var(--brand, #1a6b5c)"` (`UsageBar.jsx:79,105-106`) sobre o fundo dark `--bg-card: #13243d` (`index.css:260`) é **provavelmente < 3:1** — navy #1a6b5c sobre #13243d ≈ 2:1 (não passa NA).
- Barras de categoria (`ReportView.jsx:191`) usam `background:'#ef4444'` **hardcoded** — não adapta ao tema e não tem token.
- Nenhum elemento do gráfico é focusable via teclado (`tabindex` inexistente em `UsageBar.jsx:99-110`).
- O forecast (`Dashboard.jsx:244-255`) não tem alternativa textual para os 3 valores projetados.

### 1.3 O que está ausente / frágil — evidências pontuadas

| # | Lacuna | Evidência |
|---|---|---|
| G1 | **Gráfico fixo em 7 dias** — não acompanha o período selecionado | `chartData` é sempre `Array.from({length:7})` via `prevDays(6-i)` (`Dashboard.jsx:64-72`); o seletor `period` (`Dashboard.jsx:101-105`) só afeta KPIs. |
| G2 | **Séries sem nome, sem eixo Y, sem tooltip, sem tendência** | `BarChartSVG` só desenha retângulos + dia (`UsageBar.jsx:99-110`); `fmtK` comprime para "1.2K" (`UsageBar.jsx:85-88`). |
| G3 | **Sem sparklines** — KPIs têm só pill de variação `%` | `KpiCard` (`UsageBar.jsx:62-69`) não aceita prop `spark`. |
| G4 | **`hex` hardcoded quebrando D007** | `#ef4444` em `ReportView.jsx:66,75,76,191,219,229,237`; `text-green-600` em `Dashboard.jsx:250`; `rgba(21,128,61,0.08)` em `UsageBar.jsx:62`; `rgba(239,68,68,0.08)` em `UsageBar.jsx:19`. |
| G5 | **Nenhum token de série de gráfico** | `index.css:122-256` só define semânticos (`--success/--warning/--danger/--info`); `docs/archive/DESIGN_SYSTEM_AUDIT.md:369` já registrava "`--chart-1` até `--chart-6` ... não implementada". |
| G6 | **Número sem compactação ("kill the decimals")** | `fmt` retorna sempre `R$ x,xx` (`utils.js:1`); headline "Resultado Líquido" mostra `R$ 1.234.567,89` inteiro (`Dashboard.jsx:200`). |
| G7 | **CLS no gráfico — sem reserva de altura** | `BarChartSVG` dentro de `Card` sem `aspect-ratio`/`min-h`; altura hardcoded `H=140` (`UsageBar.jsx:83`); sinalizado em `docs/design/REFINE_05_Performance.md:77`. |
| G8 | **`fmt()` inline, não memorizado** — e sinais manuais espalhados | `toLocaleString('pt-BR')` inline `utils.js:1`; `'+' + fmt(...)` em `ReportView.jsx:56,229,238` e `Dashboard.jsx:255,355`. |
| G9 | **Previsão numérica sem visual** | `Dashboard.jsx:244-255` — 3 números; `forecast.js:110-112` expõe `points` prontos para sparkline de saldo. |
| G10 | **Tooltip inexistente; sem foco no teclado** | Nenhum `tabindex`/`data-point` em `BarChartSVG`; `KpiCard` tem `onClick` só no dashboard (`Dashboard.jsx:209,213,217`). |

### 1.4 Fontes de dados prontas (grafos)

- `Dashboard` já tem `chartData` (`Dashboard.jsx:64-72`) e `forecastData.points` (`Dashboard.jsx:245`).
- `ReportView` agrega `bycat` (`ReportView.jsx:37`) e `income/expense` (`ReportView.jsx:35-36`).
- `forecast.js` expõe `points`, `alerts`, `averages`, `months`, `fixed` (`forecast.js:113-125`) — base para storytelling de caixa.

### 1.5 Escopo correto (não escopo)

- **Não** há heatmap / sankey / radar no app; dado financeiro PME pequeno → **não justificado** adicionar (ver §5).
- Bundle atual é enxuto (`vite.config.js` já tree-shake, PWA com precache — `docs/WORKSPACE.md` P1/P2 fechados). **Nenhuma mudança de gráfico deve adicionar dependência.**

---

## 2. Benchmark externo (pesquisa web 2025-2026 — 10 buscas, 5 URLs)

| # | Referência | URL real | 4-6 insights "copiáveis" |
|---|------------|----------|--------------------------|
| 1 | **Masterly — Fintech Dashboard Design (2026)** | https://www.themasterly.com/blog/fintech-dashboard-design-guide | (a) **Framework Role-Metric-Density-Action**: dashboard funciona quando a view default responde à pergunta principal do usuário em segundos; (b) **Mercury** abre com saldo + tendência visível (runway), densidade baixa para founder; (c) **Ramp** abre com savings vs. período anterior, densidade alta; (d) **Stripe** abre com transaction success rate + error breakdown; (e) hierarquia é lever de retenção — usuário desengaja se não acha a resposta rápido; (f) "Wrong metric as hero = product doesn't understand the user". |
| 2 | **Stripe Apps — Chart Layout** | https://docs.stripe.com/stripe-apps/patterns/chart-layout | (a) **Escolha pelo gráfico pela pergunta**: "sobe/desce?"→LineChart; "quanto por categoria?"→Bar; "breakdown de um total?"→Meter; "tendência rápida?"→**SparkLine inline sem eixos**; (b) **Alturas fixas por contexto**: 180px overview, 320px detail; (c) **Pair headline com o gráfico**: valor por cima, tendência embaixo; (d) sparkline = **só forma, não valor** (decorativo quando o número já existe). |
| 3 | **Accessibility.build — Accessible Charts (WCAG 2.2)** | https://accessibility.build/guides/accessible-charts | (a) `role="img"` + `aria-labelledby`/`aria-describedby` — nunca confiar só em `<title>`; (b) **tabela de dados é o piso real**: `sr-only` ok, mas toggle visível melhor p/ todos; (c) **gráfico e tabela derivados da mesma fonte de array** (nunca duplicar); (d) canvas = "buraco" de a11y (preferir SVG); (e) tooltip = INP-safe só se leve (`<title>` nativo). |
| 4 | **IDV Guide — Color & Contrast (2026)** | https://www.interactive-data-visualization.com/.../color-and-contrast-encoding/ | (a) **1.4.11 = 3:1** para marks (barras/linhas); texto de label ≥ 4.5:1; (b) paleta **máx ~8 cores** (Okabe-Ito); (c) **redundant encoding**: shape/dash além do hue; (d) **direct label** (não legenda de cor); (e) **auditar cada theme** (light/dark) — dark mode não "conserta" contraste; (f) pré-computar estilos (não no render loop). |
| 5 | **Storytelling with Data (2025)** | https://financeandtaxguide.com/storytelling-with-financial-data-dashboards/ | (a) **nunca número nu**: "comparado a quê? tendência? por quê?"; (b) hierarquia Tier1 (headlines) → Tier2 (drivers) → Tier3 (tabelas/sparklines); (c) **sparkline em TODOS os KPIs** p/ contexto de trajetória; (d) **"kill the decimals"**: R$ 1,2M não R$ 1.234.567,89; (e) anotações explicativas no gráfico; (f) camada "human layer" — resumo em linguagem natural. |
| 6 | **Chen Guang — React Chart Libs Compared (2026)** | https://chenguangliang.com/en/posts/blog152_react-chart-libraries-comparison/ | (a) **Tabela bundle gzip**: Recharts ~50KB; Chart.js ~66-92KB; Nivo ~82KB; ECharts ~80-130KB à la carte (full 340KB); **Lightweight Charts ~12KB**; Visx ~5KB primitive; (b) SVG ok até ~1-5k pts; canvas p/ milhões; (c) Recharts v3 tree-shake mas d3/victory-vendor pesado. |
| 7 | **MDN — font-variant-numeric (2026)** | https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-numeric | (a) `tabular-nums` (tnum) = largura fixa, alinhamento perfeito em colunas; (b) `slashed-zero` (zero) = disambigua O/0; (c) Inter/SF/Roboto suportam; (d) usar propriedade CSS nativa, não `font-feature-settings`; (e) CSS não pode forçar fonte a ter recurto que ela não possui. |
| 8 | **Art of Styleframe — Dark Mode Charts (2026)** | https://artofstyleframe.com/blog/dashboard-dark-mode-design-patterns/ | (a) **Nunca pure black (#000)** — causa halation; usar `#0f172a` a `#1a1a1a`; (b) **paleta de gráfico dedicada** — cores que passam 3:1/4.5:1 sobre navy #0f1728; (c) elevar lightness/saturation p/ dark (blue #2563eb→#38bdf8); (d) elevar surface por luminosidade, não shadow; (e) **tokenizar todas as cores** via CSS custom property + `data-theme`. |
| 9 | **BrasilGeo — Dashboard E-commerce Acessível (2026, pt)** | https://brasilgeo.ai/ecommerce/guias/dashboards-graficos-acessiveis-ecommerce | (a) **gráfico + tabela** é o padrão — SVG `aria-hidden`, tabela equivalente `sr-only`; (b) `sr-only` ≠ `display:none` (tecnologia assistiva perde conteúdo); (c) variância = seta + sinal + cor juntos, nunca só cor; (d) números alinhados à direita (`text-align: right`); (e) para KPI/spakline/barra simples, SVG inline é mais leve que lib. |
| 10 | **web.dev — Optimize INP (2025)** | https://web.dev/articles/optimize-inp | (a) INP alvo ≤ 200ms (p75); (b) tooltip pesado (D3-tooltip) estoura INP; (c) `<title>` nativo SVG + CSS é INP-safe; (d) decompor em input delay / processing / presentation; (e) `content-visibility` reduz rendering; (f) 90% do tempo do usuário é *após* page load — interações contam. |

> **Síntese aplicável (golden rules p/ Financia)**: (1) escolha o tipo de gráfico pela pergunta do usuário; (2) sparkline inline dá contexto de trajetória a qualquer KPI — a11y = texto por baixo do gráfico, sparkline decorativa `aria-hidden` quando só reforça o número; (3) paleta de séries **Okabe-Ito adaptada ao navy/teal** da marca; (4) **zero nova lib** (SVG cobre todos os casos com <1KB por gráfico em função pura); (5) `tabular-nums slashed-zero` em valores monetários; (6) números compactos nos headliners (kill the decimals).

---

## 3. Oportunidades priorizadas (P0 / P1 / P2)

| Prioridade | Oportunidade | Arquivo(s) alvo | Impacto | Esforço | Risco |
|---|---|---|---|---|---|
| **P0** | **Tokens de série + zerar hex hardcoded (D007)** — `--color-income/--color-expense/--color-net/--color-net-neg/--chart-1..4`; substituir `#ef4444`, `rgba(..,0.08)`, `text-green-600` por `var(--…)` | `src/index.css:122-291`; `UsageBar.jsx:19,62,79,105-106`; `ReportView.jsx:66,75,76,191,219,229,237`; `Dashboard.jsx:250` | alto (dark+light consistency, WCAG 1.4.11, D007) | baixo | baixo |
| **P0** | **`Sparkline` leve (SVG, sem lib) + a11y** — nova `src/shared/ui/Sparkline.jsx` (~40 linhas): polyline+área, último ponto, `<title>` tooltip nativo; `aria-hidden` quando decorativo, `role="img"`+`aria-label` quando carrega dado. Instalar nos KPIs do Dashboard (Saldo/Receitas/Despesas) e no forecast 30/60/90. | `Sparkline.jsx` (novo), `Dashboard.jsx:198-231,248-256`; prop `spark` em `KpiCard` (`UsageBar.jsx:32`) | alto (padrão Mercury/Stripe; trend-to-KPI) | baixo-médio | baixo |
| **P0** | **`BarChartSVG` — flexível ao período + reserva de altura (CLS) + tooltip + eixo Y** — container com `minH: var(--chart-height-md)` + `aspect-ratio`; gerar série por mês quando `period !== 'month'`; `<g tabIndex={0} role="img" aria-label=…>` por barra + `<title>` nativo; eixo Y com `tabular-nums`; tabela `sr-only` + `<details>` toggle. | `UsageBar.jsx:60-111`; `Dashboard.jsx:64-72,275-310` | perf (CLS/INP) + dado preciso (período real) | médio | médio |
| **P0** | **`MoneyText` / `fmtCompact` memorizado** — `Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'})` memoizado; variantes `full`/`compact`; sinal `+/-` por prop; `tabular slashed-zero`. Aplicar nos headliners (`Dashboard.jsx:200`), células (`ReportView.jsx:174,229,238`), signs (`Dashboard.jsx:255,355`). | `src/lib/utils.js:1`; `Dashboard.jsx:199-200,255,355`; `ReportView.jsx:56,174,229,238` | percepção + consistência de sinais | baixo | baixo |
| **P1** | **Dark-mode chart palette dedicada (3:1 marks)** — tokens `--chart-*` com valores validados sobre `index.css:259` (`#0a1628`/`#13243d`); navy claro `#9db4ff`; orange `#ffb45e`; income `--brand` sobre dark com fallback mais claro. | `index.css:258-291` | a11y AA dark + brand flex (white-label) | baixo | baixo |
| **P1** | **Tooltip leve + foco teclado por ponto** | `UsageBar.jsx:99-110` | a11y 1.5 (WCAG 2.1.1, 1.4.13) | médio | baixo |
| **P1** | **Tabela-dados "toggle" visível** — `.sr-only` → `<details>`/button "Ver dados"; `aria-labelledby` com `useId` | `UsageBar.jsx:96-98,122-132` | a11y + utilidade p/ todos | baixo | baixo |
| **P1** | **Forecast de caixa com mini-gráfico de saldo (points 30/60/90)** — sparkline de saldo (`forecast.js:110-112`) com área negativa em destaque | `Dashboard.jsx:235-269` | storytelling executivo (BLUF) | médio | baixo |
| **P2** | **Período sincronizado com gráfico** — `chartData` por mês quando `period !== 'month'` | `Dashboard.jsx:64-72,275` | visão de evolução mensal | médio | baixo |
| **P2** | **Anotações / "por quê"** — rótulo de maior salto vindo de `forecast.js:65-73` (`fixed` entries) | Dashboard + ReportView | storytelling (CFI) | médio | baixo |
| **P2** | **Paleta categórica Okabe-Ito no ReportView** | `ReportView.jsx:181-198` | multi-série legível | baixo | baixo |

---

## 4. Especificação técnica aplicável (pronta para implementação)

### 4.1 Tokens de gráfico (CSS) — `src/index.css`

Adicionar bloco `/* ===== CHART TOKENS ===== */` dentro de `:root` (após linha 154, `--info`) e mirror no `[data-theme="dark"]` (após linha 271, antes da linha 273).

```css
:root {
  /* Séries semânticas de financeiro — derivadas da marca */
  --color-income:  var(--brand);        /* receita = marca */
  --color-expense: var(--danger);       /* #ef4444 — despesa */
  --color-net:     var(--success);      /* #15803d — líquido ≥ 0 */
  --color-net-neg: var(--danger);       /* #ef4444 — líquido < 0 */

  /* Séries categóricas — Okabe-Ito tuning navy/teal */
  --chart-1: var(--navy);                /* #002f59 */
  --chart-2: #56b4e9;                    /* sky */
  --chart-3: var(--teal);                /* #1a6b5c */
  --chart-4: #e69f00;                    /* orange */
  --chart-5: #cc79a7;                    /* pink */
  --chart-6: #f0e442;                    /* amarelo */

  /* UI de gráfico */
  --chart-grid:    var(--border);
  --chart-tick:    var(--text-muted);
  --chart-axis-label: var(--text-sub);
  --chart-zero-line: var(--border-md);

  /* Alturas fixas — evita CLS (REFINE_05 §G7) */
  --chart-height-xs:  64px;   /* KPI row sparkline */
  --chart-height-sm:  72px;   /* KpiCard spark (compacto) */
  --chart-height-md:  180px;  /* Stripe overview — Dashboard bar */
  --chart-height-lg:  320px;  /* Stripe detail — ReportView */

  /* Fonte inline para dinheiro — tabular + slashed zero */
  --font-money: var(--font-body), 'Inter', sans-serif;
}

[data-theme="dark"] {
  /* Navy claro sobre #0f1628/#13243d para passar 3:1 — G7 dark audit */
  --color-income:  #9db4ff;    /* navy claro legível */
  --chart-1:       #9db4ff;
  --chart-4:       #ffb45e;    /* orange claro */
  --chart-grid:    #274263;    /* index.css:268 */
  --chart-tick:    #8899aa;    /* index.css:266 */
}
```

- **`--font-money`**: aplicar `font-variant-numeric: tabular-nums slashed-zero` via utility `.money` (`index.css:~15`, hoje só `.tabular`).
- `--chart-1` etc. são fixos em light e sobrescritos em dark; **nunca** usar `var(--brand)` cru em marks sobre dark (pode falhar 3:1 — G7).

### 4.2 `<Sparkline />` — `src/shared/ui/Sparkline.jsx` (novo, ~45 linhas, sem dep)

Papel: mínimo, determinístico (dados pequenos, sem lib). Inspirado em @fnando/sparkline (zero-dep) e rousek.name — SVG `<polyline>` + `<path>` de área.

```jsx
// src/shared/ui/Sparkline.jsx — ~45 linhas, sem dependency
// Inspiração: @fnando/sparkline (zero-dep SVG), rousek.name/node-0 (polyline+área)
import React, { memo, useMemo } from 'react';

var Sparkline = memo(function Sparkline({
  data,                 // number[]
  width = 96, height = 32,
  strokeWidth = 2,
  area = true,
  color = 'var(--color-net)',
  showLastDot = true,
  lastLabel = null,      // fmtCompact(last) — tooltip texto
  ariaLabel = null,      // null => decorativo => aria-hidden
}) {
  var d = Array.isArray(data) ? data : [];
  var points = useMemo(function() {
    if (d.length < 2) return { line: '', area: '', last: null };
    var min = Math.min.apply(null, d);
    var max = Math.max.apply(null, d) || 1;
    var H = height, W = width, pad = 2;
    var plotW = W - pad * 2, plotH = H - pad * 2;
    var step = d.length > 1 ? plotW / (d.length - 1) : 0;
    var norm = function(v) { return H - pad - ((v - min) / (max - min || 1)) * plotH; };
    var line = d.map(function(v, i) { return (pad + i * step) + ',' + norm(v); }).join(' ');
    var areaP = area
      ? 'M' + pad + ',' + (H - pad) + ' L' + line.replace(/ /g, ' L') + ' L' + (W - pad) + ',' + (H - pad) + ' Z'
      : null;
    return { line: line, area: areaP, last: { x: pad + (d.length - 1) * step, y: norm(d[d.length - 1]) } };
  }, [d, width, height, area]);

  if (d.length === 0) return null;
  if (d.length === 1) {
    // ponto único — círculo decorativo/informativo
    return (
      <svg width={width} height={height} viewBox={'0 0 ' + width + ' ' + height}
        aria-label={ariaLabel ? ariaLabel : undefined}
        role={ariaLabel ? 'img' : undefined}
        aria-hidden={ariaLabel ? undefined : 'true'}
        focusable="false">
        <circle cx={width / 2} cy={height / 2} r={strokeWidth} fill={color}>
          {lastLabel ? <title>{lastLabel}</title> : null}
        </circle>
      </svg>
    );
  }

  return (
    <svg width={width} height={height} viewBox={'0 0 ' + width + ' ' + height}
      aria-label={ariaLabel ? ariaLabel : undefined}
      role={ariaLabel ? 'img' : undefined}
      aria-hidden={ariaLabel ? undefined : 'true'}
      focusable="false">
      {area && points.area ? <path d={points.area} fill={color} fillOpacity="0.12" /> : null}
      <polyline points={points.line} fill="none" stroke={color}
        strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      {showLastDot && points.last ? (
        <circle cx={points.last.x} cy={points.last.y} r={strokeWidth + 1} fill={color}>
          {lastLabel ? <title>{lastLabel}</title> : null}
        </circle>
      ) : null}
    </svg>
  );
});
```

**Regras de uso (WCAG 2.2 — accessibility.build §2.3):**
- **Decorativo**: quando o número já vem com contexto no texto, `aria-hidden="true"` + `focusable="false"` (padrão IDV/accessible-guide p/ sparkline que repete o KPI).
- **Não-decorativo**: `role="img"` + `aria-label` com a síntese ("Saldo dos últimos 3 meses: R$ 4.520 no dia 30") — texto alternativo substitui o visual.
- O ponto final sempre tem `<title>` (tooltip nativo, INP-safe — web.dev §INP).
- `stroke`/`fill` herdam `currentColor` ou usam `var(--color-net)` p/ adaptar a dark.

**Smoking snippet (KPI do Dashboard):**

```jsx
<KpiCard label="Resultado Líquido" value={fmtCompact(profitCurr)} heading="h2" highlight
  spark={
    <Sparkline data={monthlyNet} height={40} color="var(--color-net)"
      lastLabel={fmtCompact(profitCurr)}
      ariaLabel={'Resultado líquido por mês: ' + monthlyNet.map(fmt).join(', ')} />
  } />
```

### 4.3 `MoneyText` / `fmtCompact` — `src/lib/utils.js`

```js
// utils.js — substituir fmt inline (utils.js:1). Memoizar formatter p/ evitar
// recriação por render (web.dev INP — processing delay).
var _fmtCache = {};
export var moneyFormatter = function(maxFrac) {
  maxFrac = maxFrac == null ? 2 : maxFrac;
  var key = 'BRL-' + maxFrac;
  if (!_fmtCache[key]) {
    _fmtCache[key] = new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: 'BRL', maximumFractionDigits: maxFrac,
      useGrouping: true,
    });
  }
  return _fmtCache[key];
};

export var fmt = function(n) { return moneyFormatter(2).format(Number(n || 0)); };
export var fmtCompact = function(n) {              // KPI/headliner — R$ 1,2M
  var abs = Math.abs(Number(n) || 0);
  if (abs >= 1e6) return moneyFormatter(1).format(abs / 1e6).replace(/R\$\s*/, 'R$ ') + 'M';
  if (abs >= 1e3) return moneyFormatter(1).format(abs / 1e3).replace(/R\$\s*/, 'R$ ') + 'K';
  return fmt(n);
};
export var fmtSigned = function(n) {
  return (Number(n) > 0 ? '+' : Number(n) < 0 ? '−' : '') + fmt(Math.abs(Number(n) || 0));
};
```

- `tabular-nums slashed-zero` via `.money { font-variant-numeric: tabular-nums slashed-zero; }` em `index.css:~15`.
- Sinais: substituir `'+' + fmt(...)` de `Dashboard.jsx:255` e `ReportView.jsx:56,229,238` por `fmtSigned(…)`, preservando cor semântica (`--color-expense`/`--color-income`).

### 4.4 `BarChartSVG` — upgrade de período / reserva altura / tooltip

**Container (dashboard `Card` — `Dashboard.jsx:275`):** envolver com `min-h: var(--chart-height-md)` (`= 180px`) + `aspect-ratio: 16/6` → zero CLS (REFINE_05 §).

**`period` prop:** `Dashboard.jsx:64-72` deve gerar série por mês (não 7 dias) quando `period !== 'month'`. Transformar `chartData` para produzir pontos por mês no range `pStart→now` (já filtrado `mtx` em `Dashboard.jsx:37`). Prop `data` vira `[{label, i, o, net}]`.

**Tooltip:** por grupo `<g tabIndex={0} role="img" aria-label={...}>` + `<title>{d.label}: +{fmt(d.i)} · −{fmt(d.o)}</title>` (nativo, INP-safe).

**Eixo Y:** valores `fmtCompact` com `font-variant-numeric: tabular-nums`; `--chart-tick` para cor (`index.css:138`).

**Tabela:** `<details>` toggle visível (accessibility.build §2.2 recomenda; BrasilGeo confirma `sr-only` ≠ `display:none`). Derivada do **mesmo** `data` array (jamais duplicar).

### 4.5 Estados, dark/light, `--brand` dinâmica

| Estado | Regra |
|---|---|
| `loading` | Skeleton com `min-h: var(--chart-height-*)` (evita CLS em dados async de `forecast.js:81`) |
| `empty` | Mantém placeholders `Dashboard.jsx:294-307` / `ReportView.jsx:100-110` — mas paleta fictícia deve usar `--chart-1` (não `rgba(..,0.12)` hardcoded) |
| dark/light | **Sempre** `var(--chart-*)`; o `--brand` dinâmica não é token de série — receitas usam `--color-income` (que resolvi `--brand` em light, `#9db4ff` em dark) |
| `--brand` white-label | Séries receitas derivam da marca mas **categorias** usam Okabe-Ito fixo; validar runtime via `luminance`/`onColor` (`utils.js:41-50`) e fallback p/ `--teal` |
| offline-first | Componentes puros (SVG built do prop `data`) — nada de fetching/CDN; SW precache (`docs/WORKSPACE.md` P2) |

---

## 5. Dependências & libs (decisão: NÃO incluir)

**Decisão: NÃO incluir biblioteca de chart.** Todo os gráficos atuais + o novo (sparkline) cabem em **SVG inline em funções puras** (< 2KB por componente).

| Lib | Versão (2026) | Por quê (tentado) | Custo ~KB gzip | Alternativa sem custo |
|---|---|---|---|---|
| Recharts | v3 (2026-04) | SVG + React; bom, mas d3-vendor pesado | ~30-50 KB→ **~50 KB** | `BarChartSVG` + `Sparkline.jsx` (~1.5KB) |
| Chart.js | 5.x | Canvas; ~10M downloads | ~65-92 KB | SVG inline |
| Nivo | 0.8x | SVG/Canvas, a11y bomm; porém lib | ~82 KB | SVG inline |
| ECharts | 5.x | Feature-complete, à la carte | ~80-130 KB (full 340KB) | SVG inline |
| TradingView Lightweight | 4.x | finance/candlesticks; não nosso serial | ~12 KB | — |
| Highcharts | 11.x | módulo a11y completo; sparkline case = 200KB→função | ~200 KB | `Sparkline.jsx` (~1KB) |
| Visx (Airbnb) | 3.x | D3 primitives; ~5KB por primitive | ~5 KB/primitive | SVG inline pura |
| **D3 (núcleo)** | 7.x | ~90-150KB; poderoso mas over- para 7-30 pts | ~90-150 KB | — |

- **Regra D017-reforçada**: qualquer lib > ~10KB gzip pesa no main bundle atual (`docs/design/REFINE_05_Performance.md:287` — bundle otimizado). Para ≤ ~30 pontos no pior caso, SVG "hand-rolled" **preserva LCP/INP** e limite offline-first.
- **Exceção futura**: apenas se roadmap pedir treemap/heatmap/geo **e** volume > 2-3k pts → Lightweight Charts (12KB) ou ECharts à la carte (medir `bundlejs.com/SGV`). Registrar em `docs/DECISIONS.md`.

---

## 6. Checklist para os 10 implementadores (Fase 2)

**Ordem de execução** (evitar conflito entre frentes — 04 Motion toca KpiCard/Bar; 05 Performance toca CLS/Cards; 09 A11y toca tabela/marks):

1. **[`index.css`] Criar tokens de gráfico** (§4.1): `--color-*`, `--chart-*`, `--chart-height-*`, `.money` utility. *NÃO* remover `.tabular`/`.value-*` (usados em outras frentes).
2. **[`utils.js`] `moneyFormatter`/`fmtCompact`/`fmtSigned`** + teste em `src/lib/utils.test.js` (ordem: `npm run validate:fast`).
3. **[novo] `Sparkline.jsx`** com teste a11y (decorativo vs `aria-label`) — isolado: não interfere em edições das frentes 03/04/09.
4. **[`Dashboard.jsx`] aplicar `Sparkline` nos KPIs + forecast** (`Dashboard.jsx:199-231,248-256`) com `aria-label` ou `aria-hidden`; reservar `min-h` no Card do forecast (`Dashboard.jsx:275`).
5. **[`UsageBar.jsx`] `BarChartSVG` upgrade** (reserva altura, per-mark `aria-label` + `<title>`, eixo Y `tabular`, `<details>` toggle, prop `data` com `net`). **CUIDADO** frente 04 (motion: `KpiCard` count-up) — não tocar na API de variação `KpiCard`; manter props.
6. **[`ReportView.jsx`] zerar `#ef4444` → `var(--color-expense)`/`--chart-*`** + export PDF (`ReportView.jsx:59-68`) `#ef4444`→token.
7. **[`Dashboard.jsx`] período sincronizado**: `chartData` por mês quando `period!=='month'` (`Dashboard.jsx:64-72,101-105`).
8. **Verificação leve por passo**: `npx vitest run src/lib/utils.test.js` e `npx eslint src/features/dashboard/Dashboard.jsx src/shared/ui/UsageBar.jsx` e `npm run build` para bundle. Cenários: dark/light, período 3m/6m, empty-state, tela 320px.
9. **Contraste em dark**: validar `--brand` sobre `#0a1628` (`index.css:259`) usando `luminance` (`utils.js:41`) — navy #002f59 sobre #0a1628 ≈ 1.9:1, **reprova 3:1** → usar `--color-income` claro `#9db4ff`.
10. **Não podem quebrar** (README §Restrições): offline-first (Dexie isolado — mudanças visuais só), `--brand` dinâmica (nunca hardcodear cor da marca em marks), WCAG 2.2 AA não regredir, e o padrão `.sr-only` preservado.

**Riscos de serialização:** não tocar `KpiCard` props (conflito c/ Motion 04), não nova dep no `package.json`, não mexer em `sync.js`/Dexie. **Zero mudança em `vite.config.js`** (05).

---

## 7. Log de coleta (transparência — auditável)

| # | Tipo | Alvo | Conhecimento extraído |
|---|---|---|---|
| 1 | busca (en) | "financial dashboard data visualization design patterns 2025 2026 stripe mercury ramp" | R-M-D-A framework; Mercury=balance+trend; Ramp=savings; Stripe=success rate |
| 2 | busca (pt) | "acessibilidade gráficos SVG ARIA role img WCAG 2.2 tabela dados alternativa" | role=img + labelledby; data-table floor; não display:none |
| 3 | busca (pt) | "sparkline SVG sem biblioteca minimal CSS javascript 2025" | @fnando/sparkline zero-dep; rousek polyline+área, y-flip, min/max |
| 4 | busca (en) | "react chart library bundle size gzip kb 2025 recharts chartjs echarts nivo d3 lightweight" | Recharts ~50KB; Chart.js ~66-92; Nivo ~82; ECharts ~80-130 (full 340); Lightweight ~12; Visx ~5KB/primitive |
| 5 | busca (en) | "font-variant-numeric tabular-nums slashed-zero dinheiro CSS finance UI 2025" | tnum = largura fixa; zero = O/0 disambigua; Inter/SF suportam; CSS nativo > font-feature-settings |
| 6 | busca (en) | "colorblind safe palette finance Okabe-Ito dark mode accessibility 2025" | 3:1 marks; ~8 cores; Okabe-Ito CVD-safe; redundant shape; auditar cada theme |
| 7 | busca (en) | "financial data storytelling dashboard kills decimals BLUF rule of three 2025" | Tier hierarchy; kill decimals (R$1,2M); sparklines everywhere; BLUF + Rule of 3 |
| 8 | busca (en) | "web.dev optimize INP tooltip performance 2025" | INP ≤200ms; tooltip pesado = risco; `<title>` nativo INP-safe; 90% time pós-load |
| 9 | busca (pt) | "WCAG 2.2 acessibilidade gráfico SVG tabela dados toggle screen reader Brasil" | BrasilGeo: gráfico+sr-only table; sr-only ≠ display:none; seta+sinal+cor |
| 10 | busca (en) | "dashboard dark mode charts contrast 3:1 financial 2026" | nunca pure black; #0f1728 range; paleta dedicada dark; elevar lightness; tokenizar tudo |
| 11 | fetch | https://www.themasterly.com/blog/fintech-dashboard-design-guide | R-M-D-A; Mercury balance+trend; Ramp savings; Stripe operational |
| 12 | fetch | https://chenguangliang.com/en/posts/blog152_react-chart-libraries-comparison/ | tabela gzip real; SVG ok ≤5k pts; à la carte importa |
| 13 | fetch | https://financeandtaxguide.com/storytelling-with-financial-data-dashboards/ | context is king; Tier 1-2-3; kill decimals; human layer |
| 14 | fetch | https://www.interactive-data-visualization.com/.../color-and-contrast-encoding/ | 3:1 marks (1.4.11); 4.5:1 text (1.4.3); ~8 cores; pré-computar estilos |
| 15 | fetch | https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-numeric | tnum/zero; CSS nativo; suporte Inter |
| 16 | leitura | `src/shared/ui/UsageBar.jsx` (1-135) | BarChartSVG H=140 hardcoded; `#ef4444` em `KpiCard` pill; `fmtK` truncagem; tabela sr-only existe; `React.useId()` ✓ |
| 17 | leitura | `src/features/dashboard/Dashboard.jsx` (1-366) | chartData fixo 7 dias (`Dashboard.jsx:64-72`); headline nu (`Dashboard.jsx:200`); `text-green-600` (`Dashboard.jsx:250`); forecast sem spark (`Dashboard.jsx:235-269`) |
| 18 | leitura | `src/features/reports/ReportView.jsx` (1-248) | `#ef4444` hardcoded em 6 pontos (`ReportView.jsx:66,75,76,191,219,229,237`); bycat barras `width:%` sem tooltip |
| 19 | leitura | `src/lib/forecast.js` (1-126) | `points[{days,balance}]` (`forecast.js:110-112`); `fixed[]` data exata (`forecast.js:65-73`); pronto p/ sparkline |
| 20 | leitura | `src/lib/utils.js` (1-217) | `fmt` inline não-memoizado (`utils.js:1`); `luminance`/`onColor` prontos (`utils.js:41-50`); `brandAlpha` (`utils.js:7-11`) |
| 21 | leitura | `src/index.css` (122-291) | `:root` tem `--danger:#ef4444` (`index.css:153`); `.tabular:15`; sem tokens `--chart-*`; dark `#0a1628`/`#13243d` (`index.css:259-260`) |

---

## 8. Fontes completas

**URLs abertas (5 — todas com conteúdo integral coletado):**
1. https://www.themasterly.com/blog/fintech-dashboard-design-guide (2026-06-13)
2. https://chenguangliang.com/en/posts/blog152_react-chart-libraries-comparison/ (2026-04-27)
3. https://financeandtaxguide.com/storytelling-with-financial-data-dashboards/ (2025-12-05)
4. https://www.interactive-data-visualization.com/accessible-interactive-data-visualization/color-and-contrast-encoding/ (2026-06-20)
5. https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-variant-numeric (2026-07-21)

**Resultados de busca complementares (sem fetch integral):**
- https://docs.stripe.com/stripe-apps/patterns/chart-layout (chart-type-by-question; 180/320px heights; pair headline+chart)
- https://accessibility.build/guides/accessible-charts (role=img, data-table floor, canvas-trap)
- https://shkspr.mobi/blog/2026/05/stupidly-simple-svg-sparklines/ (y-flip, min/max normalize)
- https://rousek.name/articles/svg-sparklines-with-no-dependencies (polyline+área, altura fixa)
- https://artofstyleframe.com/blog/dashboard-dark-mode-design-patterns/ (2026-08-02; nunca pure black; dedicated palette 3:1)
- https://brasilgeo.ai/ecommerce/guias/dashboards-graficos-acessiveis-ecommerce (2026-06-17; pt-BR; sr-only ≠ display:none; seta+sinal+cor)
- https://web.dev/articles/optimize-inp (INP ≤200ms; tooltip INP-safe p/ `<title>`)
- https://www.csstypestudio.com/articles/numeric-features-opentype-fonts-guide (tnum/zero mechanics)
- https://titouan.dev/notes/2025/09/30/fixing-numbers-alignment-with-css (tabular-nums Tailwind)
- https://loke.dev/blog/css-font-variant-numeric-tabular-nums (2026-02-27; timer/rhythm)
- https://www.pkgpulse.com/guides/recharts-vs-chartjs-vs-nivo-vs-visx-react-charting-2026
- https://github.com/mohitjandwani/analyst-kit/blob/main/plugins/analyst-kit/skills/charting/references/aesthetics.md (green #1A9850=gain, red #D73027=loss; Okabe-Ito categórica)
- https://conceptviz.app/blog/okabe-ito-palette-hex-codes-complete-reference (#E69F00 #56B4E9 #009E73 #F0E442 #0072B2 #D55E00 #CC79A7 #000000)
- https://corporatefinanceinstitute.com/resources/fpa/fpa-storytelling-techniques/ (BLUF; Rule of Three; plain language)

**Arquivos do repo lidos (6 — todo com file:line citado no §1):**
- `src/shared/ui/UsageBar.jsx` (1-135) — `BarChartSVG`, `KpiCard`, `UsageBar`, `fmtK`
- `src/features/dashboard/Dashboard.jsx` (1-366) — KPIs, `chartData`, period selector, forecast card
- `src/features/reports/ReportView.jsx` (1-248) — bycat, KPIs, barras categoria, export PDF
- `src/lib/forecast.js` (1-126) — `forecastCashFlow`, `points`, `fixed`, `monthlyAverages`
- `src/lib/utils.js` (1-217) — `fmt`, `luminance`, `onColor`, `brandAlpha`
- `src/index.css` (122-291) — tokens `:root` + `[data-theme="dark"]`, `.tabular`, `.value-xl`/`lg`

**Arquivos de docs lidos (grep/local):**
- `docs/UX/UX_UI_AUDIT_REPORT.md` (linhas 58, 145, 274) — ponto de referência
- `docs/archive/DESIGN_SYSTEM_AUDIT.md:369` — referencia grep local (`--chart-*` não implementado)
- `docs/design/REFINE_05_Performance.md:77,287` — CLS do gráfico sinalizado
- `docs/DECISIONS.md` (D007, D017) — decisões arquiteturais vigentes
- `docs/WORKSPACE.md` — P0/P1/P2 backlog, PWA precache, Sync Worker

---

## Top 3 P0 (resumo executivo para orquestração)

> **P0-1. Tokens de série + zerar hex hardcoded** (`src/index.css:122-291`, `UsageBar.jsx:19,62,79,105-106`, `ReportView.jsx:66,75,191,219,229,237`, `Dashboard.jsx:250`) — alto impacto (WCAG 1.4.11 dark mode reprovado; D007 vioção contínua), esforço baixo, risco zero. Substitui 6+ hex hardcoded por `var(--color-expense/--income/--net)` com dark-mode override validado.

> **P0-2. `Sparkline` leve (SVG, zero-dep) em `KpiCard` + forecast** (`Sparkline.jsx` novo; prop `spark` em `UsageBar.jsx:32`; `Dashboard.jsx:199-227,248-256`) — alto impacto (padrão Mercury "balance + visible trend"), esforço baixo-médio. Inspirado @fnando/sparkline (200 bytes) + rousek; a11y via `aria-hidden` decorativo ou `role="img"+aria-label`.

> **P0-3. `BarChartSVG` — flexível ao período + CLS + tooltip + eixo Y** (`UsageBar.jsx:78-132`; dados `Dashboard.jsx:64-72`) — impacto perf+a11y (G1/G7/G10), esforço médio. Container `min-h:180px` + `aspect-ratio`; `<g tabindex=0 role="img aria-label>` por barra; eixo Y `tabular`; `<details>` data-table toggle; derivado de `data` (nunca duplicar).
