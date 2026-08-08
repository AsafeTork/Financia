# REFINE_04 — Motion & Micro-interações

> ⚠️ Preencher seguindo `docs/design/TEMPLATE.md` (seções 0-8, ≥300 linhas).

```yaml
frente: Motion & micro-interações
agente_data: 2026-08-08
buscas_web: 12 (11 executadas + 1 repetida após rate-limit 429)
urls_fetched: 5 (ctx_fetch_and_index; acrescidas de 8 fontes lidas via websearch)
repo_arquivos_lidos: 19
doc_linhas: 462
skills_usadas: motion-pack (+ reference/motion-design.md lido na íntegra)
```

---
## 1. Diagnóstico atual (ESTADO REAL, com evidência)

O app **já tem** uma base de motion surpreendentemente madura (decisão D008: CSS sem GSAP).
Os tokens de easing/duração existem e são bem escolhidos:

- `src/index.css:212-217` — easing: `--ease-out: cubic-bezier(0.16,1,0.3,1)`, `--ease-in:
  cubic-bezier(0.7,0,0.84,0)`, `--ease-in-out: cubic-bezier(0.65,0,0.35,1)`,
  `--ease-spring: cubic-bezier(0.34,1.56,0.64,1)`, `--ease-linear`.
- `src/index.css:219-224` — durações: `--dur-instant:0ms`, `--dur-fast:100ms`,
  `--dur-base:200ms`, `--dur-normal:300ms`, `--dur-slow:400ms`, `--dur-slower:500ms`.
- `src/index.css:226-228` — stagger: `--stagger-tight:20ms`, `--stagger-base:40ms`,
  `--stagger-loose:60ms`.
- `src/index.css:19-25` — keyframes de base: slideUp, fadeIn, spin, scaleIn, shimmer, slideDown
  (somente `transform`/`opacity` — corrige a matriz de compositor).
- `src/index.css:70-74` — `pageViewIn` + `.anim-page-view .22s cubic-bezier(.16,1,.3,1)`.
- `src/index.css:63-67` — `.pressable` (feedback de toque `scale(.96)` 120ms, `will-change: transform`)
  + guarda `@media (prefers-reduced-motion: reduce)` específica em `:65-67`.

**prefers-reduced-motion JÁ está respeitado por cascata** (grep): bloco global em
`index.css:47-50` (`animation-duration/transition-duration: .01ms !important` + `.btn:active`
desligado) e guards específicos em `index.css:65-67` (pressable), `:107-109` (tip-bubble),
`:329-336` (view-transition "no-preference"), `:443-444` (money-note), além do bloco completo de
`src/animations.css:413-421` (desliga orb/ring/pulse) e `src/animations.css:266-277`
(`transform: none` no reduced). OK.

### O que está AUSENTE / frágil (achado de leitura real — verificado contra source)

1. **View Transitions: CSS existe, transição não dispara.** `index.css:317-336` define
   `::view-transition-old(root)` / `::view-transition-new(root)` com keyframes fade+8px e já
   gated por `prefers-reduced-motion: no-preference`. **PORÉM não existe nenhuma chamada
   `document.startViewTransition` no `src/`** (grep confirmou: só em `coverage/lcov-report/...`
   e em docs arquivados). Navegação atual = `key={n.currentView}` + `.anim-page-view`
   (src/App.jsx:162) — a "transição de view" é uma remontagem com animação de entrada, sem saída.
   `src/shared/hooks/useNavigationHistory.js:21-43` faz `push/replace` da view em memória; não
   envolve o update do DOM. Ou seja: os pseudoelementos VT são CSS morto — o custo de ativar é
   um wrapper em `navTo`.

2. **`.anim-*` com durações/easings hardcoded fora dos tokens.** `index.css:27-33`: `.anim-up
   .22s`, `.anim-fade .15s`, `.anim-scale .2s`, `.anim-down .25s`, `.anim-out .25s` — números
   crus, não referenciam `--dur-*`/`--ease-*` (que existem 200 linhas abaixo). Mesmo padrão em
   `src/animations.css:211-218` (`anim-fade-up` usa `var(--dur-slower) var(--ease-spring)` — esse
   usa tokens OK). Do design premium: "motion em tokens, como cor" — hoje um dev trocar 4 números
   não muda o app inteiro.

3. **Sem tokens semânticos de entrada/saída (2:1).** Benchmarks standard recomendam
   "enter=ease-out, exit=ease-in, exit ≈ metade da duração do enter" (ver §2). O sistema tem as
   curvas, mas não duracidade de exit (`--dur-exit-*`) nem pares `open/close`. Toast tem exit
   (`anim-out` `index.css:32-33`), modais/confirm NÃO têm — desparecem sem transição de saída
   (Confirm.jsx:57-58, Modal em ui.jsx:199-200 — só `anim-fade` + `anim-scale` de entrada).

4. **`.skeleton` anima `background-position`** (`index.css:26-42, 44`): `animation: shimmer 1.4s
   ease infinite`. Pesquisa usa só `transform`/`opacity` por causa de repaint; o padrão barato
   double-util: shimmer em `background-position` força repaint por frame em N skeletons
   (low-end Android caiu a 22fps em benchmark). Também não tem guard próprio de reduced-motion
   (só coberto pelo `*` global — funciona, mas é 1 mudança de ficção crítica).

