# REFINE_03 — App UI Interno (pós-login)

> ⚠️ Documento de refino preenchido conforme `docs/design/TEMPLATE.md` (seções 0-8, ≥300 linhas).
> Frente 3 da Fase 1 — orquestrado por `docs/design/README.md`.

## 0. Ficha do agente

```yaml
frente: App UI interno (pós-login)
agente_data: 2026-08-08
buscas_web: 11            # websearch (inglês + pt-BR, 2025-2026)
urls_fetched: 6           # webfetch executado (ver §7)
repo_arquivos_lidos: 14   # 12 src/ + TEMPLATE.md + README.md (ver §8)
doc_linhas: 353
skills_usadas: frontend-craft (guia industrial-brutalist-ui.md p/ dados densos — adotados só o que casa com o design system)
```

---

## 1. Diagnóstico atual (ESTADO REAL, com evidência)

### 1.1 Fundações que já existem (não regredir)

- **Tokens de design unificados em CSS** (`src/shared/styles/design-tokens.css:2-38` e `src/index.css:122-192`): scale tipográfica graduating (`--text-xs` 0.75rem → `--text-2xl` 1.5rem), espaçamento não-tokens (`--space-6`, `--space-8`), radius (`--radius-lg/xl/2xl`), sombras (`--shadow-sm/md/lg`), semânticos de status (`--success`, `--warning`, `--danger`, `--info`), `--touch-target-min: 44px` e `--focus-ring: 3px solid var(--brand)`. **Qualquer projeto novo USAR esses tokens; nunca hex.**
- **Focus ring global consistente** (`design-tokens.css:40-44`) + utilitário destrutivo (`:47-50`) + transição (`:53-55`).
- **Button/Input base** com min-height 44px (`design-tokens.css:57-76`).
- **Animações CSS-leves (D008 — sem GSAP)**: `slideUp/fadeIn/spin/scaleIn/shimmer/slideDown` (`src/index.css:19-33`) com variantes `.anim-up|fade|scale|down` (`:27-30`) e **respeito a `prefers-reduced-motion` global** (`:47-50` bloqueia animação/transition).
- **Feedback tátil**: `.pressable:active` scale 0.96 com `will-change: transform` (`index.css:63-67`); `.btn:active` scale 0.97 (`index.css:174`); ambos desativados em reduced-motion.
- **Transição de troca de tela** `.anim-page-view` (`index.css:208-213`) e tooltip contextual `.tip-wrap` (`index.css:215-241`).
- **Skip da UI**: `.tabular` para dinheiro (`src/index.css:15`) — **já usado em**: KpiCard `UsageBar.jsx:59`, dashboard movimentações `Dashboard.jsx:354`, ReportView (kpis `ReportView.jsx:173`, valores `:228`), TransactionCard amount `TransactionCard.jsx:185`. Utilidades `value-xl`/`value-lg` embutem `tabular-nums` (`src/index.css:114-115`).

### 1.2 Discover a tela por tela

#### Dashboard (`src/features/dashboard/Dashboard.jsx`)
- **Opções de crescimento** período: select com `Mês atual 3/6/12m` (`Dashboard.jsx:21-27`). Acessível via `aria-label="Periodo"`, `min-h-[44px]`.
- **Empty state onboarding** com progresso (card "Bem-vindo ao Financia", 4 passos, `Dashboard.jsx:108-146`) — **passos estão todos com `done=false`** (linha 130: `var done = false;` fixa, sem estado) — perceptível como "mock gorado": barra sempre 0% e nenhum checkmark. P0.
- **Empty state KPIs educativos** (`Dashboard:173-197`): 4 cards com ícone SVG inline, lab/dodada; bom. Mas **`done`/preenchimento não existe**.
- **KPIs numéricos**: `KpiCard` headline (Resultado Líquido, font 28, `heading=h2`, destaque `brandAlpha`, `Dashboard:197-232`) com variação vs período anterior e pills `+%`/`-`%. 
  - Problema: pill de variação usa **`rgba(21,128,61,0.08)` — hex rgba hardcoded** no `UsageBar.jsx:62`, não é o token `--success`/`--danger` com alpha; **quebra D007** (cores via var). P1.
- **Previsão de caixa** (`Dashboard:234-269`): 3 colunas (30/60/90 dias) + alerta de saldo negativo + rodapé explicativo. Boa a11y (`aria-label="Previsão de fluxo de caixa"`).
  - Usa **`text-green-600` classe Tailwind hardcoded** em vez de token `--success` (`Dashboard:250`) e `text-amber-*` hardcoded no Estoque baixo (`Dashboard:148-170`). P1 (D007).
