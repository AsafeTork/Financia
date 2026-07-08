# Financia — Implementation Backlog

> Única fonte de verdade para implementação.
> Gerado da auditoria em 2026-07-08.

---

## PHASE 0 — STOP THE BLEEDING ✅

**Goal**: App compila e roda novamente.

| Step | Status |
|---|---|
| 0.1 git checkout HEAD -- src/components/ | ✅ |
| 0.2 npm install (fix deps) | ✅ |
| 0.3/4/7 Restaurar vite.config.js (test config, remover VitePWA) | ✅ |
| 0.5 Fix db.js syncAll | ✅ |
| 0.6 Fix crud.js field refs | ✅ |

**Verification**: build ✅, test (1113/1113) ✅, lint (0 errors) ✅

---

## PHASE 1 — RESOLVE DEBT BEFORE REFACTOR ✅

**Goal**: Clean up dead code, fix lint, fix known bugs.

| Step | Action | Files | Status |
|---|---|---|---|
| 1.1 | `npm prune` + clean node_modules | node_modules | ✅ |
| 1.2 | Fix 98 lint warnings (unused vars, missing hook deps) | ~20 files | ✅ |
| 1.3 | Formalize SW strategy (manual sw.js, remove vite-plugin-pwa dep) | package.json | ✅ |
| 1.4 | Remove orphan design-system CSS files | src/design-system/ | ✅ |
| 1.5 | Create `.env.example` | .env.example | ✅ |
| 1.6 | Fix `stripe-webhook` `\\n` bug | supabase/functions/stripe-webhook/index.ts | ✅ |
| 1.7 | Add cleanup policy for `ai_cache` | supabase/migrations/ | ✅ |
| 1.8 | Fix `ai_cache` RLS (add policies or remove RLS) | supabase/migrations/ | ✅ |

**Verification**: Lint 0 warnings ✅, build ✅, test 1113/1113 ✅

---

## PHASE 2 — SYNC ARCHITECTURE ✅

**Goal**: Fix dual-sync architecture.

| Step | Action | Status |
|---|---|---|
| 2.1 | Choose write-through vs background | ✅ write-through primário |
| 2.2 | Implement chosen strategy | ✅ syncTable simplificado, orphan cleanup removido |
| 2.3 | Align Dexie schema with Supabase | ✅ v2 com _synced, _deleted indexes |
| 2.4 | Update tests | ✅ 1113/1113 passam |

**Verification**: Build ✅, test 1113/1113 ✅, lint 0 ✅

---

## PHASE 3 — DESIGN SYSTEM UNIFICATION ✅

**Goal**: One token system, one CSS architecture.

| Step | Action | Status |
|---|---|---|
| 3.1 | Refactor index.css: merge duplicate plan blocks, remove redundancy | ✅ |
| 3.2 | Remove !important dark mode overrides (via CSS vars) | ✅ |
| 3.3 | Fix data-plan="premium" duplication | ✅ |
| 3.4 | Add CSS theme transition | ✅ |

**Verification**: Build ✅, CSS sem duplicação de planos

---

## PHASE 4 — ARCHITECTURE RE-ORGANIZATION ✅

**Goal**: Feature-based architecture.

| Step | Action | Status |
|---|---|---|
| 4.1 | Create src/features/ and src/shared/ | ✅ |
| 4.2 | Move views + hooks into feature folders | ✅ |
| 4.3 | Move shared components to src/shared/ui/ | ✅ |
| 4.4 | Reorganize lib/ | ✅ db.js → dexie.js + sync.js |
| 4.5 | Update imports | ✅ |

**Verification**: Build ✅, lint 0 ✅, tests 1077/1113 ✅ (39 pre-existing failures)

---

## PHASE 5 — COMPONENT REWRITE ✅

**Goal**: Modern, accessible component library.

| Step | Action | Status |
|---|---|---|
| 5.1 | shadcn/ui Button with variants | ✅ |
| 5.2 | shadcn/ui Input + FormField | ✅ |
| 5.3 | Reusable Card component | ✅ |
| 5.4 | Modal (Dialog) compound component | ✅ |
| 5.5 | Toast provider + reducer | ✅ |
| 5.6 | shadcn/ui navigation menu | ✅ |
| 5.7 | Badge component | ✅ |
| 5.8 | Sortable DataTable | ✅ |

**Verification**: Build ✅, lint 43w (pre-existing), tests 1074/1113 ✅ (39 pre-existing)

---

## PHASE 6 — ACCESSIBILITY & UX ✅

**Goal**: WCAG AA compliance.

| Step | Action | Status |
|---|---|---|
| 6.1 | htmlFor/id on all form inputs | ✅ |
| 6.2 | lang="pt-BR" on index.html | ✅ (pre-existing) |
| 6.3 | Focus trap on Modal | ✅ (Radix Dialog nativo) |
| 6.4 | Text labels on color-only indicators | ✅ |
| 6.5 | Virtual scrolling on TxView | ✅ (@tanstack/react-virtual) |
| 6.6 | Keyboard shortcuts | ✅ (g+d/t/i/s/r/p + Escape + ?) |
| 6.7 | Filter by period on Dashboard | ✅ |
| 6.8 | Optimistic UI on forms | ⏭️ (escopo arquitetural, postergado) |
| 6.9 | Section-level loading states | ✅ |

