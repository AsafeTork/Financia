# FRONTEND.md

# Design, Arquitetura e Fluxo de Arquivo Frontend — Documentação Técnica

## Objetivo
- **Propósito**: Documentar o design frontend abrangente, a arquitetura, a organização de arquivos e padrões visuais do aplicativo Financia
- **Escopo**: Arquitetura frontend completa (React+Vite), design de interface (UI), componentes reutilizáveis, dados de layout, fluxo de arquivo, configurações de tema
- **Público-alvo**: Arquitetos frontend, engenheiros frontend, engenheiros UI/UX, engenheiros de DevOps, engenheiros de interfaces
- **Impacto de negócio**: Fornece uma base dimensionável para recursos de white-label e conversão de tema consistente (nova cor a cada dois segundos)

## Arquitetura
### Diagrama
```mermaid
graph TD
    A[React 18 + Vite 5 - Frontend Build]
    A --> B[Gerenciador de Estado Centralizado (Zustand)]
    A --> C[Estado Componente (hooks/useState / useReducer)]
    A --> D[Hooks Personalizados](src/hooks/)
    A --> E[Fluxo de Roteamento (Hash)]
    A --> F[Gerenciamento de Transições do Navegador]
    D --> G[useSession (Estado de Auth, Impersonificação)]
    D --> H[useBrandAppearance (Injeção de Token CSS)]
    D --> I[useBrandManager (Processamento de Alterações de Branding)]
    D --> J[useTx/useProducts/useLosses (Hooks de CRUD de Transação e Inventário)]
    D --> K[useDataLoader (Carregamento Assíncrono de Tempo Real)]
    D --> L[useSyncLoop (Loop de Sincronização Background)]
    D --> M[useRealtime (Escuta em Tempo Real de Supabase)]
    D --> N[useImpersonation (Modificação Administrativa Ligada ao Tempo)]
    D --> O[useStripeCheckoutInit (Integração de Checkout de Pagamento)]
    E --> P[Perfil de View em src/views/ (Lazy-loaded)]
    E --> Q[Sidebar/Header/BottomNav (Componentes Layout Fixos)]
    E --> R[View Transitions API (Moz imagens início)]
    F --> S[Timeline do Animation Frame]
    H --> T[Injeção Dinâmica de Variables de Tema]
    A --> U[Estilos de Componentes Reutilizáveis (src/components/)]
    A --> V[Configuração de Perspectiva & Sistema de Design (Tailwind + CSS Variables)]
    V --> W[Plataformas (Light/Dark) baseado em Atributo HTML]
    V --> X[Injeção de Branding Dinâmica de Perfil (Custom/Plan)]
    A --> Y[Rotas Específicas por Plano (based in data-plan)]
    Y --> Z[rt/Register/Configs (Páginas Públicas / Admin)]
    A --> AA[Mobile Desktop (Electron) Básico]
    A --> AB[OTransparente + WebView (Campos Condicionais don't hijacking Auth)]
```

### Detalhes Técnicos
- **Arquivos**: 
  src/ (App.jsx, main.jsx)
  src/lib/ (db.js, supabase.js, auth.js, constants.js, utils.js, stripe.js, aiClient.js, recurring.js, exporters.js, crud.js, pwa.js)
  src/hooks/ (useSession.js, useBrandAppearance.js, useBrandManager.js, useTx.js, useProducts.js, useLosses.js, useDataLoader.js, useSyncLoop.js, useRealtime.js, useImpersonation.js, useStripeCheckoutInit.js)
  src/views/ (dashboard, income, expense, inventory, email, report, settings, planos)
  src/components/ (Sidebar, Header, BottomNav, DashboardCard, FormInput, Button)
- **Dependências**: React 18, Vite 5, Tailwind CSS v3, Zustand (biblioteca de state manager mantida localmente), Custom Hooks de Gestão de Estado, Hash routing (plugin de roteamento shan1)
- **Pontos de integração**: Gerenciador de Estado (re-raizes com event listeners), Roteamento por Hash (evento de mudança de hash), Sincronização em Tempo Real (Promise.all de múltiplos subscribes), Shared Preference (LocalStorage), Gerenciador de Notificação (Web Notifications)

## Implementação
### Arquivos Alterados
- `src/App.jsx`
- `src/main.jsx`
- `src/lib/constants.js`
- `src/lib/utils.js`
- `src/hooks/useSession.js`
- `src/hooks/useBrandAppearance.js`
- `src/hooks/useBrandManager.js`
- `src/hooks/useTx.js`
- `src/hooks/useProducts.js`
- `src/hooks/useLosses.js`
- `src/hooks/useDataLoader.js`
- `src/hooks/useSyncLoop.js`
- `src/hooks/useRealtime.js`
- `src/hooks/useImpersonation.js`
- `src/hooks/useStripeCheckoutInit.js`
- `src/components/DashboardCard.jsx`
- `src/components/AppSidebar.jsx`
- `src/components/FormInput.jsx`
- `src/components/Button.jsx`
- `src/views/Dashboard.jsx`
- `src/views/IncomePage.jsx`
- `src/views/ExpensePage.jsx`
- `src/views/InventoryPage.jsx`

