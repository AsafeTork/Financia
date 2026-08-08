# REFINE_02 — Landing Page & Marketing

> Frente 2 da Fase 1 (pesquisa). Preenchido seguindo `docs/design/TEMPLATE.md` (seções 0–8).
> Nenhum código de produção foi alterado. Fontes: buscas web e fetches reais desta sessão +
> arquivos do repo lidos (file:line). Ver §7 log de coleta.

## 0. Ficha do agente

```yaml
frente: Landing Page & Marketing
agente_data: 2026-08-08
buscas_web: 12
urls_fetched: 8
repo_arquivos_lidos: 12
doc_linhas: 435
skills_usadas: frontend-craft (design-taste-frontend.md)
```

---

## 1. Diagnóstico atual (ESTADO REAL, com evidência)

### 1.1 Estrutura existente (o que a landing já tem)

`src/features/landing/Landing.jsx` é um SPA de página única com 594 linhas e as seções:

| Seção | Linhas | Estado |
|-------|--------|--------|
| Navbar sticky com blur | `Landing.jsx:110-127` | ✅ existe |
| Hero split (texto esq. + mockup CSS dir.) | `Landing.jsx:132-243` | ⚠️ mockup div, sem imagem real |
| Social proof (stats + logos placeholder) | `Landing.jsx:246-272` | ⚠️ números sem origem + logos fictícios |
| Mockup dashboard (KPIs + gráfico + mov.) | `Landing.jsx:275-356` | ⚠️ mock CSS (div bars) |
| Mockup transações (off-white) | `Landing.jsx:358-410` | ⚠️ mock CSS |
| Features (4 cards) | `Landing.jsx:412-433` | ✅ ok, mas sem visual variação |
| Pricing (3 cards, sem toggle) | `Landing.jsx:436-522` | ⚠️ sem toggle anual/mensal |
| FAQ accordion | `Landing.jsx:524-545` | ✅ ok |
| CTA final (brand-grad) | `Landing.jsx:548-574` | ✅ ok |
| Footer | `Landing.jsx:576-589` | ✅ ok |

### 1.2 Pontos frágeis (com evidência)

**F1 — Copy do hero genérica (CRO Tier 1 em falta).**
H1 = "Suas finanças no controle total" (`Landing.jsx:142-145`). Não comunica *o que* o produto
entrega em <3s nem *para quem* (falta o outcome concreto; skill `design-taste-frontend.md:236-246`
exige headline máx. 2 linhas + subtexto ≤20 palavras). Subtexto "Vendas, despesas e estoque do seu
negócio em um só lugar. Sem planilha, sem complicação." (`Landing.jsx:147-150`) é a parte mais clara.
CTA primário "Criar conta grátis" (`Landing.jsx:153`) é bom (verbo + benefício), mas o secundário
"Ver planos" (`Landing.jsx:157`) divide a intenção primária na mesma dobra.

**F2 — Prova social sem fonte.**
- `useCountUp(2800, ...)` e `useCountUp(95, ...)` (`Landing.jsx:90-91`) animam "2.8k+ empresas" e
  "95% avaliam como excelente"; há ainda "4.9 avaliacao media nas lojas" (`Landing.jsx:261`).
  Números precisos inventados = "fake-precise numbers" (proibido em `design-taste-frontend.md:327-330`;
  CRO exige números com origem, `robpalmer`). Não há fonte (loja/app store real, pesquisa, analytics).
- Logos "Mercado Livre, Shopee, Magalu, Nuvemshop, Correios" com `opacity-30` (`Landing.jsx:266-270`)
  são marcas reais usadas como clientes sem vínculo real — prova social fabricada (risco de confiança;
  `launchwall`: logo wall com marca que não é cliente destrói credibilidade).
- **Não existe seção de depoimentos.** Benchmark (`bestsaaswebdesigns`): depoimento com nome+cargo
  verificável e número concreto converte; sem isso, a faixa de stats não sustenta.

**F3 — Mockups de produto feitos de div (anti-slop + custo de manutenção).**
Hero mockup é inteiramente CSS: barras `MOCK_CHART`, cards flutuantes, `preview-card`
(`Landing.jsx:47-56`, `174-241`, `275-355`). A skill bane "Div-based fake screenshots"
(`design-taste-frontend.md:290-296`) e recomenda screenshot real do produto ou preview de componente.
Além do aspecto "fake", cada seção replica a mesma composição (card + barras) — repetição de família
de layout (banido em `design-taste-frontend.md:251-252`).

**F4 — Pricing sem toggle e sem âncora.**
`PRICING_PLANS` (`src/lib/constants.js:104-123`) só tem preço mensal (`/mês`). A seção
(`Landing.jsx:444-506`) renderiza 3 cards iguais; "Pro" é o "Mais escolhido" (`Landing.jsx:456-459`).
Sem toggle anual/mensal ("Save 20%"), sem tabela comparativa, sem preço âncora Enterprise.
CRO de pricing (`gogochimp`): estrutura (toggle + comparison table + FAQ) responde por 12–30% de lift,
mais que copy (2–6%).

