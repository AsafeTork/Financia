# REFINE_01 — Design Tokens & Fundações

> Frente 1 da Fase 1 (pesquisa) do Design Refinement. Documento preenchido conforme
> `docs/design/TEMPLATE.md` (seções 0–8). Todas as afirmações têm fonte real:
> `arquivo:linha` (arquivo lido nesta sessão) ou URL (acessada nesta sessão).
> Regra de ouro: nada de memória de treinamento.

## 0. Ficha do agente

```yaml
frente: Design tokens & fundações (tokens, tipografia, cor, elevação, motion, dark mode, brand dinâmica)
agente_data: 2026-08-08
buscas_web: 10
urls_fetched: 9
repo_arquivos_lidos: 10
doc_linhas: 485
skills_usadas: design-dna-pack
```

---

## 1. Diagnóstico atual (ESTADO REAL, com evidência)

### 1.1 Onde vivem os tokens hoje

Os tokens estão espalhados em **duas fontes raiz que CONFLITAM**, o que fere a
intenção da D007 (CSS vars = fonte única):

1. `src/shared/styles/design-tokens.css` (76 linhas) — blocos `:root` com
   `--focus-ring`, `--font-size-*`, `--space-*`, `--radius-*` e **sombras pretas**:
   - design-tokens.css:35 `--shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);`
   - design-tokens.css:36 `--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);`
   - design-tokens.css:37 `--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);`
2. `src/index.css` — o bloco `:root` principal (linhas 122–256) usa **o mesmo nome
   de token com valores DIFERENTES**: index.css:204 `--shadow-sm: 0 1px 2px rgba(0,47,89,0.04), 0 1px 3px rgba(0,47,89,0.03);`

**Conflito real**: `--shadow-sm/md/lg` têm definições duplicadas e divergentes entre
os dois arquivos. O vencedor depende da ordem de importação (`index.css:1` importa o
primeiro arquivo) — um "segredo sujo" que o diagnóstico de tokens deve resolver antes
de qualquer outra coisa.

### 1.2 Cores: hex e HSL, nunca OKLCH

- Paleta core em hex: `--navy: #002f59` (index.css:124), `--teal: #1a6b5c` (125),
  `--green: #3bbfa0` (126), `--light-teal: #6ec6c8` (127), `--off-white: #f5f5f0` (128).
- Semânticos em hex: `--bg-page`, `--bg-card`, `--bg-subtle`, `--text-main`,
  `--text-muted` etc. (index.css:131–140).
- **Confusão semântica**: `--success` recebeu valor AA `#15803d` (index.css:151) mas
  a identidade ainda declara `--success` como `#3BBFA0` (VISUAL_IDENTITY.md:40) — o
  mesmo papel com dois valores em dois lugares.
- Status: `--success: #15803d; --warning: #f59e0b; --danger: #ef4444; --info: #3b82f6`
  (index.css:151–154).
- Medido nesta sessão: **83 arquivos `src/` com 1095 ocorrências de hex hardcoded** e
  **0 arquivos com `oklch`** (`grep -rE '#[0-9a-fA-F]{3,8}' src` e `grep -rl oklch src`).
  Isso contraria a D007 (hex hardcoded = anti-pattern) e mantém o risco de divergência
  por plano/white-label.

### 1.3 O bloco shadcn/ui duplicado em HSL

- `index.css:237–255` define um segundo vocabulário de tokens em HSL (`--background`,
  `--foreground`, `--card`, `--primary` — ex.: `--primary: 208 100% 17%`), só para os
  componentes `src/shared/ui/ui.jsx` consumirem classes `bg-primary`,
  `text-foreground`, `text-destructive` etc. (ui.jsx:15–18).
- Resultado: o mesmo tema é mantido em **dois formatos paralelos** (hex semântico +
  HSL shadcn), dobrando a manutenção e criando divergência.

### 1.4 Dark mode

- `[data-theme="dark"]` (index.css:258–291) redefine as cores core, mas **força uma
  bateria de `!important` para caçar classes utility tailwind hardcoded**:
  - `[data-theme="dark"] .bg-white { background-color: #13243d !important }`
    (index.css:294), `.bg-gray-50`/`.bg-gray-100` (295–296), `.text-gray-900…400`
    (300–305), `.hover\:bg-gray-50`/`.hover\:bg-gray-100` (313–314) e o shadow
    override (315).
- Qualquer classe não listada (ex.: `bg-neutral-*`, `ring-*`) fica com cor incorreta
  no dark → o tema depende de uma lista exaustiva, não do token.
- `--shadow-*` no dark são **pretos puros** `rgba(0,0,0,0.30/0.35/0.45)`
  (index.css:269–271) — diferente do tom navy-tinted do light (index.css:204–207).

### 1.5 Sombras / elevação

