---
type: WORKING
status: APPROVED
owner: Integrador
version: 1.1
reviewed_by: Integrador
ready_for_integration: true
last_review: 2026-07-28
dependencies:
  - EXECUTION_STATE.md
  - SCRATCH_PAD.md
  - VALIDATION_MODULE.md
next_review: 2026-08-28
---

# CHECKPOINT_AUDITOR.md — Auditoria Completa de Checkpoints

> **Objetivo:** Verificar integridade, consistência e completude de todos os checkpoints de execução.

---

## Módulo de Auditoria

### Função Principal: `audit_checkpoints(execution_id)`

Retorna: `{ valid: boolean, issues: string[], warnings: string[], summary: object }`

---

## Regras de Auditoria

### 1. Integridade Estrutural

| Verificação | Critério | Código Erro |
|-------------|----------|-------------|
| Campos obrigatórios presentes | `execution_id`, `task_id`, `phase`, `checkpoint`, `task_description`, `model_used`, `files_modified`, `validations_passed`, `decisions_made`, `pending_issues`, `execution_timestamp` | A001 |
| `execution_id` formato válido | `exec_YYYYMMDD_HHMMSS_NNN` | A002 |
| `task_id` formato válido | `task_NNN` | A003 |
| `phase` válido | F1, F2, F3, F4, F5, F6, F7 | A004 |
| `checkpoint` formato válido | `checkpoint_NNN` | A005 |
| `model_used` válido | `deepseek` ou `nemotron` | A006 |
| `execution_timestamp` ISO 8601 | `YYYY-MM-DDTHH:MM:SSZ` | A007 |

### 2. Consistência de Dados

| Verificação | Critério | Código Erro |
|-------------|----------|-------------|
| Arquivos modificados existem | `files_modified[]` existem no filesystem | B001 |
| Validações passaram de verdade | `validations_passed` contém `lint: passed`, `build: passed`, `tests: passed` | B002 |
| Decisões marcadas imutáveis | `decisions_made[key].immutable === true` | B003 |
| Checkpoint não duplicado | `checkpoint` único no histórico | B004 |
| `model_used` corresponde ao modelo ativo | Cross-ref com log de modelo | B005 |

### 3. Continuidade entre Checkpoints

| Verificação | Critério | Código Erro |
|-------------|----------|-------------|
| Sequência lógica | `checkpoint_NNN` sequencial | C001 |
| `task_id` consistente | Mesmo `task_id` para fase | C002 |
| `phase` consistente | Mesmo `phase` para sequência | C003 |
| `model_used` transição válida | `deepseek` → `nemotron` apenas com autorização | C004 |

### 4. Validação de Continuidade (Modelo Reserva)

| Verificação | Critério | Código Erro |
|-------------|----------|-------------|
| `execution_id` match | `EXECUTION_STATE.execution_id === SCRATCH_PAD.execution_id` | D001 |
| `task_id` match | `EXECUTION_STATE.task_id === SCRATCH_PAD.task_id` | D002 |
| Checkpoint concluído | `SCRATCH_PAD.subtasks_in_progress` vazio | D003 |
| Autorização Integrador | `SCRATCH_PAD.model_reserva_authorized === true` | D005 |
| Autorização salva no state | `model_reserva_authorized: true` no state | D006 |

---

## Checklist de Auditoria (Executar Antes de Validar)

### Pré-Auditoria (Integrador)
- [ ] `execution_id` válido e existente
- [ ] `execution_id` corresponde em EXECUTION_STATE + SCRATCH_PAD
- [ ] `checkpoint` corresponde a subtarefa **CONCLUÍDA** (não em andamento)
- [ ] `files_modified` todos existem e têm diff válido
- [ ] `validations_passed` inclui: `lint: passed`, `build: passed`, `tests: passed`
- [ ] `decisions_made` todas marcadas `immutable: true`
- [ ] `pending_issues` documentadas (pode ser vazio)
- [ ] `execution_timestamp` formato ISO 8601 válido

### Pós-Auditoria (Integrador)
- [ ] Sem erros críticos (A001-A007, B001-B005, C001-C004)
- [ ] Avisos (warnings) documentados se houver
- [ ] Autorização do Integrador registrada (`model_reserva_authorized: true`)
- [ ] Log de mudança de modelo atualizado (se aplicável)
- [ ] Checkpoint adicionado ao histórico em EXECUTION_STATE

---

## Códigos de Erro de Auditoria

| Código | Severidade | Descrição | Ação |
|--------|------------|-----------|------|
| A001 | Crítico | Campo obrigatório ausente | Rejeitar checkpoint |
| A002 | Crítico | execution_id formato inválido | Corrigir formato |
| A003 | Crítico | task_id formato inválido | Corrigir formato |
| A004 | Crítico | phase inválido | Corrigir phase |
| A005 | Crítico | checkpoint formato inválido | Corrigir checkpoint |
| A006 | Crítico | model_used inválido | Corrigir modelo |
| A007 | Crítico | timestamp inválido | Corrigir timestamp |
| B001 | Crítico | Arquivo modificado não existe | Verificar filesystem |
| B002 | Crítico | Validação não passou | Reexecutar validação |
| B003 | Crítico | Decisão não imutável | Marcar imutável |
| B004 | Crítico | Checkpoint duplicado | Remover duplicata |
| B005 | Alto | Modelo divergente | Corrigir state |
| C001 | Alto | Checkpoint fora de sequência | Reordenar |
| C002 | Alto | task_id inconsistente | Corrigir task_id |
| C003 | Alto | phase inconsistente | Corrigir phase |
| C004 | Crítico | Transição modelo sem autorização | Requer autorização |
| D001 | Crítico | execution_id divergente | Restaurar consistência |
| D002 | Crítico | task_id divergente | Restaurar consistência |
| D003 | Crítico | Subtarefas em andamento | Aguardar conclusão |
| D004 | Alto | Sem autorização Integrador | Solicitar autorização |
| D005 | Crítico | Autorização não salva no state | Salvar autorização |

---

## Comando de Auditoria

```bash
# Auditoria completa de checkpoints
node scripts/audit-checkpoints.js --execution_id=exec_20260710_173000_001 --full

# Auditoria rápida (apenas estrutura)
node scripts/audit-checkpoints.js --execution_id=exec_20260710_173000_001 --quick

# Auditoria de continuidade entre modelos
node scripts/audit-continuity.js --execution_id=exec_20260710_173000_001
```

---

## Responsabilidades

| Papel | Responsabilidade |
|-------|-----------------|
| Integrador | Executar auditoria antes de promover checkpoint; autorizar Modelo Reserva |
| Executor | Garantir checkpoints válidos antes de registrar; manter SCRATCH_PAD sincronizado |
| Modelo Reserva | Validar continuidade antes de assumir; ler auditoria prévia |
| Subagente QA | Auditar checkpoints como parte de revisão cruzada |

---

## Checklist de Auditoria (Executar Antes de Promover)

- [ ] Estrutura válida (A001-A007)
- [ ] Dados consistentes (B001-B005)
- [ ] Continuidade válida (C001-C004)
- [ ] Modelo Reserva autorizado (D001-D005)
- [ ] Sem erros críticos
- [ ] Avisos documentados
- [ ] Autorização Integrador registrada
- [ ] Histórico atualizado

---

*Este documento deve ser auditado a cada promoção de fase e a cada troca de modelo.*