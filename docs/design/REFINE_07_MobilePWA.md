# REFINE_07 — Mobile / PWA app-like feel

> ✅ Preenchido seguindo `docs/design/TEMPLATE.md` (seções 0-8, ≥300 linhas).
> EVIDÊNCIA: 10 buscas web + 5 fetches (web.dev, specification.website, MDN ×2, OpenReplay)
> + 22 arquivos do repo lidos/verificados com `file:line`. Nenhuma invenção de path.

## Objetivo

Experiência "aplicativo nativo" no celular/PWA: gestos (swipe, pull-to-refresh — auditar),
bottom nav, quick actions (FAB), safe-area insets, teclado numérico em campos de dinheiro,
haptics leve, offline UX (banners reais de "você está offline" + contagem de pendências),
abertura de segunda tela (instalação).

---

## 0. Ficha do agente

```yaml
frente: Mobile / PWA app-like feel
agente_data: 2026-08-08
buscas_web: 10
urls_fetched: 5
repo_arquivos_lidos: 22
doc_linhas: 457
skills_usadas: nenhuma (não disponível para esta frente)
```

---

## 1. Diagnóstico atual (ESTADO REAL, com evidência)

Cada afirmação abaixo foi verificada contra o código com `grep -n`/`read` direto no repo.

### 1.1 Viewport & safe-area — PARCIALMENTE OK

- `index.html:6` → `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">`.
  `viewport-fit=cover` está presente → `env(safe-area-inset-*)` fica habilitado em iOS. ✅
- `index.html:27` → `<meta name="theme-color" content="#002f59">` (ok, combina com manifest/theme_color). ✅
- Safe-area é aplicado **manualmente, por componente** (repetição de `env()`, sem token):
  - `src/shared/ui/BottomNav.jsx:12` → `paddingBottom:'env(safe-area-inset-bottom, 0px)'` (inline, no fallback CSS var).
  - `src/shared/ui/UpdateBanner.jsx:22` → `z-[60]` + `paddingTop: calc(env(safe-area-inset-top, 0px) + 12px)`.
  - `src/shared/ui/Footer.jsx:147-148` → `fixed bottom-0 ... z-20` + `paddingBottom: env(safe-area-inset-bottom, 0px)`.
- **Ausente:** token de safe-area centralizado no design system. `src/shared/styles/design-tokens.css`
  tem tokens de foco (`--focus-ring`, :3-4), padding (`--card-padding`, :9), fontes (:12-17),
  mas **nenhum** `--safe-*`. Consequência: espelhamento em 3+ bares, propenso a drift (um
  componente novo esquece o inset e fica colado na home indicator — verif.: `QuickActions.jsx`
  não usa `env()`, mas não fica colado; ver §1.3).

### 1.2 Bottom nav — presente e coerente

- `src/shared/ui/BottomNav.jsx:20` → `<nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">` (só mobile).
  `navStyle` (:11-13) usa `background var(--bg-page)` + `borderTop var(--border-color, #f1f5f9)` +
  `paddingBottom env(safe-area-inset-bottom, 0px)`.
- Botões com touch target ≥ 44px padronizado: `--touch-target-min: 44px` em `src/index.css:185`;
  `BottomNav.jsx:27` força `min-w-[44px] min-h-[44px]`. Conforme P1 #5 (concluído).

### 1.3 Quick actions (FAB) — existe; risco de safe-area sobre-estimado pelo draft

- Arquivo real: `src/shared/ui/QuickActions.jsx` (importado via `emitQuickIntent` de
  `src/lib/quickIntent.js`; `SHOWN_VIEWS` em :10 inclui `settings`/`planos`).
- Container: `QuickActions.jsx:47` → `className="fixed z-40 right-4 bottom-32 lg:right-8 lg:bottom-8 ..."`.
  **`bottom-32` = 8rem = 128px da base em mobile** — o FAB fica 128px acima da bottom bar,
  NÃO colado na home indicator. Portanto o risco de sobreposição declarado no draft
  ("colado na base") é **incorreto**: em iPhone com home bar o FAB já sobe 128px.
- Botões do menu usam `min-h-[var(--touch-target-min)]` (:55), `aria-haspopup`/`aria-expanded`
  (:72), fechamento via `Escape`/click-fora (:27-35). Acessível. ✅
- **Conclusão corrigida:** aplicar `env(safe-area-inset-bottom)` no FAB é *nice-to-have* de
  consistência (P2), não P1 — o bottom-32 já o afasta da home indicator.

### 1.4 Gestos — swipe e pull-to-refresh já implementados

**Pull-to-refresh** — `src/shared/hooks/usePullToRefresh.js` (117 linhas, lido integral):
- Guarda o gesto ao topo (`scrollTop <= 0`, :40), damping elástico cap [20px..120px] (:4,:54),
  `preventDefault` durante o pull (`{ passive: false }`, :53,93), expõe refs/estado via `containerRef`.