**F5 — Ausência de badges PWA/offline/install.**
A landing vende "Funciona offline" (`Landing.jsx:67`) e o app é PWA instalável (Workbox,
`vite.config.js` + `src/sw.ts`, WORKSPACE §2) — mas a landing **não** tem badge de instalação nem
prova visual do offline. `web.dev/promote-install`: a landing é o lugar certo para promover install;
o valor deve vir depois do value prop.

**F6 — LCP/performance sem alvo explícito.**
`index.html` já tem `preconnect`/`dns-prefetch` de fontes e `<noscript>` (`index.html:17-26`), e o
nav logo tem `fetchPriority="high"` (`Landing.jsx:113`). Mas o LCP da landing é o H1 em
`var(--brand)` (texto — bom) — o mockup do hero usa `backdrop-filter: blur(8px)` e `blur(60px)` nos
orbes (`Landing.jsx:104-106, 226, 234`), que custam GPU em mobile. Nenhum asset de hero é pré-carregado
(ex.: screenshot do app), então um screenshot novo pode virar LCP — precisa `fetchpriority=high`
(`web.dev/optimize-lcp`).

**F7 — Acessibilidade já endereçada parcialmente.**
Buttons têm `min-h-[44px]` (`Landing.jsx:122, 153, 479`), focus ring global (`src/index.css:37`),
`prefers-reduced-motion` (`src/index.css:47-50`). FAQ usa `<button>` (`Landing.jsx:532`) — ok.
Pontos: botões do hero usam `style` inline com `hover:brightness-110` (`Landing.jsx:122`) e não há
`aria-pressed`/aria-expanded no accordion (`Landing.jsx:531-541`). Não regredir (WCAG 2.2 AA).

**F8 — Brand dinâmica na landing.**
`App.jsx:135,139` passa `brand={s.brand}` para a Landing (pré-login, usa defaults Free `#0F3D3E`).
A landing usa `var(--brand)`/`--brand-grad` em tudo (`Landing.jsx:114, 122, 142, 153`...), então
respeita o theming — mas CTAs com `color: '#fff'` sobre `--brand-grad` (`Landing.jsx:122, 153, 480`)
podem falhar contraste se o admin setar branco-label claro (ver §4.4).

---

## 2. Benchmark externo (pesquisa web desta sessão)

