---
type: REPORT
---

# Frontend Master Audit — Financia v5.1.0

> **Data:** Julho 2026 · **Stack:** React 18.3 · Vite 5.4 · Tailwind 3.4 · Dexie 3.2 · Supabase JS 2.45 · React Router 7 · TanStack Query 5 · TanStack Virtual 3 (usado em TxView)
>
> **Classificação:** P0 (crítico) · P1 (alto) · P2 (médio) · P3 (baixo) · P4 (informativo)

---

## Sumário Executivo

O Financia tem base sólida: FSD simplificado, offline-first com Dexie, lazy loading de rotas, error boundaries em 3 níveis, code splitting via manualChunks, e Service Worker funcional com network-first + precache. Porém, o **build está quebrado** (erro de sintaxe JSX em TxView.jsx:229) — este é o problema mais grave. Os demais problemas são estruturais (App.jsx inchado, prop drilling) e evolutivos (React 18 → 19, TS, cobertura de testes).

---

## P0 — Crítico

### 0.1 Build Quebrado (Erro de Sintaxe JSX)

| Campo | Descrição |
|---|---|
| **Problema** | `npm run build` falha. `TxView.jsx:229` — tag `<div ref={scrollRef}>` sem fechar `>` antes da próxima tag. `esbuild` não consegue fazer parse. |
| **Impacto** | Não é possível gerar build de produção. CI/CD quebrado. Deploy bloqueado. |
| **Solução** | Fechar a tag na linha 229: adicionar `>` no final de `style={{position:'relative'}}`. |
| **Esforço** | 1 minuto |
| **Prioridade** | P0 |

### 0.2 App.jsx como God Object

| Campo | Descrição |
|---|---|
| **Problema** | `src/App.jsx` (333 linhas) concentra: 15+ `useState`, toda lógica de roteamento, 18 handlers, condicionais de layout (3 variações), atalhos de teclado, lifecycle de planos, tema, onboarding. Viola SRP. |
| **Impacto** | Qualquer mudança requer alterar App.jsx. Testabilidade zero. Onboarding lento. |
| **Solução** | Extrair: `AppLayout` (layout shell), `KeyboardShortcuts` (atalhos), `PlanWatcher` (lifecycle). Manter estado global (toast/confirm/upgrade) em contexto dedicado (useToast/useConfirm). App.jsx vira orquestrador de ~100 linhas. |
| **Esforço** | 2-3 dias |
| **Prioridade** | P0 |

### 0.3 Prop Drilling via AppRoutes (~30 Props)

| Campo | Descrição |
|---|---|
| **Problema** | `routes.jsx:15` recebe ~30 props e repassa para todas as rotas. Dashboard recebe `losses` sem usar. Adicionar prop requer alterar App.jsx + routes.jsx + toda página. |
| **Impacto** | Acoplamento extremo. Refatorar hook quebra contrato de props de todas as rotas. Código morto sendo trafegado. |
| **Solução** | Extrair `toast`/`confirm` para contexto. Rotas consomem hooks localmente (useTx, useProducts, useLosses instanciados dentro de cada página com cache compartilhado via Dexie). Isso alinha com offline-first: dados já estão no IndexedDB, não precisam ser carregados via props. |
| **Esforço** | 2-4 dias |
| **Prioridade** | P0 |

---

## P1 — Alto

### 1.1 TypeScript Configurado mas não Utilizado

| Campo | Descrição |
|---|---|
| **Problema** | `tsconfig.json` strict, ES2022. `checkJs: false`. `tsc --noEmit` excede timeout de 30s (inviável). Código 100% JS. Nenhum tipo definido para schema Dexie, chamadas Supabase, ou props. |
| **Impacto** | Zero segurança de tipos. Refatorações arriscadas. Autocomplete pobre. Time gasta mais tempo debugando `undefined`/`null`. |
| **Solução** | Progressivo: 1. Ativar `checkJs: true` com `@ts-check` apenas nos arquivos críticos (`lib/dexie.js`, `lib/supabase.js`, `lib/sync.js`). 2. Definir tipos para schema Dexie (interface das tabelas). 3. Renomear `.jsx` → `.tsx` incrementalmente começando pelos hooks. Sem pressa — não bloquear desenvolvimento. |
| **Esforço** | 5-10 dias (pode ser diluído em paralelo com features) |
| **Prioridade** | P1 |

### 1.2 Dados de Todas as Features Carregados no Bootstrap