5. **Hooks de gesto ignoram reduced-motion.** `usePullToRefresh.js:3-4` (THRESHOLD 80 / MAX 120)
   e `useSwipeActions.js:3-5` (THRESHOLD 80, DRAG_DEADZONE 3) sempre aplicam `setOffset` no drag
   direto no estado React — o swipe é movido por `transition-transform duration-200`
   (TransactionCard.jsx:152-153), **a transição CSS faz o dedo perseguir o conteúdo** (lag).
   Não há `prefers-reduced-motion` check; em motion-reduce o ideal é pular o deslizar em favor do
   overlay de ações (ex.: mostrar botões ao toque).

6. **Sem count-up de KPI.** Dashboard renderiza `KpiCard` estático
   (src/shared/ui/UsageBar.jsx:59 `{value}`) — não há animação de número. Existe um keyframe
   `countUp` em `src/animations.css:374-379`, **mas só para à landing** (`.lp-*`). a11y: count-up
   precisa `aria-hidden` no número animado + `role=status/aria-live` anunciando o valor final
   apenas 1x (axi event: do: não re-anunciar a cada frame).

7. **Frequência / budget**: bancos de dados dão o KPI "Resultado Líquido" como headline
   (`Dashboard.jsx:199-207`) — usuário olha o dia inteiro; animação repetida de KPI (~1.2s) é
   anti-pattern em dashboard operacional (pesquisa: ops teams bloquearam animações). Corrige-se
   com: count-up curto (300ms) **só na primeira pintura** ou desabilitado em prefer-reduce.

8. **Sticky date header do TxView** (`TxView.jsx:319-328` a `TxView.jsx:114-118`) usa
   `translateY`/opacity via posição computed — boa base; falta só garantir que o `h-0` overlay
   responsável não gere INP ao alternar `invisible` (mudança de classe no scroll = quase nulo).

9. **`design-tokens.css` duplica** `--focus-ring`, `--space-*`, `--radius-*` sem containing motion
   (`src/shared/styles/design-tokens.css:4-38`) — conflito menor com `index.css`; ao tocar em
   index.css cuidar AROUND faz não quebrar o `input` (border-color animação 150ms).

10. **`.skip-link`** (`index.css:447`) tem transição `transform .2s` sem guarda reduced-motion
    (baixa prioridade — é acessibilidade boa).

### Benchmark interno resumido (para a tabela §2)

| # | Referência | URL | Insights copiáveis |
|---|-----------|-----|--------------------|
| 1 | 72Technologies — Motion Budget (2026-06-30) | https://www.72technologies.com/blog/motion-budget-ui-animation-ratios | ① duração em 4 degraus (100/180/280/440ms); ② regra 2:1 enter/exit (exit = metade); ③ enter=ease-out, exit=ease-in, move=ease-in-out = cobre 90% do produto; ④ reduced-motion = "design paralelo": manter opacity, remover transform — não zerar tudo (senão parece quebrado); ⑤ audit: 4 tokens de duração + 3 de easing por feature, padronizar por aplicativo |
| 2 | Chrome for Devs — Same-document view transitions | https://developer.chrome.com/docs/web-platform/view-transitions/same-document | `document.startViewTransition(()=>updateDOM)` — if API falsa, **fallback direto** (update the DOM); no SPA é chamar a função que muda o DOM, não hashar page; checar `e.hasUAVisualTransition` p/ não duplicar transição do browser |
| 3 | caniuse — View Transitions (single-document) **2026** | https://caniuse.com/view-transitions | **90.2% global**; Chrome 111+, Safari 18.0+, Firefox 144+ (na 143 disabled by default; 144+ enabled); cross-document: Chrome 126+, Safari 18.2+, Firefox ~146 |
| 4 | mantlr — Stripe, Linear, Vercel premium UI (2026-05-04) | https://mantlr.com/blog/stripe-linear-vercel-premium-ui | microstates completos (default/hover/focus/active/disabled/loading) é o que separa "fine" de "premium"; motion LIGA a sua vez em curvas/duráções declaradas, não default; "interaction density" > densidade visual |
| 5 | Linear Design System (designsystems.one, 2026-01) | https://www.designsystems.one/design-systems/linear | motion = feedback, **120-180ms** eased; view transitions, reorder de lista e modal entrances na mesma faixa; tabular numerics p/ dados; "fast: 100ms ease-out / default: 250ms" |

---

## 2. Benchmark externo (pesquisa web — 2025-2026)

