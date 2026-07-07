# Arquitetura Frontend

## Stack

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| UI Framework | React | 18 |
| Bundler | Vite | 5 |
| CSS | Tailwind CSS v3 + CSS vars | - |
| Desktop | Electron | 31 |
| PWA | Service Worker (vite-plugin-pwa) | - |

## Arvore de Componentes

```
<App> (src/App.jsx - 304 linhas)
|
+-- Estado global (16 useState + 4 hooks customizados)
|
+-- useBrandAppearance(brand, planInfo)
|   +-- appBrand (useMemo): cores finais aplicadas
|   +-- effectiveTheme: themePref || appBrand.theme || 'light'
|   +-- toggleTheme()
|   +-- applyBrandVars() -> seta 6 CSS vars no <html>
|
+-- <Offline/>
+-- <UpdateBanner brand/>
+-- <SyncBadge status/>
+-- <Sidebar view, onNav, brand, open, isAdmin, onClose/> (React.memo)
+-- <ThemeToggle theme, onToggle/> (desktop flutuante)
+-- <Header brand, syncStatus, theme, onToggleTheme, onMenuOpen/> (React.memo)
|   +-- calcula luminance(brand.color) para contraste de texto
|   +-- <ThemeToggle variant="header"/>
+-- <main>
|   +-- <Suspense fallback={<PageSkeleton/>}>
|       +-- views[currentView] (useMemo com 8 createElement)
|           +-- Dashboard (lazy)
|           +-- TxView (lazy, income/expense)
|           +-- InventoryView (lazy)
|           +-- EmailView (lazy, admin)
|           +-- ReportView (lazy)
|           +-- SettingsView (lazy)
|           +-- PlansView (lazy)
+-- <BottomNav view, onNav, brand/> (React.memo)
+-- <Toast toasts, onDismiss/>
+-- <Confirm msg, onOk, onCancel/>
+-- <UpgradeModal reason, brand, onClose, onNav/>
|
+-- <Onboarding brand, needsName, needsPhone, onSave/> (condicional)
```

## Componentes Compartilhados (src/components/)

| Componente | Arquivo | Responsabilidade |
|-----------|---------|-----------------|
| Card, Inp, Btn, Sel, Modal, Spin, Badge, Empty | `ui.jsx` | UI primitives |
| Sidebar | `Sidebar.jsx` | Menu lateral desktop, React.memo |
| Header | `Header.jsx` | Topbar mobile, React.memo |
| BottomNav | `BottomNav.jsx` | Nav inferior mobile, React.memo |
| ThemeToggle | `ThemeToggle.jsx` | Toggle dark/light |
| Toast | `Toast.jsx` | Notificacoes |
| Confirm | `Confirm.jsx` | Dialog de confirmacao |
| UpgradeModal | `UpgradeModal.jsx` | Upsell de plano |
| ColorField | `ColorField.jsx` | Input de cor (color picker + hex + preview) |
| PhoneInput | `PhoneInput.jsx` | Input de telefone intl |
| Onboarding | `Onboarding.jsx` | Setup inicial (nome + telefone) |
| CardPreview | `CardPreview.jsx` | Preview de cartao Stripe |
| SaleForm | `SaleForm.jsx` | Formulario de venda rapida |
| SyncBadge | `SyncBadge.jsx` | Indicador de sync |
| Offline | `Offline.jsx` | Banner offline |
| InstallButton | `InstallButton.jsx` | Botao PWA install |

## Admin (src/admin/)

| Componente | Responsabilidade |
|-----------|----------------|
| AdminPanel | Lista clientes, metricas, acoes |
| ClientEditModal | Editor visual completo: cores, IA paleta, presets, plano, precos |
| GhTokenCard | Configuracao GitHub token para APK build |

## Roteamento

Hash routing puro, sem react-router:

```
VALID_VIEWS = ['dashboard','income','expense','inventory','email','report','settings','planos']
hashView() -> window.location.hash -> valida -> 'dashboard' (fallback)
navTo(v) -> setView(v) + window.location.hash = v
           + startViewTransition (View Transitions API) com flushSync
```

## Gerenciamento de Estado

Sem Context, sem Redux, sem Zustand. Tudo no App.jsx:

| Hook | Retorna | Estado que gerencia |
|------|--------|---------------------|
| `useTx()` | tx, addTx, editTx, deleteTx, addGenerated | Transacoes |
| `useProducts()` | products, addProduct, editProduct, deleteProduct, adjustStock | Produtos + estoque |
| `useLosses()` | losses, addLoss, editLoss, deleteLoss | Perdas |
| `useSession()` | saveBrand, savePhone, loadData | Sessao, brand, sync |
| `useBrandAppearance()` | appBrand, effectiveTheme, toggleTheme | CSS vars, tema |

### Fluxo de dados brand -> UI

```
Dexie ldb.profiles.get(userId)
  -> setBrand({...}) em loadFromLocal()
  -> useBrandAppearance() cria appBrand (useMemo)
  -> applyBrandVars(appBrand) via useEffect
  -> Seta CSS vars no documentElement:
     --brand, --brand-soft, --brand-secondary, --brand-accent, --brand-grad
  -> Componentes usam var(--brand), brand.color, etc.
```

## Memoizacao

| Tecnica | Onde | Efeito |
|---------|------|--------|
| React.memo | Sidebar, BottomNav, Header | Elimina re-render dos 3 maiores componentes |
| useMemo (views) | App.jsx | Evita 8 createElement por render |
| useMemo (appBrand) | useBrandAppearance.js | Brand final memoizado |
| useMemo (p) | App.jsx | Objeto {brand, toast, confirm} estavel |

## Lazy Loading

Todas as 11 views sao `React.lazy()` com `<Suspense fallback={<PageSkeleton/>}>`.

Chunks gerados no build:
- Dashboard: 25 kB / 6.8 kB gzip
- SettingsView: 72 kB / 18 kB gzip (maior - inclui AdminPanel + ClientEditModal)
- PlansView: 30 kB / 8 kB gzip
- index.js: 320 kB / 103 kB gzip (React + Dexie + Supabase)