| Campo | Descrição |
|---|---|
| **Problema** | `useDataLoader` carrega profile + transactions + products + losses simultaneamente no bootstrap. App.jsx instancia useTx, useProducts, useLosses sempre. |
| **Impacto** | Usuário que só acessa "Receitas" baixa dados de "Estoque" e "Perdas". Aumenta tempo de inicialização e memória. |
| **Solução** | Carregar profile + planInfo no bootstrap (são leves e necessários). Transactions/products/losses carregar sob demanda na primeira visita de cada rota. Dexie já funciona como cache offline, então dados carregados uma vez ficam disponíveis offline. |
| **Esforço** | 2-3 dias |
| **Prioridade** | P1 |

### 1.3 Nenhum Recurso Concorrente do React 18

| Campo | Descrição |
|---|---|
| **Problema** | `useTransition`, `useDeferredValue`, `startTransition` não são usados. Filtro de transactions e busca podem travar UI em listas grandes. React 18 introduziu automatic batching em setTimeout/promises — verificar se código aproveita. |
| **Impacto** | UI pode travar durante filtros. Typing em inputs com lista grande pode ter lag. |
| **Solução** | 1. Envolver filtro de transactions em `useDeferredValue`. 2. `useTransition` em navegação entre abas. 3. Confirmar que automatic batching cobre todos os casos assíncronos (React 18 batching em promises já é padrão). |
| **Esforço** | 1 dia |
| **Prioridade** | P1 |

### 1.4 Router: HashRouter Impacta SEO e URLs

| Campo | Descrição |
|---|---|
| **Problema** | `HashRouter` usado em vez de `BrowserRouter`. URLs têm `/#/`. Landing page, privacidade e termos são páginas públicas que deveriam ter URLs limpas para SEO. |
| **Impacto** | SEO das páginas públicas prejudicado (landing, privacidade, termos). URLs compartilháveis feias. Crawlers podem ignorar conteúdo após `#`. |
| **Solução** | Substituir HashRouter por BrowserRouter (precisa configurar fallback no servidor/proxy para SPA). Ou manter HashRouter para app e usar rotas dedicadas para landing/legal. |
| **Esforço** | 1-2 dias (depende do deploy) |
| **Prioridade** | P1 |

### 1.5 Bundle: Vários Chunks Pequenos vs Otimização

| Campo | Descrição |
|---|---|
| **Problema** | `manualChunks` cria 4 chunks Supabase (db, auth, storage, functions) + react + query + dexie + radix + stripe = ~11 chunks de vendor. Dependências menores (tailwind-merge, clsx, cva) ficam no chunk principal. `generatedCode: 'es2015'` limita otimizações modernas. `compact: true` prejudica debugging. |
| **Impacto** | Muitos requests pequenos (custo de conexão). Chunk principal maior que necessário. Código gerado não aproveita nullish coalescing, optional chaining. |
| **Solução** | 1. `generatedCode: 'esnext'`. 2. Avaliar se 4 chunks Supabase são necessários (talvez consolidar em 1-2 chunks). 3. Adicionar catch-all vendor para libs não categorizadas. 4. Medir com analyzer. |
| **Esforço** | 0.5 dia |
| **Prioridade** | P1 |

### 1.6 Cobertura de Testes Abaixo do Ideal

| Campo | Descrição |
|---|---|
| **Problema** | Thresholds: lines 40%, functions 30%, branches 30%, statements 40%. Testes focam em lib/ e hooks. Quase zero testes de componente (apenas ThemeToggle, Offline, ColorField, PhoneInput). Sem testes E2E (Playwright instalado mas sem testes detectados). |
| **Impacto** | Refatorações arriscadas. Regressões silenciosas. Branches 30% é perigoso (condicionais não testadas). |
| **Solução** | 1. Aumentar thresholds gradualmente (50/40/40/50). 2. Testes dos hooks principais (useTx, useProducts, useLosses com Dexie mockado). 3. E2E: ao menos 1 fluxo feliz. |
| **Esforço** | 4-6 dias |
| **Prioridade** | P1 |

### 1.7 Sync sem Estratégia de Conflitos para Multi-Device

| Campo | Descrição |
|---|---|
| **Problema** | `sync.js` usa last-write-wins por timestamp. Se dois devices editam offline, o último sync vence — dados do primeiro são perdidos. Sem notificação ao usuário. |
| **Impacto** | Perda silenciosa de dados em cenário multi-device. |
| **Solução** | Documentar limitação (uso primariamente single-device). Se multi-device for requisito, adicionar UI de conflito com diff visual. **CRDT é overengineering para este caso de uso.** |
| **Esforço** | 1 dia (doc) · 3-5 dias (UI de conflito) |
| **Prioridade** | P1 |

