---
type: WORKING
status: APPROVED
owner: Integrador
version: 1.1
reviewed_by: Integrador
ready_for_integration: true
last_review: 2026-07-11
dependencies: [CLAUDE.md, WORKSPACE.md, EXECUTION_STATE.md, VALIDATION_MODULE.md, CHECKPOINT_AUDITOR.md, CHANGELOG_AI.md]
next_review: 2026-07-18
note_use: "Template para backup de estado entre modelos. Preenchido automaticamente antes de troca de modelo. Se vazio, significa que não houve troca de modelo desde a última reconciliação."
---

# SCRATCH_PAD.md — Backup Completo de Estado para Recuperação

> **Objetivo:** Nenhuma interrupção deve causar perda de trabalho. Estado completo preservado instantaneamente.
> **Regra:** Atualizado automaticamente ANTES de qualquer mudança de modelo ou interrupção detectada.

---

## Estado Completo no Momento do Backup

### Metadados do Backup
```yaml
backup_id: ""
execution_id: ""
backed_up_at: ""
interruption_reason: ""  # timeout | limit | cancelled | unavailable | error
model_primario: deepseek
model_reserva: nemotron
```

### Estado da Tarefa
```yaml
task_id: ""
task_description: ""
phase: ""
progress_percent: 0
subtasks_completed: []
subtasks_pending: []
subtasks_in_progress: []
```

### Subagentes no Momento do Backup
```yaml
active_subagents:
  - name: ""
    area: ""
    status: ""  # completed | in_progress | pending
    files_modified: []
    validations_done: []
    checkpoint_saved: false
```

### Arquivos Modificados (Estado do Filesystem)
```yaml
modified_files:
  - path: ""
    status: ""  # created | modified | deleted
    checkpoint_ref: ""
    validated: false
    content_hash: ""  # opcional para verificação
```

### Validações Executadas
```yaml
validations:
  lint: ""        # passed | failed | not_run
  build: ""       # passed | failed | not_run
  tests: ""       # passed | failed | not_run
  browser: ""     # passed | failed | not_run
  ux: ""          # passed | failed | not_run
  performance: "" # passed | failed | not_run
  security: ""    # passed | failed | not_run
```

### Decisões Tomadas (IMUTÁVEIS — Nunca Sobrescrever)
```yaml
decisions:
  - key: ""
    value: ""
    timestamp: ""
    autor: ""
    immutable: true
```

### Pendências e Bloqueios
```yaml
pending_issues:
  - id: ""
    description: ""
    severity: ""  # critical | high | medium | low
    blocker: true/false
    assignee: ""
```

### Contexto Adicional para Modelo Reserva
```yaml
context_notes: |
  Notas críticas para continuidade:
  - 
  - 
  -
```

---

## Checklist de Recuperação (Modelo Reserva)

> **OBRIGATÓRIO:** Confirmar TODOS antes de continuar

- [ ] EXECUTION_STATE.md lido — `execution_id` válido
- [ ] SCRATCH_PAD.md lido completamente
- [ ] Checkpoint corresponde a subtarefa **CONCLUÍDA** (não em andamento)
- [ ] `files_modified` existem e estão íntegros no filesystem
- [ ] `validations_passed` incluem: lint, build, tests
- [ ] `decisions_made` não conflitam com arquitetura atual
- [ ] `pending_issues` documentadas e compreendidas
- [ ] Integrador autorizou: "Sim, continuar do checkpoint exec_XXX"
- [ ] Autorização salva no state do Modelo Reserva (`model_reserva_authorized: true`)

---

## Log de Recuperação

| Timestamp | Modelo | Ação | Checkpoint | Status |
|-----------|--------|------|------------|--------|
| — | — | — | — | — |

---

## Instruções para Modelo Primário (Detecção de Interrupção)

Quando detectar interrupção iminente (timeout, limite, cancelamento, indisponibilidade):

1. **PARE** novos subagentes
2. **AGUARDE** subagentes atuais completarem subtarefa atual
3. **SALVE** checkpoint completo em EXECUTION_STATE.md
4. **COPIE** estado completo para SCRATCH_PAD.md (este arquivo)
5. **NOTIFIQUE** Integrador: "Modelo Primário interrompido. Modelo Reserva deve assumir do checkpoint exec_XXX"
6. **AGUARDE** autorização do Integrador para Modelo Reserva

---

## Instruções para Integrador (Durante Troca)

1. Ler EXECUTION_STATE.md + SCRATCH_PAD.md
2. Verificar consistência entre ambos
3. Confirmar checkpoint é de subtarefa **concluída**
4. Autorizar Modelo Reserva: "Sim, continuar do checkpoint exec_XXX"
5. Salvar autorização no state: `model_reserva_authorized: true`
6. Notificar Modelo Reserva

---

## Integridade do Backup

Este arquivo deve ser **idêntico** ao estado real no momento do backup.
Qualquer discrepância = falha de integridade = não continuar, reportar ao Integrador.