# Financia — Refactoring Roadmap

## PHASE 0: STOP THE BLEEDING (Day 1)

**Goal**: Make the app compile and run again.

| Step | Action | Files | Risk |
|---|---|---|---|
| 0.1 | `git checkout HEAD -- src/components/` | 25 component files | None — git restores originals |
| 0.2 | `npm install vite-plugin-pwa @vitejs/plugin-pwa eslint-plugin-security` | package.json, node_modules | Low |
| 0.3 | Restore vitest config in vite.config.js | vite.config.js | Low — just re-add test block |
| 0.4 | Restore esbuild JSX config in vite.config.js | vite.config.js | Low — JSX may still work without it |
| 0.5 | Fix `db.js` — `syncAll()` must not push empty arrays | src/lib/db.js | Medium — sync is critical |
| 0.6 | Fix `crud.js` — update references to removed fields | src/lib/crud.js | Low — these are CRUD helpers |
| 0.7 | Remove or disable `vite-plugin-pwa` (decide SW strategy) | vite.config.js | Medium — user-visible |

**Verification**: `npm test` passes, `npm run build` succeeds, `npm run dev` starts

**Estimate**: 1 day

---

## PHASE 1: RESOLVE DEBT BEFORE REFACTOR (Days 2-3)

**Goal**: Clean up dead code, fix lint, fix known bugs.

| Step | Action | Files |
|---|---|---|
| 1.1 | Delete extraneous node_modules (`npm prune`) | node_modules |
| 1.2 | Fix 90 lint warnings (unused vars, missing hook deps) | ~20 files |
| 1.3 | Decide SW strategy: keep `public/sw.js` (remove vite-plugin-pwa) or vice versa | vite.config.js, public/sw.js |
| 1.4 | Import design system CSS or remove orphan files | src/index.css + src/design-system/ |
| 1.5 | Create `.env.example` with all required vars | .env.example |
| 1.6 | Fix `stripe-webhook` `\\n` bug | supabase/functions/stripe-webhook/index.ts |
| 1.7 | Add cleanup policy for `ai_cache` | supabase/migrations/ |
| 1.8 | Fix `ai_cache` RLS (add policies or remove RLS) | supabase/migrations/ |

**Verification**: Lint passes with <10 warnings, build passes, test passes

**Estimate**: 2 days

---

## PHASE 2: RESOLVE SYNC ARCHITECTURE (Days 3-5)

**Goal**: Fix the dual-sync architecture (crud.js write-through vs db.js background).

**Problem**: Both `crud.js` (write-through sync on every mutation) and `db.js` (background sync every 2 minutes) operate on the same tables with **different conflict resolution strategies**.

| Step | Action |
|---|---|
| 2.1 | Choose strategy: **write-through** (write to local + Supabase immediately) or **background** (write to local, sync in batch) |
| 2.2 | If write-through: simplify `db.js` to remove syncAll/syncTablePush/syncTablePull; keep crud.js pattern |
| 2.3 | If background: remove syncUpsert/syncUpdate/syncDelete from crud.js; keep db.js but fix the empty array bug |
| 2.4 | Ensure Dexie schema matches Supabase table columns (id, user_id, created_at, updated_at + data fields) |
| 2.5 | Add `updated_at` as an index for delta sync queries |
| 2.6 | Consider `useLiveQuery` from Dexie for reactive UI updates |

**Recommendation**: Use **write-through** for simplicity. One sync path, always consistent. Background sync adds complexity with no benefit for single-user apps. Add retry queue for offline scenarios.

**Estimate**: 3 days

---

## PHASE 3: DESIGN SYSTEM UNIFICATION (Days 5-7)

**Goal**: One token system, one CSS architecture.

| Step | Action |
|---|---|
| 3.1 | Delete `src/design-system/` (orphan, never imported) |
| 3.2 | Refactor `src/index.css`: extract primitives → semantics → components |
| 3.3 | Remove `!important` dark mode overrides (migrate Tailwind-using-components to use CSS vars) |
| 3.4 | Add CSS transition for theme switching (`body { transition: background-color .25s }`) |
| 3.5 | Fix `data-plan="premium"` to not duplicate `[data-plan="pro"]` (merge shared rules) |
| 3.6 | Remove duplicate `--plan-shadow` blocks |

**Estimate**: 2 days

---

## PHASE 4: ARCHITECTURE RE-ORGANIZATION (Days 7-10)

**Goal**: Feature-based architecture with clear boundaries.

```
src/
├── app/                 # App shell: providers, router
│   ├── App.jsx
│   └── providers.jsx
├── features/            # Feature modules
│   ├── auth/            # Login, signup, session
│   ├── transactions/    # TxView, useTx, addTx, editTx
│   ├── inventory/       # Products, losses
│   ├── reports/         # Dashboard, ReportView
│   ├── branding/        # BrandStudio, brand hooks
│   ├── admin/           # AdminPanel, client management
│   └── plans/           # PlansView, Stripe checkout
├── shared/              # Reusable primitives
│   ├── ui/              # Button, Input, Card, Modal, Toast
│   ├── layout/          # Sidebar, Header, BottomNav
│   └── hooks/           # Shared hooks (useMediaQuery, etc.)
├── lib/                 # Infrastructure
│   ├── supabase.js
│   ├── dexie.js
│   └── stripe.js
├── config/              # Constants, env
└── styles/              # Global CSS, design tokens
```

