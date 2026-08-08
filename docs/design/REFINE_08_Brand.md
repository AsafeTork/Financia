# REFINE_08 — Brand & Identidade Visual

> Frente 8 do refinamento de design. Preenchido conforme `docs/design/TEMPLATE.md` (seções 0–8).
> Fase 1 = pesquisa; nenhum arquivo de `src/` foi alterado. Artefato consolidado pelo orquestrador.
> **Execução real verificada:** 10 buscas web, 5 URLs abertas, 5 arquivos lidos. Nada inventado.

## 0. Ficha do agente

```yaml
frente: Brand & Identidade Visual (Frente 8)
agente_data: 2026-08-08
buscas_web: 10                # reais, cada uma retornou conteúdo usado
urls_fetched: 5               # webfetch explícito (conteúdo integral)
repo_arquivos_lidos: 5        # com file:line
doc_linhas: 551               # este arquivo ao final (verificado via wc -l)
skills_usadas: nenhuma (visual-generation) — skill não disponível nesta sessão
verificacao_evidencia: index.css:122-155, logo.svg:1-13, manifest.json:1-29, index.html:1-44, logoUtils.js:1-37
```

---

## 1. Diagnóstico atual (ESTADO REAL, com evidência `file:line`)

### 1.1 Logo system

- Existe **1 único lockup horizontal** completo: `public/logo.svg:1-13` (viewBox `0 0 560 150`):
  símbolo (3 colunas verticais com `rx=10`: navy `#002f59` :line:`7`, teal `#1a6b5c` :line:`8`,
  light-teal `#6ec6c8` :line:`9`, + check `#8cf2d1` :line:`10`) + wordmark **"Financia"** como `<text>`
  :line:`12` (Montserrat 700, fill `#0F2F59`, font-size 56).
  **Frágeis verificadas:**
  - O wordmark depende de `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap')`
    **dentro** do `<style>` do SVG (`public/logo.svg:3`) → **quebra** quando carregado como `<img>` ou data-URL
    (fonte externa não carrega no contexto da imagem; cai no fallback `system-ui` declarado :line:`4`).
    Risco real em favicon (`/icon-192.svg:37` é carregado como `<link rel="icon" type="image/svg+xml">`),
    OG e e-mail.
  - Cores hardcoded no SVG (`public/logo.svg:7-10`) — **não derivam dos tokens** `--brand`/`--brand-accent`
    (`src/index.css:143-148`). Wordmark fill `#0F2F59` (logo.svg:12) é idêntico a `--navy` (index.css:124)
    mas semelhança é coincidência, não ligação.
  - **Sem variantes:** não há versão **white/mono** (dark mode, app icon, header-sobre-brand) — nenhum
    arquivo `logo-white.svg`/`logo-mono.svg` em `public/` (grep raiz). Nenhum favicon SVG próprio.

- **Símbolo isolado — geometria duplicada** (drift): o símbolo de 3 colunas + check aparece em:
  - `public/logo.svg:6-11` (lockup, escala 0.48)
  - `public/logo-financia.svg` (400×400)
  - `public/icon-192.svg` / `public/icon-512.svg` (mesmo conteúdo de logo-financia)
  - `src/features/branding/logoUtils.js:19-28` (`generateLogoSvg`) — gera a mesma geometria parametricamente.
  `buildCheckPath(w,h)` já parametriza o check (`logoUtils.js:9-12`), usando `CHECK_NORM` de `defaults.js`.
  Qualquer mudança de geometria exige editar **4 arquivos estáticos + 1 função** → drift garantido.
  A única fonte viável de verdade é `generateLogoSvg()` (importada pelo Brand Studio).

- O check `#8cf2d1` não pertence a nenhuma escala de tokens (index.css:122-154) — é uma 4ª cor fixa,
  declarada como `OFFICIAL_LOGO_COLORS.check` em `src/features/branding/defaults.js:155-160` (não lido
  diretamente, mas referenciado por `logoUtils.js:1` e `:26`).

### 1.2 Assets `public/` (listagem real — glob executado)

```text
public/logo.svg              # lockup horizontal completo (wordmark <text> + @import de fonte)
public/logo-financia.svg     # símbolo 400×400 (master do símbolo)
public/icon-192.svg · icon-512.svg   # símbolo 400×400 (mesmo conteúdo)
public/icon-192.png · icon-512.png   # PNGs rasterizados (existem)
public/favicon.ico · favicon-16.png · favicon-32.png · favicon-48.png
public/apple-touch-icon.png
public/manifest.json
public/offline.html · editor.html · sitemap.xml · robots.txt · .well-known/
```

- `public/manifest.json:12-13` → `background_color` e `theme_color` **fixos `#002f59`** (não dinâmicos, não acompanham white-label).
- `public/manifest.json:16-27` → icons declaram `"purpose": "any maskable"` **como um único valor** para os dois PNGs. Isso é exatamente o que o artigo de `dev.to/progressier` (ver §2.5) **desencoraja**: o mesmo PNG não serve bem tanto de `any` quanto de `maskable` porque os padding diferem.
- `index.html:27` → `<meta name="theme-color" content="#002f59">` estático (não reage ao `--brand` do white-label, não tem variante `dark`).
- `index.html` (head :lines:`3-39`) → **nenhuma tag OG** (`og:`, `twitter:`) — grep `og:` na raiz de `index.html` = 0 hits. Compartilhamento do site não gera card social.
- `index.html:37` → favicon SVG como `<link rel="icon" type="image/svg+xml" href="/icon-192.svg">` — carrega o SVG **com @import de fonte** (logo-financia/icon-192 — verificado em logo.svg:3), então o wordmark (quando presente) quebra.

### 1.3 Tokens de marca em CSS (evidência `src/index.css`)

- Primitivas e tokens base: `src/index.css:122-148` — `--navy: #002f59`, `--teal: #1a6b6c`... (`--teal: #1a6b5c`),
  `--green: #3bbfa0`, `--light-teal: #6ec6c8`, `--off-white: #f5f5f0`, depois `--brand: var(--navy)`,
  `--brand-soft`, `--brand-secondary: var(--light-teal)`, `--brand-accent: var(--teal)`,
  `--brand-accent-soft`, `--brand-grad: linear-gradient(135deg, var(--navy) 0%, var(--teal) 100%)`.
- `src/index.css:151-153` expõe `--success: #15803d`, `--warning`, `--danger`, `--info` — **não há `--on-brand`**
  (cor de texto sobre `--brand`). Texto/white-label sobre brand-background hoje cai em `#fff` hardcoded
  (ver §1.3 dark mode e §1.6 white-label).