- ⚠️ **Correção de fato (o draft inventou):** o hook **não** aplica `touchAction:'pan-y'` nem
  `overscrollBehaviorY:'contain'` em JS — grep `touchAction|overscroll` em
  `usePullToRefresh.js` → zero matches. A responsabilidade reza por **CSS do consumidor**
  (o container que recebe `containerRef`). Consumidores verificados:
  `src/features/transactions/TxView.jsx:317`, `src/features/reports/ReportView.jsx:209`
  (ambos `overflow-auto`).
- Usa pointer events (:96-99 mouse/touch) → funciona no desktop e mobile. ✅

**Swipe actions** (`src/shared/hooks/useSwipeActions.js`):
- `THRESHOLD_PX = 80` (:3), configurável (`opts.threshold`, :10); `TransactionCard.jsx:34`
  usa `threshold: 60`. Commit em :31 (`Math.abs(delta) > threshold && actions.length > 0`).
- `TransactionCard.jsx:29-32` define ações por direção: `Duplicar`/`Excluir` (esquerda),
  `Editar` (direita), com `onConfirm` no delete. UI `TransactionCard.jsx:140-142` usa
  `opacity` + `transition` + ícones SVG.
- ⚠️ **Zero `navigator.vibrate` no repo** (grep `vibrate|navigator.vibrate` em `src/` →
  nenhum match fora de teste). Portanto **não há haptics** no swipe, PTR ou delete.
- **Acessibilidade:** ações de swipe precisam de equivalente teclado. `TransactionCard`
  já expõe botões `Est`/`Excluir` (:label) — verificar que não desaparcaram do swipe.

### 1.5 Offline UX — banner existe, detecção é frágil (EVIDÊNCIA CORRIGIDA)

- Arquivo real: `src/shared/ui/Offline.jsx` (**não** `src/components/SyncState/Offline.jsx` como
  o draft afirma — pasta `src/components/SyncState` não existe; import em `src/App.jsx:15`,
  uso em `src/App.jsx:156`).
- `Offline.jsx:3-14` — estado `off` via `window.addEventListener('online'/'offline')` (:8-9).
  **Não** usa `navigator.onLine` no banner. Banner fixo `z-40` em :16 (`bg-amber-500`, `text-xs`).
- `src/App.jsx:63` usa `navigator.onLine` apenas como guarda no `__financia_reload_plan`
  (trigger de recarga), não no banner. `src/App.jsx:156` renderiza `<SyncBadge status={s.syncStatus}/>`
  (`src/shared/ui/SyncBadge.jsx`) — contador de pendências existe, mas **não ligado ao banner offline**.
- **Frágil (benchmark + fetch):** `navigator.onLine` só indica "placa de rede".
  Requisição que falha (DNS ok, conexão morta, lie-fi) deixa o usuário sem banner. → Oportunidade P0.

### 1.6 PWA install — já funcional (prompt nativo); timing/política ausente

- `src/lib/pwa.js` (168 linhas, lido integral):
  - :27 → `waitingSW.postMessage({ type: 'SKIP_WAITING' })` (update imediato);
  - :41 → `registerSW()` registra `/sw.js`; handles `controllerchange` (:64-69 message),
    :86-87 poll `reg.update()` a cada 30min, :90-96 update no `visibilitychange`;
  - :122-168 → bloco "Instalação do PWA": `deferredPrompt` (:125); `canInstall()` (:134-136);
    `promptInstall()` (:149-156); `beforeinstallprompt` em :159 (preventDefault + stash + emitInstall);
    `appinstalled` em :164 (limpa deferred).
- `src/shared/ui/InstallButton.jsx` (lido integral):
  - :2 importa `onInstallAvailable`, `promptInstall`; :11 listener subscription (não :17-24 como draft);
  - :17 `onClick={promptInstall()}`; :14 só renderiza se `available`; :24 "Instalar aplicativo";
    :25 subtítulo "Acesso rápido e uso offline no aparelho".
- ⚠️ **Falta:** política de *quando* mostrar (draft diz :17-24, mas é :11/:17/:24).
  Nenhum "≥2 sessões" / ação de valor. E **experiência iOS** (sem `beforeinstallprompt` →
  dica de Compartilhar/Adicionar à Tela). `canInstall()` (:134) já expõe o hook para isso.

### 1.7 Manifest & SW — sólidos (com correções de linha)

- `public/manifest.json` (29 linhas): `display:"standalone"`, `orientation:"portrait"`,
  `background_color`/`theme_color: "#002f59"`, ícones 192/512 `purpose:"any maskable"`.
  - **Faltam:** `id` (entidade PWA), `screenshots` (promoção rica no Chrome), `shortcuts` (não priorizado).
- `vite.config.js:23-51` → `VitePWA` `strategies:'injectManifest'`, `filename:'sw.ts'`,
  `registerType:'prompt'`, `injectRegister:null` (registro manual em `pwa.js:41` — alinhado),
  `globPatterns:['**/*.{js,css,html}']`, `maximumFileSizeToCacheInBytes: 5MB`.
