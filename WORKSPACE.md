# Workspace — Financia

> Configuração do ambiente de desenvolvimento e estado do repositório.

---

## Repositório

- **Origem**: `https://github.com/AsafeTork/financia`
- **Branch principal**: `main`
- **Sincronizado**: ✅ `git status` clean
- **GitHub CLI**: ✅ Configurado (`gh` disponível)

---

## Ambiente

- **Desenvolvimento**: GitHub Codespaces
- **DevContainer**: ✅ Funcional
- **Node**: v22.x
- **Package Manager**: npm

---

## Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| `dev` | `vite` | Servidor de desenvolvimento |
| `build` | `vite build` | Build de produção |
| `preview` | `vite preview` | Preview do build |
| `test` | `vitest run` | Suite completa de testes |
| `test:fast` | `vitest run --no-isolate --reporter=dot` | Testes rápidos |
| `lint` | `eslint src/` | Linting |
| `typecheck` | `tsc --noEmit` | Verificação de tipos |
| `security:audit` | `npm audit --audit-level=high` | Auditoria de segurança |
| `analyze` | `ANALYZE=true vite build` | Análise de bundle |

---

## Validação Rápida (validate:fast)

```bash
npm run build && npm run lint && npm run test:fast
```

## Validação Completa (validate:full)

```bash
npm run build && npm run lint && npm run test
```

---

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + Vite 5 |
| Estilização | Tailwind CSS 3 + CSS Variables |
| Roteamento | React Router v7 (HashRouter) |
| Server State | @tanstack/react-query v5 |
| Offline/Local | Dexie.js 3 (IndexedDB) |
| Backend | Supabase (PostgreSQL 17 + Auth + RLS + Edge Functions) |
| Pagamentos | Stripe (Elements + Edge Functions) |
| Desktop | Electron 31 |
| Mobile | Android TWA |
| Testes | Vitest + Testing Library |
| CI/CD | GitHub Actions |

---

## Estrutura de Diretórios (src/)

```
src/
├── App.jsx                 # Root component (layout + providers)
├── main.jsx                # Entry point
├── routes/
│   └── routes.jsx          # Rotas (lazy-loaded)
├── features/               # Módulos por domínio
│   ├── auth/
│   ├── branding/           # BrandStudio, hooks, schema, presets
│   ├── dashboard/
│   ├── email/
│   ├── inventory/
│   ├── plans/
│   ├── reports/
│   ├── settings/
│   └── transactions/
├── shared/                 # Compartilhado
│   ├── ui/                 # Button, Card, Input, Modal, Toast...
│   ├── layout/             # Sidebar, Header, BottomNav
│   └── hooks/              # useBrandAppearance, useSession...
├── lib/                    # Core infrastructure
│   ├── dexie.js            # Dexie schema + db
│   ├── sync.js             # Sync engine (write-through)
│   ├── supabase.js         # Supabase client
│   ├── constants.js        # Planos, limites, temas, nav
│   ├── utils.js            # Helpers (deriveCores, brandAlpha...)
│   └── stripe.js           # Stripe helpers
├── test/                   # Testes globais + mocks
└── ai/                     # Cliente IA (opcional)
```

---

## Supabase (Produção)

- **Project**: `financia-gestao` (Ref: `abc123...`)
- **Região**: `us-east-1`
- **Edge Functions**: `stripe-webhook`, `create-payment`, `admin-*`
- **Buckets**: `logos` (MIME restricted), `exports`
- **RLS**: Ativo em todas as tabelas sensíveis

---

## Próximos Passos (Fase 5)

1. [ ] Auditoria Backend completa
2. [ ] Relatório técnico
3. [ ] Aprovação do plano
4. [ ] Implementação priorizada