| # | Referência (nome) | URL real | 2–4 insights específicos "copiáveis" |
|---|-------------------|----------|--------------------------------------|
| 1 | Conta Azul (BR, ERP financeiro) | https://contaazul.com | Hero "Seu negócio no azul começa aqui." com CTA "Comece Grátis" em dobra. Pricing segmentado por faturamento (ME/MEI) com âncora de economia em R$ ("Você economiza R$ 50,00 por mês") + desconto em % por tempo limitado. Copy fala de dor (controle financeiro em um só lugar) e entrega "dados em tempo real". |
| 2 | Asaas (BR, conta PJ) | https://www.asaas.com | Headline = value prop com dor ("Conta digital PJ completa e **sem mensalidade**"). CTA único "Criar conta grátis" + microcopy de comunicações/LGPD logo abaixo. "Resolva tudo em um só lugar" como subbenefício. FAQ integrado logo abaixo do fold. |
| 3 | Banco Inter — Conta MEI (BR) | https://www.inter.co/empresas/conta-digital/mei/ | Prova social com número específico e verificável ("Já simplificamos a vida de mais de 1 milhão de microempreendedores"). Tempo-para-valor concreto ("Sua conta aberta em menos de 5 minutos"). Sub-benefícios em grid de cards ("100% digital, gratuita e completa"). |
| 4 | DesignRevision — 15 fintech landings 2026 | https://designrevision.com/blog/fintech-saas-landing-pages | Padrão comum: headline ataca dor (não feature); um CTA primário; ≥1 trust signal perto do CTA; **product visualization real** (Mercury/Brex mostram dashboard real com números realistas — não ilustração). "Quantify social proof in dollars processed, not customers served". "Show your product, not illustrations of your product". |
| 5 | Atif Saleem — landing trends 2026 | https://atifsaleem.com/blog/landing-page-design-trends-2026 | Fórmula 2026: H1 claro (what+who+outcome) → 1 CTA → trust strip → bento de 3–6 value props com **visual real** → pricing → FAQ ("great for AI SEO") → CTA secundário. Bento hero absorve 3× mais info no mesmo scroll. Banido: full-page video backgrounds (mata LCP) e auto-rotating carousels. Motion deve servir significado, não se performar. |
| 6 | Rob Palmer — CRO checklist (37 fixes) | https://robpalmer.com/blog/conversion-rate-optimization-checklist | Copy Tier 1 (headline, value prop, CTA, proof) responde por **50–200%+** dos swings de conversão; headline ≈ 80% do desempenho da página. CTA deve completar "I want to..." ("Start My Free Trial", não "Submit"). Prova deve ser específica ("increased conversion from 1.8% to 4.3% in 60 days"), não elogio vago. Speed é Tier 2/3, não compensa copy quebrada. |
| 7 | WordStream — landing copywriting | https://www.wordstream.com/blog/landing-page-copywriting | Linguagem simples (nível 5ª–7ª série) converte mediana +56% vs texto de nível superior. "Watch a demo" converteu **+139%** vs "Request a demo" (remove fricção de agendar). Headline clara > headline criativa. Evite reassurance que introduz hesitação. |
| 8 | GoGoChimp — pricing page CRO 2026 | https://www.gogochimp.com/blog/saas-pricing-page-cro-2026 | Toggle anual/mensal **default mensal** + "Save 20%" visível = converte melhor (âncora: primeiro número vira referência; anual-default viola transparência). Comparison table + FAQ + named logos juntos = lift 18–24%. **Estrutura (12–30%) > copy (2–6%)** — mexa na estrutura primeiro. |
| 9 | TheMarketingJuice — annual vs monthly | https://themarketingjuice.com/saas-pricing-strategy-annual-vs-monthly-plan-default/ | Qual tab está ativa no load é decisão comercial, não estética. Monthly-first reduz barreira p/ tráfego de baixa intenção (caso da landing pública). Desconto anual >30% sinaliza que o mensal era irreal. |
| 10 | web.dev — Optimize LCP | https://web.dev/articles/optimize-lcp | LCP <2.5s p/ 75% das visitas. LCP resource deve ser discoverable no HTML (preload scanner) — `fetchpriority="high"` em UM asset (mais de 1-2 anula o efeito). Nunca `loading="lazy"` no LCP. Fontes com `font-display` ≠ auto/block. Reduzir CSS render-blocking (critters já inline — `vite.config.js`). |
| 11 | web.dev — Patterns for promoting PWA installation | https://web.dev/articles/promote-install | Landing page é o lugar apropriado para "go large" com benefícios de instalação, **após** o value prop. Explique o ganho ("instala instantaneamente, sem loja; quase sem espaço no aparelho; funciona offline"). Só renderizar instruções manuais (iOS) em browser mode, não standalone. |
| 12 | Devices.css (pure CSS device mockups) | https://github.com/picturepan2/devices.css | Mockups de device em CSS puro (~29KB), escaláveis, para exibir screenshots reais com moldura de iPhone/desktop sem imagem de stock. Alternativa sem lib pesada: reutilizar padrão de moldura já existente no hero (navbar dots em `Landing.jsx:184-189`) envolvendo screenshot real. |
| 13 | BestSaaSWebDesigns — testimonials que convertem | https://bestsaaswebdesigns.com/blog/saas-testimonial-sections-that-convert | Padrão dominante: **stat-first, quote-second** (número grande + quote como apoio). Cargo exato verificável ("Director of Complex Rehab at King Drug") faz mais credibilidade que foto. Número concreto ("260 faxes in one day") lê como real; sentimento genérico lê como boilerplate. |
| 14 | LaunchWall — testimonial placement | https://launchwall.online/blog/testimonial-page-examples | Prova social deve estar na página de decisão (home/pricing), não em `/testimonials`. Segmentar por tipo de cliente (freelancer vs empresa) multiplica persuasão. Featured quote + grid curto = hierarquia (quote forte pro não-rolador + volume pra quem quer evidência). |
| 15 | GPJA + Daniel Bogo (pt-BR, CRO) | https://gpja.com.br/post/landing-pages-que-convertem-estrutura-copy-e-provas-sociais ; https://danielbogo.com.br/blog/melhores-praticas-de-landing-page-que-convertem/ | Título comunica benefício em 3–5 palavras; CTA "Comece grátis por 7 dias" > "Saiba mais". Prova social com nome, cidade e resultado (detalhe pequeno = crível). Ordem: benefícios → como funciona → credibilidade → objeções. Microcopy com verbo específico ("Receber Plano", não "Enviar"). Menos campos = menos atrito (nome + e-mail). LGPD: privacidade visível (Asaas mostra política logo abaixo do CTA). |

---

## 3. Oportunidades priorizadas (P0 / P1 / P2)