- `src/sw.ts` (112 linhas, lido integral) — ⚠️ **corrigir ranges do draft**:
  - :2 import workbox; :11-12 `precacheAndRoute` + `cleanupOutdatedCaches`;
  - :23-33 `CacheFirst` assets estáticos (:27 maxEntries);
  - :36-45 `CacheFirst` fonts (Google Fonts);
  - :48-58 `NetworkFirst` `/api/` (:51 NetworkFirst);
  - :62-74 `NetworkFirst` Supabase GET REST (:67);
  - :79-90 (não :84-187) `BackgroundSyncPlugin('financia-mutations')` + `NetworkOnly`
    para POST/PATCH/DELETE (`isMutation` :79-82; handlers :88-90);
  - :93-98 `SKIP_WAITING`; :100-102 activate/claim; :104-111 install.

### 1.8 Unidades dvh vs vh — P0 do ponto de dor

- `src/features/transactions/TxView.jsx:317` → `max-h-[calc(100vh-280px)]` (área virtualizada).
- `src/features/reports/ReportView.jsx:209` → `max-h-[calc(100vh-400px)]`.
- `src/features/landing/Landing.jsx:100`, `src/features/landing/PrivacyPolicy.jsx:43`,
  `src/features/landing/TermsOfService.jsx:47` → `minHeight: '100vh'` (hero full-bleed).
  (⚠️ paths do draft diziam `src/pages/...` — estão em `src/features/landing/`.)
- Em Chrome Android com barra dinâmica, `100vh` = viewport *large* (barra retraída) →
  **jump de altura / corte de conteúdo** ao rolar. `100vh` no load corta ~56-80px.
  Benchmark web.dev #2 confirma: `100vh` "is too tall on load" e `100dvh` "adapts to the
  visible area".

### 1.9 Teclado em campos de dinheiro — parte ok, detalhes ausentes

- `src/shared/ui/ui.jsx:60` (`export const NumInp`): :80 `inputMode: decimals ? 'decimal' : 'numeric'`,
  `type="text"` — ✅ correto para pt-BR (vírgula/decimal no iOS decimal keypad). NÃO usar
  `type="number"` (esconde pontos/vírgula pt-BR no iOS).
- ⚠️ **Correção de fato:** **não há `pattern`** (`pattern: '[0-9]*[.,]?[0-9]*'`) em `ui.jsx`
  (grep `pattern` em `src/shared/ui/ui.jsx` → zero matches). Formatação pt-BR é máscara JS
  dentro do NumInp, não atributo `pattern`.
- **Ausência:** `enterkeyhint` e `autoComplete` não estão (grep `enterkeyhint` → zero).
- `src/features/admin/ClientEditModal.jsx:416,459` e `src/features/auth/MfaSection.jsx:184`
  usam `inputMode="decimal"/"numeric"` em outros forms — coerente.

### 1.10 Testes E2E sensíveis (não quebrar)

- Existência verificada: `e2e/offline-state-corruption.spec.ts`, `e2e/pwa-cache.spec.ts`,
  `e2e/pwa-install.spec.ts`, `e2e/pwa-offline.spec.ts`, `e2e/pwa-register.spec.ts`.
- Gestos: `src/shared/hooks/usePullToRefresh.test.js`, `src/shared/hooks/useSwipeActions.test.js`
  (unitários); `src/shared/ui/QuickActions.test.jsx`.
- Qualquer mudança em banner offline / prompt install / SW deve rodar `pwa-offline`,
  `pwa-install`, `pwa-cache`, `pwa-register`, `offline-state-corruption`.

---

## 2. Benchmark externo (pesquisa web obrigatória — 10 buscas, 5 fetches)

