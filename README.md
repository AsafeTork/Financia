![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-1178+-blue)
![Coverage](https://img.shields.io/badge/coverage-40%25-yellow)

# Financia

Offline-first white-label financial management app for small businesses.  
Runs as PWA, Electron desktop app (Windows), and Android TWA.

## Tech Stack

**Frontend** React 18, Vite 5, Tailwind CSS 3, shadcn/ui, Radix  
**State & Offline** Dexie.js 3 (IndexedDB)  
**Backend** Supabase 2 (PostgreSQL, Auth, RLS, Edge Functions)  
**Payments** Stripe  
**Desktop** Electron 31  
**Mobile** Android TWA (WebView)  
**Testing** Vitest 4 + Testing Library + Playwright  
**Bundle** Vite manualChunks (vendor, supabase, query, dexie, radix, stripe)

## Commands

```bash
npm run dev        # → http://localhost:5173
npm test           # Vitest (1178+ tests)
npm run test:coverage # Vitest + coverage
npm run lint       # eslint src/
npm run typecheck  # tsc --noEmit
npm run build      # Vite build
npm run check      # lint + typecheck + test
npm run analyze    # Vite + rollup-visualizer
```

## Architecture

```
src/
  features/       # Domain modules (auth, transactions, admin, etc.)
    admin/
    auth/
    dashboard/
    inventory/
    transactions/
    ...
  shared/         # Cross-cutting code
    hooks/        # Shared hooks (useAuth, useBusca, etc.)
    layout/       # App shell, navigation
    ui/           # shadcn/ui components (Button, Input, Dialog, etc.)
  lib/            # Utils, services (Dexie, Supabase client)
  core/           # Boot, providers, app initialization
  routes/         # Route definitions
  ai/             # AI prompts and integrations
  context/        # React context providers
  test/           # Test setup, mocks, generated tests
  docs/           # Project documentation
```

## PWA

- **Service Worker** (`public/sw.js`): custom SW with network-first navigation, cache-first hashed assets, asset precaching on install, progress reporting, and controlled (user-driven) updates via `SKIP_WAITING`.
- **Manifest** (`public/manifest.json`): static `<link rel="manifest">` with `standalone` display, theme color `#002f59`, SVG icons, `pt-BR` locale.
- **Offline**: Dexie IndexedDB stores all business data locally; sync module reconciles with Supabase when online.
- **Install**: captura `beforeinstallprompt`; `InstallButton` component for manual install.

## Testing

- **Framework**: Vitest 4 with `jsdom` environment, threads pool, 15s timeout
- **Coverage**: v8 provider, 40% minimum thresholds, `lcov` + `text-summary` reporters
- **Files**: ~21 test files across features, lib, shared, and test/gen (1178+ tests)
- **Mocks**: `fake-indexeddb` for Dexie, `src/test/setup.js` for global setup
- **E2E**: Playwright available via `@playwright/test`

## Architecture Decisions

- **Feature-first**: each domain module lives in `src/features/<domain>/` with its own components, hooks, and tests
- **Lazy loading**: routes are code-split by feature via `React.lazy`
- **Manual chunks**: build splits into `vendor` (React, router), `supabase`, `query` (TanStack), `dexie`, `radix`, `stripe` — supabase further split into auth/db/realtime/storage sub-chunks
- **Offline-first**: Dexie as local source of truth; Supabase sync happens asynchronously
- **Service worker**: custom (no Workbox), network-first HTML, cache-first assets, user-controlled updates
- **Side effects**: `"sideEffects": false` in `package.json` enables aggressive tree-shaking

## Problemas a resolver...: fluxo atual

### Ciclo de vida da aplicação

```
HTML carrega (index.html com data-app-version)
    ↓
boot.js → sanitizeCorruptedStorage() → registerSW() → checkVersion()
    ↓
React monta <App/> → useAppState() cria todos os useState
    ↓
useBrandAppearance() aplica CSS variables (tema, cores, tipografia)
    ↓
useAuthBootstrap() → sb.auth.getSession()
    ├─ Se há sessão → loadData(userId) → useSession()
    │   ├─ loadFromLocal() → 5 queries Dexie (profiles, products, transactions, losses, meta)
    │   │   └─ pendingRecurring() → gera transações recorrentes pendentes
    │   ├─ Reconnect realtime → useRealtime() → subscribe canal postgres_changes
    │   ├─ syncAll() → upsert para Supabase + pull remoto
    │   │   ├─ syncTable(transactions) → paginado 500 em 500
    │   │   ├─ syncTable(products)     → paginado 500 em 500
    │   │   ├─ syncTable(losses)       → paginado 500 em 500
    │   │   └─ syncProfiles()          → upsert company_profiles
    │   └─ fetchRole() → user_roles → is_admin em sessionStorage
    │
    └─ Se não há sessão → appLoading = false → mostra Landing/Login
```

### Roteamento (hash-based via React Router)

O app NÃO usa hash routing. Usa React Router normal com basename via BrowserRouter.
As rotas são definidas em `src/routes/routes.jsx`:

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | Dashboard | KPIs, gráficos, resumo financeiro |
| `/dashboard` | Dashboard | (alias de `/`) |
| `/income` | TxView type="income" | Vendas e ganhos (lista virtual com @tanstack/react-virtual) |
| `/expense` | TxView type="expense" | Despesas |
| `/inventory` | InventoryView | Produtos e perdas |
| `/email` | EmailView | Comunicação (admin only) |
| `/report` | ReportView | Relatórios financeiros |
| `/settings` | SettingsView | Configurações do perfil/empresa |
| `/planos` | PlansView | Planos e assinatura |
| `/brandstudio` | BrandStudioView | Editor de identidade visual |

### Fluxo de navegação

```
Sidebar (desktop, <lg) / BottomNav (mobile, lg:hidden)
    ↓
useNavigation.navTo(v) → navigate('/' + v) + navigationHistory.push()
    ↓
path = location.pathname.replace(/^\//, '')
    ↓
currentView = path ∈ ['dashboard','income','expense','inventory','email','report','settings','planos','brandstudio'] ? path : 'dashboard'
    ↓
<div key={n.currentView} className="anim-page-view">
    <AppRoutes/>
</div>
```

**Atalhos de teclado (g + key):**
- `g+d` → Dashboard
- `g+t` → Transações (income)
- `g+i` → Estoque
- `g+s` → Configurações
- `g+r` → Relatório
- `g+p` → Planos

### Lazy loading com timeout

Todas as rotas e componentes pesados usam `React.lazy` + `LazyPage`:

```
LazyPage (timeout: 12s)
    ├─ Suspense com fallback (Loader ou PageSkeleton)
    ├─ ResetTimer child → limpa timer quando Suspense resolve
    └─ Se timeout > 12s → mostra erro "A página demorou muito" + botão retry (reload)
```

### Camadas de contexto

```
<AppProvider value={ctx}>
    ├─ stableCtx (memoizado)
    │   ├─ session, brand, planInfo, syncStatus
    │   ├─ toasts, confirmData, showLogin, showUpgrade
    │   ├─ navTo, toast, confirm, handleNav
    │   └─ saveBrand, savePhone, loadData, enforceLimit
    │
    ├─ dataCtx (memoizado)
    │   ├─ tx, setTx, addTx, editTx, deleteTx, addGenerated
    │   ├─ products, setProducts, addProduct, editProduct, deleteProduct
    │   └─ losses, setLosses, addLoss, editLoss, deleteLoss, adjustStock
    │
    └─ ctx = { ...stableCtx, ...dataCtx }
```

### Sincronização offline-first

```
IndexedDB (Dexie: gestao_offline v4)
    ├─ transactions: [id, user_id, [user_id+_deleted], date, updated_at, _synced, _deleted]
    ├─ products:     [id, user_id, [user_id+_deleted], created_at, category, updated_at, _synced, _deleted]
    ├─ losses:       [id, user_id, [user_id+_deleted], date, updated_at, _synced, _deleted]
    ├─ profiles:     [user_id, updated_at, _synced]
    ├─ meta:         [key] (role, last_sync, etc.)
    ├─ brand_presets: [id, name, category, favorite, updated_at]
    └─ brand_logo_schemes: [id, name, createdAt]

Cada registro local possui:
    _synced: 0 = alterado localmente, 1 = sincronizado com Supabase
    _deleted: 0 = ativo, 1 = soft-deleted
    _updated_at: timestamp da última atualização
```

**Sincronização (syncAll com 3s timeout + backoff):**

```
syncAll(userId)
    ├─ syncTable('transactions') → upsert não-synced → pull remoto desde lastSync
    ├─ syncTable('products')     → upsert não-synced → pull remoto desde lastSync
    ├─ syncTable('losses')       → upsert não-synced → pull remoto desde lastSync
    └─ syncProfiles()            → upsert company_profiles → pull remoto

Triggers de sync:
    ├─ Intervalo: 120s (a cada 2 minutos)
    ├─ Visibilidade: quando aba fica visible
    ├─ Online: quando reconecta
    ├─ Realtime: postgres_changes nas 4 tabelas → debounce 2s → runSync
    └─ Líder选举: BroadcastChannel('financia-sync-leader') → apenas 1 aba sincroniza
```

### Web Worker de sync

O sync pode rodar em Web Worker (`src/workers/sync.worker.js`) quando disponível.
Fallback: sync direto no main thread (não deve acontecer em produção).

### Realtime (Supabase)

```
canal: 'rt-' + uid
    ├─ postgres_changes → transactions  → doSync (debounce 2s)
    ├─ postgres_changes → products      → doSync
    ├─ postgres_changes → losses        → doSync
    ├─ postgres_changes → company_profiles → doSync
    └─ postgres_changes → company_profiles (UPDATE, user_id=eq.uid) → applyPlan (atualiza plano em tempo real)

Status: SUBSCRIBED → ok
Status: CHANNEL_ERROR / TIMED_OUT → retry com backoff exponencial (1s → 2s → 4s → ... → 30s max)
```

### QuickActions (FAB)

Acessível apenas nas views: dashboard, income, expense, inventory.
Abre menu com atalhos para criar venda/despesa/produto/perda.
Usa `emitQuickIntent(type)` para comunicar com a view alvo.

### Brand appearance

```
useBrandAppearance(brand, planInfo)
    ├─ appBrand = brand (white_label) ou visual_preset (free/pro)
    ├─ effectiveTheme = themePref || brand.theme || 'light'
    ├─ applyBrandVars() → 40+ CSS variables em document.documentElement
    │   ├─ --brand, --brand-soft, --brand-secondary, --brand-accent
    │   ├─ --bg-page, --bg-card, --bg-subtle, --text-main, --text-sub
    │   ├─ --border, --shadow-sm/md/lg
    │   └─ brand_config overrides (palette, typography, spacing, etc.)
    └─ toggleTheme() → data-theme="dark|light" + localStorage
```

### Rotas legais e landing

```
/privacidade → PrivacyPolicy (lazy)
/termos      → TermsOfService (lazy)
/landing     → Landing (lazy)

Landing aparece quando:
    ├─ path === 'landing'
    ├─ Não há sessão E não há financia_seen no localStorage
    └─ Senão → Login

Onboarding aparece quando:
    ├─ Sessão ativa
    ├─ brand.name === google_name (nome do Google não foi substituído)
    └─ financia_onboarded_{uid} não existe no localStorage
```

### Segurança

- **RLS (Row Level Security):** todas as tabelas têm RLS habilitado
- **SECURITY DEFINER:** funções admin (delete_client, impersonate, set_client_plan) exigem role='admin' em user_roles
- **White label guard:** trigger `company_profiles_before_update` reverte mudanças de white_label que não vêm de service_role
- **Plan guard:** trigger impede mudança de plano sem GUC `app.allow_plan_change = '1'`
- **Impersonation:** admin pode assumir identidade de cliente via RPC + cron de expiração
- **Soft delete:** registros não são removidos do IndexedDB; marcados com `_deleted=1` e sincronizados como delete no Supabase

### Plano e limites

```
free:    50 transações, 20 produtos, 10 perdas
pro:     ilimitado
premium: ilimitado

effectivePlan considera expiração:
    ├─ plan !== 'pro' && plan !== 'premium' → 'free'
    ├─ !plan_expires_at → retorna plan
    └─ plan_expires_at > now() → plan, senão 'free'

Upgrade via Stripe → webhook → set_client_plan() (SECURITY DEFINER)
Downgrade automático: plano expirado cai para free
```

---

## Estado do Banco de Dados (Supabase)

### Tabelas Principais

| Tabela | Descrição | Colunas-chave |
|--------|-----------|---------------|
| `company_profiles` | Perfil da empresa/usuário | user_id (PK→auth.users), name, logo, logo_url, color, color_secondary, color_accent, theme, white_label, niche, phone, plan, plan_expires_at, plan_activated_by, custom_prices (jsonb), custom_palette, visual_version, brand_config (jsonb), stripe_customer_id, segment, created_at, updated_at |
| `transactions` | Vendas, ganhos e despesas | id (uuid PK), user_id, type ('income'\|'expense'), description, amount (numeric), date (text 'YYYY-MM-DD'), method, category, items (jsonb), registered_by, updated_at |
| `products` | Estoque de produtos | id (uuid PK), user_id, name, category, price (numeric), cost (numeric), stock (integer), registered_by, created_at, updated_at |
| `losses` | Registros de perdas/quebras | id (uuid PK), user_id, description, qty (integer), reason, date (text 'YYYY-MM-DD'), registered_by, updated_at |
| `user_roles` | Papel do usuário | user_id (PK→auth.users), role ('admin'\|'client') |

### Tabelas Auxiliares

| Tabela | Descrição |
|--------|-----------|
| `stripe_webhook_dlq` | Fila de eventos da Stripe que falharam (para replay/debug) |
| `ai_cache` | Cache de respostas da IA (rate-limited) |

### Índices Principais

```sql
-- company_profiles
idx_company_profiles_plan              ON (plan)
idx_company_profiles_plan_expires      ON (plan_expires_at)
idx_company_profiles_white_label       ON (white_label)
idx_company_profiles_stripe_customer   ON (stripe_customer_id)
idx_company_profiles_custom_prices     USING GIN (custom_prices)

-- transactions / products / losses (por user_id)
-- Índices compostos [user_id+_deleted] para queries offline-first
```

### Triggers Consolidados

```
company_profiles (BEFORE UPDATE):
    └─ trg_company_profiles_bu → company_profiles_before_update()
        ├─ Impedir mudança de plano sem GUC app.allow_plan_change
        ├─ Reverter white_label se não for service_role
        └─ Atualizar updated_at
```

### Funções RPC (SECURITY DEFINER)

| Função | Chamada por | Descrição |
|--------|-------------|-----------|
| `set_client_plan(target, plan, actor, expires_at)` | admin / Stripe webhook | Ativa/rebaixa plano |
| `set_white_label(user, on)` | service_role | Liga/desliga white-label |
| `admin_delete_client(target_uid)` | admin | Deleta cliente + auth.users |
| `admin_get_magic_link(target_uid)` | admin | Gera magic link de acesso |
| `admin_set_custom_price(target, plan, cents)` | admin | Define preço customizado |
| `admin_set_white_label(target, enabled)` | admin | Controla white-label |
| `admin_client_usage()` | admin | Uso de recursos por cliente |
| `admin_db_stats()` | admin | Estatísticas do banco |
| `admin_impersonate_start(target_uid)` | admin | Assume identidade de cliente |
| `admin_clear_client_data(uid, tables[])` | service_role | Limpa dados específicos |
| `handle_new_user()` | auth trigger | Cria company_profiles + user_roles no signup |

### Edge Functions (Deno)

| Função | Trigger | Descrição |
|--------|---------|-----------|
| `stripe-webhook` | Stripe API | Processa eventos de pagamento, ativa planos |
| `create-payment` | Frontend | Cria sessão de pagamento Stripe |
| `create-subscription` | Frontend | Cria assinatura recorrente |
| `cancel-subscription` | Frontend | Cancela assinatura |
| `get-subscription-status` | Frontend | Consulta status da assinatura |
| `get-payment-method` | Frontend | Lista métodos de pagamento |
| `set-default-payment-method` | Frontend | Define método padrão |
| `remove-payment-method` | Frontend | Remove método de pagamento |
| `create-setup-intent` | Frontend | Cria SetupIntent para salvar cartão |
| `stripe-config` | Frontend | Retorna configurações públicas do Stripe |
| `admin-create-client` | admin | Cria novo cliente (email + senha) |
| `admin-stripe-overview` | admin | Visão geral de cobranças |
| `admin-impersonate` | admin | Proxy de impersonation |
| `admin-set-custom-price` | admin | Proxy de preço customizado |
| `admin-set-white-label` | admin | Proxy de white-label |
| `admin-job-runner` | cron/admin | Jobs agendados (expiração de planos) |
| `send-custom-email` | admin | Envia email personalizado |
| `update-brand-config` | admin | Atualiza configuração de marca |
| `ai` | Frontend | Integração com IA (análise financeira) |
| `trigger-apk-build` | admin | Dispara build de APK (TWA) |
| `health` | monitoramento | Health check |

### Storage (Supabase Storage)

| Bucket | Política |
|--------|----------|
| `logos` | Upload: authenticated (own uid) / Select: public |

### RLS (Row Level Security)

```
company_profiles:
    ├─ SELECT: own user_id OR admin
    ├─ INSERT: own user_id (no signup)
    ├─ UPDATE: own user_id (colunas restritas, sem plan/white_label)
    └─ DELETE: admin only

transactions / products / losses:
    ├─ SELECT: own user_id
    ├─ INSERT: own user_id
    ├─ UPDATE: own user_id
    └─ DELETE: own user_id

user_roles:
    ├─ SELECT: admin only
    ├─ INSERT: admin only
    ├─ UPDATE: admin only
    └─ DELETE: admin only

logos (storage):
    ├─ SELECT: public
    └─ INSERT/UPDATE/DELETE: authenticated (path begins with uid)
```

### Fluxo de dados (resumo visual)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   IndexedDB  │◄────│   React UI   │────►│   Supabase   │
│  (Dexie v4)  │     │   (hooks)    │     │  (PostgreSQL) │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │ loadFromLocal()    │ syncAll()          │
       │ 5 queries          │ upsert + pull      │
       │                    │                    │
       │                    │ Realtime           │
       │                    │ postgres_changes   │
       │                    │ debounce 2s        │
       │                    │                    │
       │                    │ Web Worker         │
       │                    │ sync.worker.js     │
       │                    │                    │
       │                    │ BroadcastChannel   │
       │                    │ leader election    │
       └────────────────────┴────────────────────┘
```

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in keys:
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from Supabase project
   - `VITE_STRIPE_PUBLISHABLE_KEY` from Stripe dashboard
   - `VITE_APP_URL` for email links
3. For local Supabase dev: `npx supabase start` (needs Docker)
4. `npm run dev`
