---
type: REFERENCE
---

# Índice da Documentação — Financia

> Navegação única para toda a documentação do projeto.
> Atualizado em: 2026-07-20

---

## Documentos de Governança (WORKING — Fonte Oficial)

| Documento | Descrição | Status |
|-----------|-----------|--------|
| `../CLAUDE.md` | Protocolo global de agentes. Regra suprema do workspace. | ✅ Vigente |
| `WORKSPACE.md` | Orquestração viva: fases, stack, estrutura, estado atual | ✅ APPROVED |
| `EXECUTOR_PROMPT.md` | Prompt universal do Executor (v2.1) | ✅ APPROVED |
| `EXECUTION_STATE.md` | Checkpoint tracking de todas as execuções | ✅ APPROVED |
| `IMPLEMENTATION_ORDER.md` | Ordem de implementação por fase | ✅ APPROVED |
| `SCRATCH_PAD.md` | Backup de estado para recuperação entre modelos | ✅ APPROVED |
| `CHANGELOG_AI.md` | Registro imutável de mudanças dos agentes | 📝 DRAFT |
| `ARCHITECTURE/MASTER_REFACTOR_PLAN.md` | Plano mestre de refatoração | 📝 DRAFT |
| `VALIDATION_MODULE.md` | Regras de validação de checkpoint | 📝 DRAFT |
| `CHECKPOINT_AUDITOR.md` | Auditoria de checkpoints | 📝 DRAFT |
| `BRANDING_DIAGNOSTICO.md` | Diagnóstico da área de Branding | ✅ APPROVED |
| `Banco/ESPECIALISTA_BANCO.md` | Diagnóstico do banco de dados | ✅ APPROVED |
| `QA/QA_ANALYSIS.md` | Análise de QA | ✅ APPROVED |

## Arquitetura e Referência Técnica (REFERENCE)

| Documento | Descrição |
|-----------|-----------|
| `ARCHITECTURE.md` | Manual técnico completo do sistema |
| `ai/AI_BRAND_SCHEMA.md` | Schema de branding para AI (formato modular) |
| `ai/AI_BEST_PRACTICES.md` | Boas práticas para agentes AI |
| `UX-AUDIT-REFERENCE.md` | Padrões e referências de UX |
| `testing-strategy-research.md` | Pesquisa de estratégia de testes |

## Relatórios por Área (REPORT)

### Banco de Dados

| Documento | Descrição |
|-----------|-----------|
| `Banco/SCHEMA_REPORT.md` | Schema do banco |
| `Banco/PERFORMANCE_REPORT.md` | Performance de queries |
| `Banco/I1_DB_PULL_INSTRUCTIONS.md` | Instruções para db pull |

### Frontend

| Documento | Descrição |
|-----------|-----------|
| `Frontend/FASE4_FRONTEND_REPORT.md` | Relatório da Fase 4 (Frontend) |
| `Frontend/FRONTEND_SPECIALIST_AUDIT.md` | Auditoria especialista Frontend |

### QA e Performance

| Documento | Descrição |
|-----------|-----------|
| `QA/FUNCTIONAL_AUDIT.md` | Auditoria funcional |
| `QA/STRESS_AUDIT.md` | Auditoria de stress |
| `Performance/VALIDATION_OPTIMIZATION_REPORT.md` | Otimização de validação |
| `Performance/PLANO_OTIMIZACAO_VALIDACAO.md` | Plano de otimização de validação (português) |

### Segurança

| Documento | Descrição |
|-----------|-----------|
| `Seguranca/SECURITY_MASTER_AUDIT.md` | Auditoria de segurança |

### Operações

| Documento | Descrição |
|-----------|-----------|
| `Infrastructure/CODESPACES_MIGRATION_PLAN.md` | Plano de migração Codespaces |
| `Infrastructure/CODESPACES_RUNBOOK.md` | Runbook Codespaces |

## Relatórios Gerais (REPORT — raiz de docs/)

