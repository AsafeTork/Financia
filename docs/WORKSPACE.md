# WORKSPACE — Orquestração do Financia

---
type: WORKING
status: APPROVED
owner: Integrador
version: 2.1
reviewed_by: Integrador
ready_for_integration: true
last_review: 2026-07-11
dependencies: [CLAUDE.md, EXECUTOR_PROMPT.md, EXECUTION_STATE.md, SCRATCH_PAD.md, VALIDATION_MODULE.md, CHECKPOINT_AUDITOR.md, CHANGELOG_AI.md, IMPLEMENTATION_ORDER.md, MASTER_REFACTOR_PLAN.md]
next_review: 2026-07-18
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
| `docs/VALIDATION_MODULE.md` | DRAFT | Integrador | 1.0 | — | false | 1-7 |
| `docs/CHECKPOINT_AUDITOR.md` | DRAFT | Integrador | 1.0 | — | false | 1-7 |
| `docs/CHANGELOG_AI.md` | DRAFT | Integrador | 1.0 | — | false | 1-7 |

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
| Fase 3 | ⏳ **BRANDING** | 12 itens P1-P12 aguardando implementação | Fase 1 |
| Fase 4 | ✅ **FRONTEND** | ARIA, Error handling, Code-split, var→const, schemaRegistry simplificado | Fase 1 |
| Fase 5 | ⏳ **SUPABASE/BACKEND** | Edge Functions, RLS, Stripe, PWA — aguardando | Fase 1 |
| Fase 6 | ⏳ **QA** | Playwright, LHCI, MSW, thresholds — aguardando | Fase 1 |
| Fase 7 | ⏳ **INTEGRAÇÃO** | Bloqueada até F3, F5, F6 concluídas | Fases 3, 5, 6 |

- **Build:** ❌ Falhando (null char em `src/lib/utils.js:207`)
- **Lint:** 1 erro, 14 warnings
- **Testes:** 612 passed, 28 failed (640 total, 132s)
- **Documentos:** 33 ativos em `docs/`, 12 em `docs/archive/`

---

## 4. Bloqueios Atuais

1. **Build quebrado** — Caractere nulo em `src/lib/utils.js:207` impede build de produção
2. **Fase 3 aguarda tarefa de implementação** — Branding (12 itens) pronto para iniciar
3. **Fase 5 aguarda tarefa de implementação** — Supabase/Backend pronto para iniciar
4. **Fase 6 aguarda tarefa de implementação** — QA implementação pronto para iniciar
5. **SCRATCH_PAD.md, VALIDATION_MODULE.md, CHECKPOINT_AUDITOR.md, CHANGELOG_AI.md** — DRAFT, precisam ser promovidos a APPROVED
6. **Lint com 1 erro e 14 warnings** — Precisa de correção em `src/lib/utils.js` + unused vars nos testes

---

## 5. Conflitos Identificados

| Conflito | Impacto | Envolvidos | Status |
|----------|---------|-----------|--------|
| MASTER_REFACTOR_PLAN.md fases ≠ WORKSPACE.md fases | Roadmap ambíguo | Integrador | ✅ Resolvido (reconciliado) |
| Documentos citam ~1177 testes, real ~640 | Métricas falsas | Todos | ✅ Resolvido (atualizado) |
| Docs dizem build OK, build falha | Info incorreta | Integrador | ⚠️ Build quebrado (pendente correção) |
| Docs dizem lint 0 erros, real 1 erro+14 warnings | Info incorreta | Integrador | ⚠️ Pendente correção |

---

## 6. Riscos

- Fases 3, 5, 6 pendentes → Fase 7 bloqueada
- 35 migrations sem versão local → banco não reproduzível
- 4 issues críticas Branding + 20 QA não no plano → retrabalho
- Dependência de Executor para implementação → gargalo único

---

## 7. Próximas Ações

1. Corrigir build (null char em `src/lib/utils.js:207`)
2. Corrigir lint (1 erro + 14 warnings unused vars)
3. Promover SCRATCH_PAD.md, VALIDATION_MODULE.md, CHECKPOINT_AUDITOR.md, CHANGELOG_AI.md para APPROVED ou arquivar
4. Criar tarefa de implementação **Fase 3 — Branding** e enviar ao Executor
5. Executor cria subagentes `Frontend`, `Branding` e implementa 12 itens
6. Após F3, iniciar Fase 5 (Supabase/Backend) e Fase 6 (QA) em paralelo
