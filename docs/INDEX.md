# Índice da Documentação — Financia

> Navegação única para toda a documentação do projeto.
> Reorganizado em: **2026-08-05**

──────────────────────────────────────

## Governança (leia primeiro)

| Documento | Descrição |
|-----------|-----------|
| `../AGENTS.md` | **Protocolo canônico v3.1** (padrão agents.md) — regras supremas |
| `../CLAUDE.md` | Ponteiro para AGENTS.md (compatibilidade Claude Code) |
| `../supabase/AGENTS.md` | Regras aninhadas de Edge Functions/migrations/RLS |
| `WORKSPACE.md` | **Estado vivo** — o que está feito, backlog priorizado |
| `AGENT_GUIDE.md` | Manual operacional: verificação-first, subagentes, evidências |
| `DECISIONS.md` | Registro de decisões arquiteturais (ADR-lite, append-only) |

## Referência Técnica

| Documento | Descrição |
|-----------|-----------|
| `../README.md` | Visão humana do projeto, arquitetura, screenshots |
| `ARCHITECTURE.md` | Manual técnico do sistema |
| `CI_CD.md` | Pipeline GitHub Actions + deploy Render |
| `DEPLOY_SECRETS.md` | Segredos e variáveis de ambiente |
| `CHANGELOG.md` | Changelog humano por release |
| `../VISUAL_IDENTITY.md` | Fonte oficial da identidade visual |
| `../CANVA_AI_PROMPT.md` | Prompt Canva AI para assets de marca |
| `../CI_REPORT.md` | Relatório de CI (gerado automaticamente — não editar) |
| `UX-AUDIT-REFERENCE.md` | Padrões e referências de UX |
| `testing-strategy-research.md` | Pesquisa de estratégia de testes |
| `ai/AI_BRAND_SCHEMA.md` | Schema JSON do Brand Studio para AI |
| `ai/AI_BEST_PRACTICES.md` | Boas práticas para agentes AI |

## Relatórios por Área

| Área | Documentos |
|------|-----------|
| **Backend** | `Backend/REPORT_FINANCIA_BACKEND.md` |
| **Banco** | `Banco/ESPECIALISTA_BANCO.md`, `SCHEMA_REPORT.md`, `PERFORMANCE_REPORT.md`, `I1_DB_PULL_INSTRUCTIONS.md` |
| **Frontend** | `Frontend/FRONTEND_SPECIALIST_AUDIT.md`, `FASE4_FRONTEND_REPORT.md` |
| **QA** | `QA/QA_ANALYSIS.md`, `FUNCTIONAL_AUDIT.md`, `STRESS_AUDIT.md` |
| **Segurança** | `Seguranca/SECURITY_AUDIT_REPORT.md`, `SECURITY_MASTER_AUDIT.md` |
| **Performance** | `Performance/PERFORMANCE_AUDIT_REPORT.md` ⭐ backlog atual, `PERFORMANCE_ANALYSIS.md`, `PERF_TEST_REPORT.md`, `VALIDATION_OPTIMIZATION_REPORT.md`, `PLANO_OTIMIZACAO_VALIDACAO.md` |
| **UX** | `UX/UX_UI_AUDIT_REPORT.md` ⭐ backlog atual |
| **Infraestrutura** | `Infrastructure/CODESPACES_MIGRATION_PLAN.md`, `CODESPACES_RUNBOOK.md` |

⭐ = audits de 2026-08-05 que alimentam o backlog em `WORKSPACE.md`.

## Arquivo Morto (`archive/`)

> Histórico preservado. **Nunca usar para decisões atuais.**

| Subpasta | Conteúdo |
|----------|----------|
| `archive/governance/` | Governança v2: EXECUTION_STATE, SCRATCH_PAD, VALIDATION_MODULE, CHECKPOINT_AUDITOR, CHANGELOG_AI, EXECUTOR_PROMPT(s), IMPLEMENTATION_ORDER, ROADMAP/BACKLOG_ATUALIZADO, STATUS, MASTER_REFACTOR_PLAN |
| `archive/ci-debug/` | Depuração pontual de CI: validator_*, ci_*, lockfile_validator, CI_CD_DIAGNOSTIC_REPORT, render_build_audit, CI_ERRORS |
| `archive/audits/` | Auditorias superadas: AUDITORIA_GERAL, DOCUMENTATION_*, BRANDING_DIAGNOSTICO, AI_BRAND_SCHEMA (raiz) |
| `archive/releases/` | Releases passadas: PRODUCTION_REPORT/STATUS, INCIDENT_REPORT, FIX_REPORT, RELEASE_CHECKLIST, TEST_COVERAGE_DELIVERY, BRANDING_FIX_REPORT |
| `archive/etapas/` | IMPLEMENTACAO_ETAPA_1/2/3/5 |
| `archive/ARCHITECTURE/`, `archive/ai/`, raiz de `archive/` | Documentos do refactor/v2 e visão inicial |

──────────────────────────────────────

## Regras de Higiene (resumo do AGENTS.md §6)

1. Report novo → subpasta da área, nunca na raiz
2. Trabalho concluído sem valor decisório → `archive/`
3. Um assunto, um documento — sem duplicatas
4. Moveu/arquivou doc → atualize este índice na mesma entrega
5. Estado do projeto → só `WORKSPACE.md`; histórico → só `git log`