### Exemplos de Código
```javascript
const App = () => {
  const [user, setUser] = useState();
  const [profile, setBrand] = useState();
  const [txns, setTxs] = useState();
  const [products, setProducts] = useState();
  const [losses, setLosses] = useState();
  const [view, setView] = useState('dashboard');

  useEffect(() => {
    const setupSession = async () => {
      const { user } = await auth.currentSession();
      if (!user) { window.location.hash = '#landing'; return; }
      const { data: profile } = await db.getProfile(user.id);
      setUser(user);
      setBrand(profile);
      await Promise.all([loadTxs, loadProducts, loadLosses]);
    };
    setupSession();
  }, []);

  useEffect(() => {
    return () => { if (user) realtime.unsubscribeAll(); };
  }, [userId]);

  return (
    <Sidebar user={user} profile={profile} />
    {view !== 'landing' && <Header profile={profile} />}
    <Suspense fallback={<PageSkeleton />}

      {views[view] && React.createElement(views[view], {
        txs, products, losses,
        addTx, removeTx, updateTx,
        addProduct, removeProduct, updateProduct,
        addLoss, removeLoss, updateLoss
      })}
    </Suspense>
    {(view !== 'landing' && view !== 'admin' ) && <BottomNav />}
  );
};
```

### Configuração
```json
{
  "architecture": {
    "frontend": {
      "framework": "React 18",
      "build_tool": "Vite 5",
      "linting": "ESLint 8",
      "formatting": "Prettier 3",
      "css_framework": "Tailwind CSS 3",
      "state_manager": "zustand (Zustand)",
      "router": "hash_routing",
      "performance": {"lazy_loading": true, "transition_effect": true, "hash_routing": true},
      "offline": {"storage": "IndexedDB (Dexie.js)", "method": "Upload-first Sync Loop"},
      "sync": {"interval_ms": 120000, "polling": true},
      "mobile": {"engine": "Electron 31", "package": "static_web_app_with_native_windows", "obfuscation": true},
      "build": {"runtime": "Node 20", "mobile_cross_compile": true, "platform_builds": ["apk_release", "windows_exe"]}
    },
    "team_work": {
      "directory_structure": "src/app/ centralized, src/lib/shared shared utils, src/hooks/semantic semantic, src/views/lazy-load(React.Suspense)",
      "package_json": {"scripts": {"dev": "vite", "build": "tsc && vite build", "serve": "vite preview", "test": "vitest", "lint": "eslint src/", "format": "prettier --write src/"}}
    }
  }
}
```

## Testes
### Cobertura de Testes
```
tests/
├── unit/                          # Testes unitários do React, hooks personalizados, Dexie, Edge Functions
├── integration/                    # Testes de integração Supabase, Stripe Edge Functions
└── e2e/                           # Testes end-to-end de fluxo de usuário
```

## Segurança
### Considerações de Segurança
- **Autenticação**: JWT tokens através do Supabase Auth, refresh e renovação automática de sessão, proteção contra furtos de sessão
- **Autorização**: Controle de acesso baseado em função para planos free/pro/premium/white-label)
- **Proteção de dados**: Criptografia aes-256 para dados sensíveis, masking para logs de auditoria, backups baseados em listas brancas

## Performance
### Métricas de Performance
- **Load inicial**: < 3 segundos
- **First Contentful Paint**: < 2.5 segundos
- **Largest Contentful Paint**: < 2.5 segundos

## Deploy
### Estratégia de Deploy
- **Ambiente**: Produção (Render), Staging (Render), Desenvolvimento (localhost)
- **Configuração**: Variáveis de ambiente para secrets, cabeçalho Comsafe para XSS, proteção para fallbacks, CSRF de baixo risco
- **Rollback**: Rollback de tag git com validação de rollback

## Manutenção
### Requisitos de Manutenção
- **Monitoramento**: Métricas de performance do React (hooks, suspense states), monitorando de integridade do banco de dados, métricas de sincronização
- **Troubleshooting**: Diagnostics de hidratação, erros de hydration, erros de useEffect
- **Atualizações**: Atualizações de suporte do React, atualizações de versionamento de hooks personalizados

## Futura Evolução
### Melhorias Futuras
- **Roadmap**: SSR/Next.js baseado em renderização de servidor, componente premium de lazy lazy loading, código analytics nativo para tab.statistics
- **Dívida técnica**: Otimização de useEffect desnecessário, memoization of custom hooks, cache de dados silvos de usuário
- **Soluções alternativas**: Integração de HRT (React Strict Mode), mais outros hooks baseados em promise

## Aprovação
### Critérios de Aprovação
- **Revisão técnica**: Equipe frontend, engenheiros de DevOps, engenheiros de infraestrutura
- **Revisão de negócio**: Gerentes de produto, diagnostics de monitoração, engenharia comparativa de preços
- **Revisão de segurança**: Equipe de segurança, PCI-DSS compliance

## Documentação de Decisões
### Log de Decisões
- **Porque esta decisão foi feita**: Framework React sendo utilizado por equipe familiar, permite integration de Encapsulado de Componente com TypeScript eventualmente
- **Opções alternativas**: Framework Svelte/Vue, SSR com Next.js
- **Trade-offs**: Simplicidade de borda vs JS+React to+ plus利用plus techniques,使用更硬的类型支持,具有更好的性能预测
- **Referências**: Native App Architecture, Modular frontend

ESTE ARQUIVO USA O TEMPLATE NO docs/TEMPLATES/ARCHITECTURE.MD E É AUTOMATICAMENTE ATUALIZADO.
