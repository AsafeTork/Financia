# REFINE_05 — Performance Real & Percebida

> Preenchido seguindo `docs/design/TEMPLATE.md` (seções 0-8). Rodada anterior descartada;
> documento refeito do zero com coleta nova (10 buscas, 6 URLs abertas, 9 arquivos do repo, build real).

## Objetivo
Afinação técnica p/ LCP/INP/CLS + percepção "app nativo": fontes (estratégia completa: subset,
preload, display), preconnect API Supabase, bundle (manualChunks atual, rota-level lazy), PWA
cache strategies (Workbox atual), prefetch pós-idle, event handlers de listas virtualizadas,
uso do useTransition/useDeferredValue atual no TxView, budgets no CI.

---

## 0. Ficha do agente

```yaml
frente: performance-real-percebida
agente_data: 2026-08-08
buscas_web: 10
urls_fetched: 6
repo_arquivos_lidos: 9
doc_linhas: 497
skills_usadas: nenhuma (não disponível para esta frente — instrução PASSO 2)
```

---

## 1. Diagnóstico atual (ESTADO REAL, com evidência)

### 1.1 Build & otimização de bundle

| Área | Estado atual | Evidência (arquivo:linha lida) |
|---|---|---|
| Code-splitting de rotas | 8 rotas com `React.lazy` + `Suspense` compartilhado | `src/routes/routes.jsx:8-16` (lazy Dashboard/TxView/Inventory/Report/Email/Settings/Plans/BrandStudio) + `routes.jsx:83-87` (wrap `LazyPage`/`Suspense`) |
| Landing/legal também lazy | Sim — `Landing`, `PrivacyPolicy`, `TermsOfService`, `DebugBadge` | `src/App.jsx:34-37` |
| `manualChunks` por vendor | Função `manualChunks` com 12 buckets | `vite.config.js:120-139` (`react-vendor`, `supabase-vendor`, `stripe-vendor`, `ui-vendor`, `dexie-vendor`, `charts-vendor`, `utils-vendor`, `query-vendor`, `virtual-vendor`, `tailwind-vendor`, `ai-vendor`, `vendor-misc`) |
| Minificação | Terser 2 passes + `drop_console` + `pure_funcs` | `vite.config.js:150-164` |
| Critical CSS inline | Critters `preload:'media'`, `inlineFonts:true`, `noscriptFallback:true`, `reduceInlineStyles:true` | `vite.config.js:57-94` (options em 61-70) |
| PWA injectManifest | `vite-plugin-pwa` com `sw.ts` custom; precache `globPatterns` só `{js,css,html}` | `vite.config.js:23-54`; `globPatterns` em `:50`; `maximumFileSizeToCacheInBytes` 5MB em `:52` |
| Build (evidência real) | `npm run build` OK em 53.8s — sem erros | build desta sessão: `index-C5NAAM0I.js` 179.10 kB (51.17 gz), `react-vendor` 174.40 kB (56.85 gz), `dexie-vendor` 95.16 kB (30.71 gz), `index.css` 60.93 kB (12.49 gz), PWA precache 40 entradas (1052.66 KiB) |
| Chunk `supabase-vendor` | **praticamente vazio** — 0.00 kB (0.02 gz) | saída de build: `dist/assets/supabase-vendor-*.js 0.00 kB` — o bucket não recebeu os módulos Supabase (foram empacotados em `index`/`sync.worker`) |
| Warn 1 (build) | `src/lib/sync.js` importado dinamicamente por `useSyncLoop.js` **e** estaticamente por `AdminPanel.jsx`/`ClientEditModal.jsx`/`useSession.js`/`SettingsView.jsx` | saída de build: "dynamic import will not move module into another chunk" — impede o worker de fatiar `sync.js` num chunk próprio |
| Warn 2 (build) | Critters: "4 rules skipped" para `::view-transition-old(root)` / `::view-transition-new(root)` | saída de build: pseudo-elementos não suportados por css-select (cosmético, sem impacto funcional) |

### 1.2 Fontes

| Item | Estado | Evidência |
|---|---|---|
| Fontes usadas | Inter 400/500/600, Montserrat 600/700/800, JetBrains Mono 400/500 via Google Fonts CSS | `index.html:25` |
| preconnect | `preconnect` fonts.googleapis/gstatic | `index.html:17-18` |
| display | `&display=swap` no request do Google CSS | `index.html:25` |
| preload de woff2 | **não existe** — só preload de CSS | `index.html:19-20` (grep: nenhum `preload as="font"`) |
| subsetting manual | **não existe** (usa a CSS API do Google) | `index.html:25` — Google entrega subsets via `unicode-range`; o app não controla a granularidade |
| Supabase preconnect | **só `dns-prefetch`** — sem `preconnect` para a origin .supabase.co (que é o login/sync) | `index.html:22-24` |
| Fontes no SW | CacheFirst 365d p/ `fonts.gstatic.com` woff2 | `src/sw.ts:36-45` |

### 1.3 INP / run loop

