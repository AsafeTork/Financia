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

## PHASE 4 — ARCHITECTURE RE-ORGANIZATION

**Goal**: Feature-based architecture.

| Step | Action | Status |
|---|---|---|
| 4.1 | Create src/features/ and src/shared/ | |
| 4.2 | Move views + hooks into feature folders | |
| 4.3 | Move shared components to src/shared/ui/ | |
| 4.4 | Reorganize lib/ | ✅ db.js → dexie.js + sync.js |
| 4.5 | Update imports | |

**Verification**: Clean directory structure, no broken imports

---

## PHASE 5 — COMPONENT REWRITE

**Goal**: Modern, accessible component library.

| Step | Action |
|---|---|
| 5.1 | shadcn/ui Button with variants |
| 5.2 | shadcn/ui Input + FormField |
| 5.3 | Reusable Card component |
| 5.4 | Modal compound component |
| 5.5 | Toast provider + reducer |
| 5.6 | shadcn/ui navigation menu |
| 5.7 | Badge component |
| 5.8 | Sortable DataTable |

**Verification**: Components accessible, tests pass

---

## PHASE 6 — ACCESSIBILITY & UX

**Goal**: WCAG AA compliance.

| Step | Action |
|---|---|
| 6.1 | htmlFor/id on all form inputs |
| 6.2 | lang="pt-BR" on index.html |
| 6.3 | Focus trap on Modal |
| 6.4 | Text labels on color-only indicators |
| 6.5 | Virtual scrolling on TxView |
| 6.6 | Keyboard shortcuts |
| 6.7 | Filter by period on Dashboard |
| 6.8 | Optimistic UI on forms |
| 6.9 | Section-level loading states |

**Verification**: Lighthouse audit passes WCAG AA

---

## PHASE 7 — DOCUMENTATION PURGE

**Goal**: 33 files → ~10 accurate files.

| Step | Action |
|---|---|
| 7.1 | Archive incorrect docs (04, 06, 07, 10, 12) |
| 7.2 | Delete duplicate/obsolete files |
| 7.3 | Delete unused templates |
| 7.4 | Merge duplicate AI brand schema |
| 7.5 | Update README.md |
| 7.6 | Rewrite CLAUDE.md |
| 7.7 | Create CHANGELOG.md |

**Verification**: Only accurate docs remain

---

## PHASE 8 — SECURITY HARDENING

| Step | Action |
|---|---|
| 8.1 | Fix magic link token leak |
| 8.2 | Fix impersonation password leak |
| 8.3 | Add MIME restriction to logos bucket |
| 8.4 | Add field whitelisting to db.js |
| 8.5 | npm audit fix |

**Verification**: Security scan passes

---

## PHASE 9 — TEST INFRASTRUCTURE

| Step | Action |
|---|---|
| 9.1 | Create vitest.config.js |
| 9.2 | Fix failing tests |
| 9.3 | Add MSW for API mocking |
| 9.4 | Integration tests for critical paths |

**Verification**: Tests cover critical paths

---

## PHASE 10 — MODERNIZATION

| Step | Action |
|---|---|
| 10.1 | Incremental TypeScript migration |
| 10.2 | Replace hash routing with React Router v7 |
| 10.3 | Add TanStack Query |
| 10.4 | Add bundle analysis |
| 10.5 | Set up CI/CD |
| 10.6 | Set up Lighthouse CI |

**Verification**: Build, test, deploy pipeline green
