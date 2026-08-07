<div align="center">

# ![Financia](public/logo-financia.svg) Financia

**Gestão financeira offline-first para pequenos negócios**

![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)
![Tests](https://img.shields.io/badge/tests-1178+-blue?style=flat-square)
![Coverage](https://img.shields.io/badge/coverage-40%25-yellow?style=flat-square)
![License](https://img.shields.io/badge/license-private-red?style=flat-square)
![Deploy](https://img.shields.io/badge/deploy-Render-brightgreen?style=flat-square)
![DB](https://img.shields.io/badge/DB-Supabase-3fcf8e?style=flat-square)

[PWA](https://financiabr.me) · [Electron](https://financiabr.me) · Android TWA

---

</div>

## Visão Geral

O Financia é um sistema de gestão financeira construído para pequenos negócios que precisam registrar vendas, despesas e estoque — mesmo sem conexão com a internet. Os dados ficam salvos localmente e sincronizam automaticamente quando a conexão volta.

<div align="center">

![Landing](docs/images/landing-light.png)

</div>

### Funcionalidades Principais

| Recurso | Descrição |
|---------|-----------|
| **Dashboard** | KPIs, gráficos de barras, comparativo mensal, insights com IA |
| **Vendas / Ganhos** | Lista virtual com paginação, busca, filtros por período |
| **Despesas** | Registro com categorias, geração automática de recorrentes |
| **Estoque** | Produtos com preço/custo/estoque, registro de perdas |
| **Relatórios** | Resumo financeiro por período com exportação |
| **Planos** | Sistema de assinatura via Stripe (free/pro/premium) |
| **Brand Studio** | Editor de identidade visual (cores, tipografia, logo) |
| **White-label** | Cada cliente pode ter sua marca personalizada |
| **Admin** | Painel multi-clientes com impersonation e métricas |
| **Offline** | Funciona 100% offline, sincroniza quando online |
| **PWA** | Instalável no celular e desktop |
| **Dark Mode** | Tema claro/escuro com toggle |

---

## Screenshots

<div align="center">
<table>
  <tr>
    <td align="center"><b>Landing Page</b></td>
    <td align="center"><b>Login</b></td>
    <td align="center"><b>Dark Mode</b></td>
  </tr>
  <tr>
    <td><img src="docs/images/landing-light.png" width="300" alt="Landing Light"></td>
    <td><img src="docs/images/login.png" width="300" alt="Login"></td>
    <td><img src="docs/images/landing-dark.png" width="300" alt="Landing Dark"></td>
  </tr>
  <tr>
    <td align="center"><b>Mobile</b></td>
    <td align="center"><b>Dashboard</b></td>
    <td align="center"><b>Configurações</b></td>
  </tr>
  <tr>
    <td><img src="docs/images/landing-mobile.png" width="300" alt="Mobile"></td>
    <td><img src="docs/images/dashboard.png" width="300" alt="Dashboard"></td>
    <td><img src="docs/images/settings.png" width="300" alt="Settings"></td>
  </tr>
</table>
</div>

---

## Stack Tecnológica

```mermaid
graph LR
    subgraph Frontend
        A[React 18] --> B[Vite 5]
        A --> C[Tailwind CSS 3]
        A --> D[shadcn/ui + Radix]
    end

    subgraph State
        E[Dexie.js 3<br/>IndexedDB]
        F[React Context]
    end

    subgraph Backend
        G[Supabase 2]
        G --> H[PostgreSQL]
        G --> I[Auth + RLS]
        G --> J[Edge Functions]
    end

    subgraph Payments
        K[Stripe]
    end

    subgraph Deploy
        L[Render]
        M[GitHub Actions]
    end

    A --> E
    A --> F
    E <-->|sync| G
    A -->|invoke| J
    J --> K
    M --> L
```

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18, Vite 5, Tailwind CSS 3, shadcn/ui, Radix |
| State | Dexie.js 3 (IndexedDB), React Context |
| Backend | Supabase 2 (PostgreSQL, Auth, RLS, Edge Functions) |
| Pagamentos | Stripe (checkout, assinatura, webhooks) |
| Desktop | Electron 31 |
| Mobile | Android TWA (WebView) |
| Testes | Vitest 4, Testing Library, Playwright |
| CI/CD | GitHub Actions → Render (auto-deploy) |

---

## Arquitetura

### Estrutura de Diretórios

```
src/
├── features/              # Módulos de domínio
│   ├── auth/              # Login, signup, sessão, impersonation
│   ├── branding/          # Brand Studio (editor visual)
│   ├── dashboard/         # KPIs, gráficos, resumo
│   ├── email/             # Comunicação (templates)
│   ├── inventory/         # Produtos e perdas
│   ├── landing/           # Landing page pública
│   ├── plans/             # Planos e assinatura
│   ├── reports/           # Relatórios financeiros
│   ├── settings/          # Configurações
│   └── transactions/      # Vendas, ganhos, despesas
├── shared/                # Código compartilhado
│   ├── hooks/             # useDataLoader, useSyncLoop, useRealtime
│   └── ui/                # Sidebar, BottomNav, Header, Toast, etc.
├── lib/                   # Utilitários, serviços (Dexie, Supabase, auth)
├── hooks/                 # useAppState, useNavigation, useSyncLeader
├── routes/                # Definição de rotas (routes.jsx)
├── workers/               # sync.worker.js (Web Worker)
├── App/                   # App.jsx, contextos, LazyPage
├── core/                  # boot.js (inicialização)
└── test/                  # Setup de testes, mocks
```

### Diagrama de Componentes

```mermaid
graph TB
    subgraph Shell["App Shell"]
        Sidebar["Sidebar<br/>(desktop)"]
        BottomNav["BottomNav<br/>(mobile)"]
        Header["Header"]
        QuickActions["FAB QuickActions"]
    end

    subgraph Auth["Autenticação"]
        Login["Login"]
        Onboarding["Onboarding"]
    end

    subgraph Pages["Páginas"]
        Dashboard["Dashboard"]
        TxView["TxView<br/>(income/expense)"]
        Inventory["InventoryView"]
        Reports["ReportView"]
        Settings["SettingsView"]
        Plans["PlansView"]
        BrandStudio["BrandStudio"]
        Email["EmailView"]
    end

    subgraph Data["Camada de Dados"]
        Context["AppProvider<br/>(stableCtx + dataCtx)"]
        Dexie["IndexedDB<br/>(Dexie v4)"]
        Sync["SyncLoop<br/>(Web Worker)"]
        Realtime["Realtime<br/>(Supabase)"]
    end

    Sidebar --> Pages
    BottomNav --> Pages
    QuickActions --> Pages
    Header --> Sidebar

    Pages --> Context
    Context --> Dexie
    Dexie <--> Sync
    Sync <--> Realtime
    Auth --> Context
```

### Fluxo de Dados

```mermaid
sequenceDiagram
    participant U as Usuário
    participant UI as React UI
    participant IDB as IndexedDB
    participant API as Supabase

    U->>UI: Abre o app
    UI->>IDB: loadFromLocal() [5 queries]
    IDB-->>UI: Dados locais
    UI-->>U: Renderiza instantaneamente

    par Sincronização
        UI->>API: syncAll() [upsert + pull]
        API-->>IDB: Dados atualizados
    and Realtime
        API->>UI: postgres_changes
        UI->>IDB: loadFromLocal()
    end
```

---

## Ciclo de Vida da Aplicação

```mermaid
flowchart TD
    A["HTML carrega"] --> B["boot.js<br/>sanitizeCorruptedStorage()<br/>registerSW()<br/>checkVersion()"]
    B --> C["React monta App"]
    C --> D["useAppState()<br/>cria todos os useState"]
    C --> E["useBrandAppearance()<br/>aplica CSS variables"]
    C --> F["useNavigation()<br/>configura rotas + atalhos"]

    G{"sb.auth.getSession()"} -->|Sessão| H["loadData(userId)"]
    G -->|Sem sessão| I{"Primeira visita?"}
    I -->|Sim| J["Landing"]
    I -->|Não| K["Login"]

    H --> L["loadFromLocal()<br/>5 queries Dexie"]
    L --> M["syncAll()<br/>upsert + pull Supabase"]
    M --> N["subscribeRealtime()<br/>postgres_changes"]
    N --> O["App pronta"]

    style A fill:#e8f5e9
    style O fill:#e8f5e9
    style J fill:#fff3e0
    style K fill:#fff3e0
```

---

## Roteamento

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/` | `Dashboard` | KPIs, gráficos, resumo financeiro |
| `/income` | `TxView` | Vendas e ganhos (lista virtual) |
| `/expense` | `TxView` | Despesas |
| `/inventory` | `InventoryView` | Produtos e perdas |
| `/report` | `ReportView` | Relatórios financeiros |
| `/settings` | `SettingsView` | Configurações |
| `/planos` | `PlansView` | Planos e assinatura |
| `/brandstudio` | `BrandStudio` | Editor de identidade visual |
| `/email` | `EmailView` | Comunicação (admin only) |

**Atalhos de teclado:** `g+d` Dashboard · `g+t` Transações · `g+i` Estoque · `g+s` Config · `g+r` Relatório · `g+p` Planos

---

## Sincronização Offline-First

```mermaid
flowchart LR
    subgraph Local["IndexedDB (Dexie v4)"]
        TX["transactions"]
        PRD["products"]
        LSS["losses"]
        PRF["profiles"]
        META["meta"]
    end

    subgraph Remote["Supabase (PostgreSQL)"]
        SB_TX["transactions"]
        SB_PRD["products"]
        SB_LSS["losses"]
        SB_PRF["company_profiles"]
    end

    TX <-->|syncTable| SB_TX
    PRD <-->|syncTable| SB_PRD
    LSS <-->|syncTable| SB_LSS
    PRF <-->|syncProfiles| SB_PRF

    style Local fill:#e3f2fd
    style Remote fill:#fce4ec
```

**Mecanismos de sincronização:**

| Trigger | Intervalo | Descrição |
|---------|-----------|-----------|
| `setInterval` | 120s | Sync periódico no Web Worker |
| `visibilitychange` | Ao voltar à aba | Sync quando a aba fica visível |
| `online` | Ao reconectar | Sync imediato ao voltar online |
| `postgres_changes` | Tempo real | Supabase Realtime → debounce 2s |
| `BroadcastChannel` | Contínuo | Leader election → 1 aba sincroniza |

**Campos de controle por registro:**
- `_synced`: `0` = alterado localmente, `1` = sincronizado
- `_deleted`: `0` = ativo, `1` = soft-deleted
- `_updated_at`: timestamp da última atualização

---

## Banco de Dados

### Tabelas

```mermaid
erDiagram
    company_profiles ||--|| auth_users : "user_id"
    transactions }o--|| company_profiles : "user_id"
    products }o--|| company_profiles : "user_id"
    losses }o--|| company_profiles : "user_id"
    user_roles ||--|| auth_users : "user_id"

    company_profiles {
        uuid user_id PK
        text name
        text logo
        text logo_url
        text color
        text color_secondary
        text color_accent
        text theme
        boolean white_label
        text niche
        text phone
        text plan
        timestamptz plan_expires_at
        text plan_activated_by
        jsonb custom_prices
        boolean custom_palette
        integer visual_version
        jsonb brand_config
        text stripe_customer_id
        timestamptz created_at
        timestamptz updated_at
    }

    transactions {
        uuid id PK
        uuid user_id FK
        text type
        text description
        numeric amount
        text date
        text method
        text category
        jsonb items
        text registered_by
        text updated_at
    }

    products {
        uuid id PK
        uuid user_id FK
        text name
        text category
        numeric price
        numeric cost
        integer stock
        text registered_by
        text created_at
        text updated_at
    }

    losses {
        uuid id PK
        uuid user_id FK
        text description
        integer qty
        text reason
        text date
        text registered_by
        text updated_at
    }

    user_roles {
        uuid user_id PK
        text role
    }
```

### Funções RPC (SECURITY DEFINER)

| Função | Chamada por | Descrição |
|--------|-------------|-----------|
| `set_client_plan` | admin / Stripe webhook | Ativa/rebaixa plano |
| `set_white_label` | service_role | Liga/desliga white-label |
| `admin_delete_client` | admin | Deleta cliente + auth.users |
| `admin_get_magic_link` | admin | Gera magic link |
| `admin_set_custom_price` | admin | Define preço customizado |
| `admin_client_usage` | admin | Métricas de uso |
| `admin_db_stats` | admin | Estatísticas do banco |
| `admin_impersonate_start` | admin | Assume identidade de cliente |
| `handle_new_user` | auth trigger | Cria profile + role no signup |

### Edge Functions (Deno)

| Função | Descrição |
|--------|-----------|
| `stripe-webhook` | Processa eventos de pagamento |
| `create-payment` | Cria sessão Stripe |
| `create-subscription` | Cria assinatura recorrente |
| `cancel-subscription` | Cancela assinatura |
| `get-subscription-status` | Status da assinatura |
| `admin-create-client` | Cria novo cliente |
| `admin-stripe-overview` | Visão geral de cobranças |
| `ai` | Análise financeira com IA |
| `trigger-apk-build` | Dispara build de APK |
| `send-custom-email` | Envia email personalizado |

### Segurança

- **RLS:** todas as tabelas com Row Level Security habilitado
- **SECURITY DEFINER:** funções admin exigem `role='admin'` via padrão seguro
- **White label guard:** trigger reverte mudanças não autorizadas
- **Plan guard:** trigger impede mudança sem GUC `app.allow_plan_change`
- **Soft delete:** registros mantidos com `_deleted=1`

---

## Plano e Limites

| Plano | Transações | Produtos | Perdas |
|-------|-----------|----------|--------|
| **free** | 50 | 20 | 10 |
| **pro** | ∞ | ∞ | ∞ |
| **premium** | ∞ | ∞ | ∞ |

Upgrade via Stripe → webhook → `set_client_plan()` (SECURITY DEFINER).
Downgrade automático: plano expirado cai para free.

---

## Comandos

```bash
npm run dev           # http://localhost:5173
npm test              # Vitest (1178+ testes)
npm run test:coverage # Cobertura
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run build         # Build de produção
npm run check         # lint + typecheck + test
```

---

## Setup

1. `npm install`
2. Copie `.env.example` para `.env` e preencha:
   - `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   - `VITE_STRIPE_PUBLISHABLE_KEY`
   - `VITE_APP_URL`
3. Para Supabase local: `npx supabase start` (requer Docker)
4. `npm run dev`

---

## PWA

- **Service Worker:** Workbox via `vite-plugin-pwa` (injectManifest), fonte `src/sw.ts` → `dist/sw.js`; precache, cache-first assets, network-first API/Supabase, background sync p/ mutations offline
- **Manifest:** gerado pelo plugin (`manifest.webmanifest`), `standalone`, theme `#002f59`, locale `pt-BR`
- **Offline:** Dexie IndexedDB armazena tudo localmente
- **Install:** captura `beforeinstallprompt`

---

## License

Proprietário. Uso não autorizado é proibido.