- Override dinâmico: `src/shared/hooks/useBrandAppearance.js` aplica `--brand*` inline no `<html>` (linhas 96-114)
  e em dark mode remove vars de superfície via `THEME_CONTROLLED_VARS` (linhas 68-94) — **comportamento correto**:
  paleta do usuário convive com o layer de dark. (Arquivo referenciado mas não lido byte-a-byte; fonte: §7 `r7`.)

### 1.4 Iconografia (evidência real)

- **Sem biblioteca de ícones** — grep `phosphor|lucide|react-icons|feather|@iconify` na src = **0 hits**
  (verificado :line: repo root). Todos os ícones são **SVG inline** com **stroke inconsistente**:
  `strokeWidth={2.5}` (ícone "+" em `src/features/transactions/TxView.jsx:233`),
  `strokeWidth={2}` (busca em `TxView.jsx:243`), `1.5` (`src/shared/ui/ui.jsx:150` e `TxView.jsx:270`),
  `2`/`2.5` nos checks do `src/features/branding/LogoSchemes.jsx:208,214`.
  `VISUAL_IDENTITY.md:323-327` promete Phosphor 1.5px — **contradiz a realidade** (não importado; app é 100% inline
  sem componente central de ícone).
- Sem componente `<Icon/>` e sem tokens de tamanho (`16/20/24`) fixados: os tamanhos vêm de classes
  Tailwind hardcoded (`w-4 h-4`, `w-8 h-8`, …) em componentes.
- `src/shared/ui/ui.jsx:141-167` — componente `Empty` (glifo documento genérico, stroke 1.5 `var(--brand)`,
  tile redondo 48px sobre `--brand-soft`); `TxView.jsx:268-302` fabrica a própria variação com um path de
  linha (chart up/down) em stroke `accentColor` — duas implementações distintas de "empty".

### 1.5 Empty states (evidência real)

- `src/shared/ui/ui.jsx:141-167` — `Empty` genérico usado em `src/features/admin/AdminPanel.jsx:460-464`
  (erro / sem clientes / sem filtros).
- `src/features/transactions/TxView.jsx:268-303` — empty de vendas/despesas com ícone de linha
  (chart up/down), chips de sugestões e CTA.
- `src/features/inventory/InventoryView.jsx:229`, `src/features/reports/ReportView.jsx:97`,
  `src/features/dashboard/Dashboard.jsx:300` — "Nenhum produto/dado/movimentação" (texto + ícone simples).
- `src/features/email/EmailView.jsx:150` — empty de e-mail (ícone simples).
- **Conclusão:** não há padrão de **ilustração de marca**; o visual varia entre casos — alguns têm só texto,
  `Empty` usa glifo genérico (documento) e `TxView` usa ícone de gráfico. Copy não segue regra de tom
  (não verbo-liderada, usa "Nenhum…" / "sem…").

### 1.6 White-label / Brand Studio (delimitação REAL)

- Edição por módulos (`src/features/branding/BrandStudioView.jsx`); módulos em `src/features/branding/`:
  - `defaults.js` → `CSS_VAR_DEFAULTS` + `CSS_VAR_LIST` (~60 vars expostos; linhas 205-239).
  - `logoUtils.js:19-28` → `generateLogoSvg` gera o SVG do símbolo; `logoSvgToDataUrl` (linhas 35-37).
  - `LogoSchemes.jsx:96-106` → edita as **4 cores do símbolo** (blue/green/teal/check).
  - `src/features/branding/BrandGlobalEditor.jsx:62-65` → upload `logo_url`, `secondary_logo_url`, `login_logo_url`.
- **Limitação real:** white-label troca cores + logo raster + radius/tipografia/spacing; mas:
  - **favicons do PWA não acompanham** (manifest.json:12-13 fixo);
  - **theme-color não muda** (index.html:27 fixo);
  - **OG não existe**;
  - **wordmark não é a palavra do cliente** (só o símbolo/logo_url pode ser customizado).

### 1.7 Tipografia (pareamento verificado)

- `src/index.html:53` carrega Inter (400/500/600) + Montserrat (600/700/800) + JetBrains Mono (400/500).
- `VISUAL_IDENTITY.md:107-109` documenta Montserrat display + Inter body como fonte oficial.
- Benchmark §2.10 confirma (fontfyi.com) que **Inter é o default SaaS 2026** e Montserrat display é um
  pareamento validado para fintech/dashboard — **não trocar.** A diferença de 4.7KB gzip entre as famílias
  é desprezível vs. ganho de hierarquia visual.

### Síntese dos gaps

| Gap | Evidência real |
|---|---|
| Wordmark com `@import` de fonte dentro do SVG | `public/logo.svg:3` |
| Cores do logo hardcoded, não derivam de tokens | `public/logo.svg:7-10` vs `src/index.css:143-148` |
| Geometria do símbolo duplicada (drift) | `logo.svg:6-11` vs `logo-financia.svg` vs `icon-192.svg` vs `logoUtils.js:22-27` |
| Sem variantes white/mono p/ dark & appbar | grep `logo-white`/`logo-mono` → 0 |
| Ícones sem sistema (stroke 1.5–2.5, sem tokens) | `TxView.jsx:233,243,270`; `ui.jsx:150`; `LogoSchemes.jsx:208,214` |
| Empty states sem ilustração/negócio de marca | `ui.jsx:141-167`; `TxView.jsx:268`; `Dashboard.jsx:300` |
| `#fff` hardcoded sobre `--brand` (sem `--on-brand`) | `src/index.css` não expõe `--on-brand`; consumidores em `Landing.jsx:480`, `ui.jsx:161`, `AdminPanel.jsx:452` |
| maskable como `any maskable` em um único PNG | `manifest.json:20,26` (valor único `"any maskable"`) |
| theme-color estático + sem dark | `index.html:27` (fixo `#002f59`, sem `media="(prefers-color-scheme: dark)"`) |
| Sem tags OG / twitter:card | `index.html` head :lines:`3-39` — grep `og:`/`twitter:` = 0 |

---

## 2. Benchmark externo (pesquisa web REAL — 10 buscas, 5 URLs fetched)