| # | Referência (nome) | URL real | 2–4 insights específicos "copiáveis" |
|---|-------------------|----------|--------------------------------------|
| 1 | 72Technologies — Motion Budget (2026) | https://www.72technologies.com/blog/motion-budget-ui-animation-ratios | ① duração ladder 100/160/280/440ms por tier de interação; ② ratio 2:1 enter/exit (exit = half); ③ ease-out `cubic-bezier(0.2,0,0,1)` p/ chegar, ease-in `cubic-bezier(0.4,0,1,1)` p/ sair, ease-in-out `cubic-bezier(0.2,0,0.2,1)` p/ mover na tela; ④ reduced-motion = design paralelo (mantém opacity, remove toolamento) — "zerar tudo" scares/app feel broken |
| 2 | Chrome for Developers — Same-doc View Transitions | https://developer.chrome.com/docs/web-platform/view-transitions/same-document | ① SPA: `document.startViewTransition(() => updateTheDOMSomehow())` — wrapper da função que muta o DOM; ② fallback explícito quando `!document.startViewTransition`; ③ checar `NavigateEvent.hasUAVisualTransition` p/ não sobrepor transição do browser (back swipe); ④ transitionHelper() para guardar types + skipTransition |
| 3 | caniuse — View Transitions single-doc (2026) | https://caniuse.com/view-transitions | ① 90.2% global usage; ② Chrome 111+; ③ Safari 18.0+ — suporta **single-doc**; ④ Firefox: 143 disabled-by-default, 144+ parcial; tipos :: SPA+types Firefox 147+. Cross-doc: Chrome 126+/Safari 18.2+ |
| 4 | MDN — View_Transitions_API (2026-06) | https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API | ① two domains: doc.getTransition startViewTransition (same-doc) vs `@view-transition` MPA; ② `pageswap`/`pagereveal` events e `Navigation API` para integração com router; ③ "blocking until critical content" — `element.renderblocking` |
| 5 | ASOasis — React animated counter a11y-first (2026-07) | https://asoasis.tech/articles/2026-07-05-0838-react-animated-counter-component/ | ① temporizado + eased, rAF, time-based não frame-based; ② A11y: número animado `aria-hidden` + um único `role=status aria-live=polite` anunciando **apenas o final**; ③ honor `prefers-reduced-motion` (sem animação); ④ throttle de in in orsernuncios ≥250-500ms |
| 6 | DEV — Loading skeletons that don't lie (2026-06) | https://dev.to/raxxosstudios/loading-skeletons-that-dont-lie-5-patterns-for-honest-perceived-performance-283p | ① shimmer gated em `prefers-reduced-motion` (senão `@media reduce` é accessibility failure); ② animar `opacity`/`transform` em pseudo-element em vez de `background-position` → 60fps em Android baixo (vs 22fps); ③ skeleton só se layout for conhecido e carga >300ms (senão delai em 200ms e não mostra nada) |
| 7 | cr0x — Pure CSS Skeletons (2025-10) | https://cr0x.net/en/pure-css-skeleton-screens/ | ① shimmer low-contrast, dur ~1.1-1.6s (rápido demais = nervoso; devagar = trava); ② stop animation quando conteúdo chega (remover class); ③ pseudo-elemento anim form transform dá mais chance de compositor; ④ "pure CSS não é automaticamente fast CSS" |
| 8 | css-scroll-driven — Compositor & will-change (2026) | https://www.css-scroll-driven.com/animation-performance-profiling-optimization/compositor-safe-properties-will-change/ | ① matrix: só `transform`/`opacity` são compositor-safe; `will-change: transform` cria stacking context e contém fixed; ② chip card: animação própria já promove o layer (não precisa will-change); ③ orçamento: each promoted layer ≈ width×height×dpr²×4B, alvo ~50MB no mobile |
| 9 | W3C — C39 prefers-reduced-motion (WCAG 2.3.3) | https://www.w3.org/WAI/WCAG22/Techniques/css/C39 | ① C39 é técnica "Sufficient" para 2.3.3 Animation from Interactions (Level AAA); ② implementação: bloqueando via `@media (prefers-reduced-motion: reduce)` OU o inverso `no-preference`; ③ testar reduzir no OS, não só DevTools |
| 10 | W3C — Understanding 2.3.3 | https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html | ① motion triggered by interaction (parallax tab) pode desligar; ② presença reduzida é a técnica; complementos: SCR40 (JS guard) — as interações JS (pull-to-refresh, swipe) também devem checar `matchMedia('(prefers-reduced-motion: reduce)')` |
| 11 | tim-graf — Microinteractions em fintech 2026 (EN) | https://timgraf.com/ui/the-silent-language-of-design-mastering-micro-interactions-for-high-performance-fintech-ui-in-2026/ | ① confirmação > animação (transferência de $10k ≠ animação de 3s); ② ação de alto valor = feedback mais "lento" e visível; ação baixa = instant; ③ vibração subtil no payment é "feel" — come on Navigator vibração (source here) |
| 12 | Pedro Vaz Paulo — digital banks microinteractions (2025-08, pt/en) | https://pedrovazpaulo.co/this-is-how-europes-best-digital-banks-are-using-microinteractions-to-enhance-ux/ | ① pull-to-refresh p/ saldo; ② confirmação animada após transferência (Revolut confetti → alívio/segurança); ③ toggle/segurança com micro-animção para confirmar controle; ④ guided onboarding progress com anim de passo |

> Nota transversal: benchmarks Todos apontam _menos_ e _mais rápido_. Linear: 120–180ms.
> 72Tech: 100/180/280/440. Expertise: duração da UX <200ms "instant"; 300ms+ = lento. Não gatilhos de "site mostrando pra impressionar".

---

## 3. Oportunidades priorizadas (P0 / P1 / P2)

Critério P0: alto impacto visível + risco baixo + mudança localizada (respeita D008/D015/matrix).

