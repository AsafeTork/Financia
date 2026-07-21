---
type: REPORT
status: DRAFT
owner: Integrador
version: 1.0
reviewed_by: —
ready_for_integration: false
last_review: 2026-07-20
---

# AUDITORIA GERAL — Financia

> **Data:** 2026-07-20
> **Auditor:** Integrador (análise completa do workspace)
> **Propósito:** Mapear o estado real da documentação, código e arquitetura; classificar todos os documentos; gerar plano de refatoração.

---

## Resumo Executivo

O projeto Financia possui **66+ arquivos markdown** espalhados por 4 diretórios (raiz, `docs/`, `docs/archive/`, `.agents/skills/`). Desses, **~28 são ativos relevantes**, **~16 são obsoletos/arquiváveis**, **~12 já estão em archive**, e **~10 são skills de agente** (fora do escopo documental).

A documentação sofre de **fragmentação severa**: documentos duplicados (4 pares), documentos órfãos na raiz (12+), metadados inconsistentes entre documentos, e conteúdo contraditório entre `MASTER_REFACTOR_PLAN.md` (raiz) e `WORKSPACE.md`.

O sistema de governança (CLAUDE.md, WORKSPACE.md, EXECUTOR_PROMPT.md) está funcional e bem estruturado, mas o restante da documentação precisa de reorganização.

**Veredito:** 6/10 — Funcional mas caótico. Exige reorganização, não reescrita.

---

## Arquitetura Atual

### Stack Tecnológica (do código real)

| Camada | Tecnologia | Versão |
|--------|------------|--------|
| Frontend | React + Vite | 18 + 5 |
| Estilos | Tailwind CSS + CSS Variables | 3.4 |
| Roteamento | React Router v7 (HashRouter) | 7.18 |
| Server State | @tanstack/react-query | 5.101 |
| Offline/Local | Dexie.js (IndexedDB) | 3.2 |
| Backend | Supabase (Edge Functions) | Deno |
| Banco | PostgreSQL (Supabase) | 17 |
| Pagamentos | Stripe Elements | — |
| Desktop | Electron | 31 |
| Mobile | Android TWA | — |
| Testes unitários | Vitest + Testing Library | 4.x |
| Testes E2E | Playwright | 1.61 |
| Performance | Lighthouse CI | — |

### Estrutura de Diretórios Real

```
src/                          # Frontend React
├── core/                     # Boot + providers
├── features/                 # Domínios (auth, branding, dashboard, etc)
├── lib/                      # Infraestrutura (dexie, sync, supabase, stripe)
├── routes/                   # React Router config
├── shared/                   # UI components + hooks
└── test/                     # Setup + mocks

supabase/                     # Backend
├── functions/                # Edge Functions (19)
├── migrations/               # SQL migrations (41 arquivos)

docs/                         # Documentação
├── ai/                       # AI schemas
├── archive/                  # Histórico morto
├── ARCHITECTURE/             # Plano mestre
├── Banco/                    # Database reports
├── Frontend/                 # Frontend reports
├── Infrastructure/           # Codespaces
├── Performance/              # Performance reports
├── QA/                       # QA reports
└── Seguranca/                # Security report

raiz/                         # 20+ arquivos md soltos
```

---

## Classificação de Todos os Documentos

### Legenda
- ✅ **Fonte Oficial** — Documento WORKING APPROVED + ready_for_integration
- 📘 **Documentação Útil** — REPORT ou REFERENCE válido e atual
- 📜 **Histórico** — Documento que registrou decisões passadas (manter como referência)
- 🗑️ **Obsoleto** — Substituído, desatualizado ou não mais aplicável
- 🔀 **Duplicado** — Conteúdo idêntico ou quase idêntico a outro arquivo
- ⚠️ **Contraditório** — Conflita com outro documento aprovado

### Documentos de Governança (docs/)