---

## P2 — Médio

### 2.1 `var` no Código Fonte

| Campo | Descrição |
|---|---|
| **Problema** | Todo código usa `var`. Function-scoping, hoisting. ESLint `no-var` não habilitado. `no-unused-vars` está `off`. |
| **Impacto** | Bugs potenciais de escopo. Código inconsistente com padrão moderno. |
| **Solução** | Adicionar `no-var: error` e `prefer-const` no ESLint. `const`/`let` em código novo. Refatorar existente progressivamente (não urgente). |
| **Esforço** | 1 dia (automatizado com ESLint --fix) |
| **Prioridade** | P2 |

### 2.2 TanStack Query Subutilizado

| Campo | Descrição |
|---|---|
| **Problema** | `@tanstack/react-query` instalado e configurado mas não usado para queries de dados. Sync manual via `sync.js`. Query cache, refetch, stale-while-revalidate, optimistic updates — tudo manual. Lib adiciona ~6KB ao bundle para ser subutilizada. |
| **Impacto** | Código duplicado. Sem cache inteligente. Sem devtools. |
| **Solução** | **Atenção:** React Query não substitui Dexie. Dexie é cache local offline-first, React Query é gerenciador de server state. Usar React Query APENAS para operações que precisam de refetch automático (ex: verificação de plano, Stripe status). Manter Dexie + sync.js para dados offline-first. |
| **Esforço** | 2-3 dias |
| **Prioridade** | P2 |

### 2.3 Migrar para React 19

| Campo | Descrição |
|---|---|
| **Problema** | React 18.3 (stable). React 19 (GA desde late 2024, padrão em 2026) oferece: React Compiler (automemoization), `use()` hook, Actions/useActionState, useOptimistic, useFormStatus, document metadata nativo. |
| **Impacto** | Perde: React Compiler (elimina useMemo/useCallback manuais), `useOptimistic` (UI instantânea CRUD), Actions (formulários mais simples). |
| **Solução** | 1. `npm i react@19 react-dom@19 @types/react@19 @types/react-dom@19`. 2. Verificar compatibilidade react-router-dom v7, TanStack Query v5, Stripe, Supabase (já compatíveis). 3. Habilitar React Compiler no Vite. 4. Substituir `useEffect`+`useState` por `use()` + Suspense onde aplicável. |
| **Esforço** | 2-4 dias |
| **Prioridade** | P2 |

### 2.4 Toast e Confirm como Props (Deveriam ser Contexto)

| Campo | Descrição |
|---|---|
| **Problema** | `toast` e `confirm` passados como props pela árvore inteira. 6 referências em App.jsx + routes + features. |
| **Impacto** | Poluição de props. Toda feature depende de props de UI global passadas via router. |
| **Solução** | `ToastProvider` e `ConfirmProvider` com hooks `useToast()` / `useConfirm()`. Remove props desses componentes de todas as rotas. |
| **Esforço** | 0.5 dia |
| **Prioridade** | P2 |

### 2.5 Service Worker Custom (Funcional, sem Workbox)

| Campo | Descrição |
|---|---|
| **Problema** | `public/sw.js` implementa manualmente: network-first (navegação), cache-first (assets/fonts), precache de bundles no install, SKIP_WAITING controlado, limpeza de caches antigos. **Não é crítico** — funciona bem para o caso de uso. |
| **Impacto** | Sem workbox = mais código manual. Sem precache automático incremental. Mas o SW atual atende bem. |
| **Solução** | Manter como está a menos que bugs apareçam. Se precisar de mais recursos (background sync, push), considerar `vite-plugin-pwa`. |
| **Esforço** | — |
| **Prioridade** | P2 (não mexer agora) |

### 2.6 Layout Condicional em App.jsx (3 Variações)

| Campo | Descrição |
|---|---|
| **Problema** | App.jsx gerencia 3 layouts: landing (não logado), legal (privacidade/termos), app (logado). Cada um com imports, condicionais, estrutura própria. |
| **Impacto** | Complexidade acidental. Adicionar layout público requer alterar App.jsx. |
| **Solução** | Extrair: `PublicLayout`, `LegalLayout`, `AppLayout`. App.jsx vira switch simples baseado em `session` + `path`. |
| **Esforço** | 1 dia |
| **Prioridade** | P2 |

### 2.7 ESLint: Regras Brandas