- `--shadow-sm/md/lg/xl` (index.css:204–207) existem, mas **não há elevação semântica
  por papel** (surface/hover/overlay/modal) nem tokens de estado: o hover de card
  usa `box-shadow` hardcoded `rgba(0,0,0,0.06)` (index.css:58).
- Os blocos `[data-plan]` rescopiam `--shadow-*` de novo por plano (index.css:313–362),
  triplicando a manutenção.

### 1.6 Tipografia

- Base sólida: `--font-heading: 'Montserrat'`, `--font-body: 'Inter'`,
  `--font-mono: 'JetBrains Mono'` (index.css:157–159); escala em clamp
  (index.css:161–170); `font-display`/`font-heading` (index.css:10–12) e `.tabular`
  (index.css:15).
- Porém: a escala é manual e hiper-específica (ex.: `--text-xs-tight: 0.6875rem`,
  index.css:170) e **a mesma escala existe em 2 lugares** (docs `VISUAL_IDENTITY.md:§3.2`
  e código index.css:161–170) com leve divergência.
- `--text-display: clamp(2.5rem, 5vw, 4rem)` (index.css:161) já é fluído, mas os steps
  não seguem um **ratio modular único** documentado (h2 1.75 / h1 3 por aí vai).

### 1.7 Motion

- Tokens de easing + duração já existem: `--ease-out`, `--ease-in`, `--ease-in-out`,
  `--ease-spring`, `--ease-linear` (index.css:213–217), `--dur-*` (219–224),
  `--stagger-*` (226–228).
- **Falta a camada semântica**: não há `--motion-enter`, `--motion-exit` etc.
  Cada componente decide o par duração/easing na mão — `.card-hover` (index.css:57–58),
  `.pressable` (index.css:63–64), e os keyframes `.anim-up/.anim-scale` (index.css:27–30)
  usam durações hardcoded (ex.: `.anim-up .22s`, index.css:27).
- `prefers-reduced-motion` já é respeitado num bloco global (index.css:47–50, 65–67).

### 1.8 Brand dinâmica (white-label)

- `--brand`, `--brand-secondary`, `--brand-soft`, `--brand-accent-soft` e
  `--brand-grad` são setados em `collectTokensFromBrand` (useBrandAppearance.js:96–108):
  `--brand-soft` via `brandAlpha(primary, 0.08)` (utils.js:7–11 — hex→rgba manual).
- Derivada de cores: `deriveCores(primary)` (utils.js:113–118) cria `secondary` (mesma
  hue, mais claro) e `accent` (hue + 150° na engine HSL/hex).
- Guarda de contraste já existe: `adjustForContrast` (useBrandAppearance.js:22–36) e
  `getContrastRatio` (:14–20); contrato `--brand-safe` (:110–114).
- **O que falta é portabilidade para o CSS**: a derivação vive em JS (hex/hsl→hex),
  presa ao sRGB e sem P3; não é `color-mix()` nem OKLCH. `--brand-soft` é um `rgba`
  estático, sem derivadas hover/grad/border na cascata.

### Resumo do diagnóstico

- Duas fontes de tokens divergentes (design-tokens.css vs index.css) → conflito de
  `--shadow-*`.
- Hex em 1095 ocorrências / 83 arquivos; zero OKLCH.
- Dois vocabulários de cor (hex semântico + bloco HSL "shadcn") na mesma decisão.
- Dark mode amarrado a overrides `!important` de utilities (index.css:293–315).
- Sem escala de neutros cromáticos definida.
- Motion sem camada semântica enter/exit.
- Sombras hardcoded por plano (index.css:313–362).
- Mensagem de marca derivada em JS (hex + hue 150°), sem OKLCH/color-mix.

---

## 2. Benchmark externo (pesquisa web obrigatória)

Regra: mínimo 5 linhas; fontes 2025–2026, inglês + pt-BR.