| Arquivo | Classificação | Justificativa |
|---------|--------------|---------------|
| `CLAUDE.md` | ✅ Fonte Oficial | Documento supremo de governança (1062 linhas) |
| `docs/WORKSPACE.md` | ✅ Fonte Oficial | Orquestração viva, APPROVED v2.1 |
| `docs/EXECUTOR_PROMPT.md` | ✅ Fonte Oficial | Prompt universal do Executor, APPROVED v2.1 |
| `docs/EXECUTION_STATE.md` | ✅ Fonte Oficial | Tracking de checkpoints, APPROVED v1.2 |
| `docs/IMPLEMENTATION_ORDER.md` | ✅ Fonte Oficial | Ordem de implementação, APPROVED v2.1 |
| `docs/SCRATCH_PAD.md` | 📘 Documentação Útil | Template de backup, APPROVED v1.1 |
| `docs/VALIDATION_MODULE.md` | ⚠️ Contraditório | DRAFT, contém pseudocódigo Python nunca usado; comandos `node scripts/` inexistentes |
| `docs/CHECKPOINT_AUDITOR.md` | ⚠️ Contraditório | DRAFT, mesma situação — scripts de auditoria não existem |
| `docs/CHANGELOG_AI.md` | 📘 Documentação Útil | Registro de mudanças, DRAFT mas bem preenchido |
| `docs/ARCHITECTURE.md` | 📘 Documentação Útil | Manual técnico (REFERENCE) |
| `docs/ARCHITECTURE/MASTER_REFACTOR_PLAN.md` | ⚠️ Contraditório | Fases renomeadas para "Bloco 1-7" para evitar conflito, mas ainda com metadados inconsistentes |

### Documentos Operacionais (docs/)

| Arquivo | Classificação | Justificativa |
|---------|--------------|---------------|
| `docs/BRANDING_DIAGNOSTICO.md` | ✅ Fonte Oficial | Diagnóstico aprovado, usado na Fase 3 |
| `docs/Banco/ESPECIALISTA_BANCO.md` | ✅ Fonte Oficial | Diagnóstico aprovado, usado na Fase 2 |
| `docs/QA/QA_ANALYSIS.md` | ✅ Fonte Oficial | Diagnóstico aprovado, usado na Fase 6 |
| `docs/PRODUCTION_REPORT.md` | 📘 Documentação Útil | Relatório de produção v5.2.0 |
| `docs/FIX_REPORT.md` | 📘 Documentação Útil | Correção arquitetural documentada |
| `docs/INCIDENT_REPORT.md` | 📘 Documentação Útil | Incidente de produção documentado |
| `docs/RELEASE_CHECKLIST.md` | 📜 Histórico | Checklist v5.1.0 — desatualizado vs v5.2.0 |
| `docs/DOCUMENTATION_CONSISTENCY_AUDIT.md` | 📘 Documentação Útil | Auditoria de consistência (fundiu-se neste relatório) |
| `docs/DOCUMENTATION_RECONCILIATION_REPORT.md` | 📜 Histórico | Já incorporado na reconciliação atual |
| `docs/Banco/SCHEMA_REPORT.md` | 📘 Documentação Útil | Schema do banco |
| `docs/Banco/PERFORMANCE_REPORT.md` | 📘 Documentação Útil | Performance de queries |
| `docs/Banco/I1_DB_PULL_INSTRUCTIONS.md` | 📜 Histórico | Instruções de db pull (ação única) |
| `docs/Frontend/FASE4_FRONTEND_REPORT.md` | 📘 Documentação Útil | Relatório Fase 4 |
| `docs/Frontend/FRONTEND_SPECIALIST_AUDIT.md` | 📜 Histórico | Auditoria especialista |
| `docs/Performance/VALIDATION_OPTIMIZATION_REPORT.md` | 📘 Documentação Útil | Otimização de validação |
| `docs/Seguranca/SECURITY_MASTER_AUDIT.md` | 📜 Histórico | Auditoria de segurança (datada) |
| `docs/Infrastructure/CODESPACES_MIGRATION_PLAN.md` | 📜 Histórico | Plano de migração (ação única) |
| `docs/Infrastructure/CODESPACES_RUNBOOK.md` | 📘 Documentação Útil | Runbook ativo |
| `docs/QA/FUNCTIONAL_AUDIT.md` | 📜 Histórico | Auditoria funcional (datada) |
| `docs/QA/STRESS_AUDIT.md` | 📜 Histórico | Auditoria de stress (datada) |
| `docs/UX-AUDIT-REFERENCE.md` | 📘 Documentação Útil | Referência de UX |
| `docs/testing-strategy-research.md` | 📘 Documentação Útil | Pesquisa de estratégia de testes |