| Campo | Descrição |
|---|---|
| **Problema** | `exhaustive-deps: warn` (devia ser error). `no-unused-vars: off`. `@typescript-eslint/no-unused-vars: warn`. Variável `SRC` definida mas não usada no `eslint.config.js`. |
| **Impacto** | Dependências faltando em hooks passam despercebidas. Código morto não é detectado. |
| **Solução** | `exhaustive-deps: error`. `no-unused-vars: error`. Limpar config. |
| **Esforço** | 0.5 dia |
| **Prioridade** | P2 |

### 2.8 Rotas `/` e `/dashboard` Duplicadas

| Campo | Descrição |
|---|---|
| **Problema** | `routes.jsx:20-21`: `<Route path="/">` e `<Route path="/dashboard">` renderizam o MESMO componente com as MESMAS props. Código duplicado. |
| **Impacto** | Manutenção duplicada. Se mudar props de Dashboard, precisa alterar duas linhas. |
| **Solução** | `<Route path={["/", "/dashboard"]} element={<Dashboard .../>}/>` ou redirect de `/` para `/dashboard`. |
| **Esforço** | 0.5 dia |
| **Prioridade** | P2 |

### 2.9 Navegação com View Transitions sem Hook

| Campo | Descrição |
|---|---|
| **Problema** | `App.jsx:70-74` implementa `document.startViewTransition` + `flushSync` inline. Sem tratamento de erro. Sem fallback para Firefox/Safari. |
| **Impacto** | Transição funciona em Chrome. Sem animação nos demais. `flushSync` pode causar re-renders. |
| **Solução** | Extrair hook `useViewTransition`. |
| **Esforço** | 0.5 dia |
| **Prioridade** | P2 |

### 2.10 Sem Metadata/SEO nas Páginas Públicas

| Campo | Descrição |
|---|---|
| **Problema** | Sem `<title>`, `<meta>`, ou `<link>` dinâmicos. Landing, privacidade, termos têm mesmo title. |
| **Impacto** | SEO prejudicado nas páginas públicas. |
| **Solução** | React 19 tem metadata nativo. Se ficar em 18, `react-helmet-async`. Título por rota ao menos nas públicas. |
| **Esforço** | 0.5 dia |
| **Prioridade** | P2 |

---

## P3 — Baixo

### 3.1 Acessibilidade (ARIA, Focus, Roles)

| Campo | Descrição |
|---|---|
| **Problema** | Sidebar, BottomNav, Header, Toast, Confirm, Modal sem `aria-label`, `role`, `aria-expanded`, gerenciamento de focus. |
| **Impacto** | Falha WCAG AA. Leitores de tela comprometidos. |
| **Solução** | ARIA progressivo nos componentes de navegação e modais. Focus trap em modais. |
| **Esforço** | 2-3 dias |
| **Prioridade** | P3 |

### 3.2 Sidebar não Fecha ao Navegar (Mobile)

| Campo | Descrição |
|---|---|
| **Problema** | Sidebar controlada por `sidebarOpen` mas não fecha automaticamente ao navegar. |
| **Impacto** | UX mobile: menu não recolhe ao selecionar rota. |
| **Solução** | `navTo` chamar `setSidebarOpen(false)` em mobile (ou sempre). |
| **Esforço** | 0.5 dia |
| **Prioridade** | P3 |

### 3.3 Dead Dependencies: nodemailer

| Campo | Descrição |
|---|---|
| **Problema** | `nodemailer` em `dependencies` mas NUNCA importado em `src/`. Dead dependency. |
| **Impacto** | Zero (não entra no bundle, não é importado). Mas polui `package.json` e pode causar confusão. |
| **Solução** | Mover para `devDependencies` ou remover se não usado em Electron. |
| **Esforço** | 0.5 dia |
| **Prioridade** | P3 |

### 3.4 `_updated_at` vs `updated_at` — Duplicidade de Campos

| Campo | Descrição |
|---|---|
| **Problema** | Dexie usa `_updated_at` (local) e Supabase usa `updated_at` (remoto). Sync.js compara ambos. Risco de divergência. |
| **Impacto** | Sincronização inconsistente se campos divergirem. |
| **Solução** | Unificar para `updated_at` apenas. Tratar sync com base no mais recente. |
| **Esforço** | 1-2 dias |
| **Prioridade** | P3 |

### 3.5 Sem Cache de Imagens/Assets (Logo do Usuário)

