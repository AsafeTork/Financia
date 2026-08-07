# DECISIONS — Registro de Decisões Arquiteturais (ADR-lite)

> Uma linha por decisão. Append-only: decisão superada recebe status `⛔ superada`
> e link para a que a substitui — **nunca é deletada** (o histórico explica o presente).
> Consulte antes de propor mudança que contrarie uma decisão **✅ ativa**.
> Para revertê-la, registre a nova decisão com a justificativa.

| ID | Data | Decisão | Motivo | Status |
|----|------|---------|--------|--------|
| D001 | 2026-07-10 | Evidência obrigatória em toda entrega (diff + validação + resumo) | Entregas declaradas sem prova geraram retrabalho | ✅ ativa |
| D002 | 2026-07-31 | RLS sempre com `(SELECT auth.uid())` | bare `auth.uid()` reavalia por linha — 19x mais lento | ✅ ativa |
| D003 | 2026-07-31 | Rate limit fail-closed em Edge Functions | fail-open permitia bypass total em erro | ✅ ativa |
| D004 | 2026-07-31 | Impersonation: JWT 5min com `act` claim (RFC 8693), token só em memória | tokens em URL hash/localStorage = account takeover | ✅ ativa |
| D005 | 2026-07-31 | Erros 500 via `safeErrorResponse` | stack traces vazavam detalhes internos | ✅ ativa |
| D006 | 2026-07-31 | Schema só muda via `supabase/migrations/` | 35 migrations não trackeadas = disaster recovery impossível | ✅ ativa |
| D007 | 2026-08-04 | CSS vars como única fonte de cor/espaçamento/motion | hex hardcoded espalhado impedia theming (Free/Pro/Premium) | ✅ ativa |
| D008 | 2026-08-04 | Motion via CSS + `useScrollReveal`; sem GSAP | não instalar deps sem justificativa; CSS cobre o necessário | ✅ ativa |
| D009 | 2026-08-05 | Vitest com pool `vmThreads` (não `threads`) | `threads` é mais lento no Node 24 — revertido em `fc79138` | ✅ ativa |
| D010 | 2026-08-05 | Playwright fora dos testes unitários | setup pesado contaminava o job de unit no CI | ✅ ativa |
| D011 | 2026-08-05 | **Git é o único sistema de checkpoint** | burocracia YAML (EXECUTION_STATE/SCRATCH_PAD/etc.) duplicava o git e divergia dele | ✅ ativa |
| D012 | 2026-08-05 | **`AGENTS.md` é o protocolo canônico** (CLAUDE.md = ponteiro) | padrão aberto agents.md; OpenCode prioriza AGENTS.md sobre CLAUDE.md | ✅ ativa |
| D013 | 2026-08-05 | **`docs/WORKSPACE.md` é a única fonte de estado** | múltiplos docs de estado (STATUS, ROADMAP, BACKLOG) contradiziam-se | ✅ ativa |
| D014 | 2026-07-10 | Arquitetura de 2 chats (Integrador/Executor) + troca de modelos | — | ⛔ superada por D011/D013 (fluxo single-agent + subagentes efêmeros) |
| D015 | 2026-07-10 | Checkpoint YAML obrigatório após cada subagente | — | ⛔ superada por D011 (git log + commits pequenos) |
| D016 | 2026-08-07 | Web Worker de sync importa a pipeline compartilhada de `src/lib/sync.js` (não duplica lógica) | worker por cópia perdeu conflito 23505/`client_mutation_id` → drift de dados entre caminhos worker e main-thread | ✅ ativa |