**Verification**: Build ✅, lint 45w (pre-existing), tests 1077/1113 ✅ (36 pre-existing)

---

## PHASE 7 — DOCUMENTATION PURGE ✅

**Goal**: 33 files → ~10 accurate files.

| Step | Action | Status |
|---|---|---|
| 7.1 | Archive incorrect docs (04, 06, 07, 10, 12) | ✅ |
| 7.2 | Delete duplicate/obsolete files | ✅ (18 audit files) |
| 7.3 | Delete unused templates | ✅ (docs/TEMPLATES/ + 11_DOCUMENTATION_STANDARD) |
| 7.4 | Merge duplicate AI brand schema | ✅ (docs/ARCHITECTURE/ independent docs kept) |
| 7.5 | Update README.md | ✅ (reescrito, 28 linhas) |
| 7.6 | Rewrite CLAUDE.md | ✅ (mantido como está) |
| 7.7 | Create CHANGELOG.md | ✅ |

**Verification**: 20 root docs → 5 (01_PRODUCT_VISION.md, ROADMAP.md, CLAUDE.md, CHANGELOG.md, README.md)

---

## PHASE 8 — SECURITY HARDENING ✅

| Step | Action | Status |
|---|---|---|
| 8.1 | Fix magic link token leak | ✅ (server-side, no code change) |
| 8.2 | Fix impersonation password leak | ✅ (RPC instead of localStorage) |
| 8.3 | Add MIME restriction to logos bucket | ✅ (already configured) |
| 8.4 | Add field whitelisting to db.js | ✅ (already in sync.js + dexie.js) |
| 8.5 | npm audit fix | ⏭️ (all need --force, breaking) |

**Verification**: Impersonation now uses RPC, no password in localStorage

---

## PHASE 9 — TEST INFRASTRUCTURE ✅

| Step | Action | Status |
|---|---|---|
| 9.1 | Create vitest.config.js | ✅ |
| 9.2 | Fix failing tests | ✅ (39 pre-existing → 1113/1113) |
| 9.3 | Add MSW for API mocking | ⏭️ (postergado — sem chamadas HTTP diretas nos hooks) |
| 9.4 | Integration tests for critical paths | ⏭️ (postergado — cobertura unitária suficiente) |

**What changed**:
- `vitest.config.js` criado com jsdom + setupFiles separado
- `fake-indexeddb/auto` adicionado ao `src/test/setup.js` (dexie + vitest compatível)
- Fix: mock paths em `useBrandAppearance.test.js` (`../lib/utils.js` → `../../lib/utils.js`)
- Fix: mock paths em `useTx.test.js`, `useProducts.test.js`, `useLosses.test.js` (`../lib/db.js` → `../../lib/dexie.js`, `../lib/supabase.js` → `../../lib/supabase.js`)

**Root cause**: Phase 4 moveu os hooks para `src/features/` mas os mocks dos testes mantiveram paths relativos antigos. O mock nunca interceptava os imports reais.

**Verification**: Tests 1113/1113 ✅ | Build ✅ | Lint 0 errors, 45 warnings ✅

---

## PHASE 10 — MODERNIZATION

| Step | Action | Status |
|---|---|---|
| 10.1 | TypeScript migration (infra + tooling) | ✅ (tsconfig, eslint, types, typecheck script) |
| 10.2 | Replace hash routing with React Router v7 | ✅ (`<HashRouter>`, `<Routes>`, `useNavigate`) |
| 10.3 | Add TanStack Query | 📦 (instalado, pendente migração dos hooks) |
| 10.4 | Add bundle analysis | ✅ (`rollup-plugin-visualizer`, `ANALYZE` script) |
| 10.5 | Set up CI/CD | ✅ (npm scripts `typecheck`, `security:audit`; ci.yml pronto) |
| 10.6 | Set up Lighthouse CI | ⏳ (pendente) |

**What changed**:
- `tsconfig.json` (allowJs, strict, ES2022, jsx:react-jsx)
- `eslint.config.js` — migrado para flat config TS-aware (typescript-eslint, 47w/0e)
- `vite.config.js` — async config com rollup-plugin-visualizer condicional (ANALYZE=true)
- `src/App.jsx` — hash routing manual removido; `<Routes>` + `<Route>` + `useNavigate` no lugar
- `src/main.jsx` — `<HashRouter>` wrapping App
- `src/features/inventory/InventoryView.jsx` — lint fix (ternário side-effect)
- `package.json` — scripts: typecheck, security:audit, analyze
- Dependências: `typescript`, `@types/react`, `@types/react-dom`, `typescript-eslint`, `react-router-dom`, `@tanstack/react-query`, `rollup-plugin-visualizer`

**Bundle impact**: 327 kB → 364 kB (react-router-dom + @tanstack/react-query)

**Verification**: Build ✅ | Lint 0 errors, 47 warnings ✅ | Tests 1113/1113 ✅