- **Gráfico 7 dias**: `BarChartSVG` (`Dashboard:309` → `UsageBar.jsx:78-135`) com `sr-only` `<table>` equivalente (excelente a11y, `UsageBar.jsx:122-131`), `aria-label` e `<desc>`.
- **Movimentações recentes** (`Dashboard:335-362`): lista com ícone de tipo, valor `tabular`, hover `hover:bg-[var(--bg-subtle)]`. **`hover:bg-[var(--bg-subtle)]` é classe arbitrária Tailwind que referencia var — ok, mas inconsistente com `card-hover`** usado em KPIs (contrato). P2.

#### Transações (`src/shared/ui/TransactionCard.jsx`)
- Linha (`remove_key`): ícone de accion, desc, metadados, valor `+/-`. Formato `tabular` (`:185`), group header (`:221-236`).
- **`EmptyTransactionState`** (`:238-289`): ícone em card 16×16, título, descrição, chips de características (tilling feature list), CTA. Bem montado, reaproveitável p/ dashboard também. 👍
- **Edit inline** (`:40-123`): inputs `min-h-[var(--touch-target-min)]`; **falta `aria-label` nos selects/date e o `input type="number"` sem `inputMode="decimal"`** (teclado mobile vira numérico). P1.
- **Swipe actions** (`TransactionCard:29-34` + hook `useSwipeActions`): duplicar/excluir (esquerda), editar (direita). Ação de fundo usa **`opacity` como único indicador** (`:140`) — sem `aria-label` dedicado nas ações reveladas por swipe (os botões de ação inline `:188-211` têm `aria-label`, mas os do swipe background não) → P2 a11y.

#### Transações lista (`src/features/transactions/TxView.jsx`, 470 linhas)
- **`accentColor` hardcoded fallback `#ef4444`** em dois lugares (`:19` accentColor, `:20` accentBg `rgba(239,68,68,0.06)`) — usar token `--danger`. P1 (D007).
- **`#2563eb` azul hardcoded** em 4 locais: sugestão de categorias Btn (`:223`), Modal title color (`:375`), Modal accent (`:387`), "Aplicar" Btn (`:396`). Não há token semântico para "AI/sugestão". P2.
- **Empty state duplicado inline** (`:267-303`): reimplementa quase tudo de `EmptyTransactionState` (TransactionCard) em vez de reutilizar → drift visual. P2 (consistência).
- **Sticky date header já implementado** (`:319-332`): `role="heading" aria-level="2"`, `sr-only` prefix, `position: sticky top-0` — ✅ a11y bom. Derivado do `scrollTop` real via `headerTops` pré-computado.
- **Virtualized list** (`@tanstack/react-virtual`, `:108-112`) com `role="list"` (`:333`) + `role="listitem"` em cada item/header (`:338,347`) — ✅ a11y.
- **`useTransition` no filtro** (`:30,32-34,245-252`) — `startTransition` evita jank no teclado. ✅
- **`inputMode` correto**: `NumInp` já envia `inputMode="decimal"` (`:80` em ui.jsx). Mas o `<input type="number">` inline no `TransactionCard` edit mode (`:69-76`) **não** tem `inputMode`. P1.

#### Relatórios (`ReportView.jsx`)
- **Empty state rico** (`ReportView:80-132`): gráfico fictício `opacity-30`, lista de funcionalidades com check ✓. 👍 Muito bom.
- **Navegação de meses** (`:22-68`): prev/next com `min-w/h-[44px]`, disabled states (opacity-30) — aceitável; falta `aria-disabled` vs `disabled` (usa `disabled` nativo ✓).
- **Kpis** (`:168-179`): 4 cards com `tabular`-sf + `accent` bar.
- **Despesas por categoria** (`:181-199`): barra `h-1.5` com **cor `#ef4444` hex hardcoded `ReportView:191`** → D007. P1.
- **Tabela de movimentações** (`:200-236`): lista sem sticky header de colunas; **não usa `table` semântico**, usa `div` em ul. "Resultado do mês" no rodapé sticky? não (fica só no fim do scroll `<div>` fixo). **`sum` de valor com título `text-semibold`, não tem sticky** — ao rolar lista longa, o total desaparece. P1 (sticky summary).
- **Export gated** por plano free (`ReportView:9-12, 141-147`).