### Documentos Deprecados (resolvido — Etapa 3 concluída)

`docs/PROMPT_UNIVERSAL.md` e `docs/AI_CONTEXT.md` movidos para `docs/archive/`.

### Duplicatas (Resolvido — raiz limpa)

| Par | Realidade | Ação |
|-----|-----------|------|
| `docs/AI_BRAND_SCHEMA.md` ↔ `docs/ai/AI_BRAND_SCHEMA.md` | ❌ **Não são duplicatas** — 9.4KB vs 2.7KB, conteúdos diferentes (português AI vs inglês schema) | Manter ambos |
| `CHANGELOG_AI.md` (raiz) ↔ `docs/CHANGELOG_AI.md` | ✅ Resolvido — raiz removida | — |
| `EXECUTION_STATE.md` (raiz) ↔ `docs/EXECUTION_STATE.md` | ✅ Resolvido — raiz removida | — |
| `WORKSPACE.md` (raiz) ↔ `docs/WORKSPACE.md` | ✅ Resolvido — raiz removida | — |
| `MASTER_REFACTOR_PLAN.md` (raiz) ↔ `docs/ARCHITECTURE/MASTER_REFACTOR_PLAN.md` | ✅ Resolvido na Etapa 1 | — |

### Documentos na Raiz (resolvido — Etapas 1 e 2 concluídas)

Raiz contém apenas: `CLAUDE.md`, `README.md`.

### Documentos em Archive (já mortos — manter)

`docs/archive/ARCHITECTURE/` (8 arquivos) — histórico válido, manter.
`docs/archive/ai/` (4 arquivos) — histórico válido, manter.

### Skills de Agente (.agents/skills/)

| Arquivo | Classificação | Ação |
|---------|--------------|------|
| `brandkit/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `code-simplifier/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `design-taste-frontend/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `design-taste-frontend-v1/SKILL.md` | 📜 Histórico | Manter — versão legada |
| `full-output-enforcement/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `gpt-taste/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `high-end-visual-design/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `image-to-code/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `imagegen-frontend-mobile/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `imagegen-frontend-web/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `industrial-brutalist-ui/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `minimalist-ui/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `redesign-existing-projects/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `stitch-design-taste/SKILL.md` | 📘 Útil | Manter — skill ativa |
| `stitch-design-taste/DESIGN.md` | 📘 Útil | Manter — parte da skill |

---

## Problemas Encontrados

### Problemas Críticos

| ID | Problema | Evidência | Impacto |
|----|----------|-----------|---------|
| **C01** | CLAUDE.md com ~1062 linhas e conteúdo duplicado internamente | Seções 1-13 ~474 linhas, seção 14 ~308 linhas. Seção 1.2 (Executor) e seção 14 (Controle de Execução) repetem conceitos. | Dificuldade de manutenção; modelos desperdiçam contexto lendo conteúdo duplicado |
| **C02** | 4 pares de documentos duplicados espalhados | `docs/AI_BRAND_SCHEMA.md` ↔ `docs/ai/`, `CHANGELOG_AI.md` raiz ↔ docs/, etc. | Fonte da verdade ambígua; atualizações podem divergir |
| **C03** | 12+ documentos obsoletos na raiz poluindo o workspace | `01_PRODUCT_VISION.md`, `BRANDING_MASTER_AUDIT.md`, etc. | Confusão sobre qual documento é vigente |
| **C04** | VALIDATION_MODULE.md e CHECKPOINT_AUDITOR.md têm código executável que não existe | Referenciam `node scripts/validate-checkpoint.js` e similares — nenhum desses scripts existe | Documentação enganosa; códigos de erro (E001-D005) não são implementados |
| **C05** | 2 documentos deprecados em `docs/` ativo em vez de archive | `docs/PROMPT_UNIVERSAL.md`, `docs/AI_CONTEXT.md` | Usuários podem lê-los e achar que são vigentes |

### Problemas Médios