| Documento | Descrição |
|-----------|-----------|
| `PRODUCTION_REPORT.md` | Relatório de produção v5.2.0 |
| `FIX_REPORT.md` | Correção arquitetural (RLS + grants) |
| `INCIDENT_REPORT.md` | Incidente de produção (salvamento bloqueado) |
| `RELEASE_CHECKLIST.md` | Checklist de release v5.1.0 |
| `DOCUMENTATION_CONSISTENCY_AUDIT.md` | Auditoria de consistência documental |
| `DOCUMENTATION_RECONCILIATION_REPORT.md` | Relatório de reconciliação documental |
| `BACKLOG_ATUALIZADO.md` | Backlog atual do projeto |
| `ROADMAP_ATUALIZADO.md` | Roadmap atual |
| `CHANGELOG.md` | Changelog do projeto (humano) |
| `AUDITORIA_GERAL.md` | **Esta auditoria** |
| `IMPLEMENTACAO_ETAPA_1.md` | Relatório da Etapa 1 (limpeza da raiz) |
| `IMPLEMENTACAO_ETAPA_2.md` | Relatório da Etapa 2 (eliminar duplicatas) |

## Skills de Agente (.agents/skills/)

| Skill | Descrição |
|-------|-----------|
| `brandkit` | Geração de brand kit premium |
| `code-simplifier` | Simplificação de código |
| `design-taste-frontend` | Frontend com bom gosto visual |
| `full-output-enforcement` | Geração completa sem truncamento |
| `gpt-taste` | UX/UI + GSAP Motion |
| `high-end-visual-design` | Design visual de alto nível |
| `image-to-code` | Imagem para código |
| `imagegen-frontend-web` | Geração de imagens web |
| `imagegen-frontend-mobile` | Geração de imagens mobile |
| `industrial-brutalist-ui` | UI industrial brutalista |
| `minimalist-ui` | UI minimalista |
| `redesign-existing-projects` | Redesign de projetos existentes |
| `stitch-design-taste` | Semantic Design System para Google Stitch |

## Arquivo Morto (docs/archive/)

> Documentos históricos mantidos para referência. Não utilizar para decisões atuais.

- `ARCHITECTURE/` — 8 documentos de arquitetura da fase refactor/v2
- `ai/` — 4 documentos de especificação AI antigos
- `01_PRODUCT_VISION.md` — visão inicial do refactor/v2 (obsoleto)
- `BRANDING_MASTER_AUDIT.md` — auditoria antiga, substituída por BRANDING_DIAGNOSTICO.md
- `DATABASE_MASTER_AUDIT.md` — auditoria antiga, substituída por docs/Banco/
- `DESIGN_SYSTEM_AUDIT.md` — auditoria antiga do design system
- `FRONTEND_MASTER_AUDIT.md` — auditoria antiga, substituída por docs/Frontend/
- `IMPLEMENTATION_BACKLOG.md` — backlog PHASE 0-10 antigo
- `MASTER_REFACTOR_PLAN.md` — plano antigo da raiz, substituído por docs/ARCHITECTURE/MASTER_REFACTOR_PLAN.md
- `MATRIZ_CONSOLIDACAO.md` — matriz de consolidação do refactor/v2
- `QA_MASTER_AUDIT.md` — auditoria antiga, substituída por docs/QA/
- `ROADMAP.md` — roadmap PHASE 0-10 antigo
- `UX_MASTER_AUDIT.md` — auditoria antiga, substituída por UX-AUDIT-REFERENCE.md

---

## Mapa de Dependências

```
CLAUDE.md (supremo)
  └── WORKSPACE.md (orquestração)
        ├── EXECUTOR_PROMPT.md (execução)
        ├── IMPLEMENTATION_ORDER.md (fases)
        ├── EXECUTION_STATE.md (checkpoints)
        ├── SCRATCH_PAD.md (backup)
        ├── VALIDATION_MODULE.md (validação)
        ├── CHECKPOINT_AUDITOR.md (auditoria)
        ├── CHANGELOG_AI.md (histórico)
        ├── BRANDING_DIAGNOSTICO.md (branding)
        ├── Banco/ESPECIALISTA_BANCO.md (banco)
        └── QA/QA_ANALYSIS.md (qualidade)
              └── Documentos REPORT (relatórios por área)
```

---

## Legenda de Status

| Status | Significado |
|--------|-------------|
| ✅ APPROVED | Aprovado, pronto para integração |
| 📝 DRAFT | Em elaboração, não usar como fonte oficial |
| 🔄 REVIEW | Em revisão |
| 📜 ARCHIVE | Histórico, não usar |
