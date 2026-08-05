![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-1178+-blue)
![Coverage](https://img.shields.io/badge/coverage-40%25-yellow)

# Financia

Offline-first white-label financial management app for small businesses.
Runs as PWA, Electron desktop app (Windows), and Android TWA.

**Produção:** https://financiabr.me

---

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, Vite 5, Tailwind CSS 3, shadcn/ui, Radix |
| State & Offline | Dexie.js 3 (IndexedDB) |
| Backend | Supabase 2 (PostgreSQL, Auth, RLS, Edge Functions) |
| Payments | Stripe |
| Desktop | Electron 31 |
| Mobile | Android TWA (WebView) |
| Testing | Vitest 4 + Testing Library + Playwright |
| CI/CD | GitHub Actions, Render (auto-deploy from `main`) |

---

## Commands

```bash
npm run dev           # http://localhost:5173
npm test              # Vitest (1178+ tests)
npm run test:coverage # Vitest + coverage
npm run lint          # eslint src/
npm run typecheck     # tsc --noEmit
npm run build         # Vite build
npm run check         # lint + typecheck + test
npm run analyze       # Vite + rollup-visualizer
```

---

## Architecture

```
src/
  features/           # Domain modules
    admin/            # Painel administrativo (multi-clientes)
    auth/             # Login, signup, sessão, impersonation
    branding/         # Brand Studio (editor de identidade visual)
    dashboard/        # KPIs, gráficos, resumo financeiro
    email/            # Comunicação (templates, envio)
    inventory/        # Produtos e perdas
    landing/          # Landing page, privacidade, termos
    plans/            # Planos e assinatura
    reports/          # Relatórios financeiros
    settings/         # Configurações do perfil/empresa
    transactions/     # Vendas, ganhos, despesas (TxView)
  shared/             # Cross-cutting code
    hooks/            # useDataLoader, useSyncLoop, useRealtime, useNavigationHistory
    layout/           # App shell
    ui/               # Sidebar, BottomNav, Header, Toast, Confirm, etc.
  lib/                # Utils, services (Dexie, Supabase client, auth, sync)
  core/               # Boot (boot.js), providers
  hooks/              # useAppState, useNavigation, useSyncLeader, usePlanEffects, useOnboarding
  routes/             # Route definitions (routes.jsx)
  workers/            # sync.worker.js (Web Worker)
  App/                # App.jsx, contexts, components (LazyPage, Loader)
  context/            # (deprecated — context moved to App/contexts)
  ai/                 # AI prompts and integrations
  test/               # Test setup, mocks
```

---

## Problemas a resolver...: fluxo atual

### Ciclo de vida da aplicação

```
HTML carrega (index.html com data-app-version)
    ↓
boot.js
    ├─ sanitizeCorruptedStorage()  — remove JSON inválido do localStorage
    ├─ registerSW()                — registra service worker customizado
    └─ checkVersion()              — compara versão do deploy, reload se diferente
    ↓
React monta <App/>
    ├─ useAppState()               — cria todos os useState (session, brand, tx, products, etc.)
    ├─ useBrandAppearance()        — aplica 40+ CSS variables em <html> (cores, tipografia, tema)
    ├─ useNavigation()             — configura React Router + atalhos de teclado (g+d, g+t, etc.)
    ├─ usePlanEffects()            — efeitos de plano (anúncios de upgrade, timeout de loading)
    ├─ useOnboarding()             — detecta primeiro acesso (nome do Google não substituído)
    └─ useAuthBootstrap()          — verifica sessão Supabase → loadData() ou mostra Landing/Login
```

### Fluxo de autenticação e dados

```
useAuthBootstrap()
    ├─ sb.auth.getSession()
    │
    ├─ [SESSÃO EXISTE] → loadData(userId)
    │   ├─ loadFromLocal(userId) → 5 queries paralelas no Dexie:
    │   │   ├─ ldb.profiles.get(userId)
    │   │   ├─ ldb.products.where('[user_id+_deleted]').equals([userId, 0])
    │   │   ├─ ldb.transactions.where('[user_id+_deleted]').equals([userId, 0])
    │   │   ├─ ldb.losses.where('[user_id+_deleted]').equals([userId, 0])
    │   │   └─ ldb.meta.get('role_' + userId)
    │   │
    │   ├─ pendingRecurring() → gera transações recorrentes pendentes
    │   │
    │   ├─ Atualiza React state (brand, planInfo, products, tx, losses, isAdminDB)
    │   │
    │   ├─ reconnectRef → useRealtime() → subscribe canal postgres_changes
    │   │
    │   ├─ syncAll(userId) → sincronização com Supabase:
    │   │   ├─ syncTable('transactions') → upsert não-synced → pull remoto (500/página)
    │   │   ├─ syncTable('products')     → upsert não-synced → pull remoto
    │   │   ├─ syncTable('losses')       → upsert não-synced → pull remoto
    │   │   └─ syncProfiles()            → upsert company_profiles → pull remoto
    │   │
    │   └─ fetchRole(userId) → user_roles → sessionStorage('is_admin')
    │
    └─ [SESSÃO NULA] → appLoading=false → Landing (primeira visita) ou Login

onAuthStateChange listener:
    ├─ SIGNED_IN  → loadData(userId)
    └─ SIGNED_OUT → onSessionEnd() → limpa state + remove channel
```

### Roteamento

Rotas definidas em `src/routes/routes.jsx`:

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | Dashboard | KPIs, gráficos, resumo financeiro |
| `/dashboard` | Dashboard | alias de `/` |
| `/income` | TxView (type="income") | Vendas e ganhos — lista virtual @tanstack/react-virtual |
| `/expense` | TxView (type="expense") | Despesas |
| `/inventory` | InventoryView | Produtos e perdas |
| `/email` | EmailView | Comunicação (admin only) |
| `/report` | ReportView | Relatórios financeiros |
| `/settings` | SettingsView | Configurações do perfil/empresa |
| `/planos` | PlansView | Planos e assinatura |
| `/brandstudio` | BrandStudioView | Editor de identidade visual |
| `/privacidade` | PrivacyPolicy | Política de privacidade |
| `/termos` | TermsOfService | Termos de uso |
| `/landing` | Landing | Landing page pública |

**Lazy loading:** todos os componentes de rota usam `React.lazy` + `LazyPage` (timeout 12s, fallback Loader).

### Fluxo de navegação

```
Sidebar (desktop, <lg) / BottomNav (mobile, lg:hidden) / QuickActions (FAB)
    ↓
navTo(v) → navigate('/' + v) + navigationHistory.push()
    ↓
path = location.pathname.replace(/^\//, '')
    ↓
currentView = path válido ? path : 'dashboard'
    ↓
<div key={currentView} className="anim-page-view">
    <FeatureErrorBoundary>
        <AppRoutes/>  (React.memo, useMemo nos elementos)
    </FeatureErrorBoundary>
</div>
```

**Atalhos de teclado** (fora de inputs/textareas):
| Atalho | Ação |
|--------|------|
| `g+d` | Dashboard |
| `g+t` | Transações (income) |
| `g+i` | Estoque |
| `g+s` | Configurações |
| `g+r` | Relatório |
| `g+p` | Planos |
| `?` | Lista atalhos |
| `Esc` | Fecha modais/sidebars |

### Camadas de contexto

```
<AppProvider value={ctx}>
    │
    ├─ stableCtx (useMemo — muda apenas quando dependências reais mudam)
    │   ├─ Sessão: session, setSession, isAdminDB, setIsAdminDB
    │   ├─ Loading: appLoading, dataLoading, dataError
    │   ├─ Marca: brand, setBrand, appBrand, effectiveTheme, toggleTheme
    │   ├─ Plano: planInfo, setPlanInfo, enforceLimit
    │   ├─ UI: syncStatus, toasts, confirmData, showLogin, showUpgrade, sidebarOpen
    │   ├─ Navegação: navTo, handleNav
    │   ├─ Ações: toast, confirm, handleConfirmOk, handleCancel
    │   └─ Dados: saveBrand, savePhone, loadData
    │
    ├─ dataCtx (useMemo — muda quando arrays de dados mudam)
    │   ├─ Transações: tx, setTx, addTx, editTx, deleteTx, addGenerated
    │   ├─ Produtos: products, setProducts, addProduct, editProduct, deleteProduct
    │   └─ Perdas: losses, setLosses, addLoss, editLoss, deleteLoss, adjustStock
    │
    └─ ctx = { ...stableCtx, ...dataCtx } → fornecido a todos os filhos
```

### Sincronização offline-first

```
IndexedDB (Dexie: gestao_offline v4)
    │
    ├─ transactions: id, user_id, type, description, amount, date, method,
    │                 category, items, registered_by, updated_at,
    │                 _synced, _deleted, _updated_at
    │                 Índices: [user_id+_deleted], [user_id+updated_at]
    │
    ├─ products: id, user_id, name, category, price, cost, stock,
    │            registered_by, created_at, updated_at,
    │            _synced, _deleted, _updated_at
    │            Índices: [user_id+_deleted], [user_id+updated_at]
    │
    ├─ losses: id, user_id, description, qty, reason, date,
    │          registered_by, updated_at,
    │          _synced, _deleted, _updated_at
    │          Índices: [user_id+_deleted], [user_id+updated_at]
    │
    ├─ profiles: user_id, name, logo, color, ..., _synced, _updated_at
    ├─ meta: key → val (role, last_sync, etc.)
    ├─ brand_presets: id, name, category, favorite, updated_at
    └─ brand_logo_schemes: id, name, createdAt

Campos de controle (em cada registro):
    _synced:    0 = alterado localmente, 1 = sincronizado
    _deleted:   0 = ativo, 1 = soft-deleted
    _updated_at: timestamp da última atualização
```

### Triggers de sincronização

```
syncAll(userId) — timeout 3s, backoff após 5 falhas consecutivas (60s cooldown)

Triggers:
    ├─ Intervalo: 120s (setInterval no useSyncLoop)
    ├─ Visibilidade: document.visibilitychange → visible
    ├─ Reconexão: window 'online' event
    ├─ Realtime: Supabase postgres_changes → debounce 2s → runSync
    └─ BroadcastChannel('financia-sync-leader'):
        └─ Leader election → apenas 1 aba sincroniza por vez
            ├─ Heartbeat a cada 3s
            └─ Timeout de líder: 10s → nova eleição
```

### Realtime (Supabase)

```
Canal: 'rt-' + uid

Subscrições:
    ├─ postgres_changes → transactions    → doSync (debounce 2s)
    ├─ postgres_changes → products        → doSync
    ├─ postgres_changes → losses          → doSync
    ├─ postgres_changes → company_profiles → doSync
    └─ postgres_changes → company_profiles (UPDATE, user_id=eq.uid)
        └─ applyPlan() → atualiza planInfo em tempo real

Status:
    ├─ SUBSCRIBED → ok, runSync()
    └─ CHANNEL_ERROR / TIMED_OUT → retry com backoff exponencial
        └─ delay: 1s → 2s → 4s → 8s → 16s → 30s (máx)
```

### Brand appearance

```
useBrandAppearance(brand, planInfo)
    │
    ├─ appBrand:
    │   ├─ Se white_label + custom_palette → brand (do banco)
    │   ├─ Se white_label sem custom_palette → WHITE_LABEL_VISUAL_DEFAULT
    │   └─ Senão → planVisualDefaults (preset por plano)
    │
    ├─ effectiveTheme = localStorage('financia_theme') || brand.theme || 'light'
    │
    ├─ applyBrandVars() → 40+ CSS variables em <html>:
    │   ├─ Cores: --brand, --brand-soft, --brand-secondary, --brand-accent
    │   ├─ Fundo: --bg-page, --bg-card, --bg-subtle, --bg-input
    │   ├─ Texto: --text-main, --text-sub, --text-muted
    │   ├─ Bordas: --border, --shadow-sm/md/lg
    │   ├─ Tipografia: --font-family, --font-heading, --font-mono
    │   ├─ Espaçamento: --spacing-gap, --spacing-section, --spacing-card
    │   ├─ Botões: --btn-primary-bg, --btn-primary-text, --btn-radius
    │   ├─ Inputs: --input-bg, --input-border, --input-radius
    │   └─ brand_config overrides (palette, typography, etc.)
    │
    └─ toggleTheme() → data-theme="dark|light" + localStorage
```

### QuickActions (FAB)

```
Acessível em: dashboard, income, expense, inventory
    ├─ Nova Venda    → emitQuickIntent('income')   → navega para /income
    ├─ Nova Despesa  → emitQuickIntent('expense')  → navega para /expense
    ├─ Novo Produto  → emitQuickIntent('product')  → navega para /inventory
    ├─ Nova Perda    → emitQuickIntent('loss')      → navega para /inventory
    └─ Configurações → navega para /settings

Visível apenas em views: SHOWN_VIEWS = ['dashboard', 'income', 'expense', 'inventory']
```

### Rotas legais, landing e onboarding

```
Landing aparece quando:
    ├─ path === '/landing'
    ├─ Não há sessão E localStorage('financia_seen') não existe
    └─ Senão → Login

Onboarding aparece quando:
    ├─ Sessão ativa
    ├─ brand.name === Google user_metadata.full_name
    └─ localStorage('financia_onboarded_{uid}') não existe

Login:
    ├─ Google OAuth (recomendado)
    ├─ Email + senha (signup/login)
    └─ Forgot password
```

### Segurança

- **RLS:** todas as tabelas têm Row Level Security habilitado
- **SECURITY DEFINER:** funções admin exigem `role='admin'` em `user_roles` (padrão seguro `not exists (... and role='admin')`)
- **White label guard:** trigger `trg_company_profiles_bu` reverte mudanças de `white_label` que não vêm de `service_role`
- **Plan guard:** trigger impede mudança de plano sem GUC `app.allow_plan_change = '1'` (setado apenas por `set_client_plan` SECURITY DEFINER)
- **Impersonation:** admin pode assumir identidade de cliente via RPC + cron de expiração automática
- **Soft delete:** registros ficam no IndexedDB com `_deleted=1`, sincronizados como DELETE no Supabase
- **Storage:** bucket `logos` com policies por UID (upload authenticated, select public)

### Plano e limites

```
Plano     | Transações | Produtos | Perdas
----------|-----------|----------|-------
free      | 50        | 20       | 10
pro       | ∞         | ∞        | ∞
premium   | ∞         | ∞        | ∞

effectivePlan():
    ├─ plan ∉ ['pro', 'premium'] → 'free'
    ├─ !plan_expires_at → retorna plan
    └─ plan_expires_at > now() → plan, senão 'free'

Upgrade: Stripe → webhook → set_client_plan() (SECURITY DEFINER)
Downgrade: plano expirado cai para free automaticamente
```

---

## Estado do Banco de Dados (Supabase)

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `company_profiles` | Perfil da empresa/usuário (1:1 com auth.users) |
| `transactions` | Vendas, ganhos e despesas |
| `products` | Estoque de produtos |
| `losses` | Registros de perdas/quebras |
| `user_roles` | Papel do usuário (admin/client) |

### company_profiles

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `user_id` | uuid PK | FK → auth.users |
| `name` | text | Nome da empresa |
| `logo` | text | Inicial da marca (fallback) |
| `logo_url` | text | URL do logo no Storage |
| `color` | text | Cor primária (hex) |
| `color_secondary` | text | Cor secundária (hex) |
| `color_accent` | text | Cor de destaque (hex) |
| `theme` | text | 'light' ou 'dark' |
| `white_label` | boolean | Personalização completa (ativado por service_role) |
| `niche` | text | Segmento do negócio |
| `phone` | text | Telefone de contato |
| `plan` | text | 'free', 'pro', 'premium' |
| `plan_expires_at` | timestamptz | Data de expiração do plano |
| `plan_activated_by` | text | Quem ativou o plano |
| `custom_prices` | jsonb | Preços customizados: `{pro: 4990, premium: 9990}` |
| `custom_palette` | boolean | Paleta customizada pelo Brand Studio |
| `visual_version` | integer | Versão do template visual |
| `brand_config` | jsonb | Configuração completa de marca (palette, typography, spacing, etc.) |
| `stripe_customer_id` | text | Customer ID da Stripe (cache) |
| `segment` | text | Segmento do cliente |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Última atualização (trigger automático) |

### transactions

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | Identificador único |
| `user_id` | uuid | FK → auth.users |
| `type` | text | 'income' ou 'expense' |
| `description` | text | Descrição da transação |
| `amount` | numeric | Valor em reais |
| `date` | text | 'YYYY-MM-DD' |
| `method` | text | Forma de pagamento |
| `category` | text | Categoria |
| `items` | jsonb | Itens da venda (array) |
| `registered_by` | text | Nome de quem registrou |
| `updated_at` | text | 'YYYY-MM-DD HH:mm:ss' |

### products

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | Identificador único |
| `user_id` | uuid | FK → auth.users |
| `name` | text | Nome do produto |
| `category` | text | Categoria |
| `price` | numeric | Preço de venda |
| `cost` | numeric | Custo |
| `stock` | integer | Quantidade em estoque |
| `registered_by` | text | Nome de quem registrou |
| `created_at` | text | Data de criação |
| `updated_at` | text | Última atualização |

### losses

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | uuid PK | Identificador único |
| `user_id` | uuid | FK → auth.users |
| `description` | text | Descrição da perda |
| `qty` | integer | Quantidade perdida |
| `reason` | text | Motivo |
| `date` | text | 'YYYY-MM-DD' |
| `registered_by` | text | Nome de quem registrou |
| `updated_at` | text | Última atualização |

### user_roles

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `user_id` | uuid PK | FK → auth.users |
| `role` | text | 'admin' ou 'client' |

### Tabelas Auxiliares

| Tabela | Descrição |
|--------|-----------|
| `stripe_webhook_dlq` | Fila de eventos da Stripe que falharam (replay/debug) |
| `ai_cache` | Cache de respostas da IA (rate-limited) |

### Índices

```sql
-- company_profiles
CREATE INDEX idx_company_profiles_plan           ON (plan);
CREATE INDEX idx_company_profiles_plan_expires   ON (plan_expires_at);
CREATE INDEX idx_company_profiles_white_label    ON (white_label);
CREATE INDEX idx_company_profiles_stripe_customer ON (stripe_customer_id);
CREATE INDEX idx_company_profiles_custom_prices  USING GIN (custom_prices);

-- transactions / products / losses
-- Índices compostos [user_id+_deleted] para queries offline-first
-- Índices compostos [user_id+updated_at] para sync pull incremental
```

### Triggers

```
company_profiles (BEFORE UPDATE) → trg_company_profiles_bu:
    1. Impedir mudança de plano sem GUC app.allow_plan_change = '1'
    2. Reverter white_label se não for service_role
    3. Atualizar updated_at = now()
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

### Edge Functions (Deno / Supabase)

| Função | Chamada por | Descrição |
|--------|-------------|-----------|
| `stripe-webhook` | Stripe API | Processa eventos de pagamento, ativa/rebaixa planos |
| `create-payment` | Frontend | Cria sessão de pagamento Stripe |
| `create-subscription` | Frontend | Cria assinatura recorrente |
| `cancel-subscription` | Frontend | Cancela assinatura |
| `get-subscription-status` | Frontend | Consulta status da assinatura |
| `get-payment-method` | Frontend | Lista métodos de pagamento |
| `set-default-payment-method` | Frontend | Define método padrão |
| `remove-payment-method` | Frontend | Remove método de pagamento |
| `create-setup-intent` | Frontend | Cria SetupIntent para salvar cartão |
| `stripe-config` | Frontend | Configurações públicas do Stripe |
| `admin-create-client` | admin | Cria novo cliente (email + senha) |
| `admin-stripe-overview` | admin | Visão geral de cobranças |
| `admin-impersonate` | admin | Proxy de impersonation |
| `admin-set-custom-price` | admin | Proxy de preço customizado |
| `admin-set-white-label` | admin | Proxy de white-label |
| `admin-job-runner` | cron / admin | Jobs agendados (expiração de planos) |
| `send-custom-email` | admin | Envia email personalizado |
| `update-brand-config` | admin | Atualiza configuração de marca |
| `ai` | Frontend | Integração com IA (análise financeira) |
| `trigger-apk-build` | admin | Dispara build de APK (TWA) |
| `health` | monitoramento | Health check |

### Storage

| Bucket | Select | Upload | Delete |
|--------|--------|--------|--------|
| `logos` | public | authenticated (path começa com uid) | authenticated (path começa com uid) |

### Políticas RLS

```
company_profiles:
    SELECT  → own user_id OR admin
    INSERT  → own user_id (no signup, via trigger handle_new_user)
    UPDATE  → own user_id (colunas restritas, sem plan/white_label)
    DELETE  → admin only

transactions / products / losses:
    SELECT  → own user_id
    INSERT  → own user_id
    UPDATE  → own user_id
    DELETE  → own user_id

user_roles:
    SELECT  → admin only
    INSERT  → admin only
    UPDATE  → admin only
    DELETE  → admin only
```

### Fluxo de dados (diagrama)

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│    IndexedDB     │ ◄───── │    React UI      │ ─────► │    Supabase      │
│   (Dexie v4)     │        │    (hooks)       │        │   (PostgreSQL)   │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         │ loadFromLocal()           │ syncAll()                 │
         │ 5 queries paralelas       │ upsert + pull paginado    │
         │                           │                           │
         │                           │ Realtime                  │
         │                           │ postgres_changes          │
         │                           │ debounce 2s               │
         │                           │                           │
         │                           │ Web Worker                │
         │                           │ sync.worker.js            │
         │                           │                           │
         │                           │ BroadcastChannel          │
         │                           │ leader election           │
         └───────────────────────────┴───────────────────────────┘
```

---

## PWA

- **Service Worker** (`public/sw.js`): custom SW com network-first para HTML, cache-first para assets hashed, precaching no install, progress reporting, e updates via `SKIP_WAITING` (user-controlled).
- **Manifest** (`public/manifest.json`): `standalone`, theme color `#002f59`, SVG icons, locale `pt-BR`.
- **Offline:** Dexie IndexedDB armazena todos os dados localmente; sync reconcilia com Supabase quando online.
- **Install:** captura `beforeinstallprompt`; `InstallButton` para instalação manual.

---

## Testing

- **Framework:** Vitest 4 com `jsdom` environment, `pool: 'vmThreads'`, `isolate: false`, timeout 15s
- **Setup:** `src/test/setup.js` — polyfills `stream/web` (TransformStream) para MSW no Node 24
- **Coverage:** v8 provider, 40% minimum thresholds, reporters `lcov` + `text-summary`
- **Arquivos:** ~21 test files across features, lib, shared (1178+ tests)
- **Mocks:** `fake-indexeddb` para Dexie, MSW para API mocking
- **E2E:** Playwright disponível via `@playwright/test`

---

## Architecture Decisions

- **Feature-first:** cada domínio em `src/features/<domain>/` com seus componentes, hooks e testes
- **Lazy loading:** rotas code-split por feature via `React.lazy` + `LazyPage` (timeout 12s)
- **Manual chunks:** `vendor` (React, router), `supabase` (auth/db/realtime/storage), `query` (TanStack), `dexie`, `radix`, `stripe`
- **Offline-first:** Dexie como fonte de verdade local; Supabase sync assíncrono
- **Service worker:** custom (sem Workbox), network-first HTML, cache-first assets, updates controlados pelo usuário
- **Tree-shaking:** `"sideEffects": false` em `package.json`
- **Performance:** `useCallback`/`useMemo` em contextos, `React.memo` em componentes de lista, Web Worker para sync
- **Sync leader:** BroadcastChannel para garantir que apenas 1 aba sincroniza por vez

---

## Setup

1. `npm install`
2. Copie `.env.example` para `.env` e preencha:
   - `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do projeto Supabase
   - `VITE_STRIPE_PUBLISHABLE_KEY` do dashboard Stripe
   - `VITE_APP_URL` para links de email
3. Para Supabase local: `npx supabase start` (requer Docker)
4. `npm run dev`
