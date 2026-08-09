# AGENTS.md — Financia

Protocolo canônico para agentes de AI neste repositório (padrão [agents.md](https://agents.md)).
`CLAUDE.md` é apenas um ponteiro para este arquivo. Em conflito com qualquer outro
documento: **AGENTS.md prevalece**.

> v3.1 (2026-08-05) — Reescrito seguindo agents.md, Anthropic Claude Code Best Practices
> e OpenCode Rules. Governança v2 arquivada em `docs/archive/governance/`.

──────────────────────────────────────

## 1. Comandos de Verificação

Node.js v22+ está disponível localmente. **Sempre valide antes de entregar.**

| Escopo da mudança | Comando |
|-------------------|---------|
| Só docs/markdown | nenhum |
| Código isolado | `npm run validate:fast` (lint+typecheck+test só dos alterados) |
| Mudança ampla / config / deps / CI | `npm run validate:full` (lint + typecheck + test + build) |
| Gate final | CI: `.github/workflows/ci.yml` (13 jobs) + https://financiabr.me |

Se a validação falhar: corrija e rode de novo. Nunca entregue vermelho.

──────────────────────────────────────

## 2. Regras Supremas

1. **Nada é "concluído" sem evidência.** Entrega = `git diff` + validação executada +
   resumo do que mudou e por quê. Sem evidência, não existe.
2. **Git é o sistema de checkpoint — autonomia total.** Commits pequenos, Conventional Commits
   (`feat:`, `fix:`, `perf:`, `docs:`, `chore:`...). O histórico é o `git log` —
   não crie arquivos paralelos de log/checkpoint. Commit, push, issues e PRs são executados
   SEM consulta prévia (ver §3 "Autonomia").
3. **`docs/WORKSPACE.md` é a fonte única de estado.** Leia no início de toda sessão.
   Atualize ao concluir (seções "Estado Atual" e "Backlog").
4. **Nenhum problema é pesquisado duas vezes.** Antes de auditar, verifique o relatório
   da área em `docs/<Área>/`. Só refaça com evidência objetiva de desatualização.
5. **Mudanças mínimas.** Resolva o pedido sem refatorar o que não foi pedido.
   Siga o estilo existente. Não crie docs novos sem necessidade.
6. **Decisões arquiteturais** são registradas em `docs/DECISIONS.md` — consulte antes
   de propor mudança que contrarie uma decisão registrada.

──────────────────────────────────────

## 3. Fluxo de Trabalho

```
1. LER        → AGENTS.md + docs/WORKSPACE.md (+ relatório da área em docs/<Área>/)
2. LOCALIZAR  → Ler o código real envolvido (Read/Grep/Glob) — nunca assumir
3. PLANEJAR   → Tarefa multi-etapa: decompor em subtarefas objetivas
4. DELEGAR    → Subagentes efêmeros por área quando cruzar domínios (ver §4)
5. IMPLEMENTAR→ Mudanças mínimas, estilo do projeto
6. VALIDAR    → Conforme §1. Corrigir e revalidar até verde
7. REGISTRAR  → docs/WORKSPACE.md se estado/backlog mudou
8. ENTREGAR   → Evidências: diff + validações + resumo
```

**Autonomia:** o backlog priorizado está em `docs/WORKSPACE.md` — não pergunte "o que
faço agora?". Só interrompa para: conflito entre documentos, risco de perda de dados,
impossibilidade técnica comprovada, ou risco crítico de segurança.

**GitHub é nativo ao fluxo (gh CLI):**
- Commit + push: a cada passo concluído e validado, sem consultar (§2.2). Nunca deixe
  trabalho validado preso no working tree.
- Issues: crie para bugs/enhancements descobertos durante o trabalho (com repro/contexto
  do código real), feche as resolvidas com referência ao commit/PR.
- PRs: para mudanças que mereçam review/CI antes de entrar na main, abra PR com descrição
  objetiva e acompanhe os checks (`gh pr checks`). Atualize se o CI falhar.
- Padrão: commit direto na `main` para mudanças pequenas/isoladas; PR para mudanças
  amplas ou que cruzam domínios (backend+front, migrations, RLS).
- Acompanhamento de CI: use `gh run watch <run-id>` (modo watch — bloqueia até concluir).
  **Nunca `sleep` para esperar CI.** Obtenha o run-id com `gh run list --branch main
  --limit 1` e monitore com `gh run watch`. Se falhar, investigue com
  `gh run view <run-id> --log-failed`.

──────────────────────────────────────

## 4. Subagentes (efêmeros, sob demanda)

- **Responsabilidade única** por subagente; nunca dois editando a mesma área.
- **Prompt autossuficiente**: o subagente não herda seu contexto — inclua tarefa,
  arquivos, restrições e formato de retorno esperado.
- **Entregável, não consultoria**: retorna artefato pronto + relatório curto.
- **Investigação pesada** (ler muitos arquivos) → subagente, para não poluir o
  contexto principal.
- **Revisão adversarial** para mudanças críticas (auth, pagamento, RLS, migrations):
  um subagente em contexto fresco revisa o diff contra os requisitos. Mudanças
  pequenas e isoladas: auto-revisão basta.
- Subagentes independentes rodam **em paralelo**.

──────────────────────────────────────

## 5. Estilo de Código (o não-óbvio)

- **Cores/espaçamento/motion**: sempre CSS vars do design system (`src/index.css`) —
  nunca hex hardcoded. Fonte visual oficial: `VISUAL_IDENTITY.md`.
- **Offline-first**: Dexie (IndexedDB) é a fonte local; sync com Supabase via
  `src/lib/sync.js`. Não quebre o fluxo offline.
- **UI em pt-BR**; código e comentários em inglês ou pt-BR conforme o arquivo existente.
- **RLS**: sempre `(SELECT auth.uid())` — bare `auth.uid()` é 19x mais lento.
- Detalhes de Edge Functions/migrations: `supabase/AGENTS.md` (lido automaticamente
  ao editar arquivos lá).

──────────────────────────────────────

## 6. Autonomia do Agente

Este projeto adota o padrão [AGENTS.md](https://agents.md) com camada de enforcement:

| Mecanismo | O que faz | Onde |
|-----------|-----------|------|
| `AUTONOMY.md` | Guia de decisão autônoma — o agente decide P0/P1/P2/P3 sem perguntar | `docs/AUTONOMY.md` |
| `DECISIONS.md` | Registro de decisões arquiteturais — evita re-litigar escolhas | `docs/DECISIONS.md` |
| `TEMPLATES/` | Templates padronizados para commits, bugs, features, reports | `docs/TEMPLATES/` |
| `BEST_PRACTICES/` | Patterns de código, UX, performance, segurança específicos do projeto | `docs/BEST_PRACTICES/` |
| Pre-commit hook | Bloqueia commit se `npm run validate:fast` falhar | `.git/hooks/pre-commit` |
| Anti-pattern detection | Bloqueia padrões conhecidos no pre-commit (auth.uid() bare, hex hardcoded, etc.) | `scripts/anti-pattern-check.cjs` |
| Docs drift detection | Avisa quando código muda mas docs não são atualizados | `scripts/docs-drift-check.cjs` |
| Docs health check | CI verifica consistência de documentação | `scripts/docs-health-check.cjs` |
| `.claude/settings.json` | Auto-allow comandos seguros (npm, git) | `.claude/settings.json` |

**Princípio:** A documentação não é apenas informativa — ela é **executável**. O agente segue checklists, valida com métricas, e nunca entrega sem evidência.

──────────────────────────────────────

## 6. Documentação

```
AGENTS.md               ← este arquivo (regras — canônico)
CLAUDE.md               ← ponteiro para AGENTS.md
README.md               ← visão humana do projeto
VISUAL_IDENTITY.md      ← fonte oficial de identidade visual
CI_REPORT.md            ← gerado pelo CI (nunca editar à mão)
docs/
  WORKSPACE.md          ← estado vivo + backlog priorizado
  AGENT_GUIDE.md        ← manual operacional detalhado
  DECISIONS.md          ← registro de decisões arquiteturais (ADR-lite)
  INDEX.md              ← mapa de navegação
  ARCHITECTURE.md · CI_CD.md · DEPLOY_SECRETS.md · CHANGELOG.md
  <Área>/               ← reports: Backend, Banco, Frontend, QA, Seguranca,
                          Performance, UX, Infrastructure, ai
  archive/              ← histórico morto (nunca usar para decisões)
```

Regras:
- Report novo → subpasta da área, nunca na raiz do projeto.
- Trabalho concluído sem valor decisório → `docs/archive/`.
- Um assunto, um documento. Sem duplicatas.
- Moveu/arquivou doc → atualize `docs/INDEX.md` na mesma entrega.

──────────────────────────────────────

## 7. Proibido

- Declarar "concluído" sem evidências (§2.1)
- Criar arquivos de log/checkpoint paralelos ao git
- Re-auditar o que já tem relatório atualizado na área (§2.4)
- Responder só com planejamento quando o pedido é implementação
- Commitar segredos, `.env` ou chaves de API
- `git push --force`, `git reset --hard` ou rebase sem pedido explícito
- Editar `CI_REPORT.md` manualmente

──────────────────────────────────────

## 8. Definição de Pronto

- [ ] Implementado com mudanças mínimas e estilo do projeto
- [ ] Validação do escopo executada e verde (§1)
- [ ] Sem regressões nos testes existentes
- [ ] `docs/WORKSPACE.md` atualizado se estado/backlog mudou
- [ ] Evidências apresentadas: diff + validações + resumo
- [ ] Commitado + pushed (main ou PR) conforme §3 "GitHub é nativo ao fluxo"