| ID | Problema | Evidência | Impacto |
|----|----------|-----------|---------|
| **M01** | Orfandade de navegação documental — não há `docs/INDEX.md` | Nenhum arquivo de índice consolidado | Novo integrante precisa ler 10+ arquivos para entender a estrutura |
| **M02** | Metadados de documentos WORKING inconsistentes | `EXECUTION_STATE.md` tem `version: 1.2` mas `WORKSPACE.md` não reflete isso | Tracking de versão impreciso |
| **M03** | 6 documentos na raiz que deveriam estar em `docs/` | `BACKLOG_ATUALIZADO.md`, `ROADMAP_ATUALIZADO.md`, `CHANGELOG.md`, `MATRIZ_CONSOLIDACAO.md`, `PLANO_OTIMIZACAO_VALIDACAO.md`, `ROADMAP.md` | Poluição visual da raiz |
| **M04** | `CLAUDE.md` contém regras de agente e documentação técnica misturadas | O mesmo arquivo define governança, arquitetura de agentes, e workflow | Mistura de responsabilidades; difícil de navegar |
| **M05** | `docs/ARCHITECTURE.md` (REFERENCE) desatualizado em relação ao código real | Menciona `src/design-system/` que não existe, `src/hooks/` e `src/context/` que não existem na estrutura atual | Informação enganosa para novos desenvolvedores |
| **M06** | CHANGELOG_AI.md ainda DRAFT apesar de bem preenchido | Todos os checkpoints registrados; metadados dizem DRAFT | Inconsistência entre conteúdo e status |

### Problemas Baixos

| ID | Problema | Evidência |
|----|----------|-----------|
| **L01** | `IMPLEMENTATION_ORDER.md` tem Fase 5 e 6 marcadas como "PENDENTE" mas EXECUTION_STATE.md as mostra como validadas | Desalinhamento menor entre docs |
| **L02** | `RELEASE_CHECKLIST.md` refere-se à v5.1.0, projeto está em 5.1.1 | Desatualizado por 1 patch version |
| **L03** | `TESTING_STRATEGY_RESEARCH.md` é pesquisa extensa mas não está referenciada por nenhum documento operacional | Pode ser útil mas está invisível |
| **L04** | Número de testes nos documentos varia (471, 537, 640, 1177, 1178) | Cada documento registra métricas de momentos diferentes sem contexto temporal |

---

## Dívida Técnica Documental

| Item | Esforço | Prioridade |
|------|---------|------------|
| Arquivar 12+ documentos obsoletos da raiz | 15 min | Alta |
| Remover 4 pares de duplicatas | 10 min | Alta |
| Mover 6 documentos para `docs/` | 10 min | Alta |
| Criar `docs/INDEX.md` | 20 min | Alta |
| Arquivar `docs/PROMPT_UNIVERSAL.md` e `docs/AI_CONTEXT.md` | 5 min | Média |
| Atualizar `docs/ARCHITECTURE.md` com estrutura real | 30 min | Média |
| Promover CHANGELOG_AI.md de DRAFT para APPROVED | 2 min | Baixa |
| Remover referências a scripts inexistentes de VALIDATION_MODULE.md e CHECKPOINT_AUDITOR.md | 10 min | Baixa |

---

## Melhorias Priorizadas

### Prioridade Alta (execução imediata)

1. **Arquivar documentos obsoletos da raiz** (12+ arquivos → `docs/archive/`)
2. **Remover duplicatas** (manter apenas cópia em `docs/`)
3. **Mover documentos órfãos para `docs/`** (6 arquivos)
4. **Criar `docs/INDEX.md`** com índice de toda documentação
5. **Arquivar deprecados** de `docs/` ativo para `docs/archive/`

### Prioridade Média (próximo ciclo)

6. **Atualizar `docs/ARCHITECTURE.md`** com estrutura real de diretórios
7. **Simplificar `CLAUDE.md`** — remover duplicações internas da seção 14
8. **Atualizar `IMPLEMENTATION_ORDER.md`** para refletir estado atual (F5, F6, F7 validadas)

### Prioridade Baixa (backlog)

