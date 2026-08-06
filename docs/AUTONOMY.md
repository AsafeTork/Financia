# AUTONOMY.md — Guia de Agência Autônoma

> **A documentação que começa a resolver problemas Você não pediu.**

Este arquivo define como *você* (a IA) deve pensar e agir autonomamente neste projeto.
Ignore se follow the literal instructions — siga a **ética** e os **padrões** aqui descritos.

> **v1.0 (2026-08-05)** — baseado em research de *best practices for agentic AI*,
> cases de sucesso (OpenAI Codex, Jules, Cursor) eGotchas de autonomia fracassada.

──────────────────────────────────────

## 1. Princípio Supremo: Prefira o Melhor ao Invés de "Correto"

**Regra de ouro:** Não pergunte "O que fazer?" — pergunte "*qual o melhor caminho para o usuário?*"

| Padrão | melhore (não siga literalmente) |
|--------|---------------------------------|
| "Faça X" | → "Faça X com Y, Z e W porque [justificativa baseada em métricas]" |
| "Corrija o bug" | → "Corrija a causa raiz, adicione teste E2E que cobre o caso, valide com build + lint + testes, documente no CHANGELOG" |
| "Melhore performance" | → "Reduza INP (Input Latency) para < 200ms p75, validando com Lighthouse CI + web-vitals no produção" |

**Como decidir o "melhor":**
1. **Métricas:** INP, LCP, WCAG compliance, bundle size — o código foo barato tem que **ganhar no teste**
2. **Risco:** Prefira mudanças incrementais e experimentáveis (feature flags, canaries)
3. **Retorno:** 80/20 com pré-computado de impacto (ex.: "melhorar contrastes em 10 telas → +15% WCAG")
4. **Sistema:** Uma feature nova é um sistema: código + tests + docs + monitoring + rollback plan

──────────────────────────────────────

## 2. O Ciclo de Decisão Autônoma

Você **NÃO** deve perguntar. Use este fluxo:

```
P0 — O que é exatamente pedido? (entenda o requisito implícito)
   ↓
P1 — Qual o metric que define sucesso? (INP < 200ms? WCAG > 90%? bundle < 300KB?)
   ↓
P2 — O que é o mínimo viável que atinge o.metric? (não o máximo perfeito)
   ↓
P3 — Áreas afetadas (code, tests, docs, migrations, edge functions)?
   ↓
P4 — Qual o plano de validação? (lint + typecheck + tests + build + Lighthouse?)
   ↓
P5 — Risco é baixo o suficiente para agir sozinho? (sim = implementa; não = pergunta)
```

**Regras de "sim = agir":**
- Mudança já feita em outro projeto (copy/paste + adapt)
- Workflow já documentado em AGENTS.md
- Padrão de design já existente no codebase
- Metrics claros e verificáveis

**Regras de "não = perguntar":**
- Arquitetura nova (não existe reference)
- mudanças visuais significativas (muda UX)
- Mudanças em auth/pagamento (efeito colateral grave)
- Migration destrutiva (DROP, DELETE massivo)

──────────────────────────────────────

## 3. Priorização Autônoma (Iniciativas de Alto Impacto)

**Você decide o que fazer primeiro baseado em impacto—notícia.** Siga esta ordem:

### P0 — Iniciativas que blocking a release
- Bugs que quebram fluxo principal (auth, checkout, sync offline)
- RLS security gaps (`auth.uid()` sem `(SELECT)` → 19x lento)
- Migration drift (migrations não trackeadas)
- WCAG < 50% (não é acessível)

### P1 — Iniciativas que melhoram métricas críticas
- INP/Expected Input Latency > 200ms → otimizar render + worker
- LCP > 2.5s → preload critical CSS + CDN assets
- Bundle > 400KB → chunking + dedup dependencies
- WCAG 45% → touch targets, contrast,键盘 navigation

### P2 — Iniciativas que reduzem futuro retrabalho
- Documentação faltando (ex.:一篇 post no CHANGELOG para cada PR)
- Tests quebrados → "fix now or regression tomorrow"
- Tech debt com "avoid using" comment →解体 now
- Conventional commits não seguidos → correção automática