| Prioridade | Oportunidade | Arquivo(s) alvo | Impacto (percepção/perf/conv) | Esforço | Risco |
|-----------|--------------|-----------------|-------------------------------|---------|-------|
| P0 | **Copy CRO Tier 1 do hero**: headline com benefício+prazo concretos (≤2 linhas), subtexto ≤20 palavras, CTA único de intenção ("Criar conta grátis" em todo o page, remover "Ver planos" da dobra) | `Landing.jsx:142-171` | conv: alto (headline ≈80% do desempenho; 50–200% swings) | baixo | baixo |
| P0 | **Prova social real**: substituir logos fictícios (`Landing.jsx:266-270`) e stats sem fonte (`Landing.jsx:90-91, 253-263`) por 3 depoimentos reais (nome+cargo+resultado, formato stat-first) com origem verificável; remover precisão inventada | `Landing.jsx:246-272` | conv/percepção: alto | baixo | baixo |
| P0 | **Hero visual real + LCP**: substituir mockup div do hero por screenshot real do app (dashboard/offline) preloadado com `fetchpriority="high"` (WebP/AVIF), mantendo moldura existente; remover blur pesado em mobile | `Landing.jsx:174-241`, `index.html`, `public/` | perf (LCP <2.5s) + percepção premium | médio | baixo |
| P1 | **Pricing CRO**: toggle anual/mensal default mensal + badge "economize 20%", tabela comparativa compacta, preço âncora, FAQ alinhado | `Landing.jsx:436-522`, `src/lib/constants.js:104-123`, `src/features/plans/PlansView.jsx` | conv: médio-alto (estrutura 12–30%) | médio | médio (requer preço anual no Stripe/gating — coordenar com Frente 10) |
| P1 | **Seção PWA/offline + install**: badges "Instala em segundos · funciona offline · sem loja" após o value prop; CTA install (com `beforeinstallprompt` deferido) + instrução manual iOS | `Landing.jsx` (nova seção após §Features ou no hero), `src/shared/ui/` (hook install) | conv/instalação: médio-alto | médio | baixo |
| P1 | **Bento de features com variação visual**: trocar grid de 4 cards iguais (`Landing.jsx:412-433`) por bento assimétrico (1×2 hero feature + células 1×1) com 2–3 células com visual real (screenshot mini, gradiente brand, mock do produto) | `Landing.jsx:412-433` | percepção: alto | médio | baixo |
| P2 | **FAQ a11y**: `aria-expanded`/`aria-controls` no accordion (`Landing.jsx:531-541`) + chevron com `prefers-reduced-motion` | `Landing.jsx:524-545` | a11y | baixo | baixo |
| P2 | **Copy pt-BR revisão completa** (acentos): textos atuais sem acentuação ("Nao", "Voce", "gratis") em `Landing.jsx:67-77, 147-149, 249-258` | `Landing.jsx` (strings) | percepção de qualidade | baixo | baixo |
| P2 | **SEO on-page**: title/meta description ricos + JSON-LD Product/FAQ em `index.html:5-8` (FAQ section já ótima p/ AI SEO) | `index.html` | aquisição orgânica | baixo | baixo |

**Critério P0** (per TEMPLATE): impacto visível/conversão alto + risco baixo + mudança localizada — os três itens P0 são puramente na landing, sem tocar gating/Stripe/RLS.

---

## 4. Especificação técnica aplicável (pronta para implementação)

> Apenas especificação. Fase 2 implementa em `src/`. Segue tokens existentes do design system
> (`src/index.css:122-256`), sem libs novas, sem tocar rota pós-login (`routes.jsx` não muda).

### 4.1 Tokens (existentes — reutilizar, criar só o mínimo)

| Token | Valor | Fonte | Uso |
|-------|-------|-------|-----|
| `--brand-grad` | `linear-gradient(135deg, var(--navy) 0%, var(--teal) 100%)` | `index.css:148` | CTA primário, badge "Mais escolhido", CTA final |
| `--brand-accent` | `var(--teal)` `#1a6b5c` | `index.css:146` | eyebrows, links, ticks de benefício |
| `--bg-subtle` | `var(--off-white)` | `index.css:134` | seções alternadas |
| `--text-display` | `clamp(2.5rem, 5vw, 4rem)` | `index.css:161` | H1 hero |
| `--text-h1` | `clamp(2rem, 4vw, 3rem)` | `index.css:162` | H2 de seção |
| `--radius-2xl` | `1.5rem` | `index.css:200` | cards pricing, CTA final |
| `--shadow-xl` | navy-tinted | `index.css:207` | cards elevados |
| `--success` | `#15803d` | `index.css:151` | checks "Sem cartão", offline badge |
| `--touch-target-min` | `44px` | `index.css:185` | todos os botões/links clicáveis |
| `--focus-ring` | `3px solid var(--brand)` | `index.css:188` | foco visível (já global em `index.css:37`) |

Novos tokens mínimos (opcionais, em `:root` de `index.css`):
```css
/* badges PWA/offline e âncora de preço — só se precisar de valor estável */
--landing-badge-bg: var(--brand-accent-soft);        /* fundo de badges de seção */
--landing-maxw: 72rem;                               /* container da landing (default 80rem é largo demais p/ copy marketing) */
```

### 4.2 Hero — copy e estrutura recomendada

Layout mantém o split existente (`grid lg:grid-cols-2`, `Landing.jsx:133`). Mudanças:

```
Eyebrow:  badge "Para o pequeno negócio brasileiro"  (já existe, Landing.jsx:137)
H1 (≤2 linhas, outcome concreto, pt-BR, com acentuação):
  "Vendas, despesas e estoque
   no controle, mesmo offline"
   — ou variante com prazo: "Organize suas finanças
   do caixa em menos de 1 minuto"
Subtexto (≤20 palavras):
  "Registre vendas e despesas no celular ou no computador.
   Funciona sem internet e sincroniza sozinho."
CTA primário (único na dobra):  "Criar conta grátis"  → onEnter
Microcopy abaixo do CTA: "Sem cartão de crédito · pronto em 1 minuto"  (já existe, Landing.jsx:163)
```

Regras aplicadas: headline comunica dor+resultado em <3s (`robpalmer`, `wordstream`); subtexto
≤20 palavras/4 linhas (`design-taste-frontend.md:236-246`); um único CTA de intenção signup em toda
a página (`design-taste-frontend.md:227`); acentuação correta.

### 4.3 Prova social real — padrão stat-first

Estrutura (substitui `Landing.jsx:246-272`; manter `<section>` com `useScrollReveal`):

