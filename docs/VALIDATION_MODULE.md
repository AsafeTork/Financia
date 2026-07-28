---
type: WORKING
status: APPROVED
owner: Integrador
version: 1.1
reviewed_by: Integrador
ready_for_integration: true
last_review: 2026-07-28
dependencies: [CLAUDE.md, EXECUTION_STATE.md, SCRATCH_PAD.md, CHECKPOINT_AUDITOR.md, CHANGELOG_AI.md]
next_review: 2026-08-28
---

# VALIDATION_MODULE.md — Verificação de Checkpoint

> **Objetivo:** Validar integridade de checkpoint antes de permitir continuidade entre modelos.

---

## Módulo de Validação

### Função Principal: `validate_checkpoint(checkpoint_data)`

Retorna: `{ valid: boolean, errors: string[], warnings: string[] }`

---

## Regras de Validação

### 1. Estrutura Obrigatória

| Campo | Obrigatório | Tipo | Validação |
|-------|-------------|------|-----------|
| `execution_id` | Sim | string | Formato: `exec_YYYYMMDD_HHMMSS_NNN` |
| `task_id` | Sim | string | Formato: `task_NNN` |
| `phase` | Sim | string | Um de: F1, F2, F3, F4, F5, F6, F7 |
| `checkpoint` | Sim | string | Formato: `checkpoint_NNN` |
| `task_description` | Sim | string | Não vazio, max 500 chars |
| `model_used` | Sim | string | `deepseek` ou `nemotron` |
| `files_modified` | Sim | array | Cada item: caminho válido no projeto |
| `validations_passed` | Sim | array | Deve conter: lint, build, tests |
| `decisions_made` | Sim | object | Chave-valor, não vazio se houver decisões |
| `pending_issues` | Sim | array | Array (pode ser vazio) |
| `execution_timestamp` | Sim | string | ISO 8601: `YYYY-MM-DDTHH:MM:SSZ` |

### 2. Validação de Consistência

```python
def validate_consistency(checkpoint):
    errors = []
    
    # 2.1 Files exist
    for f in checkpoint.files_modified:
        if not filesystem.exists(f):
            errors.append(f"Arquivo modificado não existe: {f}")
    
    # 2.2 Validations passed = verdadeiro
    required_validations = ['lint', 'build', 'tests']
    for v in required_validations:
        if f"{v}: passed" not in checkpoint.validations_passed:
            errors.append(f"Validação obrigatória não passou: {v}")
    
    # 2.3 Decisions não conflitam com arquitetura
    for key, value in checkpoint.decisions_made.items():
        if conflicts_with_architecture(key, value):
            errors.append(f"Decisão conflita com arquitetura: {key}={value}")
    
    # 2.4 Checkpoint não duplicado
    if checkpoint.checkpoint in get_existing_checkpoints():
        errors.append(f"Checkpoint duplicado: {checkpoint.checkpoint}")
    
    # 2.5 Timestamp válido
    if not is_valid_iso8601(checkpoint.execution_timestamp):
        errors.append("Timestamp inválido")
    
    return errors
```

### 3. Validação de Continuidade (Modelo Reserva)

```python
def validate_continuity(current_checkpoint, scratch_pad):
    errors = []
    
    # 3.1 execution_id match
    if current_checkpoint.execution_id != scratch_pad.execution_id:
        errors.append("execution_id divergente entre EXECUTION_STATE e SCRATCH_PAD")
    
    # 3.2 task_id match
    if current_checkpoint.task_id != scratch_pad.task_id:
        errors.append("task_id divergente")
    
    # 3.3 Checkpoint concluído (não em progresso)
    if scratch_pad.subtasks_in_progress and any(s.status == 'in_progress' for s in scratch_pad.active_subagents):
        errors.append("Há subtarefas em andamento — checkpoint deve ser de tarefa CONCLUÍDA")
    
    # 3.4 Autorização do Integrador
    if not get_integrator_authorization(current_checkpoint.execution_id):
        errors.append("Integrador não autorizou continuidade do Modelo Reserva")
    
    # 3.5 Decisões imutáveis preservadas
    for d in current_checkpoint.decisions_made:
        if not is_immutable(d.key(d):
            errors.append(f"Decisão não marcada como imutável: {d}")
    
    return errors
```

---

## Checklist de Validação (Executar Antes de Continuar)

### Pré-Continuidade (Modelo Reserva)
- [ ] `execution_id` válido e existente
- [ ] `task_id` corresponde à tarefa atual
- [ ] `phase` corresponde à fase em andamento
- [ ] `checkpoint` existe no histórico
- [ ] `model_used` registrado
- [ ] `files_modified` todos existem no filesystem
- [ ] `validations_passed` inclui: `lint: passed`, `build: passed`, `tests: passed`
- [ ] `decisions_made` não conflitam com arquitetura
- [ ] `pending_issues` documentadas
- [ ] `execution_timestamp` válido (ISO 8601)
- [ ] SCRATCH_PAD.md existe e é consistente
- [ ] Integrador autorizou explicitamente
- [ ] Autorização salva no state do Modelo Reserva

### Pós-Checkpoint (Executor/Subagente)
- [ ] Checkpoint salvo em EXECUTION_STATE.md
- [ ] Backup em SCRATCH_PAD.md
- [ ] Histórico atualizado
- [ ] Decisões marcadas como imutáveis
- [ ] Log de mudanças de modelo atualizado (se aplicável)

---

## Códigos de Erro

| Código | Descrição | Ação |
|--------|-----------|------|
| E001 | execution_id inválido | Verificar formato, regenerar |
| E002 | Arquivo modificado não existe | Verificar filesystem, restaurar |
| E003 | Validação obrigatória não passou | Executar validação faltante |
| E004 | Decisão conflita com arquitetura | Revisar decisão, corrigir |
| E005 | Checkpoint duplicado | Usar novo checkpoint_id |
| E006 | Timestamp inválido | Corrigir formato ISO 8601 |
| E007 | execution_id divergente (SCRATCH_PAD) | Restaurar consistência |
| E008 | Subtarefas em andamento | Aguardar conclusão ou cancelar |
| E009 | Sem autorização do Integrador | Solicitar autorização |
| E010 | Decisão não imutável | Marcar como imutável |

---

## Integração no Workflow

```
Subagente completa tarefa
         ↓
Executor executa validações (lint, build, tests)
         ↓
Se TODAS passam:
    ↓
Atualiza EXECUTION_STATE.md com checkpoint
         ↓
Backup em SCRATCH_PAD.md
         ↓
Registra no histórico
         ↓
Continua próxima subtarefa

Se ALGUMA falha:
    ↓
Corrige problemas
    ↓
Reexecuta validações
    ↓
Se não resolver: reporta ao Integrador
```

---

## Comandos de Validação

```bash
# Validar checkpoint atual
node scripts/validate-checkpoint.js --checkpoint=checkpoint_001

# Validar continuidade para Modelo Reserva
node scripts/validate-continuity.js --execution_id=exec_20260710_173000_001

# Auditoria completa de checkpoints
node scripts/audit-checkpoints.js --full
```

---

## Responsabilidades

| Papel | Responsabilidade |
|-------|-----------------|
| Executor | Executar validações após cada subagente |
| Subagente | Garantir que deliverables passam validações |
| Integrador | Autorizar continuidade, auditar checkpoints |
| Modelo Reserva | Validar continuidade antes de assumir |