| # | Referência | URL real (fetch?) | 2-4 insights "copiáveis" |
|---|------------|-------------------|--------------------------|
| 1 | web.dev — Promoção de instalação PWA | https://web.dev/articles/promote-install (fetch ✓) | Só promover instalação após engajamento; usar `userChoice` de `prompt()`; se dispensado, não re-perguntar salvo evento de conversão; iOS: sem `beforeinstallprompt` → UI própria + dica Compartilhar/Adicionar à Tela; `appinstalled` para ocultar. |
| 2 | Dynamic viewport units (specification.website) | https://specification.website/spec/performance/dynamic-viewport-units (fetch ✓) | `lvh`=barra retraída (=100vh legado); `svh`=sempre visível, "safe max that fits"; `dvh`=atualiza live conforme toolbar. Receitas: `.hero{min-height:100svh}` (nunca estoura) e `.sheet{max-height:100dvh}` (acompanha live). Evitar `dvh` em layout animado (causa jitter). |
| 3 | MDN — env() CSS | https://developer.mozilla.org/en-US/docs/Web/CSS/env() (fetch ✓) | `env()` requer `viewport-fit=cover` (presente em index.html:6) senão insets = 0; fallback value via `env(x, 0px)` é o padrão; baseline widely available (2020); também resolve landscape notch. |
| 4 | MDN — Vibration API / haptics | https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API (fetch ✓) | `navigator.vibrate(pattern)` exige gesto do usuário (Chrome ≥60); iOS Safari **não expõe** a API (`'vibrate' in navigator` → false); cap ~10s/pulso; suprimido em background tab; respeitar `prefers-reduced-motion`. |
| 5 | Offline detection reliability | https://blog.openreplay.com/detect-online-offline-status-javascript/ (fetch ✓) | `navigator.onLine===false` é confiável (offline); `===true` NÃO garante internet (captive portal, router sem upstream). Pattern: eventos `online/offline` como *hint* + `fetch` (HEAD, `cache:no-store`, timeout) antes de retomar; fila com `idempotencyKey` + flush em `online`/`visibilitychange`. |
| 6 | overscroll-behavior (MDN) | https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior | `contain` = keep bounce local, no scroll chaining (não desabilita PTR nativo na raiz). `none` = sem chaining E sem bounce. Aplica-se a scroll containers (não `<iframe>`). |
| 7 | touch-action (MDN / Pointer Events W3C) | https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action | `manipulation` = `pan-x pan-y pinch-zoom` → remove 300ms click delay (bloqueia double-tap zoom). Apenas em interações diretas; vale para botões/links. |
| 8 | WCAG 2.2 target size | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html | Mínimo 24×24 CSS px (2.5.8, AA); recomendado 44×44 (2.5.5, AAA) — Apple HIG 44pt, Material 48dp. App já passa 44px (index.css:185 `--touch-target-min`). |
| 9 | iOS PWA add-to-home | https://www.appdrawn.com/how-to-add-a-web-app-to-your-home-screen-on-ios | iOS/Safari não dispara `beforeinstallprompt`; usuário usa Compartilhar → "Adicionar à Tela de Início"; iOS 16.4+ exige tocar `•••` para expandir o share sheet; iOS 26 oferece toggle "Open as Web App". |
| 10 | Pull-to-refresh rubber band | https://fwdtools.com/ui-snippets/pull-to-refresh + spec WICG | Guard no top (`scrollTop===0`); damping 0.5; cap 90px; threshold release ~70px; `.dragging` desabilita transition durante drag; alternativa acessível: botão "Refresh" + aria-live. `overscroll-behavior: contain` na raiz evita PTR nativo duplo. |

> Mínimo cumprido: 10 buscas + 5 fetches (marcados ✓). Fontes 2025–2026, inglês + pt-BR.

---

## 3. Oportunidades priorizadas (P0 / P1 / P2)

Critério P0: alto impacto visível + risco baixo/médio + mudança localizada.

| Prioridade | Oportunidade | Arquivo(s) alvo | Impacto (percepção/perf/conv) | Esforço | Risco |
|-----------|--------------|-----------------|-------------------------------|---------|-------|
| **P0** | **`100dvh`/`100svh`** nas áreas de scroll e full-bleed (elimina jump da barra de endereço dinâmica) | `TxView.jsx:317`, `ReportView.jsx:209`, `Landing.jsx:100`, `PrivacyPolicy.jsx:43`, `TermsOfService.jsx:47` | alta (percepção + conteúdo não cortado) | baixo | baixo (`@supports` + `vh` fallback) |
| **P0** | **Offline banner por estado real** (fetch-check + banner + contador "N tarefas pendentes") | `Offline.jsx:16`, novo `useOnlineStatus.js`, App.jsx:156 (ler `syncStatus` de `SyncBadge`) | alta (confiança/UX) | médio | médio (toca e2e offline) |
| **P0** | **Política de install por engajamento + dica iOS** | `pwa.js:122-168`, `InstallButton.jsx:14,17`, novo `IosInstallHint` | alta (conversão instalável) | médio | médio (e2e pwa-install) |
| P1 | **Tokens `--safe-*`** centralizados + aplicar FAB/offline/Footer | `design-tokens.css`, `QuickActions.jsx:47`, `Offline.jsx:16`, `Footer.jsx:148` | média (evita strike no notch) | baixo | baixo |
| P1 | **Haptics leves** (commit swipe, PTR release, delete) respeitando reduced-motion + gate iOS | novo `src/lib/haptics.js`, `TransactionCard.jsx`, `usePullToRefresh.js` | média (percepção nativa) | baixo | baixo (guard iOS) |
| P2 | **`touch-action: manipulation`** global em botões/links (remove 300ms) + `enterkeyhint`/`autoComplete` em dinheiro | `index.css`, `ui.jsx:60-80` (NumInp) | média (feels snappier) | baixo | baixo |
| P2 | **`overscroll-behavior-y: contain`** no container de lista (evita PTR nativo duplo quando já há PTR próprio) | `TxView.jsx`, `ReportView.jsx` (container `max-h-[calc(..)]`) | média (gesto nativo sem conflito) | baixo | baixo |

### Priorização (top 3 P0)

1. **`100dvh`/`100svh`** — `TxView:317` e `ReportView:209` cortam lista/tabela; `Landing:100` e
   `Privacy/Terms:43-47` dão *bounce* no hero. Unitário, sem risco de regressão de lógica.
