# REALITY AUDIT — Financia

> Gerado em: 2026-07-08
> Método: leitura integral do código-fonte, migrações SQL, Edge Functions, dependências e documentação existente.
> Premissa: **código é fonte única da verdade**. Documentação é evidência, não verdade.

---

## 1. Stack Real vs. Documentada

| Camada | Real (código) | Documentado (MASTER.md) | Veredito |
|---|---|---|---|
| React | 18.3.1 | 18 (ok) | OK |
| Vite | 5.4 | 5 (ok) | OK |
| Tailwind | 3.4 | 3 (ok) | OK |
| **Zustand** | **NÃO EXISTE** | Citado como se existisse | **FALSO** — App.jsx usa `useState` puro (~18 instâncias) |
| TanStack Query | NÃO EXISTE | Não mencionado | N/A |
| shadcn/ui / Radix | NÃO EXISTE | Não mencionado | N/A |
| TypeScript | **NÃO EXISTE** | Não mencionado | Projeto 100% JS puro |
| **Dexie** | 3.2.7 (IndexedDB) | Não mencionado | **OMISSÃO** — core da arquitetura offline |
| **Supabase** | 2.45 | Mencionado | OK |
| **Stripe** | 17+ | Mencionado | OK |
| React Router | NÃO EXISTE | Não mencionado | Roteamento manual em App.jsx |
| React Hook Form | NÃO EXISTE | Não mencionado | Forms manuais com useState |
| Zod | NÃO EXISTE | Não mencionado | Zero validação de schema runtime |

**Stack real que nenhum documento menciona**: Dexie (offline-first), service workers (PWA), sistema de design próprio em CSS modules, Edge Functions.

---

## 2. Estrutura de Diretórios — Real vs. Recomendado (2026)

### Real (flat por tipo):
```
src/
  App.jsx              ← 18KB monólito (estado, rotas, providers)
  brandStudio/         ← 19 arquivos (editor visual white-label)
  hooks/               ← 14 hooks + 3 testes
  lib/                 ← 19 arquivos (core)
  views/               ← 12 telas
  admin/               ← 3 arquivos
  components/ui/       ← SCAFFOLD VAZIO (3 diretórios sem arquivos)
  components/examples/ ← SCAFFOLD VAZIO (3 diretórios sem arquivos)
  design-system/       ← 5 CSS (design tokens)
  test/                ← testes avulsos
```

### Recomendado 2026 (feature-first):
```
src/
  features/            ← cada domínio é auto-contido
    transactions/
    products/
    branding/
    admin/
    auth/
  shared/              ← UI primitives, hooks genéricos
  core/                ← config, http client, telemetry
  routes/              ← lazy loading por rota
```