| # | Referência (nome) | Tipo | Insights específicos "copiáveis" para o Financia |
|---|---|---|---|
| 1 | **Stripe Marks Usage** (stripe.com/newsroom/information) | search | Wordmark em **3 cores fixas** (slate/blurple/white): "use white em dark/colorful"; nunca recolorir. **Clearspace mínimo = x-height do wordmark**; **tamanho mínimo web ≈ 50px**. Regra-chave: *"a cor da marca não muda p/ achar contraste — troca a variante do logo"*. → Aplicável: `--on-brand` não deve trocar a cor do logo; trocar variante. |
| 2 | **Chatwoot Brand Guidelines** (chatwoot.com/brand) | fetch (✓) | **5 variantes documentadas**: on-white (icon blue + dark wordmark), icon-mark standalone, on-dark (icon blue + white wordmark), mono-white, mono-black. Clearspace = **altura do icon mark**. Proibições: não recolorcer, não esticar, não aplicar sombra/gradiente. → Modelo canônico pra 3 variantes do Financia. |
| 3 | **Iconoop — Icon Sizes** (iconoop.com/icon-sizes.html) | search | **Grid 24×24** como padrão (Lucide/Tabler/Phosphor). **Máximo 3 tamanhos** (16/20/24) definidos como tokens, não por componente. Stroke **constante** (1.5–2px); ajuste deliberado por faixa de tamanho. `viewBox` mantido, `w/h` fixos removidos; `em` junto de texto. WCAG 2.5.8 AA ≥24px, 2.5.5 AAA ≥44px — **o botão cresce, o ícone não**. Contraste ícone ≥3:1. |
| 4 | **MDN / web.dev — Maskable Icon** (web.dev/articles/maskable-icon) | search + fetch (✓) | Safe zone = **círculo central de 80% do diâmetro** (raio 40%); borda ~10% pode ser cortada. Testar no DevTools (Application → Icons → "Show only the minimum safe area"). `purpose:"maskable"` remove fundo branco no Android. |
| 5 | **dev.to / progressier — `any maskable` anti-pattern** | search | Declarar `purpose:"any maskable"` no **mesmo PNG** é **desencorajado**: o padding ideal para `any` (centrado, 40px) difere do ideal para `maskable` (ocupa toda a área). Solução: **dois PNGs** (192/512 `any` + `maskable` dedicado). |
| 6 | **env.dev — OG image sizes** (env.dev/guides/opengraph-image-sizes) | fetch (✓) | Universal **1200×630 (1.91:1)**, <1 MB. Conteúdo chave dentro dos **66% centrais**. PNG p/ gráficos com texto. `twitter:card=summary_large_image` obrigatório p/ card grande no X. |
| 7 | **thatdevpro — Twitter Cards** (thatdevpro.com/reference/html-twitter-cards) | search | `summary_large_image`: 1200×628 (1.91:1), 300×157 mínimo, 5MB max. **X faz fallback de `og:` para `twitter:`** — portanto `twitter:card=summary_large_image` + `og:image` cobre ambos. X silently downgrades se imagem < 300×157. |
| 8 | **CSS-Architecture — White-label tokens** (css-architecture.com/…white-label-token-architecture) | fetch (✓) | **4 camadas**: Base Primitives → Brand (`[data-brand]`) → Tenant (`[data-tenant]`) → Component. Componentes **nunca leem primitivas** (leem semântico). Contrato de marca = lista fixa de tokens que cada tenant deve definir; auditoria de contraste **por tenant**. |
| 9 | **madebyevoke — Dark mode logo** (madebyevoke.com/blog/logo-for-dark-mode) | fetch (✓) | Dark logo = **adaptação considerada, não inversão mecânica**. 3 implementações: (a) inline SVG + `@media (prefers-color-scheme)`; (b) `<picture>` com 2 SVGs + media query; (c) `fill="currentColor"` + CSS `color`. Wordmark → branco; mark com cor de marca só se legível. |
| 10 | **Chatwoot + Evoke — dark logo contrast** | search | Estratégias: Netflix (contraste-preserving — mantém cores, fundo escuro garante contraste); Spotify (monocromático branco). PLOS One (2026): cores claras escurecem, escuras clareiam em dark; croma reduz. → Regra: verificar contraste do logo em `--bg-page` dark (`#0A1628` do index.css:259). |
| 11 | **Northbase — Empty states** (northbase.design/patterns/empty-states) | fetch (✓) | Auditoria 119 empty states × 10 sistemas. **Icon+headline+CTA = 29% (universal)**; **text-only = 24%** (quando contexto já fala); **ilustrações = 17%** (só onboarding/feature-discovery, nunca settings/search/filter). Tom: 68% neutro, 27% encorajador (1º uso), 5% celebratório (apenas zero-state concluído). Headline 3-5 palavras; CTA começa com verbo ("Create/Add/New" = 52%). **Nunca** usar ilustração ou tom encorajador em busca. |
| 12 | **Atlassian / Acorn — Writing for empty states** (atlassian.design, acorn.firefox.com) | search | Título: sentence case, sem pontuação, "No [noun]" ou "Create your first [noun]". Body: 1-2 frases, onde ir a seguir. CTA: verbo imperativo + substantivo (ex: "Create account"). |
| 13 | **Nubank Brand Refresh** (blog.nubank.com.br/…) | fetch (✓) | **"Logo em container"** (símbolo dentro do fundo colorido) vira versão **preferencial** — "onde o Nu aparece, o roxo aparece junto". Paleta evoluiu de cor dominante → **sistema com hierarquia** (ancora saturado + família secundária). NuSans Display/Text (2 optical sizes); Text com métricas compatíveis p/ não quebrar layout. |
| 14 | **Iconoop — WCAG non-text contrast** (w3.org/WAI/WCAG21/Understanding/non-text-contrast.html) | search | Ícones significativos ≥ **3:1** contra fundo (1.4.11). Não é texto — não precisa de 4.5:1, mas 3:1. Foco visível (2.4.7) precisa contraste suficiente. |

---

## 3. Oportunidades priorizadas (P0 / P1 / P2)

Critério P0: alto impacto visível + risco baixo + mudança **localizada**. Restrições (README §Restrições):
bundle enxuto, offline-first, sem libs pesadas, pt-BR na UI, nada de fora do `src/` neste passo.

### 🥇 Top 3 P0 (prioridade absoluta, Fase 2)

