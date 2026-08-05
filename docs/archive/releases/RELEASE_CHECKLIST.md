---
type: REPORT
---

# Release Checklist — Financia v5.1.0

**Date:** 2026-07-09
**Branch:** `refactor/v2`
**Testes:** 1178/1178 ✅ | **Lint:** 4 errors (pre-existing), 6 warnings | **Build:** OK

---

## Bundle

| Item | Status | Nota |
|------|--------|------|
| Total JS (uncompressed) | OK | 945 KB em 23 chunks |
| Total JS (gzip) | OK | ~260 KB estimado |
| Main chunk (index) | OK | 146 KB (44 KB gzip) |
| Vendor chunk | OK | 180 KB (59 KB gzip) |
| Supabase chunk | ⚠️ PENDENTE | 211 KB — maior que 200 KB recomendado |
| Tree-shaking ativo | ⚠️ PENDENTE | `sideEffects: false` ausente no package.json |
| Dependências duplicadas | OK | Nenhuma |
| Código morto no bundle | OK | Barrel exports mínimos, sem dead code significativo |
| Sourcemaps em produção | OK | Desabilitados (padrão seguro) |
| Lazy loading views | OK | 11 das 12 views lazy-loaded |
| Login eager | ⚠️ OPCIONAL | Login.jsx carregado para todos os usuários (~15 KB) |

**Bundle Score: 7/10**

---

## Dependências

| Item | Status | Nota |
|------|--------|------|
| Nenhuma dependência não utilizada | OK | depcheck limpo |
| Dependências ausentes declaradas | ⚠️ PENDENTE | `nodemailer` e `playwright` faltando |
| Vulnerabilidades de segurança | ⚠️ PENDENTE | 8 found (7 HIGH em electron, 1 MODERATE em esbuild) |
| Dependências desatualizadas (críticas) | ⚠️ PENDENTE | React 18→19, Vite 5→8, Tailwind 3→4, TS 5→7, Electron 31→43 |
| Dependências desatualizadas (moderadas) | ⚠️ OPCIONAL | eslint 9→10, dexie 3→4 |
| Patches/minors atualizáveis | ⚠️ OPCIONAL | 5 pacotes com patch disponível |

**Dependency Score: 5/10**

---

## Lighthouse (estimado)

| Métrica | Score | Nota |
|---------|-------|------|
| Performance | ⚠️ PENDENTE | ~85 (211 KB supabase chunk, sem pré-cache) |
| Accessibility | OK | ~98 (todos componentes auditados, ARIA aplicado) |
| Best Practices | OK | ~95 (CSP, HTTPS, sem console nos erros) |
| SEO | OK | ~95 (meta tags, OG, sitemap, robots.txt) |
| PWA | ⚠️ PENDENTE | ~80 (manifest ausente no HTML, SW sem pré-cache) |

*Nota: Lighthouse real depende de execução em ambiente com URL acessível.*

**Lighthouse Score: 6/10** (estimado)

---

## UX

| Item | Status | Nota |
|------|--------|------|
| Loading states (Dashboard) | OK | PageSkeleton |
| Loading states (AdminPanel) | OK | Skeletons por seção |
| Loading states (PlansView) | ⚠️ PENDENTE | Sem loading visual ao carregar subscription-status |
| Loading states (SettingsView) | ⚠️ PENDENTE | Sem loading para subscription-status |
| Empty states | OK | Dashboard exemplar, AdminPanel com Empty, demais adequados |
| Error boundaries (3 níveis) | OK | Global + Feature + Widget |
| Error boundaries em português | ⚠️ PENDENTE | Textos em inglês ("Something went wrong") |
| Offline detection | OK | useSyncLoop + Offline banner + SyncBadge |
| Offline-first (Dexie) | OK | Dados locais com sync automático |
| Keyboard navigation (atalhos) | OK | g+d, g+t, Escape fecha modais |
| Skip-to-content link | ⚠️ OPCIONAL | Ausente |
| Sidebar arrow navigation | ⚠️ OPCIONAL | Ausente |
| Animações/transições | OK | slideUp, fadeIn, scaleIn, View Transitions API |
| prefers-reduced-motion | OK | Respeitado |
| Responsivo mobile/tablet/desktop | OK | Mobile-first consistente |
| Toast/feedback system | OK | 3 tipos, auto-dismiss, aria-live |

**UX Score: 8/10**

---

## Banco (Supabase)

| Item | Status | Nota |
|------|--------|------|
| Todas tabelas com RLS | OK | 7/7 |
| Nenhuma policy ausente | OK | Todas cobertas |
| Nenhum advisor security crítico | OK | 1 warn (HaveIBeenPwned — requer Pro) |
| Nenhum advisor performance crítico | OK | 5 INFOs (unused indexes — tabelas vazias) |
| Unindexed FK (ai_cache.user_id) | ⚠️ OPCIONAL | Impacto baixo (99 linhas) |
| TO authenticated em policies | OK | Aplicado |
| (SELECT auth.uid()) initplan | OK | Aplicado |
| pg_temp em search_path SECDEF | OK | Aplicado |
| SECURITY DEFINER permissions | OK | Revogado de anon/authenticated |
| Edge Functions (18) | OK | JWT configurado exceto webhook/config |
| Storage bucket (logos) | OK | 2 MB, MIME restrito |
| Migrations (69) | OK | Todas aplicadas |

**Database Score: 9/10**

---

## Segurança