```
[eyebrow] "Quem já usa"            (1 eyebrow a cada 3 seções — Landing usa 6 hoje → cortar para ≤3)
H2: "Pequenos negócios reais, números reais"
Grid 3 col:
  Card depoimento (stat-first):
    stat:  "R$ 12.400/mês de receita organizada"
    quote: "Deixei a planilha. Agora sei o lucro do mês no dia seguinte."
    attr:  "Ana — loja de roupas, Belém/PA"
  (repetir 3× com dados reais de clientes — origem: depoimentos coletados/avaliados via WhatsApp,
   nunca inventados; ver §6.7)
```

Regras: stat-first/quote-second (`bestsaaswebdesigns`); atribuição nome+função+cidade
(`gpja`, `launchwall`); se ainda não houver depoimentos reais, usar placeholder explícito
`<!-- TODO: depoimentos reais -- coletar via WhatsApp -->` em vez de inventar
(`design-taste-frontend.md:327-330`). Remover `useCountUp` (números sem origem) ou trocar por
métricas com fonte (ex.: "50 transações no plano grátis" é feature, não prova).

### 4.4 Hero visual real + LCP

1. **Asset**: screenshot real do dashboard (`src/features/dashboard/Dashboard.jsx` em estado com
   dados de exemplo) exportado como `public/screens/dashboard.webp` (~1200px) e `dashboard-avif.avif`.
2. **Markup** (substitui mockup div, `Landing.jsx:174-241`; manter moldura/browser-bar que já existe
   em `Landing.jsx:184-189`):
```jsx
<div className="relative rounded-[20px] overflow-hidden" style={{ background:'var(--bg-card)', border:'1px solid var(--border)', boxShadow:'var(--shadow-xl)' }}>
  {/* browser bar existente */}
  <img src="/screens/dashboard.avif" alt="Dashboard do Financia mostrando entradas, saídas e saldo"
       fetchpriority="high" decoding="async" width="960" height="600"
       style={{ width:'100%', height:'auto' }} />
</div>
```
3. **index.html**: `<link rel="preload" as="image" href="/screens/dashboard.avif" fetchpriority="high">`
   no head (discoverable pelo preload scanner, `web.dev/optimize-lcp`). Sem `loading="lazy"` no LCP.
4. **Mobile perf**: remover `filter: blur(60px)` dos orbes (`Landing.jsx:104-106`) atrás de
   `@media (max-width: 768px)` ou trocar blur por gradiente estático (blur em fixed layer custa GPU
   em celular).
5. **Contraste CTA**: `color:'#fff'` sobre `--brand-grad` só é seguro no tema default (navy→teal,
   `index.css:148`). Se white-label claro for possível na landing, usar `color:'var(--bg-card)'` +
   testar ≥4.5:1 (ou manter defaults — landing é pré-login, `App.jsx:135`).

### 4.5 Pricing CRO (P1 — especificar agora, coordenar billing)

Estado-alvo do toggle (default mensal — decisão comercial, `themarketingjuice`):
```
[ MENSAL ]  [ ANUAL · economize 20% ]   ← default mensal; badge aparece ao ativar anual
```
- Preço anual exibido = `Math.round(mensal * 12 * 0.8)`; requer suporte real no Stripe/gating —
  **não** exibir preço que o checkout não cobra (coordena com Frente 10 e `PlansView.jsx`).
- Manter 3 tiers (Grátis/Pro/Premium, `constants.js:104-123`), Pro dominante via `popular`
  (já `Landing.jsx:456-459`). Sem tier inventado "Enterprise" sem valor real
  (`gogochimp`: âncora só funciona se o premium for real).
- Tabela comparativa compacta opcional (≥3 linhas) + FAQ logo abaixo (já existe, `Landing.jsx:524-545`).
- Estimativa de lift combinado: +18–24% (comparison + FAQ + named logos, `gogochimp`).

### 4.6 Badges PWA/offline/install (P1)

Nova seção fina (ou faixa dentro do hero abaixo do microcopy — depois do value prop,
`web.dev/promote-install`):

```
Badge row: [✓ Funciona offline] [✓ Instala como app em segundos] [✓ No celular e no PC]
CTA install (primário para mobile): captura `beforeinstallprompt` em hook reutilizável
  (ex.: `src/shared/hooks/usePwaInstall.js`), senão fallback iOS com instruções manuais
  (Safari Share → "Adicionar à Tela de Início"); só renderizar em browser mode
  (`matchMedia('(display-mode: browser)')`).
```

Offline-first não é quebrado: a landing é estática (não usa Dexie/sync), badges são apenas UI.

### 4.7 Bento de features (P1)

Substituir `Landing.jsx:420-432` (4 cards iguais) por grid bento assimétrico:
```
grid grid-cols-1 md:grid-cols-3 gap-5  (variância alta, sem repetição de família)
  célula A (md:col-span-2): "Funciona offline" — visual: screenshot mini do app offline
  célula B (1):             "Ao vivo entre celulares" — gradiente brand + ícone
  célula C (1):             "Vendas, despesas e estoque" — ícone grande
  célula D (md:col-span-2): "Relatórios que decidem" — mini gráfico real (SVG, não barras div)
```
Celular: reordenar por importância (`saasframe`), nunca repetir 3× o mesmo card.