2. **Offline banner por estado real** — `navigator.onLine` é mentiroso (OpenReplay #5); o banner
   `Offline.jsx:16` não reflete falha real de fetch. Ligar contador `SyncBadge` ao banner.
3. **Install por engajamento + iOS hint** — `pwa.js:159` captura o evento mas mostra o botão
   imediatamente; política de "≥2 sessões / ação de valor" sobe a taxa de instalação (web.dev #1).

---

## 4. Especificação técnica aplicável (pronta para implementação)

### 4.1 Tokens de safe-area (P1)

Adicionar ao `:root` de `src/shared/styles/design-tokens.css` (único ponto de mudança):

```css
:root {
  --safe-top:    env(safe-area-inset-top, 0px);
  --safe-right:  env(safe-area-inset-right, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left:   env(safe-area-inset-left, 0px);
}
```

Consumidores: `padding-bottom: var(--safe-bottom)` (BottomNav, Footer, FAB offline).
Manter `viewport-fit=cover` (index.html:6 ✅). Usar `max(1rem, env(...))` para piso em
dispositivos sem safe-area (Polypane recomenda).

```css
.bottom-sheet { padding-bottom: max(1rem, var(--safe-bottom)); }
```

### 4.2 Unidades dinâmicas (P0)

Fallback compatível (Safari <15.4 / Chrome <108 ainda não suportam `dvh`):

```css
/* util + fallback */
.full-bleed   { min-height: 100vh; min-height: 100svh; }            /* páginas: nunca estoura */
.scroll-area  { max-height: calc(100vh - 280px); }                   /* fallback legado */
@supports (height: 100dvh) {
  .scroll-area  { max-height: calc(100dvh - 280px); }               /* segue a toolbar live */
}
```

Aplicar em `TxView.jsx:317` → `max-h-[calc(100dvh-280px)]` (classe `.scroll-area`),
`ReportView.jsx:209` → `max-h-[calc(100dvh-400px)]`. Trocar `minHeight:'100vh'` de
`Landing.jsx:100` / `PrivacyPolicy.jsx:43` / `TermsOfService.jsx:47` por `100svh`
(hero "encaixar" → `svh` é o certo, não `dvh` — benchmark #2).

### 4.3 Install flow (P0)

- `pwa.js` já captura `beforeinstallprompt` (:159) e limpa em `appinstalled` (:164).
- Estender: persistir `localStorage('pwa-install-promo')` e só exibir `InstallButton`
  após **≥2 sessões** (`sessionStorage` counter) ou após ação de valor (ex.: salvar
  primeira transação via `onSave` no `SaleForm`). Se dispensado/instalado → não re-perguntar.
- **iOS:** `IosInstallHint` (stepper "Compartilhar → Adicionar à Tela → ••• em iOS 16.4+")
  exibido quando `!canInstall() && /iPhone|iPad/.test(UA) && !standalone`
  (`pwa.js:isStandalone` :128-132 já detecta `display-mode:standalone`/`navigator.standalone`).

```jsx
// IosInstallHint.jsx — visível só no Safari iOS standalone-potential
var iOS = typeof navigator !== 'undefined' && /iPhone|iPad/.test(navigator.userAgent);
var standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
if (iOS && !standalone && !canInstall()) { /* stepper UI */ }
```

### 4.4 Haptics (P1)

```js
// src/lib/haptics.js  (novo — offline-first, zero deps)
var allowHaptics = typeof navigator !== 'undefined' &&
  'vibrate' in navigator &&
  !matchMedia('(prefers-reduced-motion: reduce)').matches;
export function haptic(ms) { if (allowHaptics) navigator.vibrate(ms); }
```

- `TransactionCard` onAction `Excluir` → `haptic(30)`; `Editar` → `haptic(10)`; `Duplicar` → `haptic(10,20)`.
- `usePullToRefresh.js` no release-legar-refresh → `haptic([12, 40, 12])` (padrão de trigger).
- **NUNCA** vibrar autônomo (offline banner automático etc.) — benchmark #4.
- Guard por `'vibrate' in navigator` cobre iOS (que não expõe) — retorna `false`, `haptic` é no-op.

### 4.5 Banners/estado — estados possíveis (dark/light)

- **Offline banner** (`Offline.jsx:16`): manter `bg-amber-500` (visível até voltar) + adicionar
  contador discreto de pendências lendo `syncStatus.pending` (App.jsx:156 já passa para `SyncBadge`).
  Atualiza em `online`/fetch-check. Texto `text-xs` preservado.
- **Update banner** (`UpdateBanner.jsx:22`): já tem safe-area-top — NENHUMA mudança.
- **Estados CSS:** banner usa `fixed top-0` (offline) e `fixed bottom-0` (update) — combinar com
  `var(--safe-top)`/`var(--safe-bottom)` para não ficar sob a home indicator (offline) ou notch.

### 4.6 Interação com `--brand` dinâmica e offline-first

- O theming dinâmico (Free/Pro/Premium) usa `var(--brand)` (ex.: `QuickActions.jsx:21,59,74`).
  Safe-area `env()` e `dvh`/`svh` são CSS puro → **sem conflito** com `--brand`.
- Offline-first (Dexie) já garante leitura (`src/lib/dexie.js`); o ganho do P0 é **informar**
  o user sobre pendências reais (contagem) — ligar `SyncBadge`/`syncStatus` ao `Offline.jsx`.

### 4.7 PWA install UX refinement (P0/P2)

- **24h de engajamento antes do prompt:** não bloquear primeira sessão — usar um
  `sessionStorage` contator + `performance.now()` de primeira visita; só exibir
  `InstallButton` após interação positiva (ex.: 2 navegações + 1 save). web.dev #1 recomenda
  "after a critical user journey".
- **Manifest `id`:** adicionar `"id": "/"` (ou app-id) para distinguir a entidade PWA
  (whatpwacando.today recomenda `id` estável antes do `start_url`).
- **Background sync periódico:** `sw.ts:84` já tem `financia-mutations` — registrar um
  período de sync (`sync` evento) só após `appinstalled` para não "envelhecer" mutações
  pendentes quando o app está fechado (web.dev/background-sync-api). Nível P2 (não crítico).

### 4.8 Inputs monetários (P2)

- `NumInp` (`ui.jsx:60-90`): manter `inputMode='decimal'` + `type='text'`.
- **Adicionar:** `enterkeyhint="done"` no form de dinheiro, `autoComplete="off"`
  (evita sugestões que quebram máscara pt-BR), `scroll-margin-top` no container de form
  para campos não ficarem escondidos atrás do teclado (com `100svh` real isto fica previsível).
- Corrigir: remover menção a `pattern` que não existe.

---

## 5. Dependências & libs (se aplicável)

| Lib/Melhor | Versão (pesquisada) | Por quê | Custo ~KB gzip | Alternativa sem custo |
|---|---|---|---|---|
| `vite-plugin-pwa` (existente) | já no package.json | Não precisa de nada novo | 0 | — |
| CSS `env()` / `dvh`/`svh` | nativo | zero deps para safe-area e unidades dinâmicas | 0 | — |
| Vibration API | nativo | haptics sem lib | 0 | (iOS: gráfico/audio fallback via CSS) |
| Nenhuma lib nova | — | fallback CSS para `dvh` basta (não há polyfill bom) | 0 | `@supports` + `vh`/`svh`/`dvh` cascade |

> Conclusão: **nenhuma dependência nova** — tudo nativo/browser primitives.

---

## 6. Checklist para os 10 implementadores (Fase 2)

**Ordem de execução (evitar conflitos entre frentes):**

- [ ] **4.1** (P1) tokens `--safe-*` em `src/shared/styles/design-tokens.css` — 1º, sem tocar UI.
- [ ] **4.2** (P0) `100dvh/100svh` + fallback em `TxView.jsx:317`, `ReportView.jsx:209`,
      `Landing.jsx:100`, `PrivacyPolicy.jsx:43`, `TermsOfService.jsx:47` — trocar classes
      `max-h-[calc(100vh-*px)]` → `max-h-[calc(100dvh-*px)]` + adicionar `.scroll-area`;
      `minHeight:'100vh'` → `'100svh'` nos três landings. Testar T2/T3 + iPhone.
      - Verificação leve: PWA no celular, puxe a lista; altura **não pula** no scroll.
- [ ] **4.4** (P1) `src/lib/haptics.js` + ligar em `TransactionCard.jsx` (delete/edit/duplicar)
      e `usePullToRefresh.js` (release). **Guard obrigatório:** `'vibrate' in navigator` + `prefers-reduced-motion`.
- [ ] **4.3** (P0) política de install (≥2 sessões ou ação de valor) + `IosInstallHint` —
      **separado**; revisar `e2e/pwa-install.spec.ts` para acomodar o "engajamento".
- [ ] **4.5** (P0) contador de pendências no `Offline.jsx` lendo `syncStatus` (App.jsx:156);
      rodar `e2e/pwa-offline.spec.ts`.
- [ ] **4.2-OS** (P0) `overscroll-behavior-y: contain` no container `.scroll-area` de TxView/ReportView
      (evita PTR nativo duplo quando `usePullToRefresh` intercepta no topo).
- [ ] **4.8** (P2) `enterkeyhint`/`autoComplete` em `NumInp` (`ui.jsx:60-90`); `touch-action: manipulation`
      global em `index.css` (revisar que a lista `.scroll-area` mantém `pan-y`/contain).
- [ ] `npm run validate:fast` a cada passo; ao final `npm run validate:full`.
- [ ] Pontos que **NÃO podem quebrar:** `e2e/pwa-offline`, `pwa-install`, `pwa-cache`,
      `pwa-register`, `offline-state-corruption`, `usePullToRefresh.test.js`,
      `useSwipeActions.test.js`, `QuickActions.test.jsx`.

---

## 7. Log de coleta (transparência — auditável)

| # | Tipo | Alvo (query/URL/arquivo) | Conhecimento extraído |
|---|------|--------------------------|------------------------|
| 1 | busca | "PWA install prompt beforeinstallprompt appinstalled best practices 2025" | Mostrar só após engajamento + `userChoice`; `appinstalled` oculta UI; Chrome removed engagement req (m131). |
| 2 | fetch | https://web.dev/articles/promote-install | web.dev #1: banner após interesse; "value: WoC e 1s sem redirect"; iOS share-sheet. |
| 3 | busca | "100vh vs 100dvh Chrome mobile address bar jump" | `100vh`=large; `100svh`=safe max; `100dvh`=live; `.hero{100svh}` / `.sheet{100dvh}`. |
| 4 | fetch | https://specification.website/spec/performance/dynamic-viewport-units | Tabela lvh/svh/dvh; receita `svh` hero / `dvh` overlay; evitar animar `dvh` (jitter). |
| 5 | busca | "env() safe-area-inset-* CSS viewport-fit cover" | Requer `viewport-fit=cover` (index.html:6 ✅); fallback `env(x,0px)`; suporte 2020; landscape notch. |
| 6 | fetch | https://developer.mozilla.org/en-US/docs/Web/CSS/env() | Confirma contrato `env()` + fallback value; só `safe-area-inset-*` são spec. |
| 7 | fetch | https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API | Exige user gesture; iOS não expõe (`'vibrate' in navigator`→false); cap 10s; bg tab suprimido. |
| 8 | busca | "Vibration API haptics guidelines reduced motion iOS Safari" | iOS Safari não implementa vibrate (bugnet Jan/2026); respeitar prefers-reduced-motion; patterns curtos. |
| 9 | fetch | https://blog.openreplay.com/detect-online-offline-status-javascript/ | `navigator.onLine` mentiroso; `false` confiável; `true`≠internet; fetch-check + fila + idempotencyKey. |
| 10 | busca | "navigator.onLine not reliable offline detection pattern" | Pattern de banner + contagem + flush no `online`/`visibilitychange`; Next.js `useOffline` confirma abordagem. |
| 11 | busca | "overscroll-behavior contain pull to refresh mobile" | `contain` contém chaining sem matar PTR local; `body{overscroll-behavior-y:contain}` desabilita PTR nativo. |
| 12 | busca | "touch-action manipulation 300ms delay pan-y" | `manipulation` remove atraso click (alias pan-x pan-y pinch-zoom); aplica a botões/links. |
| 13 | busca | "WCAG 2.2 target size 44px touch minimum 2026" | 2.5.8 (AA) 24×24 mínimo; 44×44 recomendado; EAA enforcement Jun/2025. App já 44px (index.css:185). |
| 14 | busca | "iOS PWA add to home screen share sheet install 2025" | iOS não dispara beforeinstallprompt; share sheet → Adicionar à Tela; iOS 16.4+ toca `•••`; iOS 26 toggle "Open as Web App". |
| 15 | busca | "pull to refresh damping rubber band implementation pattern" | Guard `scrollTop===0`; damping 0.5; cap 90px; release threshold ~70px; `.dragging` desabilita transition. |
| 16 | busca | "beforeinstallprompt engagement heuristic dismiss never re-prompt" | Critérios: manifest válido + SW + HTTPS + engagement; `prompt()` só uma vez por evento; Chrome m131 removeu requisito. |
| 17 | leitura | `index.html:6,27` | viewport-fit=cover + theme-color #002f59 — base para env() e PWA theme. |
| 18 | leitura | `src/lib/pwa.js` (168 linhas, integral) | :27 SKIP_WAITING, :41 registerSW, :122-168 bloco install (beforeinstallprompt :159, appinstalled :164). |
| 19 | leitura | `src/shared/ui/Offline.jsx` (integral) | :16 banner z-40 bg-amber-500; online/offline listeners :8-9 (não navigator.onLine no banner). |
| 20 | leitura | `src/shared/ui/QuickActions.jsx` (integral) | :47 bottom-32 (128px, não colado na base); :55 touch-target; :72 aria-expanded. |
| 21 | leitura | `src/shared/ui/BottomNav.jsx` (integral) | :12 env(safe-area-inset-bottom); :20 nav fixed lg:hidden; :27 44px touch. |
| 22 | leitura | `src/shared/ui/InstallButton.jsx` (integral) | :2 import pwa; :11 listener; :17 onClick promptInstall; :14 só renderiza se available. |
| 23 | leitura | `src/shared/hooks/usePullToRefresh.js` (integral) | :40 top guard, :53 preventDefault passive:false, :54 damping, :70 refresh threshold; SEM touchAction/overscroll no JS. |
| 24 | leitura | `src/shared/hooks/useSwipeActions.js` | :3 THRESHOLD_PX=80, :10 configurable, :31 commit; ZERO vibrate no repo. |
| 25 | leitura | `src/sw.ts` (integral) | :11 precache, :23-33 CacheFirst, :48-58 NetworkFirst api, :62-74 NetworkFirst supabase, :79-90 BackgroundSync. |
| 26 | leitura | `public/manifest.json` (integral) | standalone, portrait, theme #002f59, 192/512 maskable; falta id/screenshots/shortcuts. |
| 27 | leitura | `vite.config.js:23-51` | VitePWA injectManifest, registerType prompt, globPatterns js/css/html. |
| 28 | leitura | `src/shared/ui/UpdateBanner.jsx:22` | z-[60] + paddingTop env(safe-area-inset-top). |
| 29 | leitura | `src/shared/ui/Footer.jsx:147-148` | fixed bottom + env(safe-area-inset-bottom). |
| 30 | leitura | `src/shared/styles/design-tokens.css` | foco/padding/fontes; **nenhum** --safe-* token. |
| 31 | leitura | `src/index.css:185` | --touch-target-min: 44px; **nenhum** --safe-* token. |
| 32 | leitura | `src/shared/ui/ui.jsx:60-80` (NumInp) | inputMode decimal/numeric; type text; **não** há pattern prop. |
| 33 | leitura | `src/App.jsx:15,63,156` | import Offline; navigator.onLine no reload plan; SyncBadge render. |
| 34 | leitura | `TxView.jsx:317`, `ReportView.jsx:209` | max-h-[calc(100vh-280px)] / calc(100vh-400px). |
| 35 | leitura | `Landing.jsx:100`,`PrivacyPolicy.jsx:43`,`TermsOfService.jsx:47` | minHeight 100vh (src/features/landing/, não src/pages/). |
| 36 | leitura | `e2e/` lista specs | pwa-offline/cache/install/register + offline-state-corruption existem. |

---

## 8. Fontes completas

**URLs fetched (5) — conteúdo lido integralmente para extrair trechos:**
1. https://web.dev/articles/promote-install — patterns de promoção de instalação
2. https://specification.website/spec/performance/dynamic-viewport-units — dvh/svh/lvh
3. https://developer.mozilla.org/en-US/docs/Web/CSS/env() — env() e notches
4. https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API — haptic, gesture, iOS
5. https://blog.openreplay.com/detect-online-offline-status-javascript/ — offline detection

**Arquivos lidos (file:line) — 22 arquivos distintos:**
- `index.html:6` (viewport-fit=cover), `index.html:27` (theme-color)
- `src/index.css:185` (`--touch-target-min: 44px`) — sem `--safe-*`
- `src/shared/styles/design-tokens.css` (sem `--safe-*`)
- `src/shared/ui/BottomNav.jsx:12,20,27`; `UpdateBanner.jsx:22`; `Footer.jsx:147-148`; `Offline.jsx:16` (não src/components/SyncState/)
- `src/shared/ui/QuickActions.jsx:47` (bottom-32); `InstallButton.jsx:2,11,14,17,24,25`
- `src/lib/pwa.js:27,41,122-168,159,164`
- `src/shared/hooks/usePullToRefresh.js` (integral, 117 linhas; SEM touchAction/overscroll no JS)
- `src/shared/hooks/useSwipeActions.js:3,10,31` (THRESHOLD=80; zero vibrate)
- `src/shared/ui/ui.jsx:60,80` (NumInp inputMode decimal, type text — sem pattern)
- `src/features/transactions/TxView.jsx:317` (`calc(100vh-280px)`); `src/features/reports/ReportView.jsx:209` (`calc(100vh-400px)`)
- `src/features/landing/Landing.jsx:100`, `PrivacyPolicy.jsx:43`, `TermsOfService.jsx:47` (`minHeight 100vh`)
- `src/App.jsx:15,63,156`; `public/manifest.json`; `vite.config.js:23-51`; `src/sw.ts:2,11,23-33,48-58,62-74,79-90`
- `src/shared/ui/SyncBadge.jsx` (referido via App.jsx:156); `e2e/{pwa-offline,pwa-install,pwa-cache,pwa-register,offline-state-corruption}.spec.ts`

---

## Conclusão executiva (retorno)

Análise `REFINE_07`: **P0** = (1) port de `100vh`→`100dvh/svh` com fallback `@supports`
(`TxView:317`, `ReportView:209`, `Landing:100`, `PrivacyPolicy:43`, `TermsOfService:47`) —
elimina o jump/corte da barra de endereço dinâmica no Chrome Android; (2) detecção offline real
via fetch-check + banner com contador de pendências (`Offline.jsx:16` + `syncStatus` via
`App.jsx:156`/`SyncBadge`), corrigindo o `navigator.onLine` mentiroso; (3) política de install
por engajamento (≥2 sessões ou ação de valor) + dica iOS share-sheet (`pwa.js:122-168`,
`InstallButton.jsx:14-17`, `canInstall()`). **P1** = tokens `--safe-*` centralizados no
`design-tokens.css` + haptics guardados (`'vibrate' in navigator` + `prefers-reduced-motion`)
ligados a swipe/PTR/delete. **P2** = `touch-action: manipulation` global + `enterkeyhint`/
`autoComplete` em `NumInp` + `overscroll-behavior-y: contain` no container de lista.

Sem diffs de src — NENHUMA depedência nova (tudo browser primitives). E2E a invalidar: `pwa-offline`,
`pwa-install`, `pwa-cache`, `pwa-register`, `offline-state-corruption`, `usePullToRefresh.test.js`,
`useSwipeActions.test.js`. Top 3 P0 bloqueadores de UX mobile: viewport dinâmico, offline real,
instalação engajada + iOS.