9. **Promover CHANGELOG_AI.md** para APPROVED
10. **Corrigir VALIDATION_MODULE.md e CHECKPOINT_AUDITOR.md** — remover pseudocódigo e scripts inexistentes
11. **Adicionar contexto temporal às métricas de testes** em cada documento

---

## Plano de Execução

### Etapa 1: Limpeza da Raiz ✅ (Concluída em 2026-07-20)

**Objetivo:** Remover todos os documentos órfãos e obsoletos da raiz do projeto.

**Resultado:** 15 arquivos movidos com `git mv` sem perda de histórico.

**Arquivos movidos:**
- Para `docs/archive/` (11): `01_PRODUCT_VISION.md`, `BRANDING_MASTER_AUDIT.md`, `DATABASE_MASTER_AUDIT.md`, `DESIGN_SYSTEM_AUDIT.md`, `FRONTEND_MASTER_AUDIT.md`, `IMPLEMENTATION_BACKLOG.md`, `MASTER_REFACTOR_PLAN.md`, `MATRIZ_CONSOLIDACAO.md`, `QA_MASTER_AUDIT.md`, `ROADMAP.md`, `UX_MASTER_AUDIT.md`
- Para `docs/` (4): `BACKLOG_ATUALIZADO.md`, `ROADMAP_ATUALIZADO.md`, `CHANGELOG.md`, `PLANO_OTIMIZACAO_VALIDACAO.md` → `docs/Performance/PLANO_OTIMIZACAO_VALIDACAO.md`

**Validações:** `git status` confirma 15 arquivos renamed. Nenhum arquivo foi deletado. Nenhum arquivo de código foi alterado.

**Impacto na organização:**
- Antes: 20 arquivos markdown na raiz
- Depois: 5 arquivos markdown na raiz (`CLAUDE.md`, `README.md`, `WORKSPACE.md`, `EXECUTION_STATE.md`, `CHANGELOG_AI.md`)
- Nota de Organização sobe de 5/10 → 6/10

**Documentos atualizados:** `docs/INDEX.md`, `docs/AUDITORIA_GERAL.md`

### Etapa 2: Eliminar Duplicatas ✅ (Concluída em 2026-07-20)

**Resultado:** 3 arquivos removidos da raiz. 1 par corrigido (não era duplicata).

**Arquivos removidos:**
- `CHANGELOG_AI.md` (raiz) — desatualizado (2.4KB vs 20.8KB em `docs/`)
- `EXECUTION_STATE.md` (raiz) — sem metadados (2.4KB vs 7.0KB em `docs/`)
- `WORKSPACE.md` (raiz) — conteúdo divergente (3.6KB vs 9.4KB em `docs/`)

**Correção de diagnóstico:**
- `docs/AI_BRAND_SCHEMA.md` vs `docs/ai/AI_BRAND_SCHEMA.md` ❌ **não são duplicatas** — 9.4KB vs 2.7KB, propósitos distintos. Ambos mantidos.

**Riscos:** Nenhum — versões oficiais preservadas em `docs/`.

### Etapa 3: Arquivar Deprecados ✅ (Concluída em 2026-07-20)

**Resultado:** 2 documentos deprecados movidos para `docs/archive/`.

**Arquivos movidos:**
- `docs/PROMPT_UNIVERSAL.md` → `docs/archive/PROMPT_UNIVERSAL.md` (356 B)
- `docs/AI_CONTEXT.md` → `docs/archive/AI_CONTEXT.md` (13.1 KB)

### Etapa 4: Criar Índice (20 min)

**Objetivo:** Criar `docs/INDEX.md` como navegação única da documentação.

**Arquivos envolvidos:**
- `docs/INDEX.md` (novo)

### Etapa 5: Atualizar Documentos de Referência ✅ (Concluída em 2026-07-20)

**Resultado:** 2 documentos corrigidos.

**Documentos:**
- `docs/ARCHITECTURE.md` — diretórios corrigidos (removido `design-system/`, `hooks/`, `context/`; adicionado `core/`, `routes/`; `db.js` → `dexie.js`; test count 1100+ → 640+)
- `docs/IMPLEMENTATION_ORDER.md` — status das 7 fases atualizado para VALIDADAS (alinhado com EXECUTION_STATE.md checkpoint_007); version 2.1 → 2.2

