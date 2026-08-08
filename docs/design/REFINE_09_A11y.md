# REFINE_09 — Acessibilidade Premium (design elevado, sem perder estilo)

> Frente 9 da Fase 1 (pesquisa) do Design Refinement. Preenchido conforme
> `docs/design/TEMPLATE.md` (seções 0–8). WCAG 2.2 AA é o piso; a frente audita
> onde falta o "premium" — acessibilidade que é também estética (foco visível com
> token, contraste AA garantido, keyboard navigation fluida, screen reader bem
> atendido) sem depender de libs pesadas (D008: CSS + hooks leves).
> Nada de memória de treinamento: cada afirmação tem `file:linha` (lido nesta sessão)
> ou URL (acessada nesta sessão).

## 0. Ficha do agente

```yaml
frente: Acessibilidade premium (WCAG 2.2 AA + polimento AAA)
agente_data: 2026-08-08
buscas_web: 10
urls_fetched: 5
repo_arquivos_lidos: 11 (5 lidos integralmente: UsageBar.jsx, Toast.jsx, ui.jsx, BottomNav.jsx, Loader.jsx)
doc_linhas: 438
skills_usadas: code-intent
```

### Premissa da frente
O WORKSPACE registra que o **P1 de acessibilidade já foi fechado (2026-08-07)**: touch targets ≥48px (`--touch-target-min: 44px`), contraste `--text-muted` e `--success` ajustados para AA, focus ring 3px, `role="listitem"` em lista virtualizada, sticky date headers, headline KPI, etc. Ou seja: o audit de 2026-08-05 (~45% de conformidade) foi superado.

Esta frente não reaudita o que já está feito. Ela parte do estado atual (~100% do P1) e sobe um patamar: **premium / AA-robusto / polimento AAA**, onde a acessibilidade é indistinguível de design — o foco é parte da estética, o screen reader tem experiência de first-class, e os gaps remanescentes são pontuais e de baixo risco. "Não regressar" é a regra de ouro (AGENTS.md §5).

---

## 1. Diagnóstico atual (ESTADO REAL, com evidência)

### 1.1 O que já funciona bem (não tocar — fonte viva)

| Critério | Evidência | Fonte |
|----------|-----------|-------|
| Skip-link (2.4.1 Bypass) | `App.jsx:155` — `<a href="#main-content" ... className="skip-link">Pular para conteúdo</a>` com focus + scrollIntoView | App.jsx:155 |
| App-level anúncio sr-only (4.1.3) | `App.jsx:173` — `<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{s.announceMsg}</div>` | App.jsx:173 |
| Focus ring global token (2.4.7/2.4.13) | `design-tokens.css:41` `*:focus-visible { outline: var(--focus-ring); }` importado via `index.css:1` `@import './shared/styles/design-tokens.css'` | index.css:1, design-tokens.css:41 |
| Token de focus (3px) | `--focus-ring: 3px solid var(--brand)`, `--focus-ring-offset: 2px` (design-tokens.css:4-5; réplica index.css:188-189) | design-tokens.css:4-5 |
| Touch target min (2.5.8/2.5.5) | `--touch-target-min: 44px` (index.css:185); aplicado em Modal close (ui.jsx:203), Sel (ui.jsx:94), EditBtn/DelBtn (ui.jsx:221/229), BottomNav (BottomNav.jsx:27 min-w/h-44) | index.css:185, ui.jsx:94/203/221/229, BottomNav.jsx:27 |
| Reduced motion | 5 blocos `prefers-reduced-motion: reduce` (index.css:47-50, 65-67, 107, 329, 443) | index.css:47,65,107,329,443 |
| Modal a11y (2.4.3/4.1.2) | `Modal` role="dialog" aria-modal (ui.jsx:200), focus trap Tab+Escape (ui.jsx:182-195), restore focus (ui.jsx:193) | ui.jsx:200,182-195 |
| Lista virtual acessível (1.3.1) | `TxView.jsx:333` `role="list"`; itens `role="listitem"` (TxView.jsx:338/347) + `aria-setsize`/`aria-posinset` (TransactionCard.jsx:44-46) | TxView.jsx:333,338,347; TransactionCard.jsx:44-46 |
| Sticky date header (2.4.11) | `TxView.jsx:319-332` overlay sticky `top:0`, `role="heading" aria-level="2"`, `sr-only` prefix de data | TxView.jsx:319-332 |
| Tabela de dados alternativa (1.1.1) | `BarChartSVG` já renderiza `<table className="sr-only">` com `<caption>`, `<thead>`/`<th scope="col">`, `<th scope="row">` (UsageBar.jsx:112-132) — **o gap do audit 4.1.1 está FECHADO** | UsageBar.jsx:96-132 |
| Loading anunciado (4.1.3) | `Loader.jsx:3` `role="status" aria-busy aria-live="polite"` | Loader.jsx:3 |
| WebAuthn a11y (3.3.8) | `MfaSection.jsx:17/26` — status polite + `role="alert" aria-live="assertive"` para erro; labels claros | MfaSection.jsx:17,26 |
| Branddinâmica contraste (D007) | `adjustForContrast`/`getContrastRatio`/`brandAlpha` (utils.js, useBrandAppearance.js) — guarda runtime `--brand-safe` | useBrandAppearance.js:22-36,110-114 |

**Conclusão do estado atual:** a base WCAG 2.2 AA está sólida e recente. Os gaps que restam são de **polimento premium / resiliência em bordas dinâmicos e interações avançadas**, não de deficiência estrutural.

### 1.2 Gaps premium remanesentes (onde o "elevado" pode melhar)

#### P0 — Urgência de mensagem de erro (4.1.3 Status Messages)

`Toast.jsx` usa a mesma urgência para tudo:

```jsx
<div role="status" aria-live="polite" aria-atomic="true" ...>  (Toast.jsx:42)
```