### Problemas identificados:
- **App.jsx de 18KB** concentra roteamento, providers, estado global e boot — fere SRP e dificulta testes
- **components/ui/ vazio** — scaffold prometido mas não entregue; o design system real está em `design-system/` (5 CSS)
- **components/examples/ vazio** — planejado mas não implementado
- **views/** agrupa por página (tipo) em vez de domínio — mistura lógica de transação, inventory, relatório sem separação clara
- **brandStudio/** é feature grande mas tratada como área separada — deveria estar em `features/branding/`
- **Zero barrel files** (index.js) — imports deep e frágeis

---

## 3. Estado da Documentação vs. Realidade

### `docs/ARCHITECTURE/MASTER.md`
| Afirmação | Realidade | Gravidade |
|---|---|---|
| "Zustand para estado global" | App.jsx usa useState puro (18 instâncias) | 🔴 FALSO |
| Diagramas Mermaid | Não renderizam (sintaxe errada) | 🟡 Quebrado |
| Estrutura de diretórios | Desatualizada (não lista brandStudio/, design-system/) | 🟡 Desatualizado |

### `01_PRODUCT_VISION.md` (parâmetro de decisão)
| Afirmação | Realidade | Gravidade |
|---|---|---|
| "2 telas: Dashboard + Transações" | 12 views (Dashboard, Tx, Inventory, Reports, Settings, Plans, Landing, Login, Email, BrandStudio, Privacy, Terms) | 🔴 DIVERGÊNCIA TOTAL |
| "Remover editor de marca" | brandStudio/ tem 19 arquivos com schema JSON, presets, eventos sazonais, validação WCAG | 🔴 CONTRADIÇÃO DIRETA |
| "Simplificar para app financeiro básico" | Stripe subscriptions, white-label, impersonação, offline-first, AI assistant, PWA | 🔴 ESCOPO MUITO MAIOR |

### Outros documentos
- `docs/FINANCIA_CTX.md` — não lido (pode ter informações úteis)
- `docs/AI_CONTEXT.md` — não lido
- `docs/ARCHITECTURE.md` — não lido

---

## 4. Dívida Técnica por Camada

### Frontend (React)
| Item | Localização | Impacto |
|---|---|---|
| App.jsx monólito (18KB) | `src/App.jsx` | Dificulta teste, manutenção, code-splitting |
| Zero lazy loading | App.jsx importa todas views no topo | Bundle inicial carrega tudo |
| Zero Error Boundaries | Nenhum em toda árvore React | Qualquer crash = tela branca |
| useState em vez de useReducer | App.jsx (~18 instâncias), SettingsView (~7), TxView (~6) | Estado complexo sem gerenciamento adequado |
| `var` em vez de `const/let` | brandStudio/ inteiro (todos arquivos) | Padrão ES5 — inconsistente com resto do projeto que usa `const/let` |
| Zero TypeScript | Projeto inteiro | Sem safety em tipos, especialmente nas chamadas Supabase e Stripe |
| Components vazios | `components/ui/`, `components/examples/` | 6 diretórios prometidos mas não entregues |

### Estado e Data Flow
| Item | Localização | Impacto |
|---|---|---|
| Sem TanStack Query | N/A | Cache manual, sem stale-while-revalidate, sem loading states padronizados |
| Supabase chamado direto nas views | `useSession`, `useTx`, `useProducts`, etc. | Sem camada de abstração — mudar de backend exige reescrever hooks |
| `db.js` (248 linhas) com sync engine | `src/lib/db.js` | Core do offline-first mas sem testes de integração, sem tratamento de conflitos real |
| `crud.js` compartilhado | `src/lib/crud.js` | Bom padrão, mas sem cobertura de testes para cenários offline |

### Testes
| Item | Realidade | Impacto |
|---|---|---|
| Cobertura global | ~5% estimado | Risco alto de regressão |
| Hooks testados | `useTx`, `useProducts`, `useLosses`, `useBrandAppearance` (+ `lib/` tests) | 🟡 Cobertura parcial |
| Views testadas | Nenhuma | 🔴 Zero cobertura de renderização |
| Integração | Nenhum teste de fluxo completo | 🔴 Ninguém sabe se features funcionam juntas |
| E2E | Nenhum | 🔴 Sem garantia de fluxos críticos (login → tx → sync) |

### Backend (Supabase)
| Item | Realidade | Impacto |
|---|---|---|
| Segurança | Migrações corrigem bypass crítico (admin gates) | ✅ Bem tratado |
| RLS | Policies por user_id, role admin | ✅ Correto |
| Edge Functions | 16 funções bem estruturadas | ✅ Qualidade boa |
| Impersonação | Sistema completo com restauração automática | ✅ Robusto |

### Performance
| Item | Realidade | Impacto |
|---|---|---|
| Code splitting | Nenhum | Bundle contém todo o app |
| Virtualização | Nenhuma | Listas podem degradar com >100 itens |
| Memoização | React.memo não usado em nenhum componente | Re-renders desnecessários em toda árvore |
| Bundle analysis | Nunca rodado | Desconhecido |

---

## 5. Overengineering Detectado

### brandStudio/ (19 arquivos)
- Schema JSON versionado (`BRAND_SCHEMA_VERSION '1.0.0'`)
- Schema Registry com plugin system (`registerModule`)
- Normalizadores com migração V1→V2
- AI Compatibility Layer (detecta ChatGPT vs Claude)
- Sistema de Presets (8 oficiais + usuário + import/export)
- Eventos sazonais (Natal, Ano Novo, Black Friday, Carnaval, Outubro Rosa, Novembro Azul)
- Validação WCAG (contraste, distância de matiz)
- undo/redo history (20 níveis)

**Análise**: brandStudio é um produto dentro do produto. Equivalente a um editor de temas completo. Para um app financeiro, isso representa **~60% da complexidade frontend para uma feature de customização visual**.

---

## 6. Dead Code / Scaffolds Abandonados

| Caminho | Estado | Ação Recomendada |
|---|---|---|
| `src/components/ui/` | 3 diretórios vazios (foundation, components, patterns) | Remover ou implementar |
| `src/components/examples/` | 3 diretórios vazios (dashboard, inventory, tx-entry) | Remover ou implementar |
| `EmailView.jsx` | View existe mas visão de produto diz "remover" | Decidir manter ou excluir |
| `brandStudio/` | Contradiz visão de produto | Decidir manter ou simplificar |

---

## 7. Schema do Banco (Mapeamento Rápido)

Tabelas em `company_profiles`:
- `plan` (text: free/pro/premium)
- `white_label` (boolean)
- `brand_config` (jsonb) — editor visual
- `visual_version` (integer) — controle de versão visual
- `custom_palette` (boolean)
- `custom_price_cents*` — preços customizados por plano
- `stripe_customer_id`, `subscription_id`

Tabelas de negócio: `transactions`, `products`, `losses`, `user_roles`, `ai_cache`, `impersonation_sessions`

---

## 8. Comparativo: Stack Atual vs. 2026 Best Practices

| Prática 2026 | Financia | Gap |
|---|---|---|
| Feature-first folder structure | ❌ Flat por tipo (views/hooks/lib) | Alto |
| TanStack Query + Zustand | ❌ useState puro + Dexie | Alto |
| Code splitting por rota | ❌ Import estático de todas views | Alto |
| Error Boundaries (3 níveis) | ❌ Zero | Alto |
| TypeScript strict mode | ❌ JS puro | Alto |
| React Hook Form + Zod | ❌ Forms manuais | Médio |
| MSW para mocks | ❌ Sem mocks de rede | Médio |
| Component tests (RTL) | ❌ Só hooks testados | Alto |
| Barrel files (index.ts) | ❌ Imports deep | Médio |
| shadcn/ui + Radix | ❌ Design system próprio CSS | Baixo (válido) |
| Atomic design tokens | ✅ design-system/ com 5 CSS | OK |
| Offline-first (Dexie) | ✅ db.js com push/pull/retry | OK |
| Background sync | ✅ PWA com service worker | OK |
| Edge Functions | ✅ 16 funções bem feitas | OK |
| RLS + SECURITY DEFINER | ✅ Migrações corrigem falhas | OK |
| Stripe subscriptions | ✅ Completo com webhook | OK |

---

## 9. Notas por Área (0-10)

### Frontend Architecture: 3/10
- Monólito App.jsx, sem lazy loading, sem error boundaries, sem type safety
- Scaffolds vazios (6 diretórios) indicam planejamento abandonado
- brandStudio tem qualidade de código boa mas escopo desproporcional

### Estado e Data Flow: 4/10
- Dexie + sync engine existe e funciona, mas sem TanStack Query para estados de loading/error
- CRUD compartilhado (crud.js) é boa prática, mas sem cobertura de testes
- Sem separação server state vs client state — tudo misturado

### Backend & Database: 9/10
- Migrações corrigem vulnerabilidade crítica de segurança
- Impersonação, white-label, Stripe subscriptions — completos e seguros
- Edge Functions bem estruturadas com _shared/ reutilizável
- RLS bem configurado com policies granulares

### Testes: 2/10
- Apenas hooks e lib têm testes
- Zero testes de views, integração, ou E2E
- Sem MSW ou mocks de API

### Performance: 3/10
- Sem code splitting, sem lazy loading, sem virtualização
- Bundle analysis nunca rodada
- React.memo ausente

### Documentação: 2/10
- MASTER.md contém informações falsas (Zustand não existe)
- 01_PRODUCT_VISION.md descreve app que não corresponde à realidade
- Nenhum documento reflete a arquitetura real com Dexie + offline-first

### Segurança: 8/10
- Bypass crítico corrigido (admin gates)
- RLS bem configurado
- Impersonação com restauração automática por cron
- Funções SECURITY DEFINER com search_path fixo

### Offline-first (Dexie + PWA): 7/10
- Sync engine com push/pull/retry/orphan cleanup
- Mas sem testes de conflito, sem tratamento de versão, sem fallback para navegadores sem Background Sync
- `db.js` com 248 linhas — denso mas funcional

---

## 10. Ações Recomendadas (Prioritárias)

### Imediatas (segurança e estabilidade)
1. ~~Nenhuma — segurança já auditada e corrigida~~ ✅

### Curto prazo (1-2 sprints)
1. Decidir destino do brandStudio (manter, simplificar ou remover) — impacta roadmap inteiro
2. Decidir destino da Product Vision (aceitar escopo real ou reduzir) — sem isso, documentação sempre divergirá
3. Implementar Error Boundaries (global + rota + widget)
4. Implementar lazy loading nas rotas (React.lazy + Suspense)
5. Tipo: adotar TypeScript incremental nos arquivos mais críticos (App.jsx, db.js, crud.js)

### Médio prazo (3-4 sprints)
1. Refatorar App.jsx: extrair roteamento, providers, boot sequence
2. Adotar feature-first structure para novas features; migrar existentes gradualmente
3. Adicionar TanStack Query para server state (coexistindo com Dexie para offline)
4. Substituir useState complexo por useReducer (SettingsView, App.jsx)
5. Testar hooks restantes e views principais (RTL)
6. Remover scaffolds vazios (components/ui/, components/examples/)

### Longo prazo
1. Considerar Zustand ou Context otimizado para UI state global (sidebar, modal, toast)
2. E2E tests com Playwright para fluxos críticos (login → tx → sync)
3. MSW para mocks de API em testes
4. Bundle analysis + code splitting por vendor chunks

---

## Glossário de Divergências

| Documento | Diz | Realidade | Impacto |
|---|---|---|---|
| MASTER.md | App usa Zustand | App usa useState | Desenvolvedor novo perde horas procurando store |
| MASTER.md | Diagramas de arquitetura | Não renderizam | Navegação prejudicada |
| 01_PRODUCT_VISION.md | App tem 2 telas | App tem 12 views | Decisões baseadas em premissa errada |
| 01_PRODUCT_VISION.md | Remover brand editor | brandStudio com 19 arquivos ativos | Roadmap contradiz execução |
| 01_PRODUCT_VISION.md | App financeiro simplificado | Stripe, white-label, impersonação, offline-first, PWA, AI | Escopo real é muito maior |
