# WORKSPACE — Orquestração do Financia

---
type: WORKING
status: APPROVED
owner: Integrador
version: 2.3
reviewed_by: Integrador
ready_for_integration: true
last_review: 2026-08-01
next_review: 2026-08-08
---

---

## 1. Arquitetura de Agentes

### Chats Permanentes

| Chat | Responsabilidade |
|------|-----------------|
| **Integrador** (este chat) | Governança, planejamento, consolidação, validação, aprovação |
| **Executor** (chat separado) | Único que implementa. Cria subagentes temporários. **Não pesquisa novamente, não reabre diagnósticos, só executa.** |

### Subagentes Temporários

Criados pelo Executor conforme necessário. Cada um atua em UMA área:

`Frontend` | `Backend` | `Database` | `QA` | `Performance` | `Security` | `UX` | `Accessibility` | `Documentation` | `Branding` | `CI/CD` | `PWA` | `Electron` | `Research` | `Architecture Review`

**Entregáveis por área:**
| Subagente | Entregáveis |
|-----------|-------------|
| Database | migrations, SQL, índices, triggers, RLS, testes SQL |
| Backend | Edge Functions, APIs, autenticação, integração |
| Frontend | React, UX, acessibilidade, Playwright |
| Security | revisão exclusiva do diff, análise de riscos, validação permissões |
| Performance | bundle, profiler, Lighthouse, métricas |
| QA | testes, regressões, browser, stress |
| Reviewer | revisão do diff final, qualidade, consistência |

**Regras dos Subagentes:**
- Responsabilidade **única** (apenas uma área)
- Ciclo de vida limitado a uma tarefa
- **Não são consultores — produzem entregáveis**
- Obrigação de pesquisar profundamente antes de agir
- Obrigação de produzir relatório da alteração
- Obrigação de auto-revisão
- Nunca modificam área de outro subagente

---

## 2. Estrutura de Documentos

### WORKING (bloqueiam integração)

| Documento | status | owner | version | reviewed_by | ready | Fase |
|-----------|--------|-------|---------|-------------|-------|------|
| `docs/WORKSPACE.md` | APPROVED | Integrador | 2.1 | Integrador | true | 1 |
| `docs/ARCHITECTURE/MASTER_REFACTOR_PLAN.md` | DRAFT | Integrador | 1.1 | — | false | 1-7 |
| `docs/BRANDING_DIAGNOSTICO.md` | APPROVED | subagente Branding | 1.0 | auto+segunda | true | 3 |
| `docs/Banco/ESPECIALISTA_BANCO.md` | APPROVED | subagente Database | 1.0 | Integrador | true | 2 |
| `docs/QA/QA_ANALYSIS.md` | APPROVED | subagente QA | 1.0 | — | true | 6 |
| `docs/EXECUTOR_PROMPT.md` | APPROVED | Integrador | 2.1 | Integrador | true | 1 |
| `docs/WORKSPACE.md` | APPROVED | Integrador | 2.1 | Integrador | true | 1 |
| `docs/ARCHITECTURE/MASTER_REFACTOR_PLAN.md` | APPROVED | Integrador | 2.0 | Integrador | true | 1-7 |
| `docs/BRANDING_DIAGNOSTICO.md` | APPROVED | subagente Branding | 1.0 | auto+segunda | true | 3 |
| `docs/Banco/ESPECIALISTA_BANCO.md` | APPROVED | subagente Database | 1.0 | Integrador | true | 2 |
| `docs/QA/QA_ANALYSIS.md` | APPROVED | subagente QA | 1.0 | — | true | 6 |
| `docs/EXECUTOR_PROMPT.md` | APPROVED | Integrador | 2.1 | Integrador | true | 1 |
| `docs/EXECUTION_STATE.md` | APPROVED | Integrador | 1.1 | Integrador | true | 1-7 |
| `docs/SCRATCH_PAD.md` | DRAFT | Integrador | 1.0 | — | false | 1-7 |
| `docs/VALIDATION_MODULE.md` | APPROVED | Integrador | 1.1 | Integrador | true | 1-7 |
| `docs/CHECKPOINT_AUDITOR.md` | APPROVED | Integrador | 1.1 | Integrador | true | 1-7 |
| `docs/CHANGELOG_AI.md` | APPROVED | Integrador | 1.1 | Integrador | true | 1-7 |

### REPORT (não bloqueiam)