### 4.8 Estados e dark mode

- **Estados**: hover CTAs `brightness(1.05)`/`translateY(-0.5px)` (já em `Landing.jsx:122`);
  `:active` `scale(0.97)` (`.btn:active` global `index.css:35`); foco `--focus-ring` global.
  Loading do screenshot: `decoding="async"` + `background: var(--bg-subtle)` no container (sem
  spinner genérico).
- **Empty (prova social)**: enquanto não há depoimentos reais, seção com placeholder explícito
  (`<!-- TODO -->`) e stats removidos.
- **Dark**: a landing segue `[data-theme="dark"]` (`index.css:258-291`) pois usa só tokens;
  manter `--bg-card`/`--text-main`/`--border` (não hardcodear brancos). Os orbes e gradientes
  brand já são tokens.

---

## 5. Dependências & libs (se aplicável)

| Lib/Melhor | Versão (pesquisada) | Por quê | Custo ~KB gzip | Alternativa sem custo |
|---|---|---|---|---|
| — (nenhuma nova recomendada) | — | Landing deve ficar sem libs novas (README §Restrições: bundle enxuto, SVG inline, CSS custom) | 0 | `devices.css` (~29KB) para molduras de device, se optar por moldura pronta — mas a moldura do hero já existe em `Landing.jsx:184-189`; não instalar |
| AVIF/WebP do screenshot | nativo (`<img srcset>`) | LCP <2.5s, -50–95% vs PNG (`web.dev/optimize-lcp`, MDN fix-image-lcp) | 0 | PNG (maior) |
| `@phosphor-icons/react` | já no projeto (VISUAL_IDENTITY.md §9) | ícones em vez de path SVG manual (`design-taste-frontend.md:141-145`) | já no bundle | SVG inline atual (manter) |

Conclusão: **zero dependências novas** — segue D008/DECISIONS (sem GSAP/libs gordas no main).

---

## 6. Checklist para os 10 implementadores (Fase 2)

> Ordem sugerida evita conflito entre frentes (Frente 2 toca só `Landing.jsx`, `index.html`,
> `public/screens/`). Frente 1 (tokens) e Frente 10 (pricing/billing) interagem — coordenar.

- [ ] **6.1 (P0) Hero copy** — `src/features/landing/Landing.jsx:142-171`: novo H1 outcome+prazo
  (≤2 linhas), subtexto ≤20 palavras, remover "Ver planos" da dobra (deixar 1 CTA primário
  "Criar conta grátis"), acentuar texto pt-BR.
- [ ] **6.2 (P0) Prova social real** — `Landing.jsx:246-272`: remover logos fictícios e stats sem
  origem; adicionar 3 depoimentos stat-first reais OU placeholder explícito `<!-- TODO -->`;
  cortar eyebrows para ≤3 no total da página (hoje há 6: `Landing.jsx:249, 277, 362, 415, 439, 555`).
- [ ] **6.3 (P0) Hero visual + LCP** — exportar screenshot real (`public/screens/dashboard.avif`
  + `.webp`), preload no `index.html:17-26` com `fetchpriority="high"`, `srcset` para mobile;
  remover `blur(60px)` pesado em mobile (`Landing.jsx:104-106`); manter moldura existente.
- [ ] **6.4 (P1) Pricing toggle** — coordena com Frente 10 (preço anual real no Stripe/gating).
  `Landing.jsx:444-506`: toggle mensal default + "economize 20%" (só exibir se billing suportar);
  tabela comparativa compacta.
- [ ] **6.5 (P1) PWA/offline badges + install** — nova seção/fira após features; hook
  `usePwaInstall` reutilizável (captura `beforeinstallprompt`, fallback iOS manual, só em
  `display-mode: browser`). Sem quebrar `src/sw.ts`/Workbox.
- [ ] **6.6 (P1) Bento features** — `Landing.jsx:412-433`: grid assimétrico com variação visual
  (screenshot mini, gradiente, SVG real); reordenar por importância em mobile.
- [ ] **6.7 (dados reais)** — coletar depoimentos/números verdadeiros via WhatsApp/suporte
  (`SUPPORT_EMAIL`, `constants.js:58`) e só então trocar placeholders; **nunca** inventar
  métrica/marca (proibido: `design-taste-frontend.md:327-330`, §2.1 AGENTS.md).
- [ ] **6.8 (a11y/SEO)** — `aria-expanded`/`aria-controls` no FAQ (`Landing.jsx:531-541`);
  `<title>`/meta description ricos + JSON-LD Product/FAQ em `index.html:5-8`.

**Verificação leve (não rodar suíte pesada — laptop fraco; delegar conforme WORKSPACE §2):**
- `npm run validate:fast` (lint+typecheck+test dos alterados).
- `npm run build` para confirmar que `preload as="image"` e `srcset` não quebram o bundle.
- Lighthouse navigation na rota `/` (LCP <2.5s, CLS <0.1) — orquestrador roda no CI.