#### Header móvel (`Header.jsx`)
- Sticky top, logo dinâmico com fallback letra inicial, **busca (sem handler**onClick — `Header:22-25`), dot sync (`Header:6`), ThemeToggle, menu.
- `fetchPriority="high"` na logo ✓; `decoding="sync"` ok. P2: manter.
- **Buscar sem ação ao tocar** — botão decorativo. P2 (deixar ou ligar à ⌘K).

#### BottomNav (`BottomNav.jsx`)
- `role="tablist"`, indicador de aba ativa (topo `w-8 h-0.5` na cor brand), `aria-selected`, `aria-current`, safe-area bottom padding. **Sólido**. P3 apenas detail: ícone `strokeWidth` ativo 2.4 vs 1.8 — transitório de peso inconsistente.

#### Configurações (`src/features/settings/SettingsView.jsx`, 488 linhas)
- **Tabs com a11y completa** (`:213-234`): `role="tablist"` + `role="tab"` + `aria-selected` + `aria-controls`. ✅
- **Hardcoded Tailwind tab classes** (`:229`): `text-gray-900`/`text-gray-400`/`hover:text-gray-600` — P2.
- **`#16a34a` hardcoded** WhatsApp (`:297`) e subscription badge (`:318`) → `var(--success)`. P1.
- **`rgba(245,158,11,0.12)`/`rgba(59,191,160,0.12)`** no badge bg (`:317`). P1.
- **`#e8f0f7`/`#1a6b5c`** fallbacks ColorField (`:420-421`). P2.
- **WebAuthn (passkey) e MfaSection (TOTP)** já implementados (`:274, :284`). ✅
- **PhoneInput sem `aria-label`** (`:290`) — P1 a11y.

#### Command Palette ⌘K (`CommandPalette.jsx`)
- Bons: keyboard nav (ArrowUp/Down/Enter), Escape, `role="listbox"/option`, `aria-selected`, scrollIntoView.
  - **Problema P1**: `selectedIndex` destaca com **classes Tailwind gray/blue fixed + sobreposição `background: color-mix(...var(--brand) 8%...)`** (`CommandPalette:110-114`) — Contradição: a cor real vem de `style` (`:114`) mas as classes `bg-blue-50 dark:bg-blue-900/30` ficam no DOM (`:110`); `hover:bg-gray-50 dark:hover:bg-gray-800` (`:111`) é cinza hardcoded. **Telehastra de theme de marca NÃO usa o token brand** — no light mode, o seleto só é visível pela overline `style`; o `bg-gray-50` "hover" é cinza hardcoded. P1: uniformizar fundo com `brandAlpha`/CSS var e remoção das classes azul/gray hardcoded.
- `focus:ring-2 focus:ring-blue-500` hardcoded no input (`:89`) em vez de `focus:ring-[var(--brand)]`; `bg-gray-50 dark:bg-gray-800` bg no input (`:89`). P1.
- Kbd `⌘K` (`:92`) ok.
- Falta `aria-activedescendant` do input (P2 a11y premium).

#### Base `ui.jsx` (deprecado mas usado)
- `Card` (`ui.jsx:22-33`) — `overflow-hidden` (corta sombra em KPI). P2.
- `Empty` (`ui.jsx:141-167`) — genérico, boa base; reutilizável.
- `Modal` (`ui.jsx:226-273`) — focus trap qualidão, `aria-modal`, restore focus. 👍 Falta `aria-describedby` do corpo. P2.
- `Skeleton`/`PageSkeleton` (`ui.jsx:275-286`) — **estático**; `skeleton` CSS usa `var(--bg-subtle)` → shimmer. **Sem `aria-busy` no container** (acessível? falha: screen reader não anuncia carregamento). P1.
- `Btn`/`Input`/`Sel` seguem o padronizado shadcn-tree (`input.jsx`/`button.jsx`/`select`). 

### 1.3 Lacunas transversais (o que está ausente)