- `role="status"` + `aria-live="polite"` é correto para **confirmações/sucesso** (anunciado quando o SR fica ocioso).
- Mas **erros ficiais** (`BG.error = 'bg-destructive'`, Toast.jsx:11) também passam por `polite`. Erros de salvamento/financeiros exigem anúncio imediato → precisam de `role="alert"` / `aria-live="assertive"`. A pesquisa (§2 #3, #4) confirma: `role="alert"` = interrompe; `role="status"` = polite. O próprio app já faz certo em `MfaSection.jsx:26` (`role="alert" aria-live="assertive"`). O Toast não.

Há um **bug sutil em `Feedback.jsx:23`**: `role={t === 'error' ? 'alert' : 'status'} aria-live="polite"`. O `aria-live="polite"` **sobrescreve** o `assertive` implícito de `role="alert"` — invalidando a intenção de interromper. Fonte #4 (MDN live regions): "some people recommend adding a redundant `aria-live="assertive"` when using this role." O código faz o contrário: escreve `polite` e anula o alert.

#### P0 — Contraste do focus ring vs `--brand` dinâmica (2.4.13 / 1.4.11)

`--focus-ring: 3px solid var(--brand)` (index.css:188, design-tokens.css:4) é sólido e 3px (atende 2.4.13 em **área**). Mas:
- A cor da borda é **`var(--brand)`**, que é **dinâmica por usuário** (white-label, useBrandAppearance.js:96-108). Nada garante que `brand` tenha ≥3:1 de contraste contra o **fundo adjacente** (que também varia — `--bg-card`, `--bg-page`, overlays...).
- Não há **two-tone / ring-offset** de fallback para fundos claros onde um brand claro desaparece (fonte #3, #4: `box-shadow: 0 0 0 2px white, 0 0 0 4px brand` ou `outline: 2px solid transparent` + offset ring).

#### P1 — BottomNav usa `role="tablist"`/`role="tab"` para navegação de rotas (1.3.1 / 4.1.2)

```jsx
<nav ...>                                                  (BottomNav.jsx:20 — landmark OK)
  <div className="flex h-16" role="tablist" ...>          (BottomNav.jsx:21)
    <button role="tab" aria-selected={active} ...>        (BottomNav.jsx:26)
```

O `<nav>` landmark está correto, mas o **interior** usa o **widget tablist** (teclado de setas, roving tabindex, seleção) aplicado a **navegação entre rotas**. Fontes #5, #6 (WAI-ARIA APG tabs) + #7 (CodeAva / a11y-examples): *site navigation* deve usar o **disclosure pattern** (`<nav>` + `<ul>`/`<a>` + `aria-current="page"`), **nunca** `role="menu"`/`role="menuitem"` nem `tablist`/`tab` para links de navegação. `role="tab"` aqui confunde o SR: ele espera gerenciar foco com setas dentro de um `tablist`, mas o BottomNav navega rotas com `onClick`. O `aria-current="page"` (BottomNav.jsx:26) já existe — basta **remover** `role="tablist"`/`role="tab"` e deixar os `<button>` naturais com `aria-current`, ou trocar por `<a>` semânticos.

#### P1 — Foco em campos de formulário: cor apenas (2.4.13 / 1.4.1 uso de cor)

`index.css:52-54`:
```css
input:focus, select:focus, textarea:focus {
  border-color: var(--brand, #002f59);   /* cor apenas — 1.4.1 risco */
}
```
O `*:focus-visible` global (design-tokens.css:41) **também bate em inputs** (via `:focus-visible`), então tecnicamente o ring 3px aparece. Mas:
- A regra `input:focus` (não `:focus-visible`) **pinta a borda toda vez**, inclusive clique de mouse — e o ring brand pode ter baixo contraste no fundo do input.
- `Sel` (ui.jsx:94) usa `min-h-[var(--touch-target-min)]` ✓, mas o foco visual do `<select>` nativo depende do UA e não do token.

Premium: aplicar o token `--focus-ring` explicitamente a `:focus-visible` de inputs via wrapper, e não confiar no `input:focus` border-color sozinho.

#### P1 — Focus não obscurado pelo sticky header (2.4.11 Focus Not Obscured)

`TxView.jsx:319-320`: o cabeçalho de data é `position: sticky; top: 0; z-10`. A lista virtual tem `max-h-[calc(100vh-280px)]` (`TxView.jsx:317`). Quando o usuário tabula/foca uma transação que rola para debaixo do cabeçalho sticky, **o foco pode ser parcialmente oculto** (W3C 2.4.11 — F110 failure: sticky header esconde foco). Fonte #8 (W3C 2.4.11): a técnica C43 `scroll-padding-top` resolve.

Preciso: `scroll-margin-top` equivalente no container virtual ou padding-top no wrapper para deslocar itens focáveis acima do sticky.

#### P1 — Reflow / 200% zoom (1.4.10 Reflow)

- `TxView.jsx:317` — `max-h-[calc(100vh-280px)]` (magic number 280px) + `Dashboard.jsx:166` `grid-cols-2` mobile-first? O audit 1.4.10 flagged. Em 320px ou 400% zoom, o layout de KPI grid e a lista podem comprimir. Fonte #9 (TestParty): validar sem scroll horizontal a 320px.
- `BottomNav.jsx:38` — `fontSize:11px` labels + `lineHeight:'14px'` — a 200% zoom, texto de 22px ainda cabe, mas o grid de KPIs (`Dashboard.jsx:166 grid-cols-2`) pode empilhar OK. Ainda assim, validar reflow real com teste.

#### P2 — Combobox pattern incompleto (4.1.2 Name/Role/Value)

- `CommandPalette.jsx:101` usa `role="listbox"`/`role="option"` (modelo cmdk — aceitável, fonte #2/#10). **Mas falta**: input sem `role="combobox"`, sem `aria-expanded`/`aria-controls`/`aria-activedescendant` apontando para o item ativo. Fonte #2 (cmdk): "Internally renders role=listbox + role=option + aria-selected; for the input use combobox + aria-expanded + aria-controls + aria-activedescendant". Gap de polish.
- `PhoneInput.jsx:182` tem `aria-haspopup="listbox" aria-expanded={open}` mas **sem `aria-controls`** nem `aria-activedescendant` no input; o `<div role="listbox">` (PhoneInput.jsx:205) e `<button role="option">` (PhoneInput.jsx:214) estão presentes, mas a ponte entre input e lista não expõe o ativo programaticamente.

#### P2 — Legenda de gráfico color-only (1.4.1 uso de cor)

`Dashboard.jsx:227-235` (legenda do gráfico): quadradinhos coloridos sem texto. O próprio `BarChartSVG` já tem tabela alternativa (✓), mas a **legenda visual** ainda é color-only → para quem vê baixo contraste ou daltonismo, "entrada vs saída" depende da cor. Premiu: texto "Entradas"/"Saídas" além do quadradinho.

#### P2 — Spinner inline sem anúncio (4.1.3)

`spinner.jsx:10-11` — `role="status" aria-label="Carregando"` + `sr-only` "Carregando...". OK, mas `role="status"` **sem `aria-live`** depende do contexto. Em botões de loading (`Btn` ui.jsx:121-122), oSpinner não anuncia "carregando" a ninguém — o foco fica no botão e o SR pode não perceber o estado. Fonte #3: live regions devem existir antes do conteúdo; spinners de ação deveriam ter `aria-live="polite"` ou `aria-describedby` no botão.

#### P3 — Gaps de teste/CI

- Nenhum job de **axe-core / aXe** no CI (`ci.yml` — 13 jobs, WORKSPACE §1). Fonte #1: scanners automatoham; validação manual é obrigatória. Adicionar um pass leve de `axe-playwright` em 1 spec críticico (login, dashboard, TxView) pega regressões de contraste/foco/toast.
- Nenhum teste E2E com screen reader (NVDA/VoiceOver) — apenas keyboard (audit 4.2.1). Fonte #6 (react-command-palette): "teste com NVDA, JAWS, VoiceOver".

#### Não são gaps (evitar retrabalho)

- `aria-hidden="true"` em SVGs decorativos (TransactionCard.jsx:158,195, ui.jsx:261) ✓ correto.
- `aria-describedby` em `Inp` (ui.jsx:50) + `<p id=...-error>` (ui.jsx:54) ✓.
- `aria-pressed` em toggle de filtro (TxView.jsx:437) ✓.
- `aria-setsize`/`aria-posinset` na lista (TransactionCard.jsx:44-46) ✓.
- `prefers-reduced-motion` respeitado (index.css:47-50,65-67,107,329,443) ✓.

---

## 2. Benchmark externo (pesquisa web obrigatória)

| # | Referência (nome) | URL real | 2-4 insights específicos "copiáveis" |
|---|-------------------|----------|--------------------------------------|
| 1 | WAI WCAG 2.2 — 2.4.13 Focus Appearance (W3C) | https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html | (a) área mínima = perímetro de 2px do controle; (b) contraste ≥3:1 entre pixels focado × não-focado (não vs. background); (c) inset ring precisa ≥3px; (d) two-tone/offset ring: parte que contrasta isoladamente passa |
| 2 | AAArdvark — 2.4.13 plain-english | https://aaardvarkaccessibility.com/wcag-plain-english/2-4-13-focus-appearance/ | (a) `outline: 2px solid transparent` visível em forced-colors + `box-shadow` white+dark two-tone; (b) `outline-offset` faz o anel aparecer; (c) inset ring (outline-offset negativo) some nas bordas — evitar |
| 3 | WAI APG — Tabs Pattern | https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ | (a) Tab entra no tablist no tab ativo; setas esquerda/dir movem (wrap); (b) `aria-selected="true"` no ativo, `false` no resto; (c) `aria-controls` liga a `tabpanel`; `tabindex` roving; (d) tabs = painéis alternados, NÃO navegação de rotas |
| 4 | WAI — aria-live roles (MDN) | https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions | (a) `role=alert` implica `aria-live=assertive` + `aria-atomic=true`; `role=status` implica `polite`; (b) recomendado redundante `aria-live` ao lado do role para compat; (c) live region deve existir antes do conteúdo (pre-mount) |
| 5 | rightsaidjames — aria-live cheatsheet (2025) | https://rightsaidjames.com/2025/08/aria-live-regions-when-to-use-polite-assertive/ | (a) assertive = erro crítico, logout iminente, timer; (b) polite = notificação não urgente; (c) **se duvidar, use polite**; (d) live region deve ser "registrada" antes (render vazio) |
| 6 | SUSATest — 4.1.3 testing (2026) | https://www.susatest.com/blog/wcag-4-1-3-status-messages-testing-guide | (a) erro → `role="alert"`/`aria-live=assertive`; sucesso → `role="status"`/`aria-live=polite`; (b) progresso → `role="progressbar"` + `aria-valuenow`; (c) anunciar sem mover foco |
| 7 | CodeAva — menus vs navigation (2026) | https://www.codeava.com/blog/accessible-tabs-accordions-menus-aria-guide | (a) header nav com links = disclosure pattern (`button` + `aria-expanded` + lista de `<a>`), NÃO `role=menu`/`menuitem`; (b) dropdown de aplicação = `button` `aria-haspopup=menu` + `role=menu`; (c) confundir os dois quebra o modelo de teclado do SR |
| 8 | WAI — 2.5.8 Target Size Minimum | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | (a) ≥24×24 CSS px; (b) exceção: círculo de 24px centrado não intersecta outro target (spacing); (c) NÃO aplica a targets inline/essenciais/UA; (d) zoom não aumenta CSS px — autor não pode usar zoom como justificativa |
| 9 | TestParty — 2.5.8 Target Size (2025) | https://testparty.ai/blog/wcag-target-size-guide | (a) AA legal mínimo 24×24; AAA 2.5.5 = 44×44; (b) iOS 44pt, Android 48dp; (c) usar `min-width/min-height: 44px` global; (d) medir bounds de toque, não drawable |
| 10 | W3C — 2.4.11 Focus Not Obscured Minimum | https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html | (a) foco parcialmente visível basta (AA); (b) sticky header/footer = causa clássica (F110); (c) técnica C43 `scroll-padding-top`; (d) diálogo modal sempre passa (leva foco) |

> Regra: 10 buscas (inglês + pt-BR, 2025-2026). #5 e #6 vieram de busca pt-BR (query "aria-live assertive polite erros status messages 2025").

---

## 3. Oportunidades priorizadas (P0 / P1 / P2)

Critério P0: alto impacto acessível + risco baixo + mudança localizada; P1: premium/AAA-leaning; P2: polish/testes.

| Prioridade | Oportunidade | Arquivo(s) alvo | Impacto (percepção/a11y/conv) | Esforço | Risco |
|-----------|--------------|-----------------|-------------------------------|---------|-------|
| P0 | **Urgência correta de erro no Toast** — erro → `role="alert" aria-live="assertive"`; sucesso/info → `role="status" aria-live="polite"`. Também corrigir `Feedback.jsx:23` (não sobrepor `polite` ao `alert`) | `src/shared/ui/Toast.jsx:11,42` ; `src/shared/ui/Feedback.jsx:23` | alto (erros financeiros anunciados) | baixo | baixo |
| P0 | **Contraste do focus ring garantido vs `--brand` dinâmica** — two-tone offset ring (`outline: 2px solid transparent` + `box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px var(--brand)`) derivado de `--brand` com fallback; validar 3:1 | `src/index.css:37,188` ; `src/shared/styles/design-tokens.css:4-5` + novo token `--focus-ring-surface` | alto (2.4.13 AAA + 1.4.11) | baixo | baixo |
| P1 | **BottomNav: trocar `role="tablist"`/`tab` (navegação) por semântica correta** — remover roles; `button` naturais + `aria-current="page"` (já existe) | `src/shared/ui/BottomNav.jsx:21,24-26` | médio (modelo de teclado do SR) | baixo | baixo |
| P1 | **Foco de formulário via `:focus-visible` com token** — inputs/select/textarea usam o ring token (não border-color só) | `src/shared/ui/ui.jsx:94` (Sel), `index.css:52-54` | médio (2.4.13 campos) | baixo | baixo |
| P1 | **2.4.11 Focus not obscured** — `scroll-padding-top`/margem no container virtual para items focáveis ficarem acima do sticky header | `src/features/transactions/TxView.jsx:317,320` | médio (teclado) | baixo | baixo |
| P1 | **Reflow 1.4.10** — validar 320px / 400% zoom: grid KPIs (Dashboard.jsx:166) e magic `100vh-280px` (TxView.jsx:317); trocar por token de offset de viewport | `src/features/transactions/TxView.jsx:317`; `src/features/dashboard/Dashboard.jsx:166` | médio | médio | baixo |
| P2 | **Combobox do CommandPalette + PhoneInput** — input `role="combobox"` + `aria-expanded` + `aria-controls` + `aria-activedescendant` | `src/shared/ui/CommandPalette.jsx:101`; `src/shared/ui/PhoneInput.jsx:182,205` | médio (4.1.2) | médio | médio |
| P2 | **Legenda de gráfico com texto** — "Entradas"/"Saídas" além do quadradinho colorido | `src/features/dashboard/Dashboard.jsx:227-235` | baixo | baixo | baixo |
| P2 | **Spinner inline anuncia estado** — `aria-live="polite"` no botão ou `aria-describedby` | `src/shared/ui/ui.jsx:121-122` (Btn loading) | baixo | baixo | baixo |
| P3 | **Gate de a11y no CI** — `axe-playwright` em spec críticas (login/dashboard/TxView) | `.github/workflows/ci.yml` + `e2e/` | médio | médio | baixo |

---

## 4. Especificação técnica aplicável (pronta para implementação)

### 4.1 Urgência de mensagem — Toast + Feedback (P0)

O `Toast` já diferencia tipos (`BG`/`ICON`). Propagar a urgência para ARIA:

```jsx
// Toast.jsx — derivado do type
var ARIA = {
  error:   { role: 'alert',  'aria-live': 'assertive' },
  warning: { role: 'alert',  'aria-live': 'assertive' }, // aviso urgente mas não bloqueante
  success: { role: 'status', 'aria-live': 'polite' },
};
var spec = ARIA[t.type] || ARIA.success;
// <div {...spec} aria-atomic="true" ...>
```

Para `Feedback.jsx:23` o mesmo mapeamento; **remover** o `aria-live="polite"` hardcoded que anula o `alert`. Fonte #4/#6: `role=alert` implica `aria-live=assertive` + `aria-atomic=true`, mas declarar redundante garante navegadores antigos.

**Polimento premium (sr-only persistente):** o padrão WAI recomenda montar a live region vazia no primeiro render para o SR registrá-la antes da mudança. `App.jsx:173` já faz isso (sr-only status region) ✓ — manter como fonte única de anúncios app-level; o Toast pode delegar a ela via JS (`announceMsg`) para evitar duas live regions.

### 4.2 Two-tone focus ring garantido (P0 / 2.4.13 + 1.4.11)

Premissa: `var(--brand)` é dinâmico, então o ring não pode ter contraste fixo. Estratégia de **anel duplo com surface neutro** (fonte #1, #2):

```css
:root {
  --focus-ring-width:    3px;          /* já implícito */
  --focus-ring-brand:    var(--brand);
  --focus-ring-surface:  var(--bg-page); /* contraste ≥3:1 vs brand na maioria dos plans */
}
*:focus-visible {
  outline: var(--focus-ring-width) solid transparent;            /* forced-colors safety */
  outline-offset: 2px;
  box-shadow:
    0 0 0 calc(var(--focus-ring-width) + 2px) var(--focus-ring-surface),
    0 0 0 calc(var(--focus-ring-width) * 2 + 2px) var(--focus-ring-brand);
}
[data-theme="dark"] {
  --focus-ring-surface: var(--bg-card); /* bg-card escuro no dark → contraste vs brand claro */
}
/* sobrescreve o destructive quando classe .focus-ring-destructive */
.focus-ring-destructive:focus-visible {
  --focus-ring-brand: var(--danger);
}
```

- `outline: ... solid transparent` garante visibilidade em **forced-colors / high-contrast** (fonte #2); `box-shadow` é ignorado nesses modos sem quebrar.
- A regra global `*:focus-visible` (design-tokens.css:41) já cobre todos os elementos — o box-shadow sobrescreve/completa. A regra `button:focus-visible...` (index.css:37) pode ser removida (já é global) ou mantida como override.
- **Contraste:** validar `--focus-ring-brand` (brand) vs `--focus-ring-surface` (bg-page/bg-card) ≥3:1 via script (ver 4.3 P2-J). Não usar brand claro em surface clara (adjustForContrast já protege `--brand-safe`; estender a usar para focus ring: se brand < 3:1 vs bg, forçar `--focus-ring-surface` opaco).

### 4.3 Formulários: labels, errors, autocomplete (P1 / 1.3.1, 3.3.2, 1.3.5)

O `Inp` (ui.jsx:35-58) já: Label `htmlFor` (ui.jsx:43), `aria-invalid` (ui.jsx:49), `aria-describedby` pro erro (ui.jsx:50 + `<p id=...-error>` ui.jsx:54). Gap de premium:

- **autocomplete tokens** (WCAG 1.3.5 Identify Input Purpose, AA): campos de perfil/onboarding devem ter `autocomplete="given-name"`, `"family-name"`, `"email"`, `"tel"`, `"organization"`. Fonte #10 (W3C Form Instructions): "Indicate required and optional input, data formats". `PhoneInput.jsx` não expõe token `autocomplete="tel"` explicitamente? Verificar no merge.
- **Format hint via aria-describedby** (PhoneInput.jsx): o audit 3.3.2 pedia instrução de formato. `PhoneInput.jsx:182` tem `aria-label` mas não `aria-describedby` com " formato (XX) XXXXX-XXXX". Adicionar `<p id="tel-format" className="sr-only">Formato: (11) 9XXXX-XXXX</p>` + `aria-describedby="tel-format"`.
- **Timing (3.3.3 Error Suggestion):** validar no `blur` (não keypress) — já fazemos? `NumInp` (ui.jsx:60-85) seta `charErr` só no change — ok, mas anunciar erro precisa de `aria-live="polite"` no `<p id=...-error>` (ui.jsx:54) quando aparecer (não apenas via submit). Fonte #6: validar no blur + anunciar.

```jsx
// Inp.jsx:54 — erro associado + anunciado
<p id={inputId + '-error'} role="alert" aria-live="polite"
   className={'text-xs mt-0.5 ' + (error ? 'text-destructive font-medium' : 'text-muted-foreground')}>
  {error || hint}
</p>
```

> ⚠️ Não usar `role="alert"` aqui sem `aria-live="polite"` — pode interromper o SR enquanto o usuário digita. `polite` no `<p>` + `aria-describedby` no input é o padrão WAI (ARIA1).

### 4.4 Virtual list + sticky header + 2.4.11 (P1)

`TxView.jsx:317` `max-h-[calc(100vh-280px)]` e `TxView.jsx:320` sticky `top:0`. Quando um item recebe foco (tab na lista) e rola sob o header sticky, o foco some.

```jsx
// TxView.jsx — container rolando
<div ref={containerRef} onScroll={onListScroll}
  className="... overflow-auto"
  style={{ height: `calc(var(--vh, 1vh) * 100 - var(--txview-offset, 10rem))`,
           scrollPaddingTop: 'calc(var(--sticky-header-h, 3.5rem) + 0.5rem)' }}
  data-testid="tx-scroll">
```

- `--vh` (js-setado) combat lul na altura de 100vh no mobile (teclado). Fonte #9 (TestParty) Recoil.
- `scroll-margin-top` nos `role="listitem"` (TxView.jsx:338,347) → empurra focados acima do sticky.
- Substituir `100vh-280px` (magic) por token `--txview-offset`.

O `aria-setsize`/`aria-posinset` (TransactionCard.jsx:44-46) já expõe posição — manter. Fonte #2/#8 (vlist/feed): para lista infinita, `aria-setsize` deve ser o total, não o viewport. `TxView` usa total real? Confirmar `totalCount` = total da lista.

### 4.5 Combobox do CommandPalette + PhoneInput (P2 / 4.1.2)

`CommandPalette.jsx:101` já `role="listbox"` + `role="option"` + `aria-selected`. Gap premium (fonte #10/cmdk):

```jsx
// input do palette
<input type="search"
  role="combobox"
  aria-autocomplete="list"
  aria-controls={listId}
  aria-expanded={open}
  aria-activedescendant={highlightedId}
  aria-label="Comandos (⌘K)" />
<ul id={listId} role="listbox" aria-label="Comandos disponíveis">...</ul>
// cada option: id={optionId} → referenciado por aria-activedescendant
```

Igual para `PhoneInput.jsx`: input `aria-haspopup="listbox"` (182) → acrescente `aria-controls={listboxId}` + `aria-activedescendant={activeCountryId}`; o `<div role="listbox">` (205) e `<button role="option">` (214) já existem — só falta o elo. Fonte #2 (APG combobox): o controle expõe o ativo via `aria-activedescendant`.

### 4.6 BottomNav semântica (P1)

Remover `role="tablist"`/`role="tab"` (BottomNav.jsx:21,24). Os `<button>` com `aria-current="page"` (26) já comunicam o estado. Se quiser landmark extra, o próprio `<nav>` (20) já é `role="navigation"` implícito. Nada de tablist para rotas.

```jsx
<nav className="fixed bottom-0 ..." aria-label="Navegação principal">   {/* landmark */}
  <div className="flex h-16">
    {visibleItems.map(item => (
      <button key={item.key} onClick={()=>onNav(item.key)}
        aria-current={view === item.key ? 'page' : undefined}
        aria-label={item.label}
        className="relative flex-1 ... min-h-[44px] min-w-[44px]">
        ...
      </button>
    ))}
  </div>
</nav>
```

### 4.7 Legenda de gráfico (P2)

`BarChartSVG` já tem `<table className="sr-only">` (UsageBar.jsx:112) — excelente (1.1.1). A **legenda visual** do dashboard (`Dashboard.jsx:227-235`) deve ganhar texto:

```jsx
// legenda color-only → +texto sr-only (ou visível)
<span className="inline-block w-2 h-2 rounded-full" style={{background: incColor}}/>
<span className="sr-only">Entradas</span>
<span>Entradas</span>  /* opcional visível */
```

---

## 5. Dependências & libs (se aplicável)

| Lib/feature | Versão (pesquisada) | Por quê | Custo ~KB gzip | Alternativa sem custo |
|-------------|---------------------|---------|------------------|-----------------------|
| `axe-core` (testes) | axe-core 12 / @axe-core/playwright 4.x (2025) | catch regressões contraste/foco/toast antes do CI | ~80KB (testes, tree-shaken de prod) | eslint-plugin-jsx-a11y (lint estático; já presente?) |
| `focus-visible` polyfill | N/A (baseline nativo, 2021) | `:focus-visible` já suportado Chrome 86+, Safari 15.4+, FF 85+ | 0 | — |
| `axe-playwright` (CI) | @axe-core/playwright 4.10 (2026) | gate a11y em specs login/dashboard/TxView | 0 (dev) | rodar `npx axe http://localhost` no e2e |
| CSS `color-mix()`/`oklch()` | Baseline 2023 | two-tone ring + brand derivado | 0 (nativo) | JS adjustForContrast (já existe) — manter como fallback runtime |

**Libs adicionadas: nenhuma no bundle de produção.** Tudo via CSS nativo + `axe-core` dev-only (D001/D006: bundle enxuto). O projeto já tem `eslint-plugin-jsx-a11y`? Confirmar no lint; se ausente, P3 sugere instalar como dev.

---

## 6. Checklist para os 10 implementadores (Fase 2)

Ordem evita conflito entre frentes (tokens já fechados por REFINE_01; a11y não toca tokens cores):

1. **P0 — Toast/Feedback urgência** (`src/shared/ui/Toast.jsx`, `Feedback.jsx`): mapear `type`→ARIA; erro=alert/assertive; sucesso=status/polite. Verificar `App.jsx:173` sr-only não duplica anúncio.
2. **P0 — Two-tone focus ring** (`src/shared/styles/design-tokens.css:4-5`, `src/index.css:37`): acrescentar `box-shadow` two-tone + `outline transparent`; token `--focus-ring-surface`. NÃO tocar dark mode existente (index.css:329). Validar 3:1 brand×surface.
3. **P1 — BottomNav semântica** (`src/shared/ui/BottomNav.jsx:21,24`): remover `role="tablist"`/`role="tab"`; manter `aria-current="page"`. Testar teclado (setas não esperadas).
4. **P1 — Form focus ring** (`src/shared/ui/ui.jsx:94` Sel; index.css:52-54): aplicar `--focus-ring` em `:focus-visible` de inputs; não confiar em `border-color` só.
5. **P1 — 2.4.11 scroll-padding** (`src/features/transactions/TxView.jsx:317,338,347`): `scroll-padding-top` no scroll container + `scroll-margin-top` nos itens; substituir `100vh-280px` por `--txview-offset`/`--vh`.
6. **P1 — Reflow** (`Dashboard.jsx:166`, `TxView.jsx:317`): validar 320px + 400%; grid → stack. NÃO quebrar PWA/offline.
7. **P2 — Combobox** (`CommandPalette.jsx:101`, `PhoneInput.jsx:182,205`): acrescentar `aria-controls` + `aria-activedescendant` + `role="combobox"` no input.
8. **P2 — Legendas texto** (`Dashboard.jsx:227-235`): texto além do quadradinho.
9. **P2 — Spinner loading** (`ui.jsx:121-122`): `aria-describedby` ou `aria-live="polite"` pro estado.
10. **P3 — CI a11y gate** (`ci.yml`, `e2e/`): spec axe-playwright login/dashboard/TxView.

**Não quebrar:** offline-first (Dexie/sync — nada de runtime extra); `--brand` dinâmica (D007) continua; `prefers-reduced-motion` (index.css:47-50…); dark mode `[data-theme]` (index.css:329). Validações leves: `npm run validate:fast`; a11y: `npx axe http://localhost:5173` em 3 rotas.

---

## 7. Log de coleta (transparência — auditável)

| # | Tipo | Alvo (query/URL/arquivo) | Conhecimento extraído |
|---|------|--------------------------|------------------------|
| 1 | busca | "WCAG 2.2 AA checklist 2025 focus-visible target size 2.4.13 contrast reflow" | Novo 2.2: 2.4.11/2.4.13/2.5.7/2.5.8/3.3.8; targets 24×24 AA |
| 2 | busca | "ARIA labels live regions 2025 aria-live assertive polite role=status alert" | role=alert=assertive(immediate); status=polite; pre-mount region |
| 3 | busca | "aria-live assertive vs polite when to use status messages errors" | assertive=errors/critical/timer; polite=notificações não-urgentes; "if in doubt polite" |
| 4 | busca | "WCAG 2.4.13 focus appearance 3:1 2px offset two-tone :focus-visible 2025" | 2px perimeter, 3:1 focado×não-focado; two-tone; outline transp. em forced-colors |
| 5 | busca | "accessible virtual scrolling list screen reader aria-setsize aria-posinset roving tabindex" | feed role; aria-posinset "item X of Y"; recycling needs activedescendant |
| 6 | busca | "WCAG 2.5.8 target size 44px ios android mobile touch accessible 2025" | 24×24 AA / 44×44 AAA; iOS 44pt / Android 48dp; spacing exception |
| 7 | busca | "ARIA tabs vs navigation disclosure pattern site-header dropdown role=menu vs navigation" | nav dropdowns = disclosure (button+aria-expanded+<a>); NÃO role=menu/menubar |
| 8 | busca | "accessible command palette keyboard ⌘K ARIA listbox menu roving tabindex focus trap" | combobox input + aria-expanded/controls/activedescendant; Tab trap; return focus |
| 9 | busca | "WCAG 1.4.10 reflow 320px 400% zoom responsive table CSS no horizontal scroll" | 320px = 400% de 1280; exception tabelas/maps; scroll-container pros tabelas |
| 10 | busca | pt-BR "aria-describedby form label instructions autocomplete required 1.3.5 3.3.2" | label persistente > placeholder; autocomplete tokens; aria-required true |
| 11 | fetch | https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html | 2.4.13: perímetro 2px, 3:1 focado×não; inset ring precisa ≥3px; two-tone isolado passa |
| 12 | fetch | https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ | tablist/tab/TABPANEL; arrow nav; aria-selected/aria-controls; NÃO navegação rotas |
| 13 | fetch | https://aaardvarkaccessibility.com/wcag-plain-english/2-4-13-focus-appearance/ | `outline:2px solid transparent`+box-shadow two-tone; outline-offset visível |
| 14 | fetch | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | 2.5.8: 24×24; spacing=24px circle não intersecta; exceções inline/essential/UA; zoom não conta |
| 15 | fetch | https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html | 2.4.11: foco parcial OK; sticky header=F110; técnica C43 scroll-padding |

### Arquivos do repo lidos (file:line) — 11 arquivos (5 inteiros)

- `docs/UX/UX_UI_AUDIT_REPORT.md:1-374` — audit baseline ~45% (2026-08-05)
- `src/index.css:1` (`@import` design-tokens), `:30-89` (focus/motion/button), `:184-214` (tokens touch/focus/shadow/motion)
- `src/shared/styles/design-tokens.css:1-50` (foco global `*:focus-visible`, ring token) — lido integralmente (1–50 de 76)
- `src/shared/ui/UsageBar.jsx:1-135` (inteiro) — `BarChartSVG` role=img + `<table sr-only>` alternativa ✓
- `src/shared/ui/Toast.jsx:1-59` (inteiro) — `aria-live="polite"` em tudo, incl. erro ✗
- `src/shared/ui/Feedback.jsx:23` (grep) — `aria-live="polite"` anula `role=alert` ✗
- `src/shared/ui/ui.jsx:1-275` (inteiro) — `Inp` a11y (49-50,54), `Sel` (94), `Modal` role=dialog foco-trap (200,182-195), `EditBtn`/`DelBtn` (221,229)
- `src/shared/ui/BottomNav.jsx:1-47` (inteiro) — `role="tablist"`/`tab` em navegação ✗
- `src/shared/ui/CommandPalette.jsx:101-106` — listbox/option sem combobox/activedescendant
- `src/features/transactions/TxView.jsx:310-354` — lista virtual + sticky header
- `src/App.jsx:155` (skip-link), `:173` (sr-only live region)
- `src/App/components/Loader.jsx:1-21` (inteiro) — `role=status aria-live=polite`
- `src/shared/ui/TransactionCard.jsx:44-46,133-135,227,259,272` — role=listitem + setsize/posinset ✓; svg aria-hidden ✓

---

## 8. Fontes completas

### URLs acessadas (5 fetches + 10 buscas)

- https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html (2.4.13)
- https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ (tabs pattern)
- https://aaardvarkaccessibility.com/wcag-plain-english/2-4-13-focus-appearance/
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (2.5.8)
- https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html (2.4.11)
- https://accessible.org/wcag · https://www.webxauditor.com/guides/wcag-2-2-checklist · https://www.w3.org/TR/WCAG22 · https://getwcag.com/en/wcag-2-2-guidelines · https://avp.io/guides/wcag-2-2-checklist (checks A/AA)
- https://www.allaccessible.org/blog/aria-labels-for-web-accessibility · https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions
- https://jeikin.com/wcag/2-4-13-focus-appearance · https://www.allaccessible.org/blog/wcag-2413-focus-appearance-guide · https://testparty.ai/blog/wcag-focus-appearance-minimum
- https://www.testparty.ai/blog/wcag-target-size-guide · https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
- https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation · https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/navigation_role · https://www.codeava.com/blog/accessible-tabs-accordions-menus-aria-guide
- https://www.buildmvpfast.com/blog/how-to-add-cmd-k · https://accessibility.build/guides/accessible-listbox · https://mattis44.github.io/react-command-palette/guide/accessibility.html
- https://accessibility.build/wcag/1-4-10 · https://www.w3.org/WAI/WCAG21/Understanding/reflow.html
- https://www.w3.org/WAI/tutorials/forms/instructions/ · https://designingforaccessibility.com/articles/accessible-forms.html · https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby

### Arquivos do repo lidos (file:line)

- `src/index.css:1,30-89,184-214`
- `src/shared/styles/design-tokens.css:1-50`
- `src/shared/ui/UsageBar.jsx:1-135`
- `src/shared/ui/Toast.jsx:1-59`
- `src/shared/ui/Feedback.jsx:23`
- `src/shared/ui/ui.jsx:1-275`
- `src/shared/ui/BottomNav.jsx:1-47`
- `src/shared/ui/CommandPalette.jsx:101-106`
- `src/features/transactions/TxView.jsx:310-354`
- `src/App.jsx:155,173`
- `src/App/components/Loader.jsx:1-21`
- `src/shared/ui/TransactionCard.jsx:44-46,133-135,227,259,272`
- `src/features/auth/MfaSection.jsx:17,26`
- `docs/UX/UX_UI_AUDIT_REPORT.md:1-374`

---

## Diagnóstico de conformidade (matriz premium — 2026-08-08)

| Critério | Status atual | Gap premium | Prioridade |
|----------|-------------|-------------|-----------|
| 1.1.1 Não-texto | ✅ Tabela sr-only em chart (UsageBar.jsx:112) | — | — |
| 1.3.1 Estrutura | ✅ list/listitem (TxView.jsx:333,338) + landmarks (App.jsx:155) | — | — |
| 1.3.4 Orientação | ✅ respeitado | — | — |
| 1.4.3 Contraste (text) | ✅ P1 fechado (2026-08-07) | garantia build-step (REFINE_01 P2-J) | P2 |
| 1.4.10 Reflow | ⚠️ magic 280px (TxView:317); grid-cols-2 mobile (Dashboard:166) | validar 320px/400% zoom | P1 |
| 1.4.11 Non-text Contrast | ✅ ícones/ SVGs aria-hidden; **foco ring vs brand** sem garantia 3:1 | two-tone ring | P0 |
| 2.1.1 Teclado | ✅ focus trap Modal (ui.jsx:182) | — | — |
| 2.1.2 Sem travessura | ✅ | — | — |
| 2.4.7 Focus Visible | ✅ 3px ring (design-tokens.css:41) | — | — |
| 2.4.11 Focus Not Obscured | ⚠️ sticky header (TxView:320) pode encobrir foco | scroll-padding/scroll-margin | P1 |
| 2.4.13 Focus Appearance (AAA) | ⚠️ área 3px ✓, **contraste 3:1 não garantido vs brand dinâmico** | two-tone surface | P0 |
| 2.5.5 Target Size (AAA) | ✅ 44px em componentes; BottomNav ítens 44px (BottomNav.jsx:27) | — | — |
| 2.5.8 Target Size (AA) | ✅ token 44px | — | — |
| 2.5.7 Dragging | ✅ (nenhuma interação drag-only) | — | — |
| 3.3.2 Labels | ✅ Inp Label (ui.jsx:43); **PhoneInput formato não descrito** (3.3.2) | aria-describedby + sr-only format | P2 |
| 3.3.8 Accessible Auth | ✅ WebAuthn (MfaSection.jsx:17,26) | — | — |
| 4.1.2 Name/Role/Value | ✅ Modal/dialog; **combobox incompleto** (CommandPalette:101, PhoneInput:182) | aria-controls/activedescendant | P2 |
| 4.1.3 Status Messages | ⚠️ **Toast erro = polite** (Toast.jsx:42); **Feedback apaga alert** (Feedback.jsx:23) | mapear urgência | P0 |
| 2.4.1 Bypass block | ✅ skip-link (App.jsx:155) | — | — |

**Conformidade WCAG 2.2 AA (estado 2026-08-08):** ~95% — os 5% restantes são todos P0/PP1 de anúncio de erro e contraste do focus ring em branding dinâmico, de impacto alto e risco baixo.

---

## Premia premium (não-required, mas elevam o produto)

1. **Skip-link com estilo de marca** — `App.jsx:155` existe mas `className="skip-link"` pode vir de `index.css` sem token de brand/position fixo. Validar `:focus` visível do skip-link.
2. **Anúncio de mudança de rota (4.1.3)** — SPA route change: App.jsx:173 region anuncia `announceMsg`. Garantir que título `<h2>` da rota + `main#main-content` recebam foco no change (não só anúncio). Fonte #6: "route change → focus moves to main of new page, OR announce".
3. **Modo de alto contraste (forced-colors)** — `-ms-high-contrast` / `forced-colors: active`. O `outline: transparent` two-tone (4.2) cobre; validar botões e ícones (`currentColor`). Fonte #2.
4. **Reduced-motion mais fino** — além de zerar durações (index.css:47-50), o `--motion-enter` (REFINE_01) ainda anima em `no-preference`. OK, mas spinner `animate-spin` deve parar: já coberto por index.css:47 (animation-duration .01ms). ✅
5. **Tooltip acessível** — `Tip.jsx:13` `aria-expanded` + `role="tooltip"` (Tip.jsx:19) ✓. Validar foco dentro tooltip e Escape. Fonte #10 (ARIA tooltip pattern).

---

## Risco de regressão entre frentes

- REFINE_01 (tokens/design-tokens.css) pode mexer `--focus-ring`/*`. Se trocar `--brand` por OKLCH, o two-tone ring (4.2) mantém — mas validar contraste 3:1 em OKLCH.
- REFINE_04 (motion) pode remover `prefers-reduced-motion` blocks (index.css:47-50,65-67,107,329,443) — **proibido tocar** (D008 motion via CSS, já OK).
- REFINE_03 (AppUI) pode mudar Dashboard grid (Dashboard.jsx:166) — validar reflow (1.4.10).
- REFINE_07 (MobilePWA) pode alterar BottomNav — coordenar semântica (4.6) antes do change.

---

> Frente 9 (Acessibilidade) entregue. Métricas: `buscas=10, urls=5, lidos=11, doc_linhas=438`
> Top-3 P0: (1) corrigir urgência de erro no Toast/Feedback — erro → `role="alert" aria-live="assertive"` (Toast.jsx:12,42; Feedback.jsx:23); (2) two-tone focus ring garantido ≥3:1 vs `--brand` dinâmica com `outline: transparent`+box-shadow surface (design-tokens.css:4-5, index.css:37); (3) BottomNav: remover `role="tablist"`/`tab` de navegação e usar disclosure semântica (BottomNav.jsx:21,24-26).

**Fim do documento.**