| Item | Status | Nota |
|------|--------|------|
| CSP ativa | ⚠️ PENDENTE | Duas meta tags CSP (mesclar em uma) |
| Upload MIME validation | OK | 4/4 componentes corrigidos |
| safe() sanitizer | OK | Backtick + ${} adicionados |
| JSON.parse sanitization | OK | BrandStudio, PlanTabs, LogoSchemes |
| brand.logo_url validation | OK | Sidebar, Header, Login, SettingsView |
| Senha removida clipboard/WhatsApp | OK | AdminPanel |
| registerSW cleanup | OK | Listners removíveis |
| is_admin sessionStorage | OK | UI-only, protegido por RLS |
| Missing: HaveIBeenPwned | ⚠️ PENDENTE | Requer upgrade Pro |
| Missing: Electron segurança | ⚠️ PENDENTE | 7 vulnerabilidades HIGH |

**Security Score: 7/10**

---

## Performance

| Item | Status | Nota |
|------|--------|------|
| Build time | OK | ~20s |
| Main chunk < 200 KB | OK | 146 KB |
| Supabase chunk < 200 KB | ⚠️ PENDENTE | 211 KB |
| CSS < 60 KB | OK | 52 KB |
| Lazy loading functional | OK | 11 views lazy |
| missing sideEffects:false | ⚠️ PENDENTE | Impede tree-shaking otimizado |
| manualChunks function form | OK | Vendor, supabase, dexie, query, radix, stripe |
| SW pré-cache | ⚠️ PENDENTE | Só `/` cacheado; assets on-demand |
| manifest injetado via JS | ⚠️ PENDENTE | Perde `beforeinstallprompt` |

**Performance Score: 6/10**

---

## Documentação

| Item | Status | Nota |
|------|--------|------|
| README.md atual | ⚠️ PENDENTE | Omite PWA, estrutura desatualizada |
| CHANGELOG.md | ⚠️ PENDENTE | Só versão 5.1.0, sem histórico |
| ARCHITECTURE.md | OK | Atualizado no refactor |
| AI_CONTEXT.md | OK | Header de depreciação |
| QA reports | OK | FUNCTIONAL_AUDIT.md + STRESS_AUDIT.md |
| CLAUDE.md | OK | Fonte única de regras |

**Documentation Score: 6/10**

---

## Manutenibilidade

| Item | Status | Nota |
|------|--------|------|
| ESLint 0 erros | ⚠️ PENDENTE | 4 no-undef em sync.test.js (test globals) |
| ESLint warnings controlados | OK | 6 (só exhaustive-deps) |
| TypeScript type check | OK | Passa sem erros |
| Testes unitários (1178) | OK | 21 arquivos |
| Cobertura de testes | ⚠️ OPCIONAL | Sem relatório coverage atual |
| Arquitetura feature-first | OK | features/, shared/, lib/, core/ |
| Sem barrel exports profundos | OK | Mínimo necessário |
| Sem dependências circulares | OK | Não detectado |
| package.json organizado | OK | Dependências bem segregadas |
| .gitignore adequado | OK | node_modules, dist, coverage |

**Maintainability Score: 8/10**

---

## Resumo Final

| Dimensão | Nota | Status |
|----------|:----:|--------|
| **Arquitetura** | **8/10** | Feature-first, modular, lazy loading |
| **Código** | **8/10** | Limpo, testado, sem dead code |
| **Banco** | **9/10** | RLS, índices, SECDEF, migrations — consolidado |
| **Segurança** | **7/10** | CSP duplicada, Electron vulnerável, HaveIBeenPwned off |
| **UX** | **8/10** | Offline-first sólido, acessibilidade boa, gaps menores |
| **Performance** | **6/10** | Supabase chunk grande, sem sideEffects:false, SW sem pré-cache |
| **Documentação** | **6/10** | README desatualizado, CHANGELOG incompleto |
| **Manutenibilidade** | **8/10** | Testado, lint controlado, arquitetura clara |
| **Média Geral** | **7.5/10** | **Pronto para beta. Produção requer correções.** |

---

## Ações Obrigatórias Antes de Produção

1. Mesclar CSP duplicada em `index.html` — duas meta tags divergentes
2. Adicionar `<link rel="manifest">` no HTML estático (não injetado via JS)
3. Adicionar `"sideEffects": false` no `package.json`
4. Atualizar Electron para resolver 7 vulnerabilidades HIGH
5. Adicionar `nodemailer` e `playwright` como dependências explícitas
6. Adicionar loading state em PlansView e SettingsView para subscription-status
7. Traduzir ErrorBoundary textos para português
8. Adicionar pré-cache de assets no service worker para navegação offline completa

## Ações Recomendadas (próximos sprints)

- Quebrar chunk supabase em sub-chunks (auth, realtime, storage)
- Lazy-load Login.jsx
- Adicionar skip-to-content link
- Atualizar React 18 → 19 + Vite 5 → 8 + Tailwind 3 → 4
- Gerar relatório de cobertura de testes
- Atualizar README com estrutura atual + PWA docs
- Adicionar PNG icons 192/384/512 para compatibilidade Safari/Firefox

## Opcional (sem impacto em produção)

- Remove unused indexes quando tabelas crescerem
- Reindex `ai_cache.user_id` FK index
- Sidebar arrow navigation
- Sourcemaps em produção (debug)
- Upgrade eslint 9 → 10, dexie 3 → 4
