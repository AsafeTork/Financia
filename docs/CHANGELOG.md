# Changelog

## [5.2.1] — 2026-08-05

### Docs & Governance Reorganization

- AGENTS.md created as canonical protocol (padrão agents.md, Linux Foundation)
- CLAUDE.md reduced to pointer → AGENTS.md
- AUTONOMY.md created — agent autonomy guide (decision cycle, P0-P3 prioritization)
- DECISIONS.md created — ADR-lite with 15 architectural decisions
- AGENT_GUIDE.md rewritten — verification-first workflow, adversarial review
- TEMPLATES/ created — commit, bug report, feature request, area report templates
- BEST_PRACTICES/ created — code patterns (React, CSS, TS) + UX/UI patterns (WCAG, mobile, dark mode)
- Docs reorganized: 92 → 31 active + 61 archived in 5 thematic subdirs
- supabase/AGENTS.md created — nested rules for RLS/EF/migrations

### Enforcement Layer

- Pre-commit hook: blocks commit if validate:fast + anti-patterns + docs drift fail
- Anti-pattern detection script (10 patterns): bare auth.uid(), hex colors, console.log, fail-open rate limits, impersonation tokens in localStorage, etc.
- Docs drift detection script: warns when code changes but docs not updated
- Docs health check CI job: detects orphaned docs, stale frontmatter, broken references
- .claude/settings.json: auto-allow safe commands (npm, git, lint, test)

### Performance & CI

- Vitest 4 config fixed (poolOptions → top-level, invalid reporter removed)
- Playwright removed from unit tests (moved to E2E workflow)
- 14 failing tests resolved
- React.memo added to 8 components
- Context split + route-level rendering for performance
- Callbacks memoized in TxView

### UI Design System

- Montserrat/Inter/JetBrains fonts applied
- All hardcoded values → CSS vars in 20+ files
- Motion tokens (easing, duration, stagger) from design system
- GSAP not installed — motion via CSS + useScrollReveal

## [5.2.0] — 2026-07-09

### Production Hardening

- CSP: merged duplicate meta tags into single policy
- Manifest: moved from JS injection to static `<link rel="manifest">`
- Service Worker: added asset precaching for offline navigation
- Security: duplicate CSP fixed, added MIME validation for uploads
- ErrorBoundary: translated all messages to Portuguese (pt-BR)
- Loading states: added loading indicators for subscription-status in PlansView and SettingsView
- Performance: split supabase into sub-chunks (auth, db, realtime, storage)
- Dependencies: added `nodemailer` and `playwright` explicitly; ran `npm audit fix`
- Side effects: added `"sideEffects": false` to package.json for tree-shaking
- Bundle: `build.target: 'esnext'`, supabase chunk 211KB → sub-chunks

## [5.1.1] — 2026-07-11

### Fase 3 — Branding (VALIDADA)

- **Data**: 2026-07-11
- **Métricas**: -705 linhas (-25%), 2 arquivos removidos (schemaRegistry.js, normalizer não existia)
- **schemaRegistry.js**: 703 linhas → REMOVIDO (zero consumidores externos)
- **useBrandStudio**: 262 → 102 linhas (-61%)
- **Schema único**: schema.js como fonte da verdade
- **API pública**: validateBrandConfig(config) preservada
- **Funcionalidades mantidas**: White-label, Brand Studio, Preview, Persistência, Plan overrides
- **Redução complexidade**: 3 schemas concorrentes → 1; plugin system morto removido; history/undo/redo/AI proposal/preset UI removidos

## [5.1.0] — 2026-07-08

### Refatoração v2 (Fases 0-8)

- F0: Backup + baseline (1113 tests)
- F1: Correções críticas (RLS, ErrorBoundary, fake-indexeddb)
- F2: Dead code (lucide-react removido, 29MB)
- F3: Branding simplificado
- F4: App.jsx refactor (rotas, providers, boot extraídos)
- F5: Performance (manualChunks, deps mortas, build ~38s)
- F6: Testes expandidos (1178 tests)
- F7: Documentação (ARCHITECTURE.md, CLAUDE.md)
- F8: UX (Toast animations, aria-labels)
- QA: 68 issues corrigidos (DB, security, race conditions, a11y, lint)