| Documento | owner | Conteúdo |
|-----------|-------|----------|
| `docs/QA/FUNCTIONAL_AUDIT.md` | subagente QA | 21 findings funcionais (P1-P3) |
| `docs/QA/STRESS_AUDIT.md` | subagente QA | 47 findings estresse/segurança |
| `docs/PRODUCTION_REPORT.md` | Executor | O que foi corrigido no refactor/v2 |
| `docs/INCIDENT_REPORT.md` | Executor | Bugs de produção (RLS recursion) |
| `docs/FIX_REPORT.md` | Executor | Correção arquitetural aplicada |
| `docs/RELEASE_CHECKLIST.md` | Executor | Checklist v5.1.0 |
| `docs/Banco/SCHEMA_REPORT.md` | subagente Database | Schema do banco |
| `docs/Banco/PERFORMANCE_REPORT.md` | subagente Database | Performance de queries |
| `docs/Banco/I1_DB_PULL_INSTRUCTIONS.md` | subagente Database | Instruções db pull |
| `docs/Frontend/FASE4_FRONTEND_REPORT.md` | subagente Frontend | Relatório Fase 4 |
| `docs/Frontend/FRONTEND_SPECIALIST_AUDIT.md` | subagente Frontend | Auditoria Frontend |
| `docs/Performance/VALIDATION_OPTIMIZATION_REPORT.md` | Executor | Otimização de validação |
| `docs/Seguranca/SECURITY_MASTER_AUDIT.md` | subagente Security | Auditoria de segurança |
| `docs/DOCUMENTATION_CONSISTENCY_AUDIT.md` | Integrador | Auditoria de consistência documental |

### REFERENCE (não bloqueiam)

| Documento | Conteúdo |
|-----------|----------|
| `docs/ARCHITECTURE.md` | Manual técnico e arquitetura |
| `docs/UX-AUDIT-REFERENCE.md` | Padrões de UX |
| `docs/testing-strategy-research.md` | Pesquisa de estratégia de testes |
| `docs/AI_BRAND_SCHEMA.md` | Schema de branding para AI |
| `docs/ai/AI_BRAND_SCHEMA.md` | Schema de branding (duplicata de raiz) |
| `docs/ai/AI_BEST_PRACTICES.md` | Boas práticas AI |
| `docs/PROMPT_UNIVERSAL.md` | Prompt universal (deprecated, substituído por EXECUTOR_PROMPT.md) |
| `docs/AI_CONTEXT.md` | Contexto AI (deprecated) |

### ARCHIVE (histórico, não contam)

`docs/archive/ARCHITECTURE/` — 8 documentos obsoletos.
`docs/archive/ai/` — 4 documentos obsoletos.

---

## 3. Fases

```
FASE 1: ORQUESTRAÇÃO      ← Integrador (WORKSPACE + CLAUDE + EXECUTOR_PROMPT v2.1 + Governança v2.1)
FASE 2: BANCO              ← Executor → subagente Database
FASE 3: BRANDING           ← Executor → subagente Branding
FASE 4: FRONTEND           ← Executor → subagente Frontend
FASE 5: SUPABASE           ← Executor → subagente (Backend/Database)
FASE 6: QA                 ← Executor → subagente QA
FASE 7: INTEGRAÇÃO         ← Integrador
```

### Dependências

```
FASE 1 → FASE 2, FASE 3, FASE 4, FASE 5, FASE 6
              ↘               ↙
            FASE 7 (INTEGRAÇÃO)
```

Cada fase segue o workflow v2.1:
1. Integrador cria tarefa fechada → envia ao Executor
2. Executor cria subagentes necessários
3. Cada subagente: **NÃO pesquisa novamente** (usa diagnósticos APPROVED) → implementa → auto-revisa → relata
4. Executor consolida + revisão cruzada + valida build/lint/test
5. Executor entrega ao Integrador COM EVIDÊNCIAS
6. Integrador valida e aprova

### Estado Atual

| Fase | Status | Descrição | Depende de |
|------|--------|-----------|------------|
| Fase 1 | ✅ **ORQUESTRAÇÃO** | WORKSPACE, CLAUDE, EXECUTOR_PROMPT v2.1, docs de execução criados | Nenhuma |
| Fase 2 | ✅ **BANCO** | 14 itens (C1-C4, A1-A6, M1-M3, I1-I5) implementados e testados | Fase 1 |
| Fase 3 | ✅ **BRANDING** | 12 itens P1-P12 implementados: schema unificado, defaults centralizados, logo utils, estado mutável removido, validação responseProcessor, CSS vars fallback, plan themes, modernização código, storage unificado, dead code removido | Fase 1 |
| Fase 4 | ✅ **FRONTEND** | ARIA, Error handling, Code-split, var→const, schemaRegistry simplificado | Fase 1 |
| Fase 5 | ✅ **SUPABASE/BACKEND** | PR-01 a PR-05 + EF-03 + EF-05 + Stripe Refactor concluídos e testados | Fase 1 |
| Fase 6 | ✅ **QA** | Playwright E2E, LHCI, MSW, thresholds 60/50/50/60, PWA offline, IndexedDB recovery, multi-tab sync, Stripe Elements, screen reader (Guidepup), memory leak — todos implementados | Fase 1 |
| Fase 8 | ✅ **FINALIZAÇÃO** | Correções de segurança Supabase, 12 Edge Functions deployadas, docs promovidos para APPROVED | Fase 7 |
| **Fase 9** | 🔴 **BACKEND SECURITY FIXES** | **NOVA FASE** - Correções críticas do REPORT_FINANCIA_BACKEND.md: storage RLS initPlan, ai_cache dead policies, admin-set-custom-price duplicate, migrações não trackeadas, tokens impersonation, rate limiting | Fase 8 |