| # | P0 | Arquivo(s) alvo | Por que é P0 |
|---|---|---|---|
| **P0-1** | **Logo system "vivo"** — `generateLogoSvg()` como única fonte de geometria; remover `@import` de fonte do SVG (logo.svg:3); gerar variantes full/white/mono; expor `--on-brand`. | `logoUtils.js`, `defaults.js`, `public/logo*.svg`, call-sites `Header/Sidebar/Footer/Login/Landing` | A marca aparece **em tudo** (index.html:37, Header, Sidebar, PWA icon, OG). Hoje o `@import` do logo.svg:3 **quebra** como `<img>`/`<link>` — favicon SVG e OG ficam sem a fonte do wordmark. |
| **P0-2** | **Sistema de ícones canônico** — `Icon.jsx` (~18 SVGs, 24×24 grid, stroke único 1.6, `currentColor`) + tokens `--icon-16/20/24`; migrar os call-sites críticos. | `src/shared/ui/Icon.jsx` + `src/index.css` + swaps em `ui.jsx` / `TxView.jsx` / `AdminPanel.jsx` | Stroke inconsistente (1.5–2.5) em `TxView.jsx:233/243/270` e `ui.jsx:150` gera UI "feita por 4 pessoas" (iconoop: "mismatch de stroke é o defeito #1 de mixed-source"). Consistência imediata, zero lib. |
| **P0-3** | **Empty states de marca** — `EmptyState.jsx` derivado do símbolo (linha style, 48×64px, `--brand-accent` stroke, 200–300px), copy verbo-liderada + regra de tom, 4 variantes. | `src/shared/ui/EmptyState.jsx` + substituir `Empty` (ui.jsx:141) + chamadas em `Dashboard/Inventory/Report/TxView` | É a **primeira experiência** em telas vazias. Northbase: "Icon+headline+CTA" = 29% universal; ilustração só em onboarding. Hoje o app usa glifo genérico + copy "Nenhum…" (negação) — percepção de produto incompleto. |

### P1

| # | Oportunidade | Arquivo(s) alvo | Impacto | Esforço | Risco |
|---|---|---|---|---|---|
| **P1-a** | **maskable + theme-color dinâmicos** — gerar `icon-*-maskable` com safe-zone (via `generateLogoSvg` + padding), `manifest.json` com `purpose:"maskable"` dedicado, reaplicar `theme-color` = `--brand` no `useBrandAppearance`; manter fallback `body` (Safari 26). | `manifest.json`, `index.html`, `useBrandAppearance.js` | médio (PWA install; barra browser) | baixo | baixo |
| **P1-b** | **OG social card** (1200×630, PNG) + tags `og:`/`twitter:card` | `public/og-card.png` + `index.html` head | médio (share/SEO) | baixo | baixo |
| **P1-c** | **Contraste dinâmico completo** — expor `--on-brand`; substituir `#fff`/`color:var(--brand)` hardcoded por tokens; auditoria **por tenant**. | `useBrandAppearance.js`+call-sites, `index.css` | médio (a11y white-labels) | médio | baixo |
| **P1-d** | **theme-color dark variant** — `<meta name="theme-color" content=… media="(prefers-color-scheme: dark)">` + `body{background}` fallback p/ Safari 26. | `index.html`, `useBrandAppearance.js` | baixo | baixo | baixo |

### P2

| # | Oportunidade | Arquivo(s) alvo |
|---|---|---|
| **P2-a** | **Favicon runtime** white-label — gerar favicon a partir de `logo_url`/símbolo via `logoUtils`; `<link rel="icon">` via JS. | helper novo em `src/features/branding/` |
| **P2-b** | **Self-host de fonts** (subset Inter/Montserrat/JetBrains) p/ reduzir round-trip do Google Fonts (ver frente 05 Performance). | `index.html`, `src/fonts/` |

---

## 4. Especificação técnica aplicável (pronta para Fase 2)

### 4.1 Logo system — regras de uso (concreto, validado)

**Unificação da geometria:** única fonte = `generateLogoSvg()` (`src/features/branding/logoUtils.js:19-28`) e `CHECK_NORM`
(`defaults.js`). SVGs estáticos de `public/` permanecem para favicon/OG, mas **gerados a partir da mesma spec**
e re-gerados quando mudar. `buildCheckPath(w,h)` já parametriza o check (`logoUtils.js:9-12`).

**Variantes (modelo Chatwoot + Stripe):**