| Item | Estado | Evidência |
|---|---|---|
| Sync em Web Worker | ✅ worker delegado à pipeline compartilhada | `src/workers/sync.worker.js:7-19`; criação do worker `useSyncLoop.js:65-78`; fallback main-thread `:112-133` |
| Backoff + jitter adaptativo | ✅ sim | `useSyncLoop.js:5-9` (BASE 30s / MAX 300s / mult 2 / jitter 10%) + `computeIntervalFor` `:11-13` |
| `useTransition` no filtro TxView | ✅ sim | `TxView.jsx:30-34` (startTransition) aplicado nos `onChange` `:245`, `:251-252` |
| Navegação com `startTransition` | ❌ não (troca de rota lazy pode segurar render) | `App.jsx:153` (`navTo` direto) — `useNavigation` sem transition |
| `useSchedulerYield` | Hook existe mas só 1 call site | `src/shared/hooks/useSchedulerYield.js:3-20`; usado só em `AiInsightsCard.jsx:7,44` |
| Virtualização de lista | ✅ `@tanstack/react-virtual` | `TxView.jsx:10,108-112` |
| Scroll handler | `onScroll` → `setStickyTop` **a cada evento de scroll** | `TxView.jsx:120-124` + `:317` — re-render no scroll; mitigado por `Math.abs(prev-st) > 2`, mas roda por evento |
| `useDeferredValue` p/ charts | ❌ não usado (Dashboard calcula `chartData`/`mtx` com `useMemo` síncrono) | `Dashboard.jsx:37-72` |
| Filtro lista longa | Filter+sort+group por key em `useMemo` com deps `[tx, type, debouncedSearch, dateFrom, dateTo]` | `TxView.jsx:61-94` |

### 1.4 CLS

| Item | Estado | Evidência |
|---|---|---|
| Skeleton/loader nos lazy | `PageSkeleton`/`Loader` como fallback | `routes.jsx:84` (fallback), `LazyPage.jsx:50-53` |
| Fontes swap sem metric-match | `display=swap` **sem `size-adjust`** → FOUT com refow | `index.html:25` |
| Gráfico 7 dias sem reserva | `BarChartSVG` em `Card` sem `aspect-ratio` fixo | `Dashboard.jsx:309` |
| Sticky header TxView | `h-0 overflow-visible` (não consome layout) — CLS neutra | `TxView.jsx:320-332` |

### 1.5 PWA / Workbox

| Item | Estado | Evidência |
|---|---|---|
| Precache app shell | ✅ `precacheAndRoute` + `NavigationRoute` → `/index.html` | `src/sw.ts:11,16-19` |
| Static assets | `CacheFirst` 30d | `src/sw.ts:23-32` |
| Fonts gstatic | `CacheFirst` 365d | `src/sw.ts:36-45` |
| `/api/` próprio | `NetworkFirst` 5s timeout | `src/sw.ts:48-57` |
| Supabase REST GET | `NetworkFirst` 5s timeout, cache 10min | `src/sw.ts:60-73` — leituras reais vêm do Dexie; este cache cobre janelas curtas de offline |
| Supabase mutations | `BackgroundSync` `maxRetentionTime:24*60` em `NetworkOnly` | `src/sw.ts:84-90` |
| Update flow | `registerType:'prompt'` + `SKIP_WAITING` | `vite.config.js:28`, `src/sw.ts:93-98` |
| Prefetch pós-idle de rotas | ❌ inexistente | `src/sw.ts` (sem request warming); `src/core/boot.js:18-27` (só version check) |
| Navigation preload | ❌ não habilitado | `src/sw.ts:100-102` (activate só faz `clients.claim()`) |

### 1.6 Budgets no CI

| Item | Evidência |
|---|---|
| LHCI: `categories:performance` minScore 0.90 (desktop); FCP 1800, LCP 2500, TBT 200, CLS 0.1, TTI 3500 | `.lighthouserc.js:12-25` |
| resource-summary (warn) total 800KB, script 300KB, css 50KB, font 100KB, third-party 100KB, image 200KB | `.lighthouserc.js:27-32` |
| Sem budgets por rota; sem INP no lab — só `max-potential-fid` (desatualizado) | `.lighthouserc.js:24` |
| **Real:** JS inicial ≈ 108KB gz (index 51.17 + react-vendor 56.85) + CSS 12.49 gz — dentro do script budget, mas CSS raw (60.93KB) estoura o warn de 50KB | build desta sessão |

---

## 2. Benchmark externo (pesquisa web 2025-2026)