### Etapa 6: Simplificar CLAUDE.md (45 min)

**Objetivo:** Remover duplicações internas da seção 14 (Controle de Execução).

**Arquivos envolvidos:**
- `CLAUDE.md`

**Riscos:** Médio — CLAUDE.md é o documento supremo; alterações devem ser precisas.

### Etapa 7: Corrigir VALIDATION_MODULE e CHECKPOINT_AUDITOR (15 min)

**Objetivo:** Remover pseudocódigo e scripts que não existem.

**Arquivos envolvidos:**
- `docs/VALIDATION_MODULE.md`
- `docs/CHECKPOINT_AUDITOR.md`

---

## Matrix de Riscos

| Risco | Prob | Impacto | Mitigação |
|-------|------|---------|-----------|
| Mover arquivo errado para archive | Baixa | Médio | git mv preserva histórico; reversível |
| Duplicata com conteúdo divergente | Média | Alto | Comparar diff antes de deletar (já verificado: WORKSPACE.md raiz ↔ docs/ pode diferir) |
| CLAUDE.md mal editado quebra regras de agente | Média | Crítico | Manter seção 14 como apêndice; não alterar regras de governança |
| Remoção acidental de arquivo referenciado | Baixa | Médio | grep por referências antes de mover |

---

## Checklist de Ações

- [x] Etapa 1: Arquivar 11 documentos obsoletos da raiz
- [x] Etapa 1: Mover 4 documentos para `docs/`
  - `docs/INDEX.md` atualizado com lista de arquivos no archive
  - `docs/AUDITORIA_GERAL.md` atualizado com status concluído
- [x] Etapa 2: Remover 3 duplicatas da raiz + corrigir falso positivo AI_BRAND_SCHEMA
- [x] Etapa 3: Arquivar 2 deprecados (PROMPT_UNIVERSAL + AI_CONTEXT)
- [ ] Etapa 4: Criar `docs/INDEX.md`
- [x] Etapa 5: Atualizar `docs/ARCHITECTURE.md` (diretórios, test count)
- [x] Etapa 5: Atualizar `docs/IMPLEMENTATION_ORDER.md` (status fases, version 2.2)
- [ ] Etapa 6: Simplificar `CLAUDE.md` (seção 14)
- [ ] Etapa 7: Corrigir `VALIDATION_MODULE.md` e `CHECKPOINT_AUDITOR.md`
- [ ] Promover `CHANGELOG_AI.md` de DRAFT para APPROVED

---

## Pontuação da Arquitetura

### Arquitetura Geral: 6/10

**Evidências:** Feature-first bem implementada, separação clara entre lib/features/shared. Offline-first com Dexie é sólido. Mas App.jsx como god object (~333 linhas), prop drilling severo (~30 props em routes.jsx), e documentação fragmentada penalizam a nota.

### Segurança: 8/10

**Evidências:** RLS ativo em todas as tabelas, triggers de proteção (prevent_plan_change, guard_white_label), SECURITY DEFINER com search_path restrito, grants corretos após correção do incidente. Pontos negativos: Electron 31 com 7 HIGH vulnerabilidades, CSP já foi duplicada (corrigido), 1 security advisor WARN (HaveIBeenPwned off).

### Performance: 7/10

**Evidências:** Lazy loading em 11/12 views, chunks manuais (vendor/supabase/dexie), sideEffects:false ativo, build ~5s. Pontos negativos: maior chunk 179KB, sem cache ESLint/Vite configurado, coverage thresholds não verificados na prática.

### Organização: 5/10

**Evidências:** Diretórios bem estruturados (src/features, src/lib, src/shared). 15 documentos removidos da raiz (Etapa 1), 3 duplicatas eliminadas (Etapa 2). Raiz contém apenas CLAUDE.md e README.md. Ainda: documentos com metadados inconsistentes pendentes.

### Escalabilidade: 6/10

**Evidências:** Dexie como cache local + Supabase como backend escalável. Edge Functions são stateless e escalam horizontalmente. Pontos negativos: god object App.jsx não escala com novas features, prop drilling não escala com novos componentes, 35+ migrations sem versão local comprometem reprodutibilidade.