| Prioridade | Oportunidade | Arquivo(s) alvo | Impacto (percepção/perf/conv) | Esforço | Risco |
|-----------|--------------|-----------------|-------------------------------|---------|-------|
| P0 | **Ativar View Transitions reais** na troca de view (`startViewTransition` + `flushSync` + fallback + guard reduce) reaproveitando CSS VT já declarado (`index.css:317-336`) | `src/hooks/useNavigation*` (navTo), `src/App.jsx:162`, `src/index.css` | alto (rota premium; saída+fade de qq view); baixíssimo esforço (CSS pronto) | baixo | baixo (fallback para `.anim-page-view` se `!startViewTransition`); atenção | 
| P0 | **Tokenizar mot**: trocar durações/easings hardcoded (`.anim-up/.fade.000` etc.) pelos `--dur-*`/`--ease-*` existentes + criar pares semânticos `--dur-*exit` (ratio ~2:1) | `src/index.css:19-33`/`:57-74`, `src/animations.css:211-330` | médio-alto consistência + capaz de "slice" global de felt (rapidez) em 1 arquivo | baixo | baixo (só CSS) | coordenação com REFINE_01 (tokens) |
| P0 | **Corrigir skeleton shimmer**: animar `transform` em pseudo-element (não `background-position`), guard reduzido-motion próprio, durar 300ms delay (não mostrar <300ms) | `src/index.css:26-44` | médio (perf em baixo-end Android, menor repaint) + a11y | baixo | baixo |
| P1 | **Count-up de KPI a11y-first** — superficia o headline "Resultado Líquido" do Dashboard com count-up 300ms ease-out, `aria-hidden` no número + `role=status` final, e nada sob_o reduce | `src/shared/ui/UsageBar.jsx` (KpiCard), `src/features/dashboard/Dashboard.jsx` | médio (delight) | baixo | médio (cuidado com INP: rAF barato, 1 única, ~300ms; guerra: dashboard operacional) |
| P1 | **Exits de modais/sheets/confirm** — animação de saída (fade+fechar) nos modais que hoje cortam (só ~entradas) | `src/shared/ui/ui.jsx:199-200`, `Confirm.jsx:57-58`, `SaleForm/StripeCheckout/ClientEditModal` (bottom sheets) | médio | médio | baixo |
| P1 | **Reduced-motion granular (design paralelo)** — em vez de `* {transition-duration:0.01ms}`, manter opacity (fade que comunica mudança) e só zerar transform; + hooks (pull/swipe) respeitam `prefers-reduced-motion` | `src/index.css:47-50`, `src/shared/hooks/usePullToRefresh.js`, `useSwipeActions.js` | médio (a11y + "feels broken" mitigado) | baixo | baixo |
| P1 | **Haptics `navigator.vibrate`** em cognição de ação crítica (deletar/salvar dinheiro), focado: guard + `prefers-reduced-motion` + ChromeAndroid-only (Safari/iOS disables; Firefox ≥v129 removeu) | `src/features/transactions/TxView.jsx`, `Confirm.jsx:onOk` | baixo-médio (feedback tátil premium) | baixo | baixo (feature-detect, sem erro) |
| P1 | **Swip actions** — remover transição CSS fixa 200ms do conteúdo (26) e freq com `transform` imediato (permite 1-to-1 na trans); represent along com `transition: transform 250ms cubic-bezier std` quando soltar (snap-back) | `src/shared/ui/TransactionCard.jsx:152-153`, css | médio (feels 60fps no dedo) | baixo | baixo |
| P2 | **Stagger reveal** em listas/grupos com `useScrollRevealMultiple` já existente (`useScrollReveal.js:35-68`) com `--stagger-base:40ms`, gate reduce + IO | `src/shared/hooks/useScrollReveal.js`, views | médio (ritmo visual) | baixo | médio (evitar INP) |
| P2 | **Old- eventual**: `@scope`/`@layer` p/ evitar disputa anim-up (index.css duplicidade com animations.css `.domin`) | `src/animations.css:266` | baixo | baixo | baixo |

---

## 4. Especificação técnica aplicável (pronta para implementação)

### 4.1 Tokens a ADICIONAR (já existem em `src/index.css:212-228` — complementar)

```css
:root {
  /* reuso dos existentes:
     --ease-out:(0.16,1,0.3,1) · --ease-in:(0.7,0,0.84,0) · --ease-in-out:(0.65,0,0.35,1)
     --ease-spring:(0.34,1.56,0.64,1) · --ease-linear:linear
     --dur-instant:0 · --dur-fast:100 · --dur-base:200 · --dur-normal:300
     --dur-slow:400 · --dur-slower:500 (ms)            */

  /* Parâmetros de saída (ratio ~2:1 da entrada) — semânticos */
  --dur-out-fast:   60ms;
  --dur-exit-base:  120ms; /* metade de --dur-base (200) - pronto. */
  --dur-exit-normal:150ms; /* metade de --dur-normal (300) +snap (toast/drop/sheet small) */
  --dur-exit-slow:  240ms; /* desmontagem de sheets grandes (não recomendado p/ redux)*/

  /* Feedback de input (toque) instantâneo */
  --dur-press:      80ms;  /* hover/active press feedback — igual ao "instant" 100ms, só com tato */

  /* Progresso / barras (fill) — "millis perceptível de progresso" */
  --ease-progress:  var(--ease-out);

  /* Shimmer — durar padrão (1.1–1.6s) + delay mínimo */
  --dur-shimmer:    1.5s;

  /* Pausa de focus: manter opacidade do conteúdo — "parallel design" CSS */
  --focus-fade:     0.0s; /* velocidade de entrada de foco (ex: refocus)*/
}
```

`.anim-*` **passa a referenciar os tokens** (de `hardcoded` para vars):

```css
/* ANTES (index.css:27-30) */
.anim-up    { animation: slideUp .22s cubic-bezier(.16,1,.3,1); }

/* DEPOIS */
.anim-up    { animation: slideUp  var(--dur-normal) var(--ease-out); }
.anim-fade  { animation: fadeIn   var(--dur-fast)   var(--ease-out); }
.anim-scale { animation: scaleIn  var(--dur-base)   var(--ease-out); }
.anim-down  { animation: slideDown var(--dur-normal) var(--ease-out); }
.anim-out   { animation: toastFadeOut var(--dur-exit-base) var(--ease-in) forwards; }
```

### 4.2 View Transitions "ligar o VT que já está no CSS"