| # | Referência (nome) | URL | 2–4 insights "copiáveis" |
|---|-------------------|-----|--------------------------|
| 1 | Optimize INP (web.dev) | https://web.dev/articles/optimize-inp | INP = input delay + event callbacks + presentation delay; bom ≤ 200ms p75. Eventos devem fazer pouco; resto deferido via `rAF(() => setTimeout(...,0))`. DOM grande penaliza INP — `content-visibility` reduz o render de interação. |
| 2 | Optimize long tasks (web.dev) | https://web.dev/articles/optimize-long-tasks | `scheduler.yield()` continua priorizado (não perde para mesma classe de tarefa); usar em loops com deadline ~50ms (yield batched). Fallback: `globalThis.scheduler?.yield?.() ?? new Promise(r=>setTimeout(r,0))`. |
| 3 | Optimize web fonts (web.dev/learn) | https://web.dev/learn/performance/optimize-web-fonts | WOFF2 é a única formato necessário (98%+ browsers); subsetting reduz até ~90% do download; fontes por origem de terceiros custam conexão extra — `preconnect` antes do CSSOM. |
| 4 | Web Fonts 2026: CLS·LCP (2026-03) | https://sitegrade.io/en/blog/web-fonts-2026-cls-lcp-performance/ | swap sem metric-match causa CLS 4-8px/linha; solução 2026 = `swap` + fallback com `size-adjust/ascent-override/descent-override/line-gap-override` + preload só do woff2 above-the-fold (máx. 2-3). `crossorigin` obrigatório mesmo same-origin. |
| 5 | Self-Host Google Fonts | https://fontfyi.com/blog/how-to-self-host-google-fonts/ | Google desativou cross-site cache sharing; self-host em CDN reduz DNS+conexão. Inter latin woff2 ≈ 20-30KB (TTF full ≈ 300KB). Cache `max-age=31536000, immutable`. |
| 6 | Preconnect third-party APIs (2026-07) | https://www.network-priority.com/resource-hint-implementation-preloading-strategies/strategic-preconnect-dns-prefetch-usage/automating-preconnect-for-third-party-apis/ | Cold fetch 420ms vs preconnect 115ms (−72% TTFB; LCP −34%). Máx. 4 hints de preconnect; `crossorigin` deve casar o fetch autenticado (`use-credentials`). |
| 7 | React.lazy + Suspense + manualChunks (2025-10) | https://www.mykolaaleksandrov.dev/posts/2025/10/react-lazy-suspense-vite-manualchunks/ | Vite sem manualChunks promove vendors num blob único; `react-vendor` estável + hash cacheável; `modulePreload.polyfill:false` economiza ~3KB; prefetch no *intent* (hover/focus). |
| 8 | Vite PWA injectManifest | https://vite-pwa-org.netlify.app/workbox/inject-manifest | injectManifest reusa os Vite plugins no build do SW; `self.__WB_MANIFEST` é o ponto de injeção; NetworkFirst com `networkTimeoutSeconds`; plugins repetidos em `injectManifest.plugins`. |
| 9 | content-visibility (web.dev) | https://web.dev/articles/content-visibility | `content-visibility:auto` = layout+style+paint containment; offscreen ganha size containment → render 232ms→30ms no demo (7x). `contain-intrinsic-size` é obrigatório p/ reservar altura. A11y/find-in-page preservados. |
| 10 | Lighthouse budgets / CWV 2026 | https://www.badpagespeed.com/blog/how-to-set-up-performance-budget | Budgets: JS ≤200KB gz, CSS ≤80KB gz, page ≤1.5MB, fonts ≤3, LCP ≤2.5s, INP ≤200ms, CLS ≤0.1, TTFB ≤500ms, TBT ≤300ms. Stepping: apertar gradual (400→300→200KB). |

---

## 3. Oportunidades priorizadas (P0 / P1 / P2)

| Prioridade | Oportunidade | Arquivo(s) alvo | Impacto (perf/percepção) | Esforço | Risco |
|---|---|---|---|---|---|
| **P0** | **Fontes self-host + metric-match fallback**: woff2 latin subset + `size-adjust` no fallback + `preload` da fonte de LCP. Elimina FOUT/CLS e ~100-300ms de LCP | `index.html`, `public/fonts/*`, `src/index.css` | alto (CLS↓ + LCP↓) | médio | baixo (asset estático; substitui Google localmente) |
| **P0** | **Preload/modulepreload dos bundles de entrada + remover warn do `sync.js` (duplicação no worker)** | `index.html`, `vite.config.js:120-139` | médio-alto (download serial→paralelo; menos bytes iniciais) | baixo | baixo |
| **P0** | **Budgets no CI: perfis desktop+mobile, resource-summary warn→error, script inicial ≤ ~190KB gz** | `.lighthouserc.js` | médio (checkpoint de regressão) | baixo | baixo |
| **P1** | **`onScroll` do TxView sem `setState` por evento (rAF-sampling ou transform no sticky)** | `TxView.jsx:120-124,317` | médio (INP em lista longa) | baixo | baixo-médio (mexe em UI) |
| **P1** | **`startTransition`/`useDeferredValue` na navegação e no período do Dashboard** | `src/hooks/useNavigation.js`, `Dashboard.jsx:101` | médio (INP em transições) | baixo | baixo |
| **P1** | **`content-visibility:auto` + `contain-intrinsic-size` nas seções fora do fold** | `src/index.css`, `Dashboard.jsx` | médio (render inicial máquinas fracas) | baixo | baixo (preserva DOM/a11y) |
| **P1** | **Prefetch pós-idle das rotas prováveis via `requestIdleCallback` + `import()`** | `src/lib/prefetch.js` (novo), `src/App.jsx` | médio (navegação "instantânea") | baixo | baixo |
| **P2** | **Chunk `supabase-vendor` vazio: reagrupar para não emitir bucket inútil nem duplicar code no index** | `vite.config.js:126` | médio (cache de deploy) | baixo | médio (chunk graph) |
| **P2** | **`preconnect` real para a origem Supabase (login/sync)** | `index.html:22-24` | médio (TTFB/−72% medida, afeta login/sync) | trivial | baixo |
| **P2** | **`navigationPreload` + ajuste da regra de fontes self-host no SW** | `src/sw.ts` | baixo-médio (LCP offline) | baixo | baixo |