**Pontos que NÃO podem quebrar (README §Restrições):**
- Rota pós-login: `routes.jsx` e `App.jsx:135-141` NÃO mudam; landing segue como `LazyPage`.
- Offline-first: nenhum novo fetch de API na landing; screenshot é estático no `public/`
  (entra no precache do SW Workbox via `injectManifest`).
- `--brand` dinâmico: usar sempre tokens; CTAs com `color: var(--bg-card)` se white-label claro.
- D008: sem GSAP/JS de scroll pesado; `useScrollReveal` (`Landing.jsx:82-88`) já existe e basta.

---

## 7. Log de coleta (transparência — auditável)

| # | Tipo (busca/fetch/leitura) | Alvo (query/URL/arquivo) | Conhecimento extraído |
|---|---------------------------|--------------------------|------------------------|
| 1 | leitura | `docs/design/README.md` (48 linhas) | Protocolo: ≥10 buscas, ≥5 fetches, ≥5 arquivos; retorno ≤6 linhas; proibido criar arquivos |
| 2 | leitura | `docs/design/TEMPLATE.md` (74 linhas) | Estrutura obrigatória seções 0–8; tabela benchmark ≥5 linhas; critério P0 |
| 3 | leitura | `docs/design/REFINE_02_Landing.md` (29 linhas) | Escopo da frente: hero, seções, copy pt-BR, CRO, trust, pricing, badges PWA/offline |
| 4 | leitura | `src/features/landing/Landing.jsx` (594 linhas, integral) | Seções atuais, mockups div, stats fictícios, FAQ, pricing sem toggle, logo nav preload |
| 5 | leitura | `src/routes/routes.jsx` (90 linhas) | Rota pós-login não muda; `pathMap` não toca landing |
| 6 | leitura | `src/index.css` (448 linhas) | Tokens disponíveis (`--brand-grad:148`, `--brand-accent:146`, `--text-display:161`, dark mode `258-291`, reduced motion `47-50`) |
| 7 | leitura | `src/App.jsx:1-160` | Rota da landing (`135,139`), `brand={s.brand}` passado, `LazyPage` |
| 8 | leitura | `VISUAL_IDENTITY.md` (434 linhas) | Fontes Montserrat/Inter/JetBrains, regra CTA ≤3 palavras, orbes decorativos §10.2 |
| 9 | leitura | `src/lib/constants.js:55-174` | `PRICING_PLANS` (só mensal), `waLink`, `WHITELABEL`, `SUPPORT_EMAIL`, `THEME_PRESETS` |
| 10 | leitura | `src/shared/styles/design-tokens.css` (76 linhas) | Focus ring/btn/input globais, overlap com `index.css` |
| 11 | leitura | `index.html` (44 linhas) | Preconnects, CSP, noscript, falta meta description rica e preload de imagem |
| 12 | leitura | `.agents/skills/frontend-craft/reference/design-taste-frontend.md` (611+ linhas) | Anti-slop: banir fake screenshots div, fake-precise numbers, CTA wrap, eyebrows ≤1/3, contrast check |
| 13 | busca | "best fintech SaaS landing page 2025 2026 Nubank Inter conversion" | DesignRevision 15 exemplos; pattern: headline dor, 1 CTA, trust signal, dashboard real, social proof em $ |
| 14 | busca | "pricing page design best practices annual monthly toggle SaaS 2025" | themarketingjuice + gogochimp + verlua: default mensal, save-20%, estrutura > copy |
| 15 | busca | "CRO conversion rate optimization landing page checklist 2026" | robpalmer 37 fixes: copy Tier 1 = 50-200% swings, headline ~80%; convertcart 45-point |
| 16 | busca | "hero section design trends 2025 bento grid gradients marquee" | atifsaleem + saasframe bento (67% do top-100 PH) + uidrop split hero; banir video bg/carousel |
| 17 | busca | "landing page Nubank Inter Asaas Conta Azul design conversão BR" | Conta Azul/Asaas/Inter MEI: headline com dor+isenção, CTA grátis, segmentação por faturamento, prova "1 milhão" |
| 18 | busca | "PWA install prompt app showcase mobile badge offline first marketing" | web.dev promote-install + MDN: landing é lugar de promover install; explicar valor; iOS manual em browser mode |
| 19 | busca | "LCP optimize hero image preload 2025 best practices" | web.dev optimize-lcp (fetchpriority high em 1 asset, sem lazy no LCP) + MDN fix-image-lcp (AVIF -95%) |
| 20 | busca | "device mockup CSS purely code phone browser frame" | devices.css (29KB) + liquidframe (pure-CSS iPhone chrome) + device.css — zero-dep mockups |
| 21 | busca | "dark mode landing page SaaS 2025 premium fintech" | Fey dark design system: pill CTA, gradient text h1, ban 8px buttons; Studio Slate Reckon: dark olive fintech |
| 22 | busca | "copywriting conversão português Brasil CTA prova social" | gpja + danielbogo: título 3-5 palavras, CTA específico, prova com nome/cidade, LGPD; wordstream |
| 23 | busca | "testimonial social proof design patterns 2025 grid marquee" | launchwall + bestsaaswebdesigns + koe: stat-first/quote-second, cargo verificável, placement na página de decisão |
| 24 | busca | "offline first app marketing works offline PWA trust small business" | Venturus/Spartan PWA case (offline como diferencial de vendas) + aseanup Brasil trust cues (CNPJ/LGPD) + hopeleaf PWA small business |
| 25 | fetch | https://contaazul.com (404 em /precos; root ok) | Hero "Seu negócio no azul", preços segmentados por faturamento, desconto %, "Comece Grátis" |
| 26 | fetch | https://www.asaas.com | Headline dor "sem mensalidade", CTA "Criar conta grátis", LGPD junto do CTA, FAQ no fold |
| 27 | fetch | https://www.inter.co/empresas/conta-digital/mei/ | "conta em menos de 5 minutos", "1 milhão de microempreendedores", grid de benefícios |
| 28 | fetch | https://designrevision.com/blog/fintech-saas-landing-pages | 15 exemplos + tabela de padrões que convertem (Stripe/Mercury/Brex/Wise) |
| 29 | fetch | https://web.dev/articles/optimize-lcp | Metodologia LCP: discoverable HTML, fetchpriority high único, font-display, TTFB |
| 30 | fetch | https://web.dev/articles/promote-install | Padrões de promoção de install; landing = go large; contexto do usuário |
| 31 | fetch | https://github.com/picturepan2/devices.css | Moldura de device em CSS puro, HTML padrão, scalable |
| 32 | fetch | https://robpalmer.com/blog/conversion-rate-optimization-checklist | Checklist 37 pontos por tier; headline 80%; prova específica; testar 1 por vez |
| 33 | skill | `frontend-craft` → `reference/design-taste-frontend.md` | Direção anti-slop p/ landing; dails; bento; provas; CTAs; eyebrows; fake screenshots ban |