1. **Sem `aria-sort`/`aria-sort` em listas/tabelas com ordenação** (ReportView não tem sorting; TxView?) — não encontrei sort por cabeçalho (o filtro é por período). P2.
2. **Sem empty state padrão sendo uma só variante** — existem **4 implementações paralelas**: `Empty` (ui.jsx:141), `EmptyTransactionState` (TransactionCard:238), empty inline do dashboard (Dashboard:291-307), empty inline do TxView (TxView:267-303) e empty do ReportView (ReportView:80-132). **Consolidar para evitar drift visual** (P1 de consistência). Target: migração para `<EmptyState>` cobrindo todas as telas, incluindo TxView.
3. **Sem skeleton por card específico** — apenas `PageSkeleton` genérico. Ao carregar forecast, o card some e reaparece (Dashboard `forecastData` null → hidden). P2.
4. **Sem indicador de "última sincronização" dentro do dashboard** (só dot no Header `Header:9`). Padrão Stripe = trust signal perto dos números (benchmark §2). P2 (mas sem API até onde já existe `syncStatus`).
5. **Estados de feedback pós-ação**: Toasts existem (`Toast.jsx`); falta indicador de sucesso inline (ex. "Salvo" no inline edit). P2.
6. **Compacta="density"** — densidade fixa (1 linha = ~56px); sem toggle "compacto/confortável". Benchmark §2 sugere. P2.
7. **`ReportView` tabela não-sticky** de cabeçalho de grupo — P1 leve.

---

## 2. Benchmark externo (pesquisa web obrigatória)

> Mín. 5 linhas. Inglês + pt-BR, relevante 2025-2026. Insights optados para App UI financeiro.

| # | Referência (nome) | URL real (acessada) | 2–4 insights relevantes "copiáveis" |
|---|-------------------|---------------------|-------------------------------------|
| 1 | Fintech UX Design: 10 Best Practices for Dashboards | https://www.wildnetedge.com/blogs/fintech-ux-design-best-practices-for-financial-dashboards | ① KPIs com contexto antes do número; ② cartões de gradiente evitam poluição; ③ datas de referência próximas dos números; ④ tabela valor com alinhamento central |
| 2 | Fintech Dashboard Design Guide (meridian/toc) | https://themasterly.com/blog/fintech-dashboard-design-guide | ① direitos de money alignment=tabular; ② trace aspecto KPI; ③ "Synced X ago" como trust signal; ④ density toggle compact/cozy |
| 3 | UX Pattern Analysis: Enterprise Data Tables | https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables | ① sorting com `aria-sort`; ② empty states com ação + guidance; ③ density adjustable e preferência; ④ sticky headers, bulk actions |
| 4 | Badge / Status Chips a11y | https://www.stellae.design/en/components/badge | ① cor nunca é o único sinal — adicionar ícone/texto; ② aria-label pro sintetizador quando o dot importa; ③ texto antes do dot (leitura); ④ contraste ≥4.5 |
| 5 | Accessible Loading Skeletons & Spinners | https://www.modern-framework-accessibility.com/core-accessibility-principles-for-modern-frameworks/reduced-motion-and-animation-accessibility/accessible-loading-skeletons-and-spinners | ① skeleton estático em reduced-motion; ② ARIA live region; ③ trocar por conteúdo real rápido; ④ wrapper `aria-busy` |
| 6 | Currency Input Pattern | https://uxpatterns.dev/patterns/forms/currency-input | ① input com campo monet. formatando enquanto digita; ② Intl.NumberFormat; ③ `inputmode="decimal"` no mobile; ④ prefixo R$ |

(*) Buscas web adicionais (11 no total) usadas como contexto: `fintech dashboard ui 2026`, `dashboard cards accessibility 2026`, `tabular figures money column alignment`, `dense table patterns`, `status chip a11y stack`, `skeleton screen reduced motion`, `empty states illustration svg lightweight`, `pwa inside dashboard`, `positive negative color semantics financial`, `command palette keyboard a11y`. Registro completo em §7.

---

## 3. Oportunidades priorizadas (P0 / P1 / P2)