| # | Referência (nome) | URL real | 2–4 insights específicos "copiáveis" |
|---|-------------------|----------|--------------------------------------|
| 1 | Evil Martians — "OKLCH in CSS" | https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl | (a) OKLCH tem leveza perceptual: `L` igual = brilho sentido igual entre hues (resolvendo o problema do HSL onde `hsl(120 60% 50%)` vs `hsl(240 60% 50%)` têm pesos visuais diferentes); (b) permite gerar paleta por fórmula — um hue de partida → família inteira consistente em L/C; (c) o gamut mapping especificado pela CSS-WG usa OKLCH; (d) troca hex/rgb/hsl → oklch funciona em qualquer browser moderno. |
| 2 | Tailwind CSS — Colors (sobreamos OKLCH v4) | https://tailwindcss.com/docs/colors | (a) Tailwind v4 (jan 2025) **re-derivou toda a paleta em OKLCH** para gamut mais largo e espaçamento perceptual uniforme — a indústria padronizou OKLCH; (b) 5 famílias neutras (slate/cool, gray/true, zinc/warm, neutral/true, stone/warm) com 11 steps; (c) valores prontos de referência: `slate-500: oklch(55.4% 0.046 257.417)`; (d) nomenclatura 50…950 como convenção. |
| 3 | shadcn/ui — Theming (CSS vars) | https://ui.shadcn.com/docs/theming | (a) tokens semânticos `background/foreground/primary/muted/border/input/ring` vivem em `:root` e `.dark`; componente **nunca referencia primitivo**; (b) `--radius` é um único token-base que deriva a escala (`calc(var(--radius) * 0.6…)` para sm/md/lg/xl); (c) dark mode reaproveita os mesmos tokens num bloco escuro — equivalente ao nosso `[data-theme]`; (d) exposição ao Tailwind via `@theme inline` (na nossa v3.4: `theme.extend.colors.brand: 'var(--brand)'`). |
| 4 | CSS Architecture — Multi-Brand White-Label tokens | https://www.css-architecture.com/multi-brand-theming-white-label-token-architecture/ | (a) modelo em 4 camadas: **Base Primitivas** → **Brand** (`[data-brand]` só define semânticos) → **Tenant** (`[data-tenant]` = delta) → **Componentes** (só tokens semânticos, nunca primitivos); (b) "tema contract" pequeno e versionado: cada nome exposto é um nome que você não pode renomear; (c) `@layer` para ordem sem `!important`; (d) citação direta: "uma referência descuidada a primitivo quebra a superfície da marca". |
| 5 | Material Design — Elevation & Shadows | https://m2.material.io/design/environment/elevation.html | (a) todo elemento tem *resting elevation* + *dynamic elevation offsets* (hover/focus/pressed) com a mesma distância para todos os componentes; (b) a sombra é o único cue de profundidade — mais elevação = **sombra mais suave e maior**; (c) elevação é relativa ao parent (filho herda); (d) elevações de repouso consistentes entre apps. |
| 6 | Master CSS — Elevation namespace | https://rc.css.master.co/guide/elevation | (a) tokens semânticos por papel: `--shadow-xs…2xl` mapeiam papéis (separação → surface → hover/lift → detached overlay → workflow → blocking); (b) "o papel de cada token deve ser estável entre modos" — mesma token, receitas diferentes light/dark; (c) "mais sombra não cria mais hierarquia se tudo competir por profundidade" — use o menor token que esclareça a relação. |
| 7 | web.dev — CSS color-scheme & light-dark() | https://web.dev/articles/light-dark | (a) `light-dark(light, dark)` resolve pelo em `color-scheme` (Baseline desde 2024-05-13: Chrome 123+, Firefox 120+, Safari 17.5+ — caniuse confirma); (b) `color-scheme: light dark` em `:root` + `@media (prefers-color-scheme: dark)` como fallback obrigatório; (c) cuidado: não usar `@property` para registrar tokens que precisam re-resolver `light-dark()` por subtree. |
| 8 | ColorArchive — Neutral Color Palettes | https://colorarchive.org/guides/neutral-color-palette-guide/ | (a) **~80% do peso visual de uma UI vem dos neutros**, não do accent; (b) "truque gray" puro quase nunca parece neutro — Apple/Material/Tailwind usam **levemente chromáticos** (warm ou cool); (c) a temperatura dos neutros deve seguir o ACCENT (accent quente → neutral quente; accent frio → neutral frio ou neutro); (d) 9–11 steps: 1–2 near-white p/ fundo, mid-light p/ surfaces/borders, mid-range p/ texto secundário, dark p/ texto principal. |
| 9 | Utopia — Fluid Type Scale | https://u.toia.fyi/type/calculator/ | (a) modular scale 1.2/1.25 com `clamp()` = 1 linha por step (`--step-2: clamp(1.62rem, 1.4837rem + 0.6057vw, 1.9531rem)`); (b) em rem → acessibilidade; (c) fluidez otimizada no range 320–1280px (slope curto demais congela o texto); (d) output CSS pronto. |
| 10 | Carmen Ansio — Motion Tokens | https://www.carmenansio.com/articles/motion-tokens-design-systems/ | (a) motion em 2 camadas: **primitivos** (duração/curvas) → **semânticos** (`--motion-enter`, `--motion-exit`, `--motion-feedback`); consumidor usa o semântico; (b) **enter = ease-out (desacelera), exit = ease-in (acelera), exit ≈ 60% da duração do enter**; (c) spring = recompensa (sucesso), standard = negativo, instant = estado de sistema; (d) `prefers-reduced-motion` no nível `:root` zera toda a escala (0ms) numa linha. |
| 11 | ColorFYI (pt-BR) — Cor em Design Systems | https://colorfyi.com/pt/blog/color-in-design-systems-at-scale/ | (a) **3 camadas**: escala de cor → tokens de função → tokens de componente; componentes nunca usam a escala (Shopify/Google/Primer); (b) GitHub Primer gera **todos os modos de cor** (light/dark/contrast) a partir da MESMA schema semântica — não por sobreposições CSS; (c) **verificação de contraste como build step**, não revisão manual; (d) tokens funcionais com contrato (o que o token promete: sempre bg neutro + AA vs text). |