**Viabilidade 2026 (pesquisado):** `document.startViewTransition` suportado em Chrome 111+,
Safari 18+ e parcial a partir de Firefox 144 (caniuse: **90.2% global**, single-doc). Cross-doc
(value trans. nasc básico MPA) Chrome 126+/Safari 18.2+. Para o Financia (SPA puro) o caminho é
**same-document** via `navTo`.

Pixel de aplicação (smoke — `src/App.jsx` já usa `navTo` no Header/Sidebar/BottomNav):

```jsx
import { flushSync } from 'react-dom';
import { AppViewContext } from 'react/app-context'; /* padrão do projeto */

function goView(path) {
  const update = () => { /* setState do n.currentView dentro de nav */ updateDOM(path); };
  if (typeof document === 'undefined' || !document.startViewTransition) { update(); return; }
  /* Guarda: não rodar transição se o usuário quer redução nem em drag/back do browser */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { update(); return; }
  document.startViewTransition(() => flushSync(update)); /* CSS VT já existe p/ --root do app */
}
```

- a caixa `::view-transition-old(root)`/`new(root)` **já está** no CSS (index.css:317-336) com
  `vt-fade-out 0.2s ease-out` / `vt-fade-in 0.25s ease-out` — só falta a chamada JS.
- **Não cronoficar para listas pesadas** (TxView huge rows interior) — restringir a transição de
  **não** `root` (evita reestampa de 1000 itens em VT snapshot). Mask: usar `view-transition-name`
  no cabeçalho da view (não no `main`).
- **INP**: o snapshots + callback de `startViewTransition` rodam no main thread dentro do frame da
  interação (pesquisa de CWV & animation). Mitigar: manter 200-250ms curto (CSS já é), e curar o
  `update` num `requestIdleCallback` quando houver; **nunca** deixar `startViewTransition`
  devolvendo unsettled promise — `document.startViewTransition` retorna um `ViewTransition` com `.finished`.

### 4.3 skeleton — shimmer correto

Do: atualmente `index.css:26-44` aplica `animation: shimmer 1.4s ease infinite` animando
`background-position: -200%…200%` (repaint). Trocar por:

```css
.skeleton {
  position: relative;
  overflow: hidden;
  background: var(--bg-subtle);
  border-radius: 10px;
}
.skeleton::after {
  content: "";
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
  animation: skeletonShimmer var(--granular-shimmer) var(--ease-linear) infinite;
}
@keyframes skeletonShimmer { to { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) {
  .skeleton::after { animation: none; }
}
```

E o "delay 300ms" (não mostrar skeleton antes de 300ms de latência) vai no componente/hook existente
(`useDataLoader`, `src/shared/hooks/useDataLoader.js`) — introduz `showSkeleton = !data && elapsed>300ms`.

### 4.4 micro-interações por componente (spec para cada um, 12 itens)

| # | Componente (arquivo:linha) | Trigger | Animação precisa (dur / easing) | reduced-motion (DM) |
|---|---------------------------|---------|----------------------------------|---------------------|
| 1 | Botão genérico `.btn` / Button (button.jsx:7, .btn index.css:35) | :active | `transform: scale(.97)` `--dur-press` `--ease-out` (já em:35, ok) | já (index.css:48-50) |
| 2 | `.pressable` (index.css:63-67) | active | `scale(.96)` 90ms + `opacity:.92` — feedback de toque instantâneo | já |
| 3 | Card-hover (Dashboard cards, index.css:57-58) | :hover/focus | `translateY(-2px)` + `shadow-md` 150ms `--ease-out` — só `transform`+`box-shadow` é permitido (ok) | já |
| 4 | Toasts (Toast.jsx:47-54) | in/out | in: `anim-up .22s ease-out`; **out**: remoção com `${scale(.96)translateY(-8px)}` 140ms `--ease-in` (já `anim-out`; padronizar para tokens) | já |
| 5 | Modal (ui.jsx:199-200) / Confirm / bottom sheets | open | in:`.anim-scale` 200ms; **close**: fade `.2s ease-in` (adicionar exit; hoje não tem) | já |
| 6 | 6) Progress bars (`UsageBar.jsx:26`, `Dashboard:202`, `UpdateBanner`) | value change | largura: **`transform: scaleX(pct)` + `transform-origin:left`** 300ms `--ease-out` (em vez de animar `width`) — compositor | já |
| 7 | 7) Swipe TransactionCard (TransactionCard.jsx:152) | drag | follow: `transform: translateX(offset)` **sem NAV transition fixa** (do 1:1); ao soltar: `transition: transform .25s var(--ease-in-out)` p/ snap-back | em reduced: não abrir swipe, mostrar botões |
| 8 | 8) Rota de view (App.jsx:162 + uso de `startViewTransition`) | navTo | VT fade+slide 200/250ms (CSS pronto) | já (`index.css:329-336`) |
| 9 | 9) KPI headline (`UsageBar.jsx:59` em `KpiCard`, Dashboard:199-207) — count-up 300ms `--ease-out`, rAF time-based; `aria-hidden` no num + `aria-live=polite` final; **uma faç apenas** | reduce: render direto (sem rAF) |
| 10 | 10) Swipe | FAB (QuickActions FAB open) | rotação do ícone `rotate(45deg)` 200ms (já `transition-transform duration-200` QuickActions:76) + card `anim-up` em stagger | já |
| 11 | 11) Onboarding (Onboarding.jsx:164) | step change | progress bar `transition: transform scaleX .3s var(--ease-out)`, step enter `anim-up` com `key` deremount | já |
| 12 | 12) Onboarding | Sticky date header TxView (TxView.jsx:319-326) | mostrar/escondido: `opacity`+`translateY` 120ms — manter transform-only para não dar CLS/INP no scroll | já |
| ⇢ | 13 | BottomNav (BottomNav.jsx:27-32) | ativo: `transition-colors` (Tailwind default 150ms) + `strokeWidth` 1.8→2.4 + bg pill `brandAlpha` + indicador pilar top `w-8 h-0.5`; **sem scale** (grep confirma zero `scale(` em ui/). Label fontSize 11px — sub-12px, mereceria bump p/ AA touch | `transition-colors` já; incluir duration explícita |