---

## 4. Especificação técnica aplicável (pronta para implementação)

### 4.0 Mapa por métrica

| Métrica | Fator dominante | Alavancas | Ganho esperado |
|---|---|---|---|
| **LCP** | fontes (swap/FOIT) + rede de JS inicial + CSS | A: fontes self-host + preload (≤2 arquivos); B: `modulepreload` dos bundles de entrada; C: `preconnect` Supabase/login | −100 a 600ms |
| **INP** | evento scroll em loop, troca de rota síncrona, filtro pesado | A: rAF-sample do `onScroll`; B: transition em `navTo`; C: `content-visibility` em listas; D: categorize já em async ($ worker) | −50 a 200ms |
| **CLS** | FOUT sem metric-match + componente sem reserva de espaço | A: `size-adjust` no fallback; B: `contain-intrinsic-size`; C: `aspect-ratio` no `BarChart`; D: reserva no widget de forecast | swap imperceptível; CLS < 0.05 |
| **Percepção** | navegação só baixa chunk na hora | prefetch pós-idle das rotas principais; skeleton significativo | sensação de nativo |

### 4.1 Fonte — estratégia completa

Atual: Google Fonts CSS com `display=swap`, sem preload de woff2 e sem fallback metricado. Isso
gera **FOUT + CLS** (refonte de 4-8px/linha) e LCP limitado por descoberta tardia do `@font-face`
(o browser só encontra pelo CSS do Google pós-layout).

Plano (ordem segura; offline-first não quebra):

