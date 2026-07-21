# ROADMAP ATUALIZADO — Financia (2026-07-11)

> Pós-sincronização obrigatória — estado REAL do projeto

---

## Visão Geral

```
FASE 1 ✅ VALIDADA    →    FASE 2 ✅ VALIDADA    →    FASE 4 ✅ VALIDADA
                                                                  ↓
                                               FASE 3 ⏳ PENDENTE (Branding)
                                                                  ↓
                                              FASE 5 ⏳ PENDENTE (Supabase)  +  FASE 6 ⏳ PENDENTE (QA)
                                                                  ↓
                                                            ↓
                                                    FASE 7 ⏳ BLOQUEADA (Integração)
```

---

## Cronograma Estimado

| Semana | Foco | Entregas |
|--------|------|----------|
| **Semana 1** (Dias 1-5) | **Fase 3 — Branding** | 12 itens (B-01 a B-12) |
| **Semana 2** (Dias 6-9) | **Fase 5 — Supabase/Backend** | 7 itens (S-01 a S-07) |
| **Semana 2** (Dias 8-10) | **Fase 6 — QA Implementação** | 5 itens (Q-01 a Q-05) — *paralelo com Fase 5* |
| **Semana 2** (Dia 10) | **Fase 7 — Integração** | Merge, validação final, release |

---

## Marcos (Milestones)

| Marco | Data Estimada | Critério |
|-------|---------------|----------|
| **M1: Branding Completo** | Fim Semana 1 | 12 itens B-01→B-12 ✅; lint/build/test OK |
| **M2: Backend Hardening** | Início Semana 2 | 7 itens S-01→S-07 ✅; Edge Functions deployadas; RLS hardened |
| **M3: QA Pipeline Ativo** | Meio Semana 2 | 5 itens Q-01→Q-05 ✅; Playwright + LHCI no CI; thresholds ativos |
| **M4: Release v5.2.0** | Fim Semana 2 | Todas fases validadas; `npm run lint/build/test` OK; docs atualizadas |

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Branding 299 `var` refatoração quebra testes | Média | Alto | Subagente `Branding` foca só nisso; `Frontend` valida a cada commit |
| Edge Functions deploy falha (secrets) | Baixa | Alto | Testar local com `supabase functions serve` antes de deploy |
| Playwright flakiness no CI | Média | Médio | Retry automático (3x); timeouts generosos; isolar testes |
| LHCI thresholds muito agressivos | Baixa | Médio | Iniciar com thresholds atuais; subir gradualmente |
| Conflitos de merge Fase 5 + 6 paralelas | Baixa | Alto | Branches separadas; rebase diário; PRs pequenos |

---

## Dependências Externas

| Dependência | Necessária Para | Status |
|-------------|-----------------|--------|
| `supabase secrets set GITHUB_TOKEN` | S-01 (build trigger) | ⏳ Pendente |
| Upgrade Supabase para Pro (HaveIBeenPwned) | P0-4 (segurança) | ⏳ Opcional |
| `vite-plugin-pwa` instalação | S-07 (PWA) | ⏳ Fase 5 |

---

## Definição de "Done" por Fase

### Fase 3 — Branding
- [ ] 12 itens B-01→B-12 implementados
- [ ] `npm run lint` → 0 erros, 0 warnings
- [ ] `npm run build` → OK (chunks < 200KB)
- [ ] `npm test` → 612 passed / 28 failed (640 total)
- [ ] Lighthouse Accessibility ≥ 95

### Fase 5 — Supabase/Backend
- [ ] 7 itens S-01→S-07 implementados
- [ ] Edge Functions deployadas e testadas (staging)
- [ ] RLS policies hardened (0 SECDEF executáveis por authenticated)
- [ ] Stripe checkout com AbortController testado
- [ ] PWA cleanup + vite-plugin-pwa integrado
- [ ] `supabase db pull` executado localmente

### Fase 6 — QA
- [ ] Playwright configurado + 10+ testes E2E passando
- [ ] LHCI no GitHub Actions passando thresholds
- [ ] `data-testid` em 6+ componentes complexos
- [ ] MSW mockando Supabase/Stripe no `vitest.setup.js`
- [ ] Coverage thresholds: statements 60% / branches 50% / functions 50% / lines 60%

### Fase 7 — Integração
- [ ] `git merge` sem conflitos
- [ ] `npm run lint/build/test` tudo OK
- [ ] Documentação atualizada (CHANGELOG, RELEASE_CHECKLIST)
- [ ] Tag `v5.2.0` criada
- [ ] Deploy produção validado

---

## Próximas Ações Imediatas (Integrador)

1. [ ] Promover `MASTER_REFACTOR_PLAN.md`, `EXECUTION_STATE.md`, `SCRATCH_PAD.md`, `VALIDATION_MODULE.md`, `CHECKPOINT_AUDITOR.md`, `CHANGELOG_AI.md` → **APPROVED**
2. [ ] Criar tarefa **Fase 3 — Branding** e enviar ao Executor
3. [ ] Executor cria subagentes `Frontend` + `Branding` e inicia
4. [ ] Agendar revisão de checkpoint diária (09:00)