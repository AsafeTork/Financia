# CLAUDE.md — Financia

Entry point. Read `docs/` for details. This file is intentionally thin.

---

## Quick start

```bash
npm run dev     # dev server
npm run build   # produção
npm run test    # 1113+ testes Vitest
```

---

## Proibições (nunca violar)

- `?.` optional chaining → quebra build Vite
- `=> ({...spread, x})` → parse error
- emojis em JS/JSX
- `service_role` key no frontend
- credenciais hardcoded
- `bg-white`/`text-black` — usar CSS vars do tema

---

## Docs

| Caminho | Conteúdo |
|---|---|
| `docs/architecture/01-overview.md` | Stack, dir tree, routing, data flow |
| `docs/architecture/02-frontend.md` | Componentes, hooks, memo, lazy |
| `docs/architecture/03-backend-supabase.md` | Tabelas, RLS, triggers, RPCs, Edge Functions |
| `docs/architecture/04-sync-offline.md` | Dexie, sync loop, conflitos |
| `docs/architecture/05-branding-white-label.md` | Cores, temas, planos |
| `docs/architecture/06-stripe-billing.md` | Subscription flow, webhook |
| `docs/architecture/07-security-auth.md` | Auth, impersonação, guards |
| `docs/architecture/08-deployment.md` | Render, CI/CD, Electron |
| `docs/agents/01-coder.md` | Instructions for coding agent |
| `docs/agents/02-architect.md` | Architecture knowledge for planning agent |
| `docs/agents/03-auditor.md` | Security audit checklist for reviewer agent |
| `docs/agents/04-tester.md` | Test patterns for QA agent |
| `docs/agents/05-debugger.md` | Diagnosis protocol for debug agent |

---

## Context retrieval (smart_context.py)

```bash
python C:/Users/gilma/bin/smart_context.py recent .
python C:/Users/gilma/bin/smart_context.py map .
python C:/Users/gilma/bin/smart_context.py skeleton <file>
python C:/Users/gilma/bin/smart_context.py search <query>
```

---

## Notices

- **Triggers não estão nas migrations**: `prevent_plan_change()` e `handle_new_user()` existem só no banco ao vivo.
- **Security model**: toda query RLS filtra por `auth.uid() = user_id`. Planos alterados exclusivamente via RPC `set_client_plan(a_target, b_plan, c_actor)`.