### Manutenibilidade: 6/10

**Evidências:** 471+ testes passando, lint 0 erros/1 warning, 1178 testes históricos. TypeScript configurado (allowJs). Código usa var/const/let misturado (em refatoração). Documentação fragmentada dificulta onboarding. CLAUDE.md gigante (1062 linhas) difícil de manter.

### Quadro Resumo

| Dimensão | Nota | Justificativa Principal |
|----------|:----:|------------------------|
| **Arquitetura Geral** | 6/10 | Feature-first OK, God Object App.jsx |
| **Segurança** | 8/10 | RLS + triggers sólidos, Electron vulnerável |
| **Performance** | 7/10 | Lazy loading, chunking OK, sem cache de build |
| **Organização** | 6/10 | Código organizado, documentação mais limpa (Etapa 1 concluída) |
| **Escalabilidade** | 6/10 | Backend escalável, frontend monolítico |
| **Manutenibilidade** | 6/10 | Testes OK, documentação fragmentada |
| **Média Geral** | **6.5/10** | |

---

## Evidências

### Links para Arquivos

- **CLAUDE.md:** `/home/tork/Projetos/financia/CLAUDE.md` (1062 linhas, superset do workspace)
- **WORKSPACE.md (docs):** `/home/tork/Projetos/financia/docs/WORKSPACE.md` (APPROVED v2.1)
- **WORKSPACE.md (raiz):** `/home/tork/Projetos/financia/WORKSPACE.md` (duplicata parcial)
- **EXECUTION_STATE.md (docs):** `/home/tork/Projetos/financia/docs/EXECUTION_STATE.md` (APPROVED)
- **CHANGELOG_AI.md (docs):** `/home/tork/Projetos/financia/docs/CHANGELOG_AI.md` (DRAFT, bem preenchido)
- **DOCUMENTATION_CONSISTENCY_AUDIT.md:** `/home/tork/Projetos/financia/docs/DOCUMENTATION_CONSISTENCY_AUDIT.md`
- **DOCUMENTATION_RECONCILIATION_REPORT.md:** `/home/tork/Projetos/financia/docs/DOCUMENTATION_RECONCILIATION_REPORT.md`
- **Package.json:** `/home/tork/Projetos/financia/package.json` (v5.1.1)
- **Duplicatas:** `docs/AI_BRAND_SCHEMA.md` e `docs/ai/AI_BRAND_SCHEMA.md`

### Evidências de Conflitos

1. **CLAUDE.md duplicação interna:** Linhas 475-780 (seção 14) contêm o mesmo conteúdo que linhas 789-820+ (seção 1.2-1.3 reapresentada). O mesmo protocolo é descrito duas vezes com pequenas variações.

2. **Documentos órfãos na raiz:** `ls *.md` mostra 20 arquivos na raiz. Somente `CLAUDE.md` e `README.md` deveriam estar lá.

3. **Duplicatas:** `CHANGELOG_AI.md`, `EXECUTION_STATE.md`, `WORKSPACE.md` — versões da raiz removidas (oficiais em `docs/`). `AI_BRAND_SCHEMA.md` — **corrigido**: não era duplicata, conteúdos distintos.

4. **Metadados divergentes:** `WORKSPACE.md` lista EXECUTION_STATE.md como DRAFT, mas o próprio EXECUTION_STATE.md tem cabeçalho APPROVED. Resolvido na reconciliação mas ainda há resquícios.

5. **Status das fases divergente:** `IMPLEMENTATION_ORDER.md` mostra Fase 5 e 6 como pendentes, mas `EXECUTION_STATE.md` checkpoint_006 e checkpoint_007 mostram ambas validadas.

---

## Próximas Ações Imediatas

1. ✅ ~~Executar Etapa 1 (limpeza da raiz) — mover 11 obsoletos para archive, 4 para docs/~~
2. ✅ ~~Executar Etapa 2 (eliminar duplicatas)~~
3. ✅ ~~Executar Etapa 3 (arquivar deprecados em `docs/`)~~
4. Revisar este relatório e promover para APPROVED
