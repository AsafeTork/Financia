# Financia — Gestão Financeira

App de gestão financeira white-label para pequenas empresas. Cada cliente tem sua própria identidade visual (nome, logo, cores) e o app roda como PWA, APK Android, ou instalador Windows.

---

## Acesso rápido

| Recurso | Link |
|---------|------|
| App web (produção) | https://financia-gestao.onrender.com |
| Painel Supabase | https://supabase.com/dashboard/project/kxeqhorxhlgwcgywovqr |
| GitHub Actions (builds) | `.github/workflows/build.yml` |
| Painel Render | https://dashboard.render.com |

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind CSS v3 |
| Backend | Supabase (PostgreSQL + Auth + RLS + Edge Functions) |
| Offline | Dexie v3 (IndexedDB) |
| Desktop | Electron 31 (Windows) |
| Mobile | APK Android (WebView) |
| Deploy web | Render (static site, auto-deploy em push para `main`) |
| CI/CD | GitHub Actions (APK Android + EXE Windows) |
| Pagamentos | Stripe (assinaturas + white-label one-time) |
| Testes | Vitest (1100+ testes) |

---

## Rodar localmente

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # vitest run (1113 testes)
npm run lint         # eslint src/
npm run build        # vite build → dist/
```

Variáveis de ambiente (`.env` na raiz, não commitado):

```
VITE_SUPABASE_URL=https://kxeqhorxhlgwcgywovqr.supabase.co
VITE_SUPABASE_ANON_KEY=<chave anon pública>
```

---

## Estrutura de pastas

```
src/
  App.jsx              Estado global + roteamento por hash
  main.jsx             Entry point
  index.css            CSS vars de tema (design system)
  animations.css       Animações globais
  lib/                 Lógica pura e integrações
    db.js              Dexie + sync bidirecional + admin queries
    supabase.js        Cliente Supabase
    auth.js            Helpers de autenticação
    constants.js       Limites de plano, branding defaults, presets
    utils.js           Funções utilitárias (cor, formatação, validação)
    stripe.js          Helpers Stripe (erros amigáveis)
    aiClient.js        Proxy para IA (paleta, insights)
    recurring.js       Lançamentos recorrentes
    exporters.js       Exportação CSV/PDF
    crud.js            Operações CRUD com sync imediato
    cleanNumeric.js    Sanitização de entrada numérica
  hooks/               Hooks customizados React
    useSession.js      Orquestra auth, loadData, sync, realtime
    useBrandAppearance.js  Deriva appBrand + aplica CSS vars
    useBrandManager.js saveBrand + savePhone (Dexie → Supabase)
    useTx.js           CRUD de transações
    useProducts.js     CRUD de produtos
    useLosses.js       CRUD de perdas
    useDataLoader.js   Carrega dados do Dexie local
    useAuthBootstrap.js Bootstrap de sessão (getSession + onAuthChange)
    useSyncLoop.js     Loop de sync a cada 2 min
    useRealtime.js     Subscriptions Supabase Realtime
    useImpersonation.js Fluxo de impersonação admin → cliente
    useScrollReveal.js Animação de scroll
  views/               Páginas (lazy-loaded)
  components/           Componentes reutilizáveis
  admin/               Painel admin
supabase/
  migrations/          19 migrações SQL
  functions/           18 Edge Functions (Deno)
electron/
  main.cjs             Main process (CommonJS)
scripts/               gen_icons.py, gen_icon_win.py
docs/                  Documentação completa do projeto
  architecture/        8 docs de arquitetura
  agents/              5 instruction files para AI agents
```

---

## Documentação completa

Toda a documentação técnica está em `docs/`. Consulte [`CLAUDE.md`](CLAUDE.md) para o entry point.

| Pasta | Conteúdo |
|-------|---------|
| `docs/architecture/` | 8 arquivos explicando todo o código do projeto |
| `docs/agents/` | 5 instruction files para diferentes tipos de AI agent |

Para instructions de AI que vai trabalhar no projeto, leia [`CLAUDE.md`](CLAUDE.md) (entry point) e [`docs/agents/`](docs/agents/).

---

## Planos

| Plano | Transações | Produtos | Perdas | Preço |
|-------|-----------|---------|-------|-------|
| Free | 50 total | 20 total | 10 total | Gratuito |
| Pro | Ilimitado | Ilimitado | Ilimitado | R$ 49,90/mês |
| Premium | Ilimitado | Ilimitado | Ilimitado | R$ 99,90/mês |

White-label (personalização visual completa): R$ 497 pagamento único.

---

## Regras de código essenciais

- **PROIBIDO** optional chaining (`?.`)
- **PROIBIDO** arrow spreads iniciais (`=> ({...spread, x})`)
- **PROIBIDO** emojis em strings JS/JSX
- **PROIBIDO** `service_role` key no frontend
- **PROIBIDO** classes de cor hardcoded (`bg-white`, `text-gray-400`) — usar CSS vars
- **OBRIGATÓRIO** área de toque mínima 44x44px
- **OBRIGATÓRIO** `truncate` em textos de lista
- **OBRIGATÓRIO** confirmação antes de ações destrutivas

Regras detalhadas em [`docs/agents/01-coder.md`](docs/agents/01-coder.md).