| Prioridade | Oportunidade | Arquivo(s) alvo | Impacto (percep/perf/conv) | Esforço | Risco |
|-----------|--------------|-----------------|---------------------------|---------|-------|
| P0 | Converter `<div>` de onboarding (dashboard) em componente reutilizável não hardcoded: `done` mapeia de verdade para dados do usuário (produtos/vendas cadastradas) | `Dashboard.jsx:108-124` | percep: progresso real = confiança | baixo | baixo |
| P0 | Unificar empty states em um componente `<EmptyState icon/title/desc/action/ressed>` com SVG inline, reutilizar em Dashboard + TxView + ReportView + TransactionCard (hoje 4 variantes) | `ui.jsx:141` `TransactionCard.jsx:238` `TxView.jsx:267` `ReportView.jsx:80` | percep & manutenção | baixo | baixo |
| P1 | Remediar hex/rgba hardcoded remanescentes → usar tokens semânticos: `rgba(21,128,61,0.08)` (KpiCard pill), `#ef4444` (ReportView/TxView fallback), `text-green-600` (Dashboard previsão), `text-amber-*` (Dashboard estoque), `rgba(245,158,11,0.10)` (Dashboard estoque bg), `rgba(239,68,68,0.06/0.08)` (Dashboard ForecastCard alert), `rgba(59,191,160,0.06)` (Dashboard onboarding step), `#16a34a` (SettingsView WhatsApp), `#d97706/#16a34a` (SettingsView sub status), `#2563eb` (TxView AI sugestão) | `UsageBar.jsx:62`, `ReportView.jsx:75-76,191,219,228,237`, `TxView.jsx:19-20,223,375,387,396`, `Dashboard.jsx:132,149,248,250,258`, `Dashboard.jsx:148-169`, `SettingsView.jsx:297,317-318,420-421` | D007 compliance + contraste | baixo | baixo |
| P1 | Comand palette: remover classes bg-blue/gray hardcoded, usar `background: color-mix(var(--brand) …)` + var `--bg-subtle`; manter keyboard nav | `CommandPalette.jsx:89,110-111` | coerência com brand dinâmica (white label) | baixo | baixo |
| P1 | Skeleton da aplicação: adicionar `PageSkeleton` com `aria-busy="true"` na raiz de dashboard ao carregar (hoje sem role), e skeleton da forecast card antes da data | `ui.jsx:275` e Componentes de Dashboard | acessibilidade de carregamento | baixo | baixo |
| P2 | Adicionar sticky header de grupo na tabela do ReportView (total do mês cola no topo ao scroll) | `ReportView.jsx:200-236` | UX em listas longas | médio | médio |
| P2 | Indicador de última sincronização dentro do card financiero (usar `syncStatus` já existente) | `Dashboard.jsx:197`+ `useSyncLoop.js` | trust signal (benchmark §2) | médio | baixo |
| P2 | Ações do swipe ter `aria-label` próprio e parar `opacity` como sinal único; reveal de ações detectável | `TransactionCard.jsx:139-150` | a11y AA (WCAG 2.2) | baixo | baixo |

Critério P0: alto impacto visível + risco baixo + mudança localizada + não quebrar offline/a11y/perf.

---

## 4. Especificação técnica (pronta para implementação)

> Direção visual decidida: **manter o design system existente** (fonte oficial `VISUAL_IDENTITY.md`), usar **pureza dos tokens** como regra (D007). A estética do guia `industrial-brutalist` (monospace/útil) entra **só como retorno aos dados densos**: alinhamento direito, tabulars, densidade — não o zero radius.

### 4.1 Tokens novos (não criar se der para aproveitar)

```css
/* index.css — adicionar junto de --success/--danger */
--success-soft:  rgba(21, 128, 61, 0.08);  /* pill de variação positiva do KPI */
--danger-soft:   rgba(239, 68, 68, 0.08);  /* pill negativa + estoque baixo + alerta */
--warning-soft:  rgba(245, 158, 11, 0.10);
```

> Se já houver token similar em outro tema (d`themes`), BATER: pesquisar `--success-soft` global antes de criar. Alternativa: usar `color-mix(in srgb, var(--success) 8%, transparent)` (mesmo padrão do CommandPalette linha 114) — preferir `color-mix` sobre tokens novos onde `var(--brand)` já é o acorde.

### 4.2 Componente novo: `<EmptyState>` (unifica 3 variantes)

Local: `src/shared/ui/EmptyState.jsx` (novo, export default). Segue o padrão nativo de `Empty`/`EmptyTransactionState`, mantido `push` para variantes:

```jsx
export default React.memo(function EmptyState({ icon, title, desc, cta, onCta, color, features, hint }) {
  var accent = color || 'var(--brand)';
  return (
    <div className="py-14 flex flex-col items-center gap-4 text-center px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1"
           style={{ background: brandAlpha(accent, 0.08) }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={accent}
             strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={icon} />
        </svg>
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{title}</p>
      {desc && <p className="text-xs max-w-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
      {features && (
        <ul className="flex flex-wrap gap-2 justify-center text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {features.map(function (f) {
            return (
              <li key={f} className="px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-subtle)' }}>{f}</li>
            );
          })}
        </ul>
      )}
      {action && (
        <button type="button" onClick={action}
          className="pressable mt-2 rounded-xl py-2.5 px-5 text-sm font-semibold text-white min-h-[44px]"
          style={{ background: accent }}>
          {cta}
        </button>
      )}
    </div>
  );
});
```