- **Build:** ✅ Passando
- **Lint:** ✅ 0 erros, 1 warning (pre-existing)
- **Testes:** ✅ 471+ passed (core)
- **Supabase Security:** ⚠️ **12/12 advisories resolvidos MAS 4 gaps críticos novos** (storage RLS, ai_cache RLS, impersonation, rate limiting)
- **Edge Functions:** ✅ 12 deployadas (0→12)
- **Edge Functions pendentes:** 8 (admin-impersonate, get-payment-method, set-default-payment-method, remove-payment-method, send-custom-email, update-brand-config, ai, trigger-apk-build, admin-job-runner)
- **Site:** ✅ Online em https://financiabr.me
- **Documentos:** 36 ativos em `docs/`, 12 em `docs/archive/`
- **Migrações:** ⚠️ **57 no DB vs 22 no disco — 35 não trackeadas (risco disaster recovery)**

---

## 4. Bloqueios Atuais

**Fase 9 — Backend Security Fixes** — Bloqueia declaração de projeto finalizado.

| Item | Severidade | Fonte | Status |
|------|-----------|-------|--------|
| Storage RLS policies sem `(SELECT auth.uid())` → 19x slowdown | CRÍTICA | REPORT_FINANCIA_BACKEND.md | Pendente |
| `ai_cache` RLS policies mortas (4 policies) — service_role bypassa | CRÍTICA | REPORT_FINANCIA_BACKEND.md | Pendente |
| `admin-set-custom-price` código duplicado (2 handlers + 2 Deno.serve) | CRÍTICA | REPORT_FINANCIA_BACKEND.md | Pendente |
| 35 migrações não trackeadas (57 DB vs 22 disco) | CRÍTICA | REPORT_FINANCIA_BACKEND.md | Pendente |
| Impersonation tokens em URL hash (browser history, logs) | ALTA | REPORT_FINANCIA_BACKEND.md | Pendente |
| Rate limiting ausente em 6+ Edge Functions públicas | ALTA | REPORT_FINANCIA_BACKEND.md | Pendente |
| `brand_config` column ausente no DB live (schema drift) | MÉDIA | REPORT_FINANCIA_BACKEND.md | Pendente |
| 4 colunas `custom_price_cents` deveriam ser `jsonb` | MÉDIA | REPORT_FINANCIA_BACKEND.md | Pendente |

---

## 5. Pendências Baixa Prioridade

| Item | Severidade | Responsável |
|------|-----------|-------------|
| Habilitar leaked password protection no dashboard Supabase Auth | Baixa | Administrador |
| Deploy 8 Edge Functions restantes (admin-impersonate, get-payment-method, etc) | Baixa | Executor |

---

## 6. Conflitos Identificados

| Conflito | Impacto | Envolvidos | Status |
|----------|---------|-----------|--------|
| MASTER_REFACTOR_PLAN.md fases ≠ WORKSPACE.md fases | Roadmap ambíguo | Integrador | ✅ Resolvido (reconciliado) |
| Documentos citam ~1177 testes, real ~640 | Métricas falsas | Todos | ✅ Resolvido (atualizado) |
| **WORKSPACE.md v2.1 declarava "projeto finalizado" vs REPORT_FINANCIA_BACKEND.md v1.0 achados críticos** | **Bloqueia release** | **Integrador** | **✅ Resolvido — WORKSPACE.md movido para REVIEW v2.2, Fase 9 criada** |

---

## 7. Riscos

**Riscos ativos da Fase 9:**
- Storage RLS performance 19x degradação afeta todos uploads/downloads de logos
- Migrações não trackeadas = impossível disaster recovery
- Impersonation tokens expostos = account takeover via URL history
- Rate limiting ausente = abuso de API Stripe, custos financeiros

---

## 8. Próximas Ações

1. **Fase 9.1:** Fix storage RLS initPlan (4 policies) — migration + deploy
2. **Fase 9.2:** Drop dead `ai_cache` RLS policies (4 policies) — migration
3. **Fase 9.3:** Fix `admin-set-custom-price` duplicate code — Edge Function update
4. **Fase 9.4:** `supabase db pull` para capturar 35 migrações não trackeadas
5. **Fase 9.5:** Impersonation flow redesign — short-lived tokens, HTTP-only cookies
6. **Fase 9.6:** Add rate limiting to 6+ public Edge Functions
7. **Fase 9.7:** Add missing `brand_config` column + consolidate `custom_price_cents` → jsonb
8. **Fase 9.8:** Validar tudo: build, lint, testes, Lighthouse, security audit
9. Promover WORKSPACE.md para APPROVED v2.3
10. Declarar projeto finalizado (se Fase 9 passar)
