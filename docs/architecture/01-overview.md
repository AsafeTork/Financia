# 01 — Visão Geral do Projeto

## O que é

Financia é um app **white-label** de gestão financeira para pequenas empresas. Cada cliente tem sua própria identidade visual (nome, logo, cores) e o app roda como PWA, APK Android, ou EXE Windows.

## Stack

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + Vite | 18 + 5 |
| Estilo | Tailwind CSS + CSS vars | v3 |
| Backend | Supabase (PostgreSQL + Auth + RLS + Edge Functions) | — |
| Offline | Dexie (IndexedDB) | v3 |
| Desktop | Electron | 31 |
| Deploy | Render (static site, auto-deploy em push para `main`) | — |
| CI/CD | GitHub Actions (APK Android + EXE Windows) | — |
| Pagamentos | Stripe (assinaturas + white-label one-time) | — |
| Testes | Vitest + Testing Library | — |

## Estrutura de Diretórios

```
src/
  App.jsx               Estado global, roteamento, integra hooks
  main.jsx              Entry point React
  index.css             CSS vars do tema (claro/escuro/planos)
  animations.css        Animações globais
  lib/
    db.js               Dexie + sync bidirecional + admin fetches
    supabase.js         Cliente Supabase (anon key via .env)
    auth.js             Helpers de autenticação
    constants.js        INIT_BRAND, PLAN_LIMITS, PRICING_PLANS, THEME_PRESETS
    utils.js            fmt, deriveCores, brandAlpha, hexToHsl, luminance, etc.
    stripe.js           Integração Stripe Elements
    aiClient.js         Proxy para API de IA (paleta, insights)
    recurring.js        Lançamentos recorrentes
    exporters.js        Exportação CSV/PDF
  hooks/
    useSession.js       Sessão, loadData, impersonação
    useBrandManager.js  saveBrand + savePhone
    useBrandAppearance.js applyBrandVars + appBrand + toggleTheme
    useDataLoader.js    loadFromLocal (Dexie → React state)
    useAuthBootstrap.js getSession + onAuthStateChange
    useSyncLoop.js      Loop de sync a cada 2min + visibilitychange
    useRealtime.js      Subscriptions Supabase Realtime
    useImpersonation.js Fluxo cross-tab de impersonação
    useTx.js            CRUD de transações
    useProducts.js      CRUD de produtos + adjustStock
    useLosses.js        CRUD de perdas
    useScrollReveal.js  Animação scroll
  views/
    Dashboard.jsx       KPIs, gráfico, ações rápidas
    TxView.jsx          Lista de transações (income/expense)
    InventoryView.jsx   Estoque + perdas
    ReportView.jsx      Relatório mensal + exportação
    SettingsView.jsx    Conta, assinatura, aparência (white-label), admin
    PlansView.jsx       Vitrine de planos + checkout Stripe
    Login.jsx           Autenticação
    Landing.jsx         Landing page pública
    EmailView.jsx       Comunicação (admin)
    PrivacyPolicy.jsx   Política de privacidade
    TermsOfService.jsx  Termos de uso
  components/
    Sidebar.jsx         Menu lateral desktop (React.memo)
    BottomNav.jsx       Navegação inferior mobile (React.memo)
    Header.jsx          Cabeçalho mobile (React.memo)
    ThemeToggle.jsx     Toggle dark/light
    Toast.jsx           Notificações
    Confirm.jsx         Confirmação destrutiva
    ui.jsx              Card, Inp, Btn, Modal, Badge, Skeleton, etc.
    ColorField.jsx      Color picker compartilhado
    StripeCheckout.jsx  Modal de pagamento Stripe
    Onboarding.jsx      Onboarding nome/telefone
    UpgradeModal.jsx    Modal de upgrade de plano
    Offline.jsx         Banner offline
    UpdateBanner.jsx    Banner de atualização PWA
    SyncBadge.jsx       Badge de status de sync
  admin/
    AdminPanel.jsx      Lista de clientes + ações
    ClientEditModal.jsx Editor completo: paleta, IA, plano, white-label, preços
    GhTokenCard.jsx     Configuração do token GitHub
supabase/
  migrations/           19 migrações SQL versionadas
  functions/            18 Edge Functions (Deno)
electron/
  main.cjs              Main process (carrega URL de produção)
scripts/                gen_icons.py, gen_icon_win.py, verify_syntax.cjs
docs/                   Esta documentação
```

## Roteamento

Hash routing puro (sem react-router): `#dashboard`, `#income`, `#expense`, `#inventory`, `#email`, `#report`, `#settings`, `#planos`.

Páginas públicas sem wrapper logado: `#landing`, `#privacidade`, `#termos`.

Todas as views são `React.lazy()` com `<Suspense>`.

## Estados Globais (App.jsx)

16 `useState` + 7 `useCallback` + `useMemo` para objeto `views`.

| Estado | Tipo | Descrição |
|--------|------|-----------|
| `session` | object/null | Sessão Supabase Auth |
| `isAdminDB` | boolean | Role admin (sessionStorage) |
| `appLoading` | boolean | Spinner inicial |
| `dataLoading` | boolean | Spinner de carregamento |
| `dataError` | string/null | Erro de carregamento |
| `brand` | object | Identidade visual bruta do DB |
| `planInfo` | object | Plano + expiração + preços custom |
| `syncStatus` | string | idle/ok/error/syncing |
| `view` | string | View atual |
| `sidebarOpen` | boolean | Sidebar mobile |
| `toasts` | array | Notificações ativas |
| `confirmData` | object/null | Confirmação pendente |
| `showLogin` | boolean | Mostrar Login vs Landing |
| `showUpgrade` | bool/obj | Modal upgrade |
| `onboardingNeeded` | boolean | Onboarding ativo |

## Fluxo de Dados Principal

```
Login → useAuthBootstrap → getSession
  → useSession.loadData(uid)
    → useDataLoader.loadFromLocal(uid)     [Dexie → React state]
    → db.syncAll(uid)                      [Push local→remoto + Pull remoto→local]
    → useDataLoader.loadFromLocal(uid)     [Re-lê Dexie atualizado]
  → setBrand + setPlanInfo
  → useBrandAppearance(brand, planInfo)
    → appBrand (cores finais após lógica de plano/white-label)
    → applyBrandVars(appBrand)             [CSS vars no <html>]
  → Renderiza app
```

## Comandos

```bash
npm run dev            # Vite dev server (localhost:5173)
npm run build          # Build produção (dist/)
npm test               # Vitest (1113 testes)
npm run lint           # ESLint (0 errors esperado)
npm run electron:start # Electron local
npm run electron:build # Instalador NSIS Windows
git push origin main   # Deploy automático Render (~2-3 min)
```

## Problemas Conhecidos

- Cliente promovido para Pro precisa de logout/login (ou 2min de sync)
- Admin precisa re-logar ao abrir nova aba (sessionStorage limpa)
- Build JS ~320 kB / ~103 kB gzip
- Impersonação depende de `pagehide`: kill forçado pode perder o evento