> Nota: buscas incluem uma em pt-BR (query 11 — "design tokens CSS variáveis dark mode
> acessibilidade contraste 2025 boas práticas") retornando ColorFYI e KyAccessíveis.

---

## 3. Oportunidades priorizadas (P0 / P1 / P2)

Critério P0: alto impacto visível + risco baixo + mudança localizada.

| Prioridade | Oportunidade | Arquivo(s) alvo | Impacto (percepção/perf/conversão) | Esforço | Risco |
|-----------|-------------------------------------------------------------|---------------------------|----------------------------------------------|--------|-------|
| P0 | A — Unificar a fonte de tokens: resolver o conflito `--shadow-*` (design-tokens.css:35–37 vs index.css:204–207) deixando **uma única origem** (provável: mover tudo para `index.css`:1 `@import` mantido só para `--focus-ring` e `--card-padding`) | `src/index.css`, `src/shared/styles/design-tokens.css` | alto (consistência light/dark/plan) | baixo | baixo |
| P0 | B — **Neutros cromáticos em OKLCH** (escala 50–950) ancorados na marca; mapear `--surface-*`, `--text-*`, `--border-*`; caminho para trocar 1095 hex inline nos consumidores | `src/index.css` | alto (80% do peso visual; percepção premium) | médio | médio (limitado a substituição por token) |
| P0 | C — **Derivadas da `--brand` com `color-mix()`** (`--brand-soft/hover/pressed/tinted/border`) em vez de `brandAlpha` JS com `rgba`; manter guarda de contraste `--brand-safe` | `src/shared/hooks/useBrandAppearance.js` + `src/index.css` | alto (WCAG + white-label vivos) | médio | médio |
| P0 | D — **Focus ring em tokens** (`--focus-ring-width/color/offset` + two-tone para fundos variados) alinhado a WCAG 2.4.13 (≥2px, ≥3:1), aplicado via `:focus-visible` com `outline` (não `box-shadow`) | `src/index.css` (focus 187–190) + `design-tokens.css:4–6` + `src/shared/ui/*` | alto (a11y; P1 já fechado, não regressar) | baixo | baixo |
| P1 | E — **Camada semântica de motion** (`--motion-enter/exit/feedback/page/spring` sobre primitivos existentes, index.css:213–235) e unificar `anim-*` (index.css:27–30) nos tokens | `src/index.css` + componentes `ui` | médio (consistência; percepção premium) | baixo | baixo |
| P1 | F — **Elevação por papel semântico** (`--shadow-surface/hover/overlay/modal`) + variantes dark com sombra fria/escura | `src/index.css` (204–207) + `VISUAL_IDENTITY.md` §6 | médio (profundidade correta) | baixo | baixo |
| P1 | G — **Corrigir duplicidades de nomenclatura** (`--success` vs `--green`: VISUAL_IDENTITY.md:43 vs index.css:151; manter `--success` AA como Oficial) e unificar o bloco shadcn HSL (index.css:237–255) em tokens OKLCH | `VISUAL_IDENTITY.md` + `src/index.css` | médio (semáforo semântico claro) | baixo | baixo |
| P2 | H — **`--radius` como token-base** com derivadas `calc` (padrão shadcn) substituindo `--radius-sm…full` soltos (index.css:195–201) | `src/index.css` | médio | médio | médio |
| P2 | I — Plano-variants (`[data-plan]` index.css:313–362) migrados para tokens semânticos + `color-mix` para "glow" | `src/index.css` + `src/features/plans/*` | médio (pricing premium) | médio | médio |
| P2 | J — **Contraste como build step** (lição Shopify/Primer): script no pre-commit (estilo do `scripts/anti-pattern-check.cjs`) validando combos WCAG 4.5/3.0 nos tokens | repo root (`scripts/`) + pre-commit | médio-alto (a11y estrutural) | alto | baixo |

---

## 4. Especificação técnica aplicável (pronta para implementação)

> Base: OKLCH nativo (2023+, Chrome 111+), `color-mix()` (2023+), `light-dark()`
> (Baseline 2024-05-13). Sobre PWA/Vite 2025 não há incompatibilidade.

### 4.1 Neutros cromáticos em OKLCH (P0-B)

Todos os neutros dividem a hue da marca (`--h-brand`). Chroma baixo (C≈0.01–0.02) —
"chromatic neutral" (ColorProxy insight) mantém temperatura da marca:

```css
:root {
  --hue:            206;                         /* hue navy #002F59 em OKLCH */
  --n-50:  oklch(0.985 0.004 var(--hue));        /* page canvas   */
  --n-100: oklch(0.965 0.006 var(--hue));        /* surface       */
  --n-200: oklch(0.93  0.010 var(--hue));        /* border        */
  --n-600: oklch(0.51  0.04  var(--hue));        /* text secundário */
  --n-800: oklch(0.29  0.05  var(--hue));        /* text primário */
  --n-950: oklch(0.14  0.04  var(--hue));        /* near-black    */

  /* mapeamento semântico (camada de função) */
  --bg-page:    var(--n-50);
  --bg-card:    oklch(1 0 0);
  --bg-subtle:  var(--n-100);
  --border:     var(--n-200);
  --text-main:  var(--n-800);
  --text-sub:   var(--n-600);
}
[data-theme="dark"] {
  --bg-page: oklch(0.13 0.02 var(--hue));
  --bg-card: oklch(0.18 0.02 var(--hue));
  --border:  oklch(0.26 0.02 var(--hue));
  --text-main: var(--n-50);
  --text-sub:  var(--n-100);
}
```

Sequência de deploy: com o core set, a maioria dos overrides `!important` do dark
(index.css:293–315) deixa de ser necessária antes de trocar cada `text-gray-*` por
token de surface/text — faz-se utility a utility (fase P2) com teste por passo.

### 4.2 Derivadas da marca com `color-mix()` (P0-C)

Substituir `--brand-soft: rgba(r,g,b,0.08)` (JS `brandAlpha`, useBrandAppearance.js:103)
por derivadas CSS puras que reagem ao runtime `--brand`:

```css
:root {
  --brand:           #002f59;   /* *valor padrão; runtime sobrescreve */
  --brand-soft:      color-mix(in srgb, var(--brand) 8%,  transparent);
  --brand-tinted:    color-mix(in srgb, var(--brand) 12%, var(--bg-page));
  --brand-hover:     color-mix(in srgb, var(--brand) 100%, black 8%);
  --brand-pressed:   color-mix(in srgb, var(--brand) 100%, black 16%);
  --brand-border:    color-mix(in srgb, var(--brand) 60%, white);
  --brand-grad:      linear-gradient(135deg, var(--brand) 0%, var(--brand-accent) 100%);
}
```

- Suporte: `color-mix()` é Baseline desde 2023 (MDN; caniuse: Chrome 111+, Firefox
  113+, Safari 16.2+). Fallback opcional: `@supports not (background: color-mix(in srgb, red 50%, white)) { ... }`.
- Como o runtime já seta `--brand` via `useBrandAppearance.js` (collectRS, :96),
  os derivados passam a resolver **naquele momento**, sem JS extra.
- Guarda de contraste: continua valendo o `--brand-safe`/`adjustForContrast`
  (useBrandAppearance.js:110–114, 22–36) para o caso de primary claro demais.

### 4.3 Tipografia fluida — ratio 1.25 (P1; alinhado ao Utopia)

Manter `clamp()`, agora com escala **baseada em ratio** e aliases para não quebrar o
app:

```css
:root {
  --fs-0: 1rem;                                                  /* base */
  --fs-1: clamp(1rem, 0.94rem + 0.21vw, 1.125rem);               /* body ↑ (1.125) */
  --fs-2: clamp(1.125rem, 1rem + 0.42vw, 1.375rem);              /* h4 (1.22×) */
  --fs-3: clamp(1.375rem, 1.19rem + 0.63vw, 1.75rem);            /* h3 (1.27×) */
  --fs-4: clamp(1.75rem, 1.31rem + 1.38vw, 2.5rem);              /* h1 (1.43× → 1.25 paper) */
  --fs-5: clamp(2.5rem, 1.5rem + 5vw, 4rem);                     /* display — equiv ao --text-display */

  /* aliases para compatibilidade (dezenas de chamadas no app) */
  --text-display: var(--fs-5);
  --text-h1: var(--fs-4);
  --text-h2: clamp(1.5rem, 1.19rem + 0.63vw, 1.75rem);
  --text-h3: var(--fs-3);
  --text-h4: var(--fs-2);
  --text-lg: var(--fs-1);
  --text-sm: 0.875rem;
  --text-xs: 0.75rem;
}
```

Ferramenta de geração: Utopia Calculator (fonte #9). Manter `--text-xs-tight` como
alias isolado (badges) sem compor com o resto.

### 4.4 Elevação semântica (P1-F)

Ambos!paper: menor token que resolva a relação + sombra mais suave quanto maior a
elevação (Material data):

```css
:root {
  --shadow-flat:     none;
  --shadow-surface:  0 1px 2px color-mix(in srgb, var(--brand-tinted) 30%, transparent);
  --shadow-hover:    0 4px 16px color-mix(in srgb, var(--brand-tinted) 45%, transparent);
  --shadow-overlay:  0 8px 30px color-mix(in srgb, var(--brand-tinted) 55%, transparent);
  --shadow-modal:    0 16px 48px color-mix(in srgb, var(--brand-tinted) 65%, transparent),
                     0 2px 8px var(--brand-tinted);
}
[data-theme="dark"] {
  --shadow-surface: 0 1px 2px rgba(0,0,0,0.4);
  --shadow-hover:   0 4px 16px rgba(0,0,0,0.5);
  --shadow-overlay: 0 8px 30px rgba(0,0,0,0.6);
  --shadow-modal:   0 16px 48px rgba(0,0,0,0.65), 0 2px 8px rgba(0,0,0,0.5);
}
```

`--shadow-sm/md/lg/xl` continuam como aliases (`--shadow-sm: var(--shadow-surface)`)
para não partir as centenas de referências existentes. `.card-hover` passa a escalar
para `--shadow-hover` com `transform: translateY(-1px)`.

### 4.5 Motion semântica (P1-E)

```css
:root {
  --motion-enter:    var(--dur-base) var(--ease-out);      /* chegada: desacelera */
  --motion-exit:     var(--dur-fast) var(--ease-in);       /* saída: acelera, ~60% do enter */
  --motion-feedback: var(--dur-instant) var(--ease-out);
  --motion-page:     var(--dur-normal) var(--ease-out);
  --motion-spring:   var(--dur-base) var(--ease-spring);   /* positivo: sucesso (nunca erro) */
}
@media (prefers-reduced-motion: reduce) {
  :root { --dur-instant: 0ms; --dur-fast: 0ms; --dur-base: 0ms; --dur-normal: 0ms; }
}
```

`.anim-up/.anim-entry` (index.css:27–30) passam a usar `var(--motion-enter)` —
elimina durações hardcoded nos keyframes.

### 4.6 Focus ring (P0-D) e contraste (P2-J)

```css
:root {
  --focus-ring-width:  3px;                       /* já usado (index.css:188) */
  --focus-ring-offset: 2px;
  --focus-ring-color:  var(--brand);
  --focus-ring-destructive: var(--danger);          /* estado de erro */
  --focus-ring-surface:    var(--bg-page);          /* 2ª típica para two-tone */
}
```

WCAG 2.4.13 (Focus Appearance): ≥ 2px, ≥ 3:1 contra o estado de não-foco — valide no
build. Unificar `:focus-visible` com `outline` (amber JS: outline offects não causa
layout e não é clipado por `overflow:hidden`).

P2-J: script `scripts/wcag-contrast-check.cjs` (estilo do `anti-pattern-check.cjs`)
valida combos de pares usados (ex.: `--brand`↔branco ≥4.5, `--brand-soft`↔`--bg-card`
≥4.5, `--brand-safe` ≥4.5).

### 4.7 Interação com `--brand` e offline-first

- **Brand**: tudo acima depende de `var(--brand)`. O runtime de `useBrandAppearance.js`
  (collectBrandTokens, useBrandAppearance.js:96–108) continua setando `--brand`; com
  `color-mix()` os variantes (soft/hover/grad) resolvem na hora, sem JS extra. `--brand-soft`
  deixa de ser gravado como `rgba()` (brandAlpha) e vira CSS puro.
- **Offline-first**: os tokens são estáticos (CSS); não tocam em Dexie/sync. A única
  dependência runtime é o brand lido do DB local para setar `--brand` — caminho já
  existente, baixo risco. Nada de CSS runtime/build extra.

### 4.8 Estados mínimos por componente

- hover → `--brand-hover`, `--shadow-hover`; pressed → `--brand-pressed`
  (resp. transform: scale(.97)); focus → tokens de ring; disabled → `opacity:.5`;
  loading → skeleton (já existe animação/design-tokens.css); dark/light → tokens
  `--n-*` na camada semântica (nunca hex inline).

---

## 5. Dependências & libs (se aplicável)

| Lib/feature | Versão (pesquisada) | Por quê | Custo ~KB gzip | Alternativa sem custo |
|------------|---------------------|---------|----------------|----------------------|
| `color-mix()` nativo CSS | Baseline 2023 | derivar brand hover/tint/grad sem JS; reage ao `--brand` runtime | 0 (nativo) | JS `brandAlpha`/`adjustForContrast` atual (mantém só para guarda) |
| `oklch()` nativo CSS | CSS Color 4 — Baseline 2023 (Chrome 111+, FF 113+, Safari 15.4+) | neutros/escala uniforme perceptual | 0 (nativo) | permanecer em hex (perde acessibilidade) |
| `light-dark()` | Baseline 2024-05-13 | dark mode por tokens com fallback em `@media` | 0 (opcional) | bloco `[data-theme="dark"]` existente (fonte principal) |
| Tailwind v4 (migração, P3) | v4 jan 2025 (Dowindow in OKLCH) | `@theme inline`; porém mudança ampla — fora do escopo desta frente | +12KB? (incerto) | Tailwind 3.4 atual com `extend.colors` via CSS vars |

**Libraries de cor adicionadas: nenhuma.** `@tanstack/react-query`, Dexie, Supabase
ficam intocados (D001/D006, AGENTS "bundle enxuto").

---

## 6. Checklist dos 10 implementadores (Fase 2)

Ordem de execução para evitar conflito entre instantes — Frente 1 é a BASE:

1. **Frente 1 executa primeiro** (todos os changes em `index.css` + `design-tokens.css`).
   As outras frentes leem o token — não editem `index.css` em paralelo sem coordenação.
2. Corrigir o conflito de fontes (P0-A): centralizar em `index.css`; `design-tokens.css`
   fica só para `--focus-ring`/`--card-padding` até validação.
3. Introduzir em `:root` os `--n-*` (neutros OKLCH) + mapeamento semântico (4.1).
4. Migrar 2–3 consumidores grandes (Landing, Login, Dashboard) de hex inline para
   `var(--brand-soft)`, `var(--n-*)`, `var(--shadow-*)`. Tratamento NÃO em modo
   big-bang: rodar (lint/typecheck/test + visual) por passo.
5. `color-mix()` para `--brand-*` derivados; remover `brandAlpha` do
   `collectTokensFromBrand`; preservar guardas de contraste.
6. Havendo localizado `:focus-visible` para outline token (P0-D) e eliminar
   `outline: none` restante.
7. Motion semântica (4.5) e unificar `anim-*`.
8. Elevação por papel (4.4) mantendo aliases `shadow-sm/md/lg/xl`.
9. Slim do `[data-theme="dark"] !important` a cada 2 passos, trocando utilities por
   tokens quando a nova camada `--n-*` cobre them.
10. Sincronizar `VISUAL_IDENTITY.md` (§2–§4) com os valores finais de OKLCH e incluir
    nota de migração p/ o coordinator.
11. **Não quebrar**: offline-first (Dexie/sync); contrato `--brand-safe` e guard de
    contraste; WCAG P1 já fechado (45%→100%); `prefers-reduced-motion` existente;
    dark mode por `[data-theme]` toggle.

**Validação leve por passo** (máquina fraca): `npm run typecheck:changed`,
`npm run lint:changed`, `npm run test:changed`; sanity visual com `npm run dev` +
Lighthouse (LCP/CLS). No fim da frente: `npm run validate:full` (ou CI.

---

## 7. Log de coleta (transparência — auditável)

| # | Tipo | Alvo (query/URL/arquivo) | Conhecimento extraído |
|---|------|--------------------------|------------------------|
| 1 | leitura | `docs/design/README.md` (48 linhas) | Protocolo de dedicação (mín. 10 buscas, 5 fetches, 5 arquivos, log, métricas) |
| 2 | leitura | `docs/design/TEMPLATE.md` (74 linhas) | Estrutura seção 0–8 obrigatória + ficha YAML |
| 3 | leitura | `src/index.css` (448 linhas) | Todos os tokens atuais com file:line (hex, focus, shadow, motion, dark) |
| 4 | leitura | `src/shared/styles/design-tokens.css` (76 linhas) | Conflito `--shadow-*`; foco; button/input base |
| 5 | leitura | `VISUAL_IDENTITY.md` (434 linhas) | Identidade oficial; plan variants; contradição `--success` |
| 6 | leitura | `src/shared/hooks/useBrandAppearance.js` (393 linhas) | Runtime da marca: collect, brandAlpha, guards de contraste, white-label |
| 7 | leitura | `src/lib/utils.js` (217 linhas) | `deriveCores` (+150°), `brandAlpha` rgba, `readableBrand`/`onColor` |
| 8 | leitura | `src/shared/ui/ui.jsx` (grep) | Uso dos tokens em componentes UI |
| 9 | leitura | `docs/UX/UX_UI_textos_AUDIT_REPORT.md` (grep) | P1 fechado; pontos de contraste dinâmico/brand & dark charts |
| 10 | leitura | `package.json` (118 linhas) | Sem lib de cor; Tailwind 3.4; radix-label; cva/clsx/tailwind-merge |
| 11 | busca | "OKLCH color space design tokens 2025" | Vantagens OKLCH (L perceptual, P8)?/gamut) f; Evil Martians + Snip |
| 12 | busca | "semantic tokens architecture 2025 Tailwind v4 shadcn" | shadcn tokens `background/foreground/…` + `@theme inline`; `--radius` derivado |
| 13 | busca | "fluid typography scale modular ratio clamp()" | resultado Utopia (`--step-*`); clamp em rem; slope 320–1280 |
| 14 | busca | "dark mode dual tokens light-dark()" | `light-dark()` Baseline 2024; `color-scheme`; fallback `prefers-color-scheme` |
| 15 | busca | "elevation shadow layering design system rules" | Material resting+elevation offsets; Master CSS papéis de elevação |
| 16 | busca | "motion tokens design systems duration easing" | primitivos→semânticos; enter/exit; spring=sucesso; reduced 0ms |
| 17 | busca | "focus-visible ring design 3px contrast WCAG 2.2" | 2.4.13 (≥2px, ≥3:1) outline vs box-shadow; two-tone |
| 18 | busca | "white label saas theming derived brand tokens" | css-architecture 4 camadas; theme contract versionado; @layer |
| 19 | busca | "neutral palette design systems gray slate 2025" | Tailwind v4 rederiva OKLCH; neutrol 80% do peso; temperatura |
| 20 | busca | pt-BR "design tokens dark mode acessibilidade contraste 2025" | ColorFYI (3 camadas + contraste em build) e KyVG tokens acessíveis |
| 21 | fetch | https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl | OKLCH parity happle; gamut; paleta por fórmula |
| 22 | fetch | https://ui.shadcn.com/docs/theming | lista de tokens semânticos; `--radius` derivado |
| 23 | fetch | https://www.css-architecture.com/multi-brand-theming-white-label-token-architecture/ | 4 camadas; contract; @layer; tenant delta |
| 24 | fetch | https://www.carmenansio.com/articles/motion-tokens-design-systems/ | camadas primitivas→semânticas; enter/exit 60% |
| 25 | fetch | https://colorarchive.org/guides/neutral-color-palette-guide/ | neutros cromáticos; temperatura por accent; 9–11 steps |
| 26 | fetch | https://www.utopia.fyi/ | fluid type/space scales sem breakpoints — definir 2 escalas (min/max) e interpolar por viewport |
| 27 | fetch | https://oklch.com/ | OKLCH picker/converter; fallback sRGB (P3→closest chroma); ferramenta de conversão de paleta |
| 28 | fetch | https://m3.material.io/styles/elevation/tokens | M3 elevação por tokens (níveis), suporte a overlay/elevação |
| 29 | fetch | https://github.com/telekom/design-tokens/blob/main/docs/light-and-dark-mode.md | dark mode com CSS vars + `data-mode` (light/dark) + `prefers-color-scheme` + fallback; toggle via `matchMedia` |

---

## 8. Fontes completas

### URLs acessadas nesta sessão

- https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl (fetch — OKLCH)
- https://ui.shadcn.com/docs/theming (fetch — tokens/radius)
- https://www.css-architecture.com/multi-brand-theming-white-label-token-architecture/ (fetch — white-label 4 camadas)
- https://www.carmenansio.com/articles/motion-tokens-design-systems/ (fetch — motion)
- https://colorarchive.org/guides/neutral-color-palette-guide/ (fetch — neutrals)
- https://tailwindcss.com/docs/colors (busca — OKLCH v4)
- https://colorfyi.com/pt/blog/color-in-design-systems-at-leve/ (busca — e3 camadas)
- https://m2.material.io/design/environment/elevation.html (busca — elevation)
- https://web.dev/articles/light-dark (busca — light-dark())
- https://utopia.fyi/type/calculator/ (busca — font fluid)
- https://rc.css.master.co/guide/elevation (busca — Elevation namespace)
- https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html (busca — 2.4.13)
- https://developer.chrome.com/docs/css-ui/color-mix / MDN color-mix (busca — compat)
- https://caniuse.com/?search=light-dark (busca — compat)
- https://kyards.com/pt/blog/design-tokens-acessiveis-guia-completo (busca — pt-BR)
- https://www.utopia.fyi/ (fetch — fluid type/space)
- https://oklch.com/ (fetch — OKLCH converter/fallback)
- https://m3.material.io/styles/elevation/tokens (fetch — M3 elevation tokens)
- https://github.com/telekom/design-tokens/blob/main/docs/light-and-dark-mode.md (fetch — dark mode via CSS vars + data-mode)

### Arquivos do repo lidos (file:line)

- `docs/design/README.md:1-48`
- `docs/design/TEMPLATE.md:1-74`
- `src/index.css:122-256` (tokens), `:161-170` (fontes), `:204-207` (chadow),
  `:213-235` (motion), `:258-315` (dark)
- `src/shared/styles/design-tokens.css:1-76` (shadow 35–37; button 58–64)
- `VISUAL_IDENTITY.md:1-434` (cores 2.1–2.4; tipografia 3.2; também §12)
- `src/shared/hooks/useBrandAppearance.js:96-108, 22-36, 110-114, 231-262`
- `src/lib/utils.js:7-11, 22-32, 41-60, 113-118`
- `src/shared/ui/ui.jsx:12-29, 134-135, 150, 200-210`
- `docs/UX/UX_UI_AUDIT_REPORT.md:24, 124, 266-276`
- `package.json:36-53, 54-101`

---

**Fim do documento.**

> Frente 1 (Fase 1 pesquisa) entregue. Métricas (ver README §Protocolo):
> `buscas=10, urls=9, lidos=10, doc_linhas=485`
> Top-3 P0 (seção 3): (1) unificar a fonte de tokens e resolver o conflito de
> `--shadow-*` (P0-A); (2) implementar escala de neutros cromáticos em OKLCH
> (P0-B); (3) derivar `--brand` com `color-mix()` + focus ring em tokens WCAG
> 2.4.13 (P0-C/D).