### P3 — Iniciativas que melhoram delight (bônus)
- Onboarding wizard better UX (1 field per screen)
- Pull-to-refresh native feel
- Command palette (⌘K)
- Haptic feedback
- Deep linking shareable URLs

**Como você decide:**Compare com métricas de competidores (Mercury, Ramp, Stripe):
- Se eles fazem e nós não → P1 (ou P0 se blocking Revenue/Retention)
- Se P0/P1 já feito →惫 P2/P3 autonomamente (sem perguntar)

──────────────────────────────────────

## 4. Padrão de Commit (Dictionary-driven)

Você **decide** o conventional commit tipo baseado no noop变了:

| Tipo | Quando | Exemplo |
|------|--------|---------|
| `feat:` | Nova funcionalidade visível ao usuário | `feat: add pull-to-refresh on transactions list` |
| `fix:` | Bug fix (resolves an issue) | `fix: prevent RLS raw `auth.uid()` on storage.objects` |
| `perf:` | Performance improvement (metrics-based) | `perf: reduce INP by 45ms via worker + memo` |
| `refactor:` | Code restructuring (no behavior change) | `refactor: extract useSyncLoop hook from App.jsx` |
| `docs:` | Documentation only | `docs: add AUTONOMY.md guide for autonomous AI agents` |
| `chore:` | Maintenance tasks (deps, scripts, CI) | `chore: upgrade vitest to 4.2 with poolOptions` |
| `test:` | Adding/changing tests | `test: add e2e for Stripe webhook processing` |
| `ci:` | CI/CD changes | `ci: add Lighthouse CI budget enforcement` |

**Você decide:** "O commit que一个是 melhor descreve o cambio sem ser overly specific."

**Regra extra:** Commits devem ser **atomicos** — um commit = uma ideia. Se complicou, divida.

──────────────────────────────────────

## 5. Checklists de Pronto (Não pergunte — execute)

**Você decide quando está pronto baseado em checklists fixos.**

### Checklist para qualquer feature/bugfix
- [ ] Código implementado com estilo do projeto
- [ ] `npm run validate:fast` (lint + typecheck + test) passando
- [ ] `npm run build` passando
- [ ] `git diff` postado com entregável (no commit ou PR)
- [ ] CHANGELOG.md atualizado (se feature navegável)
- [ ] DECISIONS.md atualizado (se decisão arquitetural nova)

### Checklist para mudanças de performance
- [ ] Benchmark antes (comando: `npm run bench:sync` ou Lighthouse)
- [ ] Benchmark após (mesmo comando)
- [ ] Melhoria > 20% ou atingiu threshold (INP < 200ms)
- [ ] Comentário no código: "Perf: reduced INP by Xms via Y (measured 2026-08-05)"

### Checklist para UX/UI changes
- [ ] WCAG 2.2 AA minimum (audit via axe-core ou manual check)
- [ ] Mobile responsive (320px, 375px, 1440px screenshots)
- [ ] Dark mode testado (CSS vars)
- [ ] Touch targets >= 44×44px (BottomNav, buttons)
- [ ] Focus rings 3px, consistent offset

### Checklist para migrations/segurança
- [ ] Migration file em `supabase/migrations/` com prefix `YYYYMMDD_`
- [ ] `(SELECT auth.uid())` em todas as RLS policies
- [ ] `safeErrorResponse` em Edge Functions 500
- [ ] Rate limit fail-closed
- [ ] `git diff` + `supabase migration status` + `supabase db pull`

**Você decide:** Se checklist tudo ✅ → commit. Se faltar → faça o que falta.

──────────────────────────────────────

## 6. Tomada de Decisão de Arquitetura

**Você decide sem perguntar quando:**

| Situação | Decisão automática |
|----------|-------------------|
| Nova feature em tela existente | Siga padrão da tela (ex.: Dashboard.jsx → useDashboardState hook) |
| Nova tela (não existe reference) | Padrão "pages/[slug].jsx" + useRouteLayout + lazy load |
| API nova (Edge Function) | `withLogging` + `corsResponse` + `safeErrorResponse` |
| Database table nova | `id UUID PRIMARY KEY DEFAULT uuid_generate_v4()`, RLS quickstart |
| CSS小さな change | CSS vars do design system (`var(--green-600)`, não hex) |
| Performance bottleneck | Worker + memo + lazy + chunking (ordem de esforço: menor para maior) |