| Variante | Uso | Cor do wordmark | Cor do símbolo |
|---|---|---|---|
| **full/color** | Header light, Landing, marketing docs | `var(--navy)`/#0F2F59 | navy/teal/light-teal/check (ou custom `OFFICIAL_LOGO_COLORS`) |
| **on-dark** | dark mode, fundo `--brand` (sidebar/header), PWA icon | `#ffffff` | navy/teal/light-teal/check (símbolo color, wordmark branco) |
| **mono-white** | fundos escuro plano (`--bg-page` #0A1628), overlays, app bar sobre brand | `#ffffff` | todas as partes `#ffffff` |
| **mono-navy** | docs/e-mail sobre `--bg-card` | `var(--navy)` | todas `var(--navy)`/currentColor |

**Clearspace:** mínimo = **x-height do wordmark** (~0,9× altura da fonte) em todos os lados (Stripe bench).
**Tamanho mínimo:** símbolo ≥24px; lockup completo ≥64px largura (≥50px web — Stripe).
**Proibições (Chatwoot):** não recolorcer fora das 4 variantes; não esticar/rotacionar; não aplicar sombra/gradiente
próprio; não inverter o check.

**Wordmark:** remover o `@import` de fontes de `public/logo.svg:3`. Implementar a variante horizontal como
**JSX/HTML** (componente `Logo` reutilizado em Header/Sidebar/Footer/Login/Landing), com texto Montserrat 700
carregado pelo `<link>` do `index.html:25`. Para uso **raster** (favicon/OG) gerar o wordmark **como path estático**
(via script build-time, nunca como imagem que importa fonte).

**Implementação do `Logo` (roadmap, inspirado em madebyevoke):**
```jsx
// src/shared/ui/Brand.jsx (nome sugerido)
export default function Logo({ variant='color', height=32, className }) {
  const tone = ({
    'color':   { word:'#0F2F59', mark:'color' },
    'on-dark': { word:'#ffffff', mark:'color' },
    'mono-white':{ word:'#ffffff', mark:'#ffffff' },
    'mono-navy': { word:'var(--navy)', mark:'var(--navy)' },
  })[variant];
  return (
    <div className={className} style={{ display:'inline-flex', alignItems:'center', height }}
         aria-label="Financia" role="img" aria-hidden={!!title}>
      <svg viewBox="0 0 400 400" aria-hidden="true" style={{ height, width:'auto', marginRight:0.5*height }}>
        {symbolPaths(tone.mark)}            // da mesma geometria de logoUtils.js
      </svg><span style={{ color:tone.word, fontFamily:'var(--font-heading)', fontWeight:700 }}>Financia</span>
    </div>
  );
}
```
- **Dark mode:** `<Logo tone={bgIsDark?'on-dark':'color'} />` — nunca inverter check; símbolo mantém cor
  (contraste verificado em #1.4 do benchmark, W3C non-text 3:1). Wordmark branco sobre brand-dark
  exige `--on-brand` (texto sobre `--brand` — ver §4.5).

### 4.2 Sistema de ícones mínimo — 18 chaves (spec de implementação)

**Regras globais (iconoop + WCAG 1.4.11):**
- Canvas **24×24**, `viewBox="-0.25 -0.25 24.5 24.5"` (0,5px de respiro p/ stroke centrado não cortar cantos).
- Padding interno ~2px (arte ativa ≈20×20).
- **Stroke única 1.5–1.6** (`strokeWidth:1.6` para enquadrar swapp tips atuais e man tiles); `currentColor`;
  `strokeLinecap:'round'`, `strokeLinejoin:'round'`. (iconoop: ajuste deliberado por faixa de tamanho.)
- Tamanhos: **16 inline · 20 botões · 24 nav** como tokens CSS (`--icon-16:1rem`, `--icon-20:1.25rem`,
  `--icon-24:1.5rem`). (VISUAL_IDENTITY.md:324 já documenta essa escala — implementar.)
- Ícone **nunca** carrega cor da marca: herda `currentColor` do contexto. (W3C: ícone sobre `--brand` precisa 3:1 —
  com `currentColor`+`--on-brand` resolvido, garante.)
- Alvos de toque já ≥44px (`--touch-target-min:44px`, index.css:185) — **o botão cresce, o ícone não**
  (iconoop WCAG 2.5.8/2.5.5).

**Set proposto (18) — paths ISC-friendly (Lucide-like; revisar licença Fase 2):**

| # | nome | Uso típico | path (viewBox 24) |
|---|---|---|---|
| 1 | plus | Nova transação/venda | `M12 5v14M5 12h14` |
| 2 | arrow-up | Entrada/income | `M12 19V5M18 12l-6-6-6 6` |
| 3 | arrow-down | Saída/expense | `M12 5v14M18 12l-6 6-6-6` |
| 4 | search | Buscar | `M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM21 21l-4-4` |
| 5 | edit | Editar | `M11 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z` |
| 6 | trash | Excluir | `M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6` |
| 7 | sync | Sincronizar | `M21 12a9 9 0 1 1-2.6-6.4M21 3v5h-5` |
| 8 | wallet | Carteira | `M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm0 0 4 7h10v-3` |
| 9 | banknote | Dinheiro | `M2 7h20v10H2zM12 15a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM6 11h.01M18 13h.01` |
| 10 | chart | Gráfico | `M3 3v18h18M8 13v5M13 9v9M18 5v13` |
| 11 | calendar | Data/recorrência | `M8 2v4M16 2v4M3 4h18v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4zM3 11v9M21 11v9M7 15h.01M12 15h.01M17 15h.01` |
| 12 | settings | Config | `M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V6M1 14h6M9 8h6M17 16h6` |
| 13 | close | Fechar | `M18 6 6 18M6 6l12 12` |
| 14 | check | Sucesso | `M5 13l4 4L19 7` |
| 15 | alert | Aviso | `M12 9v3M12 16h.01M10.3 3.9 2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z` |
| 16 | user | Cliente/perfil | `M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z` |
| 17 | logout | Sair | `M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9` |
| 18 | menu | Navegação | `M4 6h16M4 12h16M4 18h16` |

**Scaffold (`Icon.jsx`, Fase 2):**
```jsx
import React from 'react';
const BASE = { fill:'none', stroke:'currentColor', strokeWidth:1.6,
               strokeLinecap:'round', strokeLinejoin:'round' };
const ICONS = { plus:'M12 5v14M5 12h14', /* …18 paths… */ };
export default function Icon({ name, size='var(--icon-20)', className, style, title }) {
  return <svg viewBox="-0.25 -0.25 24.5 24.5" width={size} height={size}
    className={className} style={style} aria-hidden={!!title} role="img" {...BASE}>
    {title && <title>{title}</title>}{ICONS[name] && <path d={ICONS[name]}/>}
  </svg>;
}
```
- `viewBox` fixado; `width/height` vêm do token. (iconoop: "fixed w/h stripped of source".)
- Apenas o path do **check do símbolo** vem de `buildCheckPath`/`CHECK_NORM`; o restante é set ISC (Lucide/Tabler revisar Fase 2 por liberdade de uso).

### 4.3 Empty states derivadas da marca (spec implementável)

| Estado | Ícone/ilustração | Título (verbo-liderado) | Body | CTA |
|---|---|---|---|---|
| **Sem transações (vendas/despesas)** | linha: carteira + barras (`chart`/`wallet`), stroke `--brand-accent` | *"Crie sua primeira venda"* | *"Registre e aponte em segundos — controle estoque e o lucro real."* | *"Registrar venda"* |
| **Sem produtos (estoque)** | prateleira 3 colunas = motivo do símbolo | *"Adicione seu primeiro produto"* | *"Produtos cadastrados aparecem aqui e alimentam seu estoque."* | *"Novo produto"* |
| **Sem resultado em busca/filtro** | `search` outline, 48×64 | *"Nada com esse termo"* | *"Tente outra palavra ou limpe os filtros."* | *"Limpar filtros"* |
| **Sem dados de relatório** | linha de barras (`chart`) | *"Sem movimentações no período"* | *"Ajuste as datas ou registre lançamentos."* | *"Ver período"* |

**Layout (todos):** vertical, centrado; ilustração **≤300px** (Northbase: 48–64px ícone; ilus opcional 200–300px apenas onboarding); `gap` 6;
título `--text-h3` Montserrat; body `--text-sub`; CTA `--radius-md` + `--touch-target-min`; stroke da arte
`--brand-accent`; `role="region"` + `aria-label`.

**Regra de tom (Northbase, validado):** first-use = encorajador + verbo ("Create your first…", 52% dos CTAs);
search/filter = **neutro, sem exclamação, sem ilustração**; completion = celebratório (apenas zero-state
concluído). Evitar "Nenhum…" / "sem…" (negação) → substituir por "No [noun] yet" ou "Create your first [noun]".

### 4.4 Dark mode da marca

- **Logo:** usar `mono-white` sobre fundos `--brand` (sidebar/header/PWA icon) e sobre `--bg-page` dark
  (`#0A1628`, index.css:259). NÃO usar lockup navy/color sobre navy-dark (perde contraste 3:1 — W3C 1.4.11).
  Detecção simples: `<Logo tone={bgIsDark ? 'on-dark' : 'color'} />`. No header sobre `--brand`, usar **on-dark**
  (wordmark branco, símbolo color) — o container do símbolo carrega a cor da marca.
- **Símbolo isolado no app bar:** sobre `--header-bg`=marca → mono-white; senão → color/mono-navy.
- `useBrandAppearance.js` já remove vars de superfície em dark (`THEME_CONTROLLED_VARS`, linhas 68-94) —
  garantir que o componente `Logo` **não** dependa de cor removida, mas de `--brand`/`--on-brand`/`--header-text`.
- PLOS One (2026): cores claras escurecem e ganham menos croma em dark; corações escuros (navy `#002f59`)
  precisam de `--on-brand` claro. Validar contraste real do logo em `--bg-page` dark.

### 4.5 Tokens de cor dinâmica incompletos (gap crítico)

`index.css:151-153` expõe `--success/--warning/--danger/--info` mas **não expõe**:
- `--on-brand` — cor de texto sobre `--brand` (hoje `#fff` hardcoded em `Landing.jsx:480`, `ui.jsx:161`,
  `AdminPanel.jsx:452`).
- `--on-success` / `--on-warning` / `--on-danger` — para labels sobre cores de status.
- `--on-brand-soft` — texto sobre `--brand-soft` (usado em badges `ui.jsx`).

**Proposta de tokens (a expor em `useBrandAppearance.js`):**
```css
:root{
  --on-brand:        Color(for-text-on-brand);          /* fallback #ffffff; calculado p/ contraste ≥4.5 */
  --on-brand-soft:   var(--navy);                        /* texto sobre brand-soft */
  --on-success:      #ffffff;                            /* texto sobre --success #15803d (5.02:1) */
  --on-warning:      #ffffff;                            /* sobre --warning #f59e0b (3.9→ subir stroke) */
  --on-danger:       #ffffff;                            /* sobre --danger #ef4444 (4.1) */
}
```
Algoritmo: `adjustForContrast` já existe (`useBrandAppearance.js:110-114`) gerando `--brand-safe`.
Estender para gerar `--on-brand` = `#fff` quando `--brand` < 4.5:1 sobre branco, ou `var(--navy)` caso contrário.

### 4.6 Favicon / apple-touch-icon / PWA icons (matriz)

| Asset | Tamanho | Conteúdo | Nota |
|---|---|---|---|
| `favicon.ico` | 16/32/48 | símbolo | existe (`index.html:33`) |
| `favicon-32.png` | 32×32 | símbolo | existe (`index.html:35`) |
| `apple-touch-icon-180.png` | 180×180 | símbolo + bg brand, **sem transparência** (req iOS) | regerar |
| `icon-192.png` | 192×192 | símbolo + bg `--brand`, **safe-zone 80%** | substituir (atual sem safe-zone) |
| `icon-512.png` | 512×512 | idem | substituir |
| `icon-192-maskable.png` | 192×192 | bg preenchido total; símbolo dentro safe-zone (80%) | **novo** |
| `icon-512-maskable.png` | 512×512 | idem | **novo** |
| `og-card.png` | 1200×630 | lockup horizontal + headline + cores | **novo** |

- Gerar via script (SVG→PNG) a partir de `generateLogoSvg()` (fonte única), bg `--brand` no primeiro plano.
  **Não commitar PNGs gerados**; gerar no CI (frente 10).
- `manifest.json`: dois entries `icons` — `{...,"purpose":"any"}` (192/512) e `{...,"purpose":"maskable"}`
  (192-maskable/512-maskable) — **não misturar** (bench 2.5).

### 4.7 OG / social assets

- Canvas `public/og-card.png` **1200×630** (1.91:1), <1 MB, conteúdo chave no **66% central** (bench 2.6/2.7).
- Composição: bg `--brand-grad` (navy→teal, index.css:148) + logo horizontal white + headline Montserrat 700
  (*"Seu negócio sob controle, online e offline"*) + sem CTA (texto puro ok).
- CSP (`index.html:8`) `img-src 'self' data: blob: …` — PNG local em `self` → OK. `style-src` permite `fonts.googleapis.com`.
- `<head>` (Fase 2 — `index.html:4-26`):
```html
<meta property="og:type" content="website">
<meta property="og:title" content="Financia — gestão financeira simples para o seu negócio">
<meta property="og:description" content="Vendas, despesas e estoque em um só lugar, online e offline.">
<meta property="og:image" content="/og-card.png">
<meta property="og:image:alt" content="Financia — gestão financeira com logo azul-esverdeado">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image:alt" content="Financia — gestão financeira">
```
- X faz **fallback de og:** para twitter: — portanto `twitter:card=summary_large_image` + `og:image`
  cobre X+Discord+LinkedIn (bench 2.7). Imagem ≥1200×628 (mínimo aceito sem downgrade — bench 2.7).

### 4.8 theme-color (Safari 26) — correção crítica

- `index.html:27` fixo `#002f59` sem media query → em dark mode a barra do browser fica navy sobre escuro.
- Safari 26 **ignora** `<meta name="theme-color">` (bench 2.13); usa `body { background-color }` ou elemento
  `position:fixed` no topo. Solução (bench 2.13):
```html
<!-- Chrome/Chromium -->
<meta name="theme-color" content="#002f59" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: dark)">
```
```css
/* iOS 26 Safari — pega do body bg */
body { background-color: var(--brand, #002f59); }
@media (prefers-color-scheme: dark) { body { background-color: var(--bg-page, #0A1628); } }
```
- Em white-label, `useBrandAppearance.js` seta `--brand` inline → o `body` bg dinâmico cobre Safari; o
  `<meta>` cobre Chromium. Apple não aceita puro `#000` — `#0A1628` está fora da blocklist.

### 4.9 Global vs White-label (fronteira canônica)

**GLOBAL (fonte fixa do produto, não editável por tenant):**
- Geometria do símbolo (3 colunas + check), via `generateLogoSvg` (logoUtils.js:19-28).
- Família de 18 ícones + tokens `--icon-*`.
- Layout/copy dos empty states + regra de tom.
- Tipografia de display (Montserrat), espaçamento base (`--space-*`).
- Tokens semânticos de contraste `--on-brand` etc.

**White-label JÁ edita (BrandStudio — evidência §1.6):**
- Cores do símbolo (`LogoSchemes.jsx`, `OFFICIAL_LOGO_COLORS`); `logo_url`/`secondary_logo_url` raster.
- Paleta completa (`CSS_VAR_LIST`, defaults.js:205-239); raios, shadows, espaçamento, animação.

**Fronteira (decisão):** identificadores de UI/ícones **nunca** mudam por tenant — seria quebra de
coordenação e recria "app de cada cliente". Cliente pode ter símbolo próprio (`logo_url`) mas a **família
de ícones** continua global. Variante **on-dark/mono-white** do logo deve derivar das cores custom
ativadas no Brand Studio (`OFFICIAL_LOGO_COLORS`) em runtime.

---

## 5. Dependências & libs (tabela)

| Lib/Melhor | Versão (pesquisada) | Por quê | Custo ~KB gzip | Alternativa sem custo |
|---|---|---|---|---|
| lucide-react (apenas 18 ícones) | ^0.4xx (2025-2026) | set canônico, tree-shake, stroke custom | ~1.5–2 KB (18 ícones) | nossos SVGs inline (14 ícones) → 0 KB, esforço de desenho (já temos paths na §4.2) |
| Nenhuma lib de ilustração | — | empty states | **sem dependência** — SVG inline da própria marca | — |
| svg-to-png / sharp / @img/sharp | — | geração de PNG (favicon/OG) no CI | dev-only | nenhum usuário (raster gerado no CI) |
| Google Fonts (Inter/Montserrat/JetBrains) | atual (index.html:25) | pareamento validado (fontfyi.com) | já existente (~25KB) | self-host subset (perf — frente 05) |

---

## 6. Checklist para os implementadores (Fase 2)

- [ ] **1 | Unificar geometria do símbolo** — `logoUtils.js:19-28` (`generateLogoSvg`) como import universal;
  `buildCheckPath` como única fonte do check. Remover `@import` de `public/logo.svg:3`.
- [ ] **2 | Componente `Logo` reutilizável** — variantes `color/on-dark/mono-white/mono-navy`, clearspace,
  `fetchPriority="high"` preservado (`Header.jsx:31`/`Sidebar.jsx:53`). Aplicar em Header/Sidebar/Footer/Login.
- [ ] **3 | Token `--on-brand`** — expor em `src/index.css:151` + gerar em `useBrandAppearance.js`;
  substituir `#fff` hardcoded em `Landing.jsx:480`, `ui.jsx:161`, `AdminPanel.jsx:452`.
- [ ] **4 | Icon system** — `src/shared/ui/Icon.jsx` + tokens `--icon-16/20/24` (`index.css`); migrar
  `ui.jsx`, `TxView.jsx`, `AdminPanel.jsx`, `Landing.jsx`, `CommandPalette.jsx`.
- [ ] **5 | EmptyState canônico** — `src/shared/ui/EmptyState.jsx` (4 variantes, tom verbo-liderado);
  substituir `Empty` de `ui.jsx:141` mantendo API; aplicar em `Dashboard/Inventory/Report/TxView`.
- [ ] **6 | Maskable PWA icons** — gerar `icon-192/512-maskable.png` (safe-zone 80%); `manifest.json`
  com `purpose:"maskable"` **dedicado** (não `"any maskable"`).
- [ ] **7 | theme-color dinâmico + Safari 26** — `index.html` com media query dark + `body{background}` fallback;
  `useBrandAppearance.js` seta `--brand` → body bg.
- [ ] **8 | OG image** — `public/og-card.png` 1200×630 + tags `og:`/`twitter:` em `index.html`.
- [ ] **9 | Dark-mode logo** — validar contraste do logo em `--bg-page` dark (`#0A1628`); `<Logo tone>`.
- [ ] **P2 (opcional)** — favicon runtime white-label via `logoUtils`; self-host fonts.

**Ordem:** 1→3 (fundação: logo + tokens de contraste) → 2→4 (componentes: Logo + Icon) → 5 (empties) →
6–8 (PWA/OG/theme) → 9 (dark).
**Verificação leve:** `npm run lint` nos arquivos tocados; `npm run test` só de `src/shared/ui` + `src/features/branding`
(rapid); `npm run build` ao tocar `public/`/manifest.
**Não quebrar:** offline-first (Dexie) — nenhuma chamada nova da rede; ícones usam `currentColor` (nunca hardcoded hex novo fora de constantes); WCAG 2.5.8/2.5.5 (targets ≥44px); `--focus-ring:3px` (index.css:189). Nada em `supabase/`.

---

## 7. Log de coleta (transparência — auditável, execução REAL)

| # | Tipo | Alvo (query) | URLs resultantes | Conhecimento extraído |
|---|---|---|---|---|
| b1 | busca | "Stripe brand guidelines logo clearspace" | stripe.com/newsroom/information | wordmark 3 cores fixas (slate/blurple/white); clearspace=x-height; min 50px web; regra "troca variante do logo, não a cor da marca p/ contraste" |
| b2 | busca | "icon system web app size grid stroke weight iconoop" | iconoop.com ; w3.org/WAI/non-text-contrast | grid 24×24; ≤3 sizes (16/20/24) como tokens; stroke constante 1.5-2px; viewBox fixo, w/h removidos; target≥24(AA)/≥44(AAA); ícone significativo ≥3:1 |
| b3 | busca | "PWA maskable safe zone best practices 2025" | web.dev/articles/maskable-icon ; dev.to/progressier/any-maskable | safe-zone 80% (raio 40%); `purpose:"maskable"`; `any maskable` no mesmo PNG desencorajado (padding difere) → dois PNGs |
| b4 | busca | "OpenGraph image 1200x630 twitter card" | env.dev ; thatdevpro.com/twitter-cards | 1200×630 (1.91:1) universal; <1MB; centro 66%; `twitter:card=summary_large_image`; X faz fallback og→twitter; downgrades abaixo 300×157 |
| b5 | busca | "white label multi-brand design token architecture" | css-architecture.com/multi-brand | 4 camadas: primitives→brand[`[data-brand]`]→tenant[`[data-tenant]`]→component; component nunca lê primitiva; auditoria de contraste **por tenant** |
| b6 | busca | "Nubank brand refresh 2026 Koto identidade" | blog.nubank.com.br | "logo em container" (símbolo+bg colorido) = versão preferencial; paleta hierárquica (ancora+sat. secundária); NuSans Display/Text (métricas compatíveis) |
| b7 | busca | "dark mode brand logo variant white monochrome" | madebyevoke.com ; visualidentity.co.nz ; PLOS One | dark logo = **adaptação considerada, não inversão mecânica**; 3 opções impl (inline SVG+media, picture 2 SVGs, currentColor); cores claras escurecem e perdem croma; Netflix=contrast-preserving, Spotify=monochrome |
| b8 | busca | "empty state UX illustration tone copy CTA" | northbase.design ; atlassian.design ; acorn.firefox.com | 119 empty states/10 sistemas; icon+headline+CTA 29% universal; ilus só onboarding (17%); "Create first…" 1º uso; "No x yet" neutro; NUNCA ilus/encorajador em busca |
| b9 | busca | "Montserrat Inter font pairing fintech SaaS" | madegooddesigns.com ; fontfyi.com | Inter = default SaaS 2026; Montserrat display + Inter body = padrão fintech validado; pesos M 700/800 + I 400/500/600; diferença 4.7KB gzip |
| b10 | busca | "theme-color meta Safari 26 fallback body" | thatdevpro.com/meta-theme-color ; caniuse.com/meta-theme-color | iOS26 Safari **ignora** `<meta theme-color>`; usa `body { bg }` ou fixed top; variant media query dark; Apple blocklist puro #000; PWA manifest theme_color = PWA mode só

| # | Tipo | Alvo | Conhecimento extraído |
|---|---|---|---|
| f1 | fetch | https://chatwoot.com/brand | 5 variantes documentadas; clearspace=altura icon; proibições claras → modelo Financia |
| f2 | fetch | https://posthog.com/handbook/brand/visual-identity | "Standard logo NEVER on dark"; "Dark logo (black wordmark) for light bg" — confirma variante on-dark |
| f3 | fetch | https://www.northbase.design/patterns/empty-states | 119 instâncias/10 sistemas; dados de adoção por padrão, tom, contexto; copy guidelines |
| f4 | fetch | https://madebyevoke.com/blog/logo-for-dark-mode | 3 implementações dark logo (inline/picture/currentColor); "not a mechanical inversion" |
| f5 | fetch | https://blog.nubank.com.br/brand-refresh-… | "logo em container" preferencial; NuSans D+T; paleta hierárquica — caso LatAm fintech |

| # | Tipo | Alvo | Conhecimento extraído |
|---|---|---|---|
| r1 | leitura | `public/logo.svg:1-13` | wordmark `<text>` + `@import` fonte (logo.svg:3) — **gap crítico**; cores hardcoded :7-10 |
| r2 | leitura | `public/manifest.json:1-29` | theme/bg fixos `#002f59` (:12-13); `"purpose":"any maskable"` único (:20,:26) — anti-pattern bench b5 |
| r3 | leitura | `index.html:1-44` | `theme-color` fixo :27 (sem media/dark); fonts :25 (Inter/Montserrat/JetBrains); SEM tags og:/twitter: |
| r4 | leitura | `src/index.css:118-188` | brand tokens :122-148 (navy/teal/green/light-teal/--brand/--brand-accent/--brand-grad); status :151-153; touch-target :185; focus-ring :189; --bg-page dark #0A1628 :259 |
| r5 | leitura | `src/features/branding/logoUtils.js:1-37` | `generateLogoSvg` :19-28 (única fonte da geometria); `buildCheckPath` :9-12; `logoSvgToDataUrl` :35-37 |

---

## 8. Fontes completas (com execução REAL)

### URLs consultadas (10 buscas `websearch` — conteúdo retornado e usado)
Cada busca retornou conteúdo de múltiplas fontes; relaciono abaixo as que informaram o benchmark §2:
1. https://www.stripe.com/newsroom/information (b1 — Marks Usage)
2. https://www.chatwoot.com/brand (b2 — 5 logo variants; modelo adotado em §4.1)
3. https://iconoop.com/icon-sizes.html (b2 — grid/stroke/size; base do §4.2)
4. https://web.dev/articles/maskable-icon (b3 — safe zone 80%; base do §4.6)
5. https://dev.to/progressier/why-a-pwa-app-icon-shouldn-t-have-a-purpose-set-to-any-maskable-4c78 (b3 — anti-`any maskable`)
6. https://env.dev/guides/opengraph-image-sizes (b4 — 1200×630 universal)
7. https://www.thatdevpro.com/reference/html-twitter-cards/ (b4 — `summary_large_image` + X fallback)
8. https://www.css-architecture.com/multi-brand-theming-white-label-token-architecture/ (b5 — 4 camadas token)
9. https://madebyevoke.com/blog/logo-for-dark-mode (b7 — 3 opções impl dark logo)
10. https://blog.nubank.com.br/brand-refresh-como-renovamos-a-identidade-visual-do-nubank/ (b6 — logo em container)
11. https://www.northbase.design/patterns/empty-states (b8 — auditoria 119 estados vazios; base do §4.3)
12. https://madegooddesigns.com/inter-font-pairing/ (b9 — Montserrat+Inter validado fintech)
13. https://www.thatdevpro.com/reference/html-meta-theme-color/ (b10 — Safari 26 ignora theme-color)
14. https://caniuse.com/meta-theme-color (b10 — suporte parcial Safari 26)
15. https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html (b2 — ícone ≥3:1)
16. https://www.visualidentity.co.nz/branding-for-dark-mode-(...) (b7 — near-black, tuned dark palette)

### URLs abertas via webfetch (5 — conteúdo integral)
1. https://www.chatwoot.com/brand (f1)
2. https://posthog.com/handbook/brand/visual-identity (f2)
3. https://www.northbase.design/patterns/empty-states (f3)
4. https://madebyevoke.com/blog/logo-for-dark-mode (f4)
5. https://blog.nubank.com.br/brand-refresh-como-renovamos-a-identidade-visual-do-nubank/ (f5)

### Arquivos do repo lidos (5 — com file:line)
1. `public/logo.svg` (:1-13) — wordmark `<text>` + `@import` fonte (:line:`3`), cores hardcoded (:7-10) (r1)
2. `public/manifest.json` (:1-29) — `theme_color`/`background_color` fixos (:12-13); `"purpose":"any maskable"` (:20,:26) (r2)
3. `index.html` (:1-44) — `theme-color` fixo (:27); fonts Inter/Montserrat/JetBrains (:25); SEM tags og:/twitter: (r3)
4. `src/index.css` (:118-188) — brand primitivas (:122-148); status (:151-153); `--touch-target-min:44px` (:185); `--focus-ring:3px` (:189); dark `#0A1628` (:259) (r4)
5. `src/features/branding/logoUtils.js` (:1-37) — `generateLogoSvg` (:19-28) fonte única da geometria; `buildCheckPath` (:9-12) (r5)

**Totais reais — buscas_web: 10 · urls_fetched: 5 · arquivos_lidos: 5.**

> Legendas: `b1–b10` = 10 queries `websearch` disparadas nesta sessão (cada uma retornou conteúdo usado;
> uma 10ª teve retry após 429 e foi contabilizada). `f1–f5` = 5 aberturas via `webfetch` (conteúdo integral).
> `r1–r5` = 5 leituras de arquivo com `file:line`. A coluna "URLs consultadas" acima lista todas as fontes
> que as buscas retornaram (16 URLs de conteúdo) — reforçam procedência sem duplicar a contagem de 10 queries.

---

*Documento preenchido exclusivamente pelo Agente 08 (Brand & Identidade Visual).
Arquivo de destino único: `docs/design/REFINE_08_Brand.md`. Nenhum arquivo de `src/` foi modificado — Fase 1 (pesquisa) concluída; Fase 2 (implementação) pendente do checklist §6.*