| Campo | Descrição |
|---|---|
| **Problema** | `brand.logo_url` sem cache. Fetch direto toda renderização. |
| **Impacto** | Largura de banda desperdiçada. |
| **Solução** | Cache no SW (workbox ou manual como já existe). |
| **Esforço** | 0.5 dia |
| **Prioridade** | P3 |

### 3.6 Sem Prefetch de Rotas

| Campo | Descrição |
|---|---|
| **Problema** | Lazy loading sem prefetch → skeleton visível por 200-500ms ao navegar. |
| **Impacto** | Transição com delay perceptível. |
| **Solução** | `React.lazy` + prefetch on hover ou React Router v7 `prefetch` em Links. |
| **Esforço** | 0.5 dia |
| **Prioridade** | P3 |

### 3.7 Service Worker: Cache da Landing Page no Offline

| Campo | Descrição |
|---|---|
| **Problema** | SW cacheia `/` (app shell) mas landing page (não logado) não tem fallback offline dedicado. |
| **Impacto** | Usuário não logado sem acesso offline à landing. |
| **Solução** | Adicionar rota `/landing` ao cache offline. |
| **Esforço** | 0.5 dia |
| **Prioridade** | P3 |

### 3.8 `eslint.config.js`: Variável `SRC` Não Usada

| Campo | Descrição |
|---|---|
| **Problema** | Constante `SRC` declarada na linha 7 mas nunca referenciada. Sobra de refatoração. |
| **Impacto** | Zero (apenas ruído). |
| **Solução** | Remover linha morta. |
| **Esforço** | 1 minuto |
| **Prioridade** | P3 |

---

## P4 — Informativo (Observações, sem ação imediata)

| # | Item | Detalhe |
|---|---|---|
| 4.1 | `sideEffects: false` no package.json | Config correta para tree-shaking. Manter. |
| 4.2 | Dexie schema versioning | Usa migrações aditivas (v1, v2). Padrão correto para offline-first. |
| 4.3 | PWA: `InstallButton.jsx` + `beforeinstallprompt` | Implementação funcional. Boa prática. |
| 4.4 | Error boundaries em 3 níveis | Global, Feature, Widget. Arquitetura sólida. |
| 4.5 | Tailwind com CSS custom properties para tema | Abordagem correta para theming dinâmico. |
| 4.6 | Testes usam `fake-indexeddb` | Mock correto de IndexedDB em ambiente jsdom. |
| 4.7 | Estratégia de build Vite + manualChunks | Boa base, precisa de ajustes finos (P1.5). |
| 4.8 | Atalhos de teclado (g+d, g+t, etc) | Feature útil. Poderia ser extraída para hook dedicado. |

---

## Resumo de Esforço

| Prioridade | Itens | Esforço |
|---|---|---|
| P0 | 3 | 2-4 dias + 1 min |
| P1 | 7 | 10-17 dias |
| P2 | 10 | 7-13 dias |
| P3 | 8 | 5-8 dias |
| **Total** | **28** | **~24-42 dias** |

## Recomendações de Ordem

1. **Imediato** (P0): Corrigir build quebrado (1 min). Extrair responsabilidades do App.jsx. Contextos toast/confirm.
2. **Sprint 1** (P1): Lazy loading de dados por rota. Recurso concorrente React 18. BrowserRouter. Otimizar bundle. TypeScript progressivo em lib/.
3. **Sprint 2** (P2): `var` → `const`/`let`. React 19 + Compiler. Layouts extraídos. Rotas `/` unificadas. ESLint rigoroso.
4. **Sprints seguintes** (P3): Acessibilidade. Prefetch. Dead deps. Unificar campos de sync.

---

## Erros e Correções desta Versão (vs v1)

- ❌ **Build quebrado**: não detectado na v1. P0 adicionado.
- ❌ `sw.js` descrito como "sem workbox e problemático" → corrigido: SW é funcional com network-first, precache, SKIP_WAITING.
- ❌ CRDT sugerido → overengineering. Removido. Solução correta: documentar limitação.
- ❌ React Query + Dexie como duas camadas → overengineering. Mantido Dexie como fonte da verdade offline-first.
- ❌ `no-unused-vars` descrito como `warn` → é `off`. Corrigido.
- ❌ `sw.js` descrito como "na raiz" → `public/sw.js`. Corrigido.
- ❌ HashRouter não mencionado → adicionado como P1 (impacto SEO).
- ❌ Rotas `/` e `/dashboard` duplicadas → adicionado como P2.
- ❌ Ausência de medição de bundle → nota: impossível porque build quebra.
