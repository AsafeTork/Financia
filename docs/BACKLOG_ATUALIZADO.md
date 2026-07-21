# BACKLOG ATUALIZADO — Financia (Pós-Sincronização 2026-07-11)

> **Fonte:** Sincronização obrigatória — estado REAL do projeto  
> **Data:** 2026-07-11  
> **Princípio:** Apenas trabalho restante. Fases validadas REMOVIDAS.

---

## Fases Validadas (REMOVIDAS do Backlog)

| Fase | Status | Itens | Evidência |
|------|--------|-------|-----------|
| **Fase 1 — Orquestração** | ✅ VALIDADA | 8 docs de governança | WORKSPACE, CLAUDE, EXECUTOR_PROMPT v2.1, 5 docs execução |
| **Fase 2 — Banco** | ✅ VALIDADA | 14 itens (C1-C4, A1-A6, M1-M3, I1-I5) | 1178 testes, lint 0, build OK |
| **Fase 4 — Frontend** | ✅ VALIDADA | ARIA (10), Error handling (4), Code-split, var→const (24), schemaRegistry | Lighthouse ≥95, lint 0, build OK |

---

## Backlog Restante (3 Fases)

---

### FASE 3 — BRANDING (12 itens) ⏳ PRÓXIMA

| ID | Prioridade | Item | Arquivos | Critério de Aceite |
|----|------------|------|----------|-------------------|
| B-01 | 🔴 Crítico | Unificar schema: 1 formato + 1 validação | `schema.js`, `schemaRegistry.js`, `validateBrandConfig.js` | Zero duplicação; 1 import path |
| B-02 | 🔴 Crítico | Centralizar defaults: `defaults.js` único | `schema.js`, `schemaRegistry.js`, `BrandStudioView.jsx`, `LogoSchemes.jsx`, `PlanTabsEditor.jsx`, `planThemes.js` | 6 arquivos importam do mesmo `defaults.js` |
| B-03 | 🔴 Crítico | Unificar paleta: 1 lista oficial de campos de cor | `schema.js`, `schemaRegistry.js`, `PlanTabsEditor.jsx`, `useBrandAppearance.js`, `previewValidator.js` | Schema, UI, CSS vars sincronizados |
| B-04 | 🟠 Médio | Extrair logo utils: `logoUtils.js` | `LogoSchemes.jsx`, `BrandStudioView.jsx` | `generateLogoSvg`, `logoSvgToDataUrl`, `buildCheckPath` em 1 local |
| B-05 | 🟠 Médio | Separar funções puras de componente | `LogoSchemes.jsx` → `logoUtils.js` | Componentes só usam, não definem |
| B-06 | 🟠 Médio | Validação IA em `responseProcessor.js` | `responseProcessor.js` | `validateAgainstModules` chamado antes de aceitar proposta |
| B-07 | 🟠 Médio | Remover estado global mutável | `schemaRegistry.js`, `presets.js`, `useBrandAppearance.js` | `_modules`, `_userPresets`, `_savedPreviewTokens` → React Context |
| B-08 | 🟠 Médio | Fallback CSS variables explícito | Componentes Branding | `var(--brand)` com fallback inline |
| B-09 | 🟠 Médio | Unificar armazenamento esquemas | `LogoSchemes.jsx`, `presets.js` | Remover `localStorage`; usar só Dexie |
| B-10 | 🟡 Baixo | Refatorar `var` → `const/let` + spread + arrow | Todos `src/features/branding/` | `grep -r "var " src/features/branding/` → 0 resultados |
| B-11 | 🟡 Baixo | Editor `white_label` em `PlanTabsEditor.jsx` | `PlanTabsEditor.jsx`, `planThemes.js` | Aba funcional para plano white-label |
| B-12 | 🟡 Baixo | RLS awareness: `useBrandStudio.js` + `responseProcessor.js` | `useBrandStudio.js`, `responseProcessor.js` | UPDATE `brand_config` contorna policy (service_role) |

**Subagentes:** `Frontend`, `Branding`  
**Critérios globais:** `npm run lint` 0 erros, `npm run build` OK, `npm test` passa

---

### FASE 5 — SUPABASE/BACKEND (7 itens)

| ID | Prioridade | Item | Detalhes |
|----|------------|------|----------|
| S-01 | 🔴 Crítico | Edge Function: build trigger (`triggerApkBuild`) | Proxy GitHub API; token em `supabase secrets`; chamada autenticada (JWT + anon) |
| S-02 | 🔴 Crítico | Edge Function: impersonação (`admin_impersonate`) | `setSession()` em vez de `signInWithPassword`; sem senha no network tab |
| S-03 | 🔴 Crítico | Edge Function: magic link admin (`admin_get_magic_link`) | URLs via `current_setting`/secrets; sem hardcoded |
| S-04 | 🟠 Médio | RLS hardening: initPlan wrapping + SECDEF migration | 4 funções `SECURITY DEFINER` → `private` schema + wrappers `SECURITY INVOKER` |
| S-05 | 🟠 Médio | Stripe checkout: AbortController | Evita setup intents duplicados; cancelamento limpo |
| S-06 | 🟠 Médio | PWA: `setInterval` cleanup em `pwa.js` | Clear no HMR/unmount; `beforeunload` handler |
| S-07 | 🟡 Baixo | PWA: migração para `vite-plugin-pwa` (injectManifest) | Mantém `public/sw.js` lógica; + precaching assets; ~0.13KB bundle |

**Subagentes:** `Backend`, `Security`, `Database`

---

### FASE 6 — QA IMPLEMENTAÇÃO (5 itens)

| ID | Prioridade | Item | Detalhes |
|----|------------|------|----------|
| Q-01 | 🔴 Crítico | Playwright config + testes E2E | Fluxos críticos: login, transação, estoque, planos, admin |
| Q-02 | 🔴 Crítico | LHCI no CI | Lighthouse CI no GitHub Actions; thresholds: Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 90, SEO ≥ 90 |
| Q-03 | 🟠 Médio | `data-testid` em componentes complexos | `TxView`, `InventoryView`, `Dashboard`, `SettingsView`, `PlansView`, `BrandStudioView` |
| Q-04 | 🟠 Médio | MSW no setup de testes | Mock Service Worker para Supabase/Stripe chamadas; remover dependência de rede |
| Q-05 | 🟠 Médio | Thresholds coverage | `vitest.config.js`: statements 60%, branches 50%, functions 50%, lines 60% |

**Subagentes:** `QA`, `Frontend`

---

## Resumo de Esforço Estimado

| Fase | Itens | Dias Estimados | Subagentes | Dependência |
|------|-------|----------------|------------|-------------|
| **Fase 3 — Branding** | 12 | 4-5 dias | `Frontend`, `Branding` | Nenhuma (pronta para iniciar) |
| **Fase 5 — Supabase/Backend** | 7 | 3-4 dias | `Backend`, `Security`, `Database` | Após Fase 3 validada (pode rodar em paralelo) |
| **Fase 6 — QA Implementação** | 5 | 2-3 dias | `QA`, `Frontend` | Após Fase 3 validada (pode rodar em paralelo com Fase 5) |
| **Fase 7 — Integração** | 1 | 0.5 dia | `Integrador` | Fases 3, 5, 6 validadas |

**Total estimado:** 10-12 dias úteis (sequencial Fase 3 → paralelas 5+6 → 7)

---

## Próxima Ação Imediata

> **Integrador cria tarefa "Fase 3 — Branding (12 itens)" e envia ao Executor**

Executor criará subagentes `Frontend` + `Branding` e iniciará implementação.