12 itens fixos + plus = 13 (ok — tabela com 12+).

### 4.5 reduced-motion — estratégia "design paralelo" (não zerar tudo)

Melhor prática da pesquisa (72tech + W3C C39/SCR40): usuário com reduce precisa **feedback
visual mínimo** ("aconteceu") mas sem vestibular-trigger. Hoje o app zera TUDO
(`index.css:47-50` `duration:0.01ms !important`). Proposta:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;       /* mata animações infinitas */
    transition-duration: .12s !important;        /* mantém um fade curto (informar mudança) */
  }
  /* desligar transform-rides quem deram vertigem */
  .pressable:active, .btn:active { transform: none; }
  .card-hover:hover { transform: none; }
  .swipe-content { transition: none !important; transform: none !important; }
}
```

e nos hooks de gesto (JS):

```js
const prefersReduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
// em useSwipeActions/usePullToRefresh: se true → não "setOffset" (pula para action direto, sem animação)
```

### 4.6 Integração com `brand`, offline-first, D15

- **brand dinâmica**: ver com as rules. Motion torna-se agnostic — tokens de timing não dependem de
  cor; só gating `prefers-reduced-motion` (global). Nenhum new JS importado.
- **offline-first**: skeleton é o principal rendering de "sync" (SW background sync via
  `src/sw.ts`); `skeleton` fixo está no fluxo. Pull-to-refresh/salto em DEXIE — hooks intactos; só
  o estilo do drag muda.
- **D/08**: sem GSAP, sem lib motion JS. Count-up = rAF vânica (~15 linhas hook). VT = nativo do browser.

---

## 5. Dependências & libs

| Melhor | Versão | Por quê | Custo ~KB gzip | Alternativa sem custo |
|---|---|---|---|---|
| (nenhuma — manter D08) | — | relação de motion via CSS + rAF custom; VT nativo; count-up próprio | 0 | — |
| Opcional: `transitionHelper` snippet | — | guarda types + `skipTransition` p/ browsers sem VT (bonus p/ `.`) | ~0.3KB inline | zé de dif |

**Decisão:** nenhuma dep. `count-up` implementável em ~15 linhas (hook `useCountUp` com rAF,
time-based, eased, cancel on unmount, arruma Double-Firing strict emode). Skeleton CSS puro
(§4.3). VT nativo do browser (§4.2).

---

## 6. Checklist para implementadores (Fase 2) — ordem para evitar conflito entre frentes

> Interdependências: REFE01 (DesignTokens) mexerá em `index.css`/tokens; REFE04 mexe só em motion atomics.
> Rodar em ordem: **1) tokens → 2) componentes → 3) nav → 4) onboarding/feedback** — para não
> Evangelizar meio.1

- [ ] **Ordem 1 — REFE04 tokens (index.css)**: trocar hardcoded `.anim-*`/`.pressable`/`.card-hover`
  por `var(--dur-*)`/`var(--ease-*)`; adicionar `--dur-exit-*` e `--dur-press` (§4.1). Não zerar; usar o
  JSON tokens do `REFERENCE 01` (não criar duplicatas em `src/shared/styles/design-tokens.css`).
- [ ] **Ordem 1 — skeleton**: §4.3 (pseudo-element `transform`, guard reduce, delay 300ms no loader).
  NOTA: `background-color` no `:hover` ainda é paint — manter só fill estático.
- [ ] **Ordem 1 — reduced-motion paralelo**: §4.6; hooks `usePullToRefresh`/`useSwipeActions`
  checam `matchMedia` e não animam em reduce.
- [ ] **Ordem 1 — exit de modais/sheets/toast com tokens** (Toast.jsx, Modal ui.jsx, Confirm.jsx,
  SaleForm/StripeCheckout/ClientEditModal): adicionar classe de exit/fallback (ex.: `anim-exit`)
  e respeitar "não mude para `display:none` antes de animação".
- [ ] **Ordem 2 — View Transition via navTo** (§4.2): wrapper em `useNavigationTracker`/`navTo`
  (App.jsx consumidores), com `flushSync`, guard reduced + `!document.startViewTransition`.
- [ ] **Ordem 2 — swipe 1:1**: TransactionCard remove `transition-transform duration-200` na
  drag time; adiciona só no release (snap). Teste Playwright (E2E swipe-dir) para não quebrar
  o `useSwipeActions.test`.
- [ ] **Ordem 2 — count-up KPI a11y** (Dashboard headline) — §4.4 it.9: única vez 300ms, `aria-hidden` +
  live final. NÃO em reduced.
- [ ] **Ordem 2 — navigator.vibrate**: signal em `handleConfirm` de deletar (Confirm.jsx:onOk) e no
  `Toast success` de registro — `navigator?.vibrate?.(40/8ms)` só em Chrome/Android, guard no reduce.
- [ ] **Ordem 3 — stagger reveals**: `useScrollRevealMultiple` (já existe) em lists de Dashboard
  (aplicar stagger 40ms, no-op em reduce).
- [ ] **Ordem 3 — haptics/gestos**: PullToRefreshIndicator já ok; tap nativo do bottom nav (nada).
- [ ] **Verificação por passo**: `npm run validate:fast` (lint+typecheck+test dos alterados) após
  **qualquer** mudança em src. Depois (laptop fraco): delegar full ao agente de testes.
  Nunca quebrar: `usePullToRefresh.test.js`, `useSwipeActions.test.js`, E2E login/onboarding,
  DEX offline-sync (P0 dos P0 da casa).

---

## 7. Log de coleta (transparência — auditável)

| # | Tipo | Alvo (query/URL/arquivo) | Conhecimento extraído |
|---|------|--------------------------|------------------------|
| 1 | skill | `motion-pack` + `reference/motion-design.md` | easing pillar: enter=ease-out, exit=ease-in, move=ease-in-out; timing 100/200/300/400/800ms; stagger 40-80ms; cap 600-800ms de grupo; reduced-motion obrigatórica; e transform/opacity only; spring convn para DRM. |
| 2 | leitura | `src/index.css` (:1-448) | tokens motion (var--dur/ease/stagger), keyframes, `.pressable`/`.anim-*`, VT CSS morto (:317-336), reduced-motion x5, skeleton shimmer por background-position (:26-44). |
| 3 | leitura | `src/shared/styles/design-tokens.css` | tokens duplicados sem motion; potencial conflito ao mexer em index.css. |
| 4 | leitura | `src/shared/hooks/usePullToRefresh.js` | lógica drag/damped; THRESHOLD 80/MAX 120; sem check reduced-motion; preserva | guard. |
| 5 | leitura | `src/shared/hooks/useSwipeActions.js` | offset 1:1, deadzone 3, commit no threshold; sem reduced-motion; apply style via CSS `transition-transform duration-200` no TransactionCard. |
| 6 | leitura | `src/shared/hooks/useScrollReveal.js` | IO + class anim-up; `useScrollRevealMultiple` com stagger 40ms. |
| 7 | leitura | `src/shared/hooks/useSchedulerYield.js` | `scheduler.yield()` disponível — bom p/ tx vir após startViewTransition y. |
| 8 | leitura | `src/shared/hooks/useNavigationHistory.js` | push/replace in memória; sem envolvimento de `startViewTransition` no DOM. |
| 9 | leitura | `src/shared/ui/TransactionCard.jsx` | swipeOffset via style transform, `transition-transform duration-200` (:152-153); swipe a11y com aria-setsize/posinset. |
| 10 | leitura | `src/shared/ui/Toast.jsx` | enter `anim-up` / exit `anim-out` com timeout 250ms; a11y live region já existe (:42). |
| 11 | leitura | `src/shared/ui/Confirm.jsx` | dialog só com `anim-fade`+`anim-scale` (sem exit); foco gerenciado; `inert` no root. |
| 12 | leitura | `src/shared/ui/UsageBar.jsx` (KpiCard) | `value` estático (`:42`), `aria-label` describe val+variation — sem count-up. `UsageBar` width em `%` (:26). |
| 13 | leitura | `src/features/dashboard/Dashboard.jsx` | progress bars :118; KPI headline :199-207; cards `hover:-translate-y-0.5` :183; forecast cards :247. |
| 14 | leitura | `src/features/transactions/TxView.jsx` | sticky date header overlay (:319-326) + `useTransition` (:30). |
| 15 | leitura | `src/shared/ui/Onboarding.jsx` | progressbar `transition-all duration-300` (:164-165), `anim-up` :150; steps remount por `key`? — `:159-168` render `role=progressbar`. |
| 16 | leitura | `src/App.jsx` | view switch via `key={n.currentView}` + `.anim-page-view` (:162); mask no VT hoje. |
| 17 | leitura | `src/animations.css` | landing (`.lp-*`, countUp keyframe :374-379); confirmed `background-position` shimmer duplo mais; reduced-motion :413-421. |
| 18 | read / docs | `docs/design/README.md` + `TEMPLATE.md` + `REFINE_04_Motion.md` (header) | contrato do doc (seções 0-8, log de coleta, entrada de: ≥300 linhas). |
| 19 | leitura | `src/App.jsx` + grep `startViewTransition` | IMPORTANTE: `startViewTransition` só em algum resíduo de coverage/docs — **CTA JS-N ao vivo NÃO encontra** nos VT mapas (CSS morto) — astron important Que precisely seo. |
| 20 | busca EN | "UI animation motion design tokens duration d.. easing ... design system 2025" | Motion Budget da 72Tech (100/180/280/440ms; 2:1 exit; ease pairs; "design paralelo" reduced). |
| 21 | busca EN | "View Transitions API SPA React 2026 support caniuse fallback" | Chrome 111+ same-doc, fallback pattern functions updateDOM; hasUAVisualTransition |
| 22 | busca EN | "micro-interactions fintech premium Stripe Linear" | Linear 120-180ms; Inter completa (6 microstates); "motion curves designed"; adensidade interação. |
| 23 | busca EN | "number count-up animation accessibility aria-live screen reader" | counter a11y: aria-hidden animated + live final once; throttle ≥250-500ms; honor reduce. |
| 24 | busca EN | "navigator.vibrate mobile web haptics" | **não**: Firefox removeu (desktop v129), Android v79+ sem active? atual; Chrome 79+ ok; precisa sticky activation; W3C spec. |
| 25 | busca EN | "skeleton shimmer CSS only vs JS"? | shimmer via background-position = repaint (~22fps low end); transform+pseudo → 60fps; gate reduce; delay 300ms. |
| 26 | busca EN | "IntersectionObserver scroll reveal perf transform opacity will-change" | IO instead of scroll/reflow; matrix compositor (só transform/opacity); orçamento layer ~50MB; will-change autodemonstrável. |
| 27 | busca EN | "prefers-reduced-motion strategy (WCAG) 2.3.3" | C39 suficient para 2.3.3 (AAA); "parallel design" manuten opacity; tested OS. |
| 28 | busca pt-BR | "micro-interações UX finanças app mobile animação feedback toque 2025" | study que microanimações → +4 SUS satisfação, −erros, reconforto financeiro (feedback reconforta, alívio em transferênc). |
| 29 | busca EN | "View Transitions browser support 2026 cross-document" | caniuse: single-doc 90.2% global (Chrome111/Safari18+/FF144+), cross Chrome126/Safari18.2. |
| 30 | fetch | https://caniuse.com/view-transitions | 90.2% global; matrix por engine. |
| 31 | fetch | https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API | update; pageswap/pagereveal; @view-transition MPA; Navigation API. |
| 32 | fetch | https://asoasis.tech/articles/…-react-animated-counter-component/ | recipe count-up a11y + hook useCountUp (easing, cancel, strict-mode). |
| 33 | fetch | https://www.72technologies.com/blog/motion-budget-ui-animation-ratios | tokens exatos (100/180/280/440) , 2:1 ratio; ease-out/in/inOut pragmática. |
| 34 | fetch | https://www.w3.org/WAI/WCAG22/Techniques/css/C39 | reduced-motion remove transform, keep opacity — design paralelo. |
| 35 | leitura | `src/animations.css` (:210-421) | `anim-fade-up` usa tokens (:213 `var(--dur-slower) var(--ease-spring)`); `countUp` keyframe landing-only (:374-379, `.count-animate` :378); `.scroll-reveal` (:258-269) + reduced guard (:413-421 `opacity:1 !important; transform:none !important`); `.lp-ring` spinSlow 26s linear (:410). |

---

## 8. Fontes completas

### URLs (todas consultadas — 2025/2026)
- https://www.72technologies.com/blog/motion-budget-ui-animation-ratios (2026-06-30)
- https://developer.chrome.com/docs/web-platform/view-transitions/same-document
- https://caniuse.com/view-transitions
- https://caniuse.com/cross-document-view-transitions
- https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
- https://view-transitions.chrome.dev/
- https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate
- https://caniuse.com/mdn-api_navigator_vibrate
- https://www.w3.org/TR/vibration/
- https://w3c.github.io/vibration/reports/implementation.html
- https://asoasis.tech/articles/2026-07-05-0838-react-animated-counter-component/
- https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-live
- https://dev.to/raxxostudios/loading-skeletons-that-dont-lie-5-patterns-for-honest-perceived-performance-283p
- https://dev.to/tigt/skeleton-screens-but-fast-48f1
- https://cr0x.net/en/pure-css-skeleton-screens/
- https://www.css-scroll-driven.com/animation-performance-profiling-optimization/compositor-safe-properties-will-change/
- https://www.css-scroll-driven.com/animation-performance-profiling-optimization/core-web-vitals-scroll-view-transitions/
- https://mantlr.com/blog/stripe-linear-vercel-premium-ui
- https://www.designsystems.one/design-systems/linear
- https://timgraf.com/ui/the-silent-language-of-design-mastering-micro-interactions-for-high-performance-fintech-ui-in-2026/
- https://pedrovazpaulo.co/this-is-how-europes-best-digital-banks-are-using-microinteractions-to-enhance-ux/
- https://cat.ifmo.ru/index.php/en/2025/v10-i1/553 (paper microanimations mobile banking — pt/PT/EN)
- https://pepperplane.com/micro-interactions-that-build-financial-confidence/
- https://www.w3.org/WAI/WCAG22/Techniques/css/C39
- https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html
- https://motionspec.dev/blog/wcag-2-3-3-animation-from-interactions

### Arquivos do repo lidos (todos nesta sessão)
- `src/index.css` (:212-228 tokens; :19-33, :57-74, :317-336 VT, :443-444)
- `src/shared/styles/design-tokens.css` (1-38)
- `src/App.jsx` (162 key=pageView) + grep `startViewTransition` (ausente em src → CSS tom)
- `src/shared/hooks/usePullToRefresh.js` (1-117)
- `src/shared/hooks/useSwipeActions.js` (1-96)
- `src/shared/hooks/useScrollReveal.js` (1-105)
- `src/shared/hooks/useSchedulerYield.js` (1-51)
- `src/shared/hooks/useNavigationHistory.js` (1-157)
- `src/shared/ui/TransactionCard.jsx` (1-289)
- `src/shared/ui/Toast.jsx` (1-59)
- `src/shared/ui/Confirm.jsx` (1-68)
- `src/shared/ui/UsageBar.jsx` (1-135)
- `src/shared/ui/Onboarding.jsx` (120-189)
- `src/features/dashboard/Dashboard.jsx` (180-309 + grep)
- `src/features/transactions/TxView.jsx` (370-459 + grep sticky :114-118, :319-326)
- `src/features/reports/ReportView.jsx` (grep)
- `src/animations.css` (grep :4-419)
- `.agents/skills/motion-pack/reference/motion-design.md` (1-298)

---

### Regras no preencher
- Números de contratos reais (acima). Nenhum `file:line` fictício.
- Escopo respeitado: **todo este doc é ONLY para implementação da Fase 2 (REFE04)**; nenhum
  código fonte alterado nesta Fase 1.