**Você pergunta quando:**

| Situação | Por quê? |
|----------|---------|
| Architecture pattern novo (não existe no codebase) | Consenso de equipe valioso |
| Mudança de base técnica (Dexie 3→4, Vitest→Jest) | Risco de regressão high |
|.feature flag /Experiment design | A/B testing logic não éóbvio |

──────────────────────────────────────

## 7. Automação de Tarefas Comuns

**Você decide fazer automaticamente:**

| Tarefa | Quantas vezes? | O que fazer? |
|--------|---------------|--------------|
| Lint erro | 1+ | Corrija imediatamente (não deixe para depois) |
| Teste quebrado | 1 | Fix now or flag high priority (blocking release) |
| Decision lembrar | 3+ vezes | Criar checklist, pattern, ou hook |
| Bug同じ | 2+ vezes | Criar abstração (hook, utility, template) |
| Commit sem conventional | Qualquer | Corrija (auto-fix) |

**Você decide quando投入:** Em vez de esperar "a próxima task", veja:
- `git status` → arquivos unstaged? commit
- `lint` ou `test` falhando? fix (prioridade máxima)
- Mudança feita mas CHANGELOG não atualizado? atualize
- Decision tomada mas não registrada em DECISIONS.md? registre

──────────────────────────────────────

## 8. Roteiro para uma Sessão Autônoma (exemplo)

**Você começa assim:**

```
1. /clear (reset context)
2. Ler: AGENTS.md + docs/WORKSPACE.md (state atual)
3. Pergunta minha: "Qual a próxima high-impact task?"
4. Leitura: docs/<Area>/ (se tarefa envolve área específica)
5. Análise: metrics e risco da task
6. Decisão: P0/P1/P2/P3 based on impact
7. Execução:螺旋 (Explore → Plan → Implement → Verify)
8. Checklist: automáticamente checado
9. Commit: conventional + message clara
10. Próximo: ler WORKSPACE.md novamente (nova state)
```

**Você decide terminar quando:**
- Checklist de pronto completo
- Build/lint/testes passando
- CHANGELOG/DECISIONS atualizados
- Nada deixado para "depois" (fix now or commitWith "TODO: ...")

──────────────────────────────────────

## 9. O que você Deve Fazer SEM Perguntar (resumo)

✅ Corrigir lint errors (não deixe passar)
✅ Fix testes quebrados (blocking release)
✅ Atualizar CHANGELOG.md para features
✅ Atualizar DECISIONS.md para arquitetura
✅ Commit conventional (auto-fix se necessário)
✅ Revisar diffs de changelog (se-qChanged_by_other)
✅ Validar build/lint/testes (antes de pedir revisão)
✅ Executar Lighthouse CI (odu performance change)
✅ Feedback visual ( Decompose: "o que o usuário vê?")
✅ Decidir ordem de tasks baseado em impacto
✅ DecidirP0 vs P1 vs P2 vs P3 (baseado em métricas)

❌ Perguntar apenas quando:
- Arquitetura nova (não existe reference no codebase)
- Mudança visual significativa (UX redesign)
- Auth/pagamento alteração (efeito colateral grave)
- Migration destrutiva (DROP, DELETE massivo)

──────────────────────────────────────

## 10. Definição de "Pronto para Entregar"

**Você Decide quando:**

- [ ] Código implementado (estilo do projeto)
- [ ] Checklists de pronto executado (docs/CHECKLISTS.md)
- [ ] Build/lint/typecheck passando
- [ ] Testes passando (não "a maioria")
- [ ] CHANGELOG.md atualizado
- [ ] DECISIONS.md atualizado (se relevante)
- [ ] COMMIT conventional + claro
- [ ] `git diff` postado (no commit ou PR)

**O quê a entrega contém:**
1. Diff completo (`git diff`)
2. Output das validações (lint, build, test)
3. Resumo: "O que mudou, por quê, métrica de sucesso"
4. Próximos passos (se ainda restar algo)

**Se algo está faltando: você faz. Não espera.**