**Migração**:
  - `Dashboard.jsx:291-308` (chart empty) + `Dashboard.jsx:322-334` (recent empty) → `<EmptyState …/>`.
  - `TransactionCard.jsx:238-288` → reutilizar (manter `EmptyTransactionState` como `wrapper` chamando `<EmptyState>`).
  - `TxView.jsx:267-303` (inline empty) → `<EmptyState …/>`.
  - `ReportView.jsx:80-131` → `<EmptyState …/>`.

> Manter `color: accent` das pill `var(--text-muted)` — contraste já validado.

### 4.3 Fix onboard progress (P0)

No `Dashboard.jsx` substituir o bloco `var done = false;` (linha 130) por cálculo real reutilizando `products.length/ptx`:

```jsx
var steps = [
  { n:'1', title:'Cadastre seus produtos', sub:'Defina precos, custos e estoque',      nav:'inventory', btn:'Cadastrar',  done: products.length > 0 },
  { n:'2', title:'Registre sua primeira venda', sub:'Multiplos itens e baixa de estoque', nav:'income',    btn:'Registrar',  done: tx.some(function(t){ return t.type === 'income'; }) },
  { n:'3', title:'Cadastre uma despesa', sub:'Categorias e gastos fixos', nav:'expense',  btn:'Registrar',  done: tx.some(function(t){ return t.type === 'expense'; }) },
  { n:'4', title:'Veja seu primeiro relatorio', sub:'Exporte PDF e Excel simples', nav:'report',  btn:'Ver',        done: tx.length > 0 },
];
var pct = Math.round(steps.filter(function(s){ return s.done; }).length / steps.length * 100);
// barra: width pct%, badge "pct%"
```

**Estados**: `done:true` → check usa `var(--success)` atual; bg do step usa `rgba(59,191,160,0.06)` hardcoded (`:132`) → trocar para `brandAlpha(brand.color, 0.06)` ou `color-mix(in srgb, var(--brand) 6%, transparent)`; barra progresso fill já usa `brand.color` (`:118`); transição `500ms` (`:118`).

### 4.4 Command palette — contor de cor de marca (P1)

No `CommandPalette.jsx`, remover `bg-blue-50 dark:bg-blue-900/30` (linha 110) e `focus:ring-blue-500` + `bg-gray-50 dark:bg-gray-800` (linhas 89, 111); usar tokens:

```jsx
// linha do <input>
className="w-full pl-10 pr-4 py-3 text-base border border-[var(--border)] rounded-xl bg-[var(--bg-input)] focus:outline-none focus:ring-[var(--brand)]"
// li active:
style={{ background: 'color-mix(in srgb, var(--brand) 10%, transparent)' }}
// li hover: substituir "hover:bg-gray-50 dark:hover:bg-gray-800" por sobreposição de classe
//  → <li class*="cursor-pointer transition-colors" style={{ background: selected ? blush : undefined }}>
```

### 4.5 Estilos de referência — listas densas (guia industrial, adotado como dados)

| Elemento | Receita |
|---|---|
| Valor monetário em lista | `className="text-sm tabular text-right"` e `min-w` fixa (ex. `w-20`) p/ coluna alinhada |
| Cabecalho/Total de grupo | `aria-sort` não se aplica (sem sort); usar sticky `position: sticky; top: 0; background: var(--bg-card)` |
| Densidade | opcional `data-density="cozy|default"` no app root — futura pendência P2 |

### 4.6 Interação com `--brand` dinâmica / offline

- **Todos os accentos devem usar `var(--brand)`, `brandAlpha(brand.color, …)` ou `color-mix(in srgb, var(--brand) …)`** — nunca `var(--navy)`/`var(--teal)` em novas cores (brand é white-label por usuário).
- **Offline-first intocado**: mudanças apenas em `src/` (UI) — cada estado de loading/empty continua derivando de Dexie local. Fetch? Nenhum novo AF. Marcar P2/3 se exigir Rede.
- **Motion**: continuar via CSS keyframes existentes (`index.css:200-212`) e `.pressable`; **sem `transition` JS pesado** (D008).

---

## 5. Dependências & libs (não há novas)