---

## 8. Fontes completas

### URLs (todas acessadas/fetched nesta sessão)
1. https://contaazul.com (fetch)
2. https://www.asaas.com (fetch)
3. https://www.inter.co/empresas/conta-digital/mei/ (fetch)
4. https://designrevision.com/blog/fintech-saas-landing-pages (fetch)
5. https://web.dev/articles/optimize-lcp (fetch)
6. https://web.dev/articles/promote-install (fetch)
7. https://github.com/picturepan2/devices.css (fetch)
8. https://robpalmer.com/blog/conversion-rate-optimization-checklist (fetch)
9. https://www.saasframe.io/landing-page-examples/fintech (search)
10. https://www.saasframe.io/blog/designing-bento-grids-that-actually-work-a-2026-practical-guide (search)
11. https://themarketingjuice.com/saas-pricing-strategy-annual-vs-monthly-plan-default/ (search)
12. https://www.gogochimp.com/blog/saas-pricing-page-cro-2026 (search)
13. https://www.verlua.com/blog/pricing-page-design-guide (search)
14. https://atifSaleem — atifsaleem.com/blog/landing-page-design-trends-2026 (search; DNS falhou no re-fetch, conteúdo via search)
15. https://uidrop.app/blog/hero-section-design (search)
16. https://www.wordstream.com/blog/landing-page-copywriting (search)
17. https://www.convertcart.com/blog/landing-page-checklist (search)
18. https://gpja.com.br/post/landing-pages-que-convertem-estrutura-copy-e-provas-sociais (search)
19. https://danielbogo.com.br/blog/melhores-praticas-de-landing-page-que-convertem/ (search)
20. https://blog.nerau.com.br/case-de-cro-como-as-provas-sociais-podem-ajudar-na-conversao-de-formularios/ (search)
21. https://launchwall.online/blog/testimonial-page-examples (search)
22. https://bestsaaswebdesigns.com/blog/saas-testimonial-sections-that-convert (search)
23. https://koecollect.com/en/blog/testimonial-page-design-best-practices (search)
24. https://layout.design/gallery/fey (search — dark fintech design system)
25. https://studioslate.com.au/work/reckon (search — dark fintech case)
26. https://developer.mozilla.org/en-US/blog/fix-image-lcp/ (search)
27. https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable (search)
28. https://github.com/CVERInc/liquidframe (search)
29. https://famer.github.io/device.css/ (search)
30. https://aseanup.com/brazil-e-commerce-conversion-audit-30/ (search)
31. https://hopeleaftechnologies.com/progressive-web-apps-small-business/ (search)
32. https://www.venturus.org.br/en/insights/cases/how-we-redesigned-spartan-brasils-sales-system (search)

### Arquivos do repo lidos (file:line)
- `docs/design/README.md` (todo)
- `docs/design/TEMPLATE.md` (todo)
- `docs/design/REFINE_02_Landing.md` (todo)
- `src/features/landing/Landing.jsx:1-594` (todo)
- `src/routes/routes.jsx:1-90` (todo)
- `src/index.css:1-448` (todo)
- `src/App.jsx:1-160`
- `VISUAL_IDENTITY.md:1-434` (todo)
- `src/lib/constants.js:55-174`
- `src/shared/styles/design-tokens.css:1-76` (todo)
- `index.html:1-44` (todo)
- `.agents/skills/frontend-craft/reference/design-taste-frontend.md:1-611` (parcial, corte do tool)
- `.agents/skills/frontend-craft/SKILL.md` (skill carregada)