```css
/* 1) self-host dos woff2 Latin (gerar via pyftsubset ou google-webfonts-helper;
     Inter 400/500/600 + Montserrat 600/700/800 + JetBrains Mono 400/500 —
     ~12-16 arquivos, ≈ 20-28KB gz total) */
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/inter-400-latin.woff2') format('woff2');
  font-display: swap;
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
                 U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193,
                 U+2212, U+2215, U+FEFF, U+FFFD;
}

/* 2) fallback com métricas equivalentes (match de Inter) — zera o reflow do swap */
@font-face {
  font-family: 'Inter-fallback';
  src: local('Arial');
  size-adjust: 104.7%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

- Html: preload **apenas** do peso usado no LCP do `body`/título (Inter 600):
  `<link rel="preload" href="/fonts/inter-600-latin.woff2" as="font" type="font/woff2" crossorigin>`.
  `crossorigin` é obrigatório mesmo same-origin (senão o browser baixa 2x). Máximo 2-3 preloads de
  fontes; mais compete com o CSS/JS crítico.
- Manter `font-display: swap` (texto imediatamente visível); com o fallback metricado o swap fica
  imperceptível. **Não** usar `optional` aqui: a brand é primordial e perder o 1º load é pior.
- CSS self-host fica `CacheFirst` no SW (fontes nunca mudam; `maxAge 365d` já existe em
  `sw.ts:36-45`, basta a regra servir fontes do próprio origin).
- **Futuro**: variable font p/ reduzir número de arquivos; `font-display` já no `@font-face`.

Interação com offline-first: fontes vão para o precache do SW (PWA offline idêntico). Os tokens
`--font-*`/`--brand` do design system continuam válidos; muda apenas a origem do `@font-face`.

### 4.2 Bundle — config atual + mudanças reais propostas

**Atual (evidência de build desta sessão):**
- `manualChunks` com 12 buckets (`vite.config.js:120-139`); `supabase-vendor` **0.00 kB** (vazio);
  `react-vendor` 174.40 kB (56.85 gz); `index` 179.10 kB (51.17 gz).
- Warning de build: `src/lib/sync.js` importado dinamicamente (no worker) e estaticamente →
  "dynamic import will not move module into another chunk" → o worker duplica código.
- CSS: `60.93 kB` raw (12.49 gz), `css.codeSplit: true` (`vite.config.js:107-108`).

**Propostas (ordem de risco crescente):**

1. **[P0] `modulePreload.polyfill: false` + `modulepreload` manual**: o alvo é `es2020`
   (`vite.config.js:113`); o polyfill de modulepreload (~3KB) não é necessário. Adicionar
   `build: { modulePreload: { polyfill: false } }` e `inject` no `transformIndexHtml` dos links
   `modulepreload` apontando para `react-vendor` + o entry — paraleliza o download que hoje é serial
   (o browser inicia o entry e só descobre os vendors depois).
2. **[P0] Reordenação do `manualChunks`**: colocar `shared-runtime` (tslib, `@babel/runtime`) como
   **primeiro** match (evita duplicação transitiva); usar `id.includes('/node_modules/react/')` com
   guarda `!id.includes('react-table')`/`react-query` (o `includes('react')` solto atual
   `vite.config.js:122` já usa guarda de `react-table`, mas não de `react-router-dom`→ `react-vendor`,
   o que até é desejável aqui).
3. **[P1] `src/lib/sync.js` como chunk próprio** (`id.includes('/src/lib/sync.js') → 'sync-lib'`):
   o warn do build some e o worker (104KB raw) e o main deixam de duplicar a pipeline — notebook
   mede: ver cluster do `sync.worker` antes/depois.
4. **[P1] Acumular no `supabase-vendor`**: após a mudança 2, ver se `@supabase/supabase-js` sai do
   `index`. Se continuar 0 KB, **remover a rule `supabase`** (`vite.config.js:126`) e deixar cair em
   `vendor-misc` — não emitir bundle vazio.
5. **[P2] `chunkFileNames`** `assets/[name]-[hash].js` — semântico/ordenado (estável p/ SW precache).

Budget alvo pós-mudança (gzip): `index ≤ 55KB`, `react-vendor ≤ 54KB`, CSS ≤ 60KB raw,
fontes p/ first paint ≤ 24KB, rotas ≤ 15KB each; total inicial ≤ 130KB gz.

### 4.3 PWA / cache — estratégia atual + recomendações

**Atual (`src/sw.ts`):**
- Precache (app shell js/css/html) — `sw.ts:11`.
- `static-assets` CacheFirst 30d — `sw.ts:23-32`.
- `fonts` CacheFirst 365d — `sw.ts:36-45`.
- `/api/` NetworkFirst 5s — `sw.ts:48-57`.
- **Supabase REST GET: NetworkFirst 5s, cache 10min** — `sw.ts:60-73` (leituras de verdade do Dexie;
  cache cobre offline curto).
- Supabase mutations: `No BackgroundSync` em NetworkOnly — `sw.ts:84-90`.

**Recomendações:**
- **`stale-while-revalidate` para consultas Supabase que são *cache-friendly*** (perfil, presets,
  brands): responde do cache instantaneamente e revalida em background — os dados de primeira mão
  continuam vindo cabível do Dexie (offline-first). Manter `NetworkFirst` para itens que devem
  refletir — a posição atual é defensável; a troca reduz o "Waiting (TTFB)" na leitura repetida.
- **Fontes self-host**: entram no `precache` (já estão no glob de js/css/html se colocadas em
  `public/` com extensão woff2?? — não; o `globPatterns` (`vite.config.js:50`) só `{js,css,html}`;
  por isso hoje os woff2 do Google são tratados pela regra `fonts`). Ao self-hostar, adicionar
  `woff2` ao `globPatterns` ou criar rota dedicada para `*.woff2` local.
- **Prefetch pós-idle (client)**: novo `src/lib/prefetch.js`:

```js
// src/lib/prefetch.js — aquece o cache do Vite com as rotas prováveis no idle
const routes = () => [
  import('../features/dashboard/Dashboard.jsx'),
  import('../features/transactions/TxView.jsx'),
  import('../features/reports/ReportView.jsx'),
];
export function prefetchNext() {
  const idle = () => routes().forEach((p) => p.catch(() => {}));
  if ('requestIdleCallback' in window) requestIdleCallback(idle, { timeout: 4000 });
  else setTimeout(idle, 1000);
}
```

Chamado de `App.jsx` num `useEffect` pós-1s — os chunks das rotas baixam e ficam no precache;
a 2ª navegação "cheira" a instantânea sem custar INP/LCP inicial.

### 4.4 INP — ações por origem

- **Scroll (TxView)** — `onScroll` → `setStickyTop` a cada evento (`TxView.jsx:120-124,317`).
  Fix: ler `containerRef.current.scrollTop` no handler e aplicar `transform` no overlay sticky
  diretamente (`sticky.style.transform`) ou guardar o último valor em ref e atualizar o `state`
  apenas via `requestAnimationFrame` (throttle). Evita re-render por-frame do React.
- **Filtro search** — já `useTransition` (`TxView.jsx:30,245`); opção: `useDeferredValue` no
  `debouncedSearch` para não repintar a lista com valor velho; ou manter debounce 250ms (ok).
- **Navegação** — envolver o `navTo` em `startTransition` (`useNavigation.js`); a troca de rota
  lazy + Suspense segura a view; transition deixa a UI anterior visível enquanto o chunk baixa.
- **Dashboard / troca de período** — `useMemo` síncronos (`Dashboard.jsx:37-72`); envolver o
  `onChange` do `<select>` (`Dashboard.jsx:101`) em `startTransition(() => setPeriod(...))` +
  `isPending` sutil.
- **Render fora do fold** — `content-visibility:auto` nas `Card`s do rodapé do Dashboard diminui
  layout/paint de interação e inicial (research #9).

### 4.5 CLS — ações distintas

- **Fontes**: fallback metricado (4.1).
- **Gráfico 7 dias**: reservar `min-h`/`aspect-ratio` no container do `BarChartSVG`
  (`Dashboard.jsx:309`).
- **Sticky TxView** já `h-0 overflow-visible` (não consome layout — `TxView.jsx:320`).
- **Forecast card** mounta após async (`Dashboard.jsx:21-27`) — pode surgir em tempo de interação;
  reservar altura min ou renderizar com dimensões fixas até a chegada.

### 4.6 Convivência com `--brand` e offline-first

- Fontes e métricas via tokens (`--font-*`/`--brand`) preservadas — troca só a origem `@font-face`.
- Supabase origin vem de env: injetar `preconnect` no `index.html` via env do build
  (`%VITE_SUPABASE_URL%` no template) + `transformIndexHtml` — cada ambiente carrega sua origem
  (funciona com Free key/anon).
- Offline-first intacto: o cache SW apenas serve; Dexie segue a única fonte local (mutations
  BackgroundSync em `sw.ts:84-90` não mudam o fluxo de fila do Dexie).

---

## 5. Dependências & libs (se aplicável)

| Lib/Ferramenta | Versão | Por quê | Custo ~KB gz | Alternativa gratuita |
|---|---|---|---|---|
| `glyphanger` / `pyftsubset` (fonttools+brotli) | currentes 2026 | gera o subset Latin + woff2 das 3 famílias | 0 (dev-only) | `google-webfonts-helper` |
| `@fontsource/...` | ^5 | prova de conceito (woff2 já subsetado como dep) | +60-100KB gz se incluir tudo — **preferir self-host via subset** | woff2 manual em `public/fonts/` |
| `critters` (já instalado) | ^0.0.25 | critical CSS inline (warns menores, não bloqueante) | 0 | `beasties` (fork mantido) |
| `scheduler.yield`/`requestIdleCallback` | web platform (Chrome 129+) | continuar yield-priorizado em chunked work | nativo 0; polyfill ~1.2KB gz | `setTimeout(r,0)` (já em `useSchedulerYield.js:15`) |

Nota: **não** há novas libs runtime; tudo é web platform ou builder. Não pré-loadar libs de
bundle pesado (stripe é lazy — `stripe-vendor` 12.07 kB).

---

## 6. Checklist para implementadores (Fase 2)

> Ordem segura — cada passo é auto-contido e validável com `npm run build` + `npm run preview`;
> nenhum quebra offline-first nem o `--brand`. Branco: `git checkout -b chore/perf05-<passo>`
> antes; baseline de bundle vazio antes do passo que alterar bundle.

- [ ] **P1 — Fontes self-host (P0)**: gerar subset (`pyftsubset` ou `gwfh`); `public/fonts/`;
      `@font-face` + fallback metricado em `src/index.css`; remover `<link>` Google Fonts de
      `index.html`; manter `font-display:swap`; `preload` da Inter 600 no head. **Validação**:
      `npm run build && npm run preview` + CLS ≤ 0.05 (LHCI); DevTools fonts load from self.
- [ ] **P2 — Preconnect Supabase + modulepreload core (P0/trivial)**: `<link rel="preconnect"
      href="%VITE_SUPABASE_URL%" crossorigin>` + `modulepreload` do core no `transformIndexHtml`;
      `modulePreload.polyfill:false`. **Validação**: Network mostra fetch do login/sync sem bloco
      DNS/SSL (socket reutil).
- [ ] **P3 — `sync.js` chunk próprio + ordem `manualChunks` (P0)**: bucket `shared-runtime` 1º,
      guarda estrita `react/`, chunk explícito `sync-lib`. **Validação**: warn "dynamic import"
      some; `supabase-vendor` não emite vazio; worker ≤ ~85KB raw.
- [ ] **P4 — Prefetch pós-idle (P1)**: `src/lib/prefetch.js` + `useEffect` no `App.jsx` (após 1s).
      **Validação**: Network mostra chunks das rotas baixando no idle.
- [ ] **P5 — `onScroll`/sticky sem setState por evento (P1)**: rAF-sample/transform no TxView.
      **Validação**: Painel de performance/INP em lista 2k; `test:changed` TxView verde.
- [ ] **P6 — transition em nav e período (P1)**: `useNavigation.js` + `Dashboard.jsx:101`.
      **Validação**: DevTools mostra render de rota sem long task.
- [ ] **P7 — `content-visibility` (P1)**: classe `.cv-auto` + `contain-intrinsic-size:auto 240px`
      nas seções do Dashboard/Report; medir CLS ≤ 0.05.
- [ ] **P8 — Budgets CI (P0)**: `.lighthouserc.js` split desktop+mobile; `resource-summary`
      warn→error; assertions `interactive`/`total-blocking-time` reaffirmadas.

**Pontos que não podem quebrar** (README §Restrições):
- Offline-first: Dexie/sync intocados (mutations `sw.ts:84-90` intactas); SW não persiste state.
- `--brand` dinâmico: só troca macros `@font-face`; tokens intactos.
- WCAG 2.2 AA: `content-visibility` mantém aria/find (research #9); sticky já `aria-level`.
- A cada passo: `npm run validate:fast` + `npm run build` quando alterar bundle/PWA.

**Verificação leve (máquina fraca)**: `npm run lint:changed && typecheck:changed && test:changed`
+ `npm run build` apenas no Passo 1/3/8. LHCI full (pesado) só no CI.

---

## 7. Medição leve (como rodar / checar local SEM build pesado)

### 7.1 Scripts de validação (lidos em `package.json`)

| Script | Custo | Quando |
|---|---|---|
| `npm run validate:fast` (lint+typecheck+test de só diffs) | leve | a cada passo |
| `npm run validate:full` (tudo + build) | pesado | pré-PR |
| `npm run test:fast` (`--no-isolate`) / `test:changed` | leve | só unidades/diff |
| `npm run build` (Terser 2 passes) | **médio: 53.8s medido** | só quando muda vite/manualChunks/fontes |
| `npm run analyze` (`ANALYZE=true` → visualizer) | médio | diagnóstico de chunks (uma vez por frente) |
| `npm run audit:changed` / `validate:fast:js` | leve | checagens secundárias |

### 7.2 Pipeline de diagnóstico local

1. **Tamanho/chunks** (quer intuitivo): `npm run analyze` abre o visualize (gzip+brotli) —
   o build é o único custo real (53s). Evitar repetir por frente.
2. **CWV rápida**: após um build, `npm run preview` + `npx lhci autorun` (usa o `collect` do
   `.lighthouserc.js`) OU `playwright` no projeto `chromium` contra `/`. Ver
   `docs/Performance/PERF_TEST_REPORT.md` para o padrão da máquina fraca.
3. **INP**: DevTools `performance` → long tasks na interação; ou `playwright`-evaluate em um traçado.
4. **CLS**: assertion LHCI `cumulative-layout-shift` + screenshots mobile nos deploys.
5. **Budgets de bundle**: `npm run analyze` para ver gzip por chunk; comparar com a tabela 7.4.

### 7.3 Ressalvas
- **Não** adicionar `vite-plugin-compression` até conferir se o deploy (Render) já comprime
  gzip/brotli; se não, adicionar no final.
- Não usar `vite-plugin-singlefile`; mantém o SPA multi-chunk + PWA.
- `critters` já cobre o critical CSS — sem lib extra.

### 7.4 Budgets sugeridos (definitivos após a frente)

| Grupo | Valor | Ação |
|---|---|---|
| `categories:performance` | ≥ 0.90 ambos presets | error (mantido) |
| LCP | ≤ 2.0s (desktop) / ≤ 2.5s (mobile) | error |
| INP (lab) | ≤ 200ms | error quando suportado |
| CLS | ≤ 0.05 | error (aperto de 0.1) |
| `resource-summary:total` | ≤ 800KB | error |
| `resource-summary:script` | ≤ 260KB | error |
| `resource-summary:css` | ≤ 70KB raw (incl. critical inline) | error |
| `resource-summary:font` | ≤ 40KB* (self-hosted latin) | error |
| `resource-summary:third-party` | ≤ 100KB | error |
| `numberOfRuns` | 3 desktop + 3 mobile (presets separados) | `.lighthouserc.js` |

---

## 8. Log de coleta (transparência — auditável)

| # | Tipo | Alvo (query/URL/arquivo) | Conhecimento extraído |
|---|---|---|---|
| 1 | busca | "INP optimization React event handlers long tasks 2026" | INP = input+callbacks+render; padrão rAF+setTimeout; content-visibility reduce render de interação |
| 2 | busca | "scheduler.yield real-world" | yield priorizado; deadline ~50ms; fallback `?.yield?.()` |
| 3 | busca | "font-display swap vs block LCP" | swap↔FOUT; preload com `crossorigin`; block piora FOIT |
| 4 | busca | "Google Fonts subsetting pt-BR latin woff2" | latin woff2 ~20-30KB; cross-site cache desligado |
| 5 | busca | "preconnect Supabase REST" | −72% TTFB, −34% LCP; cap de 4 hints; PostgREST v14 |
| 6 | busca | "manualChunks Vite split vendors per route React" | vendor estável+hash; shared-runtime 1º; guard `react-table` |
| 7 | busca | "vite-plugin-pwa injectManifest strategies REST" | injectManifest = injeção no WB_MANIFEST; S-W-R quando Dexie é fonte |
| 8 | busca | "content-visibility auto contain-intrinsic-size" | 7x no demo; 15-45% reais; obrigatório `contain-intrinsic-size` |
| 9 | busca | "critters critical css inline logLevel" (429→retry) | `preload:'media'`/`swap`; pseudo-elementos não suportados |
| 10 | busca | "Lighthouse budgets 2026 mobile" | mobile LCP ≤3.5s/INP ≤300/JS ≤200KB; stepping gradual |
| 11 | fetch | https://web.dev/articles/optimize-inp | partes do INP, p75, patterns |
| 12 | fetch | https://web.dev/articles/optimize-long-tasks | deadlines, `scheduler.yield`, código |
| 13 | fetch | https://web.dev/learn/performance/optimize-web-fonts | WOFF2-only, subset, preconnect |
| 14 | fetch | https://web.dev/articles/content-visibility | containment e size hint detalhados |
| 15 | fetch | https://www.mykolaaleksandrov.dev/posts/2025/10/react-lazy-suspense-vite-manualchunks/ | lazy splitting + manualChunks + prefetch |
| 16 | fetch | https://vite-pwa-org.netlify.app/workbox/inject-manifest | injectManifest config e plugins |
| 17 | leitura | `package.json` | scripts validate/audit/analyze |
| 18 | leitura | `vite.config.js` | manualChunks, critters, PWA, terser |
| 19 | leitura | `index.html` | preloads, font, CSP, dns-prefetch |
| 20 | leitura | `src/routes/routes.jsx` | lazy routes (8) + Suspense |
| 21 | leitura | `src/App.jsx` | lazy landing/legal, ctx estável, navTo |
| 22 | leitura | `src/lib/dexie.js` | índicev5 (composto) |
| 23 | leitura | `src/features/dashboard/Dashboard.jsx` | useMemo charts, período, forecast |
| 24 | leitura | `src/features/transactions/TxView.jsx` | virtualização, useTransition, onScroll/sticky |
| 25 | leitura | `src/workers/sync.worker.js` + `useSyncLoop.js` | worker delegado, backoff, events |
| 26 | leitura | `src/sw.ts` | estratégias Workbox |
| 27 | leitura | `.lighthouserc.js` | assertions atuais |
| 28 | leitura | `src/shared/hooks/useSchedulerYield.js`, `LazyPage.jsx`, `boot.js` | hooks, fallbacks, idle |
| 29 | execução | `npm run build` | chunks reais (index header + vendors), warns sync.js/critters, precache 40 |

Também lidos: `docs/Performance/PERFORMANCE_AUDIT_REPORT.md` (histórico — bundle/worker/indexes) e
`docs/WORKSPACE.md §2/§3` (P0-P2 fechados, rodada de performance já avançada).

---

## 9. Fontes completas

**URLs pesquisadas/acessadas:**
1. https://web.dev/articles/optimize-inp
2. https://web.dev/articles/optimize-long-tasks
3. https://web.dev/learn/performance/optimize-web-fonts
4. https://web.dev/articles/content-visibility
5. https://sitegrade.io/en/blog/web-fonts-2026-cls-lcp-performance/
6. https://fontfyi.com/blog/how-to-self-host-google-fonts/
7. https://www.network-priority.com/resource-hint-implementation-preloading-strategies/strategic-preconnect-dns-prefetch-usage/automating-preconnect-for-third-party-apis/
8. https://supabase.com/docs/guides/database/connection-management
9. https://supabase.com/changelog/41288-data-api-upgrade-to-postgrest-v14
10. https://www.mykolaaleksandrov.dev/posts/2025/10/react-lazy-suspense-vite-manualchunks/
11. https://www.code-splitting.com/route-based-code-splitting-dynamic-import-strategies/vendor-chunk-isolation-and-third-party-management/configuring-vite-manualchunks-for-vendor-isolation/
12. https://vite-pwa-org.netlify.app/workbox/inject-manifest
13. https://www.badpagespeed.com/blog/how-to-set-up-performance-budget
14. https://web-performance-budgeting-ci-gating.com/defining-web-performance-budgets/
15. https://nayankyada.com/blog/inp-for-react-apps-profiling-and-fix-long-tasks
16. https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield
17. https://www.npmjs.com/package/critters (+ fork ativo `beasties`)

**Arquivos do repo lidos (todos lidos nesta sessão):**
- `package.json` (scripts 8-34; deps)
- `vite.config.js` (1-176)
- `index.html` (1-44)
- `src/routes/routes.jsx` (1-90)
- `src/App.jsx` (1-178)
- `src/lib/dexie.js` (1-59)
- `src/features/dashboard/Dashboard.jsx` (1-366)
- `src/features/transactions/TxView.jsx` (1-470)
- `src/workers/sync.worker.js` (1-20)
- `src/shared/hooks/useSyncLoop.js` (1-186)
- `src/sw.ts` (1-112)
- `src/main.jsx`, `src/core/boot.js`, `src/shared/hooks/useSchedulerYield.js`, `src/App/components/LazyPage.jsx`
- `.lighthouserc.js` (1-43)
- `docs/Performance/PERFORMANCE_AUDIT_REPORT.md`; header de `docs/design/REFINE_05_Performance.md`
- build real de `npm run build` nesta sessão (chunks + warns)