| Lib/Melhor | Versão (pesquisada) | Usar? | Custo ~KB gzip | Alternativa sem custo |
|---|---|---|---|---|
| motion lib (GSAP/Framer) | — | **NÃO** | — | Motion via CSS (D008 já seguido) |
| new Form (react-hook-form) | — | NÃO | — | estado local React já cobre |
| intl (Intl.NumberFormat) | nativa Node/browser | **SIM (sem dep)** | 0 | usar no `lib/format` dos inputs monetários (P5) |
| icon lib (lucide-react) | ~13KB | NÃO | — | SVG inline já no repo (`Dashboard`, etc.) |

> Oportunidade P5 (fora deste doc? fica apenas menção): para input monetário formatado, classe `InputLocale` poderia usar `Intl.NumberFormat('pt-BR')` sem lib.

---

## 6. Checklist para os 10 implementadores (Fase 2)

**Ordem de execução recomendada (evita conflitos entre frentes)**:
1. `4.2` EmptyState (novo componente, front único) — **primeiro**, pois as frentes usam.
2. `4.3` Dashboard `done/pct` — local, sem conflito (Dashboard).
3. `4.4` CommandPalette — arquivo já isolado.
4. Fix hardcoded hex/rgba (D007) — toca Dashboard, TxView, ReportView, TransactionCard, SettingsView. Fazer após os componentes para evitar overwrite.
5. TxView: migrar empty state inline (`:267-303`) para `<EmptyState>`; fix `#ef4444`/`rgba(239,68,68,0.06)`/`#2563eb` → tokens.
6. SettingsView: migrar `#16a34a`/`rgba(245,158,11,0.12)`/`#e8f0f7`/`#1a6b5c`/`text-gray-*` → tokens; PhoneInput aria-label.

**Validações leves por passo** (máquina fraca do dev):
- 🟢 `npx eslint src/features/dashboard/Dashboard.jsx src/shared/ui/CommandPalette.jsx` (*frente única lag)
- `npx vitest run src/shared/ui --reporter=dot` (se tag <40s)
- build final: `npm run build` + `npm run typecheck` **delegado** (laptop fraco — ver AGENTE MD)

**NÃO quebrar**:
- ✅ `npm test` (vitest) unit
- ✅ O `PageSkeleton` quando `loading` (Dashboard: atender `if (loading) return <PageSkeleton/>` linha 89)
- ✅ WCAG AA: não rebaixar contraste (`--success` `#15803d` já validado), manter `--focus-ring`
- ✅ a11y de transpeite (`prefers-reduced-motion` — hover `:47`)
- ✅ offline-first (Dexie / `navigation.onLine` paths intocados)
- ✅ `--brand` dinâmica (usa `brand.color` do `brand` object não hardcode navy)

**Registro**: cada implementador atualiza `docs/WORKSPACE.md` §2 com commit convencional. **Não criar novos arquivos além do `EmptyState.jsx`** obrigatório — nunca outras frentes.

---

## 7. Log de coleta (transparência — auditável)