| Step | Action |
|---|---|
| 4.1 | Create `src/features/` and `src/shared/` directories |
| 4.2 | Move views + their hooks into feature folders |
| 4.3 | Move shared components (Sidebar, Header, etc.) to `src/shared/ui/` |
| 4.4 | Reorganize lib: split `db.js` into `dexie.js` (schema) + `sync.js` (sync logic) |
| 4.5 | Isolate Brand Studio behind `src/features/branding/` public API |
| 4.6 | Update imports across all files |

**Estimate**: 3 days

---

## PHASE 5: COMPONENT REWRITE (Days 10-15)

**Goal**: Modern, accessible, consistent component library.

| Component | Current State | Plan |
|---|---|---|
| Button | Inline styles + Tailwind | shadcn/ui Button with variants |
| Input | `Inp` component with inline styles | shadcn/ui Input + FormField |
| Card | Ad-hoc divs with Tailwind | Reusable Card component |
| Modal/Confirm | `useState` boolean | Compound component pattern |
| Toast | `useState` array | Toast provider + reducer |
| Sidebar | React component + CSS | shadcn/ui navigation menu |
| Badge | Inline | Badge component with variants |
| Table | Ad-hoc in each view | Sortable DataTable |

**Approach**: Install `shadcn/ui` primitives. Each primitive wraps Radix UI with Tailwind styling. This gives accessibility for free (focus management, ARIA, keyboard nav).

**Estimate**: 5 days

---

## PHASE 6: ACCESSIBILITY & UX (Days 15-18)

**Goal**: WCAG AA compliance, modern UX patterns.

| Step | Action |
|---|---|
| 6.1 | Add `htmlFor`/`id` to all form inputs (fix screen reader labels) |
| 6.2 | Add `lang="pt-BR"` to index.html |
| 6.3 | Add focus trap to Modal/Confirm |
| 6.4 | Add text labels to color-only indicators (income/expense) |
| 6.5 | Implement virtual scrolling for TxView |
| 6.6 | Add keyboard shortcuts (Cmd+K for search, etc.) |
| 6.7 | Add filter by period on Dashboard |
| 6.8 | Implement optimistic UI in transaction forms |
| 6.9 | Add loading states to individual sections (not full-screen) |

**Estimate**: 3 days

---

## PHASE 7: DOCUMENTATION PURGE (Day 18)

**Goal**: From 33 files to ~10 accurate files.

| Action | Files |
|---|---|
| Archive 5 incorrect docs | 04, 06, 07, 10, 12 .md files |
| Delete 7 duplicate/obsolete files | PRD_VISION, FRONTEND, AUDIT_REVIEW, etc. |
| Delete 4 unused templates | TEMPLATES/* |
| Merge duplicate AI brand schema | Keep only AI_BRAND_SCHEMA.json |
| Update README.md | Fix test count, remove platform claims |
| Rewrite CLAUDE.md | Reflect current state |
| Create CONTRIBUTING.md | New |
| Create CHANGELOG.md | New |

**Estimate**: 1 day

---

## PHASE 8: SECURITY HARDENING (Day 19)

| Step | Action |
|---|---|
| 8.1 | Fix magic link token leak in admin_get_magic_link |
| 8.2 | Fix impersonation password leak |
| 8.3 | Add MIME type restriction to logos bucket |
| 8.4 | Add field whitelisting to db.js |
| 8.5 | `npm audit` and fix vulnerabilities |
| 8.6 | Add security headers to deployment config |

**Estimate**: 1 day

---

## PHASE 9: TEST INFRASTRUCTURE (Days 20-22)

**Goal**: Reliable test suite that actually runs.

| Step | Action |
|---|---|
| 9.1 | Fix vitest config (add back to vite.config.js or create vitest.config.js) |
| 9.2 | Run existing tests and fix failures (db.test.js references removed sync fields) |
| 9.3 | Add MSW for API mocking |
| 9.4 | Write integration tests for critical paths: login, create transaction, sync |
| 9.5 | Configure Playwright for E2E (if needed) |

**Estimate**: 3 days

---

## PHASE 10: MODERNIZATION (Days 22-28)

**Goal**: Adopt 2026 best practices.

| Step | Action |
|---|---|
| 10.1 | Add TypeScript (incremental — rename files to .tsx one feature at a time) |
| 10.2 | Replace hash routing with React Router v7 |
| 10.3 | Add TanStack Query for server state (replace manual Supabase calls in hooks) |
| 10.4 | Add bundle analysis via `rollup-plugin-visualizer` |
| 10.5 | Set up CI/CD with proper tests, lint, build, deploy |
| 10.6 | Set up Lighthouse CI for performance budget |

**Estimate**: 6 days

---

## TOTAL: ~28 days (4 weeks)

### Dependencies between phases
```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
                                                              ↓
Phase 7 → Phase 8 → Phase 9 → Phase 10
```

Phases 7-10 can overlap with 5-6 in parallel teams.

### Risk assessment
| Phase | Risk | Mitigation |
|---|---|---|
| Phase 0 | Low | Git restore is safe |
| Phase 2 | High | Sync architecture is critical; wrong choice = rework |
| Phase 4 | Medium | Import changes touch 40+ files |
| Phase 5 | Medium | Full component rewrite; must not break existing views |
| Phase 10 | Medium | TypeScript migration requires discipline |
