# REFINE_07 — Mobile / PWA app-like feel

> ⚠️ Preencher seguindo `docs/design/TEMPLATE.md` (seções 0-8, ≥300 linhas).

## Objetivo
Experiência "aplicativo nativo" no celular/PWA: gestos (swipe, pull-to-refresh já existem —
auditar), bottom nav, quick actions (FAB), safe-area insets, teclado numérico em campos de
dinheiro, haptics leve, offline UX (banners de "você está offline"), apertura de segunda tela.

## Contexto mínimo
- `src/shared/hooks/usePullToRefresh.js`, `useSwipeActions.js`, `useSchedulerYield.js`
- `src/components/BottomNav...` (glob) ou onde a nav mora; `src/features/quick/QuickActions.jsx`
- `src/index.css` (safe-area variáveis?), `manifest` (PWA), `src/sw.ts`
- Testes E2E sensíveis a gestos: `e2e/` (glob) — não quebrar

## Pesquisa obrigatória (≥10 buscas)
mobile web app feel like native 2025/2026, safe-area-inset CSS env(), iOS PWA bottom bar
overlap fix, Android PWA install prompts (beforeinstallprompt), off-line detection pattern
(navigator.onLine + events), vibration API guidelines, 44px touch (já ok - confirmar),
bottom sheet patterns (CSS), mobile inpt number money formatting pt-BR.

## Retorno
`buscas=.., urls=.., lidos=.., doc_linhas=.. | top3 P0`