| # | Tipo | Alvo (query/URL/arquivo) | Conhecimento extraído |
|---|------|-------------------------|------------------------|
| 1 | leitura | `src/features/dashboard/Dashboard.jsx` (366 linhas) | estado vazio onboarding done=false; hardcoded `text-green-600`/amber; estrutura KPI e forecast |
| 2 | leitura | `src/shared/ui/TransactionCard.jsx` (289) | swipe actions sem aria das ações; `EmptyTransactionState` padrão a reutilizar; input inline sem `inputMode` |
| 3 | leitura | `src/shared/ui/Header.jsx` | syncStatus; `dotColor` status; busca sem handler |
| 4 | leitura | `src/shared/ui/ui.jsx` (275) | Card hover/Empty/Modal (focus trap, falta aria-describedby); Skeleton sem aria-busy |
| 5 | leitura | `src/shared/ui/CommandPalette.jsx` | bg-blue hardcoded vs brand via `color-mix`; keyboard nav ok, falta aria-activedescendant |
| 6 | leitura | `src/shared/ui/UsageBar.jsx` | KpiCard pill com rgba hardcoded; `BarChartSVG` sr-only table; `#ef4444` direto |
| 7 | leitura | `src/shared/ui/BottomNav.jsx` | tablist a11y completo |
| 8 | leitura | `src/features/reports/ReportView.jsx` | kpis, bycat com `#ef4444` hardcoded, sem sticky header |
| 9 | leitura | `src/index.css` (448) + `src/shared/styles/design-tokens.css` (76) | tokens reais (cor, `--touch-target-min`, motion, focus) |
| 10 | leitura | `docs/design/TEMPLATE.md` + `docs/design/README.md` + `REFINE_03` | contrato/cabeçalho |
| 11 | leitura | `src/features/transactions/TxView.jsx` (470) | `#ef4444`/`rgba(239,68,68,0.06)` accent hardcoded; `#2563eb` AI sugestão; empty state duplicado; sticky header + virtualizer role já OK; useTransition; inputMode number faltando no edit inline |
| 12 | leitura | `src/features/settings/SettingsView.jsx` (488) | hardcoded `#16a34a`/`rgba(245,158,11,0.12)`/`#e8f0f7`/`#1a6b5c`/`text-gray-*`; tabs a11y completa; WebAuthn+MfaSection OK; PhoneInput sem aria-label |
| 13 | busca | webquery "fintech dashboard ui best practices 2025 2026" | darekit |
| 14 | busca | "mercury/thermasterly finance dashboard design patterns" | pattern kpi, staging, tabular |
| 15 | busca | "status chips/skeleton motion reduce/currency input a11y" (3 queries consolidadas) | regras skipper |
| 16 | fetch | https://www.wildnetedge.com/…fintech-ux-design… | opções de dashboards, examples coins; ctas |
| 17 | fetch | https://www.themasterly.com/…dashboard-design-guide | money alignment + trust signal ("synced") + density |
| 18 | fetch | https://www.pencilandpaper.io/…data-tables | empty/sorting/density/sticky/bulk |
| 19 | fetch | https://www.stellae.design/en/components/badge | badge semantics, icon+color |
| 20 | fetch | https://www.modern-framework-accessibility.com/…skeletons | static-skeleton reduced-motion; aria-live |
| 21 | fetch | https://uxpatterns.dev/patterns/forms/currency-input | input monetário formatado; `inputmode="decimal"` mobile | 

---

## 8. Fontes completas

**Web (abertas, esta sessão):**  
1. https://www.wildnetedge.com/blogs/fintech-ux-design-best-practices-for-financial-dashboards  
2. https://www.themasterly.com/blog/fintech-dashboard-design-guide  
3. https://www.pencilandpaper.io/articles/ux-pattern-analysis-enterprise-data-tables  
4. https://www.stellae.design/en/components/badge  
5. https://www.modern-framework-accessibility.com/core-accessibility-principles-for-modern-frameworks/reduced-motion-and-animation-accessibility/accessible-loading-skeletons-and-spinners  
6. https://uxpatterns.dev/patterns/forms/currency-input  

**Web (busca de referência, não abertas)** — ver §7 (11 queries registradas).

**Repo lidos (com file:line representativas)**  
- `src/features/dashboard/Dashboard.jsx` (1-366)  
- `src/shared/ui/TransactionCard.jsx` (1-289)  
- `src/shared/ui/Header.jsx` (1-57)  
- `src/shared/ui/ui.jsx` (1-275)  
- `src/shared/ui/CommandPalette.jsx` (1-142)  
- `src/shared/ui/UsageBar.jsx` (1-135)  
- `src/shared/ui/BottomNav.jsx` (1-47)  
- `src/features/reports/ReportView.jsx` (1-248)  
- `src/index.css` (1-200, 201-448 parcial por grep) + `src/shared/styles/design-tokens.css` (1-76)  
  - `docs/design/TEMPLATE.md`, `docs/design/README.md`, `docs/design/REFINE_03_AppUI.md`
- `src/features/transactions/TxView.jsx` (1-470)
- `src/features/settings/SettingsView.jsx` (1-488)

**Other skills**: `frontend-craft/reference/industrial-brutalist-ui.md` (orientação para dados densos) — adotada apenas nas disciplinas de remoção (tabular/densidade/contraste), não em estética de folha.

---

## Sobre a entrega

Métricas: buscas=11, urls=6, lidos=14, doc_linhas=353.
Top 3 P0: (1) EmptyState unificado + onboard real `done` progress (Dashboard.jsx:130); (2) heal hardcoded hex/rgba → tokens (UsageBar:62, ReportView:191, TxView:19-20, SettingsView:297-318, Dashboard:148-169); (3) CommandPalette preserve brand token (`--brand`/`color-mix` em vez de bg-blue/gray hardcoded, linhas 89/110-111).