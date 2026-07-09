# Changelog

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
