# AGENT GUIDE — Manual Operacional do Agente

> Como executar tarefas neste repositório. Complemento de `../AGENTS.md` (regras supremas).
> Baseado em: Anthropic Claude Code Best Practices, agents.md, OpenCode Rules (2026).

──────────────────────────────────────

## 1. Início de Sessão

1. `AGENTS.md` — regras obrigatórias (carregado automaticamente)
2. `docs/WORKSPACE.md` — estado real e backlog priorizado
3. Relatório da área em `docs/<Área>/` (se a tarefa tocar aquela área)
4. `docs/DECISIONS.md` — se a tarefa puder contrariar uma decisão arquitetural
5. Código real envolvido — **nunca assuma comportamento sem ler o arquivo**

──────────────────────────────────────

## 2. O Princípio Central: Verificação Executável

> "Give the agent a check it can run. It's the difference between a session you
> watch and one you walk away from." — Anthropic

Toda tarefa precisa de um **sinal passa/falha** que o próprio agente executa:

| Tipo de tarefa | Verificação |
|----------------|-------------|
| Código | `npm run validate:fast` ou `validate:full` (§5) |
| Bug | teste que reproduz o bug → passa após o fix |
| UI | build + comparação visual em https://financiabr.me |
| Docs | consistência interna + links/referências válidas |

Sem verificação definida, "parece pronto" é o único sinal — e ele mente.
**Corrija a causa raiz, nunca suprima o erro** (sem `|| true`, sem silenciar lint).

──────────────────────────────────────

## 3. Fluxo por Tamanho de Tarefa

### Simples (1 arquivo, escopo óbvio, diff descrevível em 1 frase)
Faça direto. Valide. Entregue com evidências. Não planeje em excesso.

### Composta (cruza áreas, > 3 arquivos, ou abordagem incerta)
```
EXPLORAR    → leia código/docs envolvidos (subagente se a leitura for pesada)
PLANEJAR    → subtarefas objetivas; em dúvida, escreva o plano antes de codar
IMPLEMENTAR → subagentes por área, em paralelo quando independentes
VERIFICAR   → validação completa + revisão (§4.3)
ENTREGAR    → evidências (§6)
```

### Bug fix
Reproduza/localize a **causa raiz** → corrija a causa (não o sintoma) → garanta
teste que cobre o caso.

──────────────────────────────────────

## 4. Subagentes e Contexto

O contexto da sessão é o recurso mais escasso. Performance degrada quando ele enche.

### 4.1 Quando delegar
- **Investigação pesada** (ler muitos arquivos para responder uma pergunta) →
  subagente explora e retorna só o resumo
- **Área especializada** → subagente com prompt focado
- **Trabalho paralelo independente** → múltiplos subagentes simultâneos

### 4.2 Regras
- Um subagente = uma área. Nunca dois editando os mesmos arquivos.
- Prompt autossuficiente: objetivo, arquivos, restrições, formato do retorno.
- Retorno = artefato pronto + relatório curto (o quê mudou, como validar).

| Área | Entregável típico |
|------|-------------------|
| Frontend | React, UX, acessibilidade, testes de componente |
| Backend | Edge Functions, APIs, integrações (Stripe, Supabase) |
| Database | migrations, SQL, índices, RLS, triggers |
| QA | testes E2E/unit, regressão, stress |
| Security | revisão de diff, análise de risco, permissões |
| Performance | bundle, Lighthouse, profiling, Web Vitals |

### 4.3 Revisão adversarial (mudanças críticas: auth, pagamento, RLS, migrations)
Após implementar, lance um subagente **em contexto fresco** para revisar o diff
contra os requisitos: "Revise este diff contra o pedido X. Reporte apenas gaps de
correção ou requisitos não atendidos — não preferências de estilo."
Quem revisa nunca é quem implementou. Mudanças pequenas/isoladas: auto-revisão basta.

### 4.4 Higiene de contexto
- Uma sessão = um assunto. Tarefa nova não relacionada → nova sessão.
- Corrigiu o agente 2x no mesmo problema e ele continua errando → pare, escreva
  um prompt melhor com o que aprendeu, recomece com contexto limpo.

──────────────────────────────────────

## 5. Validação

Node.js v22+ está disponível localmente. Use-o.

| Escopo da mudança | Comando |
|-------------------|---------|
| Só docs/markdown | nenhum |
| Código isolado | `npm run validate:fast` |
| Mudança ampla / config / deps / CI | `npm run validate:full` |
| Comportamento E2E | CI (GitHub Actions) + https://financiabr.me |

Falha pré-existente não relacionada que bloqueia: documente na entrega e siga.

──────────────────────────────────────

## 6. Entrega: Evidências Obrigatórias

1. `git status` / `git diff --stat` — arquivos alterados
2. Saída da validação (§5) — verde
3. Resumo: o que mudou, por quê, o que falta (se algo)

Sem isso, a tarefa **não está concluída**.

──────────────────────────────────────

## 7. Commits e Registro

- **Conventional Commits**: `feat:`, `fix:`, `perf:`, `refactor:`, `docs:`, `chore:`, `test:`, `ci:`
- Commits pequenos e frequentes — o `git log` é o histórico oficial
- **Não commite** sem o usuário pedir (exceto tarefa explícita de commit)
- Mudou estado/backlog → atualize `docs/WORKSPACE.md` §2/§3
- Decisão arquitetural nova → registre em `docs/DECISIONS.md`
- **Nunca** crie arquivos de log/checkpoint de agente — git já faz isso

──────────────────────────────────────

## 8. Quando Parar e Perguntar

Só interrompa o fluxo para:
- Conflito entre documentos oficiais (cite os dois, com datas)
- Risco de perda de dados ou migration destrutiva não coberta
- Impossibilidade técnica comprovada (mostre o erro)
- Risco crítico de segurança descoberto no meio do trabalho
- Dependência nova (apresente justificativa: o que resolve, tamanho, alternativas)

Todo o resto — build quebrado, teste falhando, dúvida de implementação — é seu para resolver.

──────────────────────────────────────

## 9. Guia Rápido para Quem Pede (humano)

Bons pedidos economizam correções. Inclua:

| Em vez de | Prefira |
|-----------|---------|
| "melhore o dashboard" | "implemente o layout do print anexo; valide com build + screenshot" |
| "corrija o bug do login" | "login falha após timeout de sessão; veja src/features/auth/; escreva teste que reproduz, depois corrija" |
| "adicione testes" | "teste o caso de usuário deslogado em foo.js, sem mocks" |
| "investigue X" (sem escopo) | "investigue X em src/lib/ e retorne resumo em 10 linhas" |

Referencie arquivos, aponte padrões existentes a seguir, defina o critério de pronto.

──────────────────────────────────────

## 10. Armadilhas Conhecidas (aprendidas do histórico)

- **RLS**: sempre `(SELECT auth.uid())` — bare call é 19x mais lento
- **Rate limit**: `enforceRateLimit` é fail-closed; não reverter para fail-open
- **Impersonation**: tokens só em memória (JWT 5min, RFC 8693) — nunca URL/localStorage
- **Erros 500**: `safeErrorResponse` — nunca vazar stack trace
- **Migrations**: só via arquivos em `supabase/migrations/` — nunca só no dashboard
- **CSS**: cores/espaçamento/motion vêm de CSS vars — nunca hardcode hex
- **CI_REPORT.md**: gerado pelo CI — nunca editar manualmente
- Regras completas de Edge Functions: `../supabase/AGENTS.md`
